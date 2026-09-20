// ============================================================
// ЛОХМАТЫЙ КЛУБ — игровая логика (прототип, localStorage)
// ============================================================

const STORAGE_KEY = 'lohmaty_club_state_v1';

// ---------- Состояние по умолчанию ----------
function defaultState() {
  return {
    balance: 0,
    totalEarned: 0,     // всего добыто за всё время
    totalClicks: 0,     // ударов по айсбергу
    clickLevels: {},    // { upgradeId: level }
    passiveLevels: {},  // { upgradeId: level }
  };
}

// ---------- Загрузка / сохранение ----------
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
const balanceEl     = document.getElementById('balance');
const balanceRateEl = document.getElementById('balanceRate');
const wrap          = document.getElementById('icebergWrap');
const svg           = document.getElementById('icebergSvg');
const layer         = document.getElementById('cubesLayer');
const upgradesModal = document.getElementById('upgradesModal');
const profileModal  = document.getElementById('profileModal');
const upgradesList  = document.getElementById('upgradesList');
const navButtons    = document.querySelectorAll('.nav-btn');
const tabs          = document.querySelectorAll('.tab');

let activeUpgradeTab = 'click';

// ---------- Форматирование ----------
function formatNumber(n) {
  return Math.floor(n).toLocaleString('ru-RU');
}

// ---------- Расчёт бонусов ----------
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

// ---------- Обновление UI ----------
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

// ---------- Модалки ----------
function openModal(modal) {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal) {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.modal').forEach((m) => {
  m.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal(m);
  });
});

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

// ---------- Сброс прогресса ----------
const resetStartBtn   = document.getElementById('resetStartBtn');
const resetConfirm    = document.getElementById('resetConfirm');
const resetConfirmBtn = document.getElementById('resetConfirmBtn');
const resetCancelBtn  = document.getElementById('resetCancelBtn');

function showResetConfirm() {
  resetStartBtn.hidden = true;
  resetConfirm.hidden  = false;
}

function hideResetConfirm() {
  resetStartBtn.hidden = false;
  resetConfirm.hidden  = true;
}

resetStartBtn.addEventListener('click', showResetConfirm);
resetCancelBtn.addEventListener('click', hideResetConfirm);

resetConfirmBtn.addEventListener('click', () => {
  const fresh = defaultState();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);

  localStorage.removeItem(STORAGE_KEY);

  updateBalanceUI();
  updateProfileUI();
  hideResetConfirm();

  console.log('Прогресс сброшен');
});

// ---------- Нижнее меню ----------
navButtons.forEach((navBtn) => {
  navBtn.addEventListener('click', () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    navBtn.classList.add('active');

    const tab = navBtn.dataset.tab;
    if (tab === 'upgrades') {
      renderUpgrades();
      openModal(upgradesModal);
    } else if (tab === 'profile') {
      hideResetConfirm();
      updateProfileUI();
      openModal(profileModal);
    } else {
      console.log('Открыть вкладку:', tab);
    }
  });
});

// По умолчанию активна «Заработок»
document.querySelector('.nav-btn[data-tab="earn"]')?.classList.add('active');

// ---------- Инициализация ----------
updateBalanceUI();
