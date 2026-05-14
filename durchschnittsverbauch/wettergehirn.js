/**
 * wettergehirn.js — BäckereiOS
 * Wetter-Berechnungslogik: Segmentierung, Grillwetter-Erkennung,
 * Empfehlungen auf Basis von backmengen_db + stammdaten.js
 *
 * Verwendung:
 *   <script src="../wettergehirn.js"></script>
 *   const gehirn = new WetterGehirn();
 *   await gehirn.init();
 *   const empfehlung = gehirn.empfehlung('2026-04-15', 26, 'sonnig');
 */

// ── KOORDINATEN SEELZE ────────────────────────────────────
const BOS_WETTER_LAT = 52.3977;
const BOS_WETTER_LON = 9.5947;

// ── MINDEST-DATENSÄTZE FÜR FREISCHALTUNG ─────────────────
const BOS_MIN_DATENSAETZE = 60;

// ── SAISON-GRILLWETTER ────────────────────────────────────
// Grillwetter gilt nur Apr–Sep (Monate 4–9)
const BOS_GRILLSAISON_VON = 4;
const BOS_GRILLSAISON_BIS = 9;
const BOS_GRILLTEMP_SCHWELLE = 22; // °C

// ── WMO WETTERCODE → Kategorie ───────────────────────────
function bosWmoKategorie(code) {
    if (code === 0)  return 'klar';
    if (code <= 2)   return 'heiter';
    if (code === 3)  return 'bewoelkt';
    if (code <= 48)  return 'nebel';
    if (code <= 67)  return 'regen';
    if (code <= 77)  return 'schnee';
    if (code <= 82)  return 'schauer';
    if (code <= 86)  return 'schneeschauer';
    return 'gewitter';
}

// ── WMO CODE → Anzeige-Symbol + Label ────────────────────
function bosWmoSymbol(code) {
    if (code === 0)        return { sym: '☀️', label: 'Klar' };
    if (code <= 2)         return { sym: '🌤', label: 'Meist klar' };
    if (code === 3)        return { sym: '☁️', label: 'Bedeckt' };
    if (code <= 48)        return { sym: '🌫', label: 'Nebel' };
    if (code <= 67)        return { sym: '🌧', label: 'Regen' };
    if (code <= 77)        return { sym: '🌨', label: 'Schnee' };
    if (code <= 82)        return { sym: '🌧', label: 'Schauer' };
    if (code <= 86)        return { sym: '🌨', label: 'Schneeschauer' };
    return                      { sym: '⛈',  label: 'Gewitter' };
}

// ── TEXT-WETTER (aus DB) → Symbol ────────────────────────
function bosTextWetterSymbol(wetterText) {
    if (!wetterText) return '';
    const w = wetterText.toLowerCase();
    if (w.includes('sonn') || w.includes('klar') || w.includes('heiter')) return '☀️';
    if (w.includes('gewitter'))  return '⛈';
    if (w.includes('schnee'))    return '🌨';
    if (w.includes('regen') || w.includes('schauer') || w.includes('nass')) return '🌧';
    if (w.includes('nebel'))     return '🌫';
    if (w.includes('wolke') || w.includes('bewölkt') || w.includes('bedeckt')) return '☁️';
    if (w.includes('überwiegend')) return '🌤';
    return '🌤';
}

// ── SEGMENT-ERKENNUNG ─────────────────────────────────────
function bosSegment(datum, tempMax, wetterKode) {
    const monat = new Date(datum + 'T12:00:00').getMonth() + 1;
    const inSaison = monat >= BOS_GRILLSAISON_VON && monat <= BOS_GRILLSAISON_BIS;
    const kat = typeof wetterKode === 'number'
        ? bosWmoKategorie(wetterKode)
        : wetterKode?.toLowerCase() || '';

    const istSonnig = ['klar','heiter'].some(k => kat.includes(k)) ||
                      kat.includes('sonn');
    const istRegen  = ['regen','schauer','gewitter'].some(k => kat.includes(k));

    if (inSaison && tempMax >= BOS_GRILLTEMP_SCHWELLE && istSonnig && !istRegen) {
        return 'grillwetter';
    }
    if (istRegen) return 'regen';
    return 'normal';
}

// ── BACKTAG-HINWEIS (für Vortag) ─────────────────────────
// Bäcker backen am Abend für den nächsten Tag
function bosBacktagHinweis(segment) {
    if (segment === 'grillwetter') return { text: '🔥 morgen Grillwetter — Brötchen ↑, Brot ↓', typ: 'grill' };
    if (segment === 'regen')       return { text: '🌧 morgen Regen — Brot ↑, Brötchen leicht ↓', typ: 'regen' };
    return null;
}

