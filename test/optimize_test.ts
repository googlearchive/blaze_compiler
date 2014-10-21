/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
import optimizer = require('../src/optimizer');


export function testSimplify1(test:nodeunit.Test):void{
    var unoptimized:string = "true && (false && (true && false) && (true && false) && true)";
    var optimized = optimizer.simplify(unoptimized);
    console.log(optimized);
    //it be nice if this expanded to just && but because of lazy evaluation is not actually equivalent in general
    test.notEqual(unoptimized, optimized);
    test.ok(optimized.length < unoptimized.length, "no improvement");
    test.done();
}

export function testSimplify2(test:nodeunit.Test):void{
    var unoptimized:string = "5 / (7 * 6)";
    var optimized = optimizer.simplify(unoptimized);
    test.equal(optimized, "5/(7*6)");
    test.done();
}

export function testSimplify3(test:nodeunit.Test):void{
    var unoptimized:string = "(5 / 6) * 7";
    var optimized = optimizer.simplify(unoptimized);
    test.equal(optimized, "5/6*7");
    test.done();
}

export function testSanitizeQuotes0(test:nodeunit.Test): void{
    //single quote string are fine as is
    var unoptimized: string = "a == ''";
    var optimized = optimizer.sanitizeQuotes(unoptimized);
    test.equal(optimized, "a == ''");
    test.done();
}

export function testSanitizeQuotes1(test:nodeunit.Test): void{
    //double quote needs to be moved into a single quote string
    var unoptimized: string = "a == \"\"";
    var optimized = optimizer.sanitizeQuotes(unoptimized);
    test.equal(optimized, "a == ''");
    test.done();
}

export function testSanitizeQuotes2(test:nodeunit.Test): void{
    //unescaped single quote needs to be escaped when moved into a single quote string
    var unoptimized: string = "a == \"'\"";
    var optimized = optimizer.sanitizeQuotes(unoptimized);
    test.equal(optimized, "a == '\\''");
    test.done();
}

export function testSanitizeQuotes3(test:nodeunit.Test): void{
    //escaped double quote can stay as is
    var unoptimized: string = 'a == "\\""';
    var optimized = optimizer.sanitizeQuotes(unoptimized);
    //test.equal(optimized, "a == '\\\"'");  <- what I expected by falafel must be processing
    test.equal(optimized, "a == '\"'");    //<-- still valid construction though
    test.done();
}

export function testSanitizeQuotes4(test:nodeunit.Test): void{
    //escaped double quote can stay as is
    var unoptimized: string = 'a == "" || b == \'\'';
    var optimized = optimizer.sanitizeQuotes(unoptimized);
    test.equal(optimized, "a == '' || b == ''");
    test.done();
}

export function testSanitizeQuotes5(test:nodeunit.Test): void{
    //escaped double quote can stay as is
    var unoptimized: string = 'a == "\'\'"';
    var optimized = optimizer.sanitizeQuotes(unoptimized);
    test.equal(optimized, "a == '\\'\\''");
    test.done();
}

export function testEscapeQuotes1(test:nodeunit.Test): void{
    //single quotes must be escaped
    test.equal(optimizer.escapeSingleQuotes("'"), "\\'");
    test.done();
}

export function testEscapeQuotes2(test:nodeunit.Test): void{
    //single quotes must be escaped
    test.equal(optimizer.escapeSingleQuotes("''"), "\\'\\'");
    test.done();
}

export function testEscapeEscapes1(test:nodeunit.Test): void{
    //regex is escaped
    var unoptimized: string = '/\\d/';
    var optimized = optimizer.escapeEscapes(unoptimized);
    test.equal(optimized, "/\\\\d/");
    test.done();
}

export function testPrune(test:nodeunit.Test): void{
    test.equal(optimizer.pruneBooleanLiterals("!true"), "false");
    test.equal(optimizer.pruneBooleanLiterals("!false"), "true");

    test.equal(optimizer.pruneBooleanLiterals("true && true"), "true");
    test.equal(optimizer.pruneBooleanLiterals("true && false"), "false");
    test.equal(optimizer.pruneBooleanLiterals("false && true"), "false");
    test.equal(optimizer.pruneBooleanLiterals("false && false"), "false");

    test.equal(optimizer.pruneBooleanLiterals("true && f"), "(f)");
    test.equal(optimizer.pruneBooleanLiterals("f && true"), "(f)");
    test.equal(optimizer.pruneBooleanLiterals("false && f"), "false");
    test.equal(optimizer.pruneBooleanLiterals("f && false"), "false");


    test.equal(optimizer.pruneBooleanLiterals("true || f"), "true");
    test.equal(optimizer.pruneBooleanLiterals("f || true"), "true");
    test.equal(optimizer.pruneBooleanLiterals("false || f"), "(f)");
    test.equal(optimizer.pruneBooleanLiterals("f || false"), "(f)");

    test.done();
}

export function testChildParentAnnihilation(test:nodeunit.Test): void{
    test.equal(optimizer.childParentAnnihilation("data.child('x').parent().val()"), "data.val()");

    test.done();
}

export function testClauseRepetitionElimination(test:nodeunit.Test): void{
    test.equal(optimizer.clauseRepetitionElimination("a && a"), "((a))"); //bit weird with parenthesis
    test.equal(optimizer.clauseRepetitionElimination("a || a"), "((a))");
    test.equal(optimizer.clauseRepetitionElimination("a && b && a"), "(a&&b)");
    test.equal(optimizer.clauseRepetitionElimination("a && b && b && a && c && a"), "(a&&b&&c)");
    test.equal(optimizer.clauseRepetitionElimination("d && b && b && a && c && a"), "(d&&b&&a&&c)");
    test.equal(optimizer.clauseRepetitionElimination("d || b || b || a || c || a"), "(d||b||a||c)");

    test.done();
}

