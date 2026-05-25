// ── BäckereiOS · Fehlzeiten & Frühschicht-Einsätze ──────
// Eingebunden als deployted Datei aus Root-Ordner.
// Wird von SchichtPlaner, Notfall-Seite und Konto-Seite gelesen.
//
// Format Fehlzeiten:
//   { personId, von, bis, typ }
//   typ: "krank" | "urlaub"
//
// Format Frühschicht-Einsätze:
//   { personId, von, bis, block }
//   block: "anfang" | "ende" | "custom"
//   + tage: [...] wenn block === "custom"
//
// Stand: leer — keine aktuellen Einträge
// Erstellt: Mai 2026

window.BOS_FEHLZEITEN = [
  // Beispiel (auskommentiert):
  // { personId: "lars", von: "2026-05-05", bis: "2026-05-07", typ: "krank" },
  // { personId: "rosa", von: "2026-05-19", bis: "2026-05-23", typ: "urlaub" },
];

window.BOS_FRUEHSCHICHT = {
  freierTagAnheften: true,
  einsaetze: [
    // Beispiel (auskommentiert):
    // { personId: "marcel", von: "2026-05-05", bis: "2026-05-09", block: "anfang" },
  ]
};
