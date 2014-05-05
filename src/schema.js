var rules = require('../src/rules');
var expression = require('../src/expression');

var tv4 = require('tv4');
var fs = require('fs');

function annotate(model) {
    model.schema.root = annotate_schema(model.schema.json, null, null, new SchemaAPI(), model);
}
exports.annotate = annotate;

function pushDownConstraints(model) {
    model.schema.root.pushDownConstraints(null);
}
exports.pushDownConstraints = pushDownConstraints;

function pullUpConstraints(model) {
    model.schema.root.pullUpConstraints("");
}
exports.pullUpConstraints = pullUpConstraints;

function combineACL(model) {
    model.schema.root.combineACL(model.access, []);
}
exports.combineACL = combineACL;

function generateRules(model) {
    var buffer = [];
    buffer.push('{\n');
    buffer.push('  "rules":');

    var symbols = new expression.Symbols();
    symbols.loadPredicate(model.predicates);

    model.schema.root.generate(symbols, "  ", buffer);
    buffer.push('}\n');

    var code = buffer.join('');
    return code;
}
exports.generateRules = generateRules;

var SchemaNode = (function () {
    function SchemaNode(node) {
        this.properties = {};
        this.node = node;
    }
    SchemaNode.prototype.isLeaf = function () {
        return Object.keys(this.properties).length == 0;
    };
    SchemaNode.prototype.generate = function (symbols, prefix, buffer) {
        buffer.push('{\n');

        buffer.push(prefix + '  ".write":"');
        buffer.push(this.write.generate(symbols));
        buffer.push('",\n');
        buffer.push(prefix + '  ".read":"');
        buffer.push(this.read.generate(symbols));
        buffer.push('",\n');

        var comma_in_properties = false;

        for (var property in this.properties) {
            buffer.push(prefix + '  "' + property + '": ');
            this.properties[property].generate(symbols, prefix + "  ", buffer);

            buffer.pop();
            buffer.push('},\n');
            comma_in_properties = true;
        }

        if (!this.additionalProperties) {
            buffer.push(prefix + '  "$other":{".validate":"false"');
            buffer.push('GETS REMOVED');
            comma_in_properties = true;
        }

        if (comma_in_properties) {
            buffer.pop();
            buffer.push("}\n");
        } else {
            buffer.pop();
            buffer.push('"\n');
        }

        buffer.push(prefix);
        buffer.push("}\n");

        return buffer;
    };

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

        var children_clauses = "true";

        for (var property in this.properties) {
            children_clauses = "(" + children_clauses + ") && (" + this.properties[property].pullUpConstraints(property) + ")";
        }

        this.constraint = expression.Expression.parse(children_clauses);

        return this.constraint.rewriteForParent(child_name);
    };

    SchemaNode.prototype.combineACL = function (acl, location) {
        var write = "false";
        var read = "false";

        for (var idx in acl) {
            var entry = acl[idx];

            if (entry.match(location)) {
                write = "(" + write + ")||(" + entry.write.raw + ")";
                read = "(" + read + ")||(" + entry.read.raw + ")";
            }
        }

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
    SchemaNode.KEY_PATTERN = ".*";
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

function annotate_schema(node, parent, key, api, model) {
    if (node["$ref"]) {
        node = exports.fetchRef(node["$ref"], model);
    }

    var annotation = new SchemaNode(node);

    for (var key in node.properties) {
        annotation.properties[key] = annotate_schema(node.properties[key], node, key, api, model);
    }

    if (getWildchild(node)) {
        annotation.properties[getWildchild(node)] = annotate_schema(node[getWildchild(node)], node, key, api, model);

        node.patternProperties = {};
        node.patternProperties[SchemaNode.KEY_PATTERN] = node[getWildchild(node)];
    }

    api.setContext(node, parent, annotation, model);
    annotation.type = node.type ? node.type : null;
    node.constraint = node.constraint ? node.constraint : "true";
    annotation.additionalProperties = node.additionalProperties === undefined ? true : node.additionalProperties;
    annotation.examples = node.examples ? node.examples : [];
    annotation.nonexamples = node.nonexamples ? node.nonexamples : [];

    if (annotation.type != null) {
        if (api.metaschema[annotation.type] != undefined) {
            if (api.metaschema[annotation.type].validate(node)) {
                api.metaschema[annotation.type].compile(api);
            } else {
                throw new Error("type validation failed: " + JSON.stringify(node));
            }
        } else {
            console.error("unknown schema type:", annotation.type);
            throw new Error("unknown type specified");
        }
    } else {
        console.log(node);
        throw new Error("no defined type, this is not supported yet for node: ");
    }

    annotation.constraint = expression.Expression.parse(node.constraint);

    for (var example_index in annotation.examples) {
        var example = annotation.examples[example_index];

        var valid = tv4.validate(example, node, true, false);
        if (!valid) {
            throw new Error("example failed " + JSON.stringify(example) + " on " + JSON.stringify(node));
        }
    }

    for (var nonexample_index in annotation.nonexamples) {
        var nonexample = annotation.nonexamples[nonexample_index];

        var valid = tv4.validate(nonexample, node, true, false);
        if (valid) {
            throw new Error("nonexample erroneously passed " + JSON.stringify(nonexample) + " on " + JSON.stringify(node));
        }
    }

    return annotation;
}

function fetchRef(url, model) {
    console.log("fetchRef" + url);

    var baseUrl = url;
    var fragment = "";
    if (url.indexOf('#') !== -1) {
        fragment = url.substring(url.indexOf("#") + 1);
        baseUrl = url.substring(0, url.indexOf("#"));
    }
    var pointerPath = decodeURIComponent(fragment);

    if (pointerPath.charAt(0) !== "/") {
        return undefined;
    }

    var parts = pointerPath.split("/").slice(1);
    var schema = model.schema.json;

    for (var i = 0; i < parts.length; i++) {
        var component = parts[i].replace(/~1/g, "/").replace(/~0/g, "~");
        if (schema[component] === undefined) {
            schema = undefined;
            break;
        }
        schema = schema[component];
    }

    console.log(schema);
    return schema;
}
exports.fetchRef = fetchRef;

var SchemaAPI = (function () {
    function SchemaAPI() {
        this.metaschema = {};
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
    SchemaAPI.prototype.setContext = function (node, parent, annotationInProgress, model) {
        this.node = node;
        this.parent = parent;
        this.annotationInProgress = annotationInProgress;
        this.model = model;
    };

    SchemaAPI.prototype.addConstraint = function (expression) {
        this.node.constraint = "(" + this.node.constraint + ") && (" + expression + ")";
    };

    SchemaAPI.prototype.addProperty = function (name, json) {
        this.node[name] = json;

        var extra_annotator = new SchemaAPI();
        extra_annotator.setContext(json, this.node, this.annotationInProgress, this.model);

        this.annotationInProgress.properties[name] = annotate_schema(json, this.node, name, extra_annotator, this.model);
    };

    SchemaAPI.prototype.getField = function (name) {
        return this.node[name];
    };

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
