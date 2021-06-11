const mongoose = require("mongoose"),
    User = require('./user'),
    Store = require('./store')

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: "Please provide a rating (1-5 stars).",
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "{VALUE} is not an integer value."
        }
    },
    text: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    }
}, {timestamps: true});

module.exports = mongoose.model("Review", reviewSchema);