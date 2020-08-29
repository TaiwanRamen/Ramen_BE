const mongoose = require("mongoose");
const commentSchema = mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now() },
    author: {
        //comments object ids
        //ref: model refer to user   
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment