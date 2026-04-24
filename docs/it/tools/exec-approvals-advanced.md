---
read_when:
    - Configurazione di safe bins o profili safe-bin personalizzati
    - Inoltro delle approvazioni a Slack/Discord/Telegram o ad altri canali chat
    - Implementazione di un client di approvazione nativo per un canale
summary: 'Approvazioni exec avanzate: binari sicuri, binding dell''interprete, inoltro delle approvazioni, consegna nativa'
title: Approvazioni exec — avanzato
x-i18n:
    generated_at: "2026-04-24T09:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Argomenti avanzati delle approvazioni exec: percorso rapido `safeBins`, binding di interpreti/runtime e inoltro delle approvazioni ai canali chat (inclusa la consegna nativa).
Per la policy di base e il flusso di approvazione, vedi [Approvazioni exec](/it/tools/exec-approvals).

## Safe bins (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo-stdin** (per
esempio `cut`) che possono essere eseguiti in modalità allowlist **senza** voci
allowlist esplicite. I safe bins rifiutano argomenti file posizionali e token simili a path, quindi
possono operare solo sul flusso in ingresso. Trattalo come un percorso rapido ristretto per filtri
stream, non come un elenco di trust generale.

<Warning>
**Non** aggiungere binari interprete o runtime (per esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando può valutare codice,
eseguire sottocomandi o leggere file per sua natura, preferisci voci allowlist esplicite
e mantieni abilitati i prompt di approvazione. I safe bins personalizzati devono definire un profilo esplicito in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Safe bins predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se fai opt-in, mantieni voci
allowlist esplicite per i loro flussi non-stdin. Per `grep` in modalità safe-bin,
fornisci il pattern con `-e`/`--regexp`; la forma di pattern posizionale viene rifiutata
così gli operandi file non possono essere fatti passare come posizionali ambigui.

### Validazione di argv e flag negati

La validazione è deterministica solo a partire dalla forma di argv (nessun controllo di esistenza del filesystem host),
il che previene il comportamento di oracolo sull'esistenza dei file dovuto a differenze tra allow e deny. Le opzioni orientate ai file vengono negate per i safe bins predefiniti; le
opzioni lunghe vengono validate in modalità fail-closed (flag sconosciuti e abbreviazioni ambigue vengono
rifiutati).

Flag negati per profilo safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I safe bins obbligano inoltre i token argv a essere trattati come **testo letterale** in fase di esecuzione
(nessun globbing e nessuna espansione `$VARS`) per i segmenti solo-stdin, così pattern
come `*` o `$HOME/...` non possono essere usati per far passare letture di file.

### Directory di binari attendibili

I safe bins devono risolversi da directory di binari attendibili (predefiniti di sistema più
`tools.exec.safeBinTrustedDirs` facoltativo). Le voci di `PATH` non sono mai automaticamente attendibili.
Le directory attendibili predefinite sono volutamente minime: `/bin`, `/usr/bin`. Se
il tuo eseguibile safe-bin si trova in percorsi package-manager/user (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Chaining della shell, wrapper e multiplexer

Il chaining della shell (`&&`, `||`, `;`) è consentito quando ogni segmento di primo livello
soddisfa la allowlist (inclusi safe bins o auto-allow dello Skills). Le redirezioni restano non supportate in modalità allowlist. La command substitution (`$()` / backticks) viene
rifiutata durante il parsing della allowlist, anche all'interno di doppi apici; usa apici singoli se ti serve testo letterale `$()`.

Nelle approvazioni dell'app companion macOS, il testo raw della shell che contiene sintassi di controllo o
espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene
trattato come una mancata corrispondenza della allowlist a meno che il binario shell stesso non sia in allowlist.

Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con ambito richiesta vengono
ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per le decisioni `allow-always` in modalità allowlist, i wrapper di dispatch noti (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistono il percorso dell'eseguibile interno invece
del percorso del wrapper. I multiplexer di shell (`busybox`, `toybox`) vengono scompattati per
le applet shell (`sh`, `ash`, ecc.) allo stesso modo. Se un wrapper o multiplexer non può
essere scompattato in sicurezza, nessuna voce allowlist viene persistita automaticamente.

Se metti in allowlist interpreti come `python3` o `node`, preferisci
`tools.exec.strictInlineEval=true` così l'eval inline richiede comunque un'approvazione esplicita. In modalità strict, `allow-always` può comunque persistere invocazioni benevole di interprete/script, ma i vettori inline-eval non vengono persistiti automaticamente.

### Safe bins versus allowlist

| Tema             | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Obiettivo        | Auto-allow di filtri stdin ristretti                   | Fidarsi esplicitamente di eseguibili specifici               |
| Tipo di corrispondenza | Nome dell'eseguibile + policy argv del safe-bin | Pattern glob del percorso dell'eseguibile risolto            |
| Ambito degli argomenti | Limitato dal profilo safe-bin e dalle regole dei token letterali | Solo corrispondenza del percorso; per il resto gli argomenti sono responsabilità tua |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate        |
| Uso migliore     | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con comportamento o effetti collaterali più ampi |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o per agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o per agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o per agente `agents.list[].tools.exec.safeBinProfiles`). Le chiavi dei profili per agente sovrascrivono quelle globali.
- Le voci allowlist vivono nel file locale dell'host `~/.openclaw/exec-approvals.json` sotto `agents.<id>.allowlist` (oppure tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando binari interprete/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può creare automaticamente le voci mancanti `safeBinProfiles.<bin>` come `{}` (poi rivedile e restringile). I binari interprete/runtime non vengono creati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900000__
Se fai esplicitamente opt-in di `jq` in `safeBins`, OpenClaw continua comunque a rifiutare il builtin `env` in modalità safe-bin così `jq -n env` non può scaricare l'ambiente di processo dell'host senza un percorso allowlist esplicito o un prompt di approvazione.

## Comandi interprete/runtime

Le esecuzioni di interprete/runtime supportate da approvazione sono volutamente conservative:

- Il contesto esatto di argv/cwd/env viene sempre associato.
- Le forme dirette di script shell e file runtime diretto sono associate in best-effort a un unico snapshot concreto del file locale.
- Le forme comuni di wrapper package-manager che si risolvono comunque in un unico file locale diretto (per esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono scompattate prima del binding.
- Se OpenClaw non riesce a identificare esattamente un unico file locale concreto per un comando interprete/runtime
  (per esempio script di package, forme eval, catene di loader specifiche del runtime o forme multi-file ambigue), l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica che in realtà non possiede.
- Per questi flussi di lavoro, preferisci sandboxing, un confine host separato oppure un workflow esplicito allowlist/full attendibile in cui l'operatore accetta la semantica di runtime più ampia.

Quando le approvazioni sono richieste, lo strumento exec restituisce immediatamente un id di approvazione. Usa quell'id per
correlare successivamente gli eventi di sistema (`Exec finished` / `Exec denied`). Se non arriva
alcuna decisione prima del timeout, la richiesta viene trattata come timeout di approvazione e visualizzata come motivo di rifiuto.

### Comportamento di consegna dei followup

Dopo che un exec asincrono approvato è terminato, OpenClaw invia un turno `agent` di followup alla stessa sessione.

- Se esiste un target di consegna esterno valido (canale consegnabile più target `to`), la consegna del followup usa quel canale.
- Nei flussi solo webchat o sessione interna senza target esterno, la consegna del followup resta solo di sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente una consegna esterna rigorosa senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non può essere risolto alcun canale esterno, la consegna viene degradata a solo sessione invece di fallire.

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale chat (inclusi i canali dei Plugin) e approvarli
con `/approve`. Questo usa il normale pipeline di consegna in uscita.

Configurazione:
__OC_I18N_900001__
Rispondi in chat:
__OC_I18N_900002__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni dei Plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente invece le approvazioni dei Plugin.

### Inoltro delle approvazioni dei Plugin

L'inoltro delle approvazioni dei Plugin usa lo stesso pipeline di consegna delle approvazioni exec ma ha una propria configurazione
indipendente sotto `approvals.plugin`. Abilitare o disabilitare l'uno non influisce sull'altro.
__OC_I18N_900003__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise renderizzano gli stessi pulsanti di approvazione sia per exec sia
per le approvazioni dei Plugin. I canali senza UI interattiva condivisa usano come fallback testo semplice con istruzioni `/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o Plugin proviene da una superficie chat consegnabile, la stessa chat
può ora approvarla con `/approve` per impostazione predefinita. Questo vale per canali come Slack, Matrix e
Microsoft Teams oltre ai flussi esistenti della Web UI e della terminal UI.

Questo percorso di comando testuale condiviso usa il normale modello auth del canale per quella conversazione. Se la
chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non richiedono più un adapter di consegna nativo separato solo per restare in sospeso.

Discord e Telegram supportano anch'essi `/approve` nella stessa chat, ma questi canali continuano a usare il
loro elenco di approvatori risolto per l'autorizzazione anche quando la consegna di approvazione nativa è disabilitata.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti “approvazione non trovata”. Un vero
rifiuto/errore di approvazione exec non ritenta silenziosamente come approvazione di Plugin.

### Consegna di approvazione nativa

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM agli approvatori, fanout sulla chat di origine e UX interattiva di approvazione specifica del canale sopra al flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale lato agente. L'agente non dovrebbe anche riecheggiare un comando semplice di chat
`/approve` duplicato a meno che il risultato dello strumento indichi che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso rimasto.

Modello generico:

- la policy exec dell'host continua a decidere se è richiesta un'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione verso altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client di approvazione nativo

I client di approvazione nativi abilitano automaticamente la consegna DM-first quando tutte queste condizioni sono vere:

- il canale supporta la consegna di approvazioni nativa
- gli approvatori possono essere risolti da `execApprovals.approvers` esplicito o dalle fonti di fallback documentate di quel canale
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzarne
l'attivazione quando gli approvatori vengono risolti. La consegna pubblica nella chat di origine resta esplicita tramite
`channels.<channel>.execApprovals.target`.

FAQ: [Perché esistono due configurazioni di approvazione exec per le approvazioni via chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client di approvazione nativi aggiungono instradamento DM e fanout opzionale sul canale sopra al flusso condiviso
`/approve` nella stessa chat e ai pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat consegnabili simili usano il normale modello auth del canale
  per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, il target di consegna nativo predefinito è costituito dai DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o inferiti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o inferiti dalla configurazione owner esistente (`allowFrom`, più `defaultTo` per messaggio diretto dove supportato)
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o inferiti da `commands.ownerAllowFrom`
- i pulsanti nativi Slack preservano il tipo di id di approvazione, quindi gli id `plugin:` possono risolvere approvazioni dei Plugin
  senza un secondo livello di fallback locale a Slack
- l'instradamento nativo DM/canale di Matrix e le scorciatoie con reazioni gestiscono sia le approvazioni exec sia quelle dei Plugin;
  l'autorizzazione dei Plugin continua comunque a provenire da `channels.matrix.dm.allowFrom`
- il richiedente non deve essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti nativi di approvazione Discord instradano in base al tipo di id di approvazione: gli id `plugin:` vanno
  direttamente alle approvazioni dei Plugin, tutto il resto va alle approvazioni exec
- i pulsanti nativi di approvazione Telegram seguono lo stesso fallback limitato da exec a Plugin di `/approve`
- quando `target` nativo abilita la consegna nella chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt usa come fallback `askFallback`

Telegram usa come predefinito i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando
vuoi che i prompt di approvazione compaiano anche nella chat/topic Telegram di origine. Per i topic forum Telegram,
OpenClaw preserva il topic per il prompt di approvazione e per il follow-up dopo l'approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900004__
Note di sicurezza:

- Modalità Unix socket `0600`, token memorizzato in `exec-approvals.json`.
- Controllo peer con stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals) — policy di base e flusso di approvazione
- [Strumento exec](/it/tools/exec)
- [Modalità elevata](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento di auto-allow supportato dagli Skills
