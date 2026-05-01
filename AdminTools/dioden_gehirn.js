// ═══════════════════════════════════════════════════════════════
// dioden_gehirn.js — Die Logik-Steuerung der Cockpit-Dioden
// ═══════════════════════════════════════════════════════════════

function weckeDasGehirn() {
    if (typeof DiodenConfig === 'undefined') return;

    const heute = new Date();
    const tagesZiffer = heute.getDay();
    const aktuelleStunde = heute.getHours();
    const toDDMM = (d) => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';

    // 1. KÖRNER ALARM (Nach 12 Uhr an gewählten Tagen)
    if (DiodenConfig.koernerTage.includes(tagesZiffer) && aktuelleStunde >= 12) {
        document.getElementById('diode-koerner')?.classList.add('leuchtet');
    }

    // 2. BÄKO ALARM (Vor 11 Uhr an Bestelltagen)
    if (DiodenConfig.baekoTage.includes(tagesZiffer) && aktuelleStunde < 11) {
        document.getElementById('diode-bestellung')?.classList.add('leuchtet');
    }

    // 3. MUFFEL-BOSS (Backmengen DB checken)
    fetch('backmengen_db.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(db => {
            if (Array.isArray(db) && db.length) {
                const latestStr = [...db].sort((a, b) => b.datum.localeCompare(a.datum))[0].datum;
                const latestDate = new Date(latestStr);
                const diffDays = Math.ceil(Math.abs(heute - latestDate) / (1000 * 60 * 60 * 24));
                if (diffDays > DiodenConfig.muffelToleranzTage) {
                    document.getElementById('diode-muffel')?.classList.add('leuchtet');
                }
            }
        }).catch(() => {});

    // 4. TEAM-RADAR (Geburtstage in den nächsten 3 Tagen)
    let hatGeburtstag = false;
    for (let i = 0; i <= 3; i++) {
        const checkDate = new Date(heute);
        checkDate.setDate(heute.getDate() + i);
        if (Object.values(DiodenConfig.geburtstage).includes(toDDMM(checkDate))) {
            hatGeburtstag = true; break;
        }
    }
    if (hatGeburtstag) document.getElementById('diode-team')?.classList.add('leuchtet');

    // 5. FEIERTAGS-RADAR (Nutzt feiertage_nds.js)
    if (typeof window.BOS_BESONDERE_TAGE_IN === 'function') {
        const radar = DiodenConfig.feiertagRadar || { feiertag: true, ferien: false, betriebsurlaub: false };
        const kommende = window.BOS_BESONDERE_TAGE_IN(DiodenConfig.feiertagVorwarnTage);
        const treffer = kommende.some(tag => radar[tag.typ] === true);
        if (treffer) {
            document.getElementById('diode-feiertag')?.classList.add('leuchtet');
        }
    }

    // 6. WURM-DIODE
    // Zeigt den Zustand des automatischen Berechnungsfensters.
    // Quelle: window.BOS_GEHIRN.wurmStatus — wird von produktions_gehirn.js
    // nach init() gesetzt. Falls BOS_GEHIRN noch nicht initialisiert ist,
    // wird taeglicher_verbrauch.json direkt gelesen.
    //
    // Zustände:
    //   Wurm aktiv + läuft    → Diode leuchtet grün (Klasse: leuchtet-gruen)
    //   Wurm aktiv + eingefroren → Diode leuchtet amber (Klasse: leuchtet / Standard)
    //   Wurm inaktiv (manuell) → Diode aus (kein leuchtet)
    _pruefeWurmDiode();
}

function _pruefeWurmDiode() {
    const diode = document.getElementById('diode-wurm');
    if (!diode) return;

    function _setzeWurmDiode(status) {
        // status: 'laeuft' | 'eingefroren' | 'inaktiv'
        diode.classList.remove('leuchtet', 'leuchtet-gruen', 'wurm-eingefroren');
        if (status === 'laeuft') {
            diode.classList.add('leuchtet', 'leuchtet-gruen');
            diode.title = 'Berechnungs-Wurm läuft';
        } else if (status === 'eingefroren') {
            diode.classList.add('leuchtet', 'wurm-eingefroren');
            diode.title = 'Berechnungs-Wurm ❄ eingefroren (Feiertag im Fenster)';
        }
        // 'inaktiv' → keine Klasse, Diode bleibt gedimmt
    }

    // Wenn BOS_GEHIRN bereits initialisiert und Wurm-Status bekannt
    if (window.BOS_GEHIRN && window.BOS_GEHIRN.wurmStatus) {
        const ws = window.BOS_GEHIRN.wurmStatus;
        if (!ws.aktiv) { _setzeWurmDiode('inaktiv'); return; }
        _setzeWurmDiode(ws.eingefroren ? 'eingefroren' : 'laeuft');
        return;
    }

    // Fallback: taeglicher_verbrauch.json direkt lesen
    fetch('taeglicher_verbrauch.json', { cache: 'no-store' })
        .then(r => r.json())
        .then(cfg => {
            if (!cfg.wurm_aktiv) { _setzeWurmDiode('inaktiv'); return; }

            // Wurm ist aktiv — prüfen ob eingefroren
            // Gleiche Logik wie produktions_gehirn.js: gibt es einen Feiertag
            // im Fenster [heute-zeitraum .. gestern]?
            const FEIERTAGE_NDS = [
                '2026-01-01','2026-04-03','2026-04-06','2026-05-01','2026-05-14',
                '2026-05-25','2026-10-03','2026-10-31','2026-12-25','2026-12-26',
                '2025-01-01','2025-04-18','2025-04-21','2025-05-01','2025-05-29',
                '2025-06-09','2025-10-03','2025-10-31','2025-12-25','2025-12-26',
                '2027-01-01','2027-04-02','2027-04-05','2027-05-01','2027-05-13',
                '2027-05-24','2027-10-03','2027-10-31','2027-12-25','2027-12-26'
            ];
            const zeitraum = cfg.zeitraum_tage || 14;
            const heute = new Date(); heute.setHours(0,0,0,0);
            const gestern = new Date(heute); gestern.setDate(heute.getDate() - 1);
            const p = n => String(n).padStart(2,'0');
            const toISO = d => d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());

            let eingefroren = false;
            for (let i = 0; i < zeitraum; i++) {
                const tag = new Date(gestern); tag.setDate(gestern.getDate() - i);
                if (FEIERTAGE_NDS.includes(toISO(tag))) { eingefroren = true; break; }
            }
            _setzeWurmDiode(eingefroren ? 'eingefroren' : 'laeuft');
        })
        .catch(() => {}); // Kein Fehler anzeigen wenn Datei fehlt
}

document.addEventListener('DOMContentLoaded', weckeDasGehirn);
