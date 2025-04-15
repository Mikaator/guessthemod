let currentMod = null;
let currentHints = [];
let revealedHints = [];
let gameState = 'waiting'; // waiting, playing, finished
let correctMods = new Set(); // Speichert die IDs der richtig geratenen Mods
let wrongModsInRound = new Set(); // Speichert die IDs der falsch geratenen Mods in der aktuellen Runde
let currentLayout = 'default'; // default, centered, circular, grid
let currentModIndex = 0;
let shuffledMods = []; // Globale Variable für die gemischte Mod-Liste
let shuffledHints = []; // Globale Variable für die gemischte Reihenfolge der Tipp-Blöcke
let displayModsOrder = []; // Globale Variable für die Display-Reihenfolge der Mods

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
    
    // Erstelle eine zufällige Reihenfolge der Mods
    shuffledMods = [...config.mods].sort(() => Math.random() - 0.5);
    
    // Erstelle eine einmalige zufällige Reihenfolge für die Anzeige
    displayModsOrder = [...shuffledMods].sort(() => Math.random() - 0.5);
    
    // Erstelle Mod-Buttons in zufälliger Reihenfolge
    displayModsOrder.forEach(mod => {
        const modButton = document.createElement('button');
        modButton.className = 'mod-button';
        modButton.textContent = mod.name;
        modButton.onclick = () => checkGuess(mod.id);
        modsContainer.appendChild(modButton);
    });
    
    // Beginne immer mit dem ersten Mod in der zufälligen Reihenfolge
    currentModIndex = 0;
    selectNewMod();
}

