---
read_when:
    - Eseguire il Gateway dalla CLI (sviluppo o server)
    - Debug dell'autenticazione del Gateway, delle modalità di bind e della connettività
    - Individuare i gateway tramite Bonjour (DNS-SD locale + wide-area)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — eseguire, interrogare e individuare i gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-23T08:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Il Gateway è il server WebSocket di OpenClaw (canali, Node, sessioni, hook).

I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

Documentazione correlata:

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
- Se il file esiste e `gateway.mode` manca, il Gateway lo tratta come un danno sospetto alla configurazione e si rifiuta di “indovinare local” al posto tuo.
- Il bind oltre loopback senza autenticazione è bloccato (barriera di sicurezza).
- `SIGUSR1` attiva un riavvio in-process se autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre gateway tool/config apply/update restano consentiti).
- I gestori `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato terminale personalizzato. Se incapsuli la CLI con una TUI o input in raw mode, ripristina il terminale prima dell'uscita.

### Opzioni

- `--port <port>`: porta WebSocket (il valore predefinito proviene da config/env; in genere `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modalità di bind del listener.
- `--auth <token|password>`: override della modalità di autenticazione.
- `--token <token>`: override del token (imposta anche `OPENCLAW_GATEWAY_TOKEN` per il processo).
- `--password <password>`: override della password. Avviso: le password inline possono essere esposte negli elenchi di processi locali.
- `--password-file <path>`: legge la password del gateway da un file.
- `--tailscale <off|serve|funnel>`: espone il Gateway tramite Tailscale.
- `--tailscale-reset-on-exit`: reimposta la configurazione Tailscale serve/funnel all'arresto.
- `--allow-unconfigured`: consente l'avvio del gateway senza `gateway.mode=local` in config. Questo aggira la barriera di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
- `--dev`: crea una config + workspace di sviluppo se mancanti (salta `BOOTSTRAP.md`).
- `--reset`: reimposta config di sviluppo + credenziali + sessioni + workspace (richiede `--dev`).
- `--force`: termina qualsiasi listener esistente sulla porta selezionata prima dell'avvio.
- `--verbose`: log dettagliati.
- `--cli-backend-logs`: mostra nella console solo i log backend della CLI (e abilita stdout/stderr).
- `--ws-log <auto|full|compact>`: stile dei log websocket (predefinito `auto`).
- `--compact`: alias per `--ws-log compact`.
- `--raw-stream`: registra gli eventi raw del flusso del modello in jsonl.
- `--raw-stream-path <path>`: percorso jsonl del flusso raw.

Profilazione dell'avvio:

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare l'avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz` e i tempi della traccia di avvio.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano WebSocket RPC.

Modalità di output:

- Predefinita: leggibile per umani (colorata in TTY).
- `--json`: JSON leggibile da macchina (senza styling/spinner).
- `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout per umani.

Opzioni condivise (dove supportate):

- `--url <url>`: URL WebSocket del Gateway.
- `--token <token>`: token del Gateway.
- `--password <password>`: password del Gateway.
- `--timeout <ms>`: timeout/budget (varia per comando).
- `--expect-final`: attende una risposta “final” (chiamate dell'agente).

Nota: quando imposti `--url`, la CLI non usa il fallback a credenziali di config o ambiente.
Passa `--token` o `--password` esplicitamente. L'assenza di credenziali esplicite è un errore.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una probe di liveness: restituisce una risposta quando il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più restrittivo e resta rosso mentre sidecar di avvio, canali o hook configurati si stanno ancora assestando.

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

Recupera il recente registratore diagnostico di stabilità da un Gateway in esecuzione.

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
- `--bundle [path]`: legge un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o semplicemente `--bundle`) per il bundle più recente nella directory di stato, oppure passa direttamente un percorso JSON del bundle.
- `--export`: scrive uno zip di diagnostica di supporto condivisibile invece di stampare i dettagli della stabilità.
- `--output <path>`: percorso di output per `--export`.

Note:

- I record mantengono metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di coda/sessione, nomi di canale/plugin e riepiloghi di sessione redatti. Non conservano testo chat, body webhook, output degli strumenti, body raw di richieste o risposte, token, cookie, valori segreti, hostname o id di sessione raw. Imposta `diagnostics.enabled: false` per disabilitare completamente il registratore.
- In caso di uscita fatale del Gateway, timeout di arresto e fallimenti di avvio durante il riavvio, OpenClaw scrive la stessa istantanea diagnostica in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il registratore contiene eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

### `gateway diagnostics export`

Scrive uno zip diagnostico locale progettato per essere allegato ai bug report.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Opzioni:

- `--output <path>`: percorso zip di output. Il valore predefinito è un export di supporto nella directory di stato.
- `--log-lines <count>`: numero massimo di righe di log sanificate da includere (predefinito `5000`).
- `--log-bytes <bytes>`: numero massimo di byte di log da ispezionare (predefinito `1000000`).
- `--url <url>`: URL WebSocket del Gateway per l'istantanea health.
- `--token <token>`: token del Gateway per l'istantanea health.
- `--password <password>`: password del Gateway per l'istantanea health.
- `--timeout <ms>`: timeout dell'istantanea status/health (predefinito `3000`).
- `--no-stability-bundle`: salta la ricerca del bundle di stabilità persistito.
- `--json`: stampa percorso scritto, dimensione e manifest come JSON.

L'export contiene un manifest, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi di log sanificati, istantanee sanificate di stato/health del Gateway e il bundle di stabilità più recente quando esiste.

È pensato per essere condiviso. Mantiene dettagli operativi utili per il debug, come campi di log OpenClaw sicuri, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, id plugin, id provider, impostazioni di funzionalità non segrete e messaggi di log operativi redatti. Omette o redige testo chat, body webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, hostname e valori segreti. Quando un messaggio in stile LogTape sembra testo payload utente/chat/strumento, l'export conserva solo l'informazione che un messaggio è stato omesso più il relativo conteggio byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una probe facoltativa di connettività/capacità di autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opzioni:

- `--url <url>`: aggiunge una destinazione di probe esplicita. Gateway remoto configurato + localhost vengono comunque sottoposti a probe.
- `--token <token>`: autenticazione token per la probe.
- `--password <password>`: autenticazione password per la probe.
- `--timeout <ms>`: timeout della probe (predefinito `10000`).
- `--no-probe`: salta la probe di connettività (vista solo servizio).
- `--deep`: esegue anche la scansione dei servizi a livello di sistema.
- `--require-rpc`: eleva la probe di connettività predefinita a probe di lettura ed esce con valore non zero quando la probe di lettura fallisce. Non può essere combinato con `--no-probe`.

Note:

- `gateway status` resta disponibile per la diagnostica anche quando la configurazione locale della CLI manca o non è valida.
- Il comando predefinito `gateway status` prova stato del servizio, connessione WebSocket e capacità di autenticazione visibile al momento dell'handshake. Non prova operazioni di lettura/scrittura/amministrazione.
- `gateway status` risolve i SecretRef di autenticazione configurati per l'autenticazione della probe quando possibile.
- Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso del comando, `gateway status --json` riporta `rpc.authWarning` quando la connettività/autenticazione della probe fallisce; passa `--token`/`--password` esplicitamente oppure risolvi prima la sorgente del secret.
- Se la probe riesce, gli avvisi sugli auth-ref non risolti vengono soppressi per evitare falsi positivi.
- Usa `--require-rpc` negli script e nell'automazione quando un servizio in ascolto non è sufficiente e hai bisogno che anche le chiamate RPC con ambito di lettura siano sane.
- `--deep` aggiunge una scansione best-effort per installazioni aggiuntive launchd/systemd/schtasks. Quando vengono rilevati più servizi simili a gateway, l'output per umani stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un gateway per macchina.
- L'output per umani include il percorso risolto del file di log più l'istantanea dei percorsi/validità della config CLI-vs-service per aiutare a diagnosticare derive di profilo o state-dir.
- Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, file multipli e file facoltativi `-`).
- I controlli di deriva risolvono i SecretRef `gateway.auth.token` usando l'env runtime unito (prima l'env del comando di servizio, poi il fallback dell'env del processo).
- Se l'autenticazione token non è effettivamente attiva (modalità esplicita `gateway.auth.mode` impostata su `password`/`none`/`trusted-proxy`, oppure modalità non impostata dove può prevalere password e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

### `gateway probe`

`gateway probe` è il comando “debug di tutto”. Esegue sempre la probe di:

- il tuo gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se è configurato un remoto**.

Se passi `--url`, quella destinazione esplicita viene aggiunta prima di entrambe. L'output per umani etichetta le
destinazioni come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

Se sono raggiungibili più gateway, li stampa tutti. Più gateway sono supportati quando usi profili/porte isolati (ad esempio, un bot di soccorso), ma la maggior parte delle installazioni esegue ancora un solo gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretazione:

- `Reachable: yes` significa che almeno una destinazione ha accettato una connessione WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` riporta ciò che la probe ha potuto dimostrare sull'autenticazione. È separato dalla raggiungibilità.
- `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
- `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l'RPC con ambito di lettura è limitato. Questo viene riportato come raggiungibilità **degradata**, non come fallimento completo.
- Il codice di uscita è non zero solo quando nessuna destinazione sottoposta a probe è raggiungibile.

Note JSON (`--json`):