// ════════════════════════════════════════════════════════
// WETTER-GEHIRN KLASSE
// ════════════════════════════════════════════════════════
class WetterGehirn {
    constructor() {
        this.db = [];
        this.stammdaten = window.BOS_STAMMDATEN || {};
        this.bereit = false;
        this.datensaetze = 0;
    }

    async init() {
        try {
            // Relativer Pfad — funktioniert aus durchschnittsverbauch/ heraus
            const pfade = ['../backmengen_db.json', './backmengen_db.json', 'backmengen_db.json'];
            for (const pfad of pfade) {
                try {
                    const r = await fetch(pfad, { cache: 'no-store' });
                    if (r.ok) { this.db = await r.json(); break; }
                } catch(e) { /* weiter versuchen */ }
            }
            this.datensaetze = this.db.length;
            this.bereit = this.datensaetze >= BOS_MIN_DATENSAETZE;
        } catch(e) {
            console.warn('WetterGehirn: DB nicht geladen', e.message);
        }
        return this;
    }

    // Fortschritt für UI
    fortschritt() {
        return {
            anzahl: this.datensaetze,
            minimum: BOS_MIN_DATENSAETZE,
            fehlend: Math.max(0, BOS_MIN_DATENSAETZE - this.datensaetze),
            prozent: Math.min(100, (this.datensaetze / BOS_MIN_DATENSAETZE) * 100),
            bereit: this.bereit
        };
    }

    // ── Durchschnitt pro Wochentag + Segment ─────────────
    segmentDurchschnitt(produktKey, wochentag, segment) {
        if (!this.bereit) return null;

        const eintraege = this.db.filter(e => {
            if (e.wochentag !== wochentag) return false;
            const k = e.kontext || {};
            const temp = k.temperatur || 15;
            const wetter = k.wetter || 'normal';
            return bosSegment(e.datum, temp, wetter) === segment;
        });

        if (eintraege.length < 3) return null;

        const werte = eintraege
            .map(e => {
                const p = e.produkte || e;
                return parseFloat(p[produktKey]) || 0;
            })
            .filter(v => v > 0);

        if (werte.length < 3) return null;
        return {
            avg: werte.reduce((s, v) => s + v, 0) / werte.length,
            n: werte.length
        };
    }

    // ── Empfehlung für einen Tag ──────────────────────────
    empfehlung(datum, tempMax, wetterKode) {
        if (!this.bereit) return null;

        const d = new Date(datum + 'T12:00:00');
        const wochentag = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][d.getDay()];
        const segment = bosSegment(datum, tempMax, wetterKode);
        const empfehlungen = [];

        for (const [id, prod] of Object.entries(this.stammdaten)) {
            const wtIdx = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mo=0…So=6
            const basis = prod.needs?.[wtIdx] || 0;
            if (basis === 0) continue;

            // Legacy-Key raten (vereinfacht)
            const nameLower = prod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const blechKey = nameLower + '_bleche';

            const normal = this.segmentDurchschnitt(blechKey, wochentag, 'normal');
            const seg    = this.segmentDurchschnitt(blechKey, wochentag, segment);

            if (!normal || !seg || normal.avg === 0) continue;

            const faktor = seg.avg / normal.avg;
            const empfohlen = Math.round(basis * faktor);

            if (Math.abs(empfohlen - basis) >= 1) {
                empfehlungen.push({
                    name: prod.name,
                    station: prod.station,
                    basis,
                    empfohlen,
                    delta: empfohlen - basis,
                    faktor: faktor.toFixed(2),
                    segment,
                    n: seg.n
                });
            }
        }

        // Sortiert: größte Abweichungen zuerst
        empfehlungen.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

        return {
            datum,
            wochentag,
            segment,
            hinweis: bosBacktagHinweis(segment),
            empfehlungen
        };
    }
}

// ── Globale Exports ───────────────────────────────────────
window.WetterGehirn        = WetterGehirn;
window.bosWmoSymbol        = bosWmoSymbol;
window.bosTextWetterSymbol = bosTextWetterSymbol;
window.bosSegment          = bosSegment;
window.bosBacktagHinweis   = bosBacktagHinweis;
window.BOS_WETTER_LAT      = BOS_WETTER_LAT;
window.BOS_WETTER_LON      = BOS_WETTER_LON;
window.BOS_MIN_DATENSAETZE = BOS_MIN_DATENSAETZE;
