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
        .addImport("java.util.Map")
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
function builderClassIdentifier(step: PlanElement): string {
    return "root$" + step.schema.getPath().join("$") + "_" + step.type;
}
function valueClassIdentifier(schema: schema.SchemaNode): string {
    return "root$" + schema.getPath().join("$") + "$Value";
}

function camelConcatinate(a: string, b: string): string {

    return a + b.charAt(0).toUpperCase() + b.slice(1);
}
function schemaToJavaTypes(schema: schema.SchemaNode): string[] {
    if (schema.type == "string") return ["String"];
    if (schema.type == "number") return ["Double", "Integer"];
}
function generate_path_field(name: string, schema: schema.SchemaNode, isStatic: boolean = false, class_prefix = ""): gen.JField {
    //var modifier = isStatic?"static ": "";
    //writeLine("public " + modifier + class_prefix + pathClassIdentifier(schema) + " " + name + " = new " + class_prefix + pathClassIdentifier(schema) + "();", depth, output);
    return new gen.JField()
        .setModifier(gen.Modifier.public)
        .setStatic(isStatic)
        .setType(class_prefix + pathClassIdentifier(schema))
        .setName(name)
        .setInitializer("new " + class_prefix + pathClassIdentifier(schema) + "()");
}
function generate_path_wild_function(name: string, schema: schema.SchemaNode, depth: number, output: string[], isStatic: boolean = false, class_prefix = "") {
    //var modifier = isStatic?"static ": "";
    //writeLine("public " + modifier + class_prefix + pathClassIdentifier(schema) + " $(String key) {return null;}", depth, output); //todo implementation
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setStatic(isStatic)
        .setType(class_prefix + pathClassIdentifier(schema))
        .setName("$")
        .addParam(["String", "key"])
        .setBody(["return null;)"])
        .write(output, depth);

}
function generateRefConstructor(schema: schema.SchemaNode): gen.JMethod {
    //todo binding of variables
    return new gen.JMethod()
        .setType("")
        .setName(pathClassIdentifier(schema))
        .setBody(["super(new Firebase(\"" + schema.getPath().join("/") + "\"));"]); //todo this is wrong
}
function generateValConstructor(schema: schema.SchemaNode): gen.JMethod {
    //todo binding of variables
    return new gen.JMethod()
        .setName(valueClassIdentifier(schema))
        //.addParam([pathClassIdentifier(schema), "parent"])
        .addParam(["Path", "parent"])
        .setBody(["super(null, parent);"]); //todo this is wrong
}
function generate_startWriteMethod(schema: schema.SchemaNode): gen.JMethod {
    //todo
    //this should instanciate an Val object and return the correct interface to it

    /*
    var valueClassname = builderClassIdentifier(schema) + "0";
    writeLine("public " + valueClassname + " startWrite() {", depth, output);
    writeLine("  return new " + valueClassname + "(this);", depth, output);
    writeLine("}", depth, output);
    */
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setType(valueClassIdentifier(schema))
        .setName("startWrite")
        .setBody(["return new " + valueClassIdentifier(schema) + "(new " + pathClassIdentifier(schema) + "());"]);
}
function generate_root_buildValue(schema: schema.SchemaNode): gen.JMethod {
    return new gen.JMethod()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        //.setType("_fluent_classes." + builderClassIdentifier(schema) + "0")
        .setName("startWrite")
        .setBody(["return new _fluent_classes.root$$Builder0(new _fluent_classes.root$());"]);
}

function generate_root(schema: schema.SchemaNode): gen.JClass {
    //writeLine("public class root {", depth, output);

    var _class = new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setName("root");

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            //generate_path_wild_function(child, schema.properties[child], depth + 1, output, true, "_fluent_classes.");
        } else {
            _class.addField(generate_path_field(child, schema.properties[child], true, "_fluent_classes."));
        }
    }

    //generate public classes inside the root scope, but within another static class so the IDE doesn't drown in option
    _class.addClass(new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName("_fluent_classes")
        .addClass(generate_path_class(_class, schema))
    );


    preamble_classes().map(_class.addClass.bind(_class));

    _class.addMethod(generate_root_buildValue(schema));
    //writeLine("}", depth, output);
    return _class;
}


