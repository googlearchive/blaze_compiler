Blaze compiler for Firebase
============================

The blaze compiler presents a higher level interface to Firebase security rules.

- write rules in YAML, trailing commas, unquoted strings and comments with tool support
- specify Firebase layout with typed JSON schema models
- reuse models in multiple locations in the data tree
- embed semantically obvious global functional constraints in the schema (as opposed to hierarchical)
- describe access control as a separate concern
- create reusable predicates (boolean functions)
- inline tests to check and document what form data can be to be inserted

Example
========

```


```

Install
=========
npm install
npm link

Run
=========

blaze.js examples/structure.yaml

this will save a rules.json in the current directory

Features
=========

language features implemented so far are tracked in proposal.md

how access control is unified with schema is explained in access.md

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


