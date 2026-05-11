---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug dell'autenticazione del Gateway, delle modalità di binding e della connettività
    - Rilevamento dei Gateway tramite Bonjour (DNS-SD locale + ad area estesa)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — esegui, interroga e individua i gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD su area estesa.
  </Card>
  <Card title="Discovery overview" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e trova i Gateway.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration">
    Chiavi di configurazione del Gateway di primo livello.
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
    - Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, consideralo una configurazione danneggiata o sovrascritta e riparala invece di presumere implicitamente la modalità locale.
    - Se il file esiste e `gateway.mode` manca, il Gateway lo considera un danno sospetto alla configurazione e rifiuta di "indovinare local" per te.
    - Il binding oltre il loopback senza autenticazione è bloccato (guardrail di sicurezza).
    - `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre applicazione/aggiornamento tramite strumento/configurazione del Gateway restano consentiti).
    - Gli handler `SIGINT`/`SIGTERM` arrestano il processo Gateway, ma non ripristinano alcuno stato personalizzato del terminale. Se incapsuli la CLI con una TUI o input in modalità raw, ripristina il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito proviene da configurazione/env; di solito `18789`).
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
  Legge la password del Gateway da un file.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Espone il Gateway tramite Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reimposta la configurazione Tailscale serve/funnel allo spegnimento.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consente l'avvio del Gateway senza `gateway.mode=local` nella configurazione. Aggira il guard di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
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
  Log verbosi.
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

## Riavviare il Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro OpenClaw attivo prima del riavvio. Se operazioni in coda, consegna delle risposte, esecuzioni incorporate o esecuzioni di task sono attive, il Gateway segnala i blocchi, accorpa le richieste duplicate di riavvio sicuro e riavvia quando il lavoro attivo si svuota. Il semplice `restart` mantiene il comportamento esistente del service manager per compatibilità. Usa `--force` solo quando vuoi esplicitamente il percorso di override immediato.

`openclaw gateway restart --safe --skip-deferral` esegue lo stesso riavvio coordinato e consapevole di OpenClaw di `--safe`, ma aggira il gate di rinvio del lavoro attivo, quindi il Gateway emette il riavvio immediatamente anche quando vengono segnalati blocchi. Usalo come via di fuga per l'operatore quando un rinvio è stato bloccato da un'esecuzione di task incastrata e `--safe` da solo attenderebbe indefinitamente. `--skip-deferral` richiede `--safe`.

<Warning>
`--password` inline può essere esposto negli elenchi locali dei processi. Preferisci `--password-file`, env o un `gateway.auth.password` basato su SecretRef.
</Warning>

### Profilazione dell'avvio

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, incluso il ritardo `eventLoopMax` per fase e i tempi delle tabelle di lookup dei Plugin per installed-index, registro dei manifest, pianificazione dell'avvio e lavoro owner-map.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso è comunque fornito tramite env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event loop.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare le prestazioni dell'avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, i tempi della traccia di avvio, il ritardo dell'event loop e i dettagli dei tempi delle tabelle di lookup dei Plugin.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Predefinito: leggibile da umani (colorato in TTY).
    - `--json`: JSON leggibile da macchine (senza stile/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout umano.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia per comando).
    - `--expect-final`: attende una risposta "final" (chiamate dell'agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non esegue fallback alle credenziali della configurazione o dell'ambiente. Passa `--token` o `--password` esplicitamente. Le credenziali esplicite mancanti sono un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una probe di liveness: restituisce una risposta quando il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre sidecar Plugin di avvio, canali o hook configurati si stanno ancora stabilizzando. Le risposte dettagliate di readiness locali o autenticate includono un blocco diagnostico `eventLoop` con ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e un flag `degraded`.

### `gateway usage-cost`

Recupera riepiloghi dei costi di utilizzo dai log di sessione.

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
  Filtra per tipo di evento diagnostico, come `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Include solo eventi successivi a un numero di sequenza diagnostica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Legge un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o solo `--bundle`) per il bundle più recente nella directory di stato, oppure passa direttamente un percorso JSON del bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Scrive uno zip di diagnostica di supporto condivisibile invece di stampare i dettagli di stabilità.
