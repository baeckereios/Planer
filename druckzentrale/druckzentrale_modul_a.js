// druckzentrale_modul_a.js
// Modul A — Frühschicht-Formular
// Zuständig für: HTML-Template, Extra-Zeilen, localStorage BOS_FS_EXTRA_v2
// Print-CSS: DZ_PRINT_CSS_A (wird von druckzentrale_ui.js eingesammelt)

// ── PRINT-CSS ────────────────────────────────────────────────────────
var DZ_PRINT_CSS_A = [
    '/* --- FRÜHSCHICHT FORMULAR --- */',
    '.fs-top { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt; }',
    '.fs-gruss { font-weight: bold; }',
    '.fs-datum-box { display: none; }',
    '.fs-item { display: flex; align-items: center; margin-bottom: 12px; font-size: 11pt; page-break-inside: avoid; break-inside: avoid; }',
    '.fs-name { width: 220px; font-weight: bold; }',
    '.fs-notiz-table { width: 100%; border-collapse: collapse; margin-top: 20px; break-inside: avoid; page-break-inside: avoid; }',
    '.fs-notiz-table td { border: 1px solid #000; height: 60px; }',
    '.fs-notiz-table td:first-child { padding: 10px; vertical-align: top; }',
    '.fs-notiz-table td:last-child { padding: 10px; vertical-align: middle; }',
    'input.fs-notiz-input { border: none !important; background: transparent !important; padding: 0 !important; height: 100%; width: 100%; box-shadow: none !important; outline: none; }',
    '.fs-anmerkungen { border: 1px solid #000; padding: 10px; height: 150px; margin-top: 20px; break-inside: avoid; page-break-inside: avoid; display: flex; flex-direction: column; }',
    '.fs-anmerkungen-label { font-weight: bold; text-transform: uppercase; font-size: 9pt; color: #555; }',
    '.fs-anmerkungen textarea { border: none !important; background: transparent !important; padding: 0 !important; flex: 1; margin-top: 8px; resize: none; box-shadow: none !important; outline: none; }',
    '.fs-add-btn { display: none !important; }',
    '/* Zebra — screen + print */',
    '.fs-item.fs-zebra, .fs-extra-item.fs-zebra { background-color: #e8e8e8 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }',
    '.fs-suffix { margin-left: 12px !important; white-space: nowrap; }',
    '.fs-dbl-sep { margin: 0 6px; font-weight: bold; }',
    '.fs-extra-item { display: flex; align-items: center; padding: 4px 6px; min-height: 32px; }',
    '.fs-extra-name { flex: 1; border: none; border-bottom: 1.5px solid #888; font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; background: transparent; padding: 2px 4px; min-width: 80px; }',
    '.fs-extra-name { border-bottom: 1px solid #666; }',
    'input::placeholder { color: transparent !important; }',
    'select { -webkit-appearance: none; appearance: none; border: 1px solid #999; }'
].join('\n');

// ── HTML-TEMPLATE ────────────────────────────────────────────────────
function DZ_A_render() {
    var body = document.getElementById('module-A-body');
    if (!body) return;

    body.innerHTML = [
        '<div class="fs-page">',
        '  <div class="fs-top">',
        '    <div class="fs-gruss">Guten Morgen liebe Frühschicht,<br><br>Bitte noch:</div>',
        '    <div class="fs-datum-box">',
        '      <div class="datum-label">Datum:</div>',
        '      <div class="fs-datum-val" id="fs-datum-val">—</div>',
        '    </div>',
        '  </div>',

        '  <div id="fs-items">',
        '    <div class="fs-item fs-zebra" style="background-color:#e8e8e8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">',
        '      <span class="fs-name">Mohn + Sesam</span>',
        '      <div class="fs-dbl">',
        '        <select class="fs-sel num-dd"></select>',
        '        <span class="fs-dbl-sep" style="margin:0 6px;font-weight:bold;">/</span>',
        '        <select class="fs-sel num-dd"></select>',
        '      </div>',
        '    </div>',
        '    <div class="fs-item">',
        '      <span class="fs-name">Schokocroissants</span>',
        '      <select class="fs-sel num-dd"></select>',
        '      <span class="fs-suffix" style="margin-left:12px;">Bleche absetzen</span>',
        '    </div>',
        '    <div class="fs-item fs-zebra" style="background-color:#e8e8e8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">',
        '      <span class="fs-name">Laugenecken</span>',
        '      <select class="fs-sel num-dd"></select>',
        '      <span class="fs-suffix" style="margin-left:12px;">Bleche absetzen</span>',
        '    </div>',
        '    <div class="fs-item">',
        '      <span class="fs-name">Buttercroissants</span>',
        '      <select class="fs-sel num-dd"></select>',
        '      <span class="fs-suffix" style="margin-left:12px;">Bleche absetzen</span>',
        '    </div>',
        '    <div class="fs-item fs-zebra" style="background-color:#e8e8e8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">',
        '      <span class="fs-name">Minibuttercroissants</span>',
        '      <select class="fs-sel num-dd"></select>',
        '      <span class="fs-suffix" style="margin-left:12px;">Bleche absetzen</span>',
        '    </div>',
        '    <div class="fs-item">',
        '      <span class="fs-name">Minischokocroissants</span>',
        '      <select class="fs-sel num-dd"></select>',
        '      <span class="fs-suffix" style="margin-left:12px;">Bleche absetzen</span>',
        '    </div>',
        '    <div id="fs-extra-items"></div>',
        '    <div class="no-print" style="margin:2px 0 4px;">',
        '      <button class="fs-add-btn" onclick="fs_addExtraRow()">+ Zeile hinzufügen</button>',
        '    </div>',
        '    <div class="fs-item fs-zebra" style="background-color:#e8e8e8;-webkit-print-color-adjust:exact;print-color-adjust:exact;">',
        '      <span class="fs-name">Käsebrötchen belegen</span>',
        '      <select class="fs-sel num-dd"></select>',
        '      <span class="fs-suffix" style="margin-left:12px;">Bleche.</span>',
        '    </div>',
        '  </div>',

        '  <table class="fs-notiz-table"><tbody id="fs-notiz-body"></tbody></table>',

        '  <div class="fs-anmerkungen">',
        '    <div class="fs-anmerkungen-label">Anmerkungen</div>',
        '    <textarea style="width:100%;height:100%;border:none;resize:none;font-family:Arial;font-size:10pt;" class="fs-notiz-input" placeholder=""></textarea>',
        '  </div>',
        '</div>'
    ].join('\n');
}

