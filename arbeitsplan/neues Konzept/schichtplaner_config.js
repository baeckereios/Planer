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
  // ── Mutable Planungsdaten ermitteln ─────────────────────
  // Priorität: localStorage (Session-Puffer) → window.BOS_* (deployiertes File) → leer
  let planDaten = {};
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const lokal = JSON.parse(stored);
      planDaten.fehlzeiten          = lokal.fehlzeiten || [];
      planDaten.freieTage           = lokal.freieTage || {};
      planDaten.manuelleZuweisungen = lokal.manuelleZuweisungen || {};
      planDaten.planAenderungen     = lokal.planAenderungen || [];
      // Frühschicht aus localStorage wenn vorhanden (In-Session-Änderungen)
      planDaten.fruehschichtEinsaetze      = lokal.fruehschichtEinsaetze;
      planDaten.fruehschichtFreitagAnheften = lokal.fruehschichtFreitagAnheften;
    } catch(e) {}
  } else {
    // Kein localStorage → deployiertes urlaub_krank.js als Initialzustand
    if (window.BOS_FEHLZEITEN !== undefined) {
      planDaten.fehlzeiten = window.BOS_FEHLZEITEN;
    }
    if (window.BOS_FRUEHSCHICHT !== undefined) {
      planDaten.fruehschichtEinsaetze       = window.BOS_FRUEHSCHICHT.einsaetze || [];
      planDaten.fruehschichtFreitagAnheften = window.BOS_FRUEHSCHICHT.freierTagAnheften;
    }
  }

  try {
    const res = await fetch('../schichtplaner_config.json', { cache: 'no-store' });
    const json = await res.json();
    config = {
      positionen:               json.positionen || [],
      personen:                 json.personen || [],
      joker:                    json.joker || '',
      azubiGesperrteAttribute:  json.azubiGesperrteAttribute || ['versand'],
      urlaub:                   json.urlaub || {},
      tagGewichte:              json.tagGewichte || { montag:0, dienstag:0, mittwoch:0, donnerstag:0, freitag:0, samstag:0 },
      wunschGewicht:            json.wunschGewicht !== undefined ? json.wunschGewicht : 1.5,
      wunschBasisBonus:         json.wunschBasisBonus !== undefined ? json.wunschBasisBonus : 3,
      wunschAbschwaecher:       json.wunschAbschwaecher !== undefined ? json.wunschAbschwaecher : 0.5,
      // Frühschicht: planDaten (localStorage/BOS_*) schlägt JSON
      fruehschichtEinsaetze:       planDaten.fruehschichtEinsaetze !== undefined
                                     ? planDaten.fruehschichtEinsaetze
                                     : (json.fruehschichtEinsaetze || []),
      fruehschichtFreitagAnheften: planDaten.fruehschichtFreitagAnheften !== undefined
                                     ? planDaten.fruehschichtFreitagAnheften
                                     : (json.fruehschichtFreitagAnheften !== false),
      // Planungsdaten aus Session
      fehlzeiten:               planDaten.fehlzeiten || [],
      freieTage:                planDaten.freieTage || {},
      manuelleZuweisungen:      planDaten.manuelleZuweisungen || {},
      planAenderungen:          planDaten.planAenderungen || []
    };
  } catch(e) {
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

// ── Plan-Änderungsprotokoll ─────────────────────────────
function logAenderung(datum, posId, grund) {
  if (!config.planAenderungen) config.planAenderungen = [];
  config.planAenderungen = config.planAenderungen.filter(e => !(e.datum === datum && e.posId === posId));
  config.planAenderungen.push({
    datum,
    posId,
    zeitstempel: new Date().toISOString(),
    grund: grund || 'Manuell geändert'
  });
  const grenze = new Date();
  grenze.setDate(grenze.getDate() - 7);
  const grenzeISO = grenze.toISOString().split('T')[0];
  config.planAenderungen = config.planAenderungen.filter(e => e.datum >= grenzeISO);
  saveToStorage();
}

// ═══════════════════════════════════════════════════════
// ── Schicht & Varianten State ───────────────────────────
// ═══════════════════════════════════════════════════════

let currentSchicht = localStorage.getItem('sp_schicht') || 'nacht';
let currentVariante = 0;

// VARIANTEN: wird von autoVerteilen() in schichtplaner_freieTage.js befüllt.
// Leer = Pfeile deaktiviert. Mutierbar (const Array ist OK).
const VARIANTEN = [];

// ── WeekKey → Monday ────────────────────────────────────
function weekKeyToMonday(weekKey) {
  const base = FLUSS_LOGIK.getMondayOfWeek(new Date());
  for (let d = -52; d <= 52; d++) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + d * 7);
    if (FLUSS_LOGIK.getWeekKey(candidate) === weekKey) return candidate;
  }
  return base;
}

// ── KW auswählen ────────────────────────────────────────
function selectKW(weekKey) {
  currentMonday = weekKeyToMonday(weekKey);
  // KW-Wechsel löscht die Varianten der alten Woche
  VARIANTEN.splice(0, VARIANTEN.length);
  currentVariante = 0;
  renderAll();
}

// ── Schicht auswählen ───────────────────────────────────
function selectSchicht(schicht) {
  currentSchicht = schicht;
  localStorage.setItem('sp_schicht', schicht);
  renderAll();
}

// ── Variante navigieren ─────────────────────────────────
// Snapshot der aktuellen Variante VOR dem Wechsel —
// manuelle Änderungen (Vorschläge annehmen etc.) gehen nicht verloren.
function changeVariante(delta) {
  if (VARIANTEN.length <= 1) return;

  const weekKey = FLUSS_LOGIK.getWeekKey(currentMonday);

  // Aktuelle Variante sichern bevor wir wechseln
  if (config.freieTage?.[weekKey] && currentVariante >= 0 && currentVariante < VARIANTEN.length) {
    VARIANTEN[currentVariante] = Object.assign({}, config.freieTage[weekKey]);
  }

  // Neue Variante laden
  currentVariante = Math.max(0, Math.min(VARIANTEN.length - 1, currentVariante + delta));
  if (!config.freieTage) config.freieTage = {};
  config.freieTage[weekKey] = Object.assign({}, VARIANTEN[currentVariante]);
  saveToStorage();

  renderWochenLabel();
  renderWochenplan();
  renderFreieTage();
  renderWocheStatus();
  renderFreiStatus();
}

// ── Diese Woche ─────────────────────────────────────────
function goToThisWeek() {
  currentMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());
  VARIANTEN.splice(0, VARIANTEN.length);
  currentVariante = 0;
  renderAll();
}
