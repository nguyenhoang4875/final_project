const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectionModel = new Schema({
    roomId: String,
    users: [String],
    created: {
        type: Date,
        default: Date.now()
    },
    updated: {
        type: Date,
        default: Date.now()
    },
})

module.exports = mongoose.model('Connections', ConnectionModel);

