/**
 * hamster_gehirn.js — BäckereiOS Hamster-Modul
 * Lädt hamster_config.json und stellt BOS_HAMSTER bereit.
 * Einzige Stelle für Hamster-Icons und Hamster-Berechnung.
 */

window.BOS_HAMSTER = (function () {

    let _config = null;

    // Fallback-Config falls JSON nicht geladen werden kann
    const FALLBACK = {
        stufen: {
            hamster_1: { bezeichnung: 'Leicht erhöht',  emoji: '🐹',       modus: 'mittelwert_samstag' },
            hamster_2: { bezeichnung: 'Samstag-Niveau', emoji: '🐹🐹',     modus: 'samstag'            },
            hamster_3: { bezeichnung: 'Maximal',        emoji: '🐹🐹🐹',   modus: 'faktor_samstag', faktor: 1.5 }
        }
    };

    /**
     * Lädt hamster_config.json. Muss vor berechne()/icon() aufgerufen werden.
     * Schlägt die Ladung fehl, greift der Fallback.
     * @returns {Promise<void>}
     */
    function init() {
        return fetch('hamster_config.json', { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (cfg) { _config = cfg; })
            .catch(function () { _config = FALLBACK; });
    }

    /**
     * Gibt das Emoji für Hamster-Level 1–3 zurück.
     * @param {number} level 1|2|3
     * @returns {string}
     */
    function icon(level) {
        var s = _config && _config.stufen && _config.stufen['hamster_' + level];
        if (s && s.emoji) return s.emoji;
        return FALLBACK.stufen['hamster_' + level]
            ? FALLBACK.stufen['hamster_' + level].emoji
            : '🐹';
    }

    /**
     * Berechnet den Hamster-Bedarf für einen Tag.
     * @param {number} level     1|2|3
     * @param {number} need      normaler Tagesbedarf (BOS-Index des Tages)
     * @param {number} satNeed   Samstags-Bedarf des Produkts (needs[5])
     * @param {number} bos       BOS-Wochentag (0=Mo … 6=So)
     * @returns {number}
     */
    function berechne(level, need, satNeed, bos) {
        var cfg = _config || FALLBACK;
        var s   = cfg.stufen && cfg.stufen['hamster_' + level];

        if (!s) {
            // Sollte durch Fallback nie passieren, aber sicher ist sicher
            return need;
        }

        switch (s.modus) {
            case 'mittelwert_samstag':
                return Math.ceil((satNeed + need) / 2);

            case 'samstag':
                return satNeed;

            case 'faktor':
                // Multipliziert den Normaltag — faktor_normal / faktor_samstag
                var f = bos === 5
                    ? (parseFloat(s.faktor_samstag) || 1.5)
                    : (parseFloat(s.faktor_normal)  || 2.0);
                return Math.ceil(need * f);

            case 'faktor_samstag':
                // Multipliziert den Samstags-Bedarf — garantiert > Stufe 2
                return Math.ceil(satNeed * (parseFloat(s.faktor) || 1.5));

            default:
                return need;
        }
    }

    return { init: init, icon: icon, berechne: berechne };

}());
