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

function revealHint(hintId) {
    if (gameState.gameOver) return;

    const hintCard = document.querySelector(`.hint-card[onclick*="${hintId}"]`);
    if (!hintCard || gameState.revealedHints.includes(hintId)) return;

    hintCard.classList.add('flipped');
    gameState.revealedHints.push(hintId);

    // Deaktiviere Karte nach Animation
    setTimeout(() => {
        hintCard.style.pointerEvents = 'none';
    }, 600);
}

function guessMod(modId) {
    if (gameState.gameOver) return;

    const isCorrect = modId === gameState.currentMod.id;
    gameState.gameOver = true;

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

// Starte Spiel beim Laden
window.onload = loadConfig; 