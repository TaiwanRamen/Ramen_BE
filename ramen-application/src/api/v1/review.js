//========  /api/vi/review

const express = require('express'),
    mongoose = require('mongoose'),
    router = express.Router(),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    middleware = require('../../middleware/checkAuth'),
    {body} = require('express-validator'),
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
        const store = await Store.findById(req.params.storeId);
        const count = store.reviews.length;

        //如果user review則不顯示
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

        user.reviews.push(new mongoose.mongo.ObjectId(newReview[0]._id));
        await user.save({session: session});

        await session.commitTransaction();
        session.endSession();
        response.success(res, "success");
    } catch (err) {
        log.error(err);
        await session.abortTransaction();
        session.endSession();
        response.internalServerError(res, `無法新增評論: ${err.message}`)
    }

})

router.put('/', middleware.jwtAuth, middleware.isReviewOwner, dataValidation.editReview, async (req, res) => {
    try {
        const updatedReview = req.body?.review;
        const updatedRating = req.body?.rating;

        const foundReview = res.locals.foundReview;

        foundReview.text = updatedReview;
        foundReview.rating = updatedRating;

        await foundReview.save()

        response.success(res, "success");
    } catch (err) {
        log.error(err);
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
            console.log(reviewId)
            console.log(storeId)

            const store = await Store.findById(storeId).session(session);
            if (!store) {
                throw new Error("店家不存在");
            }

            await Review.findByIdAndRemove(reviewId).session(session);
            store.reviews = store.reviews.filter(item => item.toString() !== reviewId);

            await store.save({session: session});

            const user = req.user;
            user.reviews = user.reviews.filter(item => item.toString() !== reviewId);

            await user.save({session: session});

            await session.commitTransaction();
            session.endSession();
            response.success(res, "success");
        } catch (err) {
            log.error(err);
            await session.abortTransaction();
            session.endSession();
            response.internalServerError(res, `無法刪除留言: ${err.message}`)
        }
    })
module.exports = router