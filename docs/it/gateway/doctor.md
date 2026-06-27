---
read_when:
    - Aggiungere o modificare migrazioni doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-06-27T17:31:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stato obsoleti, controlla l'integrità e fornisce passaggi di riparazione attuabili.

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
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii quando sicuro).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Esegui controlli di integrità strutturati per CI o automazione di preflight. Questa modalità è
    di sola lettura: non chiede conferme, non ripara, non migra la configurazione, non riavvia servizi e non
    modifica lo stato.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Applica anche riparazioni aggressive (sovrascrive le configurazioni supervisor personalizzate).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Esegui senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta le azioni di riavvio/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Scansiona i servizi di sistema per installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Modalità lint di sola lettura

`openclaw doctor --lint` è l'equivalente orientato all'automazione di
`openclaw doctor --fix`. Entrambi usano i controlli di integrità di doctor, ma il loro approccio è
diverso:

| Modalità                 | Prompt    | Scrive configurazione/stato | Output                         | Usalo per                         |
| ------------------------ | --------- | --------------------------- | ------------------------------ | --------------------------------- |
| `openclaw doctor`        | sì        | no                          | report di integrità amichevole | una persona che controlla lo stato |
| `openclaw doctor --fix`  | a volte   | sì, con policy di riparazione | log di riparazione amichevole | applicare riparazioni approvate    |
| `openclaw doctor --lint` | no        | no                          | risultati strutturati          | CI, preflight e gate di revisione  |

I controlli di integrità modernizzati possono fornire un'implementazione `repair()` opzionale.
`doctor --fix` applica tali riparazioni quando esistono e continua a usare il
flusso di riparazione doctor esistente per i controlli che non sono ancora migrati.
Il contratto di riparazione strutturato separa inoltre la segnalazione delle riparazioni dal rilevamento:
`detect()` segnala i risultati correnti, mentre `repair()` può segnalare modifiche,
diff di configurazione/file ed effetti collaterali non su file. Questo mantiene aperto il percorso di migrazione
per futuri output `doctor --fix --dry-run` e diff senza fare in modo che i controlli lint
pianifichino mutazioni.

Esempi:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

L'output JSON include:

- `ok`: se un risultato visibile ha raggiunto la soglia di gravità selezionata
- `checksRun`: numero di controlli di integrità eseguiti
- `checksSkipped`: controlli saltati dal profilo selezionato, `--only` o `--skip`
- `findings`: diagnostica strutturata con `checkId`, `severity`, `message` e
  `path`, `line`, `column`, `ocPath` e `fixHint` opzionali

Codici di uscita:

- `0`: nessun risultato pari o superiore alla soglia selezionata
- `1`: uno o più risultati hanno raggiunto la soglia selezionata
- `2`: errore di comando/runtime prima che i risultati lint potessero essere emessi

