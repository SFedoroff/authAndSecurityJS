//jshint esversion:6

require('dotenv').config(); //подключение dotenv для хранения ключей
const express = require("express");
const ijs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//const secret = "Thisisourlittlesecret"; //секретная строка вместо двух ключей для mongoose-encryption, перенесли в .env
const secret = process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] }); //password из schema кодируем

const User = new mongoose.model("User", userSchema);

//GET
app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req,res){
    res.render("login");
});

//POST
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err){
        if (err){
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

app.post("/login", function(req, res){
    const username = req.body.username;
    const paswword = req.body.password;

    User.findOne({email: req.body.username},
        function(err, findUser){
            if (err){
                console.log(err);
                ;
            } else {
                if (findUser){
                    if (findUser.password === paswword){
                        res.render("secrets");
                    }
                }
            }
        });
});



// run server
app.listen(3000, function () {
    console.log("Server started on port 3000");
  });