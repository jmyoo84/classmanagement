'use strict';

const Student = {
  currentId: null,

  init() {
    document.querySelectorAll('#screen-student-main .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('#screen-student-main .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('#screen-student-main .tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        this._refreshTab(tab);
      });
    });
  },

  _refreshTab(tab) {
    const map = { 'student-home': 'renderHome', 'student-shop': 'renderShop', 'student-history': 'renderHistory' };
    if (map[tab]) this[map[tab]]();
  },

  // ── Name-select screen ───────────────────────────────────────
  renderNameSelect() {
    const students = Store.getStudents();
    const grid     = document.getElementById('student-name-grid');

    if (students.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>등록된 학생이 없습니다.</p><p class="empty-sub">선생님께 문의해 주세요.</p></div>`;
      return;
    }

    grid.innerHTML = students.map(s => {
      const li = Store.getLevelInfo(s.exp);
      return `
      <button class="student-name-btn" onclick="Student.selectStudent('${s.id}')">
        <div class="name-btn-avatar" style="background:${Teacher.nameToGradient(s.name)}">${s.name[0]}</div>
        <div class="name-btn-info">
          <div class="name-btn-name">${s.name}</div>
          <div class="name-btn-level">Lv.${li.level} ${li.name}</div>
        </div>
        <div class="name-btn-coins">🪙 ${s.coins.toLocaleString()}</div>
      </button>`;
    }).join('');
  },

  // ── Select + enter student dashboard ─────────────────────────
  selectStudent(id) {
    this.currentId = id;
    // Reset tabs to home
    document.querySelectorAll('#screen-student-main .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#screen-student-main .tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('#screen-student-main [data-tab="student-home"]').classList.add('active');
    document.getElementById('tab-student-home').classList.add('active');
    App.showScreen('screen-student-main');
    this.renderHeader();
    this.renderHome();
  },

  renderHeader() {
    const s = Store.getStudent(this.currentId);
    if (!s) return;
    document.getElementById('student-name-display').textContent = s.name + ' 학생';
  },

  // ── Home tab ─────────────────────────────────────────────────
  renderHome() {
    const s = Store.getStudent(this.currentId);
    if (!s) return;
    const li   = Store.getLevelInfo(s.exp);
    const role = s.roleId ? Store.getRoles().find(r => r.id === s.roleId) : null;

    // Hero stats
    document.getElementById('s-coins').textContent    = s.coins.toLocaleString();
    document.getElementById('s-level-badge').textContent = `Lv.${li.level}`;
    document.getElementById('s-level-name').textContent  = li.name;
    document.getElementById('s-exp').textContent     = s.exp.toLocaleString();
    document.getElementById('s-exp-next').textContent = li.nextThreshold !== null ? li.nextThreshold.toLocaleString() : 'MAX';
    // Animate EXP bar after a frame for the CSS transition to trigger
    requestAnimationFrame(() => {
      document.getElementById('s-exp-fill').style.width = li.progress + '%';
    });

    // Role badge
    document.getElementById('s-role-emoji').textContent = role ? role.emoji : '❓';
    document.getElementById('s-role-name').textContent  = role ? role.name  : '미배정';

    // Tasks — common
    const tasks       = Store.getTasks();
    const commonList  = document.getElementById('s-tasks-common-list');
    if (tasks.length === 0) {
      commonList.innerHTML = '<div class="task-empty">오늘 할 일이 없어요! 😊</div>';
    } else {
      commonList.innerHTML = tasks.map(t => {
        const checked = Store.isTaskChecked(s.id, t.id);
        return `
        <label class="task-item ${checked ? 'checked' : ''}">
          <input type="checkbox" ${checked ? 'checked' : ''} onchange="Student.toggleTask('${t.id}',this.checked)">
          <span class="task-check-icon">${checked ? '✅' : '⬜'}</span>
          <span class="task-text">${t.text}</span>
        </label>`;
      }).join('');
    }

    // Tasks — role-specific
    const roleSection = document.getElementById('s-tasks-role');
    const roleList    = document.getElementById('s-tasks-role-list');
    if (role && role.tasks && role.tasks.length > 0) {
      roleSection.style.display = 'block';
      roleList.innerHTML = role.tasks.map(t => `
        <div class="task-item role-task">
          <span class="task-check-icon">${role.emoji}</span>
          <span class="task-text">${t}</span>
        </div>`).join('');
    } else {
      roleSection.style.display = 'none';
    }
  },

  toggleTask(taskId, checked) {
    if (!this.currentId) return;
    Store.checkTask(this.currentId, taskId, checked);
    // Re-render only the task list area for a snappy feel
    this.renderHome();
  },

  // ── Shop tab ─────────────────────────────────────────────────
  renderShop() {
    const s = Store.getStudent(this.currentId);
    if (!s) return;
    const items = Store.getShopItems();

    document.getElementById('s-shop-coins').textContent = s.coins.toLocaleString();

    const grid = document.getElementById('s-shop-grid');
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">상점에 아이템이 없습니다.</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const canBuy = s.coins >= item.price && item.stock > 0;
      let btnLabel;
      if (item.stock === 0)          btnLabel = '품절';
      else if (s.coins < item.price) btnLabel = `코인 부족 (${(item.price - s.coins).toLocaleString()} 모자람)`;
      else                           btnLabel = `🪙 ${item.price.toLocaleString()} 구매`;

      return `
      <div class="s-shop-item ${!canBuy ? 'unavailable' : ''}">
        <div class="s-shop-item-emoji">${item.emoji}</div>
        <div class="s-shop-item-name">${item.name}</div>
        <div class="s-shop-item-desc">${item.description}</div>
        <div class="s-shop-item-meta">
          <span class="type-badge ${item.type === '쿠폰' ? 'type-coupon' : 'type-item'}">${item.type}</span>
          <span class="stock-badge ${item.stock === 0 ? 'out-of-stock' : ''}">재고 ${item.stock}</span>
        </div>
        <button class="btn-buy ${!canBuy ? 'disabled' : ''}" ${canBuy ? `onclick="Student.buyItem('${item.id}')"` : 'disabled'}>${btnLabel}</button>
      </div>`;
    }).join('');
  },

  async buyItem(itemId) {
    const item = Store.getShopItems().find(i => i.id === itemId);
    const s    = Store.getStudent(this.currentId);
    if (!item || !s) return;

    const body = `
      <div class="purchase-confirm">
        <div class="preview-emoji">${item.emoji}</div>
        <div class="preview-name">${item.name}</div>
        <div class="preview-desc">${item.description}</div>
        <div class="purchase-detail">
          <div class="pd-row"><span>💰 현재 보유</span><strong>${s.coins.toLocaleString()} 코인</strong></div>
          <div class="pd-row"><span>🏷️ 가격</span><strong>${item.price.toLocaleString()} 코인</strong></div>
          <div class="pd-row highlight"><span>💳 구매 후 잔액</span><strong>${(s.coins - item.price).toLocaleString()} 코인</strong></div>
        </div>
      </div>`;
    if (!await Modal.show(`${item.emoji} ${item.name} 구매`, body, { confirmText: '구매하기 💸' })) return;

    const result = Store.purchaseItem(this.currentId, itemId);
    if (result.ok) {
      Toast.show(`🎉 ${item.name} 구매 완료!`);
      this.renderShop();
      this.renderHome();
    } else {
      Toast.show(result.msg, 'error');
    }
  },

  // ── History tab ──────────────────────────────────────────────
  renderHistory() {
    const s = Store.getStudent(this.currentId);
    if (!s) return;

    // Purchase history
    const purchEl = document.getElementById('s-purchase-history');
    purchEl.innerHTML = s.purchases.length === 0
      ? '<div class="history-empty">구매 내역이 없습니다.</div>'
      : s.purchases.map(p => {
          const d = new Date(p.date);
          return `
          <div class="history-item">
            <span class="history-emoji">${p.itemEmoji}</span>
            <div class="history-info">
              <div class="history-name">${p.itemName}</div>
              <div class="history-date">${d.toLocaleDateString('ko-KR')} ${d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <div class="history-amount spend">－${p.price.toLocaleString()} 🪙</div>
          </div>`;
        }).join('');

    // Coin history (cap at 30)
    const coinEl = document.getElementById('s-coin-history');
    coinEl.innerHTML = s.transactions.length === 0
      ? '<div class="history-empty">코인 내역이 없습니다.</div>'
      : s.transactions.slice(0, 30).map(tx => {
          const d    = new Date(tx.date);
          const plus = tx.amount >= 0;
          return `
          <div class="history-item">
            <span class="history-emoji">${plus ? '📈' : '📉'}</span>
            <div class="history-info">
              <div class="history-name">${tx.reason}</div>
              <div class="history-date">${d.toLocaleDateString('ko-KR')} ${d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <div class="history-amount ${plus ? 'earn' : 'spend'}">${plus ? '＋' : ''}${tx.amount.toLocaleString()} 🪙</div>
          </div>`;
        }).join('');
  },
};
