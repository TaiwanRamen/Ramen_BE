//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    passport = require('passport'),
    passportJWT = passport.authenticate('jwt', { session: false }),
    response = require('../../modules/response-message');


router.get('/', passportJWT, async (req, res) => {
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
                    { name: regex },
                    { city: regex },
                    { descriptionText: regex },
                ],
            }).collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 })
                .skip((perPage * pageNumber) - perPage).limit(perPage).exec();
            const count = await Store.countDocuments({
                $or: [
                    { name: regex },
                    { city: regex },
                    { descriptionText: regex },
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
            const allStores = await Store.find().collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 }).skip((perPage * pageNumber) - perPage).limit(perPage).exec();;
            const count = await Store.countDocuments().exec();
            return response.success(res,{
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
router.get('/:id',  async (req, res) => {
    try {
        // let foundStore = await Store.findById(req.params.id).populate("comments").populate({
        //     path: "reviews",
        //     options: {
        //         sort: {
        //             createdAt: -1
        //         }
        //     }
        // });
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
    };
});

router.put('/:id/follow',  passportJWT, async (req, res) => {
    let storeId = req.params.id;
    let userId = req.user._id;
    let store = await Store.findById(storeId);
    try {
        store.followers.push(userId);
        await store.save();
        let user = await User.findById(userId);
        user.followedStore.push(storeId);
        await user.save();
        console.log('成功追蹤' + store.name);
        response.success(res, "success following: " + storeId );
        // req.flash('success_msg', '成功追蹤' + store.name);
    } catch (error) {
        console.log('無法追蹤' + store.name);
        response.internalServerError(res, "cannot follow: " + storeId );
        // req.flash('error_msg', '無法追蹤' + store.name);
        // res.redirect(`/stores/${store._id}`);
    }
});

router.put('/:id/unfollow', passportJWT, async (req, res) => {
    let storeId = req.params.id;
    let userId = req.user._id;
    let store = await Store.findById(storeId);
    try {
        let storeIndex = store.followers.indexOf(userId);
        if (storeIndex > -1) {
            store.followers.splice(storeIndex, 1);
            await store.save();
            // console.log('成功取消追蹤' + store.name);
            // req.followerslash('success_msg', '成功取消追蹤' + store.name);
        }
        let user = await User.findById(userId);
        let userIndex = user.followedStore.indexOf(storeId);
        if (userIndex > -1) {
            user.followedStore.splice(userIndex, 1);
            await store.save();
        }
        console.log('成功取消追蹤' + store.name);
        response.success(res,"success unfollowing: " + storeId );

    } catch (error) {
        console.log('無法取消追蹤' + store.name)

        req.flash('error_msg', '無法取消追蹤' + store.name);
        response.internalServerError(res, "cannot unfollow: " + storeId );
        // res.redirect(`/stores/${store._id}`);
    }
})


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}



module.exports = router