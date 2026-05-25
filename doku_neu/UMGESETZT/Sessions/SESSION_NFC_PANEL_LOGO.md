# Session-Dokumentation · NFC Panel + Logo-Editor + Druckzentrale Tab 4
_Datum: 14.05.2026 · [Claude]_

---

## Überblick

Diese Session hat drei zusammenhängende Themen bearbeitet:
1. NFC-Zugangspanel als neues Druckformat
2. BäckereiOS Wortmarke als speicherbare SVG-Schablone
3. Integration beider Ergebnisse in die Druckzentrale

---

## 1. Konzept: NFC-Zugangspanel

### Idee
Ein laminiertes A4-Hochformat-Panel das als physisches Inhaltsverzeichnis von BäckereiOS dient. Jede Zeile entspricht einem Bereich — mit QR-Code, Bereichsname und NFC-Chip-Platzhalter. Das Panel hängt am schwarzen Brett oder liegt auf dem Schreibtisch. Chip antippen → BäckereiOS öffnet direkt den richtigen Bereich.

### Poka-Yoke-Muster (Ulfs Idee)
Die Zeilen alternieren zwischen zwei Layouts:
- **Gerade Zeilen:** QR-Code links · Label Mitte · NFC rechts
- **Ungerade Zeilen:** NFC links · Label Mitte · QR-Code rechts

→ Der NFC-Chip ist immer zwischen zwei QR-Codes eingebettet. Fehltippen auf den falschen Chip wird durch den QR-Code als physische Barriere verhindert.

### Abgrenzung zu Modul Schild (Tab 3)
| Modul Schild | Modul Panel |
|---|---|
| Ein Schild pro Station | Mehrere Bereiche auf einem Panel |
| A4 Querformat | A4 Hochformat |
| Großer Stationsname | Übersicht / Inhaltsverzeichnis |
| Eigener Druckjob via window.open | Standard window.print() |
| Web NFC API (Chip lesen) | Nur Platzhalter (Chip manuell aufkleben) |

---

## 2. BäckereiOS Wortmarke (SVG)

### Problem
Der Logo-Schriftzug war bisher inline HTML/CSS in jeder Seite. Kein einheitliches Muster, nicht als Schablone verwendbar.

### Lösung
- `baeckereios_logo_light.svg` — exportierte Wortmarke, speicherbar, einbindbar per `<img src="...">`
- `baeckereios_logo_editor.html` — interaktiver Editor mit Live-Vorschau (hell + dunkel), SVG-Export-Button

### Logo-Spezifikation (Stand dieser Session)
```
Bäckerei   → Fraunces 900, 48pt, #1a1a1a, y=50
OS         → Fraunces 400, 50pt, #d49a36, y=48
Trennlinie → #d49a36, 1.2pt
Untertitel → Barlow Condensed 500, 11pt, #888, letter-spacing 2.5
             BÄCKEREI LANGREHR · GARBSEN · HAVELSE
```

**Wichtig:** `OS` ist bewusst größer als `Bäckerei` (50pt vs 48pt) — Eyecatcher, Markencharakter.  
`y=48` für OS statt y=50 → optische Grundlinien-Angleichung.

### Einbindung Druckzentrale
```html
<img src="baeckereios_logo_light.svg" alt="BäckereiOS"
     style="height:44px;width:auto;display:block;margin:6px 0;">
```
Ersetzt: `<div class="brand-logo">Bäckerei<span>OS</span></div>`

---

## 3. Neue / geänderte Dateien

### Neu
| Datei | Beschreibung |
|---|---|
| `druckzentrale_modul_panel.js` | Tab 4 der Druckzentrale — NFC-Panel Generator |
| `baeckereios_logo_editor.html` | Interaktiver Logo-Editor, SVG-Export |
| `baeckereios_logo_light.svg` | Exportierte Wortmarke (helle Variante) |

### Geändert
| Datei | Änderung |
|---|---|
| `druckzentrale.html` | Tab "Panel" ergänzt, SVG-Logo statt Text-Logo, Script-Tag für Modul Panel |
| `admin_landing.html` | Kachel "Logo-Editor" in Spezialwerkzeuge, Count 3→4 |
| `shell.js` | PAGE_CONFIG: `baeckereios_logo_editor.html` + `nfc_panel.html` eingetragen |

### Unberührt
| Datei | Warum |
|---|---|
| `druckzentrale_modul_schild.js` | Bestehendes Modul — vollständig, kein Änderungsbedarf |
| `nfc_panel.html` | Eigenständige Seite bleibt erhalten (andere Nutzung möglich) |

---

## 4. Architektur-Entscheidungen

### Admin-Tools nicht in PAGE_CONFIG
Admin-Tools (`brot_admin.html`, `serviceworker_generator.html` etc.) binden `shell.js` nicht ein und sind intentional unsichtbar für `BOS_PAGE_CONFIG`. Zugriff läuft ausschließlich über `admin_landing.html` + PIN.

> _Merksatz: Admin-Tools sind intentional unsichtbar für BOS_PAGE_CONFIG — Zugriff nur über Landing Page + PIN._

### Logo als SVG statt inline CSS
Vorteil: Eine Datei ändern → alle einbindenden Seiten aktualisiert. Schablone für neue Seiten ohne Copy-Paste.

### Modul-Namespace-Konvention
- Schild-Modul: `DZ_SCHILD_*`
- Panel-Modul: `PANEL_*`
- Storage-Keys getrennt: `BOS_NFC_PANEL_CONFIG`

---

## 5. Deploy-Checkliste

```
[ ] druckzentrale/druckzentrale.html         (Logo + Tab 4)
[ ] druckzentrale/druckzentrale_modul_panel.js  (neu)
[ ] baeckereios_logo_light.svg               (neu, Root oder druckzentrale/)
[ ] baeckereios_logo_editor.html             (neu, Admin-Bereich)
[ ] admin_landing.html                       (Kachel + Count)
[ ] shell.js                                 (PAGE_CONFIG +2)
```

**Offene Frage vor Deploy:** Liegt `baeckereios_logo_light.svg` im Root-Ordner oder im `druckzentrale/`-Unterordner? Der `img`-Pfad in `druckzentrale.html` ist aktuell relativ (`src="baeckereios_logo_light.svg"`).

---

## 6. Offene Ideen / Folgethemen

- **Rollenbasiertes Dashboard** (Produktionsleiter-Ansicht): Dedizierte Read-Only-Seite die nur die für diese Person relevanten Module zeigt. NFC-Chip als Eingangstür. Eigenständiges Bauprojekt.
- **Logo dunkel-Variante** (`baeckereios_logo_dark.svg`) für dunkle Hintergründe — noch nicht exportiert.
- **Logo in weitere Seiten** einbauen wo noch `brand-logo` als Text-HTML steht.
