const reviewRepository = require('../repository/review.repository'),
    userService = require('./user.service'),
    storeService = require('./store.service'),
    log = require('../modules/logger'),
    mongoose = require('mongoose');


const reviewService = {}

reviewService.getUserReviewForStore = async (user, storeId) => {
    try {
        const userId = user._id;
        let reviews = await userService.getUserReviews(userId);
        let userReview = reviews.find(review => review.store.equals(storeId));
        if (!userReview || userReview.length < 1) {
            return null
        }
        userReview = JSON.parse(JSON.stringify(userReview));
        userReview.author = {_id: user._id, avatar: user.avatar, username: user.username};

        return userReview;
    } catch (err) {
        log.error(err)
        throw new Error();
    }
}
reviewService.addReview = async (storeId, userId, review, rating) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const newReview = await reviewRepository.addReview({
            rating: rating,
            text: review,
            author: userId,
            store: storeId
        }, session)


        const newReviewId = newReview[0]._id;
        const storeRelation = await storeService.addStoreReview(storeId, newReviewId, session)
        const user = await userService.addUserReview(userId, newReviewId, session)

        if (!storeRelation || !user) {
            throw new Error("store or user not found")
        }
        await storeService.changeStoreRating(storeId, session);

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        log.error(err)
        await session.abortTransaction();
        session.endSession();
        throw new Error();
    }
}

reviewService.updateReview = async (review, text, rating, storeId) => {

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        review.text = text;
        review.rating = rating;
        await review.save({session: session});

        await storeService.changeStoreRating(storeId, session);

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        log.error(err)
        await session.abortTransaction();
        session.endSession();
        throw new Error();
    }

}

reviewService.deleteReview = async (storeId, reviewId, userId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await reviewRepository.deleteReview(reviewId, session)
        const storeRelation = await storeService.removeStoreReview(storeId, reviewId, session)
        const user = await userService.removeUserReview(userId, reviewId, session)

        if (!storeRelation || !user) {
            throw new Error("store or user not found")
        }
        await storeService.changeStoreRating(storeId, session);

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        log.error(err)
        await session.abortTransaction();
        session.endSession();
        throw new Error();
    }
}

reviewService.deleteMany = async (reviews, session) => {
    return reviewRepository.deleteMany(reviews, session);
}


module.exports = reviewService;