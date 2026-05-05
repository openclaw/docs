---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug dell'autenticazione del Gateway, delle modalità di bind e della connettività
    - Rilevamento dei Gateway tramite Bonjour (DNS-SD locale + ad area estesa)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — avvia, interroga e rileva Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Scoperta Bonjour" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD wide-area.
  </Card>
  <Card title="Panoramica della scoperta" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e trova i gateway.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration">
    Chiavi di configurazione gateway di primo livello.
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
  <Accordion title="Comportamento all'avvio">
    - Per impostazione predefinita, il Gateway si rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, consideralo una configurazione rotta o sovrascritta e riparala invece di presupporre implicitamente la modalità locale.
    - Se il file esiste e `gateway.mode` manca, il Gateway considera la situazione un danno sospetto alla configurazione e si rifiuta di "indovinare local" per te.
    - L'associazione oltre il loopback senza auth è bloccata (protezione di sicurezza).
    - `SIGUSR1` attiva un riavvio nel processo quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre apply/update di strumenti/configurazione gateway restano consentiti).
    - I gestori `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato personalizzato del terminale. Se avvolgi la CLI con una TUI o input in modalità raw, ripristina il terminale prima di uscire.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito proviene da configurazione/env; di solito `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modalità di associazione del listener.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Override della modalità auth.
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

`openclaw gateway restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro OpenClaw attivo prima di riavviare. Se operazioni in coda, consegna delle risposte, esecuzioni incorporate o esecuzioni di task sono attive, il Gateway segnala i blocchi, accorpa le richieste duplicate di riavvio sicuro e riavvia una volta che il lavoro attivo si è svuotato. Il semplice `restart` mantiene il comportamento esistente del gestore del servizio per compatibilità. Usa `--force` solo quando vuoi esplicitamente il percorso di override immediato.

<Warning>
`--password` inline può essere esposto negli elenchi dei processi locali. Preferisci `--password-file`, env o un `gateway.auth.password` basato su SecretRef.
</Warning>

### Profilazione dell'avvio

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, inclusi il ritardo `eventLoopMax` per fase e i tempi della tabella di lookup dei Plugin per indice installato, registro manifest, pianificazione dell'avvio e lavoro sulla mappa dei proprietari.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso è comunque fornito tramite env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event loop.
- Esegui `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare le prestazioni dell'avvio del Gateway. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, i tempi della traccia di avvio, il ritardo dell'event loop e i dettagli dei tempi della tabella di lookup dei Plugin.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano RPC WebSocket.

<Tabs>
  <Tab title="Modalità di output">
    - Predefinito: leggibile da persone (colorato in TTY).
    - `--json`: JSON leggibile dalla macchina (senza stile/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout per persone.

  </Tab>
  <Tab title="Opzioni condivise">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia per comando).
    - `--expect-final`: attendi una risposta "final" (chiamate agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non ripiega sulle credenziali da configurazione o ambiente. Passa esplicitamente `--token` o `--password`. Le credenziali esplicite mancanti sono un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

L'endpoint HTTP `/healthz` è una sonda di liveness: restituisce una risposta appena il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre sidecar Plugin di avvio, canali o hook configurati si stanno ancora stabilizzando. Le risposte locali o autenticate di readiness dettagliata includono un blocco diagnostico `eventLoop` con ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e un flag `degraded`.

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
  <Accordion title="Privacy e comportamento dei bundle">
    - I record mantengono metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e riepiloghi di sessione oscurati. Non mantengono testo delle chat, body dei webhook, output degli strumenti, body raw di richieste o risposte, token, cookie, valori segreti, hostname o ID raw delle sessioni. Imposta `diagnostics.enabled: false` per disabilitare completamente il recorder.
    - In caso di uscite fatali del Gateway, timeout di spegnimento e fallimenti di avvio al riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder ha eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; anche `--limit`, `--type` e `--since-seq` si applicano all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive uno zip di diagnostica locale progettato per essere allegato ai report di bug. Per il modello di privacy e i contenuti del bundle, vedi [Esportazione diagnostica](/it/gateway/diagnostics).

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

L'esportazione contiene un manifest, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi dei log sanificati, snapshot di stato/health del Gateway sanificati e il bundle di stabilità più recente quando ne esiste uno.

È pensata per essere condivisa. Mantiene dettagli operativi utili al debug, come campi sicuri dei log OpenClaw, nomi di sottosistemi, codici di stato, durate, modalità configurate, porte, ID Plugin, ID provider, impostazioni di funzionalità non segrete e messaggi di log operativi oscurati. Omette o oscura testo delle chat, body dei webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, hostname e valori segreti. Quando un messaggio in stile LogTape sembra testo payload utente/chat/strumento, l'esportazione conserva solo il fatto che un messaggio è stato omesso più il suo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più una sonda opzionale della capacità di connettività/auth.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge un target di probe esplicito. Il remoto configurato + localhost vengono comunque sottoposti a probe.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticazione con token per il probe.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticazione con password per il probe.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout del probe.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Salta il probe di connettività (vista solo servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scansiona anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promuove il probe di connettività predefinito a un probe di lettura ed esce con codice diverso da zero quando quel probe di lettura fallisce. Non può essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale è mancante o non valida.
    - `gateway status` predefinito verifica lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile al momento dell'handshake. Non verifica le operazioni di lettura/scrittura/amministrazione.
    - I probe diagnostici non modificano l'autenticazione dei dispositivi al primo uso: riutilizzano un token dispositivo già presente nella cache quando esiste, ma non creano una nuova identità dispositivo CLI o un record di associazione dispositivo di sola lettura solo per controllare lo stato.
    - `gateway status` risolve, quando possibile, i SecretRefs di autenticazione configurati per l'autenticazione del probe.
    - Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso del comando, `gateway status --json` segnala `rpc.authWarning` quando connettività/autenticazione del probe fallisce; passa `--token`/`--password` esplicitamente oppure risolvi prima l'origine del segreto.
    - Se il probe riesce, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
    - Usa `--require-rpc` negli script e nell'automazione quando un servizio in ascolto non basta e servono anche chiamate RPC con scope di lettura funzionanti.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a gateway, l'output per utenti mostra suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un solo gateway per macchina.
    - L'output per utenti include il percorso risolto del log su file più lo snapshot dei percorsi/validità della configurazione CLI rispetto al servizio, per aiutare a diagnosticare deriva di profilo o state-dir.

  </Accordion>
  <Accordion title="Controlli di deriva dell'autenticazione Linux systemd">
    - Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, più file e file opzionali `-`).
    - I controlli di deriva risolvono i SecretRefs `gateway.auth.token` usando l'env runtime unito (prima l'env del comando del servizio, poi il fallback all'env del processo).
    - Se l'autenticazione con token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di token-drift saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando "debug di tutto". Esegue sempre il probe di:

- il tuo Gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se è configurato un remoto**.

Se passi `--url`, quel target esplicito viene aggiunto prima di entrambi. L'output per utenti etichetta i target come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se più Gateway sono raggiungibili, li stampa tutti. Più Gateway sono supportati quando usi profili/porte isolati (ad esempio un bot di recupero), ma la maggior parte delle installazioni esegue comunque un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Reachable: yes` significa che almeno un target ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` segnala ciò che il probe ha potuto verificare sull'autenticazione. È separato dalla raggiungibilità.
    - `Read probe: ok` significa che sono riuscite anche le chiamate RPC di dettaglio con scope di lettura (`health`/`status`/`system-presence`/`config.get`).
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l'RPC con scope di lettura è limitato. Questo viene segnalato come raggiungibilità **degradata**, non come fallimento completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva è andata in timeout o non è riuscita. Anche questa è raggiungibilità **degradata**, non un Gateway non raggiungibile.
    - Come `gateway status`, il probe riutilizza l'autenticazione dispositivo già presente nella cache ma non crea identità dispositivo al primo uso o stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessun target sottoposto a probe è raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno un target è raggiungibile.
    - `degraded`: almeno un target ha accettato una connessione ma non ha completato la diagnostica RPC di dettaglio completa.
    - `capability`: migliore capacità vista tra i target raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: miglior target da trattare come vincitore attivo in quest'ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete host.
    - `discovery.timeoutMs` e `discovery.count`: il budget di discovery effettivo/conteggio risultati usato per questo passaggio di probe.

    Per target (`targets[].connect`):

    - `ok`: raggiungibilità dopo connessione + classificazione degradata.
    - `rpcOk`: successo RPC di dettaglio completo.
    - `scopeLimited`: RPC di dettaglio fallita a causa di scope operatore mancante.

    Per target (`targets[].auth`):

    - `role`: ruolo di autenticazione segnalato in `hello-ok` quando disponibile.
    - `scopes`: scope concessi segnalati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacità di autenticazione esposta per quel target.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH non riuscita; il comando è ricaduto sui probe diretti.
    - `multiple_gateways`: più di un target era raggiungibile; è insolito a meno che tu non esegua intenzionalmente profili isolati, come un bot di recupero.
    - `auth_secretref_unresolved`: non è stato possibile risolvere un SecretRef di autenticazione configurato per un target fallito.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma il probe di lettura è stato limitato dalla mancanza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto tramite SSH (parità app Mac)

