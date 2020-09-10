const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware'); //will automaticlly include index.js
const Notification = require("../models/notification");;
//const User = require('../models/user')


router.get('/', (req, res) => {
    res.render("landing");
});

router.get('/privacy', (req, res) => {
    res.render("privacy");
});

//====================================================
// map testing feature
//====================================================
router.get('/map', async (req, res) => {
    try {
        res.render("stores/map", { mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN, });

    } catch (error) {
        console.log(error)
    }
});


module.exports = router