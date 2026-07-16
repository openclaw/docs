---
read_when:
    - Configurazione di Matrix in OpenClaw
    - Configurazione dell'E2EE e della verifica di Matrix
summary: Stato del supporto di Matrix, configurazione iniziale ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-07-16T13:51:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca704ff911dbe97242d42727561fbce59f27e190343d2343dfad46289c1e0b94
    source_path: channels/matrix.md
    workflow: 16
---

Matrix è un plugin di canale scaricabile (`@openclaw/matrix`) basato su `matrix-js-sdk` ufficiale. Supporta messaggi diretti, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Installazione

```bash
openclaw plugins install @openclaw/matrix
```

Le specifiche del plugin senza qualificatori provano prima ClawHub, quindi ripiegano su npm. È possibile forzare un'origine con `openclaw plugins install clawhub:@openclaw/matrix` o `npm:@openclaw/matrix`. Da un checkout locale: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registra e abilita il plugin; non è necessario alcun passaggio `enable` separato. Il canale rimane inattivo finché non viene configurato come indicato di seguito. Consultare [Plugin](/it/tools/plugin) per le regole generali di installazione.

## Configurazione

1. Creare un account Matrix sul proprio homeserver.
2. Configurare `channels.matrix` con `homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`.
3. Riavviare il Gateway.
4. Avviare un messaggio diretto con il bot oppure invitarlo in una stanza. I nuovi inviti vengono accettati solo quando [`autoJoin`](#auto-join) lo consente.

### Configurazione interattiva

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata richiede l'URL dell'homeserver, il metodo di autenticazione (token o password), l'ID utente (solo per l'autenticazione tramite password), un nome facoltativo per il dispositivo, se abilitare E2EE e le impostazioni di accesso alle stanze/partecipazione automatica. Se esistono già variabili di ambiente `MATRIX_*` corrispondenti e l'account non dispone di credenziali di autenticazione salvate, la procedura guidata propone una scorciatoia tramite variabili di ambiente. Prima di salvare un elenco consentiti con `openclaw channels resolve --channel matrix "Project Room"`, risolvere i nomi delle stanze. L'abilitazione di E2EE nella procedura guidata esegue la stessa inizializzazione di [`openclaw matrix encryption setup`](#encryption-and-verification).

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

Il valore predefinito di `channels.matrix.autoJoin` è `"off"`: il bot non comparirà nelle nuove stanze o nei messaggi diretti derivanti da nuovi inviti finché non si effettua manualmente l'accesso. Al momento dell'invito, OpenClaw non può determinare se si tratti di un messaggio diretto o di un gruppo, pertanto ogni invito passa prima attraverso `autoJoin`; `dm.policy` si applica solo in seguito, dopo che il bot ha effettuato l'accesso e la stanza è stata classificata.

<Warning>
Impostare `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare gli inviti accettati, oppure `autoJoin: "always"` per accettare tutti gli inviti.

`autoJoinAllowlist` accetta solo `!roomId:server`, `#alias:server` o `*`. I semplici nomi di stanza vengono rifiutati; gli alias vengono risolti rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza che ha inviato l'invito.
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

### Formati delle destinazioni dell'elenco consentiti

- Messaggi diretti (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): usare `@user:server`. I nomi visualizzati vengono ignorati per impostazione predefinita (sono modificabili); impostare `dangerouslyAllowNameMatching: true` solo per una compatibilità esplicita con i nomi visualizzati.
- Chiavi dell'elenco consentiti delle stanze (`groups`, alias precedente `rooms`): usare `!room:server` o `#alias:server`. I nomi semplici vengono ignorati a meno che non sia impostato `dangerouslyAllowNameMatching: true`.
- Elenchi consentiti per gli inviti (`autoJoinAllowlist`): usare `!room:server`, `#alias:server` o `*`. I nomi semplici vengono sempre rifiutati.

### Normalizzazione dell'ID account

La procedura guidata converte un nome descrittivo in un ID account normalizzato (`Ops Bot` -> `ops-bot`). Nei nomi delle variabili di ambiente con ambito, la punteggiatura viene sottoposta a escape esadecimale per evitare collisioni tra account: `-` (0x2D) diventa `_X2D_`, pertanto `ops-prod` viene associato al prefisso di ambiente `MATRIX_OPS_X2D_PROD_`.

### Credenziali memorizzate nella cache

Matrix memorizza le credenziali nella cache in `~/.openclaw/credentials/matrix/`: `credentials.json` per l'account predefinito, `credentials-<account>.json` per gli account denominati. Quando esistono credenziali memorizzate nella cache, OpenClaw considera Matrix configurato anche senza un `accessToken` nel file di configurazione; ciò vale per la configurazione, `openclaw doctor` e i controlli dello stato del canale.

### Variabili di ambiente

Variabili di ambiente associate alle chiavi di configurazione, utilizzate quando la chiave di configurazione equivalente non è impostata. L'account predefinito utilizza nomi senza prefisso; gli account denominati inseriscono il token dell'account prima del suffisso (consultare la [normalizzazione](#account-id-normalization)).

| Account predefinito       | Account denominato (`<ID>` = token dell'account) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

Per l'account `ops`, i nomi diventano `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e così via. `MATRIX_HOMESERVER` (e qualsiasi variante con ambito `*_HOMESERVER`) non può essere impostato da un `.env` dell'area di lavoro; consultare [File `.env` dell'area di lavoro](/it/gateway/security).

<Note>
La chiave di recupero non è una variabile di ambiente associata alla configurazione: OpenClaw non la legge mai direttamente dall'ambiente. Il testo di guida della CLI suggerisce di passarla tramite pipe usando una variabile di shell denominata `MATRIX_RECOVERY_KEY` per l'account predefinito, oppure `MATRIX_RECOVERY_KEY_<ID>` (ID account semplicemente convertito in maiuscolo, senza escape esadecimale) per un account denominato; consultare [Verificare questo dispositivo con una chiave di recupero](#verify-this-device-with-a-recovery-key).
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
      streaming: { mode: "partial" },
    },
  },
}
```

## Anteprime in streaming

Lo streaming delle risposte di Matrix è facoltativo. `streaming.mode` controlla il modo in cui OpenClaw recapita la risposta dell'assistente mentre è in corso; `streaming.block.enabled` controlla se ogni blocco completato viene conservato come messaggio Matrix separato.

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "partial" },
    },
  },
}
```

Per mantenere le anteprime in tempo reale delle risposte ma nascondere le righe intermedie relative agli strumenti e all'avanzamento:

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

La configurazione completa accetta `{ mode, chunkMode, block, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // scegli tra le etichette configurate o integrate (false per nascondere)
          labels: ["Thinking", "Writing", "Searching"], // opzioni per label: "auto"
          maxLines: 8, // numero massimo di righe di avanzamento scorrevoli (predefinito: 8)
          maxLineChars: 120, // numero massimo di caratteri per riga prima del troncamento (predefinito: 120)
          toolProgress: true, // mostra l'attività degli strumenti/di avanzamento (predefinito: true)
        },
      },
    },
  },
}
```

- `progress.label`: etichetta personalizzata, `"auto"`/non impostato per scegliere un'etichetta configurata o integrata, oppure `false` per nasconderla.
- `progress.labels`: opzioni utilizzate solo quando `label` è `"auto"` o non è impostato.
- `progress.maxLines`: numero massimo di righe di avanzamento scorrevoli conservate nella bozza; le righe meno recenti oltre questo limite vengono eliminate.
- `progress.maxLineChars`: numero massimo di caratteri per ogni riga di avanzamento compatta prima del troncamento.
- `progress.toolProgress`: quando è `true` (valore predefinito), l'attività in tempo reale degli strumenti e dell'avanzamento compare nella bozza.

| `streaming.mode`  | Comportamento                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (predefinito) | Attende la risposta completa e la invia una sola volta.                                                                                                                      |
| `"partial"`       | Modifica sul posto un normale messaggio di testo mentre il modello scrive il blocco corrente. I client standard potrebbero inviare una notifica alla prima anteprima, anziché alla modifica finale.          |
| `"quiet"`         | Come `"partial"`, ma il messaggio è un avviso che non genera notifiche. I destinatari ricevono una notifica quando una regola push per utente corrisponde alla modifica finalizzata (vedere di seguito). |
| `"progress"`      | Invia singole righe di avanzamento compatte utilizzando una bozza di avanzamento.                                                                                          |

`streaming.block.enabled` (valore predefinito `false`) è indipendente da `streaming.mode`:

| `streaming.mode`        | `block.enabled: true`                                               | `block.enabled: false` (predefinito)                     |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Bozza in tempo reale per il blocco corrente, con i blocchi completati conservati come messaggi | Bozza in tempo reale per il blocco corrente, finalizzata sul posto |
| `"off"`                 | Un messaggio Matrix con notifica per ogni blocco completato                     | Un messaggio Matrix con notifica per la risposta completa      |

Note:

- Se un'anteprima supera il limite di dimensione per evento di Matrix, OpenClaw interrompe lo streaming dell'anteprima e ripiega sulla consegna della sola risposta finale.
- Le risposte multimediali inviano sempre gli allegati normalmente; se un'anteprima obsoleta non può essere riutilizzata in sicurezza, OpenClaw la oscura prima di inviare la risposta multimediale finale.
- Gli aggiornamenti dell'anteprima sull'avanzamento degli strumenti sono abilitati per impostazione predefinita quando lo streaming dell'anteprima è attivo. Impostare `streaming.preview.toolProgress: false` per mantenere le modifiche dell'anteprima del testo della risposta, lasciando però l'avanzamento degli strumenti nel normale percorso di consegna.
- Le modifiche dell'anteprima richiedono chiamate API Matrix aggiuntive. Mantenere `streaming.mode: "off"` per il profilo più prudente rispetto ai limiti di frequenza.
- I valori scalari/booleani precedenti di `streaming` e le chiavi non annidate `blockStreaming` / `chunkMode` vengono riscritti in questa struttura annidata da `openclaw doctor --fix`.

## Messaggi vocali

Le note vocali Matrix in entrata vengono trascritte prima del controllo delle menzioni della stanza, quindi una nota vocale che pronuncia il nome del bot può attivare l'agente in una stanza `requireMention: true`, e l'agente riceve la trascrizione anziché soltanto un segnaposto per l'allegato audio.

Matrix utilizza il provider condiviso per i contenuti multimediali audio in `tools.media.audio`, ad esempio `gpt-4o-mini-transcribe` di OpenAI. Consultare la [Panoramica degli strumenti multimediali](/it/tools/media-overview) per la configurazione e i limiti del provider.

- Gli eventi `m.audio` e gli eventi `m.file` con un tipo MIME `audio/*` sono idonei.
- Nelle stanze crittografate, OpenClaw decrittografa l'allegato tramite il percorso multimediale Matrix esistente prima della trascrizione.
- La trascrizione viene contrassegnata come generata automaticamente e non attendibile nel prompt dell'agente.
- L'allegato viene contrassegnato come già trascritto, affinché gli strumenti multimediali a valle non lo trascrivano nuovamente.
- Impostare `tools.media.audio.enabled: false` per disabilitare globalmente la trascrizione audio.

## Metadati di approvazione

I prompt di approvazione nativi di Matrix sono normali eventi `m.room.message` con contenuti specifici di OpenClaw sotto la chiave `com.openclaw.approval`. I client standard continuano a visualizzare il corpo testuale; i client compatibili con OpenClaw possono leggere l'ID di approvazione strutturato, il tipo, lo stato, le decisioni e i dettagli di esecuzione/Plugin.

Quando un prompt è troppo lungo per un singolo evento Matrix, OpenClaw suddivide il testo visibile in blocchi e associa `com.openclaw.approval` solo al primo blocco. Le reazioni di autorizzazione/rifiuto vengono associate al primo evento, quindi i prompt lunghi mantengono lo stesso obiettivo di approvazione dei prompt composti da un singolo evento.

### Regole push self-hosted per anteprime finalizzate silenziose

`streaming.mode: "quiet"` invia notifiche ai destinatari solo dopo la finalizzazione di un blocco o turno: una regola push per utente deve corrispondere al marcatore dell'anteprima finalizzata. Consultare [Regole push di Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la procedura completa.

## Stanze tra bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix di OpenClaw configurati vengono ignorati. Utilizzare `allowBots` per consentire intenzionalmente il traffico tra agenti:

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

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati nelle stanze consentite e nei messaggi diretti.
- `allowBots: "mentions"` accetta tali messaggi nelle stanze solo quando menzionano visibilmente questo bot; i messaggi diretti sono comunque consentiti.
- `groups.<room>.allowBots` sostituisce l'impostazione a livello di account per una singola stanza.
- I messaggi accettati dai bot configurati utilizzano la [protezione condivisa dai loop dei bot](/it/channels/bot-loop-protection). Configurare `channels.defaults.botLoopProtection`, quindi applicare una sostituzione per account con `channels.matrix.botLoopProtection` o per stanza con `channels.matrix.groups.<room>.botLoopProtection`.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di autorisposta.
- Matrix non dispone di un indicatore nativo per i bot; OpenClaw considera "scritto da un bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Quando si abilita il traffico tra bot nelle stanze condivise, utilizzare elenchi di stanze consentite rigorosi e requisiti di menzione.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita utilizzano `thumbnail_file`, affinché le anteprime delle immagini siano crittografate insieme all'allegato completo; le stanze non crittografate utilizzano il semplice `thumbnail_url`. Non è necessaria alcuna configurazione: il Plugin rileva automaticamente lo stato E2EE.

Tutti i comandi `openclaw matrix` accettano `--verbose` (diagnostica completa), `--json` (output leggibile dalle macchine) e `--account <id>` (configurazioni con più account). Per impostazione predefinita, l'output è conciso.

### Abilitare la crittografia

```bash
openclaw matrix encryption setup
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix encryption setup --recovery-key-stdin
```

Inizializza l'archiviazione dei segreti e la firma incrociata, crea un backup delle chiavi delle stanze se necessario, quindi mostra lo stato e i passaggi successivi. Opzioni utili:

- `--recovery-key-stdin` legge una chiave di recupero da stdin senza esporla negli argomenti del processo; `--recovery-key <key>` rimane disponibile per compatibilità
- `--force-reset-cross-signing` elimina l'identità di firma incrociata corrente e ne crea una nuova (solo per uso intenzionale)

Per un nuovo account, abilitare E2EE al momento della creazione:

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

- `Locally trusted`: considerato attendibile solo da questo client
- `Cross-signing verified`: l'SDK segnala la verifica tramite firma incrociata
- `Signed by owner`: firmato dalla propria chiave di firma personale (solo diagnostica)

`Verified by owner` è `yes` solo quando `Cross-signing verified` è `yes`; l'attendibilità locale o la sola firma del proprietario non sono sufficienti.

`--allow-degraded-local-state` restituisce una diagnostica basata sul massimo sforzo senza prima preparare l'account Matrix; è utile per controlli offline o su configurazioni parziali.

### Verificare questo dispositivo con una chiave di recupero

Inoltrare la chiave di recupero tramite stdin anziché passarla dalla riga di comando:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Il comando segnala tre stati:

- `Recovery key accepted`: Matrix ha accettato la chiave per l'archiviazione dei segreti o l'attendibilità del dispositivo.
- `Backup usable`: il backup delle chiavi delle stanze può essere caricato con il materiale di recupero attendibile.
- `Device verified by owner`: questo dispositivo dispone della piena attendibilità dell'identità di firma incrociata Matrix.

Il comando termina con un codice diverso da zero quando l'attendibilità completa dell'identità non è stata raggiunta, anche se la chiave di recupero ha sbloccato il materiale di backup. In tal caso, completare l'autoverifica da un altro client Matrix:

```bash
openclaw matrix verify self
```

`verify self` attende `Cross-signing verified: yes` prima di terminare correttamente. Utilizzare `--timeout-ms <ms>` per regolare l'attesa.

È possibile utilizzare anche la forma con chiave letterale `openclaw matrix verify device "<recovery-key>"`, ma la chiave viene registrata nella cronologia della shell.

### Inizializzare o riparare la firma incrociata

```bash
openclaw matrix verify bootstrap
```

Il comando di riparazione/configurazione per gli account crittografati. Nell'ordine:

- inizializza l'archiviazione dei segreti, riutilizzando quando possibile una chiave di recupero esistente
- inizializza la firma incrociata e carica le chiavi pubbliche mancanti
- contrassegna e firma in modo incrociato il dispositivo corrente
- crea un backup lato server delle chiavi delle stanze, se non ne esiste già uno

Se l'homeserver richiede UIA per caricare le chiavi di firma incrociata, OpenClaw prova prima senza autenticazione, quindi `m.login.dummy` e infine `m.login.password` (richiede `channels.matrix.password`).

Opzioni utili:

- `--recovery-key-stdin` (da associare a `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) oppure `--recovery-key <key>`
- `--force-reset-cross-signing` per eliminare l'identità di firma incrociata corrente (solo intenzionalmente; richiede che la chiave di recupero attiva sia archiviata o fornita con `--recovery-key-stdin`)

### Backup delle chiavi delle stanze

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se esiste un backup lato server e se questo dispositivo è in grado di decrittografarlo. `backup restore` importa le chiavi delle stanze sottoposte a backup nell'archivio crittografico locale; omettere `--recovery-key-stdin` se la chiave di recupero è già presente sul disco.

Per sostituire un backup danneggiato con una nuova base di riferimento (accettando la perdita della vecchia cronologia non recuperabile; può anche ricreare l'archiviazione dei segreti se non è possibile caricare il segreto del backup corrente):

```bash
openclaw matrix verify backup reset --yes
```

Aggiungere `--rotate-recovery-key` solo quando si desidera intenzionalmente che la precedente chiave di recupero non possa più sbloccare la nuova base di riferimento del backup.

### Elencare, richiedere e rispondere alle verifiche

```bash
openclaw matrix verify list
```

Elenca le richieste di verifica in sospeso per l'account selezionato.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Invia una richiesta di verifica da questo account. `--own-user` richiede l'autoverifica (accettare il prompt in un altro client Matrix dello stesso utente); `--user-id`/`--device-id`/`--room-id` sono destinati a un'altra persona. `--own-user` non può essere combinato con le altre opzioni di destinazione.

Per la gestione del ciclo di vita a basso livello, generalmente durante il monitoraggio delle richieste in entrata da un altro client, questi comandi agiscono su una specifica richiesta `<id>` (mostrata da `verify list` e `verify request`):

| Comando                                    | Scopo                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Accettare una richiesta in entrata                                           |
| `openclaw matrix verify start <id>`        | Avviare il flusso SAS                                                  |
| `openclaw matrix verify sas <id>`          | Mostrare le emoji o i decimali SAS                                     |
| `openclaw matrix verify confirm-sas <id>`  | Confermare che il SAS corrisponde a quanto mostrato dall'altro client            |
| `openclaw matrix verify mismatch-sas <id>` | Rifiutare il SAS quando le emoji o i decimali non corrispondono              |
| `openclaw matrix verify cancel <id>`       | Annullare; accetta `--reason <text>` e `--code <matrix-code>` facoltativi |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` accettano tutti `--user-id` e `--room-id` come indicazioni per il seguito nei messaggi diretti quando la verifica è ancorata a una specifica stanza di messaggistica diretta.

### Note sugli account multipli

Senza `--account <id>`, i comandi CLI di Matrix utilizzano l'account predefinito implicito. In presenza di più account denominati e senza `channels.matrix.defaultAccount`, i comandi si rifiutano di effettuare una scelta arbitraria e richiedono di selezionarne uno. Quando E2EE è disabilitato o non disponibile per un account denominato, gli errori indicano la chiave di configurazione di tale account, ad esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, `startupVerification` assume per impostazione predefinita `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, ignorando i duplicati e applicando un intervallo di attesa (24 ore per impostazione predefinita). Regolarlo con `startupVerificationCooldownHours` o disabilitarlo con `startupVerification: "off"`.

    All'avvio viene inoltre eseguito un passaggio conservativo di inizializzazione crittografica, riutilizzando l'archiviazione dei segreti e l'identità di firma incrociata correnti. Se lo stato di inizializzazione è danneggiato, OpenClaw tenta una riparazione controllata anche senza `channels.matrix.password`; se l'homeserver richiede UIA con password, all'avvio viene registrato un avviso senza causare un errore irreversibile. I dispositivi già firmati dal proprietario vengono mantenuti.

    Consultare [Migrazione di Matrix](/it/channels/matrix-migration) per il flusso di aggiornamento completo.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica gli avvisi sul ciclo di vita della verifica nella stanza rigorosa di verifica tramite messaggi diretti sotto forma di messaggi `m.notice`: richiesta, disponibilità (con le istruzioni "Verify by emoji"), avvio/completamento e dettagli SAS (emoji/decimali), quando disponibili.

    Le richieste in entrata da un altro client Matrix vengono monitorate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato non appena la verifica tramite emoji è disponibile; è comunque necessario confrontare e confermare "They match" nel proprio client Matrix.

    Gli avvisi di sistema relativi alla verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Dispositivo Matrix eliminato o non valido">
    Se `verify status` indica che il dispositivo corrente non è più elencato nell'homeserver, creare un nuovo dispositivo Matrix di OpenClaw. Per l'accesso con password:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Per l'autenticazione tramite token, creare un nuovo token di accesso nel client Matrix o nell'interfaccia di amministrazione, quindi aggiornare OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Sostituire `assistant` con l'ID account del comando non riuscito oppure omettere `--account` per l'account predefinito.

  </Accordion>

  <Accordion title="Igiene dei dispositivi">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elencarli e rimuovere quelli obsoleti:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Archivio crittografico">
    La crittografia E2EE di Matrix usa il percorso crittografico Rust ufficiale `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico viene conservato in `crypto-idb-snapshot.json` (con autorizzazioni restrittive per i file).

    Lo stato di runtime crittografato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include l'archivio di sincronizzazione, l'archivio crittografico, la chiave di recupero, lo snapshot IDB, le associazioni dei thread e lo stato di verifica all'avvio. Quando il token cambia ma l'identità dell'account rimane la stessa, OpenClaw riutilizza la migliore radice esistente, in modo che lo stato precedente rimanga visibile.

    Una singola radice precedente basata sull'hash del token può costituire un normale percorso di continuità per la rotazione del token. Se OpenClaw registra `matrix: multiple populated token-hash storage roots detected`, esaminare la directory dell'account e archiviare le radici parallele obsolete solo dopo aver confermato che la radice attiva selezionata sia integra. È preferibile spostare le radici obsolete in una directory `_archive/` anziché eliminarle immediatamente.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Passare entrambe le opzioni in un'unica chiamata. Matrix accetta direttamente gli URL avatar `mxc://`; passando `http://`/`https://`, il file viene prima caricato e l'URL `mxc://` risolto viene memorizzato in `channels.matrix.avatarUrl` (o nella sostituzione specifica dell'account).

## Thread

Matrix supporta i thread nativi sia per le risposte automatiche sia per gli invii tramite lo strumento di messaggistica. Il comportamento è controllato da due impostazioni indipendenti:

### Instradamento delle sessioni (`sessionScope`)

`dm.sessionScope` determina come le stanze dei messaggi diretti Matrix vengono associate alle sessioni OpenClaw:

- `"per-user"` (predefinito): tutte le stanze dei messaggi diretti con lo stesso interlocutore instradato condividono una sessione.
- `"per-room"`: ogni stanza dei messaggi diretti Matrix ottiene una propria chiave di sessione, anche per lo stesso interlocutore.

Le associazioni esplicite delle conversazioni hanno sempre la precedenza su `sessionScope`; le stanze e i thread associati mantengono la sessione di destinazione scelta.

### Risposte nei thread (`threadReplies`)

`threadReplies` determina dove il bot pubblica la propria risposta:

- `"off"`: le risposte sono di primo livello. I messaggi in entrata appartenenti a thread rimangono nella sessione principale.
- `"inbound"`: risponde all'interno di un thread solo quando il messaggio in entrata apparteneva già a quel thread.
- `"always"`: risponde all'interno di un thread la cui radice è il messaggio di attivazione; dal primo evento di attivazione in poi, la conversazione viene instradata tramite una sessione corrispondente con ambito limitato al thread.

`dm.threadReplies` sostituisce questa impostazione solo per i messaggi diretti; ad esempio, consente di mantenere isolati i thread delle stanze lasciando invece i messaggi diretti senza thread.

### Ereditarietà dei thread e comandi slash

- I messaggi in entrata appartenenti a thread includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii tramite lo strumento di messaggistica ereditano automaticamente il thread Matrix corrente quando sono destinati alla stessa stanza (o allo stesso utente di messaggistica diretta), a meno che non venga fornito esplicitamente `threadId`.
- Il riutilizzo della destinazione utente nei messaggi diretti si attiva solo quando i metadati della sessione corrente attestano lo stesso interlocutore di messaggistica diretta sullo stesso account Matrix; in caso contrario, OpenClaw torna al normale instradamento con ambito utente.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` associato al thread funzionano tutti nelle stanze e nei messaggi diretti Matrix.
- `/focus` al primo livello crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSessions` è abilitato.
- L'esecuzione di `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa direttamente quel thread.

Quando OpenClaw rileva che una stanza di messaggistica diretta Matrix entra in conflitto con un'altra stanza di messaggistica diretta nella stessa sessione condivisa, pubblica una notifica una tantum `m.notice` che rimanda alla via d'uscita `/focus` e suggerisce una modifica a `dm.sessionScope`. La notifica appare solo quando le associazioni dei thread sono abilitate.

## Associazioni delle conversazioni ACP

Le stanze, i messaggi diretti e i thread Matrix esistenti possono diventare spazi di lavoro ACP persistenti senza modificare l'interfaccia di chat.

Flusso operativo rapido:

- Eseguire `/acp spawn codex --bind here` all'interno del messaggio diretto, della stanza o del thread esistente di Matrix per continuare a utilizzarlo.
- In un messaggio diretto o in una stanza di primo livello, il messaggio diretto o la stanza corrente rimane l'interfaccia di chat e i messaggi futuri vengono instradati alla sessione ACP avviata.
- All'interno di un thread esistente, `--bind here` associa direttamente il thread corrente.
- `/new` e `/reset` reimpostano direttamente la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

`--bind here` non crea un thread Matrix figlio. `threadBindings.spawnSessions` controlla `/acp spawn --thread auto|here`, nei casi in cui OpenClaw debba creare o associare un thread figlio.

### Configurazione delle associazioni dei thread

Matrix eredita le impostazioni predefinite globali da `session.threadBindings` e supporta sostituzioni specifiche per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: controlla sia l'avvio di thread di sottoagenti sia quello di thread ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: sostituzioni più specifiche rispettivamente per l'avvio di soli sottoagenti o di sole sessioni ACP.
- `threadBindings.defaultSpawnContext`

Per impostazione predefinita, l'avvio di sessioni Matrix associate a thread è abilitato. Impostare `threadBindings.spawnSessions: false` per impedire a `/focus` e `/acp spawn --thread auto|here` di primo livello di creare o associare thread Matrix. Impostare `threadBindings.defaultSpawnContext: "isolated"` quando l'avvio nativo di thread di sottoagenti non deve creare una diramazione della trascrizione principale.

## Reazioni

Matrix supporta le reazioni in uscita, le notifiche delle reazioni in entrata e le reazioni di conferma.

Gli strumenti per le reazioni in uscita sono controllati da `channels.matrix.actions.reactions`:

- `react` aggiunge una reazione a un evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix.
- `emoji=""` rimuove le reazioni del bot su quell'evento.
- `remove: true` rimuove dal bot solo la reazione con l'emoji specificata.

**Ordine di risoluzione** (ha la precedenza il primo valore definito):

| Impostazione                 | Ordine                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | per account -> canale -> `messages.ackReaction` -> ripiego sull'emoji dell'identità dell'agente   |
| `ackReactionScope`      | per account -> canale -> `messages.ackReactionScope` -> valore predefinito `"group-mentions"` |
| `reactionNotifications` | per account -> canale -> valore predefinito `"own"`                                           |

`reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando hanno come destinazione messaggi Matrix creati dal bot; `"off"` disabilita gli eventi di sistema relativi alle reazioni. Le rimozioni delle reazioni non vengono sintetizzate come eventi di sistema: Matrix le presenta come oscuramenti, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio della stanza attiva l'agente. Utilizza come ripiego `messages.groupChat.historyLimit`; il valore predefinito effettivo è `0` se entrambi non sono impostati (funzionalità disabilitata).
- La cronologia delle stanze Matrix è limitata alla stanza; i messaggi diretti continuano a utilizzare la normale cronologia della sessione.
- La cronologia della stanza include solo i messaggi in sospeso: OpenClaw memorizza temporaneamente i messaggi della stanza che non hanno ancora attivato una risposta, quindi acquisisce uno snapshot di tale finestra quando arriva una menzione o un altro evento di attivazione.
- Il messaggio di attivazione corrente non è incluso in `InboundHistory`; per quel turno rimane nel corpo principale del messaggio in entrata.
- I nuovi tentativi dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia anziché avanzare verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, ad esempio il testo recuperato delle risposte, le radici dei thread e la cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare limitandolo ai mittenti consentiti dai controlli attivi dell'elenco consentiti della stanza o degli utenti.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma conserva comunque una risposta citata esplicitamente.

Questo influisce solo sulla visibilità del contesto supplementare, non sulla possibilità che il messaggio in entrata attivi una risposta. L'autorizzazione all'attivazione continua a derivare da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri per i messaggi diretti.

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

Per disattivare completamente i messaggi diretti mantenendo operative le stanze, impostare `dm.enabled: false`:

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

Consultare [Gruppi](/it/channels/groups) per il comportamento del requisito di menzione e dell'elenco consentiti.

Esempio di associazione per i messaggi diretti Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviare messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di associazione in sospeso e, dopo un breve periodo di attesa, può inviare una risposta di promemoria anziché generare un nuovo codice.

Consultare [Associazione](/it/channels/pairing) per il flusso condiviso di associazione dei messaggi diretti e la struttura di archiviazione.

## Riparazione delle stanze dirette

Se lo stato dei messaggi diretti diventa incoerente, OpenClaw può ritrovarsi con associazioni `m.direct` obsolete che puntano a vecchie stanze individuali anziché al messaggio diretto attivo. Esaminare l'associazione corrente di un interlocutore:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Ripararla:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Entrambi i comandi accettano `--account <id>` per le configurazioni con più account. Il flusso di riparazione:

- preferisce una conversazione diretta rigorosamente 1:1 già associata in `m.direct`
- utilizza come ripiego qualsiasi conversazione diretta rigorosamente 1:1 attualmente attiva con tale utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcuna conversazione diretta integra

Non elimina automaticamente le vecchie stanze. Seleziona la conversazione diretta integra e aggiorna l'associazione, affinché i futuri invii Matrix, le notifiche di verifica e gli altri flussi di messaggistica diretta siano destinati alla stanza corretta.

## Approvazioni dell'esecuzione

Matrix può fungere da client di approvazione nativo. Configurare in `channels.matrix.execApprovals` (o `channels.matrix.accounts.<account>.execApprovals` per una sostituzione specifica dell'account):

- `enabled`: recapita le approvazioni tramite richieste native di Matrix. Se non impostato o se impostato su `"auto"`, si abilita automaticamente non appena è possibile individuare almeno un responsabile dell'approvazione; impostare `false` per disabilitarlo esplicitamente.
- `approvers`: ID utente Matrix (`@owner:example.org`) autorizzati ad approvare le richieste di esecuzione. Utilizza come ripiego `channels.matrix.dm.allowFrom`.
- `target`: destinazione delle richieste. `"dm"` (predefinito) le invia ai messaggi diretti dei responsabili dell'approvazione; `"channel"` le invia alla stanza o al messaggio diretto di origine; `"both"` le invia a entrambi.
- `agentFilter` / `sessionFilter`: elenchi consentiti facoltativi che specificano quali agenti o sessioni attivano il recapito tramite Matrix.

L'autorizzazione varia leggermente tra i tipi di approvazione:

- Le **approvazioni dell'esecuzione** utilizzano `execApprovals.approvers`, con ripiego su `dm.allowFrom`.
- Le **approvazioni dei Plugin** vengono autorizzate esclusivamente tramite `dm.allowFrom`.

Entrambi i tipi condividono le scorciatoie di reazione di Matrix e gli aggiornamenti dei messaggi. Gli approvatori vedono le scorciatoie di reazione sul messaggio di approvazione principale:

- ✅ consenti una volta
- ❌ nega
- ♾️ consenti sempre (quando i criteri effettivi di esecuzione lo consentono)

Comandi slash di ripiego: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Solo gli approvatori identificati possono approvare o negare. L'invio nel canale delle approvazioni di esecuzione include il testo del comando: abilitare `channel` o `both` solo nelle stanze attendibili.

Correlato: [Approvazioni di esecuzione](/it/tools/exec-approvals).

## Comandi slash

I comandi slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, ecc.) funzionano direttamente nei messaggi diretti. Nelle stanze, OpenClaw riconosce anche i comandi preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza un'espressione regolare personalizzata per le menzioni: in questo modo il bot continua a rispondere ai messaggi in stile stanza `@mention /command` generati da Element e client simili quando un utente completa tramite tabulazione il nome del bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare gli stessi criteri del proprietario o della lista consentita per i messaggi diretti o le stanze previsti per i messaggi normali.

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

- I valori `channels.matrix` di primo livello fungono da valori predefiniti per gli account denominati, salvo sostituzione da parte di un account.
- Limitare una voce di stanza ereditata a un account specifico con `groups.<room>.account`. Le voci senza `account` sono condivise tra gli account; `account: "default"` continua a funzionare quando l'account predefinito è configurato al primo livello.

**Selezione dell'account predefinito:**

- Impostare `defaultAccount` per scegliere l'account denominato preferito dal routing implicito, dalle verifiche e dai comandi CLI.
- Se sono presenti più account e uno è denominato letteralmente `default`, OpenClaw lo utilizza implicitamente anche quando `defaultAccount` non è impostato.
- Con più account denominati e nessun account predefinito selezionato, i comandi CLI non effettuano scelte arbitrarie: impostare `defaultAccount` o passare `--account <id>`.
- Il blocco di primo livello `channels.matrix.*` viene considerato l'account implicito `default` solo quando la relativa autenticazione è completa (`homeserver` + `accessToken`, oppure `homeserver` + `userId` + `password`). Gli account denominati restano individuabili tramite `homeserver` + `userId` quando le credenziali memorizzate nella cache coprono l'autenticazione.

**Promozione:**

- Quando OpenClaw promuove una configurazione con account singolo a una configurazione con più account durante la riparazione o la configurazione, mantiene l'account denominato esistente, se presente, oppure quello già indicato da `defaultAccount`. Solo le chiavi di autenticazione/bootstrap di Matrix vengono spostate nell'account promosso; le chiavi condivise dei criteri di invio restano al primo livello.

Consultare il [riferimento per la configurazione](/it/gateway/config-channels#multi-account-all-channels) per il modello condiviso con più account.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per proteggere dagli attacchi SSRF, a meno che non vengano autorizzati esplicitamente per ciascun account.

Se l'homeserver viene eseguito su localhost, su un IP LAN/Tailscale o su un nome host interno, abilitare `network.dangerouslyAllowPrivateNetwork` per tale account:

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

Questa autorizzazione esplicita consente solo destinazioni private/interne attendibili. Gli homeserver pubblici non cifrati, come `http://matrix.example.org:8008`, restano bloccati. Preferire `https://` quando possibile.

## Traffico Matrix tramite proxy

Se la distribuzione Matrix richiede un proxy HTTP(S) in uscita esplicito, impostare `channels.matrix.proxy`:

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

Gli account denominati possono sostituire il valore predefinito di primo livello con `channels.matrix.accounts.<id>.proxy`. OpenClaw usa la stessa impostazione del proxy per il traffico Matrix in fase di esecuzione e per le verifiche dello stato degli account.

## Risoluzione delle destinazioni

Matrix accetta le seguenti forme di destinazione ovunque OpenClaw richieda come destinazione una stanza o un utente:

- Utenti: `@user:server`, `user:@user:server` o `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` o `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` o `matrix:channel:#alias:server`

Gli ID delle stanze Matrix distinguono tra maiuscole e minuscole. Quando si configurano destinazioni di invio esplicite, processi Cron, associazioni o liste consentite, usare esattamente le maiuscole e minuscole dell'ID stanza fornite da Matrix. OpenClaw mantiene canoniche le chiavi interne delle sessioni per l'archiviazione, pertanto tali chiavi in minuscolo non sono una fonte affidabile per gli ID di invio Matrix.

La ricerca in tempo reale nella directory usa l'account Matrix connesso:

- Le ricerche degli utenti interrogano la directory utenti di Matrix su tale homeserver.
- Le ricerche delle stanze accettano direttamente ID e alias espliciti delle stanze. La ricerca per nome tra le stanze a cui si è effettuato l'accesso viene eseguita senza garanzia di successo e si applica solo alle liste consentite delle stanze in fase di esecuzione quando è impostato `dangerouslyAllowNameMatching: true`.
- Se il nome di una stanza non può essere risolto in un ID o un alias, viene ignorato dalla risoluzione della lista consentita in fase di esecuzione.

## Riferimento per la configurazione

I campi utente di tipo lista consentita (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) accettano ID utente Matrix completi, che rappresentano l'opzione più sicura. Per impostazione predefinita, le voci che non sono ID vengono ignorate. Se è impostato `dangerouslyAllowNameMatching: true`, le corrispondenze esatte con i nomi visualizzati nella directory Matrix vengono risolte all'avvio e ogni volta che la lista consentita cambia mentre il monitor è in esecuzione; le voci non risolvibili vengono ignorate in fase di esecuzione.

Le chiavi della lista consentita delle stanze (`groups`, il precedente `rooms`) devono essere ID o alias delle stanze. Per impostazione predefinita, le chiavi contenenti semplici nomi di stanze vengono ignorate; `dangerouslyAllowNameMatching: true` ripristina la ricerca senza garanzia di successo tra i nomi delle stanze a cui si è effettuato l'accesso.

### Account e connessione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta visualizzata facoltativa per l'account.
- `defaultAccount`: ID dell'account preferito quando sono configurati più account Matrix.
- `accounts`: sostituzioni denominate per account. I valori `channels.matrix` di primo livello vengono ereditati come valori predefiniti.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account di connettersi a `localhost`, a IP LAN/Tailscale o a nomi host interni.
- `proxy`: URL facoltativo del proxy HTTP(S) per il traffico Matrix. È supportata la sostituzione per account.
- `userId`: ID utente Matrix completo (`@bot:example.org`).
- `accessToken`: token di accesso per l'autenticazione basata su token. Sono supportati valori in testo non cifrato e SecretRef tramite provider env/file/exec ([Gestione dei segreti](/it/gateway/secrets)).
- `password`: password per l'accesso basato su password. Sono supportati valori in testo non cifrato e SecretRef.
- `deviceId`: ID esplicito del dispositivo Matrix.
- `deviceName`: nome visualizzato del dispositivo usato al momento dell'accesso con password.
- `avatarUrl`: URL memorizzato dell'avatar personale per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.

### Cifratura

- `encryption`: abilita E2EE. Valore predefinito: `false`.
- `startupVerification`: `"if-unverified"` (valore predefinito quando E2EE è attivo) o `"off"`. Richiede automaticamente l'autoverifica all'avvio quando questo dispositivo non è verificato.
- `startupVerificationCooldownHours`: intervallo di attesa prima della successiva richiesta automatica all'avvio. Valore predefinito: `24`.

### Accesso e criteri

- `groupPolicy`: `"open"`, `"allowlist"` o `"disabled"`. Valore predefinito: `"allowlist"`.
- `groupAllowFrom`: lista consentita di ID utente per il traffico delle stanze.
- `mentionPatterns`: modelli di espressioni regolari con ambito definito per le menzioni nelle stanze. Oggetto con `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Determina se i valori `agents.list[].groupChat.mentionPatterns` configurati si applicano per singola stanza.
- `dm.enabled`: quando è `false`, ignora tutti i messaggi diretti. Valore predefinito: `true`.
- `dm.policy`: `"pairing"` (valore predefinito), `"allowlist"`, `"open"` o `"disabled"`. Si applica dopo che il bot ha effettuato l'accesso e classificato la stanza come messaggio diretto; non influisce sulla gestione degli inviti.
- `dm.allowFrom`: lista consentita di ID utente per il traffico dei messaggi diretti.
- `dm.sessionScope`: `"per-user"` (valore predefinito) o `"per-room"`.
- `dm.threadReplies`: sostituzione valida solo per i messaggi diretti relativa alle risposte in thread (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: accetta messaggi da altri account bot Matrix configurati (`true` o `"mentions"`).
- `allowlistOnly`: quando è `true`, imposta su `"allowlist"` tutti i criteri attivi per i messaggi diretti (eccetto `"disabled"`) e i criteri di gruppo `"open"`. Non modifica i criteri `"disabled"`.
- `dangerouslyAllowNameMatching`: quando è `true`, consente la ricerca nella directory dei nomi visualizzati di Matrix per le voci della lista consentita degli utenti e la ricerca per nome tra le stanze a cui si è effettuato l'accesso per le chiavi della lista consentita delle stanze. Preferire ID `@user:server` completi e ID o alias delle stanze.
- `autoJoin`: `"always"`, `"allowlist"` o `"off"`. Valore predefinito: `"off"`. Si applica a ogni invito Matrix, inclusi quelli in stile messaggio diretto.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `"allowlist"`. Le voci degli alias vengono risolte rispetto all'homeserver, non rispetto allo stato dichiarato dalla stanza invitante.
- `contextVisibility`: visibilità del contesto supplementare (`"all"` come valore predefinito, `"allowlist"`, `"allowlist_quote"`).

### Comportamento delle risposte

- `replyToMode`: `"off"` (predefinito), `"first"`, `"all"` o `"batched"`.
- `threadReplies`: `"off"` (il valore predefinito di primo livello viene risolto in `"inbound"`, salvo impostazione esplicita), `"inbound"` o `"always"`.
- `threadBindings`: sostituzioni specifiche per canale per l'instradamento e il ciclo di vita delle sessioni associate ai thread.
- `streaming`: oggetto annidato `{ mode, chunkMode, block: { enabled, coalesce }, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `mode` è `"off"` (predefinito), `"partial"`, `"quiet"` o `"progress"`. Le forme scalari/booleane precedenti vengono migrate tramite `openclaw doctor --fix`.
- `streaming.block.enabled`: quando `true`, i blocchi completati dell'assistente vengono mantenuti come messaggi di avanzamento separati. Valore predefinito: `false`.
- `markdown`: configurazione facoltativa per il rendering Markdown del testo in uscita.
- `responsePrefix`: stringa facoltativa anteposta alle risposte in uscita.
- `textChunkLimit`: dimensione in caratteri dei blocchi in uscita quando `streaming.chunkMode: "length"`. Valore predefinito: `4000`.
- `streaming.chunkMode`: `"length"` (predefinito, suddivide in base al numero di caratteri) o `"newline"` (suddivide in corrispondenza dei limiti di riga).
- `historyLimit`: numero di messaggi recenti della stanza inclusi come `InboundHistory` quando un messaggio della stanza attiva l'agente. In assenza di un valore, usa `messages.groupChat.historyLimit`; valore predefinito effettivo `0` (disabilitato).
- `mediaMaxMb`: limite delle dimensioni dei contenuti multimediali in MB per gli invii in uscita e l'elaborazione in entrata. Valore predefinito: `20`.

### Impostazioni delle reazioni

- `ackReaction`: sostituzione della reazione di conferma per questo canale/account.
- `ackReactionScope`: sostituzione dell'ambito (`"group-mentions"` predefinito, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modalità di notifica delle reazioni in entrata (`"own"` predefinito, `"off"`).

### Strumenti e sostituzioni specifiche per stanza

- `actions`: controllo dell'accesso agli strumenti per singola azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mappa dei criteri specifici per stanza. L'identità della sessione usa l'ID stabile della stanza dopo la risoluzione. (`rooms` è un alias precedente.)
  - `groups.<room>.account`: limita una voce di stanza ereditata a un account specifico.
  - `groups.<room>.enabled`: opzione specifica per stanza. Quando `false`, la stanza viene ignorata come se non fosse presente nella mappa.
  - `groups.<room>.requireMention`: sostituzione specifica per stanza del requisito di menzione a livello di canale.
  - `groups.<room>.allowBots`: sostituzione specifica per stanza dell'impostazione a livello di canale (`true` o `"mentions"`).
  - `groups.<room>.botLoopProtection`: sostituzione specifica per stanza del budget di protezione dai cicli tra bot.
  - `groups.<room>.users`: elenco dei mittenti consentiti specifico per stanza.
  - `groups.<room>.tools`: sostituzioni specifiche per stanza degli strumenti consentiti/negati.
  - `groups.<room>.autoReply`: sostituzione specifica per stanza del controllo basato sulle menzioni. `true` disabilita i requisiti di menzione per tale stanza; `false` li riattiva obbligatoriamente.
  - `groups.<room>.skills`: filtro delle Skills specifico per stanza.
  - `groups.<room>.systemPrompt`: frammento del prompt di sistema specifico per stanza.

### Impostazioni di approvazione dell'esecuzione

- `execApprovals.enabled`: recapita le approvazioni dell'esecuzione tramite prompt nativi di Matrix.
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare. In assenza di un valore, usa `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (predefinito), `"channel"` o `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: elenchi facoltativi di agenti/sessioni consentiti per il recapito.

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo basato sulle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento della sicurezza
