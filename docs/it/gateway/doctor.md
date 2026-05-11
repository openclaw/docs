---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-11T20:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
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

    Analizza i servizi di sistema alla ricerca di installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Salute, UI e aggiornamenti">
    - Aggiornamento pre-flight opzionale per installazioni git (solo interattivo).
    - Controllo della freschezza del protocollo UI (ricostruisce la Control UI quando lo schema del protocollo è più recente).
    - Controllo dello stato di salute + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e preparazione di Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OpenAI Codex OAuth.
    - Avvisi sull'allowlist di plugin/strumenti quando `plugins.allow` è restrittivo ma la policy degli strumenti richiede ancora wildcard o strumenti di proprietà dei plugin.
    - Migrazione dello stato legacy su disco (sessioni/dir agente/auth WhatsApp).
    - Migrazione delle chiavi legacy del contratto del manifesto plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job fallback Webhook semplici `notify: true`).
    - Pulizia della policy runtime legacy a livello di intero agente; la policy runtime provider/modello è il selettore di route attivo.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami prompt-rewrite duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento dei tombstone di recupero-riavvio dei subagent bloccati, con supporto `--fix` per cancellare flag di recupero interrotto obsoleti in modo che l'avvio non continui a trattare il figlio come interrotto dal riavvio.
    - Controlli di integrità dello stato e dei permessi (sessioni, trascrizioni, dir stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Salute auth del modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione degli auth-profile.
    - Rilevamento di dir workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - I controlli dei permessi specifici del canale sono in `openclaw channels capabilities`; per esempio, i permessi del canale vocale Discord sono verificati con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Controlli di reattività WhatsApp per salute degradata dell'event loop del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo client TUI locali verificati.
    - Riparazione delle route Codex per riferimenti modello legacy `openai-codex/*` nei modelli primari, fallback, override heartbeat/subagent/compaction, hook, override dei modelli di canale e pin di route di sessione; `--fix` li riscrive in `openai/*`, rimuove pin runtime obsoleti a livello di sessione/intero agente e lascia i riferimenti agente OpenAI canonici sull'harness Codex predefinito.
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente del proxy incorporato per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime Gateway (Node rispetto a Bun, percorsi dei version manager).
    - Diagnostica delle collisioni di porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento di problemi di pairing dispositivo (richieste di primo pairing in sospeso, upgrade ruolo/scope in sospeso, deriva della cache locale device-token obsoleta e deriva auth del record paired).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo della dimensione del file bootstrap del workspace (avvisi di troncamento/vicino al limite per file di contesto).
    - Controllo di preparazione Skills per l'agente predefinito; segnala Skills consentite con binari, env, config o requisiti OS mancanti, e `--fix` può disabilitare Skills non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/upgrade automatici.
    - Controllo di preparazione del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli dell'installazione da sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive la configurazione aggiornata + metadati del wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset dell'interfaccia Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow grounded dreaming. Queste azioni usano metodi RPC in stile doctor del Gateway, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il pass del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario di backfill marcate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci staged a breve termine esclusivamente grounded che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non inseriscono automaticamente candidati grounded nello store di promozione a breve termine live, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale lane di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durable grounded nello store di dreaming a breve termine, mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat legacy di Talk. La configurazione pubblica corrente del parlato Talk è `talk.provider` + `talk.providers.<provider>`, e la configurazione vocale realtime è `talk.realtime.*`. Doctor riscrive le forme obsolete `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti di proprietà dei plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira l'allowlist esclusiva dei plugin. Doctor scrive `plugins.bundledDiscovery: "compat"` per configurazioni allowlist
    legacy migrate per preservare il comportamento esistente dei provider in bundle, e
    poi rimanda all'impostazione più rigorosa `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrazioni di chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi rifiutano di eseguirsi e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L'avvio del Gateway rifiuta i formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurazioni di canali configurati senza una policy di risposta visibile → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di livello superiore
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - selettori Talk realtime di livello superiore legacy (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Per i canali con `accounts` denominati ma valori di canale di livello superiore a singolo account ancora presenti, sposta quei valori con ambito account nell’account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare una destinazione denominata/predefinita corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modello
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell’estensione)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (l’avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)
    - rimuovi `plugins.entries.codex.config.codexDynamicToolsProfile`; il server app Codex mantiene sempre nativi gli strumenti dell’area di lavoro nativi di Codex

    Gli avvisi di doctor includono anche indicazioni sull’account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l’instradamento di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `@earendil-works/pi-ai`. Ciò può forzare i modelli sull’API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere la sovrascrittura e ripristinare l’instradamento API per modello + i costi.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Se la configurazione del browser punta ancora al percorso rimosso dell’estensione Chrome, doctor la normalizza al modello corrente di collegamento Chrome MCP locale all’host:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor verifica anche il percorso Chrome MCP locale all’host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debugging remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l’impostazione lato Chrome al posto tuo. Chrome MCP locale all’host richiede ancora:

    - un browser basato su Chromium 144+ sull’host gateway/node
    - il browser in esecuzione localmente
    - il debugging remoto abilitato in quel browser
    - l’approvazione del primo prompt di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene i limiti di route Chrome MCP correnti; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l’endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se la verifica fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, la verifica viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, queste possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere la sovrascrittura di trasporto obsoleta e recuperare il comportamento integrato di instradamento/fallback. Proxy personalizzati e sovrascritture solo header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor controlla la presenza di riferimenti modello `openai-codex/*` legacy. L’instradamento dell’harness Codex nativo usa riferimenti modello canonici `openai/*`; i turni agente OpenAI passano attraverso l’harness del server app Codex invece del percorso OpenAI PI di OpenClaw.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell’agente predefinito e per agente, inclusi modelli primari, fallback, sovrascritture heartbeat/subagent/compaction, hook, sovrascritture modello di canale e stato persistito obsoleto delle route di sessione:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - L’intento Codex passa a voci `agentRuntime.id: "codex"` con ambito provider/modello per i riferimenti modello agente riparati, così i profili auth `openai-codex:...` possono ancora essere selezionati dopo che il riferimento modello diventa `openai/*`.
    - La configurazione runtime obsoleta dell’intero agente e i pin runtime persistiti di sessione vengono rimossi perché la selezione runtime ha ambito provider/modello.
    - La policy runtime provider/modello esistente viene preservata, a meno che il riferimento modello legacy riparato richieda l’instradamento Codex per mantenere il vecchio percorso auth.
    - Gli elenchi di fallback modello esistenti vengono preservati con le relative voci legacy riscritte; le impostazioni per modello copiate passano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback e pin dei profili auth persistiti di sessione vengono riparati in tutti gli store sessione agente scoperti.
    - `/codex ...` significa "controlla o associa una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l’adattatore ACP/acpx esterno."

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor analizza anche gli store sessione agente scoperti alla ricerca di stato di route obsoleto creato automaticamente dopo che sposti modelli configurati o runtime lontano da una route posseduta da un Plugin, come Codex.

    `openclaw doctor --fix` può eliminare stato obsoleto creato automaticamente, come pin modello `modelOverrideSource: "auto"`, metadati runtime del modello, ID harness fissati, associazioni di sessione CLI e sovrascritture automatiche dei profili auth quando la route proprietaria non è più configurata. Le scelte modello di sessione esplicite dell’utente o legacy vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new`, oppure reimposta la sessione quando quella route non è più prevista.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor può migrare layout su disco più vecchi nella struttura corrente:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia indietro cartelle legacy come backup. Anche il Gateway/CLI migra automaticamente all’avvio le sessioni legacy + la directory agente, così cronologia/auth/modelli finiscono nel percorso per agente senza un’esecuzione manuale di doctor. L’auth WhatsApp viene migrato intenzionalmente solo tramite `openclaw doctor`. La normalizzazione provider/mappa provider di Talk ora confronta per uguaglianza strutturale, quindi le differenze dovute solo all’ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor analizza tutti i manifest Plugin installati alla ricerca di chiavi di capability deprecate di livello superiore (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell’oggetto `contracts` e di riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor controlla anche lo store dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, oppure `cron.store` quando sovrascritto) per vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie cron correnti includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi del payload di livello superiore (`message`, `model`, `thinking`, ...) → `payload`
    - campi di recapito di livello superiore (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di recapito `provider` del payload → `delivery.channel` esplicito
    - semplici job legacy di fallback Webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza modificare il comportamento. Se un job combina il fallback di notifica legacy con una modalità di recapito non Webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

    Su Linux, doctor avvisa anche quando la crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Quello script locale dell'host non è mantenuto dall'OpenClaw corrente e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando cron non riesce a raggiungere il bus utente di systemd. Rimuovi la voce crontab obsoleta con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di stato correnti.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor analizza ogni directory di sessione dell'agente alla ricerca di file di write-lock obsoleti — file rimasti quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è considerato obsoleto (PID morto, più vecchio di 30 minuti o un PID attivo che può essere provato appartenere a un processo non OpenClaw). In modalità `--fix` / `--repair` rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e ti indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione dei branch del transcript di sessione">
    Doctor analizza i file JSONL delle sessioni agente alla ricerca della forma di branch duplicata creata dal bug di riscrittura del transcript del prompt del 2026.4.24: un turno utente abbandonato con contesto di runtime interno di OpenClaw più un sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive il transcript sul branch attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, routing e sicurezza)">
    La directory di stato è il centro operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica di stato, chiede di ricreare la directory e ricorda che non può recuperare dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato macOS sincronizzata nel cloud**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory delle sessioni mancanti**: `sessions/` e la directory dell'archivio sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza del transcript**: avvisa quando voci di sessione recenti hanno file transcript mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando il transcript principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` tra directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato risiede lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione dei modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token di Anthropic. Le richieste di aggiornamento compaiono solo quando l'esecuzione è interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti chiede di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al catalogo e all'allowlist e avvisa quando non verrà risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di crearle o passare a nomi legacy se l'immagine corrente manca.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre root di dipendenze generate obsolete, vecchie directory install-stage, residui locali al pacchetto da codice precedente di riparazione delle dipendenze dei plugin inclusi e copie npm gestite orfane o recuperate dei plugin `@openclaw/*` inclusi che possono oscurare il manifest incluso corrente.

    Doctor può anche reinstallare plugin scaricabili mancanti quando la configurazione li riferisce ma il registro Plugin locale non riesce a trovarli. Gli esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime agente configurati. Durante gli aggiornamenti del pacchetto, doctor evita di eseguire la riparazione dei plugin tramite package manager mentre il pacchetto core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un plugin configurato necessita ancora di recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei plugin restano lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni dei servizi Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway corrente. Può anche cercare servizi aggiuntivi simili a Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra".

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato oppure imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione di avvio Matrix">
    Quando un account di canale Matrix ha una migrazione di stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Accoppiamento dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di accoppiamento dei dispositivi come parte del normale passaggio di salute.

    Cosa segnala:

    - richieste di primo accoppiamento in sospeso
    - upgrade di ruolo in sospeso per dispositivi già accoppiati
    - upgrade di scope in sospeso per dispositivi già accoppiati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record accoppiati privi di un token attivo per un ruolo approvato
    - token accoppiati i cui scope derivano fuori dalla baseline di accoppiamento approvata
    - voci cache locali del token dispositivo per la macchina corrente precedenti a una rotazione del token lato Gateway o con metadati scope obsoleti

    Doctor non approva automaticamente le richieste di accoppiamento né ruota automaticamente i token dei dispositivi. Stampa invece i prossimi passaggi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token fresco con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune problema "già accoppiato ma ricevo ancora richiesta di accoppiamento": doctor ora distingue il primo accoppiamento dagli upgrade di ruolo/scope in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se in esecuzione come servizio utente systemd, doctor assicura che il linger sia abilitato così il Gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato Skills**: conta le skill idonee, con requisiti mancanti e bloccate dall'allowlist.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono accanto al workspace corrente.
    - **Stato Plugin**: conta plugin abilitati/disabilitati/con errori; elenca gli ID dei plugin per eventuali errori; segnala le capacità dei plugin inclusi.
    - **Avvisi di compatibilità Plugin**: segnala i plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala i conteggi di caratteri grezzi rispetto a quelli iniettati per file, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri totali iniettati come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un plugin di canale mancante, rimuove anche la configurazione dangling con scope di canale che faceva riferimento a quel plugin: voci `channels.<id>`, target Heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo impedisce cicli di avvio del Gateway in cui il runtime del canale è sparito ma la configurazione chiede ancora al Gateway di collegarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento tramite tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo in modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare la cache manualmente.

  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Doctor verifica la preparazione dell'autenticazione tramite token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna origine del token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non è disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef del token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento di errore rapido del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
    - Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali del bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di arrestarsi in modo anomalo o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e offre di riavviare il gateway quando sembra non essere integro.
  </Accordion>
  <Accordion title="13b. Preparazione della ricerca in memoria">
    Doctor verifica se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio di autenticazione. Stampa suggerimenti di correzione attuabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, quindi prova ciascun provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato della verifica del gateway in cache (il gateway era integro al momento del controllo), doctor confronta il suo risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato memoria profondo quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la preparazione degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi di stato dei canali">
    Se il gateway è integro, doctor esegue una verifica dello stato dei canali e segnala gli avvisi con le correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione del supervisor">
    Doctor controlla la configurazione del supervisor installato (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (ad esempio dipendenze systemd network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisor.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisor e pulizia dei servizi legacy perché quel ciclo di vita è gestito da un supervisor esterno.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità gateway systemd corrispondente è attiva. Inoltre ignora le unità gateway-like extra inattive e non legacy durante la scansione dei servizi duplicati, così i file di servizio complementari non creano rumore di pulizia.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio di doctor convalida il SecretRef ma non persiste i valori del token risolti in chiaro nei metadati dell'ambiente del servizio supervisor.
    - Doctor rileva i valori di ambiente del servizio gestiti tramite `.env`/SecretRef che installazioni precedenti di LaunchAgent, systemd o Windows Scheduled Task incorporavano inline e riscrive i metadati del servizio affinché quei valori vengano caricati dall'origine runtime invece che dalla definizione del supervisor.
    - Doctor rileva quando il comando del servizio vincola ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio alla porta corrente.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di deriva del token di doctor ora includono sia le origini `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio di doctor rifiutano di riscrivere, arrestare o riavviare un servizio gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica del runtime del Gateway + porta">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche collisioni di porta sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice per il runtime del Gateway">
    Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono interrompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della shell. Doctor offre di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati usano un PATH di sistema canonico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, così i binari di sistema gestiti da Homebrew rimangono disponibili mentre Volta, asdf, fnm, pnpm e altre directory dei version manager non cambiano quale Node viene risolto dai processi figli. I servizi Linux mantengono comunque radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory fallback dei version manager ipotizzate vengono scritte nel PATH del servizio solo quando tali directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e marca i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per l'area di lavoro (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria dell'area di lavoro quando manca e stampa un suggerimento di backup se l'area di lavoro non è già sotto git.

    Vedi [/concetti/area-di-lavoro-agente](/it/concepts/agent-workspace) per una guida completa alla struttura dell'area di lavoro e al backup git (consigliato GitHub o GitLab privato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
