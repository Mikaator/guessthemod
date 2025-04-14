let currentMod = null;
let currentHints = [];
let revealedHints = [];
let gameState = 'waiting'; // waiting, playing, finished
let correctMods = new Set(); // Speichert die IDs der richtig geratenen Mods
let wrongModsInRound = new Set(); // Speichert die IDs der falsch geratenen Mods in der aktuellen Runde
let currentLayout = 'default'; // default, centered, circular, grid
let currentModIndex = 0;

// Layout-Optionen
const layouts = {
    default: {
        mods: 'center',
        hints: 'around'
    },
    centered: {
        mods: 'center',
        hints: 'center'
    },
    circular: {
        mods: 'center',
        hints: 'circle'
    },
    grid: {
        mods: 'top',
        hints: 'grid'
    }
};

// Initialisiere das Spiel
function initializeGame() {
    loadConfig();
    setupEventListeners();
    updateLayout();
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
    // Zeige die Navigations-Buttons
    const navButtons = document.getElementById('navigationButtons');
    navButtons.style.display = 'flex';
    
    // Aktualisiere den Status der Navigations-Buttons
    const prevButton = document.getElementById('prevModButton');
    const nextButton = document.getElementById('nextModButton');
    
    prevButton.disabled = currentModIndex === 0;
    nextButton.disabled = currentModIndex === config.mods.length - 1;
    
    // Wähle den nächsten Mod aus
    currentMod = config.mods[currentModIndex];
    
    // Aktualisiere die Mod-Buttons
    const modsContainer = document.getElementById('modsContainer');
    modsContainer.innerHTML = '';
    
    config.mods.forEach(mod => {
        const modButton = document.createElement('button');
        modButton.className = 'mod-button';
        if (correctMods.has(mod.id)) {
            modButton.classList.add('correct-mod');
        }
        modButton.textContent = mod.name;
        modButton.onclick = () => checkGuess(mod.id);
        modsContainer.appendChild(modButton);
    });
    
    // Aktualisiere die Tipps
    updateHints();
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
function updateGameStatus(message, isSuccess = false) {
    const gameStatus = document.getElementById('gameStatus');
    gameStatus.textContent = message;
    
    if (isSuccess) {
        gameStatus.classList.add('success');
        gameStatus.classList.remove('correct', 'wrong');
        createConfetti();
    } else {
        gameStatus.classList.remove('success');
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

    // Logo Click Event
    const logo = document.querySelector('.header-logo');
    if (logo) {
        logo.addEventListener('click', function() {
            logo.classList.add('clicked');
            setTimeout(() => {
                location.reload();
            }, 600);
        });
    }

    // Layout-Buttons
    const layoutButtons = document.querySelectorAll('.layout-button');
    layoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLayout(button.dataset.layout);
        });
    });

    // Event-Listener für die Navigations-Buttons
    document.getElementById('nextModButton').addEventListener('click', () => {
        if (currentModIndex < config.mods.length - 1) {
            currentModIndex++;
            selectNewMod();
        }
    });

    document.getElementById('prevModButton').addEventListener('click', () => {
        if (currentModIndex > 0) {
            currentModIndex--;
            selectNewMod();
        }
    });
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

// Wähle Layout
function setLayout(layoutName) {
    if (layouts[layoutName]) {
        currentLayout = layoutName;
        updateLayout();
    }
}

// Aktualisiere Layout
function updateLayout() {
    const gameContainer = document.querySelector('.game-container');
    const modsContainer = document.getElementById('modsContainer');
    const hintsContainer = document.getElementById('hintsContainer');

    // Entferne alle Layout-Klassen
    gameContainer.className = 'game-container';
    modsContainer.className = 'mods-container';
    hintsContainer.className = 'hints-container';

    // Füge neue Layout-Klassen hinzu
    gameContainer.classList.add(`layout-${currentLayout}`);
    modsContainer.classList.add(`mods-${layouts[currentLayout].mods}`);
    hintsContainer.classList.add(`hints-${layouts[currentLayout].hints}`);

    // Aktualisiere die Anzeige
    selectNewMod();
}

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
        
        // Prüfe, ob alle Mods erraten wurden
        if (correctMods.size === config.mods.length) {
            updateGameStatus('Glückwunsch! Du hast alle Mods erraten!', true);
            playSound('winSound');
            createConfetti();
        } else {
            // Aktualisiere den Status
            const status = document.getElementById('gameStatus');
            status.textContent = 'Richtig! 🎉';
            status.classList.add('correct');
            
            setTimeout(() => {
                status.textContent = 'Klicke auf "Weiter" für den nächsten Mod!';
                status.classList.remove('correct');
            }, 1500);
        }
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

// Initialisiere das Spiel beim Laden
window.addEventListener('load', initializeGame);

document.addEventListener('DOMContentLoaded', function() {
    // Layout-Buttons Event Listener
    const layoutButtons = document.querySelectorAll('.layout-button');
    layoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            const layout = this.dataset.layout;
            const modsContainer = document.getElementById('modsContainer');
            
            // Entferne alle Layout-Klassen
            modsContainer.classList.remove('default-layout', 'centered-layout', 'circular-layout', 'grid-layout');
            
            // Füge die gewählte Layout-Klasse hinzu
            modsContainer.classList.add(`${layout}-layout`);
            
            // Aktualisiere den aktiven Button
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Setze Standard-Layout
    document.querySelector('.layout-button[data-layout="default"]').click();
});

function createConfetti() {
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
    const container = document.body;
    
    // Erstelle mehr Konfetti
    for (let i = 0; i < 200; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        container.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function updateHints() {
    // Erstelle Tipp-Karten
    const hintsContainer = document.getElementById('hintsContainer');
    hintsContainer.innerHTML = '';
    
    const modHints = config.hints.filter(hint => hint.modId === currentMod.id);
    
    // Mische die Tipps zufällig
    const shuffledHints = modHints.sort(() => Math.random() - 0.5);
    
    shuffledHints.forEach(hint => {
        const card = document.createElement('div');
        card.className = `hint-card design-${hint.design}`;
        
        const question = document.createElement('div');
        question.className = 'hint-question';
        question.textContent = hint.question;
        
        const answer = document.createElement('div');
        answer.className = 'hint-answer';
        
        // Prüfe, ob die Antwort einen Link enthält
        if (hint.answer.includes('http')) {
            // Teile den Text in Teile vor und nach dem Link
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const parts = hint.answer.split(urlRegex);
            
            parts.forEach(part => {
                if (part.match(urlRegex)) {
                    // Wenn es ein Link ist, erstelle einen Link-Button
                    const imageLink = document.createElement('a');
                    imageLink.href = part;
                    imageLink.target = '_blank';
                    imageLink.textContent = 'Link öffnen';
                    imageLink.className = 'image-link';
                    answer.appendChild(imageLink);
                } else if (part.trim()) {
                    // Wenn es Text ist, erstelle ein Text-Element
                    const textElement = document.createElement('p');
                    textElement.textContent = part.trim();
                    textElement.style.margin = '10px 0';
                    answer.appendChild(textElement);
                }
            });
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