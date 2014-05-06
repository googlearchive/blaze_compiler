var fs = require("fs");
var rules = require("../src/rules.js");
var expression = require("../src/expression.js");
var tv4 = require("tv4");


exports.testValidSchema = function(test){
    var firebase_schema     = rules.load_yaml("schema/schema.yaml");
    var metaschema = fs.readFileSync("schema/jsonschema", {encoding: 'utf8'});

    var valid = tv4.validate(firebase_schema, metaschema, false);

    test.deepEqual(tv4.getMissingUris(), []);

    test.ok(valid);
    test.done();
};

exports.testStructureValidation = function(test){
    structure_example = rules.load_yaml("examples/structure.yaml");
    test.ok(rules.validate_rules(structure_example));
    test.done();
};

exports.testStructureParsing = function(test){
    structure_example = rules.load_yaml("examples/structure.yaml");
    var rule = rules.Rules.parse(structure_example);
    console.log(rule);
    test.ok(rule.schema != null);
    test.ok(rule.predicates["isLoggedIn"] != null);
    test.done();
};

exports.testPredicateParsing1 = function(test){
    var predicate = new expression.Predicate("f(x)", "true");

    test.ok(predicate.signature == "f(1)");
    test.done();
};
exports.testPredicateParsing2 = function(test){
    var predicate = new expression.Predicate("f()", "true");

    test.ok(predicate.signature == "f(0)");
    test.done();
};
exports.testPredicateParsing3 = function(test){
    var predicate = new expression.Predicate("f(x, y)", "true");
    test.equals(predicate.signature, "f(2)");
    test.deepEqual(predicate.parameter_map, ['x', 'y']);
    test.done();
};