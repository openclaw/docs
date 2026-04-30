---
read_when:
    - Configurazione di contenitori sicuri o profili safe-bin personalizzati
    - Inoltro delle approvazioni a Slack/Discord/Telegram o ad altri canali di chat
    - Implementazione di un client di approvazione nativo per un canale
summary: 'Approvazioni exec avanzate: binari sicuri, associazione dell''interprete, inoltro delle approvazioni, consegna nativa'
title: Approvazioni exec — avanzate
x-i18n:
    generated_at: "2026-04-30T09:15:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Argomenti avanzati sulle approvazioni exec: il percorso rapido `safeBins`, l'associazione
di interprete/runtime e l'inoltro delle approvazioni ai canali chat (inclusa la consegna nativa).
Per la policy principale e il flusso di approvazione, consulta [Approvazioni exec](/it/tools/exec-approvals).

## Binari sicuri (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo stdin** (ad
esempio `cut`) che possono essere eseguiti in modalità allowlist **senza** voci
allowlist esplicite. I binari sicuri rifiutano argomenti file posizionali e token simili a percorsi, quindi
possono operare solo sullo stream in ingresso. Consideralo un percorso rapido ristretto per
filtri di stream, non un elenco di attendibilità generale.

<Warning>
**Non** aggiungere binari interprete o runtime (ad esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando può valutare codice,
eseguire sottocomandi o leggere file per progettazione, preferisci voci allowlist esplicite
e mantieni abilitate le richieste di approvazione. I binari sicuri personalizzati devono definire un profilo
esplicito in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binari sicuri predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se li abiliti, mantieni voci
allowlist esplicite per i loro workflow non stdin. Per `grep` in modalità binario sicuro,
fornisci il pattern con `-e`/`--regexp`; la forma con pattern posizionale viene rifiutata
così gli operandi file non possono essere introdotti come posizionali ambigui.

### Validazione argv e flag negati

La validazione è deterministica solo dalla forma di argv (nessun controllo di esistenza sul filesystem
host), il che impedisce comportamenti da oracolo sull'esistenza dei file dovuti a differenze
allow/deny. Le opzioni orientate ai file sono negate per i binari sicuri predefiniti; le opzioni
lunghe sono validate in modo fail-closed (flag sconosciuti e abbreviazioni ambigue vengono
rifiutati).

Flag negati per profilo di binario sicuro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I binari sicuri forzano anche i token argv a essere trattati come **testo letterale** al momento
dell'esecuzione (nessun globbing e nessuna espansione di `$VARS`) per segmenti solo stdin, quindi pattern
come `*` o `$HOME/...` non possono essere usati per introdurre letture di file.

### Directory di binari attendibili

I binari sicuri devono risolversi da directory di binari attendibili (predefinite di sistema più
`tools.exec.safeBinTrustedDirs` opzionale). Le voci `PATH` non vengono mai considerate attendibili automaticamente.
Le directory attendibili predefinite sono intenzionalmente minime: `/bin`, `/usr/bin`. Se
il tuo eseguibile di binario sicuro si trova in percorsi di package manager/utente (ad esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Concatenazione shell, wrapper e multiplexer

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello
soddisfa l'allowlist (inclusi binari sicuri o auto-allow delle Skills). I reindirizzamenti
restano non supportati in modalità allowlist. La sostituzione di comando (`$()` / backtick) viene
rifiutata durante il parsing dell'allowlist, anche dentro doppi apici; usa apici singoli
se hai bisogno di testo letterale `$()`.

Nelle approvazioni dell'app companion macOS, il testo shell grezzo che contiene sintassi di controllo o
di espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene
trattato come mancata corrispondenza dell'allowlist a meno che il binario shell stesso non sia in allowlist.

Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con ambito richiesta sono
ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per le decisioni `allow-always` in modalità allowlist, i wrapper di dispatch noti (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistono il percorso dell'eseguibile interno invece
del percorso del wrapper. I multiplexer shell (`busybox`, `toybox`) vengono estratti per
gli applet shell (`sh`, `ash`, ecc.) nello stesso modo. Se un wrapper o multiplexer
non può essere estratto in sicurezza, nessuna voce allowlist viene persistita automaticamente.

Se inserisci in allowlist interpreti come `python3` o `node`, preferisci
`tools.exec.strictInlineEval=true` così l'eval inline richiede comunque un'approvazione
esplicita. In modalità rigorosa, `allow-always` può comunque persistere invocazioni
interprete/script innocue, ma i carrier di eval inline non vengono persistiti
automaticamente.

### Binari sicuri rispetto ad allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Obiettivo        | Consentire automaticamente filtri stdin ristretti      | Considerare attendibili esplicitamente eseguibili specifici                         |
| Tipo match       | Nome eseguibile + policy argv del binario sicuro       | Glob del percorso eseguibile risolto, o glob del nome comando semplice per comandi invocati tramite PATH |
| Ambito argomenti | Limitato dal profilo del binario sicuro e dalle regole sui token letterali | Solo match del percorso; gli argomenti sono altrimenti responsabilità tua          |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate                              |
| Uso migliore     | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con comportamento più ampio o effetti collaterali              |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` per agente).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` per agente).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` per agente). Le chiavi dei profili per agente sovrascrivono le chiavi globali.
- le voci allowlist si trovano nel file locale host `~/.openclaw/exec-approvals.json` sotto `agents.<id>.allowlist` (o tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando binari interprete/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può creare lo scaffold delle voci `safeBinProfiles.<bin>` personalizzate mancanti come `{}` (rivedile e restringile dopo). I binari interprete/runtime non vengono creati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900000__
Se abiliti esplicitamente `jq` in `safeBins`, OpenClaw rifiuta comunque il builtin `env` in modalità binario sicuro
così `jq -n env` non può scaricare l'ambiente del processo host senza un percorso allowlist esplicito
o una richiesta di approvazione.

## Comandi interprete/runtime

Le esecuzioni interprete/runtime supportate da approvazione sono intenzionalmente conservative:

- Il contesto argv/cwd/env esatto viene sempre associato.
- Le forme di script shell diretto e file runtime diretto vengono associate best-effort a un singolo
  snapshot di file locale concreto.
- Le forme wrapper comuni dei package manager che si risolvono comunque a un file locale diretto (ad esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono estratte prima dell'associazione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando interprete/runtime
  (ad esempio script di package, forme eval, catene di loader specifiche del runtime o forme multi-file ambigue),
  l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica che non
  ha.
- Per questi workflow, preferisci sandboxing, un confine host separato o un workflow allowlist/completo
  esplicitamente attendibile in cui l'operatore accetta le semantiche runtime più ampie.

Quando le approvazioni sono richieste, lo strumento exec restituisce immediatamente un id di approvazione. Usa quell'id per
correlare eventi di sistema successivi (`Exec finished` / `Exec denied`). Se non arriva alcuna decisione prima del
timeout, la richiesta viene trattata come timeout di approvazione e mostrata come motivo di rifiuto.

### Comportamento di consegna follow-up

Dopo la conclusione di un exec asincrono approvato, OpenClaw invia un turno `agent` di follow-up alla stessa sessione.

- Se esiste un target di consegna esterno valido (canale consegnabile più target `to`), la consegna follow-up usa quel canale.
- Nei flussi solo webchat o di sessione interna senza target esterno, la consegna follow-up resta solo di sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente una consegna esterna rigorosa senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, la consegna viene declassata a solo sessione invece di fallire.

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare le richieste di approvazione exec a qualsiasi canale chat (inclusi canali Plugin) e approvarle
con `/approve`. Questo usa la normale pipeline di consegna in uscita.

Configurazione:
__OC_I18N_900001__
Rispondi in chat:
__OC_I18N_900002__
Il comando `/approve` gestisce sia approvazioni exec sia approvazioni Plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente invece le approvazioni Plugin.

### Inoltro delle approvazioni Plugin

L'inoltro delle approvazioni Plugin usa la stessa pipeline di consegna delle approvazioni exec ma ha una propria
configurazione indipendente sotto `approvals.plugin`. Abilitare o disabilitare una non influisce sull'altra.
__OC_I18N_900003__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise mostrano gli stessi pulsanti di approvazione sia per le approvazioni exec sia per le approvazioni
Plugin. I canali senza UI interattiva condivisa ripiegano su testo semplice con istruzioni
`/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o Plugin proviene da una superficie chat consegnabile, la stessa chat
può ora approvarla con `/approve` per impostazione predefinita. Questo si applica a canali come Slack, Matrix e
Microsoft Teams oltre ai flussi Web UI e terminal UI esistenti.

Questo percorso di comando testuale condiviso usa il normale modello di autenticazione del canale per quella conversazione. Se la
chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un
adattatore di consegna nativa separato solo per rimanere in sospeso.

Discord e Telegram supportano anche `/approve` nella stessa chat, ma quei canali usano comunque il loro
elenco di approvatori risolto per l'autorizzazione anche quando la consegna nativa delle approvazioni è disabilitata.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti "approval not found". Un vero
rifiuto/errore di approvazione exec non viene ritentato silenziosamente come approvazione Plugin.

### Consegna nativa delle approvazioni

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM agli approvatori, fanout nella chat di origine
e UX di approvazione interattiva specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili schede/pulsanti di approvazione nativi, tale UI nativa è il percorso principale
rivolto all'agente. L'agente non dovrebbe anche ripetere un comando di chat semplice
`/approve` duplicato, a meno che il risultato dello strumento dica che le approvazioni via chat non sono disponibili o che
l'approvazione manuale è l'unico percorso rimasto.

Se è configurato un client di approvazione nativo ma non è attivo alcun runtime nativo per
il canale di origine, OpenClaw mantiene visibile il prompt `/approve`
deterministico locale. Se il runtime nativo è attivo e tenta la consegna ma nessun
target riceve la scheda, OpenClaw invia un avviso di fallback nella stessa chat con il
comando esatto `/approve <id> <decision>`, così la richiesta può comunque essere risolta.

Modello generico:

- la policy exec dell'host decide comunque se è richiesta l'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione ad altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client di approvazione nativo

I client di approvazione nativi abilitano automaticamente la consegna DM-first quando tutte queste condizioni sono vere:

- il canale supporta la consegna di approvazioni native
- gli approvatori possono essere risolti da `execApprovals.approvers` espliciti o dall'identità
  del proprietario, come `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzare
l'abilitazione quando gli approvatori vengono risolti. La consegna alla chat pubblica di origine resta esplicita tramite
`channels.<channel>.execApprovals.target`.

FAQ: [Perché ci sono due configurazioni di approvazione exec per le approvazioni via chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client di approvazione nativi aggiungono routing DM e fanout opzionale del canale sopra il flusso condiviso
`/approve` nella stessa chat e i pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat recapitabili simili usano il normale modello di autenticazione del canale
  per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, il target di consegna nativo predefinito sono i DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i pulsanti nativi Slack preservano il tipo di id approvazione, quindi gli id `plugin:` possono risolvere le approvazioni Plugin
  senza un secondo livello di fallback locale a Slack
- il routing nativo DM/canale di Matrix e le scorciatoie di reazione gestiscono sia le approvazioni exec sia quelle Plugin;
  l'autorizzazione Plugin continua a provenire da `channels.matrix.dm.allowFrom`
- i prompt nativi Matrix includono il contenuto di evento personalizzato `com.openclaw.approval` sul primo evento
  di prompt, così i client Matrix compatibili con OpenClaw possono leggere lo stato di approvazione strutturato mentre i client standard
  mantengono il fallback `/approve` in testo semplice
- il richiedente non deve necessariamente essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti di approvazione nativi Discord instradano in base al tipo di id approvazione: gli id `plugin:` vanno
  direttamente alle approvazioni Plugin, tutto il resto va alle approvazioni exec
- i pulsanti di approvazione nativi Telegram seguono lo stesso fallback limitato da exec a Plugin di `/approve`
- quando il `target` nativo abilita la consegna alla chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o nessun client di approvazione configurato può accettare la richiesta, il prompt ricade su `askFallback`

I comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, usano il routing privato
del proprietario per i prompt di approvazione e i risultati finali. OpenClaw prova prima una rotta privata sulla
stessa superficie in cui il proprietario ha eseguito il comando. Se quella superficie non ha una rotta privata del proprietario, ricade
sulla prima rotta proprietario disponibile da `commands.ownerAllowFrom`, così un comando di gruppo Discord
può comunque inviare l'approvazione e il risultato al DM Telegram del proprietario quando Telegram è configurato come
interfaccia privata primaria. La chat di gruppo riceve solo un breve riscontro.

Telegram usa per impostazione predefinita i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando
vuoi che i prompt di approvazione compaiano anche nella chat/argomento Telegram di origine. Per gli argomenti dei forum Telegram,
OpenClaw preserva l'argomento per il prompt di approvazione e per il follow-up post-approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900004__
Note di sicurezza:

- modalità socket Unix `0600`, token archiviato in `exec-approvals.json`.
- controllo peer con stesso UID.
- challenge/response (nonce + token HMAC + hash richiesta) + TTL breve.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals) — policy principale e flusso di approvazione
- [Strumento exec](/it/tools/exec)
- [Modalità elevata](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento di auto-consenso basato su Skills
