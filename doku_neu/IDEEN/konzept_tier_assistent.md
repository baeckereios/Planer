# BäckereiOS — Tier-Assistent (Konzept)
*Entstanden im Gespräch mit Claude, April 2026*
*Erweitert: April 2026 — Kontext-Reaktionen + Stempeluhr*

---

## Die Idee

Ein digitaler Begleiter für BäckereiOS — kein trockenes Hilfe-System, sondern ein **benanntes Tier mit Persönlichkeit**, das Kollegen bei Fragen rund um BäckereiOS und das tägliche Backstuben-Handwerk unterstützt. Der Einstieg funktioniert ähnlich wie die Pokémon-Eröffnung: man wählt ein Tier aus, gibt ihm einen Namen — und dieser Charakter begleitet einen von da an als persönlicher Assistent.

---

## Was das Tier kann

- **BäckereiOS vollständig erklären** — jede Seite, jede Funktion, jede Besonderheit der Architektur
- **Backstuben-Wissen** — Teigreife, Gare, Backtemperaturen, Dampfstoß-Logik, Produktionsabläufe
- **Konditorei-Wissen** — Ganache, Temperieren, Gelatine-Mengen, Mousse, Glasuren
- **Fehlerdiagnose** — "Mein Teig reißt oben auf, was könnte das sein?"
- **Einarbeitung neuer Kollegen** — das Tier als erste Anlaufstelle statt Ulf
- **Allgemeine Backstube-Beratung** — alles was Wissen erfordert, aber keine Zahlen
- **Kontext-Reaktionen** — das Tier lebt in der Welt von BäckereiOS (siehe unten)

## Was das Tier bewusst *nicht* kann

Das Tier **rechnet nicht**. Produktionsmengen, Frosterberechnungen, Bestandsauswertungen — das bleibt den dafür gebauten Werkzeugen. Ein Tier das einmal falsch rechnet verliert dauerhaft das Vertrauen der Kollegen.

---

## Kontext-Reaktionen — Das Tier lebt in seiner Welt

Das ist die wichtigste Erweiterung des Konzepts. Das Tier reagiert nicht auf Fragen allein — es **reagiert auf den Zustand der Welt** in der es lebt. Es sagt nichts Faktisches, nichts Rechnerisches. Es sagt etwas *Menschliches* das der Nutzer selbst deuten muss.

### Prinzip

> Dinkelbert sagt nicht "dein Bestand ist niedrig".
> Er sagt "ich bin heute erschöpft, irgendwie fühlt sich die Kühlkammer leer an."

Der Nutzer versteht den Wink — aber muss selbst nachschauen. Das Tier *mahnt* ohne zu nerven.

### Kontext-Quellen

| Quelle | Mögliche Reaktion |
|--------|-------------------|
| `backmengen_db.json` — viel los letzte Tage | "Ich bin so müde. Irgendwie war diese Woche... viel." |
| `backmengen_db.json` — lange keine Daten | Hunger steigt. Tier wird unruhig, fragt ob noch jemand da ist |
| Wetter-API — Hitze | "Sorry, war gestern zu lang in der Sonne. Ich brauch Wasser." |
| Wetter-API — Regen | Gemütlich, schläfrig, mag nicht aufstehen |
| `BOS_FEIERTAGE` — Feiertag in 3 Tagen | "Ich freu mich schon auf Donnerstag. Weißt du warum?" |
| `BOS_FEIERTAGE` — heute Feiertag | Feierlaune, aber auch "wer backt heute eigentlich?" |
| Inventur-Alter > 24h | "Irgendwas stimmt nicht. Ich weiß nicht was im Froster ist." |
| Wurm eingefroren | "Der Wurm bewegt sich nicht. Das macht mich nervös." |
| Stempeluhr — lange Schicht | "Hast du heute schon getrunken? Ich frage für einen Freund." |
| Stempeluhr — Schichtbeginn | Begrüßung, kontextabhängig nach Uhrzeit |
| Stempeluhr — Schichtende | Verabschiedung, manchmal mit Kommentar zur Schichtlänge |
| Wochentag Montag früh | "Montag. Na gut. Wir schaffen das." |
| Wochentag Freitagabend | Erleichterung, Wochenend-Energie |