function selectNewMod() {
    // Zeige die Navigations-Buttons
    const navButtons = document.getElementById('navigationButtons');
    navButtons.style.display = 'flex';
    
    // Aktualisiere den Status der Navigations-Buttons
    const prevButton = document.getElementById('prevModButton');
    const nextButton = document.getElementById('nextModButton');
    
    prevButton.disabled = currentModIndex === 0;
    nextButton.disabled = currentModIndex === shuffledMods.length - 1;
    
    // Wähle den aktuellen Mod aus der gemischten Liste
    currentMod = shuffledMods[currentModIndex];
    
    // Aktualisiere die Mod-Buttons ohne erneutes Mischen
    const modsContainer = document.getElementById('modsContainer');
    modsContainer.innerHTML = '';
    
    // Verwende die bereits gemischte Reihenfolge aus displayModsOrder
    displayModsOrder.forEach(mod => {
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
    
    // Setze zurückgesetzte Spielvariablen
    revealedHints = [];
    gameState = 'waiting';
    wrongModsInRound = new Set();
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
        if (currentModIndex < shuffledMods.length - 1) {
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
    // Finde den Button des geklickten Mods mit Hilfe der ID und des Textinhalts
    // Wir können nicht mehr auf die Position im shuffledMods-Array vertrauen, da wir die Anzeige neu gemischt haben
    const modName = config.mods.find(mod => mod.id === modId)?.name;
    
    // Finde alle Mod-Buttons und den Button, der angeklickt wurde
    const allModButtons = document.querySelectorAll('.mod-button');
    let clickedButton = null;
    
    // Finde den genauen Button, der diesem Mod entspricht
    allModButtons.forEach(button => {
        if (button.textContent === modName && !button.classList.contains('correct-mod') && !button.classList.contains('wrong-mod')) {
            clickedButton = button;
        }
    });
    
    if (!clickedButton) {
        console.error("Button für Mod nicht gefunden:", modId, modName);
        return;
    }
    
    if (modId === currentMod.id) {
        // Richtige Antwort
        correctMods.add(modId);
        clickedButton.classList.add('correct-mod');
        
        // Grüne Animation am Bildschirmrand
        const successAnimation = document.createElement('div');
        successAnimation.className = 'success-animation';
        document.body.appendChild(successAnimation);
        setTimeout(() => successAnimation.remove(), 2000);
        
        // Korrekter Sound abspielen
        playSound('correctSound');
        
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
        clickedButton.classList.add('wrong-mod');
        
        // Rote Animation am Bildschirmrand
        const errorAnimation = document.createElement('div');
        errorAnimation.className = 'error-animation';
        document.body.appendChild(errorAnimation);
        setTimeout(() => errorAnimation.remove(), 2000);
        
        // Falscher Sound abspielen
        playSound('wrongSound');
        
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
    const hintsContainer = document.getElementById('hintsContainer');
    hintsContainer.innerHTML = '';
    
    // Hole alle Tipps für den aktuellen Mod
    const modHints = config.hints.filter(hint => hint.modId === currentMod.id);
    
    // Erstelle eine zufällige Reihenfolge der Tipps für diesen Mod
    const shuffledModHints = [...modHints].sort(() => Math.random() - 0.5);
    
    // Erstelle Tipp-Karten in der zufälligen Reihenfolge
    shuffledModHints.forEach(hint => {
        const card = document.createElement('div');
        card.className = `hint-card design-${hint.design}`;
        
        const question = document.createElement('div');
        question.className = 'hint-question';
        question.textContent = hint.question;
        
        const answer = document.createElement('div');
        answer.className = 'hint-answer';
        
        // Prüfe, ob die Antwort einen Link enthält
        if (hint.answer.includes('http')) {
            const answerContainer = document.createElement('div');
            answerContainer.className = 'hint-answer-content';
            
            // Finde alle URLs in der Antwort
            const regex = /(https?:\/\/[^\s]+)/g;
            const parts = hint.answer.split(regex);
            const links = hint.answer.match(regex) || [];
            
            // Verarbeite jeden Teil der Antwort
            for (let i = 0; i < parts.length; i++) {
                // Text-Teil (wenn nicht leer)
                if (parts[i].trim()) {
                    const textElement = document.createElement('p');
                    textElement.textContent = parts[i].trim();
                    textElement.style.margin = '8px 0';
                    answerContainer.appendChild(textElement);
                }
                
                // Link hinzufügen, falls an dieser Position (Indizes wechseln sich ab: Text, Link, Text, Link, ...)
                if (i < parts.length - 1 && i < links.length) {
                    const currentLink = links[i];
                    
                    const linkButton = document.createElement('a');
                    linkButton.href = currentLink;
                    linkButton.target = '_blank';
                    linkButton.textContent = `Link ${i + 1} öffnen`;
                    linkButton.className = 'image-link';
                    answerContainer.appendChild(linkButton);
                }
            }
            
            answer.appendChild(answerContainer);
        } else {
            // Für Texte ohne Links
            const textElement = document.createElement('p');
            textElement.textContent = hint.answer;
            answer.appendChild(textElement);
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

// Verbesserte CSV-Import-Funktion
window.handleCSVImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        
        // Verarbeite die CSV-Datei direkt als ganzes
        processRawCSV(csvData);
    };
    
    reader.readAsText(file);
}

// Bessere Lösung für das CSV-Parsing
function processRawCSV(csvText) {
    console.log("CSV-Import gestartet");
    
    try {
        // Teile die CSV in Zeilen auf, aber behalte die Originalstruktur
        const rows = csvText.split('\n');
        
        if (rows.length < 2) {
            showNotification("CSV-Datei enthält zu wenige Zeilen", "error");
            return;
        }
        
        // Extrahiere die Header-Zeile
        const headerRow = rows[0];
        const headers = parseCSVHeaderRow(headerRow);
        
        console.log("Headers gefunden:", headers);
        
        // Leere bestehende Daten
        config.mods = [];
        config.hints = [];
        
        // Basiszeitstempel für die IDs
        const baseTime = Date.now();
        
        // Finde alle gültigen Mod-Zeilen - jede Zeile, die mit einem Datum und Mod-Namen beginnt
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue; // Überspringe leere Zeilen
            
            // Wenn die Zeile mit einem Datum anfängt (wie "2025/04/14"), dann ist es eine neue Mod-Zeile
            if (row.match(/^"20\d\d\/\d\d\/\d\d/)) {
                const fields = parseCSVRow(row);
                
                if (fields.length < headers.length) {
                    console.warn(`Zeile ${i} hat weniger Felder als erwartet`);
                }
                
                // Zweites Feld enthält den Mod-Namen
                if (fields.length >= 2) {
                    const modName = fields[1].trim();
                    
                    if (modName) {
                        const modId = baseTime + (i * 10000);
                        
                        // Füge Mod hinzu
                        config.mods.push({
                            id: modId,
                            name: modName
                        });
                        
                        console.log(`Mod hinzugefügt: ${modName} (ID: ${modId})`);
                        
                        // Verarbeite alle Felder ab dem dritten als Tipps
                        for (let j = 2; j < fields.length && j < headers.length; j++) {
                            const answer = fields[j].trim();
                            if (!answer) continue;
                            
                            const question = headers[j].trim();
                            
                            // Prüfe, ob es sich um einen Link handelt
                            const containsLinks = answer.includes('http');
                            
                            const hintId = baseTime + (i * 10000) + (j * 100);
                            
                            config.hints.push({
                                id: hintId,
                                modId: modId,
                                question: question,
                                answer: answer,
                                design: Math.floor(Math.random() * 6) + 1,
                                isImage: containsLinks
                            });
                            
                            console.log(`Tipp hinzugefügt: ${question} für ${modName}`);
                        }
                    }
                }
            }
        }
        
        // Aktualisiere Listen
        updateModList();
        updateModSelect();
        updateHintList();
        
        // Aktualisiere UI und zeige Statistik
        showNotification(`${config.mods.length} Mods und ${config.hints.length} Tipps erfolgreich importiert!`, 'success');
        
    } catch (error) {
        console.error("Fehler beim CSV-Import:", error);
        showNotification("Fehler beim Import: " + error.message, "error");
    }
}

// Parst eine CSV-Zeile und respektiert Anführungszeichen
function parseCSVRow(row) {
    const result = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            // Wenn wir ein Anführungszeichen sehen, wechseln wir den Zustand
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // Komma außerhalb von Anführungszeichen = Feldtrenner
            result.push(currentField);
            currentField = '';
        } else {
            // Füge das Zeichen zum aktuellen Feld hinzu
            currentField += char;
        }
    }
    
    // Letztes Feld hinzufügen
    if (currentField) {
        result.push(currentField);
    }
    
    // Bereinige die Felder von umschließenden Anführungszeichen
    return result.map(field => field.replace(/^"|"$/g, ''));
}

// Parse nur die Header-Zeile
function parseCSVHeaderRow(headerRow) {
    // Spezifisch für die erste Zeile, die die Header enthält
    return headerRow.split(',').map(header => 
        header.replace(/^"|"$/g, '').trim()
    );
}