const { MAX_PEOPLES, LEVELS} = require('../config/constant');

class UtilService {
    constructor() {
    }

    async getListMaxPeoples() {
        try {
            return MAX_PEOPLES;
        } catch (error) {
            console.log(error);
        }
    }

    async getLevels() {
        try {
            return LEVELS;
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = new UtilService;
