// druckzentrale_ui.js
// UI-Logik für Druckzentrale — Modul-Toggle, Druck-Engine, Frühschicht-Setup

var _active = { A: false, B: false, C: false, D: false, E: false, F: false };
var _locked = { B: false };

// ── MODUL TOGGLE ─────────────────────────────────────────────────────

function toggleCtrl(id) {
    if (_locked[id]) return;

    _active[id] = !_active[id];
    var card = document.getElementById('ctrl-' + id);
    var cc   = document.getElementById('cc-' + id);
    var cfg  = document.getElementById('cfg-' + id);
    var mod  = document.getElementById('module-' + id);

    if (_active[id]) {
        card.classList.add('active');
        cc.textContent = '✓';
        if (cfg) cfg.classList.add('open');
        if (mod) mod.classList.add('active');
        _rerender(id);
    } else {
        card.classList.remove('active');
        cc.textContent = '';
        if (cfg) cfg.classList.remove('open');
        if (mod) mod.classList.remove('active');
    }
}

function onZeitChange(id) {
    if (_active[id]) _rerender(id);
}

function _rerender(id) {
    if (id === 'B') {
        if (typeof DZ_renderFroster === 'function') DZ_renderFroster();
    }
    if (id === 'C') {
        var z1 = DZ_parseDate(document.getElementById('zeit-C1'));
        var z2 = DZ_parseDate(document.getElementById('zeit-C2'));
        if (z1 && z2) DZ_renderWochenziele(z1, z2);
    }
    if (id === 'D') {
        if (typeof DZ_renderVerbrauchsMatrix === 'function') DZ_renderVerbrauchsMatrix();
    }
    if (id === 'F') {
        if (typeof DZ_renderBaeko === 'function') DZ_renderBaeko();
    }
}

function _rerenderAllActive() {
    ['A','B','C','D','E','F'].forEach(function(id) {
        if (_active[id]) _rerender(id);
    });
}

// ── FROSTERLISTE ZEILEN ───────────────────────────────────────────────

function fl_addRow() {
    var tb = document.querySelector('#fl-table tbody');
    var tr = document.createElement('tr');
    tr.innerHTML = '<td class="produkt-mosa" contenteditable="true"></td>'
        + '<td class="produkt-so" contenteditable="true"></td>'
        + '<td></td><td class="sep-r"></td><td class="sep-r"></td><td></td><td></td>';
    tb.appendChild(tr);
}
function fl_removeRow() {
    var tb = document.querySelector('#fl-table tbody');
    if (tb.rows.length > 0) tb.deleteRow(-1);
}

// ── DRUCK-ENGINE ──────────────────────────────────────────────────────

