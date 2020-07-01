//jshint esversion:6

require('dotenv').config(); //подключение dotenv для хранения ключей
const md5 = require('md5'); //подключение md5 hashing function
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption"); отключаем mongoose-encryption для md5 
const bcrypt = require("bcrypt"); //подключаем bcrypt
const saltRounds = 10; //количество итераций соли

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
//userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] }); //password из schema кодируем // отключаем mongoose-encryption для md5 

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

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) { //добавление соли и хеширование
        const newUser = new User({
            email: req.body.username,
            password: hash //полученный хэш с солью
        });
    
        newUser.save(function(err){
            if (err){
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    });
    
});

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: req.body.username},
        function(err, findUser){
            if (err){
                console.log(err);
                ;
            } else {
                if (findUser){
                    // Load hash from your password DB.
                    bcrypt.compare(password, findUser.password, function(err, result) {
                    if (result === true) {
                        res.render("secrets");
                    }
                    });
                }
            }
        });
});



// run server
app.listen(3000, function () {
    console.log("Server started on port 3000");
  });