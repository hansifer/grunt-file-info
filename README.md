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

The following example injects file size information for a source file and its minified version into a README.md file that already has a section whose formatting conforms to the `options.inject.text` template:

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
                'Gzipped:  {{= sizeText(gzipSize(src[1])) }}'
        }
      }
    }
  }
});
```

### Options

#### options.stdout
Type: `string`

A template string using mustache-style delimiters to specify how results are output to the command line. If not specified, it falls back to the template defined by `options.inject.text` or the default layout of filename, size, and gzipped size of each file in `src`.

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

The following functions are available within fields of templates defined by `options.stdout` and `options.inject.text`:

#### size (`string` _filepath_)
Returns the size in bytes of the file specified by _filepath_.

#### gzipSize (`string` _filepath_)
Returns the gzipped size in bytes of the file specified by _filepath_.

#### sizeText (`number` _bytes_ [, `number` _lpadding_])
Returns optionally-padded text (eg, "2 kB") corresponding to a number of bytes.

#### spaceSavings (`string` _filepath_)
Returns the percentage space savings gained by gzipping the file specified by _filepath_.

#### modified (`string` _filepath_)
Returns the date that the contents of the file specified by _filepath_ were last modified.

Additionally, the following function is available within fields of templates defined by `options.inject.text`:

#### pass ([`number` _index_])
Returns the matched value of a template field when that template is matched against existing text in a file. _index_ is the 1-based order of the matched field within the template and defaults to the order of the field in which `pass()` is called.

### Usage Examples

#### Default Options

The following example simply outputs file size information for a source file and its minified version to the command line:

```js
grunt.initConfig({
    file_info: {
        Source: {
            src: ['source_file.js', 'minified_source_file.js']
        }
    }
});
```

Output:
```
Source file sizes:

source_file.js                22.5 kB (4.2 kB gzipped)
minified_source_file.js       17.9 kB (3.9 kB gzipped)
```

#### Customized Command-Line Output

The following example outputs file size information for a source file and its minified version to the command line according to a custom template:

```js
grunt.initConfig({
  file_info: {
    Source: {
      src: ['source_file.js', 'minified_source_file.js'],
      options: {
        stdout: grunt.util.linefeed + 
        'Original: {{= sizeText(size(src[0]), 7) }}' + 
        grunt.util.linefeed + 
        'Minified: {{= sizeText(size(src[1]), 7) }}' + 
        grunt.util.linefeed + 
        'Gzipped:  {{= sizeText(gzipSize(src[1]), 7) }} ({{= spaceSavings(src[1]) }}% savings)' + 
        grunt.util.linefeed
      }
    }
  }
});
```

Output:
```
Original:      22.5 kB
Minified:      17.9 kB
Gzipped:        3.9 kB (78.06% savings)
```

The following example outputs a file's name, modification date, and size to the command line according to a custom template:

```js
grunt.initConfig({
    file_info: {
        Source: {
            src: 'source_file.js',
            options: {
                stdout: 
                  'Name: {{= src }}' + 
                  grunt.util.linefeed + 
                  'Date: {{= modified(src).toDateString() }}' + 
                  grunt.util.linefeed + 
                  'Size: {{= sizeText(size(src)) }}'
            }
        }
    }
});
```

Output:
```
Name: source_file.js
Date: Sat Dec 07 2013
Size: 22.5 kB
```

#### File Injection

The following example injects file size information for a source file and its minified version into a README.md file according to a supplied template. The template is used to match the portion of the file to replace as well as to generate the replacement text. File injection occurs only if a portion of the destination file matches `options.inject.text` and one or more corresponding field values _change_, in which case a diff is output to the command line for the matching portion of text. If no portion of the file matches `options.inject.text` or no change is detected, file information is output to the command line according to the template defined in `options.stdout`, `options.inject.text`, or the default layout. If the destination file does not exist, it is created with the generated text.

```js
grunt.initConfig({
  file_info: {
    Source: {
      src: ['source_file.js', 'minified_source_file.js'],
      options: {
        inject: {
          dest: 'README.md',
          text: 
          '###Size' + grunt.util.linefeed + grunt.util.linefeed + 
          '|          | Version 1 | Version 2 |' + 
          grunt.util.linefeed + 
          '| :------- | --------: | --------: |' + 
          grunt.util.linefeed +
          '| Original | {{= _.lpad(sizeText(size(src[0])), 9) }} | {{= _.lpad(pass(), 9) }} |' + 
          grunt.util.linefeed + 
          '| Minified | {{= _.lpad(sizeText(size(src[1])), 9) }} | {{= _.lpad(pass(), 9) }} |' + 
          grunt.util.linefeed + 
          '| Gzipped  | {{= _.lpad(sizeText(gzipSize(src[1])), 9) }} | {{= _.lpad(pass(), 9) }} |'
        }
      }
    }
  }
});
```

Injected text <nowiki>*</nowiki>:
```
###Size

|          | Version 1 | Version 2 |
| :------- | --------: | --------: |
| Original |   22.5 kB |   25.2 kB |
| Minified |   17.9 kB |   19.7 kB |
| Gzipped  |    3.9 kB |    4.1 kB |
```
<nowiki>*</nowiki> _given that any of the size values for "Version 1" have changed. Note that "Version 2" values in this case are simply propagated from the existing text in the file._

#### Kitchen Sink

The following comprehensive example shows the use of multiple `file_info` targets that write source file information to the same portion of a README.md file.

```js
grunt.initConfig({
 file_info: {
  source_verion_1: {
   src: ['dist/v1/source_file.js', 'dist/v1/minified_source_file.js'],
   options: {
    inject: {
     dest: 'README.md',
     text: 
     '###Size' + grunt.util.linefeed + grunt.util.linefeed + 
     '|          | Version 1 | Version 2 |' + grunt.util.linefeed + 
     '| :------- | --------: | --------: |' + grunt.util.linefeed +
     '| Original | {{= _.lpad(sizeText(size(src[0])), 9) }} | {{= _.lpad(pass(), 9) }} |' + grunt.util.linefeed + 
     '| Minified | {{= _.lpad(sizeText(size(src[1])), 9) }} | {{= _.lpad(pass(), 9) }} |' + grunt.util.linefeed + 
     '| Gzipped  | {{= _.lpad(sizeText(gzipSize(src[1])), 9) }} | {{= _.lpad(pass(), 9) }} |'
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
     text: 
     '###Size' + grunt.util.linefeed + grunt.util.linefeed + 
     '|          | Version 1 | Version 2 |' + grunt.util.linefeed + 
     '| :------- | --------: | --------: |' + grunt.util.linefeed +
     '| Original | {{= _.lpad(pass(), 9) }} | {{= _.lpad(sizeText(size(src[0])), 9) }} |' + grunt.util.linefeed + 
     '| Minified | {{= _.lpad(pass(), 9) }} | {{= _.lpad(sizeText(size(src[1])), 9) }} |' + grunt.util.linefeed + 
     '| Gzipped  | {{= _.lpad(pass(), 9) }} | {{= _.lpad(sizeText(gzipSize(src[1])), 9) }} |'
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
