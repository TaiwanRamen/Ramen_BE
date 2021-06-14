const mongoose = require("mongoose");
const commentSchema = mongoose.Schema({
    text: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
}, {timestamps: true});

module.exports = mongoose.model("Comment", commentSchema);
