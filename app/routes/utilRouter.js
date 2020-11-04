const express = require('express');
const router = express.Router();
const UtilController = require('../controller/UtilController');
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
router.get('/max-peoples', (req, res) => UtilController.getListMaxPeoples(req, res));
router.get('/levels', (req, res) => UtilController.getLevels(req, res));

module.exports = router;
