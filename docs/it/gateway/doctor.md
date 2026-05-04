---
read_when:
    - Aggiungere o modificare migrazioni di doctor
    - Introduzione di modifiche di configurazione non retrocompatibili
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-04T09:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stato obsoleti, controlla lo stato di salute e fornisce passaggi di riparazione attuabili.

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

    Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riavvio/riparazione servizio/sandbox quando applicabili).

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

    Analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive (launchd/systemd/schtasks).

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
    - Controllo della freschezza del protocollo UI (ricostruisce l'Interfaccia di controllo quando lo schema del protocollo è più recente).
    - Controllo di salute + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e preparazione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
    - Avvisi allowlist plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà del plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agent/auth WhatsApp).
    - Migrazione delle chiavi legacy del contratto manifest plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job Webhook di fallback semplici `notify: true`).
    - Migrazione della runtime-policy agent legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami duplicati di prompt-rewrite creati dalle build 2026.4.24 interessate.
    - Rilevamento delle tombstone di restart-recovery dei subagent bloccati, con supporto `--fix` per cancellare flag di recovery aborted obsoleti, così l'avvio non continua a trattare il figlio come restart-aborted.
    - Controlli di integrità e permessi dello stato (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Salute auth modelli: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati degli auth-profile.
    - Rilevamento di directory workspace aggiuntiva (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
    - Pulizia dell'ambiente proxy incorporato per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime Gateway (Node vs Bun, percorsi dei version-manager).
    - Diagnostica delle collisioni di porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna origine token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento dei problemi di pairing dei dispositivi (richieste di primo pairing in sospeso, upgrade ruolo/scope in sospeso, drift della cache token dispositivo locale obsoleta e drift auth dei record abbinati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo dimensione file bootstrap workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo di preparazione Skills per l'agent predefinito; segnala Skills consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare Skills non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo di preparazione del provider embedding per la ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset UI Dreams

La scena Dreams dell'Interfaccia di controllo include azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow grounded dreaming. Queste azioni usano metodi RPC in stile doctor del Gateway, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il pass diario REM grounded e scrive voci backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci diario backfill marcate da `DREAMS.md`.
- **Clear Grounded** rimuove solo le voci staged grounded-only a breve termine che provengono da replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage candidati grounded nello store live di promozione a breve termine, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi il normale canale di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage candidati durevoli grounded nello store dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e razionale

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se questo è un checkout git e doctor viene eseguito in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza override specifico per canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat Talk legacy. La configurazione Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti di proprietà del plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    da plugin che vengono effettivamente caricati; non aggira l'allowlist plugin esclusiva.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi rifiutano di essere eseguiti e ti chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Anche il Gateway esegue automaticamente le migrazioni doctor all'avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - configurazioni dei canali configurati senza criterio di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di livello superiore
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
    - Per i canali con `accounts` denominati ma con valori di canale di livello superiore per account singolo ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare un target denominato/predefinito corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modello
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l'avvio del Gateway ignora anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l'instradamento di fallback può scegliere un account imprevisto.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override dei provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questi sovrascrivono il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare l'instradamento API e i costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione a Chrome MCP">
    Se la configurazione del browser punta ancora al percorso dell'estensione Chrome rimossa, doctor la normalizza al modello attuale di collegamento Chrome MCP locale all'host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili predefiniti con connessione automatica
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (ad esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome al posto tuo. Chrome MCP locale all'host richiede comunque:

    - un browser basato su Chromium 144+ sull'host Gateway/Node
    - il browser in esecuzione localmente
    - il debug remoto abilitato in quel browser
    - l'approvazione del primo prompt di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti di instradamento Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS Node/OpenSSL locale possa validare la catena di certificati. Se il probe fallisce con un errore di certificato (ad esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il probe viene eseguito anche se il gateway è integro.
  </Accordion>
  <Accordion title="2e. Override del provider Codex OAuth">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, queste possono oscurare il percorso del provider Codex OAuth integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di instradamento/fallback. Proxy personalizzati e override solo di header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi sulle route del plugin Codex">
    Quando il plugin Codex in bundle è abilitato, doctor controlla anche se i riferimenti al modello primario `openai-codex/*` si risolvono ancora tramite il runner PI predefinito. Questa combinazione è valida quando vuoi l'autenticazione Codex OAuth/sottoscrizione tramite PI, ma è facile confonderla con l'harness nativo del server app Codex. Doctor avvisa e indica la forma esplicita del server app: `openai/*` più `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non ripara automaticamente questo aspetto perché entrambe le route sono valide:

    - `openai-codex/*` + PI significa "usa l'autenticazione Codex OAuth/sottoscrizione tramite il runner OpenClaw normale."
    - `openai/*` + `agentRuntime.id: "codex"` significa "esegui il turno incorporato tramite il server app Codex nativo."
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adattatore ACP/acpx esterno."

    Se appare l'avviso, scegli la route prevista e modifica manualmente la configurazione. Mantieni l'avviso così com'è quando PI Codex OAuth è intenzionale.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare layout su disco più vecchi nella struttura attuale:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato di autenticazione WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (tranne `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche Gateway/CLI migra automaticamente all'avvio le sessioni legacy + la directory agente, così cronologia/autenticazione/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione del provider/della mappa provider di Talk ora confronta per uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest plugin legacy">
    Doctor analizza tutti i manifest dei plugin installati alla ricerca di chiavi di capacità di livello superiore deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio Cron legacy">
    Doctor controlla anche l'archivio dei job Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie Cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di livello superiore (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di livello superiore (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna `provider` nel payload → `delivery.channel` esplicito
    - semplici job fallback webhook legacy `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza cambiare comportamento. Se un job combina il fallback notify legacy con una modalità di consegna non-webhook esistente, doctor avvisa e lascia quel job per revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora `~/.openclaw/bin/ensure-whatsapp.sh` legacy. Quello script locale all'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi di sessione">
    Doctor esegue la scansione di ogni directory di sessione degli agenti alla ricerca di file di blocco di scrittura obsoleti, ovvero file lasciati quando una sessione è terminata in modo anomalo. Per ogni file di blocco trovato segnala: il percorso, il PID, se il PID è ancora attivo, l'età del blocco e se è considerato obsoleto (PID non attivo o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di blocco obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami delle trascrizioni di sessione">
    Doctor esegue la scansione dei file JSONL delle sessioni degli agenti alla ricerca della forma di ramo duplicata creata dal bug della riscrittura delle trascrizioni dei prompt del 2026.4.24: un turno utente abbandonato con il contesto runtime interno di OpenClaw più un elemento fratello attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, in modo che la cronologia del Gateway e i lettori di memoria non vedano più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, routing e sicurezza)">
    La directory di stato è il centro operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con il cloud su macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati sulla sincronizzazione possono causare I/O più lento e conflitti di blocco/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory delle sessioni mancanti**: `sessions/` e la directory dell'archivio sessioni sono necessarie per mantenere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza della trascrizione**: avvisa quando le voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra le directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato si trova lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile dal gruppo/mondo e offre di restringere i permessi a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione del modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro farlo. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. Le richieste di aggiornamento compaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che indica di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - brevi cooldown (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Convalida del modello Hooks">
    Se `hooks.gmail.model` è impostato, doctor convalida il riferimento del modello rispetto al catalogo e alla allowlist e avvisa quando non può essere risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare ai nomi legacy se l'immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre root di dipendenze generate obsolete, vecchie directory di install-stage, residui locali al pacchetto provenienti dal precedente codice di riparazione delle dipendenze dei plugin in bundle e copie npm gestite orfane o recuperate dei plugin `@openclaw/*` in bundle che possono oscurare il manifest in bundle corrente.

    Doctor può anche reinstallare i plugin scaricabili configurati quando la configurazione li riferisce ma il registro plugin locale non riesce a trovarli. Per l'esternalizzazione dei plugin in bundle del 2026.5.2, doctor installa automaticamente i plugin scaricabili già usati dalla configurazione esistente e poi si affida a `meta.lastTouchedVersion` per eseguire quel passaggio di rilascio una sola volta. L'avvio del Gateway e il ricaricamento della configurazione non eseguono gestori di pacchetti; le installazioni dei plugin restano attività esplicite di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche cercare servizi aggiuntivi simili al gateway e stampare suggerimenti di pulizia. I servizi gateway OpenClaw con nome di profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del gateway.

  </Accordion>
  <Accordion title="8b. Migrazione di avvio Matrix">
    Quando un account del canale Matrix ha una migrazione dello stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato crittografato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Abbinamento dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di abbinamento dei dispositivi come parte del normale controllo di salute.

    Cosa segnala:

    - richieste di abbinamento iniziale in sospeso
    - aggiornamenti di ruolo in sospeso per dispositivi già abbinati
    - aggiornamenti di ambito in sospeso per dispositivi già abbinati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id del dispositivo corrisponde ancora, ma l'identità del dispositivo non corrisponde più al record approvato
    - record abbinati privi di un token attivo per un ruolo approvato
    - token abbinati i cui ambiti divergono dalla baseline di abbinamento approvata
    - voci locali memorizzate nella cache del token del dispositivo per la macchina corrente che precedono una rotazione del token lato gateway o contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di abbinamento né ruota automaticamente i token dei dispositivi. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un nuovo token con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e approva di nuovo un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune vuoto "già abbinato ma ricevo ancora pairing required": doctor ora distingue il primo abbinamento dagli aggiornamenti di ruolo/ambito in sospeso e dalla deriva di token/identità del dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se eseguito come servizio utente systemd, doctor garantisce che il lingering sia abilitato affinché il gateway resti attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (skills, plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato delle Skills**: conta le skill idonee, con requisiti mancanti e bloccate da allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono insieme al workspace corrente.
    - **Stato dei Plugin**: conta i plugin abilitati/disabilitati/con errore; elenca gli ID dei plugin per eventuali errori; riporta le funzionalità dei plugin bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: mostra eventuali avvisi o errori emessi dal registro dei plugin durante il caricamento.

  </Accordion>
  <Accordion title="11b. Dimensione del file bootstrap">
    Doctor controlla se i file bootstrap del workspace (ad esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o superiori al budget di caratteri configurato. Riporta, per ogni file, conteggi di caratteri grezzi rispetto a quelli iniettati, percentuale di troncamento, causa del troncamento (`max/file` o `max/total`) e caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un plugin di canale mancante, rimuove anche la configurazione pendente con ambito canale che faceva riferimento a quel plugin: voci `channels.<id>`, destinazioni heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo evita cicli di avvio del Gateway in cui il runtime del canale non esiste più, ma la configurazione chiede ancora al gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più rapida con file memorizzato nella cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo in modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione Gateway (token locale)">
    Doctor controlla la disponibilità dell'autenticazione tramite token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente di token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef del token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor riporta che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di bloccarsi o segnalare erroneamente che il token manca.

  </Accordion>
  <Accordion title="13. Controllo dello stato del Gateway + riavvio">
    Doctor esegue un controllo dello stato e propone di riavviare il gateway quando risulta non integro.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor verifica se il provider di embedding configurato per la ricerca in memoria è pronto per l’agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un’opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell’ambiente o nell’archivio di autenticazione. Stampa suggerimenti di correzione attuabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ciascun provider remoto nell’ordine di selezione automatica.

    Quando è disponibile un risultato memorizzato nella cache del probe del gateway (il gateway era integro al momento del controllo), doctor confronta il suo risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping degli embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato del canale">
    Se il gateway è integro, doctor esegue un probe dello stato dei canali e segnala gli avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione del supervisore">
    Doctor controlla la configurazione installata del supervisore (launchd/systemd/schtasks) per individuare impostazioni predefinite mancanti o obsolete (ad esempio dipendenze systemd da network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con i valori predefiniti attuali.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque lo stato del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisore e pulizia dei servizi legacy perché un supervisore esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l’unità gateway systemd corrispondente è attiva. Ignora inoltre le unità extra inattive non legacy simili a gateway durante la scansione dei servizi duplicati, così i file di servizio companion non generano rumore di pulizia.
    - Se l’autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l’installazione/riparazione del servizio doctor valida il SecretRef ma non persiste i valori del token in testo in chiaro risolti nei metadati dell’ambiente del servizio supervisore.
    - Doctor rileva i valori di ambiente del servizio gestiti basati su `.env`/SecretRef che installazioni più vecchie di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio in modo che tali valori vengano caricati dalla sorgente di runtime invece che dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio mantiene ancora un vecchio `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta attuale.
    - Se l’autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità systemd utente su Linux, i controlli di drift dei token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l’ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica del runtime del Gateway + porta">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche eventuali collisioni sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice per il runtime del Gateway">
    Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono interrompersi dopo gli aggiornamenti perché il servizio non carica l’inizializzazione della tua shell. Doctor propone la migrazione a un’installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, quindi Volta, asdf, fnm, pnpm e altre directory dei version manager non cambiano quale Node risolvono i processi figli. I servizi Linux mantengono comunque radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory fallback presunte dei version manager vengono scritte nel PATH del servizio solo quando tali directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste qualsiasi modifica alla configurazione e timbra i metadati della procedura guidata per registrare l’esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (consigliato GitHub o GitLab privato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
