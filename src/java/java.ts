require('source-map-support').install();
import schema = require('../schema');
import rules = require('../blaze');
import expression = require('../expression');
import fs = require('fs');
import gen = require('./javasource');
var TARGET: string = "root.java";
var DEBUG: boolean;

/*
Built quickly for experiment week
Improvements:
Java code generation should be in another module and fluent, perhaps using something like https://github.com/UnquietCode/Flapi
Lots of short lived objects, maybe a better design is to use a single builder,
which exposes each step by returning an interface of itself (nested builders are still seperate objects). The builder tracks what stage it is in via a state counter

The state is basically what variables have been set so far and what will come next.

http://www.unquietcode.com/blog/2011/programming/using-generics-to-build-fluent-apis-in-java/
 */

var TARGET_FIREBASE_URL: string = "https://firesafe-sandbox.firebaseio.com";

var TEST = fs.readFileSync("src/java/test.java").toString(); //todo move into js file
/**
 * from a compiled model of the rules, a typed java source file is created
 */
export function generate(model: rules.Rules, target_dir: string, debug: boolean) {
    console.log("generating", TARGET);
    DEBUG = false; //debug;

    //big array we put all the output in
    var output: string[] = [];

    new gen.JFile()
        .setPackage("com.firebase.fluent")
        .addImport("com.firebase.client.Firebase")
        .addImport("java.util.HashMap")
        .addClass(generate_root(model.schema.root))
        .write(output);

    //writeLine(TEST, 0, output);
    fs.writeFile(target_dir + "/" + TARGET, output.join("\n"));
}

function writeLine(value: string, depth: number, output: string[]) {
    var prefix = Array(depth * 2).join(" ");
    var line = prefix + value;
    if (DEBUG) console.log(line);
    output.push(line);
}

function seperator(output: string[]) {
    if (DEBUG) console.log("");
    output.push("");
}

function pathClassIdentifier(schema: schema.SchemaNode): string {
    return "root$" + schema.getPath().join("$");
}
function stepInterfaceIdentifier(step: PlanElement): string {
    return "root$" + step.schema.getPath().join("$") + "_" + step.type;
}
function valueClassIdentifier(schema: schema.SchemaNode): string {
    return "root$" + schema.getPath().join("$") + "$Value";
}
function subValueClassIdentifier(schema: schema.SchemaNode): string {
    return "root$" + schema.getPath().join("$") + "$SubValue";
}

function camelConcatinate(a: string, b: string): string {
    if (b.charAt(0) == "$") {
        return a + "$" + b.charAt(1).toUpperCase() + b.slice(2);
    } else {
        return a + b.charAt(0).toUpperCase() + b.slice(1);
    }
}
function schemaToJavaTypes(schema: schema.SchemaNode): string[] {
    if (schema.type == "string") return ["String"];
    if (schema.type == "number") return ["Double", "Integer"];
}
function generatePathField(name: string, schema: schema.SchemaNode, class_prefix = ""): gen.JField {
    return new gen.JField()
        .setModifier(gen.Modifier.public)
        .setType(class_prefix + pathClassIdentifier(schema))
        .setName(name)
        .setInitializer("new " + class_prefix + pathClassIdentifier(schema) + "(this)");
}
function generateWildPathMethod(name: string, schema: schema.SchemaNode, class_prefix = ""): gen.JMethod {
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setType(class_prefix + pathClassIdentifier(schema))
        .setName(schema.key)
        .addParam(["String", "name"])
        .setBody(["return new " + pathClassIdentifier(schema) + "(this, name);"])

}
function generateRootPathField(name: string, schema: schema.SchemaNode, class_prefix, url: string): gen.JField {
    return new gen.JField()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setType(class_prefix + pathClassIdentifier(schema))
        .setName(name)
        .setInitializer("new " + class_prefix + pathClassIdentifier(schema) + "(new Path(new Firebase(\"" + url + "\")))");
}
function generateRootWildPathMethod(name: string, schema: schema.SchemaNode, class_prefix, url: string): gen.JMethod {
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setType(class_prefix + pathClassIdentifier(schema))
        .setName(schema.key)
        .addParam(["String", "name"])
        .setBody(["return new " + class_prefix + pathClassIdentifier(schema) + "(new Path(new Firebase(\"" + url + "\")), name);"])
}

