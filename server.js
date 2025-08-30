// server.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

// Discord OAuth Callback
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Kein Code von Discord erhalten");

  try {
    // Access Token anfordern
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;

    // User Daten holen
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.send(`Hallo ${userResponse.data.username}, Login erfolgreich!`);
  } catch (err) {
    console.error(err);
    res.send("Fehler beim Login");
  }
});

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
