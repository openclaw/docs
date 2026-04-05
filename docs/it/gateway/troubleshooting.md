---
read_when:
    - L'hub di risoluzione dei problemi ti ha indirizzato qui per una diagnosi più approfondita
    - Hai bisogno di sezioni di runbook stabili basate sui sintomi con comandi esatti
summary: Runbook approfondito per la risoluzione dei problemi di gateway, canali, automazione, nodi e browser
title: Risoluzione dei problemi
x-i18n:
    generated_at: "2026-04-05T13:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi del Gateway

Questa pagina è il runbook approfondito.
Inizia da [/help/troubleshooting](/help/troubleshooting) se vuoi prima il flusso rapido di triage.

## Scala dei comandi

Esegui prima questi, in quest'ordine:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Segnali attesi di stato integro:

- `openclaw gateway status` mostra `Runtime: running` e `RPC probe: ok`.
- `openclaw doctor` non segnala problemi bloccanti di configurazione/servizio.
- `openclaw channels status --probe` mostra lo stato live del trasporto per account e,
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

- Il modello Anthropic Opus/Sonnet selezionato ha `params.context1m: true`.
- La credenziale Anthropic corrente non è idonea per l'uso del contesto lungo.
- Le richieste falliscono solo su sessioni lunghe/esecuzioni del modello che richiedono il percorso beta da 1M.

Opzioni di correzione:

1. Disabilita `context1m` per quel modello per tornare alla normale finestra di contesto.
2. Usa una chiave API Anthropic con fatturazione, oppure abilita Anthropic Extra Usage sull'account Anthropic OAuth/subscription.
3. Configura modelli di fallback in modo che le esecuzioni continuino quando le richieste Anthropic per contesto lungo vengono rifiutate.

Correlati:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

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

- Pairing in sospeso per i mittenti DM.
- Gating delle menzioni nei gruppi (`requireMention`, `mentionPatterns`).
- Mismatch nelle allowlist di canale/gruppo.

Firme comuni:

- `drop guild message (mention required` → messaggio di gruppo ignorato fino a una menzione.
- `pairing request` → il mittente richiede approvazione.
- `blocked` / `allowlist` → mittente/canale filtrato dalla policy.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/pairing](/it/channels/pairing)
- [/channels/groups](/it/channels/groups)

## Connettività della dashboard/control UI

Quando la dashboard/control UI non si connette, verifica URL, modalità di autenticazione e ipotesi sul contesto sicuro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Cerca:

- URL probe corretto e URL dashboard corretto.
- Mismatch della modalità di autenticazione/token tra client e gateway.
- Uso di HTTP dove è richiesta l'identità del dispositivo.

Firme comuni:

- `device identity required` → contesto non sicuro o autenticazione del dispositivo mancante.
- `origin not allowed` → `Origin` del browser non è in `gateway.controlUi.allowedOrigins`
  (oppure ti stai connettendo da un'origine browser non loopback senza un'allowlist
  esplicita).
