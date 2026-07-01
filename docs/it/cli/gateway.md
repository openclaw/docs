---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug di autenticazione Gateway, modalità di bind e connettività
    - Rilevamento dei Gateway tramite Bonjour (locale + DNS-SD wide-area)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — esegui, interroga e scopri i Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-01T05:47:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). I sottocomandi in questa pagina si trovano sotto `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Rilevamento Bonjour" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD wide-area.
  </Card>
  <Card title="Panoramica del rilevamento" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e trova i gateway.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration">
    Chiavi di configurazione del gateway di primo livello.
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
    - Per impostazione predefinita, il Gateway rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/dev.
    - `openclaw onboard --mode local` e `openclaw setup` dovrebbero scrivere `gateway.mode=local`. Se il file esiste ma `gateway.mode` manca, consideralo una configurazione rotta o sovrascritta e riparalo invece di presumere implicitamente la modalità locale.
    - Se il file esiste e `gateway.mode` manca, il Gateway lo considera un danno sospetto alla configurazione e rifiuta di "indovinare local" per te.
    - Il binding oltre il loopback senza autenticazione è bloccato (misura di sicurezza).
    - `lan`, `tailnet` e `custom` attualmente si risolvono tramite percorsi BYOH solo IPv4.
    - BYOH solo IPv6 non è supportato nativamente su questo percorso oggi. Usa un sidecar IPv4 o un proxy se l'host stesso è solo IPv6.
    - `SIGUSR1` attiva un riavvio in-process quando autorizzato (`commands.restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per bloccare il riavvio manuale, mentre l'applicazione/aggiornamento di strumenti/configurazione del gateway rimane consentito).
    - Gli handler `SIGINT`/`SIGTERM` arrestano il processo gateway, ma non ripristinano eventuali stati personalizzati del terminale. Se avvolgi la CLI con una TUI o input in modalità raw, ripristina il terminale prima di uscire.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (il valore predefinito proviene da config/env; di solito `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Modalità di bind del listener. `lan`, `tailnet` e `custom` attualmente si risolvono tramite percorsi solo IPv4.
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
  Oggi si aspetta un indirizzo IPv4. Per BYOH solo IPv6, metti un sidecar IPv4 o un proxy davanti al Gateway e punta OpenClaw a quell'endpoint IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Consenti l'avvio del gateway senza `gateway.mode=local` nella configurazione. Bypassa la protezione di avvio solo per bootstrap ad hoc/dev; non scrive né ripara il file di configurazione.
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` chiede al Gateway in esecuzione di fare un preflight del lavoro attivo e pianificare un singolo riavvio coalescente dopo lo svuotamento del lavoro attivo. Il riavvio sicuro predefinito attende il lavoro attivo fino al `gateway.reload.deferralTimeoutMs` configurato (predefinito 5 minuti); quando quel budget scade, il riavvio viene forzato. Imposta `gateway.reload.deferralTimeoutMs` a `0` per un'attesa sicura indefinita che non forza mai. Il semplice `restart` mantiene il comportamento esistente del service manager; `--force` rimane il percorso di override immediato.

`openclaw gateway restart --safe --skip-deferral` esegue lo stesso riavvio coordinato consapevole di OpenClaw di `--safe`, ma bypassa il gate di rinvio del lavoro attivo, quindi il Gateway emette il riavvio immediatamente anche quando vengono segnalati blocchi. Usalo come via di uscita per l'operatore quando un rinvio è stato bloccato da un'esecuzione di task incagliata e `--safe` da solo può essere limitato da `gateway.reload.deferralTimeoutMs`. `--skip-deferral` richiede `--safe`.

<Warning>
`--password` inline può essere esposta negli elenchi dei processi locali. Preferisci `--password-file`, env o una `gateway.auth.password` basata su SecretRef.
</Warning>

### Profilazione del Gateway

- Imposta `OPENCLAW_GATEWAY_STARTUP_TRACE=1` per registrare i tempi delle fasi durante l'avvio del Gateway, incluso il ritardo `eventLoopMax` per fase e i tempi delle tabelle di lookup dei Plugin per indice installato, registro manifest, pianificazione di avvio e lavoro owner-map.
- Imposta `OPENCLAW_GATEWAY_RESTART_TRACE=1` per registrare righe `restart trace:` con ambito di riavvio per gestione del segnale di riavvio, svuotamento del lavoro attivo, fasi di shutdown, avvio successivo, tempi di ready e metriche di memoria.
- Imposta `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` per scrivere una timeline diagnostica di avvio JSONL best-effort per harness QA esterni. Puoi anche abilitare il flag con `diagnostics.flags: ["timeline"]` nella configurazione; il percorso è comunque fornito tramite env. Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni dell'event loop.
- Esegui prima `pnpm build`, poi `pnpm test:startup:gateway -- --runs 5 --warmup 1` per fare benchmark dell'avvio del Gateway rispetto all'entry CLI compilata. Il benchmark registra il primo output del processo, `/healthz`, `/readyz`, tempi della traccia di avvio, ritardo dell'event loop e dettagli sui tempi delle tabelle di lookup dei Plugin.
- Esegui prima `pnpm build`, poi `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` per fare benchmark del riavvio in-process del Gateway rispetto all'entry CLI compilata su macOS o Linux. Il benchmark di riavvio usa SIGUSR1, abilita sia le tracce di avvio sia quelle di riavvio nel processo figlio e registra il successivo `/healthz`, il successivo `/readyz`, downtime, tempi di ready, CPU, RSS e metriche della traccia di riavvio.
- Considera `/healthz` come liveness e `/readyz` come readiness utilizzabile. Le righe di traccia e l'output del benchmark servono per l'attribuzione al proprietario; non considerare un singolo span di traccia o un singolo campione come una conclusione completa sulle prestazioni.

## Interrogare un Gateway in esecuzione

Tutti i comandi di query usano WebSocket RPC.

<Tabs>
  <Tab title="Modalità di output">
    - Predefinita: leggibile da persone (colorata in TTY).
    - `--json`: JSON leggibile da macchine (senza stile/spinner).
    - `--no-color` (o `NO_COLOR=1`): disabilita ANSI mantenendo il layout umano.

  </Tab>
  <Tab title="Opzioni condivise">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/budget (varia per comando).
    - `--expect-final`: attendi una risposta "final" (chiamate agent).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non fa fallback alle credenziali di configurazione o ambiente. Passa esplicitamente `--token` o `--password`. La mancanza di credenziali esplicite è un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

L'endpoint HTTP `/healthz` è una sonda di liveness: restituisce quando il server può rispondere via HTTP. L'endpoint HTTP `/readyz` è più rigoroso e rimane rosso mentre sidecar dei Plugin di avvio, canali o hook configurati si stanno ancora assestando. Le risposte dettagliate di readiness locali o autenticate includono un blocco diagnostico `eventLoop` con ritardo dell'event loop, utilizzo dell'event loop, rapporto dei core CPU e un flag `degraded`.

<ParamField path="--port <port>" type="number">
  Indirizza un Gateway local loopback su questa porta. Questo sovrascrive `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT` per la chiamata di health.
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
  Limita il riepilogo dei costi a un singolo id agent configurato.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggrega il riepilogo dei costi su tutti gli agent configurati. Non può essere combinato con `--agent`.
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
  Filtra per tipo di evento diagnostico, come `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Includi solo eventi dopo un numero di sequenza diagnostico.
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
    - I record conservano metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, id di approvazione, nomi di canali/Plugin e riepiloghi di sessione redatti. Non conservano testo delle chat, body dei Webhook, output degli strumenti, body raw di richieste o risposte, token, cookie, valori segreti, hostname o id raw di sessione. Imposta `diagnostics.enabled: false` per disabilitare completamente il recorder.
    - Su uscite fatali del Gateway, timeout di shutdown e fallimenti di avvio del riavvio, OpenClaw scrive lo stesso snapshot diagnostico in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il recorder contiene eventi. Ispeziona il bundle più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output del bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive uno zip diagnostico locale progettato per essere allegato a segnalazioni di bug. Per il modello di privacy e i contenuti del bundle, vedi [Esportazione diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso dello zip di output. Il valore predefinito e' un'esportazione per il supporto nella directory di stato.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Numero massimo di righe di log sanificate da includere.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Numero massimo di byte di log da ispezionare.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway per lo snapshot di integrita'.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway per lo snapshot di integrita'.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway per lo snapshot di integrita'.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout dello snapshot di stato/integrita'.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Salta la ricerca del bundle di stabilita' persistito.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa il percorso scritto, la dimensione e il manifesto come JSON.
</ParamField>

L'esportazione contiene un manifesto, un riepilogo Markdown, la forma della configurazione, dettagli di configurazione sanificati, riepiloghi di log sanificati, snapshot sanificati di stato/integrita' del Gateway e il bundle di stabilita' piu' recente, quando esiste.

E' pensata per essere condivisa. Mantiene dettagli operativi utili al debug, come campi di log OpenClaw sicuri, nomi dei sottosistemi, codici di stato, durate, modalita' configurate, porte, ID dei plugin, ID dei provider, impostazioni di funzionalita' non segrete e messaggi di log operativi redatti. Omette o redige testo delle chat, corpi dei webhook, output degli strumenti, credenziali, cookie, identificatori di account/messaggio, testo di prompt/istruzioni, nomi host e valori segreti. Quando un messaggio in stile LogTape sembra testo di payload utente/chat/strumento, l'esportazione conserva solo l'indicazione che un messaggio e' stato omesso piu' il relativo conteggio di byte.

### `gateway status`

`gateway status` mostra il servizio Gateway (launchd/systemd/schtasks) piu' una verifica facoltativa della capacita' di connettivita'/autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge una destinazione di verifica esplicita. La remota configurata + localhost vengono comunque verificate.
</ParamField>
<ParamField path="--token <token>" type="string">
  Autenticazione tramite token per la verifica.
</ParamField>
<ParamField path="--password <password>" type="string">
  Autenticazione tramite password per la verifica.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Timeout della verifica.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Salta la verifica della connettivita' (vista solo del servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Scansiona anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Aggiorna la verifica di connettivita' predefinita a una verifica di lettura ed esce con codice diverso da zero quando tale verifica di lettura non riesce. Non puo' essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - `gateway status` resta disponibile per la diagnostica anche quando la configurazione CLI locale e' mancante o non valida.
    - `gateway status` predefinito prova lo stato del servizio, la connessione WebSocket e la capacita' di autenticazione visibile al momento dell'handshake. Non prova operazioni di lettura/scrittura/amministrazione.
    - Le verifiche diagnostiche non modificano nulla per l'autenticazione iniziale del dispositivo: riutilizzano un token dispositivo esistente nella cache quando esiste, ma non creano una nuova identita' dispositivo CLI o un record di associazione dispositivo in sola lettura solo per controllare lo stato.
    - `gateway status` risolve i SecretRef di autenticazione configurati per l'autenticazione della verifica quando possibile.
    - Se in questo percorso di comando un SecretRef di autenticazione richiesto non viene risolto, `gateway status --json` riporta `rpc.authWarning` quando la connettivita'/autenticazione della verifica non riesce; passa `--token`/`--password` esplicitamente o risolvi prima l'origine del segreto.
    - Se la verifica riesce, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
    - Quando la verifica e' abilitata, l'output JSON include `gateway.version` quando il Gateway in esecuzione lo riporta; `--require-rpc` puo' usare come fallback il payload RPC `status.runtimeVersion` se la verifica handshake successiva non puo' fornire metadati di versione.
    - Usa `--require-rpc` negli script e nelle automazioni quando un servizio in ascolto non basta e ti serve che anche le chiamate RPC con ambito di lettura siano integre.
    - `--deep` aggiunge una scansione best-effort per installazioni launchd/systemd/schtasks aggiuntive. Quando vengono rilevati piu' servizi simili a gateway, l'output per utenti stampa suggerimenti di pulizia e avvisa che la maggior parte delle configurazioni dovrebbe eseguire un gateway per macchina.
    - `--deep` riporta anche un recente passaggio di riavvio del supervisore Gateway quando il processo del servizio e' uscito correttamente per un riavvio di supervisore esterno.
    - `--deep` esegue la convalida della configurazione in modalita' consapevole dei plugin (`pluginValidation: "full"`) e mostra avvisi del manifesto dei plugin configurati (per esempio metadati di configurazione canale mancanti) in modo che i controlli smoke di installazione e aggiornamento li intercettino. `gateway status` predefinito mantiene il percorso veloce in sola lettura che salta la convalida dei plugin.
    - L'output per utenti include il percorso del file di log risolto piu' lo snapshot dei percorsi/validita' della configurazione CLI-vs-servizio per aiutare a diagnosticare derive di profilo o directory di stato.

  </Accordion>
  <Accordion title="Controlli di deriva dell'autenticazione systemd su Linux">
    - Nelle installazioni systemd su Linux, i controlli di deriva dell'autenticazione del servizio leggono sia i valori `Environment=` sia `EnvironmentFile=` dall'unita' (inclusi `%h`, percorsi tra virgolette, piu' file e file facoltativi con `-`).
    - I controlli di deriva risolvono i SecretRef `gateway.auth.token` usando l'ambiente runtime unito (prima l'ambiente del comando del servizio, poi il fallback sull'ambiente del processo).
    - Se l'autenticazione tramite token non e' effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalita' non impostata dove la password puo' prevalere e nessun candidato token puo' prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` e' il comando "esegui il debug di tutto". Verifica sempre:

- il gateway remoto configurato (se impostato), e
- localhost (local loopback) **anche se il remoto e' configurato**.

Se passi `--url`, quella destinazione esplicita viene aggiunta prima di entrambe. L'output per utenti etichetta le destinazioni come:

- `URL (explicit)`
- `Remote (configured)` oppure `Remote (configured, inactive)`
- `Local loopback`

<Note>
Se piu' destinazioni di verifica sono raggiungibili, le stampa tutte. Un tunnel SSH, un URL TLS/proxy e un URL remoto configurato possono puntare tutti allo stesso gateway anche quando le loro porte di trasporto differiscono; `multiple_gateways` e' riservato a gateway raggiungibili distinti o con identita' ambigua. Piu' gateway sono supportati quando usi profili isolati (per esempio, un bot di soccorso), ma la maggior parte delle installazioni esegue comunque un solo gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa questa porta per la destinazione di verifica local loopback e la porta remota del tunnel SSH. Senza `--url`, seleziona la destinazione local loopback invece dell'URL dell'ambiente gateway configurato, della porta dell'ambiente o delle destinazioni remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Reachable: yes` significa che almeno una destinazione ha accettato una connessione WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` riporta cio' che la verifica ha potuto provare sull'autenticazione. E' separata dalla raggiungibilita'.
    - `Read probe: ok` significa che sono riuscite anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`).
    - `Read probe: limited - missing scope: operator.read` significa che la connessione e' riuscita ma l'RPC con ambito di lettura e' limitato. Questo viene riportato come raggiungibilita' **degradata**, non come errore completo.
    - `Read probe: failed` dopo `Connect: ok` significa che il Gateway ha accettato la connessione WebSocket, ma la diagnostica di lettura successiva e' scaduta o non e' riuscita. Anche questa e' raggiungibilita' **degradata**, non un Gateway irraggiungibile.
    - Come `gateway status`, probe riutilizza l'autenticazione dispositivo esistente nella cache ma non crea identita' dispositivo iniziale o stato di associazione.
    - Il codice di uscita e' diverso da zero solo quando nessuna destinazione verificata e' raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno una destinazione e' raggiungibile.
    - `degraded`: almeno una destinazione ha accettato una connessione ma non ha completato l'intera diagnostica RPC di dettaglio.
    - `capability`: migliore capacita' vista tra le destinazioni raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: migliore destinazione da trattare come vincitrice attiva in questo ordine: URL esplicito, tunnel SSH, remoto configurato, poi local loopback.
    - `warnings[]`: record di avviso best-effort con `code`, `message` e `targetIds` facoltativi.
    - `network`: suggerimenti URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete host.
    - `discovery.timeoutMs` e `discovery.count`: budget di discovery effettivo/conteggio risultati usato per questo passaggio di verifica.

    Per destinazione (`targets[].connect`):

    - `ok`: raggiungibilita' dopo connessione + classificazione degradata.
    - `rpcOk`: successo completo dell'RPC di dettaglio.
    - `scopeLimited`: RPC di dettaglio non riuscito a causa dell'ambito operatore mancante.

    Per destinazione (`targets[].auth`):

    - `role`: ruolo di autenticazione riportato in `hello-ok` quando disponibile.
    - `scopes`: ambiti concessi riportati in `hello-ok` quando disponibili.
    - `capability`: classificazione della capacita' di autenticazione esposta per quella destinazione.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: configurazione del tunnel SSH non riuscita; il comando e' tornato alle verifiche dirette.
    - `multiple_gateways`: erano raggiungibili identita' gateway distinte, oppure OpenClaw non ha potuto provare che le destinazioni raggiungibili siano lo stesso gateway. Un tunnel SSH, URL proxy o URL remoto configurato verso lo stesso gateway non attiva questo avviso.
    - `auth_secretref_unresolved`: un SecretRef di autenticazione configurato non ha potuto essere risolto per una destinazione non riuscita.
    - `probe_scope_limited`: la connessione WebSocket e' riuscita, ma la verifica di lettura e' stata limitata dall'assenza di `operator.read`.

  </Accordion>
</AccordionGroup>

#### Remoto tramite SSH (parita' con app Mac)

La modalita' "Remote over SSH" dell'app macOS usa un port-forward locale in modo che il gateway remoto (che puo' essere associato solo a loopback) diventi raggiungibile a `ws://127.0.0.1:<port>`.

Equivalente CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` o `user@host:port` (la porta predefinita e' `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  File di identita'.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Sceglie il primo host gateway individuato come destinazione SSH dall'endpoint di discovery risolto (`local.` piu' il dominio wide-area configurato, se presente). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Configurazione (facoltativa, usata come valori predefiniti):

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

Usa `--wrapper` quando il servizio gestito deve avviarsi tramite un altro eseguibile, ad esempio uno shim per il gestore dei segreti o un helper run-as. Il wrapper riceve i normali argomenti del Gateway ed è responsabile di eseguire infine `openclaw` o Node con quegli argomenti.

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

Puoi anche impostare il wrapper tramite l'ambiente. `gateway install` verifica che il percorso sia un file eseguibile, scrive il wrapper in `ProgramArguments` del servizio e mantiene `OPENCLAW_WRAPPER` nell'ambiente del servizio per reinstallazioni forzate, aggiornamenti e riparazioni con doctor successive.

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
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamento del ciclo di vita">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come sostituto del riavvio.
    - Su macOS, `gateway stop` usa `launchctl bootout` per impostazione predefinita, che rimuove il LaunchAgent dalla sessione di avvio corrente senza mantenere una disabilitazione: il ripristino automatico KeepAlive resta attivo per crash futuri e `gateway start` riabilita tutto in modo pulito senza un `launchctl enable` manuale. Passa `--disable` per sopprimere in modo persistente KeepAlive e RunAtLoad, così il Gateway non si riavvia fino al successivo `gateway start` esplicito; usalo quando un arresto manuale deve sopravvivere a riavvii o riavvii di sistema.
    - `gateway restart --safe` chiede al Gateway in esecuzione di verificare preventivamente il lavoro attivo e pianificare un unico riavvio coalescente dopo lo svuotamento del lavoro attivo. Il riavvio sicuro predefinito attende il lavoro attivo fino al valore configurato di `gateway.reload.deferralTimeoutMs` (predefinito 5 minuti); allo scadere di quel budget il riavvio viene forzato. Imposta `gateway.reload.deferralTimeoutMs` su `0` per un'attesa sicura indefinita che non forza mai. `--safe` non può essere combinato con `--force` o `--wait`.
    - `gateway restart --wait 30s` sovrascrive il budget di svuotamento configurato per quel riavvio. I numeri senza unità sono millisecondi; sono accettate unità come `s`, `m` e `h`. `--wait 0` attende indefinitamente.
    - `gateway restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma aggira il gate di differimento, così il Gateway emette immediatamente il riavvio anche quando vengono segnalati blocchi. È una via di fuga per l'operatore in caso di differimenti bloccati da task-run; richiede `--safe`.
    - `gateway restart --force` salta lo svuotamento del lavoro attivo e riavvia immediatamente. Usalo quando un operatore ha già ispezionato i blocchi dei task elencati e vuole ripristinare subito il Gateway.
    - I comandi del ciclo di vita accettano `--json` per lo scripting.

  </Accordion>
  <Accordion title="Auth e SecretRefs al momento dell'installazione">
    - Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `gateway install` verifica che il SecretRef sia risolvibile ma non mantiene il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso invece di mantenere testo normale di fallback.
    - Per l'autenticazione tramite password su `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` inline.
    - In modalità auth inferita, `OPENCLAW_GATEWAY_PASSWORD` solo shell non allenta i requisiti del token di installazione; usa una configurazione durevole (`gateway.auth.password` o `env` di configurazione) quando installi un servizio gestito.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.

  </Accordion>
</AccordionGroup>

## Scoprire i Gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon del Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): scegli un dominio (esempio: `openclaw.internal.`) e configura split DNS + un server DNS; consulta [Bonjour](/it/gateway/bonjour).

Solo i Gateway con discovery Bonjour abilitata (predefinita) pubblicizzano il beacon.

I record di discovery wide-area possono includere questi suggerimenti TXT:

- `role` (suggerimento sul ruolo del Gateway)
- `transport` (suggerimento sul trasporto, ad es. `gateway`)
- `gatewayPort` (porta WebSocket, di solito `18789`)
- `sshPort` (solo modalità discovery completa; i client usano come destinazioni SSH predefinite `22` quando è assente)
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
- `wsUrl` nell'output JSON deriva dall'endpoint del servizio risolto, non da suggerimenti solo TXT come `lanHost` o `tailnetDns`.
- Su mDNS `local.` e DNS-SD wide-area, `sshPort` e `cliPath` vengono pubblicati solo quando `discovery.mdns.mode` è `full`.

</Note>

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
