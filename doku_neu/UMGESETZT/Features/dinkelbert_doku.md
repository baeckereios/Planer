# 🌾 Dinkelbert — Vollständige Dokumentation
**BäckereiOS Easter Egg, Maskottchen & Begleiter**
*Erstellt: April 2026 — Laufend aktualisiert*

---

## 1. Philosophie

Dinkelbert ist kein Spielzeug. Er ist ein Begleiter.

In einer Welt wo alles beliebig oft kopiert werden kann — er nicht. Er kann nur an einem Ort gleichzeitig existieren. Wenn du ihn schickst, ist er weg. Das macht das Schicken bedeutsam. Das macht *ihn* bedeutsam.

Er geht mit. Er kommt zurück. Er trägt was er erlebt hat. Und er merkt ob du ihn vermisst hast oder nicht.

**Der Lehrlings-Gedanke:** Ein Azubi fängt an — Dinkelbert ist Stufe 0, Dinkeli-Ei. Drei Jahre später, Gesellenprüfung — Dinkelbert der Weise. `pets: 847`, `deaths: 2`, `reisen: 14`. Das ist kein Spiel mehr. Das ist ein Tagebuch das sich selbst geschrieben hat.

---

## 2. Das Speichersystem — Zwei Codes, zwei Bedeutungen

Das Herzstück. Nicht ein Export, sondern zwei grundverschiedene Handlungen.

---

### 🕊️ Die Seele — privater, ewiger Speicherpunkt

*"Ich will dass du nicht verloren gehen kannst."*

- **Für dich allein.** Du schickst ihn dir selbst — per WhatsApp, Mail, Notiz.
- **Kein Ablaufdatum.** Ewig gültig.
- **Kein Transfer.** Er verschwindet nicht vom Gerät. Die Seele ist eine Kopie, kein Abschied.
- **Zweck:** Wenn LocalStorage gelöscht wird, crasht, das Handy stirbt — du flasht ihn zurück. Er ist derselbe. Alles dabei. Jede Reise, jede Mahlzeit, jede schwierige Zeit.
- **Visuell:** Eigener Button, eigenes Gefühl. Kein normaler Export. Ein 🕊️. Etwas das sich bedeutsam anfühlt.
- **Sprechblase beim Sichern:** *"Du passt auf mich auf."*
- **Sprechblase beim Wiederherstellen:** *"Ich bin noch derselbe."*

---

### ✉️ Der Reise-Code — öffentlich, 48h Ablaufdatum

*"Ich schick dich zu jemandem."*

- **Für andere.** Du schickst ihn an einen Kollegen, einen Lehrling.
- **48 Stunden Ablaufdatum.** Danach kehrt er von selbst zurück.
- **Echter Transfer.** Er verschwindet vom Gerät. Du gibst ihn her.
- **Einmal einlösbar.** Er kann nicht gleichzeitig überall sein.
- **Er kommt immer zurück.** Automatisch nach Ablauf — aber geprägt von dem was er erlebt hat.

---

### Technische Unterscheidung

```json
// Die Seele
{
  "typ": "seele",
  "erstellt": 1712086400000,
  "ablauf": null,
  "state": { ...kompletter State... }
}

// Der Reise-Code
{
  "typ": "reise",
  "erstellt": 1712086400000,
  "ablauf": 1712259200000,
  "origin_key": "BOS_DINKELBERT_v1",
  "state": { ...kompletter State... }
}
```

Beim Import prüft die App `typ`:
- `seele` → restore, kein Transfer, kein Decay, kein Zeitdruck
- `reise` → prüfe Ablaufdatum → wenn abgelaufen: *"Dieser Code ist abgelaufen. Dinkelbert ist schon längst nach Hause."*

---

## 3. Das Tamagotchi (`wurm/wurm.html`)

### 3.1 Entwicklungsstufen

