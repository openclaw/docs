---
read_when:
    - L'hub per la risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Servono sezioni di runbook stabili basate sui sintomi con comandi esatti
sidebarTitle: Troubleshooting
summary: Runbook approfondito per la risoluzione dei problemi di Gateway, canali, automazione, nodi e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-05-01T08:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Questa pagina è il runbook approfondito. Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso di triage rapido.

## Scala dei comandi

Esegui prima questi, in quest'ordine:

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

## Installazioni split brain e guardia per configurazioni più recenti

Usa questa se un servizio Gateway si arresta inaspettatamente dopo un aggiornamento, oppure se i log mostrano che un binario `openclaw` è più vecchio della versione che ha scritto per ultima `openclaw.json`.

OpenClaw contrassegna le scritture della configurazione con `meta.lastTouchedVersion`. I comandi in sola lettura possono comunque ispezionare una configurazione scritta da una versione più recente di OpenClaw, ma le mutazioni di processi e servizi rifiutano di continuare da un binario più vecchio. Le azioni bloccate includono avvio, arresto, riavvio, disinstallazione del servizio Gateway, reinstallazione forzata del servizio, avvio del Gateway in modalità servizio e pulizia della porta con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Correggi `PATH` in modo che `openclaw` risolva all'installazione più recente, quindi riesegui l'azione.
  </Step>
  <Step title="Reinstall the gateway service">
    Reinstalla il servizio Gateway previsto dall'installazione più recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Rimuovi pacchetti di sistema obsoleti o vecchie voci wrapper che puntano ancora a un vecchio binario `openclaw`.
  </Step>
</Steps>

<Warning>
Solo per downgrade intenzionale o ripristino di emergenza, imposta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` per il singolo comando. Lascialo non impostato per il funzionamento normale.
</Warning>

## Utilizzo aggiuntivo Anthropic 429 richiesto per contesto lungo

Usa questa quando log/errori includono: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea all'uso del contesto lungo.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni di modelli che richiedono il percorso beta 1M.

Opzioni di correzione:

<Steps>
  <Step title="Disable context1m">
    Disabilita `context1m` per quel modello per tornare alla finestra di contesto normale.
  </Step>
  <Step title="Use an eligible credential">
    Usa una credenziale Anthropic idonea per richieste a contesto lungo, oppure passa a una chiave API Anthropic.
  </Step>
  <Step title="Configure fallback models">
    Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic a contesto lungo vengono rifiutate.
  </Step>
</Steps>

Correlati:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Perché vedo HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Il backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni dell'agente falliscono

Usa questa quando:

- `curl ... /v1/models` funziona
- le chiamate dirette minime a `/v1/chat/completions` funzionano
- Le esecuzioni modello di OpenClaw falliscono solo nei normali turni dell'agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cerca:

- le chiamate dirette minime riescono, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori `model_not_found` o 404 anche se `/v1/chat/completions` diretto
  funziona con lo stesso id modello semplice
- errori del backend su `messages[].content` che si aspetta una stringa
- avvisi intermittenti `incomplete turn detected ... stopReason=stop payloads=0` con un backend locale compatibile con OpenAI
- crash del backend che compaiono solo con conteggi di token del prompt maggiori o con prompt completi del runtime dell'agente

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` con un server locale in stile MLX/vLLM → verifica che `baseUrl` includa `/v1`, che `api` sia `"openai-completions"` per backend `/v1/chat/completions` e che `models.providers.<provider>.models[].id` sia l'id semplice locale al provider. Selezionalo una volta con il prefisso del provider, per esempio `mlx/mlx-community/Qwen3-30B-A3B-6bit`; mantieni la voce di catalogo come `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → il backend rifiuta parti di contenuto Chat Completions strutturate. Correzione: imposta `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → il backend ha completato la richiesta Chat Completions ma non ha restituito testo dell'assistente visibile all'utente per quel turno. OpenClaw ritenta una volta i turni OpenAI-compatibili vuoti sicuri da riprodurre; fallimenti persistenti di solito significano che il backend sta emettendo contenuto vuoto/non testuale o sta sopprimendo il testo della risposta finale.
    - le richieste dirette minime riescono, ma le esecuzioni dell'agente OpenClaw falliscono con crash del backend/modello (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw probabilmente è già corretto; il backend sta fallendo sulla forma del prompt più grande del runtime dell'agente.
    - i fallimenti diminuiscono dopo aver disabilitato gli strumenti ma non scompaiono → gli schemi degli strumenti facevano parte della pressione, ma il problema restante è comunque capacità del modello/server upstream o un bug del backend.

  </Accordion>
  <Accordion title="Fix options">
    1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
    2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire in modo affidabile la superficie dello schema degli strumenti di OpenClaw.
    3. Riduci la pressione del prompt dove possibile: bootstrap dello spazio di lavoro più piccolo, cronologia di sessione più breve, modello locale più leggero o un backend con supporto più solido per contesti lunghi.
    4. Se le richieste dirette minime continuano a riuscire mentre i turni dell'agente OpenClaw continuano a causare crash dentro il backend, trattalo come una limitazione upstream del server/modello e invia lì una riproduzione con la forma del payload accettata.
  </Accordion>