function preamble_classes(): gen.JClass[] {
    return [
        new gen.JClass().setModifier(gen.Modifier.public)
            .setStatic(true)
            .setName("Val")
            .addField(new gen.JField().setType("Path").setName("loc"))
            //.addField(new gen.JField().setType("HashMap<String, Object>").setName("values").setInitializer("new HashMap<String, Object>()"))
            .addField(new gen.JField().setType("Val").setName("parent"))
            .addMethod(new gen.JMethod().setType("").setName("Val").addParam(["Val", "parent"]).addParam(["Path", "loc"])
                .setBody(["this.loc = loc;", "this.parent = parent;"])),
        new gen.JClass().setModifier(gen.Modifier.public)
            .setStatic(true)
            .setName("Path")
            .addField(new gen.JField().setType("Firebase").setName("ref"))
            .addMethod(new gen.JMethod().setType("").setName("Path").addParam(["Firebase", "ref"])
                .setBody(["this.ref = ref;"]))
            .addMethod(new gen.JMethod().setType("").setName("Path").addParam(["Path", "parent"]).addParam(["String", "segment"])
                .setBody(["this.ref = parent.ref.child(segment);"]))
    ];
}
function generate_path_class(parent: gen.JClass, schema: schema.SchemaNode): gen.JClass {
    var _class = new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName(pathClassIdentifier(schema))
        .addExtends("Path")
        .addMethod(generateRefConstructor(schema));

    //generateStepBuilder();

    if (schema.isLeaf()) {
        generate_primitiveWrites(schema).map(_class.addMethod.bind(_class));
    } else {
        var plan = planSteps("test", schema, 0);

        _class.addClass(generateValueClass(schema));

        //for each step in the plan
        //we generate an interface, which exposes only the methods to the next steps that are valid
        var interfaces = PlanElement.generatePlanInterfaces(plan);

        interfaces.forEach(function(i) {_class.addClass(i);});

        _class.addMethod(generate_startWriteMethod(schema));

    }


    //for each non-wildchild child we generate a field to an instantiated child path_class
    //for wildchilds we create a function that instantiates the correct child path class
    var wildchild_key = null;

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            wildchild_key = child;
            //generate_path_wild_function(child, schema.properties[child], depth + 1, output);
        } else {
            _class.addField(generate_path_field(child, schema.properties[child]));
        }
    }

    for (var child in schema.properties) {
        _class.addClass(generate_path_class(_class, schema.properties[child]));
    }

    return _class;
}

function generateValueClass(schema: schema.SchemaNode): gen.JClass {
    //todo this will be considerably more complicated
    //var primitive: PlanElement = generateStepBuilder(name, schema, depth, output);

    var _class = new gen.JClass()
        .setModifier(gen.Modifier.public)
        .setStatic(true)
        .setName(valueClassIdentifier(schema))
        .addExtends("Val")
        .addMethod(generateValConstructor(schema));

    return _class;
}

/**
 * The complicated bit. The process of building a value is a series of typed steps which force a valid object to have all required fields specified before writing is allowed
 * @param name
 * @param schema
 * @param depth
 * @param output
 * @return is non-null if that plan was a single primative invocation, therefore the parent should not generate a buildObject
 */
function generateStepBuilder(name: string, schema: schema.SchemaNode, depth: number, output: string[]): PlanElement {
    //so first step is to work out the sequence if the user specifies every optional field
    //they specify the primitives, dropping into sub builders for complex objects,
    //wildchilds can be added multiple times by using a keyed subbuilder todo
    //the ordering is basically an inorder traversal of the schema node's properties
    var plan: PlanElement[] = [];
    //planStepBuilderTop(name, schema, 0, plan);

    if (DEBUG) {
        for(var i =0; i < plan.length; i++) {
            writeLine("//" + plan[i].toString(), plan[i].depth, output);
        }
    }

    //second step is generating the classes based on the plan
    //for each step we check to see if we could skip ahead because the field was optional
    for(var i =0; i < plan.length; i++) {
        var p: PlanElement = plan[i];

        p.generatePlanStep(i, plan, output);
    }

    if (plan.length == 1) return plan[0];
}

class PlanElement {
    static FIRST = "first";
    static LAST  = "last ";
    static START = "start";
    static END   = "end  ";
    static PRIMITIVE   = "prim ";
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

