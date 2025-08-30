require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.static('public'));

app.get('/auth/discord', (req, res) => {
    // Discord OAuth2 URL (Client ID und Redirect URI müssen exakt stimmen!)
    const client_id = '1411357745994797116';
    const redirect_uri = encodeURIComponent('https://www.ropehub.de/callback');
    const scope = encodeURIComponent('identify');
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=${scope}`;
    res.redirect(discordAuthUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');

    try {
        // Tausche Code gegen Access Token
        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: '1411357745994797116',
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'https://www.ropehub.de/callback',
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const access_token = tokenResponse.data.access_token;
        if (!access_token) {
            return res.send('No access token received from Discord');
        }

        // Hole Userdaten
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        // Zeige Usernamen als Test
        res.send(`<h1>Hi ${userResponse.data.username}!</h1>`);
    } catch (err) {
        console.error('Discord OAuth Error:', err.response?.data || err.message || err);
        res.send('Error during Discord OAuth');
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
