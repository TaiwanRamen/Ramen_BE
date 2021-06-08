//========  /api/vi/metro

const express = require('express'),
    router = express.Router(),
    Store = require('../../models/store'),
    Metro = require('../../models/metro'),
    middleware = require('../../middleware/checkAuth'),
    dataValidation = require('../../middleware/dataValidate'),
    response = require('../../modules/responseMessage'),
    log = require('../../modules/logger'),
    redisClient = require('../../db/connectRedis');


router.get('/', middleware.jwtAuth, dataValidation.metro, async (req, res) => {
    try {
        const stationCode = req.query.stationCode;
        let maxDistance = req.query.maxDistance ? req.query.maxDistance : 2000; //meter

        const key = `metro:storesNearMetro:${stationCode}`

        let cachedData = await redisClient.get(key);

        if (cachedData) {
            return response.success(res, {
                stores: JSON.parse(cachedData)
            });
        }

        let metro = await Metro.findOne({stationCode: stationCode})

        if (!metro) {
            return response.notFound(res, `找不到捷運站${stationCode}`);
        }

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

        await redisClient.set(key, JSON.stringify(foundStore));

        return response.success(res, {
            stores: foundStore
        });


    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

router.get('/closeToStore', middleware.jwtAuth, dataValidation.metroCloseToStore, async (req, res) => {
    try {
        const storeId = req.query.storeId;
        const maxDistance = req.query.maxDistance ? req.query.maxDistance : 2000; //meter

        const key = `metro:metroNearStore:${storeId}`

        let cachedData = await redisClient.get(key);

        if (cachedData) {
            return response.success(res, {
                stations: JSON.parse(cachedData)
            });
        }

        const foundStore = await Store.findById(storeId);
        if (!foundStore) {
            return response.notFound(res, `找不到捷運站${stationCode}`);
        }

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

        await redisClient.set(key, JSON.stringify(result));

        return response.success(res, {stations: result});


    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

module.exports = router