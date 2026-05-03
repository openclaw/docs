---
read_when:
    - L'hub per la risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Sono necessarie sezioni di runbook stabili basate sui sintomi, con comandi esatti
sidebarTitle: Troubleshooting
summary: Runbook approfondito per la risoluzione dei problemi di Gateway, canali, automazione, nodi e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-05-03T21:35:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Questa pagina è il runbook approfondito. Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso di triage rapido.

## Sequenza di comandi

Esegui prima questi comandi, in quest'ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Segnali attesi di stato corretto:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...`.
- `openclaw doctor` non segnala problemi bloccanti di configurazione/servizio.
- `openclaw channels status --probe` mostra lo stato live del trasporto per account e, dove supportati, risultati di probe/audit come `works` o `audit ok`.

## Installazioni split brain e protezione per configurazioni più recenti

Usalo quando un servizio Gateway si arresta inaspettatamente dopo un aggiornamento, oppure i log mostrano che un binario `openclaw` è più vecchio della versione che ha scritto per ultima `openclaw.json`.

OpenClaw contrassegna le scritture di configurazione con `meta.lastTouchedVersion`. I comandi in sola lettura possono ancora ispezionare una configurazione scritta da un OpenClaw più recente, ma le mutazioni di processi e servizi rifiutano di continuare da un binario più vecchio. Le azioni bloccate includono avvio, arresto, riavvio, disinstallazione del servizio Gateway, reinstallazione forzata del servizio, avvio del Gateway in modalità servizio e pulizia delle porte con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Correggi PATH">
    Correggi `PATH` in modo che `openclaw` punti all'installazione più recente, quindi riesegui l'azione.
  </Step>
  <Step title="Reinstalla il servizio Gateway">
    Reinstalla il servizio Gateway previsto dall'installazione più recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Rimuovi wrapper obsoleti">
    Rimuovi il pacchetto di sistema obsoleto o le vecchie voci wrapper che puntano ancora a un vecchio binario `openclaw`.
  </Step>
</Steps>

<Warning>
Solo per downgrade intenzionale o ripristino di emergenza, imposta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` per il singolo comando. Lascialo non impostato durante il funzionamento normale.
</Warning>

## Utilizzo extra Anthropic 429 richiesto per il contesto lungo

Usalo quando log/errori includono: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso del contesto lungo.
- Le richieste falliscono solo su sessioni/esecuzioni di modello lunghe che richiedono il percorso beta da 1M.

Opzioni di correzione:

<Steps>
  <Step title="Disabilita context1m">
    Disabilita `context1m` per quel modello per tornare alla normale finestra di contesto.
  </Step>
  <Step title="Usa una credenziale idonea">
    Usa una credenziale Anthropic idonea per richieste con contesto lungo, oppure passa a una chiave API Anthropic.
  </Step>
  <Step title="Configura modelli di fallback">
    Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic con contesto lungo vengono rifiutate.
  </Step>
</Steps>

Correlati:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Perché vedo HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni degli agenti falliscono

Usalo quando:

- `curl ... /v1/models` funziona
- le piccole chiamate dirette a `/v1/chat/completions` funzionano
- Le esecuzioni dei modelli OpenClaw falliscono solo nei normali turni agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cerca:

- le piccole chiamate dirette riescono, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori `model_not_found` o 404 anche se la chiamata diretta a `/v1/chat/completions`
  funziona con lo stesso id modello semplice
- errori del backend su `messages[].content` che si aspettano una stringa
- avvisi intermittenti `incomplete turn detected ... stopReason=stop payloads=0` con un backend locale compatibile con OpenAI
- arresti anomali del backend che compaiono solo con conteggi di prompt-token più grandi o prompt runtime agente completi

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `model_not_found` con un server locale in stile MLX/vLLM → verifica che `baseUrl` includa `/v1`, che `api` sia `"openai-completions"` per backend `/v1/chat/completions` e che `models.providers.<provider>.models[].id` sia l'id locale del provider semplice. Selezionalo una volta con il prefisso del provider, per esempio `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantieni la voce di catalogo come `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → il backend rifiuta parti di contenuto Chat Completions strutturate. Correzione: imposta `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → il backend ha completato la richiesta Chat Completions ma non ha restituito testo assistente visibile all'utente per quel turno. OpenClaw ritenta una volta i turni vuoti compatibili con OpenAI sicuri da riprodurre; errori persistenti di solito indicano che il backend sta emettendo contenuto vuoto/non testuale o sta sopprimendo il testo della risposta finale.
    - piccole richieste dirette riescono, ma le esecuzioni agente OpenClaw falliscono con arresti anomali backend/modello (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw probabilmente è già corretto; il backend fallisce sulla forma più grande del prompt runtime agente.
    - gli errori diminuiscono dopo aver disabilitato gli strumenti ma non scompaiono → gli schemi degli strumenti facevano parte della pressione, ma il problema restante è ancora la capacità del modello/server upstream o un bug del backend.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
    2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire in modo affidabile la superficie degli schemi strumenti di OpenClaw.
    3. Riduci la pressione del prompt dove possibile: bootstrap workspace più piccolo, cronologia sessione più breve, modello locale più leggero o un backend con supporto al contesto lungo più solido.
    4. Se le piccole richieste dirette continuano a passare mentre i turni agente OpenClaw continuano a causare arresti anomali nel backend, trattalo come una limitazione del server/modello upstream e apri una segnalazione di riproduzione lì con la forma del payload accettata.
  </Accordion>
</AccordionGroup>

Correlati:

- [Configurazione](/it/gateway/configuration)
- [Modelli locali](/it/gateway/local-models)
- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma nulla risponde, controlla routing e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cerca:

- Pairing in sospeso per mittenti DM.
- Gate delle menzioni nei gruppi (`requireMention`, `mentionPatterns`).
- Mancate corrispondenze dell'allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato finché non viene menzionato.
- `pairing request` → il mittente richiede approvazione.
- `blocked` / `allowlist` → il mittente/canale è stato filtrato dalla policy.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Gruppi](/it/channels/groups)
- [Pairing](/it/channels/pairing)

