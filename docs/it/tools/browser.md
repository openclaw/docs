---
read_when:
    - Aggiunta dell'automazione del browser controllata dall'agente
    - Debuggare perché OpenClaw interferisce con il tuo Chrome
    - Implementazione delle impostazioni e del ciclo di vita del browser nell'app macOS
summary: Servizio integrato di controllo del browser + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:39:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw può eseguire un **profilo dedicato di Chrome/Brave/Edge/Chromium** controllato dall'agente.
È isolato dal tuo browser personale ed è gestito tramite un piccolo servizio di
controllo locale all'interno del Gateway (solo loopback).

Vista per principianti:

- Pensalo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il tuo profilo browser personale.
- L'agente può **aprire schede, leggere pagine, fare clic e digitare** in un percorso sicuro.
- Il profilo `user` integrato si collega alla tua vera sessione Chrome con accesso effettuato tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elencare/aprire/mettere a fuoco/chiudere).
- Azioni dell'agente (clic/digitazione/trascinamento/selezione), snapshot, screenshot, PDF.
- Una Skill `browser-automation` integrata che insegna agli agenti il ciclo di recupero snapshot,
  stable-tab, stale-ref e manual-blocker quando il Plugin browser è abilitato.
- Supporto opzionale a più profili (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo browser principale quotidiano. È una superficie sicura e isolata per
l'automazione e la verifica da parte dell'agente.

## Avvio rapido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se ricevi “Browser disabilitato”, abilitalo nella configurazione (vedi sotto) e riavvia il
Gateway.

Se `openclaw browser` manca completamente, oppure l'agente dice che lo strumento browser
non è disponibile, vai a [Comando o strumento browser mancante](/it/tools/browser#missing-browser-command-or-tool).

## Controllo del Plugin

Lo strumento `browser` predefinito è un Plugin integrato. Disabilitalo per sostituirlo con un altro Plugin che registra lo stesso nome di strumento `browser`:

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

Le impostazioni predefinite richiedono sia `plugins.entries.browser.enabled` **sia** `browser.enabled=true`. Disabilitare solo il Plugin rimuove in un'unica operazione la CLI `openclaw browser`, il metodo gateway `browser.request`, lo strumento dell'agente e il servizio di controllo; la configurazione `browser.*` resta intatta per un'eventuale sostituzione.

Le modifiche alla configurazione del browser richiedono un riavvio del Gateway affinché il Plugin possa registrare nuovamente il proprio servizio.

## Guida per l'agente

Nota sul profilo degli strumenti: `tools.profile: "coding"` include `web_search` e
`web_fetch`, ma non include lo strumento `browser` completo. Se l'agente o un
sub-agente avviato deve usare l'automazione del browser, aggiungi browser nella fase del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Per un singolo agente, usa `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` da solo non basta, perché la policy del sub-agente
viene applicata dopo il filtraggio del profilo.

Il Plugin browser include due livelli di guida per l'agente:

- La descrizione dello strumento `browser` contiene il contratto compatto sempre attivo: scegli
  il profilo giusto, mantieni i riferimenti nella stessa scheda, usa `tabId`/etichette per il targeting delle schede e carica la Skill browser per il lavoro in più passaggi.
- La Skill integrata `browser-automation` contiene il ciclo operativo più esteso:
  controlla prima stato/schede, etichetta le schede del task, fai uno snapshot prima di agire, rifai lo snapshot
  dopo i cambiamenti dell'interfaccia, recupera i riferimenti obsoleti una volta e segnala login/2FA/captcha o
  blocchi di fotocamera/microfono come azione manuale invece di procedere per tentativi.

Le Skills integrate nel Plugin vengono elencate tra le Skills disponibili dell'agente quando il
Plugin è abilitato. Le istruzioni complete della Skill vengono caricate su richiesta, quindi i turni di routine
non pagano il costo completo in token.

## Comando o strumento browser mancante

Se `openclaw browser` è sconosciuto dopo un aggiornamento, `browser.request` manca oppure l'agente segnala che lo strumento browser non è disponibile, la causa abituale è un elenco `plugins.allow` che omette `browser`. Aggiungilo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` non sostituiscono l'appartenenza alla allowlist: la allowlist controlla il caricamento del Plugin e la policy degli strumenti viene eseguita solo dopo il caricamento. Rimuovere del tutto `plugins.allow` ripristina anche il comportamento predefinito.

## Profili: `openclaw` vs `user`

- `openclaw`: browser gestito e isolato (nessuna estensione richiesta).
- `user`: profilo di collegamento Chrome MCP integrato per la tua **vera sessione Chrome con accesso effettuato**.

Per le chiamate allo strumento browser dell'agente:

- Predefinito: usa il browser isolato `openclaw`.
- Preferisci `profile="user"` quando le sessioni già connesse sono importanti e l'utente
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
      // dangerouslyAllowPrivateNetwork: true, // attiva solo per accesso affidabile a reti private
      // allowPrivateNetwork: true, // alias legacy
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override legacy a profilo singolo
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // timeout rilevamento Chrome gestito locale (ms)
    localCdpReadyTimeoutMs: 8000, // timeout readiness CDP locale post-avvio (ms)
    actionTimeoutMs: 60000, // timeout predefinito per le azioni browser (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // imposta 0 per disabilitare la pulizia per inattività
      maxTabsPerSession: 8, // imposta 0 per disabilitare il limite per sessione
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

- Il servizio di controllo si collega a loopback su una porta derivata da `gateway.port` (predefinito `18791` = gateway + 2). La sostituzione di `gateway.port` o `OPENCLAW_GATEWAY_PORT` sposta le porte derivate nella stessa famiglia.
- I profili locali `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl`; impostali solo per CDP remoto. `cdpUrl` usa per impostazione predefinita la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità HTTP CDP remoti e `attachOnly`
  e alle richieste HTTP di apertura schede; `remoteCdpHandshakeTimeoutMs` si applica ai
  relativi handshake WebSocket CDP.
- `localLaunchTimeoutMs` è il budget di tempo entro cui un processo Chrome gestito avviato localmente
  deve esporre il proprio endpoint HTTP CDP. `localCdpReadyTimeoutMs` è il
  budget successivo per la readiness del websocket CDP dopo che il processo è stato rilevato.
  Aumenta questi valori su Raspberry Pi, VPS di fascia bassa o hardware più vecchio in cui Chromium
  si avvia lentamente. I valori devono essere interi positivi fino a `120000` ms; i valori
  di configurazione non validi vengono rifiutati.
- `actionTimeoutMs` è il budget predefinito per le richieste browser `act` quando il chiamante non passa `timeoutMs`. Il trasporto client aggiunge una piccola finestra di tolleranza così le attese lunghe possono terminare invece di andare in timeout al confine HTTP.
- `tabCleanup` è una pulizia best-effort per le schede aperte dalle sessioni browser dell'agente principale. La pulizia del ciclo di vita di subagenti, Cron e ACP continua comunque a chiudere le rispettive schede tracciate esplicitamente al termine della sessione; le sessioni principali mantengono riutilizzabili le schede attive, poi chiudono in background le schede tracciate inattive o in eccesso.

</Accordion>

<Accordion title="Policy SSRF">

- La navigazione del browser e open-tab sono protette da SSRF prima della navigazione e ricontrollate in best-effort sull'URL finale `http(s)` in seguito.
- In modalità SSRF rigorosa, vengono controllati anche il rilevamento dell'endpoint CDP remoto e i probe `/json/version` (`cdpUrl`).
- Le variabili d'ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` del Gateway/provider non instradano automaticamente il browser gestito da OpenClaw tramite proxy. Il Chrome gestito viene avviato in modo diretto per impostazione predefinita, così le impostazioni proxy del provider non indeboliscono i controlli SSRF del browser.
- Per usare un proxy per il browser gestito stesso, passa flag proxy Chrome espliciti tramite `browser.extraArgs`, come `--proxy-server=...` o `--proxy-pac-url=...`. La modalità SSRF rigorosa blocca il routing esplicito del browser tramite proxy a meno che l'accesso del browser alla rete privata non sia stato intenzionalmente abilitato.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disattivato per impostazione predefinita; abilitalo solo quando l'accesso del browser alla rete privata è intenzionalmente considerato affidabile.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.

</Accordion>

<Accordion title="Comportamento del profilo">

- `attachOnly: true` significa non avviare mai un browser locale; collegarsi solo se ne è già in esecuzione uno.
- `headless` può essere impostato globalmente o per singolo profilo gestito locale. I valori per profilo sostituiscono `browser.headless`, quindi un profilo avviato localmente può restare headless mentre un altro rimane visibile.
- `POST /start?headless=true` e `openclaw browser start --headless` richiedono un
  avvio headless una tantum per i profili gestiti locali senza riscrivere
  `browser.headless` o la configurazione del profilo. I profili existing-session, attach-only e
  CDP remoto rifiutano l'override perché OpenClaw non avvia quei
  processi browser.
- Sugli host Linux senza `DISPLAY` o `WAYLAND_DISPLAY`, i profili gestiti locali
  passano automaticamente a headless per impostazione predefinita quando né l'ambiente né la configurazione
  del profilo/globale scelgono esplicitamente la modalità con interfaccia. `openclaw browser status --json`
  riporta `headlessSource` come `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` forza gli avvii gestiti locali in modalità headless per il
  processo corrente. `OPENCLAW_BROWSER_HEADLESS=0` forza la modalità con interfaccia per i normali
  avvii e restituisce un errore utilizzabile sugli host Linux senza display server;
  una richiesta esplicita `start --headless` ha comunque priorità per quel singolo avvio.
- `executablePath` può essere impostato globalmente o per singolo profilo gestito locale. I valori per profilo sostituiscono `browser.executablePath`, quindi profili gestiti diversi possono avviare browser diversi basati su Chromium. Entrambe le forme accettano `~` per la directory home del tuo OS.
- `color` (di livello superiore e per profilo) colora l'interfaccia del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (gestito standalone). Usa `defaultProfile: "user"` per scegliere il browser utente con accesso effettuato.
- Ordine di rilevamento automatico: browser predefinito del sistema se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP invece del CDP grezzo. Non impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo existing-session deve collegarsi a un profilo utente Chromium non predefinito (Brave, Edge, ecc.). Anche questo percorso accetta `~` per la directory home del tuo OS.

</Accordion>

</AccordionGroup>

## Usa Brave (o un altro browser basato su Chromium)

Se il tuo browser **predefinito di sistema** è basato su Chromium (Chrome/Brave/Edge/ecc),
OpenClaw lo usa automaticamente. Imposta `browser.executablePath` per sostituire il
rilevamento automatico. I valori `executablePath` di livello superiore e per profilo accettano `~`
per la directory home del tuo OS:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
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

`executablePath` per profilo influisce solo sui profili gestiti locali che OpenClaw
avvia. I profili `existing-session` si collegano invece a un browser già in esecuzione
e i profili CDP remoti usano il browser dietro `cdpUrl`.

## Controllo locale vs remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo loopback e può lanciare un browser locale.
- **Controllo remoto (host node):** esegui un host node sulla macchina che ha il browser; il Gateway instrada tramite proxy le azioni del browser verso di esso.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non lancerà un browser locale.
- Per servizi CDP gestiti esternamente su loopback (per esempio Browserless in
  Docker pubblicato su `127.0.0.1`), imposta anche `attachOnly: true`. Un CDP loopback
  senza `attachOnly` viene trattato come un profilo browser locale gestito da OpenClaw.
- `headless` influisce solo sui profili gestiti locali che OpenClaw avvia. Non riavvia né modifica browser `existing-session` o CDP remoti.
- `executablePath` segue la stessa regola dei profili gestiti locali. Modificarlo su un
  profilo gestito locale in esecuzione contrassegna quel profilo per riavvio/riconciliazione così il
  lancio successivo usa il nuovo binario.

Il comportamento all'arresto varia in base alla modalità del profilo:

- profili gestiti locali: `openclaw browser stop` arresta il processo browser che
  OpenClaw ha avviato
- profili attach-only e CDP remoti: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia gli override di emulazione Playwright/CDP (viewport,
  schema colori, lingua, fuso orario, modalità offline e stato simile), anche
  se nessun processo browser è stato lanciato da OpenClaw

Gli URL CDP remoti possono includere autenticazione:

- Token di query (ad esempio `https://provider.example?token=<token>`)
- Autenticazione HTTP Basic (ad esempio `https://user:pass@provider.example`)

OpenClaw preserva l'autenticazione quando chiama gli endpoint `/json/*` e quando si connette
al WebSocket CDP. Preferisci variabili d'ambiente o gestori di segreti per i
token invece di inserirli nei file di configurazione.

## Proxy browser node (predefinito zero-config)

Se esegui un **host node** sulla macchina che ha il tuo browser, OpenClaw può
instradare automaticamente le chiamate allo strumento browser verso quel node senza alcuna configurazione browser aggiuntiva.
Questo è il percorso predefinito per i gateway remoti.

Note:

- L'host node espone il suo server di controllo browser locale tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del node stesso (come in locale).
- `nodeHost.browserProxy.allowProfiles` è facoltativo. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati restano raggiungibili tramite il proxy, incluse le route di creazione/eliminazione del profilo.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come un confine di privilegio minimo: solo i profili nella allowlist possono essere selezionati e le route persistenti di creazione/eliminazione del profilo vengono bloccate sulla superficie proxy.
- Disabilitalo se non lo vuoi:
  - Sul node: `nodeHost.browserProxy.enabled=false`
  - Sul gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto ospitato)

[Browserless](https://browserless.io) è un servizio Chromium ospitato che espone
URL di connessione CDP su HTTPS e WebSocket. OpenClaw può usare entrambe le forme, ma
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
  rilevi `/json/version`.

### Browserless Docker sullo stesso host

Quando Browserless è self-hosted in Docker e OpenClaw gira sull'host, tratta
Browserless come un servizio CDP gestito esternamente:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

L'indirizzo in `browser.profiles.browserless.cdpUrl` deve essere raggiungibile dal
processo OpenClaw. Browserless deve anche annunciare un endpoint raggiungibile corrispondente;
imposta Browserless `EXTERNAL` su quella stessa base WebSocket pubblica-verso-OpenClaw, come
`ws://127.0.0.1:3000`, `ws://browserless:3000` o un indirizzo Docker privato stabile
di rete. Se `/json/version` restituisce `webSocketDebuggerUrl` che punta a
un indirizzo che OpenClaw non può raggiungere, l'HTTP CDP può sembrare sano mentre il collegamento
WebSocket continua a fallire.

Non lasciare `attachOnly` non impostato per un profilo Browserless su loopback. Senza
`attachOnly`, OpenClaw tratta la porta loopback come un profilo browser locale gestito
e può segnalare che la porta è in uso ma non è di proprietà di OpenClaw.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** invece della
discovery CDP standard basata su HTTP (`/json/version`). OpenClaw accetta tre
forme di URL CDP e sceglie automaticamente la strategia di connessione corretta:

- **Discovery HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw chiama `/json/version` per rilevare l'URL del debugger WebSocket, quindi
  si connette. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si connette direttamente tramite handshake WebSocket e salta
  completamente `/json/version`.
- **Radici WebSocket pure** — `ws://host[:port]` o `wss://host[:port]` senza
  percorso `/devtools/...` (ad es. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw prova prima la
  discovery HTTP `/json/version` (normalizzando lo schema in `http`/`https`);
  se la discovery restituisce un `webSocketDebuggerUrl`, viene usato, altrimenti OpenClaw
  ricorre a un handshake WebSocket diretto sulla radice pura. Se l'endpoint WebSocket
  annunciato rifiuta l'handshake CDP ma la radice pura configurata
  lo accetta, OpenClaw ricorre anche a quella radice. Questo consente a un `ws://` puro
  puntato a un Chrome locale di connettersi comunque, poiché Chrome accetta upgrade
  WebSocket solo sul percorso specifico per target da `/json/version`, mentre i provider
  ospitati possono ancora usare il loro endpoint WebSocket di radice quando il loro endpoint di discovery
  annuncia un URL di breve durata non adatto al Playwright CDP.

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
- Sostituisci `<BROWSERBASE_API_KEY>` con la tua API key Browserbase reale.
- Browserbase crea automaticamente una sessione browser alla connessione WebSocket, quindi
  non è necessario alcun passaggio manuale di creazione sessione.
- Il piano gratuito consente una sessione concorrente e un'ora browser al mese.
  Vedi [prezzi](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Vedi la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento API completo,
  le guide SDK e gli esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo del browser è solo loopback; l'accesso passa attraverso l'autenticazione del Gateway o l'abbinamento node.
- L'API HTTP browser loopback standalone usa **solo autenticazione con segreto condiviso**:
  bearer auth con token gateway, `x-openclaw-password` o autenticazione HTTP Basic con la
  password gateway configurata.
- Gli header di identità Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **non**
  autenticano questa API browser loopback standalone.
- Se il controllo browser è abilitato e non è configurata alcuna autenticazione con segreto condiviso, OpenClaw
  genera automaticamente `gateway.auth.token` all'avvio e lo salva nella configurazione.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è
  già `password`, `none` o `trusted-proxy`.
- Mantieni il Gateway e qualsiasi host node su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta URL/token CDP remoti come segreti; preferisci variabili d'ambiente o un gestore di segreti.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token di breve durata quando possibile.
- Evita di incorporare direttamente token di lunga durata nei file di configurazione.

## Profili (multi-browser)

OpenClaw supporta più profili con nome (configurazioni di routing). I profili possono essere:

- **gestiti da OpenClaw**: un'istanza dedicata di browser basato su Chromium con propria directory dati utente + porta CDP
- **remoti**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite connessione automatica Chrome DevTools MCP

Predefiniti:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per il collegamento existing-session Chrome MCP.
- I profili existing-session sono opt-in oltre a `user`; creali con `--driver existing-session`.
- Le porte CDP locali vengono allocate da **18800–18899** per impostazione predefinita.
- Eliminare un profilo sposta la sua directory dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Sessione esistente tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium in esecuzione tramite il
server MCP ufficiale di Chrome DevTools. Questo riutilizza le schede e lo stato di accesso
già aperti in quel profilo browser.

Riferimenti ufficiali di contesto e configurazione:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Facoltativo: crea il tuo profilo existing-session personalizzato se vuoi un
nome, colore o directory dati browser diversi.

Comportamento predefinito:

- Il profilo `user` integrato usa la connessione automatica Chrome MCP, che punta al
  profilo locale predefinito di Google Chrome.

Usa `userDataDir` per Brave, Edge, Chromium o un profilo Chrome non predefinito.
`~` viene espanso nella directory home del tuo OS:

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

Test smoke di collegamento live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Come si presenta il successo:

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
  Chrome sia installato localmente per i profili predefiniti con connessione automatica, ma non può
  abilitare per te il debug remoto dal lato browser

Uso da parte dell'agente:

- Usa `profile="user"` quando hai bisogno dello stato del browser connesso dell'utente.
- Se usi un profilo existing-session personalizzato, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare il prompt di collegamento.
- il Gateway o l'host node possono avviare `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso del profilo isolato `openclaw` perché può
  agire all'interno della tua sessione browser con accesso effettuato.
- OpenClaw non avvia il browser per questo driver; si limita a collegarsi.
- OpenClaw usa qui il flusso ufficiale `--autoConnect` di Chrome DevTools MCP. Se
  `userDataDir` è impostato, viene passato per puntare a quella directory dati utente.
- existing-session può collegarsi sull'host selezionato o tramite un
  browser node connesso. Se Chrome si trova altrove e nessun browser node è connesso, usa
  invece CDP remoto o un host node.

### Avvio personalizzato di Chrome MCP

Sostituisci il server Chrome DevTools MCP avviato per profilo quando il flusso predefinito
`npx chrome-devtools-mcp@latest` non è quello che vuoi (host offline,
versioni fissate, binari vendorizzati):

| Field        | What it does                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Eseguibile da avviare al posto di `npx`. Risolto così com'è; i percorsi assoluti vengono rispettati.                      |
| `mcpArgs`    | Array di argomenti passata letteralmente a `mcpCommand`. Sostituisce gli argomenti predefiniti `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` è impostato su un profilo existing-session, OpenClaw salta
`--autoConnect` e inoltra automaticamente l'endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint di discovery HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP diretto).

I flag endpoint e `userDataDir` non possono essere combinati: quando `cdpUrl` è impostato,
`userDataDir` viene ignorato per l'avvio di Chrome MCP, poiché Chrome MCP si collega al
browser in esecuzione dietro l'endpoint invece di aprire una directory
profilo.

<Accordion title="Limitazioni delle funzionalità existing-session">

Rispetto al profilo gestito `openclaw`, i driver existing-session sono più limitati:

- **Screenshot** — le catture della pagina e le catture degli elementi con `--ref` funzionano; i selettori CSS `--element` no. `--full-page` non può essere combinato con `--ref` o `--element`. Playwright non è richiesto per screenshot della pagina o dell'elemento basato su ref.
- **Azioni** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono ref di snapshot (nessun selettore CSS). `click-coords` fa clic su coordinate visibili del viewport e non richiede un ref di snapshot. `click` supporta solo il pulsante sinistro. `type` non supporta `slowly=true`; usa `fill` o `press`. `press` non supporta `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ed `evaluate` non supportano timeout per chiamata. `select` accetta un singolo valore.
- **Attesa / upload / dialog** — `wait --url` supporta pattern esatti, sottostringhe e glob; `wait --load networkidle` non è supportato. Gli hook di upload richiedono `ref` o `inputRef`, un file alla volta, senza CSS `element`. Gli hook di dialog non supportano override del timeout.
- **Funzionalità solo gestite** — azioni batch, esportazione PDF, intercettazione dei download e `responsebody` richiedono ancora il percorso browser gestito.

</Accordion>

## Garanzie di isolamento

- **Directory dati utente dedicata**: non tocca mai il tuo profilo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con i flussi di lavoro di sviluppo.
- **Controllo deterministico delle schede**: `tabs` restituisce prima `suggestedTargetId`, poi
  handle `tabId` stabili come `t1`, etichette facoltative e il `targetId` grezzo.
  Gli agenti dovrebbero riutilizzare `suggestedTargetId`; gli ID grezzi restano disponibili per
  debug e compatibilità.

## Selezione del browser

Quando esegue l'avvio locale, OpenClaw sceglie il primo disponibile:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puoi sostituirlo con `browser.executablePath`.

Piattaforme:

- macOS: controlla `/Applications` e `~/Applications`.
- Linux: controlla i percorsi comuni di Chrome/Brave/Edge/Chromium sotto `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`.
- Windows: controlla le posizioni di installazione comuni.

## API di controllo (facoltativa)

Per scripting e debug, il Gateway espone una piccola **API HTTP di controllo
solo loopback** più una CLI `openclaw browser` corrispondente (snapshot, ref, potenziamenti di attesa,
output JSON, flussi di debug). Vedi
[API di controllo del browser](/it/tools/browser-control) per il riferimento completo.

## Risoluzione dei problemi

Per problemi specifici di Linux (soprattutto snap Chromium), vedi
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni split-host con Gateway WSL2 + Chrome Windows, vedi
[Risoluzione dei problemi WSL2 + Windows + CDP remoto Chrome](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP vs blocco SSRF della navigazione

Si tratta di classi di errore diverse e indicano percorsi di codice diversi.

- **Errore di avvio o readiness CDP** significa che OpenClaw non può confermare che il control plane del browser sia sano.
- **Blocco SSRF della navigazione** significa che il control plane del browser è sano, ma una destinazione di navigazione della pagina viene rifiutata dalla policy.

Esempi comuni:

- Errore di avvio o readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando un
    servizio CDP esterno loopback è configurato senza `attachOnly: true`
- Blocco SSRF della navigazione:
  - i flussi `open`, `navigate`, snapshot o apertura schede falliscono con un errore di policy browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per distinguere i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come leggere i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima la readiness CDP.
- Se `start` riesce ma `tabs` fallisce, il control plane è ancora non sano. Tratta questo come un problema di raggiungibilità CDP, non come un problema di navigazione della pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il control plane del browser è attivo e l'errore è nella policy di navigazione o nella pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso di controllo di base del browser gestito è sano.

Dettagli importanti sul comportamento:

- La configurazione browser usa per impostazione predefinita un oggetto policy SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito locale loopback `openclaw`, i controlli di stato CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il control plane locale di OpenClaw.
- La protezione della navigazione è separata. Un risultato positivo di `start` o `tabs` non significa che una destinazione successiva di `open` o `navigate` sia consentita.

Guida alla sicurezza:

- **Non** allentare la policy SSRF del browser per impostazione predefinita.
- Preferisci eccezioni host ristrette come `hostnameAllowlist` o `allowedHostnames` rispetto a un ampio accesso alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente affidabili in cui l'accesso del browser alla rete privata è richiesto e verificato.

## Strumenti dell'agente + funzionamento del controllo

L'agente riceve **uno strumento** per l'automazione del browser:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mappatura:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per fare clic/digitare/trascinare/selezionare.
- `browser screenshot` acquisisce i pixel (pagina intera, elemento o ref etichettati).
- `browser doctor` controlla Gateway, Plugin, profilo, browser e readiness della scheda.
- `browser` accetta:
  - `profile` per scegliere un profilo browser con nome (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove si trova il browser.
  - Nelle sessioni sandbox, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` viene omesso: le sessioni sandbox usano per impostazione predefinita `sandbox`, le sessioni non sandbox usano per impostazione predefinita `host`.
  - Se è connesso un node capace di browser, lo strumento può instradarsi automaticamente a esso a meno che tu non fissi `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica strumenti](/it/tools) — tutti gli strumenti agente disponibili
- [Sandboxing](/it/gateway/sandboxing) — controllo del browser in ambienti sandbox
- [Sicurezza](/it/gateway/security) — rischi del controllo browser e hardening
