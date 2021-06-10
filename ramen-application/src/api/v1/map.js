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
        const N = parseFloat(req.query.N);
        const S = parseFloat(req.query.S);
        const E = parseFloat(req.query.E);
        const W = parseFloat(req.query.W);

        const mapBound = {
            type: 'Polygon',
            coordinates: [
                [[W, N], [W, S], [E, S], [E, N], [W, N],]
            ]
        };

        let foundStores;

        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');

            foundStores = await Store.aggregate([
                {$match: {$or: [{name: regex}, {city: regex}, {descriptionText: regex}]}},
                {$match: {'location': {$geoWithin: {$geometry: mapBound}}}},
                {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
                {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
            ])

        } else {
            foundStores = await Store.aggregate([
                {$match: {'location': {$geoWithin: {$geometry: mapBound}}}},
                {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
                {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
            ])
        }

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