---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-07T01:52:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stato obsoleti, controlla l'integrità e fornisce passaggi di riparazione attuabili.

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

    Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riavvio/servizio/riparazione sandbox quando applicabili).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii dove sicuro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applica anche le riparazioni aggressive (sovrascrive le configurazioni supervisor personalizzate).

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

    Scansiona i servizi di sistema per installazioni gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi rivedere le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, UI e aggiornamenti">
    - Aggiornamento pre-flight opzionale per installazioni git (solo interattivo).
    - Controllo dell'aggiornamento del protocollo UI (ricostruisce Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi legacy piatti `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e prontezza Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth di Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti OAuth TLS per i profili OAuth OpenAI Codex.
    - Avvisi allowlist plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà del plugin.
    - Migrazione dello stato legacy su disco (sessioni/dir agent/WhatsApp auth).
    - Migrazione delle chiavi legacy del contratto manifest del plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job webhook fallback semplici `notify: true`).
    - Migrazione della runtime-policy agent legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti a plugin obsoleti vengono trattati come configurazione di contenimento inerte e preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione dei transcript di sessione per rami duplicati di prompt-rewrite creati dalle build 2026.4.24 interessate.
    - Rilevamento dei tombstone di recupero-riavvio per subagent bloccati, con supporto `--fix` per cancellare flag di recupero interrotto obsoleti, così l'avvio non continua a trattare il child come restart-aborted.
    - Controlli di integrità dello stato e permessi (sessioni, transcript, dir di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) quando eseguito localmente.
    - Integrità dell'autenticazione modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione degli auth-profile.
    - Rilevamento di dir workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione del servizio legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime del Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - Controlli di reattività WhatsApp per integrità degradata dell'event loop del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo i client TUI locali verificati.
    - Riparazione delle route Codex per riferimenti modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e pin delle route di sessione; `--fix` li riscrive in `openai/*` e seleziona `agentRuntime.id: "codex"` solo quando il plugin Codex è installato, abilitato, contribuisce l'harness `codex` e dispone di OAuth utilizzabile. Altrimenti seleziona `agentRuntime.id: "pi"`.
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente proxy embedded per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante l'installazione o l'aggiornamento.
    - Controlli delle best practice runtime del Gateway (Node vs Bun, percorsi dei version-manager).
    - Diagnostica collisioni porta del Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Autenticazione, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth del Gateway per modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive le configurazioni token SecretRef).
    - Rilevamento di problemi di pairing dispositivo (richieste di primo pairing in sospeso, upgrade ruolo/scope in sospeso, deriva cache token dispositivo locale obsoleta e deriva auth del record associato).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo dimensione file bootstrap del workspace (avvisi di troncamento/vicino al limite per file di contesto).
    - Controllo prontezza Skills per l'agent predefinito; segnala skill consentite con binari, env, config o requisiti OS mancanti, e `--fix` può disabilitare skill non disponibili in `skills.entries`.
    - Controllo stato completamento shell e installazione/upgrade automatico.
    - Controllo prontezza del provider di embedding per ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione da sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati della procedura guidata.

  </Accordion>
</AccordionGroup>

## Backfill e reset dell'UI Dreams

La scena Dreams di Control UI include azioni **Backfill**, **Reset** e **Clear Grounded** per il flusso di lavoro Dreaming ancorato. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI `openclaw doctor`.

Cosa fanno:

