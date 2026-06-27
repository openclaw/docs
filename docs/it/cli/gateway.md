---
read_when:
    - Eseguire il Gateway dalla CLI (dev o server)
    - Debug dell'autenticazione Gateway, delle modalità di bind e della connettività
    - Individuazione dei gateway tramite Bonjour (DNS-SD locale + wide-area)
sidebarTitle: Gateway
summary: CLI di OpenClaw Gateway (`openclaw gateway`) — eseguire, interrogare e scoprire i gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:19:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD wide-area.
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
    - Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/dev.
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, trattalo come una configurazione danneggiata o sovrascritta e riparala invece di assumere implicitamente la modalità locale.
    - Se il file esiste e `gateway.mode` manca, il Gateway lo considera un danno sospetto alla configurazione e rifiuta di "indovinare local" per te.
    - Il binding oltre il loopback senza autenticazione è bloccato (misura di sicurezza).
    - `lan`, `tailnet` e `custom` attualmente vengono risolti su percorsi BYOH solo IPv4.
    - BYOH solo IPv6 non è supportato nativamente su questo percorso oggi. Usa un sidecar o proxy IPv4 se l'host stesso è solo IPv6.
    - `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre gateway tool/config apply/update restano consentiti).
    - Gli handler `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano alcuno stato terminale personalizzato. Se incapsuli la CLI con una TUI o input in modalità raw, ripristina il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito viene dalla configurazione/env; di solito `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modalità di binding del listener. `lan`, `tailnet` e `custom` attualmente vengono risolti su percorsi solo IPv4.
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
  Oggi si aspetta un indirizzo IPv4. Per BYOH solo IPv6, posiziona un sidecar o proxy IPv4 davanti al Gateway e indirizza OpenClaw a quell'endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consenti l'avvio del gateway senza `gateway.mode=local` nella configurazione. Aggira la protezione di avvio solo per bootstrap ad hoc/dev; non scrive né ripara il file di configurazione.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configurazione dev + workspace se mancano (salta BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reimposta configurazione dev + credenziali + sessioni + workspace (richiede `--dev`).
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro OpenClaw attivo prima del riavvio. Se operazioni in coda, consegna delle risposte, esecuzioni incorporate o task run sono attivi, il Gateway segnala i blocchi, unifica le richieste duplicate di riavvio sicuro e riavvia quando il lavoro attivo si svuota. `restart` semplice mantiene il comportamento esistente del service manager per compatibilità. Usa `--force` solo quando vuoi esplicitamente il percorso di override immediato.

`openclaw gateway restart --safe --skip-deferral` esegue lo stesso riavvio coordinato consapevole di OpenClaw di `--safe`, ma aggira il gate di rinvio del lavoro attivo, quindi il Gateway emette il riavvio immediatamente anche quando vengono segnalati blocchi. Usalo come via di uscita operativa quando un rinvio è rimasto bloccato da un task run incastrato e `--safe` da solo attenderebbe indefinitamente. `--skip-deferral` richiede `--safe`.

<Warning>
`--password` inline può essere esposta negli elenchi dei processi locali. Preferisci `--password-file`, env o un `gateway.auth.password` basato su SecretRef.
</Warning>

### Profilazione del Gateway

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, inclusi il ritardo `eventLoopMax` per fase e i tempi della tabella di lookup dei Plugin per installed-index, registry dei manifest, pianificazione di avvio e lavoro sulla owner-map.
- Imposta `OPENCLAW_GATEWAY_RESTART_TRACE=1` per registrare righe `restart trace:` con ambito di riavvio per gestione del segnale di riavvio, svuotamento del lavoro attivo, fasi di shutdown, avvio successivo, tempistica di ready e metriche di memoria.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso resta fornito da env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event loop.
- Esegui prima `pnpm build`, poi `pnpm test:startup:gateway -- --runs 5 --warmup 1` per misurare le prestazioni dell'avvio del Gateway rispetto all'entry CLI compilato. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, tempi della traccia di avvio, ritardo dell'event loop e dettagli sui tempi della tabella di lookup dei Plugin.
- Esegui prima `pnpm build`, poi `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` per misurare le prestazioni del riavvio in-process del Gateway rispetto all'entry CLI compilato su macOS o Linux. Il benchmark di riavvio usa SIGUSR1, abilita sia le tracce di avvio sia quelle di riavvio nel processo figlio e registra il successivo `/healthz`, il successivo `/readyz`, downtime, tempistica di ready, CPU, RSS e metriche della traccia di riavvio.
- Tratta `/healthz` come liveness e `/readyz` come readiness utilizzabile. Le righe di traccia e l'output del benchmark servono per l'attribuzione al proprietario; non trattare un singolo intervallo di traccia o un singolo campione come una conclusione completa sulle prestazioni.

## Interrogare un Gateway in esecuzione

Tutti i comandi di query usano RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Predefinito: leggibile da persone (colorato in TTY).
    - `--json`: JSON leggibile da macchine (nessuno stile/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout umano.

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
Quando imposti `--url`, la CLI non ricorre alle credenziali da configurazione o ambiente. Passa `--token` o `--password` esplicitamente. Le credenziali esplicite mancanti sono un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

L'endpoint HTTP `/healthz` è una sonda di liveness: risponde quando il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e resta rosso mentre sidecar Plugin di avvio, canali o hook configurati si stanno ancora stabilizzando. Le risposte dettagliate di readiness locali o autenticate includono un blocco diagnostico `eventLoop` con ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e un flag `degraded`.

<ParamField path="--port <port>" type="number">
  Punta a un Gateway local loopback su questa porta. Questo sovrascrive `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT` per la chiamata health.
</ParamField>

### `gateway usage-cost`

Recupera riepiloghi usage-cost dai log di sessione.

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
  Limita il riepilogo dei costi a un solo id agente configurato.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggrega il riepilogo dei costi su tutti gli agenti configurati. Non può essere combinato con `--agent`.
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
  Leggi un bundle di stabilità persistito invece di chiamare il Gateway in esecuzione. Usa `--bundle latest` (o solo `--bundle`) per il bundle più nuovo nella directory di stato, oppure passa direttamente un percorso JSON del bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Scrivi uno zip diagnostico di supporto condivisibile invece di stampare i dettagli di stabilità.
</ParamField>
<ParamField path="--output <path>" type="string">
  Percorso di output per `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - I record conservano metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di coda/sessione, nomi di canali/Plugin e riepiloghi di sessione redatti. Non conservano testo delle chat, corpi dei webhook, output degli strumenti, corpi raw di richieste o risposte, token, cookie, valori segreti, hostname o id raw delle sessioni. Imposta `diagnostics.enabled: false` per disabilitare completamente il recorder.
    - In caso di uscite fatali del Gateway, timeout di shutdown e fallimenti di avvio dopo riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder ha eventi. Ispeziona il bundle più nuovo con `openclaw gateway stability --bundle latest`; anche `--limit`, `--type` e `--since-seq` si applicano all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrivi uno zip diagnostico locale progettato per essere allegato ai bug report. Per il modello di privacy e i contenuti del bundle, vedi [Esportazione diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso del file zip di output. Per impostazione predefinita usa un export di supporto nella directory di stato.
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
  Salta la ricerca del bundle di stabilità persistito.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il percorso scritto, la dimensione e il manifesto come JSON.
</ParamField>

L’export contiene un manifesto, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi dei log sanificati, snapshot sanificati di stato/integrità del Gateway e il bundle di stabilità più recente quando ne esiste uno.

È pensato per essere condiviso. Mantiene dettagli operativi utili per il debug, come campi di log OpenClaw sicuri, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, ID dei plugin, ID dei provider, impostazioni di funzionalità non segrete e messaggi di log operativi oscurati. Omette o oscura testo delle chat, corpi dei webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggi, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l’export conserva solo il fatto che un messaggio è stato omesso più il suo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) più un probe opzionale della capacità di connettività/autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge un target di probe esplicito. Il remoto configurato + localhost vengono comunque verificati.
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
  Aggiorna il probe di connettività predefinito a un probe di lettura ed esce con codice diverso da zero quando quel probe di lettura fallisce. Non può essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale manca o non è valida.
    - `gateway status` predefinito prova lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile al momento dell’handshake. Non prova le operazioni di lettura/scrittura/admin.
    - I probe diagnostici non effettuano mutazioni per l’autenticazione del dispositivo al primo utilizzo: riusano un token dispositivo memorizzato nella cache quando ne esiste uno, ma non creano una nuova identità dispositivo CLI o un record di associazione dispositivo in sola lettura solo per controllare lo stato.
    - `gateway status` risolve i SecretRef di autenticazione configurati per l’autenticazione del probe quando possibile.
    - Se un SecretRef di autenticazione richiesto non è risolto in questo percorso di comando, `gateway status --json` segnala `rpc.authWarning` quando la connettività/autenticazione del probe fallisce; passa `--token`/`--password` esplicitamente o risolvi prima la sorgente del segreto.
    - Se il probe riesce, gli avvisi sugli auth-ref non risolti vengono soppressi per evitare falsi positivi.
    - Quando il probing è abilitato, l’output JSON include `gateway.version` quando il Gateway in esecuzione lo segnala; `--require-rpc` può ripiegare sul payload RPC `status.runtimeVersion` se il probe di handshake successivo non può fornire metadati di versione.
    - Usa `--require-rpc` in script e automazione quando un servizio in ascolto non basta e serve che anche le chiamate RPC con ambito di lettura siano sane.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati più servizi simili a gateway, l’output umano stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un gateway per macchina.
    - `--deep` segnala anche un recente passaggio di consegne di riavvio del supervisore del Gateway quando il processo del servizio è terminato correttamente per un riavvio del supervisore esterno.
    - `--deep` esegue la validazione della configurazione in modalità consapevole dei plugin (`pluginValidation: "full"`) ed espone gli avvisi dei manifest dei plugin configurati (per esempio metadati di configurazione del canale mancanti) così i controlli smoke di installazione e aggiornamento li intercettano. `gateway status` predefinito mantiene il percorso rapido in sola lettura che salta la validazione dei plugin.
    - L’output umano include il percorso risolto del file di log più lo snapshot di percorsi/validità della configurazione CLI-rispetto-al-servizio per aiutare a diagnosticare divergenze di profilo o directory di stato.

  </Accordion>
  <Accordion title="Controlli di deriva dell’autenticazione systemd Linux">
    - Nelle installazioni systemd Linux, i controlli di deriva dell’autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall’unità (inclusi `%h`, percorsi tra virgolette, file multipli e file opzionali `-`).
    - I controlli di deriva risolvono i SecretRef `gateway.auth.token` usando l’ambiente runtime unito (prima l’ambiente del comando del servizio, poi fallback all’ambiente del processo).
    - Se l’autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` è il comando "debug everything". Esegue sempre il probe di:

- il gateway remoto configurato (se impostato), e
- localhost (loopback) **anche se il remoto è configurato**.

Se passi `--url`, quel target esplicito viene aggiunto prima di entrambi. L’output umano etichetta i target come:

- `URL (explicit)`
- `Remote (configured)` o `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se più target di probe sono raggiungibili, li stampa tutti. Un tunnel SSH, un URL TLS/proxy e un URL remoto configurato possono tutti puntare allo stesso gateway anche quando le rispettive porte di trasporto differiscono; `multiple_gateways` è riservato a gateway raggiungibili distinti o con identità ambigua. Gateway multipli sono supportati quando usi profili isolati (per esempio un bot di soccorso), ma la maggior parte delle installazioni esegue comunque un singolo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa questa porta per il target di probe local loopback e per la porta remota del tunnel SSH. Senza `--url`, seleziona il target local loopback invece dell’URL dell’ambiente gateway configurato, della porta dell’ambiente o dei target remoti.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Reachable: yes` significa che almeno un target ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` segnala cosa il probe ha potuto provare sull’autenticazione. È separato dalla raggiungibilità.
    - `Read probe: ok` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Read probe: limited - missing scope: operator.read` significa che la connessione è riuscita ma l’RPC con ambito di lettura è limitato. Questo viene segnalato come raggiungibilità **degradata**, non come fallimento completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva è scaduta o fallita. Anche questa è raggiungibilità **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, il probe riusa l’autenticazione dispositivo esistente nella cache ma non crea un’identità dispositivo al primo utilizzo né stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessun target verificato è raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno un target è raggiungibile.
    - `degraded`: almeno un target ha accettato una connessione ma non ha completato la diagnostica RPC completa di dettaglio.
    - `capability`: migliore capacità vista tra i target raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: miglior target da trattare come vincitore attivo in quest’ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` opzionali.
    - `network`: suggerimenti di URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell’host.
    - `discovery.timeoutMs` e `discovery.count`: budget di discovery/conteggio risultati effettivi usati per questo passaggio di probe.

    Per target (`targets[].connect`):

    - `ok`: raggiungibilità dopo la classificazione connect + degradata.
    - `rpcOk`: successo RPC completo di dettaglio.
    - `scopeLimited`: RPC di dettaglio fallita per ambito operator mancante.

    Per target (`targets[].auth`):

    - `role`: ruolo di autenticazione segnalato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi segnalati in `hello-ok` quando disponibili.
    - `capability`: la classificazione della capacità di autenticazione esposta per quel target.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH fallita; il comando è ripiegato sui probe diretti.
    - `multiple_gateways`: erano raggiungibili identità gateway distinte, oppure OpenClaw non ha potuto provare che i target raggiungibili siano lo stesso gateway. Un tunnel SSH, URL proxy o URL remoto configurato verso lo stesso gateway non attiva questo avviso.
    - `auth_secretref_unresolved`: un SecretRef di autenticazione configurato non ha potuto essere risolto per un target fallito.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma il probe di lettura era limitato dalla mancanza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto tramite SSH (parità app Mac)

