Blaze compiler for Firebase
============================

The blaze compiler presents a higher level interface to Firebase security rules.

- write rules in YAML, trailing commas, unquoted strings and comments with tool support
- specify Firebase layout with typed JSON schema models
- reuse models in multiple locations in the data tree
- embed semantically obvious global functional constraints in the schema (as opposed to hierarchical)
- describe access control as a separate concern
- create reusable predicates (boolean functions)
- inline tests to check and document what form data can be to be inserted

Example
========

This is an example that exploits most of the new features.

It's is a messaging system whereby users can send messages to each other, by posting to other inboxes

this example is tested in test/mail_example_test.ts

```

predicates: #reusable boolean functions
  - isLoggedIn():      auth.username !== null
  - createOnly():      next.exists() && !prev.exists()  #a syntax wrinkle, unquoted string in YAML can't begin with !
  - deleteOnly():      prev.exists() && !next.exists()
  - createOrDelete():  createOnly() || deleteOnly()

schema:
  definitions: #create a reusable message model
    message:
      type: object
      properties:
        from:
          type: string
          #enforce the from field is *always* correct on creation, and only the *box owner can delete
          constraint:  (auth.username == next     && createOnly()) ||
                       ($userid === auth.username && deleteOnly())

        to:      {type: string, constraint:  createOrDelete()} #you can't delete single field due to parent's required
        message: {type: string, constraint:  createOrDelete()}

      required: [from, to, message] # all messages require all the fields to be defined
                                    #(or none if the message does not exist)

      additionalProperties: false   #prevent spurious data being part of a message

  type: object
  properties:
    users: # the users subtree is a collection of users
      type: object
      $userid:
        type: object
        properties: #each user has an optional inbox and outbox
          inbox:
            type: object
            $message: {$ref: "#/definitions/message"} #references are in document URLs as per JSON schema spec

          outbox:
            type: object
            $message: {$ref: "#/definitions/message"}

  additionalProperties: false


access:
  #append only write is given to anyone's inbox, so users can send messages to strangers
  - location: users/$userid/inbox/*
    write:    createOnly() && isLoggedIn()

  #the inbox owner can delete mail, so they can keep their inbox tidy
  - location: users/$userid/inbox/*
    write:    $userid === auth.username

  #write and delete is given to owners outbox, so they can record what messages they sent
  - location: users/$userid/outbox/*
    write:    true

```

Install
=========
npm install
npm link

Run
=========

blaze.js examples/structure.yaml

this will save a rules.json in the current directory

Features
=========

language features implemented so far are tracked in proposal.md

how access control is unified with schema is explained in access.md

Tests
=========

grunt nodeunit:all

numerous examples of semantics can be found in test/cases/

these test cases are tested by grunt nodeunit:codegen


Compiling
==========

written in Typescript (.ts), Jetbrains file watcher will compile them for you opportunistically but you have
to tell it to use the CommonJS module linking pattern. At command line you can compile a typescript file by

tsc test/codegen_test.ts --module "CommonJS"


