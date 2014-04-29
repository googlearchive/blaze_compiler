import rules = require('../src/rules');
import expression = require('../src/expression');


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
    constraint:expression.Expression


    generate(symbols:expression.Symbols, prefix:string, buffer:string[]):void{
        buffer.push("{\n");

        buffer.push(prefix + "  '.write':");
        buffer.push(this.constraint.generate(symbols));
        buffer.push("\n");

        for(var property in this.properties){
            buffer.push(prefix + "  '" + property + "': ");
            this.properties[property].generate(symbols, prefix + "  ", buffer)
        }

        buffer.push(prefix);
        buffer.push("}\n");

    }
}

export class MetaSchema{
    validator:any; //json schema json used for validation of type

    compile:(api:SchemaAPI) => void; //function used to generate type specific constraints

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
        result.compile = <(api:SchemaAPI) => void>new Function("api",json.compile);

        return result;
    }
}


function annotate_schema(node:any, parent:any, api:SchemaAPI):SchemaNode{
    //console.log("annotate_schema", node);
    var annotation = new SchemaNode();

    //traverse to children first
    for(var key in node.properties){
        annotation.properties[key] = annotate_schema(node.properties[key], node, api);
    }

    annotation.type = node.type ? node.type:null;

    if(annotation.type != null){
        if(api.metaschema[annotation.type] != undefined){
            if(api.metaschema[annotation.type].validate(node)){
                api.setContext(node, parent);
                api.metaschema[annotation.type].compile(api);
            }else{
                console.error(node, "is not a valid", annotation.type)
            }
        }else{
            console.error("unknown schema type:", annotation.type)
        }
    }

    annotation.constraint = expression.Expression.parse(node.constraint);

    return annotation;
}


/**
 * provides hooks for meta-data to pragmatically generate constraints and predicates
 */
export class SchemaAPI{
    metaschema:{[name:string]:MetaSchema} = {};

    node:any;   //local context for api application
    parent:any; //local context for api application

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

    /**
     * before the metaschema is given a hook for adding constraints, this method is called to
     * point the api at the right schema instances
     * @param node
     * @param parent
     */
    setContext(node:any, parent:any){
        this.node = node;
        this.parent = parent;
    }

    /**
     * User method for adding a type specific constraint, the constraint is &&ed to the current constraints
     */
    addConstraint(expression:string):void{
        this.node.constraint = "("+ this.node.constraint + ") && (" + expression + ")";
    }
}