## Connettività dell'interfaccia di controllo della dashboard

Quando la dashboard/interfaccia di controllo non si connette, convalida URL, modalità auth e assunzioni sul contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL di probe e URL dashboard corretti.
- Mancata corrispondenza di modalità/token auth tra client e Gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

<AccordionGroup>
  <Accordion title="Firme di connessione / auth">
    - `device identity required` → contesto non sicuro o auth dispositivo mancante.
    - `origin not allowed` → `Origin` del browser non è in `gateway.controlUi.allowedOrigins` (oppure ti stai connettendo da un'origine browser non loopback senza un'allowlist esplicita).
    - `device nonce required` / `device nonce mismatch` → il client non sta completando il flusso auth dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato (o un timestamp obsoleto) per l'handshake corrente.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può eseguire un solo retry attendibile con il token dispositivo memorizzato nella cache.
    - Quel retry con token in cache riutilizza l'insieme di scope in cache memorizzato con il token dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
    - Al di fuori di quel percorso di retry, la precedenza auth di connessione è prima token condiviso/password espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token bootstrap.
    - Sul percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso `{scope, ip}` vengono serializzati prima che il limiter registri l'errore. Due retry concorrenti errati dallo stesso client possono quindi mostrare `retry later` al secondo tentativo invece di due semplici mismatch.
    - `too many failed authentication attempts (retry later)` da un client browser-origin loopback → errori ripetuti dalla stessa `Origin` normalizzata vengono bloccati temporaneamente; un'altra origine localhost usa un bucket separato.
    - `unauthorized` ripetuto dopo quel retry → deriva tra token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
    - `gateway connect failed:` → host/porta/url target errato.

  </Accordion>
