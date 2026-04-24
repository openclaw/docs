---
read_when:
    - Aggiunta di automazione del browser controllata dall'agente
    - Debug del motivo per cui openclaw interferisce con il tuo Chrome:-------------</analysis to=commentary.functions.read  彩神争霸怎么json  亚历山大发ाफी ￣奇米commentary to=functions.read  大发快三和值json  {"path":"/home/runner/work/docs/docs/source/docs/AGENTS.md"}
    - Implementazione delle impostazioni del browser e del ciclo di vita nell'app macOS
summary: Servizio integrato di controllo del browser + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw può eseguire un **profilo dedicato Chrome/Brave/Edge/Chromium** che l'agente controlla.
È isolato dal tuo browser personale ed è gestito tramite un piccolo
servizio di controllo locale all'interno del Gateway (solo loopback).

Versione per principianti:

- Pensalo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il tuo profilo browser personale.
- L'agente può **aprire schede, leggere pagine, cliccare e digitare** in un percorso sicuro.
- Il profilo `user` integrato si collega alla tua vera sessione Chrome autenticata tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenca/apri/metti a fuoco/chiudi).
- Azioni dell'agente (clic/digita/trascina/seleziona), snapshot, screenshot, PDF.
- Supporto facoltativo a più profili (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo browser quotidiano. È una superficie sicura e isolata per
automazione e verifica dell'agente.

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

## Controllo del plugin

Lo strumento predefinito `browser` è un plugin bundled. Disabilitalo per sostituirlo con un altro plugin che registra lo stesso nome di strumento `browser`:

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

I valori predefiniti richiedono sia `plugins.entries.browser.enabled` **sia** `browser.enabled=true`. Disabilitare solo il plugin rimuove in un'unica unità la CLI `openclaw browser`, il metodo gateway `browser.request`, lo strumento dell'agente e il servizio di controllo; la tua configurazione `browser.*` resta intatta per un eventuale sostituto.

Le modifiche alla configurazione del browser richiedono un riavvio del Gateway in modo che il plugin possa registrare di nuovo il proprio servizio.

## Comando o strumento browser mancante

Se `openclaw browser` è sconosciuto dopo un aggiornamento, manca `browser.request` o l'agente segnala che lo strumento browser non è disponibile, la causa più comune è una lista `plugins.allow` che omette `browser`. Aggiungilo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` non sostituiscono l'appartenenza all'allowlist — l'allowlist controlla il caricamento del plugin, e il criterio degli strumenti viene eseguito solo dopo il caricamento. Rimuovere completamente `plugins.allow` ripristina anche il comportamento predefinito.

## Profili: `openclaw` vs `user`

- `openclaw`: browser gestito e isolato (nessuna estensione richiesta).
- `user`: profilo integrato di collegamento Chrome MCP per la tua **vera sessione Chrome autenticata**.

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
    enabled: true, // predefinito: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // attiva solo per accesso fidato a reti private
      // allowPrivateNetwork: true, // alias legacy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override legacy per singolo profilo
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket CDP remoto (ms)
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

<AccordionGroup>

<Accordion title="Porte e raggiungibilità">

- Il servizio di controllo si collega a loopback su una porta derivata da `gateway.port` (predefinito `18791` = gateway + 2). Sovrascrivere `gateway.port` o `OPENCLAW_GATEWAY_PORT` sposta le porte derivate della stessa famiglia.
- I profili locali `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl`; impostali solo per CDP remoto. `cdpUrl` usa come predefinito la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità HTTP CDP remoti (non-loopback); `remoteCdpHandshakeTimeoutMs` si applica agli handshake WebSocket CDP remoti.

</Accordion>

<Accordion title="Criterio SSRF">

- La navigazione del browser e open-tab sono protetti da SSRF prima della navigazione e ricontrollati best-effort sull'URL finale `http(s)` successivamente.
- In modalità SSRF rigorosa, vengono controllati anche il rilevamento degli endpoint CDP remoti e i probe `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disattivato per impostazione predefinita; abilitalo solo quando l'accesso del browser alla rete privata è intenzionalmente considerato attendibile.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.

</Accordion>

<Accordion title="Comportamento del profilo">

- `attachOnly: true` significa non avviare mai un browser locale; collegati solo se ne è già in esecuzione uno.
- `color` (di livello superiore e per profilo) colora la UI del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (gestito standalone). Usa `defaultProfile: "user"` per scegliere il browser autenticato dell'utente.
- Ordine di rilevamento automatico: browser predefinito del sistema se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP invece del CDP grezzo. Non impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo existing-session deve collegarsi a un profilo utente Chromium non predefinito (Brave, Edge, ecc.).

</Accordion>

</AccordionGroup>

## Usa Brave (o un altro browser basato su Chromium)

Se il tuo browser **predefinito di sistema** è basato su Chromium (Chrome/Brave/Edge/ecc),
OpenClaw lo usa automaticamente. Imposta `browser.executablePath` per sovrascrivere
il rilevamento automatico:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Oppure impostalo nella configurazione, per piattaforma:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Controllo locale vs remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo loopback e può lanciare un browser locale.
- **Controllo remoto (node host):** esegui un node host sulla macchina che ha il browser; il Gateway inoltra le azioni del browser a quel node host.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (oppure `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non lancerà un browser locale.

Il comportamento di arresto differisce in base alla modalità del profilo:

- profili locali gestiti: `openclaw browser stop` ferma il processo browser che
  OpenClaw ha lanciato
- profili solo attach e CDP remoti: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia gli override di emulazione Playwright/CDP (viewport,
  combinazione colori, locale, fuso orario, modalità offline e stato simile), anche
  se nessun processo browser è stato lanciato da OpenClaw

Gli URL CDP remoti possono includere auth:

- Token di query (ad es. `https://provider.example?token=<token>`)
- Auth HTTP Basic (ad es. `https://user:pass@provider.example`)

OpenClaw preserva l'auth quando chiama gli endpoint `/json/*` e quando si connette
al WebSocket CDP. Preferisci variabili di ambiente o secret manager per i
token invece di salvarli nei file di configurazione.

## Proxy browser del Node (predefinito zero-config)

Se esegui un **node host** sulla macchina che ha il browser, OpenClaw può
instradare automaticamente le chiamate degli strumenti browser a quel node senza alcuna configurazione browser aggiuntiva.
Questo è il percorso predefinito per i gateway remoti.

Note:

- Il node host espone il proprio server locale di controllo del browser tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del node stesso (uguale a quella locale).
- `nodeHost.browserProxy.allowProfiles` è facoltativo. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati restano raggiungibili tramite il proxy, incluse le route create/delete del profilo.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come confine di privilegio minimo: solo i profili in allowlist possono essere usati come target e le route create/delete dei profili persistenti vengono bloccate sulla superficie proxy.
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

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** invece
del rilevamento CDP standard basato su HTTP (`/json/version`). OpenClaw accetta tre
forme di URL CDP e sceglie automaticamente la strategia di connessione corretta:

- **Rilevamento HTTP(S)** — `http://host[:port]` oppure `https://host[:port]`.
  OpenClaw chiama `/json/version` per rilevare l'URL WebSocket debugger, poi
  si connette. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** — `ws://host[:port]/devtools/<kind>/<id>` oppure
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si connette direttamente tramite handshake WebSocket e salta
  completamente `/json/version`.
- **Root WebSocket nude** — `ws://host[:port]` oppure `wss://host[:port]` senza
  un percorso `/devtools/...` (ad es. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw prova prima il
  rilevamento HTTP `/json/version` (normalizzando lo schema a `http`/`https`);
  se il rilevamento restituisce un `webSocketDebuggerUrl` questo viene usato, altrimenti OpenClaw
  usa come fallback un handshake WebSocket diretto sulla root nuda. Questo consente a un
  `ws://` nudo puntato a un Chrome locale di continuare a collegarsi, poiché Chrome accetta
  upgrade WebSocket solo sul percorso specifico per target proveniente da
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) è una piattaforma cloud per eseguire
browser headless con risoluzione CAPTCHA integrata, modalità stealth e
proxy residenziali.

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
  serve alcun passaggio manuale di creazione della sessione.
- Il piano gratuito consente una sessione concorrente e un'ora browser al mese.
  Vedi [pricing](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Vedi la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento completo
  dell'API, guide SDK ed esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo del browser è solo loopback; l'accesso passa attraverso l'auth del Gateway o il pairing del node.
- L'API HTTP browser loopback standalone usa **solo auth con segreto condiviso**:
  auth bearer con token gateway, `x-openclaw-password` o auth HTTP Basic con la
  password gateway configurata.
- Gli header di identità di Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **non**
  autenticano questa API browser loopback standalone.
- Se il controllo del browser è abilitato e non è configurata alcuna auth con segreto condiviso, OpenClaw
  genera automaticamente `gateway.auth.token` all'avvio e lo persiste nella configurazione.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è
  già `password`, `none` oppure `trusted-proxy`.
- Mantieni il Gateway e qualsiasi node host su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta URL/token CDP remoti come segreti; preferisci variabili env o un secret manager.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token a breve durata quando possibile.
- Evita di incorporare direttamente nei file di configurazione token a lunga durata.

## Profili (multi-browser)

OpenClaw supporta più profili con nome (configurazioni di routing). I profili possono essere:

- **gestiti da OpenClaw**: un'istanza dedicata di browser basato su Chromium con propria directory dati utente + porta CDP
- **remoti**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite auto-connect Chrome DevTools MCP

Valori predefiniti:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per il collegamento existing-session di Chrome MCP.
- I profili existing-session oltre `user` sono opt-in; creali con `--driver existing-session`.
- Le porte CDP locali vengono allocate da **18800–18899** per impostazione predefinita.
- Eliminare un profilo sposta la sua directory dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Existing-session tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium già in esecuzione tramite il
server ufficiale Chrome DevTools MCP. Questo riutilizza le schede e lo stato di login
già aperti in quel profilo browser.

Riferimenti ufficiali di background e configurazione:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Facoltativo: crea il tuo profilo existing-session personalizzato se vuoi un
nome, colore o directory dati browser diversi.

Comportamento predefinito:

- Il profilo `user` integrato usa l'auto-connect di Chrome MCP, che punta al
  profilo Google Chrome locale predefinito.

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
- `tabs` elenca le schede browser già aperte
- `snapshot` restituisce ref dalla scheda live selezionata

Cosa controllare se il collegamento non funziona:

- il browser basato su Chromium di destinazione è in versione `144+`
- il debug remoto è abilitato nella pagina inspect di quel browser
- il browser ha mostrato e tu hai accettato il prompt di consenso al collegamento
- `openclaw doctor` migra la vecchia configurazione browser basata su estensioni e controlla che
  Chrome sia installato localmente per i profili predefiniti auto-connect, ma non può
  abilitare per te il debug remoto lato browser

Uso da parte dell'agente:

- Usa `profile="user"` quando hai bisogno dello stato del browser autenticato dell'utente.
- Se usi un profilo existing-session personalizzato, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare il prompt
  di collegamento.
- il Gateway o il node host possono avviare `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso del profilo isolato `openclaw` perché può
  agire all'interno della tua sessione browser autenticata.
- OpenClaw non avvia il browser per questo driver; si limita a collegarsi.
- OpenClaw usa qui il flusso ufficiale `--autoConnect` di Chrome DevTools MCP. Se
  `userDataDir` è impostato, viene passato per puntare a quella directory dati utente.
- Existing-session può collegarsi sull'host selezionato o tramite un
  browser node connesso. Se Chrome si trova altrove e non è connesso alcun browser node, usa
  invece CDP remoto o un node host.

<Accordion title="Limitazioni della funzionalità existing-session">

Rispetto al profilo gestito `openclaw`, i driver existing-session hanno più vincoli:

- **Screenshot** — le catture della pagina e le catture elemento con `--ref` funzionano; i selettori CSS `--element` no. `--full-page` non può essere combinato con `--ref` o `--element`. Playwright non è richiesto per screenshot di pagina o di elemento basati su ref.
- **Azioni** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono ref snapshot (nessun selettore CSS). `click` supporta solo il pulsante sinistro. `type` non supporta `slowly=true`; usa `fill` oppure `press`. `press` non supporta `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ed `evaluate` non supportano timeout per chiamata. `select` accetta un solo valore.
- **Wait / upload / dialog** — `wait --url` supporta pattern esatti, sottostringa e glob; `wait --load networkidle` non è supportato. Gli hook di upload richiedono `ref` oppure `inputRef`, un file alla volta, nessun `element` CSS. Gli hook dialog non supportano override di timeout.
- **Funzionalità solo gestite** — azioni batch, esportazione PDF, intercettazione download e `responsebody` richiedono ancora il percorso browser gestito.

</Accordion>

## Garanzie di isolamento

- **Directory dati utente dedicata**: non tocca mai il tuo profilo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con i workflow di sviluppo.
- **Controllo deterministico delle schede**: le schede vengono selezionate per `targetId`, non per “ultima scheda”.

## Selezione del browser

Quando viene avviato localmente, OpenClaw sceglie il primo disponibile:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puoi sovrascriverlo con `browser.executablePath`.

Piattaforme:

- macOS: controlla `/Applications` e `~/Applications`.
- Linux: cerca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, ecc.
- Windows: controlla le posizioni di installazione comuni.

## API di controllo (facoltativa)

Per script e debug, il Gateway espone una piccola **API HTTP solo loopback di
controllo** più una CLI `openclaw browser` corrispondente (snapshot, ref, potenziamenti
wait, output JSON, workflow di debug). Vedi
[API di controllo del browser](/it/tools/browser-control) per il riferimento completo.

## Risoluzione dei problemi

Per problemi specifici di Linux (specialmente snap Chromium), vedi
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni host divisi WSL2 Gateway + Chrome Windows, vedi
[Risoluzione dei problemi WSL2 + Windows + remote Chrome CDP](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP vs blocco SSRF di navigazione

Queste sono classi di errore diverse e rimandano a percorsi di codice differenti.

- **Errore di avvio o readiness CDP** significa che OpenClaw non riesce a confermare che il control plane del browser sia sano.
- **Blocco SSRF di navigazione** significa che il control plane del browser è sano, ma una destinazione di navigazione della pagina viene rifiutata dal criterio.

Esempi comuni:

- Errore di avvio o readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocco SSRF di navigazione:
  - i flussi `open`, `navigate`, snapshot o apertura schede falliscono con un errore di criterio browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per separare i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come interpretare i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima la readiness CDP.
- Se `start` riesce ma `tabs` fallisce, il control plane è ancora non sano. Tratta il problema come un problema di raggiungibilità CDP, non di navigazione pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il control plane del browser è attivo e l'errore è nel criterio di navigazione o nella pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso base di controllo del browser gestito è sano.

Dettagli importanti del comportamento:

- La configurazione del browser usa come predefinito un oggetto criterio SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito locale loopback `openclaw`, i controlli di salute CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il control plane locale di OpenClaw.
- La protezione di navigazione è separata. Un risultato positivo di `start` o `tabs` non significa che una successiva destinazione `open` o `navigate` sia consentita.

Linee guida di sicurezza:

- **Non** allentare il criterio SSRF del browser per impostazione predefinita.
- Preferisci eccezioni host ristrette come `hostnameAllowlist` o `allowedHostnames` invece di un ampio accesso alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente fidati in cui l'accesso del browser alla rete privata è richiesto e revisionato.

## Strumenti dell'agente + come funziona il controllo

L'agente riceve **uno strumento** per l'automazione del browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mappatura:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per cliccare/digitare/trascinare/selezionare.
- `browser screenshot` cattura i pixel (pagina intera o elemento).
- `browser` accetta:
  - `profile` per scegliere un profilo browser con nome (openclaw, chrome o remote CDP).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove si trova il browser.
  - Nelle sessioni sandboxed, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` è omesso: le sessioni sandboxed usano come predefinito `sandbox`, le sessioni non sandbox usano come predefinito `host`.
  - Se è connesso un node con capacità browser, lo strumento può instradarsi automaticamente verso di esso a meno che tu non blocchi `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti dell'agente disponibili
- [Sandboxing](/it/gateway/sandboxing) — controllo del browser in ambienti sandboxed
- [Security](/it/gateway/security) — rischi del controllo del browser e hardening
