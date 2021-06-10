//all the middle goes here
const Store = require('../models/store');
const Comment = require('../models/comment');
const User = require('../models/user');
const Review = require("../models/review");
const userRole = require("../enums/user-role");
const log = require('../modules/logger');
const response = require('../modules/responseMessage');
passport = require('passport');

const middlewareObj = {}

middlewareObj.jwtAuth = async (req, res, next) => {
    passport.authenticate('jwt',
        {session: false, failWithError: true},
        (err, user, info) => {
            if (err) return next(err);
            if (user) {
                req.user = user;
                next();
            } else {
               return response.unAuthorized(res, "無法執行此動作，使用者未登入或是登入超時，請重新登入")
            }
        })(req, res, next);
}

middlewareObj.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        return response.unAuthorized(res, "使用者必須登入才能檢視內容");
    }
}

middlewareObj.isAdmin = async (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.userRole !== userRole.ADMIN) return response.forbidden(res, "使用者非管理員，無法進行此操作！")
        next();
    } else {
        return response.unAuthorized(res, "使用者必須登入才能檢視內容")
    }
}


middlewareObj.isStoreOwner = async (req, res, next) => {
    if (req.isAuthenticated()) {
        let foundUser = await User.findById(req.user._id);
        let foundStore = await Store.findById(req.params.id);
        if (foundStore) response.notFound(res, "找不到店家")

        if (foundUser.userRole === userRole.ADMIN || (foundUser.userRole === userRole.STORE_OWNER && foundStore.owners.contains(req.user._id))) {
            next();
        } else {
            return response.forbidden(res, "使用者非店家管理者");
        }
    } else {
        return response.unAuthorized(res, "使用者必須登入才能檢視內容");
    }
};


middlewareObj.isCommentOwner = async (req, res, next) => {
    if (req.isAuthenticated()) {
        const commentId = req.body?.commentId;
        let foundComment = await Comment.findById(commentId);
        if (!foundComment) return response.notFound(res, "找不到留言")

        if (req.user._id.equals(foundComment.authorId)) {
            res.locals.foundComment = foundComment;
            next()
        } else {
            return response.forbidden(res, "使用者非留言擁有者");
        }

    } else {
        return response.unAuthorized(res, "使用者必須登入才能檢視內容");
    }
};


middlewareObj.isReviewOwner = async (req, res, next) => {
    if (req.isAuthenticated()) {
        const reviewId = req.body?.reviewId;
        let foundReview = await Review.findById(reviewId);
        if (!foundReview) return response.notFound(res, "找不到評論")

        if (req.user._id.equals(foundReview.author)) {
            res.locals.foundReview = foundReview;
            next()
        } else {
            return response.forbidden(res, "使用者非評論擁有者");
        }

    } else {
        return response.unAuthorized(res, "使用者必須登入才能檢視內容");
    }
};


module.exports = middlewareObj;