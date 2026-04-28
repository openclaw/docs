---
read_when:
    - Aggiungere o modificare migrazioni doctor
    - Introdurre modifiche incompatibili alla configurazione
sidebarTitle: Doctor
summary: 'Comando doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
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

    Accetta i valori predefiniti senza chiedere conferma (inclusi passaggi di riparazione di restart/servizio/sandbox quando applicabili).

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

    Applica anche riparazioni aggressive (sovrascrive configurazioni supervisor personalizzate).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Esegue senza richieste di conferma e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti di stato su disco). Salta azioni di restart/servizio/sandbox che richiedono conferma umana. Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Esegue la scansione dei servizi di sistema per installazioni gateway aggiuntive (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se vuoi rivedere le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

<AccordionGroup>
  <Accordion title="Integrità, UI e aggiornamenti">
    - Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
    - Controllo di freschezza del protocollo UI (ricostruisce la Control UI quando lo schema del protocollo è più recente).
    - Controllo di integrità + richiesta di riavvio.
    - Riepilogo dello stato delle Skills (idonee/mancanti/bloccate) e stato dei Plugin.

  </Accordion>
  <Accordion title="Configurazione e migrazioni">
    - Normalizzazione della configurazione per valori legacy.
    - Migrazione della configurazione Talk dai vecchi campi piatti `talk.*` a `talk.provider` + `talk.providers.<provider>`.
    - Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e preparazione Chrome MCP.
    - Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
    - Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
    - Migrazione dello stato legacy su disco (sessions/agent dir/autenticazione WhatsApp).
    - Migrazione delle chiavi legacy del contratto del manifest del plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrazione del vecchio archivio Cron (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, `provider` del payload, semplici lavori fallback webhook `notify: true`).
    - Migrazione della vecchia runtime-policy dell'agente a `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`.

  </Accordion>
  <Accordion title="Stato e integrità">
    - Ispezione dei file lock di sessione e pulizia dei lock obsoleti.
    - Riparazione della trascrizione di sessione per rami duplicati di riscrittura dei prompt creati dalle build interessate 2026.4.24.
    - Controlli di integrità e permessi dello stato (sessioni, trascrizioni, directory di stato).
    - Controlli dei permessi del file di configurazione (chmod 600) quando viene eseguito localmente.
    - Integrità dell'autenticazione del modello: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati cooldown/disabilitati del profilo auth.
    - Rilevamento di directory area di lavoro extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, servizi e supervisor">
    - Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
    - Migrazione del servizio legacy e rilevamento di gateway aggiuntivi.
    - Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
    - Controlli runtime del Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
    - Avvisi sullo stato dei canali (sondati dal gateway in esecuzione).
    - Audit della configurazione supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
    - Controlli delle best practice runtime del Gateway (Node vs Bun, percorsi del version manager).
    - Diagnostica delle collisioni di porta del Gateway (predefinita `18789`).

  </Accordion>
  <Accordion title="Auth, sicurezza e abbinamento">
    - Avvisi di sicurezza per criteri DM aperti.
    - Controlli di autenticazione Gateway per la modalità token locale (offre la generazione del token quando non esiste una sorgente token; non sovrascrive le configurazioni token SecretRef).
    - Rilevamento di problemi nell'abbinamento dei dispositivi (prime richieste di abbinamento in sospeso, upgrade di ruolo/ambito in sospeso, deriva obsoleta della cache locale del token del dispositivo e deriva auth dei record abbinati).

  </Accordion>
  <Accordion title="Area di lavoro e shell">
    - Controllo linger systemd su Linux.
    - Controllo della dimensione dei file bootstrap dell'area di lavoro (avvisi di troncamento/quasi limite per i file di contesto).
    - Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
    - Controllo di preparazione del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
    - Controlli di installazione della sorgente (mismatch workspace pnpm, asset UI mancanti, binario tsx mancante).
    - Scrive configurazione aggiornata + metadati della procedura guidata.

  </Accordion>
</AccordionGroup>

## Backfill e reset Dreams UI

La scena Dreams della Control UI include azioni **Backfill**, **Reset** e **Clear Grounded** per il flusso grounded dreaming. Queste azioni usano metodi RPC in stile doctor del gateway, ma **non** fanno parte della riparazione/migrazione CLI di `openclaw doctor`.

Cosa fanno:

- **Backfill** esegue la scansione dei file storici `memory/YYYY-MM-DD.md` nell'area di lavoro attiva, esegue il passaggio grounded REM diary e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci diary di backfill contrassegnate.
- **Clear Grounded** rimuove solo voci a breve termine staged solo-grounded provenienti dal replay storico e che non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non portano automaticamente i candidati grounded nell'archivio live di promozione a breve termine a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico grounded influenzi il normale percorso di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durevoli grounded nell'archivio dreaming a breve termine mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

<AccordionGroup>
  <Accordion title="0. Aggiornamento facoltativo (installazioni git)">
    Se questo è un checkout git e doctor viene eseguito in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.
  </Accordion>
  <Accordion title="1. Normalizzazione della configurazione">
    Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema corrente.

    Questo include i vecchi campi piatti Talk. La configurazione Talk pubblica attuale è `talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` nella mappa provider.

  </Accordion>
  <Accordion title="2. Migrazioni delle chiavi di configurazione legacy">
    Quando la configurazione contiene chiavi deprecate, altri comandi si rifiutano di essere eseguiti e ti chiedono di eseguire `openclaw doctor`.

    Doctor:

    - Spiega quali chiavi legacy sono state trovate.
    - Mostra la migrazione applicata.
    - Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

    Il Gateway esegue anche automaticamente le migrazioni doctor all'avvio quando rileva un formato di configurazione legacy, così le configurazioni obsolete vengono riparate senza intervento manuale. Le migrazioni dell'archivio dei lavori Cron sono gestite da `openclaw doctor --fix`.

    Migrazioni attuali:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` di primo livello
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - vecchi `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - Per i canali con `accounts` nominati ma con valori di canale di primo livello single-account ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare un target named/default esistente corrispondente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - rimuove `browser.relayBindHost` (vecchia impostazione relay dell'estensione)

    Gli avvisi doctor includono anche indicazioni sugli account predefiniti per canali multi-account:

    - Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il fallback routing può scegliere un account inatteso.
    - Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

  </Accordion>
  <Accordion title="2b. Override del provider OpenCode">
    Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`, sovrascrive il catalogo OpenCode integrato di `@mariozechner/pi-ai`. Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così puoi rimuovere l'override e ripristinare il routing API + i costi per modello.
  </Accordion>
  <Accordion title="2c. Migrazione del browser e preparazione Chrome MCP">
    Se la tua configurazione browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza al modello corrente di collegamento host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
    - `browser.relayBindHost` viene rimosso

    Doctor esegue anche un audit del percorso host-local Chrome MCP quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

    - controlla se Google Chrome è installato sullo stesso host per i profili di connessione automatica predefiniti
    - controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
    - ricorda di abilitare il remote debugging nella pagina inspect del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

    Doctor non può abilitare per te l'impostazione lato Chrome. Il Chrome MCP host-local richiede comunque:

    - un browser basato su Chromium 144+ sull'host gateway/node
    - il browser in esecuzione localmente
    - remote debugging abilitato in quel browser
    - l'approvazione del primo prompt di consenso per l'attach nel browser

    La preparazione qui riguarda solo i prerequisiti di attach locale. Existing-session mantiene gli attuali limiti di instradamento Chrome MCP; instradamenti avanzati come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo.

    Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare CDP grezzo.

  </Accordion>
  <Accordion title="2d. Prerequisiti TLS OAuth">
    Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se il test fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato self-signed), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il test viene eseguito anche se il gateway è integro.
  </Accordion>
  <Accordion title="2e. Override del provider Codex OAuth">
    Se in precedenza hai aggiunto vecchie impostazioni di trasporto OpenAI sotto `models.providers.openai-codex`, possono fare shadowing del percorso del provider Codex OAuth integrato che le release più recenti usano automaticamente. Doctor avvisa quando vede quelle vecchie impostazioni di trasporto insieme a Codex OAuth, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e riottenere il comportamento integrato di instradamento/fallback. Proxy personalizzati e override solo-header continuano a essere supportati e non attivano questo avviso.
  </Accordion>
  <Accordion title="2f. Avvisi di instradamento del Plugin Codex">
    Quando il Plugin Codex incluso è abilitato, doctor controlla anche se i riferimenti al modello primario `openai-codex/*` si risolvono ancora tramite il runner PI predefinito. Questa combinazione è valida quando vuoi autenticazione Codex OAuth/abbonamento tramite PI, ma è facile confonderla con l'harness app-server Codex nativo. Doctor avvisa e indica la forma esplicita dell'app-server: `openai/*` più `agentRuntime.id: "codex"` oppure `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor non lo ripara automaticamente perché entrambi gli instradamenti sono validi:

    - `openai-codex/*` + PI significa "usa autenticazione Codex OAuth/abbonamento tramite il normale runner OpenClaw."
    - `openai/*` + `runtime: "codex"` significa "esegui il turno incorporato tramite l'app-server Codex nativo."
    - `/codex ...` significa "controlla o collega una conversazione Codex nativa dalla chat."
    - `/acp ...` oppure `runtime: "acp"` significa "usa l'adattatore ACP/acpx esterno."

    Se compare l'avviso, scegli l'instradamento che intendevi e modifica manualmente la configurazione. Mantieni l'avviso così com'è quando il PI Codex OAuth è intenzionale.

  </Accordion>
  <Accordion title="3. Migrazioni dello stato legacy (layout su disco)">
    Doctor può migrare i vecchi layout su disco nella struttura corrente:

    - Archivio sessioni + trascrizioni:
      - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
    - Directory agente:
      - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
    - Stato auth WhatsApp (Baileys):
      - dai vecchi `~/.openclaw/credentials/*.json` (eccetto `oauth.json`)
      - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

    Queste migrazioni sono best-effort e idempotenti; doctor emette avvisi quando lascia eventuali cartelle legacy come backup. Gateway/CLI eseguono automaticamente anche la migrazione delle vecchie sessioni + directory agente all'avvio, così cronologia/auth/modelli finiscono nel percorso per agente senza richiedere un'esecuzione manuale di doctor. L'auth WhatsApp viene intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione Talk provider/provider-map ora confronta per uguaglianza strutturale, quindi differenze solo nell'ordine delle chiavi non attivano più modifiche ripetute e senza effetto di `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrazioni legacy del manifest del plugin">
    Doctor esegue la scansione di tutti i manifest dei plugin installati per chiavi di capacità di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando le trova, offre di spostarle nell'oggetto `contracts` e di riscrivere il file manifest sul posto. Questa migrazione è idempotente; se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa senza duplicare i dati.
  </Accordion>
  <Accordion title="3b. Migrazioni legacy dell'archivio Cron">
    Doctor controlla anche l'archivio dei lavori Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita, o `cron.store` se sovrascritto) per vecchie forme di lavori che il pianificatore accetta ancora per compatibilità.

    Le pulizie Cron attuali includono:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
    - campi delivery di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery `provider` del payload → `delivery.channel` esplicito
    - semplici vecchi lavori fallback webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

    Doctor auto-migra i lavori `notify: true` solo quando può farlo senza cambiare comportamento. Se un lavoro combina il vecchio fallback notify con una modalità delivery esistente non-webhook, doctor avvisa e lascia quel lavoro alla revisione manuale.

  </Accordion>
  <Accordion title="3c. Pulizia dei lock di sessione">
    Doctor esegue la scansione di ogni directory di sessione agente per file lock di scrittura obsoleti — file lasciati quando una sessione è terminata in modo anomalo. Per ogni file lock trovato segnala: percorso, PID, se il PID è ancora vivo, età del lock e se è considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair` rimuove automaticamente i file lock obsoleti; altrimenti stampa una nota e ti chiede di rieseguire con `--fix`.
  </Accordion>
  <Accordion title="3d. Riparazione dei rami delle trascrizioni di sessione">
    Doctor esegue la scansione dei file JSONL di sessione agente per la forma di ramo duplicato creata dal bug di riscrittura della trascrizione dei prompt del 2026.4.24: un turno utente abbandonato con contesto runtime interno OpenClaw più un sibling attivo contenente lo stesso prompt utente visibile. In modalità `--fix` / `--repair`, doctor crea un backup di ogni file interessato accanto all'originale e riscrive la trascrizione sul ramo attivo così la cronologia del gateway e i lettori di memoria non vedono più turni duplicati.
  </Accordion>
  <Accordion title="4. Controlli di integrità dello stato (persistenza delle sessioni, instradamento e sicurezza)">
    La directory di stato è il tronco encefalico operativo. Se scompare, perdi sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

    Doctor controlla:

    - **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare la directory e ricorda che non può recuperare i dati mancanti.
    - **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza proprietario/gruppo).
    - **Directory di stato macOS sincronizzata nel cloud**: avvisa quando lo stato si risolve sotto iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o `~/Library/CloudStorage/...` perché i percorsi supportati dalla sincronizzazione possono causare I/O più lento e corse lock/sync.
    - **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve su una sorgente mount `mmcblk*`, perché l'I/O casuale su supporti SD o eMMC può essere più lento e usurarsi più in fretta durante scritture di sessioni e credenziali.
    - **Directory di sessione mancanti**: `sessions/` e la directory dell'archivio sessioni sono necessarie per persistere la cronologia ed evitare crash `ENOENT`.
    - **Mancata corrispondenza della trascrizione**: avvisa quando voci di sessione recenti hanno file di trascrizione mancanti.
    - **Sessione principale "JSONL a 1 riga"**: segnala quando la trascrizione principale ha una sola riga (la cronologia non si sta accumulando).
    - **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in home directory diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può dividersi tra installazioni).
    - **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo sull'host remoto (lo stato vive lì).
    - **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è leggibile da gruppo/world e offre di restringerlo a `600`.

  </Accordion>
  <Accordion title="5. Integrità auth del modello (scadenza OAuth)">
    Doctor ispeziona i profili OAuth nell'archivio auth, avvisa quando i token stanno per scadere/sono scaduti e può aggiornarli quando è sicuro. Se il profilo OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il percorso setup-token Anthropic. Le richieste di refresh compaiono solo in esecuzione interattiva (TTY); `--non-interactive` salta i tentativi di refresh.

    Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`, `invalid_grant` o un provider che ti dice di accedere di nuovo), doctor segnala che è necessaria una nuova autenticazione e stampa l'esatto comando `openclaw models auth login --provider ...` da eseguire.

    Doctor segnala anche i profili auth temporaneamente inutilizzabili a causa di:

    - cooldown brevi (rate limit/timeout/errori di autenticazione)
    - disabilitazioni più lunghe (errori di fatturazione/credito)

  </Accordion>
  <Accordion title="6. Validazione del modello per hook">
    Se `hooks.gmail.model` è impostato, doctor valida il riferimento del modello rispetto al catalogo e alla allowlist e avvisa quando non si risolve o non è consentito.
  </Accordion>
  <Accordion title="7. Riparazione dell'immagine sandbox">
    Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o passare a nomi legacy se l'immagine corrente è mancante.
  </Accordion>
  <Accordion title="7b. Dipendenze runtime dei plugin inclusi">
    Doctor verifica le dipendenze runtime solo per i plugin inclusi che sono attivi nella configurazione corrente o abilitati dal valore predefinito del loro manifest incluso, per esempio `plugins.entries.discord.enabled: true`, il vecchio `channels.discord.enabled: true`, o un provider incluso abilitato per impostazione predefinita. Se ne manca qualcuno, doctor segnala i pacchetti e li installa in modalità `openclaw doctor --fix` / `openclaw doctor --repair`. I plugin esterni continuano invece a usare `openclaw plugins install` / `openclaw plugins update`; doctor non installa dipendenze per percorsi plugin arbitrari.

    Gateway e CLI locale possono anche riparare on demand le dipendenze runtime dei plugin inclusi attivi prima di importare un plugin incluso. Queste installazioni sono delimitate alla radice di installazione runtime del plugin, vengono eseguite con script disabilitati, non scrivono un lock del pacchetto e sono protette da un lock della radice di installazione così avvii concorrenti di CLI o Gateway non mutano contemporaneamente lo stesso albero `node_modules`.

  </Accordion>
  <Accordion title="8. Migrazioni del servizio Gateway e suggerimenti di pulizia">
    Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e offre di rimuoverli e installare il servizio OpenClaw usando la porta gateway corrente. Può anche eseguire la scansione di servizi extra simili a gateway e stampare suggerimenti di pulizia. I servizi gateway OpenClaw con nome di profilo sono considerati di prima classe e non vengono segnalati come "extra".
  </Accordion>
  <Accordion title="8b. Migrazione Matrix all'avvio">
    Quando un account del canale Matrix ha una migrazione legacy dello stato in sospeso o attuabile, doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione ed esegue poi i passaggi di migrazione best-effort: migrazione legacy dello stato Matrix e preparazione legacy dello stato cifrato. Entrambi i passaggi non sono fatali; gli errori vengono registrati nei log e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo viene saltato completamente.
  </Accordion>
  <Accordion title="8c. Abbinamento del dispositivo e deriva auth">
    Doctor ora ispeziona lo stato di abbinamento del dispositivo come parte del normale passaggio di integrità.

    Cosa segnala:

    - richieste di primo abbinamento in sospeso
    - upgrade di ruolo in sospeso per dispositivi già abbinati
    - upgrade di ambito in sospeso per dispositivi già abbinati
    - riparazioni di mismatch della chiave pubblica dove l'id del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
    - record abbinati privi di un token attivo per un ruolo approvato
    - token abbinati i cui ambiti divergono dalla baseline di abbinamento approvata
    - voci locali in cache del token dispositivo per la macchina corrente che precedono una rotazione lato gateway del token o che contengono metadati di ambito obsoleti

    Doctor non approva automaticamente le richieste di abbinamento né ruota automaticamente i token dispositivo. Stampa invece i passaggi successivi esatti:

    - ispeziona le richieste in sospeso con `openclaw devices list`
    - approva la richiesta esatta con `openclaw devices approve <requestId>`
    - ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
    - rimuovi e riapprova un record obsoleto con `openclaw devices remove <deviceId>`

    Questo chiude il comune problema "già abbinato ma continua a chiedere l'abbinamento": doctor ora distingue il primo abbinamento dagli upgrade di ruolo/ambito in sospeso e dalla deriva obsoleta di token/identità del dispositivo.

  </Accordion>
  <Accordion title="9. Avvisi di sicurezza">
    Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, o quando un criterio è configurato in modo pericoloso.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se è in esecuzione come servizio utente systemd, doctor assicura che il lingering sia abilitato così il gateway resta attivo dopo il logout.
  </Accordion>
  <Accordion title="11. Stato dell'area di lavoro (Skills, Plugin e directory legacy)">
    Doctor stampa un riepilogo dello stato dell'area di lavoro per l'agente predefinito:

    - **Stato delle Skills**: conta skill idonee, con requisiti mancanti e bloccate dalla allowlist.
    - **Directory legacy dell'area di lavoro**: avvisa quando `~/openclaw` o altre directory legacy dell'area di lavoro esistono accanto all'area di lavoro corrente.
    - **Stato dei Plugin**: conta plugin abilitati/disabilitati/in errore; elenca gli ID dei plugin per eventuali errori; riporta le capacità dei plugin bundle.
    - **Avvisi di compatibilità dei Plugin**: segnala i plugin che hanno problemi di compatibilità con il runtime corrente.
    - **Diagnostica dei Plugin**: mostra eventuali avvisi o errori in fase di caricamento emessi dal registro dei plugin.

  </Accordion>
  <Accordion title="11b. Dimensione del file bootstrap">
    Doctor controlla se i file bootstrap dell'area di lavoro (per esempio `AGENTS.md`, `CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di caratteri configurato. Segnala per file i conteggi di caratteri raw vs. iniettati, la percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri iniettati come frazione del budget totale. Quando i file sono troncati o vicini al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Completamento della shell">
    Doctor controlla se il completamento tramite tabulazione è installato per la shell corrente (zsh, bash, fish o PowerShell):

    - Se il profilo shell usa uno schema di completamento dinamico lento (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce con file in cache.
    - Se il completamento è configurato nel profilo ma il file cache manca, doctor rigenera automaticamente la cache.
    - Se non è configurato alcun completamento, doctor chiede di installarlo (solo modalità interattiva; saltato con `--non-interactive`).

    Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

  </Accordion>
  <Accordion title="12. Controlli auth Gateway (token locale)">
    Doctor controlla la preparazione dell'autenticazione del token locale del gateway.

    - Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor offre di generarne uno.
    - Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo semplice.
    - `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

  </Accordion>
  <Accordion title="12b. Riparazioni in sola lettura consapevoli di SecretRef">
    Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

    - `openclaw doctor --fix` ora usa lo stesso modello riassuntivo SecretRef in sola lettura dei comandi della famiglia status per riparazioni di configurazione mirate.
    - Esempio: la riparazione `@username` di Telegram `allowFrom` / `groupAllowFrom` prova a usare le credenziali bot configurate quando disponibili.
    - Se il token del bot Telegram è configurato tramite SecretRef ma non disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta l'auto-risoluzione invece di andare in crash o segnalare erroneamente il token come mancante.

  </Accordion>
  <Accordion title="13. Controllo di integrità Gateway + riavvio">
    Doctor esegue un controllo di integrità e offre di riavviare il gateway quando sembra non in salute.
  </Accordion>
  <Accordion title="13b. Preparazione della ricerca in memoria">
    Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

    - **Backend QMD**: testa se il binario `qmd` è disponibile e avviabile. In caso contrario, stampa indicazioni di correzione, incluso il pacchetto npm e un'opzione manuale per il percorso del binario.
    - **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
    - **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia presente nell'ambiente o nell'archivio auth. Se manca, stampa suggerimenti di correzione attuabili.
    - **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

    Quando è disponibile il risultato di una sonda del gateway (il gateway era integro al momento del controllo), doctor incrocia quel risultato con la configurazione visibile dalla CLI e segnala eventuali discrepanze.

    Usa `openclaw memory status --deep` per verificare la preparazione degli embedding a runtime.

  </Accordion>
  <Accordion title="14. Avvisi sullo stato dei canali">
    Se il gateway è integro, doctor esegue una sonda dello stato dei canali e segnala gli avvisi con suggerimenti di correzione.
  </Accordion>
  <Accordion title="15. Audit + riparazione della configurazione supervisor">
    Doctor controlla la configurazione supervisor installata (launchd/systemd/schtasks) per impostazioni predefinite mancanti o obsolete (ad es. dipendenze systemd network-online e ritardo di riavvio). Quando trova una mancata corrispondenza, consiglia un aggiornamento e può riscrivere il file di servizio/task ai valori predefiniti correnti.

    Note:

    - `openclaw doctor` chiede conferma prima di riscrivere la configurazione supervisor.
    - `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
    - `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
    - `openclaw doctor --repair --force` sovrascrive configurazioni supervisor personalizzate.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantiene doctor in sola lettura per il ciclo di vita del servizio gateway. Continua comunque a segnalare l'integrità del servizio ed esegue riparazioni non relative al servizio, ma salta installazione/avvio/riavvio/bootstrap del servizio, riscritture della configurazione supervisor e pulizia dei servizi legacy perché quel ciclo di vita è gestito da un supervisor esterno.
    - Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor valida il SecretRef ma non persiste valori di token plaintext risolti nei metadati ambiente del servizio supervisor.
    - Se l'autenticazione token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
    - Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
    - Per le unità Linux user-systemd, i controlli doctor sulla deriva del token includono ora sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati auth del servizio.
    - Le riparazioni del servizio doctor si rifiutano di riscrivere, fermare o riavviare un servizio gateway da un binario OpenClaw più vecchio quando la configurazione è stata scritta per ultima da una versione più recente. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Puoi sempre forzare una riscrittura completa con `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + diagnostica della porta">
    Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il servizio è installato ma non effettivamente in esecuzione. Controlla anche collisioni di porta sulla porta del gateway (predefinita `18789`) e segnala cause probabili (gateway già in esecuzione, tunnel SSH).
  </Accordion>
  <Accordion title="17. Best practice runtime del Gateway">
    Doctor avvisa quando il servizio gateway gira su Bun o su un percorso Node gestito da un version manager (`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non carica l'init della tua shell. Doctor offre di migrare a un'installazione Node di sistema quando disponibile (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Scrittura della configurazione + metadati della procedura guidata">
    Doctor persiste eventuali modifiche di configurazione e appone metadati della procedura guidata per registrare l'esecuzione di doctor.
  </Accordion>
  <Accordion title="19. Suggerimenti per l'area di lavoro (backup + sistema di memoria)">
    Doctor suggerisce un sistema di memoria dell'area di lavoro quando manca e stampa un suggerimento di backup se l'area di lavoro non è già sotto git.

    Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla struttura dell'area di lavoro e al backup git (consigliati GitHub o GitLab privati).

  </Accordion>
</AccordionGroup>

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
