---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurazione dell'E2EE e della verifica di Matrix
summary: Stato del supporto Matrix, configurazione iniziale ed esempi di configurazione
title: Matrice
x-i18n:
    generated_at: "2026-04-30T08:38:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un Plugin di canale incluso per OpenClaw.
Usa l'SDK ufficiale `matrix-js-sdk` e supporta DM, stanze, thread, media, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Le versioni pacchettizzate attuali di OpenClaw includono il Plugin Matrix. Non devi installare nulla; la configurazione di `channels.matrix.*` (vedi [Configurazione](#setup)) è ciò che lo attiva.

Per build più vecchie o installazioni personalizzate che escludono Matrix, installa un pacchetto npm attuale quando ne viene pubblicato uno:

```bash
openclaw plugins install @openclaw/matrix
```

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato, usa una build pacchettizzata attuale di OpenClaw o un checkout locale finché non viene pubblicato un pacchetto npm più recente.

Da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e abilita il Plugin, quindi non serve un passaggio separato `openclaw plugins enable matrix`. Il Plugin non fa comunque nulla finché non configuri il canale qui sotto. Vedi [Plugin](/it/tools/plugin) per il comportamento generale dei Plugin e le regole di installazione.

## Configurazione

1. Crea un account Matrix sul tuo homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`.
3. Riavvia il Gateway.
4. Avvia un DM con il bot, oppure invitalo in una stanza (vedi [auto-join](#auto-join): gli inviti nuovi arrivano solo quando `autoJoin` li consente).

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata richiede: URL dell'homeserver, metodo di autenticazione (token di accesso o password), ID utente (solo autenticazione con password), nome dispositivo opzionale, se abilitare E2EE e se configurare accesso alle stanze e auto-join.

Se esistono già variabili d'ambiente `MATRIX_*` corrispondenti e l'account selezionato non ha credenziali salvate, la procedura guidata offre una scorciatoia tramite variabili d'ambiente. Per risolvere i nomi delle stanze prima di salvare un elenco consentiti, esegui `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE è abilitata, la procedura guidata scrive la configurazione ed esegue lo stesso bootstrap di [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` ha valore predefinito `off`. Con il valore predefinito, il bot non apparirà in nuove stanze o DM da inviti recenti finché non lo farai entrare manualmente.

OpenClaw non può sapere al momento dell'invito se una stanza invitata è un DM o un gruppo, quindi tutti gli inviti, inclusi quelli in stile DM, passano prima da `autoJoin`. `dm.policy` si applica solo dopo, quando il bot è entrato e la stanza è stata classificata.

<Warning>
Imposta `autoJoin: "allowlist"` più `autoJoinAllowlist` per limitare gli inviti accettati dal bot, oppure `autoJoin: "always"` per accettare ogni invito.

`autoJoinAllowlist` accetta solo target stabili: `!roomId:server`, `#alias:server` o `*`. I nomi di stanza semplici vengono rifiutati; le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitata.
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

### Formati dei target dell'elenco consentiti

Gli elenchi consentiti di DM e stanze funzionano meglio con ID stabili:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. I nomi visualizzati vengono risolti solo quando la directory dell'homeserver restituisce esattamente una corrispondenza.
- Stanze (`groups`, `autoJoinAllowlist`): usa `!room:server` o `#alias:server`. I nomi vengono risolti nel miglior modo possibile rispetto alle stanze a cui il bot ha già aderito; le voci non risolte vengono ignorate in runtime.

### Normalizzazione dell'ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato. Per esempio, `Ops Bot` diventa `ops-bot`. La punteggiatura viene sottoposta a escape nei nomi delle variabili d'ambiente con ambito, così due account non possono collidere: `-` → `_X2D_`, quindi `ops-prod` viene mappato a `MATRIX_OPS_X2D_PROD_*`.

### Credenziali memorizzate nella cache

Matrix archivia le credenziali memorizzate nella cache sotto `~/.openclaw/credentials/matrix/`:

- account predefinito: `credentials.json`
- account nominati: `credentials-<account>.json`

Quando lì esistono credenziali memorizzate nella cache, OpenClaw considera Matrix configurato anche se il token di accesso non è nel file di configurazione: questo copre configurazione, `openclaw doctor` e sonde di stato del canale.

### Variabili d'ambiente

Usate quando la chiave di configurazione equivalente non è impostata. L'account predefinito usa nomi senza prefisso; gli account nominati usano l'ID account inserito prima del suffisso.

| Account predefinito    | Account nominato (`<ID>` è l'ID account normalizzato) |
| ---------------------- | ----------------------------------------------------- |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                              |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                            |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                 |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                                |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                               |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                             |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                            |

Per l'account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. Le variabili d'ambiente della chiave di recupero vengono lette dai flussi CLI consapevoli del recupero (`verify backup restore`, `verify device`, `verify bootstrap`) quando passi la chiave tramite pipe con `--recovery-key-stdin`.

`MATRIX_HOMESERVER` non può essere impostata da un file `.env` dell'area di lavoro; vedi [File `.env` dell'area di lavoro](/it/gateway/security).

## Esempio di configurazione

Una base pratica con pairing DM, elenco consentiti delle stanze ed E2EE:

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

Lo streaming delle risposte Matrix è opzionale. `streaming` controlla come OpenClaw consegna la risposta dell'assistente in corso; `blockStreaming` controlla se ogni blocco completato viene preservato come proprio messaggio Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Per mantenere le anteprime live delle risposte ma nascondere le righe intermedie di strumenti/avanzamento, usa la forma oggetto:

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

| `streaming`          | Comportamento                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predefinito) | Attende la risposta completa, invia una volta. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                            |
| `"partial"`          | Modifica un normale messaggio di testo sul posto mentre il modello scrive il blocco corrente. I client Matrix standard possono notificare alla prima anteprima, non alla modifica finale. |
| `"quiet"`            | Come `"partial"`, ma il messaggio è un avviso senza notifica. I destinatari ricevono una notifica solo quando una regola push per utente corrisponde alla modifica finalizzata (vedi sotto). |

