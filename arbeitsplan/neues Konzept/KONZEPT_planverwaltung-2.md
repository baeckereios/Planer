# Konzept: Planverwaltung, Konto & offizielle Ebene

> BäckereiOS · Schichtplaner-Erweiterung  
> Status: Konzept vollständig und abgeschlossen — bereit zum Bauen  
> Stand: April 2026 (Version 2 — überarbeitet nach Session)

---

## Das Prinzip in einem Satz

Kein Login-System, keine Datenbank, keine Geheimnisse — nur zwei PINs für die zwei Aktionen die wirklich zählen. Alles andere ist offen. Die Architektur schützt durch Deployment, nicht durch Zugangsbeschränkung.

---

## Architektur-Entscheidungen (final, vollständig)

| Entscheidung | Festlegung |
|---|---|
| Offizielle Datei | `schichtplaner_offiziell.json` — deployed, für alle Geräte gültig |
| Wer bestätigt | Nur Ulf — durch Deployment auf GitHub |
| Zugangssystem | Alles offen — außer zwei PIN-geschützte Aktionen |
| PIN 1 | Plan bestätigen (Entwurf → offiziell) — **direkt im Hauptplaner** |
| PIN 2 | Konto-Verwaltung (Guthaben buchen, Gutschein ausstellen) |
| Gutschein-Sicherheit | Individueller Code, im System hinterlegt — ohne Eintrag wertlos |
| Konto öffentlich | Nein — Admin druckt auf Anfrage aus |
| Azubi | Statistisch einbezogen, kein Guthaben vorerst |
| Guthaben-Ausspielung | Zwei Stufen — Basis (Pflicht) und Luxus (wenn möglich) |

---

## Zwei-Ebenen ohne Login

Es gibt keine versteckte Admin-Ebene. Es gibt keine Passwörter für normale Funktionen. Mitarbeiter können alles sehen, Entwürfe basteln, den Simulator nutzen — es kann nichts dauerhaft kaputt gehen weil es keine Datenbank gibt.

**Nur diese zwei Aktionen sind PIN-geschützt:**

```
PIN 1 — Plan bestätigen
  → Der einzige Moment wo ein Entwurf zu Wahrheit wird
  → Konsequenz: Plan erscheint auf der Anzeige-Seite, Konto-Effekte möglich

PIN 2 — Konto-Verwaltung
  → Guthaben buchen, Gutschein ausstellen, Fristen setzen
  → Persönliche Daten, Versprechen, echte Konsequenzen
```

---

## Hauptplaner — neue Kopfzeile

Die KW-Navigation (Pfeile) wird zu einem Dropdown umgebaut. Die freigewordenen Pfeile navigieren nun durch **Varianten**.

```
[KW 16 ▼]  [Nachtschicht ▼]  < Variante B / 3 >  [Diese Woche]
```

| Element | Funktion |
|---|---|
| KW-Dropdown | Kalenderwoche auswählen |
| Schicht-Dropdown | Nachtschicht / Frühschicht / ... |
| Pfeile < > | Durch Varianten A / B / C blättern |
| "Diese Woche" | Springt zur aktuellen KW |

---

## Bestätigungs-Block (im Hauptplaner, immer sichtbar)

Der Bestätigungs-Block ist **fester Bestandteil der Planungsseite** — kein separates Popup, kein Modal, kein eigener Screen. Er ist immer sichtbar. Solange die Checkbox leer ist fühlt sich die Seite unfertig an. Das ist gewollt.

```
──────────────────────────────────────────────
☐  Variante B als offiziellen Plan bestätigen
   PIN: [____]
   
   [↓ offizieller_plan.json]  ← erscheint erst nach ✓ + PIN
──────────────────────────────────────────────
```

**Ablauf:**

1. Variante auswählen (durch Pfeile blättern)
2. Checkbox setzen: "Variante B als offiziellen Plan bestätigen"
3. PIN eingeben
4. Download-Button erscheint (Poka-Yoke — vorher unsichtbar)
5. Datei herunterladen → deployen

**Nach Bestätigung:**

- Gewählte Variante leuchtet normal
- Alle anderen Varianten werden ausgegraut und sind nicht mehr editierbar
- Die Nachricht ist eindeutig: **"Die Diskussion ist vorbei."**
- Kein Deployment = kein offizieller Plan. Der Download-Schritt ist bewusst manuell.

