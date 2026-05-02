---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche di configurazione incompatibili
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-02T08:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazione/stato obsoleti, controlla l’integrità e fornisce passaggi di riparazione attuabili.

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

    Accetta le impostazioni predefinite senza prompt (inclusi i passaggi di riparazione per riavvio/servizio/sandbox quando applicabile).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza prompt (riparazioni + riavvii dove sicuro).

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

    Analizza i servizi di sistema per installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, UI e aggiornamenti">
    - Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
    - Controllo di aggiornamento del protocollo UI (ricompila la Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo dello stato Skills (idonei/mancanti/bloccati) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi legacy piatti `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell’estensione Chrome e preparazione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth di OpenAI Codex.
    - Avvisi sulla allowlist di Plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora caratteri jolly o strumenti di proprietà del plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agente/autenticazione WhatsApp).
    - Migrazione delle chiavi contrattuali del manifest plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job di fallback Webhook semplici `notify: true`).
    - Migrazione della runtime-policy agente legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti plugin obsoleti vengono trattati come configurazione di contenimento inerte e preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione dei transcript di sessione per rami di riscrittura prompt duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento delle tombstone di ripristino-riavvio dei sottoagenti bloccati, con supporto `--fix` per cancellare flag di ripristino interrotto obsoleti in modo che l’avvio non continui a trattare il figlio come interrotto dal riavvio.
    - Controlli di integrità dello stato e permessi (sessioni, transcript, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) quando eseguito localmente.
    - Integrità dell’autenticazione modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati dei profili di autenticazione.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell’immagine sandbox quando il sandboxing è abilitato.
    - Migrazione del servizio legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd memorizzata nella cache).
    - Avvisi sullo stato dei canali (verificati dal gateway in esecuzione).
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
    - Pulizia dell’ambiente proxy incorporato per servizi Gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante l’installazione o l’aggiornamento.
    - Controlli delle buone pratiche runtime Gateway (Node vs Bun, percorsi dei version manager).
    - Diagnostica delle collisioni della porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Autenticazione, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli di autenticazione Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive le configurazioni token SecretRef).
    - Rilevamento dei problemi di pairing dei dispositivi (richieste di primo pairing in sospeso, upgrade ruolo/ambito in sospeso, drift della cache locale dei token dispositivo obsoleta e drift di autenticazione dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo della dimensione del file bootstrap del workspace (avvisi di troncamento/vicinanza al limite per i file di contesto).
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo della preparazione del provider di embedding per la ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli delle installazioni da sorgente (mismatch del workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati della procedura guidata.

  </Accordion>
</AccordionGroup>

## Backfill e reset della UI Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow di Dreaming grounded. Queste azioni usano metodi RPC in stile gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario di backfill contrassegnate da `DREAMS.md`.
- **Clear Grounded** rimuove solo le voci a breve termine staged solo-grounded che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non eseguono automaticamente lo stage dei candidati grounded nello store di promozione a breve termine live a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale lane di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo esegue lo stage dei candidati durevoli grounded nello store di Dreaming a breve termine, mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e razionale

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se questo è un checkout git e doctor viene eseguito in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema corrente.

    Questo include i campi piatti Talk legacy. La configurazione Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa dei provider.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    caratteri jolly o voci di strumenti di proprietà del plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira la allowlist esclusiva dei plugin.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi si rifiutano di essere eseguiti e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiega quali chiavi legacy sono state trovate.
    - Mostra la migrazione applicata.
    - Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Anche il Gateway esegue automaticamente le migrazioni doctor all’avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

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
    - Per i canali con `accounts` denominati ma con valori di canale di primo livello a singolo account ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare una destinazione denominata/predefinita corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per i timeout di provider/modelli lenti
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l'avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Ciò può forzare i modelli sull'API errata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare routing API + costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione a Chrome MCP">
    Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza al modello attuale di collegamento Chrome MCP locale all'host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor controlla anche il percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - verifica se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - verifica la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (ad esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome per te. Chrome MCP locale all'host richiede comunque:

    - un browser basato su Chromium 144+ sull'host gateway/nodo
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione della prima richiesta di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti per il collegamento locale. Existing-session mantiene i limiti attuali delle route Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OpenAI Codex OAuth, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se il probe fallisce con un errore di certificato (ad esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con Node da Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, il probe viene eseguito anche se il gateway è integro.
  </Accordion>
  <Accordion title="2e. Override del provider Codex OAuth">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, queste possono oscurare il percorso del provider Codex OAuth integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi sulle route del Plugin Codex">
    Quando il Plugin Codex incluso è abilitato, doctor verifica anche se i riferimenti al modello primario `openai-codex/*` vengono ancora risolti tramite il runner PI predefinito. Questa combinazione è valida quando vuoi l'autenticazione Codex OAuth/abbonamento tramite PI, ma è facile confonderla con l'harness nativo dell'app-server Codex. Doctor avvisa e indica la forma esplicita dell'app-server: `openai/*` più `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non ripara automaticamente questa configurazione perché entrambe le route sono valide:

    - `openai-codex/*` + PI significa "usa l'autenticazione Codex OAuth/abbonamento tramite il runner OpenClaw normale."
    - `openai/*` + `agentRuntime.id: "codex"` significa "esegui il turno incorporato tramite l'app-server Codex nativo."
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adattatore ACP/acpx esterno."

    Se compare l'avviso, scegli la route che intendevi usare e modifica manualmente la configurazione. Mantieni l'avviso così com'è quando PI Codex OAuth è intenzionale.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare i layout su disco più vecchi nella struttura attuale:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agent:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato di autenticazione WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (tranne `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche Gateway/CLI migra automaticamente all'avvio le sessioni legacy + la directory agent, così cronologia/autenticazione/modelli arrivano nel percorso per-agent senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa-provider di Talk ora confronta tramite uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor analizza tutti i manifest Plugin installati cercando chiavi di capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e di riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio Cron legacy">
    Doctor controlla anche l'archivio dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie Cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di recapito di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di recapito `provider` nel payload → `delivery.channel` esplicito
    - semplici job fallback webhook legacy `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza cambiare il comportamento. Se un job combina il fallback notify legacy con una modalità di recapito non-webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora lo script legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script locale all'host non è mantenuto dall'attuale OpenClaw e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi di sessione">
    Doctor esamina ogni directory di sessione degli agenti alla ricerca di file di blocco di scrittura obsoleti — file lasciati quando una sessione è terminata in modo anomalo. Per ogni file di blocco trovato segnala: il percorso, il PID, se il PID è ancora attivo, l'età del blocco e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di blocco obsoleti; altrimenti stampa una nota e ti indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del ramo della trascrizione di sessione">
    Doctor esamina i file JSONL delle sessioni degli agenti alla ricerca della forma di ramo duplicata creata dal bug di riscrittura della trascrizione dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un fratello attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, così la cronologia del gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza sessione, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, propone di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Autorizzazioni della directory di stato**: verifica la scrivibilità; offre di riparare le autorizzazioni (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza tra proprietario/gruppo).
    - **Directory di stato sincronizzata su cloud in macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi supportati da sincronizzazione possono causare I/O più lento e corse tra blocco/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale su SD o eMMC può essere più lento e usurarsi più rapidamente con scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dello store delle sessioni sono necessarie per mantenere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza della trascrizione**: avvisa quando voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra le directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Autorizzazioni del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile dal gruppo/mondo e offre di restringerle a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione del modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nello store di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. I prompt di aggiornamento compaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti chiede di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - brevi periodi di cooldown (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e alla allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di compilarle o di passare a nomi legacy se l'immagine corrente manca.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre radici di dipendenze generate obsolete, vecchie directory di install-stage e residui locali al pacchetto provenienti dal precedente codice di riparazione delle dipendenze dei Plugin in bundle.

    Doctor può anche reinstallare Plugin scaricabili configurati quando la configurazione li referenzia ma il registro locale dei Plugin non riesce a trovarli. L'avvio del Gateway e il ricaricamento della configurazione non eseguono gestori di pacchetti; le installazioni dei Plugin restano attività esplicite di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche cercare servizi aggiuntivi simili al Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome di profilo sono considerati di prima classe e non sono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Matrix all'avvio">
    Quando un account canale Matrix ha una migrazione dello stato legacy pendente o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato legacy Matrix e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Abbinamento dispositivo e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di abbinamento dei dispositivi come parte del normale passaggio di salute.

    Cosa segnala:

    - richieste di primo abbinamento in sospeso
    - aggiornamenti di ruolo in sospeso per dispositivi già abbinati
    - aggiornamenti di ambito in sospeso per dispositivi già abbinati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record abbinati a cui manca un token attivo per un ruolo approvato
    - token abbinati i cui ambiti derivano fuori dalla baseline di abbinamento approvata
    - voci locali memorizzate nella cache dei token dispositivo per la macchina corrente che precedono una rotazione del token lato Gateway o contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di abbinamento né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token fresco con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune vuoto "già abbinato ma ricevo ancora richiesta di abbinamento": doctor ora distingue il primo abbinamento dagli aggiornamenti di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza una allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. Linger systemd (Linux)">
    Se in esecuzione come servizio utente systemd, doctor garantisce che il linger sia abilitato così il Gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato dell'area di lavoro (skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato dell'area di lavoro per l'agente predefinito:

    - **Stato delle Skills**: conta le skill idonee, con requisiti mancanti e bloccate dalla allowlist.
    - **Directory legacy dell'area di lavoro**: avvisa quando `~/openclaw` o altre directory di area di lavoro legacy esistono accanto all'area di lavoro corrente.
    - **Stato dei Plugin**: conta Plugin abilitati/disabilitati/in errore; elenca gli ID dei Plugin per eventuali errori; segnala le capacità dei Plugin in bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro dei Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file bootstrap">
    Doctor controlla se i file bootstrap dell'area di lavoro (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o superiori al budget di caratteri configurato. Riporta per ogni file i conteggi dei caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri totali iniettati come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin di canale mancante, rimuove anche la configurazione penzolante con ambito canale che faceva riferimento a quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo previene loop di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al Gateway di associarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo della shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor propone di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione con token del Gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente di token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef del token.

  </Accordion>
  <Accordion title="12b. Riparazioni in sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta la risoluzione automatica invece di andare in crash o segnalare erroneamente che il token manca.

  </Accordion>
  <Accordion title="13. Controllo salute del Gateway + riavvio">
    Doctor esegue un controllo di salute e offre di riavviare il Gateway quando sembra non sano.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione operativi se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato della sonda del Gateway memorizzato nella cache (il Gateway era integro al momento del controllo), doctor confronta il risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping degli embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding in runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato del canale">
    Se il Gateway è integro, doctor esegue una sonda dello stato del canale e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit e riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per rilevare impostazioni predefinite mancanti o obsolete (ad esempio dipendenze systemd da network-online e ritardo di riavvio). Quando trova una discrepanza, consiglia un aggiornamento e può riscrivere il file di servizio/task con i valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque lo stato del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno gestisce quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd Gateway corrispondente è attiva. Ignora inoltre le unità extra inattive simili al Gateway e non legacy durante la scansione dei servizi duplicati, così i file di servizio companion non creano rumore di pulizia.
    - Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida il SecretRef ma non persiste i valori token in testo normale risolti nei metadati dell'ambiente del servizio del supervisore.
    - Doctor rileva valori d'ambiente del servizio gestiti con `.env`/SecretRef che installazioni precedenti di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio affinché quei valori vengano caricati dalla sorgente runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio fissa ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni operative.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di deriva del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio di doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica del runtime e della porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla inoltre eventuali collisioni di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice del runtime del Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei gestori di versione possono rompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor propone la migrazione a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I servizi appena installati o riparati mantengono radici d'ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback dei gestori di versione dedotte vengono scritte nel PATH del servizio solo quando esistono su disco. Questo mantiene il PATH del supervisore generato allineato allo stesso audit con PATH minimo che doctor esegue in seguito.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione e metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e registra i metadati della procedura guidata per annotare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Consulta [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (consigliato GitHub o GitLab privato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
