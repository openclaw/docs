---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
summary: 'Comando doctor: controlli di stato, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T08:22:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stati obsoleti, controlla lo stato e fornisce passaggi di riparazione attuabili.

## Avvio rapido

```bash
openclaw doctor
```

### Headless / automazione

```bash
openclaw doctor --yes
```

Accetta i valori predefiniti senza chiedere conferma (inclusi, quando applicabili, i passaggi di riparazione di riavvio/servizio/sandbox).

```bash
openclaw doctor --repair
```

Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii dove sicuro).

```bash
openclaw doctor --repair --force
```

Applica anche le riparazioni aggressive (sovrascrive le configurazioni personalizzate del supervisore).

```bash
openclaw doctor --non-interactive
```

Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta le azioni di riavvio/servizio/sandbox che richiedono conferma umana.
Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

```bash
openclaw doctor --deep
```

Analizza i servizi di sistema per individuare installazioni Gateway aggiuntive (launchd/systemd/schtasks).

Se vuoi rivedere le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

- Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
- Controllo di aggiornamento del protocollo UI (ricostruisce la Control UI quando lo schema del protocollo è più recente).
- Controllo di stato + prompt di riavvio.
- Riepilogo dello stato delle Skills (idonee/mancanti/bloccate) e stato dei plugin.
- Normalizzazione della configurazione per i valori legacy.
- Migrazione della configurazione Talk dai campi legacy flat `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e verifica della disponibilità di Chrome MCP.
- Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avvisi di shadowing OAuth Codex (`models.providers.openai-codex`).
- Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
- Migrazione dello stato legacy su disco (sessioni/dir agente/autenticazione WhatsApp).
- Migrazione legacy delle chiavi di contratto del manifest dei plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrazione legacy dell'archivio Cron (`jobId`, `schedule.cron`, campi top-level delivery/payload, `provider` nel payload, semplici job di fallback Webhook con `notify: true`).
- Ispezione del file di lock della sessione e pulizia dei lock obsoleti.
- Controlli di integrità e permessi dello stato (sessioni, trascrizioni, dir di stato).
- Controlli dei permessi del file di configurazione (`chmod 600`) quando eseguito in locale.
- Stato dell'autenticazione del modello: controlla la scadenza OAuth, può aggiornare i token in scadenza e segnala gli stati di cooldown/disabilitazione del profilo di autenticazione.
- Rilevamento di dir workspace aggiuntive (`~/openclaw`).
- Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
- Migrazione dei servizi legacy e rilevamento di Gateway aggiuntivi.
- Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
- Controlli runtime del Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
- Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
- Audit della configurazione del supervisore (launchd/systemd/schtasks) con riparazione facoltativa.
- Controlli delle best practice del runtime Gateway (Node vs Bun, percorsi del gestore di versioni).
- Diagnostica delle collisioni sulla porta del Gateway (predefinita `18789`).
- Avvisi di sicurezza per policy DM aperte.
- Controlli di autenticazione del Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna origine del token; non sovrascrive le configurazioni token SecretRef).
- Rilevamento dei problemi di pairing dei dispositivi (richieste iniziali di pairing in sospeso, upgrade di ruolo/ambito in sospeso, deriva obsoleta della cache locale dei token del dispositivo e deriva dell'autenticazione dei record paired).
- Controllo `linger` systemd su Linux.
- Controllo delle dimensioni del file bootstrap del workspace (avvisi di troncamento/quasi limite per i file di contesto).
- Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
- Controllo della disponibilità del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
- Controlli dell'installazione da sorgente (mismatch del workspace pnpm, risorse UI mancanti, binario tsx mancante).
- Scrive la configurazione aggiornata + i metadati della procedura guidata.

## Backfill e reset dell'interfaccia Dreams

La scena Dreams della Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded**
per il flusso di grounded dreaming. Queste azioni usano metodi RPC in stile doctor del
Gateway, ma **non** fanno parte della riparazione/migrazione della CLI `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace attivo, esegue il passaggio grounded REM diary e scrive voci di backfill reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci di diario di backfill contrassegnate.
- **Clear Grounded** rimuove solo le voci a breve termine solo-grounded in staging che provengono da replay storici e che non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono le migrazioni complete di doctor
- non mettono automaticamente in staging i candidati grounded nel live short-term promotion store, a meno che tu non esegua esplicitamente prima il percorso CLI dedicato

