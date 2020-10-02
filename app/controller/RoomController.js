const RoomService = require('../services/RoomService');
const UserService = require('../services/UserService');
const { validationResult } = require('express-validator');
const { ROLES } = require('../config/constant');
class RoomController {
    constructor() {
        this.roomService = RoomService;
        this.userService = UserService;
    }

    async findRoom(req, res) {
        const {id} = req.params;
        let room = await this.roomService.findRoom({ id });
        res.status(room.status).json(room);
    }

    async getListByMe(req, res) {
        try {
            const id  = req.user._id;
            const { search } = req.query;
            const user = await this.userService.getUserbyId(id);
            let isAdmin = false;
            if (user.role === ROLES.ADMIN) {
                isAdmin = true;
            }
            let rooms = await this.roomService.getListByMe({ id, isAdmin, search });
            res.render('rooms', { rooms: rooms.data, user });
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
            const result = await this.roomService.create(req);
            if (result.status === 200) {
                return res.status(result.status).json(result);
            }
            req.flash('error', result.message);
            return res.redirect('/');
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
           let result = await this.roomService.delete(req);
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
}

module.exports = new RoomController;