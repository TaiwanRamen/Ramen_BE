//========  /api/vi/stores

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
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



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}



module.exports = router