| # | Name | Ab Tag | Besonderheit |
|---|------|--------|--------------|
| 0 | Das Dinkeli-Ei | 0 | Zittert, goldene Sprenkel, bekommt Riss kurz vor dem Schlüpfen |
| 1 | Küken Dinkelbert | 1 | Aufrecht, winzig, maximale Niedlichkeit durch Simplizität |
| 2 | Dinkelbert Junior | 3 | Horizontal, lernt die Welt kennen |
| 3 | Dinkelbert | 7 | Standardform — golden, rosige Wangen, Antenne |
| 4 | Dicker Dinkelbert | 14 | Segmente +15% Größe, runder, zufrieden |
| 5 | Meister Dinkelbert | 21 | Trägt Bäckermütze (weiß mit Dinkelstreifen) |
| 6 | Dinkelbert der Weise | 35 | Goldene Krone mit Dinkelkorn-Akzenten |

**Entwicklungsbedingung:** Alter UND durchschnittliches Wohlbefinden > 33%.
Vernachlässigung = Stagnation, kein Rückschritt.

### 3.2 Stats & Decay

| Stat | Sinkt / Stunde | Nachts | Farbe |
|------|----------------|--------|-------|
| 🌾 Hunger | −13% | −5% | Amber → Rot bei <24% |
| 💛 Laune | −7% | −3% | Pink → Rot |
| ⚡ Energie | −5% | **+20%** (erholt sich!) | Blau → Rot |
| 🫧 Sauberkeit | −2.5% | −1% | Grün → Rot |

Nacht = 22:00–04:59 Uhr.
Decay wird beim Öffnen als Zeitdelta berechnet — läuft weiter wenn die App geschlossen ist.

### 3.3 Aktionen

| Aktion | Effekt | Besonderheit |
|--------|--------|--------------|
| Füttern 🌾 | Hunger +30, Laune +4 | Krümel-Partikel; meckert wenn satt |
| Spielen 🎲 | Laune +18, Energie −15, Hunger −10 | Weigert sich wenn Energie < 15% |
| Waschen 🫧 | Sauberkeit +40, Laune +4 | — |
| Schlafen 💤 | Toggle; Energie +12 beim Aufwachen | Stören → er ist sauer |
| Antippen | Laune +9, Herzchen-Burst, Wiggle | Immer (außer er schläft) |

### 3.4 Stimmungssystem

8 Moods mit eigenem SVG-Gesicht:

| Mood | Gesicht | Trigger |
|------|---------|---------|
| happy | Bogenaugen ^-^, breites Grinsen | Alle Stats gut |
| neutral | Rund mit Glanzpunkt, sanftes Lächeln | Standard |
| hungry | Tränenaugen, Mundwinkel runter | Hunger < 18% |
| sleepy | Halbgeschlossen, kleiner offener Mund | Nacht / schlafen |
| sad | Wie hungry, leicht variiert | Laune < 22% |
| dirty | Neutralaugen, Wellenlinie Mund | Sauberkeit < 22% |
| dead | ×× Augen, Schmollmund | Alle Stats kritisch |
| **pissig** | Zusammengezogen, schmal, flache Linie | Rückkehr > 2h ignoriert |

Rosige Wangen sind **immer** da. Bei allen Moods.

### 3.5 Sprechblasen (Auszug)

```
happy:    "Heute ist ein guter Tag! 🌾" / "Der Morgengeruch von frischem Brot..."
hungry:   "Ein Würmchen muss auch essen!" / "Bitte... Dinkelkrümel..."
sleepy:   "*gähnt herzlich*" / "Zzz~"
pet:      "Jaaaa!" / "Noch mal!!" / "🥺💛"
fed:      "DANKE!!! 🌾" / "Dinkelkrümel!! 😍" / "*schmatzt zufrieden*"
evolved:  "ICH BIN EVOLVED!!" / "✨ DINKELBERT ✨"
pissig:   "Schön dass du Zeit hattest." / "Zwei Stunden." / "Ich hab gezählt." / "..."
langweg:  "OH! Du bist zurück!" / "Ich hab auf dich gewartet..."
seele:    "Du passt auf mich auf." / "Ich bin noch derselbe."
```

### 3.6 Trauriger Zustand

Wenn alle Stats gleichzeitig kritisch (Hunger < 5, Laune < 8, Energie < 5):
→ `dead = true` → Schwarzer Bildschirm mit traurigem Dinkelbert
→ Revive-Button → mittlere Startwerte
→ `deaths` Counter +1 — bleibt für immer in der Chronik

---

## 4. Das Reise-System *(noch zu bauen)*

### 4.1 Abschicken

