// druckzentrale_modul_i.js  v2
// Modul I — Absetz-Formular (Samstag → Sonntag / Montag)
//
// Neu gegenüber v1:
//   • Grußzeile editierbar
//   • Dropdowns 0–50 (leer = Kästchen auf dem Ausdruck → per Hand ausfüllbar)
//   • Extra-Zeilen hinzufügbar, gespeichert in localStorage BOS_AF_EXTRA_v1
//   • Datumsspalten mit echten So/Mo-Daten im Header

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_I = [
    '/* --- ABSETZ-FORMULAR v2 --- */',

    /* Seite */
    '.af-page { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10pt; }',

    /* Grußzeile */
    '.af-gruss { margin-bottom: 22px; }',
    '.af-gruss-input { width: 100%; font-weight: bold; font-size: 11.5pt; line-height: 1.45;',
    '  border: none !important; border-bottom: 2px solid #000 !important;',
    '  background: transparent !important; box-shadow: none !important;',
    '  padding: 0 0 4px !important; resize: none; outline: none; overflow: hidden;',
    '  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important; }',

    /* Haupttabelle */
    '.af-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }',
    '.af-table colgroup col.af-col-name { width: 56%; }',
    '.af-table colgroup col.af-col-day  { width: 22%; }',
    '.af-table th { font-size: 8.5pt; letter-spacing: 0.08em; text-transform: uppercase;',
    '  color: #555; font-weight: normal; padding: 0 8px 7px; text-align: left;',
    '  border-bottom: 1.5px solid #aaa; }',
    '.af-table th.af-c { text-align: center; }',
    '.af-table td { padding: 7px 8px; border-bottom: 1px solid #eee; vertical-align: middle; }',
    '.af-table tbody tr:last-child td { border-bottom: none; }',
    '.af-table tbody tr.af-zebra td { background-color: #f2f2f2 !important;',
    '  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }',
    '.af-prod-input { font-weight: bold; width: 100%;',
    '  border: none !important; background: transparent !important;',
    '  box-shadow: none !important; padding: 0 !important; font-size: 10pt !important;',
    '  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important; }',
    'input.af-prod-input::placeholder { color: transparent !important; }',
    '.af-num { text-align: center; }',

    /* Selects */
    '.af-sel { width: 54px !important; padding: 3px 5px !important; text-align: center; }',
    /* Leer = Kästchen zum Reinschreiben */
    'select.af-empty { color: transparent !important; }',

    /* Trennzeile */
    '.af-sep-row td { background-color: #e8e8e8 !important;',
    '  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;',
    '  padding: 5px 8px; border-top: 1.5px solid #aaa; border-bottom: 1px solid #ccc;',
    '  font-size: 8.5pt; letter-spacing: 0.08em; text-transform: uppercase;',
    '  color: #555; font-weight: normal; }',
    '.af-sep-row td.af-c { text-align: center; }',

    /* + Zeile Button: auf Druck unsichtbar */
    '.af-add-btn-wrap { display: none !important; }',

    /* Mohn/Sesam Block */
    '.af-block { border: 1px solid #ccc; margin-bottom: 16px; }',
    '.af-block-head { background-color: #e8e8e8 !important;',
    '  -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;',
    '  padding: 5px 10px; font-size: 8.5pt; letter-spacing: 0.08em;',
    '  text-transform: uppercase; color: #555; font-weight: normal; border-bottom: 1px solid #ccc; }',
    '.af-block-body { padding: 10px; font-size: 10pt;',
    '  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
    '.af-bold { font-weight: bold; }',
    '.af-dim  { color: #999; font-size: 9.5pt; }',

    /* Anmerkungen */
    '.af-anm-label { font-size: 8.5pt; letter-spacing: 0.08em; text-transform: uppercase;',
    '  color: #777; margin-bottom: 6px; margin-top: 4px; }',
    '.af-anm-text { width: 100% !important; height: 90px !important;',
    '  border: 1px solid #bbb !important; padding: 10px 12px !important;',
    '  resize: none; font-size: 10pt !important;',
    '  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important; }'
].join('\n');

// ── HILFSFUNKTIONEN ──────────────────────────────────────────────────
function _DZ_I_pad(n) { return n < 10 ? '0' + n : '' + n; }

function _DZ_I_nextWeekend() {
    var today = new Date();
    var dow   = today.getDay(); // 0=So, 1=Mo, …, 6=Sa
    var daysToSo = (7 - dow) % 7 || 7;
    var nextSo = new Date(today);
    nextSo.setDate(today.getDate() + daysToSo);
    var nextMo = new Date(nextSo);
    nextMo.setDate(nextSo.getDate() + 1);
    return {
        soLabel: 'So ' + _DZ_I_pad(nextSo.getDate()) + '.' + _DZ_I_pad(nextSo.getMonth() + 1) + '.',
        moLabel: 'Mo ' + _DZ_I_pad(nextMo.getDate()) + '.' + _DZ_I_pad(nextMo.getMonth() + 1) + '.'
    };
}

