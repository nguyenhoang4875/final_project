const express = require('express');
const router = express.Router();
const UserController = require('../controller/UserController');

//Auth
router.use((req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }else{
        return res.redirect('/');
    }
});

router.get('/me/info', (req, res) => UserController.getCurrentUserById({req, res}));
router.get('/', (req, res) => UserController.getList({req, res}));
router.get('/all', (req, res) => UserController.getListAll({req, res}));
router.get('/:id', (req, res) => UserController.getUserById({req, res}));
router.post('/create', (req, res) => UserController.create({req, res}));


module.exports = router;
