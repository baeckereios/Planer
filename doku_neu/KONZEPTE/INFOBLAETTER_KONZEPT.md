# Infoblätter — Backstuben-Enzyklopädie
**BäckereiOS · Konzeptdokument · Mai 2026**

---

## Vision

Jedes Produkt bekommt ein eigenes Infoblatt — ein A5-Zettel, ausgedruckt, laminiert, in einer Mappe. Das Wissen das bisher in einzelnen Köpfen lebt, wird dauerhaft festgehalten. Kein Altgeselle, kein Azubi, niemand steht mehr vor der Frage: „Wieviel Hefe?" Das steht auf dem Zettel.

Das Papier ist das Primärprodukt. Die App ist der Weg dorthin.

---

## Grundprinzipien

- **Ein Produkt — ein Blatt.** Käsebrötchen und Schrippen haben unterschiedliche Programme, unterschiedliche Handgriffe — sie bekommen eigene Blätter.
- **Gleiche Struktur überall.** Das Backprogramm steht beim Brötchen dort wo es auch beim Brot steht. Wiedererkennbarkeit ist Lernhilfe.
- **Nur was zutrifft steht drauf.** Leere Abschnitte existieren nicht — ein Produkt ohne Sauerteig hat keinen Sauerteig-Block.
- **Print-first.** Das Layout wird für A5-Druck entworfen. Die digitale Ansicht ist die Vorschau.
- **Mehrsprachigkeit später.** Deutsche Inhalte zuerst vollständig erfassen. Dann Flaggen-UI oben — Übersetzung auf Knopfdruck per API.

---

## Seitenstruktur des Infoblatts

Jedes Blatt hat dieselbe Reihenfolge von möglichen Blöcken. Welche Blöcke aktiv sind, wird pro Produkt per Checkbox festgelegt.

### Block 1 — Schnellübersicht
*Fakten auf einen Blick. Wird größtenteils automatisch aus der `produkt_config.json` gezogen.*

| Feld | Quelle |
|---|---|
| Backprogramm(e) | `ofenprogramme` aus Config |
| Sauerteig benötigt | `sauerteig` aus Config |
| Körner einweichen (Vortag) | `koerner_einweichen` aus Config |
| Stück pro Blech / Charge | `charge` aus Config |
| Station | `station` aus Config |

Kein manueller Eintrag nötig — dieser Block ist bei jedem Produkt automatisch befüllt.

### Block 2 — Teig
*Wissen über den Teigprozess.*

- Knetprogramm (Nummer + Bezeichnung)
- Teigtemperatur
- Teigruhe / Stehzeit
- Besonderheiten beim Kneten
- Worauf ist zu achten (Freitext)
- Zutaten mit Mengenangaben (Freitext — **das ist der „Wieviel Hefe"-Block**)

### Block 3 — Aufbau
*Was muss geformt / gebaut werden.*

- Welche Formen werden verwendet
- Wie wird aufgearbeitet
- Stückzahl pro Einheit
- Besonderheiten beim Formen (Freitext)

### Block 4 — Backen
*Der Ofengang.*

- Vorbereitung (schwaden, einschneiden, belegen, bestreichen)
- Stikken-Belegung
- Backzeit / Kontrolle
- Was passiert nach dem Backen (Freitext)

---

## Datenstruktur — `infoblaetter_db.json`

```json
[
  {
    "legacyKey": "sovital_brot_stueck",
    "aktiveBlöcke": ["teig", "aufbau", "backen"],
    "teig": {
      "knetprogramm": "Programm 3 — 4+6 Minuten",
      "teigtemperatur": "26°C",
      "teigruhe": "30 Minuten abgedeckt",
      "zutaten": "Mehl 10 kg · Wasser 6,5 l · Hefe 120 g · Salz 200 g · ...",
      "besonderheiten": "Teig ist weicher als er aussieht — nicht zu viel Mehl nachgeben."
    },
    "aufbau": {
      "formen": "Kastenform groß",
      "beschreibung": "Teig abwiegen, wirken, in die Form legen. Nicht zu fest drücken.",
      "stueckProEinheit": "2 Laibe pro Form"
    },
    "backen": {
      "vorbereitung": "Einschneiden 1× längs, nicht zu tief",
      "stikkenBelegung": "3 Stikken voll",
      "backzeit": "ca. 55 Minuten — Klopfprobe",
      "nachBacken": "15 Minuten auf Gitter auskühlen vor dem Einschlagen"
    }
  }
]
```

Die Config-Daten (Programmnummern, Sauerteig-Flag etc.) werden beim Rendern live aus der `produkt_config.json` gezogen — sie stehen **nicht** in der `infoblaetter_db.json`. Keine Doppelung, keine Inkonsistenz.

---

## App-Architektur

### `infoblaetter_uebersicht.html`
- Rezeptbuch-Index-Stil — keine Kacheln, kein Akkordeon
- Liste nach Kategorie (Brot / Brötchen / Konditorei / ...)
- Jeder Eintrag: Produktname + kleine Indikator-Badges (Sauerteig, Körner, etc.)
- Tap → Einzelblatt

### `infoblatt.html`
- Aufruf per `?key=sovital_brot_stueck`
- Rendert nur aktive Blöcke
- Zieht Config-Daten automatisch
- Print-Button → A5-Layout
- Später: Flaggen oben für Sprachauswahl

### `infoblatt_editor.html`
- Produkt auswählen
- Checkboxen: welche Blöcke sind aktiv?
- Freitextfelder für die aktiven Blöcke
- Download → `infoblaetter_db.json`

---

## Print-Layout (A5)

- Schmale Kopfzeile: Produktname + Kategorie-Farbe
- Schnellübersicht als kompakte Fakten-Leiste (automatisch)
- Abschnitte klar getrennt, Überschriften klein aber markant
- Keine Navigations-Elemente, keine App-UI
- Barlow Condensed / Fraunces — passt zum bestehenden BäckereiOS-Look
- Fußzeile: BäckereiOS + Datum des letzten Eintrags

---

## Mehrsprachigkeit (später)

1. Deutsche Inhalte vollständig erfassen
2. Flaggen-UI in `infoblatt.html` — z.B. 🇩🇪 🇹🇷 🇦🇿
3. Tap auf Flagge → API-Call übersetzt alle Freitextfelder
4. Übersetzung wird gecacht in der DB (`teig_tr`, `teig_az` etc.)
5. Gedruckte Version: Sprache vor dem Drucken wählen

Claude oder Gemini erledigen die Übersetzungsarbeit — das ist ein API-Call, kein Aufwand.

---

## Offene Fragen

- Soll der `infoblatt_editor.html` in den bestehenden Admin-Bereich integriert werden, oder eigenständige Seite?
- Gibt es Produkte die **kein** Infoblatt brauchen (reine GESAMT-Positionen, Schlawiner-Varianten)?
- Prioritätsliste: welche Produkte werden zuerst befüllt?

---

## Nächste Schritte

1. `infoblaetter_db.json` Grundstruktur anlegen (leer, mit einem Beispiel)
2. `infoblatt_editor.html` — Erfassungsmaske
3. `infoblatt.html` — Einzelblatt-Ansicht mit Print-CSS
4. `infoblaetter_uebersicht.html` — Rezeptbuch-Index
5. Shell.js-Registrierung aller neuen Seiten
6. Inhalte befüllen — das ist die eigentliche Arbeit
