var express = require("express"),
    Campground = require("../models/campground"),
    router = express.Router(),
    middleware = require("../middleware");


router.get("/", function(req,res){
    Campground.find(function(err,campgrounds){
        if(err){
            console.log(err);
        }else {
            res.render("campgrounds/index", {campgrounds:campgrounds});
        }
    });
});

router.post("/",middleware.isLoggedIn, middleware.upload.single('image'),function(req,res){
    middleware.cloudinary.uploader.upload(req.file.path, function(result) {
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

router.put("/:id",middleware.checkCampgroundOwnership,middleware.upload.single('image'),function(req,res){
    var campground = req.body.campground;
    if (req.file && req.file.path){
        middleware.cloudinary.uploader.upload(req.file.path, function(result) {
        // req.body.image = result.secure_url;
        // console.log(result);
            if (!req.file.path){
                campground.image = {url: result.secure_url, public_id: result.public_id};
            }
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
    }else {
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
    }
});

router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err, deletedCampground){
        if(err){
            console.log(err);
            req.flash("error","Unable to delete campground");
            res.redirect("/campgrounds");
        }else {
            console.log(deletedCampground);
            middleware.cloudinary.v2.uploader.destroy(deletedCampground.image.public_id, {invalidate: true }, function(error, result) {
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