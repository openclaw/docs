---
read_when:
    - Configurazione dei bin sicuri o dei profili safe-bin personalizzati
    - Inoltro delle approvazioni a Slack/Discord/Telegram o ad altri canali di chat
    - Implementazione di un client di approvazione nativo per un canale
summary: 'Approvazioni exec avanzate: binari sicuri, associazione dell''interprete, inoltro delle approvazioni, consegna nativa'
title: Approvazioni di esecuzione — avanzate
x-i18n:
    generated_at: "2026-05-06T09:11:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Argomenti avanzati sull'approvazione exec: il percorso rapido `safeBins`, il binding di interprete/runtime
e l'inoltro delle approvazioni ai canali chat (inclusa la consegna nativa).
Per la policy principale e il flusso di approvazione, consulta [Approvazioni exec](/it/tools/exec-approvals).

## Bin sicuri (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo stdin** (per
esempio `cut`) che possono essere eseguiti in modalità allowlist **senza** voci
allowlist esplicite. I bin sicuri rifiutano argomenti di file posizionali e token simili a percorsi,
quindi possono operare solo sul flusso in ingresso. Consideralo un percorso rapido ristretto per
filtri di flusso, non un elenco generale di attendibilità.

<Warning>
**Non** aggiungere binari di interpreti o runtime (per esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando può valutare codice,
eseguire sottocomandi o leggere file per progettazione, preferisci voci allowlist esplicite
e mantieni abilitate le richieste di approvazione. I bin sicuri personalizzati devono definire un
profilo esplicito in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin sicuri predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se li abiliti, mantieni voci
allowlist esplicite per i loro flussi di lavoro non stdin. Per `grep` in modalità safe-bin,
fornisci il pattern con `-e`/`--regexp`; la forma con pattern posizionale viene rifiutata
così gli operandi file non possono essere introdotti di nascosto come posizionali ambigui.

### Validazione argv e flag negati

La validazione è deterministica solo dalla forma di argv (nessun controllo di esistenza
sul filesystem host), il che impedisce comportamenti da oracolo di esistenza dei file
derivanti da differenze allow/deny. Le opzioni orientate ai file sono negate per i bin sicuri
predefiniti; le opzioni lunghe vengono validate in modalità fail-closed (flag sconosciuti e
abbreviazioni ambigue vengono rifiutati).

Flag negati per profilo safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I bin sicuri forzano inoltre i token argv a essere trattati come **testo letterale** al momento
dell'esecuzione (nessun globbing e nessuna espansione di `$VARS`) per segmenti solo stdin, quindi pattern
come `*` o `$HOME/...` non possono essere usati per introdurre di nascosto letture di file.

### Directory di binari attendibili

I bin sicuri devono essere risolti da directory di binari attendibili (valori predefiniti di sistema più
`tools.exec.safeBinTrustedDirs` opzionale). Le voci `PATH` non sono mai considerate attendibili automaticamente.
Le directory attendibili predefinite sono intenzionalmente minime: `/bin`, `/usr/bin`. Se
l'eseguibile safe-bin si trova in percorsi di package manager/utente (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Concatenazione shell, wrapper e multiplexer

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello
soddisfa l'allowlist (inclusi bin sicuri o auto-allow delle skill). I reindirizzamenti
restano non supportati in modalità allowlist. La sostituzione di comando (`$()` / backtick) viene
rifiutata durante il parsing allowlist, anche dentro virgolette doppie; usa virgolette singole
se ti serve testo letterale `$()`.

Nelle approvazioni dell'app companion su macOS, il testo shell grezzo che contiene sintassi di controllo o
espansione shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) è
trattato come un mancato match dell'allowlist a meno che il binario shell stesso non sia in allowlist.

Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con scope sulla richiesta vengono
ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per decisioni `allow-always` in modalità allowlist, i wrapper di dispatch noti (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistono il percorso dell'eseguibile interno invece
del percorso del wrapper. I multiplexer shell (`busybox`, `toybox`) vengono scomposti per
applet shell (`sh`, `ash`, ecc.) allo stesso modo. Se un wrapper o multiplexer
non può essere scomposto in modo sicuro, nessuna voce allowlist viene persistita automaticamente.

Se inserisci in allowlist interpreti come `python3` o `node`, preferisci
`tools.exec.strictInlineEval=true` così l'eval inline richiede ancora un'approvazione
esplicita. In modalità strict, `allow-always` può ancora persistere invocazioni
benigne di interprete/script, ma i carrier di inline-eval non vengono persistiti
automaticamente.

### Bin sicuri rispetto ad allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Obiettivo        | Consentire automaticamente filtri stdin ristretti      | Considerare attendibili esplicitamente eseguibili specifici                        |
| Tipo di match    | Nome eseguibile + policy argv safe-bin                 | Glob del percorso eseguibile risolto, o glob del nome comando bare per comandi invocati da PATH |
| Ambito argomenti | Limitato dal profilo safe-bin e dalle regole sui token letterali | Match del percorso per impostazione predefinita; `argPattern` opzionale può limitare argv parsato |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate                              |
| Uso migliore     | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con comportamento più ampio o effetti collaterali              |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` per agente).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` per agente).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` per agente). Le chiavi dei profili per agente sovrascrivono le chiavi globali.
- Le voci allowlist risiedono in `~/.openclaw/exec-approvals.json` locale all'host sotto `agents.<id>.allowlist` (o tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando bin di interpreti/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può creare lo scheletro delle voci personalizzate mancanti `safeBinProfiles.<bin>` come `{}` (rivedi e restringi dopo). I bin di interpreti/runtime non vengono creati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900000__
Se abiliti esplicitamente `jq` in `safeBins`, OpenClaw rifiuta comunque il builtin `env` in modalità safe-bin
così `jq -n env` non può scaricare l'ambiente del processo host senza un percorso allowlist esplicito
o una richiesta di approvazione.

## Comandi di interprete/runtime

Le esecuzioni di interprete/runtime supportate da approvazione sono intenzionalmente conservative:

- Il contesto argv/cwd/env esatto è sempre vincolato.
- Le forme di script shell diretto e file runtime diretto sono vincolate best-effort a uno snapshot concreto di un file locale.
- Le forme comuni di wrapper di package manager che risolvono comunque a un file locale diretto (per esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono scomposte prima del binding.
- Se OpenClaw non può identificare esattamente un file locale concreto per un comando di interprete/runtime
  (per esempio script di pacchetto, forme eval, catene di loader specifiche del runtime o forme multi-file ambigue),
  l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica che non possiede.
- Per questi flussi di lavoro, preferisci sandboxing, un confine host separato o una allowlist/flusso di lavoro completo
  esplicitamente attendibile in cui l'operatore accetta la semantica runtime più ampia.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente un id approvazione. Usa quell'id per
correlare eventi di sistema successivi (`Exec finished` / `Exec denied`). Se non arriva alcuna decisione prima del
timeout, la richiesta viene trattata come timeout di approvazione ed esposta come motivo di negazione.

### Comportamento di consegna dei followup

Dopo che un exec asincrono approvato termina, OpenClaw invia un turno `agent` di followup alla stessa sessione.

- Se esiste un target di consegna esterno valido (canale consegnabile più target `to`), la consegna del followup usa quel canale.
- Nei flussi solo webchat o di sessione interna senza target esterno, la consegna del followup resta solo sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente la consegna esterna strict senza alcun canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, la consegna viene degradata a solo sessione invece di fallire.

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare le richieste di approvazione exec a qualsiasi canale chat (inclusi i canali plugin) e approvarle
con `/approve`. Questo usa la normale pipeline di consegna in uscita.

Configurazione:
__OC_I18N_900001__
Rispondi in chat:
__OC_I18N_900002__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente le approvazioni plugin.

### Inoltro delle approvazioni plugin

L'inoltro delle approvazioni plugin usa la stessa pipeline di consegna delle approvazioni exec ma ha una
configurazione indipendente propria sotto `approvals.plugin`. Abilitare o disabilitare una non influisce sull'altra.
__OC_I18N_900003__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise mostrano gli stessi pulsanti di approvazione sia per le approvazioni exec sia per quelle
plugin. I canali senza UI interattiva condivisa ripiegano su testo semplice con istruzioni `/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o plugin ha origine da una superficie chat consegnabile, la stessa chat
può ora approvarla con `/approve` per impostazione predefinita. Questo vale per canali come Slack, Matrix e
Microsoft Teams oltre ai flussi esistenti Web UI e terminal UI.

