var express = require("express");
var router = express.Router({ mergeParams: true });
var Store = require("../models/store");
var Review = require("../models/review");
var middleware = require("../middleware");

router.get("/", function(req, res) {
    Store.findById(req.params.id).populate({
        path: "reviews",
        options: { sort: { createdAt: -1 } } // sorting the populated reviews array to show the latest first
    }).exec(function(err, store) {
        if (err || !store) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", { store: store });
    });
});
// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the store, only one review per user is allowed
    Store.findById(req.params.id, function(err, store) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", { store: store });

    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res) {
    //lookup store using ID
    Store.findById(req.params.id).populate("reviews").exec(function(err, store) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function(err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated store to the review
            review.author.id = req.user._id;
            if (req.user.fbName) {
                review.author.username = req.user.fbName;
            } else {
                review.author.username = req.user.username;
            }
            review.author.avatar = req.user.avatar;
            review.store = store;
            //save review
            review.save();
            store.reviews.push(review);
            // calculate the new average review for the store
            store.rating = calculateAverage(store.reviews);
            //save store
            store.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/stores/' + store._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function(req, res) {
    Store.findById(req.params.id, (err, foundStore) => {
        if (err || !foundStore) {
            req.flash("error", "No Store find");
            return res.redirect("back");
        }
    })
    Review.findById(req.params.review_id, function(err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", { store_id: req.params.id, review: foundReview });
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function(req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, { new: true }, function(err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Store.findById(req.params.id).populate("reviews").exec(function(err, store) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate store average
            store.rating = calculateAverage(store.reviews);
            //save changes
            store.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/stores/' + store._id);
        });
    });
});
// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function(req, res) {
    Review.findByIdAndRemove(req.params.review_id, function(err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Store.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.review_id } }, { new: true }).populate("reviews").exec(function(err, store) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate store average
            store.rating = calculateAverage(store.reviews);
            //save changes
            store.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/stores/" + req.params.id);
        });
    });
});


function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function(element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;