Usa `--severity-min info|warning|error` per controllare sia cosa viene stampato sia cosa
causa un'uscita lint diversa da zero. Usa `--all` per eseguire l'inventario lint completo,
inclusi controlli più approfonditi opt-in esclusi dal set di automazione predefinito. Usa `--only <id>` per gate di preflight mirati e
`--skip <id>` per escludere temporaneamente un controllo rumoroso mantenendo attivo il resto
dell'esecuzione lint.
Le opzioni di output lint come `--json`, `--severity-min`, `--all`, `--only` e
`--skip` devono essere abbinate a `--lint`; le normali esecuzioni doctor e di riparazione le rifiutano.

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, UI e aggiornamenti">
    - Aggiornamento preflight opzionale per installazioni git (solo interattivo).
    - Controllo di freschezza del protocollo UI (ricompila la UI di controllo quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo dello stato Skills (idonee/mancanti/bloccate) e stato dei Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi flat legacy `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e prontezza Chrome MCP.
    - Avvisi di override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migrazione provider/profilo legacy OpenAI Codex (`openai-codex` → `openai`) e avvisi di shadowing per `models.providers.openai-codex` obsoleti.
    - Controllo dei prerequisiti OAuth TLS per i profili OAuth OpenAI Codex.
    - Avvisi sull'allowlist Plugin/tool quando `plugins.allow` è restrittivo ma la policy dei tool richiede ancora wildcard o tool di proprietà del Plugin.
    - Migrazione dello stato legacy su disco (sessions/agent dir/auth WhatsApp).
    - Migrazione delle chiavi legacy del contratto manifest Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, `provider` del payload, job di fallback webhook `notify: true`).
    - Pulizia legacy della runtime-policy dell'intero agente; la runtime policy provider/model è il selettore di route attivo.
    - Pulizia della configurazione Plugin obsoleta quando i Plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti Plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono preservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami di prompt-rewrite duplicati creati dalle build 2026.4.24 interessate.
    - Rilevamento di tombstone di restart-recovery per subagent bloccati, con supporto `--fix` per cancellare flag di recovery abortiti obsoleti in modo che l'avvio non continui a trattare il figlio come restart-aborted.
    - Controlli di integrità e permessi dello stato (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) quando eseguito localmente.
    - Integrità auth del modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati del profilo auth.

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd memorizzata nella cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - I controlli dei permessi specifici del canale si trovano in `openclaw channels capabilities`; per esempio, i permessi dei canali vocali Discord vengono verificati con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Controlli di reattività WhatsApp per integrità degradata dell'event loop del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo i client TUI locali verificati.
    - Riparazione delle route Codex per riferimenti modello legacy `openai-codex/*` nei modelli primari, fallback, modelli di generazione immagini/video, override heartbeat/subagent/compaction, hook, override dei modelli di canale e pin delle route di sessione; `--fix` li riscrive in `openai/*`, migra profili/ordine auth `openai-codex:*` a `openai:*`, rimuove pin runtime obsoleti di sessione/intero agente e lascia i riferimenti agente OpenAI canonici sull'harness Codex predefinito.
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione opzionale.
    - Pulizia dell'ambiente proxy incorporato per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime Gateway (Node vs Bun, percorsi dei version-manager).
    - Diagnostica delle collisioni della porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni SecretRef del token).
    - Rilevamento di problemi di pairing del dispositivo (richieste di primo pairing in sospeso, upgrade di ruolo/ambito in sospeso, drift della cache locale device-token obsoleta e drift auth dei record associati).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo delle dimensioni del file di bootstrap del workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo di prontezza Skills per l'agente predefinito; segnala skill consentite con binari, env, configurazione o requisiti OS mancanti, e `--fix` può disabilitare skill non disponibili in `skills.entries`.
    - Controllo dello stato del completamento shell e installazione/aggiornamento automatici.
    - Controllo di prontezza del provider di embedding per ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli di installazione da sorgente (mismatch del workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset della UI Dreams

La scena Dreams della UI di controllo include azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow di dreaming grounded. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** scansiona i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il pass del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci di diario di backfill marcate da `DREAMS.md`.
- **Clear Grounded** rimuove solo le voci a breve termine staged esclusivamente grounded che provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non inseriscono automaticamente candidati grounded nello store live di promozione a breve termine a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale corsia di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durevoli grounded nello store di dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e logica

<AccordionGroup>
  <Accordion title="0. Aggiornamento opzionale (installazioni git)">
    Se si tratta di un checkout git e doctor viene eseguito in modo interattivo, propone l'aggiornamento (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico per canale), doctor le normalizza nello schema corrente.

    Questo include i campi flat legacy di Talk. La configurazione speech pubblica corrente di Talk è `talk.provider` + `talk.providers.<provider>`, e la configurazione voice realtime è `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider, e riscrive i selettori realtime legacy di primo livello (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa anche quando `plugins.allow` non è vuoto e la policy degli strumenti usa
    voci wildcard o strumenti di proprietà dei plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti
    dei plugin che vengono effettivamente caricati; non aggira l'allowlist esclusiva dei plugin.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di eseguire e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiega quali chiavi legacy sono state trovate.
    - Mostra la migrazione applicata.
    - Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

    L'avvio del Gateway rifiuta i formati di configurazione legacy e chiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dell'archivio dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - rimuovi `channels.webchat` e `gateway.webchat` ritirati
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - selettori Talk realtime legacy di primo livello (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
    - campi di selezione dello speaker TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Per i canali con `accounts` nominati ma con valori di canale di primo livello per account singolo ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare una destinazione nominata/predefinita esistente corrispondente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout lenti di provider/modello e mantieni il timeout dell'agente/esecuzione sopra quel valore quando l'intera esecuzione deve durare più a lungo
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell'estensione)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (l'avvio del Gateway salta anche i provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modo chiuso)
    - rimuovi `plugins.entries.codex.config.codexDynamicToolsProfile`; l'app-server Codex mantiene sempre nativi gli strumenti workspace nativi di Codex

    Gli avvisi di Doctor includono anche indicazioni sull'account predefinito per i canali multi-account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sovrascrive il catalogo OpenCode integrato da `openclaw/plugin-sdk/llm`. Ciò può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare routing API + costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione per Chrome MCP">
    Se la configurazione del browser punta ancora al percorso dell'estensione Chrome rimossa, doctor la normalizza al modello di attach Chrome MCP host-local corrente:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor controlla anche il percorso Chrome MCP host-local quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - verifica se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - verifica la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome al posto tuo. Chrome MCP host-local richiede comunque:

    - un browser basato su Chromium 144+ sull'host gateway/node
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione della prima richiesta di consenso all'attach nel browser

    La preparazione qui riguarda solo i prerequisiti di attach locale. Existing-session mantiene gli attuali limiti di route di Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP raw.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor sonda l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS Node/OpenSSL locale possa convalidare la catena di certificati. Se la sonda fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la sonda viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Override del provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a OAuth Codex, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di routing/fallback. Proxy personalizzati e override solo-header sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Riparazione delle route Codex">
    Doctor controlla i riferimenti modello legacy `openai-codex/*`. Il routing nativo dell'harness Codex usa riferimenti modello canonici `openai/*`; i turni dell'agente OpenAI passano attraverso l'harness app-server Codex invece del percorso provider OpenAI di OpenClaw.

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell'agente predefinito e dei singoli agenti, inclusi modelli primari, fallback, modelli di generazione immagini/video, override heartbeat/subagent/compaction, hook, override dei modelli di canale e stato di route sessione persistito obsoleto:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - L'intento Codex passa a voci `agentRuntime.id: "codex"` con ambito provider/modello per i riferimenti modello agente riparati.
    - La configurazione runtime obsoleta dell'intero agente e i pin runtime della sessione persistita vengono rimossi perché la selezione runtime ha ambito provider/modello.
    - La policy runtime provider/modello esistente viene preservata a meno che il riferimento modello legacy riparato non richieda routing Codex per mantenere il vecchio percorso di autenticazione.
    - Gli elenchi di fallback modello esistenti vengono preservati con le voci legacy riscritte; le impostazioni per modello copiate passano dalla chiave legacy alla chiave canonica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avvisi di fallback e pin del profilo di autenticazione delle sessioni persistite vengono riparati in tutti gli store di sessione agente scoperti.
    - `/codex ...` significa "controllare o associare una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usare l'adapter ACP/acpx esterno."

  </Accordion>
  <Accordion title="2g. Pulizia delle route di sessione">
    Doctor scansiona anche gli store di sessione agente scoperti alla ricerca di stato di route auto-creato obsoleto dopo che sposti i modelli configurati o il runtime lontano da una route di proprietà di un plugin come Codex.

    `openclaw doctor --fix` può cancellare stato obsoleto auto-creato come pin modello `modelOverrideSource: "auto"`, metadati runtime modello, ID harness fissati, associazioni sessione CLI e override automatici del profilo di autenticazione quando la loro route proprietaria non è più configurata. Le scelte esplicite dell'utente o legacy del modello di sessione vengono segnalate per revisione manuale e lasciate intatte; cambiale con `/model ...`, `/new` oppure reimposta la sessione quando quella route non è più prevista.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare layout su disco più vecchi nella struttura corrente:

    - Store sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da legacy `~/.openclaw/credentials/*.json` (tranne `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche Gateway/CLI migra automaticamente all'avvio le sessioni legacy + la directory agente, così cronologia/auth/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/mappa-provider di Talk ora confronta per uguaglianza strutturale, quindi le differenze solo nell'ordine delle chiavi non attivano più modifiche no-op ripetute di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor analizza tutti i manifest dei Plugin installati alla ricerca di chiavi di capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e di riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio Cron legacy">
    Doctor controlla anche l'archivio dei job Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, oppure `cron.store` quando viene sovrascritto) alla ricerca di vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie Cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna `provider` del payload → `delivery.channel` esplicito
    - job legacy di fallback Webhook con `notify: true` → consegna Webhook esplicita da `cron.webhook` quando impostato; i job di annuncio mantengono la consegna chat e ricevono `delivery.completionDestination`. Quando `cron.webhook` non è impostato, il marker inerte di primo livello `notify` viene rimosso per i job senza destinazione (la consegna esistente, incluso l'annuncio, viene preservata), poiché la consegna runtime non lo legge mai

    Il Gateway sanifica anche le righe Cron malformate al momento del caricamento, così i job validi continuano a essere eseguiti. Le righe grezze malformate vengono copiate in `jobs-quarantine.json` accanto all'archivio attivo prima di essere rimosse da `jobs.json`; doctor segnala le righe in quarantena così puoi esaminarle o ripararle manualmente.

    L'avvio del Gateway normalizza la proiezione runtime e ignora il marker di primo livello `notify`, ma lascia la configurazione Cron persistita per la riparazione da parte di doctor. Quando `cron.webhook` non è impostato, doctor rimuove il marker inerte per i job senza destinazione di migrazione (`delivery.mode` assente/none, una destinazione Webhook inutilizzabile o una consegna annuncio/chat esistente), lasciando intatta la consegna esistente, così le esecuzioni ripetute di `doctor --fix` non avvisano più sullo stesso job. Se `cron.webhook` è impostato ma non è un URL HTTP(S) valido, doctor continua ad avvisare e lascia il marker così puoi correggere l'URL.

    Su Linux, doctor avvisa anche quando il crontab dell'utente invoca ancora il legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Questo script locale dell'host non è mantenuto dall'OpenClaw attuale e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando Cron non riesce a raggiungere il bus utente systemd. Rimuovi la voce obsoleta del crontab con `crontab -e`; usa `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per i controlli di integrità attuali.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor analizza ogni directory di sessione degli agenti alla ricerca di file write-lock obsoleti — file lasciati quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala: il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è considerato obsoleto (PID morto, metadati del proprietario malformati, più vecchio di 30 minuti o un PID attivo che può essere provato appartenere a un processo non OpenClaw). In modalità `--fix` / `--repair` rimuove automaticamente i lock con proprietari morti, orfani, riciclati, malformati-vecchi o non OpenClaw. I vecchi lock ancora di proprietà di un processo OpenClaw attivo vengono segnalati ma lasciati al loro posto, così doctor non interrompe uno scrittore di transcript attivo.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami dei transcript di sessione">
    Doctor analizza i file JSONL delle sessioni degli agenti alla ricerca della forma di ramo duplicata creata dal bug di riscrittura dei transcript dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno OpenClaw più un sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor esegue il backup di ogni file interessato accanto all'originale e riscrive il transcript sul ramo attivo, così la cronologia del Gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, routing e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa di una perdita di stato catastrofica, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza proprietario/gruppo).
    - **Directory di stato macOS sincronizzata con cloud**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, perché i percorsi basati su sincronizzazione possono causare I/O più lento e race di lock/sincronizzazione.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`, perché l'I/O casuale basato su SD o eMMC può essere più lento e usurarsi più rapidamente durante le scritture di sessioni e credenziali.
    - **Directory di stato volatile Linux**: avvisa quando lo stato si risolve in `tmpfs` o `ramfs`, perché sessioni, credenziali, configurazione e stato SQLite con i relativi sidecar WAL/journal scompariranno al riavvio. I mount Docker `overlay` non vengono intenzionalmente segnalati perché i loro layer scrivibili persistono attraverso i riavvii dell'host finché il container rimane.
    - **Directory di sessione mancanti**: `sessions/` e la directory dell'archivio sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza del transcript**: avvisa quando le voci di sessione recenti hanno file transcript mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando il transcript principale ha una sola riga (la cronologia non si sta accumulando).
    - **Directory di stato multiple**: avvisa quando esistono più cartelle `~/.openclaw` tra directory home diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato si trova lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Integrità autenticazione modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token Anthropic. Le richieste di refresh compaiono solo quando viene eseguito in modo interattivo (TTY); `--non-interactive` salta i tentativi di refresh.

    Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti dice di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

    I profili OAuth Codex legacy i cui token risiedono nel Portachiavi macOS (onboarding più vecchio prima del layout sidecar basato su file) vengono riparati solo da doctor. Esegui `openclaw doctor --fix` una volta da un terminale interattivo per migrare i token legacy basati su Portachiavi inline in `auth-profiles.json`; dopo, i turni incorporati (Telegram, Cron, dispatch di sub-agent) li risolvono come profili OAuth OpenAI canonici.

  </Accordion>
  <Accordion title="6. Validazione del modello hooks">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento del modello rispetto al catalogo e alla allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare a nomi legacy se l'immagine attuale manca.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di staging delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. Questo copre root di dipendenze generate obsolete, vecchie directory install-stage, residui locali del package dal precedente codice di riparazione delle dipendenze dei Plugin in bundle, e copie npm gestite orfane o recuperate di Plugin `@openclaw/*` in bundle che possono oscurare il manifest in bundle attuale. Doctor ricollega anche il package host `openclaw` nei Plugin npm gestiti che dichiarano `peerDependencies.openclaw`, così gli import runtime locali del package come `openclaw/plugin-sdk/*` continuano a risolversi dopo aggiornamenti o riparazioni npm.

    Doctor può anche reinstallare Plugin scaricabili mancanti quando la configurazione li referenzia ma il registro Plugin locale non riesce a trovarli. Esempi includono `plugins.entries` materiali, impostazioni configurate di canale/provider/ricerca e runtime agente configurati. Durante gli aggiornamenti del package, doctor evita di eseguire la riparazione dei Plugin tramite package manager mentre il package core viene sostituito; esegui di nuovo `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato necessita ancora di recupero. L'avvio del Gateway e il ricaricamento della configurazione non eseguono package manager; le installazioni dei Plugin restano lavoro esplicito di doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrazioni dei servizi Gateway e suggerimenti di pulizia">
    Doctor rileva servizi Gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway attuale. Può anche cercare servizi aggiuntivi simili a Gateway e stampare suggerimenti di pulizia. I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono segnalati come "extra."

    Su Linux, se il servizio Gateway a livello utente manca ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del Gateway.

  </Accordion>
  <Accordion title="8b. Migrazione Matrix all'avvio">
    Quando un account di canale Matrix ha una migrazione di stato legacy in sospeso o azionabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Associazione dispositivo e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mancata corrispondenza della chiave pubblica in cui l'id dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti derivano fuori dalla baseline di associazione approvata
    - voci di token dispositivo memorizzate nella cache locale per la macchina attuale che precedono una rotazione token lato Gateway o contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude la falla comune "già associato ma ricevo ancora pairing richiesto": doctor ora distingue il primo pairing dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza una allowlist, o quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se eseguito come servizio utente systemd, doctor assicura che il lingering sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, plugin e TaskFlow)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato Skills**: conta le skill idonee, con requisiti mancanti e bloccate dalla allowlist.
    - **Stato Plugin**: conta i plugin abilitati/disabilitati/in errore; elenca gli ID dei plugin per eventuali errori; segnala le capability dei plugin del bundle.
    - **Avvisi di compatibilità dei plugin**: segnala i plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registry dei plugin.
    - **Ripristino TaskFlow**: espone TaskFlow gestiti sospetti che richiedono ispezione manuale o annullamento.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Riporta per ogni file i conteggi dei caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un plugin di canale mancante, rimuove anche la configurazione pendente con ambito canale che faceva riferimento a quel plugin: voci `channels.<id>`, destinazioni heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo evita cicli di avvio del Gateway in cui il runtime del canale non c'è più ma la configurazione chiede ancora al gateway di associarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli auth Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione con token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna origine token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni di configurazione mirate.
    - Esempio: la riparazione di `allowFrom` / `groupAllowFrom` `@username` di Telegram prova a usare le credenziali bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta l'auto-risoluzione invece di andare in crash o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo salute Gateway + riavvio">
    Doctor esegue un controllo di salute e offre di riavviare il gateway quando sembra non essere sano.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione di percorso binario manuale.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nello store auth. Stampa suggerimenti di correzione azionabili se manca.
    - **Provider auto legacy**: tratta `memorySearch.provider: "auto"` come OpenAI, controlla la prontezza OpenAI e `doctor --fix` lo riscrive in `provider: "openai"`.

    Quando è disponibile un risultato di probe del gateway in cache (il gateway era sano al momento del controllo), doctor incrocia il suo risultato con la configurazione visibile dalla CLI e nota eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato memoria profondo quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato dei canali">
    Se il gateway è sano, doctor esegue un probe dello stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione supervisor">
    Doctor controlla la configurazione supervisor installata (launchd/systemd/schtasks) per default mancanti o obsoleti (ad esempio dipendenze systemd network-online e ritardo di riavvio). Quando trova una discrepanza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai default correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione supervisor.
    - `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
    - `openclaw doctor --fix` applica le correzioni consigliate senza prompt (`--repair` è un alias).
    - `openclaw doctor --fix --force` sovrascrive le configurazioni supervisor personalizzate.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Segnala comunque la salute del servizio ed esegue riparazioni non di servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione supervisor e pulizia dei servizi legacy perché un supervisor esterno possiede quel ciclo di vita.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità systemd gateway corrispondente è attiva. Ignora anche unità extra inattive non legacy simili a gateway durante la scansione dei servizi duplicati, così i file di servizio companion non creano rumore di pulizia.
    - Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor valida il SecretRef ma non persiste valori token in testo in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
    - Doctor rileva valori di ambiente del servizio gestiti e supportati da `.env`/SecretRef che installazioni LaunchAgent, systemd o Windows Scheduled Task più vecchie avevano incorporato inline, e riscrive i metadati del servizio così quei valori vengono caricati dall'origine runtime invece che dalla definizione supervisor.
    - Doctor rileva quando il comando del servizio fissa ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio alla porta corrente.
    - Se l'autenticazione token richiede un token e il SecretRef token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni azionabili.
    - Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità user-systemd Linux, i controlli di deriva token di doctor ora includono sia le origini `Environment=` sia `EnvironmentFile=` quando confrontano i metadati auth del servizio.
    - Le riparazioni del servizio doctor rifiutano di riscrivere, fermare o riavviare un servizio gateway da un binario OpenClaw più vecchio quando la configurazione è stata scritta l'ultima volta da una versione più nuova. Vedi [Risoluzione problemi Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica runtime Gateway + porta">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche collisioni di porta sulla porta del gateway (default `18789`) e segnala cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice runtime Gateway">
    Doctor avvisa quando il servizio gateway gira su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei version manager possono rompersi dopo gli upgrade perché il servizio non carica l'inizializzazione della shell. Doctor offre di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I macOS LaunchAgent appena installati o riparati usano un PATH di sistema canonico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) invece di copiare il PATH della shell interattiva, così i binari di sistema gestiti da Homebrew restano disponibili mentre Volta, asdf, fnm, pnpm e altre directory dei version manager non cambiano quale Node viene risolto dai processi figli. I servizi Linux mantengono ancora root di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory fallback dei version manager indovinate vengono scritte nel PATH del servizio solo quando tali directory esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura configurazione + metadati wizard">
    Doctor persiste eventuali modifiche di configurazione e marca i metadati wizard per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook Gateway](/it/gateway)
- [Risoluzione problemi Gateway](/it/gateway/troubleshooting)
