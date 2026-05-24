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
    // Spontane Fehlzeiten (localStorage)
    const spontan = (fehlzeiten || []).some(f =>
      f.personId === personId &&
      dateISO >= f.von &&
      dateISO <= f.bis
    );
    return spontan;
  }

  function isPersonFehlendGesamt(personId, dateISO, config) {
    // Spontane Fehlzeiten + geplanter Urlaub aus Config
    if (isPersonFehlend(personId, dateISO, config.fehlzeiten)) return true;
    const urlaubEintraege = (config.urlaub || {})[personId] || [];
    return urlaubEintraege.some(e =>
      e.von && e.bis && dateISO >= e.von && dateISO <= e.bis
    );
  }

  // ─── Frühschicht-Check ───────────────────────────────────────────────────

  const FRUEHSCHICHT_ANFANG = ['montag','dienstag','mittwoch'];
  const FRUEHSCHICHT_ENDE   = ['donnerstag','freitag','samstag'];

  function isPersonFruehschicht(personId, tagName, dateISO, config) {
    return (config.fruehschichtEinsaetze || []).some(e =>
      e.personId === personId &&
      dateISO >= e.von &&
      dateISO <= e.bis &&
      (e.block === 'custom'
        ? (e.tage || []).includes(tagName)
        : e.block === 'anfang'
          ? FRUEHSCHICHT_ANFANG.includes(tagName)
          : FRUEHSCHICHT_ENDE.includes(tagName))
    );
  }

  // Für die Freie-Tage-Verteilung: nur Wochenschlüssel bekannt, kein genaues Datum
  function isPersonFruehschichtInWoche(personId, tagName, weekKey, config) {
    return (config.fruehschichtEinsaetze || []).some(e => {
      if (e.personId !== personId) return false;
      const block = e.block === 'custom'
        ? (e.tage || [])
        : e.block === 'anfang' ? FRUEHSCHICHT_ANFANG : FRUEHSCHICHT_ENDE;
      if (!block.includes(tagName)) return false;
      const vonWoche = getWeekKey(new Date(e.von));
      const bisWoche = getWeekKey(new Date(e.bis));
      return weekKey >= vonWoche && weekKey <= bisWoche;
    });
  }

  // Welchen Block hat eine Person diese Woche in der Frühschicht? → 'anfang' | 'ende' | null
  // 'anfang' = Mo/Di/Mi → freier Tag muss auf Do/Fr/Sa liegen
  // 'ende'   = Do/Fr/Sa → freier Tag muss auf Mo/Di/Mi liegen
  function _getFruehschichtBlock(personId, weekKey, config) {
    const einsatz = (config.fruehschichtEinsaetze || []).find(e => {
      if (e.personId !== personId) return false;
      const vonWoche = getWeekKey(new Date(e.von));
      const bisWoche = getWeekKey(new Date(e.bis));
      return weekKey >= vonWoche && weekKey <= bisWoche;
    });
    if (!einsatz) return null;
    // custom-Block: gibt tage-Array zurück statt string
    if (einsatz.block === 'custom') return { block: 'custom', tage: einsatz.tage || [] };
    return einsatz.block;
  }

  function getFruehschichtPerson(tagName, dateISO, config) {
    const einsatz = (config.fruehschichtEinsaetze || []).find(e =>
      dateISO >= e.von &&
      dateISO <= e.bis &&
      (e.block === 'anfang'
        ? FRUEHSCHICHT_ANFANG.includes(tagName)
        : FRUEHSCHICHT_ENDE.includes(tagName))
    );
    if (!einsatz) return null;
    const person = (config.personen || []).find(p => p.id === einsatz.personId);
    return person ? { name: person.name, id: person.id } : null;
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
    if (isPersonFehlendGesamt(person.id, dateISO, config)) return false;
    if (isPersonFruehschicht(person.id, tagName, dateISO, config)) return false;
    const frei = getFreierTag(person.id, weekKey, config.freieTage);
    if (frei === tagName) return false;
    return true;
  }

  function getAbwesenheitsGrund(person, tagName, dateISO, weekKey, config) {
    if ((person.gesperrt || []).includes(tagName)) return 'gesperrt';
    const fehlGrund = getFehlzeitGrund(person.id, dateISO, config.fehlzeiten);
    if (fehlGrund) return fehlGrund;
    // Geplanter Urlaub aus Config
    const urlaubEintraege = (config.urlaub || {})[person.id] || [];
    if (urlaubEintraege.some(e => e.von && e.bis && dateISO >= e.von && dateISO <= e.bis)) return 'urlaub';
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

    // In Frühschicht-Wochen: Azubi automatisch für 22 Uhr sperren
    // Logik: wenn jemand diese Woche in der Frühschicht ist, sind wir
    // überbesetzt → Azubi soll lernen, nicht 22 Uhr füllen
    const hatFruehschichtDieseWoche = (config.fruehschichtEinsaetze || []).some(e => {
      const vonWoche = getWeekKey(new Date(e.von));
      const bisWoche = getWeekKey(new Date(e.bis));
      return weekKey >= vonWoche && weekKey <= bisWoche;
    });
    const azubiGesperrt = [
      ...(config.azubiGesperrteAttribute || ['versand']),
      ...(hatFruehschichtDieseWoche ? ['22uhr'] : [])
    ];
    const getKandidaten = (pos, pool, zugewiesenSet) =>
      pool
        .filter(p => !zugewiesenSet.has(p.id))
        .filter(p => (p.attribute || []).includes(pos.attribut))
        .filter(p => !(p.azubi && azubiGesperrt.includes(pos.attribut)));

    // ── Manuelle Vorbelegung VOR dem Algorithmus ─────────────────────────
    // Manuelle Overrides respektieren keinen freien Tag — nur krank/gesperrt blockiert
    const manOverrides = (config.manuelleZuweisungen || {})[dateISO] || {};
    for (const [posId, personId] of Object.entries(manOverrides)) {
      if (!personId) continue;
      const pos = positionen.find(p => p.id === posId);
      if (!pos) continue;
      if ((pos.gesperrtAm || []).includes(tagName)) continue;

      // Platzhalter: kein echter Mitarbeiter, einfach anzeigen
      if (personId.startsWith('__')) {
        result.zuweisung[posId] = {
          person: personId.slice(2), personId,
          status: 'manuell', grund: 'Platzhalter'
        };
        continue; // Position gilt als besetzt, kein echte Person in zugewiesen
      }

      const person = personen.find(p => p.id === personId);
      if (!person) continue;
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
        if (belegterMitarbeiter.azubi && azubiGesperrt.includes(jokerPos.attribut)) continue;

        // Gibt es jemanden der die aktuelle Position übernehmen kann?
        const ersatz = verfuegbar
          .filter(p => !zugewiesen.has(p.id))
          .filter(p => (p.attribute || []).includes(aktuellePos.attribut))
          .filter(p => !(p.azubi && azubiGesperrt.includes(aktuellePos.attribut)))
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

    // Frühschicht: wer ist heute in der Frühschicht?
    result.fruehschicht = getFruehschichtPerson(tagName, dateISO, config);
    result.azubiGesperrt22 = hatFruehschichtDieseWoche;

    return result;
  }

  function berechneWochenplan(config, weekMonday) {
    return getWeekDates(weekMonday).map(d => berechneTagesplan(config, d));
  }

  // ─── Historische Auswertung freier Tage ─────────────────────────────────

  function getFreierTagHistorie(config, excludeWeekKey) {
    const historie = {};
    const wunschGewicht = config.wunschGewicht !== undefined ? config.wunschGewicht : 1.5;
    for (const [wk, weekData] of Object.entries(config.freieTage || {})) {
      if (wk === excludeWeekKey) continue;
      for (const [personId, entry] of Object.entries(weekData)) {
        const tag = typeof entry === 'string' ? entry : entry.tag;
        if (!tag) continue;
        const typ = typeof entry === 'string' ? 'auto' : (entry.typ || 'auto');
        // Wunsch-Einträge zählen schwerer — sie sind dauerhaft, kein Zufall
        const gewicht = typ === 'wunsch' ? wunschGewicht : 1;
        if (!historie[personId]) historie[personId] = {};
        historie[personId][tag] = (historie[personId][tag] || 0) + gewicht;
      }
    }
    return historie;
  }

  // Montag aus WeekKey berechnen (für Plan-Simulation)
  function getMondayFromWeekKey(weekKey) {
    const [yearStr, weekStr] = weekKey.split('-W');
    const year = parseInt(yearStr), week = parseInt(weekStr);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dow = jan4.getUTCDay() || 7;
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  }

  // Wie oft wurde der Wunsch-Freitag einer Person tatsächlich erfüllt?
  // Zählt nur Einträge bei denen typ === 'wunsch' UND tag === person.wunschFreierTag
  function getWunschErfuelltHistorie(config, excludeWeekKey) {
    const zaehler = {};
    for (const [wk, weekData] of Object.entries(config.freieTage || {})) {
      if (wk === excludeWeekKey) continue;
      for (const [personId, entry] of Object.entries(weekData)) {
        const typ = typeof entry === 'string' ? 'auto' : (entry.typ || 'auto');
        if (typ !== 'wunsch') continue;
        const tag = typeof entry === 'string' ? entry : entry.tag;
        const person = (config.personen || []).find(p => p.id === personId);
        if (!person?.wunschFreierTag) continue;
        if (tag === person.wunschFreierTag) {
          zaehler[personId] = (zaehler[personId] || 0) + 1;
        }
      }
    }
    return zaehler;
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
      if (typ === 'wunsch' || typ === 'manuell' || typ === 'versprochen') {
        const tag = typeof entry === 'string' ? entry : entry.tag;
        zuweisung[id] = { tag, typ };
        tagZaehler[tag] = (tagZaehler[tag] || 0) + 1;
      }
    }

    const personen = (config.personen || []).filter(p => !p.azubi);

    // Wunsch-Erfüllungs-Historie — wie oft hat jede Person ihren Wunsch schon bekommen?
    const wunschHistorie = getWunschErfuelltHistorie(config, weekKey);

    // Rest: Nicht-22uhr-Personen zuerst, dann 22uhr-Personen
    // → Wenn Marcel (22uhr) seinen Tag bekommt, sind Rosa/Harrison etc.
    //   schon verteilt und die Simulation kennt den echten Stand
    const personenSortiert = [...personen].sort((a, b) => {
      const a22 = (a.attribute || []).includes('22uhr') ? 1 : 0;
      const b22 = (b.attribute || []).includes('22uhr') ? 1 : 0;
      return a22 - b22;
    });

    // Rest: Score-basierte Verteilung mit Plan-Simulation
    // Für jeden Kandidaten-Tag wird der tatsächliche Plan simuliert
    // und geprüft ob 22 Uhr beim Azubi landet → +10 Strafe
    const wochenmontag = getMondayFromWeekKey(weekKey);
    const wochentage = getWeekDates(wochenmontag);
    const tagIndex = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'];
    const azubi = (config.personen || []).find(p => p.azubi);

    for (const p of personenSortiert) {
      if (zuweisung[p.id]) continue;
      const personHistorie = historie[p.id] || {};
      const stammkraftPos = (config.positionen || []).find(pp => pp.id === p.stammkraft_von);
      const sperrtagePos = stammkraftPos?.gesperrtAm || [];

      // Frühschicht-Tage dieser Person sind als freier Tag gesperrt
      const fruehBlock = _getFruehschichtBlock(p.id, weekKey, config);
      const fruehsperreTage = fruehBlock === 'anfang' ? FRUEHSCHICHT_ANFANG
        : fruehBlock === 'ende' ? FRUEHSCHICHT_ENDE
        : (fruehBlock?.block === 'custom' ? fruehBlock.tage : []);

      const verfuegbareTage = Object.keys(tagZaehler)
        .filter(t => !(p.gesperrt || []).includes(t))
        .filter(t => !fruehsperreTage.includes(t))
        .map(t => {
          let azubiStrafe = 0;
          const tIdx = tagIndex.indexOf(t);
          if (tIdx >= 0 && azubi && wochentage[tIdx]) {
            const testConfig = JSON.parse(JSON.stringify(config));
            if (!testConfig.freieTage) testConfig.freieTage = {};
            if (!testConfig.freieTage[weekKey]) testConfig.freieTage[weekKey] = {};
            Object.entries(zuweisung).forEach(([id, e]) => {
              testConfig.freieTage[weekKey][id] = e;
            });
            testConfig.freieTage[weekKey][p.id] = { tag: t, typ: 'auto' };
            const testPlan = berechneTagesplan(testConfig, wochentage[tIdx]);
            const azubiAuf22uhr = Object.entries(testPlan.zuweisung).some(([posId, z]) => {
              const pos = (config.positionen || []).find(pp => pp.id === posId);
              return pos?.attribut === '22uhr' && z.personId === azubi.id;
            });
            if (azubiAuf22uhr) azubiStrafe = 10;
          }

          // Anheftungs-Bonus: freier Tag direkt an den Frühschicht-Block angehängt
          const anheftungsBonus = (config.fruehschichtFreitagAnheften !== false && fruehBlock && fruehBlock !== 'custom' && fruehBlock?.block !== 'custom')
            ? (fruehBlock === 'anfang' && t === 'donnerstag' ? -4 : 0)
              + (fruehBlock === 'ende'   && t === 'mittwoch'   ? -4 : 0)
            : 0;

          // Wunsch-Bonus: zieht den Wunschtag vor, schwächt sich mit jeder Erfüllung ab
          const wunschErfuellt = wunschHistorie[p.id] || 0;
          const wunschBasis = config.wunschBasisBonus !== undefined ? config.wunschBasisBonus : 3;
          const wunschAbschwaecher = config.wunschAbschwaecher !== undefined ? config.wunschAbschwaecher : 0.5;
          const wunschBonus = (p.wunschFreierTag === t && !fruehsperreTage.includes(t))
            ? -wunschBasis + wunschErfuellt * wunschAbschwaecher
            : 0;

          return {
            tag: t,
            score: tagZaehler[t]
                 + (personHistorie[t] || 0) * 2
                 - (sperrtagePos.includes(t) ? 0.5 : 0)
                 + azubiStrafe
                 + ((config.tagGewichte || {})[t] || 0)
                 + anheftungsBonus
                 + wunschBonus
          };
        })
        .sort((a, b) => a.score - b.score);

      if (verfuegbareTage.length > 0) {
        const { tag } = verfuegbareTage[0];
        const typ = (p.wunschFreierTag === tag) ? 'wunsch' : 'auto';
        zuweisung[p.id] = { tag, typ };
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
      if (typ === 'wunsch' || typ === 'manuell' || typ === 'versprochen') {
        const tag = typeof entry === 'string' ? entry : entry.tag;
        zuweisung[id] = { tag, typ };
        tagZaehler[tag] = (tagZaehler[tag] || 0) + 1;
      }
    }

    // Wunsch-Erfüllungs-Historie — gleiche Logik wie in autoVerteilFreieTage
    const wunschHistorieV = getWunschErfuelltHistorie(config, weekKey);

    // Score-Verteilung in der gegebenen Reihenfolge
    const alle22uhrF = (config.personen || []).filter(p =>
      !p.azubi && (p.attribute || []).includes('22uhr')
    );
    for (const p of reihenfolge) {
      if (zuweisung[p.id]) continue;
      const ph = historie[p.id] || {};
      const sPos = (config.positionen || []).find(pp => pp.id === p.stammkraft_von);
      const spTage = sPos?.gesperrtAm || [];
      // Frühschicht-Tage dieser Person sind als freier Tag gesperrt
      const fruehBlockV = _getFruehschichtBlock(p.id, weekKey, config);
      const fruehsperreTageV = fruehBlockV === 'anfang' ? FRUEHSCHICHT_ANFANG
        : fruehBlockV === 'ende' ? FRUEHSCHICHT_ENDE
        : (fruehBlockV?.block === 'custom' ? fruehBlockV.tage : []);
      const tage = Object.keys(tagZaehler)
        .filter(t => !(p.gesperrt || []).includes(t))
        .filter(t => !fruehsperreTageV.includes(t))
        .map(t => {
          const noch22uhr = alle22uhrF.filter(q => {
            if (q.id === p.id) return false;
            if ((q.gesperrt || []).includes(t)) return false;
            const qFrei = zuweisung[q.id]?.tag;
            if (qFrei === t) return false;
            if (isPersonFruehschichtInWoche(q.id, t, weekKey, config)) return false;
            return true;
          }).length;
          const anheftungsBonusV = (config.fruehschichtFreitagAnheften !== false && fruehBlockV && fruehBlockV !== 'custom' && fruehBlockV?.block !== 'custom')
            ? (fruehBlockV === 'anfang' && t === 'donnerstag' ? -4 : 0)
              + (fruehBlockV === 'ende'   && t === 'mittwoch'   ? -4 : 0)
            : 0;
          const wunschErfuelltV = wunschHistorieV[p.id] || 0;
          const wunschBasisV = config.wunschBasisBonus !== undefined ? config.wunschBasisBonus : 3;
          const wunschAbschwV = config.wunschAbschwaecher !== undefined ? config.wunschAbschwaecher : 0.5;
          const wunschBonusV = (p.wunschFreierTag === t && !fruehsperreTageV.includes(t))
            ? -wunschBasisV + wunschErfuelltV * wunschAbschwV
            : 0;
          return {
            tag: t,
            score: tagZaehler[t] + (ph[t]||0)*2
                 - (spTage.includes(t)?0.5:0)
                 + (noch22uhr < 2 ? 6 : 0)
                 + ((config.tagGewichte || {})[t] || 0)
                 + anheftungsBonusV
                 + wunschBonusV
          };
        })
        .sort((a,b) => a.score - b.score);
      if (tage.length > 0) {
        const { tag } = tage[0];
        const typ = (p.wunschFreierTag === tag) ? 'wunsch' : 'auto';
        zuweisung[p.id] = { tag, typ };
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
    const freiMap = (config.freieTage || {})[weekKey] || {};
    const tage = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'];
    const vorschlaege = [];
    const bereitsBewegt = new Set();

    const jokerTage = wochenplan.filter(tag =>
      Object.values(tag.zuweisung || {}).some(z => z.status === 'joker')
    );
    if (jokerTage.length === 0) return [];

    for (const tag of jokerTage) {
      // 22uhr-fähige Personen zuerst — sie können den Joker direkt füllen
      const beweglich = Object.entries(freiMap)
        .filter(([id, e]) => {
          if (bereitsBewegt.has(id)) return false;
          const typ = typeof e === 'string' ? 'auto' : e.typ;
          if (typ !== 'auto') return false;
          const aktTag = typeof e === 'string' ? e : e.tag;
          return aktTag === tag.tag;
        })
        .map(([id]) => id)
        .sort((a, b) => {
          const pa = (config.personen || []).find(p => p.id === a);
          const pb = (config.personen || []).find(p => p.id === b);
          const a22 = (pa?.attribute || []).includes('22uhr') ? 0 : 1;
          const b22 = (pb?.attribute || []).includes('22uhr') ? 0 : 1;
          return a22 - b22;
        });

      for (const personId of beweglich) {
        const person = (config.personen || []).find(p => p.id === personId);
        if (!person) continue;
        const aktuellerTag = tag.tag;

        for (const alterTag of tage) {
          if (alterTag === aktuellerTag) continue;
          if ((person.gesperrt || []).includes(alterTag)) continue;

          const testConfig = JSON.parse(JSON.stringify(config));
          if (!testConfig.freieTage) testConfig.freieTage = {};
          if (!testConfig.freieTage[weekKey]) testConfig.freieTage[weekKey] = {};
          testConfig.freieTage[weekKey][personId] = { tag: alterTag, typ: 'auto' };

          const testPlan = berechneWochenplan(testConfig, monday);

          // Gesamtanzahl Joker in der Woche vor und nach dem Tausch
          const jokerVorher = wochenplan.reduce((sum, t) =>
            sum + Object.values(t.zuweisung || {}).filter(z => z.status === 'joker').length, 0
          );
          const jokerNachher = testPlan.reduce((sum, t) =>
            sum + Object.values(t.zuweisung || {}).filter(z => z.status === 'joker').length, 0
          );
          // Nur akzeptieren wenn die Gesamtzahl der Joker sinkt
          if (jokerNachher >= jokerVorher) continue;

          vorschlaege.push({
            personId,
            personName: person.name,
            vonTag: aktuellerTag,
            aufTag: alterTag,
            hint: null
          });
          bereitsBewegt.add(personId);
          break;
        }
        if (bereitsBewegt.has(personId)) break;
      }
    }

    return vorschlaege.slice(0, 3);
  }

  // ─── Krankheits-Assistent ───────────────────────────────────────────────

  // Gibt Optionen zurück wie die Lücke gefüllt werden kann die eine kranke Person hinterlässt.
  // Priorität: direkt (kein Seiteneffekt) → verschieben (freier Tag rückt vor) → auflösen (Versprechen Folgewoche)
  function berechneKrankheitsOptionen(config, weekKey, monday, krankePersonId, datum) {
    const tageNamen = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag'];

    // Plan MIT Fehlzeit (bereits gespeichert) — zeigt aktuelle Joker
    const wochenplan = berechneWochenplan(config, monday);
    const tagPlan = wochenplan.find(t => t.datum === datum);
    if (!tagPlan) return [];

    const tagName = tagPlan.tag;
    const tagIdx = tageNamen.indexOf(tagName);

    // Plan OHNE Fehlzeit — zeigt was vorher besetzt war
    const configOhne = JSON.parse(JSON.stringify(config));
    configOhne.fehlzeiten = (configOhne.fehlzeiten || [])
      .filter(f => !(f.personId === krankePersonId && datum >= f.von && datum <= f.bis));
    const planOhne = berechneWochenplan(configOhne, monday);
    const tagOhne = planOhne.find(t => t.datum === datum);

    // Betroffene Positionen: waren vorher besetzt (nicht Joker), sind jetzt Joker
    const betroffenePositionen = Object.entries(tagPlan.zuweisung || {})
      .filter(([posId, z]) => {
        if (z.status !== 'joker') return false;
        const vorher = tagOhne?.zuweisung[posId];
        return vorher && vorher.status !== 'joker';
      })
      .map(([posId]) => posId);

    if (betroffenePositionen.length === 0) return [];

    const optionen = [];
    const personen = (config.personen || []).filter(p => !p.azubi && p.id !== krankePersonId);

    for (const posId of betroffenePositionen) {
      const pos = (config.positionen || []).find(p => p.id === posId);
      if (!pos) continue;

      const kandidaten = personen.filter(person => {
        // Muss Attribut haben
        if (!(person.attribute || []).includes(pos.attribut)) return false;
        // Nicht krank
        if ((config.fehlzeiten || []).some(f =>
          f.personId === person.id && datum >= f.von && datum <= f.bis)) return false;
        // Nicht gesperrt
        if ((person.gesperrt || []).includes(tagName)) return false;
        // Nicht Frühschicht
        if (isPersonFruehschicht(person.id, tagName, datum, config)) return false;
        // Nicht schon auf einer Position
        if (Object.values(tagPlan.zuweisung || {}).some(z => z.personId === person.id)) return false;
        return true;
      });

      // Pro Kandidat: welchen Typ hat die Option?
      const direktKandidaten = [];
      const verschiebenKandidaten = [];
      const aufloesKandidaten = [];

      for (const person of kandidaten) {
        const freiTagHeute = getFreierTag(person.id, weekKey, config.freieTage);
        const freiTyp = getFreierTagTyp(person.id, weekKey, config.freieTage);

        if (freiTagHeute !== tagName) {
          // Direkt verfügbar — kein freier Tag heute oder fester Wunsch
          direktKandidaten.push({ person, typ: 'direkt' });
        } else if (freiTyp === 'auto') {
          // Freier Tag ist heute und auto-gesetzt — kann verschoben werden
          // Spätere freie Tage dieser Woche suchen (nach heute)
          const spaetertage = tageNamen.slice(tagIdx + 1).filter(t => {
            if ((person.gesperrt || []).includes(t)) return false;
            const tPlan = wochenplan.find(tp => tp.tag === t);
            if (!tPlan) return false;
            // Nicht schon auf einer Position an diesem Tag
            if (Object.values(tPlan.zuweisung || {}).some(z => z.personId === person.id)) return false;
            return true;
          });

          if (spaetertage.length > 0) {
            // Samstag bevorzugen, sonst spätester verfügbarer Tag
            const neuerTag = spaetertage.includes('samstag')
              ? 'samstag'
              : spaetertage[spaetertage.length - 1];
            verschiebenKandidaten.push({ person, typ: 'freitag_verschieben', neuerFreierTag: neuerTag });
          } else {
            // Kein späterer Tag mehr — Versprechen Folgewoche
            const [year, week] = weekKey.split('-W').map(Number);
            const naechsteWoche = week >= 52 ? `${year + 1}-W01` : `${year}-W${String(week + 1).padStart(2, '0')}`;
            aufloesKandidaten.push({ person, typ: 'freitag_aufloesen', versprechenWK: naechsteWoche });
          }
        }
        // Wunsch-freier Tag (typ === 'wunsch') → nicht anfassen, das ist ein Versprechen
      }

      // Beste Option pro Position: direkt > verschieben > auflösen, max 2 Optionen pro Position
      const alleKandidaten = [...direktKandidaten, ...verschiebenKandidaten, ...aufloesKandidaten];
      for (const k of alleKandidaten.slice(0, 2)) {
        optionen.push({
          typ: k.typ,
          personId: k.person.id,
          personName: k.person.name,
          posId,
          posLabel: pos.label,
          datum,
          tagName,
          neuerFreierTag: k.neuerFreierTag || null,
          versprechenWK: k.versprechenWK || null,
          weekKey
        });
      }
    }

    return optionen;
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
    berechneKrankheitsOptionen,
    getFreierTag,
    getFreierTagTyp,
    getFreierTagHistorie,
    isPersonFruehschicht,
    getFruehschichtPerson,
    dateToISO,
    formatDatum,
    TAG_NAMEN,
    TAG_KURZ
  };

})();
