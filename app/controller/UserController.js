const UserService = require('../services/UserService');
const { validationResult } = require('express-validator');

class UserController {
    constructor() {
        this.userService = UserService;
    }

    async getList({req, res}) {
        try {
            const result = await UserService.getList({ limit: -1 });

            return res.status(result.status).json(result);
        } catch (e) {
            console.log(e);
        }
    }

    async getListAll({req, res}) {
        try {
            let { page, limit, search } = req.query;
            page = page ? Number(page) - 1 : 0;
            limit = !!limit ? Number(limit) : 5;
            let status = 0;
            console.log('page: ', page, limit);
            const users = await UserService.getList({ search, page, limit, status });
            return res.render('users', { data: users })
        } catch (e) {
            console.log(e);
        }
    }

    async getUserById({ req, res }) {
        try {
            const id = req.params.id === 'me' ? req.user._id : req.params.id;
            const result = await UserService.getUserById(id);
            return res.json(result);
        } catch (e) {
            console.log(e);
        }
    }

    async getCurrentUserById({ req, res }) {
        try {
            const id = req.user._id;
            console.log('userId in current: ', id);
            const user = await UserService.getUserById(id);
            return res.render('user-info', {user:user});
        } catch (e) {
            console.log(e);
        }
    }

    async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({'message': 'Error', data: errors.array()});
            }
            const result = await this.userService.update(req);
            //console.log(result);
            return res.status(result.status).json(result);
        } catch (error) {
            res.status(500);
        }
    }

    async create({ req, res }) {
        try {
            const { email, name, password, role } = req.body;
            console.log({ email, name, password, role });
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = new UserController();
