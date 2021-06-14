const multer = require('multer'),
    log = require('../modules/logger'),
    fs = require('fs'),
    uploadImageUrl = require('../utils/image-uploader/imgur-uploader');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './tmp');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${req.user._id}.jpg`);
    }
});
let imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpeg)$/i)) {
        log.error("error!")
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

let upload = multer({
    storage: storage,
    fileFilter: imageFilter
}).single('upload_image')

module.exports = upload