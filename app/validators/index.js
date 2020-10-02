class Validator {

  /**
   * Register Validator
   */
  static async registerValidator(req, res, next) {
    try {
      const regax = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const { username, password, cfpassword, email } = req.body;

      if(!username || !password || !cfpassword || !email){
        req.flash('error', 'Missing credentials');
        req.flash('showRegisterForm', true);
        res.redirect('/');
      }

      if (!regax.test(email)) {
        req.flash('error', 'Email is invalid !');
        req.flash('showRegisterForm', true);
        res.redirect('/');
      }

      if ( password !== cfpassword ) {
        req.flash('error', 'Comfirm password not match !.');
        req.flash('showRegisterForm', true);
        return res.redirect('/');
      }
      
      return next();
    } catch(err) {
      console.log(err);
    }
  }

  // Login Validator
  static async loginValidator(req, res, next) {
    try {
      const { username, password } = req.body;

      if(!username || !password ){
        req.flash('error', 'Missing credentials');
        req.flash('showRegisterForm', true);
        res.redirect('/');
      }
      
      return next();
      
    } catch(err) {
      console.log(err);
    }
  }

  static async createRoomValidator(req, res, next) {
    try {
      const { name, members } = req.body;

      if(!name){
        req.flash('error', "Room's name is required");
        res.redirect('/rooms');
      }

      if ( !members.length ) {
        req.flash('error', 'Members is empty');
        return res.redirect('/rooms');
      }

      return next();
    } catch(err) {
      console.log(err);
    }
  }

}

module.exports = Validator;