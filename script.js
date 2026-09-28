// ==================== ФОНОВЫЙ ПАТТЕРН ====================
const svgIcons = [
  `<svg viewBox="0 0 50 25"><ellipse cx="25" cy="12.5" rx="22" ry="10" fill="none" stroke="white" stroke-width="2.5"/><line x1="25" y1="2.5" x2="25" y2="22.5" stroke="white" stroke-width="2"/></svg>`,
  `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="white" stroke-width="2.5"/><line x1="8" y1="20" x2="32" y2="20" stroke="white" stroke-width="2.5"/></svg>`,
  `<svg viewBox="0 0 35 55"><rect x="8" y="0" width="19" height="10" rx="2" fill="none" stroke="white" stroke-width="2"/><rect x="5" y="10" width="25" height="40" rx="3" fill="none" stroke="white" stroke-width="2"/><line x1="12" y1="28" x2="23" y2="28" stroke="white" stroke-width="2"/></svg>`,
  `<svg viewBox="0 0 60 25"><rect x="5" y="8" width="35" height="9" rx="2" fill="none" stroke="white" stroke-width="2"/><line x1="40" y1="12.5" x2="52" y2="12.5" stroke="white" stroke-width="2"/></svg>`,
  `<svg viewBox="0 0 45 22"><path d="M11 11 A11 11 0 0 1 33 11" fill="none" stroke="white" stroke-width="2.5"/></svg>`,
  `<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke="white" stroke-width="2"/><line x1="15" y1="7" x2="15" y2="23" stroke="white" stroke-width="2"/><line x1="7" y1="15" x2="23" y2="15" stroke="white" stroke-width="2"/></svg>`
];
const pattern = document.getElementById('bgPattern');
const positions = [
  {x:10,y:8,r:15},{x:22,y:15,r:-20},{x:38,y:5,r:10},{x:55,y:12,r:-15},
  {x:72,y:8,r:25},{x:88,y:15,r:-10},{x:95,y:5,r:20},{x:5,y:25,r:-25},
  {x:20,y:30,r:30},{x:38,y:28,r:-5},{x:55,y:35,r:15},{x:75,y:25,r:-20},
  {x:90,y:30,r:10},{x:8,y:45,r:-15},{x:25,y:50,r:20},{x:42,y:45,r:-10},
  {x:60,y:52,r:25},{x:78,y:48,r:-30},{x:93,y:45,r:5},{x:15,y:60,r:-20},
  {x:35,y:58,r:15},{x:52,y:62,r:-10},{x:70,y:58,r:20},{x:87,y:60,r:-15}
];
if (pattern) {
  positions.forEach((pos, i) => {
    const div = document.createElement('div');
    div.className = 'bg-icon';
    div.style.left = pos.x + '%';
    div.style.top  = pos.y + '%';
    div.style.setProperty('--rotation', pos.r + 'deg');
    div.style.animationDelay = (0.3 + i * 0.05) + 's';
    div.innerHTML = svgIcons[i % svgIcons.length];
    pattern.appendChild(div);
  });
}

// ==================== УТИЛИТЫ ====================
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function showToast(msg, type = 'info', ms = 4000) {
  const box = document.getElementById('toastBox');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast toast--' + type;
  el.innerHTML = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast--hide');
    setTimeout(() => el.remove(), 300);
  }, ms);
}
window.showToast = showToast;

// ==================== ПРЕЛОАДЕР ====================
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader')?.classList.add('preloader--hidden');
  }, 1200);
});

// ==================== БАЗА ЛЕКАРСТВ ====================
let drugDatabase = [];

const fallbackDrugs = [
  { name: "Ринастол",    activeIngredient: "Ксилометазолин", description: "Сосудосуживающее средство при насморке.", symptoms: ["насморк", "заложенность носа", "ринит"], analogs: [{name:"Ксилометазолин",price:45},{name:"Галазолин",price:60}], price: 150 },
  { name: "Парацетамол", activeIngredient: "Парацетамол",    description: "Жаропонижающее и обезболивающее.",         symptoms: ["температура", "головная боль", "жар", "боль"], analogs: [{name:"Панадол",price:80},{name:"Эффералган",price:110}], price: 25 },
  { name: "Ибупрофен",   activeIngredient: "Ибупрофен",      description: "Противовоспалительное средство.",          symptoms: ["боль", "воспаление", "температура"], analogs: [{name:"Нурофен",price:200},{name:"Миг 400",price:90}], price: 45 },
  { name: "Амоксициллин",activeIngredient: "Амоксициллин",   description: "Антибиотик широкого спектра.",             symptoms: ["ангина", "бронхит", "инфекция"], analogs: [{name:"Амоксиклав",price:250}], price: 80 },
  { name: "Лоратадин",   activeIngredient: "Лоратадин",      description: "Антигистаминный препарат.",                symptoms: ["аллергия", "зуд", "крапивница"], analogs: [{name:"Кларитин",price:220}], price: 50 }
];

