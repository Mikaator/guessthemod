let config = {
    mods: [],
    hints: []
};

// Mod Management
function addNewMod() {
    const modName = prompt('Name des neuen Mods:');
    if (modName) {
        const newMod = {
            id: Date.now(),
            name: modName
        };
        config.mods.push(newMod);
        updateModList();
        showNotification('Mod erfolgreich hinzugefügt!', 'success');
    }
}

function updateModList() {
    const modList = document.getElementById('modList');
    modList.innerHTML = config.mods.map(mod => `
        <div class="mod-item" data-id="${mod.id}">
            <input type="text" value="${mod.name}" onchange="updateModName(${mod.id}, this.value)">
            <button onclick="deleteMod(${mod.id})" class="delete-button">Löschen</button>
        </div>
    `).join('');
}

function updateModName(id, newName) {
    const mod = config.mods.find(m => m.id === id);
    if (mod) {
        mod.name = newName;
        showNotification('Mod erfolgreich aktualisiert!', 'success');
    }
}

function deleteMod(id) {
    if (confirm('Sind Sie sicher, dass Sie diesen Mod löschen möchten?')) {
        config.mods = config.mods.filter(m => m.id !== id);
        updateModList();
        showNotification('Mod erfolgreich gelöscht!', 'success');
    }
}

// Hint Management
function addNewHint() {
    const modSelect = document.createElement('div');
    modSelect.innerHTML = `
        <select id="modSelect">
            ${config.mods.map(mod => `<option value="${mod.id}">${mod.name}</option>`).join('')}
        </select>
    `;

    const question = prompt('Frage für den Tipp:');
    if (!question) return;

    const answer = prompt('Antwort (Text oder Bild-URL):');
    if (!answer) return;

    const design = prompt('Design (1-6):');
    if (!design || design < 1 || design > 6) return;

    const modId = parseInt(document.getElementById('modSelect').value);
    
    config.hints.push({
        id: Date.now(),
        modId,
        question,
        answer,
        design: parseInt(design)
    });

    updateHintList();
    showNotification('Tipp erfolgreich hinzugefügt!', 'success');
}

function updateHintList() {
    const hintList = document.getElementById('hintList');
    hintList.innerHTML = config.hints.map(hint => {
        const mod = config.mods.find(m => m.id === hint.modId);
        return `
            <div class="hint-item" data-id="${hint.id}">
                <div class="hint-preview design-${hint.design}">
                    <p>Frage: ${hint.question}</p>
                    <p>Mod: ${mod ? mod.name : 'Unbekannt'}</p>
                </div>
                <button onclick="deleteHint(${hint.id})" class="delete-button">Löschen</button>
            </div>
        `;
    }).join('');
}

function deleteHint(id) {
    if (confirm('Sind Sie sicher, dass Sie diesen Tipp löschen möchten?')) {
        config.hints = config.hints.filter(h => h.id !== id);
        updateHintList();
        showNotification('Tipp erfolgreich gelöscht!', 'success');
    }
}

// Speichern
async function saveConfig() {
    const token = sessionStorage.getItem('githubToken');
    if (!token) {
        showNotification('Bitte loggen Sie sich erneut ein', 'error');
        return;
    }

    try {
        const response = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/config.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update config.json',
                content: btoa(JSON.stringify(config, null, 2))
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern');
        }

        showNotification('Konfiguration erfolgreich gespeichert!', 'success');
    } catch (error) {
        showNotification(`Fehler beim Speichern: ${error.message}`, 'error');
    }
}

// Notification System
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialisiere Listen
window.onload = function() {
    updateModList();
    updateHintList();
}; 