var rules = require('../src/rules');
var expression = require('../src/expression');

var tv4 = require('tv4');
var fs = require('fs');

//todo
//refactor out traversals
/**
* performs a bottom up traversal of a schema definition, allowing each metaschema processor
* to generate constraints
*/
function annotate(model) {
    var api = new SchemaAPI();

    model.schema.root = annotate_schema(model.schema.json, null, api);
}
exports.annotate = annotate;

/**
* moves ancestors schema constraints to being explicitly being represented in leaf nodes
* this is done by leaves being the && concatenation of all ancestors
* next in a parent's context is next.parent() in the child context
*/
function flattenConstraints(model) {
    model.schema.root.flattenConstraints(null);
}
exports.flattenConstraints = flattenConstraints;

/**
* intergrates the ACL constraints into the schema
*/
function combineACL(model) {
    model.schema.root.combineACL(model.access, []);
}
exports.combineACL = combineACL;

/**
* intergrates the ACL constraints into the schema
*/
function generateRules(model) {
    var buffer = [];
    buffer.push('{\n');
    buffer.push('  "rules":');

    var symbols = new expression.Symbols();
    symbols.loadPredicate(model.predicates);

    model.schema.root.generate(symbols, "  ", buffer);
    buffer.push('}\n');

    //convert buffer into big string
    var code = buffer.join('');
    return code;
}
exports.generateRules = generateRules;

var SchemaNode = (function () {
    function SchemaNode() {
        this.properties = {};
    }
    SchemaNode.prototype.isLeaf = function () {
        return Object.keys(this.properties).length == 0;
    };
    SchemaNode.prototype.generate = function (symbols, prefix, buffer) {
        buffer.push('{\n');

        var comma_in_read_write = false;
        if (this.isLeaf()) {
            buffer.push(prefix + '  ".write":"');
            buffer.push(this.write.generate(symbols));
            buffer.push('",\n');
            buffer.push(prefix + '  ".read":"');
            buffer.push(this.read.generate(symbols));
            buffer.push('",\n');
            comma_in_read_write = true;
        }

        var comma_in_properties = false;

        for (var property in this.properties) {
            buffer.push(prefix + '  "' + property + '": ');
            this.properties[property].generate(symbols, prefix + "  ", buffer);

            buffer.pop(); //pop closing brace and continue with comma
            buffer.push('},\n');
            comma_in_properties = true;
        }

        //remove last trailing comma
        if (comma_in_properties) {
            buffer.pop();
            buffer.push("}\n");
        } else if (comma_in_read_write) {
            //else the comma was placed last at the ".read" statement
            buffer.pop();
            buffer.push('"\n');
        }

        buffer.push(prefix);
        buffer.push("}\n");

        return buffer;
    };

    /**
    * moves ancestors constraints to being explicitly being represented in leaf nodes
    * this is done by leaves being the && concatenation of all ancestors
    * next in a parent's context is next.parent() in the child context
    */
    SchemaNode.prototype.flattenConstraints = function (inherited_clause) {
        if (inherited_clause != null) {
            this.constraint = expression.Expression.parse("(" + inherited_clause.rewriteForChild() + ")&&(" + this.constraint.raw + ")");
        }

        for (var property in this.properties) {
            this.properties[property].flattenConstraints(this.constraint);
        }
    };

    SchemaNode.prototype.combineACL = function (acl, location) {
        console.log("combineACL", location);

        var write = "false";
        var read = "false";

        for (var idx in acl) {
            var entry = acl[idx];

            console.log("entry", entry.location);
            if (entry.match(location)) {
                write = "(" + write + ")||(" + entry.write.raw + ")";
                read = "(" + read + ")||(" + entry.read.raw + ")";
            }
        }

        //combine the write rules with the schema constraints
        this.write = expression.Expression.parse("(" + this.constraint.raw + ")&&(" + write + ")");
        this.read = expression.Expression.parse(read);

        for (var property in this.properties) {
            var child_location = location.concat(property);
            this.properties[property].combineACL(acl, child_location);
        }
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
    node.constraint = node.constraint ? node.constraint : "true"; //default to true for constraint

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

    /**
    * User method for read access to schema fields
    */
    SchemaAPI.prototype.getField = function (name) {
        return this.node[name];
    };
    return SchemaAPI;
})();
exports.SchemaAPI = SchemaAPI;
//# sourceMappingURL=schema.js.map
