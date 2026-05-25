// druckzentrale_modul_e.js
// Modul E — Frosterliste (Kopiervorlage)
// Zuständig für: HTML-Template, fl_renderTable(), Persistenz BOS_FL_STATE_v1
// Print-CSS: DZ_PRINT_CSS_E

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_E = [
    '/* --- FROSTERLISTE --- */',
    '.fl-page { width: 100%; font-family: "Barlow", Arial, sans-serif; color: #000; }',
    '.fl-header { position: relative; text-align: center; margin-bottom: 6mm; padding-bottom: 3mm; border-bottom: 2.5px solid #000; }',
    '.fl-title { font-family: "Barlow Condensed", sans-serif; font-size: 24pt; font-weight: 800; color: #000; letter-spacing: -0.5px; margin: 0; line-height: 1; }',
    '.fl-title span { color: #000; }',
    '.fl-meta { position: absolute; right: 0; bottom: 3mm; display: flex; flex-direction: column; align-items: flex-end; }',
    '.fl-meta-lbl { font-size: 8pt; font-weight: 600; color: #555; font-family: "Barlow Condensed", sans-serif; text-transform: uppercase; margin: 0; }',
    '.fl-meta-val { font-size: 11pt; font-weight: 700; color: #000; font-family: "Barlow Condensed", sans-serif; margin: 0; }',
    '.fl-table { width: 100%; border-collapse: collapse; font-size: 8.2pt; min-width: 0; margin-bottom: 20px; }',
    '.fl-table th { font-family: "Barlow Condensed", sans-serif; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; padding: 4px 5px; text-align: center; border: 1px solid #000; }',
    '.fl-table thead tr:first-child th { background: #000; color: #fff; }',
    '.fl-table thead tr:last-child th { background: #e0e0e0; color: #000; font-size: 7.5pt; padding: 3px 4px; border: 1px solid #000; }',
    '.fl-table th.col-produkt { text-align: left !important; padding-left: 6px !important; }',
    '.fl-table th.col-mosa { width: 17%; text-align: left !important; padding-left: 6px !important; }',
    '.fl-table th.col-so { width: 28%; text-align: left !important; padding-left: 6px !important; }',
    '.fl-table th.col-zahlen { width: 11%; }',
    '.fl-table tbody tr:nth-child(even) td:not(.no-sunday) { background: #f7f7f7; }',
    '.fl-table tbody tr:nth-child(odd)  td:not(.no-sunday) { background: #fff; }',
    '.fl-table td { border: 1px solid #000; padding: 2px 4px; text-align: center; vertical-align: middle; height: 25px; color: #000; }',
    '.fl-table td.sep-r, .fl-table th.sep-r { border-right: 2px solid #000 !important; }',
    '.fl-table td.produkt-mosa, .fl-table td.produkt-so { text-align: left; font-weight: 600; font-size: 8.5pt; padding-left: 6px; }',
    '.fl-table td.no-sunday { background: #ddd !important; border-color: #ddd !important; }',
    '.fl-notes-lbl { font-family: "Barlow Condensed", sans-serif; font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #000; margin-bottom: 4px; }',
    '.fl-notes-box { border: 1.5px solid #000; border-radius: 4px; padding: 5px 8px; min-height: 20mm; font-size: 8pt; }'
].join('\n');

// ── HTML-TEMPLATE ────────────────────────────────────────────────────
function DZ_E_render() {
    var body = document.getElementById('module-E-body');
    if (!body) return;

    body.innerHTML = [
        '<div class="fl-page">',
        '  <div class="fl-header">',
        '    <div class="fl-title">Froster<span>liste</span></div>',
        '    <div class="fl-meta">',
        '      <div class="fl-meta-lbl">Datum:</div>',
        '      <div class="fl-meta-val" contenteditable="true">___ . ___ . 20___</div>',
        '    </div>',
        '  </div>',
        '  <div class="fl-table-responsive">',
        '    <table class="fl-table" id="fl-table">',
        '      <thead>',
        '        <tr>',
        '          <th colspan="2" class="col-produkt">Produkt</th>',
        '          <th rowspan="2" class="col-zahlen">Bestand</th>',
        '          <th rowspan="2" class="col-zahlen sep-r">Zu&shy;viel</th>',
        '          <th rowspan="2" class="col-zahlen sep-r">Soll<br>nä. Tag</th>',
        '          <th rowspan="2" class="col-zahlen">Fehlt</th>',
        '          <th rowspan="2" class="col-zahlen">Wohin</th>',
        '        </tr>',
        '        <tr>',
        '          <th class="col-mosa">MoSa</th>',
        '          <th class="col-so">Sonntag</th>',
        '        </tr>',
        '      </thead>',
        '      <tbody id="fl-tbody"></tbody>',
        '    </table>',
        '  </div>',
        '  <div class="no-print" style="margin:10px 0 20px;">',
        '    <button class="fl-btn-add" onclick="fl_addRow()">+ Zeile hinzufügen</button>',
        '    <button class="fl-btn-remove" onclick="fl_removeRow()">− Letzte Zeile entfernen</button>',
        '  </div>',
        '  <div class="fl-notes-lbl">Notizen / Sonderbestellungen</div>',
        '  <div class="fl-notes-box" contenteditable="true"></div>',
        '</div>'
    ].join('\n');
}

