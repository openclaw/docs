---
read_when:
    - Configurazione di Matrix in OpenClaw
    - Configurazione di Matrix E2EE e della verifica
summary: Stato del supporto Matrix, configurazione ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-04-05T13:47:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix è il plugin di canale Matrix incluso in OpenClaw.
Usa il `matrix-js-sdk` ufficiale e supporta DM, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix è distribuito come plugin incluso nelle attuali versioni di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se stai usando una build più vecchia o un'installazione personalizzata che esclude Matrix, installalo
manualmente:

Installa da npm:

```bash
openclaw plugins install @openclaw/matrix
```

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Vedi [Plugins](/tools/plugin) per il comportamento dei plugin e le regole di installazione.

## Configurazione

1. Assicurati che il plugin Matrix sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con uno dei seguenti:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il gateway.
5. Avvia un DM con il bot oppure invitalo in una stanza.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

Cosa chiede effettivamente la procedura guidata di Matrix:

- URL dell'homeserver
- metodo di autenticazione: token di accesso o password
- ID utente solo quando scegli l'autenticazione con password
- nome del dispositivo facoltativo
- se abilitare E2EE
- se configurare subito l'accesso alle stanze Matrix

Comportamenti importanti della procedura guidata:

- Se per l'account selezionato esistono già variabili d'ambiente di autenticazione Matrix e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre una scorciatoia tramite variabile d'ambiente e scrive solo `enabled: true` per quell'account.
- Quando aggiungi interattivamente un altro account Matrix, il nome dell'account inserito viene normalizzato nell'ID account usato nella configurazione e nelle variabili d'ambiente. Ad esempio, `Ops Bot` diventa `ops-bot`.
- I prompt della allowlist DM accettano immediatamente valori completi `@user:server`. I nomi visualizzati funzionano solo quando la ricerca live nella directory trova una corrispondenza esatta; altrimenti la procedura guidata ti chiede di riprovare con un ID Matrix completo.
- I prompt della allowlist delle stanze accettano direttamente ID stanza e alias. Possono anche risolvere in tempo reale i nomi delle stanze a cui si è uniti, ma i nomi non risolti vengono mantenuti solo come digitati durante la configurazione e successivamente vengono ignorati dalla risoluzione runtime della allowlist. Preferisci `!room:server` o `#alias:server`.
- L'identità runtime di stanza/sessione usa l'ID stanza Matrix stabile. Gli alias dichiarati nella stanza vengono usati solo come input di ricerca, non come chiave di sessione a lungo termine o identità stabile del gruppo.
- Per risolvere i nomi delle stanze prima di salvarli, usa `openclaw channels resolve --channel matrix "Project Room"`.

Configurazione minima basata su token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configurazione basata su password (il token viene memorizzato nella cache dopo il login):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix memorizza le credenziali nella cache in `~/.openclaw/credentials/matrix/`.
L'account predefinito usa `credentials.json`; gli account con nome usano `credentials-<account>.json`.

Equivalenti tramite variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Per gli account non predefiniti, usa variabili d'ambiente con ambito account:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Esempio per l'account `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Per l'ID account normalizzato `ops-bot`, usa:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix esegue l'escaping della punteggiatura negli ID account per evitare collisioni nelle variabili d'ambiente con ambito.
Ad esempio, `-` diventa `_X2D_`, quindi `ops-prod` diventa `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre la scorciatoia tramite variabile d'ambiente solo quando quelle variabili d'ambiente di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

## Esempio di configurazione

Questa è una configurazione base pratica con pairing DM, allowlist delle stanze ed E2EE abilitato:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Anteprime in streaming

Lo streaming delle risposte Matrix è opt-in.

