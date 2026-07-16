---
read_when:
    - Aggiunta dell'automazione del browser controllata dall'agente
    - Debug del motivo per cui OpenClaw interferisce con la propria istanza di Chrome
    - Implementazione delle impostazioni e del ciclo di vita del browser nell'app macOS
summary: Servizio integrato di controllo del browser + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-07-16T15:05:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw può eseguire un **profilo Chrome/Brave/Edge/Chromium dedicato** controllato dall'agente. Funziona tramite un piccolo servizio di controllo locale all'interno del Gateway (solo loopback) ed è isolato dal browser personale.

- È come un **browser separato, riservato all'agente**. Il profilo `openclaw` non interagisce mai con il profilo del browser personale.
- L'agente apre schede, legge pagine, fa clic e digita in questo ambiente isolato.
- Il profilo integrato `user` si collega invece alla sessione Chrome reale autenticata, tramite Chrome DevTools MCP.

## Funzionalità disponibili

- Un profilo browser separato denominato **openclaw** (con colore principale arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenco/apertura/attivazione/chiusura).
- Azioni dell'agente (clic/digitazione/trascinamento/selezione), snapshot, screenshot e PDF.
- I profili basati su Playwright salvano le navigazioni dirette agli allegati nella directory dei download gestiti e restituiscono i metadati `{ url, suggestedFilename, path }` dopo la convalida dei criteri dell'URL finale.
- Le azioni dell'agente basate su Playwright restituiscono un array `downloads` con gli stessi metadati gestiti quando l'azione avvia immediatamente uno o più download.
- Una skill `browser-automation` inclusa che insegna agli agenti il ciclo di recupero per snapshot,
  schede stabili, riferimenti obsoleti e blocchi che richiedono intervento manuale quando il Plugin del browser
  è abilitato.
