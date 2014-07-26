// greatjson.js
// equal to JSON.parse enhanced with clearer syntax error messages
// © Harald Rudell 2012
//updated by Tom Larkworthy to return annotations of col & line for each object property / array bound
var util = require("util");
var Json = require("./Json.js");
exports.parse = parse;

/*
parse json text
text: input to be parsed
reviver: optional function: TODO

return value:
- object on success
- SyntaxError object on failure
*/
function parse(text) {
	var result;
	var parser = getParser(text);
	var temp;

	if (!((result = getJsonValue()) instanceof Error) && (temp = parser.verifyAtEnd())) result = temp;

	return result;

	/*
	Retrieve the next json value
	return value:
	- value on success
	- SyntaxError on parse failure
	*/
	function getJsonValue() {
        var start_pos = parser.getPosition();
		var result = parser.getSimpleToken();

		if (!(result instanceof Error)) switch (result) {
			case 'true':
				return new Json.JBoolean(true, start_pos, parser.getPosition());new Json.JBoolean(true, start_pos, parser.getPosition());
			case 'false':
				return new Json.JBoolean(false, start_pos, parser.getPosition());
			case 'null':
				return new Json.JNull(start_pos, parser.getPosition());
			case '"': // string
				return new Json.JString(parser.getString(), start_pos, parser.getPosition());
			case '[': // array
				return getArray();
			case '{': // object
				return getObject();
			default: // number
                return new Json.JNumber(parseFloat(result), start_pos, parser.getPosition());
		}

		return result
	}

	// parse a json object
	function getObject() {
		var result = new Json.JObject();

        var startPosition = parser.getPosition();
		result.setStart(startPosition-1);
		var key;
		var nextValue;
		if (parser.peekAtNextCharacter() != '}') for (;;) {


            var key_start = parser.getPosition();
			if ((key = parser.getFullString()) instanceof Error && (result = key)) break;

            var json_key = new Json.JString(key, key_start, parser.getPosition());

			if ((nextValue = parser.skipThisCharacter(':', 'object colon', startPosition)) && (result = nextValue)) break;

			if ((nextValue = getJsonValue()) instanceof Error && (result = nextValue)) break;

			result.put(json_key, nextValue);

			if (parser.peekAtNextCharacter() == '}' && parser.skipCharacter()) break; // end of object
			if ((nextValue = parser.skipThisCharacter(',', 'object comma', startPosition)) && (result = nextValue)) break
		} else parser.skipCharacter();

        result.setEnd(parser.getPosition());
		return result
	}

	// parse a json array
	function getArray() {
		var result = new Json.JArray();

		var nextValue;
        var startPosition = parser.getPosition();
		result.setStart(startPosition-1);
		if (parser.peekAtNextCharacter() != ']') for (;;) {
			if ((nextValue = getJsonValue()) instanceof Error && (result = nextValue)) break;

			result.push(nextValue);

			if (parser.peekAtNextCharacter() == ']' && parser.skipCharacter()) break; // end of array
			if ((nextValue = parser.skipThisCharacter(',', 'array comma', startPosition)) && (result = nextValue)) break
		} else parser.skipCharacter();
        result.setEnd(parser.getPosition());

		return result;
	}
}

// textparser.js
// parses pieces of json from a string
// © Harald Rudell 2012

var suddenEnd = 'Unexpected end of input';
var badToken = 'Bad token';
var unToken = 'Unexpected token';

function getParser(text) {
	var unparsed = text = String(text);

	return {
		getSimpleToken: getSimpleToken,
		skipThisCharacter: skipThisCharacter,
		skipCharacter: skipCharacter,
		peekAtNextCharacter: peekAtNextCharacter,
		getString: getString,
		getFullString: getFullString,
		verifyAtEnd: verifyAtEnd,
		getPosition: getPosition,
		reportError: reportError
    };

	// verify the next non-whitespace character to be ch
	// if match, skip it and return undefined
	// if no match return SyntaxError
	function skipThisCharacter(ch, expected, startPosition) {
		var result;
		if (peekAtNextCharacter() != ch) result = reportError(unparsed.length ? badToken : suddenEnd, expected + ' from ' + getPositionString(text, startPosition));
		else skipCharacter();
		return result
	}

	function getPosition() {
		return text.length - unparsed.length
	}

	// get a string including the opening double quote
	function getFullString() {
		var result;
		if (peekAtNextCharacter() != '"') {
			result = reportError(unparsed.length ? badToken : suddenEnd, 'string opening double quote character')
		} else {
			skipCharacter();
			result = getString()
		}
		return result
	}

	// get a json string with escapes resolved
	function getString() {
		var result;
		var match = unparsed.match(jsonString);
		if (match) {
			unparsed = unparsed.substring(match[0].length);
			result = match[1].replace(jsonStringEscapes, function(matched, escapeChar, escapeHex) {
				return escapeChar ? jsonStringEscapeMap[escapeChar] : String.fromCharCode(parseInt(escapeHex, 16))
			})
		} else result = reportError('Bad string: unterminated or improper characters or escapes', 'json string');
		return result
	}

	// skip whitespace to the next character
	// return the character without parsing it
	// undefined if at end of string
	function peekAtNextCharacter() {
		skipWhitespace();
		return unparsed[0]
	}

	// remove the next character from unparsed
	// return: true
	function skipCharacter() {
		unparsed = unparsed.substring(1);
		return true
	}

	// return value: undefined
	// or SyntaxError if remaining non-whitespace characters
	function verifyAtEnd() {
		var result;
		skipWhitespace();
		if (unparsed.length) result = reportError('Trailing characters', 'end of input', text, unparsed);
		return result
	}

	// find the next json value in unparsed
	// return value:
	// - the opening string
	// - undefined if no parseable value could be found
	function getSimpleToken() {
		var result;

		//skipWhitespace()
		var match = unparsed.match(jsonValue);
		if (match) {
			result = match[1];
			unparsed = unparsed.substring(match[0].length)
		} else skipWhitespace();
		if (!result) {
			result = reportError(unparsed.length ? unToken : suddenEnd, 'json value', text, unparsed)
		}
		return result
	}

	// remove leading whitespace from unparsed
	function skipWhitespace() {
		var match = unparsed.match(jsonWhitespace);
		if (match) unparsed = unparsed.substring(match[0].length);
		return unparsed.length
	}

	function reportError(message, expected) {
		return createError(message, expected, text, unparsed)
	}
}

