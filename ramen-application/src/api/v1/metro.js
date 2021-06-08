//========  /api/vi/metro

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    Metro = require('../../models/metro'),
    middleware = require('../../middleware/checkAuth'),
    dataValidation = require('../../middleware/dataValidate'),
    response = require('../../modules/responseMessage'),
    log = require('../../modules/logger');


router.get('/', middleware.jwtAuth, dataValidation.metro, async (req, res) => {
    try {
        const city = req.query.city;
        const stationCode = req.query.stationCode;
        let maxDistance = req.query.maxDistance ? req.query.maxDistance : 2000; //meter
        let metro = await Metro.findOne({ stationCode: stationCode })

        if (!metro) {
            return response.notFound(res, `找ㄅㄨ找不到捷運站${stationCode}`);
        } else {
            const stationLocation = metro.location.coordinates;
            let foundStore = await Store.aggregate([{
                '$geoNear': {
                    'near': {
                        'type': 'Point',
                        'coordinates': stationLocation
                    },
                    'spherical': true, 'distanceField': "distance",
                    "distanceMultiplier": 0.001,
                    'maxDistance': parseFloat(maxDistance)
                }
            }]);

            return response.success(res, {
                stores: foundStore
            });
        }

    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

router.get('/closeToStore', middleware.jwtAuth, dataValidation.metroCloseToStore, async (req, res) => {
    try {
        const storeId = req.query.storeId;
        const maxDistance = req.query.maxDistance ? req.query.maxDistance : 2000; //meter

        const foundStore = await Store.findById(storeId);
        if (!foundStore) {
            return response.notFound(res, `找不到捷運站${stationCode}`);
        } else {

            const stationLocation = foundStore.location.coordinates;

            const foundStation = await Metro.aggregate([
                {
                    '$geoNear': {
                        'near': {
                            'type': 'Point',
                            'coordinates': stationLocation
                        },
                        'spherical': true,
                        'distanceField': "distance",
                        "distanceMultiplier": 0.001,
                        'maxDistance': parseFloat(maxDistance)
                    }

                },
                {$limit: 3}
            ]);
            const result = foundStation.map(station => {
                return {
                    city: station.city,
                    name: station.name,
                    lineCode: station.lineCode,
                    distance: station.distance.toFixed(2)
                }
            })
            return response.success(res, {stations: result});
        }

    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

module.exports = router