La modalità "Remoto tramite SSH" dell'app macOS usa un port-forward locale così il Gateway remoto (che può essere associato solo al loopback) diventa raggiungibile su `ws://127.0.0.1:<port>`.

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
  Sceglie il primo host Gateway rilevato come target SSH dall'endpoint di discovery risolto (`local.` più il dominio wide-area configurato, se presente). I suggerimenti solo TXT vengono ignorati.
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
  Stringa oggetto JSON per params.
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
  Output JSON leggibile da macchina.
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
un file eseguibile, scrive il wrapper in `ProgramArguments` del servizio e mantiene
`OPENCLAW_WRAPPER` nell'ambiente del servizio per reinstallazioni forzate, aggiornamenti e riparazioni doctor
successivi.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Per rimuovere un wrapper mantenuto, svuota `OPENCLAW_WRAPPER` durante la reinstallazione:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opzioni dei comandi">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Comportamento del ciclo di vita">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.
    - `gateway restart --safe` chiede al Gateway in esecuzione di verificare preventivamente il lavoro OpenClaw attivo e rinviare il riavvio finché la consegna delle risposte, le esecuzioni integrate e le esecuzioni delle attività non si svuotano. `--safe` non può essere combinato con `--force` o `--wait`.
    - `gateway restart --wait 30s` sovrascrive il budget di drenaggio riavvio configurato per quel riavvio. I numeri senza unità sono millisecondi; sono accettate unità come `s`, `m` e `h`. `--wait 0` attende indefinitamente.
    - `gateway restart --force` salta il drenaggio del lavoro attivo e riavvia immediatamente. Usalo quando un operatore ha già ispezionato i blocchi attività elencati e vuole ripristinare subito il gateway.
    - I comandi del ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
  <Accordion title="Auth e SecretRefs al momento dell'installazione">
    - Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non salva il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modalità fail-closed invece di salvare testo in chiaro di fallback.
    - Per l'autenticazione tramite password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` inline.
    - In modalità di autenticazione dedotta, `OPENCLAW_GATEWAY_PASSWORD` disponibile solo nella shell non allenta i requisiti del token di installazione; usa una configurazione persistente (`gateway.auth.password` o config `env`) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scopri i Gateway (Bonjour)

`gateway discover` cerca beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; consulta [Bonjour](/it/gateway/bonjour).

Solo i Gateway con discovery Bonjour abilitata (predefinito) pubblicizzano il beacon.

I record di discovery Wide-Area includono (TXT):

- `role` (suggerimento sul ruolo del Gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (opzionale; i client usano come target SSH predefiniti `22` quando è assente)
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
  Output leggibile da macchina (disattiva anche stile/spinner).
</ParamField>

Esempi:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI esamina `local.` più il dominio wide-area configurato quando ne è abilitato uno.
- `wsUrl` nell'output JSON è derivato dall'endpoint del servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.`, `sshPort` e `cliPath` vengono trasmessi solo quando `discovery.mdns.mode` è `full`. DNS-SD wide-area scrive comunque `cliPath`; anche lì `sshPort` resta opzionale.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
