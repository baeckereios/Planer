/**
 * lieferungen_gehirn.js  v2
 * ─────────────────────────────────────────────────────────
 * Vereinfachte Berechnungslogik für lieferanten_auswertung.html
 *
 * Liest:
 *   lieferanten_db.json   — typ:"bestand" Snapshots  +  typ:"eingang" (optional)
 *   backmengen_db.json    — Backstube-Produktion (separater Backstube-Rechner)
 *   produkt_config.json   — Charge-Größen
 *
 * NICHT mehr verwendet:
 *   ausgang_filialen      — weggefallen
 *   lieferanten_bestand_db.json — merged in lieferanten_db
 *
 * Schreibt nichts. Nur Lesen + Berechnen.
 */

// ── WOCHENTAG ────────────────────────────────────────────
// Konvention: Mo=0 … So=6  (konsistent mit lieferanten_config)
// JS getDay() gibt So=0 … Sa=6 → Umrechnung nötig
function getWochentagIndex(datum) {
  return (new Date(datum + 'T00:00:00').getDay() + 6) % 7;
}

var WT_VOLL = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

function getWochentagName(datum) {
  return WT_VOLL[getWochentagIndex(datum)];
}

// ── DATUM-HILFSFUNKTIONEN ────────────────────────────────
// >= von && < bis
function imFenster(datum, von, bis) {
  return datum >= von && datum < bis;
}

