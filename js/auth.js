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
                'Authorization': `token ${token}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('Ungültiger Token');
        }

        const user = await userResponse.json();

        // Prüfe Repository-Zugriff
        const repoResponse = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });

        if (!repoResponse.ok) {
            throw new Error('Kein Zugriff auf das Repository');
        }

        const repo = await repoResponse.json();

        // Prüfe ob Benutzer der Owner ist
        if (repo.owner.login !== user.login) {
            throw new Error('Sie sind nicht der Owner des Repositories');
        }

        // Speichere Token temporär
        sessionStorage.setItem('githubToken', token);
        
        // Zeige Admin-Interface
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('adminContainer').style.display = 'block';

    } catch (error) {
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