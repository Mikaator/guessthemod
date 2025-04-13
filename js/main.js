let currentMod = null;
let currentHints = [];
let revealedHints = [];
let gameState = 'waiting'; // waiting, playing, finished
let correctMods = new Set(); // Speichert die IDs der richtig geratenen Mods
let wrongModsInRound = new Set(); // Speichert die IDs der falsch geratenen Mods in der aktuellen Runde

// Initialisiere das Spiel
function initializeGame() {
    loadConfig();
    setupEventListeners();
}

// Lade Konfiguration
async function loadConfig() {
    try {
        const response = await fetch('config.json');
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
    // Filtere bereits erratene Mods heraus
    const availableMods = config.mods.filter(mod => !correctMods.has(mod.id));
    
    if (availableMods.length === 0) {
        const status = document.getElementById('gameStatus');
        status.innerHTML = '<p>Glückwunsch! Du hast alle Mods erraten!</p>';
        return;
    }
    
    // Wähle einen zufälligen Mod aus den verfügbaren Mods
    const randomMod = availableMods[Math.floor(Math.random() * availableMods.length)];
    currentMod = randomMod;
    wrongModsInRound.clear(); // Reset der falsch geratenen Mods für die neue Runde
    
    // Erstelle Mod-Buttons
    const modsContainer = document.getElementById('modsContainer');
    modsContainer.innerHTML = '';
    
    config.mods.forEach(mod => {
        const button = document.createElement('button');
        button.className = 'mod-button';
        button.textContent = mod.name;
        
        // Wenn der Mod bereits erraten wurde, markiere ihn als korrekt
        if (correctMods.has(mod.id)) {
            button.classList.add('correct-mod');
        }
        
        button.addEventListener('click', () => checkGuess(mod.id));
        modsContainer.appendChild(button);
    });
    
    // Erstelle Tipp-Karten
    const hintsContainer = document.getElementById('hintsContainer');
    hintsContainer.innerHTML = '';
    
    const modHints = config.hints.filter(hint => hint.modId === currentMod.id);
    modHints.forEach(hint => {
        const card = document.createElement('div');
        card.className = `hint-card design-${hint.design}`;
        
        const question = document.createElement('div');
        question.className = 'hint-question';
        question.textContent = hint.question;
        
        const answer = document.createElement('div');
        answer.className = 'hint-answer';
        
        // Prüfe, ob die Antwort ein Link ist
        if (hint.answer.includes('http')) {
            const imageLink = document.createElement('a');
            imageLink.href = hint.answer;
            imageLink.target = '_blank';
            imageLink.textContent = 'Link öffnen';
            imageLink.className = 'image-link';
            answer.appendChild(imageLink);
        } else {
            answer.textContent = hint.answer;
        }
        
        card.appendChild(question);
        card.appendChild(answer);
        
        card.addEventListener('click', () => {
            if (!card.classList.contains('flipped')) {
                card.classList.add('flipped');
                playSound('flip');
            }
        });
        
        hintsContainer.appendChild(card);
    });
    
    document.getElementById('gameStatus').textContent = 'Wähle einen Tipp, um zu beginnen!';
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
function updateGameStatus() {
    const status = document.getElementById('gameStatus');
    const flippedCards = document.querySelectorAll('.hint-card.flipped').length;
    const totalCards = document.querySelectorAll('.hint-card').length;
    
    if (flippedCards === 0) {
        status.textContent = 'Wähle einen Tipp, um zu beginnen!';
        status.classList.remove('correct', 'wrong');
    } else if (flippedCards === totalCards) {
        status.textContent = 'Alle Tipps aufgedeckt! Rate jetzt den Mod!';
        status.classList.remove('correct', 'wrong');
    } else {
        status.textContent = `Tipp aufgedeckt! Noch ${totalCards - flippedCards} Tipps übrig.`;
        status.classList.remove('correct', 'wrong');
    }
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
    const modButton = document.querySelector(`.mod-button:nth-child(${Array.from(config.mods).indexOf(config.mods.find(m => m.id === modId)) + 1})`);
    
    if (modId === currentMod.id) {
        // Richtige Antwort
        correctMods.add(modId);
        modButton.classList.add('correct-mod');
        
        // Grüne Animation am Bildschirmrand
        const successAnimation = document.createElement('div');
        successAnimation.className = 'success-animation';
        document.body.appendChild(successAnimation);
        setTimeout(() => successAnimation.remove(), 2000);
        
        correctSound.play();
        
        // Aktualisiere den Status
        const status = document.getElementById('gameStatus');
        status.textContent = 'Richtig! 🎉';
        status.classList.add('correct');
        
        setTimeout(() => {
            status.textContent = 'Wähle einen Tipp, um zu beginnen!';
            status.classList.remove('correct');
            selectNewMod();
        }, 1500);
    } else {
        // Falsche Antwort
        wrongModsInRound.add(modId);
        modButton.classList.add('wrong-mod');
        
        // Rote Animation am Bildschirmrand
        const errorAnimation = document.createElement('div');
        errorAnimation.className = 'error-animation';
        document.body.appendChild(errorAnimation);
        setTimeout(() => errorAnimation.remove(), 2000);
        
        wrongSound.play();
        
        // Aktualisiere den Status
        const status = document.getElementById('gameStatus');
        status.textContent = 'Falsch! 😢';
        status.classList.add('wrong');
        
        setTimeout(() => {
            status.textContent = 'Versuche es nochmal!';
            status.classList.remove('wrong');
        }, 1000);
    }
} 