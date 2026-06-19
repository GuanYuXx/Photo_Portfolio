// =========================================
// LENS — Theme Switcher
// Pattern: CSS Custom Properties + data-theme attribute
// 持久化：localStorage key = 'lens_theme'
// =========================================

(function () {
  'use strict';

  // 主題清單。新增主題只要在這裡加一筆 + 在 style.css 補一組 [data-theme="xxx"] 變數。
  const THEMES = {
    obsidian: {
      label: 'Obsidian Gold · 黑曜金',
      swatches: ['#0a0a0a', '#1e1e1e', '#c8a96e', '#e8e4dc'],
    },
    linen: {
      label: 'Editorial Linen · 雜誌亞麻',
      swatches: ['#f5f1ea', '#ebe5da', '#3a5a4a', '#2a2520'],
    },
    vintage: {
      label: 'Vintage Film · 復古底片',
      swatches: ['#1a1410', '#211a14', '#e8b860', '#f0e0c8'],
    },
  };
  const STORAGE_KEY = 'lens_theme';
  const DEFAULT_THEME = 'obsidian';

  function getCurrentTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES[stored] ? stored : DEFAULT_THEME;
  }

  function applyTheme(id) {
    if (!THEMES[id]) return;
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(STORAGE_KEY, id);
    refreshActiveState(id);
  }

  function refreshActiveState(id) {
    document.querySelectorAll('.theme-menu-item').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.themeId === id);
    });
  }

  function buildMenu() {
    const menu = document.getElementById('themeMenu');
    if (!menu) return;
    menu.innerHTML = Object.keys(THEMES).map(function (id) {
      const t = THEMES[id];
      const swatchHtml = t.swatches.map(function (c) {
        return '<span class="theme-menu-sw" style="background:' + c + '"></span>';
      }).join('');
      return ''
        + '<button class="theme-menu-item" data-theme-id="' + id + '" type="button">'
        +   '<span class="theme-menu-swatches">' + swatchHtml + '</span>'
        +   '<span class="theme-menu-label">' + t.label + '</span>'
        +   '<span class="theme-menu-check">✓</span>'
        + '</button>';
    }).join('');

    menu.querySelectorAll('.theme-menu-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(btn.dataset.themeId);
        menu.classList.remove('open');
      });
    });
  }

  function initToggle() {
    const btn = document.getElementById('themePickerBtn');
    const menu = document.getElementById('themeMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    // 點外面關閉
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    // Esc 關閉
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') menu.classList.remove('open');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildMenu();
    initToggle();
    refreshActiveState(getCurrentTheme());
  });
})();