- Livello superiore:
  - `ok`: almeno una destinazione è raggiungibile.
  - `degraded`: almeno una destinazione ha avuto RPC di dettaglio limitate dall'ambito.
  - `capability`: migliore capacità osservata tra le destinazioni raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` oppure `unknown`).
  - `primaryTargetId`: migliore destinazione da trattare come vincitore attivo in questo ordine: URL esplicito, tunnel SSH, remoto configurato, poi loopback locale.
  - `warnings[]`: record di avviso best-effort con `code`, `message` e facoltativamente `targetIds`.
  - `network`: suggerimenti URL per loopback locale/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
  - `discovery.timeoutMs` e `discovery.count`: il budget/numero di risultati di discovery effettivamente usato per questo passaggio di probe.
- Per destinazione (`targets[].connect`):
  - `ok`: raggiungibilità dopo connect + classificazione degradata.
  - `rpcOk`: successo completo delle RPC di dettaglio.
  - `scopeLimited`: le RPC di dettaglio sono fallite a causa dell'assenza dell'ambito operatore.
- Per destinazione (`targets[].auth`):
  - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
  - `scopes`: ambiti concessi riportati in `hello-ok` quando disponibili.
  - `capability`: classificazione della capacità di autenticazione esposta per quella destinazione.

Codici di avviso comuni:

- `ssh_tunnel_failed`: la configurazione del tunnel SSH è fallita; il comando è tornato alle probe dirette.
- `multiple_gateways`: più di una destinazione era raggiungibile; questo è insolito a meno che tu non esegua intenzionalmente profili isolati, come un bot di soccorso.
- `auth_secretref_unresolved`: non è stato possibile risolvere un SecretRef di autenticazione configurato per una destinazione fallita.
- `probe_scope_limited`: la connessione WebSocket è riuscita, ma la probe di lettura era limitata dall'assenza di `operator.read`.

#### Remoto tramite SSH (parità con app Mac)

La modalità “Remote over SSH” dell'app macOS usa un port-forward locale così il gateway remoto (che può essere associato solo a loopback) diventa raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opzioni:

- `--ssh <target>`: `user@host` oppure `user@host:port` (la porta predefinita è `22`).
- `--ssh-identity <path>`: file identità.
- `--ssh-auto`: sceglie il primo host gateway individuato come destinazione SSH dall'endpoint di
  discovery risolto (`local.` più l'eventuale dominio wide-area configurato). I suggerimenti
  solo TXT vengono ignorati.

Configurazione (facoltativa, usata come valore predefinito):

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
- `--expect-final` è pensato soprattutto per RPC in stile agente che trasmettono eventi intermedi prima di un payload finale.

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
- Quando l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` valida che il SecretRef sia risolvibile ma non mantiene il token risolto nei metadati dell'ambiente di servizio.
- Se l'autenticazione token richiede un token e il token SecretRef configurato non è risolto, l'installazione fallisce in modalità fail-closed invece di mantenere un fallback in testo semplice.
- Per l'autenticazione password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` oppure un `gateway.auth.password` supportato da SecretRef invece di `--password` inline.
- Nella modalità di autenticazione inferita, `OPENCLAW_GATEWAY_PASSWORD` solo shell non allenta i requisiti del token in installazione; usa una configurazione persistente (`gateway.auth.password` oppure config `env`) quando installi un servizio gestito.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- I comandi di ciclo di vita accettano `--json` per lo scripting.

## Individuare gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [/gateway/bonjour](/it/gateway/bonjour)

Solo i gateway con discovery Bonjour abilitata (predefinita) pubblicizzano il beacon.

I record di discovery Wide-Area includono (TXT):

- `role` (suggerimento del ruolo gateway)
- `transport` (suggerimento del trasporto, ad esempio `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (facoltativa; i client impostano per impostazione predefinita le destinazioni SSH su `22` quando è assente)
- `tailnetDns` (hostname MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + fingerprint del certificato)
- `cliPath` (suggerimento di installazione remota scritto nella zona wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Opzioni:

- `--timeout <ms>`: timeout per comando (browse/resolve); predefinito `2000`.
- `--json`: output leggibile da macchina (disabilita anche styling/spinner).

Esempi:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Note:

- La CLI esegue la scansione di `local.` più l'eventuale dominio wide-area configurato quando è abilitato.
- `wsUrl` nell'output JSON è derivato dall'endpoint di servizio risolto, non da suggerimenti
  solo TXT come `lanHost` o `tailnetDns`.
- Su `local.` mDNS, `sshPort` e `cliPath` vengono trasmessi solo quando
  `discovery.mdns.mode` è `full`. Il DNS-SD wide-area continua comunque a scrivere `cliPath`; `sshPort`
  resta facoltativo anche lì.
