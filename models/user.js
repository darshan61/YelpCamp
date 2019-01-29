var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");
    
var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstname: String,
    lastname: String,
    emailaddress: String,
    dp:{
        url: String,
        public_id: String
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);