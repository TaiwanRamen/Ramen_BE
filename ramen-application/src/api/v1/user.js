const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    User = require('../../models/user'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    axios = require('axios'),
    middleware = require('../../middleware/checkAuth'),
    response = require('../../modules/responseMessage'),
    userService = require('../../service/user.service'),
    pagination = require('../../utils/pagination')


router.post('/oauth/facebook', passport.authenticate('facebookToken'),
    async (req, res) => {
        try {
            const user = req.user;
            if (user.err) {
                response.unAuthorized(res, req.user.err.message);
            } else if (user) {
                const token = await userService.signToken(user);
                res.cookie('access_token', token, {maxAge: 900000, httpOnly: true});
                response.success(res, {user: user, token})
            } else {
                response.unAuthorized(res, "臉書登入失敗");
            }
        } catch (error) {
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

router.get('/unReadNotiCount', middleware.jwtAuth,
    async (req, res, next) => {
        if (req.user) {
            const headers = {
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache'
            };
            res.writeHead(200, headers);

            setInterval(async () => {
                const count = await userService.notificationCount(req.user._id);
                res.write("data: " + count + "\n\n")
            }, 1000 * 10)
        } else {
            response.notFound(res, "找不到使用者");
        }
    });


router.get('/notifications', middleware.jwtAuth, async (req, res, next) => {
    try {
        if (req.user) {
            const {perPage, pageNumber} = pagination(req.query.page);
            const {notifications, count} = await userService.getNotifications(req.user, req.query.page)

            response.success(res, {
                notifications: notifications,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
            });

            for await (let notification of notifications) {
                notification.isRead = true;
                await notification.save();
            }
            return null;
        } else {
            response.notFound(res, "找不到使用者");
        }
    } catch (error) {
        log.error(error);
        return response.internalServerError(res, error.message);
    }
});

router.get('/followedStore', middleware.jwtAuth, async (req, res, next) => {

    try {
        const {perPage, pageNumber} = pagination(req.query.page);
        if (req.user) {
            const {followedStores, count} = await userService.getFollowedStores(req.user, req.query.page)

            return response.success(res, {
                stores: followedStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
            });
        } else {
            return response.notFound(res, "找不到使用者");
        }

    } catch (error) {
        log.error(error);
        return response.internalServerError(res, error.message);
    }
});


router.get('/reviewedStore', middleware.jwtAuth, async (req, res, next) => {
    try {
        const {perPage, pageNumber} = pagination(req.query.page);
        if (req.user) {
            const {reviews, count} = await userService.getReviewedStores(req.user, req.query.page);
            return response.success(res, {
                reviews: reviews,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
            });
        } else {
            return response.notFound(res, "找不到使用者");
        }

    } catch (error) {
        log.error(error);
        return response.internalServerError(res, error.message);
    }
});

router.get('/isUserInRamenGroup', passport.authenticate('facebookToken', {session: false}),
    async (req, res) => {
        const isUserInGroup = await  userService.isUserInRamenGroup(req.user);
        response.success(res, {isUserInGroup});
    });

module.exports = router