async function loadDrugDatabase() {
  try {
    const res = await fetch('drugs.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('JSON должен быть массивом');
    drugDatabase = data;
    console.log('✅ База лекарств загружена из drugs.json:', drugDatabase.length, 'препаратов');
  } catch (err) {
    console.warn('⚠ Не удалось загрузить drugs.json (' + err.message + '). Использую встроенную базу.');
    drugDatabase = fallbackDrugs;
  }
}

// ==================== ХРАНИЛИЩА ====================
const KIT_KEY    = 'myKit';
const getMyKit   = () => JSON.parse(localStorage.getItem(KIT_KEY) || '[]');
const saveMyKit  = (k) => localStorage.setItem(KIT_KEY, JSON.stringify(k));

const getHistory  = () => JSON.parse(localStorage.getItem('orders') || '[]');
const saveHistory = (h) => localStorage.setItem('orders', JSON.stringify(h));

// ==================== ПОИСК ====================
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const suggestions = document.getElementById('suggestions');

function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) { showToast('Введите запрос', 'warn'); return; }

  const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  if (!history.includes(query)) {
    history.unshift(query);
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 10)));
  }

  const words = query.split(/\s+/);
  const customDrugs = JSON.parse(localStorage.getItem('customDrugs') || '[]');
  const allDrugs = [...drugDatabase, ...customDrugs];

  const results = allDrugs.filter(drug => {
    const text = (
      (drug.name || '') + ' ' +
      (drug.activeIngredient || '') + ' ' +
      (drug.symptoms || []).join(' ')
    ).toLowerCase();
    return words.every(w => text.includes(w));
  });

  renderResults(results);
  suggestions.classList.remove('active');
}

