const UserModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const jwt = require('json-web-token');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const CommonService = require('../services/CommonService');
const {ENCODE_KEY} = process.env;
const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
const { USER_PASSWORD_SALT_ROUNDS: saltRounds = 10 } = process.env;
const { STATUS_USER, TYPES} = require('../config/constant');

class UserService {
    constructor() {
        this.userModel = UserModel;
        this.tokenModel = TokenModel;
    }

    /**
     *
     * @param id
     * @returns {Promise<*>}
     */
    async getUserById(id){
        try {
            const user = await this.userModel.findOne({_id: id}).select('-password -mail_token').exec();
            return user;
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Get list user in DB
     * @param search
     * @param limit
     * @param page
     * @param status = [ 0 ( Get all : active, delete ), 1 ( active ) ]
     * @returns {Promise<{current: number, total: *, message: string, users: *, status: number}>}
     */
    async getList({ search = '', limit = -1, page = 0, status = 1 }){
        let query, total, users;
        if (!!search) {
            users = await this.userModel.find({
                $or: [
                    {username:  new RegExp(search, 'i') },
                    {email:   new RegExp(search, 'i') }
                ]}).select('-password').sort({created: -1}).exec();

            total = users.length;
        } else {
            query = this.userModel.find(status === 1 ? { status: 1 } : {}).select('-password').sort({created: -1});
            users = limit === -1 ? await query.exec() : await query.skip(page*limit).limit(limit).exec();
            total = await this.userModel.countDocuments({});
        }

        return {
            status: 200,
            'message': 'get-user-success',
            users,
            current: Number(page) + 1,
            total
        };
    }

    async getUser(){
        const users = await this.userModel.find();
        console.log('users in service: ', users);
        return users;
    }

    /**
     * Create user
     * @param username
     * @param email
     * @param role
     * @param password
     * @returns {Promise<{data: null, type: string, message: string, status: number}|{type: string, message: string, user: *, status: number}>}
     */
    async createUser({ username, email, role, password }) {
        try {
            const passwordHash = await bcrypt.hash(password, +saltRounds);
            let user_exist = await this.userModel.findOne({ username }).exec();
            if (!_.isEmpty(user_exist)) {
                return {
                    status: 400,
                    type: TYPES.CREATE,
                    message: 'Username is existed',
                    data: null
                }
            }

            if (await CommonService.validateEmail(email) === false) {
                return {
                    status: 400,
                    type: TYPES.CREATE,
                    message: 'Email is not valid !',
                    data: null
                }
            }

            let email_exist = await this.userModel.findOne({ email }).exec();
            if (!_.isEmpty(email_exist)) {
                return {
                    status: 400,
                    type: TYPES.CREATE,
                    message: 'Email is existed',
                    data: null
                }
            }

            let mail_token = '';
            for (let i = 0; i < 15; i++) {
                let random = (Math.random() * (charset.length - 1 - 0) + 0) | 0;

                mail_token += charset[random];
            }

            const user = await this.userModel.create({
                username,
                email,
                role,
                mail_token,
                password: passwordHash
            });

            return {
                status: 200,
                type: TYPES.CREATE,
                message: 'Account has been created.',
                user
            }
        } catch (e) {
            console.log(e);
            return {
                status: 500,
                type: TYPES.CREATE,
                message: 'An error when create user !',
                data: null
            }
        }
    }

    /**
     * Update User
     * @param username
     * @param email
     * @param id
     * @param role
     * @param oldPassword
     * @param newPassword
     * @param userId
     * @returns {Promise<{data: null, type: string, message: string, status: number}|{message: string, type: string, user: *, status: number}>}
     */
    async updateUser({ username, email, id, role, oldPassword, newPassword, userId }){
        try {
            let user = await this.userModel.findOne({_id: userId}).exec();

            if(user){
                let user_exist = await this.userModel.findOne({ _id: { $ne: userId }, username }).exec();

                if (!_.isEmpty(user_exist)) {
                    return {
                        status: 400,
                        type: TYPES.UPDATE,
                        message: 'Username is existed',
                        data: null
                    }
                }

                if (await CommonService.validateEmail(email) === false) {
                    return {
                        status: 400,
                        type: TYPES.UPDATE,
                        message: 'Email is not valid !',
                        data: null
                    }
                }

                let email_exist = await this.userModel.findOne({ _id: { $ne: userId }, email }).exec();

                if (!_.isEmpty(email_exist)) {
                    return {
                        status: 400,
                        type: TYPES.UPDATE,
                        message: 'Email is existed',
                        data: null
                    }
                }
                await this.userModel.update({ _id: userId }, {
                    username ,
                    email,
                    role
                }).exec();

                if( oldPassword && newPassword ){
                    if(await bcrypt.compare( oldPassword, user.password )){
                        let passwordHash = await bcrypt.hash(newPassword, +saltRounds);
                        await this.userModel.update({ _id: userId }, { password: passwordHash });
                    } else {
                        return {
                            status: 400,
                            type: TYPES.UPDATE,
                            message: 'Old password incorrect !',
                            data: null
                        }
                    }
                }

                user = await this.userModel.findOne({_id: userId}).exec();

                return {status: 200, 'message': 'Update user success !', type: TYPES.UPDATE, user }
            }
            return {
                status: 400,
                type: TYPES.UPDATE,
                message: 'User not exist!',
                data: null
            }
        } catch (error) {
            console.log(error);
            return {
                status: 500,
                type: TYPES.UPDATE,
                message: 'An error when update user !',
                data: null
            }
        }
    }

    async deleteUser({ userId }) {
        try {
            let user = await this.userModel.findOne({_id: userId}).exec();

            if (user) {
                await this.userModel.update({ _id: userId }, { status: STATUS_USER.DELETED }).exec();
                return {
                    status: 200,
                    type: TYPES.DELETE,
                    message: 'Delete user success !'
                }
            }
            return {
                status: 400,
                type: TYPES.DELETE,
                message: 'User not exist!',
                data: null
            }
        } catch (e) {
            console.log(e);
            return {
                status: 500,
                type: TYPES.DELETE,
                message: 'An error when delete user !',
                data: null
            }
        }
    }

    async update(req){
        try {
            const {id} = req.params;
            const { username, new_psw, name, current_psw, confirm_psw, avatar }  = req.body;
            const { USER_PASSWORD_SALT_ROUNDS: saltRounds = 10 } = process.env;
            let user = await this.userModel.findOne({_id: id}).exec();
            if(user){
                let image = avatar ? await CommonService.uploadImage(avatar) : user.avatar;

                await user.update({
                    username,name,avatar: image
                }).exec();
                user.name = name;
                user.username = username;
                user.avatar = image;
                if( new_psw && current_psw && confirm_psw){
                    if(await bcrypt.compare(current_psw, user.password)){
                        const passwordHash = await bcrypt.hash(new_psw, +saltRounds);
                        user.password = passwordHash;
                    }
                }

                user.save(function(err, user){
                    if(err) return {
                        status: 500,
                        message: "Update profile failed",
                        data: null
                    }
                })
                let token = await jwt.encode(ENCODE_KEY, {
                    id: user._id,
                    name: user.name,
                    username: user.username,
                    avatar: user.avatar,
                    create: user.created,
                    email: user.email,
                    timestamp: new Date().getTime()
                });
                let token_exist = await this.tokenModel.findOne({user_id: user._id}).exec();
                if(token_exist){
                    token_exist.token = token.value;
                    token_exist.updated = Date.now();
                    token_exist.save();
                }

                return {status: 200, 'message': 'user-update-success', data: token.value}
                // cache
                //await CacheService.removeCache('users');

            }
            return {
                status: 400,
                data: null
            }
        } catch (error) {

        }
    }
}
module.exports = new UserService();
