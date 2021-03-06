const RoomService = require('../services/RoomService');
const UserService = require('../services/UserService');
const ConnectionService= require('../services/ConnectionService');
const {validationResult} = require('express-validator');
const {ROLES} = require('../config/constant');

class RoomController {
    constructor() {
        this.roomService = RoomService;
        this.userService = UserService;
        this.connectionService = ConnectionService;
    }

    async findRoom(req, res) {

        console.log('in find room');
        const {id} = req.params;
        let room = await this.roomService.findRoom({id});
        console.log('id: ', room);
        res.status(room.status).json(room);
    }

    async getListByMe(req, res) {
        try {
            const id = req.user._id;
            //  const { search } = req.query;
            const user = await this.userService.getUserById(id);
            /*let isAdmin = false;
            if (user.role === ROLES.ADMIN) {
                isAdmin = true;
            }*/
            console.log('request:', req.query.search);
            const search = req.query.search;
            let rooms = await this.roomService.getListByMe(search);
            console.log('rooms length: ', rooms.data.length)
            res.render('rooms', {rooms: rooms.data, user: user});
        } catch (error) {
            req.flash('error', 'Get list rooms failed');
            res.status(500).json({
                message: 'Get list rooms failed',
                data: null
            })
        }
    }

    async getListRoomManage(req, res) {
        try {
            let rooms = await this.roomService.getListAll();
             const data ={rooms: rooms.data, status: 200};
            let users = await this.userService.getUser();
            const roomsOnline = await  this.connectionService.getRoomsOnline();
            res.render('manage-room', {data: data, totalNumUsers: users.length , totalNumRooms: rooms.data.length,  numRoomsOnline: roomsOnline });
        } catch (error) {
            req.flash('error', 'Get list rooms failed');
            res.status(500).json({
                message: 'Get list rooms failed',
                data: null
            })
        }
    }


    async getListAll(req, res) {
        try {
            let rooms = await this.roomService.getListAll(req);
            res.status(200).json(rooms);
        } catch (error) {
            res.status(500).json({
                message: 'Get list rooms failed',
                data: null
            })
        }
    }

    async createRoom(req, res) {
        try {
            console.log('----------------------------');
            console.log(req);
            console.log('----------------------------');
            /*            const result = await this.roomService.create(req);
                        if (result.status === 200) {
                            return res.status(result.status).json(result);
                        }
                        req.flash('error', result.message);
                        return res.redirect('/');*/
        } catch (error) {
            console.log(error)
        }
    }

    async editRoom(req, res) {
        try {
            let result = await this.roomService.edit(req);
            return res.status(result.status).json(result);
        } catch (error) {
            res.status(500);
        }
    }

    async updateRoom(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({'message': 'Error', data: errors.array()});
            }
            const result = await this.roomService.update(req);

            return res.status(result.status).json(result);
        } catch (error) {
            console.log(error)
        }
    }

    async deleteRoom(req, res) {
        try {
            const {id} = req.params;
            let result = await this.roomService.delete({id});
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500);
        }
    }

    async joinRoom(req, res) {
        try {
            let result = await this.roomService.joinRoom(req);
            res.status(result.status).json(result);
        } catch (error) {
            res.status(500);
        }
    }

    async checkValidQuantity(req, res) {
        try {
            const {id} = req.params;
            let result = await this.connectionService.checkLimitPeopleInRoom({id});
            res.status(200).json(result);
        } catch (error) {
            res.status(400);
        }
    }

    async checkValidRoomPassword(req, res){
        console.log('request: ', req.body.room_password);
        console.log('request: ', req.body_roomId);
    }

}

module.exports = new RoomController;
