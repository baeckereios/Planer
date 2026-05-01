// ── SchichtPlaner — Config & State ─────────────────────
// Kein localStorage für Konfigurationsdaten.
// Wahrheit kommt ausschließlich aus deployten Dateien:
//   schichtplaner_config.json  → Personen, Positionen, Einstellungen
//   urlaub_krank.js            → Fehlzeiten, Frühschicht, Feiertage
//   schichtplaene.js           → freieTage (genehmigte Wochen)
//
// localStorage wird nur noch für Session-Planungsdaten genutzt:
// freieTage (laufende Woche), manuelleZuweisungen, planAenderungen —
// nur auf diesem Gerät bis zum nächsten Genehmigen.

// ── Konstanten ──────────────────────────────────────────
const TAGE_NAMEN_LANG = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'];
const TAGE_NAMEN_KURZ = ['Mo','Di','Mi','Do','Fr','Sa'];
const SESSION_KEY = 'sp_session_v1';

// ── State ───────────────────────────────────────────────
let config = null;
let currentMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());

// ── Session-Daten ────────────────────────────────────────
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch(e) { return {}; }
}

function saveSession() {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      freieTage:            config.freieTage            || {},
      freieTage2:           config.freieTage2           || {},
      manuelleZuweisungen:  config.manuelleZuweisungen  || {},
      planAenderungen:      config.planAenderungen      || [],
      feiertagsWocheConfig: config.feiertagsWocheConfig || {},
      ...anpassungen
    }));
  } catch(e) { console.warn('Session-Speichern fehlgeschlagen:', e); }
}

// Legacy-Cleanup
(function() {
  ['schichtplaner_v1','fluss_config_v1'].forEach(k => {
    if (localStorage.getItem(k)) {
      console.log('SchichtPlaner: Legacy-Key', k, 'entfernt');
      localStorage.removeItem(k);
    }
  });
})();

