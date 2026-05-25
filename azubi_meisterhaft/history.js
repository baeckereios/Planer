/* BÄCKEREI-HISTORIE
 * Sortiert: Chronologisch
 * Feature: wahrheitsGrad (0 = Mythos, 50 = Halbwahrheit, 100 = Fakt)
 */

const historyData = [
    {
        era: "ca. 3000 v. Chr.",
        headline: "Der glückliche Unfall: Erfindung des Sauerteigs",
        story: "Brot war bis dahin ein harter Fladen. In Ägypten ließ jemand Teig in der Sonne stehen. Wilde Hefen aus der Luft infizierten ihn. Das Ergebnis: Das Brot ging auf! Die Ägypter wurden zu den ersten 'Brot-Ingenieuren' und bezahlten Pyramiden-Arbeiter mit Brot und Bier.",
        quelle: "Archäologische Funde in Gizeh",
        image: "🏺",
        wahrheitsGrad: 100 // Bewiesen
    },
    {
        era: "ca. 100 v. Chr.",
        headline: "Panem et Circenses: Brot als Machtinstrument",
        story: "Im Rom der Antike gab es die 'Annona' – kostenloses Staatsbrot für 200.000 Bürger, um Aufstände zu verhindern. Wer die Bäckereien kontrollierte, kontrollierte die Politik.",
        quelle: "Juvenal, Römische Annalen",
        image: "🏛️",
        wahrheitsGrad: 100
    },
    {
        era: "1111 n. Chr.",
        headline: "Das älteste Bäckerwappen",
        story: "Die Brezel taucht erstmals urkundlich als Zunftzeichen auf. Sie symbolisiert verschränkte Arme beim Beten (lat. 'brachium').",
        quelle: "Zunfturkunden",
        image: "🥨",
        wahrheitsGrad: 95
    },
    {
        era: "Mittelalter (12.-15. Jh.)",
        headline: "Die Bäckerstaupe: Die Schand-Taufe",
        story: "Bäcker, deren Brot zu leicht war, wurden in einen Käfig ('Schandkorb') gesteckt und vor johlemden Publikum in den Fluss oder in Jauche getaucht. Daher kommt das 'Bäcker-Dutzend' (13 statt 12) – aus Angst gab man lieber eins mehr dazu.",
        quelle: "Wiener Stadtbuch / Diverse Stadtchroniken",
        image: "⚖️",
        wahrheitsGrad: 90
    },
    {
        era: "1683 (Legende)",
        headline: "Die Erfindung des Croissants / Kipferls",
        story: "Die Legende besagt: Wiener Bäcker hörten die Türken nachts Tunnel graben, schlugen Alarm und durften zur Belohnung ein Gebäck in Halbmond-Form backen. Historisch gab es 'Kipferl' aber schon im 12. Jahrhundert als Klostergebäck.",
        quelle: "Volksmund / Überlieferung",
        image: "🥐",
        wahrheitsGrad: 30 // Eher Mythos
    },
    {
        era: "1756",
        headline: "Der Kartoffelbefehl & die List des Königs",
        story: "Friedrich der Große wollte die Kartoffel einführen. Die Bauern weigerten sich ('Frisst nicht mal der Hund'). Die Legende sagt, er ließ Felder von Soldaten bewachen, um Neugier zu wecken. Bewiesen ist nur der strenge 'Befehl' zum Anbau.",
        quelle: "Preußische Archive",
        image: "🥔",
        wahrheitsGrad: 60 // Mix aus Fakt und Legende
    },
    {
        era: "19. Jh. (Industrie)",
        headline: "Pasteur & die Hefe-Revolution",
        story: "Louis Pasteur entdeckte, dass Hefe ein lebender Pilz ist. Das ermöglichte die Zucht von Industriehefe. Backzeiten sanken von 24h auf 3h. Der Beginn der Massenproduktion.",
        quelle: "Wissenschaftliche Publikationen 1857",
        image: "🔬",
        wahrheitsGrad: 100
    },
    {
        era: "1897",
        headline: "Melba Toast: Diät für die Diva",
        story: "Für die kranke Opernsängerin Nellie Melba erfand Auguste Escoffier im Savoy Hotel extrem dünn geschnittenes, trockenes Toastbrot. Es sollte leicht verdaulich sein.",
        quelle: "Escoffier Biografien",
        image: "🎭",
        wahrheitsGrad: 100
    },
    {
        era: "1916/1917",
        headline: "Der Steckrübenwinter",
        story: "Im 1. Weltkrieg sank die Brotration auf unter 200g. Bäcker mussten Brot aus Steckrübenmehl und Sägemehl strecken. Ein Trauma für das deutsche Handwerk.",
        quelle: "Bundesarchiv",
        image: "❄️",
        wahrheitsGrad: 100
    },
    {
        era: "1920",
        headline: "Warum das Baguette so lang ist",
        story: "Ein Gesetz verbot Bäckern in Paris die Arbeit vor 4 Uhr morgens. Um zum Frühstück fertig zu sein, brauchten sie ein Brot mit maximaler Oberfläche, das in 20 Min. backt (statt 45 Min. für Rundbrot). Das Baguette war die Lösung für ein Arbeitsschutzgesetz.",
        quelle: "Code du Travail 1920",
        image: "🇫🇷",
        wahrheitsGrad: 85 // Sehr plausibel, wenn auch Form vorher bekannt
    }
];
