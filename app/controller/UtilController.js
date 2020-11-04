const UtilService = require('../services/UtilService');
const {validationResult} = require('express-validator');

class UtilController {
    constructor() {
        this.utilService = UtilService;
    }

    async getListMaxPeoples(req, res) {
        let maxPeoples = await this.utilService.getListMaxPeoples();
        res.status(200).json(maxPeoples);
    }

}

module.exports = new UtilController;
