#! /usr/bin/env node
var js_yaml = require("js-yaml");
var fs  = require("fs");
var tv4 = require("tv4");
var meta_schema = JSON.parse(fs.readFileSync("firesafe_meta_schema.json").toString());
tv4.addSchema("http://json-schema.org/draft-04/schema", meta_schema);

var yaml_text = fs.readFileSync("cbs-rules.yaml").toString();

var doc = js_yaml.load(yaml_text);

var banUnknownProperties = true;
var checkRecursive = true;


/*
DOESN:T SEEM TO WORK RIGHT
tv4.defineKeyword("examples", function(data, value, schema){

    console.log("data", data);
    console.log("value", value);
    //console.log("schema", schema);
});
*/

console.log("checking overall schema...");
var valid = tv4.validate(doc.schema, meta_schema, checkRecursive, banUnknownProperties);

if(!valid){
    console.log("is not a valid ", doc.name);
    console.log("tv4.error?", tv4.error);
    console.log("tv4.missing?", tv4.missing);
    console.log("tv4.getMissingUris?", tv4.getMissingUris());
}

console.log("schema ok");

//add the schema as the default namespace so we can follow inline $ref definitions
tv4.addSchema("", doc.schema);



function visit(path, object, cb) {
    cb(object, path);
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            if (typeof object[property] == "object"){
                visit(path+ "/" + property, object[property], cb);
            }else if (property == "$ref"){ //follow $ref
                var ref = object[property];
                var schema = tv4.getSchema(ref);

                if(schema){
                    visit(path, schema, cb)
                }else{
                    console.error("can't find: ", ref)
                }

            }
        }
    }
}

//check examples work
visit("#", doc.schema, function(subschema, path){
    //BUG?
    //#/definitions is not brought into the subschema namespace properly
    //so we deep copy the object and copy the definitions over
    //we can't jsut copy the definitions over because it messes up the calling visitor
    var subschema = JSON.parse(JSON.stringify(subschema));
    subschema.definitions = doc.schema.definitions;


    for(var i in subschema.examples){
        var example = subschema.examples[i];
        var valid = tv4.validate(example, subschema, checkRecursive, banUnknownProperties);

        if(!valid){
            console.log("the follow example");
            console.log(example);
            console.log("did not validate against:");
            console.log(subschema);
            console.log("tv4.error?", tv4.error);
            console.log("tv4.missing?", tv4.missing);
            console.log("tv4.getMissingUris?", tv4.getMissingUris());
        }
    }

    for(var i in subschema.nonexamples){
        var example = subschema.nonexamples[i];
        var valid = tv4.validate(example, subschema, checkRecursive, banUnknownProperties);

        if(valid){
            console.log("the follow nonexample");
            console.log(example);
            console.log("did erroneously validate against:");
            console.log(subschema);
        }
    }
});