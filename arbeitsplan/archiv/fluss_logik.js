/**
 * FLUSS_LOGIK.js
 * Reines Rechenmodul – kein DOM, keine Seiteneffekte.
 * Einbinden via <script src="fluss_logik.js"> vor dem Haupt-Script.
 */

const FLUSS_LOGIK = (function () {

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
    return (freieTage || {})[weekKey]?.[personId] || null;
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
    if (frei === tagName) return 'frei';
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

    // Pass 1: Stammkräfte zuerst
    for (const pos of aktivPositionen) {
      const stammkraft = personen.find(p => p.stammkraft_von === pos.id);
      if (!stammkraft) continue;

      const istVerfuegbar = verfuegbar.find(p => p.id === stammkraft.id);
      if (istVerfuegbar && !zugewiesen.has(stammkraft.id)) {
        result.zuweisung[pos.id] = {
          person: stammkraft.name,
          personId: stammkraft.id,
          status: 'stammkraft',
          grund: 'Stammkraft'
        };
        zugewiesen.add(stammkraft.id);
      } else if (!istVerfuegbar) {
        // Stammkraft fehlt – Grund festhalten für Anzeige
        const grund = getAbwesenheitsGrund(stammkraft, tagName, dateISO, weekKey, config);
        result.zuweisung[pos.id] = {
          person: null,
          personId: null,
          status: 'offen',
          stammkraftName: stammkraft.name,
          stammkraftGrund: grund
        };
      }
    }

    // Pass 2: Kaskade für offene und stammkraftlose Positionen
    for (const pos of aktivPositionen) {
      const current = result.zuweisung[pos.id];
      if (current && current.status !== 'offen') continue;

      const kandidaten = verfuegbar
        .filter(p => !zugewiesen.has(p.id))
        .filter(p => (p.attribute || []).includes(pos.attribut))
        .filter(p => {
          // Azubi darf keine Versand-Positionen füllen
          if (p.azubi && pos.attribut === 'versand') return false;
          return true;
        })
        .sort((a, b) =>
          // Sortierung nach Priorität des Attributs in der Personenliste
          (a.attribute || []).indexOf(pos.attribut) -
          (b.attribute || []).indexOf(pos.attribut)
        );

      if (kandidaten.length > 0) {
        const p = kandidaten[0];
        const stammkraftPos = positionen.find(pp => pp.id === p.stammkraft_von);
        result.zuweisung[pos.id] = {
          person: p.name,
          personId: p.id,
          status: stammkraftPos ? 'kaskade' : 'wolke',
          grund: stammkraftPos
            ? `Kaskade – ${p.name} normalerweise ${stammkraftPos.label}`
            : `Aus Wolke`,
          stammkraftName: current?.stammkraftName || null,
          stammkraftGrund: current?.stammkraftGrund || null
        };
        zugewiesen.add(p.id);
      } else {
        result.zuweisung[pos.id] = {
          person: config.joker || 'Joker',
          personId: null,
          status: 'joker',
          grund: 'Kein qualifizierter Mitarbeiter verfügbar',
          stammkraftName: current?.stammkraftName || null,
          stammkraftGrund: current?.stammkraftGrund || null
        };
        result.warnungen.push(`Joker für ${pos.label} am ${dateISO}`);
      }
    }

    return result;
  }

  function berechneWochenplan(config, weekMonday) {
    return getWeekDates(weekMonday).map(d => berechneTagesplan(config, d));
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  return {
    getMondayOfWeek,
    getWeekKey,
    getWeekDates,
    berechneTagesplan,
    berechneWochenplan,
    dateToISO,
    formatDatum,
    TAG_NAMEN,
    TAG_KURZ
  };

})();
