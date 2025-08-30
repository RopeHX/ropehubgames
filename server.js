require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Game = require('./models/Game');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/minigame', { useNewUrlParser: true, useUnifiedTopology: true });

// Discord OAuth2 Keys
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// Discord Login starten
app.get('/auth/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

// Discord Callback
app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('No code provided');
    try {
        const data = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            scope: 'identify'
        });
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', data.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const accessToken = tokenRes.data.access_token;
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const user = userRes.data;
        // Redirect mit Username und Avatar-ID als URL-Parameter
        res.redirect(`/index.html?username=${encodeURIComponent(user.username)}&avatar=${user.id}/${user.avatar}`);
    } catch (err) {
        res.status(500).send('Discord Login fehlgeschlagen');
    }
});

// Create game
app.post('/api/game', async (req, res) => {
    const { host, password } = req.body;
    const gameId = uuidv4();
    let hashedPassword = '';
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }
    const game = new Game({
        gameId,
        password: hashedPassword,
        host,
        players: [],
        status: 'waiting',
        scores: {}
    });
    await game.save();
    res.json({ link: `/game/${gameId}` });
});

// Join game
app.post('/api/game/join', async (req, res) => {
    const { gameId, player, password } = req.body;
    const game = await Game.findOne({ gameId });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.password) {
        const match = await bcrypt.compare(password || '', game.password);
        if (!match) return res.status(401).json({ error: 'Wrong password' });
    }
    if (!game.players.includes(player)) {
        game.players.push(player);
        game.scores[player] = 0;
        await game.save();
    }
    res.json({ success: true });

    // Emit updated player list to all clients in the room
    io.to(gameId).emit('players-list', game.players);
});

// Socket.IO logic
io.on('connection', (socket) => {
    socket.on('join-room', ({ gameId, player }) => {
        socket.join(gameId);
        io.to(gameId).emit('player-joined', { player });

        // Send current player list to newly joined client
        if (games[gameId]) {
            socket.emit('players-list', games[gameId].players);
        }
    });

    socket.on('buzz', async ({ gameId, player }) => {
        // Only first buzz counts per round
        const buzzKey = `buzzed:${gameId}`;
        if (!io.sockets.adapter.rooms.get(buzzKey)) {
            io.sockets.adapter.rooms.set(buzzKey, player);
            io.to(gameId).emit('buzzed', { player });
        }
    });

    // ...other events (admin actions, etc.)...
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
