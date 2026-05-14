# Konzept: Kontoseite & Fairness-Konto

> BäckereiOS · Schichtplaner-Erweiterung  
> Status: Konzept abgeschlossen — bereit zum Bauen  
> Stand: Mai 2026 · [Claude] + [Ulf]

---

## Das Prinzip in einem Satz

Jede Person hat ein Konto. Das System ersetzt das mentale Konto das Ulf bisher im Kopf führt — lückenlos, öffentlich einsehbar, unveränderbar außer durch Deployment.

---

## Philosophie

**Freie Tage sind Währung.** Samstag frei ist teurer als Montag frei. Einspringen bedeutet immer Ausgleich — keine Ausnahmen, keine Kulanz-Regelung. Wer einspringt bekommt seinen Tag zurück. Steht nicht zur Diskussion.

**Transparenz ist Betriebsfrieden.** Die Kontoseite ist öffentlich einsehbar. Wer motzt warum Kollege B wieder Samstag frei hat, kann selbst nachschauen. Die Zahlen sprechen für sich.

**Speichern = offiziell.** Es gibt kein "vorläufig" oder "bestätigt". Was ins System gebucht wird, gilt. Daher wird erst nach dem Gespräch mit der Person gebucht — niemals vorher.

**Append-only.** Es wird nur hinten dran gehängt, nie etwas geändert oder gelöscht. Korrekturen entstehen durch neue Einträge — keine stille Manipulation möglich.

---

## Was ins Konto kommt

| Typ | Bedeutung |
|---|---|
| `freierTag` | Normaler freier Tag dieser Woche — mit Wochentag |
| `einspringen` | Person verzichtet auf freien Tag — immer Gutschein + Ausgleich |
| `freierTagNachgereicht` | Der Ausgleich für ein Einspringen — verweist auf Original |

**Was nicht ins Konto kommt:**

- **Krank** — wird aus bestehender Quelle (`urlaub_krank.js`) gelesen und nur angezeigt
- **Urlaub** — gleiche Quelle, nur angezeigt, zählt nicht für Vergleiche
- **Sonntage** — anderer Plan, andere Logik, gesonderte Bezahlung, freiwillig
- **Feiertage** — aus denselben Gründen wie Sonntage

> **Informeller Grundsatz:** Wer viele Sonntage arbeitet hat ein gewisses Vorrecht auf Wünsche. Das steht nicht im System — Ulf wendet es bei Bedarf an.

---

## Anzeige

### Übersichtsseite

Alle Personen im Vergleich. Zeitraum konfigurierbar, Standard **8 Wochen** (einstellbar direkt auf der Seite, ca. 4–16 Wochen). Keine gewichteten Punkte — nur absolute Zahlen und Tatsachen.

Zu lange Zeitspannen sind unübersichtlich. Zu kurz geht nicht, weil nur ein bis zwei Personen pro Woche besondere Tage frei haben. 8 Wochen zeigt ein ehrliches Bild der jüngsten Vergangenheit.

### Person-Detailseite

Tap auf eine Person öffnet die Detailansicht:

```
┌─────────────────────────────────────┐
│  LARS                               │
│                                     │
│  Freie Tage — letzte 8 Wochen      │
│  KW15: Samstag                      │
│  KW17: Samstag                      │
│  KW18: Montag (nachgereicht)        │
│                                     │
│  Einspringen                        │
│  KW16: Samstag · Gutschein aussteh. │
│                                     │
│  Urlaub / Krank                     │
│  KW14: Urlaub                       │
└─────────────────────────────────────┘
```

---

## Workflow: Einspringen

```
1. Notfallplaner  →  Vorschlag generieren + ausdrucken
2. Gespräch       →  "Kannst du Samstag einspringen?
                      Du kriegst nächste Woche Montag frei."
3. Einigung       →  Ulf öffnet Kontoseite, trägt manuell ein:
                      • Einspringen Lars / Sa KW18
                      • freierTagNachgereicht Lars / Mo KW19
4. Download       →  neue konto.json + backup deployen
```

---

## Eingabemaske (manuell)

Einfach, kein Schnickschnack:

```
Person    [Lars ▼]
Typ       [Einspringen ▼]
Datum     [18.05.2026]
Wochentag [Samstag]    ← automatisch aus Datum
Notiz     [Vertretung Heinzi]
```

---

## JSON-Struktur: `schichtplaner_konto.json`

