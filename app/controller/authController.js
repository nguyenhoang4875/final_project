const AuthService = require('../services/AuthService');
const MailService = require('../services/MailService');
const { validationResult } = require('express-validator');
class AuthController {
  constructor() {
    this.authService = AuthService;
  }

  async register(req, res) {
    try {
      const errors = validationResult(req);
      const { email, name, url } = req.body;
      if (!errors.isEmpty()) {
        return res.status(422).json({'message': 'Error', data: errors.array()});
      }
      const result = await this.authService.register(req);
      if(result.status === 200){
          const msg = {
            reciver: email,
            subject: 'Confirm registration!',
        };
        const template = {
            data: {
                name,
                url,
                mail_token: result.data,
            },
            type: 'register',
        };
        //await MailService.sendMail(msg, template);
        req.flash('success', 'Your account has been created. Please log in.');
        res.redirect('/');
      } else {
        req.flash('error', result.message);
        req.flash('showRegisterForm', true);
        return res.status(result.status).redirect('/');
      }
    } catch (error) {
      console.log(error)
    }
  }

  async confirmRegister(req, res) {
    try{
      let result = await this.authService.confirmRegister(req);
      res.status(result.status).json(result);
    }
    catch(err){
      res.status(500);
    }
  }

  /**
   * Login 
   * @param {*} req 
   * @param {*} res 
   */
  async login(req, res) {
    try {
      const result = await this.authService.login( req );
      
      if (result.status !== 200) {
        return res.render('login', {
          success: req.flash('success')[0],
          errors: req.flash('error'),
          showRegisterForm: req.flash('showRegisterForm')[0]
        });
      }
      req.flash({result});
      return res.status(result.status).redirect('/rooms');
    } catch (error) {
        console.log(error); 
    }
  }
  /**
   * Logout
   * @param {*} req 
   * @param {*} res 
   */
  async logout(req, res) {
    try{
      let result = await this.authService.logout(req);
      if(result.status == 'inactive')
      return res.status(200).send({
        message: 'Logout success',
        data: null
      });
      return res.status(500).send({
        message: 'login failed',
        data: null
      })
    }
    catch( err ){
      return res.status(500).send({
        message: 'login failed',
        data: err
      })
    }
  }
}

module.exports = new AuthController();