</AccordionGroup>

Correlati:

- [Configurazione](/it/gateway/configuration)
- [Modelli locali](/it/gateway/local-models)
- [Endpoint compatibili con OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non risponde nulla, controlla routing e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cerca:

- Abbinamento in sospeso per mittenti DM.
- Gating delle menzioni di gruppo (`requireMention`, `mentionPatterns`).
- Disallineamenti della allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino alla menzione.
- `pairing request` → il mittente necessita di approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Gruppi](/it/channels/groups)
- [Abbinamento](/it/channels/pairing)

## Connettività dell'interfaccia di controllo della dashboard

Quando la dashboard/interfaccia di controllo non si connette, valida URL, modalità di autenticazione e presupposti di contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL del probe e URL della dashboard corretti.
- Disallineamento di modalità/token di autenticazione tra client e Gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → contesto non sicuro o autenticazione del dispositivo mancante.
    - `origin not allowed` → `Origin` del browser non è in `gateway.controlUi.allowedOrigins` (oppure ti stai connettendo da un'origine browser non-loopback senza una allowlist esplicita).
    - `device nonce required` / `device nonce mismatch` → il client non sta completando il flusso di autenticazione dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato (o un timestamp obsoleto) per l'handshake corrente.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può eseguire un unico ritentativo attendibile con il token dispositivo memorizzato nella cache.
    - Quel ritentativo con token in cache riusa l'insieme di scope memorizzato con il token dispositivo abbinato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
    - Fuori da quel percorso di ritentativo, la precedenza dell'autenticazione connect è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token di bootstrap.
    - Nel percorso async della Control UI di Tailscale Serve, i tentativi falliti per la stessa coppia `{scope, ip}` vengono serializzati prima che il limitatore registri il fallimento. Due ritentativi errati concorrenti dallo stesso client possono quindi mostrare `retry later` al secondo tentativo invece di due semplici disallineamenti.
    - `too many failed authentication attempts (retry later)` da un client loopback di origine browser → fallimenti ripetuti dalla stessa `Origin` normalizzata vengono bloccati temporaneamente; un'altra origine localhost usa un bucket separato.
    - `unauthorized` ripetuto dopo quel ritentativo → deriva del token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
    - `gateway connect failed:` → target host/porta/url errato.

  </Accordion>
</AccordionGroup>

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice dettaglio             | Significato                                                                                                                                                                                  | Azione consigliata                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                       | Incolla/imposta il token nel client e riprova. Per i percorsi della dashboard: `openclaw config get gateway.auth.token`, poi incollalo nelle impostazioni della UI di controllo.                                                                                                         |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrispondeva al token di autenticazione del Gateway.                                                                                                                 | Se `canRetryWithDeviceToken=true`, consenti un nuovo tentativo attendibile. I nuovi tentativi con token in cache riutilizzano gli ambiti approvati archiviati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli ambiti richiesti. Se il problema persiste, esegui la [checklist di ripristino della divergenza del token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo in cache è obsoleto o revocato.                                                                                                                                     | Ruota/approva nuovamente il token del dispositivo usando la [CLI dispositivi](/it/cli/devices), quindi riconnettiti.                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list`, poi `openclaw devices approve <requestId>`. Gli upgrade di ambito/ruolo usano lo stesso flusso dopo che hai esaminato l'accesso richiesto.                                                                                     |

<Note>
Le RPC dirette di backend su loopback autenticate con il token/password condiviso del Gateway non dovrebbero dipendere dalla baseline degli ambiti dei dispositivi associati della CLI. Se i subagent o altre chiamate interne continuano a fallire con `scope-upgrade`, verifica che il chiamante usi `client.id: "gateway-client"` e `client.mode: "backend"` e che non forzi un `deviceIdentity` esplicito o un token dispositivo.
</Note>

Controllo migrazione auth dispositivo v2:

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

Se `openclaw devices rotate` / `revoke` / `remove` viene negato inaspettatamente:

- le sessioni con token di dispositivo associato possono gestire solo il **proprio** dispositivo, a meno che il chiamante abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo ambiti operatore che la sessione chiamante già possiede

Correlati:

- [Configurazione](/it/gateway/configuration) (modalità auth del Gateway)
- [UI di controllo](/it/web/control-ui)
- [Dispositivi](/it/cli/devices)
- [Accesso remoto](/it/gateway/remote)
- [Auth proxy attendibile](/it/gateway/trusted-proxy-auth)

## Servizio Gateway non in esecuzione

Usalo quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Cerca:

- `Runtime: stopped` con suggerimenti di uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` rispetto a `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando si usa `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per riapplicare la configurazione in modalità locale prevista. Se esegui OpenClaw tramite Podman, il percorso predefinito della configurazione è `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth Gateway valido (token/password, o trusted-proxy dove configurato).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
    - `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. La maggior parte delle configurazioni dovrebbe mantenere un Gateway per macchina; se ne serve più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` da doctor → esiste un'unità systemd di sistema mentre manca il servizio a livello utente. Rimuovi o disabilita il duplicato prima di consentire a doctor di installare un servizio utente, oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` se l'unità di sistema è il supervisor previsto.
    - `Gateway service port does not match current gateway config` → il supervisor installato fissa ancora la vecchia `--port`. Esegui `openclaw doctor --fix` o `openclaw gateway install --force`, poi riavvia il servizio Gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Exec in background e strumento di processo](/it/gateway/background-process)
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
- Un evento di sistema del main-agent che inizia con `Config recovery warning`

<AccordionGroup>
  <Accordion title="What happened">
    - La configurazione rifiutata non ha superato la validazione durante l'avvio o il ricaricamento a caldo.
    - OpenClaw ha preservato il payload rifiutato come `.clobbered.*`.
    - La configurazione attiva è stata ripristinata dall'ultima copia validata e nota come valida.
    - Il turno successivo del main-agent viene avvisato di non riscrivere alla cieca la configurazione rifiutata.
    - Se tutti i problemi di validazione erano sotto `plugins.entries.<id>...`, OpenClaw non ripristinerebbe l'intero file. Gli errori locali al Plugin restano evidenti mentre le impostazioni utente non correlate rimangono nella configurazione attiva.

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
    - `.clobbered.*` esiste → una modifica diretta esterna o una lettura all'avvio è stata ripristinata.
    - `.rejected.*` esiste → una scrittura di configurazione di proprietà di OpenClaw non ha superato lo schema o i controlli di sovrascrittura prima del commit.
    - `Config write rejected:` → la scrittura ha tentato di rimuovere la struttura richiesta, ridurre drasticamente il file o persistere una configurazione non valida.
    - `Rejected validation details:` → il log di ripristino o l'avviso del main-agent include il percorso dello schema che ha causato il ripristino, come `agents.defaults.execution` o `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → all'avvio il file corrente è stato trattato come sovrascritto perché ha perso campi o dimensioni rispetto al backup valido più recente.
    - `Config last-known-good promotion skipped` → il candidato conteneva placeholder di segreti redatti come `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Mantieni la configurazione attiva ripristinata se è corretta.
    2. Copia solo le chiavi previste da `.clobbered.*` o `.rejected.*`, quindi applicale con `openclaw config set` o `config.patch`.
    3. Esegui `openclaw config validate` prima del riavvio.
    4. Se modifichi a mano, mantieni la configurazione JSON5 completa, non solo l'oggetto parziale che volevi cambiare.
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
- Se l'avviso riguarda fallback SSH, più Gateway, ambiti mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → configurazione SSH non riuscita, ma il comando ha comunque provato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito significa una configurazione multi-Gateway intenzionale o listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma la RPC di dettaglio è limitata dagli ambiti; associa l'identità del dispositivo o usa credenziali con `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → la connessione ha funzionato, ma l'intero set di RPC diagnostiche è andato in timeout o non è riuscito. Trattalo come un Gateway raggiungibile con diagnostica degradata; confronta `connect.ok` e `connect.rpcOk` nell'output `--json`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → il Gateway ha risposto, ma questo client richiede ancora associazione/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef `gateway.auth.*` / `gateway.remote.*` non risolto → il materiale auth non era disponibile in questo percorso di comando per il target non riuscito.

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

- Criterio DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist dei gruppi e requisiti di menzione.
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

## Consegna Cron e Heartbeat

Se Cron o Heartbeat non è stato eseguito o non ha consegnato, verifica prima lo stato dello scheduler, poi la destinazione di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e prossimo risveglio presente.
- Stato della cronologia delle esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di salto Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
    - `cron: timer tick failed` → tick dello scheduler non riuscito; controlla errori di file/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra degli orari attivi.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è dovuta in questo tick.
    - `heartbeat: unknown accountId` → ID account non valido per la destinazione di consegna Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → la destinazione Heartbeat è stata risolta in una destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per agente) è impostato su `block`.

  </Accordion>
