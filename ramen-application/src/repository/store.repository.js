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

storeRepository.getCommentsWithPagination = async (storeId, page) => {
    const {perPage, pageNumber} = pagination(page)
    const foundStoreRelation = await StoreRelation.findOne({'storeId': storeId}).populate({
        path: "comments",
        options: {
            skip: (perPage * pageNumber) - perPage,
            limit: perPage,
            sort: {createdAt: -1}
        }
    })
    return foundStoreRelation?.comments
}

storeRepository.getCommentCount = async (storeId) => {
    const countComment = await StoreRelation.aggregate([
        {$match: {storeId: new mongoose.Types.ObjectId(storeId)}},
        {$project: {count: {$size: '$comments'}}},
        {$limit: 1}
    ])
    return countComment[0]?.count;
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
    if (session) {
        return Store.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(storeId)}},
            {$limit: 1},
            {$lookup: {from: 'storerelations', localField: '_id', foreignField: 'storeId', as: 'storeRelations'}},
            {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}}
        ]).session(session);
    } else {
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

storeRepository.addStoreReview = async (storeId, reviewId, session) => {
    return StoreRelation.findOneAndUpdate(
        {'storeId': storeId},
        {$addToSet: {reviews: new mongoose.Types.ObjectId(reviewId)}},
        {session: session}
    );
}

storeRepository.removeStoreReview = async (storeId, reviewId, session) => {
    return StoreRelation.findOneAndUpdate(
        {'storeId': storeId},
        {$pull: {reviews: new mongoose.Types.ObjectId(reviewId)}},
        {multi: false, session: session}
    );
}


storeRepository.addStoreComment = async (storeId, commentId, session) => {
    return StoreRelation.findOneAndUpdate(
        {'storeId': storeId},
        {$addToSet: {comments: new mongoose.Types.ObjectId(commentId)}},
        {session: session}
    );
}

storeRepository.removeStoreComment = async (storeId, commentId, session) => {
    return StoreRelation.findOneAndUpdate(
        {'storeId': storeId},
        {$pull: {comments: new mongoose.Types.ObjectId(commentId)}},
        {multi: false, session: session}
    );
}

storeRepository.deleteOne = async (storeId, session) => {
    await Store.findOneAndDelete({"_id": storeId}, {session: session})
    await StoreRelation.findOneAndDelete({"storeId": storeId}, {session: session})
}


module.exports = storeRepository