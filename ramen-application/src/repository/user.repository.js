const User = require('../models/user'),
    mongoose = require('mongoose'),
    pagination = require('../utils/pagination')

const userRepository = {}

userRepository.getUserNotificationCount = async (userId) => {
    const userNotificationCount = await User.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(userId)}},
        {$lookup: {from: 'notifications', localField: 'notifications', foreignField: '_id', as: 'notiArr'}},
        {
            $project: {
                "count": {
                    "$size": {
                        "$filter": {
                            "input": "$notiArr",
                            "cond": {"$eq": ["$$this.isRead", false]}
                        }
                    }
                }
            }
        },
        {$limit: 1}
    ])
    return userNotificationCount[0]?.count;
}

userRepository.getUserNotifications = async (userId, page) => {
    const {perPage, pageNumber} = pagination(page)
    const user = await User.findById(userId).populate({
        path: 'notifications',
        options: {
            skip: (perPage * pageNumber) - perPage,
            limit: perPage,
            sort: {createdAt: -1}
        }
    })
    return user.notifications;
}

userRepository.getUserFollowedStores = async (userId, page) => {
    const {perPage, pageNumber} = pagination(page)
    const foundUser = await User.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(userId)}},
        {
            $lookup: {
                from: "stores",
                let: {"followedStore": "$followedStore"},
                pipeline: [
                    {$match: {$expr: {$in: ["$_id", "$$followedStore"]}}},
                    {$sort: {"updatedAt": -1}},
                    {$skip: (perPage * pageNumber) - perPage},
                    {$limit: perPage},
                    {
                        $lookup: {
                            "from": 'storerelations',
                            "localField": '_id',
                            "foreignField": 'storeId',
                            "as": 'storeRelations'
                        }
                    },
                    {$unwind: {path: "$storeRelations", preserveNullAndEmptyArrays: true}},
                    {$sort: {"updatedAt": -1}}
                ],
                as: "followedStore"
            }
        },
        {$project: {followedStore: 1}},
        {$limit: 1}
    ])
    return foundUser[0].followedStore;
}

userRepository.getUserFollowedStores = async (userId, page) => {
    const {perPage, pageNumber} = pagination(page)
    const foundUser = await User.aggregate([
        {$match: {_id: new mongoose.Types.ObjectId(userId)}},
        {
            $lookup: {
                from: "reviews",
                let: {"reviews": "$reviews"},
                pipeline: [
                    {$match: {$expr: {$in: ["$_id", "$$reviews"]}}},
                    {$sort: {"updatedAt": -1}},
                    {$skip: (perPage * pageNumber) - perPage},
                    {$limit: perPage},
                    {
                        $lookup: {
                            "from": 'stores',
                            "localField": 'store',
                            "foreignField": '_id',
                            "as": 'store'
                        }
                    },
                    {$unwind: {path: "$store", preserveNullAndEmptyArrays: true}},
                    {$sort: {"updatedAt": -1}}
                ],
                "as": "reviews"
            }
        },
        {$project: {reviews: 1}},
        {$limit: 1}
    ])
    return foundUser[0].reviews;
}


userRepository.addUserFollowedStores = async (userId, storeId, session) => {
    return User.findOneAndUpdate(
        {'_id': userId},
        {$addToSet: {followedStore: new mongoose.Types.ObjectId(storeId)}},
        {session: session}
    );
}

userRepository.removeUserFollowedStores = async (userId, storeId, session) => {
    return User.findOneAndUpdate(
        {'_id': userId},
        {$pull: {followedStore: new mongoose.Types.ObjectId(storeId)}},
        {multi: false, session: session}
    );
}



module.exports = userRepository;