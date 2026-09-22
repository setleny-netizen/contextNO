// ============================================================
// ЛОХМАТЫЙ КЛУБ — логика (три экрана + localStorage)
// ============================================================

const STORAGE_KEY = 'lohmaty_club_state_v1';

// ---------- Состояние ----------
function defaultState() {
  return {
    balance: 0,
    totalEarned: 0,
    totalClicks: 0,
    clickLevels: {},
    passiveLevels: {},
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (e) {
    console.warn('Не удалось загрузить сохранение, стартуем с нуля', e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Не удалось сохранить', e);
  }
}

const state = loadState();

// ---------- Справочники улучшений ----------
const CLICK_UPGRADES = [
  { id: 'pick',    name: 'Крепкая кирка', bonus: 1,   basePrice: 50 },
  { id: 'iceaxe',  name: 'Ледоруб',        bonus: 5,   basePrice: 500 },
  { id: 'crew',    name: 'Бригада',        bonus: 15,  basePrice: 5000 },
  { id: 'drill',   name: 'Бур',            bonus: 50,  basePrice: 50000 },
  { id: 'breaker', name: 'Ледокол',        bonus: 200, basePrice: 500000 },
];

const PASSIVE_UPGRADES = [
  { id: 'fridge',     name: 'Холодильник',     bonus: 1,   basePrice: 100 },
  { id: 'freezer',    name: 'Морозилка',       bonus: 5,   basePrice: 1000 },
  { id: 'glacier',    name: 'Ледник',          bonus: 25,  basePrice: 10000 },
  { id: 'farm',       name: 'Айсберг-ферма',   bonus: 100, basePrice: 100000 },
  { id: 'permafrost', name: 'Вечная мерзлота', bonus: 500, basePrice: 1000000 },
];

// ---------- DOM ----------
const topbar        = document.getElementById('topbar');
const screensBox    = document.getElementById('screens');
const balanceEl     = document.getElementById('balance');
const balanceRateEl = document.getElementById('balanceRate');
const wrap          = document.getElementById('icebergWrap');
const svg           = document.getElementById('icebergSvg');
const layer         = document.getElementById('cubesLayer');
const upgradesList  = document.getElementById('upgradesList');
const navButtons    = document.querySelectorAll('.nav-btn');
const tabs          = document.querySelectorAll('.tab');
const screens       = document.querySelectorAll('.screen');

let activeUpgradeTab = 'click';
let currentScreen    = 'earn';

// ---------- Форматирование ----------
function formatNumber(n) {
  return Math.floor(n).toLocaleString('ru-RU');
}

// ---------- Бонусы ----------
function getClickBonus() {
  return 1 + CLICK_UPGRADES.reduce((sum, u) => {
    const lvl = state.clickLevels[u.id] || 0;
    return sum + u.bonus * lvl;
  }, 0);
}

function getPassiveBonus() {
  return PASSIVE_UPGRADES.reduce((sum, u) => {
    const lvl = state.passiveLevels[u.id] || 0;
    return sum + u.bonus * lvl;
  }, 0);
}

function getUpgradePrice(upgrade, level) {
  return Math.floor(upgrade.basePrice * Math.pow(1.15, level));
}

// ---------- UI ----------
function updateBalanceUI() {
  balanceEl.textContent = formatNumber(state.balance);
  balanceRateEl.textContent = `+${formatNumber(getPassiveBonus())} / сек`;
}

function updateProfileUI() {
  document.getElementById('statTotalEarned').textContent = formatNumber(state.totalEarned);
  document.getElementById('statClicks').textContent      = formatNumber(state.totalClicks);
  document.getElementById('statBalance').textContent     = formatNumber(state.balance);
  document.getElementById('statRate').textContent        = formatNumber(getPassiveBonus());
  document.getElementById('statClickBonus').textContent  = formatNumber(getClickBonus());
}

// ---------- Переключение экранов ----------
function switchScreen(name) {
  currentScreen = name;

  // Экраны
  screens.forEach((s) => s.classList.remove('screen--active'));
  document.getElementById(`screen-${name}`)?.classList.add('screen--active');

  // Нижнее меню
  navButtons.forEach((btn) => {
    if (btn.dataset.tab === name) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Верхняя панель
  if (name === 'profile') {
    topbar.classList.add('hidden');
    topbar.classList.remove('compact');
    screensBox.classList.add('full');
  } else if (name === 'upgrades') {
    topbar.classList.remove('hidden');
    topbar.classList.add('compact');
    screensBox.classList.remove('full');
    renderUpgrades();
  } else { // earn
    topbar.classList.remove('hidden');
    topbar.classList.remove('compact');
    screensBox.classList.remove('full');
  }

  if (name === 'profile') updateProfileUI();
}

// ---------- Клик по айсбергу ----------
let lastClick = 0;
const CLICK_COOLDOWN = 60;

svg.addEventListener('pointerdown', (e) => {
  const now = performance.now();
  if (now - lastClick < CLICK_COOLDOWN) return;
  lastClick = now;

  wrap.classList.remove('hit');
  void wrap.offsetWidth;
  wrap.classList.add('hit');

  spawnCrack(e.clientX, e.clientY);

  const reward = getClickBonus();
  spawnCube(e.clientX, e.clientY, reward);

  state.totalClicks += 1;
  saveState();
});

function spawnCrack(x, y) {
  const crack = document.createElement('div');
  crack.className = 'crack';
  crack.style.left = x + 'px';
  crack.style.top  = y + 'px';
  document.body.appendChild(crack);
  setTimeout(() => crack.remove(), 400);
}

function spawnCube(startX, startY, reward) {
  const cube = document.createElement('div');
  cube.className = 'cube';
  cube.style.left = startX + 'px';
  cube.style.top  = startY + 'px';

  const target  = balanceEl.getBoundingClientRect();
  const targetX = target.left + target.width  / 2;
  const targetY = target.top  + target.height / 2;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const jitter = (Math.random() - 0.5) * 60;

  cube.style.setProperty('--dx', dx + 'px');
  cube.style.setProperty('--dy', dy + 'px');
  cube.style.setProperty('--jx', jitter + 'px');

  layer.appendChild(cube);

  cube.addEventListener('animationend', () => {
    state.balance     += reward;
    state.totalEarned += reward;
    updateBalanceUI();
    saveState();
    balanceEl.classList.remove('pulse');
    void balanceEl.offsetWidth;
    balanceEl.classList.add('pulse');
    cube.remove();
  });
}

// ---------- Пассивная добыча ----------
setInterval(() => {
  const income = getPassiveBonus();
  if (income > 0) {
    state.balance     += income;
    state.totalEarned += income;
    updateBalanceUI();
    saveState();
  }
}, 1000);

// ---------- Табы улучшений ----------
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('tab--active'));
    tab.classList.add('tab--active');
    activeUpgradeTab = tab.dataset.tabTarget;
    renderUpgrades();
  });
});

