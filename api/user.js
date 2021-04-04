const express = require('express'),
    router = express.Router(),
    log = require('../modules/logger'),
    User = require('../models/user'),
    passport = require('passport'),
    JWT = require('jsonwebtoken'),
    config = require('../config/golbal-config'),
    passportJWT = passport.authenticate('jwt', { session: false });

signToken = async (user) => {
    return await JWT.sign({
        iss: 'Taiwan Ramen-club',
        sub: user._id,
        iat: new Date().getTime(), // current time
    }, process.env.JWT_SIGNING_KEY, { expiresIn: config.JWT_MAX_AGE });
}

router.post('/oauth/facebook', passport.authenticate('facebookToken', { session: false }),
    async (req, res) => {
        // Generate token
        const token = await signToken(req.user);
        res.cookie('access_token', token, {
            httpOnly: true
        });
        res.status(200).json({ success: true });
    });

router.get('/profile', passportJWT,
    async (req, res, next) => {
        if(req.user){
            console.log(user);
        }
    })



module.exports = router