Imposta `channels.matrix.streaming` su `"partial"` quando vuoi che OpenClaw invii una singola bozza di risposta,
modifichi quella bozza sul posto mentre il modello sta generando testo, e poi la finalizzi quando la risposta è
completa:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` è il valore predefinito. OpenClaw attende la risposta finale e la invia una sola volta.
- `streaming: "partial"` crea un unico messaggio di anteprima modificabile per il blocco corrente dell'assistente invece di inviare più messaggi parziali.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con `streaming: "partial"`, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando `streaming: "partial"` e `blockStreaming` è disattivato, Matrix modifica solo la bozza live e invia la risposta completata una volta terminato quel blocco o turno.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming dell'anteprima e torna alla normale consegna finale.
- Le risposte multimediali continuano a inviare normalmente gli allegati. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Le modifiche dell'anteprima comportano chiamate API Matrix aggiuntive. Lascia lo streaming disattivato se vuoi il comportamento più prudente rispetto ai limiti di frequenza.

`blockStreaming` da solo non abilita le anteprime bozza.
Usa `streaming: "partial"` per le modifiche delle anteprime; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi completati dell'assistente restino visibili come messaggi di avanzamento separati.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` in modo che le anteprime delle immagini vengano crittografate insieme all'allegato completo. Le stanze non crittografate continuano a usare `thumbnail_url` in chiaro. Non è richiesta alcuna configurazione — il plugin rileva automaticamente lo stato E2EE.

### Stanze bot-to-bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix OpenClaw configurati vengono ignorati.

Usa `allowBots` quando vuoi intenzionalmente traffico Matrix tra agenti:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati in stanze e DM consentiti.
- `allowBots: "mentions"` accetta quei messaggi solo quando menzionano visibilmente questo bot nelle stanze. I DM restano comunque consentiti.
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello di account per una stanza.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di autorisposta.
- Matrix qui non espone un flag bot nativo; OpenClaw considera "scritto da un bot" come "inviato da un altro account Matrix configurato su questo gateway OpenClaw".

Usa allowlist rigorose delle stanze e requisiti di menzione quando abiliti traffico bot-to-bot in stanze condivise.

Abilita la crittografia:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Controlla lo stato della verifica:

```bash
openclaw matrix verify status
```

Stato dettagliato (diagnostica completa):

```bash
openclaw matrix verify status --verbose
```

Includi la chiave di recupero memorizzata nell'output leggibile dalle macchine:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inizializza cross-signing e stato di verifica:

```bash
openclaw matrix verify bootstrap
```

