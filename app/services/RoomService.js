const RoomModel = require('../models/RoomModel');
const UserModel = require('../models/UserModel');
const {ROLES, STATUS_ROOM} = require('../config/constant');

class RoomService {
    constructor() {
        this.roomModel = RoomModel;
        this.userModel = UserModel;
    }

    async getListByMe(search = '') {
        try {
            let rooms;
                if (!!search) {
                    rooms = await this.roomModel.find(
                        {
                            $or: [ { name: new RegExp(search, 'i')} ]
                        }).sort({updated: -1}) .exec();
                } else {
                    rooms = await this.roomModel.find().sort({updated: -1}).exec();
                }
            return {
                message: 'Get list room success',
                data: rooms
            }
        } catch (error) {
            console.log(error)
        }
    }

    async getListAll(req) {
        try {
            let rooms = await this.roomModel.find().sort({created: -1}).exec();
            return {
                message: 'Get all list room success',
                data: rooms
            }
        } catch (error) {
            console.log(error)
        }
    }

    async checkRole(userId, roomId) {
        const creator = await this.userModel.findOne({_id: userId}).exec();
        const room = await this.roomModel.findOne({_id: roomId}).exec();
        if (creator.role !== ROLES.ADMIN && userId.toString() !== room.creator.toString()) {
            return {
                status: 400,
                role: creator.role,
                message: 'Unauthorized'
            }
        }
        return {status: 200, role: creator.role};
    };

    async create({name, level, quantity, userId, roomPwd}) {
        try {
            let statusRoom = STATUS_ROOM.ACTIVE;
            if (roomPwd.trim() != '') {
                statusRoom = STATUS_ROOM.AUTH
            }

            let room = await this.roomModel.create({
                name: name,
                quantity: quantity,
                level: level,
                creator: userId,
                password: roomPwd,
                status: statusRoom
            });
            const admins = await UserModel.find({role: ROLES.ADMIN}).select('-password -mail_token').exec();
            await admins.map(async admin => {
                await this.roomModel.update({_id: room._id}, {$push: {users: admin}}).exec()
            });
            room = await this.roomModel.findOne({_id: room._id}).exec();
            return {
                status: 200,
                message: 'Create room success',
                room
            }
        } catch (error) {
            return {
                status: 500,
                message: 'Create room failed',
                data: error
            }
        }
    }


    async edit(req) {
        try {
            const {id} = req.params;
            const {userId} = req;
            let room = await this.roomModel.findOne({_id: id, "users.user_id": userId}).exec();
            return {
                status: 200,
                message: 'Get data edit success!',
                data: room
            }
        } catch (error) {
            return {
                status: 400,
                message: 'Room is not exits',
                data: null
            }
        }
    }

    async setStatusRoom(roomId, status) {
        try {
            await this.roomModel.updateOne({_id: roomId}, {status: status}).exec();
            let room = await this.roomModel.findOne({_id: roomId}).exec();
            return {
                status: 200,
                message: 'Update data success!',
                room: room
            }
        } catch (error) {
            return {
                status: 500,
                message: 'Update data failed',
                data: error
            }
        }
    }

    async getRoomStatus(roomId){
        try {
            let result = await this.roomModel.findOne({_id: roomId}).exec();
            return  result.status;
        } catch (error) {
            return {
                status: 500,
                message: 'get room status fail',
                data: error
            }
        }

    }

    async update({name, level, quantity, userId, roomId, roomPwd}) {
        try {
            console.log('in update room ')
            let statusRoom = STATUS_ROOM.ACTIVE;
            if (roomPwd.trim() != '') {
                statusRoom = STATUS_ROOM.AUTH
            };

            await this.roomModel.update({_id: roomId}, {
                name: name,
                quantity: quantity,
                level: level,
                creator: userId,
                password: roomPwd,
                status: statusRoom
            }).exec();

            let result = await this.roomModel.findOne({_id: roomId}).exec();
            return {
                status: 200,
                isUpdate: true,
                message: 'Update data success!',
                room: result
            }
        } catch (error) {
            return {
                status: 500,
                message: 'Update data failed',
                data: error
            }
        }
    }

    async delete({id}) {
        try {
            let room = await this.roomModel.deleteOne({_id: id}).exec();
            console.log('in delete Room Service id:', id);
            return {
                status: room.deletedCount ? 200 : 400,
                message: room.deletedCount ? 'Delete data success!' : 'Room is not exist',
                isDelete: true,
                room: {
                    _id: id,
                    status: room.deletedCount ? 200 : 400,
                    message: room.deletedCount ? 'Delete data success!' : 'Room is not exist',
                },
            };
        } catch (error) {
            return {
                status: 500,
                isDelete: true,
                message: 'Delete data failed',
                data: error
            }
        }
    }

    async findRoom({id}) {
        try {
            let room = await this.roomModel.findOne({_id: id}).exec();
            if (!room) {
                return {
                    status: 400,
                    message: 'Room is not exist',
                    data: null
                }
            }
            return {
                status: 200,
                message: 'Get room detail success',
                data: room
            }
        } catch (error) {
            console.log(error);
            return {
                status: 400,
                message: 'Room is not exist',
                data: error
            }
        }
    }

    async joinRoom(req) {
        try {
            const {room_id, user} = req.body;
            let result = await this.roomModel.updateOne({_id: room_id, "users.user_id": {$nin: [user.id]}}, {
                $push: {
                    users: {
                        user_id: user.id,
                        name: user.name,
                        status: 'active'
                    }
                }
            }).exec();
            return {
                status: 200,
                data: null,
                message: 'Joined success ! Chat now'
            }
        } catch (error) {
            return {
                message: 'Join fail',
                status: 400,
                data: null
            }
        }
    }

    async checkValidRoomPassword({roomId, roomPwd}) {
        try {
            let room = await this.roomModel.findOne({_id: roomId}).exec();
            if (room.password === roomPwd) {
                return {
                    status: 200,
                    message: 'Valid room password',
                    data: true
                }
            }
            else {
                return {
                    status: 400,
                    message: 'Invalid room password',
                    data: false
                }
            }
        } catch (error) {
            console.log(error);
            return {
                status: 400,
                message: 'Room is not exist',
                data: false
            }
        }
    }
}

module.exports = new RoomService;
