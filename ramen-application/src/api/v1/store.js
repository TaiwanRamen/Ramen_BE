//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    Comment = require('../../models/comment'),
    Review = require("../../models/review"),
    response = require('../../modules/response-message'),
    middleware = require('../../middleware'),
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
        let foundStore = await Store.findById(req.params.id);
        if (!foundStore) {
            return response.notFound(res, "找不到店家");
        }
        let isStoreOwner = false;
        if (req.user && req.user.hasStore.includes(req.params.id)) {
            isStoreOwner = true;
        }
        return response.success(res, {
            mapboxAccessToken: process.env.MAPBOT_ACCESS_TOKEN,
            store: foundStore,
            isStoreOwner: isStoreOwner
        })

    } catch (error) {
        return response.internalServerError(res, error.message);
        console.log(error)
    }
    ;
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
        console.log('成功追蹤' + store.name);
        response.success(res, "success following: " + storeId);
        // req.flash('success_msg', '成功追蹤' + store.name);
    } catch (error) {
        console.log('無法追蹤' + store.name, error);
        response.internalServerError(res, `cannot follow ${storeId},  ${error.message}`);
    }
});

router.put('/:id/unfollow', middleware.jwtAuth, async (req, res) => {
    let storeId = req.params.id;
    let userId = req.user._id;
    let store = await Store.findById(storeId);
    try {
        let storeIndex = store.followers.indexOf(userId);
        console.log(storeIndex);
        if (storeIndex > -1) {
            store.followers.splice(storeIndex, 1);
            await store.save();
        }
        let user = await User.findById(userId);
        let userIndex = user.followedStore.indexOf(storeId);
        console.log(userIndex);

        if (userIndex > -1) {
            user.followedStore.splice(userIndex, 1);
            await user.save();
        }
        console.log('成功取消追蹤' + store.name);
        response.success(res, "success unfollowing: " + storeId);

    } catch (error) {
        console.log('無法取消追蹤' + store.name)
        response.internalServerError(res, "cannot unfollow: " + storeId);
    }
})

router.delete('/:storeId', middleware.jwtAuth, middleware.isStoreOwner,
    async (req, res) => {
        const session = await startSession();

        try {
            const storeId = req.params.storeId;
            session.startTransaction();
            let store = await Store.findById(storeId);
            if (!store) response.notFound(res, "店家不存在");

            await Comment.deleteMany({
                "_id": {
                    $in: store.comments
                }
            });
            await Review.deleteMany({
                "_id": {
                    $in: store.reviews
                }
            })
            await store.deleteOne();
            await session.commitTransaction()
            session.endSession()
            response.success(res);
        } catch (error) {
            session.endSession()
            console.log(error)
            response.internalServerError(res, error.message)
        }

    })

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}


module.exports = router