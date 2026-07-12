---
read_when:
    - Configurazione di Matrix in OpenClaw
    - Configurazione dell'E2EE e della verifica di Matrix
summary: Stato del supporto per Matrix, configurazione ed esempi di configurazione
title: Matrice
x-i18n:
    generated_at: "2026-07-12T06:48:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un plugin di canale scaricabile (`@openclaw/matrix`) basato sull’SDK ufficiale `matrix-js-sdk`. Supporta messaggi diretti, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione e crittografia end-to-end (E2EE).

## Installazione

```bash
openclaw plugins install @openclaw/matrix
```

Le specifiche del plugin senza prefisso provano prima ClawHub, quindi npm come ripiego. Per forzare una sorgente, usa `openclaw plugins install clawhub:@openclaw/matrix` o `npm:@openclaw/matrix`. Da un checkout locale: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registra e abilita il plugin; non è necessario un passaggio `enable` separato. Il canale non esegue comunque alcuna operazione finché non viene configurato come indicato di seguito. Consulta [Plugin](/it/tools/plugin) per le regole generali di installazione.

## Configurazione

1. Crea un account Matrix sul tuo homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken` oppure `homeserver` + `userId` + `password`.
3. Riavvia il Gateway.
4. Avvia un messaggio diretto con il bot oppure invitalo in una stanza. I nuovi inviti vengono accettati solo quando [`autoJoin`](#auto-join) lo consente.

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata richiede l’URL dell’homeserver, il metodo di autenticazione (token o password), l’ID utente (solo per l’autenticazione con password), un nome facoltativo per il dispositivo, se abilitare E2EE e le impostazioni di accesso alle stanze e partecipazione automatica. Se esistono già variabili d’ambiente `MATRIX_*` corrispondenti e l’account non dispone di dati di autenticazione salvati, la procedura guidata propone una scorciatoia basata sulle variabili d’ambiente. Risolvi i nomi delle stanze prima di salvare un elenco consentiti con `openclaw channels resolve --channel matrix "Project Room"`. L’abilitazione di E2EE nella procedura guidata esegue la stessa inizializzazione di [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Il valore predefinito di `channels.matrix.autoJoin` è `"off"`: il bot non comparirà in nuove stanze o messaggi diretti provenienti da nuovi inviti finché non parteciperai manualmente. Al momento dell’invito, OpenClaw non può stabilire se si tratti di un messaggio diretto o di un gruppo, quindi ogni invito passa prima attraverso `autoJoin`; `dm.policy` viene applicato solo in seguito, dopo che il bot ha partecipato e la stanza è stata classificata.

<Warning>
Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare gli inviti accettati oppure `autoJoin: "always"` per accettare ogni invito.

`autoJoinAllowlist` accetta solo `!roomId:server`, `#alias:server` o `*`. I nomi semplici delle stanze vengono rifiutati; gli alias vengono risolti rispetto all’homeserver, non rispetto allo stato dichiarato dalla stanza che ha inviato l’invito.
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

### Formati delle destinazioni degli elenchi consentiti

