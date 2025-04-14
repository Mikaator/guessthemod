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
            // Teile den Text in Teile vor und nach dem Link
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const parts = hint.answer.split(urlRegex);
            const links = hint.answer.match(urlRegex) || [];
            
            // Text und Links zusammenfügen
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].trim()) {
                    const textElement = document.createElement('p');
                    textElement.textContent = parts[i].trim();
                    textElement.style.margin = '10px 0';
                    answer.appendChild(textElement);
                }
                
                // Füge Link nach dem Text ein, wenn vorhanden
                if (links[i]) {
                    const imageLink = document.createElement('a');
                    imageLink.href = links[i];
                    imageLink.target = '_blank';
                    imageLink.textContent = 'Link öffnen';
                    imageLink.className = 'image-link';
                    answer.appendChild(imageLink);
                }
            }
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

// Verbesserte CSV-Import-Funktion
window.handleCSVImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        // CSV-Daten
        const csvData = e.target.result;
        console.log("CSV Datei geladen, Größe:", csvData.length);
        
        try {
            // Zeilen aufteilen und leere Zeilen entfernen
            const rows = csvData.split('\n')
                .map(row => row.trim())
                .filter(row => row.length > 0);
            
            console.log(`Anzahl Zeilen in CSV: ${rows.length}`);
            
            // Extrahiere Header (erste Zeile)
            const headerLine = rows[0];
            const headers = parseCSVRow(headerLine);
            
            console.log("Headers gefunden:", headers);
            
            // Zeige Vorschau (nur die ersten 5 Zeilen)
            showCSVPreview(rows, headers);
            
            // Verarbeite alle Daten
            processCSVData(rows, headers);
            
        } catch (error) {
            console.error("Fehler beim CSV-Import:", error);
            showNotification("Fehler beim CSV-Import: " + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// Bessere CSV-Zeilen-Parsing-Funktion
function parseCSVRow(row) {
    const result = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    
    // Füge die letzte Zelle hinzu
    if (cell) result.push(cell.trim());
    
    return result;
}

// Zeige eine Vorschau der CSV-Daten
function showCSVPreview(rows, headers) {
    const preview = document.getElementById('csvPreview');
    let previewHTML = '<table>';
    
    // Header
    previewHTML += '<tr>';
    headers.forEach(header => {
        previewHTML += `<th>${header}</th>`;
    });
    previewHTML += '</tr>';
    
    // Zeige maximal 5 Zeilen an
    const maxRows = Math.min(rows.length, 6);
    for (let i = 1; i < maxRows; i++) {
        const cells = parseCSVRow(rows[i]);
        previewHTML += '<tr>';
        cells.forEach(cell => {
            previewHTML += `<td>${cell}</td>`;
        });
        previewHTML += '</tr>';
    }
    
    previewHTML += '</table>';
    
    if (rows.length > 6) {
        previewHTML += `<p>... und ${rows.length - 6} weitere Zeilen</p>`;
    }
    
    preview.innerHTML = previewHTML;
}

// Verbesserte CSV-Datenverarbeitung
function processCSVData(rows, headers) {
    // Leere vorhandene Daten
    config.mods = [];
    config.hints = [];
    
    console.log(`Verarbeite ${rows.length} Zeilen`);
    
    // Erstelle Basiszeit für IDs, um Überschneidungen zu vermeiden
    const baseTime = Date.now();
    
    // Verarbeite jede Zeile (außer Header)
    for (let i = 1; i < rows.length; i++) {
        // Parse Zeile mit der verbesserten Funktion
        const cells = parseCSVRow(rows[i]);
        
        if (cells.length < 2) {
            console.log(`Überspringe Zeile ${i}: Nicht genug Zellen`);
            continue;
        }
        
        // Erstelle neuen Mod (Name aus der zweiten Spalte)
        const modName = cells[1].replace(/"/g, '').trim();
        
        if (!modName) {
            console.log(`Überspringe Zeile ${i}: Kein Mod-Name`);
            continue;
        }
        
        // Erstelle eindeutige ID für diesen Mod
        const modId = baseTime + (i * 10000);
        
        console.log(`Verarbeite Mod #${i}: ${modName} (ID: ${modId})`);
        
        // Füge Mod hinzu
        config.mods.push({
            id: modId,
            name: modName
        });
        
        // Verarbeite Tipps für diesen Mod (ab 3. Spalte)
        for (let j = 2; j < cells.length && j < headers.length; j++) {
            const answer = cells[j].trim();
            
            if (!answer) continue;
            
            const question = headers[j].replace(/"/g, '').trim();
            const isImageUrl = answer.includes('http') && (
                answer.includes('.jpg') || 
                answer.includes('.png') || 
                answer.includes('.gif') ||
                answer.includes('imgur') ||
                answer.includes('drive.google')
            );
            
            const hintId = baseTime + (i * 10000) + (j * 100);
            
            config.hints.push({
                id: hintId,
                modId: modId,
                question: question,
                answer: answer,
                design: Math.floor(Math.random() * 6) + 1,
                isImage: isImageUrl
            });
            
            console.log(`- Tipp hinzugefügt: "${question}" (ID: ${hintId})`);
        }
    }
    
    console.log(`CSV-Import abgeschlossen: ${config.mods.length} Mods und ${config.hints.length} Tipps`);
    
    // Aktualisiere die Listen in der UI
    updateModList();
    updateModSelect();
    updateHintList();
    
    showNotification(`${config.mods.length} Mods und ${config.hints.length} Tipps erfolgreich importiert!`, 'success');
}