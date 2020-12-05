const fs = require('fs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET: secretOrKey } = process.env;
class CommonService {

    /**
    * Handle upload image
    */
    static async uploadImage(base64String){
        // Init
        const root_folder = __dirname.split('/app/services')[0];
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

        // Process
        let file_name = '';
        for (let i = 0; i < 6; i++) {
            let random = (Math.random() * (charset.length - 1 - 0) + 0) | 0;

            file_name += charset[random];
        }
        file_name = file_name + new Date().getTime();
        if(base64String){
            console.log('root folder', root_folder);
             base64String = base64String.split(';base64,').pop();
            let dest = `${root_folder}/public/upload_images`;
            fs.writeFile(`${dest}/${file_name}.png`, base64String, {encoding: 'base64'}, function(err) {});
            return `/upload_images/${file_name}.png`;
        }else{
            return false;
        }
    }

    /**
    * Convert string to slug
    */
    static async convertSlug(title){
        // Convert to lowercase
        let slug = title.toLowerCase();
     
        //Remove accent
        slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
        slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
        slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
        slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
        slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
        slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
        slug = slug.replace(/đ/gi, 'd');
        //Remove special char
        slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
        //Remove white space
        slug = slug.replace(/ /gi, "-");

        //In case user enter to many space
        slug = slug.replace(/\-\-\-\-\-/gi, '-');
        slug = slug.replace(/\-\-\-\-/gi, '-');
        slug = slug.replace(/\-\-\-/gi, '-');
        slug = slug.replace(/\-\-/gi, '-');
        //Trim '-' at start and end of string
        slug = '@' + slug + '@';
        slug = slug.replace(/\@\-|\-\@|\@/gi, '');

        return slug;
    }

    /**
    * Paginate list datas
    * @paginate true
    * @return {void}
    */
    static async paginate(resource){
        // Init
        const { ENCODE_MODE } = process.env;
        const { model, modelTrans, req, where, order, include } = resource;
        const per_page = req.query.per_page && req.query.per_page > 1 ? parseInt(req.query.per_page) : 10;
        const total = await model.countDocuments({ where });
        const last_page = Math.ceil(total / per_page) || 0;
        const current_page = req.query.page && req.query.page > 0 && req.query.page <= last_page ? parseInt(req.query.page) : 1;
        const offset = (current_page - 1) * per_page;

        // Process
        let data = await model.findAll({
            limit: per_page,
            offset,
            where,
            order: order ? order : [ ['id', 'DESC'] ],
            include: include ? include : [],
        });
        //data = await this.encodeData(data);
        return {
            total,
            per_page,
            current_page,
            last_page,
            data,
            ec: ENCODE_MODE && ENCODE_MODE == 'true' ? 'gl-clevebet' : '',
        };
    }

    static validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

}

module.exports = CommonService;
