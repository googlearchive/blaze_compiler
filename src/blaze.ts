/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />

import optimist = require('optimist');
import schema = require('../src/schema');
import rules = require('../src/rules');
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

console.log(model);