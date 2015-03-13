class Test {
    {

        //setting a primative
        root.child_string.write("yo");

        //setting a complex object
        root.child_object
            .buildValue()
            .grandchild_number(12)
            .value();


        //setting a nested object
        root.buildValue()
            .child_string("yo")
            .buildchild_object()
            .grandchild_number(12)
            .value()
            .value();

    }
}