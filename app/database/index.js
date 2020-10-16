'use strict';

const config = require('../config/config.json');
const Mongoose = require('mongoose');
const logger = require('../logger');
const dotenv = require('dotenv');
const { DB_HOST_CHAT, DB_NAME_CHAT } = process.env;
//const mongoDB = `mongodb+srv://mariana:mariana@cluster0.h8dsg.mongodb.net/mariana?retryWrites=true&w=majority`;
const dbURI = "mongodb://" +
	encodeURIComponent(config.db.username) + ":" +
	encodeURIComponent(config.db.password) + "@" +
	config.db.host + ":" +
	config.db.port + "/" +
	config.db.name;

console.log('dbURI ', dbURI);

Mongoose.connect(dbURI, { useNewUrlParser: true });

// Connect to the database
// construct the database URI and encode username and password.

//Mongoose.connect(mongoDB, { useNewUrlParser: true });

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
