/**
 * FLUSS_LOGIK.js
 * Reines Rechenmodul – kein DOM, keine Seiteneffekte.
 * Einbinden via <script src="fluss_logik.js"> vor dem Haupt-Script.
 */

var FLUSS_LOGIK = (function () {

  const TAG_NAMEN = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
  const TAG_KURZ  = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  // ─── Datum-Hilfsfunktionen ───────────────────────────────────────────────

  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekDates(monday) {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function dateToISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getWeekKey(monday) {
    // ISO 8601 Wochennummer
    const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  function formatDatum(dateISO) {
    const [y, m, d] = dateISO.split('-');
    return `${d}.${m}.`;
  }

  // ─── Verfügbarkeits-Checks ───────────────────────────────────────────────

  function isPersonFehlend(personId, dateISO, fehlzeiten) {
    return (fehlzeiten || []).some(f =>
      f.personId === personId &&
      dateISO >= f.von &&
      dateISO <= f.bis
    );
  }

  function getFehlzeitGrund(personId, dateISO, fehlzeiten) {
    const f = (fehlzeiten || []).find(f =>
      f.personId === personId &&
      dateISO >= f.von &&
      dateISO <= f.bis
    );
    return f ? f.typ : null;
  }

  function getFreierTag(personId, weekKey, freieTage) {
    const entry = (freieTage || {})[weekKey]?.[personId] || null;
    if (!entry) return null;
    // Rückwärtskompatibel: string oder { tag, typ }
    return typeof entry === 'string' ? entry : entry.tag;
  }

  function getFreierTagTyp(personId, weekKey, freieTage) {
    const entry = (freieTage || {})[weekKey]?.[personId] || null;
    if (!entry) return null;
    return typeof entry === 'string' ? 'auto' : entry.typ;
  }

  function isPersonVerfuegbar(person, tagName, dateISO, weekKey, config) {
    if ((person.gesperrt || []).includes(tagName)) return false;
    if (isPersonFehlend(person.id, dateISO, config.fehlzeiten)) return false;
    const frei = getFreierTag(person.id, weekKey, config.freieTage);
    if (frei === tagName) return false;
    return true;
  }

  function getAbwesenheitsGrund(person, tagName, dateISO, weekKey, config) {
    if ((person.gesperrt || []).includes(tagName)) return 'gesperrt';
    const fehlGrund = getFehlzeitGrund(person.id, dateISO, config.fehlzeiten);
    if (fehlGrund) return fehlGrund;
    const frei = getFreierTag(person.id, weekKey, config.freieTage);
    const freiTyp = getFreierTagTyp(person.id, weekKey, config.freieTage);
    if (frei === tagName) return freiTyp === 'wunsch' ? 'frei (Wunsch)' : 'frei';
    return null;
  }

  // ─── Tagesplan-Berechnung ────────────────────────────────────────────────

  function berechneTagesplan(config, date) {
    const dayJS = date.getDay();
    const tagName = TAG_NAMEN[dayJS];
    const tagKurz = TAG_KURZ[dayJS];
    const dateISO = dateToISO(date);
    const monday = getMondayOfWeek(date);
    const weekKey = getWeekKey(monday);

    const result = {
      datum: dateISO,
      datumFormatiert: formatDatum(dateISO),
      tag: tagName,
      tagKurz: tagKurz,
      zuweisung: {},
      warnungen: []
    };

    if (dayJS === 0) return result; // Kein Betrieb sonntags

    const positionen = config.positionen || [];
    const personen = config.personen || [];

    // Verfügbare Personen heute
    const verfuegbar = personen.filter(p =>
      isPersonVerfuegbar(p, tagName, dateISO, weekKey, config)
    );
    const zugewiesen = new Set();

    // Gesperrte Positionen markieren
    for (const pos of positionen) {
      if ((pos.gesperrtAm || []).includes(tagName)) {
        result.zuweisung[pos.id] = {
          person: null,
          personId: null,
          status: 'gesperrt',
          grund: `Samstags nicht besetzt`
        };
      }
    }

    const aktivPositionen = positionen.filter(p =>
      !(p.gesperrtAm || []).includes(tagName)
    );

    // Kandidaten für eine Position ermitteln (Hilfsfunktion)
    const getKandidaten = (pos, pool, zugewiesenSet) =>
      pool
        .filter(p => !zugewiesenSet.has(p.id))
        .filter(p => (p.attribute || []).includes(pos.attribut))
        .filter(p => !(p.azubi && pos.attribut === 'versand'));

    // ── Manuelle Vorbelegung VOR dem Algorithmus ─────────────────────────
    // Manuelle Overrides respektieren keinen freien Tag — nur krank/gesperrt blockiert
    const manOverrides = (config.manuelleZuweisungen || {})[dateISO] || {};
    for (const [posId, personId] of Object.entries(manOverrides)) {
      if (!personId) continue;
      const person = personen.find(p => p.id === personId);
      const pos = positionen.find(p => p.id === posId);
      if (!person || !pos) continue;
      if ((pos.gesperrtAm || []).includes(tagName)) continue;
      // Nur krank/urlaub blockiert — freier Tag wird ignoriert (manuell = bewusste Entscheidung)
      if (isPersonFehlend(personId, dateISO, config.fehlzeiten || [])) continue;
      if ((person.gesperrt || []).includes(tagName)) continue;
      result.zuweisung[posId] = {
        person: person.name, personId: person.id,
        status: 'manuell', grund: 'Manuell gesetzt'
      };
      zugewiesen.add(personId);
    }

    // Positionen sortieren: Priorität zuerst (1=kritisch), dann Kandidatenanzahl
    // → Joker landen bevorzugt auf niedrigprioritären Positionen (Versand, 22Uhr)
    // Bereits manuell belegte Positionen überspringen
    const sortedPositionen = [...aktivPositionen]
      .filter(p => !result.zuweisung[p.id]) // manuell belegte raus
      .sort((a, b) => {
      const prioA = a.prioritaet || 2;
      const prioB = b.prioritaet || 2;
      if (prioA !== prioB) return prioA - prioB;
      // Gleiche Priorität: engste Besetzung zuerst
      const aCount = getKandidaten(a, verfuegbar, new Set()).filter(p => !p.azubi).length;
      const bCount = getKandidaten(b, verfuegbar, new Set()).filter(p => !p.azubi).length;
      return aCount - bCount;
    });

    // Einzel-Durchlauf: kritischste Position zuerst
    for (const pos of sortedPositionen) {
      const stammkraft = personen.find(p => p.stammkraft_von === pos.id);
      const stammkraftVerfuegbar = stammkraft &&
        verfuegbar.find(p => p.id === stammkraft.id) &&
        !zugewiesen.has(stammkraft.id);

      // Stammkraft ist verfügbar — direkt zuweisen
      if (stammkraftVerfuegbar) {
        result.zuweisung[pos.id] = {
          person: stammkraft.name, personId: stammkraft.id,
          status: 'stammkraft', grund: 'Stammkraft'
        };
        zugewiesen.add(stammkraft.id);
        continue;
      }

      // Stammkraft-Abwesenheit für Anzeige festhalten
      const stammkraftAbwesend = (stammkraft && !stammkraftVerfuegbar) ? stammkraft : null;
      const stammkraftGrund = stammkraftAbwesend
        ? getAbwesenheitsGrund(stammkraftAbwesend, tagName, dateISO, weekKey, config)
        : null;

      // Kaskade: beste verfügbare Person, Azubi immer letzter Griff
      const kandidaten = getKandidaten(pos, verfuegbar, zugewiesen)
        .sort((a, b) => {
          if (a.azubi && !b.azubi) return 1;
          if (!a.azubi && b.azubi) return -1;
          return (a.attribute || []).indexOf(pos.attribut) -
                 (b.attribute || []).indexOf(pos.attribut);
        });

      if (kandidaten.length > 0) {
        const p = kandidaten[0];
        const stammkraftPos = positionen.find(pp => pp.id === p.stammkraft_von);
        result.zuweisung[pos.id] = {
          person: p.name, personId: p.id,
          status: stammkraftPos ? 'kaskade' : 'wolke',
          grund: stammkraftPos
            ? `Kaskade – ${p.name} normalerweise ${stammkraftPos.label}`
            : 'Aus Wolke',
          stammkraftName: stammkraftAbwesend?.name || null,
          stammkraftGrund
        };
        zugewiesen.add(p.id);
      } else {
        result.zuweisung[pos.id] = {
          person: config.joker || 'Joker', personId: null,
          status: 'joker', grund: 'Kein qualifizierter Mitarbeiter verfügbar',
          stammkraftName: stammkraftAbwesend?.name || null,
          stammkraftGrund
        };
        result.warnungen.push(`Joker für ${pos.label} am ${dateISO}`);
      }
    }

    // ── Fix-up-Pass: Joker durch Tausch auflösen ─────────────────────────
    // Wenn eine Position einen Joker hat, prüfen ob ein Tausch hilft:
    // Person X sitzt auf Position A → kann aber auch Joker-Position B füllen
    // Unbesetzte Person Y (z.B. Azubi) kann A übernehmen → Tausch löst den Joker
    const jokerPositionen = aktivPositionen.filter(pos =>
      result.zuweisung[pos.id]?.status === 'joker'
    );

    for (const jokerPos of jokerPositionen) {
      let geloest = false;
      for (const [posId, z] of Object.entries(result.zuweisung)) {
        if (geloest) break;
        if (z.status === 'joker' || z.status === 'gesperrt' || !z.personId) continue;

        const aktuellePos = positionen.find(p => p.id === posId);
        if (!aktuellePos) continue;

        const belegterMitarbeiter = personen.find(p => p.id === z.personId);
        if (!belegterMitarbeiter) continue;

        // Kann der belegte Mitarbeiter die Joker-Position füllen?
        if (!(belegterMitarbeiter.attribute || []).includes(jokerPos.attribut)) continue;
        if (belegterMitarbeiter.azubi && jokerPos.attribut === 'versand') continue;

        // Gibt es jemanden der die aktuelle Position übernehmen kann?
        const ersatz = verfuegbar
          .filter(p => !zugewiesen.has(p.id))
          .filter(p => (p.attribute || []).includes(aktuellePos.attribut))
          .filter(p => !(p.azubi && aktuellePos.attribut === 'versand'))
          .sort((a, b) => {
            // Azubi bevorzugt wenn Versand nicht betroffen
            if (a.azubi && !b.azubi) return -1;
            if (!a.azubi && b.azubi) return 1;
            return (a.attribute || []).indexOf(aktuellePos.attribut) -
                   (b.attribute || []).indexOf(aktuellePos.attribut);
          });

        if (ersatz.length > 0) {
          const e = ersatz[0];
          // Tausch durchführen
          zugewiesen.delete(belegterMitarbeiter.id);
          zugewiesen.add(e.id);
          zugewiesen.add(belegterMitarbeiter.id);

          const ersatzStammkraftPos = positionen.find(pp => pp.id === e.stammkraft_von);
          result.zuweisung[posId] = {
            person: e.name, personId: e.id,
            status: ersatzStammkraftPos ? 'kaskade' : 'wolke',
            grund: `Tausch – ${e.name} übernimmt damit ${belegterMitarbeiter.name} für ${jokerPos.label} frei wird`,
            stammkraftName: z.stammkraftName || null,
            stammkraftGrund: z.stammkraftGrund || null
          };

          const belegterStammkraftPos = positionen.find(pp => pp.id === belegterMitarbeiter.stammkraft_von);
          result.zuweisung[jokerPos.id] = {
            person: belegterMitarbeiter.name, personId: belegterMitarbeiter.id,
            status: belegterStammkraftPos ? 'kaskade' : 'wolke',
            grund: `Tausch – ${belegterMitarbeiter.name} für ${jokerPos.label} freigetauscht`,
            stammkraftName: result.zuweisung[jokerPos.id]?.stammkraftName || null,
            stammkraftGrund: result.zuweisung[jokerPos.id]?.stammkraftGrund || null
          };

          result.warnungen = result.warnungen.filter(w =>
            !w.includes(`${jokerPos.label} am ${dateISO}`)
          );
          geloest = true;
        }
      }
    }

    // Samstag: Sonderschicht
    // Alle Tage: unzugeteilte aber verfügbare Personen anzeigen
    // Sa: nur wer freien Tag schon hatte (Sonderschicht)
    // Mo-Fr: alle verfügbaren Nicht-Azubis die nicht eingeplant wurden
    if (dayJS === 6) {
      const frueheTage = ['montag','dienstag','mittwoch','donnerstag','freitag'];
      result.sonderschicht = verfuegbar
        .filter(p => !zugewiesen.has(p.id))
        .filter(p => !p.azubi)
        .filter(p => {
          const freierTag = getFreierTag(p.id, weekKey, config.freieTage);
          return freierTag && frueheTage.includes(freierTag);
        })
        .slice(0, 1)
        .map(p => ({ name: p.name, id: p.id }));
    } else {
      result.sonderschicht = [];
    }

    // Alle Tage: wer ist verfügbar aber nicht eingeplant?
    result.verfuegbarUnbesetzt = verfuegbar
      .filter(p => !zugewiesen.has(p.id))
      .filter(p => !p.azubi)
      .map(p => ({ name: p.name, id: p.id }));

    return result;
  }

  function berechneWochenplan(config, weekMonday) {
    return getWeekDates(weekMonday).map(d => berechneTagesplan(config, d));
  }

  // ─── Historische Auswertung freier Tage ─────────────────────────────────

  function getFreierTagHistorie(config, excludeWeekKey) {
    const historie = {};
    for (const [wk, weekData] of Object.entries(config.freieTage || {})) {
      if (wk === excludeWeekKey) continue;
      for (const [personId, entry] of Object.entries(weekData)) {
        const tag = typeof entry === 'string' ? entry : entry.tag;
        if (!tag) continue;
        if (!historie[personId]) historie[personId] = {};
        historie[personId][tag] = (historie[personId][tag] || 0) + 1;
      }
    }
    return historie;
  }

  // ─── Auto-Verteilung Freie Tage ─────────────────────────────────────────

  function autoVerteilFreieTage(config, weekKey) {
    const zuweisung = {};
    const tagZaehler = { montag:0, dienstag:0, mittwoch:0, donnerstag:0, freitag:0, samstag:0 };
    const historie = getFreierTagHistorie(config, weekKey);

    // Bestehende Wunsch/Manuell-Einträge erhalten
    const bestehend = (config.freieTage || {})[weekKey] || {};
    for (const [id, entry] of Object.entries(bestehend)) {
      const typ = typeof entry === 'string' ? 'auto' : entry.typ;
      if (typ === 'wunsch' || typ === 'manuell') {
        const tag = typeof entry === 'string' ? entry : entry.tag;
        zuweisung[id] = { tag, typ };
        tagZaehler[tag] = (tagZaehler[tag] || 0) + 1;
      }
    }

    const personen = (config.personen || []).filter(p => !p.azubi);

    // Wunsch-Tage zuerst
    for (const p of personen) {
      if (zuweisung[p.id]) continue;
      if (p.wunschFreierTag && !(p.gesperrt || []).includes(p.wunschFreierTag)) {
        zuweisung[p.id] = { tag: p.wunschFreierTag, typ: 'wunsch' };
        tagZaehler[p.wunschFreierTag] = (tagZaehler[p.wunschFreierTag] || 0) + 1;
      }
    }

    // Rest: Score-basierte Verteilung
    // Score = aktuelle Wochenlast + historische Häufigkeit × 2
    // Sperrtag der eigenen Stammkraft-Position: leichter Bonus (−0.5)
    // → Samstag rotiert fair, Stammkraft-Bonus ist nur Tiebreaker
    for (const p of personen) {
      if (zuweisung[p.id]) continue;
      const personHistorie = historie[p.id] || {};
      const stammkraftPos = (config.positionen || []).find(pp => pp.id === p.stammkraft_von);
      const sperrtagePos = stammkraftPos?.gesperrtAm || [];

      const verfuegbareTage = Object.keys(tagZaehler)
        .filter(t => !(p.gesperrt || []).includes(t))
        .map(t => ({
          tag: t,
          score: tagZaehler[t]
               + (personHistorie[t] || 0) * 2
               - (sperrtagePos.includes(t) ? 0.5 : 0)
        }))
        .sort((a, b) => a.score - b.score);

      if (verfuegbareTage.length > 0) {
        const { tag } = verfuegbareTage[0];
        zuweisung[p.id] = { tag, typ: 'auto' };
        tagZaehler[tag]++;
      }
    }

    return zuweisung;
  }

  // ─── Varianten der Auto-Verteilung ──────────────────────────────────────

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function autoVerteilVariante(config, weekKey, reihenfolge) {
    // Wie autoVerteilFreieTage, aber mit vorgegebener Personenreihenfolge
    const zuweisung = {};
    const tagZaehler = { montag:0, dienstag:0, mittwoch:0, donnerstag:0, freitag:0, samstag:0 };
    const historie = getFreierTagHistorie(config, weekKey);
    const bestehend = (config.freieTage || {})[weekKey] || {};

    for (const [id, entry] of Object.entries(bestehend)) {
      const typ = typeof entry === 'string' ? 'auto' : entry.typ;
      if (typ === 'wunsch' || typ === 'manuell') {
        const tag = typeof entry === 'string' ? entry : entry.tag;
        zuweisung[id] = { tag, typ };
        tagZaehler[tag] = (tagZaehler[tag] || 0) + 1;
      }
    }

    // Wunsch-Tage zuerst (fix)
    for (const p of reihenfolge) {
      if (zuweisung[p.id]) continue;
      if (p.wunschFreierTag && !(p.gesperrt || []).includes(p.wunschFreierTag)) {
        zuweisung[p.id] = { tag: p.wunschFreierTag, typ: 'wunsch' };
        tagZaehler[p.wunschFreierTag] = (tagZaehler[p.wunschFreierTag] || 0) + 1;
      }
    }

    // Score-Verteilung in der gegebenen Reihenfolge
    for (const p of reihenfolge) {
      if (zuweisung[p.id]) continue;
      const ph = historie[p.id] || {};
      const sPos = (config.positionen || []).find(pp => pp.id === p.stammkraft_von);
      const spTage = sPos?.gesperrtAm || [];
      const tage = Object.keys(tagZaehler)
        .filter(t => !(p.gesperrt || []).includes(t))
        .map(t => ({ tag: t, score: tagZaehler[t] + (ph[t]||0)*2 - (spTage.includes(t)?0.5:0) }))
        .sort((a,b) => a.score - b.score);
      if (tage.length > 0) {
        const { tag } = tage[0];
        zuweisung[p.id] = { tag, typ: 'auto' };
        tagZaehler[tag]++;
      }
    }
    return zuweisung;
  }

  function autoVerteilVarianten(config, weekKey, anzahl = 3) {
    const personen = (config.personen || []).filter(p => !p.azubi);
    const varianten = [];
    const gesehen = new Set();

    // Erste Variante: Standard (original Reihenfolge)
    const standard = autoVerteilFreieTage(config, weekKey);
    const standardKey = JSON.stringify(Object.entries(standard).sort());
    gesehen.add(standardKey);
    varianten.push(standard);

    // Weitere Varianten durch zufällige Reihenfolge
    let versuche = 0;
    while (varianten.length < anzahl && versuche < 20) {
      versuche++;
      const shuffled = shuffle(personen);
      const variante = autoVerteilVariante(config, weekKey, shuffled);
      const key = JSON.stringify(Object.entries(variante).sort());
      if (!gesehen.has(key)) {
        gesehen.add(key);
        varianten.push(variante);
      }
    }
    return varianten;
  }

  // ─── Vorschläge bei Joker-Situationen ───────────────────────────────────

  function berechneVorschlaege(config, weekKey, monday) {
    const wochenplan = berechneWochenplan(config, monday);

    const hatJoker = wochenplan.some(tag =>
      Object.values(tag.zuweisung || {}).some(z => z.status === 'joker')
    );
    if (!hatJoker) return [];

    // Sonderschicht-Kandidaten: könnten Sa frei haben statt Wochentag
    const sonderschichtIds = new Set(
      wochenplan.flatMap(tag => (tag.sonderschicht || []).map(s => s.id))
    );

    const vorschlaege = [];
    const freiMap = (config.freieTage || {})[weekKey] || {};

    const beweglich = Object.entries(freiMap)
      .filter(([, e]) => {
        const typ = typeof e === 'string' ? 'auto' : e.typ;
        return typ === 'auto';
      })
      .map(([id]) => id)
      // Sonderschicht-Kandidaten zuerst prüfen — wahrscheinlichste Lösung
      .sort((a, b) => (sonderschichtIds.has(b) ? 1 : 0) - (sonderschichtIds.has(a) ? 1 : 0));

    const tage = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'];

    for (const personId of beweglich) {
      const person = (config.personen || []).find(p => p.id === personId);
      if (!person) continue;
      const aktuellerTag = getFreierTag(personId, weekKey, config.freieTage);

      // Sonderschicht-Kandidaten bevorzugt auf Samstag verschieben
      const tageReihenfolge = sonderschichtIds.has(personId)
        ? ['samstag', ...tage.filter(t => t !== 'samstag')]
        : tage;

      for (const alterTag of tageReihenfolge) {
        if (alterTag === aktuellerTag) continue;
        if ((person.gesperrt || []).includes(alterTag)) continue;

        const testConfig = JSON.parse(JSON.stringify(config));
        testConfig.freieTage[weekKey][personId] = { tag: alterTag, typ: 'auto' };

        const testPlan = berechneWochenplan(testConfig, monday);
        const testJoker = testPlan.some(tag =>
          Object.values(tag.zuweisung || {}).some(z => z.status === 'joker')
        );

        if (!testJoker) {
          const isSonderschichtFix = sonderschichtIds.has(personId) && alterTag === 'samstag';
          vorschlaege.push({
            personId,
            personName: person.name,
            vonTag: aktuellerTag,
            aufTag: alterTag,
            hint: isSonderschichtFix ? 'löst Joker und Sonderschicht' : null
          });
          break;
        }
      }
      if (vorschlaege.length >= 3) break;
    }

    return vorschlaege;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  return {
    getMondayOfWeek,
    getWeekKey,
    getWeekDates,
    berechneTagesplan,
    berechneWochenplan,
    autoVerteilFreieTage,
    autoVerteilVarianten,
    berechneVorschlaege,
    getFreierTag,
    getFreierTagTyp,
    getFreierTagHistorie,
    dateToISO,
    formatDatum,
    TAG_NAMEN,
    TAG_KURZ
  };

})();