Se vuoi che il replay storico grounded influenzi il normale percorso di deep promotion, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in staging i candidati grounded durevoli nello short-term dreaming store mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

### 0) Aggiornamento facoltativo (installazioni git)

Se si tratta di un checkout git e doctor viene eseguito in modo interattivo, offre di aggiornare (fetch/rebase/build) prima di eseguire doctor.

### 1) Normalizzazione della configurazione

Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction` senza un override specifico del canale), doctor le normalizza nello schema corrente.

Questo include i campi flat legacy di Talk. La configurazione pubblica corrente di Talk è
`talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` nella mappa del provider.

### 2) Migrazioni delle chiavi di configurazione legacy

Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di essere eseguiti e chiedono di eseguire `openclaw doctor`.

Doctor farà quanto segue:

- Spiegare quali chiavi legacy sono state trovate.
- Mostrare la migrazione applicata.
- Riscrivere `~/.openclaw/openclaw.json` con lo schema aggiornato.

Il Gateway esegue automaticamente anche le migrazioni doctor all'avvio quando rileva un formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale.
Le migrazioni dell'archivio dei job Cron sono gestite da `openclaw doctor --fix`.

Migrazioni correnti:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` top-level
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Per i canali con `accounts` denominati ma con valori top-level del canale single-account ancora presenti, spostare quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può mantenere una destinazione denominata/predefinita esistente corrispondente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- rimuovere `browser.relayBindHost` (impostazione legacy del relay dell'estensione)

Gli avvisi di doctor includono anche indicazioni sui default account per i canali multi-account:

- Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può selezionare un account inatteso.
- Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

### 2b) Override del provider OpenCode

Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
sovrascrivono il catalogo OpenCode integrato da `@mariozechner/pi-ai`.
Questo può forzare i modelli verso l'API sbagliata o azzerare i costi. Doctor avvisa in modo che tu possa rimuovere l'override e ripristinare il routing API + i costi per modello.

### 2c) Migrazione del browser e disponibilità di Chrome MCP

Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor la normalizza all'attuale modello di attach Chrome MCP locale all'host:

- `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
- `browser.relayBindHost` viene rimosso

Doctor esegue anche un audit del percorso Chrome MCP locale all'host quando usi `defaultProfile: "user"` o un profilo `existing-session` configurato:

- controlla se Google Chrome è installato sullo stesso host per i profili di auto-connect predefiniti
- controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
- ricorda di abilitare il remote debugging nella pagina inspect del browser (per esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` o `edge://inspect/#remote-debugging`)

Doctor non può abilitare per te l'impostazione lato Chrome. Il Chrome MCP locale all'host richiede ancora:

- un browser basato su Chromium 144+ sull'host gateway/node
- il browser in esecuzione in locale
- remote debugging abilitato in quel browser
- approvare il primo prompt di consenso all'attach nel browser

Qui la disponibilità riguarda solo i prerequisiti dell'attach locale. Existing-session mantiene gli attuali limiti di routing di Chrome MCP; route avanzate come `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo raw CDP.

Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi headless. Questi continuano a usare raw CDP.

### 2d) Prerequisiti TLS OAuth

Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa validare la catena di certificati. Se il test fallisce con un errore di certificato (per esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato self-signed), doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il test viene eseguito anche se il Gateway è in buono stato.

### 2c) Override del provider OAuth Codex

Se in precedenza hai aggiunto impostazioni legacy del trasporto OpenAI sotto
`models.providers.openai-codex`, possono oscurare il percorso del provider
OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor
avvisa quando rileva queste vecchie impostazioni di trasporto insieme a Codex
OAuth, così puoi rimuovere o riscrivere l'override di trasporto obsoleto e
ripristinare il comportamento integrato di routing/fallback. I proxy
personalizzati e gli override solo-header sono ancora supportati e non attivano
questo avviso.

### 3) Migrazioni dello stato legacy (layout su disco)

Doctor può migrare layout su disco più vecchi nella struttura corrente:

- Archivio sessioni + trascrizioni:
  - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Dir dell'agente:
  - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Stato di autenticazione WhatsApp (Baileys):
  - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

Queste migrazioni sono best-effort e idempotenti; doctor emette avvisi quando
lascia cartelle legacy come backup. Anche Gateway/CLI esegue la migrazione
automatica delle sessioni legacy + della dir dell'agente all'avvio, così
cronologia/auth/modelli finiscono nel percorso per agente senza eseguire doctor
manualmente. L'autenticazione WhatsApp viene intenzionalmente migrata solo tramite
`openclaw doctor`. La normalizzazione del provider/provider-map Talk ora
confronta per uguaglianza strutturale, quindi differenze dovute solo all'ordine
delle chiavi non attivano più modifiche ripetute e prive di effetto con `doctor --fix`.

