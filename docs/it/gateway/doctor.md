---
read_when:
    - Aggiunta o modifica delle migrazioni di doctor
    - Introduzione di modifiche incompatibili alla configurazione
summary: 'Comando Doctor: controlli di integrità, migrazioni della configurazione e passaggi di riparazione'
title: Doctor
x-i18n:
    generated_at: "2026-04-07T08:13:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a834dc7aec79c20d17bc23d37fb5f5e99e628d964d55bd8cf24525a7ee57130c
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` è lo strumento di riparazione + migrazione per OpenClaw. Corregge configurazione/stato obsoleti, controlla l'integrità e fornisce passaggi di riparazione concreti.

## Avvio rapido

```bash
openclaw doctor
```

### Headless / automazione

```bash
openclaw doctor --yes
```

Accetta i valori predefiniti senza richiedere conferma (inclusi i passaggi di riavvio/servizio/sandbox di riparazione quando applicabili).

```bash
openclaw doctor --repair
```

Applica le riparazioni consigliate senza richiedere conferma (riparazioni + riavvii dove sicuro).

```bash
openclaw doctor --repair --force
```

Applica anche le riparazioni aggressive (sovrascrive configurazioni personalizzate del supervisore).

```bash
openclaw doctor --non-interactive
```

Esegue senza richieste di conferma e applica solo le migrazioni sicure (normalizzazione della configurazione + spostamenti dello stato su disco). Salta le azioni di riavvio/servizio/sandbox che richiedono conferma umana.
Le migrazioni dello stato legacy vengono eseguite automaticamente quando rilevate.

```bash
openclaw doctor --deep
```

Analizza i servizi di sistema alla ricerca di installazioni gateway aggiuntive (launchd/systemd/schtasks).

Se vuoi rivedere le modifiche prima di scrivere, apri prima il file di configurazione:

```bash
cat ~/.openclaw/openclaw.json
```

## Cosa fa (riepilogo)

- Aggiornamento pre-volo facoltativo per installazioni git (solo interattivo).
- Controllo di aggiornamento del protocollo UI (ricompila la Control UI quando lo schema del protocollo è più recente).
- Controllo di integrità + richiesta di riavvio.
- Riepilogo dello stato delle Skills (idonee/mancanti/bloccate) e stato dei plugin.
- Normalizzazione della configurazione per valori legacy.
- Migrazione della configurazione Talk dai campi legacy flat `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Controlli di migrazione del browser per configurazioni legacy dell'estensione Chrome e prontezza di Chrome MCP.
- Avvisi sulle sostituzioni del provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Controllo dei prerequisiti TLS OAuth per i profili OAuth di OpenAI Codex.
- Migrazione dello stato legacy su disco (sessions/dir agent/WhatsApp auth).
- Migrazione della chiave di contratto del manifest legacy dei plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrazione dell'archivio cron legacy (`jobId`, `schedule.cron`, campi delivery/payload di primo livello, `provider` nel payload, semplici job di fallback webhook `notify: true`).
- Ispezione dei file lock di sessione e pulizia dei lock obsoleti.
- Controlli di integrità e autorizzazioni dello stato (sessions, transcript, directory dello stato).
- Controlli dei permessi del file di configurazione (chmod 600) quando eseguito localmente.
- Integrità dell'autenticazione del modello: controlla la scadenza OAuth, può aggiornare i token in scadenza e segnala gli stati cooldown/disabilitato dei profili di autenticazione.
- Rilevamento di directory workspace aggiuntive (`~/openclaw`).
- Riparazione dell'immagine sandbox quando il sandboxing è abilitato.
- Migrazione del servizio legacy e rilevamento di gateway aggiuntivi.
- Migrazione dello stato legacy del canale Matrix (in modalità `--fix` / `--repair`).
- Controlli del runtime del gateway (servizio installato ma non in esecuzione; etichetta launchd memorizzata nella cache).
- Avvisi sullo stato del canale (rilevati dal gateway in esecuzione).
- Audit della configurazione del supervisore (launchd/systemd/schtasks) con riparazione facoltativa.
- Controlli delle best practice del runtime del gateway (Node vs Bun, percorsi dei gestori di versione).
- Diagnostica dei conflitti di porta del gateway (predefinita `18789`).
- Avvisi di sicurezza per criteri DM aperti.
- Controlli di autenticazione del gateway per la modalità token locale (offre la generazione del token quando non esiste alcuna origine del token; non sovrascrive configurazioni token SecretRef).
- Controllo `linger` systemd su Linux.
- Controllo della dimensione dei file bootstrap del workspace (avvisi di troncamento/vicinanza al limite per i file di contesto).
- Controllo dello stato del completamento della shell e installazione/aggiornamento automatici.
- Controllo di prontezza del provider di embedding per la ricerca in memoria (modello locale, chiave API remota o binario QMD).
- Controlli dell'installazione da sorgente (mancata corrispondenza del workspace pnpm, risorse UI mancanti, binario tsx mancante).
- Scrive la configurazione aggiornata + i metadati della procedura guidata.