La modalità "Remote over SSH" dell’app macOS usa un port-forward locale così il gateway remoto (che può essere vincolato solo al loopback) diventa raggiungibile su `ws://127.0.0.1:<port>`.

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
  Sceglie il primo host gateway scoperto come target SSH dall’endpoint di discovery risolto (`local.` più il dominio wide-area configurato, se presente). I suggerimenti solo TXT vengono ignorati.
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

Usa `--wrapper` quando il servizio gestito deve avviarsi tramite un altro eseguibile, per esempio uno
shim di un gestore di segreti o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed è
responsabile di eseguire infine tramite exec `openclaw` o Node con quegli argomenti.

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
`OPENCLAW_WRAPPER` nell'ambiente del servizio per successive reinstallazioni forzate, aggiornamenti e riparazioni tramite doctor.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio.
    - Su macOS, `gateway stop` usa `launchctl bootout` per impostazione predefinita, rimuovendo il LaunchAgent dalla sessione di avvio corrente senza mantenere una disabilitazione: il ripristino automatico KeepAlive resta attivo per crash futuri e `gateway start` lo riabilita in modo pulito senza un `launchctl enable` manuale. Passa `--disable` per sopprimere in modo persistente KeepAlive e RunAtLoad così che il gateway non si riavvii fino al successivo `gateway start` esplicito; usalo quando un arresto manuale deve sopravvivere a riavvii o riavvii del sistema.
    - `gateway restart --safe` chiede al Gateway in esecuzione di fare un preflight del lavoro OpenClaw attivo e rinviare il riavvio finché la consegna delle risposte, le esecuzioni incorporate e le esecuzioni dei task non si sono svuotate. `--safe` non può essere combinato con `--force` o `--wait`.
    - `gateway restart --wait 30s` sovrascrive il budget configurato di svuotamento del riavvio per quel riavvio. I numeri senza unità sono millisecondi; sono accettate unità come `s`, `m` e `h`. `--wait 0` attende indefinitamente.
    - `gateway restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma aggira il gate di rinvio, così il Gateway emette subito il riavvio anche quando vengono segnalati blocchi. È una via di uscita per l'operatore in caso di rinvii bloccati da esecuzioni di task; richiede `--safe`.
    - `gateway restart --force` salta lo svuotamento del lavoro attivo e riavvia immediatamente. Usalo quando un operatore ha già ispezionato i blocchi dei task elencati e vuole ripristinare subito il gateway.
    - I comandi del ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non mantiene il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso invece di mantenere testo normale di fallback.
    - Per l'autenticazione tramite password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` inline.
    - In modalità di autenticazione inferita, `OPENCLAW_GATEWAY_PASSWORD` presente solo nella shell non allenta i requisiti del token di installazione; usa una configurazione duratura (`gateway.auth.password` o config `env`) quando installi un servizio gestito.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scoprire i gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour wide-area): scegli un dominio (esempio: `openclaw.internal.`) e configura DNS split + un server DNS; vedi [Bonjour](/it/gateway/bonjour).

Solo i gateway con scoperta Bonjour abilitata (impostazione predefinita) pubblicizzano il beacon.

I record di scoperta wide-area possono includere questi suggerimenti TXT:

- `role` (suggerimento sul ruolo del gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (solo modalità di scoperta completa; i client usano come destinazione SSH predefinita `22` quando è assente)
- `tailnetDns` (nome host MagicDNS, quando disponibile)
- `gatewayTls` / `gatewayTlsSha256` (TLS abilitato + fingerprint del certificato)
- `cliPath` (solo modalità di scoperta completa)

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
- [Runbook Gateway](/it/gateway)
