// druckzentrale_logic.js
// Berechnungslogik für Druckzentrale — portiert aus bestandsuebersicht.html

var DZ_anchorDate    = null;
var DZ_invRelevant   = new Set();
var DZ_wochenconfig  = {};
var DZ_latestInvTs   = 0;
var DZ_initialized   = false;
var _DZ_retryCount   = 0;

// ── HILFSFUNKTIONEN ─────────────────────────────────────────────────

function DZ_pad(n) { return n < 10 ? '0' + n : '' + n; }

function DZ_getLatestInvTs() {
    if (!window.BOS_INVENTUR || !window.BOS_INVENTUR.products) return 0;
    var max = 0;
    for (var k in window.BOS_INVENTUR.products) {
        var ts = window.BOS_INVENTUR.products[k].ts || 0;
        if (ts > max) max = ts;
    }
    return max;
}

function DZ_getStock(prodId) {
    if (!window.BOS_INVENTUR) return null;
    var inv = window.BOS_INVENTUR;
    var sd  = window.BOS_STAMMDATEN;
    var legacyKey = (sd && sd[prodId]) ? sd[prodId].legacyKey : null;
    var key = legacyKey || prodId;
    if (inv.products && inv.products[key]) {
        var p = inv.products[key];
        if (p.ts && p.ts > 0) {
            return p.stock || (p.locs ? p.locs.reduce(function(a, b) { return a + b; }, 0) : 0);
        }
        return null;
    }
    if (inv.stocks && inv.stocks[key] !== undefined) return inv.stocks[key];
    return null;
}

function DZ_calcNeed(prodId, zielDate) {
    var p = window.BOS_STAMMDATEN && window.BOS_STAMMDATEN[prodId];
    if (!p || !zielDate || !DZ_anchorDate) return 0;
    var total = 0;
    var d = new Date(DZ_anchorDate); d.setHours(0, 0, 0, 0);
    while (d <= zielDate) {
        var jsDay  = d.getDay();
        var bosIdx = (jsDay === 0) ? 6 : jsDay - 1;
        var need   = (p.needs && p.needs[bosIdx]) || 0;
        var typ    = DZ_wochenconfig[d.toISOString().split('T')[0]] || 'normal';
        if      (typ === 'zu')        need = 0;
        else if (typ === 'hamster_1') need = Math.ceil((p.needs[5] + need) / 2);
        else if (typ === 'hamster_2') need = p.needs[5];
        else if (typ === 'hamster_3') need = (bosIdx === 5) ? Math.ceil(p.needs[5] * 1.2) : Math.ceil(need * 1.5);
        total += need;
        d.setDate(d.getDate() + 1);
    }
    return total;
}

// ── ZEITSPANNE ──────────────────────────────────────────────────────

function DZ_buildZeitspanneOptions(sel, defaultDay) {
    sel.innerHTML = '';
    var DAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    var d = new Date(DZ_anchorDate || new Date()); d.setHours(0, 0, 0, 0);
    var defaultSet = false;
    for (var i = 0; i < 14; i++) {
        var opt   = document.createElement('option');
        var label = DAYS[d.getDay()] + ', ' + DZ_pad(d.getDate()) + '.' + DZ_pad(d.getMonth() + 1) + '.';
        opt.value       = d.toISOString().split('T')[0];
        opt.textContent = label;
        if (!defaultSet && d.getDay() === defaultDay) { opt.selected = true; defaultSet = true; }
        sel.appendChild(opt);
        d.setDate(d.getDate() + 1);
    }
    if (!defaultSet && sel.options.length > 0) sel.options[0].selected = true;
}

function DZ_parseDate(sel) {
    if (!sel || !sel.value) return null;
    var p = sel.value.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setHours(0, 0, 0, 0);
    return d;
}

// ── S/W LADEBALKEN ──────────────────────────────────────────────────

function DZ_swBar(stock, need) {
    var pct    = (stock === null || need === 0) ? 0 : Math.min(100, (stock / need) * 100);
    var filled = Math.round(pct * 0.2); // 20 Segmente
    var h      = '<div class="sw-bar">';
    for (var i = 0; i < 20; i++) {
        h += '<span class="sw' + (i < filled ? ' f' : '') + '"></span>';
    }
    return h + '</div>';
}

// ── RENDER: FROSTER-BESTAND ──────────────────────────────────────────

