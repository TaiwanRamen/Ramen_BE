const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware'); //will automaticlly include index.js
const Notification = require("../models/notification");;
//const User = require('../models/user')


router.get('/', (req, res) => {
    res.render("landing");
});
router.get('/index', middleware.isLoggedIn, (req, res) => {
    console.log(req.user)
    res.redirect('menyas/index', { user: req.user, menya })
});



module.exports = router