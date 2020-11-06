const RoomModel = require('../models/RoomModel');
const UserModel = require('../models/UserModel');
const { ROLES } = require('../config/constant');

class RoomService {
    constructor() {
        this.roomModel = RoomModel;
        this.userModel = UserModel;
    }

    async getListByMe({ id, search = '', isAdmin = false }) {
        try {
            let userId;
            userId = id;
            let rooms;
            if (isAdmin) {
                if (!!search) {
                    rooms = await this.roomModel.find(
                        {
                            $or: [
                                { status: 'active', name: new RegExp(search, 'i') },
                                { status: 'active', "users.username":  new RegExp(search, 'i') },
                                { status: 'active', "users.email":   new RegExp(search, 'i') }]
                        }).sort({updated: -1})
                        .exec();
                } else {
                    rooms = await this.roomModel.find({status: 'active'}).sort({updated: -1}).exec();
                }
            } else {
                if (!!search) {
                    console.log('SERACH:' , search);
                    rooms = await this.roomModel.find({
                        $or: [
                            { status: 'active', "users._id": {$in: [userId]}, name: new RegExp('^'+search+'$', "i") },
                            { status: 'active', "users._id": {$in: [userId]}, "users.username": new RegExp('^'+search+'$', "i") },
                            { status: 'active', "users._id": {$in: [userId]}, "users.email": new RegExp('^'+search+'$', "i") },
                        ]
                    }).sort({updated: -1}).exec();
                } else {
                    rooms = await this.roomModel.find({
                        status: 'active',
                        "users._id": {$all: [userId]}
                    }).sort({updated: -1}).exec();
                }
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
            const {userId} = req;
            let rooms = await this.roomModel.find().populate('').exec();
            return {
                message: 'Get all list room success',
                data: rooms
            }
        } catch (error) {
            console.log(error)
        }
    }

    async checkRole( userId, roomId) {
        const creator = await this.userModel.findOne({ _id: userId }).exec();
        const room = await this.roomModel.findOne({ _id: roomId}).exec();
        if (creator.role !== ROLES.ADMIN && userId.toString() !== room.creator.toString()) {
            return {
                status: 400,
                role: creator.role,
                message: 'Unauthorized'
            }
        }
        return { status: 200, role: creator.role };
    };

    async create({ name ,quantity, level, id }){
        try {

            console.log('----------------------------');
            console.log(name);
            console.log(quantity);
            console.log(level);
            console.log(id);
            console.log('----------------------------');

            //let img = image ? await CommonService.uploadImage(image) : '';
            //await this.checkRole({ userId: id });
            let room = await this.roomModel.create({name, quantity: quantity , level: level, creator: id});
            const admins = await UserModel.find({ role: ROLES.ADMIN }).select('-password -mail_token').exec();
            await admins.map( async admin => {
                await this.roomModel.update({_id: room._id},{ $push: { users: admin }}).exec()
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


    async edit(req){
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

    async setStatusRoom(roomId, status){
        try {
            await this.roomModel.updateOne({_id: roomId},{status: status}).exec();
            let result = await this.roomModel.findOne({_id: roomId}).exec();
            return {
                status: 200,
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

    async update({ name, level, quantity, id, roomId }){
        try {

            await this.roomModel.update({_id: roomId},{name, level,quantity}).exec();

            /*
                        if (role.role === ROLES.ROOM_MASTER) {
                            const admins = await UserModel.find({ role: ROLES.ADMIN }).select('-password -mail_token').exec();
                            await admins.map( async admin => {
                                await this.roomModel.update({_id: room._id},{ $push: { users: admin }}).exec()
                            });
                        }

                        await Promise.all(
                            members.map(email =>
                                this.userModel.findOne({ email }).select('-password -mail_token').exec()))
                            .then(async users => {
                                    await this.roomModel.update({_id: roomId}, {$push: {users}}).exec();
                                }
                            );
            */
            let result = await this.roomModel.findOne({_id: roomId}).exec();
            return {
                status: 200,
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

    async delete({ id }){
        try {
            let room = await this.roomModel.deleteOne({ _id: id }).exec();
            return {
                status: room.deletedCount ? 200 : 400,
                message: room.deletedCount ? 'Delete data success!' : 'Room is not exist',
                room: {
                    isDelete: true,
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

    async findRoom({ id }) {
        try {
            let room = await this.roomModel.findOne({_id: id}).exec();
            if(!room){
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
            let result = await this.roomModel.updateOne({_id: room_id, "users.user_id": {$nin: [ user.id ] }}, {
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
}

module.exports = new RoomService;
