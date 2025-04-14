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
    
    // Überprüfen ob Mods vorhanden sind
    if (config.mods.length === 0) {
        modList.innerHTML = '<p>Keine Mods vorhanden. Fügen Sie Mods hinzu oder importieren Sie eine CSV-Datei.</p>';
        return;
    }
    
    modList.innerHTML = config.mods.map(mod => `
        <div class="mod-item" data-id="${mod.id}">
            <input type="text" value="${mod.name}" onchange="updateModName(${mod.id}, this.value)">
            <button onclick="deleteMod(${mod.id})" class="delete-button">Löschen</button>
        </div>
    `).join('');
    
    // Debug-Ausgabe
    console.log(`Insgesamt ${config.mods.length} Mods angezeigt.`);
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
    
    // Überprüfen ob Tipps vorhanden sind
    if (config.hints.length === 0) {
        hintList.innerHTML = '<p>Keine Tipps vorhanden. Fügen Sie Tipps hinzu oder importieren Sie eine CSV-Datei.</p>';
        return;
    }
    
    // Maximale Anzahl der anzuzeigenden Tipps (alle anzeigen)
    const allHints = config.hints;
    
    // Erstelle HTML für die Tipps
    const hintsHTML = allHints.map(hint => {
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
    
    hintList.innerHTML = hintsHTML;
    
    // Debug-Ausgabe
    console.log(`Insgesamt ${allHints.length} Tipps angezeigt.`);
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

// Speichere Konfiguration als Datei
window.saveConfig = function() {
    try {
        // Erstelle Blob mit der Konfiguration
        const configBlob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        
        // Erstelle Download-Link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(configBlob);
        downloadLink.download = 'config.json';
        
        // Füge Link zum Dokument hinzu und klicke ihn
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Aufräumen
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href);
        
        showNotification('Konfiguration wurde heruntergeladen', 'success');
    } catch (error) {
        console.error('Speicherfehler:', error);
        showNotification('Fehler beim Herunterladen der Konfiguration', 'error');
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

// CSV Import Funktionen
function processCSVData(rows, headers) {
    // Leere vorhandene Daten
    config.mods = [];
    config.hints = [];
    
    console.log(`Verarbeite ${rows.length} Zeilen`);
    
    // Erstelle Basiszeit für IDs, um Überschneidungen zu vermeiden
    // Verwende eine eindeutige Basis-ID für jede Importaktion
    const baseTime = Date.now();
    
    // Verarbeite jede Zeile (außer Header)
    for (let i = 1; i < rows.length; i++) {
        try {
            // Parse Zeile mit einer verbesserten Methode
            const cells = [];
            let inQuotes = false;
            let currentCell = '';
            const rowStr = rows[i];
            
            for (let j = 0; j < rowStr.length; j++) {
                const char = rowStr[j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cells.push(currentCell.trim());
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
            if (currentCell) cells.push(currentCell.trim());
            
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
            
            // Erstelle eindeutige ID für diesen Mod mit großem Abstand
            const modId = baseTime + (i * 100000);
            
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
                
                // Noch eindeutigere ID für Tipps
                const hintId = baseTime + (i * 100000) + (j * 1000);
                
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
        } catch (error) {
            console.error(`Fehler bei Zeile ${i}:`, error);
        }
    }
    
    console.log(`CSV-Import abgeschlossen: ${config.mods.length} Mods und ${config.hints.length} Tipps`);
    
    // Aktualisiere die Listen in der UI
    updateModList();
    updateModSelect();
    updateHintList();
    
    showNotification(`${config.mods.length} Mods und ${config.hints.length} Tipps erfolgreich importiert!`, 'success');
}

// Füge diese Hilfsfunktion hinzu, um mit UTF-8 Zeichen umzugehen
function decodeUTF8(str) {
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}

// Modifiziere die handleCSVImport Funktion
window.handleCSVImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        // Teile die CSV-Datei in Zeilen
        const rows = csvData.split('\n').map(row => row.trim()).filter(row => row);
        
        // Extrahiere die Headers (erste Zeile)
        const headerLine = rows[0];
        const headers = headerLine.split('"').filter((_, index) => index % 2 === 1);
        
        // Zeige Vorschau
        const preview = document.getElementById('csvPreview');
        let previewHTML = '<table>';
        
        // Header
        previewHTML += '<tr>';
        headers.forEach(header => {
            previewHTML += `<th>${header}</th>`;
        });
        previewHTML += '</tr>';
        
        // Daten
        for (let i = 1; i < Math.min(rows.length, 6); i++) {
            const cells = rows[i].split('"').filter((_, index) => index % 2 === 1);
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
        
        // Verarbeite die Daten
        processCSVData(rows, headers);
    };
    reader.readAsText(file);
} 