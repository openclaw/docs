---
read_when:
    - Aggiungere o modificare migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-10T19:35:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione e migrazione per OpenClaw. Corregge configurazione/stato obsoleti, controlla lo stato di salute e fornisce passaggi di riparazione attuabili.

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

    Accetta i valori predefiniti senza richiedere conferma (inclusi i passaggi di riparazione per riavvio/servizio/sandbox quando applicabili).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza richiedere conferma (riparazioni + riavvii dove sicuro).

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

    Scansiona i servizi di sistema alla ricerca di installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Stato di salute, UI e aggiornamenti">
    - Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
    - Controllo di aggiornamento del protocollo UI (ricostruisce la Control UI quando lo schema del protocollo è più recente).
    - Controllo dello stato di salute + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e prontezza Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
    - Avvisi allowlist di plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà del plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agente/auth WhatsApp).
    - Migrazione delle chiavi legacy del contratto manifest del plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job webhook fallback semplici `notify: true`).
    - Pulizia della runtime-policy legacy dell'intero agente; la policy runtime provider/modello è il selettore di percorso attivo.
    - Pulizia della configurazione di plugin obsoleti quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti a plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione dei transcript di sessione per rami di riscrittura del prompt duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento delle tombstone di ripristino-riavvio di subagent bloccati, con supporto `--fix` per cancellare flag di ripristino interrotto obsoleti in modo che l'avvio non continui a trattare il processo child come interrotto dal riavvio.
    - Controlli di integrità e permessi dello stato (sessioni, transcript, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Stato di salute auth del modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione del profilo auth.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione del servizio legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime del Gateway (servizio installato ma non in esecuzione; label launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - I controlli dei permessi specifici per canale si trovano sotto `openclaw channels capabilities`; per esempio, i permessi dei canali vocali Discord vengono verificati con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Controlli di reattività WhatsApp per stato di salute degradato dell'event loop del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo client TUI locali verificati.
    - Riparazione del percorso Codex per ref modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello dei canali e pin dei percorsi di sessione; `--fix` li riscrive in `openai/*`, rimuove pin runtime obsoleti di sessione/intero agente e lascia le ref agente OpenAI canoniche sull'harness Codex predefinito.
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
    - Pulizia dell'ambiente proxy incorporato per servizi Gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime del Gateway (Node vs Bun, percorsi dei version manager).
    - Diagnostica delle collisioni della porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e abbinamento">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth del Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento di problemi di abbinamento dispositivo (richieste di primo abbinamento in sospeso, upgrade ruolo/ambito in sospeso, drift obsoleto della cache token dispositivo locale e drift auth del record abbinato).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo della dimensione dei file bootstrap del workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo di prontezza Skills per l'agente predefinito; segnala skill consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare skill non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo di prontezza del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli dell'installazione da sorgente (mancata corrispondenza workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset dell'UI Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow di dreaming grounded. Queste azioni usano metodi RPC in stile doctor del gateway, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** scansiona i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il pass del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario di backfill contrassegnate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci staged grounded-only a breve termine che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto quotidiano.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage candidati grounded nello store di promozione live a breve termine, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale corsia di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage candidati durevoli grounded nello store di dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza override specifico per canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat legacy di Talk. La configurazione speech Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`, e la configurazione realtime voice è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti di proprietà del plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira l'allowlist esclusiva dei plugin.
    Doctor scrive `plugins.bundledDiscovery: "compat"` per configurazioni allowlist legacy migrate
    per preservare il comportamento dei provider bundled esistente, e
    poi indica l'impostazione `"allowlist"` più rigorosa.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi rifiutano di eseguirsi e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L'avvio del Gateway rifiuta formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni configured-channel senza criterio di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Per i canali con `accounts` denominati ma valori di canale di primo livello per account singolo ancora presenti, sposta quei valori con ambito account nell’account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare una destinazione denominata/default corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modelli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell’estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l’avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)
    - rimuovi `plugins.entries.codex.config.codexDynamicToolsProfile`; il server app Codex mantiene sempre nativi gli strumenti workspace nativi di Codex

    Gli avvisi di Doctor includono anche indicazioni sull’account predefinito per canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull’API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l’override e ripristinare il routing API per modello + i costi.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione per Chrome MCP">
    Se la tua configurazione del browser punta ancora al percorso rimosso dell’estensione Chrome, doctor la normalizza al modello corrente di collegamento Chrome MCP locale all’host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor controlla anche il percorso Chrome MCP locale all’host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare per te l’impostazione lato Chrome. Chrome MCP locale all’host richiede comunque:

    - un browser basato su Chromium 144+ sull’host gateway/nodo
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione della prima richiesta di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene i limiti di route correnti di Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS per OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor sonda l’endpoint di autorizzazione OpenAI per verificare che lo stack TLS Node/OpenSSL locale possa validare la catena di certificati. Se la sonda fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la sonda viene eseguita anche se il gateway è integro.
  </Accordion>
  <Accordion title="2e. Override del provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede queste vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l’override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Riparazione delle route Codex">
    Doctor controlla i riferimenti modello `openai-codex/*` legacy. Il routing nativo dell’harness Codex usa riferimenti modello canonici `openai/*`; i turni agente OpenAI passano attraverso l’harness del server app Codex invece del percorso OpenAI PI di OpenClaw.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell’agente predefinito e per agente, inclusi modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e stato delle route di sessione persistito obsoleto:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - L’intento Codex si sposta in voci `agentRuntime.id: "codex"` con ambito provider/modello per i riferimenti modello agente riparati, così i profili auth `openai-codex:...` possono ancora essere selezionati dopo che il riferimento modello diventa `openai/*`.
    - La configurazione runtime dell’intero agente obsoleta e i pin runtime di sessione persistiti vengono rimossi perché la selezione runtime ha ambito provider/modello.
    - Il criterio runtime provider/modello esistente viene preservato a meno che il riferimento modello legacy riparato richieda il routing Codex per mantenere il vecchio percorso auth.
    - Gli elenchi di fallback modello esistenti vengono preservati con le relative voci legacy riscritte; le impostazioni per modello copiate si spostano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback e pin del profilo auth di sessione persistiti vengono riparati in tutti gli store di sessione agente scoperti.
    - `/codex ...` significa “controlla o associa una conversazione nativa Codex dalla chat.”
    - `/acp ...` o `runtime: "acp"` significa “usa l’adattatore ACP/acpx esterno.”

  </Accordion>
  <Accordion title="2g. Pulizia delle route di sessione">
    Doctor analizza anche gli store di sessione agente scoperti alla ricerca di stato di route obsoleto creato automaticamente dopo che hai spostato i modelli configurati o il runtime fuori da una route posseduta da un Plugin come Codex.

    `openclaw doctor --fix` può eliminare stato obsoleto creato automaticamente come pin modello `modelOverrideSource: "auto"`, metadati runtime modello, ID harness fissati, associazioni sessione CLI e override automatici del profilo auth quando la route proprietaria non è più configurata. Le scelte esplicite dell’utente o dei modelli di sessione legacy vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new` o reimposta la sessione quando quella route non è più desiderata.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare i layout su disco più vecchi nella struttura corrente:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Il Gateway/CLI migra automaticamente anche le sessioni legacy + directory agente all’avvio, così cronologia/auth/modelli finiscono nel percorso per agente senza dover eseguire doctor manualmente. L’auth WhatsApp viene intenzionalmente migrato solo tramite `openclaw doctor`. La normalizzazione provider/mappa provider Talk ora confronta per uguaglianza strutturale, quindi le diff dovute solo all’ordine delle chiavi non attivano più modifiche no-op ripetute con `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor analizza tutti i manifest Plugin installati alla ricerca di chiavi di capacità di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, offre di spostarle nell’oggetto `contracts` e riscrivere il file manifest in-place. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dello store cron legacy">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) per vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron correnti includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi del payload di livello superiore (`message`, `model`, `thinking`, ...) → `payload`
    - campi di delivery di livello superiore (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di delivery `provider` del payload → `delivery.channel` esplicito
    - semplici job di fallback Webhook legacy `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor esegue la migrazione automatica solo dei job `notify: true` quando può farlo senza modificare il comportamento. Se un job combina il fallback notify legacy con una modalità di delivery non Webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Questo script locale all'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per gli attuali controlli di integrità.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi di sessione">
    Doctor analizza ogni directory di sessione degli agenti alla ricerca di file di write-lock obsoleti: file rimasti quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto, più vecchio di 30 minuti, oppure un PID attivo che può essere provato appartenere a un processo non OpenClaw). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del branch del transcript di sessione">
    Doctor analizza i file JSONL delle sessioni degli agenti alla ricerca della forma di branch duplicata creata dal bug di riscrittura del transcript del prompt del 2026.4.24: un turno utente abbandonato con il contesto runtime interno di OpenClaw più un sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive il transcript sul branch attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza sessione, routing e sicurezza)">
    La directory di stato è il centro operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza owner/group).
    - **Directory di stato sincronizzata su cloud in macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sync.
    - **Directory di stato su SD o eMMC in Linux**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e consumarsi più rapidamente con scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dello store delle sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza del transcript**: avvisa quando le voci di sessione recenti hanno file transcript mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando il transcript principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra le home directory o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato risiede lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da group/world e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Integrità dell'autenticazione dei modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nello store di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. Le richieste di refresh compaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di refresh.

    Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che chiede di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa l'esatto comando `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Convalida del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor convalida il riferimento del modello rispetto al catalogo e all'allowlist e avvisa quando non verrà risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di compilarle o passare ai nomi legacy se l'immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre root di dipendenze generate obsolete, vecchie directory di install-stage, detriti locali al package da codice precedente di riparazione delle dipendenze dei Plugin in bundle e copie npm gestite orfane o recuperate dei Plugin `@openclaw/*` in bundle che possono oscurare il manifesto in bundle corrente.

    Doctor può anche reinstallare Plugin scaricabili mancanti quando la configurazione li referenzia ma il registro Plugin locale non riesce a trovarli. Gli esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime degli agenti configurati. Durante gli aggiornamenti dei package, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il package core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato necessita ancora di recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano attività esplicite di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche analizzare servizi aggiuntivi simili al Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome di profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente è mancante ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione di avvio Matrix">
    Quando un account del canale Matrix ha una migrazione di stato legacy pendente o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato interamente.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di prima associazione pendenti
    - upgrade di ruolo pendenti per dispositivi già associati
    - upgrade di scope pendenti per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui scope deviano dalla baseline di associazione approvata
    - voci locali nella cache dei token dispositivo per la macchina corrente che precedono una rotazione del token lato Gateway o contengono metadati di scope obsoleti

    Doctor non approva automaticamente le richieste di associazione e non ruota automaticamente i token dei dispositivi. Stampa invece gli esatti passaggi successivi:

    - ispeziona le richieste pendenti con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token fresco con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e approva nuovamente un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune vuoto "già associato ma riceve ancora pairing required": doctor ora distingue la prima associazione dagli upgrade di ruolo/scope pendenti e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist, oppure quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se è in esecuzione come servizio utente systemd, doctor assicura che lingering sia abilitato così il Gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace corrente.
    - **Stato Plugin**: conta Plugin abilitati/disabilitati/con errori; elenca gli ID Plugin per eventuali errori; segnala le capacità dei Plugin in bundle.
    - **Avvisi di compatibilità Plugin**: segnala Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica Plugin**: mostra eventuali avvisi o errori in fase di caricamento emessi dal registro Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione dei file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o superiori al budget di caratteri configurato. Segnala per file i conteggi dei caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin di canale mancante, rimuove anche la configurazione pendente con scope di canale che referenziava quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo impedisce loop di avvio del Gateway in cui il runtime del canale non esiste più ma la configurazione chiede ancora al Gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento tramite tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo della shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file nella cache.
    - Se il completamento è configurato nel profilo ma il file di cache è mancante, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Il comando di diagnostica controlla che l'autenticazione tramite token del Gateway locale sia pronta.

    - Se la modalità token richiede un token e non esiste alcuna origine token, il comando di diagnostica propone di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non è disponibile, il comando di diagnostica avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura compatibili con SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento di errore rapido del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, il comando di diagnostica segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente che il token manca.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Il comando di diagnostica esegue un controllo di integrità e propone di riavviare il Gateway quando sembra non integro.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Il comando di diagnostica controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione attuabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, quindi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato della sonda Gateway memorizzato nella cache (il Gateway era integro al momento del controllo), il comando di diagnostica confronta il suo risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Il comando di diagnostica non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding in fase di runtime.

  </Accordion>
  <Accordion title="14. Avvisi di stato dei canali">
    Se il Gateway è integro, il comando di diagnostica esegue una sonda di stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione del supervisore">
    Il comando di diagnostica controlla la configurazione del supervisore installato (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (ad es. dipendenze systemd network-online e ritardo di riavvio). Quando rileva una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene il comando di diagnostica in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno possiede quel ciclo di vita.
    - Su Linux, il comando di diagnostica non riscrive i metadati di comando/entrypoint mentre l'unità Gateway systemd corrispondente è attiva. Ignora inoltre le unità extra inattive non legacy simili al Gateway durante la scansione dei servizi duplicati, così i file di servizio complementari non creano rumore di pulizia.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio del comando di diagnostica valida il SecretRef ma non persiste i valori token in testo in chiaro risolti nei metadati dell'ambiente del servizio del supervisore.
    - Il comando di diagnostica rileva i valori di ambiente del servizio gestiti e basati su `.env`/SecretRef che installazioni meno recenti di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dall'origine runtime invece che dalla definizione del supervisore.
    - Il comando di diagnostica rileva quando il comando del servizio blocca ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione tramite token richiede un token e il token SecretRef configurato non è risolto, il comando di diagnostica blocca il percorso di installazione/riparazione con indicazioni attuabili.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, il comando di diagnostica blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di deriva del token del comando di diagnostica ora includono sia le origini `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio del comando di diagnostica rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw meno recente quando la configurazione è stata scritta l'ultima volta da una versione più nuova. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime del Gateway + diagnostica delle porte">
    Il comando di diagnostica ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche le collisioni di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Buone pratiche per il runtime del Gateway">
    Il comando di diagnostica avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei gestori di versione possono rompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Il comando di diagnostica propone di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, così i binari di sistema gestiti da Homebrew restano disponibili mentre Volta, asdf, fnm, pnpm e altre directory dei gestori di versione non cambiano quale Node viene risolto dai processi figlio. I servizi Linux mantengono ancora radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback ipotizzate dei gestori di versione vengono scritte nel PATH del servizio solo quando quelle directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Il comando di diagnostica persiste qualsiasi modifica della configurazione e marca i metadati della procedura guidata per registrare l'esecuzione del comando di diagnostica.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Il comando di diagnostica suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
