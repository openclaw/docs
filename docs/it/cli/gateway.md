---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Risoluzione dei problemi relativi all'autenticazione del Gateway, alle modalità di associazione e alla connettività
    - Individuazione dei Gateway tramite Bonjour (DNS-SD locale e su rete geografica)
sidebarTitle: Gateway
summary: CLI di OpenClaw Gateway (`openclaw gateway`) — esegui, interroga e scopri i Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD ad ampia area.
  </Card>
  <Card title="Discovery overview" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e trova i gateway.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration">
    Chiavi di configurazione gateway di livello superiore.
  </Card>
</CardGroup>

## Eseguire il Gateway

Esegui un processo Gateway locale:

```bash
openclaw gateway
```

Alias in primo piano:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
    - `openclaw onboard --mode local` e `openclaw setup` devono scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, trattalo come una configurazione rotta o sovrascritta e riparala invece di presumere implicitamente la modalità locale.
    - Se il file esiste e `gateway.mode` manca, il Gateway lo considera un danno sospetto alla configurazione e rifiuta di "indovinare local" per te.
    - Il binding oltre il loopback senza autenticazione è bloccato (protezione di sicurezza).
    - `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre applicazione/aggiornamento di strumenti/configurazione del gateway restano consentiti).
    - I gestori `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato personalizzato del terminale. Se avvolgi la CLI con una TUI o input in raw mode, ripristina il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito viene da configurazione/env; di solito `18789`).
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
  Leggi la password del gateway da un file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Espone il Gateway tramite Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reimposta la configurazione serve/funnel di Tailscale allo spegnimento.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consenti l'avvio del gateway senza `gateway.mode=local` nella configurazione. Aggira la protezione di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configurazione + workspace di sviluppo se mancano (salta BOOTSTRAP.md).
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
  Registra gli eventi raw dello stream del modello in jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Percorso jsonl dello stream raw.
</ParamField>

## Riavviare il Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` chiede al Gateway in esecuzione di eseguire un controllo preliminare del lavoro OpenClaw attivo prima del riavvio. Se sono attive operazioni in coda, consegna delle risposte, esecuzioni incorporate o esecuzioni di attività, il Gateway segnala i blocchi, unisce le richieste duplicate di riavvio sicuro e riavvia quando il lavoro attivo si esaurisce. Il semplice `restart` mantiene il comportamento esistente del service manager per compatibilità. Usa `--force` solo quando vuoi esplicitamente il percorso di override immediato.

<Warning>
`--password` inline può essere esposta negli elenchi dei processi locali. Preferisci `--password-file`, env o una `gateway.auth.password` basata su SecretRef.
</Warning>

### Profilazione dell'avvio

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, inclusi il ritardo `eventLoopMax` per fase e i tempi delle tabelle di lookup dei plugin per installed-index, manifest registry, pianificazione dell'avvio e lavoro owner-map.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso è comunque fornito da env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event-loop.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare le prestazioni dell'avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, i tempi della traccia di avvio, il ritardo dell'event-loop e i dettagli dei tempi delle tabelle di lookup dei plugin.

## Interrogare un Gateway in esecuzione

