const mongoose = require('mongoose');
//Schema Setup
const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a store name'],
        unique: true,
    },
    imageLarge: [{
        type: String
    }],
    imageSmall: [{
        type: String
    }],
    region: {
        type: String
    },
    city: {
        type: String
    },
    descriptionHTML: {
        type: String
    },
    descriptionText: {
        type: String
    },
    address: String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        geoHash: String
    },
    rating: {
        type: Number,
        "default": 0,
        min: 0,
        max: 5
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }],
    createdAt: {type: Date, default: Date.now()},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    tags: [{
        type: String
    }],
    stillOpen: Boolean,
    openAt: String,
}, {timestamps: true});


module.exports = mongoose.model("Store", storeSchema);