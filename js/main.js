let gameState = {
    currentMod: null,
    revealedHints: [],
    gameOver: false
};

// Lade Konfiguration
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error('Konfiguration konnte nicht geladen werden');
        }
        const config = await response.json();
        initializeGame(config);
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        document.getElementById('gameStatus').innerHTML = '<p>Fehler beim Laden der Konfiguration</p>';
    }
}

function initializeGame(config) {
    // Wähle zufälligen Mod
    const randomMod = config.mods[Math.floor(Math.random() * config.mods.length)];
    gameState.currentMod = randomMod;

    // Erstelle Mod-Buttons
    const modsContainer = document.getElementById('modsContainer');
    modsContainer.innerHTML = config.mods.map(mod => `
        <button class="mod-button" onclick="guessMod(${mod.id})">
            ${mod.name}
        </button>
    `).join('');

    // Erstelle Tipp-Karten
    const hintsContainer = document.getElementById('hintsContainer');
    const modHints = config.hints.filter(h => h.modId === randomMod.id);
    
    hintsContainer.innerHTML = modHints.map(hint => `
        <div class="hint-card design-${hint.design}" onclick="revealHint(${hint.id})">
            <div class="hint-front">
                <p>${hint.question}</p>
            </div>
            <div class="hint-back">
                ${hint.answer.startsWith('http') ? 
                    `<img src="${hint.answer}" alt="Tipp Bild">` : 
                    `<p>${hint.answer}</p>`}
            </div>
        </div>
    `).join('');
}

// Sound Management
let soundEnabled = {
    flip: true,
    guess: true
};

function toggleSound(type) {
    soundEnabled[type] = !soundEnabled[type];
    const button = document.querySelector(`button[onclick="toggleSound('${type}')"]`);
    button.textContent = soundEnabled[type] ? '🔊' : '🔇';
}

function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Sound konnte nicht abgespielt werden:', e));
    }
}

// Theme Management
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    }
}

// Modifizierte revealHint Funktion
function revealHint(hintId) {
    if (gameState.gameOver) return;

    const hintCard = document.querySelector(`.hint-card[onclick*="${hintId}"]`);
    if (!hintCard || gameState.revealedHints.includes(hintId)) return;

    if (soundEnabled.flip) {
        playSound('flipSound');
    }

    hintCard.classList.add('flipped');
    gameState.revealedHints.push(hintId);

    // Deaktiviere Karte nach Animation
    setTimeout(() => {
        hintCard.style.pointerEvents = 'none';
    }, 600);
}

// Modifizierte guessMod Funktion
function guessMod(modId) {
    if (gameState.gameOver) return;

    const isCorrect = modId === gameState.currentMod.id;
    gameState.gameOver = true;

    if (soundEnabled.guess) {
        if (isCorrect) {
            playSound('correctSound');
            setTimeout(() => playSound('winSound'), 1000);
        } else {
            playSound('wrongSound');
            setTimeout(() => playSound('loseSound'), 1000);
        }
    }

    const statusElement = document.getElementById('gameStatus');
    statusElement.innerHTML = `
        <p class="${isCorrect ? 'success' : 'error'}">
            ${isCorrect ? '🎉 Richtig geraten!' : '❌ Falsch geraten!'} 
            Es war ${gameState.currentMod.name}!
        </p>
    `;

    // Deaktiviere alle Buttons mit Animation
    document.querySelectorAll('.mod-button, .hint-card').forEach(element => {
        element.style.pointerEvents = 'none';
        if (!element.classList.contains('flipped')) {
            element.style.opacity = '0.5';
        }
    });
}

// Initialisiere Theme beim Laden
window.addEventListener('load', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(`${savedTheme}-theme`);
    loadConfig();
}); 