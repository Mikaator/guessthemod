let config = {
    mods: [],
    hints: []
};

// Mod Management
window.addNewMod = function() {
    const modName = document.getElementById('newModName').value.trim();
    if (!modName) {
        showNotification('Bitte geben Sie einen Namen ein', 'error');
        return;
    }

    const newMod = {
        id: Date.now(),
        name: modName
    };
    config.mods.push(newMod);
    document.getElementById('newModName').value = '';
    updateModList();
    updateModSelect();
    showNotification('Mod erfolgreich hinzugefügt!', 'success');
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

function updateModSelect() {
    const modSelect = document.getElementById('modSelect');
    modSelect.innerHTML = `
        <option value="">Mod auswählen</option>
        ${config.mods.map(mod => `<option value="${mod.id}">${mod.name}</option>`).join('')}
    `;
}

window.updateModName = function(id, newName) {
    const mod = config.mods.find(m => m.id === id);
    if (mod) {
        mod.name = newName;
        updateModSelect();
        showNotification('Mod erfolgreich aktualisiert!', 'success');
    }
}

window.deleteMod = function(id) {
    if (confirm('Sind Sie sicher, dass Sie diesen Mod löschen möchten? Alle zugehörigen Tipps werden ebenfalls gelöscht.')) {
        config.mods = config.mods.filter(m => m.id !== id);
        config.hints = config.hints.filter(h => h.modId !== id);
        updateModList();
        updateModSelect();
        updateHintList();
        showNotification('Mod und zugehörige Tipps erfolgreich gelöscht!', 'success');
    }
}

// Hint Management
window.addNewHint = async function() {
    const modId = parseInt(document.getElementById('modSelect').value);
    const question = document.getElementById('hintQuestion').value.trim();
    const answer = document.getElementById('hintAnswer').value.trim();
    const design = parseInt(document.getElementById('hintDesign').value);
    const imageFile = document.getElementById('imageUpload').files[0];

    if (!modId) {
        showNotification('Bitte wählen Sie einen Mod aus', 'error');
        return;
    }
    if (!question) {
        showNotification('Bitte geben Sie eine Frage ein', 'error');
        return;
    }
    if (!answer && !imageFile) {
        showNotification('Bitte geben Sie eine Antwort ein oder laden Sie ein Bild hoch', 'error');
        return;
    }

    let finalAnswer = answer;
    if (imageFile) {
        const imageUrl = await uploadImageToGitHub(answer, `${Date.now()}_${imageFile.name}`);
        if (imageUrl) {
            finalAnswer = imageUrl;
        } else {
            return;
        }
    }

    config.hints.push({
        id: Date.now(),
        modId,
        question,
        answer: finalAnswer,
        design
    });

    // Formular zurücksetzen
    document.getElementById('hintQuestion').value = '';
    document.getElementById('hintAnswer').value = '';
    document.getElementById('imageUpload').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('hintDesign').value = '1';

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
                    <p><strong>Mod:</strong> ${mod ? mod.name : 'Unbekannt'}</p>
                    <p><strong>Frage:</strong> ${hint.question}</p>
                    <p><strong>Antwort:</strong> ${hint.answer}</p>
                </div>
                <button onclick="deleteHint(${hint.id})" class="delete-button">Löschen</button>
            </div>
        `;
    }).join('');
}

window.deleteHint = function(id) {
    if (confirm('Sind Sie sicher, dass Sie diesen Tipp löschen möchten?')) {
        config.hints = config.hints.filter(h => h.id !== id);
        updateHintList();
        showNotification('Tipp erfolgreich gelöscht!', 'success');
    }
}

// Bild-Upload Funktionen
window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Vorschau">`;
        document.getElementById('hintAnswer').value = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function uploadImageToGitHub(imageData, filename) {
    const token = sessionStorage.getItem('githubToken');
    if (!token) {
        showNotification('Bitte loggen Sie sich erneut ein', 'error');
        return null;
    }

    try {
        const response = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/assets/img/${filename}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload image: ${filename}`,
                content: imageData.split(',')[1] // Entferne den Data-URL-Teil
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Hochladen des Bildes');
        }

        const data = await response.json();
        return data.content.download_url;
    } catch (error) {
        showNotification(`Fehler beim Hochladen: ${error.message}`, 'error');
        return null;
    }
}

// Speichern
window.saveConfig = async function() {
    const token = sessionStorage.getItem('githubToken');
    if (!token) {
        showNotification('Bitte loggen Sie sich erneut ein', 'error');
        return;
    }

    try {
        // Zuerst die aktuelle Version der Datei abrufen
        const getResponse = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/config.json`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });

        let sha = '';
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }

        // Dann die Datei aktualisieren
        const response = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/config.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update config.json',
                content: btoa(JSON.stringify(config, null, 2)),
                sha: sha // SHA des aktuellen Commits, falls die Datei existiert
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Speichern');
        }

        showNotification('Konfiguration erfolgreich gespeichert!', 'success');
    } catch (error) {
        console.error('Speicherfehler:', error);
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
function initializeAdmin() {
    updateModList();
    updateModSelect();
    updateHintList();
}

// Initialisiere Admin beim Laden
window.addEventListener('load', initializeAdmin); 