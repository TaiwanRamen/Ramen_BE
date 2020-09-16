const mongoose = require("mongoose");
const notificationSchema = mongoose.Schema({
    storeId: String,
    storeName: String,
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);