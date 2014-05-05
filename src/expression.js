var falafel = require("falafel");

var XRegExp = require('xregexp').XRegExp;

var Predicate = (function () {
    function Predicate(declaration, expression) {
        var match = XRegExp.exec(declaration, Predicate.DECLARATION_FORMAT);
        var params = XRegExp.split(match.paramlist, /\s*,\s*/);

        if (params.length == 1 && params[0] == '')
            params = [];

        this.identifier = match.name;
        this.signature = match.name + "(" + params.length + ")";

        this.parameter_map = params;

        this.expression = Expression.parse(expression);
    }
    Predicate.parse = function (json) {
        for (var key in json) {
            var predicate = new Predicate(key, json[key]);
        }
        return predicate;
    };
    Predicate.DECLARATION_FORMAT = XRegExp('(?<name>\\w+) \\s* # name is alphanumeric\n' + '\\( \\s*  #open brace for function args  \n' + '(?<paramlist> (\\w+\\s*(,\\s*\\w+\\s*)*)?) #comma seperated list of params\n' + '\\) \\s*  #close brace for function args \n', 'gx');
    return Predicate;
})();
exports.Predicate = Predicate;

var Predicates = (function () {
    function Predicates() {
    }
    Predicates.parse = function (json) {
        var predicates = new Predicates();

        for (var predicate_def in json) {
            var predicate = Predicate.parse(json[predicate_def]);
            predicates[predicate.identifier] = predicate;
        }
        return predicates;
    };
    return Predicates;
})();
exports.Predicates = Predicates;

var Symbols = (function () {
    function Symbols() {
        this.predicates = {};
        this.variables = {};
    }
    Symbols.prototype.clone = function () {
        var clone = new Symbols();
        for (var p in this.predicates)
            clone.predicates[p] = this.predicates[p];
        for (var v in this.variables)
            clone.variables[v] = this.variables[v];
        return clone;
    };

    Symbols.prototype.loadPredicate = function (predicates) {
        for (var identifier in predicates) {
            this.predicates[identifier] = predicates[identifier];
        }
    };
    return Symbols;
})();
exports.Symbols = Symbols;

var Expression = (function () {
    function Expression() {
    }
    Expression.parse = function (raw) {
        var expr = new Expression();
        expr.raw = raw;
        return expr;
    };

    Expression.prototype.rewriteForChild = function () {
        var falafel_visitor = function (node) {
            if (node.type == "Identifier") {
                if (node.name == "next") {
                    node.update("next.parent()");
                } else if (node.name == "prev") {
                    node.update("prev.parent()");
                }
            }
        };

        return falafel(this.raw, {}, falafel_visitor);
    };

    Expression.prototype.rewriteForParent = function (child_name) {
        if (child_name.indexOf("$") == 0)
            return "false";

        var falafel_visitor = function (node) {
            if (node.type == "Identifier") {
                if (node.name == "next") {
                    node.update("next['" + child_name + "']");
                } else if (node.name == "prev") {
                    node.update("prev['" + child_name + "']");
                }
            }
        };

        return falafel(this.raw, {}, falafel_visitor);
    };

    Expression.prototype.generate = function (symbols) {
        var falafel_visitor = function (node) {
            if (node.type == "Identifier") {
                if (node.name == "next") {
                    node.update("newData");
                    node.expr_type = "rule";
                } else if (node.name == "prev") {
                    node.update("data");
                    node.expr_type = "rule";
                } else if (node.name == "root") {
                    node.expr_type = "rule";
                } else if (node.name.indexOf("$") == 0) {
                    node.expr_type = "rule";
                } else if (node.name == "auth") {
                    node.expr_type = "map";
                } else if (symbols.predicates[node.name]) {
                    node.expr_type = "pred";
                } else if (symbols.variables[node.name]) {
                    node.update(symbols.variables[node.name].source());
                    node.expr_type = symbols.variables[node.name].expr_type;
                }
            } else if (node.type == "Literal") {
                node.expr_type = "value";
            } else if (node.type == "ArrayExpression") {
                node.expr_type = "value";
            } else if (node.type == "MemberExpression") {
                if (node.object.expr_type == "rule") {
                    node.expr_type = null;

                    if (node.property.type == 'Identifier') {
                        if (node.property.name == 'val') {
                            node.expr_type = "fun():value";
                        } else if (node.property.name == 'parent') {
                            node.expr_type = "fun():rule";
                        } else if (node.property.name == 'hasChildren') {
                            node.expr_type = "fun(array):rule";
                        } else if (node.property.name == 'contains') {
                            node.expr_type = "fun(value):value";
                        } else if (node.property.name == 'isString') {
                            node.expr_type = "fun():value";
                        } else if (node.property.name == 'isBoolean') {
                            node.expr_type = "fun():value";
                        } else if (node.property.name == 'isNumber') {
                            node.expr_type = "fun():value";
                        } else if (node.property.name == 'exists') {
                            node.expr_type = "fun():value";
                        } else if (node.property.expr_type == 'rule') {
                            node.update(node.object.source() + ".child(" + node.property.source() + ".val())");
                            node.expr_type = "rule";
                        } else {
                            node.update(node.object.source() + ".child('" + node.property.source() + "')");
                            node.expr_type = "rule";
                        }
                    } else if (node.property.expr_type == 'rule') {
                        node.update(node.object.source() + ".child(" + node.property.source() + ".val())");
                        node.expr_type = "rule";
                    } else if (node.property.expr_type == 'value') {
                        node.update(node.object.source() + ".child(" + node.property.source() + ")");
                        node.expr_type = "rule";
                    }
                } else if (node.object.expr_type == "map") {
                    node.expr_type = "value";
                }
            } else if (node.type == "CallExpression") {
                if (node.callee.expr_type === "fun():rule") {
                    node.expr_type = "rule";
                } else if (node.callee.expr_type === "fun():value") {
                    node.expr_type = "value";
                } else if (node.callee.expr_type === "fun(array):rule") {
                    node.expr_type = "value";
                } else if (node.callee.expr_type === "fun(value):value") {
                    node.expr_type = "value";
                } else if (node.callee.expr_type === "pred") {
                    var predicate = symbols.predicates[node.callee.name];

                    var predicate_symbols = symbols.clone();

                    var params = node.arguments;
                    for (var p_index in params) {
                        var p_node = params[p_index];
                        var local_name = predicate.parameter_map[p_index];
                        predicate_symbols.variables[local_name] = p_node;
                    }

                    var expansion = predicate.expression.generate(predicate_symbols);

                    node.update("(" + expansion + ")");
                    node.expr_type = "value";
                }
            } else if (node.type == "BinaryExpression" || node.type == "BooleanExpression" || node.type == "LogicalExpression") {
                if (node.left.expr_type === "rule") {
                    node.left.update(node.left.source() + ".val()");
                }

                if (node.right.expr_type === "rule") {
                    node.right.update(node.right.source() + ".val()");
                }

                node.expr_type = "value";
            } else if (node.type == "UnaryExpression") {
                node.expr_type = node.argument.expr_type;
            } else if (node.type == "ExpressionStatement") {
            } else if (node.type == "Program") {
            } else {
                console.log("error ", node.type);
                throw "Unrecognised Type";
            }
        };

        var code = falafel(this.raw, {}, falafel_visitor);

        return code;
    };
    return Expression;
})();
exports.Expression = Expression;
//# sourceMappingURL=expression.js.map