### 3a) Migrazioni legacy del manifest dei plugin

Doctor analizza tutti i manifest dei plugin installati alla ricerca di chiavi
deprecated di capacità top-level (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts`
e di riscrivere il file del manifest in-place. Questa migrazione è idempotente;
se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa
senza duplicare i dati.

### 3b) Migrazioni legacy dell'archivio Cron

Doctor controlla anche l'archivio dei job Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita,
oppure `cron.store` se sostituito) per rilevare vecchie forme di job che lo scheduler
continua ad accettare per compatibilità.

Le attuali pulizie Cron includono:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campi payload top-level (`message`, `model`, `thinking`, ...) → `payload`
- campi delivery top-level (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias di delivery `provider` nel payload → `delivery.channel` esplicito
- semplici job legacy di fallback Webhook con `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

Doctor migra automaticamente i job `notify: true` solo quando può farlo senza
cambiare comportamento. Se un job combina un fallback notify legacy con una
modalità di delivery non-webhook già esistente, doctor avvisa e lascia quel job
alla revisione manuale.

### 3c) Pulizia dei lock delle sessioni

Doctor analizza ogni directory di sessione dell'agente alla ricerca di file di
write-lock obsoleti, file lasciati indietro quando una sessione è terminata in
modo anomalo. Per ogni file di lock trovato, segnala:
il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è
considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair`
rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e
ti istruisce a rieseguire con `--fix`.

### 4) Controlli di integrità dello stato (persistenza della sessione, routing e sicurezza)

La directory di stato è il tronco encefalico operativo. Se scompare, perdi
sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

Doctor controlla:

- **Dir di stato mancante**: avvisa della perdita catastrofica dello stato, propone di ricreare
  la directory e ricorda che non può recuperare i dati mancanti.
- **Permessi della dir di stato**: verifica la scrivibilità; propone di riparare i permessi
  (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza di proprietario/gruppo).
- **Dir di stato macOS sincronizzata nel cloud**: avvisa quando lo stato risolve sotto iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) oppure
  `~/Library/CloudStorage/...` perché i percorsi supportati dalla sincronizzazione possono causare I/O più lento
  e race di lock/sync.
- **Dir di stato Linux su SD o eMMC**: avvisa quando lo stato risolve su una sorgente di mount `mmcblk*`,
  perché l'I/O casuale su SD o eMMC può essere più lento e usurarsi
  più rapidamente con scritture di sessioni e credenziali.
- **Dir di sessione mancanti**: `sessions/` e la directory dell'archivio delle sessioni sono
  necessarie per persistere la cronologia ed evitare crash `ENOENT`.
- **Mancata corrispondenza delle trascrizioni**: avvisa quando voci di sessione recenti hanno
  file di trascrizione mancanti.
- **Sessione principale “1-line JSONL”**: segnala quando la trascrizione principale ha una sola
  riga (la cronologia non si sta accumulando).
- **Più dir di stato**: avvisa quando esistono più cartelle `~/.openclaw` in
  directory home diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può
  dividersi tra installazioni).
- **Promemoria della modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo
  sull'host remoto (lo stato risiede lì).
- **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è
  leggibile da gruppo/mondo e propone di restringerlo a `600`.

### 5) Stato dell'autenticazione del modello (scadenza OAuth)

Doctor ispeziona i profili OAuth nell'archivio auth, avvisa quando i token stanno
per scadere/sono scaduti e può aggiornarli quando è sicuro. Se il profilo
OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il
percorso setup-token Anthropic.
I prompt di refresh compaiono solo in esecuzione interattiva (TTY); `--non-interactive`
salta i tentativi di refresh.

Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`,
`invalid_grant` o quando un provider ti dice di accedere di nuovo), doctor segnala
che è necessaria una nuova autenticazione e stampa l'esatto comando
`openclaw models auth login --provider ...` da eseguire.

Doctor segnala anche i profili auth temporaneamente inutilizzabili a causa di:

- cooldown brevi (rate limit/timeout/errori di autenticazione)
- disabilitazioni più lunghe (errori di fatturazione/credito)

