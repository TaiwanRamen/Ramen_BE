const pagination = require('../utils/pagination'),
    Store = require('../models/store'),
    StoreRelation = require('../models/storeRelation'),
    mongoose = require('mongoose');


const storeRepository = {}

storeRepository.findOneRelation = async (storeId) => {
    return StoreRelation.findOne({'storeId': storeId});
}
module.exports = storeRepository