---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug di autenticazione, modalità di bind e connettività del Gateway
    - Rilevamento dei gateway tramite Bonjour (DNS-SD locale + wide-area)
summary: CLI Gateway di OpenClaw (`openclaw gateway`) — eseguire, interrogare e rilevare gateway
title: gateway
x-i18n:
    generated_at: "2026-04-05T13:48:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook).

I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

Documenti correlati:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Eseguire il Gateway

Esegui un processo Gateway locale:

```bash
openclaw gateway
```

Alias in primo piano:

```bash
openclaw gateway run
```

Note:

- Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
- `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, trattalo come una configurazione danneggiata o sovrascritta e riparalo invece di presumere implicitamente la modalità locale.
- Se il file esiste e `gateway.mode` manca, il Gateway lo considera un danno sospetto alla configurazione e rifiuta di “indovinare la modalità locale” per te.
- Il binding oltre il local loopback senza autenticazione è bloccato (protezione di sicurezza).
- `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre gateway tool/config apply/update rimangono consentiti).
- I gestori `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano eventuali stati personalizzati del terminale. Se avvolgi la CLI con una TUI o un input raw-mode, ripristina il terminale prima dell'uscita.

### Opzioni

- `--port <port>`: porta WebSocket (il valore predefinito deriva da config/env; di solito `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: modalità di bind del listener.
- `--auth <token|password>`: override della modalità di autenticazione.
- `--token <token>`: override del token (imposta anche `OPENCLAW_GATEWAY_TOKEN` per il processo).
- `--password <password>`: override della password. Avvertenza: le password inline possono essere esposte negli elenchi dei processi locali.
- `--password-file <path>`: legge la password del gateway da un file.
- `--tailscale <off|serve|funnel>`: espone il Gateway tramite Tailscale.
- `--tailscale-reset-on-exit`: ripristina la configurazione Tailscale serve/funnel all'arresto.
- `--allow-unconfigured`: consente l'avvio del gateway senza `gateway.mode=local` nella configurazione. Questo bypassa la protezione di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
- `--dev`: crea una configurazione + workspace di sviluppo se mancano (salta BOOTSTRAP.md).
- `--reset`: reimposta configurazione di sviluppo + credenziali + sessioni + workspace (richiede `--dev`).
- `--force`: termina qualunque listener esistente sulla porta selezionata prima dell'avvio.
- `--verbose`: log verbosi.
- `--cli-backend-logs`: mostra nella console solo i log del backend CLI (e abilita stdout/stderr).
- `--claude-cli-logs`: alias deprecato di `--cli-backend-logs`.
- `--ws-log <auto|full|compact>`: stile dei log websocket (predefinito `auto`).
- `--compact`: alias di `--ws-log compact`.
- `--raw-stream`: registra gli eventi raw del flusso del modello in jsonl.
- `--raw-stream-path <path>`: percorso jsonl del flusso raw.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano WebSocket RPC.

Modalità di output:

- Predefinita: leggibile da umani (colorata in TTY).
- `--json`: JSON leggibile da macchina (senza styling/spinner).
- `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout per umani.

Opzioni condivise (dove supportate):

- `--url <url>`: URL WebSocket del Gateway.
- `--token <token>`: token del Gateway.
- `--password <password>`: password del Gateway.
- `--timeout <ms>`: timeout/budget (varia in base al comando).
- `--expect-final`: attende una risposta “final”.

Nota: quando imposti `--url`, la CLI non usa fallback verso credenziali di configurazione o ambiente.
Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Recupera riepiloghi dei costi di utilizzo dai log di sessione.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Opzioni:

- `--days <days>`: numero di giorni da includere (predefinito `30`).

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più un probe RPC facoltativo.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Opzioni:

- `--url <url>`: aggiunge una destinazione di probe esplicita. Vengono comunque eseguiti probe del remoto configurato + localhost.
- `--token <token>`: autenticazione tramite token per il probe.
- `--password <password>`: autenticazione tramite password per il probe.
- `--timeout <ms>`: timeout del probe (predefinito `10000`).
- `--no-probe`: salta il probe RPC (vista solo servizio).
- `--deep`: esegue la scansione anche dei servizi a livello di sistema.
- `--require-rpc`: esce con valore non zero quando il probe RPC fallisce. Non può essere combinato con `--no-probe`.

Note:

- `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale manca o non è valida.
- `gateway status` risolve i SecretRef di autenticazione configurati per l'autenticazione del probe quando possibile.
- Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `gateway status --json` riporta `rpc.authWarning` quando la connettività/autenticazione del probe fallisce; passa esplicitamente `--token`/`--password` oppure risolvi prima l'origine del segreto.
- Se il probe riesce, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
- Usa `--require-rpc` negli script e nell'automazione quando non basta che un servizio sia in ascolto e hai bisogno che anche l'RPC del Gateway sia integro.
- `--deep` aggiunge una scansione best-effort per ulteriori installazioni launchd/systemd/schtasks. Quando vengono rilevati più servizi simili a gateway, l'output per umani stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un gateway per macchina.
- L'output per umani include il percorso del log file risolto più l'istantanea dei percorsi/validità della configurazione CLI rispetto al servizio per aiutare a diagnosticare derive di profilo o state-dir.
- Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia quelli `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, più file e file facoltativi `-`).
- I controlli di deriva risolvono i SecretRef di `gateway.auth.token` usando l'env di runtime unito (prima l'env del comando di servizio, poi il fallback all'env del processo).
- Se l'autenticazione con token non è effettivamente attiva (esplicito `gateway.auth.mode` impostato su `password`/`none`/`trusted-proxy`, oppure modalità non impostata dove può prevalere la password e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

### `gateway probe`

`gateway probe` è il comando “debugga tutto”. Esegue sempre probe su:

- il tuo gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se è configurato il remoto**.

Se passi `--url`, quella destinazione esplicita viene aggiunta prima di entrambe. L'output per umani etichetta le
destinazioni come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

Se più gateway sono raggiungibili, li stampa tutti. Sono supportati più gateway quando usi profili/porte isolati (ad esempio un rescue bot), ma la maggior parte delle installazioni continua a eseguire un singolo gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interpretazione:

- `Reachable: yes` significa che almeno una destinazione ha accettato una connessione WebSocket.
- `RPC: ok` significa che anche le chiamate RPC di dettaglio (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
- `RPC: limited - missing scope: operator.read` significa che la connessione è riuscita ma le RPC di dettaglio sono limitate dagli scope. Questo viene segnalato come raggiungibilità **degradata**, non come errore completo.
- Il codice di uscita è non zero solo quando nessuna destinazione sondata è raggiungibile.

Note JSON (`--json`):

- Livello superiore:
  - `ok`: almeno una destinazione è raggiungibile.
  - `degraded`: almeno una destinazione aveva RPC di dettaglio limitate dagli scope.
  - `primaryTargetId`: miglior destinazione da trattare come vincitore attivo in quest'ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
  - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` facoltativi.
  - `network`: suggerimenti di URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete host.
  - `discovery.timeoutMs` e `discovery.count`: budget/numero di risultati di discovery effettivamente usato per questo passaggio di probe.
