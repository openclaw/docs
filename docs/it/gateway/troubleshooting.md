---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Servono sezioni stabili del manuale operativo basate sui sintomi con comandi esatti
sidebarTitle: Troubleshooting
summary: Manuale operativo approfondito per la risoluzione dei problemi di Gateway, canali, automazione, nodi e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-30T08:55:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Questa pagina è il runbook approfondito. Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso rapido di triage.

## Sequenza dei comandi

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

Usalo quando un servizio gateway si arresta inaspettatamente dopo un aggiornamento, oppure i log mostrano che un binario `openclaw` è più vecchio della versione che ha scritto per ultima `openclaw.json`.

OpenClaw contrassegna le scritture di configurazione con `meta.lastTouchedVersion`. I comandi di sola lettura possono ancora ispezionare una configurazione scritta da un OpenClaw più recente, ma le mutazioni di processo e servizio rifiutano di proseguire da un binario più vecchio. Le azioni bloccate includono avvio, arresto, riavvio e disinstallazione del servizio gateway, reinstallazione forzata del servizio, avvio del gateway in modalità servizio e pulizia della porta con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Correggi PATH">
    Correggi `PATH` in modo che `openclaw` si risolva all'installazione più recente, poi riesegui l'azione.
  </Step>
  <Step title="Reinstalla il servizio gateway">
    Reinstalla il servizio gateway previsto dall'installazione più recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Rimuovi i wrapper obsoleti">
    Rimuovi il pacchetto di sistema obsoleto o le vecchie voci wrapper che puntano ancora a un vecchio binario `openclaw`.
  </Step>
</Steps>

<Warning>
Solo per downgrade intenzionale o ripristino di emergenza, imposta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` per il singolo comando. Lasciala non impostata per il funzionamento normale.
</Warning>

## Uso extra Anthropic 429 richiesto per contesto lungo

Usalo quando log/errori includono: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea all'uso del contesto lungo.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni del modello che richiedono il percorso beta 1M.

Opzioni di correzione:

<Steps>
  <Step title="Disabilita context1m">
    Disabilita `context1m` per quel modello per tornare alla finestra di contesto normale.
  </Step>
  <Step title="Usa una credenziale idonea">
    Usa una credenziale Anthropic idonea alle richieste con contesto lungo, oppure passa a una chiave API Anthropic.
  </Step>
  <Step title="Configura modelli di fallback">
    Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic con contesto lungo vengono rifiutate.
  </Step>
</Steps>

Correlato:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Perché vedo HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Il backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni dell'agente falliscono

Usalo quando:

- `curl ... /v1/models` funziona
- piccole chiamate dirette a `/v1/chat/completions` funzionano
- le esecuzioni del modello OpenClaw falliscono solo nei normali turni dell'agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cerca:

- le chiamate dirette piccole riescono, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori `model_not_found` o 404 anche se `/v1/chat/completions` diretto
  funziona con lo stesso id modello semplice
- errori del backend su `messages[].content` che si aspetta una stringa
- avvisi intermittenti `incomplete turn detected ... stopReason=stop payloads=0` con un backend locale compatibile con OpenAI
- crash del backend che compaiono solo con conteggi di prompt-token più grandi o con prompt completi del runtime dell'agente

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `model_not_found` con un server locale in stile MLX/vLLM → verifica che `baseUrl` includa `/v1`, che `api` sia `"openai-completions"` per backend `/v1/chat/completions` e che `models.providers.<provider>.models[].id` sia l'id locale del provider semplice. Selezionalo una volta con il prefisso del provider, per esempio `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantieni la voce di catalogo come `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → il backend rifiuta parti di contenuto strutturato di Chat Completions. Correzione: imposta `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → il backend ha completato la richiesta Chat Completions ma non ha restituito testo dell'assistente visibile all'utente per quel turno. OpenClaw ritenta una volta i turni vuoti compatibili con OpenAI sicuri da riprodurre; i fallimenti persistenti di solito indicano che il backend emette contenuto vuoto/non testuale o sopprime il testo della risposta finale.
    - le richieste dirette piccole riescono, ma le esecuzioni agente OpenClaw falliscono con crash del backend/modello (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw probabilmente è già corretto; il backend fallisce sulla forma più grande del prompt del runtime dell'agente.
    - i fallimenti diminuiscono dopo la disabilitazione degli strumenti ma non scompaiono → gli schemi degli strumenti facevano parte della pressione, ma il problema rimanente è ancora capacità del modello/server upstream o un bug del backend.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Imposta `compat.requiresStringContent: true` per backend Chat Completions solo-stringa.
    2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire in modo affidabile la superficie degli schemi strumenti di OpenClaw.
    3. Riduci la pressione del prompt dove possibile: bootstrap dell'area di lavoro più piccolo, cronologia di sessione più breve, modello locale più leggero o un backend con supporto più forte per il contesto lungo.
    4. Se le richieste dirette piccole continuano a riuscire mentre i turni dell'agente OpenClaw continuano a causare crash dentro il backend, trattalo come una limitazione upstream del server/modello e apri lì una riproduzione con la forma del payload accettata.
  </Accordion>
</AccordionGroup>

Correlato:

- [Configurazione](/it/gateway/configuration)
- [Modelli locali](/it/gateway/local-models)
- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non arriva alcuna risposta, controlla routing e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cerca:

- Abbinamento in sospeso per i mittenti DM.
- Gate delle menzioni di gruppo (`requireMention`, `mentionPatterns`).
- Disallineamenti della allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino alla menzione.
- `pairing request` → il mittente richiede approvazione.
- `blocked` / `allowlist` → il mittente/canale è stato filtrato dalla policy.

Correlato:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Gruppi](/it/channels/groups)
- [Abbinamento](/it/channels/pairing)

