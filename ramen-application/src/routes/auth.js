const express = require('express');
const router = express.Router();
const passport = require('passport');
const middleware = require('../middleware/checkAuth'); //will automaticlly include checkAuth.js

//facebook 驗證。
router.get('/facebook', (req, res, next) => {
    passport.authenticate('facebook', {
        scope: ['email'],
        session: true
    })(req, res, next)
});


router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', {
        successRedirect: '/map',
        failureRedirect: '/landing',
        failureFlash: true
    })(req, res, next);
});

module.exports = router