function renderResults(results) {
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = `
      <div style="background:white;border-radius:16px;padding:30px;text-align:center;max-width:800px;margin:20px auto;">
        <h3 style="color:#333;margin-bottom:10px;">Ничего не найдено 😔</h3>
        <p style="color:#888;margin-bottom:16px;">Попробуйте другой запрос или выберите из популярных:</p>
        <div class="empty-hints">
          <button class="empty-hint" data-q="насморк">🤧 Насморк</button>
          <button class="empty-hint" data-q="температура">🌡 Температура</button>
          <button class="empty-hint" data-q="аллергия">🌿 Аллергия</button>
          <button class="empty-hint" data-q="боль">💢 Боль</button>
          <button class="empty-hint" data-q="кашель">😷 Кашель</button>
        </div>
      </div>`;

    container.querySelectorAll('.empty-hint').forEach(btn => {
      btn.addEventListener('click', () => {
        searchInput.value = btn.dataset.q;
        performSearch();
      });
    });
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'cards-grid';

  results.forEach((drug, idx) => {
    const card = document.createElement('div');
    card.className = 'drug-card';
    card.innerHTML = `
      <h3>${escapeHtml(drug.name)}</h3>
      <p class="inn">${escapeHtml(drug.activeIngredient || '')}</p>
      <p class="desc">${escapeHtml(drug.description || '')}</p>
      ${drug.analogs && drug.analogs.length ? `
        <div class="analogs">
          <strong>Аналоги (дешевле):</strong>
          <ul>${drug.analogs.map(a => `<li>• ${escapeHtml(a.name)} — ${a.price} ₽</li>`).join('')}</ul>
        </div>` : ''}
      <div class="card-actions">
        <button class="btn-kit"  data-kit="${idx}">В аптечку</button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-kit]').forEach(btn =>
    btn.addEventListener('click', () => addSearchResultToKit(results[+btn.dataset.kit]))
  );

  container.appendChild(grid);
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (query.length < 2) { suggestions.classList.remove('active'); return; }

  const customDrugs = JSON.parse(localStorage.getItem('customDrugs') || '[]');
  const allDrugs = [...drugDatabase, ...customDrugs];

  const matches = allDrugs.filter(d =>
    (d.name || '').toLowerCase().includes(query) ||
    (d.activeIngredient || '').toLowerCase().includes(query)
  ).slice(0, 5);

  if (matches.length === 0) { suggestions.classList.remove('active'); return; }

  suggestions.innerHTML = matches.map(m =>
    `<div class="suggestion-item" data-name="${escapeHtml(m.name)}">${escapeHtml(m.name)} — ${escapeHtml(m.activeIngredient || '')}</div>`
  ).join('');
  suggestions.querySelectorAll('.suggestion-item').forEach(el =>
    el.addEventListener('click', () => {
      searchInput.value = el.dataset.name;
      suggestions.classList.remove('active');
      performSearch();
    })
  );
  suggestions.classList.add('active');
});

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

// ==================== МОЯ АПТЕЧКА ====================
let kitSearchQuery = '';
let kitSortMode    = 'added';
let kitFilter      = 'all';
let editingId      = null;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function getKitStatus(item) {
  if (item.quantity === 0) return 'empty';
  const d = daysUntil(item.expiry);
  if (d === null) return 'ok';
  if (d < 0)      return 'expired';
  if (d <= 30)    return 'expiring';
  return 'ok';
}

const KIT_STATUS_TEXT = {
  ok:       '✓ В норме',
  expiring: '⚠ Скоро истекает',
  expired:  '✕ Просрочено',
  empty:    '○ Закончилось'
};

function renderKitStats(kit) {
  const box = document.getElementById('kitStats');
  if (!box) return;

  const total    = kit.length;
  const okCount  = kit.filter(i => getKitStatus(i) === 'ok').length;
  const expiring = kit.filter(i => getKitStatus(i) === 'expiring').length;
  const expired  = kit.filter(i => getKitStatus(i) === 'expired').length;
  const emptyCnt = kit.filter(i => getKitStatus(i) === 'empty').length;
  const totalQty = kit.reduce((s, i) => s + (i.quantity || 0), 0);

  box.innerHTML = `
    <div class="kit-stat"><div class="kit-stat__num">${total}</div><div class="kit-stat__label">позиций</div></div>
    <div class="kit-stat"><div class="kit-stat__num">${totalQty}</div><div class="kit-stat__label">всего шт.</div></div>
    <div class="kit-stat"><div class="kit-stat__num">${okCount}</div><div class="kit-stat__label">в норме</div></div>
    <div class="kit-stat warn"><div class="kit-stat__num">${expiring}</div><div class="kit-stat__label">истекает</div></div>
    <div class="kit-stat danger"><div class="kit-stat__num">${expired}</div><div class="kit-stat__label">просрочено</div></div>
    <div class="kit-stat"><div class="kit-stat__num">${emptyCnt}</div><div class="kit-stat__label">закончилось</div></div>
  `;
}

function renderMyKit() {
  const list  = document.getElementById('kit-list');
  const empty = document.getElementById('kit-empty');
  if (!list || !empty) return;

  let kit = getMyKit();
  renderKitStats(kit);

  if (kitFilter !== 'all') kit = kit.filter(i => getKitStatus(i) === kitFilter);

  if (kitSearchQuery) {
    const q = kitSearchQuery.toLowerCase();
    kit = kit.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.purpose || '').toLowerCase().includes(q)
    );
  }

  kit = [...kit].sort((a, b) => {
    switch (kitSortMode) {
      case 'expiry': {
        const da = daysUntil(a.expiry), db = daysUntil(b.expiry);
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      }
      case 'name':     return a.name.localeCompare(b.name, 'ru');
      case 'quantity': return (b.quantity || 0) - (a.quantity || 0);
      default:         return (a.addedAt || 0) - (b.addedAt || 0);
    }
  });

  if (kit.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = (kitSearchQuery || kitFilter !== 'all')
      ? 'Ничего не найдено по заданным условиям.'
      : 'Пока пусто. Нажмите «+ Добавить лекарство».';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = kit.map(item => {
    const status = getKitStatus(item);
    const d = daysUntil(item.expiry);
    let progress = 100, progressLabel = 'Срок не указан';

    if (item.expiry) {
      progress = Math.max(0, Math.min(100, (d / 365) * 100));
      if (d < 0)         progressLabel = `Просрочено на ${Math.abs(d)} дн.`;
      else if (d === 0)  progressLabel = 'Истекает сегодня!';
      else               progressLabel = `Осталось ${d} дн.`;
    }

    return `
      <div class="kit-card ${status} ${editingId === item.id ? 'is-editing' : ''}">
        ${status === 'expiring' ? `<span class="kit-badge-expiring">Истекает</span>` : ''}
        <span class="kit-status kit-status-${status}">${KIT_STATUS_TEXT[status]}</span>
        <h3>${escapeHtml(item.name)}</h3>
        ${item.purpose ? `<p class="kit-purpose">${escapeHtml(item.purpose)}</p>` : ''}

        <div class="kit-info">
          <span>📦 ${item.quantity} шт.</span>
          ${item.expiry ? `<span>📅 ${new Date(item.expiry).toLocaleDateString('ru-RU')}</span>` : ''}
        </div>

        <div class="kit-progress">
          <div class="kit-progress__fill ${status}" style="width:${progress}%"></div>
        </div>
        <div style="font-size:11px;color:#999;margin-bottom:8px;">${progressLabel}</div>

        <div class="kit-actions">
          ${item.quantity > 0 ? `<button class="kit-btn-minus" onclick="useOneFromKit('${item.id}')">−1</button>` : ''}
          <button class="kit-btn-plus" onclick="addOneToKit('${item.id}')">+1</button>
          <button class="kit-btn-del" style="background:#4A9FD4;" onclick="editKitItem('${item.id}')">✎</button>
          <button class="kit-btn-del" onclick="removeFromMyKit('${item.id}')">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

window.useOneFromKit = function (id) {
  const kit = getMyKit();
  const it = kit.find(i => i.id === id);
  if (!it || it.quantity <= 0) return;
  it.quantity--;
  saveMyKit(kit);
  renderMyKit();
};

window.addOneToKit = function (id) {
  const kit = getMyKit();
  const it = kit.find(i => i.id === id);
  if (!it) return;
  it.quantity = (it.quantity || 0) + 1;
  saveMyKit(kit);
  renderMyKit();
};

window.removeFromMyKit = function (id) {
  const kit = getMyKit();
  const idx = kit.findIndex(i => i.id === id);
  if (idx === -1) return;
  if (!confirm(`Удалить «${kit[idx].name}» из аптечки?`)) return;
  kit.splice(idx, 1);
  saveMyKit(kit);
  renderMyKit();
};

window.editKitItem = function (id) {
  const kit = getMyKit();
  const it = kit.find(i => i.id === id);
  if (!it) return;

  editingId = id;
  document.getElementById('kitFormTitle').textContent = 'Редактирование';
  document.getElementById('kitName').value     = it.name;
  document.getElementById('kitPurpose').value  = it.purpose || '';
  document.getElementById('kitExpiry').value   = it.expiry || '';
  document.getElementById('kitQuantity').value = it.quantity ?? 1;

  const form = document.getElementById('kitForm');
  form.style.display = 'block';
  document.getElementById('kitName').focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

function showKitForm() {
  editingId = null;
  document.getElementById('kitFormTitle').textContent = 'Новая запись';
  document.getElementById('kitForm').style.display = 'block';
  document.getElementById('kitName').focus();
}
function hideKitForm() {
  editingId = null;
  document.getElementById('kitForm').style.display = 'none';
  ['kitName', 'kitPurpose', 'kitExpiry'].forEach(id =>
    document.getElementById(id).value = ''
  );
  document.getElementById('kitQuantity').value = 1;
}

function saveKitItem() {
  const name     = document.getElementById('kitName').value.trim();
  const purpose  = document.getElementById('kitPurpose').value.trim();
  const quantity = Math.max(0, parseInt(document.getElementById('kitQuantity').value, 10) || 0);
  const expiry   = document.getElementById('kitExpiry').value;

  if (!name) { showToast('Введите название лекарства', 'warn'); document.getElementById('kitName').focus(); return; }

  const kit = getMyKit();
  if (editingId) {
    const it = kit.find(i => i.id === editingId);
    if (it) {
      it.name = name; it.purpose = purpose;
      it.quantity = quantity; it.expiry = expiry;
    }
  } else {
    kit.push({ id: uid(), name, purpose, quantity, expiry, addedAt: Date.now() });
  }

  saveMyKit(kit);
  hideKitForm();
  renderMyKit();
  showToast(`✓ <strong>${escapeHtml(name)}</strong> сохранено`, 'success');
}

window.addSearchResultToKit = function (drug) {
  const kit = getMyKit();
  const existing = kit.find(i => i.name.toLowerCase() === drug.name.toLowerCase());
  if (existing) {
    existing.quantity++;
  } else {
    kit.push({
      id: uid(),
      name: drug.name,
      purpose: (drug.symptoms || []).join(', '),
      quantity: 1,
      expiry: '',
      addedAt: Date.now()
    });
  }
  saveMyKit(kit);
  showToast(`💊 <strong>${escapeHtml(drug.name)}</strong> в аптечке`, 'success');
};

// ==================== ПРОФИЛЬ ====================
function loadProfile() {
  document.getElementById('profileName').value = localStorage.getItem('profileName') || '';
  document.getElementById('profileCity').value = localStorage.getItem('profileCity') || '';
  const history = getHistory();
  const histDiv = document.getElementById('orderHistory');
  histDiv.innerHTML = history.length === 0
    ? '<p>История заказов пуста</p>'
    : '<h3 style="color:#333;margin-bottom:10px;">История заказов:</h3>' +
      history.map(o => `<p>📦 ${o.date} — ${o.total} ₽ (${o.items.length} шт.)</p>`).join('');
}

// ==================== НАВИГАЦИЯ ====================
let currentPage = 'home';
let isAnimating = false;

function switchPage(page) {
  if (page === currentPage || isAnimating) return;
  isAnimating = true;

  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.page === page)
  );

  const fromEl = document.getElementById('page-' + currentPage);
  const toEl   = document.getElementById('page-' + page);
  if (!toEl) { isAnimating = false; return; }

  if (page === 'kit')     renderMyKit();
  if (page === 'ai')      initMainChat();
  if (page === 'map')     initMap();
  if (page === 'profile') loadProfile();

  fromEl.classList.remove('page-enter');
  fromEl.classList.add('page-exit');

  setTimeout(() => {
    fromEl.style.display = 'none';
    fromEl.classList.remove('page-exit');

    toEl.style.display = 'block';
    toEl.classList.remove('page-exit');
    toEl.classList.add('page-enter');
    setTimeout(() => toEl.classList.remove('page-enter'), 500);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    isAnimating = false;
  }, 350);

  currentPage = page;
}

// ==================== ДЕЛЕГИРОВАНИЕ КЛИКОВ ====================
document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('.nav-btn');
  if (navBtn && navBtn.dataset.page) {
    e.preventDefault();
    switchPage(navBtn.dataset.page);
    return;
  }

  if (e.target.closest('#logoHome')) {
    e.preventDefault();
    switchPage('home');
    return;
  }

  if (e.target.id === 'saveProfileBtn') {
    localStorage.setItem('profileName', document.getElementById('profileName').value.trim());
    localStorage.setItem('profileCity', document.getElementById('profileCity').value.trim());
    showToast('✓ Профиль сохранён', 'success');
    return;
  }

  if (e.target.id === 'clearProfileBtn') {
    if (!confirm('Очистить все данные?')) return;
    localStorage.clear();
    loadProfile();
    renderMyKit();
    showToast('Все данные очищены', 'warn');
    return;
  }
});