- Messaggi diretti (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. I nomi visualizzati vengono ignorati per impostazione predefinita perché modificabili; imposta `dangerouslyAllowNameMatching: true` solo per una compatibilità esplicita basata sui nomi visualizzati.
- Chiavi dell’elenco consentiti delle stanze (`groups`, alias precedente `rooms`): usa `!room:server` o `#alias:server`. I nomi semplici vengono ignorati, a meno che `dangerouslyAllowNameMatching: true`.
- Elenchi consentiti degli inviti (`autoJoinAllowlist`): usa `!room:server`, `#alias:server` o `*`. I nomi semplici vengono sempre rifiutati.

### Normalizzazione dell’ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato (`Ops Bot` -> `ops-bot`). Nei nomi delle variabili d’ambiente con ambito, la punteggiatura viene codificata in esadecimale per evitare collisioni tra account: `-` (0x2D) diventa `_X2D_`, quindi `ops-prod` corrisponde al prefisso d’ambiente `MATRIX_OPS_X2D_PROD_`.

### Credenziali memorizzate nella cache

Matrix memorizza le credenziali nella cache in `~/.openclaw/credentials/matrix/`: `credentials.json` per l’account predefinito e `credentials-<account>.json` per gli account denominati. Quando esistono credenziali nella cache, OpenClaw considera Matrix configurato anche senza un `accessToken` nel file di configurazione; ciò vale per la configurazione, `openclaw doctor` e i controlli dello stato del canale.

### Variabili d’ambiente

Variabili d’ambiente associate alle chiavi di configurazione, utilizzate quando la chiave di configurazione equivalente non è impostata. L’account predefinito usa nomi senza prefisso; gli account denominati inseriscono il token dell’account prima del suffisso (consulta la [normalizzazione](#account-id-normalization)).

| Account predefinito    | Account denominato (`<ID>` = token dell’account) |
| ---------------------- | ------------------------------------------------ |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                         |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                       |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                            |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                           |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                          |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                        |

Per l’account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. `MATRIX_HOMESERVER` e qualsiasi variante con ambito `*_HOMESERVER` non possono essere impostati da un file `.env` dell’area di lavoro; consulta [File `.env` dell’area di lavoro](/it/gateway/security).

<Note>
La chiave di recupero non è una variabile d’ambiente associata alla configurazione: OpenClaw non la legge mai direttamente dall’ambiente. Il testo guida della CLI suggerisce di passarla tramite pipe usando una variabile di shell denominata `MATRIX_RECOVERY_KEY` per l’account predefinito oppure `MATRIX_RECOVERY_KEY_<ID>` per un account denominato, con l’ID account convertito semplicemente in maiuscolo e senza codifica esadecimale; consulta [Verificare questo dispositivo con una chiave di recupero](#verify-this-device-with-a-recovery-key).
</Note>

## Esempio di configurazione

Una configurazione di base pratica con associazione dei messaggi diretti, elenco consentiti delle stanze ed E2EE:

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

Lo streaming delle risposte Matrix è facoltativo. `streaming` controlla il modo in cui OpenClaw invia la risposta dell’assistente mentre è in elaborazione; `blockStreaming` controlla se ogni blocco completato viene conservato come messaggio Matrix separato.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Per mantenere le anteprime in tempo reale delle risposte ma nascondere le righe provvisorie relative agli strumenti e all’avanzamento, usa la forma a oggetto:

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

La forma completa a oggetto accetta `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: etichetta personalizzata, `"auto"` o valore non impostato per scegliere un’etichetta configurata o integrata, oppure `false` per nasconderla.
- `progress.labels`: opzioni utilizzate solo quando `label` è `"auto"` o non è impostato.
- `progress.maxLines`: numero massimo di righe di avanzamento scorrevoli conservate nella bozza; le righe più vecchie che superano questo limite vengono rimosse.
- `progress.maxLineChars`: numero massimo di caratteri per ogni riga di avanzamento compatta prima del troncamento.
- `progress.toolProgress`: quando è `true` (impostazione predefinita), l’attività in tempo reale degli strumenti e dell’avanzamento compare nella bozza.

| `streaming`            | Comportamento                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predefinito)  | Attende la risposta completa e la invia una sola volta. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                                            |
| `"partial"`            | Modifica sul posto un normale messaggio di testo mentre il modello scrive il blocco corrente. I client standard potrebbero inviare una notifica alla prima anteprima, non alla modifica finale.                 |
| `"quiet"`              | Come `"partial"`, ma il messaggio è un avviso che non genera notifiche. I destinatari ricevono una notifica quando una regola push per utente corrisponde alla modifica finalizzata (consulta quanto segue).     |
| `"progress"`           | Invia singole righe di avanzamento compatte usando una bozza di avanzamento.                                                                                                                                    |

`blockStreaming` (valore predefinito `false`) è indipendente da `streaming`:

| `streaming`             | `blockStreaming: true`                                                          | `blockStreaming: false` (predefinito)                         |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `"partial"` / `"quiet"` | Bozza in tempo reale per il blocco corrente, blocchi completati conservati come messaggi | Bozza in tempo reale per il blocco corrente, finalizzata sul posto |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco completato                      | Un messaggio Matrix con notifica per la risposta completa     |

Note:

- Se un’anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell’anteprima e passa all’invio della sola risposta finale.
- Le risposte multimediali inviano sempre gli allegati normalmente; se un’anteprima obsoleta non può essere riutilizzata in sicurezza, OpenClaw la oscura prima di inviare la risposta multimediale finale.
- Gli aggiornamenti dell’anteprima sull’avanzamento degli strumenti sono abilitati per impostazione predefinita quando lo streaming dell’anteprima è attivo. Imposta `streaming.preview.toolProgress: false` per mantenere le modifiche dell’anteprima per il testo della risposta, lasciando però l’avanzamento degli strumenti nel normale percorso di invio.
- Le modifiche delle anteprime comportano chiamate aggiuntive all’API Matrix. Mantieni `streaming: "off"` per il profilo più prudente rispetto ai limiti di frequenza.

## Messaggi vocali

Le note vocali Matrix in entrata vengono trascritte prima del controllo delle menzioni della stanza; pertanto, una nota vocale che pronuncia il nome del bot può attivare l’agente in una stanza con `requireMention: true`, e l’agente riceve la trascrizione anziché soltanto un segnaposto per l’allegato audio.

Matrix usa il provider multimediale audio condiviso in `tools.media.audio`, ad esempio OpenAI `gpt-4o-mini-transcribe`. Consulta [Panoramica degli strumenti multimediali](/it/tools/media-overview) per la configurazione e i limiti del provider.

- Sono idonei gli eventi `m.audio` e gli eventi `m.file` con un tipo MIME `audio/*`.
- Nelle stanze crittografate, OpenClaw decrittografa l’allegato tramite il percorso multimediale Matrix esistente prima della trascrizione.
- La trascrizione viene contrassegnata come generata automaticamente e non attendibile nel prompt dell’agente.
- L’allegato viene contrassegnato come già trascritto, in modo che gli strumenti multimediali a valle non lo trascrivano nuovamente.
- Imposta `tools.media.audio.enabled: false` per disabilitare globalmente la trascrizione audio.

## Metadati di approvazione

Le richieste di approvazione native di Matrix sono normali eventi `m.room.message` con contenuti specifici di OpenClaw nella chiave `com.openclaw.approval`. I client standard continuano a visualizzare il corpo testuale; i client compatibili con OpenClaw possono leggere l’ID strutturato dell’approvazione, il tipo, lo stato, le decisioni e i dettagli di esecuzione o del plugin.

Quando una richiesta è troppo lunga per un singolo evento Matrix, OpenClaw suddivide il testo visibile in parti e associa `com.openclaw.approval` soltanto alla prima parte. Le reazioni di autorizzazione o rifiuto vengono associate a tale primo evento, così le richieste lunghe mantengono la stessa destinazione di approvazione delle richieste costituite da un singolo evento.

### Regole push self-hosted per anteprime finalizzate silenziose

`streaming: "quiet"` invia una notifica ai destinatari solo dopo la finalizzazione di un blocco o di un turno: una regola push per utente deve corrispondere all'indicatore dell'anteprima finalizzata. Consulta [Regole push di Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la procedura completa.

## Stanze tra bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix di OpenClaw configurati vengono ignorati. Usa `allowBots` per consentire intenzionalmente il traffico tra agenti:

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

- `allowBots: true` accetta i messaggi provenienti da altri account bot Matrix configurati nelle stanze consentite e nei messaggi diretti.
- `allowBots: "mentions"` accetta tali messaggi nelle stanze solo quando menzionano visibilmente questo bot; i messaggi diretti sono comunque consentiti.
- `groups.<room>.allowBots` sostituisce l'impostazione a livello di account per una singola stanza.
- I messaggi accettati provenienti da bot configurati usano la [protezione condivisa dai loop dei bot](/it/channels/bot-loop-protection). Configura `channels.defaults.botLoopProtection`, quindi applica una sostituzione per account con `channels.matrix.botLoopProtection` o per stanza con `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di autorisposta.
- Matrix non dispone di un indicatore nativo per i bot; OpenClaw considera «scritto da un bot» un messaggio «inviato da un altro account Matrix configurato su questo Gateway OpenClaw».

Quando abiliti il traffico tra bot nelle stanze condivise, usa elenchi di autorizzazione delle stanze rigorosi e requisiti di menzione.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file`, in modo che le anteprime delle immagini vengano crittografate insieme all'allegato completo; le stanze non crittografate usano il semplice `thumbnail_url`. Non è necessaria alcuna configurazione: il Plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile da una macchina) e `--account <id>` (configurazioni con più account). Per impostazione predefinita, l'output è conciso.

### Abilitare la crittografia

```bash
openclaw matrix encryption setup
```

Inizializza l'archivio dei segreti e la firma incrociata, crea se necessario un backup delle chiavi delle stanze, quindi mostra lo stato e i passaggi successivi. Flag utili:

- `--recovery-key <key>` applica una chiave di recupero prima dell'inizializzazione (preferisci la modalità tramite input standard riportata di seguito)
- `--force-reset-cross-signing` elimina l'identità di firma incrociata corrente e ne crea una nuova (solo per uso intenzionale)

Per un nuovo account, abilita E2EE al momento della creazione:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` è un alias di `--enable-e2ee`. Configurazione manuale equivalente:

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

`verify status` segnala tre indicatori di attendibilità indipendenti (`--verbose` li mostra tutti):

- `Attendibile localmente`: considerato attendibile solo da questo client
- `Verificato tramite firma incrociata`: l'SDK segnala la verifica tramite firma incrociata
- `Firmato dal proprietario`: firmato dalla tua chiave di firma personale (solo a scopo diagnostico)

`Verificato dal proprietario` è `sì` solo quando `Verificato tramite firma incrociata` è `sì`; la sola attendibilità locale o la sola firma del proprietario non sono sufficienti.

`--allow-degraded-local-state` restituisce una diagnostica basata sul massimo sforzo senza preparare prima l'account Matrix; è utile per verifiche offline o su configurazioni parziali.

### Verificare questo dispositivo con una chiave di recupero

Passa la chiave di recupero tramite input standard invece di inserirla nella riga di comando:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando segnala tre stati:

- `Chiave di recupero accettata`: Matrix ha accettato la chiave per l'archivio dei segreti o l'attendibilità del dispositivo.
- `Backup utilizzabile`: il backup delle chiavi delle stanze può essere caricato con il materiale di recupero attendibile.
- `Dispositivo verificato dal proprietario`: questo dispositivo dispone della piena attendibilità dell'identità di firma incrociata Matrix.

Il comando termina con un codice diverso da zero quando l'attendibilità completa dell'identità non è stata stabilita, anche se la chiave di recupero ha sbloccato il materiale di backup. In tal caso, completa l'autoverifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Verificato tramite firma incrociata: sì` prima di terminare correttamente. Usa `--timeout-ms <ms>` per regolare l'attesa.

Funziona anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave viene salvata nella cronologia della shell.

### Inizializzare o riparare la firma incrociata

```bash
openclaw matrix verify bootstrap
```

È il comando di riparazione/configurazione per gli account crittografati. Nell'ordine:

- inizializza l'archivio dei segreti, riutilizzando quando possibile una chiave di recupero esistente
- inizializza la firma incrociata e carica le chiavi pubbliche mancanti
- contrassegna e firma in modo incrociato il dispositivo corrente
- crea un backup lato server delle chiavi delle stanze, se non ne esiste già uno

Se l'homeserver richiede UIA per caricare le chiavi di firma incrociata, OpenClaw prova prima senza autenticazione, quindi `m.login.dummy` e infine `m.login.password` (richiede `channels.matrix.password`).

Flag utili:

- `--recovery-key-stdin` (da abbinare a `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) oppure `--recovery-key <key>`
- `--force-reset-cross-signing` per eliminare l'identità di firma incrociata corrente (solo intenzionalmente; richiede che la chiave di recupero attiva sia memorizzata o fornita tramite `--recovery-key-stdin`)

### Backup delle chiavi delle stanze

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` indica se esiste un backup lato server e se questo dispositivo è in grado di decrittografarlo. `backup restore` importa le chiavi delle stanze salvate nel backup nell'archivio crittografico locale; ometti `--recovery-key-stdin` se la chiave di recupero è già presente sul disco.

Per sostituire un backup danneggiato con una nuova base di riferimento (accettando la perdita della cronologia precedente non recuperabile; può anche ricreare l'archivio dei segreti se il segreto del backup corrente non è caricabile):

```bash
openclaw matrix verify backup reset --yes
```

Aggiungi `--rotate-recovery-key` solo quando vuoi impedire intenzionalmente alla precedente chiave di recupero di sbloccare la nuova base di riferimento del backup.

### Elencare, richiedere e rispondere alle verifiche

```bash
openclaw matrix verify list
```

Elenca le richieste di verifica in sospeso per l'account selezionato.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Invia una richiesta di verifica da questo account. `--own-user` richiede l'autoverifica (accetta la richiesta in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` indicano un'altra persona come destinatario. `--own-user` non può essere combinato con gli altri flag di destinazione.

Per la gestione del ciclo di vita a un livello inferiore, in genere durante il monitoraggio parallelo delle richieste in ingresso da un altro client, questi comandi agiscono su una richiesta specifica `<id>` (mostrata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accettare una richiesta in ingresso                                         |
| `openclaw matrix verify start <id>`        | Avviare il flusso SAS                                                       |
| `openclaw matrix verify sas <id>`          | Mostrare le emoji o i numeri decimali SAS                                   |
| `openclaw matrix verify confirm-sas <id>`  | Confermare che SAS corrisponda a quanto mostrato dall'altro client          |
| `openclaw matrix verify mismatch-sas <id>` | Rifiutare SAS quando le emoji o i numeri decimali non corrispondono         |
| `openclaw matrix verify cancel <id>`       | Annullare; accetta facoltativamente `--reason <text>` e `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come indicazioni per il seguito tramite messaggio diretto quando la verifica è associata a una specifica stanza di messaggi diretti.

### Note sugli account multipli

Senza `--account <id>`, i comandi CLI di Matrix usano l'account predefinito implicito. In presenza di più account denominati e in assenza di `channels.matrix.defaultAccount`, i comandi non tentano di indovinare e chiedono di effettuare una scelta. Quando E2EE è disabilitata o non disponibile per un account denominato, gli errori indicano la chiave di configurazione di tale account, ad esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, il valore predefinito di `startupVerification` è `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, evitando i duplicati e applicando un intervallo di attesa (24 ore per impostazione predefinita). Regolalo con `startupVerificationCooldownHours` oppure disabilitalo con `startupVerification: "off"`.

    All'avvio viene inoltre eseguito un processo conservativo di inizializzazione crittografica, che riutilizza l'archivio dei segreti e l'identità di firma incrociata correnti. Se lo stato di inizializzazione è danneggiato, OpenClaw tenta una riparazione controllata anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, all'avvio viene registrato un avviso senza causare un errore fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Consulta [Migrazione di Matrix](/it/channels/matrix-migration) per il flusso di aggiornamento completo.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica gli avvisi sul ciclo di vita della verifica nella stanza rigorosamente dedicata alla verifica tramite messaggio diretto come messaggi `m.notice`: richiesta, disponibilità (con indicazioni «Verifica tramite emoji»), avvio/completamento e dettagli SAS (emoji/numeri decimali), quando disponibili.

    Le richieste in ingresso da un altro client Matrix vengono monitorate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma la propria parte non appena è disponibile la verifica tramite emoji; devi comunque confrontare e confermare «Corrispondono» nel tuo client Matrix.

    Gli avvisi di sistema relativi alla verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Dispositivo Matrix eliminato o non valido">
    Se `verify status` indica che il dispositivo corrente non è più elencato nell'homeserver, crea un nuovo dispositivo Matrix di OpenClaw. Per l'accesso tramite password:

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

    Sostituisci `assistant` con l'ID account del comando non riuscito oppure ometti `--account` per l'account predefinito.

  </Accordion>

  <Accordion title="Manutenzione dei dispositivi">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elencali ed elimina quelli obsoleti:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Archivio crittografico">
    Matrix E2EE usa il percorso crittografico Rust ufficiale di `matrix-js-sdk`, con `fake-indexeddb` come livello di compatibilità IndexedDB. Lo stato crittografico viene salvato in `crypto-idb-snapshot.json` con autorizzazioni restrittive per il file.

    Lo stato di runtime crittografato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include l'archivio di sincronizzazione, l'archivio crittografico, la chiave di recupero, l'istantanea IDB, le associazioni dei thread e lo stato della verifica all'avvio. Quando il token cambia ma l'identità dell'account rimane invariata, OpenClaw riutilizza la migliore radice esistente, così lo stato precedente resta visibile.

    Una singola radice precedente basata sull'hash del token può costituire un normale percorso di continuità per la rotazione dei token. Se OpenClaw registra `matrix: multiple populated token-hash storage roots detected`, ispeziona la directory dell'account e archivia le radici correlate obsolete solo dopo aver verificato che la radice attiva selezionata sia integra. È preferibile spostare le radici obsolete in una directory `_archive/` anziché eliminarle immediatamente.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Passa entrambe le opzioni in un'unica chiamata. Matrix accetta direttamente gli URL avatar `mxc://`; se si passa un URL `http://`/`https://`, prima carica il file e poi memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nella sostituzione specifica dell'account).

## Thread

Matrix supporta i thread nativi sia per le risposte automatiche sia per gli invii tramite lo strumento per i messaggi. Due impostazioni indipendenti ne controllano il comportamento:

### Instradamento delle sessioni (`sessionScope`)

`dm.sessionScope` determina come le stanze dei messaggi diretti di Matrix vengono associate alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze dei messaggi diretti con lo stesso interlocutore instradato condividono una sessione.
- `"per-room"`: ogni stanza dei messaggi diretti di Matrix riceve una propria chiave di sessione, anche per lo stesso interlocutore.

I collegamenti espliciti delle conversazioni hanno sempre la precedenza su `sessionScope`; le stanze e i thread collegati mantengono la sessione di destinazione scelta.

### Risposte nei thread (`threadReplies`)

`threadReplies` determina dove il bot pubblica la risposta:

- `"off"`: le risposte sono di primo livello. I messaggi in ingresso appartenenti a un thread rimangono nella sessione principale.
- `"inbound"`: risponde all'interno di un thread solo quando il messaggio in ingresso apparteneva già a quel thread.
- `"always"`: risponde all'interno di un thread radicato nel messaggio che ha attivato la risposta; da quel primo evento in poi, la conversazione viene instradata tramite una sessione corrispondente con ambito limitato al thread.

`dm.threadReplies` sostituisce questa impostazione solo per i messaggi diretti; ad esempio, consente di mantenere isolati i thread delle stanze lasciando i messaggi diretti senza thread.

### Ereditarietà dei thread e comandi slash

- I messaggi in ingresso appartenenti a un thread includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii tramite lo strumento per i messaggi ereditano automaticamente il thread Matrix corrente quando sono destinati alla stessa stanza (o allo stesso utente di messaggi diretti), a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo della destinazione utente dei messaggi diretti si attiva solo quando i metadati della sessione corrente confermano lo stesso interlocutore dei messaggi diretti sullo stesso account Matrix; altrimenti OpenClaw torna al normale instradamento con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` collegato a un thread funzionano tutti nelle stanze e nei messaggi diretti di Matrix.
- Il comando `/focus` di primo livello crea un nuovo thread Matrix e lo collega alla sessione di destinazione quando `threadBindings.spawnSessions` è abilitato.
- L'esecuzione di `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente collega il thread corrente senza spostarlo.

Quando OpenClaw rileva che una stanza dei messaggi diretti di Matrix è in conflitto con un'altra stanza dei messaggi diretti nella stessa sessione condivisa, pubblica una sola volta un messaggio `m.notice` che indica `/focus` come via d'uscita e suggerisce di modificare `dm.sessionScope`. L'avviso appare solo quando i collegamenti dei thread sono abilitati.

## Collegamenti delle conversazioni ACP

Le stanze, i messaggi diretti e i thread Matrix esistenti possono diventare spazi di lavoro ACP persistenti senza modificare l'interfaccia della chat.

Procedura rapida per l'operatore:

- Esegui `/acp spawn codex --bind here` all'interno del messaggio diretto, della stanza o del thread Matrix esistente che vuoi continuare a utilizzare.
- In un messaggio diretto o in una stanza di primo livello, il messaggio diretto o la stanza corrente rimane l'interfaccia della chat e i messaggi futuri vengono instradati alla sessione ACP avviata.
- All'interno di un thread esistente, `--bind here` collega il thread corrente senza spostarlo.
- `/new` e `/reset` reimpostano la stessa sessione ACP collegata senza sostituirla.
- `/acp close` chiude la sessione ACP e rimuove il collegamento.

`--bind here` non crea un thread Matrix figlio. `threadBindings.spawnSessions` controlla `/acp spawn --thread auto|here`, nei casi in cui OpenClaw deve creare o collegare un thread figlio.

### Configurazione dei collegamenti dei thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta sostituzioni specifiche per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: controlla sia l'avvio dei thread dei sottoagenti sia quello dei thread ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: sostituzioni più specifiche rispettivamente per gli avvii riservati ai sottoagenti o ad ACP.
- `threadBindings.defaultSpawnContext`

Per impostazione predefinita, l'avvio di sessioni collegate ai thread Matrix è abilitato. Imposta `threadBindings.spawnSessions: false` per impedire a `/focus` e `/acp spawn --thread auto|here` di primo livello di creare o collegare thread Matrix. Imposta `threadBindings.defaultSpawnContext: "isolated"` quando gli avvii di thread nativi dei sottoagenti non devono creare una diramazione della trascrizione principale.

## Reazioni

Matrix supporta le reazioni in uscita, le notifiche delle reazioni in ingresso e le reazioni di conferma.

Gli strumenti per le reazioni in uscita sono controllati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix.
- `emoji=""` rimuove le reazioni del bot su tale evento.
- `remove: true` rimuove dal bot solo la reazione con l'emoji specificata.

**Ordine di risoluzione** (ha la precedenza il primo valore definito):

| Impostazione            | Ordine                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | per account -> canale -> `messages.ackReaction` -> emoji di riserva dell'identità dell'agente |
| `ackReactionScope`      | per account -> canale -> `messages.ackReactionScope` -> valore predefinito `"group-mentions"` |
| `reactionNotifications` | per account -> canale -> valore predefinito `"own"`                                 |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando hanno come destinazione messaggi Matrix scritti dal bot; `"off"` disabilita gli eventi di sistema relativi alle reazioni. Le rimozioni delle reazioni non vengono convertite in eventi di sistema: Matrix le presenta come oscuramenti, non come rimozioni autonome di `m.reaction`.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio della stanza attiva l'agente. Se non è impostato, usa `messages.groupChat.historyLimit`; il valore predefinito effettivo è `0` se entrambi non sono impostati (funzionalità disabilitata).
- La cronologia delle stanze Matrix è limitata alla stanza; i messaggi diretti continuano a utilizzare la normale cronologia della sessione.
- La cronologia della stanza include solo i messaggi in sospeso: OpenClaw memorizza temporaneamente i messaggi della stanza che non hanno ancora attivato una risposta, quindi acquisisce un'istantanea di quella finestra quando arriva una menzione o un altro evento di attivazione.
- Il messaggio di attivazione corrente non è incluso in `InboundHistory`; per quel turno rimane nel corpo principale del messaggio in ingresso.
- I nuovi tentativi relativi allo stesso evento Matrix riutilizzano l'istantanea originale della cronologia anziché avanzare fino ai messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come il testo recuperato delle risposte, le radici dei thread e la cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare limitandolo ai mittenti consentiti dai controlli attivi dell'elenco di elementi consentiti per la stanza o l'utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma conserva comunque una risposta esplicitamente citata.

Questo influisce solo sulla visibilità del contesto supplementare, non sulla possibilità che il messaggio in ingresso attivi una risposta. L'autorizzazione all'attivazione continua a dipendere da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri per i messaggi diretti.

## Criteri per messaggi diretti e stanze

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

Per disattivare completamente i messaggi diretti mantenendo operative le stanze, imposta `dm.enabled: false`:

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

Consulta [Gruppi](/it/channels/groups) per il comportamento dell'attivazione tramite menzione e degli elenchi di elementi consentiti.

Esempio di associazione per i messaggi diretti di Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviare messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di associazione in sospeso e, dopo un breve intervallo di attesa, può inviare una risposta di promemoria anziché generare un nuovo codice.

Consulta [Associazione](/it/channels/pairing) per la procedura condivisa di associazione dei messaggi diretti e la struttura di archiviazione.

## Riparazione delle stanze dirette

Se lo stato dei messaggi diretti perde coerenza, OpenClaw può ritrovarsi con associazioni `m.direct` obsolete che puntano a vecchie stanze individuali anziché al messaggio diretto attivo. Esamina l'associazione corrente per un interlocutore:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparala:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per le configurazioni con più account. La procedura di riparazione:

- preferisce un messaggio diretto strettamente individuale già associato in `m.direct`
- se non disponibile, usa qualsiasi messaggio diretto strettamente individuale con quell'utente a cui si è attualmente uniti
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun messaggio diretto integro

Non elimina automaticamente le vecchie stanze. Seleziona il messaggio diretto integro e aggiorna l'associazione affinché i futuri invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti abbiano come destinazione la stanza corretta.

## Approvazioni dell'esecuzione

Matrix può fungere da client nativo per le approvazioni. Configuralo in `channels.matrix.execApprovals` (oppure in `channels.matrix.accounts.<account>.execApprovals` per una sostituzione specifica dell'account):

- `enabled`: invia le approvazioni tramite richieste native di Matrix. Se non è impostato o è `"auto"`, si abilita automaticamente non appena è possibile individuare almeno un responsabile dell'approvazione; imposta `false` per disabilitarlo esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare le richieste di esecuzione. Se non è impostato, usa `channels.matrix.dm.allowFrom`.
- `target`: destinazione delle richieste. `"dm"` (predefinito) le invia ai messaggi diretti dei responsabili dell'approvazione; `"channel"` le invia alla stanza o al messaggio diretto di origine; `"both"` le invia a entrambi.
- `agentFilter` / `sessionFilter`: elenchi facoltativi di elementi consentiti che determinano quali agenti o sessioni attivano l'invio tramite Matrix.

L'autorizzazione varia leggermente tra i tipi di approvazione:

- Le **approvazioni dell'esecuzione** usano `execApprovals.approvers` e, se non è impostato, `dm.allowFrom`.
- Le **approvazioni dei Plugin** autorizzano esclusivamente tramite `dm.allowFrom`.

Entrambi i tipi condividono le scorciatoie tramite reazione e gli aggiornamenti dei messaggi di Matrix. I responsabili dell'approvazione visualizzano le scorciatoie tramite reazione nel messaggio di approvazione principale:

- ✅ consenti una volta
- ❌ nega
- ♾️ consenti sempre (quando il criterio di esecuzione effettivo lo permette)

Comandi slash di riserva: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo i responsabili dell'approvazione individuati possono approvare o negare. L'invio nel canale delle approvazioni dell'esecuzione include il testo del comando: abilita `channel` o `both` solo nelle stanze attendibili.

Argomento correlato: [Approvazioni dell'esecuzione](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` e così via) funzionano direttamente nei messaggi diretti. Nelle stanze, OpenClaw riconosce anche i comandi preceduti dalla menzione Matrix del bot stesso; pertanto, `@bot:server /new` attiva il percorso del comando senza un'espressione regolare personalizzata per le menzioni. In questo modo, il bot continua a rispondere ai messaggi nel formato tipico delle stanze `@mention /command`, generati da Element e client simili quando un utente usa il completamento tramite tabulazione sul bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono rispettare gli stessi elenchi di elementi consentiti o criteri del proprietario previsti per i normali messaggi diretti o delle stanze.

## Più account

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

- I valori di primo livello di `channels.matrix` fungono da predefiniti per gli account denominati, a meno che un account non li sovrascriva.
- Limita una voce di stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra gli account; `account: "default"` continua a funzionare quando l'account predefinito è configurato al primo livello.

**Selezione dell'account predefinito:**

- Imposta `defaultAccount` per scegliere l'account denominato preferito dall'instradamento implicito, dai controlli e dai comandi CLI.
- Se disponi di più account e uno si chiama letteralmente `default`, OpenClaw lo usa implicitamente anche quando `defaultAccount` non è impostato.
- Con più account denominati e nessun account predefinito selezionato, i comandi CLI si rifiutano di fare supposizioni: imposta `defaultAccount` oppure passa `--account <id>`.
- Il blocco di primo livello `channels.matrix.*` viene considerato l'account implicito `default` solo quando i relativi dati di autenticazione sono completi (`homeserver` + `accessToken` oppure `homeserver` + `userId` + `password`). Gli account denominati restano individuabili tramite `homeserver` + `userId` quando le credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw converte una configurazione con un solo account in una configurazione multi-account durante la riparazione o la configurazione, conserva l'account denominato esistente, se presente, oppure quello già indicato da `defaultAccount`. Solo le chiavi di autenticazione/avvio iniziale di Matrix vengono spostate nell'account promosso; le chiavi condivise dei criteri di consegna restano al primo livello.

Consulta il [riferimento della configurazione](/it/gateway/config-channels#multi-account-all-channels) per il modello multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per proteggere dagli attacchi SSRF, a meno che tu non li abiliti esplicitamente per ciascun account.

Se il tuo homeserver viene eseguito su localhost, su un IP LAN/Tailscale o su un nome host interno, abilita `network.dangerouslyAllowPrivateNetwork` per quell'account:

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

Esempio di configurazione tramite CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Questa abilitazione esplicita consente solo destinazioni private/interne attendibili. Gli homeserver pubblici non cifrati, come `http://matrix.example.org:8008`, restano bloccati. Preferisci `https://` quando possibile.

## Traffico Matrix tramite proxy

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

Gli account denominati possono sovrascrivere il valore predefinito di primo livello con `channels.matrix.accounts.<id>.proxy`. OpenClaw usa la stessa impostazione del proxy per il traffico Matrix in fase di esecuzione e per i controlli dello stato degli account.

## Risoluzione delle destinazioni

Matrix accetta queste forme di destinazione ovunque OpenClaw richieda una stanza o un utente di destinazione:

- Utenti: `@user:server`, `user:@user:server` oppure `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` oppure `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` oppure `matrix:channel:#alias:server`

Gli ID delle stanze Matrix distinguono tra maiuscole e minuscole. Usa esattamente le maiuscole e minuscole dell'ID stanza riportato da Matrix quando configuri destinazioni di recapito esplicite, processi cron, associazioni o liste consentite. OpenClaw mantiene canoniche le chiavi interne delle sessioni per l'archiviazione, pertanto tali chiavi in minuscolo non costituiscono una fonte affidabile per gli ID di recapito Matrix.

La ricerca in tempo reale nella directory usa l'account Matrix connesso:

- Le ricerche degli utenti interrogano la directory utenti Matrix su tale homeserver.
- Le ricerche delle stanze accettano direttamente ID stanza e alias espliciti. La ricerca per nome tra le stanze a cui si è effettuato l'accesso è basata sul principio del massimo sforzo e si applica solo alle liste consentite delle stanze in fase di esecuzione quando è impostato `dangerouslyAllowNameMatching: true`.
- Se il nome di una stanza non può essere risolto in un ID o alias, viene ignorato durante la risoluzione della lista consentita in fase di esecuzione.

## Riferimento di configurazione

I campi utente di tipo lista consentita (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi (opzione più sicura). Le voci che non sono ID vengono ignorate per impostazione predefinita. Se è impostato `dangerouslyAllowNameMatching: true`, le corrispondenze esatte con i nomi visualizzati nella directory Matrix vengono risolte all'avvio e ogni volta che la lista consentita cambia mentre il monitor è in esecuzione; le voci non risolvibili vengono ignorate in fase di esecuzione.

Le chiavi della lista consentita delle stanze (`groups`, il precedente `rooms`) devono essere ID stanza o alias. Le chiavi costituite da semplici nomi di stanze vengono ignorate per impostazione predefinita; `dangerouslyAllowNameMatching: true` ripristina la ricerca basata sul principio del massimo sforzo tra i nomi delle stanze a cui si è effettuato l'accesso.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta visualizzata facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `accounts`: sostituzioni denominate per ciascun account. I valori di primo livello di `channels.matrix` vengono ereditati come valori predefiniti.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account di connettersi a `localhost`, a IP LAN/Tailscale o a nomi host interni.
- `proxy`: URL proxy HTTP(S) facoltativo per il traffico Matrix. Supporta la sostituzione per singolo account.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per l'autenticazione basata su token. Sono supportati valori in testo normale e SecretRef tramite provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per l'accesso basato su password. Sono supportati valori in testo normale e SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo usato al momento dell'accesso con password.
- `avatarUrl`: URL dell'avatar personale archiviato per la sincronizzazione del profilo e gli aggiornamenti con `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.

### Crittografia

- `encryption`: abilita E2EE. Valore predefinito: `false`.
- `startupVerification`: `"if-unverified"` (valore predefinito quando E2EE è attivo) oppure `"off"`. Richiede automaticamente l'autoverifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: intervallo di attesa prima della successiva richiesta automatica all'avvio. Valore predefinito: `24`.

### Accesso e criteri

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valore predefinito: `"allowlist"`.
- `groupAllowFrom`: lista consentita di ID utente per il traffico delle stanze.
- `mentionPatterns`: espressioni regolari con ambito per le menzioni nelle stanze. Oggetto con `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Controlla se i valori `agents.list[].groupChat.mentionPatterns` configurati si applicano a ciascuna stanza.
- `dm.enabled`: quando è `false`, ignora tutti i messaggi diretti. Valore predefinito: `true`.
- `dm.policy`: `"pairing"` (valore predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot ha effettuato l'accesso e classificato la stanza come messaggio diretto; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: lista consentita di ID utente per il traffico dei messaggi diretti.
- `dm.sessionScope`: `"per-user"` (valore predefinito) o `"per-room"`.
- `dm.threadReplies`: sostituzione solo per i messaggi diretti relativa alle risposte in thread (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando è `true`, forza tutti i criteri attivi per i messaggi diretti (tranne `"disabled"`) e i criteri di gruppo `"open"` a `"allowlist"`. Non modifica i criteri `"disabled"`.
- `dangerouslyAllowNameMatching`: quando è `true`, consente la ricerca nella directory Matrix per nome visualizzato per le voci della lista consentita degli utenti e la ricerca per nome tra le stanze a cui si è effettuato l'accesso per le chiavi della lista consentita delle stanze. Preferisci ID completi `@user:server` e ID stanza o alias.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Valore predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi quelli assimilabili a messaggi diretti.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza che ha inviato l'invito.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` come valore predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"` (valore predefinito), `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"` (il valore predefinito di primo livello viene risolto in `"inbound"` se non è impostato esplicitamente), `"inbound"` o `"always"`.
- `threadBindings`: sostituzioni per canale per l'instradamento e il ciclo di vita delle sessioni associate ai thread.
- `streaming`: `"off"` (valore predefinito), `"partial"`, `"quiet"`, `"progress"` oppure forma a oggetto `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: quando è `true`, i blocchi completati dell'assistente vengono mantenuti come messaggi di avanzamento separati. Valore predefinito: `false`.
- `markdown`: configurazione facoltativa per la resa Markdown del testo in uscita.
- `responsePrefix`: stringa facoltativa anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione dei segmenti in uscita in caratteri quando `chunkMode: "length"`. Valore predefinito: `4000`.
- `chunkMode`: `"length"` (valore predefinito, suddivide in base al numero di caratteri) oppure `"newline"` (suddivide in corrispondenza dei confini di riga).
- `historyLimit`: numero di messaggi recenti della stanza inclusi come `InboundHistory` quando un messaggio della stanza attiva l'agente. In assenza di un valore usa `messages.groupChat.historyLimit`; valore predefinito effettivo: `0` (disabilitato).
- `mediaMaxMb`: limite delle dimensioni dei contenuti multimediali in MB per gli invii in uscita e l'elaborazione in ingresso. Valore predefinito: `20`.

### Impostazioni delle reazioni

- `ackReaction`: sostituzione della reazione di conferma per questo canale/account.
- `ackReactionScope`: sostituzione dell'ambito (`"group-mentions"` come valore predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità delle notifiche delle reazioni in ingresso (`"own"` come valore predefinito, `"off"`).

### Strumenti e sostituzioni per stanza

- `actions`: controllo degli strumenti per singola azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa dei criteri per stanza. L'identità della sessione usa l'ID stanza stabile dopo la risoluzione. (`rooms` è un alias precedente.)
  - `groups.<room>.account`: limita una voce stanza ereditata a uno specifico account.
  - `groups.<room>.enabled`: interruttore per stanza. Quando è `false`, la stanza viene ignorata come se non fosse presente nella mappa.
  - `groups.<room>.requireMention`: sostituzione per stanza del requisito di menzione a livello di canale.
  - `groups.<room>.allowBots`: sostituzione per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.botLoopProtection`: sostituzione per stanza del limite di protezione dai cicli tra bot.
  - `groups.<room>.users`: lista consentita dei mittenti per stanza.
  - `groups.<room>.tools`: sostituzioni di autorizzazione/blocco degli strumenti per stanza.
  - `groups.<room>.autoReply`: sostituzione per stanza del controllo basato sulle menzioni. `true` disabilita i requisiti di menzione per tale stanza; `false` li riattiva obbligatoriamente.
  - `groups.<room>.skills`: filtro Skills per stanza.
  - `groups.<room>.systemPrompt`: frammento del prompt di sistema per stanza.

### Impostazioni di approvazione dell'esecuzione

- `execApprovals.enabled`: recapita le approvazioni dell'esecuzione tramite prompt nativi di Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. In assenza di un valore usa `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (valore predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: liste consentite facoltative di agenti/sessioni per il recapito.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo basato sulle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e protezione