## Comportamento dettagliato e motivazione

### 0) Aggiornamento facoltativo (installazioni git)

Se questa è una checkout git e doctor è in esecuzione in modalità interattiva, offre di
aggiornare (fetch/rebase/build) prima di eseguire doctor.

### 1) Normalizzazione della configurazione

Se la configurazione contiene forme di valori legacy (ad esempio `messages.ackReaction`
senza una sostituzione specifica per canale), doctor le normalizza nello schema
corrente.

Questo include i campi flat legacy di Talk. La configurazione Talk pubblica attuale è
`talk.provider` + `talk.providers.<provider>`. Doctor riscrive le vecchie forme
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` nella mappa del provider.

### 2) Migrazioni delle chiavi di configurazione legacy

Quando la configurazione contiene chiavi deprecate, gli altri comandi rifiutano di essere eseguiti e chiedono
di eseguire `openclaw doctor`.

Doctor esegue le seguenti azioni:

- Spiega quali chiavi legacy sono state trovate.
- Mostra la migrazione che ha applicato.
- Riscrive `~/.openclaw/openclaw.json` con lo schema aggiornato.

Il Gateway esegue automaticamente anche le migrazioni doctor all'avvio quando rileva un
formato di configurazione legacy, così le configurazioni obsolete vengono corrette senza intervento manuale.
Le migrazioni dell'archivio dei job cron sono gestite da `openclaw doctor --fix`.

Migrazioni attuali:

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
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Per i canali con `accounts` con nome ma con valori di canale di primo livello ancora relativi a un singolo account, sposta quei valori con ambito account nell'account promosso scelto per quel canale (`accounts.default` per la maggior parte dei canali; Matrix può mantenere una destinazione con nome/predefinita corrispondente esistente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- rimuove `browser.relayBindHost` (impostazione relay legacy dell'estensione)

Gli avvisi di doctor includono anche indicazioni sui valori predefiniti dell'account per i canali multi-account:

- Se sono configurate due o più voci `channels.<channel>.accounts` senza `channels.<channel>.defaultAccount` o `accounts.default`, doctor avvisa che l'instradamento di fallback può scegliere un account inatteso.
- Se `channels.<channel>.defaultAccount` è impostato su un ID account sconosciuto, doctor avvisa ed elenca gli ID account configurati.

### 2b) Sostituzioni del provider OpenCode

Se hai aggiunto manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
questo sovrascrive il catalogo OpenCode integrato da `@mariozechner/pi-ai`.
Questo può forzare i modelli sull'API sbagliata o azzerare i costi. Doctor avvisa così
puoi rimuovere la sostituzione e ripristinare l'instradamento API + i costi per modello.

### 2c) Migrazione del browser e prontezza di Chrome MCP

Se la configurazione del browser punta ancora al percorso rimosso dell'estensione Chrome, doctor
la normalizza al modello attuale di collegamento host-local Chrome MCP:

- `browser.profiles.*.driver: "extension"` diventa `"existing-session"`
- `browser.relayBindHost` viene rimosso

Doctor esegue anche un audit del percorso host-local Chrome MCP quando usi `defaultProfile:
"user"` o un profilo `existing-session` configurato:

- controlla se Google Chrome è installato sullo stesso host per i profili di
  connessione automatica predefiniti
- controlla la versione rilevata di Chrome e avvisa quando è inferiore a Chrome 144
- ricorda di abilitare il debug remoto nella pagina inspect del browser (ad
  esempio `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor non può abilitare per te l'impostazione lato Chrome. L'host-local Chrome MCP
