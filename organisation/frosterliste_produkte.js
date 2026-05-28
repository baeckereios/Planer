/**
 * frosterliste_produkte.js
 * Produktliste für:
 *   – Druckzentrale Modul E (FL_PRODUKTE → Kopiervorlage)
 *   – frosterliste_wochentag.html (+ dbKey → BOS_STAMMDATEN-Lookup)
 *
 * Felder:
 *   mosa    – Text in der MoSa-Spalte  ('' = leer)
 *   so      – Text in der Sonntag-Spalte (null = graue Zelle, kein Sonntag)
 *   wohin   – Schlüssel für WOHIN_LABELS: 'koma7'|'schrippen_koma'|'froster'|'kuehlung'|''
 *   dbKey   – Key in window.BOS_STAMMDATEN (= legacyKey aus produkt_config.json)
 *             null  → kein Eintrag, kein Prefill
 *             Array → Werte werden summiert (z.B. Mohn + Sesam)
 *
 * Keys geprüft gegen produkt_config.json — Mai 2026
 */

var FL_PRODUKTE = [

  // ── Brötchen & Croissants ──────────────────────────────────────────────

  { mosa: '',  so: 'Schrippen (gelbe Dielen)',     wohin: 'schrippen_koma', dbKey: 'schrippen_gesamt_stueck'                         },
  { mosa: '',  so: 'Mohn / Sesam',                 wohin: '',               dbKey: ['kaese_mohn_to_stueck', 'schlawiner_mohn_stueck'] },  // ⚠ kein eigenständiger Mohn/Sesam-Key — prüfen ob korrekt
  { mosa: '',  so: 'Hasenberger',                  wohin: '',               dbKey: 'hasenberger_stueck'                              },
  { mosa: '',  so: 'Kornknacker',                  wohin: '',               dbKey: 'kornknacker_stueck'                              },
  { mosa: '',  so: 'Käsebrötchen',                 wohin: '',               dbKey: 'kaesebroetchen_stueck'                           },
  { mosa: '',  so: 'Laugenstangen',                wohin: '',               dbKey: 'laugenstangen_stueck'                            },
  { mosa: '',  so: 'Hasenpfoten',                  wohin: '',               dbKey: 'hasenpfoetchen_stueck'                           },
  { mosa: '',  so: 'Rosinenbrötchen',              wohin: '',               dbKey: 'rosinen_hedwig_stueck'                           },  // ⚠ rosinen_hedwig oder rosinen_batzen? Bitte prüfen
  { mosa: '',  so: 'Brioche Rosinen',              wohin: '',               dbKey: null                                              },  // ⚠ kein passender Key in produkt_config.json gefunden
  { mosa: '',  so: 'Brioche Schoko',               wohin: '',               dbKey: null                                              },  // ⚠ kein passender Key in produkt_config.json gefunden
  { mosa: '',  so: 'Laugenecken',                  wohin: '',               dbKey: 'laugenecken_gesamt_stueck'                       },
  { mosa: '',  so: 'Buttercroissant',              wohin: '',               dbKey: 'butter_croissant_stueck'                         },
  { mosa: '',  so: 'Schokocroissant',              wohin: '',               dbKey: 'schoko_croissant_stueck'                         },
  { mosa: '',  so: 'Mini-Croissant',               wohin: '',               dbKey: 'mini_croissant_stueck'                           },
  { mosa: '',  so: 'Mini-Schokocroissant',         wohin: '',               dbKey: 'mini_schoko_croissant_stueck'                    },

  // ── Plunder (nur Mo–Sa) ────────────────────────────────────────────────

  { mosa: 'Plunderstreifen',    so: null, wohin: '', dbKey: 'plunderstreifen_stueck'   },
  { mosa: 'Spiegel-Ei Plunder', so: null, wohin: '', dbKey: 'spiegelei_plunder_stueck' },
  { mosa: 'Schnecken',          so: null, wohin: '', dbKey: 'schnecken_stueck'         },
  { mosa: 'Zimtwolken',         so: null, wohin: '', dbKey: 'zimt_woelkchen_stueck'    },

  // ── Kuchen & Baguette ─────────────────────────────────────────────────

  { mosa: '',  so: 'Streuselkuchen',               wohin: '',               dbKey: 'streuselkuchen_stueck'   },
  { mosa: '',  so: 'Baguettestangen (Lochbleche)', wohin: '',               dbKey: 'baguettestange_teig_stueck' },  // ⚠ teig_stueck = Teigling (gefroren) — prüfen ob richtig
  { mosa: '',  so: 'Zwiebelbaguette (Lochbleche)', wohin: '',               dbKey: 'zwiebelstange_teig_stueck'  },  // ⚠ teig_stueck = Teigling — prüfen ob richtig

  // ── Weißbrote ─────────────────────────────────────────────────────────

  { mosa: 'Weißbrote', so: null,  wohin: '',  dbKey: null },
  { mosa: '',  so: 'Baguettestangen für Fahrer (rote Dielen)', wohin: '', dbKey: 'baguettestange_teig_stueck' },  // ⚠ gleicher Key wie Lochbleche — prüfen
  { mosa: '',  so: 'Zwiebelbaguette für Fahrer (rote Dielen)', wohin: '', dbKey: 'zwiebelstange_teig_stueck'  },  // ⚠ gleicher Key wie Lochbleche — prüfen
  { mosa: '',  so: 'Schlawiner',                   wohin: '',               dbKey: 'schlawiner_gesamt_stueck' },

  // ── Leerzeile ─────────────────────────────────────────────────────────

  { mosa: '',  so: '',  wohin: '',  dbKey: null },

  // ── Sonderprodukte ────────────────────────────────────────────────────

  { mosa: 'Dinkelschoko Zwerge', so: null, wohin: 'froster', dbKey: 'dinkel_zwerg_stueck'      },
  { mosa: 'Plunder Schiffchen',  so: null, wohin: 'koma7',   dbKey: 'plunderschiffe_vegan_stueck' },  // ⚠ vegan-Variante — prüfen ob richtig

];
