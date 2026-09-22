// ============================================================
// ЛОХМАТЫЙ КЛУБ — логика (три страницы + localStorage)
// ============================================================

const STORAGE_KEY = 'lohmaty_club_state_v1';

// Страница, на которой находимся ('earn' | 'upgrades' | 'profile')
const PAGE = document.body.dataset.page || 'earn';

// ---------- Состояние ----------
function defaultState() {
  return {
    balance: 0,
    totalEarned: 0,
    totalClicks: 0,
    clickLevels: {},
    passiveLevels: {},
    // Данные игрока (заглушка, потом из Telegram)
    userName: 'Гость',
    userUsername: '@guest',
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

// ---------- Общие DOM (есть на всех страницах) ----------
const balanceTopEl = document.getElementById('balanceTop');
const rateTopEl    = document.getElementById('rateTop');
const userNameEl   = document.getElementById('userName');
const userUsernameEl = document.getElementById('userUsername');

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

// ---------- UI: шапка ----------
function updateHeaderUI() {
  if (balanceTopEl) balanceTopEl.textContent = formatNumber(state.balance);
  if (rateTopEl)    rateTopEl.textContent    = `+${formatNumber(getPassiveBonus())}`;
  if (userNameEl)   userNameEl.textContent   = state.userName;
  if (userUsernameEl) userUsernameEl.textContent = state.userUsername;
}

// Пульс баланса при начислении
function pulseBalance() {
  if (!balanceTopEl) return;
  balanceTopEl.classList.remove('pulse');
  void balanceTopEl.offsetWidth;
  balanceTopEl.classList.add('pulse');
}

// ---------- Пассивная добыча (работает на всех страницах) ----------
setInterval(() => {
  const income = getPassiveBonus();
  if (income > 0) {
    state.balance     += income;
    state.totalEarned += income;
    updateHeaderUI();
    saveState();
  }
}, 1000);

// ============================================================
// СПЕЦИФИКА ПО СТРАНИЦАМ
// ============================================================

// ======================== EARN ========================
if (PAGE === 'earn') {
  const wrap  = document.getElementById('icebergWrap');
  const svg   = document.getElementById('icebergSvg');
  const layer = document.getElementById('cubesLayer');

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

    const target  = balanceTopEl.getBoundingClientRect();
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
      updateHeaderUI();
      pulseBalance();
      saveState();
      cube.remove();
    });
  }

  updateHeaderUI();
}

// ======================== UPGRADES ========================
if (PAGE === 'upgrades') {
  const upgradesList = document.getElementById('upgradesList');
  const tabs         = document.querySelectorAll('.tab');

  let activeUpgradeTab = 'click';

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

  // Табы
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('tab--active'));
      tab.classList.add('tab--active');
      activeUpgradeTab = tab.dataset.tabTarget;
      renderUpgrades();
    });
  });

  // Покупка
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

    updateHeaderUI();
    saveState();
    renderUpgrades();
  });

  updateHeaderUI();
  renderUpgrades();
}

// ======================== PROFILE ========================
if (PAGE === 'profile') {
  const confirmModal    = document.getElementById('confirmModal');
  const resetStartBtn   = document.getElementById('resetStartBtn');
  const resetConfirmBtn = document.getElementById('resetConfirmBtn');

  function updateProfileUI() {
    document.getElementById('statTotalEarned').textContent = formatNumber(state.totalEarned);
    document.getElementById('statClicks').textContent      = formatNumber(state.totalClicks);
    document.getElementById('statBalance').textContent     = formatNumber(state.balance);
    document.getElementById('statRate').textContent        = formatNumber(getPassiveBonus());
    document.getElementById('statClickBonus').textContent  = formatNumber(getClickBonus());
  }

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

    updateHeaderUI();
    updateProfileUI();
    closeModal(confirmModal);
  });

  updateHeaderUI();
  updateProfileUI();
}
