const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const { ROLES, STATUS_USER } = require('../config/constant');

const UserModel = new Schema({
    id: Schema.Types.ObjectId,
    username: String,
    password: String,
    avatar: {
        type: String,
        default: '/img/user.jpg'
    },
    email: String,
    mail_token: String,
    remebertoken: String,
    status: {
        type: Number,
        default: STATUS_USER.ACTIVE
    },
    role: {
        type: Number,
        default: ROLES.MEMBER
    },
    created: {
       type: Date,
       default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now()
    },
});

UserModel.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};


module.exports = mongoose.model('User', UserModel );

