const AuthService = require('../services/AuthService');
const UserService = require('../services/UserService');
const jwt = require('json-web-token');

class AuthMiddleware {
  constructor() {
    this.authService = AuthService;
    this.userService = UserService;
  }

  /**
   * auth function.
   * @description: Middleware check authentication of user.
   * @param req Request
   * @param res Response
   * @param next Next function
   */
  async auth(req, res, next) {
    try{
      const header = req.headers['authorization'];
      if(header){
        const token = header.split(' ')[1];
        let data_token = await this.authService.checkToken(token);
        if(!data_token){
            return res.status(403).json({
                message: 'User not exist or this token has expired',
                data: null
            })
        };
        req.userId = data_token.user_id;
        req.token = data_token;
        const user = await this.userService.getUserbyId(req.userId);
        req.user = user;
        next();
      }
      else
        return res.status(401).json({
          message: 'Not authorization',
          data: null
        })
    }
    catch(error){
      console.log(error);
    }
  }

  noAuth() {
    // TODO
  }

}

module.exports = new AuthMiddleware();
