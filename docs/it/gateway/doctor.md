---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-12T08:45:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione e migrazione per OpenClaw. Corregge configurazioni/stati obsoleti, verifica lo stato di salute e fornisce passaggi di riparazione attuabili.

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

    Accetta i valori predefiniti senza richieste interattive (inclusi passaggi di riparazione per riavvio/servizio/sandbox quando applicabili).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza richieste interattive (riparazioni + riavvii dove sicuro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applica anche riparazioni aggressive (sovrascrive configurazioni supervisor personalizzate).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Esegue senza richieste interattive e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta azioni di riavvio/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Salute, UI e aggiornamenti">
    - Aggiornamento preliminare opzionale per installazioni git (solo interattivo).
    - Controllo di aggiornamento del protocollo UI (ricompila Control UI quando lo schema del protocollo è più recente).
    - Controllo di salute + richiesta di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e prontezza Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per profili OpenAI Codex OAuth.
    - Avvisi allowlist Plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà del plugin.
    - Migrazione dello stato legacy su disco (sessions/dir agent/WhatsApp auth).
    - Migrazione delle chiavi legacy del contratto manifest del plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job fallback Webhook semplici `notify: true`).
    - Pulizia della runtime-policy legacy dell'intero agente; la runtime policy provider/modello è il selettore di route attivo.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami di riscrittura prompt duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento tombstone per recupero da riavvio di subagent bloccati, con supporto `--fix` per cancellare flag di recupero interrotto obsoleti in modo che l'avvio non continui a trattare il figlio come restart-aborted.
    - Controlli di integrità dello stato e dei permessi (sessioni, trascrizioni, dir stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Salute auth dei modelli: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione dei profili auth.
    - Rilevamento di dir workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento Gateway aggiuntivo.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - I controlli dei permessi specifici del canale vivono sotto `openclaw channels capabilities`; ad esempio, i permessi dei canali vocali Discord vengono verificati con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Controlli di reattività WhatsApp per salute degradata dell'event loop Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo client TUI locali verificati.
    - Riparazione delle route Codex per riferimenti modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello di canale e pin route di sessione; `--fix` li riscrive in `openai/*`, rimuove pin runtime obsoleti di sessione/intero agente e lascia i riferimenti agente OpenAI canonici sull'harness Codex predefinito.
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente proxy incorporato per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime Gateway (Node vs Bun, percorsi dei version-manager).
    - Diagnostica delle collisioni di porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per la modalità token locale (offre la generazione di token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento di problemi di associazione dispositivo (richieste di prima associazione in sospeso, upgrade ruolo/scope in sospeso, deriva della cache token dispositivo locale obsoleta e deriva auth dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo dimensione del file bootstrap workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo prontezza Skills per l'agente predefinito; segnala Skills consentite con binari, env, config o requisiti OS mancanti, e `--fix` può disabilitare Skills non disponibili in `skills.entries`.
    - Controllo stato completamento shell e installazione/upgrade automatici.
    - Controllo prontezza provider embedding per ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione da sorgente (mancata corrispondenza workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset UI Dreams

La scena Dreams di Control UI include azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow di Dreaming grounded. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci diario di backfill marcate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci short-term staged esclusivamente grounded che provengono da replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non eseguono automaticamente lo stage dei candidati grounded nello store di promozione short-term live a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale lane di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo esegue lo stage dei candidati durevoli grounded nello store Dreaming short-term mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modalità interattiva, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (ad esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat Talk legacy. La configurazione pubblica corrente di Talk speech è `talk.provider` + `talk.providers.<provider>`, e la configurazione voce realtime è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    wildcard o voci strumento di proprietà del plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira la allowlist esclusiva dei plugin.
    Doctor scrive `plugins.bundledDiscovery: "compat"` per configurazioni allowlist legacy
    migrate per preservare il comportamento esistente dei provider bundled, e
    poi punta all'impostazione più rigorosa `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrazioni di chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi rifiutano di eseguirsi e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L'avvio di Gateway rifiuta formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni dei canali configurati senza criterio di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di livello superiore
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - selettori Talk realtime legacy di livello superiore (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Per i canali con `accounts` denominati ma valori di canale di livello superiore per account singolo ancora presenti, sposta quei valori con ambito account nell’account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare una destinazione denominata/predefinita corrispondente già esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per i timeout di provider/modelli lenti
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell’estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l’avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)
    - rimuovi `plugins.entries.codex.config.codexDynamicToolsProfile`; il server dell’app Codex mantiene sempre nativi gli strumenti workspace nativi di Codex

    Gli avvisi di doctor includono anche indicazioni sull’account predefinito per i canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account imprevisto.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override dei provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sostituisce il catalogo OpenCode integrato da `@earendil-works/pi-ai`. Ciò può forzare i modelli sull’API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l’override e ripristinare il routing API per modello + i costi.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione a Chrome MCP">
    Se la configurazione del browser punta ancora al percorso rimosso dell’estensione Chrome, doctor la normalizza al modello attuale di collegamento Chrome MCP locale all’host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP locale all’host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ti ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare per te l’impostazione lato Chrome. Chrome MCP locale all’host richiede comunque:

    - un browser basato su Chromium 144+ sull’host del gateway/node
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione del primo prompt di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti di route di Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. Prerequisiti OAuth TLS">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l’endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa convalidare la catena di certificati. Se la verifica fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per la piattaforma. Su macOS con un Node Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la verifica viene eseguita anche se il gateway è integro.
  </Accordion>
  <Accordion title="2e. Override dei provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni legacy di trasporto OpenAI in `models.providers.openai-codex`, queste possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando rileva quelle vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l’override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo degli header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Riparazione delle route Codex">
    Doctor controlla la presenza di riferimenti modello legacy `openai-codex/*`. Il routing dell’harness Codex nativo usa riferimenti modello canonici `openai/*`; i turni degli agenti OpenAI passano attraverso l’harness del server dell’app Codex invece del percorso OpenAI di OpenClaw PI.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell’agente predefinito e dei singoli agenti, inclusi modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e stato di route persistente obsoleto delle sessioni:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - L’intento Codex passa a voci `agentRuntime.id: "codex"` con ambito provider/modello per i riferimenti modello degli agenti riparati, così i profili auth `openai-codex:...` possono ancora essere selezionati dopo che il riferimento modello diventa `openai/*`.
    - La configurazione runtime obsoleta dell’intero agente e i pin runtime persistenti delle sessioni vengono rimossi perché la selezione runtime ha ambito provider/modello.
    - La policy runtime provider/modello esistente viene conservata, a meno che il riferimento modello legacy riparato non richieda il routing Codex per mantenere il vecchio percorso auth.
    - Gli elenchi di fallback dei modelli esistenti vengono conservati con le rispettive voci legacy riscritte; le impostazioni per modello copiate si spostano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback e pin dei profili auth persistenti delle sessioni vengono riparati in tutti gli store sessione agente scoperti.
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l’adapter ACP/acpx esterno."

  </Accordion>
  <Accordion title="2g. Pulizia delle route di sessione">
    Doctor analizza anche gli store sessione agente scoperti alla ricerca di stato di route auto-creato obsoleto dopo che sposti i modelli configurati o il runtime da una route posseduta da un Plugin, come Codex.

    `openclaw doctor --fix` può cancellare stato obsoleto auto-creato come pin modello `modelOverrideSource: "auto"`, metadati modello runtime, ID harness fissati, associazioni sessione CLI e override automatici dei profili auth quando la relativa route proprietaria non è più configurata. Le scelte esplicite dell’utente o dei modelli sessione legacy vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new` oppure reimposta la sessione quando quella route non è più desiderata.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout del disco)">
    Doctor può migrare i layout su disco più vecchi nella struttura attuale:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia eventuali cartelle legacy come backup. Anche Gateway/CLI migra automaticamente all’avvio le sessioni legacy + la directory agente, così cronologia/auth/modelli arrivano nel percorso per agente senza un’esecuzione manuale di doctor. L’autenticazione WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa provider di Talk ora confronta per uguaglianza strutturale, quindi differenze solo nell’ordine delle chiavi non attivano più modifiche no-op ripetute con `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor analizza tutti i manifest Plugin installati alla ricerca di chiavi capability deprecate di livello superiore (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, offre di spostarle nell’oggetto `contracts` e riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dello store cron legacy">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, oppure `cron.store` quando è sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi del payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna `provider` del payload → `delivery.channel` esplicito
    - processi di fallback Webhook legacy semplici con `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente solo i processi `notify: true` quando può farlo senza cambiare il comportamento. Se un processo combina il fallback notify legacy con una modalità di consegna non Webhook esistente, doctor emette un avviso e lascia quel processo alla revisione manuale.

    Su Linux, doctor emette anche un avviso quando la crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Questo script locale dell'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi di sessione">
    Doctor analizza ogni directory di sessione degli agenti alla ricerca di file write-lock obsoleti — file rimasti quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è considerato obsoleto (PID morto, più vecchio di 30 minuti, o un PID attivo per cui si può dimostrare che appartiene a un processo non OpenClaw). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e ti indica di rieseguirlo con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami del transcript di sessione">
    Doctor analizza i file JSONL delle sessioni degli agenti alla ricerca della forma di ramo duplicata creata dal bug di riscrittura del prompt transcript del 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive il transcript sul ramo attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, instradamento e sicurezza)">
    La directory di stato è il centro operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa di una perdita di stato catastrofica, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando rileva una discrepanza di proprietario/gruppo).
    - **Directory di stato sincronizzata sul cloud macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati sulla sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente con le scritture di sessioni e credenziali.
    - **Directory delle sessioni mancanti**: `sessions/` e la directory dello store delle sessioni sono obbligatorie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Disallineamento del transcript**: avvisa quando le voci di sessione recenti hanno file transcript mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando il transcript principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in directory home diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringere a `600`.

  </Accordion>
  <Accordion title="5. Integrità autenticazione modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'auth store, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. Le richieste di refresh compaiono solo quando l'esecuzione è interattiva (TTY); `--non-interactive` salta i tentativi di refresh.

    Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant`, o un provider indica di effettuare di nuovo l'accesso), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili auth temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di crearle o passare a nomi legacy se l'immagine attuale manca.
  </Accordion>
  <Accordion title="7b. Pulizia installazione Plugin">
    Doctor rimuove lo stato di staging delle dipendenze dei Plugin legacy generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre radici di dipendenze generate obsolete, vecchie directory install-stage, detriti locali dei pacchetti da codice precedente di riparazione delle dipendenze dei bundled Plugin, e copie npm gestite orfane o recuperate di Plugin `@openclaw/*` bundled che possono oscurare il manifest bundled attuale. Doctor ricollega anche il pacchetto host `openclaw` nei Plugin npm gestiti che dichiarano `peerDependencies.openclaw`, così gli import runtime locali al pacchetto come `openclaw/plugin-sdk/*` continuano a risolversi dopo aggiornamenti o riparazioni npm.

    Doctor può anche reinstallare Plugin scaricabili mancanti quando la configurazione li riferimento ma il registro locale dei Plugin non li trova. Gli esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime degli agenti configurati. Durante gli aggiornamenti di pacchetto, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il pacchetto core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato necessita ancora di recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway attuale. Può anche cercare servizi aggiuntivi simili a Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Matrix all'avvio">
    Quando un account di canale Matrix ha una migrazione di stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato interamente.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale controllo di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mismatch della chiave pubblica in cui l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti derivano al di fuori della baseline di associazione approvata
    - voci locali nella cache dei token dispositivo per la macchina attuale che precedono una rotazione del token lato Gateway o trasportano metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune buco "già associato ma ricevo ancora richiesta di associazione": doctor ora distingue la prima associazione dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se viene eseguito come servizio utente systemd, doctor assicura che il lingering sia abilitato così il Gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono insieme al workspace attuale.
    - **Stato Plugin**: conta Plugin abilitati/disabilitati/con errore; elenca gli ID dei Plugin per eventuali errori; segnala le capacità dei Plugin del bundle.
    - **Avvisi di compatibilità Plugin**: segnala i Plugin che hanno problemi di compatibilità con il runtime attuale.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro dei Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file bootstrap">
    Doctor controlla se i file bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o superiori al budget di caratteri configurato. Segnala per ogni file i conteggi di caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file vengono troncati o sono vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin canale mancante, rimuove anche la configurazione sospesa con ambito canale che faceva riferimento a quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo previene loop di avvio del Gateway in cui il runtime del canale è scomparso ma la configurazione chiede ancora al gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell attuale (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo in modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione Gateway (token locale)">
    Doctor controlla la preparazione dell'autenticazione con token del Gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor propone di generarne uno.
    - Se `gateway.auth.token` è gestito tramite SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento runtime fail-fast.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o indicare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità Gateway + riavvio">
    Doctor esegue un controllo di integrità e propone di riavviare il Gateway quando sembra non integro.
  </Accordion>
  <Accordion title="13b. Preparazione della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione attuabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato di probe del Gateway in cache (il Gateway era integro al momento del controllo), doctor confronta il suo risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping degli embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la preparazione degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato dei canali">
    Se il Gateway è integro, doctor esegue un probe dello stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installato (launchd/systemd/schtasks) per valori predefiniti mancanti o obsoleti (ad es. dipendenze systemd da network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd Gateway corrispondente è attiva. Inoltre ignora le unità extra inattive non legacy simili al Gateway durante la scansione dei servizi duplicati, così i file di servizio companion non generano rumore di pulizia.
    - Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito tramite SecretRef, l'installazione/riparazione del servizio doctor valida il SecretRef ma non persiste i valori del token in testo in chiaro risolti nei metadati dell'ambiente del servizio supervisore.
    - Doctor rileva valori di ambiente del servizio gestiti con `.env`/SecretRef che installazioni LaunchAgent, systemd o Windows Scheduled Task precedenti incorporavano inline e riscrive i metadati del servizio affinché quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio imposta ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio alla porta corrente.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di drift dei token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica runtime + porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non effettivamente in esecuzione. Controlla inoltre collisioni di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice runtime del Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da un version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono interrompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor propone di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, così i binari di sistema gestiti da Homebrew rimangono disponibili mentre Volta, asdf, fnm, pnpm e altre directory dei version manager non cambiano quale Node viene risolto dai processi figlio. I servizi Linux mantengono ancora radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback dei version manager dedotte vengono scritte nel PATH del servizio solo quando tali directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e marca i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per l'area di lavoro (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria per l'area di lavoro quando manca e stampa un suggerimento di backup se l'area di lavoro non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura dell'area di lavoro e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