</ParamField>
<ParamField path="--output <path>" type="string">
  Percorso di output per `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - I record conservano metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e riepiloghi di sessione con redazione. Non conservano testo delle chat, corpi dei Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie, valori segreti, nomi host o ID sessione grezzi. Imposta `diagnostics.enabled: false` per disabilitare completamente il recorder.
    - In caso di uscite fatali del Gateway, timeout di spegnimento e fallimenti di avvio del riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder contiene eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive uno zip diagnostico locale progettato per essere allegato alle segnalazioni di bug. Per il modello di privacy e i contenuti del bundle, vedi [Esportazione diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso dello zip di output. Per impostazione predefinita usa un'esportazione di supporto nella directory di stato.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Numero massimo di righe di log sanificate da includere.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Byte massimi di log da ispezionare.
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

L'esportazione contiene un manifest, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi di log sanificati, snapshot di stato/salute del Gateway sanificati e il bundle di stabilità più recente quando esiste.

È pensata per essere condivisa. Conserva dettagli operativi che aiutano il debug, come campi di log OpenClaw sicuri, nomi di sottosistemi, codici di stato, durate, modalità configurate, porte, ID Plugin, ID provider, impostazioni di funzionalità non segrete e messaggi di log operativi con redazione. Omette o redige testo delle chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l'esportazione conserva solo il fatto che un messaggio è stato omesso più il relativo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una probe opzionale della capacità di connettività/autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge un target di probe esplicito. Remote configurato + localhost vengono comunque sottoposti a probe.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticazione tramite token per il probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticazione tramite password per il probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout del probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Salta il probe di connettività (vista solo del servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scansiona anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promuove il probe di connettività predefinito a un probe di lettura ed esce con codice diverso da zero quando quel probe di lettura fallisce. Non può essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione della CLI locale è mancante o non valida.
    - `gateway status` predefinito verifica lo stato del servizio, la connessione WebSocket e la capability di autenticazione visibile al momento dell'handshake. Non verifica operazioni di lettura/scrittura/amministrazione.
    - I probe diagnostici non modificano l'autenticazione dei dispositivi al primo utilizzo: riutilizzano un token dispositivo esistente nella cache quando presente, ma non creano una nuova identità dispositivo della CLI o un record di associazione dispositivo di sola lettura solo per controllare lo stato.
    - `gateway status` risolve le SecretRef di autenticazione configurate per l'autenticazione del probe quando possibile.
    - Se una SecretRef di autenticazione richiesta non viene risolta in questo percorso di comando, `gateway status --json` segnala `rpc.authWarning` quando connettività/autenticazione del probe fallisce; passa esplicitamente `--token`/`--password` oppure risolvi prima la sorgente del segreto.
    - Se il probe riesce, gli avvisi sulle auth-ref non risolte vengono soppressi per evitare falsi positivi.
    - Usa `--require-rpc` negli script e nell'automazione quando un servizio in ascolto non è sufficiente e hai bisogno che anche le chiamate RPC con ambito di lettura siano sane.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a Gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un Gateway per macchina.
    - `--deep` segnala anche un recente handoff di riavvio del supervisore Gateway quando il processo del servizio è uscito pulitamente per un riavvio del supervisore esterno.
    - `--deep` esegue la validazione della configurazione in modalità consapevole dei Plugin (`pluginValidation: "full"`) ed espone gli avvisi dei manifest dei Plugin configurati (per esempio metadati di configurazione del canale mancanti), così i controlli smoke di installazione e aggiornamento li intercettano. `gateway status` predefinito mantiene il percorso veloce di sola lettura che salta la validazione dei Plugin.
    - L'output leggibile include il percorso risolto del file di log più lo snapshot dei percorsi/della validità della configurazione CLI-vs-servizio per aiutare a diagnosticare divergenze di profilo o state-dir.

  </Accordion>
  <Accordion title="Controlli auth-drift systemd su Linux">
    - Nelle installazioni systemd su Linux, i controlli di drift dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, più file e file opzionali `-`).
    - I controlli di drift risolvono le SecretRef `gateway.auth.token` usando l'ambiente runtime unito (prima l'ambiente del comando del servizio, poi il fallback all'ambiente di processo).
    - Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito pari a `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli token-drift saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando per "debuggare tutto". Esegue sempre il probe di:

- il tuo Gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se remote è configurato**.

Se passi `--url`, quel target esplicito viene aggiunto prima di entrambi. L'output leggibile etichetta i target come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se più Gateway sono raggiungibili, li stampa tutti. Più Gateway sono supportati quando usi profili/porte isolati (per esempio, un bot di recupero), ma la maggior parte delle installazioni esegue comunque un singolo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Reachable: yes` significa che almeno un target ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` segnala ciò che il probe ha potuto verificare sull'autenticazione. È separato dalla raggiungibilità.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma la RPC con ambito di lettura è limitata. Questo viene segnalato come raggiungibilità **degradata**, non come fallimento completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva è andata in timeout o è fallita. Anche questa è raggiungibilità **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, probe riutilizza l'autenticazione dispositivo esistente nella cache ma non crea una prima identità dispositivo o uno stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessun target sottoposto a probe è raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno un target è raggiungibile.
    - `degraded`: almeno un target ha accettato una connessione ma non ha completato la diagnostica RPC di dettaglio completa.
    - `capability`: migliore capability vista tra i target raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: miglior target da trattare come vincitore attivo in quest'ordine: URL esplicito, tunnel SSH, remote configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` e `discovery.count`: budget/numero di risultati di discovery effettivamente usati per questo passaggio di probe.

    Per target (`targets[].connect`):

    - `ok`: raggiungibilità dopo connessione + classificazione degradata.
    - `rpcOk`: successo completo della RPC di dettaglio.
    - `scopeLimited`: RPC di dettaglio fallita a causa della mancanza dell'ambito operator.

    Per target (`targets[].auth`):

    - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi riportati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capability di autenticazione esposta per quel target.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH fallita; il comando è ricaduto sui probe diretti.
    - `multiple_gateways`: più di un target era raggiungibile; è insolito a meno che tu non esegua intenzionalmente profili isolati, come un bot di recupero.
    - `auth_secretref_unresolved`: non è stato possibile risolvere una SecretRef di autenticazione configurata per un target fallito.
    - `probe_scope_limited`: connessione WebSocket riuscita, ma il probe di lettura è stato limitato dalla mancanza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remote tramite SSH (parità con app Mac)

