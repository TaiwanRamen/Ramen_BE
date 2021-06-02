//========  /api/vi/review

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    middleware = require('../../middleware'),
    mongoose = require('mongoose'),
    multer = require('multer'),
    Review = require("../../models/review"),
    Comment = require("../../models/comment"),
    uploadImageUrl = require('../../utils/imgur-upload'),
    response = require('../../modules/response-message');

router.get('/:id', middleware.jwtAuth, async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;
        const store = await Store.findById(req.params.id);
        const count = store.reviews.length;

        let foundStore = await Store.findById(req.params.id).populate({
            path: "reviews",
            options: {
                skip: (perPage * pageNumber) - perPage,
                limit: perPage,
                sort: {createdAt: -1}
            },
            populate: {
                path: 'author'
            }
        });
        if (!foundStore) return response.notFound(res, "店家不存在");


        const reviews = foundStore.reviews;

        const result = reviews.map(review => {
            const {_id, avatar, username} = review.author;
            return {
                _id: review._id,
                rating: review.rating,
                text: review.text,
                createdAt: review.createdAt,
                updatedAt: review.updatedAt,
                __v: review.__v,
                store: review.store,
                author: {id: _id, avatar, username}
            }
        })


        return response.success(res, {
            current: pageNumber,
            pages: Math.ceil(count / perPage),
            reviews: result
        });
    } catch (e) {
        return response.internalServerError(res, e.message);
    }
});


module.exports = router