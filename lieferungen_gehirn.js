/**
 * lieferungen_gehirn.js
 * Berechnungslogik für lieferanten_auswertung.html
 *
 * Liest:
 *   lieferanten_config.json       — Produkte + Flags + Liefertage
 *   lieferanten_db.json           — Eingänge + Ausgänge Filialen
 *   lieferanten_bestand_db.json   — Inventur-Snapshots
 *   backmengen_db.json            — Backstube-Produktion (Bleche)
 *   produkt_config.json           — Charge-Größen
 *
 * Schreibt nichts. Nur Lesen + Berechnen.
 */

// ── WOCHENTAG-HILFSFUNKTION ──────────────────────────────
// Mo=0 … So=6  (wie in lieferanten_config gespeichert)
// JS getDay() gibt So=0 … Sa=6 zurück → Umrechnung nötig
function getWochentagIndex(datum) {
  return (new Date(datum + 'T00:00:00').getDay() + 6) % 7;
}

var WT_VOLL = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

function getWochentagName(datum) {
  return WT_VOLL[getWochentagIndex(datum)];
}

// ── DATUM-VERGLEICH ──────────────────────────────────────
// Gibt true wenn datum strikt zwischen von (exkl.) und bis (exkl.) liegt
function zwischenDaten(datum, von, bis) {
  return datum > von && datum < bis;
}
// Gibt true wenn datum >= von und < bis
function imFenster(datum, von, bis) {
  return datum >= von && datum < bis;
}

// ── PRODUKT-CONFIG LOOKUP ────────────────────────────────
// Gibt charge-Größe für einen legacyKey zurück
// legacyKey z.B. "butter_croissant_stueck"
function getCharge(legacyKey, produktConfig) {
  if (!legacyKey) return null;
  var eintrag = produktConfig.find(function(p) {
    return p.legacyKey === legacyKey;
  });
  return eintrag ? (eintrag.charge || null) : null;
}

// ── WOCHENCONFIG-FENSTER AUSLESEN ────────────────────────
/**
 * Gibt { von: "YYYY-MM-DD", bis: "YYYY-MM-DD" } zurück
 * basierend auf wochenconfig.json (tage[0] bis tage[last]).
 * Wenn wochenconfig null/leer: gibt null zurück → alle Daten verwenden.
 */
function leseFenster(wochenconfig) {
  if (!wochenconfig || !wochenconfig.tage || !wochenconfig.tage.length) return null;
  var tage = wochenconfig.tage.slice().sort(function(a,b){return a.datum.localeCompare(b.datum);});
  return { von: tage[0].datum, bis: tage[tage.length-1].datum };
}

// ── KERN: BERECHNE ALLE INTERVALLE FÜR EIN PRODUKT ──────
/**
 * Gibt ein Array von Intervall-Objekten zurück.
 * Jedes Intervall = Zeitraum zwischen zwei aufeinanderfolgenden
 * Inventur-Snapshots für dieses Produkt.
 *
 * Intervall-Objekt:
 * {
 *   von:            "2026-03-25",   // Datum Snapshot A (inkl.)
 *   bis:            "2026-03-28",   // Datum Snapshot B (exkl.)
 *   wochentagVon:   "Dienstag",
 *   wochentagBis:   "Freitag",
 *   tage:           3,
 *   bestandVon:     5,              // Kartons bei Snapshot A
 *   bestandBis:     3,              // Kartons bei Snapshot B
 *   eingang:        6,              // Summe Eingänge im Zeitraum
 *   abgang_filialen: 5,             // Summe TK-Abgänge im Zeitraum (nur wenn lieferung_filiale)
 *   backstube:      1.6,            // Summe Backstube-Verbrauch in Kartons (nur wenn in_backstube_gebacken)
 *   verbrauch_inventur: 8,          // = bestandVon + eingang - bestandBis
 *   verbrauch_berechnet: 6.6,       // = abgang_filialen + backstube
 *   differenz:      1.4,            // = verbrauch_inventur - verbrauch_berechnet
 *   tagesdetail: [                  // Pro Tag im Intervall
 *     { datum, wochentag, abgang_filialen, backstube }
 *   ]
 * }
 */
