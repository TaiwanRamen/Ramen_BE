//=== /api/v1/comments
const express = require('express'),
    mongoose = require('mongoose'),
    router = express.Router(),
    log = require('../../modules/logger'),
    Store = require('../../models/store'),
    User = require('../../models/user'),
    passport = require('passport'),
    passportJWT = passport.authenticate('jwt', {session: false}),
    dataValidation = require('../../middleware/dataValidate'),
    {startSession} = require('mongoose'),
    response = require('../../modules/response-message'),
    Comment = require('../../models/comment'),
    middleware = require('../../middleware');

router.get('/:storeId', middleware.jwtAuth, async (req, res) => {
    try {
        let perPage = 9;
        let pageQuery = parseInt(req.query.page);
        let pageNumber = pageQuery ? pageQuery : 1;

        let foundStore = await Store.findById(req.params.storeId).populate({
            path: "comments",
            options: {
                skip: (perPage * pageNumber) - perPage,
                limit: perPage,
                sort: {createdAt: -1}
            }
        }).exec();

        if (!foundStore) {
            return response.notFound(res, "無此店家")
        }

        const countComment = await Store.aggregate([
            {$match: {_id: new mongoose.Types.ObjectId(req.params.storeId)}},
            {$project: {count: {$size: '$comments'}}},
            {$limit: 1}
        ])

        const count = countComment[0]?.count;

        const comments = foundStore.comments;
        const data = []

        if (comments) {
            for await (const comment of comments) {
                const author = await User.findById(comment.authorId);
                data.push({
                    _id: comment._id,
                    createdAt: comment.createdAt,
                    rating: comment.rating,
                    text: comment.text,
                    author: {
                        avatar: author?.avatar,
                        id: author?._id,
                        username: author?.username ? author.username : author.fbName
                    }
                })
            }
        }
        return response.success(res, {
            comments: data,
            current: pageNumber,
            pages: Math.ceil(count / perPage),
        });
    } catch (err) {
        console.log(err)
        response.internalServerError(res, "無法顯示店家留言")
    }
})

router.put('/:commentId', middleware.jwtAuth, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const updatedComment = req.body?.comment;
        const comment = await Comment.findById(commentId);

        comment.text = updatedComment;

        await comment.save()

        response.success(res, "success");
    } catch (err) {
        response.internalServerError(res, "無法編輯留言")
    }

})

router.post('/new', middleware.jwtAuth, dataValidation.addComment,
    async (req, res) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const storeId = req.body?.storeId;
            const comment = req.body?.comment;

            console.log(req.body);

            const store = await Store.findById(storeId).session(session);

            if (!store) {
                response.notFound(res, "無此店家")
            }

            const newComment = await Comment.create({
                text: comment,
                authorId: req.user._id,
                storeId: storeId
            }).session(session);

            console.log(store.comments);
            store.connents = store.connents.push(newComment._id)
            await store.save().session(session)


            await session.commitTransaction();
            session.endSession();
            response.success(res, "success");
        } catch (err) {
            console.log(err)
            await session.abortTransaction();
            session.endSession();
            response.internalServerError(res, `無法新增留言`)
        }

    })


router.delete('/', middleware.jwtAuth, dataValidation.deleteComment,
    async (req, res) => {
    const session = await startSession();
    try {
        session.startTransaction();
        const commentId = req.query?.commentId;
        const storeId = req.query?.storeId;
        console.log(commentId)
        console.log(storeId)

        const store = await Store.findById(storeId);
        if (!store) {
            throw new Error("店家不存在");
        }

        await Comment.findByIdAndRemove(commentId);
        store.comments = store.comments.filter(item => item !== commentId);
        await store.save();

        await session.commitTransaction();
        session.endSession();
        response.success(res, "success");
    } catch (err) {
        await session.abortTransaction();
        response.internalServerError(res, `無法刪除留言: ${err.message}`)
    }
})


module.exports = router
