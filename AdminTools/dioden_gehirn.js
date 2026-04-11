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
}

document.addEventListener('DOMContentLoaded', weckeDasGehirn);
