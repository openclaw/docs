---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug di autenticazione Gateway, modalità bind e connettività
    - Individuazione dei Gateway tramite Bonjour (DNS-SD locale + wide-area)
sidebarTitle: Gateway
summary: CLI Gateway OpenClaw (`openclaw gateway`) — esegui, interroga e individua i Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:25:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Il Gateway è il server WebSocket di OpenClaw (canali, Node, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Individuazione Bonjour" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD wide-area.
  </Card>
  <Card title="Panoramica individuazione" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e trova i Gateway.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration">
    Chiavi di configurazione Gateway di primo livello.
  </Card>
</CardGroup>

## Eseguire il Gateway

Esegui un processo Gateway locale:

```bash
openclaw gateway
```

Alias in foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    - Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma manca `gateway.mode`, trattalo come una configurazione danneggiata o sovrascritta e riparala invece di presumere implicitamente la modalità locale.
    - Se il file esiste e manca `gateway.mode`, il Gateway lo tratta come un danno sospetto alla configurazione e si rifiuta di "supporre la modalità locale" per te.
    - Il bind oltre il loopback senza autenticazione viene bloccato (rail di sicurezza).
    - `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre apply/update di strumenti/configurazione del gateway restano consentiti).
    - I gestori `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato personalizzato del terminale. Se racchiudi la CLI con una TUI o input in raw mode, ripristina il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito proviene da config/env; di solito `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modalità bind del listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Override della modalità di autenticazione.
</ParamField>
<ParamField path="--token <token>" type="string">
  Override del token (imposta anche `OPENCLAW_GATEWAY_TOKEN` per il processo).
</ParamField>
<ParamField path="--password <password>" type="string">
  Override della password.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Legge la password del gateway da un file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Espone il Gateway tramite Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reimposta la configurazione Tailscale serve/funnel all'arresto.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consente l'avvio del gateway senza `gateway.mode=local` nella configurazione. Aggira il guard di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configurazione + workspace di sviluppo se mancanti (salta BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reimposta configurazione di sviluppo + credenziali + sessioni + workspace (richiede `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Termina qualsiasi listener esistente sulla porta selezionata prima dell'avvio.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Log dettagliati.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostra nella console solo i log del backend CLI (e abilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Stile del log WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias per `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra gli eventi raw dello stream del modello in jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Percorso jsonl del raw stream.
</ParamField>

<Warning>
La `--password` inline può essere esposta negli elenchi dei processi locali. Preferisci `--password-file`, env o un `gateway.auth.password` supportato da SecretRef.
</Warning>

### Profilazione dell'avvio

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare le prestazioni di avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz` e i tempi del trace di avvio.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano WebSocket RPC.

<Tabs>
  <Tab title="Modalità di output">
    - Predefinita: leggibile per gli esseri umani (a colori in TTY).
    - `--json`: JSON leggibile dalla macchina (senza stile/spinner).
    - `--no-color` (oppure `NO_COLOR=1`): disabilita ANSI mantenendo il layout leggibile.

  </Tab>
  <Tab title="Opzioni condivise">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia in base al comando).
    - `--expect-final`: attende una risposta "final" (chiamate agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non usa credenziali di fallback da configurazione o ambiente. Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una sonda di liveness: risponde non appena il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre sidecar di avvio, canali o hook configurati stanno ancora stabilizzandosi.

### `gateway usage-cost`

Recupera riepiloghi di usage-cost dai log di sessione.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Numero di giorni da includere.
</ParamField>

### `gateway stability`

Recupera il registratore recente di stabilità diagnostica da un Gateway in esecuzione.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Numero massimo di eventi recenti da includere (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra per tipo di evento diagnostico, ad esempio `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Include solo eventi dopo un numero di sequenza diagnostica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Legge un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o semplicemente `--bundle`) per il bundle più recente sotto la directory di stato, oppure passa direttamente un percorso JSON del bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Scrive un file zip di diagnostica di supporto condivisibile invece di stampare i dettagli di stabilità.
</ParamField>
<ParamField path="--output <path>" type="string">
  Percorso di output per `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy e comportamento del bundle">
    - I record mantengono metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di coda/sessione, nomi dei canali/plugin e riepiloghi di sessione redatti. Non mantengono testo delle chat, corpi dei Webhook, output degli strumenti, corpi grezzi di richiesta o risposta, token, cookie, valori segreti, nomi host o id di sessione grezzi. Imposta `diagnostics.enabled: false` per disabilitare completamente il registratore.
    - In caso di uscite fatali del Gateway, timeout di arresto e errori di avvio durante il riavvio, OpenClaw scrive la stessa istantanea diagnostica in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il registratore contiene eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive uno zip diagnostico locale progettato per essere allegato ai bug report. Per il modello di privacy e il contenuto del bundle, vedi [Esportazione diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso dello zip di output. Per impostazione predefinita usa un export di supporto sotto la directory di stato.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Numero massimo di righe di log sanificate da includere.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Numero massimo di byte di log da ispezionare.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway per l'istantanea di stato.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway per l'istantanea di stato.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway per l'istantanea di stato.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout dell'istantanea di stato/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Salta la ricerca del bundle di stabilità persistito.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa percorso scritto, dimensione e manifesto come JSON.
</ParamField>

L'export contiene un manifesto, un riepilogo Markdown, la struttura della configurazione, dettagli di configurazione sanificati, riepiloghi di log sanificati, istantanee sanificate di stato/health del Gateway e il bundle di stabilità più recente quando esiste.

È pensato per essere condiviso. Mantiene dettagli operativi utili al debug, come campi sicuri dei log OpenClaw, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, id dei plugin, id dei provider, impostazioni di funzionalità non segrete e messaggi di log operativi redatti. Omette o redige testo delle chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l'export conserva solo il fatto che un messaggio è stato omesso più il suo conteggio byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una sonda opzionale di connettività/capacità di autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge una destinazione di sonda esplicita. Il remoto configurato + localhost vengono comunque sondati.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticazione token per la sonda.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticazione password per la sonda.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout della sonda.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Salta la sonda di connettività (vista solo servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analizza anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Eleva la sonda di connettività predefinita a sonda di lettura ed esce con valore non zero quando quella sonda di lettura fallisce. Non può essere combinata con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale manca o non è valida.
    - Il comando predefinito `gateway status` dimostra lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile al momento dell'handshake. Non dimostra operazioni di lettura/scrittura/amministrazione.
    - Le sonde diagnostiche non modificano l'autenticazione del dispositivo al primo accesso: riutilizzano un token dispositivo già in cache quando esiste, ma non creano una nuova identità dispositivo CLI o un record di associazione dispositivo in sola lettura solo per controllare lo stato.
    - `gateway status` risolve i SecretRef di autenticazione configurati per l'autenticazione della sonda quando possibile.
    - Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `gateway status --json` riporta `rpc.authWarning` quando la connettività/autenticazione della sonda fallisce; passa esplicitamente `--token`/`--password` oppure risolvi prima la sorgente del segreto.
    - Se la sonda riesce, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
    - Usa `--require-rpc` negli script e nelle automazioni quando un servizio in ascolto non è sufficiente e hai bisogno che anche le chiamate RPC di scope lettura siano integre.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a gateway, l'output leggibile mostra suggerimenti di pulizia e avvisa che nella maggior parte delle configurazioni dovrebbe essere in esecuzione un solo gateway per macchina.
    - L'output leggibile include il percorso risolto del log file più l'istantanea dei percorsi/validità di configurazione CLI-vs-service per aiutare a diagnosticare derive di profilo o state-dir.

  </Accordion>
  <Accordion title="Controlli Linux systemd di deriva dell'autenticazione">
    - Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, file multipli e file opzionali `-`).
    - I controlli di deriva risolvono i SecretRef `gateway.auth.token` usando l'env runtime unito (prima l'env del comando di servizio, poi fallback all'env del processo).
    - Se l'autenticazione token non è effettivamente attiva (modalità `gateway.auth.mode` esplicita `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando "debug di tutto". Esegue sempre la sonda su:

