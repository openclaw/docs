---
read_when:
    - Aggiungere l'automazione del browser controllata dall'agente
    - Debug del motivo per cui OpenClaw interferisce con il tuo Chrome
    - Implementazione delle impostazioni del browser + ciclo di vita nell'app macOS
summary: Servizio integrato di controllo del browser + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-05-06T09:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw può eseguire un **profilo Chrome/Brave/Edge/Chromium dedicato** controllato dall'agente.
È isolato dal tuo browser personale ed è gestito tramite un piccolo servizio di
controllo locale all'interno del Gateway (solo loopback).

Vista per principianti:

- Consideralo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il profilo del tuo browser personale.
- L'agente può **aprire schede, leggere pagine, fare clic e digitare** in una corsia sicura.
- Il profilo `user` integrato si collega alla tua vera sessione Chrome con accesso effettuato tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenco/apertura/focus/chiusura).
- Azioni dell'agente (clic/digitazione/trascinamento/selezione), snapshot, screenshot, PDF.
- Una skill `browser-automation` inclusa che insegna agli agenti il ciclo di recupero per snapshot,
  schede stabili, riferimenti obsoleti e blocchi manuali quando il Plugin browser
  è abilitato.
- Supporto opzionale per più profili (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo strumento quotidiano. È una superficie sicura e isolata per
l'automazione e la verifica dell'agente.

## Avvio rapido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se ricevi "Browser disabled", abilitalo nella configurazione (vedi sotto) e riavvia il
Gateway.

Se `openclaw browser` manca del tutto, o l'agente dice che lo strumento browser
non è disponibile, vai a [Comando o strumento browser mancante](/it/tools/browser#missing-browser-command-or-tool).

## Controllo del Plugin

Lo strumento `browser` predefinito è un Plugin incluso. Disabilitalo per sostituirlo con un altro Plugin che registra lo stesso nome strumento `browser`:

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

Le impostazioni predefinite richiedono sia `plugins.entries.browser.enabled` **sia** `browser.enabled=true`. Disabilitare solo il Plugin rimuove la CLI `openclaw browser`, il metodo Gateway `browser.request`, lo strumento dell'agente e il servizio di controllo come un'unica unità; la tua configurazione `browser.*` resta intatta per un sostituto.

Le modifiche alla configurazione del browser richiedono un riavvio del Gateway affinché il Plugin possa registrare di nuovo il suo servizio.

## Guida per l'agente

Nota sul profilo strumenti: `tools.profile: "coding"` include `web_search` e
`web_fetch`, ma non include lo strumento `browser` completo. Se l'agente o un
sotto-agente generato deve usare l'automazione del browser, aggiungi browser nella fase
del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Per un singolo agente, usa `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` da solo non basta perché la policy del sotto-agente
viene applicata dopo il filtro del profilo.

Il Plugin browser fornisce due livelli di guida per l'agente:

- La descrizione dello strumento `browser` contiene il contratto compatto sempre attivo: scegli
  il profilo giusto, mantieni i riferimenti sulla stessa scheda, usa `tabId`/etichette per il
  targeting delle schede e carica la skill browser per lavoro in più passaggi.
- La skill `browser-automation` inclusa contiene il ciclo operativo più esteso:
  controlla prima stato/schede, etichetta le schede del task, acquisisci uno snapshot prima di agire, acquisiscine uno nuovo
  dopo modifiche dell'interfaccia, recupera una volta i riferimenti obsoleti e segnala login/2FA/captcha oppure
  blocchi di fotocamera/microfono come azione manuale invece di tirare a indovinare.

Le Skills incluse nel Plugin sono elencate tra le skill disponibili dell'agente quando il
Plugin è abilitato. Le istruzioni complete della skill vengono caricate su richiesta, quindi i turni
di routine non pagano l'intero costo in token.

## Comando o strumento browser mancante

Se `openclaw browser` è sconosciuto dopo un aggiornamento, `browser.request` manca, o l'agente segnala lo strumento browser come non disponibile, la causa abituale è un elenco `plugins.allow` che omette `browser` e nessun blocco di configurazione root `browser` esiste. Aggiungilo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un blocco root `browser` esplicito, per esempio `browser.enabled=true` o `browser.profiles.<name>`, attiva il Plugin browser incluso anche con un `plugins.allow` restrittivo, allineandosi al comportamento della configurazione dei canali. `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` non sostituiscono da soli l'appartenenza all'allowlist. Anche rimuovere del tutto `plugins.allow` ripristina il valore predefinito.

## Profili: `openclaw` rispetto a `user`

- `openclaw`: browser gestito e isolato (nessuna estensione richiesta).
- `user`: profilo integrato di collegamento Chrome MCP per la tua **vera sessione Chrome con accesso effettuato**.

Per le chiamate allo strumento browser dell'agente:

- Predefinito: usa il browser isolato `openclaw`.
- Preferisci `profile="user"` quando contano sessioni con accesso già effettuato e l'utente
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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

- Il servizio di controllo si associa al loopback su una porta derivata da `gateway.port` (predefinita `18791` = gateway + 2). L'override di `gateway.port` o `OPENCLAW_GATEWAY_PORT` sposta le porte derivate nella stessa famiglia.
- I profili `openclaw` locali assegnano automaticamente `cdpPort`/`cdpUrl`; impostali solo per CDP remoto. `cdpUrl` usa per impostazione predefinita la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità HTTP CDP remoti e `attachOnly`
  e alle richieste HTTP di apertura scheda; `remoteCdpHandshakeTimeoutMs` si applica
  ai relativi handshake WebSocket CDP.
- `localLaunchTimeoutMs` è il budget per un processo Chrome gestito avviato localmente
  per esporre il suo endpoint HTTP CDP. `localCdpReadyTimeoutMs` è il
  budget successivo per la disponibilità del websocket CDP dopo che il processo è stato individuato.
  Aumenta questi valori su Raspberry Pi, VPS di fascia bassa o hardware più vecchio dove Chromium
  si avvia lentamente. I valori devono essere interi positivi fino a `120000` ms; i valori di
  configurazione non validi vengono rifiutati.
- I ripetuti errori di avvio/disponibilità di Chrome gestito vengono interrotti da circuit breaker per
  profilo. Dopo diversi errori consecutivi, OpenClaw mette brevemente in pausa i nuovi tentativi
  di avvio invece di generare Chromium a ogni chiamata dello strumento browser. Correggi
  il problema di avvio, disabilita il browser se non serve, oppure riavvia il
  Gateway dopo la riparazione.
- `actionTimeoutMs` è il budget predefinito per le richieste `act` del browser quando il chiamante non passa `timeoutMs`. Il trasporto client aggiunge una piccola finestra di margine affinché le attese lunghe possano terminare invece di scadere al confine HTTP.
- `tabCleanup` è una pulizia best-effort per le schede aperte dalle sessioni browser dell'agente principale. La pulizia del ciclo di vita di sottoagenti, cron e ACP chiude comunque le loro schede tracciate esplicite alla fine della sessione; le sessioni principali mantengono riutilizzabili le schede attive, poi chiudono in background le schede tracciate inattive o in eccesso.

</Accordion>

<Accordion title="Policy SSRF">

- La navigazione del browser e l'apertura di schede sono protette da SSRF prima della navigazione e ricontrollate best-effort sull'URL `http(s)` finale in seguito.
- In modalità SSRF rigorosa, vengono controllati anche il rilevamento degli endpoint CDP remoti e le sonde `/json/version` (`cdpUrl`).
- Le variabili d'ambiente Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` non applicano automaticamente il proxy al browser gestito da OpenClaw. Chrome gestito si avvia diretto per impostazione predefinita, quindi le impostazioni proxy del provider non indeboliscono i controlli SSRF del browser.
- Per applicare il proxy al browser gestito stesso, passa flag proxy Chrome espliciti tramite `browser.extraArgs`, come `--proxy-server=...` o `--proxy-pac-url=...`. La modalità SSRF rigorosa blocca il routing proxy esplicito del browser a meno che l'accesso del browser alla rete privata non sia abilitato intenzionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disattivato per impostazione predefinita; abilitalo solo quando l'accesso del browser alla rete privata è considerato intenzionalmente affidabile.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.

</Accordion>

<Accordion title="Comportamento del profilo">

- `attachOnly: true` significa non avviare mai un browser locale; collegarsi solo se uno è già in esecuzione.
- `headless` può essere impostato globalmente o per profilo gestito locale. I valori per profilo sovrascrivono `browser.headless`, quindi un profilo avviato localmente può rimanere headless mentre un altro resta visibile.
- `POST /start?headless=true` e `openclaw browser start --headless` richiedono un avvio headless
  una tantum per i profili gestiti locali senza riscrivere
  `browser.headless` o la configurazione del profilo. I profili con sessione esistente, solo collegamento e
  CDP remoti rifiutano la sovrascrittura perché OpenClaw non avvia quei
  processi del browser.
- Sugli host Linux senza `DISPLAY` o `WAYLAND_DISPLAY`, i profili gestiti locali
  passano automaticamente alla modalità headless quando né l'ambiente né la configurazione del profilo/globale
  scelgono esplicitamente la modalità con interfaccia. `openclaw browser status --json`
  riporta `headlessSource` come `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` forza gli avvii gestiti locali in modalità headless per il
  processo corrente. `OPENCLAW_BROWSER_HEADLESS=0` forza la modalità con interfaccia per gli avvii
  ordinari e restituisce un errore utilizzabile sugli host Linux senza un server display;
  una richiesta esplicita `start --headless` continua ad avere la precedenza per quel singolo avvio.
- `executablePath` può essere impostato globalmente o per profilo gestito locale. I valori per profilo sovrascrivono `browser.executablePath`, quindi profili gestiti diversi possono avviare browser diversi basati su Chromium. Entrambe le forme accettano `~` per la directory home del tuo sistema operativo.
- `color` (di primo livello e per profilo) tinge l'interfaccia del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (standalone gestito). Usa `defaultProfile: "user"` per scegliere il browser dell'utente connesso.
- Ordine di rilevamento automatico: browser predefinito di sistema se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP invece di CDP grezzo. Non impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo con sessione esistente deve collegarsi a un profilo utente Chromium non predefinito (Brave, Edge, ecc.). Questo percorso accetta anche `~` per la directory home del tuo sistema operativo.

</Accordion>

</AccordionGroup>

## Usa Brave o un altro browser basato su Chromium

Se il tuo browser **predefinito di sistema** è basato su Chromium (Chrome/Brave/Edge/ecc),
OpenClaw lo usa automaticamente. Imposta `browser.executablePath` per sovrascrivere
il rilevamento automatico. I valori `executablePath` di primo livello e per profilo accettano `~`
per la directory home del tuo sistema operativo:

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

## Controllo locale e remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo local loopback e può avviare un browser locale.
- **Controllo remoto (host Node):** esegui un host Node sulla macchina che ha il browser; il Gateway inoltra le azioni del browser a esso.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non avvierà un browser locale.
- Per i servizi CDP gestiti esternamente su loopback (per esempio Browserless in
  Docker pubblicato su `127.0.0.1`), imposta anche `attachOnly: true`. CDP loopback
  senza `attachOnly` viene trattato come un profilo browser locale gestito da OpenClaw.
- `headless` influisce solo sui profili gestiti locali che OpenClaw avvia. Non riavvia né modifica browser con sessione esistente o CDP remoti.
- `executablePath` segue la stessa regola dei profili gestiti locali. Modificarlo su un
  profilo gestito locale in esecuzione contrassegna quel profilo per riavvio/riconciliazione così che
  il prossimo avvio usi il nuovo binario.

Il comportamento di arresto varia in base alla modalità del profilo:

- profili gestiti locali: `openclaw browser stop` arresta il processo del browser che
  OpenClaw ha avviato
- profili solo collegamento e CDP remoti: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia le sovrascritture di emulazione Playwright/CDP (viewport,
  schema colori, locale, fuso orario, modalità offline e stato simile), anche
  se nessun processo del browser è stato avviato da OpenClaw

Gli URL CDP remoti possono includere autenticazione:

- Token di query (ad es., `https://provider.example?token=<token>`)
- Autenticazione HTTP Basic (ad es., `https://user:pass@provider.example`)

OpenClaw conserva l'autenticazione quando chiama gli endpoint `/json/*` e quando si connette
al WebSocket CDP. Preferisci variabili d'ambiente o gestori di segreti per i
token invece di inserirli nei file di configurazione.

## Proxy browser Node (predefinito a configurazione zero)

Se esegui un **host Node** sulla macchina che ha il tuo browser, OpenClaw può
instradare automaticamente le chiamate degli strumenti browser a quel Node senza configurazione browser aggiuntiva.
Questo è il percorso predefinito per i Gateway remoti.

Note:

- L'host Node espone il proprio server locale di controllo del browser tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del Node stesso (come in locale).
- `nodeHost.browserProxy.allowProfiles` è facoltativo. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati rimangono raggiungibili tramite il proxy, incluse le route di creazione/eliminazione profilo.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come un confine di privilegio minimo: possono essere presi di mira solo i profili nella allowlist e le route persistenti di creazione/eliminazione profilo sono bloccate sulla superficie proxy.
- Disabilitalo se non lo vuoi:
  - Sul Node: `nodeHost.browserProxy.enabled=false`
  - Sul Gateway: `gateway.nodes.browser.mode="off"`

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
- Scegli l'endpoint della regione che corrisponde al tuo account Browserless (vedi la loro documentazione).
- Se Browserless ti fornisce un URL base HTTPS, puoi convertirlo in
  `wss://` per una connessione CDP diretta oppure mantenere l'URL HTTPS e lasciare che OpenClaw
  rilevi `/json/version`.

### Browserless Docker sullo stesso host

Quando Browserless è self-hosted in Docker e OpenClaw viene eseguito sull'host, tratta
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
processo OpenClaw. Browserless deve anche pubblicizzare un endpoint raggiungibile corrispondente;
imposta `EXTERNAL` di Browserless sulla stessa base WebSocket da pubblico a OpenClaw, come
`ws://127.0.0.1:3000`, `ws://browserless:3000` o un indirizzo di rete Docker
privata stabile. Se `/json/version` restituisce `webSocketDebuggerUrl` che punta a
un indirizzo che OpenClaw non può raggiungere, HTTP CDP può apparire funzionante mentre il collegamento
WebSocket continua a fallire.

Non lasciare `attachOnly` non impostato per un profilo Browserless loopback. Senza
`attachOnly`, OpenClaw tratta la porta loopback come un profilo browser gestito locale
e può segnalare che la porta è in uso ma non è di proprietà di OpenClaw.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** invece della
rilevazione CDP standard basata su HTTP (`/json/version`). OpenClaw accetta tre
forme di URL CDP e sceglie automaticamente la strategia di connessione corretta:

- **Rilevazione HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw chiama `/json/version` per rilevare l'URL debugger WebSocket, quindi
  si connette. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si connette direttamente tramite handshake WebSocket e salta
  completamente `/json/version`.
- **Radici WebSocket nude** - `ws://host[:port]` o `wss://host[:port]` senza
  percorso `/devtools/...` (ad es. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw prova prima la rilevazione HTTP
  `/json/version` (normalizzando lo schema in `http`/`https`);
  se la rilevazione restituisce un `webSocketDebuggerUrl` viene usato, altrimenti OpenClaw
  ripiega su un handshake WebSocket diretto alla radice nuda. Se l'endpoint
  WebSocket pubblicizzato rifiuta l'handshake CDP ma la radice nuda configurata
  lo accetta, OpenClaw ripiega anche su quella radice. Questo consente a un `ws://` nudo
  puntato a un Chrome locale di connettersi comunque, poiché Chrome accetta upgrade WebSocket
  solo sullo specifico percorso per target da `/json/version`, mentre i provider
  ospitati possono continuare a usare il proprio endpoint WebSocket radice quando il loro endpoint
  di rilevazione pubblicizza un URL di breve durata non adatto a Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) è una piattaforma cloud per eseguire
browser headless con risoluzione CAPTCHA integrata, modalità stealth e proxy residenziali.

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
  dalla [dashboard di panoramica](https://www.browserbase.com/overview).
- Sostituisci `<BROWSERBASE_API_KEY>` con la tua chiave API Browserbase reale.
- Browserbase crea automaticamente una sessione browser alla connessione WebSocket, quindi non
  è necessario alcun passaggio manuale di creazione sessione.
- Il livello gratuito consente una sessione concorrente e un'ora browser al mese.
  Consulta i [prezzi](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Consulta la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento API
  completo, le guide SDK e gli esempi di integrazione.

## Sicurezza

Idee chiave:

- Il controllo del browser è solo loopback; l'accesso passa attraverso l'autenticazione del Gateway o l'abbinamento del Node.
- L'API HTTP standalone del browser loopback usa **solo autenticazione a segreto condiviso**:
  autenticazione bearer con token del gateway, `x-openclaw-password` o autenticazione HTTP Basic con la
  password del gateway configurata.
- Gli header di identità di Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **non**
  autenticano questa API standalone del browser loopback.
- Se il controllo del browser è abilitato e non è configurata alcuna autenticazione a segreto condiviso, OpenClaw
  genera automaticamente `gateway.auth.token` all'avvio e lo persiste nella configurazione.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è
  già `password`, `none` o `trusted-proxy`.
- Mantieni il Gateway e qualsiasi host Node su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta gli URL/token CDP remoti come segreti; preferisci variabili d'ambiente o un gestore di segreti.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token di breve durata quando possibile.
- Evita di incorporare token di lunga durata direttamente nei file di configurazione.

## Profili (multi-browser)

OpenClaw supporta più profili denominati (configurazioni di routing). I profili possono essere:

- **openclaw-managed**: un'istanza browser dedicata basata su Chromium con la propria directory dei dati utente + porta CDP
- **remoto**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite connessione automatica Chrome DevTools MCP

Impostazioni predefinite:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per l'attach a una sessione esistente Chrome MCP.
- I profili di sessione esistente sono opt-in oltre a `user`; creali con `--driver existing-session`.
- Le porte CDP locali sono allocate da **18800-18899** per impostazione predefinita.
- Eliminare un profilo sposta la sua directory dei dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Sessione esistente tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium già in esecuzione tramite il
server ufficiale Chrome DevTools MCP. Questo riutilizza le schede e lo stato di accesso
già aperti in quel profilo browser.

Riferimenti ufficiali di contesto e configurazione:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Facoltativo: crea un tuo profilo personalizzato di sessione esistente se vuoi un
nome, colore o directory dei dati del browser diversi.

Comportamento predefinito:

- Il profilo integrato `user` usa la connessione automatica Chrome MCP, che punta al
  profilo locale predefinito di Google Chrome.

Usa `userDataDir` per Brave, Edge, Chromium o un profilo Chrome non predefinito.
`~` si espande alla directory home del tuo sistema operativo:

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

Poi nel browser corrispondente:

1. Apri la pagina inspect di quel browser per il debug remoto.
2. Abilita il debug remoto.
3. Mantieni il browser in esecuzione e approva la richiesta di connessione quando OpenClaw si collega.

Pagine inspect comuni:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test di attach live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Come si presenta un esito positivo:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` elenca le schede del browser già aperte
- `snapshot` restituisce ref dalla scheda live selezionata

Cosa controllare se l'attach non funziona:

- il browser di destinazione basato su Chromium è alla versione `144+`
- il debug remoto è abilitato nella pagina inspect di quel browser
- il browser ha mostrato la richiesta di consenso all'attach e tu l'hai accettata
- `openclaw doctor` migra la vecchia configurazione del browser basata su Plugin e controlla che
  Chrome sia installato localmente per i profili predefiniti con connessione automatica, ma non può
  abilitare per te il debug remoto lato browser

Uso da parte dell'agente:

- Usa `profile="user"` quando ti serve lo stato del browser con accesso dell'utente.
- Se usi un profilo personalizzato di sessione esistente, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare la richiesta
  di attach.
- il Gateway o l'host Node può generare `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso rispetto al profilo isolato `openclaw` perché può
  agire all'interno della tua sessione browser autenticata.
- OpenClaw non avvia il browser per questo driver; si collega soltanto.
- OpenClaw usa qui il flusso ufficiale Chrome DevTools MCP `--autoConnect`. Se
  `userDataDir` è impostato, viene passato per puntare a quella directory dei dati utente.
- existing-session può collegarsi sull'host selezionato o tramite un
  Node browser connesso. Se Chrome si trova altrove e nessun Node browser è connesso, usa
  CDP remoto o un host Node.

### Avvio Chrome MCP personalizzato

Sostituisci il server Chrome DevTools MCP generato per profilo quando il flusso predefinito
`npx chrome-devtools-mcp@latest` non è quello che vuoi (host offline,
versioni bloccate, binari inclusi nel vendor):

| Campo        | Cosa fa                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Eseguibile da generare invece di `npx`. Risolto così com'è; i percorsi assoluti sono rispettati.                                          |
| `mcpArgs`    | Array di argomenti passato verbatim a `mcpCommand`. Sostituisce gli argomenti predefiniti `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` è impostato su un profilo existing-session, OpenClaw salta
`--autoConnect` e inoltra automaticamente l'endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint di discovery HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP diretto).

I flag endpoint e `userDataDir` non possono essere combinati: quando `cdpUrl` è impostato,
`userDataDir` viene ignorato per l'avvio di Chrome MCP, poiché Chrome MCP si collega al
browser in esecuzione dietro l'endpoint invece di aprire una directory
profilo.

<Accordion title="Existing-session feature limitations">

Rispetto al profilo gestito `openclaw`, i driver existing-session sono più vincolati:

- **Screenshot** - le acquisizioni pagina e le acquisizioni elemento `--ref` funzionano; i selettori CSS `--element` no. `--full-page` non può essere combinato con `--ref` o `--element`. Playwright non è richiesto per screenshot di pagina o di elementi basati su ref.
- **Azioni** - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono ref di snapshot (nessun selettore CSS). `click-coords` fa clic su coordinate visibili del viewport e non richiede un ref di snapshot. `click` usa solo il pulsante sinistro. `type` non supporta `slowly=true`; usa `fill` o `press`. `press` non supporta `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ed `evaluate` non supportano timeout per chiamata. `select` accetta un singolo valore.
- **Attesa / upload / finestra di dialogo** - `wait --url` supporta pattern esatti, substring e glob; `wait --load networkidle` non è supportato. Gli hook di upload richiedono `ref` o `inputRef`, un file alla volta, nessun `element` CSS. Gli hook delle finestre di dialogo non supportano override dei timeout.
- **Funzionalità solo gestite** - azioni batch, esportazione PDF, intercettazione dei download e `responsebody` richiedono ancora il percorso browser gestito.

</Accordion>

## Garanzie di isolamento

- **Directory dedicata dei dati utente**: non tocca mai il tuo profilo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con i workflow di sviluppo.
- **Controllo deterministico delle schede**: `tabs` restituisce prima `suggestedTargetId`, poi
  handle `tabId` stabili come `t1`, etichette facoltative e il `targetId` grezzo.
  Gli agenti dovrebbero riutilizzare `suggestedTargetId`; gli ID grezzi restano disponibili per
  debug e compatibilità.

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
- Linux: controlla le posizioni comuni di Chrome/Brave/Edge/Chromium sotto `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`.
- Windows: controlla le posizioni di installazione comuni.

## API di controllo (facoltativa)

Per scripting e debug, il Gateway espone una piccola **API HTTP di controllo
solo loopback** più una CLI `openclaw browser` corrispondente (snapshot, ref, potenziamenti
di attesa, output JSON, workflow di debug). Vedi
[API di controllo del browser](/it/tools/browser-control) per il riferimento completo.

## Risoluzione dei problemi

Per problemi specifici di Linux (soprattutto snap Chromium), vedi
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni split-host WSL2 Gateway + Windows Chrome, vedi
[Risoluzione dei problemi WSL2 + Windows + CDP Chrome remoto](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP vs blocco SSRF di navigazione

Queste sono classi di errore diverse e indicano percorsi di codice diversi.

- **Errore di avvio o prontezza CDP** significa che OpenClaw non può confermare che il piano di controllo del browser sia sano.
- **Blocco SSRF di navigazione** significa che il piano di controllo del browser è sano, ma una destinazione di navigazione pagina è rifiutata dalla policy.

Esempi comuni:

- Errore di avvio o prontezza CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando un
    servizio CDP esterno loopback è configurato senza `attachOnly: true`
- Blocco SSRF di navigazione:
  - i flussi `open`, `navigate`, snapshot o apertura schede falliscono con un errore di policy browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per separare i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come leggere i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima la prontezza CDP.
- Se `start` riesce ma `tabs` fallisce, il piano di controllo è ancora non sano. Trattalo come un problema di raggiungibilità CDP, non come un problema di navigazione pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` fallisce, il piano di controllo del browser è attivo e l'errore è nella policy di navigazione o nella pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso di controllo di base del browser gestito è sano.

Dettagli importanti sul comportamento:

- La configurazione del browser usa per impostazione predefinita un oggetto policy SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito local loopback `openclaw`, i controlli di salute CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il piano di controllo locale di OpenClaw.
- La protezione della navigazione è separata. Un risultato positivo di `start` o `tabs` non significa che un successivo target `open` o `navigate` sia consentito.

Indicazioni di sicurezza:

- **Non** rilassare la policy SSRF del browser per impostazione predefinita.
- Preferisci eccezioni host ristrette come `hostnameAllowlist` o `allowedHostnames` rispetto all'accesso ampio alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente fidati dove l'accesso del browser alla rete privata è richiesto e revisionato.

## Strumenti dell'agente + funzionamento del controllo

L'agente riceve **uno strumento** per l'automazione del browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Come viene mappato:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per fare clic, digitare, trascinare o selezionare.
- `browser screenshot` acquisisce i pixel (pagina intera, elemento o ref etichettati).
- `browser doctor` controlla la prontezza di Gateway, plugin, profilo, browser e scheda.
- `browser` accetta:
  - `profile` per scegliere un profilo browser denominato (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove risiede il browser.
  - Nelle sessioni in sandbox, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` è omesso: le sessioni in sandbox usano per impostazione predefinita `sandbox`, le sessioni non in sandbox usano per impostazione predefinita `host`.
  - Se è connesso un nodo con funzionalità browser, lo strumento può instradarsi automaticamente verso di esso, a meno che tu non imposti esplicitamente `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti agent disponibili
- [Sandboxing](/it/gateway/sandboxing) - controllo del browser in ambienti in sandbox
- [Sicurezza](/it/gateway/security) - rischi del controllo del browser e rafforzamento