// ==================== ИИ-ЧАТ ====================

function appendChatMsg(html, type = 'bot') {
  const body = document.getElementById('mainChatBody');
  if (!body) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg--' + type;
  div.innerHTML = html;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  return div;
}

function renderAiDrugCard(drug) {
  const analogsHtml = drug.analogs && drug.analogs.length
    ? `<div class="ai-drug-card__analogs"><strong>Аналоги дешевле:</strong>${drug.analogs.map(a => `${escapeHtml(a.name)} — ${a.price} ₽`).join(' · ')}</div>`
    : '';
  const safe = JSON.stringify(drug).replace(/'/g, "&#39;");

  return `
    <div class="ai-drug-card">
      <div class="ai-drug-card__name">${escapeHtml(drug.name)}</div>
      <div class="ai-drug-card__inn">${escapeHtml(drug.activeIngredient || '')}</div>
      <div class="ai-drug-card__desc">${escapeHtml(drug.description || '')}</div>
      ${drug.price ? `<div class="ai-drug-card__price">${drug.price} ₽</div>` : ''}
      ${analogsHtml}
      <div class="ai-drug-card__actions">
        <button onclick='addAiCardToKit(${safe})'>💊 В аптечку</button>
      </div>
    </div>`;
}

window.addAiCardToKit = function (drug) {
  const kit = getMyKit();
  const existing = kit.find(i => i.name.toLowerCase() === drug.name.toLowerCase());
  if (existing) {
    existing.quantity = (existing.quantity || 0) + 1;
  } else {
    kit.push({
      id: uid(),
      name: drug.name,
      purpose: drug.description || '',
      quantity: 1,
      expiry: '',
      addedAt: Date.now()
    });
  }
  saveMyKit(kit);
  showToast(`💊 ${escapeHtml(drug.name)} в аптечке`, 'success');
  renderMyKit();
};

/* ---------- Запрос к серверу ---------- */
// История диалога с Меди
let chatHistory = [];

async function askGigaChat(message) {
  const kit = getMyKit();

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      kit: kit.map(i => ({
        name: i.name,
        purpose: i.purpose,
        quantity: i.quantity
      })),
      history: chatHistory
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Сервер: ' + res.status);
  }

  const data = await res.json();

  // Сохраняем в историю — для контекста следующих сообщений
  chatHistory.push({ role: 'user', content: message });
  if (data.answer) {
    chatHistory.push({ role: 'assistant', content: data.answer });
  }

  // Ограничиваем историю — 10 последних сообщений
  if (chatHistory.length > 10) {
    chatHistory = chatHistory.slice(-10);
  }

  return data;
}

