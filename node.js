app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('No code provided');

  // Discord Token holen
  const data = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: '1411357745994797116',
      client_secret: 'xCWeD5VICWxiiDhr0d0urLrCfWNG42xn',
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://ropehub.de/callback',
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(r => r.json());

  // Hier könntest du den User speichern / weiterleiten
  res.send('Login erfolgreich, User Token: ' + data.access_token);
});
