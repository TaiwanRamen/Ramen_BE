const commentRepository = require('../repository/comment.repository'),
    log = require('../modules/logger'),
    storeService = require('../service/store.service'),

    mongoose = require('mongoose');

const commentService = {}

commentService.addComment = async (storeId, commentText, userId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const newComment = await commentRepository.addComment({
            text: commentText,
            author: userId,
            store: storeId
        }, session);

        const newCommentId = newComment[0]._id;


        const storeRelation = await storeService.addStoreComment(storeId, newCommentId, session);

        if (!storeRelation) {
            throw new Error("店家不存在")
        }

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        log.error(err)
        await session.abortTransaction();
        session.endSession();
        throw new Error();
    }
}


commentService.deleteComment = async (storeId, commentId) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        await commentRepository.deleteComment(commentId, session);

        const storeRelation = await storeService.removeStoreComment(storeId, commentId, session);

        if (!storeRelation) {
            throw new Error("店家不存在")
        }

        await session.commitTransaction();
        session.endSession();
    } catch (err) {
        log.error(err)
        await session.abortTransaction();
        session.endSession();
        throw new Error();
    }
}

commentService.deleteMany = async (comments, session) => {
    return commentRepository.deleteMany(comments, session);
}

module.exports = commentService;