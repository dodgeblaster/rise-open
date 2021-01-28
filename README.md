risecli
=======



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/risecli.svg)](https://npmjs.org/package/risecli)
[![Downloads/week](https://img.shields.io/npm/dw/risecli.svg)](https://npmjs.org/package/risecli)
[![License](https://img.shields.io/npm/l/risecli.svg)](https://github.com/riseagain/risecli/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g risecli
$ risecli COMMAND
running command...
$ risecli (-v|--version|version)
risecli/0.0.0 darwin-x64 node-v14.15.1
$ risecli --help [COMMAND]
USAGE
  $ risecli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`risecli hello [FILE]`](#risecli-hello-file)
* [`risecli help [COMMAND]`](#risecli-help-command)

## `risecli hello [FILE]`

describe the command here

```
USAGE
  $ risecli hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ risecli hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/riseagain/risecli/blob/v0.0.0/src/commands/hello.ts)_

## `risecli help [COMMAND]`

display help for risecli

```
USAGE
  $ risecli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.1/src/commands/help.ts)_
<!-- commandsstop -->