La modalità "Remote over SSH" dell'app macOS usa un port-forward locale così il Gateway remoto (che può essere vincolato solo a loopback) diventa raggiungibile su `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` o `user@host:port` (la porta predefinita è `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File di identità.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Sceglie il primo host Gateway scoperto come target SSH dall'endpoint di discovery risolto (`local.` più il dominio wide-area configurato, se presente). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Configurazione (opzionale, usata come default):

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

Usa `--wrapper` quando il servizio gestito deve avviarsi tramite un altro eseguibile, per esempio uno shim di un gestore di segreti o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed è responsabile di eseguire infine `openclaw` o Node con quegli argomenti.

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

Puoi anche impostare il wrapper tramite l'ambiente. `gateway install` valida che il percorso sia
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
  <Accordion title="Opzioni dei comandi">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamento del ciclo di vita">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto di un riavvio.
    - Su macOS, `gateway stop` usa `launchctl bootout` per impostazione predefinita, che rimuove il LaunchAgent dalla sessione di avvio corrente senza rendere persistente una disabilitazione — il ripristino automatico KeepAlive resta attivo per arresti anomali futuri e `gateway start` lo riabilita correttamente senza un `launchctl enable` manuale. Passa `--disable` per sopprimere in modo persistente KeepAlive e RunAtLoad, così il Gateway non si riavvia fino al successivo `gateway start` esplicito; usalo quando un arresto manuale deve sopravvivere a riavvii o riavvii di sistema.
    - `gateway restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro OpenClaw attivo e di rimandare il riavvio finché la consegna delle risposte, le esecuzioni incorporate e le esecuzioni delle attività non si esauriscono. `--safe` non può essere combinato con `--force` o `--wait`.
    - `gateway restart --wait 30s` sovrascrive il budget di drenaggio del riavvio configurato per quel riavvio. I numeri senza unità sono millisecondi; sono accettate unità come `s`, `m` e `h`. `--wait 0` attende indefinitamente.
    - `gateway restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma ignora il gate di rinvio, quindi il Gateway emette immediatamente il riavvio anche quando vengono segnalati blocchi. Scappatoia operativa per rinvii bloccati di esecuzioni di attività; richiede `--safe`.
    - `gateway restart --force` salta il drenaggio del lavoro attivo e riavvia immediatamente. Usalo quando un operatore ha già ispezionato i blocchi delle attività elencati e vuole ripristinare subito il Gateway.
    - I comandi del ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
  <Accordion title="Autenticazione e SecretRef al momento dell'installazione">
    - Quando l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non rende persistente il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso invece di rendere persistente un testo in chiaro di fallback.
    - Per l'autenticazione con password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` inline.
    - In modalità di autenticazione dedotta, `OPENCLAW_GATEWAY_PASSWORD` solo shell non allenta i requisiti del token di installazione; usa una configurazione durevole (`gateway.auth.password` o config `env`) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scoprire i Gateway (Bonjour)

`gateway discover` scansiona i beacon del Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour ad area estesa): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; consulta [Bonjour](/it/gateway/bonjour).

Solo i Gateway con discovery Bonjour abilitata (impostazione predefinita) pubblicizzano il beacon.

I record di discovery ad area estesa includono (TXT):

- `role` (suggerimento sul ruolo del Gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (facoltativo; i client usano come destinazioni SSH predefinite `22` quando è assente)
- `tailnetDns` (hostname MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + impronta del certificato)
- `cliPath` (suggerimento di installazione remota scritto nella zona ad area estesa)

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
- La CLI scansiona `local.` più il dominio ad area estesa configurato quando ne è abilitato uno.
- `wsUrl` nell'output JSON è derivato dall'endpoint del servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando `discovery.mdns.mode` è `full`. Il DNS-SD ad area estesa scrive comunque `cliPath`; anche lì `sshPort` resta facoltativo.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
