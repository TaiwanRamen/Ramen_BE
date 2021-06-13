const pagination = require('../utils/pagination'),
    Store = require('../models/store'),
    mongoose = require('mongoose');



const storeRepository = {}

storeRepository.getStores = async (regex, page) => {
    const {perPage, pageNumber} = pagination(page)
    const pipeline = [
        {$sort: {rating: -1, city: 1}},
        {$skip: (perPage * pageNumber) - perPage},
        {$limit: perPage},
        {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
        {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
    ]
    if (regex) {
        pipeline.unshift({$match: {$or: [{name: regex}, {city: regex}, {descriptionText: regex}]}})
    }
    return Store.aggregate(pipeline);
}

storeRepository.countStoresWithRegex = async (regex) => {
    return  Store.countDocuments({
        $or: [
            {name: regex},
            {city: regex},
            {descriptionText: regex},
        ],
    });
}

storeRepository.getStoreById = async (storeId) => {
    return Store.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(storeId)}},
        {$limit: 1},
        {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
        {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
    ]);
}



module.exports = storeRepository