// Leeres Select → Klasse setzen (→ Kästchen auf Druck)
function _DZ_I_updateEmpty(sel) {
    if (!sel.value || sel.value === ' ') {
        sel.classList.add('af-empty');
    } else {
        sel.classList.remove('af-empty');
    }
}

// Dropdown 0–50 aufbauen, erstes Element = Kästchen-Option
function _DZ_I_buildSel(sel, savedVal) {
    sel.innerHTML = '';
    var empty = document.createElement('option');
    empty.value = ''; empty.textContent = '\u00a0'; // non-breaking space
    sel.appendChild(empty);
    for (var n = 1; n <= 50; n++) {
        var o = document.createElement('option');
        o.value = n; o.textContent = n;
        if (String(n) === String(savedVal)) o.selected = true;
        sel.appendChild(o);
    }
    _DZ_I_updateEmpty(sel);
    sel.addEventListener('change', function() { _DZ_I_updateEmpty(this); _DZ_I_saveExtra(); });
}

// ── EXTRA-ZEILEN (localStorage) ──────────────────────────────────────
var _DZ_I_LS_KEY   = 'BOS_AF_EXTRA_v1';
var _DZ_I_FIXED    = 5; // Anzahl fixer Produktzeilen

function _DZ_I_saveExtra() {
    var tbody = document.getElementById('af-tbody');
    if (!tbody) return;
    var rows = [];
    tbody.querySelectorAll('tr.af-extra-row').forEach(function(tr) {
        var inp  = tr.querySelector('input.af-prod-input');
        var sels = tr.querySelectorAll('select.af-sel');
        rows.push({
            name: inp  ? inp.value  : '',
            so:   sels[0] ? sels[0].value : '',
            mo:   sels[1] ? sels[1].value : ''
        });
    });
    try { localStorage.setItem(_DZ_I_LS_KEY, JSON.stringify(rows)); } catch(e) {}
}

function _DZ_I_makeExtraRow(name, soVal, moVal, idx) {
    var isZebra = (_DZ_I_FIXED + idx) % 2 === 0;
    var tr = document.createElement('tr');
    tr.className = 'af-extra-row' + (isZebra ? ' af-zebra' : '');

    // Produktname
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'af-prod-input';
    inp.value = name || '';
    inp.placeholder = 'Produkt…';
    inp.style.cssText = 'flex:1;border:none;border-bottom:1.5px solid #ccc;background:transparent;' +
                        'font-weight:bold;font-size:10pt;padding:2px 0;outline:none;width:100%;';
    inp.oninput = _DZ_I_saveExtra;

    var tdName = document.createElement('td');
    tdName.appendChild(inp);
    tr.appendChild(tdName);

    // So / Mo Selects
    [soVal, moVal].forEach(function(val) {
        var sel = document.createElement('select');
        sel.className = 'af-sel';
        sel.style.cssText = 'width:54px;padding:3px 5px;text-align:center;';
        _DZ_I_buildSel(sel, val);
        var td = document.createElement('td');
        td.className = 'af-num';
        td.appendChild(sel);
        tr.appendChild(td);
    });

    return tr;
}

// Aus localStorage laden
function _DZ_I_loadExtra() {
    var tbody = document.getElementById('af-tbody');
    if (!tbody) return;
    var data = [];
    try {
        var d = JSON.parse(localStorage.getItem(_DZ_I_LS_KEY));
        if (Array.isArray(d)) data = d.filter(function(x) { return x && (x.name || x.so || x.mo); });
    } catch(e) {}
    data.forEach(function(item, i) {
        tbody.appendChild(_DZ_I_makeExtraRow(item.name, item.so, item.mo, i));
    });
}

// Neue Zeile via Button
window.DZ_I_addRow = function() {
    var tbody = document.getElementById('af-tbody');
    if (!tbody) return;
    var existing = tbody.querySelectorAll('tr.af-extra-row').length;
    var tr = _DZ_I_makeExtraRow('', '', '', existing);
    tbody.appendChild(tr);
    var inp = tr.querySelector('input');
    if (inp) inp.focus();
    _DZ_I_saveExtra();
};