function berechneIntervalle(produkt, lieferantenDb, bestandDb, backmengenDb, produktConfig, wochenconfig) {
  var id         = produkt.id;
  var pkKey      = produkt.produkt_config_key || '';
  var inhalt     = (produkt.gebinde && produkt.gebinde.inhalt_stueck) || 1;
  var charge     = getCharge(pkKey, produktConfig);
  var blechKey   = pkKey ? pkKey.replace('_stueck', '_bleche') : null;
  var stueckKey  = pkKey || null;

  // Snapshots bis Planungsstartdatum (wochenconfig.erstellt) filtern
  // Falls keine wochenconfig: alle Snapshots verwenden
  var bis = (wochenconfig && wochenconfig.erstellt) ? wochenconfig.erstellt : null;

  // Snapshots für dieses Produkt — chronologisch sortiert
  // Bei gesetztem bis-Datum: nur Snapshots bis zu diesem Datum (Planungsbasis)
  var snapshots = bestandDb
    .filter(function(s) {
      if (!s.bestaende || s.bestaende[id] === undefined) return false;
      if (!bis) return true;
      return s.datum <= bis;
    })
    .sort(function(a, b) { return a.datum.localeCompare(b.datum); });

  if (snapshots.length < 2) return [];

  var intervalle = [];

  for (var i = 0; i < snapshots.length - 1; i++) {
    var snapA = snapshots[i];
    var snapB = snapshots[i + 1];
    var vonDatum = snapA.datum;
    var bisDatum = snapB.datum;

    var bestandVon = snapA.bestaende[id] ? snapA.bestaende[id].menge : 0;
    var bestandBis = snapB.bestaende[id] ? snapB.bestaende[id].menge : 0;

    // ── EINGANG: alle Einträge typ=eingang zwischen den Snapshots ──
    var eingang = 0;
    lieferantenDb.forEach(function(e) {
      if (e.typ !== 'eingang') return;
      if (!imFenster(e.datum, vonDatum, bisDatum)) return;
      if (e.eintraege && e.eintraege[id] !== undefined) {
        eingang += e.eintraege[id].menge || 0;
      }
    });

    // ── TAGESDETAIL: für jeden Tag zwischen den Snapshots ──
    var tagesdetail = [];
    var tageDazwischen = getDatenZwischen(vonDatum, bisDatum, lieferantenDb, backmengenDb);

    tageDazwischen.forEach(function(datum) {
      var wt = getWochentagName(datum);

      // Abgang Filialen an diesem Tag
      var abgangTag = 0;
      if (produkt.lieferung_filiale) {
        lieferantenDb.forEach(function(e) {
          if (e.typ !== 'ausgang_filialen') return;
          if (e.datum !== datum) return;
          if (e.eintraege && e.eintraege[id] !== undefined) {
            abgangTag += e.eintraege[id].menge || 0;
          }
        });
      }

      // Backstube-Verbrauch an diesem Tag (Bleche → Kartons)
      var backstubeTag = 0;
      if (produkt.in_backstube_gebacken && blechKey && charge) {
        var backTag = backmengenDb.find(function(b) { return b.datum === datum; });
        if (backTag && backTag.produkte) {
          var bleche = backTag.produkte[blechKey];
          if (bleche !== undefined && bleche !== null) {
            // Bleche aufrunden, mit Charge multiplizieren, durch Gebinde-Inhalt teilen
            backstubeTag = Math.ceil(bleche) * charge / inhalt;
          }
        }
      }

      tagesdetail.push({
        datum:           datum,
        wochentag:       wt,
        wtIndex:         getWochentagIndex(datum),
        abgang_filialen: abgangTag,
        backstube:       backstubeTag
      });
    });

    // ── SUMMEN ──
    var abgangGesamt   = tagesdetail.reduce(function(s, t) { return s + t.abgang_filialen; }, 0);
    var backstubeGesamt = tagesdetail.reduce(function(s, t) { return s + t.backstube; }, 0);

    // Inventur-Verbrauch: was laut Zählung weggegangen ist
    var verbrauchInventur   = bestandVon + eingang - bestandBis;
    // Berechneter Verbrauch: was wir aus Zetteln kennen
    var verbrauchBerechnet  = abgangGesamt + backstubeGesamt;
    // Differenz: Inventur minus Berechnet = ungeklärter Schwund / Messfehler
    var differenz = verbrauchInventur - verbrauchBerechnet;

    // ── LABEL für Intervall (z.B. "Di → Fr") ──
    var labelVon = getWochentagName(vonDatum).substring(0, 2);
    var labelBis = getWochentagName(bisDatum).substring(0, 2);
    var tageAnzahl = tagesdetail.length;

    intervalle.push({
      von:                vonDatum,
      bis:                bisDatum,
      label:              labelVon + ' → ' + labelBis + ' (' + tageAnzahl + ' Tag' + (tageAnzahl !== 1 ? 'e' : '') + ')',
      wochentagVon:       getWochentagName(vonDatum),
      wochentagBis:       getWochentagName(bisDatum),
      tageAnzahl:         tageAnzahl,
      bestandVon:         bestandVon,
      bestandBis:         bestandBis,
      eingang:            eingang,
      abgang_filialen:    abgangGesamt,
      backstube:          backstubeGesamt,
      verbrauch_inventur: verbrauchInventur,
      verbrauch_berechnet: verbrauchBerechnet,
      differenz:          differenz,
      tagesdetail:        tagesdetail
    });
  }

  return intervalle;
}

