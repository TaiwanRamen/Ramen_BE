const mongoose = require('mongoose');
//Schema Setup
const metroSchema = new mongoose.Schema({
    stationCode: {
        type: String,
        required: [true, 'Please add a store name'],
        unique: true,
    },
    name: {
        type: String,
    },
    nameEn: {
        type: String,
    },
    city: {
        type: String
    },
    lineCode: [{
        type: String
    }],
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
});

module.exports = mongoose.model("Metro", metroSchema);