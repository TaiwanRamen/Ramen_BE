//=== /api/v1/comment
const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    passport = require('passport'),
    passportJWT = passport.authenticate('jwt', {session: false}),
    dataValidation = require('../../middleware/data-validation'),
    {startSession} = require('mongoose'),
    response = require('../../modules/response-message'),
    Comment = require('../../models/comment'),
    middleware = require('../../middleware');

router.get('/:storeId', middleware.jwtAuth, async (req, res) => {
    let foundStore = await Store.findById(req.params.storeId).populate({
        path: "comments",
        options: {sort: {createdAt: -1}}
    });
    response.success(res, foundStore.comments);


});

module.exports = router
