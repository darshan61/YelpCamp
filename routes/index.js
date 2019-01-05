var express = require("express"),
    router= express.Router(),
    User = require("../models/user"),
    passport = require("passport");

// App Routes started

router.get("/", function(req,res){
    res.render("landing");
});


// ========
// USER ROUTES
// ========

router.get("/register", function(req, res){
    res.render("users/register");
});

router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error",err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","User" + newUser.username + " Signed Up Successfully");
            res.redirect("/campgrounds");
        });
    });
});

router.get("/login", function(req,res){
    res.render("users/login");
});

router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to YelpCamp!'
    }),
    function(req,res){
        // res.redirect("/campgrounds");
});

router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","You have been logged out!");
    res.redirect("/campgrounds");
});

module.exports = router;