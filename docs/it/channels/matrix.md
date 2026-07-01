---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurazione di Matrix E2EE e della verifica
summary: Stato del supporto, configurazione ed esempi di configurazione
title: Matrice
x-i18n:
    generated_at: "2026-07-01T13:03:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un plugin di canale scaricabile per OpenClaw.
Usa il `matrix-js-sdk` ufficiale e supporta DM, stanze, thread, media, reazioni, sondaggi, posizione ed E2EE.

## Installazione

Installa Matrix da ClawHub prima di configurare il canale:

```bash
openclaw plugins install @openclaw/matrix
```

Le specifiche Plugin essenziali provano prima ClawHub, poi il fallback npm. Per forzare la sorgente del registro, usa `openclaw plugins install clawhub:@openclaw/matrix` oppure `openclaw plugins install npm:@openclaw/matrix`.

Da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e abilita il plugin, quindi non è necessario un passaggio separato `openclaw plugins enable matrix`. Il plugin comunque non fa nulla finché non configuri il canale qui sotto. Consulta [Plugin](/it/tools/plugin) per il comportamento generale dei plugin e le regole di installazione.

## Configurazione

1. Crea un account Matrix sul tuo homeserver.
2. Configura `channels.matrix` con `homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`.
3. Riavvia il gateway.
4. Avvia un DM con il bot, oppure invitalo in una stanza (vedi [auto-join](#auto-join): i nuovi inviti arrivano solo quando `autoJoin` li consente).

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata richiede: URL dell'homeserver, metodo di autenticazione (token di accesso o password), ID utente (solo autenticazione con password), nome dispositivo facoltativo, se abilitare E2EE e se configurare accesso alle stanze e auto-join.

Se esistono già variabili di ambiente `MATRIX_*` corrispondenti e l'account selezionato non ha autenticazione salvata, la procedura guidata offre una scorciatoia tramite variabile di ambiente. Per risolvere i nomi delle stanze prima di salvare una allowlist, esegui `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE è abilitata, la procedura guidata scrive la configurazione ed esegue lo stesso bootstrap di [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` ha come valore predefinito `off`. Con l'impostazione predefinita, il bot non apparirà in nuove stanze o DM da nuovi inviti finché non ti unirai manualmente.

OpenClaw non può stabilire al momento dell'invito se una stanza invitata sia un DM o un gruppo, quindi tutti gli inviti, inclusi quelli in stile DM, passano prima da `autoJoin`. `dm.policy` si applica solo in seguito, dopo che il bot si è unito e la stanza è stata classificata.

<Warning>
Imposta `autoJoin: "allowlist"` più `autoJoinAllowlist` per limitare quali inviti il bot accetta, oppure `autoJoin: "always"` per accettare ogni invito.

`autoJoinAllowlist` accetta solo destinazioni stabili: `!roomId:server`, `#alias:server` o `*`. I nomi stanza semplici vengono rifiutati; le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
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

Le allowlist di DM e stanze è meglio popolarle con ID stabili:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usa `@user:server`. I nomi visualizzati vengono ignorati per impostazione predefinita perché sono modificabili; imposta `dangerouslyAllowNameMatching: true` solo quando hai esplicitamente bisogno di compatibilità con voci basate sul nome visualizzato.
- Chiavi allowlist delle stanze (`groups`, legacy `rooms`): usa `!room:server` o `#alias:server`. I nomi stanza semplici vengono ignorati per impostazione predefinita; imposta `dangerouslyAllowNameMatching: true` solo quando hai esplicitamente bisogno di compatibilità con la ricerca del nome di una stanza a cui si è uniti.
- Allowlist degli inviti (`autoJoinAllowlist`): usa `!room:server`, `#alias:server` o `*`. I nomi stanza semplici vengono rifiutati.

### Normalizzazione dell'ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato. Per esempio, `Ops Bot` diventa `ops-bot`. La punteggiatura viene sottoposta a escape nei nomi delle variabili di ambiente con ambito, così due account non possono collidere: `-` → `_X2D_`, quindi `ops-prod` viene mappato a `MATRIX_OPS_X2D_PROD_*`.

### Credenziali memorizzate nella cache

Matrix archivia le credenziali memorizzate nella cache sotto `~/.openclaw/credentials/matrix/`:

- account predefinito: `credentials.json`
- account con nome: `credentials-<account>.json`

Quando lì esistono credenziali memorizzate nella cache, OpenClaw considera Matrix configurato anche se il token di accesso non è nel file di configurazione: questo copre configurazione, `openclaw doctor` e sonde di stato del canale.

### Variabili di ambiente

Usate quando la chiave di configurazione equivalente non è impostata. L'account predefinito usa nomi senza prefisso; gli account con nome usano l'ID account inserito prima del suffisso.

| Account predefinito    | Account con nome (`<ID>` è l'ID account normalizzato) |
| ---------------------- | ----------------------------------------------------- |
| `MATRIX_HOMESERVER`    | `MATRIX_<ID>_HOMESERVER`                             |
| `MATRIX_ACCESS_TOKEN`  | `MATRIX_<ID>_ACCESS_TOKEN`                           |
| `MATRIX_USER_ID`       | `MATRIX_<ID>_USER_ID`                                |
| `MATRIX_PASSWORD`      | `MATRIX_<ID>_PASSWORD`                               |
| `MATRIX_DEVICE_ID`     | `MATRIX_<ID>_DEVICE_ID`                              |
| `MATRIX_DEVICE_NAME`   | `MATRIX_<ID>_DEVICE_NAME`                            |
| `MATRIX_RECOVERY_KEY`  | `MATRIX_<ID>_RECOVERY_KEY`                           |

Per l'account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. Le variabili di ambiente per la chiave di ripristino vengono lette dai flussi CLI consapevoli del ripristino (`verify backup restore`, `verify device`, `verify bootstrap`) quando fornisci la chiave tramite pipe con `--recovery-key-stdin`.

`MATRIX_HOMESERVER` non può essere impostato da un file `.env` dell'area di lavoro; vedi [file `.env` dell'area di lavoro](/it/gateway/security).

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

## Anteprime di streaming

Lo streaming delle risposte Matrix è opt-in. `streaming` controlla come OpenClaw recapita la risposta dell'assistente in corso; `blockStreaming` controlla se ogni blocco completato viene conservato come messaggio Matrix a sé stante.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Per mantenere le anteprime delle risposte live ma nascondere le righe intermedie di strumenti/progresso, usa la forma a oggetto:

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

- `progress.label`: un'etichetta personalizzata, `"auto"` o non impostato per scegliere tra etichette configurate o integrate, oppure `false` per nascondere la riga dell'etichetta.
- `progress.labels`: etichette candidate usate solo quando `label` è `"auto"` o non impostato. Lascia non impostato per i valori predefiniti integrati.
- `progress.maxLines`: numero massimo di righe di progresso a scorrimento mantenute nella bozza. Dopo questo limite, le righe più vecchie vengono tagliate.
- `progress.maxLineChars`: numero massimo di caratteri per riga di progresso compatta prima del troncamento.
- `progress.toolProgress`: quando `true` (predefinito), l'attività live di strumenti/progresso appare nella bozza.

| `streaming`             | Comportamento                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predefinito)   | Attende la risposta completa, invia una volta. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                                           |
| `"partial"`             | Modifica sul posto un normale messaggio di testo mentre il modello scrive il blocco corrente. I client Matrix standard possono inviare una notifica alla prima anteprima, non alla modifica finale. |
| `"quiet"`               | Come `"partial"`, ma il messaggio è un avviso che non invia notifiche. I destinatari ricevono una notifica solo quando una regola push per utente corrisponde alla modifica finalizzata (vedi sotto). |
| `"progress"`            | Invia singole righe di progresso compatte usando una bozza di progresso.                                                                                                                          |

`blockStreaming` è indipendente da `streaming`:

| `streaming`             | `blockStreaming: true`                                                       | `blockStreaming: false` (predefinito)                         |
| ----------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `"partial"` / `"quiet"` | Bozza live per il blocco corrente, blocchi completati mantenuti come messaggi | Bozza live per il blocco corrente, finalizzata sul posto       |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco completato                   | Un messaggio Matrix con notifica per la risposta completa      |

Note:

- Se un'anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell'anteprima e ripiega sulla consegna solo finale.
- Le risposte media inviano sempre gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la oscura prima di inviare la risposta media finale.
- Gli aggiornamenti di anteprima del progresso degli strumenti sono abilitati per impostazione predefinita quando lo streaming di anteprima Matrix è attivo. Imposta `streaming.preview.toolProgress: false` per mantenere le modifiche di anteprima per il testo della risposta ma lasciare il progresso degli strumenti sul normale percorso di consegna.
- Le modifiche di anteprima costano chiamate API Matrix aggiuntive. Lascia `streaming: "off"` se vuoi il profilo di limite di frequenza più conservativo.

## Messaggi vocali

Le note vocali Matrix in ingresso vengono trascritte prima del gate di menzione della stanza. Questo consente a una nota vocale che pronuncia il nome del bot di attivare l'agente in una stanza con `requireMention: true` e fornisce all'agente la trascrizione invece del solo segnaposto dell'allegato audio.

Matrix usa il provider multimediale audio condiviso configurato in `tools.media.audio`, come OpenAI `gpt-4o-mini-transcribe`. Consulta [panoramica degli strumenti multimediali](/it/tools/media-overview) per la configurazione e i limiti del provider.

Dettagli del comportamento:

- Sono idonei gli eventi `m.audio` e gli eventi `m.file` con un tipo MIME `audio/*`.
- Nelle stanze crittografate, OpenClaw decrittografa l'allegato tramite il percorso multimediale Matrix esistente prima della trascrizione.
- La trascrizione viene contrassegnata nel prompt dell'agente come generata automaticamente e non attendibile.
- L'allegato viene contrassegnato come già trascritto, così gli strumenti multimediali a valle non trascrivono di nuovo la stessa nota vocale.
- Imposta `tools.media.audio.enabled: false` per disabilitare globalmente la trascrizione audio.

## Metadati di approvazione

I prompt di approvazione nativi di Matrix sono normali eventi `m.room.message` con contenuto evento personalizzato specifico di OpenClaw sotto `com.openclaw.approval`. Matrix consente chiavi di contenuto evento personalizzate, quindi i client standard continuano a visualizzare il corpo del testo mentre i client compatibili con OpenClaw possono leggere id di approvazione strutturato, tipo, stato, decisioni disponibili e dettagli di exec/plugin.

Quando un prompt di approvazione è troppo lungo per un singolo evento Matrix, OpenClaw suddivide il testo visibile in blocchi e allega `com.openclaw.approval` solo al primo blocco. Le reazioni per le decisioni di consenso/rifiuto sono associate a quel primo evento, quindi i prompt lunghi mantengono lo stesso target di approvazione dei prompt con un solo evento.

### Regole push self-hosted per anteprime finalizzate silenziose

`streaming: "quiet"` notifica i destinatari solo quando un blocco o un turno viene finalizzato: una regola push per utente deve corrispondere al marcatore dell'anteprima finalizzata. Consulta [Regole push Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la procedura completa (token destinatario, controllo pusher, installazione regola, note per homeserver).

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

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati nelle stanze consentite e nei DM.
- `allowBots: "mentions"` accetta quei messaggi solo quando menzionano visibilmente questo bot nelle stanze. I DM sono comunque consentiti.
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello di account per una stanza.
- I messaggi accettati da bot configurati usano la [protezione condivisa dai loop dei bot](/it/channels/bot-loop-protection). Configura `channels.defaults.botLoopProtection`, poi sovrascrivi con `channels.matrix.botLoopProtection` o `channels.matrix.groups.<room>.botLoopProtection` quando una stanza richiede un budget diverso.
- OpenClaw continua a ignorare i messaggi dallo stesso ID utente Matrix per evitare loop di autorisposta.
- Matrix non espone qui un flag bot nativo; OpenClaw interpreta "scritto da bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist di stanze rigorose e requisiti di menzione quando abiliti il traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` in modo che le anteprime delle immagini siano crittografate insieme all'allegato completo. Le stanze non crittografate continuano a usare `thumbnail_url` semplice. Non serve alcuna configurazione: il plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile dalla macchina) e `--account <id>` (configurazioni multi-account). Per impostazione predefinita, l'output è conciso con log interni SDK silenziosi. Gli esempi qui sotto mostrano la forma canonica; aggiungi i flag secondo necessità.

### Abilitare la crittografia

```bash
openclaw matrix encryption setup
```

Inizializza l'archiviazione segreta e la firma incrociata, crea un backup delle chiavi delle stanze se necessario, quindi stampa stato e passaggi successivi. Flag utili:

- `--recovery-key <key>` applica una chiave di recupero prima dell'inizializzazione (preferisci la forma stdin documentata sotto)
- `--force-reset-cross-signing` elimina l'identità di firma incrociata corrente e ne crea una nuova (usare solo intenzionalmente)

Per un nuovo account, abilita E2EE al momento della creazione:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` è un alias di `--enable-e2ee`.

Configurazione manuale equivalente:

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

- `Locally trusted`: attendibile solo da questo client
- `Cross-signing verified`: l'SDK segnala la verifica tramite firma incrociata
- `Signed by owner`: firmato dalla tua chiave di autofirma (solo diagnostica)

`Verified by owner` diventa `yes` solo quando `Cross-signing verified` è `yes`. La fiducia locale o una sola firma del proprietario non è sufficiente.

`--allow-degraded-local-state` restituisce diagnostica best-effort senza preparare prima l'account Matrix; utile per verifiche offline o parzialmente configurate.

### Verificare questo dispositivo con una chiave di recupero

La chiave di recupero è sensibile: passala tramite stdin invece che dalla riga di comando. Imposta `MATRIX_RECOVERY_KEY` (o `MATRIX_<ID>_RECOVERY_KEY` per un account denominato):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando riporta tre stati:

- `Recovery key accepted`: Matrix ha accettato la chiave per l'archiviazione segreta o la fiducia del dispositivo.
- `Backup usable`: il backup delle chiavi delle stanze può essere caricato con il materiale di recupero attendibile.
- `Device verified by owner`: questo dispositivo ha piena fiducia dell'identità di firma incrociata Matrix.

Esce con codice diverso da zero quando la fiducia completa dell'identità è incompleta, anche se la chiave di recupero ha sbloccato il materiale di backup. In tal caso, completa l'autoverifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Cross-signing verified: yes` prima di uscire con successo. Usa `--timeout-ms <ms>` per regolare l'attesa.

È accettata anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave finisce nella cronologia della shell.

### Inizializzare o riparare la firma incrociata

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` è il comando di riparazione e configurazione per gli account crittografati. In ordine:

- inizializza l'archiviazione segreta, riutilizzando quando possibile una chiave di recupero esistente
- inizializza la firma incrociata e carica le chiavi pubbliche mancanti
- contrassegna e firma in modo incrociato il dispositivo corrente
- crea un backup server-side delle chiavi delle stanze se non ne esiste già uno

Se l'homeserver richiede UIA per caricare le chiavi di firma incrociata, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, poi `m.login.password` (richiede `channels.matrix.password`).

Flag utili:

- `--recovery-key-stdin` (da abbinare a `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) oppure `--recovery-key <key>`
- `--force-reset-cross-signing` per eliminare l'identità di firma incrociata corrente (solo intenzionalmente; richiede che la chiave di recupero attiva sia archiviata o fornita con `--recovery-key-stdin`)

