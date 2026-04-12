// druckzentrale_ui.js
// UI-Kern der Druckzentrale — Tab-Navigation, Modul-Toggle, Druck-Engine, Init
// Print-CSS kommt aus den einzelnen druckzentrale_modul_*.js Dateien.

var _active = { A: false, B: false, C: false, D: false, E: false, F: false };
var _locked = { B: false };

// ── TAB-NAVIGATION ────────────────────────────────────────────────────
function DZ_switchTab(tabId) {
    document.querySelectorAll('.dz-tab-content').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.dz-tab').forEach(function(btn) {
        btn.classList.remove('active');
    });
    var content = document.getElementById(tabId);
    if (content) content.classList.add('active');
    var btnId = 'dz-tab-btn-' + tabId.replace('tab-', '');
    var btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
}

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
    if (id === 'B' && typeof DZ_renderFroster       === 'function') DZ_renderFroster();
    if (id === 'D' && typeof DZ_renderVerbrauchsMatrix === 'function') DZ_renderVerbrauchsMatrix();
    if (id === 'F' && typeof DZ_renderBaeko          === 'function') DZ_renderBaeko();
    if (id === 'C') {
        var z1 = DZ_parseDate(document.getElementById('zeit-C1'));
        var z2 = DZ_parseDate(document.getElementById('zeit-C2'));
        if (z1 && z2 && typeof DZ_renderWochenziele === 'function') DZ_renderWochenziele(z1, z2);
    }
}

function _rerenderAllActive() {
    ['A','B','C','D','E','F'].forEach(function(id) {
        if (_active[id]) _rerender(id);
    });
}

// ── PRINT-CSS EINSAMMELN ──────────────────────────────────────────────
function _collectPrintCSS() {
    var base = [
        '@page { size: A4 portrait; margin: 15mm; }',
        '* { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
        'body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 0; background: #fff; }',
        '.no-print { display: none !important; }',
        '.report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 20px; }',
        '.report-logo { font-family: Georgia, serif; font-size: 22pt; font-weight: 900; margin: 0; line-height: 1; }',
        '.report-logo span { font-style: italic; color: #777; font-weight: normal; }',
        '.report-meta { text-align: right; font-size: 8.5pt; color: #555; line-height: 1.4; }',
        '.report-meta strong { color: #000; font-weight: bold; }',
        '.page-wrap { page-break-after: always; position: relative; }',
        '.page-wrap:last-child { page-break-after: auto; }',
        '.pb-after { page-break-after: always; }',
        'tbody, .koerner-wrap, .fd-station-block { break-inside: avoid; page-break-inside: avoid; }',
        'select, input[type="text"], textarea { appearance: none; -webkit-appearance: none; -moz-appearance: none; border: 1px solid #000 !important; background: #fff !important; border-radius: 0 !important; padding: 6px 10px !important; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important; font-size: 10pt !important; color: #000 !important; }',
        'select { padding-right: 20px !important; }'
    ].join('\n');

    var moduleCss = [
        typeof DZ_PRINT_CSS_A !== 'undefined' ? DZ_PRINT_CSS_A : '',
        typeof DZ_PRINT_CSS_B !== 'undefined' ? DZ_PRINT_CSS_B : '',
        typeof DZ_PRINT_CSS_C !== 'undefined' ? DZ_PRINT_CSS_C : '',
        typeof DZ_PRINT_CSS_D !== 'undefined' ? DZ_PRINT_CSS_D : '',
        typeof DZ_PRINT_CSS_E !== 'undefined' ? DZ_PRINT_CSS_E : '',
        typeof DZ_PRINT_CSS_F !== 'undefined' ? DZ_PRINT_CSS_F : '',
        typeof DZ_PRINT_CSS_G !== 'undefined' ? DZ_PRINT_CSS_G : ''
    ].join('\n');

    return base + '\n' + moduleCss;
}

