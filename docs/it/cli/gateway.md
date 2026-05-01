---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug dell'autenticazione del Gateway, delle modalità di bind e della connettività
    - Rilevamento dei Gateway tramite Bonjour (DNS-SD locale e ad area estesa)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — esegui, interroga e scopri i Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T08:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Discovery Bonjour" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD wide-area.
  </Card>
  <Card title="Panoramica della discovery" href="/it/gateway/discovery">
    Come OpenClaw annuncia e trova i gateway.
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
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma manca `gateway.mode`, considera la configurazione danneggiata o sovrascritta e riparala invece di presumere implicitamente la modalità locale.
    - Se il file esiste e manca `gateway.mode`, il Gateway lo tratta come un danno sospetto alla configurazione e rifiuta di "indovinare local" per te.
    - Il binding oltre il loopback senza autenticazione è bloccato (guardrail di sicurezza).
    - `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre l'applicazione/aggiornamento tramite strumento/configurazione del Gateway rimane consentita).
    - Gli handler `SIGINT`/`SIGTERM` arrestano il processo Gateway, ma non ripristinano eventuali stati personalizzati del terminale. Se avvolgi la CLI con una TUI o input in raw mode, ripristina il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito proviene da config/env; di solito `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modalità di binding del listener.
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
  Reimposta la configurazione serve/funnel di Tailscale all'arresto.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consente l'avvio del gateway senza `gateway.mode=local` nella configurazione. Ignora il guard di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configurazione di sviluppo + workspace se mancanti (salta BOOTSTRAP.md).
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
  Mostra solo i log del backend CLI nella console (e abilita stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Stile dei log WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias per `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra gli eventi grezzi dello stream del modello in jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Percorso jsonl dello stream grezzo.
</ParamField>

<Warning>
`--password` inline può essere esposta negli elenchi dei processi locali. Preferisci `--password-file`, env o un `gateway.auth.password` basato su SecretRef.
</Warning>

### Profilazione dell'avvio

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, incluso il ritardo `eventLoopMax` per fase e i tempi delle tabelle di lookup dei Plugin per indice installato, registro dei manifest, pianificazione dell'avvio e lavoro sulla owner-map.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso resta fornito tramite env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event loop.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare l'avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, i tempi della traccia di avvio, il ritardo dell'event loop e i dettagli sui tempi delle tabelle di lookup dei Plugin.

## Interrogare un Gateway in esecuzione

Tutti i comandi di query usano RPC WebSocket.

<Tabs>
  <Tab title="Modalità di output">
    - Predefinito: leggibile da umani (colorato in TTY).
    - `--json`: JSON leggibile da macchina (senza styling/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout umano.

  </Tab>
  <Tab title="Opzioni condivise">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia per comando).
    - `--expect-final`: attende una risposta "final" (chiamate dell'agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non ripiega sulle credenziali di configurazione o d'ambiente. Passa esplicitamente `--token` o `--password`. La mancanza di credenziali esplicite è un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una probe di liveness: restituisce una risposta quando il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre le dipendenze runtime dei Plugin di avvio, i sidecar, i canali o gli hook configurati si stanno ancora stabilizzando. Le risposte di readiness dettagliate locali o autenticate includono un blocco diagnostico `eventLoop` con ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e un flag `degraded`.

### `gateway usage-cost`

Recupera riepiloghi dei costi d'uso dai log di sessione.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Numero di giorni da includere.
</ParamField>

### `gateway stability`

Recupera il recorder diagnostico di stabilità recente da un Gateway in esecuzione.

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
  Include solo gli eventi successivi a un numero di sequenza diagnostica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Legge un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o solo `--bundle`) per il bundle più recente nella directory di stato, oppure passa direttamente un percorso JSON del bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Scrive uno zip diagnostico di supporto condivisibile invece di stampare i dettagli di stabilità.
</ParamField>
<ParamField path="--output <path>" type="string">
  Percorso di output per `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy e comportamento dei bundle">
    - I record conservano metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e riepiloghi di sessione redatti. Non conservano testo delle chat, corpi dei Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie, valori segreti, nomi host o ID sessione grezzi. Imposta `diagnostics.enabled: false` per disabilitare completamente il recorder.
    - In caso di uscite fatali del Gateway, timeout di arresto e fallimenti di avvio del riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder ha eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive uno zip diagnostico locale progettato per essere allegato ai report di bug. Per il modello di privacy e i contenuti del bundle, vedi [Esportazione diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso dello zip di output. Il valore predefinito è un'esportazione di supporto nella directory di stato.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Numero massimo di righe di log sanificate da includere.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Numero massimo di byte di log da ispezionare.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway per lo snapshot di health.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway per lo snapshot di health.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway per lo snapshot di health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout dello snapshot di stato/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Salta la ricerca del bundle di stabilità persistito.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il percorso scritto, la dimensione e il manifest come JSON.
</ParamField>

L'esportazione contiene un manifest, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi dei log sanificati, snapshot sanificati di stato/health del Gateway e il bundle di stabilità più recente quando esiste.

È pensata per essere condivisa. Conserva dettagli operativi utili al debugging, come campi sicuri dei log OpenClaw, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, ID Plugin, ID provider, impostazioni di funzionalità non segrete e messaggi di log operativi redatti. Omette o redige testo delle chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggio, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l'esportazione conserva solo il fatto che un messaggio è stato omesso più il suo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una probe opzionale di connettività/capacità di autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge un target di probe esplicito. Remote configurato + localhost vengono comunque interrogati.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticazione tramite token per la probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticazione tramite password per la probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout della probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Salta la probe di connettività (vista solo servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Esegue la scansione anche dei servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Aggiorna la probe di connettività predefinita a una probe di lettura ed esce con codice diverso da zero quando quella probe di lettura fallisce. Non può essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione della CLI locale manca o non è valida.
    - `gateway status` predefinito verifica lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile al momento dell'handshake. Non verifica le operazioni di lettura/scrittura/amministrazione.
    - Le sonde diagnostiche non modificano nulla per l'autenticazione del dispositivo al primo utilizzo: riutilizzano un token dispositivo esistente nella cache quando esiste, ma non creano una nuova identità dispositivo CLI né un record di associazione dispositivo in sola lettura solo per controllare lo stato.
    - `gateway status` risolve, quando possibile, i SecretRef di autenticazione configurati per l'autenticazione della sonda.
    - Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `gateway status --json` segnala `rpc.authWarning` quando la connettività/autenticazione della sonda fallisce; passa `--token`/`--password` esplicitamente oppure risolvi prima l'origine del segreto.
    - Se la sonda riesce, gli avvisi di auth-ref non risolti vengono soppressi per evitare falsi positivi.
    - Usa `--require-rpc` negli script e nell'automazione quando un servizio in ascolto non è sufficiente e hai bisogno che anche le chiamate RPC con ambito di lettura siano sane.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a gateway, l'output per umani stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un solo gateway per macchina.
    - L'output per umani include il percorso del file di log risolto più l'istantanea dei percorsi/validità della configurazione CLI-rispetto-al-servizio per aiutare a diagnosticare divergenze di profilo o state-dir.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Nelle installazioni Linux systemd, i controlli di divergenza dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, più file e file opzionali `-`).
    - I controlli di divergenza risolvono i SecretRef `gateway.auth.token` usando l'env runtime unito (prima l'env del comando del servizio, poi il fallback all'env del processo).
    - Se l'autenticazione con token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalità non impostata dove la password può prevalere e nessun candidato token può prevalere), i controlli di divergenza del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando "debug di tutto". Sonda sempre:

- il tuo Gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se il remoto è configurato**.

Se passi `--url`, quella destinazione esplicita viene aggiunta prima di entrambe. L'output per umani etichetta le destinazioni come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se più gateway sono raggiungibili, li stampa tutti. Più gateway sono supportati quando usi profili/porte isolati (ad esempio, un bot di soccorso), ma la maggior parte delle installazioni esegue comunque un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` significa che almeno una destinazione ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` segnala cosa la sonda ha potuto verificare sull'autenticazione. È separata dalla raggiungibilità.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l'RPC con ambito di lettura è limitata. Questo viene segnalato come raggiungibilità **degradata**, non come errore completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva è andata in timeout o è fallita. Anche questa è raggiungibilità **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, la sonda riutilizza l'autenticazione dispositivo esistente nella cache ma non crea un'identità dispositivo al primo utilizzo né stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessuna destinazione sondata è raggiungibile.

  </Accordion>
  <Accordion title="JSON output">
    Livello superiore:

    - `ok`: almeno una destinazione è raggiungibile.
    - `degraded`: almeno una destinazione ha accettato una connessione ma non ha completato tutta la diagnostica RPC di dettaglio.
    - `capability`: migliore capacità osservata tra le destinazioni raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: migliore destinazione da trattare come vincitore attivo in questo ordine: URL esplicito, tunnel SSH, remoto configurato, quindi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` e `discovery.count`: il budget di discovery effettivo/conteggio dei risultati usato per questo passaggio di sonda.

    Per destinazione (`targets[].connect`):

    - `ok`: raggiungibilità dopo connessione + classificazione degradata.
    - `rpcOk`: successo completo dell'RPC di dettaglio.
    - `scopeLimited`: RPC di dettaglio fallita a causa dell'ambito operatore mancante.

    Per destinazione (`targets[].auth`):

    - `role`: ruolo di autenticazione segnalato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi segnalati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacità di autenticazione esposta per quella destinazione.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: la configurazione del tunnel SSH è fallita; il comando è passato alle sonde dirette.
    - `multiple_gateways`: più di una destinazione era raggiungibile; è insolito a meno che tu non esegua intenzionalmente profili isolati, come un bot di soccorso.
    - `auth_secretref_unresolved`: un SecretRef di autenticazione configurato non ha potuto essere risolto per una destinazione fallita.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma la sonda di lettura è stata limitata dalla mancanza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto tramite SSH (parità app Mac)

La modalità "Remote over SSH" dell'app macOS usa un port-forward locale, così il gateway remoto (che può essere associato solo al loopback) diventa raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` o `user@host:port` (porta predefinita `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File di identità.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Seleziona il primo host gateway scoperto come destinazione SSH dall'endpoint di discovery risolto (`local.` più il dominio wide-area configurato, se presente). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Configurazione (opzionale, usata come impostazioni predefinite):

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

### Installare con un wrapper

Usa `--wrapper` quando il servizio gestito deve avviarsi tramite un altro eseguibile, ad esempio uno
shim di un gestore di segreti o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed è
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

Puoi anche impostare il wrapper tramite l'ambiente. `gateway install` verifica che il percorso sia
un file eseguibile, scrive il wrapper in `ProgramArguments` del servizio e rende persistente
`OPENCLAW_WRAPPER` nell'ambiente del servizio per reinstallazioni forzate, aggiornamenti e riparazioni
doctor successivi.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Per rimuovere un wrapper reso persistente, svuota `OPENCLAW_WRAPPER` durante la reinstallazione:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.
    - I comandi del ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Quando l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non rende persistente il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso invece di rendere persistente testo in chiaro di fallback.
    - Per l'autenticazione con password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` supportato da SecretRef rispetto a `--password` inline.
    - In modalità di autenticazione inferita, `OPENCLAW_GATEWAY_PASSWORD` solo nella shell non allenta i requisiti del token di installazione; usa configurazione durevole (`gateway.auth.password` o config `env`) quando installi un servizio gestito.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scoprire gateway (Bonjour)

`gateway discover` cerca beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [Bonjour](/it/gateway/bonjour).

Solo i gateway con discovery Bonjour abilitata (predefinita) pubblicizzano il beacon.

I record di discovery wide-area includono (TXT):

- `role` (suggerimento sul ruolo del gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (opzionale; i client impostano le destinazioni SSH predefinite su `22` quando assente)
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
- La CLI analizza `local.` più il dominio ad area estesa configurato quando ne è abilitato uno.
- `wsUrl` nell'output JSON deriva dall'endpoint di servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando `discovery.mdns.mode` è `full`. DNS-SD ad area estesa scrive comunque `cliPath`; anche lì `sshPort` resta opzionale.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Manuale operativo del Gateway](/it/gateway)