### 6) Validazione del modello Hooks

Se `hooks.gmail.model` è impostato, doctor convalida il riferimento al modello
rispetto al catalogo e all'allowlist e avvisa quando non verrà risolto o non è consentito.

### 7) Riparazione dell'immagine sandbox

Quando il sandboxing è abilitato, doctor controlla le immagini Docker e propone di costruirle oppure
di passare ai nomi legacy se l'immagine corrente manca.

### 7b) Dipendenze runtime dei plugin bundled

Doctor verifica le dipendenze runtime solo per i plugin bundled attivi nella
configurazione corrente o abilitati dal default del manifest bundled, per esempio
`plugins.entries.discord.enabled: true`, il legacy
`channels.discord.enabled: true`, oppure un provider bundled abilitato di default. Se ne mancano alcune,
doctor segnala i pacchetti e li installa in modalità
`openclaw doctor --fix` / `openclaw doctor --repair`. I plugin esterni continuano a
usare `openclaw plugins install` / `openclaw plugins update`; doctor non
installa dipendenze per percorsi di plugin arbitrari.

### 8) Migrazioni dei servizi Gateway e suggerimenti di pulizia

Doctor rileva i servizi Gateway legacy (launchd/systemd/schtasks) e
propone di rimuoverli e installare il servizio OpenClaw usando la porta Gateway
corrente. Può anche analizzare servizi aggiuntivi simili al Gateway e stampare
suggerimenti di pulizia.
I servizi Gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono
segnalati come "extra".

### 8b) Migrazione Matrix all'avvio

Quando un account del canale Matrix ha una migrazione dello stato legacy in sospeso o attuabile,
doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi
esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione
legacy dello stato cifrato. Entrambi i passaggi non sono fatali; gli errori vengono registrati nei log
e l'avvio continua. In modalità sola lettura (`openclaw doctor` senza `--fix`) questo controllo
viene saltato completamente.

### 8c) Pairing dei dispositivi e deriva auth

Doctor ora ispeziona lo stato del pairing dei dispositivi come parte del normale passaggio di stato.

Cosa segnala:

- richieste di primo pairing in sospeso
- upgrade di ruolo in sospeso per dispositivi già paired
- upgrade di ambito in sospeso per dispositivi già paired
- riparazioni di mancata corrispondenza della chiave pubblica quando l'ID del dispositivo corrisponde ancora ma l'identità del dispositivo non corrisponde più al record approvato
- record paired senza un token attivo per un ruolo approvato
- token paired i cui ambiti divergono dalla baseline di pairing approvata
- voci locali nella cache del token del dispositivo per la macchina corrente che precedono una rotazione del token lato gateway o riportano metadati di ambito obsoleti

Doctor non approva automaticamente le richieste di pairing né ruota automaticamente i token dei dispositivi. Stampa invece i passaggi successivi esatti:

- ispeziona le richieste in sospeso con `openclaw devices list`
- approva la richiesta esatta con `openclaw devices approve <requestId>`
- ruota un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
- rimuovi e approva di nuovo un record obsoleto con `openclaw devices remove <deviceId>`

Questo chiude il comune problema "già paired ma continua a richiedere pairing":
doctor ora distingue il primo pairing dagli upgrade di ruolo/ambito in sospeso
e dalla deriva obsoleta del token/dell'identità del dispositivo.

### 9) Avvisi di sicurezza

Doctor emette avvisi quando un provider è aperto ai DM senza un'allowlist oppure
quando una policy è configurata in modo pericoloso.

### 10) systemd linger (Linux)

Se è in esecuzione come servizio utente systemd, doctor verifica che il lingering sia abilitato così il
Gateway resta attivo dopo il logout.

### 11) Stato del workspace (Skills, plugin e directory legacy)

Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

- **Stato delle Skills**: conta le Skills idonee, con requisiti mancanti e bloccate dall'allowlist.
- **Dir workspace legacy**: avvisa quando `~/openclaw` o altre directory legacy del workspace
  esistono insieme al workspace corrente.
- **Stato dei plugin**: conta i plugin caricati/disabilitati/in errore; elenca gli ID plugin per eventuali
  errori; segnala le capacità dei plugin bundled.
- **Avvisi di compatibilità dei plugin**: segnala i plugin che hanno problemi di compatibilità con
  il runtime corrente.
- **Diagnostica dei plugin**: mostra eventuali avvisi o errori in fase di caricamento emessi dal
  registro dei plugin.

