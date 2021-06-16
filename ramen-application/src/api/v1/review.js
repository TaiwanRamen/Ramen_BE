//========  /api/vi/reviews

const express = require('express'),
    router = express.Router(),
    middleware = require('../../middleware/checkAuth'),
    dataValidate = require('../../middleware/dataValidate'),
    getImage = require('../../modules/getImage'),
    response = require('../../modules/responseMessage'),
    createDOMPurify = require('dompurify'),
    log = require('../../modules/logger'),
    {JSDOM} = require('jsdom'),
    uploadImageUrl = require('../../utils/image-uploader/imgur-uploader'),
    reviewService = require('../../service/review.service')

router.get('/userReview/:storeId', middleware.jwtAuth, async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const user = req.user;
        const review = await reviewService.getUserReviewForStore(user, storeId);

        return response.success(res, {
            review: review
        });
    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

router.post('/image', middleware.jwtAuth, getImage, async (req, res) => {
    try {
        let imgurURL = await uploadImageUrl(req.file.path);
        return response.success(res, {imageUrl: imgurURL})
    } catch (err) {
        log.error(err);
        return response.internalServerError(res, "上傳圖片失敗")
    }
})



router.post('/', middleware.jwtAuth, dataValidate.addReview, async (req, res) => {
    try {
        const window = new JSDOM('').window;
        const DOMPurify = createDOMPurify(window);

        const storeId = req.body.storeId;
        const userId = req.user._id;
        const review = DOMPurify.sanitize(req.body.review);
        const rating = req.body.rating;

        await reviewService.addReview(storeId, userId, review, rating);
        response.success(res, "success");
    } catch (err) {
        response.internalServerError(res, `無法新增評論`)
    }

})

router.put('/', middleware.jwtAuth, middleware.isReviewOwner, dataValidate.editReview, async (req, res) => {
    try {
        const newText = req.body.review;
        const newRating = req.body.rating;
        const storeId = req.body.storeId;
        const foundReview = res.locals.foundReview;
        await reviewService.updateReview(foundReview, newText, newRating, storeId)
        response.success(res, "success");
    } catch (err) {
        response.internalServerError(res, "無法編輯評論")
    }
})


router.delete('/', middleware.jwtAuth, middleware.isReviewOwner, dataValidate.deleteReview,
    async (req, res) => {
        try {
            const reviewId = req.body?.reviewId;
            const storeId = req.body?.storeId;
            const userId = req.user._id;
            await reviewService.deleteReview(storeId, reviewId, userId);
            response.success(res, "success");
        } catch (err) {
            response.internalServerError(res, `無法刪除留言`)
        }
    }
)

module.exports = router