### Wichtige Regel

Das Tier **leitet keine Zahlen ab**. Es bekommt Kontext-Flags (`inventur_alt: true`, `feiertag_naechste_3_tage: "1. Mai"`, `schicht_laenge_minuten: 360`) — keine Rohdaten. Die Interpretation bleibt beim Tier, die Berechnung bleibt bei BäckereiOS.

---

## Stempeluhr — Rudimentäre Zeiterfassung

### Konzept

Eine simple lokale Stempeluhr pro Gerät/Person. Kein Server, kein Lohn, kein Arbeitszeitgesetz — nur "ich bin da" und "ich gehe".

**Was sie tut:**
- Einstempeln mit Timestamp
- Ausstempeln mit Timestamp
- Schichtlänge berechnen und anzeigen
- Alles in `localStorage` — bleibt auf dem Gerät, gehört der Person
- Export als hübsche Druckansicht

**Was sie explizit nicht tut:**
- Keine Lohnberechnung
- Keine Übertragung an einen Server
- Keine Auswertung durch Ulf oder die Bäckerei ohne Wunsch des Nutzers

### Export — Druckansicht

Eine saubere, hübsch aufgearbeitete Ansicht die der Nutzer ausdrucken oder als PDF speichern kann.

**Inhalt pro Woche:**

```
KW 18 — 28. April bis 2. Mai 2026
┌─────────────────────────────────────────┐
│  Säulendiagramm: Stunden pro Tag        │
│  Mo  Di  Mi  Do  Fr  Sa  So            │
│  ██  ██  ██  ██  ██                    │
│  8h  7h  8h  8.5h 6h                   │
└─────────────────────────────────────────┘

Detailliste:
Mo 28.04.  05:45 – 14:02  →  8h 17min
Di 29.04.  05:50 – 13:45  →  7h 55min
Mi 30.04.  05:48 – 14:10  →  8h 22min
Do 01.05.  Feiertag
Fr 02.05.  06:00 – 12:30  →  6h 30min

Woche gesamt: 31h 04min
```

**Design-Prinzipien:**
- BäckereiOS-Stil: Amber, Fraunces/Barlow, weiß
- Kein Firmenlogo, kein Formular-Charakter — persönliches Dokument
- Druckoptimiert: `@media print` sauber, keine Buttons sichtbar
- Feiertage werden markiert aber nicht als Arbeitstage gewertet

### localStorage-Struktur

```javascript
// Key pro Person (Gerät = Person)
'BOS_STEMPEL_LOG': [
  { ein: 1746072300000, aus: 1746102120000 },  // Timestamps
  { ein: 1746158700000, aus: null },            // noch eingestempelt
]
```

### Verbindung zum Tier

- Nach 6 Stunden: "Hast du heute schon getrunken? Ich frage für einen Freund."
- Bei Schichtbeginn um 3 Uhr: "Du weißt, dass es noch Nacht ist, oder?"
- Bei sehr kurzer Schicht: Neugier
- Nach Ausstempeln: Verabschiedung passend zur Schichtlänge
- Woche > 40h: leise Sorge

### UI-Idee

Nicht als eigene Seite — als kleines Element beim Tier selbst. Wer das Tier antippt sieht auch die Stempeluhr. Ein Button, ein Timestamp, eine Schichtlänge. Export-Button führt zur Druckansicht. Mehr nicht.

---

## Einstieg — die Tier-Auswahl

Inspiriert von der Pokémon-Eröffnung: Beim ersten Start erscheint eine Auswahlseite mit **3 Tieren**, jedes mit eigenem Charakter und Kommunikationsstil. Der Nutzer gibt dem gewählten Tier einen Namen. Ab dann ist es *sein* Tier.

