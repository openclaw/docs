---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Hai bisogno di sezioni runbook stabili basate sui sintomi con comandi esatti
sidebarTitle: Troubleshooting
summary: Runbook approfondito per la risoluzione dei problemi di gateway, canali, automazione, node e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-26T11:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Questa pagina è il runbook approfondito. Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso rapido di triage.

## Scala dei comandi

Esegui prima questi, in quest'ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Segnali attesi di stato sano:

- `openclaw gateway status` mostra `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...`.
- `openclaw doctor` non segnala problemi bloccanti di configurazione/servizio.
- `openclaw channels status --probe` mostra lo stato live del trasporto per account e, dove supportato, risultati probe/audit come `works` o `audit ok`.

## Installazioni split brain e protezione della configurazione più recente

Usalo quando un servizio gateway si arresta inaspettatamente dopo un aggiornamento, oppure i log mostrano che un binario `openclaw` è più vecchio della versione che ha scritto per ultima `openclaw.json`.

OpenClaw marca le scritture di configurazione con `meta.lastTouchedVersion`. I comandi in sola lettura possono ancora ispezionare una configurazione scritta da una versione più recente di OpenClaw, ma le mutazioni di processo e servizio si rifiutano di continuare da un binario più vecchio. Le azioni bloccate includono avvio, arresto, riavvio, disinstallazione del servizio gateway, reinstallazione forzata del servizio, avvio del gateway in modalità servizio e pulizia della porta con `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Correggi PATH">
    Correggi `PATH` in modo che `openclaw` risolva l'installazione più recente, poi riesegui l'azione.
  </Step>
  <Step title="Reinstalla il servizio gateway">
    Reinstalla il servizio gateway previsto dall'installazione più recente:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Rimuovi wrapper obsoleti">
    Rimuovi i pacchetti di sistema obsoleti o le vecchie voci wrapper che puntano ancora a un vecchio binario `openclaw`.
  </Step>
</Steps>

<Warning>
Solo per downgrade intenzionali o recupero d'emergenza, imposta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` per il singolo comando. Lascia la variabile non impostata per il normale funzionamento.
</Warning>

## Anthropic 429 uso extra richiesto per contesto lungo

Usalo quando log/errori includono: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso long-context.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni modello che richiedono il percorso beta 1M.

Opzioni di correzione:

<Steps>
  <Step title="Disabilita context1m">
    Disabilita `context1m` per quel modello per tornare alla normale finestra di contesto.
  </Step>
  <Step title="Usa una credenziale idonea">
    Usa una credenziale Anthropic idonea per richieste long-context, oppure passa a una chiave API Anthropic.
  </Step>
  <Step title="Configura modelli di fallback">
    Configura modelli di fallback così le esecuzioni continuano quando le richieste Anthropic long-context vengono rifiutate.
  </Step>
</Steps>

Correlati:

