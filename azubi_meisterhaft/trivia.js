/* PAUSEN-SNACKS (WISSEN TO GO)
 * Fokus: Kurioses, Physik, Chemie & Aha-Momente
 * Kombiniert: Klassiker & Neue Entdeckungen
 */

const triviaData = [
    // --- NEUE HIGHTLIGHTS ---
    {
        kategorie: "Lifehack",
        frage: "Brot als Radiergummi?",
        antwort: "Ja, vor 1770 Standard!",
        story: "Bevor der Kautschuk-Radierer erfunden wurde, nutzten Künstler und Schreiber weiche Brot-Krume, um Bleistift- oder Kohlezeichnungen zu korrigieren. Brot war das 'Löschpapier' des Mittelalters.",
        funFact: "Man musste das Brot täglich frisch 'kneten', sonst wurde der Radierer hart.",
        icon: "✏️",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Etymologie",
        frage: "Woher kommt 'Die oberen Zehntausend'?",
        antwort: "Vom englischen 'Upper Crust'.",
        story: "Im 16. Jahrhundert wurde Brot im Steinofen gebacken. Der Boden war oft verbrannt oder aschig. Die 'obere Kruste' (Upper Crust) war der sauberste und leckerste Teil – sie wurde dem Adel serviert. Das Gesinde bekam den Boden.",
        funFact: "Brot war früher ein direkter Status-Indikator bei Tisch.",
        icon: "🎩",
        wahrheitsGrad: 90
    },
    {
        kategorie: "Archäologie",
        frage: "Warum hatte römisches Brot Stempel?",
        antwort: "Diebstahlschutz im Ofen.",
        story: "In Pompeji hatten die meisten Häuser keine eigenen Öfen. Man brachte den Teigling zum öffentlichen Bäcker. Damit man sein eigenes Brot zurückbekam (und nicht das kleinere des Nachbarn), drückte jede Familie ihren Stempel (Signum) in den Teig.",
        funFact: "Ein Laib aus Pompeji (79 n. Chr.) ist samt Stempel versteinert erhalten geblieben.",
        icon: "🏛️",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Chemie",
        frage: "Warum klebt Roggen so eklig?",
        antwort: "Wegen der Pentosane.",
        story: "Weizen hat Gluten (Kleber), Roggen hat Schleimstoffe (Pentosane). Diese Zuckerarten saugen extrem viel Wasser auf und bilden eine glitschige Masse, die das Gaggerüst stützt. Deshalb darf man Roggen nicht so wild kneten wie Weizen.",
        funFact: "Roggen ohne Sauerteig wird zu einem nassen Ziegelstein.",
        icon: "🧪",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Geschichte",
        frage: "Wer erfand das Sandwich?",
        antwort: "Ein spielsüchtiger Graf.",
        story: "John Montagu, der 4. Earl of Sandwich (1762), war ein besessener Kartenspieler. Er wollte den Spieltisch nicht verlassen, um zu essen. Also befahl er seinem Diener, Fleisch zwischen zwei Brotscheiben zu legen, damit seine Finger nicht fettig wurden und die Karten sauber blieben.",
        funFact: "Seine Mitspieler bestellten dann: 'Das Gleiche wie Sandwich!'",
        icon: "🥪",
        wahrheitsGrad: 95
    },
    {
        kategorie: "Kultur",
        frage: "Die 'Sauerteig-Bibliothek'",
        antwort: "Ein Hochsicherheitstrakt für Hefe.",
        story: "In Belgien (St. Vith) gibt es die weltweit einzige Sauerteig-Bibliothek. Dort lagern über 120 verschiedene Sauerteige aus der ganzen Welt in Kühlschränken. Sie werden jedes Jahr mit ihrem Original-Mehl 'gefüttert', um die einzigartigen Bakterienkulturen zu erhalten.",
        funFact: "Der älteste Teig dort stammt angeblich aus dem Goldrausch (ca. 1890).",
        icon: "🇧🇪",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Logistik",
        frage: "Der Farb-Code der Verschlüsse",
        antwort: "Verrät, wann gebacken wurde.",
        story: "In den USA (und manchen Großbäckereien) haben die Plastik-Clips an Brottüten verschiedene Farben (Blau, Grün, Rot, Weiß, Gelb). Diese stehen oft für den Wochentag (Montag bis Freitag), damit das Personal im Supermarkt sofort sieht, welches Brot alt ist.",
        funFact: "Alphabetische Reihenfolge der Farben = Reihenfolge der Wochentage.",
        icon: "📅",
        wahrheitsGrad: 80
    },
    {
        kategorie: "Biologie",
        frage: "Hefe ist ein Kraftprotz.",
        antwort: "Stärker als jeder Bodybuilder.",
        story: "Wenn Hefe gärt, entsteht CO2-Gas mit einem Druck von bis zu 10 Bar (mehr als ein Autoreifen!). In einem geschlossenen Gefäß würde der Teig explodieren. Deshalb 'geht' der Teig auf – die Hefe drückt das Klebergerüst gnadenlos nach oben.",
        funFact: "Hefe verdoppelt sich bei optimaler Temperatur alle 90 Minuten.",
        icon: "💪",
        wahrheitsGrad: 100
    },
    
    // --- DIE KLASSIKER ---
    {
        kategorie: "Raumfahrt",
        frage: "Warum ist Brot im Weltall verboten?",
        antwort: "Wegen der Krümel.",
        story: "1965 schmuggelte Astronaut John Young ein Corned-Beef-Sandwich an Bord von Gemini 3. Die Krümel flogen in der Schwerelosigkeit herum und bedrohten die Elektronik. Seitdem nutzen Astronauten Tortillas – die krümeln nicht.",
        funFact: "Es gibt eine NASA-Spezifikation für 'Low Crumb Bread'.",
        icon: "🚀",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Physik",
        frage: "Warum 'singt' das Brot?",
        antwort: "Es ist das Knacken der Kruste.",
        story: "Wenn Brot aus dem Ofen kommt, kühlt die Kruste schneller ab als die Krume. Die Kruste zieht sich zusammen, während das Innere noch dampft. Diese physikalische Spannung erzeugt ein knisterndes Geräusch – das 'Singen' des Brotes. Ein Qualitätsmerkmal!",
        funFact: "Kein Singen = oft zu wenig ausgebacken.",
        icon: "🎶",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Chemie",
        frage: "Ist Alkohol im Brot?",
        antwort: "Ja, vor dem Backen sogar viel!",
        story: "Hefe wandelt Zucker in CO2 (Lockerung) und Ethanol (Alkohol) um. Ein gut gegangener Teig kann 2-3% Alkohol enthalten. Aber keine Sorge: Er verdampft im Ofen fast vollständig. Übrig bleibt nur das Aroma.",
        funFact: "Man müsste 100kg rohen Teig essen, um betrunken zu werden.",
        icon: "🍺",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Etymologie",
        frage: "Was bedeutet 'Pumpernickel'?",
        antwort: "Der furzende Kobold.",
        story: "Kein Witz: Es kommt aus dem alten westfälischen Dialekt. 'Pumpern' (Pupsen/Donnern) + 'Nickel' (ein Kobold/Teufel). Der Name beschreibt humorvoll die verdauungsfördernde Wirkung des Vollkorns.",
        funFact: "Es wird bei nur 100°C für 24 Stunden gedämpft.",
        icon: "💨",
        wahrheitsGrad: 95
    },
    {
        kategorie: "Innovation",
        frage: "Das beste Ding seit geschnittenem Brot?",
        antwort: "Die Erfindung ist noch keine 100 Jahre alt.",
        story: "Bis 1928 kaufte man Brot nur am Stück. Otto Rohwedder erfand die Schneidemaschine, aber Bäcker hassten sie: 'Das Brot wird trocken!'. Erst als 'Wonder Bread' es verpackte, wurde es der Welthit.",
        funFact: "Vor 1928 brach man Brot oft einfach per Hand.",
        icon: "🔪",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Gesetz",
        frage: "Wann ist Brot eigentlich Kuchen?",
        antwort: "Wenn zu viel Zucker drin ist.",
        story: "In Irland entschied der Oberste Gerichtshof: Die Brötchen von Subway enthalten so viel Zucker (10% statt 2%), dass sie steuerrechtlich kein Grundnahrungsmittel (Brot), sondern Süßwaren (Kuchen) sind. Daher fällt eine höhere Mehrwertsteuer an.",
        funFact: "Zucker ist Nahrung für die Hefe – aber 10% ist zu viel.",
        icon: "🍰",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Botanik",
        frage: "Bananen sind Klone.",
        antwort: "Und das bedroht unser Bananenbrot.",
        story: "Fast alle Bananen weltweit gehören zur Sorte 'Cavendish' und sind genetisch identisch (Klone). Ein einziger Pilz (TR4) könnte die gesamte Weltproduktion auslöschen, weil keine Pflanze resistent ist. Das passierte schonmal in den 1950ern mit der Sorte 'Gros Michel'.",
        funFact: "Die 'Gros Michel' schmeckte intensiver – wie künstliches Bananenaroma heute.",
        icon: "🍌",
        wahrheitsGrad: 100
    },
    {
        kategorie: "Chemie",
        frage: "Warum ist die Kruste leckerer?",
        antwort: "Die Maillard-Reaktion.",
        story: "Ab ca. 140°C reagieren Aminosäuren (Eiweiß) mit Zucker. Dabei entstehen hunderte neue Röst- und Aromastoffe und die braune Farbe. Das Innere (Krume) wird nie heißer als 100°C (wegen Wasser), daher fehlt dort das Röstaroma.",
        funFact: "Gleiches Prinzip wie beim Steak-Anbraten.",
        icon: "🔥",
        wahrheitsGrad: 100
    }
];
