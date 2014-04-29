var rules = require('../src/rules');
var expression = require('../src/expression');

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
    SchemaNode.prototype.generate = function (symbols, prefix, buffer) {
        buffer.push("{\n");

        buffer.push(prefix + "  '.write':");
        buffer.push(this.constraint.generate(symbols));
        buffer.push("\n");

        for (var property in this.properties) {
            buffer.push(prefix + "  '" + property + "': ");
            this.properties[property].generate(symbols, prefix + "  ", buffer);
        }

        buffer.push(prefix);
        buffer.push("}\n");
    };
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
        result.compile = new Function("api", json.compile);

        return result;
    };
    return MetaSchema;
})();
exports.MetaSchema = MetaSchema;

function annotate_schema(node, parent, api) {
    //console.log("annotate_schema", node);
    var annotation = new SchemaNode();

    for (var key in node.properties) {
        annotation.properties[key] = annotate_schema(node.properties[key], node, api);
    }

    annotation.type = node.type ? node.type : null;

    if (annotation.type != null) {
        if (api.metaschema[annotation.type] != undefined) {
            if (api.metaschema[annotation.type].validate(node)) {
                api.setContext(node, parent);
                api.metaschema[annotation.type].compile(api);
            } else {
                console.error(node, "is not a valid", annotation.type);
            }
        } else {
            console.error("unknown schema type:", annotation.type);
        }
    }

    annotation.constraint = expression.Expression.parse(node.constraint);

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
    /**
    * before the metaschema is given a hook for adding constraints, this method is called to
    * point the api at the right schema instances
    * @param node
    * @param parent
    */
    SchemaAPI.prototype.setContext = function (node, parent) {
        this.node = node;
        this.parent = parent;
    };

    /**
    * User method for adding a type specific constraint, the constraint is &&ed to the current constraints
    */
    SchemaAPI.prototype.addConstraint = function (expression) {
        this.node.constraint = "(" + this.node.constraint + ") && (" + expression + ")";
    };
    return SchemaAPI;
})();
exports.SchemaAPI = SchemaAPI;
//# sourceMappingURL=schema.js.map