// ── DRUCK-ENGINE ──────────────────────────────────────────────────────
function doPrint() {
    var activeKeys = Object.keys(_active).filter(function(k) { return _active[k]; });
    if (activeKeys.length === 0) { alert('Bitte mindestens ein Dokument auswählen.'); return; }

    activeKeys.forEach(function(id) {
        var mod  = document.getElementById('module-' + id);
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

    var headerHTML = '<div class="report-header">' +
        '<div class="report-logo">Bäckerei<span>OS</span></div>' +
        '<div class="report-meta">Druckdatum: <strong>' + dateStr + '</strong><br>Uhrzeit: <strong>' + timeStr + '</strong></div>' +
        '</div>';

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BäckereiOS Report</title>' +
               '<style>' + _collectPrintCSS() + '</style></head><body>';

    activeKeys.forEach(function(id) {
        var mod     = document.getElementById('module-' + id);
        var body    = mod.querySelector('.pm-body');
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
    iframe.style.cssText = 'position:absolute;width:0px;height:0px;border:none;';
    document.body.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open(); doc.write(html); doc.close();

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
    if (!tbody) return;
    var tr = document.createElement('tr');
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

    // Templates aller Module rendern
    if (typeof DZ_A_render === 'function') DZ_A_render();
    if (typeof DZ_C_render === 'function') DZ_C_render();
    if (typeof DZ_E_render === 'function') DZ_E_render();
    if (typeof DZ_G_render === 'function') DZ_G_render();

    // Frühschicht-Dropdowns + Notizzeilen (braucht gerenderte DOM-Elemente aus Modul A)
    setupFruehschicht();

    // Frosterliste-Tabelle befüllen (braucht gerenderte DOM-Elemente aus Modul E)
    if (typeof DZ_E_init === 'function') DZ_E_init();

    // Extra-Zeilen aus localStorage (braucht fs-extra-items aus Modul A)
    if (typeof DZ_A_initExtra === 'function') DZ_A_initExtra();

    // Produktions-Gehirn + Inventur initialisieren
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
        if (selC1) DZ_buildZeitspanneOptions(selC1, 3);
        if (selC2) DZ_buildZeitspanneOptions(selC2, 6);

        _rerenderAllActive();
    });
});

// ── FROSTER LOCK ──────────────────────────────────────────────────────
function _checkAndLockFroster(shouldLock) {
    if (!shouldLock) return;

    // Urlaubsschlüssel-Cache prüfen
    try {
        var c = JSON.parse(localStorage.getItem('BOS_URLAUBSSCHLUESSEL_CACHE') || 'null');
        if (c && c.exportedAt && (Date.now() - c.exportedAt) <= 24 * 3600000 &&
            c.products && Object.keys(c.products).length > 0) {
            var dot = document.getElementById('inv-dot');
            var txt = document.getElementById('inv-text');
            var d   = new Date(c.exportedAt);
            var pad = function(n) { return n < 10 ? '0' + n : n; };
            txt.textContent = 'Schlüssel-Cache aktiv: ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '. ' +
                              pad(d.getHours()) + ':' + pad(d.getMinutes());
            dot.className = 'inv-dot';
            return;
        }
    } catch(e) {}

    // FIX: BOS_INVENTUR direkt nochmal prüfen (Fallback für defer-Timing-Problem)
    if (window.BOS_INVENTUR && window.BOS_INVENTUR.products) {
        var maxTs = 0;
        for (var k in window.BOS_INVENTUR.products) {
            var ts = window.BOS_INVENTUR.products[k].ts || 0;
            if (ts > maxTs) maxTs = ts;
        }
        if (maxTs > 0 && (Date.now() - maxTs) <= 24 * 3600000) {
            DZ_latestInvTs = maxTs;
            var d2   = new Date(maxTs);
            var pad2 = function(n) { return n < 10 ? '0' + n : n; };
            var ageH2 = Math.floor((Date.now() - maxTs) / 3600000);
            document.getElementById('inv-dot').className = 'inv-dot';
            document.getElementById('inv-text').textContent =
                'Inventur: ' + pad2(d2.getDate()) + '.' + pad2(d2.getMonth() + 1) + '. ' +
                pad2(d2.getHours()) + ':' + pad2(d2.getMinutes()) + ' — ' + ageH2 + ' Std. alt';
            document.getElementById('inv-bar').classList.remove('warn');
            return;
        }
    }

    _lockFroster();
}

function _lockFroster() {
    _locked.B = true;
    var card = document.getElementById('ctrl-B');
    card.classList.add('locked');
    document.getElementById('badge-B').style.display = '';
}
