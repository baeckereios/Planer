// druckzentrale_baeko.js
// Modul F — BÄKO-Übersicht für Druckzentrale
// Lädt: lieferanten_config.json, lieferanten_bestand_db.json
// Exportiert: DZ_renderBaeko()

var _bk_config   = [];   // lieferanten_config.json → produkte[]
var _bk_aufschlag = 0.15;
var _bk_bestand  = [];   // lieferanten_bestand_db.json
var _bk_geladen  = false;

var WT_LABEL_BK = ['Mo','Di','Mi','Do','Fr','Sa','So'];
var LAGERTYP_ORDER_BK = ['tk','kuehl','trocken','sonstiges'];
var LAGERTYP_LABEL_BK = { tk:'Tiefkühl', kuehl:'Kühl', trocken:'Trocken', sonstiges:'Sonstiges' };

// ── LADEN ────────────────────────────────────────────────────────────

(function() {
    var pfade = [
        { key:'config',  urls:['lieferanten_config.json','../lieferanten_config.json'] },
        { key:'bestand', urls:['lieferanten_bestand_db.json','../lieferanten_bestand_db.json'] }
    ];

    function fetchFirst(urls, cb) {
        var i = 0;
        function tryNext() {
            if (i >= urls.length) { cb(null); return; }
            fetch(urls[i++], { cache:'no-store' })
                .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
                .then(function(d) { cb(d); })
                .catch(tryNext);
        }
        tryNext();
    }

    var pending = pfade.length;
    pfade.forEach(function(p) {
        fetchFirst(p.urls, function(d) {
            if (d !== null) {
                if (p.key === 'config') {
                    _bk_config = Array.isArray(d) ? d : (d.produkte || []);
                    if (d.einstellungen && d.einstellungen.sicherheitsaufschlag !== undefined) {
                        _bk_aufschlag = d.einstellungen.sicherheitsaufschlag;
                    }
                } else {
                    _bk_bestand = Array.isArray(d) ? d : [];
                }
            }
            if (--pending === 0) {
                _bk_geladen = true;
                // Falls Modul F bereits aktiv ist, nachladen
                if (typeof _active !== 'undefined' && _active.F) {
                    DZ_renderBaeko();
                }
            }
        });
    });
})();

// ── HILFSFUNKTIONEN ──────────────────────────────────────────────────

function _bk_letzterBestand(produktId) {
    // Neuester Snapshot der dieses Produkt enthält
    for (var i = _bk_bestand.length - 1; i >= 0; i--) {
        var snap = _bk_bestand[i];
        if (snap.bestaende && snap.bestaende[produktId] !== undefined) {
            return { datum: snap.datum, menge: snap.bestaende[produktId].menge };
        }
    }
    return null;
}

function _bk_durchschnittsverbrauch(produktId) {
    // Verbrauch = Bestand(t) + Eingang(zwischen) - Bestand(t+1)
    // Vereinfacht ohne Eingang: reine Bestandsdifferenz zwischen aufeinanderfolgenden Snapshots
    var snaps = _bk_bestand.filter(function(s) {
        return s.bestaende && s.bestaende[produktId] !== undefined;
    });
    if (snaps.length < 2) return null;

    var verbraeuche = [];
    for (var i = 1; i < snaps.length; i++) {
        var v = snaps[i-1].bestaende[produktId].menge - snaps[i].bestaende[produktId].menge;
        var tage = (new Date(snaps[i].datum) - new Date(snaps[i-1].datum)) / 86400000;
        if (tage > 0 && v >= 0) verbraeuche.push(v / tage);
    }
    if (!verbraeuche.length) return null;
    return verbraeuche.reduce(function(a,b){return a+b;},0) / verbraeuche.length;
}

function _bk_naechsterBestelltag(bestelltage) {
    if (!bestelltage || !bestelltage.length) return null;
    var heute = (new Date().getDay() + 6) % 7; // Mo=0..So=6
    // Nächsten Bestelltag ab morgen suchen
    for (var offset = 1; offset <= 7; offset++) {
        var wt = (heute + offset) % 7;
        if (bestelltage.indexOf(wt) !== -1) return wt;
    }
    return null;
}

function _bk_pad(n) { return n < 10 ? '0' + n : '' + n; }

function _bk_fmtDatum(str) {
    if (!str) return '–';
    var p = str.split('-');
    return p[2] + '.' + p[1] + '.' + p[0].slice(2);
}

function _bk_cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ── RENDER ───────────────────────────────────────────────────────────

function DZ_renderBaeko() {
    var el = document.getElementById('baeko-content');
    if (!el) return;

    if (!_bk_geladen || !_bk_config.length) {
        el.innerHTML = '<div class="dz-loading">BÄKO-Daten werden geladen…</div>';
        return;
    }

    var html = '';

    LAGERTYP_ORDER_BK.forEach(function(typ) {
        var gruppe = _bk_config.filter(function(p) {
            return (p.lagertyp || 'sonstiges') === typ;
        });
        if (!gruppe.length) return;

        html += '<div class="bk-typ-header">' + (LAGERTYP_LABEL_BK[typ] || typ).toUpperCase() + '</div>';

        gruppe.forEach(function(p) {
            var ist = _bk_letzterBestand(p.id);
            var istMenge = ist !== null ? ist.menge : null;
            var invDatum = ist !== null ? 'Inventur: ' + _bk_fmtDatum(ist.datum) : 'Keine Inventur';

            var gebinde = p.gebinde
                ? _bk_cap(p.gebinde.form || '')
                  + (p.gebinde.inhalt_stueck ? ' à\u00a0' + p.gebinde.inhalt_stueck + '\u202f' + (p.gebinde.inhalt_einheit || '') : '')
                : '';

            var bestandStr = istMenge !== null
                ? istMenge + '\u00a0' + (p.soll_einheit || '')
                : '–';

            // Bestellempfehlung
            var avg = _bk_durchschnittsverbrauch(p.id);
            var snaps = _bk_bestand.filter(function(s) {
                return s.bestaende && s.bestaende[p.id] !== undefined;
            }).length;
            var empfStr = null;
            if (avg !== null) {
                var empf = Math.ceil(avg * 7 * (1 + _bk_aufschlag));
                empfStr = empf + '\u00a0' + (p.soll_einheit || '');
            }

            html += '<div class="bk-produkt-block">';

            // Produktname + Bestand
            html += '<div class="bk-prod-row">'
                + '<span class="bk-prod-name">' + p.name + '</span>'
                + '<span class="bk-prod-bestand">' + bestandStr + '</span>'
                + '</div>';

            // Meta-Zeile: Inventurdatum + Gebinde
            html += '<div class="bk-prod-meta">'
                + invDatum
                + (gebinde ? '\u00a0·\u00a0' + gebinde : '')
                + '</div>';

            // Bestellempfehlung
            if (empfStr) {
                html += '<div class="bk-prod-empf">'
                    + 'Bestellempfehlung:\u00a0<strong>' + empfStr + '</strong>'
                    + '<span class="bk-prod-basis">\u00a0(aus\u00a0' + snaps + '\u00a0Inventuren)</span>'
                    + '</div>';
            } else {
                html += '<div class="bk-prod-empf bk-prod-empf-leer">'
                    + 'Keine Bestellempfehlung\u00a0–\u00a0zu wenig Inventuren'
                    + '</div>';
            }

            html += '</div>'; // bk-produkt-block
        });
    });

    el.innerHTML = html;
}
