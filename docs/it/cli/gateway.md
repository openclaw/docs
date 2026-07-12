---
read_when:
    - Esecuzione del Gateway dalla CLI (sviluppo o server)
    - Debug dell'autenticazione del Gateway, delle modalità di binding e della connettività
    - Rilevamento dei gateway tramite Bonjour (DNS-SD locale e geografico)
sidebarTitle: Gateway
summary: CLI del Gateway OpenClaw (`openclaw gateway`) — esegui, interroga e rileva i gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-12T06:56:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Il Gateway è il server WebSocket di OpenClaw (canali, nodi, sessioni, hook). Tutti i sottocomandi seguenti sono disponibili in `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Rilevamento Bonjour" href="/it/gateway/bonjour">
    Configurazione mDNS locale + DNS-SD su rete geografica.
  </Card>
  <Card title="Panoramica del rilevamento" href="/it/gateway/discovery">
    Come OpenClaw pubblicizza e rileva i gateway.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration">
    Chiavi di configurazione di primo livello del gateway.
  </Card>
</CardGroup>

## Eseguire il Gateway

```bash
openclaw gateway
openclaw gateway run   # forma equivalente ed esplicita
```

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    - Rifiuta di avviarsi a meno che `gateway.mode=local` non sia impostato in `~/.openclaw/openclaw.json`. Usa `--allow-unconfigured` per esecuzioni ad hoc/di sviluppo; l'opzione ignora il controllo senza scrivere né riparare la configurazione.
    - `openclaw onboard --mode local` e `openclaw setup` scrivono `gateway.mode=local`. Se il file di configurazione esiste ma `gateway.mode` è assente, la configurazione viene considerata danneggiata o sovrascritta e il Gateway rifiuta di presumere `local`: esegui nuovamente l'onboarding, imposta manualmente la chiave oppure passa `--allow-unconfigured`.
    - L'associazione a interfacce diverse da local loopback senza autenticazione viene bloccata.
    - Attualmente i valori `lan`, `tailnet` e `custom` di `--bind` vengono risolti esclusivamente tramite percorsi IPv4; le configurazioni con host personalizzato esclusivamente IPv6 richiedono un sidecar IPv4 o un proxy davanti al Gateway.
    - `SIGUSR1` attiva un riavvio interno al processo quando autorizzato. `commands.restart` (predefinito: abilitato) controlla i segnali `SIGUSR1` inviati dall'esterno; impostalo su `false` per bloccare i riavvii manuali tramite segnale del sistema operativo, continuando a consentire il riavvio tramite il comando `gateway restart`, lo strumento gateway e l'applicazione o l'aggiornamento della configurazione.
    - `SIGINT`/`SIGTERM` arrestano il processo ma non ripristinano lo stato personalizzato del terminale: se incorpori la CLI in una TUI o usi un input in modalità raw, ripristina autonomamente il terminale prima dell'uscita.

  </Accordion>
</AccordionGroup>

### Opzioni

<ParamField path="--port <port>" type="number">
  Porta WebSocket (valore predefinito da configurazione/ambiente; solitamente `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Modalità di associazione: `loopback` (predefinita), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token condiviso per `connect.params.auth.token`. Il valore predefinito è `OPENCLAW_GATEWAY_TOKEN`, se impostato.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Modalità di autenticazione: `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password per `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Legge la password del Gateway da un file.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Esposizione tramite Tailscale: `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Reimposta la configurazione serve/funnel di Tailscale all'arresto.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Avvia senza imporre `gateway.mode=local`. Solo per bootstrap ad hoc/di sviluppo; non rende persistente né ripara la configurazione.
</ParamField>
<ParamField path="--dev" type="boolean">
  Crea una configurazione e un'area di lavoro di sviluppo, se assenti (ignora `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Reimposta configurazione di sviluppo, credenziali, sessioni e area di lavoro. Richiede `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Termina qualsiasi listener esistente sulla porta di destinazione prima dell'avvio.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Registrazione dettagliata su stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Mostra nella console solo i log del backend della CLI (abilita anche stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Stile dei log WebSocket: `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias di `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Registra in JSONL gli eventi raw del flusso del modello.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Percorso JSONL del flusso raw.
</ParamField>

`--claude-cli-logs` è un alias deprecato di `--cli-backend-logs`.

Per `--bind custom`, imposta `gateway.customBindHost` su un indirizzo IPv4. Qualsiasi indirizzo diverso da `127.0.0.1` o `0.0.0.0` richiede anche `127.0.0.1` sulla stessa porta per i client sullo stesso host; l'avvio non riesce se uno dei due listener non può effettuare l'associazione. Il carattere jolly `0.0.0.0` non aggiunge un alias obbligatorio separato. Le configurazioni con host personalizzato esclusivamente IPv6 richiedono un sidecar IPv4 o un proxy davanti al Gateway.

## Riavviare il Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` richiede al Gateway in esecuzione di verificare preliminarmente le attività attive e pianificare un unico riavvio accorpato dopo il loro completamento. L'attesa è limitata da `gateway.reload.deferralTimeoutMs` (valore predefinito: 5 minuti / `300000`); allo scadere del limite, il riavvio viene forzato. Imposta `deferralTimeoutMs: 0` per attendere indefinitamente, con avvisi periodici sulle attività ancora in sospeso, anziché forzare il riavvio. `--safe` non può essere combinato con `--force` o `--wait`.

