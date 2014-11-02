/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
import expressions = require('../src/expression');
import Json = require('source-processor');

function translationTestCase(from:string, to:string, functions: expressions.Functions, test:nodeunit.Test){
    var expr = expressions.Expression.parse(from);

    var symbols:expressions.Symbols = new expressions.Symbols();
    symbols.functions = functions;
    var translation = expr.generate(symbols);

    test.equal(translation, to);
}


export function testArrayLookup1(test:nodeunit.Test):void{
    translationTestCase(
        "next['c1'].val()",
        "newData.child('c1').val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testArrayLookup2(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.val()",
        "newData.child('c1').val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testArrayLookup3(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.val()].val()",
        "newData.child(data.val()).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testArrayLookup4(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev].val()",
        "newData.child(data.val()).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testArrayLookup5(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.child].val()",
        "newData.child(data.child('child').val()).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testArrayLookup6(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev[child]].val()",
        "newData.child(data.child('child').val()).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testArrayLookup7(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev[child]]['fred'].val()",
        "newData.child(data.child('child').val()).child('fred').val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testParent1(test:nodeunit.Test):void{
    translationTestCase(
        "next.parent()",
        "newData.parent()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testParent2(test:nodeunit.Test):void{
    translationTestCase(
        "next[prev.parent().val()]['blah'].c1.val()",
        "newData.child(data.parent().val()).child('blah').child('c1').val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testHasChildren(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.hasChildren(['eric'])",
        "newData.child('c1').hasChildren(['eric'])",
        new expressions.Functions(),
        test
    );
    test.done();
}


export function testContains1(test:nodeunit.Test):void{
    translationTestCase(
        "next.c1.val().contains('yo')",
        "newData.child('c1').val().contains('yo')",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testContains2(test:nodeunit.Test):void{
    translationTestCase(
        "'yo'.contains('yo')",
        "'yo'.contains('yo')",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testContains3(test:nodeunit.Test):void{
    translationTestCase(
        "'yo'.contains(prev.val())",
        "'yo'.contains(data.val())",
        new expressions.Functions(),
        test
    );
    test.done();
}


export function testAuth1(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id",
        "auth.id",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testAuth2(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.id]",
        "root.child('users').child(auth.id)",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testCoercion1(test:nodeunit.Test):void{
    translationTestCase(
        "root.superuser == auth.id",
        "root.child('superuser').val()==auth.id",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testCoercion2(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == root[next]",
        "auth.id==root.child(newData.val()).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function test$var1(test:nodeunit.Test):void{
    translationTestCase(
        "auth.id == $userid",
        "auth.id==$userid",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function test$var3(test:nodeunit.Test):void{
    translationTestCase(
        "prev[$userid].val()",
        "data.child($userid).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function test$var4(test:nodeunit.Test):void{
    translationTestCase(
        "prev.$userid.val()",
        "data.child($userid).val()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testNow(test:nodeunit.Test):void{
    translationTestCase(
        "next < now",
        "newData.val()<now",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testRoot(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.id].active == true",
        "root.child('users').child(auth.id).child('active').val()==true",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testHasChild(test:nodeunit.Test):void{
    translationTestCase(
        "next.hasChild('name')",
        "newData.hasChild('name')",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testHasChildren1(test:nodeunit.Test):void{
    translationTestCase(
        "next.hasChildren()",
        "newData.hasChildren()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testHasChildren2(test:nodeunit.Test):void{
    translationTestCase(
        "next.hasChildren(['name', 'age'])",
        "newData.hasChildren(['name', 'age'])",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testGetPriority(test:nodeunit.Test):void{
    translationTestCase(
        "next.getPriority() != null",
        "newData.getPriority()!=null",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testLength(test:nodeunit.Test):void{
    translationTestCase(
        "next.isString()&&next.val().length>=10",
        "newData.isString()&&newData.val().length>=10",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testBeginsWith(test:nodeunit.Test):void{
    translationTestCase(
        "auth.identifier.beginsWith('internal-')",
        "auth.identifier.beginsWith('internal-')",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testEndsWith(test:nodeunit.Test):void{
    translationTestCase(
        "next.val().endsWith('internal-')",
        "newData.val().endsWith('internal-')",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testReplace(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.email.replace('.', ',')].exists()",
        "root.child('users').child(auth.email.replace('.', ',')).exists()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testToLowerCase(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.identifier.toLowerCase()].exists()",
        "root.child('users').child(auth.identifier.toLowerCase()).exists()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testToUpperCase(test:nodeunit.Test):void{
    translationTestCase(
        "root.users[auth.identifier.toUpperCase()].exists()",
        "root.child('users').child(auth.identifier.toUpperCase()).exists()",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testRegex1(test:nodeunit.Test):void{
    translationTestCase(
        "/regex/",
        "/regex/",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testRegex2(test:nodeunit.Test):void{
    translationTestCase(
        "/\\d/",
        "/\\d/",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testRegex3(test:nodeunit.Test):void{
    translationTestCase(
        "/\\\\d/",
        "/\\\\d/",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testRegex4(test:nodeunit.Test):void{
    translationTestCase(
        "root.val().matches(/regex/)",
        "root.val().matches(/regex/)", //this second version needs to be safe inside a ""
        new expressions.Functions(),
        test
    );
    test.done();
}

function Function(dec: string, expr: string): expressions.Function {
    return new expressions.Function(dec, new Json.JString(expr, 0, 0))
}

export function testFunctionParsing1(test){
    var predicate = Function("f(x)", "true");

    test.ok(predicate.signature == "f(1)");
    test.done();
}
export function testFunctionParsing2(test){
    var predicate = Function("f()", "true");

    test.ok(predicate.signature == "f(0)");
    test.done();
}
export function testFunctionParsing3(test){
    var predicate = Function("f(x, y)", "true");
    test.equals(predicate.signature, "f(2)");
    test.deepEqual(predicate.parameter_map, ['x', 'y']);
    test.done();
}

export function testFunction1(test:nodeunit.Test):void {
    translationTestCase(
        "isLoggedIn()",
        "(auth.id==null)",
        expressions.Functions.parse(
            Json.parse('[{"isLoggedIn()":"auth.id == null"}]')
        ),
        test
    );
    test.done();
}

export function testFunction2(test:nodeunit.Test):void {
    translationTestCase(
        "isEqual(prev, next.name)",
        "(data.val()==newData.child('name').val())",
        expressions.Functions.parse(
            Json.parse('[{"isEqual(a, b)":"a == b"}]')
        ),
        test
    );
    test.done();
}

export function testFunction3(test:nodeunit.Test):void {
    translationTestCase(
        "isLoggedIn(auth)",
        "(auth.id=='yo')",
        expressions.Functions.parse(
            Json.parse('[{"isLoggedIn(q)":"q.id == \'yo\'"}]')
        ),
        test
    );
    test.done();
}

export function testUnary(test:nodeunit.Test):void {
    translationTestCase(
        "!isLoggedIn(auth)",
        "!(auth.id=='yo')",
        expressions.Functions.parse(
            Json.parse('[{"isLoggedIn(q)":"q.id == \'yo\'"}]')
        ),
        test
    );
    test.done();
}

export function testSanitizeQuotes1(test:nodeunit.Test):void {
    translationTestCase(
        "\"string\"=='string'",
        "\"string\"=='string'",
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testSanitizeQuotes2(test:nodeunit.Test):void {
    translationTestCase(
        "next['string'] == prev[\"string\"]",
        'newData.child(\'string\').val()==data.child("string").val()',
        new expressions.Functions(),
        test
    );
    test.done();
}

export function testRewriteForChild(test:nodeunit.Test):void {
    var expr = expressions.Expression.parse("true");
    var rewrite = expr.rewriteForChild().toString();
    test.equals(rewrite,  "true");
    var expr2 = expressions.Expression.parse(rewrite);
    var rewrite2 = expr2.rewriteForChild();
    test.equals(rewrite2, "true");
    test.done();
}

//testRewriteForChild(<nodeunit.Test>{equals: function(){}});

