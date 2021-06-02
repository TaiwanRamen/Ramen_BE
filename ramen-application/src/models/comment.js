const mongoose = require("mongoose");
const commentSchema = mongoose.Schema({
    text: String,
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
}, {timestamps: true});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment