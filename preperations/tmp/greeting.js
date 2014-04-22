var Greeter = (function () {
    function Greeter(greeting) {
        this.greeting = greeting;
    }
    Greeter.prototype.greet = function () {
        return "<h1>" + this.greeting + "</h1>";
    };
    return Greeter;
})();
var greeter = new Greeter("Hello, world!");
var str = greeter.greet();
console.log(str);
//# sourceMappingURL=greeting.js.map
