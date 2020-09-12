const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        max: 64
    },
    email: {
        type: String,
        trim: true,
        sparse: true,
        lowercase: true
    },
    password: {
        type: String,
    },
    avatar: {
        type: String,
        required: true,
        default: 'https://imgur.com/ypEN9cK'
    },
    isActivated: {
        required: true,
        type: Boolean,
        default: false
    },
    isAdmin: {
        required: true,
        type: Boolean,
        default: false
    },
    uuid: {
        type: String,
        sparse: true
    },
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
    }],
    followedStore: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    uid: String,
    token: String,
    fbName: String


}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema);