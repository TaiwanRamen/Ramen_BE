const storeRepository = require('../repository/store.repository'),
    userService = require('../service/user.service'),
    log = require('../modules/logger'),
    Store = require('../models/store'),
    mongoose = require('mongoose');


const storeService = {}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

storeService.getStoresWithSearchAndPagination = async (search, page) => {
    try {
        if (search) {
            const regex = new RegExp(escapeRegex(search), 'gi');

            const allStores = await storeRepository.getStoresWithSearchAndPagination(regex, page)

            const count = await storeRepository.countStoresWithRegex();

            return {allStores, count, search}
        } else {

            const allStores = await storeRepository.getStoresWithSearchAndPagination(null, page)

            const count = await Store.countDocuments().exec();
            return {allStores, count, search: false}
        }
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

storeService.getStoreDetailById = async (storeId) => {
    try {
        let store = await storeRepository.getStoreDetailById(storeId, null);
        return store[0];
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}
storeService.getCommentsWithPagination = async (storeId, page) => {
    try {
        const commentData = await storeRepository.getCommentsWithPagination(storeId, page);
        const count = await storeRepository.getCommentCount(storeId);
        const comments = []
        if (commentData) {
            for await (const comment of commentData) {
                const author = await userService.getFilteredUserById(comment.authorId);
                comments.push({
                    _id: comment._id,
                    createdAt: comment.createdAt,
                    rating: comment.rating,
                    text: comment.text,
                    author: author
                })
            }
        }

        return {comments, count}

    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

storeService.getReviewsWithPagination = async (storeId, page) => {

}
storeService.isUserFollowing = async (userId, storeId) => {
    try {
        const storeRelation = await storeRepository.findOneRelation(storeId)
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
storeService.addStoreComment = async (storeId, commentId, session) => {
    try {
        return storeRepository.addStoreComment(storeId, commentId, session)
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

storeService.removeStoreComment = async (storeId, commentId, session) => {
    try {
        return storeRepository.removeStoreComment(storeId, commentId, session)
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}

storeService.addStoreReview = async (storeId, reviewId, session) => {
    try {
        return storeRepository.addStoreReview(storeId, reviewId, session)
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}


storeService.removeStoreReview = async (storeId, reviewId, session) => {
    try {
        return storeRepository.removeStoreReview(storeId, reviewId, session)
    } catch (error) {
        log.error(error)
        throw new Error()
    }
}


storeService.userFollowStore = async (userId, storeId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await storeRepository.addStoreFollower(userId, storeId, session);

        await userService.addUserFollowedStores(userId, storeId, session);

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        log.error(error)
        throw new Error()
    }
}

storeService.userUnFollowStore = async (userId, storeId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await storeRepository.removeStoreFollower(userId, storeId, session);

        await userService.removeUserFollowedStores(userId, storeId, session);

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        log.error(error)
        throw new Error()
    }
}

storeService.deleteStore = async (storeId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const store = await storeRepository.getStoreDetailById(storeId, session);
        const storeRelations = store[0].storeRelations;
        console.log(storeRelations)


        if (!store || !storeRelations) {
            throw new Error("店家不存在");
        }

        const reviewService = require('../service/review.service');
        const commentService = require('../service/comment.service');

        await reviewService.deleteMany(storeRelations.reviews, session);

        await commentService.deleteMany(storeRelations.comments, session);

        await storeRepository.deleteOne(storeId, session);

        await session.commitTransaction();
        session.endSession()

    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        log.error(error)
        throw new Error()
    }
}


module.exports = storeService;