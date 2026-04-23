---
read_when:
    - Aggiungere automazione del browser controllata dall'agente
    - Debug del motivo per cui openclaw interferisce con il tuo Chrome
    - Implementare impostazioni + ciclo di vita del browser nell'app macOS
summary: Servizio integrato di controllo del browser + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-04-23T08:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser (gestito da openclaw)

OpenClaw può eseguire un **profilo dedicato Chrome/Brave/Edge/Chromium** controllato dall'agente.
È isolato dal tuo browser personale ed è gestito tramite un piccolo
servizio di controllo locale dentro il Gateway (solo loopback).

Vista per principianti:

- Pensalo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il profilo del tuo browser personale.
- L'agente può **aprire schede, leggere pagine, cliccare e digitare** in una corsia sicura.
- Il profilo integrato `user` si collega alla tua vera sessione Chrome autenticata tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenco/apri/focalizza/chiudi).
- Azioni dell'agente (clic/digita/trascina/seleziona), snapshot, screenshot, PDF.
- Supporto opzionale multi-profilo (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo browser quotidiano. È una superficie sicura e isolata per
automazione e verifica da parte dell'agente.

## Avvio rapido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se ricevi “Browser disabled”, abilitalo nella configurazione (vedi sotto) e riavvia il
Gateway.

Se `openclaw browser` manca del tutto, oppure l'agente dice che lo strumento browser
non è disponibile, vai a [Comando browser o strumento mancante](/it/tools/browser#missing-browser-command-or-tool).

## Controllo del plugin

Lo strumento `browser` predefinito ora è un plugin incluso distribuito abilitato per
impostazione predefinita. Questo significa che puoi disabilitarlo o sostituirlo senza rimuovere il resto del
sistema plugin di OpenClaw:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Disabilita il plugin incluso prima di installare un altro plugin che fornisce lo
stesso nome di strumento `browser`. L'esperienza browser predefinita richiede entrambi:

- `plugins.entries.browser.enabled` non disabilitato
- `browser.enabled=true`

Se disattivi solo il plugin, la CLI browser inclusa (`openclaw browser`),
il metodo gateway (`browser.request`), lo strumento dell'agente e il servizio predefinito di controllo browser
scompaiono tutti insieme. La tua configurazione `browser.*` resta intatta per poter essere riutilizzata da
un plugin sostitutivo.

Il plugin browser incluso ora possiede anche l'implementazione runtime del browser.
Il core mantiene solo helper condivisi del Plugin SDK più riesportazioni di compatibilità per
vecchi percorsi di import interni. In pratica, rimuovere o sostituire il package del plugin
browser rimuove il set di funzionalità del browser invece di lasciare dietro un secondo
runtime posseduto dal core.

Le modifiche di configurazione del browser richiedono comunque un riavvio del Gateway così il plugin incluso
può registrare di nuovo il proprio servizio browser con le nuove impostazioni.

## Comando browser o strumento mancante

Se `openclaw browser` diventa improvvisamente un comando sconosciuto dopo un aggiornamento, oppure
l'agente segnala che lo strumento browser manca, la causa più comune è una
allowlist restrittiva `plugins.allow` che non include `browser`.

Esempio di configurazione non corretta:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Correggila aggiungendo `browser` alla allowlist dei plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Note importanti:

- `browser.enabled=true` da solo non basta quando `plugins.allow` è impostato.
- Anche `plugins.entries.browser.enabled=true` da solo non basta quando `plugins.allow` è impostato.
- `tools.alsoAllow: ["browser"]` **non** carica il plugin browser incluso. Regola solo la policy degli strumenti dopo che il plugin è già stato caricato.
- Se non ti serve una allowlist restrittiva dei plugin, rimuovere `plugins.allow` ripristina anche il comportamento predefinito del browser incluso.

Sintomi tipici:

- `openclaw browser` è un comando sconosciuto.
- `browser.request` manca.
- L'agente segnala che lo strumento browser non è disponibile o manca.

## Profili: `openclaw` vs `user`

- `openclaw`: browser gestito e isolato (nessuna extension richiesta).
- `user`: profilo integrato di collegamento Chrome MCP alla tua **vera sessione Chrome autenticata**.

Per le chiamate dello strumento browser dell'agente:

- Predefinito: usa il browser isolato `openclaw`.
- Preferisci `profile="user"` quando contano sessioni già autenticate e l'utente
  è al computer per cliccare/approvare eventuali prompt di collegamento.
- `profile` è l'override esplicito quando vuoi una modalità browser specifica.

Imposta `browser.defaultProfile: "openclaw"` se vuoi la modalità gestita come predefinita.

## Configurazione

Le impostazioni del browser si trovano in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Note:

- Il servizio di controllo browser si collega a loopback su una porta derivata da `gateway.port`
  (predefinita: `18791`, cioè gateway + 2).
- Se sovrascrivi la porta del Gateway (`gateway.port` oppure `OPENCLAW_GATEWAY_PORT`),
  le porte browser derivate si spostano per restare nella stessa “famiglia”.
- `cdpUrl` usa come predefinito la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità CDP remoti (non-loopback).
- `remoteCdpHandshakeTimeoutMs` si applica ai controlli di raggiungibilità dell'handshake WebSocket CDP remoto.
- La navigazione/apertura di schede del browser è protetta da SSRF prima della navigazione e ricontrollata in modalità best-effort sull'URL finale `http(s)` dopo la navigazione.
- In modalità SSRF rigorosa, vengono controllati anche rilevamento/probe degli endpoint CDP remoti (`cdpUrl`, incluse le ricerche `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato per impostazione predefinita. Impostalo su `true` solo quando ti fidi intenzionalmente dell'accesso browser alla rete privata.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy per compatibilità.
- `attachOnly: true` significa “non avviare mai un browser locale; collegati solo se è già in esecuzione”.
- `color` + `color` per profilo colorano la UI del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (browser standalone gestito da OpenClaw). Usa `defaultProfile: "user"` per scegliere il browser dell'utente autenticato.
- Ordine di rilevamento automatico: browser predefinito del sistema se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- I profili locali `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl` — impostali solo per CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP invece del CDP raw. Non
  impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo existing-session
  deve collegarsi a un profilo utente Chromium non predefinito come Brave o Edge.

## Usa Brave (o un altro browser basato su Chromium)

Se il tuo browser **predefinito di sistema** è basato su Chromium (Chrome/Brave/Edge/ecc),
OpenClaw lo usa automaticamente. Imposta `browser.executablePath` per sovrascrivere
il rilevamento automatico:

Esempio CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Controllo locale vs remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo loopback e può avviare un browser locale.
- **Controllo remoto (host node):** esegui un host node sulla macchina che ha il browser; il Gateway inoltra a esso le azioni browser.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (oppure `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non avvierà un browser locale.

Il comportamento di arresto varia in base alla modalità del profilo:

- profili gestiti locali: `openclaw browser stop` arresta il processo browser che
  OpenClaw ha avviato
- profili attach-only e profili CDP remoti: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia gli override di emulazione Playwright/CDP (viewport,
  schema colore, locale, fuso orario, modalità offline e stato simile), anche
  se nessun processo browser è stato avviato da OpenClaw

Gli URL CDP remoti possono includere autenticazione:

- Token in query (per esempio `https://provider.example?token=<token>`)
- HTTP Basic auth (per esempio `https://user:pass@provider.example`)

OpenClaw preserva l'auth quando chiama endpoint `/json/*` e quando si connette
al WebSocket CDP. Preferisci variabili d'ambiente o secret manager per i
token invece di committarli nei file di configurazione.

## Proxy browser del node (predefinito zero-config)

Se esegui un **host node** sulla macchina che ha il tuo browser, OpenClaw può
instradare automaticamente le chiamate dello strumento browser a quel node senza alcuna configurazione browser extra.
Questo è il percorso predefinito per i gateway remoti.

Note:

- L'host node espone il proprio server locale di controllo browser tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del node stesso (come in locale).
- `nodeHost.browserProxy.allowProfiles` è opzionale. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati restano raggiungibili tramite il proxy, incluse le route di creazione/eliminazione dei profili.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come un confine di privilegi minimi: possono essere mirati solo i profili in allowlist e le route persistenti di creazione/eliminazione profili vengono bloccate sulla superficie proxy.
- Disabilitalo se non lo vuoi:
  - Sul node: `nodeHost.browserProxy.enabled=false`
  - Sul gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto ospitato)

[Browserless](https://browserless.io) è un servizio Chromium ospitato che espone
URL di connessione CDP tramite HTTPS e WebSocket. OpenClaw può usare entrambe le forme, ma
per un profilo browser remoto l'opzione più semplice è l'URL WebSocket diretto
dalla documentazione di connessione di Browserless.

Esempio:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Note:

- Sostituisci `<BROWSERLESS_API_KEY>` con il tuo vero token Browserless.
- Scegli l'endpoint regionale che corrisponde al tuo account Browserless (vedi la loro documentazione).
- Se Browserless ti fornisce un URL base HTTPS, puoi convertirlo in
  `wss://` per una connessione CDP diretta oppure mantenere l'URL HTTPS e lasciare che OpenClaw
  rilevi `/json/version`.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket** diretto invece di
usare il rilevamento CDP standard basato su HTTP (`/json/version`). OpenClaw accetta tre
forme di URL CDP e seleziona automaticamente la strategia di connessione corretta:

- **Rilevamento HTTP(S)** — `http://host[:port]` oppure `https://host[:port]`.
  OpenClaw chiama `/json/version` per rilevare l'URL WebSocket del debugger, poi
  si connette. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** — `ws://host[:port]/devtools/<kind>/<id>` oppure
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si connette direttamente tramite handshake WebSocket e salta
  completamente `/json/version`.
- **Root WebSocket bare** — `ws://host[:port]` oppure `wss://host[:port]` senza
  percorso `/devtools/...` (per esempio [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw prova prima il
  rilevamento HTTP `/json/version` (normalizzando lo schema in `http`/`https`);
  se il rilevamento restituisce un `webSocketDebuggerUrl`, viene usato, altrimenti OpenClaw
  ricade su un handshake WebSocket diretto alla root bare. Questo copre
  sia le porte di debug remoto in stile Chrome sia i provider solo WebSocket.

Un semplice `ws://host:port` / `wss://host:port` senza un percorso `/devtools/...`
puntato a un'istanza Chrome locale è supportato tramite il fallback
discovery-first — Chrome accetta upgrade WebSocket solo sul percorso specifico per-browser
o per-target restituito da `/json/version`, quindi un handshake alla root bare da solo
fallirebbe.

### Browserbase

[Browserbase](https://www.browserbase.com) è una piattaforma cloud per eseguire
browser headless con risoluzione CAPTCHA integrata, modalità stealth e proxy
residenziali.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Note:

- [Registrati](https://www.browserbase.com/sign-up) e copia la tua **API Key**
  dalla [dashboard Overview](https://www.browserbase.com/overview).
- Sostituisci `<BROWSERBASE_API_KEY>` con la tua vera chiave API Browserbase.
- Browserbase crea automaticamente una sessione browser alla connessione WebSocket, quindi non
  è necessario alcun passaggio manuale di creazione sessione.
- Il piano gratuito consente una sessione concorrente e un'ora browser al mese.
  Vedi i [prezzi](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Vedi la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento API
  completo, le guide SDK e gli esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo browser è solo loopback; l'accesso passa tramite auth del Gateway o pairing del node.
- L'API HTTP browser standalone su loopback usa **solo autenticazione con shared secret**:
  bearer auth del token gateway, `x-openclaw-password` o HTTP Basic auth con la
  password gateway configurata.
- Gli header di identità Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` non
  autenticano questa API browser standalone su loopback.
- Se il controllo browser è abilitato e non è configurata alcuna auth con shared secret, OpenClaw
  genera automaticamente `gateway.auth.token` all'avvio e lo persiste nella configurazione.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è
  già `password`, `none` oppure `trusted-proxy`.
- Mantieni il Gateway e qualsiasi host node su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta gli URL/token CDP remoti come segreti; preferisci variabili d'ambiente o un secret manager.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token a breve durata quando possibile.
- Evita di incorporare direttamente token a lunga durata nei file di configurazione.

## Profili (multi-browser)

OpenClaw supporta più profili nominati (configurazioni di routing). I profili possono essere:

- **gestiti da openclaw**: un'istanza dedicata di browser basato su Chromium con propria directory user data + porta CDP
- **remoti**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite auto-connect Chrome DevTools MCP

Valori predefiniti:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per il collegamento existing-session di Chrome MCP.
- I profili existing-session sono opt-in oltre a `user`; creali con `--driver existing-session`.
- Le porte CDP locali vengono allocate da **18800–18899** per impostazione predefinita.
- L'eliminazione di un profilo sposta la sua directory dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Existing-session tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium già in esecuzione tramite il
server MCP ufficiale di Chrome DevTools. Questo riutilizza le schede e lo stato di login
già aperti in quel profilo browser.

Riferimenti ufficiali di background e setup:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Opzionale: crea un tuo profilo existing-session personalizzato se vuoi un
nome, colore o directory dati del browser diversi.

Comportamento predefinito:

- Il profilo integrato `user` usa auto-connect di Chrome MCP, che punta al
  profilo locale predefinito di Google Chrome.

Usa `userDataDir` per Brave, Edge, Chromium o un profilo Chrome non predefinito:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Poi, nel browser corrispondente:

1. Apri la pagina inspect di quel browser per il debug remoto.
2. Abilita il debug remoto.
3. Mantieni il browser in esecuzione e approva il prompt di connessione quando OpenClaw si collega.

Pagine inspect comuni:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test di collegamento live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Come appare il successo:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` elenca le schede del browser che hai già aperto
- `snapshot` restituisce ref dalla scheda live selezionata

Cosa controllare se il collegamento non funziona:

- il browser target basato su Chromium è versione `144+`
- il debug remoto è abilitato nella pagina inspect di quel browser
- il browser ha mostrato e tu hai accettato il prompt di consenso al collegamento
- `openclaw doctor` migra la vecchia configurazione browser basata su extension e controlla che
  Chrome sia installato localmente per i profili predefiniti auto-connect, ma non può
  abilitare per te il debug remoto lato browser

Uso da parte dell'agente:

- Usa `profile="user"` quando hai bisogno dello stato del browser autenticato dell'utente.
- Se usi un profilo existing-session personalizzato, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare il
  prompt di collegamento.
- il Gateway o l'host node possono avviare `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso del profilo isolato `openclaw` perché può
  agire dentro la tua sessione browser autenticata.
- OpenClaw non avvia il browser per questo driver; si collega solo a una
  sessione esistente.
- OpenClaw usa qui il flusso ufficiale Chrome DevTools MCP `--autoConnect`. Se
  `userDataDir` è impostato, OpenClaw lo passa per puntare a quella esplicita
  directory dati utente Chromium.
- Gli screenshot in existing-session supportano catture di pagina e catture di elementi `--ref`
  dagli snapshot, ma non i selettori CSS `--element`.
- Gli screenshot di pagina in existing-session funzionano senza Playwright tramite Chrome MCP.
  Anche gli screenshot di elementi basati su ref (`--ref`) funzionano lì, ma `--full-page`
  non può essere combinato con `--ref` o `--element`.
- Le azioni existing-session sono ancora più limitate rispetto al percorso
  del browser gestito:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono
    ref di snapshot invece di selettori CSS
  - `click` è solo tasto sinistro (nessun override del tasto o modificatori)
  - `type` non supporta `slowly=true`; usa `fill` o `press`
  - `press` non supporta `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ed `evaluate` non
    supportano override di timeout per chiamata
  - `select` al momento supporta solo un singolo valore
- Existing-session `wait --url` supporta pattern esatti, substring e glob
  come gli altri driver browser. `wait --load networkidle` non è ancora supportato.
- Gli hook di upload in existing-session richiedono `ref` oppure `inputRef`, supportano un solo file per volta e non supportano targeting CSS `element`.
- Gli hook di dialogo in existing-session non supportano override del timeout.
- Alcune funzionalità richiedono ancora il percorso browser gestito, incluse
  azioni batch, esportazione PDF, intercettazione download e `responsebody`.
- Existing-session può collegarsi sull'host selezionato o tramite un browser node connesso. Se Chrome si trova altrove e non è connesso alcun browser node, usa invece CDP remoto o un host node.

## Garanzie di isolamento

- **Directory user data dedicata**: non tocca mai il profilo del tuo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con flussi di lavoro di sviluppo.
- **Controllo deterministico delle schede**: punta alle schede tramite `targetId`, non tramite “ultima scheda”.

## Selezione del browser

Quando avvia localmente, OpenClaw sceglie il primo disponibile:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puoi sovrascrivere con `browser.executablePath`.

Piattaforme:

- macOS: controlla `/Applications` e `~/Applications`.
- Linux: cerca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, ecc.
- Windows: controlla le posizioni di installazione comuni.

## API di controllo (opzionale)

Solo per integrazioni locali, il Gateway espone una piccola API HTTP su loopback:

- Stato/start/stop: `GET /`, `POST /start`, `POST /stop`
- Schede: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Azioni: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Download: `POST /download`, `POST /wait/download`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rete: `POST /response/body`
- Stato: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stato: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Impostazioni: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tutti gli endpoint accettano `?profile=<name>`.

Se è configurata auth gateway con shared secret, anche le route HTTP del browser richiedono auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oppure HTTP Basic auth con quella password

Note:

- Questa API browser standalone su loopback **non** consuma trusted-proxy né
  header di identità Tailscale Serve.
- Se `gateway.auth.mode` è `none` oppure `trusted-proxy`, queste route browser su loopback
  non ereditano quelle modalità che portano identità; mantienile solo su loopback.

### Contratto di errore `/act`

`POST /act` usa una risposta di errore strutturata per validazione a livello route e
errori di policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori `code` attuali:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` manca o non è riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): il payload dell'azione ha fallito normalizzazione o validazione.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): è stato usato `selector` con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oppure `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` top-level o batch è in conflitto con la destinazione della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per profili existing-session.

Altri errori runtime possono ancora restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito Playwright

Alcune funzionalità (navigate/act/AI snapshot/role snapshot, screenshot di elementi,
PDF) richiedono Playwright. Se Playwright non è installato, quegli endpoint restituiscono un chiaro errore 501.

Cosa continua a funzionare senza Playwright:

- Snapshot ARIA
- Screenshot di pagina per il browser gestito `openclaw` quando è disponibile un WebSocket
  CDP per scheda
- Screenshot di pagina per profili `existing-session` / Chrome MCP
- Screenshot basati su ref (`--ref`) in `existing-session` dall'output dello snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot di elementi con selettore CSS (`--element`)
- Esportazione PDF completa del browser

Gli screenshot di elementi rifiutano anche `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, ripara le dipendenze runtime
del plugin browser incluso così `playwright-core` venga installato,
poi riavvia il gateway. Per installazioni pacchettizzate, esegui `openclaw doctor --fix`.
Per Docker, installa anche i binari del browser Chromium come mostrato sotto.

#### Installazione Docker di Playwright

Se il tuo Gateway gira in Docker, evita `npx playwright` (conflitti di override npm).
Usa invece la CLI inclusa:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download del browser, imposta `PLAYWRIGHT_BROWSERS_PATH` (per esempio,
`/home/node/.cache/ms-playwright`) e assicurati che `/home/node` sia persistente tramite
`OPENCLAW_HOME_VOLUME` o un bind mount. Vedi [Docker](/it/install/docker).

## Come funziona (internamente)

Flusso di alto livello:

- Un piccolo **server di controllo** accetta richieste HTTP.
- Si connette a browser basati su Chromium (Chrome/Brave/Edge/Chromium) tramite **CDP**.
- Per azioni avanzate (click/type/snapshot/PDF), usa **Playwright** sopra
  CDP.
- Quando Playwright manca, sono disponibili solo operazioni non basate su Playwright.

Questo design mantiene l'agente su un'interfaccia stabile e deterministica permettendoti al tempo stesso di scambiare browser e profili locali/remoti.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per puntare a un profilo specifico.
Tutti i comandi accettano anche `--json` per output leggibile da macchina (payload stabili).

Base:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Ispezione:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Nota sul ciclo di vita:

- Per profili attach-only e CDP remoti, `openclaw browser stop` resta il
  comando corretto di cleanup dopo i test. Chiude la sessione di controllo attiva e
  cancella gli override temporanei di emulazione invece di terminare il browser
  sottostante.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Azioni:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Stato:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Note:

- `upload` e `dialog` sono chiamate di **arming**; eseguili prima del click/press
  che attiva il file chooser/dialog.
- I percorsi di output di download e trace sono vincolati alle root temp di OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - download: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- I percorsi di upload sono vincolati a una root temp uploads di OpenClaw:
  - upload: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` può anche impostare direttamente gli input file tramite `--input-ref` o `--element`.
- `snapshot`:
  - `--format ai` (predefinito quando Playwright è installato): restituisce un AI snapshot con ref numerici (`aria-ref="<n>"`).
  - `--format aria`: restituisce l'albero di accessibilità (nessun ref; solo ispezione).
  - `--efficient` (oppure `--mode efficient`): preset di role snapshot compatto (interactive + compact + depth + maxChars più basso).
  - Predefinito di configurazione (solo tool/CLI): imposta `browser.snapshotDefaults.mode: "efficient"` per usare snapshot efficient quando il chiamante non passa una modalità (vedi [Configurazione del Gateway](/it/gateway/configuration-reference#browser)).
  - Le opzioni role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forzano uno snapshot basato sui ruoli con ref come `ref=e12`.
  - `--frame "<iframe selector>"` limita i role snapshot a un iframe (si abbina a role ref come `e12`).
  - `--interactive` produce un elenco piatto e facile da scegliere di elementi interattivi (ideale per guidare le azioni).
  - `--labels` aggiunge uno screenshot solo viewport con etichette ref sovrapposte (stampa `MEDIA:<path>`).
- `click`/`type`/ecc. richiedono un `ref` da `snapshot` (numerico `12` oppure role ref `e12`).
  I selettori CSS non sono intenzionalmente supportati per le azioni.

## Snapshot e ref

OpenClaw supporta due stili di “snapshot”:

- **AI snapshot (ref numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include ref numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il ref viene risolto tramite `aria-ref` di Playwright.

- **Role snapshot (role ref come `e12`)**: `openclaw browser snapshot --interactive` (oppure `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato sui ruoli con `[ref=e12]` (e facoltativamente `[nth=1]`).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il ref viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot del viewport con etichette `e12` sovrapposte.

Comportamento dei ref:

- I ref **non sono stabili tra navigazioni**; se qualcosa fallisce, riesegui `snapshot` e usa un ref nuovo.
- Se il role snapshot è stato preso con `--frame`, i role ref sono limitati a quell'iframe fino al prossimo role snapshot.

## Potenziamenti di wait

Puoi aspettare più di semplice tempo/testo:

- Attendere un URL (glob supportati da Playwright):
  - `openclaw browser wait --url "**/dash"`
- Attendere uno stato di caricamento:
  - `openclaw browser wait --load networkidle`
- Attendere un predicato JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Attendere che un selettore diventi visibile:
  - `openclaw browser wait "#main"`

Questi possono essere combinati:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flussi di debug

Quando un'azione fallisce (per esempio “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci role ref in modalità interactive)
3. Se continua a fallire: `openclaw browser highlight <ref>` per vedere cosa Playwright sta puntando
4. Se la pagina si comporta in modo strano:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito: registra una trace:
   - `openclaw browser trace start`
   - riproduci il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` serve per scripting e strumenti strutturati.

Esempi:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

I role snapshot in JSON includono `refs` più un piccolo blocco `stats` (righe/caratteri/ref/interattivi) così gli strumenti possono ragionare su dimensione e densità del payload.

## Manopole di stato e ambiente

Sono utili per flussi di lavoro “fai comportare il sito come X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (l'alias legacy `set headers --json '{"X-Debug":"1"}'` resta supportato)
- Auth HTTP basic: `set credentials user pass` (oppure `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (oppure `--clear`)
- Media: `set media dark|light|no-preference|none`
- Fuso orario / locale: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preset dispositivi di Playwright)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo browser openclaw può contenere sessioni autenticate; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. Il prompt injection può
  pilotare questo comportamento. Disabilitalo con `browser.evaluateEnabled=false` se non ti serve.
- Per login e note anti-bot (X/Twitter, ecc.), vedi [Login browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantieni privati il Gateway/l'host node (solo loopback o tailnet).
- Gli endpoint CDP remoti sono potenti; mettili dietro tunnel e proteggili.

Esempio di modalità rigorosa (blocca per impostazione predefinita destinazioni private/interne):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Risoluzione dei problemi

Per problemi specifici di Linux (in particolare snap Chromium), vedi
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per setup split-host WSL2 Gateway + Chrome Windows, vedi
[Risoluzione dei problemi WSL2 + Windows + CDP remoto di Chrome](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP vs blocco SSRF di navigazione

Si tratta di classi di errore diverse e puntano a percorsi di codice differenti.

- **Errore di avvio o readiness CDP** significa che OpenClaw non riesce a confermare che il control plane del browser sia in salute.
- **Blocco SSRF di navigazione** significa che il control plane del browser è in salute, ma una destinazione di navigazione della pagina viene rifiutata dalla policy.

Esempi comuni:

- Errore di avvio o readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocco SSRF di navigazione:
  - i flussi `open`, `navigate`, snapshot o di apertura scheda falliscono con un errore di policy browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per distinguere i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come leggere i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima la readiness CDP.
- Se `start` riesce ma `tabs` fallisce, il control plane è ancora non in salute. Trattalo come un problema di raggiungibilità CDP, non come un problema di navigazione della pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il control plane del browser è attivo e il guasto è nella policy di navigazione o nella pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso base di controllo del browser gestito è in salute.

Dettagli importanti del comportamento:

- La configurazione del browser usa come predefinito un oggetto di policy SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito locale loopback `openclaw`, i controlli di salute CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il control plane locale di OpenClaw.
- La protezione della navigazione è separata. Un risultato riuscito di `start` o `tabs` non significa che una destinazione successiva di `open` o `navigate` sia consentita.

Linee guida di sicurezza:

- **Non** allentare la policy SSRF del browser per impostazione predefinita.
- Preferisci eccezioni strette per host come `hostnameAllowlist` o `allowedHostnames` invece di un ampio accesso alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente fidati in cui l'accesso del browser alla rete privata è richiesto e revisionato.

Esempio: navigazione bloccata, control plane in salute

- `start` riesce
- `tabs` riesce
- `open http://internal.example` fallisce

Di solito questo significa che l'avvio del browser va bene e che la destinazione di navigazione richiede una revisione della policy.

Esempio: avvio bloccato prima che la navigazione conti

- `start` fallisce con `not reachable after start`
- anche `tabs` fallisce o non può essere eseguito

Questo punta ad avvio del browser o raggiungibilità CDP, non a un problema di allowlist dell'URL della pagina.

## Strumenti dell'agente + come funziona il controllo

L'agente ottiene **uno strumento** per l'automazione del browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Come viene mappato:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per cliccare/digitare/trascinare/selezionare.
- `browser screenshot` cattura i pixel (pagina intera o elemento).
- `browser` accetta:
  - `profile` per scegliere un profilo browser con nome (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove si trova il browser.
  - Nelle sessioni sandboxed, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` viene omesso: le sessioni sandboxed usano per default `sandbox`, le sessioni non sandboxed usano per default `host`.
  - Se è connesso un node con capability browser, lo strumento può instradarsi automaticamente verso di esso a meno che tu non fissi `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica Tools](/it/tools) — tutti gli strumenti dell'agente disponibili
- [Sandboxing](/it/gateway/sandboxing) — controllo del browser in ambienti sandboxed
- [Sicurezza](/it/gateway/security) — rischi del controllo del browser e hardening
