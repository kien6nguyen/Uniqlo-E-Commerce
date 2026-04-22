const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sender: {
        type: String, // 'user' or 'admin'
        required: true
    },
    userId: {
        type: String, // Socket ID or User ID if logged in
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
