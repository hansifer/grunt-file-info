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
  grunt.registerMultiTask('file_info', 'Automate template-driven updates of project file stats to project documentation.', function() {
    var that = this;

    this.data.filesSrc = this.filesSrc;

    // add template functions
    this.data.size = size;
    this.data.gzipSize = gzipSize;
    this.data.sizeText = sizeText;
    this.data.spaceSavings = spaceSavings;
    this.data.modified = modified;
    this.data.modifiedAgo = modifiedAgo;
    this.data.filename = filename;
    this.data.filetype = filetype;
    this.data.config = gruntConfig;
    this.data.pass = function(i) {
      if (!arguments.length) {
        i = that.data.i;
      }

      return (grunt.util._.isUndefined(i) ? '' : grunt.util._.trim(that.data.currentValues[i]));
    };

    grunt.template.addDelimiters('doubleBrace', '{{', '}}');

    if (this.options().inject) {
      var defaultInjectReport = !('injectReport' in this.options()) || !!this.options().injectReport;
      if (grunt.util._.isArray(this.options().inject)) {
        this.options().inject.forEach(function(injectConfig) {
          processInject.call(that, injectConfig, defaultInjectReport);
        });
      } else {
        processInject.call(this, this.options().inject, defaultInjectReport);
      }
    }

    if (!('stdout' in this.options()) || this.options().stdout === true) {
      grunt.log.writeln(grunt.util.linefeed + (('  ' + this.target + ' stats:').cyan) + grunt.util.linefeed);

      var colWidth = 0;
      this.filesSrc.forEach(function(filepath) {
        colWidth = Math.max(filepath.length, colWidth);
      });

      this.filesSrc.forEach(function(filepath) {
        grunt.log.writeln('  ' + grunt.util._.rpad(filepath, colWidth + 1).grey + sizeText(size(filepath), 8, true).grey + (' (' + sizeText(gzipSize(filepath)) + ' gzipped)').grey);
      });
    } else if (this.options().stdout) {
      grunt.log.write(grunt.template.process(this.options().stdout, {
        data: this.data,
        delimiters: 'doubleBrace'
      }));
    }
  });

  function processInject(injectConfig, report) {
    var that = this;

    if ('report' in injectConfig) {
      report = injectConfig.report;
    }

    if (grunt.util._.isArray(injectConfig.dest)) {
      injectConfig.dest.forEach(function(dest) {
        processInjectDest.call(that, dest, injectConfig.text, report);
      });
    } else {
      processInjectDest.call(this, injectConfig.dest, injectConfig.text, report);
    }
  }

  function processInjectDest(dest, text, report) {
    function writeStatus(str) {
      report && grunt.log.writeln(grunt.util.linefeed + '  ' + str);
    }

    var newValues, i, fileContents, output;
    var fieldDiffs = {}; // for values that either increased or decreased, add a property where name is fieldIndex and value is bytes delta (positive if up, negative if down)

    var reTemplateField = new RegExp('\\{\\{.*?\\}\\}', 'g');

    if (dest && text) {
      if (grunt.file.exists(dest)) {
        fileContents = grunt.file.read(dest);

        // var reText = '###Size[^]+?Original.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$[^]+?Minified.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$[^]+?Gzipped.*?\\|([^\\|]*).*?\\|([^\\|]*).*?$'
        var re = new RegExp( /*this.options().find || */ text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\\{\\{.*?\\}\\}/g, '(.*)'));

        // console.log(re.source);

        if (this.data.currentValues = re.exec(fileContents)) { // first current field value is at index 1
          // console.log('Matched portion of file: ', '*' + this.data.currentValues[0] + '*');

          var templateFields = text.match(reTemplateField);
          // console.log(templateFields);

          // translate current values through grunt templating to gen new values

          newValues = [undefined]; // pad so that first new value is at index 1
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

            // output to file

            i = 1;
            output = text.replace(reTemplateField, function() {
              return newValues[i++];
            });
            grunt.file.write(dest, fileContents.replace(re, output));

            // output to command line

            if (report) {
              var reLF = new RegExp(grunt.util.linefeed + '|^', 'g');

              grunt.log.writeln();
              grunt.log.writeln(('  Updating ' + this.target + ' stats in ' + dest + ' from:').cyan);

              grunt.log.writeln(this.data.currentValues[0].replace(reLF, grunt.util.linefeed + '  ')); // indent output

              grunt.log.writeln();
              grunt.log.writeln('  to:'.cyan);

              // have to gen output string again for color-coded cli output

              i = 1;
              output = text.replace(reTemplateField, function() {
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
          } else {
            writeStatus(('No changes detected in file ' + dest).green);
          }
        } else {
          writeStatus(('No matching text found in file ' + dest).red);
        }
      } else {
        delete this.data.i;
        grunt.file.write(dest, grunt.template.process(text, {
          data: this.data,
          delimiters: 'doubleBrace'
        }));

        writeStatus(('Created file ' + dest).green);
      }
    } else {
      writeStatus(('file_info config error for target ' + this.target + ': inject requires dest and text').red);
    }
  }

  function size(filepath) {
    return require('fs').lstatSync(filepath).size;
    // return grunt.file.read(filepath).length;
  }

  function gzipSize(filepath) {
    return require('zlib-browserify').gzipSync(new Buffer(grunt.file.read(filepath))).length;
  }

  // return size string; optionally left-pad; optionally integer-right-align for easy comparison

  function sizeText(bytes, lpadding, align) {
    var sizeStr;

    if (bytes > 999999) {
      sizeStr = '' + Math.round(bytes / 100000) / 10;

      if (align && lpadding) {
        if (/\./.test(sizeStr)) {
          lpadding += 2;
        }
        lpadding -= sizeStr.length;
        lpadding -= 4;
      }
      sizeStr += ' MB';
    } else if (bytes > 999) {
      sizeStr = '' + Math.round(bytes / 100) / 10;

      if (align && lpadding) {
        if (/\./.test(sizeStr)) {
          lpadding += 2;
        }
        lpadding -= sizeStr.length;
      }
      sizeStr += ' kB';
    } else {
      sizeStr = '' + bytes;

      if (align && lpadding) {
        lpadding -= sizeStr.length;
        lpadding += 4;
      }
      sizeStr += ' bytes';
    }

    if (lpadding) {
      return grunt.util.repeat(Math.max(align ? lpadding : lpadding - sizeStr.length, 0), ' ') + sizeStr;
    } else {
      return sizeStr;
    }
  }

  function spaceSavings(filepath) {
    return Math.round((1 - gzipSize(filepath) / size(filepath)) * 10000) / 100;
  }

  function modified(filepath) {
    return require('fs').lstatSync(filepath).mtime;
  }

  function modifiedAgo(filepath) {
    return require('moment')(require('fs').lstatSync(filepath).mtime).fromNow();
  }

  function filename(filepath) {
    var arr = /\/?([^\/]+)$/.exec(filepath);

    if (arr && arr.length > 1) {
      return arr[1];
    }

    return '';
  }

  function filetype(filepath) {
    var arr = /\.([^\.]+)$/.exec(filename(filepath));

    if (arr && arr.length > 1) {
      return arr[1];
    }

    return '';
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

  function gruntConfig(name) {
    return grunt.config(name);
  }
};
