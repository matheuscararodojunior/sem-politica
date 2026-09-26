'use strict';
const api = globalThis.browser ?? globalThis.chrome;
const { DEFAULT_SETTINGS, DEFAULT_TERMS } = globalThis.SemPolitica;
const $ = (id) => document.getElementById(id);
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const siteBoxes = [...document.querySelectorAll('[data-site]')];

const defaults = [...DEFAULT_TERMS.WORDS, ...DEFAULT_TERMS.SUBSTRINGS.map((s) => `*${s}*`), ...DEFAULT_TERMS.ACRONYMS.map((a) => a.replace(/\(.*$/, ''))];
$('defaultsCount').textContent = defaults.length;
$('defaultsList').textContent = defaults.join(', ');

async function load() {
  const s = await api.storage.sync.get(DEFAULT_SETTINGS);
  $('enabled').checked = s.enabled;
  for (const b of siteBoxes) b.checked = s.sites[b.dataset.site] !== false;
  document.querySelector(`[name="mode"][value="${s.mode}"]`).checked = true;
  $('useDefaults').checked = s.useDefaults;
  $('extraTerms').value = s.extraTerms.join('\n');
  $('allowTerms').value = s.allowTerms.join('\n');
}

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await api.storage.sync.set({
      enabled: $('enabled').checked,
      sites: Object.fromEntries(siteBoxes.map((b) => [b.dataset.site, b.checked])),
      mode: document.querySelector('[name="mode"]:checked').value,
      useDefaults: $('useDefaults').checked,
      extraTerms: lines($('extraTerms').value),
      allowTerms: lines($('allowTerms').value),
    });
    $('status').textContent = 'Salvo ✓';
    setTimeout(showCount, 700);
  }, 300);
}

async function showCount() {
  try {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const n = await api.tabs.sendMessage(tab.id, { type: 'sp:count' });
    $('count').textContent = `${n} ${n === 1 ? 'item escondido' : 'itens escondidos'} nesta aba`;
  } catch {
    $('count').textContent = ''; // aba sem content script (não é YouTube/Google/Instagram)
  }
}

document.addEventListener('input', save);
load().then(showCount);