- [Anthropic](/it/providers/anthropic)
- [Uso dei token e costi](/it/reference/token-use)
- [Perché vedo HTTP 429 da Anthropic?](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend locale compatibile OpenAI supera le probe dirette ma le esecuzioni dell'agente falliscono

Usalo quando:

- `curl ... /v1/models` funziona
- le piccole chiamate dirette a `/v1/chat/completions` funzionano
- le esecuzioni modello di OpenClaw falliscono solo nei normali turni dell'agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Cerca:

- le piccole chiamate dirette hanno successo, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori del backend su `messages[].content` che si aspetta una stringa
- crash del backend che compaiono solo con conteggi di token del prompt più alti o con i prompt completi del runtime dell'agente

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `messages[...].content: invalid type: sequence, expected a string` → il backend rifiuta parti di contenuto strutturato di Chat Completions. Correzione: imposta `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - le piccole richieste dirette hanno successo, ma i turni dell'agente OpenClaw falliscono con crash del backend/modello (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw è probabilmente già corretto; è il backend che fallisce sulla forma più grande del prompt del runtime dell'agente.
    - i fallimenti diminuiscono dopo aver disabilitato gli strumenti ma non scompaiono → gli schemi degli strumenti facevano parte della pressione, ma il problema residuo è comunque la capacità a monte del modello/server o un bug del backend.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
    2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire in modo affidabile la superficie dello schema strumenti di OpenClaw.
    3. Riduci la pressione del prompt dove possibile: bootstrap del workspace più piccolo, cronologia di sessione più corta, modello locale più leggero o backend con supporto migliore per contesti lunghi.
    4. Se le piccole richieste dirette continuano a funzionare mentre i turni dell'agente OpenClaw vanno ancora in crash nel backend, trattalo come un limite del server/modello a monte e apri lì una segnalazione con repro e forma del payload accettata.
  </Accordion>
</AccordionGroup>

Correlati:

- [Configurazione](/it/gateway/configuration)
- [Modelli locali](/it/gateway/local-models)
- [Endpoint compatibili OpenAI](/it/gateway/configuration-reference#openai-compatible-endpoints)

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

- Pairing in attesa per mittenti DM.
- Protezione da menzione di gruppo (`requireMention`, `mentionPatterns`).
- Mancate corrispondenze nelle allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino alla menzione.
- `pairing request` → il mittente necessita di approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Gruppi](/it/channels/groups)
- [Abbinamento](/it/channels/pairing)

## Connettività della dashboard Control UI

Quando dashboard/control UI non si connette, verifica URL, modalità auth e ipotesi di contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL probe e URL dashboard corretti.
- Mancata corrispondenza della modalità auth/token tra client e gateway.
- Uso HTTP dove è richiesta l'identità del dispositivo.

<AccordionGroup>
  <Accordion title="Firme di connessione / auth">
    - `device identity required` → contesto non sicuro o auth del dispositivo mancante.
    - `origin not allowed` → `Origin` del browser non è in `gateway.controlUi.allowedOrigins` (oppure ti stai collegando da un'origine browser non loopback senza allowlist esplicita).
    - `device nonce required` / `device nonce mismatch` → il client non sta completando il flusso di auth del dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato (o un timestamp scaduto) per l'handshake corrente.
    - `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può effettuare un retry affidabile usando il token dispositivo memorizzato.
    - Quel retry con token memorizzato riusa l'insieme di scope memorizzato con il token dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
    - Fuori da quel percorso di retry, la precedenza auth di connessione è: token/password condiviso esplicito per primo, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi bootstrap token.
    - Sul percorso asincrono Tailscale Serve della Control UI, i tentativi falliti per lo stesso `{scope, ip}` vengono serializzati prima che il limiter registri l'errore. Due retry concorrenti errati dallo stesso client possono quindi mostrare `retry later` al secondo tentativo invece di due semplici mismatch.
    - `too many failed authentication attempts (retry later)` da un client browser-origin loopback → i fallimenti ripetuti dalla stessa `Origin` normalizzata vengono temporaneamente bloccati; un'altra origine localhost usa un bucket separato.
    - `repeated unauthorized` dopo quel retry → deriva del token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
    - `gateway connect failed:` → target host/porta/url errato.

  </Accordion>
</AccordionGroup>

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice di dettaglio          | Significato                                                                                                                                                                                   | Azione consigliata                                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                       | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` poi incollalo nelle impostazioni della Control UI.                                                                                                                 |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrisponde al token auth del gateway.                                                                                                                                | Se `canRetryWithDeviceToken=true`, consenti un retry affidabile. I retry con token memorizzato riusano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di recupero deriva token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo memorizzato nella cache è obsoleto o revocato.                                                                                                                      | Ruota/riapprova il token dispositivo usando la [CLI devices](/it/cli/devices), poi riconnettiti.                                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | L'identità del dispositivo necessita di approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list` poi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                      |

<Note>
Le RPC backend dirette su loopback autenticate con il token/password condiviso del gateway non dovrebbero dipendere dalla baseline degli scope del dispositivo associato della CLI. Se sottoagenti o altre chiamate interne continuano a fallire con `scope-upgrade`, verifica che il chiamante stia usando `client.id: "gateway-client"` e `client.mode: "backend"` e che non stia forzando un `deviceIdentity` esplicito o un token dispositivo.
</Note>

Controllo migrazione device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori nonce/firma, aggiorna il client che si connette e verifica questo flusso:

<Steps>
  <Step title="Attendi connect.challenge">
    Il client attende `connect.challenge` emesso dal gateway.
  </Step>
  <Step title="Firma il payload">
    Il client firma il payload associato alla challenge.
  </Step>
  <Step title="Invia il nonce del dispositivo">
    Il client invia `connect.params.device.nonce` con lo stesso challenge nonce.
  </Step>
</Steps>

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo imprevisto:

- le sessioni con token di dispositivo associato possono gestire solo **il proprio** dispositivo, a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operatore che la sessione chiamante possiede già

Correlati:

- [Configurazione](/it/gateway/configuration) (modalità auth del gateway)
- [Control UI](/it/web/control-ui)
- [Devices](/it/cli/devices)
- [Accesso remoto](/it/gateway/remote)
- [Auth trusted proxy](/it/gateway/trusted-proxy-auth)

## Servizio Gateway non in esecuzione

Usalo quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # esamina anche i servizi a livello di sistema
```

Cerca:

- `Runtime: stopped` con indizi di uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando si usa `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `Gateway start blocked: set gateway.mode=local` oppure `existing config is missing gateway.mode` → la modalità gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per rimarcare la configurazione attesa in modalità locale. Se esegui OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth gateway valido (token/password, oppure trusted-proxy dove configurato).
    - `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
    - `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. Nella maggior parte delle configurazioni si dovrebbe mantenere un solo gateway per macchina; se te ne serve più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

Correlati:

- [Exec in background e strumento process](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Doctor](/it/gateway/doctor)

## Il Gateway ha ripristinato la configurazione last-known-good

Usalo quando il Gateway si avvia, ma i log dicono che ha ripristinato `openclaw.json`.

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
- Un evento di sistema del main agent che inizia con `Config recovery warning`

<AccordionGroup>
  <Accordion title="Cosa è successo">
    - La configurazione rifiutata non ha superato la validazione durante avvio o hot reload.
    - OpenClaw ha conservato il payload rifiutato come `.clobbered.*`.
    - La configurazione attiva è stata ripristinata dall'ultima copia validata last-known-good.
    - Il turno successivo del main agent viene avvisato di non riscrivere ciecamente la configurazione rifiutata.
    - Se tutti i problemi di validazione erano sotto `plugins.entries.<id>...`, OpenClaw non ripristina l'intero file. I guasti locali dei Plugin restano evidenti mentre le impostazioni utente non correlate rimangono nella configurazione attiva.

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
    - esiste `.clobbered.*` → un editing diretto esterno o una lettura in avvio è stato ripristinato.
    - esiste `.rejected.*` → una scrittura di configurazione di proprietà di OpenClaw ha fallito controlli di schema o clobber prima del commit.
    - `Config write rejected:` → la scrittura ha tentato di rimuovere una forma richiesta, ridurre bruscamente il file o persistere una configurazione non valida.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oppure `size-drop-vs-last-good:*` → all'avvio il file corrente è stato trattato come clobbered perché ha perso campi o dimensione rispetto al backup last-known-good.
    - `Config last-known-good promotion skipped` → il candidato conteneva segnaposto di segreti oscurati come `***`.

  </Accordion>
  <Accordion title="Opzioni di correzione">
    1. Mantieni la configurazione attiva ripristinata se è corretta.
    2. Copia solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, poi applicale con `openclaw config set` o `config.patch`.
    3. Esegui `openclaw config validate` prima di riavviare.
    4. Se modifichi a mano, mantieni l'intera configurazione JSON5, non solo l'oggetto parziale che volevi cambiare.
  </Accordion>
</AccordionGroup>

Correlati:

- [Config](/it/cli/config)
- [Configurazione: hot reload](/it/gateway/configuration#config-hot-reload)
- [Configurazione: validazione rigorosa](/it/gateway/configuration#strict-validation)
- [Doctor](/it/gateway/doctor)

## Avvisi della probe Gateway

Usalo quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, gateway multipli, scope mancanti o SecretRef auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH è fallita, ma il comando ha comunque tentato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → più di un target ha risposto. Di solito significa una configurazione intenzionale multi-gateway oppure listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma l'RPC di dettaglio è limitata dagli scope; associa un'identità dispositivo oppure usa credenziali con `operator.read`.
- `Capability: pairing-pending` oppure `gateway closed (1008): pairing required` → il gateway ha risposto, ma questo client ha ancora bisogno di pairing/approvazione prima del normale accesso operatore.
- testo di avviso per SecretRef `gateway.auth.*` / `gateway.remote.*` non risolti → il materiale auth non era disponibile in questo percorso di comando per il target fallito.

Correlati:

- [Gateway](/it/cli/gateway)
- [Gateway multipli sullo stesso host](/it/gateway#multiple-gateways-same-host)
- [Accesso remoto](/it/gateway/remote)

## Canale connesso, messaggi non in flusso

Se lo stato del canale è connesso ma il flusso dei messaggi è fermo, concentrati su policy, permessi e regole di consegna specifiche del canale.

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
- Permessi/scope API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dalla policy di menzione del gruppo.
- `pairing` / tracce di approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di auth/permessi del canale.

Correlati:

- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
- [Discord](/it/channels/discord)
- [Telegram](/it/channels/telegram)
- [WhatsApp](/it/channels/whatsapp)

## Consegna Cron e Heartbeat

Se Cron o Heartbeat non sono stati eseguiti o non hanno consegnato, verifica prima lo stato dello scheduler, poi il target di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e prossima riattivazione presente.
- Stato della cronologia delle esecuzioni del processo (`ok`, `skipped`, `error`).
- Motivi di salto di Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Firme comuni">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
    - `cron: timer tick failed` → il tick dello scheduler è fallito; controlla errori di file/log/runtime.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di ore attive.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
    - `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è dovuta in questo tick.
    - `heartbeat: unknown accountId` → id account non valido per il target di consegna Heartbeat.
    - `heartbeat skipped` con `reason=dm-blocked` → il target Heartbeat è stato risolto in una destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (oppure l'override per agente) è impostato su `block`.

  </Accordion>
</AccordionGroup>

Correlati:

- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
- [Attività pianificate: risoluzione dei problemi](/it/automation/cron-jobs#troubleshooting)

## Node associato, strumento non riuscito

Se un node è associato ma gli strumenti falliscono, isola stato foreground, permessi e approvazioni.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Node online con le capacità previste.
- Permessi OS concessi per camera/microfono/posizione/schermo.
- Approvazioni exec e stato dell'allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app node deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dall'allowlist.

Correlati:

- [Approvazioni exec](/it/tools/exec-approvals)
- [Risoluzione dei problemi dei node](/it/nodes/troubleshooting)
- [Nodes](/it/nodes/index)

## Lo strumento Browser fallisce

Usalo quando le azioni dello strumento Browser falliscono anche se il gateway stesso è sano.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Cerca:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso eseguibile del browser valido.
- Raggiungibilità del profilo CDP.
- Disponibilità di Chrome locale per i profili `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Firme Plugin / eseguibile">
    - `unknown command "browser"` oppure `unknown command 'browser'` → il Plugin browser incluso nel bundle è escluso da `plugins.allow`.
    - browser tool mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il Plugin non è mai stato caricato.
    - `Failed to start Chrome CDP on port` → il processo browser non è riuscito ad avviarsi.
    - `browser.executablePath not found` → il percorso configurato non è valido.
    - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
    - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del gateway non ha la dipendenza runtime `playwright-core` del Plugin browser incluso nel bundle; esegui `openclaw doctor --fix`, poi riavvia il gateway. Gli snapshot ARIA e gli screenshot di pagina di base possono comunque funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF restano non disponibili.

  </Accordion>
  <Accordion title="Firme Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito a collegarsi alla directory dati del browser selezionata. Apri la pagina di ispezione del browser, abilita il debug remoto, mantieni il browser aperto, approva il primo prompt di collegamento, poi riprova. Se non è richiesto lo stato con accesso effettuato, preferisci il profilo gestito `openclaw`.
    - `No Chrome tabs found for profile="user"` → il profilo di collegamento Chrome MCP non ha schede Chrome locali aperte.
    - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del gateway.
    - `Browser attachOnly is enabled ... not reachable` oppure `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo attach-only non ha un target raggiungibile, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non è comunque riuscito ad aprirsi.

  </Accordion>
  <Accordion title="Firme di elemento / screenshot / upload">
    - `fullPage is not supported for element screenshots` → la richiesta screenshot ha mescolato `--full-page` con `--ref` o `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare la cattura di pagina o un `--ref` da snapshot, non un CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook upload di Chrome MCP richiedono ref snapshot, non selettori CSS.
    - `existing-session file uploads currently support one file at a time.` → invia un solo upload per chiamata sui profili Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → gli hook per finestre di dialogo sui profili Chrome MCP non supportano override di timeout.
    - `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su `profile="user"` / profili Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su `profile="user"` / profili Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP grezzo.
    - override obsoleti di viewport / dark-mode / locale / offline su profili attach-only o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

  </Accordion>
</AccordionGroup>

Correlati:

- [Browser (gestito da OpenClaw)](/it/tools/browser)
- [Risoluzione dei problemi del Browser](/it/tools/browser-linux-troubleshooting)

## Se hai aggiornato e qualcosa si è improvvisamente rotto

La maggior parte dei problemi post-aggiornamento deriva da deriva della configurazione o da valori predefiniti più rigidi ora applicati.

<AccordionGroup>
  <Accordion title="1. Il comportamento di auth e override URL è cambiato">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Cosa controllare:

    - Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale sta bene.
    - Le chiamate esplicite con `--url` non usano fallback alle credenziali memorizzate.

    Firme comuni:

    - `gateway connect failed:` → target URL errato.
    - `unauthorized` → endpoint raggiungibile ma auth errata.

  </Accordion>
  <Accordion title="2. I guardrail di bind e auth sono più rigidi">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Cosa controllare:

    - I bind non-loopback (`lan`, `tailnet`, `custom`) richiedono un percorso auth del gateway valido: auth con token/password condiviso, oppure un deployment `trusted-proxy` non-loopback configurato correttamente.
    - Vecchie chiavi come `gateway.token` non sostituiscono `gateway.auth.token`.

    Firme comuni:

    - `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth gateway valido.
    - `Connectivity probe: failed` mentre il runtime è in esecuzione → gateway attivo ma non accessibile con l'auth/url attuale.

  </Accordion>
  <Accordion title="3. Lo stato di pairing e identità del dispositivo è cambiato">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Cosa controllare:

    - Approvazioni dispositivo in sospeso per dashboard/node.
    - Approvazioni di pairing DM in sospeso dopo cambiamenti di policy o identità.

    Firme comuni:

    - `device identity required` → auth del dispositivo non soddisfatta.
    - `pairing required` → mittente/dispositivo deve essere approvato.

  </Accordion>
</AccordionGroup>

Se la configurazione del servizio e il runtime continuano a non corrispondere dopo i controlli, reinstalla i metadati del servizio dalla stessa directory profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [Autenticazione](/it/gateway/authentication)
- [Exec in background e strumento process](/it/gateway/background-process)
- [Pairing gestito dal gateway](/it/gateway/pairing)

## Correlati

- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
- [Runbook del Gateway](/it/gateway)