// ---------- Рендер улучшений ----------
function renderUpgrades() {
  const list   = activeUpgradeTab === 'click' ? CLICK_UPGRADES : PASSIVE_UPGRADES;
  const levels = activeUpgradeTab === 'click' ? state.clickLevels : state.passiveLevels;
  const suffix = activeUpgradeTab === 'click' ? 'к клику' : 'в секунду';

  upgradesList.innerHTML = '';

  list.forEach((upgrade) => {
    const level  = levels[upgrade.id] || 0;
    const price  = getUpgradePrice(upgrade, level);
    const canBuy = state.balance >= price;

    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `
      <div class="upgrade-card__icon">+${upgrade.bonus}</div>
      <div class="upgrade-card__info">
        <div class="upgrade-card__name">${upgrade.name}</div>
        <div class="upgrade-card__desc">+${upgrade.bonus} ${suffix}</div>
        <div class="upgrade-card__level">Уровень: ${level}</div>
      </div>
      <div class="upgrade-card__action">
        <button class="buy-btn" type="button" data-buy="${upgrade.id}" ${canBuy ? '' : 'disabled'}>
          Купить
          <span class="buy-btn__price">${formatNumber(price)}</span>
        </button>
      </div>
    `;

    upgradesList.appendChild(card);
  });
}

// ---------- Покупка ----------
upgradesList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-buy]');
  if (!btn || btn.disabled) return;

  const id      = btn.dataset.buy;
  const list    = activeUpgradeTab === 'click' ? CLICK_UPGRADES : PASSIVE_UPGRADES;
  const levels  = activeUpgradeTab === 'click' ? state.clickLevels : state.passiveLevels;
  const upgrade = list.find((u) => u.id === id);
  if (!upgrade) return;

  const level = levels[id] || 0;
  const price = getUpgradePrice(upgrade, level);

  if (state.balance < price) return;

  state.balance -= price;
  levels[id] = level + 1;

  updateBalanceUI();
  saveState();
  renderUpgrades();
});

// ---------- Нижнее меню ----------
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    switchScreen(btn.dataset.tab);
  });
});

// ---------- Модалка подтверждения сброса ----------
const confirmModal    = document.getElementById('confirmModal');
const resetStartBtn   = document.getElementById('resetStartBtn');
const resetConfirmBtn = document.getElementById('resetConfirmBtn');

function openModal(modal) {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal) {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

confirmModal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeModal(confirmModal);
});

resetStartBtn.addEventListener('click', () => {
  openModal(confirmModal);
});

resetConfirmBtn.addEventListener('click', () => {
  const fresh = defaultState();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);

  localStorage.removeItem(STORAGE_KEY);

  updateBalanceUI();
  updateProfileUI();
  closeModal(confirmModal);

  // Возвращаемся на «Заработок»
  switchScreen('earn');
});

// ---------- Инициализация ----------
updateBalanceUI();
switchScreen('earn');
