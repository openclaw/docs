---
read_when:
    - Configurazione dei binari sicuri o dei profili di binari sicuri personalizzati
    - Inoltro delle approvazioni a Slack/Discord/Telegram o ad altri canali di chat
    - Implementare un client di approvazione nativo per un canale
summary: 'Approvazioni exec avanzate: binari sicuri, associazione dell''interprete, inoltro delle approvazioni, consegna nativa'
title: Approvazioni exec — avanzate
x-i18n:
    generated_at: "2026-05-07T01:54:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Argomenti avanzati sulle approvazioni exec: il percorso rapido `safeBins`, il binding di interprete/runtime
e l'inoltro delle approvazioni ai canali chat (inclusa la consegna nativa).
Per la policy principale e il flusso di approvazione, consulta [Approvazioni exec](/it/tools/exec-approvals).

## Safe bin (solo stdin)

`tools.exec.safeBins` definisce un breve elenco di binari **solo stdin** (per
esempio `cut`) che possono essere eseguiti in modalità allowlist **senza** voci
allowlist esplicite. I safe bin rifiutano argomenti file posizionali e token simili a percorsi, quindi
possono operare solo sul flusso in ingresso. Considera questo come un percorso rapido ristretto per
filtri di flusso, non come un elenco di attendibilità generale.

