---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-04-30T08:51:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stati obsoleti, verifica l'integrità e fornisce passaggi di riparazione applicabili.

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

    Applica anche riparazioni aggressive (sovrascrive le configurazioni personalizzate del supervisore).

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
    - Aggiornamento pre-flight opzionale per installazioni git (solo interattivo).
    - Controllo di freschezza del protocollo UI (ricompila la Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo dello stato Skills (idonei/mancanti/bloccati) e stato dei Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi piatti legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e preparazione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OpenAI Codex OAuth.
    - Migrazione dello stato legacy su disco (sessioni/dir agente/auth WhatsApp).
    - Migrazione delle chiavi legacy del contratto del manifesto Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job webhook fallback semplici `notify: true`).
    - Migrazione della runtime-policy agente legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione Plugin obsoleta quando i Plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti Plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni delle sessioni per rami duplicati di riscrittura prompt creati dalle build 2026.4.24 interessate.
    - Controlli di integrità e permessi dello stato (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) quando eseguito localmente.
    - Integrità auth modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati dei profili auth.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisori">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione del servizio legacy e rilevamento di gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal gateway in esecuzione).
    - Audit della configurazione del supervisore (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente proxy incorporato per servizi gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante l'installazione o l'aggiornamento.
    - Controlli delle best practice runtime Gateway (Node vs Bun, percorsi dei version manager).
    - Diagnostica delle collisioni di porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna origine token; non sovrascrive configurazioni SecretRef token).
    - Rilevamento di problemi di pairing dispositivo (richieste di pairing iniziale in sospeso, upgrade ruolo/scope in sospeso, drift obsoleto della cache locale dei token dispositivo e drift auth dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo dimensione del file bootstrap del workspace (avvisi di troncamento/vicino al limite per file di contesto).
    - Controllo dello stato del completamento shell e installazione/upgrade automatico.
    - Controllo preparazione del provider embedding per ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione da sorgente (mancata corrispondenza workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive la configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset della UI Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il flusso di lavoro di dreaming grounded. Queste azioni usano metodi RPC in stile gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** scansiona i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario backfill marcate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci staged grounded-only a breve termine provenienti da replay storico e che non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage candidati grounded nello store live di promozione a breve termine, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale lane di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage candidati durevoli grounded nello store di dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questa è una checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico per canale), doctor le normalizza nello schema corrente.

    Questo include i campi piatti Talk legacy. La configurazione Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi si rifiutano di essere eseguiti e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiega quali chiavi legacy sono state trovate.
    - Mostra la migrazione applicata.
    - Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Anche il Gateway esegue automaticamente le migrazioni doctor all'avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
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
    - Per canali con `accounts` nominati ma valori canale di primo livello single-account residui, sposta quei valori con scope account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare un target nominato/predefinito corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modello
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione relay dell'estensione legacy)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l'avvio del gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi doctor includono anche indicazioni sull'account predefinito per canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override dei provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questi sovrascrivono il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare il routing API per modello + i costi.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e predisposizione a Chrome MCP">
    Se la configurazione del browser punta ancora al percorso dell'estensione Chrome rimossa, doctor la normalizza al modello attuale di collegamento Chrome MCP locale all'host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor controlla anche il percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili predefiniti di connessione automatica
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ti ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare al posto tuo l'impostazione lato Chrome. Chrome MCP locale all'host richiede comunque:

    - un browser basato su Chromium 144+ sull'host Gateway/Node
    - il browser in esecuzione localmente
    - il debug remoto abilitato in quel browser
    - l'approvazione del primo prompt di consenso al collegamento nel browser

    La predisposizione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene i limiti di routing Chrome MCP attuali; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS per OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa convalidare la catena di certificati. Se la verifica fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per la piattaforma. Su macOS con Node installato tramite Homebrew, la correzione è in genere `brew postinstall ca-certificates`. Con `--deep`, la verifica viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Override dei provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede queste vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo degli header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi sulle route del plugin Codex">
    Quando il plugin Codex incluso è abilitato, doctor controlla anche se i riferimenti ai modelli primari `openai-codex/*` si risolvono ancora tramite il runner PI predefinito. Questa combinazione è valida quando vuoi l'autenticazione OAuth/subscription Codex tramite PI, ma è facile confonderla con l'harness app-server Codex nativo. Doctor avvisa e indica la forma app-server esplicita: `openai/*` più `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non la ripara automaticamente perché entrambe le route sono valide:

    - `openai-codex/*` + PI significa "usa l'autenticazione OAuth/subscription Codex tramite il runner OpenClaw normale."
    - `openai/*` + `runtime: "codex"` significa "esegui il turno incorporato tramite app-server Codex nativo."
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adattatore esterno ACP/acpx."

    Se compare l'avviso, scegli la route che intendevi usare e modifica manualmente la configurazione. Mantieni l'avviso così com'è quando PI Codex OAuth è intenzionale.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare i layout su disco più vecchi nella struttura attuale:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato di autenticazione WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia indietro cartelle legacy come backup. Anche Gateway/CLI esegue automaticamente la migrazione della directory sessioni + agente legacy all'avvio, così cronologia/autenticazione/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione di talk provider/provider-map ora confronta per uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest legacy dei plugin">
    Doctor scansiona tutti i manifest dei plugin installati alla ricerca di chiavi di capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, offre di spostarle nell'oggetto `contracts` e riscrivere il file manifest in-place. Questa migrazione è idempotente; se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio cron legacy">
    Doctor controlla anche l'archivio dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna `provider` del payload → `delivery.channel` esplicito
    - semplici job legacy di fallback Webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza cambiare il comportamento. Se un job combina il fallback notify legacy con una modalità di consegna non Webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock delle sessioni">
    Doctor scansiona ogni directory di sessione degli agenti alla ricerca di file di write-lock obsoleti, cioè file rimasti dopo l'uscita anomala di una sessione. Per ogni file di lock trovato riporta: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e ti indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami delle trascrizioni di sessione">
    Doctor scansiona i file JSONL delle sessioni degli agenti alla ricerca della forma di ramo duplicata creata dal bug di riscrittura della trascrizione dei prompt del 2026.4.24: un turno utente abbandonato con contesto di runtime interno OpenClaw più un sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, così la cronologia del gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ti ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con il cloud su macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory delle sessioni mancanti**: `sessions/` e la directory dell'archivio sessioni sono obbligatorie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza delle trascrizioni**: avvisa quando voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra directory home diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ti ricorda di eseguirlo sull'host remoto (lo stato risiede lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione dei modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro farlo. Se il profilo OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token Anthropic. I prompt di aggiornamento compaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti chiede di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (rate limit/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di crearle o passare ai nomi legacy se l'immagine attuale manca.
  </Accordion>
  <Accordion title="7b. Dipendenze di runtime dei plugin inclusi">
    Doctor verifica le dipendenze di runtime solo per i plugin inclusi attivi nella configurazione attuale o abilitati per impostazione predefinita dal loro manifest incluso, per esempio `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` legacy, `models.providers.*` / riferimenti ai modelli degli agenti configurati, o un plugin incluso abilitato per impostazione predefinita senza ownership del provider. Se ne manca qualcuna, doctor segnala i pacchetti e li installa in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. I plugin esterni usano ancora `openclaw plugins install` / `openclaw plugins update`; doctor non installa dipendenze per percorsi plugin arbitrari.

    Durante la riparazione di doctor, le installazioni npm delle dipendenze runtime incluse segnalano l'avanzamento con uno spinner nelle sessioni TTY e con righe periodiche nell'output inoltrato tramite pipe/headless. Il Gateway e la CLI locale possono anche riparare su richiesta le dipendenze runtime dei plugin inclusi attivi prima di importare un plugin incluso. Queste installazioni sono limitate alla radice di installazione runtime del plugin, vengono eseguite con gli script disabilitati, non scrivono un package lock e sono protette da un lock sulla radice di installazione, così avvii concorrenti della CLI o del Gateway non modificano lo stesso albero `node_modules` nello stesso momento.

  </Accordion>
  <Accordion title="8. Migrazioni dei servizi Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta gateway corrente. Può anche cercare servizi aggiuntivi simili al gateway e stampare suggerimenti di pulizia. I servizi gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono contrassegnati come "extra".

    Su Linux, se il servizio gateway a livello utente manca ma esiste un servizio gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Startup Matrix">
    Quando un account del canale Matrix ha una migrazione dello stato legacy in sospeso o eseguibile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di salute.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati senza un token attivo per un ruolo approvato
    - token associati i cui ambiti divergono dalla baseline di associazione approvata
    - voci locali memorizzate nella cache dei token dispositivo per la macchina corrente che precedono una rotazione del token lato gateway o contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude la lacuna comune "già associato ma riceve ancora pairing required": doctor ora distingue la prima associazione dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità del dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist, oppure quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se in esecuzione come servizio utente systemd, doctor assicura che il lingering sia abilitato così il gateway rimane attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato dell'area di lavoro (Skills, plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato dell'area di lavoro per l'agente predefinito:

    - **Stato Skills**: conta le Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory dell'area di lavoro legacy**: avvisa quando `~/openclaw` o altre directory dell'area di lavoro legacy esistono insieme all'area di lavoro corrente.
    - **Stato Plugin**: conta i plugin abilitati/disabilitati/con errore; elenca gli ID plugin per eventuali errori; segnala le capacità dei plugin bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: espone eventuali avvisi o errori di caricamento emessi dal registro dei plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap dell'area di lavoro (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per ogni file i conteggi dei caratteri raw rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file vengono troncati o sono vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un plugin di canale mancante, rimuove anche la configurazione pendente con ambito canale che faceva riferimento a quel plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo previene loop di avvio del Gateway in cui il runtime del canale non esiste più ma la configurazione chiede ancora al gateway di associarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file memorizzato nella cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione con token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente di token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento runtime fail-fast.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di andare in crash o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di salute del Gateway + riavvio">
    Doctor esegue un controllo di salute e offre di riavviare il gateway quando sembra non sano.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione di percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione eseguibili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato di probe del gateway memorizzato nella cache (il gateway era sano al momento del controllo), doctor confronta il suo risultato con la configurazione visibile alla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato profondo della memoria quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi di stato dei canali">
    Se il gateway è sano, doctor esegue un probe dello stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit e riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installato (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (per esempio dipendenze systemd network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque la salute del servizio ed esegue riparazioni non legate al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità gateway systemd corrispondente è attiva. Ignora anche unità inattive non legacy aggiuntive simili al gateway durante la scansione dei servizi duplicati, così i file di servizio companion non creano rumore di pulizia.
    - Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor valida il SecretRef ma non persiste i valori del token risolti in testo in chiaro nei metadati dell'ambiente del servizio supervisore.
    - Doctor rileva valori di ambiente del servizio gestiti con `.env`/supportati da SecretRef che installazioni meno recenti di LaunchAgent, systemd o Windows Scheduled Task avevano incorporato inline e riscrive i metadati del servizio affinché quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio fissa ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio alla porta corrente.
    - Se l'autenticazione con token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni eseguibili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di deriva dei token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio gateway da un binario OpenClaw più vecchio quando la configurazione è stata scritta l'ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime del Gateway + diagnostica delle porte">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche le collisioni di porte sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Buone pratiche per il runtime del Gateway">
    Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node e i percorsi dei version manager possono interrompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor offre la migrazione a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I servizi appena installati o riparati mantengono radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory fallback dei version manager ipotizzate vengono scritte nel PATH del servizio solo quando tali directory esistono su disco. Questo mantiene il PATH del supervisor generato allineato allo stesso controllo minimal-PATH eseguito successivamente da doctor.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor rende persistenti eventuali modifiche alla configurazione e marca i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per lo workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria dello workspace quando manca e stampa un suggerimento di backup se lo workspace non è già sotto git.

    Consulta [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura dello workspace e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
