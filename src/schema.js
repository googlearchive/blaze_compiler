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
* pushes ancestors schema constraints to being explicitly being represented in leaf nodes
* this is done by leaves being the && concatenation of all ancestors
* next in a parent's context is next.parent() in the child context
*/
function pushDownConstraints(model) {
    model.schema.root.pushDownConstraints(null);
}
exports.pushDownConstraints = pushDownConstraints;

/**
* pulls full leaf schema constraints upwards. ancestors constraints are overwritten
* by the && concatenation of all children
*/
function pullUpConstraints(model) {
    model.schema.root.pullUpConstraints("");
}
exports.pullUpConstraints = pullUpConstraints;

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

        //var comma_in_read_write = false;
        //if(this.isLeaf()){
        buffer.push(prefix + '  ".write":"');
        buffer.push(this.write.generate(symbols));
        buffer.push('",\n');
        buffer.push(prefix + '  ".read":"');
        buffer.push(this.read.generate(symbols));
        buffer.push('",\n');

        //comma_in_read_write = true;
        //}
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
        } else {
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
    SchemaNode.prototype.pushDownConstraints = function (inherited_clause) {
        if (inherited_clause != null) {
            this.constraint = expression.Expression.parse("(" + inherited_clause.rewriteForChild() + ")&&(" + this.constraint.raw + ")");
        }

        for (var property in this.properties) {
            this.properties[property].pushDownConstraints(this.constraint);
        }
    };

    SchemaNode.prototype.pullUpConstraints = function (child_name) {
        if (this.isLeaf())
            return this.constraint.rewriteForParent(child_name);

        //recurse first for bottom up
        var children_clauses = "true";

        for (var property in this.properties) {
            children_clauses = "(" + children_clauses + ") && (" + this.properties[property].pullUpConstraints(property) + ")";
        }

        this.constraint = expression.Expression.parse(children_clauses);

        return this.constraint.rewriteForParent(child_name);
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

    SchemaNode.prototype.getWildchild = function () {
        return getWildchild(this.properties);
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

    if (getWildchild(node)) {
        annotation.properties[getWildchild(node)] = annotate_schema(node[getWildchild(node)], node, api);
    }

    api.setContext(node, parent);
    annotation.type = node.type ? node.type : null;
    node.constraint = node.constraint ? node.constraint : "true"; //default to true for constraint

    if (annotation.type != null) {
        if (api.metaschema[annotation.type] != undefined) {
            if (api.metaschema[annotation.type].validate(node)) {
                api.metaschema[annotation.type].compile(api);
            } else {
                console.error(node, "is not a valid", annotation.type);
            }
        } else {
            console.error("unknown schema type:", annotation.type);
        }
    } else {
        //user has not defined type
        console.log(node);
        throw new Error("no defined type, this is not supported yet for node: ");
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
        console.log(this.node);
        return this.node[name];
    };

    /**
    * user method for retrieving the wildchild's name for this node
    * call getField(getWildchild()) if you want the wildchilds schema node
    * @returns {string}
    */
    SchemaAPI.prototype.getWildchild = function () {
        return getWildchild(this.node);
    };
    return SchemaAPI;
})();
exports.SchemaAPI = SchemaAPI;

function getWildchild(node) {
    var wildchild = null;
    for (var name in node) {
        if (name.indexOf("$") == 0) {
            if (wildchild == null)
                wildchild = name;
            else {
                throw Error("more than one wildchild defined");
            }
        }
    }
    return wildchild;
}
//# sourceMappingURL=schema.js.map
