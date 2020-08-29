const mongoose = require('mongoose');
//Schema Setup
const menyaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please ass a store ID'], //error message
        unique: true,
    },
    image: String,
    description: String,
    address: String,
    price: String,
    location: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
        },
        coordinates: {
            type: [Number],
            index: '2dsphere'
        },
        formattedAddress: String
    },
    createdAt: { type: Date, default: Date.now() },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    //comments object ids
    //ref: model refer to 
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});

const Menya = mongoose.model("Menya", menyaSchema);

module.exports = Menya