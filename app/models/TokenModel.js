const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TokenModel = new Schema({
    name: String,
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    token: String,
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
});

module.exports = mongoose.model('Tokens', TokenModel);

