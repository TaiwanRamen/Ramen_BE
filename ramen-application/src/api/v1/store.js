//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    StoreRelation = require('../../models/storeRelation'),
    Comment = require('../../models/comment'),
    Review = require("../../models/review"),
    mongoose = require('mongoose'),
    response = require('../../modules/responseMessage'),
    middleware = require('../../middleware/checkAuth'),
    log = require('../../modules/logger'),
    storeService = require('../../service/store.service'),
    userService = require('../../service/user.service'),
    storeRelationService = require('../../service/storeRelation.service'),
    pagination = require('../../utils/pagination')


router.get('/', async (req, res) => {

    try {
        const {perPage, pageNumber} = pagination(req.query.page);
        const {allStores, count, search} = await storeService.getStores(req.query.search, req.query.page)
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

//get store
router.get('/:storeId', async (req, res) => {
    try {
        const storeId = req.params.storeId;

        const store = await storeService.getStoreById(req.params.storeId)

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

// to here
// need to change to findOneAndUpdate
router.put('/:storeId/follow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.storeId;
    let userId = req.user._id;

    const session = await mongoose.startSession();
    try {

        session.startTransaction();

        await StoreRelation.findOneAndUpdate(
            {'storeId': storeId},
            {$addToSet: {followers: new mongoose.Types.ObjectId(userId)}},
            {session: session}
        );

        await User.findOneAndUpdate(
            {'_id': userId},
            {$addToSet: {followedStore: new mongoose.Types.ObjectId(storeId)}},
            {session: session}
        );

        await session.commitTransaction();
        session.endSession();

        return response.success(res, "success following: " + storeId);
    } catch (error) {
        log.error(error);
        await session.abortTransaction();
        await session.endSession();
        return response.internalServerError(res, `cannot follow ${storeId},  ${error.message}`);
    }
});

router.put('/:storeId/unfollow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.storeId;
    let userId = req.user._id;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await StoreRelation.findOneAndUpdate(
            {'storeId': storeId},
            {$pull: {followers: new mongoose.Types.ObjectId(userId)}},
            {multi: false, session: session}
        );

        await User.findOneAndUpdate(
            {'_id': userId},
            {$pull: {followedStore: new mongoose.Types.ObjectId(storeId)}},
            {multi: false, session: session}
        );

        await session.commitTransaction();
        session.endSession();
        return response.success(res, "success unfollowing: " + storeId);

    } catch (error) {
        log.error(error);
        await session.abortTransaction();
        await session.endSession();
        return response.internalServerError(res, "cannot unfollow: " + storeId);
    }
})

router.delete('/:storeId', middleware.jwtAuth, middleware.isStoreOwner,
    async (req, res) => {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const storeId = req.params.storeId;
            let store = await Store.findById(storeId).session(session);

            const storeRelation = await StoreRelation.findOne({'storeId': storeId}).session(session);

            if (!store || !storeRelation) return response.notFound(res, "店家不存在");


            await Review.deleteMany({
                "_id": {
                    $in: storeRelation.reviews
                }
            }, {session: session})

            await Comment.deleteMany({
                "_id": {
                    $in: storeRelation.comments
                },
            }, {session: session});

            await store.deleteOne({session: session});
            await storeRelation.deleteOne({session: session});


            await session.commitTransaction();
            session.endSession()
            return response.success(res);
        } catch (error) {
            log.error(error);
            await session.abortTransaction();
            session.endSession();
            return response.internalServerError(res, `無法刪除店家: ${error.message}`)
        }

    })


module.exports = router