async function handleMainChat(text) {
  if (!text.trim()) return;
  appendChatMsg(escapeHtml(text), 'user');
  document.getElementById('mainChatInput').value = '';

  const typing = appendChatMsg('Печатаю…', 'typing');

  try {
    const data = await askGigaChat(text);
    typing.remove();
    if (data.drug) appendChatMsg(renderAiDrugCard(data.drug), 'bot');
    if (data.answer) appendChatMsg(escapeHtml(data.answer), 'bot');
  } catch (err) {
    typing.remove();
    appendChatMsg('⚠ Не удалось получить ответ. Проверьте, что сервер запущен.', 'bot');
    console.error(err);
  }
}

let chatInitialized = false;
function initMainChat() {
  if (chatInitialized) return;
  chatInitialized = true;

  document.getElementById('mainChatSend')?.addEventListener('click', () => {
    handleMainChat(document.getElementById('mainChatInput').value);
  });
  document.getElementById('mainChatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleMainChat(e.target.value);
  });

  appendChatMsg('Здравствуйте! 👋<br>Опишите симптом — подберу лекарство.<br>Например: «насморк», «болит голова», «температура».', 'bot');
}

// ==================== КАРТА ====================

const PHARMACIES = [
  { name: 'Аптека на Ленина', address: 'ул. Ленина, 12', phone: '+7 (999) 111-22-33', lat: 55.7558, lng: 37.6173 },
  { name: 'Аптека у метро',   address: 'пр. Мира, 45',   phone: '+7 (999) 222-33-44', lat: 55.7800, lng: 37.6300 },
  { name: 'Здоровье+',        address: 'ул. Тверская, 8',phone: '+7 (999) 333-44-55', lat: 55.7600, lng: 37.6100 },
  { name: 'Ригла',            address: 'ул. Арбат, 24',  phone: '+7 (999) 444-55-66', lat: 55.7500, lng: 37.5950 },
  { name: 'Аптеки 36.6',      address: 'ул. Пушкина, 3', phone: '+7 (999) 555-66-77', lat: 55.7650, lng: 37.6250 }
];