## Connettività della UI di controllo della dashboard

Quando la dashboard/UI di controllo non si connette, valida URL, modalità di autenticazione e presupposti del contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL del probe e URL della dashboard corretti.
- Disallineamento modalità/token di autenticazione tra client e gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

<AccordionGroup>
  <Accordion title="Firme di connessione/autenticazione">
    - `device identity required` → contesto non sicuro o autenticazione dispositivo mancante.
    - `origin not allowed` → l'`Origin` del browser non è in `gateway.controlUi.allowedOrigins` (oppure ti stai connettendo da un'origine browser non loopback senza allowlist esplicita).
    - `device nonce required` / `device nonce mismatch` → il client non completa il flusso di autenticazione dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato (o timestamp obsoleto) per l'handshake corrente.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può eseguire un solo tentativo attendibile con token dispositivo in cache.
    - Quel tentativo con token in cache riusa l'insieme di scope in cache archiviato con il token dispositivo abbinato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
    - Fuori da quel percorso di nuovo tentativo, la precedenza dell'autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo salvato, poi token di bootstrap.
    - Nel percorso asincrono della Control UI di Tailscale Serve, i tentativi falliti per lo stesso `{scope, ip}` vengono serializzati prima che il limitatore registri il fallimento. Due nuovi tentativi errati concorrenti dallo stesso client possono quindi mostrare `retry later` al secondo tentativo invece di due semplici disallineamenti.
    - `too many failed authentication attempts (retry later)` da un client loopback con origine browser → i fallimenti ripetuti dalla stessa `Origin` normalizzata vengono bloccati temporaneamente; un'altra origine localhost usa un bucket separato.
    - `unauthorized` ripetuto dopo quel nuovo tentativo → deriva del token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
    - `gateway connect failed:` → destinazione host/porta/url errata.

  </Accordion>
</AccordionGroup>

### Mappa rapida dei codici di dettaglio dell'autenticazione

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice dettaglio             | Significato                                                                                                                                                                                   | Azione consigliata                                                                                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso obbligatorio.                                                                                                                                     | Incolla/imposta il token nel client e riprova. Per i percorsi della dashboard: `openclaw config get gateway.auth.token`, poi incollalo nelle impostazioni della Control UI.                                                                                                                    |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrispondeva al token di autenticazione del Gateway.                                                                                                                   | Se `canRetryWithDeviceToken=true`, consenti un nuovo tentativo attendibile. I nuovi tentativi con token memorizzati nella cache riutilizzano gli ambiti approvati salvati; i chiamanti espliciti `deviceToken` / `scopes` mantengono gli ambiti richiesti. Se l'errore persiste, esegui la [checklist di ripristino della deriva del token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo memorizzato nella cache è obsoleto o revocato.                                                                                                                       | Ruota/riapprova il token del dispositivo usando la [CLI dei dispositivi](/it/cli/devices), quindi riconnettiti.                                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list`, poi `openclaw devices approve <requestId>`. Gli aggiornamenti di ambito/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                        |

