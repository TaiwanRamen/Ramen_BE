const express = require('express'),
    router = express.Router(),
    log = require('../../modules/logger'),
    middleware = require('../../middleware/checkAuth'),
    dataValidate = require('../../middleware/dataValidate'),
    response = require("../../modules/responseMessage"),
    mapService = require('../../service/map.service');

router.get('/getStoresInMapBound', middleware.jwtAuth, dataValidate.getStoresInMapBound,  async (req, res) => {
    try {
        const N = parseFloat(req.query.N);
        const S = parseFloat(req.query.S);
        const E = parseFloat(req.query.E);
        const W = parseFloat(req.query.W);
        const searchInput = req.query.search;

        const foundStores = await mapService.getStoresInMapBound(N, S, E, W, searchInput);
        response.success(res, foundStores);
    } catch (err) {
        log.info(err)
        response.notFound(res, err.message);
    }
})



module.exports = router