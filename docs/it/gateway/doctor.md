---
read_when:
    - Aggiungere o modificare migrazioni doctor
    - Introdurre modifiche incompatibili alla configurazione
summary: 'Comando Doctor: controlli di salute, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T08:40:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` è lo strumento di riparazione + migrazione di OpenClaw. Corregge configurazione/stato obsoleti, controlla lo stato di salute e fornisce passaggi di riparazione concreti.

## Avvio rapido

```bash
openclaw doctor
```

### Headless / automazione

```bash
openclaw doctor --yes
```

Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riavvio/servizio/riparazione sandbox quando applicabili).

```bash
openclaw doctor --repair
```

Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii quando sicuri).

```bash
openclaw doctor --repair --force
```

Applica anche riparazioni aggressive (sovrascrive configurazioni personalizzate del supervisor).

```bash
openclaw doctor --non-interactive
```

Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta azioni di riavvio/servizio/sandbox che richiedono conferma umana.
Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

```bash
openclaw doctor --deep
```

Analizza i servizi di sistema per installazioni gateway aggiuntive (launchd/systemd/schtasks).

Se vuoi rivedere le modifiche prima della scrittura, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

- Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
- Controllo di aggiornamento del protocollo UI (ricostruisce la UI di Control quando lo schema del protocollo è più recente).
- Controllo di salute + prompt di riavvio.
- Riepilogo dello stato delle Skills (idonee/mancanti/bloccate) e stato dei Plugin.
- Normalizzazione della configurazione per valori legacy.
- Migrazione della configurazione Talk dai vecchi campi flat `talk.*` in `talk.provider` + `talk.providers.<provider>`.
- Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e per la readiness di Chrome MCP.
- Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avvisi di shadowing dell'OAuth Codex (`models.providers.openai-codex`).
- Controllo dei prerequisiti TLS OAuth per i profili OAuth di OpenAI Codex.
- Migrazione dello stato legacy su disco (sessioni/dir agente/auth WhatsApp).
- Migrazione delle chiavi legacy del contratto manifest Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrazione del negozio Cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, payload `provider`, semplici processi fallback Webhook con `notify: true`).
- Ispezione dei file di lock di sessione e pulizia dei lock obsoleti.
- Controlli di integrità e permessi dello stato (sessioni, trascrizioni, directory di stato).
- Controlli dei permessi del file di configurazione (chmod 600) quando eseguito in locale.
- Stato di salute dell'autenticazione del modello: controlla la scadenza OAuth, può aggiornare i token in scadenza e segnala gli stati cooldown/disabilitato dei profili di autenticazione.
- Rilevamento di directory workspace extra (`~/openclaw`).
- Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
- Migrazione dei servizi legacy e rilevamento di gateway extra.
- Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
- Controlli runtime del Gateway (servizio installato ma non in esecuzione; label launchd in cache).
- Avvisi sullo stato dei canali (rilevati dal gateway in esecuzione).
- Audit della configurazione del supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
- Controlli delle best practice del runtime del Gateway (Node vs Bun, percorsi dei version manager).
- Diagnostica delle collisioni di porta del Gateway (predefinita `18789`).
- Avvisi di sicurezza per criteri DM aperti.
- Controlli di autenticazione del Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive configurazioni token SecretRef).
- Rilevamento dei problemi di pairing dei dispositivi (richieste di primo pairing in sospeso, upgrade ruolo/ambito in sospeso, deriva obsoleta della cache locale dei token dispositivo e deriva auth dei record associati).
- Controllo di linger systemd su Linux.
- Controllo delle dimensioni dei file bootstrap del workspace (avvisi di troncamento/quasi limite per i file di contesto).
- Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
- Controllo della readiness del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
- Controlli delle installazioni sorgente (mismatch del workspace pnpm, asset UI mancanti, binario tsx mancante).
- Scrive configurazione aggiornata + metadati della procedura guidata.

## Backfill e reset della UI Dreams

La scena Dreams della UI Control include le azioni **Backfill**, **Reset** e **Clear Grounded**
per il flusso di grounded dreaming. Queste azioni usano metodi RPC in stile
doctor del gateway, ma **non** fanno parte della riparazione/migrazione della CLI `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel workspace
  attivo, esegue il passaggio grounded REM diary e scrive voci di backfill
  reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci diary di backfill marcate.
- **Clear Grounded** rimuove solo le voci short-term staged grounded-only che
  provengono dal replay storico e che non hanno ancora accumulato richiamo live o supporto giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non portano automaticamente i candidati grounded staged nel negozio di promozione short-term live, a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico grounded influenzi il normale
percorso di promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo inserisce candidati durevoli grounded nel negozio short-term Dreaming mantenendo
`DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

