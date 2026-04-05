---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
summary: 'Comando Doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T13:52:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazioni/stati obsoleti,
controlla l'integrità e fornisce passaggi di riparazione utilizzabili.

## Avvio rapido

```bash
openclaw doctor
```

### Headless / automazione

```bash
openclaw doctor --yes
```

Accetta i valori predefiniti senza chiedere conferma (inclusi i passaggi di riparazione per riavvio/servizio/sandbox quando applicabili).

```bash
openclaw doctor --repair
```

Applica le riparazioni consigliate senza chiedere conferma (riparazioni + riavvii dove sicuro).

```bash
openclaw doctor --repair --force
```

Applica anche riparazioni aggressive (sovrascrive configurazioni personalizzate del supervisor).

```bash
openclaw doctor --non-interactive
```

Esegue senza prompt e applica solo migrazioni sicure (normalizzazione della configurazione + spostamenti di stato su disco). Salta le azioni su riavvio/servizio/sandbox che richiedono conferma umana.
Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

```bash
openclaw doctor --deep
```

Analizza i servizi di sistema per installazioni gateway aggiuntive (launchd/systemd/schtasks).

Se vuoi rivedere le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

- Aggiornamento preliminare opzionale per installazioni git (solo interattivo).
- Controllo della freschezza del protocollo UI (ricompila la Control UI quando lo schema del protocollo è più recente).
- Controllo di integrità + prompt di riavvio.
- Riepilogo dello stato delle Skills (idonee/mancanti/bloccate) e stato dei plugin.
- Normalizzazione della configurazione per valori legacy.
- Migrazione della configurazione Talk dai campi legacy flat `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Controlli di migrazione browser per configurazioni legacy dell'estensione Chrome e disponibilità di Chrome MCP.
- Avvisi sugli override del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Controllo dei prerequisiti TLS OAuth per i profili OAuth OpenAI Codex.
- Migrazione legacy dello stato su disco (sessions/agent dir/autenticazione WhatsApp).
- Migrazione delle chiavi di contratto legacy del manifest dei plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrazione del cron store legacy (`jobId`, `schedule.cron`, campi di delivery/payload di livello superiore, `provider` del payload, job di fallback webhook semplici `notify: true`).
- Ispezione dei file di lock di sessione e pulizia dei lock obsoleti.
- Controlli di integrità e permessi dello stato (sessions, trascrizioni, directory di stato).
- Controlli dei permessi del file di configurazione (`chmod 600`) quando eseguito localmente.
- Integrità dell'autenticazione dei modelli: controlla la scadenza OAuth, può aggiornare token in scadenza e segnala stati di cooldown/disabilitazione dei profili di autenticazione.
- Rilevamento di directory workspace aggiuntive (`~/openclaw`).
- Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
- Migrazione dei servizi legacy e rilevamento di gateway aggiuntivi.
- Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
- Controlli runtime del gateway (servizio installato ma non in esecuzione; etichetta launchd in cache).
- Avvisi sullo stato dei canali (sondati dal gateway in esecuzione).
- Audit della configurazione del supervisor (launchd/systemd/schtasks) con riparazione opzionale.
- Controlli delle best practice runtime del gateway (Node vs Bun, percorsi di version manager).
- Diagnostica dei conflitti di porta del gateway (predefinita `18789`).
- Avvisi di sicurezza per policy DM aperte.
- Controlli di autenticazione del gateway per la modalità token locale (offre la generazione del token quando non esiste una sorgente token; non sovrascrive configurazioni token SecretRef).
- Controllo di linger systemd su Linux.
- Controllo della dimensione dei file bootstrap del workspace (avvisi di troncamento/quasi limite per i file di contesto).
- Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
- Controllo della disponibilità del provider embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
- Controlli dell'installazione da sorgente (mismatch del workspace pnpm, asset UI mancanti, binario tsx mancante).
- Scrive la configurazione aggiornata + i metadati del wizard.

## Comportamento dettagliato e motivazione

### 0) Aggiornamento opzionale (installazioni git)

Se si tratta di un checkout git e doctor è in esecuzione in modo interattivo, propone
di aggiornare (fetch/rebase/build) prima di eseguire doctor.

### 1) Normalizzazione della configurazione

Se la configurazione contiene forme di valori legacy (ad esempio `messages.ackReaction`
senza un override specifico del canale), doctor le normalizza nello schema
corrente.

Questo include i campi flat legacy di Talk. La configurazione pubblica attuale di Talk è
`talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` nella mappa provider.

### 2) Migrazioni delle chiavi di configurazione legacy

Quando la configurazione contiene chiavi deprecate, gli altri comandi si rifiutano di essere eseguiti e chiedono
di eseguire `openclaw doctor`.

Doctor:

- Spiega quali chiavi legacy sono state trovate.
- Mostra la migrazione applicata.
- Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

Il Gateway esegue anche automaticamente le migrazioni doctor all'avvio quando rileva un
formato di configurazione legacy, così le configurazioni obsolete vengono riparate senza intervento manuale.
Le migrazioni del cron job store sono gestite da `openclaw doctor --fix`.

Migrazioni attuali:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` di livello superiore
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
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
- Per i canali con `accounts` nominati ma con valori di canale top-level single-account ancora presenti, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può preservare un target nominato/predefinito esistente corrispondente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- rimuove `browser.relayBindHost` (impostazione legacy del relay dell'estensione)

Gli avvisi di doctor includono anche indicazioni sui valori predefiniti degli account per i canali multi-account:

- Se due o più voci `channels.<channel>.accounts` sono configurate senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l'instradamento di fallback può scegliere un account imprevisto.
- Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

### 2b) Override del provider OpenCode

Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`.
Può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così
puoi rimuovere l'override e ripristinare l'instradamento API + i costi per modello.

### 2c) Migrazione del browser e disponibilità di Chrome MCP

Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor
la normalizza all'attuale modello di attach Chrome MCP host-local:

- `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
- `browser.relayBindHost` viene rimosso

Doctor esegue anche l'audit del percorso Chrome MCP host-local quando usi `defaultProfile:
"user"` o un profilo `existing-session` configurato:

- controlla se Google Chrome è installato sullo stesso host per i profili di
  connessione automatica predefiniti
- controlla la versione di Chrome rilevata e avvisa quando è inferiore a Chrome 144
- ricorda di abilitare il remote debugging nella pagina inspect del browser (ad
  esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor non può abilitare per te l'impostazione lato Chrome. Chrome MCP host-local
richiede ancora:

- un browser basato su Chromium 144+ sull'host gateway/nodo
- il browser in esecuzione localmente
- remote debugging abilitato in quel browser
- approvare il primo prompt di consenso attach nel browser

La disponibilità qui riguarda solo i prerequisiti di attach locale. Existing-session mantiene
gli attuali limiti di instradamento di Chrome MCP; route avanzate come `responsebody`, esportazione PDF,
intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw.

Questo controllo **non** si applica a Docker, sandbox, remote-browser o altri
flussi headless. Questi continuano a usare CDP raw.

### 2d) Prerequisiti TLS OAuth

Quando è configurato un profilo OAuth OpenAI Codex, doctor sonda l'endpoint di
autorizzazione OpenAI per verificare che lo stack TLS Node/OpenSSL locale possa
validare la catena di certificati. Se la sonda fallisce con un errore di certificato (ad
esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o autofirmato),
doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la
correzione di solito è `brew postinstall ca-certificates`. Con `--deep`, la sonda viene eseguita
anche se il gateway è integro.

### 3) Migrazioni dello stato legacy (layout disco)

Doctor può migrare layout su disco più vecchi nella struttura attuale:

- Sessions store + trascrizioni:
  - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directory agent:
  - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Stato di autenticazione WhatsApp (Baileys):
  - da `~/.openclaw/credentials/*.json` legacy (eccetto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

Queste migrazioni sono best-effort e idempotenti; doctor emetterà avvisi quando
lascia cartelle legacy come backup. Gateway/CLI migrano anche automaticamente
sessions + agent dir legacy all'avvio, così cronologia/autenticazione/modelli finiscono nel
percorso per agente senza eseguire manualmente doctor. L'autenticazione WhatsApp è intenzionalmente
migrata solo tramite `openclaw doctor`. La normalizzazione della mappa provider/provider di Talk ora
confronta per uguaglianza strutturale, quindi differenze dovute solo all'ordine delle chiavi non attivano più
modifiche ripetute e inutili con `doctor --fix`.

### 3a) Migrazioni legacy del manifest dei plugin

Doctor analizza tutti i manifest dei plugin installati alla ricerca di chiavi di capacità
top-level deprecate (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando le trova, propone di spostarle nell'oggetto `contracts`
e di riscrivere il file manifest sul posto. Questa migrazione è idempotente;
se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa
senza duplicare i dati.

### 3b) Migrazioni legacy del cron store

Doctor controlla anche il cron job store (`~/.openclaw/cron/jobs.json` per impostazione predefinita,
o `cron.store` se sovrascritto) per vecchie forme di job che lo scheduler continua ad accettare per compatibilità.

Le pulizie cron correnti includono:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campi top-level del payload (`message`, `model`, `thinking`, ...) → `payload`
- campi top-level di delivery (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias di delivery `provider` del payload → `delivery.channel` esplicito
- semplici job legacy di fallback webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

Doctor migra automaticamente i job `notify: true` solo quando può farlo senza
cambiare il comportamento. Se un job combina il fallback notify legacy con una
modalità di delivery non webhook già esistente, doctor avvisa e lascia quel job per revisione manuale.

### 3c) Pulizia dei lock di sessione

Doctor analizza ogni directory sessione agente alla ricerca di file di write-lock obsoleti — file lasciati
indietro quando una sessione è terminata in modo anomalo. Per ogni file di lock trovato segnala:
il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è
considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair`
rimuove automaticamente i file di lock obsoleti; altrimenti stampa una nota e
ti chiede di rieseguire con `--fix`.

### 4) Controlli di integrità dello stato (persistenza della sessione, instradamento e sicurezza)

La directory di stato è il tronco encefalico operativo. Se scompare, perdi
sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

Doctor controlla:

- **Directory di stato mancante**: avvisa della perdita catastrofica dello stato, propone di ricreare
  la directory e ricorda che non può recuperare i dati mancanti.
- **Permessi della directory di stato**: verifica la scrivibilità; propone di riparare i permessi
  (e mostra un suggerimento `chown` quando viene rilevato un mismatch di proprietario/gruppo).
- **Directory di stato macOS sincronizzata su cloud**: avvisa quando lo stato si risolve sotto iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` perché i percorsi supportati dalla sincronizzazione possono causare I/O più lento
  e race di lock/sync.
- **Directory di stato Linux su SD o eMMC**: avvisa quando lo stato si risolve in una sorgente di mount `mmcblk*`,
  perché l'I/O casuale su SD o eMMC può essere più lento e consumarsi
  più velocemente con scritture di sessioni e credenziali.
- **Directory sessions mancanti**: `sessions/` e la directory del session store sono
  necessarie per persistere la cronologia ed evitare crash `ENOENT`.
- **Mismatch delle trascrizioni**: avvisa quando voci di sessione recenti hanno
  file di trascrizione mancanti.
- **Sessione principale “JSONL a 1 riga”**: segnala quando la trascrizione principale ha una sola
  riga (la cronologia non si sta accumulando).
- **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in
  home directory diverse o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può
  dividersi tra installazioni).
- **Promemoria modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo
  sull'host remoto (lo stato vive lì).
- **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è
  leggibile da gruppo/tutti e propone di restringerlo a `600`.

### 5) Integrità dell'autenticazione dei modelli (scadenza OAuth)

Doctor ispeziona i profili OAuth nell'archivio di autenticazione, avvisa quando i token
stanno per scadere/sono scaduti e può aggiornarli quando è sicuro. Se il profilo
OAuth/token Anthropic è obsoleto, suggerisce di migrare a Claude CLI o a una
chiave API Anthropic.
I prompt di refresh compaiono solo in esecuzione interattiva (TTY); `--non-interactive`
salta i tentativi di refresh.

Doctor segnala anche profili di autenticazione temporaneamente inutilizzabili a causa di:

- cooldown brevi (rate limit/timeout/errori di autenticazione)
- disabilitazioni più lunghe (errori di fatturazione/credito)

### 6) Validazione del modello per gli hook

Se `hooks.gmail.model` è impostato, doctor valida il riferimento del modello rispetto al
catalogo e all'allowlist e avvisa quando non verrà risolto o non è consentito.

### 7) Riparazione dell'immagine sandbox

Quando il sandboxing è abilitato, doctor controlla le immagini Docker e propone di compilare o
passare ai nomi legacy se l'immagine attuale è mancante.

### 7b) Dipendenze runtime dei plugin inclusi

Doctor verifica che le dipendenze runtime dei plugin inclusi (ad esempio i
pacchetti runtime del plugin Discord) siano presenti nella root di installazione di OpenClaw.
Se ne manca qualcuna, doctor segnala i pacchetti e li installa in
modalità `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrazioni dei servizi gateway e suggerimenti di pulizia

Doctor rileva i servizi gateway legacy (launchd/systemd/schtasks) e
propone di rimuoverli e installare il servizio OpenClaw usando la porta gateway
corrente. Può anche cercare servizi aggiuntivi simili a gateway e stampare suggerimenti di pulizia.
I servizi gateway OpenClaw con nome profilo sono considerati di prima classe e non vengono
segnalati come "aggiuntivi".

### 8b) Migrazione Matrix all'avvio

Quando un account del canale Matrix ha una migrazione di stato legacy in sospeso o applicabile,
doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e poi
esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione
legacy dello stato cifrato. Entrambi i passaggi non sono fatali; gli errori vengono registrati e
l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo
viene saltato completamente.

### 9) Avvisi di sicurezza

Doctor emette avvisi quando un provider è aperto ai DM senza allowlist, oppure
quando una policy è configurata in modo pericoloso.

### 10) Linger systemd (Linux)

Se è in esecuzione come servizio utente systemd, doctor assicura che linger sia abilitato in modo che il
gateway resti attivo dopo il logout.

### 11) Stato del workspace (Skills, plugin e directory legacy)

Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

- **Stato delle Skills**: conta le Skills idonee, con requisiti mancanti e bloccate da allowlist.
- **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy
  esistono insieme al workspace corrente.
- **Stato dei plugin**: conta plugin caricati/disabilitati/in errore; elenca gli ID dei plugin per eventuali
  errori; segnala le capacità dei bundle plugin.
- **Avvisi di compatibilità dei plugin**: segnala i plugin che hanno problemi di compatibilità con
  il runtime corrente.
- **Diagnostica dei plugin**: mostra eventuali avvisi o errori in fase di caricamento emessi dal
  registro dei plugin.

### 11b) Dimensione dei file bootstrap

Doctor controlla se i file bootstrap del workspace (ad esempio `AGENTS.md`,
`CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget
di caratteri configurato. Riporta, per file, il numero di caratteri raw rispetto a quelli iniettati, la percentuale di
troncamento, la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri iniettati
come frazione del budget totale. Quando i file sono troncati o vicini
al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completamento della shell

Doctor controlla se il completamento tab è installato per la shell corrente
(zsh, bash, fish o PowerShell):

- Se il profilo shell usa un pattern di completamento dinamico lento
  (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante
  più veloce con file in cache.
- Se il completamento è configurato nel profilo ma il file cache è mancante,
  doctor rigenera automaticamente la cache.
- Se non è configurato alcun completamento, doctor propone di installarlo
  (solo modalità interattiva; saltato con `--non-interactive`).

Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

### 12) Controlli di autenticazione del gateway (token locale)

Doctor controlla la disponibilità dell'autenticazione token del gateway locale.

- Se la modalità token richiede un token e non esiste alcuna sorgente token, doctor propone di generarne uno.
- Se `gateway.auth.token` è gestito come SecretRef ma non disponibile, doctor avvisa e non lo sovrascrive con testo semplice.
- `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

### 12b) Riparazioni read-only con consapevolezza SecretRef

Alcuni flussi di riparazione devono ispezionare le credenziali configurate senza indebolire il comportamento runtime di fail-fast.

- `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef read-only dei comandi della famiglia status per riparazioni mirate della configurazione.
- Esempio: la riparazione di `allowFrom` / `groupAllowFrom` `@username` di Telegram prova a usare le credenziali del bot configurate quando disponibili.
- Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata-ma-non-disponibile e salta l'auto-risoluzione invece di andare in crash o segnalare erroneamente il token come mancante.

### 13) Controllo di integrità del gateway + riavvio

Doctor esegue un controllo di integrità e propone di riavviare il gateway quando sembra
non integro.

### 13b) Disponibilità della ricerca in memoria

Doctor controlla se il provider embedding configurato per la ricerca in memoria è pronto
per l'agente predefinito. Il comportamento dipende dal backend e provider configurati:

- **Backend QMD**: sonda se il binario `qmd` è disponibile e avviabile.
  In caso contrario, stampa indicazioni di correzione, incluso il pacchetto npm e un'opzione manuale per il percorso del binario.
- **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL di modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
- **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia
  presente nell'ambiente o nell'archivio di autenticazione. Se manca, stampa suggerimenti di correzione utilizzabili.
- **Provider auto**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto
  nell'ordine di selezione automatica.

Quando è disponibile un risultato di sonda del gateway (il gateway era integro al momento del
controllo), doctor lo confronta con la configurazione visibile dalla CLI e segnala
eventuali discrepanze.

Usa `openclaw memory status --deep` per verificare la disponibilità dell'embedding a runtime.

### 14) Avvisi sullo stato dei canali

Se il gateway è integro, doctor esegue una sonda dello stato dei canali e segnala
avvisi con correzioni suggerite.

### 15) Audit + riparazione della configurazione del supervisor

Doctor controlla la configurazione del supervisor installata (launchd/systemd/schtasks) per
valori predefiniti mancanti o obsoleti (ad esempio dipendenze systemd network-online e
ritardo di riavvio). Quando trova un mismatch, consiglia un aggiornamento e può
riscrivere il file di servizio/task ai valori predefiniti correnti.

Note:

- `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisor.
- `openclaw doctor --yes` accetta i prompt di riparazione predefiniti.
- `openclaw doctor --repair` applica le correzioni consigliate senza prompt.
- `openclaw doctor --repair --force` sovrascrive configurazioni personalizzate del supervisor.
- Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito come SecretRef, l'installazione/riparazione del servizio da parte di doctor valida il SecretRef ma non persiste i valori del token risolti in chiaro nei metadati dell'ambiente del servizio supervisor.
- Se l'autenticazione token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni utilizzabili.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
- Per le unità Linux user-systemd, i controlli di deriva del token di doctor ora includono sia le sorgenti `Environment=` sia `EnvironmentFile=` quando confrontano i metadati di autenticazione del servizio.
- Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

### 16) Diagnostica runtime del gateway + porta

Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il
servizio è installato ma non è realmente in esecuzione. Controlla anche i conflitti di porta
sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già
in esecuzione, tunnel SSH).

### 17) Best practice runtime del gateway

Doctor avvisa quando il servizio gateway è eseguito con Bun o con un percorso Node gestito da version manager
(`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node,
e i percorsi dei version manager possono rompersi dopo gli aggiornamenti perché il servizio non
carica l'init della shell. Doctor propone di migrare a un'installazione Node di sistema quando
disponibile (Homebrew/apt/choco).

### 18) Scrittura della configurazione + metadati del wizard

Doctor persiste tutte le modifiche alla configurazione e applica i metadati del wizard per registrare
l'esecuzione di doctor.

### 19) Suggerimenti per il workspace (backup + sistema di memoria)

Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup
se il workspace non è già sotto git.

Vedi [/concepts/agent-workspace](/concepts/agent-workspace) per una guida completa alla
struttura del workspace e al backup git (consigliato GitHub o GitLab privato).
