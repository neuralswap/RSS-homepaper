/**
 * RSS News Card for Home Assistant
 * v1.6.0 - HACS-compatible, auto language detection, visual editor,
 *           configurable colors/fonts, visited article tracking, topic labels
 */

// Bump this on every change you send me / every time you copy a new file to
// the server. Shown at the top of the card so you can verify at a glance
// which build is actually loaded, without opening dev tools.
const CARD_VERSION = 'v1.12.0 · build 2026-08-16-18';

// ─── Defaults per il tuo setup (RSS server) ────────────────────────────────
// Se l'utente non imposta questi valori nella card, vengono usati questi.
const DEFAULT_ENTITY = 'sensor.news_aggregator';
const DEFAULT_FEED_ADMIN_BASE_URL = 'http://192.168.1.249/news-aggregator/';
// Nome del file PHP di amministrazione fonti: resta interno al JS,
// l'utente inserisce solo il percorso/cartella del server, non il file.
const FEED_ADMIN_FILENAME = 'sources_admin.php';

// ─── Localizations ────────────────────────────────────────────────────────────
const RSS_LOCALES = {
  en: {
    no_articles: 'No articles to display.',
    filter_all: 'All sources',
    diag_title: '⚠️ Sensor diagnostics',
    diag_footer: 'Missing sensors must be created as <code>command_line</code> sensors in <b>configuration.yaml</b>.',
    problems: {
      missing_entity:        { icon: '⚠️', text: 'Missing entity ID in configuration.' },
      not_found:             { icon: '❌', text: 'Entity does not exist in Home Assistant.' },
      unavailable:           { icon: '🔌', text: 'Entity is unavailable or in unknown state.' },
      no_articles_attribute: { icon: '🗂️', text: 'Entity has no "articles" attribute.' },
      empty:                 { icon: '📭', text: 'Entity is reachable but contains no articles yet.' },
    },
    cmd_hint: 'A command_line sensor is required:<br><b>entity_id:</b> {entity}<br><b>json_attributes:</b> articles',
    ed: {
      card_title:        'Card title',
      card_title_color:  'Card title color',
      article_title_color: 'Article title color',
      desc_color:        'Description color',
      entity:            'Sensor entity',
      max_articles:      'Max articles',
      card_height:       'Card height (px)',
      show_source:       'Show category',
      show_date:         'Show date',
      show_desc:         'Show description',
      show_original:     'Show original text',
      title_size:        'Article title font size (px)',
      desc_size:         'Description font size (px)',
      color_hint:        'Leave empty for theme default',
      feed_admin_url:    'RSS server path (folder only, no filename)',
      feed_admin_token:  'Feed admin token',
      feed_sources:      'RSS feed sources (server)',
      feed_add:          '+ Add feed',
      feed_color:        'Source color (used for the category badge)',
      feed_loading:      'Loading feeds…',
      feed_load_error:   'Could not load feeds',
      feed_set_url_first:'Set the admin endpoint URL to manage feeds.',
    },
  },
  hu: {
    no_articles: 'Nincs megjeleníthető cikk.',
    filter_all: 'Összes forrás',
    diag_title: '⚠️ Szenzor diagnosztika',
    diag_footer: 'A hibás szenzorokat <code>command_line</code> szenzorokként kell létrehozni a <b>configuration.yaml</b>-ban.',
    problems: {
      missing_entity:        { icon: '⚠️', text: 'Hiányzó entitás azonosító a konfigurációban.' },
      not_found:             { icon: '❌', text: 'Az entitás nem létezik a Home Assistantban.' },
      unavailable:           { icon: '🔌', text: 'Az entitás elérhetetlen vagy ismeretlen állapotban van.' },
      no_articles_attribute: { icon: '🗂️', text: 'Az entitásnak nincs "articles" attribútuma.' },
      empty:                 { icon: '📭', text: 'Az entitás elérhető, de még nincs benne cikk.' },
    },
    cmd_hint: 'command_line szenzor szükséges:<br><b>entity_id:</b> {entity}<br><b>json_attributes:</b> articles',
    ed: {
      card_title:          'Kártya címe',
      card_title_color:    'Kártya cím színe',
      article_title_color: 'Cikkek cím színe',
      desc_color:          'Leírás színe',
      entity:              'Szenzor entitás',
      max_articles:        'Max cikkek száma',
      card_height:         'Kártya magassága (px)',
      show_source:         'Kategória látható',
      show_date:           'Dátum látható',
      show_desc:           'Leírás látható',
      show_original:       'Eredeti szöveg megjelenítése',
      title_size:          'Cím betűmérete (px)',
      desc_size:           'Leírás betűmérete (px)',
      color_hint:          'Üresen hagyva a téma alapszínét használja',
      feed_admin_url:      'RSS szerver útvonal (csak mappa, fájlnév nélkül)',
      feed_admin_token:    'Feed admin token',
      feed_sources:        'RSS források (szerver)',
      feed_add:            '+ Forrás hozzáadása',
      feed_color:          'Forrás színe (a kategória jelöléséhez)',
      feed_loading:        'Források betöltése…',
      feed_load_error:     'Nem sikerült betölteni a forrásokat',
      feed_set_url_first:  'Add meg a végpont URL-jét a források kezeléséhez.',
    },
  },
  de: {
    no_articles: 'Keine Artikel zum Anzeigen.',
    filter_all: 'Alle Quellen',
    diag_title: '⚠️ Sensor-Diagnose',
    diag_footer: 'Fehlende Sensoren müssen als <code>command_line</code>-Sensoren in <b>configuration.yaml</b> erstellt werden.',
    problems: {
      missing_entity:        { icon: '⚠️', text: 'Fehlende Entitäts-ID in der Konfiguration.' },
      not_found:             { icon: '❌', text: 'Entität existiert nicht in Home Assistant.' },
      unavailable:           { icon: '🔌', text: 'Entität ist nicht verfügbar oder in unbekanntem Zustand.' },
      no_articles_attribute: { icon: '🗂️', text: 'Entität hat kein "articles"-Attribut.' },
      empty:                 { icon: '📭', text: 'Entität ist erreichbar, enthält aber noch keine Artikel.' },
    },
    cmd_hint: 'Ein command_line-Sensor ist erforderlich:<br><b>entity_id:</b> {entity}<br><b>json_attributes:</b> articles',
    ed: {
      card_title:          'Kartentitel',
      card_title_color:    'Farbe Kartentitel',
      article_title_color: 'Farbe Artikeltitel',
      desc_color:          'Farbe Beschreibung',
      entity:              'Sensor-Entität',
      max_articles:        'Max. Artikel',
      card_height:         'Kartenhöhe (px)',
      show_source:         'Kategorie anzeigen',
      show_date:           'Datum anzeigen',
      show_desc:           'Beschreibung anzeigen',
      show_original:       'Originaltext anzeigen',
      title_size:          'Schriftgröße Artikeltitel (px)',
      desc_size:           'Schriftgröße Beschreibung (px)',
      color_hint:          'Leer lassen für Themenstandardfarbe',
      feed_admin_url:      'RSS-Server-Pfad (nur Ordner, ohne Dateiname)',
      feed_admin_token:    'Feed-Admin-Token',
      feed_sources:        'RSS-Quellen (Server)',
      feed_add:            '+ Quelle hinzufügen',
      feed_color:          'Quellfarbe (für das Kategorie-Label)',
      feed_loading:        'Quellen werden geladen…',
      feed_load_error:     'Quellen konnten nicht geladen werden',
      feed_set_url_first:  'Admin-Endpunkt-URL festlegen, um Quellen zu verwalten.',
    },
  },
  it: {
    no_articles: 'Nessun articolo da mostrare.',
    filter_all: 'Tutte le fonti',
    diag_title: '⚠️ Diagnostica sensori',
    diag_footer: 'I sensori mancanti devono essere creati come sensori <code>command_line</code> in <b>configuration.yaml</b>.',
    problems: {
      missing_entity:        { icon: '⚠️', text: 'ID entità mancante nella configurazione.' },
      not_found:              { icon: '❌', text: 'L\'entità non esiste in Home Assistant.' },
      unavailable:            { icon: '🔌', text: 'Entità non disponibile o in stato sconosciuto.' },
      no_articles_attribute:  { icon: '🗂️', text: 'L\'entità non ha un attributo "articles".' },
      empty:                  { icon: '📭', text: 'L\'entità è raggiungibile ma non contiene ancora articoli.' },
    },
    cmd_hint: 'È necessario un sensore command_line:<br><b>entity_id:</b> {entity}<br><b>json_attributes:</b> articles',
    ed: {
      card_title:          'Titolo della card',
      card_title_color:    'Colore titolo card',
      article_title_color: 'Colore titolo articoli',
      desc_color:          'Colore descrizione',
      entity:               'Entità sensore',
      max_articles:         'Numero massimo di articoli',
      card_height:          'Altezza card (px)',
      show_source:          'Mostra categoria',
      show_date:            'Mostra data',
      show_desc:            'Mostra descrizione',
      show_original:        'Mostra testo originale',
      title_size:           'Dimensione carattere titolo (px)',
      desc_size:            'Dimensione carattere descrizione (px)',
      color_hint:           'Lascia vuoto per il colore predefinito del tema',
      feed_admin_url:       'Percorso server fonti RSS (cartella, senza nome file)',
      feed_admin_token:     'Token amministrazione fonti',
      feed_sources:         'Fonti RSS (server)',
      feed_add:             '+ Aggiungi fonte RSS',
      feed_color:           "Colore della fonte (usato per l'etichetta categoria)",
      feed_loading:         'Caricamento fonti…',
      feed_load_error:      'Impossibile caricare le fonti',
      feed_set_url_first:   'Imposta l\'URL dell\'endpoint per gestire le fonti.',
    },
  },
};

