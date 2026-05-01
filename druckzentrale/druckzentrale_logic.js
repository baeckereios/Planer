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
        return p.stock !== undefined
            ? p.stock
            : (p.locs ? p.locs.reduce(function(a, b) { return a + b; }, 0) : 0);
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
        var dateStr = d.getFullYear() + '-' + DZ_pad(d.getMonth() + 1) + '-' + DZ_pad(d.getDate());
        var typ    = DZ_wochenconfig[dateStr] || 'normal';
        if      (typ === 'zu')        need = 0;
        else if (typ === 'hamster_1') need = Math.ceil((p.needs[5] + need) / 2);
        else if (typ === 'hamster_2') need = p.needs[5];
        else if (typ === 'hamster_3') need = (bosIdx === 5) ? Math.ceil(p.needs[5] * 1.2) : Math.ceil(need * 1.5);
        total += need;
        d.setDate(d.getDate() + 1);
    }
    return total;
}

// Clevere Einheiten-Formatierung für den Druck
function DZ_getEinheit(p) {
    var e = p.einheitAnzeige || p.anzeigeEinheit || p.einheit || 'Bleche';
    var el = e.toLowerCase();
    
    if (!el || el === 'stueck' || el === 'stück' || el === 'stk') {
        return 'Bl.';
    }
    
    if (el.indexOf('blech') !== -1) return 'Bl.';
    if (el.indexOf('diel') !== -1) return 'Dl.';
    
    return e;
}

// ── ZEITSPANNE ──────────────────────────────────────────────────────

function DZ_buildZeitspanneOptions(sel, defaultDay, skipFirst) {
    sel.innerHTML = '';
    var DAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    var d = new Date(DZ_anchorDate || new Date()); d.setHours(0, 0, 0, 0);
    var defaultSet = false;
    var matchCount = 0; // zählt wie oft defaultDay bereits gefunden wurde
    for (var i = 0; i < 21; i++) {
        var opt   = document.createElement('option');
        var label = DAYS[d.getDay()] + ', ' + DZ_pad(d.getDate()) + '.' + DZ_pad(d.getMonth() + 1) + '.';
        opt.value       = d.getFullYear() + '-' + DZ_pad(d.getMonth() + 1) + '-' + DZ_pad(d.getDate());
        opt.textContent = label;
        if (!defaultSet && d.getDay() === defaultDay) {
            matchCount++;
            // skipFirst=true: ersten Treffer überspringen, zweiten nehmen
            if (!skipFirst || matchCount > 1) {
                opt.selected = true;
                defaultSet = true;
            }
        }
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

// ── RENDER: FROSTER-BESTAND (Nur Bestand) ────────────────────────────

function DZ_renderFroster() {
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

    var html = '<div class="fd-header">' +
               '<div class="fd-title">FROSTER-BESTAND</div>' +
               '<div class="fd-meta">Inventur: ' + invStr + '</div>' +
               '</div>';

    order.forEach(function(st) {
        html += '<div class="fd-station-block">';
        html += '<div class="fd-station">' + st + '</div>';
        groups[st].forEach(function(k) {
            var p     = window.BOS_STAMMDATEN[k];
            var stock = DZ_getStock(k);
            var einheit = DZ_getEinheit(p);
            var stockTxt = (stock === null) ? '—' : stock + ' ' + einheit;
            html += '<div class="fd-row">' +
                    '<span class="fd-name">' + p.name + '</span>' +
                    '<span class="fd-nums">' + stockTxt + '</span>' +
                    '</div>';
        });
        html += '</div>';
    });

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
        if (!DZ_invRelevant.has(p.legacyKey)) continue;
        var st = p.station || 'Sonstige';
        if (!groups[st]) { groups[st] = []; order.push(st); }
        groups[st].push(k);
    }

    var html = '';
    var DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo'];

    for (var i = 0; i < order.length; i += 2) {
        html += '<div class="matrix-page pb-after">';
        html += _renderStationMatrix(order[i], groups[order[i]], DAYS);
        
        if (i + 1 < order.length) {
            html += '<div style="height: 30px;"></div>'; 
            html += _renderStationMatrix(order[i+1], groups[order[i+1]], DAYS);
        }
        html += '</div>';
    }

    el.innerHTML = html;
}

function _renderStationMatrix(st, keys, DAYS) {
    var html = '<div class="matrix-station-wrap">';
    html += '<div class="wz-title">VERBRAUCHS-MATRIX &mdash; ' + st + '</div>';
    html += '<table class="wz-table"><thead><tr>';
    html += '<th>Produkt</th>';
    DAYS.forEach(function(d) { html += '<th class="r">' + d + '</th>'; });
    html += '<th class="r" style="border-left: 2px solid #111;">Summe</th>';
    html += '</tr></thead><tbody>';

    keys.forEach(function(k) {
        var p = window.BOS_STAMMDATEN[k];
        var einheit = DZ_getEinheit(p);
        var n = p.needs || [0,0,0,0,0,0,0];
        var matrixNeeds = [n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[0]];
        var sum = matrixNeeds.reduce(function(a,b){return a+b;},0);
        var sumTxt = sum > 0 ? sum + ' ' + einheit : '—';
        
        html += '<tr class="wz-row">';
        html += '<td>' + p.name + '</td>';
        matrixNeeds.forEach(function(val) { 
            html += '<td class="r">' + (val > 0 ? val : '<span style="color:#ccc;"></span>') + '</td>'; 
        });
        html += '<td class="r" style="border-left: 2px solid #111; font-weight: 900;">' + sumTxt + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    return html;
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

    if (!window.BOS_GEHIRN) {
        if (++_DZ_retryCount < 40) { setTimeout(function() { DZ_init(cb); }, 100); return; }
        console.error('[DZ] BOS_GEHIRN nicht verfügbar.');
        cb && cb(); return;
    }

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

    if (!window.BOS_INVENTUR) {
        if (++_DZ_retryCount < 40) {
            setTimeout(function() { _DZ_doInit(cb); }, 100); return;
        }
        try {
            var _c = JSON.parse(localStorage.getItem('BOS_URLAUBSSCHLUESSEL_CACHE') || 'null');
            if (_c && _c.exportedAt && (Date.now() - _c.exportedAt) <= 24 * 3600000 &&
                _c.products && Object.keys(_c.products).length > 0) {
                window.BOS_INVENTUR = { products: _c.products, stocks: _c.stocks || {} };
            }
        } catch(e) {}
    }

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

    DZ_refreshAnchorDate();

    cb && cb();
}

// Anchor-Datum immer frisch berechnen — darf nicht eingefroren sein.
// Wird beim Init UND direkt vor jedem Render aufgerufen.
function DZ_refreshAnchorDate() {
    var jetzt  = new Date();
    var minNow = jetzt.getHours() * 60 + jetzt.getMinutes();
    var fDone  = (minNow >= 90 && minNow <= 1200);
    DZ_anchorDate = new Date();
    DZ_anchorDate.setHours(0, 0, 0, 0);
    DZ_anchorDate.setDate(DZ_anchorDate.getDate() + (fDone ? 2 : 1));
}
