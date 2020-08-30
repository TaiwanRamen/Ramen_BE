const express = require('express');
//mergeParams: true是為了讓'/stores/:id/comments'裡面的:id可以被傳進來comment route，
//而不是只待在store route。
const router = express.Router({ mergeParams: true })
const Store = require('../models/store');
const Comment = require('../models/comment');
const middleware = require('../middleware') //will automaticlly include index.js

//comment create
router.get('/new', middleware.isLoggedIn, (req, res) => {
    //find store by id
    Store.findById(req.params.id, (err, store) => {
        if (err) {
            console.log(err)
        } else {
            //send to render

            console.log(store)
            res.render('comments/new', { store: store });
        }
    })

});
//comment create
router.post('/', middleware.isLoggedIn, (req, res) => {
    //lookup store using ID
    Store.findById(req.params.id, (err, store) => {
        if (err) {
            console.log(err);
            req.flash("error", "Store not found.")
            res.redirect("/stores")
        } else {
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    req.flash("error", "Something went wrong.");
                    console.log(err);
                } else {
                    //add username and id to comment
                    //console.log("created by " + req.user.username) // if the user is logged in, req.user must be valid
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save()

                    //associate comment with store
                    store.comments.push(comment);
                    //save comment in the store
                    store.save()
                    console.log(comment)
                    req.flash("success", "Successfully added comment");
                    res.redirect('/stores/' + store._id);
                }

            })
        }
        //create new Comment
        //connect new comment to store
        //redirect store show page
    });
});
//COMMENT EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    //to prevent sb from maliciously typing wrong store id and break our application, we need to
    //first check the id is valid, then check the comment_id is valid.
    Store.findById(req.params.id, (err, foundStore) => {
        if (err || !foundStore) {
            req.flash("error", "No Store find");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err) {
                res.redirect("back")
            } else {
                res.render("comments/edit", {
                    store_id: req.params.id,
                    comment: foundComment
                }) //之前在"/stores/:id/comments" route就有:id(store的)
            }
        });
    });
});
//COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    let data = req.body.comment;
    Comment.findByIdAndUpdate(req.params.comment_id, data, (err, updatedComment) => {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/stores/" + req.params.id);
        }
    });

})
//COMMENT DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted.");
            res.redirect("/stores/" + req.params.id);
        }
    })

})


module.exports = router