function generatePathConstructor(schema: schema.SchemaNode): gen.JMethod {
    var method = new gen.JMethod()
        .setType("")
        .setName(pathClassIdentifier(schema))
        .addParam(["Path", "parent"]);

    if (schema.isWildchild()) return method
        .addParam(["String", "name"])
        .setBody(["super(parent, \"" + schema.key + "\", name);"]);
    else return method
        .setBody(["super(parent, \"" + schema.key + "\");"]);
}
function generateValConstructor(schema: schema.SchemaNode): gen.JMethod {
    //todo binding of variables
    return new gen.JMethod()
        .setName(valueClassIdentifier(schema))
        //.addParam([pathClassIdentifier(schema), "parent"])
        .addParam(["Path", "parent"])
        .setBody(["super(null, parent);"]); //todo this is wrong
}
function generateSubValConstructor(schema: schema.SchemaNode): gen.JMethod {
    return new gen.JMethod()
        .setName(subValueClassIdentifier(schema))
        .addParam(["Val", "parent"])
        .addParam(["Path", "path"])
        .setBody(["super(parent, path);"]);
}
function generateSubValWildConstructor(schema: schema.SchemaNode): gen.JMethod {
    return new gen.JMethod()
        .setName(subValueClassIdentifier(schema))
        .addParam(["Val", "parent"])
        .addParam(["Path", "path"])
        .addParam(["String", "name"])
        .setBody([
            "super(parent, path);",
            "this.name = name;"]);
}
function generateBeginWriteMethod(schema: schema.SchemaNode, plan: PlanElement[]): gen.JMethod {
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setType(stepInterfaceIdentifier(plan[0]))
        .setName("beginWrite")
        .setBody(["return new " + valueClassIdentifier(schema) + "(this);"]);
}
function generate_root_buildValue(schema: schema.SchemaNode): gen.JMethod {
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setType("_fluent_classes.root$." + stepInterfaceIdentifier(
            new PlanElement(PlanElement.FIRST, schema, schema, 0)))
        .setName("beginWrite")
        .setBody(["return new _fluent_classes.root$.root$$Value(new Path(new Firebase(\"\")));"]);
}

function generate_root(schema: schema.SchemaNode): gen.JClass {
    var _class = new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setName("root");

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            _class.addMethod(generateRootWildPathMethod(child, schema.properties[child], "_fluent_classes.root$.", "firebase.com"));
        } else {
            _class.addField(generateRootPathField(child, schema.properties[child], "_fluent_classes.root$.", "firebase.com"));
        }
    }

    //generate public classes inside the root scope, but within another static class so the IDE doesn't drown in options
    _class.addClass(new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName("_fluent_classes")
        .addClass(generate_path_class(_class, schema))
    );

    preamble_classes().map(_class.addClass.bind(_class));

    _class.addMethod(generate_root_buildValue(schema));

    return _class;
}


function preamble_classes(): gen.JClass[] {
    return [
        new gen.JClass().setModifier(gen.Modifier.public)
            .setStatic(true)
            .setName("Val")
            .addField(new gen.JField().setType("Path").setName("loc"))
            .addField(new gen.JField().setType("HashMap<String, Object>").setName("values").setInitializer("new HashMap<String, Object>()"))
            .addField(new gen.JField().setType("Val").setName("parent"))
            .addMethod(new gen.JMethod().setType("").setName("Val").addParam(["Val", "parent"]).addParam(["Path", "loc"])
                .setBody(["this.loc = loc;", "this.parent = parent;"])),
        new gen.JClass().setModifier(gen.Modifier.public)
            .setStatic(true)
            .setName("Path")
            .addField(new gen.JField().setType("Firebase").setName("ref"))
            .addField(new gen.JField().setType("HashMap<String, Object>").setName("bindings").setInitializer("new HashMap<String, Object>()"))
            .addMethod(new gen.JMethod().setType("").setName("Path").addParam(["Firebase", "ref"])
                .setBody(["this.ref = ref;"]))
            .addMethod(new gen.JMethod().setType("").setName("Path")
                .addParam(["Path", "parent"])
                .addParam(["String", "segment"])
                .setBody([
                    "this.ref = parent.ref.child(segment);"]))
            .addMethod(new gen.JMethod().setType("").setName("Path")
                .addParam(["Path", "parent"])
                .addParam(["String", "symbol"])
                .addParam(["String", "segment"])
                .setBody([
                    "this.bindings.put(symbol, segment);",
                    "this.ref = parent.ref.child(segment);",
                    "this.bindings.putAll(parent.bindings);"]))
    ];
}
function generate_path_class(parent: gen.JClass, schema: schema.SchemaNode): gen.JClass {
    var _class = new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName(pathClassIdentifier(schema))
        .addExtends("Path")
        .addMethod(generatePathConstructor(schema));

    if (schema.isLeaf()) {
        generate_primitiveWrites(schema).map(_class.addMethod.bind(_class));
    } else {
        var plan = planSteps("test", schema, 0);

        PlanElement.generateStepInterfaces(plan).forEach(function(i){_class.addClass(i)});
        //this also contains the interfaces and implementations
        _class.addClass(generateValueClass(schema, plan));
        _class.addMethod(generateBeginWriteMethod(schema, plan));
    }


    //for each non-wildchild child we generate a field to an instantiated child path_class
    //for wildchilds we create a function that instantiates the correct child path class
    var wildchild_key = null;

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            wildchild_key = child;
            _class.addMethod(generateWildPathMethod(child, schema.properties[child]));
        } else {
            _class.addField(generatePathField(child, schema.properties[child]));
        }
    }

    for (var child in schema.properties) {
        _class.addClass(generate_path_class(_class, schema.properties[child]));
    }

    return _class;
}

