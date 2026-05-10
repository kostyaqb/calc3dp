let db = { printers: [], plastics: [], settings: { rejectCoef: 1.2, operatorCost: 100, markup: 1.5 } };

window.onload = async function() {
    await checkAuthStatus();
    await loadData();
};

async function loadData() {
    try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Ошибка сети');
        const data = await res.json();
        
        db.printers = data.printers || [];
        db.plastics = data.plastics || [];
        db.settings = data.settings || db.settings;
        
        renderSelectors();
        if (sessionStorage.getItem('isAdmin') === 'true') {
            renderAdminLists();
            renderSettings();
        }
    } catch (e) { console.error("Ошибка загрузки:", e); }
}

function renderSelectors() {
    document.getElementById('printerSelect').innerHTML = 
        db.printers.map(p => `<option value="${p.id}">${p.name}</option>`).join('') || '<option>Нет принтеров</option>';
    const types = [...new Set(db.plastics.map(p => p.type))];
    document.getElementById('plasticTypeSelect').innerHTML = 
        types.map(t => `<option value="${t}">${t}</option>`).join('') || '<option>Нет материалов</option>';
    updateColors();
}
function updateColors() {
    const type = document.getElementById('plasticTypeSelect').value;
    const filtered = db.plastics.filter(p => p.type === type);
    document.getElementById('plasticColorSelect').innerHTML = 
        filtered.map(p => `<option value="${p.id}">${p.color}</option>`).join('') || '<option>Нет цветов</option>';
}
document.getElementById('plasticTypeSelect')?.addEventListener('change', updateColors);

// ===== АВТОРИЗАЦИЯ =====
function openModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('adminPass').value = '';
    document.getElementById('passError').style.display = 'none';
}
function closeModal() { document.getElementById('loginModal').style.display = 'none'; }

async function checkPass() {
    const password = document.getElementById('adminPass').value;
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            sessionStorage.setItem('isAdmin', 'true');
            closeModal();
            showAdmin();
            await loadData();
        } else {
            document.getElementById('passError').style.display = 'block';
        }
    } catch (e) { alert('Ошибка подключения'); }
}

async function checkAuthStatus() {
    try {
        const res = await fetch('/api/auth-status');
        const data = await res.json();
        if (data.isAdmin) {
            sessionStorage.setItem('isAdmin', 'true');
            showAdmin();
        }
    } catch (e) { console.error(e); }
}

function showAdmin() {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminBtn').style.display = 'none';
}
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    sessionStorage.removeItem('isAdmin');
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminBtn').style.display = 'block';
}

// ===== НАСТРОЙКИ =====
function renderSettings() {
    document.getElementById('sReject').value = db.settings.rejectCoef;
    document.getElementById('sOperator').value = db.settings.operatorCost;
    document.getElementById('sMarkup').value = db.settings.markup;
}
async function saveSettings() {
    db.settings = {
        rejectCoef: parseFloat(document.getElementById('sReject').value),
        operatorCost: parseFloat(document.getElementById('sOperator').value),
        markup: parseFloat(document.getElementById('sMarkup').value)
    };
    await fetch('/api/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(db.settings) });
    alert('Настройки сохранены');
}

// ===== АДМИН-ПАНЕЛЬ =====
function calcHourlyRate(p) {
    const hours = p.hoursPerMonth || 120;
    const dep = p.cost / (p.life * 12) / hours;
    const elecRate = p.electricityCost || 5.5; // Берём тариф из данных принтера
    const elec = (p.power / 1000) * elecRate;
    const serv = p.service / hours;
    return dep + elec + serv;
}

function renderAdminLists() {
    document.getElementById('printersList').innerHTML = db.printers.map(p => `
        <div class="itemBlock">
            <div class="itemInfo">
                <strong>${p.name}</strong>
                <span>Цена: ${p.cost} ₽ | Мощн: ${p.power} Вт</span>
                <span>Обслуж: ${p.service} ₽/мес | Срок: ${p.life} лет</span>
                <span style="color:#1565c0; font-weight:600; margin-top:4px; display:block;">⏱ Стоимость часа: ${calcHourlyRate(p).toFixed(2)} ₽</span>
            </div>
            <button class="deleteBtn" onclick="deletePrinter('${p.id}')">Удалить</button>
        </div>
    `).join('');

    document.getElementById('plasticsList').innerHTML = db.plastics.map(p => `
        <div class="itemBlock">
            <div class="itemInfo">
                <strong>${p.type} (${p.color})</strong>
                <span>Цена: ${p.price} ₽/кг</span>
            </div>
            <button class="deleteBtn" onclick="deletePlastic('${p.id}')">Удалить</button>
        </div>
    `).join('');
}

async function addPrinter() {
    const data = {
        name: document.getElementById('pName').value.trim(),
        cost: parseFloat(document.getElementById('pCost').value),
        power: parseFloat(document.getElementById('pPower').value),
        service: parseFloat(document.getElementById('pService').value),
        life: parseFloat(document.getElementById('pLife').value) || 2,
        electricityCost: parseFloat(document.getElementById('pElectricity').value) || 5.5,
        hoursPerMonth: 120
    };
    if (!data.name || isNaN(data.cost)) return alert("Заполните название и стоимость");
    
    await fetch('/api/printer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    await loadData();
    
    // Очистка формы
    document.querySelectorAll('#adminPanel .addForm input').forEach(i => i.value = '');
    document.getElementById('pLife').value = 2;
    document.getElementById('pElectricity').value = 5.5;
}

async function deletePrinter(id) {
    if (!confirm('Удалить принтер?')) return;
    try {
        const res = await fetch(`/api/printer/${id}`, { method: 'DELETE' });
        if (res.ok) await loadData();
    } catch (e) { alert('Ошибка удаления'); }
}

async function addPlastic() {
    const data = {
        type: document.getElementById('plType').value,
        color: document.getElementById('plColor').value.trim(),
        price: parseFloat(document.getElementById('plPrice').value)
    };
    if (!data.color || isNaN(data.price)) return alert("Заполните цвет и цену");
    
    await fetch('/api/plastic', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    await loadData();
    document.getElementById('plColor').value = '';
    document.getElementById('plPrice').value = '';
}

async function deletePlastic(id) {
    if (!confirm('Удалить материал?')) return;
    try {
        const res = await fetch(`/api/plastic/${id}`, { method: 'DELETE' });
        if (res.ok) await loadData();
    } catch (e) { alert('Ошибка удаления'); }
}

// ===== КАЛЬКУЛЯЦИЯ =====
function calculateCost() {
    const printer = db.printers.find(p => p.id === document.getElementById('printerSelect').value);
    const plastic = db.plastics.find(p => p.id === document.getElementById('plasticColorSelect').value);
    if (!printer || !plastic) return alert("Выберите принтер и пластик");

    const weight = parseFloat(document.getElementById('weightInput').value) || 0;
    const hours = parseFloat(document.getElementById('hoursInput').value) || 0;
    const mins = parseFloat(document.getElementById('minsInput').value) || 0;
    const time = hours + mins / 60;

    const material = Math.ceil((weight / 1000) * plastic.price);
    const printing = Math.ceil(calcHourlyRate(printer) * time);
    const base = material + printing;
    const totalRaw = (base * db.settings.rejectCoef + db.settings.operatorCost) * db.settings.markup;
    const total = Math.ceil(totalRaw / 10) * 10;

    document.getElementById('resultBlock').style.display = 'block';
    document.getElementById('resultTotal').innerText = `Итого: ${total} ₽`;
}