// ── Config laden ─────────────────────────────────────────
async function loadConfig() {
  const session = loadSession();

  // Migration: alte freieTage-Keys ohne Schicht-Präfix → nacht_*
  if (session.freieTage) {
    const m = {};
    Object.entries(session.freieTage).forEach(([k, v]) => {
      m[/^\d{4}-W\d{1,2}$/.test(k) ? ('nacht_' + k) : k] = v;
    });
    session.freieTage = m;
  }

  // ── Externe JS-Dateien dynamisch laden (Pfad-Fallback) ──────
  async function _ladeScript(name, pfade) {
    for (const pfad of pfade) {
      try {
        const r = await fetch(pfad, { cache: 'no-store' });
        if (!r.ok) continue;
        const text = await r.text();
        // Script in globalem Kontext ausführen
        const el = document.createElement('script');
        el.textContent = text;
        document.head.appendChild(el);
        console.log('BäckereiOS:', name, 'geladen von', pfad);
        return true;
      } catch(e) {}
    }
    console.warn('BäckereiOS:', name, 'nicht gefunden');
    return false;
  }

  if (!window.BOS_FEIERTAGE) {
    await _ladeScript('feiertage_nds.js', [
      '../../feiertage_nds.js', '../../../feiertage_nds.js',
      '../feiertage_nds.js', '/feiertage_nds.js', '/main/feiertage_nds.js'
    ]);
  }
  if (!window.BOS_FEHLZEITEN) {
    await _ladeScript('urlaub_krank.js', [
      '../urlaub_krank.js', '../../urlaub_krank.js',
      './urlaub_krank.js', '/urlaub_krank.js', '/main/O/urlaub_krank.js'
    ]);
  }

  // Pfad-Fallback: verschiedene relative Pfade je nach Ordnertiefe versuchen
  // Pfade in Reihenfolge versuchen — erster erfolgreicher Treffer gewinnt
  const CONFIG_PATHS = [
    '../schichtplaner_config.json',
    './schichtplaner_config.json',
    '../../schichtplaner_config.json',
    '../../../schichtplaner_config.json',
    '/schichtplaner_config.json',
    '/main/O/schichtplaner_config.json',
    '/main/schichtplaner_config.json'
  ];

  let json = null;
  for (const path of CONFIG_PATHS) {
    try {
      const r = await fetch(path, { cache: 'no-store' });
      if (r.ok) {
        const text = await r.text();
        json = JSON.parse(text.replace(/^\uFEFF/, '')); // BOM entfernen
        console.log('SchichtPlaner: Config geladen von', path);
        break;
      } else {
        console.log('SchichtPlaner: Pfad', path, '→ HTTP', r.status);
      }
    } catch(e) {
      console.log('SchichtPlaner: Pfad', path, '→ Fehler:', e.message);
    }
  }

  if (!json) {
    console.error('SchichtPlaner: schichtplaner_config.json nicht gefunden. Geprüft:', CONFIG_PATHS);
    // Manueller Lade-Fallback — User kann Datei selbst auswählen
    await new Promise(resolve => {
      setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.id = 'configFehlerOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;display:flex;align-items:center;justify-content:center';
        overlay.innerHTML = `<div style="background:white;border-radius:14px;padding:24px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.3)">
          <div style="font-size:28px;margin-bottom:8px">⚠️</div>
          <div style="font-weight:700;font-size:16px;color:#a03030;margin-bottom:8px">Config nicht gefunden</div>
          <div style="font-size:12px;color:#666;margin-bottom:16px;line-height:1.5">
            <strong>schichtplaner_config.json</strong> konnte nicht geladen werden.<br>
            Bitte Datei aus dem Root-Ordner auswählen.
          </div>
          <label style="display:inline-flex;align-items:center;gap:8px;background:#b8790a;color:white;border-radius:8px;padding:10px 18px;cursor:pointer;font-weight:700;font-size:14px">
            <span>📂 Datei auswählen</span>
            <input type="file" accept=".json" style="display:none" id="configJsonInput">
          </label>
        </div>`;
        document.body.appendChild(overlay);

        document.getElementById('configJsonInput').onchange = async e => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            json = JSON.parse(text);
            overlay.remove();
            resolve();
          } catch(err) {
            alert('JSON-Fehler: ' + err.message);
          }
        };
      }, 100);
    });
  }

  try {
    config = {
      // Stammdaten aus JSON
      positionen:              json.positionen || [],
      personen:                json.personen   || [],
      joker:                   json.joker      || '',
      azubiGesperrteAttribute: json.azubiGesperrteAttribute || ['versand'],
      // urlaub: entfernt — Wahrheit liegt in urlaub_krank.js (BOS_FEHLZEITEN)
      tagGewichte:             json.tagGewichte || { montag:0, dienstag:0, mittwoch:0, donnerstag:0, freitag:0, samstag:0 },
      wunschGewicht:           json.wunschGewicht      ?? 1.5,
      wunschBasisBonus:        json.wunschBasisBonus   ?? 3,
      wunschAbschwaecher:      json.wunschAbschwaecher ?? 0.5,
      fruehschichtFreitagAnheften:
        window.BOS_FRUEHSCHICHT?.freierTagAnheften !== undefined
          ? window.BOS_FRUEHSCHICHT.freierTagAnheften
          : (json.fruehschichtFreitagAnheften !== false),

      // Mutable Daten aus urlaub_krank.js
      fehlzeiten:            window.BOS_FEHLZEITEN               || json.fehlzeiten           || [],
      fruehschichtEinsaetze: window.BOS_FRUEHSCHICHT?.einsaetze  || json.fruehschichtEinsaetze || [],
      feiertagsConfig:       window.BOS_FEIERTAGE                || {},

      // Session-Daten
      freieTage:            session.freieTage            || {},
      freieTage2:           session.freieTage2           || {},
      manuelleZuweisungen:  session.manuelleZuweisungen  || {},
      planAenderungen:      session.planAenderungen      || [],
      feiertagsWocheConfig: session.feiertagsWocheConfig || {}
    };
  } catch(e) {
    console.error('schichtplaner_config.json nicht erreichbar:', e);
    config = {
      positionen: [], personen: [], joker: '',
      azubiGesperrteAttribute: ['versand'], urlaub: {},
      tagGewichte: {}, wunschGewicht: 1.5, wunschBasisBonus: 3,
      wunschAbschwaecher: 0.5, fruehschichtFreitagAnheften: true,
      fehlzeiten: [], fruehschichtEinsaetze: [], feiertagsConfig: {},
      freieTage:            session.freieTage            || {},
      freieTage2:           session.freieTage2           || {},
      manuelleZuweisungen:  session.manuelleZuweisungen  || {},
      planAenderungen:      session.planAenderungen      || [],
      feiertagsWocheConfig: session.feiertagsWocheConfig || {}
    };
  }

  // genehmigte Wochen aus schichtplaene.js einmergen
  if (window.BOS_SCHICHTPLAENE) {
    Object.entries(window.BOS_SCHICHTPLAENE).forEach(([wk, daten]) => {
      if (!config.freieTage[wk]) config.freieTage[wk] = { ...daten };
    });
  }

  // Personen/Positionen intern spiegeln und filtern
  config._allPersonen   = [...config.personen];
  config._allPositionen = [...config.positionen];
  _applySchichtFilter();
  // freiTageAnpassung_* aus Session laden
  Object.keys(session).forEach(k => {
    if (k.startsWith('freiTageAnpassung_')) config[k] = session[k];
  });
}

