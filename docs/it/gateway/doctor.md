---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche di configurazione incompatibili
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-03T21:33:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazione/stato obsoleti, verifica lo stato di salute e fornisce passaggi di riparazione attuabili.

## Avvio rapido

```bash
openclaw doctor
```

### Modalità senza interfaccia e di automazione

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accetta i valori predefiniti senza richieste di conferma (inclusi i passaggi di riparazione di riavvio/servizio/sandbox quando applicabili).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza richieste di conferma (riparazioni + riavvii quando sicuri).

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

    Esegui senza richieste di conferma e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta le azioni di riavvio/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analizza i servizi di sistema per installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi rivedere le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Salute, UI e aggiornamenti">
    - Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
    - Controllo di freschezza del protocollo UI (ricompila Control UI quando lo schema del protocollo è più recente).
    - Controllo di salute + richiesta di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione browser per configurazioni legacy dell’estensione Chrome e disponibilità Chrome MCP.
    - Avvisi sulle sostituzioni del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth di Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth di OpenAI Codex.
    - Avvisi allowlist Plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà del Plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agente/autenticazione WhatsApp).
    - Migrazione delle chiavi legacy del contratto del manifest Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job fallback Webhook semplici `notify: true`).
    - Migrazione legacy della policy runtime agente a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione Plugin obsoleta quando i Plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti Plugin obsoleti vengono trattati come configurazione di contenimento inerte e preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami di riscrittura prompt duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento di tombstone di recupero-riavvio per subagenti bloccati, con supporto `--fix` per cancellare flag di recupero interrotto obsoleti, così l’avvio non continua a trattare il child come interrotto dal riavvio.
    - Controlli di integrità dello stato e dei permessi (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l’esecuzione in locale.
    - Salute dell’autenticazione modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione dei profili di autenticazione.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisori">
    - Riparazione dell’immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime del Gateway (servizio installato ma non in esecuzione; etichetta launchd memorizzata nella cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - Audit della configurazione del supervisore (launchd/systemd/schtasks) con riparazione facoltativa.
    - Pulizia dell’ambiente proxy incorporato per servizi Gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime del Gateway (Node vs Bun, percorsi dei gestori di versione).
    - Diagnostica delle collisioni della porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Autenticazione, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli di autenticazione Gateway per la modalità token locale (offre la generazione di token quando non esiste alcuna sorgente token; non sovrascrive le configurazioni SecretRef dei token).
    - Rilevamento di problemi di pairing del dispositivo (richieste di primo pairing in sospeso, upgrade ruolo/scope in sospeso, drift obsoleto della cache locale dei token dispositivo e drift di autenticazione dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo della dimensione del file bootstrap del workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo di disponibilità Skills per l’agente predefinito; segnala Skills consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare Skills non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo di disponibilità del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli dell’installazione da sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati della procedura guidata.

  </Accordion>
</AccordionGroup>

## Riempimento retroattivo e reset della UI Dreams

La scena Dreams di Control UI include azioni **Riempimento retroattivo**, **Reset** e **Cancella ancorati** per il flusso di lavoro Dreaming ancorato. Queste azioni usano metodi RPC in stile doctor del Gateway, ma **non** fanno parte della riparazione/migrazione CLI `openclaw doctor`.

Cosa fanno:

- **Riempimento retroattivo** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM ancorato e scrive voci di riempimento retroattivo reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci di diario di riempimento retroattivo contrassegnate.
- **Cancella ancorati** rimuove solo le voci staged a breve termine esclusivamente ancorate che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in staging i candidati ancorati nello store live di promozione a breve termine, a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico ancorato influenzi il normale percorso di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in staging i candidati durevoli ancorati nello store Dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se si tratta di un checkout git e doctor viene eseguito in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza una sostituzione specifica del canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat legacy di Talk. La configurazione Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa dei provider.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti di proprietà del Plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei Plugin che vengono effettivamente caricati; non aggira l’allowlist esclusiva dei Plugin.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi rifiutano di essere eseguiti e ti chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiega quali chiavi legacy sono state trovate.
    - Mostra la migrazione applicata.
    - Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Il Gateway esegue automaticamente anche le migrazioni doctor all’avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store dei job Cron vengono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configurazioni dei canali configurati senza criterio di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Per i canali con `accounts` denominati ma con valori di canale di primo livello per account singolo ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare un target denominato/predefinito corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per i timeout di provider/modelli lenti
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (l'avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override dei provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Ciò può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare il routing API per modello + i costi.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione per Chrome MCP">
    Se la tua configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza al modello di collegamento Chrome MCP host-local corrente:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP host-local quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione rilevata di Chrome e avvisa quando è inferiore a Chrome 144
    - ti ricorda di abilitare il debug remoto nella pagina di ispezione del browser (ad esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome per te. Chrome MCP host-local richiede comunque:

    - un browser basato su Chromium 144+ sull'host gateway/node
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione del primo prompt di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti di routing Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. Prerequisiti OAuth TLS">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa convalidare la catena di certificati. Se il probe fallisce con un errore di certificato (ad esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per la piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il probe viene eseguito anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Override del provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni legacy di trasporto OpenAI sotto `models.providers.openai-codex`, queste possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a OAuth Codex, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi sulle route del Plugin Codex">
    Quando il Plugin Codex in bundle è abilitato, doctor controlla anche se i riferimenti al modello primario `openai-codex/*` si risolvono ancora tramite il runner PI predefinito. Questa combinazione è valida quando vuoi l'autenticazione OAuth/abbonamento Codex tramite PI, ma è facile confonderla con l'harness app-server Codex nativo. Doctor avvisa e punta alla forma app-server esplicita: `openai/*` più `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non lo ripara automaticamente perché entrambe le route sono valide:

    - `openai-codex/*` + PI significa "usa l'autenticazione OAuth/abbonamento Codex tramite il runner normale di OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "esegui il turno incorporato tramite app-server Codex nativo."
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adapter ACP/acpx esterno."

    Se l'avviso appare, scegli la route che intendevi usare e modifica manualmente la configurazione. Mantieni l'avviso invariato quando OAuth Codex PI è intenzionale.

  </Accordion>
  <Accordion title="3. Migrazioni di stato legacy (layout su disco)">
    Doctor può migrare i vecchi layout su disco nella struttura corrente:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato di autenticazione WhatsApp (Baileys):
      - da legacy `~/.openclaw/credentials/*.json` (tranne `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia eventuali cartelle legacy come backup. Anche Gateway/CLI esegue la migrazione automatica dell'archivio sessioni legacy + della directory agente all'avvio, così cronologia/autenticazione/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa-provider di Talk ora confronta per uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor analizza tutti i manifest dei Plugin installati alla ricerca di chiavi di capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere il file manifest in-place. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio Cron legacy">
    Doctor controlla anche l'archivio dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron correnti includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna payload `provider` → `delivery.channel` esplicito
    - semplici job legacy di fallback webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza cambiare comportamento. Se un job combina il fallback notify legacy con una modalità di consegna non-webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script host-local non è mantenuto dall'attuale OpenClaw e può scrivere messaggi `Gateway inactive` falsi in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di salute correnti.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor esamina ogni directory di sessione degli agenti alla ricerca di file di write-lock obsoleti — file rimasti quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e indica di eseguire di nuovo con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del branch della trascrizione di sessione">
    Doctor esamina i file JSONL delle sessioni degli agenti alla ricerca della forma di branch duplicata creata dal bug di riscrittura della trascrizione del prompt del 2026.4.24: un turno utente abbandonato con il contesto runtime interno di OpenClaw più un elemento sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul branch attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, instradamento e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza tra proprietario/gruppo).
    - **Directory di stato macOS sincronizzata nel cloud**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dello store delle sessioni sono richieste per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza della trascrizione**: avvisa quando le voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in diverse home directory o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringere a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione dei modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nello store di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. Le richieste di aggiornamento appaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti indica di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare a nomi legacy se l'immagine corrente manca.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre root di dipendenze generate obsolete, vecchie directory di install-stage e residui locali al pacchetto provenienti dal precedente codice di riparazione delle dipendenze dei Plugin in bundle.

    Doctor può anche reinstallare i Plugin scaricabili configurati quando la configurazione li referenzia ma il registro locale dei Plugin non riesce a trovarli. Per l'esternalizzazione dei Plugin in bundle del 2026.5.2, doctor installa automaticamente i Plugin scaricabili che la configurazione esistente usa già e poi si affida a `meta.lastTouchedVersion` per eseguire quel passaggio di rilascio una sola volta. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche esaminare servizi aggiuntivi simili a gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema gestisce il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione all'avvio di Matrix">
    Quando un account del canale Matrix ha una migrazione dello stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di salute.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - aggiornamenti di ruolo in sospeso per dispositivi già associati
    - aggiornamenti di ambito in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica dove l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti derivano fuori dalla baseline di associazione approvata
    - voci locali memorizzate nella cache del token dispositivo per la macchina corrente che precedono una rotazione del token lato Gateway o portano metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dei dispositivi. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune vuoto "già associato ma riceve ancora richiesta di associazione": doctor ora distingue la prima associazione dagli aggiornamenti di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se in esecuzione come servizio utente systemd, doctor assicura che il lingering sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato delle Skills**: conta Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace corrente.
    - **Stato dei Plugin**: conta Plugin abilitati/disabilitati/con errori; elenca gli ID dei Plugin per eventuali errori; segnala le capacità dei Plugin in bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: mostra eventuali avvisi o errori in fase di caricamento emessi dal registro dei Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per ogni file conteggi di caratteri grezzi rispetto a quelli iniettati, percentuale di troncamento, causa del troncamento (`max/file` o `max/total`) e caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin di canale mancante, rimuove anche la configurazione dangling con ambito di canale che referenziava quel Plugin: voci `channels.<id>`, target heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo previene loop di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al gateway di associarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo della shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione con token locale del Gateway.

    - Se la modalità token richiede un token e non esiste alcuna sorgente di token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

  </Accordion>
  <Accordion title="12b. Riparazioni in sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni di configurazione mirate.
    - Esempio: la riparazione `allowFrom` / `groupAllowFrom` `@username` di Telegram prova a usare le credenziali bot configurate quando disponibili.
    - Se il token bot di Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta l'auto-risoluzione invece di andare in crash o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e propone di riavviare il Gateway quando sembra non essere integro.
  </Accordion>
  <Accordion title="13b. Preparazione della ricerca in memoria">
    Doctor verifica se il provider di embedding per la ricerca in memoria configurato è pronto per l’agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un’opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: verifica la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell’ambiente o nell’archivio di autenticazione. Stampa suggerimenti di correzione utilizzabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell’ordine di selezione automatica.

    Quando è disponibile un risultato memorizzato nella cache della verifica del Gateway (il Gateway era integro al momento del controllo), doctor lo confronta con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato approfondito della memoria quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la preparazione degli embedding in fase di esecuzione.

  </Accordion>
  <Accordion title="14. Avvisi di stato dei canali">
    Se il Gateway è integro, doctor esegue una verifica dello stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per individuare impostazioni predefinite mancanti o obsolete (ad esempio, dipendenze systemd da network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque l’integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché quel ciclo di vita è gestito da un supervisore esterno.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l’unità systemd Gateway corrispondente è attiva. Inoltre ignora le unità aggiuntive inattive non legacy simili al Gateway durante la scansione dei servizi duplicati, così i file di servizio companion non creano rumore di pulizia.
    - Se l’autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione/riparazione del servizio doctor convalida il SecretRef ma non persiste valori di token in testo semplice risolti nei metadati dell’ambiente del servizio del supervisore.
    - Doctor rileva valori di ambiente del servizio gestiti basati su `.env`/SecretRef che installazioni LaunchAgent, systemd o Windows Scheduled Task più vecchie avevano incorporato inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio fissa ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l’autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni utilizzabili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità systemd utente su Linux, i controlli di deriva del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw più vecchio quando la configurazione è stata scritta l’ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica runtime + porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è realmente in esecuzione. Controlla anche collisioni di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Buone pratiche per il runtime del Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei gestori di versione possono interrompersi dopo gli aggiornamenti perché il servizio non carica l’inizializzazione della shell. Doctor propone di migrare a un’installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, quindi Volta, asdf, fnm, pnpm e altre directory dei gestori di versione non cambiano quale Node viene risolto dai processi figli. I servizi Linux mantengono ancora le radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e le directory user-bin stabili, ma le directory fallback dei gestori di versione dedotte vengono scritte nel PATH del servizio solo quando quelle directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati del wizard">
    Doctor persiste eventuali modifiche alla configurazione e appone un timestamp nei metadati del wizard per registrare l’esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (consigliato GitHub privato o GitLab).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
