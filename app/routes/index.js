const express = require('express');
const router = express.Router();

const authRouter = require('./authRouter');
const roomRouter = require('./roomRouter');
const userRouter = require('./userRouter');
const chatRouter = require('./chatRouter');
// Home page
router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	if(req.isAuthenticated()){
		return res.redirect('/rooms/me');
	}
	else{
		res.render('login', {
			success: req.flash('success')[0],
			errors: req.flash('error'), 
			showRegisterForm: req.flash('showRegisterForm')[0]
		});
	}
});

router.use('/auth', authRouter);
router.use('/rooms', roomRouter);
router.use('/users', userRouter);
router.use('/chat', chatRouter);

module.exports = router;
