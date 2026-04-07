---
read_when:
    - Configurazione iniziale di Matrix in OpenClaw
    - Configurazione di E2EE e verifica di Matrix
summary: Stato del supporto Matrix, configurazione iniziale ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-04-07T08:14:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d53baa2ea5916cd00a99cae0ded3be41ffa13c9a69e8ea8461eb7baa6a99e13c
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix è il plugin canale Matrix incluso in OpenClaw.
Usa il `matrix-js-sdk` ufficiale e supporta messaggi diretti, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix è distribuito come plugin incluso nelle versioni attuali di OpenClaw, quindi le
build pacchettizzate normali non richiedono un'installazione separata.

Se stai usando una build precedente o un'installazione personalizzata che esclude Matrix, installalo
manualmente:

Installa da npm:

```bash
openclaw plugins install @openclaw/matrix
```

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Vedi [Plugins](/it/tools/plugin) per il comportamento dei plugin e le regole di installazione.

## Configurazione iniziale

1. Assicurati che il plugin Matrix sia disponibile.
   - Le versioni pacchettizzate correnti di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con uno dei seguenti:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il gateway.
5. Avvia un messaggio diretto con il bot o invitalo in una stanza.
   - I nuovi inviti Matrix funzionano solo quando `channels.matrix.autoJoin` lo consente.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

Cosa chiede effettivamente la procedura guidata Matrix:

- URL dell'homeserver
- metodo di autenticazione: token di accesso o password
- ID utente solo quando scegli l'autenticazione con password
- nome dispositivo facoltativo
- se abilitare E2EE
- se configurare ora l'accesso alle stanze Matrix
- se configurare ora l'accesso automatico agli inviti Matrix
- quando l'accesso automatico agli inviti è abilitato, se deve essere `allowlist`, `always` oppure `off`

Comportamenti rilevanti della procedura guidata:

- Se esistono già variabili d'ambiente di autenticazione Matrix per l'account selezionato e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre un collegamento rapido alle variabili d'ambiente così la configurazione può mantenere l'autenticazione nelle variabili d'ambiente invece di copiare i segreti nella configurazione.
- Quando aggiungi un altro account Matrix in modo interattivo, il nome account inserito viene normalizzato nell'ID account usato nella configurazione e nelle variabili d'ambiente. Ad esempio, `Ops Bot` diventa `ops-bot`.
- I prompt della allowlist per i messaggi diretti accettano immediatamente valori completi `@user:server`. I nomi visualizzati funzionano solo quando la ricerca live nella directory trova una singola corrispondenza esatta; altrimenti la procedura guidata ti chiede di riprovare con un ID Matrix completo.
- I prompt della allowlist per le stanze accettano direttamente ID stanza e alias. Possono anche risolvere in tempo reale i nomi delle stanze a cui si è partecipato, ma i nomi non risolti vengono mantenuti solo come digitati durante la configurazione e successivamente ignorati dalla risoluzione runtime della allowlist. Preferisci `!room:server` o `#alias:server`.
- La procedura guidata ora mostra un avviso esplicito prima del passaggio di accesso automatico agli inviti perché `channels.matrix.autoJoin` è impostato per default su `off`; gli agenti non entreranno nelle stanze invitate o nei nuovi inviti in stile DM a meno che tu non lo imposti.
- In modalità allowlist per l'accesso automatico agli inviti, usa solo destinazioni di invito stabili: `!roomId:server`, `#alias:server` oppure `*`. I nomi semplici delle stanze vengono rifiutati.
- L'identità runtime di stanza/sessione usa l'ID stanza Matrix stabile. Gli alias dichiarati dalla stanza vengono usati solo come input di ricerca, non come chiave di sessione a lungo termine o identità stabile del gruppo.
- Per risolvere i nomi delle stanze prima di salvarli, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` è impostato su `off` per default.

Se lo lasci non impostato, il bot non entrerà nelle stanze invitate o nei nuovi inviti in stile DM, quindi non apparirà in nuovi gruppi o DM invitati a meno che tu non entri manualmente prima.

Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare quali inviti accetta, oppure imposta `autoJoin: "always"` se vuoi che entri in ogni invito.

In modalità `allowlist`, `autoJoinAllowlist` accetta solo `!roomId:server`, `#alias:server` oppure `*`.
</Warning>

Esempio di allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Entra in ogni invito:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

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

