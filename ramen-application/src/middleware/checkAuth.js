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

middlewareObj.checkCommentOwnership = async (req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            let foundComment = await Comment.findById(req.params.comment_id);
            if (!foundComment) {
                req.flash("error_msg", "留言不存在");
                res.redirect("back");
            } else {
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error_msg", "您並沒有權限執行此操作。如果您認為這是個錯誤，請聯絡網站管理員mepowenlin@gmail.com");
                    res.redirect("back")
                }
            }
        }
    } catch (error) {
        log.error(error);
        req.flash("error_msg")
        res.redirect("back");
    }


    if (req.isAuthenticated()) {

        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err || !foundComment) {
                req.flash("error_msg", "留言不存在");
                res.redirect("back");
            } else {
                //if logged in, is he owned the store
                //foundStore.autho.id is a mongoose object
                //req.user._id is a string
                //even if they looks the same, they are essentially different,
                // so we have to use mongoose method .equals()
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error_msg", "您並沒有權限執行此操作。如果您認為這是個錯誤，請聯絡網站管理員mepowenlin@gmail.com");
                    res.redirect("back")
                }

            }
        });
    } else {
        res.redirect("back"); //send to where the user originally from.
    }
}


middlewareObj.checkStoreOwnership = async function (req, res, next) {
    if (req.isAuthenticated()) {
        let foundUser = await User.findById(req.user._id);

        const foundStore = await Store.findById(req.params.id, (err, foundStore) => {
            if (err || !foundStore) {
                req.flash("error_msg", "店家不存在");
                res.redirect("back");
            } else {
                if (foundUser.userRole == userRole.ADMIN || (foundUser.userRole == userRole.STORE_OWNER && foundStore.author.id.equals(req.user._id))) {
                    next();
                } else {
                    req.flash("error_msg", "您並沒有權限執行此操作。如果您認為這是個錯誤，請聯絡網站管理員mepowenlin@gmail.com");
                    res.redirect("back")
                }

            }
        });
    } else {
        req.flash("error_msg", "使用者必須登入才能檢視內容");
        res.redirect("back"); //send to where the user originally from.
    }

};


middlewareObj.checkUserOwnership = async (req, res, next) => {
    if (req.isAuthenticated()) {
        try {
            let foundUser = await User.findById(req.params.id)
            if (foundUser._id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error_msg", "您並非正確的使用者，請登入");
                res.redirect("/")
            }

        } catch (error) {
            console.log(error)
            req.flash('error_msg', '您並非正確的使用者，請登入')
            res.redirect("/");
        }

    } else {
        req.flash("error_msg", "使用者必須登入才能檢視內容");
        res.redirect("/"); //send to where the user originally from.
    }

};


middlewareObj.checkReviewOwnership = async (req, res, next) => {
    try {
        if (req.isAuthenticated()) {
            let foundReview = await Review.findById(req.params.review_id);
            if (!foundReview) res.redirect("back");

            if (foundReview.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error_msg", "您並沒有權限執行此操作。如果您認為這是個錯誤，請聯絡網站管理員mepowenlin@gmail.com");
                res.redirect("back");
            }
        } else {
            req.flash("error_msg", "使用者必須登入才能檢視內容");
            res.redirect("back");
        }
    } catch (error) {
        log.error(error);
        res.redirect("back");
    }
};

middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Store.findById(req.params.id).populate("reviews").exec(function (err, foundStore) {
            if (err || !foundStore) {
                req.flash("error_msg", "店家不存在");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundStore.reviews
                var foundUserReview = foundStore.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error_msg", "您已經填寫過評論了");
                    return res.redirect("/stores/" + foundStore._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error_msg", "使用者必須登入才能檢視內容");
        res.redirect("back");
    }
};


middlewareObj.jwtAuth = async (req, res, next) => {
    passport.authenticate('jwt',
        {session: false, failWithError: true},
        (err, user, info) => {
            if (err) return next(err);
            if (user) {
                req.user = user;
                next();
            } else {
                response.unAuthorized(res, "無法執行此動作，使用者未登入或是登入超時，請重新登入")
            }
        })(req, res, next);
}

middlewareObj.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        response.unAuthorized(res, "使用者必須登入才能檢視內容");
    }
}

middlewareObj.isAdmin = async (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.userRole !== userRole.ADMIN) response.forbidden(res, "使用者非管理員，無法進行此操作！")
        next();
    } else {
        response.unAuthorized(res, "使用者必須登入才能檢視內容")
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
            response.forbidden(res, "使用者非店家管理者");
        }
    } else {
        response.unAuthorized(res, "使用者必須登入才能檢視內容");
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

        console.log(foundReview)
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