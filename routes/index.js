const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware/index'); //will automaticlly include index.js
const Notification = require("../models/notification");
const User = require("../models/user");
const Store = require("../models/store");
//const User = require('../models/user')


router.get('/', (req, res) => {
    res.render("landing");
});

router.get('/privacy', (req, res) => {
    res.render("privacy");
});

//====================================================
// map feature using ajax
//====================================================
router.get('/map', async (req, res) => {
    try {
        res.render("stores/map", { mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN, });

    } catch (error) {
        console.log(error)
    }
});
//view all notifications
router.get("/notifications", middleware.isLoggedIn, async (req, res) => {
    try {
        let user = await User.findById(req.user._id).populate({
            path: 'notifications',
            options: { sort: { "createdAt": -1 } }
        }).exec();
        let allNotifications = user.notifications;
        res.render(`users/${req.user._id}`, { allNotifications })

    } catch (error) {
        req.flash("error_msg", error.message);
        res.redirect('back')
    }
});

//handle notification
router.get("/notifications/:id", middleware.isLoggedIn, async (req, res) => {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/stores/${notification.storeId}`) //redirect to the updated store!

    } catch (error) {
        req.flash("error_msg", error.message);
        res.redirect('back')
    }
});

module.exports = router