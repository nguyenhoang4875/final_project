const ChatService = require('../services/ChatService');
const RoomService= require('../services/RoomService');
const { validationResult } = require('express-validator');
class ChatController {
    constructor() {
        this.chatService = ChatService;
        this.roomService = RoomService;
    }

    async getMsgNotRender(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;
            let response = await this.chatService.getMsgs({ roomId: id, userId: user._id });
            if (response.status === 200) {
                res.status(200).json(response.chat)
            } else {
                req.flash('error', response.message);
                res.redirect('/')
            }
        } catch (error) {
            console.log(error);
            req.flash('error', 'Get all messages failed!');
            res.redirect('/')
        }
    }

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
    async getMsgByRoomId(req, res) {
        try {
            const { id } = req.params;
            const { user } = req;
            let response = await this.chatService.getMsgs({ roomId: id, userId: user._id });

            if (response.status === 200) {
                res.render('chatroom', {
                    user,
                    room: response.room,
                    message: response.message,
                });
            } else {
                req.flash('error', response.message);
                res.redirect('/')
            }
        } catch (error) {
            console.log(error);
            req.flash('error', 'Get all messages failed!');
            res.redirect('/')
        }
    }


    async getMsgByRoomIdAuth(req, res) {
        try {
            const { user } = req;
            const roomId = req.query.join_room_id;
            const roomPwd= req.query.room_password;
            let response = await this.chatService.getMsgs({ roomId: roomId, userId: user._id });
            let validPassword = await  RoomService.checkValidRoomPassword({roomId,roomPwd});

            if (response.status === 200 && validPassword.data) {
                console.log('join ne');
                res.render('chatroom', {
                    user,
                    room: response.room,
                    message: response.message,
                });
            } else {
                req.flash('error', validPassword.message);
                res.redirect('/')
            }
        } catch (error) {
            console.log(error);
            res.redirect('/')
        }
    }
    
    async createMsg(req, res) {
       try {
           const { user } = req;
           const { message, roomId } = req.body;
           let msg = await this.chatService.createMsg({ userId: user._id, roomId, message });
           res.status(200).json({
               data: msg,
               message: 'Create new msg success'
           })
       } catch (error) {
           res.status(500);
       }
   }

    async updateMsg(req, res) {
        try {
            let msg = await this.chatService.updateMsg(req);
            res.status(200).json({
                data: msg,
                message: 'Edit msg success'
            })
        } catch (error) {
            res.status(500);
        }
    }

    async deleteMsg(req, res) {
        try {
            let msg = await this.chatService.deleteMsg(req);
            res.status(msg.status).json(msg)
        } catch (error) {
            res.status(500);
        }
    }
}

module.exports = new ChatController();
