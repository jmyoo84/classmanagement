'use strict';

// ═══════════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════════
const Modal = {
  _resolve: null,

  show(title, bodyHTML, opts = {}) {
    const { confirmText = '확인', cancelText = '취소', dangerous = false } = opts;
    return new Promise(resolve => {
      this._resolve = resolve;
      document.getElementById('modal-title').innerHTML = title;
      document.getElementById('modal-body').innerHTML  = bodyHTML;
      document.getElementById('modal-confirm').textContent = confirmText;
      document.getElementById('modal-cancel').textContent  = cancelText;
      const btn = document.getElementById('modal-confirm');
      btn.className = dangerous ? 'btn-primary btn-danger' : 'btn-primary';
      document.getElementById('modal-overlay').classList.remove('hidden');
      setTimeout(() => {
        const first = document.querySelector('#modal-body input, #modal-body textarea, #modal-body select');
        if (first) first.focus();
      }, 80);
    });
  },

  _finish(result) {
    document.getElementById('modal-overlay').classList.add('hidden');
    if (this._resolve) { this._resolve(result); this._resolve = null; }
  },

  confirm() { this._finish(true);  },
  cancel()  { this._finish(false); },
};

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
const Toast = {
  _timer: null,
  show(message, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className   = `toast toast-${type}`;
    el.classList.remove('hidden');
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => el.classList.add('hidden'), 3500);
  },
};

// ═══════════════════════════════════════════════════════════════
//  APP  (routing)
// ═══════════════════════════════════════════════════════════════
const App = {
  init() {
    Store.load();

    // Home buttons
    document.getElementById('btn-teacher-mode').addEventListener('click', () => {
      this.showScreen('screen-teacher');
      Teacher.renderAll();
    });
    document.getElementById('btn-student-mode').addEventListener('click', () => {
      this.showScreen('screen-student-select');
      Student.renderNameSelect();
    });

    // Back buttons
    document.getElementById('teacher-back').addEventListener('click',       () => this.showScreen('screen-home'));
    document.getElementById('student-select-back').addEventListener('click',() => this.showScreen('screen-home'));
    document.getElementById('student-main-back').addEventListener('click',  () => {
      this.showScreen('screen-student-select');
      Student.renderNameSelect();
    });

    // Modal buttons
    document.getElementById('modal-confirm').addEventListener('click', () => Modal.confirm());
    document.getElementById('modal-cancel').addEventListener('click',  () => Modal.cancel());

    // Keyboard shortcuts for modal
    document.addEventListener('keydown', e => {
      const overlay = document.getElementById('modal-overlay');
      if (overlay.classList.contains('hidden')) return;
      if (e.key === 'Escape') Modal.cancel();
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        Modal.confirm();
      }
    });

    // Click outside modal box → cancel
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) Modal.cancel();
    });
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },
};

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  Teacher.init();
  Student.init();
});
