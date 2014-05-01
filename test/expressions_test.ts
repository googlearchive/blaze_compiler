/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
import expressions = require('../src/expression');

function translationTestCase(from:string, to:string, predicates:expressions.Predicates, test:nodeunit.Test){
    var expr = expressions.Expression.parse(from);

    var symbols:expressions.Symbols = new expressions.Symbols();
    symbols.predicates = predicates;
    var translation = expr.generate(symbols);

    test.equal(translation, to);
}


export function testArrayLookup1(test:nodeunit.Test):void{
    translationTestCase(
        "next['c1'].val()",
        "newData.child('c1').val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testArrayLookup2(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.val()",
        "newData.child('c1').val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testArrayLookup3(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.val()].val()",
        "newData.child(data.val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testArrayLookup4(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev].val()",
        "newData.child(data.val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testArrayLookup5(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.child].val()",
        "newData.child(data.child('child').val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testArrayLookup6(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev[child]].val()",
        "newData.child(data.child('child').val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testParent1(test:nodeunit.Test):void{
    translationTestCase(
        "next.parent()",
        "newData.parent()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testParent2(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.parent().val()]['blah'].c1.val()",
        "newData.child(data.parent().val()).child('blah').child('c1').val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testHasChildren(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.hasChildren(['eric'])",
        "newData.child('c1').hasChildren(['eric'])",
        new expressions.Predicates(),
        test
    );
    test.done();
}


export function testContains1(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.contains('yo')",
        "newData.child('c1').contains('yo')",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testContains2(test:nodeunit.Test):void{
    translationTestCase(
        "'yo'.contains('yo')",
        "'yo'.contains('yo')",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testContains3(test:nodeunit.Test):void{
    translationTestCase(
        "'yo'.contains(prev.val())",
        "'yo'.contains(data.val())",
        new expressions.Predicates(),
        test
    );
    test.done();
}


export function testAuth1(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id",
        "auth.id",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testAuth2(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.id]",
        "root.child('users').child(auth.id)",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testCoercion1(test:nodeunit.Test):void{
    translationTestCase(
        "root.superuser == auth.id",
        "root.child('superuser').val() == auth.id",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testCoercion2(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == root[next]",
        "auth.id == root.child(newData.val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var1(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == $userid.val()",
        "auth.id == $userid.val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var2(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == $userid",
        "auth.id == $userid.val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var3(test:nodeunit.Test):void{
    translationTestCase(
        "prev[$userid].val()",
        "data.child($userid.val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var4(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "prev.$userid.val()",
        "data.child($userid.val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testPredicate1(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "isLoggedIn()",
        "(auth.id == null)",
        expressions.Predicates.parse(
            [{"isLoggedIn()":"auth.id == null"}]
        ),
        test
    );
    test.done();
}

export function testPredicate2(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "isEqual(prev, next.name)",
        "(data.val() == newData.child('name').val())",
        expressions.Predicates.parse(
            [{"isEqual(a, b)":"a == b"}]
        ),
        test
    );
    test.done();
}

export function testPredicate3(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "isLoggedIn(auth)",
        "(auth.id == 'yo')",
        expressions.Predicates.parse(
            [{"isLoggedIn(q)":"q.id == 'yo'"}]
        ),
        test
    );
    test.done();
}

export function testUnary(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "!isLoggedIn(auth)",
        "!(auth.id == 'yo')",
        expressions.Predicates.parse(
            [{"isLoggedIn(q)":"q.id == 'yo'"}]
        ),
        test
    );
    test.done();
}

