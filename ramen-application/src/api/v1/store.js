//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    response = require('../../modules/responseMessage'),
    middleware = require('../../middleware/checkAuth'),
    log = require('../../modules/logger'),
    storeService = require('../../service/store.service'),
    userService = require('../../service/user.service'),
    pagination = require('../../utils/pagination'),
    dataValidate = require('../../middleware/dataValidate')


router.get('/', async (req, res) => {

    try {
        const {perPage, pageNumber} = pagination(req.query.page);
        const {allStores, count, search} = await storeService.getStoresWithSearchAndPagination(req.query.search, req.query.page)
        return response.success(res, {
            stores: allStores,
            current: pageNumber,
            pages: Math.ceil(count / perPage),
            search: search
        });

    } catch (error) {
        return response.internalServerError(res, error.message);
    }
});

router.get('/:storeId', middleware.jwtAuth, dataValidate.storeId,  async (req, res) => {
    try {
        const storeId = req.params.storeId;

        const store = await storeService.getStoreDetailById(req.params.storeId)

        if (!store) {
            return response.notFound(res, "找不到店家");
        }

        let isStoreOwner = userService.isUserStoreOwner(req.user, storeId)


        return response.success(res, {
            mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
            store: store,
            isStoreOwner: isStoreOwner
        })

    } catch (error) {
        return response.internalServerError(res, error.message);
    }
});

router.get('/:storeId/isUserFollowing', middleware.jwtAuth, async (req, res) => {
    try {
        let userId = req.user._id;
        let storeId = req.params.storeId;
        const isUserFollowing = await storeService.isUserFollowing(userId, storeId)

        return response.success(res, {isUserFollowing});
    } catch (error) {
        log.error(error);
        return response.internalServerError(res, `cannot fetch isUserFollowing`);
    }

})

router.get('/:storeId/getComments', middleware.jwtAuth, async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const {perPage, pageNumber} = pagination(req.query.page);
        const {comments, count} = await storeService.getCommentsWithPagination(storeId, pageNumber);


        return response.success(res, {
            comments: comments,
            current: pageNumber,
            pages: Math.ceil(count / perPage),
        });

    }  catch (error) {
        log.error(error);
        return response.internalServerError(res, `無法取得店家留言`);
    }

})

router.get('/:storeId/getReviews', middleware.jwtAuth, async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const {perPage, pageNumber} = pagination(req.query.page);
        const {reviews, count} = await storeService.getReviewsWithPagination(storeId, pageNumber);

        return response.success(res, {
            reviews: reviews,
            current: pageNumber,
            pages: Math.ceil(count / perPage),
        });

    }  catch (error) {
        log.error(error);
        return response.internalServerError(res, `無法取得店家留言`);
    }
})


router.put('/:storeId/follow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.storeId;
    let userId = req.user._id;
    try {
        await storeService.userFollowStore(userId, storeId)
        return response.success(res, "success following: " + storeId);
    } catch (error) {
        return response.internalServerError(res, `cannot follow ${storeId},  ${error.message}`);
    }
});

router.put('/:storeId/unfollow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.storeId;
    let userId = req.user._id;
    try {
        await storeService.userUnFollowStore(userId, storeId)
        return response.success(res, "success unfollowing: " + storeId);
    } catch (error) {
        return response.internalServerError(res, "cannot unfollow: " + storeId);
    }
})


router.delete('/:storeId', middleware.jwtAuth, middleware.isStoreOwner,
    async (req, res) => {
        const storeId = req.params.storeId;
        try {
            await storeService.deleteStore(storeId)
            return response.success(res);
        } catch (error) {
            return response.internalServerError(res, `無法刪除店家: ${storeId}, ${error.message}`)
        }

    })


module.exports = router