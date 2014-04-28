import rules = require('../src/rules');

/**
 * performs a bottom up traversal of a schema definition
 */
export function annotate(model:rules.Rules){
    var api = new SchemaAPI();

    model.schema.root = annotate_schema(model.schema.json, null, api)
}

export class SchemaNode{
    properties:{[string]:SchemaNode}

}


function annotate_schema(node:any, parent:any, api:SchemaAPI):SchemaNode{
    console.log("annotate_schema", node);

    for(var key in node.properties){
        console.log("child", key)
    }

    //annotate_schema(node, null, api)
    return new SchemaNode()
}


/**
 * provides hooks for meta-data to pragmatically generate constraints and predicates
 */
export class SchemaAPI{
}
