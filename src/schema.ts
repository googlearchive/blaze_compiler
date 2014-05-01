import rules = require('../src/rules');
import expression = require('../src/expression');


import tv4 = require('tv4');
import fs = require('fs');


//todo
//refactor out traversals

/**
 * performs a bottom up traversal of a schema definition, allowing each metaschema processor
 * to generate constraints
 */
export function annotate(model:rules.Rules){
    var api = new SchemaAPI();

    model.schema.root = annotate_schema(model.schema.json, null, api)
}
/**
* moves ancestors schema constraints to being explicitly being represented in leaf nodes
* this is done by leaves being the && concatenation of all ancestors
* next in a parent's context is next.parent() in the child context
*/
export function flattenConstraints(model:rules.Rules){
    model.schema.root.flattenConstraints(null);
}
/**
* intergrates the ACL constraints into the schema
*/
export function combineACL(model:rules.Rules){
    model.schema.root.combineACL(model.access, []);
}

/**
* intergrates the ACL constraints into the schema
*/
export function generateRules(model:rules.Rules){
    var buffer:string[] = [];
    buffer.push('{\n');
    buffer.push('  "rules":');
    model.schema.root.generate(new expression.Symbols(), "  ", buffer);
    buffer.push('}\n');
    //convert buffer into big string
    var code:string = buffer.join('');
    return code;
}

export class SchemaNode{
    type: string;
    properties:{[name:string]:SchemaNode} = {};
    constraint:expression.Expression;
    write:expression.Expression;
    read: expression.Expression;


    generate(symbols:expression.Symbols, prefix:string, buffer:string[]):string[]{
        buffer.push('{\n');

        buffer.push(prefix + '  ".write":"');
        buffer.push(this.write.generate(symbols));
        buffer.push('",\n');
        buffer.push(prefix + '  ".read":"');
        buffer.push(this.read.generate(symbols));
        buffer.push('",\n');

        var comma_in_properties = false;
        //recurse
        for(var property in this.properties){
            buffer.push(prefix + '  "' + property + '": ');
            this.properties[property].generate(symbols, prefix + "  ", buffer)

            buffer.pop(); //pop closing brace and continue with comma
            buffer.push('},\n');
            comma_in_properties = true;
        }
        //remove last trailing comma
        if(comma_in_properties){
            buffer.pop();
            buffer.push("}\n");
        }else{
            //else the comma was placed last at the ".read" statement
            buffer.pop();
            buffer.push('"\n');
        }

        buffer.push(prefix);
        buffer.push("}\n");

        return buffer;
    }

    /**
     * moves ancestors constraints to being explicitly being represented in leaf nodes
     * this is done by leaves being the && concatenation of all ancestors
     * next in a parent's context is next.parent() in the child context
     */
    flattenConstraints(inherited_clause:expression.Expression){
        if(inherited_clause != null){
            this.constraint = expression.Expression.parse("(" + inherited_clause.rewriteForChild()  + ")&&(" + this.constraint.raw + ")");
        }

        //recurse
        for(var property in this.properties){
            this.properties[property].flattenConstraints(this.constraint)
        }
    }

    combineACL(acl:rules.Access, location:string[]){
        console.log("combineACL", location);

        var write:string = "false";
        var read: string = "false";

        //work out what ACL entries are active for this node by ORing active entries clauses together
        for(var idx in acl){
            var entry:rules.AccessEntry = acl[idx];

            console.log("entry", entry.location);
            if(entry.match(location)){
                write = "(" + write + ")||(" + entry.write.raw + ")";
                read  = "(" + read  + ")||(" + entry.read.raw  + ")";
            }
        }

        //combine the write rules with the schema constraints
        this.write = expression.Expression.parse("(" + this.constraint.raw + ")&&(" + write + ")");
        this.read  = expression.Expression.parse(read);

        //recurse
        for(var property in this.properties){
            var child_location: string[] = location.concat(<string>property);
            this.properties[property].combineACL(acl, child_location);
        }
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

    //recurse to children first in bottom up
    for(var key in node.properties){
        annotation.properties[key] = annotate_schema(node.properties[key], node, api);
    }

    annotation.type = node.type ? node.type:null;
    node.constraint = node.constraint ? node.constraint:"true"; //default to true for constraint

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

    /**
     * User method for read access to schema fields
     */
    getField(name:string):any{
        return this.node[name];
    }
}
