const FALLBACK_CONFIG = [
  {
    "artNr": "111000",
    "name": "Schrippen GESAMT",
    "kategorie": "Brötchen",
    "charge": 28,
    "legacyKey": "schrippen_gesamt_stueck",
    "hinweis": null
  },
  {
    "artNr": "111002",
    "name": "Schrippen Teiglinge",
    "kategorie": "Brötchen",
    "charge": 16,
    "legacyKey": "schrippen_teiglinge_stueck",
    "hinweis": null
  },
  {
    "artNr": "111003",
    "name": "Schrippen Teiglinge gefroren",
    "kategorie": "Brötchen",
    "charge": 16,
    "legacyKey": "schrippen_teiglinge_gefroren_stueck",
    "hinweis": null
  },
  {
    "artNr": "111010",
    "name": "Hasenberger",
    "kategorie": "Brötchen",
    "charge": 20,
    "legacyKey": "hasenberger_stueck",
    "hinweis": null
  },
  {
    "artNr": "111030",
    "name": "Käsebrötchen",
    "kategorie": "Brötchen",
    "charge": 20,
    "legacyKey": "kaesebroetchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "112001",
    "name": "Kornknacker",
    "kategorie": "Brötchen",
    "charge": 25,
    "legacyKey": "kornknacker_stueck",
    "hinweis": null
  },
  {
    "artNr": "114120",
    "name": "Dinkel-Zwerg süß",
    "kategorie": "Brötchen",
    "charge": 25,
    "legacyKey": "dinkel_zwerg_stueck",
    "hinweis": null
  },
  {
    "artNr": "115001",
    "name": "Laugenstangen",
    "kategorie": "Brötchen",
    "charge": 18,
    "legacyKey": "laugenstangen_stueck",
    "hinweis": null
  },
  {
    "artNr": "115009",
    "name": "Laugenecken GESAMT",
    "kategorie": "Brötchen",
    "charge": 15,
    "legacyKey": "laugenecken_gesamt_stueck",
    "hinweis": null
  },
  {
    "artNr": "116001",
    "name": "Rosinen-Hedwig",
    "kategorie": "Brötchen",
    "charge": 20,
    "legacyKey": "rosinen_hedwig_stueck",
    "hinweis": null
  },
  {
    "artNr": "116003",
    "name": "Hasenpfötchen",
    "kategorie": "Brötchen",
    "charge": 20,
    "legacyKey": "hasenpfoetchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "116004",
    "name": "Rosinen-Batzen",
    "kategorie": "Brötchen",
    "charge": 12,
    "legacyKey": "rosinen_batzen_stueck",
    "hinweis": null
  },
  {
    "artNr": "116005",
    "name": "Schoko-Batzen",
    "kategorie": "Brötchen",
    "charge": 12,
    "legacyKey": "schoko_batzen_stueck",
    "hinweis": null
  },
  {
    "artNr": "116009",
    "name": "Zimt-Wölkchen",
    "kategorie": "Brötchen",
    "charge": 14,
    "legacyKey": "zimt_woelkchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "116011",
    "name": "Butter-Croissant",
    "kategorie": "Brötchen",
    "charge": 16,
    "legacyKey": "butter_croissant_stueck",
    "hinweis": null
  },
  {
    "artNr": "116012",
    "name": "Schoko-Croissant",
    "kategorie": "Brötchen",
    "charge": 20,
    "legacyKey": "schoko_croissant_stueck",
    "hinweis": null
  },
  {
    "artNr": "116020",
    "name": "Mini-Croissant",
    "kategorie": "Brötchen",
    "charge": 30,
    "legacyKey": "mini_croissant_stueck",
    "hinweis": null
  },
  {
    "artNr": "116022",
    "name": "Mini-Schoko-Croissant",
    "kategorie": "Brötchen",
    "charge": 30,
    "legacyKey": "mini_schoko_croissant_stueck",
    "hinweis": null
  },
  {
    "artNr": null,
    "name": "Schlawiner GESAMT",
    "kategorie": "Brötchen",
    "charge": 48,
    "legacyKey": "schlawiner_gesamt_stueck",
    "hinweis": "ArtNr unbekannt – bitte nachtragen"
  },
  {
    "artNr": "121001",
    "name": "Korbgerster 1250g",
    "kategorie": "Brot",
    "charge": 15,
    "legacyKey": "korbgerster_1250g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121002",
    "name": "Korbgerster 750g",
    "kategorie": "Brot",
    "charge": 18,
    "legacyKey": "korbgerster_750g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121005",
    "name": "Gersterbrot 1250g",
    "kategorie": "Brot",
    "charge": 4,
    "legacyKey": "gersterbrot_1250g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121010",
    "name": "Bergsteiger 750g",
    "kategorie": "Brot",
    "charge": 12,
    "legacyKey": "bergsteiger_750g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121011",
    "name": "Findling 500g",
    "kategorie": "Brot",
    "charge": 20,
    "legacyKey": "findling_500g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121012",
    "name": "Findling 250g",
    "kategorie": "Brot",
    "charge": 25,
    "legacyKey": "findling_250g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121015",
    "name": "Krosses Herri 750g Bierbrot",
    "kategorie": "Brot",
    "charge": 15,
    "legacyKey": "krosses_herri_750g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121020",
    "name": "Havelser Urbrot 1000g",
    "kategorie": "Brot",
    "charge": 15,
    "legacyKey": null,
    "hinweis": "nur Samstag"
  },
  {
    "artNr": "121030",
    "name": "Schwarzbrot 750g",
    "kategorie": "Brot",
    "charge": 3,
    "legacyKey": "schwarzbrot_750g_stueck",
    "hinweis": null
  },
  {
    "artNr": "121060",
    "name": "Zwiebelbrot 500g",
    "kategorie": "Brot",
    "charge": 1,
    "legacyKey": "zwiebelbrot_500g_stueck",
    "hinweis": null
  },
  {
    "artNr": "122001",
    "name": "Sovitalbrot 500g",
    "kategorie": "Brot",
    "charge": 3,
    "legacyKey": "sovitalbrot_500g_stueck",
    "hinweis": null
  },
  {
    "artNr": "122004",
    "name": "Erntebrot 750g",
    "kategorie": "Brot",
    "charge": 5,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "122005",
    "name": "Vollkornbrot 750g",
    "kategorie": "Brot",
    "charge": 4,
    "legacyKey": "vollkornbrot_750g_stueck",
    "hinweis": null
  },
  {
    "artNr": "122006",
    "name": "Feines Vollkorn 500g",
    "kategorie": "Brot",
    "charge": 8,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "124001",
    "name": "Schwabenbrot 500g",
    "kategorie": "Brot",
    "charge": 8,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "124002",
    "name": "Dinkel-Gerster 750g",
    "kategorie": "Brot",
    "charge": 4,
    "legacyKey": "dinkel_gerster_750g_stueck",
    "hinweis": null
  },
  {
    "artNr": "124003",
    "name": "Dinkel-Joghurt-Brot 500g",
    "kategorie": "Brot",
    "charge": 4,
    "legacyKey": "dinkel_joghurt_brot_stueck",
    "hinweis": null
  },
  {
    "artNr": "124005",
    "name": "Kamut-Kruste",
    "kategorie": "Brot",
    "charge": 4,
    "legacyKey": "kamut_kruste_stueck",
    "hinweis": null
  },
  {
    "artNr": "126000",
    "name": "Stangen Gesamt",
    "kategorie": "Brot",
    "charge": 6,
    "legacyKey": "stangen_gesamt_stueck",
    "hinweis": null
  },
  {
    "artNr": "126002",
    "name": "Baguettestange Teig (3)",
    "kategorie": "Brot",
    "charge": 3,
    "legacyKey": "baguettestange_teig_stueck",
    "hinweis": null
  },
  {
    "artNr": "126006",
    "name": "L'amourette 250g",
    "kategorie": "Brot",
    "charge": 6,
    "legacyKey": "lamourette_250g_stueck",
    "hinweis": null
  },
  {
    "artNr": "126008",
    "name": "Sonderbestellung Baguette 20-22cm",
    "kategorie": "Brot",
    "charge": 1,
    "legacyKey": null,
    "hinweis": "Kundenbestellung Henri 2"
  },
  {
    "artNr": "126010",
    "name": "Zwiebelstange",
    "kategorie": "Brot",
    "charge": 6,
    "legacyKey": "zwiebelstange_stueck",
    "hinweis": null
  },
  {
    "artNr": "126011",
    "name": "Zwiebelstange Teig",
    "kategorie": "Brot",
    "charge": 3,
    "legacyKey": "zwiebelstange_teig_stueck",
    "hinweis": null
  },
  {
    "artNr": "126050",
    "name": "Kastenweißbrot 450g",
    "kategorie": "Brot",
    "charge": 4,
    "legacyKey": "kastenweissbrot_stueck",
    "hinweis": null
  },
  {
    "artNr": "131001",
    "name": "Käsekuchen",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": "kaesekuchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "131005",
    "name": "Carrot Cheesecake (nur Henri)",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": null,
    "hinweis": "nur Henri"
  },
  {
    "artNr": "131113",
    "name": "Bienenstich gefüllt (20er)",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "131200",
    "name": "Orangen-Joghurt-Schnitte",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": null,
    "hinweis": "nur Samstag"
  },
  {
    "artNr": "133001",
    "name": "Oma Herta's Zuckerkuchen Stück 1/6",
    "kategorie": "Konditorei",
    "charge": 6,
    "legacyKey": "zuckerkuchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "133006",
    "name": "Streuselkuchen Stück 1/6",
    "kategorie": "Konditorei",
    "charge": 6,
    "legacyKey": "streuselkuchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "133010",
    "name": "Bienenstich Stück 1/6",
    "kategorie": "Konditorei",
    "charge": 6,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "133112",
    "name": "Sandkuchen Eierlikör Stück",
    "kategorie": "Konditorei",
    "charge": 12,
    "legacyKey": null,
    "hinweis": "saisonal"
  },
  {
    "artNr": "133150",
    "name": "Brownie",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "133200",
    "name": "Dinkel-Apfelkuchen",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": "dinkel_apfelkuchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "133202",
    "name": "Dinkel-Rüblikuchen",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": "dinkel_rueblikuchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "133211",
    "name": "Veganer Himbeerkuchen",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": "veganer_himbeerkuchen_stueck",
    "hinweis": null
  },
  {
    "artNr": "133212",
    "name": "Dinkel-Fruchtkuchen Vegan (Nur Henri)",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": null,
    "hinweis": "nur Henri"
  },
  {
    "artNr": "133250",
    "name": "Wchd. Frucht",
    "kategorie": "Konditorei",
    "charge": 1,
    "legacyKey": null,
    "hinweis": "wechselnde Frucht, nur Fr"
  },
  {
    "artNr": "133300",
    "name": "Schnecken",
    "kategorie": "Konditorei",
    "charge": 14,
    "legacyKey": "schnecken_stueck",
    "hinweis": null
  },
  {
    "artNr": "134001",
    "name": "Amis",
    "kategorie": "Konditorei",
    "charge": 20,
    "legacyKey": "amis_stueck",
    "hinweis": null
  },
  {
    "artNr": "134002",
    "name": "Plunderstreifen",
    "kategorie": "Konditorei",
    "charge": 16,
    "legacyKey": "plunderstreifen_stueck",
    "hinweis": null
  },
  {
    "artNr": "134006",
    "name": "Puddingbrezel",
    "kategorie": "Konditorei",
    "charge": 16,
    "legacyKey": "puddingbrezel_stueck",
    "hinweis": null
  },
  {
    "artNr": "134035",
    "name": "vegange Plunderschiffe",
    "kategorie": "Konditorei",
    "charge": 1,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "134041",
    "name": "Eiszapfen",
    "kategorie": "Konditorei",
    "charge": 1,
    "legacyKey": "eiszapfen_stueck",
    "hinweis": "alle 2 Tage"
  },
  {
    "artNr": "137031",
    "name": "Käse.Mohn.To. geb. Stü",
    "kategorie": "Konditorei",
    "charge": 12,
    "legacyKey": "kaese_mohn_to_stueck",
    "hinweis": null
  },
  {
    "artNr": "360005",
    "name": "Dinkel-Waffel Teig",
    "kategorie": "Konditorei",
    "charge": 1,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "135001",
    "name": "Donuts",
    "kategorie": "Fettgebäck",
    "charge": 1,
    "legacyKey": "donuts_stueck",
    "hinweis": null
  },
  {
    "artNr": "135009",
    "name": "Krapfen GESAMT",
    "kategorie": "Fettgebäck",
    "charge": 48,
    "legacyKey": "krapfen_gesamt_stueck",
    "hinweis": null
  },
  {
    "artNr": "135030",
    "name": "Quarkinis",
    "kategorie": "Fettgebäck",
    "charge": 1,
    "legacyKey": "quarkinis_stueck",
    "hinweis": null
  },
  {
    "artNr": "151035",
    "name": "Dinkel-Blootz",
    "kategorie": "Snack",
    "charge": 1,
    "legacyKey": null,
    "hinweis": null
  },
  {
    "artNr": "151036",
    "name": "Dinkel Blootz medi",
    "kategorie": "Snack",
    "charge": 1,
    "legacyKey": null,
    "hinweis": null
  }
];

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
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    if (!text.trim().startsWith('[')) throw new Error('Kein gültiges JSON');
    const data = JSON.parse(text);
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
    _setzeLegacyGlobals();
  } catch (err) {
    console.warn('produkt_config.json nicht verfügbar, nutze Fallback:', err.message);
    // Fallback: eingebettete Konfiguration verwenden
    PRODUKT_CONFIG = FALLBACK_CONFIG;
    for (const p of FALLBACK_CONFIG) {
      const name = p.name;
      ERLAUBTE_KEYS.add(name);
      EINSTELLUNGEN[name] = { charge: p.charge, kategorie: p.kategorie };
      if (!KATEGORIEN[p.kategorie]) KATEGORIEN[p.kategorie] = [];
      KATEGORIEN[p.kategorie].push(name);
      if (p.legacyKey) LEGACY_MAP[p.legacyKey] = name;
    }
    configGeladen = true;
    _setzeLegacyGlobals();
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
    // Neues DB-Format: Produkte stecken in eintrag.produkte
    const quell = eintrag.produkte || eintrag;
    for (const [rawKey, wert] of Object.entries(quell)) {
      // Nur _stueck-Keys lesen, _bleche überspringen (werden selbst berechnet)
      if (rawKey.endsWith('_bleche')) continue;

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

// ── Globale Exposition (kein ES6-Modul) ────────────────────
// Alle Funktionen und Daten sind direkt als window.* verfügbar.
// Außerdem werden Legacy-kompatible Variablennamen gesetzt sobald
// ladeProduktConfig() abgeschlossen ist.

window.BOS_GEHIRN = {
  ladeProduktConfig,
  normalisiereKey,
  bereinigeAnzeigeName,
  berechneTagesdurchschnitte,
  berechneWochentagDurchschnitte,
  getKategorienStruktur,
  getEinstellungen,
  getProduktConfig,
};

// Legacy-Variablen für alten Logbuch-Code — werden nach ladeProduktConfig() befüllt
function _setzeLegacyGlobals() {
  window.erlaubteProdukte     = [...ERLAUBTE_KEYS];
  window.produktKategorien    = {};
  window.produktEinstellungen = {};
  // Reihenfolge exakt wie in produkt_config.json — Groß/Kleinschreibung muss matchen
  window.kategorieReihenfolge = ['Brötchen','Brot','Konditorei','Fettgebäck','Snack'];

  for (const [kat, produkte] of Object.entries(KATEGORIEN)) {
    for (const name of produkte) {
      window.produktKategorien[name] = kat; // Original-Schreibweise behalten
    }
  }
  for (const [name, einst] of Object.entries(EINSTELLUNGEN)) {
    window.produktEinstellungen[name] = {
      stueckProBlech: einst.charge || 1,
      einheit:        'stueck',
      kategorie:      einst.kategorie || '',
    };
  }
  // bereinigeAnzeigeName global verfügbar machen
  window.bereinigeAnzeigeName = bereinigeAnzeigeName;
}
