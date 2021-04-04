const express = require('express'),
    router = express.Router(),
    log = require('../modules/logger'),
    Store = require('../models/store');


//==============================================================
//   put bound inside the query and return stores in the bound
//==============================================================
router.get('/get-store', async (req, res) => {
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
        // find stores within current map range
        let foundStore = await Store.find().where('location').within(mapBound);
        log.info([req.query.W, req.query.N], [req.query.E, req.query.S]);
        log.info(foundStore.length);
        res.status(200).json({ foundStore })
    } catch (err) {
        log.info(err)
        res.status(404).send(err.message);
    }
})

//==============================================================
//   put bound inside the query and return stores in the bound
//==============================================================
router.get('/search-store', async (req, res) => {
    try {
        //res.query = { input: '台北' }
        log.info(req.query)
        const regex = new RegExp(escapeRegex(req.query.input), 'gi');

        //search from all the fields included in $or
        const foundStore = await Store.find({
            $or: [
                { name: regex },
                { city: regex },
                { descriptionText: regex },
            ],
        }).sort({
            'updated_At': 1
        }).exec()
        const count = await Store.countDocuments({
            $or: [
                { name: regex },
                { city: regex },
                { descriptionText: regex },
            ],
        }).exec()
        log.info(foundStore.length)
        res.status(200).json({ foundStore })
    } catch (err) {
        log.info(err)
        res.status(404).send(err.message);
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}
module.exports = router