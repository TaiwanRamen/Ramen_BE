const express = require('express'),
    router = express.Router(),
    Menya = require('../models/menya'),
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
        //get all menyas from DB
        Menya.find({ name: regex }, (err, allmenyas) => {
            if (err) {
                console.log(err);
            } else {
                if (allmenyas.length < 1) {
                    req.flash("error", "Menya no found");
                    return res.redirect("back");
                }
                res.render("menyas/index", {
                    menyas: allmenyas,
                    page: 'menyas'
                }); //傳入menyas property to ejs file
            }
        })
    } else {
        //get all menyas from DB
        Menya.find({}, (err, allmenyas) => {
            if (err) {
                console.log(err);
            } else {
                res.render("menyas/index", {
                    menyas: allmenyas,
                    page: 'menyas'
                }); //傳入menyas property to ejs file
            }
        })
    }
});
//Create == add new menya to DB
//you can upload the image
router.post('/', middleware.isLoggedIn, upload.single('image'), async (req, res) => {
    //req.file comming from multer, default store image in temp
    console.log(req.file.path);
    try {
        //add location to menya
        if (Math.abs(parseFloat(req.body.longitude)) > 180 || Math.abs(parseFloat(req.body.latitude)) > 90) {
            throw new Error('Location coordination out of range.')
        }
        req.body.menya.location = {
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
        // add imgur url for the image to the menya object under image property
        req.body.menya.image = imgurURLToJSON2;

        // add author to menya
        req.body.menya.author = {
            id: req.user._id,
            username: req.user.username
        }

        //把暫存區的圖片砍掉
        fs.unlinkSync(req.file.path);
        //塞到db裡面
        let menya = await Menya.create(req.body.menya);
        //讓我的follower 知道你上傳了campgorund
        let user = await User.findById(req.user._id).populate('followers').exec();
        let newNotification = {
            username: req.user.username,
            menyaId: menya.id
        }

        for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }
        res.redirect('/menyas/' + menya.id);

    } catch (error) {
        console.log(error);
        req.flash('error_msg', error.message);
        return res.redirect('back');
    }

});
//要比/:id前定義，不然會變成/:id 優先
router.get('/new', middleware.isLoggedIn, (req, res) => {
    res.render('menyas/new');
});
// SHOW- Shows more info about one menya
router.get('/:id', middleware.isLoggedIn, (req, res) => {
    //用ID找就不會重複。
    //retreving one menya with the right id
    //we populate the comments array on it (we get the real comments from the comments DB, so it is not just ids) 
    //and we exec the function
    Menya.findById(req.params.id).populate("comments").exec(function(err, foundMenya) {
        if (err || !foundMenya) {
            req.flash("error", "Menya not found!");
            return res.redirect("back");
            //console.log(err);
        } else {
            res.render("menyas/show", {
                menya: foundMenya,
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN
            }); //把回傳的menya傳到ejs裡面。
        }
    });
});

//EDIT CAMPGROUND
router.get('/:id/edit', middleware.checkMenyaOwnership, (req, res) => {
    //if user logged in?
    Menya.findById(req.params.id, (err, foundMenya) => {
        if (err) {
            req.flash("error", "Menya doesn't exist.");
        } else {
            res.render("menyas/edit", { menya: foundMenya })
        }
    })

})
// UPDATE CAMPGROUND
router.put('/:id', middleware.checkMenyaOwnership, upload.single('image'), async (req, res) => {

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
            // add imgur url for the image to the menya object under image property
            req.body.menya.image = imgurURLToJSON2;
            fs.unlinkSync(req.file.path);

        }
        let data = req.body.menya; //在ejs裡面包好了menya[name, image, author]
        //find and update
        await Menya.findByIdAndUpdate(req.params.id, data);
        res.redirect("/menyas/" + req.params.id);

    } catch (error) {
        console.log(error);
        req.flash('error_msg', err.message);
        return res.redirect('back');
    }
})

// DESTROY CAMPGROUND
router.delete('/:id', middleware.checkMenyaOwnership, (req, res) => {
    Menya.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/menyas")
        } else {
            res.redirect("/menyas")
        }
    })
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "||$&")
}

module.exports = router