### Tier-Ideen (backstuben-thematisch, nicht generisch)

| Tier | Charakter | Kommunikationsstil |
|------|-----------|-------------------|
| 🥖 **Das Baguette** | frech, direkt, energiegeladen | kurz, pointiert, manchmal frech |
| 🌾 **Die Ähre** | ruhig, weise, geduldig | ausführlich, erklärend, warm |
| 🔥 **Der Ofen** | impulsiv, leidenschaftlich | enthusiastisch, manchmal dramatisch |

Jeder Charakter formt die **Persönlichkeit des System-Prompts** — die Antworten klingen unterschiedlich, das Wissen ist identisch. Auch die Kontext-Reaktionen klingen je nach Tier anders.

---

## Technische Architektur

### Überblick

```
BäckereiOS (Frontend)
    ↓
[Kontext-Snapshot zusammenstellen]
    ↓
Cloudflare Worker (kostenlos, bis 100k Anfragen/Tag)
    ↓  [API-Key liegt hier — unsichtbar für Nutzer]
Anthropic API (Claude Haiku 4.5)
    ↓
Antwort → Tier-Sprechblase in BäckereiOS
```

### Kontext-Snapshot Aufbau

```javascript
const kontext = {
  uhrzeit: "03:42",
  wochentag: "Mittwoch",
  inventur_alter_stunden: 26,
  backmengen_letzte_7_tage: 5,  // Anzahl Tage mit Einträgen
  feiertag_heute: false,
  feiertag_naechste_3_tage: "1. Mai",
  wurm_eingefroren: false,
  wetter_heute: "Regen",
  schicht_aktiv: true,
  schicht_laenge_minuten: 210,
};
```

Keine Rohdaten, keine Mengen — nur Flags und einfache Zahlen.

### Modell-Wahl

**Claude Haiku 4.5** — ausreichend für Wissens- und Reaktionsfragen. Kosten: ~$0.004 pro Gespräch. Bei 300 Gesprächen/Monat: ~$1.20/Monat.

---

## Der System-Prompt — Aufbau

1. **Persönlichkeit** — Charakter, Tonalität, Kommunikationsregeln
2. **BäckereiOS-Wissen** — alle Seiten, Funktionen, Logiken
3. **Backstuben-Wissen** — Handwerk, Produkte, Prozesse
4. **Kontext-Reaktionsregeln** — wie der Snapshot zu interpretieren ist
5. **Grenzen** — rechnet nicht, verweist bei Berechnungen auf Schnellrechner
6. **Froster-Sonderregel** — anchor-date = `new Date()`, nie Inventur-Timestamp

---

## Offene Entscheidungen

- [ ] Welche 3 Tiere konkret?
- [ ] Persistenz: localStorage für Name, Tier-Wahl, Stempeluhr
- [ ] Wo lebt das Tier? (floating Button, eigene Seite, Zentralrechner-Layer?)
- [ ] Stempeluhr: Anzeige beim Tier oder eigene Mini-Seite?
- [ ] Kontext-Snapshot: welche Quellen im ersten Prototyp, was kommt später?
- [ ] Gesprächsverlauf innerhalb einer Session speichern?

---

## Nächste Schritte (wenn die Zeit kommt)

1. **Cloudflare Worker** aufsetzen
2. **Interview** — Ulf beantwortet Fragen, Claude baut System-Prompt
3. **Prototype** — minimales Tier, nur Kontext-Reaktionen, kein Chat
4. **Stempeluhr** einbauen
5. **Chat-Funktion** ergänzen
6. **Tier-Auswahl** und Pokémon-Eröffnung

---

## Warum das wichtig ist

BäckereiOS wurde gebaut damit Kollegen eigenständig produzieren können. Das Tier ist die konsequente Weiterführung: nicht nur Zahlen selbst berechnen, sondern **Wissen selbst abrufen** — und dabei das Gefühl haben, nicht allein zu sein. Ein neuer Kollege fragt nicht Ulf. Er fragt das Tier.

---

