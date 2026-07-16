---
read_when:
    - L'hub per la risoluzione dei problemi rimanda qui per una diagnosi più approfondita
    - Sono necessarie sezioni stabili del runbook basate sui sintomi, con comandi esatti
sidebarTitle: Troubleshooting
summary: Runbook approfondito per la risoluzione dei problemi di Gateway, canali, automazione, Node e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-07-16T14:27:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Questo è il runbook approfondito. Per prima cosa, iniziare da [/help/risoluzione-dei-problemi](/it/help/troubleshooting) per il flusso di triage rapido.

## Sequenza di comandi

Eseguire nell'ordine seguente:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Segnali di funzionamento corretto:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...`.
- `openclaw doctor` non segnala problemi bloccanti di configurazione o del servizio.
- `openclaw channels status --probe` mostra lo stato in tempo reale del trasporto per ogni account e, dove supportato, `works` o `audit ok`.

## Dopo un aggiornamento

Utilizzare questa procedura quando un aggiornamento è terminato, ma il Gateway non è attivo, i canali sono vuoti oppure le chiamate ai modelli non riescono con errori 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Verificare quanto segue:

- `Update restart` in `openclaw status` / `openclaw status --all`. I passaggi di consegna in sospeso o non riusciti includono il comando successivo da eseguire.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` nella sezione Canali: la configurazione del canale esiste ancora, ma la registrazione del Plugin non è riuscita prima che il canale potesse essere caricato.
- Errori 401 del provider dopo una nuova autenticazione: `openclaw doctor --fix` verifica la presenza di copie obsolete delle credenziali OAuth per singolo agente e le rimuove, affinché tutti gli agenti risolvano il profilo condiviso corrente.

## Installazioni disallineate e protezione dalle configurazioni più recenti

Utilizzare questa procedura quando un servizio Gateway si arresta inaspettatamente dopo un aggiornamento oppure i log mostrano che un file binario `openclaw` è precedente alla versione che ha scritto per ultima `openclaw.json`.

OpenClaw contrassegna le scritture della configurazione con `meta.lastTouchedVersion`. I comandi di sola lettura possono esaminare una configurazione scritta da una versione più recente di OpenClaw, ma le operazioni che modificano processi e servizi non possono essere eseguite da un file binario precedente. Azioni bloccate: avvio, arresto, riavvio e disinstallazione del servizio Gateway; reinstallazione forzata del servizio; avvio del Gateway in modalità servizio; pulizia della porta `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Correggere PATH">
    Correggere `PATH` affinché `openclaw` risolva l'installazione più recente, quindi eseguire nuovamente l'azione.
  </Step>
  <Step title="Reinstallare il servizio Gateway">
    Reinstallare il servizio Gateway previsto dall'installazione più recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Rimuovere i wrapper obsoleti">
    Rimuovere i pacchetti di sistema obsoleti o le vecchie voci dei wrapper che puntano ancora a un file binario `openclaw` precedente.
  </Step>
</Steps>

<Warning>
Solo per downgrade intenzionali o ripristini di emergenza, impostare `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` per il singolo comando. Lasciarlo non impostato durante il normale funzionamento.
</Warning>

## Mancata corrispondenza del protocollo dopo un rollback

