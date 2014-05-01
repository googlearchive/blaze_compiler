/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />

import optimist = require('optimist');
import compile = require('./compile');



var argv = optimist
  .usage('blaze <file>')
  .argv;



var file = argv._[0];

console.log("transpiling", file);

compile.compile(file);


