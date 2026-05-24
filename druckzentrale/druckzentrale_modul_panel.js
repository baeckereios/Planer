// druckzentrale_modul_panel.js
// Tab 4: Panel — NFC-Zugangspanel (A4 Hochformat, mehrere Bereiche)
// Injiziert UI in #tab-panel, nutzt QRCode.js (bereits in druckzentrale.html geladen)

(function() {
'use strict';

var STORAGE_KEY = 'BOS_NFC_PANEL_CONFIG';

var DEFAULT_AREAS = [
    { name: 'Froster Auslastung',    url: 'https://baeckereios.github.io/froster_auslastung.html' },
    { name: 'Schnelldruck',          url: 'https://baeckereios.github.io/schnelldruck.html' },
    { name: 'Druckzentrale',         url: 'https://baeckereios.github.io/druckzentrale/druckzentrale.html' },
    { name: 'Froster-Konfiguration', url: 'https://baeckereios.github.io/froster_konfiguration.html' },
];

// ── STATE ──────────────────────────────────────────────────────────────
var state = { station: 'Frostertür', areas: JSON.parse(JSON.stringify(DEFAULT_AREAS)) };

function loadState() {
    try {
        var s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (s && s.station) { state.station = s.station; state.areas = s.areas || DEFAULT_AREAS; }
    } catch(e) {}
}

function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

function escH(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}

// ── CSS ────────────────────────────────────────────────────────────────
var CSS = `
.panel-wrap { padding: 16px 0 120px; }

.panel-field-label {
    display: block;
    font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--amber, #d49a36);
    margin-bottom: 6px;
}
.panel-input {
    width: 100%;
    background: var(--surface2, #f5f5f5);
    border: 1.5px solid var(--border-s, #ddd);
    border-radius: 8px;
    padding: 10px 12px;
    font-family: inherit; font-size: 1rem;
    color: var(--text, #1a1a1a);
    box-sizing: border-box;
    transition: border-color .15s;
}
.panel-input:focus { outline: none; border-color: var(--amber, #d49a36); }

.panel-area-row {
    display: flex; gap: 8px; align-items: center;
    background: var(--surface2, #f5f5f5);
    border: 1.5px solid var(--border-s, #ddd);
    border-radius: 8px;
    padding: 8px 10px; margin-bottom: 6px;
}
.panel-area-row input {
    background: transparent; border: none;
    font-family: inherit; font-size: 0.88rem;
    color: var(--text, #1a1a1a); min-width: 0;
}
.panel-area-row input:focus { outline: none; }
.panel-area-name { flex: 0 0 150px; font-weight: 700; }
.panel-area-url  { flex: 1; color: var(--dim, #888); font-size: 0.78rem; }
.panel-del-btn {
    background: none; border: none;
    color: var(--dim, #999); cursor: pointer;
    font-size: 1rem; padding: 2px 6px; border-radius: 4px;
    transition: color .15s; flex-shrink: 0;
}
.panel-del-btn:hover { color: #e55; }

.panel-heading-row {
    display: flex; gap: 8px; align-items: center;
    border-left: 3px solid var(--amber, #d49a36);
    background: transparent;
    padding: 6px 10px; margin-bottom: 6px;
}
.panel-heading-row input {
    background: transparent; border: none;
    font-family: inherit; font-size: 0.8rem; font-weight: 800;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--amber, #d49a36); flex: 1; min-width: 0;
}
.panel-heading-row input:focus { outline: none; }
.panel-heading-icon {
    font-size: 0.75rem; color: var(--amber, #d49a36);
    flex-shrink: 0; opacity: 0.6;
}

.panel-pick-btn {
    background: none; border: none;
    color: var(--amber, #d49a36); cursor: pointer;
    font-size: 1.1rem; padding: 2px 5px; border-radius: 4px;
    transition: opacity .15s; flex-shrink: 0;
}
.panel-pick-btn:hover { opacity: .7; }

/* Picker Overlay */
#panel-picker-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.5);
    z-index: 9999;
    display: flex; align-items: flex-end; justify-content: center;
}
.pck-box {
    background: var(--surface, #fff);
    border-radius: 16px 16px 0 0;
    width: 100%; max-width: 600px;
    max-height: 75vh;
    display: flex; flex-direction: column;
    overflow: hidden;
}
.pck-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-s, #eee);
    font-weight: 700; font-size: 0.85rem;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--amber, #d49a36); flex-shrink: 0;
}
.pck-head button { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--dim, #999); }

.pck-tabs {
    display: flex; gap: 4px; padding: 8px 12px;
    border-bottom: 1px solid var(--border-s, #eee);
    flex-shrink: 0;
}
.pck-tab {
    flex: 1; padding: 7px 4px;
    font-family: inherit; font-size: 0.72rem; font-weight: 800;
    border-radius: 8px; border: none; cursor: pointer;
    transition: all 0.2s; text-align: center;
    background: transparent; color: var(--dim, #888);
}
.pck-tab.active        { background: #1e293b; color: #fff; }
.pck-tab.back.active   { background: #e67e22; color: #fff; }
.pck-tab.seiten.active { background: #0891b2; color: #fff; }

.pck-list { overflow-y: auto; flex: 1; padding: 6px 0 20px; }
.pck-tab-content {}
.pck-item {
    width: 100%; background: none; border: none; border-bottom: 1px solid var(--border-s, #f0f0f0);
    padding: 11px 16px; cursor: pointer;
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
    transition: background .1s; text-align: left; font-family: inherit;
}
.pck-item:hover { background: var(--surface2, #f5f5f5); }
.pck-item-name { font-weight: 700; font-size: 0.9rem; color: var(--text, #1a1a1a); }
.pck-item-url  { font-size: 0.68rem; color: var(--dim, #999); font-family: monospace; }
.pck-leer { padding: 20px; text-align: center; font-size: 0.8rem; color: var(--dim, #999); font-style: italic; }

    width: 100%; background: transparent;
    border: 1.5px dashed var(--border-s, #ddd);
    border-radius: 8px; padding: 10px;
    font-family: inherit; font-size: 0.85rem; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--dim, #999); cursor: pointer;
    transition: border-color .15s, color .15s; margin-top: 4px;
}
.panel-add-btn:hover { border-color: var(--amber, #d49a36); color: var(--amber, #d49a36); }

.panel-btn-row { display: flex; gap: 10px; margin-top: 18px; }
.panel-btn {
    font-family: inherit; font-size: 0.85rem; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    padding: 12px 20px; border-radius: 8px;
    cursor: pointer; border: none; transition: all .15s; flex: 1;
}
.panel-btn-primary { background: var(--amber, #d49a36); color: #fff; }
.panel-btn-primary:hover { opacity: .9; }
.panel-btn-secondary {
    background: transparent;
    border: 1.5px solid var(--border-s, #ddd);
    color: var(--dim, #888);
}
.panel-btn-secondary:hover { border-color: var(--amber, #d49a36); color: var(--amber, #d49a36); }

.panel-preview-wrap {
    background: var(--surface2, #f0f0f0);
    border-radius: 10px; padding: 12px; margin-top: 18px; overflow-x: auto;
}
.panel-preview-label {
    font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--dim, #999); margin-bottom: 8px;
}
.panel-section { margin-bottom: 16px; }

/* ── A4 PANEL ── */
#panel-a4 {
    background: #fff; color: #1a1a1a;
    width: 210mm; min-height: 80mm;
    padding: 10mm 14mm 10mm;
    font-family: 'Barlow Condensed','Arial Narrow',sans-serif;
    box-shadow: 0 2px 12px rgba(0,0,0,.15);
}

.pa-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    padding-bottom: 5mm; border-bottom: 0.6mm solid #d49a36; margin-bottom: 4mm;
}
.pa-logo-text { font-family: 'Fraunces','Georgia',serif; }
.pa-logo-main { font-size: 22pt; font-weight: 900; color: #1a1a1a; }
.pa-logo-os   { font-size: 18pt; font-weight: 400; color: #d49a36; }
.pa-logo-sub  { font-size: 7pt; color: #aaa; letter-spacing: 0.14em; text-transform: uppercase; display: block; margin-top: 1mm; font-family: 'Barlow Condensed','Arial Narrow',sans-serif; }
.pa-meta      { font-size: 7pt; color: #aaa; letter-spacing: 0.08em; text-transform: uppercase; text-align: right; }

.pa-station     { font-family: 'Fraunces','Georgia',serif; font-size: 20pt; font-weight: 700; color: #1a1a1a; line-height: 1; margin-bottom: 1.5mm; }
.pa-station-sub { font-size: 7.5pt; color: #888; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 5mm; }

.pa-col-heads { display: grid; grid-template-columns: 30mm 1fr 30mm; gap: 3mm; margin-bottom: 1.5mm; }
.pa-col-heads div { font-size: 6pt; text-transform: uppercase; letter-spacing: 0.1em; color: #bbb; text-align: center; }
.pa-col-heads div:nth-child(2) { text-align: left; padding-left: 2mm; }

.pa-row {
    display: grid; grid-template-columns: 30mm 1fr 30mm; gap: 3mm;
    align-items: center; padding: 2.5mm 0; border-bottom: 0.25mm solid #eee;
}
.pa-row:last-child { border-bottom: none; }

.pa-heading-row {
    font-size: 7pt; font-weight: 800;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: #d49a36; border-bottom: 0.4mm solid #d49a36;
    padding: 3.5mm 0 1mm; margin-top: 1.5mm;
}

.pa-cell-qr  { display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
.pa-qr-box   { width: 26mm; height: 26mm; border: 0.4mm solid #ccc; border-radius: 1mm; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
.pa-qr-box canvas, .pa-qr-box img { width: 100% !important; height: 100% !important; }
.pa-qr-lbl   { font-size: 5pt; color: #bbb; letter-spacing: 0.06em; }

.pa-cell-nfc { display: flex; flex-direction: column; align-items: center; gap: 1.5mm; }
.pa-nfc-ring { width: 26mm; height: 26mm; border: 0.6mm dashed #d49a36; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1mm; }
.pa-nfc-icon { font-family: 'Fraunces','Georgia',serif; font-size: 10pt; font-weight: 700; color: #d49a36; }
.pa-nfc-sub  { font-size: 4.5pt; color: #d49a36; text-transform: uppercase; letter-spacing: 0.1em; }
.pa-nfc-lbl  { font-size: 5pt; color: #bbb; letter-spacing: 0.06em; }

.pa-cell-label { padding: 0 2mm; }
.pa-area-name  { font-family: 'Fraunces','Georgia',serif; font-size: 12pt; font-weight: 600; color: #1a1a1a; line-height: 1.1; margin-bottom: 1mm; }
.pa-area-url   { font-size: 5.5pt; color: #888; word-break: break-all; line-height: 1.4; }
.pa-area-num   { font-size: 6.5pt; color: #ccc; margin-top: 1mm; font-weight: 700; letter-spacing: 0.05em; }

.pa-footer {
    margin-top: 5mm; padding-top: 2.5mm; border-top: 0.25mm solid #eee;
    display: flex; justify-content: space-between; align-items: center;
}
.pa-footer span { font-size: 5.5pt; color: #bbb; letter-spacing: 0.05em; }
.pa-footer-dot { width: 2.5mm; height: 2.5mm; background: #d49a36; border-radius: 50%; display: inline-block; margin-right: 1.5mm; vertical-align: middle; }

@media print {
    .screen-only > *:not(#tab-panel) { display: none !important; }
    .dz-tabs { display: none !important; }
    #tab-panel { display: block !important; }
    .panel-wrap > *:not(.panel-preview-wrap) { display: none !important; }
    .panel-preview-wrap { background: none !important; padding: 0 !important; }
    .panel-preview-label { display: none !important; }
    #panel-a4 { box-shadow: none !important; width: 100% !important; }
    @page { size: A4 portrait; margin: 0; }
}
`;

// ── HTML ───────────────────────────────────────────────────────────────
var HTML = `
<div class="panel-wrap">

    <div class="panel-section">
        <label class="panel-field-label">Station / Ort</label>
        <input type="text" class="panel-input" id="panel-station" value=""
               oninput="PANEL_onStation(this.value)">
    </div>

    <div class="panel-section">
        <label class="panel-field-label">Bereiche</label>
        <div id="panel-area-list"></div>
        <button class="panel-add-btn" onclick="PANEL_addArea()">+ Bereich hinzufügen</button>
        <button class="panel-add-btn" onclick="PANEL_addHeading()" style="margin-top:6px">+ Überschrift</button>
    </div>

    <div class="panel-btn-row">
        <button class="panel-btn panel-btn-primary"   onclick="PANEL_render()">↻ Vorschau</button>
        <button class="panel-btn panel-btn-secondary" onclick="PANEL_print()">⎙ Drucken</button>
    </div>

    <div class="panel-preview-wrap">
        <div class="panel-preview-label">Druckvorschau · A4 Hochformat</div>
        <div id="panel-a4"></div>
    </div>

</div>`;

// ── INIT ───────────────────────────────────────────────────────────────
function init() {
    var container = document.getElementById('tab-panel');
    if (!container) return;

    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    container.innerHTML = HTML;

    loadState();
    document.getElementById('panel-station').value = state.station;
    renderAreaList();
    PANEL_render();
}

// ── DATEN FÜR PICKER ──────────────────────────────────────────────────
var pickerData = { lief: [], back: [], seiten: [] };
var pickerLoaded = false;

var LAGERTYP_FARBE = { tk: '#3b82f6', kuehl: '#22c55e', trocken: '#f59e0b', sonstiges: '#a855f7', backware: '#e67e22', seite: '#0891b2' };

function getBaseUrl() {
    // Root ableiten — druckzentrale liegt in /druckzentrale/
    return window.location.href.replace(/druckzentrale\/[^/?#]*.*$/, '');
}

async function ladePicker() {
    if (pickerLoaded) return;
    var base = getBaseUrl();

    // Lieferanten
    var pfadeLief = ['../lieferanten_config.json', base + 'lieferanten_config.json'];
    for (var i = 0; i < pfadeLief.length; i++) {
        try {
            var r = await fetch(pfadeLief[i], { cache: 'no-store' });
            if (r.ok) { var d = await r.json(); pickerData.lief = Array.isArray(d) ? d : (d.produkte || []); break; }
        } catch(e) {}
    }

    // Backwaren
    var pfadeProd = ['../produkt_config.json', base + 'produkt_config.json'];
    for (var i = 0; i < pfadeProd.length; i++) {
        try {
            var r = await fetch(pfadeProd[i], { cache: 'no-store' });
            if (r.ok) { pickerData.back = await r.json(); break; }
        } catch(e) {}
    }

    // Seiten aus BOS_PAGE_CONFIG
    var cfg = window.BOS_PAGE_CONFIG || {};
    pickerData.seiten = Object.keys(cfg).map(function(key) {
        return { key: key, title: (cfg[key].title || key).replace(/\n/g, ' ') };
    });

    pickerLoaded = true;
}

// ── AREA EDITOR ────────────────────────────────────────────────────────

window.PANEL_openPicker = async function(i) {
    await ladePicker();
    var base = getBaseUrl();

    var overlay = document.createElement('div');
    overlay.id = 'panel-picker-overlay';

    function buildTab(id, label, color, items, buildRow) {
        return '<div class="pck-tab-content" id="pck-view-' + id + '" style="display:none">' +
            (!items.length
                ? '<div class="pck-leer">' + label + ' nicht geladen</div>'
                : items.map(buildRow).join('')
            ) +
        '</div>';
    }

    var liefRows = pickerData.lief.map(function(p) {
        var url = base + 'lieferanten/produkt_detail.html?id=' + encodeURIComponent(p.id);
        var farbe = LAGERTYP_FARBE[p.lagertyp || 'sonstiges'] || '#888';
        return '<button class="pck-item" style="border-left:3px solid ' + farbe + '" onclick="PANEL_pickPage(' + i + ',\'' + escH(p.name) + '\',\'' + escH(url) + '\')">' +
            '<span class="pck-item-name">' + escH(p.name) + '</span>' +
            '<span class="pck-item-url">' + escH(url) + '</span>' +
        '</button>';
    });

    var backRows = pickerData.back.map(function(p) {
        var name = p.name || p.legacyKey || p.id || '?';
        var url  = base + 'backwaren/steckbrief.html?id=' + encodeURIComponent(p.legacyKey || p.id);
        return '<button class="pck-item" style="border-left:3px solid #e67e22" onclick="PANEL_pickPage(' + i + ',\'' + escH(name) + '\',\'' + escH(url) + '\')">' +
            '<span class="pck-item-name">' + escH(name) + '</span>' +
            '<span class="pck-item-url">' + escH(url) + '</span>' +
        '</button>';
    });

    var seitenRows = pickerData.seiten.map(function(p) {
        var url = base + p.key;
        return '<button class="pck-item" style="border-left:3px solid #0891b2" onclick="PANEL_pickPage(' + i + ',\'' + escH(p.title) + '\',\'' + escH(url) + '\')">' +
            '<span class="pck-item-name">' + escH(p.title) + '</span>' +
            '<span class="pck-item-url">' + escH(p.key) + '</span>' +
        '</button>';
    });

    overlay.innerHTML =
        '<div class="pck-box">' +
            '<div class="pck-head">' +
                '<span>Bereich wählen</span>' +
                '<button onclick="document.getElementById(\'panel-picker-overlay\').remove()">✕</button>' +
            '</div>' +
            '<div class="pck-tabs">' +
                '<button class="pck-tab active" id="pck-tab-lief"    onclick="PANEL_pckTab(\'lief\')">📦 Lieferanten</button>' +
                '<button class="pck-tab back"   id="pck-tab-back"    onclick="PANEL_pckTab(\'back\')">🥐 Backwaren</button>' +
                '<button class="pck-tab seiten" id="pck-tab-seiten"  onclick="PANEL_pckTab(\'seiten\')">📄 Seiten</button>' +
            '</div>' +
            '<div class="pck-list">' +
                '<div class="pck-tab-content" id="pck-view-lief">' +
                    (!pickerData.lief.length ? '<div class="pck-leer">Lieferanten nicht geladen</div>' : liefRows.join('')) +
                '</div>' +
                '<div class="pck-tab-content" id="pck-view-back" style="display:none">' +
                    (!pickerData.back.length ? '<div class="pck-leer">Backwaren nicht geladen</div>' : backRows.join('')) +
                '</div>' +
                '<div class="pck-tab-content" id="pck-view-seiten" style="display:none">' +
                    (!pickerData.seiten.length ? '<div class="pck-leer">Keine Seiten gefunden</div>' : seitenRows.join('')) +
                '</div>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
};

window.PANEL_pckTab = function(tab) {
    ['lief','back','seiten'].forEach(function(t) {
        document.getElementById('pck-tab-'   + t).classList.toggle('active', t === tab);
        document.getElementById('pck-view-'  + t).style.display = t === tab ? 'block' : 'none';
    });
};

window.PANEL_pickPage = function(i, title, url) {
    state.areas[i].name = title;
    state.areas[i].url  = url;
    saveState();
    var overlay = document.getElementById('panel-picker-overlay');
    if (overlay) overlay.remove();
    renderAreaList();
    PANEL_render();
};

function renderAreaList() {
    var list = document.getElementById('panel-area-list');
    if (!list) return;
    list.innerHTML = state.areas.map(function(a, i) {
        if (a.type === 'heading') {
            return '<div class="panel-heading-row">' +
                '<span class="panel-heading-icon">▸</span>' +
                '<input type="text" value="' + escH(a.name) + '" placeholder="Gruppenüberschrift"' +
                ' oninput="PANEL_updateArea(' + i + ',\'name\',this.value)">' +
                '<button class="panel-del-btn" onclick="PANEL_removeArea(' + i + ')">✕</button>' +
            '</div>';
        }
        return '<div class="panel-area-row">' +
            '<input class="panel-area-name" type="text" value="' + escH(a.name) + '" placeholder="Bereichsname"' +
            ' oninput="PANEL_updateArea(' + i + ',\'name\',this.value)">' +
            '<input class="panel-area-url" type="text" value="' + escH(a.url) + '" placeholder="https://…"' +
            ' oninput="PANEL_updateArea(' + i + ',\'url\',this.value)">' +
            '<button class="panel-pick-btn" onclick="PANEL_openPicker(' + i + ')" title="Aus BOS-Seiten wählen">⊕</button>' +
            '<button class="panel-del-btn"  onclick="PANEL_removeArea(' + i + ')">✕</button>' +
        '</div>';
    }).join('');
}

window.PANEL_onStation   = function(v) { state.station = v; saveState(); PANEL_render(); };
window.PANEL_addArea     = function() { state.areas.push({ name: 'Neuer Bereich', url: '' }); saveState(); renderAreaList(); };
window.PANEL_addHeading  = function() { state.areas.push({ type: 'heading', name: 'Gruppe' }); saveState(); renderAreaList(); PANEL_render(); };
window.PANEL_removeArea  = function(i) { state.areas.splice(i, 1); saveState(); renderAreaList(); PANEL_render(); };
window.PANEL_updateArea  = function(i, f, v) { state.areas[i][f] = v; saveState(); PANEL_render(); };

// ── QR HELPER ─────────────────────────────────────────────────────────
function makeQR(container, url) {
    container.innerHTML = '';
    if (!url || url.indexOf('http') !== 0) {
        container.innerHTML = '<span style="font-size:6pt;color:#ccc">–</span>';
        return;
    }
    if (typeof QRCode === 'undefined') return;
    try {
        new QRCode(container, { text: url, width: 98, height: 98, colorDark: '#1a1a1a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    } catch(e) {}
}

// ── RENDER ─────────────────────────────────────────────────────────────
window.PANEL_render = function() {
    var panel = document.getElementById('panel-a4');
    if (!panel) return;

    var now = new Date();
    var dateStr = ('0'+now.getDate()).slice(-2) + '.' + ('0'+(now.getMonth()+1)).slice(-2) + '.' + now.getFullYear();

    var rows = state.areas.map(function(a, i) {
        if (a.type === 'heading') {
            return '<div class="pa-heading-row">' + escH(a.name) + '</div>';
        }
        var isOdd = (i % 2 === 0);
        var qrId  = 'pa-qr-' + i;
        var num   = ('0'+(i+1)).slice(-2);

        var qr    = '<div class="pa-cell-qr"><div class="pa-qr-box" id="' + qrId + '"></div><div class="pa-qr-lbl">QR-Code</div></div>';
        var nfc   = '<div class="pa-cell-nfc"><div class="pa-nfc-ring"><span class="pa-nfc-icon">NFC</span><span class="pa-nfc-sub">Aufkleber</span></div><div class="pa-nfc-lbl">Chip aufkleben</div></div>';
        var label = '<div class="pa-cell-label"><div class="pa-area-name">' + escH(a.name) + '</div><div class="pa-area-url">' + escH(a.url) + '</div><div class="pa-area-num"># ' + num + '</div></div>';

        return '<div class="pa-row">' + (isOdd ? qr + label + nfc : nfc + label + qr) + '</div>';
    }).join('');

    panel.innerHTML =
        '<div class="pa-header">' +
            '<div class="pa-logo-text">' +
                '<span class="pa-logo-main">Bäckerei</span><span class="pa-logo-os">OS</span>' +
                '<span class="pa-logo-sub">Bäckerei Langrehr · Garbsen · Havelse</span>' +
            '</div>' +
            '<div class="pa-meta">NFC-Zugangspanel · ' + dateStr + '</div>' +
        '</div>' +
        '<div class="pa-station">' + escH(state.station) + '</div>' +
        '<div class="pa-station-sub">Schnellzugriff · BäckereiOS</div>' +
        '<div class="pa-col-heads"><div>QR / NFC</div><div>Bereich</div><div>NFC / QR</div></div>' +
        '<div>' + rows + '</div>' +
        '<div class="pa-footer">' +
            '<span><span class="pa-footer-dot"></span>BäckereiOS · Druckzentrale · Panel</span>' +
            '<span>NFC-Chip nach Druck aufkleben → URL programmieren</span>' +
        '</div>';

    state.areas.forEach(function(a, i) {
        var box = document.getElementById('pa-qr-' + i);
        if (box) makeQR(box, a.url);
    });
};

window.PANEL_print = function() {
    var panel = document.getElementById('panel-a4');
    if (!panel) return;
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700;900&family=Barlow+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet">' +
        '<style>' +
        '* { box-sizing: border-box; margin: 0; padding: 0; }' +
        'body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        '#panel-a4 { width: 210mm; padding: 10mm 14mm; font-family: "Barlow Condensed","Arial Narrow",sans-serif; }' +
        document.getElementById('panel-a4').closest('.panel-preview-wrap').previousElementSibling ? '' : '' +
        // Alle pa-* Styles aus dem Dokument übernehmen
        Array.from(document.styleSheets).reduce(function(acc, ss) {
            try {
                return acc + Array.from(ss.cssRules)
                    .filter(function(r) { return r.cssText && r.cssText.indexOf('.pa-') !== -1; })
                    .map(function(r) { return r.cssText; }).join('\n');
            } catch(e) { return acc; }
        }, '') +
        '@page { size: A4 portrait; margin: 0; }' +
        '</style></head><body>' +
        '<div id="panel-a4">' + panel.innerHTML + '</div>' +
        '<script>window.onload=function(){window.print();window.close();}<\/script>' +
        '</body></html>';
    var w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { alert('Popup blockiert — bitte Popup-Blocker deaktivieren'); return; }
    w.document.write(html);
    w.document.close();
};

// ── START ──────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
