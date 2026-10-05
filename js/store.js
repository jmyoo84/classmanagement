'use strict';

const STORAGE_KEY = 'class_economy_v1';

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
const LEVEL_NAMES = ['새싹', '탐험가', '모험가', '용사', '영웅', '전설', '챔피언', '마스터', '그랜드마스터', '레전드'];

const DEFAULT_ROLES = [
  { id: 'r01', name: '반장',      emoji: '👑', tasks: ['출석 체크 보조', '조례·종례 진행'] },
  { id: 'r02', name: '부반장',    emoji: '🌟', tasks: ['반장 보조', '공지사항 전달'] },
  { id: 'r03', name: '서기',      emoji: '📝', tasks: ['칠판 판서', '회의록 작성'] },
  { id: 'r04', name: '총무',      emoji: '💼', tasks: ['물품 기록', '학급비 관리'] },
  { id: 'r05', name: '청소부장',  emoji: '🧹', tasks: ['청소 구역 배정', '청소 점검'] },
  { id: 'r06', name: '도서부장',  emoji: '📚', tasks: ['도서 대출 관리', '책 정리'] },
  { id: 'r07', name: '환경부장',  emoji: '🌱', tasks: ['화분 관리', '교실 환경 정리'] },
  { id: 'r08', name: '체육부장',  emoji: '⚽', tasks: ['체육 기구 관리', '체육 활동 보조'] },
  { id: 'r09', name: '급식도우미',emoji: '🍚', tasks: ['급식 배식 보조', '식판 정리'] },
  { id: 'r10', name: '우유당번',  emoji: '🥛', tasks: ['우유 배분', '빈 우유갑 수거'] },
  { id: 'r11', name: '칠판닦기',  emoji: '🖊️', tasks: ['수업 후 칠판 청소'] },
  { id: 'r12', name: '문단속',    emoji: '🚪', tasks: ['하교 시 창문·문 점검'] },
  { id: 'r13', name: '멀티미디어',emoji: '💻', tasks: ['컴퓨터·프로젝터 관리'] },
  { id: 'r14', name: '미술부장',  emoji: '🎨', tasks: ['미술 재료 관리', '작품 게시'] },
  { id: 'r15', name: '음악부장',  emoji: '🎵', tasks: ['악기 관리', '음악 시간 준비'] },
];

const DEFAULT_SHOP_ITEMS = [
  { id: 'si01', name: '숙제 면제권',      emoji: '📋', price: 100, stock: 5,  type: '쿠폰', description: '숙제 1회를 면제받아요!' },
  { id: 'si02', name: '자리 바꾸기 쿠폰', emoji: '🔄', price: 80,  stock: 3,  type: '쿠폰', description: '원하는 자리로 1회 이동!' },
  { id: 'si03', name: '칭찬 스티커 세트', emoji: '⭐', price: 50,  stock: 10, type: '물건', description: '예쁜 스티커 5장 세트' },
  { id: 'si04', name: '선생님과 대화권',  emoji: '💬', price: 150, stock: 2,  type: '쿠폰', description: '선생님과 1:1 이야기 시간' },
  { id: 'si05', name: '간식 쿠폰',        emoji: '🍭', price: 120, stock: 5,  type: '쿠폰', description: '간식 1개를 골라요!' },
  { id: 'si06', name: '칠판 안 쓰기 쿠폰',emoji: '✏️', price: 60,  stock: 5,  type: '쿠폰', description: '칠판 필기 1회 면제' },
];

const DEFAULT_TASKS = [
  { id: 'tk01', text: '오늘의 책 읽기 (15분 이상)' },
  { id: 'tk02', text: '수학 교과서 p.45 예습하기' },
];

const DEFAULT_STUDENTS = [
  { id: 'st01', name: '김민준', coins: 250, exp: 340, roleId: 'r01', transactions: [], purchases: [], taskChecks: {} },
  { id: 'st02', name: '이서연', coins: 180, exp: 210, roleId: 'r02', transactions: [], purchases: [], taskChecks: {} },
  { id: 'st03', name: '박도현', coins: 320, exp: 480, roleId: 'r05', transactions: [], purchases: [], taskChecks: {} },
  { id: 'st04', name: '최지우', coins:  90, exp: 120, roleId: 'r03', transactions: [], purchases: [], taskChecks: {} },
  { id: 'st05', name: '정하은', coins: 410, exp: 650, roleId: 'r06', transactions: [], purchases: [], taskChecks: {} },
];

