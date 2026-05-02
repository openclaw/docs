---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurazione di Matrix E2EE e della verifica
summary: Stato del supporto Matrix, configurazione iniziale ed esempi di configurazione
title: Matrice
x-i18n:
    generated_at: "2026-05-02T08:15:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un Plugin di canale scaricabile per OpenClaw.
Usa l'SDK ufficiale `matrix-js-sdk` e supporta DM, stanze, thread, media, reazioni, sondaggi, posizione ed E2EE.

## Installazione

Installa Matrix prima di configurare il canale:

```bash
openclaw plugins install @openclaw/matrix
```

Da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e abilita il Plugin, quindi non è necessario un passaggio separato `openclaw plugins enable matrix`. Il Plugin comunque non fa nulla finché non configuri il canale qui sotto. Consulta [Plugin](/it/tools/plugin) per il comportamento generale dei Plugin e le regole di installazione.

## Configurazione

1. Crea un account Matrix sul tuo homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`.
3. Riavvia il Gateway.
4. Avvia un DM con il bot oppure invitalo in una stanza (vedi [partecipazione automatica](#auto-join): i nuovi inviti vengono accettati solo quando `autoJoin` lo consente).

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata richiede: URL dell'homeserver, metodo di autenticazione (token di accesso o password), ID utente (solo autenticazione con password), nome dispositivo facoltativo, se abilitare E2EE e se configurare l'accesso alle stanze e la partecipazione automatica.

Se esistono già variabili di ambiente `MATRIX_*` corrispondenti e l'account selezionato non ha autenticazione salvata, la procedura guidata offre una scorciatoia tramite variabili di ambiente. Per risolvere i nomi delle stanze prima di salvare una allowlist, esegui `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE è abilitato, la procedura guidata scrive la configurazione ed esegue lo stesso bootstrap di [`openclaw matrix encryption setup`](#encryption-and-verification).

### Configurazione minima

Basata su token:

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

Basata su password (il token viene memorizzato nella cache dopo il primo accesso):

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

### Partecipazione automatica

Il valore predefinito di `channels.matrix.autoJoin` è `off`. Con il valore predefinito, il bot non comparirà in nuove stanze o DM da inviti recenti finché non partecipi manualmente.

OpenClaw non può sapere al momento dell'invito se una stanza invitata è un DM o un gruppo, quindi tutti gli inviti, inclusi quelli in stile DM, passano prima da `autoJoin`. `dm.policy` si applica solo dopo, quando il bot si è unito e la stanza è stata classificata.

<Warning>
Imposta `autoJoin: "allowlist"` più `autoJoinAllowlist` per limitare gli inviti accettati dal bot, oppure `autoJoin: "always"` per accettare ogni invito.

`autoJoinAllowlist` accetta solo destinazioni stabili: `!roomId:server`, `#alias:server` o `*`. I nomi di stanza semplici vengono rifiutati; le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitata.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Per accettare ogni invito, usa `autoJoin: "always"`.

### Formati delle destinazioni allowlist

Le allowlist di DM e stanze dovrebbero essere popolate con ID stabili:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. I nomi visualizzati vengono risolti solo quando la directory dell'homeserver restituisce esattamente una corrispondenza.
- Stanze (`groups`, `autoJoinAllowlist`): usa `!room:server` o `#alias:server`. I nomi vengono risolti al meglio rispetto alle stanze unite; le voci non risolte vengono ignorate in fase di esecuzione.

### Normalizzazione dell'ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato. Per esempio, `Ops Bot` diventa `ops-bot`. La punteggiatura viene sottoposta a escape nei nomi di variabili di ambiente con ambito, così due account non possono collidere: `-` → `_X2D_`, quindi `ops-prod` viene mappato a `MATRIX_OPS_X2D_PROD_*`.

### Credenziali nella cache

Matrix archivia le credenziali nella cache sotto `~/.openclaw/credentials/matrix/`:

- account predefinito: `credentials.json`
- account denominati: `credentials-<account>.json`

Quando sono presenti credenziali nella cache in quella posizione, OpenClaw considera Matrix configurato anche se il token di accesso non è nel file di configurazione: questo copre configurazione, `openclaw doctor` e sonde di stato del canale.

### Variabili di ambiente

Usate quando la chiave di configurazione equivalente non è impostata. L'account predefinito usa nomi senza prefisso; gli account denominati usano l'ID account inserito prima del suffisso.

| Account predefinito   | Account denominato (`<ID>` è l'ID account normalizzato) |
| --------------------- | ------------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                               |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                              |

Per l'account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. Le variabili di ambiente per la chiave di ripristino vengono lette dai flussi CLI consapevoli del ripristino (`verify backup restore`, `verify device`, `verify bootstrap`) quando passi la chiave tramite pipe con `--recovery-key-stdin`.

`MATRIX_HOMESERVER` non può essere impostato da un file `.env` dell'area di lavoro; consulta [File `.env` dell'area di lavoro](/it/gateway/security).

## Esempio di configurazione

Una base pratica con associazione DM, allowlist di stanze ed E2EE:

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
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
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

## Anteprime streaming

Lo streaming delle risposte Matrix è opzionale. `streaming` controlla come OpenClaw consegna la risposta dell'assistente in corso; `blockStreaming` controlla se ogni blocco completato viene preservato come messaggio Matrix autonomo.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Per mantenere le anteprime delle risposte in tempo reale ma nascondere le righe intermedie di strumenti/progresso, usa la forma a oggetto:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`           | Comportamento                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predefinito) | Attende la risposta completa e la invia una volta. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`           | Modifica sul posto un normale messaggio di testo mentre il modello scrive il blocco corrente. I client Matrix standard possono notificare alla prima anteprima, non alla modifica finale. |
| `"quiet"`             | Uguale a `"partial"`, ma il messaggio è un avviso senza notifica. I destinatari ricevono una notifica solo quando una regola push per utente corrisponde alla modifica finalizzata (vedi sotto). |

`blockStreaming` è indipendente da `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (predefinito)                         |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `"partial"` / `"quiet"` | Bozza live per il blocco corrente, blocchi completati mantenuti come messaggi | Bozza live per il blocco corrente, finalizzata sul posto       |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco completato              | Un messaggio Matrix con notifica per la risposta completa      |

Note:

- Se un'anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell'anteprima e ripiega sulla consegna solo finale.
- Le risposte multimediali inviano sempre gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Gli aggiornamenti di anteprima del progresso degli strumenti sono abilitati per impostazione predefinita quando lo streaming di anteprima Matrix è attivo. Imposta `streaming.preview.toolProgress: false` per mantenere le modifiche di anteprima per il testo della risposta ma lasciare il progresso degli strumenti nel percorso di consegna normale.
- Le modifiche di anteprima costano chiamate API Matrix aggiuntive. Lascia `streaming: "off"` se vuoi il profilo di limitazione della frequenza più conservativo.

## Metadati di approvazione

I prompt di approvazione nativi Matrix sono normali eventi `m.room.message` con contenuto evento personalizzato specifico di OpenClaw sotto `com.openclaw.approval`. Matrix consente chiavi di contenuto evento personalizzate, quindi i client standard continuano a mostrare il corpo testuale mentre i client consapevoli di OpenClaw possono leggere ID, tipo, stato, decisioni disponibili e dettagli di esecuzione/Plugin strutturati dell'approvazione.

Quando un prompt di approvazione è troppo lungo per un singolo evento Matrix, OpenClaw divide il testo visibile in blocchi e allega `com.openclaw.approval` solo al primo blocco. Le reazioni per le decisioni di consentire/rifiutare sono vincolate a quel primo evento, quindi i prompt lunghi mantengono la stessa destinazione di approvazione dei prompt a evento singolo.

### Regole push self-hosted per anteprime finalizzate silenziose

`streaming: "quiet"` notifica i destinatari solo quando un blocco o turno viene finalizzato: una regola push per utente deve corrispondere al marcatore di anteprima finalizzata. Consulta [Regole push Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la procedura completa (token destinatario, controllo pusher, installazione regola, note per homeserver).

## Stanze bot-a-bot

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
- `allowBots: "mentions"` accetta quei messaggi solo quando menzionano visibilmente questo bot nelle stanze. I DM sono comunque consentiti.
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello di account per una stanza.
- OpenClaw ignora comunque i messaggi provenienti dallo stesso ID utente Matrix per evitare cicli di auto-risposta.
- Matrix non espone qui un flag bot nativo; OpenClaw tratta "scritto da bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist di stanze rigorose e requisiti di menzione quando abiliti il traffico bot-a-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze cifrate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` in modo che le anteprime delle immagini siano cifrate insieme all'allegato completo. Le stanze non cifrate usano ancora `thumbnail_url` semplice. Non è necessaria alcuna configurazione: il Plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile da macchina) e `--account <id>` (configurazioni multi-account). L'output è conciso per impostazione predefinita, con logging interno SDK silenzioso. Gli esempi qui sotto mostrano la forma canonica; aggiungi i flag secondo necessità.

### Abilita crittografia

```bash
openclaw matrix encryption setup
```

Avvia l'archiviazione dei segreti e la firma incrociata, crea un backup delle chiavi delle stanze se necessario, quindi stampa stato e passaggi successivi. Flag utili:

- `--recovery-key <key>` applica una chiave di recupero prima dell'avvio (preferisci la forma tramite stdin documentata sotto)
- `--force-reset-cross-signing` scarta l'identità di firma incrociata corrente e ne crea una nuova (usare solo intenzionalmente)

Per un nuovo account, abilita E2EE al momento della creazione:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` è un alias per `--enable-e2ee`.

Equivalente di configurazione manuale:

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

### Stato e segnali di attendibilità

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` segnala tre segnali di attendibilità indipendenti (`--verbose` li mostra tutti):

- `Locally trusted`: attendibile solo da questo client
- `Cross-signing verified`: l'SDK segnala la verifica tramite firma incrociata
- `Signed by owner`: firmato dalla tua chiave di auto-firma (solo diagnostica)

`Verified by owner` diventa `yes` solo quando `Cross-signing verified` è `yes`. L'attendibilità locale o una firma del proprietario da sola non è sufficiente.

`--allow-degraded-local-state` restituisce diagnostica best-effort senza preparare prima l'account Matrix; utile per sonde offline o configurate parzialmente.

### Verificare questo dispositivo con una chiave di recupero

La chiave di recupero è sensibile: passala tramite stdin invece che sulla riga di comando. Imposta `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` per un account con nome):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando segnala tre stati:

