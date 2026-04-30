---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug dell'autenticazione del Gateway, modalità di bind e connettività
    - Individuazione dei Gateway tramite Bonjour (DNS-SD locale e ad ampio raggio)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — avvia, interroga e individua i Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-30T08:43:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

The Gateway is OpenClaw's WebSocket server (channels, nodes, sessions, hooks). Subcommands in this page live under `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/it/gateway/bonjour">
    Local mDNS + wide-area DNS-SD setup.
  </Card>
  <Card title="Discovery overview" href="/it/gateway/discovery">
    How OpenClaw advertises and finds gateways.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration">
    Top-level gateway config keys.
  </Card>
</CardGroup>

## Run the Gateway

Run a local Gateway process:

```bash
openclaw gateway
```

Foreground alias:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - By default, the Gateway refuses to start unless `gateway.mode=local` is set in `~/.openclaw/openclaw.json`. Use `--allow-unconfigured` for ad-hoc/dev runs.
    - `openclaw onboard --mode local` and `openclaw setup` are expected to write `gateway.mode=local`. If the file exists but `gateway.mode` is missing, treat that as a broken or clobbered config and repair it instead of assuming local mode implicitly.
    - If the file exists and `gateway.mode` is missing, the Gateway treats that as suspicious config damage and refuses to "guess local" for you.
    - Binding beyond loopback without auth is blocked (safety guardrail).
    - `SIGUSR1` triggers an in-process restart when authorized (`commands.restart` is enabled by default; set `commands.restart: false` to block manual restart, while gateway tool/config apply/update remain allowed).
    - `SIGINT`/`SIGTERM` handlers stop the gateway process, but they don't restore any custom terminal state. If you wrap the CLI with a TUI or raw-mode input, restore the terminal before exit.

  </Accordion>
</AccordionGroup>

### Options

