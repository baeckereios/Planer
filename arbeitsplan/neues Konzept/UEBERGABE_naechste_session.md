# Übergabe-Notiz — Session April 2026

> Für den nächsten Chat-Kontext  
> Lade zusätzlich hoch: `schichtplaner_doku.md` und `KONZEPT_planverwaltung.md`

---

## Was in dieser Session gebaut wurde

### Schichtplaner — Refactoring abgeschlossen

Der Monolith `schichtplaner.html` (~2800 Zeilen) wurde vollständig modularisiert:

```
schichtplaner.html          325 Zeilen  ← Skelett + Imports
schichtplaner.css           799 Zeilen
schichtplaner_config.js      ← State, loadConfig, logAenderung
schichtplaner_render.js      ← Wochenplan-Rendering + Änderungs-Badge
schichtplaner_ui.js          ← Modals, Krankheits-Assistent
schichtplaner_freieTage.js   ← Auto-Verteilen, Aktionszentrale
schichtplaner_druck.js       ← drucken(), Export/Import
```

### Algorithmus-Erweiterungen (alle in `fluss_logik.js`)

- **Tag-Gewichte** — konfigurierbar, Mo: 0.5, Sa: 1.0
- **Wunsch-Bonus-System** — ersetzt die alte Wunsch-Vorphase. Wünsche sind jetzt in den Score integriert und unterliegen der Fairness. Konfigurierbar: `wunschBasisBonus` (3), `wunschAbschwaecher` (0.5)
- **Frühschicht-Filter** — Frühschicht-Tage werden als freier Tag gesperrt
- **Anheftungs-Bonus** — bevorzugt Do (nach anfang-Block) bzw Mi (nach ende-Block). Konfigurierbar + Toggle im Editor
- **Krankheits-Assistent** — `berechneKrankheitsOptionen()`: drei Typen (direkt, verschieben, auflösen). Nur aktuelle Woche, nur ab heute, auflösen nur wenn Folgewoche geplant
- **Änderungsprotokoll** — `planAenderungen` im localStorage, orange Badge + `!` in geänderten Zellen

### Config-Editor (`schichtplaner_config.html`)

- Attribut-Sterne (★★★ / ★★ / ★) statt Zahlen
- "Aktiv an"-Checkboxen statt "Gesperrt am" (UI-Invertierung, JSON unverändert)
- Algorithmus-Parameter alle konfigurierbar im Einstellungen-Tab

---

## Offene Konzept-Entscheidungen (für nächste Session)

### Planungstool-Umbau (Schritt 1 der Roadmap)

Der Schichtplaner soll zu einem reinen **Entwurfs-Werkzeug** werden:

1. **Dropdown** — welche Schicht wird bearbeitet (Nacht, Früh, ...)
2. **Leerer Plan** beim Start + "Generieren"-Button statt Auto-Render
3. **Tab "Konfiguration"** — Grundeinstellungen (Feiertags-Verhalten etc.) + Urlaub/Krank-Eingabe
4. **Separate Datei für Abwesenheiten** — damit Planungstool, Notfall-Seite und Konto-Seite dieselbe Quelle nutzen
5. **Export als Optionen A/B/C** mit Status "entwurf"

### Globaler Personen-Pool

Alle Personen in einem Pool mit `stammschicht`-Feld:

```json
{ "id": "lars", "stammschicht": "nacht", "attribute": [...] }
```

**Zwei Modi wenn jemand aus seiner Stammschicht raus muss:**

- **Modus A — "Person nicht da"**: Algorithmus behandelt sie als abwesend (= Krankheits-Mechanismus). Gilt für beide Seiten.
- **Modus B — "Person aus anderer Schicht leihen"**: Checkbox im Plan "Person aus Frühschicht nutzen" — Regeln noch zu definieren (nur wenn Frühschicht genug besetzt, nur bestimmte Positionen etc.)

### Neue Dateien (aus Konzept)

- `schichtplaner_offiziell.json` — autoritative Datei mit Plänen, Konten, Gutscheinen
- `schichtplaner_abwesenheiten.json` — separate Abwesenheits-Datei (Urlaub, Krank) — gemeinsame Quelle für alle Seiten
- `schichtplaner_anzeige.html` — read-only Plan-Anzeige
- `schichtplaner_bestaetigung.html` — PIN-geschützt, Entwurf → offiziell
- `schichtplaner_notfall.html` — Ausfall-Simulator
- `schichtplaner_konto.html` — PIN-geschützt, Guthaben, Gutscheine

### Gutschein-Codes

Format: `BOS-[KW]-[KÜRZEL]-[NR]` — im System hinterlegt, sonst wertlos.

---

## Wichtige Tabu-Zonen (nicht anfassen ohne Rücksprache)

- `fluss_logik.js` Score-Formeln nur nach Rücksprache
- `TAGE_NAMEN_LANG/KURZ` — globale Konstanten, überall genutzt
- Frühschicht-Block-Logik (`FRUEHSCHICHT_ANFANG/ENDE`) — Änderungen ziehen durch alles

---

## Dateien die deployed werden müssen

Aus dieser Session neu/geändert:
- `schichtplaner.html`
- `schichtplaner.css`
- `schichtplaner_config.js`
- `schichtplaner_render.js`
- `schichtplaner_ui.js`
- `schichtplaner_freieTage.js`
- `schichtplaner_druck.js`
- `fluss_logik.js`
- `schichtplaner_config.html`
- `schichtplaner_config.json`

---

*Erstellt: April 2026 · [Claude]*  
*Nächste Session beginnt mit: Schichtplaner-Umbau (Dropdown, leerer Plan, Konfig-Tab)*
