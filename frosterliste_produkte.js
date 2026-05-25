// frosterliste_produkte.js
// Produktliste für die Frosterliste (Druckzentrale Modul E)
// Korrigiert 10.4.2026
//
// Felder pro Eintrag:
//   mosa   {string}       Text für die MoSa-Spalte (leer wenn nur So-Produkt)
//   so     {string|null}  Text für die So-Spalte (null = kein Sonntag / no-sunday)
//   wohin  {string}       Voreinstellung: "koma7"|"schrippen_koma"|"froster"|"kuehlung"|""

var FL_PRODUKTE = [
    { mosa: "", so: "Schrippen (gelbe Dielen)", wohin: "schrippen_koma" },
    { mosa: "", so: "Mohn / Sesam", wohin: "" },
    { mosa: "", so: "Hasenberger", wohin: "" },
    { mosa: "", so: "Kornknacker", wohin: "" },
    { mosa: "", so: "Käsebrötchen", wohin: "" },
    { mosa: "", so: "Laugenstangen", wohin: "" },
    { mosa: "", so: "Hasenpfoten", wohin: "" },
    { mosa: "", so: "Rosinenbrötchen", wohin: "" },
    { mosa: "", so: "Brioche Rosinen", wohin: "" },
    { mosa: "", so: "Brioche Schoko", wohin: "" },
    { mosa: "", so: "Laugenecken", wohin: "" },
    { mosa: "", so: "Buttercroissant", wohin: "" },
    { mosa: "", so: "Schokocroissant", wohin: "" },
    { mosa: "", so: "Mini-Croissant", wohin: "" },
    { mosa: "", so: "Mini-Schokocroissant", wohin: "" },
    { mosa: "Plunderstreifen", so: null, wohin: "" },
    { mosa: "Spiegel-Ei Plunder", so: null, wohin: "" },
    { mosa: "Schnecken", so: null, wohin: "" },
    { mosa: "Zimtwolken", so: null, wohin: "" },
    { mosa: "", so: "Streuselkuchen", wohin: "" },
    { mosa: "", so: "Baguettestangen (Lochbleche)", wohin: "" },
    { mosa: "", so: "Zwiebelbaguette (Lochbleche)", wohin: "" },
    { mosa: "Weißbrote", so: null, wohin: "" },
    { mosa: "", so: "Baguettestangen für Fahrer (rote Dielen)", wohin: "" },
    { mosa: "", so: "Zwiebelbaguette für Fahrer (rote Dielen)", wohin: "" },
    { mosa: "", so: "Schlawiner", wohin: "" },
    { mosa: "", so: "", wohin: "" },
    { mosa: "Dinkelschoko Zwerge", so: "", wohin: "froster" },
    { mosa: "Plunder Schiffchen", so: "", wohin: "koma7" }
];