let mapInitialized = false;
function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;
  document.getElementById('locateBtn')?.addEventListener('click', locateUser);
}

function locateUser() {
  const container = document.getElementById('mapContainer');
  if (!navigator.geolocation) {
    container.innerHTML = '<p style="padding:20px;text-align:center;">Геолокация не поддерживается</p>';
    return;
  }
  container.innerHTML = '<p style="padding:20px;text-align:center;">📍 Определяю...</p>';
  navigator.geolocation.getCurrentPosition(
    pos => showMap(pos.coords.latitude, pos.coords.longitude),
    () => {
      container.innerHTML = '<p style="padding:20px;text-align:center;color:#e57373;">Геолокация запрещена. Показываем Москву.</p>';
      setTimeout(() => showMap(55.7558, 37.6173), 500);
    }
  );
}

function showMap(userLat, userLng) {
  if (!window.L) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => drawMap(userLat, userLng);
    document.head.appendChild(script);
  } else {
    drawMap(userLat, userLng);
  }
}

function drawMap(userLat, userLng) {
  const container = document.getElementById('mapContainer');
  container.innerHTML = '';
  container.style.display = 'block';

  const map = L.map(container).setView([userLat, userLng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(map);

  L.marker([userLat, userLng]).addTo(map).bindPopup('<strong>Вы здесь</strong>');

  const list = document.getElementById('pharmacyList');
  list.innerHTML = '<h3 style="text-align:center;margin-bottom:16px;">Аптеки рядом</h3>';

  PHARMACIES.forEach(p => {
    const dist = getDistance(userLat, userLng, p.lat, p.lng);
    L.marker([p.lat, p.lng]).addTo(map)
      .bindPopup(`<strong>${p.name}</strong><br>${p.address}<br>☎ ${p.phone}<br><b>${dist} км</b>`);

    list.innerHTML += `
      <div class="pharmacy-item">
        <div class="pharmacy-item__info">
          <h4>${p.name}</h4>
          <p>📍 ${p.address}</p>
          <p>☎ ${p.phone}</p>
        </div>
        <div class="pharmacy-item__dist">${dist} км</div>
      </div>`;
  });
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

// ==================== ОБРАБОТЧИКИ DOM ====================
document.addEventListener('DOMContentLoaded', async () => {
  await loadDrugDatabase();

  document.getElementById('kitAddBtn')?.addEventListener('click', showKitForm);
  document.getElementById('kitSaveBtn')?.addEventListener('click', saveKitItem);
  document.getElementById('kitCancelBtn')?.addEventListener('click', hideKitForm);

  document.getElementById('kitSearch')?.addEventListener('input', (e) => {
    kitSearchQuery = e.target.value.trim();
    renderMyKit();
  });

  document.getElementById('kitSort')?.addEventListener('change', (e) => {
    kitSortMode = e.target.value;
    renderMyKit();
  });

  document.getElementById('kitFilters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.kit-chip');
    if (!chip) return;
    document.querySelectorAll('.kit-chip').forEach(c =>
      c.classList.toggle('active', c === chip)
    );
    kitFilter = chip.dataset.filter;
    renderMyKit();
  });

  document.getElementById('kitName')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveKitItem();
  });

  document.getElementById('addDrugBtn')?.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'kit-modal';
    modal.innerHTML = `
      <div class="kit-modal__box" style="max-width:500px;">
        <h2 class="kit-modal__title">Добавить лекарство</h2>
        <label class="kit-modal__label">Название *</label>
        <input type="text" id="newDrugName" class="profile-input" placeholder="Название">
        <label class="kit-modal__label">Симптом</label>
        <input type="text" id="newDrugSymptom" class="profile-input" placeholder="Что лечит">
        <div class="kit-modal__actions">
          <button id="newDrugCancel" class="kit-btn-cancel">Отмена</button>
          <button id="newDrugSave"   class="kit-btn-save">Добавить</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('newDrugCancel').onclick = () => modal.remove();
    document.getElementById('newDrugSave').onclick = () => {
      const name    = document.getElementById('newDrugName').value.trim();
      const symptom = document.getElementById('newDrugSymptom').value.trim();
      if (!name) { showToast('Введите название', 'warn'); return; }
      const custom = JSON.parse(localStorage.getItem('customDrugs') || '[]');
      custom.push({
        name,
        activeIngredient: 'Не указано',
        description: 'Добавлено пользователем',
        symptoms: symptom ? [symptom.toLowerCase()] : [],
        analogs: [],
        price: 0
      });
      localStorage.setItem('customDrugs', JSON.stringify(custom));
      modal.remove();
      showToast(`✓ <strong>${escapeHtml(name)}</strong> добавлено в базу`, 'success');
    };
  });

  // Проверка сроков при входе
  setTimeout(() => {
    const kit = getMyKit();
    const expiring = kit.filter(i => getKitStatus(i) === 'expiring').length;
    const expired  = kit.filter(i => getKitStatus(i) === 'expired').length;
    if (expiring || expired) {
      let msg = '';
      if (expired)  msg += `🔴 Просрочено: ${expired}<br>`;
      if (expiring) msg += `🟠 Скоро истекает: ${expiring}<br>`;
      msg += '<small>Зайдите в «Мою аптечку» →</small>';
      showToast(msg, 'warn', 8000);
    }
  }, 2500);
});
// ==================== АВТОРИЗАЦИЯ ====================
let currentUser = null;
let authToken = localStorage.getItem('authToken') || null;

/* ---------- Открытие/закрытие модалки ---------- */
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Переключение вкладок
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';

  // Очистка ошибок
  document.getElementById('loginError').textContent = '';
  document.getElementById('regError').textContent = '';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

/* ---------- Обновление UI после входа/выхода ---------- */
function updateAuthUI() {
  const authBox = document.getElementById('authBox');
  const userBox = document.getElementById('userBox');
  const userName = document.getElementById('userName');

  if (currentUser) {
    authBox.style.display = 'none';
    userBox.style.display = 'flex';
    userName.textContent = currentUser.name || currentUser.email;
  } else {
    authBox.style.display = 'flex';
    userBox.style.display = 'none';
  }
}

/* ---------- Загрузка текущего пользователя ---------- */
async function loadCurrentUser() {
  if (!authToken) return;
  try {
    const res = await fetch('/api/me', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      updateAuthUI();
      await syncFromServer();
    } else {
      // Токен истёк
      authToken = null;
      localStorage.removeItem('authToken');
    }
  } catch (e) {
    console.warn('Не удалось загрузить пользователя:', e.message);
  }
}

/* ---------- Регистрация ---------- */
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('regError');
  errEl.textContent = '';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Ошибка регистрации';
      return;
    }

    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    currentUser = data.user;
    updateAuthUI();
    closeAuthModal();
    showToast(`🎉 Добро пожаловать, ${escapeHtml(name)}!`, 'success');
    await syncToServer();
  } catch (err) {
    errEl.textContent = 'Ошибка соединения с сервером';
    console.error(err);
  }
});

/* ---------- Вход ---------- */
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Ошибка входа';
      return;
    }

    authToken = data.token;
    localStorage.setItem('authToken', authToken);
    currentUser = data.user;
    updateAuthUI();
    closeAuthModal();
    showToast(`👋 С возвращением, ${escapeHtml(currentUser.name || currentUser.email)}!`, 'success');
    await syncFromServer();
  } catch (err) {
    errEl.textContent = 'Ошибка соединения с сервером';
    console.error(err);
  }
});

/* ---------- Выход ---------- */
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  if (!confirm('Выйти из аккаунта?')) return;
  try {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
  } catch {}
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  updateAuthUI();
  showToast('Вы вышли из аккаунта', 'info');
});

/* ---------- Переключение вкладок ---------- */
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => openAuthModal(tab.dataset.tab));
});

document.getElementById('loginBtn')?.addEventListener('click', () => openAuthModal('login'));
document.getElementById('authClose')?.addEventListener('click', closeAuthModal);
document.getElementById('authModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'authModal') closeAuthModal();
});

/* ---------- Синхронизация с сервером ---------- */
async function syncToServer() {
  if (!authToken || !currentUser) return;
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      body: JSON.stringify({
        kit: getMyKit(),
        profile: {
          name: localStorage.getItem('profileName') || '',
          city: localStorage.getItem('profileCity') || ''
        },
        chatHistory: []
      })
    });
  } catch (e) {
    console.warn('Синхронизация не удалась:', e.message);
  }
}

async function syncFromServer() {
  if (!authToken || !currentUser) return;
  try {
    const res = await fetch('/api/sync', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    if (!res.ok) return;
    const data = await res.json();

    if (Array.isArray(data.kit) && data.kit.length > 0) {
      saveMyKit(data.kit);
      renderMyKit();
    }
    if (data.profile && data.profile.name) {
      localStorage.setItem('profileName', data.profile.name);
      localStorage.setItem('profileCity', data.profile.city || '');
    }
    showToast('📥 Данные синхронизированы', 'success', 2500);
  } catch (e) {
    console.warn('Загрузка не удалась:', e.message);
  }
}

/* ---------- Запуск при загрузке ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadCurrentUser();
});

// Автосохранение на сервер при изменениях аптечки
const _originalSaveMyKit = saveMyKit;
window.saveMyKit = function(kit) {
  _originalSaveMyKit(kit);
  if (authToken && currentUser) syncToServer();
};

console.log('✅ Сайт работает');