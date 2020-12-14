const ConnectionModel = require('../models/ConnectionModel');
const RoomModel = require('../models/RoomModel');
const UserModel = require('../models/UserModel');

class ConnectionService {
    constructor() {
        this.connectModel = ConnectionModel;
        this.roomModel = RoomModel;
        this.userModel = UserModel;

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

    async getNumberCurrentConnections({ roomId }) {
        try {
            let conn = await this.connectModel.findOne({roomId}).exec();
            let numbers = 0;
            if (!conn){
                numbers = conn.users.length;
            }
            return numbers;
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: null
            }
        }
    }

    async checkLimitPeopleInRoom({ roomId }) {
        try {
            let conn = await this.connectModel.findOne({roomId}).exec();
            let room = await this.roomModel.findOne({ _id: roomId }).exec();
            let quantityRoom = room.quantity;
            if (quantityRoom === 'Unlimited'){
                return true;
            }

            let numbers = 0;
            if (conn){
                numbers = conn.users.length;
            }

            console.log('quantity room is : ',room.quantity);
            console.log('number of connections : ',numbers);

            return parseInt(quantityRoom) > numbers;
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: 'error when check limit people in room'
            }
        }
    }

    async canChangeRoomStatus({roomId}){

        try {
            let conn = await this.connectModel.findOne({roomId}).exec();
            let room = await this.roomModel.findOne({ _id: roomId }).exec();
            let quantityRoom = room.quantity;
            if (quantityRoom === 'Unlimited'){
                return false;
            }
            let numbers = 0;
            if (conn){
                numbers = conn.users.length;
            }

            return (parseInt(quantityRoom)) - numbers == 1;
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: 'error when check can change room status'
            }
        }
    }


    async removeConnect({ roomId, userId }) {
        try {
            console.log('remove connections in room');
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

    async getUsersInConnection( roomId ) {
        try {
            let conn = await this.connectModel.findOne({roomId}).exec();
            let listUserId = conn.users;
            let room = await this.roomModel.findOne({_id: roomId});
            let listUserAvatarInConnection = [];
            for (const x of listUserId) {
               let avatarUrl = await this.userModel.findOne({_id: x}, {avatar: 1}).exec();
                listUserAvatarInConnection.push(avatarUrl.avatar);
            }
            return {
                status: 200,
                usersInRoom: listUserAvatarInConnection,
                roomId: roomId,
                roomQuantity: room.quantity
            }
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: null
            }
        }
    }

    async getUsersInConnectionByRoomId(roomId) {
        try {
            let conn = await this.connectModel.aggregate([
                {
                    $lookup:{
                        from: "users",       // other table name
                        localField: "users",   // name of users table field
                        foreignField: "_id", // name of userinfo table field
                        as: "connections_users"         // alias for userinfo table
                    }
                },
                {
                    $match: {
                        $and: [{"roomId": roomId}]
                    }
                },

                {
                    $unwind:"$connections_users"
                },
                {
                    $project:{
                        "_id":0,
                        "avatar" :"$connections_users.avatar"
                    }
                }
            ]).exec();
            return {
                status: 200,
                data: conn
                // usersInRoom: listUserAvatarInConnection
            }
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: null
            }
        }
    }

    async getAvatarUsersInRoom(roomId) {
        try {
            let conn = await this.connectModel.aggregate([
                {
                    $lookup:
                        {
                            from: "user",
                            localField: "users",
                            foreignField: "_id",
                            as: "user_in_room"
                        }
                }
            ]).exec();
            // let listUserId = conn.users;
            // let listUserAvatarInConnection = [];
            // for (const x of listUserId) {
            //     let avatarUrl = await this.userModel.findOne({_id: x}, {avatar: 1}).exec();
            //     listUserAvatarInConnection.push(avatarUrl);
            // }
            console.log('print conn', conn);
            return {
                status: 200,
                // usersInRoom: listUserAvatarInConnection
            }
        } catch (e) {
            console.log(e);
            return {
                status: 400,
                data: null
            }
        }
    }
}

module.exports = new ConnectionService;
