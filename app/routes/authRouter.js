const express = require('express');
const router = express.Router();
const AuthController = require('../controller/authController');
const Validator = require('../validators');
const passport 	= require('passport');

// Router register.
router.post('/register', (req, res, next) => Validator.registerValidator(req, res, next), (req, res) => AuthController.register(req, res));

router.post('/confirm-register', (req, res) => AuthController.confirmRegister(req, res));

// Router login.
router.post('/login',  passport.authenticate('local', {
    successRedirect: '/rooms/me',
    failureRedirect: '/',
    failureFlash: true
}));

//router.post('/logout', (req, res) => AuthController.logout(req, res));
// Logout
router.get('/logout', function(req, res, next) {
    // remove the req.user property and clear the login session
    req.logout();

    // destroy session data
    req.session = null;

    // redirect to homepage
    res.redirect('/');
});

// Social Authentication routes
// 1. Login via Facebook
router.get('/facebook', passport.authenticate('facebook'));
router.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/rooms/me',
    failureRedirect: '/',
    failureFlash: true
}));


module.exports = router;