// saveToStorage → Alias für saveSession
function saveToStorage() { saveSession(); }

// ── Plan-Änderungsprotokoll ──────────────────────────────
function logAenderung(datum, posId, grund) {
  if (!config.planAenderungen) config.planAenderungen = [];
  config.planAenderungen = config.planAenderungen.filter(
    e => !(e.datum === datum && e.posId === posId)
  );
  config.planAenderungen.push({
    datum, posId, zeitstempel: new Date().toISOString(),
    grund: grund || 'Manuell geändert'
  });
  const grenzeISO = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
  config.planAenderungen = config.planAenderungen.filter(e => e.datum >= grenzeISO);
  saveSession();
}

// ═══════════════════════════════════════════════════════
// ── Schicht & Varianten State ───────────────────────────
// ═══════════════════════════════════════════════════════

let currentSchicht = localStorage.getItem('sp_schicht') || 'nacht';
let currentVariante = 0;
const VARIANTEN = [];

// ── Hilfsfunktionen ──────────────────────────────────────
function weekKeyToMonday(weekKey) {
  const base = FLUSS_LOGIK.getMondayOfWeek(new Date());
  for (let d = -52; d <= 52; d++) {
    const c = new Date(base);
    c.setDate(base.getDate() + d * 7);
    if (FLUSS_LOGIK.getWeekKey(c) === weekKey) return c;
  }
  return base;
}

function getSchichtWeekKey(monday) {
  return currentSchicht + '_' + FLUSS_LOGIK.getWeekKey(monday || currentMonday);
}

function getFreieTageForFluss() {
  const prefix = currentSchicht + '_';
  const result = {};
  Object.entries(config.freieTage || {}).forEach(([k, v]) => {
    if (k.startsWith(prefix)) result[k.slice(prefix.length)] = v;
  });
  return result;
}

