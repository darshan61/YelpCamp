var express = require("express"),
 app = express(),
 bodyParser = require("body-parser"),
 mongoose = require("mongoose"),
 flash = require("connect-flash"),
 passport = require("passport"),
 LocalStrategy = require("passport-local"),
 methodOverride= require("method-override"),
 Campground = require("./models/campground"),
 Comment = require("./models/comment"),
 User = require("./models/user"),
 seedDB = require("./seeds");

var commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes = require("./routes/index");
    
//seedDB(); //Commented Seed
// console.log(process.env.DATABASEURL);
mongoose.connect(process.env.DATABASEURL,{ useNewUrlParser: true });

// mongoose.connect("mongodb://db_admin:Welcome1@ds149744.mlab.com:49744/yelpcamp61",{useNewUrlParser: true});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(flash());
app.use(require("express-session")({
    secret: "Messi is the best player in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    return next();
});

app.use("/",indexRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);
app.use("/campgrounds",campgroundRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server has started!!");
});