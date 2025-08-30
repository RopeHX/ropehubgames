// --- Maus-Trail Glow ---
const trailCount = 5;
const trails = [];
for(let i=0;i<trailCount;i++){
    const div = document.createElement('div');
    div.classList.add('cursor-trail');
    document.body.appendChild(div);
    trails.push({el: div, x: 0, y: 0});
}
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
function animateTrail() {
    let x = mouseX;
    let y = mouseY;
    trails.forEach(trail => {
        trail.x += (x - trail.x) * 0.2;
        trail.y += (y - trail.y) * 0.2;
        trail.el.style.transform = `translate(${trail.x}px, ${trail.y}px)`;
        x = trail.x;
        y = trail.y;
    });
    requestAnimationFrame(animateTrail);
}
animateTrail();

// Banner schließen
document.getElementById('event-banner-close').addEventListener('click', () => {
    document.getElementById('event-banner').style.display = 'none';
});

// Discord-Event-Banner schließen
document.getElementById('discord-event-banner-close').addEventListener('click', () => {
    document.getElementById('discord-event-banner').style.display = 'none';
});

// --- Login/Profil/Spiele-Logik ---
const loginArea = document.getElementById('login-area');
const profileMenu = document.getElementById('profile-menu');
const avatarEl = document.getElementById('avatar');
const usernameEl = document.getElementById('username');

// Gast Login
document.getElementById('guest-login').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    // Prüfe ob Event-Teilnahme erforderlich ist
    if (urlParams.get('event')) {
        alert('Für Events ist Discord-Login erforderlich!');
        return;
    }
    let event = urlParams.get('event') || 'LeFox Event – Freitag, 5.8.';
    // Simuliere Gast-Login mit Default-Avatar und Username
    showProfileMenu('Gast', 'images/default-avatar.png', event);
});

// Nach Discord Login (über URL-Parameter)
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const avatarId = urlParams.get('avatar');
    if (username && avatarId) {
        // Discord Avatar direkt anzeigen
        const avatarUrl = `https://cdn.discordapp.com/avatars/${avatarId}.png`;
        showProfileMenu(username, avatarUrl, urlParams.get('event') || 'LeFox Event – Freitag, 5.8.');
    }
});

function showProfileMenu(username, avatarUrl, eventText) {
    loginArea.style.display = 'none';
    profileMenu.style.display = '';
    usernameEl.textContent = username;
    avatarEl.src = avatarUrl;
    // Optional: Event-Banner Text anpassen, falls gewünscht
    if (eventText) {
        const banner = document.getElementById('event-banner');
        if (banner) banner.childNodes[0].textContent = eventText;
    }
    // Spiele-Menü laden (Dummy)
    const gamesList = document.getElementById('games-list');
    gamesList.innerHTML = '<div>Spiel 1</div><div>Spiel 2</div><div>Spiel 3</div>';
}

// Logout
document.getElementById('logout').addEventListener('click', () => {
    window.location.href = '/';
});