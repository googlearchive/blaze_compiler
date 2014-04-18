#! /usr/bin/env node
var js_yaml = require("js-yaml");
var fs  = require("fs");
var tv4 = require("tv4");
var meta_schema = JSON.parse(fs.readFileSync("core_meta_schema.json").toString());
tv4.addSchema("http://json-schema.org/draft-04/schema", meta_schema);

var yaml_text = fs.readFileSync("metaschema.yaml").toString();
js_yaml.loadAll(yaml_text, function(doc){
    var banUnknownProperties = true;
    var checkRecursive = true;
    var validator = doc.validator;

    for(var i in doc.examples){
        var example = doc.examples[i];


        var valid = tv4.validate(example, validator, checkRecursive, banUnknownProperties);
        if(!valid){
            console.log(example);
            console.log("is not a valid ", doc.name);
            console.log("tv4.error?", tv4.error);
            console.log("tv4.missing?", tv4.missing);
            console.log("tv4.getMissingUris?", tv4.getMissingUris());
        }
    }

    for(var i in doc.negative_examples){
        var negative_example = doc.negative_examples[i];


        var valid = tv4.validate(negative_example, validator, checkRecursive, banUnknownProperties);
        if(valid){
            console.log(negative_example);
            console.log(" was valid a valid", doc.name, "but should not be");
        }
    }
});