`--skip-deferral` ignora il controllo di rinvio basato sulle attività attive durante un riavvio sicuro, pertanto il Gateway si riavvia immediatamente anche in presenza di impedimenti segnalati. Richiede `--safe`: usalo quando un rinvio è bloccato da un'attività fuori controllo.

`--wait <duration>` sostituisce il limite di attesa per il completamento delle attività durante un normale riavvio non sicuro. Accetta millisecondi senza suffisso oppure i suffissi di unità `ms`, `s`, `m`, `h`, `d` (ad esempio `30s`, `5m`, `1h30m`); `--wait 0` attende indefinitamente. Non è compatibile con `--force` o `--safe`.

`--force` ignora l'attesa per il completamento delle attività attive e riavvia immediatamente. Il semplice comando `restart` (senza opzioni) mantiene il comportamento di riavvio esistente del gestore dei servizi.

<Warning>
L'uso diretto di `--password` può esporre la password negli elenchi dei processi locali. Preferisci `--password-file`, una variabile d'ambiente oppure un valore `gateway.auth.password` basato su SecretRef.
</Warning>

### Profilazione del Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` registra le durate delle fasi durante l'avvio, inclusi il ritardo `eventLoopMax` per ciascuna fase e le durate delle tabelle di ricerca dei plugin (indice delle installazioni, registro dei manifest, pianificazione dell'avvio, elaborazione della mappa dei proprietari).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` registra righe `restart trace:` relative al riavvio: gestione dei segnali, attesa per il completamento delle attività attive, fasi di arresto, avvio successivo, tempo necessario per essere pronto e metriche della memoria.
- `OPENCLAW_DIAGNOSTICS=timeline` con `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` scrive, secondo il principio del massimo sforzo, una cronologia diagnostica JSONL dell'avvio destinata a sistemi QA esterni (equivalente alla configurazione `diagnostics.flags: ["timeline"]`; il percorso resta configurabile solo tramite ambiente). Aggiungi `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` per includere campioni del ciclo degli eventi.
- `pnpm build` seguito da `pnpm test:startup:gateway -- --runs 5 --warmup 1` misura le prestazioni di avvio del Gateway rispetto al punto di ingresso della CLI compilata: primo output del processo, `/healthz`, `/readyz`, durate della traccia di avvio, ritardo del ciclo degli eventi e durata delle tabelle di ricerca dei plugin.
- `pnpm build` seguito da `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` misura le prestazioni del riavvio interno al processo su macOS o Linux (non supportato su Windows; il riavvio richiede `SIGUSR1`). Usa `SIGUSR1`, abilita entrambe le tracce nel processo figlio e registra le successive risposte di `/healthz` e `/readyz`, il periodo di indisponibilità, il tempo necessario per essere pronto, CPU, RSS e le metriche della traccia di riavvio.
- `/healthz` indica che il servizio è attivo; `/readyz` indica che è pronto per l'uso. Considera le righe di traccia e l'output dei benchmark come segnali per attribuire la responsabilità ai componenti, non come una conclusione completa sulle prestazioni basata su un singolo intervallo o campione.