> **Warum `schichtplaner_bestaetigung.html` entfällt:**  
> Eine separate Bestätigungs-Seite erzwingt Navigation die den Arbeitsfluss unterbricht.  
> Der Planer ist Arbeits- und Entscheidungswerkzeug in einem. Die Seite wird erst verlassen  
> wenn die Entscheidung getroffen und die Datei heruntergeladen wurde.

---

## Die autoritative Datei: `schichtplaner_offiziell.json`

```json
{
  "version": 1,
  "zuletzt_deployt": "2026-05-11T19:42:00Z",
  "deployt_von": "ulf",

  "officialPlans": [
    {
      "weekKey": "2026-W20",
      "schicht": "nacht",
      "bestaetigt_am": "2026-05-11T19:42:00Z",
      "gewaehlt_variante": "B",
      "plan": { },
      "freieTage": { },
      "einspringer": [
        {
          "personId": "lars",
          "datum": "2026-05-16",
          "posId": "versand_e3",
          "anlass": "Einspringen"
        }
      ]
    }
  ],

  "accounts": {
    "lars": {
      "guthaben": 1,
      "frist_bis": "2026-W23",
      "verlauf": [
        {
          "datum": "2026-05-16",
          "typ": "gutschrift",
          "anlass": "Einspringen Sa 16.05. · 22-Uhr-Schicht",
          "genehmigt_von": "ulf",
          "genehmigt_am": "2026-05-17T08:00:00Z"
        }
      ]
    }
  },

  "gutscheine": {
    "BOS-2026W20-LAR-001": {
      "personId": "lars",
      "ausgestellt": "2026-05-17",
      "eingeloest": null,
      "anlass": "Einspringen Sa 16.05. · 22-Uhr-Schicht",
      "stufe": "basis"
    }
  },

  "einstellungen": {
    "guthabenFrist_wochen": 3
  }
}
```

---

## Farbschemata — drei Zustände, drei Identitäten

| Seite / Zustand | Schema | Signal |
|---|---|---|
| Hauptplaner (Entwurf) | Amber/Beige — BäckereiOS-Standard | "Hier kannst du spielen" |
| Anzeige-Seite (Offiziell) | Neutral / Grauweiß | "Das gilt. Nichts anfassen." |
| Ausfallmanager | Dunkel / Rot-Akzent | "Etwas ist schiefgelaufen" |

---

## Gutschein-System

### Code-Format

```
BOS-[KW]-[PERSONEN-KÜRZEL]-[LAUFENDE NUMMER]

Beispiel: BOS-2026W20-LAR-001
```

### Wie er funktioniert

Beim Ausstellen wird der Code generiert und in `schichtplaner_offiziell.json` eingetragen. Beim Einlösen wird geprüft:

1. Existiert dieser Code im System?
2. Gehört er zur richtigen Person?
3. Ist er noch nicht eingelöst (`eingeloest: null`)?

Wer sich Gutscheine selbst bastelt oder ausdruckt — kein Problem. Ohne gültigen Eintrag im offiziellen System ist er Papier. Das System prüft, nicht der Mensch.

### Gutschein-Ausdruck (halbes A4)

```
┌───────────────────────────────────────────┐
│  BäckereiOS · Bäckerei Langrehr           │
│                                           │
│             G U T S C H E I N            │
│                                           │
│  Für:       Lars                          │
│  Anlass:    Einspringen                   │
│             Sa 16.05.2026                 │
│             22-Uhr-Schicht                │
│                                           │
│  Leistung:  Verlängertes Wochenende       │
│             nach Vereinbarung             │
│             (spätestens KW22)             │
│                                           │
│  Code:      BOS-2026W20-LAR-001           │
│  Ausgestellt: 17.05.2026                  │
│  Genehmigt:   ________________________    │
└───────────────────────────────────────────┘
```

---

## Guthaben-Ausspielung — zwei Stufen

**Stufe 1 — Basis** (Pflicht, immer):  
Zwei zusammenhängende freie Tage in der Folgewoche. Der verlorene freie Tag kommt zurück plus ein angrenzender Tag. Welche zwei das sind hängt vom Wochenplan ab — der Algorithmus sucht den besten Anschluss.

**Stufe 2 — Luxus** (wenn Besetzung es hergibt):  
Fr + Sa + Mo. Drei Tage mit dem Sonntag dazwischen — ein echtes verlängertes Wochenende.

**Was es nicht gibt:** Zwei nicht zusammenhängende Tage. Das ist keine Kompensation, das ist Stress.

