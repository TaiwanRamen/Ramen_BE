const express = require('express');
//mergeParams: true是為了讓'/menyas/:id/comments'裡面的:id可以被傳進來comment route，
//而不是只待在menya route。
const router = express.Router({ mergeParams: true })
const Menya = require('../models/menya');
const Comment = require('../models/comment');
const middleware = require('../middleware') //will automaticlly include index.js

//comment create
router.get('/new', middleware.isLoggedIn, (req, res) => {
    //find menya by id
    Menya.findById(req.params.id, (err, menya) => {
        if (err) {
            console.log(err)
        } else {
            //send to render

            console.log(menya)
            res.render('comments/new', { menya: menya });
        }
    })

});
//comment create
router.post('/', middleware.isLoggedIn, (req, res) => {
    //lookup menya using ID
    Menya.findById(req.params.id, (err, menya) => {
        if (err) {
            console.log(err);
            req.flash("error", "Menya not found.")
            res.redirect("/menyas")
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

                    //associate comment with menya
                    menya.comments.push(comment);
                    //save comment in the menya
                    menya.save()
                    console.log(comment)
                    req.flash("success", "Successfully added comment");
                    res.redirect('/menyas/' + menya._id);
                }

            })
        }
        //create new Comment
        //connect new comment to menya
        //redirect menya show page
    });
});
//COMMENT EDIT
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    //to prevent sb from maliciously typing wrong menya id and break our application, we need to
    //first check the id is valid, then check the comment_id is valid.
    Menya.findById(req.params.id, (err, foundMenya) => {
        if (err || !foundMenya) {
            req.flash("error", "No Menya find");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err) {
                res.redirect("back")
            } else {
                res.render("comments/edit", {
                    menya_id: req.params.id,
                    comment: foundComment
                }) //之前在"/menyas/:id/comments" route就有:id(menya的)
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
            res.redirect("/menyas/" + req.params.id);
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
            res.redirect("/menyas/" + req.params.id);
        }
    })

})


module.exports = router