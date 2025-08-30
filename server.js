require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.static('public'));

app.get('/auth/discord', (req, res) => {
    const client_id = process.env.CLIENT_ID;
    const redirect_uri = encodeURIComponent(process.env.REDIRECT_URI);
    const scope = encodeURIComponent('identify email');
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}`;
    res.redirect(discordAuthUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');

    try {
        const tokenResponse = await axios.post(
            'https://discord.com/api/oauth2/token',
            new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.REDIRECT_URI,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const access_token = tokenResponse.data.access_token;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        res.send(`<h1>Hi ${userResponse.data.username}!</h1>`);
    } catch (err) {
        console.error(err);
        res.send('Error during Discord OAuth');
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
