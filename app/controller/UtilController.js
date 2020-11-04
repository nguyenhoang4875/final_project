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

    async getLevels(req, res) {
        let levels = await this.utilService.getLevels();
        res.status(200).json(levels);
    }
}

module.exports = new UtilController;