<Note>
Le RPC dirette del backend su local loopback autenticate con il token/password condiviso del Gateway non dovrebbero dipendere dalla baseline degli ambiti dei dispositivi associati della CLI. Se i subagent o altre chiamate interne continuano a fallire con `scope-upgrade`, verifica che il chiamante usi `client.id: "gateway-client"` e `client.mode: "backend"` e non forzi un `deviceIdentity` esplicito o un token dispositivo.
</Note>

Verifica della migrazione dell'autenticazione dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiorna il client che si connette e verificalo:

<Steps>
  <Step title="Attendi connect.challenge">
    Il client attende il `connect.challenge` emesso dal Gateway.
  </Step>
  <Step title="Firma il payload">
    Il client firma il payload vincolato alla challenge.
  </Step>
  <Step title="Invia il nonce del dispositivo">
    Il client invia `connect.params.device.nonce` con lo stesso nonce della challenge.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo imprevisto:

- le sessioni con token di dispositivo associato possono gestire solo il **proprio** dispositivo, a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo ambiti operatore che la sessione del chiamante possiede già

Correlati:

- [Configurazione](/it/gateway/configuration) (modalità di autenticazione del Gateway)
- [Control UI](/it/web/control-ui)
- [Dispositivi](/it/cli/devices)
- [Accesso remoto](/it/gateway/remote)
- [Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth)

## Servizio Gateway non in esecuzione

Usalo quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analizza anche i servizi a livello di sistema
```

Cerca:

- `Runtime: stopped` con suggerimenti di uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` rispetto a `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando viene usato `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per riapplicare la configurazione prevista in modalità locale. Se esegui OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → binding non-loopback senza un percorso di autenticazione Gateway valido (token/password, oppure trusted-proxy dove configurato).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
    - `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. La maggior parte delle configurazioni dovrebbe mantenere un solo Gateway per macchina; se ne hai bisogno di più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` da doctor → esiste un'unità di sistema systemd mentre il servizio a livello utente manca. Rimuovi o disabilita il duplicato prima di consentire a doctor di installare un servizio utente, oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` se l'unità di sistema è il supervisore previsto.
    - `Gateway service port does not match current gateway config` → il supervisore installato vincola ancora il vecchio `--port`. Esegui `openclaw doctor --fix` o `openclaw gateway install --force`, quindi riavvia il servizio Gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Esecuzione in background e strumento processo](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Doctor](/it/gateway/doctor)

## Il Gateway ha ripristinato l'ultima configurazione valida nota