function configForFluss() {
  // custom fruehschichtEinsaetze für zweite freie Tage sind bereits in config
  const ft = getFreieTageForFluss();

  // Feiertags-Logik
  const fwConfig = config.feiertagsWocheConfig || {};
  let positionen = config.positionen || [];
  const wocheTage = (FLUSS_LOGIK.getWeekDates && currentMonday)
    ? FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d))
    : [];

  if (fwConfig.datum && wocheTage.includes(fwConfig.datum)) {
    const feiertagsWochentag = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'][wocheTage.indexOf(fwConfig.datum)];

    if (!fwConfig.offen) {
      // Geschlossen: alle Positionen sperren
      positionen = positionen.map(p => ({
        ...p,
        gesperrtAm: [...(p.gesperrtAm || []), feiertagsWochentag]
      }));
    }

    // Offen oder geschlossen: Personen die NICHT als Feiertags-Arbeiter markiert sind
    // bekommen den Feiertag als Sperrtag (inkl. Azubi)
    const feiertagsArbeiter = fwConfig.feiertagsArbeiter || [];
    const personen = config.personen || [];
    const gesperrtePersonen = personen
      .filter(p => !feiertagsArbeiter.includes(p.id))
      .map(p => p.id);

    // Als custom fruehschichtEinsatz für diesen Tag eintragen
    config.fruehschichtEinsaetze = (config.fruehschichtEinsaetze || [])
      .filter(e => !(e._feiertagSperrTag === fwConfig.datum));
    gesperrtePersonen.forEach(personId => {
      config.fruehschichtEinsaetze.push({
        personId,
        block: 'custom',
        tage: [feiertagsWochentag],
        von: fwConfig.datum,
        bis: fwConfig.datum,
        _feiertagSperrTag: fwConfig.datum,
        _autogeneriert: true
      });
    });
  }

  return { ...config, positionen, freieTage: ft };
}

function _applySchichtFilter() {
  if (!config._allPersonen) return;
  config.personen = config._allPersonen.filter(p => {
    const s = (p.stammschicht || 'nacht').toLowerCase().trim();
    if (s === 'azubi') return currentSchicht === 'nacht';
    return s === currentSchicht;
  });
  config.positionen = config._allPositionen.filter(p => {
    // Kein schicht-Feld → gilt für Nachtschicht und als beide
    if (!p.schicht) return true; // kein schicht-Feld → gilt für alle Schichten
    const s = p.schicht.toLowerCase().trim();
    return s === currentSchicht || s === 'beide';
  });
}

// ── Navigation ───────────────────────────────────────────
function selectKW(weekKey) {
  currentMonday = weekKeyToMonday(weekKey);
  VARIANTEN.splice(0, VARIANTEN.length);
  currentVariante = 0;
  renderAll();
}

function selectSchicht(schicht) {
  currentSchicht = schicht;
  localStorage.setItem('sp_schicht', schicht);
  _applySchichtFilter();
  VARIANTEN.splice(0, VARIANTEN.length);
  currentVariante = 0;
  renderAll();
}

function goToThisWeek() {
  currentMonday = FLUSS_LOGIK.getMondayOfWeek(new Date());
  VARIANTEN.splice(0, VARIANTEN.length);
  currentVariante = 0;
  renderAll();
}

// ── Variante navigieren ──────────────────────────────────
function changeVariante(delta) {
  if (VARIANTEN.length <= 1) return;

  const schichtWK = getSchichtWeekKey();
  const weekDates = FLUSS_LOGIK.getWeekDates(currentMonday).map(d => FLUSS_LOGIK.dateToISO(d));

  // Aktuelle Variante sichern
  if (currentVariante >= 0 && currentVariante < VARIANTEN.length) {
    VARIANTEN[currentVariante] = {
      freieTage: Object.assign({}, config.freieTage?.[schichtWK] || {}),
      manuelleZuweisungen: Object.fromEntries(
        weekDates.filter(d => config.manuelleZuweisungen?.[d])
                 .map(d => [d, Object.assign({}, config.manuelleZuweisungen[d])])
      )
    };
  }

  currentVariante = Math.max(0, Math.min(VARIANTEN.length - 1, currentVariante + delta));
  const nv = VARIANTEN[currentVariante];

  if (!config.freieTage) config.freieTage = {};
  config.freieTage[schichtWK] = Object.assign({}, nv.freieTage || {});

  if (!config.manuelleZuweisungen) config.manuelleZuweisungen = {};
  weekDates.forEach(d => delete config.manuelleZuweisungen[d]);
  Object.entries(nv.manuelleZuweisungen || {}).forEach(([d, v]) => {
    config.manuelleZuweisungen[d] = Object.assign({}, v);
  });

  saveSession();
  renderWochenLabel();
  renderWochenplan();
  renderFreieTage();
  renderWocheStatus();
  renderFreiStatus();
}
