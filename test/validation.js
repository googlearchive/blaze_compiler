var fs = require("fs");
var schema = require("../lib/schema.js");
var tv4 = require("tv4");


exports.testValidSchema = function(test){
    var firebase_schema     = schema.load_yaml("schema/schema.yaml");
    var metaschema = fs.readFileSync("schema/jsonschema", {encoding: 'utf8'});

    var valid = tv4.validate(firebase_schema, metaschema, false);

    test.deepEqual(tv4.getMissingUris(), []);

    test.ok(valid);
    test.done();
};

exports.testStructure = function(test){
    structure_example = schema.load_yaml("examples/structure.yaml");
    test.ok(schema.validate_rules(structure_example));
    test.done();
};