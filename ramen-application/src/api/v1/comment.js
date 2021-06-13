//=== /api/v1/comments
const express = require('express'),
    {body} = require('express-validator'),
    router = express.Router(),
    dataValidate = require('../../middleware/dataValidate'),
    response = require('../../modules/responseMessage'),
    commentService = require('../../service/comment.service'),
    middleware = require('../../middleware/checkAuth');


router.post('/', middleware.jwtAuth, body('comment').not().isEmpty().trim().escape(), dataValidate.addComment,
    async (req, res) => {
        try {
            const storeId = req.body?.storeId;
            const commentText = req.body?.comment;
            const userId = req.user._id;
            await commentService.addComment(storeId, commentText, userId)
            response.success(res, "success");
        } catch (err) {
            response.internalServerError(res, `無法新增留言`)
        }
    })


router.put('/', middleware.jwtAuth, middleware.isCommentOwner, body('comment').not().isEmpty().trim().escape(), dataValidate.editComment,
    async (req, res) => {
        try {

            const updatedComment = req.body?.comment;
            const comment = res.locals.foundComment;
            comment.text = updatedComment;
            await comment.save();
            response.success(res, "success");
        } catch (err) {
            response.internalServerError(res, "無法編輯留言")
        }

    })

router.delete('/', middleware.jwtAuth, middleware.isCommentOwner, dataValidate.deleteComment,
    async (req, res) => {
        try {
            const commentId = req.body?.commentId;
            const storeId = req.body?.storeId;
            await commentService.deleteComment(storeId, commentId)
            response.success(res, "success");
        } catch (err) {
            response.internalServerError(res, `無法刪除留言`)
        }
    })


module.exports = router