<Warning>
**Non** aggiungere binari interprete o runtime (per esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando può valutare codice,
eseguire sottocomandi o leggere file per progettazione, preferisci voci allowlist esplicite
e mantieni abilitati i prompt di approvazione. I safe bin personalizzati devono definire un profilo
esplicito in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bin predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se li abiliti, mantieni voci
allowlist esplicite per i loro workflow non stdin. Per `grep` in modalità safe-bin,
fornisci il pattern con `-e`/`--regexp`; la forma di pattern posizionale viene rifiutata
così gli operandi file non possono essere introdotti di nascosto come posizionali ambigui.

### Validazione argv e flag negati

La validazione è deterministica solo dalla forma di argv (nessun controllo di esistenza
sul filesystem host), il che impedisce comportamenti da oracolo di esistenza dei file dovuti a
differenze allow/deny. Le opzioni orientate ai file sono negate per i safe bin predefiniti; le
opzioni lunghe sono validate in modalità fail-closed (flag sconosciuti e abbreviazioni ambigue sono
rifiutati).

Flag negati per profilo safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I safe bin forzano inoltre i token argv a essere trattati come **testo letterale** al momento
dell'esecuzione (nessun globbing e nessuna espansione di `$VARS`) per i segmenti solo stdin, quindi pattern
come `*` o `$HOME/...` non possono essere usati per introdurre di nascosto letture di file.

### Directory binarie attendibili

I safe bin devono risolversi da directory binarie attendibili (predefiniti di sistema più
`tools.exec.safeBinTrustedDirs` opzionale). Le voci `PATH` non sono mai attendibili automaticamente.
Le directory attendibili predefinite sono intenzionalmente minime: `/bin`, `/usr/bin`. Se
l'eseguibile safe-bin si trova in percorsi di package manager/utente (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Concatenazione shell, wrapper e multiplexer

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello
soddisfa l'allowlist (inclusi safe bin o auto-allow delle Skills). Le redirezioni
restano non supportate in modalità allowlist. La sostituzione di comando (`$()` / backtick) viene
rifiutata durante il parsing allowlist, anche dentro virgolette doppie; usa virgolette singole
se ti serve testo letterale `$()`.

Nelle approvazioni dell'app companion su macOS, il testo shell grezzo che contiene sintassi di controllo o
espansione shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene
trattato come mancata corrispondenza allowlist a meno che il binario shell stesso non sia in allowlist.

Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con ambito richiesta sono
ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per decisioni `allow-always` in modalità allowlist, i wrapper di dispatch noti (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistono il percorso dell'eseguibile interno invece
del percorso del wrapper. I multiplexer shell (`busybox`, `toybox`) sono scartati per gli
applet shell (`sh`, `ash`, ecc.) nello stesso modo. Se un wrapper o multiplexer
non può essere scartato in sicurezza, nessuna voce allowlist viene persistita automaticamente.

Se aggiungi interpreti come `python3` o `node` all'allowlist, preferisci
`tools.exec.strictInlineEval=true` così l'eval inline richiede comunque un'approvazione
esplicita. In modalità strict, `allow-always` può ancora persistere invocazioni
interprete/script innocue, ma i carrier di inline-eval non vengono persistiti automaticamente.

### Safe bin rispetto ad allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Obiettivo        | Auto-consentire filtri stdin ristretti                 | Considerare attendibili esplicitamente eseguibili specifici                         |
| Tipo di match    | Nome eseguibile + policy argv safe-bin                 | Glob del percorso eseguibile risolto, o glob del nome comando semplice per comandi invocati tramite PATH |
| Ambito argomenti | Limitato dal profilo safe-bin e dalle regole sui token letterali | Match del percorso per impostazione predefinita; `argPattern` opzionale può limitare l'argv analizzato |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate                              |
| Uso migliore     | Trasformazioni testuali a basso rischio nelle pipeline | Qualsiasi strumento con comportamento più ampio o effetti collaterali              |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` per agente).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` per agente).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` per agente). Le chiavi profilo per agente sovrascrivono le chiavi globali.
- Le voci allowlist si trovano nel file locale all'host `~/.openclaw/exec-approvals.json` sotto `agents.<id>.allowlist` (o tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando bin interprete/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può predisporre voci personalizzate mancanti `safeBinProfiles.<bin>` come `{}` (rivedile e restringile dopo). I bin interprete/runtime non vengono predisposti automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900000__
Se abiliti esplicitamente `jq` in `safeBins`, OpenClaw rifiuta comunque il builtin `env` in modalità safe-bin
così `jq -n env` non può scaricare l'ambiente del processo host senza un percorso allowlist esplicito
o un prompt di approvazione.

## Comandi interprete/runtime

Le esecuzioni interprete/runtime basate su approvazione sono intenzionalmente conservative:

- Il contesto esatto argv/cwd/env è sempre vincolato.
- Le forme di script shell diretto e file runtime diretto sono vincolate al meglio a uno snapshot concreto di un singolo file locale.
- Le forme wrapper comuni dei package manager che si risolvono comunque a un singolo file locale diretto (per esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono scartate prima del binding.
- Se OpenClaw non può identificare esattamente un singolo file locale concreto per un comando interprete/runtime
  (per esempio script di package, forme eval, catene di loader specifiche del runtime o forme multi-file ambigue),
  l'esecuzione basata su approvazione viene negata invece di rivendicare una copertura semantica che non ha.
- Per questi workflow, preferisci sandboxing, un confine host separato o una allowlist/workflow completo esplicitamente attendibile
  in cui l'operatore accetta la semantica runtime più ampia.

Quando le approvazioni sono richieste, lo strumento exec restituisce immediatamente un id di approvazione. Usa quell'id per
correlare eventi di sistema successivi (`Exec finished` / `Exec denied`). Se nessuna decisione arriva prima del
timeout, la richiesta viene trattata come timeout di approvazione e presentata come motivo di rifiuto.

### Comportamento di consegna dei follow-up

Dopo il completamento di un exec async approvato, OpenClaw invia un turno `agent` di follow-up alla stessa sessione.

- Se esiste una destinazione di consegna esterna valida (canale consegnabile più target `to`), la consegna del follow-up usa quel canale.
- Nei flussi solo webchat o di sessione interna senza target esterno, la consegna del follow-up resta solo di sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente una consegna esterna strict senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, la consegna viene declassata a solo sessione invece di fallire.

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale chat (inclusi i canali Plugin) e approvarli
con `/approve`. Questo usa la normale pipeline di consegna in uscita.

Configurazione:
__OC_I18N_900001__
Rispondi in chat:
__OC_I18N_900002__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni Plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente invece le approvazioni Plugin.

### Inoltro delle approvazioni Plugin

L'inoltro delle approvazioni Plugin usa la stessa pipeline di consegna delle approvazioni exec ma ha una propria
configurazione indipendente sotto `approvals.plugin`. Abilitare o disabilitare una non influisce sull'altra.
__OC_I18N_900003__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano nello stesso modo.

I canali che supportano risposte interattive condivise renderizzano gli stessi pulsanti di approvazione sia per approvazioni exec sia
Plugin. I canali senza UI interattiva condivisa ricadono su testo semplice con istruzioni `/approve`.
Le richieste di approvazione Plugin possono limitare le decisioni disponibili. Le superfici di approvazione usano l'insieme di decisioni
dichiarato dalla richiesta e il Gateway rifiuta i tentativi di inviare una decisione che non era stata offerta.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o Plugin nasce da una superficie chat consegnabile, la stessa chat
ora può approvarla con `/approve` per impostazione predefinita. Questo si applica a canali come Slack, Matrix e
Microsoft Teams oltre ai flussi Web UI e UI terminale esistenti.

Questo percorso condiviso con comando testuale usa il normale modello di autenticazione del canale per quella conversazione. Se la
chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un
adattatore di consegna nativo separato solo per restare in sospeso.

Discord e Telegram supportano anche `/approve` nella stessa chat, ma quei canali usano comunque il loro
elenco di approvatori risolto per l'autorizzazione anche quando la consegna nativa delle approvazioni è disabilitata.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato agli errori "approvazione non trovata". Un vero
rifiuto/errore di approvazione exec non viene ritentato silenziosamente come approvazione Plugin.

### Consegna nativa delle approvazioni

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM degli approvatori, fanout della chat di origine e UX di approvazione interattiva specifica del canale sopra al flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili schede/pulsanti di approvazione nativi, quell'interfaccia nativa è il percorso principale rivolto all'agent. L'agent non dovrebbe anche ripetere un comando `/approve` duplicato in chat semplice, a meno che il risultato dello strumento non dica che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso rimasto.

Se un client di approvazione nativo è configurato ma non c'è un runtime nativo attivo per il canale di origine, OpenClaw mantiene visibile il prompt `/approve` locale deterministico. Se il runtime nativo è attivo e tenta la consegna, ma nessuna destinazione riceve la scheda, OpenClaw invia un avviso di fallback nella stessa chat con il comando esatto `/approve <id> <decision>` così che la richiesta possa comunque essere risolta.

Modello generico:

- la policy di esecuzione dell'host decide ancora se è richiesta l'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione ad altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client di approvazione nativo

I client di approvazione nativi abilitano automaticamente la consegna prima via DM quando tutte queste condizioni sono vere:

- il canale supporta la consegna nativa delle approvazioni
- gli approvatori possono essere risolti da `execApprovals.approvers` espliciti o dall'identità del proprietario, come `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzarne l'attivazione quando gli approvatori vengono risolti. La consegna pubblica alla chat di origine resta esplicita tramite `channels.<channel>.execApprovals.target`.

FAQ: [Perché ci sono due configurazioni di approvazione exec per le approvazioni via chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client di approvazione nativi aggiungono routing DM e fanout opzionale del canale sopra al flusso condiviso `/approve` nella stessa chat e ai pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat consegnabili simili usano il normale modello di autenticazione del canale per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, la destinazione nativa predefinita per la consegna sono i DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i pulsanti nativi Slack preservano il tipo di id di approvazione, quindi gli id `plugin:` possono risolvere le approvazioni dei plugin senza un secondo livello di fallback locale a Slack
- il routing nativo DM/canale di Matrix e le scorciatoie con reazioni gestiscono sia le approvazioni exec sia quelle dei plugin; l'autorizzazione dei plugin proviene comunque da `channels.matrix.dm.allowFrom`
- i prompt nativi di Matrix includono contenuto evento personalizzato `com.openclaw.approval` nel primo evento di prompt, così i client Matrix consapevoli di OpenClaw possono leggere lo stato di approvazione strutturato mentre i client standard mantengono il fallback `/approve` in testo semplice
- il richiedente non deve necessariamente essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti di approvazione nativi Discord instradano in base al tipo di id di approvazione: gli id `plugin:` vanno direttamente alle approvazioni dei plugin, tutto il resto va alle approvazioni exec
- i pulsanti di approvazione nativi Telegram seguono lo stesso fallback delimitato da exec a plugin di `/approve`
- quando `target` nativo abilita la consegna alla chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt ripiega su `askFallback`

I comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, usano il routing privato del proprietario per i prompt di approvazione e i risultati finali. OpenClaw prova prima una route privata sulla stessa superficie in cui il proprietario ha eseguito il comando. Se quella superficie non ha una route privata per il proprietario, ripiega sulla prima route proprietario disponibile da `commands.ownerAllowFrom`, così un comando di gruppo Discord può comunque inviare l'approvazione e il risultato al DM Telegram del proprietario quando Telegram è l'interfaccia privata primaria configurata. La chat di gruppo riceve solo un breve riconoscimento.

Telegram usa per impostazione predefinita i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando vuoi che i prompt di approvazione appaiano anche nella chat/topic Telegram di origine. Per gli argomenti dei forum Telegram, OpenClaw preserva l'argomento per il prompt di approvazione e per il follow-up successivo all'approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### flusso IPC macOS
__OC_I18N_900004__
Note sulla sicurezza:

- Modalità socket Unix `0600`, token archiviato in `exec-approvals.json`.
- Controllo peer con lo stesso UID.
- Challenge/response (nonce + token HMAC + hash richiesta) + TTL breve.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals) — policy centrale e flusso di approvazione
- [Strumento exec](/it/tools/exec)
- [Modalità elevata](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento di auto-consenso supportato da skill
