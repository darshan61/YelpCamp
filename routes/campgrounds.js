var express = require("express"),
    Campground = require("../models/campground"),
    router = express.Router(),
    middleware = require("../middleware"),
    multer = require('multer'),
    cloudinary = require('cloudinary');
    
    
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

var upload = multer({ storage: storage, fileFilter: imageFilter});

cloudinary.config({ 
  cloud_name: 'darshan61', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/", function(req,res){
    Campground.find(function(err,campgrounds){
        if(err){
            console.log(err);
        }else {
            res.render("campgrounds/index", {campgrounds:campgrounds});
        }
    });
});

router.post("/",middleware.isLoggedIn, upload.single('image'),function(req,res){
    cloudinary.uploader.upload(req.file.path, function(result) {
        console.log(req.file.path);
        console.log(result);
  // add cloudinary url for the image to the campground object under image property
  
        var image = {url: result.secure_url, public_id: result.public_id};
        var author = {
            id: req.user._id, 
            username: req.user.username
            
        };
        
        var campground = {name: req.body.name, image: image, description: req.body.description, author: author, price: req.body.price};
        Campground.create(campground);
        req.flash("success","Successfully created campground " + campground.name);
        res.redirect("campgrounds");
    });
});

router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findById(req.params.id,function(err,foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash("error","Unable to find the campground");
            res.redirect("/campgrounds");
        }else {
            res.render("campgrounds/edit",{campground:foundCampground});     
        }
    });
});

router.put("/:id",middleware.checkCampgroundOwnership,upload.single('image'),function(req,res){
    cloudinary.uploader.upload(req.file.path, function(result) {
    // req.body.image = result.secure_url;
    console.log(req.file.path);
    console.log(result);
    var campground = req.body.campground;
    campground.image = {url: result.secure_url, public_id: result.public_id};
        Campground.findByIdAndUpdate(req.params.id, campground, function(err, updatedCampground){
            if(err || !updatedCampground){
                console.log(err);
                req.flash("error","Unable to update campground");
                res.redirect("/campgrounds");
            }else {
                req.flash("success","Sucessfully updated campground " + updatedCampground.name);
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err, deletedCampground){
        if(err){
            console.log(err);
            req.flash("error","Unable to delete campground");
            res.redirect("/campgrounds");
        }else {
            console.log(deletedCampground);
            cloudinary.v2.uploader.destroy(deletedCampground.image.public_id, {invalidate: true }, function(error, result) {
                if(error){
                    console.log(error);
                    console.log("image cannot be destroyed from cloudinary");
                }
                req.flash("success","Sucessfully deleted campground " + deletedCampground.name);
                res.redirect("/campgrounds"); 
            });
        }
    });
});

router.get("/new",middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/create");
});

router.get("/:id", function(req,res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
            req.flash("error","Unable to fetch campground");
            res.redirect("/campgrounds");
        }else {
            // console.log(foundCampground);
           res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});


module.exports = router;