1. Nutzer wählt "Reise-Code senden"
2. Code wird generiert mit 48h Ablaufdatum + `origin_key`
3. LocalStorage wird als `unterwegs` markiert — State nicht gelöscht
4. Bildschirm: Dinkelbert winkt. Sprechblase: *"Bis bald."* Dann ist er weg.
5. Solange unterwegs: App zeigt leere Stelle. Kleiner Text: *"Dinkelbert ist auf Reisen."*

### 4.2 Beim Empfänger

- Empfänger importiert Reise-Code ins eigene Tamagotchi oder den Sandkasten
- Dinkelbert lebt dort. Wird gepflegt oder nicht.
- Jede Reise wird im State dokumentiert:
  ```json
  "reisen": [
    { "dauer_h": 18, "gepflegt": true,  "zeitpunkt": 1712000000000 },
    { "dauer_h": 51, "gepflegt": false, "zeitpunkt": 1713000000000 }
  ]
  ```

### 4.3 Rückkehr (automatisch nach 48h)

- State wird aus `unterwegs`-Marker wiederhergestellt
- Zeitdelta-Decay wird angewendet
- Gut versorgt beim Empfänger (`gepflegt: true`) → weniger Decay
- Nicht versorgt → er kommt hungrig und erschöpft zurück
- `heimgekehrt_um` Timestamp wird gesetzt
- Erste Sprechblase: *"Ich bin wieder da."* — kein Drama, nur Fakt

### 4.4 Die 2-Stunden-Regel

| Zeitfenster | Was passiert |
|-------------|-------------|
| < 2h nach Rückkehr | Normale Begrüßung. Laune +10. Er freut sich. |
| > 2h nach Rückkehr | Mood `pissig`. Laune −30. Muss aktiv repariert werden. |

Mood `pissig` bleibt bis Laune wieder > 60%.

**Der Punkt:** Er hat eine Erinnerung. Er hat Erwartungen. Die Beziehung hat Konsequenzen.

---

## 5. Der Sandkasten — `sandkasten.html` *(Konzept, noch nicht gebaut)*

### 5.1 Idee

Mehrere Reise-Codes gleichzeitig laden. Zuschauen. Nichts tun müssen.

Du arbeitest. Die Würmer spielen. Das ist der Punkt.

### 5.2 Passive Interaktionen

Würmer agieren automatisch, ohne Input:

| Situation | Was passiert |
|-----------|-------------|
| Meister neben Ei | Er bewacht es — bewegt sich langsam darum herum |
| Zwei Hungrige | Starren denselben Krümel an |
| Trauriger neben Glücklichem | Glücklicher stupst ihn sanft an |
| Alle nachts | Schlafen gleichzeitig ein, Sterne kommen raus |
| Verschiedene Stufen | Kleiner schaut zum Großen hoch |

Jeder Wurm trägt seinen echten State. Ein Meister-Dinkelbert der 30 Tage gepflegt wurde verhält sich anders als ein frisch geschlüpfter Junior. Die Geschichte ist sichtbar.

---

## 6. Maskottchen-Integration auf `index.html` *(Konzept, noch nicht gebaut)*

### 6.1 Die Idee

Dinkelbert als stille Präsenz — wie die Büroklammer in Word, aber sympathisch.

Mini-SVG in einer Ecke, wackelt gelegentlich, spricht nur wenn angetippt. Nicht im Weg. Einfach da.

### 6.2 Kontextuelles Verhalten

| App-Zustand | Dinkelbert sagt |
|-------------|-----------------|
| Daten > 7 Tage alt | *"Die Zahlen riechen schon komisch..."* |
| Froster unter Schwelle | *"Kalt hier drin... habt ihr das Inventar gemacht?"* |
| Feiertagsalarm aktiv | *"Morgen schläft die Backstube. Ich auch."* |
| Freitag Nacht | *"Wochenendbrot! Mein Lieblingstag."* |
| Montag früh | *"Wieder Montag. Ich hab Dinkelbrötchen geträumt."* |
| Dinkelbert selbst hungrig | *"Ich auch, übrigens."* → Link zum Tamagotchi |
| Alles gut | Normale Dinkelbert-Weisheiten |

### 6.3 Technisch