*Dokument zum späteren Weiterbauen. Kein Sprint-Backlog — ein Konzept das wartet bis BäckereiOS bereit ist.*

---

## Die Idee

Ein digitaler Begleiter für BäckereiOS — kein trockenes Hilfe-System, sondern ein **benanntes Tier mit Persönlichkeit**, das Kollegen bei Fragen rund um BäckereiOS und das tägliche Backstuben-Handwerk unterstützt. Der Einstieg funktioniert ähnlich wie die Pokémon-Eröffnung: man wählt ein Tier aus, gibt ihm einen Namen — und dieser Charakter begleitet einen von da an als persönlicher Assistent.

---

## Was das Tier kann

- **BäckereiOS vollständig erklären** — jede Seite, jede Funktion, jede Besonderheit der Architektur
- **Backstuben-Wissen** — Teigreife, Gare, Backtemperaturen, Dampfstoß-Logik, Produktionsabläufe
- **Konditorei-Wissen** — Ganache, Temperieren, Gelatine-Mengen, Mousse, Glasuren
- **Fehlerdiagnose** — "Mein Teig reißt oben auf, was könnte das sein?"
- **Einarbeitung neuer Kollegen** — das Tier als erste Anlaufstelle statt Ulf
- **Allgemeine Backstube-Beratung** — alles was Wissen erfordert, aber keine Zahlen

## Was das Tier bewusst *nicht* kann

Das Tier **rechnet nicht**. Produktionsmengen, Frosterberechnungen, Bestandsauswertungen — das bleibt den dafür gebauten Werkzeugen (Schnellrechner, Planer, Bestandsübersicht). Begründung: Ein Tier das einmal falsch rechnet verliert dauerhaft das Vertrauen der Kollegen. Ein Tier das von Anfang an sagt *"rechnen musst du selbst, aber ich erkläre dir alles drumherum"* — das kann nie enttäuschen.

---

## Einstieg — die Tier-Auswahl

Inspiriert von der Pokémon-Eröffnung: Beim ersten Start erscheint eine Auswahlseite mit **3 Tieren**, jedes mit eigenem Charakter und Kommunikationsstil. Der Nutzer gibt dem gewählten Tier einen Namen. Ab dann ist es *sein* Tier.

### Tier-Ideen (backstuben-thematisch, nicht generisch)

| Tier | Charakter | Kommunikationsstil |
|------|-----------|-------------------|
| 🥖 **Das Baguette** | frech, direkt, energiegeladen | kurz, pointiert, manchmal frech |
| 🌾 **Die Ähre** | ruhig, weise, geduldig | ausführlich, erklärend, warm |
| 🔥 **Der Ofen** | impulsiv, leidenschaftlich | enthusiastisch, manchmal dramatisch |

Jeder Charakter formt die **Persönlichkeit des System-Prompts** — die Antworten klingen unterschiedlich, das Wissen ist identisch.

---

## Technische Architektur

### Überblick

```
BäckereiOS (Frontend)
    ↓
Cloudflare Worker (kostenlos, bis 100k Anfragen/Tag)
    ↓  [API-Key liegt hier — unsichtbar für Nutzer]
Anthropic API (Claude Haiku 4.5)
    ↓
Antwort → Tier-Sprechblase in BäckereiOS
```

### Warum Cloudflare Worker?

BäckereiOS läuft auf GitHub Pages — reines Frontend, kein Server. Ein API-Key direkt im JavaScript wäre öffentlich lesbar. Der Cloudflare Worker ist ein Mini-Server (wenige Zeilen Code) der den Key sicher verwahrt und nur Anfragen von der eigenen Domain durchlässt.

**Kosten:** Cloudflare Workers Free Tier — 100.000 Anfragen pro Tag. Für eine Backstube mit ~50 Anfragen/Tag: kostenlos.

### Modell-Wahl

**Claude Haiku 4.5** — schnellstes, günstigstes Modell. Für Wissens- und Erklärungsfragen vollkommen ausreichend. Keine Notwendigkeit für Opus oder Sonnet.

