/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />

import optimist = require('optimist');
import schema = require('../src/schema');
import rules = require('../src/rules');
import expression = require('../src/expression');
import fs = require('fs');


var argv = optimist
  .usage('blaze <file>')
  .argv;



var file = argv._[0];

console.log("transpiling", file);



//convert to JSON
var json:string = rules.load_yaml(file);

rules.validate_rules(json);

var model:rules.Rules = rules.Rules.parse(json);

schema.annotate(model);

console.log("\nannotated model:");
console.log(model.schema.root);

var buffer = [];

model.schema.root.generate(new expression.Symbols(), "", buffer);

console.log("\ngenerated code:");
console.log(buffer.join(""));