// ── ALLE DATEN-DATEN ZWISCHEN ZWEI SNAPSHOTS ────────────
// Gibt alle Daten zurück an denen Einträge existieren (ausgang oder backmengen)
// + alle Daten dazwischen lückenlos (für vollständige Wochentags-Darstellung)
function getDatenZwischen(vonDatum, bisDatum, lieferantenDb, backmengenDb) {
  var daten = new Set();

  // Aus lieferanten_db
  lieferantenDb.forEach(function(e) {
    if (zwischenDaten(e.datum, vonDatum, bisDatum)) daten.add(e.datum);
  });

  // Aus backmengen_db
  backmengenDb.forEach(function(b) {
    if (zwischenDaten(b.datum, vonDatum, bisDatum)) daten.add(b.datum);
  });

  // Lücken füllen — alle Tage von vonDatum+1 bis bisDatum-1
  var cursor = new Date(vonDatum + 'T00:00:00');
  cursor.setDate(cursor.getDate() + 1);
  var ende   = new Date(bisDatum + 'T00:00:00');
  while (cursor < ende) {
    var ds = cursor.toISOString().split('T')[0];
    daten.add(ds);
    cursor.setDate(cursor.getDate() + 1);
  }

  return Array.from(daten).sort();
}

// ── DURCHSCHNITTE PRO WOCHENTAG ──────────────────────────
/**
 * Aggregiert mehrere Intervalle zu Wochentags-Durchschnittswerten.
 * Gibt ein Objekt zurück: { wtIndex: { abgang_filialen_schnitt, backstube_schnitt, n } }
 */