// regexps.js
// Regular expressions used to parse json
// © Harald Rudell 2012

// loosely based on work by Mike Samuel http://json-sans-eval.googlecode.com/

// matches leading whitespace
// \s is a JavaScript WhiteSpace or LineTerminator character
var whitespace = '\\s*';

// capture leading whitespace by itself
jsonWhitespace = new RegExp('(' + whitespace + ')');

// matches a json number
var jsonNumber = '-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?';

// the first characters of composite types
var jsonStringBegin = '"';
var jsonObjectBegin = '\\{';
var jsonArrayBegin =  '\\[';

// captures primitives or the first character of composite types string, object or array
// we must have start of string here to avoid ignoring leading garbage characters
// therefore, we must also have whitespace to skip leading whitespace
jsonValue = new RegExp('^' + whitespace + '(' +
	jsonStringBegin + '|' +
	jsonNumber + '|' +
	jsonObjectBegin + '|' +
	jsonArrayBegin + '|' +
	'true|' +
	'false|' +
	'null)');

// all the escapes in string values defined by json
var stringEscapes = '\\\\(?:(["\\\\b\\/fnrt])|u([0-9A-Fa-f]{4}))';

// matches one json string character including escape sequences
var oneChar = '(?:[^\\0-\\x1f"\\\\]|' + stringEscapes + ')';

// captures a syntactically correct json string
// skips terminating double quote
jsonString = new RegExp('^(' + oneChar + '*)"');

// captures the content of a string escape, ie. a single character or 4 hexadecimal digits
jsonStringEscapes = new RegExp(stringEscapes, 'g');

// maps string escape characters to corresponding escaped value
jsonStringEscapeMap = {
	'"': '"', // double quotation mark
	'/': '/', // solidus
	'\\': '\\', // reverse solidus
	'b': '\b', // backspace
	'f': '\f', // formfeed
	'n': '\n', // newline
	'r': '\r', // carriage return
	't': '\t' // horizontal tab
};

// syntaxerror.js
// elaborate error messages for greatjson
// © Harald Rudell 2012


// create an elaborate SyntaxError object
// message: string: cause of error
// expected: string: the type of token that json syntax expects
// text: string: the complete input json string
// unparsed: string: the remaining portion of text that could no be parsed
function createError(message, expected, text, unparsed) {
	var result;

	var printable = unparsed.substring(0, 20);
	var textMsg = printable.length ? ', text:' + printable : '';
//console.log('textMsg:(' + textMsg + ')')
	var fields = {};
	var positionString = getPositionString(text, text.length - unparsed.length, fields);
	var msg = util.format('%s: expected %s%s at %s',
		message,
		expected,
		textMsg,
		positionString);
	result = SyntaxError(msg);
//console.log('result.message:(' + result.message + ')')
//console.log('result.test:(' + result.test + ')')
	for (var p in fields) result[p] = fields[p]
	result.text = printable;

	return result
}

function getPositionString(text, position, updateObject) {
	var lineColumn = getLineColumn(text, position);
	var percent = (text.length == 0 ? 0 : position / text.length *100).toFixed(0);
	var result = util.format('line:%d column:%d position: %d (%d%%)',
		lineColumn.line,
		lineColumn.column,
		position,
		percent);
	if (updateObject) {
		updateObject.position = position;
		updateObject.line = lineColumn.line;
		updateObject.column = lineColumn.column
	}
	return result
}

// get the line and column numbers for position in text
// text: string
// position: index in text
// note: a line break is '/n' or '/r/n' or '/r'
function getLineColumn(text, position) {
	var result = {
		line: 1,
		column: 0
    };

	var n;
	var r;
	var lastColumn1 = 0;
	for (;;) {

		// find next '/n' and '/r'
		if (n == null && (n = text.indexOf('\n', lastColumn1)) >= position) n = -1;
		if (r == null && (r = text.indexOf('\r', lastColumn1)) >= position) r = -1;
		if (n == -1 && r == -1) break;

		// check if next linebreak is '/n'
		if (n != -1 && (n < r || r == -1)) {
			result.line++;
			lastColumn1 = n + 1;
			n = null
		} else if (r != -1 && (r < n || n == -1)) {
			result.line++;
			lastColumn1 = r + 1;
			if (n == r + 1) {
				n = null;
				lastColumn1++
			}
			r = null
		}
	}
	result.column = position - lastColumn1 + 1;

	return result
}