function generateValueClass(schema: schema.SchemaNode, plan: PlanElement[]): gen.JClass {

    var _class = new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName(valueClassIdentifier(schema))
        .addExtends("Val")
        .addMethod(generateValConstructor(schema));

    var stack: gen.JClass[]  = [];

    stack.push(_class);

    for (var stepN = 0; stepN < plan.length; stepN ++) {
        var step: PlanElement = plan[stepN];
        var parent: gen.JClass = stack[stack.length - 1];

        if (step.type == PlanElement.START) {
            var _subvalueClass = generateSubValueClass(step);

            stack[stack.length - 1].addClass(_subvalueClass);
            stack.push(_subvalueClass);
        }
        if (step.type == PlanElement.START_WILD) {
            var _subvalueClass = generateSubValueWildClass(step);

            stack[stack.length - 1].addClass(_subvalueClass);
            stack.push(_subvalueClass);
        }

        if (step.type == PlanElement.END || step.type == PlanElement.END_WILD) {
            stack.pop();
        }

        parent = stack[stack.length - 1];

        step.generateTransitions(stepN, plan).forEach(function(m: gen.JMethod) {
            if (!parent.containsMethod(m._name, m._params)) parent.addMethod(m);
        });

        parent.addImplements(stepInterfaceIdentifier(step));

    }

    return _class;
}

function generateSubValueClass(step: PlanElement) {
    return new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName(subValueClassIdentifier(step.schema))
        .addExtends("Val")
        .addField(new gen.JField()
            .setType("String").setStatic(true).setName("name").setInitializer("\"" + step.schema.key + "\""))
        .addMethod(generateSubValConstructor(step.schema));
}
function generateSubValueWildClass(step: PlanElement) {
    return new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName(subValueClassIdentifier(step.schema))
        .addExtends("Val")
        .addField(new gen.JField()
            .setType("String").setName("name"))
        .addMethod(generateSubValWildConstructor(step.schema));
}


class PlanElement {
    static FIRST = "first";
    static LAST  = "last";
    static START = "start";
    static END   = "end";
    static START_WILD = "startWild";
    static END_WILD = "endWild";
    static PRIMITIVE   = "prim";
    static SINGLE_PRIM = "singl";

    constructor(public type: String,
                public rootSchema: schema.SchemaNode,
                public schema: schema.SchemaNode,
                public depth: number,
                public required: Boolean = true) {

    }

    toString() {
        return this.type + ": " + this.schema.key
    }

    static generateStepInterfaces(plan: PlanElement[]): gen.JClass[] {
        var _interfaces: gen.JClass[] = [];
        for (var stepN=0; stepN < plan.length; stepN++) {
            _interfaces.push(PlanElement.generatePlanInterface(plan, stepN))
        }
        return _interfaces;
    }

    static generatePlanInterface(plan: PlanElement[], stepN: number): gen.JClass {
        var step: PlanElement =  plan[stepN];
        var _interface = new gen.JClass()
            .setModifier(gen.Modifier.public)
            .setInterface(true)
            .setName( stepInterfaceIdentifier(step));

        step.generateTransitionsStubs(stepN, plan).forEach(function(s) {_interface.addMethod(s);});
        return _interface;
    }

