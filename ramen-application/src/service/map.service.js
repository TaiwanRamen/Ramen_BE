const storeService = require('./store.service'),
    log = require('../modules/logger');


const mapService = {}

mapService.getStoresInMapBound = async (N, S, E, W, searchInput) => {
    try {
        const mapBound = {
            type: 'Polygon',
            coordinates: [
                [[W, N], [W, S], [E, S], [E, N], [W, N]]
            ]
        };
        const regex = searchInput ? new RegExp(escapeRegex(searchInput), 'gi') : null;
        return await storeService.getStoresInMapBound(mapBound, regex)
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

module.exports = mapService