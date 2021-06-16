const multer = require('multer'),
    fs = require("fs"),
    log = require('../modules/logger');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const path = `./tmp`
        fs.mkdirSync(path, { recursive: true })
        return cb(null, path)
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}_${req.user._id}.jpg`);
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