- **Backfill** scansiona i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM ancorato e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario di backfill contrassegnate da `DREAMS.md`.
- **Clear Grounded** rimuove solo le voci a breve termine staged, solo ancorate, provenienti da replay storico e che non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage i candidati ancorati nello store di promozione a breve termine live, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico ancorato influenzi la normale corsia di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage i candidati durevoli ancorati nello store Dreaming a breve termine, mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema attuale.

    Questo include i campi piatti Talk legacy. La configurazione pubblica attuale per Talk speech è `talk.provider` + `talk.providers.<provider>`, e la configurazione realtime voice è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o di strumenti di proprietà del plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira l'allowlist esclusiva dei plugin.
    Doctor scrive `plugins.bundledDiscovery: "compat"` per configurazioni allowlist legacy
    migrate, per preservare il comportamento esistente dei provider bundled, e
    poi punta all'impostazione `"allowlist"` più restrittiva.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di eseguire e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L'avvio del Gateway rifiuta i formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni attuali:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni dei canali configurati senza una policy di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - selettori Talk realtime di primo livello legacy (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Per i canali con `accounts` denominati ma valori di canale di primo livello per account singolo ancora presenti, sposta quei valori con ambito account nell’account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare una destinazione denominata/predefinita corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modello
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell’estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l’avvio del Gateway ignora anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull’account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Ciò può forzare i modelli sull’API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l’override e ripristinare routing API + costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione browser e preparazione Chrome MCP">
    Se la tua configurazione browser punta ancora al percorso rimosso dell’estensione Chrome, doctor la normalizza al modello corrente di collegamento Chrome MCP locale all’host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP locale all’host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili predefiniti con connessione automatica
    - controlla la versione Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ti ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l’impostazione lato Chrome per te. Chrome MCP locale all’host richiede ancora:

    - un browser basato su Chromium 144+ sull’host Gateway/Node
    - il browser in esecuzione localmente
    - il debug remoto abilitato in quel browser
    - l’approvazione della prima richiesta di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene i limiti di route Chrome MCP correnti; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l’endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa convalidare la catena di certificati. Se la verifica non riesce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, la verifica viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Override provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy in `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando rileva quelle vecchie impostazioni di trasporto insieme a OAuth Codex, così puoi rimuovere o riscrivere l’override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Riparazione route Codex">
    Doctor controlla i riferimenti modello legacy `openai-codex/*`. Il routing nativo dell’harness Codex usa riferimenti modello canonici `openai/*` più `agentRuntime.id: "codex"`, così il turno passa attraverso l’harness app-server Codex invece del percorso OpenAI OpenClaw PI.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti dell’agente predefinito e per agente interessati, inclusi modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello di canale e stato route di sessione persistito obsoleto:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - Il runtime agente corrispondente diventa `agentRuntime.id: "codex"` solo quando Codex è installato, abilitato, contribuisce l’harness `codex` e ha OAuth utilizzabile.
    - Altrimenti il runtime agente corrispondente diventa `agentRuntime.id: "pi"`.
    - Gli elenchi di fallback modello esistenti sono conservati con le voci legacy riscritte; le impostazioni per modello copiate si spostano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback, pin auth-profile e pin harness Codex persistiti nelle sessioni vengono riparati in tutti gli archivi sessione agente individuati.
    - `/codex ...` significa “controlla o associa una conversazione Codex nativa dalla chat”.
    - `/acp ...` o `runtime: "acp"` significa “usa l’adapter esterno ACP/acpx”.

  </Accordion>
  <Accordion title="2g. Pulizia route di sessione">
    Doctor analizza anche gli archivi sessione agente individuati alla ricerca di stato route obsoleto creato automaticamente dopo che sposti modelli configurati o runtime lontano da una route posseduta da un Plugin, come Codex.

    `openclaw doctor --fix` può eliminare stato obsoleto creato automaticamente, come pin modello `modelOverrideSource: "auto"`, metadati modello runtime, ID harness fissati, associazioni sessione CLI e override auth-profile automatici quando la route proprietaria non è più configurata. Le scelte esplicite dell’utente o dei modelli di sessione legacy vengono segnalate per revisione manuale e lasciate invariate; cambiale con `/model ...`, `/new` o reimposta la sessione quando quella route non è più prevista.

  </Accordion>
  <Accordion title="3. Migrazioni stato legacy (layout disco)">
    Doctor può migrare layout su disco più vecchi nella struttura corrente:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche Gateway/CLI migra automaticamente le sessioni legacy + la directory agente all’avvio, così cronologia/auth/modelli arrivano nel percorso per agente senza un’esecuzione manuale di doctor. L’auth WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa provider di Talk ora confronta per uguaglianza strutturale, quindi differenze solo nell’ordine delle chiavi non attivano più modifiche ripetute no-op di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni manifest Plugin legacy">
    Doctor analizza tutti i manifest Plugin installati alla ricerca di chiavi capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell’oggetto `contracts` e riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni archivio cron legacy">
    Doctor controlla anche l’archivio dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron correnti includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi delivery di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery `provider` del payload → `delivery.channel` esplicito
    - sentinelle `payload.model` cron persistite non valide (`"default"`, `"null"`, stringhe vuote, JSON `null`) → override modello rimosso
    - semplici job di fallback webhook legacy `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente solo i job `notify: true` quando può farlo senza modificare il comportamento. Se un job combina il fallback notify legacy con una modalità di consegna non-webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell’utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Questo script locale dell’host non è mantenuto dall’attuale OpenClaw e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità correnti.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi di sessione">
    Doctor analizza ogni directory di sessione agente alla ricerca di file di write-lock obsoleti, cioè file lasciati indietro quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: il percorso, il PID, se il PID è ancora attivo, l’età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del ramo del transcript di sessione">
    Doctor analizza i file JSONL delle sessioni agente alla ricerca della forma di ramo duplicata creata dal bug di riscrittura del transcript del prompt 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un fratello attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all’originale e riscrive il transcript sul ramo attivo, così la cronologia del gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, routing e sicurezza)">
    La directory di stato è il centro operativo. Se sparisce, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa di una perdita di stato catastrofica, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata su cloud in macOS**: avvisa quando lo stato risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato su SD o eMMC in Linux**: avvisa quando lo stato risolve a una sorgente di mount `mmcblk*`, perché l’I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente con scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dello store delle sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza del transcript**: avvisa quando voci di sessione recenti hanno file di transcript mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando il transcript principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull’host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/tutti e offre di restringere a `600`.

  </Accordion>
  <Accordion title="5. Integrità autenticazione modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nello store di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro farlo. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. I prompt di aggiornamento appaiono solo durante l’esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti chiede di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa l’esatto comando `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello hooks">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento del modello rispetto al catalogo e all’allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di crearle o di passare ai nomi legacy se l’immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia installazione Plugin">
    Doctor rimuove lo stato di staging delle dipendenze dei plugin legacy generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre radici di dipendenze generate obsolete, vecchie directory install-stage, residui locali del pacchetto da precedente codice di riparazione delle dipendenze dei plugin inclusi, e copie npm gestite orfane o recuperate dei plugin `@openclaw/*` inclusi che possono oscurare il manifest incluso corrente.

    Doctor può anche reinstallare plugin scaricabili mancanti quando la configurazione li referenzia ma il registro locale dei plugin non riesce a trovarli. Gli esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime agente configurati. Durante gli aggiornamenti del pacchetto, doctor evita di eseguire la riparazione dei plugin tramite package manager mentre il pacchetto core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l’aggiornamento se un plugin configurato ha ancora bisogno di recupero. L’avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei plugin restano attività esplicite di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta gateway corrente. Può anche cercare servizi aggiuntivi simili a gateway e stampare suggerimenti di pulizia. I servizi gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio gateway a livello utente manca ma esiste un servizio gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, poi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Matrix all’avvio">
    Quando un account di canale Matrix ha una migrazione di stato legacy in sospeso o attuabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato legacy Matrix e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l’avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato del tutto.
  </Accordion>
  <Accordion title="8c. Associazione dispositivi e deriva dell’autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l’id del dispositivo corrisponde ancora ma l’identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti divergono dalla baseline di associazione approvata
    - voci locali in cache del token dispositivo per la macchina corrente anteriori a una rotazione token lato gateway o con metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e approva di nuovo un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune buco "già associato ma riceve ancora associazione richiesta": doctor ora distingue la prima associazione dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, oppure quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se eseguito come servizio utente systemd, doctor assicura che lingering sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l’agente predefinito:

    - **Stato Skills**: conta le skill idonee, con requisiti mancanti e bloccate da allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace corrente.
    - **Stato Plugin**: conta plugin abilitati/disabilitati/con errori; elenca gli ID dei plugin per eventuali errori; segnala le capacità dei plugin del bundle.
    - **Avvisi di compatibilità Plugin**: segnala i plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro dei plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per ogni file il conteggio dei caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri iniettati come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un plugin di canale mancante, rimuove anche la configurazione pendente con ambito canale che referenziava quel plugin: voci `channels.<id>`, destinazioni heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo evita loop di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli auth Gateway (token locale)">
    Doctor controlla la prontezza dell’autenticazione tramite token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef token.

  </Accordion>
  <Accordion title="12b. Riparazioni in sola lettura compatibili con SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di `allowFrom` / `groupAllowFrom` `@username` di Telegram prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e propone di riavviare il Gateway quando sembra non integro.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione operativi se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato della verifica del Gateway memorizzato nella cache (il Gateway era integro al momento del controllo), doctor confronta il risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza dell'embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato del canale">
    Se il Gateway è integro, doctor esegue una verifica dello stato del canale e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit e riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per individuare impostazioni predefinite mancanti o obsolete (ad esempio, dipendenze systemd network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché quel ciclo di vita è di proprietà di un supervisore esterno.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd Gateway corrispondente è attiva. Ignora anche le unità aggiuntive inattive non legacy simili al Gateway durante la scansione dei servizi duplicati, così i file di servizio complementari non generano rumore di pulizia.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida il SecretRef ma non persiste i valori del token in testo normale risolti nei metadati dell'ambiente del servizio del supervisore.
    - Doctor rileva i valori di ambiente del servizio gestiti basati su `.env`/SecretRef che installazioni precedenti di LaunchAgent, systemd o Attività pianificata di Windows avevano incorporato inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio imposta ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni operative.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di deriva del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica del runtime e della porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche collisioni di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice del runtime Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor propone di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, quindi Volta, asdf, fnm, pnpm e altre directory dei version manager non modificano quale Node viene risolto dai processi figli. I servizi Linux mantengono ancora radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory fallback stimate dei version manager vengono scritte nel PATH del servizio solo quando esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche della configurazione e marca i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (consigliato GitHub o GitLab privato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
