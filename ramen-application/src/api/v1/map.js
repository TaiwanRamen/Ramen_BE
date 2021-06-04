const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    Store = require('../../models/store'),
    middleware = require('../../middleware/checkAuth'),
    response = require("../../modules/responseMessage");


//==============================================================
//   put bound inside the query and return stores in the bound
//   also add search into the query
//==============================================================
router.get('/get-store', middleware.jwtAuth, async (req, res) => {
    try {
        const mapBound = {
            type: 'Polygon',
            coordinates: [
                [
                    [req.query.W, req.query.N], //NW
                    [req.query.W, req.query.S], //SW
                    [req.query.E, req.query.S], //SE
                    [req.query.E, req.query.N], //NE
                    [req.query.W, req.query.N], //NW
                ]
            ]
        };

        let foundStores;

        if (req.query.search) {
            const search = new RegExp(escapeRegex(req.query.search), 'gi');
            foundStores = await Store.find({
                $or: [
                    { name: search },
                    { city: search },
                    { descriptionText: search },
                ],
            }).collation({ locale: 'zh@collation=zhuyin' })
                .sort({ rating: -1, city: 1 })
        } else {
            foundStores = await Store.find().collation({ locale: 'zh@collation=zhuyin' }).where('location').within(mapBound);
        }
        //
        // let filteredStore = foundStores.map((store) => {
        //     return {
        //         location: store.location,
        //         _id: store._id,
        //         name: store.name,
        //         descriptionText: store.descriptionText.substring(0, 100),
        //         city: store.city,
        //         rating: store.rating,
        //         imageSmall: store.imageSmall,
        //         reviewsCount: store.reviews.length
        //     }
        // })
        response.success(res, foundStores);
    } catch (err) {
        log.info(err)
        response.notFound(res, err.message);
    }
})

//==============================================================
//   put bound inside the query and return stores in the bound
//   only used in ejs
//==============================================================
router.get('/search-store', middleware.jwtAuth, async (req, res) => {
    try {
        //res.query = { input: '台北' }
        log.info(req.query)
        const regex = new RegExp(escapeRegex(req.query.input), 'gi');

        //search from all the fields included in $or
        const foundStore = await Store.find({
            $or: [
                {name: regex},
                {city: regex},
                {descriptionText: regex},
            ],
        }).sort({
            'updated_At': 1
        }).exec()
        const count = await Store.countDocuments({
            $or: [
                {name: regex},
                {city: regex},
                {descriptionText: regex},
            ],
        }).exec()
        log.info(foundStore.length)
        response.success()
        res.status(200).json({foundStore})
    } catch (err) {
        log.info(err)
        res.status(404).send(err.message);
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

module.exports = router