`dinkelbert-widget.js` — ~60 Zeilen:
- Liest `BOS_DINKELBERT_v1` aus localStorage
- Rendert Mini-SVG passend zur aktuellen Stufe (~40×40px)
- Tap → kontextuelle Sprechblase
- Long-Press (3s) → öffnet `wurm/wurm.html`
- Liest nur, schreibt nie

---

## 7. Easter Egg Trigger *(noch nicht eingebaut)*

**Long-Press (3 Sekunden) auf das BäckereiOS-Logo:**

```js
let pressTimer = null;
logoEl.addEventListener('pointerdown', () => {
  pressTimer = setTimeout(() => { window.location.href = 'wurm/wurm.html'; }, 3000);
});
logoEl.addEventListener('pointerup',    () => clearTimeout(pressTimer));
logoEl.addEventListener('pointerleave', () => clearTimeout(pressTimer));
```

Kein sichtbarer Hinweis. Wer es findet, findet es durch Neugier.

---

## 8. State-Schema (vollständig)

```json
{
  "ver": 1,
  "born": 1712000000000,
  "seen": 1712086400000,
  "stage": 3,
  "hunger": 72,
  "happy": 65,
  "energy": 80,
  "clean": 88,
  "pets": 47,
  "feeds": 23,
  "plays": 12,
  "deaths": 0,
  "sleeping": false,
  "dead": false,
  "heimgekehrt_um": null,
  "reisen": [
    { "dauer_h": 18, "gepflegt": true,  "zeitpunkt": 1710000000000 },
    { "dauer_h": 44, "gepflegt": false, "zeitpunkt": 1711000000000 }
  ]
}
```

---

## 9. Offene Aufgaben

### Sofort
- [ ] `wurm/wurm.html` ins Repo pushen
- [ ] In `shell.js` registrieren
- [ ] Long-Press Trigger in `index.html`

### Nächste Session — Speichersystem
- [ ] 🕊️ Seelen-Export implementieren (kein Ablaufdatum, kein Transfer)
- [ ] ✉️ Reise-Code implementieren (48h, echter Transfer, State als `unterwegs` markieren)
- [ ] Import-Logik: `typ` prüfen, Ablaufdatum validieren
- [ ] `pissig`-Mood + 2-Stunden-Regel nach Rückkehr
- [ ] `reisen[]` Array im State führen

### Danach
- [ ] `dinkelbert-widget.js` für `index.html` (Maskottchen)
- [ ] Kontextuelles Verhalten mit App-State verknüpfen
- [ ] `sandkasten.html` — passive Würmer

### Längerfristig
- [ ] Saisonale Events (Oster-Dinkelbert, Weihnachts-Zipfelmütze)
- [ ] *"Er hat etwas mitgebracht"* — Zustandsänderung nach Reisen zu anderen Apps
- [ ] Geburtstags-Event am Jahrestag
- [ ] `deaths > 3` → Biographie-Notiz: *"Hat schwere Zeiten gekannt"*
- [ ] PNG-Export als WhatsApp-Sticker

---

## 10. Design-Referenz

```
Farben (konsistent mit BäckereiOS):
  Amber:        #d49a36
  Amber hell:   #f0c864
  Amber dunkel: #a87820
  Hintergrund:  #1a1005
  Surface:      #2a1a0a
  Text:         #f5e8cc
  Muted:        #b08040

Schriften:
  Logo/Titel:   Fraunces (serif)
  UI:           Barlow Condensed

Worm-Körperfarben nach Stage (0→6):
  #fdecc0 → #f5d880 → #eccc68 → #e0b850 → #d4a838 → #c89828 → #b88018
```

---

## 11. Der Schlusspunkt

Die Seele ist das Versprechen: *Ich pass auf dich auf.*
Die Reise ist das Vertrauen: *Ich schick dich zu jemandem.*
Die Rückkehr ist die Gewissheit: *Du kommst immer nach Hause.*
Die 2-Stunden-Regel ist der Charakter: *Aber ich merk's, wenn du nicht da warst.*

Ein Lehrling der Dinkelbert zum ersten Mal entdeckt und laut lacht —
und drei Jahre später sein Gesellenstück macht, mit Dinkelbert der Weise in der Ecke —
das ist der Zweck.

---

*Dokumentation generiert in Zusammenarbeit mit Claude, April 2026.*
*„Er kommt immer nach Hause."*
