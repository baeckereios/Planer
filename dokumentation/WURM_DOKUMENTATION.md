# Der Wurm — Dokumentation
> BäckereiOS · Stand: April 2026

---

## Was ist der Wurm?

Der Wurm ist ein **automatisch wanderndes Berechnungsfenster** für den Tagesdurchschnittsverbrauch.

Ohne Wurm: Ein festes Zeitfenster (z.B. 14 Tage) muss manuell gesetzt werden — und veraltet stillschweigend.  
Mit Wurm: Das Fenster folgt täglich automatisch dem aktuellen Datum. Es kriecht vorwärts, ohne dass jemand eingreifen muss.

Der Name ist Programm: Ein Wurm der sich durch den Kalender frisst — immer genau `N` Tage hinter dem heutigen Datum.

---

## Verhalten

### Normalbetrieb (läuft)

```
Ende   = gestern
Start  = gestern − (zeitraum_tage − 1)
```

Das Fenster wandert täglich einen Tag weiter. Kein Eingriff nötig.

### Einfrieren

Wenn ein **gesetzlicher Feiertag** im aktuellen Rückblick-Fenster liegt, friert der Wurm ein.

- Er bewegt sich nicht weiter
- Er hält den **letzten sauberen Schnitt** (das letzte feiertagsfreie Fenster)
- An Feiertagen läuft der Verkauf so anders, dass die Zahlen den echten Bedarf verfälschen würden

**Mehrere Feiertage hintereinander** (z.B. Karfreitag + Ostermontag): Der Wurm wartet geduldig auf den letzten. Es beginnt keine neue Zeitrechnung, solange noch ein Feiertag im Fenster liegt.

### Auftauen

Der Wurm läuft wieder, sobald der **letzte Feiertag vollständig aus dem Fenster herausgefallen** ist — d.h. alle `zeitraum_tage` Tage seit dem Feiertag sind vergangen.

### Ferien & Sondertage

Ferien und sonstige Sondertage lösen **kein Einfrieren** aus. Dort passt sich der Durchschnitt schleichend an — das ist gewollt. Nur gesetzliche Feiertage (NDS) stoppen den Wurm.

### Manueller Modus

Wenn `wurm_aktiv: false` in `taeglicher_verbrauch.json`, schläft der Wurm. Ein Admin hat das Fenster manuell über `start_datum`/`end_datum` festgelegt. Im manuellen Modus werden diese Felder in `taeglicher_verbrauch.json` gespeichert; im Wurm-Modus werden sie weggelassen.

---

## Betroffene Dateien

| Datei | Rolle |
|---|---|
| `taeglicher_verbrauch.json` | Konfiguration — enthält `wurm_aktiv` (bool) und `zeitraum_tage` |
| `produktions_gehirn.js` | Berechnet das Fenster dynamisch, setzt `window.BOS_GEHIRN.wurmStatus` |
| `dioden_gehirn.js` | Liest `wurmStatus`, steuert `diode-wurm` im Cockpit |
| `index.html` | Cockpit-Diode + Habitat-Banner mit Live-Status |
| `wurm.html` | Statusseite für alle Nutzer |
| `AdminTools/wochenconfig_editor.html` | Wurm-Toggle im Berechnungsbereich, schreibt `taeglicher_verbrauch.json` |
| `shell.js` | `wurm.html` in PAGE_CONFIG registriert (`tab: 'start'`) |

---

## Datenstruktur

### `taeglicher_verbrauch.json`

```json
{
  "zeitraum_tage": 14,
  "wurm_aktiv": true,
  "feiertage_ausschliessen": true,
  "sondertage_ausschliessen": true,
  "ausgeschlossene_tage": []
}
```

Im manuellen Modus (`wurm_aktiv: false`) kommen `start_datum` und `end_datum` dazu:

```json
{
  "zeitraum_tage": 14,
  "wurm_aktiv": false,
  "start_datum": "2026-03-15",
  "end_datum":   "2026-03-28",
  "feiertage_ausschliessen": true,
  "sondertage_ausschliessen": true,
  "ausgeschlossene_tage": []
}
```

### `window.BOS_GEHIRN.wurmStatus`

Nach `BOS_GEHIRN.init()` verfügbar:

```js
{
  aktiv:       true,       // wurm_aktiv aus JSON
  eingefroren: false,      // true wenn Feiertag im Fenster
  start:       "2026-03-29",  // ISO-String
  ende:        "2026-04-11"   // ISO-String (= gestern wenn läuft)
}
```

---

## Logik-Kern (`produktions_gehirn.js`)

```
wurmFenster(zeitraum):
  gestern = heute − 1

  wenn [gestern − zeitraum .. gestern] feiertagsfrei:
    → läuft: start = gestern − (zeitraum−1), ende = gestern

  sonst (eingefroren):
    suche rückwärts (max. 365 Tage) nach letztem
    feiertagsfreien Fenster der Länge zeitraum
    → gibt { start, ende, eingefroren: true } zurück
```

