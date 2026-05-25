# Animationsstudio — Konzept
*Stand: Mai 2026 | Ulf / Claude*

---

## Was es ist

Ein eigenständiges, browser-basiertes Animationsstudio — unabhängig von BäckereiOS. Kein Animations-Framework, kein Profi-Tool. Ein Werkzeug das genau auf diesen Workflow zugeschnitten ist:

> Ulf liefert kreative Entscheidungen und grobe Keyframes.
> Claude übernimmt Interpolation, Timing, Easing und fertigen Animations-Code.

---

## Warum Marionetten-Ansatz

AI-generierte Bilder scheitern an Konsistenz — jedes Bild ist ein neuer Würfelwurf. Ein gerippter Charakter (einmal gezeichnet, in Teile zerlegt) ist per Definition immer derselbe. Schnutzel sieht auf Seite 3 genauso aus wie auf Seite 47, weil es buchstäblich dieselben PNG-Assets sind, nur anders transformiert.

**Technik:** PNG-Teile + CSS-Transform (translate, rotate, scale). Basis-Rig bereits vorhanden: `mehlino_rig2.html`.

---

## Anwendungsfälle

### 1. Mehlino-Animationen
Reaktive Mini-Animationen für BäckereiOS — locker, komisch, situativ. Trigger-basiert (z.B. Froster bestätigt → `happy`-Pose).

### 2. Buchillustrationen — *Das Schutztier*
Stille Momente, emotionale Poses, konsistente Charaktere über alle Seiten hinweg. Hier sind AI-generierte Bilder bisher gescheitert.

---

## Workflow

```
Charakter riggen → Szene beschreiben → Keyframes grob setzen
→ Claude füllt Zwischenpositionen, Timing, Easing
→ Fertiger Animations-Code
```

Ulf bleibt Regisseur. Claude ist der Animator der nicht schläft.

---

## Offene Fragen (vor Implementierung klären)

- **Ausgabe:** Abspielbare HTML-Szene, GIF, Video — oder alles?
- **Szenen:** Nur Bewegung, oder auch Dialoge / Sprechblasen?
- **Charaktere:** Mehrere Figuren gleichzeitig auf der Bühne?
- **Hintergründe:** Statisch oder beweglich?
- **Scope des Studios:** Minimales Keyframe-Tool oder vollständige Timeline?

---

## Stand

- `mehlino_rig2.html` — Rig-Tool existiert, funktioniert
- Konzept definiert, Planung läuft
- Implementierung noch nicht begonnen
