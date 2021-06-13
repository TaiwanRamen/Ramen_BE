const    commentRepository = require('../repository/comment.repository'),
    log = require('../modules/logger');

const commentService = {}


commentService.deleteMany = async (comments, session) => {
    return commentRepository.deleteMany(comments, session);
}

module.exports = commentService;