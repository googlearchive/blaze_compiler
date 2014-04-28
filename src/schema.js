var rules = require('../src/rules');

var tv4 = require('tv4');
var fs = require('fs');

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
        this.properties = {};
    }
    return SchemaNode;
})();
exports.SchemaNode = SchemaNode;

var MetaSchema = (function () {
    function MetaSchema() {
    }
    MetaSchema.prototype.validate = function (node) {
        var result = tv4.validateResult(node, this.validator);

        if (!result.valid) {
            console.log(result.error);
        }

        if (tv4.getMissingUris().length != 0) {
            console.log(tv4.getMissingUris());
            return false;
        }

        return result.valid;
    };

    MetaSchema.parse = function (json) {
        var result = new MetaSchema();
        result.validator = json.validator;

        return result;
    };
    return MetaSchema;
})();
exports.MetaSchema = MetaSchema;

function annotate_schema(node, parent, api) {
    console.log("annotate_schema", node);

    for (var key in node.properties) {
        console.log("child", key);
        node.properties[key] = annotate_schema(node.properties[key], node, api);
    }

    var annotation = new SchemaNode();

    annotation.type = node.type ? node.type : null;

    if (annotation.type != null) {
        if (api.metaschema[annotation.type] != undefined) {
            if (api.metaschema[annotation.type].validate(node)) {
            } else {
                console.error(node, "is not a valid", annotation.type);
            }
        } else {
            console.error("unknown schema type:", annotation.type);
        }
    }

    return annotation;
}

/**
* provides hooks for meta-data to pragmatically generate constraints and predicates
*/
var SchemaAPI = (function () {
    function SchemaAPI() {
        this.metaschema = {};
        //load all built in schema definitions from schema directory
        var files = fs.readdirSync("schema/metaschema");
        for (var i in files) {
            if (!files.hasOwnProperty(i))
                continue;
            var name = "schema/metaschema" + '/' + files[i];
            var metaschema_def = rules.load_yaml(name);

            console.log("loading built in type", metaschema_def.name, "into metaschema");

            this.metaschema[metaschema_def.name] = MetaSchema.parse(metaschema_def);
        }
    }
    return SchemaAPI;
})();
exports.SchemaAPI = SchemaAPI;
//# sourceMappingURL=schema.js.map
