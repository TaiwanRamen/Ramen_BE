const redisClient = require('../db/connectRedis'),
    storeService = require('./store.service'),
    metroRepository = require('../repository/metro.repository'),
    log = require('../modules/logger');
const metroService = {}

metroService.getStoresNearMetro = async (city, stationCode, maxDistance) => {
    try {
        const key = `metro:storesNearMetro:${city}-${stationCode}`
        let cachedData = await redisClient.get(key);

        if (cachedData) {
            return JSON.parse(cachedData)
        }

        let metro = await metroRepository.findOne(city, stationCode)

        if (!metro) {
            throw new Error(`找不到捷運站${stationCode}`);
        }

        const metroCoords = metro.location.coordinates;
        const foundStore = await storeService.getStoresByDistance(metroCoords, maxDistance)

        await redisClient.set(key, JSON.stringify(foundStore));
        return foundStore

    } catch (err) {
        log.error(err)
        throw new Error();
    }
}


metroService.getMetroCloseToStore = async (storeId, maxDistance) => {
    try {
        const key = `metro:metroNearStore:${storeId}`
        let cachedData = await redisClient.get(key);

        if (cachedData) {
            return JSON.parse(cachedData)
        }

        const foundStore = await storeService.getStoreById(storeId);

        if (!foundStore) {
            throw new Error(`找不到店家${storeId}`)
        }

        const storeCoords = foundStore.location.coordinates;

        let foundStations = await metroRepository.getMetrosByDistance(storeCoords, maxDistance)

        const resultStations = foundStations.map(station => {
            return {
                city: station.city,
                name: station.name,
                lineCode: station.lineCode,
                distance: station.distance.toFixed(2)
            }
        })
        await redisClient.set(key, JSON.stringify(resultStations));
        return resultStations;

    } catch (err) {
        log.error(err)
        throw new Error();
    }
}

module.exports = metroService