//=== /api/v1/comment
const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    passport = require('passport'),
    passportJWT = passport.authenticate('jwt', { session: false }),
    dataValidation = require('../../middleware/data-validation'),
    middleware = require('../../middleware'),
    { startSession } = require('mongoose'),
    response = require('../../modules/response-message'),
    Comment = require('../../models/comment');

router.get('/:storeId', async (req, res) => {
    try {
        let foundStore = await Store.findById(req.params.storeId).populate({
            path: "comments",
            options: { sort: { createdAt: -1 } }
        });
        if (!foundStore) return response.notFound(res, "店家不存在");
        return response.success(res, foundStore.comments);
    } catch (e) {
        response.internalServerError(res, e.message);
    }
});

module.exports = router
