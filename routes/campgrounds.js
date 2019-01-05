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

router.post("/",middleware.isLoggedIn,function(req,res){
    var author = {
        id: req.user._id, 
        username: req.user.username
        
    };
    
    var campground = {name: req.body.name, image: req.body.image, description: req.body.description, author: author, price: req.body.price};
    Campground.create(campground);
    req.flash("success","Successfully created campground " + campground.name);
    res.redirect("campgrounds");
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

router.put("/:id",middleware.checkCampgroundOwnership,function(req,res){
    
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
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

router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err, deletedCampground){
        if(err){
            console.log(err);
            req.flash("error","Unable to delete campground");
            res.redirect("/campgrounds");
        }else {
            req.flash("success","Sucessfully deleted campground " + deletedCampground.name);
            res.redirect("/campgrounds");
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