# grunt-file-info

Display file info and optionally inject it into a file (eg, for self-documenting src file sizes).

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-file-info --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-file-info');
```

## The `file_info` task

_Run this task with the `grunt file_info` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Overview
In your project's Gruntfile, add a section named `file_info` to the data object passed into `grunt.initConfig()`.

For example:

```js
grunt.initConfig({
	file_info: {
		source: {
			src: ['source_file.js', 'minified_source_file.js'],
			options: {
				inject: {
					dest: 'README.md',
					text: '###Size' + grunt.util.linefeed + grunt.util.linefeed + '|          | Version 1         | Version 2          |' + grunt.util.linefeed + '| :------- | ----------------: | -----------------: |' + grunt.util.linefeed + '| Original | {{= _.lpad(fileSizeText(fileSize(src[0])), 17) }} |                n/a |' + grunt.util.linefeed + '| Minified | {{= _.lpad(fileSizeText(fileSize(src[1])), 17) }} | {{= _.lpad(pass(), 18) }} |' + grunt.util.linefeed + '| Gzipped  | {{= _.lpad(fileSizeText(fileSize_gzip(src[1])), 17) }} | {{= _.lpad(pass(), 18) }} |'
				},
				stdout: grunt.util.linefeed + 'Original: {{= fileSizeText(fileSize(src[0]), 7) }}' + grunt.util.linefeed + 'Minified: {{= fileSizeText(fileSize(src[1]), 7) }}' + grunt.util.linefeed + 'Gzipped:  {{= fileSizeText(fileSize_gzip("minified_source_file.js"), 7) }} ({{= Math.round((1 - fileSize_gzip("minified_source_file.js") / fileSize("minified_source_file.js")) * 10000) / 100 }}% savings)' + grunt.util.linefeed
			}
		}
	}
});
```

Specify the relative paths to your original and minified files.   tany combination of original, minified, and gzipped files. `orig_size_str`, `mini_size_str`,  and `gzip_size_str` correspond to the calculated sizes of 

### Options

#### options.stdout
Type: `String`

A template string using mustache-style delimiters to specify how results are output to the command line. If not specified, it falls back to the template defined by `options.inject.text` and then a default output of filename, size, and gzipped size of each file in `src`.

#### options.inject.dest
Type: `String`

The relative path of the file to inject results into. Injection requires that `options.inject.text` also be specified.

#### options.inject.text
Type: `String`

A template string using mustache-style delimiters to specify how results are injected into the file defined by `options.inject.dest`. Injection requires that `options.inject.dest` also be specified.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  file_info: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  file_info: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

<!---
 ## Release History
_(Nothing yet)_ 
-->