```json
{
  "version": 1,
  "stand": "2026-W18",
  "einstellungen": {
    "anzeigeZeitraumWochen": 8
  },
  "ereignisse": [
    {
      "id": "evt-001",
      "personId": "lars",
      "kw": "2026-W15",
      "datum": "2026-04-11",
      "typ": "freierTag",
      "wochentag": "samstag"
    },
    {
      "id": "evt-002",
      "personId": "lars",
      "kw": "2026-W16",
      "datum": "2026-04-18",
      "typ": "einspringen",
      "wochentag": "samstag",
      "notiz": "Vertretung Heinzi",
      "gutschein": "BOS-2026W16-LAR-001"
    },
    {
      "id": "evt-003",
      "personId": "lars",
      "kw": "2026-W19",
      "datum": "2026-05-05",
      "typ": "freierTagNachgereicht",
      "wochentag": "montag",
      "beziehtSichAuf": "evt-002"
    }
  ]
}
```

### Feld-Referenz

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | Eindeutige ID — ermöglicht Verweise zwischen Ereignissen |
| `personId` | ja | Verweist auf `id` in `schichtplaner_config.json` |
| `kw` | ja | Kalenderwoche im Format `YYYY-Www` |
| `datum` | ja | Konkretes Datum `YYYY-MM-DD` |
| `typ` | ja | `freierTag` / `einspringen` / `freierTagNachgereicht` |
| `wochentag` | ja | `montag` bis `samstag` — für Gewichtung und Anzeige |
| `notiz` | nein | Freitext, nur bei Einspringen empfohlen |
| `gutschein` | nein | Gutschein-Code, nur bei `einspringen` |
| `beziehtSichAuf` | nein | Ereignis-ID, nur bei `freierTagNachgereicht` |

---

## Backup-Prinzip (für alle Schichtplaner-Dateien)

Bei jeder Generierung: **zwei Downloads.**

```
schichtplaner_konto.json         ← neu, deployen
schichtplaner_konto_backup.json  ← war bisher offiziell, jetzt eine Generation zurück
```

Beim nächsten Durchlauf wird `_backup` von der aktuellen offiziellen überschrieben. Immer genau **eine Generation zurück** — nicht mehr, nicht weniger. Reicht für jeden realistischen Fehlerfall.

Gleiches Prinzip gilt für `schichtplaner_offiziell.json`.

---

## Datei-Übersicht (Schichtplaner gesamt)

| Datei | Lebenszeit | Inhalt |
|---|---|---|
| `schichtplaner_offiziell.json` | Rollend, wächst | Bestätigte Wochenpläne |
| `schichtplaner_konto.json` | Dauerhaft, wächst | Fairness-Konto, append-only |
| `urlaub_krank.js` | Bestehend | Urlaub + Krank — gemeinsame Quelle |

---

## Noch offen / nächste Schritte

1. **Kontoseite bauen** (`schichtplaner_konto.html`) — Übersicht + Detailseite + Eingabemaske
2. **Notfallplaner** (`schichtplaner_notfall.html`) — liest offiziellen Plan, konzentriert sich auf Wochenrest, schlägt Einspringen vor, druckt aus
3. **Normaler Planer** kennt Konto-Daten — kann beim Generieren berücksichtigen wer viele teure Tage hatte

### Offener Punkt: "Einlösen"-Button

Der normale Planer hat bereits die Logik um einen extra freien Tag einzuplanen. Was fehlt ist das Signal: *diese Person hat einen nachzureichenden Tag.* 

Idee: "Einlösen"-Button auf der Kontoseite — markiert ein `einspringen`-Ereignis als einzulösen. Der Planer liest das beim nächsten Generieren und plant den Tag automatisch ein.

> Details werden in einer späteren Session besprochen.

---

## Beton-Grundsätze

1. **Einspringen bedeutet immer Ausgleich.** Keine Ausnahmen.
2. **Erst Gespräch, dann buchen.** Niemals umgekehrt.
3. **Speichern = offiziell.** Kein Bestätigungs-Feld nötig.
4. **Append-only.** Nur neue Einträge — keine stille Änderung.
5. **Öffentlich einsehbar.** Transparenz ist Betriebsfrieden.
6. **Absolute Zahlen.** Keine gewichteten Punkte in der Anzeige.
7. **8 Wochen Standard.** Ehrliches Bild ohne Überforderung.
8. **Immer zwei Downloads.** Neue Datei + eine Generation Backup.

---

*Konzept: Mai 2026 · [Claude] + [Ulf]*  
*Nächste Session beginnt mit: Kontoseite bauen*
