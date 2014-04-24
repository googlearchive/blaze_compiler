/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
import expressions = require('../src/expression');

function translationTestCase(from:string, to:string, symbols:expressions.SymbolTable, test:nodeunit.Test){
    var expr = expressions.Expression.parse(from);

    var translation = expr.generate(symbols);

    test.equal(translation, to);
}


export function testArrayLookup1(test:nodeunit.Test):void{
    translationTestCase(
        "next['c1'].val()",
        "newData.child('c1').val()",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testArrayLookup2(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.val()",
        "newData.child('c1').val()",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testArrayLookup3(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.val()].val()",
        "newData.child(data.val()).val()",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testParent1(test:nodeunit.Test):void{
    translationTestCase(
        "next.parent()",
        "newData.parent()",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testParent2(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.parent().val()]['blah'].c1.val()",
        "newData.child(data.parent().val()).child('blah').child('c1').val()",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testHasChildren(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.hasChildren(['eric'])",
        "newData.child('c1').hasChildren(['eric'])",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}


export function testContains1(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.contains('yo')",
        "newData.child('c1').contains('yo')",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testContains2(test:nodeunit.Test):void{
    translationTestCase(
        "'yo'.contains('yo')",
        "'yo'.contains('yo')",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testContains3(test:nodeunit.Test):void{
    translationTestCase(
        "'yo'.contains(prev.val())",
        "'yo'.contains(data.val())",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}


export function testAuth1(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id",
        "auth.id",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testAuth2(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.id]",
        "root.child('users').child(auth.id)",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

export function testCoercion1(test:nodeunit.Test):void{
    translationTestCase(
        "root.superuser == auth.id",
        "root.child('superuser').val() == auth.id",
        new expressions.SymbolTable(),
        test
    );
    test.done();
}

