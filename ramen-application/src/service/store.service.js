const storeRepository = require('../repository/store.repository'),
    storeRelationService = require('../service/storeRelation.service'),
    log = require('../modules/logger'),
    Store = require('../models/store')


const storeService = {}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

storeService.getStores = async (search, page) => {
    try {
        if (search) {
            const regex = new RegExp(escapeRegex(search), 'gi');

            const allStores = await storeRepository.getStores(regex, page)

            const count = await storeRepository.countStoresWithRegex();

            return {allStores, count, search}
        } else {

            const allStores = await storeRepository.getStores(null, page)

            const count = await Store.countDocuments().exec();
            return {allStores, count, search: false}
        }
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

storeService.getStoreById = async (storeId) => {
    try {
        let store = await storeRepository.getStoreById(storeId);
        return store[0];
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

storeService.isUserFollowing = async (userId, storeId) => {
    try {
        const storeRelation = await storeRelationService.findOne(storeId)
        let isUserFollowing = false;
        if (storeRelation?.followers) {
            isUserFollowing = storeRelation.followers.includes(userId);
        }
        return isUserFollowing;
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}


storeService.isUserFollowing = async (userId, storeId) => {
    try {
        const storeRelation = await storeRelationService.findOne(storeId)
        let isUserFollowing = false;
        if (storeRelation?.followers) {
            isUserFollowing = storeRelation.followers.includes(userId);
        }
        return isUserFollowing;
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}


module.exports = storeService