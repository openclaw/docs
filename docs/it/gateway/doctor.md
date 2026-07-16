---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e procedure di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-07-16T14:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione e migrazione per OpenClaw. Corregge configurazioni e stati obsoleti, verifica l'integrità e fornisce passaggi di riparazione attuabili.

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

    Accetta i valori predefiniti senza richieste di conferma (inclusi i passaggi di riavvio e riparazione di servizi e sandbox, quando applicabili).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Applica le riparazioni consigliate senza richieste di conferma (`--repair` è un alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Esegue controlli di integrità strutturati per la CI o l'automazione preliminare. In sola lettura: nessuna
    richiesta di conferma, riparazione, migrazione, riavvio o scrittura dello stato.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Applica anche le riparazioni aggressive (sovrascrive le configurazioni personalizzate del supervisore).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Esegue senza richieste di conferma, applicando solo le migrazioni sicure (normalizzazione della configurazione +
    spostamenti dello stato su disco). Ignora le azioni di riavvio, servizio e sandbox che richiedono la
    conferma umana. Le migrazioni dello stato legacy vengono comunque eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Analizza i servizi di sistema alla ricerca di installazioni aggiuntive del Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Per esaminare le modifiche prima della scrittura, aprire prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Modalità lint in sola lettura

`openclaw doctor --lint` è la modalità complementare, adatta all'automazione, di
`openclaw doctor --fix`. Condividono lo stesso registro delle regole di Doctor, ma
non selezionano né applicano le regole allo stesso modo:

| Modalità                 | Richieste di conferma | Scrive configurazione/stato | Output                           | Utilizzo                              |
| ------------------------ | --------------------- | --------------------------- | -------------------------------- | ------------------------------------- |
| `openclaw doctor`        | sì                    | no                          | rapporto di integrità intuitivo  | verifica dello stato da parte di una persona |
| `openclaw doctor --fix`  | a volte               | sì, con criteri di riparazione | registro di riparazione intuitivo | applicazione delle riparazioni approvate |
| `openclaw doctor --lint` | no                    | no                          | risultati strutturati            | CI, controlli preliminari e di revisione |

L'esecuzione predefinita di `doctor --lint` usa il profilo di automazione ampio e sicuro: controlli
statici, locali e utili nell'output di CI o dei controlli preliminari. Ignora i controlli facoltativi che
sono consultivi, sensibili all'ambiente, dipendenti da servizi attivi, relativi all'inventario di account o aree di lavoro
oppure alla pulizia storica. Usare `doctor --lint --all` per eseguire
l'intero audit lint registrato, inclusi tali controlli facoltativi, oppure `--only <id>` per
un controllo mirato.

`doctor --fix` non usa il profilo lint predefinito e non accetta
`--all`. Esegue il percorso di riparazione ordinato di Doctor: i moderni controlli di integrità possono fornire
un'implementazione facoltativa di `repair()`, mentre le aree più vecchie usano ancora il relativo
flusso di riparazione legacy di Doctor. Alcuni risultati lint sono intenzionalmente solo diagnostici, quindi la
presenza di un controllo in `--lint --all` non implica che `--fix` modificherà quell'area.
Il contratto separa `detect()` (segnala i risultati) da `repair()` (segnala
modifiche/differenze/effetti collaterali), mantenendo aperta la possibilità di un futuro
`doctor --fix --dry-run` senza trasformare i controlli lint in pianificatori di modifiche.

Alcuni controlli integrati sono disabilitati per impostazione predefinita internamente, affinché rimangano disponibili per
`--all`, `--only` e i flussi di riparazione di Doctor senza entrare a far parte del profilo di automazione
predefinito di `doctor --lint`. La gravità viene comunque indicata per ogni
risultato (`info`, `warning` o `error`); la selezione predefinita non è un livello di
gravità.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Campi dell'output JSON:

- `ok`: indica se un risultato ha raggiunto la soglia di gravità selezionata
- `checksRun` / `checksSkipped`: conteggi (ignorati dal profilo, da `--only` o da `--skip`)
- `findings`: diagnostica strutturata con `checkId`, `severity`, `message` e, facoltativamente, `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Codici di uscita:

| Codice | Significato                                                    |
| ------ | -------------------------------------------------------------- |
| `0`  | nessun risultato pari o superiore alla soglia selezionata       |
| `1`  | uno o più risultati hanno raggiunto la soglia selezionata        |
| `2`  | errore del comando/runtime prima dell'emissione dei risultati    |

Flag:

- `--severity-min info|warning|error` (valore predefinito `warning`): controlla sia ciò che viene stampato sia ciò che determina un codice di uscita diverso da zero.
- `--all`: esegue tutti i controlli lint registrati, inclusi quelli facoltativi esclusi dall'insieme di automazione predefinito.
- `--only <id>` (ripetibile): esegue solo gli ID dei controlli specificati; un ID sconosciuto viene segnalato come risultato di errore.
- `--skip <id>` (ripetibile): esclude un controllo mantenendo attiva la parte restante dell'esecuzione.
- `--json`, `--severity-min`, `--all`, `--only` e `--skip` richiedono `--lint`; le esecuzioni semplici di `openclaw doctor` e `--fix` li rifiutano.

## Funzionalità (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, interfaccia utente e aggiornamenti">
    - Aggiornamento preliminare facoltativo per le installazioni git (solo in modalità interattiva).
    - Controllo dell'aggiornamento del protocollo dell'interfaccia utente (ricompila la Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + richiesta di riavvio.
    - Note relative solo a problemi di Skills e Plugin; l'inventario integro rimane in `openclaw skills check` e `openclaw plugins list`.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per i formati di valori legacy.
    - Migrazione della configurazione Talk dai campi legacy semplici `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per le configurazioni legacy dell'estensione Chrome e la disponibilità di Chrome MCP.
    - Avvisi sulle sostituzioni del provider OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migrazione del provider/profilo legacy OpenAI Codex (`openai-codex` → `openai`) e avvisi di occultamento per `models.providers.openai-codex` obsoleti.
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth di OpenAI Codex.
    - Avvisi sull'elenco di elementi consentiti per Plugin/strumenti quando `plugins.allow` è restrittivo, ma i criteri degli strumenti richiedono ancora caratteri jolly o strumenti appartenenti ai Plugin.
    - Migrazione dello stato legacy su disco (sessioni/directory dell'agente/autenticazione WhatsApp).
    - Migrazione delle chiavi legacy del contratto del manifesto dei Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dell'archivio Cron legacy (`jobId`, `schedule.cron`, campi di consegna/payload di primo livello, payload `provider`, processi Webhook di fallback `notify: true`).
    - Riparazione della versione bloccata del runtime della CLI Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) in `agents.defaults`, `agents.list[]` e `models.providers.*` (incluse le voci per modello).
    - Pulizia della configurazione obsoleta dei Plugin quando questi sono abilitati; con `plugins.enabled=false`, i riferimenti obsoleti ai Plugin vengono mantenuti come configurazione di contenimento inattiva.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di blocco delle sessioni e pulizia dei blocchi obsoleti.
    - Riparazione delle trascrizioni delle sessioni per i rami duplicati di riscrittura dei prompt creati dalle build 2026.4.24 interessate.
    - Rilevamento degli indicatori di recupero dal riavvio dei sottoagenti bloccati, con supporto di `--fix` per eliminare gli indicatori obsoleti di recupero interrotto, affinché l'avvio non continui a trattare il processo figlio come interrotto durante il riavvio.
    - Controlli di integrità dello stato e delle autorizzazioni (sessioni, trascrizioni, directory dello stato).
    - Controlli delle autorizzazioni del file di configurazione (chmod 600) durante l'esecuzione locale.
    - Integrità dell'autenticazione dei modelli: controlla la scadenza OAuth, può aggiornare i token in scadenza e segnala gli stati di sospensione temporanea/disabilitazione dei profili di autenticazione.

  </Accordion>
  <Accordion title="Gateway, servizi e supervisori">
    - Riparazione dell'immagine della sandbox quando l'isolamento è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli del runtime del Gateway (servizio installato ma non in esecuzione; etichetta launchd memorizzata nella cache).
    - Avvisi sullo stato dei canali (rilevati dal Gateway in esecuzione).
    - I controlli delle autorizzazioni specifici per canale si trovano in `openclaw channels capabilities`; ad esempio, le autorizzazioni dei canali vocali Discord vengono sottoposte ad audit con `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Controlli della reattività di WhatsApp in caso di integrità degradata del ciclo di eventi del Gateway con client TUI locali ancora in esecuzione; `--fix` arresta solo i client TUI locali verificati.
    - Riparazione delle route Codex per i riferimenti ai modelli legacy `openai-codex/*` nei modelli principali, nei fallback, nei modelli di generazione di immagini/video, nelle sostituzioni di Heartbeat/sottoagenti/Compaction, negli hook, nelle sostituzioni dei modelli dei canali e nelle route bloccate delle sessioni; `--fix` li riscrive in `openai/*`, migra i profili/l'ordine di autenticazione `openai-codex:*` a `openai:*`, rimuove le versioni bloccate obsolete del runtime per sessione/intero agente e lascia che la route effettiva riparata determini la compatibilità di Codex.
    - Audit della configurazione del supervisore (launchd/systemd/schtasks) con riparazione facoltativa.
    - Pulizia delle variabili d'ambiente proxy integrate per i servizi Gateway che hanno acquisito i valori della shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante l'installazione o l'aggiornamento.
    - Controlli del runtime del Gateway (servizi Bun legacy non supportati, percorsi dei gestori di versioni).
    - Diagnostica delle collisioni delle porte del Gateway (valore predefinito `18789`).

  </Accordion>
  <Accordion title="Autenticazione, sicurezza e associazione">
    - Avvisi di sicurezza per i criteri dei messaggi diretti aperti.
    - Controlli di autenticazione del Gateway per la modalità token locale (propone la generazione di un token quando non esiste alcuna origine del token; non sovrascrive le configurazioni SecretRef dei token).
    - Rilevamento dei problemi di associazione dei dispositivi (richieste in sospeso per la prima associazione, aggiornamenti in sospeso di ruolo/ambito, divergenza della cache locale obsoleta dei token dei dispositivi e divergenza dell'autenticazione dei record associati).

  </Accordion>
  <Accordion title="Area di lavoro e shell">
    - Controllo della persistenza systemd su Linux.
    - Controllo delle dimensioni dei file di bootstrap dell'area di lavoro (avvisi di troncamento/prossimità al limite per i file di contesto).
    - Controllo della disponibilità delle Skills per l'agente predefinito; segnala le Skills consentite prive dei requisiti relativi a file binari, ambiente, configurazione o sistema operativo, mentre `--fix` può disabilitare le Skills non disponibili in `skills.entries`.
    - Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
    - Controllo della disponibilità del provider di embedding per la ricerca nella memoria (modello locale, chiave API remota o file binario QMD).
    - Controlli dell'installazione dai sorgenti (incompatibilità dell'area di lavoro pnpm, risorse dell'interfaccia utente mancanti, file binario tsx mancante).
    - Scrive la configurazione aggiornata + i metadati della procedura guidata.

  </Accordion>
</AccordionGroup>

## Compilazione retroattiva e reimpostazione dell'interfaccia utente di Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded** per il flusso di lavoro Dreaming grounded. Queste usano metodi RPC in stile doctor del Gateway, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

| Azione         | Funzione                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | Analizza i file storici `memory/YYYY-MM-DD.md` nell'area di lavoro attiva, esegue il passaggio del diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`. |
| Reset          | Rimuove da `DREAMS.md` solo le voci del diario di backfill contrassegnate.                                                                                                  |
| Clear Grounded | Rimuove solo le voci a breve termine in staging esclusivamente grounded provenienti dalla riproduzione storica che non hanno ancora accumulato richiamo live o supporto giornaliero.                           |

Nessuna di queste azioni modifica `MEMORY.md`, esegue migrazioni doctor complete o inserisce autonomamente candidati grounded nell'archivio live per la promozione a breve termine. Per immettere la riproduzione storica grounded nella normale corsia di promozione profonda, usare invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce i candidati durevoli grounded nell'archivio Dreaming a breve termine, mentre `DREAMS.md` rimane la superficie di revisione.

## Comportamento dettagliato e motivazioni

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se si tratta di un checkout git e doctor è in esecuzione interattiva, viene proposto un aggiornamento (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Doctor normalizza le forme dei valori legacy nello schema corrente. La configurazione vocale Talk corrente è `talk.provider` + `talk.providers.<provider>`, con la configurazione vocale in tempo reale in `talk.realtime.*`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa dei provider e riscrive i selettori legacy di primo livello per il tempo reale (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) in `talk.realtime`.

    Doctor avvisa inoltre quando `plugins.allow` non è vuoto e la policy degli strumenti usa voci con caratteri jolly o appartenenti a Plugin. `tools.allow: ["*"]` corrisponde solo agli strumenti dei Plugin effettivamente caricati; non aggira l'allowlist esclusiva dei Plugin.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene una chiave deprecata con una migrazione attiva, gli altri comandi si rifiutano di essere eseguiti e richiedono di eseguire `openclaw doctor`. Doctor spiega quali chiavi legacy sono state trovate, mostra la migrazione applicata e riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato. L'avvio del Gateway rifiuta i formati di configurazione legacy e richiede di eseguire `openclaw doctor --fix`; non riscrive `openclaw.json` all'avvio. Anche le migrazioni dell'archivio dei processi Cron sono gestite da `openclaw doctor --fix`.

    <Note>
      Doctor conserva le migrazioni automatiche solo per circa due mesi dopo il
      ritiro di una chiave. Le chiavi legacy più vecchie (ad esempio le
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`
      originali, `routing.transcribeAudio`, `agent.*` di primo livello o
      `identity` di primo livello della precedente forma di configurazione
      multi-agente) non dispongono più di un percorso di migrazione; la configurazione
      che le utilizza ora non supera la convalida anziché essere riscritta. Correggere
      manualmente tali chiavi in base al riferimento della configurazione corrente
      prima che doctor possa procedere.
    </Note>

    Migrazioni attive:

    | Chiave legacy                                                                                    | Chiave corrente                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | rimosse (WebChat è stato ritirato)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (e per account)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy        | `talk.provider` + `talk.providers.<provider>`                               |
    | selettori Talk in tempo reale legacy di primo livello (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | campi dell'altoparlante TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (tutti i canali tranne Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (tutti i canali, incluso Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (l'avvio del Gateway ignora anche i provider il cui `api` è un valore enum futuro/sconosciuto anziché interrompersi in modalità fail-closed) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | rimossa (impostazione legacy del relay dell'estensione Chrome)                             |
    | `mcp.servers.*.type` (alias nativi della CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | rimossa (il server applicativo Codex mantiene sempre nativi gli strumenti dell'area di lavoro nativi di Codex) |
    | `commands.modelsWrite`                                                                           | rimossa (`/models add` è deprecato)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | rimosse (il valore esatto `NO_REPLY` non viene più riscritto in testo di fallback visibile)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | rimossa (OpenClaw gestisce il prompt di sistema generato)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | rimossa (usare `models.providers.<id>.timeoutSeconds` per i timeout lenti di modelli/provider, mantenuti al di sotto del limite massimo di timeout dell'agente/esecuzione) |
    | `memorySearch` di primo livello                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (a qualsiasi livello)                                                            | rimossa (gli indici di memoria risiedono nel database di ciascun agente)                       |
    | `heartbeat` di primo livello                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | ID delle policy `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | rimosse (deprecate)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Le righe `plugins.entries.voice-call.config.*` riportate sopra vengono normalizzate dal
      Plugin Voice Call stesso a ogni caricamento della configurazione, non da `openclaw
      doctor`. Il Plugin registra inoltre un avviso all'avvio che rimanda a `openclaw
      doctor --fix`, ma doctor attualmente non riscrive
      `openclaw.json` per queste chiavi; è la normalizzazione del Plugin
      stesso ad applicare la modifica in fase di esecuzione.
    </Note>

    Indicazioni sull'account predefinito per i canali con più account:

    - Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può selezionare un account imprevisto.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID degli account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se sono stati aggiunti manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questi sostituiscono il catalogo OpenCode integrato di `openclaw/plugin-sdk/llm`. Ciò può forzare i modelli a usare l'API errata o azzerare i costi. Doctor mostra un avviso per consentire di rimuovere l'override e ripristinare l'instradamento API e i costi specifici per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e idoneità di Chrome MCP">
    Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza al modello di collegamento Chrome MCP locale all'host attualmente in uso (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` rimosso).

    Doctor verifica inoltre il percorso Chrome MCP locale all'host quando si usa `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - verifica se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - verifica la versione di Chrome rilevata e mostra un avviso se è precedente a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (ad esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome. Chrome MCP locale all'host richiede comunque un browser basato su Chromium 144+ sull'host del Gateway/Node, eseguito localmente, con il debug remoto abilitato e la prima richiesta di consenso al collegamento approvata nel browser.

    L'idoneità qui riguarda soltanto i prerequisiti per il collegamento locale. Existing-session mantiene gli attuali limiti delle route Chrome MCP; le route avanzate come `responsebody`, l'esportazione PDF, l'intercettazione dei download e le azioni in batch richiedono comunque un browser gestito o un profilo CDP non elaborato. Questo controllo non si applica a Docker, sandbox, browser remoti o altri flussi headless, che continuano a usare CDP non elaborato.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS per OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale di Node/OpenSSL possa convalidare la catena di certificati. Se il controllo non riesce a causa di un errore del certificato (ad esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o autofirmato), doctor mostra indicazioni di correzione specifiche per la piattaforma. Su macOS con un Node di Homebrew, la correzione è in genere `brew postinstall ca-certificates`. Con `--deep`, il controllo viene eseguito anche se il Gateway è integro.
  </Accordion>
  <Accordion title="2e. Override del provider OAuth Codex">
    Se in precedenza sono state aggiunte impostazioni di trasporto OpenAI legacy in `models.providers.openai-codex`, queste possono oscurare il percorso del provider OAuth Codex integrato. Doctor mostra un avviso quando rileva tali vecchie impostazioni di trasporto insieme a OAuth Codex, in modo da consentire la rimozione o la riscrittura dell'override di trasporto obsoleto e il ripristino del comportamento di instradamento attuale. I proxy personalizzati e gli override dei soli header rimangono supportati e non attivano questo avviso, ma le route di richiesta definite in questo modo non sono idonee alla selezione implicita di Codex.
  </Accordion>
  <Accordion title="2f. Riparazione delle route Codex">
    Doctor verifica la presenza di riferimenti di modello `openai-codex/*` legacy. L'instradamento nativo dell'harness Codex usa riferimenti di modello `openai/*` canonici, ma il solo prefisso non seleziona mai Codex. Quando la policy di runtime non è impostata o è `auto`, è idonea soltanto una route ufficiale HTTPS Platform Responses o ChatGPT Responses esatta, senza override della richiesta definito. Consultare [runtime implicito dell'agente OpenAI](/it/providers/openai#implicit-agent-runtime).

    In modalità `--fix` / `--repair`, doctor riscrive i riferimenti interessati dell'agente predefinito e dei singoli agenti, inclusi i modelli primari, i fallback, i modelli di generazione di immagini/video, gli override di heartbeat/subagente/compaction, gli hook, gli override del modello del canale e lo stato obsoleto e persistente delle route di sessione:

    - `openai-codex/gpt-*` diventa `openai/gpt-*`.
    - L'intento Codex viene spostato nelle voci `agentRuntime.id: "codex"` con ambito provider/modello per i riferimenti di modello dell'agente riparati.
    - La configurazione obsoleta del runtime dell'intero agente e i vincoli persistenti del runtime di sessione vengono rimossi, perché la selezione del runtime ha ambito provider/modello.
    - La policy di runtime provider/modello esistente viene mantenuta, a meno che il riferimento di modello legacy riparato non richieda l'instradamento Codex per conservare il precedente percorso di autenticazione.
    - Gli elenchi di fallback dei modelli esistenti vengono mantenuti riscrivendo le relative voci legacy; le impostazioni copiate per modello vengono spostate dalla chiave legacy alla chiave canonica `openai/*`.
    - I valori persistenti di sessione `modelProvider`/`providerOverride`, `model`/`modelOverride`, gli avvisi di fallback e i vincoli dei profili di autenticazione vengono riparati in tutti gli archivi di sessione degli agenti rilevati.
    - Doctor ripara separatamente i vincoli `agentRuntime.id: "codex-cli"` obsoleti (un distinto ID di runtime legacy) impostandoli su `"codex"` nelle voci di modello `agents.defaults`, `agents.list[]` e `models.providers.*`.
    - `/codex ...` significa "controllare o associare una conversazione Codex nativa dalla chat".
    - `/acp ...` o `runtime: "acp"` significa "usare l'adattatore ACP/acpx esterno".

  </Accordion>
  <Accordion title="2g. Pulizia delle route di sessione">
    Doctor analizza inoltre gli archivi di sessione degli agenti rilevati per individuare lo stato obsoleto delle route creato automaticamente dopo lo spostamento dei modelli configurati o del runtime da una route appartenente a un Plugin, come Codex.

    `openclaw doctor --fix` può eliminare lo stato obsoleto creato automaticamente, come i vincoli di modello `modelOverrideSource: "auto"`, i metadati del modello di runtime, gli ID dell'harness vincolati, le associazioni delle sessioni CLI e gli override automatici dei profili di autenticazione, quando la route proprietaria non è più configurata. Le scelte esplicite dell'utente o legacy relative al modello di sessione vengono segnalate per una revisione manuale e lasciate invariate; modificarle con `/model ...`, `/new` oppure reimpostare la sessione quando tale route non è più prevista.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (struttura su disco)">
    Doctor può migrare le precedenti strutture su disco nella struttura attuale:

    - Archivio delle sessioni e trascrizioni: da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory dell'agente: da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato di autenticazione WhatsApp (Baileys): dal percorso legacy `~/.openclaw/credentials/*.json` (tranne `oauth.json`) a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono eseguite al meglio delle possibilità e sono idempotenti; doctor mostra avvisi quando lascia cartelle legacy come backup. Anche il Gateway/CLI migra automaticamente all'avvio le sessioni legacy e la directory dell'agente, affinché cronologia, autenticazione e modelli vengano collocati nel percorso specifico dell'agente senza eseguire manualmente doctor. L'autenticazione WhatsApp viene intenzionalmente migrata soltanto tramite `openclaw doctor`. La normalizzazione del provider Talk e della mappa dei provider esegue il confronto in base all'uguaglianza strutturale, pertanto le differenze relative al solo ordine delle chiavi non attivano più modifiche `doctor --fix` ripetute e senza effetto.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest dei Plugin legacy">
    Doctor analizza tutti i manifest dei Plugin installati alla ricerca di chiavi di funzionalità di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere direttamente il file manifest. Questa migrazione è idempotente; se `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio Cron legacy">
    Doctor controlla inoltre l'archivio dei processi Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita oppure `cron.store` quando viene applicato un override) alla ricerca di vecchie strutture dei processi ancora accettate dallo scheduler per compatibilità.

    Le attuali operazioni di pulizia di Cron includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi del payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna `provider` del payload → `delivery.channel` esplicito
    - processi di fallback Webhook `notify: true` legacy → consegna Webhook esplicita da `cron.webhook`, quando impostato; i processi di annuncio mantengono la consegna in chat e ricevono `delivery.completionDestination`. Quando `cron.webhook` non è impostato, l'indicatore `notify` inerte di primo livello viene rimosso per i processi privi di destinazione (la consegna esistente, inclusi gli annunci, viene mantenuta), poiché la consegna in fase di runtime non lo legge mai.

    Il Gateway sanifica inoltre le righe Cron non valide durante il caricamento, affinché i processi validi continuino a essere eseguiti. Prima della rimozione da `jobs.json`, le righe non valide non elaborate vengono copiate in `jobs-quarantine.json`, accanto all'archivio attivo; doctor segnala le righe messe in quarantena per consentirne la revisione o la riparazione manuale.

    All'avvio, il Gateway normalizza la proiezione del runtime e ignora l'indicatore `notify` di primo livello, ma lascia invariata la configurazione Cron persistente affinché venga riparata da doctor. Quando `cron.webhook` non è impostato, doctor rimuove l'indicatore inerte dai processi privi di una destinazione di migrazione (`delivery.mode` assente/nessuna, una destinazione Webhook inutilizzabile o una consegna di annuncio/chat esistente), lasciando invariata la consegna esistente; in questo modo le esecuzioni ripetute di `doctor --fix` non mostrano più avvisi per lo stesso processo. Se `cron.webhook` è impostato ma non è un URL HTTP(S) valido, doctor mostra comunque un avviso e lascia l'indicatore affinché sia possibile correggere l'URL.

    Su Linux, doctor mostra inoltre un avviso quando il crontab dell'utente richiama ancora il comando legacy `~/.openclaw/bin/ensure-whatsapp.sh`. Tale script locale all'host non è gestito dalla versione attuale di OpenClaw e può scrivere falsi messaggi `Gateway inactive` in `~/.openclaw/logs/whatsapp-health.log` quando Cron non riesce a raggiungere il bus utente systemd. Rimuovere la voce obsoleta del crontab con `crontab -e`; usare `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` per gli attuali controlli di integrità.

  </Accordion>
  <Accordion title="3c. Pulizia dei blocchi delle sessioni">
    Doctor analizza ogni directory delle sessioni degli agenti alla ricerca di file di blocco della scrittura obsoleti lasciati da sessioni terminate in modo anomalo. Per ogni file di blocco trovato, segnala: il percorso, il PID, se il PID è ancora attivo, l'età del blocco e se è considerato obsoleto (PID non attivo, metadati del proprietario non validi, età superiore a 30 minuti oppure PID attivo di cui è stato accertato l'utilizzo da parte di un processo non OpenClaw). In modalità `--fix` / `--repair`, rimuove automaticamente i blocchi con proprietari non attivi, orfani, riciclati, non validi e obsoleti oppure non OpenClaw. I vecchi blocchi ancora appartenenti a un processo OpenClaw attivo vengono segnalati ma lasciati in posizione, affinché doctor non interrompa un processo attivo che scrive una trascrizione.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami delle trascrizioni di sessione">
    Doctor analizza i file JSONL delle sessioni degli agenti alla ricerca della struttura di ramo duplicata creata dal bug di riscrittura delle trascrizioni dei prompt del 2026.4.24: un turno dell'utente abbandonato con il contesto di runtime interno di OpenClaw e un ramo fratello attivo contenente lo stesso prompt visibile dell'utente. In modalità `--fix` / `--repair`, doctor crea una copia di backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, affinché la cronologia del Gateway e i lettori della memoria non rilevino più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, instradamento e sicurezza)">
    La directory dello stato è il centro nevralgico operativo. Se scompare, si perdono sessioni, credenziali, log e configurazione, salvo la presenza di backup altrove.

    Doctor verifica:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, invita a ricreare la directory e ricorda che non è possibile recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica che sia scrivibile; propone di correggere i permessi (e mostra un suggerimento `chown` quando rileva una mancata corrispondenza di proprietario/gruppo).
    - **Directory di stato sincronizzata con il cloud su macOS**: avvisa quando lo stato viene risolto sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...`, perché i percorsi basati sulla sincronizzazione possono causare operazioni di I/O più lente e condizioni di competizione tra blocco e sincronizzazione.
    - **Directory di stato su SD o eMMC in Linux**: avvisa quando lo stato viene risolto in un'origine di montaggio `mmcblk*`, perché le operazioni di I/O casuali su SD/eMMC possono essere più lente e causare un'usura più rapida durante le scritture di sessioni e credenziali.
    - **Directory di stato volatile in Linux**: avvisa quando lo stato viene risolto in `tmpfs` o `ramfs`, perché sessioni, credenziali, configurazione e stato SQLite (con file accessori WAL/journal) scompaiono al riavvio. I montaggi Docker `overlay` non vengono intenzionalmente segnalati perché i relativi livelli scrivibili persistono tra i riavvii dell'host finché il container rimane presente.
    - **Directory delle sessioni mancanti**: `sessions/` e la directory di archiviazione delle sessioni sono necessarie per conservare la cronologia ed evitare arresti anomali `ENOENT`.
    - **Mancata corrispondenza delle trascrizioni**: avvisa quando le voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale con "JSONL su 1 riga"**: segnala quando la trascrizione principale contiene una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` nelle directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può suddividersi tra le installazioni).
    - **Promemoria della modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato risiede lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile dal gruppo o da tutti e propone di restringere i permessi a `600`.

  </Accordion>
  <Accordion title="5. Stato dell'autenticazione del modello (scadenza OAuth)">
    Doctor esamina i profili OAuth nell'archivio di autenticazione, avvisa quando i token stanno per scadere o sono scaduti e, quando è sicuro, può aggiornarli. Se il profilo OAuth/token di Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso del token di configurazione Anthropic. Le richieste di aggiornamento vengono visualizzate solo durante l'esecuzione interattiva (TTY); `--non-interactive` ignora i tentativi di aggiornamento.

    Quando un aggiornamento OAuth non riesce in modo permanente (ad esempio `refresh_token_reused`, `invalid_grant` oppure un provider richiede di accedere nuovamente), doctor segnala che è necessaria una nuova autenticazione e mostra il comando `openclaw models auth login --provider ...` esatto da eseguire.

    Doctor segnala inoltre i profili di autenticazione temporaneamente inutilizzabili a causa di brevi periodi di attesa (limiti di frequenza, timeout o errori di autenticazione) o disabilitazioni più lunghe (problemi di fatturazione o credito).

    I profili OAuth Codex legacy i cui token risiedono nel Portachiavi macOS (onboarding precedente al layout con file accessorio) vengono corretti esclusivamente da doctor. Eseguire `openclaw doctor --fix` una volta da un terminale interattivo per migrare direttamente i token legacy basati sul Portachiavi in `auth-profiles.json`; successivamente, le esecuzioni incorporate (Telegram, cron, invio a sotto-agenti) li risolvono come profili OAuth OpenAI canonici.

  </Accordion>
  <Accordion title="6. Convalida del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor convalida il riferimento al modello rispetto al catalogo e all'elenco consentito e avvisa quando non può essere risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e propone di crearle o di passare ai nomi legacy se l'immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Pulizia dell'installazione dei Plugin">
    Doctor rimuove lo stato legacy di preparazione delle dipendenze dei Plugin generato da OpenClaw in modalità `openclaw doctor --fix` / `openclaw doctor --repair`: radici obsolete delle dipendenze generate, vecchie directory della fase di installazione, residui locali dei pacchetti prodotti dal precedente codice di riparazione delle dipendenze dei Plugin inclusi e copie npm gestite orfane o recuperate dei Plugin `@openclaw/*` inclusi, che possono oscurare il manifest incluso corrente. Doctor ricollega inoltre il pacchetto host `openclaw` nei Plugin npm gestiti che dichiarano `peerDependencies.openclaw`, affinché le importazioni di runtime locali del pacchetto, come `openclaw/plugin-sdk/*`, continuino a essere risolte dopo gli aggiornamenti o le riparazioni npm.

    Doctor può inoltre reinstallare i Plugin scaricabili mancanti quando sono referenziati dalla configurazione ma non vengono trovati dal registro locale dei Plugin (`plugins.entries` materiale, impostazioni configurate di canale/provider/ricerca, runtime degli agenti configurati). Durante gli aggiornamenti dei pacchetti, doctor evita di reinstallare i pacchetti dei Plugin mentre il pacchetto principale viene sostituito; eseguire nuovamente `openclaw doctor --fix` dopo l'aggiornamento se un Plugin configurato necessita ancora di ripristino. Al di fuori dell'eccezione per l'avvio dell'immagine del container descritta di seguito, l'avvio del Gateway e il ricaricamento della configurazione non eseguono la riparazione dei pacchetti; le installazioni dei Plugin restano operazioni esplicite di doctor/installazione/aggiornamento.

    L'avvio del Gateway in un container prevede una limitata eccezione per l'aggiornamento: quando `openclaw gateway run` viene avviato con una nuova versione di OpenClaw, esegue le migrazioni sicure dello stato e la convergenza post-core esistente dei Plugin prima di risultare pronto, quindi registra un checkpoint per versione. Questo passaggio di avvio può eliminare i record obsoleti dei Plugin inclusi, correggere i collegamenti locali dei Plugin, reinstallare i pacchetti dei Plugin configurati quando richiesto dal percorso di convergenza e controllare i payload dei Plugin attivi. Se l'avvio non riesce a eseguire la riparazione in sicurezza, eseguire una volta la stessa immagine con `openclaw doctor --fix` sullo stesso stato e sulla stessa configurazione montati, prima di riavviare normalmente il container.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti per la pulizia">
    Doctor rileva i servizi Gateway legacy (launchd/systemd/schtasks) e propone di rimuoverli e installare il servizio OpenClaw usando la porta corrente del Gateway. Può inoltre cercare servizi aggiuntivi simili al Gateway e mostrare suggerimenti per la pulizia. I servizi Gateway OpenClaw denominati in base al profilo sono considerati elementi di prima classe e non vengono contrassegnati come "aggiuntivi".

    In Linux, se il servizio Gateway a livello utente è mancante ma esiste un servizio Gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Esaminare con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovere il duplicato o impostare `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando il ciclo di vita del Gateway è gestito da un supervisore di sistema.

  </Accordion>
  <Accordion title="8b. Migrazione di Matrix all'avvio">
    Quando un account di canale Matrix presenta una migrazione dello stato legacy in sospeso o eseguibile, doctor (in modalità `--fix` / `--repair`) crea un'istantanea precedente alla migrazione, quindi esegue le fasi di migrazione secondo il principio del massimo sforzo: migrazione dello stato Matrix legacy e preparazione dello stato crittografato legacy. Entrambe le fasi non sono irreversibili; gli errori vengono registrati e l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene interamente ignorato.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e divergenza dell'autenticazione">
    Doctor esamina lo stato di associazione dei dispositivi nell'ambito del normale controllo di integrità, segnalando:

    - richieste in sospeso di prima associazione
    - aggiornamenti in sospeso di ruolo o ambito per dispositivi già associati
    - correzioni delle mancata corrispondenza della chiave pubblica in cui l'ID del dispositivo corrisponde ancora, ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti divergono dalla base di riferimento dell'associazione approvata
    - voci memorizzate nella cache locale del token del dispositivo per la macchina corrente, precedenti a una rotazione del token sul lato Gateway o contenenti metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dei dispositivi. Mostra i passaggi successivi esatti:

    - esaminare le richieste in sospeso con `openclaw devices list`
    - approvare la richiesta esatta con `openclaw devices approve <requestId>`
    - ruotare un nuovo token con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovere e approvare nuovamente un record obsoleto con `openclaw devices remove <deviceId>`

    Ciò distingue la prima associazione dagli aggiornamenti in sospeso di ruolo/ambito e dalla divergenza di token/identità del dispositivo obsoleti, eliminando il comune problema "già associato, ma continua a essere richiesta l'associazione".

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor mostra una nota di sicurezza solo quando rileva un avviso, ad esempio un provider aperto ai messaggi diretti senza un elenco consentito o un criterio configurato in modo pericoloso. Usare `openclaw security audit` per l'inventario completo della sicurezza.
  </Accordion>
  <Accordion title="10. Permanenza di systemd (Linux)">
    Se viene eseguito come servizio utente systemd, doctor verifica che la permanenza sia abilitata, affinché il Gateway rimanga attivo dopo la disconnessione.
  </Accordion>
  <Accordion title="11. Stato dell'area di lavoro (Skills, Plugin e TaskFlow)">
    Doctor mostra problemi e azioni per l'agente predefinito, non l'inventario dello stato integro:

    - **Skills**: elenca i nomi delle Skills consentite ma inutilizzabili; usare `openclaw skills check` per i dettagli sui requisiti e i conteggi completi.
    - **Plugin**: segnala solo gli ID dei Plugin con errori; usare `openclaw plugins list` per l'inventario dei Plugin caricati, importati, disabilitati e inclusi nel bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i Plugin che presentano problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: espone tutti gli avvisi o gli errori generati durante il caricamento dal registro dei Plugin.
    - **Ripristino dei TaskFlow**: espone i TaskFlow gestiti sospetti che richiedono un'ispezione manuale o l'annullamento.
    - **CLI Claude**: segnala esclusivamente problemi relativi al file binario, all'autenticazione, al profilo, all'area di lavoro o alla directory del progetto; i dettagli delle verifiche riuscite vengono omessi.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap dell'area di lavoro (ad esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto inseriti) sono vicini o superiori al limite di caratteri configurato. Segnala per ogni file il conteggio dei caratteri grezzi rispetto a quelli inseriti, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri inseriti come frazione del limite totale. Quando i file vengono troncati o sono vicini al limite, doctor mostra suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento tramite tabulazione è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo della shell utilizza un modello lento di completamento dinamico (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce basata su un file memorizzato nella cache.
    - Se il completamento è configurato nel profilo ma il file della cache è mancante, doctor rigenera automaticamente la cache.
    - Se il completamento non è configurato, doctor propone di installarlo (solo in modalità interattiva; ignorato con `--non-interactive`).

    Eseguire `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin di canale mancante, rimuove anche la configurazione pendente relativa al canale che faceva riferimento a tale Plugin: le voci `channels.<id>`, le destinazioni Heartbeat che indicavano il canale e le sostituzioni `agents.*.models["<channel>/*"]`. Ciò impedisce cicli di avvio del Gateway in cui il runtime del canale non è più presente, ma la configurazione richiede ancora al Gateway di associarsi a esso.
  </Accordion>
  <Accordion title="12. Controlli di autenticazione del Gateway (token locale)">
    Doctor controlla che l'autenticazione tramite token del Gateway locale sia pronta.

    - Se la modalità token richiede un token e non esiste alcuna origine del token, doctor propone di generarne uno.
    - Se `gateway.auth.token` è gestito tramite SecretRef ma non è disponibile, doctor avvisa e non lo sovrascrive con testo non cifrato.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun SecretRef per il token.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura compatibili con SecretRef">
    Alcuni flussi di riparazione devono esaminare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` utilizza lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per le riparazioni mirate della configurazione.
    - Esempio: il tentativo di riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a utilizzare le credenziali del bot configurate, quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e ignora la risoluzione automatica, anziché arrestarsi in modo anomalo o indicare erroneamente che il token è mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità e riavvio del Gateway">
    Doctor esegue un controllo di integrità e propone di riavviare il Gateway quando sembra non funzionare correttamente.
  </Accordion>
  <Accordion title="13b. Disponibilità della ricerca in memoria">
    Doctor verifica se il provider di embedding configurato per la ricerca in memoria è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, mostra indicazioni per la correzione, tra cui `npm install -g @tobilu/qmd` (o l'equivalente Bun), e un'opzione per specificare manualmente il percorso del binario.
    - **Provider locale esplicito**: verifica la presenza di un file di modello locale o di un URL riconosciuto per un modello remoto/scaricabile. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che sia presente una chiave API nell'ambiente o nell'archivio di autenticazione. Se manca, mostra suggerimenti pratici per la correzione.
    - **Provider automatico legacy**: considera `memorySearch.provider: "auto"` come OpenAI, verifica la disponibilità di OpenAI e `doctor --fix` lo riscrive come `provider: "openai"`.

    Quando è disponibile un risultato memorizzato nella cache della verifica del Gateway (il Gateway era integro al momento del controllo), doctor confronta il risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze. Nel percorso predefinito, doctor non avvia un nuovo ping degli embedding; utilizzare il comando di stato approfondito della memoria quando si desidera un controllo in tempo reale del provider.

    Utilizzare `openclaw memory status --deep` per verificare in fase di esecuzione la disponibilità degli embedding.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato dei canali">
    Se il Gateway è integro, doctor esegue una verifica dello stato dei canali e segnala gli avvisi con le correzioni suggerite.
  </Accordion>
  <Accordion title="15. Controllo e riparazione della configurazione del supervisore">
    Doctor verifica che nella configurazione del supervisore installato (launchd/systemd/schtasks) non manchino impostazioni predefinite o non siano presenti impostazioni obsolete (ad esempio, le dipendenze network-online di systemd e il ritardo di riavvio). Quando rileva una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio o l'attività con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` richiede conferma prima di riscrivere la configurazione del supervisore.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --fix` applica le correzioni consigliate senza richieste di conferma (`--repair` è un alias).
    - `openclaw doctor --fix --force` sovrascrive le configurazioni personalizzate del supervisore.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Continua a segnalare l'integrità del servizio e a eseguire riparazioni non relative al servizio, ma ignora l'installazione, l'avvio, il riavvio e il bootstrap del servizio, le riscritture della configurazione del supervisore e la pulizia dei servizi legacy, poiché il ciclo di vita è gestito da un supervisore esterno.
    - Su Linux, doctor non riscrive i metadati del comando o del punto di ingresso mentre l'unità systemd corrispondente del Gateway è attiva. Durante la scansione dei servizi duplicati, ignora inoltre le unità aggiuntive inattive simili al Gateway che non sono legacy, affinché i file di servizio complementari non generino segnalazioni di pulizia superflue.
    - Se l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito tramite SecretRef, l'installazione o la riparazione del servizio da parte di doctor convalida SecretRef, ma non salva i valori del token in testo non crittografato risolti nei metadati dell'ambiente del servizio del supervisore.
    - Doctor rileva i valori gestiti `.env` o basati su SecretRef dell'ambiente del servizio che le installazioni precedenti di LaunchAgent, systemd o delle attività pianificate di Windows incorporavano direttamente e riscrive i metadati del servizio affinché tali valori vengano caricati dall'origine di runtime anziché dalla definizione del supervisore.
    - Doctor rileva quando il comando del servizio è ancora vincolato a un vecchio `--port` dopo le modifiche a `gateway.port` e riscrive i metadati del servizio con la porta corrente.
    - Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione o riparazione fornendo indicazioni pratiche.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca l'installazione o la riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità systemd utente di Linux, i controlli di doctor sulla divergenza dei token includono le origini `Environment=` e `EnvironmentFile=` durante il confronto dei metadati di autenticazione del servizio.
    - Le riparazioni del servizio da parte di doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Consultare [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - È sempre possibile forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostica del runtime e della porta del Gateway">
    Doctor esamina il runtime del servizio (PID, stato dell'ultima uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Verifica inoltre la presenza di conflitti sulla porta del Gateway (valore predefinito `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Procedure consigliate per il runtime del Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito tramite versioni (`nvm`, `fnm`, `volta`, `asdf`, ecc.). Bun non può aprire l'archivio di stato `node:sqlite` di OpenClaw, quindi le riparazioni migrano i servizi Bun legacy a Node. I percorsi dei gestori di versioni possono non funzionare dopo gli aggiornamenti, poiché il servizio non carica l'inizializzazione della shell. Doctor propone la migrazione a un'installazione di sistema di Node, quando disponibile (Homebrew/apt/choco).

    I LaunchAgent macOS appena installati o riparati utilizzano un PATH di sistema canonico (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) anziché copiare il PATH della shell interattiva, in modo che i binari di sistema gestiti da Homebrew rimangano disponibili, mentre Volta, asdf, fnm, pnpm e le altre directory dei gestori di versioni non modifichino il Node risolto dai processi figlio. I servizi Linux continuano a mantenere radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory stabili dei binari utente, ma le directory alternative presunte dei gestori di versioni vengono scritte nel PATH del servizio solo quando esistono su disco.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione e metadati della procedura guidata">
    Doctor salva le modifiche alla configurazione e aggiunge i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per l'area di lavoro (backup e sistema di memoria)">
    Doctor suggerisce un sistema di memoria per l'area di lavoro quando manca e mostra un suggerimento per il backup se l'area di lavoro non è già gestita con git.

    Consultare [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura dell'area di lavoro e al backup con git (si consiglia un repository privato GitHub o GitLab).

  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Manuale operativo del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
