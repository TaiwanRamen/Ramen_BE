const express = require('express'),
    router = express.Router(),
    Store = require('../models/store');



router.get('/get-store/', async (req, res) => {
    try {
        //res.query =  
        //{
        //     W: '121.45540237426758',
        //     S: '25.00986185664923',
        //     E: '121.64594650268555',
        //     N: '25.072072304608533'
        // } 

        req.query;
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
        let foundStore = await Store.find().where('location').within(mapBound)
        console.log([req.query.W, req.query.N], [req.query.E, req.query.S])
        foundStore.forEach((store) => {
            //console.log(store.location.coordinates)
        })
        res.status(200).json({
            foundStore
        })
    } catch (err) {
        console.log(err)
        //res.status(404).send(err.message);
    }
})

module.exports = router