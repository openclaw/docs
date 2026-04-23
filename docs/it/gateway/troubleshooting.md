---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Hai bisogno di sezioni di runbook stabili basate sui sintomi con comandi esatti
summary: Runbook approfondito di risoluzione dei problemi per gateway, canali, automazione, nodi e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-23T08:29:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
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

## Anthropic 429 utilizzo aggiuntivo richiesto per contesto lungo

Usa questa sezione quando log/errori includono:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Controlla:

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso con contesto lungo.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni del modello che richiedono il percorso beta 1M.

Opzioni di correzione:

1. Disabilita `context1m` per quel modello in modo da tornare alla normale finestra di contesto.
2. Usa una credenziale Anthropic idonea per richieste a contesto lungo, oppure passa a una chiave API Anthropic.
3. Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic a contesto lungo vengono rifiutate.

Correlati:

- [/providers/anthropic](/it/providers/anthropic)
- [/reference/token-use](/it/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/it/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Un backend locale compatibile con OpenAI supera le probe dirette ma le esecuzioni agente falliscono

Usa questa sezione quando:

- `curl ... /v1/models` funziona
- piccole chiamate dirette `/v1/chat/completions` funzionano
- le esecuzioni del modello OpenClaw falliscono solo nei normali turni agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Controlla:

- le piccole chiamate dirette hanno successo, ma le esecuzioni OpenClaw falliscono solo con prompt più grandi
- errori del backend su `messages[].content` che si aspetta una stringa
- crash del backend che compaiono solo con conteggi più alti di prompt token o con i prompt completi del runtime agente

Firme comuni:

- `messages[...].content: invalid type: sequence, expected a string` → il backend
  rifiuta parti di contenuto strutturato di Chat Completions. Correzione: imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- piccole richieste dirette hanno successo, ma le esecuzioni agente OpenClaw falliscono con crash
  di backend/modello (ad esempio Gemma su alcune build `inferrs`) → il trasporto OpenClaw è
  probabilmente già corretto; il backend sta fallendo sulla forma di prompt più grande del
  runtime agente.
- i fallimenti diminuiscono dopo aver disabilitato gli strumenti ma non scompaiono → gli schema degli strumenti facevano
  parte della pressione, ma il problema rimanente è comunque una limitazione upstream del modello/server
  o un bug del backend.

Opzioni di correzione:

1. Imposta `compat.requiresStringContent: true` per i backend Chat Completions che accettano solo stringhe.
2. Imposta `compat.supportsTools: false` per modelli/backend che non riescono a gestire
   in modo affidabile la superficie dello schema strumenti di OpenClaw.
3. Riduci la pressione del prompt dove possibile: bootstrap del workspace più piccolo, cronologia
   della sessione più breve, modello locale più leggero o un backend con supporto migliore per il contesto lungo.
4. Se le piccole richieste dirette continuano a funzionare mentre i turni agente OpenClaw continuano a bloccarsi
   nel backend, trattalo come una limitazione del server/modello upstream e apri
   lì una riproduzione con la forma del payload accettata.

Correlati:

- [/gateway/local-models](/it/gateway/local-models)
- [/gateway/configuration](/it/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/it/gateway/configuration-reference#openai-compatible-endpoints)

## Nessuna risposta

Se i canali sono attivi ma non risponde nulla, controlla routing e policy prima di riconnettere qualsiasi cosa.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Controlla:

- Pairing in sospeso per i mittenti DM.
- Vincolo di menzione per gruppi (`requireMention`, `mentionPatterns`).
- Mancate corrispondenze della allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato finché non c'è una menzione.
- `pairing request` → il mittente necessita di approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/pairing](/it/channels/pairing)
- [/channels/groups](/it/channels/groups)

## Connettività della dashboard Control UI

Quando dashboard/Control UI non si connette, verifica URL, modalità di autenticazione e ipotesi di contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Controlla:

- URL probe e URL dashboard corretti.
- Mancata corrispondenza di modalità auth/token tra client e gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

Firme comuni:

- `device identity required` → contesto non sicuro o autenticazione dispositivo mancante.
- `origin not allowed` → `Origin` del browser non è in `gateway.controlUi.allowedOrigins`
  (oppure ti stai connettendo da un'origine browser non-loopback senza una
  allowlist esplicita).
- `device nonce required` / `device nonce mismatch` → il client non completa il
  flusso di autenticazione dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato
  (o con timestamp obsoleto) per l'handshake corrente.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può fare un tentativo affidabile con token dispositivo memorizzato nella cache.
- Quel tentativo con token in cache riusa il set di scope memorizzato insieme al
  token dispositivo associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece il
  set di scope richiesto.
- Al di fuori di quel percorso di tentativo, la precedenza di autenticazione in connect è:
  token/password condivisi espliciti prima, poi `deviceToken` esplicito, poi token dispositivo memorizzato,
  poi token bootstrap.
- Sul percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter registri il fallimento. Due tentativi concorrenti errati dello stesso client possono quindi produrre `retry later`
  al secondo tentativo invece di due semplici mismatch.
- `too many failed authentication attempts (retry later)` da un client loopback con origine browser
  → fallimenti ripetuti dalla stessa `Origin` normalizzata vengono temporaneamente bloccati; un'altra origine localhost usa un bucket separato.
- `unauthorized` ripetuto dopo quel tentativo → deriva del token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
- `gateway connect failed:` → host/porta/url di destinazione errati.

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` non riuscita per scegliere l'azione successiva:

| Codice di dettaglio          | Significato                                                                                                                                                                                   | Azione consigliata                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.                                                                                                                                        | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` poi incollalo nelle impostazioni di Control UI.                                                                                                                        |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrisponde al token auth del gateway.                                                                                                                                 | Se `canRetryWithDeviceToken=true`, consenti un tentativo affidabile. I tentativi con token in cache riusano gli scope approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli scope richiesti. Se continua a fallire, esegui la [checklist di ripristino deriva token](/it/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per-dispositivo in cache è obsoleto o revocato.                                                                                                                                      | Ruota/riapprova il token dispositivo usando la [CLI devices](/it/cli/devices), poi riconnettiti.                                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | L'identità del dispositivo richiede approvazione. Controlla `error.details.reason` per `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, e usa `requestId` / `remediationHint` quando presenti. | Approva la richiesta in sospeso: `openclaw devices list` poi `openclaw devices approve <requestId>`. Gli upgrade di scope/ruolo usano lo stesso flusso dopo aver esaminato l'accesso richiesto.                                                                                           |

Controllo di migrazione device auth v2:

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

- le sessioni con token di dispositivo associato possono gestire solo **il proprio**
  dispositivo a meno che il chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo scope operatore che
  la sessione chiamante già possiede

Correlati:

- [/web/control-ui](/it/web/control-ui)
- [/gateway/configuration](/it/gateway/configuration) (modalità auth del gateway)
- [/gateway/trusted-proxy-auth](/it/gateway/trusted-proxy-auth)
- [/gateway/remote](/it/gateway/remote)
- [/cli/devices](/it/cli/devices)

## Servizio Gateway non in esecuzione

Usa questa sezione quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Controlla:

- `Runtime: stopped` con indizi sull'uscita.
- Mancata corrispondenza della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando si usa `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

Firme comuni:

- `Gateway start blocked: set gateway.mode=local` oppure `existing config is missing gateway.mode` → la modalità Gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per ristampare la configurazione prevista per la modalità locale. Se stai eseguendo OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso di autenticazione gateway valido (token/password, oppure trusted-proxy se configurato).
- `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
- `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. Nella maggior parte delle configurazioni è opportuno mantenere un solo gateway per macchina; se te ne serve più di uno, isola porte + configurazione/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

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

Controlla:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un file `openclaw.json.clobbered.*` con timestamp accanto alla configurazione attiva
- Un evento di sistema dell'agente principale che inizia con `Config recovery warning`

Cosa è successo:

- La configurazione rifiutata non ha superato la validazione durante l'avvio o l'hot reload.
- OpenClaw ha conservato il payload rifiutato come `.clobbered.*`.
- La configurazione attiva è stata ripristinata dall'ultima copia last-known-good validata.
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

- esiste `.clobbered.*` → una modifica diretta esterna o una lettura all'avvio è stata ripristinata.
- esiste `.rejected.*` → una scrittura di configurazione gestita da OpenClaw non ha superato lo schema o i controlli di clobber prima del commit.
- `Config write rejected:` → la scrittura ha tentato di eliminare una forma richiesta, ridurre drasticamente il file o persistere una configurazione non valida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → all'avvio il file corrente è stato trattato come clobbered perché aveva perso campi o dimensione rispetto al backup last-known-good.
- `Config last-known-good promotion skipped` → il candidato conteneva segnaposto di segreti redatti come `***`.

Opzioni di correzione:

1. Mantieni la configurazione attiva ripristinata se è corretta.
2. Copia solo le chiavi desiderate da `.clobbered.*` o `.rejected.*`, poi applicale con `openclaw config set` o `config.patch`.
3. Esegui `openclaw config validate` prima di riavviare.
4. Se modifichi a mano, mantieni l'intera configurazione JSON5, non solo l'oggetto parziale che volevi cambiare.

Correlati:

- [/gateway/configuration#strict-validation](/it/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/it/gateway/configuration#config-hot-reload)
- [/cli/config](/it/cli/config)
- [/gateway/doctor](/it/gateway/doctor)

## Avvisi della probe Gateway

Usa questa sezione quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avviso.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Controlla:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, più gateway, scope mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH non è riuscita, ma il comando ha comunque provato i target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di una destinazione. Di solito significa una configurazione multi-gateway intenzionale oppure listener obsoleti/duplicati.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione ha funzionato, ma la RPC di dettaglio è limitata dagli scope; associa l'identità del dispositivo o usa credenziali con `operator.read`.
- `Capability: pairing-pending` oppure `gateway closed (1008): pairing required` → il gateway ha risposto, ma questo client necessita ancora di pairing/approvazione prima del normale accesso operatore.
- testo di avviso SecretRef non risolto `gateway.auth.*` / `gateway.remote.*` → il materiale di autenticazione non era disponibile in questo percorso di comando per la destinazione non riuscita.

Correlati:

- [/cli/gateway](/it/cli/gateway)
- [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host)
- [/gateway/remote](/it/gateway/remote)

## Canale connesso ma messaggi non in flusso

Se lo stato del canale è connesso ma il flusso dei messaggi è fermo, concentrati su policy, permessi e regole di consegna specifiche del canale.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Controlla:

- Policy DM (`pairing`, `allowlist`, `open`, `disabled`).
- Allowlist del gruppo e requisiti di menzione.
- Permessi/scope API del canale mancanti.

Firme comuni:

- `mention required` → messaggio ignorato dalla policy di menzione del gruppo.
- trace `pairing` / approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di autenticazione/permessi del canale.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/whatsapp](/it/channels/whatsapp)
- [/channels/telegram](/it/channels/telegram)
- [/channels/discord](/it/channels/discord)

## Consegna Cron e Heartbeat

Se Cron o Heartbeat non sono stati eseguiti o non hanno consegnato, verifica prima lo stato dello scheduler, poi la destinazione di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Controlla:

- Cron abilitato e prossima riattivazione presente.
- Stato della cronologia di esecuzione del job (`ok`, `skipped`, `error`).
- Motivi di salto di Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firme comuni:

- `cron: scheduler disabled; jobs will not run automatically` → Cron disabilitato.
- `cron: timer tick failed` → tick dello scheduler fallito; controlla errori di file/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di ore attive.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è dovuta in questo tick.
- `heartbeat: unknown accountId` → account id non valido per la destinazione di consegna di Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → la destinazione di Heartbeat è stata risolta come destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o una sovrascrittura per agente) è impostato su `block`.

Correlati:

- [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/it/automation/cron-jobs)
- [/gateway/heartbeat](/it/gateway/heartbeat)

## Strumento di nodo associato non riuscito

Se un nodo è associato ma gli strumenti falliscono, isola stato in primo piano, permessi e approvazioni.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Controlla:

- Nodo online con le capacità previste.
- Concessioni dei permessi OS per fotocamera/microfono/posizione/schermo.
- Stato delle approvazioni exec e della allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del nodo deve essere in primo piano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla allowlist.

Correlati:

- [/nodes/troubleshooting](/it/nodes/troubleshooting)
- [/nodes/index](/it/nodes/index)
- [/tools/exec-approvals](/it/tools/exec-approvals)

## Fallimento dello strumento browser

Usa questa sezione quando le azioni dello strumento browser falliscono anche se il gateway stesso è sano.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Controlla:

- Se `plugins.allow` è impostato e include `browser`.
- Percorso valido dell'eseguibile del browser.
- Raggiungibilità del profilo CDP.
- Disponibilità di Chrome locale per i profili `existing-session` / `user`.

Firme comuni:

- `unknown command "browser"` oppure `unknown command 'browser'` → il plugin browser incluso è escluso da `plugins.allow`.
- strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
- `Failed to start Chrome CDP on port` → il processo del browser non è riuscito ad avviarsi.
- `browser.executablePath not found` → il percorso configurato non è valido.
- `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta errata o fuori intervallo.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session non è ancora riuscito a collegarsi alla directory dati del browser selezionata. Apri la pagina inspect del browser, abilita il debug remoto, tieni il browser aperto, approva il primo prompt di collegamento, poi riprova. Se lo stato di accesso non è richiesto, preferisci il profilo gestito `openclaw`.
- `No Chrome tabs found for profile="user"` → il profilo di collegamento Chrome MCP non ha schede Chrome locali aperte.
- `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host del gateway.
- `Browser attachOnly is enabled ... not reachable` oppure `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo attach-only non ha una destinazione raggiungibile, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non è comunque riuscito ad aprirsi.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione corrente del gateway non ha la dipendenza runtime `playwright-core` del plugin browser incluso; esegui `openclaw doctor --fix`, poi riavvia il gateway. Le istantanee ARIA e gli screenshot di pagina di base possono ancora funzionare, ma navigazione, istantanee AI, screenshot di elementi CSS-selector ed esportazione PDF restano non disponibili.
- `fullPage is not supported for element screenshots` → la richiesta di screenshot ha combinato `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot di Chrome MCP / `existing-session` devono usare acquisizione di pagina o un `--ref` da istantanea, non CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di upload Chrome MCP richiedono ref di istantanea, non selettori CSS.
- `existing-session file uploads currently support one file at a time.` → invia un upload per chiamata sui profili Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → gli hook delle finestre di dialogo sui profili Chrome MCP non supportano sovrascritture di timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP grezzo.
- sovrascritture obsolete di viewport / dark-mode / locale / offline su profili attach-only o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

Correlati:

- [/tools/browser-linux-troubleshooting](/it/tools/browser-linux-troubleshooting)
- [/tools/browser](/it/tools/browser)

## Se hai effettuato un upgrade e qualcosa si è improvvisamente rotto

La maggior parte dei problemi post-upgrade deriva da deriva della configurazione o da valori predefiniti più rigorosi che ora vengono applicati.

### 1) Il comportamento di auth e override URL è cambiato

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cosa controllare:

- Se `gateway.mode=remote`, le chiamate CLI potrebbero indirizzarsi al remoto mentre il tuo servizio locale funziona correttamente.
- Le chiamate esplicite con `--url` non usano come fallback le credenziali memorizzate.

Firme comuni:

- `gateway connect failed:` → URL di destinazione errato.
- `unauthorized` → endpoint raggiungibile ma autenticazione errata.

### 2) I guardrail di bind e auth sono più rigorosi

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Cosa controllare:

- I bind non-loopback (`lan`, `tailnet`, `custom`) richiedono un percorso di autenticazione gateway valido: autenticazione con token/password condiviso, oppure un deployment `trusted-proxy` non-loopback configurato correttamente.
- Chiavi vecchie come `gateway.token` non sostituiscono `gateway.auth.token`.

Firme comuni:

- `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso di autenticazione gateway valido.
- `Connectivity probe: failed` mentre il runtime è in esecuzione → gateway attivo ma inaccessibile con l'autenticazione/URL corrente.

### 3) Lo stato di pairing e identità dispositivo è cambiato

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cosa controllare:

- Approvazioni dispositivo in sospeso per dashboard/nodi.
- Approvazioni DM pairing in sospeso dopo modifiche di policy o identità.

Firme comuni:

- `device identity required` → autenticazione dispositivo non soddisfatta.
- `pairing required` → mittente/dispositivo deve essere approvato.

Se la configurazione del servizio e il runtime continuano a non coincidere dopo i controlli, reinstalla i metadati del servizio dalla stessa directory profile/state:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [/gateway/pairing](/it/gateway/pairing)
- [/gateway/authentication](/it/gateway/authentication)
- [/gateway/background-process](/it/gateway/background-process)