`blockStreaming` è indipendente da `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (predefinito)                   |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `"partial"` / `"quiet"` | Bozza live per il blocco corrente, blocchi completati mantenuti come messaggi | Bozza live per il blocco corrente, finalizzata sul posto |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco completato              | Un messaggio Matrix con notifica per la risposta completa |

Note:

- Se un'anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell'anteprima e ripiega sulla consegna solo finale.
- Le risposte con media inviano sempre gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta finale con media.
- Gli aggiornamenti di anteprima dell'avanzamento degli strumenti sono abilitati per impostazione predefinita quando lo streaming di anteprima Matrix è attivo. Imposta `streaming.preview.toolProgress: false` per mantenere le modifiche di anteprima per il testo della risposta ma lasciare l'avanzamento degli strumenti sul percorso di consegna normale.
- Le modifiche di anteprima costano chiamate API Matrix aggiuntive. Lascia `streaming: "off"` se vuoi il profilo di rate limit più conservativo.

## Metadati di approvazione

Le richieste di approvazione native Matrix sono normali eventi `m.room.message` con contenuto evento personalizzato specifico di OpenClaw sotto `com.openclaw.approval`. Matrix consente chiavi personalizzate nel contenuto degli eventi, quindi i client standard continuano a renderizzare il corpo testuale mentre i client consapevoli di OpenClaw possono leggere ID approvazione strutturato, tipo, stato, decisioni disponibili e dettagli di esecuzione/Plugin.

Quando una richiesta di approvazione è troppo lunga per un evento Matrix, OpenClaw suddivide il testo visibile in blocchi e allega `com.openclaw.approval` solo al primo blocco. Le reazioni per le decisioni di consenso/rifiuto sono vincolate a quel primo evento, quindi le richieste lunghe mantengono lo stesso target di approvazione delle richieste a evento singolo.

### Regole push self-hosted per anteprime finalizzate silenziose

`streaming: "quiet"` notifica i destinatari solo quando un blocco o un turno viene finalizzato: una regola push per utente deve corrispondere al marcatore di anteprima finalizzata. Vedi [Regole push Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la ricetta completa (token destinatario, controllo pusher, installazione della regola, note per homeserver).

## Stanze bot-to-bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix configurati di OpenClaw vengono ignorati.

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

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati nelle stanze e nei DM consentiti.
- `allowBots: "mentions"` accetta quei messaggi solo quando menzionano visibilmente questo bot nelle stanze. I DM sono comunque consentiti.
- `groups.<room>.allowBots` sostituisce l'impostazione a livello di account per una stanza.
- OpenClaw continua a ignorare i messaggi dallo stesso ID utente Matrix per evitare cicli di auto-risposta.
- Matrix non espone qui un flag bot nativo; OpenClaw tratta "scritto da bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa elenchi consentiti delle stanze e requisiti di menzione rigorosi quando abiliti traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` in modo che le anteprime delle immagini siano crittografate insieme all'allegato completo. Le stanze non crittografate usano ancora il semplice `thumbnail_url`. Non è necessaria alcuna configurazione: il Plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile dalla macchina) e `--account <id>` (configurazioni multi-account). L'output è conciso per impostazione predefinita, con logging interno SDK silenzioso. Gli esempi seguenti mostrano la forma canonica; aggiungi i flag secondo necessità.

