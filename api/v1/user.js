const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    User = require('../../models/user'),
    passport = require('passport'),
    JWT = require('jsonwebtoken'),
    config = require('../../config/golbal-config'),
    passportJWT = passport.authenticate('jwt', { session: false }),
    axios = require('axios');

signToken = async (user) => {
    return await JWT.sign({
        iss: 'Taiwan Ramen-club',
        sub: user._id,
        iat: new Date().getTime(), // current time
        exp: new Date(new Date().getTime() + config.JWT_MAX_AGE).getTime()
    }, process.env.JWT_SIGNING_KEY, { algorithm: config.JWT_SIGNING_ALGORITHM});
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
            let {password, __v, ...user } = req.user._doc; //remove password and other sensitive info from user object
            res.status(200).send(user);
        }
    });

router.get('/isUserInRamenGroup', passport.authenticate('facebookToken', { session: false }),
    async (req, res) => {
        let isUserInGroup = false;
        try{
                let response = await axios.get(`https://graph.facebook.com/v10.0/${req.user.fbUid}/groups?pretty=0&admin_only=false&limit=10000&access_token=${req.user.fbToken}`)
                let groupsList;
                log.info(response.data)
                if(!response.data.paging.next){
                    groupsList = response.data.data;
                }

                if(groupsList.length > 0){
                    isUserInGroup = groupsList.some(group => {
                        return group.id === "1694931020757966"
                    })
                }
        } catch(err){
            log.error(err.message);
            isUserInGroup = true;
        }

        res.status(200).send({isUserInGroup});
    });

module.exports = router