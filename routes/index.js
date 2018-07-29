var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/UserRegistration';
const md5 = require("md5");

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
	if (typeof req.session.data !== "undefined") {
    next();
  } else {
    res.redirect('/login');
  }  
};

//home
router.get('/', sessionChecker, (req, res) =>{
	res.render('dashboard', {user: req.session.data});
});

// Register
router.get('/register', (req, res) => {
	if(typeof req.session.data !== "undefined")
		res.render('login');
	else
		res.render("register");
});

// Login
router.get('/login', (req, res) => {
	if(typeof req.session.data !== "undefined"){
		res.redirect("/");
	}
	else{
		res.render('login');
	}
});

// Signup
router.post('/signup', (req, res) => {
	req.body.Password = md5(req.body.Password);
	delete req.body.CPassword;
	var document = JSON.stringify(req.body);
	MongoClient.connect(url)
  	.then( (db)  => { 
		db.collection('Users').findOne({$or: [{'Username': req.body.Username}, {'Email': req.body.Email}, {'Email': req.body.Username}, {'Username': req.body.Email}]})
		.then((user) => {
			if(user === null){
				db.collection("Users").insertOne(JSON.parse(document))
				.then( (response) => {
					res.send(JSON.stringify({Status: true}));
				})
				.catch( (err) => {
					console.log("Registration failed. Exception is:\n"+JSON.stringify(err));
					res.send(JSON.stringify({Status: false}));
				});
			} else{
				res.send(JSON.stringify({Status: false, Message: "Username/Email already taken"}));
			}
		})
		.catch( (err) => {
			console.log("Registration failed. Exception is:\n"+JSON.stringify(err));
			res.send(JSON.stringify({Status: false}));
		});
  })
  .catch( (err) => {
		console.log("Registration failed. Exception is:\n"+JSON.stringify(err));
		res.send(JSON.stringify({Status: false}));
	});
});
	
//sign in
router.post('/signin', (req, res) => {
	MongoClient.connect(url)
	.then ( (db) => {
		db.collection('Users').findOne({$or: [{'Username': req.body.Username}, {'Email': req.body.Username}]})
		.then ( (user) => {
			if(user === null){
				res.send(JSON.stringify({Status: false, Message: "Invalid Username/Email"}));
			 }else if (((user.Username === req.body.Username) || (user.Email === req.body.Username)) && user.Password === md5(req.body.Password)){
				req.session.username = user.Username;
				req.session.data = user;
				db.collection('Users').updateOne({Username: user.Username}, {$set: {Login: true}})
				.then( (result) => {
					res.send(JSON.stringify({Status: true}));
				 })
				 .catch ( (err) => {
					console.log("Login failed. Exception is:\n"+JSON.stringify(err));
					res.send(JSON.stringify({Status: false}));
				 })
			 }
			 else {
				res.send(JSON.stringify({Status: false, Message: "Invalid Passowrd"}));
			 }
		})
		.catch ( (err) => {
			console.log("Login failed. Exception is:\n"+JSON.stringify(err));
			res.send(JSON.stringify({Status: false}));
		});
	})
	.catch ( (err) => {
		console.log("Login failed. Exception is:\n"+JSON.stringify(err));
		res.send(JSON.stringify({Status: false}));
	});
});

// Logout endpoint
router.get('/logout', (req, res) => {
	MongoClient.connect(url)
	.then ( (db) => {
		db.collection('Users').updateOne({Username: req.session.data.Username}, {$set: {Login: false}})
		.then( (result) => {
			req.session.destroy(function(){
				res.redirect('/login');
			});
		 })
		 .catch ( (err) => {
			console.log("Login failed. Exception is:\n"+JSON.stringify(err));
			res.send(JSON.stringify({Status: false}));
		 })
	})
	.catch ( (err) => {

	})
});

//logged in users list
router.post("/loggedinUsers" , (req, res) => {
	MongoClient.connect(url)
	.then ( (db) => {
		db.collection('Users').find({$and : [{Login : {$eq: true}}, {Username : {$ne : req.session.data.Username}}]}, {Username: 1}).toArray()
		.then( (result) => {
			res.send(JSON.stringify({Status: true, Result: result}));
		 })
		 .catch ( (err) => {
			console.log("Failed to get online users. Exception is:\n"+JSON.stringify(err));
			res.send(JSON.stringify({Status: false}));
		 })
	})
	.catch ( (err) => {
		console.log("Failed to get online users. Exception is:\n"+JSON.stringify(err));
		res.send(JSON.stringify({Status: false}));
	})
});

module.exports = router;
