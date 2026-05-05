---
read_when:
    - Aggiungere o modificare le migrazioni di doctor
    - Introduzione di modifiche di configurazione incompatibili
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-05T01:46:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazione/stato obsoleti, controlla l'integrità e fornisce passaggi di riparazione attuabili.

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

    Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta azioni di riavvio/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scansiona i servizi di sistema alla ricerca di installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, interfaccia utente e aggiornamenti">
    - Aggiornamento pre-flight opzionale per installazioni git (solo interattivo).
    - Controllo della freschezza del protocollo dell'interfaccia utente (ricompila la Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e preparazione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
    - Avvisi allowlist plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà dei plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory agente/auth WhatsApp).
    - Migrazione delle chiavi del contratto del manifest plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job fallback Webhook semplici `notify: true`).
    - Migrazione della runtime-policy agente legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti plugin obsoleti vengono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami prompt-rewrite duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento delle tombstone di restart-recovery per subagent bloccati, con supporto `--fix` per cancellare flag di recovery interrotti obsoleti in modo che l'avvio non continui a trattare il figlio come interrotto dal riavvio.
    - Controlli di integrità dello stato e permessi (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Integrità auth del modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati dei profili auth.
    - Rilevamento di directory workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; label launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente proxy incorporato per servizi Gateway che hanno acquisito valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime Gateway (Node vs Bun, percorsi dei version manager).
    - Diagnostica delle collisioni della porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna origine token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento di problemi di pairing dispositivo (richieste di pairing iniziale in sospeso, upgrade ruolo/ambito in sospeso, drift obsoleto della cache token-dispositivo locale e drift auth dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo delle dimensioni del file di bootstrap del workspace (avvisi di troncamento/vicino al limite per file di contesto).
    - Controllo di preparazione Skills per l'agente predefinito; segnala skill consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare skill non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatico.
    - Controllo di preparazione del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli delle installazioni da sorgente (mancata corrispondenza workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset della UI Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il flusso di lavoro grounded dreaming. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** scansiona i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci di diario di backfill marcate.
- **Clear Grounded** rimuove solo voci temporanee staged grounded-only che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non inseriscono automaticamente candidati grounded nello store di promozione live a breve termine a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale lane di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durevoli grounded nello store Dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questa è una checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza override specifico del canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat legacy di Talk. La configurazione Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    wildcard o voci di strumenti di proprietà dei plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira l'allowlist esclusiva dei plugin.
    Doctor scrive `plugins.bundledDiscovery: "compat"` per le configurazioni allowlist
    legacy migrate per preservare il comportamento esistente dei provider bundled, e
    poi punta all'impostazione più restrittiva `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi rifiutano di eseguirsi e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Anche il Gateway esegue automaticamente le migrazioni doctor all'avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni di canali configurati prive di criterio di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di livello superiore
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
    - Per i canali con `accounts` denominati ma con valori di canale di livello superiore per account singolo ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può conservare un target denominato/predefinito corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per i timeout lenti di provider/modelli
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (l'avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)

    Gli avvisi di doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare il routing API per modello + i costi.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione a Chrome MCP">
    Se la configurazione del browser punta ancora al percorso dell'estensione Chrome rimossa, doctor la normalizza al modello attuale di attach Chrome MCP locale all'host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor controlla anche il percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - verifica se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ti ricorda di abilitare il debugging remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome per te. Chrome MCP locale all'host richiede comunque:

    - un browser basato su Chromium 144+ sull'host del gateway/nodo
    - il browser in esecuzione localmente
    - debugging remoto abilitato in quel browser
    - approvazione del primo prompt di consenso all'attach nel browser

    La preparazione qui riguarda solo i prerequisiti dell'attach locale. Existing-session mantiene i limiti attuali delle route Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se il probe fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il probe viene eseguito anche se il gateway è integro.
  </Accordion>
  <Accordion title="2e. Override del provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni legacy di trasporto OpenAI sotto `models.providers.openai-codex`, possono oscurare il percorso integrato del provider OAuth Codex che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a OAuth Codex, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il routing/fallback integrato. Proxy personalizzati e override solo di header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi sulle route del Plugin Codex">
    Quando il Plugin Codex in bundle è abilitato, doctor controlla anche se i riferimenti al modello primario `openai-codex/*` si risolvono ancora tramite il runner PI predefinito. Questa combinazione è valida quando vuoi l'autenticazione OAuth/abbonamento Codex tramite PI, ma è facile confonderla con l'harness nativo del server applicativo Codex. Doctor avvisa e indica la forma esplicita del server applicativo: `openai/*` più `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non ripara automaticamente questo caso perché entrambe le route sono valide:

    - `openai-codex/*` + PI significa "usa l'autenticazione OAuth/abbonamento Codex tramite il normale runner OpenClaw."
    - `openai/*` + `agentRuntime.id: "codex"` significa "esegui il turn incorporato tramite il server applicativo nativo Codex."
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adattatore ACP/acpx esterno."

    Se appare l'avviso, scegli la route che intendevi usare e modifica manualmente la configurazione. Mantieni l'avviso invariato quando PI Codex OAuth è intenzionale.

  </Accordion>
  <Accordion title="2g. Pulizia delle route di sessione">
    Doctor scansiona anche lo store delle sessioni attive alla ricerca di stato di route obsoleto creato automaticamente dopo che sposti il modello o runtime predefinito/di fallback configurato lontano da una route posseduta da un Plugin, come Codex.

    `openclaw doctor --fix` può cancellare lo stato obsoleto creato automaticamente, come pin di modello `modelOverrideSource: "auto"`, metadati del modello di runtime, ID harness fissati, associazioni di sessione CLI e override automatici del profilo di autenticazione quando la route proprietaria non è più configurata. Le scelte esplicite dell'utente o legacy del modello di sessione vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new` oppure reimposta la sessione quando quella route non è più prevista.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare i layout più vecchi su disco nella struttura attuale:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da legacy `~/.openclaw/credentials/*.json` (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche il Gateway/CLI migra automaticamente all'avvio le sessioni legacy + la directory agente, così cronologia/auth/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'auth WhatsApp viene migrata intenzionalmente solo tramite `openclaw doctor`. La normalizzazione del provider/mappa provider di Talk ora confronta per uguaglianza strutturale, quindi le differenze solo nell'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor scansiona tutti i manifest dei Plugin installati alla ricerca di chiavi di capability di livello superiore deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, offre di spostarle nell'oggetto `contracts` e riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dello store Cron legacy">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, oppure `cron.store` quando sovrascritto) per vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie Cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di livello superiore (`message`, `model`, `thinking`, ...) → `payload`
    - campi delivery di livello superiore (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di delivery `provider` del payload → `delivery.channel` esplicito
    - semplici job legacy di fallback Webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza cambiare comportamento. Se un job combina il fallback notify legacy con una modalità di delivery non webhook esistente, doctor avvisa e lascia quel job per la revisione manuale.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora il vecchio `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script locale all'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi di sessione">
    Doctor analizza ogni directory di sessione degli agenti alla ricerca di file di write-lock obsoleti — file rimasti dopo l'uscita anomala di una sessione. Per ogni file di lock trovato segnala: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione del ramo della trascrizione di sessione">
    Doctor analizza i file JSONL delle sessioni degli agenti alla ricerca della forma di ramo duplicata creata dal bug di riscrittura della trascrizione dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno di OpenClaw più un elemento sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza della sessione, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con cloud su macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dell'archivio sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza della trascrizione**: avvisa quando le voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in diverse directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato risiede lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile dal gruppo/mondo e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Integrità dell'autenticazione dei modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso del setup-token Anthropic. Le richieste di aggiornamento compaiono solo quando l'esecuzione è interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che richiede di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - brevi cooldown (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Convalida del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor convalida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non può essere risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare ai nomi legacy se l'immagine corrente manca.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre radici di dipendenze generate obsolete, vecchie directory di fase di installazione, residui locali al pacchetto provenienti dal precedente codice di riparazione delle dipendenze dei Plugin in bundle e copie npm gestite orfane o recuperate dei Plugin `@openclaw/*` in bundle che possono oscurare il manifest in bundle corrente.

    Doctor può anche reinstallare i Plugin scaricabili mancanti quando la configurazione li referenzia ma il registro locale dei Plugin non riesce a trovarli. Gli esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime agenti configurati. Durante gli aggiornamenti dei pacchetti, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il pacchetto core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato ha ancora bisogno di recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano operazioni esplicite di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni dei servizi Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche cercare servizi aggiuntivi simili al Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, poi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema gestisce il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Startup Matrix">
    Quando un account canale Matrix ha una migrazione di stato legacy in sospeso o utilizzabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato del tutto.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica dove l'id dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati senza un token attivo per un ruolo approvato
    - token associati i cui ambiti derivano fuori dalla baseline di associazione approvata
    - voci locali memorizzate nella cache del token dispositivo per la macchina corrente che precedono una rotazione del token lato Gateway o contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dei dispositivi. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token fresco con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il buco comune "già associato ma riceve ancora richiesta di associazione": doctor ora distingue la prima associazione dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleta.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se è in esecuzione come servizio utente systemd, doctor assicura che linger sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato dell'area di lavoro (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato dell'area di lavoro per l'agente predefinito:

    - **Stato delle Skills**: conta le Skill idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory legacy dell'area di lavoro**: avvisa quando `~/openclaw` o altre directory legacy dell'area di lavoro esistono accanto all'area di lavoro corrente.
    - **Stato dei Plugin**: conta i Plugin abilitati/disabilitati/con errore; elenca gli ID Plugin per eventuali errori; segnala le capacità dei Plugin del bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: espone eventuali avvisi o errori emessi dal registro dei Plugin in fase di caricamento.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap dell'area di lavoro (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per ogni file i conteggi di caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin canale mancante, rimuove anche la configurazione pendente con ambito canale che referenziava quel Plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo impedisce cicli di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al gateway di associarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo della shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione Gateway (token locale)">
    Doctor controlla la predisposizione dell'autenticazione con token Gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna sorgente di token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef di token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e propone di riavviare il gateway quando sembra non integro.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor verifica se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni per la correzione che includono il pacchetto npm e un'opzione di percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione praticabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato di probe del gateway nella cache (il gateway era integro al momento del controllo), doctor confronta il risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi di stato dei canali">
    Se il gateway è integro, doctor esegue un probe dello stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione supervisor">
    Doctor controlla la configurazione supervisor installata (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (ad es. dipendenze systemd da network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione supervisor.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni supervisor personalizzate.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non di servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione supervisor e pulizia dei servizi legacy perché un supervisor esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd gateway corrispondente è attiva. Ignora inoltre unità extra inattive simili al gateway e non legacy durante la scansione dei servizi duplicati, così i file di servizio complementari non creano rumore di pulizia.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor valida la SecretRef ma non persiste valori del token in testo in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
    - Doctor rileva valori di ambiente del servizio gestiti basati su `.env`/SecretRef che installazioni meno recenti di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio in modo che quei valori vengano caricati dalla sorgente runtime invece che dalla definizione supervisor.
    - Doctor rileva quando il comando del servizio fissa ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione tramite token richiede un token e la SecretRef del token configurata non è risolta, doctor blocca il percorso di installazione/riparazione con indicazioni praticabili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di divergenza del token di doctor ora includono sia sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, arrestare o riavviare un servizio gateway da un binario OpenClaw meno recente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica runtime + porta del Gateway">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche collisioni di porta sulla porta del gateway (predefinita `18789`) e segnala cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice runtime del Gateway">
    Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor propone di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS installati o riparati di recente usano un PATH di sistema canonico (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, così Volta, asdf, fnm, pnpm e altre directory dei version manager non cambiano quale Node viene risolto dai processi figlio. I servizi Linux mantengono comunque radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory fallback dei version manager stimate vengono scritte nel PATH del servizio solo quando quelle directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati wizard">
    Doctor persiste eventuali modifiche alla configurazione e marca i metadati del wizard per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