- Supporto multiprofilo facoltativo (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è destinato all'uso quotidiano. È un ambiente sicuro e isolato per
l'automazione e la verifica da parte dell'agente.

Su macOS è possibile copiare esplicitamente i cookie da un profilo di sistema della famiglia Chrome a un profilo gestito separato. Il browser gestito continua a utilizzare la propria directory dei dati utente; vengono copiati soltanto i cookie selezionati, mentre l'archiviazione locale e IndexedDB non vengono trasferiti. Consultare [Profili](#profiles-multi-browser) o il [riferimento della CLI `openclaw browser`](/it/cli/browser) per i comandi di importazione e le limitazioni.

## Avvio rapido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Browser disabled" indica che il Plugin o `browser.enabled` è disattivato; consultare
[Configurazione](#configuration) e [Controllo del Plugin](#plugin-control).

Se `openclaw browser` è completamente assente o l'agente segnala che lo strumento browser
non è disponibile, passare a [Comando o strumento browser mancante](#missing-browser-command-or-tool).

## Controllo del Plugin

Lo strumento predefinito `browser` è un Plugin incluso. Disabilitarlo per sostituirlo con un altro Plugin che registri lo stesso nome di strumento `browser`:

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

Le impostazioni predefinite richiedono sia `plugins.entries.browser.enabled` **sia** `browser.enabled=true`. Disabilitando soltanto il Plugin vengono rimossi come singola unità la CLI `openclaw browser`, il metodo del Gateway `browser.request`, lo strumento dell'agente e il servizio di controllo; la configurazione `browser.*` rimane intatta per un sostituto.

Le modifiche alla configurazione del browser richiedono il riavvio del Gateway affinché il Plugin possa registrare nuovamente il proprio servizio.

## Indicazioni per l'agente

Nota sul profilo degli strumenti: `tools.profile: "coding"` include `web_search` e
`web_fetch`, ma non lo strumento completo `browser`. Per consentire all'agente o a un
sottoagente generato di utilizzare l'automazione del browser, aggiungere browser nella fase
del profilo:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Per un singolo agente, utilizzare `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` da solo non è sufficiente, perché i criteri dei sottoagenti
vengono applicati dopo il filtraggio del profilo.

Il Plugin del browser include due livelli di indicazioni per l'agente:

- La descrizione dello strumento `browser` contiene il contratto compatto sempre attivo: scegliere
  il profilo corretto, mantenere i riferimenti nella stessa scheda, utilizzare `tabId`/etichette per individuare le schede
  e caricare la skill del browser per le operazioni in più passaggi.
- La skill inclusa `browser-automation` contiene il ciclo operativo più dettagliato:
  controllare prima lo stato e le schede, assegnare etichette alle schede dell'attività, acquisire uno snapshot prima di agire, acquisirne uno nuovo
  dopo le modifiche all'interfaccia, tentare una sola volta il recupero dei riferimenti obsoleti e segnalare accesso/2FA/captcha o
  blocchi relativi a fotocamera/microfono come azioni manuali anziché procedere per tentativi.

Le skill incluse nel Plugin sono elencate tra le Skills disponibili per l'agente quando il
Plugin è abilitato. Le istruzioni complete della skill vengono caricate su richiesta, evitando così
il costo completo in token per le interazioni ordinarie.

## Comando o strumento browser mancante

Se `openclaw browser` non è riconosciuto dopo un aggiornamento, `browser.request` è assente o l'agente segnala che lo strumento browser non è disponibile, la causa abituale è un elenco `plugins.allow` che omette `browser` e l'assenza di un blocco di configurazione radice `browser`. Aggiungerlo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un blocco radice `browser` esplicito (qualsiasi chiave sotto `browser`, come
`browser.enabled=true` o `browser.profiles.<name>`) attiva il Plugin
browser incluso anche in presenza di un `plugins.allow` restrittivo, in linea con il comportamento
della configurazione dei canali inclusi. `plugins.entries.browser.enabled=true` e
`tools.alsoAllow: ["browser"]` non sostituiscono autonomamente l'appartenenza all'elenco
di elementi consentiti. Anche la rimozione completa di `plugins.allow` ripristina l'impostazione predefinita.

## Profili: `openclaw`, `user`, `chrome`

- `openclaw`: browser gestito e isolato (non richiede estensioni).
- `user`: profilo integrato di collegamento Chrome DevTools MCP per la sessione **Chrome reale
  autenticata**. Chrome mostra la richiesta bloccante "Allow remote debugging?"
  al primo collegamento di OpenClaw, quindi è necessaria la presenza di qualcuno al computer.
- `chrome`: profilo integrato dell'[estensione Chrome](/it/tools/chrome-extension) per
  la sessione **Chrome reale autenticata**. Funziona da un telefono senza che nessuno sia
  alla postazione, perché controlla le schede tramite l'estensione browser di OpenClaw anziché
  tramite la porta di debug remoto, quindi non viene visualizzata la richiesta "Allow remote debugging?".

Per le chiamate allo strumento browser dell'agente:

- Impostazione predefinita: utilizzare il browser isolato `openclaw`.
- Preferire `profile="chrome"` (estensione) quando sono importanti le sessioni autenticate esistenti
  e l'utente è **lontano dal computer** (Telegram, WhatsApp e così via).
- Preferire `profile="user"` (Chrome MCP) quando sono importanti le sessioni autenticate esistenti
  e l'utente è **al computer** per approvare la richiesta di collegamento.
- `profile` è la sostituzione esplicita da utilizzare quando si desidera una modalità browser specifica.

Impostare `browser.defaultProfile: "openclaw"` per utilizzare per impostazione predefinita la modalità gestita.

## Configurazione

Le impostazioni del browser si trovano in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // valore predefinito: true
    evaluateEnabled: true, // valore predefinito: true; false disabilita act:evaluate (JS arbitrario)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // aderire solo per l'accesso attendibile alla rete privata
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // sostituzione precedente per un singolo profilo
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout dell'handshake WebSocket CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // timeout di rilevamento del Chrome gestito locale (ms)
    localCdpReadyTimeoutMs: 8000, // timeout di disponibilità CDP locale dopo l'avvio gestito (ms)
    actionTimeoutMs: 60000, // timeout predefinito delle azioni del browser (ms)
    tabCleanup: {
      enabled: true, // valore predefinito: true
      idleMinutes: 120, // impostare 0 per disabilitare la pulizia delle schede inattive
      maxTabsPerSession: 8, // impostare 0 per disabilitare il limite per sessione
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // modalità snapshot predefinita quando il chiamante non ne specifica una
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

`browser.snapshotDefaults.mode: "efficient"` modifica la modalità di estrazione predefinita `snapshot`
quando un chiamante non passa un valore esplicito `snapshotFormat` o
`mode`; consultare [API di controllo del browser](/it/tools/browser-control) per le opzioni
di snapshot per singola chiamata.

### Visione degli screenshot (supporto per modelli solo testuali)

Quando il modello principale è solo testuale (senza supporto visivo/multimodale), gli
screenshot del browser restituiscono blocchi immagine che il modello non può leggere. Gli screenshot del browser
riutilizzano la configurazione esistente per la comprensione delle immagini, pertanto un modello di immagini
configurato per la comprensione dei contenuti multimediali può descrivere gli screenshot come testo senza alcuna
impostazione del modello specifica per il browser.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Aggiungere candidati di riserva; viene usato il primo che ha esito positivo
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Anche i modelli multimediali condivisi funzionano quando sono contrassegnati per il supporto delle immagini.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Vengono rispettate anche le impostazioni predefinite esistenti del modello di immagini.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Funzionamento:**

1. L'agente chiama `browser screenshot` e un'immagine viene acquisita su disco come di consueto.
2. Lo strumento browser chiede al runtime esistente per la comprensione delle immagini se
   può descrivere lo screenshot utilizzando i modelli di immagini multimediali configurati, i modelli multimediali
   condivisi, le impostazioni predefinite dei modelli di immagini o un provider di immagini supportato dall'autenticazione.
3. Il modello visivo restituisce una descrizione testuale, che viene racchiusa con
   `wrapExternalContent` (protezione dall'iniezione di prompt) e restituita all'agente
   come blocco di testo anziché come blocco immagine.
4. Se la comprensione delle immagini non è disponibile, viene ignorata o non riesce, il browser
   torna a restituire il blocco immagine originale.

I blocchi immagine degli screenshot sono risultati privati dello strumento: l'agente può esaminarli,
ma OpenClaw non li allega automaticamente alle risposte nei canali. Per condividere uno
screenshot, chiedere all'agente di inviarlo esplicitamente con lo strumento dei messaggi.

Utilizzare i campi esistenti `tools.media.image` / `tools.media.models` per i modelli
di riserva, i timeout, i limiti in byte, i profili e le impostazioni delle richieste al provider.

Se il modello principale attivo supporta già la visione e non è configurato alcun modello esplicito
per la comprensione delle immagini, OpenClaw mantiene il normale risultato immagine affinché il
modello principale possa leggere direttamente lo screenshot.

<AccordionGroup>

<Accordion title="Porte e raggiungibilità">

- Il servizio di controllo si associa all'interfaccia di loopback su una porta derivata da `gateway.port` (valore predefinito `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` ha la precedenza su `gateway.port`; entrambi spostano le porte derivate della stessa famiglia.
- I profili `openclaw` locali assegnano automaticamente `cdpPort`/`cdpUrl` da un intervallo che inizia 9 porte dopo la porta di controllo (valore predefinito `18800`-`18899`); impostarli solo per
  profili CDP remoti o per il collegamento all'endpoint di una sessione esistente. Se non impostato, `cdpUrl` usa per impostazione predefinita
  la porta CDP locale gestita.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità HTTP CDP remoti e `attachOnly`
  e alle richieste HTTP di apertura delle schede; `remoteCdpHandshakeTimeoutMs` si applica
  ai relativi handshake WebSocket CDP. L'enumerazione persistente delle schede remote di Playwright
  usa il valore maggiore dei due come scadenza dell'operazione.
- `localLaunchTimeoutMs` è il tempo massimo concesso a un processo Chrome gestito avviato localmente
  per esporre il proprio endpoint HTTP CDP. `localCdpReadyTimeoutMs` è il
  tempo massimo successivo per la disponibilità del WebSocket CDP dopo il rilevamento del processo.
  Aumentare questi valori su Raspberry Pi, VPS di fascia bassa o hardware meno recente in cui Chromium
  si avvia lentamente. I valori devono essere numeri interi positivi fino a `120000` ms; i valori
  di configurazione non validi vengono rifiutati.
- Gli errori ripetuti di avvio o disponibilità di Chrome gestito attivano un circuit breaker per
  ogni profilo. Dopo diversi errori consecutivi, OpenClaw sospende brevemente i nuovi tentativi
  di avvio anziché generare Chromium a ogni chiamata dello strumento browser. Correggere
  il problema di avvio, disabilitare il browser se non è necessario oppure riavviare il
  Gateway dopo la correzione.
- `actionTimeoutMs` è il tempo massimo predefinito per le richieste `act` del browser quando il chiamante non passa `timeoutMs`. Il trasporto client aggiunge un piccolo margine temporale affinché le attese prolungate possano terminare anziché scadere al limite HTTP.
- `tabCleanup` esegue una pulizia best effort delle schede aperte dalle sessioni browser dell'agente primario. La pulizia del ciclo di vita di sottoagenti, Cron e ACP continua a chiudere le rispettive schede monitorate esplicitamente al termine della sessione; le sessioni primarie mantengono riutilizzabili le schede attive, quindi chiudono in background quelle monitorate inattive o in eccesso.

</Accordion>

<Accordion title="Criteri SSRF">

- Le richieste di navigazione del browser e di apertura delle schede vengono sottoposte a un controllo preliminare. Durante l'azione e per un periodo di tolleranza limitato successivo, le interazioni Playwright protette (clic, clic su coordinate, passaggio del puntatore, trascinamento, scorrimento, selezione, pressione, digitazione, compilazione di moduli e valutazione) intercettano i caricamenti di documenti di primo livello e dei sottoframe negati dai criteri prima dell'invio dei byte della richiesta HTTP, quindi ricontrollano in modalità best effort l'URL `http(s)` finale.
- Prima di ogni nuovo avvio di Chrome gestito da OpenClaw, OpenClaw disabilita in modalità best effort la previsione di rete, sopprimendo le preconnessioni speculative osservate di Chromium per i caricamenti negati. Si tratta di una difesa aggiuntiva, non di un limite di applicazione dei criteri: un browser riutilizzato dopo il riavvio del servizio di controllo e altri backend browser potrebbero non condividere questa protezione. Il routing di Playwright non è comunque un firewall di rete e non intercetta i passaggi di reindirizzamento, la prima richiesta di un popup, il traffico dei Service Worker, il codice della pagina eseguito dopo l'intervallo di protezione limitato o ogni percorso in background o delle sottorisorse. L'isolamento completo del traffico in uscita richiede l'isolamento da parte del proprietario o un proxy che applichi i criteri.
- In modalità SSRF rigorosa, vengono controllati anche il rilevamento degli endpoint CDP remoti e le verifiche `/json/version` (`cdpUrl`).
- Le variabili di ambiente `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e `NO_PROXY` del Gateway/provider non configurano automaticamente il proxy per il browser gestito da OpenClaw. Per impostazione predefinita, Chrome gestito viene avviato con una connessione diretta, affinché le impostazioni proxy del provider non indeboliscano i controlli SSRF del browser.
- Le verifiche locali di disponibilità CDP e le connessioni WebSocket DevTools gestite da OpenClaw ignorano il proxy di rete gestito per l'esatto endpoint di loopback avviato, pertanto `openclaw browser start` continua a funzionare quando un proxy dell'operatore blocca il traffico di loopback in uscita.
- Per configurare il proxy del browser gestito stesso, passare esplicitamente i flag proxy di Chrome tramite `browser.extraArgs`, ad esempio `--proxy-server=...` o `--proxy-pac-url=...`. La modalità SSRF rigorosa blocca il routing esplicito del proxy del browser, a meno che l'accesso del browser alla rete privata non sia intenzionalmente abilitato.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disattivato per impostazione predefinita; abilitarlo solo quando l'accesso del browser alla rete privata è considerato intenzionalmente attendibile.
- `browser.ssrfPolicy.allowPrivateNetwork` rimane supportato come alias legacy.

</Accordion>

<Accordion title="Comportamento dei profili">

- `attachOnly: true` indica di non avviare mai un browser locale e di collegarsi solo se ne è già in esecuzione uno.
- `headless` può essere impostato globalmente o per ogni profilo gestito locale. I valori specifici del profilo hanno la precedenza su `browser.headless`, quindi un profilo avviato localmente può rimanere headless mentre un altro resta visibile.
- `POST /start?headless=true` e `openclaw browser start --headless` richiedono un
  singolo avvio headless per i profili gestiti locali senza riscrivere
  `browser.headless` o la configurazione del profilo. I profili di sessione esistente, di solo collegamento e
  CDP remoti rifiutano la sostituzione perché OpenClaw non avvia i relativi
  processi browser.
- Sugli host Linux privi di `DISPLAY` o `WAYLAND_DISPLAY`, i profili gestiti locali
  usano automaticamente la modalità headless per impostazione predefinita quando né l'ambiente né la configurazione
  del profilo o globale selezionano esplicitamente la modalità con interfaccia. Usare la forma non ambigua a livello di browser
  `openclaw browser --json status`; anche `openclaw browser status --json` in coda
  funziona perché `status` non definisce un proprio `--json`. Il comando indica
  `headlessSource` come `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` forza la modalità headless per gli avvii gestiti locali del
  processo corrente. `OPENCLAW_BROWSER_HEADLESS=0` forza la modalità con interfaccia per gli
  avvii ordinari e restituisce un errore utilizzabile sugli host Linux privi di un display server;
  una richiesta esplicita `start --headless` mantiene comunque la precedenza per quel singolo avvio.
- La route di controllo del browser e il client programmatico mantengono il
  `error` leggibile dell'errore di assenza del display ed espongono il motivo stabile
  `no_display_for_headed_profile`. I relativi `details` contengono solo `profile`,
  `requestedHeadless`, `headlessSource` e `displayPresent`, in modo che i client API possano
  scegliere la correzione appropriata senza confrontare il testo del messaggio.
- Per un profilo gestito locale in esecuzione, lo stato e doctor interrogano l'endpoint
  CDP a livello di browser di Chrome per ottenere informazioni su renderer, backend, dispositivo/driver, stato
  delle funzionalità, soluzioni alternative per i driver e capacità video accelerate. Il risultato viene
  memorizzato nella cache per quel processo browser ed esposto integralmente da
  `openclaw browser --json status`. Una chiamata di stato passiva non avvia Chrome.
  I browser di sessione esistente, estensione, CDP remoto e sandbox restano separati
  e non vengono esaminati tramite questo percorso dell'host gestito.
- Chrome gestito in modalità headless continua a usare il valore predefinito prudente `--disable-gpu`.
  La diagnostica non abilita l'accelerazione, non aggiunge un'impostazione globale di accelerazione
  e non concede al browser sandbox l'accesso ai dispositivi.
- `executablePath` può essere impostato globalmente o per ogni profilo gestito locale. I valori specifici del profilo hanno la precedenza su `browser.executablePath`, quindi profili gestiti diversi possono avviare browser diversi basati su Chromium. Entrambe le forme accettano `~` per la directory home del sistema operativo.
- `color` (a livello principale e per profilo) colora l'interfaccia del browser per rendere visibile quale profilo è attivo.
- Il profilo predefinito è `openclaw` (istanza autonoma gestita). Usare `defaultProfile: "user"` per scegliere esplicitamente il browser dell'utente autenticato.
- Ordine di rilevamento automatico: browser predefinito del sistema se basato su Chromium; altrimenti Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP anziché CDP non elaborato. Può collegarsi tramite la connessione automatica di Chrome MCP oppure tramite `cdpUrl` quando è già disponibile un endpoint DevTools per il browser in esecuzione.
- `driver: "extension"` controlla il Chrome autenticato tramite l'[estensione Chrome di OpenClaw](/it/tools/chrome-extension). Il relay gestisce il proprio endpoint di loopback, quindi questi profili non accettano `cdpUrl`. Questa è l'unica modalità di browser autenticato che funziona senza nessuno al computer.
- Impostare `browser.profiles.<name>.userDataDir` quando un profilo di sessione esistente deve collegarsi a un profilo utente Chromium non predefinito (Brave, Edge e così via). Questo percorso accetta anche `~` per la directory home del sistema operativo.

</Accordion>

</AccordionGroup>

## Usare Brave o un altro browser basato su Chromium

Se il browser **predefinito del sistema** è basato su Chromium (Chrome/Brave/Edge/ecc.),
OpenClaw lo usa automaticamente. Impostare `browser.executablePath` per sostituire
il rilevamento automatico. I valori `executablePath` a livello principale e per profilo accettano `~`
per la directory home del sistema operativo:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

In alternativa, impostarlo nella configurazione per ciascuna piattaforma:

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

Il valore `executablePath` specifico del profilo interessa solo i profili gestiti locali avviati da OpenClaw.
I profili `existing-session` si collegano invece a un browser già in esecuzione,
mentre i profili CDP remoti usano il browser associato a `cdpUrl`.

## Controllo locale e remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo sul loopback e può avviare un browser locale.
- **Controllo remoto (host Node):** eseguire un host Node sulla macchina che dispone del browser; il Gateway inoltra tramite proxy le azioni del browser.
- **CDP remoto:** impostare `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) per
  collegarsi a un browser remoto basato su Chromium. In questo caso, OpenClaw non avvia un browser locale.
- Per i servizi CDP gestiti esternamente sul loopback (ad esempio Browserless in
  Docker pubblicato su `127.0.0.1`), impostare anche `attachOnly: true`. Un CDP di loopback
  privo di `attachOnly` viene trattato come profilo browser locale gestito da OpenClaw.
- `headless` interessa solo i profili gestiti locali avviati da OpenClaw. Non riavvia né modifica i browser di sessione esistente o CDP remoti.
- `executablePath` segue la stessa regola dei profili gestiti locali. La modifica su un
  profilo gestito locale in esecuzione contrassegna il profilo per il riavvio o la riconciliazione, in modo che
  l'avvio successivo usi il nuovo binario.

Il comportamento di arresto varia in base alla modalità del profilo:

- profili gestiti locali: `openclaw browser stop` arresta il processo browser avviato da
  OpenClaw
- profili di solo collegamento e CDP remoti: `openclaw browser stop` chiude la sessione
  di controllo attiva e rilascia le sostituzioni di emulazione Playwright/CDP (viewport,
  schema dei colori, impostazioni locali, fuso orario, modalità offline e stati simili), anche
  se OpenClaw non ha avviato alcun processo browser

Gli URL CDP remoti possono includere l'autenticazione:

- Token di query (ad esempio `https://provider.example?token=<token>`)
- Autenticazione HTTP Basic (ad esempio `https://user:pass@provider.example`)

OpenClaw conserva l'autenticazione quando chiama gli endpoint `/json/*` e quando si connette
al WebSocket CDP. Per i token, preferire variabili di ambiente o gestori di segreti
anziché salvarli nei file di configurazione.

## Proxy browser del Node (impostazione predefinita senza configurazione)

Se si esegue un **host del nodo** sulla macchina in cui si trova il browser, OpenClaw può
instradare automaticamente le chiamate agli strumenti del browser verso quel nodo senza alcuna configurazione aggiuntiva del browser.
Questo è il percorso predefinito per i Gateway remoti.

Note:

- L'host del nodo espone il proprio server locale di controllo del browser tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del nodo stesso (come in locale).
- Il comando proxy non consente mai modifiche persistenti ai profili (`create-profile`, `delete-profile`, `reset-profile`), indipendentemente da `allowProfiles`; apportare tali modifiche direttamente sul nodo.
- `nodeHost.browserProxy.allowProfiles` è facoltativo. Lasciarlo vuoto per il comportamento precedente/predefinito: tutti i profili configurati rimangono raggiungibili tramite il proxy.
- Se si imposta `nodeHost.browserProxy.allowProfiles`, OpenClaw lo considera un limite basato sul privilegio minimo, che restringe i nomi dei profili a cui il proxy può accedere.
- Disabilitare questa funzione se non la si desidera:
  - Sul nodo: `nodeHost.browserProxy.enabled=false`
  - Sul Gateway: `gateway.nodes.browser.mode="off"` (accetta anche `"auto"` per scegliere un singolo nodo browser connesso oppure `"manual"` per richiedere un parametro del nodo esplicito)

## Browserless (CDP remoto ospitato)

[Browserless](https://browserless.io) è un servizio Chromium ospitato che espone
URL di connessione CDP tramite HTTPS e WebSocket. OpenClaw può utilizzare entrambi i formati, ma
per un profilo browser remoto l'opzione più semplice è l'URL WebSocket diretto
indicato nella documentazione di connessione di Browserless.

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

- Sostituire `<BROWSERLESS_API_KEY>` con il token Browserless effettivo.
- Scegliere l'endpoint della regione corrispondente all'account Browserless (consultare la relativa documentazione).
- Se Browserless fornisce un URL di base HTTPS, è possibile convertirlo in
  `wss://` per una connessione CDP diretta oppure mantenere l'URL HTTPS e consentire a OpenClaw
  di rilevare `/json/version`.

### Browserless Docker sullo stesso host

Quando Browserless è self-hosted in Docker e OpenClaw viene eseguito sull'host, considerare
Browserless un servizio CDP gestito esternamente:

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
processo OpenClaw. Browserless deve inoltre annunciare un endpoint raggiungibile corrispondente;
impostare `EXTERNAL` di Browserless sulla stessa base WebSocket pubblica e raggiungibile da OpenClaw, ad esempio
`ws://127.0.0.1:3000`, `ws://browserless:3000` oppure un indirizzo di rete Docker privato
stabile. Se `/json/version` restituisce `webSocketDebuggerUrl` che punta a
un indirizzo non raggiungibile da OpenClaw, il CDP HTTP può sembrare operativo mentre il collegamento
WebSocket continua a non riuscire.

Non lasciare `attachOnly` non impostato per un profilo Browserless in loopback. Senza
`attachOnly`, OpenClaw considera la porta di loopback come un profilo browser locale
gestito e può segnalare che la porta è in uso ma non appartiene a OpenClaw.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** anziché
il rilevamento CDP standard basato su HTTP (`/json/version`). OpenClaw accetta tre
formati di URL CDP e seleziona automaticamente la strategia di connessione appropriata:

- **Rilevamento HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw chiama `/json/version` per rilevare l'URL del debugger WebSocket, quindi
  si connette. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si connette direttamente tramite un handshake WebSocket e ignora completamente
  `/json/version`.
- **Radici WebSocket semplici** - `ws://host[:port]` o `wss://host[:port]` senza
  percorso `/devtools/...` (ad esempio [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw tenta prima il rilevamento HTTP
  `/json/version` (normalizzando lo schema in `http`/`https`);
  se il rilevamento restituisce un `webSocketDebuggerUrl`, questo viene utilizzato, altrimenti OpenClaw
  esegue il fallback a un handshake WebSocket diretto sulla radice semplice. Se l'endpoint
  WebSocket annunciato rifiuta l'handshake CDP ma la radice semplice configurata
  lo accetta, OpenClaw esegue il fallback anche a tale radice. Ciò consente a un `ws://`
  semplice che punta a un Chrome locale di connettersi comunque, poiché Chrome accetta gli upgrade
  WebSocket solo sul percorso specifico per destinazione fornito da `/json/version`, mentre i provider
  ospitati possono continuare a utilizzare il proprio endpoint WebSocket radice quando il relativo endpoint di rilevamento
  annuncia un URL di breve durata non adatto a Playwright CDP.

`openclaw browser doctor` utilizza la stessa logica di rilevamento iniziale con fallback
WebSocket usata per il collegamento in fase di esecuzione, pertanto un URL con radice semplice che si connette correttamente non viene
segnalato come irraggiungibile dalla diagnostica.

### Browserbase

[Browserbase](https://www.browserbase.com) è una piattaforma cloud per l'esecuzione di
browser headless con risoluzione CAPTCHA, modalità invisibile e proxy
residenziali integrati.

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

- [Registrarsi](https://www.browserbase.com/sign-up) e copiare la propria **API Key**
  dalla [dashboard Overview](https://www.browserbase.com/overview).
- Sostituire `<BROWSERBASE_API_KEY>` con la chiave API Browserbase effettiva.
- Browserbase crea automaticamente una sessione del browser alla connessione WebSocket, pertanto non è
  necessario alcun passaggio manuale per la creazione della sessione.
- Consultare i [prezzi](https://www.browserbase.com/pricing) per i limiti attuali del piano gratuito e i piani a pagamento.
- Consultare la [documentazione di Browserbase](https://docs.browserbase.com) per il riferimento API
  completo, le guide SDK e gli esempi di integrazione.

### Notte

[Notte](https://www.notte.cc) è una piattaforma cloud per l'esecuzione di browser
headless con modalità invisibile, proxy residenziali e un Gateway WebSocket
nativo per CDP integrati.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Note:

- [Registrarsi](https://console.notte.cc) e copiare la propria **API Key** dalla
  pagina delle impostazioni della console.
- Sostituire `<NOTTE_API_KEY>` con la chiave API Notte effettiva.
- Notte crea automaticamente una sessione del browser alla connessione WebSocket, pertanto non è necessario alcun passaggio
  manuale per la creazione della sessione. La sessione viene eliminata quando
  WebSocket si disconnette.
- Consultare i [prezzi](https://www.notte.cc/#pricing) per i limiti attuali del piano gratuito e i piani a pagamento.
- Consultare la [documentazione di Notte](https://docs.notte.cc) per il riferimento API completo, le guide
  SDK e gli esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo del browser è limitato al loopback; l'accesso passa attraverso l'autenticazione del Gateway o l'associazione del nodo.
- L'API HTTP autonoma del browser in loopback utilizza **esclusivamente l'autenticazione con segreto condiviso**:
  l'autenticazione bearer con token del Gateway, `x-openclaw-password` oppure l'autenticazione HTTP Basic con la
  password del Gateway configurata.
- Le intestazioni di identità Tailscale Serve e `gateway.auth.mode: "trusted-proxy"`
  **non** autenticano questa API autonoma del browser in loopback.
- Se il controllo del browser è abilitato e non è configurata alcuna autenticazione con segreto condiviso, OpenClaw
  genera automaticamente e rende persistente una credenziale di controllo del browser all'avvio:
  un token quando `gateway.auth.mode` è `none` oppure una password quando è
  `trusted-proxy` (resa persistente tramite `gateway.auth.password` affinché i client
  loopback esterni al processo possano risolverla). La generazione automatica viene ignorata quando è già
  configurata una credenziale stringa esplicita per tale modalità oppure quando
  `gateway.auth.mode` è `password`.
- Configurare esplicitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o
  `OPENCLAW_GATEWAY_PASSWORD` se si desidera un segreto stabile sotto il proprio controllo
  anziché quello generato.

Suggerimenti per CDP remoto:

- Preferire endpoint crittografati (HTTPS o WSS) e token di breve durata ove possibile.
- Evitare di incorporare token di lunga durata direttamente nei file di configurazione.
- Mantenere il Gateway e tutti gli host dei nodi su una rete privata (Tailscale); evitare l'esposizione pubblica.
- Trattare gli URL/token CDP remoti come segreti; preferire variabili d'ambiente o un gestore di segreti.

## Profili (browser multipli)

OpenClaw supporta più profili denominati (configurazioni di instradamento). I profili possono essere:

- **gestiti da OpenClaw**: un'istanza dedicata di browser basato su Chromium con la propria directory dei dati utente e porta CDP
- **remoti**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il profilo Chrome esistente tramite la connessione automatica di Chrome DevTools MCP

Valori predefiniti:

- Il profilo `openclaw` viene creato automaticamente se mancante.
- Il profilo `user` è integrato per il collegamento a una sessione esistente tramite Chrome MCP.
- I profili con sessione esistente sono facoltativi oltre a `user`; crearli con `--driver existing-session`.
- Le porte CDP locali vengono allocate nell'intervallo **18800-18899** per impostazione predefinita.
- L'eliminazione di un profilo sposta la relativa directory dei dati locali nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI utilizza `--browser-profile`.

## Sessione esistente tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser basato su Chromium in esecuzione tramite il
server ufficiale Chrome DevTools MCP. In questo modo vengono riutilizzate le schede e lo stato di accesso
già aperti nel profilo browser.

Riferimenti ufficiali per il contesto e la configurazione:

- [Chrome for Developers: utilizzare Chrome DevTools MCP con la sessione del browser](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README di Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato: `user`. Creare un profilo personalizzato con sessione esistente se
si desidera un nome, un colore o una directory dei dati del browser diversi.

Per impostazione predefinita, il profilo integrato `user` utilizza la connessione automatica di Chrome MCP, che
punta al profilo Google Chrome locale predefinito. Utilizzare `userDataDir` per Brave,
Edge, Chromium o un profilo Chrome non predefinito. `~` si espande nella directory home
del sistema operativo:

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

1. Aprire la pagina di ispezione del browser per il debug remoto.
2. Abilitare il debug remoto.
3. Mantenere il browser in esecuzione e approvare la richiesta di connessione quando OpenClaw si collega.

Pagine di ispezione comuni:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test rapido di collegamento in tempo reale:

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
- `snapshot` restituisce i riferimenti dalla scheda attiva selezionata

Cosa verificare se il collegamento non funziona:

- il browser di destinazione basato su Chromium è alla versione `144+`
- il debug remoto è abilitato nella pagina di ispezione del browser
- il browser ha mostrato la richiesta di consenso al collegamento ed è stata accettata
- se Chrome è stato avviato con un `--remote-debugging-port` esplicito, impostare
  `browser.profiles.<name>.cdpUrl` su tale endpoint DevTools anziché affidarsi
  alla connessione automatica di Chrome MCP
- `openclaw doctor` migra la vecchia configurazione del browser basata sull'estensione e verifica che
  Chrome sia installato localmente per i profili predefiniti con connessione automatica, ma non può
  abilitare automaticamente il debug remoto nel browser

Uso da parte dell'agente:

- Usare `profile="user"` quando è necessario lo stato autenticato del browser dell'utente.
- Se si usa un profilo personalizzato di sessione esistente, passare esplicitamente il nome del profilo.
- Scegliere questa modalità solo quando l'utente è al computer per approvare la richiesta
  di collegamento.
- L'host del Gateway o del Node può avviare `npx chrome-devtools-mcp@latest --autoConnect`.

Note:

- Questo percorso presenta un rischio maggiore rispetto al profilo isolato `openclaw`, perché può
  operare all'interno della sessione autenticata del browser.
- OpenClaw non avvia il browser per questo driver; si limita a collegarsi.
- OpenClaw usa qui il flusso ufficiale `--autoConnect` di Chrome DevTools MCP. Se
  `userDataDir` è impostato, viene trasmesso per usare come destinazione tale directory dei dati utente.
- La sessione esistente può collegarsi sull'host selezionato o tramite un
  Node browser connesso. Se Chrome si trova altrove e non è connesso alcun Node browser, usare
  CDP remoto o un host Node.
- Le destinazioni Chrome MCP e i riferimenti delle istantanee sono circoscritti a un singolo sottoprocesso MCP. Dopo
  il riavvio del processo, eseguire nuovamente `browser tabs`, selezionare esplicitamente una nuova
  destinazione prima delle operazioni specifiche per la destinazione e acquisire una nuova istantanea prima di usare i riferimenti.
  Ogni riferimento è valido soltanto per la propria destinazione e per l'istantanea più recente. I vecchi alias non vengono
  trasferiti a una scheda sostitutiva, anche quando il relativo URL coincide.
- Chrome DevTools MCP attualmente instrada gli strumenti della pagina tramite un ID pagina numerico
  locale al processo. Gli handle circoscritti al processo impediscono il riutilizzo dopo la sostituzione del sottoprocesso, ma la
  sostituzione del contesto del browser all'interno del processo tra due chiamate consecutive dello strumento può comunque
  cambiare la destinazione di un'azione. Un instradamento completamente atomico richiede il supporto upstream degli strumenti della pagina
  per ID di destinazione stabili.

### Avvio personalizzato di Chrome MCP

Sostituire per ogni profilo il server Chrome DevTools MCP avviato quando il flusso predefinito
`npx chrome-devtools-mcp@latest` non è quello desiderato (host offline,
versioni fissate, binari forniti localmente):

| Campo        | Funzione                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Eseguibile da avviare al posto di `npx`. Viene risolto così com'è; i percorsi assoluti vengono rispettati.                                          |
| `mcpArgs`    | Array di argomenti passato senza modifiche a `mcpCommand`. Sostituisce gli argomenti predefiniti `chrome-devtools-mcp@latest --autoConnect`. |

Quando `cdpUrl` è impostato su un profilo di sessione esistente, OpenClaw ignora
`--autoConnect` e inoltra automaticamente l'endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint di rilevamento HTTP di DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP diretto).

I flag dell'endpoint e `userDataDir` non possono essere combinati: quando `cdpUrl` è impostato,
`userDataDir` viene ignorato per l'avvio di Chrome MCP, poiché Chrome MCP si collega al
browser in esecuzione dietro l'endpoint anziché aprire una directory
del profilo.

<Accordion title="Limitazioni della funzionalità di sessione esistente">

Rispetto al profilo gestito `openclaw`, i driver di sessione esistente presentano maggiori limitazioni:

- **Screenshot** - le acquisizioni della pagina e le acquisizioni degli elementi `--ref` funzionano; i selettori CSS `--element` no. Playwright non è necessario per gli screenshot della pagina o degli elementi basati su riferimenti. (`--full-page` non può essere combinato con `--ref` o `--element` in alcun profilo, non soltanto nelle sessioni esistenti.)
- **Azioni** - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono riferimenti dell'istantanea (senza selettori CSS). `click-coords` fa clic sulle coordinate visibili della finestra e non richiede un riferimento dell'istantanea. `click` supporta soltanto il pulsante sinistro (senza sostituzioni del pulsante o modificatori). `type` non supporta `slowly=true`; usare `fill` o `press`. `press` non supporta `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` e `fill` non supportano sostituzioni di `timeoutMs` per singola chiamata; `evaluate` le supporta. `select` accetta un singolo valore. `batch` non è supportato; inviare le azioni singolarmente.
- **Attesa / caricamento / finestra di dialogo** - `wait --url` supporta corrispondenze esatte, sottostringhe e modelli glob (come nella modalità gestita); `wait --load networkidle` non è supportato nei profili di sessione esistente (funziona nei profili gestiti e CDP grezzi/remoti). Gli hook di caricamento richiedono `ref` o `inputRef`, un file alla volta, senza `element` CSS. Gli hook delle finestre di dialogo non supportano sostituzioni del timeout o `dialogId`.
- **Visibilità delle finestre di dialogo** - le risposte alle azioni del browser gestito includono `blockedByDialog` e `browserState.dialogs.pending` quando un'azione apre una finestra di dialogo modale; le istantanee includono anche lo stato della finestra di dialogo in sospeso. Rispondere con `browser dialog --accept/--dismiss --dialog-id <id>` mentre è presente una finestra di dialogo in sospeso. Le finestre di dialogo gestite esternamente a OpenClaw compaiono in `browserState.dialogs.recent`.
- **Funzionalità riservate alla modalità gestita** - l'esportazione in PDF, l'intercettazione dei download e `responsebody` richiedono ancora il percorso del browser gestito.

</Accordion>

## Garanzie di isolamento

- **Directory dedicata dei dati utente**: non accede mai al profilo personale del browser.
- **Porte dedicate**: evita `9222` per prevenire conflitti con i flussi di lavoro di sviluppo.
- **Controllo deterministico delle schede**: `tabs` restituisce prima `suggestedTargetId`, quindi
  handle `tabId` stabili come `t1`, etichette facoltative e il valore `targetId` non elaborato.
  Gli agenti devono riutilizzare `suggestedTargetId`; gli ID non elaborati restano disponibili per
  il debug e la compatibilità.

## Selezione del browser

All'avvio locale, OpenClaw seleziona il primo disponibile:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

È possibile sostituirlo con `browser.executablePath`.

Piattaforme:

- macOS: controlla `/Applications` e `~/Applications`.
- Linux: controlla le posizioni comuni di Chrome/Brave/Edge/Chromium in `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` e
  `/usr/lib/chromium-browser`, oltre a Chromium gestito da Playwright in
  `PLAYWRIGHT_BROWSERS_PATH` o `~/.cache/ms-playwright`.
- Windows: controlla le posizioni di installazione comuni.

## API di controllo (facoltativa)

Per lo scripting e il debug, il Gateway espone una piccola **API di controllo HTTP
accessibile solo tramite loopback**, oltre a una CLI `openclaw browser` corrispondente (istantanee, riferimenti, funzionalità avanzate
di attesa, output JSON, flussi di lavoro di debug). Consultare
[API di controllo del browser](/it/tools/browser-control) per il riferimento completo.

## Risoluzione dei problemi

Per problemi specifici di Linux (in particolare Chromium installato tramite snap), consultare
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni con Gateway WSL2 e Chrome per Windows su host separati, consultare
[Risoluzione dei problemi di WSL2 + Windows + CDP remoto di Chrome](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP ed errore di navigazione bloccata dalla protezione SSRF

Si tratta di classi di errore diverse, che rimandano a percorsi del codice differenti.

- **Errore di avvio o disponibilità di CDP** significa che OpenClaw non può confermare il corretto funzionamento del piano di controllo del browser.
- **Blocco SSRF della navigazione** significa che il piano di controllo del browser funziona correttamente, ma una destinazione di navigazione della pagina viene rifiutata dai criteri.

Esempi comuni:

- Errore di avvio o disponibilità di CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` quando un
    servizio CDP esterno su loopback è configurato senza `attachOnly: true`
- Blocco SSRF della navigazione:
  - I flussi `open`, `navigate`, di istantanea o di apertura delle schede non riescono a causa di un errore dei criteri del browser o di rete, mentre `start` e `tabs` continuano a funzionare

Usare questa sequenza minima per distinguere i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come interpretare i risultati:

- Se `start` non riesce con `not reachable after start`, risolvere prima i problemi di disponibilità di CDP.
- Se `start` riesce ma `tabs` non riesce, il piano di controllo non funziona ancora correttamente. Considerarlo un problema di raggiungibilità di CDP, non un problema di navigazione della pagina.
- Se `start` e `tabs` riescono, ma `open` o `navigate` non riesce, il piano di controllo del browser è attivo e l'errore riguarda i criteri di navigazione o la pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso di controllo di base del browser gestito funziona correttamente.

Dettagli importanti sul comportamento:

- Per impostazione predefinita, la configurazione del browser usa un oggetto di criteri SSRF che blocca in caso di errore, anche quando `browser.ssrfPolicy` non è configurato.
- Per il profilo gestito locale su loopback `openclaw`, i controlli di integrità di CDP ignorano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il piano di controllo locale di OpenClaw.
- La protezione della navigazione è separata. Il risultato positivo di `start` o `tabs` non implica che una successiva destinazione `open` o `navigate` sia consentita.

Indicazioni di sicurezza:

- **Non** rendere meno restrittivi i criteri SSRF del browser per impostazione predefinita.
- Preferire eccezioni limitate agli host, come `hostnameAllowlist` o `allowedHostnames`, rispetto a un accesso esteso alla rete privata.
- Usare `dangerouslyAllowPrivateNetwork: true` soltanto in ambienti intenzionalmente attendibili in cui l'accesso del browser alla rete privata è necessario ed è stato sottoposto a revisione.

## Strumenti dell'agente e funzionamento del controllo

L'agente dispone di **un solo strumento** per l'automazione del browser:

- `browser` - diagnosi/stato/avvio/arresto/schede/apertura/messa a fuoco/chiusura/istantanea/screenshot/navigazione/azione

Corrispondenza:

- `browser snapshot` restituisce un albero dell'interfaccia utente stabile (AI o ARIA).
- `browser act` utilizza gli ID `ref` dello snapshot per fare clic, digitare, trascinare o selezionare.
- `browser screenshot` acquisisce i pixel (pagina intera, elemento o riferimenti con etichetta).
- `browser doctor` verifica che Gateway, plugin, profilo, browser e scheda siano pronti.
- `browser` accetta:
  - `profile` per scegliere un profilo browser denominato (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove risiede il browser.
  - Nelle sessioni in sandbox, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` viene omesso: per impostazione predefinita, le sessioni in sandbox utilizzano `sandbox`, mentre le sessioni non in sandbox utilizzano `host`.
  - Se è connesso un nodo compatibile con il browser, lo strumento può instradarsi automaticamente verso di esso, a meno che non venga impostato esplicitamente `target="host"` o `target="node"`.

Ciò mantiene deterministico l'agente ed evita selettori fragili.

## Correlati

- [Panoramica degli strumenti](/it/tools) - tutti gli strumenti disponibili per l'agente
- [Sandboxing](/it/gateway/sandboxing) - controllo del browser negli ambienti in sandbox
- [Sicurezza](/it/gateway/security) - rischi e misure di protezione per il controllo del browser