</AccordionGroup>

Correlati:

- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)

## Node associato, strumento non riuscito

Se un Node è associato ma gli strumenti non funzionano, isola lo stato di primo piano, permessi e approvazione.

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

- `NODE_BACKGROUND_UNAVAILABLE` → l'app Node deve essere in primo piano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso del sistema operativo mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dall'allowlist.

Correlati:

- [Approvazioni exec](/it/tools/exec-approvals)
- [Risoluzione dei problemi di Node](/it/nodes/troubleshooting)
- [Node](/it/nodes/index)

## Strumento browser non riuscito

Usalo quando le azioni dello strumento browser non riescono anche se il gateway stesso è integro.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cerca:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso valido dell'eseguibile browser.
- Raggiungibilità del profilo CDP.
- Disponibilità locale di Chrome per profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firme Plugin / eseguibile">
    - `unknown command "browser"` o `unknown command 'browser'` → il plugin browser incluso è escluso da `plugins.allow`.
    - strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
    - `Failed to start Chrome CDP on port` → impossibile avviare il processo browser.
    - `browser.executablePath not found` → il percorso configurato non è valido.
    - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta non valida o fuori intervallo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione Gateway corrente non include la dipendenza runtime `playwright-core` del plugin browser incluso; esegui `openclaw doctor --fix`, poi riavvia il Gateway. Gli snapshot ARIA e gli screenshot di base delle pagine possono comunque funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF restano non disponibili.

  </Accordion>
  <Accordion title="Firme Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito a collegarsi alla directory dati browser selezionata. Apri la pagina di ispezione del browser, abilita il debug remoto, mantieni il browser aperto, approva il primo prompt di collegamento, poi riprova. Se lo stato di accesso non è richiesto, preferisci il profilo gestito `openclaw`.
    - `No Chrome tabs found for profile="user"` → il profilo di collegamento Chrome MCP non ha schede Chrome locali aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host Gateway.
    - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo collegamento non ha target raggiungibili, oppure l'endpoint HTTP ha risposto ma non è stato comunque possibile aprire il WebSocket CDP.

  </Accordion>
  <Accordion title="Firme elemento / screenshot / caricamento">
    - `fullPage is not supported for element screenshots` → la richiesta di screenshot ha combinato `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare la cattura della pagina o un `--ref` dello snapshot, non `--element` CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di caricamento Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
    - `existing-session file uploads currently support one file at a time.` → invia un caricamento per chiamata sui profili Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → gli hook dialogo sui profili Chrome MCP non supportano override di timeout.
    - `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un profilo browser gestito o CDP grezzo.
    - override obsoleti di viewport / modalità scura / locale / offline su profili solo collegamento o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero Gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Browser (gestito da OpenClaw)](/it/tools/browser)
