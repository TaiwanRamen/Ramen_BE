const mongoose = require("mongoose"),
    userRole = require("../enums/user-role");

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
    isEmailVerified: {
        required: true,
        type: Boolean,
        default: false
    },
    userRole: {
        required: true,
        type: Number,
        default: userRole.END_USER
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
    fbUid: String,
    fbToken: String,
    fbName: String
}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema);