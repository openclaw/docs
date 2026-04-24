---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Hai bisogno di sezioni del runbook basate sui sintomi con comandi esatti
summary: Runbook approfondito di risoluzione dei problemi per Gateway, canali, automazione, Node e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-24T08:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del Gateway

Questa pagina è il runbook approfondito.
Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso di triage rapido.

## Sequenza di comandi

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
- `openclaw channels status --probe` mostra stato di trasporto live per account e,
  dove supportato, risultati di probe/audit come `works` o `audit ok`.

## Anthropic 429 extra usage required for long context

Usa questa sezione quando log/errori includono:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Cerca:

- Il modello Opus/Sonnet Anthropic selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso del contesto lungo.
- Le richieste falliscono solo su sessioni/esecuzioni modello lunghe che richiedono il percorso beta da 1M.

Opzioni di correzione:

1. Disabilita `context1m` per quel modello per tornare alla normale finestra di contesto.
2. Usa una credenziale Anthropic idonea per richieste a contesto lungo, oppure passa a una chiave API Anthropic.
3. Configura modelli di fallback così le esecuzioni continuano quando le richieste Anthropic a contesto lungo vengono rifiutate.

Correlati:

- [/providers/anthropic](/it/providers/anthropic)
- [/reference/token-use](/it/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/it/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend locale compatibile OpenAI supera probe dirette ma le esecuzioni dell'agente falliscono

Usa questa sezione quando:

- `curl ... /v1/models` funziona
- piccole chiamate dirette a `/v1/chat/completions` funzionano
- le esecuzioni del modello in OpenClaw falliscono solo nei normali turni dell'agente

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
- errori del backend su `messages[].content` che si aspetta una stringa
- crash del backend che compaiono solo con prompt più grandi in termini di token o con prompt completi del runtime dell'agente

Firme comuni:

- `messages[...].content: invalid type: sequence, expected a string` → il backend
  rifiuta parti di contenuto strutturate di Chat Completions. Correzione: imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- piccole richieste dirette riescono, ma le esecuzioni dell'agente OpenClaw falliscono con crash del backend/modello
  (per esempio Gemma su alcune build `inferrs`) → probabilmente il trasporto OpenClaw è già corretto; è il backend a fallire sul formato più ampio del prompt del runtime dell'agente.
- i fallimenti diminuiscono dopo aver disabilitato gli strumenti ma non spariscono → gli schemi degli strumenti
  facevano parte della pressione, ma il problema residuo è ancora una limitazione a monte del modello/server
  o un bug del backend.

Opzioni di correzione:

1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire
   in modo affidabile la superficie di schema degli strumenti di OpenClaw.
3. Riduci la pressione del prompt dove possibile: bootstrap del workspace più piccolo, cronologia
   della sessione più corta, modello locale più leggero o un backend con supporto più forte
   per contesto lungo.
4. Se le piccole richieste dirette continuano a passare mentre i turni dell'agente OpenClaw continuano a crashare
   nel backend, trattalo come una limitazione del server/modello a monte e apri lì un repro con il formato di payload accettato.

Correlati:

- [/gateway/local-models](/it/gateway/local-models)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non arriva nessuna risposta, controlla instradamento e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Cerca:

- Associazione in sospeso per i mittenti DM.
- Vincolo delle menzioni nei gruppi (`requireMention`, `mentionPatterns`).
- Mancata corrispondenza delle allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino alla menzione.
- `pairing request` → il mittente richiede approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/pairing](/it/channels/pairing)
- [/channels/groups](/it/channels/groups)

## Connettività della dashboard Control UI

Quando dashboard/Control UI non si connette, verifica URL, modalità auth e ipotesi di contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL probe corretto e URL dashboard corretto.
- Mancata corrispondenza tra modalità auth/token tra client e Gateway.
- Uso HTTP dove è richiesta l'identità del dispositivo.

Firme comuni:

- `device identity required` → contesto non sicuro o auth del dispositivo mancante.
- `origin not allowed` → l'`Origin` del browser non è in `gateway.controlUi.allowedOrigins`
  (oppure ti stai connettendo da un'origine browser non loopback senza una
  allowlist esplicita).
- `device nonce required` / `device nonce mismatch` → il client non sta completando
  il flusso di auth del dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato
  (o con timestamp obsoleto) per l'handshake corrente.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può fare un retry attendibile con token dispositivo in cache.
- Quel retry con token in cache riusa l'insieme di scope in cache memorizzato con il token
  del dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece l'insieme di scope richiesto.
- Al di fuori di quel percorso di retry, la precedenza auth di connect è:
  token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato,
  poi bootstrap token.
- Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter registri il fallimento. Due retry concorrenti errati dallo stesso client possono quindi mostrare `retry later`
  al secondo tentativo invece di due semplici mismatch.
- `too many failed authentication attempts (retry later)` da un client loopback con origine browser → i fallimenti ripetuti dalla stessa `Origin` normalizzata vengono temporaneamente bloccati; un'altra origine localhost usa un bucket separato.
- `unauthorized` ripetuti dopo quel retry → deriva tra token condiviso e token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token del dispositivo se necessario.
- `gateway connect failed:` → host/porta/url di destinazione errati.

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla response `connect` fallita per scegliere l'azione successiva:

| Detail code                  | Significato                                                                                                                                                                                  | Azione consigliata                                                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                       | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` quindi incollalo nelle impostazioni della Control UI.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrisponde al token auth del Gateway.                                                                                                                                | Se `canRetryWithDeviceToken=true`, consenti un retry attendibile. I retry con token in cache riusano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di recupero della deriva del token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo in cache è obsoleto o revocato.                                                                                                                                     | Ruota/riapprova il token del dispositivo usando la [CLI devices](/it/cli/devices), poi riconnettiti.                                                                                                                                                                                       |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list` poi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                      |

Controllo migrazione auth dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiorna il client che si connette e verifica che:

1. aspetti `connect.challenge`
2. firmi il payload vincolato alla challenge
3. invii `connect.params.device.nonce` con lo stesso nonce della challenge

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo inatteso:

- le sessioni con token del dispositivo associato possono gestire solo **il proprio**
  dispositivo a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operator che
  la sessione chiamante già possiede

Correlati:

- [/web/control-ui](/it/web/control-ui)
- [/gateway/configuration](/it/gateway/configuration) (modalità auth del Gateway)
- [/gateway/trusted-proxy-auth](/it/gateway/trusted-proxy-auth)
- [/gateway/remote](/it/gateway/remote)
- [/cli/devices](/it/cli/devices)

## Il servizio Gateway non è in esecuzione

Usa questa sezione quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # esegue anche la scansione dei servizi a livello di sistema
```

Cerca:

- `Runtime: stopped` con suggerimenti sull'uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando si usa `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

Firme comuni:

- `Gateway start blocked: set gateway.mode=local` oppure `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato clobbered e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per ristampare la configurazione attesa per la modalità locale. Se stai eseguendo OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non loopback senza un percorso auth Gateway valido (token/password, oppure trusted-proxy dove configurato).
- `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
- `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. Nella maggior parte delle configurazioni dovrebbe esserci un solo Gateway per macchina; se te ne serve più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

Correlati:

- [/gateway/background-process](/it/gateway/background-process)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/doctor](/it/gateway/doctor)

## Il Gateway ha ripristinato l'ultima configurazione valida

Usa questa sezione quando il Gateway si avvia, ma i log dicono che ha ripristinato `openclaw.json`.

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

Cosa è successo:

- La configurazione rifiutata non ha superato la validazione durante l'avvio o l'hot reload.
- OpenClaw ha preservato il payload rifiutato come `.clobbered.*`.
- La configurazione attiva è stata ripristinata dall'ultima copia valida verificata.
- Il turno successivo dell'agente principale viene avvisato di non riscrivere ciecamente la configurazione rifiutata.

Ispezionare e riparare:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firme comuni:

- esiste `.clobbered.*` → una modifica esterna diretta o una lettura all'avvio è stata ripristinata.
- esiste `.rejected.*` → una scrittura di configurazione gestita da OpenClaw ha fallito i controlli di schema o clobber prima del commit.
- `Config write rejected:` → la scrittura ha tentato di rimuovere una forma richiesta, ridurre drasticamente il file o rendere persistente una configurazione non valida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oppure `size-drop-vs-last-good:*` → all'avvio il file corrente è stato trattato come clobbered perché ha perso campi o dimensioni rispetto al backup dell'ultima configurazione valida.
- `Config last-known-good promotion skipped` → la candidata conteneva placeholder di segreti redatti come `***`.

Opzioni di correzione:

1. Mantieni la configurazione attiva ripristinata se è corretta.
2. Copia solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, poi applicale con `openclaw config set` o `config.patch`.
3. Esegui `openclaw config validate` prima di riavviare.
4. Se modifichi a mano, conserva l'intera configurazione JSON5, non solo l'oggetto parziale che volevi cambiare.

Correlati:

- [/gateway/configuration#strict-validation](/it/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/it/gateway/configuration#config-hot-reload)
- [/cli/config](/it/cli/config)
- [/gateway/doctor](/it/gateway/doctor)

## Avvisi di probe del Gateway

Usa questa sezione quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda il fallback SSH, più Gateway, scope mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH è fallita, ma il comando ha comunque provato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → più di un target ha risposto. Di solito questo indica una configurazione intenzionale con più Gateway o listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma il dettaglio RPC è limitato dagli scope; associa l'identità del dispositivo o usa credenziali con `operator.read`.
- `Capability: pairing-pending` oppure `gateway closed (1008): pairing required` → il Gateway ha risposto, ma questo client richiede ancora associazione/approvazione prima del normale accesso operator.
- testo di avviso sui SecretRef `gateway.auth.*` / `gateway.remote.*` non risolti → il materiale auth non era disponibile in questo percorso di comando per il target fallito.

Correlati:

- [/cli/gateway](/it/cli/gateway)
- [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host)
- [/gateway/remote](/it/gateway/remote)

## Il canale è connesso ma i messaggi non scorrono

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
- tracce `pairing` / approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di auth/permessi del canale.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/whatsapp](/it/channels/whatsapp)
- [/channels/telegram](/it/channels/telegram)
- [/channels/discord](/it/channels/discord)

## Consegna di Cron e Heartbeat

Se Cron o Heartbeat non sono stati eseguiti o non hanno consegnato, verifica prima lo stato dello scheduler, poi il target di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e presenza del prossimo wake.
- Stato della cronologia delle esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di skip di Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firme comuni:

- `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
- `cron: timer tick failed` → tick dello scheduler fallito; controlla errori di file/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di orario attivo.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è dovuta in questo tick.
- `heartbeat: unknown accountId` → account id non valido per il target di consegna di Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → il target di Heartbeat è stato risolto in una destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per agente) è impostato su `block`.

Correlati:

- [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/it/automation/cron-jobs)
- [/gateway/heartbeat](/it/gateway/heartbeat)

## Lo strumento del Node associato fallisce

Se un Node è associato ma gli strumenti falliscono, isola stato foreground, permessi e approvazioni.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Node online con le capacità previste.
- Permessi del sistema operativo per camera/microfono/posizione/schermo.
- Stato delle approvazioni exec e della allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del Node deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla allowlist.

Correlati:

- [/nodes/troubleshooting](/it/nodes/troubleshooting)
- [/nodes/index](/it/nodes/index)
- [/tools/exec-approvals](/it/tools/exec-approvals)

## Lo strumento browser fallisce

Usa questa sezione quando le azioni dello strumento browser falliscono anche se il Gateway è sano.

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

Firme comuni:

