# Konzept: Planverwaltung & Mitarbeiter-Konto

> BäckereiOS · Schichtplaner-Erweiterung  
> Status: Konzept vollständig — bereit zum Bauen  
> Stand: April 2026

---

## Architektur-Entscheidungen (final)

| Frage | Entscheidung |
|---|---|
| Wo lebt der offizielle Plan? | Eine deploybare Datei — `schichtplaner_offiziell.json` |
| Wer bestätigt? | Nur Ulf — durch Deployment auf GitHub (kein Login nötig) |
| Mehrere Pläne? | Genau ein offizieller Plan pro Woche — historische Pläne in derselben Datei |
| Guthaben-Synchronisation? | In der offiziellen Datei enthalten — wer die Datei hat, hat den Stand |
| Azubi? | Statistisch einbezogen, Guthaben sichtbar — keine Sonder-Auszahlung vorerst |
| Konto öffentlich sichtbar? | Nein — Admin-only. Mitarbeiter fragt, Ulf druckt aus |

**Die Kernstärke des Systems:** Es gibt keine Datenbank die geschützt werden muss. GitHub ist der einzige Schreibweg. Wer die Seiten findet sieht nur was deployt wurde — und deployen kann nur Ulf.

---

## Die drei Räume

```
┌─────────────────────┐     Export      ┌──────────────────────────────────────┐
│   RAUM 1            │ ──────────────► │   schichtplaner_offiziell.json       │
│   Planungswerkzeug  │                 │                                      │
│   (Schichtplaner)   │                 │  officialPlans[]  ← Wochenpläne      │
│                     │  Deployment     │  accounts{}       ← Guthaben         │
│   Entwürfe          │ ◄────────────── │  events[]         ← Ereignisse       │
│   Varianten         │  (GitHub)       │                                      │
│   Kein Konto-Effekt │                 └──────────────────────────────────────┘
└─────────────────────┘                          │ lädt
                                                 ▼
                         ┌───────────────────────────────────────┐
                         │   RAUM 2 — Vier separate Seiten       │
                         │                                       │
                         │  schichtplaner_anzeige.html           │
                         │  "Hier ist dein Plan" · read-only     │
                         │  In BäckereiOS verlinkt               │
                         │                                       │
                         │  schichtplaner_bestaetigung.html      │
                         │  Optionen laden → offiziell machen    │
                         │  An Datenbank-Datei anhängen          │
                         │                                       │
                         │  schichtplaner_notfall.html           │
                         │  Ausfall-Management · Simulator       │
                         │  Punkte-Vorschläge · read-only basis  │
                         │                                       │
                         │  schichtplaner_konto.html             │
                         │  Admin-only · Punkte · Gutscheine     │
                         │  Kein öffentlicher Zugang             │
                         └───────────────────────────────────────┘
```

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
      "bestaetigt_am": "2026-05-11T19:42:00Z",
      "plan": { ... },
      "freieTage": { ... },
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

  "einstellungen": {
    "guthabenFrist_wochen": 3
  }
}
```

---

## Guthaben-Ausspielung — zwei Stufen

**Stufe 1 — Basis** (Pflicht, immer einzulösen):
Der verlorene freie Tag wird zurückgegeben plus ein angrenzender Tag — zwei zusammenhängende freie Tage. Welche zwei das sind hängt davon ab wann die Person ohnehin frei wäre. Der Algorithmus sucht den besten Anschluss. Das ist das Minimum das gehalten werden muss.

**Stufe 2 — Luxus** (wenn Besetzung es hergibt):
Fr + Sa + Mo — drei Tage mit dem Sonntag dazwischen. Ein echtes verlängertes Wochenende.

**Regel:** Nicht der Mitarbeiter wählt die Stufe — die Realität der Besetzung entscheidet. Ulf schaut: "Kann ich das diese Woche leisten?" und wählt entsprechend. Der Mitarbeiter weiß: mindestens Stufe 1, vielleicht Stufe 2.

**Was es nicht gibt:** Zwei nicht zusammenhängende freie Tage. Das wäre keine Kompensation sondern Stress — frei, arbeiten, frei. Gestrichen.

### Frist

- Standard: 3 Wochen (konfigurierbar)
- Verlängerung mit Pflichtfeld "Grund" (z.B. "Urlaubszeit, dünn besetzt")
- Nach Ablauf: rote Warnung in der Eingangsbox

---

## Roadmap — Schritt für Schritt

### Schritt 1 — Planungstool bereinigen
**Was:** Schichtplaner bekommt einen "Als Optionen exportieren"-Button. Plan trägt Status `"entwurf"`, Ausdruck trägt Stempel **ENTWURF — nicht offiziell**.  
**Aufwand:** Klein — eine Exportfunktion in `schichtplaner_druck.js`.  
**Ergebnis:** Raum 1 ist sauber definiert.

### Schritt 2 — Plan-Bestätigung (`schichtplaner_bestaetigung.html`)
**Was:** Optionen-Datei laden, eine Option wählen, als offiziell bestätigen. System hängt den Plan an `schichtplaner_offiziell.json` an. Datei herunterladen, deployen.  
**Aufwand:** Mittel — neue Seite, Datei-Merge-Logik.  
**Ergebnis:** Der Übergang von Entwurf zu Wahrheit ist geregelt.

### Schritt 3 — Anzeige-Seite (`schichtplaner_anzeige.html`)
**Was:** Lädt `schichtplaner_offiziell.json`, zeigt aktuelle Woche als saubere Tabelle. Kein Editieren, kein Nichts. In BäckereiOS verlinkt.  
**Aufwand:** Klein — read-only Render auf Basis bestehender Render-Logik.  
**Ergebnis:** Kollegen sehen ihren Plan auf jedem Gerät.

### Schritt 4 — Notfall-Seite (`schichtplaner_notfall.html`)
**Was:** Spezialisiert auf Ausfall-Management. Lädt offiziellen Plan (read-only), simuliert Szenarien, macht Einsprung-Vorschläge, kann Punkte-Gutschriften vorschlagen (aber nicht buchen — das bleibt Schritt 5).  
**Aufwand:** Mittel-groß — neue Seite, Simulator-Logik.  
**Ergebnis:** Notfälle werden von einem spezialisierten Werkzeug behandelt, nicht vom Planungs-Tool.

### Schritt 5 — Konto-Verwaltung (`schichtplaner_konto.html`)
**Was:** Admin-only. Eingangsbox mit offenen Ereignissen, Akkordeon pro Person, Guthaben, Verlauf, Statistik. Gutschein und Kontoauszug drucken.  
**Aufwand:** Groß — neue Seite, vollständige Konto-Logik.  
**Ergebnis:** Einspringen wird sichtbar, fair und verlässlich verwaltet.

---

## Druckvorlagen

### Gutschein (halbes A4)

```
┌───────────────────────────────────────┐
│  BäckereiOS · Bäckerei Langrehr       │
│                                       │
│           G U T S C H E I N          │
│                                       │
│  Für:      Lars                       │
│  Anlass:   Einspringen                │
│            Sa 16.05.2026              │
│            22-Uhr-Schicht             │
│                                       │
│  Leistung: Verlängertes Wochenende    │
│            nach Vereinbarung          │
│            (spätestens KW22)          │
│                                       │
│  Ausgestellt:  17.05.2026             │
│  Genehmigt:    ___________________    │
└───────────────────────────────────────┘
```

### Kontoauszug (A4)

Alle Buchungen der Person: Datum, Anlass, Typ (Gutschrift/Ausspielung), Saldo. Unterschrift-Zeile unten.

---

## Beton-Grundsätze (nicht verhandelbar)

1. **Kein Konto-Effekt ohne offiziellen Plan.** Entwürfe lösen nichts aus.
2. **Nur Deployment ändert den offiziellen Stand.** Kein Button im Browser schreibt dauerhaft.
3. **Eine Datei, ein Stand.** Kein Split zwischen Geräten.
4. **Guthaben-Ausspielung ist immer zusammenhängend.** Zwei Tage am Stück — keine Ausnahme.
5. **Gutschein ist physisch.** Wer ihn hat, kann ihn nicht vergessen.
6. **Entwurf bleibt Entwurf.** Kein Plan gilt bis Ulf deployt.
7. **Konto ist Admin-only.** Mitarbeiter fragt — Ulf druckt aus. Kein Vergleich zwischen Kollegen.

---

*Konzept erstellt: April 2026 · [Claude] + [Ulf]*  
*Status: Vollständig — bereit zum Bauen*  
*Nächster Schritt: Schritt 1 — Export-Funktion im Planungstool*