- Per destinazione (`targets[].connect`):
  - `ok`: raggiungibilità dopo connect + classificazione degradata.
  - `rpcOk`: successo completo delle RPC di dettaglio.
  - `scopeLimited`: le RPC di dettaglio sono fallite per assenza dello scope operatore.

Codici di avviso comuni:

- `ssh_tunnel_failed`: la configurazione del tunnel SSH è fallita; il comando è tornato ai probe diretti.
- `multiple_gateways`: più di una destinazione era raggiungibile; è insolito a meno che tu non esegua intenzionalmente profili isolati, come un rescue bot.
- `auth_secretref_unresolved`: non è stato possibile risolvere un SecretRef di autenticazione configurato per una destinazione fallita.
- `probe_scope_limited`: la connessione WebSocket è riuscita, ma le RPC di dettaglio erano limitate dall'assenza di `operator.read`.

#### Remoto tramite SSH (parità con app Mac)

La modalità “Remote over SSH” dell'app macOS usa un port-forward locale in modo che il gateway remoto (che può essere associato solo al loopback) diventi raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Opzioni:

- `--ssh <target>`: `user@host` o `user@host:port` (la porta predefinita è `22`).
- `--ssh-identity <path>`: file di identità.
- `--ssh-auto`: sceglie come destinazione SSH il primo host gateway rilevato dall'endpoint di
  discovery risolto (`local.` più l'eventuale dominio wide-area configurato). I suggerimenti
  solo-TXT vengono ignorati.

Configurazione (facoltativa, usata come valori predefiniti):

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

Opzioni del comando:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

Note:

- `gateway install` supporta `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` convalida che il SecretRef sia risolvibile ma non rende persistente il token risolto nei metadati dell'ambiente di servizio.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modalità chiusa invece di rendere persistente un fallback in chiaro.
- Per l'autenticazione tramite password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` supportato da SecretRef invece di `--password` inline.
- In modalità di autenticazione dedotta, il solo `OPENCLAW_GATEWAY_PASSWORD` di shell non allenta i requisiti del token per l'installazione; usa una configurazione durevole (`gateway.auth.password` o config `env`) quando installi un servizio gestito.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione è bloccata finché la modalità non viene impostata esplicitamente.
- I comandi del ciclo di vita accettano `--json` per gli script.

## Rilevare gateway (Bonjour)

`gateway discover` esegue una scansione dei beacon Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [/gateway/bonjour](/gateway/bonjour)

Solo i gateway con il discovery Bonjour abilitato (predefinito) pubblicano il beacon.

I record di discovery wide-area includono (TXT):

- `role` (suggerimento sul ruolo del gateway)
- `transport` (suggerimento sul trasporto, ad esempio `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (facoltativa; i client usano `22` come destinazione SSH predefinita quando manca)
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

- La CLI esegue la scansione di `local.` più il dominio wide-area configurato quando è abilitato.
- `wsUrl` nell'output JSON deriva dall'endpoint di servizio risolto, non da suggerimenti
  solo-TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando
  `discovery.mdns.mode` è `full`. Il DNS-SD wide-area continua comunque a scrivere `cliPath`; `sshPort`
  resta facoltativa anche lì.