- `Recovery key accepted`: Matrix ha accettato la chiave per l'archiviazione dei segreti o l'attendibilità del dispositivo.
- `Backup usable`: il backup delle chiavi delle stanze può essere caricato con il materiale di recupero attendibile.
- `Device verified by owner`: questo dispositivo dispone della piena attendibilità dell'identità Matrix con firma incrociata.

Termina con codice diverso da zero quando l'attendibilità completa dell'identità è incompleta, anche se la chiave di recupero ha sbloccato il materiale di backup. In tal caso, completa l'auto-verifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Cross-signing verified: yes` prima di terminare correttamente. Usa `--timeout-ms <ms>` per regolare l'attesa.

È accettata anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave finisce nella cronologia della shell.

### Avviare o riparare la firma incrociata

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` è il comando di riparazione e configurazione per gli account cifrati. Nell'ordine:

- avvia l'archiviazione dei segreti, riutilizzando una chiave di recupero esistente quando possibile
- avvia la firma incrociata e carica le chiavi pubbliche mancanti
- contrassegna e firma in modo incrociato il dispositivo corrente
- crea un backup lato server delle chiavi delle stanze se non ne esiste già uno

Se l'homeserver richiede UIA per caricare le chiavi di firma incrociata, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, quindi `m.login.password` (richiede `channels.matrix.password`).

Flag utili:

- `--recovery-key-stdin` (da usare con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` per scartare l'identità di firma incrociata corrente (solo intenzionalmente)

