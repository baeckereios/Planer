// ============================================================
//  durchschnittsverbrauch_gehirn.js
//  BäckereiOS – Durchschnittsverbrauch-Logik
//
//  Produktkonfiguration wird zur Laufzeit aus
//  ../produkt_config.json geladen.
//
//  Unterstützt zwei DB-Formate:
//    - Alt (vor 11.03.2026): snake_case Keys mit _stueck-Suffix
//    - Neu (ab 11.03.2026):  Klartext-Produktname direkt
// ============================================================

'use strict';

// ── Konfiguration laden ────────────────────────────────────
let PRODUKT_CONFIG  = [];   // Array der Einträge aus JSON
let LEGACY_MAP      = {};   // { legacyKey: klartext_name }
let ERLAUBTE_KEYS   = new Set();
let EINSTELLUNGEN   = {};   // { klartext_name: { charge, kategorie } }
let KATEGORIEN      = {};   // { kategorie: [klartext_name, ...] }
let configGeladen   = false;

async function ladeProduktConfig() {
  if (configGeladen) return;
  try {
    const res  = await fetch('../produkt_config.json', { cache: 'no-store' });
    const data = await res.json();
    PRODUKT_CONFIG = data;

    LEGACY_MAP    = {};
    ERLAUBTE_KEYS = new Set();
    EINSTELLUNGEN = {};
    KATEGORIEN    = {};

    for (const p of data) {
      const name = p.name;
      ERLAUBTE_KEYS.add(name);
      EINSTELLUNGEN[name] = { charge: p.charge, kategorie: p.kategorie };

      if (!KATEGORIEN[p.kategorie]) KATEGORIEN[p.kategorie] = [];
      KATEGORIEN[p.kategorie].push(name);

      if (p.legacyKey) {
        LEGACY_MAP[p.legacyKey] = name;
      }
    }

    configGeladen = true;
  } catch (err) {
    console.error('Fehler beim Laden der Produktkonfiguration:', err);
  }
}

// ── Key-Normalisierung ─────────────────────────────────────
// Wandelt beliebige DB-Keys in kanonische Klartext-Namen um.
function normalisiereKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return null;

  // _bleche-Suffix → ignorieren
  if (rawKey.endsWith('_bleche')) return null;

  // Schon ein Klartext-Name?
  if (ERLAUBTE_KEYS.has(rawKey)) return rawKey;

  // Legacy-Mapping versuchen
  const gemappt = LEGACY_MAP[rawKey];
  if (gemappt) return gemappt;

  // Altes Format mit _stueck-Suffix ohne Mapping → null (unbekannt)
  if (rawKey.endsWith('_stueck')) return null;

  // Unbekannter Key → null
  return null;
}

// ── Anzeigename ────────────────────────────────────────────
function bereinigeAnzeigeName(name) {
  // Neue Keys sind bereits gut lesbar
  return name;
}

// ── Daten berechnen ────────────────────────────────────────
function berechneTagesdurchschnitte(dbEintraege, optionen = {}) {
  const {
    maxTage       = 14,
    nurWochentage = null,   // null = alle, sonst Array [0-6] (0=So)
  } = optionen;

  // Einträge sortieren und ggf. begrenzen
  const sortiert = [...dbEintraege].sort((a, b) => b.datum.localeCompare(a.datum));
  const gefiltert = nurWochentage
    ? sortiert.filter(e => {
        const d = new Date(e.datum);
        return nurWochentage.includes(d.getDay());
      })
    : sortiert;

  const begrenzt = maxTage > 0 ? gefiltert.slice(0, maxTage) : gefiltert;

  // Pro Produkt: alle Bleche-Werte sammeln
  const produktDaten = {};   // { name: { werte: [bleche, ...], tage: n } }

  for (const eintrag of begrenzt) {
    for (const [rawKey, wert] of Object.entries(eintrag)) {
      if (rawKey === 'datum') continue;

      const name = normalisiereKey(rawKey);
      if (!name) continue;

      if (!produktDaten[name]) produktDaten[name] = { werte: [], n: 0 };
      produktDaten[name].werte.push(Number(wert) || 0);
      produktDaten[name].n++;
    }
  }

  // Durchschnitte berechnen
  const ergebnis = {};
  for (const [name, data] of Object.entries(produktDaten)) {
    const summe = data.werte.reduce((s, v) => s + v, 0);
    ergebnis[name] = {
      durchschnittBleche: summe / data.n,
      n:                  data.n,
      einstellung:        EINSTELLUNGEN[name] || { charge: 1, kategorie: 'Unbekannt' },
    };
  }

  return ergebnis;
}

// ── Pro-Wochentag-Durchschnitte ────────────────────────────
function berechneWochentagDurchschnitte(dbEintraege, maxTage = 0) {
  const wochentage = [0, 1, 2, 3, 4, 5, 6]; // So=0 … Sa=6
  const result = {};

  for (const wt of wochentage) {
    result[wt] = berechneTagesdurchschnitte(dbEintraege, {
      maxTage,
      nurWochentage: [wt],
    });
  }
  return result;
}

// ── Kategorien-Struktur für Ausgabe ───────────────────────
function getKategorienStruktur() {
  return KATEGORIEN;
}

function getEinstellungen() {
  return EINSTELLUNGEN;
}

function getProduktConfig() {
  return PRODUKT_CONFIG;
}

// ── Exports ────────────────────────────────────────────────
export {
  ladeProduktConfig,
  normalisiereKey,
  bereinigeAnzeigeName,
  berechneTagesdurchschnitte,
  berechneWochentagDurchschnitte,
  getKategorienStruktur,
  getEinstellungen,
  getProduktConfig,
};
