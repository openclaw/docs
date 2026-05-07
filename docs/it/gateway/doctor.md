---
read_when:
    - Aggiunta o modifica delle migrazioni doctor
    - Introduzione di modifiche di configurazione incompatibili
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-07T13:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione e migrazione per OpenClaw. Corregge configurazioni/stati obsoleti, controlla lo stato di salute e fornisce passaggi di riparazione attuabili.

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

    Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riparazione per riavvio/servizio/sandbox quando applicabili).

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

    Applica anche riparazioni aggressive (sovrascrive le configurazioni supervisor personalizzate).

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

    Analizza i servizi di sistema per installazioni gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi rivedere le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Salute, UI e aggiornamenti">
    - Aggiornamento pre-flight opzionale per installazioni git (solo interattivo).
    - Controllo della freschezza del protocollo UI (ricompila Control UI quando lo schema del protocollo è più recente).
    - Controllo di salute + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e predisposizione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
    - Avvisi allowlist Plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora strumenti wildcard o posseduti da Plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agent/autenticazione WhatsApp).
    - Migrazione delle chiavi legacy del contratto manifest Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job webhook fallback semplici `notify: true`).
    - Migrazione della policy runtime legacy degli agent a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione Plugin obsoleta quando i Plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti Plugin obsoleti vengono trattati come configurazione di contenimento inerte e preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami duplicati di riscrittura prompt creati dalle build 2026.4.24 interessate.
    - Rilevamento tombstone di recovery-riavvio per subagent bloccati, con supporto `--fix` per cancellare flag di recovery abortita obsoleti in modo che l'avvio non continui a trattare il child come restart-aborted.
    - Controlli di integrità e permessi dello stato (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Salute autenticazione modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione dei profili di autenticazione.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd memorizzata nella cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - I controlli dei permessi specifici per canale risiedono sotto `openclaw channels capabilities`; per esempio, i permessi dei canali vocali Discord vengono verificati con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Controlli di reattività WhatsApp per salute degradata dell'event loop del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo client TUI locali verificati.
    - Riparazione delle route Codex per riferimenti modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello canale e pin route di sessione; `--fix` li riscrive in `openai/*` e seleziona `agentRuntime.id: "codex"` solo quando il Plugin Codex è installato, abilitato, contribuisce l'harness `codex` e dispone di OAuth utilizzabile. Altrimenti seleziona `agentRuntime.id: "pi"`.
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente proxy incorporato per servizi Gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante l'installazione o l'aggiornamento.
    - Controlli sulle best practice runtime Gateway (Node vs Bun, percorsi dei gestori di versione).
    - Diagnostica delle collisioni di porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Autenticazione, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli autenticazione Gateway per modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento problemi di pairing del dispositivo (richieste di prima associazione in sospeso, upgrade ruolo/ambito in sospeso, drift obsoleto della cache locale dei token dispositivo e drift di autenticazione dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo linger systemd su Linux.
    - Controllo dimensioni del file bootstrap del workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo di prontezza Skills per l'agent predefinito; segnala skill consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare skill non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo di prontezza del provider embedding per la ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione da sorgente (mancata corrispondenza workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e ripristino dell'UI Dreams

La scena Dreams di Control UI include le azioni **Backfill**, **Ripristina** e **Cancella grounded** per il flusso di lavoro di Dreaming grounded. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Ripristina** rimuove da `DREAMS.md` solo quelle voci di diario di backfill contrassegnate.
- **Cancella grounded** rimuove solo voci a breve termine staged solo grounded che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non inseriscono automaticamente candidati grounded nello store live di promozione a breve termine, a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico grounded influenzi il normale percorso di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durevoli grounded nello store di Dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e razionale

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat Talk legacy. La configurazione pubblica corrente della sintesi vocale Talk è `talk.provider` + `talk.providers.<provider>`, e la configurazione voce realtime è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti posseduti da Plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei Plugin che vengono effettivamente caricati; non aggira l'allowlist Plugin esclusiva.
    Doctor scrive `plugins.bundledDiscovery: "compat"` per configurazioni allowlist legacy migrate
    per preservare il comportamento esistente dei provider bundled, quindi
    rimanda all'impostazione più restrittiva `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi si rifiutano di eseguire e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L'avvio Gateway rifiuta i formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni dei canali configurati prive di policy di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di livello superiore
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - selettori Talk in tempo reale legacy di livello superiore (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Per i canali con `accounts` denominati ma valori del canale di livello superiore a singolo account ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare una destinazione denominata/predefinita corrispondente già esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modelli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l'avvio del gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare routing API + costi per modello.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza al modello attuale di collegamento Chrome MCP locale all'host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (ad esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare al posto tuo l'impostazione lato Chrome. Chrome MCP locale all'host richiede ancora:

    - un browser basato su Chromium 144+ sull'host Gateway/Node
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - l'approvazione del primo prompt di consenso al collegamento nel browser

    La readiness qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti delle route Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se la verifica fallisce con un errore di certificato (ad esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche della piattaforma. Su macOS con un Node Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la verifica viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a Codex OAuth così puoi rimuovere o riscrivere l'override di trasporto obsoleto e riottenere il comportamento integrato di routing/fallback. Proxy personalizzati e override solo di header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor controlla la presenza di riferimenti modello legacy `openai-codex/*`. Il routing harness nativo di Codex usa riferimenti modello canonici `openai/*`; i turni degli agenti OpenAI passano attraverso l'harness app-server Codex invece del percorso OpenClaw PI OpenAI.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell'agente predefinito e per agente, inclusi modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello dei canali e stato route di sessione persistito obsoleto:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - Il runtime agente corrispondente diventa `agentRuntime.id: "codex"` solo quando Codex è installato, abilitato, contribuisce l'harness `codex` e ha OAuth utilizzabile.
    - Altrimenti il runtime agente corrispondente diventa `agentRuntime.id: "pi"`.
    - Gli elenchi di fallback modello esistenti vengono preservati con le relative voci legacy riscritte; le impostazioni per modello copiate si spostano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback, pin di profili auth e pin dell'harness Codex persistiti nelle sessioni vengono riparati in tutti gli store di sessione agente scoperti.
    - `/codex ...` significa "controllare o associare una conversazione Codex nativa dalla chat".
    - `/acp ...` o `runtime: "acp"` significa "usare l'adapter ACP/acpx esterno".

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor scandisce anche gli store di sessione agente scoperti per stato route obsoleto creato automaticamente dopo che sposti modelli configurati o runtime via da una route posseduta da un Plugin come Codex.

    `openclaw doctor --fix` può cancellare stato obsoleto creato automaticamente come pin modello `modelOverrideSource: "auto"`, metadati modello runtime, ID harness fissati, binding di sessione CLI e override automatici di profilo auth quando la route proprietaria non è più configurata. Le scelte modello esplicite dell'utente o di sessione legacy vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new` o reimposta la sessione quando quella route non è più prevista.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor può migrare layout su disco più vecchi nella struttura attuale:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (tranne `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Il Gateway/CLI migra automaticamente anche le sessioni legacy + la directory agente all'avvio, così cronologia/auth/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'auth WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa provider di Talk ora confronta per uguaglianza strutturale, quindi differenze solo nell'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor scandisce tutti i manifest dei Plugin installati alla ricerca di chiavi di capability di livello superiore deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere il file manifest in-place. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) per vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di livello superiore (`message`, `model`, `thinking`, ...) → `payload`
    - campi delivery di livello superiore (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery `provider` del payload → `delivery.channel` esplicito
    - job webhook fallback legacy semplici `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor esegue la migrazione automatica solo dei processi `notify: true` quando può farlo senza cambiare il comportamento. Se un processo combina il fallback notify legacy con una modalità di consegna non Webhook già esistente, doctor mostra un avviso e lascia quel processo alla revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script locale all'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce obsoleta dal crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor scansiona ogni directory di sessione dell'agente alla ricerca di file di write-lock obsoleti, cioè file rimasti quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e ti indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del ramo del transcript di sessione">
    Doctor scansiona i file JSONL delle sessioni agente alla ricerca della forma di ramo duplicata creata dal bug di riscrittura del transcript dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un elemento sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive il transcript sul ramo attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza sessione, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con cloud su macOS**: avvisa quando lo stato risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi supportati da sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato su SD o eMMC Linux**: avvisa quando lo stato risolve a una sorgente di mount `mmcblk*`, perché l'I/O casuale supportato da SD o eMMC può essere più lento e consumarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dello store delle sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza del transcript**: avvisa quando voci di sessione recenti hanno file transcript mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando il transcript principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra le directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nello store di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. I prompt di aggiornamento appaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti dice di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello Hooks">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non può essere risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare a nomi legacy se l'immagine attuale è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato di staging delle dipendenze dei Plugin legacy generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre radici di dipendenze generate obsolete, vecchie directory install-stage, detriti locali al pacchetto da codice precedente di riparazione delle dipendenze dei Plugin bundle e copie npm gestite orfane o recuperate di Plugin `@openclaw/*` bundle che possono oscurare il manifesto bundle attuale.

    Doctor può anche reinstallare Plugin scaricabili mancanti quando la configurazione li referenzia ma il registro Plugin locale non riesce a trovarli. Gli esempi includono `plugins.entries` effettivi, impostazioni configurate di canale/provider/ricerca e runtime agente configurati. Durante gli aggiornamenti del pacchetto, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il pacchetto core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato ha ancora bisogno di recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway attuale. Può anche cercare servizi aggiuntivi simili al Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente è mancante ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Startup Matrix">
    Quando un account canale Matrix ha una migrazione di stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato crittografato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Accoppiamento dispositivo e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di accoppiamento dei dispositivi come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di primo accoppiamento in sospeso
    - upgrade di ruolo in sospeso per dispositivi già accoppiati
    - upgrade di scope in sospeso per dispositivi già accoppiati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record accoppiati senza un token attivo per un ruolo approvato
    - token accoppiati i cui scope derivano fuori dalla baseline di accoppiamento approvata
    - voci locali in cache del token dispositivo per la macchina attuale precedenti a una rotazione token lato Gateway o con metadati scope obsoleti

    Doctor non approva automaticamente le richieste di accoppiamento né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il buco comune "già accoppiato ma riceve ancora accoppiamento richiesto": doctor ora distingue il primo accoppiamento dagli upgrade di ruolo/scope in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza allowlist o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. Linger systemd (Linux)">
    Se in esecuzione come servizio utente systemd, doctor assicura che il lingering sia abilitato così il Gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace attuale.
    - **Stato Plugin**: conta Plugin abilitati/disabilitati/con errori; elenca gli ID dei Plugin per eventuali errori; segnala le capacità dei Plugin bundle.
    - **Avvisi di compatibilità Plugin**: segnala Plugin che hanno problemi di compatibilità con il runtime attuale.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per ogni file i conteggi di caratteri raw rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri totali iniettati come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin canale mancante, rimuove anche la configurazione dangling con scope canale che referenziava quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo impedisce loop di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell attuale (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache è mancante, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare la cache manualmente.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione token del Gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef token.

  </Accordion>
  <Accordion title="12b. Riparazioni in sola lettura compatibili con SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` tenta di usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e propone di riavviare il gateway quando sembra non integro.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor verifica se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione utilizzabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, quindi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato memorizzato nella cache della verifica del gateway (il gateway era integro al momento del controllo), doctor confronta il suo risultato con la configurazione visibile alla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping degli embedding nel percorso predefinito; usa il comando di stato approfondito della memoria quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato del canale">
    Se il gateway è integro, doctor esegue una verifica dello stato del canale e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit e riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (ad es. dipendenze systemd network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd gateway corrispondente è attiva. Ignora inoltre le unità aggiuntive inattive non legacy simili al gateway durante la scansione dei servizi duplicati, così i file di servizio complementari non generano rumore di pulizia.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida il SecretRef ma non persiste i valori token in testo semplice risolti nei metadati dell'ambiente del servizio del supervisore.
    - Doctor rileva i valori di ambiente del servizio gestiti basati su `.env`/SecretRef che le vecchie installazioni LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio mantiene ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni utilizzabili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di drift del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio gateway da un binario OpenClaw più vecchio quando la configurazione è stata scritta l'ultima volta da una versione più nuova. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica del runtime del Gateway + porta">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche collisioni di porta sulla porta del gateway (predefinita `18789`) e segnala cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Buone pratiche per il runtime del Gateway">
    Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei gestori di versione possono rompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor propone di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, quindi Volta, asdf, fnm, pnpm e altre directory dei gestori di versione non cambiano quale Node risolvono i processi figli. I servizi Linux mantengono ancora le radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback dei gestori di versione stimate vengono scritte nel PATH del servizio solo quando quelle directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e appone un timbro ai metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per l'area di lavoro (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria dell'area di lavoro quando manca e stampa un suggerimento di backup se l'area di lavoro non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura dell'area di lavoro e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