function DZ_renderFroster(zielDate) {
    var el = document.getElementById('froster-content');
    if (!el) return;
    if (!window.BOS_STAMMDATEN || !window.BOS_INVENTUR) {
        el.innerHTML = '<div class="dz-loading">Daten werden geladen…</div>';
        return;
    }

    var groups = {}, order = [];
    for (var k in window.BOS_STAMMDATEN) {
        var p = window.BOS_STAMMDATEN[k];
        if (!DZ_invRelevant.has(p.legacyKey)) continue;
        var st = p.station || 'Sonstige';
        if (!groups[st]) { groups[st] = []; order.push(st); }
        groups[st].push(k);
    }

    var invD   = new Date(DZ_latestInvTs);
    var invStr = DZ_latestInvTs > 0
        ? DZ_pad(invD.getDate()) + '.' + DZ_pad(invD.getMonth() + 1) + '. ' +
          DZ_pad(invD.getHours()) + ':' + DZ_pad(invD.getMinutes()) + ' Uhr'
        : 'Keine Inventur';
    var zielStr = DZ_pad(zielDate.getDate()) + '.' + DZ_pad(zielDate.getMonth() + 1) + '.';

    var html = '<div class="fd-header">' +
               '<div class="fd-title">FROSTER-BESTAND</div>' +
               '<div class="fd-meta">Inventur: ' + invStr + ' &nbsp;·&nbsp; Bedarf bis: ' + zielStr + '</div>' +
               '</div>';

    order.forEach(function(st) {
        html += '<div class="fd-station">' + st + '</div>';
        groups[st].forEach(function(k) {
            var p     = window.BOS_STAMMDATEN[k];
            var stock = DZ_getStock(k);
            var need  = DZ_calcNeed(k, zielDate);
            var stockTxt = (stock === null) ? '—' : stock;
            html += '<div class="fd-row">' +
                    '<span class="fd-name">' + p.name + '</span>' +
                    '<span class="fd-nums">' + stockTxt + '&thinsp;/&thinsp;' + need + ' Bl.</span>' +
                    DZ_swBar(stock, need) +
                    '</div>';
        });
    });

    el.innerHTML = html;
}

// ── RENDER: WOCHENZIELE ──────────────────────────────────────────────

function DZ_renderWochenziele(zielDate1, zielDate2) {
    var el = document.getElementById('wochenziele-content');
    if (!el) return;
    if (!window.BOS_STAMMDATEN) {
        el.innerHTML = '<div class="dz-loading">Daten werden geladen…</div>';
        return;
    }

    var groups = {}, order = [];
    for (var k in window.BOS_STAMMDATEN) {
        var p = window.BOS_STAMMDATEN[k];
        if (!DZ_invRelevant.has(p.legacyKey)) continue;
        var st = p.station || 'Sonstige';
        if (!groups[st]) { groups[st] = []; order.push(st); }
        groups[st].push(k);
    }

    var zielStr1 = DZ_pad(zielDate1.getDate()) + '.' + DZ_pad(zielDate1.getMonth() + 1) + '.';
    var zielStr2 = DZ_pad(zielDate2.getDate()) + '.' + DZ_pad(zielDate2.getMonth() + 1) + '.';

    var html = '<div class="wz-title">WOCHENZIELE</div>' +
               '<table class="wz-table"><thead><tr>' +
               '<th>Produkt</th>' +
               '<th class="r">Bedarf bis ' + zielStr1 + '</th>' +
               '<th class="r">Bedarf bis ' + zielStr2 + '</th>' +
               '</tr></thead><tbody>';

    order.forEach(function(st) {
        html += '<tr class="wz-st"><td colspan="3">' + st + '</td></tr>';
        groups[st].forEach(function(k) {
            var p     = window.BOS_STAMMDATEN[k];
            var need1 = DZ_calcNeed(k, zielDate1);
            var need2 = DZ_calcNeed(k, zielDate2);
            
            html += '<tr class="wz-row">' +
                    '<td>' + p.name + '</td>' +
                    '<td class="r">' + need1 + '</td>' +
                    '<td class="r">' + need2 + '</td>' +
                    '</tr>';
        });
    });

    html += '</tbody></table>';
    el.innerHTML = html;
}

// ── RENDER: VERBRAUCHS-MATRIX ────────────────────────────────────────

