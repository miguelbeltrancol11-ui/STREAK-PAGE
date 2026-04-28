const COOLDOWN = 24 * 60 * 60 * 1000;
const EXPIRE = 48 * 60 * 60 * 1000;

// --- NAVEGACIÓN Y POPUP ---
function showTab(tab) {
    document.getElementById('tab-dashboard').classList.toggle('hidden', tab !== 'dashboard');
    document.getElementById('tab-profile').classList.toggle('hidden', tab !== 'profile');
    document.getElementById('nav-dash').classList.toggle('active', tab === 'dashboard');
    document.getElementById('nav-prof').classList.toggle('active', tab === 'profile');
}

function closePopup() {
    document.getElementById('welcome-popup').classList.add('hidden');
    localStorage.setItem('popup-visto', 'true');
}

// --- PERFIL ---
function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => {
        localStorage.setItem('user-avatar', reader.result);
        document.getElementById('profile-img-preview').src = reader.result;
        document.getElementById('dash-avatar').src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

function saveProfile() {
    localStorage.setItem('username', document.getElementById('input-username').value);
    localStorage.setItem('bio', document.getElementById('input-bio').value);
    document.getElementById('dash-username').innerText = localStorage.getItem('username') || "Usuario";
    alert("¡Perfil Guardado!");
}

function loadProfileData() {
    const name = localStorage.getItem('username') || "";
    const avatar = localStorage.getItem('user-avatar') || "https://via.placeholder.com/150";
    document.getElementById('dash-username').innerText = name || "Usuario";
    document.getElementById('dash-avatar').src = avatar;
    document.getElementById('input-username').value = name;
    document.getElementById('input-bio').value = localStorage.getItem('bio') || "";
    document.getElementById('profile-img-preview').src = avatar;
}

// --- LÓGICA DE RACHAS ---
function handleStreak(id) {
    const name = getNameById(id);
    const waitingKey = `waiting_${id}`;
    
    if (name.includes('@') && !localStorage.getItem(waitingKey)) {
        localStorage.setItem(waitingKey, "true");
        renderCustomStreaks();
        return;
    }

    const now = Date.now();
    let val = (parseInt(localStorage.getItem(`val_${id}`)) || 0) + 1;

    localStorage.setItem(`val_${id}`, val);
    localStorage.setItem(`lock_${id}`, now + COOLDOWN);
    localStorage.setItem(`lastClick_${id}`, now);
    localStorage.removeItem(waitingKey);

    if(id === 'personal') {
        document.getElementById('streak-personal').innerText = val;
        startTimer('personal', now + COOLDOWN);
    } else {
        renderCustomStreaks();
    }
}

function checkExpiration(id) {
    const now = Date.now();
    const last = parseInt(localStorage.getItem(`lastClick_${id}`));
    if (last && (now - last) > EXPIRE) {
        localStorage.setItem(`val_${id}`, 0);
        localStorage.removeItem(`lock_${id}`);
        localStorage.removeItem(`lastClick_${id}`);
        return 0;
    }
    return localStorage.getItem(`val_${id}`) || 0;
}

function startTimer(id, unlockTime) {
    const btn = document.getElementById(`btn-${id}`);
    const timerText = document.getElementById(`timer-${id}`);
    if(!btn) return;

    const interval = setInterval(() => {
        const diff = unlockTime - Date.now();
        if (diff <= 0) {
            btn.disabled = false;
            btn.innerText = "¡Día Completado!";
            timerText.innerText = "⚠️ ¡No pierdas la racha!";
            clearInterval(interval);
        } else {
            btn.disabled = true;
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff%3600000)/60000);
            btn.innerText = "Bloqueado 🔒";
            timerText.innerText = `Próximo en: ${h}h ${m}m`;
        }
    }, 1000);
}

// --- GESTIÓN DINÁMICA ---
function addNewStreak() {
    const name = document.getElementById('new-streak-name').value;
    if(!name) return;
    const id = 's_' + Date.now();
    let streaks = JSON.parse(localStorage.getItem('custom-streaks') || "[]");
    streaks.push({id, name});
    localStorage.setItem('custom-streaks', JSON.stringify(streaks));
    document.getElementById('new-streak-name').value = "";
    renderCustomStreaks();
    showTab('dashboard');
}

function renderCustomStreaks() {
    const container = document.getElementById('dynamic-streaks-container');
    const streaks = JSON.parse(localStorage.getItem('custom-streaks') || "[]");
    
    container.innerHTML = streaks.map(s => {
        const val = checkExpiration(s.id);
        const waiting = localStorage.getItem(`waiting_${s.id}`);
        return `
            <div class="friend-streak">
                <div class="top-row"><strong>${s.name}</strong> <button class="delete-btn" onclick="deleteStreak('${s.id}')">✕</button></div>
                <div style="font-size: 2rem; color: #ff0081; margin: 10px 0;">${val} días</div>
                <button onclick="handleStreak('${s.id}')" id="btn-${s.id}" class="action-btn ${waiting ? 'waiting-mode' : ''}">
                    ${waiting ? 'Esperando @...' : 'Check'}
                </button>
                <p id="timer-${s.id}" class="timer-text"></p>
                <button class="reset-btn" onclick="resetStreak('${s.id}')">Reiniciar</button>
            </div>
        `;
    }).join('');

    streaks.forEach(s => {
        const lock = localStorage.getItem(`lock_${s.id}`);
        if(lock && parseInt(lock) > Date.now()) startTimer(s.id, parseInt(lock));
    });
}

function resetStreak(id) { if(confirm("¿Reiniciar?")) { localStorage.setItem(`val_${id}`, 0); location.reload(); } }
function deleteStreak(id) {
    let streaks = JSON.parse(localStorage.getItem('custom-streaks') || "[]");
    localStorage.setItem('custom-streaks', JSON.stringify(streaks.filter(s => s.id !== id)));
    renderCustomStreaks();
}

function getNameById(id) {
    if(id==='personal') return 'Personal';
    return (JSON.parse(localStorage.getItem('custom-streaks') || "[]").find(s => s.id === id) || {}).name || "";
}

window.onload = () => {
    loadProfileData();
    if (!localStorage.getItem('popup-visto')) setTimeout(() => document.getElementById('welcome-popup').classList.remove('hidden'), 1000);
    
    const pVal = checkExpiration('personal');
    document.getElementById('streak-personal').innerText = pVal;
    const pLock = localStorage.getItem('lock_personal');
    if(pLock && parseInt(pLock) > Date.now()) startTimer('personal', parseInt(pLock));
    
    renderCustomStreaks();
};