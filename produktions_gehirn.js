/**
 * produktions_gehirn.js — BäckereiOS
 * Übersetzt backmengen_db.json + produkt_config.json + taeglicher_verbrauch.json
 * in window.BOS_STAMMDATEN — exakt die Struktur die Schnellrechner,
 * Planer und froster_gehirn.js erwarten.
 *
 * Einbinden: <script src="produktions_gehirn.js"></script>
 * Verwenden: await window.BOS_GEHIRN.init();
 *            // danach ist window.BOS_STAMMDATEN befüllt
 */

(function() {
'use strict';

// ── FEIERTAGE NDS ─────────────────────────────────────────
const FEIERTAGE_NDS = [
    '2026-01-01','2026-04-03','2026-04-06','2026-05-01','2026-05-14',
    '2026-05-25','2026-10-03','2026-10-31','2026-12-25','2026-12-26',
    '2025-01-01','2025-04-18','2025-04-21','2025-05-01','2025-05-29',
    '2025-06-09','2025-10-03','2025-10-31','2025-12-25','2025-12-26',
    '2027-01-01','2027-04-02','2027-04-05','2027-05-01','2027-05-13',
    '2027-05-24','2027-10-03','2027-10-31','2027-12-25','2027-12-26'
];

// ── JS-WOCHENTAG → BOS-INDEX (Mo=0..So=6) ────────────────
const JS_ZU_BOS = [6,0,1,2,3,4,5];

// ── MINDEST-EINTRÄGE FÜR FAIL-FAST ───────────────────────
const MIN_EINTRAEGE = 7;

// ═════════════════════════════════════════════════════════
// GEHIRN
// ═════════════════════════════════════════════════════════
const GEHIRN = {

    // Geladene Rohdaten
    _db:       null,
    _config:   null,
    _verbrauch: null,
    _bereit:   false,
    _fehler:   null,

    // ── INIT ──────────────────────────────────────────────
    async init(basePath) {
        this._bereit = false;
        this._fehler = null;

        // Basis-Pfad automatisch ermitteln wenn nicht angegeben
        // Erkennt ob die Seite aus einem Unterordner aufgerufen wird
        const base = basePath || this._autoBasePath();

        try {
            // Alle drei Dateien parallel laden
            const [r1, r2, r3] = await Promise.all([
                fetch(base + 'backmengen_db.json',       { cache: 'no-store' }),
                fetch(base + 'produkt_config.json',      { cache: 'no-store' }),
                fetch(base + 'taeglicher_verbrauch.json',{ cache: 'no-store' }).catch(() => null)
            ]);

            if (!r1.ok) throw new Error('backmengen_db.json nicht erreichbar');
            if (!r2.ok) throw new Error('produkt_config.json nicht erreichbar');

            this._db      = await r1.json();
            this._config  = await r2.json();
            this._verbrauch = (r3 && r3.ok) ? await r3.json() : null;

        } catch(e) {
            this._fehler = e.message;
            this._zeigeKritischenFehler('Dateien konnten nicht geladen werden', e.message);
            return false;
        }

        // Fail Fast: zu wenige Daten
        const gefiltert = this._gefilterteEintraege();
        if (gefiltert.length < MIN_EINTRAEGE) {
            this._fehler = `Zu wenige Datensätze: ${gefiltert.length} (Minimum: ${MIN_EINTRAEGE})`;
            this._zeigeKritischenFehler(
                'Nicht genug Daten für zuverlässige Berechnung',
                `Nur ${gefiltert.length} verwertbare Tage in der Datenbank. ` +
                `Mindestens ${MIN_EINTRAEGE} werden benötigt.`
            );
            return false;
        }

        // BOS_STAMMDATEN aufbauen
        this._baueStammdaten(gefiltert);
        this._bereit = true;

        console.log(
            `[BOS_GEHIRN] ✓ ${Object.keys(window.BOS_STAMMDATEN).length} Produkte ` +
            `· Basis: ${gefiltert.length} Tage ` +
            `· Zeitraum: ${this._verbrauch?.zeitraum_tage ?? 'alle'} Tage`
        );

        return true;
    },

    // ── EINTRÄGE FILTERN ──────────────────────────────────
    _gefilterteEintraege() {
        const zeitraum = this._verbrauch?.zeitraum_tage ?? 14;
        const feiertageAus  = this._verbrauch?.feiertage_ausschliessen ?? true;
        const sondertageAus = this._verbrauch?.sondertage_ausschliessen ?? true;
        const manuellAus    = new Set(
            (this._verbrauch?.ausgeschlossene_tage ?? []).map(t => t.datum)
        );

        // Nach Datum sortieren, neueste zuerst, dann begrenzen
        const sortiert = [...this._db].sort((a,b) => b.datum.localeCompare(a.datum));
        const begrenzt = zeitraum > 0 ? sortiert.slice(0, zeitraum) : sortiert;

        return begrenzt.filter(e => {
            const datum = e.datum;
            const k = e.kontext || {};

            // Manuell ausgeschlossen
            if (manuellAus.has(datum)) return false;

            // Feiertag
            if (feiertageAus && (FEIERTAGE_NDS.includes(datum) || k.feiertag)) return false;

            // Sondertag — aber nur für Filialprodukte relevant
            // Hier: kompletter Ausschluss des Tages wenn Sondertag
            // (feinere Logik pro Produkt kommt in _baueStammdaten)
            if (sondertageAus && (k.ausschluss_sondertag || k.ausschluss_einschraenkung)) {
                return false;
            }

            return true;
        });
    },

    // ── BOS_STAMMDATEN AUFBAUEN ───────────────────────────
    _baueStammdaten(gefiltert) {
        const stammdaten = {};

        // Pro Produkt: Durchschnitte pro Wochentag berechnen
        this._config.forEach((prod, idx) => {
            if (!prod.legacyKey) return;

            const key = prod.legacyKey; // z.B. "hasenberger_stueck"

            // Sammle Werte pro BOS-Wochentag
            const sammlung = [[], [], [], [], [], [], []]; // Mo=0..So=6

            gefiltert.forEach(e => {
                const bosWT = JS_ZU_BOS[new Date(e.datum + 'T12:00:00').getDay()];
                const produkte = e.produkte || {};
                const wert = parseFloat(produkte[key]);
                if (wert > 0) sammlung[bosWT].push(wert);
            });

            // Durchschnitt pro Wochentag → needs Array
            // Wenn einheit='bleche': durch Charge teilen → Bleche statt Stück
            const charge = prod.charge || 1;
            const alsBlech = prod.einheit === 'bleche' && charge > 1;

            const needs = sammlung.map(arr => {
                if (!arr.length) return 0;
                const avg = arr.reduce((s,v) => s+v, 0) / arr.length;
                return alsBlech ? Math.round(avg / charge) : Math.round(avg);
            });

            // Wenn alle needs = 0 → Produkt überspringen
            if (needs.every(n => n === 0)) return;

            // BOS-ID: p1, p2, ... oder legacyKey als Fallback
            const bosId = 'p' + (idx + 1);

            stammdaten[bosId] = {
                name:      prod.name,
                needs:     needs,
                batchSize: prod.batchSize || 1,
                station:   prod.station   || 'Nachtschicht',
                unit:      prod.unit      ?? 0,
                sun:       0, // bewusst 0 — Wettergehirn übernimmt das später
                // Zusätzliche Felder für moderne Tools
                legacyKey: key,
                einheit:   prod.einheit   || 'stueck',
                charge:    prod.charge    || 1,
                backTage:  prod.backTage  || [],
                filialeProdukt: prod.filialeProdukt || false
            };
        });

        window.BOS_STAMMDATEN = stammdaten;
    },

    // ── BASIS-PFAD ERKENNUNG ──────────────────────────────
    _autoBasePath() {
        // Pfad aus dem eigenen Script-Tag lesen — zuverlässigste Methode
        const scripts = document.querySelectorAll('script[src*="produktions_gehirn.js"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            // Alles vor "produktions_gehirn.js" ist der Basis-Pfad
            const base = src.replace('produktions_gehirn.js', '');
            return base;
        }
        return '';
    },

    // ── FAIL FAST FEHLERANZEIGE ───────────────────────────
    _zeigeKritischenFehler(titel, detail) {
        // Alle bekannten Container die Tools benutzen mit Fehlermeldung befüllen
        const ids = ['main-list','overview-body','sandbox-grid','ergebnis'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = `
                    <div style="text-align:center;padding:30px;color:#ef4444;">
                        <div style="font-size:1.5rem;margin-bottom:8px;">⚠</div>
                        <div style="font-weight:800;margin-bottom:4px;">${titel}</div>
                        <div style="font-size:0.8rem;color:#6b7280;">${detail}</div>
                    </div>`;
            }
        });

        // Falls noch kein Container gefunden: Document-Level Banner
        const banner = document.createElement('div');
        banner.style.cssText =
            'position:fixed;top:0;left:0;right:0;z-index:9999;' +
            'background:#ef4444;color:#fff;text-align:center;' +
            'padding:12px 16px;font-weight:700;font-size:0.85rem;';
        banner.innerHTML = `⚠ ${titel}: ${detail}`;
        document.body?.prepend(banner);

        console.error('[BOS_GEHIRN] FEHLER:', titel, detail);
    },

    // ── HILFSFUNKTIONEN FÜR ANDERE TOOLS ─────────────────

    // LegacyKey → BOS-ID
    bosIdFuerKey(legacyKey) {
        if (!window.BOS_STAMMDATEN) return null;
        for (const [id, p] of Object.entries(window.BOS_STAMMDATEN)) {
            if (p.legacyKey === legacyKey) return id;
        }
        return null;
    },

    // BOS-ID → LegacyKey
    keyFuerBosId(bosId) {
        return window.BOS_STAMMDATEN?.[bosId]?.legacyKey || null;
    },

    // Ist das Gehirn bereit?
    get bereit() { return this._bereit; },
    get fehler()  { return this._fehler; },
    get anzahlProdukte() {
        return window.BOS_STAMMDATEN ? Object.keys(window.BOS_STAMMDATEN).length : 0;
    }
};

// ── GLOBAL EXPORTIEREN ────────────────────────────────────
window.BOS_GEHIRN = GEHIRN;

})();
