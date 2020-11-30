const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectionModel = new Schema({
    roomId: { type: mongoose.Schema.ObjectId},
    users: [{ type: mongoose.Schema.ObjectId}],
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