- il gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se è configurato un remoto**.

Se passi `--url`, questa destinazione esplicita viene aggiunta prima di entrambe. L'output leggibile etichetta le destinazioni come:

- `URL (esplicito)`
- `Remoto (configurato)` o `Remoto (configurato, inattivo)`
- `local loopback`

<Note>
Se più gateway sono raggiungibili, li stampa tutti. Più gateway sono supportati quando usi profili/porte isolati (ad esempio un rescue bot), ma nella maggior parte delle installazioni è comunque in esecuzione un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Reachable: yes` significa che almeno una destinazione ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` riporta ciò che la sonda è riuscita a dimostrare sull'autenticazione. È separato dalla raggiungibilità.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con scope lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l'RPC con scope lettura è limitato. Questo viene riportato come raggiungibilità **degradata**, non come errore completo.
    - Come `gateway status`, la sonda riutilizza l'autenticazione del dispositivo già in cache ma non crea uno stato di identità o pairing del dispositivo al primo accesso.
    - Il codice di uscita è diverso da zero solo quando nessuna destinazione sondata è raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno una destinazione è raggiungibile.
    - `degraded`: almeno una destinazione aveva RPC di dettaglio limitato dallo scope.
    - `capability`: migliore capacità vista tra le destinazioni raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: migliore destinazione da trattare come vincitrice attiva in quest'ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` e `discovery.count`: budget/numero risultati effettivo di discovery usato per questo passaggio di probe.

    Per destinazione (`targets[].connect`):

    - `ok`: raggiungibilità dopo connessione + classificazione degradata.
    - `rpcOk`: pieno successo dell'RPC di dettaglio.
    - `scopeLimited`: RPC di dettaglio fallito per assenza di operator scope.

    Per destinazione (`targets[].auth`):

    - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
    - `scopes`: scope concessi riportati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacità di autenticazione esposta per quella destinazione.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH non riuscita; il comando è tornato alle sonde dirette.
    - `multiple_gateways`: più di una destinazione era raggiungibile; è insolito a meno che tu non stia eseguendo intenzionalmente profili isolati, come un rescue bot.
    - `auth_secretref_unresolved`: un SecretRef di autenticazione configurato non è stato risolto per una destinazione fallita.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma la sonda di lettura è stata limitata dall'assenza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto tramite SSH (parità con l'app Mac)