Questo percorso condiviso di comando testuale usa il normale modello di autenticazione del canale per quella conversazione. Se la
chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non necessitano più di un
adattatore di consegna nativo separato solo per restare in sospeso.

Discord e Telegram supportano anche `/approve` nella stessa chat, ma quei canali usano comunque il loro
elenco di approvatori risolto per l'autorizzazione anche quando la consegna nativa delle approvazioni è disabilitata.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti "approval not found". Una reale
negazione/errore di approvazione exec non ritenta silenziosamente come approvazione plugin.

### Consegna nativa delle approvazioni

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM agli approvatori, fanout alla chat di origine
e UX di approvazione interattiva specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili schede/pulsanti di approvazione nativi, tale UI nativa è il percorso principale rivolto all'agente. L'agente non deve anche ripetere un comando chat semplice duplicato
`/approve`, a meno che il risultato dello strumento indichi che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso rimasto.

Se è configurato un client di approvazione nativo ma nessun runtime nativo è attivo per il canale di origine, OpenClaw mantiene visibile il prompt `/approve` deterministico locale. Se il runtime nativo è attivo e tenta la consegna ma nessuna destinazione riceve la scheda, OpenClaw invia un avviso di fallback nella stessa chat con il comando esatto `/approve <id> <decision>` in modo che la richiesta possa comunque essere risolta.

