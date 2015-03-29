
export enum Modifier {public, private, protected, none}

export function writeStatement(statement: string, output: string[], indent: number) {
    writeLine(statement + ";", output, indent);
}
export function writeLine(statement: string, output: string[], indent: number) {
    var prefix = Array(indent).join('\t');
    output.push(prefix + statement);
}
export function write(statement: string, output: string[], indent: number = 0) {
    var prefix = Array(indent).join('\t');
    output[output.length - 1] = output[output.length - 1] + (prefix + statement);
}

export function modifierString(modifier: Modifier): string {
    if (modifier == Modifier.none) return "";
    else return Modifier[modifier] + " ";
}

export class JFile {
    _package: string;
    _imports: string[] = [];
    _classes: JClass[] = [];

    setPackage(_package: string): JFile {
        this._package = _package;
        return this;
    }
    addImport(_import: string): JFile {
        this._imports.push(_import);
        return this;
    }
    addClass(_class: JClass): JFile {
        this._classes.push(_class);
        return this;
    }

    write(output: string[], indent: number = 0) {
        writeStatement("package " + this._package, output, indent);
        this._imports.forEach(function(_import: string) {
            writeStatement("import " + _import, output, indent);
        });
        this._classes.forEach(function(_class: JClass) {
            _class.write(output, indent + 1);
        });
    }
}

export class JClass {
    _modifier: Modifier = Modifier.none;
    _static: boolean = false;
    _name: string;
    _extends: string[] = [];
    _implements: string[] = [];
    _fields: JField[] = [];
    _methods: JMethod[] = [];
    _classes: JClass[] = [];
    _isInterface: boolean = false;

    setModifier(_modifier: Modifier): JClass {
        this._modifier = _modifier;
        return this;
    }
    setStatic(_static: boolean): JClass {
        this._static = _static;
        return this;
    }
    setName(_name: string): JClass {
        this._name = _name;
        return this;
    }
    addExtends(_extends: string): JClass {
        this._extends.push(_extends);
        return this;
    }
    addImplements(_implements: string): JClass {
        this._implements.push(_implements);
        return this;
    }
    addField(_field: JField): JClass {
        this._fields.push(_field);
        return this;
    }
    addMethod(_method: JMethod): JClass {
        this._methods.push(_method);
        return this;
    }
    addClass(_class: JClass): JClass {
        this._classes.push(_class);
        return this;
    }
    setInterface(_isInterface: boolean): JClass {
        this._isInterface = _isInterface;
        return this;
    }

    write(output: string[], indent: number = 0) {
        writeLine(modifierString(this._modifier), output, indent);

        if (this._static) write("static ", output);

        if (this._isInterface) {
            write("interface ", output);
        } else {
            write("class ", output);
        }
        write(this._name + " ", output);

        if (this._extends.length) {
            write("extends ", output);
            var extendClauses: string[] = [];
            this._extends.forEach(function(_extend: string) {
                extendClauses.push(_extend);
            });
            write(extendClauses.join(", "), output);
        }

        if (this._implements.length) {
            write("implements ", output);
            var implementsClauses: string[] = [];
            this._implements.forEach(function(_implement: string) {
                implementsClauses.push(_implement);
            });
            write(implementsClauses.join(", "), output);
        }

        write(" {", output);

        this._fields.forEach(function(_field: JField) {
            _field.write(output, indent + 1);
        });

        this._methods.forEach(function(_method: JMethod) {
            _method.write(output, indent + 1);
        });

        this._classes.forEach(function(_class: JClass) {
            _class.write(output, indent + 1);
        });

        writeLine("}", output, indent);
    }
}

export class JField {
    _modifier: Modifier = Modifier.none;
    _static: boolean = false;
    _name: string;
    _type: string;
    _initializer: string;

    setModifier(_modifier: Modifier): JField {
        this._modifier = _modifier;
        return this;
    }
    setStatic(_static: boolean): JField {
        this._static = _static;
        return this;
    }
    setName(_name: string): JField {
        this._name = _name;
        return this;
    }
    setType(_type: string): JField {
        this._type = _type;
        return this;
    }
    setInitializer(_initializer: string): JField {
        this._initializer = _initializer;
        return this;
    }

    write(output: string[], indent: number) {
        writeLine(modifierString(this._modifier), output, indent);
        if (this._static) write("static ", output);
        write(this._type + " ", output);
        write(this._name + " ", output);
        if (this._initializer) write(" = " + this._initializer, output);
        write(";", output);
    }
}

export class JMethod {
    _modifier: Modifier = Modifier.none;
    _static: boolean = false;
    _name: string;
    _type: string;
    _body: string[] = [];
    _params: [string, string][] = []; //array of [dec, name] pairs

    setModifier(_modifier: Modifier): JMethod {
        this._modifier = _modifier;
        return this;
    }
    setStatic(_static: boolean): JMethod {
        this._static = _static;
        return this;
    }
    setName(_name: string): JMethod {
        this._name = _name;
        return this;
    }
    setType(_type: string): JMethod {
        this._type = _type;
        return this;
    }
    setBody(_lines: string[]): JMethod {
        this._body = _lines;
        return this;
    }
    addParam(_param: [string, string]): JMethod {
        this._params.push(_param);
        return this;
    }

    write(output: string[], indent: number) {
        writeLine(modifierString(this._modifier), output, indent);
        if (this._static) write("static ", output);
        write(this._type + " ", output);
        write(this._name + "(", output);
        var paramDecs: string[] = [];
        this._params.forEach(function(_param: [string, string]) {
            paramDecs.push(_param[0] + " " + _param[1]);
        });
        write(paramDecs.join(", "), output);

        write(") {\n", output);
        this._body.forEach(function(_line: string) {
            writeLine(_line, output, indent + 1);
        });
        writeLine("}", output, indent);
    }
}