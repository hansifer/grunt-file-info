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
          text: '###Size' + 
          grunt.util.linefeed + grunt.util.linefeed + 
          'Original: {{= sizeText(size(src[0])) }}' + 
          grunt.util.linefeed + grunt.util.linefeed + 
          'Minified: {{= sizeText(size(src[1])) }}' + 
          grunt.util.linefeed + grunt.util.linefeed + 
          'Gzipped : {{= sizeText(gzipSize(src[1])) }}'
        }
      }
    }
  }
});
```

### Options

#### options.stdout
Type: `string`

A template string using mustache-style delimiters to specify how results are output to the command line. If not specified, it falls back to the template defined by `options.inject.text` or a default output of filename, size, and gzipped size of each file in `src`.

#### options.inject.dest
Type: `string`

The relative path of the file to inject results into. Injection requires that `options.inject.text` also be specified.

#### options.inject.text
Type: `string`

A template string using mustache-style delimiters to define how results are injected into the file specified by `options.inject.dest`.

The template defined by `options.inject.text` is used to:

- identify the portion of text to replace in the destination file

- extract current field values for comparison against calculated values

- determine the text to inject into the destination file (if changes are detected)

### Template Functions

The following functions are available within fields of templates defined by `options.inject.stdout` and `options.inject.text`:

#### size (`string` _filepath_)
Returns the size in bytes of the file specified by _filepath_.

#### gzipSize (`string` _filepath_)
Returns the gzipped size in bytes of the file specified by _filepath_.

#### sizeText (`number` _bytes_ [, `number` _lpadding_])
Returns optionally-padded text (eg, "2 kB") corresponding to a number of bytes.

#### spaceSavings (`string` _filepath_)
Returns the percentage space savings gained by gzipping the file specified by _filepath_.

Additionally, the following function is available within fields of templates defined by `options.inject.text`:

#### pass ([`number` _index_])
Returns the literal value of a matched template field by its 1-based index. _index_ defaults to the index of the field in which `pass()` is called.

### Usage Examples

#### Default Options

In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
 file_info: {
  source_verion_1: {
   src: ['dist/v1/source_file.js', 'dist/v1/minified_source_file.js'],
   options: {
    inject: {
     dest: 'README.md',
     text: '###Size' + grunt.util.linefeed + grunt.util.linefeed + 
     '|          | Version 1         | Version 2         |' + grunt.util.linefeed + 
     '| :------- | ----------------: | ----------------: |' + grunt.util.linefeed +
     '| Original | {{= _.lpad(sizeText(size(src[0])), 17) }} | {{= _.lpad(pass(), 17) }} |' + grunt.util.linefeed + 
     '| Minified | {{= _.lpad(sizeText(size(src[1])), 17) }} | {{= _.lpad(pass(), 17) }} |' + grunt.util.linefeed + 
     '| Gzipped  | {{= _.lpad(sizeText(gzipSize(src[1])), 17) }} | {{= _.lpad(pass(), 17) }} |'
    },
    stdout: grunt.util.linefeed + 
    'Original: {{= sizeText(size(src[0]), 7) }}' + grunt.util.linefeed + 
    'Minified: {{= sizeText(size(src[1]), 7) }}' + grunt.util.linefeed + 
    'Gzipped:  {{= sizeText(gzipSize(src[1]), 7) }} ({{= spaceSavings(src[1]) }}% savings)' + grunt.util.linefeed
   }
  },
  source_verion_2: {
   src: ['dist/v2/source_file.js', 'dist/v2/minified_source_file.js'],
   options: {
    inject: {
     dest: 'README.md',
     text: '###Size' + grunt.util.linefeed + grunt.util.linefeed + 
     '|          | Version 1         | Version 2         |' + grunt.util.linefeed + 
     '| :------- | ----------------: | ----------------: |' + grunt.util.linefeed +
     '| Original | {{= _.lpad(pass(), 17) }} | {{= _.lpad(sizeText(size(src[0])), 17) }} |' + grunt.util.linefeed + 
     '| Minified | {{= _.lpad(pass(), 17) }} | {{= _.lpad(sizeText(size(src[1])), 17) }} |' + grunt.util.linefeed + 
     '| Gzipped  | {{= _.lpad(pass(), 17) }} | {{= _.lpad(sizeText(gzipSize(src[1])), 17) }} |'
    },
    stdout: grunt.util.linefeed + 
    'Original: {{= sizeText(size(src[0]), 7) }}' + grunt.util.linefeed + 
    'Minified: {{= sizeText(size(src[1]), 7) }}' + grunt.util.linefeed + 
    'Gzipped:  {{= sizeText(gzipSize(src[1]), 7) }} ({{= spaceSavings(src[1]) }}% savings)' + grunt.util.linefeed
   }
  }
 }
});
```

<!---
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
-->

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

<!---
 ## Release History
_(Nothing yet)_ 
-->
