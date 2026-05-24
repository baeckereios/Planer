# Dokumentations-Ordnung — BäckereiOS
_Stand: 14.05.2026 · Erstellt von Claude_

---

## Vorgeschlagene Ordnerstruktur

```
dokumentation/
├── UMGESETZT/
│   ├── Kern/
│   ├── Features/
│   └── Sessions/
├── KONZEPTE/
├── IDEEN/
└── _ARCHIV/          ← zum Löschen oder Einfrieren
```

---

## 🟢 UMGESETZT — Kern-Systeme

Vollständig implementiert, produktiv, live auf GitHub Pages.

| Datei | Stand | Hinweis |
|---|---|---|
| `schichtplaner_doku.md` | April 2026 | Nach Modularisierung aktuell |
| `bestandsuebersicht_doku.md` | April 2026 | Aktuell (inkl. Balken-Farblogik) |
| `DRUCKZENTRALE.md` | April 2026 | Nach Modularisierung (5 Module + BÄKO) aktuell |
| `FROSTER_SYSTEM_DOKU.md` | Mai 2026 | **Hybrid** — Teile 1–3 umgesetzt; Optimierer-Abschnitt = Konzept (eingebettet, klar getrennt) |
| `LIEFERANTEN_INVENTUR.md` | April 2026 | Lieferanten-System v1; v2 in `entwicklung_mai_2026.md` |
| `schlawiner_rechner_doku.md` | April 2026 | Produktiv |
| `baguette_rechner_DOKU.md` | April 2026 | Produktiv |

---

## 🟢 UMGESETZT — Features

Implementiert, teils spezialisiert oder eingeschränkt aktiv.

| Datei | Stand | Hinweis |
|---|---|---|
| `NFC_SYSTEM_DOKU.md` | 12.05.2026 | Status: Produktiv |
| `STECKBRIEF_DOKU.md` | Mai 2026 | Produktiv, NFC-verknüpft |
| `OFEN_SIMULATOR_DOKU.md` | Mai 2026 | Einzelne HTML-Datei, standalone |
| `quick_nav.md` | 14.05.2026 | Ersetzt Sniper-Menü, implementiert |
| `produktionsverlauf_DOKU.md` | April 2026 | Produktiv |
| `dinkelbert_doku.md` | April 2026 | Easter Egg, produktiv |
| `WURM_DOKUMENTATION.md` | April 2026 | Implementiert, aber `wurm_aktiv: false` — bewusst deaktiviert bis Datenbasis reicht |
| `wurm.html` | April 2026 | Visuelle Habitat-Dokumentation (HTML) |

---

## 🟢 UMGESETZT — Sessions / Changelog

Protokolle abgeschlossener Sessions. Nicht löschen — sind Entscheidungsgeschichte.

| Datei | Datum | Inhalt |
|---|---|---|
| `SESSION_NFC_PANEL_LOGO.md` | **14.05.2026** | NFC-Panel + Logo-Editor + Druckzentrale Tab 4 |
| `SESSION_DOKU_2026-05-13.md` | 13.05.2026 | Bugfixes steckbrief_editor, Dropdown, Preise |
| `entwicklung_mai_2026.md` | 10.05.2026 | Lieferanten v2, NFC-Integration, Steckbriefe |

---

## 🟡 KONZEPTE — Bereit zum Bauen

Vollständig durchdacht, architekturell abgeschlossen, noch nicht implementiert.

| Datei | Stand | Bereit? |
|---|---|---|
| `KONZEPT_planverwaltung-2.md` | April 2026 | ✅ „Konzept abgeschlossen — bereit zum Bauen" (v2, ersetzt v1) |
| `KONZEPT_kontoseite.md` | Mai 2026 | ✅ „Konzept abgeschlossen — bereit zum Bauen" |
| `INFOBLAETTER_KONZEPT.md` | Mai 2026 | 🔶 Konzept mit klarer Vision, Umsetzung offen |

**Hinweis:** Der Froster-Optimierer ist als eigenständiger Abschnitt in `FROSTER_SYSTEM_DOKU.md` eingebettet (Seite 264ff). Kein eigenes Konzept-Dokument nötig.

---

## 🔵 IDEEN — Skizzen & Explorationen

Noch nicht konzeptionell abgeschlossen oder von größerem Scope.

| Datei | Stand | Hinweis |
|---|---|---|
| `konzept_tier_assistent.md` | April 2026 | Umfangreiche Idee, BäckereiOS-Assistent mit Tier-Charakter |
| `nfc_baeckereios_konzept.md` | Mai 2026 | Teils umgesetzt (NFC-Schild live); Lager-Inventur wartet auf Lagersystem-Überarbeitung |
| `animationsstudio_konzept.md` | Mai 2026 | Außerhalb BäckereiOS — Standalone-Animationstool |
| `nfc_pausentimer.md` | Mai 2026 | „Nebenkriegsschauplatz", Aufwand trivial, noch nicht angegangen |

---

## 🔴 ARCHIV — Zum Löschen oder Einfrieren

Diese Dateien sind veraltet, überholt oder einmalig gewesen.

| Datei | Grund |
|---|---|
| `KONZEPT_planverwaltung.md` | **Durch v2 überholt.** Inhaltlich ersetzt durch `KONZEPT_planverwaltung-2.md`. Kann weg — oder in `_ARCHIV/` wenn du Entscheidungsgeschichte behalten willst. |
| `sniper_menue.md` | **Verworfen.** Explizit ersetzt durch Quick-Nav-Buttons (`quick_nav.md`). Code wurde aus `bestandsuebersicht.html` entfernt. |
| `UEBERGABE_naechste_session.md` | **Einmalig.** Session-Übergabe April 2026 — diese Session ist seit Wochen abgeschlossen. Kein Informationswert mehr. |

---

## Zusammenfassung

| Kategorie | Anzahl Dateien |
|---|---|
| 🟢 Umgesetzt (Kern) | 7 |
| 🟢 Umgesetzt (Features) | 8 |
| 🟢 Umgesetzt (Sessions) | 3 |
| 🟡 Konzepte | 3 |
| 🔵 Ideen | 4 |
| 🔴 Archiv / löschen | 3 |
| **Gesamt** | **28** |

---

## Offene Frage

`LIEFERANTEN_INVENTUR.md` dokumentiert noch das v1-System. `entwicklung_mai_2026.md` beschreibt das v2-Lieferanten-System. Eine aktualisierte `LIEFERANTEN_SYSTEM_DOKU.md` für v2 fehlt noch — oder der Mai-Changelog ist bewusst die einzige Quelle. Das solltest du entscheiden.
