var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");
    
var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true, lowercase: true},
    password: String,
    firstname: String,
    lastname: String,
    emailaddress: {type: String, unique: true, required: true, lowercase: true},
    dp:{
        url: String,
        public_id: String
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);