</AccordionGroup>

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice di dettaglio          | Significato                                                                                                                                                                                  | Azione consigliata                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                       | Incolla/imposta il token nel client e riprova. Per i percorsi della dashboard: `openclaw config get gateway.auth.token`, quindi incolla nelle impostazioni della Control UI.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrispondeva al token di autenticazione del Gateway.                                                                                                                 | Se `canRetryWithDeviceToken=true`, consenti un solo nuovo tentativo attendibile. I tentativi con token in cache riutilizzano gli scope approvati archiviati; i chiamanti espliciti `deviceToken` / `scopes` mantengono gli scope richiesti. Se continua a non funzionare, esegui la [checklist di recupero dalla deriva del token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo in cache è obsoleto o revocato.                                                                                                                                     | Ruota/riapprova il token del dispositivo usando la [CLI dei dispositivi](/it/cli/devices), quindi riconnettiti.                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade` e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list`, quindi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo che hai esaminato l'accesso richiesto.                                                                                   |

<Note>
Le RPC backend dirette su loopback autenticate con il token/password condiviso del Gateway non dovrebbero dipendere dalla baseline degli scope dei dispositivi associati della CLI. Se subagent o altre chiamate interne continuano a non riuscire con `scope-upgrade`, verifica che il chiamante usi `client.id: "gateway-client"` e `client.mode: "backend"` e che non forzi un `deviceIdentity` esplicito o un token del dispositivo.
</Note>

Controllo della migrazione dell'autenticazione dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiorna il client che si connette e verificalo:

<Steps>
  <Step title="Wait for connect.challenge">
    Il client attende il `connect.challenge` emesso dal Gateway.
  </Step>
  <Step title="Sign the payload">
    Il client firma il payload vincolato alla challenge.
  </Step>
  <Step title="Send the device nonce">
    Il client invia `connect.params.device.nonce` con lo stesso nonce della challenge.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo inatteso:

- le sessioni con token di dispositivo associato possono gestire solo il **proprio** dispositivo, a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo gli scope operatore che la sessione del chiamante possiede già

Correlati:

- [Configurazione](/it/gateway/configuration) (modalità di autenticazione del Gateway)
- [Control UI](/it/web/control-ui)
- [Dispositivi](/it/cli/devices)
- [Accesso remoto](/it/gateway/remote)
- [Autenticazione tramite proxy attendibile](/it/gateway/trusted-proxy-auth)

## Servizio Gateway non in esecuzione

Usa questa se il servizio è installato ma il processo non rimane attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Cerca:

- `Runtime: stopped` con suggerimenti di uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando si usa `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per riapplicare la configurazione prevista per la modalità locale. Se stai eseguendo OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non loopback senza un percorso di autenticazione Gateway valido (token/password, o trusted-proxy dove configurato).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
    - `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. La maggior parte delle configurazioni dovrebbe mantenere un solo Gateway per macchina; se ne serve davvero più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` da doctor → esiste un'unità di sistema systemd mentre manca il servizio a livello utente. Rimuovi o disabilita il duplicato prima di consentire a doctor di installare un servizio utente, oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` se l'unità di sistema è il supervisore previsto.
    - `Gateway service port does not match current gateway config` → il supervisore installato vincola ancora il vecchio `--port`. Esegui `openclaw doctor --fix` o `openclaw gateway install --force`, quindi riavvia il servizio Gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Esecuzione in background e strumento di processo](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Doctor](/it/gateway/doctor)

## Il Gateway ha rifiutato una configurazione non valida

Usa questa se l'avvio del Gateway non riesce con `Invalid config` o i log di hot reload indicano che
ha saltato una modifica non valida.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cerca:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Un file `openclaw.json.rejected.*` con timestamp accanto alla configurazione attiva
- Un file `openclaw.json.clobbered.*` con timestamp se `doctor --fix` ha riparato una modifica diretta non valida