## Interrogare un Gateway in esecuzione

Tutti i comandi di interrogazione usano RPC tramite WebSocket.

<Tabs>
  <Tab title="Modalità di output">
    - Predefinita: leggibile dall'utente (a colori in una TTY).
    - `--json`: JSON leggibile dalla macchina (senza stile o indicatore di attività).
    - `--no-color` (oppure `NO_COLOR=1`): disabilita ANSI mantenendo il formato leggibile dall'utente.

  </Tab>
  <Tab title="Opzioni condivise">
    - `--url <url>`: URL WebSocket del Gateway.
    - `--token <token>`: token del Gateway.
    - `--password <password>`: password del Gateway.
    - `--timeout <ms>`: timeout/limite temporale (il valore predefinito varia in base al comando; consulta ciascun comando di seguito).
    - `--expect-final`: attende una risposta "finale" (chiamate dell'agente).

  </Tab>
</Tabs>

<Note>
Quando imposti `--url`, la CLI non usa come ripiego le credenziali della configurazione o dell'ambiente. Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite costituisce un errore.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` è una verifica dell'attività: restituisce una risposta non appena il server è in grado di rispondere tramite HTTP. `/readyz` è più rigoroso e resta in stato di errore mentre i sidecar dei plugin di avvio, i canali o gli hook configurati sono ancora in fase di inizializzazione. Le risposte dettagliate locali o autenticate di `/readyz` includono un blocco diagnostico `eventLoop` (ritardo, utilizzo, rapporto rispetto ai core della CPU, indicatore `degraded`).

<ParamField path="--port <port>" type="number">
  Seleziona un Gateway local loopback su questa porta. Per questa chiamata, sostituisce `OPENCLAW_GATEWAY_URL` e `OPENCLAW_GATEWAY_PORT`.
</ParamField>

### `gateway usage-cost`

Recupera i riepiloghi dei costi di utilizzo dai log delle sessioni.

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
  Limita il riepilogo all'ID di un singolo agente configurato.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Aggrega i dati di tutti gli agenti configurati. Non può essere combinato con `--agent`.
</ParamField>

### `gateway stability`

Recupera le registrazioni diagnostiche recenti sulla stabilità da un Gateway in esecuzione.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Numero massimo di eventi recenti da includere (massimo `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtra per tipo di evento diagnostico, ad esempio `payload.large` o `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Include solo gli eventi successivi a un numero di sequenza diagnostica.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Legge un pacchetto di stabilità persistente anziché chiamare il Gateway in esecuzione. `--bundle latest` (o il solo `--bundle`) seleziona il pacchetto più recente nella directory di stato; puoi anche passare direttamente il percorso di un pacchetto JSON.
</ParamField>
<ParamField path="--export" type="boolean">
  Scrive un archivio ZIP condivisibile con la diagnostica per l'assistenza anziché stampare i dettagli sulla stabilità.
</ParamField>
<ParamField path="--output <path>" type="string">
  Percorso di output per `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy e comportamento dei pacchetti">
    - Le registrazioni conservano metadati operativi: nomi degli eventi, conteggi, dimensioni in byte, rilevazioni della memoria, stato delle code e delle sessioni, ID delle approvazioni, nomi di canali e plugin e riepiloghi anonimizzati delle sessioni. Escludono testo delle chat, corpi dei webhook, output degli strumenti, corpi raw delle richieste e delle risposte, token, cookie, valori segreti, nomi host e ID raw delle sessioni. Imposta `diagnostics.enabled: false` per disabilitare completamente il registratore.
    - Le uscite irreversibili del Gateway, i timeout di arresto e gli errori di avvio durante un riavvio scrivono la stessa istantanea diagnostica in `~/.openclaw/logs/stability/openclaw-stability-*.json` quando il registratore contiene eventi. Esamina il pacchetto più recente con `openclaw gateway stability --bundle latest`; `--limit`, `--type` e `--since-seq` si applicano anche all'output dei pacchetti.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Scrive un archivio ZIP locale con la diagnostica, progettato per le segnalazioni di bug. Per il modello di privacy e il contenuto del pacchetto, consulta [Esportazione della diagnostica](/it/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Percorso del file zip di output. Per impostazione predefinita, viene usata un'esportazione per l'assistenza nella directory di stato.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Numero massimo di righe di log sanificate da includere.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Numero massimo di byte di log da esaminare.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket del Gateway per l'istantanea dello stato di integrità.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token del Gateway per l'istantanea dello stato di integrità.
</ParamField>
<ParamField path="--password <password>" type="string">
  Password del Gateway per l'istantanea dello stato di integrità.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Timeout dell'istantanea di stato/integrità.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignora la ricerca del pacchetto di stabilità persistente.
</ParamField>
<ParamField path="--json" type="boolean">
  Stampa in formato JSON il percorso scritto, le dimensioni e il manifesto.
</ParamField>

L'esportazione raggruppa: `manifest.json` (inventario dei file), `summary.md` (riepilogo Markdown), `diagnostics.json` (riepilogo di primo livello di configurazione/log/rilevamento/stabilità/stato/integrità), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` e `stability/latest.json` quando esiste un pacchetto.

È progettata per essere condivisa. Mantiene i dettagli operativi utili per il debug — campi di log sicuri, nomi dei sottosistemi, codici di stato, durate, modalità configurate, porte, ID di plugin/provider, impostazioni non segrete delle funzionalità e messaggi operativi di log oscurati — e omette o oscura il testo delle chat, i corpi dei webhook, gli output degli strumenti, le credenziali, i cookie, gli identificatori di account/messaggi, il testo di prompt/istruzioni, i nomi host e i valori segreti. Quando un messaggio di log sembra contenere il testo di un payload utente/chat/strumento (ad es. "l'utente ha detto", "testo della chat", "output dello strumento", "corpo del webhook"), l'esportazione conserva solo l'indicazione che un messaggio è stato omesso e il relativo numero di byte.

### `gateway status`

Mostra il servizio Gateway (launchd/systemd/schtasks) insieme a una verifica facoltativa di connettività/autenticazione.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Aggiunge una destinazione di verifica esplicita. La destinazione remota configurata e localhost vengono comunque verificati.
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
  Salta la verifica della connettività (visualizzazione del solo servizio).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analizza anche i servizi a livello di sistema.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Estende la verifica della connettività a una verifica di lettura e termina con un codice diverso da zero in caso di errore. Non può essere combinato con `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Semantica dello stato">
    - Rimane disponibile per la diagnostica anche quando la configurazione CLI locale è mancante o non valida.
    - L'output predefinito verifica lo stato del servizio, la connessione WebSocket e la capacità di autenticazione visibile durante l'handshake, non le operazioni di lettura/scrittura/amministrazione.
    - Le verifiche non apportano modifiche all'autenticazione iniziale del dispositivo: riutilizzano un token del dispositivo già memorizzato nella cache, se presente, ma non creano mai una nuova identità CLI del dispositivo o un record di associazione in sola lettura al solo scopo di controllare lo stato.
    - Quando possibile, risolve i SecretRef di autenticazione configurati per autenticare la verifica. Se un SecretRef obbligatorio non viene risolto, `--json` segnala `rpc.authWarning` quando la connettività/autenticazione della verifica non riesce; passa esplicitamente `--token`/`--password` oppure correggi l'origine del segreto. Gli avvisi relativi all'autenticazione non risolta vengono soppressi quando la verifica riesce.
    - L'output JSON include `gateway.version` quando il Gateway in esecuzione lo segnala; `--require-rpc` può ricorrere al payload RPC `status.runtimeVersion` se la verifica dell'handshake non riesce a fornire i metadati della versione.
    - Usa `--require-rpc` negli script e nelle automazioni quando un servizio in ascolto non è sufficiente ed è necessario che anche l'RPC con ambito di lettura sia operativo.
    - `--deep` cerca installazioni launchd/systemd/schtasks aggiuntive; quando vengono trovati più servizi simili a Gateway, l'output leggibile mostra suggerimenti per la pulizia (in genere, eseguire un solo Gateway per macchina) e segnala, quando pertinente, un recente passaggio di consegne dovuto al riavvio del supervisore.
    - `--deep` esegue inoltre la convalida della configurazione in modalità consapevole dei Plugin (`pluginValidation: "full"`) e mostra gli avvisi del manifesto dei Plugin (ad es. metadati mancanti della configurazione del canale). Il comando predefinito `gateway status` mantiene il rapido percorso in sola lettura che salta la convalida dei Plugin.
    - L'output leggibile include il percorso risolto del file di log, oltre ai percorsi e alla validità delle configurazioni della CLI e del servizio, per facilitare la diagnosi delle divergenze del profilo o della directory di stato.

  </Accordion>
  <Accordion title="Controlli della divergenza dell'autenticazione di systemd su Linux">
    - I controlli della divergenza dell'autenticazione del servizio leggono sia `Environment=` sia `EnvironmentFile=` dall'unità (inclusi `%h`, percorsi tra virgolette, più file e file facoltativi con `-`).
    - Risolve i SecretRef di `gateway.auth.token` usando l'ambiente di runtime unificato (prima l'ambiente del comando del servizio, quindi l'ambiente del processo come ripiego).
    - I controlli della divergenza del token saltano la risoluzione del token di configurazione quando l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` impostato esplicitamente su `password`/`none`/`trusted-proxy`, oppure modalità non impostata quando la password può avere la precedenza e nessun token candidato può prevalere).

  </Accordion>
</AccordionGroup>

### `gateway probe`

Il comando per il "debug completo". Verifica sempre:

- il Gateway remoto configurato (se impostato) e
- localhost (local loopback), **anche se è configurato un endpoint remoto**.

Passare `--url` aggiunge tale destinazione esplicita prima di entrambe. L'output leggibile etichetta le destinazioni come `URL (esplicito)`, `Remoto (configurato)` / `Remoto (configurato, inattivo)` e `Local loopback`.

<Note>
Se sono raggiungibili più destinazioni di verifica, vengono stampate tutte. Un tunnel SSH, un URL TLS/proxy e un URL remoto configurato possono puntare allo stesso Gateway anche con porte di trasporto diverse; `multiple_gateways` è riservato a Gateway raggiungibili distinti o con identità ambigua. L'esecuzione di più Gateway è supportata per profili isolati (ad es. un bot di recupero), ma la maggior parte delle installazioni esegue un solo Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Usa questa porta per la destinazione di verifica local loopback e come porta remota del tunnel SSH. Senza `--url`, seleziona solo la destinazione local loopback invece dell'URL dell'ambiente Gateway configurato, della porta dell'ambiente o delle destinazioni remote.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretazione">
    - `Raggiungibile: sì` significa che almeno una destinazione ha accettato una connessione WebSocket.
    - `Capacità: sola lettura|con possibilità di scrittura|con possibilità di amministrazione|associazione in sospeso|sola connessione` indica ciò che la verifica ha potuto accertare sull'autenticazione, separatamente dalla raggiungibilità.
    - `Verifica di lettura: riuscita` significa che anche le chiamate RPC di dettaglio con ambito di lettura (`health`/`status`/`system-presence`/`config.get`) sono riuscite.
    - `Verifica di lettura: limitata - ambito mancante: operator.read` significa che la connessione è riuscita, ma l'RPC con ambito di lettura è limitato. Viene segnalata come raggiungibilità **degradata**, non come errore completo.
    - `Verifica di lettura: non riuscita` dopo `Connessione: riuscita` significa che la connessione WebSocket è stata stabilita, ma la diagnostica di lettura successiva è scaduta o non è riuscita; anche in questo caso lo stato è **degradato**, non irraggiungibile.
    - Come `gateway status`, la verifica riutilizza l'autenticazione del dispositivo già memorizzata nella cache, ma non crea l'identità iniziale del dispositivo o lo stato di associazione.
    - Il codice di uscita è diverso da zero solo quando nessuna destinazione verificata è raggiungibile.

  </Accordion>
  <Accordion title="Output JSON">
    Livello superiore:

    - `ok`: almeno una destinazione è raggiungibile.
    - `degraded`: almeno una destinazione ha accettato una connessione, ma non ha completato la diagnostica RPC dettagliata.
    - `capability`: migliore capacità rilevata tra le destinazioni raggiungibili (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` o `unknown`).
    - `primaryTargetId`: migliore destinazione da considerare come quella attiva, nell'ordine: URL esplicito, tunnel SSH, endpoint remoto configurato, local loopback.
    - `warnings[]`: record di avviso ottenuti al meglio delle possibilità, con `code`, `message` e `targetIds` facoltativi.
    - `network`: suggerimenti per gli URL local loopback/tailnet derivati dalla configurazione corrente e dalla rete dell'host.
    - `discovery.timeoutMs` / `discovery.count`: budget di rilevamento effettivo e numero di risultati usati per questa sessione di verifica.

    Per destinazione (`targets[].connect`): `ok` (classificazione di raggiungibilità e degrado), `rpcOk` (successo completo dell'RPC dettagliato), `scopeLimited` (RPC dettagliato non riuscito a causa della mancanza dell'ambito operatore).

    Per destinazione (`targets[].auth`): `role` e `scopes` segnalati in `hello-ok` quando disponibili, oltre alla classificazione `capability` mostrata.

  </Accordion>
  <Accordion title="Codici di avviso comuni">
    - `ssh_tunnel_failed`: la configurazione del tunnel SSH non è riuscita; il comando ha ripiegato sulle verifiche dirette.
    - `multiple_gateways`: erano raggiungibili identità Gateway distinte oppure OpenClaw non ha potuto verificare che le destinazioni raggiungibili fossero lo stesso Gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato verso lo stesso Gateway non attivano questo avviso.
    - `auth_secretref_unresolved`: non è stato possibile risolvere un SecretRef di autenticazione configurato per una destinazione non riuscita.
    - `probe_scope_limited`: la connessione WebSocket è riuscita, ma la verifica di lettura era limitata dalla mancanza di `operator.read`.
    - `local_tls_runtime_unavailable`: TLS del Gateway locale è abilitato, ma OpenClaw non ha potuto caricare l'impronta digitale del certificato locale.

  </Accordion>
</AccordionGroup>

#### Connessione remota tramite SSH (parità con l'app per Mac)

La modalità "Remote over SSH" dell'app macOS usa un inoltro di porta locale affinché un Gateway remoto accessibile solo tramite loopback diventi raggiungibile all'indirizzo `ws://127.0.0.1:<port>`.

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
  Seleziona il primo host Gateway rilevato come destinazione SSH dall'endpoint di rilevamento risolto (`local.` più il dominio geografico configurato, se presente). I suggerimenti solo TXT vengono ignorati.
</ParamField>

Valori predefiniti della configurazione (facoltativi): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Strumento RPC di basso livello.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Stringa contenente un oggetto JSON per i parametri.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Tempo massimo consentito.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalmente per RPC in stile agente che trasmettono eventi intermedi prima di un payload finale.
</ParamField>
<ParamField path="--json" type="boolean">
  Output JSON leggibile dalla macchina.
</ParamField>

<Note>
`--params` deve essere un JSON valido e ogni metodo convalida la propria struttura dei parametri (i campi aggiuntivi o con nomi errati vengono rifiutati).
</Note>

## Gestire il servizio Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Installazione con un wrapper

Usa `--wrapper` quando il servizio gestito deve essere avviato tramite un altro eseguibile, ad esempio uno shim per la gestione dei segreti o uno strumento di esecuzione con un altro utente. Il wrapper riceve i normali argomenti del Gateway ed è responsabile dell'esecuzione finale di `openclaw` o Node con tali argomenti.

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

Puoi anche impostare il wrapper tramite l'ambiente. `gateway install` verifica che il percorso sia un file eseguibile, inserisce il wrapper nei `ProgramArguments` del servizio e rende persistente `OPENCLAW_WRAPPER` nell'ambiente del servizio per successive reinstallazioni forzate, aggiornamenti e riparazioni eseguite da doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Per rimuovere un wrapper persistente, azzera `OPENCLAW_WRAPPER` durante la reinstallazione:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Opzioni dei comandi">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (valore predefinito: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportamento del ciclo di vita">
    - Usa `gateway restart` per riavviare un servizio gestito. Non concatenare `gateway stop` e `gateway start` come alternativa al riavvio.
    - Su macOS, per impostazione predefinita `gateway stop` usa `launchctl bootout`, che rimuove il LaunchAgent dalla sessione di avvio corrente senza rendere persistente la disabilitazione: il ripristino automatico KeepAlive resta attivo per arresti anomali futuri e `gateway start` riabilita correttamente il servizio senza dover eseguire manualmente `launchctl enable`. Passa `--disable` per disattivare in modo persistente KeepAlive e RunAtLoad, impedendo al Gateway di riavviarsi fino alla successiva esecuzione esplicita di `gateway start`; usa questa opzione quando un arresto manuale deve persistere dopo il riavvio del sistema.
    - I comandi del ciclo di vita accettano `--json` per l'uso negli script.

  </Accordion>
  <Accordion title="Autenticazione e SecretRef al momento dell'installazione">
    - Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito tramite SecretRef, `gateway install` verifica che il SecretRef sia risolvibile, ma non rende persistente il token risolto nei metadati dell'ambiente del servizio.
    - Se l'autenticazione tramite token richiede un token e il SecretRef configurato per il token non è risolto, l'installazione si interrompe in modo sicuro anziché rendere persistente un valore di ripiego in testo normale.
    - Per l'autenticazione tramite password con `gateway run`, preferisci `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` o un `gateway.auth.password` basato su SecretRef rispetto a `--password` specificato direttamente.
    - Nella modalità di autenticazione dedotta, `OPENCLAW_GATEWAY_PASSWORD` impostata solo nella shell non attenua i requisiti del token per l'installazione; quando installi un servizio gestito, usa una configurazione persistente (`gateway.auth.password` o `env` nella configurazione).
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene specificata esplicitamente.

  </Accordion>
</AccordionGroup>

## Individuare i Gateway (Bonjour)

`gateway discover` esegue la scansione dei beacon dei Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast: `local.`
- DNS-SD unicast (Bonjour su rete geografica): scegli un dominio (esempio: `openclaw.internal.`) e configura un DNS suddiviso e un server DNS; consulta [Bonjour](/it/gateway/bonjour).

Solo i Gateway con l'individuazione Bonjour abilitata (impostazione predefinita) pubblicizzano il beacon.

Indicazioni TXT presenti in ogni beacon: `role` (indicazione sul ruolo del Gateway), `transport` (indicazione sul trasporto, ad esempio `gateway`), `gatewayPort` (porta WebSocket, solitamente `18789`), `tailnetDns` (nome host MagicDNS, quando disponibile), `gatewayTls` / `gatewayTlsSha256` (TLS abilitato e impronta digitale del certificato). `sshPort` e `cliPath` vengono pubblicati solo nella modalità di individuazione completa (`discovery.mdns.mode: "full"`; il valore predefinito è `"minimal"`, che li omette; in tal caso, i client usano per impostazione predefinita la porta `22` per le destinazioni SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout per comando (esplorazione/risoluzione).
</ParamField>
<ParamField path="--json" type="boolean">
  Output leggibile dalla macchina (disabilita anche lo stile e l'indicatore di attività).
</ParamField>

Esempi:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Esegue la scansione di `local.` e del dominio su rete geografica configurato, se abilitato.
- `wsUrl` nell'output JSON deriva dall'endpoint del servizio risolto, non da indicazioni presenti esclusivamente nei record TXT, come `lanHost` o `tailnetDns`.
- `discovery.mdns.mode` controlla la pubblicazione di `sshPort`/`cliPath` sia per mDNS su `local.` sia per DNS-SD su rete geografica (vedi sopra).

</Note>

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Manuale operativo del Gateway](/it/gateway)
