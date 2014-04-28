/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />
var optimist = require('optimist');
var schema = require('../src/schema');
var rules = require('../src/rules');

var argv = optimist.usage('blaze <file>').argv;

var file = argv._[0];

console.log("transpiling", file);

//convert to JSON
var json = rules.load_yaml(file);

rules.validate_rules(json);

var model = rules.Rules.parse(json);

schema.annotate(model);

console.log(model);
//# sourceMappingURL=blaze.js.map