- [Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting)

## Se hai aggiornato e qualcosa si è rotto all'improvviso

La maggior parte delle rotture post-aggiornamento è dovuta a deriva della configurazione o a predefiniti più restrittivi ora applicati.

<AccordionGroup>
  <Accordion title="1. Il comportamento di override di autenticazione e URL è cambiato">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cosa controllare:

    - Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il servizio locale funziona correttamente.
    - Le chiamate esplicite `--url` non ripiegano sulle credenziali salvate.

    Firme comuni:

    - `gateway connect failed:` → destinazione URL errata.
    - `unauthorized` → endpoint raggiungibile ma autenticazione errata.

  </Accordion>
  <Accordion title="2. I guardrail di bind e autenticazione sono più restrittivi">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cosa controllare:

    - I bind non-loopback (`lan`, `tailnet`, `custom`) richiedono un percorso di autenticazione Gateway valido: autenticazione con token/password condivisi, oppure una distribuzione `trusted-proxy` non-loopback configurata correttamente.
    - Chiavi precedenti come `gateway.token` non sostituiscono `gateway.auth.token`.

    Firme comuni:

    - `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso di autenticazione Gateway valido.
    - `Connectivity probe: failed` mentre il runtime è in esecuzione → Gateway attivo ma inaccessibile con autenticazione/URL correnti.

  </Accordion>
  <Accordion title="3. Stato di associazione e identità dispositivo cambiato">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cosa controllare:

    - Approvazioni dispositivo in sospeso per dashboard/nodi.
    - Approvazioni di associazione DM in sospeso dopo modifiche a criterio o identità.

    Firme comuni:

    - `device identity required` → autenticazione dispositivo non soddisfatta.
    - `pairing required` → mittente/dispositivo deve essere approvato.

  </Accordion>
</AccordionGroup>

Se la configurazione del servizio e il runtime continuano a non concordare dopo i controlli, reinstalla i metadati del servizio dalla stessa directory di profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [Autenticazione](/it/gateway/authentication)
- [Exec in background e strumento processi](/it/gateway/background-process)
- [Associazione gestita dal Gateway](/it/gateway/pairing)

## Correlati

- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
- [Runbook del Gateway](/it/gateway)
