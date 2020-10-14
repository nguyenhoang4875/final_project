'use strict';
const configProperties = require("./config.json")


const init = function () {
		return {
			db: {
				username: configProperties.db.dbUsername,
				password: configProperties.db.dbPassword,
				host: configProperties.db.dbHost,
				port: configProperties.db.dbPort,
				name: configProperties.db.dbName
			},
			sessionSecret: configProperties.sessionSecret,
			facebook: {
				clientID: configProperties.facebook.facebookClientID,
				clientSecret: configProperties.facebook.facebookClientSecret,
				callbackURL: "/auth/facebook/callback",
				profileFields: ['id', 'displayName', 'photos']
			},
	}
};

module.exports = init();