function berechneWochentagsSchnitte(intervalle) {
  var sammlung = {}; // { wtIndex: { sumAbgang, sumBackstube, n } }

  intervalle.forEach(function(iv) {
    iv.tagesdetail.forEach(function(t) {
      var idx = t.wtIndex;
      if (!sammlung[idx]) sammlung[idx] = { sumAbgang:0, sumBackstube:0, n:0 };
      sammlung[idx].sumAbgang    += t.abgang_filialen;
      sammlung[idx].sumBackstube += t.backstube;
      sammlung[idx].n++;
    });
  });

  var schnitte = {};
  Object.keys(sammlung).forEach(function(idx) {
    var s = sammlung[idx];
    schnitte[idx] = {
      wtIndex:                parseInt(idx),
      wochentag:              WT_VOLL[idx],
      abgang_filialen_schnitt: s.n > 0 ? s.sumAbgang    / s.n : 0,
      backstube_schnitt:       s.n > 0 ? s.sumBackstube / s.n : 0,
      n:                       s.n
    };
  });

  return schnitte;
}

// ── INTERVALL-SCHNITTE (für die Kachel-Boxen) ────────────
/**
 * Gruppiert Intervalle nach ihrem Typ (labelVon→labelBis)
 * und berechnet Durchschnittswerte.
 *
 * Gibt Array zurück: [
 *   {
 *     label:                  "Di → Fr (3 Tage)",
 *     n:                      3,
 *     schnitt_inventur:       7.2,
 *     schnitt_berechnet:      6.1,
 *     schnitt_abgang_filialen: 4.5,
 *     schnitt_backstube:       1.6,
 *     tage:                   [wtIndex, ...]
 *   }
 * ]
 */
function berechneIntervallSchnitte(intervalle) {
  if (!intervalle.length) return [];

  var gruppen = {};
  intervalle.forEach(function(iv) {
    var key = iv.wochentagVon + '_' + iv.wochentagBis;
    if (!gruppen[key]) {
      gruppen[key] = {
        label:    iv.label,
        tage:     iv.tagesdetail.map(function(t) { return t.wtIndex; })
                    .filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(),
        eintraege: []
      };
    }
    gruppen[key].eintraege.push(iv);
  });

  return Object.values(gruppen).map(function(g) {
    var n   = g.eintraege.length;
    var avg = function(fn) {
      return n > 0 ? g.eintraege.reduce(function(s, iv) { return s + fn(iv); }, 0) / n : null;
    };
    return {
      label:                   g.label,
      tage:                    g.tage,
      n:                       n,
      schnitt_inventur:        avg(function(iv) { return iv.verbrauch_inventur; }),
      schnitt_berechnet:       avg(function(iv) { return iv.verbrauch_berechnet; }),
      schnitt_abgang_filialen: avg(function(iv) { return iv.abgang_filialen; }),
      schnitt_backstube:       avg(function(iv) { return iv.backstube; }),
      schnitt_differenz:       avg(function(iv) { return iv.differenz; })
    };
  });
}

// ── BESTELLEMPFEHLUNG ────────────────────────────────────
// sicherheitsFaktor kommt aus lieferanten_einstellungen.json
// Beispiel: 0.15 = 15% Aufschlag
function berechneBestellempfehlung(schnitt_inventur, sicherheitsFaktor) {
  if (schnitt_inventur === null || schnitt_inventur === undefined) return null;
  var faktor = (sicherheitsFaktor !== null && sicherheitsFaktor !== undefined)
    ? (1 + sicherheitsFaktor)
    : 1.15;
  return Math.ceil(schnitt_inventur * faktor * 10) / 10;
}

// ── EXPORT ───────────────────────────────────────────────
// Alles unter window.LieferungenGehirn damit die Auswertung sauber darauf zugreifen kann
window.LieferungenGehirn = {
  berechneIntervalle:        berechneIntervalle,
  berechneWochentagsSchnitte: berechneWochentagsSchnitte,
  berechneIntervallSchnitte: berechneIntervallSchnitte,
  berechneBestellempfehlung: berechneBestellempfehlung,
  getWochentagName:          getWochentagName,
  getWochentagIndex:         getWochentagIndex,
  leseFenster:               leseFenster
};
