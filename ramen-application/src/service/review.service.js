const reviewRepository = require('../repository/review.repository');

const reviewService = {}

reviewService.deleteMany = async (reviews, session) => {
    return reviewRepository.deleteMany(reviews, session);
}

module.exports = reviewService;