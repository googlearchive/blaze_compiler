
class Test {
    {

        //setting a primitive
        root.childString.write("yo");

        //setting an object
        root.childObject
                .openWrite()
                .setGrandchildNumber(12)
                .write();


        //setting a nested object
        root.openWrite()
                .setChildString("yo") //optional
                .openChildObject()
                .setGrandchildNumber(12)
                .closeChildObject()
                .write();

        root.$("id").openWrite().setAge(12).write();

    }
}