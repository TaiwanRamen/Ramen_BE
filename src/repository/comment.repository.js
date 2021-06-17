const pagination = require('../utils/pagination'),
    Comment = require('../models/comment'),
    mongoose = require('mongoose');


const commentRepository = {}

commentRepository.addComment = async (comment, session) => {
    return await Comment.create([comment], {session: session});
}

commentRepository.deleteComment = async (commentId, session) => {
    return Comment.findByIdAndRemove(commentId).session(session);
}

commentRepository.deleteMany = async (comments, session) => {
    return Comment.deleteMany({
        "_id": {
            $in: comments
        }
    }, {session: session})
}
module.exports = commentRepository