// Anzahl Tage zwischen zwei Datumsstrings (b - a), ganzzahlig
// Math.round fängt DST-Sprünge (±1h) ab
function tageDiff(von, bis) {
  var a = new Date(von + 'T00:00:00');
  var b = new Date(bis + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

// Lokalen Datumsstring YYYY-MM-DD ohne UTC-Versatz bauen
function datumString(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

// ── CHARGE LOOKUP ────────────────────────────────────────
function getCharge(legacyKey, produktConfig) {
  if (!legacyKey || !produktConfig || !produktConfig.length) return null;
  var e = produktConfig.find(function(p) { return p.legacyKey === legacyKey; });
  return e ? (e.charge || null) : null;
}

// ── KERN: INTERVALLE BERECHNEN ───────────────────────────
/**
 * Gibt Array valider Intervalle zurück.
 * Ein Intervall = Zeitraum zwischen zwei aufeinanderfolgenden Bestand-Snapshots
 * desselben Produkts.
 *
 * Validierungsregel: netVerbrauch < 0  →  unbekannte Lieferung dazwischen
 *                    → Intervall wird verworfen.
 *
 * db:       kombinierte lieferanten_db.json
 *           (enthält typ:"bestand" und optional typ:"eingang")
 * bisDatum: optional — nur Snapshots bis zu diesem Datum (inkl.) verwenden
 *
 * Rückgabe pro Intervall: {
 *   von, bis,
 *   tageAnzahl,        // tageDiff(von, bis)
 *   bestandVon,        // gezählte Menge bei Snapshot A
 *   bestandBis,        // gezählte Menge bei Snapshot B
 *   eingang,           // Summe erfasster Eingänge im Fenster [von, bis)
 *   eingang_bekannt,   // true wenn min. ein Eingang erfasst wurde
 *   netVerbrauch,      // bestandVon + eingang - bestandBis  (immer >= 0)
 *   verbrauchProTag,   // netVerbrauch / tageAnzahl
 *   label              // "Di → Fr (3 Tage)"
 * }
 */
function berechneIntervalle(produkt, db, produktConfig, bisDatum) {
  var id = produkt.id;

  // Alle Bestand-Snapshots für dieses Produkt — chronologisch
  var snapshots = db
    .filter(function(e) {
      if (e.typ !== 'bestand') return false;
      if (!e.bestaende || e.bestaende[id] === undefined) return false;
      if (bisDatum && e.datum > bisDatum) return false;
      return true;
    })
    .sort(function(a, b) { return a.datum.localeCompare(b.datum); });

  if (snapshots.length < 2) return [];

  var intervalle = [];

  for (var i = 0; i < snapshots.length - 1; i++) {
    var snapA     = snapshots[i];
    var snapB     = snapshots[i + 1];
    var vonDatum  = snapA.datum;
    var bisDatumIv = snapB.datum;

    var tage = tageDiff(vonDatum, bisDatumIv);
    if (tage <= 0) continue; // Zwei Snapshots am selben Tag — überspringen

    var bestandVon = (snapA.bestaende[id] && snapA.bestaende[id].menge !== undefined)
      ? snapA.bestaende[id].menge : 0;
    var bestandBis = (snapB.bestaende[id] && snapB.bestaende[id].menge !== undefined)
      ? snapB.bestaende[id].menge : 0;

    // Eingang: alle eingang-Einträge im Fenster [vonDatum, bisDatumIv)
    // Eingang am Tag von Snapshot A zählt ZUM Intervall.
    // Eingang am Tag von Snapshot B zählt NICHT mehr (gehört zum nächsten Intervall).
    var eingang       = 0;
    var eingangBekannt = false;
    db.forEach(function(e) {
      if (e.typ !== 'eingang') return;
      if (!imFenster(e.datum, vonDatum, bisDatumIv)) return;
      if (e.eintraege && e.eintraege[id] !== undefined) {
        eingang       += (e.eintraege[id].menge || 0);
        eingangBekannt = true;
      }
    });

    var netVerbrauch = bestandVon + eingang - bestandBis;

    // Negativ = unbekannte Lieferung dazwischen → Intervall verwerfen
    if (netVerbrauch < 0) continue;

    var labelVon = getWochentagName(vonDatum).substring(0, 2);
    var labelBis = getWochentagName(bisDatumIv).substring(0, 2);

    intervalle.push({
      von:             vonDatum,
      bis:             bisDatumIv,
      tageAnzahl:      tage,
      bestandVon:      bestandVon,
      bestandBis:      bestandBis,
      eingang:         eingang,
      eingang_bekannt: eingangBekannt,
      netVerbrauch:    netVerbrauch,
      verbrauchProTag: netVerbrauch / tage,
      label:           labelVon + ' \u2192 ' + labelBis
                       + ' (' + tage + ' Tag' + (tage !== 1 ? 'e' : '') + ')'
    });
  }

  return intervalle;
}

// ── SCHNITT PRO TAG ──────────────────────────────────────
/**
 * Gewichteter Durchschnitt über alle validen Intervalle.
 * Formel: sumVerbrauch / sumTage
 *
 * Warum gewichtet?
 * Ein 7-Tage-Intervall hat mehr Signal als ein 1-Tage-Intervall.
 * Ungewichteter Schnitt (avg der verbrauchProTag-Werte) würde kurze
 * Intervalle übergewichten.
 *
 * Gibt null zurück wenn keine Intervalle vorhanden.
 */
function berechneSchnittProTag(intervalle) {
  if (!intervalle || !intervalle.length) return null;
  var sumV = intervalle.reduce(function(s, iv) { return s + iv.netVerbrauch; }, 0);
  var sumT = intervalle.reduce(function(s, iv) { return s + iv.tageAnzahl;   }, 0);
  return sumT > 0 ? sumV / sumT : null;
}

// ── WOCHENTAGS-SCHNITTE ──────────────────────────────────
/**
 * Verteilt den Intervall-Verbrauch gleichmäßig auf die enthaltenen Wochentage.
 * Näherung — ohne Lieferschein gibt es keine Tages-Einzeldaten.
 *
 * Rückgabe: { 0: { wtIndex, wochentag, schnitt, n }, 1: ..., ... }
 * Schlüssel = wtIndex (Mo=0 … So=6)
 */
function berechneWochentagsSchnitte(intervalle) {
  var sammlung = {};

  intervalle.forEach(function(iv) {
    // Iteriere über alle Tage (A+1) bis einschließlich B
    // Das sind genau tageAnzahl Tage — konsistent mit tageDiff(A,B)
    var cursor = new Date(iv.von + 'T00:00:00');
    cursor.setDate(cursor.getDate() + 1);               // Tag nach Snapshot A
    var endeExkl = new Date(iv.bis + 'T00:00:00');
    endeExkl.setDate(endeExkl.getDate() + 1);           // Tag nach Snapshot B → B wird inkludiert

    while (cursor < endeExkl) {
      var wti = (cursor.getDay() + 6) % 7;              // Mo=0 direkt aus Date
      if (!sammlung[wti]) sammlung[wti] = { sum: 0, n: 0 };
      sammlung[wti].sum += iv.verbrauchProTag;
      sammlung[wti].n++;
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  var schnitte = {};
  Object.keys(sammlung).forEach(function(idx) {
    var s = sammlung[idx];
    schnitte[idx] = {
      wtIndex:   parseInt(idx),
      wochentag: WT_VOLL[idx],
      schnitt:   s.n > 0 ? s.sum / s.n : 0,
      n:         s.n
    };
  });

  return schnitte;
}

// ── BESTELLBEDARF ────────────────────────────────────────
/**
 * Bestellbedarf für einen konkreten Planungszeitraum.
 *
 * schnittProTag: Ergebnis von berechneSchnittProTag()
 * vonDatum:      Planungsstart (YYYY-MM-DD)
 * bisDatum:      Planungsende  (YYYY-MM-DD, inklusiv)
 * aufschlag:     Sicherheitsaufschlag z.B. 0.15 für 15%
 *
 * Rückgabe: aufgerundete Menge in Gebinde-Einheiten (Kartons etc.)
 * Gibt null zurück wenn kein Schnitt vorhanden.
 */
function berechneBestellbedarf(schnittProTag, vonDatum, bisDatum, aufschlag) {
  if (schnittProTag === null || schnittProTag === undefined) return null;
  var tage = tageDiff(vonDatum, bisDatum) + 1; // +1: bisDatum ist inklusiv
  if (tage <= 0) return null;
  var auf = (aufschlag !== null && aufschlag !== undefined) ? aufschlag : 0.15;
  return Math.ceil(schnittProTag * tage * (1 + auf) * 10) / 10;
}

// ── BACKSTUBE-VERBRAUCH ──────────────────────────────────
/**
 * Berechnet den Backstube-Anteil eines Produkts für einen Zeitraum
 * auf Basis von backmengen_db.json.
 *
 * Vollständig getrennt vom Inventur-System.
 * Beantwortet: "Was haben wir zwischen Tag X und Tag Y aus dem Froster
 *               für die Backstube entnommen?"
 *
 * Benötigt am Produkt: in_backstube_gebacken, produkt_config_key,
 *                      gebinde.inhalt_stueck
 * backmengenDb:  Array { datum, produkte: { [blechKey]: bleche } }
 * produktConfig: Array { legacyKey, charge }
 *
 * Rückgabe: {
 *   kartons,     // Gesamtverbrauch in Gebinde-Einheiten
 *   stueck,      // kartons × inhalt_stueck
 *   tageAnzahl,  // Tage mit Backmengen-Einträgen im Zeitraum
 *   tageDetail   // [{ datum, bleche, kartons }]
 * }
 * Gibt null zurück wenn Produkt nicht in Backstube gebacken wird.
 */
function berechneBackstubeVerbrauch(produkt, vonDatum, bisDatum, backmengenDb, produktConfig) {
  if (!produkt.in_backstube_gebacken) return null;
  var pkKey = produkt.produkt_config_key || '';
  if (!pkKey) return null;

  var charge   = getCharge(pkKey, produktConfig);
  var inhalt   = (produkt.gebinde && produkt.gebinde.inhalt_stueck) ? produkt.gebinde.inhalt_stueck : 1;
  var blechKey = pkKey.replace('_stueck', '_bleche');

  if (!charge) return null;

  var gesamtKartons = 0;
  var tageDetail    = [];

  backmengenDb.forEach(function(tag) {
    // Zeitraum inklusiv auf beiden Seiten
    if (tag.datum < vonDatum || tag.datum > bisDatum) return;
    if (!tag.produkte) return;

    var bleche = tag.produkte[blechKey];
    if (bleche === undefined || bleche === null) return;

    // Bleche können halbiert werden (z.B. 2.5 Bleche) — aufrunden da Einheit "Blech"
    var kartons = Math.ceil(bleche) * charge / inhalt;
    gesamtKartons += kartons;
    tageDetail.push({ datum: tag.datum, bleche: bleche, kartons: kartons });
  });

  return {
    kartons:    gesamtKartons,
    stueck:     Math.round(gesamtKartons * inhalt),
    tageAnzahl: tageDetail.length,
    tageDetail: tageDetail
  };
}

// ── FILIALE-VERBRAUCH ────────────────────────────────────
/**
 * Liest ausgang_filialen-Einträge aus der kombinierten lieferanten_db
 * für ein Produkt im angegebenen Zeitraum (inklusiv).
 *
 * Gibt null zurück wenn Produkt nicht in Filialen geht (lieferung_filiale: false).
 *
 * Rückgabe: {
 *   kartons,      // Gesamtmenge im Zeitraum
 *   tageAnzahl,   // Tage mit Einträgen
 *   tageDetail    // [{ datum, kartons }]
 * }
 */
function berechneFilialeVerbrauch(produkt, vonDatum, bisDatum, db) {
  if (!produkt.lieferung_filiale) return null;
  var id = produkt.id;

  var gesamtKartons = 0;
  var tageDetail    = [];

  db.forEach(function(e) {
    if (e.typ !== 'ausgang_filialen') return;
    if (e.datum < vonDatum || e.datum > bisDatum) return;
    if (!e.eintraege || e.eintraege[id] === undefined) return;
    var menge = e.eintraege[id].menge || 0;
    gesamtKartons += menge;
    tageDetail.push({ datum: e.datum, kartons: menge });
  });

  // Chronologisch sortieren (DB sollte sortiert sein, aber sicher ist sicher)
  tageDetail.sort(function(a, b) { return a.datum.localeCompare(b.datum); });

  return {
    kartons:    gesamtKartons,
    tageAnzahl: tageDetail.length,
    tageDetail: tageDetail
  };
}

// ── EXPORT ───────────────────────────────────────────────
window.LieferungenGehirn = {
  // Kern
  berechneIntervalle:         berechneIntervalle,
  berechneSchnittProTag:      berechneSchnittProTag,
  berechneWochentagsSchnitte: berechneWochentagsSchnitte,
  berechneBestellbedarf:      berechneBestellbedarf,
  // Detailansicht
  berechneBackstubeVerbrauch: berechneBackstubeVerbrauch,
  berechneFilialeVerbrauch:   berechneFilialeVerbrauch,
  // Hilfsfunktionen (für Auswertungsseite)
  getWochentagIndex:          getWochentagIndex,
  getWochentagName:           getWochentagName,
  tageDiff:                   tageDiff
};
