---
read_when:
    - Configurare bin sicuri o profili personalizzati di safe-bin
    - Inoltrare le approvazioni a Slack/Discord/Telegram o ad altri canali di chat
    - Implementare un client di approvazione nativo per un canale
summary: 'Approvazioni exec avanzate: bin sicuri, associazione dell''interprete, inoltro delle approvazioni, recapito nativo'
title: Approvazioni exec — avanzate
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:58:20Z"
  model: gpt-5.4
  provider: openai
  source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
  source_path: tools/exec-approvals-advanced.md
  workflow: 15
---

Argomenti avanzati delle approvazioni exec: il percorso rapido `safeBins`, l'associazione dell'interprete/runtime e l'inoltro delle approvazioni ai canali di chat (incluso il recapito nativo).
Per la policy di base e il flusso di approvazione, vedi [Exec approvals](/it/tools/exec-approvals).

## Safe bins (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo stdin** (per
esempio `cut`) che possono essere eseguiti in modalità allowlist **senza** voci
esplicite nell'allowlist. I safe bin rifiutano argomenti file posizionali e token simili a percorsi, quindi
possono operare solo sul flusso in ingresso. Trattalo come un percorso rapido limitato per
filtri di stream, non come un elenco generale di attendibilità.

<Warning>
**Non** aggiungere binari di interpreti o runtime (per esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando può valutare codice,
eseguire sottocomandi o leggere file per progettazione, preferisci voci esplicite nell'allowlist
e mantieni abilitati i prompt di approvazione. I safe bin personalizzati devono definire un profilo
esplicito in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bin predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se scegli di abilitarli, mantieni voci
esplicite nell'allowlist per i loro flussi di lavoro non basati su stdin. Per `grep` in modalità safe-bin,
fornisci il pattern con `-e`/`--regexp`; la forma del pattern posizionale viene rifiutata
così gli operandi file non possono essere introdotti di nascosto come posizionali ambigui.

### Validazione argv e flag negati

La validazione è deterministica in base alla sola forma di argv (nessun controllo di esistenza
del filesystem host), il che impedisce comportamenti da oracolo sull'esistenza dei file dovuti a
differenze tra consenti/nega. Le opzioni orientate ai file sono negate per i safe bin predefiniti; le
opzioni lunghe vengono validate in modalità fail-closed (flag sconosciuti e abbreviazioni ambigue vengono
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

### Directory di binari attendibili

I safe bin devono essere risolti da directory di binari attendibili (predefiniti di sistema più
l'opzionale `tools.exec.safeBinTrustedDirs`). Le voci di `PATH` non sono mai considerate attendibili automaticamente.
Le directory attendibili predefinite sono intenzionalmente minime: `/bin`, `/usr/bin`. Se
il tuo eseguibile safe-bin si trova in percorsi di package manager/utente (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Concatenazione shell, wrapper e multiplexer

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello
soddisfa l'allowlist (inclusi safe bin o auto-allow di Skills). Le redirezioni restano non supportate in
modalità allowlist. La sostituzione di comando (`$()` / backtick) viene rifiutata durante il parsing
dell'allowlist, anche all'interno di doppi apici; usa apici singoli se ti serve testo letterale `$()`.

Nelle approvazioni dell'app companion su macOS, il testo shell grezzo contenente sintassi di controllo o
espansione shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene
trattato come mancata corrispondenza dell'allowlist, a meno che il binario shell stesso non sia nell'allowlist.

Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), le sostituzioni env con ambito richiesta vengono
ridotte a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per le decisioni `allow-always` in modalità allowlist, i wrapper di dispatch noti (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistono il percorso dell'eseguibile interno invece
del percorso del wrapper. I multiplexer shell (`busybox`, `toybox`) vengono scartati per le
applet shell (`sh`, `ash`, ecc.) nello stesso modo. Se un wrapper o multiplexer non può essere
scartato in sicurezza, nessuna voce dell'allowlist viene persistita automaticamente.

Se metti nell'allowlist interpreti come `python3` o `node`, preferisci
`tools.exec.strictInlineEval=true` così l'eval inline richiede comunque un'approvazione esplicita.
In modalità strict, `allow-always` può comunque persistere invocazioni innocue di
interpreti/script, ma i vettori di eval inline non vengono persistiti automaticamente.

### Safe bins rispetto all'allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Obiettivo        | Consentire automaticamente filtri stdin limitati       | Considerare attendibili esplicitamente eseguibili specifici                        |
| Tipo di corrispondenza | Nome dell'eseguibile + policy argv del safe-bin   | Glob del percorso dell'eseguibile risolto, oppure glob del solo nome comando per comandi invocati tramite PATH |
| Ambito argomenti | Limitato dal profilo safe-bin e dalle regole sui token letterali | Solo corrispondenza del percorso; per il resto gli argomenti sono sotto la tua responsabilità |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate                              |
| Uso migliore     | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con comportamento più ampio o effetti collaterali              |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o per agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o per agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o per agente `agents.list[].tools.exec.safeBinProfiles`). Le chiavi per agente sovrascrivono le chiavi globali.
- Le voci dell'allowlist si trovano nel file locale dell'host `~/.openclaw/exec-approvals.json` sotto `agents.<id>.allowlist` (oppure tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando bin di interpreti/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può generare le voci mancanti `safeBinProfiles.<bin>` come `{}` (poi rivedile e rendile più restrittive). I bin di interpreti/runtime non vengono generati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900000__
Se abiliti esplicitamente `jq` in `safeBins`, OpenClaw rifiuta comunque il builtin `env` in modalità safe-bin
così `jq -n env` non può scaricare l'ambiente del processo host senza un percorso esplicito nell'allowlist
o un prompt di approvazione.

## Comandi di interprete/runtime

Le esecuzioni di interpreti/runtime supportate da approvazione sono intenzionalmente conservative:

- Il contesto esatto di argv/cwd/env è sempre associato.
- Le forme dirette di script shell e di file runtime vengono associate, per quanto possibile, a una singola istantanea concreta di file locale.
- Le comuni forme wrapper dei package manager che si risolvono comunque in un singolo file locale diretto (per esempio `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono scartate prima dell'associazione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando di interprete/runtime
  (per esempio script di package, forme eval, catene di loader specifiche del runtime o forme ambigue con più file),
  l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica che non può garantire.
- Per questi flussi di lavoro, preferisci sandboxing, un confine host separato oppure un flusso esplicito trusted
  allowlist/completo in cui l'operatore accetta la semantica più ampia del runtime.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente un id di approvazione. Usa quell'id per
correlare gli eventi di sistema successivi (`Exec finished` / `Exec denied`). Se non arriva alcuna decisione prima del
timeout, la richiesta viene trattata come timeout di approvazione e mostrata come motivo di negazione.

### Comportamento del recapito di followup

Dopo il completamento di un exec asincrono approvato, OpenClaw invia un turno `agent` di followup alla stessa sessione.

- Se esiste una destinazione di recapito esterna valida (canale consegnabile più target `to`), il recapito del followup usa quel canale.
- Nei flussi solo webchat o sessione interna senza una destinazione esterna, il recapito del followup resta solo sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente un recapito esterno strict senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, il recapito viene declassato a solo sessione invece di fallire.

## Inoltro delle approvazioni ai canali di chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale di chat (inclusi i canali Plugin) e approvarli
con `/approve`. Questo usa la normale pipeline di recapito in uscita.

Configurazione:
__OC_I18N_900001__
Rispondi nella chat:
__OC_I18N_900002__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni Plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente anche le approvazioni Plugin.

### Inoltro delle approvazioni Plugin

L'inoltro delle approvazioni Plugin usa la stessa pipeline di recapito delle approvazioni exec ma ha una propria
configurazione indipendente in `approvals.plugin`. L'abilitazione o la disabilitazione di una non influisce sull'altra.
__OC_I18N_900003__
La struttura della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise mostrano gli stessi pulsanti di approvazione sia per le approvazioni exec sia per quelle Plugin. I canali senza UI interattiva condivisa usano come fallback testo semplice con istruzioni `/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o Plugin ha origine da una superficie di chat consegnabile, la stessa chat
può ora approvarla con `/approve` per impostazione predefinita. Questo si applica a canali come Slack, Matrix e
Microsoft Teams oltre ai flussi già esistenti di Web UI e terminal UI.

Questo percorso condiviso basato su comandi testuali usa il normale modello di autenticazione del canale per quella
conversazione. Se la chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un adattatore di recapito nativo separato solo per restare in sospeso.

Discord e Telegram supportano anch'essi `/approve` nella stessa chat, ma questi canali continuano a usare il loro
elenco di approvatori risolto per l'autorizzazione anche quando il recapito nativo delle approvazioni è disabilitato.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti "approval not found". Un vero
rifiuto/errore di approvazione exec non viene ritentato silenziosamente come approvazione Plugin.

### Recapito nativo delle approvazioni

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM agli approvatori, fanout sulla chat di origine e UX di approvazione interattiva specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale
rivolto all'agente. L'agente non deve anche ripetere un comando semplice di chat
`/approve` duplicato, a meno che il risultato dello strumento non dica che le approvazioni via chat non sono disponibili o
che l'approvazione manuale è l'unico percorso rimasto.

Modello generico:

- la policy exec dell'host decide comunque se è richiesta l'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione ad altre destinazioni di chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client di approvazione nativo

I client di approvazione nativi abilitano automaticamente il recapito DM-first quando tutte queste condizioni sono vere:

- il canale supporta il recapito nativo delle approvazioni
- gli approvatori possono essere risolti da `execApprovals.approvers` espliciti o dalle
  sorgenti di fallback documentate di quel canale
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzarlo
quando gli approvatori vengono risolti. Il recapito pubblico nella chat di origine resta esplicito tramite
`channels.<channel>.execApprovals.target`.

FAQ: [Perché ci sono due configurazioni di approvazione exec per le approvazioni via chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client di approvazione nativi aggiungono routing DM e fanout opzionale del canale sopra il flusso condiviso
`/approve` nella stessa chat e i pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat consegnabili simili usano il normale modello di autenticazione del canale
  per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, la destinazione di recapito nativa predefinita è costituita dai DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti dalla configurazione owner esistente (`allowFrom`, più `defaultTo` dei messaggi diretti dove supportato)
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i pulsanti nativi Slack preservano il tipo di id di approvazione, quindi gli id `plugin:` possono risolvere le approvazioni Plugin
  senza un secondo livello di fallback locale Slack
- il routing DM/canale nativo di Matrix e le scorciatoie con reazioni gestiscono sia le approvazioni exec sia quelle Plugin;
  l'autorizzazione Plugin continua comunque a provenire da `channels.matrix.dm.allowFrom`
- il richiedente non deve essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti di approvazione nativi Discord instradano in base al tipo di id di approvazione: gli id `plugin:` vanno
  direttamente alle approvazioni Plugin, tutto il resto va alle approvazioni exec
- i pulsanti di approvazione nativi Telegram seguono lo stesso fallback limitato da exec a Plugin di `/approve`
- quando `target` nativo abilita il recapito nella chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt usa come fallback `askFallback`

Telegram usa come predefinito i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando
vuoi che i prompt di approvazione compaiano anche nella chat/topic Telegram di origine. Per i topic forum di Telegram,
OpenClaw preserva il topic per il prompt di approvazione e per il follow-up post-approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900004__
Note di sicurezza:

- Socket Unix in modalità `0600`, token memorizzato in `exec-approvals.json`.
- Controllo peer con stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Correlati

- [Exec approvals](/it/tools/exec-approvals) — policy di base e flusso di approvazione
- [Exec tool](/it/tools/exec)
- [Modalità elevata](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento auto-allow supportato da skill
