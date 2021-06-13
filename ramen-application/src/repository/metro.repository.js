const Metro = require("../models/metro");

const metroRepository = {}

metroRepository.findOne = async (city, stationCode) => {
    return Metro.findOne({city, stationCode})
}

metroRepository.getMetrosByDistance = async (coordinates, maxDistance) => {
    return Metro.aggregate([
        {
            '$geoNear': {
                'near': {
                    'type': 'Point',
                    'coordinates': coordinates
                },
                'spherical': true,
                'distanceField': "distance",
                "distanceMultiplier": 0.001,
                'maxDistance': parseFloat(maxDistance)
            }
        },
        {$limit: 3}
    ]);
}
module.exports = metroRepository