// HA language code → locale string mapping
const HA_LANG_TO_DATE_LOCALE = {
  hu: 'hu-HU', en: 'en-US', de: 'de-DE', fr: 'fr-FR',
  es: 'es-ES', it: 'it-IT', pl: 'pl-PL', nl: 'nl-NL',
  pt: 'pt-PT', ru: 'ru-RU', cs: 'cs-CZ', sk: 'sk-SK',
  ro: 'ro-RO', sv: 'sv-SE', nb: 'nb-NO', da: 'da-DK',
  fi: 'fi-FI', tr: 'tr-TR', zh: 'zh-CN', ja: 'ja-JP',
  ko: 'ko-KR',
};

function getLocale(lang) {
  return RSS_LOCALES[lang] || RSS_LOCALES['en'];
}

function detectHaLanguage(hass) {
  try {
    return hass?.locale?.language || hass?.language || 'en';
  } catch { return 'en'; }
}

// ─── Card ─────────────────────────────────────────────────────────────────────
class RssNewsCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._articles = [];
    this._lastStateKey = '';
    this._initialized = false;
    this._selectedSource = 'all';
    this._sourceColors = {};
    this._sourceColorsLoadedFor = null;

  }

  static getConfigElement() {
    return document.createElement('rss-news-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'News',
      entity: DEFAULT_ENTITY,
      max_articles: 10,
      card_height: 400,
      show_description: true,
      show_source: true,
      show_date: true,
      show_original: true,
      title_font_size: 15,
      desc_font_size: 14,
      card_title_color: '',
      article_title_color: '',
      desc_color: '',
    };
  }

  setConfig(config) {
    this._config = {
      title:            config.title || '',
      entity:           (config.entity && typeof config.entity === 'string') ? config.entity : DEFAULT_ENTITY,
      max_articles:     config.max_articles || 10,
      card_height:      config.card_height || 400,
      show_description: config.show_description !== false,
      show_source:      config.show_source !== false,
      show_date:        config.show_date !== false,
      show_original:    config.show_original !== false,
      title_font_size:  config.title_font_size || 15,
      desc_font_size:   config.desc_font_size || 14,
      card_title_color: config.card_title_color || '',
      article_title_color: config.article_title_color || '',
      desc_color:       config.desc_color || '',
      feed_admin_url:   config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL,
      feed_admin_token: config.feed_admin_token || '',
    };
    this._initialized = false;
    this._render();
    // Apply dynamic properties immediately after render
    if (this._hass) {
      this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    }
    // Colore per-fonte (badge categoria): caricato dal server admin fonti,
    // solo se url/token sono configurati e sono cambiati rispetto all'ultimo
    // caricamento (evita richieste ripetute a ogni setConfig).
    this._loadSourceColors();
  }

  set hass(hass) {
    this._hass = hass;
    // Skip render if the single source sensor hasn't changed
    const st = hass.states[this._config.entity];
    const stateKey = st ? (this._config.entity + ':' + st.state + ':' + st.last_updated) : this._config.entity;
    if (stateKey === this._lastStateKey && this._initialized) return;
    this._lastStateKey = stateKey;
    const newArticles = this._getArticles();
    const newIssues = this._validateSources();
    this._articles = newArticles;
    this._lastIssuesJson = JSON.stringify(newIssues);
    this._updateContent(newArticles, newIssues);
  }

  _getLang() {
    const haLang = detectHaLanguage(this._hass);
    // Use first part of language code (e.g. 'en' from 'en-US')
    return haLang.split('-')[0].toLowerCase();
  }

  _getDateLocale() {
    const haLang = detectHaLanguage(this._hass);
    const shortLang = haLang.split('-')[0].toLowerCase();
    return HA_LANG_TO_DATE_LOCALE[shortLang] || haLang || 'en-US';
  }

  _t() { return getLocale(this._getLang()); }

  _validateSources() {
    if (!this._hass) return [];
    const entity = this._config.entity;
    if (!entity) return [{ entity: '(empty)', name: '?', problem: 'missing_entity' }];
    const state = this._hass.states[entity];
    if (!state) return [{ entity, name: entity, problem: 'not_found' }];
    if (state.state === 'unavailable' || state.state === 'unknown') return [{ entity, name: entity, problem: 'unavailable' }];
    const articles = state.attributes.articles;
    if (!Array.isArray(articles)) return [{ entity, name: entity, problem: 'no_articles_attribute' }];
    if (articles.length === 0) return [{ entity, name: entity, problem: 'empty' }];
    return [];
  }

  _renderDiagnostics(issues) {
    const t = this._t();
    const rows = issues.map(issue => {
      const label = t.problems[issue.problem] || { icon: '❓', text: issue.problem };
      const cmd = ['not_found','missing_entity','no_articles_attribute'].includes(issue.problem)
        ? `<div style="margin-top:6px;padding:6px 8px;background:var(--secondary-background-color);border-radius:4px;font-family:monospace;font-size:11px;word-break:break-all;">${t.cmd_hint.replace('{entity}', issue.entity)}</div>` : '';
      return `<div style="padding:10px 12px;margin-bottom:8px;border-radius:6px;border-left:3px solid var(--warning-color,#ff9800);background:var(--secondary-background-color);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span>${label.icon}</span>
          <span style="font-weight:600;font-size:13px;color:var(--primary-text-color);">${issue.name}</span>
          <code style="font-size:11px;color:var(--secondary-text-color);">${issue.entity}</code>
        </div>
        <div style="font-size:12px;color:var(--secondary-text-color);">${label.text}</div>${cmd}
      </div>`;
    }).join('');
    return `<div style="padding:0 0 12px 0;">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--warning-color,#ff9800);margin-bottom:10px;">${t.diag_title}</div>
      ${rows}
      <div style="font-size:11px;color:var(--secondary-text-color);">${t.diag_footer}</div>
    </div>`;
  }

  _getArticles() {
    if (!this._hass) return [];
    const state = this._hass.states[this._config.entity];
    if (!state) return [];
    const articles = state.attributes.articles;
    if (!Array.isArray(articles)) return [];
    const all = [...articles].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    return all.slice(0, this._config.max_articles);
  }

  _feedAdminFullUrl() {
    let base = (this._config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL || '').trim();
    if (!base) return '';
    base = base.replace(/sources_admin\.php.*$/i, '');
    if (!base.endsWith('/')) base += '/';
    return base + 'sources_admin.php';
  }

  async _loadSourceColors() {
    const url = this._feedAdminFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!url) return;
    // Evita di rifare il fetch se url+token non sono cambiati dall'ultima volta
    const key = url + '|' + token;
    if (this._sourceColorsLoadedFor === key) return;
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token), {
        method: 'GET',
        headers: { 'X-API-Token': token },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return; // silenzioso: la card mostra comunque il colore di default
      const map = {};
      for (const s of (data.sources || [])) {
        if (s && s.name && s.color) map[String(s.name).trim().toLowerCase()] = s.color;
      }
      this._sourceColors = map;
      this._sourceColorsLoadedFor = key;
      // Ricolora eventuali articoli già renderizzati
      if (this._hass) this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    } catch {
      // Nessuna connessione al server admin fonti: la card resta comunque
      // funzionante, semplicemente senza colori personalizzati per fonte.
    }
  }

  _categoryColor(article) {
    const provider = String(this._providerLabel(article) || '').trim().toLowerCase();
    return (provider && this._sourceColors[provider]) || 'var(--primary-color)';
  }

  _topicLabel(article) {
    // L'articolo (prodotto da rebuild_cache.php) ha un array "topics"
    // (categorie <category> del feed RSS + classificazione per parole
    // chiave, es. ['tecnologia']). Mostriamo la prima come categoria.
    const topics = Array.isArray(article.topics) ? article.topics.filter(t => t && String(t).trim() !== '') : [];
    if (topics.length > 0) {
      const label = String(topics[0]).trim();
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    // Fallback: nome della fonte originale del feed (es. "bbc", "ansa")
    return article.source || '';
  }

  _resolveArticleImage(article) {
    // Se l'articolo scelto come "principale" per un cluster di notizie non
    // ha immagine (capita ad es. con Google News quando la fonte primaria
    // cambia da un aggiornamento all'altro), cerchiamo la prima immagine
    // valida tra le fonti correlate ("related") della stessa notizia.
    if (article.image && String(article.image).trim() !== '') return String(article.image).trim();
    if (Array.isArray(article.related)) {
      for (const rel of article.related) {
        if (rel && rel.image && String(rel.image).trim() !== '') return String(rel.image).trim();
      }
    }
    return '';
  }

  _providerLabel(article) {
    // Nome del provider RSS originale (es. "BBC News", "Google News", "ANSA"),
    // preso dal tag <source> del feed.
    return article.source && String(article.source).trim() !== '' ? String(article.source).trim() : '';
  }

  _splitAggregatorTitle(article) {
    // Aggregatori come Google News mettono il nome della testata originale
    // in coda al titolo (es. "Titolo articolo - Corriere della Sera").
    // Qui separiamo la testata per poterla mostrare con uno stile diverso
    // invece che come parte del titolo.
    const title = String(article.title || '');
    const idx = title.lastIndexOf(' - ');
    if (idx === -1) return { main: title, publication: null };
    const main = title.slice(0, idx).trim();
    const publication = title.slice(idx + 3).trim();
    if (!main || !publication) return { main: title, publication: null };
    return { main, publication };
  }

  _cleanDescription(html) {
    // Alcuni feed (es. Google News) inseriscono già tag HTML nella
    // descrizione (link <a>, <font color="...">, ecc.). Se li lasciamo,
    // quello stile "vince" sul colore impostato dalla card, ed è per questo
    // che a volte la descrizione appare con un colore diverso dal solito.
    // Qui rimuoviamo tutti i tag e teniamo solo il testo, così il colore
    // configurato viene sempre applicato in modo coerente.
    if (!html) return '';
    return String(html)
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _formatDate(pubDate) {
    try {
      const d = new Date(pubDate);
      if (isNaN(d.getTime())) return pubDate;
      return d.toLocaleString(this._getDateLocale(), {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return pubDate; }
  }

  _getVisited() {
    // Use a module-level Set shared across all card instances on the page
    if (!window._rssNewsCardVisited) window._rssNewsCardVisited = new Set();
    return window._rssNewsCardVisited;
  }

  _markVisited(url) {
    this._getVisited().add(url);
  }

  _isVisited(url) {
    return this._getVisited().has(url);
  }

  _buildArticlesHtml(articles) {
    const { show_source, show_date, show_description, show_original, title_font_size, desc_font_size, article_title_color, desc_color } = this._config;
    const t = this._t();
    if (articles.length === 0) return `<div style="padding:20px;color:var(--secondary-text-color);text-align:center;">${t.no_articles}</div>`;
    return articles.map(a => {
      const topic = this._topicLabel(a);
      const provider = this._providerLabel(a);
      // Evita di ripetere due volte la stessa etichetta se non c'è una vera
      // categoria/topic e il fallback di _topicLabel coincide col provider.
      const showBothLabels = topic && provider && topic.toLowerCase() !== String(provider).toLowerCase();
      // Google News aggiunge " - Testata" in coda al titolo: lo separiamo
      // per mostrarlo in corsivo con un colore diverso dal resto del titolo.
      const isAggregator = /google/i.test(String(provider || ''));
      const { main: titleMain, publication } = isAggregator ? this._splitAggregatorTitle(a) : { main: a.title, publication: null };
      const mainTitleColor = this._isVisited(a.link) ? 'var(--disabled-text-color)' : (article_title_color || 'var(--primary-text-color)');
      const publicationColor = desc_color || 'var(--secondary-text-color)';
      const imgSrc = this._resolveArticleImage(a);
      return `
      <div class="rss-article-row" data-rss-url="${a.link}"
        style="display:flex;flex-direction:column;gap:8px;padding:12px 0;border-bottom:1px solid var(--divider-color);cursor:pointer;-webkit-tap-highlight-color:transparent;">
        ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:auto;display:block;border-radius:8px;" onerror="this.style.display='none'"/>` : ''}
        <div style="flex:1;min-width:0;text-align:left;">
          <div class="rss-atitle" style="font-size:${title_font_size}px;font-weight:600;line-height:1.4;color:${mainTitleColor};white-space:normal;word-break:break-word;margin-bottom:4px;">${titleMain}${publication ? ` <span style="font-style:italic;font-weight:400;opacity:0.75;color:${publicationColor};">– ${publication}</span>` : ''}</div>
          ${show_original && a.title_original ? `<div style="font-size:${Math.max(10, title_font_size - 2)}px;font-style:italic;opacity:0.65;color:${desc_color || 'var(--secondary-text-color)'};line-height:1.3;white-space:normal;word-break:break-word;margin-bottom:4px;">${a.title_original}</div>` : ''}
          ${(show_source || show_date) ? `
            <div style="font-size:11px;color:var(--secondary-text-color);margin-bottom:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              ${show_source ? `<span style="font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${this._categoryColor(a)};">${topic}</span>` : ''}
              ${show_source && showBothLabels ? `<span style="opacity:0.4;">·</span><span style="font-weight:600;">${provider}</span>` : ''}
              ${(show_source && show_date) ? `<span style="opacity:0.4;">·</span>` : ''}
              ${show_date ? `<span>${this._formatDate(a.pubDate)}</span>` : ''}
            </div>` : ''}
          ${show_description && a.description ? `<div style="font-size:${desc_font_size}px;color:${desc_color || 'var(--secondary-text-color)'};line-height:1.4;white-space:normal;word-break:break-word;">${this._cleanDescription(a.description)}</div>` : ''}
          ${show_description && show_original && a.description_original ? `<div style="font-size:${Math.max(10, desc_font_size - 1)}px;font-style:italic;opacity:0.65;color:${desc_color || 'var(--secondary-text-color)'};line-height:1.4;white-space:normal;word-break:break-word;margin-top:2px;">${this._cleanDescription(a.description_original)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  _handleLinkClick(url) {
    // Android Companion App – native in-app browser
    if (window.externalApp?.openExternalUrl) {
      window.externalApp.openExternalUrl(url);
      return;
    }
    // Desktop: centered popup window; mobile browsers/iOS: new tab (platform limitation)
    const w = Math.min(window.screen.width, 520);
    const h = Math.min(window.screen.height, 900);
    const left = Math.round((window.screen.width - w) / 2);
    const top  = Math.round((window.screen.height - h) / 2);
    window.open(
      url, 'rss_article',
      `width=${w},height=${h},left=${left},top=${top},` +
      'toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
    );
  }

  _render() {
    const { title, card_height } = this._config;
    this.innerHTML = `
      <ha-card>
        <style>
          .rss-inner{padding:12px 16px;}
          .rss-header{display:flex;flex-direction:column;gap:2px;margin-bottom:8px;}
          .rss-header-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
          .rss-title{font-size:24px;font-weight:400;margin-bottom:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .rss-version{font-size:10px;color:var(--secondary-text-color);opacity:0.55;white-space:nowrap;align-self:flex-end;}
          .rss-source-filter{flex-shrink:0;max-width:60%;padding:4px 8px;font-size:12px;border-radius:6px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);}
          .rss-scroll{overflow-y:scroll;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:var(--divider-color) transparent;}
        </style>
        <div class="rss-inner">
          <div class="rss-header">
            <div class="rss-header-top">
              <div class="rss-title-el"></div>
              <select class="rss-source-filter"></select>
            </div>
            <div class="rss-version">${CARD_VERSION}</div>
          </div>
          <div class="rss-diag"></div>
          <div class="rss-scroll"><div class="rss-articles"></div></div>
        </div>

      </ha-card>`;
    this._initialized = true;

    const filterEl = this.querySelector('.rss-source-filter');
    if (filterEl) {
      filterEl.addEventListener('change', () => {
        this._selectedSource = filterEl.value;
        this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
        // Il cambio fonte ricostruisce la lista articoli, ma il contenitore
        // scrollabile mantiene la vecchia posizione: se prima eravamo in
        // fondo, con la nuova lista (più corta) restiamo "appesi" in fondo.
        // Riportiamo sempre lo scroll in cima alla prima notizia.
        const scrollEl = this.querySelector('.rss-scroll');
        if (scrollEl) scrollEl.scrollTop = 0;
      });
    }
  }

  _populateSourceFilter() {
    const filterEl = this.querySelector('.rss-source-filter');
    if (!filterEl) return;
    const t = this._t();
    // Build the option list from the *actual* RSS provider of each article
    // (e.g. "bbc", "ansa"), not from the HA sensor/source names configured
    // in the card – a single sensor can aggregate many different feeds.
    const names = [];
    for (const a of (this._articles || [])) {
      const name = this._providerLabel(a);
      if (name && !names.includes(name)) names.push(name);
    }
    names.sort((a, b) => a.localeCompare(b));
    const prevValue = filterEl.value || this._selectedSource;
    filterEl.innerHTML = [
      `<option value="all">${t.filter_all}</option>`,
      ...names.map(n => `<option value="${n}">${n}</option>`),
    ].join('');
    // If the previously selected source no longer exists, fall back to "all"
    if (prevValue !== 'all' && !names.includes(prevValue)) {
      this._selectedSource = 'all';
    }
    filterEl.value = this._selectedSource;
  }

  _updateContent(articles, issues) {
    if (!this._initialized) this._render();
    const { title, card_height, card_title_color } = this._config;

    // Update title
    const titleEl = this.querySelector('.rss-title-el');
    if (titleEl) {
      titleEl.className = title ? 'rss-title-el rss-title' : 'rss-title-el';
      titleEl.style.color = card_title_color || 'var(--primary-text-color)';
      titleEl.textContent = title || '';
    }

    // Update scroll height dynamically
    const scrollEl = this.querySelector('.rss-scroll');
    if (scrollEl) scrollEl.style.height = (card_height || 400) + 'px';

    this._populateSourceFilter();
    const filteredArticles = this._selectedSource === 'all'
      ? articles
      : articles.filter(a => this._providerLabel(a) === this._selectedSource);

    const diagEl = this.querySelector('.rss-diag');
    const artEl = this.querySelector('.rss-articles');
    if (diagEl) diagEl.innerHTML = issues.length > 0 ? this._renderDiagnostics(issues) : '';
    if (artEl) {
      artEl.innerHTML = this._buildArticlesHtml(filteredArticles);
      // Attach click listeners – popup on desktop, in-app modal on mobile/companion app
      artEl.querySelectorAll('.rss-article-row').forEach(row => {
        row.addEventListener('click', () => {
          const url = row.dataset.rssUrl;
          if (!url) return;
          this._markVisited(url);
          const titleEl = row.querySelector('.rss-atitle');
          if (titleEl) titleEl.style.color = 'var(--disabled-text-color)';
          this._handleLinkClick(url);
        });
      });

    }
  }

  getCardSize() { return 5; }
}

// ─── Editor ───────────────────────────────────────────────────────────────────
class RssNewsCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._rendered = false;
  }

  setConfig(config) {
    const prevUrl = this._config?.feed_admin_url;
    const prevToken = this._config?.feed_admin_token;
    this._config = { ...config };
    if (!this._rendered) {
      this._renderShell();
    } else {
      this._syncFields();
      // Se l'ordine hass/setConfig di HA ha fatto partire il primo
      // _loadFeedSources() con config ancora vuota (token mancante),
      // qui arriva la config "vera": se url/token sono cambiati
      // rispetto a quella (eventualmente vuota) di prima, ricarichiamo.
      if (config.feed_admin_url !== prevUrl || config.feed_admin_token !== prevToken) {
        this._loadFeedSources();
      }
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._renderShell();
  }

  _getLang() {
    try {
      const haLang = this._hass?.locale?.language || this._hass?.language || 'en';
      return haLang.split('-')[0].toLowerCase();
    } catch { return 'en'; }
  }

  _t() { return getLocale(this._getLang()); }

  _renderShell() {
    this._rendered = true;
    const c = this._config || {};
    const t = this._t();

    this.innerHTML = `
      <style>
        .rss-ed{padding:12px;}
        .rss-ed label{display:block;font-size:12px;color:var(--secondary-text-color);margin:10px 0 4px;}
        .rss-ed input[type=text],.rss-ed input[type=number]{width:100%;padding:4px 8px;box-sizing:border-box;border:1px solid var(--divider-color);border-radius:4px;background:var(--card-background-color);color:var(--primary-text-color);}
        .rss-src-row{display:flex;gap:8px;align-items:center;margin-bottom:6px;}
        .rss-src-row input{width:auto!important;}
        .rss-add{margin-top:6px;padding:4px 12px;cursor:pointer;background:var(--primary-color);color:white;border:none;border-radius:4px;}
        .rss-del{padding:2px 8px;cursor:pointer;border:1px solid var(--divider-color);border-radius:4px;background:transparent;color:var(--primary-text-color);}
        .rss-save{padding:2px 8px;cursor:pointer;border:1px solid var(--primary-color);border-radius:4px;background:transparent;color:var(--primary-color);flex-shrink:0;}
        .rss-feed-msg{font-size:12px;opacity:0.7;padding:4px 0;}
        .rss-feed-msg.error{color:var(--error-color,#f44336);opacity:1;}
        .rss-toggle-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--divider-color);}
        .rss-toggle-row label{margin:0;font-size:13px;color:var(--primary-text-color);}
        .rss-toggle{position:relative;width:36px;height:20px;flex-shrink:0;}
        .rss-toggle input{opacity:0;width:0;height:0;}
        .rss-slider{position:absolute;cursor:pointer;inset:0;background:var(--disabled-color,#ccc);border-radius:20px;transition:.2s;}
        .rss-slider:before{content:'';position:absolute;height:14px;width:14px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.2s;}
        input:checked + .rss-slider{background:var(--primary-color);}
        input:checked + .rss-slider:before{transform:translateX(16px);}
        .rss-ed-version{font-size:11px;opacity:0.55;text-align:right;margin-bottom:8px;font-family:monospace;}
      </style>
      <div class="rss-ed">
        <div class="rss-ed-version">JS: ${CARD_VERSION}</div>
        <label>${t.ed.card_title}</label>
        <input type="text" id="ed-title" value="${c.title || ''}"/>

        <label>${t.ed.entity}</label>
        <input type="text" id="ed-entity" placeholder="${DEFAULT_ENTITY}" value="${c.entity || ''}"/>

        <div style="margin-top:18px;padding-top:12px;border-top:1px solid var(--divider-color);">
          <label>${t.ed.feed_admin_url}</label>
          <input type="text" id="ed-feed-admin-url" placeholder="${DEFAULT_FEED_ADMIN_BASE_URL}" value="${c.feed_admin_url || ''}"/>

          <label>${t.ed.feed_admin_token}</label>
          <input type="text" id="ed-feed-admin-token" placeholder="token" value="${c.feed_admin_token || ''}"/>

          <label style="margin-top:10px;">${t.ed.feed_sources}</label>
          <div id="ed-feed-sources"></div>
          <div class="rss-src-row" style="margin-top:8px;flex-wrap:wrap;">
            <input type="text" id="feed-new-name" placeholder="nome" style="flex:1 1 90px;min-width:0;"/>
            <input type="text" id="feed-new-url" placeholder="https://…/feed" style="flex:2 1 140px;min-width:0;"/>
            <select id="feed-new-type" style="flex-shrink:0;">
              <option value="standard">standard</option>
              <option value="google_news">google_news</option>
            </select>
            <input type="number" id="feed-new-max" placeholder="max" value="15" style="width:56px;flex-shrink:0;"/>
            <input type="color" id="feed-new-color" value="#1a73e8" title="${t.ed.feed_color}" style="width:36px;height:32px;padding:2px;flex-shrink:0;"/>
            <button class="rss-add" id="feed-new-add">${t.ed.feed_add}</button>
          </div>
        </div>

        <label>${t.ed.max_articles}</label>
        <input type="number" id="ed-max" min="1" max="50" value="${c.max_articles || 10}"/>

        <label>${t.ed.card_height}</label>
        <input type="number" id="ed-height" min="100" max="2000" value="${c.card_height || 400}"/>

        <label>${t.ed.title_size}</label>
        <input type="number" id="ed-titlesize" min="10" max="30" value="${c.title_font_size || 15}"/>

        <label>${t.ed.desc_size}</label>
        <input type="number" id="ed-descsize" min="10" max="24" value="${c.desc_font_size || 14}"/>

        <label>${t.ed.card_title_color} <small style="opacity:0.6;">(${t.ed.color_hint})</small></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <label style="position:relative;width:32px;height:28px;flex-shrink:0;cursor:pointer;border-radius:4px;overflow:hidden;border:1px solid var(--divider-color);">
            <div id="prev-card-title-color" style="position:absolute;inset:0;background:${c.card_title_color || 'transparent'};pointer-events:none;${!c.card_title_color ? 'background-image:repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,transparent 0,transparent 50%);background-size:6px 6px;' : ''}"></div>
            <input type="color" id="ed-card-title-color" value="${c.card_title_color || '#ffffff'}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;"/>
          </label>
          <input type="text" id="ed-card-title-color-text" placeholder="e.g. #ff0000 or empty" value="${c.card_title_color || ''}"/>
        </div>

        <label>${t.ed.article_title_color} <small style="opacity:0.6;">(${t.ed.color_hint})</small></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <label style="position:relative;width:32px;height:28px;flex-shrink:0;cursor:pointer;border-radius:4px;overflow:hidden;border:1px solid var(--divider-color);">
            <div id="prev-article-title-color" style="position:absolute;inset:0;background:${c.article_title_color || 'transparent'};pointer-events:none;${!c.article_title_color ? 'background-image:repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,transparent 0,transparent 50%);background-size:6px 6px;' : ''}"></div>
            <input type="color" id="ed-article-title-color" value="${c.article_title_color || '#ffffff'}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;"/>
          </label>
          <input type="text" id="ed-article-title-color-text" placeholder="e.g. #ff0000 or empty" value="${c.article_title_color || ''}"/>
        </div>

        <label>${t.ed.desc_color} <small style="opacity:0.6;">(${t.ed.color_hint})</small></label>
        <div style="display:flex;gap:8px;align-items:center;">
          <label style="position:relative;width:32px;height:28px;flex-shrink:0;cursor:pointer;border-radius:4px;overflow:hidden;border:1px solid var(--divider-color);">
            <div id="prev-desc-color" style="position:absolute;inset:0;background:${c.desc_color || 'transparent'};pointer-events:none;${!c.desc_color ? 'background-image:repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,transparent 0,transparent 50%);background-size:6px 6px;' : ''}"></div>
            <input type="color" id="ed-desc-color" value="${c.desc_color || '#ffffff'}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;"/>
          </label>
          <input type="text" id="ed-desc-color-text" placeholder="e.g. #ff0000 or empty" value="${c.desc_color || ''}"/>
        </div>

        <div style="margin-top:12px;">
          <div class="rss-toggle-row">
            <label for="tog-source">${t.ed.show_source}</label>
            <label class="rss-toggle">
              <input type="checkbox" id="tog-source" ${c.show_source !== false ? 'checked' : ''}/>
              <span class="rss-slider"></span>
            </label>
          </div>
          <div class="rss-toggle-row">
            <label for="tog-date">${t.ed.show_date}</label>
            <label class="rss-toggle">
              <input type="checkbox" id="tog-date" ${c.show_date !== false ? 'checked' : ''}/>
              <span class="rss-slider"></span>
            </label>
          </div>
          <div class="rss-toggle-row">
            <label for="tog-desc">${t.ed.show_desc}</label>
            <label class="rss-toggle">
              <input type="checkbox" id="tog-desc" ${c.show_description !== false ? 'checked' : ''}/>
              <span class="rss-slider"></span>
            </label>
          </div>
          <div class="rss-toggle-row">
            <label for="tog-original">${t.ed.show_original}</label>
            <label class="rss-toggle">
              <input type="checkbox" id="tog-original" ${c.show_original !== false ? 'checked' : ''}/>
              <span class="rss-slider"></span>
            </label>
          </div>
        </div>
      </div>`;

    this._attachListeners();
    // Sync color previews after DOM is ready
    requestAnimationFrame(() => this._syncColorPreviews());
    this._loadFeedSources();
  }

  _syncColorPreviews() {
    // Find the card element via DOM traversal from the editor
    const card = this.closest('ha-card') || document.querySelector('rss-news-card');
    const syncPreview = (previewId, configVal, cssVar) => {
      const preview = this.querySelector(previewId);
      if (!preview) return;
      if (configVal) {
        // Config has a value – use it directly
        preview.style.backgroundImage = 'none';
        preview.style.background = configVal;
      } else {
        // No config value – read computed color from the card element
        if (card) {
          const computed = getComputedStyle(card).getPropertyValue(cssVar).trim();
          if (computed) {
            preview.style.backgroundImage = 'none';
            preview.style.background = computed;
            return;
          }
        }
        // Fallback: show transparent pattern
        preview.style.background = 'transparent';
        preview.style.backgroundImage = 'repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,transparent 0,transparent 50%)';
        preview.style.backgroundSize = '6px 6px';
      }
    };
    const c = this._config || {};
    syncPreview('#prev-card-title-color',    c.card_title_color,    '--primary-text-color');
    syncPreview('#prev-article-title-color', c.article_title_color, '--primary-text-color');
    syncPreview('#prev-desc-color',          c.desc_color,          '--secondary-text-color');
  }

  _attachListeners() {
    const bind = (id, key, transform) => {
      const el = this.querySelector(id);
      if (!el) return;
      el.addEventListener('input', e => this._upd(key, transform ? transform(e.target.value) : e.target.value));
    };
    const bindChk = (id, key) => {
      const el = this.querySelector(id);
      if (!el) return;
      el.addEventListener('change', e => this._upd(key, e.target.checked));
    };

    bind('#ed-title',    'title');
    bind('#ed-max',      'max_articles',    v => parseInt(v) || 10);
    bind('#ed-height',   'card_height',     v => parseInt(v) || 400);
    bind('#ed-titlesize','title_font_size', v => parseInt(v) || 15);
    bind('#ed-descsize', 'desc_font_size',  v => parseInt(v) || 14);
    bind('#ed-card-title-color-text',    'card_title_color');
    bind('#ed-article-title-color-text', 'article_title_color');
    bind('#ed-desc-color-text',          'desc_color');

    // Color picker → text field + preview sync
    const bindColorPicker = (pickerId, textId, previewId, key) => {
      const picker = this.querySelector(pickerId);
      const text   = this.querySelector(textId);
      const preview = this.querySelector(previewId);
      if (!picker) return;
      picker.addEventListener('input', e => {
        const val = e.target.value;
        if (text) text.value = val;
        if (preview) preview.style.background = val;
        this._upd(key, val);
      });
      // Text field → preview sync
      if (text) {
        text.addEventListener('input', e => {
          const val = e.target.value;
          if (preview && (val === '' || /^#[0-9a-fA-F]{3,6}$/.test(val))) {
            preview.style.background = val || '#ffffff';
            if (picker) picker.value = val || '#ffffff';
          }
        });
      }
    };
    bindColorPicker('#ed-card-title-color',    '#ed-card-title-color-text',    '#prev-card-title-color',    'card_title_color');
    bindColorPicker('#ed-article-title-color', '#ed-article-title-color-text', '#prev-article-title-color', 'article_title_color');
    bindColorPicker('#ed-desc-color',          '#ed-desc-color-text',          '#prev-desc-color',          'desc_color');

    bindChk('#tog-source', 'show_source');
    bindChk('#tog-date',   'show_date');
    bindChk('#tog-desc',   'show_description');
    bindChk('#tog-original', 'show_original');

    bind('#ed-entity', 'entity');

    // ─ Fonti RSS lato server (config.php via sources_admin.php) ─
    const feedUrlEl = this.querySelector('#ed-feed-admin-url');
    const feedTokenEl = this.querySelector('#ed-feed-admin-token');
    if (feedUrlEl) {
      feedUrlEl.addEventListener('change', () => {
        this._upd('feed_admin_url', feedUrlEl.value.trim());
        this._loadFeedSources();
      });
    }
    if (feedTokenEl) {
      feedTokenEl.addEventListener('change', () => {
        this._upd('feed_admin_token', feedTokenEl.value.trim());
        this._loadFeedSources();
      });
    }

    const feedAddBtn = this.querySelector('#feed-new-add');
    if (feedAddBtn) {
      feedAddBtn.addEventListener('click', () => this._addFeedSource());
    }
  }

  // ─── Fonti RSS lato server: fetch helper ─────────────────────────────────
  _feedAdminFullUrl() {
    let base = (this._config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL || '').trim();
    if (!base) return '';
    // Se nel campo è rimasto salvato un URL "vecchio" che includeva già il
    // nome del file (da configurazioni precedenti), lo togliamo per evitare
    // di aggiungerlo due volte.
    base = base.replace(new RegExp(FEED_ADMIN_FILENAME.replace('.', '\\.') + '/?$'), '');
    if (!/\/$/.test(base)) base += '/'; // assicura lo slash finale prima del nome file
    return base + FEED_ADMIN_FILENAME;
  }

  async _feedApi(body) {
    const baseUrl = this._feedAdminFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!baseUrl) throw new Error(this._t().ed.feed_set_url_first);
    // Il token viene inviato sia come header che come query string: alcuni
    // server (proxy/Apache con certe config) non inoltrano header HTTP
    // personalizzati al PHP, quindi la query string è il fallback affidabile.
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
    const opts = body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Token': token }, body: JSON.stringify(body) }
      : { method: 'GET', headers: { 'X-API-Token': token } };
    const res = await fetch(url, opts);
    let data;
    try { data = await res.json(); } catch { throw new Error('Risposta non JSON dal server (' + res.status + ')'); }
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  async _loadFeedSources() {
    const container = this.querySelector('#ed-feed-sources');
    if (!container) return;
    const t = this._t();
    if (!this._feedAdminFullUrl()) {
      container.innerHTML = `<div class="rss-feed-msg">${t.ed.feed_set_url_first}</div>`;
      return;
    }
    container.innerHTML = `<div class="rss-feed-msg">${t.ed.feed_loading}</div>`;
    try {
      const data = await this._feedApi(null);
      this._renderFeedSourcesList(data.sources || []);
    } catch (e) {
      container.innerHTML = `<div class="rss-feed-msg error">${t.ed.feed_load_error}: ${e.message}</div>`;
    }
  }

  _renderFeedSourcesList(list) {
    const container = this.querySelector('#ed-feed-sources');
    if (!container) return;
    const t = this._t();
    if (list.length === 0) {
      container.innerHTML = `<div class="rss-feed-msg">—</div>`;
      return;
    }
    container.innerHTML = list.map(f => `
      <div class="rss-src-row" data-feed-id="${f.id}" style="flex-wrap:wrap;">
        <input type="text" data-field="name" value="${(f.name || '').replace(/"/g, '&quot;')}" style="flex:1 1 90px;min-width:0;"/>
        <input type="text" data-field="url" value="${(f.url || '').replace(/"/g, '&quot;')}" style="flex:2 1 140px;min-width:0;"/>
        <select data-field="type" style="flex-shrink:0;">
          <option value="standard" ${f.type === 'standard' ? 'selected' : ''}>standard</option>
          <option value="google_news" ${f.type === 'google_news' ? 'selected' : ''}>google_news</option>
        </select>
        <input type="number" data-field="max_items" value="${f.max_items ?? 15}" style="width:56px;flex-shrink:0;"/>
        <input type="color" data-field="color" value="${(f.color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(f.color)) ? f.color : '#1a73e8'}" title="${t.ed.feed_color}" style="width:36px;height:32px;padding:2px;flex-shrink:0;"/>
        <button class="rss-save" data-feed-id="${f.id}">💾</button>
        <button class="rss-del" data-feed-id="${f.id}">✕</button>
      </div>`).join('');

    container.querySelectorAll('.rss-save').forEach(btn => {
      btn.addEventListener('click', () => this._saveFeedSource(btn.dataset.feedId, btn.closest('.rss-src-row')));
    });
    container.querySelectorAll('.rss-del').forEach(btn => {
      btn.addEventListener('click', () => this._deleteFeedSource(btn.dataset.feedId));
    });
  }

  _readFeedRow(row) {
    return {
      name: row.querySelector('[data-field="name"]').value.trim(),
      url: row.querySelector('[data-field="url"]').value.trim(),
      type: row.querySelector('[data-field="type"]').value,
      max_items: parseInt(row.querySelector('[data-field="max_items"]').value, 10) || 15,
      color: row.querySelector('[data-field="color"]').value.trim(),
    };
  }

  async _addFeedSource() {
    const name = this.querySelector('#feed-new-name');
    const url = this.querySelector('#feed-new-url');
    const type = this.querySelector('#feed-new-type');
    const max = this.querySelector('#feed-new-max');
    const color = this.querySelector('#feed-new-color');
    const source = {
      name: name.value.trim(),
      url: url.value.trim(),
      type: type.value,
      max_items: parseInt(max.value, 10) || 15,
      color: color.value.trim(),
    };
    try {
      await this._feedApi({ action: 'add', source });
      name.value = ''; url.value = ''; max.value = '15'; type.value = 'standard'; color.value = '#1a73e8';
      this._loadFeedSources();
    } catch (e) {
      alert(e.message);
    }
  }

  async _saveFeedSource(id, row) {
    try {
      const source = this._readFeedRow(row);
      await this._feedApi({ action: 'edit', id: parseInt(id, 10), source });
      this._loadFeedSources();
    } catch (e) {
      alert(e.message);
    }
  }

  async _deleteFeedSource(id) {
    if (!confirm('Eliminare questa fonte RSS dal server?')) return;
    try {
      await this._feedApi({ action: 'delete', id: parseInt(id, 10) });
      this._loadFeedSources();
    } catch (e) {
      alert(e.message);
    }
  }

  _syncFields() {
    const c = this._config;
    const set = (id, val) => { const el = this.querySelector(id); if (el && document.activeElement !== el) el.value = val ?? ''; };
    const setChk = (id, val) => { const el = this.querySelector(id); if (el) el.checked = !!val; };
    set('#ed-title',     c.title);
    set('#ed-entity',    c.entity);
    set('#ed-max',       c.max_articles);
    set('#ed-height',    c.card_height);
    set('#ed-titlesize', c.title_font_size);
    set('#ed-descsize',  c.desc_font_size);
    set('#ed-card-title-color-text',    c.card_title_color);
    set('#ed-article-title-color-text', c.article_title_color);
    set('#ed-desc-color-text',          c.desc_color);
    set('#ed-feed-admin-url',           c.feed_admin_url);
    set('#ed-feed-admin-token',         c.feed_admin_token);
    setChk('#tog-source', c.show_source !== false);
    setChk('#tog-date',   c.show_date !== false);
    setChk('#tog-desc',   c.show_description !== false);
    setChk('#tog-original', c.show_original !== false);
  }

  _upd(key, value) {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }
}

customElements.define('rss-news-card', RssNewsCard);
customElements.define('rss-news-card-editor', RssNewsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'rss-news-card',
  name: 'RSS News Card',
  description: 'Scrollable RSS news card with multi-source support.',
  preview: true,
});