<ParamField path="--port <port>" type="number">
  WebSocket port (default comes from config/env; usually `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Listener bind mode.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Auth mode override.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token override (also sets `OPENCLAW_GATEWAY_TOKEN` for the process).
</ParamField>
<ParamField path="--password <password>" type="string">
  Password override.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Read the gateway password from a file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Expose the Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reset Tailscale serve/funnel config on shutdown.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Allow gateway start without `gateway.mode=local` in config. Bypasses the startup guard for ad-hoc/dev bootstrap only; does not write or repair the config file.
</ParamField>
<ParamField path="--dev" type="boolean">
  Create a dev config + workspace if missing (skips BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reset dev config + credentials + sessions + workspace (requires `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Kill any existing listener on the selected port before starting.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Verbose logs.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Only show CLI backend logs in the console (and enable stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket log style.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias for `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Log raw model stream events to jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Raw stream jsonl path.
</ParamField>

<Warning>
Inline `--password` can be exposed in local process listings. Prefer `--password-file`, env, or a SecretRef-backed `gateway.auth.password`.
</Warning>

### Startup profiling

- Set `OPENCLAW_GATEWAY_STARTUP_TRACE=1` to log phase timings during Gateway startup, including per-phase `eventLoopMax` delay and plugin lookup-table timings for installed-index, manifest registry, startup planning, and owner-map work.
- Set `OPENCLAW_DIAGNOSTICS=timeline` with `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` to write a best-effort JSONL startup diagnostics timeline for external QA harnesses. You can also enable the flag with `diagnostics.flags: ["timeline"]` in config; the path is still env-provided. Add `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` to include event-loop samples.
- Run `pnpm test:startup:gateway -- --runs 5 --warmup 1` to benchmark Gateway startup. The benchmark records first process output, `/healthz`, `/readyz`, startup trace timings, event-loop delay, and plugin lookup-table timing details.

## Query a running Gateway

All query commands use WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - Default: human-readable (colored in TTY).
    - `--json`: machine-readable JSON (no styling/spinner).
    - `--no-color` (or `NO_COLOR=1`): disable ANSI while keeping human layout.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway WebSocket URL.
    - `--token <token>`: Gateway token.
    - `--password <password>`: Gateway password.
    - `--timeout <ms>`: timeout/budget (varies per command).
    - `--expect-final`: wait for a "final" response (agent calls).

  </Tab>
</Tabs>

<Note>
When you set `--url`, the CLI does not fall back to config or environment credentials. Pass `--token` or `--password` explicitly. Missing explicit credentials is an error.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

The HTTP `/healthz` endpoint is a liveness probe: it returns once the server can answer HTTP. The HTTP `/readyz` endpoint is stricter and stays red while startup sidecars, channels, or configured hooks are still settling. Local or authenticated detailed readiness responses include an `eventLoop` diagnostic block with event-loop delay, event-loop utilization, CPU core ratio, and a `degraded` flag.

### `gateway usage-cost`

Fetch usage-cost summaries from session logs.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Number of days to include.
</ParamField>

### `gateway stability`

Fetch the recent diagnostic stability recorder from a running Gateway.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Maximum number of recent events to include (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filter by diagnostic event type, such as `payload.large` or `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Include only events after a diagnostic sequence number.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Read a persisted stability bundle instead of calling the running Gateway. Use `--bundle latest` (or just `--bundle`) for the newest bundle under the state directory, or pass a bundle JSON path directly.
</ParamField>
<ParamField path="--export" type="boolean">
  Write a shareable support diagnostics zip instead of printing stability details.
</ParamField>
<ParamField path="--output <path>" type="string">
  Output path for `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Records keep operational metadata: event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names, and redacted session summaries. They do not keep chat text, webhook bodies, tool outputs, raw request or response bodies, tokens, cookies, secret values, hostnames, or raw session ids. Set `diagnostics.enabled: false` to disable the recorder entirely.
    - On fatal Gateway exits, shutdown timeouts, and restart startup failures, OpenClaw writes the same diagnostic snapshot to `~/.openclaw/logs/stability/openclaw-stability-*.json` when the recorder has events. Inspect the newest bundle with `openclaw gateway stability --bundle latest`; `--limit`, `--type`, and `--since-seq` also apply to bundle output.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Write a local diagnostics zip that is designed to attach to bug reports. For the privacy model and bundle contents, see [Diagnostics Export](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Output zip path. Defaults to a support export under the state directory.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Maximum sanitized log lines to include.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Maximum log bytes to inspect.
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL for the health snapshot.
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token for the health snapshot.
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway password for the health snapshot.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Status/health snapshot timeout.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Skip persisted stability bundle lookup.
</ParamField>
<ParamField path="--json" type="boolean">
  Print the written path, size, and manifest as JSON.
</ParamField>

The export contains a manifest, a Markdown summary, config shape, sanitized config details, sanitized log summaries, sanitized Gateway status/health snapshots, and the newest stability bundle when one exists.

It is meant to be shared. It keeps operational details that help debugging, such as safe OpenClaw log fields, subsystem names, status codes, durations, configured modes, ports, plugin ids, provider ids, non-secret feature settings, and redacted operational log messages. It omits or redacts chat text, webhook bodies, tool outputs, credentials, cookies, account/message identifiers, prompt/instruction text, hostnames, and secret values. When a LogTape-style message looks like user/chat/tool payload text, the export keeps only that a message was omitted plus its byte count.

### `gateway status`

`gateway status` shows the Gateway service (launchd/systemd/schtasks) plus an optional probe of connectivity/auth capability.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Add an explicit probe target. Configured remote + localhost are still probed.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token auth for the probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password auth for the probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe timeout.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Skip the connectivity probe (service-only view).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scan system-level services too.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Upgrade the default connectivity probe to a read probe and exit non-zero when that read probe fails. Cannot be combined with `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale manca o non è valida.
    - `gateway status` predefinito verifica lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile al momento dell'handshake. Non verifica le operazioni di lettura/scrittura/amministrazione.
    - Le sonde diagnostiche non modificano l'autenticazione iniziale del dispositivo: riutilizzano un token dispositivo già memorizzato nella cache quando esiste, ma non creano una nuova identità dispositivo CLI né un record di associazione dispositivo di sola lettura solo per controllare lo stato.
    - `gateway status` risolve i SecretRefs di autenticazione configurati per l'autenticazione della sonda quando possibile.
    - Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `gateway status --json` riporta `rpc.authWarning` quando la connettività/autenticazione della sonda fallisce; passa esplicitamente `--token`/`--password` o risolvi prima l'origine del segreto.
    - Se la sonda riesce, gli avvisi sugli auth-ref non risolti vengono soppressi per evitare falsi positivi.
    - Usa `--require-rpc` in script e automazione quando un servizio in ascolto non basta e hai bisogno che anche le chiamate RPC con ambito di lettura siano integre.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un Gateway per macchina.
    - L'output leggibile include il percorso risolto del file di log più lo snapshot dei percorsi/configurazioni CLI-vs-service e della loro validità per aiutare a diagnosticare derive di profilo o state-dir.

  </Accordion>
  <Accordion title="Controlli della deriva di autenticazione di Linux systemd">
    - Nelle installazioni Linux systemd, i controlli della deriva di autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, file multipli e file opzionali `-`).
    - I controlli della deriva risolvono i SecretRefs `gateway.auth.token` usando l'env di runtime unito (prima l'env del comando del servizio, poi il fallback all'env del processo).
    - Se l'autenticazione con token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure mode non impostata quando la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando "debug di tutto". Sonda sempre:

- il Gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se è configurato un remoto**.

Se passi `--url`, quell'obiettivo esplicito viene aggiunto prima di entrambi. L'output leggibile etichetta gli obiettivi come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se più Gateway sono raggiungibili, li stampa tutti. Più Gateway sono supportati quando usi profili/porte isolati (per esempio un bot di recupero), ma la maggior parte delle installazioni esegue comunque un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Reachable: yes` significa che almeno un obiettivo ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` riporta ciò che la sonda ha potuto verificare sull'autenticazione. È separato dalla raggiungibilità.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l'RPC con ambito di lettura è limitata. Questo viene riportato come raggiungibilità **degradata**, non come errore completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva è scaduta o non è riuscita. Anche questa è raggiungibilità **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, la sonda riutilizza l'autenticazione dispositivo già memorizzata nella cache ma non crea identità dispositivo iniziale o stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessun obiettivo sondato è raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno un obiettivo è raggiungibile.
    - `degraded`: almeno un obiettivo ha accettato una connessione ma non ha completato la diagnostica RPC di dettaglio completa.
    - `capability`: migliore capacità vista tra gli obiettivi raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: migliore obiettivo da trattare come vincitore attivo in questo ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` e `discovery.count`: il budget/numero di risultati di discovery effettivamente usato per questo passaggio di sonda.

    Per obiettivo (`targets[].connect`):

    - `ok`: raggiungibilità dopo connessione + classificazione degradata.
    - `rpcOk`: successo RPC di dettaglio completo.
    - `scopeLimited`: RPC di dettaglio fallita per mancanza dell'ambito operator.

    Per obiettivo (`targets[].auth`):

    - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi riportati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacità di autenticazione esposta per quell'obiettivo.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: la configurazione del tunnel SSH è fallita; il comando è passato alle sonde dirette.
    - `multiple_gateways`: più di un obiettivo era raggiungibile; è insolito a meno che tu non esegua intenzionalmente profili isolati, come un bot di recupero.
    - `auth_secretref_unresolved`: non è stato possibile risolvere un SecretRef di autenticazione configurato per un obiettivo fallito.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma la sonda di lettura era limitata dalla mancanza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto su SSH (parità app Mac)

La modalità "Remote over SSH" dell'app macOS usa un port-forward locale, così il Gateway remoto (che può essere vincolato solo al loopback) diventa raggiungibile a `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` o `user@host:port` (porta predefinita `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File identità.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Scegli il primo host Gateway scoperto come obiettivo SSH dall'endpoint di discovery risolto (`local.` più il dominio wide-area configurato, se presente). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Configurazione (opzionale, usata come valori predefiniti):

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
  Principalmente per RPC in stile agent che trasmettono eventi intermedi prima di un payload finale.
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

### Installare con un wrapper

Usa `--wrapper` quando il servizio gestito deve avviarsi tramite un altro eseguibile, per esempio uno
shim di secrets manager o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed è
responsabile di eseguire infine `openclaw` o Node con quegli argomenti.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Puoi impostare il wrapper anche tramite l'ambiente. `gateway install` convalida che il percorso sia
un file eseguibile, scrive il wrapper in `ProgramArguments` del servizio e conserva
`OPENCLAW_WRAPPER` nell'ambiente del servizio per successive reinstallazioni forzate, aggiornamenti e riparazioni doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Per rimuovere un wrapper conservato, svuota `OPENCLAW_WRAPPER` durante la reinstallazione:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opzioni dei comandi">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Comportamento del ciclo di vita">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.
    - I comandi del ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
  <Accordion title="Autenticazione e SecretRefs al momento dell'installazione">
    - Quando l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` convalida che il SecretRef sia risolvibile ma non conserva il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso invece di conservare testo normale di fallback.
    - Per l'autenticazione con password in `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` inline.
    - In modalità di autenticazione inferita, `OPENCLAW_GATEWAY_PASSWORD` solo shell non allenta i requisiti del token di installazione; usa configurazione durevole (`gateway.auth.password` o config `env`) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché mode non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scoprire Gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour wide-area): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [Bonjour](/it/gateway/bonjour).

Solo i Gateway con discovery Bonjour abilitata (predefinito) pubblicizzano il beacon.

I record di discovery wide-area includono (TXT):

- `role` (suggerimento del ruolo gateway)
- `transport` (suggerimento di trasporto, per esempio `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (opzionale; i client usano per impostazione predefinita obiettivi SSH su `22` quando è assente)
- `tailnetDns` (hostname MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + impronta del certificato)
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
- La CLI esegue la scansione di `local.` più il dominio wide-area configurato quando ne è abilitato uno.
- `wsUrl` nell'output JSON deriva dall'endpoint di servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando `discovery.mdns.mode` è `full`. DNS-SD wide-area scrive comunque `cliPath`; anche lì `sshPort` rimane opzionale.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