richiede comunque:

- un browser basato su Chromium 144+ sull'host gateway/node
- il browser in esecuzione localmente
- il debug remoto abilitato in quel browser
- l'approvazione della prima richiesta di consenso al collegamento nel browser

La prontezza qui riguarda solo i prerequisiti di collegamento locale. Existing-session mantiene
gli attuali limiti di percorso di Chrome MCP; percorsi avanzati come `responsebody`, esportazione PDF,
intercettazione dei download e azioni batch richiedono comunque un
browser gestito o un profilo CDP raw.

Questo controllo **non** si applica a flussi Docker, sandbox, remote-browser o altri
flussi headless. Questi continuano a usare CDP raw.

### 2d) Prerequisiti TLS OAuth

Quando è configurato un profilo OAuth OpenAI Codex, doctor interroga l'endpoint di autorizzazione OpenAI per verificare che lo stack TLS locale Node/OpenSSL possa
convalidare la catena di certificati. Se il test fallisce con un errore di certificato (ad
esempio `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificato scaduto o autofirmato),
doctor stampa indicazioni di correzione specifiche per piattaforma. Su macOS con un Node Homebrew, la
correzione è di solito `brew postinstall ca-certificates`. Con `--deep`, il test viene eseguito
anche se il gateway è integro.

### 3) Migrazioni dello stato legacy (layout su disco)

Doctor può migrare layout su disco più vecchi nella struttura corrente:

- Archivio delle sessioni + transcript:
  - da `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directory agent:
  - da `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Stato di autenticazione WhatsApp (Baileys):
  - dai legacy `~/.openclaw/credentials/*.json` (eccetto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID account predefinito: `default`)

Queste migrazioni sono best-effort e idempotenti; doctor emette avvisi quando
lascia eventuali cartelle legacy come backup. Il Gateway/CLI migra automaticamente anche
le sessioni legacy + la directory agent all'avvio, così cronologia/autenticazione/modelli finiscono nel
percorso per agente senza un'esecuzione manuale di doctor. L'autenticazione WhatsApp viene
intenzionalmente migrata solo tramite `openclaw doctor`. La normalizzazione di Talk provider/provider-map ora
confronta per uguaglianza strutturale, quindi differenze dovute solo all'ordine delle chiavi non attivano più
modifiche ripetute senza effetto di `doctor --fix`.

### 3a) Migrazioni legacy del manifest del plugin

Doctor analizza tutti i manifest dei plugin installati alla ricerca di chiavi di capacità
di primo livello deprecate (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando trovate, offre di spostarle nell'oggetto `contracts`
e riscrivere il file del manifest sul posto. Questa migrazione è idempotente;
se la chiave `contracts` contiene già gli stessi valori, la chiave legacy viene rimossa
senza duplicare i dati.

### 3b) Migrazioni legacy dell'archivio cron

Doctor controlla anche l'archivio dei job cron (`~/.openclaw/cron/jobs.json` per impostazione predefinita,
o `cron.store` se sovrascritto) per forme di job vecchie che lo scheduler continua
ad accettare per compatibilità.

Le pulizie cron attuali includono:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campi payload di primo livello (`message`, `model`, `thinking`, ...) → `payload`
- campi delivery di primo livello (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` nel payload → `delivery.channel` esplicito
- semplici job legacy di fallback webhook `notify: true` → `delivery.mode="webhook"` esplicito con `delivery.to=cron.webhook`

Doctor migra automaticamente i job `notify: true` solo quando può farlo senza
modificare il comportamento. Se un job combina il fallback notify legacy con una modalità delivery
non webhook esistente, doctor avvisa e lascia quel job alla revisione manuale.

### 3c) Pulizia dei lock di sessione

Doctor analizza ogni directory di sessione agent alla ricerca di file write-lock obsoleti — file lasciati
indietro quando una sessione è terminata in modo anomalo. Per ogni file lock trovato segnala:
il percorso, il PID, se il PID è ancora attivo, l'età del lock e se è
considerato obsoleto (PID morto o più vecchio di 30 minuti). In modalità `--fix` / `--repair`
rimuove automaticamente i file lock obsoleti; altrimenti stampa una nota e
ti chiede di rieseguire con `--fix`.

### 4) Controlli di integrità dello stato (persistenza delle sessioni, instradamento e sicurezza)

La directory dello stato è il tronco encefalico operativo. Se scompare, perdi
sessioni, credenziali, log e configurazione (a meno che tu non abbia backup altrove).

Doctor controlla:

- **Directory dello stato mancante**: avvisa della perdita catastrofica dello stato, chiede di ricreare
  la directory e ricorda che non può recuperare i dati mancanti.
- **Permessi della directory dello stato**: verifica la scrivibilità; offre di riparare i permessi
  (e mostra un suggerimento `chown` quando viene rilevata una mancata corrispondenza di proprietario/gruppo).
- **Directory dello stato su macOS sincronizzata nel cloud**: avvisa quando lo stato si risolve sotto iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` perché i percorsi supportati dalla sincronizzazione possono causare I/O più lenti
  e race condition di lock/sincronizzazione.
- **Directory dello stato su Linux su SD o eMMC**: avvisa quando lo stato si risolve su una sorgente di mount `mmcblk*`,
  perché l'I/O casuale supportato da SD o eMMC può essere più lento e usurarsi
  più velocemente con scritture di sessione e credenziali.
- **Directory di sessione mancanti**: `sessions/` e la directory dell'archivio delle sessioni sono
  necessarie per mantenere la cronologia ed evitare crash `ENOENT`.
- **Mancata corrispondenza dei transcript**: avvisa quando voci di sessione recenti hanno
  file transcript mancanti.
- **Sessione principale “JSONL su 1 riga”**: segnala quando il transcript principale ha una sola
  riga (la cronologia non si sta accumulando).
- **Più directory di stato**: avvisa quando esistono più cartelle `~/.openclaw` in
  directory home o quando `OPENCLAW_STATE_DIR` punta altrove (la cronologia può
  dividersi tra installazioni).
- **Promemoria della modalità remota**: se `gateway.mode=remote`, doctor ricorda di eseguirlo
  sull'host remoto (lo stato si trova lì).
- **Permessi del file di configurazione**: avvisa se `~/.openclaw/openclaw.json` è
  leggibile dal gruppo/dal mondo e offre di restringerlo a `600`.

### 5) Integrità dell'autenticazione del modello (scadenza OAuth)

Doctor ispeziona i profili OAuth nell'archivio auth, avvisa quando i token stanno per
scadere/sono scaduti e può aggiornarli quando è sicuro. Se il profilo
OAuth/token Anthropic è obsoleto, suggerisce una chiave API Anthropic o il
percorso setup-token Anthropic.
Le richieste di aggiornamento compaiono solo in esecuzione interattiva (TTY); `--non-interactive`
salta i tentativi di aggiornamento.

Doctor segnala anche i profili di autenticazione che sono temporaneamente inutilizzabili a causa di:

- cooldown brevi (limiti di frequenza/timeout/errori di autenticazione)
- disabilitazioni più lunghe (errori di fatturazione/credito)

### 6) Convalida del modello degli hook

Se `hooks.gmail.model` è impostato, doctor convalida il riferimento del modello rispetto al
catalogo e alla allowlist e avvisa quando non verrà risolto o non è consentito.

### 7) Riparazione dell'immagine sandbox

Quando il sandboxing è abilitato, doctor controlla le immagini Docker e offre di compilare o
passare a nomi legacy se l'immagine corrente manca.

### 7b) Dipendenze runtime dei plugin inclusi

Doctor verifica che le dipendenze runtime dei plugin inclusi (ad esempio i
pacchetti runtime del plugin Discord) siano presenti nella radice di installazione di OpenClaw.
Se ne manca qualcuna, doctor segnala i pacchetti e li installa in modalità
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrazioni del servizio gateway e suggerimenti di pulizia

Doctor rileva servizi gateway legacy (launchd/systemd/schtasks) e
offre di rimuoverli e installare il servizio OpenClaw usando la porta gateway
corrente. Può anche analizzare servizi aggiuntivi simili al gateway e stampare suggerimenti di pulizia.
I servizi gateway OpenClaw con nome di profilo sono considerati di prima classe e non vengono
segnalati come "aggiuntivi".

### 8b) Migrazione Matrix all'avvio

Quando un account del canale Matrix ha una migrazione dello stato legacy in sospeso o applicabile,
doctor (in modalità `--fix` / `--repair`) crea uno snapshot pre-migrazione e quindi
esegue i passaggi di migrazione best-effort: migrazione dello stato Matrix legacy e preparazione
dello stato legacy cifrato. Entrambi i passaggi non sono fatali; gli errori vengono registrati e
l'avvio continua. In modalità di sola lettura (`openclaw doctor` senza `--fix`) questo controllo
viene saltato completamente.

### 9) Avvisi di sicurezza

Doctor emette avvisi quando un provider è aperto ai DM senza una allowlist, oppure
quando un criterio è configurato in modo pericoloso.

### 10) systemd linger (Linux)

Se è in esecuzione come servizio utente systemd, doctor assicura che lingering sia abilitato così il
gateway resta attivo dopo il logout.

### 11) Stato del workspace (Skills, plugin e directory legacy)

Doctor stampa un riepilogo dello stato del workspace per l'agente predefinito:

- **Stato delle Skills**: conta le Skills idonee, quelle con requisiti mancanti e quelle bloccate dalla allowlist.
- **Directory workspace legacy**: avvisa quando `~/openclaw` o altre directory workspace legacy
  esistono accanto al workspace corrente.
- **Stato dei plugin**: conta i plugin caricati/disabilitati/in errore; elenca gli ID plugin per eventuali
  errori; segnala le capacità dei plugin inclusi.
- **Avvisi di compatibilità dei plugin**: segnala i plugin che hanno problemi di compatibilità con
  il runtime corrente.
- **Diagnostica dei plugin**: espone eventuali avvisi o errori al caricamento emessi dal
  registro dei plugin.

### 11b) Dimensione del file bootstrap

Doctor controlla se i file bootstrap del workspace (ad esempio `AGENTS.md`,
`CLAUDE.md` o altri file di contesto iniettati) sono vicini o oltre il budget di
caratteri configurato. Segnala per file il numero di caratteri raw rispetto a quelli iniettati, la percentuale di
troncamento, la causa del troncamento (`max/file` o `max/total`) e il totale dei caratteri iniettati
come frazione del budget totale. Quando i file sono troncati o vicini
al limite, doctor stampa suggerimenti per regolare `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completamento della shell

Doctor controlla se il completamento tab è installato per la shell corrente
(zsh, bash, fish o PowerShell):

- Se il profilo della shell usa un modello di completamento dinamico lento
  (`source <(openclaw completion ...)`), doctor lo aggiorna alla variante più veloce
  con file in cache.
- Se il completamento è configurato nel profilo ma manca il file di cache,
  doctor rigenera automaticamente la cache.
- Se non è configurato alcun completamento, doctor chiede di installarlo
  (solo modalità interattiva; saltato con `--non-interactive`).

Esegui `openclaw completion --write-state` per rigenerare manualmente la cache.

### 12) Controlli di autenticazione del gateway (token locale)

Doctor controlla la prontezza dell'autenticazione token del gateway locale.

- Se la modalità token richiede un token e non esiste alcuna origine del token, doctor offre di generarne uno.
- Se `gateway.auth.token` è gestito da SecretRef ma non è disponibile, doctor avvisa e non lo sovrascrive con testo in chiaro.
- `openclaw doctor --generate-gateway-token` forza la generazione solo quando non è configurato alcun token SecretRef.

### 12b) Riparazioni in sola lettura compatibili con SecretRef

Alcuni flussi di riparazione devono ispezionare credenziali configurate senza indebolire il comportamento fail-fast del runtime.

- `openclaw doctor --fix` ora usa lo stesso modello di riepilogo SecretRef in sola lettura dei comandi della famiglia status per riparazioni mirate della configurazione.
- Esempio: la riparazione di Telegram `allowFrom` / `groupAllowFrom` `@username` prova a usare le credenziali bot configurate quando disponibili.
- Se il token del bot Telegram è configurato tramite SecretRef ma non è disponibile nel percorso del comando corrente, doctor segnala che la credenziale è configurata ma non disponibile e salta la risoluzione automatica invece di andare in crash o segnalare erroneamente il token come mancante.

### 13) Controllo di integrità del gateway + riavvio

Doctor esegue un controllo di integrità e offre di riavviare il gateway quando sembra
non integro.

### 13b) Prontezza della ricerca in memoria

Doctor controlla se il provider di embedding configurato per la ricerca in memoria è pronto
per l'agente predefinito. Il comportamento dipende dal backend e dal provider configurati:

- **Backend QMD**: verifica se il binario `qmd` è disponibile e avviabile.
  In caso contrario, stampa indicazioni di correzione, incluso il pacchetto npm e un'opzione manuale per il percorso del binario.
- **Provider locale esplicito**: controlla la presenza di un file modello locale o di un URL modello remoto/scaricabile riconosciuto. Se manca, suggerisce di passare a un provider remoto.
- **Provider remoto esplicito** (`openai`, `voyage`, ecc.): verifica che una chiave API sia
  presente nell'ambiente o nell'archivio auth. Stampa suggerimenti di correzione concreti se manca.
- **Provider auto**: controlla prima la disponibilità del modello locale, poi prova ogni provider remoto
  nell'ordine di selezione automatica.

Quando è disponibile il risultato di un test gateway (il gateway era integro al momento del
controllo), doctor lo confronta con la configurazione visibile dalla CLI e segnala
eventuali discrepanze.

Usa `openclaw memory status --deep` per verificare la prontezza degli embedding a runtime.

### 14) Avvisi sullo stato del canale

Se il gateway è integro, doctor esegue un test dello stato del canale e segnala
avvisi con correzioni suggerite.

### 15) Audit della configurazione del supervisore + riparazione

Doctor controlla la configurazione del supervisore installata (launchd/systemd/schtasks) per
valori predefiniti mancanti o obsoleti (ad es. dipendenze systemd `network-online` e
ritardo di riavvio). Quando trova una mancata corrispondenza, raccomanda un aggiornamento e può
riscrivere il file del servizio/task ai valori predefiniti correnti.

Note:

- `openclaw doctor` chiede conferma prima di riscrivere la configurazione del supervisore.
- `openclaw doctor --yes` accetta le richieste di riparazione predefinite.
- `openclaw doctor --repair` applica le correzioni consigliate senza richieste di conferma.
- `openclaw doctor --repair --force` sovrascrive configurazioni personalizzate del supervisore.
- Se l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, l'installazione/riparazione del servizio doctor convalida il SecretRef ma non mantiene valori del token risolti in testo in chiaro nei metadati dell'ambiente del servizio supervisore.
- Se l'autenticazione token richiede un token e il token SecretRef configurato non è risolto, doctor blocca il percorso di installazione/riparazione con indicazioni concrete.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, doctor blocca installazione/riparazione finché la modalità non viene impostata esplicitamente.
- Per le unità user-systemd Linux, i controlli di deriva del token di doctor ora includono sia le origini `Environment=` sia `EnvironmentFile=` nel confronto dei metadati di autenticazione del servizio.
- Puoi sempre forzare una riscrittura completa tramite `openclaw gateway install --force`.

### 16) Diagnostica del runtime del gateway + porta

Doctor ispeziona il runtime del servizio (PID, ultimo stato di uscita) e avvisa quando il
servizio è installato ma non è effettivamente in esecuzione. Controlla anche i conflitti di porta
sulla porta del gateway (predefinita `18789`) e segnala le cause probabili (gateway già
in esecuzione, tunnel SSH).

### 17) Best practice del runtime del gateway

Doctor avvisa quando il servizio gateway viene eseguito su Bun o su un percorso Node gestito da un gestore di versioni
(`nvm`, `fnm`, `volta`, `asdf`, ecc.). I canali WhatsApp + Telegram richiedono Node,
e i percorsi dei gestori di versione possono rompersi dopo gli aggiornamenti perché il servizio non
carica l'inizializzazione della shell. Doctor offre di migrare a un'installazione Node di sistema quando
disponibile (Homebrew/apt/choco).

### 18) Scrittura della configurazione + metadati della procedura guidata

Doctor rende persistenti eventuali modifiche alla configurazione e applica i metadati della procedura guidata per registrare l'esecuzione
di doctor.

### 19) Suggerimenti per il workspace (backup + sistema di memoria)

Doctor suggerisce un sistema di memoria del workspace quando manca e stampa un suggerimento di backup
se il workspace non è già sotto git.

Vedi [/concepts/agent-workspace](/it/concepts/agent-workspace) per una guida completa alla
struttura del workspace e al backup git (consigliato GitHub o GitLab privato).
