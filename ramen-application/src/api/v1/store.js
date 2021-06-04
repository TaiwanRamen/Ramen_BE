//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    Comment = require('../../models/comment'),
    Review = require("../../models/review"),
    mongoose = require('mongoose'),
    response = require('../../modules/responseMessage'),
    middleware = require('../../middleware/checkAuth'),
    {startSession} = require('mongoose');

router.get('/', async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;
        //fuzzy search
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');

            //search from all the fields included in $or
            const allStores = await Store.find({
                $or: [
                    {name: regex},
                    {city: regex},
                    {descriptionText: regex},
                ],
            }).collation({locale: 'zh@collation=zhuyin'})
                .sort({rating: -1, city: 1})
                .skip((perPage * pageNumber) - perPage).limit(perPage).exec();
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
            //get all stores from DB
            const allStores = await Store.find().collation({locale: 'zh@collation=zhuyin'})
                .sort({rating: -1, city: 1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec();
            ;
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
        console.log(error)
    }
});

//get store
router.get('/:id', async (req, res) => {
    try {
        const storeId = req.params.id
        let foundStore = await Store.findById(storeId);
        if (!foundStore) {
            return response.notFound(res, "找不到店家");
        }
        let isStoreOwner = false;
        if (req.user && req.user.hasStore.includes(storeId)) {
            isStoreOwner = true;
        }

        const avgRating = await Store.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(storeId)}},
            {$lookup: {from: 'reviews', localField: 'reviews', foreignField: '_id', as: 'reviewObjs'}},
            {$project: {average:{$avg: "$reviewObjs.rating"}}},
            {$limit: 1}
        ])

        foundStore.rating = avgRating[0].average;
        await foundStore.save();

        return response.success(res, {
            mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
            store: foundStore,
            isStoreOwner: isStoreOwner
        })

    } catch (error) {
        return response.internalServerError(res, error.message);
    }
});

router.put('/:id/follow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.id;
    let userId = req.user._id;
    let store = await Store.findById(storeId);
    let user = await User.findById(userId);
    try {
        let storeIndex = store.followers.indexOf(userId);
        let userIndex = user.followedStore.indexOf(storeId);
        if (storeIndex > -1 || userIndex > -1) {
            throw new Error("user already follow store");
        }
        store.followers.push(userId);
        await store.save();
        user.followedStore.push(storeId);
        await user.save();
        return response.success(res, "success following: " + storeId);
        // req.flash('success_msg', '成功追蹤' + store.name);
    } catch (error) {
        return response.internalServerError(res, `cannot follow ${storeId},  ${error.message}`);
    }
});

router.put('/:id/unfollow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.id;
    let userId = req.user._id;
    let store = await Store.findById(storeId);
    try {
        let storeIndex = store.followers.indexOf(userId);
        if (storeIndex > -1) {
            store.followers.splice(storeIndex, 1);
            await store.save();
        }
        let user = await User.findById(userId);
        let userIndex = user.followedStore.indexOf(storeId);

        if (userIndex > -1) {
            user.followedStore.splice(userIndex, 1);
            await user.save();
        }
        return response.success(res, "success unfollowing: " + storeId);

    } catch (error) {
        console.log('無法取消追蹤' + store.name)
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
            if (!store) return response.notFound(res, "店家不存在");


            await Review.deleteMany({
                "_id": {
                    $in: store.reviews
                }
            }, {session: session})

            await Comment.deleteMany({
                "_id": {
                    $in: store.comments
                },
            }, {session: session});

            await store.deleteOne({session: session});

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