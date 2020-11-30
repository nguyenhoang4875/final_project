const express = require('express');
const router = express.Router();
const UtilController = require('../controller/UtilController');
const ConnectionService= require('../services/ConnectionService');
const Validator = require('../validators');

// Routes need auth
router.use((req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }else{
        return res.redirect('/');
        return next();

    }
});
// Utils
router.get('/avatars/:roomId', (req, res) => UtilController.getListMaxPeoples(req, res));

module.exports = router;
