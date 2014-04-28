/**
* performs a bottom up traversal of a schema definition
*/
function annotate(model) {
    var api = new SchemaAPI();

    model.schema.root = annotate_schema(model.schema.json, null, api);
}
exports.annotate = annotate;

var SchemaNode = (function () {
    function SchemaNode() {
    }
    return SchemaNode;
})();
exports.SchemaNode = SchemaNode;

function annotate_schema(node, parent, api) {
    console.log("annotate_schema", node);

    //annotate_schema(node, null, api)
    return new SchemaNode();
}

/**
* provides hooks for meta-data to pragmatically generate constraints and predicates
*/
var SchemaAPI = (function () {
    function SchemaAPI() {
    }
    return SchemaAPI;
})();
exports.SchemaAPI = SchemaAPI;
//# sourceMappingURL=schema.js.map