### Abilitare la crittografia

```bash
openclaw matrix encryption setup
```

Inizializza l'archiviazione dei segreti e la cross-signing, crea un backup delle chiavi stanza se necessario, quindi stampa stato e passaggi successivi. Flag utili:

- `--recovery-key <key>` applica una chiave di recupero prima dell'inizializzazione (preferisci la forma tramite stdin documentata sotto)
- `--force-reset-cross-signing` elimina l'identità di cross-signing corrente e ne crea una nuova (usare solo intenzionalmente)

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

`verify status` riporta tre segnali di attendibilità indipendenti (`--verbose` li mostra tutti):

- `Locally trusted`: attendibile solo per questo client
- `Cross-signing verified`: l'SDK segnala la verifica tramite cross-signing
- `Signed by owner`: firmato dalla tua chiave di autofirma (solo diagnostica)

`Verified by owner` diventa `yes` solo quando `Cross-signing verified` è `yes`. L'attendibilità locale o una firma del proprietario da sola non sono sufficienti.

`--allow-degraded-local-state` restituisce una diagnostica best-effort senza preparare prima l'account Matrix; utile per controlli offline o parzialmente configurati.

### Verificare questo dispositivo con una chiave di recupero

La chiave di recupero è sensibile: inviala tramite stdin invece di passarla sulla riga di comando. Imposta `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` per un account con nome):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando riporta tre stati:

- `Recovery key accepted`: Matrix ha accettato la chiave per l'archiviazione dei segreti o l'attendibilità del dispositivo.
- `Backup usable`: il backup delle chiavi stanza può essere caricato con il materiale di recupero attendibile.
- `Device verified by owner`: questo dispositivo ha piena attendibilità dell'identità di cross-signing Matrix.

Esce con codice diverso da zero quando l'attendibilità completa dell'identità è incompleta, anche se la chiave di recupero ha sbloccato il materiale di backup. In quel caso, completa l'autoverifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Cross-signing verified: yes` prima di uscire correttamente. Usa `--timeout-ms <ms>` per regolare l'attesa.

È accettata anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave finisce nella cronologia della shell.

### Inizializzare o riparare la cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` è il comando di riparazione e configurazione per gli account crittografati. In ordine:

- inizializza l'archiviazione dei segreti, riutilizzando una chiave di recupero esistente quando possibile
- inizializza la cross-signing e carica le chiavi pubbliche mancanti
- contrassegna e firma tramite cross-signing il dispositivo corrente
- crea un backup delle chiavi stanza lato server se non esiste già

Se l'homeserver richiede UIA per caricare le chiavi di cross-signing, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, quindi `m.login.password` (richiede `channels.matrix.password`).

Flag utili:

