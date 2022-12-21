db = db.getSiblingDB('MyHome');

db.createCollection('sample_collection');

db.createUser({
    user: "myHome",
    pwd: "myHome",
    roles: [{role: "readWrite", db: "MyHome"}]
});

db.createUser(
    {
        user: "myHomeAdmin",
        pwd: "myHomeAdmin",
        roles: [{role: "dbOwner", db: "MyHome"}]
    }
)

