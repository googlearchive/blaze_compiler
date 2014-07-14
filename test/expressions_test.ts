/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
import expressions = require('../src/expression');
import Json = require('../src/processors/Json');

function translationTestCase(from:string, to:string, predicates: expressions.Predicates, test:nodeunit.Test){
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

export function testArrayLookup7(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev[child]]['fred'].val()",
        "newData.child(data.child('child').val()).child('fred').val()",
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
        "next.c1.val().contains('yo')",
        "newData.child('c1').val().contains('yo')",
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
        "root.child('superuser').val()==auth.id",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testCoercion2(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == root[next]",
        "auth.id==root.child(newData.val()).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var1(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == $userid",
        "auth.id==$userid",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var3(test:nodeunit.Test):void{
    translationTestCase(
        "prev[$userid].val()",
        "data.child($userid).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function test$var4(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "prev.$userid.val()",
        "data.child($userid).val()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testNow(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next < now",
        "newData.val()<now",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testRoot(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "root.users[auth.id].active == true",
        "root.child('users').child(auth.id).child('active').val()==true",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testHasChild(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next.hasChild('name')",
        "newData.hasChild('name')",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testHasChildren1(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next.hasChildren()",
        "newData.hasChildren()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testHasChildren2(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next.hasChildren(['name', 'age'])",
        "newData.hasChildren(['name', 'age'])",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testGetPriority(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next.getPriority() != null",
        "newData.getPriority()!=null",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testLength(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next.isString()&&next.val().length>=10",
        "newData.isString()&&newData.val().length>=10",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testBeginsWith(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "auth.identifier.beginsWith('internal-')",
        "auth.identifier.beginsWith('internal-')",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testEndsWith(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next.val().endsWith('internal-')",
        "newData.val().endsWith('internal-')",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testReplace(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "root.users[auth.email.replace('.', ',')].exists()",
        "root.child('users').child(auth.email.replace('.', ',')).exists()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testToLowerCase(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "root.users[auth.identifier.toLowerCase()].exists()",
        "root.child('users').child(auth.identifier.toLowerCase()).exists()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testToUpperCase(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "root.users[auth.identifier.toUpperCase()].exists()",
        "root.child('users').child(auth.identifier.toUpperCase()).exists()",
        new expressions.Predicates(),
        test
    );
    test.done();
}

function Predicate(dec: string, expr: string): expressions.Predicate {
    return new expressions.Predicate(dec, new Json.JString(expr, 0, 0))
}

export function testPredicateParsing1(test){
    var predicate = Predicate("f(x)", "true");

    test.ok(predicate.signature == "f(1)");
    test.done();
}
export function testPredicateParsing2(test){
    var predicate = Predicate("f()", "true");

    test.ok(predicate.signature == "f(0)");
    test.done();
}
export function testPredicateParsing3(test){
    var predicate = Predicate("f(x, y)", "true");
    test.equals(predicate.signature, "f(2)");
    test.deepEqual(predicate.parameter_map, ['x', 'y']);
    test.done();
}

export function testPredicate1(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "isLoggedIn()",
        "(auth.id==null)",
        expressions.Predicates.parse(
            Json.parse('[{"isLoggedIn()":"auth.id == null"}]')
        ),
        test
    );
    test.done();
}

export function testPredicate2(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "isEqual(prev, next.name)",
        "(data.val()==newData.child('name').val())",
        expressions.Predicates.parse(
            Json.parse('[{"isEqual(a, b)":"a == b"}]')
        ),
        test
    );
    test.done();
}

export function testPredicate3(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "isLoggedIn(auth)",
        "(auth.id=='yo')",
        expressions.Predicates.parse(
            Json.parse('[{"isLoggedIn(q)":"q.id == \'yo\'"}]')
        ),
        test
    );
    test.done();
}

export function testUnary(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "!isLoggedIn(auth)",
        "!(auth.id=='yo')",
        expressions.Predicates.parse(
            Json.parse('[{"isLoggedIn(q)":"q.id == \'yo\'"}]')
        ),
        test
    );
    test.done();
}

export function testSanitizeQuotes1(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "\"string\"=='string'",
        "\"string\"=='string'",
        new expressions.Predicates(),
        test
    );
    test.done();
}

export function testSanitizeQuotes2(test:nodeunit.Test):void{
    //bit weird this works
    translationTestCase(
        "next['string'] == prev[\"string\"]",
        'newData.child(\'string\').val()==data.child("string").val()',
        new expressions.Predicates(),
        test
    );
    test.done();
}
