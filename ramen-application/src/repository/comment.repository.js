const pagination = require('../utils/pagination'),
    Comment = require('../models/comment'),
    mongoose = require('mongoose');


const commentRepository = {}

commentRepository.deleteMany = async (comments, session) => {
    return Comment.deleteMany({
        "_id": {
            $in: comments
        }
    }, {session: session})
}
module.exports = commentRepository