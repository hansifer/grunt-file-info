'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

// source: http://stackoverflow.com/a/6969486/384062

function escapeRegExp(iStr) {
	return iStr.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function addComparisonTest(obj, name, filenames, type, desc) {
	type = type || 'contains';

	obj[name] = function(test) {
		test.expect(filenames.length);

		var actual, expected;
		filenames.forEach(function(el) {
			actual = grunt.file.read('test/actual/' + el);
			expected = grunt.file.read('test/expected/' + el);

			if (type === 'equals') {
				test.equal(actual, expected, desc);
			} else /*if (type === 'contains')*/ {
				test.ok((new RegExp(escapeRegExp(expected))).test(actual), desc);
			}
		});

		test.done();
	};
}

function addStdoutComparisonTest(obj, name, type, desc) {
	return addComparisonTest(obj, name, ['stdout_' + name + '.txt'], type, desc);
}

var file_info = {
	setUp: function(done) {
		// setup here if necessary
		done();
	}
};

addStdoutComparisonTest(file_info, 'default_options');
addStdoutComparisonTest(file_info, 'stdout_false');
addStdoutComparisonTest(file_info, 'stdout_true');
addStdoutComparisonTest(file_info, 'stdout_template_1');
addStdoutComparisonTest(file_info, 'stdout_template_2');
addStdoutComparisonTest(file_info, 'single_src_arrayed');
addStdoutComparisonTest(file_info, 'single_src');
addStdoutComparisonTest(file_info, 'wildcard_src');

addStdoutComparisonTest(file_info, 'inject_no_text');
addStdoutComparisonTest(file_info, 'inject_no_dest');
addStdoutComparisonTest(file_info, 'inject_new_dest');
addStdoutComparisonTest(file_info, 'inject_overlay');
addStdoutComparisonTest(file_info, 'inject_multiple_dest_1');
addStdoutComparisonTest(file_info, 'inject_multiple_dest_2');

addComparisonTest(file_info, 'inject_new_dest', ['inject_dest_1.txt']);
addComparisonTest(file_info, 'inject_overlay', ['inject_dest_1.txt']);
addComparisonTest(file_info, 'inject_multiple_dest_1', ['inject_dest_1.txt', 'inject_dest_2.txt', 'inject_dest_3.txt']);
addComparisonTest(file_info, 'inject_multiple_dest_2', ['inject_dest_1.txt', 'inject_dest_2.txt', 'inject_dest_3.txt']);

exports.file_info = file_info;
