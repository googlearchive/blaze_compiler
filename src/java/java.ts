require('source-map-support').install();
import schema = require('../schema');
import rules = require('../blaze');
import expression = require('../expression');
import fs = require('fs');
var TARGET: string = "model.java";
var DEBUG: boolean;

var TARGET_FIREBASE_URL: string = "https://firesafe-sandbox.firebaseio.com";

var PREAMBLE = fs.readFileSync("src/java/preamble.java").toString(); //todo move into js file
/**
 * from a compiled model of the rules, a typed java source file is created
 */
export function generate(model: rules.Rules, debug: boolean) {
    console.log("generating", TARGET);
    DEBUG = true; //debug;


    //big array we put all the output in
    var output: string[] = [];

    writeLine(PREAMBLE, 0, output);

    generate_path_class("root", model.schema.root, 0, output);

    fs.writeFile(TARGET, output.join("\n"));
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
function builderClassIdentifier(schema: schema.SchemaNode): string {
    return "root$" + schema.getPath().join("$") + "$Builder";
}
function valueClassIdentifier(schema: schema.SchemaNode): string {
    return "root$" + schema.getPath().join("$") + "$Value";
}


function generate_path_field(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    writeLine("public " + pathClassIdentifier(schema) + " " + name + " = new " + pathClassIdentifier(schema) + "();", depth, output);
}
function generate_path_wild_function(name: string, schema: schema.SchemaNode, depth: number, output: string[]) { //todo $("") thing
    writeLine("public " + pathClassIdentifier(schema) + " " + name + " = new " + pathClassIdentifier(schema) + "();", depth, output);
}
function generateRefConstructor(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    //todo binding of variables
    var classname = pathClassIdentifier(schema);
    writeLine(classname + "() {", depth, output);
    writeLine("  super(new Firebase(\"" + schema.getPath().join("/") + "\"));", depth, output);
    writeLine("}", depth, output);
}
function generate_buildValue(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    var valueClassname = builderClassIdentifier(schema) + "0";
    writeLine("public " + valueClassname + " buildValue() {", depth, output);
    writeLine("  return new " + valueClassname + "(this);", depth, output);
    writeLine("}", depth, output);
}
function generate_path_class(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {

    generateStepBuilder(name, schema, depth, output);
    generateValue(name, schema, depth, output);

    writeLine("class " + pathClassIdentifier(schema) + " extends Ref<" + builderClassIdentifier(schema) + "0" + "> {", depth, output);


    generateRefConstructor(name, schema, depth + 1, output);
    //for each non-wildchild child we generate a field to an instantiated child path_class
    //for wildchilds we create a function that instantiates the correct child path class

    var wildchild_key = null;

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            wildchild_key = child;
            generate_path_wild_function(child, schema.properties[child], depth + 1, output);
        } else {
            generate_path_field(child, schema.properties[child], depth + 1, output);
        }
    }

    //each path also exposes a ref
    generate_buildValue(name, schema, depth + 1, output);

    writeLine("}", depth, output);

    for (var child in schema.properties) {
        generate_path_class(child, schema.properties[child], depth, output);
    }
}

/**
 * The complicated bit. The process of building a value is a series of typed steps which force a valid object to have all required fields specified before writing is allowed
 * @param name
 * @param schema
 * @param depth
 * @param output
 */
function generateStepBuilder(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    //so first step is to work out the sequence if the user specifies every optional field
    //they specify the primitives, dropping into sub builders for complex objects,
    //wildchilds can be added multiple times by using a keyed subbuilder todo
    //the ordering is basically an inorder traversal of the schema node's properties
    var plan: PlanElement[] = [];
    planStepBuilderTop(name, schema, 0, plan);

    if (DEBUG) {
        for(var i =0; i < plan.length; i++) {
            writeLine("//" + plan[i].toString(), plan[i].depth, output);
        }
    }

    //second step is generating the classes based on the plan
    //for each step we check to see if we could skip ahead because the field was optional
    for(var i =0; i < plan.length; i++) {
        var p: PlanElement = plan[i];

        p.generatePlanStep(i, output);
    }

}

function generateValue(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    var classname = valueClassIdentifier(schema);
    writeLine("class " + classname + " extends Val {", depth, output);
    writeLine("  " + classname + "(SubBuilder prev) {", depth, output);
    writeLine("    super(prev);", depth, output);
    writeLine("  }", depth, output);
    writeLine("}", depth, output);
}

