const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    gameId: { type: String, unique: true },
    password: { type: String },
    host: { type: String },
    players: [String],
    status: { type: String, enum: ['waiting', 'active', 'finished'], default: 'waiting' },
    scores: { type: Object }
});

module.exports = mongoose.model('Game', GameSchema);
