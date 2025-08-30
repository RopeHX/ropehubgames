app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');

  // Discord Token holen
  const data = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: 'DEIN_CLIENT_ID',
      client_secret: 'DEIN_SECRET',
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://ropub.de/callback',
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(r => r.json());

  // Hier könntest du den User speichern / weiterleiten
  res.send('Login erfolgreich, User Token: ' + data.access_token);
});
