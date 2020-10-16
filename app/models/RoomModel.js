const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomModel = new Schema({
    name: String,
    creator: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    quantity: String,
    level: String,
    users: [],
    status: {
        type: String,
        default: 'active'
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

module.exports = mongoose.model('Rooms', RoomModel);