Configurazione basata su password (il token viene memorizzato nella cache dopo l'accesso):

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

Matrix memorizza nella cache le credenziali in `~/.openclaw/credentials/matrix/`.
L'account predefinito usa `credentials.json`; gli account con nome usano `credentials-<account>.json`.
Quando lì esistono credenziali in cache, OpenClaw considera Matrix configurato per configurazione iniziale, doctor e rilevamento dello stato del canale anche se l'autenticazione corrente non è impostata direttamente nella configurazione.

Equivalenti delle variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Per account non predefiniti, usa variabili d'ambiente con ambito account:

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

Matrix esegue l'escape della punteggiatura negli ID account per mantenere le variabili d'ambiente con ambito account prive di collisioni.
Ad esempio, `-` diventa `_X2D_`, quindi `ops-prod` viene mappato su `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre il collegamento rapido alle variabili d'ambiente solo quando quelle variabili d'ambiente di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

## Esempio di configurazione

Questa è una configurazione di base pratica con pairing DM, allowlist delle stanze ed E2EE abilitato:

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

`autoJoin` si applica agli inviti Matrix in generale, non solo agli inviti a stanze/gruppi.
Questo include i nuovi inviti in stile DM. Al momento dell'invito, OpenClaw non sa in modo affidabile se la
stanza invitata finirà per essere trattata come DM o come gruppo, quindi tutti gli inviti passano prima
attraverso la stessa decisione `autoJoin`. `dm.policy` continua ad applicarsi dopo che il bot è entrato e la stanza è
classificata come DM, quindi `autoJoin` controlla il comportamento di ingresso mentre `dm.policy` controlla il comportamento di risposta/accesso.

## Anteprime di streaming

Lo streaming delle risposte Matrix è opzionale.

Imposta `channels.matrix.streaming` su `"partial"` quando vuoi che OpenClaw invii una singola anteprima live
della risposta, modifichi quell'anteprima sul posto mentre il modello genera testo e poi la finalizzi quando la
risposta è completata:

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
- `streaming: "partial"` crea un messaggio di anteprima modificabile per il blocco corrente dell'assistente usando normali messaggi di testo Matrix. Questo preserva il comportamento legacy di notifica basato sulla prima anteprima di Matrix, quindi i client standard possono notificare sul primo testo dell'anteprima in streaming invece che sul blocco completato.
- `streaming: "quiet"` crea un'anteprima silenziosa modificabile per il blocco corrente dell'assistente. Usalo solo quando configuri anche le regole push dei destinatari per le modifiche finalizzate dell'anteprima.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con lo streaming delle anteprime abilitato, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando lo streaming delle anteprime è attivo e `blockStreaming` è disattivato, Matrix modifica la bozza live sul posto e finalizza quello stesso evento quando il blocco o il turno termina.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming dell'anteprima e torna alla normale consegna finale.
- Le risposte multimediali inviano comunque normalmente gli allegati. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Le modifiche delle anteprime comportano chiamate aggiuntive alle API Matrix. Lascia lo streaming disattivato se vuoi il comportamento più conservativo rispetto ai limiti di frequenza.

`blockStreaming` non abilita da solo le anteprime bozza.
Usa `streaming: "partial"` o `streaming: "quiet"` per le modifiche delle anteprime; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi completati dell'assistente restino visibili come messaggi di avanzamento separati.

Se ti servono le notifiche standard di Matrix senza regole push personalizzate, usa `streaming: "partial"` per un comportamento basato sulla prima anteprima oppure lascia `streaming` disattivato per la sola consegna finale. Con `streaming: "off"`:

- `blockStreaming: true` invia ogni blocco completato come normale messaggio Matrix con notifica.
- `blockStreaming: false` invia solo la risposta finale completata come normale messaggio Matrix con notifica.

### Regole push self-hosted per anteprime silenziose finalizzate

Se gestisci la tua infrastruttura Matrix e vuoi che le anteprime silenziose notifichino solo quando un blocco o la
risposta finale sono completati, imposta `streaming: "quiet"` e aggiungi una regola push per utente per le modifiche di anteprima finalizzate.

Di solito si tratta di una configurazione dell'utente destinatario, non di una modifica di configurazione globale dell'homeserver:

Mappa rapida prima di iniziare:

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix OpenClaw che invia la risposta
- usa il token di accesso dell'utente destinatario per le chiamate API qui sotto
- nella regola push fai corrispondere `sender` al MXID completo dell'utente bot

1. Configura OpenClaw per usare anteprime silenziose:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Assicurati che l'account destinatario riceva già le normali notifiche push di Matrix. Le regole
   per le anteprime silenziose funzionano solo se quell'utente ha già pusher/dispositivi funzionanti.

3. Ottieni il token di accesso dell'utente destinatario.
   - Usa il token dell'utente che riceve, non quello del bot.
   - Riutilizzare un token di sessione client esistente è di solito la soluzione più semplice.
   - Se devi generare un nuovo token, puoi accedere tramite l'API standard Client-Server di Matrix:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Verifica che l'account destinatario abbia già dei pusher:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se questo non restituisce pusher/dispositivi attivi, correggi prima le normali notifiche Matrix prima di aggiungere
la regola OpenClaw sotto.

OpenClaw contrassegna le modifiche di anteprima finalizzate di solo testo con:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Crea una regola push di override per ogni account destinatario che deve ricevere queste notifiche:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Sostituisci questi valori prima di eseguire il comando:

- `https://matrix.example.org`: URL base del tuo homeserver
- `$USER_ACCESS_TOKEN`: token di accesso dell'utente ricevente
- `openclaw-finalized-preview-botname`: un ID regola univoco per questo bot per questo utente ricevente
- `@bot:example.org`: il MXID del tuo bot Matrix OpenClaw, non il MXID dell'utente ricevente

Importante per configurazioni multi-bot:

- Le regole push sono indicizzate da `ruleId`. Eseguire di nuovo `PUT` sullo stesso ID regola aggiorna quella stessa regola.
- Se un utente ricevente deve notificare per più account bot Matrix OpenClaw, crea una regola per bot con un ID regola univoco per ogni corrispondenza di sender.
- Un modello semplice è `openclaw-finalized-preview-<botname>`, ad esempio `openclaw-finalized-preview-ops` oppure `openclaw-finalized-preview-support`.

La regola viene valutata rispetto al mittente dell'evento:

- autenticati con il token dell'utente ricevente
- fai corrispondere `sender` al MXID del bot OpenClaw

6. Verifica che la regola esista:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Prova una risposta in streaming. In modalità silenziosa, la stanza dovrebbe mostrare una bozza di anteprima silenziosa e la
   modifica finale sul posto dovrebbe notificare una volta completato il blocco o il turno.

Se devi rimuovere la regola in seguito, elimina quello stesso ID regola con il token dell'utente ricevente:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Note:

- Crea la regola con il token di accesso dell'utente ricevente, non con quello del bot.
- Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite, quindi non è necessario alcun parametro di ordinamento aggiuntivo.
- Questo influisce solo sulle modifiche di anteprima di solo testo che OpenClaw può finalizzare in sicurezza sul posto. I fallback multimediali e i fallback per anteprime obsolete usano comunque la normale consegna Matrix.
- Se `GET /_matrix/client/v3/pushers` non mostra pusher, l'utente non ha ancora una consegna push Matrix funzionante per questo account/dispositivo.

#### Synapse

Per Synapse, la configurazione sopra di solito è sufficiente da sola:

- Non è richiesta alcuna modifica speciale a `homeserver.yaml` per le notifiche delle anteprime OpenClaw finalizzate.
- Se la tua distribuzione Synapse invia già le normali notifiche push Matrix, il token utente + la chiamata `pushrules` sopra sono il passaggio principale della configurazione.
- Se esegui Synapse dietro un reverse proxy o worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse.
- Se esegui worker Synapse, assicurati che i pusher siano integri. La consegna push è gestita dal processo principale o da `synapse.app.pusher` / worker pusher configurati.

#### Tuwunel

Per Tuwunel, usa lo stesso flusso di configurazione e la stessa chiamata API `pushrules` mostrata sopra:

- Non è richiesta alcuna configurazione specifica di Tuwunel per il marcatore di anteprima finalizzata in sé.
- Se le normali notifiche Matrix funzionano già per quell'utente, il token utente + la chiamata `pushrules` sopra sono il passaggio principale della configurazione.
- Se le notifiche sembrano sparire mentre l'utente è attivo su un altro dispositivo, verifica se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione in Tuwunel 1.4.2 il 12 settembre 2025, e può sopprimere intenzionalmente le notifiche push verso altri dispositivi mentre un dispositivo è attivo.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` così le anteprime immagine vengono crittografate insieme all'allegato completo. Le stanze non crittografate usano ancora il semplice `thumbnail_url`. Non è richiesta alcuna configurazione: il plugin rileva automaticamente lo stato E2EE.

### Stanze bot-to-bot

Per default, i messaggi Matrix provenienti da altri account Matrix OpenClaw configurati vengono ignorati.

Usa `allowBots` quando vuoi intenzionalmente traffico Matrix inter-agente:

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
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello account per una stanza.
- OpenClaw continua a ignorare i messaggi dello stesso ID utente Matrix per evitare cicli di auto-risposta.
- Matrix qui non espone un flag bot nativo; OpenClaw tratta "scritto da bot" come "inviato da un altro account Matrix configurato su questo gateway OpenClaw".

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

Includi la chiave di ripristino memorizzata nell'output leggibile da macchina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inizializza cross-signing e stato di verifica:

```bash
openclaw matrix verify bootstrap
```

Supporto multi-account: usa `channels.matrix.accounts` con credenziali per account e `name` facoltativo. Vedi [Riferimento configurazione](/it/gateway/configuration-reference#multi-account-all-channels) per il modello condiviso.

Diagnostica dettagliata del bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forza un nuovo reset dell'identità di cross-signing prima del bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Verifica questo dispositivo con una chiave di ripristino:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Dettagli dettagliati della verifica del dispositivo:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Controlla lo stato di integrità del backup delle chiavi stanza:

```bash
openclaw matrix verify backup status
```

Diagnostica dettagliata dello stato di integrità del backup:

```bash
openclaw matrix verify backup status --verbose
```

Ripristina le chiavi stanza dal backup sul server:

```bash
openclaw matrix verify backup restore
```

Diagnostica dettagliata del ripristino:

```bash
openclaw matrix verify backup restore --verbose
```

Elimina il backup server corrente e crea una nuova baseline di backup. Se la chiave di
backup memorizzata non può essere caricata in modo pulito, questo reset può anche ricreare l'archiviazione segreta così
i futuri avvii a freddo potranno caricare la nuova chiave di backup:

```bash
openclaw matrix verify backup reset --yes
```

Tutti i comandi `verify` sono concisi per default (incluso il logging interno SDK silenzioso) e mostrano diagnostica dettagliata solo con `--verbose`.
Usa `--json` per un output completo leggibile da macchina negli script.

Nelle configurazioni multi-account, i comandi CLI Matrix usano l'account predefinito implicito di Matrix a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount` oppure quelle operazioni CLI implicite si fermeranno e ti chiederanno di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che operazioni di verifica o sui dispositivi prendano esplicitamente di mira un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

### Cosa significa "verified"

OpenClaw considera questo dispositivo Matrix verificato solo quando viene verificato dalla tua stessa identità di cross-signing.
In pratica, `openclaw matrix verify status --verbose` espone tre segnali di attendibilità:

- `Locally trusted`: questo dispositivo è attendibile solo per il client corrente
- `Cross-signing verified`: l'SDK segnala il dispositivo come verificato tramite cross-signing
- `Signed by owner`: il dispositivo è firmato dalla tua stessa chiave self-signing

`Verified by owner` diventa `yes` solo quando è presente la verifica tramite cross-signing o la firma del proprietario.
La sola attendibilità locale non è sufficiente perché OpenClaw tratti il dispositivo come completamente verificato.

### Cosa fa bootstrap

`openclaw matrix verify bootstrap` è il comando di riparazione e configurazione per gli account Matrix crittografati.
Esegue tutto quanto segue in questo ordine:

- inizializza l'archiviazione segreta, riutilizzando una chiave di ripristino esistente quando possibile
- inizializza il cross-signing e carica le chiavi pubbliche di cross-signing mancanti
- tenta di contrassegnare e firmare tramite cross-signing il dispositivo corrente
- crea un nuovo backup lato server delle chiavi stanza se non ne esiste già uno

Se l'homeserver richiede autenticazione interattiva per caricare le chiavi di cross-signing, OpenClaw prova prima il caricamento senza autenticazione, poi con `m.login.dummy`, quindi con `m.login.password` quando `channels.matrix.password` è configurato.

Usa `--force-reset-cross-signing` solo quando vuoi intenzionalmente eliminare l'identità di cross-signing corrente e crearne una nuova.

Se vuoi intenzionalmente eliminare il backup corrente delle chiavi stanza e avviare una nuova
baseline di backup per i messaggi futuri, usa `openclaw matrix verify backup reset --yes`.
Fallo solo se accetti che la cronologia crittografata precedente irrecuperabile resterà
non disponibile e che OpenClaw potrebbe ricreare l'archiviazione segreta se l'attuale segreto di backup
non può essere caricato in sicurezza.

### Nuova baseline di backup

Se vuoi mantenere funzionanti i futuri messaggi crittografati e accetti di perdere la vecchia cronologia irrecuperabile, esegui questi comandi in ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Aggiungi `--account <id>` a ogni comando quando vuoi prendere esplicitamente di mira un account Matrix con nome.

### Comportamento all'avvio

Quando `encryption: true`, Matrix imposta `startupVerification` su `"if-unverified"` per default.
All'avvio, se questo dispositivo non è ancora verificato, Matrix richiederà l'auto-verifica in un altro client Matrix,
salterà richieste duplicate quando una è già in sospeso e applicherà un cooldown locale prima di riprovare dopo i riavvii.
I tentativi di richiesta falliti vengono ritentati prima rispetto alla creazione riuscita della richiesta per default.
Imposta `startupVerification: "off"` per disabilitare le richieste automatiche all'avvio, oppure regola `startupVerificationCooldownHours`
se vuoi una finestra di ritentativo più breve o più lunga.

All'avvio viene anche eseguito automaticamente un passaggio conservativo di bootstrap crittografico.
Quel passaggio prova prima a riutilizzare l'archiviazione segreta corrente e l'identità di cross-signing corrente, ed evita di reimpostare il cross-signing a meno che tu non esegua un flusso esplicito di riparazione bootstrap.

Se all'avvio viene rilevato uno stato bootstrap danneggiato e `channels.matrix.password` è configurato, OpenClaw può tentare un percorso di riparazione più rigoroso.
Se il dispositivo corrente è già firmato dal proprietario, OpenClaw preserva quell'identità invece di reimpostarla automaticamente.

Aggiornamento dal precedente plugin Matrix pubblico:

- OpenClaw riutilizza automaticamente, quando possibile, lo stesso account Matrix, token di accesso e identità dispositivo.
- Prima che vengano eseguite modifiche di migrazione Matrix attuabili, OpenClaw crea o riutilizza uno snapshot di ripristino in `~/Backups/openclaw-migrations/`.
- Se usi più account Matrix, imposta `channels.matrix.defaultAccount` prima di aggiornare dal vecchio layout flat-store così OpenClaw sa quale account deve ricevere quello stato legacy condiviso.
- Se il plugin precedente memorizzava localmente una chiave di decrittografia del backup delle chiavi stanza Matrix, l'avvio o `openclaw doctor --fix` la importeranno automaticamente nel nuovo flusso di chiavi di ripristino.
- Se il token di accesso Matrix è cambiato dopo che la migrazione era stata preparata, l'avvio ora analizza le radici di archiviazione hash-token adiacenti per stato di ripristino legacy in sospeso prima di rinunciare al ripristino automatico del backup.
- Se il token di accesso Matrix cambia in seguito per lo stesso account, homeserver e utente, OpenClaw ora preferisce riutilizzare la radice hash-token esistente più completa invece di iniziare da una directory di stato Matrix vuota.
- Al successivo avvio del gateway, le chiavi stanza sottoposte a backup vengono ripristinate automaticamente nel nuovo archivio crittografico.
- Se il vecchio plugin aveva chiavi stanza solo locali mai sottoposte a backup, OpenClaw mostrerà un avviso chiaro. Quelle chiavi non possono essere esportate automaticamente dal precedente archivio crittografico rust, quindi parte della vecchia cronologia crittografata potrebbe restare non disponibile finché non viene recuperata manualmente.
- Vedi [Migrazione Matrix](/it/install/migrating-matrix) per il flusso completo di aggiornamento, i limiti, i comandi di ripristino e i messaggi di migrazione più comuni.

Lo stato runtime crittografato è organizzato sotto radici hash-token per account e utente in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Quella directory contiene il sync store (`bot-storage.json`), il crypto store (`crypto/`),
il file della chiave di ripristino (`recovery-key.json`), lo snapshot IndexedDB (`crypto-idb-snapshot.json`),
i binding dei thread (`thread-bindings.json`) e lo stato della verifica all'avvio (`startup-verification.json`)
quando queste funzionalità sono in uso.
Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore radice esistente
per quella tupla account/homeserver/utente così lo stato di sync precedente, lo stato crittografico, i binding dei thread
e lo stato della verifica all'avvio restano visibili.

### Modello del crypto store Node

L'E2EE Matrix in questo plugin usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` in Node.
Quel percorso si aspetta persistenza basata su IndexedDB quando vuoi che lo stato crittografico sopravviva ai riavvii.

OpenClaw attualmente la fornisce in Node tramite:

- uso di `fake-indexeddb` come shim API IndexedDB previsto dall'SDK
- ripristino del contenuto IndexedDB crittografico Rust da `crypto-idb-snapshot.json` prima di `initRustCrypto`
- persistenza del contenuto IndexedDB aggiornato di nuovo in `crypto-idb-snapshot.json` dopo init e durante il runtime
- serializzazione di ripristino e persistenza dello snapshot rispetto a `crypto-idb-snapshot.json` con un lock file advisory così la persistenza runtime del gateway e la manutenzione CLI non entrino in competizione sullo stesso file snapshot

Questa è infrastruttura di compatibilità/archiviazione, non un'implementazione crittografica personalizzata.
Il file snapshot è uno stato runtime sensibile ed è archiviato con permessi file restrittivi.
Nel modello di sicurezza di OpenClaw, l'host gateway e la directory di stato locale OpenClaw sono già all'interno del perimetro di fiducia dell'operatore, quindi questa è principalmente una questione di durabilità operativa piuttosto che un confine di fiducia remoto separato.

Miglioramento pianificato:

- aggiungere supporto SecretRef per materiale chiave Matrix persistente così chiavi di ripristino e relativi segreti di crittografia dell'archivio possano provenire dai provider di segreti OpenClaw invece che solo da file locali

## Gestione del profilo

Aggiorna il profilo Matrix dell'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi prendere esplicitamente di mira un account Matrix con nome.

Matrix accetta direttamente URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override dell'account selezionato).

## Avvisi automatici di verifica

Matrix ora pubblica direttamente nella rigida stanza DM di verifica avvisi del ciclo di vita della verifica come messaggi `m.notice`.
Questo include:

- avvisi di richiesta di verifica
- avvisi di verifica pronta (con guida esplicita "Verify by emoji")
- avvisi di avvio e completamento della verifica
- dettagli SAS (emoji e decimali) quando disponibili

Le richieste di verifica in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente da OpenClaw.
Per i flussi di auto-verifica, OpenClaw avvia anche automaticamente il flusso SAS quando la verifica tramite emoji diventa disponibile e conferma il proprio lato.
Per le richieste di verifica provenienti da un altro utente/dispositivo Matrix, OpenClaw accetta automaticamente la richiesta e poi attende che il flusso SAS proceda normalmente.
Devi comunque confrontare l'emoji o il SAS decimale nel tuo client Matrix e confermare lì "They match" per completare la verifica.

OpenClaw non accetta automaticamente alla cieca flussi duplicati avviati in proprio. All'avvio salta la creazione di una nuova richiesta quando una richiesta di auto-verifica è già in sospeso.

Gli avvisi di protocollo/sistema di verifica non vengono inoltrati alla pipeline di chat dell'agente, quindi non producono `NO_REPLY`.

### Igiene dei dispositivi

I vecchi dispositivi Matrix gestiti da OpenClaw possono accumularsi sull'account e rendere più difficile ragionare sull'attendibilità nelle stanze crittografate.
Elencali con:

```bash
openclaw matrix devices list
```

Rimuovi i dispositivi gestiti da OpenClaw obsoleti con:

```bash
openclaw matrix devices prune-stale
```

### Riparazione stanza diretta

Se lo stato dei messaggi diretti va fuori sincronia, OpenClaw può finire con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

La riparazione mantiene la logica specifica di Matrix all'interno del plugin:

- preferisce un DM 1:1 rigoroso che è già mappato in `m.direct`
- altrimenti ripiega su qualsiasi DM 1:1 rigoroso attualmente unito con quell'utente
- se non esiste alcun DM integro, crea una nuova stanza diretta e riscrive `m.direct` per puntarla lì

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Seleziona solo il DM integro e aggiorna il mapping così nuovi invii Matrix, avvisi di verifica e altri flussi di messaggi diretti tornino a destinare la stanza corretta.

## Thread

Matrix supporta thread Matrix nativi sia per le risposte automatiche sia per gli invii dello strumento messaggi.

- `dm.sessionScope: "per-user"` (predefinito) mantiene il routing Matrix DM con ambito mittente, quindi più stanze DM possono condividere una sessione quando si risolvono allo stesso peer.
- `dm.sessionScope: "per-room"` isola ogni stanza Matrix DM nella propria chiave di sessione pur continuando a usare normali controlli di autenticazione e allowlist per i DM.
- I binding espliciti delle conversazioni Matrix continuano ad avere la precedenza su `dm.sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.
- `threadReplies: "off"` mantiene le risposte a livello superiore e mantiene i messaggi in ingresso in thread sulla sessione padre.
- `threadReplies: "inbound"` risponde all'interno di un thread solo quando il messaggio in ingresso era già in quel thread.
- `threadReplies: "always"` mantiene le risposte della stanza in un thread radicato nel messaggio attivante e instrada quella conversazione tramite la sessione con ambito thread corrispondente a partire dal primo messaggio attivante.
- `dm.threadReplies` sovrascrive l'impostazione di livello superiore solo per i DM. Ad esempio, puoi mantenere isolati i thread delle stanze mantenendo piatti i DM.
- I messaggi in ingresso in thread includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii dello strumento messaggi ora ereditano automaticamente il thread Matrix corrente quando la destinazione è la stessa stanza, o lo stesso target utente DM, a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo dello stesso target utente DM nella stessa sessione si attiva solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw torna al normale routing con ambito utente.
- Quando OpenClaw vede una stanza Matrix DM entrare in collisione con un'altra stanza DM sulla stessa sessione DM Matrix condivisa, pubblica in quella stanza un `m.notice` una tantum con la via di fuga `/focus` quando i binding dei thread sono abilitati e il suggerimento `dm.sessionScope`.
- I binding dei thread runtime sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` associato a thread ora funzionano nelle stanze e nei DM Matrix.
- `/focus` a livello superiore in una stanza/DM Matrix crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSubagentSessions=true`.
- Eseguire `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP durevoli senza cambiare la superficie della chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` all'interno del DM, della stanza o del thread esistente Matrix che vuoi continuare a usare.
- In un DM o stanza Matrix di livello superiore, il DM/stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- All'interno di un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnAcpSessions` è richiesto solo per `/acp spawn --thread auto|here`, dove OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione dei Thread Binding

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

I flag di generazione associata a thread per Matrix sono opzionali:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in ingresso e reazioni di conferma in ingresso.

- Lo strumento per le reazioni in uscita è controllato da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a uno specifico evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per uno specifico evento Matrix.
- `emoji=""` rimuove le reazioni proprie dell'account bot su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dell'account bot.

L'ambito delle reazioni di conferma viene risolto in base all'ordine standard di OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agente

L'ambito delle reazioni di conferma viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità di notifica delle reazioni viene risolta in questo ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- default: `own`

Comportamento attuale:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando prendono di mira messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disabilita gli eventi di sistema delle reazioni.
- Le rimozioni di reazioni non vengono ancora sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni autonome di `m.reaction`.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di stanza Matrix attiva l'agente.
- Ricade su `messages.groupChat.historyLimit`. Se entrambi non sono impostati, il valore predefinito effettivo è `0`, quindi i messaggi di stanza con attivazione tramite menzione non vengono memorizzati nel buffer. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo per stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo per messaggi in sospeso: OpenClaw memorizza nel buffer i messaggi di stanza che non hanno ancora attivato una risposta, poi acquisisce uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I ritentativi dello stesso evento Matrix riutilizzano lo snapshot della cronologia originale invece di spostarsi in avanti verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza come testo di risposta recuperato, radici dei thread e cronologia in sospeso.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli della allowlist attiva della stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso stesso possa attivare una risposta.
L'autorizzazione del trigger continua a provenire da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni della policy DM.

## Esempio di policy DM e stanza

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

Vedi [Groups](/it/channels/groups) per il comportamento di limitazione tramite menzione e allowlist.

Esempio di pairing per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing in sospeso e può inviare di nuovo una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing DM e il layout di archiviazione.

## Approvazioni exec

Matrix può agire come client di approvazione exec per un account Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facoltativo; ricade su `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e può essere risolto almeno un approvatore, da `execApprovals.approvers` oppure da `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. In caso contrario, le richieste di approvazione ricadono su altre route di approvazione configurate o sulla policy di fallback delle approvazioni exec.

Il routing Matrix nativo oggi è solo per exec:

- `channels.matrix.execApprovals.*` controlla il routing DM/canale nativo solo per le approvazioni exec.
- Le approvazioni dei plugin continuano a usare il `/approve` condiviso nella stessa chat più qualsiasi inoltro `approvals.plugin` configurato.
- Matrix può comunque riutilizzare `channels.matrix.dm.allowFrom` per l'autorizzazione delle approvazioni plugin quando può dedurre gli approvatori in sicurezza, ma non espone un percorso separato nativo DM/canale per le approvazioni plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione ai DM degli approvatori
- `target: "channel"` invia il prompt di nuovo alla stanza o al DM Matrix di origine
- `target: "both"` invia ai DM degli approvatori e alla stanza o al DM Matrix di origine

I prompt di approvazione Matrix inizializzano scorciatoie di reazione sul messaggio principale di approvazione:

- `✅` = consenti una volta
- `❌` = nega
- `♾️` = consenti sempre quando quella decisione è consentita dalla policy exec effettiva

Gli approvatori possono reagire a quel messaggio oppure usare i comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, oppure `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. La consegna al canale include il testo del comando, quindi abilita `channel` o `both` solo in stanze attendibili.

I prompt di approvazione Matrix riutilizzano il planner di approvazione condiviso del core. La superficie nativa specifica di Matrix è solo il trasporto per le approvazioni exec: routing stanza/DM e comportamento di invio/aggiornamento/eliminazione dei messaggi.

Override per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Approvazioni exec](/it/tools/exec-approvals)

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
Puoi limitare le voci di stanza ereditate a un account Matrix con `groups.<room>.account` (o il legacy `rooms.<room>.account`).
Le voci senza `account` restano condivise tra tutti gli account Matrix, e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente al livello superiore `channels.matrix.*`.
I valori predefiniti di autenticazione condivisa parziale non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di livello superiore solo quando quel predefinito ha autenticazione aggiornata (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare rilevabili da `homeserver` più `userId` quando le credenziali in cache soddisfano successivamente l'autenticazione.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave account con nome esistente, la promozione di riparazione/configurazione da account singolo a multi-account preserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi Matrix di autenticazione/bootstrap vengono spostate in quell'account promosso; le chiavi condivise della policy di consegna restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per routing implicito, probing e operazioni CLI.
Se configuri più account con nome, imposta `defaultAccount` oppure passa `--account <id>` per i comandi CLI che dipendono dalla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un comando.

## Homeserver privati/LAN

Per default, OpenClaw blocca gli homeserver Matrix privati/interni come protezione SSRF a meno che tu
non effettui esplicitamente l'opt-in per account.

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

Questo opt-in consente solo destinazioni private/interne attendibili. Gli homeserver pubblici in chiaro come
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

Gli account con nome possono sovrascrivere il valore predefinito di livello superiore con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix runtime e i probe di stato account.

## Risoluzione della destinazione

Matrix accetta questi formati di destinazione ovunque OpenClaw ti chieda un target stanza o utente:

- Utenti: `@user:server`, `user:@user:server`, oppure `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server`, oppure `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server`, oppure `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix autenticato:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi ricadono sulla ricerca dei nomi delle stanze unite per quell'account.
- La ricerca per nome nelle stanze unite è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver si risolve in `localhost`, un IP LAN/Tailscale o un host interno come `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) facoltativo per il traffico Matrix. Gli account con nome possono sovrascrivere il valore predefinito di livello superiore con il proprio `proxy`.
- `userId`: ID utente Matrix completo, ad esempio `@bot:example.org`.
- `accessToken`: token di accesso per autenticazione basata su token. Sono supportati valori in testo semplice e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` nei provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).
- `password`: password per accesso basato su password. Sono supportati valori in testo semplice e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per l'accesso con password.
- `avatarUrl`: URL dell'avatar del profilo memorizzato per la sincronizzazione del profilo e gli aggiornamenti `set-profile`.
- `initialSyncLimit`: limite eventi di sincronizzazione all'avvio.
- `encryption`: abilita E2EE.
- `allowlistOnly`: forza il comportamento solo allowlist per DM e stanze.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` oppure `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oppure `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico delle stanze.
- Le voci di `groupAllowFrom` dovrebbero essere ID utente Matrix completi. I nomi non risolti vengono ignorati in fase runtime.
- `historyLimit`: massimo dei messaggi di stanza da includere come contesto della cronologia di gruppo. Ricade su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- `replyToMode`: `off`, `first`, `all` oppure `batched`.
- `markdown`: configurazione facoltativa di rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `partial`, `quiet`, `true` oppure `false`. `partial` e `true` abilitano aggiornamenti bozza con anteprima-prima usando normali messaggi di testo Matrix. `quiet` usa avvisi di anteprima senza notifica per configurazioni self-hosted con regole push.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi completati dell'assistente mentre è attivo lo streaming con anteprima bozza.
- `threadReplies`: `off`, `inbound` oppure `always`.
- `threadBindings`: override per canale per routing e ciclo di vita delle sessioni associate ai thread.
- `startupVerification`: modalità automatica di richiesta auto-verifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione dei blocchi dei messaggi in uscita.
- `chunkMode`: `length` oppure `newline`.
- `responsePrefix`: prefisso messaggio facoltativo per le risposte in uscita.
- `ackReaction`: override facoltativo della reazione di conferma per questo canale/account.
- `ackReactionScope`: override facoltativo dell'ambito della reazione di conferma (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`own`, `off`).
- `mediaMaxMb`: limite dimensione media in MB per la gestione dei media Matrix. Si applica agli invii in uscita e all'elaborazione dei media in ingresso.
- `autoJoin`: policy di accesso automatico agli inviti (`always`, `allowlist`, `off`). Predefinito: `off`. Si applica agli inviti Matrix in generale, inclusi gli inviti in stile DM, non solo agli inviti a stanze/gruppi. OpenClaw prende questa decisione al momento dell'invito, prima di poter classificare in modo affidabile la stanza unita come DM o gruppo.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitata.
- `dm`: blocco policy DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controlla l'accesso DM dopo che OpenClaw è entrato nella stanza e l'ha classificata come DM. Non cambia se un invito viene accettato automaticamente.
- Le voci di `dm.allowFrom` dovrebbero essere ID utente Matrix completi a meno che tu non li abbia già risolti tramite la ricerca live nella directory.
- `dm.sessionScope`: `per-user` (predefinito) oppure `per-room`. Usa `per-room` quando vuoi che ogni stanza Matrix DM mantenga un contesto separato anche se il peer è lo stesso.
- `dm.threadReplies`: override della policy thread solo per DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di livello superiore sia per il posizionamento delle risposte sia per l'isolamento della sessione nei DM.
- `execApprovals`: consegna nativa Matrix delle approvazioni exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Facoltativo quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: override nominati per account. I valori di livello superiore `channels.matrix` agiscono come valori predefiniti per queste voci.
- `groups`: mappa delle policy per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati in fase runtime. L'identità sessione/gruppo usa l'ID stanza stabile dopo la risoluzione, mentre le etichette leggibili continuano a provenire dai nomi stanza.
- `groups.<room>.account`: limita una voce stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: override a livello stanza per mittenti bot configurati (`true` oppure `"mentions"`).
- `groups.<room>.users`: allowlist per mittenti per stanza.
- `groups.<room>.tools`: override per stanza di allow/deny degli strumenti.
- `groups.<room>.autoReply`: override a livello stanza per la limitazione tramite menzione. `true` disabilita i requisiti di menzione per quella stanza; `false` li riattiva forzatamente.
- `groups.<room>.skills`: filtro facoltativo di Skills a livello stanza.
- `groups.<room>.systemPrompt`: frammento facoltativo di prompt di sistema a livello stanza.
- `rooms`: alias legacy per `groups`.
- `actions`: gating degli strumenti per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Panoramica canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento della chat di gruppo e limitazione tramite menzione
- [Instradamento canali](/it/channels/channel-routing) — instradamento di sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
