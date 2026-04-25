---
read_when:
    - Aggiunta o modifica delle migrazioni di Doctor
    - Introduzione di modifiche incompatibili alla configurazione
summary: 'Comando Doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T18:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stati obsoleti, controlla l'integrità e fornisce passaggi di riparazione attuabili.

## Avvio rapido

```bash
openclaw doctor
```

### Headless / automazione

```bash
openclaw doctor --yes
```

Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riparazione di riavvio/servizio/sandbox quando applicabili).

```bash
openclaw doctor --repair
```

Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii dove sicuro).

```bash
openclaw doctor --repair --force
```

Applica anche le riparazioni aggressive (sovrascrive le configurazioni personalizzate del supervisor).

```bash
openclaw doctor --non-interactive
```

Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta le azioni di riavvio/servizio/sandbox che richiedono conferma umana.
Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

```bash
openclaw doctor --deep
```

Analizza i servizi di sistema per installazioni Gateway aggiuntive (launchd/systemd/schtasks).

Se vuoi esaminare le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

- Aggiornamento pre-flight facoltativo per installazioni git (solo interattivo).
- Controllo di aggiornamento del protocollo UI (ricompila il Control UI quando lo schema del protocollo è più recente).
- Controllo di integrità + prompt di riavvio.
- Riepilogo dello stato di Skills (idonee/mancanti/bloccate) e stato dei plugin.
- Normalizzazione della configurazione per valori legacy.
- Migrazione della configurazione Talk dai campi legacy flat `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e prontezza di Chrome MCP.
- Avvisi di override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avvisi di shadowing OAuth di Codex (`models.providers.openai-codex`).
- Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
- Migrazione dello stato legacy su disco (sessioni/dir dell'agente/autenticazione WhatsApp).
- Migrazione della chiave legacy `contracts` del manifest Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrazione dello store Cron legacy (`jobId`, `schedule.cron`, campi top-level delivery/payload, `provider` nel payload, job di fallback Webhook semplici `notify: true`).
- Ispezione del file di lock della sessione e pulizia dei lock obsoleti.
- Controlli di integrità e permessi dello stato (sessioni, trascrizioni, dir di stato).
- Controlli dei permessi del file di configurazione (`chmod 600`) quando viene eseguito in locale.
- Integrità dell'autenticazione del modello: controlla la scadenza OAuth, può aggiornare i token in scadenza e segnala gli stati di cooldown/disabilitazione del profilo di autenticazione.
- Rilevamento di directory workspace aggiuntive (`~/openclaw`).
- Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
- Migrazione del servizio legacy e rilevamento di Gateway aggiuntivi.
- Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
- Controlli del runtime Gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
- Avvisi sullo stato dei canali (sondati dal Gateway in esecuzione).
- Audit della configurazione del supervisor (launchd/systemd/schtasks) con riparazione facoltativa.
- Controlli delle best practice del runtime Gateway (Node vs Bun, percorsi del gestore di versioni).
- Diagnostica delle collisioni di porta del Gateway (predefinita `18789`).
- Avvisi di sicurezza per policy DM aperte.
- Controlli di autenticazione del Gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna sorgente token; non sovrascrive le configurazioni token SecretRef).
- Rilevamento dei problemi di associazione del dispositivo (richieste di prima associazione in sospeso, aggiornamenti di ruolo/ambito in sospeso, drift obsoleto della cache locale del token del dispositivo e drift di autenticazione dei record associati).
- Controllo di linger systemd su Linux.
- Controllo delle dimensioni dei file bootstrap del workspace (avvisi di troncamento/quasi limite per i file di contesto).
- Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
- Controllo della prontezza del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
- Controlli dell'installazione da sorgente (mismatch del workspace pnpm, asset UI mancanti, binario tsx mancante).
- Scrive la configurazione aggiornata + i metadati del wizard.

## Backfill e reset della UI Dreams

La scena Dreams del Control UI include le azioni **Backfill**, **Reset** e **Clear Grounded**
per il flusso di grounded dreaming. Queste azioni usano metodi RPC
in stile doctor del gateway, ma **non** fanno parte della riparazione/migrazione
della CLI `openclaw doctor`.

Cosa fanno:

- **Backfill** analizza i file storici `memory/YYYY-MM-DD.md` nel
  workspace attivo, esegue il passaggio del diario REM grounded e scrive voci di backfill
  reversibili in `DREAMS.md`.
- **Reset** rimuove da `DREAMS.md` solo quelle voci del diario di backfill contrassegnate.
- **Clear Grounded** rimuove solo le voci staged grounded-only a breve termine che
  provengono dal replay storico e non hanno ancora accumulato richiamo live o supporto
  giornaliero.

Cosa **non** fanno da sole:

- non modificano `MEMORY.md`
- non eseguono migrazioni doctor complete
- non mettono automaticamente in stage i candidati grounded nello store live di
  promozione a breve termine, a meno che tu non esegua esplicitamente prima il percorso CLI staged

Se vuoi che il replay storico grounded influenzi il normale percorso di
promozione profonda, usa invece il flusso CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Questo mette in stage i candidati durevoli grounded nello store dreaming a breve termine,
mantenendo `DREAMS.md` come superficie di revisione.

## Comportamento dettagliato e motivazione

### 0) Aggiornamento facoltativo (installazioni git)

Se questa è una checkout git e doctor è in esecuzione in modalità interattiva, offre di
aggiornare (fetch/rebase/build) prima di eseguire doctor.

### 1) Normalizzazione della configurazione

Se la configurazione contiene forme di valore legacy (per esempio `messages.ackReaction`
senza un override specifico del canale), doctor le normalizza nello
schema corrente.

Questo include i campi flat legacy di Talk. L'attuale configurazione pubblica di Talk è
`talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` nella mappa del provider.

### 2) Migrazioni delle chiavi di configurazione legacy

Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di essere eseguiti e chiedono
di eseguire `openclaw doctor`.

Doctor farà quanto segue:

- Spiegherà quali chiavi legacy sono state trovate.
- Mostrerà la migrazione applicata.
- Riscriverà `~/.openclaw/openclaw.json` con lo schema aggiornato.

Il Gateway esegue automaticamente anche le migrazioni di doctor all'avvio quando rileva un
formato di configurazione legacy, quindi le configurazioni obsolete vengono riparate senza intervento manuale.
Le migrazioni dello store dei job Cron sono gestite da `openclaw doctor --fix`.

Migrazioni correnti:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` top-level
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
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Per i canali con `accounts` nominati ma con valori top-level del canale a singolo account ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare un target nominato/predefinito esistente corrispondente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- rimuove `browser.relayBindHost` (impostazione relay legacy dell'estensione)

Gli avvisi di doctor includono anche indicazioni sul predefinito dell'account per i canali multi-account:

- Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che il routing di fallback può scegliere un account inatteso.
- Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

### 2b) Override del provider OpenCode

Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`.
Può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così
puoi rimuovere l'override e ripristinare il routing API per modello + i costi.

### 2c) Migrazione del browser e prontezza di Chrome MCP

Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor
la normalizza all'attuale modello di collegamento Chrome MCP locale all'host:

- `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
- `browser.relayBindHost` viene rimosso

Doctor esegue anche un audit del percorso Chrome MCP locale all'host quando usi `defaultProfile:
"user"` o un profilo `existing-session` configurato:

- controlla se Google Chrome è installato sullo stesso host per i profili
  di connessione automatica predefiniti
- controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
- ricorda di abilitare il debug remoto nella pagina inspect del browser (per
  esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor non può abilitare per te l'impostazione lato Chrome. Il Chrome MCP locale all'host
richiede comunque:

- un browser basato su Chromium 144+ sull'host del gateway/node
- il browser in esecuzione in locale
- il debug remoto abilitato in quel browser
- l'approvazione del primo prompt di consenso per il collegamento nel browser

La prontezza qui riguarda solo i prerequisiti per il collegamento locale. Existing-session mantiene
gli attuali limiti di percorso di Chrome MCP; i percorsi avanzati come `responsebody`, l'esportazione PDF,
l'intercettazione dei download e le azioni batch richiedono ancora un browser gestito
o un profilo CDP raw.

Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri flussi
headless. Questi continuano a usare CDP raw.

### 2d) Prerequisiti TLS OAuth

Quando è configurato un profilo OAuth OpenAI Codex, doctor esegue un probe dell'endpoint di
autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa
convalidare la catena di certificati. Se il probe fallisce con un errore di certificato (per
esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o certificato autofirmato),
doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la
correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il probe viene eseguito
anche se il gateway è integro.

### 2c) Override del provider OAuth Codex

Se in precedenza hai aggiunto impostazioni legacy del trasporto OpenAI sotto
`models.providers.openai-codex`, possono nascondere il percorso del provider
OAuth Codex integrato che le versioni più recenti usano automaticamente. Doctor avvisa quando vede
quelle vecchie impostazioni di trasporto insieme a Codex OAuth così puoi rimuovere o riscrivere
l'override di trasporto obsoleto e riottenere il comportamento integrato di routing/fallback.
I proxy personalizzati e gli override solo-header sono ancora supportati e non
attivano questo avviso.

### 3) Migrazioni dello stato legacy (layout su disco)

Doctor può migrare layout su disco più vecchi nella struttura attuale:

- Store delle sessioni + trascrizioni:
  - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directory dell'agente:
  - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Stato di autenticazione WhatsApp (Baileys):
  - dai legacy `~/.openclaw/credentials/*.json` (eccetto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando
lascia eventuali cartelle legacy come backup. Anche il Gateway/CLI esegue automaticamente la migrazione
delle sessioni legacy + della directory agente all'avvio così cronologia/autenticazione/modelli finiscono nel
percorso per agente senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene intenzionalmente
migrata solo tramite `openclaw doctor`. La normalizzazione di provider/provider-map di Talk ora
confronta per uguaglianza strutturale, quindi le differenze dovute solo all'ordine delle chiavi non attivano più
modifiche ripetute e senza effetto di `doctor --fix`.

### 3a) Migrazioni legacy del manifest Plugin

Doctor analizza tutti i manifest Plugin installati alla ricerca di chiavi di capacità top-level
deprecate (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando trovate, offre di spostarle nell'oggetto `contracts`
e riscrivere il file del manifest sul posto. Questa migrazione è idempotente;
se la chiave `contracts` ha già gli stessi valori, la chiave legacy viene rimossa
senza duplicare i dati.

### 3b) Migrazioni legacy dello store Cron

Doctor controlla anche lo store dei job Cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita,
o `cron.store` quando sovrascritto) per individuare vecchie forme di job che lo scheduler continua
ad accettare per compatibilità.

Le attuali pulizie di Cron includono:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campi payload top-level (`message`, `model`, `thinking`, ...) → `payload`
- campi delivery top-level (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias di delivery `provider` nel payload → `delivery.channel` esplicito
- semplici job legacy di fallback Webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

Doctor migra automaticamente i job `notify: true` solo quando può farlo senza
cambiare il comportamento. Se un job combina un fallback notify legacy con una modalità
delivery non-webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

### 3c) Pulizia dei lock di sessione

Doctor analizza ogni directory delle sessioni dell'agente alla ricerca di file di write-lock obsoleti — file lasciati
indietro quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala:
il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è
considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair`
rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e
ti indica di rieseguire con `--fix`.

### 4) Controlli di integrità dello stato (persistenza della sessione, routing e sicurezza)

La directory di stato è il tronco encefalico operativo. Se scompare, perdi
sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

Doctor controlla:

- **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare
  la directory e ricorda che non può recuperare i dati mancanti.
- **Permessi della directory di stato**: verifica la scrivibilità; offre di riparare i permessi
  (ed emette un suggerimento `chown` quando rileva una mancata corrispondenza di proprietario/gruppo).
- **Directory di stato macOS sincronizzata nel cloud**: avvisa quando lo stato si risolve sotto iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` perché i percorsi supportati dalla sincronizzazione possono causare I/O più lento
  e race condition di lock/sincronizzazione.
- **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente
  di mount `mmcblk*`, perché l'I/O casuale supportato da SD o eMMC può essere più lento e usurarsi
  più rapidamente con le scritture di sessione e credenziali.
- **Directory delle sessioni mancanti**: `sessions/` e la directory dello store delle sessioni sono
  necessarie per mantenere la cronologia ed evitare crash `ENOENT`.
- **Mancata corrispondenza delle trascrizioni**: avvisa quando voci di sessione recenti hanno file
  di trascrizione mancanti.
- **Sessione principale “JSONL a 1 riga”**: segnala quando la trascrizione principale ha una sola
  riga (la cronologia non si sta accumulando).
- **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in diverse
  directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può
  dividersi tra installazioni).
- **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo
  sull'host remoto (lo stato si trova lì).
- **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è
  leggibile da gruppo/mondo e offre di restringerlo a `600`.

### 5) Integrità dell'autenticazione del modello (scadenza OAuth)

Doctor ispeziona i profili OAuth nello store di autenticazione, avvisa quando i token stanno
per scadere/sono scaduti e può aggiornarli quando è sicuro. Se il profilo
OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il
percorso del setup-token Anthropic.
I prompt di refresh compaiono solo in esecuzione interattiva (TTY); `--non-interactive`
salta i tentativi di refresh.

Quando un refresh OAuth fallisce in modo permanente (per esempio `refresh_token_reused`,
`invalid_grant` o un provider che ti dice di accedere di nuovo), doctor segnala
che è necessaria una nuova autenticazione e stampa l'esatto comando `openclaw models auth login --provider ...`
da eseguire.

Doctor segnala anche i profili di autenticazione temporaneamente inutilizzabili a causa di:

- cooldown brevi (rate limit/timeout/guasti di autenticazione)
- disabilitazioni più lunghe (guasti di fatturazione/credito)

### 6) Convalida del modello degli hook

Se `hooks.gmail.model` è impostato, doctor convalida il riferimento del modello rispetto al
catalogo e alla allowlist e avvisa quando non verrà risolto o non è consentito.

### 7) Riparazione dell'immagine sandbox

Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di creare o
passare a nomi legacy se l'immagine corrente manca.

### 7b) Dipendenze runtime dei plugin integrati

Doctor verifica le dipendenze runtime solo per i plugin integrati attivi nella
configurazione corrente o abilitati dal valore predefinito del loro manifest integrato, per esempio
`plugins.entries.discord.enabled: true`, il legacy
`channels.discord.enabled: true` o un provider integrato abilitato per impostazione predefinita. Se ne manca
qualcuna, doctor segnala i pacchetti e li installa in modalità
`openclaw doctor --fix` / `openclaw doctor --repair`. I plugin esterni continuano a
usare `openclaw plugins install` / `openclaw plugins update`; doctor non
installa dipendenze per percorsi Plugin arbitrari.

Anche il Gateway e la CLI locale possono riparare su richiesta le dipendenze runtime dei plugin integrati attivi
prima di importare un plugin integrato. Queste installazioni sono
limitate alla radice di installazione runtime del plugin, vengono eseguite con gli script disabilitati, non
scrivono un lock package e sono protette da un lock della radice di installazione così che avvii
contemporanei di CLI o Gateway non modifichino lo stesso albero `node_modules` nello stesso momento.

### 8) Migrazioni del servizio Gateway e suggerimenti di pulizia

Doctor rileva i servizi Gateway legacy (launchd/systemd/schtasks) e
offre di rimuoverli e installare il servizio OpenClaw usando la porta Gateway
corrente. Può anche analizzare la presenza di servizi aggiuntivi simili a Gateway e stampare suggerimenti di pulizia.
I servizi Gateway OpenClaw con nome di profilo sono considerati di prima classe e non
vengono segnalati come "aggiuntivi".

### 8b) Migrazione Matrix all'avvio

Quando un account del canale Matrix ha una migrazione di stato legacy in sospeso o attuabile,
doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi
esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione
dello stato legacy cifrato. Entrambi i passaggi non sono fatali; gli errori vengono registrati e
l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo
viene saltato completamente.

### 8c) Associazione del dispositivo e drift di autenticazione

Doctor ora ispeziona lo stato di associazione del dispositivo come parte del normale controllo di integrità.

Cosa segnala:

- richieste di prima associazione in sospeso
- aggiornamenti di ruolo in sospeso per dispositivi già associati
- aggiornamenti di ambito in sospeso per dispositivi già associati
- riparazioni di mancata corrispondenza della chiave pubblica in cui l'ID del dispositivo corrisponde ancora ma
  l'identità del dispositivo non corrisponde più al record approvato
- record associati a cui manca un token attivo per un ruolo approvato
- token associati i cui ambiti divergono dalla baseline di associazione approvata
- voci locali in cache del token del dispositivo per la macchina corrente che precedono una
  rotazione del token lato gateway o portano metadati di ambito obsoleti

Doctor non approva automaticamente le richieste di associazione né ruota automaticamente i token del dispositivo. Invece
stampa gli esatti passaggi successivi:

- ispezionare le richieste in sospeso con `openclaw devices list`
- approvare la richiesta esatta con `openclaw devices approve <requestId>`
- ruotare un token nuovo con `openclaw devices rotate --device <deviceId> --role <role>`
- rimuovere e riapprovare un record obsoleto con `openclaw devices remove <deviceId>`

Questo chiude il comune problema "già associato ma ricevo ancora pairing required":
doctor ora distingue la prima associazione dagli aggiornamenti in sospeso di ruolo/ambito
e dal drift obsoleto del token/dell'identità del dispositivo.

### 9) Avvisi di sicurezza

Doctor emette avvisi quando un provider è aperto ai DM senza una allowlist, oppure
quando una policy è configurata in modo pericoloso.

### 10) Linger systemd (Linux)

Se è in esecuzione come servizio utente systemd, doctor assicura che il lingering sia abilitato così il
gateway resta attivo dopo il logout.

### 11) Stato del workspace (Skills, plugin e directory legacy)

Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

- **Stato di Skills**: conta le Skills idonee, con requisiti mancanti e bloccate dalla allowlist.
- **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy
  esistono accanto al workspace corrente.
- **Stato dei plugin**: conta plugin abilitati/disabilitati/in errore; elenca gli ID dei plugin per eventuali
  errori; segnala le capacità dei plugin integrati.
- **Avvisi di compatibilità dei plugin**: segnala i plugin che hanno problemi di compatibilità con
  il runtime corrente.
- **Diagnostica dei plugin**: mostra eventuali avvisi o errori in fase di caricamento emessi dal
  registro dei plugin.

### 11b) Dimensione del file bootstrap

Doctor controlla se i file bootstrap del workspace (per esempio `AGENTS.md`,
`CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget
di caratteri configurato. Segnala per file il conteggio dei caratteri raw rispetto a quelli iniettati, la
percentuale di troncamento, la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri
iniettati come frazione del budget totale. Quando i file sono troncati o vicini
al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completamento della shell

Doctor controlla se il completamento tramite tab è installato per la shell corrente
(zsh, bash, fish o PowerShell):

- Se il profilo della shell usa un pattern di completamento dinamico lento
  (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante
  con file in cache più veloce.
- Se il completamento è configurato nel profilo ma il file di cache manca,
  doctor rigenera automaticamente la cache.
- Se non è configurato alcun completamento, doctor chiede di installarlo
  (solo in modalità interattiva; saltato con `--non-interactive`).

Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

### 12) Controlli di autenticazione del Gateway (token locale)

Doctor controlla la prontezza dell'autenticazione del token del gateway locale.

- Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor offre di generarne uno.
- Se `gateway.auth.token` è gestito da SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
- `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

### 12b) Riparazioni in sola lettura consapevoli di SecretRef

Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento fail-fast del runtime.

- `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
- Esempio: la riparazione Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali del bot configurate quando disponibili.
- Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta la risoluzione automatica invece di andare in crash o segnalare erroneamente il token come mancante.

### 13) Controllo di integrità del Gateway + riavvio

Doctor esegue un controllo di integrità e offre di riavviare il gateway quando sembra
non integro.

### 13b) Prontezza della ricerca in memoria

Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto
per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

- **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile.
  In caso contrario, stampa indicazioni di correzione, incluso il pacchetto npm e un'opzione manuale per il percorso del binario.
- **Provider locale esplicito**: controlla la presenza di un file di modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
- **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia
  presente nell'ambiente o nello store di autenticazione. Se manca, stampa suggerimenti di correzione attuabili.
- **Provider automatico**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto
  nell'ordine di selezione automatica.

Quando è disponibile il risultato di un probe del gateway (il gateway era integro al momento del
controllo), doctor lo confronta con la configurazione visibile dalla CLI e segnala
qualsiasi discrepanza.

Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

### 14) Avvisi sullo stato dei canali

Se il gateway è integro, doctor esegue un probe dello stato dei canali e segnala
gli avvisi con le correzioni suggerite.

### 15) Audit + riparazione della configurazione del supervisor

Doctor controlla la configurazione del supervisor installata (launchd/systemd/schtasks) per
valori predefiniti mancanti o obsoleti (ad es. dipendenze systemd `network-online` e
ritardo di riavvio). Quando trova una mancata corrispondenza, raccomanda un aggiornamento e può
riscrivere il file del servizio/task con i valori predefiniti correnti.

Note:

- `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisor.
- `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
- `openclaw doctor --repair` applica le correzioni consigliate senza prompt.
- `openclaw doctor --repair --force` sovrascrive le configurazioni personalizzate del supervisor.
- Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida il SecretRef ma non mantiene i valori del token risolti in chiaro nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni attuabili.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca l'installazione/riparazione finché la modalità non viene impostata esplicitamente.
- Per le unità Linux user-systemd, i controlli di drift del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
- Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

### 16) Runtime del Gateway + diagnostica della porta

Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il
servizio è installato ma non è effettivamente in esecuzione. Controlla anche le collisioni di porta
sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già
in esecuzione, tunnel SSH).

### 17) Best practice del runtime del Gateway

Doctor avvisa quando il servizio gateway è in esecuzione su Bun o su un percorso Node gestito da un version manager
(`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node,
e i percorsi del version manager possono rompersi dopo gli aggiornamenti perché il servizio non
carica l'inizializzazione della shell. Doctor offre di migrare a un'installazione Node di sistema quando
disponibile (Homebrew/apt/choco).

### 18) Scrittura della configurazione + metadati del wizard

Doctor mantiene eventuali modifiche alla configurazione e registra i metadati del wizard per
annotare l'esecuzione di doctor.

### 19) Suggerimenti per il workspace (backup + sistema di memoria)

Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup
se il workspace non è già sotto git.

Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla
struttura del workspace e al backup git (consigliati GitHub o GitLab privati).

## Correlati

- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Runbook del Gateway](/it/gateway)
