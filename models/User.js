const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: String, unique: true }, // internal ID
    discordId: { type: String, unique: true }, // Discord user ID
    username: String,
    avatar: String, // Discord avatar hash
    platform: { type: String, enum: ['discord'], default: 'discord' },
    permissions: { type: String, enum: ['admin', 'normal'], default: 'normal' }
});

module.exports = mongoose.model('User', UserSchema);
