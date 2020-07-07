//jshint esversion:6

require("dotenv").config(); //подключение dotenv для хранения ключей
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy; //пожключим passport google strategy
const findOrCreate = require("mongoose-findorcreate"); //find or create для passport-google-oauth20 

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: true
   // cookie: { secure: true }
  }));

app.use(passport.initialize()); //start using authentication

app.use(passport.session()); //использование сессий
// MongoDB setup
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: [{
        type: String
    }]
});

userSchema.plugin(passportLocalMongoose); //добавление плагина
userSchema.plugin(findOrCreate); //добавление плагина

const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser()); для passport-local-mongoose
// passport.deserializeUser(User.deserializeUser()); для passport-local-mongoose

// Для google auth 2.0
passport.serializeUser(function(user, done) {

    done(null, user.id);
  
  });
  
  
  passport.deserializeUser(function(id, done) {

    User.findById(id, function(err, user) {
  
      done(err, user);
  
    });
  
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    //userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//GET
app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google", 
passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/secrets", function(req, res){

    User.find({secret: {$ne:null}}, function(err,foundUsers){
        if (err) {
            console.log(err);
            
        } else {
            if (foundUsers){
                res.render("secrets", {userWithSecrets: foundUsers[0].secret});
            }
        }
    });

// if (req.isAuthenticated()){
//     res.render("secrets");
// }else {
//     res.redirect("/login");
// }
});

app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
        res.render("submit");
    }else {
        res.redirect("/login");
    }
    });

app.get("/logout", function(req, res){
    req.logout(); //passport logout()
    res.redirect('/');
});

//POST
app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
            });
        }
    });
   
});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    console.log(req.user);

    User.findById(req.user.id, function(err, foundUser){
        if (err){
            console.log(err);
            
        } else {
            if (foundUser){
                foundUser.secret.push(submittedSecret);
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }

    });
    
});



// run server
app.listen(3000, function () {
    console.log("Server started on port 3000");
  });