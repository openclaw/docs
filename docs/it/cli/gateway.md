---
read_when:
    - Eseguire il Gateway dalla CLI (sviluppo o server)
    - Debugging dell'autenticazione del Gateway, delle modalità di bind e della connettività
    - Individuazione dei gateway tramite Bonjour (DNS-SD locale e wide-area)
sidebarTitle: Gateway
summary: CLI Gateway di OpenClaw (`openclaw gateway`) — eseguire, interrogare e scoprire gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:08:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

The Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD wide-area.
  </Card>
  <Card title="Discovery overview" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e trova i gateway.
  </Card>
  <Card title="Configuration" href="/it/gateway/configuration">
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
  <Accordion title="Startup behavior">
    - Per impostazione predefinita, il Gateway rifiuta l'avvio a meno che `gateway.mode=local` sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo.
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma manca `gateway.mode`, trattalo come una configurazione rotta o sovrascritta e riparala invece di presupporre implicitamente la modalità locale.
    - Se il file esiste e manca `gateway.mode`, il Gateway lo considera un danno sospetto alla configurazione e rifiuta di "indovinare local" al posto tuo.
    - Il binding oltre il loopback senza autenticazione è bloccato (protezione di sicurezza).
    - `lan`, `tailnet` e `custom` attualmente si risolvono su percorsi BYOH solo IPv4.
    - Il BYOH solo IPv6 non è supportato nativamente su questo percorso oggi. Usa un sidecar IPv4 o un proxy se l'host stesso è solo IPv6.
    - `SIGUSR1` attiva un riavvio nel processo quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre apply/update dello strumento/configurazione gateway restano consentiti).
    - Gli handler `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato personalizzato del terminale. Se avvolgi la CLI con una TUI o input in raw mode, ripristina il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito viene da configurazione/env; di solito `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modalità di bind del listener. `lan`, `tailnet` e `custom` attualmente si risolvono su percorsi solo IPv4.
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Oggi si aspetta un indirizzo IPv4. Per BYOH solo IPv6, posiziona un sidecar IPv4 o un proxy davanti al Gateway e punta OpenClaw a quell'endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consenti l'avvio del gateway senza `gateway.mode=local` nella configurazione. Aggira la protezione di avvio solo per bootstrap ad hoc/di sviluppo; non scrive né ripara il file di configurazione.
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
  Stile del log WebSocket.
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro attivo e pianificare un unico riavvio accorpato dopo lo svuotamento del lavoro attivo. Il riavvio sicuro predefinito attende il lavoro attivo fino al valore configurato di `gateway.reload.deferralTimeoutMs` (predefinito 5 minuti); quando quel budget scade, il riavvio viene forzato. Imposta `gateway.reload.deferralTimeoutMs` a `0` per un'attesa sicura indefinita che non forza mai. `restart` semplice mantiene il comportamento esistente del service manager; `--force` resta il percorso di override immediato.

`openclaw gateway restart --safe --skip-deferral` esegue lo stesso riavvio coordinato e consapevole di OpenClaw di `--safe`, ma aggira il gate di rinvio del lavoro attivo, quindi il Gateway emette il riavvio immediatamente anche quando vengono segnalati blocker. Usalo come via di uscita operativa quando un rinvio è rimasto bloccato da una task run inceppata e `--safe` da solo potrebbe essere limitato da `gateway.reload.deferralTimeoutMs`. `--skip-deferral` richiede `--safe`.

<Warning>
`--password` inline può essere esposta negli elenchi dei processi locali. Preferisci `--password-file`, env, o una `gateway.auth.password` basata su SecretRef.
</Warning>

### Profilazione del Gateway

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, inclusi il ritardo `eventLoopMax` per fase e i tempi delle tabelle di lookup dei plugin per installed-index, manifest registry, pianificazione dell'avvio e lavoro owner-map.
- Imposta `OPENCLAW_GATEWAY_RESTART_TRACE=1` per registrare righe `restart trace:` circoscritte al riavvio per gestione del segnale di riavvio, svuotamento del lavoro attivo, fasi di spegnimento, avvio successivo, tempo di ready e metriche di memoria.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso resta fornito tramite env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event loop.
- Esegui prima `pnpm build`, poi `pnpm test:startup:gateway -- --runs 5 --warmup 1` per eseguire benchmark dell'avvio del Gateway rispetto all'entry CLI compilata. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, i tempi di startup trace, il ritardo dell'event loop e i dettagli sui tempi delle tabelle di lookup dei plugin.
- Esegui prima `pnpm build`, poi `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` per eseguire benchmark del riavvio del Gateway nel processo rispetto all'entry CLI compilata su macOS o Linux. Il benchmark di riavvio usa SIGUSR1, abilita sia le trace di avvio sia quelle di riavvio nel processo figlio, e registra il successivo `/healthz`, il successivo `/readyz`, downtime, tempo di ready, CPU, RSS e metriche di restart trace.
- Tratta `/healthz` come liveness e `/readyz` come readiness utilizzabile. Le righe di trace e l'output del benchmark servono per l'attribuzione al proprietario; non trattare un singolo span di trace o un singolo campione come una conclusione completa sulle prestazioni.

