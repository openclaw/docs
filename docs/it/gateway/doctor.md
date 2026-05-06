---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-06T08:50:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stati obsoleti, controlla lo stato di salute e fornisce passaggi di riparazione applicabili.

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

    Applica anche riparazioni aggressive (sovrascrive configurazioni del supervisore personalizzate).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta azioni di riavvio/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Stato di salute, UI e aggiornamenti">
    - Aggiornamento preliminare opzionale per installazioni git (solo interattivo).
    - Controllo di aggiornamento del protocollo UI (ricompila Control UI quando lo schema del protocollo è più recente).
    - Controllo dello stato di salute + prompt di riavvio.
    - Riepilogo stato Skills (idonee/mancanti/bloccate) e stato Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi piatti legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell’estensione Chrome e preparazione Chrome MCP.
    - Avvisi sulle sostituzioni del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per profili OpenAI Codex OAuth.
    - Avvisi allowlist Plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora strumenti wildcard o posseduti dal Plugin.
    - Migrazione dello stato legacy su disco (sessions/dir agent/WhatsApp auth).
    - Migrazione chiavi contratto manifest Plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job webhook fallback semplici `notify: true`).
    - Migrazione runtime-policy agent legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione Plugin obsoleta quando i Plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti Plugin obsoleti vengono trattati come configurazione di contenimento inerte e preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione file lock sessione e pulizia lock obsoleti.
    - Riparazione transcript sessione per rami prompt-rewrite duplicati creati da build 2026.4.24 interessate.
    - Rilevamento tombstone di recovery-riavvio subagent bloccati, con supporto `--fix` per eliminare flag di recovery abortita obsoleti in modo che l’avvio non continui a trattare il child come restart-aborted.
    - Controlli di integrità e permessi dello stato (sessions, transcripts, dir stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l’esecuzione locale.
    - Stato auth modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitato degli auth-profile.
    - Rilevamento dir workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisori">
    - Riparazione immagine sandbox quando il sandboxing è abilitato.
    - Migrazione servizio legacy e rilevamento Gateway extra.
    - Migrazione stato legacy canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi stato canale (sondati dal Gateway in esecuzione).
    - Controlli di reattività WhatsApp per stato degradato del ciclo eventi Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo client TUI locali verificati.
    - Riparazione route Codex per ref modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override modello canale e pin route sessione; `--fix` li riscrive in `openai/*` e seleziona `agentRuntime.id: "codex"` solo quando il Plugin Codex è installato, abilitato, contribuisce l’harness `codex` e ha OAuth utilizzabile. Altrimenti seleziona `agentRuntime.id: "pi"`.
    - Audit configurazione supervisore (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell’ambiente proxy incorporato per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli di best practice runtime Gateway (Node vs Bun, percorsi version-manager).
    - Diagnostica collisione porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per modalità token locale (offre generazione token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento problemi di pairing dispositivo (richieste di primo pair in sospeso, upgrade ruolo/scope in sospeso, deriva cache token dispositivo locale obsoleta e deriva auth record associato).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo dimensione file bootstrap workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo preparazione Skills per l’agent predefinito; segnala skill consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare skill non disponibili in `skills.entries`.
    - Controllo stato completamento shell e installazione/aggiornamento automatici.
    - Controllo preparazione provider embedding ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione sorgente (mancata corrispondenza workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset UI Dreams

La scena Dreams di Control UI include azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow dreaming grounded. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio grounded REM diary e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci diary di backfill marcate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci staged grounded-only a breve termine che provengono da replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage candidati grounded nello store di promozione live a breve termine a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale corsia di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage candidati durevoli grounded nello store dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e razionale

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione configurazione">
    Se la configurazione contiene forme di valore legacy (per esempio `messages.ackReaction` senza override specifico per canale), doctor le normalizza nello schema corrente.

    Ciò include campi piatti Talk legacy. La configurazione pubblica corrente per la voce Talk è `talk.provider` + `talk.providers.<provider>`, e la configurazione voce realtime è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy strumenti usa
    voci strumento wildcard o possedute dal Plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    da Plugin che vengono effettivamente caricati; non aggira la allowlist Plugin esclusiva. Doctor scrive `plugins.bundledDiscovery: "compat"` per configurazioni
    allowlist legacy migrate per preservare il comportamento dei provider bundled esistenti, e
    poi punta all’impostazione più rigorosa `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrazioni chiavi configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di essere eseguiti e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Il Gateway esegue automaticamente anche le migrazioni doctor all’avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni dei canali configurati prive di criteri di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - selettori realtime Talk di primo livello legacy (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Per i canali con `accounts` denominati ma con valori di canale di primo livello per account singolo ancora presenti, sposta questi valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare una destinazione denominata/predefinita corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per i timeout di provider/modelli lenti
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l'avvio del gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali con più account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Ciò può forzare i modelli sull'API errata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare routing API + costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione per Chrome MCP">
    Se la configurazione del browser punta ancora al percorso dell'estensione Chrome rimossa, doctor la normalizza al modello attuale di collegamento Chrome MCP host-local:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP host-local quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debugging remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare al posto tuo l'impostazione lato Chrome. Chrome MCP host-local richiede comunque:

    - un browser basato su Chromium 144+ sull'host gateway/nodo
    - il browser in esecuzione localmente
    - debugging remoto abilitato in quel browser
    - approvazione del primo prompt di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti delle route Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, browser remoto o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS per OAuth">
    Quando è configurato un profilo OpenAI Codex OAuth, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa convalidare la catena di certificati. Se la verifica fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per la piattaforma. Su macOS con un Node Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la verifica viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Override del provider Codex OAuth">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy in `models.providers.openai-codex`, possono mettere in ombra il percorso del provider Codex OAuth integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede queste vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Riparazione della route Codex">
    Doctor controlla i riferimenti modello legacy `openai-codex/*`. Il routing nativo dell'harness Codex usa riferimenti modello canonici `openai/*` più `agentRuntime.id: "codex"` affinché il turno passi attraverso l'harness app-server Codex invece del percorso OpenClaw PI OpenAI.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell'agente predefinito e per agente, inclusi modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e stato persistito obsoleto delle route di sessione:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - Il runtime agente corrispondente diventa `agentRuntime.id: "codex"` solo quando Codex è installato, abilitato, contribuisce l'harness `codex` e ha OAuth utilizzabile.
    - In caso contrario il runtime agente corrispondente diventa `agentRuntime.id: "pi"`.
    - Gli elenchi di fallback modello esistenti vengono preservati con le voci legacy riscritte; le impostazioni per modello copiate si spostano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback, pin del profilo auth e pin dell'harness Codex persistiti nelle sessioni vengono riparati in tutti gli store delle sessioni agente individuati.
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adattatore esterno ACP/acpx."

  </Accordion>
  <Accordion title="2g. Pulizia della route di sessione">
    Doctor esamina anche gli store delle sessioni agente individuati alla ricerca di stato di route obsoleto creato automaticamente dopo lo spostamento dei modelli configurati o del runtime fuori da una route di proprietà di un Plugin, come Codex.

    `openclaw doctor --fix` può cancellare lo stato obsoleto creato automaticamente, come pin modello `modelOverrideSource: "auto"`, metadati del modello runtime, ID harness fissati, associazioni sessione CLI e override automatici del profilo auth quando la route proprietaria non è più configurata. Le scelte esplicite dell'utente o dei modelli di sessione legacy vengono segnalate per revisione manuale e lasciate intatte; modificale con `/model ...`, `/new` o reimposta la sessione quando quella route non è più prevista.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare layout su disco più vecchi nella struttura attuale:

    - Store sessioni + transcript:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche Gateway/CLI esegue automaticamente la migrazione delle sessioni legacy + directory agente all'avvio, così cronologia/auth/modelli finiscono nel percorso per agente senza eseguire doctor manualmente. L'auth WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa provider di Talk ora confronta per uguaglianza strutturale, quindi le differenze nel solo ordine delle chiavi non attivano più modifiche `doctor --fix` ripetute e senza effetto.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor esamina tutti i manifest Plugin installati per cercare chiavi capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dello store Cron legacy">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) per vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna `provider` del payload → `delivery.channel` esplicito
    - semplici job fallback webhook legacy `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor esegue la migrazione automatica dei job `notify: true` solo quando può farlo senza modificare il comportamento. Se un job combina il fallback notify legacy con una modalità di consegna non webhook esistente, doctor avvisa e lascia quel job per revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente richiama ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script locale dell'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor analizza ogni directory di sessione agent alla ricerca di file write-lock obsoleti — file lasciati quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del ramo della trascrizione di sessione">
    Doctor analizza i file JSONL delle sessioni agent alla ricerca della forma di ramo duplicata creata dal bug di riscrittura della trascrizione del prompt 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un elemento sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza sessioni, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se sparisce, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con cloud su macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi supportati da sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory sessioni mancanti**: `sessions/` e la directory dello store delle sessioni sono obbligatorie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Disallineamento trascrizioni**: avvisa quando voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Directory di stato multiple**: avvisa quando esistono più cartelle `~/.openclaw` in diverse home directory o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringere a `600`.

  </Accordion>
  <Accordion title="5. Integrità auth del modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nello store auth, avvisa quando i token sono in scadenza/scaduti e può aggiornarli quando è sicuro farlo. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. I prompt di aggiornamento appaiono solo quando l'esecuzione è interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider indica di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa l'esatto comando `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili auth temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori auth)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello Hooks">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento del modello rispetto al catalogo e all'allowlist e avvisa quando non può essere risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di crearle o passare ai nomi legacy se l'immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia installazione Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre root di dipendenze generate obsolete, vecchie directory install-stage, residui locali al package da codice precedente di riparazione delle dipendenze dei Plugin in bundle e copie npm gestite orfane o recuperate di Plugin `@openclaw/*` in bundle che possono oscurare il manifest in bundle corrente.

    Doctor può anche reinstallare Plugin scaricabili mancanti quando la configurazione li referenzia ma il registry Plugin locale non riesce a trovarli. Esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime agent configurati. Durante gli aggiornamenti del package, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il package core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato richiede ancora recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche analizzare servizi aggiuntivi simili a gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome di profilo sono considerati first-class e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Matrix all'avvio">
    Quando un account canale Matrix ha una migrazione di stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Associazione dispositivo e deriva auth">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di scope in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di token attivo per un ruolo approvato
    - token associati i cui scope derivano fuori dalla baseline di associazione approvata
    - voci cache locali device-token per la macchina corrente precedenti a una rotazione token lato gateway o con metadati scope obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token fresco con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune vuoto "già associato ma ricevo ancora richiesta di associazione": doctor ora distingue la prima associazione dagli upgrade di ruolo/scope in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. linger systemd (Linux)">
    Se in esecuzione come servizio utente systemd, doctor assicura che linger sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato workspace (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agent predefinito:

    - **Stato Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace corrente.
    - **Stato Plugin**: conta Plugin abilitati/disabilitati/con errore; elenca gli ID Plugin per eventuali errori; segnala le capacità dei Plugin in bundle.
    - **Avvisi di compatibilità Plugin**: segnala i Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori di load-time emessi dal registry Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione file bootstrap">
    Doctor controlla se i file bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per file i conteggi di caratteri grezzi vs. iniettati, percentuale di troncamento, causa del troncamento (`max/file` o `max/total`) e caratteri iniettati totali come frazione del budget totale. Quando i file vengono troncati o sono vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia Plugin canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin canale mancante, rimuove anche la configurazione pendente con scope di canale che referenziava quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo previene loop di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento tramite tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli auth Gateway (token locale)">
    Doctor controlla la preparazione auth del token gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura compatibili con SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast a runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di `allowFrom` / `groupAllowFrom` `@username` di Telegram prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità + riavvio del Gateway">
    Doctor esegue un controllo di integrità e offre di riavviare il Gateway quando sembra non funzionare correttamente.
  </Accordion>
  <Accordion title="13b. Preparazione della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni per la correzione, inclusi il pacchetto npm e un'opzione di percorso binario manuale.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione applicabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato di sondaggio del Gateway nella cache (il Gateway era integro al momento del controllo), doctor confronta il risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping degli embedding nel percorso predefinito; usa il comando di stato approfondito della memoria quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la preparazione degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi di stato del canale">
    Se il Gateway è integro, doctor esegue un sondaggio dello stato del canale e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Verifica + riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per valori predefiniti mancanti o obsoleti (ad esempio dipendenze systemd network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non legate al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno gestisce quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità Gateway systemd corrispondente è attiva. Ignora inoltre le unità aggiuntive inattive non legacy simili a Gateway durante la scansione dei servizi duplicati, così i file di servizio complementari non creano rumore di pulizia.
    - Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida SecretRef ma non persiste i valori del token in testo normale risolti nei metadati dell'ambiente del servizio del supervisore.
    - Doctor rileva valori dell'ambiente del servizio gestiti, basati su `.env`/SecretRef, che installazioni precedenti di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dalla sorgente di runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio fissa ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni applicabili.
    - Se `gateway.auth.token` e `gateway.auth.password` sono entrambi configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità Linux user-systemd, i controlli doctor di deriva del token ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw più vecchio quando la configurazione è stata scritta l'ultima volta da una versione più recente. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica runtime + porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla inoltre la presenza di conflitti di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Buone pratiche per il runtime del Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei gestori di versione possono interrompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor offre di migrare a un'installazione di sistema di Node quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, quindi Volta, asdf, fnm, pnpm e altre directory dei gestori di versione non cambiano il Node risolto dai processi figli. I servizi Linux mantengono ancora radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback ipotizzate dei gestori di versione vengono scritte nel PATH del servizio solo quando tali directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e marca i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Consulta [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
