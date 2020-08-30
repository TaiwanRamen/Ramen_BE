const mongoose = require("mongoose");
const notificationSchema = mongoose.Schema({
    username: String,
    storeId: String,
    isRead: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Notification", notificationSchema);