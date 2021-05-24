//========  /api/vi/review

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    Notifications = require('../../models/notification'),
    middleware = require('../../middleware'),
    multer = require('multer'),
    Review = require("../../models/review"),
    Comment = require("../../models/comment"),
    geocoder = require('../../utils/here-geocode'),
    uploadImageUrl = require('../../utils/imgur-upload'),
    response = require('../../modules/response-message');

//get reviews from store id
router.get('/:id', middleware.jwtAuth, async (req, res) => {
    try {
        let foundStore = await Store.findById(req.params.id).populate({
            path: "reviews",
            options: { sort: { createdAt: -1 } } // sorting the populated reviews array to show the latest first
        });
        if (!foundStore) return response.notFound(res, "店家不存在");
        console.log(foundStore.reviews);
        return response.success(res, foundStore.reviews);
    } catch (e) {
        return response.internalServerError(res, e.message);
    }
});


module.exports = router