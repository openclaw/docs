---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Diagnostica
x-i18n:
    generated_at: "2026-04-30T16:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stato obsoleti, controlla l’integrità e fornisce passaggi di riparazione attuabili.

## Avvio rapido

```bash
openclaw doctor
```

### Modalità headless e automazione

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riparazione di riavvio/servizio/sandbox quando applicabili).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii quando sicuro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Applica anche riparazioni aggressive (sovrascrive configurazioni supervisor personalizzate).

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

    Analizza i servizi di sistema per installazioni Gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi esaminare le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, UI e aggiornamenti">
    - Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
    - Controllo di aggiornamento del protocollo UI (ricompila Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + prompt di riavvio.
    - Riepilogo stato Skills (idonee/mancanti/bloccate) e stato dei plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai campi legacy piatti `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione browser per configurazioni legacy dell’estensione Chrome e prontezza Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi sullo shadowing OAuth di Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OpenAI Codex OAuth.
    - Migrazione dello stato legacy su disco (sessions/dir agent/WhatsApp auth).
    - Migrazione delle chiavi di contratto del manifest plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione dello store cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, job webhook fallback semplici `notify: true`).
    - Migrazione della policy runtime agente legacy a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.
    - Pulizia della configurazione plugin obsoleta quando i plugin sono abilitati; quando `plugins.enabled=false`, i riferimenti plugin obsoleti sono trattati come configurazione di contenimento inerte e vengono conservati.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file di lock delle sessioni e pulizia dei lock obsoleti.
    - Riparazione delle trascrizioni di sessione per rami duplicati di riscrittura prompt creati dalle build 2026.4.24 interessate.
    - Rilevamento dei tombstone di ripristino-riavvio di subagent bloccati, con supporto `--fix` per eliminare flag di ripristino interrotto obsoleti così l’avvio non continua a trattare il figlio come interrotto dal riavvio.
    - Controlli di integrità dello stato e permessi (sessions, transcripts, dir di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) durante l’esecuzione locale.
    - Integrità auth modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati dei profili auth.
    - Rilevamento di dir workspace aggiuntive (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell’immagine sandbox quando il sandboxing è abilitato.
    - Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
    - Pulizia dell’ambiente proxy incorporato per servizi Gateway che hanno catturato valori shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante installazione o aggiornamento.
    - Controlli delle best practice runtime Gateway (Node vs Bun, percorsi dei version manager).
    - Diagnostica collisioni porta Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e pairing">
    - Avvisi di sicurezza per policy DM aperte.
    - Controlli auth Gateway per modalità token locale (offre la generazione token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
    - Rilevamento problemi di pairing dispositivo (richieste di primo pairing in sospeso, upgrade ruolo/scope in sospeso, deriva della cache token-dispositivo locale obsoleta e deriva auth del record associato).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Controllo systemd linger su Linux.
    - Controllo dimensione file bootstrap del workspace (avvisi di troncamento/quasi limite per file di contesto).
    - Controllo stato completamento shell e installazione/aggiornamento automatici.
    - Controllo prontezza provider embedding per ricerca memoria (modello locale, chiave API remota o binario QMD).
    - Controlli installazione da sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati wizard.

  </Accordion>
</AccordionGroup>

## Backfill e reset UI Dreams

La scena Dreams della Control UI include azioni **Backfill**, **Reset** e **Clear Grounded** per il workflow dreaming grounded. Queste azioni usano metodi RPC in stile Gateway doctor, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio diario REM grounded e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove solo quelle voci diario di backfill contrassegnate da `DREAMS.md`.
- **Clear Grounded** rimuove solo voci a breve termine staged solo grounded provenienti da replay storico e che non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage candidati grounded nello store live di promozione a breve termine, a meno che tu non esegua prima esplicitamente il percorso CLI staged

Se vuoi che il replay storico grounded influenzi la normale lane di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage candidati durevoli grounded nello store dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valore legacy (per esempio `messages.ackReaction` senza override specifico per canale), doctor le normalizza nello schema corrente.

    Questo include i campi piatti legacy di Talk. La configurazione Talk pubblica corrente è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider.

  </Accordion>
  <Accordion title="2. Migrazioni chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, gli altri comandi rifiutano l’esecuzione e chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiegherà quali chiavi legacy sono state trovate.
    - Mostrerà la migrazione applicata.
    - Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Anche il Gateway esegue automaticamente le migrazioni doctor all’avvio quando rileva un formato di configurazione legacy, così le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni correnti:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - Per canali con `accounts` nominati ma valori di canale di primo livello ad account singolo ancora presenti, sposta quei valori con scope account nell’account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare un target nominato/predefinito corrispondente esistente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - rimuovi `agents.defaults.llm`; usa `models.providers.<id>.timeoutSeconds` per timeout di provider/modelli lenti
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuovi `browser.relayBindHost` (impostazione legacy del relay dell’estensione)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (l’avvio Gateway salta anche provider il cui `api` è impostato su un valore enum futuro o sconosciuto invece di fallire in modalità chiusa)

    Gli avvisi Doctor includono anche indicazioni sugli account predefiniti per canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l'instradamento di fallback può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override dei provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, questo sostituisce il catalogo OpenCode integrato da `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare instradamento API e costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione per Chrome MCP">
    Se la tua configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza al modello corrente di collegamento Chrome MCP host-local:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor controlla anche il percorso Chrome MCP host-local quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - verifica se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il debug remoto nella pagina di ispezione del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare l'impostazione lato Chrome al posto tuo. Chrome MCP host-local richiede comunque:

    - un browser basato su Chromium 144+ sull'host gateway/nodo
    - il browser in esecuzione localmente
    - debug remoto abilitato in quel browser
    - approvazione del primo prompt di consenso al collegamento nel browser

    La preparazione qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene gli attuali limiti di instradamento Chrome MCP; instradamenti avanzati come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor sonda l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se la sonda fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato), doctor stampa indicazioni di correzione specifiche per la piattaforma. Su macOS con un Node Homebrew, la correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la sonda viene eseguita anche se il gateway è sano.
  </Accordion>
  <Accordion title="2e. Override dei provider OAuth Codex">
    Se in precedenza hai aggiunto impostazioni di trasporto OpenAI legacy sotto `models.providers.openai-codex`, possono oscurare il percorso del provider OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a OAuth Codex, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e recuperare il comportamento integrato di instradamento/fallback. Proxy personalizzati e override solo intestazione sono ancora supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi di instradamento del Plugin Codex">
    Quando il Plugin Codex incluso è abilitato, doctor controlla anche se i riferimenti ai modelli primari `openai-codex/*` continuano a risolversi tramite il runner PI predefinito. Questa combinazione è valida quando vuoi l'autenticazione OAuth/sottoscrizione Codex tramite PI, ma è facile confonderla con l'harness app-server nativo di Codex. Doctor avvisa e indica la forma app-server esplicita: `openai/*` più `agentRuntime.id: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non la ripara automaticamente perché entrambi gli instradamenti sono validi:

    - `openai-codex/*` + PI significa "usa l'autenticazione OAuth/sottoscrizione Codex tramite il normale runner OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "esegui il turno incorporato tramite l'app-server nativo Codex."
    - `/codex ...` significa "controlla o collega una conversazione Codex nativa dalla chat."
    - `/acp ...` o `runtime: "acp"` significa "usa l'adattatore ACP/acpx esterno."

    Se compare l'avviso, scegli l'instradamento che intendevi usare e modifica manualmente la configurazione. Mantieni l'avviso così com'è quando OAuth Codex tramite PI è intenzionale.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare layout su disco più vecchi nella struttura corrente:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando lascia cartelle legacy come backup. Anche Gateway/CLI migra automaticamente all'avvio le sessioni legacy + la directory agente, così cronologia/auth/modelli finiscono nel percorso per agente senza un'esecuzione manuale di doctor. L'auth WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione provider/provider-map per il parlato ora confronta per uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più modifiche `doctor --fix` ripetute e senza effetto.

  </Accordion>
  <Accordion title="3a. Migrazioni dei manifest Plugin legacy">
    Doctor analizza tutti i manifest dei Plugin installati alla ricerca di chiavi di capability di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts` e riscrivere il file manifest in-place. Questa migrazione è idempotente; se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni dell'archivio Cron legacy">
    Doctor controlla anche l'archivio dei job Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` quando sovrascritto) per vecchie forme di job che lo scheduler accetta ancora per compatibilità.

    Le pulizie Cron correnti includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi di consegna di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias di consegna payload `provider` → `delivery.channel` esplicito
    - semplici job legacy di fallback Webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor migra automaticamente i job `notify: true` solo quando può farlo senza cambiare il comportamento. Se un job combina il fallback notify legacy con una modalità di consegna non Webhook esistente, doctor avvisa e lascia quel job per revisione manuale.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor analizza ogni directory di sessione dell'agente alla ricerca di file write-lock obsoleti — file rimasti quando una sessione è uscita in modo anomalo. Per ogni file lock trovato riporta: percorso, PID, se il PID è ancora attivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file lock obsoleti; altrimenti stampa una nota e indica di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami delle trascrizioni di sessione">
    Doctor analizza i file JSONL delle sessioni agente alla ricerca della forma di ramo duplicata creata dal bug di riscrittura delle trascrizioni dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno OpenClaw più un elemento sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor crea un backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo, così la cronologia del gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza sessioni, instradamento e sicurezza)">
    La directory di stato è il tronco cerebrale operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa del rischio di perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; propone di riparare i permessi (ed emette un suggerimento `chown` quando viene rilevata una mancata corrispondenza owner/group).
    - **Directory di stato sincronizzata su cloud macOS**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi supportati da sincronizzazione possono causare I/O più lento e race di lock/sync.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve a una sorgente di mount `mmcblk*`, perché l'I/O casuale supportato da SD o eMMC può essere più lento e usurarsi più rapidamente sotto scritture di sessioni e credenziali.
    - **Directory sessioni mancanti**: `sessions/` e la directory dell'archivio sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza delle trascrizioni**: avvisa quando voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha solo una riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in diverse home directory o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/mondo e propone di restringere a `600`.

  </Accordion>
  <Accordion title="5. Salute auth dei modelli (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio auth, avvisa quando i token sono in scadenza/scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token Anthropic. I prompt di aggiornamento compaiono solo durante l'esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di aggiornamento.

    Quando un aggiornamento OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che indica di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa il comando esatto `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili auth temporaneamente inutilizzabili a causa di:

    - cooldown brevi (limiti di frequenza/timeout/errori auth)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello degli hook">
    Se `hooks.gmail.model` è impostato, doctor convalida il riferimento al modello rispetto al catalogo e all'elenco consentito e avvisa quando non può essere risolto o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di crearle o di passare ai nomi legacy se l'immagine corrente manca.
  </Accordion>
  <Accordion title="7b. Dipendenze runtime dei Plugin in bundle">
    Doctor verifica le dipendenze runtime solo per i Plugin in bundle che sono attivi nella configurazione corrente o abilitati dal valore predefinito del loro manifest in bundle, ad esempio `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, `models.providers.*` configurati / riferimenti ai modelli degli agenti, oppure un Plugin in bundle abilitato per impostazione predefinita senza proprietà del provider. Se ne manca qualcuna, doctor segnala i pacchetti e li installa in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. I Plugin esterni usano comunque `openclaw plugins install` / `openclaw plugins update`; doctor non installa dipendenze per percorsi Plugin arbitrari.

    Durante la riparazione di doctor, le installazioni npm delle dipendenze runtime in bundle segnalano l'avanzamento con uno spinner nelle sessioni TTY e con righe periodiche nell'output con pipe/headless. Anche il Gateway e la CLI locale possono riparare su richiesta le dipendenze runtime dei Plugin in bundle attivi prima di importare un Plugin in bundle. Queste installazioni sono limitate alla root di installazione del runtime del Plugin, vengono eseguite con gli script disabilitati, non scrivono un package lock e sono protette da un lock della root di installazione, così avvii concorrenti della CLI o del Gateway non modificano contemporaneamente lo stesso albero `node_modules`.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta gateway corrente. Può anche cercare servizi aggiuntivi simili al gateway e stampare suggerimenti di pulizia. I servizi gateway OpenClaw con nome di profilo sono considerati di prima classe e non vengono contrassegnati come "extra".

    Su Linux, se il servizio gateway a livello utente manca ma esiste un servizio gateway OpenClaw a livello di sistema, doctor non installa automaticamente un secondo servizio a livello utente. Ispeziona con `openclaw gateway status --deep` o `openclaw doctor --deep`, quindi rimuovi il duplicato o imposta `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un supervisore di sistema possiede il ciclo di vita del gateway.

  </Accordion>
  <Accordion title="8b. Migrazione di avvio di Matrix">
    Quando un account di canale Matrix ha una migrazione dello stato legacy in sospeso o utilizzabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot prima della migrazione e poi esegue i passaggi di migrazione best-effort: migrazione dello stato legacy di Matrix e preparazione dello stato cifrato legacy. Entrambi i passaggi non sono fatali; gli errori vengono registrati e l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Associazione dei dispositivi e deriva dell'autenticazione">
    Doctor ora ispeziona lo stato di associazione dei dispositivi come parte del normale controllo di integrità.

    Cosa segnala:

    - richieste di prima associazione in sospeso
    - upgrade di ruolo in sospeso per dispositivi già associati
    - upgrade di ambito in sospeso per dispositivi già associati
    - riparazioni di mismatch della chiave pubblica in cui l'id dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record associati privi di un token attivo per un ruolo approvato
    - token associati i cui ambiti si discostano dalla baseline di associazione approvata
    - voci locali nella cache dei token dispositivo per la macchina corrente antecedenti a una rotazione del token lato gateway o con metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude la falla comune "già associato ma riceve ancora richiesta di associazione": doctor ora distingue la prima associazione dagli upgrade di ruolo/ambito in sospeso e dalla deriva di token/identità dispositivo obsoleti.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza un elenco consentito, oppure quando una policy è configurata in modo pericoloso.
  </Accordion>
  <Accordion title="10. linger di systemd (Linux)">
    Se è in esecuzione come servizio utente systemd, doctor garantisce che lingering sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato del workspace (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

    - **Stato Skills**: conteggia Skills idonee, con requisiti mancanti e bloccate dall'elenco consentito.
    - **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy esistono insieme al workspace corrente.
    - **Stato Plugin**: conteggia Plugin abilitati/disabilitati/con errori; elenca gli ID dei Plugin per eventuali errori; segnala le funzionalità dei Plugin in bundle.
    - **Avvisi di compatibilità Plugin**: segnala Plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica Plugin**: espone eventuali avvisi o errori in fase di caricamento emessi dal registro dei Plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file di bootstrap">
    Doctor controlla se i file di bootstrap del workspace (ad esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini al budget di caratteri configurato o lo superano. Segnala per ogni file i conteggi dei caratteri grezzi rispetto a quelli iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e i caratteri iniettati totali come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pulizia dei Plugin di canale obsoleti">
    Quando `openclaw doctor --fix` rimuove un Plugin di canale mancante, rimuove anche la configurazione pendente con scope di canale che faceva riferimento a quel Plugin: voci `channels.<id>`, destinazioni heartbeat che nominavano il canale e override `agents.*.models["<channel>/*"]`. Questo previene cicli di avvio del Gateway in cui il runtime del canale è assente ma la configurazione chiede ancora al gateway di associarsi a esso.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento con tab è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo della shell usa un pattern di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file di cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo in modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli auth del Gateway (token locale)">
    Doctor controlla la prontezza dell'autenticazione con token del gateway locale.

    - Se la modalità token richiede un token e non esiste alcuna origine del token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

  </Accordion>
  <Accordion title="12b. Riparazioni di sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef di sola lettura dei comandi della famiglia status per riparazioni di configurazione mirate.
    - Esempio: la riparazione di `allowFrom` / `groupAllowFrom` `@username` di Telegram prova a usare le credenziali bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di andare in crash o indicare erroneamente che il token manca.

  </Accordion>
  <Accordion title="13. Controllo di integrità del Gateway + riavvio">
    Doctor esegue un controllo di integrità e offre di riavviare il gateway quando appare non sano.
  </Accordion>
  <Accordion title="13b. Prontezza della ricerca in memoria">
    Doctor controlla se il provider di embedding per la ricerca in memoria configurato è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione per il percorso manuale del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio auth. Stampa suggerimenti di correzione utilizzabili se manca.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile un risultato di probe del gateway in cache (il gateway era sano al momento del controllo), doctor ne incrocia il risultato con la configurazione visibile alla CLI e nota eventuali discrepanze. Doctor non avvia un nuovo ping di embedding nel percorso predefinito; usa il comando di stato memoria approfondito quando vuoi un controllo live del provider.

    Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato dei canali">
    Se il gateway è sano, doctor esegue un probe dello stato dei canali e segnala avvisi con correzioni suggerite.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione del supervisore">
    Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (ad esempio dipendenze systemd da network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task con le impostazioni predefinite correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisor.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste.
    - `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio Gateway. Segnala comunque lo stato del servizio ed esegue le riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione del supervisor e pulizia dei servizi legacy perché quel ciclo di vita è gestito da un supervisor esterno.
    - Su Linux, doctor non riscrive i metadati di comando/entrypoint mentre l'unità Gateway systemd corrispondente è attiva. Ignora inoltre le unità inattive aggiuntive simili a Gateway non legacy durante la scansione dei servizi duplicati, così i file di servizio companion non creano rumore di pulizia.
    - Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio da parte di doctor convalida il SecretRef ma non persiste i valori del token in chiaro risolti nei metadati dell'ambiente del servizio del supervisor.
    - Doctor rileva i valori di ambiente del servizio gestiti basati su `.env`/SecretRef che installazioni precedenti di LaunchAgent, systemd o Attività pianificate di Windows avevano incorporato inline e riscrive i metadati del servizio affinché quei valori vengano caricati dalla sorgente di runtime invece che dalla definizione del supervisor.
    - Doctor rileva quando il comando del servizio blocca ancora una vecchia `--port` dopo modifiche a `gateway.port` e riscrive i metadati del servizio sulla porta corrente.
    - Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni operative.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità systemd utente su Linux, i controlli di deriva del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
    - Le riparazioni del servizio di doctor rifiutano di riscrivere, arrestare o riavviare un servizio Gateway da un binario OpenClaw precedente quando la configurazione è stata scritta l'ultima volta da una versione più recente. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + diagnostica delle porte">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non è effettivamente in esecuzione. Controlla anche le collisioni di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Procedure consigliate per il runtime Gateway">
    Doctor avvisa quando il servizio Gateway viene eseguito su Bun o su un percorso Node gestito da versione (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node, e i percorsi dei gestori di versione possono rompersi dopo gli aggiornamenti perché il servizio non carica l'inizializzazione della tua shell. Doctor propone la migrazione a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).

    I servizi appena installati o riparati mantengono radici di ambiente esplicite (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e directory user-bin stabili, ma le directory di fallback dei gestori di versione dedotte vengono scritte nel PATH del servizio solo quando esistono su disco. Questo mantiene il PATH del supervisor generato allineato allo stesso audit del PATH minimo che doctor esegue in seguito.

  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche alla configurazione e contrassegna i metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per il workspace (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup se il workspace non è già sotto git.

    Consulta [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura del workspace e al backup git (GitHub o GitLab privato consigliato).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
