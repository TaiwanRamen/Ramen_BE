const express = require('express'),
    router = express.Router(),
    Store = require('../models/store');


//==============================================================
//   put bound inside the query and return stores in the bound
//==============================================================
router.get('/get-store', async (req, res) => {
    try {
        //res.query =  
        //{
        //     W: '121.45540237426758',
        //     S: '25.00986185664923',
        //     E: '121.64594650268555',
        //     N: '25.072072304608533'
        // } 

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
        console.log([req.query.W, req.query.N], [req.query.E, req.query.S]);
        console.log(foundStore.length);
        res.status(200).json({ foundStore })
    } catch (err) {
        console.log(err)
        //res.status(404).send(err.message);
    }
})

//==============================================================
//   put bound inside the query and return stores in the bound
//==============================================================
router.get('/search-store', async (req, res) => {
    try {
        //res.query = { input: '台北' }
        console.log(req.query)
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
        console.log(foundStore.length)
        res.status(200).json({ foundStore })
    } catch (err) {
        console.log(err)
        res.status(404).send(err.message);
    }
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}
module.exports = router