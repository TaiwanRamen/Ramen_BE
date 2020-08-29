//all the middle goes here
const Menya = require('../models/menya');
const Comment = require('../models/comment');
const User = require('../models/user');


const middlewareObj = {}

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {

        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err || !foundComment) {
                req.flash("error_msg", "Comment not found");
                res.redirect("back");
            } else {
                //if logged in, is he owned the menya
                //foundMenya.autho.id is a mongoose object
                //req.user._id is a string
                //even if they looks the same, they are essentially different,
                // so we have to use mongoose method .equals()
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error_msg", "You don't have permission to do that.");
                    res.redirect("back")
                }

            }
        });
    } else {
        res.redirect("back"); //send to where the user originally from.
    }
}


middlewareObj.checkMenyaOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {

        Menya.findById(req.params.id, (err, foundMenya) => {
            if (err || !foundMenya) {
                req.flash("error_msg", "Menya not found");
                res.redirect("back");
            } else {
                //if logged in, is he owned the menya
                //foundMenya.autho.id is a mongoose object
                //req.user._id is a string
                //even if they looks the same, they are essentially different,
                // so we have to use mongoose method .equals()
                if (foundMenya.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error_msg", "You don't have permission to do that.");
                    res.redirect("back")
                }

            }
        });
    } else {
        req.flash("error_msg", "You need to be logged in to do that.");
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
                req.flash("error_msg", "You are not the correct user, please log in !");
                res.redirect("/users/login")
            }

        } catch (error) {
            console.log(error)
            req.flash('error_msg', 'You are not the correct user, please log in!')
            res.redirect("/users/login");
        }

    } else {
        req.flash("error_msg", "You need to be logged in to do that.");
        res.redirect("/users/login"); //send to where the user originally from.
    }

};



middlewareObj.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error_msg", "使用者必須登入才能檢視內容。");
    res.redirect("/");
}
module.exports = middlewareObj;