### Backup delle chiavi delle stanze

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se esiste un backup server-side e se questo dispositivo può decrittografarlo. `backup restore` importa le chiavi delle stanze salvate nel backup nello store crittografico locale; se la chiave di recupero è già su disco puoi omettere `--recovery-key-stdin`.

Per sostituire un backup danneggiato con una baseline nuova (accetta la perdita della vecchia cronologia irrecuperabile; può anche ricreare l'archiviazione segreta se il segreto del backup corrente non è caricabile):

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

Invia una richiesta di verifica da questo account OpenClaw. `--own-user` richiede l'autoverifica (accetti il prompt in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` prendono di mira qualcun altro. `--own-user` non può essere combinato con gli altri flag di destinazione.

Per una gestione del ciclo di vita di livello più basso, in genere quando si affiancano richieste in ingresso da un altro client, questi comandi agiscono su una richiesta specifica `<id>` (stampata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accettare una richiesta in ingresso                                 |
| `openclaw matrix verify start <id>`        | Avviare il flusso SAS                                               |
| `openclaw matrix verify sas <id>`          | Stampare emoji o decimali SAS                                       |
| `openclaw matrix verify confirm-sas <id>`  | Confermare che il SAS corrisponde a ciò che mostra l'altro client   |
| `openclaw matrix verify mismatch-sas <id>` | Rifiutare il SAS quando emoji o decimali non corrispondono          |
| `openclaw matrix verify cancel <id>`       | Annullare; accetta `--reason <text>` e `--code <matrix-code>` facoltativi |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come suggerimenti di follow-up DM quando la verifica è ancorata a una specifica stanza di messaggi diretti.

### Note multi-account

Senza `--account <id>`, i comandi CLI Matrix usano l'account predefinito implicito. Se hai più account denominati e non hai impostato `channels.matrix.defaultAccount`, si rifiuteranno di indovinare e ti chiederanno di scegliere. Quando E2EE è disabilitata o non disponibile per un account denominato, gli errori puntano alla chiave di configurazione di quell'account, per esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, `startupVerification` ha valore predefinito `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, saltando i duplicati e applicando un cooldown (24 ore per impostazione predefinita). Regola con `startupVerificationCooldownHours` o disabilita con `startupVerification: "off"`.

    L'avvio esegue anche un passaggio conservativo di bootstrap crittografico che riutilizza l'archiviazione segreta e l'identità di firma incrociata correnti. Se lo stato di bootstrap è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, l'avvio registra un avviso e resta non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Consulta [Migrazione Matrix](/it/channels/matrix-migration) per il flusso completo di aggiornamento.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica avvisi sul ciclo di vita della verifica nella stanza DM di verifica rigorosa come messaggi `m.notice`: richiesta, pronto (con guida "Verifica tramite emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato quando la verifica con emoji è disponibile: devi comunque confrontare e confermare "Corrispondono" nel tuo client Matrix.

    Gli avvisi di sistema della verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Dispositivo Matrix eliminato o non valido">
    Se `verify status` indica che il dispositivo corrente non è più elencato sull'homeserver, crea un nuovo dispositivo Matrix OpenClaw. Per l'accesso con password:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Per l'autenticazione tramite token, crea un nuovo token di accesso nel tuo client Matrix o nell'interfaccia di amministrazione, poi aggiorna OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sostituisci `assistant` con l'ID account del comando non riuscito, oppure ometti `--account` per l'account predefinito.

  </Accordion>

  <Accordion title="Device hygiene">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elencali e rimuovi quelli obsoleti:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE usa il percorso crypto Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crypto persiste in `crypto-idb-snapshot.json` (permessi file restrittivi).

    Lo stato di runtime cifrato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include lo store di sincronizzazione, lo store crypto, la chiave di recovery, lo snapshot IDB, i binding dei thread e lo stato di verifica all'avvio. Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore root esistente, così lo stato precedente rimane visibile.

    Una singola root `token-hash` precedente può essere un normale percorso di continuità per la rotazione dei token. Se OpenClaw registra `matrix: multiple populated token-hash storage roots detected`, ispeziona la directory dell'account e archivia le root sibling obsolete solo dopo aver confermato che la root attiva selezionata è integra. Preferisci spostare le root obsolete in una directory `_archive/` invece di eliminarle subito.

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

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii tramite strumenti di messaggistica. Due controlli indipendenti determinano il comportamento:

### Routing delle sessioni (`sessionScope`)

`dm.sessionScope` decide come le stanze DM Matrix vengono mappate alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze DM con lo stesso peer instradato condividono una sessione.
- `"per-room"`: ogni stanza DM Matrix ottiene la propria chiave di sessione, anche quando il peer è lo stesso.

I binding espliciti delle conversazioni prevalgono sempre su `sessionScope`, quindi stanze e thread vincolati mantengono la sessione di destinazione scelta.

### Risposte in thread (`threadReplies`)

`threadReplies` decide dove il bot pubblica la risposta:

- `"off"`: le risposte sono di primo livello. I messaggi in thread in ingresso restano sulla sessione padre.
- `"inbound"`: risponde dentro un thread solo quando il messaggio in ingresso era già in quel thread.
- `"always"`: risponde dentro un thread radicato nel messaggio che ha attivato l'evento; quella conversazione viene instradata tramite una sessione con ambito thread corrispondente dal primo trigger in poi.

`dm.threadReplies` lo sovrascrive solo per i DM, ad esempio per mantenere isolati i thread delle stanze lasciando i DM piatti.

### Ereditarietà dei thread e comandi slash

- I messaggi in thread in ingresso includono il messaggio root del thread come contesto agent aggiuntivo.
- Gli invii tramite strumenti di messaggistica ereditano automaticamente il thread Matrix corrente quando puntano alla stessa stanza (o allo stesso target utente DM), a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo del target utente DM si attiva solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw ricade sul normale routing con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vincolato a thread funzionano tutti nelle stanze Matrix e nei DM.
- `/focus` di primo livello crea un nuovo thread Matrix e lo vincola alla sessione di destinazione quando `threadBindings.spawnSessions` è abilitato.
- Eseguire `/focus` o `/acp spawn --thread here` dentro un thread Matrix esistente vincola quel thread sul posto.

Quando OpenClaw rileva che una stanza DM Matrix collide con un'altra stanza DM sulla stessa sessione condivisa, pubblica una sola volta un `m.notice` in quella stanza indicando la via d'uscita `/focus` e suggerendo una modifica di `dm.sessionScope`. L'avviso appare solo quando i binding dei thread sono abilitati.

## Binding delle conversazioni ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP durevoli senza cambiare la superficie chat.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` dentro il DM Matrix, la stanza o il thread esistente che vuoi continuare a usare.
- In un DM Matrix o in una stanza di primo livello, il DM/la stanza corrente resta la superficie chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- Dentro un thread Matrix esistente, `--bind here` vincola quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP vincolata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnSessions` regola `/acp spawn --thread auto|here`, nei casi in cui OpenClaw deve creare o vincolare un thread Matrix figlio.

### Configurazione dei binding dei thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Le generazioni di sessioni vincolate a thread Matrix sono abilitate per impostazione predefinita:

- Imposta `threadBindings.spawnSessions: false` per impedire a `/focus` di primo livello e `/acp spawn --thread auto|here` di creare/vincolare thread Matrix.
- Imposta `threadBindings.defaultSpawnContext: "isolated"` quando le generazioni di thread subagent nativi non devono biforcare il transcript padre.

## Reazioni

Matrix supporta reazioni in uscita, notifiche di reazione in ingresso e reazioni di conferma.

Gli strumenti per le reazioni in uscita sono regolati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo delle reazioni correnti per un evento Matrix.
- `emoji=""` rimuove le reazioni del bot stesso su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dal bot.

**Ordine di risoluzione** (vince il primo valore definito):

| Impostazione            | Ordine                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | per account → canale → `messages.ackReaction` → fallback emoji identità agent    |
| `ackReactionScope`      | per account → canale → `messages.ackReactionScope` → predefinito `"group-mentions"` |
| `reactionNotifications` | per account → canale → predefinito `"own"`                                       |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando puntano a messaggi Matrix scritti dal bot; `"off"` disabilita gli eventi di sistema delle reazioni. Le rimozioni delle reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio in una stanza Matrix attiva l'agent. Ricade su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo per stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo pending: OpenClaw bufferizza i messaggi della stanza che non hanno ancora attivato una risposta, poi acquisisce uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I retry dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di avanzare verso messaggi della stanza più recenti.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come testo di risposta recuperato, root dei thread e cronologia pending.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare limitandolo ai mittenti consentiti dai controlli allowlist attivi della stanza/dell'utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta esplicitamente citata.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso possa attivare una risposta.
L'autorizzazione del trigger deriva comunque da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri DM.

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

Vedi [Gruppi](/it/channels/groups) per il comportamento di mention-gating e allowlist.

Esempio di pairing per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing in sospeso e può inviare una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing dei DM e il layout dello storage.

## Riparazione delle stanze dirette

Se lo stato dei messaggi diretti perde la sincronizzazione, OpenClaw può ritrovarsi con mapping `m.direct` obsoleti che puntano a vecchie stanze individuali invece che al DM attivo. Ispeziona il mapping corrente per un peer:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per configurazioni multi-account. Il flusso di riparazione:

- preferisce un DM 1:1 rigoroso già mappato in `m.direct`
- ricade su qualsiasi DM 1:1 rigoroso con quell'utente a cui si è attualmente uniti
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM integro

Non elimina automaticamente le vecchie stanze. Seleziona il DM integro e aggiorna il mapping in modo che i futuri invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti puntino alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo. Configura sotto `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` per un override per account):

- `enabled`: consegna le approvazioni tramite prompt nativi Matrix. Quando non impostato o `"auto"`, Matrix si abilita automaticamente quando almeno un approvatore può essere risolto. Imposta `false` per disabilitarlo esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare richieste exec. Facoltativo: ricade su `channels.matrix.dm.allowFrom`.
- `target`: dove inviare i prompt. `"dm"` (predefinito) invia ai DM degli approvatori; `"channel"` invia alla stanza Matrix o al DM di origine; `"both"` invia a entrambi.
- `agentFilter` / `sessionFilter`: allowlist facoltative per stabilire quali agent/sessioni attivano la consegna Matrix.

L'autorizzazione differisce leggermente tra i tipi di approvazione:

- **Approvazioni exec** usano `execApprovals.approvers`, con fallback a `dm.allowFrom`.
- **Approvazioni Plugin** autorizzano solo tramite `dm.allowFrom`.

Entrambi i tipi condividono scorciatoie di reazione Matrix e aggiornamenti dei messaggi. Gli approvatori vedono scorciatoie di reazione sul messaggio di approvazione principale:

- `✅` consenti una volta
- `❌` nega
- `♾️` consenti sempre (quando il criterio exec effettivo lo consente)

Comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. La consegna sul canale per le approvazioni exec include il testo del comando: abilita `channel` o `both` solo in stanze attendibili.

Correlato: [Approvazioni exec](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, ecc.) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa con Tab il bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare le stesse policy di allowlist/proprietario per DM o stanze dei messaggi semplici.

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

- I valori di primo livello `channels.matrix` agiscono da predefiniti per gli account nominati, a meno che un account non li sovrascriva.
- Limita una voce stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra gli account; `account: "default"` funziona ancora quando l'account predefinito è configurato al primo livello.

**Selezione dell'account predefinito:**

- Imposta `defaultAccount` per scegliere l'account nominato preferito da instradamento implicito, probe e comandi CLI.
- Se hai più account e uno si chiama letteralmente `default`, OpenClaw lo usa implicitamente anche quando `defaultAccount` non è impostato.
- Se hai più account nominati e non è selezionato alcun predefinito, i comandi CLI rifiutano di indovinare: imposta `defaultAccount` o passa `--account <id>`.
- Il blocco di primo livello `channels.matrix.*` viene trattato come account implicito `default` solo quando la sua autenticazione è completa (`homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`). Gli account nominati rimangono individuabili da `homeserver` + `userId` una volta che le credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw promuove una configurazione a singolo account a multi-account durante riparazione o configurazione, preserva l'account nominato esistente se ce n'è uno o se `defaultAccount` punta già a uno. Solo le chiavi di autenticazione/bootstrap Matrix vengono spostate nell'account promosso; le chiavi di policy di consegna condivise restano al primo livello.

Consulta il [riferimento di configurazione](/it/gateway/config-channels#multi-account-all-channels) per il pattern multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu non dia esplicitamente il consenso per account.

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

Questo consenso esplicito consente solo target privati/interni attendibili. Gli homeserver pubblici in chiaro, come
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
OpenClaw usa la stessa impostazione proxy per il traffico Matrix in runtime e per i probe di stato degli account.

## Risoluzione dei target

Matrix accetta questi formati di target ovunque OpenClaw ti chieda una stanza o un target utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Gli ID delle stanze Matrix distinguono tra maiuscole e minuscole. Usa l'esatta combinazione di maiuscole e minuscole dell'ID stanza da Matrix
quando configuri target di consegna espliciti, job cron, binding o allowlist.
OpenClaw mantiene canoniche le chiavi di sessione interne per l'archiviazione, quindi quelle chiavi in minuscolo
non sono una fonte affidabile per gli ID di consegna Matrix.

La ricerca live nella directory usa l'account Matrix connesso:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti. La ricerca per nome delle stanze unite è best-effort e si applica solo alle allowlist stanza in runtime quando è impostato `dangerouslyAllowNameMatching: true`.
- Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione della allowlist in runtime.

## Riferimento di configurazione

I campi utente in stile allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi (opzione più sicura). Le voci utente non-ID vengono ignorate per impostazione predefinita. Se imposti `dangerouslyAllowNameMatching: true`, le corrispondenze esatte con i nomi visualizzati nella directory Matrix vengono risolte all'avvio e ogni volta che l'allowlist cambia mentre il monitor è in esecuzione; le voci che non possono essere risolte vengono ignorate in runtime.

Le chiavi allowlist delle stanze (`groups`, legacy `rooms`) devono essere ID stanza o alias. Le chiavi con nomi stanza semplici vengono ignorate per impostazione predefinita; `dangerouslyAllowNameMatching: true` ripristina la ricerca best-effort sui nomi delle stanze unite.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta visualizzata opzionale per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `accounts`: sovrascritture nominate per account. I valori di primo livello `channels.matrix` vengono ereditati come predefiniti.
- `homeserver`: URL dell'homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consenti a questo account di connettersi a `localhost`, IP LAN/Tailscale o hostname interni.
- `proxy`: URL proxy HTTP(S) opzionale per il traffico Matrix. Sovrascrittura per account supportata.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per l'autenticazione basata su token. Sono supportati valori in testo semplice e SecretRef tra provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per il login basato su password. Sono supportati valori in testo semplice e SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo usato al momento del login con password.
- `avatarUrl`: URL dell'avatar personale archiviato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.

### Crittografia

- `encryption`: abilita E2EE. Predefinito: `false`.
- `startupVerification`: `"if-unverified"` (predefinito quando E2EE è attiva) o `"off"`. Richiede automaticamente l'auto-verifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: cooldown prima della successiva richiesta automatica all'avvio. Predefinito: `24`.

### Accesso e policy

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Predefinito: `"allowlist"`.
- `groupAllowFrom`: allowlist di ID utente per il traffico delle stanze.
- `mentionPatterns`: pattern regex con ambito per le menzioni nelle stanze. Oggetto con `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Controlla se i `agents.list[].groupChat.mentionPatterns` configurati si applicano per stanza.
- `dm.enabled`: quando `false`, ignora tutti i DM. Predefinito: `true`.
- `dm.policy`: `"pairing"` (predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot si è unito e ha classificato la stanza come DM; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM.
- `dm.sessionScope`: `"per-user"` (predefinito) o `"per-room"`.
- `dm.threadReplies`: sovrascrittura solo DM per il threading delle risposte (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando `true`, forza tutte le policy DM attive (eccetto `"disabled"`) e le policy di gruppo `"open"` a `"allowlist"`. Non modifica le policy `"disabled"`.
- `dangerouslyAllowNameMatching`: quando `true`, consente la ricerca nella directory dei nomi visualizzati Matrix per le voci allowlist utente e la ricerca del nome delle stanze unite per le chiavi allowlist stanza. Preferisci gli ID completi `@user:server` e gli ID stanza o alias.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi gli inviti in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"`, `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` o `"always"`.
- `threadBindings`: sovrascritture per canale per l'instradamento e il ciclo di vita delle sessioni vincolate ai thread.
- `streaming`: `"off"` (predefinito), `"partial"`, `"quiet"`, `"progress"` o forma oggetto `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, i blocchi assistente completati vengono mantenuti come messaggi di avanzamento separati.
- `markdown`: configurazione opzionale di rendering Markdown per il testo in uscita.
- `responsePrefix`: stringa opzionale anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione dei chunk in uscita in caratteri quando `chunkMode: "length"`. Predefinito: `4000`.
- `chunkMode`: `"length"` (predefinito, divide per conteggio caratteri) o `"newline"` (divide ai confini di riga).
- `historyLimit`: numero di messaggi stanza recenti inclusi come `InboundHistory` quando un messaggio stanza attiva l'agente. Ripiega su `messages.groupChat.historyLimit`; predefinito effettivo `0` (disabilitato).
- `mediaMaxMb`: limite di dimensione dei media in MB per invii in uscita ed elaborazione in ingresso.

### Impostazioni reazioni

- `ackReaction`: sovrascrittura della reazione di ack per questo canale/account.
- `ackReactionScope`: sovrascrittura dell'ambito (`"group-mentions"` predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`"own"` predefinito, `"off"`).

### Strumenti e sovrascritture per stanza

- `actions`: controllo degli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa delle policy per stanza. L'identità della sessione usa l'ID stabile della stanza dopo la risoluzione. (`rooms` è un alias legacy.)
  - `groups.<room>.account`: limita una voce di stanza ereditata a un account specifico.
  - `groups.<room>.enabled`: interruttore per stanza. Quando è `false`, la stanza viene ignorata come se non fosse nella mappa.
  - `groups.<room>.requireMention`: override per stanza del requisito di menzione a livello di canale.
  - `groups.<room>.allowBots`: override per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.botLoopProtection`: override per stanza del budget di protezione dai cicli bot-to-bot.
  - `groups.<room>.users`: elenco dei mittenti consentiti per stanza.
  - `groups.<room>.tools`: override per stanza per consentire/negare strumenti.
  - `groups.<room>.autoReply`: override per stanza del controllo tramite menzione. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza di nuovo.
  - `groups.<room>.skills`: filtro delle skill per stanza.
  - `groups.<room>.systemPrompt`: frammento di prompt di sistema per stanza.

### Impostazioni di approvazione exec

- `execApprovals.enabled`: invia le approvazioni exec tramite prompt nativi di Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. Ripiega su `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: elenchi di agenti/sessioni consentiti opzionali per la consegna.

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Abbinamento](/it/channels/pairing) - autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