// ── PERSISTENZ & RENDER-ENGINE ───────────────────────────────────────
(function() {
    var LS_KEY  = 'BOS_FL_STATE_v1';
    var LS_ROWS = 'BOS_FL_ROWS_v1';

    var WOHIN_LABELS = {
        'koma7':          'Koma 7',
        'schrippen_koma': 'Schrippen Koma',
        'froster':        'Froster',
        'kuehlung':       'Kühlung',
        '':               ''
    };

    function loadState() {
        try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e) { return {}; }
    }
    function saveState() {
        var state = {};
        var tbody = document.getElementById('fl-tbody');
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function(tr, i) {
            var mosa  = tr.querySelector('.produkt-mosa');
            var so    = tr.querySelector('.produkt-so');
            var wohin = tr.querySelector('.produkt-wohin');
            state['row_' + i] = {
                mosa:  mosa  ? mosa.textContent  : null,
                so:    so    ? so.textContent    : null,
                wohin: wohin ? wohin.textContent : ''
            };
        });
        try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e) {}
    }
    function loadRowCount() {
        try { return parseInt(localStorage.getItem(LS_ROWS)) || 0; } catch(e) { return 0; }
    }
    function saveRowCount(n) {
        try { localStorage.setItem(LS_ROWS, String(n)); } catch(e) {}
    }

    function makeRow(mosaText, soText, wohinText) {
        var tr = document.createElement('tr');
        var isMosaOnly = (soText === null);

        var tdMosa = document.createElement('td');
        tdMosa.className = 'produkt-mosa';
        tdMosa.contentEditable = 'true';
        tdMosa.textContent = mosaText || '';
        tdMosa.addEventListener('input', saveState);
        tr.appendChild(tdMosa);

        var tdSo = document.createElement('td');
        if (isMosaOnly) {
            tdSo.className = 'no-sunday';
        } else {
            tdSo.className = 'produkt-so';
            tdSo.contentEditable = 'true';
            tdSo.textContent = soText || '';
            tdSo.addEventListener('input', saveState);
        }
        tr.appendChild(tdSo);

        tr.appendChild(document.createElement('td'));

        var tdZ = document.createElement('td'); tdZ.className = 'sep-r';
        tr.appendChild(tdZ);
        var tdS = document.createElement('td'); tdS.className = 'sep-r';
        tr.appendChild(tdS);
        tr.appendChild(document.createElement('td'));

        var tdW = document.createElement('td');
        tdW.className = 'produkt-wohin';
        tdW.contentEditable = 'true';
        tdW.textContent = wohinText || '';
        tdW.addEventListener('input', saveState);
        tr.appendChild(tdW);

        return tr;
    }

    window.fl_renderTable = function() {
        var tbody = document.getElementById('fl-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        var state     = loadState();
        var extraRows = loadRowCount();
        var produkte  = (typeof FL_PRODUKTE !== 'undefined') ? FL_PRODUKTE : [];

        produkte.forEach(function(p, i) {
            var saved = state['row_' + i];
            var mosa  = saved ? saved.mosa  : p.mosa;
            var so    = saved ? saved.so    : (p.so !== undefined ? p.so : null);
            var wohin = saved ? saved.wohin : (WOHIN_LABELS[p.wohin || ''] || p.wohin || '');
            var soVal = (p.so === null) ? null : so;
            tbody.appendChild(makeRow(mosa, soVal, wohin));
        });

        var base = produkte.length;
        for (var j = 0; j < extraRows; j++) {
            var idx   = base + j;
            var saved = state['row_' + idx] || {};
            tbody.appendChild(makeRow(saved.mosa || '', saved.so || '', saved.wohin || ''));
        }
    };

    window.fl_addRow = function() {
        var extra = loadRowCount() + 1;
        saveRowCount(extra);
        var tbody = document.getElementById('fl-tbody');
        if (!tbody) return;
        var base  = (typeof FL_PRODUKTE !== 'undefined') ? FL_PRODUKTE.length : 0;
        var saved = loadState()['row_' + (base + extra - 1)] || {};
        tbody.appendChild(makeRow(saved.mosa || '', saved.so || '', saved.wohin || ''));
    };

    window.fl_removeRow = function() {
        var extra = loadRowCount();
        if (extra <= 0) return;
        saveRowCount(extra - 1);
        var state = loadState();
        var base  = (typeof FL_PRODUKTE !== 'undefined') ? FL_PRODUKTE.length : 0;
        delete state['row_' + (base + extra - 1)];
        try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e) {}
        var tbody = document.getElementById('fl-tbody');
        if (tbody && tbody.lastElementChild) tbody.removeChild(tbody.lastElementChild);
    };

    // Wird nach DZ_E_render() aufgerufen
    window.DZ_E_init = function() {
        var tbody = document.getElementById('fl-tbody');
        if (!tbody) { setTimeout(window.DZ_E_init, 50); return; }
        if (typeof FL_PRODUKTE === 'undefined') {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            td.colSpan = 7;
            td.style.cssText = 'padding:12px;color:#c0392b;font-size:11pt;text-align:center;';
            td.textContent = '⚠ frosterliste_produkte.js nicht gefunden';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        fl_renderTable();
    };
})();