<AccordionGroup>
  <Accordion title="What happened">
    - La configurazione non è stata validata durante l'avvio, l'hot reload o una scrittura gestita da OpenClaw.
    - L'avvio del Gateway fallisce in modo chiuso invece di riscrivere `openclaw.json`.
    - L'hot reload salta le modifiche esterne non valide e mantiene attiva la configurazione di runtime corrente.
    - Le scritture gestite da OpenClaw rifiutano payload non validi/distruttivi prima del commit e salvano `.rejected.*`.
    - `openclaw doctor --fix` gestisce la riparazione. Può rimuovere prefissi non JSON o ripristinare l'ultima copia valida nota preservando il payload rifiutato come `.clobbered.*`.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` esiste → doctor ha preservato una modifica esterna non valida mentre riparava la configurazione attiva.
    - `.rejected.*` esiste → una scrittura della configurazione gestita da OpenClaw ha fallito lo schema o i controlli anti-clobber prima del commit.
    - `Config write rejected:` → la scrittura ha tentato di rimuovere la forma richiesta, ridurre bruscamente il file o persistere una configurazione non valida.
    - `config reload skipped (invalid config):` → una modifica diretta non ha superato la validazione ed è stata ignorata dal Gateway in esecuzione.
    - `Invalid config at ...` → l'avvio è fallito prima che i servizi Gateway venissero avviati.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → una scrittura gestita da OpenClaw è stata rifiutata perché ha perso campi o dimensione rispetto al backup dell'ultima configurazione valida nota.
    - `Config last-known-good promotion skipped` → il candidato conteneva segnaposto di segreti redatti come `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Esegui `openclaw doctor --fix` per lasciare che doctor ripari la configurazione con prefissi/clobber o ripristini l'ultima configurazione valida nota.
    2. Copia solo le chiavi previste da `.clobbered.*` o `.rejected.*`, quindi applicale con `openclaw config set` o `config.patch`.
    3. Esegui `openclaw config validate` prima di riavviare.
    4. Se modifichi a mano, mantieni la configurazione JSON5 completa, non solo l'oggetto parziale che volevi cambiare.
  </Accordion>
</AccordionGroup>

Correlati:

- [Config](/it/cli/config)
- [Configurazione: hot reload](/it/gateway/configuration#config-hot-reload)
- [Configurazione: validazione rigorosa](/it/gateway/configuration#strict-validation)
- [Doctor](/it/gateway/doctor)

## Avvisi del probe del Gateway

Usa questa se `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda il fallback SSH, più Gateway, scope mancanti o riferimenti di autenticazione non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH non è riuscita, ma il comando ha comunque tentato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito significa una configurazione multi-Gateway intenzionale o listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma la RPC di dettaglio è limitata dagli scope; associa l'identità del dispositivo o usa credenziali con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connessione ha funzionato, ma l'intero set di RPC diagnostiche è andato in timeout o non è riuscito. Trattalo come un Gateway raggiungibile con diagnostica degradata; confronta `connect.ok` e `connect.rpcOk` nell'output `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → il Gateway ha risposto, ma questo client richiede ancora pairing/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale di autenticazione non era disponibile in questo percorso di comando per il target non riuscito.

Correlati:

- [Gateway](/it/cli/gateway)
- [Più Gateway sullo stesso host](/it/gateway#multiple-gateways-same-host)
- [Accesso remoto](/it/gateway/remote)

## Canale connesso, messaggi non in transito

Se lo stato del canale è connesso ma il flusso dei messaggi è fermo, concentrati su policy, autorizzazioni e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cerca:

- Criteri DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist di gruppo e requisiti di menzione.
- Permessi/scope API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dal criterio di menzione del gruppo.
- `pairing` / tracce di approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di autenticazione/permessi del canale.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Discord](/it/channels/discord)
- [Telegram](/it/channels/telegram)
- [WhatsApp](/it/channels/whatsapp)

## Recapito di Cron e Heartbeat

Se cron o heartbeat non è stato eseguito o non ha effettuato il recapito, verifica prima lo stato dello scheduler, poi la destinazione di recapito.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e prossimo risveglio presente.
- Stato della cronologia di esecuzione del job (`ok`, `skipped`, `error`).
- Motivi di salto dell'Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron disabilitato.
    - `cron: timer tick failed` → tick dello scheduler non riuscito; controlla errori di file/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra degli orari attivi.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è in scadenza in questo tick.
    - `heartbeat: unknown accountId` → ID account non valido per la destinazione di recapito dell'Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → la destinazione dell'Heartbeat è stata risolta in una destinazione di tipo DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per agente) è impostato su `block`.

  </Accordion>
</AccordionGroup>

Correlati:

- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)

## Node abbinato, strumento non riuscito

Se un node è abbinato ma gli strumenti non riescono, isola lo stato di foreground, permessi e approvazione.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Node online con le capacità previste.
- Concessioni dei permessi del sistema operativo per fotocamera/microfono/posizione/schermo.
- Approvazioni exec e stato dell'allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del node deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso del sistema operativo mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dall'allowlist.