Utilizzare questa procedura quando i log continuano a mostrare `protocol mismatch` dopo un downgrade o un rollback. È in esecuzione un Gateway precedente, ma un processo client locale più recente continua a riconnettersi con un intervallo di versioni del protocollo non supportato dal Gateway precedente.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Verificare quanto segue:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` nei log del Gateway.
- `Established clients:` in `openclaw gateway status --deep` oppure `Gateway clients` in `openclaw doctor --deep`: client TCP attivi connessi alla porta del Gateway, con PID e righe di comando quando consentito dal sistema operativo.
- Un processo client la cui riga di comando punta all'installazione o al wrapper OpenClaw più recente da cui è stato eseguito il rollback.

Correzione:

1. Arrestare o riavviare il processo client OpenClaw obsoleto mostrato da `gateway status --deep`.
2. Riavviare le applicazioni o i wrapper che incorporano OpenClaw: dashboard locali, editor, helper del server applicativo o shell `openclaw logs --follow` di lunga durata.
3. Eseguire nuovamente `openclaw gateway status --deep` o `openclaw doctor --deep` e verificare che il PID del client obsoleto non sia più presente.

Non fare in modo che un Gateway precedente accetti un protocollo più recente e incompatibile. Gli incrementi di versione del protocollo proteggono il contratto di comunicazione; il ripristino dopo un rollback richiede la pulizia dei processi e delle versioni.

## Collegamento simbolico di una Skill ignorato perché esce dal percorso

Utilizzare questa procedura quando i log includono:

```text
Percorso della Skill ignorato perché esce dalla relativa radice configurata: ... reason=symlink-escape
```

Ogni radice delle Skill costituisce un limite di contenimento. Un collegamento simbolico in `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` o `~/.openclaw/skills` viene ignorato quando la sua destinazione reale viene risolta al di fuori di tale radice, a meno che la destinazione non sia esplicitamente considerata attendibile.

Esaminare il collegamento:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Se la destinazione è intenzionale, configurare sia la radice diretta delle Skill sia la destinazione consentita del collegamento simbolico:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Avviare quindi una nuova sessione oppure attendere che il monitoraggio delle Skill esegua l'aggiornamento. Riavviare il Gateway se il processo in esecuzione è precedente alla modifica della configurazione.

Non utilizzare destinazioni generiche come `~`, `/` o un'intera cartella di progetto sincronizzata. Limitare `allowSymlinkTargets` alla radice reale delle Skill che contiene directory `SKILL.md` attendibili.

Se l'applicazione di Skill Workshop deve anche scrivere attraverso tali percorsi attendibili delle Skill nell'area di lavoro collegati simbolicamente, abilitare `skills.workshop.allowSymlinkTargetWrites`. Mantenerlo disabilitato per le radici condivise delle Skill in sola lettura.

Correlati:

- [Configurazione delle Skills](/it/tools/skills-config#symlinked-skill-roots)
- [Esempi di configurazione](/it/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Utilizzo aggiuntivo richiesto da Anthropic 429 per il contesto esteso

Utilizzare questa procedura quando i log o gli errori includono: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Verificare quanto segue:

- Il modello Anthropic selezionato è un modello Claude 4.x da 1M con disponibilità generale (Opus 4.6/4.7/4.8, Sonnet 4.6), oppure la configurazione del modello contiene ancora il valore obsoleto `params.context1m: true`.
- Le credenziali Anthropic correnti non sono idonee all'utilizzo del contesto esteso.
- Le richieste non riescono solo durante sessioni o esecuzioni del modello prolungate che richiedono il percorso di contesto da 1M.

Opzioni di correzione:

<Steps>
  <Step title="Utilizzare una finestra di contesto standard">
    Passare a un modello con finestra standard oppure rimuovere il valore obsoleto `context1m` dalla precedente
    configurazione del modello che non supporta il contesto da 1M con disponibilità generale.
  </Step>
  <Step title="Utilizzare credenziali idonee">
    Utilizzare credenziali Anthropic idonee per le richieste con contesto esteso oppure passare a una chiave API Anthropic.
  </Step>
  <Step title="Configurare modelli di fallback">
    Configurare modelli di fallback affinché le esecuzioni continuino quando le richieste Anthropic con contesto esteso vengono rifiutate.
  </Step>
</Steps>

Correlati:

- [Anthropic](/it/providers/anthropic)
- [Utilizzo dei token e costi](/it/reference/token-use)
- [Perché viene visualizzato HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Risposte 403 bloccate a monte

Utilizzare questa procedura quando un provider LLM a monte restituisce un errore generico `403`, ad esempio `Your request was blocked`.

Non presupporre che si tratti sempre di un problema di configurazione di OpenClaw. La risposta può provenire da un livello di sicurezza a monte, ad esempio una CDN, un WAF, una regola di gestione dei bot o un proxy inverso posto davanti a un endpoint compatibile con OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Verificare quanto segue:

- Più modelli dello stesso provider non riescono nello stesso modo.
- Viene restituito HTML o testo generico relativo alla sicurezza anziché un normale errore dell'API del provider.
- Sono presenti eventi di sicurezza sul lato del provider relativi allo stesso momento della richiesta.
- Una piccola richiesta di verifica diretta `curl` riesce, mentre le normali richieste con la struttura dell'SDK non riescono.

Quando le evidenze indicano un blocco WAF/CDN, correggere prima il filtraggio sul lato del provider. Preferire una regola di autorizzazione o esclusione strettamente limitata al percorso API utilizzato da OpenClaw ed evitare di disabilitare la protezione per l'intero sito.

<Warning>
Il successo di una richiesta minima `curl` non garantisce che le richieste reali in stile SDK attraversino lo stesso livello di sicurezza a monte.
</Warning>

Correlati:

- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)
- [Configurazione dei provider](/it/providers)
- [Log](/it/logging)

## Il backend locale compatibile con OpenAI supera le verifiche dirette, ma le esecuzioni dell'agente non riescono

Utilizzare questa procedura quando:

- `curl ... /v1/models` funziona.
- Le piccole chiamate dirette `/v1/chat/completions` funzionano.
- Le esecuzioni dei modelli OpenClaw non riescono solo durante i normali turni dell'agente.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Verificare quanto segue:

- Le piccole chiamate dirette riescono, ma le esecuzioni di OpenClaw non riescono solo con prompt più grandi.
- Si verificano errori `model_not_found` o 404, anche se una richiesta diretta `/v1/chat/completions` funziona con lo stesso ID di modello senza prefisso.
- Il backend segnala errori perché `messages[].content` richiede una stringa.
- Si verificano avvisi intermittenti `incomplete turn detected ... stopReason=stop payloads=0` con un backend locale compatibile con OpenAI.
- Il backend si arresta in modo anomalo solo con un numero maggiore di token del prompt o con i prompt completi del runtime dell'agente.

<AccordionGroup>
  <Accordion title="Sintomi comuni">
    - `model_not_found` con un server locale in stile MLX/vLLM: verificare che `baseUrl` includa `/v1`, che `api` sia `"openai-completions"` per i backend `/v1/chat/completions` e che `models.providers.<provider>.models[].id` sia l'ID locale del provider senza prefisso. Selezionarlo una sola volta con il prefisso del provider, ad esempio `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantenere la voce del catalogo come `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: il backend rifiuta le parti strutturate del contenuto di Chat Completions. Correzione: impostare `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` o chiavi consentite per i messaggi come `["role","content"]`: il backend rifiuta i metadati di riproduzione in stile OpenAI nei messaggi di Chat Completions. Correzione: impostare `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: il backend ha completato la richiesta di Chat Completions, ma non ha restituito alcun testo dell'assistente visibile all'utente per quel turno. OpenClaw riprova una volta i turni vuoti compatibili con OpenAI che possono essere riprodotti in sicurezza; gli errori persistenti indicano generalmente che il backend emette contenuti vuoti o non testuali oppure omette il testo della risposta finale.
    - Le piccole richieste dirette riescono, ma le esecuzioni degli agenti OpenClaw non riescono a causa di arresti anomali del backend o del modello (ad esempio Gemma in alcune build `inferrs`): il trasporto di OpenClaw è probabilmente già corretto; il backend non riesce a gestire la struttura più grande del prompt del runtime dell'agente.
    - Gli errori diminuiscono dopo la disabilitazione degli strumenti, ma non scompaiono: gli schemi degli strumenti contribuivano al carico, ma il problema residuo riguarda ancora la capacità del modello o del server a monte oppure un bug del backend.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Impostare `compat.requiresStringContent: true` per i backend Chat Completions che accettano solo stringhe.
    2. Impostare `compat.strictMessageKeys: true` per i backend Chat Completions rigorosi che accettano solo `role` e `content` in ciascun messaggio.
    3. Impostare `compat.supportsTools: false` per i modelli o i backend che non riescono a gestire in modo affidabile la superficie degli schemi degli strumenti di OpenClaw.
    4. Ridurre, dove possibile, il carico del prompt: bootstrap più piccolo dell'area di lavoro, cronologia della sessione più breve, modello locale più leggero o backend con un supporto migliore per il contesto esteso.
    5. Se le piccole richieste dirette continuano a riuscire mentre i turni degli agenti OpenClaw continuano a causare arresti anomali nel backend, considerare il problema una limitazione del server o del modello a monte e inviare una riproduzione al relativo progetto con la struttura del payload accettata.
  </Accordion>
