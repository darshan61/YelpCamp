var express = require("express"),
    router= express.Router(),
    User = require("../models/user"),
    passport = require("passport"),
    middleware = require("../middleware"),
    Campground = require("../models/campground");

// App Routes started

router.get("/", function(req,res){
    res.render("landing");
});


// ========
// USER ROUTES
// ========

router.get("/register",function(req, res){
    res.render("users/register");
});


router.post("/register",middleware.upload.single('image'), function(req, res){
    // console.log(req.file);
    middleware.cloudinary.uploader.upload(req.file.path, function(result) {
        // console.log(req.file.path);
        // console.log(result);
  // add cloudinary url for the image to the user object under image property
  
        var dp = {url: result.secure_url, public_id: result.public_id};
       
        var newUser = new User({
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            emailaddress: req.body.emailaddress,
            dp: dp
        });
        User.register(newUser, req.body.password, function(err, user){
            if(err){
                console.log(err);
                req.flash("error",err.message);
                return res.redirect("/register");
            }
            passport.authenticate("local")(req,res,function(){
                req.flash("success","User " + newUser.username + " Signed Up Successfully");
                res.redirect("/campgrounds");
            });
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


router.get("/users/:id",middleware.isLoggedIn,function(req,res){
    User.findById(req.params.id, function(err, foundUser){
        if(err || !foundUser){
            console.log(err);
            req.flash("error","something went wrong");
            res.redirect("back");
        }
        else {
            Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds){
                 if(err || !foundUser){
                    console.log(err);
                    req.flash("error","something went wrong");
                    res.redirect("back");
                }
                res.render("users/show",{user:foundUser,campgrounds:campgrounds});
            });
        }
    });
    // res.render("users/show");
});

router.get("/users/:id/edit",middleware.isLoggedIn,function(req,res){
    res.render("users/edit");
});

router.put("/users/:id",middleware.isLoggedIn,middleware.upload.single('image'),function(req,res){
        var UserData = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            emailaddress: req.body.emailaddress
        };
    if(req.file && req.file.path){
        middleware.cloudinary.uploader.upload(req.file.path, function(result) {
           if(!result){
              var dp = {url:result.secure_url, public_id: result.public_id};
              UserData.dp = dp;
           }
            User.findByIdAndUpdate(req.params.id,UserData,function(err,foundUser){
                if(err || !foundUser){
                    console.log(err);
                    req.flash("error","something went wrong");
                    return res.redirect("back");
                }
                req.flash("success","user updated successfully");
                res.redirect("/campgrounds");
            });               
        });
    }else {
    //   updateUser = new User(newUserData);
    //   console.log(req.isAuthenticated());
       User.findByIdAndUpdate(req.params.id,UserData,function(err,foundUser){
        if(err || !foundUser){
            console.log(err);
            req.flash("error","something went wrong");
            return res.redirect("back");
        }
        // req.login();
        req.flash("success","user updated successfully");
        res.redirect("/campgrounds");
    });   
    }
});



module.exports = router;