Supporto multi-account: usa `channels.matrix.accounts` con credenziali per account e `name` facoltativo. Vedi [Configuration reference](/gateway/configuration-reference#multi-account-all-channels) per il modello condiviso.

Diagnostica dettagliata del bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forza un nuovo reset dell'identità cross-signing prima del bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verifica questo dispositivo con una chiave di recupero:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Dettagli verbosi della verifica del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Controlla lo stato di salute del backup delle chiavi della stanza:

```bash
openclaw matrix verify backup status
```

Diagnostica dettagliata dello stato di salute del backup:

```bash
openclaw matrix verify backup status --verbose
```

Ripristina le chiavi della stanza dal backup sul server:

```bash
openclaw matrix verify backup restore
```

Diagnostica dettagliata del ripristino:

```bash
openclaw matrix verify backup restore --verbose
```

Elimina il backup corrente sul server e crea una nuova baseline di backup. Se la chiave di
backup memorizzata non può essere caricata correttamente, questo reset può anche ricreare l'archiviazione dei segreti in modo che
i futuri avvii a freddo possano caricare la nuova chiave di backup:

```bash
openclaw matrix verify backup reset --yes
```

Tutti i comandi `verify` sono concisi per impostazione predefinita (incluso il logging interno dell'SDK in modalità silenziosa) e mostrano diagnostica dettagliata solo con `--verbose`.
Usa `--json` per l'output completo leggibile dalle macchine negli script.

Nelle configurazioni multi-account, i comandi CLI Matrix usano l'account predefinito implicito di Matrix a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount` oppure queste operazioni CLI implicite si fermeranno chiedendoti di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che le operazioni di verifica o sui dispositivi puntino esplicitamente a un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

### Cosa significa "verificato"

OpenClaw considera questo dispositivo Matrix verificato solo quando è verificato dalla tua identità cross-signing.
In pratica, `openclaw matrix verify status --verbose` espone tre segnali di fiducia:

- `Locally trusted`: questo dispositivo è attendibile solo per il client corrente
- `Cross-signing verified`: l'SDK segnala il dispositivo come verificato tramite cross-signing
- `Signed by owner`: il dispositivo è firmato dalla tua stessa chiave self-signing

`Verified by owner` diventa `yes` solo quando è presente la verifica cross-signing o la firma del proprietario.
La sola fiducia locale non è sufficiente perché OpenClaw tratti il dispositivo come completamente verificato.

### Cosa fa il bootstrap

`openclaw matrix verify bootstrap` è il comando di riparazione e configurazione per gli account Matrix crittografati.
Esegue tutte le seguenti operazioni in ordine:

- inizializza l'archiviazione dei segreti, riutilizzando una chiave di recupero esistente quando possibile
- inizializza il cross-signing e carica le chiavi pubbliche cross-signing mancanti
- tenta di contrassegnare e firmare con cross-signing il dispositivo corrente
- crea un nuovo backup lato server delle chiavi della stanza se non ne esiste già uno

Se l'homeserver richiede autenticazione interattiva per caricare le chiavi cross-signing, OpenClaw prova il caricamento prima senza autenticazione, poi con `m.login.dummy`, poi con `m.login.password` quando `channels.matrix.password` è configurato.

Usa `--force-reset-cross-signing` solo quando vuoi intenzionalmente scartare l'identità cross-signing corrente e crearne una nuova.

Se vuoi intenzionalmente scartare il backup corrente delle chiavi della stanza e avviare una nuova
baseline di backup per i messaggi futuri, usa `openclaw matrix verify backup reset --yes`.
Fallo solo se accetti che la vecchia cronologia crittografata non recuperabile rimanga
non disponibile e che OpenClaw possa ricreare l'archiviazione dei segreti se il segreto di backup corrente
non può essere caricato in sicurezza.

### Nuova baseline di backup

Se vuoi mantenere funzionanti i futuri messaggi crittografati e accetti di perdere la vecchia cronologia non recuperabile, esegui questi comandi nell'ordine indicato:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Aggiungi `--account <id>` a ogni comando quando vuoi indirizzarlo esplicitamente a un account Matrix con nome.

### Comportamento all'avvio

Quando `encryption: true`, Matrix imposta `startupVerification` su `"if-unverified"` per impostazione predefinita.
All'avvio, se questo dispositivo è ancora non verificato, Matrix richiederà l'autoverifica in un altro client Matrix,
salterà le richieste duplicate quando una è già in sospeso e applicherà un cooldown locale prima di riprovare dopo i riavvii.
Per impostazione predefinita, i tentativi di richiesta non riusciti vengono ritentati prima rispetto alla creazione riuscita della richiesta.
Imposta `startupVerification: "off"` per disabilitare le richieste automatiche all'avvio, oppure regola `startupVerificationCooldownHours`
se vuoi una finestra di ritentativo più breve o più lunga.

All'avvio viene inoltre eseguito automaticamente un passaggio prudente di bootstrap crittografico.
Quel passaggio cerca prima di riutilizzare l'archiviazione dei segreti e l'identità cross-signing correnti, ed evita di reimpostare il cross-signing a meno che tu non esegua un flusso esplicito di riparazione bootstrap.

Se all'avvio viene rilevato uno stato di bootstrap danneggiato e `channels.matrix.password` è configurato, OpenClaw può tentare un percorso di riparazione più rigoroso.
Se il dispositivo corrente è già firmato dal proprietario, OpenClaw preserva tale identità invece di reimpostarla automaticamente.

Aggiornamento dal precedente plugin Matrix pubblico:

- OpenClaw riutilizza automaticamente, quando possibile, lo stesso account Matrix, token di accesso e identità del dispositivo.
- Prima che vengano eseguite modifiche di migrazione Matrix che richiedono azione, OpenClaw crea o riutilizza uno snapshot di recupero in `~/Backups/openclaw-migrations/`.
- Se usi più account Matrix, imposta `channels.matrix.defaultAccount` prima di aggiornare dal vecchio layout flat-store in modo che OpenClaw sappia quale account debba ricevere quello stato legacy condiviso.
- Se il plugin precedente memorizzava localmente una chiave di decrittazione del backup delle chiavi delle stanze Matrix, l'avvio o `openclaw doctor --fix` la importeranno automaticamente nel nuovo flusso della chiave di recupero.
- Se il token di accesso Matrix è cambiato dopo che la migrazione era stata preparata, l'avvio ora esegue una scansione delle radici di archiviazione sibling hash del token per trovare lo stato di ripristino legacy in sospeso prima di rinunciare al ripristino automatico del backup.
- Se il token di accesso Matrix cambia successivamente per lo stesso account, homeserver e utente, OpenClaw ora preferisce riutilizzare la radice di archiviazione hash del token esistente più completa invece di partire da una directory di stato Matrix vuota.
- Al successivo avvio del gateway, le chiavi delle stanze sottoposte a backup vengono ripristinate automaticamente nel nuovo crypto store.
- Se il vecchio plugin aveva chiavi delle stanze solo locali che non erano mai state sottoposte a backup, OpenClaw avviserà chiaramente. Queste chiavi non possono essere esportate automaticamente dal precedente crypto store rust, quindi parte della vecchia cronologia crittografata potrebbe rimanere non disponibile finché non viene recuperata manualmente.
- Vedi [Matrix migration](/install/migrating-matrix) per il flusso completo di aggiornamento, i limiti, i comandi di recupero e i messaggi di migrazione più comuni.

Lo stato runtime crittografato è organizzato in radici per-account, per-utente, per-hash-del-token in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Quella directory contiene il sync store (`bot-storage.json`), il crypto store (`crypto/`),
il file della chiave di recupero (`recovery-key.json`), lo snapshot IndexedDB (`crypto-idb-snapshot.json`),
i binding dei thread (`thread-bindings.json`) e lo stato di verifica all'avvio (`startup-verification.json`)
quando queste funzionalità sono in uso.
Quando il token cambia ma l'identità dell'account rimane la stessa, OpenClaw riutilizza la migliore radice esistente
per quella tupla account/homeserver/utente così che il precedente stato di sincronizzazione, stato crittografico, binding dei thread
e stato di verifica all'avvio restino visibili.

### Modello Node crypto store

L'E2EE Matrix in questo plugin usa il percorso Rust crypto ufficiale di `matrix-js-sdk` in Node.
Quel percorso richiede una persistenza basata su IndexedDB quando vuoi che lo stato crittografico sopravviva ai riavvii.

OpenClaw al momento la fornisce in Node tramite:

- uso di `fake-indexeddb` come shim API IndexedDB richiesto dall'SDK
- ripristino del contenuto IndexedDB del crypto Rust da `crypto-idb-snapshot.json` prima di `initRustCrypto`
- persistenza del contenuto aggiornato di IndexedDB di nuovo in `crypto-idb-snapshot.json` dopo l'inizializzazione e durante il runtime
- serializzazione del ripristino e della persistenza dello snapshot rispetto a `crypto-idb-snapshot.json` con un lock file consultivo in modo che la persistenza runtime del gateway e la manutenzione CLI non entrino in competizione sullo stesso file snapshot

Si tratta di compatibilità/plumbing di archiviazione, non di un'implementazione crittografica personalizzata.
Il file snapshot è stato runtime sensibile ed è memorizzato con permessi file restrittivi.
Nel modello di sicurezza di OpenClaw, l'host gateway e la directory di stato locale di OpenClaw rientrano già nel perimetro attendibile dell'operatore, quindi questo è principalmente un aspetto di durabilità operativa piuttosto che un confine di fiducia remoto separato.

Miglioramento pianificato:

- aggiungere il supporto SecretRef per il materiale persistente delle chiavi Matrix in modo che le chiavi di recupero e i relativi segreti di crittografia dello store possano provenire dai provider di segreti OpenClaw invece che solo da file locali

## Gestione del profilo

Aggiorna l'autoprofilo Matrix per l'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi indirizzarlo esplicitamente a un account Matrix con nome.

Matrix accetta direttamente URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e salva l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nella sovrascrittura dell'account selezionato).

## Avvisi automatici di verifica

Matrix ora pubblica avvisi sul ciclo di vita della verifica direttamente nella rigorosa stanza DM di verifica come messaggi `m.notice`.
Questo include:

- avvisi di richiesta di verifica
- avvisi di verifica pronta (con istruzioni esplicite "Verifica tramite emoji")
- avvisi di inizio e completamento della verifica
- dettagli SAS (emoji e numeri decimali) quando disponibili

Le richieste di verifica in arrivo da un altro client Matrix vengono tracciate e accettate automaticamente da OpenClaw.
Per i flussi di autoverifica, OpenClaw avvia automaticamente anche il flusso SAS quando la verifica tramite emoji diventa disponibile e conferma automaticamente il proprio lato.
Per le richieste di verifica provenienti da un altro utente/dispositivo Matrix, OpenClaw accetta automaticamente la richiesta e poi attende che il flusso SAS proceda normalmente.
Devi comunque confrontare le emoji o il SAS decimale nel tuo client Matrix e confermare "Corrispondono" lì per completare la verifica.

OpenClaw non accetta automaticamente alla cieca i flussi duplicati avviati da sé. All'avvio salta la creazione di una nuova richiesta quando una richiesta di autoverifica è già in sospeso.

Gli avvisi di verifica di protocollo/sistema non vengono inoltrati alla pipeline di chat dell'agente, quindi non producono `NO_REPLY`.

### Igiene dei dispositivi

I vecchi dispositivi Matrix gestiti da OpenClaw possono accumularsi nell'account e rendere più difficile ragionare sulla fiducia nelle stanze crittografate.
Elencali con:

```bash
openclaw matrix devices list
```

Rimuovi i dispositivi OpenClaw obsoleti con:

```bash
openclaw matrix devices prune-stale
```

### Riparazione Direct Room

Se lo stato dei messaggi diretti va fuori sincronizzazione, OpenClaw può ritrovarsi con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

La riparazione mantiene la logica specifica di Matrix all'interno del plugin:

- preferisce un DM rigorosamente 1:1 che è già mappato in `m.direct`
- altrimenti ripiega su qualunque DM rigorosamente 1:1 a cui si è attualmente uniti con quell'utente
- se non esiste alcun DM integro, crea una nuova stanza diretta e riscrive `m.direct` per puntare a essa

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Seleziona solo il DM integro e aggiorna il mapping in modo che i nuovi invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti puntino di nuovo alla stanza corretta.

## Thread

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii dello strumento messaggi.

- `threadReplies: "off"` mantiene le risposte al livello superiore e conserva i messaggi in ingresso in thread sulla sessione padre.
- `threadReplies: "inbound"` risponde in un thread solo quando il messaggio in ingresso era già in quel thread.
- `threadReplies: "always"` mantiene le risposte nelle stanze in un thread radicato nel messaggio che ha attivato la risposta e instrada quella conversazione attraverso la sessione con ambito thread corrispondente fin dal primo messaggio attivante.
- `dm.threadReplies` sovrascrive l'impostazione di livello superiore solo per i DM. Ad esempio, puoi mantenere isolati i thread delle stanze mantenendo piatti i DM.
- I messaggi in ingresso nei thread includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii dello strumento messaggi ora ereditano automaticamente il thread Matrix corrente quando il target è la stessa stanza, o lo stesso target utente del DM, a meno che non venga fornito un `threadId` esplicito.
- I binding runtime dei thread sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` con binding al thread ora funzionano in stanze e DM Matrix.
- `/focus` Matrix di livello superiore in stanza/DM crea un nuovo thread Matrix e lo associa alla sessione target quando `threadBindings.spawnSubagentSessions=true`.
- Eseguire `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Stanze Matrix, DM e thread Matrix esistenti possono essere trasformati in workspace ACP persistenti senza cambiare la superficie di chat.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` nel DM Matrix, nella stanza o nel thread esistente che vuoi continuare a usare.
- In un DM o una stanza Matrix di livello superiore, il DM/la stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- All'interno di un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnAcpSessions` è richiesto solo per `/acp spawn --thread auto|here`, quando OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione Thread Binding

Matrix eredita i valori predefiniti globali da `session.threadBindings`, e supporta anche sovrascritture per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

I flag di generazione con binding ai thread di Matrix sono opt-in:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in ingresso e reazioni di conferma in ingresso.

- Gli strumenti di reazione in uscita sono controllati da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a uno specifico evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per uno specifico evento Matrix.
- `emoji=""` rimuove le reazioni dell'account bot stesso su quell'evento.
- `remove: true` rimuove solo la specifica reazione emoji dell'account bot.

L'ambito delle reazioni di conferma viene risolto nel seguente ordine standard di OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji di identità dell'agente

L'ambito della reazione di conferma viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità delle notifiche di reazione viene risolta in questo ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predefinito: `own`

Comportamento attuale:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando sono rivolti a messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disabilita gli eventi di sistema delle reazioni.
- Le rimozioni delle reazioni non vengono ancora sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni autonome di `m.reaction`.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza sono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente.
- Fa fallback a `messages.groupChat.historyLimit`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo della stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo in sospeso: OpenClaw bufferizza i messaggi della stanza che non hanno ancora attivato una risposta, quindi acquisisce uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; rimane nel corpo principale in ingresso di quel turno.
- I tentativi ripetuti dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di spostarsi in avanti verso messaggi della stanza più recenti.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come testo di risposta recuperato, radici dei thread e cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli attivi di allowlist della stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso stesso possa attivare una risposta.
L'autorizzazione del trigger continua a provenire dalle impostazioni `groupPolicy`, `groups`, `groupAllowFrom` e `dm.policy`.

## Esempio di policy per DM e stanze

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Vedi [Groups](/it/channels/groups) per il comportamento di mention-gating e allowlist.

Esempio di pairing per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a scriverti prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing in sospeso e può inviare di nuovo una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing DM e il layout di archiviazione.

## Approvazioni exec

Matrix può agire come client di approvazione exec per un account Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facoltativo; fa fallback a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni exec native quando `enabled` non è impostato oppure è `"auto"` e almeno un approvatore può essere risolto, da `execApprovals.approvers` oppure da `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. In caso contrario, le richieste di approvazione tornano ad altre route di approvazione configurate o alla policy di fallback delle approvazioni exec.

L'instradamento nativo Matrix oggi è solo per exec:

- `channels.matrix.execApprovals.*` controlla l'instradamento nativo DM/canale solo per le approvazioni exec.
- Le approvazioni dei plugin continuano a usare il `/approve` condiviso nella stessa chat più qualsiasi inoltro `approvals.plugin` configurato.
- Matrix può ancora riutilizzare `channels.matrix.dm.allowFrom` per l'autorizzazione delle approvazioni dei plugin quando può dedurre in sicurezza gli approvatori, ma non espone un percorso nativo separato di fanout DM/canale per le approvazioni dei plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione ai DM degli approvatori
- `target: "channel"` rinvia il prompt nella stanza Matrix o nel DM di origine
- `target: "both"` invia ai DM degli approvatori e nella stanza Matrix o nel DM di origine

Matrix oggi usa prompt di approvazione testuali. Gli approvatori li risolvono con `/approve <id> allow-once`, `/approve <id> allow-always` o `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. La consegna nel canale include il testo del comando, quindi abilita `channel` o `both` solo in stanze attendibili.

I prompt di approvazione Matrix riutilizzano il pianificatore condiviso delle approvazioni del core. La superficie nativa specifica di Matrix è solo il trasporto per le approvazioni exec: instradamento stanza/DM e comportamento di invio/aggiornamento/eliminazione dei messaggi.

Sovrascrittura per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Exec approvals](/tools/exec-approvals)

## Esempio multi-account

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

I valori di livello superiore `channels.matrix` agiscono come valori predefiniti per gli account con nome, a meno che un account non li sovrascriva.
Puoi limitare una voce stanza ereditata a un account Matrix con `groups.<room>.account` (o il legacy `rooms.<room>.account`).
Le voci senza `account` restano condivise tra tutti gli account Matrix, e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente nel livello superiore `channels.matrix.*`.
I valori predefiniti di autenticazione condivisa parziale non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di livello superiore solo quando quel predefinito ha autenticazione effettiva (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare individuabili da `homeserver` più `userId` quando le credenziali in cache soddisfano l'autenticazione in seguito.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave di account con nome esistente, la promozione di riparazione/configurazione da singolo account a multi-account preserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi Matrix di autenticazione/bootstrap vengono spostate in quell'account promosso; le chiavi condivise di policy di consegna restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per l'instradamento implicito, il probing e le operazioni CLI.
Se configuri più account con nome, imposta `defaultAccount` o passa `--account <id>` per i comandi CLI che si basano sulla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un singolo comando.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF a meno che non
effettui esplicitamente l'opt-in per account.

Se il tuo homeserver è eseguito su localhost, un IP LAN/Tailscale o un hostname interno, abilita
`allowPrivateNetwork` per quell'account Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Esempio di configurazione CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Questo opt-in consente solo target privati/interni attendibili. Gli homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Preferisci `https://` quando possibile.

## Proxy del traffico Matrix

Se il tuo deployment Matrix richiede un proxy HTTP(S) in uscita esplicito, imposta `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Gli account con nome possono sovrascrivere il valore predefinito di livello superiore con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix runtime e per le probe di stato dell'account.

## Risoluzione dei target

Matrix accetta queste forme di target ovunque OpenClaw ti chieda un target stanza o utente:

- Utenti: `@user:server`, `user:@user:server`, o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server`, o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, o `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix autenticato:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi ripiegano sulla ricerca nei nomi delle stanze a cui si è uniti per quell'account.
- La ricerca per nome delle stanze a cui si è uniti è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento della configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `allowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver si risolve in `localhost`, un IP LAN/Tailscale o un host interno come `matrix-synapse`.
- `proxy`: URL facoltativo del proxy HTTP(S) per il traffico Matrix. Gli account con nome possono sovrascrivere il valore predefinito di livello superiore con il proprio `proxy`.
- `userId`: ID utente Matrix completo, ad esempio `@bot:example.org`.
- `accessToken`: token di accesso per l'autenticazione basata su token. Sono supportati valori in chiaro e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` tramite provider env/file/exec. Vedi [Secrets Management](/gateway/secrets).
- `password`: password per il login basato su password. Sono supportati valori in chiaro e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per il login con password.
- `avatarUrl`: URL memorizzato dell'avatar del profilo per la sincronizzazione del profilo e gli aggiornamenti `set-profile`.
- `initialSyncLimit`: limite eventi della sincronizzazione iniziale.
- `encryption`: abilita E2EE.
- `allowlistOnly`: forza il comportamento solo allowlist per DM e stanze.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist`, o `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico delle stanze.
- Le voci `groupAllowFrom` devono essere ID utente Matrix completi. I nomi non risolti vengono ignorati a runtime.
- `historyLimit`: numero massimo di messaggi della stanza da includere come contesto della cronologia del gruppo. Fa fallback a `messages.groupChat.historyLimit`. Imposta `0` per disabilitare.
- `replyToMode`: `off`, `first`, o `all`.
- `markdown`: configurazione facoltativa del rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `partial`, `true`, o `false`. `partial` e `true` abilitano anteprime bozza a messaggio singolo con aggiornamenti sul posto.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi dell'assistente completati mentre lo streaming dell'anteprima bozza è attivo.
- `threadReplies`: `off`, `inbound`, o `always`.
- `threadBindings`: sovrascritture per canale per instradamento e ciclo di vita delle sessioni con binding ai thread.
- `startupVerification`: modalità automatica di richiesta di autoverifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare le richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione dei chunk dei messaggi in uscita.
- `chunkMode`: `length` o `newline`.
- `responsePrefix`: prefisso di messaggio facoltativo per le risposte in uscita.
- `ackReaction`: sovrascrittura facoltativa della reazione di conferma per questo canale/account.
- `ackReactionScope`: sovrascrittura facoltativa dell'ambito della reazione di conferma (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità delle notifiche di reazione in ingresso (`own`, `off`).
- `mediaMaxMb`: limite dimensione contenuti multimediali in MB per la gestione dei media Matrix. Si applica agli invii in uscita e all'elaborazione dei media in ingresso.
- `autoJoin`: policy di auto-join agli inviti (`always`, `allowlist`, `off`). Predefinito: `off`.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitante.
- `dm`: blocco di policy DM (`enabled`, `policy`, `allowFrom`, `threadReplies`).
- Le voci `dm.allowFrom` devono essere ID utente Matrix completi, a meno che tu non le abbia già risolte tramite ricerca live nella directory.
- `dm.threadReplies`: sovrascrittura della policy dei thread solo per DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di livello superiore sia per il posizionamento delle risposte sia per l'isolamento della sessione nei DM.
- `execApprovals`: consegna nativa delle approvazioni exec Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Facoltativo quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: sovrascritture nominate per account. I valori di livello superiore `channels.matrix` agiscono come predefiniti per queste voci.
- `groups`: mappa delle policy per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati a runtime. L'identità sessione/gruppo usa l'ID stanza stabile dopo la risoluzione, mentre le etichette leggibili rimangono basate sui nomi delle stanze.
- `groups.<room>.account`: limita una voce stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: sovrascrittura a livello stanza per mittenti bot configurati (`true` o `"mentions"`).
- `groups.<room>.users`: allowlist dei mittenti per stanza.
- `groups.<room>.tools`: sovrascritture per stanza di allow/deny degli strumenti.
- `groups.<room>.autoReply`: sovrascrittura a livello stanza del mention-gating. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza nuovamente.
- `groups.<room>.skills`: filtro facoltativo delle Skills a livello stanza.
- `groups.<room>.systemPrompt`: snippet facoltativo di system prompt a livello stanza.
- `rooms`: alias legacy per `groups`.
- `actions`: controllo per azione degli strumenti (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Channels Overview](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e mention gating
- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/gateway/security) — modello di accesso e hardening
