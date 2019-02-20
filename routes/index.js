var express = require("express"),
    router= express.Router(),
    User = require("../models/user"),
    passport = require("passport"),
    middleware = require("../middleware"),
    Campground = require("../models/campground"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");;

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


router.get("/forgot",function(req,res){
    res.render("users/forgot");
});


router.post("/forgot",function(req,res,next){
    async.waterfall([
        function (done){
            crypto.randomBytes(20,function(err, buf){
                let token = buf.toString('hex');
                done(err,token)
            });
        },
        function (token, done){
            User.findOne({emailaddress: req.body.emailaddress},function(err, user){
                if(!user || err){
                    console.log(err);
                    req.flash("error","No account with the given address exists");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function (token, user, done){
            // send email
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth:{
                    user: process.env.EMAILID,
                    pass: process.env.PASSWORD
                }
            });
            var mailOptions = {
                to: user.emailaddress,
                from: process.env.EMAILID,
                subject: 'YelpCamp Password Reset',
                text: "Hi "+user.firstname +" "+ user.lastname+","+"\n"+"You are receiving this email as you have requested password reset."+"\n"+
                "To reset the password, please click on the below link or paste the link in any browser"+"\n"+
                "https://" + req.headers.host + "/reset/"+token+"\n\n"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log('mail sent');
                req.flash("success","An email has been sent to " + user.emailaddress + ",please follow the instructions mentioned in the mail to reset password");
                done(err,'done');
            });
        }
        ],function(err){
            if(err) {
                console.log(err);
                return next(err);
            }
            res.redirect("/forgot");
        });
});

router.get("/reset/:token",function(req,res){
    console.log(req.params.token);
    // console.log(req.params.token);
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpire:{ $gt: Date.now()}},function(err,user){
        if(err || !user){
            console.log(err);
            console.log(user);
            req.flash("error","Password reset token is invalid or has expired.");
            res.redirect("/forgot");
        }else {
            res.render("users/reset",{token: req.params.token});
        }
    });
});

router.put("/reset/:token",function(req,res, next){
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpire:{ $gt: Date.now()}},function(err,user){
                // if(!user){
                //     req.flash("error","Password token is invalid or expired");
                //     req.redirect("back");
                // }
                
                if(err){
                    req.flash("error","Password token is invalid or expired step1");
                    return done(err,null);
                }
                if(req.body.password == req.body.confirm){
                    user.setPassword(req.body.password,function(err){
                        if(err){
                            req.flash("error","Password token is invalid or expired");
                            done(err, null);
                        }
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpire = undefined;
                        user.save(function(err){
                            if(err){
                                done(err,null);
                            }
                            req.logIn(user, function(err){
                            done(err,user);
                            });
                        });
                    });
                }else {
                    req.flash("error","New and Confirm password does not match");
                    done('error',null);
                }
            });
        },
        function (user,done){
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth:{
                    user: process.env.EMAILID,
                    pass: process.env.PASSWORD
                }
            });
            var mailOptions = {
                to: user.emailaddress,
                from: process.env.EMAILID,
                subject: 'YelpCamp Password Reset',
            text: "Hi "+user.firstname +" "+ user.lastname+","+"\n"+"Your password has been changed successfully."+"\n"
                // "To reset the password, please click on the below link or paste the link in any browser"+"\n"+
                // "https://" + req.headers.host + "/reset/"+token+"\n\n"
            };
            smtpTransport.sendMail(mailOptions, function(err){
                // console.log('mail sent');
                req.flash("success","Your password has been changed successfully");
                done(err,'done');
            });
        }
        ],
    function(err){
            if(err) {
                console.log(err);
                return res.redirect("back");
            }
            res.redirect("/campgrounds");
        }
    );
    
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