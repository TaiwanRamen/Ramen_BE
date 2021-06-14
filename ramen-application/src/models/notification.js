const mongoose = require("mongoose");
const notificationSchema = mongoose.Schema({
    storeId: String,
    storeName: String,
    isRead: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

module.exports = mongoose.model("Notification", notificationSchema);