class PlanElement {
    static FIRST = "first";
    static LAST  = "last ";
    static START = "start";
    static END   = "end  ";
    static PRIMITIVE   = "prim ";
    constructor(public type: String, public rootSchema: schema.SchemaNode, public schema: schema.SchemaNode, public depth: number) {}
    toString() {
        return this.type + ": " + this.schema.key
    }

    generatePlanStep(index: number, output: string[]) {
        var className = builderClassIdentifier(this.rootSchema) + index;
        if (this.type == PlanElement.FIRST) {
            writeLine("class " + className + " extends SubBuilderIdentity {", 0, output);//constructor
            writeLine(className + "(Ref ref) {", 1, output);
            writeLine("  super(ref, null);", 1, output);
            writeLine("}", 1, output);
        } else if (this.type == PlanElement.LAST) {
            var valueReturnType = valueClassIdentifier(this.schema);
            writeLine("class " + className + " extends SubBuilderLast<Object, " + valueReturnType + "> {", 0, output);seperator(output);
            //constructor
            writeLine(className + "(SubBuilder prev, String key, Object val) {", 1, output);
            writeLine("  super(null, prev, key, val);", 1, output);
            writeLine("}", 1, output);
            this.generateValue(valueReturnType, output);
        } else if (this.type == PlanElement.START) {
            writeLine("class " + className + " extends SubBuilderIdentity {", 0, output);//constructor
            writeLine(className + "(SubBuilder parent) {", 1, output);
            writeLine("  super(parent.ref, parent);", 1, output);
            writeLine("}", 1, output);
        } else if (this.type == PlanElement.END) {
            var nextStep: number = (index+1);
            var valueReturnType = builderClassIdentifier(this.rootSchema) + nextStep;
            writeLine("class " + className + " extends SubBuilderLast<Object, " + valueReturnType + "> {", 0, output);seperator(output);
            //constructor
            writeLine(className + "(SubBuilder parent, SubBuilder prev, String key, Object val) {", 1, output);
            writeLine("  super(parent, prev, key, val);", 1, output);
            writeLine("}", 1, output);
            this.generateSubValue(valueReturnType, output);
        } else if (this.type == PlanElement.PRIMITIVE) {
            //constructor
            writeLine("class " + className + " extends SubBuilderIntermediate {", 0, output);
            writeLine(className + "(SubBuilder parent, SubBuilder prev, String key, Object val) {", 1, output);
            writeLine("  super(parent, prev, key, val);", 1, output);
            writeLine("}", 1, output);
        }
        writeLine("}", 0, output);
    }

    /*
    public root$child_string$Value value() {
        return new root$child_string$Value(this);
    }*/
    generateValue(returnType: string, output: string[]) {
        writeLine("public " + returnType + " value() {", 1, output);
        writeLine("  return new " + returnType + "(this);", 1, output);
        writeLine("}", 1, output);
    }
    generateSubValue(returnType: string, output: string[]) {
        writeLine("public " + returnType + " value() {", 1, output);
        writeLine("  return new " + returnType + "(parent.parent, parent, \"" + this.schema.key + "\", this.properties);", 1, output);
        writeLine("}", 1, output);
    }
}

function planStepBuilderTop(name: string, rootSchema: schema.SchemaNode, depth: number, plan: PlanElement[]) {
    planStepBuilder(name, rootSchema, rootSchema, depth, plan);
    if (plan[0].type == PlanElement.START)
        plan[0].type = PlanElement.FIRST;
    else
        plan.unshift(new PlanElement(PlanElement.FIRST, rootSchema, rootSchema, depth));
    plan[plan.length - 1].type = PlanElement.LAST;
}

function planStepBuilder(name: string, rootSchema: schema.SchemaNode, schema: schema.SchemaNode, depth: number, plan: PlanElement[]) {

    if (schema.type == "any" || schema.type == "object") {
        plan.push(new PlanElement(PlanElement.START, rootSchema, schema, depth));
        for (var child in schema.properties) {
            planStepBuilder(child, rootSchema, schema.properties[child], depth + 1, plan);
        }
        plan.push(new PlanElement(PlanElement.END, rootSchema, schema, depth));
    } else if (schema.type == "string" || schema.type == "number") {
        plan.push(new PlanElement(PlanElement.PRIMITIVE, rootSchema, schema, depth));
    } else {
        throw new Error("unrecognised type in schema: " + schema.type);
    }
}