---
read_when:
    - Configurazione di bin sicuri o profili bin sicuri personalizzati
    - Inoltro delle approvazioni a Slack/Discord/Telegram o ad altri canali di chat
    - Implementazione di un client di approvazione nativo per un canale
summary: 'Approvazioni exec avanzate: binari sicuri, associazione dell’interprete, inoltro delle approvazioni, consegna nativa'
title: Approvazioni exec — avanzate
x-i18n:
    generated_at: "2026-06-27T18:19:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Argomenti avanzati sulle approvazioni exec: fast-path `safeBins`, binding di interprete/runtime
e inoltro delle approvazioni ai canali chat (inclusa la consegna nativa).
Per la policy di base e il flusso di approvazione, vedi [Approvazioni exec](/it/tools/exec-approvals).

## Binari sicuri (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo stdin** (per
esempio `cut`) che possono essere eseguiti in modalita' allowlist **senza** voci
allowlist esplicite. I binari sicuri rifiutano argomenti file posizionali e token simili a percorsi, quindi
possono operare solo sul flusso in ingresso. Consideralo un fast-path ristretto per
filtri di stream, non un elenco di attendibilita' generale.

<Warning>
Non aggiungere binari di interpreti o runtime (per esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando puo' valutare codice,
eseguire sottocomandi o leggere file per progettazione, preferisci voci allowlist esplicite
e mantieni abilitati i prompt di approvazione. I binari sicuri personalizzati devono definire un
profilo esplicito in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binari sicuri predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se scegli di abilitarli, mantieni voci
allowlist esplicite per i loro flussi di lavoro non stdin. Per `grep` in modalita' binario sicuro,
fornisci il pattern con `-e`/`--regexp`; la forma con pattern posizionale viene rifiutata
cosi' gli operandi file non possono essere introdotti come posizionali ambigui.

### Validazione argv e flag negati

La validazione e' deterministica solo in base alla forma di argv (nessun controllo di esistenza
del filesystem host), il che impedisce comportamenti da oracolo sull'esistenza dei file dovuti a
differenze tra allow/deny. Le opzioni orientate ai file sono negate per i binari sicuri predefiniti; le
opzioni lunghe sono validate in modo fail-closed (flag sconosciuti e abbreviazioni ambigue sono
rifiutati).

Flag negati per profilo di binario sicuro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I binari sicuri forzano inoltre i token argv a essere trattati come **testo letterale** al momento
dell'esecuzione (nessun globbing e nessuna espansione di `$VARS`) per i segmenti solo stdin, quindi pattern
come `*` o `$HOME/...` non possono essere usati per introdurre letture di file.

### Directory di binari attendibili

I binari sicuri devono risolversi da directory di binari attendibili (predefiniti di sistema piu'
`tools.exec.safeBinTrustedDirs` facoltativo). Le voci `PATH` non sono mai considerate attendibili automaticamente.
Le directory attendibili predefinite sono volutamente minime: `/bin`, `/usr/bin`. Se
il tuo eseguibile di binario sicuro si trova in percorsi di package manager/utente (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Concatenazione shell, wrapper e multiplexer

La concatenazione shell (`&&`, `||`, `;`) e' consentita quando ogni segmento di primo livello
soddisfa l'allowlist (inclusi binari sicuri o auto-allow delle skill). Le redirezioni
restano non supportate in modalita' allowlist. La sostituzione di comando (`$()` / backtick) e'
rifiutata durante il parsing allowlist, anche dentro virgolette doppie; usa virgolette singole
se ti serve testo letterale `$()`.

Nelle approvazioni companion-app su macOS, testo shell grezzo che contiene sintassi di controllo o
espansione shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) e'
trattato come mancata corrispondenza dell'allowlist a meno che il binario shell stesso non sia in allowlist.