Usalo quando il Gateway si avvia, ma i log indicano che ha ripristinato `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Cerca:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un file `openclaw.json.clobbered.*` con timestamp accanto alla configurazione attiva
- Un evento di sistema dell'agente principale che inizia con `Config recovery warning`

<AccordionGroup>
  <Accordion title="Che cosa è successo">
    - La configurazione rifiutata non è stata convalidata durante l'avvio o il ricaricamento a caldo.
    - OpenClaw ha preservato il payload rifiutato come `.clobbered.*`.
    - La configurazione attiva è stata ripristinata dall'ultima copia last-known-good convalidata.
    - Il turno successivo dell'agente principale viene avvisato di non riscrivere alla cieca la configurazione rifiutata.
    - Se tutti i problemi di validazione erano sotto `plugins.entries.<id>...`, OpenClaw non avrebbe ripristinato l'intero file. I guasti locali al Plugin restano evidenti mentre le impostazioni utente non correlate rimangono nella configurazione attiva.

  </Accordion>
  <Accordion title="Ispeziona e ripara">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Firme comuni">
    - `.clobbered.*` esiste → una modifica diretta esterna o una lettura all'avvio è stata ripristinata.
    - `.rejected.*` esiste → una scrittura di configurazione gestita da OpenClaw non ha superato i controlli di schema o di clobber prima del commit.
    - `Config write rejected:` → la scrittura ha tentato di rimuovere la forma richiesta, ridurre drasticamente il file o persistere una configurazione non valida.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → l'avvio ha trattato il file corrente come sovrascritto perché ha perso campi o dimensioni rispetto al backup last-known-good.
    - `Config last-known-good promotion skipped` → il candidato conteneva segnaposto di segreti redatti come `***`.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Mantieni la configurazione attiva ripristinata se è corretta.
    2. Copia solo le chiavi previste da `.clobbered.*` o `.rejected.*`, quindi applicale con `openclaw config set` o `config.patch`.
    3. Esegui `openclaw config validate` prima di riavviare.
    4. Se modifichi a mano, mantieni la configurazione JSON5 completa, non solo l'oggetto parziale che volevi modificare.
  </Accordion>
</AccordionGroup>

Correlati:

- [Config](/it/cli/config)
- [Configurazione: ricaricamento a caldo](/it/gateway/configuration#config-hot-reload)
- [Configurazione: validazione rigorosa](/it/gateway/configuration#strict-validation)
- [Doctor](/it/gateway/doctor)

## Avvisi del probe del Gateway

Usalo quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, più Gateway, ambiti mancanti o riferimenti di autenticazione non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH non è riuscita, ma il comando ha comunque provato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito questo indica una configurazione multi-Gateway intenzionale o listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma la RPC di dettaglio è limitata dagli ambiti; associa l'identità del dispositivo o usa credenziali con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connessione ha funzionato, ma l'intero set RPC diagnostico è scaduto o non è riuscito. Trattalo come un Gateway raggiungibile con diagnostica degradata; confronta `connect.ok` e `connect.rpcOk` nell'output `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → il Gateway ha risposto, ma questo client richiede ancora associazione/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale di autenticazione non era disponibile in questo percorso di comando per il target non riuscito.

Correlati:

- [Gateway](/it/cli/gateway)
- [Più Gateway sullo stesso host](/it/gateway#multiple-gateways-same-host)
- [Accesso remoto](/it/gateway/remote)

## Canale connesso, messaggi non in transito

Se lo stato del canale è connesso ma il flusso dei messaggi è bloccato, concentrati su policy, permessi e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Cerca:

- Policy DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist di gruppo e requisiti di menzione.
- Permessi/ambiti API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dalla policy di menzione del gruppo.
- `pairing` / tracce di approvazione in sospeso → mittente non approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di autenticazione/autorizzazioni del canale.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Discord](/it/channels/discord)
- [Telegram](/it/channels/telegram)
- [WhatsApp](/it/channels/whatsapp)

## Consegna di Cron e Heartbeat

Se cron o heartbeat non è stato eseguito o non ha consegnato, verifica prima lo stato dello scheduler, poi la destinazione di consegna.

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
- Motivi di salto dell’Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `cron: scheduler disabled; jobs will not run automatically` → cron disabilitato.
    - `cron: timer tick failed` → tick dello scheduler non riuscito; controlla errori di file/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di ore attive.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è in scadenza su questo tick.
    - `heartbeat: unknown accountId` → ID account non valido per la destinazione di consegna dell’Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → la destinazione dell’Heartbeat è stata risolta in una destinazione di tipo DM mentre `agents.defaults.heartbeat.directPolicy` (o l’override per agente) è impostato su `block`.

  </Accordion>
</AccordionGroup>

Correlati:

- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)

## Node associato, strumento non riuscito

Se un Node è associato ma gli strumenti non funzionano, isola lo stato di primo piano, autorizzazioni e approvazione.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Node online con le capacità previste.
- Concessioni di autorizzazioni del sistema operativo per fotocamera/microfono/posizione/schermo.
- Stato delle approvazioni exec e della allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l’app Node deve essere in primo piano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → autorizzazione del sistema operativo mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla allowlist.

Correlati:

- [Approvazioni exec](/it/tools/exec-approvals)
- [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting)
- [Node](/it/nodes/index)

## Strumento browser non riuscito

