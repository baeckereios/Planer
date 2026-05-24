// druckzentrale_modul_j.js — BäckereiOS
// Modul J — Guten-Morgen-Export
//
// Zuständig für:
//   1. Tagesnotiz (textarea → localStorage 'bos_morgen_notiz')
//   2. Auto-Snapshot beim Druck: A → 'BOS_SNAP_A_<datum>', I → 'BOS_SNAP_I_<datum>'
//      (Snapshots werden von druckzentrale_ui.js::doPrint() aufgerufen)
//   3. Notiz drucken (schlicht, eine Seite)
//   4. Export: guten_morgen_data.js → Download → Root → nfc_einstieg.html liest window.BOS_MORGEN_DATA
//
// Platzierung: Root-Verzeichnis (baeckereios.github.io/)
// Laden in druckzentrale.html: <script src="../druckzentrale_modul_j.js"></script>

(function () {
'use strict';

// ── STORAGE KEYS ─────────────────────────────────────────────────────
var SK_NOTIZ = 'bos_morgen_notiz';

function _todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + _p(d.getMonth() + 1) + '-' + _p(d.getDate());
}
function _snapKeyA() { return 'BOS_SNAP_A_' + _todayISO(); }
function _snapKeyI() { return 'BOS_SNAP_I_' + _todayISO(); }
function _p(n) { return n < 10 ? '0' + n : '' + n; }
function _nowLabel() {
    var d = new Date();
    return _p(d.getDate()) + '.' + _p(d.getMonth() + 1) + '.' + d.getFullYear() +
           ' · ' + _p(d.getHours()) + ':' + _p(d.getMinutes()) + ' Uhr';
}
function _nowISO() {
    var d = new Date();
    return d.getFullYear() + '-' + _p(d.getMonth()+1) + '-' + _p(d.getDate()) +
           'T' + _p(d.getHours()) + ':' + _p(d.getMinutes()) + ':00';
}
function _tsLabel(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return _p(d.getDate()) + '.' + _p(d.getMonth() + 1) + '. ' +
           _p(d.getHours()) + ':' + _p(d.getMinutes()) + ' Uhr';
}
function escH(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── SNAPSHOT MODUL A (Frühschicht-Formular) ──────────────────────────
window.DZ_J_snapshotA = function () {
    var body = document.getElementById('module-A-body');
    if (!body) return;

    var data = { datum: _todayISO(), timestamp: Date.now() };

    // Mohn + Sesam
    var mohn  = document.getElementById('fs-mohn-dd');
    var sesam = document.getElementById('fs-sesam-dd');
    if (mohn)  data.mohn  = mohn.value;
    if (sesam) data.sesam = sesam.value;

    // Feste Artikel — num-dd Selects in .fs-item (DOM-Reihenfolge)
    var LABELS = [
        'Schokocroissants', 'Laugenecken', 'Buttercroissants',
        'Minibuttercroissants', 'Minischokocroissants', 'Käsebrötchen_belegen'
    ];
    body.querySelectorAll('.fs-item select.num-dd').forEach(function (sel, i) {
        data[LABELS[i] || ('item_' + i)] = sel.value;
    });

    // Extra-Zeilen
    var extra = [];
    body.querySelectorAll('.fs-extra-item').forEach(function (el) {
        var name = el.querySelector('.fs-extra-name');
        var sel  = el.querySelector('select');
        extra.push({ name: name ? name.value : '', val: sel ? sel.value : '' });
    });
    data.extra = extra;

    // Notiz-Zeilen (Koma / Froster etc.)
    var notizZeilen = [];
    body.querySelectorAll('#fs-notiz-body tr').forEach(function (tr) {
        var ta  = tr.querySelector('textarea');
        var ort = tr.querySelector('select');
        notizZeilen.push({ text: ta ? ta.value : '', ort: ort ? ort.value : '' });
    });
    data.notizZeilen = notizZeilen;

    // Anmerkungen
    var anm = body.querySelector('.fs-anmerkungen textarea');
    if (anm) data.anmerkungen = anm.value;

    try { localStorage.setItem(_snapKeyA(), JSON.stringify(data)); } catch (e) {}
    _updateSnapStatus();
};

// ── SNAPSHOT MODUL I (Absetz-Formular) ───────────────────────────────
window.DZ_J_snapshotI = function () {
    var body = document.getElementById('module-I-body');
    if (!body) return;

    var data = { datum: _todayISO(), timestamp: Date.now() };

    // Feste Produkte
    var PRODUCTS = [
        'Buttercroissant', 'Schokocroissant', 'Laugenecken',
        'Mini_Buttercroissant', 'Mini_Schokocroissant'
    ];
    PRODUCTS.forEach(function (name, i) {
        var so = document.getElementById('af-so-' + i);
        var mo = document.getElementById('af-mo-' + i);
        data[name] = { so: so ? so.value : '', mo: mo ? mo.value : '' };
    });

    // Käsebrötchen
    var kSo = document.getElementById('af-kase-so');
    var kMo = document.getElementById('af-kase-mo');
    data['Käsebrötchen'] = {
        so: kSo ? kSo.value : '',
        mo: kMo ? kMo.value : ''
    };

    // Mohn + Sesam
    var mohn  = document.getElementById('af-mohn');
    var sesam = document.getElementById('af-sesam');
    data.mohn  = mohn  ? mohn.value  : '';
    data.sesam = sesam ? sesam.value : '';

    // Extra-Zeilen
    var extra = [];
    body.querySelectorAll('tr.af-extra-row').forEach(function (tr) {
        var inp  = tr.querySelector('input.af-prod-input');
        var sels = tr.querySelectorAll('select.af-sel');
        extra.push({
            name: inp    ? inp.value    : '',
            so:   sels[0] ? sels[0].value : '',
            mo:   sels[1] ? sels[1].value : ''
        });
    });
    data.extra = extra;

    // Grußzeile + Anmerkungen
    var gruss = body.querySelector('.af-gruss-input');
    var anm   = body.querySelector('.af-anm-text');
    if (gruss) data.gruss       = gruss.value;
    if (anm)   data.anmerkungen = anm.value;

    try { localStorage.setItem(_snapKeyI(), JSON.stringify(data)); } catch (e) {}
    _updateSnapStatus();
};

// ── DIGITALE VERSION SPEICHERN (manuell, ohne Druck) ─────────────────
window.DZ_J_saveDigital = function () {
    var savedAny = false;
    if (typeof DZ_J_snapshotA === 'function') {
        var bodyA = document.getElementById('module-A-body');
        if (bodyA && bodyA.innerHTML.trim()) { DZ_J_snapshotA(); savedAny = true; }
    }
    if (typeof DZ_J_snapshotI === 'function') {
        var bodyI = document.getElementById('module-I-body');
        if (bodyI && bodyI.innerHTML.trim()) { DZ_J_snapshotI(); savedAny = true; }
    }
    var hint = document.getElementById('dz-j-hint');
    if (hint) {
        hint.style.display = 'block';
        setTimeout(function () { hint.style.display = 'none'; }, 8000);
    }
    if (!savedAny) {
        alert('Keine Formulare aktiv. Bitte Modul A oder I im Tab "Dokumente" aktivieren.');
    }
};

// ── NOTIZ SPEICHERN ───────────────────────────────────────────────────
function _saveNotiz() {
    var ta = document.getElementById('bos-j-notiz');
    if (!ta) return;
    try {
        localStorage.setItem(SK_NOTIZ, JSON.stringify({ text: ta.value, timestamp: Date.now() }));
    } catch (e) {}
    var el = document.getElementById('bos-j-notiz-saved');
    if (el) { el.textContent = 'Gespeichert · ' + _nowLabel(); el.style.opacity = '1'; }
}
window.DZ_J_saveNotiz = _saveNotiz; // für inline-Handler als Fallback

// ── NOTIZ DRUCKEN ─────────────────────────────────────────────────────
window.DZ_J_printNotiz = function () {
    var ta   = document.getElementById('bos-j-notiz');
    var text = ta ? ta.value.trim() : '';
    if (!text) { alert('Bitte zuerst eine Notiz eingeben.'); return; }

    var d       = new Date();
    var dateStr = _p(d.getDate()) + '.' + _p(d.getMonth() + 1) + '.' + d.getFullYear();
    var timeStr = _p(d.getHours()) + ':' + _p(d.getMinutes()) + ' Uhr';

    var lines = text.split('\n').map(function (l) {
        return l.trim()
            ? '<p style="margin:0 0 10px;font-size:13pt;line-height:1.6;">' + escH(l) + '</p>'
            : '<p style="margin:0 0 4px;">&nbsp;</p>';
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
        '<style>' +
        '@page { size: A4 portrait; margin: 20mm 18mm; }' +
        '* { box-sizing: border-box; }' +
        'body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 11pt; color: #000; }' +
        '.header { display: flex; justify-content: space-between; align-items: flex-end;' +
        '  border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 28px; }' +
        '.logo { font-family: Georgia, serif; font-size: 20pt; font-weight: 900; }' +
        '.logo span { font-style: italic; color: #777; font-weight: normal; }' +
        '.meta { text-align: right; font-size: 8.5pt; color: #555; line-height: 1.5; }' +
        '.tag { font-size: 8pt; letter-spacing: .12em; text-transform: uppercase; color: #999; margin-bottom: 12px; }' +
        '.notiz-box { border-left: 4px solid #000; padding: 14px 18px; }' +
        '</style></head><body>' +
        '<div class="header">' +
            '<div class="logo">Bäckerei<span>OS</span></div>' +
            '<div class="meta">Datum: <strong>' + dateStr + '</strong><br>Uhrzeit: <strong>' + timeStr + '</strong></div>' +
        '</div>' +
        '<div class="tag">Denkt bitte dran</div>' +
        '<div class="notiz-box">' + lines + '</div>' +
        '<script>window.onload=function(){window.print();window.close();}<\/script>' +
        '</body></html>';

    var w = window.open('', '_blank', 'width=800,height=700');
    if (!w) { alert('Popup-Blocker aktiv — bitte deaktivieren.'); return; }
    w.document.write(html);
    w.document.close();
};

// ── JS-EXPORT ─────────────────────────────────────────────────────────
window.DZ_J_exportJS = async function () {
    var notiz = null;
    var snapA = null;
    var snapI = null;
    try { var rN = localStorage.getItem(SK_NOTIZ);   notiz = rN ? JSON.parse(rN) : null; } catch (e) {}
    try { var rA = localStorage.getItem(_snapKeyA()); snapA = rA ? JSON.parse(rA) : null; } catch (e) {}
    try { var rI = localStorage.getItem(_snapKeyI()); snapI = rI ? JSON.parse(rI) : null; } catch (e) {}

    // ── Kollegen aus schichtplaner_config.json ────────────────────────
    var kollegen = [];
    try {
        var pfade = ['../schichtplaner_config.json', 'schichtplaner_config.json'];
        var spData = null;
        for (var pi = 0; pi < pfade.length; pi++) {
            try {
                var spResp = await fetch(pfade[pi], { cache: 'no-store' });
                if (spResp.ok) { spData = await spResp.json(); break; }
            } catch(e) {}
        }
        if (spData) {
            var positionen = spData.positionen || [];
            kollegen = (spData.personen || [])
                .filter(function(p) { return !p.azubi; })
                .map(function(p) {
                    var pos = positionen.find(function(pp) { return pp.id === p.stammkraft_von; });
                    return {
                        name: p.name,
                        position: pos ? pos.label : null,
                        planungsverantwortlich: p.planungsverantwortlich || false
                    };
                });
        }
    } catch(e) {}

    // ── Schnellzugriffe ────────────────────────────────────────────────
    // Priorität: localStorage (bewusste Änderung via NFC-Zentrale)
    //            → bestehende guten_morgen_data.js (Links retten)
    //            → leer []
    var schnellzugriffe = [];
    try {
        var lsSchnell = localStorage.getItem('BOS_MORGEN_SCHNELLZUGRIFFE');
        if (lsSchnell) {
            schnellzugriffe = JSON.parse(lsSchnell) || [];
            localStorage.removeItem('BOS_MORGEN_SCHNELLZUGRIFFE');
        } else {
            var resp = await fetch('guten_morgen_data.js?v=' + Date.now(), { cache: 'no-store' });
            if (resp.ok) {
                var txt = await resp.text();
                var match = txt.match(/window\.BOS_MORGEN_DATA\s*=\s*(\{[\s\S]*?\});?\s*$/m);
                if (match) { schnellzugriffe = (JSON.parse(match[1]).schnellzugriffe) || []; }
            }
        }
    } catch (e) {}

    var missing = [];
    if (!notiz || !notiz.text || !notiz.text.trim()) missing.push('Tagesnotiz (leer oder nicht gespeichert)');
    if (!snapA) missing.push('Frühschicht-Formular (A) — bitte "Digitale Version" klicken');
    if (!snapI) missing.push('Absetz-Formular (I) — bitte "Digitale Version" klicken');

    if (missing.length > 0) {
        var ok = confirm(
            'Folgende Daten fehlen noch:\n\n  • ' + missing.join('\n  • ') +
            '\n\nTrotzdem exportieren?'
        );
        if (!ok) return;
    }

    var payload = {
        exportiert:      _nowISO(),
        datum:           _todayISO(),
        notiz:           notiz  || { text: '', timestamp: Date.now() },
        formular_a:      snapA  || null,
        formular_i:      snapI  || null,
        schnellzugriffe: schnellzugriffe
    };

    var js = [
        '// guten_morgen_data.js — BäckereiOS',
        '// Automatisch generiert · ' + _nowLabel(),
        '// Dieses File im Root-Verzeichnis ablegen.',
        '// Wird von nfc_einstieg.html als window.BOS_MORGEN_DATA gelesen.',
        '',
        'window.BOS_MORGEN_DATA = ' + JSON.stringify(payload, null, 2) + ';'
    ].join('\n');

    var blob = new Blob([js], { type: 'application/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'guten_morgen_data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
};

// ── SNAP-STATUS ANZEIGEN ─────────────────────────────────────────────
function _updateSnapStatus() {
    _setSnapEl('A', localStorage.getItem(_snapKeyA()));
    _setSnapEl('I', localStorage.getItem(_snapKeyI()));
}
function _setSnapEl(id, raw) {
    var el = document.getElementById('bos-j-snap-' + id);
    if (!el) return;
    if (raw) {
        try {
            var d = JSON.parse(raw);
            el.innerHTML = '<span style="color:#2e6b42;font-weight:700;">✓ Gespeichert</span>' +
                           ' <span style="color:#7a6e64;">· ' + _tsLabel(d.timestamp) + '</span>';
        } catch (e) { el.textContent = '✓ Vorhanden'; }
    } else {
        el.innerHTML = '<span style="color:#7a6e64;font-style:italic;">Noch nicht gespeichert — ' +
                       'wird beim nächsten Druck automatisch erfasst</span>';
    }
}

// ── TAB RENDERN ───────────────────────────────────────────────────────
function _render() {
    var container = document.getElementById('tab-guten-morgen');
    if (!container) return;

    container.innerHTML =
        '<div class="container" style="padding-bottom:80px;">' +

        // ── Tagesnotiz ──────────────────────────────────────────────
        '<div style="margin-bottom:28px;">' +
            '<div style="font-family:Fraunces,Georgia,serif;font-size:17px;' +
                 'color:var(--amber,#b8790a);margin-bottom:10px;font-weight:700;">' +
                 'Tagesnotiz</div>' +
            '<div style="font-size:13px;color:var(--text-dim,#7a6e64);margin-bottom:10px;">' +
                 'Erscheint oben auf der Guten-Morgen-Seite (NFC-Einstieg).</div>' +
            '<textarea id="bos-j-notiz"' +
                ' style="width:100%;min-height:120px;padding:12px 14px;' +
                'background:var(--bg,#e8e4de);border:1.5px solid var(--border,#c8c2b8);' +
                'border-radius:8px;font-family:Barlow Condensed,sans-serif;font-size:15px;' +
                'color:var(--text,#1e1a16);resize:vertical;line-height:1.5;' +
                'outline:none;transition:border-color .15s;display:block;"' +
                ' placeholder="z. B. Heute Lieferung BÄKO gegen 07:30 — Eingang freihalten.">' +
            '</textarea>' +
            '<div id="bos-j-notiz-saved"' +
                ' style="font-size:11px;color:var(--text-dim,#7a6e64);margin-top:5px;' +
                'min-height:16px;opacity:0;transition:opacity .3s;">' +
            '</div>' +
            '<button onclick="DZ_J_printNotiz()"' +
                ' style="margin-top:12px;background:var(--amber,#b8790a);color:#fff;border:none;' +
                'padding:10px 22px;border-radius:8px;font-family:Barlow Condensed,sans-serif;' +
                'font-size:15px;font-weight:700;letter-spacing:.04em;cursor:pointer;">' +
                '🖨 Notiz drucken' +
            '</button>' +
        '</div>' +

        // ── Formular-Snapshots Status ────────────────────────────────
        '<div style="margin-bottom:28px;">' +
            '<div style="font-family:Fraunces,Georgia,serif;font-size:17px;' +
                 'color:var(--amber,#b8790a);margin-bottom:10px;font-weight:700;">' +
                 'Formular-Snapshots</div>' +
            '<div style="font-size:13px;color:var(--text-dim,#7a6e64);margin-bottom:12px;">' +
                 'Werden automatisch gespeichert, sobald du Modul A oder I druckst.</div>' +
            '<div style="background:var(--bg,#e8e4de);border:1px solid var(--border,#c8c2b8);' +
                 'border-radius:8px;overflow:hidden;">' +
                '<div style="display:flex;align-items:baseline;gap:10px;padding:12px 14px;' +
                     'border-bottom:1px solid var(--border,#c8c2b8);">' +
                    '<span style="font-size:13px;font-weight:700;min-width:190px;">' +
                        'Frühschicht-Formular (A)</span>' +
                    '<span id="bos-j-snap-A" style="font-size:12px;"></span>' +
                '</div>' +
                '<div style="display:flex;align-items:baseline;gap:10px;padding:12px 14px;">' +
                    '<span style="font-size:13px;font-weight:700;min-width:190px;">' +
                        'Absetz-Formular (I)</span>' +
                    '<span id="bos-j-snap-I" style="font-size:12px;"></span>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // ── Export ───────────────────────────────────────────────────
        '<div>' +
            '<div style="font-family:Fraunces,Georgia,serif;font-size:17px;' +
                 'color:var(--amber,#b8790a);margin-bottom:10px;font-weight:700;">Export</div>' +
            '<div style="font-size:13px;color:var(--text-dim,#7a6e64);margin-bottom:4px;line-height:1.65;">' +
                'Erstellt <strong>guten_morgen_data.js</strong> mit Notiz + beiden Formular-Snapshots.<br>' +
                'Datei in das Root-Verzeichnis des Repos laden —<br>' +
                'nfc_einstieg.html liest sie beim nächsten Scan automatisch.' +
            '</div>' +
            '<div id="bos-j-schnell-pending" style="display:none;margin-bottom:12px;' +
                'padding:10px 14px;background:#fff8e8;border:1.5px solid #e8c97a;' +
                'border-radius:8px;font-size:13px;color:#7a5200;line-height:1.5;">' +
            '</div>' +
            '<button onclick="DZ_J_exportJS()"' +
                ' style="margin-top:14px;background:var(--amber,#b8790a);color:#fff;border:none;' +
                'padding:13px 0;border-radius:8px;font-family:Barlow Condensed,sans-serif;' +
                'font-size:16px;font-weight:700;letter-spacing:.04em;cursor:pointer;width:100%;">' +
                '⬇ guten_morgen_data.js herunterladen' +
            '</button>' +
        '</div>' +

        '</div>'; // /container

    // Gespeicherte Notiz laden
    try {
        var raw = localStorage.getItem(SK_NOTIZ);
        if (raw) {
            var d = JSON.parse(raw);
            var ta = document.getElementById('bos-j-notiz');
            if (ta && d.text) ta.value = d.text;
            var savedEl = document.getElementById('bos-j-notiz-saved');
            if (savedEl && d.timestamp) {
                savedEl.textContent = 'Gespeichert · ' + _tsLabel(d.timestamp);
                savedEl.style.opacity = '1';
            }
        }
    } catch (e) {}

    // Event-Listener: Autosave bei Eingabe
    var ta = document.getElementById('bos-j-notiz');
    if (ta) ta.addEventListener('input', _saveNotiz);

    // Snap-Status initial setzen
    _updateSnapStatus();

    // Ausstehende Schnellzugriffe-Änderung anzeigen
    _checkSchnellPending();
}

function _checkSchnellPending() {
    var pending = localStorage.getItem('BOS_MORGEN_SCHNELLZUGRIFFE');
    var el = document.getElementById('bos-j-schnell-pending');
    if (!el) return;
    if (pending) {
        try {
            var arr = JSON.parse(pending) || [];
            el.style.display = '';
            el.innerHTML = '⚠️ <strong>' + arr.length + ' Schnellzugriff' + (arr.length !== 1 ? 'e' : '') +
                ' aus der NFC-Zentrale ausstehend</strong> — beim nächsten Export eingebunden. ' +
                'Erst danach sehen alle Geräte die neuen Links.';
        } catch(e) { el.style.display = 'none'; }
    } else {
        el.style.display = 'none';
    }
}

// ── INIT ─────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _render);
} else {
    _render();
}

})();
