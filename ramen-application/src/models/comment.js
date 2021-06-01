const mongoose = require("mongoose");
const commentSchema = mongoose.Schema({
    text: String,
    createdAt: {type: Date, default: Date.now()},
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment