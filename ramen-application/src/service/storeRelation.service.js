const storeRelationRepository = require('../repository/storeRelation.repository')

const storeRelationService = {}

storeRelationService.findOne = async (storeId) => {
    return await storeRelationRepository.findOne(storeId);
}



module.exports = storeRelationService;