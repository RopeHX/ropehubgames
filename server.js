require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(cookieParser());
app.use(express.static('public'));

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
    if (!code) {
        console.error('Discord OAuth: Kein Code erhalten!');
        return res.send('Kein Code von Discord erhalten!');
    }
    try {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const tokenData = tokenResponse.data;
        if (!tokenData.access_token) {
            console.error('Discord OAuth: Kein Access Token erhalten!', tokenData);
            return res.send('Fehler beim Token-Abruf!');
        }

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const user = userResponse.data;
        if (!user || !user.id) {
            console.error('Discord OAuth: Keine Userdaten erhalten!', user);
            return res.send('Fehler beim Userdaten-Abruf!');
        }

        // Session als Cookie speichern
        res.cookie('discord_user', JSON.stringify({
            id: user.id,
            username: user.username,
            avatar: user.avatar
        }), { httpOnly: true, maxAge: 24*60*60*1000 });

        // Optional: User in DB speichern (hier nur Log)
        console.log('Discord User eingeloggt:', user);

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Discord OAuth Fehler:', err.response?.data || err.message || err);
        res.send('Fehler beim Discord-Login!');
    }
});

// Dummy Dashboard
app.get('/dashboard', (req, res) => {
    const user = req.cookies.discord_user ? JSON.parse(req.cookies.discord_user) : null;
    if (!user) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(3000, () => {
    console.log('Server läuft auf Port 3000');
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