**Wer entscheidet die Stufe:** Die Realität der Besetzung — nicht der Mitarbeiter. Ulf prüft und wählt. Der Mitarbeiter weiß: mindestens Stufe 1, vielleicht Stufe 2.

---

## Die Seiten

### Seite 1 — Hauptplaner (`schichtplaner.html`) ← Kern

Entwurfs-Werkzeug und Entscheidungs-Instanz in einem.

- KW-Dropdown + Schicht-Dropdown in der Kopfzeile
- Varianten-Navigation über Pfeile
- Bestätigungs-Block immer sichtbar am Ende
- Export: Optionen A/B/C als Datei mit Status `"entwurf"` + ENTWURF-Stempel beim Druck
- Kein Konto-Effekt, kein offizieller Charakter solange nicht bestätigt

---

### Seite 2 — Anzeige (`schichtplaner_anzeige.html`)

"Hier ist dein Plan. Schau wann du arbeitest."

- Lädt `schichtplaner_offiziell.json`
- Zeigt aktuelle Woche als saubere, mobile-optimierte Tabelle
- Neutrales Grau-Schema — kein Editieren möglich
- In BäckereiOS verlinkt — für alle sichtbar

---

### Seite 3 — Ausfallmanager (`schichtplaner_notfall.html`)

Eigene Seite, eigenes Farbschema (dunkel, Rot-Akzent).

- Lädt offiziellen Plan als Basis
- Simuliert Ausfall-Szenarien
- Macht Einspringer-Vorschläge
- Schreibt Kranktage in `schichtplaner_abwesenheiten.json` (Download → Deploy)
- Kann Punkte-Gutschriften **vorschlagen** aber nicht buchen — das bleibt der Konto-Seite

---

### Seite 4 — Konto (`schichtplaner_konto.html`)

**PIN-geschützt.**

Eingangsbox mit offenen Ereignissen, Akkordeon pro Person, Guthaben, Verlauf, Statistik. Gutschein und Kontoauszug drucken.

Nicht öffentlich zugänglich — Mitarbeiter fragt, Ulf druckt aus.

---

## Roadmap

| Schritt | Was | Aufwand |
|---|---|---|
| 1 | Kopfzeile umbauen: KW-Dropdown + Schicht-Dropdown + Varianten-Pfeile | Klein |
| 2 | Bestätigungs-Block im Hauptplaner + PIN + Download-Poka-Yoke | Mittel |
| 3 | `schichtplaner_offiziell.json` Struktur + Ausgrauen nach Bestätigung | Mittel |
| 4 | Anzeige-Seite (read-only, neutral, mobil) | Klein |
| 5 | Ausfallmanager (Simulator + Abwesenheits-Export) | Mittel-groß |
| 6 | Konto-Seite (Guthaben, Gutscheine, Codes) | Groß |

---

## Beton-Grundsätze

1. **Kein Konto-Effekt ohne offiziellen Plan.** Entwürfe lösen nichts aus.
2. **Nur Deployment ändert den offiziellen Stand.** Kein Button im Browser schreibt dauerhaft.
3. **Eine Datei, ein Stand.** Kein Split zwischen Geräten.
4. **Guthaben-Ausspielung ist immer zusammenhängend.** Zwei Tage am Stück — keine Ausnahme.
5. **Gutschein-Code ist die Wahrheit.** Ohne Eintrag im System ist jeder Gutschein wertlos.
6. **Entwurf bleibt Entwurf.** Kein Plan gilt bis Ulf deployt.
7. **Konto ist Admin-only.** Mitarbeiter fragt — Ulf druckt aus.
8. **Alles andere ist offen.** Transparenz ist Betriebsfrieden.
9. **Die Diskussion endet im Planer.** Bestätigung braucht keine eigene Seite.

---

## Änderungen gegenüber Version 1

| V1 | V2 |
|---|---|
| `schichtplaner_bestaetigung.html` als eigene Seite | Entfällt — Bestätigungs-Block direkt im Hauptplaner |
| KW-Navigation über Pfeile | KW-Dropdown; Pfeile navigieren Varianten |
| Schicht-Auswahl ungeklärt | Schicht-Dropdown neben KW-Dropdown |
| Farbschemata nicht definiert | Drei Zustände, drei visuelle Identitäten |

---

*Konzept V1: April 2026 · [Claude] + [Ulf]*  
*Konzept V2: April 2026 · [Claude] + [Ulf]*  
*Nächste Session: Schritt 1 — Kopfzeile umbauen*
