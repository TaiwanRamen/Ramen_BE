const StoreRelation = require('../models/storeRelation');




const storeRelationRepository = {}

storeRelationRepository.findOne = async(storeId) => {
    return StoreRelation.findOne({'storeId': storeId});
}

module.exports = storeRelationRepository