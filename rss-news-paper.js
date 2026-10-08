/**
 * RSS News Card for Home Assistant
 * v1.6.0 - HACS-compatible, auto language detection, visual editor,
 *           configurable colors/fonts, visited article tracking, topic labels
 */

// Bump this on every change you send me / every time you copy a new file to
// the server. Shown at the top of the card so you can verify at a glance
// which build is actually loaded, without opening dev tools.
const CARD_VERSION = 'v1.24.0 · build 2026-10-08-09';

// ─── Defaults per il tuo setup (RSS server) ────────────────────────────────
// Se l'utente non imposta questi valori nella card, vengono usati questi.
const DEFAULT_ENTITY = 'sensor.news_aggregator';
const DEFAULT_FEED_ADMIN_BASE_URL = 'http://192.168.1.249/news-aggregator/';
// Ogni quanto la card ricontrolla i colori delle fonti sul server admin.
// Basso abbastanza da riflettere in fretta una modifica fatta nell'editor,
// alto abbastanza da non intasare il server a ogni aggiornamento sensore.
const SOURCE_COLORS_REFRESH_MS = 60 * 1000;
// Nome del file PHP di amministrazione fonti: resta interno al JS,
// l'utente inserisce solo il percorso/cartella del server, non il file.
const FEED_ADMIN_FILENAME = 'sources_admin.php';
// Endpoint dedicato ai pattern bloccati (long-press su una notizia -> popup
// "Blocca le notizie da questo percorso"). Sta nella stessa cartella
// dell'endpoint fonti, quindi riusa lo stesso feed_admin_url/token della card.
const BLOCK_PATHS_FILENAME = 'block_paths.php';
// Endpoint del popup "riassunto" (click su una notizia): scarica l'articolo
// lato server, ne estrae le frasi principali e le traduce se serve.
const SUMMARIZE_FILENAME = 'summarize.php';
// Pagina di scelta per importare fonti da un file OPML (sta accanto a
// sources_admin.php): l'editor la apre passando token e indirizzo OPML.
const OPML_IMPORT_PAGE = 'opml_import.html';
// Impostazioni di "dove tradurre" (stessa cartella di sources_admin.php).
const TRANSLATE_ADMIN_FILENAME = 'translate_admin.php';
// Oltre questo tempo dall'ultima volta che si è scrollato, la posizione
// salvata non viene più ripristinata e la lista riparte dall'inizio: le
// notizie sono molte e dopo qualche ora non ha senso tornare dove si era.
// Vale solo per lo scroll: fonte e argomento scelti restano ricordati.
const SCROLL_MEMORY_MAX_AGE_MS = 2 * 60 * 60 * 1000;
// Quanto tenere premuto prima che scatti il long-press (ms). Sotto questa
// soglia il gesto viene trattato come un normale tap/click che apre l'articolo.
const LONG_PRESS_MS = 550;
// Se il dito/puntatore si sposta più di questi px durante la pressione, è
// uno scroll e non un long-press: annulliamo il timer.
const LONG_PRESS_MOVE_TOLERANCE = 10;

