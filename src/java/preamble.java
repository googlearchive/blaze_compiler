public static abstract class Ref<BuilderIdentity> {
    Firebase ref;
    Ref(Firebase ref) {
        this.ref = ref;
    }
    //abstract BuilderIdentity buildValue();
}

public static class Val {
    SubBuilder previous;
    Val(SubBuilder previous) {
        this.previous = previous;
    }
    public void write() {
        previous.ref.ref.setValue(previous.properties);
    }
}

public static class SubBuilder {
    Ref ref;
    SubBuilder parent;
    Map<String, Object> properties;
    SubBuilder(Ref ref, SubBuilder parent, Map<String, Object> properties) {
        this.ref = ref;
        this.parent = parent;
        this.properties = properties;
    }
}
public static class SubBuilderIdentity extends SubBuilder{
    SubBuilderIdentity(Ref ref, SubBuilder parent) {
        super(ref, parent, new HashMap<String, Object>());
    }
}
public static class SubBuilderIntermediate<Property> extends SubBuilder{
    SubBuilderIntermediate(SubBuilder parent, SubBuilder prev, String key, Property val) {
        super(prev.ref, parent, prev.properties);
        prev.properties.put(key, val);
    }
}
public static abstract class SubBuilderLast<Value> extends SubBuilder{
    SubBuilderLast(SubBuilder parent, SubBuilder prev) {
        super(prev.ref, parent, prev.properties);
    }
}