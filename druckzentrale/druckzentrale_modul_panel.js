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

.panel-add-btn {
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

// ── AREA EDITOR ────────────────────────────────────────────────────────
function renderAreaList() {
    var list = document.getElementById('panel-area-list');
    if (!list) return;
    list.innerHTML = state.areas.map(function(a, i) {
        return '<div class="panel-area-row">' +
            '<input class="panel-area-name" type="text" value="' + escH(a.name) + '" placeholder="Bereichsname"' +
            ' oninput="PANEL_updateArea(' + i + ',\'name\',this.value)">' +
            '<input class="panel-area-url" type="text" value="' + escH(a.url) + '" placeholder="https://…"' +
            ' oninput="PANEL_updateArea(' + i + ',\'url\',this.value)">' +
            '<button class="panel-del-btn" onclick="PANEL_removeArea(' + i + ')">✕</button>' +
        '</div>';
    }).join('');
}

window.PANEL_onStation   = function(v) { state.station = v; saveState(); var el = document.querySelector('#panel-a4 .pa-station'); if (el) el.textContent = v; };
window.PANEL_addArea     = function() { state.areas.push({ name: 'Neuer Bereich', url: 'https://baeckereios.github.io/' }); saveState(); renderAreaList(); };
window.PANEL_removeArea  = function(i) { state.areas.splice(i, 1); saveState(); renderAreaList(); };
window.PANEL_updateArea  = function(i, f, v) { state.areas[i][f] = v; saveState(); };

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

window.PANEL_print = function() { window.print(); };

// ── START ──────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
