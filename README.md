# Blaze compiler for Firebase

The blaze compiler presents a higher level interface to Firebase security rules.

- write rules in <a href="#rules-specified-in-yaml">YAML</a>, trailing commas, unquoted strings and comments with tool support
- terser security <a href="#terser-expression-syntax">expression</a> syntax
- create reusable <a href="#predicates">predicates</a> (boolean functions)
- specify Firebase layout with typed JSON <a href="#schema">schema models</a>
- embed global functional <a href="#constraints">constraints</a> in the schema
- <a href="#model-reuse">reuse</a> models in multiple locations in the data tree
- <a href="#inline-testing">inline tests</a> to check and document what form data can be to be inserted
- describe <a href="#access-control">access control</a> as a separate concern

see the big <a href="#example">example</a>

##  Changelog

- 9th July 2014:
  - support for rules in JSON

- 30th June 2014:
  - removed trailing /* from access location syntax
  - allowed untyped schema if type is not specified

- 14th July 2014:
  - improved error reporting
  - updated installation
  
## Install

For exploration of the examples, running tests, and staying up to date it's probably best to clone the git repo and link symbolically

```
git clone https://github.com/firebase/blaze_compiler.git
npm install -g grunt-cli
npm install
npm link
```

However if you want to quickly try it out then you can install from npm too

```
npm install -g blaze_compiler
```

<a id="run"></a>
## Run
```
blaze examples/structure.yaml
blaze -v /usr/local/lib/node_modules/blaze_compiler/examples/mail_example.yaml
blaze -v <your blaze file>
```

this will save a rules.json in the current directory which you can upload to the Firebase website

## Tests

```
grunt nodeunit:all
```

## Rules specified in YAML


JSON is sometimes fiddly to get syntactically right. Forgetting to quote keys or leaving a trailing comma is a common cause of parsing errors. So for the blaze compiler, the input language is YAML. As YAML is a strict superset of JSON, you can still write all your rules in JSON if you prefer, however YAML has many nice features

- automatic quoting of keys
- automatic quoting of string, and detection of multi-line strings
- objects optionally defined without "{" using indentation instead
- array syntax with -
- comments with #

For example, the following yaml

```

my_object: #my_object will be the first and only propery of the root document object
  object_child: {"key":"value"}
  string_child: "you can quote strings if you want..."
  multiline_string:
    this is a
    multi-line string with no quotes

  array_child:
    - element1: {}
    - "element2"
    - element3   # also a string


```

would be compiled to the following JSON (you can think of YAML as just a compact way of specifying JSON)

```
{
  "my_object": {
    "object_child": {
      "key": "value"
    },
    "string_child": "you can quote strings if you want...",
    "multiline_string": "this is a multi-line string with no quotes",
    "array_child": [
      {
        "element1": {}
      },
      "element2",
      "element3"
    ]
  }
}
```

The space after a colon is important! All indentation to denote keys or arrays is 2 spaces.

You can work in JSON though if you prefer, just make sure your input file ends with ".json"

## Terser Expression Syntax

Security expressions are the values that used to go in write/read/validate portions of the old security rules. Blaze expressions have similar semantics but terser syntax.

#### Variables renamed

*data* and *newData* have been renamed *prev* and *next*. *root* has the same meaning.

#### Child selection

The expression for selecting a child is now an array-like syntax. What was:

```
root.child('users')
```

is now
```
root['users']
```

In the common case that you are selecting a child using a single literal, you can select the child as if it were a property. So you can also write the above as:
```
root.users
```

#### Coercion of .val()
In the new syntax, *.val()* is inserted if the expression is next to an operator or in an array like child selector. You only need to use *.val()* if you are using a method of a value type like *.length*, *.beginsWith()* *.contains(...)*. So

```
newData.child('counter').val() == data.child('counter').val() + 1
```
is simplified to just
```
next.counter == prev.counter + 1
```

## Predicates

To reduce repetition of common expressions, you can create reusable boolean functions with meaningful names to snippets of expression logic. The boolean functions are called predicates and are expressed as an array child of a top level key *predicates*.

```
predicates:
  - isLoggedIn():          auth.username !== null
  - isUser(username):      auth.username === username

```

predicates can then be used in other expressions elsewhere:

```
access:
  location: /users/$userid/
  write:    isUser($userid)
```

## Schema

We have separated out access control concerns (read/write) from describing the static structure of the Firebase. The schema portion of the blaze rules YAML file is for specifying the shape of valid data, **not** who can access it. The semantics are a subset of JSON schema v4.

#### Types

A Firebase node is either a primitive leaf type (*string*, *number*, *boolean*) or an *object* which can have further child nodes. The type is specified with "type". Children of objects are specified as a map under "properties"

```
schema:
  type: object
  properties:
    string_child:  {type: string}
    boolean_child: {type: boolean}
    number_child:  {type: number}
```

In the above example you could set `{string_child: "blah"}` at the root of the Firebase but not `{string_child: true}`

You can leave a schema untyped by not specifying anything. The non-typed schema will allow primative or object types to be written at that location.

#### required

The required keyword states which children **must** be present for the parent object to be valid. Its value is an array. Required children do not *need* to be specified in the properties (although that would be good practice typically). The required keyword is only valid for object schemas.

```
schema:
  type: object
  required: [child1, child2]
```

#### additionalProperties

By default, values not constrained by the schema are considered valid. So objects, by default, accept children not explicitly mentioned in the schema. If additionalProperties is set to false, however, only children explicitly mentioned in the properties are allowed. The additionalProperties keyword is only valid for object and non-typed schemas.

```
schema:
  type: object
  additionalProperties: false
  properties:
    string_child:  {type: string}
```

would not accept `{number_child: 5}` in the root, but without additionalProperties it would.

#### enum

The enum keyword constrains string types to be one of the mentioned array elements. enum keyword is only valid for string types.

```
schema:
  type: string
  enum: [yes, no, maybe]
```

#### $wildchild

An object can have many children bound to a path variable denoted with a keyword starting with $. Note that wildchilds are not put in the properties definition. The following shows how to accept many objects as children of "/users/"

```
schema:
  type: object
  properties:
    users:
      type: object
      $userid: {}
```

#### Constraints

The semantics of enforcing data integrity is quite different from the original rules. There is no overriding of constraints, nor separate read/write/validate expressions. There is just one field for expressing data integrity named *constraint*. All ancestors and descendant constraints must evaluate to true for a write to be allowed.

The following example, fixes the id of a user to equal the key, and makes the account writable only at creation time.

```
schema:
  type: object
  properties:
    users:
      type: object
      $userid:
        properties:
          id:
            type: string
            constraint: next == $userid

        #The ! character has special meaning in YAML
        #so expression starting with ! have to be quoted
        constraint: "!prev.exists()"

```

You can be sure all constraints above and below evaluate to true for a write to be allowed. The only quirk is related to wildchilds. You can't write anything above a wildchild that includes the wildchild as a descendant. They do inherit their parents constraints though, as do their siblings, so the use of wildchilds **never** makes the Firebase less constrained accidentally.

#### Model reuse

Denormalization of data requires replicating a model in multiple places in a schema. JSON Schema allows importing of models across the Internet or within a document through URLs. Currently, blaze only supports in-document reuse.

Model definitions are declared in the keyword definitions object, and references are made using the $ref keyword as follows:

```
schema:
  definitions:
    stamped_value:
      type: object
      properties:
        modified: {type: number}
      required: [value, modified]
      constraint: next.value == prev.value || next.modified == now

  type: object
  $data: {$ref: "#/definitions/stamped_value"}
```

In JSON Schema you are able to extend model objects using the allOf modeling construct ([example](http://spacetelescope.github.io/understanding-json-schema/reference/combining.html)). However, blaze does not currently support this. Let us know if you need it!

#### Inline testing

Writing a complex schema can be difficult. For example, a typo in a required field could enforce the existence of
a child other than the one intended. For that reason blaze provides keywords for inline testing
of nested schema at compile time.

*examples* is a list of JSONs that you expect to be accepted by the JSON schema node.

*nonexamples* is a list of JSONs that you expect to be rejected by the JSON schema node.

These inline tests are good for documenting intent and providing fast feedback when authoring a new schema.

```
schema:
  type: object
  properties:
    object:  {type: object}
    string:  {type: string }
    boolean: {type: boolean}
    number:  {type: number }
  additionalProperties: false

  examples:
    - {object:  {name: "hello"}} # you can have extra children in objects by default
    - {string:  string}
    - {boolean: true}
    - {number:  4.6}

  nonexamples:
    - {object:  true}
    - {string:  {grandchild: true}}
    - {boolean: "true"}
    - {number:  "4.6"}
    - {extra:   "4.6"} #additionProperties is false, so no unexpected properties allowed

```

## Access Control

The schema portion of the rules YAML file is for denoting integrity constraints. Read/write access is described in a separate access control list under "access". For each entry, the scope of the rule is a subtree at, or below, the path indicated in the *location* field. Read access is granted to that subtree if the *read* expression evaluates to true, and write access is granted if the *write* expression evaluates to true.

```
predicates:
  - isLoggedIn():   auth !== null
...
access:
  - location: "/"
    read: isLoggedIn()
  - location: "/users/$userid/"
    write: auth.username === $userid

```

Only one access control entry needs to evaluate to true for an operation to be permitted.

## Example

This is an example that exploits most of the new features. It is a messaging system where users can send messages to each other, by posting to other user's inboxes

```

predicates:            #reusable boolean functions
  - isLoggedIn():      auth.username !== null
  - createOnly():      next.exists() && !prev.exists()
  - deleteOnly():      prev.exists() && !next.exists()
  - createOrDelete():  createOnly() || deleteOnly()

schema:
  definitions:         #create a reusable message model
    message:           #for use in the in and out boxes
      type: object
      properties:
        from:
          type: string
          #enforce the from field is *always* correct on creation,
          #and that only the *box owner* can delete
          constraint:  (auth.username == next     && createOnly()) ||
                       ($userid === auth.username && deleteOnly())

        #you can't delete single field due to parent's required
        to:      {type: string, constraint:  createOrDelete()}
        message: {type: string, constraint:  createOrDelete()}

      required: [from, to, message] # all messages require all the fields to be defined
                                    #(or none if the message does not exist)

      additionalProperties: false   #prevent spurious data being part of a message

      examples: #examples of inline testing
        - {from: "bill", to: "tom", message: "hey Tom!"}
      nonexamples:
        - {to: "tom", message: "hey Tom!"} #not allowed because from is missing

  type: object
  properties:
    users: # the users subtree is a collection of users
      type: object
      $userid: #wildchild expression of many children
        type: object
        properties: #each user has an optional inbox and outbox
          inbox:
            type: object
            $message: {$ref: "#/definitions/message"}

          outbox:
            type: object
            $message: {$ref: "#/definitions/message"}

  additionalProperties: false

access:
  #append only write is granted to anyone's inbox,
  #so users can send messages to strangers
  - location: users/$userid/inbox/
    write:    createOnly() && isLoggedIn()

  #the inbox owner can delete their incoming mail
  - location: users/$userid/inbox/
    write:    deleteOnly() && $userid === auth.username

  #write and delete is given to owners outbox
  #note that because only box owners can delete messages,
  #other users cannot use this entry point (see message constraint)
  - location: users/$userid/outbox/
    write:    true

  #owners can read everything in their inbox and outbox
  - location: users/$userid/
    read:    $userid === auth.username
```
