const multer = require('multer'),
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
    console.log(file)
    if (!file.originalname.match(/\.(jpeg)$/i)) {
        console.log("error!")
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

let upload = multer({
    storage: storage,
    fileFilter: imageFilter
}).single('upload_image')

module.exports = upload