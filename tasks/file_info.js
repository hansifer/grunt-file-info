/*
 * grunt-file-info
 * https://github.com/hansifer/grunt-file-info
 *
 * Copyright (c) 2013 Hans Meyer
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  // TODO: add support for optional 'find' option to allow specification of regexp of text to replace. In the absence of 'find' option, use 'text' to generate this regexp. In 'text' value, use '<%= pass(n) %>' to specify passthru values, where n is the index of a capturing group from the 'field' (regexp) value.
  grunt.registerMultiTask('file_info', 'Display file info and optionally write it to a file (eg, for self-documenting src file sizes).', function() {
    var fileContents;
    var that = this;
    var i;

    if (this.data.original) {
      fileContents = grunt.file.read(this.data.original);
      this.data.orig_size_str = size_string(fileContents.length, 8);
    }

    if (this.data.gzipped) {
      if (this.data.gzipped !== this.data.original) {
        fileContents = grunt.file.read(this.data.gzipped);
      }
      this.data.gzip_size_str = size_string(fileContents ? require('zlib-browserify').gzipSync(fileContents).length : 0, 8);
    }

    if (this.data.minified) {
      if ((this.data.gzipped && this.data.minified !== this.data.gzipped) || (!this.data.gzipped && (this.data.minified !== this.data.original))) {
        fileContents = grunt.file.read(this.data.minified);
      }
      this.data.mini_size_str = size_string(fileContents.length, 8);
    }

    var impacts = {}; // for values that either increased or decreased, add a property where name is fieldIndex and value is bytes delta (positive if up, negative if down)
    if (this.options().update_file && this.options().update_file.file && this.options().update_file.text) {
      var origPass;
      if ('pass' in grunt.template) {
        origPass = grunt.template.pass;
      }

      grunt.template.pass = function(i) {
        if (!arguments.length) {
          i = that.data.i;
        }

        return grunt.util._.trim(that.data.currentValues[i]);
      };

      fileContents = grunt.file.read(this.options().update_file.file);

      var templateFields = this.options().update_file.text.match(reTemplateField);

      // console.log(templateFields);

      // var reText = '###Size[^]+?Original.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$[^]+?Minified.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$[^]+?Gzipped.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$'
      var re = new RegExp(this.options().update_file.find || this.options().update_file.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\\{\\{.*?\\}\\}/g, '(.*)'));

      // console.log(re.source);

      this.data.currentValues = re.exec(fileContents); // first current field value is at index 1

      // console.log('Matched portion of file: ', '*' + this.data.currentValues[0] + '*');

      // translate current values through grunt templating to gen new values

      grunt.template.addDelimiters('doubleBrace', '{{', '}}');

      var newValues = [undefined]; // pad so that first new value is at index 1
      for (i = 0; i < templateFields.length; i++) {
        this.data.i = i + 1;
        newValues.push(grunt.template.process(templateFields[i], {
          data: this.data,
          delimiters: 'doubleBrace'
        }));
      }

      var delta;
      for (; i > 0; i--) {
        //  console.log(grunt.util._.lpad(grunt.util._.trim(this.data.currentValues[i]), 8), ' -->', grunt.util._.lpad(grunt.util._.trim(newValues[i]), 8));
        if (delta = sizeDelta(this.data.currentValues[i], newValues[i])) {
          impacts[i] = delta;
        }
      }

      if (Object.keys(impacts).length) {
        var reLF = new RegExp(grunt.util.linefeed + '|^', 'g');

        // TODO: eliminate width harcode in rpad() calls below; base on max output line width instead

        grunt.log.writeln();
        grunt.log.writeln(grunt.util._.rpad('  Updating ' + this.target + ' sizes in ' + this.options().update_file.file + ' from: ', 54, '_').cyan);

        grunt.log.writeln(this.data.currentValues[0].replace(reLF, grunt.util.linefeed + '  ')); // indent output

        grunt.log.writeln();
        grunt.log.writeln(grunt.util._.rpad('  to: ', 54, '_').cyan);

        // output to file

        i = 1;
        var output = this.options().update_file.text.replace(reTemplateField, function() {
          return newValues[i++];
        });
        grunt.file.write(this.options().update_file.file, fileContents.replace(re, output));

        // output to command line; have to gen output string again for color-coded cli output

        i = 1;
        output = this.options().update_file.text.replace(reTemplateField, function() {
          var ret = newValues[i];

          if (impacts[i] > 0) {
            ret = ret.red;
          } else if (impacts[i] < 0) {
            ret = ret.green;
          }

          i++;

          return ret;
        });
        grunt.log.writeln(output.replace(reLF, grunt.util.linefeed + '  ')); // indent output
      }

      if (origPass) {
        grunt.template.pass = origPass;
      }
    }

    if (!Object.keys(impacts).length) {
      grunt.log.writeln(grunt.util.linefeed +
        (('  ' + this.target + ' version sizes:').cyan) + grunt.util.linefeed +
        (this.data.original ? grunt.util.linefeed + '  Original: '.grey + this.data.orig_size_str.grey : '') +
        (this.data.minified ? grunt.util.linefeed + '  Minified: '.grey + this.data.mini_size_str.grey : '') +
        (this.data.gzipped ? grunt.util.linefeed + '  Gzipped:  '.grey + this.data.gzip_size_str.grey : ''));
    }
  });

  var reTemplateField = new RegExp('\\{\\{.*?\\}\\}', 'g');

  // returns the delta in bytes. eg, sizeDelta('2 kB', '2 bytes') -- > -1998

  function sizeDelta(str1, str2) {
    var float1, float2;

    if (str1) {
      float1 = getNumericEquivalent(str1);

      if (float1 || float1 === 0) {
        if (str2) {
          float2 = getNumericEquivalent(str2);

          if (float2 || float2 === 0) {
            return float2 - float1;
          }
        }

        return float1;
      }
    }

    return 0;
  }

  function getNumericEquivalent(str) {
    var ret = parseFloat(str) || 0;

    if (/kB/i.test(str)) {
      ret = ret * 1000;
    } else if (/MB/i.test(str)) {
      ret = ret * 1000 * 1000;
    }

    return ret;
  }

  // return left-padded integer-right-aligned number string

  function size_string(num, lpadding) {
    var numStr;

    if (num > 999999) {
      numStr = '' + Math.round(num / 100000) / 10;

      if (/\./.test(numStr)) {
        lpadding += 2;
      }
      lpadding -= numStr.length;
      lpadding -= 4;
      numStr += ' MB';
    } else if (num > 999) {
      numStr = '' + Math.round(num / 100) / 10;

      if (/\./.test(numStr)) {
        lpadding += 2;
      }
      lpadding -= numStr.length;
      numStr += ' kB';
    } else {
      numStr = '' + num;

      lpadding -= numStr.length;
      lpadding += 4;
      numStr += ' bytes';
    }

    return grunt.util.repeat(lpadding, ' ') + numStr;
  }
};