- `device nonce required` / `device nonce mismatch` → il client non sta completando
  il flusso di autenticazione del dispositivo basato su challenge (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → il client ha firmato il payload sbagliato
  (o un timestamp obsoleto) per l'handshake corrente.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → il client può fare un retry trusted con token dispositivo in cache.
- Quel retry con token in cache riusa il set di ambiti in cache memorizzato con il token
  dispositivo accoppiato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece
  il set di ambiti richiesto.
- Fuori da quel percorso di retry, la precedenza dell'autenticazione di connect è:
  token/password condiviso esplicito, poi `deviceToken` esplicito, poi token dispositivo memorizzato,
  poi bootstrap token.
- Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
  `{scope, ip}` vengono serializzati prima che il limiter registri il fallimento. Due retry
  concorrenti errati dallo stesso client possono quindi mostrare `retry later`
  al secondo tentativo invece di due semplici mismatch.
- `too many failed authentication attempts (retry later)` da un client loopback con origine browser
  → fallimenti ripetuti dalla stessa `Origin` normalizzata vengono temporaneamente bloccati; un'altra origine localhost usa un bucket separato.
- `unauthorized` ripetuto dopo quel retry → deriva del token condiviso/token dispositivo; aggiorna la configurazione del token e riapprova/ruota il token dispositivo se necessario.
- `gateway connect failed:` → host/porta/target URL errato.

### Mappa rapida dei codici di dettaglio auth

Usa `error.details.code` dalla risposta `connect` fallita per scegliere l'azione successiva:

| Codice di dettaglio          | Significato                                              | Azione consigliata                                                                                                                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Il client non ha inviato un token condiviso richiesto.   | Incolla/imposta il token nel client e riprova. Per i percorsi dashboard: `openclaw config get gateway.auth.token` poi incollalo nelle impostazioni della Control UI.                                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | Il token condiviso non corrisponde al token auth del gateway. | Se `canRetryWithDeviceToken=true`, consenti un retry trusted. I retry con token in cache riusano gli ambiti approvati memorizzati; i chiamanti con `deviceToken` / `scopes` espliciti mantengono gli ambiti richiesti. Se continua a fallire, esegui la [checklist di recupero dalla deriva del token](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Il token per dispositivo in cache è obsoleto o revocato. | Ruota/riapprova il token dispositivo usando la [CLI dei dispositivi](/cli/devices), poi riconnettiti.                                                                                                                                                                                |
| `PAIRING_REQUIRED`           | L'identità del dispositivo è nota ma non approvata per questo ruolo. | Approva la richiesta in sospeso: `openclaw devices list` poi `openclaw devices approve <requestId>`.                                                                                                                                                                                  |

Controllo della migrazione device auth v2:

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

- le sessioni con token del dispositivo accoppiato possono gestire solo **il proprio** dispositivo a meno che il
  chiamante non abbia anche `operator.admin`
- `openclaw devices rotate --scope ...` può richiedere solo ambiti operatore che
  la sessione chiamante possiede già

Correlati:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (modalità auth del gateway)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Servizio gateway non in esecuzione

Usa questa sezione quando il servizio è installato ma il processo non resta attivo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # analizza anche i servizi a livello di sistema
```

Cerca:

- `Runtime: stopped` con indizi sull'uscita.
- Mismatch della configurazione del servizio (`Config (cli)` vs `Config (service)`).
- Conflitti di porta/listener.
- Installazioni launchd/systemd/schtasks aggiuntive quando viene usato `--deep`.
- Suggerimenti di pulizia `Other gateway-like services detected (best effort)`.

Firme comuni:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità gateway locale non è abilitata, oppure il file di configurazione è stato sovrascritto e ha perso `gateway.mode`. Correzione: imposta `gateway.mode="local"` nella tua configurazione, oppure riesegui `openclaw onboard --mode local` / `openclaw setup` per ripristinare la configurazione attesa per la modalità locale. Se stai eseguendo OpenClaw tramite Podman, il percorso di configurazione predefinito è `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → bind non loopback senza un percorso auth gateway valido (token/password, o trusted-proxy dove configurato).
- `another gateway instance is already listening` / `EADDRINUSE` → conflitto di porta.
- `Other gateway-like services detected (best effort)` → esistono unità launchd/systemd/schtasks obsolete o parallele. Nella maggior parte delle configurazioni dovrebbe esserci un solo gateway per macchina; se te ne servono più di uno, isola porte + config/stato/workspace. Vedi [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

Correlati:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Avvisi della probe del gateway

Usa questa sezione quando `openclaw gateway probe` raggiunge qualcosa, ma stampa comunque un blocco di avvisi.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Cerca:

- `warnings[].code` e `primaryTargetId` nell'output JSON.
- Se l'avviso riguarda fallback SSH, gateway multipli, ambiti mancanti o riferimenti auth non risolti.

Firme comuni:

- `SSH tunnel failed to start; falling back to direct probes.` → la configurazione SSH è fallita, ma il comando ha comunque provato target diretti configurati/loopback.
- `multiple reachable gateways detected` → ha risposto più di un target. Di solito significa una configurazione multi-gateway intenzionale o listener obsoleti/duplicati.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → la connessione è riuscita, ma l'RPC di dettaglio è limitato dagli ambiti; accoppia l'identità del dispositivo o usa credenziali con `operator.read`.
- testo di avviso SecretRef non risolto per `gateway.auth.*` / `gateway.remote.*` → il materiale auth non era disponibile in questo percorso di comando per il target fallito.

Correlati:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Canale connesso ma messaggi non in transito

Se lo stato del canale è connected ma il flusso dei messaggi è morto, concentrati su policy, permessi e regole di consegna specifiche del canale.

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
- `pairing` / tracce di approvazione in sospeso → il mittente non è approvato.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema di autenticazione/permessi del canale.

Correlati:

- [/channels/troubleshooting](/it/channels/troubleshooting)
- [/channels/whatsapp](/it/channels/whatsapp)
- [/channels/telegram](/it/channels/telegram)
- [/channels/discord](/it/channels/discord)

## Consegna cron e heartbeat

Se cron o heartbeat non sono stati eseguiti o non hanno consegnato, verifica prima lo stato dello scheduler, poi il target di consegna.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Cerca:

- Cron abilitato e prossima attivazione presente.
- Stato della cronologia delle esecuzioni del job (`ok`, `skipped`, `error`).
- Motivi di skip dell'heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firme comuni:

- `cron: scheduler disabled; jobs will not run automatically` → cron disabilitato.
- `cron: timer tick failed` → tick dello scheduler fallito; controlla errori di file/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuori dalla finestra di ore attive.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo righe vuote / intestazioni markdown, quindi OpenClaw salta la chiamata al modello.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un blocco `tasks:`, ma nessuna attività è in scadenza a questo tick.
- `heartbeat: unknown accountId` → ID account non valido per il target di consegna heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → il target heartbeat è stato risolto in una destinazione in stile DM mentre `agents.defaults.heartbeat.directPolicy` (o l'override per agente) è impostato su `block`.

Correlati:

- [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/it/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Errore di uno strumento del nodo accoppiato

Se un nodo è accoppiato ma gli strumenti falliscono, isola stato in foreground, permessi e approvazioni.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Cerca:

- Nodo online con le capacità previste.
- Permessi del sistema operativo per camera/microfono/posizione/schermo.
- Approvazioni exec e stato allowlist.

Firme comuni:

- `NODE_BACKGROUND_UNAVAILABLE` → l'app del nodo deve essere in foreground.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → permesso OS mancante.
- `SYSTEM_RUN_DENIED: approval required` → approvazione exec in sospeso.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloccato dalla allowlist.

Correlati:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Errore dello strumento browser

Usa questa sezione quando le azioni dello strumento browser falliscono anche se il gateway stesso è integro.

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

- `unknown command "browser"` o `unknown command 'browser'` → il plugin browser incluso è escluso da `plugins.allow`.
- strumento browser mancante / non disponibile mentre `browser.enabled=true` → `plugins.allow` esclude `browser`, quindi il plugin non è mai stato caricato.
- `Failed to start Chrome CDP on port` → il processo browser non è riuscito ad avviarsi.
- `browser.executablePath not found` → il percorso configurato non è valido.
- `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato come `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta non valida o fuori intervallo.
- `No Chrome tabs found for profile="user"` → il profilo di attach Chrome MCP non ha schede Chrome locali aperte.
- `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile dall'host gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo attach-only non ha un target raggiungibile, oppure l'endpoint HTTP ha risposto ma il WebSocket CDP non è comunque stato aperto.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → l'installazione gateway corrente non include il pacchetto Playwright completo; snapshot ARIA e screenshot di base della pagina possono comunque funzionare, ma navigazione, snapshot AI, screenshot di elementi con selettori CSS ed esportazione PDF restano non disponibili.
- `fullPage is not supported for element screenshots` → la richiesta screenshot ha combinato `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → le chiamate screenshot Chrome MCP / `existing-session` devono usare una cattura pagina o un `--ref` da snapshot, non `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → gli hook di upload Chrome MCP richiedono riferimenti da snapshot, non selettori CSS.
- `existing-session file uploads currently support one file at a time.` → invia un upload per chiamata sui profili Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → gli hook dialog sui profili Chrome MCP non supportano override del timeout.
- `response body is not supported for existing-session profiles yet.` → `responsebody` richiede ancora un browser gestito o un profilo CDP raw.
- override obsoleti di viewport / dark-mode / locale / offline su profili attach-only o CDP remoti → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione Playwright/CDP senza riavviare l'intero gateway.

Correlati:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Se hai aggiornato e qualcosa si è rotto all'improvviso

La maggior parte dei problemi post-aggiornamento è dovuta a deriva della configurazione o a valori predefiniti più rigidi che ora vengono applicati.

### 1) Il comportamento di auth e override URL è cambiato

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Cosa controllare:

- Se `gateway.mode=remote`, le chiamate CLI potrebbero puntare al remoto mentre il tuo servizio locale è a posto.
- Le chiamate esplicite con `--url` non usano il fallback alle credenziali memorizzate.

Firme comuni:

- `gateway connect failed:` → target URL errato.
- `unauthorized` → endpoint raggiungibile ma auth errata.

### 2) I guardrail su bind e auth sono più rigidi

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Cosa controllare:

- I bind non loopback (`lan`, `tailnet`, `custom`) richiedono un percorso auth gateway valido: autenticazione con token/password condivisi, oppure un deployment `trusted-proxy` non loopback configurato correttamente.
- Vecchie chiavi come `gateway.token` non sostituiscono `gateway.auth.token`.

Firme comuni:

- `refusing to bind gateway ... without auth` → bind non loopback senza un percorso auth gateway valido.
- `RPC probe: failed` mentre il runtime è in esecuzione → gateway attivo ma inaccessibile con auth/url correnti.

### 3) Lo stato di pairing e identità del dispositivo è cambiato

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Cosa controllare:

- Approvazioni dispositivo in sospeso per dashboard/nodi.
- Approvazioni DM pairing in sospeso dopo cambi di policy o identità.

Firme comuni:

- `device identity required` → autenticazione del dispositivo non soddisfatta.
- `pairing required` → mittente/dispositivo deve essere approvato.

Se la configurazione del servizio e il runtime continuano a non coincidere dopo i controlli, reinstalla i metadati del servizio dallo stesso profilo/directory di stato:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Correlati:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
