---
read_when:
    - Aggiunta dell'automazione del browser controllata dall'agente
    - Debug del motivo per cui OpenClaw interferisce con il tuo Chrome
    - Implementazione delle impostazioni del browser e del ciclo di vita nell'app macOS
summary: Servizio integrato di controllo del browser + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-05-06T18:01:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw può eseguire un **profilo Chrome/Brave/Edge/Chromium dedicato** controllato dall'agente.
È isolato dal tuo browser personale ed è gestito tramite un piccolo servizio di
controllo locale all'interno del Gateway (solo loopback).

Vista per principianti:

- Consideralo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il tuo profilo browser personale.
- L'agente può **aprire schede, leggere pagine, fare clic e digitare** in una corsia sicura.
- Il profilo `user` integrato si collega alla tua sessione Chrome reale con accesso effettuato tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenco/apertura/focus/chiusura).
- Azioni dell'agente (clic/digitazione/trascinamento/selezione), snapshot, screenshot, PDF.
- Una skill `browser-automation` in bundle che insegna agli agenti il ciclo di recupero
  snapshot, schede stabili, riferimenti obsoleti e blocchi manuali quando il Plugin
  browser è abilitato.
- Supporto opzionale per più profili (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo browser quotidiano. È una superficie sicura e isolata per
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

Se ricevi "Browser disabled", abilitalo nella configurazione (vedi sotto) e riavvia il
Gateway.

Se `openclaw browser` manca del tutto, oppure l'agente dice che lo strumento browser
non è disponibile, passa a [Comando o strumento browser mancante](/it/tools/browser#missing-browser-command-or-tool).

## Controllo dei Plugin

Lo strumento `browser` predefinito è un Plugin in bundle. Disabilitalo per sostituirlo con un altro Plugin che registra lo stesso nome di strumento `browser`:

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

Le modifiche alla configurazione del browser richiedono il riavvio del Gateway, così il Plugin può registrare nuovamente il proprio servizio.

## Indicazioni per l'agente

Nota sul profilo strumenti: `tools.profile: "coding"` include `web_search` e
`web_fetch`, ma non include lo strumento completo `browser`. Se l'agente o un
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
`tools.subagents.tools.allow: ["browser"]` da solo non basta, perché la policy dei sotto-agenti
viene applicata dopo il filtro del profilo.

Il Plugin browser distribuisce due livelli di indicazioni per gli agenti:

- La descrizione dello strumento `browser` porta il contratto compatto sempre attivo: scegliere
  il profilo corretto, mantenere i riferimenti sulla stessa scheda, usare `tabId`/etichette per il
  targeting delle schede e caricare la skill browser per lavori in più passaggi.
- La skill `browser-automation` in bundle porta il ciclo operativo più lungo:
  controllare prima stato/schede, etichettare le schede del task, acquisire uno snapshot prima di agire, riacquisire
  uno snapshot dopo modifiche dell'interfaccia, recuperare una volta i riferimenti obsoleti e segnalare login/2FA/captcha o
  blocchi di fotocamera/microfono come azione manuale invece di tirare a indovinare.

Le Skills in bundle con i Plugin sono elencate tra le Skills disponibili dell'agente quando il
Plugin è abilitato. Le istruzioni complete della skill vengono caricate su richiesta, quindi i turni
di routine non pagano l'intero costo in token.

## Comando o strumento browser mancante

Se `openclaw browser` è sconosciuto dopo un aggiornamento, `browser.request` manca, oppure l'agente segnala che lo strumento browser non è disponibile, la causa abituale è un elenco `plugins.allow` che omette `browser` e non esiste alcun blocco di configurazione root `browser`. Aggiungilo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un blocco root esplicito `browser`, per esempio `browser.enabled=true` o `browser.profiles.<name>`, attiva il Plugin browser in bundle anche con un `plugins.allow` restrittivo, in coerenza con il comportamento della configurazione dei canali. `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` non sostituiscono da soli l'appartenenza all'allowlist. Anche rimuovere completamente `plugins.allow` ripristina il comportamento predefinito.

## Profili: `openclaw` rispetto a `user`

- `openclaw`: browser gestito e isolato (nessuna estensione richiesta).
- `user`: profilo integrato di collegamento Chrome MCP per la tua sessione **Chrome reale con accesso effettuato**.

Per le chiamate allo strumento browser dell'agente:

- Predefinito: usa il browser isolato `openclaw`.
- Preferisci `profile="user"` quando contano le sessioni con accesso già effettuato e l'utente
  è al computer per fare clic/approvare eventuali prompt di collegamento.
- `profile` è l'override esplicito quando vuoi una modalità browser specifica.

Imposta `browser.defaultProfile: "openclaw"` se vuoi la modalità gestita per impostazione predefinita.

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
- I profili locali `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl`; imposta questi valori solo per CDP remoto. `cdpUrl` usa per impostazione predefinita la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità HTTP CDP remoti e `attachOnly`
  e alle richieste HTTP di apertura schede; `remoteCdpHandshakeTimeoutMs` si applica ai
  relativi handshake WebSocket CDP.
- `localLaunchTimeoutMs` è il budget per un processo Chrome gestito avviato localmente
  per esporre il proprio endpoint HTTP CDP. `localCdpReadyTimeoutMs` è il
  budget successivo per la disponibilità del websocket CDP dopo che il processo è stato individuato.
  Aumentali su Raspberry Pi, VPS di fascia bassa o hardware più vecchio dove Chromium
  si avvia lentamente. I valori devono essere interi positivi fino a `120000` ms; i valori
  di configurazione non validi vengono rifiutati.
- I fallimenti ripetuti di avvio/disponibilità di Chrome gestito vengono interrotti con circuit breaker per
  profilo. Dopo diversi fallimenti consecutivi, OpenClaw sospende brevemente i nuovi tentativi
  di avvio invece di generare Chromium a ogni chiamata allo strumento browser. Risolvi
  il problema di avvio, disabilita il browser se non è necessario, oppure riavvia il
  Gateway dopo la riparazione.
- `actionTimeoutMs` è il budget predefinito per le richieste browser `act` quando il chiamante non passa `timeoutMs`. Il trasporto client aggiunge una piccola finestra di margine così le attese lunghe possono finire invece di scadere al confine HTTP.
- `tabCleanup` è una pulizia best-effort per le schede aperte dalle sessioni browser dell'agente principale. La pulizia del ciclo di vita di sotto-agenti, Cron e ACP chiude comunque le schede esplicitamente tracciate alla fine della sessione; le sessioni principali mantengono riutilizzabili le schede attive, poi chiudono in background le schede tracciate inattive o in eccesso.

</Accordion>

<Accordion title="Policy SSRF">

- La navigazione del browser e l'apertura schede sono protette da SSRF prima della navigazione e ricontrollate best-effort sull'URL finale `http(s)` in seguito.
- In modalità SSRF rigida, vengono controllati anche il rilevamento dell'endpoint CDP remoto e le probe `/json/version` (`cdpUrl`).
- Le variabili d'ambiente Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` non inoltrano automaticamente tramite proxy il browser gestito da OpenClaw. Chrome gestito si avvia direttamente per impostazione predefinita, così le impostazioni proxy dei provider non indeboliscono i controlli SSRF del browser.
- Per usare un proxy per il browser gestito stesso, passa flag proxy Chrome espliciti tramite `browser.extraArgs`, come `--proxy-server=...` o `--proxy-pac-url=...`. La modalità SSRF rigida blocca il routing proxy browser esplicito a meno che l'accesso browser alla rete privata sia abilitato intenzionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disattivato per impostazione predefinita; abilitalo solo quando l'accesso browser alla rete privata è intenzionalmente considerato attendibile.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.

</Accordion>

<Accordion title="Comportamento del profilo">

- `attachOnly: true` significa non avviare mai un browser locale; collegarsi solo se ne è già in esecuzione uno.
- `headless` può essere impostato globalmente o per ogni profilo locale gestito. I valori per profilo sovrascrivono `browser.headless`, quindi un profilo avviato localmente può restare headless mentre un altro rimane visibile.
- `POST /start?headless=true` e `openclaw browser start --headless` richiedono un avvio
  headless una tantum per i profili locali gestiti senza riscrivere
  `browser.headless` o la configurazione del profilo. I profili con sessione esistente, solo collegamento e
  CDP remoto rifiutano la sovrascrittura perché OpenClaw non avvia tali
  processi del browser.
- Sugli host Linux senza `DISPLAY` o `WAYLAND_DISPLAY`, i profili locali gestiti
  passano automaticamente a headless per impostazione predefinita quando né l'ambiente né la
  configurazione del profilo/globale scelgono esplicitamente la modalità con interfaccia. `openclaw browser status --json`
  riporta `headlessSource` come `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` forza gli avvii locali gestiti in modalità headless per il
  processo corrente. `OPENCLAW_BROWSER_HEADLESS=0` forza la modalità con interfaccia per gli avvii
  ordinari e restituisce un errore utilizzabile sugli host Linux senza server display;
  una richiesta esplicita `start --headless` ha comunque la precedenza per quel singolo avvio.
- `executablePath` può essere impostato globalmente o per ogni profilo locale gestito. I valori per profilo sovrascrivono `browser.executablePath`, quindi profili gestiti diversi possono avviare browser diversi basati su Chromium. Entrambe le forme accettano `~` per la directory home del sistema operativo.
- `color` (di primo livello e per profilo) colora l'interfaccia del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (standalone gestito). Usa `defaultProfile: "user"` per scegliere il browser dell'utente con accesso effettuato.
- Ordine di rilevamento automatico: browser predefinito di sistema se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP invece di CDP grezzo. Non impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo con sessione esistente deve collegarsi a un profilo utente Chromium non predefinito (Brave, Edge, ecc.). Anche questo percorso accetta `~` per la directory home del sistema operativo.

</Accordion>

</AccordionGroup>

## Usare Brave o un altro browser basato su Chromium

Se il browser **predefinito di sistema** è basato su Chromium (Chrome/Brave/Edge/ecc.),
OpenClaw lo usa automaticamente. Imposta `browser.executablePath` per sovrascrivere
il rilevamento automatico. I valori `executablePath` di primo livello e per profilo accettano `~`
per la directory home del sistema operativo:

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

`executablePath` per profilo influisce solo sui profili locali gestiti che OpenClaw
avvia. I profili `existing-session` si collegano invece a un browser già in esecuzione,
e i profili CDP remoti usano il browser dietro `cdpUrl`.

## Controllo locale rispetto a remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo loopback e può avviare un browser locale.
- **Controllo remoto (host nodo):** esegui un host nodo sulla macchina che ha il browser; il Gateway inoltra le azioni del browser tramite proxy verso di esso.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non avvierà un browser locale.
- Per i servizi CDP gestiti esternamente su loopback (per esempio Browserless in
  Docker pubblicato su `127.0.0.1`), imposta anche `attachOnly: true`. Il CDP su loopback
  senza `attachOnly` viene trattato come profilo browser locale gestito da OpenClaw.
- `headless` influisce solo sui profili locali gestiti che OpenClaw avvia. Non riavvia né modifica i browser con sessione esistente o CDP remoto.
- `executablePath` segue la stessa regola dei profili locali gestiti. Modificarlo su un
  profilo locale gestito in esecuzione contrassegna quel profilo per riavvio/riconciliazione, così
  l'avvio successivo usa il nuovo binario.

Il comportamento di arresto varia in base alla modalità del profilo:

- profili locali gestiti: `openclaw browser stop` arresta il processo del browser che
  OpenClaw ha avviato
- profili solo collegamento e CDP remoto: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia le sovrascritture di emulazione Playwright/CDP (viewport,
  schema colori, locale, fuso orario, modalità offline e stato simile), anche
  se nessun processo del browser è stato avviato da OpenClaw

Gli URL CDP remoti possono includere autenticazione:

- Token di query (ad esempio, `https://provider.example?token=<token>`)
- Autenticazione HTTP Basic (ad esempio, `https://user:pass@provider.example`)

OpenClaw preserva l'autenticazione quando chiama gli endpoint `/json/*` e quando si connette
al WebSocket CDP. Preferisci variabili d'ambiente o gestori di segreti per i
token invece di commetterli nei file di configurazione.

## Proxy browser del Node (predefinito senza configurazione)

Se esegui un **host nodo** sulla macchina che ha il browser, OpenClaw può
instradare automaticamente le chiamate agli strumenti del browser verso quel nodo senza alcuna configurazione browser aggiuntiva.
Questo è il percorso predefinito per i gateway remoti.

Note:

- L'host nodo espone il proprio server locale di controllo del browser tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del nodo stesso (uguale a quella locale).
- `nodeHost.browserProxy.allowProfiles` è opzionale. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati rimangono raggiungibili tramite il proxy, incluse le route di creazione/eliminazione dei profili.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come un perimetro a privilegi minimi: possono essere selezionati solo i profili nella lista consentita, e le route persistenti di creazione/eliminazione dei profili sono bloccate sulla superficie proxy.
- Disabilitalo se non lo vuoi:
  - Sul nodo: `nodeHost.browserProxy.enabled=false`
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
- Scegli l'endpoint di regione che corrisponde al tuo account Browserless (consulta la loro documentazione).
- Se Browserless ti fornisce un URL di base HTTPS, puoi convertirlo in
  `wss://` per una connessione CDP diretta oppure mantenere l'URL HTTPS e lasciare che OpenClaw
  scopra `/json/version`.

### Browserless Docker sullo stesso host

Quando Browserless è in self-hosting in Docker e OpenClaw viene eseguito sull'host, tratta
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
imposta `EXTERNAL` di Browserless sulla stessa base WebSocket pubblica per OpenClaw, come
`ws://127.0.0.1:3000`, `ws://browserless:3000` o un indirizzo stabile di rete privata
Docker. Se `/json/version` restituisce `webSocketDebuggerUrl` che punta a
un indirizzo che OpenClaw non può raggiungere, l'HTTP CDP può sembrare integro mentre il collegamento
WebSocket continua a fallire.

Non lasciare `attachOnly` non impostato per un profilo Browserless su loopback. Senza
`attachOnly`, OpenClaw tratta la porta loopback come un profilo browser locale gestito
e può indicare che la porta è in uso ma non è di proprietà di OpenClaw.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** invece
del rilevamento CDP standard basato su HTTP (`/json/version`). OpenClaw accetta tre
forme di URL CDP e sceglie automaticamente la strategia di connessione corretta:

- **Rilevamento HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw chiama `/json/version` per scoprire l'URL del debugger WebSocket, quindi
  si connette. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si connette direttamente tramite handshake WebSocket e salta
  completamente `/json/version`.
- **Radici WebSocket nude** - `ws://host[:port]` o `wss://host[:port]` senza
  percorso `/devtools/...` (ad esempio [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw prova prima il rilevamento HTTP
  `/json/version` (normalizzando lo schema a `http`/`https`);
  se il rilevamento restituisce un `webSocketDebuggerUrl` viene usato, altrimenti OpenClaw
  ripiega su un handshake WebSocket diretto alla radice nuda. Se l'endpoint
  WebSocket pubblicizzato rifiuta l'handshake CDP ma la radice nuda configurata
  lo accetta, OpenClaw ripiega anche su quella radice. Questo consente a un semplice `ws://`
  puntato a un Chrome locale di connettersi comunque, poiché Chrome accetta gli upgrade WebSocket
  solo sullo specifico percorso per target da `/json/version`, mentre i provider
  ospitati possono comunque usare il proprio endpoint WebSocket radice quando il loro endpoint di rilevamento
  pubblicizza un URL di breve durata non adatto a Playwright CDP.

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
  dalla [dashboard Panoramica](https://www.browserbase.com/overview).
- Sostituisci `<BROWSERBASE_API_KEY>` con la tua vera chiave API Browserbase.
- Browserbase crea automaticamente una sessione browser alla connessione WebSocket, quindi non è
  necessario alcun passaggio manuale di creazione sessione.
- Il piano gratuito consente una sessione simultanea e un'ora browser al mese.
  Consulta i [prezzi](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Consulta la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento API
  completo, le guide SDK e gli esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo del browser è solo local loopback; l'accesso passa attraverso l'autenticazione del Gateway o l'abbinamento dei nodi.
- L'API HTTP standalone del browser local loopback usa **solo autenticazione con segreto condiviso**:
  autenticazione bearer con token del gateway, `x-openclaw-password` o autenticazione HTTP Basic con la
  password del gateway configurata.
- Le intestazioni di identità di Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **non**
  autenticano questa API standalone del browser local loopback.
- Se il controllo del browser è abilitato e non è configurata alcuna autenticazione con segreto condiviso, OpenClaw
  genera un token gateway valido solo a runtime per quell'avvio. Configura
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o
  `OPENCLAW_GATEWAY_PASSWORD` in modo esplicito se i client hanno bisogno di un segreto stabile tra
  i riavvii.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è
  già `password`, `none` o `trusted-proxy`.
- Mantieni il Gateway ed eventuali host nodo su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta URL/token CDP remoti come segreti; preferisci variabili d'ambiente o un gestore di segreti.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token di breve durata dove possibile.
- Evita di incorporare token di lunga durata direttamente nei file di configurazione.

## Profili (multi-browser)

OpenClaw supporta più profili con nome (configurazioni di routing). I profili possono essere:

- **openclaw-managed**: un'istanza di browser dedicata basata su Chromium con la propria directory dei dati utente + porta CDP
- **remote**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite connessione automatica Chrome DevTools MCP

Impostazioni predefinite:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per l'attach a una sessione esistente Chrome MCP.
- I profili di sessione esistente oltre a `user` sono facoltativi; creali con `--driver existing-session`.
- Le porte CDP locali vengono assegnate da **18800-18899** per impostazione predefinita.
- L'eliminazione di un profilo sposta la sua directory dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Sessione esistente tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium in esecuzione tramite il
server ufficiale Chrome DevTools MCP. Questo riutilizza le schede e lo stato di accesso
già aperti in quel profilo browser.

Riferimenti ufficiali di contesto e configurazione:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Facoltativo: crea un tuo profilo personalizzato di sessione esistente se vuoi un
nome, un colore o una directory dati del browser diversi.

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

1. Apri la pagina di ispezione di quel browser per il debug remoto.
2. Abilita il debug remoto.
3. Mantieni il browser in esecuzione e approva la richiesta di connessione quando OpenClaw si collega.

Pagine di ispezione comuni:

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

Aspetto di un esito positivo:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` elenca le schede del browser già aperte
- `snapshot` restituisce riferimenti dalla scheda live selezionata

Cosa controllare se l'attach non funziona:

- il browser di destinazione basato su Chromium è alla versione `144+`
- il debug remoto è abilitato nella pagina di ispezione di quel browser
- il browser ha mostrato la richiesta di consenso all'attach e tu l'hai accettata
- `openclaw doctor` migra la vecchia configurazione del browser basata su estensione e controlla che
  Chrome sia installato localmente per i profili predefiniti con connessione automatica, ma non può
  abilitare il debug remoto lato browser al posto tuo

Uso da parte degli agenti:

- Usa `profile="user"` quando hai bisogno dello stato di accesso del browser dell'utente.
- Se usi un profilo personalizzato di sessione esistente, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare la richiesta
  di attach.
- il Gateway o l'host nodo può avviare `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso del profilo isolato `openclaw` perché può
  agire all'interno della tua sessione browser con accesso effettuato.
- OpenClaw non avvia il browser per questo driver; si limita a collegarsi.
- OpenClaw usa qui il flusso ufficiale Chrome DevTools MCP `--autoConnect`. Se
  `userDataDir` è impostato, viene passato per puntare a quella directory dati utente.
- La sessione esistente può essere collegata sull'host selezionato o tramite un
  nodo browser connesso. Se Chrome si trova altrove e nessun nodo browser è connesso, usa
  CDP remoto o un host nodo.

### Avvio Chrome MCP personalizzato

Sovrascrivi il server Chrome DevTools MCP avviato per profilo quando il flusso predefinito
`npx chrome-devtools-mcp@latest` non è quello desiderato (host offline,
versioni bloccate, binari vendorizzati):

| Campo        | Cosa fa                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Eseguibile da avviare invece di `npx`. Risolto così com'è; i percorsi assoluti sono rispettati.                                          |
| `mcpArgs`    | Array di argomenti passato letteralmente a `mcpCommand`. Sostituisce gli argomenti predefiniti `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` è impostato su un profilo di sessione esistente, OpenClaw salta
`--autoConnect` e inoltra automaticamente l'endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint di discovery HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP diretto).

I flag endpoint e `userDataDir` non possono essere combinati: quando `cdpUrl` è impostato,
`userDataDir` viene ignorato per l'avvio di Chrome MCP, poiché Chrome MCP si collega al
browser in esecuzione dietro l'endpoint invece di aprire una directory
profilo.

<Accordion title="Existing-session feature limitations">

Rispetto al profilo gestito `openclaw`, i driver di sessione esistente sono più vincolati:

- **Screenshot** - le acquisizioni di pagina e le acquisizioni di elementi `--ref` funzionano; i selettori CSS `--element` no. `--full-page` non può essere combinato con `--ref` o `--element`. Playwright non è richiesto per screenshot di pagina o di elementi basati su ref.
- **Azioni** - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono ref dello snapshot (nessun selettore CSS). `click-coords` fa clic sulle coordinate visibili del viewport e non richiede un ref dello snapshot. `click` è solo con il pulsante sinistro. `type` non supporta `slowly=true`; usa `fill` o `press`. `press` non supporta `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` ed `evaluate` non supportano timeout per chiamata. `select` accetta un singolo valore.
- **Attesa / caricamento / dialogo** - `wait --url` supporta pattern esatti, sottostringhe e glob; `wait --load networkidle` non è supportato. Gli hook di caricamento richiedono `ref` o `inputRef`, un file alla volta, nessun `element` CSS. Gli hook di dialogo non supportano override del timeout.
- **Funzionalità solo gestite** - azioni batch, esportazione PDF, intercettazione dei download e `responsebody` richiedono ancora il percorso del browser gestito.

</Accordion>

## Garanzie di isolamento

- **Directory dati utente dedicata**: non tocca mai il tuo profilo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con i flussi di lavoro di sviluppo.
- **Controllo deterministico delle schede**: `tabs` restituisce prima `suggestedTargetId`, poi
  handle `tabId` stabili come `t1`, etichette facoltative e il `targetId` grezzo.
  Gli agenti dovrebbero riutilizzare `suggestedTargetId`; gli id grezzi restano disponibili per
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

Per scripting e debug, il Gateway espone una piccola **API HTTP di controllo solo local loopback**
più una CLI `openclaw browser` corrispondente (snapshot, ref, potenziamenti di attesa,
output JSON, flussi di lavoro di debug). Consulta
[API di controllo del browser](/it/tools/browser-control) per il riferimento completo.

## Risoluzione dei problemi

Per problemi specifici di Linux (in particolare snap Chromium), consulta
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni split-host WSL2 Gateway + Windows Chrome, consulta
[Risoluzione dei problemi di WSL2 + Windows + CDP Chrome remoto](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP rispetto a blocco SSRF di navigazione

Queste sono classi di errore diverse e indicano percorsi di codice diversi.

- **Errore di avvio o readiness CDP** significa che OpenClaw non può confermare che il piano di controllo del browser sia integro.
- **Blocco SSRF di navigazione** significa che il piano di controllo del browser è integro, ma un target di navigazione pagina viene rifiutato dalla policy.

Esempi comuni:

- Errore di avvio o readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando è
    configurato un servizio CDP esterno local loopback senza `attachOnly: true`
- Blocco SSRF di navigazione:
  - i flussi `open`, `navigate`, snapshot o apertura scheda falliscono con un errore di policy browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per separare i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come leggere i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima la readiness CDP.
- Se `start` riesce ma `tabs` fallisce, il piano di controllo è ancora non integro. Tratta questo come un problema di raggiungibilità CDP, non come un problema di navigazione pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` fallisce, il piano di controllo del browser è attivo e l'errore è nella policy di navigazione o nella pagina target.
- Se `start`, `tabs` e `open` riescono tutti, il percorso di controllo di base del browser gestito è integro.

Dettagli importanti sul comportamento:

- La configurazione del browser usa per impostazione predefinita un oggetto policy SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito locale local loopback `openclaw`, i controlli di salute CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il piano di controllo locale di OpenClaw.
- La protezione della navigazione è separata. Un risultato `start` o `tabs` riuscito non significa che un target successivo `open` o `navigate` sia consentito.

Indicazioni di sicurezza:

- **Non** allentare la policy SSRF del browser per impostazione predefinita.
- Preferisci eccezioni host ristrette come `hostnameAllowlist` o `allowedHostnames` rispetto a un ampio accesso alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente fidati dove l'accesso del browser alla rete privata è richiesto e revisionato.

## Strumenti agente + come funziona il controllo

L'agente riceve **uno strumento** per l'automazione del browser:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Come viene mappato:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per fare clic/digitare/trascinare/selezionare.
- `browser screenshot` acquisisce i pixel (pagina intera, elemento o riferimenti etichettati).
- `browser doctor` controlla la preparazione di Gateway, plugin, profilo, browser e scheda.
- `browser` accetta:
  - `profile` per scegliere un profilo browser denominato (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove risiede il browser.
  - Nelle sessioni in sandbox, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` viene omesso: le sessioni in sandbox usano `sandbox` per impostazione predefinita, le sessioni non in sandbox usano `host` per impostazione predefinita.
  - Se è connesso un nodo compatibile con browser, lo strumento può instradarsi automaticamente verso di esso, a meno che non venga fissato `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti dell'agente disponibili
- [Sandboxing](/it/gateway/sandboxing) - controllo del browser negli ambienti in sandbox
- [Sicurezza](/it/gateway/security) - rischi e rafforzamento del controllo del browser