    generateTransitionsStubs(index: number, plan: PlanElement[]): gen.JMethod[] {
        var _stubs: gen.JMethod[] = [];

        var currentStep: PlanElement = plan[index];
        if (currentStep.type == PlanElement.END_WILD) {
            var start_i = index;
            var requiredStarts = 1;
            //rewind to find the start wild
            while (requiredStarts > 0) {
                start_i--;
                if (plan[start_i].type == PlanElement.END || plan[start_i].type == PlanElement.END_WILD) requiredStarts++;
                if (plan[start_i].type == PlanElement.START || plan[start_i].type == PlanElement.START_WILD) requiredStarts--;
            }
            var startWild = plan[start_i];

            var returnType   = stepInterfaceIdentifier(startWild);
            var functionname = camelConcatinate("open", startWild.schema.key);
            _stubs.push(new gen.JMethod()
                .setModifier(gen.Modifier.public)
                .setType(returnType)
                .setName(functionname)
                .addParam(["String", "name"])
            );

        }

        for (var i = index + 1; i < plan.length; i++) {
            var futureStep: PlanElement = plan[i];

            if (futureStep.type == PlanElement.PRIMITIVE) {
                var functionname = camelConcatinate("set", futureStep.schema.key);
                var returnType   = stepInterfaceIdentifier(futureStep);
                var types = schemaToJavaTypes(futureStep.schema);

                for (var t = 0; t < types.length; t++) {
                    var type: string = types[t];

                    _stubs.push(new gen.JMethod()
                        .setModifier(gen.Modifier.public)
                        .setType(returnType)
                        .setName(functionname)
                        .addParam([type, "val"])
                    );
                }
            }
            if (futureStep.type == PlanElement.LAST) {
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType("void")
                    .setName("write")
                );
            }
            if (futureStep.type == PlanElement.START) {
                var returnType   = stepInterfaceIdentifier(futureStep);
                var functionname = camelConcatinate("open", futureStep.schema.key);
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                );
            }
            if (futureStep.type == PlanElement.END || futureStep.type == PlanElement.END_WILD) {
                var returnType   = stepInterfaceIdentifier(futureStep);
                var functionname = camelConcatinate("close", futureStep.schema.key);
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                );
            }
            if (futureStep.type == PlanElement.START_WILD) {
                var returnType   = stepInterfaceIdentifier(futureStep);
                var functionname = camelConcatinate("open", futureStep.schema.key);
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                    .addParam(["String", "name"])
                );
            }

            if (futureStep.required) break; //we quit if we have to step to the next one
            if (futureStep.type == PlanElement.FIRST) break;  //we quit if we have to go up a level of context
            if (futureStep.type == PlanElement.END) break;  //we quit if we have to go up a level of context
            if (futureStep.type == PlanElement.LAST) break; //we quit if we have to go up a level of context

            //if a non required new context is following, we can skip it by fast forwarding to after
            while (plan[i].type == PlanElement.START || plan[i].type == PlanElement.START_WILD) {
                var requiredEnds = 1;
                while (requiredEnds > 0 ) {
                    i++;
                    if (plan[i].type == PlanElement.END || plan[i].type == PlanElement.END_WILD) requiredEnds--;
                    if (plan[i].type == PlanElement.START || plan[i].type == PlanElement.START_WILD) requiredEnds++;
                }
            }
        }
        return _stubs;
    }

    generateTransitions(index: number, plan: PlanElement[]): gen.JMethod[] {
        var transitions: gen.JMethod[] = [];

        for (var i = index + 1; i < plan.length; i++) {
            var futureStep: PlanElement = plan[i];

            if (futureStep.type == PlanElement.PRIMITIVE) {
                var functionname = camelConcatinate("set", futureStep.schema.key);
                var returnType   = stepInterfaceIdentifier(futureStep) + i;
                var types = schemaToJavaTypes(futureStep.schema);

                for (var t = 0; t < types.length; t++) {
                    var type: string = types[t];
                    transitions.push(new gen.JMethod()
                        .setModifier(gen.Modifier.public)
                        .setType(stepInterfaceIdentifier(futureStep))
                        .setName(functionname)
                        .addParam([type, "val"])
                        .setBody([
                                "this.values.put(\"" + futureStep.schema.key + "\", val);",
                                "return this;"]) //we need to
                    );

                }
            }
            if (futureStep.type == PlanElement.LAST) {
                var returnType   = valueClassIdentifier(futureStep.rootSchema);
                transitions.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType("void")
                    .setName("write")
                    .setBody(["this.loc.ref.setValue(values);"]));
            }
            if (futureStep.type == PlanElement.END) {
                var returnType   = stepInterfaceIdentifier(futureStep);
                var functionname = camelConcatinate("close", futureStep.schema.key);
                transitions.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                    .setBody([
                        "this.parent.values.put(" + subValueClassIdentifier(futureStep.schema) + ".name, this.values);",
                        "return (" + returnType + ") this.parent;"]));
            }
            if (futureStep.type == PlanElement.END_WILD) {
                var returnType   = stepInterfaceIdentifier(futureStep);
                var functionname = camelConcatinate("close", futureStep.schema.key);
                transitions.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                    .setBody([
                        "this.parent.values.put(this.name, this.values);",
                        "return (" + returnType + ") this.parent;"]));
            }
            if (futureStep.type == PlanElement.START) {
                var functionname = camelConcatinate("open", futureStep.schema.key);
                var returnType   = subValueClassIdentifier(futureStep.schema);
                transitions.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                    .setBody(["return new " + returnType + "(this, loc);"]));
            }
            if (futureStep.type == PlanElement.START_WILD) {
                var functionname = camelConcatinate("open", futureStep.schema.key);
                var returnType   = subValueClassIdentifier(futureStep.schema);
                transitions.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .addParam(["String", "name"])
                    .setName(functionname)
                    .setBody(["return new " + returnType + "(this, loc, name);"]));
            }

            if (futureStep.type == PlanElement.END) break;  //we quit if we have to go up a level of context
            if (futureStep.type == PlanElement.LAST) break; //we quit if we have to go up a level of context

            if (futureStep.required) break; //we quit if we have to step to the next one

            //if a non required new context is following, we can skip it by fast forwarding to after
            while (plan[i].type == PlanElement.START || plan[i].type == PlanElement.START_WILD) {
                var requiredEnds = 1;
                i++;
                while (requiredEnds > 0 ) {
                    if (plan[i].type == PlanElement.END || plan[i].type == PlanElement.END_WILD) requiredEnds--;
                    if (plan[i].type == PlanElement.START || plan[i].type == PlanElement.START_WILD) requiredEnds++;
                    i++;
                }
            }
        }

        return transitions;
    }
}


