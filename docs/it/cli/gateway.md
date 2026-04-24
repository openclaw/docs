---
read_when:
    - Eseguire il Gateway dalla CLI (sviluppo o server)
    - Debug del Gateway, dell'autenticazione, delle modalità di bind e della connettività
    - Individuare i gateway tramite Bonjour (DNS-SD locale e wide-area)
summary: CLI del Gateway OpenClaw (`openclaw gateway`) — eseguire, interrogare e individuare i gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-24T08:33:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI del Gateway

Il Gateway è il server WebSocket di OpenClaw (canali, Node, sessioni, hook).

I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

Documenti correlati:

- [/gateway/bonjour](/it/gateway/bonjour)
- [/gateway/discovery](/it/gateway/discovery)
- [/gateway/configuration](/it/gateway/configuration)

## Eseguire il Gateway

Esegui un processo Gateway locale:

```bash
openclaw gateway
```

Alias in foreground:

```bash
openclaw gateway run
```

Note:

- Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
- `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, trattalo come una configurazione danneggiata o sovrascritta e riparala invece di assumere implicitamente la modalità locale.
- Se il file esiste e `gateway.mode` manca, il Gateway tratta la situazione come un danno sospetto alla configurazione e si rifiuta di “indovinare local” per te.
- Il bind oltre il loopback senza autenticazione è bloccato (guardrail di sicurezza).
- `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre apply/update di tool/config del gateway restano consentiti).
- I gestori `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato personalizzato del terminale. Se incapsuli la CLI con una TUI o input in modalità raw, ripristina il terminale prima dell'uscita.

### Opzioni

- `--port <port>`: porta WebSocket (il valore predefinito viene da config/env; di solito `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modalità di bind del listener.
- `--auth <token|password>`: override della modalità di autenticazione.
- `--token <token>`: override del token (imposta anche `OPENCLAW_GATEWAY_TOKEN` per il processo).
- `--password <password>`: override della password. Attenzione: le password inline possono essere esposte negli elenchi di processi locali.
- `--password-file <path>`: legge la password del gateway da un file.
- `--tailscale <off|serve|funnel>`: espone il Gateway tramite Tailscale.
- `--tailscale-reset-on-exit`: ripristina la configurazione serve/funnel di Tailscale allo spegnimento.
- `--allow-unconfigured`: consente l'avvio del gateway senza `gateway.mode=local` nella configurazione. Questo bypassa il guardrail di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
- `--dev`: crea una configurazione + workspace di sviluppo se mancano (salta BOOTSTRAP.md).
- `--reset`: reimposta configurazione di sviluppo + credenziali + sessioni + workspace (richiede `--dev`).
- `--force`: termina qualunque listener esistente sulla porta selezionata prima dell'avvio.
- `--verbose`: log verbosi.
- `--cli-backend-logs`: mostra nella console solo i log backend della CLI (e abilita stdout/stderr).
- `--ws-log <auto|full|compact>`: stile dei log websocket (predefinito `auto`).
- `--compact`: alias di `--ws-log compact`.
- `--raw-stream`: registra gli eventi raw dello stream del modello in jsonl.
- `--raw-stream-path <path>`: percorso jsonl dello stream raw.

Profilazione dell'avvio:

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare le prestazioni di avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz` e i tempi della traccia di avvio.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano WebSocket RPC.

Modalità di output:

- Predefinita: leggibile per umani (colorata in TTY).
- `--json`: JSON leggibile dalla macchina (senza styling/spinner).
- `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout leggibile per umani.

Opzioni condivise (dove supportate):

- `--url <url>`: URL WebSocket del Gateway.
- `--token <token>`: token del Gateway.
- `--password <password>`: password del Gateway.
- `--timeout <ms>`: timeout/budget (varia per comando).
- `--expect-final`: attende una risposta “final” (chiamate agente).

Nota: quando imposti `--url`, la CLI non usa fallback alle credenziali di configurazione o ambiente.
Passa `--token` o `--password` esplicitamente. La mancanza di credenziali esplicite è un errore.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una probe di liveness: risponde appena il server è in grado di servire HTTP. L'endpoint HTTP `/readyz` è più restrittivo e resta rosso mentre sidecar di avvio, canali o hook configurati stanno ancora completando l'inizializzazione.

### `gateway usage-cost`

Recupera i riepiloghi di costo d'uso dai log di sessione.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opzioni:

- `--days <days>`: numero di giorni da includere (predefinito `30`).

### `gateway stability`

Recupera il recorder di stabilità diagnostica recente da un Gateway in esecuzione.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Opzioni:

- `--limit <limit>`: numero massimo di eventi recenti da includere (predefinito `25`, massimo `1000`).
- `--type <type>`: filtra per tipo di evento diagnostico, come `payload.large` o `diagnostic.memory.pressure`.
- `--since-seq <seq>`: include solo eventi successivi a un numero di sequenza diagnostica.
- `--bundle [path]`: legge un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o semplicemente `--bundle`) per il bundle più recente sotto la directory di stato, oppure passa direttamente un percorso JSON del bundle.
- `--export`: scrive uno zip di diagnostica di supporto condivisibile invece di stampare i dettagli di stabilità.
- `--output <path>`: percorso di output per `--export`.

