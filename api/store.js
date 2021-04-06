const express = require('express'),
    router = express.Router(),
    Store = require('../models/store'),
    Notifications = require('../models/notification'),
    middleware = require('../middleware'), //will automaticlly include index.js
    multer = require('multer'),
    Review = require("../models/review"),
    Comment = require("../models/comment"),
    geocoder = require('../utils/here-geocode'),
    uploadImageUrl = require('../utils/imgur-upload');

//set filename to multer
const storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
//only allow jpeg, jpeg, png, gif to be uploaded
let imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
let upload = multer({
    storage: storage,
    fileFilter: imageFilter
})


router.get('/', async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;
        //fuzzy search
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');

            //search from all the fields included in $or
            const allStores = await Store.find({
                $or: [
                    { name: regex },
                    { city: regex },
                    { descriptionText: regex },
                ],
            }).collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 })
                .skip((perPage * pageNumber) - perPage).limit(perPage).exec();
            const count = await Store.countDocuments({
                $or: [
                    { name: regex },
                    { city: regex },
                    { descriptionText: regex },
                ],
            }).exec()

            if (allStores.length < 1) {
                return res.status(404).send("找不到店家");
            }
            res.status(200).send({
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                search: req.query.search
            });

        } else {
            //get all stores from DB
            const allStores = await Store.find().collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 }).skip((perPage * pageNumber) - perPage).limit(perPage).exec();;
            const count = await Store.countDocuments().exec();

            res.status(200).send({
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                search: false
            });
        }
    } catch (error) {
        res.status(500).send("internal server error");
        console.log(error)
    }
});

//Create == add new store to DB
//you can upload the image
router.post('/', middleware.isLoggedIn, upload.single('image'), async (req, res) => {
    //req.file comming from multer, default store image in temp
    console.log(req.file.path);
    try {
        //add location to store
        if (Math.abs(parseFloat(req.body.longitude)) > 180 || Math.abs(parseFloat(req.body.latitude)) > 90) {
            throw new Error('Location coordination out of range.')
        }

        let foundStore = Store.findOne({'name': req.body.store.name});
        if(!!foundStore) throw new Error(`店家名稱 ${req.body.store.name} 已存在`);

        let imgurURL = await uploadImageUrl(req.file.path);
        req.body.store.imageSmall = [imgurURL];

        // add author to store
        req.body.store.author = {
            id: req.user._id,
            username: req.user.fbName
        }


        let locObj = await geocoder(req.body.store.address); //from geocoder here
        req.body.store.address = locObj.address;
        req.body.store.city = locObj.city;
        req.body.store.location = {
            type: 'Point',
            coordinates: [locObj.longitude, locObj.latitude]
        }
        //console.log(req.body.store)
        //塞到db裡面
        let store = await Store.create(req.body.store);

        res.redirect('/stores/' + store.id);

    } catch (error) {
        console.log(error);
        req.flash('error_msg', error.message);
        return res.redirect('back');
    }
});




function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}



module.exports = router