function generate_primitiveWrites(schema: schema.SchemaNode): gen.JMethod[] {
    var types = schemaToJavaTypes(schema);
    return types.map(function(type: string) {
        return new gen.JMethod()
            .setModifier(gen.Modifier.public)
            .setType("void")
            .setName("write")
            .addParam([type, "value"])
            .setBody(["ref.setValue(value);"]);
    });
}

function planSteps(name: string, rootSchema: schema.SchemaNode, depth: number): PlanElement[] {
    var plan: PlanElement[] = [];
    planStep(name, rootSchema, rootSchema, depth, plan);
    if (plan[0].type == PlanElement.START){
        plan[0].type = PlanElement.FIRST;
        plan[plan.length - 1].type = PlanElement.LAST;
    } else {
        //not a complex object
        plan[0].type = PlanElement.SINGLE_PRIM;
    }
    return plan;
}

function planStep(name: string, rootSchema: schema.SchemaNode, schema: schema.SchemaNode, depth: number, plan: PlanElement[]) {
    var requiredArray: string[] = schema.parent == null ? [] : schema.parent.required.toJSON();
    var required: boolean = requiredArray.indexOf(name) >= 0;

    if ((schema.type == "any" || schema.type == "object") && name.indexOf("$") != 0) {
        plan.push(new PlanElement(PlanElement.START, rootSchema, schema, depth, required));
        for (var child in schema.properties) {
            planStep(child, rootSchema, schema.properties[child], depth + 1, plan);
        }
        plan.push(new PlanElement(PlanElement.END, rootSchema, schema, depth));
    } else if ((schema.type == "any" || schema.type == "object") && name.indexOf("$") == 0) {
        //wildcard case
        plan.push(new PlanElement(PlanElement.START_WILD, rootSchema, schema, depth, false));
        for (var child in schema.properties) {
            planStep(child, rootSchema, schema.properties[child], depth + 1, plan);
        }
        plan.push(new PlanElement(PlanElement.END_WILD, rootSchema, schema, depth));
    }else if (schema.type == "string" || schema.type == "number") {
        plan.push(new PlanElement(PlanElement.PRIMITIVE, rootSchema, schema, depth, required));
    } else {
        throw new Error("unrecognised type in schema: " + schema.type);
    }
}