function doPrint() {
    var activeKeys = Object.keys(_active).filter(function(k) { return _active[k]; });
    if (activeKeys.length === 0) { alert('Bitte mindestens ein Dokument auswählen.'); return; }

    // Formularwerte sichern (Input-Werte in HTML-Attribute brennen)
    activeKeys.forEach(function(id) {
        var mod = document.getElementById('module-' + id);
        var body = mod.querySelector('.pm-body');

        body.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(function(inp) {
            inp.setAttribute('value', inp.value);
            if (inp.tagName.toLowerCase() === 'textarea') { inp.innerHTML = inp.value; }
        });

        body.querySelectorAll('select').forEach(function(sel) {
            sel.querySelectorAll('option').forEach(function(opt) {
                if (opt.value === sel.value || opt.textContent === sel.value) {
                    opt.setAttribute('selected', 'selected');
                } else {
                    opt.removeAttribute('selected');
                }
            });
        });
    });

    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    var dateStr = pad(now.getDate()) + '.' + pad(now.getMonth() + 1) + '.' + now.getFullYear();
    var timeStr = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ' Uhr';

    var printCSS = [
        '@page { size: A4 portrait; margin: 15mm; }',
        '* { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
        'body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 0; background: #fff; }',

        '/* --- DONT PRINT UI --- */',
        '.no-print { display: none !important; }',

        '/* --- BRIEFKOPF --- */',
        '.report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 20px; }',
        '.report-logo { font-family: Georgia, serif; font-size: 22pt; font-weight: 900; margin: 0; line-height: 1; }',
        '.report-logo span { font-style: italic; color: #777; font-weight: normal; }',
        '.report-meta { text-align: right; font-size: 8.5pt; color: #555; line-height: 1.4; }',
        '.report-meta strong { color: #000; font-weight: bold; }',

        '/* --- SEITENLAYOUT --- */',
        '.page-wrap { page-break-after: always; position: relative; }',
        '.page-wrap:last-child { page-break-after: auto; }',
        '.pb-after { page-break-after: always; }',

        'tbody, .koerner-wrap, .fd-station-block { break-inside: avoid; page-break-inside: avoid; }',

        '/* --- TYPOGRAFIE & ÜBERSCHRIFTEN --- */',
        '.fd-header { border-bottom: none; margin-bottom: 0; }',
        '.wz-title, .koerner-title, .fd-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px; }',
        '.fd-meta { font-size: 9pt; color: #555; font-weight: normal; margin-bottom: 10px; display: block; }',

        '/* --- TABELLEN DESIGN --- */',
        '.wz-table, .koerner-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #000; }',
        '.wz-table th, .koerner-table th { background: #e0e0e0; padding: 8px 10px; font-size: 8.5pt; font-weight: bold; text-align: left; text-transform: uppercase; border: 1px solid #000; }',
        '.wz-table th.r, .wz-table td.r { text-align: right; }',
        '.wz-table td, .koerner-table td { padding: 7px 10px; border: 1px solid #000; font-size: 10pt; }',
        '.wz-st td { background: #f0f0f0; font-weight: bold; font-size: 9pt; text-transform: uppercase; color: #000; border-top: 2px solid #000; border-bottom: 2px solid #000; }',
        '.wz-row:nth-child(even) { background: #fafafa; }',

        '/* --- KÖRNER SPECIFIC --- */',
        '.koerner-table td.kl { background: #f0f0f0; font-weight: bold; }',
        '.koerner-table td.day { background: #e0e0e0; font-weight: bold; text-align: center; }',

        '/* --- FROSTER BESTAND DESIGN --- */',
        '.fd-station { font-size: 10pt; font-weight: bold; text-transform: uppercase; background: #e0e0e0; padding: 6px 10px; margin: 16px 0 0; border: 1px solid #000; border-bottom: none; }',
        '.fd-row { display: flex; align-items: center; padding: 8px 10px; border: 1px solid #000; border-top: 1px solid #ccc; break-inside: avoid; page-break-inside: avoid; }',
        '.fd-row:last-child { border-bottom: 1px solid #000; }',
        '.fd-name { flex: 1; font-size: 10pt; font-weight: bold; }',
        '.fd-nums { font-size: 10pt; width: 80px; text-align: right; margin-right: 15px; }',

        '/* --- FRÜHSCHICHT FORMULAR --- */',
        '.fs-top { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt; }',
        '.fs-gruss { font-weight: bold; }',
        '.fs-datum-box { display: none; }',
        '.fs-item { display: flex; align-items: center; margin-bottom: 12px; font-size: 11pt; page-break-inside: avoid; break-inside: avoid; }',
        '.fs-name { width: 220px; font-weight: bold; }',

        'select, input[type="text"], textarea {',
        '    appearance: none; -webkit-appearance: none; -moz-appearance: none;',
        '    border: 1px solid #000 !important; background: #fff !important;',
        '    border-radius: 0 !important; padding: 6px 10px !important;',
        '    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important; font-size: 10pt !important;',
        '    color: #000 !important;',
        '}',
        'select { padding-right: 20px !important; }',

        '.fs-notiz-table { width: 100%; border-collapse: collapse; margin-top: 20px; break-inside: avoid; page-break-inside: avoid; }',
        '.fs-notiz-table td { border: 1px solid #000; height: 60px; }',
        '.fs-notiz-table td:first-child { padding: 10px; vertical-align: top; }',
        '.fs-notiz-table td:last-child { padding: 10px; vertical-align: middle; }',
        'input.fs-notiz-input { border: none !important; background: transparent !important; padding: 0 !important; height: 100%; width: 100%; box-shadow: none !important; outline: none; }',

        '.fs-anmerkungen { border: 1px solid #000; padding: 10px; height: 150px; margin-top: 20px; break-inside: avoid; page-break-inside: avoid; display: flex; flex-direction: column; }',
        '.fs-anmerkungen-label { font-weight: bold; text-transform: uppercase; font-size: 9pt; color: #555; }',
        '.fs-anmerkungen textarea { border: none !important; background: transparent !important; padding: 0 !important; flex: 1; margin-top: 8px; resize: none; box-shadow: none !important; outline: none; }',
        '.fs-add-btn { display: none !important; }',

        '/* --- FROSTERLISTE SPECIFIC --- */',
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
        '.fl-notes-box { border: 1.5px solid #000; border-radius: 4px; padding: 5px 8px; min-height: 20mm; font-size: 8pt; }',

        '/* --- BÄKO MODUL F --- */',
        '.bk-typ-header { font-size: 8pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #444; background: #efefef; padding: 4px 8px; margin: 16px 0 4px; border-top: 2px solid #000; }',
        '.bk-produkt-block { padding: 7px 4px; border-bottom: 1px solid #ddd; break-inside: avoid; page-break-inside: avoid; }',
        '.bk-prod-row { display: flex; justify-content: space-between; align-items: baseline; }',
        '.bk-prod-name { font-size: 11pt; font-weight: bold; }',
        '.bk-prod-bestand { font-size: 13pt; font-weight: 900; }',
        '.bk-prod-meta { font-size: 8pt; color: #666; margin-top: 1px; }',
        '.bk-prod-empf { font-size: 8.5pt; color: #444; margin-top: 3px; }',
        '.bk-prod-empf strong { font-weight: bold; color: #000; }',
        '.bk-prod-basis { font-size: 7.5pt; color: #888; }',
        '.bk-prod-empf-leer { font-size: 8pt; color: #aaa; font-style: italic; }'
    ].join('\n');

    var headerHTML = '<div class="report-header">' +
        '<div class="report-logo">Bäckerei<span>OS</span></div>' +
        '<div class="report-meta">Druckdatum: <strong>' + dateStr + '</strong><br>Uhrzeit: <strong>' + timeStr + '</strong></div>' +
        '</div>';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BäckereiOS Report</title><style>' + printCSS + '</style></head><body>';

    activeKeys.forEach(function(id) {
        var mod = document.getElementById('module-' + id);
        var body = mod.querySelector('.pm-body');
        var content = body.innerHTML;

        if (id === 'E') {
            html += '<div class="page-wrap">' + content + '</div>';
        } else if (id === 'D' && content.indexOf('matrix-page') !== -1) {
            content = content.replace(/(<div class="matrix-page[^>]*>)/g, '$1' + headerHTML);
            html += '<div class="page-wrap">' + content + '</div>';
        } else {
            html += '<div class="page-wrap">' + headerHTML + content + '</div>';
        }
    });
    html += '</body></html>';

    var iframeId = 'bos-print-frame';
    var iframe = document.getElementById(iframeId);
    if (iframe) { iframe.parentNode.removeChild(iframe); }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(function() {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 400);
}

// ── FRÜHSCHICHT SETUP ─────────────────────────────────────────────────

function setupFruehschicht() {
    var d   = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var str = pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
    var el  = document.getElementById('fs-datum-val');
    if (el) el.textContent = str;
    var cfg = document.getElementById('cfg-A-date');
    if (cfg) cfg.textContent = str;

    document.querySelectorAll('.num-dd').forEach(function(dd) {
        var empty = document.createElement('option');
        empty.value = ''; empty.textContent = ' ';
        dd.appendChild(empty);
        for (var i = 0; i <= 30; i++) {
            var o = document.createElement('option');
            o.value = i; o.textContent = i;
            dd.appendChild(o);
        }
    });

    for (var i = 0; i < 3; i++) addNotizRow();
}

function addNotizRow() {
    var tbody = document.getElementById('fs-notiz-body');
    var tr    = document.createElement('tr');
    tr.innerHTML =
        '<td style="width:45%"><input type="text" class="fs-notiz-input" placeholder=""></td>' +
        '<td>Noch in den ' +
        '<select class="fs-ort-sel">' +
        '<option>Koma 7</option>' +
        '<option>Schrippen-Koma</option>' +
        '<option>Froster</option>' +
        '</select> stellen</td>';
    tbody.appendChild(tr);
}

// ── INIT ──────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', function() {
    setupFruehschicht();

    DZ_init(function() {
        var info = DZ_getInvInfo();
        var dot  = document.getElementById('inv-dot');
        var txt  = document.getElementById('inv-text');
        var bar  = document.getElementById('inv-bar');

        if (info.ageH >= 9999) {
            dot.className = 'inv-dot warn';
            txt.textContent = 'Keine Inventurdaten gefunden';
            bar.classList.add('warn');
            _checkAndLockFroster(true);
        } else if (info.isOld) {
            dot.className = 'inv-dot warn';
            txt.textContent = 'Inventur: ' + info.dateStr + ' — ' + info.ageH + ' Std. alt';
            bar.classList.add('warn');
            _checkAndLockFroster(true);
        } else {
            txt.textContent = 'Inventur: ' + info.dateStr + ' — ' + info.ageH + ' Std. alt';
        }

        var selC1 = document.getElementById('zeit-C1');
        var selC2 = document.getElementById('zeit-C2');

        if (selC1) DZ_buildZeitspanneOptions(selC1, 3); // Default: Mittwoch
        if (selC2) DZ_buildZeitspanneOptions(selC2, 6); // Default: Samstag

        _rerenderAllActive();
    });
});

function _checkAndLockFroster(shouldLock) {
    if (!shouldLock) return;
    try {
        var c = JSON.parse(localStorage.getItem('BOS_URLAUBSSCHLUESSEL_CACHE') || 'null');
        if (c && c.exportedAt && (Date.now() - c.exportedAt) <= 24 * 3600000 &&
            c.products && Object.keys(c.products).length > 0) {
            var dot = document.getElementById('inv-dot');
            var txt = document.getElementById('inv-text');
            var d = new Date(c.exportedAt);
            var pad = function(n) { return n < 10 ? '0' + n : n; };
            txt.textContent = 'Schlüssel-Cache aktiv: ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '. ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
            dot.className = 'inv-dot'; // grün
            return;
        }
    } catch(e) {}
    _lockFroster();
}

function _lockFroster() {
    _locked.B = true;
    var card = document.getElementById('ctrl-B');
    card.classList.add('locked');
    document.getElementById('badge-B').style.display = '';
}