</AccordionGroup>

Correlati:

- [Configurazione](/it/gateway/configuration)
- [Modelli locali](/it/gateway/local-models)
- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non arriva alcuna risposta, controllare l'instradamento e i criteri prima di riconnettere qualsiasi elemento.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Verificare la presenza di:

- Associazione in sospeso per i mittenti dei messaggi diretti.
- Limitazione basata sulle menzioni nei gruppi (`requireMention`, `mentionPatterns`).
- Mancate corrispondenze nelle liste consentite di canali/gruppi.

Segnali comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino a una menzione.
- `pairing request` → il mittente deve essere approvato.
- `blocked` / `allowlist` → il mittente/canale è stato filtrato dai criteri.

Argomenti correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Gruppi](/it/channels/groups)
- [Associazione](/it/channels/pairing)

## Connettività dell'interfaccia di controllo della dashboard

Quando la dashboard/interfaccia di controllo non riesce a connettersi, verificare l'URL, la modalità di autenticazione e le condizioni relative al contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Verificare la presenza di:

- URL di verifica e URL della dashboard corretti.
- Mancata corrispondenza della modalità di autenticazione/del token tra client e Gateway.
- Utilizzo di HTTP quando è richiesta l'identità del dispositivo.

Se un browser locale non riesce a connettersi a `127.0.0.1:18789` dopo un aggiornamento, ripristinare innanzitutto il servizio Gateway locale e verificare che stia rendendo disponibile la dashboard:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Se `curl` restituisce l'HTML di OpenClaw, il Gateway funziona e il problema restante è probabilmente dovuto alla cache del browser, a un vecchio collegamento diretto o allo stato obsoleto di una scheda. Aprire direttamente `http://127.0.0.1:18789` e navigare dalla dashboard. Se dopo il riavvio il servizio non rimane in esecuzione, eseguire `openclaw gateway start` e ricontrollare `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="Segnali di connessione/autenticazione">
    - `device identity required` → contesto non sicuro o autenticazione del dispositivo mancante.
    - `origin not allowed` → il valore `Origin` del browser non è presente in `gateway.controlUi.allowedOrigins` (oppure la connessione proviene da un'origine browser non di loopback priva di una lista consentita esplicita).
    - `device nonce required` / `device nonce mismatch` → il client non sta completando il flusso di autenticazione del dispositivo basato sulla richiesta di verifica (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → il client ha firmato il payload errato (o con una marca temporale obsoleta) per l'handshake corrente.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può effettuare un solo nuovo tentativo attendibile con il token del dispositivo memorizzato nella cache.
    - Questo nuovo tentativo con il token memorizzato nella cache riutilizza l'insieme di ambiti memorizzato insieme al token del dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` esplicito mantengono invece l'insieme di ambiti richiesto.
    - `AUTH_SCOPE_MISMATCH` → il token del dispositivo è stato riconosciuto, ma i relativi ambiti approvati non coprono questa richiesta di connessione; associare nuovamente o approvare il contratto degli ambiti richiesto anziché ruotare un token Gateway condiviso.
    - Al di fuori di questo percorso di nuovo tentativo, l'ordine di precedenza per l'autenticazione della connessione è: prima token/password condivisi espliciti, quindi `deviceToken` esplicito, poi il token del dispositivo memorizzato e infine il token di bootstrap.
    - Nel percorso asincrono dell'interfaccia di controllo Tailscale Serve, i tentativi non riusciti per lo stesso `{scope, ip}` vengono serializzati prima che il limitatore registri l'errore. Due nuovi tentativi simultanei non validi dallo stesso client possono quindi produrre `retry later` al secondo tentativo anziché due semplici mancate corrispondenze.
    - `too many failed authentication attempts (retry later)` da un client di loopback con origine browser → gli errori ripetuti dallo stesso `Origin` normalizzato vengono temporaneamente bloccati; un'altra origine localhost utilizza un gruppo distinto.
    - `unauthorized` ripetuto dopo il nuovo tentativo → divergenza tra token condiviso e token del dispositivo; aggiornare la configurazione del token e, se necessario, approvare nuovamente o ruotare il token del dispositivo.
    - `gateway connect failed:` → destinazione host/porta/URL errata.

  </Accordion>
</AccordionGroup>

### Mappa rapida dei codici di dettaglio dell'autenticazione

Utilizzare `error.details.code` dalla risposta `connect` non riuscita per scegliere l'azione successiva:

| Codice di dettaglio          | Significato                                                                                                                                                                                  | Azione consigliata                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso obbligatorio.                                                                                                                                    | Incollare/impostare il token nel client e riprovare. Per i percorsi della dashboard: `openclaw config get gateway.auth.token`, quindi incollare il valore nelle impostazioni dell'interfaccia di controllo.                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrispondeva al token di autenticazione del Gateway.                                                                                                                  | Se `canRetryWithDeviceToken=true`, consentire un solo nuovo tentativo attendibile. I nuovi tentativi con token memorizzato nella cache riutilizzano gli ambiti approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli ambiti richiesti. Se l'errore persiste, seguire l'[elenco di controllo per il ripristino dalla divergenza dei token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token memorizzato nella cache per il singolo dispositivo è obsoleto o revocato.                                                                                                           | Ruotare/approvare nuovamente il token del dispositivo tramite la [CLI dei dispositivi](/it/cli/devices), quindi riconnettersi.                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Il token del dispositivo è valido, ma il ruolo/gli ambiti approvati non coprono questa richiesta di connessione.                                                                              | Associare nuovamente il dispositivo o approvare il contratto degli ambiti richiesto; non considerare il problema come una divergenza del token condiviso.                                                                                         |
| `PAIRING_REQUIRED`           | L'identità del dispositivo deve essere approvata. Controllare `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade` e utilizzare `requestId` / `remediationHint` quando disponibili. | Approvare la richiesta in sospeso: `openclaw devices list`, quindi `openclaw devices approve <requestId>`. Gli aggiornamenti di ambito/ruolo utilizzano lo stesso flusso dopo la verifica dell'accesso richiesto.                                                                                                   |

<Note>
Le RPC dirette del backend di loopback autenticate con il token/la password condivisi del Gateway non devono dipendere dalla base di riferimento degli ambiti del dispositivo associato della CLI. Se i sottoagenti o altre chiamate interne continuano a non riuscire con `scope-upgrade`, verificare che il chiamante utilizzi `client.id: "gateway-client"` e `client.mode: "backend"` e che non imponga un `deviceIdentity` esplicito o un token del dispositivo.
</Note>

Verifica della migrazione all'autenticazione del dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiornare il client che si connette e verificarlo:

<Steps>
  <Step title="Attendere connect.challenge">
    Il client attende il valore `connect.challenge` emesso dal Gateway.
  </Step>
  <Step title="Firmare il payload">
    Il client firma il payload vincolato alla richiesta di verifica.
  </Step>
  <Step title="Inviare il nonce del dispositivo">
    Il client invia `connect.params.device.nonce` con lo stesso nonce della richiesta di verifica.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` viene negato inaspettatamente:

- Le sessioni con token di un dispositivo associato possono gestire soltanto il **proprio** dispositivo, a meno che il chiamante non disponga anche di `operator.admin`.
- `openclaw devices rotate --scope ...` può richiedere soltanto ambiti operatore già posseduti dalla sessione del chiamante.

Argomenti correlati:

- [Configurazione](/it/gateway/configuration) (modalità di autenticazione del Gateway)
- [Interfaccia di controllo](/it/web/control-ui)
- [Dispositivi](/it/cli/devices)
- [Accesso remoto](/it/gateway/remote)
- [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)

## Servizio Gateway non in esecuzione

Utilizzare questa sezione quando il servizio è installato, ma il processo non rimane attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analizza anche i servizi a livello di sistema
```

Verificare la presenza di:

- `Runtime: stopped` con indicazioni sull'uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` rispetto a `Config (service)`).
- Conflitti di porta/listener.
- Installazioni aggiuntive di launchd/systemd/schtasks quando viene utilizzato `--deep`.
- Indicazioni per la pulizia di `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Segnali comuni">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Soluzione: impostare `gateway.mode="local"` nella configurazione oppure rieseguire `openclaw onboard --mode local` / `openclaw setup` per ripristinare la configurazione prevista della modalità locale. Se OpenClaw viene eseguito tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → associazione non di loopback senza un percorso di autenticazione Gateway valido (token/password oppure proxy attendibile, se configurato).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
    - `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. Nella maggior parte delle configurazioni è opportuno mantenere un solo Gateway per macchina; se ne serve più di uno, isolare porte, configurazione, stato e area di lavoro. Consultare [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` da doctor → esiste un'unità di sistema systemd mentre manca il servizio a livello utente. Rimuovere o disabilitare il duplicato prima di consentire a doctor di installare un servizio utente, oppure impostare `OPENCLAW_SERVICE_REPAIR_POLICY=external` se l'unità di sistema è il supervisore previsto.
    - `Gateway service port does not match current gateway config` → il supervisore installato è ancora vincolato al vecchio `--port`. Eseguire `openclaw doctor --fix` o `openclaw gateway install --force`, quindi riavviare il servizio Gateway.

  </Accordion>
</AccordionGroup>

Argomenti correlati:

- [Esecuzione in background e strumento dei processi](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Doctor](/it/gateway/doctor)

## Il Gateway su macOS smette silenziosamente di rispondere e riprende quando si interagisce con la dashboard

Da utilizzare quando i canali (Telegram, WhatsApp, ecc.) su un host macOS smettono di rispondere per periodi che vanno da alcuni minuti ad alcune ore e il Gateway sembra riattivarsi non appena si apre la Control UI, si accede tramite SSH o si interagisce in altro modo con l'host. Di solito non è presente alcun sintomo evidente in `openclaw status`, perché quando lo si controlla il Gateway è già di nuovo attivo.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Cercare:

- Uno o più bundle `*-uncaught_exception.json` in `~/.openclaw/logs/stability/` con `error.code` impostato su un codice di rete transitorio come `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` o `ECONNREFUSED`.
- Righe `pmset -g log` come `Entering Sleep state due to 'Maintenance Sleep'` o `en0 driver is slow (msg: WillChangeState to 0)` in corrispondenza dei timestamp degli arresti anomali. Power Nap / Maintenance Sleep porta brevemente il driver Wi-Fi nello stato 0; qualsiasi `connect()` in uscita che si verifichi in quell'intervallo può non riuscire con `ENETDOWN`, anche su un host che dispone altrimenti di connettività di rete completa.
- Output di `launchctl print` che mostra `state = not running` con più `runs` recenti e un codice di uscita, soprattutto quando l'intervallo tra l'arresto anomalo e l'avvio successivo è nell'ordine di un'ora anziché di pochi secondi. Dopo una serie di arresti anomali, launchd di macOS applica un meccanismo di protezione dal riavvio non documentato che può smettere di rispettare `KeepAlive=true` finché un evento esterno, come un accesso interattivo, una connessione alla dashboard o `launchctl kickstart`, non lo riattiva.

Segnali comuni:

- Un bundle di stabilità il cui `error.code` è `ENETDOWN` o un codice correlato, con lo stack di chiamate che punta a Node `net` `lookupAndConnect` / `Socket.connect`. OpenClaw `2026.5.26` e versioni successive classificano questi eventi come errori di rete transitori innocui, impedendo che si propaghino al gestore di primo livello delle eccezioni non intercettate; se si utilizza una versione precedente, eseguire prima l'aggiornamento.
- Lunghi periodi di inattività che terminano nell'istante in cui ci si connette alla Control UI o si accede all'host tramite SSH: è l'attività visibile all'utente a riattivare il meccanismo di riavvio di launchd, non un'azione della dashboard sul Gateway.
- Il conteggio `runs` aumenta nel corso della giornata senza una riga `received SIG*; shutting down` corrispondente in `~/Library/Logs/openclaw/gateway.log`: gli arresti regolari registrano un segnale, mentre gli arresti anomali transitori no.

Cosa fare:

1. **Aggiornare il Gateway** se si utilizza una versione precedente a `2026.5.26`. Dopo l'aggiornamento, i futuri errori `ENETDOWN` vengono registrati come avvisi anziché terminare il processo.
2. **Ridurre l'attività di sospensione per manutenzione** sugli host Mac mini / desktop destinati a funzionare come server sempre attivi:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Questa operazione riduce significativamente, ma non elimina del tutto, l'instabilità del driver sottostante. Il sistema può comunque eseguire alcune sospensioni per manutenzione per mantenere attivi TCP keepalive e mDNS, indipendentemente da questi flag.

3. **Aggiungere un watchdog di operatività** affinché un'eventuale futura serie di arresti anomali bloccata da launchd venga rilevata rapidamente:

   ```bash
   # Esempio di controllo dell'operatività compatibile con launchd, adatto a un Cron o LaunchAgent eseguito ogni 5 minuti
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Lo scopo è riattivare esternamente il meccanismo di riavvio; dopo una serie di arresti anomali su macOS, il solo `KeepAlive=true` non è sufficiente.

Correlati:

- [Note sulla piattaforma macOS](/it/platforms/macos)
- [Registrazione](/it/logging)
- [Doctor](/it/gateway/doctor)

## Ciclo del supervisore launchd di macOS con LaunchAgent duplicati per Gateway/Node

Da utilizzare quando un'installazione macOS continua a riavviarsi ogni pochi secondi, i controlli di integrità `openclaw`
oscillano tra disponibile e non disponibile e l'inoltro dei canali si blocca,
anche se il servizio sembra essere in esecuzione.

Questo comportamento è stato osservato nelle installazioni meno recenti in cui sia `ai.openclaw.gateway` sia
`ai.openclaw.node` erano LaunchAgent attivi e ciascuno inseriva
`OPENCLAW_LAUNCHD_LABEL`. In questo stato OpenClaw può rilevare la supervisione di launchd,
tentare di delegare nuovamente il riavvio a launchd e finire in un rapido ciclo di
`EADDRINUSE`/riavvio anziché mantenere un unico processo Gateway stabile.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Cercare:

- Più di un PID del Gateway nel campione di 30 secondi anziché un unico
  processo stabile.
- `EADDRINUSE`, `another gateway instance is already listening` o ripetute
  righe di riavvio/delega in `gateway.log`.
- Sia `~/Library/LaunchAgents/ai.openclaw.gateway.plist` sia
  `~/Library/LaunchAgents/ai.openclaw.node.plist` caricati contemporaneamente su un
  host che dovrebbe eseguire un solo servizio Gateway gestito.

Cosa fare:

1. Se questo host deve eseguire soltanto il servizio Gateway, rimuovere tramite OpenClaw
   il servizio Node gestito. **Saltare questo passaggio** se si utilizza attivamente il servizio Node
   per le funzionalità dei Node remoti; la disinstallazione interrompe tali funzionalità su
   questo host:

   ```bash
   openclaw node uninstall
   ```

2. Installare un wrapper permanente per il Gateway che elimini i marcatori launchd
   ereditati prima di avviare OpenClaw. Utilizzare l'opzione `--wrapper` supportata; non
   modificare il file generato in `~/.openclaw/service-env/`, perché la reinstallazione
   del servizio, l'aggiornamento e la riparazione tramite Doctor rigenerano tale file:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` mantiene il percorso del wrapper durante le reinstallazioni forzate,
   gli aggiornamenti e le riparazioni tramite Doctor.

3. Verificare che il Gateway sia stabile e gestisca RPC, anziché limitarsi ad ascoltare:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   Il campione di PID dovrebbe mostrare un unico processo stabile anziché un insieme variabile di
   PID e l'inoltro dei canali in entrata dovrebbe riprendere.

4. Dopo l'aggiornamento a una versione in cui il ciclo sottostante dei due LaunchAgent è
   stato corretto, rimuovere la soluzione alternativa e reinstallare il normale servizio gestito:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

Correlati:

- [Note sulla piattaforma macOS](/it/platforms/mac/bundled-gateway)
- [Doctor](/it/gateway/doctor)
- [CLI del Gateway](/it/cli/gateway)

## Chiusura del Gateway durante un utilizzo elevato della memoria

Da utilizzare quando il Gateway scompare sotto carico, il supervisore segnala un riavvio dovuto all'esaurimento della memoria oppure i log menzionano `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Cercare:

- `Reason: diagnostic.memory.pressure.critical` nel bundle di stabilità più recente.
- `Memory pressure:` con `critical/rss_threshold`, `critical/heap_threshold` o `critical/rss_growth`.
- Valori `V8 heap:` prossimi al limite dell'heap.
- Voci `Largest session files:` come `agents/<agent>/sessions/<session>.jsonl` o `sessions/<session>.jsonl`.
- Contatori della memoria cgroup di Linux quando il Gateway viene eseguito in un container o in un servizio con memoria limitata.

Segnali comuni:

- `critical memory pressure bundle written` compare poco prima del riavvio → OpenClaw ha acquisito un bundle di stabilità precedente all'esaurimento della memoria. Esaminarlo con `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` compare nei log del Gateway → OpenClaw ha rilevato una pressione critica sulla memoria, ma l'acquisizione di stabilità precedente all'esaurimento della memoria è disattivata.
- `Largest session files:` indica un percorso molto grande di una trascrizione oscurata → ridurre la cronologia delle sessioni conservata, esaminare la crescita delle sessioni o spostare le vecchie trascrizioni fuori dall'archivio attivo prima del riavvio.
- I byte utilizzati in `V8 heap:` sono prossimi al limite dell'heap → ridurre il carico di prompt/sessioni, diminuire il lavoro simultaneo oppure aumentare il limite dell'heap di Node solo dopo aver confermato che il carico di lavoro è previsto.
- `Memory pressure: critical/rss_growth` → la memoria è aumentata rapidamente durante un singolo intervallo di campionamento. Controllare nei log più recenti la presenza di un'importazione di grandi dimensioni, un output incontrollato degli strumenti, tentativi ripetuti o un gruppo di attività dell'agente in coda.
- Nei log compare una pressione critica sulla memoria, ma non esiste alcun bundle → questo è il comportamento predefinito. Impostare `diagnostics.memoryPressureSnapshot: true` per acquisire il bundle di stabilità precedente all'esaurimento della memoria in occasione di futuri eventi di pressione critica sulla memoria.

Il bundle di stabilità non contiene payload. Include dati operativi relativi alla memoria e percorsi di file relativi oscurati, ma non testo dei messaggi, corpi dei Webhook, credenziali, token, cookie o ID di sessione non elaborati. Allegare l'esportazione della diagnostica alle segnalazioni di bug anziché copiare i log non elaborati.

Correlati:

- [Integrità del Gateway](/it/gateway/health)
- [Esportazione della diagnostica](/it/gateway/diagnostics)
- [Sessioni](/it/cli/sessions)

## Il Gateway ha rifiutato una configurazione non valida

Da utilizzare quando l'avvio del Gateway non riesce con `Invalid config` o i log del ricaricamento a caldo indicano che una modifica non valida è stata ignorata.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cercare:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un file `openclaw.json.rejected.*` con timestamp accanto alla configurazione attiva.
- Un file `openclaw.json.clobbered.*` con timestamp se `doctor --fix` ha riparato una modifica diretta non valida.
- OpenClaw conserva i 32 file `.clobbered.*` più recenti per ogni percorso di configurazione ed elimina progressivamente quelli meno recenti.

<AccordionGroup>
  <Accordion title="Che cosa è successo">
    - La configurazione non ha superato la convalida durante l'avvio, il ricaricamento a caldo o una scrittura gestita da OpenClaw.
    - L'avvio del Gateway si interrompe in modo sicuro anziché riscrivere `openclaw.json`.
    - Il ricaricamento a caldo ignora le modifiche esterne non valide e mantiene attiva la configurazione di runtime corrente.
    - Le scritture gestite da OpenClaw rifiutano i payload non validi o distruttivi prima del commit e salvano `.rejected.*`.
    - `openclaw doctor --fix` gestisce la riparazione. Può rimuovere i prefissi non JSON o ripristinare l'ultima copia valida nota, conservando il payload rifiutato come `.clobbered.*`.
    - Quando vengono eseguite molte riparazioni per un singolo percorso di configurazione, OpenClaw elimina progressivamente i file `.clobbered.*` meno recenti, in modo che il payload riparato più recente rimanga disponibile.

  </Accordion>
  <Accordion title="Ispezione e riparazione">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Indicatori comuni">
    - `.clobbered.*` esiste → doctor ha conservato una modifica esterna non valida durante la riparazione della configurazione attiva.
    - `.rejected.*` esiste → la scrittura di una configurazione gestita da OpenClaw non ha superato i controlli dello schema o di sovrascrittura prima del commit.
    - `Config write rejected:` → la scrittura ha tentato di eliminare una struttura obbligatoria, ridurre drasticamente il file o rendere persistente una configurazione non valida.
    - `config reload skipped (invalid config):` → una modifica diretta non ha superato la convalida ed è stata ignorata dal Gateway in esecuzione.
    - `Invalid config at ...` → l'avvio non è riuscito prima dell'attivazione dei servizi del Gateway.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → una scrittura gestita da OpenClaw è stata rifiutata perché ha perso campi o dimensioni rispetto all'ultimo backup valido noto.
    - `Config last-known-good promotion skipped` → il candidato conteneva segnaposto di segreti oscurati, come `***`.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Eseguire `openclaw doctor --fix` per consentire a doctor di riparare la configurazione con prefisso o sovrascritta oppure ripristinare l'ultima configurazione valida nota.
    2. Copiare solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, quindi applicarle con `openclaw config set` o `config.patch`.
    3. Eseguire `openclaw config validate` prima del riavvio.
    4. In caso di modifica manuale, mantenere la configurazione JSON5 completa, non soltanto l'oggetto parziale che si desidera modificare.
  </Accordion>
</AccordionGroup>

Contenuti correlati:

- [Configurazione](/it/cli/config)
- [Configurazione: ricaricamento a caldo](/it/gateway/configuration#config-hot-reload)
- [Configurazione: convalida rigorosa](/it/gateway/configuration#strict-validation)
- [Doctor](/it/gateway/doctor)

## Avvisi del probe del Gateway

Utilizzare quando `openclaw gateway probe` raggiunge una destinazione, ma visualizza comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Verificare:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda il fallback SSH, più gateway, ambiti mancanti o riferimenti di autenticazione non risolti.

Indicatori comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH non è riuscita, ma il comando ha comunque tentato di usare le destinazioni dirette configurate o di loopback.
- `multiple reachable gateway identities detected` → hanno risposto gateway distinti oppure OpenClaw non ha potuto dimostrare che le destinazioni raggiungibili fossero lo stesso gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato per lo stesso gateway viene considerato un singolo gateway con più trasporti, anche quando le porte dei trasporti sono diverse.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione è riuscita, ma l'RPC dei dettagli è limitata dall'ambito; associare l'identità del dispositivo o utilizzare credenziali con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connessione è riuscita, ma il set completo di RPC diagnostiche è scaduto o non è riuscito. Considerarlo un Gateway raggiungibile con diagnostica degradata; confrontare `connect.ok` e `connect.rpcOk` nell'output di `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → il gateway ha risposto, ma questo client richiede ancora l'associazione o l'approvazione prima del normale accesso da parte dell'operatore.
- Testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale di autenticazione non era disponibile in questo percorso del comando per la destinazione non riuscita.

Contenuti correlati:

- [Gateway](/it/cli/gateway)
- [Più gateway sullo stesso host](/it/gateway#multiple-gateways-same-host)
- [Accesso remoto](/it/gateway/remote)

## Canale connesso, ma i messaggi non vengono trasmessi

Se lo stato del canale risulta connesso ma il flusso dei messaggi è interrotto, concentrarsi sui criteri, sulle autorizzazioni e sulle regole di recapito specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Verificare:

- Criterio per i messaggi diretti (`pairing`, `allowlist`, `open`, `disabled`).
- Elenco consentito del gruppo e requisiti per le menzioni.
- Autorizzazioni o ambiti API del canale mancanti.

Indicatori comuni:

- `mention required` → messaggio ignorato dai criteri per le menzioni del gruppo.
- `pairing` / tracce di approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di autenticazione o autorizzazioni del canale.

Contenuti correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Discord](/it/channels/discord)
- [Telegram](/it/channels/telegram)
- [WhatsApp](/it/channels/whatsapp)

## Recapito di Cron e Heartbeat

Se Cron o Heartbeat non è stato eseguito o non ha effettuato il recapito, verificare prima lo stato dell'utilità di pianificazione, quindi la destinazione di recapito.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Verificare:

- Cron abilitato e prossima attivazione presente.
- Stato della cronologia delle esecuzioni del processo (`ok`, `skipped`, `error`).
- Motivi per cui Heartbeat è stato ignorato (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Indicatori comuni">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
    - `cron: timer tick failed` → il ciclo dell'utilità di pianificazione non è riuscito; controllare gli errori di file, log o runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra delle ore di attività.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste, ma contiene soltanto una struttura vuota, commenti, intestazioni, delimitatori di blocchi o elenchi di controllo vuoti, quindi OpenClaw ignora la chiamata al modello.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è prevista in questo ciclo.
    - `heartbeat: unknown accountId` → ID account non valido per la destinazione di recapito di Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → la destinazione di Heartbeat è stata risolta come una destinazione di tipo messaggio diretto mentre `agents.defaults.heartbeat.directPolicy` (o la sostituzione specifica dell'agente) è impostato su `block`.

  </Accordion>
</AccordionGroup>

Contenuti correlati:

- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)

## Node associato, strumento non riuscito

Se un Node è associato ma gli strumenti non funzionano, isolare lo stato di primo piano, delle autorizzazioni e dell'approvazione.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Verificare:

- Node online con le funzionalità previste.
- Autorizzazioni del sistema operativo concesse per fotocamera, microfono, posizione e schermo.
- Stato delle approvazioni di esecuzione e dell'elenco consentito.

Indicatori comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del Node deve essere in primo piano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorizzazione del sistema operativo mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione dell'esecuzione in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dall'elenco consentito.

Contenuti correlati:

- [Approvazioni dell'esecuzione](/it/tools/exec-approvals)
- [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting)
- [Node](/it/nodes/index)

## Strumento browser non riuscito

Utilizzare quando le azioni dello strumento browser non riescono anche se il gateway è integro.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Verificare:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso valido dell'eseguibile del browser.
- Raggiungibilità del profilo CDP.
- Disponibilità locale di Chrome per i profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Indicatori del Plugin o dell'eseguibile">
    - `unknown command "browser"` o `unknown command 'browser'` → il Plugin browser incluso è escluso da `plugins.allow`.
    - Strumento browser mancante o non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il Plugin non è mai stato caricato.
    - `Failed to start Chrome CDP on port` → l'avvio del processo del browser non è riuscito.
    - `browser.executablePath not found` → il percorso configurato non è valido.
    - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato utilizza uno schema non supportato, come `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta non valida o fuori intervallo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del gateway non include la dipendenza del runtime browser di base; reinstallare o aggiornare OpenClaw, quindi riavviare il gateway. Le istantanee ARIA e le schermate di base delle pagine possono continuare a funzionare, ma la navigazione, le istantanee AI, le schermate degli elementi tramite selettore CSS e l'esportazione PDF restano non disponibili.

  </Accordion>
  <Accordion title="Indicatori di Chrome MCP o della sessione esistente">
    - `Could not find DevToolsActivePort for chrome` → la sessione esistente di Chrome MCP non è ancora riuscita a connettersi alla directory dei dati del browser selezionata. Aprire la pagina di ispezione del browser, abilitare il debug remoto, mantenere aperto il browser, approvare la prima richiesta di connessione, quindi riprovare. Se lo stato di accesso non è necessario, preferire il profilo gestito `openclaw`.
    - `No browser tabs found for profile="user"` → il profilo di connessione Chrome MCP non ha schede locali di Chrome aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo di sola connessione non ha destinazioni raggiungibili oppure l'endpoint HTTP ha risposto, ma non è stato comunque possibile aprire il WebSocket CDP.

  </Accordion>
  <Accordion title="Indicatori di elementi, schermate o caricamenti">
    - `fullPage is not supported for element screenshots` → la richiesta di schermata combinava `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate per le schermate di Chrome MCP / `existing-session` devono utilizzare l'acquisizione della pagina o un `--ref` dell'istantanea, non un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di caricamento di Chrome MCP richiedono riferimenti alle istantanee, non selettori CSS.
    - `existing-session file uploads currently support one file at a time.` → inviare un solo caricamento per chiamata nei profili Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → gli hook delle finestre di dialogo nei profili Chrome MCP non supportano sostituzioni del timeout.
    - `existing-session type does not support timeoutMs overrides.` → omettere `timeoutMs` per `act:type` nei profili di sessione esistente `profile="user"` / Chrome MCP oppure utilizzare un profilo browser gestito/CDP quando è necessario un timeout personalizzato.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP non elaborato.
    - Sostituzioni obsolete di viewport, modalità scura, impostazioni locali o modalità offline nei profili di sola connessione o CDP remoti → eseguire `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

  </Accordion>
</AccordionGroup>

Contenuti correlati:

- [Browser (gestito da OpenClaw)](/it/tools/browser)
- [Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting)

## Se dopo un aggiornamento qualcosa ha improvvisamente smesso di funzionare

La maggior parte dei problemi successivi a un aggiornamento è dovuta a una divergenza della configurazione o all'applicazione di impostazioni predefinite ora più rigorose.

<AccordionGroup>
  <Accordion title="1. Il comportamento di autenticazione e sovrascrittura dell'URL è cambiato">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Elementi da verificare:

    - Se `gateway.mode=remote`, le chiamate CLI potrebbero essere indirizzate al servizio remoto anche se quello locale funziona correttamente.
    - Le chiamate esplicite `--url` non utilizzano come alternativa le credenziali memorizzate.

    Indicatori comuni:

    - `gateway connect failed:` → destinazione URL errata.
    - `unauthorized` → endpoint raggiungibile, ma autenticazione errata.

  </Accordion>
  <Accordion title="2. Le protezioni per il binding e l'autenticazione sono più rigide">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Elementi da verificare:

    - I binding non loopback (`lan`, `tailnet`, `custom`) richiedono un percorso di autenticazione del Gateway valido: autenticazione tramite token/password condivisi oppure una distribuzione non loopback `trusted-proxy` configurata correttamente.
    - Le chiavi precedenti come `gateway.token` non sostituiscono `gateway.auth.token`.

    Indicatori comuni:

    - `refusing to bind gateway ... without auth` → binding non loopback senza un percorso di autenticazione del Gateway valido.
    - `Connectivity probe: failed` mentre il runtime è in esecuzione → Gateway attivo ma inaccessibile con l'autenticazione o l'URL correnti.

  </Accordion>
  <Accordion title="3. Lo stato di associazione e dell'identità del dispositivo è cambiato">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Elementi da verificare:

    - Approvazioni dei dispositivi in sospeso per dashboard/nodi.
    - Approvazioni di associazione dei messaggi diretti in sospeso dopo modifiche ai criteri o all'identità.

    Indicatori comuni:

    - `device identity required` → autenticazione del dispositivo non soddisfatta.
    - `pairing required` → il mittente/dispositivo deve essere approvato.

  </Accordion>
</AccordionGroup>

Se la configurazione del servizio e il runtime continuano a non corrispondere dopo le verifiche, reinstallare i metadati del servizio dalla stessa directory di profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Argomenti correlati:

- [Autenticazione](/it/gateway/authentication)
- [Esecuzione in background e strumento di gestione dei processi](/it/gateway/background-process)
- [Associazione dei nodi](/it/gateway/pairing)

## Argomenti correlati

- [Doctor](/it/gateway/doctor)
- [Domande frequenti](/it/help/faq)
- [Runbook del Gateway](/it/gateway)
