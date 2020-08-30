const express = require('express'),
    router = express.Router(),
    Store = require('../models/store'),
    Notifications = require('../models/notification'),
    middleware = require('../middleware'), //will automaticlly include index.js
    multer = require('multer'),
    fs = require("fs"),
    request = require("request-promise-native"),
    User = require("../models/user");

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
let upload = multer({ storage: storage, fileFilter: imageFilter })


router.get('/', middleware.isLoggedIn, (req, res) => {
    //fuzzy search
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        //get all stores from DB
        Store.find({ name: regex }, (err, allstores) => {
            if (err) {
                console.log(err);
            } else {
                if (allstores.length < 1) {
                    req.flash("error", "Store no found");
                    return res.redirect("back");
                }
                res.render("stores/index", {
                    stores: allstores,
                    page: 'stores'
                }); //傳入stores property to ejs file
            }
        })
    } else {
        //get all stores from DB
        Store.find({}, (err, allstores) => {
            if (err) {
                console.log(err);
            } else {
                res.render("stores/index", {
                    stores: allstores,
                    page: 'stores'
                }); //傳入stores property to ejs file
            }
        })
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
        req.body.store.location = {
            type: 'Point',
            coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
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
        req.body.store.image = imgurURLToJSON2;

        // add author to store
        req.body.store.author = {
            id: req.user._id,
            username: req.user.username
        }

        //把暫存區的圖片砍掉
        fs.unlinkSync(req.file.path);
        //塞到db裡面
        let store = await Store.create(req.body.store);
        //讓我的follower 知道你上傳了campgorund
        let user = await User.findById(req.user._id).populate('followers').exec();
        let newNotification = {
            username: req.user.username,
            storeId: store.id
        }

        for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }
        res.redirect('/stores/' + store.id);

    } catch (error) {
        console.log(error);
        req.flash('error_msg', error.message);
        return res.redirect('back');
    }

});
//要比/:id前定義，不然會變成/:id 優先
router.get('/new', middleware.isLoggedIn, (req, res) => {
    res.render('stores/new');
});
// SHOW- Shows more info about one store
router.get('/:id', middleware.isLoggedIn, (req, res) => {
    //用ID找就不會重複。
    //retreving one store with the right id
    //we populate the comments array on it (we get the real comments from the comments DB, so it is not just ids) 
    //and we exec the function
    Store.findById(req.params.id).populate("comments").exec(function(err, foundStore) {
        if (err || !foundStore) {
            req.flash("error", "Store not found!");
            return res.redirect("back");
            //console.log(err);
        } else {
            res.render("stores/show", {
                store: foundStore,
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN
            }); //把回傳的store傳到ejs裡面。
        }
    });
});

//EDIT CAMPGROUND
router.get('/:id/edit', middleware.checkStoreOwnership, (req, res) => {
    //if user logged in?
    Store.findById(req.params.id, (err, foundStore) => {
        if (err) {
            req.flash("error", "Store doesn't exist.");
        } else {
            res.render("stores/edit", { store: foundStore })
        }
    })

})
// UPDATE CAMPGROUND
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
            req.body.store.image = imgurURLToJSON2;
            fs.unlinkSync(req.file.path);

        }
        let data = req.body.store; //在ejs裡面包好了store[name, image, author]
        //find and update
        await Store.findByIdAndUpdate(req.params.id, data);
        res.redirect("/stores/" + req.params.id);

    } catch (error) {
        console.log(error);
        req.flash('error_msg', err.message);
        return res.redirect('back');
    }
})

// DESTROY CAMPGROUND
router.delete('/:id', middleware.checkStoreOwnership, (req, res) => {
    Store.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/stores")
        } else {
            res.redirect("/stores")
        }
    })
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "||$&")
}

module.exports = router