    static generatePlanInterfaces(plan: PlanElement[]): gen.JClass[] {
        var _interfaces: gen.JClass[] = [];
        for (var stepN=0; stepN < plan.length; stepN++) {
            var step: PlanElement =  plan[stepN];

            var _interface = new gen.JClass()
                .setModifier(gen.Modifier.public)
                .setInterface(true)
                .setName(builderClassIdentifier(step));

            step.generateTransitionsStubs(stepN, plan).forEach(function(s) {_interface.addMethod(s);});

            _interfaces.push(_interface)
        }
        return _interfaces;
    }

    generateTransitionsStubs(index: number, plan: PlanElement[]): gen.JMethod[] {
        var _stubs: gen.JMethod[] = [];

        for (var i = index + 1; i < plan.length; i++) {
            var futureStep: PlanElement = plan[i];

            if (futureStep.type == PlanElement.PRIMITIVE) {
                var functionname = camelConcatinate("set", futureStep.schema.key);
                var returnType   = builderClassIdentifier(futureStep);
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
                var returnType   = valueClassIdentifier(futureStep.rootSchema);
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName("write")
                );
            }
            if (futureStep.type == PlanElement.END) {
                var returnType   = builderClassIdentifier(futureStep);
                var functionname = camelConcatinate("close", futureStep.schema.key);
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                );
            }
            if (futureStep.type == PlanElement.START && futureStep.schema.key.indexOf("$") != 0) {
                var returnType   = builderClassIdentifier(futureStep);
                var functionname = camelConcatinate("open", futureStep.schema.key);
                _stubs.push(new gen.JMethod()
                    .setModifier(gen.Modifier.public)
                    .setType(returnType)
                    .setName(functionname)
                );
            }

            if (futureStep.required) break; //we quit if we have to step to the next one
            if (futureStep.type == PlanElement.FIRST) break;  //we quit if we have to go up a level of context
            if (futureStep.type == PlanElement.END) break;  //we quit if we have to go up a level of context
            if (futureStep.type == PlanElement.LAST) break; //we quit if we have to go up a level of context