### 11b) Dimensione del file bootstrap

Doctor controlla se i file bootstrap del workspace (per esempio `AGENTS.md`,
`CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget
di caratteri configurato. Segnala per file i conteggi di caratteri raw e iniettati, la percentuale di troncamento,
la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri
iniettati come frazione del budget totale. Quando i file sono troncati o vicini
al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completamento della shell

Doctor controlla se il completamento con tab è installato per la shell corrente
(zsh, bash, fish o PowerShell):

- Se il profilo della shell usa un pattern di completamento dinamico lento
  (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante
  più veloce con file in cache.
- Se il completamento è configurato nel profilo ma il file di cache manca,
  doctor rigenera automaticamente la cache.
- Se non è configurato alcun completamento, doctor propone di installarlo
  (solo in modalità interattiva; saltato con `--non-interactive`).

Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

### 12) Controlli auth del Gateway (token locale)

Doctor controlla la disponibilità dell'autenticazione con token locale del Gateway.

- Se la modalità token richiede un token e non esiste alcuna origine del token, doctor propone di generarne uno.
- Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
- `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

### 12b) Riparazioni in sola lettura consapevoli di SecretRef

Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

- `openclaw doctor --fix` ora usa lo stesso modello riassuntivo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
- Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` con `@username` prova a usare le credenziali del bot configurate quando disponibili.
- Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta la risoluzione automatica invece di andare in crash o riportare erroneamente il token come mancante.

### 13) Controllo di stato del Gateway + riavvio

Doctor esegue un controllo di stato e propone di riavviare il Gateway quando sembra
non in salute.

### 13b) Disponibilità della ricerca in memoria

Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto
per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

- **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile.
  In caso contrario, stampa indicazioni di correzione che includono il pacchetto npm e un'opzione manuale per il percorso del binario.
- **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
- **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che sia presente una chiave API
  nell'ambiente o nell'archivio auth. Se manca, stampa suggerimenti di correzione attuabili.
- **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto
  nell'ordine di selezione automatica.

Quando è disponibile un risultato del probe Gateway (il Gateway era in salute al momento del
controllo), doctor lo confronta con la configurazione visibile dalla CLI e segnala
eventuali discrepanze.

Usa `openclaw memory status --deep` per verificare la disponibilità degli embedding a runtime.

### 14) Avvisi sullo stato dei canali

Se il Gateway è in salute, doctor esegue un probe dello stato dei canali e segnala
avvisi con le correzioni suggerite.

### 15) Audit + riparazione della configurazione del supervisore

Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per
individuare valori predefiniti mancanti o obsoleti (ad esempio dipendenze systemd `network-online` e
ritardo di riavvio). Quando trova una mancata corrispondenza, raccomanda un aggiornamento e può
riscrivere il file di servizio/task con i valori predefiniti correnti.

Note:

- `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
- `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
- `openclaw doctor --repair` applica le correzioni consigliate senza prompt.
- `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisore.
- Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, doctor durante l'installazione/riparazione del servizio convalida il SecretRef ma non persiste valori di token in chiaro risolti nei metadati dell'ambiente del servizio del supervisore.
- Se l'autenticazione con token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
- Per le unità Linux user-systemd, i controlli della deriva del token di doctor ora includono sia le origini `Environment=` sia `EnvironmentFile=` quando confrontano i metadati auth del servizio.
- Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

### 16) Diagnostica del runtime + porta del Gateway

Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il
servizio è installato ma in realtà non è in esecuzione. Controlla anche eventuali collisioni
di porta sulla porta del Gateway (predefinita `18789`) e segnala le cause probabili (Gateway già
in esecuzione, tunnel SSH).

### 17) Best practice del runtime Gateway

Doctor avvisa quando il servizio Gateway è eseguito su Bun o su un percorso Node gestito da un version manager
(`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node,
e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non
carica l'inizializzazione della shell. Doctor propone di migrare a un'installazione Node di sistema quando
disponibile (Homebrew/apt/choco).

### 18) Scrittura della configurazione + metadati della procedura guidata

Doctor rende persistenti le eventuali modifiche alla configurazione e registra i metadati della procedura guidata per documentare l'esecuzione di doctor.

### 19) Suggerimenti per il workspace (backup + sistema di memoria)

Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup
se il workspace non è già sotto git.

Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla
struttura del workspace e al backup git (consigliati GitHub o GitLab privati).
