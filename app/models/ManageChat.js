const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ManageChatModel = new Schema({
    user_id: {
        type:Schema.Types.ObjectId,
        ref: 'Users'
    },
    room_id: {
        type:Schema.Types.ObjectId,
        ref: 'Rooms'
    },
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    },
})

module.exports = mongoose.model('ManageChat', ManageChatModel);

