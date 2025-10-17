// js/tabs.js
// Minimal dependency-free tab controller for the frontend.
// Use buttons/links with [data-tab="paneId"] and panes with <section id="paneId" class="tab-pane">

const HIDE = 'is-hidden';
const ACTIVE = 'is-active';

function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function showTab(paneId) {
  if (!paneId) return;
  const pane = document.getElementById(paneId);
  if (!pane) return console.warn('[tabs] pane not found:', paneId);

  // Hide all panes
  $$('.tab-pane').forEach(p => p.classList.add(HIDE));

  // Deactivate all triggers
  $$('[data-tab]').forEach(b => {
    b.classList.remove(ACTIVE);
    b.setAttribute('aria-selected', 'false');
  });

  // Show target pane
  pane.classList.remove(HIDE);
  pane.setAttribute('role', 'tabpanel');

  // Activate matching triggers
  $$(`[data-tab="${paneId}"]`).forEach(b => {
    b.classList.add(ACTIVE);
    b.setAttribute('aria-selected', 'true');
  });

  // Update URL (optional but nice)
  history.replaceState(null, '', `#${paneId}`);
}

export function initTabs() {
  // a11y baseline
  $$('[data-tab]').forEach(b => b.setAttribute('role', 'tab'));
  $$('.tab-pane').forEach(p => p.setAttribute('role', 'tabpanel'));

  // Click delegation (works even if buttons are added later)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-tab') || btn.getAttribute('data-tab-target') || btn.hash?.slice(1);
    if (id) showTab(id);
  });

  // Initial selection: #hash > first tab > first pane
  const fromHash = location.hash?.slice(1);
  const firstTab = $$('[data-tab]')[0]?.getAttribute('data-tab');
  const firstPane = document.querySelector('.tab-pane')?.id;
  showTab(fromHash || firstTab || firstPane);
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabs);
} else {
  initTabs();
}

// Optional global (handy in console)
window.tabs = { show: showTab, init: initTabs };
