let currentMod = null;
let currentHints = [];
let revealedHints = [];
let gameState = 'waiting'; // waiting, playing, finished

// Initialisiere das Spiel
function initializeGame() {
    loadConfig();
    setupEventListeners();
}

// Lade Konfiguration
async function loadConfig() {
    try {
        // Füge Cache-Busting Parameter hinzu
        const timestamp = new Date().getTime();
        const response = await fetch(`config.json?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Konfiguration');
        }
        
        const data = await response.json();
        window.config = data;
        setupGame();
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        // Versuche es nach 5 Sekunden erneut
        setTimeout(loadConfig, 5000);
    }
}

// Richte das Spiel auf
function setupGame() {
    const modsContainer = document.getElementById('modsContainer');
    const hintsContainer = document.getElementById('hintsContainer');
    
    // Leere Container
    modsContainer.innerHTML = '';
    hintsContainer.innerHTML = '';
    
    // Erstelle Mod-Buttons in der Mitte
    config.mods.forEach(mod => {
        const modButton = document.createElement('button');
        modButton.className = 'mod-button';
        modButton.textContent = mod.name;
        modButton.onclick = () => handleModGuess(mod.id);
        modsContainer.appendChild(modButton);
    });
    
    // Wähle zufälligen Mod und seine Tipps
    selectNewMod();
}

// Wähle neuen Mod und seine Tipps
function selectNewMod() {
    const randomModIndex = Math.floor(Math.random() * config.mods.length);
    currentMod = config.mods[randomModIndex];
    currentHints = config.hints.filter(hint => hint.modId === currentMod.id);
    revealedHints = [];
    gameState = 'waiting';
    
    // Erstelle Tipp-Karten
    const hintsContainer = document.getElementById('hintsContainer');
    hintsContainer.innerHTML = '';
    
    currentHints.forEach(hint => {
        const hintCard = document.createElement('div');
        hintCard.className = `hint-card design-${hint.design}`;
        hintCard.innerHTML = `
            <div class="hint-question">${hint.question}</div>
            <div class="hint-answer">${hint.isImage ? hint.answer : `<p>${hint.answer}</p>`}</div>
        `;
        hintCard.onclick = () => revealHint(hintCard, hint);
        hintsContainer.appendChild(hintCard);
    });
    
    updateGameStatus('Wähle einen Tipp, um zu beginnen!');
}

// Deckt einen Tipp auf
function revealHint(hintCard, hint) {
    if (gameState === 'finished') return;
    
    if (!hintCard.classList.contains('flipped')) {
        hintCard.classList.add('flipped');
        playSound('flip');
        revealedHints.push(hint);
        gameState = 'playing';
        
        // Prüfe ob alle Tipps aufgedeckt sind
        if (revealedHints.length === currentHints.length) {
            updateGameStatus('Alle Tipps aufgedeckt! Rate jetzt den Mod!');
        } else {
            updateGameStatus(`Tipp aufgedeckt! Noch ${currentHints.length - revealedHints.length} Tipps übrig.`);
        }
    }
}

// Behandelt Mod-Rateversuch
function handleModGuess(modId) {
    if (gameState !== 'playing') return;
    
    if (modId === currentMod.id) {
        // Richtiger Mod erraten
        playSound('correct');
        updateGameStatus('Richtig! Du hast den Mod erraten!');
        gameState = 'finished';
        setTimeout(selectNewMod, 2000);
    } else {
        // Falscher Mod
        playSound('wrong');
        updateGameStatus('Falsch! Versuche es nochmal!');
    }
}

// Aktualisiere Spielstatus
function updateGameStatus(message) {
    const gameStatus = document.getElementById('gameStatus');
    gameStatus.innerHTML = `<p>${message}</p>`;
}

// Sound-Effekte
function playSound(type) {
    const sound = document.getElementById(`${type}Sound`);
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}

// Event-Listener
function setupEventListeners() {
    // Theme Toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Theme wechseln
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
}

// Sound ein/aus
function toggleSound(type) {
    const sound = document.getElementById(`${type}Sound`);
    if (sound) {
        sound.muted = !sound.muted;
    }
}

// Initialisiere das Spiel beim Laden
window.addEventListener('load', initializeGame); 