Usa questa se le azioni dello strumento browser non riescono anche se il gateway stesso è integro.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cerca:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso valido dell’eseguibile del browser.
- Raggiungibilità del profilo CDP.
- Disponibilità locale di Chrome per i profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firme Plugin / eseguibile">
    - `unknown command "browser"` o `unknown command 'browser'` → il plugin browser in bundle è escluso da `plugins.allow`.
    - strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
    - `Failed to start Chrome CDP on port` → avvio del processo browser non riuscito.
    - `browser.executablePath not found` → il percorso configurato non è valido.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurato usa uno schema non supportato, come `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurato ha una porta errata o fuori intervallo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l’installazione corrente del gateway non include la dipendenza runtime `playwright-core` del plugin browser in bundle; esegui `openclaw doctor --fix`, poi riavvia il gateway. Gli snapshot ARIA e gli screenshot di pagina di base possono ancora funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF restano non disponibili.

  </Accordion>
  <Accordion title="Firme Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → existing-session di Chrome MCP non è ancora riuscito ad agganciarsi alla directory dati del browser selezionata. Apri la pagina di ispezione del browser, abilita il debug remoto, tieni aperto il browser, approva il primo prompt di aggancio, poi riprova. Se lo stato di accesso non è richiesto, preferisci il profilo gestito `openclaw`.
    - `No Chrome tabs found for profile="user"` → il profilo di aggancio Chrome MCP non ha schede Chrome locali aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l’endpoint CDP remoto configurato non è raggiungibile dall’host del gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo aggancio non ha una destinazione raggiungibile, oppure l’endpoint HTTP ha risposto ma il WebSocket CDP non è stato comunque aperto.

  </Accordion>
  <Accordion title="Firme elemento / screenshot / caricamento">
    - `fullPage is not supported for element screenshots` → la richiesta di screenshot ha combinato `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare la cattura della pagina o un `--ref` dello snapshot, non CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di caricamento Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
    - `existing-session file uploads currently support one file at a time.` → invia un caricamento per chiamata sui profili Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → gli hook dialog sui profili Chrome MCP non supportano override di timeout.
    - `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP raw.
    - override obsoleti di viewport / modalità scura / lingua / offline su profili solo aggancio o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l’intero gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Browser (gestito da OpenClaw)](/it/tools/browser)
- [Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting)

## Se hai aggiornato e qualcosa si è rotto improvvisamente

La maggior parte dei problemi post-aggiornamento è dovuta a deriva della configurazione o a default più rigidi ora applicati.

<AccordionGroup>
  <Accordion title="1. Il comportamento di override di autenticazione e URL è cambiato">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cosa controllare:

    - Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale funziona correttamente.
    - Le chiamate esplicite con `--url` non ricadono sulle credenziali memorizzate.

    Firme comuni:

    - `gateway connect failed:` → destinazione URL errata.
    - `unauthorized` → endpoint raggiungibile ma autenticazione errata.

  </Accordion>
  <Accordion title="2. Le protezioni di bind e autenticazione sono più rigide">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cosa controllare:

    - I bind non loopback (`lan`, `tailnet`, `custom`) richiedono un percorso valido di autenticazione del gateway: autenticazione con token/password condivisa, oppure una distribuzione `trusted-proxy` non loopback configurata correttamente.
    - Vecchie chiavi come `gateway.token` non sostituiscono `gateway.auth.token`.

    Firme comuni:

    - `refusing to bind gateway ... without auth` → bind non loopback senza un percorso valido di autenticazione del gateway.
    - `Connectivity probe: failed` mentre il runtime è in esecuzione → gateway attivo ma inaccessibile con autenticazione/url correnti.

  </Accordion>
  <Accordion title="3. Lo stato di associazione e identità dispositivo è cambiato">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cosa controllare:

    - Approvazioni dispositivo in sospeso per dashboard/Node.
    - Approvazioni di associazione DM in sospeso dopo modifiche a policy o identità.

    Firme comuni:

    - `device identity required` → autenticazione dispositivo non soddisfatta.
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
- [Associazione di proprietà del Gateway](/it/gateway/pairing)

## Correlati

- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
- [Runbook del Gateway](/it/gateway)
