//========  /api/vi/review

const express = require('express'),
    mongoose = require('mongoose'),
    router = express.Router(),
    Store = require('../../models/store'),
    middleware = require('../../middleware/checkAuth'),
    {body} = require('express-validator'),
    dataValidation = require('../../middleware/dataValidate'),
    uploadImage = require('../../modules/uploadImage'),
    response = require('../../modules/responseMessage'),
    Review = require('../../models/review'),
    uploadImageUrl = require('../../utils/image-uploader/imgur-uploader');


router.get('/:storeId', middleware.jwtAuth, async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;
        const store = await Store.findById(req.params.storeId);
        const count = store.reviews.length;

        let foundStore = await Store.findById(req.params.storeId).populate({
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
        console.log(e)
        return response.internalServerError(res, e.message);
    }
});

router.post('/image', middleware.jwtAuth, uploadImage, async (req, res) => {
    try {
        let imgurURL = await uploadImageUrl(req.file.path);
        return response.success(res, {imageUrl: imgurURL})
    } catch (e) {
        return response.internalServerError(res, "上傳圖片失敗")
    }

})

router.post('/new', middleware.jwtAuth, body('review').not().isEmpty().trim().escape(), dataValidation.addReview, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const storeId = req.body.storeId;
        const authorId = req.user._id;
        const review = req.body.review;
        const rating = req.body.rating;
        session.startTransaction();

        let store = await Store.findById(storeId).session(session);

        if (!store) {
            throw new Error("store not found")
        }

        const newReview = await Review.create([{
            rating: rating,
            text: review,
            author: authorId,
            store: storeId
        }], {session: session});


        store.reviews.push(new mongoose.mongo.ObjectId(newReview[0]._id));

        await store.save({session: session});

        await session.commitTransaction();
        session.endSession();
        response.success(res, "success");
    } catch (err) {
        console.log(err)
        await session.abortTransaction();
        session.endSession();
        response.internalServerError(res, `無法新增評論: ${err.message}`)
    }

})


module.exports = router