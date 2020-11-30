const ConnectionService = require('../services/ConnectionService');
const {validationResult} = require('express-validator');

class ConnectionController {
    constructor() {
        this.connectionService = ConnectionService;
    }

    async getUsersInConnectionByRoomId(req, res) {
        let roomId = req.params.roomId;
        let result = await this.connectionService.getUsersInConnectionByRoomId(roomId);
        res.status(200).json(result);
    }

}

module.exports = new ConnectionController;
