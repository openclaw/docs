---
read_when:
    - Configurazione di Matrix in OpenClaw
    - Configurazione della E2EE di Matrix e della verifica
summary: Stato del supporto di Matrix, configurazione iniziale ed esempi di configurazione
title: Matrice
x-i18n:
    generated_at: "2026-05-11T20:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un plugin di canale scaricabile per OpenClaw.
Usa l’SDK ufficiale `matrix-js-sdk` e supporta DM, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Installazione

Installa Matrix da ClawHub prima di configurare il canale:

```bash
openclaw plugins install @openclaw/matrix
```

Le specifiche di plugin senza prefisso provano prima ClawHub, poi il fallback npm. Per forzare l’origine del registro, usa `openclaw plugins install clawhub:@openclaw/matrix` oppure `openclaw plugins install npm:@openclaw/matrix`.

Da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e abilita il plugin, quindi non serve un passaggio separato `openclaw plugins enable matrix`. Il plugin continua a non fare nulla finché non configuri il canale qui sotto. Vedi [Plugin](/it/tools/plugin) per il comportamento generale dei plugin e le regole di installazione.

## Configurazione

1. Crea un account Matrix sul tuo homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`.
3. Riavvia il gateway.
4. Avvia un DM con il bot oppure invitalo in una stanza (vedi [auto-join](#auto-join) - i nuovi inviti arrivano solo quando `autoJoin` li consente).

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata richiede: URL dell’homeserver, metodo di autenticazione (token di accesso o password), ID utente (solo autenticazione con password), nome dispositivo opzionale, se abilitare E2EE e se configurare l’accesso alle stanze e l’auto-join.

Se esistono già variabili d’ambiente `MATRIX_*` corrispondenti e l’account selezionato non ha autenticazione salvata, la procedura guidata offre una scorciatoia tramite variabili d’ambiente. Per risolvere i nomi delle stanze prima di salvare una allowlist, esegui `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE è abilitata, la procedura guidata scrive la configurazione ed esegue lo stesso bootstrap di [`openclaw matrix encryption setup`](#encryption-and-verification).

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

### Auto-join

`channels.matrix.autoJoin` ha come valore predefinito `off`. Con il valore predefinito, il bot non comparirà in nuove stanze o DM da nuovi inviti finché non ti unirai manualmente.

OpenClaw non può sapere al momento dell’invito se una stanza invitata è un DM o un gruppo, quindi tutti gli inviti - inclusi quelli in stile DM - passano prima da `autoJoin`. `dm.policy` si applica solo dopo, quando il bot si è unito e la stanza è stata classificata.

<Warning>
Imposta `autoJoin: "allowlist"` più `autoJoinAllowlist` per limitare quali inviti il bot accetta, oppure `autoJoin: "always"` per accettare ogni invito.

`autoJoinAllowlist` accetta solo target stabili: `!roomId:server`, `#alias:server` oppure `*`. I nomi di stanza semplici vengono rifiutati; le voci alias sono risolte rispetto all’homeserver, non rispetto allo stato dichiarato dalla stanza invitata.
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

### Formati dei target allowlist

Le allowlist per DM e stanze sono più affidabili se popolate con ID stabili:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. I nomi visualizzati sono ignorati per impostazione predefinita perché sono mutabili; imposta `dangerouslyAllowNameMatching: true` solo quando hai esplicitamente bisogno di compatibilità con voci basate sul nome visualizzato.
- Chiavi allowlist delle stanze (`groups`, legacy `rooms`): usa `!room:server` o `#alias:server`. I nomi di stanza semplici sono ignorati per impostazione predefinita; imposta `dangerouslyAllowNameMatching: true` solo quando hai esplicitamente bisogno di compatibilità con la ricerca del nome di una stanza già unita.
- Allowlist degli inviti (`autoJoinAllowlist`): usa `!room:server`, `#alias:server` oppure `*`. I nomi di stanza semplici vengono rifiutati.

### Normalizzazione dell’ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato. Per esempio, `Ops Bot` diventa `ops-bot`. La punteggiatura viene sottoposta a escape nei nomi delle variabili d’ambiente con ambito, così due account non possono collidere: `-` → `_X2D_`, quindi `ops-prod` viene mappato a `MATRIX_OPS_X2D_PROD_*`.

### Credenziali memorizzate nella cache

Matrix memorizza le credenziali nella cache sotto `~/.openclaw/credentials/matrix/`:

- account predefinito: `credentials.json`
- account nominati: `credentials-<account>.json`

Quando lì esistono credenziali memorizzate nella cache, OpenClaw considera Matrix configurato anche se il token di accesso non è nel file di configurazione - questo copre la configurazione, `openclaw doctor` e i probe di stato del canale.

### Variabili d’ambiente

Usate quando la chiave di configurazione equivalente non è impostata. L’account predefinito usa nomi senza prefisso; gli account nominati usano l’ID account inserito prima del suffisso.

| Account predefinito    | Account nominato (`<ID>` è l’ID account normalizzato) |
| ---------------------- | ------------------------------------------------------ |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                               |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                             |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                  |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                                 |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                                |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                              |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                             |

Per l’account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. Le variabili d’ambiente della chiave di recupero sono lette dai flussi CLI sensibili al recupero (`verify backup restore`, `verify device`, `verify bootstrap`) quando passi la chiave tramite pipe con `--recovery-key-stdin`.

`MATRIX_HOMESERVER` non può essere impostato da un file `.env` dell’area di lavoro; vedi [file `.env` dell’area di lavoro](/it/gateway/security).

## Esempio di configurazione

Una base pratica con abbinamento DM, allowlist delle stanze ed E2EE:

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

## Anteprime di streaming

Lo streaming delle risposte Matrix è opt-in. `streaming` controlla come OpenClaw recapita la risposta dell’assistente in corso; `blockStreaming` controlla se ogni blocco completato viene conservato come messaggio Matrix separato.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Per mantenere le anteprime live delle risposte ma nascondere le righe intermedie di strumenti/avanzamento, usa la forma a oggetto:

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

| `streaming`          | Comportamento                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"off"` (predefinito) | Attende la risposta completa, invia una volta. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`          | Modifica sul posto un normale messaggio di testo mentre il modello scrive il blocco corrente. I client Matrix standard possono notificare alla prima anteprima, non alla modifica finale. |
| `"quiet"`            | Uguale a `"partial"`, ma il messaggio è un avviso senza notifica. I destinatari ricevono una notifica solo quando una regola push per utente corrisponde alla modifica finalizzata (vedi sotto). |

`blockStreaming` è indipendente da `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (predefinito)                  |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `"partial"` / `"quiet"` | Bozza live per il blocco corrente, blocchi completati conservati come messaggi | Bozza live per il blocco corrente, finalizzata sul posto |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco terminato                | Un messaggio Matrix con notifica per la risposta completa |

Note:

- Se un’anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell’anteprima e ripiega sulla consegna solo finale.
- Le risposte multimediali inviano sempre gli allegati normalmente. Se un’anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Gli aggiornamenti di anteprima dell’avanzamento degli strumenti sono abilitati per impostazione predefinita quando lo streaming delle anteprime Matrix è attivo. Imposta `streaming.preview.toolProgress: false` per mantenere le modifiche di anteprima per il testo della risposta ma lasciare l’avanzamento degli strumenti sul percorso di consegna normale.
- Le modifiche di anteprima costano chiamate API Matrix aggiuntive. Lascia `streaming: "off"` se vuoi il profilo di rate limit più conservativo.

## Metadati di approvazione

I prompt di approvazione nativi di Matrix sono normali eventi `m.room.message` con contenuto evento personalizzato specifico di OpenClaw sotto `com.openclaw.approval`. Matrix consente chiavi di contenuto evento personalizzate, quindi i client standard mostrano comunque il corpo testuale mentre i client compatibili con OpenClaw possono leggere ID approvazione strutturato, tipo, stato, decisioni disponibili e dettagli di esecuzione/plugin.

Quando un prompt di approvazione è troppo lungo per un singolo evento Matrix, OpenClaw suddivide il testo visibile in blocchi e allega `com.openclaw.approval` solo al primo blocco. Le reazioni per le decisioni allow/deny sono associate a quel primo evento, quindi i prompt lunghi mantengono lo stesso target di approvazione dei prompt a evento singolo.

### Regole push self-hosted per anteprime finalizzate quiet

`streaming: "quiet"` notifica i destinatari solo quando un blocco o turno è finalizzato - una regola push per utente deve corrispondere al marker dell’anteprima finalizzata. Vedi [regole push Matrix per anteprime quiet](/it/channels/matrix-push-rules) per la procedura completa (token destinatario, controllo pusher, installazione regola, note per homeserver).

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
- `groups.<room>.allowBots` sovrascrive l’impostazione a livello di account per una stanza.
- OpenClaw continua a ignorare i messaggi dallo stesso ID utente Matrix per evitare cicli di autorisposta.
- Matrix non espone qui un flag bot nativo; OpenClaw considera "scritto da bot" come "inviato da un altro account Matrix configurato su questo gateway OpenClaw".

Usa allowlist rigorose per le stanze e requisiti di menzione quando abiliti il traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze cifrate (E2EE), gli eventi immagine in uscita usano `thumbnail_file`, così le anteprime delle immagini vengono cifrate insieme all'allegato completo. Le stanze non cifrate continuano a usare il semplice `thumbnail_url`. Non serve alcuna configurazione - il plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile dalla macchina) e `--account <id>` (configurazioni multi-account). Per impostazione predefinita l'output è conciso, con logging interno SDK silenzioso. Gli esempi sotto mostrano la forma canonica; aggiungi i flag secondo necessità.

### Abilitare la cifratura

```bash
openclaw matrix encryption setup
```

Inizializza l'archiviazione dei segreti e la firma incrociata, crea un backup delle chiavi della stanza se necessario, quindi stampa lo stato e i passaggi successivi. Flag utili:

- `--recovery-key <key>` applica una chiave di recupero prima del bootstrap (preferisci la forma via stdin documentata sotto)
- `--force-reset-cross-signing` elimina l'identità di firma incrociata corrente e ne crea una nuova (usare solo intenzionalmente)

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

- `Locally trusted`: considerato attendibile solo da questo client
- `Cross-signing verified`: l'SDK segnala la verifica tramite firma incrociata
- `Signed by owner`: firmato dalla tua chiave di auto-firma (solo diagnostico)

`Verified by owner` diventa `yes` solo quando `Cross-signing verified` è `yes`. L'attendibilità locale o una sola firma del proprietario non sono sufficienti.

`--allow-degraded-local-state` restituisce una diagnostica best-effort senza preparare prima l'account Matrix; utile per controlli offline o parzialmente configurati.

### Verificare questo dispositivo con una chiave di recupero

La chiave di recupero è sensibile - inviala tramite stdin invece di passarla sulla riga di comando. Imposta `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` per un account con nome):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando segnala tre stati:

- `Recovery key accepted`: Matrix ha accettato la chiave per l'archiviazione dei segreti o l'attendibilità del dispositivo.
- `Backup usable`: il backup delle chiavi della stanza può essere caricato con il materiale di recupero attendibile.
- `Device verified by owner`: questo dispositivo ha piena attendibilità dell'identità di firma incrociata Matrix.

Esce con codice diverso da zero quando l'attendibilità completa dell'identità è incompleta, anche se la chiave di recupero ha sbloccato il materiale di backup. In tal caso, completa l'auto-verifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Cross-signing verified: yes` prima di uscire con successo. Usa `--timeout-ms <ms>` per regolare l'attesa.

È accettata anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave finisce nella cronologia della shell.

### Avviare o riparare la firma incrociata

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` è il comando di riparazione e configurazione per gli account cifrati. Nell'ordine:

- inizializza l'archiviazione dei segreti, riutilizzando una chiave di recupero esistente quando possibile
- inizializza la firma incrociata e carica le chiavi pubbliche mancanti
- contrassegna e firma in modo incrociato il dispositivo corrente
- crea un backup delle chiavi della stanza lato server se non esiste già

Se l'homeserver richiede UIA per caricare le chiavi di firma incrociata, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, poi `m.login.password` (richiede `channels.matrix.password`).

Flag utili:

- `--recovery-key-stdin` (da abbinare a `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` per eliminare l'identità di firma incrociata corrente (solo intenzionalmente)

### Backup delle chiavi della stanza

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se esiste un backup lato server e se questo dispositivo può decifrarlo. `backup restore` importa le chiavi della stanza salvate nel backup nell'archivio crittografico locale; se la chiave di recupero è già su disco puoi omettere `--recovery-key-stdin`.

Per sostituire un backup danneggiato con una nuova baseline (accettando la perdita della vecchia cronologia irrecuperabile; può anche ricreare l'archiviazione dei segreti se il segreto del backup corrente non è caricabile):

```bash
openclaw matrix verify backup reset --yes
```

Aggiungi `--rotate-recovery-key` solo quando vuoi intenzionalmente che la chiave di recupero precedente smetta di sbloccare la nuova baseline di backup.

### Elencare, richiedere e rispondere alle verifiche

```bash
openclaw matrix verify list
```

Elenca le richieste di verifica in sospeso per l'account selezionato.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Invia una richiesta di verifica da questo account OpenClaw. `--own-user` richiede l'auto-verifica (accetti la richiesta in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` prendono di mira qualcun altro. `--own-user` non può essere combinato con gli altri flag di destinazione.

Per la gestione del ciclo di vita a livello più basso - in genere mentre si seguono richieste in ingresso da un altro client - questi comandi agiscono su una richiesta specifica `<id>` (stampata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accettare una richiesta in ingresso                                 |
| `openclaw matrix verify start <id>`        | Avviare il flusso SAS                                               |
| `openclaw matrix verify sas <id>`          | Stampare le emoji o i decimali SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confermare che il SAS corrisponda a ciò che mostra l'altro client   |
| `openclaw matrix verify mismatch-sas <id>` | Rifiutare il SAS quando le emoji o i decimali non corrispondono     |
| `openclaw matrix verify cancel <id>`       | Annullare; accetta `--reason <text>` e `--code <matrix-code>` opzionali |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come suggerimenti di follow-up DM quando la verifica è ancorata a una specifica stanza di messaggi diretti.

### Note multi-account

Senza `--account <id>`, i comandi CLI Matrix usano l'account predefinito implicito. Se hai più account con nome e non hai impostato `channels.matrix.defaultAccount`, rifiuteranno di indovinare e ti chiederanno di scegliere. Quando E2EE è disabilitata o non disponibile per un account con nome, gli errori indicano la chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, `startupVerification` ha come valore predefinito `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'auto-verifica in un altro client Matrix, saltando i duplicati e applicando un cooldown (24 ore per impostazione predefinita). Regola con `startupVerificationCooldownHours` o disabilita con `startupVerification: "off"`.

    All'avvio viene eseguito anche un passaggio conservativo di bootstrap crittografico che riutilizza l'archiviazione dei segreti e l'identità di firma incrociata correnti. Se lo stato di bootstrap è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, l'avvio registra un avviso e resta non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Vedi [Migrazione Matrix](/it/channels/matrix-migration) per il flusso completo di aggiornamento.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica avvisi del ciclo di vita della verifica nella stanza di verifica DM rigorosa come messaggi `m.notice`: richiesta, pronto (con indicazioni "Verifica tramite emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'auto-verifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato una volta disponibile la verifica tramite emoji - devi comunque confrontare e confermare "Corrispondono" nel tuo client Matrix.

    Gli avvisi di sistema della verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Dispositivo Matrix eliminato o non valido">
    Se `verify status` dice che il dispositivo corrente non è più elencato sull'homeserver, crea un nuovo dispositivo Matrix OpenClaw. Per l'accesso con password:

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

  <Accordion title="Igiene dei dispositivi">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elenca e rimuovi:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Archivio crittografico">
    Matrix E2EE usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico persiste in `crypto-idb-snapshot.json` (permessi file restrittivi).

    Lo stato runtime cifrato risiede in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include l'archivio di sincronizzazione, l'archivio crittografico, la chiave di recupero, lo snapshot IDB, i binding dei thread e lo stato della verifica all'avvio. Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore radice esistente, così lo stato precedente rimane visibile.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

Aggiorna il profilo personale Matrix per l'account selezionato:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Puoi passare entrambe le opzioni in una sola chiamata. Matrix accetta direttamente gli URL avatar `mxc://`; quando passi `http://` o `https://`, OpenClaw carica prima il file e memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override per account).

## Thread

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii tramite strumento messaggio. Due controlli indipendenti determinano il comportamento:

### Instradamento della sessione (`sessionScope`)

`dm.sessionScope` decide come le stanze DM Matrix vengono mappate alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze DM con lo stesso peer instradato condividono una sessione.
- `"per-room"`: ogni stanza DM Matrix ottiene la propria chiave di sessione, anche quando il peer è lo stesso.

I binding espliciti delle conversazioni prevalgono sempre su `sessionScope`, quindi le stanze e i thread associati mantengono la sessione di destinazione scelta.

### Risposte in thread (`threadReplies`)

`threadReplies` decide dove il bot pubblica la sua risposta:

- `"off"`: le risposte sono di primo livello. I messaggi in thread in ingresso restano nella sessione del messaggio padre.
- `"inbound"`: rispondi dentro un thread solo quando il messaggio in ingresso era già in quel thread.
- `"always"`: rispondi dentro un thread radicato nel messaggio che ha attivato l'azione; quella conversazione viene instradata tramite una sessione con ambito thread corrispondente dal primo trigger in poi.

`dm.threadReplies` sovrascrive questo comportamento solo per i DM - ad esempio, mantieni isolati i thread delle stanze mantenendo piatti i DM.

### Ereditarietà dei thread e comandi slash

- I messaggi in thread in ingresso includono il messaggio radice del thread come contesto agente aggiuntivo.
- Gli invii dello strumento messaggi ereditano automaticamente il thread Matrix corrente quando mirano alla stessa stanza (o allo stesso destinatario utente DM), a meno che venga fornito un `threadId` esplicito.
- Il riutilizzo del destinatario utente DM entra in funzione solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw ricade sul normale routing con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vincolato al thread funzionano tutti nelle stanze Matrix e nei DM.
- `/focus` di livello superiore crea un nuovo thread Matrix e lo vincola alla sessione di destinazione quando `threadBindings.spawnSessions` è abilitato.
- Eseguire `/focus` o `/acp spawn --thread here` dentro un thread Matrix esistente vincola quel thread sul posto.

Quando OpenClaw rileva una stanza DM Matrix in collisione con un'altra stanza DM sulla stessa sessione condivisa, pubblica un `m.notice` una sola volta in quella stanza che rimanda alla via d'uscita `/focus` e suggerisce una modifica di `dm.sessionScope`. L'avviso appare solo quando i vincoli di thread sono abilitati.

## Vincoli conversazione ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP durevoli senza cambiare la superficie di chat.

Flusso rapido per operatore:

- Esegui `/acp spawn codex --bind here` dentro il DM Matrix, la stanza o il thread esistente che vuoi continuare a usare.
- In un DM o in una stanza Matrix di livello superiore, il DM/la stanza corrente resta la superficie di chat e i messaggi futuri vengono indirizzati alla sessione ACP generata.
- Dentro un thread Matrix esistente, `--bind here` vincola quel thread corrente sul posto.
- `/new` e `/reset` reimpostano la stessa sessione ACP vincolata sul posto.
- `/acp close` chiude la sessione ACP e rimuove il vincolo.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnSessions` controlla `/acp spawn --thread auto|here`, dove OpenClaw deve creare o vincolare un thread Matrix figlio.

### Configurazione dei vincoli di thread

Matrix eredita le impostazioni predefinite globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Le generazioni di sessioni Matrix vincolate al thread sono abilitate per impostazione predefinita:

- Imposta `threadBindings.spawnSessions: false` per impedire a `/focus` di livello superiore e `/acp spawn --thread auto|here` di creare/vincolare thread Matrix.
- Imposta `threadBindings.defaultSpawnContext: "isolated"` quando le generazioni di thread di subagenti nativi non devono biforcare la trascrizione padre.

## Reazioni

Matrix supporta reazioni in uscita, notifiche di reazioni in ingresso e reazioni di conferma.

Gli strumenti per le reazioni in uscita sono controllati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix.
- `emoji=""` rimuove le reazioni proprie del bot su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dal bot.

**Ordine di risoluzione** (vince il primo valore definito):

| Impostazione            | Ordine                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → canale → `messages.ackReaction` → fallback all'emoji dell'identità agente |
| `ackReactionScope`      | per account → canale → `messages.ackReactionScope` → predefinito `"group-mentions"` |
| `reactionNotifications` | per account → canale → predefinito `"own"`                                       |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando mirano a messaggi Matrix scritti dal bot; `"off"` disabilita gli eventi di sistema delle reazioni. Le rimozioni di reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente. Ricade su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo della stanza. I DM continuano a usare la normale cronologia di sessione.
- La cronologia delle stanze Matrix è solo in sospeso: OpenClaw memorizza nel buffer i messaggi della stanza che non hanno ancora attivato una risposta, poi crea uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio di trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I tentativi ripetuti dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di avanzare verso messaggi della stanza più recenti.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per contesto supplementare della stanza come testo di risposta recuperato, radici di thread e cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli allowlist attivi per stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso possa attivare una risposta.
L'autorizzazione del trigger proviene comunque da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni della policy DM.

## Policy DM e stanza

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

Per silenziare completamente i DM mantenendo operative le stanze, imposta `dm.enabled: false`:

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

Vedi [Gruppi](/it/channels/groups) per il comportamento di gate tramite menzione e allowlist.

Esempio di abbinamento per DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di abbinamento in sospeso e può inviare una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Abbinamento](/it/channels/pairing) per il flusso di abbinamento DM condiviso e il layout di archiviazione.

## Riparazione stanza diretta

Se lo stato dei messaggi diretti perde sincronizzazione, OpenClaw può ritrovarsi con mappature `m.direct` obsolete che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona la mappatura corrente per un peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per configurazioni multi-account. Il flusso di riparazione:

- preferisce un DM 1:1 rigoroso già mappato in `m.direct`
- ricade su qualsiasi DM 1:1 rigoroso attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste un DM sano

Non elimina automaticamente le vecchie stanze. Sceglie il DM sano e aggiorna la mappatura in modo che futuri invii Matrix, avvisi di verifica e altri flussi di messaggi diretti puntino alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo. Configura sotto `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` per un override per account):

- `enabled`: recapita le approvazioni tramite prompt nativi Matrix. Quando non impostato o `"auto"`, Matrix si abilita automaticamente una volta che può essere risolto almeno un approvatore. Imposta `false` per disabilitare esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare richieste exec. Facoltativo - ricade su `channels.matrix.dm.allowFrom`.
- `target`: dove vanno i prompt. `"dm"` (predefinito) invia ai DM degli approvatori; `"channel"` invia alla stanza Matrix o al DM di origine; `"both"` invia a entrambi.
- `agentFilter` / `sessionFilter`: allowlist facoltative per quali agenti/sessioni attivano il recapito Matrix.

L'autorizzazione differisce leggermente tra i tipi di approvazione:

- **Approvazioni exec** usano `execApprovals.approvers`, con fallback a `dm.allowFrom`.
- **Approvazioni Plugin** autorizzano solo tramite `dm.allowFrom`.

Entrambi i tipi condividono scorciatoie di reazione Matrix e aggiornamenti dei messaggi. Gli approvatori vedono scorciatoie di reazione sul messaggio di approvazione principale:

- `✅` consenti una volta
- `❌` nega
- `♾️` consenti sempre (quando la policy exec effettiva lo permette)

Comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. Il recapito al canale per le approvazioni exec include il testo del comando - abilita `channel` o `both` solo in stanze attendibili.

Correlato: [Approvazioni exec](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, ecc.) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi preceduti dalla menzione Matrix propria del bot, quindi `@bot:server /new` attiva il percorso del comando senza una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa con Tab il bot prima di digitare il comando.

Le regole di autorizzazione si applicano comunque: i mittenti dei comandi devono soddisfare le stesse policy allowlist/proprietario per DM o stanza dei messaggi semplici.

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

- I valori di livello superiore `channels.matrix` agiscono come impostazioni predefinite per gli account nominati, a meno che un account li sovrascriva.
- Limita una voce di stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra account; `account: "default"` funziona comunque quando l'account predefinito è configurato al livello superiore.

**Selezione dell'account predefinito:**

- Imposta `defaultAccount` per scegliere l'account nominato preferito da routing implicito, probing e comandi CLI.
- Se hai più account e uno si chiama letteralmente `default`, OpenClaw lo usa implicitamente anche quando `defaultAccount` non è impostato.
- Se hai più account nominati e non è selezionato alcun predefinito, i comandi CLI rifiutano di indovinare - imposta `defaultAccount` o passa `--account <id>`.
- Il blocco di livello superiore `channels.matrix.*` viene trattato come account `default` implicito solo quando la sua autenticazione è completa (`homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`). Gli account nominati restano individuabili da `homeserver` + `userId` una volta che le credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw promuove una configurazione a singolo account a multi-account durante la riparazione o la configurazione, preserva l'account nominato esistente se ne esiste uno o se `defaultAccount` punta già a uno. Solo le chiavi di autenticazione/bootstrap Matrix vengono spostate nell'account promosso; le chiavi condivise della policy di recapito restano al livello superiore.

Vedi [Riferimento di configurazione](/it/gateway/config-channels#multi-account-all-channels) per il pattern multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu
non scelga esplicitamente di abilitarli per account.

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

Questa opzione esplicita consente solo destinazioni private/interne attendibili. Gli homeserver pubblici in chiaro, come
`http://matrix.example.org:8008`, restano bloccati. Preferisci `https://` quando possibile.

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

Gli account nominati possono sovrascrivere il valore predefinito di primo livello con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix in runtime e per i controlli di stato dell'account.

## Risoluzione delle destinazioni

Matrix accetta queste forme di destinazione ovunque OpenClaw richieda una destinazione stanza o utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Gli ID stanza Matrix distinguono tra maiuscole e minuscole. Usa esattamente la stessa capitalizzazione dell'ID stanza da Matrix
quando configuri destinazioni di consegna esplicite, cron job, associazioni o allowlist.
OpenClaw mantiene canoniche le chiavi di sessione interne per l'archiviazione, quindi quelle chiavi in minuscolo
non sono una fonte affidabile per gli ID di consegna Matrix.

La ricerca nella directory live usa l'account Matrix connesso:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti. La ricerca del nome delle stanze unite è best effort e si applica solo alle allowlist stanza in runtime quando è impostato `dangerouslyAllowNameMatching: true`.
- Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione dell'allowlist in runtime.

## Riferimento di configurazione

I campi utente in stile allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi (opzione più sicura). Le voci utente che non sono ID vengono ignorate per impostazione predefinita. Se imposti `dangerouslyAllowNameMatching: true`, le corrispondenze esatte con i nomi visualizzati nella directory Matrix vengono risolte all'avvio e ogni volta che l'allowlist cambia mentre il monitor è in esecuzione; le voci che non possono essere risolte vengono ignorate in runtime.

Le chiavi allowlist stanza (`groups`, legacy `rooms`) devono essere ID stanza o alias. Le chiavi con semplice nome stanza vengono ignorate per impostazione predefinita; `dangerouslyAllowNameMatching: true` ripristina la ricerca best effort nei nomi delle stanze unite.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta di visualizzazione facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `accounts`: sovrascritture nominate per account. I valori di primo livello `channels.matrix` vengono ereditati come predefiniti.
- `homeserver`: URL homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consenti a questo account di connettersi a `localhost`, IP LAN/Tailscale o nomi host interni.
- `proxy`: URL proxy HTTP(S) facoltativo per il traffico Matrix. Sovrascrittura per account supportata.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per autenticazione basata su token. Sono supportati valori in chiaro e SecretRef tra provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per login basato su password. Sono supportati valori in chiaro e SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo usato durante il login con password.
- `avatarUrl`: URL dell'avatar personale memorizzato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.

### Crittografia

- `encryption`: abilita E2EE. Valore predefinito: `false`.
- `startupVerification`: `"if-unverified"` (predefinito quando E2EE è attiva) o `"off"`. Richiede automaticamente l'autoverifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: tempo di attesa prima della prossima richiesta automatica all'avvio. Valore predefinito: `24`.

### Accesso e policy

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valore predefinito: `"allowlist"`.
- `groupAllowFrom`: allowlist di ID utente per il traffico stanza.
- `dm.enabled`: quando `false`, ignora tutti i DM. Valore predefinito: `true`.
- `dm.policy`: `"pairing"` (predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot si è unito e ha classificato la stanza come DM; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM.
- `dm.sessionScope`: `"per-user"` (predefinito) o `"per-room"`.
- `dm.threadReplies`: sovrascrittura solo per DM per il threading delle risposte (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando `true`, forza tutte le policy DM attive (tranne `"disabled"`) e le policy di gruppo `"open"` a `"allowlist"`. Non modifica le policy `"disabled"`.
- `dangerouslyAllowNameMatching`: quando `true`, consente la ricerca nella directory dei nomi visualizzati Matrix per le voci allowlist utente e la ricerca dei nomi delle stanze unite per le chiavi allowlist stanza. Preferisci ID completi `@user:server` e ID stanza o alias.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Valore predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi gli inviti in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: sovrascritture per canale per instradamento e ciclo di vita delle sessioni associate a thread.
- `streaming`: `"off"` (predefinito), `"partial"`, `"quiet"` o forma oggetto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, i blocchi assistant completati vengono mantenuti come messaggi di avanzamento separati.
- `markdown`: configurazione facoltativa di rendering Markdown per il testo in uscita.
- `responsePrefix`: stringa facoltativa anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione dei blocchi in uscita in caratteri quando `chunkMode: "length"`. Valore predefinito: `4000`.
- `chunkMode`: `"length"` (predefinito, divide per numero di caratteri) o `"newline"` (divide ai confini di riga).
- `historyLimit`: numero di messaggi stanza recenti inclusi come `InboundHistory` quando un messaggio stanza attiva l'agent. Ripiega su `messages.groupChat.historyLimit`; valore predefinito effettivo `0` (disabilitato).
- `mediaMaxMb`: limite di dimensione media in MB per invii in uscita ed elaborazione in ingresso.

### Impostazioni delle reazioni

- `ackReaction`: sovrascrittura della reazione ack per questo canale/account.
- `ackReactionScope`: sovrascrittura dell'ambito (`"group-mentions"` predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`"own"` predefinito, `"off"`).

### Strumenti e sovrascritture per stanza

- `actions`: controllo dell'accesso agli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa policy per stanza. L'identità di sessione usa l'ID stanza stabile dopo la risoluzione. (`rooms` è un alias legacy.)
  - `groups.<room>.account`: limita una voce stanza ereditata a un account specifico.
  - `groups.<room>.allowBots`: sovrascrittura per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.users`: allowlist mittenti per stanza.
  - `groups.<room>.tools`: sovrascritture allow/deny degli strumenti per stanza.
  - `groups.<room>.autoReply`: sovrascrittura del gating delle menzioni per stanza. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza di nuovo.
  - `groups.<room>.skills`: filtro Skills per stanza.
  - `groups.<room>.systemPrompt`: frammento di prompt di sistema per stanza.

### Impostazioni di approvazione exec

- `execApprovals.enabled`: consegna le approvazioni exec tramite prompt nativi Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. Ripiega su `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: allowlist facoltative di agent/sessione per la consegna.

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Pairing](/it/channels/pairing) - autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e hardening
