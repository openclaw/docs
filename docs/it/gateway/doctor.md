---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando Doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-06T17:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione e migrazione per OpenClaw. Corregge configurazione/stato obsoleti, controlla l’integrità e fornisce passaggi di riparazione attuabili.

## Avvio rapido

```bash
openclaw doctor
```

### Modalità headless e di automazione

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accetta i valori predefiniti senza prompt (inclusi i passaggi di riparazione per riavvio/servizio/sandbox quando applicabili).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza prompt (riparazioni + riavvii quando sicuro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applica anche le riparazioni aggressive (sovrascrive le configurazioni personalizzate del supervisore).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta le azioni di riavvio/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scansiona i servizi di sistema alla ricerca di installazioni gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi rivedere le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, UI e aggiornamenti">
    - Aggiornamento preliminare opzionale per installazioni git (solo interattivo).
    - Controllo della freschezza del protocollo UI (ricompila Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell’estensione Chrome e preparazione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
    - Avvisi allowlist Plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà dei Plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agente/autenticazione WhatsApp).
    - Migrazione delle chiavi del contratto del manifesto Plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, semplici job di fallback Webhook `notify: true`).
    - Migrazione della runtime-policy agente legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione Plugin obsoleta quando i Plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti Plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione dei transcript delle sessioni per rami di riscrittura del prompt duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento di tombstone di restart-recovery per subagent bloccati, con supporto `--fix` per cancellare flag di recovery abortita obsoleti, così l’avvio non continua a trattare il processo figlio come abortito dal riavvio.
    - Controlli di integrità dello stato e dei permessi (sessioni, transcript, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l’esecuzione locale.
    - Integrità dell’autenticazione dei modelli: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati degli auth-profile.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisori">
    - Riparazione dell’immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime del Gateway (servizio installato ma non in esecuzione; label launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal gateway in esecuzione).
    - Controlli di reattività WhatsApp per integrità degradata dell’event loop del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo client TUI locali verificati.
    - Riparazione delle route Codex per riferimenti modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello dei canali e pin delle route di sessione; `--fix` li riscrive in `openai/*` e seleziona `agentRuntime.id: "codex"` solo quando il Plugin Codex è installato, abilitato, contribuisce l’harness `codex` e ha OAuth utilizzabile. Altrimenti seleziona `agentRuntime.id: "pi"`.
    - Audit della configurazione del supervisore (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell’ambiente proxy incorporato per i servizi gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante l’installazione o l’aggiornamento.
    - Controlli sulle best practice runtime del Gateway (Node rispetto a Bun, percorsi dei version-manager).
    - Diagnostica delle collisioni della porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Autenticazione, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli di autenticazione Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento dei problemi di pairing dei dispositivi (richieste di primo pairing in sospeso, upgrade ruolo/ambito in sospeso, drift della cache locale dei token dispositivo obsoleta e drift dell’autenticazione dei record accoppiati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo delle dimensioni dei file di bootstrap del workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo di prontezza Skills per l’agente predefinito; segnala Skills consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare Skills non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo di prontezza del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli dell’installazione da sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati della procedura guidata.

  </Accordion>
</AccordionGroup>

## Backfill e reset della UI Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il flusso di lavoro di grounded dreaming. Queste azioni usano metodi RPC in stile gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** scansiona i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario di backfill contrassegnate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci staged grounded-only a breve termine che provengono da replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non inseriscono automaticamente candidati grounded nello store di promozione a breve termine live, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi il normale percorso di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durevoli grounded nello store dreaming a breve termine, mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questa è una checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (ad esempio `messages.ackReaction` senza un override specifico per canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat Talk legacy. L’attuale configurazione pubblica del parlato Talk è `talk.provider` + `talk.providers.<provider>`, e la configurazione voce realtime è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti di proprietà dei Plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei Plugin che vengono effettivamente caricati; non bypassa la allowlist esclusiva dei Plugin.
    Doctor scrive `plugins.bundledDiscovery: "compat"` per le configurazioni allowlist
    legacy migrate, così preserva il comportamento esistente dei provider bundled, e
    poi punta all’impostazione più restrittiva `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi rifiutano di eseguirsi e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L’avvio del Gateway rifiuta i formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all’avvio. Anche le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni dei canali configurati senza criterio di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - selettori Talk realtime legacy di primo livello (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Per i canali con `accounts` denominati ma con valori di canale di primo livello per account singolo ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare una destinazione denominata/predefinita corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout di provider/modelli lenti
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione relay dell'estensione legacy)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l'avvio del gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l'instradamento di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare instradamento API e costi per modello.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Se la configurazione del browser punta ancora al percorso dell'estensione Chrome rimossa, doctor la normalizza al modello attuale di collegamento Chrome MCP locale all'host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ti ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome al posto tuo. Chrome MCP locale all'host richiede ancora:

    - un browser basato su Chromium 144+ sull'host gateway/node
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione del primo prompt di consenso al collegamento nel browser

    La prontezza qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti di instradamento Chrome MCP; rotte avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, browser remoto o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa convalidare la catena di certificati. Se la sonda fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, la sonda viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a OAuth Codex, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e ripristinare il comportamento integrato di instradamento/fallback. Proxy personalizzati e override solo di header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor controlla riferimenti modello `openai-codex/*` legacy. L'instradamento dell'harness Codex nativo usa riferimenti modello canonici `openai/*` più `agentRuntime.id: "codex"`, così il turno passa attraverso l'harness app-server Codex invece del percorso OpenClaw PI OpenAI.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell'agente predefinito e per agente, inclusi modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello dei canali e stato di rotta persistente obsoleto delle sessioni:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - Il runtime agente corrispondente diventa `agentRuntime.id: "codex"` solo quando Codex è installato, abilitato, fornisce l'harness `codex` e ha OAuth utilizzabile.
    - Altrimenti il runtime agente corrispondente diventa `agentRuntime.id: "pi"`.
    - Gli elenchi di fallback modello esistenti sono preservati con le rispettive voci legacy riscritte; le impostazioni per modello copiate passano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback, pin di profili auth e pin dell'harness Codex persistenti nelle sessioni vengono riparati in tutti gli store di sessione agente scoperti.
    - `/codex ...` significa "controlla o collega una conversazione Codex nativa dalla chat".
    - `/acp ...` o `runtime: "acp"` significa "usa l'adapter ACP/acpx esterno".

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor analizza anche gli store di sessione agente scoperti alla ricerca di stato di rotta obsoleto creato automaticamente dopo che hai spostato modelli configurati o runtime lontano da una rotta di proprietà di un Plugin, come Codex.

    `openclaw doctor --fix` può eliminare stato obsoleto creato automaticamente come pin modello `modelOverrideSource: "auto"`, metadati modello runtime, ID harness fissati, binding di sessione CLI e override automatici di profili auth quando la rotta proprietaria non è più configurata. Le scelte esplicite dell'utente o dei modelli di sessione legacy vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new` oppure reimposta la sessione quando quella rotta non è più prevista.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor può migrare layout su disco più vecchi nella struttura attuale:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia indietro cartelle legacy come backup. Anche Gateway/CLI migra automaticamente all'avvio le sessioni legacy + la directory agente, così cronologia/auth/modelli finiscono nel percorso per agente senza eseguire manualmente doctor. L'auth WhatsApp viene migrata intenzionalmente solo tramite `openclaw doctor`. La normalizzazione del provider/mappa provider Talk ora confronta per uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più modifiche `doctor --fix` no-op ripetute.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor analizza tutti i manifest Plugin installati alla ricerca di chiavi di capability deprecate di primo livello (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere il file manifest in-place. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, oppure `cron.store` quando sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi delivery di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di delivery `provider` del payload → `delivery.channel` esplicito
    - semplici job webhook di fallback legacy `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor esegue la migrazione automatica solo dei job con `notify: true` quando può farlo senza modificare il comportamento. Se un job combina il fallback legacy di notify con una modalità di consegna non-webhook esistente, doctor emette un avviso e lascia quel job per la revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script locale dell'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente di systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor analizza ogni directory di sessione agente per individuare file write-lock obsoleti: file rimasti quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del branch della trascrizione di sessione">
    Doctor analizza i file JSONL delle sessioni agente per individuare la forma di branch duplicata creata dal bug di riscrittura delle trascrizioni dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un elemento sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor crea un backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul branch attivo, in modo che la cronologia del Gateway e i lettori di memoria non vedano più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con il cloud su macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati su sincronizzazione possono causare I/O più lento e corse tra lock/sincronizzazione.
    - **Directory di stato su SD o eMMC Linux**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente con le scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dell'archivio sessioni sono richieste per mantenere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza delle trascrizioni**: avvisa quando voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in diverse directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile dal gruppo/mondo e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Integrità dell'autenticazione del modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. Le richieste di aggiornamento compaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che dice di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare a nomi legacy se l'immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre radici di dipendenze generate obsolete, vecchie directory install-stage, detriti locali al pacchetto da codice precedente di riparazione delle dipendenze dei Plugin in bundle e copie npm gestite orfane o recuperate di Plugin `@openclaw/*` in bundle che possono oscurare il manifesto in bundle corrente.

    Doctor può anche reinstallare Plugin scaricabili mancanti quando la configurazione li referenzia ma il registro Plugin locale non riesce a trovarli. Gli esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime agente configurati. Durante gli aggiornamenti dei pacchetti, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il pacchetto core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato richiede ancora il ripristino. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin rimangono lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche analizzare servizi aggiuntivi simili al gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se manca il servizio gateway a livello utente ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione all'avvio di Matrix">
    Quando un account canale Matrix ha una migrazione dello stato legacy in sospeso o eseguibile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati nei log e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato interamente.
  </Accordion>
  <Accordion title="8c. Associazione dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale controllo di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti derivano fuori dalla baseline di associazione approvata
    - voci token dispositivo memorizzate in cache locale per la macchina corrente che precedono una rotazione token lato gateway o contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dei dispositivi. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token fresco con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il buco comune "già associato ma riceve ancora richiesta di associazione": doctor ora distingue la prima associazione dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. Linger systemd (Linux)">
    Se in esecuzione come servizio utente systemd, doctor garantisce che linger sia abilitato, così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato delle Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace corrente.
    - **Stato Plugin**: conta Plugin abilitati/disabilitati/con errore; elenca gli ID Plugin per eventuali errori; segnala le capacità dei Plugin bundle.
    - **Avvisi di compatibilità Plugin**: segnala Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per ogni file i conteggi di caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia di Plugin canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin canale mancante, rimuove anche la configurazione pendente con ambito canale che referenziava quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo evita loop di avvio del Gateway in cui il runtime del canale non esiste più ma la configurazione chiede ancora al gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa uno schema di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file memorizzato in cache.
    - Se il completamento è configurato nel profilo ma il file cache è mancante, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura compatibili con SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e propone di riavviare il gateway quando sembra non essere integro.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni per la correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che sia presente una chiave API nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione utilizzabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ciascun provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato memorizzato nella cache della sonda del gateway (il gateway era integro al momento del controllo), doctor confronta il relativo risultato con la configurazione visibile alla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping degli embedding nel percorso predefinito; usa il comando di stato approfondito della memoria quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato dei canali">
    Se il gateway è integro, doctor esegue una sonda dello stato dei canali e segnala gli avvisi con le correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit e riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per individuare valori predefiniti mancanti o obsoleti (ad es. dipendenze systemd da network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
    - `openclaw doctor --repair` applica le correzioni consigliate senza prompt.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd gateway corrispondente è attiva. Ignora anche le unità extra inattive non legacy simili al gateway durante la scansione dei servizi duplicati, così i file di servizio complementari non creano rumore di pulizia.
    - Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida SecretRef ma non persiste i valori del token in testo normale risolti nei metadati dell'ambiente del servizio supervisore.
    - Doctor rileva i valori dell'ambiente di servizio gestiti basati su `.env`/SecretRef che le installazioni meno recenti di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio vincola ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio alla porta corrente.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni utilizzabili.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd di Linux, i controlli di drift dei token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni dei servizi di Doctor rifiutano di riscrivere, arrestare o riavviare un servizio gateway da un binario OpenClaw meno recente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica runtime e porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non effettivamente in esecuzione. Controlla anche le collisioni di porta sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice per il runtime del Gateway">
    Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono interrompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor propone di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, quindi Volta, asdf, fnm, pnpm e altre directory dei version manager non cambiano quali processi figlio Node vengono risolti. I servizi Linux mantengono ancora radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback dei version manager dedotte vengono scritte nel PATH del servizio solo quando esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e marca i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (consigliato GitHub privato o GitLab).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
