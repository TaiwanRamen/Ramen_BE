//========  /api/vi/metro

const express = require('express'),
    router = express.Router(),
    middleware = require('../../middleware/checkAuth'),
    dataValidate = require('../../middleware/dataValidate'),
    response = require('../../modules/responseMessage'),
    log = require('../../modules/logger'),
    metroService = require('../../service/metro.service')


router.get('/getStoresNearMetro', middleware.jwtAuth, dataValidate.getStoresNearMetro, async (req, res) => {
    try {
        const stationCode = req.query.stationCode;
        const city = req.query.city;
        let maxDistance = req.query.maxDistance ? req.query.maxDistance : 2000; //meter
        const foundStore =  await metroService.getStoresNearMetro(city, stationCode, maxDistance)
        return response.success(res, {
            stores: foundStore
        });
    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

router.get('/getMetroCloseToStore', middleware.jwtAuth, dataValidate.metroCloseToStore, async (req, res) => {
    try {
        const storeId = req.query.storeId;
        const maxDistance = req.query.maxDistance ? req.query.maxDistance : 2000; //meter

        const stations =  await metroService.getMetroCloseToStore(storeId, maxDistance)

        return response.success(res, {
            stations: stations
        });


    } catch (err) {
        log.error(err);
        return response.internalServerError(res, err.message);
    }
});

module.exports = router