// ─── Localizations ────────────────────────────────────────────────────────────
const RSS_LOCALES = {
  en: {
    no_articles: 'No articles to display.',
    filter_all: 'All sources',
    filter_all_topics: 'All topics',
    summary: {
      loading: 'Reading the article…', open: 'Open article', close: 'Close',
      auto_note: 'Automatic summary: the key sentences of the article.',
      partial_note: 'Only the description declared by the site was available.',
      translated: 'Translated automatically', not_translated: 'Original text (translation unavailable)',
      unavailable: 'Summary not available', fallback_note: 'Showing the feed description instead.', reason: 'Reason', original: 'Original', retry_translation: 'Retry translation', err_interrupted: 'The server answers, but the request for this article was interrupted (timeout or server error)', err_unreachable: 'Server not reachable from this app (network, CORS or missing file)', err_mixed: 'Home Assistant is opened over HTTPS but the news server is HTTP: the browser blocks the request (mixed content)',
    },
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
      auto_height:       'Auto height (fill screen down to bottom)',
      show_source:       'Show category',
      show_date:         'Show date',
      show_desc:         'Show description',
      show_original:     'Show original text',
      summary_popup:     'Summary popup on click',
      title_size:        'Article title font size (px)',
      desc_size:         'Description font size (px)',
      color_hint:        'Leave empty for theme default',
      feed_admin_url:    'RSS server path (folder only, no filename)',
      feed_admin_token:  'Feed admin token',
      feed_sources:      'RSS feed sources (server)',
      feed_add:          '+ Add feed',
      feed_color:        'Source color (used for the category badge)',
      opml_url:          'Import sources from an OPML file (address)',
      opml_open:         'Open selection page',
      opml_hint:         'Opens a page where you choose which feeds to add, with a preview of their articles.',
      opml_need_token:   'Enter the feed admin token first.',
      tr_provider:       'Where to translate the news',
      tr_google:         'Google Translate (online, with limits)',
      tr_ollama:         'Ollama (local AI, no limits)',
      tr_host:           'Ollama server IP or name',
      tr_port:           'Port',
      tr_model:          'Model',
      tr_check:          'Check and load models',
      tr_test:           'Try a translation',
      tr_fallback:       'If Ollama does not answer, use Google',
      tr_save:           'Save on the server',
      tr_hint:           'The news server does the translating, not the phone: this address must be reachable from it (same network) and Ollama must listen on all interfaces (OLLAMA_HOST=0.0.0.0).',
      tr_need_token:     'Enter the feed admin token first.',
      tr_loading:        'Reading the settings…',
      tr_checking:       'Checking Ollama…',
      tr_models_ok:      '{n} models found · Ollama {v}',
      tr_models_none:    'Ollama answers but has no models: install one, e.g. "ollama pull gemma3:4b".',
      tr_testing:        'Translating…',
      tr_test_ok:        'Translated in {s} s: {text}',
      tr_saved:          'Saved on the server.',
      tr_err:            'Error: {msg}',
      tr_pick_model:     'Pick a model first.',
      tr_g_pause:        'Google paused until {time} (last error {code}).',
      tr_g_ok:           'Google: no pause ({n}/{max} requests this hour).',
      tr_o_last:         'Ollama: last translation {time} ({s} s, {model}).',
      tr_o_err:          'Ollama: last error at {time}: {msg}',
      tr_cache:          '{n} translations remembered.',
      tr_net:            'No answer from {file}: usually the file is not on the server yet (copy it next to sources_admin.php), or PHP hit an error. Try opening this address in the browser: {url}',
      tr_net_mixed:      'Home Assistant is open over HTTPS but the news server is HTTP: the browser blocks the request (mixed content).',
      tr_testing_s:      'Translating… {s} s',
      tr_stats:          ' (model loading {load} s, {tps} tokens/s)',
      tr_fallback_ollama: 'If Google is exhausted, use Ollama',
      tr_threads:        'CPU threads (0 = automatic)',
      tr_threads_hint:   'If another add-on (e.g. Frigate) uses the CPU, try fewer threads than the free cores (2, 3…) and press "Try a translation": compare the tokens/s.',
      tr_stats2:         ' (model loading {load} s, reading the text {prompt} s, writing {tps} tokens/s)',
      tr_loaded_yes:     'The model is in memory but generates too slowly for this computer: try a smaller one (e.g. qwen2.5:1.5b).',
      tr_loaded_no:      'The model is not in memory yet: it is still loading (slow disk or too little RAM?). Try again in a minute.',
      tr_testing_hint:   'The first time the model has to load into memory: it can take more than a minute, then translations are much faster.',
      tr_timeout:        'No answer within {s} s: the model is too slow for this computer. Try a smaller model (e.g. qwen2.5:1.5b), or try again: it may already be in memory now.',
      feed_loading:      'Loading feeds…',
      feed_load_error:   'Could not load feeds',
      feed_set_url_first:'Set the admin endpoint URL to manage feeds.',
      feed_verify:         'Verify this feed URL',
      feed_verify_no_url:  'Enter a feed URL first.',
      feed_verify_ok:      'Found {n} items ({format} feed).',
      feed_verify_error:   'Verification failed',
    },
  },
  hu: {
    no_articles: 'Nincs megjeleníthető cikk.',
    filter_all: 'Összes forrás',
    filter_all_topics: 'Összes téma',
    summary: {
      loading: 'A cikk beolvasása…', open: 'Cikk megnyitása', close: 'Bezárás',
      auto_note: 'Automatikus összefoglaló: a cikk fő mondatai.',
      partial_note: 'Csak az oldal által megadott leírás volt elérhető.',
      translated: 'Automatikusan lefordítva', not_translated: 'Eredeti szöveg (a fordítás nem érhető el)',
      unavailable: 'Az összefoglaló nem érhető el', fallback_note: 'A hírcsatorna leírását mutatom.', reason: 'Ok', original: 'Eredeti', retry_translation: 'Fordítás újrapróbálása', err_interrupted: 'A szerver válaszol, de a cikkre vonatkozó kérés megszakadt (időtúllépés vagy szerverhiba)', err_unreachable: 'A szerver nem érhető el ebből az alkalmazásból (hálózat, CORS vagy hiányzó fájl)', err_mixed: 'A Home Assistant HTTPS-en van megnyitva, a hírszerver viszont HTTP: a böngésző blokkolja a kérést (vegyes tartalom)',
    },
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
      auto_height:         'Automatikus magasság (kitölti a képernyőt)',
      show_source:         'Kategória látható',
      show_date:           'Dátum látható',
      show_desc:           'Leírás látható',
      show_original:       'Eredeti szöveg megjelenítése',
      summary_popup:       'Összefoglaló ablak kattintáskor',
      title_size:          'Cím betűmérete (px)',
      desc_size:           'Leírás betűmérete (px)',
      color_hint:          'Üresen hagyva a téma alapszínét használja',
      feed_admin_url:      'RSS szerver útvonal (csak mappa, fájlnév nélkül)',
      feed_admin_token:    'Feed admin token',
      feed_sources:        'RSS források (szerver)',
      feed_add:            '+ Forrás hozzáadása',
      feed_color:          'Forrás színe (a kategória jelöléséhez)',
      opml_url:            'Források importálása OPML fájlból (cím)',
      opml_open:           'Kiválasztó oldal megnyitása',
      opml_hint:           'Megnyit egy oldalt, ahol kiválaszthatod a hozzáadandó csatornákat, cikkelőnézettel.',
      opml_need_token:     'Először add meg a források adminisztrációs tokenjét.',
      tr_provider:         'Hol fordítsa a híreket',
      tr_google:           'Google Fordító (online, korlátokkal)',
      tr_ollama:           'Ollama (helyi MI, korlátok nélkül)',
      tr_host:             'Az Ollama szerver IP-címe vagy neve',
      tr_port:             'Port',
      tr_model:            'Modell',
      tr_check:            'Ellenőrzés és modellek betöltése',
      tr_test:             'Fordítás kipróbálása',
      tr_fallback:         'Ha az Ollama nem válaszol, használja a Google-t',
      tr_save:             'Mentés a szerveren',
      tr_hint:             'A fordítást a hírszerver végzi, nem a telefon: a címnek onnan elérhetőnek kell lennie (azonos hálózat), és az Ollamának minden interfészen figyelnie kell (OLLAMA_HOST=0.0.0.0).',
      tr_need_token:       'Először add meg a források adminisztrációs tokenjét.',
      tr_loading:          'Beállítások olvasása…',
      tr_checking:         'Az Ollama ellenőrzése…',
      tr_models_ok:        '{n} modell található · Ollama {v}',
      tr_models_none:      'Az Ollama válaszol, de nincs modellje: telepíts egyet, pl. "ollama pull gemma3:4b".',
      tr_testing:          'Fordítás…',
      tr_test_ok:          'Lefordítva {s} mp alatt: {text}',
      tr_saved:            'Elmentve a szerveren.',
      tr_err:              'Hiba: {msg}',
      tr_pick_model:       'Előbb válassz modellt.',
      tr_g_pause:          'A Google szünetel eddig: {time} (utolsó hiba: {code}).',
      tr_g_ok:             'Google: nincs szünet ({n}/{max} kérés ebben az órában).',
      tr_o_last:           'Ollama: utolsó fordítás {time} ({s} mp, {model}).',
      tr_o_err:            'Ollama: utolsó hiba {time}: {msg}',
      tr_cache:            '{n} fordítás megjegyezve.',
      tr_net:              'Nincs válasz innen: {file}: általában a fájl még nincs a szerveren (másold a sources_admin.php mellé), vagy a PHP hibát jelzett. Próbáld megnyitni a böngészőben ezt a címet: {url}',
      tr_net_mixed:        'A Home Assistant HTTPS-en van megnyitva, a hírszerver viszont HTTP: a böngésző blokkolja a kérést (vegyes tartalom).',
      tr_testing_s:        'Fordítás… {s} mp',
      tr_stats:            ' (modell betöltése {load} mp, {tps} token/mp)',
      tr_fallback_ollama:  'Ha a Google kimerült, használja az Ollamát',
      tr_threads:          'CPU-szálak (0 = automatikus)',
      tr_threads_hint:     'Ha másik kiegészítő (pl. Frigate) is használja a CPU-t, próbálj a szabad magoknál kevesebb szálat (2, 3…), majd nyomd meg a „Fordítás kipróbálása” gombot: hasonlítsd össze a token/mp értéket.',
      tr_stats2:           ' (modell betöltése {load} mp, szöveg beolvasása {prompt} mp, írás {tps} token/mp)',
      tr_loaded_yes:       'A modell a memóriában van, de túl lassan generál ehhez a géphez: próbálj kisebbet (pl. qwen2.5:1.5b).',
      tr_loaded_no:        'A modell még nincs a memóriában: még töltődik (lassú lemez vagy kevés RAM?). Próbáld újra egy perc múlva.',
      tr_testing_hint:     'Első használatkor a modellnek be kell töltődnie a memóriába: ez egy percnél is tovább tarthat, utána a fordítás sokkal gyorsabb.',
      tr_timeout:          'Nincs válasz {s} mp alatt: a modell túl lassú ehhez a géphez. Próbálj kisebb modellt (pl. qwen2.5:1.5b), vagy próbáld újra: lehet, hogy már a memóriában van.',
      feed_loading:        'Források betöltése…',
      feed_load_error:     'Nem sikerült betölteni a forrásokat',
      feed_set_url_first:  'Add meg a végpont URL-jét a források kezeléséhez.',
      feed_verify:         'Feed URL ellenőrzése',
      feed_verify_no_url:  'Először add meg a feed URL-jét.',
      feed_verify_ok:      '{n} elem található ({format} feed).',
      feed_verify_error:   'Az ellenőrzés sikertelen',
    },
  },
  de: {
    no_articles: 'Keine Artikel zum Anzeigen.',
    filter_all: 'Alle Quellen',
    filter_all_topics: 'Alle Themen',
    summary: {
      loading: 'Artikel wird gelesen…', open: 'Artikel öffnen', close: 'Schließen',
      auto_note: 'Automatische Zusammenfassung: die wichtigsten Sätze des Artikels.',
      partial_note: 'Nur die von der Seite angegebene Beschreibung war verfügbar.',
      translated: 'Automatisch übersetzt', not_translated: 'Originaltext (Übersetzung nicht verfügbar)',
      unavailable: 'Zusammenfassung nicht verfügbar', fallback_note: 'Stattdessen wird die Feed-Beschreibung angezeigt.', reason: 'Grund', original: 'Original', retry_translation: 'Übersetzung erneut versuchen', err_interrupted: 'Der Server antwortet, aber die Anfrage für diesen Artikel wurde unterbrochen (Timeout oder Serverfehler)', err_unreachable: 'Server von dieser App aus nicht erreichbar (Netzwerk, CORS oder fehlende Datei)', err_mixed: 'Home Assistant ist über HTTPS geöffnet, der News-Server aber nur über HTTP: der Browser blockiert die Anfrage (Mixed Content)',
    },
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
      auto_height:         'Automatische Höhe (füllt den Bildschirm bis unten)',
      show_source:         'Kategorie anzeigen',
      show_date:           'Datum anzeigen',
      show_desc:           'Beschreibung anzeigen',
      show_original:       'Originaltext anzeigen',
      summary_popup:       'Zusammenfassung beim Klick',
      title_size:          'Schriftgröße Artikeltitel (px)',
      desc_size:           'Schriftgröße Beschreibung (px)',
      color_hint:          'Leer lassen für Themenstandardfarbe',
      feed_admin_url:      'RSS-Server-Pfad (nur Ordner, ohne Dateiname)',
      feed_admin_token:    'Feed-Admin-Token',
      feed_sources:        'RSS-Quellen (Server)',
      feed_add:            '+ Quelle hinzufügen',
      feed_color:          'Quellfarbe (für das Kategorie-Label)',
      opml_url:            'Quellen aus einer OPML-Datei importieren (Adresse)',
      opml_open:           'Auswahlseite öffnen',
      opml_hint:           'Öffnet eine Seite, auf der du die hinzuzufügenden Feeds auswählst, mit Vorschau der Artikel.',
      opml_need_token:     'Gib zuerst das Feed-Admin-Token ein.',
      tr_provider:         'Wo die Nachrichten übersetzt werden',
      tr_google:           'Google Übersetzer (online, mit Limits)',
      tr_ollama:           'Ollama (lokale KI, ohne Limits)',
      tr_host:             'IP oder Name des Ollama-Servers',
      tr_port:             'Port',
      tr_model:            'Modell',
      tr_check:            'Prüfen und Modelle laden',
      tr_test:             'Übersetzung testen',
      tr_fallback:         'Wenn Ollama nicht antwortet, Google verwenden',
      tr_save:             'Auf dem Server speichern',
      tr_hint:             'Den Nachrichtenserver übersetzt, nicht das Handy: Die Adresse muss von dort erreichbar sein (gleiches Netz) und Ollama muss auf allen Schnittstellen lauschen (OLLAMA_HOST=0.0.0.0).',
      tr_need_token:       'Gib zuerst das Feed-Admin-Token ein.',
      tr_loading:          'Einstellungen werden gelesen…',
      tr_checking:         'Ollama wird geprüft…',
      tr_models_ok:        '{n} Modelle gefunden · Ollama {v}',
      tr_models_none:      'Ollama antwortet, hat aber keine Modelle: installiere eines, z. B. "ollama pull gemma3:4b".',
      tr_testing:          'Übersetze…',
      tr_test_ok:          'In {s} s übersetzt: {text}',
      tr_saved:            'Auf dem Server gespeichert.',
      tr_err:              'Fehler: {msg}',
      tr_pick_model:       'Wähle zuerst ein Modell.',
      tr_g_pause:          'Google pausiert bis {time} (letzter Fehler {code}).',
      tr_g_ok:             'Google: keine Pause ({n}/{max} Anfragen in dieser Stunde).',
      tr_o_last:           'Ollama: letzte Übersetzung {time} ({s} s, {model}).',
      tr_o_err:            'Ollama: letzter Fehler um {time}: {msg}',
      tr_cache:            '{n} Übersetzungen gespeichert.',
      tr_net:              'Keine Antwort von {file}: meist liegt die Datei noch nicht auf dem Server (neben sources_admin.php kopieren) oder PHP hatte einen Fehler. Öffne diese Adresse im Browser: {url}',
      tr_net_mixed:        'Home Assistant ist über HTTPS geöffnet, der News-Server aber nur über HTTP: Der Browser blockiert die Anfrage (Mixed Content).',
      tr_testing_s:        'Übersetze… {s} s',
      tr_stats:            ' (Modell laden {load} s, {tps} Token/s)',
      tr_fallback_ollama:  'Wenn Google erschöpft ist, Ollama verwenden',
      tr_threads:          'CPU-Threads (0 = automatisch)',
      tr_threads_hint:     'Wenn ein anderes Add-on (z. B. Frigate) die CPU nutzt, probiere weniger Threads als freie Kerne (2, 3 …) und drücke „Übersetzung testen“: Vergleiche die Token/s.',
      tr_stats2:           ' (Modell laden {load} s, Text lesen {prompt} s, Schreiben {tps} Token/s)',
      tr_loaded_yes:       'Das Modell ist im Speicher, erzeugt aber zu langsam für diesen Rechner: Versuche ein kleineres (z. B. qwen2.5:1.5b).',
      tr_loaded_no:        'Das Modell ist noch nicht im Speicher: Es lädt noch (langsame Platte oder zu wenig RAM?). Versuche es in einer Minute erneut.',
      tr_testing_hint:     'Beim ersten Mal muss das Modell in den Speicher geladen werden: das kann über eine Minute dauern, danach geht es deutlich schneller.',
      tr_timeout:          'Keine Antwort innerhalb von {s} s: Das Modell ist für diesen Rechner zu langsam. Versuche ein kleineres Modell (z. B. qwen2.5:1.5b) oder probiere es erneut: Es könnte jetzt schon im Speicher sein.',
      feed_loading:        'Quellen werden geladen…',
      feed_load_error:     'Quellen konnten nicht geladen werden',
      feed_set_url_first:  'Admin-Endpunkt-URL festlegen, um Quellen zu verwalten.',
      feed_verify:         'Feed-URL prüfen',
      feed_verify_no_url:  'Bitte zuerst eine Feed-URL eingeben.',
      feed_verify_ok:      '{n} Einträge gefunden ({format}-Feed).',
      feed_verify_error:   'Prüfung fehlgeschlagen',
    },
  },
  it: {
    no_articles: 'Nessun articolo da mostrare.',
    filter_all: 'Tutte le fonti',
    filter_all_topics: 'Tutti gli argomenti',
    summary: {
      loading: "Sto leggendo l'articolo…", open: 'Apri articolo', close: 'Chiudi',
      auto_note: "Riassunto automatico: le frasi principali dell'articolo.",
      partial_note: 'Disponibile solo la descrizione dichiarata dal sito.',
      translated: 'Tradotto automaticamente', not_translated: 'Testo originale (traduzione non disponibile)',
      unavailable: 'Riassunto non disponibile', fallback_note: 'Mostro la descrizione del feed.', reason: 'Motivo', original: 'Originale', retry_translation: 'Riprova la traduzione', err_interrupted: "Il server risponde, ma la richiesta per questo articolo è stata interrotta (timeout o errore sul server)", err_unreachable: 'Server non raggiungibile da questa app (rete, CORS o file mancante)', err_mixed: 'Home Assistant è aperto in HTTPS ma il server notizie è in HTTP: il browser blocca la richiesta (contenuto misto)',
    },
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
      auto_height:          'Altezza automatica (fino al fondo pagina)',
      show_source:          'Mostra categoria',
      show_date:            'Mostra data',
      show_desc:            'Mostra descrizione',
      show_original:        'Mostra testo originale',
      summary_popup:        'Popup riassunto al click',
      title_size:           'Dimensione carattere titolo (px)',
      desc_size:            'Dimensione carattere descrizione (px)',
      color_hint:           'Lascia vuoto per il colore predefinito del tema',
      feed_admin_url:       'Percorso server fonti RSS (cartella, senza nome file)',
      feed_admin_token:     'Token amministrazione fonti',
      feed_sources:         'Fonti RSS (server)',
      feed_add:             '+ Aggiungi fonte RSS',
      feed_color:           "Colore della fonte (usato per l'etichetta categoria)",
      opml_url:             'Importa fonti da un file OPML (indirizzo)',
      opml_open:            'Apri pagina di selezione',
      opml_hint:            'Si apre una pagina dove scegli quali feed aggiungere, con anteprima degli articoli.',
      opml_need_token:      'Inserisci prima il token amministrazione fonti.',
      tr_provider:          'Dove tradurre le notizie',
      tr_google:            'Google Traduttore (online, con limiti)',
      tr_ollama:            'Ollama (AI locale, senza limiti)',
      tr_host:              'IP o nome del server Ollama',
      tr_port:              'Porta',
      tr_model:             'Modello',
      tr_check:             'Verifica e carica modelli',
      tr_test:              'Prova una traduzione',
      tr_fallback:          'Se Ollama non risponde, usa Google',
      tr_save:              'Salva sul server',
      tr_hint:              "La traduzione la fa il server delle notizie, non il telefono: l'indirizzo deve essere raggiungibile da lì (stessa rete) e Ollama deve ascoltare su tutte le interfacce (OLLAMA_HOST=0.0.0.0).",
      tr_need_token:        'Inserisci prima il token amministrazione fonti.',
      tr_loading:           'Leggo le impostazioni…',
      tr_checking:          'Controllo Ollama…',
      tr_models_ok:         '{n} modelli trovati · Ollama {v}',
      tr_models_none:       'Ollama risponde ma non ha modelli: installane uno, ad esempio con "ollama pull gemma3:4b".',
      tr_testing:           'Traduco…',
      tr_test_ok:           'Tradotto in {s} s: {text}',
      tr_saved:             'Salvato sul server.',
      tr_err:               'Errore: {msg}',
      tr_pick_model:        'Scegli prima un modello.',
      tr_g_pause:           'Google in pausa fino alle {time} (ultimo errore {code}).',
      tr_g_ok:              "Google: nessuna pausa ({n}/{max} richieste in quest'ora).",
      tr_o_last:            'Ollama: ultima traduzione {time} ({s} s, {model}).',
      tr_o_err:             'Ollama: ultimo errore alle {time}: {msg}',
      tr_cache:             '{n} traduzioni in memoria.',
      tr_net:               "Nessuna risposta da {file}: di solito il file non è ancora sul server (va copiato accanto a sources_admin.php) oppure PHP ha avuto un errore. Prova ad aprire questo indirizzo nel browser: {url}",
      tr_net_mixed:         'Home Assistant è aperto in HTTPS ma il server delle notizie è in HTTP: il browser blocca la richiesta (contenuto misto).',
      tr_testing_s:         'Traduco… {s} s',
      tr_stats:             ' (caricamento del modello {load} s, {tps} token/s)',
      tr_fallback_ollama:   'Se Google è esaurito, usa Ollama',
      tr_threads:           'Thread CPU (0 = automatico)',
      tr_threads_hint:      'Se un altro add-on (ad esempio Frigate) usa la CPU, prova meno thread dei core liberi (2, 3…) e premi "Prova una traduzione": confronta i token/s.',
      tr_stats2:            ' (caricamento del modello {load} s, lettura del testo {prompt} s, scrittura {tps} token/s)',
      tr_loaded_yes:        'Il modello è in memoria ma genera troppo lentamente per questo computer: prova uno più piccolo (ad esempio qwen2.5:1.5b).',
      tr_loaded_no:         'Il modello non è ancora in memoria: sta ancora caricando (disco lento o poca RAM?). Riprova tra un minuto.',
      tr_testing_hint:      'La prima volta il modello deve caricarsi in memoria: può servire più di un minuto, poi le traduzioni sono molto più veloci.',
      tr_timeout:           'Nessuna risposta entro {s} s: il modello è troppo lento per questo computer. Prova un modello più piccolo (ad esempio qwen2.5:1.5b) oppure riprova: ora potrebbe essere già in memoria.',
      feed_loading:         'Caricamento fonti…',
      feed_load_error:      'Impossibile caricare le fonti',
      feed_set_url_first:   'Imposta l\'URL dell\'endpoint per gestire le fonti.',
      feed_verify:          'Verifica questo indirizzo RSS',
      feed_verify_no_url:   'Scrivi prima un indirizzo del feed.',
      feed_verify_ok:       'Trovate {n} notizie (feed {format}).',
      feed_verify_error:    'Verifica fallita',
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
    this._selectedTopic = 'all';
    // Filtri e posizione di scroll sopravvivono a un ricaricamento completo
    // della pagina (es. Android che scarica l'app dalla memoria mentre è in
    // background e la ricarica al ritorno): vengono salvati in localStorage
    // e riletti una sola volta all'avvio di QUESTA istanza della card, per
    // non sovrascrivere in loop una scelta che l'utente sta facendo ora.
    this._filtersRestored = false;
    this._scrollRestored = false;
    this._scrollSaveTimer = null;
    // Popup riassunto: cache in memoria (url -> risposta) per non richiedere
    // due volte lo stesso articolo nella stessa sessione, richiesta in corso
    // (per poterla annullare alla chiusura) e popup aperto.
    this._summaryCache = new Map();
    this._summaryAbort = null;
    this._summaryOverlay = null;
    this._summaryKeyHandler = null;
    this._sourceColors = {};
    this._sourceColorsFetchedAt = 0;
    // Pattern bloccati (long-press -> "Blocca"): caricati dal server e
    // tenuti in memoria qui, così ogni volta che si ricostruisce la lista
    // (cambio fonte nel filtro, refresh periodico, ecc.) gli articoli
    // bloccati restano fuori invece di ricomparire dal dato grezzo del
    // sensore, che il server aggiorna solo al prossimo giro di
    // rebuild_cache.php.
    this._blockedPatterns = [];
    this._blockedPatternsFetchedAt = 0;
    // Statistiche per fonte (last_checked, items_found, items_downloaded)
    // lette da cache/source_stats.json — aggiornate con lo stesso throttle
    // dei colori fonte (SOURCE_COLORS_REFRESH_MS).
    this._sourceStats = {};
    this._sourceStatsFetchedAt = 0;
  }

  static getConfigElement() {
    return document.createElement('rss-news-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'News',
      entity: DEFAULT_ENTITY,
      card_height: 400,
      auto_height: false,
      show_description: true,
      show_source: true,
      show_date: true,
      show_original: true,
      summary_popup: true,
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
      card_height:      config.card_height || 400,
      // Se true, ignora card_height e riempie automaticamente lo spazio
      // verticale disponibile fino al fondo pagina (leggermente meno, vedi
      // _applyAutoHeight). Default false per non cambiare il comportamento
      // di chi ha già configurato la card con un'altezza fissa.
      auto_height:      config.auto_height === true,
      show_description: config.show_description !== false,
      show_source:      config.show_source !== false,
      show_date:        config.show_date !== false,
      show_original:    config.show_original !== false,
      // Al click su una notizia apre un popup col riassunto (default) invece
      // di aprire subito la pagina. false = comportamento precedente.
      summary_popup:    config.summary_popup !== false,
      title_font_size:  config.title_font_size || 15,
      desc_font_size:   config.desc_font_size || 14,
      card_title_color: config.card_title_color || '',
      article_title_color: config.article_title_color || '',
      desc_color:       config.desc_color || '',
      feed_admin_url:   config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL,
      feed_admin_token: config.feed_admin_token || '',
    };
    this._restoreFiltersOnce();
    this._initialized = false;
    this._render();
    // Apply dynamic properties immediately after render
    if (this._hass) {
      this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    }
    // Colore per-fonte (badge categoria): caricato dal server admin fonti.
    // _loadSourceColors() è auto-limitato nel tempo (vedi SOURCE_COLORS_REFRESH_MS).
    this._loadSourceColors();
    this._loadBlockedPatterns();
    this._loadSourceStats();
  }

  set hass(hass) {
    this._hass = hass;
    // Aggiornamento colori fonte: chiamata leggera e auto-limitata nel
    // tempo, va fatta a ogni "tick" di hass (non solo quando cambia il
    // sensore) altrimenti se il sensore aggiorna raramente il colore
    // impostato lato server resterebbe non visto per molto più a lungo.
    this._loadSourceColors();
    this._loadBlockedPatterns();
    this._loadSourceStats();
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
    // Lista COMPLETA (non troncata) ordinata per data, di tutte le fonti.
    // Il limite "Numero massimo di articoli" viene applicato più avanti, in
    // _updateContent(), DOPO aver eventualmente filtrato per fonte — non qui.
    // Applicarlo qui (su tutte le fonti insieme, prima del filtro) tagliava
    // fuori dal pool intere fonti con articoli mediamente più "vecchi" delle
    // altre: sparivano sia dalla lista sia dal menu a tendina, pur essendo
    // presenti nel sensore (il dato grezzo di Home Assistant non è mai
    // troncato — solo quello che la card ne faceva lo era).
    if (!this._hass) return [];
    const state = this._hass.states[this._config.entity];
    if (!state) return [];
    const articles = state.attributes.articles;
    if (!Array.isArray(articles)) return [];
    return [...articles].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  }

  _feedAdminFullUrl() {
    let base = (this._config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL || '').trim();
    if (!base) return '';
    base = base.replace(/sources_admin\.php.*$/i, '');
    if (!base.endsWith('/')) base += '/';
    return base + 'sources_admin.php';
  }

  async _loadSourceColors(force = false) {
    const url = this._feedAdminFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!url) return;
    // Refresh automatico "a tempo" in background (throttle) + refresh forzato
    // immediato quando l'utente interagisce col combobox fonte (force=true):
    // così vede subito il colore aggiornato invece di aspettare il timer.
    const now = Date.now();
    if (!force && this._sourceColorsFetchedAt && (now - this._sourceColorsFetchedAt) < SOURCE_COLORS_REFRESH_MS) return;
    this._sourceColorsFetchedAt = now; // segna il tentativo subito, evita richieste in parallelo
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
      // Ricolora eventuali articoli già renderizzati
      if (this._hass) this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    } catch {
      // Nessuna connessione al server admin fonti: la card resta comunque
      // funzionante, semplicemente senza colori personalizzati per fonte.
      // Il prossimo tentativo scatterà comunque dopo SOURCE_COLORS_REFRESH_MS.
    }
  }

  async _loadBlockedPatterns(force = false) {
    const url = this._blockPathsAdminFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!url) return;
    const now = Date.now();
    if (!force && this._blockedPatternsFetchedAt && (now - this._blockedPatternsFetchedAt) < SOURCE_COLORS_REFRESH_MS) return;
    this._blockedPatternsFetchedAt = now;
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token), {
        method: 'GET',
        headers: { 'X-API-Token': token },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return; // silenzioso: la card resta comunque funzionante senza filtro
      this._blockedPatterns = (data.blocked || []).map(b => b.pattern).filter(Boolean);
      // Riapplica subito il filtro agli articoli già renderizzati (es. dopo
      // un reload della pagina, prima che l'utente tocchi qualunque cosa).
      if (this._hass) this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    } catch {
      // Nessuna connessione al server: la card resta comunque funzionante,
      // semplicemente senza il filtro dei percorsi bloccati finché non
      // torna raggiungibile (prossimo tentativo dopo SOURCE_COLORS_REFRESH_MS,
      // o subito se l'utente blocca un nuovo percorso nel frattempo).
    }
  }

  // URL del file source_stats.json: stessa cartella base del server admin fonti.
  _sourceStatsUrl() {
    let base = (this._config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL || '').trim();
    if (!base) return '';
    // Rimuove eventuali nomi di file PHP residui, garantisce lo slash finale.
    base = base.replace(/[a-z_]+\.php.*$/i, '');
    if (!base.endsWith('/')) base += '/';
    return base + 'cache/source_stats.json';
  }

  async _loadSourceStats(force = false) {
    const now = Date.now();
    if (!force && this._sourceStatsFetchedAt && (now - this._sourceStatsFetchedAt) < SOURCE_COLORS_REFRESH_MS) return;
    this._sourceStatsFetchedAt = now;
    // NB: _feedApi() esiste solo nella classe RssNewsCardEditor, non qui in
    // RssNewsCard: niente shortcut, rifacciamo il fetch GET a mano con lo
    // stesso pattern usato da _loadSourceColors()/_loadBlockedPatterns().
    // La risposta include anche "stats": { nomeFonte: {last_checked,...} }.
    const url = this._feedAdminFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!url) { this._sourceStatsDebug = 'feed_admin_url non configurato'; return; }
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token), {
        method: 'GET',
        headers: { 'X-API-Token': token },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        this._sourceStatsDebug = 'Errore: ' + (data && data.error ? data.error : ('HTTP ' + res.status));
        return;
      }
      if (data && data.stats && typeof data.stats === 'object') {
        this._sourceStats = data.stats;
        this._sourceStatsDebug = 'OK · ' + Object.keys(data.stats).length + ' fonti';
      } else {
        this._sourceStatsDebug = 'stats assente nella risposta';
      }
    } catch(e) {
      this._sourceStatsDebug = 'Errore: ' + String(e);
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
        style="display:flex;flex-direction:column;gap:8px;padding:12px 0;border-bottom:1px solid var(--divider-color);cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;">
        <div style="flex:1;min-width:0;text-align:left;">
          <div class="rss-atitle" style="font-size:${title_font_size}px;font-weight:600;line-height:1.4;color:${mainTitleColor};white-space:normal;word-break:break-word;margin-bottom:4px;">${titleMain}${publication ? ` <span style="font-style:italic;font-weight:400;opacity:0.75;color:${publicationColor};">– ${publication}</span>` : ''}</div>
          ${show_original && a.title_original ? `<div style="font-size:${Math.max(10, title_font_size - 2)}px;font-style:italic;opacity:0.65;color:${desc_color || 'var(--secondary-text-color)'};line-height:1.3;white-space:normal;word-break:break-word;margin-bottom:4px;">${a.title_original}</div>` : ''}
        </div>
        ${imgSrc ? `<img src="${imgSrc}" draggable="false" style="width:100%;height:auto;display:block;border-radius:8px;" onerror="this.style.display='none'"/>` : ''}
        <div style="flex:1;min-width:0;text-align:left;">
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

  // Ricava dal link dell'articolo un "pattern" ragionevole da proporre per
  // il blocco: il primo segmento di percorso dopo il dominio (es.
  // "https://www.spaziogames.it/articoli/xyz" -> "/articoli/"). È lo stesso
  // tipo di sottostringa che rebuild_cache.php confronta con stripos(), non
  // serve altro. Se l'URL non ha un path riconoscibile, ricade sull'intero
  // pathname.
  _extractBlockPattern(url) {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/^\/[^\/]+\//);
      const pattern = m ? m[0] : (u.pathname || '/');
      return { pattern, display: u.hostname + pattern };
    } catch {
      return { pattern: url, display: url };
    }
  }

  _blockPathsAdminFullUrl() {
    let base = (this._config.feed_admin_url || '').trim();
    if (!base) return '';
    base = base
      .replace(new RegExp(FEED_ADMIN_FILENAME.replace('.', '\\.') + '/?$'), '')
      .replace(new RegExp(BLOCK_PATHS_FILENAME.replace('.', '\\.') + '/?$'), '');
    if (!/\/$/.test(base)) base += '/';
    return base + BLOCK_PATHS_FILENAME;
  }

  async _blockPath(pattern) {
    const baseUrl = this._blockPathsAdminFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!baseUrl) throw new Error(this._t().ed.feed_set_url_first);
    const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Token': token },
      body: JSON.stringify({ action: 'add', pattern, note: 'Bloccato con long-press dalla card' }),
    });
    let data;
    try { data = await res.json(); } catch { throw new Error('Risposta non JSON dal server (' + res.status + ')'); }
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  _ensureBlockModalStyles() {
    if (document.getElementById('rss-block-modal-style')) return;
    const style = document.createElement('style');
    style.id = 'rss-block-modal-style';
    style.textContent = `
      .rss-block-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
      .rss-block-box{background:var(--card-background-color,#1c1c1c);color:var(--primary-text-color,#fff);border-radius:12px;padding:20px;max-width:340px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.4);}
      .rss-block-path{font-family:monospace;font-size:13px;background:var(--secondary-background-color,rgba(255,255,255,0.08));border-radius:6px;padding:8px 10px;margin-bottom:12px;word-break:break-all;}
      .rss-block-msg{font-size:14px;line-height:1.4;margin-bottom:18px;}
      .rss-block-actions{display:flex;gap:10px;justify-content:flex-end;}
      .rss-block-actions button{border:none;border-radius:8px;padding:9px 16px;font-size:14px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;}
      .rss-block-cancel{background:transparent;color:var(--secondary-text-color,#aaa);}
      .rss-block-cancel:hover{background:var(--secondary-background-color,rgba(255,255,255,0.08));}
      .rss-block-confirm{background:var(--error-color,#db4437);color:#fff;}
      .rss-block-confirm:disabled{opacity:0.6;cursor:default;}
    `;
    document.head.appendChild(style);
  }

  _showBlockPathModal(url) {
    this._ensureBlockModalStyles();
    const { pattern, display } = this._extractBlockPattern(url);

    const overlay = document.createElement('div');
    overlay.className = 'rss-block-overlay';
    overlay.innerHTML = `
      <div class="rss-block-box">
        <div class="rss-block-path">${display}</div>
        <div class="rss-block-msg">Blocca le notizie da questo percorso? Non verranno più incluse nei prossimi aggiornamenti del feed.</div>
        <div class="rss-block-actions">
          <button type="button" class="rss-block-cancel">Annulla</button>
          <button type="button" class="rss-block-confirm">Blocca</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) close(); });
    overlay.querySelector('.rss-block-cancel').addEventListener('click', close);
    overlay.querySelector('.rss-block-confirm').addEventListener('click', async () => {
      const btn = overlay.querySelector('.rss-block-confirm');
      btn.disabled = true;
      btn.textContent = '…';
      try {
        await this._blockPath(pattern);
        if (!this._blockedPatterns.includes(pattern)) {
          this._blockedPatterns.push(pattern);
        }
        this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
        close();
      } catch (e) {
        alert(e.message);
        btn.disabled = false;
        btn.textContent = 'Blocca';
      }
    });
  }

  // ─── Popup "riassunto" al click su una notizia ──────────────────────────────
  // Il testo arriva da summarize.php (lato server: la card non può scaricare
  // da sola la pagina di un altro sito per via del CORS del browser).

  _escHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _summarizeFullUrl() {
    let base = (this._config.feed_admin_url || DEFAULT_FEED_ADMIN_BASE_URL || '').trim();
    if (!base) return '';
    base = base
      .replace(new RegExp(FEED_ADMIN_FILENAME.replace('.', '\\.') + '/?$'), '')
      .replace(new RegExp(BLOCK_PATHS_FILENAME.replace('.', '\\.') + '/?$'), '')
      .replace(new RegExp(SUMMARIZE_FILENAME.replace('.', '\\.') + '/?$'), '');
    if (!/\/$/.test(base)) base += '/';
    return base + SUMMARIZE_FILENAME;
  }

  // true se summarize.php risponde a una richiesta senza articolo (è leggera e
  // restituisce un errore JSON con gli header CORS): qualsiasi risposta
  // leggibile significa "server raggiungibile e CORS ok".
  _originOf(url) {
    try { return new URL(url).origin; } catch { return String(url); }
  }

  async _pingSummarize(base, token) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      await fetch(base + (base.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token), { signal: ctrl.signal });
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  // retry = true quando l'utente tocca "Riprova la traduzione": salta la copia in
  // memoria e dice al server di fare un tentativo anche se il servizio di
  // traduzione è in pausa (il server ne concede UNO solo).
  async _fetchSummary(articleUrl, signal, retry = false) {
    const cached = retry ? null : this._summaryCache.get(articleUrl);
    // Copia in memoria valida solo 5 minuti: il server ha già la sua cache su
    // disco (risponde in un attimo), e così dopo un aggiornamento del server
    // non si resta a lungo a vedere un testo vecchio finché non si ricarica la pagina.
    if (cached && (Date.now() - cached.at) < 5 * 60 * 1000) return cached.data;
    const base = this._summarizeFullUrl();
    const token = (this._config.feed_admin_token || '').trim();
    const full = base + (base.includes('?') ? '&' : '?')
      + 'token=' + encodeURIComponent(token)
      + '&url=' + encodeURIComponent(articleUrl)
      + (retry ? '&retry=1' : '');
    const t0 = this._t().summary;
    const route = `[${(typeof location !== 'undefined' && location.origin) || '?'} → ${this._originOf(base)}]`;
    // Pagina in HTTPS che chiama un server in HTTP: il browser blocca la
    // richiesta ("contenuto misto") e l'unico messaggio che dà è "Failed to
    // fetch". Qui lo si riconosce prima ancora di provare.
    if (typeof location !== 'undefined' && location.protocol === 'https:' && /^http:\/\//i.test(base)) {
      throw new Error(`${t0.err_mixed} ${route}`);
    }
    let res;
    try {
      res = await fetch(full, { signal });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      // Il browser dice solo "Failed to fetch" sia se il server non si vede
      // (rete, CORS, file mancante) sia se la richiesta parte ma la
      // connessione cade a metà (timeout, errore sul server). Le due cause
      // si distinguono con una richiesta leggera allo stesso endpoint: se
      // risponde, il server c'è e il problema è la richiesta vera.
      const t = this._t().summary;
      const reachable = await this._pingSummarize(base, token);
      // Con l'indirizzo della pagina e quello del server si vede subito se
      // l'app sta usando un indirizzo diverso da quello che ci si aspetta.
      throw new Error(reachable ? t.err_interrupted : `${t.err_unreachable} ${route}`);
    }
    let data;
    try { data = await res.json(); } catch { throw new Error('Risposta non JSON dal server (' + res.status + ')'); }
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    // In memoria si tengono solo i risultati completi, come fa il server con la
    // sua cache su disco: un errore passeggero della traduzione (o il ripiego
    // sulla sola descrizione del sito) non deve restare "congelato" per 5 minuti.
    if (!data.translation_warning && !data.partial && data.source !== 'meta') {
      this._summaryCache.set(articleUrl, { data, at: Date.now() });
    }
    return data;
  }

  _ensureSummaryStyles() {
    if (document.getElementById('rss-summary-modal-style')) return;
    const style = document.createElement('style');
    style.id = 'rss-summary-modal-style';
    style.textContent = `
      .rss-sum-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;}
      .rss-sum-box{background:var(--card-background-color,#1c1c1c);color:var(--primary-text-color,#fff);border-radius:14px;max-width:520px;width:100%;max-height:86vh;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,0.5);overflow:hidden;}
      .rss-sum-head{padding:16px 18px 6px;flex-shrink:0;}
      .rss-sum-meta{font-size:11px;color:var(--secondary-text-color,#aaa);display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px;}
      .rss-sum-title{font-size:17px;font-weight:700;line-height:1.35;word-break:break-word;}
      .rss-sum-pub{font-style:italic;font-weight:400;opacity:0.75;}
      .rss-sum-body{padding:8px 18px 14px;overflow-y:auto;-webkit-overflow-scrolling:touch;font-size:14px;line-height:1.5;flex:1;min-height:60px;}
      .rss-sum-list{margin:6px 0 0;padding-left:18px;}
      .rss-sum-list li{margin-bottom:9px;}
      .rss-sum-orig-title{margin-top:14px;padding-top:10px;border-top:1px dashed var(--divider-color,rgba(255,255,255,0.15));font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--secondary-text-color,#aaa);}
      .rss-sum-list-orig{font-style:italic;font-size:13px;color:var(--secondary-text-color,#aaa);}
      .rss-sum-note{font-size:11px;color:var(--secondary-text-color,#aaa);opacity:0.85;margin-top:10px;}
      .rss-sum-loading{color:var(--secondary-text-color,#aaa);padding:8px 0;}
      .rss-sum-unavail{font-weight:600;margin-bottom:8px;}
      .rss-sum-fallback-desc{color:var(--secondary-text-color,#aaa);}
      .rss-sum-spinner{display:inline-block;width:14px;height:14px;border:2px solid var(--divider-color,#555);border-top-color:var(--primary-color,#03a9f4);border-radius:50%;animation:rss-sum-spin .8s linear infinite;vertical-align:-2px;margin-right:8px;}
      @keyframes rss-sum-spin{to{transform:rotate(360deg);}}
      .rss-sum-actions{display:flex;gap:10px;justify-content:flex-end;padding:12px 18px 16px;border-top:1px solid var(--divider-color,rgba(255,255,255,0.12));flex-shrink:0;}
      .rss-sum-btn{border:none;border-radius:8px;padding:10px 16px;font-size:14px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;}
      .rss-sum-btn-secondary{background:transparent;color:var(--secondary-text-color,#aaa);}
      .rss-sum-btn-secondary:hover{background:var(--secondary-background-color,rgba(255,255,255,0.08));}
      .rss-sum-btn-primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);}
    `;
    document.head.appendChild(style);
  }

  _closeSummaryPopup() {
    if (this._summaryAbort) { try { this._summaryAbort.abort(); } catch {} this._summaryAbort = null; }
    if (this._summaryKeyHandler) {
      document.removeEventListener('keydown', this._summaryKeyHandler);
      this._summaryKeyHandler = null;
    }
    if (this._summaryOverlay) { this._summaryOverlay.remove(); this._summaryOverlay = null; }
  }

  // Nome della lingua nella lingua dell'interfaccia (es. "en" -> "inglese").
  // Intl.DisplayNames c'è in tutti i browser recenti; se manca o non conosce
  // il codice, si mostra il codice stesso in maiuscolo.
  _langName(code) {
    const c = String(code || '').trim();
    if (!c || c === 'und' || c === 'other') return '';   // lingua non determinata: l'intestazione dice solo "Originale"
    try {
      const n = new Intl.DisplayNames([this._getLang()], { type: 'language' }).of(c);
      if (n && n !== c) return n;
    } catch { /* ripiega sul codice */ }
    return c.toUpperCase();
  }

  _summaryBodyHtml(data, t) {
    const list = (arr, cls) => `<ul class="rss-sum-list${cls ? ' ' + cls : ''}">`
      + (arr || []).map(s => `<li>${this._escHtml(s)}</li>`).join('') + '</ul>';
    // Prima il riassunto (tradotto, se l'articolo non era in italiano)...
    let html = list(data.sentences);
    // ...poi, se c'è stata una traduzione, le stesse frasi nella lingua
    // originale. Con un server più vecchio che non le invia, la sezione
    // semplicemente non compare.
    const orig = Array.isArray(data.sentences_original) ? data.sentences_original : [];
    if (data.translated && orig.length) {
      const name = this._langName(data.lang);
      html += `<div class="rss-sum-orig-title">${this._escHtml(t.original)}${name ? ` (${this._escHtml(name)})` : ''}</div>`
        + list(orig, 'rss-sum-list-orig');
    }
    const notes = [];
    notes.push(data.partial || data.source === 'meta' ? t.partial_note : t.auto_note);
    const translationFailed = !data.translated && data.lang && data.lang !== 'it' && !!data.translation_warning;
    if (data.translated) notes.push(t.translated);
    else if (translationFailed) notes.push(t.not_translated);
    // Quale server ha risposto: versione (se il server la dichiara) e build.
    // Serve a verificare a colpo d'occhio che sul server giri il file aggiornato.
    const srv = [data.version ? 'v' + data.version : null, data.build].filter(Boolean).join(' · ');
    // Se la traduzione non è riuscita si mostra il motivo (così si può capire
    // cosa non va) e un bottone per riprovare senza chiudere il popup.
    const failBox = translationFailed
      ? `<div class="rss-sum-note">${this._escHtml(t.reason)}: ${this._escHtml(data.translation_warning)} `
        + `<button type="button" class="rss-sum-retry" style="border:1px solid var(--divider-color,#555);background:transparent;color:var(--primary-color,#03a9f4);border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;">${this._escHtml(t.retry_translation)}</button></div>`
      : '';
    return html + `<div class="rss-sum-note">${notes.map(n => this._escHtml(n)).join(' · ')}</div>`
      + failBox
      + (srv ? `<div class="rss-sum-note" style="opacity:0.55;">summarize.php ${this._escHtml(srv)}</div>` : '');
  }

  // Se il riassunto non si può ottenere (sito che blocca, paywall, server non
  // raggiungibile...) il popup non resta vuoto: mostra la descrizione che la
  // card aveva già, il motivo del problema, e il bottone per aprire l'articolo.
  _summaryFallbackHtml(article, err, t) {
    const desc = this._cleanDescription(article.description);
    const reason = err && err.name === 'AbortError' ? 'timeout' : ((err && err.message) || '');
    return `<div class="rss-sum-unavail">${this._escHtml(t.unavailable)}</div>`
      + (desc ? `<div class="rss-sum-fallback-desc">${this._escHtml(desc)}</div>`
              + `<div class="rss-sum-note">${this._escHtml(t.fallback_note)}</div>` : '')
      + (reason ? `<div class="rss-sum-note">${this._escHtml(t.reason)}: ${this._escHtml(reason)}</div>` : '');
  }

  _openSummaryPopup(article) {
    this._closeSummaryPopup();
    this._ensureSummaryStyles();
    const t = this._t().summary;

    const provider = this._providerLabel(article);
    const isAggregator = /google/i.test(String(provider || ''));
    const { main: titleMain, publication } = isAggregator
      ? this._splitAggregatorTitle(article)
      : { main: article.title, publication: null };
    const topic = this._topicLabel(article);
    const meta = [
      `<span style="font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${this._escHtml(this._categoryColor(article))};">${this._escHtml(topic)}</span>`,
    ];
    if (provider && String(provider).toLowerCase() !== String(topic).toLowerCase()) {
      meta.push(`<span style="font-weight:600;">${this._escHtml(provider)}</span>`);
    }
    meta.push(`<span>${this._escHtml(this._formatDate(article.pubDate))}</span>`);

    const overlay = document.createElement('div');
    overlay.className = 'rss-sum-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="rss-sum-box">
        <div class="rss-sum-head">
          <div class="rss-sum-meta">${meta.join('<span style="opacity:0.4;">·</span>')}</div>
          <div class="rss-sum-title">${this._escHtml(titleMain)}${publication ? ` <span class="rss-sum-pub">– ${this._escHtml(publication)}</span>` : ''}</div>
        </div>
        <div class="rss-sum-body"><div class="rss-sum-loading"><span class="rss-sum-spinner"></span>${this._escHtml(t.loading)}</div></div>
        <div class="rss-sum-actions">
          <button type="button" class="rss-sum-btn rss-sum-btn-secondary rss-sum-close">${this._escHtml(t.close)}</button>
          <button type="button" class="rss-sum-btn rss-sum-btn-primary rss-sum-open">${this._escHtml(t.open)} ↗</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    this._summaryOverlay = overlay;

    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) this._closeSummaryPopup(); });
    overlay.querySelector('.rss-sum-close').addEventListener('click', () => this._closeSummaryPopup());
    // Il bottone chiama _handleLinkClick direttamente dentro il click (senza
    // await in mezzo): serve perché i browser lasciano aprire una finestra
    // solo in risposta diretta a un gesto dell'utente.
    overlay.querySelector('.rss-sum-open').addEventListener('click', () => {
      this._handleLinkClick(article.link);
      this._closeSummaryPopup();
    });
    this._summaryKeyHandler = (ev) => { if (ev.key === 'Escape') this._closeSummaryPopup(); };
    document.addEventListener('keydown', this._summaryKeyHandler);

    const body = overlay.querySelector('.rss-sum-body');
    // Il caricamento è una funzione perché il bottone "Riprova la traduzione"
    // deve poterlo rifare senza chiudere e riaprire il popup.
    const load = (retry = false) => {
      body.innerHTML = `<div class="rss-sum-loading"><span class="rss-sum-spinner"></span>${this._escHtml(t.loading)}</div>`;
      const ctrl = new AbortController();
      this._summaryAbort = ctrl;
      const timer = setTimeout(() => ctrl.abort(), 50000);
      this._fetchSummary(article.link, ctrl.signal, retry)
        .then((data) => {
          if (this._summaryOverlay !== overlay) return;
          body.innerHTML = this._summaryBodyHtml(data, t);
          const retryBtn = body.querySelector('.rss-sum-retry');
          if (retryBtn) retryBtn.addEventListener('click', () => load(true));
        })
        .catch((err) => { if (this._summaryOverlay === overlay) body.innerHTML = this._summaryFallbackHtml(article, err, t); })
        .finally(() => clearTimeout(timer));
    };
    load();
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
          .rss-header{display:flex;flex-direction:column;gap:6px;margin-bottom:8px;}
          .rss-header-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
          .rss-title{font-size:24px;font-weight:400;margin-bottom:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .rss-version{font-size:10px;color:var(--secondary-text-color);opacity:0.55;white-space:nowrap;align-self:flex-end;}
          .rss-source-filter-wrap,.rss-topic-filter-wrap{position:relative;flex:1;min-width:0;}
          .rss-source-filter-btn,.rss-topic-filter-btn{display:flex;align-items:center;gap:6px;width:100%;max-width:100%;padding:4px 8px;font-size:12px;border-radius:6px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .rss-source-filter-btn-dot,.rss-topic-filter-btn-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:var(--secondary-text-color);}
          .rss-source-filter-btn-label,.rss-topic-filter-btn-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;text-align:left;}
          .rss-source-filter-btn-caret,.rss-topic-filter-btn-caret{flex-shrink:0;opacity:0.6;font-size:9px;}
          .rss-source-filter-menu,.rss-topic-filter-menu{position:absolute;top:calc(100% + 4px);min-width:150px;max-width:min(240px,80vw);max-height:280px;overflow-y:auto;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.35);z-index:20;padding:4px 0;}
          .rss-source-filter-menu{left:0;}
          .rss-topic-filter-menu{right:0;}
          .rss-source-filter-menu[hidden],.rss-topic-filter-menu[hidden]{display:none;}
          .rss-source-filter-scroll-hint,.rss-topic-filter-scroll-hint{position:sticky;bottom:4px;display:block;width:100%;box-sizing:border-box;padding-right:10px;text-align:right;pointer-events:none;opacity:0;transition:opacity .15s ease;}
          .rss-source-filter-scroll-hint::after,.rss-topic-filter-scroll-hint::after{content:'▾';display:inline-flex;align-items:center;justify-content:center;width:32px;height:20px;border-radius:5px;background:rgba(255,255,255,0.55);color:#000;font-size:19px;font-weight:700;line-height:1;}
          .rss-source-filter-scroll-hint.visible,.rss-topic-filter-scroll-hint.visible{opacity:1;}
          .rss-source-filter-option,.rss-topic-filter-option{display:flex;align-items:center;gap:8px;padding:9px 12px;font-size:13px;color:var(--primary-text-color);cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .rss-source-filter-option:hover,.rss-source-filter-option:active,.rss-topic-filter-option:hover,.rss-topic-filter-option:active{background:var(--secondary-background-color);}
          .rss-source-filter-option.selected,.rss-topic-filter-option.selected{font-weight:700;}
          .rss-source-filter-dot,.rss-topic-filter-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;background:var(--secondary-text-color);}
          .rss-source-stat-badge{margin-left:auto;font-size:10px;font-family:monospace;opacity:0.65;white-space:nowrap;padding-left:4px;}
          .rss-source-stat-badge--warn{color:var(--error-color,#f44336);opacity:0.9;font-weight:700;}
          .rss-source-ghost{border-top:1px solid var(--divider-color);}
          .rss-filters-row{display:flex;align-items:center;gap:6px;width:100%;}
          .rss-scroll{overflow-y:scroll;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:var(--divider-color) transparent;}
          .rss-article-row,.rss-article-row *{-webkit-user-select:none!important;-moz-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;}
        </style>
        <div class="rss-inner">
          <div class="rss-header">
            <div class="rss-header-top">
              <div class="rss-title-el"></div>
              <div class="rss-version">${CARD_VERSION}</div>
            </div>
            <div class="rss-filters-row">
              <div class="rss-source-filter-wrap">
                <button type="button" class="rss-source-filter-btn">
                  <span class="rss-source-filter-btn-dot"></span>
                  <span class="rss-source-filter-btn-label"></span>
                  <span class="rss-source-filter-btn-caret">▾</span>
                </button>
                <div class="rss-source-filter-menu" hidden></div>
              </div>
              <div class="rss-topic-filter-wrap">
                <button type="button" class="rss-topic-filter-btn">
                  <span class="rss-topic-filter-btn-dot"></span>
                  <span class="rss-topic-filter-btn-label"></span>
                  <span class="rss-topic-filter-btn-caret">▾</span>
                </button>
                <div class="rss-topic-filter-menu" hidden></div>
              </div>
            </div>
          </div>
          <div class="rss-diag"></div>
          <div class="rss-scroll"><div class="rss-articles"></div></div>
        </div>

      </ha-card>`;
    this._initialized = true;

    // Salva la posizione di scroll mentre l'utente scorre (con un piccolo
    // debounce: non ha senso scrivere su localStorage ad ogni pixel). Il
    // listener va riattaccato qui perché _render() sostituisce tutto
    // l'innerHTML della card, quindi anche il nodo .rss-scroll è nuovo.
    const scrollElForSave = this.querySelector('.rss-scroll');
    if (scrollElForSave) {
      scrollElForSave.addEventListener('scroll', () => {
        clearTimeout(this._scrollSaveTimer);
        this._scrollSaveTimer = setTimeout(() => {
          const anchor = this._findScrollAnchor(scrollElForSave);
          // scrollTop resta salvato come ripiego, per quando la notizia
          // "ancora" non si trova più (bloccata nel frattempo, o cache del
          // server aggiornata prima che la card si riaprisse).
          this._savePersistedState({
            scrollTop: scrollElForSave.scrollTop,
            anchorLink: anchor ? anchor.link : null,
            anchorOffset: anchor ? anchor.offset : 0,
            scrollSavedAt: Date.now(),
          });
        }, 400);
      }, { passive: true });
    }

    const filterBtn = this.querySelector('.rss-source-filter-btn');
    const filterMenu = this.querySelector('.rss-source-filter-menu');
    if (filterBtn && filterMenu) {
      filterBtn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (filterMenu.hidden) {
          // Aspetta stats fresche prima di aprire: i badge sono già pronti
          // alla prima apertura, senza lampeggio di aggiornamento successivo.
          await this._loadSourceStats(true);
          this._populateSourceFilter();
          filterMenu.hidden = false;
          this._updateFilterScrollHint();
        } else {
          filterMenu.hidden = true;
        }
      });
    }
    // Indicatore "ci sono altre fonti sotto": un solo listener di scroll sul
    // menu per istanza (stesso motivo del listener di chiusura sotto).
    if (!this._boundFilterMenuScroll) {
      this._boundFilterMenuScroll = () => this._updateFilterScrollHint();
    }
    if (filterMenu) {
      filterMenu.removeEventListener('scroll', this._boundFilterMenuScroll);
      filterMenu.addEventListener('scroll', this._boundFilterMenuScroll);
    }

    // Filtro argomenti: stessa logica del filtro fonti, ma senza bisogno di
    // ricaricare statistiche dal server (i topic vengono già dagli articoli
    // che la card ha già in memoria).
    const topicBtn = this.querySelector('.rss-topic-filter-btn');
    const topicMenu = this.querySelector('.rss-topic-filter-menu');
    if (topicBtn && topicMenu) {
      topicBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (topicMenu.hidden) {
          this._populateTopicFilter();
          topicMenu.hidden = false;
          this._updateTopicFilterScrollHint();
        } else {
          topicMenu.hidden = true;
        }
      });
    }
    if (!this._boundTopicFilterMenuScroll) {
      this._boundTopicFilterMenuScroll = () => this._updateTopicFilterScrollHint();
    }
    if (topicMenu) {
      topicMenu.removeEventListener('scroll', this._boundTopicFilterMenuScroll);
      topicMenu.addEventListener('scroll', this._boundTopicFilterMenuScroll);
    }

    // Click fuori dal menu -> chiudi. Un solo listener sul document per
    // istanza (rimosso e riaggiunto a ogni _render per evitare che si
    // accumulino più listener quando la card viene ri-renderizzata).
    if (!this._boundCloseFilterMenu) {
      this._boundCloseFilterMenu = (ev) => {
        const wrap = this.querySelector('.rss-source-filter-wrap');
        const menu = this.querySelector('.rss-source-filter-menu');
        if (wrap && menu && !menu.hidden && !wrap.contains(ev.target)) menu.hidden = true;
        const tWrap = this.querySelector('.rss-topic-filter-wrap');
        const tMenu = this.querySelector('.rss-topic-filter-menu');
        if (tWrap && tMenu && !tMenu.hidden && !tWrap.contains(ev.target)) tMenu.hidden = true;
      };
    }
    document.removeEventListener('click', this._boundCloseFilterMenu);
    document.addEventListener('click', this._boundCloseFilterMenu);

    // Ricalcola l'altezza automatica quando cambia lo spazio disponibile:
    // rotazione schermo, ridimensionamento finestra su PC, apertura/
    // chiusura della sidebar di Home Assistant (che in genere scatena
    // comunque un resize della finestra). Stesso pattern bind-once di
    // sopra: un solo listener per istanza, tolto e rimesso a ogni render.
    if (!this._boundAutoHeight) {
      this._boundAutoHeight = () => {
        if (this._config.auto_height) this._applyAutoHeight();
      };
    }
    window.removeEventListener('resize', this._boundAutoHeight);
    window.addEventListener('resize', this._boundAutoHeight);
    // Al primo render la posizione della card sulla pagina può non essere
    // ancora definitiva (altre card/immagini sopra ancora in caricamento):
    // un ricalcolo singolo poco dopo copre questo caso senza dover legare
    // altri listener permanenti.
    if (this._config.auto_height) {
      setTimeout(() => this._applyAutoHeight(), 300);
    }
  }

  disconnectedCallback() {
    this._closeSummaryPopup();
    if (this._boundCloseFilterMenu) document.removeEventListener('click', this._boundCloseFilterMenu);
    if (this._boundAutoHeight) window.removeEventListener('resize', this._boundAutoHeight);
  }

  // Selezione di una fonte dal menu a tendina personalizzato: aggiorna lo
  // stato, ricostruisce la lista articoli, riporta lo scroll in cima e
  // forza un refresh immediato dei colori fonte.
  // Chiave di storage univoca per QUESTA card: incorpora l'entità e il
  // titolo, così più card RSS nella stessa dashboard (fonti diverse) non si
  // pestano i piedi a vicenda salvando sotto la stessa chiave.
  // Trova la notizia "in cima" alla zona visibile del contenitore
  // scrollabile in questo momento, e quanto siamo scesi oltre il suo inizio
  // (in pixel): è quello che permette, al ripristino, di rimettere lo
  // scroll ESATTAMENTE come prima, non solo "vicino".
  _findScrollAnchor(scrollEl) {
    const rows = Array.from(scrollEl.querySelectorAll('.rss-article-row'));
    if (!rows.length) return null;
    const containerTop = scrollEl.getBoundingClientRect().top;
    const scrollTop = scrollEl.scrollTop;
    let best = null;
    for (const row of rows) {
      // Posizione della riga dentro il contenuto scrollabile, indipendente
      // da eventuali contenitori intermedi non scrollabili tra .rss-scroll
      // e la riga stessa.
      const relTop = row.getBoundingClientRect().top - containerTop + scrollTop;
      if (relTop <= scrollTop + 1) {
        best = { link: row.dataset.rssUrl, offset: scrollTop - relTop };
      } else {
        break; // le righe sono in ordine: la prima oltre lo scrollTop chiude la ricerca
      }
    }
    return best;
  }

  // Ricalcola la stessa posizione dopo che gli articoli sono stati
  // ridisegnati: cerca la riga con lo stesso link e riporta lo scroll a
  // quell'altezza meno lo scostamento salvato.
  _scrollToAnchor(scrollEl, anchorLink, anchorOffset) {
    if (!anchorLink) return false;
    const rows = Array.from(scrollEl.querySelectorAll('.rss-article-row'));
    const row = rows.find(r => r.dataset.rssUrl === anchorLink);
    if (!row) return false;
    const containerTop = scrollEl.getBoundingClientRect().top;
    const relTop = row.getBoundingClientRect().top - containerTop + scrollEl.scrollTop;
    // anchorOffset è "quanto eravamo scesi OLTRE l'inizio della riga"
    // (scrollTop_salvato - relTop_salvato): per tornare alla stessa
    // posizione relativa si somma, non si sottrae.
    scrollEl.scrollTop = Math.max(0, relTop + (anchorOffset || 0));
    return true;
  }

  _storageKey() {
    const id = (this._config.entity || '') + '|' + (this._config.title || '');
    return 'rss-news-card:' + id;
  }

  // localStorage può non essere disponibile (navigazione privata, quota
  // esaurita, policy del browser): ogni accesso è avvolto in try/catch e un
  // fallimento qui non deve MAI impedire alla card di funzionare, solo far
  // sì che filtri e scroll non vengano ricordati.
  _loadPersistedState() {
    try {
      const raw = window.localStorage.getItem(this._storageKey());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _savePersistedState(patch) {
    try {
      const current = this._loadPersistedState() || {};
      window.localStorage.setItem(this._storageKey(), JSON.stringify(Object.assign(current, patch)));
    } catch { /* niente di grave: si ripristina solo il default */ }
  }

  // Chiamato una sola volta, da setConfig(), PRIMA del primo render: così la
  // prima cosa che si vede è già filtrata come l'utente l'aveva lasciata,
  // senza un lampo iniziale con "Tutte le fonti" seguito dal filtro giusto.
  _restoreFiltersOnce() {
    if (this._filtersRestored) return;
    this._filtersRestored = true;
    const saved = this._loadPersistedState();
    if (saved && typeof saved.selectedSource === 'string') this._selectedSource = saved.selectedSource;
    if (saved && typeof saved.selectedTopic === 'string') this._selectedTopic = saved.selectedTopic;
  }

  _selectSource(value) {
    this._selectedSource = value;
    const menu = this.querySelector('.rss-source-filter-menu');
    if (menu) menu.hidden = true;
    this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    // Il cambio fonte ricostruisce la lista articoli, ma il contenitore
    // scrollabile mantiene la vecchia posizione: se prima eravamo in
    // fondo, con la nuova lista (più corta) restiamo "appesi" in fondo.
    // Riportiamo sempre lo scroll in cima alla prima notizia.
    const scrollEl = this.querySelector('.rss-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    // Refresh immediato dei colori fonte (bypassa il throttle a tempo):
    // così un cambio colore appena salvato nell'editor si vede subito
    // interagendo col menu, senza aspettare il timer in background.
    this._loadSourceColors(true);
    this._savePersistedState({ selectedSource: value });
  }

  _populateSourceFilter() {
    const wrap = this.querySelector('.rss-source-filter-wrap');
    if (!wrap) return;
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
    // If the previously selected source no longer exists, fall back to "all"
    if (this._selectedSource !== 'all' && !names.includes(this._selectedSource)) {
      this._selectedSource = 'all';
    }
    const colorFor = (name) => this._sourceColors[String(name).trim().toLowerCase()] || null;

    // Fonti presenti negli articoli correnti (quelle "vive").
    const namesSet = new Set(names);

    // Fonti note dal server (source_stats.json) ma assenti dagli articoli:
    // le mostriamo ugualmente così l'utente capisce subito se qualcosa non ha scaricato.
    const ghostNames = Object.keys(this._sourceStats).filter(n => !namesSet.has(n));
    ghostNames.sort((a, b) => a.localeCompare(b));

    // Formatta il badge "[scaricati/trovati]" e il tooltip con l'ora.
    // Lookup case-insensitive: "Birdmen" nel JSON trova "birdmen" negli articoli.
    const statsBadge = (name) => {
      const nameLow = String(name).toLowerCase();
      const s = this._sourceStats[name]
             || this._sourceStats[Object.keys(this._sourceStats).find(k => k.toLowerCase() === nameLow) || ''];
      if (!s) return { badge: '', title: '' };
      const dl   = s.items_downloaded ?? 0;
      const tot  = s.items_found      ?? 0;
      const badge = `[${dl}/${tot}]`;
      let timeStr = '';
      if (s.last_checked) {
        try {
          timeStr = new Date(s.last_checked * 1000).toLocaleTimeString(
            this._getDateLocale(), { hour: '2-digit', minute: '2-digit' }
          );
        } catch { timeStr = ''; }
      }
      const resultStr = s.result && s.result !== 'ok' ? ` · ${s.result}` : '';
      const title = timeStr ? `Ultimo controllo: ${timeStr}${resultStr}` : resultStr;
      return { badge, title };
    };

    // Costruisce una voce del menu.
    const makeOption = (value, label, color, isGhost) => {
      const { badge, title } = statsBadge(label);
      return { value, label, color, badge, title, isGhost };
    };

    const options = [
      { value: 'all', label: t.filter_all, color: null, badge: '', title: '', isGhost: false },
      ...names.map(n => makeOption(n, n, colorFor(n), false)),
      ...ghostNames.map(n => makeOption(n, n, colorFor(n), true)),
    ];

    // Bottone: mostra il pallino/etichetta della fonte attualmente selezionata
    const selected = options.find(o => o.value === this._selectedSource) || options[0];
    const btnDot = wrap.querySelector('.rss-source-filter-btn-dot');
    const btnLabel = wrap.querySelector('.rss-source-filter-btn-label');
    if (btnDot) btnDot.style.background = selected.color || 'var(--secondary-text-color)';
    if (btnLabel) btnLabel.textContent = selected.label + (selected.badge ? ' ' + selected.badge : '');

    // Menu: ricostruito a ogni refresh dati, ma l'attributo "hidden" del
    // contenitore non viene toccato, quindi se l'utente lo ha aperto resta
    // aperto anche durante un aggiornamento periodico del sensore.
    const menu = wrap.querySelector('.rss-source-filter-menu');
    if (menu) {
      menu.innerHTML = options.map(o => `
        <div class="rss-source-filter-option${o.value === this._selectedSource ? ' selected' : ''}${o.isGhost ? ' rss-source-ghost' : ''}"
             data-value="${String(o.value).replace(/"/g, '&quot;')}"
             ${o.title ? `title="${o.title.replace(/"/g, '&quot;')}"` : ''}>
          <span class="rss-source-filter-dot" style="background:${o.isGhost ? 'var(--error-color,#f44336)' : (o.color || 'var(--secondary-text-color)')};${o.isGhost ? 'opacity:0.6;' : ''}"></span>
          <span style="${o.isGhost ? 'opacity:0.6;' : ''}">${o.label}</span>
          ${o.badge ? `<span class="rss-source-stat-badge${o.isGhost ? ' rss-source-stat-badge--warn' : ''}">${o.badge}</span>` : ''}
        </div>`).join('') + '<div class="rss-source-filter-scroll-hint"></div>';
      menu.querySelectorAll('.rss-source-filter-option').forEach(opt => {
        opt.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this._selectSource(opt.dataset.value);
        });
      });
      // Se il menu è già aperto quando lo ripopoliamo (es. refresh periodico
      // dei colori mentre l'utente ha il menu sotto gli occhi), ricalcoliamo
      // subito l'indicatore invece di aspettare il prossimo scroll/apertura.
      if (!menu.hidden) this._updateFilterScrollHint();
    }
  }

  // Mostra/nasconde la sfumatura + freccina in fondo al menu fonti: visibile
  // solo quando c'è altro contenuto sotto da scorrere, sparisce quando si è
  // arrivati in fondo alla lista (o se la lista è già interamente visibile
  // senza bisogno di scroll).
  _updateFilterScrollHint() {
    const menu = this.querySelector('.rss-source-filter-menu');
    const hint = this.querySelector('.rss-source-filter-scroll-hint');
    if (!menu || !hint) return;
    const hasMoreBelow = (menu.scrollHeight - menu.scrollTop - menu.clientHeight) > 4;
    hint.classList.toggle('visible', hasMoreBelow);
  }

  // Selezione di un argomento dal menu a tendina: stessa logica di
  // _selectSource, ma sul filtro topic invece che fonte.
  _selectTopic(value) {
    this._selectedTopic = value;
    const menu = this.querySelector('.rss-topic-filter-menu');
    if (menu) menu.hidden = true;
    this._updateContent(this._articles || [], JSON.parse(this._lastIssuesJson || '[]'));
    const scrollEl = this.querySelector('.rss-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
    this._savePersistedState({ selectedTopic: value });
  }

  // Costruisce l'elenco argomenti a partire da TUTTI gli articoli correnti
  // (indipendentemente dalla fonte selezionata nell'altro filtro: i due
  // filtri sono indipendenti e si combinano, come richiesto), usando la
  // stessa etichetta mostrata sul badge di ogni notizia (_topicLabel), così
  // "Tecnologia", "Altro", ecc. compaiono esattamente una volta ciascuno
  // anche se provengono da fonti diverse.
  _populateTopicFilter() {
    const wrap = this.querySelector('.rss-topic-filter-wrap');
    if (!wrap) return;
    const t = this._t();

    const seen = new Map(); // chiave lowercase -> etichetta mostrata (prima occorrenza)
    for (const a of (this._articles || [])) {
      const label = this._topicLabel(a);
      if (!label) continue;
      const key = label.toLowerCase();
      if (!seen.has(key)) seen.set(key, label);
    }
    const topics = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));

    if (this._selectedTopic !== 'all' && !topics.some(tp => tp.toLowerCase() === this._selectedTopic.toLowerCase())) {
      this._selectedTopic = 'all';
    }

    const options = [
      { value: 'all', label: t.filter_all_topics },
      ...topics.map(tp => ({ value: tp, label: tp })),
    ];

    const selected = options.find(o => o.value.toLowerCase() === this._selectedTopic.toLowerCase()) || options[0];
    const btnLabel = wrap.querySelector('.rss-topic-filter-btn-label');
    if (btnLabel) btnLabel.textContent = selected.label;

    const menu = wrap.querySelector('.rss-topic-filter-menu');
    if (menu) {
      menu.innerHTML = options.map(o => `
        <div class="rss-topic-filter-option${o.value.toLowerCase() === this._selectedTopic.toLowerCase() ? ' selected' : ''}"
             data-value="${String(o.value).replace(/"/g, '&quot;')}">
          <span>${o.label}</span>
        </div>`).join('') + '<div class="rss-topic-filter-scroll-hint"></div>';
      menu.querySelectorAll('.rss-topic-filter-option').forEach(opt => {
        opt.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this._selectTopic(opt.dataset.value);
        });
      });
      if (!menu.hidden) this._updateTopicFilterScrollHint();
    }
  }

  // Analogo di _updateFilterScrollHint ma per il menu argomenti.
  _updateTopicFilterScrollHint() {
    const menu = this.querySelector('.rss-topic-filter-menu');
    const hint = this.querySelector('.rss-topic-filter-scroll-hint');
    if (!menu || !hint) return;
    const hasMoreBelow = (menu.scrollHeight - menu.scrollTop - menu.clientHeight) > 4;
    hint.classList.toggle('visible', hasMoreBelow);
  }

  // Calcola quanto spazio verticale resta tra la card e il fondo della
  // finestra e lo usa come altezza dello scroll interno, invece di un
  // valore fisso in px. Serve perché lo spazio disponibile cambia da
  // dispositivo a dispositivo (PC vs cellulare, con/senza sidebar, con/senza
  // altre card sopra) e un unico numero in px non va bene ovunque.
  _applyAutoHeight() {
    const scrollEl = this.querySelector('.rss-scroll');
    if (!scrollEl) return;
    const rect = scrollEl.getBoundingClientRect();
    // Margine sotto per non incollare il bordo della card esattamente al
    // fondo della finestra ("leggermente meno" richiesto): abbastanza per
    // respirare su schermi piccoli, trascurabile su schermi grandi.
    const bottomMargin = 16;
    const available = window.innerHeight - rect.top - bottomMargin;
    // Soglia minima: sotto questa la card diventerebbe inutilizzabile (es.
    // se il layout non è ancora stabile al primo render e rect.top è 0).
    const minHeight = 150;
    scrollEl.style.height = Math.max(available, minHeight) + 'px';
  }

  _updateContent(articles, issues) {
    if (!this._initialized) this._render();
    const { title, card_height, card_title_color } = this._config;

    // Filtra via gli articoli il cui link corrisponde a un percorso
    // bloccato (long-press -> "Blocca"). Va fatto QUI, in cima, prima di
    // qualunque altro uso di "articles": il dato grezzo del sensore Home
    // Assistant continua a contenerli finché il prossimo rebuild_cache.php
    // non li esclude lato server, quindi senza questo filtro locale
    // ricomparirebbero ogni volta che la card si ridisegna da _articles
    // (cambio fonte nel filtro, refresh del colore, ecc.), non solo alla
    // primissima rimozione ottimistica dopo il blocco.
    if (this._blockedPatterns.length > 0) {
      articles = articles.filter(a => !this._blockedPatterns.some(p => (a.link || '').includes(p)));
    }
    this._articles = articles; // _populateSourceFilter() legge da qui

    // Update title
    const titleEl = this.querySelector('.rss-title-el');
    if (titleEl) {
      titleEl.className = title ? 'rss-title-el rss-title' : 'rss-title-el';
      titleEl.style.color = card_title_color || 'var(--primary-text-color)';
      titleEl.textContent = title || '';
    }

    // Update scroll height dynamically
    const scrollEl = this.querySelector('.rss-scroll');
    if (scrollEl) {
      if (this._config.auto_height) {
        this._applyAutoHeight();
      } else {
        scrollEl.style.height = (card_height || 400) + 'px';
      }
    }

    this._populateSourceFilter();
    this._populateTopicFilter();
    // Nessun limite: la card mostra tutti gli articoli disponibili (già
    // filtrati per fonte/argomento, se selezionati). Il taglio "Numero
    // massimo di articoli" è stato rimosso su richiesta: niente più cap
    // artificiale. I due filtri sono indipendenti e si combinano (AND).
    const filteredArticles = articles
      .filter(a => this._selectedSource === 'all' || this._providerLabel(a) === this._selectedSource)
      .filter(a => this._selectedTopic === 'all' || this._topicLabel(a).toLowerCase() === this._selectedTopic.toLowerCase());

    const diagEl = this.querySelector('.rss-diag');
    const artEl = this.querySelector('.rss-articles');
    if (diagEl) diagEl.innerHTML = issues.length > 0 ? this._renderDiagnostics(issues) : '';
    if (artEl) {
      artEl.innerHTML = this._buildArticlesHtml(filteredArticles);
      // Attach click listeners – popup on desktop, in-app modal on mobile/companion app
      artEl.querySelectorAll('.rss-article-row').forEach(row => {
        let lpTimer = null;
        let longPressFired = false;
        let startX = 0, startY = 0;

        const clearLpTimer = () => {
          if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
        };

        row.addEventListener('pointerdown', (ev) => {
          longPressFired = false;
          startX = ev.clientX; startY = ev.clientY;
          clearLpTimer();
          lpTimer = setTimeout(() => {
            longPressFired = true;
            lpTimer = null;
            if (navigator.vibrate) navigator.vibrate(15);
            const url = row.dataset.rssUrl;
            if (url) this._showBlockPathModal(url);
          }, LONG_PRESS_MS);
        });
        // Su Android/touch, tenere premuto fa scattare anche il menu nativo
        // "seleziona testo / copia" del browser (l'evento contextmenu):
        // senza bloccarlo, il nostro popup appare CON quella selezione
        // ancora attiva sotto. Il CSS user-select:none sulla riga aiuta,
        // ma è questo preventDefault a impedire davvero il menu nativo.
        row.addEventListener('contextmenu', (ev) => ev.preventDefault());
        // Su alcune WebView Android (es. l'app companion di Home Assistant)
        // il solo contextmenu non basta: la selezione può partire prima che
        // quell'evento scatti. selectstart è il momento esatto in cui il
        // browser sta per avviare una selezione: bloccarlo qui è più
        // affidabile del CSS user-select da solo su questi WebView.
        row.addEventListener('selectstart', (ev) => ev.preventDefault());
        row.addEventListener('pointermove', (ev) => {
          if (!lpTimer) return;
          if (Math.abs(ev.clientX - startX) > LONG_PRESS_MOVE_TOLERANCE ||
              Math.abs(ev.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE) {
            clearLpTimer();
          }
        });
        row.addEventListener('pointerup', clearLpTimer);
        row.addEventListener('pointercancel', clearLpTimer);
        row.addEventListener('pointerleave', clearLpTimer);

        row.addEventListener('click', (ev) => {
          // Il long-press ha già aperto il popup di blocco: il click che
          // segue al rilascio del dito va ignorato, altrimenti si aprirebbe
          // anche l'articolo dietro al popup.
          if (longPressFired) {
            ev.preventDefault();
            ev.stopPropagation();
            longPressFired = false;
            return;
          }
          const url = row.dataset.rssUrl;
          if (!url) return;
          this._markVisited(url);
          const titleEl = row.querySelector('.rss-atitle');
          if (titleEl) titleEl.style.color = 'var(--disabled-text-color)';
          // Popup col riassunto invece dell'apertura immediata (disattivabile
          // con summary_popup: false). Il bottone "Apri articolo" del popup
          // porta poi alla pagina vera.
          if (this._config.summary_popup !== false) {
            const article = (this._articles || []).find(a => a.link === url);
            if (article) { this._openSummaryPopup(article); return; }
          }
          this._handleLinkClick(url);
        });
      });

    }

    // Ripristina lo scroll salvato SOLO alla primissima volta che arrivano
    // articoli veri in questa istanza: dopo un ricaricamento completo della
    // pagina la card riparte da zero (this._scrollRestored è di nuovo
    // false), ma se è solo un aggiornamento periodico dei dati non si vuole
    // riportare indietro lo scroll mentre l'utente sta leggendo altro più in
    // basso. requestAnimationFrame aspetta che il browser abbia calcolato
    // l'altezza reale della nuova lista prima di impostare scrollTop.
    if (!this._scrollRestored && filteredArticles.length > 0) {
      this._scrollRestored = true;
      const saved = this._loadPersistedState();
      // Posizione troppo vecchia (o senza data, come nelle versioni
      // precedenti): si ignora e si parte dall'inizio.
      const age = saved && typeof saved.scrollSavedAt === 'number' ? Date.now() - saved.scrollSavedAt : Infinity;
      const fresh = age >= 0 && age <= SCROLL_MEMORY_MAX_AGE_MS;
      const savedTop = fresh && typeof saved.scrollTop === 'number' ? saved.scrollTop : 0;
      const anchorLink = fresh ? saved.anchorLink : null;
      if (anchorLink || savedTop > 0) {
        requestAnimationFrame(() => {
          const el = this.querySelector('.rss-scroll');
          if (!el) return;
          // Prova prima a ritrovare la STESSA notizia (precisa anche se nel
          // frattempo ne sono arrivate di nuove più in alto); se non la trova
          // più (bloccata, o non ancora nella cache riletta), usa il pixel
          // salvato come ripiego, così non si perde comunque la posizione.
          if (!this._scrollToAnchor(el, anchorLink, saved.anchorOffset)) {
            el.scrollTop = savedTop;
          }
        });
      }
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
        this._trLoad();
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
        .rss-src-row input[type="color"]{width:36px!important;height:32px!important;padding:2px!important;flex-shrink:0!important;box-sizing:border-box;}
        .rss-add{margin-top:6px;padding:4px 12px;cursor:pointer;background:var(--primary-color);color:white;border:none;border-radius:4px;}
        .rss-del{padding:2px 8px;cursor:pointer;border:1px solid var(--divider-color);border-radius:4px;background:transparent;color:var(--primary-text-color);}
        .rss-save{padding:2px 8px;cursor:pointer;border:1px solid var(--primary-color);border-radius:4px;background:transparent;color:var(--primary-color);flex-shrink:0;}
        .rss-verify{padding:2px 8px;cursor:pointer;border:1px solid var(--divider-color);border-radius:4px;background:transparent;color:var(--primary-text-color);flex-shrink:0;}
        .rss-verify:disabled{opacity:0.5;cursor:default;}
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
            <input type="color" id="feed-new-color" value="#1a73e8" title="${t.ed.feed_color}" style="width:36px;height:32px;padding:2px;flex-shrink:0;"/>
            <button class="rss-verify" id="feed-new-verify" title="${t.ed.feed_verify}">🔍</button>
            <button class="rss-add" id="feed-new-add">${t.ed.feed_add}</button>
          </div>

          <label style="margin-top:14px;">${t.ed.opml_url}</label>
          <div class="rss-src-row" style="flex-wrap:wrap;">
            <input type="text" id="ed-opml-url" placeholder="https://github.com/…/feeds.opml" value="${(c.opml_url || '').replace(/"/g, '&quot;')}" style="flex:1 1 180px;min-width:0;"/>
            <button class="rss-add" id="ed-opml-open">${t.ed.opml_open}</button>
          </div>
          <div id="ed-opml-status" style="font-size:11px;opacity:0.7;margin-top:4px;">${t.ed.opml_hint}</div>

          <label style="margin-top:14px;">${t.ed.tr_provider}</label>
          <select id="ed-tr-provider" style="width:100%;">
            <option value="google">${t.ed.tr_google}</option>
            <option value="ollama">${t.ed.tr_ollama}</option>
          </select>
          <label id="ed-tr-fbo-row" style="display:flex;gap:8px;align-items:center;margin-top:8px;"><input type="checkbox" id="ed-tr-fallback-ollama"/> ${t.ed.tr_fallback_ollama}</label>
          <div id="ed-tr-ollama" hidden style="margin-top:8px;">
            <label>${t.ed.tr_host}</label>
            <div class="rss-src-row" style="flex-wrap:wrap;">
              <input type="text" id="ed-tr-host" placeholder="192.168.1.6" autocomplete="off" style="flex:1 1 150px;min-width:0;"/>
              <label style="flex:0 0 auto;margin:0;align-self:center;">${t.ed.tr_port}</label>
              <input type="number" id="ed-tr-port" value="11434" min="1" max="65535" style="flex:0 0 90px;min-width:0;"/>
            </div>
            <label style="margin-top:8px;">${t.ed.tr_model}</label>
            <div class="rss-src-row" style="flex-wrap:wrap;">
              <select id="ed-tr-model" style="flex:1 1 150px;min-width:0;"><option value=""></option></select>
              <button class="rss-add" id="ed-tr-check">${t.ed.tr_check}</button>
            </div>
            <label style="margin-top:8px;">${t.ed.tr_threads}</label>
            <div class="rss-src-row"><input type="number" id="ed-tr-threads" value="0" min="0" max="64" style="flex:0 0 90px;min-width:0;"/></div>
            <div style="font-size:11px;opacity:0.7;margin-top:4px;">${t.ed.tr_threads_hint}</div>
            <label id="ed-tr-fbg-row" style="display:flex;gap:8px;align-items:center;margin-top:8px;"><input type="checkbox" id="ed-tr-fallback"/> ${t.ed.tr_fallback}</label>
            <div class="rss-src-row" style="margin-top:8px;"><button class="rss-add" id="ed-tr-test">${t.ed.tr_test}</button></div>
            <div style="font-size:11px;opacity:0.7;margin-top:6px;">${t.ed.tr_hint}</div>
          </div>
          <div class="rss-src-row" style="margin-top:10px;"><button class="rss-add" id="ed-tr-save">${t.ed.tr_save}</button></div>
          <div id="ed-tr-status" style="font-size:11px;opacity:0.8;margin-top:6px;white-space:pre-wrap;"></div>
        </div>

        <label>${t.ed.card_height}</label>
        <input type="number" id="ed-height" min="100" max="2000" value="${c.card_height || 400}" ${c.auto_height ? 'disabled' : ''}/>

        <div class="rss-toggle-row">
          <label for="tog-auto-height">${t.ed.auto_height}</label>
          <label class="rss-toggle">
            <input type="checkbox" id="tog-auto-height" ${c.auto_height ? 'checked' : ''}/>
            <span class="rss-slider"></span>
          </label>
        </div>

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
          <div class="rss-toggle-row">
            <label for="tog-summary">${t.ed.summary_popup}</label>
            <label class="rss-toggle">
              <input type="checkbox" id="tog-summary" ${c.summary_popup !== false ? 'checked' : ''}/>
              <span class="rss-slider"></span>
            </label>
          </div>
        </div>
      </div>`;

    this._attachListeners();
    // Sync color previews after DOM is ready
    requestAnimationFrame(() => this._syncColorPreviews());
    this._loadFeedSources();
    this._trLoad();
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
    bind('#ed-height',   'card_height',     v => parseInt(v) || 400);
    const autoHeightChk = this.querySelector('#tog-auto-height');
    const heightInput = this.querySelector('#ed-height');
    if (autoHeightChk) {
      autoHeightChk.addEventListener('change', e => {
        this._upd('auto_height', e.target.checked);
        if (heightInput) heightInput.disabled = e.target.checked;
      });
    }
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
    bindChk('#tog-summary', 'summary_popup');

    bind('#ed-entity', 'entity');

    // ─ Fonti RSS lato server (config.php via sources_admin.php) ─
    const feedUrlEl = this.querySelector('#ed-feed-admin-url');
    const feedTokenEl = this.querySelector('#ed-feed-admin-token');
    if (feedUrlEl) {
      feedUrlEl.addEventListener('change', () => {
        this._upd('feed_admin_url', feedUrlEl.value.trim());
        this._loadFeedSources();
        this._trLoad();
      });
    }
    if (feedTokenEl) {
      feedTokenEl.addEventListener('change', () => {
        this._upd('feed_admin_token', feedTokenEl.value.trim());
        this._loadFeedSources();
        this._trLoad();
      });
    }

    const feedAddBtn = this.querySelector('#feed-new-add');
    if (feedAddBtn) {
      feedAddBtn.addEventListener('click', () => this._addFeedSource());
    }

    // Importazione da OPML: l'indirizzo si salva nella configurazione della
    // card; il bottone apre la pagina di scelta (opml_import.html).
    const opmlUrlEl = this.querySelector('#ed-opml-url');
    if (opmlUrlEl) {
      opmlUrlEl.addEventListener('change', () => this._upd('opml_url', opmlUrlEl.value.trim()));
    }
    // Dove tradurre: le impostazioni stanno sul server (translate_admin.php), perché a
    // tradurre sono gli script PHP; l'editor le legge e le salva da lì.
    const trProv = this.querySelector('#ed-tr-provider');
    if (trProv) trProv.addEventListener('change', () => this._trToggle());
    const trFbo = this.querySelector('#ed-tr-fallback-ollama');
    if (trFbo) trFbo.addEventListener('change', () => this._trToggle());
    const trBind = (id, fn) => { const el = this.querySelector(id); if (el) el.addEventListener('click', fn); };
    trBind('#ed-tr-check', () => this._trCheck());
    trBind('#ed-tr-test', () => this._trTest());
    trBind('#ed-tr-save', () => this._trSave());
    const opmlOpenBtn = this.querySelector('#ed-opml-open');
    if (opmlOpenBtn) {
      opmlOpenBtn.addEventListener('click', () => {
        // Vale anche se il campo "change" non è ancora scattato (clic subito dopo aver incollato).
        if (opmlUrlEl && opmlUrlEl.value.trim() !== (this._config.opml_url || '')) this._upd('opml_url', opmlUrlEl.value.trim());
        this._openOpmlImport();
      });
    }

    const feedNewVerifyBtn = this.querySelector('#feed-new-verify');
    if (feedNewVerifyBtn) {
      feedNewVerifyBtn.addEventListener('click', () => {
        const urlEl = this.querySelector('#feed-new-url');
        const nameEl = this.querySelector('#feed-new-name');
        this._verifyFeedUrl(feedNewVerifyBtn, urlEl ? urlEl.value.trim() : '', nameEl ? nameEl.value.trim() : '');
      });
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

  // ───────── Dove tradurre (Google / Ollama) ─────────
  _trUrl() {
    const full = this._feedAdminFullUrl();
    return full ? full.replace(new RegExp(FEED_ADMIN_FILENAME.replace('.', '\\.') + '$'), TRANSLATE_ADMIN_FILENAME) : '';
  }

  // Stesso schema di _feedApi: token sia nell'intestazione sia nell'indirizzo (alcuni proxy
  // non inoltrano le intestazioni personalizzate). Ritorna sempre il JSON, anche con ok:false.
  async _trApi(body, timeoutMs = 30000) {
    const base = this._trUrl();
    const token = (this._config.feed_admin_token || '').trim();
    if (!base || !token) throw new Error(this._t().ed.tr_need_token);
    const url = base + (base.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
    const opts = body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Token': token }, body: JSON.stringify(body) }
      : { method: 'GET', headers: { 'X-API-Token': token } };
    let res;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    if (ctrl) opts.signal = ctrl.signal;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      if (timer) clearTimeout(timer);
      if (e && e.name === 'AbortError') throw new Error(this._trFmt(this._t().ed.tr_timeout, { s: Math.round(timeoutMs / 1000) }));
      // "Failed to fetch" non dice nulla. Se il file manca, Apache risponde 404 senza le
      // intestazioni CORS e il browser lo nasconde proprio così: lo si spiega.
      const t = this._t().ed;
      if (typeof location !== 'undefined' && location.protocol === 'https:' && /^http:\/\//i.test(base)) throw new Error(t.tr_net_mixed);
      throw new Error(this._trFmt(t.tr_net, { file: TRANSLATE_ADMIN_FILENAME, url: base }));
    }
    if (timer) clearTimeout(timer);
    let data;
    try { data = await res.json(); } catch { throw new Error('HTTP ' + res.status + ' (' + TRANSLATE_ADMIN_FILENAME + '?)'); }
    if (res.status === 404) throw new Error(TRANSLATE_ADMIN_FILENAME + ': 404');
    if (res.status === 401) throw new Error('token');
    if (!data.ok && !data.error) throw new Error('HTTP ' + res.status);
    return data;
  }

  _trSay(text, isError = false) {
    const el = this.querySelector('#ed-tr-status');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = isError ? 'var(--error-color,#f44336)' : '';
  }

  _trFmt(tpl, vars) { return String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)); }
  _trTime(ts) { return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  // Con "Google" i campi di Ollama servono solo se Ollama è il suo ripiego; con "Ollama" servono sempre, e
  // c'è la scelta inversa (ripiegare su Google). I due interruttori non hanno senso insieme.
  _trToggle() {
    const prov = this.querySelector('#ed-tr-provider');
    const box = this.querySelector('#ed-tr-ollama');
    const fbo = this.querySelector('#ed-tr-fallback-ollama');
    const fboRow = this.querySelector('#ed-tr-fbo-row');
    const fbgRow = this.querySelector('#ed-tr-fbg-row');
    if (!prov || !box) return;
    const google = prov.value !== 'ollama';
    if (fboRow) fboRow.hidden = !google;
    if (fbgRow) fbgRow.hidden = google;
    box.hidden = google && !(fbo && fbo.checked);
  }

  // Riempie il menu dei modelli. Se il modello salvato non è nell'elenco lo si tiene comunque
  // (altrimenti un controllo a server spento lo cancellerebbe dalla scelta).
  _trFillModels(models, current) {
    const sel = this.querySelector('#ed-tr-model');
    if (!sel) return;
    const names = (models || []).map(m => m.name);
    if (current && !names.includes(current)) names.unshift(current);
    sel.innerHTML = '';
    if (!names.length) { sel.appendChild(new Option('', '')); return; }
    (models || []).forEach(m => {
      const extra = [m.params, m.size_mb ? Math.round(m.size_mb / 100) / 10 + ' GB' : ''].filter(Boolean).join(', ');
      sel.appendChild(new Option(m.name + (extra ? ' (' + extra + ')' : ''), m.name));
    });
    if (current && !(models || []).some(m => m.name === current)) sel.insertBefore(new Option(current, current), sel.firstChild);
    sel.value = current && names.includes(current) ? current : names[0];
  }

  async _trLoad() {
    const t = this._t().ed;
    if (!this.querySelector('#ed-tr-provider')) return;
    if (!(this._config.feed_admin_token || '').trim() || !this._trUrl()) { this._trSay(t.tr_need_token); return; }
    this._trSay(t.tr_loading);
    try {
      const d = await this._trApi();
      // Una risposta "ok:false" (es. manca lib/translate_cache.php) non deve azzerare i campi.
      if (!d.ok) { this._trSay(this._trFmt(t.tr_err, { msg: d.error }), true); return; }
      const st = d.settings || {};
      const o = st.ollama || {};
      const set = (id, v) => { const el = this.querySelector(id); if (el) el.value = v; };
      set('#ed-tr-provider', st.provider || 'google');
      set('#ed-tr-host', o.host || '');
      set('#ed-tr-port', o.port || 11434);
      set('#ed-tr-threads', o.threads || 0);
      const fb = this.querySelector('#ed-tr-fallback'); if (fb) fb.checked = !!o.fallback_google;
      const fbo = this.querySelector('#ed-tr-fallback-ollama'); if (fbo) fbo.checked = !!o.fallback_ollama;
      this._trFillModels([], o.model || '');
      this._trToggle();
      const s = d.status || {};
      const lines = [];
      if (s.google) {
        lines.push(s.google.cooldown_until
          ? this._trFmt(t.tr_g_pause, { time: this._trTime(s.google.cooldown_until), code: s.google.last_code || 429 })
          : this._trFmt(t.tr_g_ok, { n: s.google.hour_calls, max: s.google.hourly_budget }));
      }
      if (s.ollama && s.ollama.last_ok) lines.push(this._trFmt(t.tr_o_last, { time: this._trTime(s.ollama.last_ok), s: Math.round(s.ollama.last_ms / 100) / 10, model: s.ollama.last_model }));
      if (s.ollama && s.ollama.last_error && s.ollama.last_error_at) lines.push(this._trFmt(t.tr_o_err, { time: this._trTime(s.ollama.last_error_at), msg: s.ollama.last_error }));
      if (s.cache_entries) lines.push(this._trFmt(t.tr_cache, { n: s.cache_entries }));
      this._trSay(lines.join('\n'));
    } catch (e) {
      this._trSay(this._trFmt(t.tr_err, { msg: e.message }), true);
    }
  }

  _trForm() {
    const v = (id) => { const el = this.querySelector(id); return el ? el.value.trim() : ''; };
    return {
      provider: v('#ed-tr-provider') || 'google',
      host: v('#ed-tr-host'), port: v('#ed-tr-port'), model: v('#ed-tr-model'), threads: v('#ed-tr-threads') || '0',
      fallback_google: !!(this.querySelector('#ed-tr-fallback') || {}).checked,
      fallback_ollama: !!(this.querySelector('#ed-tr-fallback-ollama') || {}).checked,
    };
  }

  async _trCheck() {
    const t = this._t().ed; const f = this._trForm();
    this._trSay(t.tr_checking);
    try {
      const d = await this._trApi({ action: 'models', host: f.host, port: f.port });
      if (!d.ok) { this._trSay(this._trFmt(t.tr_err, { msg: d.error }), true); return; }
      this._trFillModels(d.models, f.model);
      this._trSay(d.models.length ? this._trFmt(t.tr_models_ok, { n: d.models.length, v: d.ollama_version || '?' }) : t.tr_models_none, !d.models.length);
    } catch (e) { this._trSay(this._trFmt(t.tr_err, { msg: e.message }), true); }
  }

  async _trTest() {
    const t = this._t().ed; const f = this._trForm();
    if (!f.model) { this._trSay(t.tr_pick_model, true); return; }
    // Un modello locale può metterci a lungo (soprattutto la prima volta, quando si carica in
    // memoria): si mostra il tempo che passa, così si capisce che sta lavorando.
    const t0 = Date.now();
    const tick = () => {
      const sec = Math.round((Date.now() - t0) / 1000);
      this._trSay(this._trFmt(t.tr_testing_s, { s: sec }) + (sec >= 5 ? '\n' + t.tr_testing_hint : ''));
    };
    tick();
    const timer = setInterval(tick, 1000);
    try {
      const d = await this._trApi({ action: 'test', host: f.host, port: f.port, model: f.model, threads: f.threads }, this._trTestTimeoutMs || 120000);
      clearInterval(timer);
      if (!d.ok) {
        // Se Ollama non ha risposto in tempo il server dice se il modello è in memoria o no.
        const hint = d.loaded === true ? '\n' + t.tr_loaded_yes : (d.loaded === false ? '\n' + t.tr_loaded_no : '');
        this._trSay(this._trFmt(t.tr_err, { msg: d.error }) + hint, true);
        return;
      }
      // Quanto è andato a caricare il modello e a che velocità genera: serve a scegliere il modello.
      const r1 = (ms) => Math.round(ms / 100) / 10;
      const stats = (d.load_ms != null && d.tokens_per_s != null)
        ? (d.prompt_ms != null
          ? this._trFmt(t.tr_stats2, { load: r1(d.load_ms), prompt: r1(d.prompt_ms), tps: d.tokens_per_s })
          : this._trFmt(t.tr_stats, { load: r1(d.load_ms), tps: d.tokens_per_s })) : '';
      this._trSay(this._trFmt(t.tr_test_ok, { s: Math.round(d.ms / 100) / 10, text: d.translation }) + stats);
    } catch (e) { clearInterval(timer); this._trSay(this._trFmt(t.tr_err, { msg: e.message }), true); }
  }

  async _trSave() {
    const t = this._t().ed; const f = this._trForm();
    try {
      const d = await this._trApi({ action: 'save', provider: f.provider, ollama: { host: f.host, port: f.port, model: f.model, fallback_google: f.fallback_google, fallback_ollama: f.fallback_ollama, threads: f.threads } });
      if (!d.ok) { this._trSay(this._trFmt(t.tr_err, { msg: d.error }), true); return; }
      this._trSay(t.tr_saved);
    } catch (e) { this._trSay(this._trFmt(t.tr_err, { msg: e.message }), true); }
  }

  // Indirizzo della pagina di scelta: stessa cartella di sources_admin.php.
  // Token e indirizzo OPML viaggiano nella parte dopo "#": il browser non la
  // invia mai al server, quindi non finisce nei log di Apache né in nessun
  // "Referer". La pagina poi la toglie dall'indirizzo visibile.
  _opmlImportPageUrl() {
    const full = this._feedAdminFullUrl();
    if (!full) return '';
    const page = full.replace(new RegExp(FEED_ADMIN_FILENAME.replace('.', '\\.') + '$'), OPML_IMPORT_PAGE);
    const params = new URLSearchParams();
    const token = (this._config.feed_admin_token || '').trim();
    const opml = (this._config.opml_url || '').trim();
    if (token) params.set('token', token);
    if (opml) params.set('opml', opml);
    params.set('lang', this._getLang());
    return page + '#' + params.toString();
  }

  _openOpmlImport() {
    const status = this.querySelector('#ed-opml-status');
    const t = this._t();
    const token = (this._config.feed_admin_token || '').trim();
    if (!token) {
      if (status) { status.textContent = t.ed.opml_need_token; status.style.color = 'var(--error-color,#f44336)'; status.style.opacity = '1'; }
      return false;
    }
    if (status) { status.textContent = t.ed.opml_hint; status.style.color = ''; status.style.opacity = '0.7'; }
    const url = this._opmlImportPageUrl();
    if (!url) return false;
    // Nell'app Android si usa il browser dell'app, come per gli articoli.
    if (window.externalApp?.openExternalUrl) { window.externalApp.openExternalUrl(url); return true; }
    window.open(url, '_blank', 'noopener');
    return true;
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
        <input type="color" data-field="color" value="${(f.color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(f.color)) ? f.color : '#1a73e8'}" title="${t.ed.feed_color}" style="width:36px;height:32px;padding:2px;flex-shrink:0;"/>
        <button class="rss-verify" data-feed-id="${f.id}" title="${t.ed.feed_verify}">🔍</button>
        <button class="rss-save" data-feed-id="${f.id}">💾</button>
        <button class="rss-del" data-feed-id="${f.id}">✕</button>
      </div>`).join('');

    container.querySelectorAll('.rss-verify').forEach(btn => {
      btn.addEventListener('click', () => this._verifyFeedRow(btn, btn.closest('.rss-src-row')));
    });
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
      color: row.querySelector('[data-field="color"]').value.trim(),
    };
  }

  // Legge l'URL (e il nome, per il titolo del popup) DIRETTAMENTE dai campi
  // della riga (non dal server): così "Verifica" testa quello che l'utente
  // ha scritto in QUESTO momento, anche se non ha ancora premuto 💾 salva.
  _verifyFeedRow(btn, row) {
    const urlEl = row ? row.querySelector('[data-field="url"]') : null;
    const nameEl = row ? row.querySelector('[data-field="name"]') : null;
    this._verifyFeedUrl(btn, urlEl ? urlEl.value.trim() : '', nameEl ? nameEl.value.trim() : '');
  }

  async _verifyFeedUrl(btn, url, name) {
    const t = this._t();
    if (!url) {
      this._showVerifyPopup(name, `<div class="rss-verify-error">${t.ed.feed_verify_no_url}</div>`);
      return;
    }
    const base = this._feedAdminFullUrl();
    if (!base) {
      this._showVerifyPopup(name, `<div class="rss-verify-error">${t.ed.feed_set_url_first}</div>`);
      return;
    }
    // test_feed.php sta sempre accanto a sources_admin.php sullo stesso
    // server: riusiamo la stessa base URL, sostituendo solo il nome file.
    const testUrl = base.replace(new RegExp(FEED_ADMIN_FILENAME.replace('.', '\\.') + '$'), 'test_feed.php');
    const token = (this._config.feed_admin_token || '').trim();

    const origLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';
    try {
      const res = await fetch(
        testUrl + (testUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token) + '&url=' + encodeURIComponent(url),
        { headers: { 'X-API-Token': token } }
      );
      let data;
      try { data = await res.json(); } catch { throw new Error('Risposta non JSON dal server (' + res.status + ')'); }
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));

      const itemsHtml = (data.sample_items || []).map(it => `
        <div class="rss-verify-item">
          <div class="rss-verify-item-title">${(it.title || '').replace(/</g, '&lt;')}</div>
          ${it.pubDate ? `<div class="rss-verify-item-date">${this._formatVerifyDate(it.pubDate)}</div>` : ''}
        </div>`).join('');

      const summary = t.ed.feed_verify_ok
        .replace('{n}', data.items_found)
        .replace('{format}', data.format);

      this._showVerifyPopup(name, `
        <div class="rss-verify-summary">${summary}</div>
        ${itemsHtml}
      `);
    } catch (e) {
      this._showVerifyPopup(name, `<div class="rss-verify-error">${t.ed.feed_verify_error}: ${e.message}</div>`);
    } finally {
      btn.disabled = false;
      btn.textContent = origLabel;
    }
  }

  // Formattazione data leggera, indipendente da RssNewsCard (l'editor gira
  // in una classe separata e non ha accesso a _formatDate/_getDateLocale).
  _formatVerifyDate(pubDate) {
    try {
      const d = new Date(pubDate);
      if (isNaN(d.getTime())) return pubDate;
      return d.toLocaleString(undefined, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return pubDate; }
  }

  // Popup personalizzato al posto di alert(): il titolo è il NOME della
  // fonte (non l'indirizzo/host della pagina, che è quello che il dialogo
  // nativo del browser mostrerebbe automaticamente).
  //
  // Usiamo un <dialog> nativo con showModal() invece di un semplice div con
  // z-index alto: il dialog di modifica di Home Assistant è anch'esso un
  // <dialog> nativo (o equivalente), che vive nel "top layer" del browser —
  // uno strato SOPRA qualunque z-index, per quanto alto. Un div normale,
  // per quanto z-index:2147483647, non può mai comparire sopra un elemento
  // nel top layer. Un <dialog> aperto con showModal() invece entra anche
  // lui nel top layer, e l'ultimo aperto vince (appare sopra i precedenti),
  // quindi il nostro popup risulterà sempre sopra quello di HA.
  _showVerifyPopup(name, bodyHtml) {
    const existing = document.querySelector('.rss-verify-popup-dialog');
    if (existing) existing.remove();

    const t = this._t();
    const dialog = document.createElement('dialog');
    dialog.className = 'rss-verify-popup-dialog';
    dialog.innerHTML = `
      <style>
        .rss-verify-popup-dialog{border:none;border-radius:8px;padding:0;max-width:420px;width:calc(100vw - 32px);max-height:80vh;background:var(--card-background-color,#1c1c1c);color:var(--primary-text-color,#fff);box-shadow:0 4px 24px rgba(0,0,0,0.4);}
        .rss-verify-popup-dialog::backdrop{background:rgba(0,0,0,0.5);}
        .rss-verify-popup-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--divider-color,#333);}
        .rss-verify-popup-header h3{margin:0;font-size:16px;font-weight:600;}
        .rss-verify-popup-close{background:none;border:none;color:inherit;font-size:20px;cursor:pointer;line-height:1;opacity:0.7;padding:0 4px;}
        .rss-verify-popup-close:hover{opacity:1;}
        .rss-verify-popup-body{padding:14px 16px;overflow-y:auto;max-height:calc(80vh - 50px);}
        .rss-verify-summary{font-size:14px;font-weight:600;margin-bottom:10px;}
        .rss-verify-item{padding:8px 0;border-top:1px solid var(--divider-color,#333);}
        .rss-verify-item:first-of-type{border-top:none;}
        .rss-verify-item-title{font-size:13px;line-height:1.4;}
        .rss-verify-item-date{font-size:11px;opacity:0.65;margin-top:2px;}
        .rss-verify-error{font-size:14px;color:var(--error-color,#f44336);}
      </style>
      <div class="rss-verify-popup-header">
        <h3>${(name && name.trim()) ? name.trim().replace(/</g, '&lt;') : t.ed.feed_verify}</h3>
        <button class="rss-verify-popup-close">✕</button>
      </div>
      <div class="rss-verify-popup-body">${bodyHtml}</div>
    `;
    // Click sul backdrop (fuori dal riquadro, ma dentro il <dialog>) -> chiudi.
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.querySelector('.rss-verify-popup-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());

    document.body.appendChild(dialog);
    dialog.showModal();
  }

  async _addFeedSource() {
    const name = this.querySelector('#feed-new-name');
    const url = this.querySelector('#feed-new-url');
    const type = this.querySelector('#feed-new-type');
    const color = this.querySelector('#feed-new-color');
    const source = {
      name: name.value.trim(),
      url: url.value.trim(),
      type: type.value,
      color: color.value.trim(),
    };
    try {
      await this._feedApi({ action: 'add', source });
      name.value = ''; url.value = ''; type.value = 'standard'; color.value = '#1a73e8';
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
    set('#ed-height',    c.card_height);
    set('#ed-titlesize', c.title_font_size);
    set('#ed-descsize',  c.desc_font_size);
    set('#ed-card-title-color-text',    c.card_title_color);
    set('#ed-article-title-color-text', c.article_title_color);
    set('#ed-desc-color-text',          c.desc_color);
    set('#ed-feed-admin-url',           c.feed_admin_url);
    set('#ed-feed-admin-token',         c.feed_admin_token);
    set('#ed-opml-url',                 c.opml_url);
    setChk('#tog-source', c.show_source !== false);
    setChk('#tog-date',   c.show_date !== false);
    setChk('#tog-desc',   c.show_description !== false);
    setChk('#tog-original', c.show_original !== false);
    setChk('#tog-summary', c.summary_popup !== false);
    setChk('#tog-auto-height', c.auto_height === true);
    const heightInput = this.querySelector('#ed-height');
    if (heightInput) heightInput.disabled = c.auto_height === true;
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
