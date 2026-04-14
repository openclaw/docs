---
read_when:
    - Aggiunta dell'automazione del browser controllata dall'agente
    - Debug di come openclaw stia interferendo con il tuo Chrome
    - Implementazione delle impostazioni del browser + del ciclo di vita nell'app macOS
summary: Servizio di controllo del browser integrato + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-04-14T13:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# Browser (gestito da openclaw)

OpenClaw può eseguire un **profilo Chrome/Brave/Edge/Chromium dedicato** controllato dall'agente.
È isolato dal tuo browser personale ed è gestito tramite un piccolo
servizio di controllo locale all'interno del Gateway (solo loopback).

Vista per principianti:

- Consideralo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il profilo del tuo browser personale.
- L'agente può **aprire schede, leggere pagine, fare clic e digitare** in un percorso sicuro.
- Il profilo `user` integrato si collega alla tua sessione Chrome reale con accesso effettuato tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenca/apri/metti a fuoco/chiudi).
- Azioni dell'agente (clic/digita/trascina/seleziona), snapshot, screenshot, PDF.
- Supporto opzionale per più profili (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo browser principale per tutti i giorni. È una superficie sicura e isolata per
l'automazione e la verifica da parte dell'agente.

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
non è disponibile, vai a [Comando o strumento browser mancante](/it/tools/browser#missing-browser-command-or-tool).

## Controllo del Plugin

Lo strumento `browser` predefinito ora è un Plugin incluso che viene distribuito abilitato per
impostazione predefinita. Questo significa che puoi disabilitarlo o sostituirlo senza rimuovere il resto del
sistema di Plugin di OpenClaw:

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

Disabilita il Plugin incluso prima di installare un altro plugin che fornisce lo
stesso nome strumento `browser`. L'esperienza browser predefinita richiede entrambi:

- `plugins.entries.browser.enabled` non disabilitato
- `browser.enabled=true`

Se disattivi solo il Plugin, la CLI browser inclusa (`openclaw browser`),
il metodo Gateway (`browser.request`), lo strumento agente e il servizio di controllo browser
predefinito scompaiono tutti insieme. La tua configurazione `browser.*` rimane intatta per essere riutilizzata da
un Plugin sostitutivo.

Il Plugin browser incluso ora possiede anche l'implementazione runtime del browser.
Il core mantiene solo gli helper condivisi del Plugin SDK più le riesportazioni di compatibilità per
i vecchi percorsi di importazione interni. In pratica, rimuovere o sostituire il pacchetto del Plugin browser
rimuove l'insieme di funzionalità del browser invece di lasciare dietro un secondo runtime
di proprietà del core.

Le modifiche alla configurazione del browser richiedono comunque un riavvio del Gateway affinché il Plugin incluso
possa registrare nuovamente il suo servizio browser con le nuove impostazioni.

## Comando o strumento browser mancante

Se `openclaw browser` diventa improvvisamente un comando sconosciuto dopo un aggiornamento, oppure
l'agente segnala che manca lo strumento browser, la causa più comune è una lista `plugins.allow`
restrittiva che non include `browser`.

Esempio di configurazione non funzionante:

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

- `browser.enabled=true` da solo non è sufficiente quando `plugins.allow` è impostato.
- Anche `plugins.entries.browser.enabled=true` da solo non è sufficiente quando `plugins.allow` è impostato.
- `tools.alsoAllow: ["browser"]` **non** carica il Plugin browser incluso. Regola solo la policy degli strumenti dopo che il Plugin è già stato caricato.
- Se non hai bisogno di una allowlist dei plugin restrittiva, rimuovere `plugins.allow` ripristina anche il comportamento browser incluso predefinito.

Sintomi tipici:

- `openclaw browser` è un comando sconosciuto.
- `browser.request` è mancante.
- L'agente segnala che lo strumento browser non è disponibile o manca.

## Profili: `openclaw` vs `user`

- `openclaw`: browser gestito e isolato (non richiede estensioni).
- `user`: profilo integrato di collegamento Chrome MCP alla tua **vera sessione Chrome con accesso effettuato**.

Per le chiamate allo strumento browser dell'agente:

- Predefinito: usa il browser isolato `openclaw`.
- Preferisci `profile="user"` quando contano le sessioni già con accesso effettuato e l'utente
  è al computer per fare clic/approvare eventuali prompt di collegamento.
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

- Il servizio di controllo browser si associa al loopback su una porta derivata da `gateway.port`
  (predefinito: `18791`, cioè gateway + 2).
- Se sovrascrivi la porta del Gateway (`gateway.port` o `OPENCLAW_GATEWAY_PORT`),
  le porte browser derivate cambiano per restare nella stessa “famiglia”.
- `cdpUrl` usa per impostazione predefinita la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità CDP remoti (non loopback).
- `remoteCdpHandshakeTimeoutMs` si applica ai controlli di raggiungibilità WebSocket CDP remoti.
- La navigazione/apertura scheda del browser è protetta da SSRF prima della navigazione e ricontrollata al meglio sull'URL finale `http(s)` dopo la navigazione.
- In modalità SSRF rigorosa, vengono controllati anche individuazione/sonde degli endpoint CDP remoti (`cdpUrl`, incluse le ricerche `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato per impostazione predefinita. Impostalo su `true` solo quando ti fidi intenzionalmente dell'accesso browser alla rete privata.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy per compatibilità.
- `attachOnly: true` significa “non avviare mai un browser locale; collegarsi solo se è già in esecuzione.”
- `color` + `color` per profilo colorano l'interfaccia del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (browser standalone gestito da OpenClaw). Usa `defaultProfile: "user"` per scegliere il browser utente con accesso effettuato.
- Ordine di rilevamento automatico: browser di sistema predefinito se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- I profili `openclaw` locali assegnano automaticamente `cdpPort`/`cdpUrl` — impostali solo per CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP invece di CDP grezzo. Non
  impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo existing-session
  deve collegarsi a un profilo utente Chromium non predefinito come Brave o Edge.

## Usa Brave (o un altro browser basato su Chromium)

Se il tuo browser **di sistema predefinito** è basato su Chromium (Chrome/Brave/Edge/ecc.),
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
- **Controllo remoto (host node):** esegui un host node sulla macchina che ha il browser; il Gateway inoltra a esso le azioni del browser.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non avvierà un browser locale.

Il comportamento di arresto varia in base alla modalità del profilo:

- profili locali gestiti: `openclaw browser stop` arresta il processo browser che
  OpenClaw ha avviato
- profili attach-only e CDP remoti: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia gli override di emulazione Playwright/CDP (viewport,
  schema colori, impostazioni locali, fuso orario, modalità offline e stato simile), anche
  se nessun processo browser è stato avviato da OpenClaw

Gli URL CDP remoti possono includere autenticazione:

- Token di query (ad esempio, `https://provider.example?token=<token>`)
- Autenticazione HTTP Basic (ad esempio, `https://user:pass@provider.example`)

OpenClaw preserva l'autenticazione quando chiama gli endpoint `/json/*` e quando si connette
al WebSocket CDP. Preferisci variabili d'ambiente o secret manager per i
token invece di salvarli nei file di configurazione.

## Proxy browser node (predefinito a configurazione zero)

Se esegui un **host node** sulla macchina che ha il tuo browser, OpenClaw può
instradare automaticamente le chiamate allo strumento browser verso quel node senza alcuna configurazione browser aggiuntiva.
Questo è il percorso predefinito per i Gateway remoti.

Note:

- L'host node espone il proprio server di controllo browser locale tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del node stesso (uguale a quella locale).
- `nodeHost.browserProxy.allowProfiles` è opzionale. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati restano raggiungibili tramite il proxy, incluse le route di creazione/eliminazione profilo.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come un confine di privilegio minimo: solo i profili nella allowlist possono essere destinati e le route di creazione/eliminazione dei profili persistenti vengono bloccate sulla superficie del proxy.
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

- Sostituisci `<BROWSERLESS_API_KEY>` con il tuo token Browserless reale.
- Scegli l'endpoint regionale che corrisponde al tuo account Browserless (vedi la loro documentazione).
- Se Browserless ti fornisce un URL base HTTPS, puoi convertirlo in
  `wss://` per una connessione CDP diretta oppure mantenere l'URL HTTPS e lasciare che OpenClaw
  individui `/json/version`.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** invece
del rilevamento CDP standard basato su HTTP (`/json/version`). OpenClaw supporta entrambi:

- **Endpoint HTTP(S)** — OpenClaw chiama `/json/version` per individuare l'URL del debugger
  WebSocket, quindi si connette.
- **Endpoint WebSocket** (`ws://` / `wss://`) — OpenClaw si connette direttamente,
  saltando `/json/version`. Usa questa modalità per servizi come
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com), o qualsiasi provider che ti fornisca un
  URL WebSocket.

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
- Sostituisci `<BROWSERBASE_API_KEY>` con la tua vera API key Browserbase.
- Browserbase crea automaticamente una sessione browser alla connessione WebSocket, quindi
  non è necessario alcun passaggio manuale di creazione della sessione.
- Il piano gratuito consente una sessione concorrente e un'ora di browser al mese.
  Vedi i [prezzi](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Consulta la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento API
  completo, le guide SDK e gli esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo del browser è solo loopback; l'accesso passa tramite l'autenticazione del Gateway o l'associazione del node.
- L'API HTTP browser standalone su loopback usa **solo autenticazione con segreto condiviso**:
  autenticazione bearer con token del gateway, `x-openclaw-password`, oppure autenticazione HTTP Basic con la
  password del gateway configurata.
- Gli header di identità Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **non**
  autenticano questa API browser standalone su loopback.
- Se il controllo del browser è abilitato e non è configurata alcuna autenticazione con segreto condiviso, OpenClaw
  genera automaticamente `gateway.auth.token` all'avvio e lo salva nella configurazione.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è
  già `password`, `none`, o `trusted-proxy`.
- Mantieni il Gateway e qualsiasi host node su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta gli URL/token CDP remoti come segreti; preferisci variabili d'ambiente o un secret manager.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token a breve durata quando possibile.
- Evita di incorporare token a lunga durata direttamente nei file di configurazione.

## Profili (multi-browser)

OpenClaw supporta più profili con nome (configurazioni di instradamento). I profili possono essere:

- **gestiti da openclaw**: un'istanza dedicata di browser basato su Chromium con la propria directory dati utente + porta CDP
- **remoto**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite auto-connessione Chrome DevTools MCP

Predefiniti:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per il collegamento existing-session di Chrome MCP.
- I profili existing-session sono opzionali oltre a `user`; creali con `--driver existing-session`.
- Le porte CDP locali vengono allocate da **18800–18899** per impostazione predefinita.
- L'eliminazione di un profilo sposta la sua directory dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Existing-session tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium in esecuzione tramite il
server ufficiale Chrome DevTools MCP. Questo riutilizza le schede e lo stato di accesso
già aperti in quel profilo browser.

Riferimenti ufficiali di contesto e configurazione:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Opzionale: crea il tuo profilo existing-session personalizzato se vuoi un
nome, colore o directory dati browser diversi.

Comportamento predefinito:

- Il profilo `user` integrato usa l'auto-connessione Chrome MCP, che punta al
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

Quindi, nel browser corrispondente:

1. Apri la pagina inspect di quel browser per il debug remoto.
2. Abilita il debug remoto.
3. Lascia il browser in esecuzione e approva il prompt di connessione quando OpenClaw si collega.

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
- `tabs` elenca le schede del browser già aperte
- `snapshot` restituisce ref dalla scheda live selezionata

Cosa controllare se il collegamento non funziona:

- il browser di destinazione basato su Chromium è alla versione `144+`
- il debug remoto è abilitato nella pagina inspect di quel browser
- il browser ha mostrato il prompt di consenso al collegamento e tu lo hai accettato
- `openclaw doctor` migra la vecchia configurazione browser basata su estensione e verifica che
  Chrome sia installato localmente per i profili predefiniti con auto-connessione, ma non può
  abilitare per te il debug remoto dal lato browser

Uso da parte dell'agente:

- Usa `profile="user"` quando hai bisogno dello stato del browser con accesso effettuato dell'utente.
- Se usi un profilo existing-session personalizzato, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare il
  prompt di collegamento.
- il Gateway o l'host node può eseguire `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso del profilo `openclaw` isolato perché può
  agire all'interno della tua sessione browser con accesso effettuato.
- OpenClaw non avvia il browser per questo driver; si collega solo a una
  sessione esistente.
- OpenClaw usa qui il flusso ufficiale Chrome DevTools MCP `--autoConnect`. Se
  `userDataDir` è impostato, OpenClaw lo passa per puntare a quella specifica
  directory dati utente Chromium.
- Gli screenshot existing-session supportano acquisizioni della pagina e acquisizioni di elementi `--ref`
  dagli snapshot, ma non i selettori CSS `--element`.
- Gli screenshot di pagina existing-session funzionano senza Playwright tramite Chrome MCP.
  Gli screenshot di elementi basati su ref (`--ref`) funzionano anche lì, ma `--full-page`
  non può essere combinato con `--ref` o `--element`.
- Le azioni existing-session sono ancora più limitate rispetto al percorso del browser
  gestito:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag`, e `select` richiedono
    ref snapshot invece dei selettori CSS
  - `click` è solo con il pulsante sinistro (nessuna sovrascrittura del pulsante o modificatore)
  - `type` non supporta `slowly=true`; usa `fill` o `press`
  - `press` non supporta `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill`, e `evaluate` non
    supportano override di timeout per chiamata
  - `select` al momento supporta un solo valore
- Existing-session `wait --url` supporta pattern esatti, sottostringa e glob
  come gli altri driver browser. `wait --load networkidle` non è ancora supportato.
- Gli hook di upload existing-session richiedono `ref` o `inputRef`, supportano un file
  alla volta e non supportano il targeting CSS `element`.
- Gli hook dialog existing-session non supportano override di timeout.
- Alcune funzionalità richiedono ancora il percorso browser gestito, inclusi
  azioni batch, esportazione PDF, intercettazione dei download e `responsebody`.
- Existing-session è locale all'host. Se Chrome si trova su una macchina diversa o in un
  namespace di rete diverso, usa invece CDP remoto o un host node.

## Garanzie di isolamento

- **Directory dati utente dedicata**: non tocca mai il profilo del tuo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con i flussi di lavoro di sviluppo.
- **Controllo deterministico delle schede**: le schede di destinazione vengono identificate tramite `targetId`, non tramite “ultima scheda”.

## Selezione del browser

Quando viene avviato localmente, OpenClaw sceglie il primo disponibile:

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

Solo per integrazioni locali, il Gateway espone una piccola API HTTP loopback:

- Stato/avvio/arresto: `GET /`, `POST /start`, `POST /stop`
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

Se è configurata l'autenticazione gateway con segreto condiviso, anche le route HTTP browser richiedono autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oppure autenticazione HTTP Basic con quella password

Note:

- Questa API browser standalone su loopback **non** usa trusted-proxy o
  gli header di identità Tailscale Serve.
- Se `gateway.auth.mode` è `none` o `trusted-proxy`, queste route browser su loopback
  non ereditano quelle modalità basate su identità; mantienile solo loopback.

### Contratto di errore `/act`

`POST /act` usa una risposta di errore strutturata per la validazione a livello di route e
i fallimenti di policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori `code` correnti:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` manca o non è riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): il payload dell'azione ha fallito normalizzazione o validazione.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): è stato usato `selector` con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` di primo livello o batch è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per i profili existing-session.

Altri errori di runtime possono ancora restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito Playwright

Alcune funzionalità (navigate/act/AI snapshot/role snapshot, screenshot di elementi,
PDF) richiedono Playwright. Se Playwright non è installato, quegli endpoint restituiscono
un chiaro errore 501.

Cosa continua a funzionare senza Playwright:

- Snapshot ARIA
- Screenshot di pagina per il browser `openclaw` gestito quando è disponibile un WebSocket
  CDP per scheda
- Screenshot di pagina per profili `existing-session` / Chrome MCP
- Screenshot existing-session basati su `--ref` dall'output dello snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot di elementi con selettore CSS (`--element`)
- Esportazione PDF completa del browser

Anche gli screenshot di elementi rifiutano `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, installa il pacchetto
Playwright completo (non `playwright-core`) e riavvia il gateway, oppure reinstalla
OpenClaw con il supporto browser.

#### Installazione di Playwright in Docker

Se il tuo Gateway è in esecuzione in Docker, evita `npx playwright` (conflitti con gli override npm).
Usa invece la CLI inclusa:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download del browser, imposta `PLAYWRIGHT_BROWSERS_PATH` (ad esempio,
`/home/node/.cache/ms-playwright`) e assicurati che `/home/node` sia persistito tramite
`OPENCLAW_HOME_VOLUME` o un bind mount. Vedi [Docker](/it/install/docker).

## Come funziona (interno)

Flusso di alto livello:

- Un piccolo **server di controllo** accetta richieste HTTP.
- Si collega ai browser basati su Chromium (Chrome/Brave/Edge/Chromium) tramite **CDP**.
- Per le azioni avanzate (clic/digitazione/snapshot/PDF), usa **Playwright** sopra
  CDP.
- Quando Playwright non è presente, sono disponibili solo le operazioni che non usano Playwright.

Questo design mantiene l'agente su un'interfaccia stabile e deterministica, permettendoti al contempo
di cambiare browser e profili locali/remoti.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per indirizzare un profilo specifico.
Tutti i comandi accettano anche `--json` per output leggibile da macchina (payload stabili).

Nozioni di base:

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

- Per i profili attach-only e CDP remoti, `openclaw browser stop` è comunque il
  comando di pulizia corretto dopo i test. Chiude la sessione di controllo attiva e
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

- `upload` e `dialog` sono chiamate di **preparazione**; eseguirle prima del clic/della pressione
  che attiva il selettore/la finestra di dialogo.
- I percorsi di output di download e trace sono vincolati alle root temporanee di OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - download: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- I percorsi di upload sono vincolati a una root temporanea uploads di OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` può anche impostare direttamente input file tramite `--input-ref` o `--element`.
- `snapshot`:
  - `--format ai` (predefinito quando Playwright è installato): restituisce uno snapshot AI con ref numerici (`aria-ref="<n>"`).
  - `--format aria`: restituisce l'albero di accessibilità (senza ref; solo ispezione).
  - `--efficient` (o `--mode efficient`): preset compatto per role snapshot (interactive + compact + depth + maxChars più basso).
  - Configurazione predefinita (solo tool/CLI): imposta `browser.snapshotDefaults.mode: "efficient"` per usare snapshot efficienti quando il chiamante non passa una modalità (vedi [Configurazione Gateway](/it/gateway/configuration-reference#browser)).
  - Le opzioni del role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forzano uno snapshot basato su ruoli con ref come `ref=e12`.
  - `--frame "<iframe selector>"` limita i role snapshot a un iframe (si abbina a role ref come `e12`).
  - `--interactive` produce un elenco piatto e facile da scegliere di elementi interattivi (ideale per guidare le azioni).
  - `--labels` aggiunge uno screenshot della viewport con etichette ref sovrapposte (stampa `MEDIA:<path>`).
- `click`/`type`/ecc. richiedono un `ref` da `snapshot` (sia numerico `12` sia role ref `e12`).
  I selettori CSS intenzionalmente non sono supportati per le azioni.

## Snapshot e ref

OpenClaw supporta due stili di “snapshot”:

- **AI snapshot (ref numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include ref numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il ref viene risolto tramite `aria-ref` di Playwright.

- **Role snapshot (role ref come `e12`)**: `openclaw browser snapshot --interactive` (oppure `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato su ruoli con `[ref=e12]` (e facoltativamente `[nth=1]`).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il ref viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot della viewport con etichette `e12` sovrapposte.

Comportamento dei ref:

- I ref **non sono stabili tra una navigazione e l'altra**; se qualcosa fallisce, esegui di nuovo `snapshot` e usa un ref aggiornato.
- Se il role snapshot è stato acquisito con `--frame`, i role ref sono limitati a quell'iframe fino al role snapshot successivo.

## Potenziamenti di wait

Puoi attendere più di un semplice tempo/testo:

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

Quando un'azione fallisce (ad esempio “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci role ref in modalità interattiva)
3. Se fallisce ancora: `openclaw browser highlight <ref>` per vedere cosa Playwright sta prendendo di mira
4. Se la pagina si comporta in modo strano:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito: registra una trace:
   - `openclaw browser trace start`
   - riproduci il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` serve per scripting e tool strutturati.

Esempi:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

I role snapshot in JSON includono `refs` più un piccolo blocco `stats` (righe/caratteri/ref/interattivi) così gli strumenti possono ragionare su dimensione e densità del payload.

## Controlli di stato e ambiente

Questi sono utili per flussi “fai comportare il sito come X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (il legacy `set headers --json '{"X-Debug":"1"}'` resta supportato)
- Autenticazione HTTP basic: `set credentials user pass` (oppure `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (oppure `--clear`)
- Media: `set media dark|light|no-preference|none`
- Fuso orario / impostazioni locali: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preset dispositivo Playwright)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo browser openclaw può contenere sessioni con accesso effettuato; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. Il prompt injection può indirizzare
  questo comportamento. Disabilitalo con `browser.evaluateEnabled=false` se non ti serve.
- Per login e note anti-bot (X/Twitter, ecc.), vedi [Accesso browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantieni privati il Gateway/l'host node (solo loopback o tailnet).
- Gli endpoint CDP remoti sono potenti; incanalarli e proteggerli.

Esempio di modalità rigorosa (blocca per impostazione predefinita le destinazioni private/interne):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow esatto opzionale
    },
  },
}
```

## Risoluzione dei problemi

Per problemi specifici di Linux (in particolare snap Chromium), vedi
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni divise host WSL2 Gateway + Chrome Windows, vedi
[Risoluzione dei problemi WSL2 + Windows + CDP Chrome remoto](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP vs blocco SSRF di navigazione

Queste sono classi di errore diverse e puntano a percorsi di codice differenti.

- **Errore di avvio o di prontezza CDP** significa che OpenClaw non riesce a confermare che il piano di controllo del browser sia integro.
- **Blocco SSRF di navigazione** significa che il piano di controllo del browser è integro, ma una destinazione di navigazione della pagina viene rifiutata dalla policy.

Esempi comuni:

- Errore di avvio o di prontezza CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocco SSRF di navigazione:
  - i flussi `open`, `navigate`, snapshot o di apertura schede falliscono con un errore di policy browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per distinguere i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come interpretare i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima il problema di prontezza CDP.
- Se `start` riesce ma `tabs` fallisce, il piano di controllo non è ancora integro. Trattalo come un problema di raggiungibilità CDP, non come un problema di navigazione della pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il piano di controllo del browser è attivo e il problema riguarda la policy di navigazione o la pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso di controllo di base del browser gestito è integro.

Dettagli importanti sul comportamento:

- La configurazione del browser usa per impostazione predefinita un oggetto di policy SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito locale `openclaw` su loopback, i controlli di integrità CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il piano di controllo locale di OpenClaw.
- La protezione della navigazione è separata. Un risultato positivo di `start` o `tabs` non significa che una destinazione successiva di `open` o `navigate` sia consentita.

Linee guida di sicurezza:

- **Non** allentare la policy SSRF del browser per impostazione predefinita.
- Preferisci eccezioni host ristrette come `hostnameAllowlist` o `allowedHostnames` invece di un ampio accesso alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente attendibili in cui l'accesso del browser alla rete privata è richiesto e revisionato.

Esempio: navigazione bloccata, piano di controllo integro

- `start` riesce
- `tabs` riesce
- `open http://internal.example` fallisce

Questo di solito significa che l'avvio del browser è corretto e che la destinazione di navigazione richiede una revisione della policy.

Esempio: avvio bloccato prima che la navigazione conti

- `start` fallisce con `not reachable after start`
- anche `tabs` fallisce o non può essere eseguito

Questo indica un problema di avvio del browser o di raggiungibilità CDP, non un problema di allowlist URL della pagina.

## Strumenti dell'agente + funzionamento del controllo

L'agente riceve **uno strumento** per l'automazione del browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mappatura:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per fare clic/digitare/trascinare/selezionare.
- `browser screenshot` acquisisce i pixel (pagina intera o elemento).
- `browser` accetta:
  - `profile` per scegliere un profilo browser con nome (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove si trova il browser.
  - Nelle sessioni sandboxed, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` viene omesso: le sessioni sandboxed usano per impostazione predefinita `sandbox`, le sessioni non sandbox usano per impostazione predefinita `host`.
  - Se è connesso un node con capacità browser, lo strumento può instradarsi automaticamente a esso a meno che tu non fissi `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti dell'agente disponibili
- [Sandboxing](/it/gateway/sandboxing) — controllo del browser in ambienti sandboxed
- [Sicurezza](/it/gateway/security) — rischi e misure di hardening del controllo del browser
