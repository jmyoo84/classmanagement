'use strict';

const Teacher = {

  // ── Colour helper (shared with Student) ──────────────────────
  nameToGradient(name) {
    const palette = [
      'linear-gradient(135deg,#667eea,#764ba2)',
      'linear-gradient(135deg,#f093fb,#f5576c)',
      'linear-gradient(135deg,#4facfe,#00f2fe)',
      'linear-gradient(135deg,#43e97b,#38f9d7)',
      'linear-gradient(135deg,#fa709a,#fee140)',
      'linear-gradient(135deg,#a18cd1,#fbc2eb)',
      'linear-gradient(135deg,#fccb90,#d57eeb)',
      'linear-gradient(135deg,#fd7043,#ffb74d)',
    ];
    const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
    return palette[code % palette.length];
  },

  // ── Init ─────────────────────────────────────────────────────
  init() {
    this._bindTabs();
    this._bindActions();
  },

  _bindTabs() {
    document.querySelectorAll('#screen-teacher .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('#screen-teacher .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#screen-teacher .tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        this._refreshTab(tab);
      });
    });
  },

  _bindActions() {
    document.getElementById('btn-add-student').addEventListener('click',  () => this.showAddStudentModal());
    document.getElementById('btn-give-all-coins').addEventListener('click',() => this.showGiveAllModal());
    document.getElementById('btn-add-item').addEventListener('click',     () => this.showItemModal(null));
    document.getElementById('btn-add-role').addEventListener('click',     () => this.showRoleModal(null));
    document.getElementById('btn-add-task').addEventListener('click',     () => this.showAddTaskModal());
  },

  _refreshTab(tab) {
    const map = { students: 'renderStudents', shop: 'renderShop', roles: 'renderRoles', tasks: 'renderTasks' };
    if (map[tab]) this[map[tab]]();
  },

  // ── Full render ───────────────────────────────────────────────
  renderAll() {
    this.renderStats();
    this.renderStudents();
    this.renderShop();
    this.renderRoles();
    this.renderTasks();
  },

  renderStats() {
    const students   = Store.getStudents();
    const totalCoins = students.reduce((s, x) => s + x.coins, 0);
    document.getElementById('teacher-stat-students').textContent = `👥 ${students.length}명`;
    document.getElementById('teacher-stat-coins').textContent    = `🪙 ${totalCoins.toLocaleString()}`;
  },

  // ── Students tab ─────────────────────────────────────────────
  renderStudents() {
    this.renderStats();
    const students = Store.getStudents();
    const roles    = Store.getRoles();
    const grid     = document.getElementById('student-list-grid');

    if (students.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><p>학생이 없습니다.</p><p class="empty-sub">"+ 학생 추가" 버튼으로 추가해 주세요.</p></div>`;
      return;
    }

    const sorted = [...students].sort((a, b) => b.coins - a.coins);

    grid.innerHTML = students.map(s => {
      const li    = Store.getLevelInfo(s.exp);
      const role  = s.roleId ? roles.find(r => r.id === s.roleId) : null;
      const rank  = sorted.findIndex(x => x.id === s.id) + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const lvCls = `level-badge lv${Math.min(li.level, 10)}`;

      return `
      <div class="student-card">
        <div class="student-card-rank">${medal}</div>
        <div class="student-card-header">
          <div class="student-avatar" style="background:${this.nameToGradient(s.name)}">${s.name[0]}</div>
          <div class="student-card-meta">
            <div class="student-card-name">${s.name}</div>
            <div class="student-card-role">${role ? role.emoji + ' ' + role.name : '역할 미배정'}</div>
          </div>
          <span class="${lvCls}">Lv.${li.level}</span>
        </div>
        <div class="student-card-coins">
          <span class="coin-icon">🪙</span>
          <span class="coin-amount">${s.coins.toLocaleString()}</span>
          <span class="coin-unit">코인</span>
        </div>
        <div class="student-card-exp">
          <div class="exp-info">
            <span>⚡ ${s.exp.toLocaleString()} EXP</span>
            <span class="exp-level-name">${li.name}</span>
          </div>
          <div class="exp-bar"><div class="exp-fill" style="width:${li.progress}%"></div></div>
          <div class="exp-next">${li.nextThreshold !== null ? '다음 레벨까지 ' + (li.nextThreshold - s.exp).toLocaleString() + ' EXP' : 'MAX LEVEL 🔥'}</div>
        </div>
        <div class="student-card-actions">
          <button class="action-btn give-coin"    onclick="Teacher.showCoinModal('${s.id}', 1)"  title="코인 지급">🪙＋</button>
          <button class="action-btn take-coin"    onclick="Teacher.showCoinModal('${s.id}', -1)" title="코인 차감">🪙－</button>
          <button class="action-btn give-exp"     onclick="Teacher.showExpModal('${s.id}')"      title="EXP 지급">⚡ EXP</button>
          <button class="action-btn edit-student" onclick="Teacher.showEditStudentModal('${s.id}')" title="직접 수정">✏️</button>
          <button class="action-btn danger-btn"   onclick="Teacher.deleteStudent('${s.id}')"     title="삭제">🗑️</button>
        </div>
      </div>`;
    }).join('');
  },

  // ── Shop tab ─────────────────────────────────────────────────
  renderShop() {
    const items = Store.getShopItems();
    const grid  = document.getElementById('shop-items-grid');

    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🏪</div><p>상점 아이템이 없습니다.</p></div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="shop-item-card">
        <div class="shop-item-emoji">${item.emoji}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          <div class="shop-item-meta">
            <span class="type-badge ${item.type === '쿠폰' ? 'type-coupon' : 'type-item'}">${item.type}</span>
            <span class="item-price">🪙 ${item.price}</span>
            <span class="item-stock ${item.stock === 0 ? 'out-of-stock' : ''}">재고 ${item.stock}</span>
          </div>
        </div>
        <div class="shop-item-actions">
          <button class="action-btn" onclick="Teacher.showItemModal('${item.id}')">✏️</button>
          <button class="action-btn danger-btn" onclick="Teacher.deleteItem('${item.id}')">🗑️</button>
        </div>
      </div>`).join('');
  },

  // ── Roles tab ────────────────────────────────────────────────
  renderRoles() {
    const roles    = Store.getRoles();
    const students = Store.getStudents();
    const grid     = document.getElementById('roles-grid');

    if (roles.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎭</div><p>역할이 없습니다.</p></div>`;
      return;
    }

    grid.innerHTML = roles.map(role => {
      const assigned   = students.filter(s => s.roleId === role.id);
      const unassigned = students.filter(s => !s.roleId || s.roleId !== role.id);
      return `
      <div class="role-card">
        <div class="role-card-header">
          <span class="role-emoji-big">${role.emoji}</span>
          <div class="role-card-info">
            <div class="role-card-name">${role.name}</div>
            <div class="role-card-tasks">${role.tasks.length ? role.tasks.join(' · ') : '할 일 없음'}</div>
          </div>
          <div class="role-card-btns">
            <button class="action-btn" onclick="Teacher.showRoleModal('${role.id}')">✏️</button>
            <button class="action-btn danger-btn" onclick="Teacher.deleteRole('${role.id}')">🗑️</button>
          </div>
        </div>
        <div class="role-assigned">
          ${assigned.length
            ? assigned.map(s => `<span class="assigned-chip">${s.name}<button onclick="Store.assignRole('${s.id}',null);Teacher.renderRoles();" title="배정 해제">×</button></span>`).join('')
            : '<span class="no-assigned">배정된 학생 없음</span>'}
        </div>
        <select class="role-assign-select" onchange="Teacher.onAssignRole('${role.id}',this.value);this.value='';">
          <option value="">+ 학생 배정하기</option>
          ${unassigned.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>`;
    }).join('');
  },

  // ── Tasks tab ────────────────────────────────────────────────
  renderTasks() {
    const tasks = Store.getTasks();
    const list  = document.getElementById('tasks-list');

    if (tasks.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>오늘 할 일이 없습니다.</p></div>`;
      return;
    }

    list.innerHTML = tasks.map(t => `
      <div class="task-item-row">
        <span class="task-bullet">•</span>
        <span class="task-text">${t.text}</span>
        <button class="btn-task-delete" onclick="Teacher.deleteTask('${t.id}')" title="삭제">🗑️</button>
      </div>`).join('');
  },

  // ── Modals ───────────────────────────────────────────────────
  async showAddStudentModal() {
    const body = `
      <div class="form-group">
        <label>학생 이름</label>
        <input id="inp-student-name" type="text" class="modal-input" placeholder="홍길동" maxlength="10" autofocus>
      </div>`;
    if (!await Modal.show('👤 학생 추가', body, { confirmText: '추가' })) return;
    const name = document.getElementById('inp-student-name').value.trim();
    if (!name) return Toast.show('이름을 입력해 주세요.', 'error');
    if (Store.getStudents().find(s => s.name === name)) return Toast.show('같은 이름의 학생이 있습니다.', 'error');
    Store.addStudent(name);
    this.renderStudents();
    Toast.show(`${name} 학생을 추가했습니다!`);
  },

  async showEditStudentModal(id) {
    const s = Store.getStudent(id);
    if (!s) return;
    const body = `
      <div class="form-group">
        <label>이름</label>
        <input id="inp-edit-name" type="text" class="modal-input" value="${s.name}" maxlength="10">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>코인 잔액</label>
          <input id="inp-edit-coins" type="number" class="modal-input" value="${s.coins}" min="0">
        </div>
        <div class="form-group">
          <label>경험치 (EXP)</label>
          <input id="inp-edit-exp" type="number" class="modal-input" value="${s.exp}" min="0">
        </div>
      </div>`;
    if (!await Modal.show(`✏️ ${s.name} 직접 수정`, body, { confirmText: '저장' })) return;
    const newName  = document.getElementById('inp-edit-name').value.trim();
    const newCoins = Math.max(0, parseInt(document.getElementById('inp-edit-coins').value) || 0);
    const newExp   = Math.max(0, parseInt(document.getElementById('inp-edit-exp').value)   || 0);
    if (!newName) return Toast.show('이름을 입력해 주세요.', 'error');
    Store.setStudentDirect(id, { name: newName, coins: newCoins, exp: newExp });
    this.renderStudents();
    Toast.show(`${newName} 정보를 수정했습니다.`);
  },

  async showCoinModal(id, sign) {
    const s     = Store.getStudent(id);
    if (!s) return;
    const label = sign > 0 ? '지급' : '차감';
    const body  = `
      <div class="modal-student-info">
        <span class="modal-student-name">${s.name}</span>
        <span class="modal-student-stat">현재 🪙 ${s.coins.toLocaleString()}</span>
      </div>
      <div class="form-group">
        <label>코인 ${label} 수량</label>
        <input id="inp-coin-amt" type="number" class="modal-input" placeholder="예: 30" min="1" max="9999" autofocus>
      </div>
      <div class="form-group">
        <label>사유 <span class="optional">(선택)</span></label>
        <input id="inp-coin-reason" type="text" class="modal-input" placeholder="예: 친구 도움" maxlength="50">
      </div>`;
    if (!await Modal.show(`🪙 코인 ${label} — ${s.name}`, body, { confirmText: label })) return;
    const amt    = parseInt(document.getElementById('inp-coin-amt').value);
    const reason = document.getElementById('inp-coin-reason').value.trim();
    if (!amt || amt < 1) return Toast.show('올바른 수량을 입력해 주세요.', 'error');
    Store.adjustCoins(id, amt * sign, reason);
    this.renderStudents();
    Toast.show(`${s.name}에게 ${amt} 코인 ${label}!`);
  },

  async showExpModal(id) {
    const s = Store.getStudent(id);
    if (!s) return;
    const body = `
      <div class="modal-student-info">
        <span class="modal-student-name">${s.name}</span>
        <span class="modal-student-stat">현재 ⚡ ${s.exp.toLocaleString()} EXP</span>
      </div>
      <div class="form-group">
        <label>EXP 지급량</label>
        <input id="inp-exp-amt" type="number" class="modal-input" placeholder="예: 50" min="1" max="9999" autofocus>
      </div>`;
    if (!await Modal.show(`⚡ EXP 지급 — ${s.name}`, body, { confirmText: '지급' })) return;
    const amt = parseInt(document.getElementById('inp-exp-amt').value);
    if (!amt || amt < 1) return Toast.show('올바른 수량을 입력해 주세요.', 'error');
    Store.adjustExp(id, amt);
    this.renderStudents();
    Toast.show(`${s.name}에게 ${amt} EXP 지급!`);
  },

  async showGiveAllModal() {
    const body = `
      <div class="form-group">
        <label>코인 수량 <small>(음수 입력 시 차감)</small></label>
        <input id="inp-all-amt" type="number" class="modal-input" placeholder="예: 10 또는 -5" autofocus>
      </div>
      <div class="form-group">
        <label>사유 <span class="optional">(선택)</span></label>
        <input id="inp-all-reason" type="text" class="modal-input" placeholder="예: 오늘의 미션 완료" maxlength="50">
      </div>`;
    if (!await Modal.show('🪙 전체 학생 코인 지급', body, { confirmText: '전체 적용' })) return;
    const amt    = parseInt(document.getElementById('inp-all-amt').value);
    const reason = document.getElementById('inp-all-reason').value.trim();
    if (isNaN(amt) || amt === 0) return Toast.show('올바른 수량을 입력해 주세요.', 'error');
    Store.adjustCoinsAll(amt, reason);
    this.renderStudents();
    Toast.show(`전체 학생 ${amt > 0 ? '+' : ''}${amt} 코인 ${amt >= 0 ? '지급' : '차감'}!`);
  },

  async deleteStudent(id) {
    const s = Store.getStudent(id);
    if (!s) return;
    if (!await Modal.show('학생 삭제', `<p><strong>${s.name}</strong> 학생을 삭제할까요?<br><small>코인·EXP·내역이 모두 사라집니다.</small></p>`, { confirmText: '삭제', dangerous: true })) return;
    Store.removeStudent(id);
    this.renderStudents();
    Toast.show(`${s.name} 학생을 삭제했습니다.`, 'info');
  },

  async showItemModal(id) {
    const item = id ? Store.getShopItems().find(i => i.id === id) : null;
    const v    = k => item ? item[k] : '';
    const body = `
      <div class="form-row">
        <div class="form-group" style="flex:0 0 70px">
          <label>이모지</label>
          <input id="inp-item-emoji" type="text" class="modal-input emoji-input" value="${v('emoji')}" placeholder="🎁" maxlength="2">
        </div>
        <div class="form-group" style="flex:1">
          <label>아이템 이름</label>
          <input id="inp-item-name" type="text" class="modal-input" value="${v('name')}" placeholder="숙제 면제권" autofocus>
        </div>
      </div>
      <div class="form-group">
        <label>설명</label>
        <input id="inp-item-desc" type="text" class="modal-input" value="${v('description')}" placeholder="이 아이템의 설명">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>가격 (코인)</label>
          <input id="inp-item-price" type="number" class="modal-input" value="${v('price')}" placeholder="100" min="1">
        </div>
        <div class="form-group">
          <label>재고</label>
          <input id="inp-item-stock" type="number" class="modal-input" value="${v('stock')}" placeholder="5" min="0">
        </div>
        <div class="form-group">
          <label>종류</label>
          <select id="inp-item-type" class="modal-input modal-select">
            <option value="쿠폰" ${item && item.type === '쿠폰' ? 'selected' : ''}>쿠폰</option>
            <option value="물건" ${item && item.type === '물건' ? 'selected' : ''}>물건</option>
          </select>
        </div>
      </div>`;
    if (!await Modal.show(item ? '아이템 수정' : '🏪 아이템 추가', body, { confirmText: item ? '수정' : '추가' })) return;
    const emoji = document.getElementById('inp-item-emoji').value.trim() || '🎁';
    const name  = document.getElementById('inp-item-name').value.trim();
    const desc  = document.getElementById('inp-item-desc').value.trim();
    const price = parseInt(document.getElementById('inp-item-price').value) || 0;
    const stock = parseInt(document.getElementById('inp-item-stock').value) || 0;
    const type  = document.getElementById('inp-item-type').value;
    if (!name)    return Toast.show('아이템 이름을 입력해 주세요.', 'error');
    if (price < 1) return Toast.show('가격은 1 이상이어야 합니다.', 'error');
    if (item) { Store.updateShopItem(id, { emoji, name, description: desc, price, stock, type }); Toast.show(`${name} 아이템을 수정했습니다.`); }
    else      { Store.addShopItem({ emoji, name, description: desc, price, stock, type });        Toast.show(`${name} 아이템을 추가했습니다!`); }
    this.renderShop();
  },

  async deleteItem(id) {
    const item = Store.getShopItems().find(i => i.id === id);
    if (!item) return;
    if (!await Modal.show('아이템 삭제', `<p><strong>${item.emoji} ${item.name}</strong>을(를) 삭제할까요?</p>`, { confirmText: '삭제', dangerous: true })) return;
    Store.removeShopItem(id);
    this.renderShop();
    Toast.show(`${item.name}을(를) 삭제했습니다.`, 'info');
  },

  async showRoleModal(id) {
    const role = id ? Store.getRoles().find(r => r.id === id) : null;
    const body = `
      <div class="form-row">
        <div class="form-group" style="flex:0 0 70px">
          <label>이모지</label>
          <input id="inp-role-emoji" type="text" class="modal-input emoji-input" value="${role ? role.emoji : ''}" placeholder="🎭" maxlength="2">
        </div>
        <div class="form-group" style="flex:1">
          <label>역할 이름</label>
          <input id="inp-role-name" type="text" class="modal-input" value="${role ? role.name : ''}" placeholder="반장" autofocus>
        </div>
      </div>
      <div class="form-group">
        <label>할 일 목록 <small>(쉼표로 구분)</small></label>
        <textarea id="inp-role-tasks" class="modal-input modal-textarea" placeholder="출석 체크 보조, 조례 진행">${role ? role.tasks.join(', ') : ''}</textarea>
      </div>`;
    if (!await Modal.show(role ? '역할 수정' : '🎭 역할 추가', body, { confirmText: role ? '수정' : '추가' })) return;
    const emoji = document.getElementById('inp-role-emoji').value.trim() || '🎭';
    const name  = document.getElementById('inp-role-name').value.trim();
    const tasks = document.getElementById('inp-role-tasks').value.split(',').map(t => t.trim()).filter(Boolean);
    if (!name) return Toast.show('역할 이름을 입력해 주세요.', 'error');
    if (role) { Store.updateRole(id, { emoji, name, tasks }); Toast.show(`${name} 역할을 수정했습니다.`); }
    else      { Store.addRole({ emoji, name, tasks });         Toast.show(`${name} 역할을 추가했습니다!`); }
    this.renderRoles();
  },

  async deleteRole(id) {
    const role = Store.getRoles().find(r => r.id === id);
    if (!role) return;
    if (!await Modal.show('역할 삭제', `<p><strong>${role.name}</strong> 역할을 삭제할까요?<br><small>배정된 학생의 역할도 해제됩니다.</small></p>`, { confirmText: '삭제', dangerous: true })) return;
    Store.removeRole(id);
    this.renderRoles();
    Toast.show(`${role.name} 역할을 삭제했습니다.`, 'info');
  },

  onAssignRole(roleId, studentId) {
    if (!studentId) return;
    Store.assignRole(studentId, roleId);
    this.renderRoles();
    const s    = Store.getStudent(studentId);
    const role = Store.getRoles().find(r => r.id === roleId);
    if (s && role) Toast.show(`${s.name}에게 '${role.name}' 역할 배정!`);
  },

  async showAddTaskModal() {
    const body = `
      <div class="form-group">
        <label>할 일 내용</label>
        <input id="inp-task-text" type="text" class="modal-input" placeholder="예: 수학 교과서 p.50 풀기" autofocus>
      </div>`;
    if (!await Modal.show('📋 오늘 할 일 추가', body, { confirmText: '추가' })) return;
    const text = document.getElementById('inp-task-text').value.trim();
    if (!text) return Toast.show('내용을 입력해 주세요.', 'error');
    Store.addTask(text);
    this.renderTasks();
    Toast.show('할 일을 추가했습니다!');
  },

  async deleteTask(id) {
    const task = Store.getTasks().find(t => t.id === id);
    if (!task) return;
    if (!await Modal.show('할 일 삭제', `<p>"${task.text}"</p><p><small>삭제할까요?</small></p>`, { confirmText: '삭제', dangerous: true })) return;
    Store.removeTask(id);
    this.renderTasks();
    Toast.show('할 일을 삭제했습니다.', 'info');
  },
};
