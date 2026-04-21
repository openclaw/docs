---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Ti servono sezioni di runbook stabili basate sui sintomi con comandi esatti
summary: Runbook di risoluzione avanzata dei problemi per Gateway, canali, automazione, Node e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-21T08:23:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: add7625785e3b78897c750b4785b7fe84a3d91c23c4175de750c4834272967f9
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del Gateway

Questa pagina è il runbook approfondito.
Inizia da [/help/troubleshooting](/it/help/troubleshooting) se vuoi prima il flusso rapido di triage.

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
- `openclaw channels status --probe` mostra stato live del trasporto per account e,
  dove supportato, risultati di probe/audit come `works` oppure `audit ok`.

## Anthropic 429: uso extra richiesto per contesto lungo

Usa questa sezione quando log/errori includono:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Verifica:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea all'uso del contesto lungo.
- Le richieste falliscono solo in sessioni lunghe/esecuzioni del modello che richiedono il percorso beta 1M.

Opzioni di correzione:

1. Disabilita `context1m` per quel modello per tornare alla normale finestra di contesto.
2. Usa una credenziale Anthropic idonea per richieste a contesto lungo, oppure passa a una chiave API Anthropic.
3. Configura modelli di fallback così le esecuzioni continuano quando le richieste Anthropic a contesto lungo vengono rifiutate.

Correlati:

- [/providers/anthropic](/it/providers/anthropic)
- [/reference/token-use](/it/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/it/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Il backend locale compatibile OpenAI supera i probe diretti ma le esecuzioni dell'agente falliscono

Usa questa sezione quando:

- `curl ... /v1/models` funziona
- le chiamate dirette molto piccole a `/v1/chat/completions` funzionano
- le esecuzioni del modello OpenClaw falliscono solo nei normali turni dell'agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Verifica:

- le chiamate dirette molto piccole riescono, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori del backend relativi a `messages[].content` che si aspetta una stringa
- crash del backend che compaiono solo con conteggi di token del prompt più alti o con i prompt runtime completi dell'agente

Firme comuni:

- `messages[...].content: invalid type: sequence, expected a string` → il backend
  rifiuta le parti di contenuto strutturato di Chat Completions. Correzione: imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- le richieste dirette molto piccole riescono, ma le esecuzioni dell'agente OpenClaw falliscono con crash del backend/modello
  (per esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw è
  probabilmente già corretto; il backend sta fallendo sulla forma del prompt runtime
  dell'agente di dimensioni maggiori.
- i fallimenti diminuiscono dopo avere disabilitato gli strumenti ma non scompaiono → gli schemi degli strumenti erano
  parte della pressione, ma il problema restante è comunque a monte: capacità del modello/server
  o bug del backend.

Opzioni di correzione:

1. Imposta `compat.requiresStringContent: true` per backend Chat Completions che accettano solo stringhe.
2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire
   in modo affidabile la superficie degli schemi strumenti di OpenClaw.
3. Riduci la pressione del prompt dove possibile: bootstrap del workspace più piccolo, cronologia
   della sessione più corta, modello locale più leggero o backend con supporto migliore
   per contesti lunghi.
4. Se le richieste dirette molto piccole continuano a funzionare mentre i turni dell'agente OpenClaw continuano a crashare
   nel backend, trattalo come un limite del server/modello upstream e apri lì
   una riproduzione con la forma di payload accettata.

Correlati:

- [/gateway/local-models](/it/gateway/local-models)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non arriva nessuna risposta, controlla routing e policy prima di riconnettere qualunque cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Verifica:

- Pairing in attesa per i mittenti DM.
- Mention gating dei gruppi (`requireMention`, `mentionPatterns`).
- Mancata corrispondenza nelle allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino alla menzione.
- `pairing request` → il mittente richiede approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/pairing](/it/channels/pairing)
- [/channels/groups](/it/channels/groups)

## Connettività della control UI della dashboard

Quando dashboard/control UI non si connette, verifica URL, modalità di autenticazione e presupposti di contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Verifica:

- URL probe corretto e URL dashboard corretto.
- Mancata corrispondenza della modalità/token di autenticazione tra client e gateway.
- Uso HTTP dove è richiesta l'identità del dispositivo.

Firme comuni:

- `device identity required` → contesto non sicuro o autenticazione dispositivo mancante.
- `origin not allowed` → l'`Origin` del browser non è in `gateway.controlUi.allowedOrigins`
  (oppure ti stai connettendo da un'origine browser non loopback senza una
  allowlist esplicita).
- `device nonce required` / `device nonce mismatch` → il client non sta completando il
  flusso di autenticazione dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato
  (o con timestamp scaduto) per l'handshake corrente.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può fare un tentativo affidabile con token dispositivo memorizzato.
- Quel nuovo tentativo con token in cache riusa l'insieme di scope in cache memorizzato con il
  token del dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece
  il loro insieme di scope richiesto.
- Fuori da quel percorso di tentativo, la precedenza di autenticazione della connessione è
  prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token dispositivo memorizzato,
  poi bootstrap token.
- Sul percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter registri il fallimento. Due retry concorrenti non validi
  dallo stesso client possono quindi mostrare `retry later`
  al secondo tentativo invece di due semplici mismatch.
- `too many failed authentication attempts (retry later)` da un client loopback di origine browser →
  i fallimenti ripetuti da quello stesso `Origin` normalizzato vengono temporaneamente bloccati; un'altra origine localhost usa un bucket separato.
- `unauthorized` ripetuto dopo quel tentativo → deriva tra token condiviso e token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
- `gateway connect failed:` → host/porta/target url errato.

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice di dettaglio          | Significato                                                                                                                                                                                  | Azione consigliata                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                        | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` quindi incollalo nelle impostazioni della Control UI.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrisponde al token auth del gateway.                                                                                                                                | Se `canRetryWithDeviceToken=true`, consenti un tentativo affidabile. I retry con token in cache riusano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di recupero deriva del token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per-dispositivo in cache è obsoleto o revocato.                                                                                                                                     | Ruota/riapprova il token dispositivo usando la [CLI devices](/cli/devices), poi riconnettiti.                                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list` quindi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                     |

Controllo migrazione device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Se i log mostrano errori di nonce/firma, aggiorna il client che si connette e verifica che:

1. attenda `connect.challenge`
2. firmi il payload vincolato alla challenge
3. invii `connect.params.device.nonce` con lo stesso nonce della challenge

Se `openclaw devices rotate` / `revoke` / `remove` viene negato in modo inatteso:

- le sessioni con token di dispositivo associato possono gestire solo **il proprio** dispositivo a meno che il
  chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operatore che
  la sessione chiamante già possiede

Correlati:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/it/gateway/configuration) (modalità auth del gateway)
- [/gateway/trusted-proxy-auth](/it/gateway/trusted-proxy-auth)
- [/gateway/remote](/it/gateway/remote)
- [/cli/devices](/cli/devices)

## Servizio Gateway non in esecuzione

Usa questa sezione quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # esegue anche una scansione dei servizi a livello di sistema
```

Verifica:

- `Runtime: stopped` con suggerimenti sull'uscita.
- Mancata corrispondenza nella configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando viene usato `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

Firme comuni:

- `Gateway start blocked: set gateway.mode=local` oppure `existing config is missing gateway.mode` → la modalità gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per ristampare la configurazione attesa per la modalità locale. Se stai eseguendo OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth gateway valido (token/password, oppure trusted-proxy dove configurato).
- `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
- `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. Nella maggior parte delle configurazioni dovrebbe esserci un solo gateway per macchina; se te ne serve più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

Correlati:

- [/gateway/background-process](/it/gateway/background-process)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/doctor](/it/gateway/doctor)

## Il Gateway ha ripristinato la configurazione last-known-good

Usa questa sezione quando il Gateway si avvia, ma i log dicono che ha ripristinato `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Verifica:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un file con timestamp `openclaw.json.clobbered.*` accanto alla configurazione attiva
- Un evento di sistema del main-agent che inizia con `Config recovery warning`

Che cosa è successo:

- La configurazione rifiutata non ha superato la validazione durante l'avvio o il reload a caldo.
- OpenClaw ha conservato il payload rifiutato come `.clobbered.*`.
- La configurazione attiva è stata ripristinata dall'ultima copia validata last-known-good.
- Al turno successivo del main-agent viene segnalato di non riscrivere ciecamente la configurazione rifiutata.

Ispeziona e ripara:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firme comuni:

- `.clobbered.*` esiste → è stato ripristinato un edit diretto esterno o una lettura all'avvio.
- `.rejected.*` esiste → una scrittura di configurazione di proprietà OpenClaw ha fallito i controlli di schema o clobber prima del commit.
- `Config write rejected:` → la scrittura ha tentato di eliminare una struttura richiesta, ridurre drasticamente il file o persistere una configurazione non valida.
- `Config last-known-good promotion skipped` → il candidato conteneva placeholder di segreti redatti come `***`.

Opzioni di correzione:

1. Mantieni la configurazione attiva ripristinata se è corretta.
2. Copia solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, poi applicale con `openclaw config set` o `config.patch`.
3. Esegui `openclaw config validate` prima di riavviare.
4. Se modifichi a mano, mantieni l'intera configurazione JSON5, non solo l'oggetto parziale che volevi cambiare.

Correlati:

- [/gateway/configuration#strict-validation](/it/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/it/gateway/configuration#config-hot-reload)
- [/cli/config](/cli/config)
- [/gateway/doctor](/it/gateway/doctor)

## Avvisi del probe del Gateway

Usa questa sezione quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Verifica:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, gateway multipli, scope mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH è fallita, ma il comando ha comunque provato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito significa una configurazione multi-gateway intenzionale oppure listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma il dettaglio RPC è limitato dagli scope; associa l'identità del dispositivo oppure usa credenziali con `operator.read`.
- `Capability: pairing-pending` oppure `gateway closed (1008): pairing required` → il gateway ha risposto, ma questo client richiede ancora pairing/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef non risolto `gateway.auth.*` / `gateway.remote.*` → il materiale auth non era disponibile in questo percorso del comando per il target fallito.

Correlati:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host)
- [/gateway/remote](/it/gateway/remote)

## Canale connesso ma messaggi che non scorrono

Se lo stato del canale è connected ma il flusso dei messaggi è fermo, concentrati su policy, permessi e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Verifica:

- Policy DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist dei gruppi e requisiti di menzione.
- Permessi/scope API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dalla policy di menzione del gruppo.
- tracce `pairing` / approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di autenticazione/permessi del canale.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/whatsapp](/it/channels/whatsapp)
- [/channels/telegram](/it/channels/telegram)
- [/channels/discord](/it/channels/discord)

## Consegna di Cron e Heartbeat

Se Cron o Heartbeat non sono stati eseguiti o non hanno effettuato la consegna, verifica prima lo stato dello scheduler, poi la destinazione di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Verifica:

- Cron abilitato e prossima attivazione presente.
- Stato della cronologia esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di salto di Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firme comuni:

- `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
- `cron: timer tick failed` → tick dello scheduler fallito; controlla errori di file/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di orario attivo.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è in scadenza in questo tick.
- `heartbeat: unknown accountId` → account id non valido per la destinazione di consegna di Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → la destinazione di Heartbeat è stata risolta come destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per-agent) è impostato su `block`.

Correlati:

- [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/it/automation/cron-jobs)
- [/gateway/heartbeat](/it/gateway/heartbeat)

## Strumento di un Node associato che fallisce

Se un Node è associato ma gli strumenti falliscono, isola lo stato in foreground, i permessi e lo stato di approvazione.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Verifica:

- Node online con le capability attese.
- Permessi OS concessi per camera/microfono/posizione/schermo.
- Stato di approvazioni exec e allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app Node deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla allowlist.

Correlati:

- [/nodes/troubleshooting](/it/nodes/troubleshooting)
- [/nodes/index](/it/nodes/index)
- [/tools/exec-approvals](/it/tools/exec-approvals)

## Lo strumento browser fallisce

Usa questa sezione quando le azioni dello strumento browser falliscono anche se il gateway stesso è sano.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Verifica:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso eseguibile del browser valido.
- Raggiungibilità del profilo CDP.
- Disponibilità di Chrome locale per profili `existing-session` / `user`.

Firme comuni:

- `unknown command "browser"` oppure `unknown command 'browser'` → il plugin browser incluso è escluso da `plugins.allow`.
- strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
- `Failed to start Chrome CDP on port` → il processo del browser non è riuscito ad avviarsi.
- `browser.executablePath not found` → il percorso configurato non è valido.
- `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito ad agganciarsi alla directory dati browser selezionata. Apri la pagina inspect del browser, abilita il remote debugging, mantieni il browser aperto, approva il primo prompt di aggancio, poi riprova. Se non è richiesto uno stato con accesso effettuato, preferisci il profilo gestito `openclaw`.
- `No Chrome tabs found for profile="user"` → il profilo attach di Chrome MCP non ha tab Chrome locali aperte.
- `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del gateway.
- `Browser attachOnly is enabled ... not reachable` oppure `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo attach-only non ha un target raggiungibile, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non può comunque essere aperto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione gateway corrente non include il pacchetto completo Playwright; snapshot ARIA e screenshot di pagina di base possono ancora funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettore CSS ed esportazione PDF restano non disponibili.
- `fullPage is not supported for element screenshots` → la richiesta di screenshot ha mescolato `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare la cattura pagina o un `--ref` da snapshot, non CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di upload file di Chrome MCP richiedono riferimenti snapshot, non selettori CSS.
- `existing-session file uploads currently support one file at a time.` → invia un upload per chiamata sui profili Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → gli hook dialog sui profili Chrome MCP non supportano override di timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP raw.
- override stantii di viewport / dark-mode / locale / offline su profili attach-only o CDP remoto → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

Correlati:

- [/tools/browser-linux-troubleshooting](/it/tools/browser-linux-troubleshooting)
- [/tools/browser](/it/tools/browser)

## Se hai aggiornato e improvvisamente qualcosa si è rotto

La maggior parte dei problemi dopo un aggiornamento deriva da config drift o da impostazioni predefinite più rigide che ora vengono applicate.

### 1) Il comportamento di autenticazione e override URL è cambiato

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cose da controllare:

- Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale è perfettamente funzionante.
- Le chiamate esplicite con `--url` non fanno fallback alle credenziali memorizzate.

Firme comuni:

- `gateway connect failed:` → target URL errato.
- `unauthorized` → endpoint raggiungibile ma autenticazione errata.

### 2) I guardrail di bind e autenticazione sono più rigidi

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Cose da controllare:

- I bind non-loopback (`lan`, `tailnet`, `custom`) richiedono un percorso auth gateway valido: autenticazione con token/password condivisa, oppure una distribuzione `trusted-proxy` non-loopback configurata correttamente.
- Chiavi vecchie come `gateway.token` non sostituiscono `gateway.auth.token`.

Firme comuni:

- `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth gateway valido.
- `Connectivity probe: failed` mentre il runtime è in esecuzione → gateway attivo ma inaccessibile con auth/url correnti.

### 3) Lo stato di pairing e identità del dispositivo è cambiato

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cose da controllare:

- Approvazioni dispositivo in sospeso per dashboard/nodes.
- Approvazioni pairing DM in sospeso dopo modifiche a policy o identità.

Firme comuni:

- `device identity required` → autenticazione dispositivo non soddisfatta.
- `pairing required` → mittente/dispositivo da approvare.

Se la configurazione del servizio e il runtime continuano a non concordare dopo i controlli, reinstalla i metadati del servizio dalla stessa directory di profilo/stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [/gateway/pairing](/it/gateway/pairing)
- [/gateway/authentication](/it/gateway/authentication)
- [/gateway/background-process](/it/gateway/background-process)
