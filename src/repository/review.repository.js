const pagination = require('../utils/pagination'),
    Review = require('../models/review'),
    mongoose = require('mongoose');


const reviewRepository = {}

reviewRepository.addReview = async (review, session) => {
    return Review.create([review], {session: session});
}

reviewRepository.deleteReview = async (reviewId, session) => {
    return Review.findByIdAndRemove(reviewId).session(session);
}


reviewRepository.deleteMany = async (reviews, session) => {
    return Review.deleteMany({
        "_id": {
            $in: reviews
        }
    }, {session: session})
}
module.exports = reviewRepository