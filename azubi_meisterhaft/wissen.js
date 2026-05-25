/* * BÄCKEREI-WISSENSDATENBANK (MASTER EDITION)
 * Enthält:
 * 1. Azubi-Basics (Verständnis & Eselsbrücken)
 * 2. Profi-Wissen (Chemie, Mikrobiologie, Physik)
 * 3. Fachmathematik & Gesetzliche Grundlagen
 */

const azubiWissen = [
    // ==========================================
    // KAPITEL 1: ROHSTOFFE (MEHL, CHEMIE & TRIEB)
    // ==========================================
    {
        kategorie: "Rohstoffe & Chemie",
        icon: "🌾",
        eintraege: [
            {
                titel: "Mehltypen & Ausmahlungsgrad",
                inhalt: "Die Zahl (Type) verrät, wie viel Schale im Mehl ist.\n\nAZUBI-WISSEN:\nJe höher die Zahl, desto dunkler und gesünder ist das Mehl. Type 405 ist weißes Puder für Kuchen. Type 1050 ist grauer und kräftiger für Brot.\n\nWISSENSCHAFT:\nDie Type gibt den Mineralstoffgehalt in mg pro 100g Trockenmasse an (Aschegehalt). Schalenanteile enthalten Enzyme und Vitamine, aber sie stören das Klebergerüst. \n- Type 405: Fast reine Stärke & Protein (hohe Gärstabilität).\n- Type 1050/1150: Hohe Wasseraufnahme durch Schalenanteile (Pentosane), aber geringere Volumenausbeute.",
                fehler: "Brötchen mit Type 405 gebacken? Sie werden zwar riesig, schmecken aber leer und trocknen sofort aus. Brötchen brauchen Type 550 für den Kompromiss aus Volumen und Geschmack.",
                proTipp: "Merk dir: Hohe Type = Mehr Wasser schütten (höhere TA)!"
            },
            {
                titel: "Der Kleber (Gluten) - Das Gerüst",
                inhalt: "AZUBI-WISSEN:\nOhne Kleber kein Brot. Das ist das Gummiband im Teig, das die Luft festhält.\n\nWISSENSCHAFT:\nGluten existiert nicht im trockenen Korn! Es entsteht erst durch Wasser + Kneten aus den Eiweißen Gliadin und Glutenin.\n- Gliadin: Sorgt für Viskosität (Dehnbarkeit/Fließen).\n- Glutenin: Sorgt für Elastizität (Widerstand/Stand).\nDas Verhältnis entscheidet über die Backeigenschaft.",
                fehler: "Teig läuft breit? Zu viel Gliadin oder überknetet (Kleberstruktur zerstört). Teig 'schnurrt' (zieht sich zusammen)? Zu viel Glutenin oder zu kurz geknetet (Kleber noch zu straff, 'bockig').",
                proTipp: "Eine Teigruhe entspannt das Glutenin. Deshalb lassen sich Brötchen nach 10 min Ruhe viel leichter formen."
            },
            {
                titel: "Salz & Hefe - Eine Hassliebe",
                inhalt: "AZUBI-WISSEN:\nSalz gibt Geschmack. Aber Vorsicht: Salz tötet Hefe!\n\nWISSENSCHAFT:\nSalz ist hygroskopisch (wasseranziehend). Hefe besteht größtenteils aus Zellwasser. Liegt Salz direkt auf der Hefe, entsteht ein osmotischer Druck: Das Salz saugt das Wasser durch die Zellmembran aus der Hefe. Die Zelle vertrocknet (Plasmolyse). Außerdem stärkt Salz die Kleberstruktur (ionische Bindungen).",
                fehler: "Salz vergessen? Der Teig klebt, läuft breit (Kleber fehlt Stabilität) und die Hefe gärt unkontrolliert schnell (Übergare).",
                proTipp: "Eselsbrücke: 'Salz und Hefe sind wie Romeo und Julia - sie lieben sich im Teig, aber sterben bei direkter Berührung.'"
            },
            {
                titel: "Lauge (Brezeln) - Gefahr & Genuss",
                inhalt: "AZUBI-WISSEN:\nNatronlauge (NaOH) ist ätzend (Schutzbrille!). Aber im Ofen wird sie harmlos und lecker.\n\nWISSENSCHAFT:\nDie Lauge (pH-Wert 13-14) reagiert mit dem CO2 im Ofen und der Hitze zu Natriumcarbonat (Soda) – das ist ungiftig. Chemisch passiert an der Oberfläche eine extrem beschleunigte Maillard-Reaktion: Die Lauge spaltet die Proteine auf, sodass sie extrem schnell mit dem Zucker reagieren. Ergebnis: Die typische kastanienbraune Farbe und der seifig-laugenartige Geschmack.",
                fehler: "Lauge nicht gebacken? Giftig! Verätzungsgefahr in Speiseröhre.",
                proTipp: "Merksatz: 'Roh ist sie der Tod, gebacken macht sie rot (braun).'"
            },
            {
                titel: "Triebmittel im Vergleich",
                inhalt: "1. Hefe (Saccharomyces cerevisiae): Biologischer Trieb. Braucht Zeit. Bildet CO2 + Alkohol (Aroma).\n2. Backpulver: Chemischer Trieb (Säure + Natron). Reagiert sofort bei Feuchtigkeit/Hitze. Für Massen ohne Kleber.\n3. Hirschhornsalz (ABC-Trieb): Zerfällt bei Hitze komplett in Ammoniak, CO2 und Wasserdampf. Nur für flaches Gebäck (Amerikaner, Spekulatius), damit das Ammoniak entweichen kann.",
                fehler: "Hirschhornsalz im hohen Napfkuchen? Das Ammoniak bleibt im Kuchen gefangen. Er stinkt nach Katzenklo/Urin.",
                proTipp: "Pottasche treibt in die Breite (Lebkuchen), Hirschhornsalz treibt in die Höhe."
            }
        ]
    },

    // ==========================================
    // KAPITEL 2: SAUERTEIG & MIKROBIOLOGIE
    // ==========================================
    {
        kategorie: "Sauerteig & Fermentation",
        icon: "🦠",
        eintraege: [
            {
                titel: "Warum Roggen Sauerteig BRAUCHT",
                inhalt: "AZUBI-WISSEN:\nWeizen backt so, Roggen ist eine Diva. Ohne Säure wird Roggenbrot innen matschig.\n\nWISSENSCHAFT:\nRoggen bildet kein Klebergerüst, sondern stabilisiert sich über Pentosane (Schleimstoffe) und Stärke. Roggen enthält aber von Natur aus viele Amylasen (Enzyme). Diese Enzyme fressen im Ofen die Stärke weg, bevor sie verkleistern kann. Die Säure des Sauerteigs hemmt (deaktiviert) diese Amylasen. Ohne Säure = Stärkeabbau = 'Fremdback' (Krumenriss, nass).",
                fehler: "Sauerteig vergessen? Du bäckst einen Ziegelstein, der innen flüssig ist.",
                proTipp: "Merke: Weizen braucht Kleber, Roggen braucht Säure."
            },
            {
                titel: "Mikrobiologie: Wer lebt da?",
                inhalt: "Im Sauerteig leben wilde Hefen (Trieb) und Milchsäurebakterien (Geschmack/Säure).\n\n1. Homofermentative Bakterien: Bilden nur Milchsäure (mild). Lieben Wärme (30°C+) und weiche Teige.\n2. Heterofermentative Bakterien: Bilden Milchsäure UND Essigsäure (scharf) + CO2. Lieben Kälte (<26°C) und feste Teige.",
                fehler: "Brot schmeckt stechend sauer? Zu kalt geführt (zu viel Essigsäure). Brot schmeckt fade? Zu warm geführt.",
                proTipp: "Ideales Verhältnis Milchsäure zu Essigsäure ist 80:20."
            },
            {
                titel: "Detmolder Dreistufenführung (Der Endgegner)",
                inhalt: "Das Standardverfahren zur perfekten Steuerung:\n\n1. Anfrischsauer (Hefevermehrung): Weich & Warm (25-26°C). Ziel: Hefen wecken.\n2. Grundsauer (Säure & Aroma): Fest & Kühler. Ziel: Bakterien zur Säureproduktion zwingen.\n3. Vollsauer (Trieb): Wieder wärmer. Ziel: Gärleistung für den Hauptteig optimieren.",
                fehler: "Stufen vertauscht oder Temperaturen ignoriert? Das Brot wird entweder flach (keine Hefe) oder schmeckt nicht.",
                proTipp: "Anfrischsauer ist der 'Sex' (Vermehrung), Vollsauer ist das 'Fitnessstudio' (Kraft tanken)."
            }
        ]
    },

    // ==========================================
    // KAPITEL 3: TEIGFÜHRUNG & WASSERMANAGEMENT
    // ==========================================
    {
        kategorie: "Teig-Physik & Vorstufen",
        icon: "💧",
        eintraege: [
            {
                titel: "Quellstück, Brühstück, Kochstück",
                inhalt: "Tricks, um Wasser im Brot zu binden (Frischhaltung).\n\n1. Quellstück (Kalt): Für Saaten/Schrot. Verhindert, dass Körner dem Teig Wasser entziehen.\n2. Brühstück (Heiß): Wasser aufgießen. Teilverkleisterung der Stärke. Krume wird weicher.\n3. Kochstück (Kochen/Pudding): Mehl wird aufgekocht. Vollständige Verkleisterung. Die Stärke bindet das 3- bis 5-fache ihres Gewichts an Wasser.",
                fehler: "Trockene Körner in den Teig? Sie saugen das Wasser aus dem Teig -> Brot wird trocken und bröselig.",
                proTipp: "Kochstück ist 'Botox fürs Brot' – hält es tagelang saftig und frisch."
            },
            {
                titel: "Masse vs. Teig",
                inhalt: "AZUBI-WISSEN:\nTeig wird geknetet, Masse wird gerührt.\n\nWISSENSCHAFT:\n- TEIG (Brot, Hefegebäck): Ziel ist Kleberbildung (Zähigkeit/Elastizität) durch mechanische Energie.\n- MASSE (Biskuit, Rührkuchen, Sandmasse): Ziel ist KEIN Kleber (sonst wird es zäh), sondern das Einrühren von Luftblasen für Lockerung.",
                fehler: "Mürbeteig zu lange geknetet? Er wird 'brandig' (Fett trennt sich) und zäh, weil sich ein Klebergerüst bildet, das wir bei Keksen nicht wollen.",
                proTipp: "-"
            },
            {
                titel: "Vorteig (Poolish/Biga) vs. Sauerteig",
                inhalt: "Sauerteig ist Bakterienkultur (sauer). Vorteig ist meist reine Hefe-Mehl-Wasser-Mischung.\nWarum Vorteig? Die Hefe vermehrt sich langsam, bildet Alkohol und Enzyme schließen das Mehl auf. \nEffekt: Das Klebergerüst wird dehnbarer (Fenstertest!), das Aroma wird komplexer, die Frischhaltung besser.",
                fehler: "-",
                proTipp: "Baguette ohne Vorteig schmeckt nach Pappe. Mit Vorteig (lange Führung) schmeckt es nach Frankreich."
            }
        ]
    },

    // ==========================================
    // KAPITEL 4: BACKPROZESS & TECHNOLOGIE
    // ==========================================
    {
        kategorie: "Ofen & Backprozess",
        icon: "🔥",
        eintraege: [
            {
                titel: "Schwaden (Dampf) - Die Physik dahinter",
                inhalt: "AZUBI-WISSEN:\nDampf macht, dass das Brot groß wird und glänzt.\n\nWISSENSCHAFT:\nWasserdampf kondensiert auf der kühlen Teighaut (Kondensationswärme!). Die Haut bleibt elastisch. Das CO2 im Inneren dehnt sich aus -> Ofentrieb. Ohne Dampf verhorn die Haut sofort (wird fest), das Brot kann nicht wachsen und reißt wild auf. Glanz entsteht durch verkleisterte Dextrine (Zuckerstoffe) auf der feuchten Haut.",
                fehler: "Zu wenig Schwaden? Brot bleibt klein (sitzen geblieben), matt, grau, trockene Risse.",
                proTipp: "Merksatz: 'Viel Dampf macht großen Mampf (Volumen).'"
            },
            {
                titel: "Maillard-Reaktion vs. Karamellisierung",
                inhalt: "Das ist NICHT das Gleiche!\n\n1. Karamellisierung: Zucker + Hitze (ab 160°C). Passiert eher bei süßen Teigen.\n2. Maillard-Reaktion: Zucker + Aminosäuren (Eiweißbausteine) + Hitze (ab 140°C). Das erzeugt Melanoidine (braune Farbstoffe) und tausende Aromastoffe. Das ist der typische 'Brotkrustengeschmack'.",
                fehler: "Zu helle Kruste? Maillard-Reaktion nicht abgeschlossen -> fade, kein Aroma. Zu dunkel? Bitterstoffe und Acrylamid (krebserregend).",
                proTipp: "Inaktives Backmalz liefert Zucker und Aminosäuren -> Turbo für die Maillard-Reaktion."
            },
            {
                titel: "Retrogradation (Altbackenwerden)",
                inhalt: "Brot wird nicht hart, weil es austrocknet (das auch, aber wenig), sondern weil die Stärke 'umkristallisiert'.\nBeim Backen wird die Stärke weich (amorph). Beim Abkühlen will sie wieder in ihre harte Kristallform zurück. Dabei gibt sie das gebundene Wasser wieder ab -> Krume wird fest und trocken.",
                fehler: "Brot im Kühlschrank? TÖDLICH! Bei +5°C läuft die Retrogradation am schnellsten ab. Brot altert im Kühlschrank 3x schneller als bei Raumtemperatur.",
                proTipp: "Toasten macht Retrogradation kurz rückgängig (Hitze macht Kristalle wieder weich)."
            },
            {
                titel: "Blätterteig - Aufgehen ohne Hefe?",
                inhalt: "Physikalischer Trieb! Wir falten Fett und Teig in Schichten (Tourieren). Im Ofen schmilzt das Fett, das Wasser im Teig verdampft. Der Dampf will hoch, prallt aber gegen die Fettschicht (Fett ist dicht). Er drückt die Schicht hoch wie ein hydraulischer Wagenheber.",
                fehler: "Ofen zu kalt? Das Fett schmilzt und läuft einfach raus, bevor Dampf entsteht. Ergebnis: Fettpfütze.",
                proTipp: "Eselsbrücke: 'Blätterteig braucht Feuer unterm Hintern (hohe Hitze), sonst läuft er aus.'"
            }
        ]
    },

    // ==========================================
    // KAPITEL 5: MATHE & ORGANISATION
    // ==========================================
    {
        kategorie: "Mathe & Organisation",
        icon: "🧮",
        eintraege: [
            {
                titel: "TA (Teigausbeute) - Die wichtigste Zahl",
                inhalt: "AZUBI-WISSEN:\nMehl + Wasser = TA. Je höher, desto weicher.\n\nFORMEL:\n(Gesamtteigmenge × 100) ÷ Mehlmenge = TA.\n\nBEISPIELE:\n- TA 150 (Brezel): Sehr fest.\n- TA 160 (Weizenbrot): Standard.\n- TA 180 (Ciabatta/Roggen): Sehr weich.\nWarum wichtig? TA bestimmt die Teigkonsistenz, die Maschinengängigkeit und die Frischhaltung (mehr Wasser = länger frisch).",
                fehler: "-",
                proTipp: "Eselsbrücke: 'Hohe TA macht den Bäcker froh (mehr Teig = mehr Geld), aber das Formen macht ihn k.o. (klebt).'"
            },
            {
                titel: "Warum ist Mehl 100%?",
                inhalt: "Bäcker-Prozentrechnung ist anders. Wir rechnen alles AUF das Mehl. \nMehl ist immer 100%. \nWenn du 2% Salz hast, sind das bei 1kg Mehl 20g. Bei 100kg Mehl sind es 2kg. \nVorteil: Du kannst Rezepte blitzschnell hoch- und runterrechnen, ohne das Verhältnis zu zerstören.",
                fehler: "Zutatenanteile auf die Gesamtmasse gerechnet? Das Rezept wird falsch!",
                proTipp: "Das Mehl ist der Fels in der Brandung. Alles andere tanzt um das Mehl herum."
            },
            {
                titel: "Backverlust",
                inhalt: "Wasser verdampft beim Backen. Das Brot wird leichter.\nFormel: (Teigeinlage - Brotgewicht) × 100 ÷ Teigeinlage.\nNormal sind 10-20% Verlust.",
                fehler: "Du willst 750g Brote verkaufen? Dann musst du ca. 900g Teig einwiegen! Sonst ist es Betrug am Kunden (Untergewicht).",
                proTipp: "Gebäck mit viel Oberfläche (Brötchen) hat mehr Verlust als ein kompakter Laib."
            },
            {
                titel: "FiFo & HACCP",
                inhalt: "FiFo: First In, First Out. Nimm das älteste Zeug zuerst.\nHACCP: Hazard Analysis Critical Control Points. Gefahrenanalyse.\nKritische Punkte (CCPs) sind z.B.:\n- Erhitzung (Kernntemperatur >72°C?)\n- Kühlung (Sahne <7°C?)\n- Fremdkörper (Siebkontrolle Mehl, Glassplitter).",
                fehler: "-",
                proTipp: "Eselsbrücke: 'Wer zuerst kommt (ins Lager), mahlt zuerst (wird verbraucht).'"
            }
        ]
    },


    // ==========================================
    // KAPITEL 5: OFENTECHNIK & BACKATMOSPHÄRE
    // ==========================================
    {
        kategorie: "Ofentechnik & Physik",
        icon: "🔥",
        eintraege: [
            {
                titel: "Schwaden – Warum das Brot geduscht wird",
                inhalt: "AZUBI-WISSEN:\nZu Beginn des Backens wird Dampf (Schwaden) in den Ofen gegeben. Das klingt komisch – Brot backen mit Wasser? Aber genau das macht die knusprige Kruste!\n\nWISSENSCHAFT:\nOhne Schwaden trocknet die Oberfläche sofort aus und bildet eine harte Haut. Diese Haut blockiert den Ofentrieb – das Brot kann nicht mehr aufgehen und reißt unkontrolliert auf. Der Schwaden hält die Oberfläche feucht und elastisch, damit das Brot in Ruhe sein volles Volumen entfalten kann.\n\nErst wenn das Brot seine Form gefunden hat, lässt man den Schwaden ab. Jetzt trocknet die Oberfläche ab und die Maillard-Reaktion (Bräunung) kann richtig starten.\n\nZWEITER EFFEKT: Wasserdampf überträgt Wärme viel effizienter als trockene Heißluft (Dampf hat eine deutlich höhere Wärmekapazität). Das Brot wird schneller und gleichmäßiger durcherhitzt.",
                fehler: "Schwaden vergessen? Das Brot bekommt eine blasse, dicke Kruste und reißt an falschen Stellen auf – nicht am kontrollierten Einschnitt, sondern wild an der Seite.",
                proTipp: "Wann Schwaden ablassen? Sobald das Brot seine Form gefunden hat und erste Farbe nimmt – meist nach 10–15 Minuten. Dann: Klappe auf, Schwaden raus, Kruste wird knusprig."
            },
            {
                titel: "Maillard-Reaktion – Die Wissenschaft hinter 'lecker aussehen'",
                inhalt: "AZUBI-WISSEN:\nWarum wird Brot braun? Das ist nicht einfach 'verbrennen'. Das ist Chemie – und zwar die leckerste der Welt.\n\nWISSENSCHAFT:\nDie Maillard-Reaktion ist eine chemische Reaktion zwischen Aminosäuren (aus Proteinen) und reduzierenden Zuckern, die ab ca. 140°C startet. Das Besondere: Sie erzeugt gleichzeitig Hunderte verschiedene Aromastoffe – das ist der Grund, warum frisch gebackenes Brot so intensiv riecht.\n\nWICHTIG – DAS IST KEINE KARAMELLISIERUNG!\nKaramellisierung passiert mit Zucker allein (ab 160°C). Maillard braucht BEIDE – Zucker UND Protein. Deshalb bräunt ein zuckerfreies Teigstück (z.B. eine Brezel vor der Laugung) anders als ein gezuckertes Milchbrötchen.\n\nDie Maillard-Reaktion macht nicht nur die Farbe – sie ist zu einem großen Teil dafür verantwortlich, dass Brot nach Brot schmeckt. Ohne sie: Fahles, geruchloses Gebäck.",
                fehler: "Zu niedrige Temperatur? Maillard startet nicht. Das Brot wird grau und papierartig statt goldbraun und aromatisch. Zu heiß? Verbrennt, schmeckt bitter (Akrolein und andere unschöne Stoffe entstehen).",
                proTipp: "Merksatz: Maillard = Protein + Zucker + Hitze ab 140°C = Farbe + Aroma. Kein Bräunen = kein Geschmack. Die Kruste IST das Aroma."
            },
            {
                titel: "Ofentrieb – Das große Aufblähen im Ofen",
                inhalt: "AZUBI-WISSEN:\nWenn du ein Brot in den Ofen schiebst, geht es nochmal ordentlich auf – oft um 20-50% des Volumens. Das ist der 'Ofentrieb'. Aber warum passiert das?\n\nWISSENSCHAFT:\nDrei Effekte starten gleichzeitig:\n\n1. BIOLOGISCH: Die Hefe wird durch die Ofenwärme (bis ca. 40°C) nochmal extrem aktiv und produziert einen letzten Schwall CO2.\n\n2. PHYSIKALISCH: Das bereits vorhandene CO2 und der Alkohol im Teig dehnen sich durch die Hitze aus (alle Gase dehnen sich bei Wärme aus – Physik-Grundwissen).\n\n3. VERDAMPFUNG: Das Wasser im Teig verdampft teilweise und schafft zusätzlichen Druck von innen.\n\nDiese drei Kräfte zusammen können das Brot auf bis zu 150% seines ursprünglichen Volumens bringen.\n\nAb ca. 60–70°C stirbt die Hefe. Ab 70°C beginnt die Stärke zu verkleistern (wird fest = die Krume entsteht). Der Ofentrieb endet, das Brot 'friert' seine Form ein.",
                fehler: "Teig hatte Übergare? Die Hefestruktur ist erschöpft, alle Gärreserven aufgebraucht. Kein Material mehr für den Ofentrieb. Das Brot fällt in sich zusammen oder bleibt flach.",
                proTipp: "Deshalb schneidet man Brot vor dem Backen ein: Der Einschnitt gibt dem Ofentrieb einen definierten, kontrollierten 'Ausgang'. Ohne Schnitt reißt das Brot unkontrolliert auf – meistens an der Seite, nicht oben."
            }
        ]
    },

    // ==========================================
    // KAPITEL 6: HYGIENE & LEBENSMITTELRECHT
    // ==========================================
    {
        kategorie: "Hygiene & Recht",
        icon: "⚖️",
        eintraege: [
            {
                titel: "HACCP – Das System, das deinen Job schützt",
                inhalt: "AZUBI-WISSEN:\nHACCP klingt nach Bürokratie-Quatsch, aber es ist eigentlich ganz logisch: Es ist ein System, das verhindert, dass Kunden krank werden – und das dich gleichzeitig vor rechtlichen Problemen schützt.\n\nWAS BEDEUTET DAS?\nHACCP steht für 'Hazard Analysis and Critical Control Points' (Gefahrenanalyse und kritische Kontrollpunkte). Auf Deutsch: Man schaut sich jeden Schritt der Produktion an und fragt: 'Wo könnte hier etwas gefährlich werden?' Diese Punkte heißen 'Kritische Kontrollpunkte' (CCPs).\n\nEIN KONKRETES BEISPIEL AUS DER BÄCKEREI:\nBeim Auftauen von Belagsware (z.B. für Belegte Brötchen) ist die Kühltemperatur ein CCP. Wird das Produkt zu lange zwischen 8–60°C gelagert (die sogenannte 'Gefahrenzone'), vermehren sich Bakterien exponentiell. Die Lösung: Temperatur kontrollieren, Uhrzeit notieren, weiterverarbeiten oder entsorgen.\n\nWARUM DOKUMENTIEREN?\nOhne Dokumentation kein Beweis. Im Streitfall – wenn ein Kunde krank wird – bist du angreifbar, wenn du nichts aufgeschrieben hast.",
                fehler: "Keine Aufzeichnungen = keine Absicherung. Selbst wenn du alles richtig gemacht hast, kannst du es nicht beweisen.",
                proTipp: "HACCP ist keine Pflicht, die dich nervt – es ist deine Versicherung. Wer sauber dokumentiert, kann sich im Zweifelsfall immer raushalten. 2 Minuten schreiben spart dir 2 Wochen Ärger."
            },
            {
                titel: "Die 14 Pflicht-Allergene – Auswendiglernen lohnt sich",
                inhalt: "AZUBI-WISSEN:\nSeit 2014 gilt in der EU: Alle Zutaten aus 14 Allergenkategorien müssen beim Verkauf ausgewiesen werden. Als Bäcker bist du dafür verantwortlich. Falschauskunft kann für jemanden lebensgefährlich sein.\n\nDIE 14 HAUPTALLERGENE (Reihenfolge nach EU-Verordnung):\n1. Glutenhaltiges Getreide (Weizen, Roggen, Gerste, Hafer, Dinkel...)\n2. Krebstiere\n3. Eier\n4. Fisch\n5. Erdnüsse\n6. Soja\n7. Milch/Laktose\n8. Schalenfrüchte/Nüsse (Mandeln, Haselnüsse, Walnüsse, Cashews, Pistazien...)\n9. Sellerie\n10. Senf\n11. Sesam\n12. Schwefeldioxid / Sulfite (z.B. in Trockenfrüchten)\n13. Lupinen (in manchen Mehlen)\n14. Weichtiere (Muscheln, Schnecken – für uns meist irrelevant)\n\nFÜR BÄCKER BESONDERS RELEVANT:\nNüsse (Mandelstücke auf Croissants), Sesam (Körnerbrötchen), Milch (Butter, Milchbrötchen), Eier (Glasur, Brioche).",
                fehler: "Kreuzallergie vergessen: Wer auf Birkenblüten allergisch ist, reagiert häufig auch auf Haselnüsse. Wer eine Latexallergie hat, kann auf Kiwi oder Bananen (in Tortenbelägen) reagieren.",
                proTipp: "Im Zweifel: IMMER nachschauen, NIE raten. 'Ich glaube, da ist kein Sesam drin' kann für einen Kunden mit schwerer Allergie tödlich sein. Nicht dramatisch – nur ehrlich."
            },
            {
                titel: "MHD vs. Verbrauchsdatum – Ein Unterschied mit Konsequenzen",
                inhalt: "AZUBI-WISSEN:\nDiesen Unterschied fragt die Berufsschule garantiert, und Kunden fragen ihn täglich. Er ist einfach, aber wichtig.\n\nMINDESHALTBARKEITSDATUM (MHD) — 'mindestens haltbar bis...'\nDas Produkt ist GARANTIERT bis zu diesem Datum einwandfrei. Danach KANN es noch gut sein – das MHD ist kein Verfallsdatum! Der Hersteller haftet nur bis zu diesem Datum für volle Qualität. Beispiele: abgepacktes Mehl, Trockenhefe, Butter, Marmelade, Knäckebrot.\n\nVERBRAUCHSDATUM — 'zu verbrauchen bis...'\nDieses Datum ist ABSOLUT. Das Produkt darf nach diesem Datum weder verkauft noch gegessen werden – es kann mikrobiologisch gefährlich sein, auch wenn es normal aussieht. Beispiele: frisches Hackfleisch, manche Frischkäsesorten, bestimmte vorgefertigte Sandwichprodukte.\n\nFRISCHE BACKWAREN:\nBrötchen, Brote und Croissants haben meist überhaupt kein aufgedrucktes Datum – sie gelten als 'tagesaktuell' und sind für den sofortigen Verzehr bestimmt.",
                fehler: "MHD mit Verbrauchsdatum verwechseln bedeutet: entweder noch gutes Produkt wegwerfen (Kostenverlust) oder abgelaufene Ware an Kunden geben (Gesundheitsrisiko + Haftung).",
                proTipp: "Merksatz: MHD = 'Ich bin vielleicht noch gut, probier's aus.' Verbrauchsdatum = 'Nach mir ist Schluss, keine Diskussion.'"
            }
        ]
    },

    // ==========================================
    // KAPITEL 7: KALKULATION & BETRIEB
    // ==========================================
    {
        kategorie: "Kalkulation & Betrieb",
        icon: "💰",
        eintraege: [
            {
                titel: "Teigausbeute (TA) – Die wichtigste Zahl im Brot",
                inhalt: "AZUBI-WISSEN:\nDie TA (Teigausbeute) sagt dir, wie viel Wasser im Teig ist. Klingt simpel, ist aber die Basis für alles – Konsistenz, Porung, Haltbarkeit.\n\nWIE BERECHNET MAN SIE?\nTA = (Gesamtgewicht des Teigs ÷ Mehlgewicht) × 100\n\nKONKRETES BEISPIEL:\n1.000g Mehl + 600g Wasser + 20g Salz + 10g Hefe = 1.630g Teig\nTA = (1.630 ÷ 1.000) × 100 = 163\n\n(Nur Mehl gilt als Bezugsgröße = 100%. Alles andere ist relativ zum Mehl.)\n\nWAS BEDEUTEN DIE WERTE?\n- TA 155–160: Normaler Weizenbrot-Teig. Gut formbar, reißt sauber.\n- TA 165–175: Ciabatta, Toast. Weich, klebt, schwer formbar – aber großporig, saftig, lange frisch.\n- TA 180–200: Roggenteig. So weich, dass man ihn schütten oder abstechen muss. Nicht formbar.\n- TA 100 wäre übrigens: gleich viel Wasser wie Mehl – flüssig wie Pfannkuchenteig.",
                fehler: "TA nicht im Kopf haben und dann wundern, warum der Teig klebt oder trocken wird. Oder bei einer anderen Mehltype dieselbe Wassermenge nehmen – höhere Typen brauchen mehr Wasser (Pentosane binden viel).",
                proTipp: "Hohe TA = mehr Aroma (längere Fermentation nötig), bessere Saftigkeit, längere Frischhaltung. ABER: schwieriger zu formen. Das ist der klassische Trade-off des Bäckers."
            },
            {
                titel: "Backzeugkalkulation – Was ein Brötchen wirklich kostet",
                inhalt: "AZUBI-WISSEN:\nViele Betriebe verkaufen unter ihren echten Kosten, weil sie nicht richtig kalkulieren. Das ist wie Zocken ohne zu wissen, was man einsetzt: Man verliert immer.\n\nDIE DREI KOSTENBLÖCKE JEDES PRODUKTS:\n\n1. WARENKOSTEN (Rohstoffe)\nMehl, Hefe, Salz, Gewürze, Fett, Verpackung. Alles, was direkt in das Produkt eingeht.\nKonkret: Für 10 Brötchen (ca. 500g Mehl, Hefe, Salz, Fett, Tüte) ca. 25–35 Cent.\n\n2. LOHNKOSTEN\nAktueller Tariflohn + Arbeitgeberanteil Sozialabgaben (~20%) ÷ produzierte Stückzahl pro Stunde.\nKonkret: Eine Fachkraft kostet den Betrieb ca. 22–26€/Stunde inkl. allem. Sie formt 500–700 Brötchen/Stunde = ca. 3–5 Cent Lohnkosten pro Brötchen.\n\n3. GEMEINKOSTEN\nStrom, Gas (der Ofen!), Miete, Versicherungen, Maschinenamortisation, Buchhaltung. Diese Kosten laufen immer – egal ob das Brötchen verkauft wird oder nicht. Sie werden auf jede Einheit umgelegt.\n\nDARAUS ERGIBT SICH DER SELBSTKOSTENPREIS.\nDarauf kommt der Gewinnaufschlag (wenn der Markt es zulässt).",
                fehler: "Nur die Rohstoffe kalkulieren und vergessen, dass der Ofen Strom frisst, die Miete läuft und die Arbeitskraft bezahlt werden muss: klassischer – und ruinöser – Anfängerfehler.",
                proTipp: "Faustregel: Warenkosten sollten ca. 25–30% des Verkaufspreises ausmachen. Wenn ein Brötchen 70 Cent kostet, dürfen die Rohstoffe ca. 18–21 Cent kosten. Liegt dein Einkauf höher, stimmst irgendetwas nicht."
            },
            {
                titel: "Der Unterschied zwischen Umsatz, Ertrag und Gewinn",
                inhalt: "AZUBI-WISSEN:\nDiese drei Begriffe werden ständig verwechselt. Wer sie nicht auseinanderhält, versteht Betriebswirtschaft nicht – und landet schnell in der Insolvenz.\n\nUMSATZ:\nAlles Geld, das reinkommt. Brutto. Ohne Abzüge.\nBeispiel: Die Bäckerei macht 10.000€ Tageseinnahmen. Das ist der Umsatz.\n\nERTRAG (= Rohertrag / Deckungsbeitrag):\nUmsatz minus Warenkosten.\nBeispiel: Von den 10.000€ Umsatz wurden 2.800€ für Rohstoffe ausgegeben. Ertrag = 7.200€.\nDieser Betrag muss alle anderen Kosten decken (Löhne, Miete, Energie...).\n\nGEWINN:\nWas übrig bleibt, nachdem ALLE Kosten bezahlt sind.\nBeispiel: Löhne 4.000€, Miete 800€, Energie 500€, Sonstiges 600€ = Gesamtkosten 5.900€.\nGewinn = 7.200€ - 5.900€ = 1.300€.\n\nWICHTIG: Ein Betrieb kann hohen Umsatz haben und trotzdem pleite gehen, wenn die Kosten höher sind als der Ertrag.",
                fehler: "Umsatz mit Gewinn verwechseln: 'Wir machen 10.000€ am Tag!' klingt gut – aber wenn die Kosten 9.800€ sind, bleibt fast nichts übrig.",
                proTipp: "Als Azubi musst du diese Begriffe für die Prüfung sicher können. Eselsbrücke: Umsatz ist der große Kuchen. Ertrag ist der Kuchen ohne die teuren Zutaten. Gewinn ist das, was nach der Party übrig bleibt."
            }
        ]
    }

];