- `unknown command "browser"` oppure `unknown command 'browser'` → il plugin browser incluso è escluso da `plugins.allow`.
- browser tool mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
- `Failed to start Chrome CDP on port` → il processo browser non è riuscito ad avviarsi.
- `browser.executablePath not found` → il percorso configurato non è valido.
- `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito ad agganciarsi alla directory dati browser selezionata. Apri la pagina inspect del browser, abilita il debug remoto, mantieni il browser aperto, approva il primo prompt di attach, poi riprova. Se non è richiesto lo stato signed-in, preferisci il profilo gestito `openclaw`.
- `No Chrome tabs found for profile="user"` → il profilo di attach Chrome MCP non ha schede Chrome locali aperte.
- `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host Gateway.
- `Browser attachOnly is enabled ... not reachable` oppure `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo attach-only non ha un target raggiungibile, oppure l'endpoint HTTP ha risposto ma non è stato comunque possibile aprire il WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del Gateway non include la dipendenza runtime `playwright-core` del plugin browser incluso; esegui `openclaw doctor --fix`, poi riavvia il Gateway. Gli snapshot ARIA e gli screenshot di pagina di base possono comunque funzionare, ma navigazione, snapshot AI, screenshot di elementi tramite selettore CSS ed esportazione PDF restano non disponibili.
- `fullPage is not supported for element screenshots` → la richiesta di screenshot ha mischiato `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot di Chrome MCP / `existing-session` devono usare la cattura di pagina o un `--ref` da snapshot, non un selettore CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di upload file di Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
- `existing-session file uploads currently support one file at a time.` → invia un solo upload per chiamata sui profili Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → gli hook delle finestre di dialogo sui profili Chrome MCP non supportano override di timeout.
- `existing-session type does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:type` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
- `existing-session evaluate does not support timeoutMs overrides.` → ometti `timeoutMs` per `act:evaluate` su profili `profile="user"` / Chrome MCP existing-session, oppure usa un profilo browser gestito/CDP quando è richiesto un timeout personalizzato.
- `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP raw.
- override obsoleti di viewport / dark-mode / locale / offline su profili attach-only o remote CDP → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero Gateway.

Correlati:

- [/tools/browser-linux-troubleshooting](/it/tools/browser-linux-troubleshooting)
- [/tools/browser](/it/tools/browser)

## Se hai aggiornato e qualcosa si è improvvisamente rotto

La maggior parte delle rotture dopo un aggiornamento è dovuta a deriva della configurazione o a valori predefiniti più rigorosi che ora vengono applicati.

### 1) Sono cambiati il comportamento di auth e gli override URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cosa controllare:

- Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale funziona bene.
- Le chiamate esplicite con `--url` non usano come fallback le credenziali memorizzate.

Firme comuni:

- `gateway connect failed:` → URL target errato.
- `unauthorized` → endpoint raggiungibile ma auth errata.

### 2) I guardrail su bind e auth sono più rigorosi

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Cosa controllare:

- I bind non loopback (`lan`, `tailnet`, `custom`) richiedono un percorso auth Gateway valido: auth con token/password condivisi, oppure un deployment `trusted-proxy` non loopback configurato correttamente.
- Chiavi vecchie come `gateway.token` non sostituiscono `gateway.auth.token`.

Firme comuni:

- `refusing to bind gateway ... without auth` → bind non loopback senza un percorso auth Gateway valido.
- `Connectivity probe: failed` mentre il runtime è in esecuzione → Gateway vivo ma inaccessibile con auth/url correnti.

### 3) Sono cambiati lo stato di associazione e identità del dispositivo

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cosa controllare:

- Approvazioni di dispositivi in sospeso per dashboard/Node.
- Approvazioni DM in sospeso dopo modifiche di policy o identità.

Firme comuni:

- `device identity required` → auth del dispositivo non soddisfatta.
- `pairing required` → mittente/dispositivo deve essere approvato.

Se la configurazione del servizio e il runtime continuano a non coincidere dopo i controlli, reinstalla i metadati del servizio dallo stesso profilo/directory di stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [/gateway/pairing](/it/gateway/pairing)
- [/gateway/authentication](/it/gateway/authentication)
- [/gateway/background-process](/it/gateway/background-process)

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Doctor](/it/gateway/doctor)
- [FAQ](/it/help/faq)
