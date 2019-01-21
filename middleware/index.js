// all the middleware goes here

var Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    multer = require('multer'),
    cloudinary = require('cloudinary');
    
var middlewareObj = {};
    

middlewareObj.checkCampgroundOwnership = function (req, res, next){
  if (req.isAuthenticated()){
        Campground.findById(req.params.id, function (err,foundCampground){
            if(err || !foundCampground){
                 console.log(err);
                 req.flash("error","Unable to find the campground");
                 res.redirect("back");
            }else {
                if(req.user._id.equals(foundCampground.author.id)){
                    return next();               
                }else {
                    req.flash("error","You do not have permission to perform this action");
                    res.redirect("back");
                }
            }
        });
    }else {
        req.flash("error","You need to login first to perform this action");
        res.redirect("/login");
    }  
}

middlewareObj.checkCommentOwnership = function (req,res,next){
    if (req.isAuthenticated()){
        Comment.findById(req.params.commentId, function(err,foundComment){
            if(err || !foundComment){
                console.log(err);
                req.flash("error","Unable to find the comment");
                res.redirect("back");
            }else {
                if (req.user._id.equals(foundComment.author.id)){
                    return next();
                }else {
                    req.flash("error","You do not have permission to perform this action");
                    res.redirect("back");
                }
            }
        });
    }else {
        req.flash("error","You need to login first to perform this action");
        res.redirect("/login");
    }
}


middlewareObj.isLoggedIn = function (req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to login first to perform this action");
    res.redirect("/login");
}


var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};


middlewareObj.upload = multer({ storage: storage, fileFilter: imageFilter});

cloudinary.config({ 
  cloud_name: 'darshan61', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

middlewareObj.cloudinary = cloudinary;

module.exports = middlewareObj;