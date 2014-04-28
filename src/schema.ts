import rules = require('../src/rules');


import tv4 = require('tv4');
import fs = require('fs');

/**
 * performs a bottom up traversal of a schema definition
 */
export function annotate(model:rules.Rules){
    var api = new SchemaAPI();

    model.schema.root = annotate_schema(model.schema.json, null, api)
}

export class SchemaNode{
    type: string;
    properties:{[name:string]:SchemaNode} = {};
}

export class MetaSchema{
    validator:any; //json schema json used for validation of type

    validate(node:any):boolean{

        var result =  tv4.validateResult(node, this.validator);

        if(!result.valid){
            console.log(result.error)
        }

        if(tv4.getMissingUris().length != 0){
            console.log(tv4.getMissingUris());
            return false;
        }

        return result.valid;
    }

    static parse(json:any):MetaSchema{
        var result:MetaSchema = new MetaSchema();
        result.validator = json.validator;

        return result;
    }

}


function annotate_schema(node:any, parent:any, api:SchemaAPI):SchemaNode{
    console.log("annotate_schema", node);

    //traverse to children first
    for(var key in node.properties){
        console.log("child", key);
        node.properties[key] = annotate_schema(node.properties[key], node, api);
    }

    var annotation = new SchemaNode();

    annotation.type = node.type ? node.type:null;

    if(annotation.type != null){
        if(api.metaschema[annotation.type] != undefined){
            if(api.metaschema[annotation.type].validate(node)){

            }else{
                console.error(node, "is not a valid", annotation.type)
            }
        }else{
            console.error("unknown schema type:", annotation.type)
        }
    }

    return annotation;
}


/**
 * provides hooks for meta-data to pragmatically generate constraints and predicates
 */
export class SchemaAPI{
    metaschema:{[name:string]:MetaSchema} = {};

    constructor(){
        //load all built in schema definitions from schema directory
        var files = fs.readdirSync("schema/metaschema");
        for(var i in files){
            if (!files.hasOwnProperty(i)) continue;
            var name = "schema/metaschema"+'/'+files[i];
            var metaschema_def = rules.load_yaml(name);

            console.log("loading built in type", metaschema_def.name, "into metaschema");

            this.metaschema[metaschema_def.name] = MetaSchema.parse(metaschema_def);
        }
    }
}