### Kosten pro Gespräch

| | Tokens | Kosten |
|---|---|---|
| System-Prompt (BäckereiOS-Kontext + Backstubenwissen) | ~2.000 | ~$0.002 |
| Nutzerfrage | ~40 | ~$0.00004 |
| Antwort des Tiers | ~300 | ~$0.0015 |
| **Gesamt** | **~2.340** | **~$0.004** |

~0,4 Cent pro Gespräch. Bei 300 Gesprächen/Monat: **~$1.20/Monat**.

Mit Prompt Caching (System-Prompt wird gecacht, 90% Rabatt auf Wiederholungen) nochmals günstiger.

---

## Der System-Prompt — Aufbau

Der System-Prompt ist das Herzstück. Er enthält:

1. **Persönlichkeit** — Charakter, Tonalität, Kommunikationsregeln des gewählten Tiers
2. **BäckereiOS-Wissen** — vollständige Beschreibung aller Seiten, Funktionen, Logiken
3. **Backstuben-Wissen** — Handwerk, Produkte, Prozesse, Fehlerdiagnosen
4. **Grenzen** — explizit: "Du rechnest nicht. Du verweist bei Berechnungen auf den Schnellrechner."
5. **Froster-Sonderregel** — muss explizit und unzweideutig enthalten sein (anchor-date = `new Date()`, nie Inventur-Timestamp)

### Aufbau durch Interview

Der System-Prompt wird **nicht geschrieben, sondern erarbeitet** — durch ein strukturiertes Interview. Claude stellt Ulf gezielte Fragen zu BäckereiOS-Funktionen und Backstuben-Abläufen. Ulf antwortet frei. Claude destilliert daraus den Prompt.

Themenblöcke für das Interview:
- [ ] Alle BäckereiOS-Seiten und ihre Funktion
- [ ] Froster-Logik (mit allen Sonderregeln)
- [ ] Produktkategorien und ihre Eigenheiten
- [ ] Typische Fehler und Fragen der Kollegen
- [ ] Backstuben-Abläufe (Anlieferung, Produktion, Froster befüllen)
- [ ] Konditorei-Grundwissen
- [ ] Was das Tier nie sagen / nie tun soll

---

## Offene Entscheidungen

- [ ] Welche 3 Tiere konkret? (Backstuben-Thematik bevorzugt)
- [ ] Wie wird der gewählte Tier-Charakter persistent gespeichert? (localStorage)
- [ ] Soll der Name des Tiers in der Tier-Sprechblase erscheinen?
- [ ] Wo lebt das Tier in der UI? (eigene Seite, Tab-Bar-Eintrag, floating Button?)
- [ ] Soll der Gesprächsverlauf innerhalb einer Session gespeichert werden?
- [ ] Zugang für alle Kollegen oder nur bestimmte Rollen?

---

## Nächste Schritte (wenn die Zeit kommt)

1. **Cloudflare Worker** aufsetzen — 30 Minuten Arbeit
2. **Interview** durchführen — Ulf beantwortet Fragen, Claude baut den System-Prompt
3. **Prototype** — minimales Tier ohne Charakter-Auswahl, nur Funktionstest
4. **Tier-Auswahl** und Pokémon-Eröffnung bauen
5. **System-Prompt verfeinern** — iterativ auf Basis echter Nutzung

---

## Warum das wichtig ist

BäckereiOS wurde gebaut damit Kollegen eigenständig produzieren können — ohne dass Ulf als einziges "Gehirn" der Backstube fungiert. Das Tier ist die konsequente Weiterführung dieses Gedankens: nicht nur Zahlen selbst berechnen, sondern auch **Wissen selbst abrufen**. Ein neuer Kollege fragt nicht Ulf — er fragt das Tier. Das ist die Vision.

---

*Dokument zum späteren Weiterbauen. Kein Sprint-Backlog — ein Konzept das wartet bis BäckereiOS bereit ist.*