### Backup delle chiavi delle stanze

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se esiste un backup lato server e se questo dispositivo può decifrarlo. `backup restore` importa le chiavi delle stanze salvate nel backup nell'archivio crittografico locale; se la chiave di recupero è già su disco, puoi omettere `--recovery-key-stdin`.

Per sostituire un backup danneggiato con una base di riferimento nuova (accetta la perdita della vecchia cronologia non recuperabile; può anche ricreare l'archiviazione dei segreti se il segreto del backup corrente non è caricabile):

```bash
openclaw matrix verify backup reset --yes
```

Aggiungi `--rotate-recovery-key` solo quando vuoi intenzionalmente che la chiave di recupero precedente smetta di sbloccare la nuova base di backup.

### Elencare, richiedere e rispondere alle verifiche

```bash
openclaw matrix verify list
```

Elenca le richieste di verifica in sospeso per l'account selezionato.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Invia una richiesta di verifica da questo account OpenClaw. `--own-user` richiede l'auto-verifica (accetti il prompt in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` puntano a qualcun altro. `--own-user` non può essere combinato con gli altri flag di destinazione.

Per la gestione del ciclo di vita di livello più basso, in genere mentre si seguono richieste in ingresso da un altro client, questi comandi agiscono su una richiesta specifica `<id>` (stampata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accetta una richiesta in ingresso                                   |
| `openclaw matrix verify start <id>`        | Avvia il flusso SAS                                                 |
| `openclaw matrix verify sas <id>`          | Stampa gli emoji o i decimali SAS                                   |
| `openclaw matrix verify confirm-sas <id>`  | Conferma che il SAS corrisponda a quello mostrato dall'altro client |
| `openclaw matrix verify mismatch-sas <id>` | Rifiuta il SAS quando gli emoji o i decimali non corrispondono      |
| `openclaw matrix verify cancel <id>`       | Annulla; accetta `--reason <text>` e `--code <matrix-code>` opzionali |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come suggerimenti di follow-up per DM quando la verifica è ancorata a una stanza di messaggi diretti specifica.

### Note multi-account

Senza `--account <id>`, i comandi CLI Matrix usano l'account predefinito implicito. Se hai più account con nome e non hai impostato `channels.matrix.defaultAccount`, si rifiuteranno di indovinare e ti chiederanno di scegliere. Quando E2EE è disabilitata o non disponibile per un account con nome, gli errori indicano la chiave di configurazione di quell'account, per esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Con `encryption: true`, `startupVerification` ha come valore predefinito `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'auto-verifica in un altro client Matrix, saltando i duplicati e applicando un cooldown (24 ore per impostazione predefinita). Regola con `startupVerificationCooldownHours` o disabilita con `startupVerification: "off"`.

    L'avvio esegue anche un passaggio conservativo di bootstrap crittografico che riutilizza l'archiviazione dei segreti e l'identità di firma incrociata correnti. Se lo stato di bootstrap è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, l'avvio registra un avviso e resta non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Consulta [Migrazione Matrix](/it/channels/matrix-migration) per il flusso completo di aggiornamento.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix pubblica avvisi del ciclo di vita della verifica nella stanza DM di verifica rigorosa come messaggi `m.notice`: richiesta, pronto (con indicazioni "Verifica tramite emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'auto-verifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato non appena la verifica tramite emoji è disponibile: devi comunque confrontare e confermare "Corrispondono" nel tuo client Matrix.

    Gli avvisi di sistema di verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Se `verify status` indica che il dispositivo corrente non è più elencato sull'homeserver, crea un nuovo dispositivo Matrix OpenClaw. Per l'accesso con password:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Per l'autenticazione con token, crea un nuovo token di accesso nel tuo client Matrix o nell'interfaccia di amministrazione, quindi aggiorna OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sostituisci `assistant` con l'ID account del comando non riuscito, oppure ometti `--account` per l'account predefinito.

  </Accordion>

  <Accordion title="Device hygiene">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elenca e rimuovi:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    E2EE di Matrix usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico persiste in `crypto-idb-snapshot.json` (autorizzazioni file restrittive).

    Lo stato runtime cifrato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include l'archivio di sincronizzazione, l'archivio crittografico, la chiave di recupero, lo snapshot IDB, i binding dei thread e lo stato di verifica all'avvio. Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore radice esistente così lo stato precedente rimane visibile.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

Aggiorna il profilo personale Matrix per l'account selezionato:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Puoi passare entrambe le opzioni in una sola chiamata. Matrix accetta direttamente URL avatar `mxc://`; quando passi `http://` o `https://`, OpenClaw carica prima il file e memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override per account).

## Thread

Matrix supporta thread Matrix nativi sia per le risposte automatiche sia per gli invii dello strumento messaggi. Due controlli indipendenti governano il comportamento:

### Instradamento delle sessioni (`sessionScope`)

`dm.sessionScope` decide come le stanze DM Matrix vengono mappate alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze DM con lo stesso peer instradato condividono una sessione.
- `"per-room"`: ogni stanza DM Matrix ottiene la propria chiave di sessione, anche quando il peer è lo stesso.

I binding espliciti delle conversazioni hanno sempre precedenza su `sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.

### Threading delle risposte (`threadReplies`)

`threadReplies` decide dove il bot pubblica la sua risposta:

- `"off"`: le risposte sono di primo livello. I messaggi in ingresso nei thread restano nella sessione padre.
- `"inbound"`: risponde dentro un thread solo quando il messaggio in ingresso era già in quel thread.
- `"always"`: risponde dentro un thread radicato nel messaggio che ha attivato l'evento; quella conversazione viene instradata tramite una sessione con ambito thread corrispondente dal primo trigger in poi.

`dm.threadReplies` sovrascrive questo comportamento solo per i DM, per esempio per mantenere isolati i thread delle stanze tenendo piatti i DM.

### Ereditarietà dei thread e comandi slash

- I messaggi in ingresso con thread includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii con lo strumento messaggi ereditano automaticamente il thread Matrix corrente quando puntano alla stessa stanza (o allo stesso destinatario utente DM), a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo del destinatario utente DM si attiva solo quando i metadati della sessione corrente provano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw ricorre al normale instradamento con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vincolato al thread funzionano tutti nelle stanze Matrix e nei DM.
- `/focus` di primo livello crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSessions` è abilitato.
- L'esecuzione di `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa quel thread sul posto.

Quando OpenClaw rileva una stanza DM Matrix in conflitto con un'altra stanza DM sulla stessa sessione condivisa, pubblica un `m.notice` una tantum in quella stanza che rimanda alla via di uscita `/focus` e suggerisce una modifica di `dm.sessionScope`. L'avviso appare solo quando le associazioni dei thread sono abilitate.

## Associazioni conversazioni ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP durevoli senza cambiare la superficie di chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` all'interno del DM Matrix, della stanza o del thread esistente che vuoi continuare a usare.
- In un DM o una stanza Matrix di primo livello, il DM/la stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- All'interno di un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnSessions` controlla `/acp spawn --thread auto|here`, dove OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione associazione thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Le generazioni di sessioni associate a thread Matrix sono abilitate per impostazione predefinita:

- Imposta `threadBindings.spawnSessions: false` per impedire a `/focus` di primo livello e `/acp spawn --thread auto|here` di creare/associare thread Matrix.
- Imposta `threadBindings.defaultSpawnContext: "isolated"` quando le generazioni di thread dei sottoagenti nativi non devono fare fork della trascrizione padre.

## Reazioni

Matrix supporta reazioni in uscita, notifiche di reazioni in ingresso e reazioni di conferma.

Gli strumenti per le reazioni in uscita sono controllati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix.
- `emoji=""` rimuove le reazioni del bot stesso su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dal bot.

**Ordine di risoluzione** (vince il primo valore definito):

| Impostazione            | Ordine                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → canale → `messages.ackReaction` → fallback emoji dell'identità agente |
| `ackReactionScope`      | per account → canale → `messages.ackReactionScope` → predefinito `"group-mentions"` |
| `reactionNotifications` | per account → canale → predefinito `"own"`                                       |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando hanno come destinazione messaggi Matrix creati dal bot; `"off"` disabilita gli eventi di sistema delle reazioni. Le rimozioni di reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di stanza Matrix attiva l'agente. Ricade su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo per stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo in sospeso: OpenClaw memorizza nel buffer i messaggi della stanza che non hanno ancora attivato una risposta, poi crea uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I tentativi ripetuti dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di avanzare verso messaggi della stanza più recenti.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come il testo di risposta recuperato, le radici dei thread e la cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli allowlist attivi della stanza/dell'utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma conserva comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso possa attivare una risposta.
L'autorizzazione del trigger continua a derivare da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri DM.

## Criteri DM e stanza

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Per silenziare completamente i DM mantenendo attive le stanze, imposta `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Consulta [Gruppi](/it/channels/groups) per il comportamento di gating tramite menzione e allowlist.

Esempio di abbinamento per DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di abbinamento in sospeso e può inviare una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Consulta [Abbinamento](/it/channels/pairing) per il flusso DM condiviso di abbinamento e il layout di archiviazione.

## Riparazione stanze dirette

Se lo stato dei messaggi diretti va fuori sincronia, OpenClaw può ritrovarsi con mappature `m.direct` obsolete che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona la mappatura corrente per un peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per configurazioni multi-account. Il flusso di riparazione:

- preferisce un DM rigorosamente 1:1 già mappato in `m.direct`
- ricade su qualsiasi DM rigorosamente 1:1 attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste un DM integro

Non elimina automaticamente le vecchie stanze. Sceglie il DM integro e aggiorna la mappatura in modo che futuri invii Matrix, avvisi di verifica e altri flussi di messaggi diretti puntino alla stanza corretta.

## Approvazioni exec

Matrix può agire come client nativo di approvazione. Configura in `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` per un override per account):

- `enabled`: consegna le approvazioni tramite prompt nativi Matrix. Quando non impostato o `"auto"`, Matrix si abilita automaticamente appena può essere risolto almeno un approvatore. Imposta `false` per disabilitare esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare richieste exec. Facoltativo — ricade su `channels.matrix.dm.allowFrom`.
- `target`: dove inviare i prompt. `"dm"` (predefinito) invia ai DM degli approvatori; `"channel"` invia alla stanza Matrix o al DM di origine; `"both"` invia a entrambi.
- `agentFilter` / `sessionFilter`: allowlist facoltative per stabilire quali agenti/sessioni attivano la consegna Matrix.

L'autorizzazione differisce leggermente tra i tipi di approvazione:

- Le **approvazioni exec** usano `execApprovals.approvers`, con fallback su `dm.allowFrom`.
- Le **approvazioni Plugin** autorizzano solo tramite `dm.allowFrom`.

Entrambi i tipi condividono scorciatoie di reazione Matrix e aggiornamenti dei messaggi. Gli approvatori vedono scorciatoie di reazione sul messaggio di approvazione principale:

- `✅` consenti una volta
- `❌` nega
- `♾️` consenti sempre (quando il criterio exec effettivo lo permette)

Comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. La consegna al canale per le approvazioni exec include il testo del comando — abilita `channel` o `both` solo in stanze attendibili.

Correlato: [Approvazioni exec](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, ecc.) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi con prefisso della menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa automaticamente con tab il bot prima di digitare il comando.

Le regole di autorizzazione si applicano comunque: i mittenti dei comandi devono soddisfare gli stessi criteri allowlist/proprietario di DM o stanza dei messaggi semplici.

## Multi-account

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

**Ereditarietà:**

- I valori `channels.matrix` di primo livello agiscono come predefiniti per gli account con nome, a meno che un account non li sovrascriva.
- Limita una voce di stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra account; `account: "default"` continua a funzionare quando l'account predefinito è configurato al primo livello.

**Selezione account predefinito:**

- Imposta `defaultAccount` per scegliere l'account con nome preferito dall'instradamento implicito, dal probing e dai comandi CLI.
- Se hai più account e uno si chiama letteralmente `default`, OpenClaw lo usa implicitamente anche quando `defaultAccount` non è impostato.
- Se hai più account con nome e non è selezionato alcun predefinito, i comandi CLI si rifiutano di indovinare — imposta `defaultAccount` o passa `--account <id>`.
- Il blocco di primo livello `channels.matrix.*` viene trattato come account `default` implicito solo quando la sua autenticazione è completa (`homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`). Gli account con nome restano individuabili da `homeserver` + `userId` quando le credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw promuove una configurazione a singolo account a multi-account durante la riparazione o la configurazione, conserva l'account con nome esistente se presente o se `defaultAccount` punta già a uno. Solo le chiavi di autenticazione/bootstrap Matrix vengono spostate nell'account promosso; le chiavi condivise dei criteri di consegna restano al primo livello.

Consulta [Riferimento di configurazione](/it/gateway/config-channels#multi-account-all-channels) per il pattern multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu non
acconsenta esplicitamente per account.

Se il tuo homeserver gira su localhost, un IP LAN/Tailscale o un hostname interno, abilita
`network.dangerouslyAllowPrivateNetwork` per quell'account Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
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

Questa opzione esplicita consente solo destinazioni private/interne attendibili. Gli homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Preferisci `https://` ogni volta che è possibile.

## Proxy del traffico Matrix

Se la tua distribuzione Matrix richiede un proxy HTTP(S) in uscita esplicito, imposta `channels.matrix.proxy`:

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

Gli account denominati possono sovrascrivere il valore predefinito di livello superiore con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix in runtime e per i controlli dello stato dell'account.

## Risoluzione dei target

Matrix accetta queste forme di target ovunque OpenClaw richieda una stanza o un target utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Gli ID delle stanze Matrix distinguono tra maiuscole e minuscole. Usa esattamente le stesse maiuscole/minuscole dell'ID stanza di Matrix
quando configuri target di recapito espliciti, processi cron, associazioni o liste consentite.
OpenClaw mantiene canoniche le chiavi di sessione interne per l'archiviazione, quindi quelle chiavi in minuscolo
non sono una fonte affidabile per gli ID di recapito Matrix.

La ricerca live nella directory usa l'account Matrix connesso:

- Le ricerche utenti interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanze accettano direttamente ID stanza e alias espliciti, quindi ripiegano sulla ricerca nei nomi delle stanze unite per quell'account.
- La ricerca del nome delle stanze unite è di tipo best-effort. Se il nome di una stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della lista consentita.

## Riferimento di configurazione

I campi in stile lista consentita (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi (opzione più sicura). Le corrispondenze esatte della directory vengono risolte all'avvio e ogni volta che la lista consentita cambia mentre il monitor è in esecuzione; le voci che non possono essere risolte vengono ignorate in runtime. Le liste consentite delle stanze preferiscono ID stanza o alias per lo stesso motivo.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta di visualizzazione opzionale per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `accounts`: override denominati per account. I valori di livello superiore di `channels.matrix` vengono ereditati come predefiniti.
- `homeserver`: URL dell'homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account di connettersi a `localhost`, IP LAN/Tailscale o nomi host interni.
- `proxy`: URL proxy HTTP(S) opzionale per il traffico Matrix. Override per account supportato.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per autenticazione basata su token. Sono supportati valori in chiaro e SecretRef tra provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per accesso basato su password. Sono supportati valori in chiaro e SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo usato al momento dell'accesso con password.
- `avatarUrl`: URL self-avatar archiviato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione di avvio.

### Cifratura

- `encryption`: abilita E2EE. Predefinito: `false`.
- `startupVerification`: `"if-unverified"` (predefinito quando E2EE è attiva) o `"off"`. Richiede automaticamente l'autoverifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: tempo di attesa prima della successiva richiesta automatica all'avvio. Predefinito: `24`.

### Accesso e criteri

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Predefinito: `"allowlist"`.
- `groupAllowFrom`: lista consentita di ID utente per il traffico delle stanze.
- `dm.enabled`: quando `false`, ignora tutti i DM. Predefinito: `true`.
- `dm.policy`: `"pairing"` (predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot si è unito e ha classificato la stanza come DM; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: lista consentita di ID utente per il traffico DM.
- `dm.sessionScope`: `"per-user"` (predefinito) o `"per-room"`.
- `dm.threadReplies`: override solo DM per il threading delle risposte (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando `true`, forza tutti i criteri DM attivi (tranne `"disabled"`) e i criteri di gruppo `"open"` a `"allowlist"`. Non modifica i criteri `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi gli inviti in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: override per canale per il routing e il ciclo di vita delle sessioni vincolate ai thread.
- `streaming`: `"off"` (predefinito), `"partial"`, `"quiet"` o forma a oggetto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, i blocchi completati dell'assistente vengono mantenuti come messaggi di avanzamento separati.
- `markdown`: configurazione di rendering Markdown opzionale per il testo in uscita.
- `responsePrefix`: stringa opzionale anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione dei blocchi in uscita in caratteri quando `chunkMode: "length"`. Predefinito: `4000`.
- `chunkMode`: `"length"` (predefinito, divide per numero di caratteri) o `"newline"` (divide ai confini di riga).
- `historyLimit`: numero di messaggi recenti della stanza inclusi come `InboundHistory` quando un messaggio della stanza attiva l'agente. Ripiega su `messages.groupChat.historyLimit`; valore predefinito effettivo `0` (disabilitato).
- `mediaMaxMb`: limite di dimensione dei media in MB per gli invii in uscita e l'elaborazione in ingresso.

### Impostazioni delle reazioni

- `ackReaction`: override della reazione di conferma per questo canale/account.
- `ackReactionScope`: override dell'ambito (`"group-mentions"` predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`"own"` predefinito, `"off"`).

### Strumenti e override per stanza

- `actions`: gating degli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa dei criteri per stanza. L'identità della sessione usa l'ID stanza stabile dopo la risoluzione. (`rooms` è un alias legacy.)
  - `groups.<room>.account`: limita una voce stanza ereditata a un account specifico.
  - `groups.<room>.allowBots`: override per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.users`: lista consentita dei mittenti per stanza.
  - `groups.<room>.tools`: override di strumenti consentiti/negati per stanza.
  - `groups.<room>.autoReply`: override per stanza del gating tramite menzioni. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza di nuovo.
  - `groups.<room>.skills`: filtro Skills per stanza.
  - `groups.<room>.systemPrompt`: frammento di prompt di sistema per stanza.

### Impostazioni di approvazione exec

- `execApprovals.enabled`: recapita le approvazioni exec tramite prompt nativi Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. Ripiega su `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: liste consentite opzionali di agenti/sessioni per il recapito.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating tramite menzioni
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