function DZ_renderVerbrauchsMatrix() {
    var el = document.getElementById('matrix-content');
    if (!el) return;
    if (!window.BOS_STAMMDATEN) {
        el.innerHTML = '<div class="dz-loading">Daten werden geladen…</div>';
        return;
    }

    var groups = {}, order = [];
    for (var k in window.BOS_STAMMDATEN) {
        var p = window.BOS_STAMMDATEN[k];
        if (!DZ_invRelevant.has(p.legacyKey)) continue; // Nur Frosterprodukte
        var st = p.station || 'Sonstige';
        if (!groups[st]) { groups[st] = []; order.push(st); }
        groups[st].push(k);
    }

    var html = '';
    var DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    order.forEach(function(st, idx) {
        // Wrapper mit page-break-Klasse
        html += '<div class="matrix-page' + (idx < order.length - 1 ? ' pb-after' : '') + '">';
        html += '<div class="wz-title">VERBRAUCHS-MATRIX &mdash; ' + st + '</div>';
        html += '<table class="wz-table"><thead><tr>';
        html += '<th>Produkt</th>';
        DAYS.forEach(function(d) { html += '<th class="r">' + d + '</th>'; });
        html += '<th class="r" style="border-left: 2px solid #111;">Summe</th>';
        html += '</tr></thead><tbody>';

        groups[st].forEach(function(k) {
            var p = window.BOS_STAMMDATEN[k];
            var needs = p.needs || [0,0,0,0,0,0,0];
            var sum = needs.reduce(function(a,b){return a+b;},0);
            
            html += '<tr class="wz-row">';
            html += '<td>' + p.name + '</td>';
            needs.forEach(function(n) { 
                html += '<td class="r">' + (n > 0 ? n : '<span style="color:#ccc;">-</span>') + '</td>'; 
            });
            html += '<td class="r" style="border-left: 2px solid #111; font-weight: 900;">' + sum + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div><br>';
    });

    el.innerHTML = html;
}

// ── INVENTUR-INFO ────────────────────────────────────────────────────

function DZ_getInvInfo() {
    var ageH   = DZ_latestInvTs > 0 ? (Date.now() - DZ_latestInvTs) / 3600000 : 9999;
    var d      = new Date(DZ_latestInvTs);
    var str    = DZ_latestInvTs > 0
        ? DZ_pad(d.getDate()) + '.' + DZ_pad(d.getMonth() + 1) + '. ' +
          DZ_pad(d.getHours()) + ':' + DZ_pad(d.getMinutes())
        : 'Keine Inventur';
    return { ageH: Math.floor(ageH), dateStr: str, isOld: ageH > 24 };
}

// ── INIT ─────────────────────────────────────────────────────────────

function DZ_init(cb) {
    if (DZ_initialized) { cb && cb(); return; }

    // Warten bis BOS_GEHIRN-Script geladen ist
    if (!window.BOS_GEHIRN) {
        if (++_DZ_retryCount < 40) { setTimeout(function() { DZ_init(cb); }, 100); return; }
        console.error('[DZ] BOS_GEHIRN nicht verfügbar.');
        cb && cb(); return;
    }

    // Gehirn explizit initialisieren
    if (!window.BOS_STAMMDATEN) {
        window.BOS_GEHIRN.init().then(function() {
            _DZ_doInit(cb);
        }).catch(function(e) {
            console.error('[DZ] BOS_GEHIRN.init() fehlgeschlagen:', e);
            _DZ_doInit(cb);
        });
        return;
    }

    _DZ_doInit(cb);
}

function _DZ_doInit(cb) {
    if (DZ_initialized) { cb && cb(); return; }

    // Auf BOS_INVENTUR warten
    if (!window.BOS_INVENTUR) {
        if (++_DZ_retryCount < 40) {
            setTimeout(function() { _DZ_doInit(cb); }, 100); return;
        }
        // Timeout — Fallback
        try {
            var _c = JSON.parse(localStorage.getItem('BOS_URLAUBSSCHLUESSEL_CACHE') || 'null');
            if (_c && _c.exportedAt && (Date.now() - _c.exportedAt) <= 24 * 3600000 &&
                _c.products && Object.keys(_c.products).length > 0) {
                window.BOS_INVENTUR = { products: _c.products, stocks: _c.stocks || {} };
            }
        } catch(e) {}
    }

    // Veraltete Inventur prüfen und mit Cache überschreiben
    if (window.BOS_INVENTUR) {
        var maxTs = 0;
        for (var k in window.BOS_INVENTUR.products) {
            var ts = window.BOS_INVENTUR.products[k].ts || 0;
            if (ts > maxTs) maxTs = ts;
        }
        var diffH = maxTs > 0 ? (Date.now() - maxTs) / 3600000 : 9999;

        if (diffH > 24) {
            try {
                var _c = JSON.parse(localStorage.getItem('BOS_URLAUBSSCHLUESSEL_CACHE') || 'null');
                if (_c && _c.exportedAt && (Date.now() - _c.exportedAt) <= 24 * 3600000 &&
                    _c.products && Object.keys(_c.products).length > 0) {
                    window.BOS_INVENTUR = { products: _c.products, stocks: _c.stocks || {} };
                }
            } catch(e) {}
        }
    }

    DZ_initialized = true;

    if (window.BOS_STAMMDATEN) {
        for (var k in window.BOS_STAMMDATEN) {
            var p = window.BOS_STAMMDATEN[k];
            if (p.inventurRelevant && p.legacyKey) DZ_invRelevant.add(p.legacyKey);
        }
    }

    DZ_latestInvTs = DZ_getLatestInvTs();

    var jetzt  = new Date();
    var minNow = jetzt.getHours() * 60 + jetzt.getMinutes();
    var fDone  = (minNow >= 90 && minNow <= 1200);
    DZ_anchorDate = new Date();
    DZ_anchorDate.setHours(0, 0, 0, 0);
    DZ_anchorDate.setDate(DZ_anchorDate.getDate() + (fDone ? 2 : 1));

    cb && cb();
}
