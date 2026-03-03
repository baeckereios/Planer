/* * BÄCKEREI-NEWSFEED DATENBANK
 * Zeitraum: Dezember 2025 - Februar 2026
 * Quellen-Basis: Trend-Reports, Verbandsmeldungen, Wissenschafts-Ticker.
 */

const newsData = [
    {
        id: 1,
        date: "2026-02-28",
        category: "Recht & Geld",
        headline: "Tarif-Hammer: Mehr Geld für Azubis ab März!",
        teaser: "Gute Nachrichten für den Nachwuchs: Ab dem 1. März 2026 steigen die Ausbildungsvergütungen im Bäckerhandwerk bundesweit an.",
        content: "Der Zentralverband hat geliefert: Ab dem 1. März gibt es ordentlich mehr auf die Hand. Im 1. Lehrjahr steigt die Vergütung auf 1.070 Euro, im 2. auf 1.140 Euro und im 3. Lehrjahr auf stolze 1.280 Euro. Damit soll die Ausbildung wieder attraktiver werden. Experten hoffen, so dem massiven Fachkräftemangel entgegenzuwirken.",
        image: "💰",
        hot: true
    },
    {
        id: 2,
        date: "2026-02-20",
        category: "Trends",
        headline: "Der 'Sourdoughnut' erobert die Theken",
        teaser: "Vergiss den Cronut. 2026 gehört dem Sauerteig-Donut. Warum Kunden plötzlich Schlange stehen für frittierten Sauerteig.",
        content: "Was in New York und London begann, schwappt jetzt voll zu uns rüber: Donuts aus Sauerteig. Der Vorteil? Sie sind weniger süß, haben eine komplexere Aromatik und halten länger frisch als klassische Hefeteig-Donuts. Bäckereien, die ihn als 'gesunde Sünde' vermarkten, melden Rekordumsätze. Der Renner: Füllung mit Blutorangen-Curd.",
        image: "🍩",
        hot: true
    },
    {
        id: 3,
        date: "2026-02-15",
        category: "Technologie",
        headline: "KI schreibt den Dienstplan",
        teaser: "Schluss mit Zettelwirtschaft: Neue KI-Tools sagen Krankheitstage voraus und optimieren Schichten automatisch.",
        content: "Auf der letzten Fachmesse war es DAS Thema: Personalplanung per Algorithmus. Neue Software-Lösungen analysieren Wetterdaten, lokale Events und Krankheitsstatistiken, um den perfekten Dienstplan zu schreiben. Erste Tests zeigen: 20% weniger Überstunden und zufriedenere Mitarbeiter, weil die KI 'faire' Wochenenden berechnet.",
        image: "🤖",
        hot: false
    },
    {
        id: 4,
        date: "2026-02-10",
        category: "Wissenschaft",
        headline: "Studie: Brot allein senkt Blutzucker nicht",
        teaser: "Ernüchterung in der Ernährungswissenschaft: Ein spezielles 'Hafer-Brot' bringt weniger als gedacht.",
        content: "Ein internationales Forscherteam hat untersucht, ob Beta-Glukan-angereichertes Brot bei Diabetikern Wunder wirkt. Das Ergebnis ist ernüchternd: Das Brot allein reicht nicht. Es kommt auf das 'Gesamtpaket' der Ernährung an. Die Forscher warnen davor, Brot als alleiniges Heilmittel zu vermarkten – es bleibt ein Grundnahrungsmittel, keine Medizin.",
        image: "🔬",
        hot: false
    },
    {
        id: 5,
        date: "2026-01-28",
        category: "Trends",
        headline: "Ube & Mochi: Lila ist das neue Gold",
        teaser: "Asiatische Einflüsse dominieren die Snack-Trends 2026. Besonders die lila Yamswurzel (Ube) ist überall.",
        content: "Wer hip sein will, backt lila. Croissants mit Ube-Füllung oder Mochi-Brötchen (aus Klebreismehl) sind der Hit bei der Gen Z. Der Vorteil für Bäcker: Die Farben sind natürlich (Instagram-tauglich!) und die Textur ist völlig neu ('chewy' = kaufreudig). Ein Muss für jede moderne Snack-Theke.",
        image: "🍠",
        hot: true
    },
    {
        id: 6,
        date: "2026-01-22",
        category: "Technologie",
        headline: "3D-Drucker für Tortendeko werden bezahlbar",
        teaser: "Früher Science-Fiction, heute in der Backstube: Schoko-Drucker für unter 2.000 Euro.",
        content: "Der 3D-Lebensmitteldruck verlässt die Nische. Neue Einsteiger-Modelle ermöglichen es Konditoren, komplexe Schoko-Gitter oder personalisierte Marzipan-Figuren zu drucken, die von Hand unmöglich wären. Marktanalysten erwarten, dass bis Ende 2026 jede fünfte Konditorei einen 'Food Printer' nutzt.",
        image: "🖨️",
        hot: false
    },
    {
        id: 7,
        date: "2026-01-15",
        category: "Nachhaltigkeit",
        headline: "Zero Waste: Croutons statt Mülltonne",
        teaser: "Retourenquote senken ist gut, Resteverwertung ist besser. Wie Bäckereien mit Altbrot Geld verdienen.",
        content: "Ein neuer Trend aus Skandinavien: Bäckereien verkaufen ihre Retouren nicht mehr als Tierfutter, sondern veredeln sie. Altbrot wird zu hochwertigen Croutons, Paniermehl oder sogar als Röstbrot-Mehl für neuen Teig (Aroma-Booster!) verarbeitet. Das spart Entsorgungskosten und bringt Marge.",
        image: "♻️",
        hot: false
    },
    {
        id: 8,
        date: "2026-01-08",
        category: "Wissenschaft",
        headline: "Sauerteig-Bakterien als Gesundheits-Polizei?",
        teaser: "Neue Studie der Uni Halle: Milchsäurebakterien können mehr als wir dachten.",
        content: "Forscher haben herausgefunden, dass bestimmte Milchsäurebakterien im Sauerteig gezielt Stärke in Ballaststoffe umbauen können. Das könnte bedeuten: In Zukunft züchten wir Sauerteige, die Weißbrot so gesund machen wie Vollkornbrot. Die 'funktionelle Fermentation' steht erst am Anfang.",
        image: "🦠",
        hot: true
    },
    {
        id: 9,
        date: "2025-12-28",
        category: "Marketing",
        headline: "TikTok-Pflicht für Bäcker?",
        teaser: "Facebook ist tot. Wer Azubis oder Kunden unter 30 sucht, muss 'Reels' drehen.",
        content: "Der Social-Media-Report 2026 ist eindeutig: Bäckereien, die 'Snackable Content' (kurze Videos vom Kneten, Glasieren, Ofen-Aufreißen) posten, haben 40% mehr Bewerber. Der Trend geht weg vom perfekten Werbefoto hin zum authentischen, 'dreckigen' Handwerks-Video. Mehlstaub ist sexy.",
        image: "📱",
        hot: false
    },
    {
        id: 10,
        date: "2025-12-15",
        category: "Rohstoffe",
        headline: "Protein-Brot 2.0: Linsen und Erbsen kommen",
        teaser: "Soja war gestern. Heimische Hülsenfrüchte sind die neuen Stars im Eiweiß-Brot.",
        content: "Kunden wollen Protein, aber kein Soja aus Übersee. Mühlen bieten jetzt verstärkt Mehle aus Ackerbohnen, Erbsen und Linsen an. Die Herausforderung für Bäcker: Der Eigengeschmack muss maskiert werden (z.B. durch Sauerteig), aber die Nährwerte sind unschlagbar.",
        image: "💪",
        hot: false
    }
];