- `--recovery-key-stdin` (abbinalo a `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) o `--recovery-key <key>`
- `--force-reset-cross-signing` per eliminare l'identità di cross-signing corrente (solo intenzionalmente)

### Backup delle chiavi stanza

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se esiste un backup lato server e se questo dispositivo può decrittografarlo. `backup restore` importa le chiavi stanza sottoposte a backup nello store crittografico locale; se la chiave di recupero è già su disco puoi omettere `--recovery-key-stdin`.

Per sostituire un backup danneggiato con una nuova base di riferimento (accettando la perdita della cronologia precedente non recuperabile; può anche ricreare l'archiviazione dei segreti se il segreto del backup corrente non è caricabile):

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

Invia una richiesta di verifica da questo account OpenClaw. `--own-user` richiede l'autoverifica (accetti la richiesta in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` prendono di mira qualcun altro. `--own-user` non può essere combinato con gli altri flag di destinazione.

Per la gestione del ciclo di vita di livello più basso, in genere mentre si seguono richieste in ingresso da un altro client, questi comandi agiscono su una richiesta specifica `<id>` (stampata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accettare una richiesta in ingresso                                 |
| `openclaw matrix verify start <id>`        | Avviare il flusso SAS                                               |
| `openclaw matrix verify sas <id>`          | Stampare le emoji o i decimali SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confermare che il SAS corrisponde a quello mostrato dall'altro client |
| `openclaw matrix verify mismatch-sas <id>` | Rifiutare il SAS quando le emoji o i decimali non corrispondono     |
| `openclaw matrix verify cancel <id>`       | Annullare; accetta `--reason <text>` e `--code <matrix-code>` opzionali |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come suggerimenti di follow-up DM quando la verifica è ancorata a una specifica stanza di messaggi diretti.

### Note multi-account

Senza `--account <id>`, i comandi CLI Matrix usano l'account predefinito implicito. Se hai più account con nome e non hai impostato `channels.matrix.defaultAccount`, si rifiuteranno di indovinare e ti chiederanno di scegliere. Quando E2EE è disabilitata o non disponibile per un account con nome, gli errori indicano la chiave di configurazione di quell'account, per esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, `startupVerification` usa per impostazione predefinita `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, saltando i duplicati e applicando un periodo di attesa (24 ore per impostazione predefinita). Regola con `startupVerificationCooldownHours` o disabilita con `startupVerification: "off"`.

    L'avvio esegue anche un passaggio conservativo di inizializzazione crittografica che riutilizza l'archiviazione dei segreti e l'identità di cross-signing correnti. Se lo stato di inizializzazione è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, l'avvio registra un avviso e rimane non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Consulta [Migrazione Matrix](/it/channels/matrix-migration) per il flusso di aggiornamento completo.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica avvisi del ciclo di vita della verifica nella stanza DM di verifica rigorosa come messaggi `m.notice`: richiesta, pronta (con indicazioni "Verifica tramite emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato quando la verifica tramite emoji è disponibile: devi comunque confrontare e confermare "Corrispondono" nel tuo client Matrix.

    Gli avvisi di sistema di verifica non vengono inoltrati alla pipeline di chat dell'agente.

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

  <Accordion title="Store crittografico">
    Matrix E2EE usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico persiste in `crypto-idb-snapshot.json` (permessi file restrittivi).

    Lo stato di runtime crittografato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include lo store di sincronizzazione, lo store crittografico, la chiave di recupero, lo snapshot IDB, i binding dei thread e lo stato di verifica all'avvio. Quando il token cambia ma l'identità dell'account rimane la stessa, OpenClaw riutilizza la migliore root esistente così lo stato precedente rimane visibile.

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

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii tramite strumento di messaggistica. Due controlli indipendenti regolano il comportamento:

### Routing della sessione (`sessionScope`)

`dm.sessionScope` decide come le stanze DM Matrix si mappano alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze DM con lo stesso peer instradato condividono una sessione.
- `"per-room"`: ogni stanza DM Matrix ottiene la propria chiave di sessione, anche quando il peer è lo stesso.

I binding espliciti delle conversazioni prevalgono sempre su `sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.

### Threading delle risposte (`threadReplies`)

`threadReplies` decide dove il bot pubblica la sua risposta:

- `"off"`: le risposte sono di primo livello. I messaggi in ingresso in thread rimangono nella sessione padre.
- `"inbound"`: risponde dentro un thread solo quando il messaggio in ingresso era già in quel thread.
- `"always"`: risponde dentro un thread radicato nel messaggio attivatore; quella conversazione viene instradata tramite una sessione con ambito thread corrispondente dal primo attivatore in poi.

`dm.threadReplies` sovrascrive questo comportamento solo per i DM, per esempio per mantenere isolati i thread delle stanze tenendo piatti i DM.

### Ereditarietà dei thread e comandi slash

- I messaggi in thread in ingresso includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii tramite strumento messaggi ereditano automaticamente il thread Matrix corrente quando hanno come destinazione la stessa stanza (o lo stesso target utente DM), salvo quando viene fornito un `threadId` esplicito.
- Il riuso del target utente DM entra in gioco solo quando i metadati della sessione corrente dimostrano che si tratta dello stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw ripiega sul normale instradamento con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vincolato al thread funzionano tutti nelle stanze Matrix e nei DM.
- Un `/focus` di primo livello crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSubagentSessions: true`.
- L'esecuzione di `/focus` o `/acp spawn --thread here` dentro un thread Matrix esistente associa quel thread sul posto.

Quando OpenClaw rileva una stanza DM Matrix in conflitto con un'altra stanza DM sulla stessa sessione condivisa, pubblica in quella stanza un `m.notice` una tantum che punta alla via di uscita `/focus` e suggerisce una modifica di `dm.sessionScope`. L'avviso appare solo quando le associazioni dei thread sono abilitate.

## Associazioni delle conversazioni ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP duraturi senza cambiare la superficie di chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` dentro il DM Matrix, la stanza o il thread esistente che vuoi continuare a usare.
- In un DM o in una stanza Matrix di primo livello, il DM/la stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- Dentro un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnAcpSessions` è richiesto solo per `/acp spawn --thread auto|here`, dove OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione dell'associazione dei thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

I flag di spawn vincolati ai thread Matrix sono opt-in:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di primo livello di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP a thread Matrix.

## Reazioni

Matrix supporta reazioni in uscita, notifiche di reazioni in ingresso e reazioni di conferma.

Gli strumenti per le reazioni in uscita sono regolati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix.
- `emoji=""` rimuove le reazioni del bot stesso su quell'evento.
- `remove: true` rimuove solo la reazione con l'emoji specificata dal bot.

**Ordine di risoluzione** (vince il primo valore definito):

| Impostazione            | Ordine                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → canale → `messages.ackReaction` → fallback emoji identità agente   |
| `ackReactionScope`      | per account → canale → `messages.ackReactionScope` → predefinito `"group-mentions"` |
| `reactionNotifications` | per account → canale → predefinito `"own"`                                       |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando hanno come destinazione messaggi Matrix scritti dal bot; `"off"` disabilita gli eventi di sistema delle reazioni. Le rimozioni di reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente. Ripiega su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo della stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo in sospeso: OpenClaw memorizza temporaneamente i messaggi della stanza che non hanno ancora attivato una risposta, poi scatta un'istantanea di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I nuovi tentativi dello stesso evento Matrix riusano l'istantanea originale della cronologia invece di avanzare verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come il testo delle risposte recuperate, le radici dei thread e la cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli allowlist attivi della stanza/dell'utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso possa attivare una risposta.
L'autorizzazione del trigger deriva comunque da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni delle policy DM.

## Policy DM e stanze

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

Vedi [Gruppi](/it/channels/groups) per il comportamento di gating delle menzioni e allowlist.

Esempio di abbinamento per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riusa lo stesso codice di abbinamento in sospeso e può inviare una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Abbinamento](/it/channels/pairing) per il flusso condiviso di abbinamento DM e il layout di archiviazione.

## Riparazione delle stanze dirette

Se lo stato dei messaggi diretti va fuori sincrono, OpenClaw può ritrovarsi con mappature `m.direct` obsolete che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona la mappatura corrente per un peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per configurazioni multi-account. Il flusso di riparazione:

- preferisce un DM 1:1 rigoroso già mappato in `m.direct`
- ripiega su qualsiasi DM 1:1 rigoroso attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM integro

Non elimina automaticamente le vecchie stanze. Sceglie il DM integro e aggiorna la mappatura in modo che futuri invii Matrix, avvisi di verifica e altri flussi di messaggi diretti abbiano come destinazione la stanza corretta.

## Approvazioni Exec

Matrix può agire come client di approvazione nativo. Configura sotto `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` per un override per account):

- `enabled`: consegna le approvazioni tramite prompt nativi Matrix. Quando non impostato o `"auto"`, Matrix si abilita automaticamente non appena almeno un approvatore può essere risolto. Imposta `false` per disabilitare esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare richieste exec. Facoltativo: ripiega su `channels.matrix.dm.allowFrom`.
- `target`: dove vengono inviati i prompt. `"dm"` (predefinito) invia ai DM degli approvatori; `"channel"` invia alla stanza Matrix o al DM di origine; `"both"` invia a entrambi.
- `agentFilter` / `sessionFilter`: allowlist facoltative per determinare quali agenti/sessioni attivano la consegna Matrix.

L'autorizzazione differisce leggermente tra i tipi di approvazione:

- Le **approvazioni Exec** usano `execApprovals.approvers`, con fallback a `dm.allowFrom`.
- Le **approvazioni Plugin** autorizzano solo tramite `dm.allowFrom`.

Entrambi i tipi condividono scorciatoie tramite reazioni Matrix e aggiornamenti dei messaggi. Gli approvatori vedono scorciatoie tramite reazione sul messaggio di approvazione principale:

- `✅` consenti una volta
- `❌` nega
- `♾️` consenti sempre (quando la policy exec effettiva lo permette)

Comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. La consegna su canale per le approvazioni exec include il testo del comando: abilita `channel` o `both` solo in stanze attendibili.

Correlato: [Approvazioni Exec](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` ecc.) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa automaticamente con Tab il bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare le stesse policy allowlist/proprietario dei DM o delle stanze dei messaggi normali.

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

- I valori `channels.matrix` di primo livello agiscono come predefiniti per gli account nominati, salvo override da parte di un account.
- Limita una voce stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra account; `account: "default"` funziona ancora quando l'account predefinito è configurato al livello superiore.

**Selezione dell'account predefinito:**

- Imposta `defaultAccount` per scegliere l'account nominato preferito da instradamento implicito, probing e comandi CLI.
- Se hai più account e uno si chiama letteralmente `default`, OpenClaw lo usa implicitamente anche quando `defaultAccount` non è impostato.
- Se hai più account nominati e nessun predefinito selezionato, i comandi CLI si rifiutano di indovinare: imposta `defaultAccount` o passa `--account <id>`.
- Il blocco `channels.matrix.*` di primo livello viene trattato come account `default` implicito solo quando la sua autenticazione è completa (`homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`). Gli account nominati restano rilevabili da `homeserver` + `userId` quando credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw promuove una configurazione a singolo account a multi-account durante una riparazione o configurazione iniziale, preserva l'account nominato esistente se ne esiste uno o se `defaultAccount` punta già a uno. Solo le chiavi auth/bootstrap Matrix vengono spostate nell'account promosso; le chiavi condivise delle policy di consegna restano al livello superiore.

Vedi [Riferimento di configurazione](/it/gateway/config-channels#multi-account-all-channels) per il pattern multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu non
fornisca esplicitamente il consenso per account.

Se il tuo homeserver è in esecuzione su localhost, un IP LAN/Tailscale o un hostname interno, abilita
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

Questo consenso esplicito consente solo destinazioni private/interne attendibili. Gli homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Preferisci `https://` quando possibile.

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
OpenClaw usa la stessa impostazione proxy per il traffico Matrix in fase di esecuzione e per le verifiche dello stato dell'account.

## Risoluzione delle destinazioni

Matrix accetta queste forme di destinazione ovunque OpenClaw ti chieda una stanza o una destinazione utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Gli ID delle stanze Matrix distinguono tra maiuscole e minuscole. Usa l'esatta combinazione di maiuscole e minuscole dell'ID stanza da Matrix
quando configuri destinazioni di consegna esplicite, processi cron, associazioni o allowlist.
OpenClaw mantiene canoniche le chiavi di sessione interne per l'archiviazione, quindi quelle chiavi in minuscolo
non sono una fonte affidabile per gli ID di consegna Matrix.

La ricerca nella directory live usa l'account Matrix autenticato:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche delle stanze accettano direttamente ID stanza e alias espliciti, quindi ripiegano sulla ricerca dei nomi delle stanze a cui quell'account ha aderito.
- La ricerca dei nomi delle stanze a cui si è aderito è best-effort. Se un nome stanza non può essere risolto in un ID o in un alias, viene ignorato dalla risoluzione delle allowlist in fase di esecuzione.

## Riferimento della configurazione

I campi in stile allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi (opzione più sicura). Le corrispondenze esatte nella directory vengono risolte all'avvio e ogni volta che l'allowlist cambia mentre il monitor è in esecuzione; le voci che non possono essere risolte vengono ignorate in fase di esecuzione. Le allowlist delle stanze preferiscono ID stanza o alias per lo stesso motivo.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta di visualizzazione opzionale per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `accounts`: override denominati per account. I valori di primo livello `channels.matrix` vengono ereditati come predefiniti.
- `homeserver`: URL dell'homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account di connettersi a `localhost`, IP LAN/Tailscale o nomi host interni.
- `proxy`: URL proxy HTTP(S) opzionale per il traffico Matrix. Override per account supportato.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per autenticazione basata su token. Valori in testo normale e SecretRef supportati tra provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per accesso basato su password. Valori in testo normale e SecretRef supportati.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo usato al momento dell'accesso con password.
- `avatarUrl`: URL dell'avatar personale salvato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.

### Cifratura

- `encryption`: abilita E2EE. Predefinito: `false`.
- `startupVerification`: `"if-unverified"` (predefinito quando E2EE è attiva) oppure `"off"`. Richiede automaticamente l'auto-verifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: intervallo di attesa prima della successiva richiesta automatica all'avvio. Predefinito: `24`.

### Accesso e criteri

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Predefinito: `"allowlist"`.
- `groupAllowFrom`: lista consentiti di ID utente per il traffico delle stanze.
- `dm.enabled`: quando `false`, ignora tutti i DM. Predefinito: `true`.
- `dm.policy`: `"pairing"` (predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot si è unito alla stanza e l'ha classificata come DM; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: lista consentiti di ID utente per il traffico DM.
- `dm.sessionScope`: `"per-user"` (predefinito) o `"per-room"`.
- `dm.threadReplies`: override solo per DM per le risposte in thread (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando `true`, forza tutti i criteri DM attivi (eccetto `"disabled"`) e i criteri di gruppo `"open"` a `"allowlist"`. Non modifica i criteri `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi gli inviti in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: override per canale per instradamento e ciclo di vita delle sessioni vincolate ai thread.
- `streaming`: `"off"` (predefinito), `"partial"`, `"quiet"` o forma oggetto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, i blocchi completati dell'assistente vengono mantenuti come messaggi di avanzamento separati.
- `markdown`: configurazione opzionale di rendering Markdown per il testo in uscita.
- `responsePrefix`: stringa opzionale anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione dei blocchi in uscita in caratteri quando `chunkMode: "length"`. Predefinito: `4000`.
- `chunkMode`: `"length"` (predefinito, suddivide per numero di caratteri) o `"newline"` (suddivide ai limiti di riga).
- `historyLimit`: numero di messaggi recenti della stanza inclusi come `InboundHistory` quando un messaggio della stanza attiva l'agente. Ripiega su `messages.groupChat.historyLimit`; valore predefinito effettivo `0` (disabilitato).
- `mediaMaxMb`: limite massimo della dimensione dei media in MB per gli invii in uscita e l'elaborazione in ingresso.

### Impostazioni delle reazioni

- `ackReaction`: override della reazione di conferma per questo canale/account.
- `ackReactionScope`: override dell'ambito (`"group-mentions"` predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`"own"` predefinito, `"off"`).

### Strumenti e override per stanza

- `actions`: controllo degli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa dei criteri per stanza. L'identità della sessione usa l'ID stanza stabile dopo la risoluzione. (`rooms` è un alias legacy.)
  - `groups.<room>.account`: limita una voce stanza ereditata a un account specifico.
  - `groups.<room>.allowBots`: override per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.users`: lista consentiti dei mittenti per stanza.
  - `groups.<room>.tools`: override di consenso/negazione degli strumenti per stanza.
  - `groups.<room>.autoReply`: override per stanza del controllo basato su menzioni. `true` disabilita i requisiti di menzione per quella stanza; `false` li riattiva.
  - `groups.<room>.skills`: filtro Skills per stanza.
  - `groups.<room>.systemPrompt`: frammento di prompt di sistema per stanza.

### Impostazioni di approvazione exec

- `execApprovals.enabled`: consegna le approvazioni exec tramite prompt nativi di Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. Ripiega su `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: liste consentiti opzionali di agenti/sessioni per la consegna.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo basato su menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