## Interrogare un Gateway in esecuzione

Tutti i comandi di query usano RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Predefinito: leggibile da umani (colorato in TTY).
    - `--json`: JSON leggibile da macchina (senza styling/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout umano.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia per comando).
    - `--expect-final`: attendi una risposta "final" (chiamate dell'agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non esegue fallback alle credenziali di configurazione o ambiente. Passa `--token` o `--password` esplicitamente. La mancanza di credenziali esplicite è un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

L'endpoint HTTP `/healthz` è una sonda di liveness: restituisce una risposta non appena il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre sidecar di plugin di avvio, canali o hook configurati si stanno ancora stabilizzando. Le risposte di readiness dettagliate locali o autenticate includono un blocco diagnostico `eventLoop` con ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e un flag `degraded`.

<ParamField path="--port <port>" type="number">
  Punta a un Gateway local loopback su questa porta. Questo sostituisce `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT` per la chiamata di health.
</ParamField>

### `gateway usage-cost`

Recupera riepiloghi di usage-cost dai log di sessione.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Numero di giorni da includere.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Limita il riepilogo dei costi a un id agente configurato.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggrega il riepilogo dei costi tra tutti gli agenti configurati. Non può essere combinato con `--agent`.
</ParamField>

### `gateway stability`

Recupera il recorder diagnostico recente della stabilità da un Gateway in esecuzione.

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
  Includi solo eventi dopo un numero di sequenza diagnostica.
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
    - I record conservano metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/plugin e riepiloghi di sessione redatti. Non conservano testo delle chat, corpi webhook, output degli strumenti, corpi raw di richieste o risposte, token, cookie, valori segreti, hostname o id sessione raw. Imposta `diagnostics.enabled: false` per disabilitare interamente il recorder.
    - Su uscite fatali del Gateway, timeout di spegnimento e fallimenti di avvio dopo riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder ha eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive uno zip diagnostico locale progettato per essere allegato alle segnalazioni di bug. Per il modello di privacy e i contenuti del bundle, consulta [Esportazione diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso zip di output. Per impostazione predefinita usa un'esportazione di supporto nella directory di stato.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Numero massimo di righe di log sanificate da includere.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Numero massimo di byte di log da ispezionare.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway per lo snapshot di integrità.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway per lo snapshot di integrità.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway per lo snapshot di integrità.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout dello snapshot di stato/integrità.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Salta la ricerca del bundle di stabilità persistente.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il percorso scritto, la dimensione e il manifest come JSON.
</ParamField>

L'esportazione contiene un manifest, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi di log sanificati, snapshot di stato/integrità del Gateway sanificati e il bundle di stabilità più recente quando esiste.

È pensata per essere condivisa. Mantiene dettagli operativi utili per il debug, come campi di log sicuri di OpenClaw, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, ID plugin, ID provider, impostazioni di funzionalità non segrete e messaggi di log operativi oscurati. Omette o oscura testo di chat, corpi dei Webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l'esportazione mantiene solo l'informazione che un messaggio è stato omesso più il relativo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più un probe opzionale della connettività/capacità di autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge un target di probe esplicito. Il remoto configurato + localhost vengono comunque sottoposti a probe.
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
  Salta il probe di connettività (vista solo servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scansiona anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Aggiorna il probe di connettività predefinito a un probe di lettura ed esce con codice diverso da zero quando quel probe di lettura fallisce. Non può essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale è mancante o non valida.
    - Il `gateway status` predefinito verifica lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile al momento dell'handshake. Non verifica operazioni di lettura/scrittura/amministrazione.
    - I probe diagnostici non sono mutanti per l'autenticazione iniziale del dispositivo: riutilizzano un token dispositivo memorizzato nella cache quando esiste, ma non creano una nuova identità dispositivo CLI o un record di associazione dispositivo in sola lettura solo per controllare lo stato.
    - `gateway status` risolve le SecretRefs di autenticazione configurate per l'autenticazione del probe quando possibile.
    - Se una SecretRef di autenticazione richiesta non viene risolta in questo percorso di comando, `gateway status --json` segnala `rpc.authWarning` quando la connettività/autenticazione del probe fallisce; passa `--token`/`--password` esplicitamente o risolvi prima la sorgente del segreto.
    - Se il probe riesce, gli avvisi di riferimento di autenticazione non risolto vengono soppressi per evitare falsi positivi.
    - Quando il probing è abilitato, l'output JSON include `gateway.version` quando il Gateway in esecuzione la segnala; `--require-rpc` può ripiegare sul payload RPC `status.runtimeVersion` se il probe di handshake successivo non può fornire metadati di versione.
    - Usa `--require-rpc` negli script e nelle automazioni quando un servizio in ascolto non è sufficiente e devi verificare anche che le chiamate RPC con ambito di lettura siano integre.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un gateway per macchina.
    - `--deep` segnala anche un recente passaggio di consegne di riavvio del supervisore Gateway quando il processo del servizio è uscito correttamente per un riavvio da supervisore esterno.
    - `--deep` esegue la validazione della configurazione in modalità consapevole dei plugin (`pluginValidation: "full"`) ed espone gli avvisi del manifest dei plugin configurati (per esempio metadati di configurazione del canale mancanti) così che i controlli smoke di installazione e aggiornamento li intercettino. Il `gateway status` predefinito mantiene il percorso rapido in sola lettura che salta la validazione dei plugin.
    - L'output leggibile include il percorso risolto del file di log più lo snapshot dei percorsi/validità di configurazione CLI rispetto al servizio per aiutare a diagnosticare deriva del profilo o della directory di stato.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Nelle installazioni Linux systemd, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi quotati, più file e file opzionali `-`).
    - I controlli di deriva risolvono le SecretRefs `gateway.auth.token` usando l'ambiente runtime unificato (prima l'ambiente del comando del servizio, poi il fallback all'ambiente del processo).
    - Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, o modalità non impostata dove la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando "debug everything". Esegue sempre il probe di:

- il tuo gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se il remoto è configurato**.

Se passi `--url`, quel target esplicito viene aggiunto prima di entrambi. L'output leggibile etichetta i target come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se più target di probe sono raggiungibili, li stampa tutti. Un tunnel SSH, un URL TLS/proxy e un URL remoto configurato possono tutti puntare allo stesso gateway anche quando le loro porte di trasporto differiscono; `multiple_gateways` è riservato a gateway raggiungibili distinti o con identità ambigua. Più gateway sono supportati quando usi profili isolati (per esempio un bot di soccorso), ma la maggior parte delle installazioni esegue comunque un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa questa porta per il target di probe local loopback e per la porta remota del tunnel SSH. Senza `--url`, seleziona il target local loopback invece dell'URL dell'ambiente gateway configurato, della porta dell'ambiente o dei target remoti.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` significa che almeno un target ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` segnala ciò che il probe ha potuto verificare sull'autenticazione. È separato dalla raggiungibilità.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l'RPC con ambito di lettura è limitata. Questo viene segnalato come raggiungibilità **degradata**, non come fallimento completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva è scaduta o fallita. Anche questa è raggiungibilità **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, il probe riutilizza l'autenticazione dispositivo esistente nella cache ma non crea identità dispositivo iniziale o stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessun target sottoposto a probe è raggiungibile.

  </Accordion>
  <Accordion title="JSON output">
    Livello superiore:

    - `ok`: almeno un target è raggiungibile.
    - `degraded`: almeno un target ha accettato una connessione ma non ha completato la diagnostica RPC di dettaglio completa.
    - `capability`: migliore capacità osservata tra i target raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: miglior target da trattare come vincitore attivo in questo ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` e `discovery.count`: budget di discovery effettivo/conteggio risultati usato per questo passaggio di probe.

    Per target (`targets[].connect`):

    - `ok`: raggiungibilità dopo connessione + classificazione degradata.
    - `rpcOk`: successo RPC di dettaglio completo.
    - `scopeLimited`: RPC di dettaglio fallita a causa dell'ambito operatore mancante.

    Per target (`targets[].auth`):

    - `role`: ruolo di autenticazione segnalato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi segnalati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacità di autenticazione esposta per quel target.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH fallita; il comando è ripiegato sui probe diretti.
    - `multiple_gateways`: identità gateway distinte erano raggiungibili, oppure OpenClaw non ha potuto verificare che i target raggiungibili siano lo stesso gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato verso lo stesso gateway non attiva questo avviso.
    - `auth_secretref_unresolved`: non è stato possibile risolvere una SecretRef di autenticazione configurata per un target fallito.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma il probe di lettura è stato limitato dalla mancanza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto su SSH (parità con l'app Mac)

La modalità "Remote over SSH" dell'app macOS usa un port-forward locale così che il gateway remoto (che potrebbe essere associato solo a loopback) diventi raggiungibile a `ws://127.0.0.1:<port>`.

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
  Sceglie il primo host gateway scoperto come target SSH dall'endpoint di discovery risolto (`local.` più il dominio geografico configurato, se presente). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Configurazione (opzionale, usata come predefinita):

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

Usa `--wrapper` quando il servizio gestito deve essere avviato tramite un altro eseguibile, ad esempio uno
shim per il gestore dei segreti o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed è
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
doctor successive.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Per rimuovere un wrapper persistente, cancella `OPENCLAW_WRAPPER` durante la reinstallazione:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio.
    - Su macOS, `gateway stop` usa `launchctl bootout` per impostazione predefinita, che rimuove il LaunchAgent dalla sessione di avvio corrente senza rendere persistente una disabilitazione: il ripristino automatico KeepAlive resta attivo per gli arresti anomali futuri e `gateway start` lo riabilita correttamente senza un `launchctl enable` manuale. Passa `--disable` per sopprimere in modo persistente KeepAlive e RunAtLoad, così il Gateway non si riavvia finché non viene eseguito esplicitamente il successivo `gateway start`; usalo quando un arresto manuale deve sopravvivere a riavvii o riavvii di sistema.
    - `gateway restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro attivo e pianificare un unico riavvio aggregato dopo lo svuotamento del lavoro attivo. Il riavvio sicuro predefinito attende il lavoro attivo fino al valore configurato di `gateway.reload.deferralTimeoutMs` (predefinito 5 minuti); quando quel budget scade, il riavvio viene forzato. Imposta `gateway.reload.deferralTimeoutMs` su `0` per un'attesa sicura indefinita che non forza mai. `--safe` non può essere combinato con `--force` o `--wait`.
    - `gateway restart --wait 30s` sovrascrive il budget configurato di svuotamento del riavvio per quel riavvio. I numeri senza unità sono millisecondi; sono accettate unità come `s`, `m` e `h`. `--wait 0` attende indefinitamente.
    - `gateway restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma bypassa il gate di rinvio, così il Gateway emette immediatamente il riavvio anche quando vengono segnalati blocchi. Via di uscita operativa per rinvii bloccati da esecuzioni di task; richiede `--safe`.
    - `gateway restart --force` salta lo svuotamento del lavoro attivo e riavvia immediatamente. Usalo quando un operatore ha già ispezionato i blocchi di task elencati e vuole riportare subito online il Gateway.
    - I comandi del ciclo di vita accettano `--json` per gli script.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Quando l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non rende persistente il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso invece di rendere persistente testo in chiaro di fallback.
    - Per l'autenticazione con password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` inline.
    - In modalità di autenticazione dedotta, `OPENCLAW_GATEWAY_PASSWORD` solo nella shell non allenta i requisiti del token per l'installazione; usa una configurazione durevole (`gateway.auth.password` o `env` di configurazione) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scoprire Gateway (Bonjour)

`gateway discover` cerca beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour Wide-Area): scegli un dominio (esempio: `openclaw.internal.`) e configura DNS split + un server DNS; vedi [Bonjour](/it/gateway/bonjour).

Solo i Gateway con discovery Bonjour abilitata (predefinito) pubblicizzano il beacon.

I record di discovery wide-area possono includere questi suggerimenti TXT:

- `role` (suggerimento sul ruolo del Gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (solo modalità discovery completa; i client usano come destinazione SSH predefinita `22` quando è assente)
- `tailnetDns` (nome host MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + fingerprint del certificato)
- `cliPath` (solo modalità discovery completa)

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
- Su mDNS `local.` e DNS-SD wide-area, `sshPort` e `cliPath` vengono pubblicati solo quando `discovery.mdns.mode` è `full`.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
