Install
=========
npm install

Run
=========

node src/blaze.js examples/structure.yaml

this will save a rules.json in the current directory

Tests
=========

grunt nodeunit:all

numerous examples of semantics can be found in test/cases/

these test cases are tested by grunt nodeunit:codegen


Compiling
==========

written in Typescript (.ts), Jetbrains file watcher will compile them for you opportunistically but you have
to tell it to use the CommonJS module linking pattern. At command line you can compile a typescript file by

tsc test/codegen_test.ts --module "CommonJS"


