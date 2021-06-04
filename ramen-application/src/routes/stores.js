const express = require('express'),
    router = express.Router(),
    Store = require('../models/store'),
    Notifications = require('../models/notification'),
    middleware = require('../middleware/checkAuth'), //will automaticlly include checkAuth.js
    multer = require('multer'),
    Review = require("../models/review"),
    Comment = require("../models/comment"),
    geocoder = require('../utils/here-geocode'),
    uploadImageUrl = require('../utils/image-uploader/imgur-uploader'),
    log = require('../modules/logger');

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
                req.flash("error_msg", "找不到店家");
                return res.redirect("back");
            }
            res.render("stores/index", {
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
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

            res.render("stores/index", {
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                search: false
            });
        }
    } catch (error) {
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

//====================================================
// location testing feature
//====================================================
router.get('/location', async (req, res) => {
    try {
        //found the nearest store 
        if (req.query.lat && req.query.lng) {
            let maxDistance = req.query.maxDistance ? req.query.maxDistance : 1000;

            let foundStore = await Store.aggregate([{

                //change to geoWithin for mongoose 5.12.12
                '$geoNear': {
                    'near': {
                        'type': 'Point',
                        'coordinates': [parseFloat(req.query.lng), parseFloat(req.query.lat)]
                    },
                    'spherical': true,
                    'distanceField': "distance",
                    //"distanceMultiplier": 0.001,
                    'maxDistance': parseFloat(maxDistance)
                }
            }]);

            console.log(foundStore);
            res.send(foundStore);
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
});

//要比/:id前定義，不然會變成/:id 優先
router.get('/new', middleware.isLoggedIn, (req, res) => {
    res.render('stores/new');
});
// SHOW- Shows more info about one store
router.get('/:id', (req, res) => {
    //用ID找就不會重複。
    //retreving one store with the right id
    //we populate the comments array on it (we get the real comments from the comments DB, so it is not just ids) 
    //and we exec the function
    Store.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {
            sort: {
                createdAt: -1
            }
        }
    }).exec(function(err, foundStore) {
        if (err || !foundStore) {
            req.flash("error_msg", "店家不存在");
            return res.redirect("/stores");
            //console.log(err);
        } else {
            let isStoreOwner = true;
            res.render("stores/show", {
                isStoreOwner : isStoreOwner,
                store: foundStore,
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN
            }); //把回傳的store傳到ejs裡面。
        }
    });
});

//EDIT Store
router.get('/:id/edit', middleware.checkStoreOwnership, async (req, res) => {
    //if user logged in?
    try {
        let store = await Store.findById(req.params.id);
        res.render("stores/edit", {store})
    } catch (error) {
        log.error("store doesn't exist");
    }
})
// UPDATE 
router.put('/:id', middleware.checkStoreOwnership, upload.single('image'), async (req, res) => {

    try {
        //如果有更新照片
        if (req.file) {
            let imgurURL = await uploadImageUrl(req.file.path);
            req.body.store.imageSmall = [imgurURL];
        }
        let data = req.body.store; //在ejs裡面包好了store[name, image, author]
        log.info("updated store:", data);
        //find and update
        await Store.findByIdAndUpdate(req.params.id, data);
        //讓我的follower 知道你更新了
        let store = await Store.findById(req.params.id).populate('followers').exec();
        let newNotification = {
            storeId: store.id,
            storeName: store.name,
        }
        for (const follower of store.followers) {
            let notification = await Notifications.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }

        res.redirect("/stores/" + req.params.id);

    } catch (error) {
        log.error(error);
        req.flash('error_msg', error.message);
        return res.redirect('back');
    }
})

// DESTROY Store
router.delete('/:id', middleware.checkStoreOwnership, async (req, res) => {
    try {
        let store = await Store.findById(req.params.id);
        await Comment.remove({
            "_id": {
                $in: store.comments
            }
        });
        await Review.remove({
            "_id": {
                $in: store.reviews
            }
        })
        store.remove();
        req.flash("success_msg", "Store deleted successfully!");
        res.redirect("/stores");

    } catch (error) {
        console.log(error);
        res.redirect("/stores");
    }

})

//user follow store
router.get('/:id/follow', middleware.isLoggedIn, async (req, res) => {
    try {
        let store = await Store.findById(req.params.id);
        store.followers.push(req.user._id);
        store.save();
        console.log('成功追蹤' + store.name);
        req.flash('success_msg', '成功追蹤' + store.name);
        res.redirect(`/stores/${store._id}`);
    } catch (error) {
        console.log('無法追蹤' + store.name);
        req.flash('error_msg', '無法追蹤' + store.name);
        res.redirect(`/stores/${store._id}`);
    }
})
//user unfollow store
router.get('/:id/unfollow', middleware.isLoggedIn, async (req, res) => {
    try {
        let store = await Store.findById(req.params.id);
        let index = store.followers.indexOf(req.user._id);
        if (index > -1) {
            store.followers.splice(index, 1);
            store.save();
            console.log('成功取消追蹤' + store.name);
            req.flash('success_msg', '成功取消追蹤' + store.name);
        }
        res.redirect(`/stores/${store._id}`);
    } catch (error) {
        console.log('無法取消追蹤' + store.name)
        req.flash('error_msg', '無法取消追蹤' + store.name);
        res.redirect(`/stores/${store._id}`);
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

module.exports = router