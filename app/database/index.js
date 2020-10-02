'use strict';

const config = require('../config');
const Mongoose = require('mongoose');
const logger = require('../logger');
const dotenv = require('dotenv');
const { DB_HOST_CHAT, DB_NAME_CHAT } = process.env;
//Thiết lập một kết nối mongoose mặc định
const mongoDB = `mongodb://localhost:27017/video_chat`;

// Connect to the database
// construct the database URI and encode username and password.

Mongoose.connect(mongoDB, { useNewUrlParser: true });

// Throw an error if the connection fails
Mongoose.connection.on('error', function(err) {
	if(err) console.log(err);
});

// mpromise (mongoose's default promise library) is deprecated, 
// Plug-in your own promise library instead.
// Use native promises
Mongoose.Promise = global.Promise;

module.exports = { Mongoose, 
	models: {
		user: require('./schemas/user.js'),
		room: require('./schemas/room.js')
	}
};
