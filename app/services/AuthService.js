const UserModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const CommonService = require('../services/CommonService');
const jwt = require('json-web-token');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const ENCODE_KEY = 'datn_2019_by_hd';

class AuthService {
    constructor() {
        this.userModel = UserModel;
        this.tokenModel = TokenModel;
    }

    /**
     * register function.
     * @returns {Promise<*>}
     * @param req
     */
    async register(req) {
        try {
            const {body} = req;
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
            const {USER_PASSWORD_SALT_ROUNDS: saltRounds = 10} = process.env;
            const passwordHash = await bcrypt.hash(body.password, +saltRounds);

            let user_exist = await this.userModel.findOne({
                'username': body.username
            }).exec();
            if (!_.isEmpty(user_exist)) {
                return {
                    status: 400,
                    message: 'Username is existed',
                    data: null
                }
            }

            if (await CommonService.validateEmail(body.email) === false) {
                return {
                    status: 400,
                    message: 'Email is not valid !',
                    data: null
                }
            }

            let email_exist = await this.userModel.findOne({
                'email': body.email
            }).exec();

            if (!_.isEmpty(email_exist)) {
                return {
                    status: 400,
                    message: 'Email is existed',
                    data: null
                }
            }

            let mail_token = '';
            for (let i = 0; i < 15; i++) {
                let random = (Math.random() * (charset.length - 1 - 0) + 0) | 0;

                mail_token += charset[random];
            }

            const userMongo = new this.userModel({
                username: body.username,
                avatar: body.avatar,
                email: body.email,
                mail_token,
                password: passwordHash
            });

            await userMongo.save(err => {
                if (err) {
                    return {
                        status: 500,
                        message: 'Register Failed',
                        data: err
                    }
                }
            });

            let result = await this.token(userMongo);
            if (!result) {
                return {
                    status: 500,
                    message: 'Create token failed',
                    data: null
                }
            }
            return {
                status: 200,
                message: 'Your account has been created. Please log in.',
            }

        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Confirm User Registration after they click link in mail
     * @param: token
     * @return: {void} json
     */
    async confirmRegister(req) {
        try {
            // Init
            const data = req.body;
            let mail_token = data.mail_token;
            const user = await this.userModel.findOne({mail_token}).exec();

            // Process
            if (!user || !mail_token) {
                return {
                    status: 403,
                    message: 'Comfirmed !',
                    data: null
                };
            } else {
                let token = await this.token(user);
                user.mail_token = null;
                user.save();

                return {
                    status: 200,
                    message: 'Confirm Success !',
                    data: token
                };
            }
        } catch (error) {

        }
    }

    /**
     * Login Service
     * @param {*} req
     */
    async login(req) {
        try {
            const {username, password} = req.body;
            const user = await this.userModel.findOne({
                username
            }).exec();
            if (!user) {
                return {
                    status: 400,
                    message: 'Username is not existed',
                    data: null
                }
            }

            const check_psw = await bcrypt.compare(password, user.password);
            if (!check_psw) {
                return {
                    status: 400,
                    message: 'Your password entered is incorrect',
                    data: null
                }
            }

            // update new token
            let result = await this.token(user);
            if (!result) {
                return {
                    status: 500,
                    message: 'Login failed',
                    data: null
                }
            }
            return {
                status: 200,
                message: 'Login success !',
                data: result
            }
        } catch (error) {
            console.log(error);
        }
    }

    async logout(req) {
        try {
            const {token} = req;
            token.status = 'inactive';
            token.updated = Date.now();
            token.save();
            return token;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Function check token
     * @param {*} token
     */
    async checkToken(token) {
        let data = await this.tokenModel.findOne({
            token,
            status: 'active'
        }).exec();
        if (!_.isEmpty(data))
            return data;
        return null;
    }

    /**
     * Create or Update token
     * @param {*} user_id
     */
    async token(user) {
        const user_id = user._id;
        let token = await jwt.encode(ENCODE_KEY, {
            id: user_id,
            username: user.username,
            avatar: user.avatar,
            create: user.created,
            email: user.email,
            timestamp: new Date().getTime()
        });

        let token_exist = await this.tokenModel.findOne({
            user_id
        }).exec();
        if (token_exist) {
            token_exist.token = token.value;
            token_exist.updated = Date.now();
            token_exist.status = 'active';
            token_exist.save();
            return token.value;

        } else {
            let dataToken = await this.tokenModel.create({
                token: token.value,
                status: 'inactive',
                user_id
            });
            return dataToken.token;
        }
    }
}

module.exports = new AuthService();