### 0) Aggiornamento facoltativo (installazioni git)

Se questo è un checkout git e doctor è in esecuzione in modo interattivo, offre
di aggiornare (fetch/rebase/build) prima di eseguire doctor.

### 1) Normalizzazione della configurazione

Se la configurazione contiene forme di valori legacy (per esempio `messages.ackReaction`
senza override specifico del canale), doctor le normalizza nello schema
corrente.

Questo include i vecchi campi flat Talk. L'attuale configurazione pubblica Talk è
`talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` nella mappa provider.

### 2) Migrazioni delle chiavi di configurazione legacy

Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di essere eseguiti e chiedono
di eseguire `openclaw doctor`.

Doctor farà quanto segue:

- Spiegherà quali chiavi legacy sono state trovate.
- Mostrerà la migrazione applicata.
- Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

Il Gateway esegue automaticamente anche le migrazioni doctor all'avvio quando rileva un
formato di configurazione legacy, così le configurazioni obsolete vengono riparate senza intervento manuale.
Le migrazioni del negozio Cron sono gestite da `openclaw doctor --fix`.

Migrazioni correnti:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- vecchi `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Per i canali con `accounts` con nome ma con valori di canale top-level a singolo account ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare una destinazione con nome/predefinita già corrispondente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- rimuove `browser.relayBindHost` (impostazione legacy del relay dell'estensione)

Gli avvisi doctor includono anche indicazioni sui predefiniti account per i canali multi-account:

- Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l'instradamento di fallback può scegliere un account imprevisto.
- Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

### 2b) Override del provider OpenCode

Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
questo sovrascrive il catalogo OpenCode integrato di `@mariozechner/pi-ai`.
Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così
puoi rimuovere l'override e ripristinare instradamento API + costi per modello.

### 2c) Migrazione del browser e readiness di Chrome MCP

Se la tua configurazione browser punta ancora al percorso rimosso dell'estensione Chrome, doctor
la normalizza al modello attuale di attach Chrome MCP host-local:

- `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
- `browser.relayBindHost` viene rimosso

Doctor esegue anche un audit del percorso Chrome MCP host-local quando usi `defaultProfile:
"user"` o un profilo `existing-session` configurato:

- controlla se Google Chrome è installato sullo stesso host per i profili di auto-connect predefiniti
- controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
- ricorda di abilitare il remote debugging nella pagina inspect del browser (per
  esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor non può abilitare per te l'impostazione lato Chrome. Chrome MCP host-local
richiede comunque:

- un browser basato su Chromium 144+ sull'host gateway/node
- il browser in esecuzione localmente
- il remote debugging abilitato in quel browser
- l'approvazione del primo prompt di consenso attach nel browser

La readiness qui riguarda solo i prerequisiti di attach locale. Existing-session mantiene
gli attuali limiti di percorso di Chrome MCP; i percorsi avanzati come `responsebody`, export PDF,
intercettazione dei download e azioni batch richiedono comunque un
browser gestito o un profilo CDP raw.

Questo controllo **non** si applica a Docker, sandbox, browser remoti o altri
flussi headless. Questi continuano a usare CDP raw.

### 2d) Prerequisiti TLS OAuth

Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di
autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa
validare la catena di certificati. Se il probe fallisce con un errore di certificato (per
esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato),
doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la
correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, il probe viene eseguito
anche se il gateway è sano.

### 2c) Override del provider OAuth Codex

Se in precedenza hai aggiunto vecchie impostazioni di trasporto OpenAI sotto
`models.providers.openai-codex`, queste possono oscurare il percorso del provider
OAuth Codex integrato che le release più recenti usano automaticamente. Doctor avvisa quando rileva
quelle vecchie impostazioni di trasporto insieme a Codex OAuth così puoi rimuovere o riscrivere
l'override di trasporto obsoleto e riottenere il comportamento integrato di
instradamento/fallback. I proxy personalizzati e gli override di sole intestazioni restano supportati e non
attivano questo avviso.

### 3) Migrazioni dello stato legacy (layout su disco)

Doctor può migrare i vecchi layout su disco nella struttura attuale:

- Archivio sessioni + trascrizioni:
  - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Dir agente:
  - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Stato auth WhatsApp (Baileys):
  - dai vecchi `~/.openclaw/credentials/*.json` (eccetto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

Queste migrazioni sono best-effort e idempotenti; doctor emette avvisi quando
lascia cartelle legacy come backup. Anche il Gateway/CLI esegue la migrazione automatica di
sessioni legacy + dir agente all'avvio così cronologia/auth/modelli finiscono nel
percorso per agente senza un'esecuzione manuale di doctor. L'auth di WhatsApp viene intenzionalmente
migrata solo tramite `openclaw doctor`. La normalizzazione Talk provider/provider-map ora
confronta per uguaglianza strutturale, quindi le differenze nel solo ordine delle chiavi non attivano più
modifiche ripetute e nulle di `doctor --fix`.

### 3a) Migrazioni legacy del manifest Plugin

Doctor analizza tutti i manifest dei Plugin installati alla ricerca di chiavi
deprecated di capacità di primo livello (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts`
e di riscrivere il file manifest sul posto. Questa migrazione è idempotente;
se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa
senza duplicare i dati.

### 3b) Migrazioni legacy del negozio Cron

Doctor controlla anche il negozio dei processi Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita,
oppure `cron.store` se sovrascritto) per rilevare vecchie forme di processi che lo scheduler ancora
accetta per compatibilità.

Le attuali pulizie Cron includono:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
- campi delivery di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias di consegna `provider` nel payload → `delivery.channel` esplicito
- semplici processi fallback legacy Webhook con `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

Doctor migra automaticamente i processi `notify: true` solo quando può farlo senza
cambiare comportamento. Se un processo combina il fallback notify legacy con una
modalità di consegna non-webhook già esistente, doctor avvisa e lascia quel processo alla revisione manuale.

### 3c) Pulizia dei lock di sessione

Doctor analizza ogni directory di sessione agente alla ricerca di file di write-lock obsoleti — file lasciati
indietro quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala:
il percorso, il PID, se il PID è ancora attivo, l'età del lock e se viene
considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair`
rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e
ti istruisce a rieseguire con `--fix`.

### 4) Controlli di integrità dello stato (persistenza della sessione, instradamento e sicurezza)

La directory di stato è il tronco encefalico operativo. Se scompare, perdi
sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

Doctor controlla:

- **Directory di stato mancante**: avvisa di una perdita catastrofica dello stato, propone di ricreare
  la directory e ricorda che non può recuperare i dati mancanti.
- **Permessi della directory di stato**: verifica la scrivibilità; propone di riparare i permessi
  (ed emette un suggerimento `chown` quando viene rilevato un mismatch di proprietario/gruppo).
- **Directory di stato macOS sincronizzata su cloud**: avvisa quando lo stato viene risolto sotto iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` perché i percorsi supportati dalla sincronizzazione possono causare I/O più lenti
  e race di lock/sync.
- **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato viene risolto su una sorgente di mount `mmcblk*`,
  perché l'I/O casuale su SD o eMMC può essere più lento e usurarsi più
  rapidamente con le scritture di sessioni e credenziali.
- **Directory di sessione mancanti**: `sessions/` e la directory del negozio di sessione sono
  necessarie per mantenere la cronologia e per evitare crash `ENOENT`.
- **Mismatch delle trascrizioni**: avvisa quando voci recenti di sessione hanno
  file di trascrizione mancanti.
- **Sessione principale “1-line JSONL”**: segnala quando la trascrizione principale ha una sola
  riga (la cronologia non si sta accumulando).
- **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in diverse
  home directory o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può
  dividersi tra installazioni).
- **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo
  sull'host remoto (lo stato si trova lì).
- **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è
  leggibile da gruppo/mondo e propone di restringerlo a `600`.

### 5) Stato di salute dell'autenticazione del modello (scadenza OAuth)

Doctor ispeziona i profili OAuth nel negozio auth, avvisa quando i token stanno
per scadere/sono scaduti e può aggiornarli quando è sicuro farlo. Se il profilo
OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il
percorso setup-token Anthropic.
I prompt di refresh compaiono solo in esecuzione interattiva (TTY); `--non-interactive`
salta i tentativi di refresh.

Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`,
`invalid_grant` o un provider che ti dice di accedere di nuovo), doctor segnala
che è necessario riautenticarsi e stampa il comando esatto `openclaw models auth login --provider ...`
da eseguire.

Doctor segnala anche profili auth temporaneamente inutilizzabili a causa di:

- brevi cooldown (rate limit/timeout/fallimenti auth)
- disabilitazioni più lunghe (problemi di fatturazione/credito)

### 6) Validazione del modello Hooks

Se `hooks.gmail.model` è impostato, doctor valida il riferimento al modello rispetto al
catalogo e alla allowlist e avvisa quando non si risolve o non è consentito.

### 7) Riparazione dell'immagine sandbox

Quando il sandboxing è abilitato, doctor controlla le immagini Docker e propone di crearle o
di passare a nomi legacy se l'immagine corrente manca.

### 7b) Dipendenze runtime dei Plugin inclusi

Doctor verifica le dipendenze runtime solo per i Plugin inclusi che sono attivi nella
configurazione corrente o abilitati dal valore predefinito del loro manifest incluso, per esempio
`plugins.entries.discord.enabled: true`, il vecchio
`channels.discord.enabled: true` o un provider incluso abilitato per default. Se
ne manca qualcuno, doctor segnala i pacchetti e li installa in modalità
`openclaw doctor --fix` / `openclaw doctor --repair`. I Plugin esterni continuano a
usare `openclaw plugins install` / `openclaw plugins update`; doctor non
installa dipendenze per percorsi di Plugin arbitrari.

### 8) Migrazioni del servizio Gateway e suggerimenti di pulizia

Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e
propone di rimuoverli e installare il servizio OpenClaw usando la porta gateway
corrente. Può anche analizzare servizi aggiuntivi simili al gateway e stampare suggerimenti di pulizia.
I servizi gateway OpenClaw con nome profilo sono considerati di prima classe e non
vengono segnalati come "extra".

### 8b) Migrazione Matrix all'avvio

Quando un account del canale Matrix ha una migrazione di stato legacy in sospeso o applicabile,
doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi
esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione legacy dello stato crittografato. Entrambi i passaggi non sono fatali; gli errori vengono registrati nei log e l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo
viene completamente saltato.

### 8c) Pairing del dispositivo e deriva auth

Doctor ora ispeziona lo stato di pairing del dispositivo come parte del normale controllo di salute.

Cosa segnala:

- richieste di primo pairing in sospeso
- upgrade di ruolo in sospeso per dispositivi già associati
- upgrade di ambito in sospeso per dispositivi già associati
- riparazioni di mismatch della chiave pubblica in cui l'ID dispositivo corrisponde ancora ma l'identità del dispositivo
  non corrisponde più al record approvato
- record associati senza token attivo per un ruolo approvato
- token associati i cui ambiti divergono dalla baseline di pairing approvata
- voci locali in cache del token dispositivo per la macchina corrente che precedono una
  rotazione del token lato gateway o che contengono metadati di ambito obsoleti

Doctor non approva automaticamente le richieste di pairing né ruota automaticamente i token del dispositivo. Al contrario,
stampa i passaggi successivi esatti:

- ispezionare le richieste in sospeso con `openclaw devices list`
- approvare la richiesta esatta con `openclaw devices approve <requestId>`
- ruotare un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
- rimuovere e riapprovare un record obsoleto con `openclaw devices remove <deviceId>`

Questo chiude il comune problema “già associato ma ricevo ancora richiesta di pairing”:
ora doctor distingue il pairing iniziale dagli upgrade di ruolo/ambito
in sospeso e dalla deriva obsoleta di token/identità del dispositivo.

### 9) Avvisi di sicurezza

Doctor emette avvisi quando un provider è aperto ai DM senza una allowlist, oppure
quando un criterio è configurato in modo pericoloso.

### 10) systemd linger (Linux)

Se è in esecuzione come servizio utente systemd, doctor si assicura che il lingering sia abilitato così il
gateway resta attivo dopo il logout.

### 11) Stato del workspace (Skills, Plugin e directory legacy)

Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

- **Stato Skills**: conteggia skill idonee, con requisiti mancanti e bloccate da allowlist.
- **Directory legacy del workspace**: avvisa quando `~/openclaw` o altre directory legacy del workspace
  esistono accanto al workspace corrente.
- **Stato Plugin**: conteggia Plugin caricati/disabilitati/in errore; elenca gli ID Plugin per eventuali
  errori; segnala le capacità dei Plugin inclusi.
- **Avvisi di compatibilità dei Plugin**: segnala i Plugin che hanno problemi di compatibilità con
  il runtime corrente.
- **Diagnostica Plugin**: fa emergere eventuali avvisi o errori a tempo di caricamento emessi dal
  registro Plugin.

### 11b) Dimensione dei file bootstrap

Doctor controlla se i file bootstrap del workspace (per esempio `AGENTS.md`,
`CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget
di caratteri configurato. Segnala conteggi di caratteri raw vs injected per file, percentuale di troncamento,
causa del troncamento (`max/file` o `max/total`) e totale dei caratteri iniettati
come frazione del budget totale. Quando i file vengono troncati o sono vicini
al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completamento della shell

Doctor controlla se il completamento tramite tab è installato per la shell corrente
(zsh, bash, fish o PowerShell):

- Se il profilo shell usa un pattern di completamento dinamico lento
  (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce
  con file in cache.
- Se il completamento è configurato nel profilo ma il file cache manca,
  doctor rigenera automaticamente la cache.
- Se nessun completamento è configurato, doctor propone di installarlo
  (solo modalità interattiva; saltato con `--non-interactive`).

Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

### 12) Controlli auth del Gateway (token locale)

Doctor controlla la readiness dell'autenticazione con token locale del gateway.

- Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor propone di generarne uno.
- Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
- `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

### 12b) Riparazioni in sola lettura consapevoli di SecretRef

Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

- `openclaw doctor --fix` ora usa lo stesso modello riepilogativo di SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
- Esempio: la riparazione Telegram di `allowFrom` / `groupAllowFrom` con `@username` prova a usare le credenziali bot configurate quando disponibili.
- Se il token bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta l'autorisoluzione invece di andare in crash o di segnalare erroneamente il token come mancante.

### 13) Controllo di salute del Gateway + riavvio

Doctor esegue un controllo di salute e propone di riavviare il gateway quando
sembra non sano.

### 13b) Readiness della ricerca in memoria

Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto
per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

- **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile.
  In caso contrario, stampa indicazioni di correzione, incluso il pacchetto npm e un'opzione manuale per il percorso del binario.
- **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un
  URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
- **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia
  presente nell'ambiente o nel negozio auth. Se manca, stampa suggerimenti concreti di correzione.
- **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto nell'ordine di selezione automatica.

Quando è disponibile un risultato del probe del gateway (il gateway era sano al momento del
controllo), doctor lo confronta con la configurazione visibile dalla CLI e segnala
eventuali discrepanze.

Usa `openclaw memory status --deep` per verificare la readiness degli embedding a runtime.

### 14) Avvisi sullo stato dei canali

Se il gateway è sano, doctor esegue un probe dello stato dei canali e segnala
gli avvisi con le correzioni suggerite.

### 15) Audit + riparazione della configurazione del supervisor

Doctor controlla la configurazione del supervisor installata (launchd/systemd/schtasks) per
predefiniti mancanti o obsoleti (ad esempio dipendenze systemd network-online e
ritardo di riavvio). Quando trova una discrepanza, consiglia un aggiornamento e può
riscrivere il file di servizio/task ai valori predefiniti correnti.

Note:

- `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisor.
- `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
- `openclaw doctor --repair` applica le correzioni consigliate senza prompt.
- `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisor.
- Se l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor valida il SecretRef ma non mantiene i valori di token in chiaro risolti nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione con token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni operative.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
- Per le unità Linux user-systemd, i controlli di deriva del token in doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` nel confronto dei metadati auth del servizio.
- Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

### 16) Diagnostica del runtime + della porta del Gateway

Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il
servizio è installato ma non è effettivamente in esecuzione. Controlla anche le collisioni di porta
sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già
in esecuzione, tunnel SSH).

### 17) Best practice del runtime del Gateway

Doctor avvisa quando il servizio gateway gira su Bun o su un percorso Node gestito da version manager
(`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node,
e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non
carica l'inizializzazione della tua shell. Doctor propone di migrare a un'installazione Node di sistema quando
disponibile (Homebrew/apt/choco).

### 18) Scrittura della configurazione + metadati della procedura guidata

Doctor mantiene qualsiasi modifica alla configurazione e aggiorna i metadati della procedura guidata per registrare
l'esecuzione di doctor.

### 19) Suggerimenti per il workspace (backup + sistema di memoria)

Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup
se il workspace non è già sotto git.

Consulta [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla
struttura del workspace e al backup git (consigliati GitHub o GitLab privati).

## Correlati

- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Runbook del Gateway](/it/gateway)
