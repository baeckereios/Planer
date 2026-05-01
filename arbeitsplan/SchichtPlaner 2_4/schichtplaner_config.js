// ── SchichtPlaner — Config & State ─────────────────────
// Muss zuerst geladen werden. Alle anderen Module hängen
// von config, currentMonday und den Konstanten ab.

// ── Migration: fluss_config_v1 → schichtplaner_v1 ───────
(function() {
  if (!localStorage.getItem('schichtplaner_v1') && localStorage.getItem('fluss_config_v1')) {
    localStorage.setItem('schichtplaner_v1', localStorage.getItem('fluss_config_v1'));
    localStorage.removeItem('fluss_config_v1');
    console.log('SchichtPlaner: Daten migriert von fluss_config_v1 → schichtplaner_v1');
  }
})();

// ── Konstanten ──────────────────────────────────────────
const STORAGE_KEY = 'schichtplaner_v1';
const TAGE_NAMEN_LANG = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'];
const TAGE_NAMEN_KURZ = ['Mo','Di','Mi','Do','Fr','Sa'];

// ── State ───────────────────────────────────────────────
let config = null;
let currentMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());

// ── Config laden / speichern ────────────────────────────
async function loadConfig() {
  // Planungsdaten aus localStorage (gerätespezifisch)
  let planDaten = {};
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const lokal = JSON.parse(stored);
      // Nur Planungsdaten übernehmen
      planDaten.fehlzeiten         = lokal.fehlzeiten || [];
      planDaten.freieTage          = lokal.freieTage || {};
      planDaten.manuelleZuweisungen = lokal.manuelleZuweisungen || {};
    } catch(e) {}
  }

  // Stammdaten immer aus JSON (deployed = Wahrheit für alle Geräte)
  try {
    const res = await fetch('../schichtplaner_config.json', { cache: 'no-store' });
    const json = await res.json();
    config = {
      positionen:               json.positionen || [],
      personen:                 json.personen || [],
      joker:                    json.joker || '',
      azubiGesperrteAttribute:  json.azubiGesperrteAttribute || ['versand'],
      urlaub:                   json.urlaub || {},
      fruehschichtEinsaetze:    json.fruehschichtEinsaetze || [],
      // Planungsdaten vom Gerät
      fehlzeiten:               planDaten.fehlzeiten || [],
      freieTage:                planDaten.freieTage || {},
      manuelleZuweisungen:      planDaten.manuelleZuweisungen || {}
    };
  } catch(e) {
    // Fallback: alles aus localStorage
    if (stored) {
      try { config = JSON.parse(stored); return; } catch(e2) {}
    }
    config = { positionen: [], personen: [], joker: '', fehlzeiten: [], freieTage: {} };
  }
  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
