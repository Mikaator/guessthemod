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
    const mods = config.mods;
    const randomMod = mods[Math.floor(Math.random() * mods.length)];
    currentMod = randomMod;
    
    // Mod-Buttons erstellen
    const modsContainer = document.getElementById('modsContainer');
    modsContainer.innerHTML = '';
    mods.forEach(mod => {
        const button = document.createElement('button');
        button.className = 'mod-button';
        button.textContent = mod.name;
        button.onclick = () => checkGuess(mod.id);
        modsContainer.appendChild(button);
    });
    
    // Tipp-Karten erstellen
    const hintsContainer = document.getElementById('hintsContainer');
    hintsContainer.innerHTML = '';
    const modHints = config.hints.filter(hint => hint.modId === randomMod.id);
    
    modHints.forEach(hint => {
        const card = document.createElement('div');
        card.className = `hint-card design-${hint.design}`;
        
        const question = document.createElement('div');
        question.className = 'hint-question';
        question.textContent = hint.question;
        
        const answer = document.createElement('div');
        answer.className = 'hint-answer';
        
        if (hint.isImage) {
            // Erstelle einen Link für Bildantworten
            const link = document.createElement('a');
            link.href = hint.answer;
            link.target = '_blank';
            link.textContent = 'Bild öffnen';
            link.style.color = 'var(--primary-color)';
            link.style.textDecoration = 'none';
            link.style.fontWeight = 'bold';
            answer.appendChild(link);
        } else {
            answer.textContent = hint.answer;
        }
        
        card.appendChild(question);
        card.appendChild(answer);
        
        card.onclick = () => {
            if (!card.classList.contains('flipped')) {
                card.classList.add('flipped');
                flipSound.play();
                updateGameStatus();
            }
        };
        
        hintsContainer.appendChild(card);
    });
    
    updateGameStatus();
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

function checkGuess(modId) {
    if (selectedModId === modId) {
        // Richtige Antwort
        const card = document.querySelector(`.hint-card[data-mod-id="${modId}"]`);
        card.classList.add('correct');
        
        const status = document.getElementById('gameStatus');
        status.textContent = 'Richtig! 🎉';
        status.classList.add('correct');
        
        playSound('correctSound');
        
        // Mod-Button hervorheben
        const modButton = document.querySelector(`.mod-button[data-mod-id="${modId}"]`);
        modButton.classList.add('selected');
        
        setTimeout(() => {
            status.textContent = 'Wähle einen Tipp, um zu beginnen!';
            status.classList.remove('correct');
            card.classList.remove('correct');
            modButton.classList.remove('selected');
            selectNewMod();
        }, 2000);
    } else {
        // Falsche Antwort
        const card = document.querySelector(`.hint-card[data-mod-id="${modId}"]`);
        card.classList.add('wrong');
        
        const status = document.getElementById('gameStatus');
        status.textContent = 'Falsch! 😢';
        status.classList.add('wrong');
        
        playSound('wrongSound');
        
        setTimeout(() => {
            card.classList.remove('wrong');
            status.classList.remove('wrong');
            status.textContent = 'Versuche es nochmal!';
        }, 1000);
    }
} 