const pagination = require('../utils/pagination'),
    Review = require('../models/review'),
    mongoose = require('mongoose');


const reviewRepository = {}

reviewRepository.deleteMany = async (reviews, session) => {
    return Review.deleteMany({
        "_id": {
            $in: reviews
        }
    }, {session: session})
}
module.exports = reviewRepository