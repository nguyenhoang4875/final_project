const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { DB_HOST_CHAT, DB_NAME_CHAT } = process.env;
//Thiết lập một kết nối mongoose mặc định
const mongoDB = `mongodb://${DB_HOST_CHAT}/${DB_NAME_CHAT}`;

class Mongodb {

    async connect() {
        const options = {
            useNewUrlParser: true,
            useFindAndModify: false
            //user:
            //pass:
        }
        //Ép Mongoose sử dụng thư viện promise toàn cục
        mongoose.Promise = global.Promise;

        mongoose.connect(mongoDB, options).then(
            () => {
                console.log('Connect to Mongo Success');
            },
            err => {
                console.log('Connect Failed ');
                console.log(err);
            }
        );
    }
}

module.exports = new Mongodb();
