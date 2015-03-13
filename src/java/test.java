
class Test {
    {

        //setting a primative
        root.child_string.write("yo");

        //setting a complex object
        root.child_object
                .buildValue()
                .setGrandchild_number(12)
                .value();


        //setting a nested object
        root.buildValue()
                .setChild_string("yo")
                .buildchild_object()
                .setGrandchild_number(12)
                .value()
                .value();

    }
}