Per wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con ambito richiesta sono
ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per decisioni `allow-always` in modalita' allowlist, i wrapper di dispatch noti (`env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono il percorso dell'eseguibile interno
invece del percorso del wrapper. I multiplexer shell (`busybox`, `toybox`) sono
scartati per gli applet shell (`sh`, `ash`, ecc.) nello stesso modo. Se un wrapper o
multiplexer non puo' essere scartato in sicurezza, nessuna voce allowlist viene persistita
automaticamente.

Se metti in allowlist interpreti come `python3` o `node`, preferisci
`tools.exec.strictInlineEval=true` cosi' l'eval inline richiede comunque un'approvazione
esplicita. In modalita' strict, `allow-always` puo' ancora persistere invocazioni
benigne di interprete/script, ma i carrier di inline-eval non sono persistiti
automaticamente.

### Binari sicuri rispetto ad allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Obiettivo        | Consentire automaticamente filtri stdin ristretti      | Considerare attendibili in modo esplicito eseguibili specifici                     |
| Tipo di match    | Nome eseguibile + policy argv del binario sicuro       | Glob del percorso eseguibile risolto, o glob del nome comando semplice per comandi invocati da PATH |
| Ambito argomenti | Limitato dal profilo del binario sicuro e dalle regole sui token letterali | Match del percorso per impostazione predefinita; `argPattern` facoltativo puo' limitare argv parsato |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate                              |
| Uso migliore     | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con comportamento piu' ampio o effetti collaterali             |

Posizione di configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` per agente).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` per agente).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` per agente). Le chiavi profilo per agente sovrascrivono le chiavi globali.
- Le voci allowlist vivono nel file delle approvazioni locale all'host sotto `agents.<id>.allowlist` (o tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando binari interprete/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` puo' creare lo scaffold delle voci personalizzate `safeBinProfiles.<bin>` mancanti come `{}` (rivedi e restringi dopo). I binari interprete/runtime non vengono scaffoldati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900000__
Se abiliti esplicitamente `jq` in `safeBins`, OpenClaw rifiuta comunque il builtin `env` in modalita' binario sicuro
cosi' `jq -n env` non puo' scaricare l'ambiente del processo host senza un percorso allowlist esplicito
o un prompt di approvazione.

## Comandi interprete/runtime

Le esecuzioni interprete/runtime supportate da approvazione sono intenzionalmente conservative:

- Il contesto argv/cwd/env esatto e' sempre vincolato.
- Le forme di script shell diretto e file runtime diretto sono vincolate best-effort a uno snapshot concreto di un file locale.
- Le forme wrapper comuni dei package manager che si risolvono comunque in un file locale diretto (per esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono scartate prima del binding.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando interprete/runtime
  (per esempio script di pacchetto, forme eval, catene di loader specifiche del runtime o forme multi-file ambigue),
  l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica che non ha.
- Per questi flussi di lavoro, preferisci sandboxing, un confine host separato o una allowlist esplicita attendibile/
  un flusso completo in cui l'operatore accetta le semantiche piu' ampie del runtime.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente un id approvazione. Usa quell'id per
correlare gli eventi di sistema di esecuzione approvata successivi (`Exec finished`, e `Exec running` quando configurato).
Se non arriva alcuna decisione prima del timeout, la richiesta viene trattata come timeout di approvazione e
mostrata come diniego terminale del comando host. Per approvazioni asincrone dell'agente principale con una sessione
di origine, OpenClaw riprende anche quella sessione con un followup interno cosi' l'agente osserva che
il comando non e' stato eseguito invece di correggere in seguito un risultato mancante.

### Comportamento di consegna del followup

Dopo che un exec asincrono approvato termina, OpenClaw invia un turno `agent` di followup alla stessa sessione.
Le approvazioni asincrone negate usano lo stesso percorso di followup della sessione principale per lo stato di diniego, ma
non registrano handoff runtime elevati e non eseguono il comando. I dinieghi senza una sessione principale riprendibile
sono soppressi oppure riportati tramite una route diretta sicura quando esiste.

- Se esiste una destinazione di consegna esterna valida (canale consegnabile piu' target `to`), la consegna del followup usa quel canale.
- Nei flussi solo webchat o sessione interna senza target esterno, la consegna del followup resta solo sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente consegna esterna strict senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` e' abilitato e non puo' essere risolto alcun canale esterno, la consegna viene declassata a solo sessione invece di fallire.

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale chat (inclusi i canali plugin) e approvarli
con `/approve`. Questo usa la normale pipeline di consegna in uscita.

Configurazione:
__OC_I18N_900001__
Rispondi in chat:
__OC_I18N_900002__
Il comando `/approve` gestisce sia approvazioni exec sia approvazioni plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente le approvazioni plugin.

### Inoltro delle approvazioni plugin

L'inoltro delle approvazioni plugin usa la stessa pipeline di consegna delle approvazioni exec ma ha una
configurazione indipendente sotto `approvals.plugin`. Abilitare o disabilitare una non influisce sull'altra.
Per il comportamento di authoring dei plugin, i campi richiesta e le semantiche delle decisioni, vedi
[Richieste di autorizzazione plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
La forma della configurazione e' identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano nello stesso modo.

I canali che supportano risposte interattive condivise renderizzano gli stessi pulsanti di approvazione sia per approvazioni exec sia per
approvazioni plugin. I canali senza UI interattiva condivisa ripiegano su testo semplice con istruzioni `/approve`.
Le richieste di approvazione plugin possono limitare le decisioni disponibili. Le superfici di approvazione usano l'insieme di decisioni
dichiarato dalla richiesta, e il Gateway rifiuta i tentativi di inviare una decisione che non era stata offerta.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o plugin ha origine da una superficie chat consegnabile, la stessa chat
puo' ora approvarla con `/approve` per impostazione predefinita. Questo si applica a canali come Slack, Matrix e
Microsoft Teams oltre ai flussi Web UI e terminal UI esistenti.

Questo percorso condiviso di comandi testuali usa il normale modello di autorizzazione del canale per quella conversazione. Se la chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un adattatore di recapito nativo separato solo per rimanere in sospeso.

Anche Discord e Telegram supportano `/approve` nella stessa chat, ma questi canali usano comunque l'elenco degli approvatori risolto per l'autorizzazione anche quando il recapito nativo delle approvazioni è disabilitato.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato agli errori di "approvazione non trovata". Un vero
rifiuto/errore di approvazione exec non viene ritentato silenziosamente come approvazione di un Plugin.

### Recapito nativo delle approvazioni

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM agli approvatori, fanout della chat di origine e UX interattiva di approvazione specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili schede/pulsanti di approvazione nativi, quell'interfaccia utente nativa è il percorso principale
rivolto all'agente. L'agente non dovrebbe anche ripetere un comando duplicato in chat semplice
`/approve`, a meno che il risultato dello strumento dica che le approvazioni via chat non sono disponibili o che
l'approvazione manuale è l'unico percorso rimanente.

Se un client di approvazione nativo è configurato ma non è attivo alcun runtime nativo per
il canale di origine, OpenClaw mantiene visibile il prompt deterministico locale `/approve`.
Se il runtime nativo è attivo e tenta il recapito ma nessun target riceve la scheda,
OpenClaw invia un avviso di fallback nella stessa chat con il comando esatto
`/approve <id> <decision>`, così la richiesta può comunque essere risolta.

Modello generico:

- la policy exec dell'host decide comunque se l'approvazione exec è richiesta
- `approvals.exec` controlla l'inoltro dei prompt di approvazione ad altre destinazioni di chat
- `channels.<channel>.execApprovals` controlla se i client nativi specifici per Discord, Slack, Telegram e canali simili
  sono abilitati
- le approvazioni dei Plugin Slack possono usare il client di approvazione nativo di Slack quando la richiesta arriva da Slack
  e gli approvatori del Plugin Slack vengono risolti; `approvals.plugin` può anche instradare le approvazioni dei Plugin a sessioni o target Slack anche quando le approvazioni exec Slack sono disabilitate
- le schede di approvazione native di Google Chat gestiscono approvazioni exec e dei Plugin originate da spazi o thread di Google
  Chat quando approvatori stabili `users/<id>` vengono risolti da `dm.allowFrom` o
  `defaultTo`; non usano eventi di reazione per le decisioni
- il recapito delle approvazioni tramite reazione in WhatsApp e Signal è controllato da `approvals.exec` e
  `approvals.plugin`; non hanno blocchi `channels.<channel>.execApprovals`

I client di approvazione nativi abilitano automaticamente il recapito prima via DM quando tutte queste condizioni sono vere:

- il canale supporta il recapito nativo delle approvazioni
- gli approvatori possono essere risolti da `execApprovals.approvers` espliciti o da un'identità
  del proprietario come `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzarlo
quando gli approvatori vengono risolti. Il recapito pubblico nella chat di origine resta esplicito tramite
`channels.<channel>.execApprovals.target`.

FAQ: [Perché ci sono due configurazioni di approvazione exec per le approvazioni via chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: configura approvatori stabili con `channels.googlechat.dm.allowFrom` o
  `channels.googlechat.defaultTo`; non è richiesto alcun blocco `execApprovals`
- WhatsApp: usa `approvals.exec` e `approvals.plugin` per instradare i prompt di approvazione a WhatsApp
- Signal: usa `approvals.exec` e `approvals.plugin` per instradare i prompt di approvazione a Signal

Questi client di approvazione nativi aggiungono instradamento DM e fanout di canale opzionale sopra il flusso condiviso
`/approve` nella stessa chat e i pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat recapitate simili usano il normale modello di autorizzazione del canale
  per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, il target predefinito di recapito nativo sono i DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i DM di approvazione dei Plugin Slack usano gli approvatori dei Plugin Slack da `allowFrom` e l'instradamento predefinito dell'account,
  non gli approvatori exec Slack
- i pulsanti nativi Slack preservano il tipo dell'id approvazione, quindi gli id `plugin:` possono risolvere approvazioni dei Plugin
  senza un secondo livello di fallback locale a Slack
- le schede native di Google Chat preservano il fallback manuale `/approve` nel testo del messaggio, ma le callback dei pulsanti della scheda
  trasportano solo token di azione opachi; id approvazione e decisione vengono recuperati dallo stato in sospeso lato server
- le approvazioni emoji di WhatsApp gestiscono sia prompt exec sia prompt dei Plugin solo quando la famiglia di inoltro di primo livello corrispondente
  è abilitata e instrada a WhatsApp; l'inoltro solo target a WhatsApp resta sul percorso di inoltro condiviso a meno che non corrisponda allo stesso target nativo di origine
- le approvazioni tramite reazione di Signal gestiscono sia prompt exec sia prompt dei Plugin solo quando la famiglia di inoltro di primo livello corrispondente
  è abilitata e instrada a Signal. Le approvazioni exec Signal dirette nella stessa chat possono
  sopprimere il fallback locale `/approve` senza approvatori espliciti; la risoluzione delle reazioni Signal
  richiede comunque approvatori Signal espliciti da `channels.signal.allowFrom` o `defaultTo`.
- l'instradamento DM/canale nativo di Matrix e le scorciatoie tramite reazione gestiscono sia approvazioni exec sia dei Plugin;
  l'autorizzazione dei Plugin proviene comunque da `channels.matrix.dm.allowFrom`
- i prompt nativi Matrix includono contenuto evento personalizzato `com.openclaw.approval` sul primo evento di prompt,
  così i client Matrix consapevoli di OpenClaw possono leggere lo stato strutturato dell'approvazione mentre i client standard
  mantengono il fallback `/approve` in testo semplice
- il richiedente non deve essere necessariamente un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti di approvazione nativi Discord instradano in base al tipo dell'id approvazione: gli id `plugin:` vanno
  direttamente alle approvazioni dei Plugin, tutto il resto va alle approvazioni exec
- i pulsanti di approvazione nativi Telegram seguono lo stesso fallback exec-a-Plugin limitato di `/approve`
- quando `target` nativo abilita il recapito nella chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna interfaccia operatore o client di approvazione configurato può accettare la richiesta, il prompt ripiega su `askFallback`

I comandi sensibili di gruppo riservati al proprietario, come `/diagnostics` e `/export-trajectory`, usano instradamento privato
del proprietario per i prompt di approvazione e i risultati finali. OpenClaw prova prima una rotta privata sulla
stessa superficie in cui il proprietario ha eseguito il comando. Se quella superficie non ha una rotta privata del proprietario, ripiega
sulla prima rotta proprietario disponibile da `commands.ownerAllowFrom`, così un comando di gruppo Discord
può comunque inviare approvazione e risultato al DM Telegram del proprietario quando Telegram è l'interfaccia privata
principale configurata. La chat di gruppo riceve solo una breve conferma.

Telegram usa per impostazione predefinita i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando vuoi che le richieste di approvazione appaiano anche nella chat/nell'argomento Telegram di origine. Per gli argomenti dei forum Telegram, OpenClaw mantiene l'argomento per la richiesta di approvazione e per il follow-up successivo all'approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900004__
Note di sicurezza:

- Modalità socket Unix `0600`, token archiviato in `exec-approvals.json`.
- Controllo peer con lo stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Domande frequenti

### Quando verrebbero usati `accountId` e `threadId` su una destinazione di approvazione?

Usa `accountId` quando il canale ha più identità configurate e la richiesta di approvazione deve uscire tramite un account specifico. Usa `threadId` quando la destinazione supporta argomenti o thread e la richiesta deve restare dentro quel thread invece che nella chat di livello superiore.

Un caso concreto di Telegram è un supergruppo operativo con argomenti del forum e due account bot Telegram. Il valore `to` indica il supergruppo, `accountId` seleziona l'account bot e `threadId` seleziona l'argomento del forum:
__OC_I18N_900005__
Con questa configurazione, le approvazioni exec inoltrate vengono pubblicate dall'account Telegram `ops-bot` nell'argomento `77` della chat `-1001234567890`. Una destinazione senza `accountId` usa l'account predefinito del canale, e una destinazione senza `threadId` pubblica nella destinazione di livello superiore.

### Quando le approvazioni vengono inviate a una sessione, chiunque in quella sessione può approvarle?

No. La consegna alla sessione controlla solo dove appare la richiesta. Da sola non autorizza ogni partecipante in quella chat ad approvare.

Per `/approve` generico nella stessa chat, il mittente deve essere già autorizzato per i comandi in quella sessione del canale. Se il canale espone approvatori espliciti per le approvazioni, tali approvatori possono autorizzare l'azione `/approve` anche quando non sono altrimenti autorizzati ai comandi in quella sessione.

Alcuni canali sono più restrittivi. Discord, Telegram, Matrix, i DM di approvazione nativi di Slack e client di approvazione nativi simili usano i loro elenchi di approvatori risolti per l'autorizzazione delle approvazioni. Per esempio, una richiesta di approvazione in un argomento del forum Telegram può essere visibile a tutti nell'argomento, ma solo gli ID utente numerici Telegram risolti da `channels.telegram.execApprovals.approvers` o `commands.ownerAllowFrom` possono approvarla o negarla.

## Correlati

- [Approvazioni exec](/it/tools/exec-approvals) — criterio di base e flusso di approvazione
- [Strumento exec](/it/tools/exec)
- [Modalità elevata](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento di autorizzazione automatica basato su skill
