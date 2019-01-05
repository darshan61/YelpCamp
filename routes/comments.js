var express = require("express"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    router = express.Router({mergeParams: true}),
    middleware = require("../middleware");


router.get("/new",middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash("error","Unable to find the campground");
            res.redirect("/campgrounds/"+req.params.id);
        }else {
            res.render("comments/create", {campground: foundCampground});
        }
    });
});

router.post("/",middleware.isLoggedIn, function(req, res){
    var comment = req.body.comment;
    comment.author = {id: req.user._id, username: req.user.username };
    Comment.create(comment, function(err,newComment){
        if(err || !comment){
            console.log(err);
            if (err){
                req.flash("error",err.message);
            }else {
                req.flash("error","Unable to find comment");
            }
            res.redirect("back");
        }else {
            Campground.findById(req.params.id, function(err,campground){
              if(err || !campground){
                  console.log(err);
                  req.flash("error","Unable to find the campground");
                  res.redirect("back");
              }else 
              campground.comments.push(newComment);
              campground.save();
            });
        }
        res.redirect("/campgrounds/"+req.params.id);
    });
});

router.get("/:commentId/edit",middleware.checkCommentOwnership,function(req,res){
    Campground.findById(req.params.id, function(err,foundCampground){
        if(err){
            console.log(err);
            req.flash("error","Unable to find the campground");
            res.redirect("back");
        }else {
            Comment.findById(req.params.commentId, function(err, foundComment){
                if(err){
                    console.log(err);
                    req.flash("error","Unable to find the comment");
                    res.redirect("back");
                }else {
                    res.render("comments/edit",{campground:foundCampground, comment: foundComment}); 
                }
            });
        }
    });
});

router.put("/:commentId",middleware.checkCommentOwnership,function(req,res){
   Comment.findByIdAndUpdate(req.params.commentId,req.body.comment, function(err,updatedComment){
       if(err){
           console.log(err);
           req.flash("error","Unable to find the comment");
           res.redirect("back");
       }else {
           res.redirect("/campgrounds/"+req.params.id);
       }
   }); 
});

router.delete("/:commentId",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndRemove( req.params.commentId, function(err, removedComment){
        if(err){
            console.log(err);
            req.flash("error",err.message);
            res.redirect("back");
        }else {
            res.redirect("/campgrounds/"+req.params.id);
        }      
    });
});


module.exports = router;