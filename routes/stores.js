const express = require('express'),
    router = express.Router(),
    Store = require('../models/store'),
    Notifications = require('../models/notification'),
    middleware = require('../middleware'), //will automaticlly include index.js
    multer = require('multer'),
    fs = require("fs"),
    request = require("request-promise-native"),
    User = require("../models/user"),
    Review = require("../models/review"),
    Comment = require("../models/comment"),
    geocoder = require('../utils/here')

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
        let noMatch = null;
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
                req.flash("error", "找不到店家");
                return res.redirect("back");
            }
            res.render("stores/index", {
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                noMatch: noMatch,
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
                noMatch: noMatch,
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

        //去node server暫存區找圖片在哪
        let bitmap = fs.readFileSync(req.file.path);
        // 將圖片轉成base64
        let encode_image = Buffer.from(bitmap).toString('base64');
        //======================
        //imgur request setting
        //======================
        request_options = {
            'method': 'POST',
            'url': 'https://api.imgur.com/3/image',
            'headers': {
                'Authorization': 'Client-ID ' + process.env.IMGUR_CLIENT_ID
            },
            formData: {
                'image': encode_image
            }
        };
        //發request
        await request(request_options, function(error, response) {
            if (error) throw new Error(error);
            imgurURL = response.body
        });
        //這邊回傳的imgurURL是JSON要轉成str才能存到mongodb
        const imgurURLToJSON2 = JSON.parse(imgurURL).data.link
        console.log(imgurURLToJSON2)
        // add imgur url for the image to the store object under image property
        req.body.store.imageSmall = [imgurURLToJSON2];

        // add author to store
        req.body.store.author = {
            id: req.user._id,
            username: req.user.fbName
        }

        //把暫存區的圖片砍掉
        fs.unlinkSync(req.file.path);

        //console.log(req.body.store)
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
            req.flash("error", "店家不存在");
            return res.redirect("/stores");
            //console.log(err);
        } else {
            res.render("stores/show", {
                store: foundStore,
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN
            }); //把回傳的store傳到ejs裡面。
        }
    });
});

//EDIT Store
router.get('/:id/edit', middleware.checkStoreOwnership, (req, res) => {
    //if user logged in?
    Store.findById(req.params.id, (err, foundStore) => {
        if (err) {
            req.flash("error", "Store doesn't exist.");
        } else {
            res.render("stores/edit", {
                store: foundStore
            })
        }
    })

})
// UPDATE 
router.put('/:id', middleware.checkStoreOwnership, upload.single('image'), async (req, res) => {

    try {
        //如果有更新照片
        if (req.file) {
            //去node server暫存區找圖片在哪
            let bitmap = fs.readFileSync(req.file.path);
            // 將圖片轉成base64
            let encode_image = Buffer.from(bitmap).toString('base64');
            //======================
            //imgur request setting
            //======================
            //發request
            await request(request_options, function(error, response) {
                if (error) throw new Error(error);
                imgurURL = response.body
            });
            //這邊回傳的imgurURL是JSON要轉成str才能存到mongodb
            const imgurURLToJSON2 = JSON.parse(imgurURL).data.link
            //console.log(imgurURLToJSON2)
            // add imgur url for the image to the store object under image property
            req.body.store.imageSmall = [imgurURLToJSON2];
            fs.unlinkSync(req.file.path);

        }
        let data = req.body.store; //在ejs裡面包好了store[name, image, author]
        console.log(data)
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
        console.log(error);
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
        req.flash("success", "Store deleted successfully!");
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
        res.redirect('back');
    } catch (error) {
        console.log('無法追蹤' + store.name);
        req.flash('error_msg', '無法追蹤' + store.name);
        res.redirect('back');
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
        res.redirect('back');
    } catch (error) {
        console.log('無法取消追蹤' + store.name)
        req.flash('error_msg', '無法取消追蹤' + store.name);
        res.redirect('back');
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

module.exports = router