            //if a non required new context is following, we can skip it by fast forwarding to after
            if (futureStep.type == PlanElement.START) {
                var requiredEnds = 1;
                i++;
                while (requiredEnds > 0 ) {
                    if (plan[i].type == PlanElement.END) requiredEnds--;
                    if (plan[i].type == PlanElement.START) requiredEnds++;
                    i++;
                }
            }
        }
        return _stubs;
    }

    generatePlanStep(index: number, plan: PlanElement[], output: string[]) {
        var className = builderClassIdentifier(this) + index;
        if (this.type == PlanElement.FIRST) {
            writeLine("public static class " + className + " extends SubBuilderIdentity {", 0, output);//constructor
            writeLine(className + "(Ref ref) {", 1, output);
            writeLine("  super(ref, null);", 1, output);
            writeLine("}", 1, output);
            this.generateTransitions(index, plan, output);

            writeLine("}", 0, output);
        } else if (this.type == PlanElement.LAST) {
            var valueReturnType = valueClassIdentifier(this.schema);
            writeLine("public static class " + className + " extends SubBuilderLast<" + valueReturnType + "> {", 0, output);seperator(output);
            //constructor
            writeLine(className + "(SubBuilder prev) {", 1, output);
            writeLine("  super(null, prev);", 1, output);
            writeLine("}", 1, output);
            this.generateValue(valueReturnType, output);

            writeLine("}", 0, output);
        } else if (this.type == PlanElement.START) {
            writeLine("public static class " + className + " extends SubBuilderIdentity {", 0, output);//constructor
            writeLine(className + "(SubBuilder parent) {", 1, output);
            writeLine("  super(parent.ref, parent);", 1, output);
            writeLine("}", 1, output);
            this.generateTransitions(index, plan, output);

            writeLine("}", 0, output);
        } else if (this.type == PlanElement.END) {
            var valueReturnType = valueClassIdentifier(this.rootSchema);
            writeLine("public static class " + className + " extends SubBuilderLast<" + valueReturnType + "> {", 0, output);seperator(output);
            //constructor
            writeLine(className + "(SubBuilder parent, SubBuilder prev) {", 1, output);
            writeLine("  super(parent, prev);", 1, output);
            writeLine("}", 1, output);
            this.generateSubValue(valueReturnType, output);

            writeLine("}", 0, output);
        } else if (this.type == PlanElement.PRIMITIVE) {
            //constructor
            writeLine("public static class " + className + " extends SubBuilderIntermediate {", 0, output);
            writeLine(className + "(SubBuilder parent, SubBuilder prev, String key, Object val) {", 1, output);
            writeLine("  super(parent, prev, key, val);", 1, output);
            writeLine("}", 1, output);
            this.generateTransitions(index, plan, output);

            writeLine("}", 0, output);
        }
    }

    generateValue(returnType: string, output: string[]) {
        writeLine("public " + returnType + " value() {", 1, output);
        writeLine("  return new " + returnType + "(this);", 1, output);
        writeLine("}", 1, output);
    }
    generateSubValue(returnType: string, output: string[]) {
        writeLine("public " + returnType + " write() {", 1, output);
        writeLine("  return new " + returnType + "(this);", 1, output);
        writeLine("}", 1, output);
    }
    generateTransitions(index: number, plan: PlanElement[], output: string[]) {
        for (var i = index + 1; i < plan.length; i++) {
            var futurePlanElement: PlanElement = plan[i];

            if (futurePlanElement.type == PlanElement.PRIMITIVE) {
                var functionname = camelConcatinate("set", futurePlanElement.schema.key);
                var returnType   = builderClassIdentifier(futurePlanElement) + i;
                var types = schemaToJavaTypes(futurePlanElement.schema);

                for (var t = 0; t < types.length; t++) {
                    var type: string = types[t];
                    writeLine("public " + returnType + " " + functionname + "(" + type + " val) {", 1, output);
                    writeLine("  return new " + returnType + "(parent.parent, parent, \"" + futurePlanElement.schema.key + "\", val);", 1, output);
                    writeLine("}", 1, output);
                }
            }
            if (futurePlanElement.type == PlanElement.LAST) {
                var returnType   = valueClassIdentifier(futurePlanElement.rootSchema);
                writeLine("public " + returnType + " " + "write() {", 1, output);
                writeLine("  return new " + returnType + "(parent.parent);", 1, output);
                writeLine("}", 1, output);
            }
            if (futurePlanElement.type == PlanElement.END) {
                var returnType   = builderClassIdentifier(futurePlanElement) + i;
                var functionname = camelConcatinate("close", futurePlanElement.schema.key);
                writeLine("public " + returnType + " " + functionname + "() {", 1, output);
                writeLine("  return new " + returnType + "(parent.parent, parent);", 1, output);
                writeLine("}", 1, output);
            }
            if (futurePlanElement.type == PlanElement.START && futurePlanElement.schema.key.indexOf("$") != 0) {
                var functionname = camelConcatinate("open", futurePlanElement.schema.key);
                var returnType   = builderClassIdentifier(futurePlanElement) + i;
                writeLine("public " + returnType + " " + functionname + "() {", 1, output);
                writeLine("  return new " + returnType + "(this);", 1, output);
                writeLine("}", 1, output);
            }

            if (futurePlanElement.required) break; //we quit if we have to step to the next one
            if (futurePlanElement.type == PlanElement.FIRST) break;  //we quit if we have to go up a level of context
            if (futurePlanElement.type == PlanElement.END) break;  //we quit if we have to go up a level of context
            if (futurePlanElement.type == PlanElement.LAST) break; //we quit if we have to go up a level of context

            //if a non required new context is following, we can skip it by fast forwarding to after
            if (futurePlanElement.type == PlanElement.START) {
                while (plan[i].type != PlanElement.END) i++;
            }
        }
    }
}


function generate_primitiveWrites(schema: schema.SchemaNode): gen.JMethod[] {
    var types = schemaToJavaTypes(schema);
    return types.map(function(type: string) {
        return new gen.JMethod()
            .setModifier(gen.Modifier.public)
            .setType("void")
            .setName("write")
            .addParam([type, "value"]);
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

    if (schema.type == "any" || schema.type == "object") {
        plan.push(new PlanElement(PlanElement.START, rootSchema, schema, depth, required));
        for (var child in schema.properties) {
            planStep(child, rootSchema, schema.properties[child], depth + 1, plan);
        }
        plan.push(new PlanElement(PlanElement.END, rootSchema, schema, depth));
    } else if (schema.type == "string" || schema.type == "number") {
        plan.push(new PlanElement(PlanElement.PRIMITIVE, rootSchema, schema, depth, required));
    } else {
        throw new Error("unrecognised type in schema: " + schema.type);
    }
}