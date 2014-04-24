/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
var expressions = require('../src/expression');

function translationTestCase(from, to, symbols, test) {
    var expr = expressions.Expression.parse(from);

    var translation = expr.generate(symbols);

    test.equal(translation, to);
}

function testArrayLookup1(test) {
    translationTestCase("next['c1'].val()", "newData.child('c1').val()", new expressions.SymbolTable(), test);
    test.done();
}
exports.testArrayLookup1 = testArrayLookup1;

function testArrayLookup2(test) {
    translationTestCase("next.c1.val()", "newData.child('c1').val()", new expressions.SymbolTable(), test);
    test.done();
}
exports.testArrayLookup2 = testArrayLookup2;

function testArrayLookup3(test) {
    translationTestCase("next[prev.val()].val()", "newData.child(data.val()).val()", new expressions.SymbolTable(), test);
    test.done();
}
exports.testArrayLookup3 = testArrayLookup3;

function testParent1(test) {
    translationTestCase("next.parent()", "newData.parent()", new expressions.SymbolTable(), test);
    test.done();
}
exports.testParent1 = testParent1;

function testParent2(test) {
    translationTestCase("next[prev.parent().val()]['blah'].c1.val()", "newData.child(data.parent().val()).child('blah').child('c1').val()", new expressions.SymbolTable(), test);
    test.done();
}
exports.testParent2 = testParent2;

function testHasChildren(test) {
    translationTestCase("next.c1.hasChildren(['eric'])", "newData.child('c1').hasChildren(['eric'])", new expressions.SymbolTable(), test);
    test.done();
}
exports.testHasChildren = testHasChildren;

function testContains1(test) {
    translationTestCase("next.c1.contains('yo')", "newData.child('c1').contains('yo')", new expressions.SymbolTable(), test);
    test.done();
}
exports.testContains1 = testContains1;

function testContains2(test) {
    translationTestCase("'yo'.contains('yo')", "'yo'.contains('yo')", new expressions.SymbolTable(), test);
    test.done();
}
exports.testContains2 = testContains2;

function testContains3(test) {
    translationTestCase("'yo'.contains(prev.val())", "'yo'.contains(data.val())", new expressions.SymbolTable(), test);
    test.done();
}
exports.testContains3 = testContains3;

function testAuth1(test) {
    translationTestCase("auth.id", "auth.id", new expressions.SymbolTable(), test);
    test.done();
}
exports.testAuth1 = testAuth1;

function testAuth2(test) {
    translationTestCase("root.users[auth.id]", "root.child('users').child(auth.id)", new expressions.SymbolTable(), test);
    test.done();
}
exports.testAuth2 = testAuth2;

function testCoercion1(test) {
    translationTestCase("root.superuser == auth.id", "root.child('superuser').val() == auth.id", new expressions.SymbolTable(), test);
    test.done();
}
exports.testCoercion1 = testCoercion1;
//# sourceMappingURL=expressions.js.map
