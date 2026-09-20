// ============================================================
// ЛОХМАТЫЙ КЛУБ — игровая логика (прототип, без бэкенда)
// ============================================================

// ---------- Состояние ----------
const state = {
  balance: 0,
  clickLevels: {},   // { upgradeId: level }
  passiveLevels: {}, // { upgradeId: level }
};

// ---------- Справочники улучшений ----------
const CLICK_UPGRADES = [
  { id: 'pick',    name: 'Крепкая кирка', bonus: 1,   basePrice: 50 },
  { id: 'iceaxe',  name: 'Ледоруб',        bonus: 5,   basePrice: 500 },
  { id: 'crew',    name: 'Бригада',        bonus: 15,  basePrice: 5000 },
  { id: 'drill',   name: 'Бур',            bonus: 50,  basePrice: 50000 },
  { id: 'breaker', name: 'Ледокол',        bonus: 200, basePrice: 500000 },
];

const PASSIVE_UPGRADES = [
  { id: 'fridge',   name: 'Холодильник',   bonus: 1,   basePrice: 100 },
  { id: 'freezer',  name: 'Морозилка',     bonus: 5,   basePrice: 1000 },
  { id: 'glacier',  name: 'Ледник',        bonus: 25,  basePrice: 10000 },
  { id: 'farm',     name: 'Айсберг-ферма', bonus: 100, basePrice: 100000 },
  { id: 'permafrost', name: 'Вечная мерзлота', bonus: 500, basePrice: 1000000 },
];

// ---------- DOM ----------
const balanceEl     = document.getElementById('balance');
const balanceRateEl = document.getElementById('balanceRate');
const wrap          = document.getElementById('icebergWrap');
const svg           = document.getElementById('icebergSvg');
const layer         = document.getElementById('cubesLayer');
const modal         = document.getElementById('upgradesModal');
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
  // Цена растёт ×1.15 за каждый уровень
  return Math.floor(upgrade.basePrice * Math.pow(1.15, level));
}

// ---------- Обновление UI ----------
function updateBalanceUI() {
  balanceEl.textContent = formatNumber(state.balance);
  balanceRateEl.textContent = `+${formatNumber(getPassiveBonus())} / сек`;
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
  spawnCube(e.clientX, e.clientY, getClickBonus());
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
    state.balance += reward;
    updateBalanceUI();
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
    state.balance += income;
    updateBalanceUI();
  }
}, 1000);

// ---------- Модалка ----------
function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  renderUpgrades();
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

modal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeModal();
});

// ---------- Табы ----------
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('tab--active'));
    tab.classList.add('tab--active');
    activeUpgradeTab = tab.dataset.tabTarget;
    renderUpgrades();
  });
});

// ---------- Рендер списка улучшений ----------
function renderUpgrades() {
  const list = activeUpgradeTab === 'click' ? CLICK_UPGRADES : PASSIVE_UPGRADES;
  const levels = activeUpgradeTab === 'click' ? state.clickLevels : state.passiveLevels;
  const suffix = activeUpgradeTab === 'click' ? 'к клику' : 'в секунду';

  upgradesList.innerHTML = '';

  list.forEach((upgrade) => {
    const level = levels[upgrade.id] || 0;
    const price = getUpgradePrice(upgrade, level);
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

  const id = btn.dataset.buy;
  const list = activeUpgradeTab === 'click' ? CLICK_UPGRADES : PASSIVE_UPGRADES;
  const levels = activeUpgradeTab === 'click' ? state.clickLevels : state.passiveLevels;
  const upgrade = list.find((u) => u.id === id);
  if (!upgrade) return;

  const level = levels[id] || 0;
  const price = getUpgradePrice(upgrade, level);

  if (state.balance < price) return;

  state.balance -= price;
  levels[id] = level + 1;

  updateBalanceUI();
  renderUpgrades();
});

// ---------- Нижнее меню ----------
navButtons.forEach((navBtn) => {
  navBtn.addEventListener('click', () => {
    navButtons.forEach((b) => b.classList.remove('active'));
    navBtn.classList.add('active');

    const tab = navBtn.dataset.tab;
    if (tab === 'upgrades') {
      openModal();
    } else {
      console.log('Открыть вкладку:', tab);
    }
  });
});

// По умолчанию — активна «Улучшения» (но модалку не открываем сразу)
document.querySelector('.nav-btn[data-tab="upgrades"]')?.classList.add('active');

// ---------- Инициализация ----------
updateBalanceUI();
