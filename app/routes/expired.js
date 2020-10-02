var express	 	= require('express');
var router 		= express.Router();
var passport 	= require('passport');

var User = require('../models/user');
var Room = require('../models/room');

// Home page
router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	if(req.isAuthenticated()){
		res.redirect('/rooms');
	}
	else{
		res.render('login', {
			success: req.flash('success')[0],
			errors: req.flash('error'), 
			showRegisterForm: req.flash('showRegisterForm')[0]
		});
	}
});

// Login
router.post('/login', passport.authenticate('local', { 
	successRedirect: '/rooms', 
	failureRedirect: '/',
	failureFlash: true
}));

// Register via username and password
router.post('/register', async function(req, res, next) {
	console.log('REGISTER: ', req.body);
	var credentials = {
		'username': req.body.username, 
		'email': req.body.email, 
		'password': req.body.password, 
		'cfpassword': req.body.cfpassword 
	};

	if( credentials.username === '' 
		|| credentials.password === '' 
		|| credentials.email === '' 
		|| credentials.cfpassword === ''
	){
		req.flash('error', 'Missing credentials');
		req.flash('showRegisterForm', true);
		res.redirect('/');
	}else{
		
		// Check if the username already exists for non-social account
		User.findOne({
			'username': new RegExp('^' + req.body.username + '$', 'i'), 
			'socialId': null
		}, function(err, user){
			if(err) throw err;
			if(user){
				req.flash('error', 'Username already exists.');
				req.flash('showRegisterForm', true);
				return res.redirect('/');
			}
		}, function() {

		});

		// Check if the email already exists
		User.findOne({ 'email': req.body.email }, 
		function(err, user){
			if(err) throw err;
			if(user){
				req.flash('error', 'Emai already exists.');
				req.flash('showRegisterForm', true);
				return res.redirect('/');
			}
		});

		// Check confirm password is same password
		if ( credentials.cfpassword !== credentials.password ) {
			req.flash('error', 'Comfirm password invalid !.');
			req.flash('showRegisterForm', true);
			return res.redirect('/');
		}

		// Create user
		console.log('CREATED');
		User.create(credentials, function(err, newUser){
			if(err) throw err;
			req.flash('success', 'Your account has been created. Please log in.');
			res.redirect('/');
		});
	}
});

// Social Authentication routes
// 1. Login via Facebook
router.get('/auth/facebook', passport.authenticate('facebook'));
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect: '/rooms',
		failureRedirect: '/',
		failureFlash: true
}));

// 2. Login via Twitter
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
		successRedirect: '/rooms',
		failureRedirect: '/',
		failureFlash: true
}));

// Rooms
router.get('/rooms', [User.isAuthenticated, function(req, res, next) {
	Room.find(function(err, rooms){
		if(err) throw err;
		res.render('rooms', { rooms });
	});
}]);

// Chat Room 
router.get('/chat/:id', [User.isAuthenticated, function(req, res, next) {
	var roomId = req.params.id;
	Room.findById(roomId, function(err, room){
		if(err) throw err;
		if(!room){
			return next(); 
		}
		res.render('chatroom', { user: req.user, room: room });
	});
	
}]);

// Logout
router.get('/logout', function(req, res, next) {
	// remove the req.user property and clear the login session
	req.logout();

	// destroy session data
	req.session = null;

	// redirect to homepage
	res.redirect('/');
});

module.exports = router;