Note:

- I record mantengono metadati operativi: nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di coda/sessione, nomi di canale/plugin e riepiloghi di sessione redatti. Non mantengono testo della chat, corpi webhook, output dei tool, corpi raw di richieste o risposte, token, cookie, valori segreti, hostname o ID di sessione raw. Imposta `diagnostics.enabled: false` per disabilitare completamente il recorder.
- In caso di uscite fatali del Gateway, timeout di shutdown e fallimenti di avvio dopo un riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder contiene eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

### `gateway diagnostics export`

Scrive uno zip diagnostico locale pensato per essere allegato ai bug report.
Per il modello di privacy e il contenuto del bundle, vedi [Esportazione della diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opzioni:

- `--output <path>`: percorso dello zip di output. Il valore predefinito è un export di supporto sotto la directory di stato.
- `--log-lines <count>`: numero massimo di righe di log sanitizzate da includere (predefinito `5000`).
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare (predefinito `1000000`).
- `--url <url>`: URL WebSocket del Gateway per lo snapshot di health.
- `--token <token>`: token del Gateway per lo snapshot di health.
- `--password <password>`: password del Gateway per lo snapshot di health.
- `--timeout <ms>`: timeout dello snapshot di stato/health (predefinito `3000`).
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa come JSON il percorso scritto, la dimensione e il manifest.

L'export contiene un manifest, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanitizzati, riepiloghi di log sanitizzati, snapshot di stato/health del Gateway sanitizzati e il bundle di stabilità più recente quando esiste.

È pensato per essere condiviso. Mantiene dettagli operativi che aiutano nel debug, come campi di log sicuri di OpenClaw, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, ID plugin, ID provider, impostazioni di funzionalità non segrete e messaggi di log operativi redatti. Omette o redige testo della chat, corpi webhook, output dei tool, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, hostname e valori segreti. Quando un messaggio in stile LogTape sembra testo payload di utente/chat/tool, l'export mantiene solo il fatto che un messaggio è stato omesso più il conteggio dei suoi byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una probe facoltativa di connettività/capacità di autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opzioni:

- `--url <url>`: aggiunge un target di probe esplicito. Il remoto configurato + localhost vengono comunque sottoposti a probe.
- `--token <token>`: autenticazione token per la probe.
- `--password <password>`: autenticazione password per la probe.
- `--timeout <ms>`: timeout della probe (predefinito `10000`).
- `--no-probe`: salta la probe di connettività (vista solo servizio).
- `--deep`: esegue anche la scansione dei servizi a livello di sistema.
- `--require-rpc`: promuove la probe di connettività predefinita a probe di lettura ed esce con valore non zero quando la probe di lettura fallisce. Non può essere combinato con `--no-probe`.

Note:

- `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale manca o non è valida.
- Il `gateway status` predefinito dimostra stato del servizio, connessione WebSocket e capacità di autenticazione visibile al momento dell'handshake. Non dimostra operazioni di lettura/scrittura/amministrazione.
- `gateway status` risolve, quando possibile, i SecretRef di autenticazione configurati per l'autenticazione della probe.
- Se un SecretRef di autenticazione richiesto non è risolto in questo percorso di comando, `gateway status --json` riporta `rpc.authWarning` quando la connettività/autenticazione della probe fallisce; passa `--token`/`--password` esplicitamente o risolvi prima la sorgente del segreto.
- Se la probe ha successo, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
- Usa `--require-rpc` negli script e nell'automazione quando un servizio in ascolto non è sufficiente e hai bisogno che anche le chiamate RPC con scope di lettura siano sane.
- `--deep` aggiunge una scansione best-effort per installazioni extra di launchd/systemd/schtasks. Quando vengono rilevati più servizi simili a gateway, l'output leggibile per umani stampa suggerimenti di pulizia e avvisa che nella maggior parte delle configurazioni dovrebbe essere eseguito un solo gateway per macchina.
- L'output leggibile per umani include il percorso risolto del log file più uno snapshot dei percorsi/validità di configurazione CLI-vs-service per aiutare a diagnosticare derive di profilo o state-dir.
- Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, più file e file facoltativi con `-`).
- I controlli di deriva risolvono i SecretRef di `gateway.auth.token` usando l'env runtime unito (prima l'env del comando di servizio, poi fallback all'env del processo).
- Se l'autenticazione token non è effettivamente attiva (modalità esplicita `gateway.auth.mode` pari a `password`/`none`/`trusted-proxy`, oppure modalità non impostata dove può prevalere la password e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

### `gateway probe`

`gateway probe` è il comando “debugga tutto”. Esegue sempre la probe di:

- il tuo gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se è configurato un remoto**.

Se passi `--url`, quel target esplicito viene aggiunto prima di entrambi. L'output leggibile per umani etichetta i
target come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

Se sono raggiungibili più gateway, li stampa tutti. Più gateway sono supportati quando usi profili/porte isolate (ad esempio, un rescue bot), ma la maggior parte delle installazioni esegue comunque un solo gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretazione:

- `Reachable: yes` significa che almeno un target ha accettato una connessione WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` riporta ciò che la probe è riuscita a dimostrare sull'autenticazione. È separato dalla raggiungibilità.
- `Read probe: ok` significa che anche le chiamate RPC di dettaglio con scope di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
- `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma la RPC con scope di lettura è limitata. Questo viene riportato come raggiungibilità **degradata**, non come errore completo.
- Il codice di uscita è non zero solo quando nessun target sottoposto a probe è raggiungibile.

Note JSON (`--json`):

- Livello superiore:
  - `ok`: almeno un target è raggiungibile.
  - `degraded`: almeno un target aveva RPC di dettaglio limitate dagli scope.
  - `capability`: migliore capacità osservata tra i target raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
  - `primaryTargetId`: miglior target da considerare come vincitore attivo in questo ordine: URL esplicito, tunnel SSH, remoto configurato, poi loopback locale.
  - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
  - `network`: suggerimenti URL di loopback locale/tailnet derivati dalla configurazione corrente e dal networking dell'host.
  - `discovery.timeoutMs` e `discovery.count`: budget di discovery/conteggio risultati effettivamente usato per questo passaggio di probe.
- Per target (`targets[].connect`):
  - `ok`: raggiungibilità dopo la connessione + classificazione degradata.
  - `rpcOk`: successo completo della RPC di dettaglio.
  - `scopeLimited`: la RPC di dettaglio è fallita a causa della mancanza dello scope operator.
- Per target (`targets[].auth`):
  - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
  - `scopes`: scope concessi riportati in `hello-ok` quando disponibili.
  - `capability`: classificazione della capacità di autenticazione esposta per quel target.

Codici di avviso comuni:

- `ssh_tunnel_failed`: la configurazione del tunnel SSH è fallita; il comando è tornato alle probe dirette.
- `multiple_gateways`: più di un target era raggiungibile; è insolito a meno che tu non esegua intenzionalmente profili isolati, come un rescue bot.
- `auth_secretref_unresolved`: non è stato possibile risolvere un SecretRef di autenticazione configurato per un target fallito.
- `probe_scope_limited`: la connessione WebSocket è riuscita, ma la probe di lettura era limitata dalla mancanza di `operator.read`.

#### Remoto tramite SSH (parità con app Mac)

La modalità macOS app “Remote over SSH” usa un port-forward locale in modo che il gateway remoto (che può essere bindato solo al loopback) diventi raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opzioni:

- `--ssh <target>`: `user@host` o `user@host:port` (la porta è `22` per impostazione predefinita).
- `--ssh-identity <path>`: file identity.
- `--ssh-auto`: sceglie il primo host gateway individuato come target SSH dall'endpoint di
  discovery risolto (`local.` più il dominio wide-area configurato, se presente). I suggerimenti
  solo-TXT vengono ignorati.

Configurazione (facoltativa, usata come predefinita):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Helper RPC di basso livello.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Opzioni:

- `--params <json>`: stringa oggetto JSON per i parametri (predefinito `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Note:

- `--params` deve essere JSON valido.
- `--expect-final` è pensato principalmente per RPC in stile agente che trasmettono eventi intermedi prima di un payload finale.

## Gestire il servizio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Opzioni dei comandi:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Note:

- `gateway install` supporta `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modalità fail-closed invece di persistere un fallback in chiaro.
- Per l'autenticazione tramite password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` supportato da SecretRef rispetto a `--password` inline.
- In modalità di autenticazione dedotta, `OPENCLAW_GATEWAY_PASSWORD` solo-shell non allenta i requisiti del token per l'installazione; usa una configurazione durevole (`gateway.auth.password` o `env` di configurazione) quando installi un servizio gestito.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- I comandi del ciclo di vita accettano `--json` per lo scripting.

## Individuare gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon del Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [/gateway/bonjour](/it/gateway/bonjour)

Solo i gateway con discovery Bonjour abilitata (predefinita) pubblicizzano il beacon.

I record di discovery wide-area includono (TXT):

- `role` (suggerimento del ruolo del gateway)
- `transport` (suggerimento del trasporto, ad esempio `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (facoltativa; i client usano `22` come valore predefinito per i target SSH quando manca)
- `tailnetDns` (hostname MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + fingerprint del certificato)
- `cliPath` (suggerimento di installazione remota scritto nella zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Opzioni:

- `--timeout <ms>`: timeout per comando (browse/resolve); predefinito `2000`.
- `--json`: output leggibile dalla macchina (disabilita anche styling/spinner).

Esempi:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Note:

- La CLI esegue la scansione di `local.` più il dominio wide-area configurato quando è abilitato.
- `wsUrl` nell'output JSON è derivato dall'endpoint del servizio risolto, non da suggerimenti
  solo-TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando
  `discovery.mdns.mode` è `full`. Il DNS-SD wide-area continua comunque a scrivere `cliPath`; `sshPort`
  resta facoltativo anche lì.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
