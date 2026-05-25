/**
 * produktionskette_logik.js — BäckereiOS
 * Reine Berechnungslogik für die Produktionskette.
 * Kein DOM. Kein Rendering. Nur Zahlen rein, Zahlen raus.
 *
 * ZEITLICHE REIHENFOLGE PRO TAG:
 *   1. Morgens: Verbrauch (Laden öffnet, Froster wird geleert)
 *   2. Danach:  Produktion (Froster wird für nächsten Tag gefüllt)
 *   → Lücke = Bestand nach Morgen negativ. Produktion rettet das NICHT.
 *
 * WOCHENCONFIG-INTEGRATION:
 *   zu        → verbrauch = 0 (Bäckerei geschlossen)
 *   hamster_X → verbrauch = BOS_HAMSTER.berechne(stufe, needs, bosIdx)
 *   normal    → verbrauch = p.needs[bosIdx]
 *
 * Export: window.PK_LOGIK.berechne({ ... })
 */

(function () {
'use strict';

const JS_ZU_BOS = [6, 0, 1, 2, 3, 4, 5];
const WT_KURZ   = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const WT_LANG   = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

function berechne({
  p,               // BOS_STAMMDATEN-Eintrag
  startBest,       // Startbestand (Bleche)
  fehlmengeAbs,    // abs(min(0, fehlmenge)) aus Inventur
  frosterFertig,   // boolean
  zielOff,         // Offset Zieldatum
  prodTage,        // { offset: true }
  manuelleWerte,   // { offset: Zahl } weiche Überschreibung
  gesperrtWerte,   // { offset: Zahl } harte Sperrung
  gleichmaessig,   // boolean
  heute,           // Date (00:00:00)
  wochenconfigMap  // { 'YYYY-MM-DD': 'normal'|'zu'|'hamster_1'|'hamster_2'|'hamster_3' } | null
}) {
  const batch = p.batchSize || 1;

  // ── Datum-Offset → ISO-String ──────────────────────────
  function iso(j) {
    const d = new Date(heute);
    d.setDate(heute.getDate() + j);
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // ── Tag-Typ aus wochenconfig ───────────────────────────
  function tagTyp(j) {
    if (!wochenconfigMap) return 'normal';
    return wochenconfigMap[iso(j)] || 'normal';
  }

  /**
   * Verbrauch an Tag-Offset j.
   * Berücksichtigt: Froster-Deckung, Wochenconfig (zu/hamster), needs.
   */
  function vbAn(j) {
    if (j <= 0) return 0;
    if (frosterFertig && j === 1) return 0;

    const dj = new Date(heute);
    dj.setDate(heute.getDate() + j);
    const bosIdx = JS_ZU_BOS[dj.getDay()];
    const typ = tagTyp(j);

    if (typ === 'zu') return 0;

    if (typ.startsWith('hamster_') && window.BOS_HAMSTER?.bereit) {
      return window.BOS_HAMSTER.berechne(typ, p.needs, bosIdx);
    }

    return p.needs[bosIdx] || 0;
  }

  const sortedProdTage = Object.keys(prodTage)
    .map(Number).filter(o => prodTage[o]).sort((a, b) => a - b);

  // ── VORSCHLÄGE ────────────────────────────────────────
  const vorschlaege = {};

  if (gleichmaessig) {
    let gesamtBedarf = fehlmengeAbs;
    for (let j = 1; j <= zielOff; j++) gesamtBedarf += vbAn(j);
    gesamtBedarf = Math.max(0, gesamtBedarf - (startBest - fehlmengeAbs));

    const gesperrtSumme = sortedProdTage
      .filter(o => gesperrtWerte[o] !== undefined)
      .reduce((s, o) => s + gesperrtWerte[o], 0);
    const restBedarf = Math.max(0, gesamtBedarf - gesperrtSumme);

    const freie = sortedProdTage.filter(o => gesperrtWerte[o] === undefined);
    if (freie.length > 0) {
      const perDay = Math.ceil(restBedarf / freie.length / batch) * batch;
      freie.forEach(o => { vorschlaege[o] = perDay; });
    }
    sortedProdTage
      .filter(o => gesperrtWerte[o] !== undefined)
      .forEach(o => { vorschlaege[o] = gesperrtWerte[o]; });

  } else {
    let simBestand = startBest - fehlmengeAbs;

    for (let i = 0; i <= zielOff; i++) {
      const vb_i = vbAn(i);
      const bestandNachMorgen = i === 0 ? simBestand : simBestand - vb_i;

      if (prodTage[i]) {
        if (gesperrtWerte[i] !== undefined) {
          vorschlaege[i] = gesperrtWerte[i];
        } else if (manuelleWerte[i] !== undefined) {
          vorschlaege[i] = manuelleWerte[i];
        } else {
          const naechster = sortedProdTage.find(o => o > i) ?? zielOff;
          let futureBedarf = 0;
          for (let j = i + 1; j <= naechster; j++) futureBedarf += vbAn(j);
          const verfuegbar = Math.max(0, bestandNachMorgen);
          const fehlend    = Math.max(0, futureBedarf - verfuegbar);
          vorschlaege[i]   = fehlend > 0 ? Math.ceil(fehlend / batch) * batch : 0;
        }
      }

      const prod_i   = prodTage[i] ? (vorschlaege[i] || 0) : 0;
      simBestand = bestandNachMorgen + prod_i;
    }
  }

  // ── KETTE AUFBAUEN ────────────────────────────────────
  const kette = [];
  let bestand = startBest - fehlmengeAbs;
  let gesamtVerbrauch  = 0;
  let gesamtProduktion = 0;

  for (let i = 0; i <= zielOff; i++) {
    const d = new Date(heute);
    d.setDate(heute.getDate() + i);
    const bosIdx  = JS_ZU_BOS[d.getDay()];
    const gedeckt = frosterFertig && (i === 1);
    const typ     = tagTyp(i);
    const vb_i    = vbAn(i);
    const prod_i  = prodTage[i] ? (vorschlaege[i] || 0) : 0;

    const bestandNachMorgen = i === 0 ? bestand : bestand - vb_i;

    let warnung = null;
    if (i > 0 && !gedeckt && typ !== 'zu' && bestandNachMorgen < 0)
      warnung = 'luecke';
    else if (i > 0 && !gedeckt && typ !== 'zu' && bestandNachMorgen === 0 && i < zielOff)
      warnung = 'knapp';

    bestand = bestandNachMorgen + prod_i;

    if (i > 0 && !gedeckt) gesamtVerbrauch += vb_i;
    gesamtProduktion += prod_i;

    kette.push({
      offset:              i,
      datum:               new Date(d),
      bosIdx,
      tagKurz:             WT_KURZ[bosIdx],
      tagLang:             WT_LANG[bosIdx],
      istHeute:            i === 0,
      istSonntag:          bosIdx === 6,
      gedecktDurchFroster: gedeckt,
      tagTyp:              typ,          // 'normal'|'zu'|'hamster_1/2/3'
      istZu:               typ === 'zu',
      istHamster:          typ.startsWith('hamster_'),
      verbrauch:           vb_i,
      produktion:          prod_i,
      bestandNachMorgen,
      bestand,
      prodTag:             !!prodTage[i],
      istGesperrt:         gesperrtWerte[i] !== undefined,
      istManuell:          gesperrtWerte[i] === undefined && manuelleWerte[i] !== undefined,
      vorschlag:           vorschlaege[i] ?? 0,
      warnung
    });
  }

  const warnungen = kette
    .filter(t => t.warnung)
    .map(t => ({
      typ:   t.warnung,
      tag:   t.tagLang,
      datum: (t.datum.getDate().toString().padStart(2,'0') + '.' +
              (t.datum.getMonth()+1).toString().padStart(2,'0') + '.'),
      delta: t.bestandNachMorgen
    }));

  return {
    kette,
    vorschlaege,
    gesamtVerbrauch,
    gesamtProduktion,
    endlager: bestand,
    warnungen
  };
}

window.PK_LOGIK = { berechne };

})();
