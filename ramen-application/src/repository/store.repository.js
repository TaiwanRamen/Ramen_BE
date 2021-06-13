const pagination = require('../utils/pagination'),
    Store = require('../models/store'),
    StoreRelation = require('../models/storeRelation'),
    mongoose = require('mongoose');


const storeRepository = {}

storeRepository.findOneRelation = async (storeId) => {
    return StoreRelation.findOne({'storeId': storeId});
}

storeRepository.getStoresWithSearchAndPagination = async (regex, page) => {
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
    return Store.countDocuments({
        $or: [
            {name: regex},
            {city: regex},
            {descriptionText: regex},
        ],
    });
}

storeRepository.getStoreDetailById = async (storeId, session) => {
    if(session) {
        return Store.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(storeId)}},
            {$limit: 1},
            {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
            {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
        ]).session(session);
    } else{
        return Store.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(storeId)}},
            {$limit: 1},
            {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
            {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
        ]);
    }

}

storeRepository.addStoreFollower = async (userId, storeId, session) => {
    return StoreRelation.findOneAndUpdate(
        {'storeId': storeId},
        {$addToSet: {followers: new mongoose.Types.ObjectId(userId)}},
        {session: session}
    );
}

storeRepository.removeStoreFollower = async (userId, storeId, session) => {
    return StoreRelation.findOneAndUpdate(
        {'storeId': storeId},
        {$pull: {followers: new mongoose.Types.ObjectId(userId)}},
        {multi: false, session: session}
    );
}

storeRepository.deleteOne = async (storeId, session) => {
    await Store.findOneAndDelete({"_id": storeId}, {session: session})
    await StoreRelation.findOneAndDelete({"storeId": storeId}, {session: session})
}


module.exports = storeRepository