Der Feiertags-Check läuft gegen die interne `FEIERTAGE_NDS`-Liste in `produktions_gehirn.js` (2025–2027). Bei Jahreswechsel muss diese Liste erweitert werden.

---

## Cockpit-Diode (`diode-wurm`)

Rein darstellend — kein Ein-/Ausschalten über die Diode.

| Zustand | Farbe | CSS-Klasse |
|---|---|---|
| Wurm läuft | Grün, pulsierend | `leuchtet leuchtet-gruen` |
| Wurm eingefroren | Amber, langsam pulsierend | `leuchtet wurm-eingefroren` |
| Manueller Modus | Aus (gedimmt) | — |

Icon: `ph-fill ph-wave-sine`

Die Diode liest zuerst `window.BOS_GEHIRN.wurmStatus` (wenn BOS_GEHIRN bereits initialisiert). Fallback: direkter Fetch auf `taeglicher_verbrauch.json` mit eigenem Feiertags-Check.

---

## Habitat-Banner (`index.html`)

Zwischen dem Mengenübersicht/Teamordner-Block und dem Admin-Button. Volle Breite, nicht im Kachel-Grid-Stil — bewusst anders als die anderen Kacheln.

- Mini-Wurm-Animation (SVG, 7 Segmente, kriecht)
- Live-Status-Text: `↝ Läuft` / `❄ Eingefroren` / `Manueller Modus`
- Border färbt sich grün oder amber je nach Zustand
- Tap → `wurm.html`

---

## Statusseite (`wurm.html`)

Für alle Nutzer — kein Admin-Zugang nötig.

**Sektionen:**

1. **Hero** — Titel, animierter Wurm (SVG), Status-Chip
2. **Persönlichkeitskarte** — Charakter-Zitat je nach Zustand + Erklärung in normalem Deutsch
3. **Berechnungsfenster** — Tabelle mit Start, Ende, Länge, Ausschluss-Einstellungen
4. **Kalender** — Monatsansicht mit Wurm-Markierung
5. **Legende** — Erklärung der Farben

**Kalender-Farben:**

| Element | Farbe |
|---|---|
| Kopf des Wurms (Ende des Zeitraums) | Amber ausgefüllt |
| Schwanz (Beginn) | Amber hell, kräftiger Rand |
| Im Fenster mit Daten | Amber transparent |
| Feiertag | Lila — tippbar, öffnet Erklärung |
| Manuell ausgeschlossen | Rot — tippbar, zeigt hinterlegten Grund |
| Heute | Amber-Rahmen |

**Wurm-Zustände mit Persönlichkeit:**

| Zustand | Icon | Beispiel-Zitat |
|---|---|---|
| Läuft | 〰️ | *„Alles ruhig. Ich fresse mich gemütlich durch die letzten Tage."* |
| Eingefroren | ❄️ | *„Ein Feiertag war im Fenster. Ich warte."* |
| Inaktiv (manuell) | 😴 | *„Ich schlafe. Jemand hat mich auf manuell gestellt."* |

Zitate werden beim Laden zufällig aus einem Pool gewählt.

---

## Konfiguration (Wochenconfig-Editor)

`AdminTools/wochenconfig_editor.html` → Bereich **Berechnungsgrundlage**

Neuer Toggle: **〰 Automatisches Berechnungsfenster (Wurm)**

- **An:** Fenster wird dynamisch berechnet, Kalender wird ausgeblendet (wäre sinnlos), `start_datum`/`end_datum` werden nicht in die JSON geschrieben
- **Aus:** Manueller Modus, Kalender aktiv, `start_datum`/`end_datum` werden gespeichert

Die Info-Box zeigt im Wurm-Modus das **aktuelle effektive Fenster** live an — inkl. Status `↝ läuft` oder `❄ eingefroren`. Die Berechnung passiert direkt im Editor mit derselben Logik wie `produktions_gehirn.js`.

---

## Wartungshinweise

**Jahreswechsel:** Die `FEIERTAGE_NDS`-Liste in `produktions_gehirn.js` und `dioden_gehirn.js` muss um das neue Jahr erweitert werden. Aktuell: 2025–2027.

**Namenskonflikt:** `produktions_gehirn.js` und `durchschnittsverbrauch_gehirn.js` exportieren beide `window.BOS_GEHIRN`. Nie auf derselben Seite laden. `wurm.html` lädt ausschließlich `produktions_gehirn.js`.

**Ordnername:** `durchschnittsverbauch/` hat einen Tippfehler (fehlendes 'r'). Nie korrigieren — alle Pfade hängen daran.

---

*Dokumentiert: April 2026 · BäckereiOS*
