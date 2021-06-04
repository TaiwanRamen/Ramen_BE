const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    User = require('../../models/user'),
    passport = require('passport'),
    JWT = require('jsonwebtoken'),
    config = require('../../config/golbal-config'),
    axios = require('axios'),
    middleware = require('../../middleware/checkAuth'),
    response = require('../../modules/responseMessage');


const signToken = async (user) => {
    return await JWT.sign({
        iss: 'Taiwan Ramen-Club',
        sub: user._id,
        iat: new Date().getTime(), // current time
        exp: new Date(new Date().getTime() + config.JWT_MAX_AGE).getTime()
    }, process.env.JWT_SIGNING_KEY, {algorithm: config.JWT_SIGNING_ALGORITHM});
}

router.post('/oauth/facebook', passport.authenticate('facebookToken'),
    async (req, res) => {
        if (req.user.err) {
            response.unAuthorized(res, req.user.err.message);
        } else if (req.user) {
            // Generate token
            const token = await signToken(req.user);
            res.cookie('access_token', token, {maxAge: 900000, httpOnly: true});
            response.success(res, {user: req.user, token})
        } else {
            response.unAuthorized(res, "臉書登入失敗");
        }
    }, (error, req, res, next) => {
        if (error) {
            response.badRequest(res, error);
        }
    }
)

router.get('/userInfo', middleware.jwtAuth,
    async (req, res, next) => {
        if (req.user) {
            let {password, __v, ...user} = req.user._doc; //remove password and other sensitive info from user object
            response.success(res, user);
        }
        response.notFound(res, "找不到使用者");
    });

router.get('/unReadNotificationCount', middleware.jwtAuth,
    async (req, res, next) => {
        if (req.user) {
            let notificationsCount = 0;
            let user = await User.findById(req.user._id).populate({
                path: 'notifications',
                options: {sort: {"createdAt": -1}}
            }).exec();
            let userNotifications = user.notifications;
            userNotifications = userNotifications.filter(notification => notification.isRead !== true);
            response.success(res, userNotifications.length);
        } else {
            response.notFound(res, "找不到使用者");
        }
    });


router.get('/notifications', middleware.jwtAuth,
    async (req, res, next) => {
        if (req.user) {
            let user = await User.findById(req.user._id).populate({
                path: 'notifications',
                options: {sort: {"createdAt": -1}}
            }).exec();
            response.success(res, user.notifications.count);
        } else {
            response.notFound(res, "找不到使用者");

        }
    });

router.get('/followedStore', middleware.jwtAuth, async (req, res, next) => {

    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;

        if (req.user) {
            let user = await User.findById(req.user._id).populate({
                path: 'followedStore',
                options: {
                    skip: (perPage * pageNumber) - perPage,
                    limit: perPage,
                    sort: {createdAt: -1}
                }
            }).exec();

            const count = req.user.followedStore.length;

            return response.success(res, {
                stores: user.followedStore,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
            });
        } else {
            return response.notFound(res, "找不到使用者");
        }

    } catch (error) {
        return response.internalServerError(res, error.message);
    }
});

router.get('/isUserInRamenGroup', passport.authenticate('facebookToken', {session: false}),
    async (req, res) => {
        let isUserInGroup = false;
        try {
            let response = await axios.get(`https://graph.facebook.com/v10.0/${req.user.fbUid}/groups?pretty=0&admin_only=false&limit=10000&access_token=${req.user.fbToken}`)
            let groupsList;
            log.info(response.data)
            if (!response.data.paging.next) {
                groupsList = response.data.data;
            }

            if (groupsList.length > 0) {
                isUserInGroup = groupsList.some(group => {
                    return group.id === "1694931020757966"
                })
            }
        } catch (err) {
            log.error(err.message);
            isUserInGroup = true;
        }
        response.success(res, {isUserInGroup});
    });

module.exports = router