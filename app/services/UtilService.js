class UtilService {
    constructor() {
    }

    async getListMaxPeoples() {
        try {
            const maxPeoples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            return maxPeoples;
        } catch (error) {
            console.log(error);
        }
    }

    async getLevels() {
        try {
            const levels = ["Any Level", "Beginner", "Upper Beginner", "Intermediate", "Upper Intermediate", "Advanced", "Upper Advanced"];
            return levels;
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = new UtilService;
