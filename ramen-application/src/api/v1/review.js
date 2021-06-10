//========  /api/vi/review

const express = require('express'),
    mongoose = require('mongoose'),
    router = express.Router(),
    User = require('../../models/user'),
    StoreRelation = require('../../models/storeRelation'),
    Store = require('../../models/store'),
    middleware = require('../../middleware/checkAuth'),
    dataValidation = require('../../middleware/dataValidate'),
    uploadImage = require('../../modules/uploadImage'),
    response = require('../../modules/responseMessage'),
    Review = require('../../models/review'),
    createDOMPurify = require('dompurify'),
    log = require('../../modules/logger'),
    {JSDOM} = require('jsdom'),
    uploadImageUrl = require('../../utils/image-uploader/imgur-uploader');


router.get('/:storeId', middleware.jwtAuth, async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;

        let foundStoreRelation = await StoreRelation.findOne({'storeId': req.params.storeId}).populate({
            path: "reviews",
            options: {
                skip: (perPage * pageNumber) - perPage,
                limit: perPage,
                sort: {createdAt: -1}
            },
            populate: {
                path: 'author'
            }
        })
        if (!foundStoreRelation) return response.notFound(res, "店家不存在");

        const reviews = foundStoreRelation.reviews;

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

        const countReview = await StoreRelation.aggregate([
            {$match: {storeId: new mongoose.Types.ObjectId(req.params.storeId)}},
            {$project: {count: {$size: '$reviews'}}},
            {$limit: 1}
        ])
        const count = countReview[0]?.count;


        return response.success(res, {
            current: pageNumber,
            pages: Math.ceil(count / perPage),
            reviews: result
        });
    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});


router.get('/userReview/:storeId', middleware.jwtAuth, async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const user = await User.findById(req.user._id).populate({
            path: 'reviews'
        });
        const reviews = user.reviews;
        const userReview = reviews.find(review => review.store.equals(storeId));

        if (!userReview || userReview.length < 1) {
            return response.success(res, {
                review: null
            });
        }

        const result = {
            _id: userReview._id,
            rating: userReview.rating,
            text: userReview.text,
            createdAt: userReview.createdAt,
            updatedAt: userReview.updatedAt,
            __v: userReview.__v,
            store: userReview.store,
            author: {id: user._id, avatar: user.avatar, username: user.username}
        }

        return response.success(res, {
            review: result
        });
    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

router.post('/image', middleware.jwtAuth, uploadImage, async (req, res) => {
    try {
        let imgurURL = await uploadImageUrl(req.file.path);
        return response.success(res, {imageUrl: imgurURL})
    } catch (err) {
        log.error(err);
        return response.internalServerError(res, "上傳圖片失敗")
    }
})

router.post('/', middleware.jwtAuth, dataValidation.addReview, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const window = new JSDOM('').window;
        const DOMPurify = createDOMPurify(window);

        const storeId = req.body.storeId;
        const authorId = req.user._id;
        const review = DOMPurify.sanitize(req.body.review);
        const rating = req.body.rating;
        session.startTransaction();
        const user = req.user;


        const storeRelation = await StoreRelation.findOne({'storeId': storeId}).session(session);
        const store = await Store.findById(storeId).session(session);

        if (!storeRelation || !store) {
            throw new Error("store not found")
        }

        const newReview = await Review.create([{
            rating: rating,
            text: review,
            author: authorId,
            store: storeId
        }], {session: session});

        storeRelation.reviews.push(new mongoose.mongo.ObjectId(newReview[0]._id));
        await storeRelation.save({session: session});

        user.reviews.push(new mongoose.mongo.ObjectId(newReview[0]._id));
        await user.save({session: session});

        await changeStoreRaging(storeId, store, session);

        await session.commitTransaction();
        session.endSession();
        log.info(`Added review ${newReview[0]._id} to store ${storeId}`)
        response.success(res, "success");
    } catch (err) {
        log.error(err);
        await session.abortTransaction();
        await session.endSession();
        response.internalServerError(res, `無法新增評論: ${err.message}`)
    }

})

router.put('/', middleware.jwtAuth, middleware.isReviewOwner, dataValidation.editReview, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const updatedReview = req.body.review;
        const updatedRating = req.body.rating;
        const storeId = req.body.storeId;
        const foundReview = res.locals.foundReview;
        session.startTransaction();

        const store = await Store.findById(storeId).session(session);

        if (!store) {
            throw new Error("store not found")
        }

        foundReview.text = updatedReview;
        foundReview.rating = updatedRating;
        await foundReview.save({session: session});

        await changeStoreRaging(storeId, store, session);

        await session.commitTransaction();
        await session.endSession();
        log.info(`edit review to store ${storeId}`)
        response.success(res, "success");
    } catch (err) {
        log.error(err);
        await session.abortTransaction();
        await session.endSession();
        response.internalServerError(res, "無法編輯留言")
    }

})


router.delete('/', middleware.jwtAuth, middleware.isReviewOwner, dataValidation.deleteReview,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const reviewId = req.body?.reviewId;
            const storeId = req.body?.storeId;


            const storeRelation = await StoreRelation.findOne({'storeId': storeId}).session(session);
            const store = await Store.findById(storeId).session(session);

            if (!storeRelation || !store) {
                throw new Error("store not found")
            }

            await Review.findByIdAndRemove(reviewId).session(session);
            storeRelation.reviews = storeRelation.reviews.filter(item => item.toString() !== reviewId);

            await storeRelation.save({session: session});

            const user = req.user;
            user.reviews = user.reviews.filter(item => item.toString() !== reviewId);

            await user.save({session: session});

            await changeStoreRaging(storeId, store, session);

            await session.commitTransaction();
            session.endSession();
            log.info(`Removed review ${reviewId} to store ${storeId}`)
            response.success(res, "success");
        } catch (err) {
            log.error(err);
            await session.abortTransaction();
            session.endSession();
            response.internalServerError(res, `無法刪除留言: ${err.message}`)
        }
    })

const changeStoreRaging = async (storeId, store, session) => {
    const avgRating = await StoreRelation.aggregate([
        {$match: {storeId: new mongoose.Types.ObjectId(storeId)}},
        {$lookup: {from: 'reviews', localField: 'reviews', foreignField: '_id', as: 'reviewObjs'}},
        {$project: {average: {$avg: "$reviewObjs.rating"}}},
        {$limit: 1}
    ]).session(session);
    store.rating = avgRating[0].average;
    await store.save({session: session});
}
module.exports = router