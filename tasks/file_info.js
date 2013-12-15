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

  // TODO: add support for optional 'find' option to allow specification of regexp of text to replace. In the absence of 'find' option, use 'text' to generate this regexp. In 'text' value, use '{{= pass(n) }}' to specify passthru values, where n is the index of a capturing group from the 'find' (regexp) value.
  grunt.registerMultiTask('file_info', 'Display file info and optionally inject it into a file (eg, for self-documenting src file sizes).', function() {
    var fileContents;
    var that = this;
    var i;

    // add template functions
    this.data.size = size;
    this.data.gzipSize = gzipSize;
    this.data.sizeText = sizeText;
    this.data.spaceSavings = spaceSavings;
    this.data.pass = function(i) {
      if (!arguments.length) {
        i = that.data.i;
      }

      return (grunt.util._.isUndefined(i) ? '' : grunt.util._.trim(that.data.currentValues[i]));
    };

    grunt.template.addDelimiters('doubleBrace', '{{', '}}');

    var fieldDiffs = {}; // for values that either increased or decreased, add a property where name is fieldIndex and value is bytes delta (positive if up, negative if down)
    if (this.options().inject && this.options().inject.dest && this.options().inject.text) {
      if (grunt.file.exists(this.options().inject.dest)) {
        fileContents = grunt.file.read(this.options().inject.dest);

        // var reText = '###Size[^]+?Original.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$[^]+?Minified.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$[^]+?Gzipped.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$'
        var re = new RegExp(this.options().find || this.options().inject.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\\{\\{.*?\\}\\}/g, '(.*)'));

        // console.log(re.source);

        if (this.data.currentValues = re.exec(fileContents)) { // first current field value is at index 1
          // console.log('Matched portion of file: ', '*' + this.data.currentValues[0] + '*');

          var templateFields = this.options().inject.text.match(reTemplateField);
          // console.log(templateFields);

          // translate current values through grunt templating to gen new values

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
            if (delta = fieldDiff(this.data.currentValues[i], newValues[i])) {
              fieldDiffs[i] = delta;
            }
          }

          if (Object.keys(fieldDiffs).length) {
            var reLF = new RegExp(grunt.util.linefeed + '|^', 'g');

            // TODO: eliminate width harcode in rpad() calls below; base on max output line width instead

            grunt.log.writeln();
            grunt.log.writeln(('  Updating ' + this.target + ' sizes in ' + this.options().inject.dest + ' from:').cyan);

            grunt.log.writeln(this.data.currentValues[0].replace(reLF, grunt.util.linefeed + '  ')); // indent output

            grunt.log.writeln();
            grunt.log.writeln('  to:'.cyan);

            // output to file

            i = 1;
            var output = this.options().inject.text.replace(reTemplateField, function() {
              return newValues[i++];
            });
            grunt.file.write(this.options().inject.dest, fileContents.replace(re, output));

            // output to command line; have to gen output string again for color-coded cli output

            i = 1;
            output = this.options().inject.text.replace(reTemplateField, function() {
              var ret = newValues[i];

              if (fieldDiffs[i] > 0) {
                ret = ret.red;
              } else if (fieldDiffs[i] < 0) {
                ret = ret.green;
              }

              i++;

              return ret;
            });
            grunt.log.writeln(output.replace(reLF, grunt.util.linefeed + '  ')); // indent output
          }
        }
      } else {
        grunt.file.write(this.options().inject.dest, grunt.template.process(this.options().inject.text, {
          data: this.data,
          delimiters: 'doubleBrace'
        }));
      }
    }

    if (!Object.keys(fieldDiffs).length) {
      var outTemplate = this.options().stdout || (this.options().inject && this.options().inject.text);

      if (outTemplate) {
        grunt.log.write(grunt.template.process(outTemplate, {
          data: this.data,
          delimiters: 'doubleBrace'
        }));
      } else {
        grunt.log.writeln(grunt.util.linefeed + (('  ' + this.target + ' file sizes:').cyan) + grunt.util.linefeed);

        var colWidth = 0;
        this.filesSrc.forEach(function(filepath) {
          colWidth = Math.max(filepath.length, colWidth);
        });

        this.filesSrc.forEach(function(filepath) {
          grunt.log.writeln('  ' + grunt.util._.rpad(filepath, colWidth + 1).grey + sizeText(size(filepath), 8).grey + (' (' + sizeText(gzipSize(filepath)) + ' gzipped)').grey);
        });
      }
    }
  });

  var reTemplateField = new RegExp('\\{\\{.*?\\}\\}', 'g');

  function size(filepath) {
    return grunt.file.read(filepath).length;
  }

  function gzipSize(filepath) {
    return require('zlib-browserify').gzipSync(grunt.file.read(filepath)).length;
  }

  // return left-padded integer-right-aligned size string

  function sizeText(bytes, lpadding) {
    var sizeStr;

    if (bytes > 999999) {
      sizeStr = '' + Math.round(bytes / 100000) / 10;

      if (lpadding) {
        if (/\./.test(sizeStr)) {
          lpadding += 2;
        }
        lpadding -= sizeStr.length;
        lpadding -= 4;
      }
      sizeStr += ' MB';
    } else if (bytes > 999) {
      sizeStr = '' + Math.round(bytes / 100) / 10;

      if (lpadding) {
        if (/\./.test(sizeStr)) {
          lpadding += 2;
        }
        lpadding -= sizeStr.length;
      }
      sizeStr += ' kB';
    } else {
      sizeStr = '' + bytes;

      if (lpadding) {
        lpadding -= sizeStr.length;
        lpadding += 4;
      }
      sizeStr += ' bytes';
    }

    return (lpadding ? grunt.util.repeat(lpadding, ' ') : '') + sizeStr;
  }

  function spaceSavings(filepath) {
    return Math.round((1 - gzipSize(filepath) / size(filepath)) * 10000) / 100;
  }

  // if comparing file size fields, return file size delta in bytes. eg, fieldDiff('2 kB', '2 bytes') -- > -1998
  // else, return 1 if strings differ, 0 if same

  function fieldDiff(str1, str2) {
    var float1, float2;

    if (!grunt.util._.isUndefined(str1) && str1 !== str2) {
      if (isFileSize(str1) && isFileSize(str2)) {
        float1 = parseByteSize(str1);

        if (float1 || float1 === 0) {
          if (str2) {
            float2 = parseByteSize(str2);

            if (float2 || float2 === 0) {
              return float2 - float1;
            }
          }

          return float1;
        }
      }

      return 1;
    }

    return 0;
  }

  function isFileSize(str) {
    return (/[\d\s](bytes|kB|MB)$/i.test(str));
  }

  function parseByteSize(str) {
    var ret = parseFloat(str) || 0;

    if (/kB/i.test(str)) {
      ret = ret * 1000;
    } else if (/MB/i.test(str)) {
      ret = ret * 1000 * 1000;
    }

    return ret;
  }
};