Correlati:

- [Approvazioni exec](/it/tools/exec-approvals)
- [Risoluzione dei problemi dei node](/it/nodes/troubleshooting)
- [Node](/it/nodes/index)

## Strumento browser non riuscito

Usa questa se le azioni dello strumento browser non riescono anche se il Gateway stesso è integro.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cerca:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso valido dell'eseguibile del browser.
- Raggiungibilità del profilo CDP.
- Disponibilità locale di Chrome per profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` o `unknown command 'browser'` → il plugin browser in bundle è escluso da `plugins.allow`.
    - strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
    - `Failed to start Chrome CDP on port` → il processo del browser non è riuscito ad avviarsi.
    - `browser.executablePath not found` → il percorso configurato non è valido.
    - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta non valida o fuori intervallo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del gateway non include la dipendenza runtime core del browser; reinstalla o aggiorna OpenClaw, quindi riavvia il gateway. Gli snapshot ARIA e gli screenshot di base delle pagine possono ancora funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF restano non disponibili.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito ad agganciarsi alla directory dati del browser selezionata. Apri la pagina di ispezione del browser, abilita il debug remoto, tieni aperto il browser, approva la prima richiesta di aggancio, quindi riprova. Se lo stato con accesso effettuato non è necessario, preferisci il profilo gestito `openclaw`.
    - `No Chrome tabs found for profile="user"` → il profilo di aggancio Chrome MCP non ha schede Chrome locali aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo aggancio non ha destinazioni raggiungibili, oppure l'endpoint HTTP ha risposto ma non è stato comunque possibile aprire il WebSocket CDP.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → la richiesta di screenshot ha combinato `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare la cattura della pagina o un `--ref` di snapshot, non un `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di caricamento Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
    - `existing-session file uploads currently support one file at a time.` → invia un caricamento per chiamata sui profili Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → gli hook di dialogo sui profili Chrome MCP non supportano override del timeout.
    - `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP grezzo.
    - override obsoleti di viewport / modalità scura / locale / offline su profili solo aggancio o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Browser (gestito da OpenClaw)](/it/tools/browser)
- [Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting)

## Se hai aggiornato e qualcosa si è rotto improvvisamente

La maggior parte delle rotture post-aggiornamento è dovuta a deriva della configurazione o a default più rigorosi ora applicati.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cosa controllare:

    - Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale funziona correttamente.
    - Le chiamate esplicite con `--url` non ripiegano sulle credenziali salvate.

    Firme comuni:

    - `gateway connect failed:` → destinazione URL errata.
    - `unauthorized` → endpoint raggiungibile ma autenticazione errata.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cosa controllare:

    - I bind non local loopback (`lan`, `tailnet`, `custom`) richiedono un percorso di autenticazione gateway valido: autenticazione con token/password condivisi, oppure una distribuzione `trusted-proxy` non local loopback configurata correttamente.
    - Le vecchie chiavi come `gateway.token` non sostituiscono `gateway.auth.token`.

    Firme comuni:

    - `refusing to bind gateway ... without auth` → bind non local loopback senza un percorso di autenticazione gateway valido.
    - `Connectivity probe: failed` mentre il runtime è in esecuzione → gateway attivo ma inaccessibile con l'autenticazione/URL correnti.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cosa controllare:

    - Approvazioni dispositivo in sospeso per dashboard/node.
    - Approvazioni di abbinamento DM in sospeso dopo modifiche di criterio o identità.

    Firme comuni:

    - `device identity required` → autenticazione del dispositivo non soddisfatta.
    - `pairing required` → mittente/dispositivo deve essere approvato.

  </Accordion>
</AccordionGroup>

Se la configurazione del servizio e il runtime continuano a non concordare dopo i controlli, reinstalla i metadati del servizio dalla stessa directory profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [Autenticazione](/it/gateway/authentication)
- [Exec in background e strumento processo](/it/gateway/background-process)
- [Abbinamento gestito dal Gateway](/it/gateway/pairing)

## Correlati

- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
- [Runbook del Gateway](/it/gateway)