// ── EXTRA-ZEILEN (localStorage) ──────────────────────────────────────
(function() {
    var LS_KEY     = 'BOS_FS_EXTRA_v2';
    var FIXED_ROWS = 6;

    function loadExtra() {
        try {
            var d = JSON.parse(localStorage.getItem(LS_KEY));
            return Array.isArray(d) ? d.filter(function(x) { return x && (x.name || x.val > 0); }) : [];
        } catch(e) { return []; }
    }

    function saveExtra() {
        var items = document.querySelectorAll('.fs-extra-item');
        var data = [];
        items.forEach(function(el) {
            var name = el.querySelector('.fs-extra-name');
            var sel  = el.querySelector('.fs-sel');
            data.push({ name: name ? name.value : '', val: sel ? sel.value : '0' });
        });
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}
    }

    function zebraForIndex(i) {
        return (FIXED_ROWS + i) % 2 !== 0;
    }

    function makeExtraRow(name, val, isZebra) {
        var div = document.createElement('div');
        div.className = 'fs-extra-item' + (isZebra ? ' fs-zebra' : '');
        div.style.cssText = isZebra
            ? 'background-color:#e8e8e8;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;align-items:center;padding:4px 6px;min-height:32px;'
            : 'display:flex;align-items:center;padding:4px 6px;min-height:32px;';

        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'fs-extra-name';
        inp.value = name || '';
        inp.setAttribute('placeholder', 'Produkt…');
        inp.style.cssText = 'flex:1;border:none;border-bottom:1.5px solid #888;font-family:Arial,sans-serif;font-size:10pt;font-weight:bold;background:transparent;padding:2px 4px;min-width:80px;';
        inp.oninput = saveExtra;

        var sel = document.createElement('select');
        sel.className = 'fs-sel num-dd';
        sel.style.marginLeft = '8px';
        for (var i = 0; i <= 20; i++) {
            var o = document.createElement('option');
            o.value = i; o.textContent = i;
            if (String(i) === String(val || '0')) o.selected = true;
            sel.appendChild(o);
        }
        sel.onchange = saveExtra;

        var suf = document.createElement('span');
        suf.className = 'fs-suffix';
        suf.style.marginLeft = '12px';
        suf.textContent = 'Bleche absetzen';

        div.appendChild(inp);
        div.appendChild(sel);
        div.appendChild(suf);
        return div;
    }

    window.fs_addExtraRow = function() {
        var container = document.getElementById('fs-extra-items');
        if (!container) return;
        var n = container.children.length;
        container.appendChild(makeExtraRow('', '0', zebraForIndex(n)));
        saveExtra();
    };

    // Wird nach DZ_A_render() aufgerufen
    window.DZ_A_initExtra = function() {
        var container = document.getElementById('fs-extra-items');
        if (!container) return;
        loadExtra().forEach(function(item, i) {
            container.appendChild(makeExtraRow(item.name, item.val, zebraForIndex(i)));
        });
    };
})();