Tutti i comandi di query usano WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - Predefinito: leggibile da persone (colorato in TTY).
    - `--json`: JSON leggibile da macchine (senza stile/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout per persone.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia per comando).
    - `--expect-final`: attendi una risposta "final" (chiamate agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non ripiega su configurazione o credenziali d'ambiente. Passa `--token` o `--password` esplicitamente. La mancanza di credenziali esplicite è un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una sonda di liveness: restituisce una risposta quando il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre sidecar di plugin di avvio, canali o hook configurati si stanno ancora stabilizzando. Le risposte dettagliate di readiness locali o autenticate includono un blocco diagnostico `eventLoop` con ritardo dell'event-loop, utilizzo dell'event-loop, rapporto dei core CPU e un flag `degraded`.

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

Recupera il registratore diagnostico di stabilità recente da un Gateway in esecuzione.

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
  Filtra per tipo di evento diagnostico, come `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Includi solo eventi successivi a un numero di sequenza diagnostica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Leggi un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o solo `--bundle`) per il bundle più recente nella directory di stato, oppure passa direttamente un percorso JSON del bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Scrivi uno zip di diagnostica di supporto condivisibile invece di stampare i dettagli di stabilità.
</ParamField>
<ParamField path="--output <path>" type="string">
  Percorso di output per `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - I record conservano metadati operativi: nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di coda/sessione, nomi di canali/plugin e riepiloghi di sessione redatti. Non conservano testo di chat, corpi webhook, output di strumenti, corpi raw di richieste o risposte, token, cookie, valori segreti, nomi host o id raw di sessione. Imposta `diagnostics.enabled: false` per disabilitare completamente il registratore.
    - In caso di uscite fatali del Gateway, timeout di spegnimento e fallimenti di avvio dopo riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il registratore ha eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrivi uno zip di diagnostica locale progettato per essere allegato alle segnalazioni di bug. Per il modello di privacy e i contenuti del bundle, consulta [Esportazione diagnostica](/it/gateway/diagnostics).

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
  URL WebSocket del Gateway per lo snapshot di salute.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway per lo snapshot di salute.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway per lo snapshot di salute.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout dello snapshot di stato/salute.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Salta la ricerca del bundle di stabilità persistito.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il percorso scritto, la dimensione e il manifest come JSON.
</ParamField>

L'esportazione contiene un manifest, un riepilogo Markdown, forma della configurazione, dettagli di configurazione sanificati, riepiloghi dei log sanificati, snapshot di stato/salute del Gateway sanificati e il bundle di stabilità più recente quando esiste.

È pensata per essere condivisa. Conserva dettagli operativi che aiutano il debug, come campi sicuri dei log OpenClaw, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, id plugin, id provider, impostazioni di funzionalità non segrete e messaggi di log operativi redatti. Omette o redige testo di chat, corpi webhook, output di strumenti, credenziali, cookie, identificatori account/messaggio, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l'esportazione conserva solo il fatto che un messaggio è stato omesso più il suo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una sonda opzionale di capacità di connettività/autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge un target esplicito per la sonda. Il remoto configurato e localhost vengono comunque sondati.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticazione tramite token per la sonda.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticazione tramite password per la sonda.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout della sonda.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Salta la sonda di connettivita (vista solo del servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analizza anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promuove la sonda di connettivita predefinita a una sonda di lettura ed esce con codice diverso da zero quando tale sonda di lettura fallisce. Non puo essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione della CLI locale manca o non e valida.
    - `gateway status` predefinito verifica lo stato del servizio, la connessione WebSocket e la capacita di autenticazione visibile al momento dell'handshake. Non verifica le operazioni di lettura/scrittura/amministrazione.
    - Le sonde diagnostiche non modificano l'autenticazione del dispositivo al primo utilizzo: riutilizzano un token dispositivo memorizzato nella cache quando esiste, ma non creano una nuova identita dispositivo della CLI ne un record di associazione dispositivo in sola lettura solo per controllare lo stato.
    - `gateway status` risolve i SecretRef di autenticazione configurati per l'autenticazione della sonda quando possibile.
    - Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `gateway status --json` riporta `rpc.authWarning` quando connettivita/autenticazione della sonda fallisce; passa esplicitamente `--token`/`--password` oppure risolvi prima l'origine del segreto.
    - Se la sonda riesce, gli avvisi di riferimento di autenticazione non risolto vengono soppressi per evitare falsi positivi.
    - Usa `--require-rpc` in script e automazione quando un servizio in ascolto non basta e ti serve che anche le chiamate RPC con ambito di lettura siano integre.
    - `--deep` aggiunge una scansione best-effort per installazioni aggiuntive launchd/systemd/schtasks. Quando vengono rilevati piu servizi simili al Gateway, l'output umano stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un solo Gateway per macchina.
    - `--deep` segnala anche un recente passaggio di consegne del riavvio del supervisore Gateway quando il processo del servizio e terminato correttamente per un riavvio del supervisore esterno.
    - L'output umano include il percorso risolto del file di log piu l'istantanea dei percorsi/validita della configurazione CLI rispetto al servizio per aiutare a diagnosticare divergenze di profilo o directory di stato.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unita (inclusi `%h`, percorsi tra virgolette, file multipli e file opzionali `-`).
    - I controlli di deriva risolvono i SecretRef `gateway.auth.token` usando l'ambiente di runtime unito (prima l'ambiente del comando del servizio, poi il fallback all'ambiente del processo).
    - Se l'autenticazione tramite token non e effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalita non impostata in cui la password puo prevalere e nessun candidato token puo prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` e il comando "debug di tutto". Sonda sempre:

- il tuo gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se e configurato un remoto**.

Se passi `--url`, quel target esplicito viene aggiunto prima di entrambi. L'output umano etichetta i target come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se sono raggiungibili piu gateway, li stampa tutti. Piu gateway sono supportati quando usi profili/porte isolati (ad esempio, un bot di soccorso), ma la maggior parte delle installazioni esegue comunque un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` significa che almeno un target ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` riporta cio che la sonda ha potuto verificare sull'autenticazione. E separato dalla raggiungibilita.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione e riuscita ma l'RPC con ambito di lettura e limitato. Questo viene riportato come raggiungibilita **degradata**, non come errore completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva e scaduta o non e riuscita. Anche questa e raggiungibilita **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, la sonda riutilizza l'autenticazione dispositivo memorizzata nella cache esistente ma non crea identita dispositivo o stato di associazione al primo utilizzo.
    - Il codice di uscita e diverso da zero solo quando nessun target sondato e raggiungibile.

  </Accordion>
  <Accordion title="JSON output">
    Livello superiore:

    - `ok`: almeno un target e raggiungibile.
    - `degraded`: almeno un target ha accettato una connessione ma non ha completato la diagnostica RPC dettagliata completa.
    - `capability`: migliore capacita vista tra i target raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: miglior target da trattare come vincitore attivo in questo ordine: URL esplicito, tunnel SSH, remoto configurato, quindi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` e `discovery.count`: budget di scoperta effettivo/conteggio dei risultati usato per questo passaggio della sonda.

    Per target (`targets[].connect`):

    - `ok`: raggiungibilita dopo connessione + classificazione degradata.
    - `rpcOk`: successo RPC dettagliato completo.
    - `scopeLimited`: RPC dettagliato fallito a causa dell'assenza dell'ambito operatore.

    Per target (`targets[].auth`):

    - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi riportati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacita di autenticazione esposta per quel target.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH fallita; il comando e tornato alle sonde dirette.
    - `multiple_gateways`: piu di un target era raggiungibile; e insolito a meno che tu non esegua intenzionalmente profili isolati, come un bot di soccorso.
    - `auth_secretref_unresolved`: un SecretRef di autenticazione configurato non ha potuto essere risolto per un target fallito.
    - `probe_scope_limited`: connessione WebSocket riuscita, ma la sonda di lettura e stata limitata dall'assenza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto via SSH (parita app Mac)

La modalita "Remote over SSH" dell'app macOS usa un port-forward locale affinche il gateway remoto (che potrebbe essere associato solo a loopback) diventi raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` o `user@host:port` (la porta predefinita e `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File di identita.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Sceglie il primo host gateway scoperto come target SSH dall'endpoint di scoperta risolto (`local.` piu il dominio geografico configurato, se presente). I suggerimenti solo TXT vengono ignorati.
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
shim di gestione dei segreti o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed e
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

Puoi impostare il wrapper anche tramite l'ambiente. `gateway install` verifica che il percorso sia
un file eseguibile, scrive il wrapper in `ProgramArguments` del servizio e persiste
`OPENCLAW_WRAPPER` nell'ambiente del servizio per reinstallazioni forzate, aggiornamenti e riparazioni
doctor successivi.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Per rimuovere un wrapper persistito, svuota `OPENCLAW_WRAPPER` durante la reinstallazione:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.
    - `gateway restart --safe` chiede al Gateway in esecuzione di eseguire il preflight del lavoro OpenClaw attivo e rimandare il riavvio fino allo svuotamento della consegna delle risposte, delle esecuzioni incorporate e delle esecuzioni dei task. `--safe` non puo essere combinato con `--force` o `--wait`.
    - `gateway restart --wait 30s` sostituisce il budget configurato di svuotamento del riavvio per quel riavvio. I numeri senza unita sono millisecondi; sono accettate unita come `s`, `m` e `h`. `--wait 0` attende indefinitamente.
    - `gateway restart --force` salta lo svuotamento del lavoro attivo e riavvia immediatamente. Usalo quando un operatore ha gia ispezionato i blocchi di task elencati e vuole ripristinare subito il gateway.
    - I comandi di ciclo di vita accettano `--json` per gli script.

  </Accordion>
  <Accordion title="Autenticazione e SecretRefs al momento dell'installazione">
    - Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` convalida che il SecretRef sia risolvibile, ma non rende persistente il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione si blocca in modo sicuro invece di rendere persistente testo semplice di fallback.
    - Per l'autenticazione tramite password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o `gateway.auth.password` supportato da SecretRef rispetto a `--password` inline.
    - Nella modalità di autenticazione dedotta, `OPENCLAW_GATEWAY_PASSWORD` solo shell non allenta i requisiti del token di installazione; usa una configurazione durevole (`gateway.auth.password` o `env` della configurazione) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Individuare i gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour Wide-Area): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; vedi [Bonjour](/it/gateway/bonjour).

Solo i gateway con individuazione Bonjour abilitata (impostazione predefinita) pubblicizzano il beacon.

I record di individuazione Wide-Area includono (TXT):

- `role` (suggerimento sul ruolo del gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (facoltativo; i client usano per impostazione predefinita `22` come destinazione SSH quando è assente)
- `tailnetDns` (nome host MagicDNS, quando disponibile)
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
- La CLI esegue la scansione di `local.` più il dominio wide-area configurato quando ne è abilitato uno.
- `wsUrl` nell'output JSON deriva dall'endpoint del servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando `discovery.mdns.mode` è `full`. DNS-SD wide-area scrive comunque `cliPath`; anche lì `sshPort` resta facoltativo.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