Modello generico:

- la policy di esecuzione dell'host decide ancora se è richiesta l'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione ad altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client di approvazione nativo

I client di approvazione nativi abilitano automaticamente la consegna prima via DM quando tutte queste condizioni sono vere:

- il canale supporta la consegna di approvazioni native
- gli approvatori possono essere risolti da `execApprovals.approvers` espliciti o dall'identità del proprietario, come `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzarlo quando gli approvatori vengono risolti. La consegna alla chat pubblica di origine resta esplicita tramite `channels.<channel>.execApprovals.target`.

FAQ: [Perché ci sono due configurazioni di approvazione exec per le approvazioni via chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client di approvazione nativi aggiungono routing DM e fanout opzionale sui canali sopra il flusso condiviso `/approve` nella stessa chat e i pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat consegnabili simili usano il normale modello di autenticazione del canale per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, la destinazione predefinita della consegna nativa sono i DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i pulsanti nativi di Slack preservano il tipo di ID approvazione, quindi gli ID `plugin:` possono risolvere le approvazioni Plugin senza un secondo livello di fallback locale a Slack
- il routing nativo DM/canale di Matrix e le scorciatoie tramite reazione gestiscono sia le approvazioni exec sia quelle Plugin; l'autorizzazione Plugin proviene comunque da `channels.matrix.dm.allowFrom`
- i prompt nativi di Matrix includono contenuto di evento personalizzato `com.openclaw.approval` nel primo evento di prompt, così i client Matrix consapevoli di OpenClaw possono leggere lo stato strutturato dell'approvazione mentre i client standard mantengono il fallback in testo semplice `/approve`
- il richiedente non deve necessariamente essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti di approvazione nativi di Discord instradano in base al tipo di ID approvazione: gli ID `plugin:` vanno direttamente alle approvazioni Plugin, tutto il resto va alle approvazioni exec
- i pulsanti di approvazione nativi di Telegram seguono lo stesso fallback limitato da exec a Plugin di `/approve`
- quando `target` nativo abilita la consegna alla chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt ricade su `askFallback`

I comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, usano il routing privato del proprietario per i prompt di approvazione e i risultati finali. OpenClaw prova prima una route privata sulla stessa superficie in cui il proprietario ha eseguito il comando. Se quella superficie non dispone di una route privata del proprietario, ricade sulla prima route proprietario disponibile da `commands.ownerAllowFrom`, così un comando di gruppo Discord può comunque inviare l'approvazione e il risultato al DM Telegram del proprietario quando Telegram è l'interfaccia privata primaria configurata. La chat di gruppo riceve solo un breve riconoscimento.

Telegram usa per impostazione predefinita i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando vuoi che i prompt di approvazione compaiano anche nella chat/topic Telegram di origine. Per i topic forum di Telegram, OpenClaw preserva il topic per il prompt di approvazione e il follow-up post-approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900004__
Note di sicurezza:

- Modalità socket Unix `0600`, token archiviato in `exec-approvals.json`.
- Controllo del peer con lo stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals) — policy principale e flusso di approvazione
- [Strumento exec](/it/tools/exec)
- [Modalità elevata](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento di auto-consenso basato su skill
