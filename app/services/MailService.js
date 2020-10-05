const nodemailer =  require('nodemailer');

/**
* Mail smtp setting
*/
class MailService {

    /**
    * Send Mail function
    * @return send mail
    */
    static async sendMail(msg, template){
        const {MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD} = process.env;
        const config = {
            host: MAIL_HOST ,
            port: MAIL_PORT,
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD,
            },
        };
        try{
            const transporter = nodemailer.createTransport(config);

            const mailOptions = {
                from: 'Training 2020',
                to: msg.reciver,
                subject: msg.subject,
                text: 'You recieved message from ' + config.auth.user,
                html: await this.mailTemplate(template),
            }
            transporter.sendMail(mailOptions);
        }catch(err){
            
        }
    }

    /**
    * Get MailTemplate by type
    * @params {object} template
    * @return {string} mail_template
    */
    static async mailTemplate(template){
        let mail_template = '';
        if(template.type == 'register'){
            mail_template = `
                <h1>Hello `+ template.data.name +`! </h1>
                <p>You have been registered success from our website.</p>
                <p>Please click <a style="color: red;" href="`+ template.data.url +`/confirm-register/`+ template.data.mail_token +`">HERE</a> to confirm your registration!</p>
            `
        }
        if(template.type == 'forgot password'){
            mail_template = `
                <h1>Hello `+ template.data.username +`! </h1>
                <p>You have requested new password from our website.</p>
                <p>Please click <a style="color: red;" href="`+ template.data.url +`/forgot-pass/`+ template.data.forgot_token +`">HERE</a> to confirm!</p>
            `
        }
        return mail_template;
    }
}

module.exports = MailService;
