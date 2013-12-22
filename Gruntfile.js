/*
 * grunt-file-info
 * https://github.com/hansifer/grunt-file-info
 *
 * Copyright (c) 2013 Hans Meyer
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	var stdout_template_1 = '{{ var i=0; _.forEach(filesSrc, function(filepath) { }}' + grunt.util.linefeed + '{{- _.lpad(++i,4,"0").cyan }}' + grunt.util.linefeed + 'Path: {{- filepath }}' + grunt.util.linefeed + 'Name: {{- filename(filepath) }}' + grunt.util.linefeed + 'Type: {{- filetype(filepath) }}' + grunt.util.linefeed + 'Size: {{- sizeText(size(filepath)) }}' + grunt.util.linefeed + 'Gzip: {{- sizeText(gzipSize(filepath)) }} ({{- spaceSavings(filepath) }}% savings)' + grunt.util.linefeed + 'Date: {{- modified(filepath).toDateString() }}' + grunt.util.linefeed + '{{ }); }}';

	var stdout_template_2 = grunt.util.linefeed + 'Original: {{= sizeText(size(filesSrc[0]), 7) }}' + grunt.util.linefeed + 'Minified: {{= sizeText(size(filesSrc[1]), 7) }}' + grunt.util.linefeed + 'Gzipped:  {{= sizeText(gzipSize(filesSrc[1]), 7) }} ({{= spaceSavings(filesSrc[1]) }}% savings)' + grunt.util.linefeed;

	var inject_template_1 = '###Size' + grunt.util.linefeed + grunt.util.linefeed + '|          | Version 1 | Version 2 |' + grunt.util.linefeed + '| :------- | --------: | --------: |' + grunt.util.linefeed + '| Original | {{= _.lpad(sizeText(size(filesSrc[0])), 9) }} | {{= _.lpad(pass(), 9) }} |' + grunt.util.linefeed + '| Minified | {{= _.lpad(sizeText(size(filesSrc[1])), 9) }} | {{= _.lpad(pass(), 9) }} |' + grunt.util.linefeed + '| Gzipped  | {{= _.lpad(sizeText(gzipSize(filesSrc[1])), 9) }} | {{= _.lpad(pass(), 9) }} |';

	var inject_template_2 = '###Size' + grunt.util.linefeed + grunt.util.linefeed + '|          | Version 1 | Version 2 |' + grunt.util.linefeed + '| :------- | --------: | --------: |' + grunt.util.linefeed + '| Original | {{= _.lpad(pass(), 9) }} | {{= _.lpad(sizeText(size(filesSrc[0])), 9) }} |' + grunt.util.linefeed + '| Minified | {{= _.lpad(pass(), 9) }} | {{= _.lpad(sizeText(size(filesSrc[1])), 9) }} |' + grunt.util.linefeed + '| Gzipped  | {{= _.lpad(pass(), 9) }} | {{= _.lpad(sizeText(gzipSize(filesSrc[1])), 9) }} |';

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
					'Gruntfile.js',
					'tasks/*.js',
					'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['test/actual/*']
		},

		exec: {
			stdout_test: {
				cmd: function(name) {
					// sed below removes unix color codes
					return 'grunt file_info:' + name + ' | sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" > test/actual/stdout_' + name + '.txt';
				}
			}
		},

		// Configuration to be run (and then tested).
		file_info: {

			//--- stdout tests ---

			default_options: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js']
			},
			stdout_false: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					stdout: false
				}
			},
			stdout_true: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					stdout: true
				}
			},
			stdout_template_1: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					stdout: stdout_template_1
				}
			},
			stdout_template_2: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					stdout: stdout_template_2
				}
			},
			single_src_arrayed: {
				src: ['test/fixtures/source_file.js'],
				options: {
					stdout: stdout_template_1
				}
			},
			single_src: {
				src: 'test/fixtures/source_file.js',
				options: {
					stdout: stdout_template_1
				}
			},
			wildcard_src: {
				src: 'test/fixtures/*.js',
				options: {
					stdout: stdout_template_1
				}
			},

			//--- inject tests ---

			inject_no_text: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					inject: {
						dest: 'test/actual/inject_no_text.txt'
					}
				}
			},

			inject_no_dest: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					inject: {
						text: stdout_template_1
					}
				}
			},

			inject_new_dest: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file.js'],
				options: {
					inject: {
						dest: 'test/actual/inject_dest_1.txt',
						text: inject_template_1
					}
				}
			},

			// inject_overlay depends on task inject_new_dest

			inject_overlay: {
				src: ['test/fixtures/source_file_v2.js', 'test/fixtures/minified_source_file_v2.js'],
				options: {
					inject: {
						dest: 'test/actual/inject_dest_1.txt',
						text: inject_template_2
					}
				}
			},

			inject_multiple_dest_1: {
				src: ['test/fixtures/source_file.js', 'test/fixtures/minified_source_file_v2.js'],
				options: {
					inject: [{
							dest: ['test/actual/inject_dest_1.txt', 'test/actual/inject_dest_2.txt'],
							text: inject_template_2
						}, {
							dest: 'test/actual/inject_dest_3.txt',
							text: inject_template_1
						}
					]
				}
			},

			inject_multiple_dest_2: {
				src: ['test/fixtures/source_file_v2.js', 'test/fixtures/minified_source_file.js'],
				options: {
					inject: [{
							dest: ['test/actual/inject_dest_1.txt', 'test/actual/inject_dest_2.txt'],
							text: inject_template_2
						}, {
							dest: 'test/actual/inject_dest_3.txt',
							text: inject_template_1
						}
					]
				}
			},

			//--- stdout inject tests ---

			// TODO: include inject tests with 'stdout', 'injectReport', and 'report' options
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	// Whenever the "test" task is run, first clean the "test/actual" dir, then run this plugin's task(s), then test the result.
	grunt.registerTask('stdout_tests', ['exec:stdout_test:default_options', 'exec:stdout_test:stdout_false', 'exec:stdout_test:stdout_true', 'exec:stdout_test:stdout_template_1', 'exec:stdout_test:stdout_template_2', 'exec:stdout_test:single_src_arrayed', 'exec:stdout_test:single_src', 'exec:stdout_test:wildcard_src', 'exec:stdout_test:inject_no_text', 'exec:stdout_test:inject_no_dest', 'exec:stdout_test:inject_new_dest', 'exec:stdout_test:inject_overlay', 'exec:stdout_test:inject_multiple_dest_1', 'exec:stdout_test:inject_multiple_dest_2']);

	// grunt.registerTask('inject_tests', ['file_info:inject_no_text', 'file_info:inject_no_dest', 'file_info:inject_new_dest', 'file_info:inject_overlay', 'file_info:inject_multiple_dest_1', 'file_info:inject_multiple_dest_2']);

	grunt.registerTask('test_stdout', ['clean', 'stdout_tests', 'nodeunit']);
	// grunt.registerTask('test_inject', ['clean', 'inject_tests', 'nodeunit']);
	grunt.registerTask('test', ['clean', 'stdout_tests', /*'inject_tests', */'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);
};
