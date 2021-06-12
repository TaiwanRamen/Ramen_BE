//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    StoreRelation = require('../../models/storeRelation'),
    User = require('../../models/user'),
    Comment = require('../../models/comment'),
    Review = require("../../models/review"),
    mongoose = require('mongoose'),
    response = require('../../modules/responseMessage'),
    middleware = require('../../middleware/checkAuth'),
    log = require('../../modules/logger');

router.get('/', async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;
        //fuzzy search
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');

            const allStores = await Store.aggregate([
                {$match: {$or: [{name: regex}, {city: regex}, {descriptionText: regex}]}},
                {$sort: {rating: -1, city: 1}},
                {$skip: (perPage * pageNumber) - perPage},
                {$limit: perPage},
                {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
                {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
            ])

            const count = await Store.countDocuments({
                $or: [
                    {name: regex},
                    {city: regex},
                    {descriptionText: regex},
                ],
            }).exec()

            return response.success(res, {
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                search: req.query.search
            });

        } else {

            const allStores = await Store.aggregate([
                {$sort: {rating: -1, city: 1}},
                {$skip: (perPage * pageNumber) - perPage},
                {$limit: perPage},
                {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
                {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
            ])

            const count = await Store.countDocuments().exec();
            return response.success(res, {
                mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
                stores: allStores,
                current: pageNumber,
                pages: Math.ceil(count / perPage),
                search: false
            });
        }
    } catch (error) {
        return response.internalServerError(res, error.message);
    }
});

//get store
router.get('/:storeId', async (req, res) => {
    try {
        const storeId = req.params.storeId;

        let store = await Store.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(storeId)}},
            {$limit: 1},
            {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
            {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
        ])


        if (!store[0]) {
            return response.notFound(res, "找不到店家");
        }


        let isStoreOwner = false;
        if (req.user && req.user.hasStore.includes(storeId)) {
            isStoreOwner = true;
        }


        return response.success(res, {
            mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
            store: store[0],
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
        const storeRelation = await StoreRelation.findOne({'storeId': storeId});
        const isUserFollowing = storeRelation.followers.includes(userId);

        return response.success(res, {isUserFollowing: isUserFollowing});
    } catch (error) {
        log.error(error);
        return response.internalServerError(res, `cannot fetch isUserFollowing`);
    }

})

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
            console.log(error)
            await session.abortTransaction();
            session.endSession();
            return response.internalServerError(res, `無法刪除店家: ${error.message}`)
        }

    })

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}


module.exports = router