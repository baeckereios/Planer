/**
 * hamster_logik.js — BäckereiOS
 * Berechnet den angepassten Verbrauch für Hamster-Tage.
 * Liest die Multiplikatoren aus hamster_config.json.
 *
 * Einbinden: <script src="hamster_logik.js"></script>
 * Verwenden:
 *   await window.BOS_HAMSTER.init();
 *   const need = window.BOS_HAMSTER.berechne('hamster_2', p.needs, bosIdx);
 *
 * Modi:
 *   mittelwert_samstag  →  ceil((needs[Sa] + needs[bosIdx]) / 2)
 *   samstag             →  needs[Sa]
 *   faktor              →  needs[bosIdx] * faktor_normal
 *                          (Samstag: needs[Sa] * faktor_samstag)
 */

(function () {
'use strict';

// BOS-Index Samstag = 5
const SA = 5;

const HAMSTER = {
  _config: null,
  _bereit: false,

  async init(basePath) {
    const base = basePath || this._autoBasePath();
    try {
      const r = await fetch(base + '../hamster_config.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('hamster_config.json nicht erreichbar');
      const data = await r.json();
      this._config = data.stufen || {};
      this._bereit = true;
      return true;
    } catch(e) {
      // Fallback: hardcodierte Standardwerte (identisch mit Schnellrechner)
      this._config = {
        hamster_1: { modus: 'mittelwert_samstag' },
        hamster_2: { modus: 'samstag' },
        hamster_3: { modus: 'faktor', faktor_normal: 2.0, faktor_samstag: 1.5 }
      };
      this._bereit = true;
      console.warn('[BOS_HAMSTER] Config nicht geladen, Standardwerte aktiv:', e.message);
      return false;
    }
  },

  /**
   * Berechnet den Verbrauch für einen Hamster-Tag.
   * @param {string} stufe      - 'hamster_1', 'hamster_2' oder 'hamster_3'
   * @param {number[]} needs    - p.needs Array (BOS Mo=0..So=6)
   * @param {number} bosIdx     - BOS-Wochentag-Index des betroffenen Tages
   * @returns {number}          - angepasster Verbrauch in Blechen
   */
  berechne(stufe, needs, bosIdx) {
    if (!this._bereit) {
      console.warn('[BOS_HAMSTER] Nicht initialisiert — needs[bosIdx] wird zurückgegeben');
      return needs[bosIdx] || 0;
    }

    const cfg = this._config[stufe];
    if (!cfg) return needs[bosIdx] || 0;

    const normal  = needs[bosIdx] || 0;
    const samstag = needs[SA] || 0;
    const istSa   = bosIdx === SA;

    switch (cfg.modus) {
      case 'mittelwert_samstag':
        return Math.ceil((samstag + normal) / 2);

      case 'samstag':
        return samstag;

      case 'faktor':
        if (istSa) {
          return Math.ceil(samstag * (cfg.faktor_samstag ?? 1.5));
        }
        return Math.ceil(normal * (cfg.faktor_normal ?? 2.0));

      default:
        return normal;
    }
  },

  // Gibt Bezeichnung + Emoji für eine Stufe zurück (für UI)
  label(stufe) {
    const cfg = this._config?.[stufe];
    if (!cfg) return stufe;
    return (cfg.emoji || '') + ' ' + (cfg.bezeichnung || stufe);
  },

  get bereit() { return this._bereit; },

  _autoBasePath() {
    const scripts = document.querySelectorAll('script[src*="hamster_logik.js"]');
    if (scripts.length > 0) {
      const src = scripts[0].getAttribute('src');
      return src.replace('hamster_logik.js', '');
    }
    return '';
  }
};

window.BOS_HAMSTER = HAMSTER;

})();