const Store = {
  data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.data = JSON.parse(raw);
        // Data migration guard
        this.data.students.forEach(s => {
          if (!s.taskChecks)   s.taskChecks   = {};
          if (!s.transactions) s.transactions = [];
          if (!s.purchases)    s.purchases    = [];
        });
      } else {
        this.initDefaults();
      }
    } catch (e) {
      console.warn('Load error – reverting to defaults:', e);
      this.initDefaults();
    }
  },

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); }
    catch (e) { console.error('Save error:', e); }
  },

  initDefaults() {
    this.data = {
      students:   JSON.parse(JSON.stringify(DEFAULT_STUDENTS)),
      roles:      JSON.parse(JSON.stringify(DEFAULT_ROLES)),
      shopItems:  JSON.parse(JSON.stringify(DEFAULT_SHOP_ITEMS)),
      todayTasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
    };
    this.save();
  },

  // ── Level system ──────────────────────────────────────────────
  getLevelInfo(exp) {
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (exp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
    }
    const idx  = level - 1;
    const cur  = LEVEL_THRESHOLDS[idx] ?? 0;
    const next = LEVEL_THRESHOLDS[idx + 1] ?? null;
    const progress = next !== null
      ? Math.min(100, Math.max(0, ((exp - cur) / (next - cur)) * 100))
      : 100;
    return { level, name: LEVEL_NAMES[idx] ?? 'MAX', currentThreshold: cur, nextThreshold: next, progress };
  },

  // ── Students ──────────────────────────────────────────────────
  getStudents() { return this.data.students; },
  getStudent(id) { return this.data.students.find(s => s.id === id); },

  addStudent(name) {
    const s = { id: 'st_' + Date.now(), name: name.trim(), coins: 0, exp: 0, roleId: null, transactions: [], purchases: [], taskChecks: {} };
    this.data.students.push(s);
    this.save();
    return s;
  },

  removeStudent(id) {
    this.data.students = this.data.students.filter(s => s.id !== id);
    this.save();
  },

  adjustCoins(studentId, amount, reason = '') {
    const s = this.getStudent(studentId);
    if (!s) return false;
    s.coins = Math.max(0, s.coins + amount);
    s.transactions.unshift({
      id: 'tx_' + Date.now(), type: amount >= 0 ? 'earn' : 'deduct',
      amount, reason: reason || (amount >= 0 ? '코인 지급' : '코인 차감'),
      date: new Date().toISOString(),
    });
    this.save();
    return true;
  },

  adjustCoinsAll(amount, reason = '') {
    this.data.students.forEach(s => {
      s.coins = Math.max(0, s.coins + amount);
      s.transactions.unshift({
        id: 'tx_' + Date.now() + '_' + s.id, type: amount >= 0 ? 'earn' : 'deduct',
        amount, reason: reason || '전체 학생 지급', date: new Date().toISOString(),
      });
    });
    this.save();
  },

  setStudentDirect(studentId, fields) {
    const s = this.getStudent(studentId);
    if (!s) return;
    Object.assign(s, fields);
    this.save();
  },

  adjustExp(studentId, amount) {
    const s = this.getStudent(studentId);
    if (!s) return false;
    s.exp = Math.max(0, s.exp + amount);
    this.save();
    return true;
  },

  // ── Shop ──────────────────────────────────────────────────────
  getShopItems() { return this.data.shopItems; },

  addShopItem(item) {
    item.id = 'si_' + Date.now();
    this.data.shopItems.push(item);
    this.save();
    return item;
  },

  updateShopItem(id, updates) {
    const item = this.data.shopItems.find(i => i.id === id);
    if (item) { Object.assign(item, updates); this.save(); }
  },

  removeShopItem(id) {
    this.data.shopItems = this.data.shopItems.filter(i => i.id !== id);
    this.save();
  },

  purchaseItem(studentId, itemId) {
    const s    = this.getStudent(studentId);
    const item = this.data.shopItems.find(i => i.id === itemId);
    if (!s || !item) return { ok: false, msg: '오류가 발생했습니다.' };
    if (s.coins < item.price) return { ok: false, msg: `코인이 부족합니다! (보유: ${s.coins} / 필요: ${item.price})` };
    if (item.stock <= 0)      return { ok: false, msg: '재고가 없습니다.' };

    s.coins     -= item.price;
    item.stock   = Math.max(0, item.stock - 1);
    s.purchases.unshift({ id: 'pu_' + Date.now(), itemId, itemName: item.name, itemEmoji: item.emoji, price: item.price, date: new Date().toISOString() });
    s.transactions.unshift({ id: 'tx_' + Date.now(), type: 'spend', amount: -item.price, reason: `${item.emoji} ${item.name} 구매`, date: new Date().toISOString() });
    this.save();
    return { ok: true };
  },

  // ── Roles ─────────────────────────────────────────────────────
  getRoles() { return this.data.roles; },

  addRole(role) {
    role.id = 'r_' + Date.now();
    if (!role.tasks) role.tasks = [];
    this.data.roles.push(role);
    this.save();
    return role;
  },

  updateRole(id, updates) {
    const role = this.data.roles.find(r => r.id === id);
    if (role) { Object.assign(role, updates); this.save(); }
  },

  removeRole(id) {
    this.data.roles = this.data.roles.filter(r => r.id !== id);
    this.data.students.forEach(s => { if (s.roleId === id) s.roleId = null; });
    this.save();
  },

  assignRole(studentId, roleId) {
    const s = this.getStudent(studentId);
    if (s) { s.roleId = roleId || null; this.save(); }
  },

  // ── Tasks ─────────────────────────────────────────────────────
  getTasks() { return this.data.todayTasks; },

  addTask(text) {
    const t = { id: 'tk_' + Date.now(), text: text.trim() };
    this.data.todayTasks.push(t);
    this.save();
    return t;
  },

  removeTask(id) {
    this.data.todayTasks = this.data.todayTasks.filter(t => t.id !== id);
    this.save();
  },

  checkTask(studentId, taskId, checked) {
    const s = this.getStudent(studentId);
    if (!s) return;
    if (!s.taskChecks) s.taskChecks = {};
    const today = new Date().toDateString();
    if (!s.taskChecks[today]) s.taskChecks[today] = {};
    s.taskChecks[today][taskId] = checked;
    this.save();
  },

  isTaskChecked(studentId, taskId) {
    const s = this.getStudent(studentId);
    if (!s || !s.taskChecks) return false;
    const today = new Date().toDateString();
    return !!(s.taskChecks[today] && s.taskChecks[today][taskId]);
  },
};
