# Blaze Security Compiler for Firebase

The blaze compiler simplifies building security rules for your Firebase database. It drastically reduces the amount of copy and pasting involved. Blaze compiler security rules are shorter, and the syntax is less fussy.


##  Getting started

```
npm install -g blaze_compiler
```

create a rules.yaml containing the following code

```YAML
functions:
  - isLoggedIn(): auth.uid !== null

schema: {}

access:
  - location: /
    read:  true
    write: true && isLoggedIn()
```

now compile it from the commandline with

```
blaze rules.yaml
```

A rules.json will be generated which you can upload to Firebase!

You can find more about the [functions](#functions), [simpler rule expressions](#simple-security-expressions), the [schema definitions](#schema), [access control](#access-control) or [inline tests](#inline-testing).

## Functions

Common expressions for reuse are defined in the *functions* list. A function can take arguments (they are functions).

```YAML
functions:
  - isLoggedIn():          auth.username !== null
  - isUser(username):      auth.username === username
```

You can then use them anywhere a security expression would be expected, for example, in the access control section:-

```
access:
  location: /users/$userid/
  write:    isUser($userid)
```

## Simple Security Expressions

Security expressions are the strings that used to go in write/read/validate portions of the old security rules. Blaze expressions have similar semantics but shorter syntax.

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



## Schema

The schema section describes the layout of the data tree. It is strongly suggested you use schema to describe the layout of your Firebase,
however it is possible to describe just the end points with access controls. A compiler warning is emitted if you give access
to a path that is not described by the data schema.

#### Types

A Firebase database schema node is either a leaf type (*string*, *number*, *boolean*) or an *object* which contains more child schema nodes.
The type is specified with "type". Children of objects are specified as a map under "properties"

```YAML
schema:
  type: object
  properties:
    string_child:  {type: string}
    boolean_child: {type: boolean}
    number_child:  {type: number}
    anything_child: {}
```

In the above example you could set `{string_child: "blah"}` at the root of your database but not `{string_child: true}`

You can leave a schema unspecified with {} or with type: "any".

#### required

The required keyword states which children **must** be present. The required keyword is only valid for schema nodes with the object or any types.

```YAML
schema:
  type: object
  required: [child1, child2]
```

#### additionalProperties

By default, objects can have additional children not mentioned. If additionalProperties is set to false, however, only children explicitly mentioned in the properties are allowed. The additionalProperties keyword is only valid for object and non-typed schemas.

```YAML
schema:
  type: object
  additionalProperties: false
  properties:
    string_child:  {type: string}
```

would not accept `{number_child: 5}` in the root, but without additionalProperties it would.

#### enum

The enum keyword constrains the value of a string types to be one of the predefined array elements.

```YAML
schema:
  type: string
  enum: [yes, no, maybe]
```

#### indexOn

The indexOn keyword adds an index for [querying](https://www.firebase.com/docs/security/guide/indexing-data.html).
This can either be specified as a single string or an array, applied to non-typed or object types only.

```YAML
schema:
  indexOn: name
  $user:
     indexOn: [inbox, outbox]
```

#### ranges

The minimum keyword constrains the minimum value of a number type. You set exclusiveMinimum to true, otherwise the
minimum is inclusive. Maximum and exclusiveMaximum follow the pattern

```YAML
schema:
  type: number
  minimum:  0
  maximum: 10
  exclusiveMaximum: true

  examples:
    - 0
    - 9.9
  nonexamples:
    - 10
```

#### $wildchild

An object can have many children bound to a path variable denoted with a keyword starting with $. Note that wildchilds are not put in the properties definition. The following shows how to accept many objects as children of "/users/"

```YAML
schema:
  type: object
  properties:
    users:
      type: object
      $userid: {}
```

The use of a wildchild prevents all ascendents from being writable.  

#### ~$wilderchild

```YAML
schema:
  type: object
  properties:
    users:
      type: object
      ~$userid: {type: string, constraint: next != null}
```

Wilderchilds are an unsafe but more flexible wildchild. Use them with caution. Wilderchilds do not lock the parent against writing. Wilderchildren's constraints are respected only when next!=null. This implies wilderchild can be set to null whenever user has write access to them, either by writing to the parent or the wilderchild location directly. In the above example, despite the guard against being set to null in the constraint, the constraint is not evaluated when the wilder child is set to null and thus has no effect. Wilderchilds are useful because their enclosing location can still be written, but be aware of the drawbacks.


#### Constraints

The semantics of enforcing data integrity is different from the original rules. There is no overriding of constraints, nor separate read/write/validate expressions. There is just one field for expressing data integrity named *constraint*. All ancestors and descendant constraints must evaluate to true for a write to be allowed.

The following example, fixes the id of a user to equal the key, and makes the account writable only at creation time.

```YAML
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

        constraint: (!prev.exists())
```

You can be sure all constraints above and below evaluate to true for a write to be allowed. The only quirk is related to wildchilds. You can't write anything above a wildchild that includes the wildchild as a descendant. They do inherit their parents constraints though, as do their siblings, so the use of wildchilds **never** makes the database less constrained accidentally.

#### Model reuse

Denormalization of data requires replicating a model in multiple places in a schema. JSON Schema allows importing of models across the Internet or within a document through URLs. Currently, blaze only supports in-document reuse.

Model definitions are declared in the keyword definitions object, and references are made using the $ref keyword as follows:

```YAML
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

These inline tests are good for documenting intent and providing fast feedback when authoring a new schema. Note that
inline tests cannot understand the constraint field, they can only test the schema.

```YAML
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

The schema portion of the rules YAML file is for specifying the data layout and constraints. Read/write access is described in a separate access control list under "access". For each entry, the scope of the rule is a subtree at, or below, the path indicated in the *location* field. Read access is granted to that subtree if the *read* expression evaluates to true, and write access is granted if the *write* expression evaluates to true.

```YAML
functions:
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

```YAML
functions:            #reusable boolean functions
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
  - location: users/$userid/outbox/
    write:    true

  #owners can read everything in their inbox and outbox
  - location: users/$userid/
    read:    $userid === auth.username
```


##  Changelog
- 25th Sep 2015:
  - schema padding emits a warning when applied to help visibility
  - performance schema padding efficiency greatly improved
  - performance of optimization routines improved


- 20th Aug 2015:
  - tailored error message when a wild(er)child is used in a properties section

- 10th Aug 2015:
  - Allowed repeat examples and non-example, as the error message can be unclearly attached to something unrelated (see repeatExample.yaml)
  - upgrade source-map-repository so blaze_compiler continues to fix issue with io.js
  - Allowed any type to have the required keyword
  - Schema is padded to match with ACL if the ACL is bigger

- 19th May 2015:
  - Improved optimization use a less verbose object detection notation and spurious parent is an object checks

- 22nd April 2015:
  - Special cased forgetting to .val() before using an inbuilt string method with an error message

- 21th April 2015:
  - $ref not importing into (non)example schema fragments properly

- 10th April 2015:
  - fixed erroneous substitution of parameters into member expressions

- 12th Jan 2015:
  - improved messaging if blah.child('name') syntax is erroneously used

- 23rd December 2014:
  - bugfix: function with next or prev were not moved around when in constraints properly (similar to Nov 4th bug)
  - bugfix: minimum and maximum

- 20th November 2014:
  - support for indexOn

- 4th November 2014:
  - bugfix: functions in ACL resolved properly

- 3rd November 2014:
  - bugfix: wilderchild matching fix in ACL

- 1st November 2014:
  - bugfix: wilderchild overwriting parent constraints bug fixed
  - bugfix: access control constraints localised properly
  - bugfix: regex detection firing erroneously on strings starting with '/' fixed

- 20th October 2014:
  - optimizations added to reduce code bloat
  - sensitization bug regarding regexes fixed

- 28th August 2014:ß
  - range constraints for number type added

- 26th August 2014:
  - wilderchilds introduced, ~$ allows nullable wildchilds whose parents can be written to.
  - sanitized expressions bug fix

- 18th August 2014:
  - predicates renamed to functions

- 14th July 2014:
  - improved error reporting
  - updated installation

- 9th July 2014:
  - support for rules in JSON

- 30th June 2014:
  - removed trailing /* from access location syntax
  - allowed untyped schema if type is not specified