La modalità "Remote over SSH" dell'app macOS usa un port-forward locale così il gateway remoto (che può essere bindato solo al loopback) diventa raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` oppure `user@host:port` (la porta è `22` per impostazione predefinita).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File di identità.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Sceglie come destinazione SSH il primo host gateway individuato dall'endpoint di discovery risolto (`local.` più l'eventuale dominio wide-area configurato). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Configurazione (facoltativa, usata come valore predefinito):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC di basso livello.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Stringa oggetto JSON per i parametri.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Budget di timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente per RPC in stile agente che trasmettono eventi intermedi prima di un payload finale.
</ParamField>
<ParamField path="--json" type="boolean">
  Output JSON leggibile dalla macchina.
</ParamField>

<Note>
`--params` deve essere JSON valido.
</Note>

## Gestire il servizio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Opzioni dei comandi">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Note su installazione e ciclo di vita del servizio">
    - `gateway install` supporta `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.
    - Quando l'autenticazione token richiede un token e `gateway.auth.token` è gestito tramite SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione token richiede un token e il SecretRef del token configurato non viene risolto, l'installazione fallisce in modalità fail-closed invece di persistere un fallback plaintext.
    - Per l'autenticazione password in `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` supportato da SecretRef invece di `--password` inline.
    - In modalità di autenticazione dedotta, il solo `OPENCLAW_GATEWAY_PASSWORD` nella shell non allenta i requisiti del token per l'installazione; usa una configurazione persistente (`gateway.auth.password` o `env` di configurazione) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
    - I comandi di ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
</AccordionGroup>

## Individuare i Gateway (Bonjour)

`gateway discover` esegue una scansione dei beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [Bonjour](/it/gateway/bonjour).

Solo i gateway con l'individuazione Bonjour abilitata (predefinita) pubblicizzano il beacon.

I record di discovery Wide-Area includono (TXT):

- `role` (suggerimento del ruolo del gateway)
- `transport` (suggerimento del trasporto, ad esempio `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (facoltativa; i client usano `22` come predefinito per le destinazioni SSH quando è assente)
- `tailnetDns` (hostname MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + fingerprint del certificato)
- `cliPath` (suggerimento di installazione remota scritto nella zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per comando (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Output leggibile dalla macchina (disabilita anche stile/spinner).
</ParamField>

Esempi:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI esegue la scansione di `local.` più l'eventuale dominio wide-area configurato quando è abilitato.
- `wsUrl` nell'output JSON è derivato dall'endpoint del servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su `local.` mDNS, `sshPort` e `cliPath` vengono trasmessi solo quando `discovery.mdns.mode` è `full`. Il DNS-SD wide-area continua comunque a scrivere `cliPath`; anche lì `sshPort` resta facoltativo.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
