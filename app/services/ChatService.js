const ChatModel = require('../models/ChatModel');
const RoomModel = require('../models/RoomModel');
const UserModel = require('../models/UserModel');

class ChatService {
    constructor() {
        this.chatModel = ChatModel;
        this.roomModel = RoomModel;
        this.userModel = UserModel;
    }
    
    async createMsg({ message, roomId, userId }) {
        try{
            const user = await this.userModel.findOne({ _id: userId });

            const new_msg = await this.chatModel.create({
                sender_id: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role
                },
                message,
                room_id: roomId,
            });
            return new_msg;
        }
        catch(error){
            console.log(error);
        }
    }

    async updateMsg(req) {
        try{
            const data = req.body;
            let update_msg = await this.chatModel.update({_id: data.id},{
                message: data.message,
                updated: Date.now()
            }).exec();
            let new_msg = await this.chatModel.findOne({_id: data.id}).exec();
            return new_msg;
        }
        catch(error){
            console.log(error);
        }
    }

    async deleteMsg(req) {
        try{
            const { msg_id } = req.params;
            let del_msg = await this.chatModel.deleteOne({_id: msg_id}).exec();
            return {
                message: del_msg.deletedCount == 1 ? 'Delete message success !' : 'Delete message failed !' ,
                status: del_msg.deletedCount == 1 ? 200 : 500,
                data: null
            }
        }
        catch(error){
            console.log(error);
        }
    }

    async getMsgs({ roomId, userId, limit = null }) {
        try {
            const room = await this.roomModel.findOne({ _id: roomId }).exec();
            let users = room.users;
            users = users.map(user => user._id );

            if (!room || users.indexOf(userId) === -1) {
                return {
                    status: 400,
                    message: 'Room is not exist !',
                    data: null
                };
            }

            const result = limit ?
                await this.chatModel.find({room_id: roomId}).sort('created').limit(limit).exec()
                : await this.chatModel.find({room_id: roomId}).sort('created').exec();

            return {
                status: 200,
                message: "Get messages chat successful !",
                room,
                chat: result
            }
        } catch (error) {
            console.log(error);
            return null
        }
    }
}

module.exports = new ChatService();

