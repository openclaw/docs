---
read_when:
    - Configurazione di binari sicuri o profili personalizzati per binari sicuri
    - Inoltro delle approvazioni a Slack/Discord/Telegram o ad altri canali di chat
    - Implementazione di un client nativo per le approvazioni in un canale
summary: 'Approvazioni exec avanzate: binari sicuri, associazione dell''interprete, inoltro delle approvazioni, distribuzione nativa'
title: Approvazioni di esecuzione — avanzate
x-i18n:
    generated_at: "2026-07-16T15:08:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Argomenti avanzati sull'approvazione dell'esecuzione: il percorso rapido `safeBins`, l'associazione dell'interprete/runtime
e l'inoltro delle approvazioni ai canali di chat (inclusa la consegna nativa).
Per i criteri di base e il flusso di approvazione, vedere [Approvazioni dell'esecuzione](/it/tools/exec-approvals).

## Binari sicuri (solo stdin)

`tools.exec.safeBins` indica i binari **solo stdin** (ad esempio `cut`) che
vengono eseguiti in modalità allowlist **senza** voci esplicite nell'allowlist. I binari sicuri rifiutano
gli argomenti di file posizionali e i token simili a percorsi, pertanto possono operare solo sul
flusso in ingresso. Va considerato un percorso rapido limitato per i filtri di flusso, non un
elenco generale di elementi attendibili.

<Warning>
**Non** aggiungere binari di interpreti o runtime (ad esempio `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Se un comando può valutare codice,
eseguire sottocomandi o leggere file per progettazione, preferire voci esplicite nell'allowlist
e mantenere abilitate le richieste di approvazione. I binari sicuri personalizzati devono definire un profilo esplicito
in `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binari sicuri predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono inclusi nell'elenco predefinito. Se si sceglie di abilitarli, mantenere voci
esplicite nell'allowlist per i relativi flussi di lavoro che non usano stdin. Per `grep` in modalità binario sicuro,
fornire il modello con `-e`/`--regexp`; la forma posizionale del modello viene rifiutata
affinché gli operandi di file non possano essere introdotti di nascosto come argomenti posizionali ambigui.

### Convalida di argv e flag negati

La convalida è deterministica e si basa esclusivamente sulla struttura di argv (senza verifiche
dell'esistenza nel file system dell'host), evitando così comportamenti da oracolo sull'esistenza dei file
derivanti dalle differenze tra autorizzazione e negazione. Le opzioni orientate ai file sono negate per i binari sicuri predefiniti; le opzioni
lunghe vengono convalidate in modalità fail-closed (i flag sconosciuti e le abbreviazioni ambigue vengono
rifiutati). I flag booleani riconosciuti di sola lettura dei binari predefiniti (ad esempio
`wc -l`, `tr -d`, `uniq -c`) vengono accettati, mentre i flag brevi non riconosciuti rimangono
in modalità fail-closed e richiedono l'approvazione manuale.

Flag negati per profilo di binario sicuro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I binari sicuri impongono inoltre che i token di argv vengano trattati come **testo letterale** durante l'esecuzione
(senza espansione dei caratteri jolly né di `$VARS`) per i segmenti solo stdin, pertanto
modelli come `*` o `$HOME/...` non possono essere usati per introdurre di nascosto letture di file. `awk`,
`sed` e `jq` sono sempre negati come binari sicuri perché la loro semantica non può essere
convalidata come solo stdin: `jq` può leggere dati di ambiente e caricare codice jq da
moduli o file di avvio. Per questi strumenti, usare una voce esplicita nell'allowlist o una richiesta di approvazione
anziché `safeBins`.

### Directory di binari attendibili

I binari sicuri devono essere risolti da directory di binari attendibili (valori predefiniti di sistema più
`tools.exec.safeBinTrustedDirs` facoltativo). Le voci `PATH` non sono mai considerate automaticamente attendibili.
Le directory attendibili predefinite sono intenzionalmente ridotte al minimo: `/bin`, `/usr/bin`. Se
l'eseguibile del binario sicuro si trova in percorsi utente o del gestore di pacchetti (ad esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungerli
esplicitamente a `tools.exec.safeBinTrustedDirs`.

### Concatenamento della shell, wrapper e multiplexer

Il concatenamento della shell (`&&`, `||`, `;`) è consentito quando ogni segmento di primo livello
soddisfa l'allowlist (inclusi i binari sicuri o l'autorizzazione automatica delle skill). I reindirizzamenti
rimangono non supportati in modalità allowlist. La sostituzione dei comandi (`$()` / accenti gravi) viene
rifiutata durante l'analisi dell'allowlist, anche all'interno delle virgolette doppie; usare le virgolette
singole se è necessario testo `$()` letterale.

Nelle approvazioni dell'app complementare per macOS, il testo della shell non elaborato contenente sintassi di controllo o
espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene
considerato come non corrispondente all'allowlist, a meno che il binario della shell stesso non sia incluso nell'allowlist.

Per i wrapper della shell (`bash|sh|zsh ... -c/-lc`), le sostituzioni delle variabili di ambiente limitate alla richiesta vengono
ridotte a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Per le decisioni `allow-always` in modalità allowlist, i wrapper di invio trasparenti
(ad esempio `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) memorizzano il
percorso dell'eseguibile interno anziché quello del wrapper. I multiplexer della shell
(`busybox`, `toybox`) vengono estratti per le applet della shell (`sh`, `ash`, ecc.) nello
stesso modo. Se un wrapper o un multiplexer non può essere estratto in sicurezza, nessuna voce nell'allowlist
viene memorizzata automaticamente.

Se si includono nell'allowlist interpreti come `python3` o `node`, preferire
`tools.exec.strictInlineEval=true` affinché la valutazione inline richieda comunque un'approvazione
esplicita. In modalità rigorosa, `allow-always` può comunque memorizzare invocazioni
innocue di interpreti/script, ma i vettori di valutazione inline non vengono memorizzati
automaticamente.

### Binari sicuri e allowlist a confronto

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Obiettivo        | Autorizzare automaticamente filtri stdin limitati      | Considerare esplicitamente attendibili eseguibili specifici                         |
| Tipo di corrispondenza | Nome dell'eseguibile + criteri argv del binario sicuro | Glob del percorso risolto dell'eseguibile o glob del solo nome del comando per i comandi invocati tramite PATH |
| Ambito degli argomenti | Limitato dal profilo del binario sicuro e dalle regole sui token letterali | Corrispondenza del percorso per impostazione predefinita; `argPattern` facoltativo può limitare argv analizzato |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate                                |
| Utilizzo ottimale | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con un comportamento più ampio o effetti collaterali            |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` per agente).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` per agente).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` per agente). Le chiavi del profilo per agente hanno la precedenza sulle chiavi globali.
- Le voci dell'allowlist risiedono nel file delle approvazioni locale dell'host in `agents.<id>.allowlist` (oppure tramite l'interfaccia di controllo / `openclaw approvals allowlist ...`).
- `openclaw security audit` genera l'avviso `tools.exec.safe_bins_interpreter_unprofiled` quando binari di interpreti/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può generare la struttura delle voci `safeBinProfiles.<bin>` personalizzate mancanti come `{}` (esaminarle e restringerle successivamente). I binari di interpreti/runtime non vengono generati automaticamente.

Esempio di profilo personalizzato:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Comandi di interpreti/runtime

Le esecuzioni di interpreti/runtime basate sull'approvazione sono intenzionalmente conservative:

- Il contesto esatto di argv/cwd/env viene sempre associato.
- Le forme con script di shell diretto e file di runtime diretto vengono associate, al meglio possibile, a una singola istantanea concreta di un file
  locale.
- Le forme comuni dei wrapper dei gestori di pacchetti che si risolvono comunque in un singolo file locale diretto (ad esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono estratte prima dell'associazione.
- Se OpenClaw non riesce a identificare esattamente un singolo file locale concreto per un comando di interprete/runtime
  (ad esempio script di pacchetto, forme di valutazione, catene di loader specifiche del runtime o forme ambigue con più file),
  l'esecuzione basata sull'approvazione viene negata anziché dichiarare una copertura semantica che non
  possiede.
- Per questi flussi di lavoro, preferire il sandboxing, un confine host separato o un flusso
  completo con allowlist esplicitamente attendibile, nel quale l'operatore accetti la semantica più ampia del runtime.

Quando sono richieste approvazioni, lo strumento di esecuzione restituisce immediatamente un ID di approvazione. Usare tale ID per
correlare i successivi eventi di sistema dell'esecuzione approvata (`Exec finished` e `Exec running`, quando configurato).
Se non viene ricevuta alcuna decisione prima del timeout, la richiesta viene considerata scaduta in attesa di approvazione e
segnalata come negazione terminale del comando host. Per le approvazioni asincrone dell'agente principale con una sessione
di origine, OpenClaw riprende inoltre tale sessione con un follow-up interno, affinché l'agente rilevi che
il comando non è stato eseguito anziché tentare in seguito di correggere un risultato mancante. Le approvazioni di esecuzione in sospeso scadono
dopo 30 minuti per impostazione predefinita.

### Comportamento della consegna dei follow-up

Al termine di un'esecuzione asincrona approvata, OpenClaw invia un turno di follow-up `agent` alla stessa sessione.
Le approvazioni asincrone negate usano lo stesso percorso di follow-up della sessione principale per lo stato di negazione, ma non
registrano passaggi di consegna con privilegi elevati al runtime e non eseguono il comando. Le negazioni senza una sessione principale
ripristinabile vengono soppresse oppure segnalate tramite un percorso diretto sicuro, quando disponibile.

- Se esiste una destinazione di consegna esterna valida (canale che supporta la consegna più destinazione `to`), la consegna del follow-up usa tale canale.
- Nei flussi solo webchat o nelle sessioni interne senza destinazione esterna, la consegna del follow-up rimane limitata alla sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente una consegna esterna rigorosa senza un canale esterno risolvibile, la richiesta non riesce e restituisce `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, la consegna viene declassata a una consegna limitata alla sessione anziché non riuscire.

## Inoltro delle approvazioni ai canali di chat

È possibile inoltrare le richieste di approvazione dell'esecuzione a qualsiasi canale di chat (inclusi i canali dei Plugin) e approvarle
con `/approve`. Questa operazione usa la normale pipeline di consegna in uscita.

Configurazione:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Risposta in chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Il comando `/approve` gestisce sia le approvazioni di esecuzione sia le approvazioni dei plugin. Se l'ID non corrisponde a un'approvazione di esecuzione in sospeso, verifica automaticamente le approvazioni dei plugin. Questo fallback è limitato agli errori «approvazione non trovata»; un effettivo rifiuto o errore dell'approvazione di esecuzione non provoca silenziosamente un nuovo tentativo come approvazione di un plugin.

### Inoltro delle approvazioni dei plugin

L'inoltro delle approvazioni dei plugin usa la stessa pipeline di consegna delle approvazioni di esecuzione, ma dispone di una configurazione
indipendente in `approvals.plugin`. L'abilitazione o la disabilitazione dell'una non influisce sull'altra.
Per il comportamento relativo alla creazione dei plugin, i campi delle richieste e la semantica delle decisioni, vedere
[Richieste di autorizzazione dei plugin](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

La struttura della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise mostrano gli stessi pulsanti di approvazione sia per le approvazioni di esecuzione sia per
quelle dei plugin. I canali privi di un'interfaccia interattiva condivisa ricorrono al testo semplice con istruzioni
`/approve`. Le richieste di approvazione dei plugin possono limitare le decisioni disponibili: le interfacce di approvazione usano
l'insieme di decisioni dichiarato dalla richiesta e il Gateway rifiuta i tentativi di inviare una decisione che non era
stata proposta.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione di esecuzione o di un plugin proviene da una superficie di chat abilitata alla consegna, per impostazione predefinita la stessa chat
può approvarla con `/approve`. Ciò si applica a Slack, Matrix, Microsoft Teams e
chat abilitate alla consegna analoghe, oltre ai flussi esistenti dell'interfaccia web e dell'interfaccia del terminale, usando il
normale modello di autenticazione del canale per tale conversazione. Se la chat di origine può già inviare comandi
e ricevere risposte, le richieste di approvazione non richiedono più un adattatore di consegna nativo separato solo per
rimanere in sospeso.

Anche Discord, Telegram e QQ bot supportano `/approve` nella stessa chat, ma questi canali continuano a usare il proprio
elenco di approvatori risolto per l'autorizzazione, anche quando la consegna nativa delle approvazioni è disabilitata.

### Consegna nativa delle approvazioni

Alcuni canali possono anche fungere da client di approvazione nativi: Discord, Slack, Telegram, Matrix e QQ bot.
I client nativi aggiungono messaggi diretti agli approvatori, distribuzione alla chat di origine ed esperienza utente interattiva di approvazione specifica del canale
al flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili schede o pulsanti di approvazione nativi, tale interfaccia nativa è il percorso principale rivolto all'agente.
L'agente non deve mostrare anche un comando di chat `/approve` duplicato in testo semplice, a meno che il risultato dello strumento non indichi
che le approvazioni tramite chat non sono disponibili o che l'approvazione manuale è l'unico percorso rimasto.

Se un client di approvazione nativo è configurato ma non è attivo alcun runtime nativo per il canale di origine,
OpenClaw mantiene visibile il prompt deterministico locale `/approve`. Se il runtime nativo è
attivo e tenta la consegna, ma nessuna destinazione riceve la scheda, OpenClaw invia nella stessa chat un avviso di fallback
con il comando `/approve <id> <decision>` esatto, affinché la richiesta possa comunque essere risolta.

Modello generico:

- la politica di esecuzione dell'host determina comunque se è richiesta l'approvazione di esecuzione
- `approvals.exec` controlla l'inoltro dei prompt di approvazione verso altre destinazioni di chat
- `channels.<channel>.execApprovals` controlla se i client nativi specifici del canale per Discord, Slack, Telegram, QQ bot e canali analoghi
  sono abilitati
- le approvazioni dei plugin Slack possono usare il client di approvazione nativo di Slack quando la richiesta proviene da Slack
  e gli approvatori dei plugin Slack vengono risolti; `approvals.plugin` può anche indirizzare le approvazioni dei plugin a sessioni
  o destinazioni Slack anche quando le approvazioni di esecuzione Slack sono disabilitate
- le schede di approvazione native di Google Chat gestiscono le approvazioni di esecuzione e dei plugin che provengono da spazi
  o thread Google Chat quando approvatori `users/<id>` stabili vengono risolti da `dm.allowFrom` o
  `defaultTo`; non usano eventi di reazione per le decisioni
- la consegna delle approvazioni mediante reazioni su WhatsApp e Signal è subordinata a `approvals.exec` e
  `approvals.plugin`; non dispongono di blocchi `channels.<channel>.execApprovals`

I client di approvazione nativi abilitano automaticamente la consegna prioritaria tramite messaggio diretto quando sono vere tutte le seguenti condizioni:

- il canale supporta la consegna nativa delle approvazioni
- gli approvatori possono essere risolti da `execApprovals.approvers` espliciti o dall'identità
  del proprietario, come `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Impostare `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Impostare `enabled: true` per forzarne
l'attivazione quando gli approvatori vengono risolti. La consegna pubblica alla chat di origine resta esplicita tramite
`channels.<channel>.execApprovals.target`. Quando `target` nativo abilita la consegna alla chat di origine,
i prompt di approvazione includono il testo del comando.

Domande frequenti: [Perché esistono due configurazioni delle approvazioni di esecuzione per le approvazioni tramite chat?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: configurare approvatori stabili con `channels.googlechat.dm.allowFrom` o
  `channels.googlechat.defaultTo`; non è richiesto alcun blocco `execApprovals`
- WhatsApp: usare `approvals.exec` e `approvals.plugin` per indirizzare i prompt di approvazione a WhatsApp
- Signal: usare `approvals.exec` e `approvals.plugin` per indirizzare i prompt di approvazione a Signal

Instradamento specifico dei client nativi:

- Telegram usa per impostazione predefinita i messaggi diretti agli approvatori (`target: "dm"`). Passare a `channel` o `both` per mostrare
  i prompt di approvazione anche nella chat o nell'argomento Telegram di origine. Per gli argomenti dei forum Telegram, OpenClaw
  mantiene l'argomento per il prompt di approvazione e per il messaggio successivo all'approvazione.
- gli approvatori Discord e Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti da
  `commands.ownerAllowFrom`; solo gli approvatori risolti possono approvare o rifiutare.
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da
  `commands.ownerAllowFrom`. I messaggi diretti per l'approvazione dei plugin Slack usano gli approvatori dei plugin Slack da `allowFrom`
  e l'instradamento predefinito dell'account, non gli approvatori delle esecuzioni Slack. I pulsanti nativi di Slack mantengono il tipo dell'ID di approvazione,
  pertanto gli ID `plugin:` possono risolvere le approvazioni dei plugin senza un secondo livello di fallback locale a Slack.
- le schede native di Google Chat mantengono nel testo del messaggio il fallback manuale `/approve`, ma i callback dei pulsanti
  delle schede trasportano soltanto token di azione opachi; l'ID di approvazione e la decisione vengono recuperati dallo
  stato in sospeso sul lato server.
- le approvazioni tramite emoji di WhatsApp gestiscono sia i prompt di esecuzione sia quelli dei plugin quando la famiglia di
  inoltro di primo livello corrispondente indirizza a WhatsApp. I prompt di origine nativi vengono associati direttamente; la consegna condivisa
  in modalità destinazione associa gli stessi metadati tipizzati dell'approvazione alla ricevuta del messaggio WhatsApp accettato.
- le approvazioni mediante reazione di Signal gestiscono sia i prompt di esecuzione sia quelli dei plugin solo quando la famiglia di inoltro di primo livello
  corrispondente è abilitata e indirizza a Signal. Le approvazioni di esecuzione Signal dirette nella stessa chat possono
  eliminare il fallback locale `/approve` senza approvatori espliciti; la risoluzione mediante reazione di Signal
  richiede comunque approvatori Signal espliciti da `channels.signal.allowFrom` o `defaultTo`.
- l'instradamento nativo di Matrix tramite messaggio diretto o canale e le scorciatoie mediante reazione gestiscono sia le approvazioni di esecuzione sia quelle dei plugin;
  l'autorizzazione dei plugin continua a provenire da `channels.matrix.dm.allowFrom`. I prompt nativi di Matrix
  includono il contenuto dell'evento personalizzato `com.openclaw.approval` nel primo evento del prompt, affinché i client
  Matrix compatibili con OpenClaw possano leggere lo stato strutturato dell'approvazione, mentre i client standard mantengono il fallback
  `/approve` in testo semplice.
- i pulsanti di approvazione nativi di Discord e Telegram trasportano un tipo esplicito di proprietario, esecuzione o plugin, nei
  dati di callback privati del trasporto e risolvono solo tale proprietario. I controlli `/approve` precedenti che non dispongono
  di un tipo restano un percorso di compatibilità limitato: tentano solo i tipi di proprietario che l'attore può approvare,
  proseguono esclusivamente dopo un risultato di approvazione non trovata e non deducono mai la proprietà dall'ID di approvazione.
- il richiedente non deve necessariamente essere un approvatore.
- se nessuna interfaccia dell'operatore o client di approvazione configurato può accettare la richiesta, il prompt ricorre a
  `askFallback`.

I comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, usano l'instradamento privato
del proprietario per i prompt di approvazione e i risultati finali. OpenClaw tenta innanzitutto un percorso privato sulla
stessa superficie in cui il proprietario ha eseguito il comando. Se tale superficie non dispone di un percorso privato del proprietario, ricorre
al primo percorso del proprietario disponibile da `commands.ownerAllowFrom`, così un comando di gruppo Discord
può comunque inviare l'approvazione e il risultato al messaggio diretto Telegram del proprietario quando Telegram è configurato come
interfaccia privata principale. La chat di gruppo riceve soltanto una breve conferma.

Vedere:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### App ufficiali per operatori mobili

Le app ufficiali per iOS e Android possono anche esaminare le approvazioni di esecuzione in sospeso
gestite dal Gateway quando viene usata una connessione `operator.admin` o quando il loro dispositivo
`operator.approvals` associato è stato esplicitamente indicato come destinazione dalla richiesta. Leggono
lo stesso record durevole e sanificato usato dalla
Control UI, inviano una decisione che tiene conto del tipo e mostrano il risultato canonico
della prima risposta del Gateway. Apple Watch riproduce questi prompt di approvazione tramite
l'iPhone associato, con azioni per consentire una volta o rifiutare. La modalità Gateway diretta di Watch
non esamina le approvazioni.

La perdita di una conferma della risoluzione non rende autorevole la scelta inviata:
l'app disabilita i controlli e legge nuovamente il record. Se ha prevalso un'altra superficie,
l'app mostra la decisione registrata. I prompt in sospeso restano associati al
Gateway che li ha emessi, pertanto il passaggio a un altro Gateway attivo non può reindirizzare un
vecchio ID di approvazione.

### Flusso IPC di macOS

```
Gateway -> Servizio Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             App Mac (UI + approvazioni + system.run)
```

Note sulla sicurezza:

- modalità del socket Unix `0600`, token archiviato in `exec-approvals.json`.
- verifica del peer con lo stesso UID.
- challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Domande frequenti

### Quando si userebbero `accountId` e `threadId` in una destinazione di approvazione?

Usare `accountId` quando il canale dispone di più identità configurate e il prompt di approvazione deve
essere inviato tramite un account specifico. Usare `threadId` quando la destinazione supporta argomenti o
thread e il prompt deve rimanere all'interno di tale thread invece che nella chat di primo livello.

Un caso concreto di Telegram è un supergruppo operativo con argomenti del forum e due account bot
Telegram. Il valore `to` identifica il supergruppo, `accountId` seleziona l'account bot e `threadId`
seleziona l'argomento del forum:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Con questa configurazione, le approvazioni di esecuzione inoltrate vengono pubblicate dall'account Telegram `ops-bot` nell'argomento
`77` della chat `-1001234567890`. Una destinazione senza `accountId` usa l'account predefinito del canale e
una destinazione senza `threadId` pubblica nella destinazione di primo livello.

### Quando le approvazioni vengono inviate a una sessione, chiunque partecipi alla sessione può approvarle?

No. L'invio alla sessione controlla solo dove appare la richiesta. Di per sé non autorizza ogni
partecipante alla chat ad approvare.

Per `/approve` generiche nella stessa chat, il mittente deve essere già autorizzato a eseguire comandi in quella
sessione del canale. Se il canale espone esplicitamente soggetti abilitati alle approvazioni, questi possono autorizzare
l'azione `/approve` anche se non sono altrimenti autorizzati a eseguire comandi nella sessione.

Alcuni canali applicano criteri più rigidi. I messaggi diretti di approvazione nativi di Discord, Telegram, Matrix e Slack, nonché altri
client di approvazione nativi analoghi, usano i rispettivi elenchi risolti di soggetti abilitati per l'autorizzazione delle approvazioni. Ad esempio,
una richiesta di approvazione in un argomento del forum di Telegram può essere visibile a tutti i partecipanti all'argomento, ma solo gli ID utente
Telegram numerici risolti da `channels.telegram.execApprovals.approvers` o
`commands.ownerAllowFrom` possono approvarla o rifiutarla.

## Argomenti correlati

- [Approvazioni di esecuzione](/it/tools/exec-approvals) — criteri principali e flusso di approvazione
- [Strumento di esecuzione](/it/tools/exec)
- [Modalità con privilegi elevati](/it/tools/elevated)
- [Skills](/it/tools/skills) — comportamento di autorizzazione automatica basato sulle skill
