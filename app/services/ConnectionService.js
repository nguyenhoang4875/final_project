const ConnectionModel = require('../models/ConnectionModel');
const RoomModel = require('../models/RoomModel');

class ConnectionService {
    constructor() {
        this.connectModel = ConnectionModel;
        this.roomModel = RoomModel;
    }

    async newConnect({ roomId, userId }) {
        try {
            let conn = await this.connectModel.findOne({roomId}).exec();

            if (!conn) {
                await this.connectModel.create({roomId});
            }

            await this.connectModel.update({roomId}, {$push: { users: userId+'' }, updated: Date.now()}).exec();
            conn = await this.connectModel.findOne({roomId}).exec();

            return {
                status: 200,
                conn
            }
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: null
            }
        }
    }

    async removeConnect({ roomId, userId }) {
        try {
            let conn = await this.connectModel.findOne({roomId}).exec();
            let room = await this.roomModel.findOne({ _id: roomId }).exec();
            if (!conn) {
                return {
                    status: 400,
                    data: null
                }
            }

            const users = conn.users;
            const usersInRoom = room.users;

            if ( users.indexOf(userId+'') !== -1) {
                await this.connectModel.update({ roomId }, { $pull: { users: userId+'' } } )
            }

            conn = await this.connectModel.findOne({roomId}).exec();
            return {
                status: 200,
                conn,
                usersInRoom
            }

        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = new ConnectionService;