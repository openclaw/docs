---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurazione di Matrix E2EE e della verifica
summary: Stato del supporto di Matrix, configurazione iniziale ed esempi di configurazione
title: Matrice
x-i18n:
    generated_at: "2026-05-06T08:40:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un Plugin di canale scaricabile per OpenClaw.
Usa l'`matrix-js-sdk` ufficiale e supporta DM, stanze, thread, media, reazioni, sondaggi, posizione ed E2EE.

## Installazione

Installa Matrix prima di configurare il canale:

```bash
openclaw plugins install @openclaw/matrix
```

Da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e abilita il Plugin, quindi non è necessario un passaggio separato `openclaw plugins enable matrix`. Il Plugin non fa comunque nulla finché non configuri il canale qui sotto. Vedi [Plugin](/it/tools/plugin) per il comportamento generale dei Plugin e le regole di installazione.

## Configurazione

1. Crea un account Matrix sul tuo homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`.
3. Riavvia il Gateway.
4. Avvia un DM con il bot, oppure invitalo in una stanza (vedi [partecipazione automatica](#auto-join) - i nuovi inviti arrivano solo quando `autoJoin` li consente).

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata chiede: URL dell'homeserver, metodo di autenticazione (token di accesso o password), ID utente (solo autenticazione con password), nome dispositivo facoltativo, se abilitare E2EE e se configurare l'accesso alle stanze e la partecipazione automatica.

Se esistono già variabili d'ambiente `MATRIX_*` corrispondenti e l'account selezionato non ha autenticazione salvata, la procedura guidata offre una scorciatoia tramite variabili d'ambiente. Per risolvere i nomi delle stanze prima di salvare una allowlist, esegui `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE è abilitata, la procedura guidata scrive la configurazione ed esegue lo stesso bootstrap di [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` usa `off` come valore predefinito. Con il valore predefinito, il bot non apparirà in nuove stanze o DM da nuovi inviti finché non partecipi manualmente.

OpenClaw non può sapere al momento dell'invito se una stanza invitata è un DM o un gruppo, quindi tutti gli inviti, inclusi quelli in stile DM, passano prima da `autoJoin`. `dm.policy` si applica solo più tardi, dopo che il bot è entrato e la stanza è stata classificata.

<Warning>
Imposta `autoJoin: "allowlist"` più `autoJoinAllowlist` per limitare quali inviti il bot accetta, oppure `autoJoin: "always"` per accettare ogni invito.

`autoJoinAllowlist` accetta solo destinazioni stabili: `!roomId:server`, `#alias:server` o `*`. I nomi semplici delle stanze vengono rifiutati; le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitata.
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

Le allowlist di DM e stanze sono più efficaci con ID stabili:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. I nomi visualizzati vengono risolti solo quando la directory dell'homeserver restituisce esattamente una corrispondenza.
- Stanze (`groups`, `autoJoinAllowlist`): usa `!room:server` o `#alias:server`. I nomi vengono risolti al meglio contro le stanze a cui si è già partecipato; le voci non risolte vengono ignorate in fase di esecuzione.

### Normalizzazione dell'ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato. Per esempio, `Ops Bot` diventa `ops-bot`. La punteggiatura viene sottoposta a escape nei nomi di variabili d'ambiente con ambito, in modo che due account non possano collidere: `-` → `_X2D_`, quindi `ops-prod` corrisponde a `MATRIX_OPS_X2D_PROD_*`.

### Credenziali memorizzate nella cache

Matrix archivia le credenziali memorizzate nella cache in `~/.openclaw/credentials/matrix/`:

- account predefinito: `credentials.json`
- account con nome: `credentials-<account>.json`

Quando lì esistono credenziali memorizzate nella cache, OpenClaw considera Matrix configurato anche se il token di accesso non è nel file di configurazione: questo copre configurazione, `openclaw doctor` e sonde di stato del canale.

### Variabili d'ambiente

Usate quando la chiave di configurazione equivalente non è impostata. L'account predefinito usa nomi senza prefisso; gli account con nome usano l'ID account inserito prima del suffisso.

| Account predefinito   | Account con nome (`<ID>` è l'ID account normalizzato) |
| --------------------- | ----------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                              |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                            |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                                 |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                                |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                               |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                             |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                            |

Per l'account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. Le variabili d'ambiente della chiave di ripristino vengono lette dai flussi CLI consapevoli del ripristino (`verify backup restore`, `verify device`, `verify bootstrap`) quando passi la chiave tramite pipe con `--recovery-key-stdin`.

`MATRIX_HOMESERVER` non può essere impostato da un file `.env` dell'area di lavoro; vedi [File `.env` dell'area di lavoro](/it/gateway/security).

## Esempio di configurazione

Una base pratica con associazione DM, allowlist delle stanze ed E2EE:

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

## Anteprime in streaming

Lo streaming delle risposte Matrix è opzionale. `streaming` controlla come OpenClaw consegna la risposta dell'assistente in corso; `blockStreaming` controlla se ogni blocco completato viene conservato come messaggio Matrix autonomo.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Per mantenere le anteprime delle risposte in tempo reale ma nascondere le righe intermedie di strumenti/avanzamento, usa il formato a oggetto:

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

| `streaming`          | Comportamento                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (predefinito) | Attende la risposta completa, invia una volta. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                             |
| `"partial"`          | Modifica sul posto un normale messaggio di testo mentre il modello scrive il blocco corrente. I client Matrix standard possono notificare alla prima anteprima, non alla modifica finale. |
| `"quiet"`            | Come `"partial"`, ma il messaggio è un avviso senza notifica. I destinatari ricevono una notifica solo quando una regola push per utente corrisponde alla modifica finalizzata (vedi sotto). |

`blockStreaming` è indipendente da `streaming`:

| `streaming`             | `blockStreaming: true`                                                 | `blockStreaming: false` (predefinito)                  |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `"partial"` / `"quiet"` | Bozza live per il blocco corrente, blocchi completati mantenuti come messaggi | Bozza live per il blocco corrente, finalizzata sul posto |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco terminato             | Un messaggio Matrix con notifica per la risposta completa |

Note:

- Se un'anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell'anteprima e ripiega sulla consegna solo finale.
- Le risposte multimediali inviano sempre gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la oscura prima di inviare la risposta multimediale finale.
- Gli aggiornamenti di anteprima dell'avanzamento degli strumenti sono abilitati per impostazione predefinita quando lo streaming di anteprima Matrix è attivo. Imposta `streaming.preview.toolProgress: false` per mantenere le modifiche di anteprima per il testo della risposta ma lasciare l'avanzamento degli strumenti sul normale percorso di consegna.
- Le modifiche di anteprima costano chiamate API Matrix aggiuntive. Lascia `streaming: "off"` se vuoi il profilo più conservativo per i limiti di frequenza.

## Metadati di approvazione

Le richieste di approvazione native Matrix sono normali eventi `m.room.message` con contenuto evento personalizzato specifico di OpenClaw sotto `com.openclaw.approval`. Matrix consente chiavi di contenuto evento personalizzate, quindi i client standard mostrano comunque il corpo testuale, mentre i client compatibili con OpenClaw possono leggere ID approvazione strutturato, tipo, stato, decisioni disponibili e dettagli exec/Plugin.

Quando una richiesta di approvazione è troppo lunga per un evento Matrix, OpenClaw suddivide il testo visibile in blocchi e allega `com.openclaw.approval` solo al primo blocco. Le reazioni per le decisioni di consenso/rifiuto sono associate a quel primo evento, quindi le richieste lunghe mantengono lo stesso target di approvazione delle richieste a evento singolo.

### Regole push self-hosted per anteprime finalizzate silenziose

`streaming: "quiet"` notifica i destinatari solo quando un blocco o un turno è finalizzato: una regola push per utente deve corrispondere al marcatore di anteprima finalizzata. Vedi [Regole push Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la procedura completa (token destinatario, controllo pusher, installazione regola, note per homeserver).

## Stanze bot-to-bot

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
- `groups.<room>.allowBots` sostituisce l'impostazione a livello di account per una stanza.
- OpenClaw ignora comunque i messaggi provenienti dallo stesso ID utente Matrix per evitare cicli di auto-risposta.
- Matrix non espone qui un flag bot nativo; OpenClaw tratta "scritto da bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist di stanze rigide e requisiti di menzione quando abiliti il traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze cifrate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` così le anteprime delle immagini vengono cifrate insieme all'allegato completo. Le stanze non cifrate usano ancora `thumbnail_url` semplice. Non è necessaria alcuna configurazione: il Plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile da macchina) e `--account <id>` (configurazioni multi-account). L'output è conciso per impostazione predefinita, con logging SDK interno silenzioso. Gli esempi qui sotto mostrano la forma canonica; aggiungi i flag secondo necessità.

### Abilitare la crittografia

```bash
openclaw matrix encryption setup
```

Avvia l'archiviazione dei segreti e la firma incrociata, crea un backup delle chiavi delle stanze se necessario, quindi stampa stato e passaggi successivi. Flag utili:

- `--recovery-key <key>` applica una chiave di recupero prima del bootstrap (preferisci la forma tramite stdin documentata sotto)
- `--force-reset-cross-signing` elimina l'identità di firma incrociata corrente e ne crea una nuova (usala solo intenzionalmente)

Per un nuovo account, abilita E2EE al momento della creazione:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` è un alias di `--enable-e2ee`.

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
- `Signed by owner`: firmato dalla tua chiave di autofirma (solo diagnostica)

`Verified by owner` diventa `yes` solo quando `Cross-signing verified` è `yes`. L'attendibilità locale o una sola firma del proprietario non basta.

`--allow-degraded-local-state` restituisce diagnostica best-effort senza preparare prima l'account Matrix; utile per sonde offline o parzialmente configurate.

### Verificare questo dispositivo con una chiave di recupero

La chiave di recupero è sensibile: passala tramite stdin invece che sulla riga di comando. Imposta `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` per un account con nome):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando segnala tre stati:

- `Recovery key accepted`: Matrix ha accettato la chiave per l'archiviazione dei segreti o l'attendibilità del dispositivo.
- `Backup usable`: il backup delle chiavi delle stanze può essere caricato con il materiale di recupero attendibile.
- `Device verified by owner`: questo dispositivo ha piena attendibilità dell'identità di firma incrociata Matrix.

Termina con codice diverso da zero quando l'attendibilità completa dell'identità è incompleta, anche se la chiave di recupero ha sbloccato il materiale di backup. In quel caso, completa l'autoverifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Cross-signing verified: yes` prima di terminare con successo. Usa `--timeout-ms <ms>` per regolare l'attesa.

È accettata anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave finisce nella cronologia della shell.

### Avviare o riparare la firma incrociata

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` è il comando di riparazione e configurazione per gli account cifrati. In ordine:

- avvia l'archiviazione dei segreti, riutilizzando una chiave di recupero esistente quando possibile
- avvia la firma incrociata e carica le chiavi pubbliche mancanti
- contrassegna e firma in modo incrociato il dispositivo corrente
- crea un backup lato server delle chiavi delle stanze se non ne esiste già uno

Se l'homeserver richiede UIA per caricare le chiavi di firma incrociata, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, poi `m.login.password` (richiede `channels.matrix.password`).

Flag utili:

- `--recovery-key-stdin` (da abbinare a `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` per eliminare l'identità di firma incrociata corrente (solo intenzionalmente)

### Backup delle chiavi delle stanze

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se esiste un backup lato server e se questo dispositivo può decifrarlo. `backup restore` importa le chiavi delle stanze salvate nel backup nell'archivio crypto locale; se la chiave di recupero è già su disco puoi omettere `--recovery-key-stdin`.

Per sostituire un backup danneggiato con una baseline nuova (accettando la perdita della vecchia cronologia irrecuperabile; può anche ricreare l'archiviazione dei segreti se il segreto del backup corrente non è caricabile):

```bash
openclaw matrix verify backup reset --yes
```

Aggiungi `--rotate-recovery-key` solo quando vuoi intenzionalmente che la chiave di recupero precedente smetta di sbloccare la nuova baseline del backup.

### Elencare, richiedere e rispondere alle verifiche

```bash
openclaw matrix verify list
```

Elenca le richieste di verifica in sospeso per l'account selezionato.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Invia una richiesta di verifica da questo account OpenClaw. `--own-user` richiede l'autoverifica (accetti il prompt in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` puntano a qualcun altro. `--own-user` non può essere combinato con gli altri flag di destinazione.

Per la gestione di livello inferiore del ciclo di vita, in genere mentre si seguono richieste in ingresso da un altro client, questi comandi agiscono su una richiesta specifica `<id>` (stampata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accetta una richiesta in ingresso                                   |
| `openclaw matrix verify start <id>`        | Avvia il flusso SAS                                                 |
| `openclaw matrix verify sas <id>`          | Stampa gli emoji o i decimali SAS                                   |
| `openclaw matrix verify confirm-sas <id>`  | Conferma che il SAS corrisponde a ciò che mostra l'altro client     |
| `openclaw matrix verify mismatch-sas <id>` | Rifiuta il SAS quando gli emoji o i decimali non corrispondono      |
| `openclaw matrix verify cancel <id>`       | Annulla; accetta `--reason <text>` e `--code <matrix-code>` opzionali |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come suggerimenti di follow-up DM quando la verifica è ancorata a una specifica stanza di messaggi diretti.

### Note multi-account

Senza `--account <id>`, i comandi CLI Matrix usano l'account predefinito implicito. Se hai più account con nome e non hai impostato `channels.matrix.defaultAccount`, rifiuteranno di tirare a indovinare e ti chiederanno di scegliere. Quando E2EE è disabilitata o non disponibile per un account con nome, gli errori indicano la chiave di configurazione di quell'account, per esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Con `encryption: true`, `startupVerification` ha il valore predefinito `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, saltando i duplicati e applicando un cooldown (24 ore per impostazione predefinita). Regola con `startupVerificationCooldownHours` o disabilita con `startupVerification: "off"`.

    L'avvio esegue anche un passaggio conservativo di bootstrap crypto che riutilizza l'archiviazione dei segreti e l'identità di firma incrociata correnti. Se lo stato di bootstrap è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, l'avvio registra un avviso e rimane non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Consulta [migrazione Matrix](/it/channels/matrix-migration) per il flusso di aggiornamento completo.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix pubblica avvisi sul ciclo di vita della verifica nella stanza DM di verifica rigorosa come messaggi `m.notice`: richiesta, pronto (con indicazioni "Verify by emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato una volta disponibile la verifica tramite emoji: devi comunque confrontare e confermare "They match" nel tuo client Matrix.

    Gli avvisi di sistema della verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Se `verify status` dice che il dispositivo corrente non è più elencato sull'homeserver, crea un nuovo dispositivo Matrix OpenClaw. Per l'accesso con password:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Per l'autenticazione tramite token, crea un nuovo token di accesso nel tuo client Matrix o nell'interfaccia di amministrazione, quindi aggiorna OpenClaw:

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
    Matrix E2EE usa il percorso crypto Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crypto persiste in `crypto-idb-snapshot.json` (permessi file restrittivi).

    Lo stato runtime cifrato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include archivio di sincronizzazione, archivio crypto, chiave di recupero, snapshot IDB, associazioni dei thread e stato della verifica all'avvio. Quando il token cambia ma l'identità dell'account rimane la stessa, OpenClaw riutilizza la migliore root esistente in modo che lo stato precedente resti visibile.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

Aggiorna il profilo personale Matrix per l'account selezionato:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Puoi passare entrambe le opzioni in una sola chiamata. Matrix accetta direttamente URL avatar `mxc://`; quando passi `http://` o `https://`, OpenClaw carica prima il file e salva l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override per account).

## Thread

Matrix supporta thread Matrix nativi sia per le risposte automatiche sia per gli invii tramite message-tool. Due controlli indipendenti regolano il comportamento:

### Instradamento sessione (`sessionScope`)

`dm.sessionScope` decide come le stanze DM Matrix vengono mappate alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze DM con lo stesso peer instradato condividono una sessione.
- `"per-room"`: ogni stanza DM Matrix ottiene la propria chiave di sessione, anche quando il peer è lo stesso.

Le associazioni esplicite delle conversazioni prevalgono sempre su `sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.

### Thread delle risposte (`threadReplies`)

`threadReplies` decide dove il bot pubblica la propria risposta:

- `"off"`: le risposte sono di livello superiore. I messaggi in thread in ingresso restano nella sessione padre.
- `"inbound"`: risponde dentro un thread solo quando il messaggio in ingresso era già in quel thread.
- `"always"`: risponde dentro un thread radicato nel messaggio che ha attivato l'evento; quella conversazione viene instradata attraverso una sessione con ambito thread corrispondente dal primo trigger in poi.

`dm.threadReplies` sovrascrive questo solo per i DM, per esempio per mantenere isolati i thread delle stanze lasciando i DM piatti.

### Ereditarietà dei thread e comandi slash

- I messaggi in thread in ingresso includono il messaggio radice del thread come contesto aggiuntivo dell'agente.
- Gli invii tramite lo strumento messaggi ereditano automaticamente il thread Matrix corrente quando hanno come destinazione la stessa stanza (o la stessa destinazione utente DM), a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo della destinazione utente DM si attiva solo quando i metadati della sessione corrente dimostrano che si tratta dello stesso interlocutore DM sullo stesso account Matrix; altrimenti OpenClaw ricorre al normale instradamento con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vincolato a un thread funzionano tutti nelle stanze Matrix e nei DM.
- `/focus` di primo livello crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSessions` è abilitato.
- Eseguire `/focus` o `/acp spawn --thread here` dentro un thread Matrix esistente associa quel thread sul posto.

Quando OpenClaw rileva una stanza DM Matrix in conflitto con un'altra stanza DM sulla stessa sessione condivisa, pubblica in quella stanza un `m.notice` una tantum che indica la via di uscita `/focus` e suggerisce una modifica a `dm.sessionScope`. L'avviso appare solo quando le associazioni dei thread sono abilitate.

## Associazioni delle conversazioni ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in spazi di lavoro ACP durevoli senza cambiare la superficie di chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` dentro il DM Matrix, la stanza o il thread esistente che vuoi continuare a usare.
- In un DM o una stanza Matrix di primo livello, il DM/la stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- Dentro un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnSessions` controlla `/acp spawn --thread auto|here`, nei casi in cui OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione delle associazioni dei thread

Matrix eredita le impostazioni predefinite globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

La generazione di sessioni vincolate a thread Matrix è abilitata per impostazione predefinita:

- Imposta `threadBindings.spawnSessions: false` per impedire a `/focus` di primo livello e `/acp spawn --thread auto|here` di creare/associare thread Matrix.
- Imposta `threadBindings.defaultSpawnContext: "isolated"` quando le generazioni di thread nativi per sottoagenti non devono biforcare la trascrizione padre.

## Reazioni

Matrix supporta reazioni in uscita, notifiche di reazione in ingresso e reazioni di conferma.

Gli strumenti per le reazioni in uscita sono controllati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix.
- `emoji=""` rimuove le reazioni del bot su quell'evento.
- `remove: true` rimuove dal bot solo la reazione emoji specificata.

**Ordine di risoluzione** (vince il primo valore definito):

| Impostazione            | Ordine                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → canale → `messages.ackReaction` → fallback all'emoji dell'identità agente |
| `ackReactionScope`      | per account → canale → `messages.ackReactionScope` → predefinito `"group-mentions"` |
| `reactionNotifications` | per account → canale → predefinito `"own"`                                      |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando prendono di mira messaggi Matrix scritti dal bot; `"off"` disabilita gli eventi di sistema relativi alle reazioni. Le rimozioni di reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio in una stanza Matrix attiva l'agente. Usa come fallback `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è limitata alla stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix riguarda solo i messaggi in sospeso: OpenClaw memorizza i messaggi della stanza che non hanno ancora attivato una risposta, poi scatta un'istantanea di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I tentativi ripetuti dello stesso evento Matrix riutilizzano l'istantanea originale della cronologia invece di avanzare verso messaggi di stanza più recenti.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come testo di risposta recuperato, radici dei thread e cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli allowlist attivi per stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso possa attivare una risposta.
L'autorizzazione del trigger proviene comunque da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri DM.

## Criteri per DM e stanze

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

Consulta [Gruppi](/it/channels/groups) per il comportamento di gate tramite menzione e allowlist.

Esempio di abbinamento per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di abbinamento in sospeso e può inviare una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Consulta [Abbinamento](/it/channels/pairing) per il flusso condiviso di abbinamento DM e la struttura di archiviazione.

## Riparazione delle stanze dirette

Se lo stato dei messaggi diretti si disallinea, OpenClaw può ritrovarsi con mappature `m.direct` obsolete che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona la mappatura corrente per un interlocutore:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per configurazioni multi-account. Il flusso di riparazione:

- preferisce un DM 1:1 rigoroso già mappato in `m.direct`
- usa come fallback qualsiasi DM 1:1 rigoroso attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM sano

Non elimina automaticamente le vecchie stanze. Sceglie il DM sano e aggiorna la mappatura in modo che i futuri invii Matrix, gli avvisi di verifica e altri flussi di messaggi diretti puntino alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo. Configura in `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` per un override per account):

- `enabled`: consegna le approvazioni tramite prompt nativi Matrix. Quando non è impostato o è `"auto"`, Matrix si abilita automaticamente quando è possibile risolvere almeno un approvatore. Imposta `false` per disabilitare esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare richieste exec. Facoltativo: usa come fallback `channels.matrix.dm.allowFrom`.
- `target`: destinazione dei prompt. `"dm"` (predefinito) invia ai DM degli approvatori; `"channel"` invia alla stanza Matrix o al DM di origine; `"both"` invia a entrambi.
- `agentFilter` / `sessionFilter`: allowlist facoltative per indicare quali agenti/sessioni attivano la consegna Matrix.

L'autorizzazione differisce leggermente tra i tipi di approvazione:

- Le **approvazioni exec** usano `execApprovals.approvers`, con fallback a `dm.allowFrom`.
- Le **approvazioni Plugin** autorizzano solo tramite `dm.allowFrom`.

Entrambi i tipi condividono scorciatoie di reazione Matrix e aggiornamenti dei messaggi. Gli approvatori vedono scorciatoie di reazione sul messaggio di approvazione principale:

- `✅` consenti una volta
- `❌` nega
- `♾️` consenti sempre (quando il criterio exec effettivo lo consente)

Comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. La consegna al canale per le approvazioni exec include il testo del comando: abilita `channel` o `both` solo in stanze fidate.

Correlato: [Approvazioni exec](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, ecc.) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi preceduti dalla menzione Matrix del bot, quindi `@bot:server /new` attiva il percorso del comando senza una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa tramite tab il nome del bot prima di digitare il comando.

Le regole di autorizzazione si applicano comunque: i mittenti dei comandi devono soddisfare gli stessi criteri allowlist/proprietario per DM o stanza dei messaggi normali.

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

- I valori di primo livello `channels.matrix` fungono da impostazioni predefinite per gli account nominati, a meno che un account non li sovrascriva.
- Limita una voce di stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra gli account; `account: "default"` funziona ancora quando l'account predefinito è configurato al primo livello.

**Selezione dell'account predefinito:**

- Imposta `defaultAccount` per scegliere l'account nominato preferito da instradamento implicito, probing e comandi CLI.
- Se hai più account e uno si chiama letteralmente `default`, OpenClaw lo usa implicitamente anche quando `defaultAccount` non è impostato.
- Se hai più account nominati e non è selezionato alcun valore predefinito, i comandi CLI si rifiutano di indovinare: imposta `defaultAccount` o passa `--account <id>`.
- Il blocco di primo livello `channels.matrix.*` viene trattato come account implicito `default` solo quando l'autenticazione è completa (`homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`). Gli account nominati restano individuabili da `homeserver` + `userId` quando le credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw promuove una configurazione a singolo account a multi-account durante una riparazione o configurazione, conserva l'account nominato esistente se ne esiste uno o se `defaultAccount` punta già a uno. Solo le chiavi di autenticazione/bootstrap Matrix vengono spostate nell'account promosso; le chiavi dei criteri di consegna condivisi restano al primo livello.

Consulta [Riferimento di configurazione](/it/gateway/config-channels#multi-account-all-channels) per il modello multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu
non li abiliti esplicitamente per account.

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

Questo consenso esplicito consente solo target privati/interni attendibili. Gli homeserver pubblici in chiaro, come
`http://matrix.example.org:8008`, restano bloccati. Preferisci `https://` ogni volta che è possibile.

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

Gli account denominati possono sovrascrivere il valore predefinito di primo livello con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix in runtime e per le sonde di stato degli account.

## Risoluzione dei target

Matrix accetta queste forme di target ovunque OpenClaw richieda un target stanza o utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Gli ID stanza Matrix distinguono tra maiuscole e minuscole. Usa esattamente le stesse maiuscole e minuscole dell'ID stanza da Matrix
quando configuri target di consegna espliciti, processi cron, associazioni o allowlist.
OpenClaw mantiene canoniche le chiavi di sessione interne per l'archiviazione, quindi quelle chiavi in minuscolo
non sono una fonte affidabile per gli ID di consegna Matrix.

La ricerca live nella directory usa l'account Matrix connesso:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi ripiegano sulla ricerca nei nomi delle stanze a cui quell'account ha aderito.
- La ricerca per nome tra le stanze a cui si è aderito è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime dell'allowlist.

## Riferimento di configurazione

I campi in stile allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi (opzione più sicura). Le corrispondenze esatte nella directory vengono risolte all'avvio e ogni volta che l'allowlist cambia mentre il monitor è in esecuzione; le voci che non possono essere risolte vengono ignorate in runtime. Per lo stesso motivo, le allowlist delle stanze preferiscono ID stanza o alias.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta di visualizzazione facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `accounts`: sovrascritture denominate per account. I valori di primo livello di `channels.matrix` vengono ereditati come predefiniti.
- `homeserver`: URL dell'homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account di connettersi a `localhost`, IP LAN/Tailscale o nomi host interni.
- `proxy`: URL proxy HTTP(S) facoltativo per il traffico Matrix. È supportata la sovrascrittura per account.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per autenticazione basata su token. Valori in chiaro e SecretRef supportati tramite provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per login basato su password. Valori in chiaro e SecretRef supportati.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo usato durante il login con password.
- `avatarUrl`: URL dell'avatar personale archiviato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione di avvio.

### Crittografia

- `encryption`: abilita E2EE. Predefinito: `false`.
- `startupVerification`: `"if-unverified"` (predefinito quando E2EE è attiva) o `"off"`. Richiede automaticamente l'autoverifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: periodo di attesa prima della prossima richiesta automatica all'avvio. Predefinito: `24`.

### Accesso e policy

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Predefinito: `"allowlist"`.
- `groupAllowFrom`: allowlist di ID utente per il traffico delle stanze.
- `dm.enabled`: quando `false`, ignora tutti i DM. Predefinito: `true`.
- `dm.policy`: `"pairing"` (predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot ha aderito e classificato la stanza come DM; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM.
- `dm.sessionScope`: `"per-user"` (predefinito) o `"per-room"`.
- `dm.threadReplies`: sovrascrittura solo DM per le risposte in thread (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando `true`, forza tutte le policy DM attive (eccetto `"disabled"`) e le policy gruppo `"open"` a `"allowlist"`. Non modifica le policy `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi gli inviti in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: sovrascritture per canale per routing e ciclo di vita delle sessioni vincolate a thread.
- `streaming`: `"off"` (predefinito), `"partial"`, `"quiet"` o forma oggetto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, i blocchi completati dell'assistente vengono mantenuti come messaggi di avanzamento separati.
- `markdown`: configurazione facoltativa del rendering Markdown per il testo in uscita.
- `responsePrefix`: stringa facoltativa anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione dei chunk in uscita in caratteri quando `chunkMode: "length"`. Predefinito: `4000`.
- `chunkMode`: `"length"` (predefinito, divide per numero di caratteri) o `"newline"` (divide ai limiti di riga).
- `historyLimit`: numero di messaggi stanza recenti inclusi come `InboundHistory` quando un messaggio in una stanza attiva l'agente. Ripiega su `messages.groupChat.historyLimit`; valore predefinito effettivo `0` (disabilitato).
- `mediaMaxMb`: limite di dimensione dei media in MB per invii in uscita ed elaborazione in ingresso.

### Impostazioni delle reazioni

- `ackReaction`: sovrascrittura della reazione di ack per questo canale/account.
- `ackReactionScope`: sovrascrittura dell'ambito (`"group-mentions"` predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`"own"` predefinito, `"off"`).

### Strumenti e sovrascritture per stanza

- `actions`: gating degli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa delle policy per stanza. L'identità di sessione usa l'ID stanza stabile dopo la risoluzione. (`rooms` è un alias legacy.)
  - `groups.<room>.account`: limita una voce stanza ereditata a un account specifico.
  - `groups.<room>.allowBots`: sovrascrittura per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.users`: allowlist mittenti per stanza.
  - `groups.<room>.tools`: sovrascritture allow/deny degli strumenti per stanza.
  - `groups.<room>.autoReply`: sovrascrittura per stanza del gating delle menzioni. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza di nuovo.
  - `groups.<room>.skills`: filtro Skills per stanza.
  - `groups.<room>.systemPrompt`: frammento di prompt di sistema per stanza.

### Impostazioni di approvazione exec

- `execApprovals.enabled`: invia le approvazioni exec tramite prompt nativi Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. Ripiega su `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist facoltative di agenti/sessioni per la consegna.

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Abbinamento](/it/channels/pairing) - autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e gating delle menzioni
- [Routing dei canali](/it/channels/channel-routing) - routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