// ── HTML-TEMPLATE ────────────────────────────────────────────────────
function DZ_I_render() {
    var body = document.getElementById('module-I-body');
    if (!body) return;

    var PRODUCTS = [
        'Buttercroissant',
        'Schokocroissant',
        'Laugenecken',
        'Mini Buttercroissant',
        'Mini Schokocroissant'
    ];

    var dates = _DZ_I_nextWeekend();

    // ── HTML aufbauen ──
    var html = '<div class="af-page">';

    // Grußzeile
    html += '<div class="af-gruss">';
    html += '<textarea class="af-gruss-input no-print-placeholder" rows="2"' +
            ' placeholder="Guten Morgen! Bitte setzt folgende Sachen ab:"' +
            ' style="width:100%;font-size:11.5pt;font-weight:bold;' +
            'border:none;border-bottom:2px solid #ccc;resize:none;padding:0 0 6px;' +
            'font-family:Arial,sans-serif;outline:none;box-shadow:none;background:transparent;' +
            'display:block;line-height:1.45;">';
    html += 'Guten Morgen! Bitte setzt folgende Sachen ab:';
    html += '</textarea>';
    html += '</div>';

    // Produkttabelle
    html += '<table class="af-table">';
    html += '<colgroup>';
    html += '<col class="af-col-name"><col class="af-col-day"><col class="af-col-day">';
    html += '</colgroup>';
    html += '<thead><tr>';
    html += '<th>Produkt</th>';
    html += '<th class="af-c" id="af-th-so">Sonntag</th>';
    html += '<th class="af-c" id="af-th-mo">Montag</th>';
    html += '</tr></thead>';
    html += '<tbody id="af-tbody">';

    PRODUCTS.forEach(function(name, i) {
        var isZebra = i % 2 === 0;
        html += '<tr class="' + (isZebra ? 'af-zebra' : '') + '">';
        html += '<td><input type="text" class="af-prod-input" value="' + name + '"' +
                ' style="font-weight:bold;width:100%;border:none;background:transparent;' +
                'font-size:10pt;padding:2px 0;outline:none;"></td>';
        html += '<td class="af-num"><select class="af-sel" id="af-so-' + i + '"' +
                ' style="width:54px;padding:3px 5px;text-align:center;"></select></td>';
        html += '<td class="af-num"><select class="af-sel" id="af-mo-' + i + '"' +
                ' style="width:54px;padding:3px 5px;text-align:center;"></select></td>';
        html += '</tr>';
    });

    // Käsebrötchen-Trennzeile + Zeile
    html += '<tr class="af-sep-row">';
    html += '<td>Käsebrötchen</td>';
    html += '<td class="af-c">Sonntag</td>';
    html += '<td class="af-c">Montag</td>';
    html += '</tr>';
    html += '<tr>';
    html += '<td><input type="text" class="af-prod-input" value="Käsebrötchen belegen"' +
            ' style="font-weight:bold;width:100%;border:none;background:transparent;' +
            'font-size:10pt;padding:2px 0;outline:none;"></td>';
    html += '<td class="af-num"><select class="af-sel" id="af-kase-so"' +
            ' style="width:54px;padding:3px 5px;text-align:center;"></select></td>';
    html += '<td class="af-num"><select class="af-sel" id="af-kase-mo"' +
            ' style="width:54px;padding:3px 5px;text-align:center;"></select></td>';
    html += '</tr>';

    html += '</tbody></table>';

    // + Zeile hinzufügen (nur auf dem Bildschirm sichtbar)
    html += '<div class="af-add-btn-wrap no-print" style="margin:-6px 0 18px;">';
    html += '<button class="fs-add-btn" onclick="DZ_I_addRow()">+ Zeile hinzufügen</button>';
    html += '</div>';

    // Mohn + Sesam Block
    html += '<div class="af-block">';
    html += '<div class="af-block-head">Mohn und Sesam</div>';
    html += '<div class="af-block-body" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px;">';
    html += 'Bitte&nbsp;<select class="af-sel" id="af-mohn" style="width:54px;padding:3px 5px;text-align:center;"></select>';
    html += '&nbsp;<span class="af-bold">Bleche Mohnbrötchen</span>';
    html += '&nbsp;<span class="af-dim">+</span>&nbsp;';
    html += '<select class="af-sel" id="af-sesam" style="width:54px;padding:3px 5px;text-align:center;"></select>';
    html += '&nbsp;<span class="af-bold">Bleche Sesambrötchen</span>';
    html += '&nbsp;<span class="af-dim">fertig machen</span>';
    html += '</div></div>';

    // Anmerkungen
    html += '<div class="af-anm-label">Anmerkungen</div>';
    html += '<textarea class="af-anm-text no-print-placeholder"' +
            ' placeholder="Hinweise, Sonderaufträge, Besonderheiten\u2026"' +
            ' style="width:100%;height:90px;border:1px solid #ccc;padding:10px 12px;' +
            'resize:vertical;font-family:Arial,sans-serif;font-size:10pt;' +
            'outline:none;box-shadow:none;display:block;"></textarea>';

    html += '</div>'; // .af-page

    body.innerHTML = html;

    // ── Spaltenkopf mit echten Daten ──
    var thSo = document.getElementById('af-th-so');
    var thMo = document.getElementById('af-th-mo');
    if (thSo) thSo.textContent = dates.soLabel;
    if (thMo) thMo.textContent = dates.moLabel;

    // ── Alle Selects befüllen ──
    var allSels = body.querySelectorAll('select.af-sel');
    allSels.forEach(function(sel) { _DZ_I_buildSel(sel, ''); });

    // Käsebrötchen explizit (30er-Max wäre genug, aber 50 ist konsistent)
    // → bereits durch allSels erledigt

    // ── Grußzeile: Auto-Resize ──
    var gruss = body.querySelector('.af-gruss-input');
    if (gruss) {
        gruss.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    // ── Extra-Zeilen aus localStorage laden ──
    _DZ_I_loadExtra();
}
