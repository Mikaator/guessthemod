// Globale Variablen
window.GITHUB_API_URL = 'https://api.github.com';
window.REPO_OWNER = 'Mikaator';
window.REPO_NAME = 'guessthemod';

// Authentifizierungsfunktion
window.authenticate = async function() {
    const token = document.getElementById('githubToken').value;
    if (!token) {
        alert('Bitte geben Sie einen GitHub Token ein');
        return;
    }

    try {
        // Prüfe Benutzeridentität
        const userResponse = await fetch(`${GITHUB_API_URL}/user`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            throw new Error(`Ungültiger Token: ${errorData.message}`);
        }

        const user = await userResponse.json();
        console.log('Eingeloggt als:', user.login);

        // Prüfe Repository-Zugriff
        const repoResponse = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!repoResponse.ok) {
            const errorData = await repoResponse.json();
            throw new Error(`Repository-Zugriff fehlgeschlagen: ${errorData.message}`);
        }

        const repo = await repoResponse.json();
        console.log('Repository gefunden:', repo.full_name);

        // Prüfe ob Benutzer der Owner ist
        if (repo.owner.login !== user.login) {
            throw new Error(`Sie sind nicht der Owner des Repositories. Aktueller Owner: ${repo.owner.login}`);
        }

        // Speichere Token temporär
        sessionStorage.setItem('githubToken', token);
        
        // Zeige Admin-Interface
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('adminContainer').style.display = 'block';

    } catch (error) {
        console.error('Authentifizierungsfehler:', error);
        alert(`Fehler bei der Authentifizierung: ${error.message}`);
    }
}

// Prüfe ob bereits eingeloggt
window.checkAuthStatus = function() {
    const token = sessionStorage.getItem('githubToken');
    if (token) {
        document.getElementById('githubToken').value = token;
        authenticate();
    }
}

// Initialisiere Auth beim Laden
window.addEventListener('load', checkAuthStatus); 