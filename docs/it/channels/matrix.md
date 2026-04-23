---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurare la E2EE e la verifica di Matrix
summary: Stato del supporto Matrix, configurazione iniziale ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-04-23T08:23:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14873e9d65994138d26ad0bc1bf9bc6e00bea17f9306d592c757503d363de71a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix è un plugin di canale incluso per OpenClaw.
Usa l'`matrix-js-sdk` ufficiale e supporta DM, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix viene distribuito come plugin incluso nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Matrix, installalo
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
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni più vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con uno tra:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il Gateway.
5. Avvia un DM con il bot oppure invitalo in una stanza.
   - I nuovi inviti Matrix funzionano solo quando `channels.matrix.autoJoin` li consente.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata di Matrix chiede:

- URL dell'homeserver
- metodo di autenticazione: access token o password
- ID utente (solo autenticazione con password)
- nome dispositivo opzionale
- se abilitare la E2EE
- se configurare l'accesso alle stanze e l'adesione automatica agli inviti

Comportamenti principali della procedura guidata:

- Se le variabili d'ambiente di autenticazione Matrix esistono già e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre una scorciatoia env per mantenere l'autenticazione nelle variabili d'ambiente.
- I nomi account vengono normalizzati nell'ID account. Per esempio, `Ops Bot` diventa `ops-bot`.
- Le voci della allowlist DM accettano direttamente `@user:server`; i nomi visualizzati funzionano solo quando una ricerca live nella directory trova una sola corrispondenza esatta.
- Le voci della allowlist delle stanze accettano direttamente ID stanza e alias. Preferisci `!room:server` o `#alias:server`; i nomi non risolti vengono ignorati a runtime dalla risoluzione della allowlist.
- In modalità allowlist per l'adesione automatica agli inviti, usa solo target di invito stabili: `!roomId:server`, `#alias:server` oppure `*`. I nomi semplici delle stanze vengono rifiutati.
- Per risolvere i nomi delle stanze prima di salvare, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` è impostato su `off` per impostazione predefinita.

Se lo lasci non impostato, il bot non entrerà nelle stanze invitate o nei nuovi inviti in stile DM, quindi non apparirà nei nuovi gruppi o nei DM su invito a meno che tu non lo faccia entrare manualmente prima.

Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare gli inviti che accetta, oppure imposta `autoJoin: "always"` se vuoi che entri in ogni invito.

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

Matrix memorizza nella cache le credenziali in `~/.openclaw/credentials/matrix/`.
L'account predefinito usa `credentials.json`; gli account con nome usano `credentials-<account>.json`.
Quando lì esistono credenziali memorizzate nella cache, OpenClaw considera Matrix configurato per setup, doctor e rilevamento dello stato del canale anche se l'autenticazione corrente non è impostata direttamente nella configurazione.

Equivalenti tramite variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

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

Matrix esegue l'escape della punteggiatura negli ID account per mantenere le variabili d'ambiente con ambito prive di collisioni.
Per esempio, `-` diventa `_X2D_`, quindi `ops-prod` corrisponde a `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre la scorciatoia per le variabili d'ambiente solo quando quelle variabili d'ambiente di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

`MATRIX_HOMESERVER` non può essere impostata da un `.env` del workspace; vedi [file `.env` del workspace](/it/gateway/security).

## Esempio di configurazione

Questa è una configurazione di base pratica con pairing DM, allowlist delle stanze ed E2EE abilitata:

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

`autoJoin` si applica a tutti gli inviti Matrix, compresi gli inviti in stile DM. OpenClaw non può classificare in modo affidabile
una stanza invitata come DM o gruppo al momento dell'invito, quindi tutti gli inviti passano prima da `autoJoin`.
`dm.policy` si applica dopo che il bot è entrato e la stanza è stata classificata come DM.

## Anteprime in streaming

Lo streaming delle risposte Matrix è opt-in.

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

- `streaming: "off"` è l'impostazione predefinita. OpenClaw attende la risposta finale e la invia una sola volta.
- `streaming: "partial"` crea un messaggio di anteprima modificabile per l'attuale blocco assistant usando normali messaggi di testo Matrix. Questo preserva il comportamento legacy di notifica basato sulla prima anteprima di Matrix, quindi i client standard potrebbero notificare il primo testo dell'anteprima in streaming invece del blocco completato.
- `streaming: "quiet"` crea un'anteprima silenziosa modificabile per l'attuale blocco assistant. Usalo solo quando configuri anche le regole push del destinatario per le modifiche finalizzate dell'anteprima.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con lo streaming delle anteprime abilitato, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando lo streaming delle anteprime è attivo e `blockStreaming` è disattivato, Matrix modifica la bozza live sul posto e finalizza quello stesso evento quando il blocco o il turno termina.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming dell'anteprima e torna alla normale consegna finale.
- Le risposte con contenuti multimediali continuano a inviare gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta finale con contenuti multimediali.
- Le modifiche alle anteprime comportano chiamate API Matrix aggiuntive. Lascia lo streaming disattivato se vuoi il comportamento più conservativo rispetto ai limiti di frequenza.

`blockStreaming` da solo non abilita le anteprime di bozza.
Usa `streaming: "partial"` o `streaming: "quiet"` per le modifiche dell'anteprima; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi assistant completati restino visibili come messaggi di avanzamento separati.

Se hai bisogno delle notifiche standard di Matrix senza regole push personalizzate, usa `streaming: "partial"` per il comportamento basato sulla prima anteprima oppure lascia `streaming` disattivato per la consegna solo finale. Con `streaming: "off"`:

- `blockStreaming: true` invia ogni blocco completato come normale messaggio Matrix con notifica.
- `blockStreaming: false` invia solo la risposta finale completata come normale messaggio Matrix con notifica.

### Regole push self-hosted per anteprime silenziose finalizzate

Se gestisci una tua infrastruttura Matrix e vuoi che le anteprime silenziose notifichino solo quando un blocco o
la risposta finale è completata, imposta `streaming: "quiet"` e aggiungi una regola push per utente per le modifiche finalizzate dell'anteprima.

Di solito si tratta di una configurazione dell'utente destinatario, non di una modifica di configurazione globale dell'homeserver:

Mappa rapida prima di iniziare:

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix OpenClaw che invia la risposta
- usa l'access token dell'utente destinatario per le chiamate API sotto
- fai corrispondere `sender` nella regola push al MXID completo dell'utente bot

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

2. Assicurati che l'account destinatario riceva già le normali notifiche push Matrix. Le regole
   per le anteprime silenziose funzionano solo se quell'utente ha già pusher/dispositivi funzionanti.

3. Ottieni l'access token dell'utente destinatario.
   - Usa il token dell'utente che riceve, non quello del bot.
   - Riutilizzare un token di sessione client esistente di solito è la soluzione più semplice.
   - Se devi generare un nuovo token, puoi effettuare il login tramite la normale Matrix Client-Server API:

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

Se questo non restituisce pusher/dispositivi attivi, correggi prima le normali notifiche Matrix prima di aggiungere la
regola OpenClaw sotto.

OpenClaw contrassegna le modifiche finalizzate dell'anteprima solo testo con:

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

- `https://matrix.example.org`: URL di base del tuo homeserver
- `$USER_ACCESS_TOKEN`: access token dell'utente destinatario
- `openclaw-finalized-preview-botname`: un ID regola univoco per questo bot per questo utente destinatario
- `@bot:example.org`: il MXID del tuo bot Matrix OpenClaw, non il MXID dell'utente destinatario

Importante per configurazioni con più bot:

- Le regole push sono indicizzate tramite `ruleId`. Rieseguire `PUT` sullo stesso ID regola aggiorna quella singola regola.
- Se un utente destinatario deve ricevere notifiche per più account bot Matrix OpenClaw, crea una regola per bot con un ID regola univoco per ogni corrispondenza del mittente.
- Un pattern semplice è `openclaw-finalized-preview-<botname>`, ad esempio `openclaw-finalized-preview-ops` o `openclaw-finalized-preview-support`.

La regola viene valutata rispetto al mittente dell'evento:

- autenticati con il token dell'utente destinatario
- fai corrispondere `sender` al MXID del bot OpenClaw

6. Verifica che la regola esista:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Testa una risposta in streaming. In modalità quiet, la stanza dovrebbe mostrare una bozza di anteprima silenziosa e la
   modifica finale sul posto dovrebbe inviare una notifica quando il blocco o il turno termina.

Se in seguito devi rimuovere la regola, elimina lo stesso ID regola con il token dell'utente destinatario:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Note:

- Crea la regola con l'access token dell'utente destinatario, non con quello del bot.
- Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite, quindi non è necessario alcun parametro di ordinamento aggiuntivo.
- Questo influisce solo sulle modifiche di anteprima solo testo che OpenClaw può finalizzare in sicurezza sul posto. I fallback per i contenuti multimediali e i fallback per anteprime obsolete continuano a usare la normale consegna Matrix.
- Se `GET /_matrix/client/v3/pushers` non mostra pusher, l'utente non dispone ancora di una consegna push Matrix funzionante per questo account/dispositivo.

#### Synapse

Per Synapse, la configurazione sopra di solito è già sufficiente da sola:

- Non è necessaria alcuna modifica speciale a `homeserver.yaml` per le notifiche delle anteprime OpenClaw finalizzate.
- Se il tuo deployment Synapse invia già le normali notifiche push Matrix, il token utente + la chiamata `pushrules` sopra sono il passaggio principale della configurazione.
- Se esegui Synapse dietro un reverse proxy o con worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse.
- Se usi worker Synapse, assicurati che i pusher siano in salute. La consegna push è gestita dal processo principale oppure da `synapse.app.pusher` / dai worker pusher configurati.

#### Tuwunel

Per Tuwunel, usa lo stesso flusso di configurazione e la stessa chiamata API `pushrules` mostrata sopra:

- Non è richiesta alcuna configurazione specifica di Tuwunel per il marker di anteprima finalizzata.
- Se le normali notifiche Matrix funzionano già per quell'utente, il token utente + la chiamata `pushrules` sopra sono il passaggio principale della configurazione.
- Se le notifiche sembrano sparire mentre l'utente è attivo su un altro dispositivo, verifica se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione in Tuwunel 1.4.2 il 12 settembre 2025, e può sopprimere intenzionalmente i push verso altri dispositivi mentre un dispositivo è attivo.

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
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello account per una singola stanza.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di auto-risposta.
- Matrix qui non espone un flag bot nativo; OpenClaw considera "scritto da un bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist di stanza rigorose e requisiti di menzione quando abiliti il traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` così che le anteprime immagine siano crittografate insieme all'allegato completo. Le stanze non crittografate continuano a usare `thumbnail_url` semplice. Non è necessaria alcuna configurazione: il plugin rileva automaticamente lo stato E2EE.

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

Stato verboso (diagnostica completa):

```bash
openclaw matrix verify status --verbose
```

Includi la chiave di recupero archiviata nell'output leggibile da macchina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inizializza cross-signing e stato di verifica:

```bash
openclaw matrix verify bootstrap
```

Diagnostica dettagliata del bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forza un reset completo dell'identità di cross-signing prima del bootstrap:

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

Controlla lo stato di salute del backup delle chiavi stanza:

```bash
openclaw matrix verify backup status
```

Diagnostica dettagliata dello stato di salute del backup:

```bash
openclaw matrix verify backup status --verbose
```

Ripristina le chiavi stanza dal backup del server:

```bash
openclaw matrix verify backup restore
```

Diagnostica dettagliata del ripristino:

```bash
openclaw matrix verify backup restore --verbose
```

Elimina il backup server corrente e crea una nuova baseline di backup. Se la chiave di
backup archiviata non può essere caricata correttamente, questo reset può anche ricreare il secret storage così che
i futuri avvii a freddo possano caricare la nuova chiave di backup:

```bash
openclaw matrix verify backup reset --yes
```

Tutti i comandi `verify` sono concisi per impostazione predefinita (incluso il logging interno silenzioso dell'SDK) e mostrano diagnostica dettagliata solo con `--verbose`.
Usa `--json` per l'output completo leggibile da macchina negli script.

Nelle configurazioni multi-account, i comandi Matrix CLI usano l'account Matrix predefinito implicito a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount` oppure queste operazioni CLI implicite si fermeranno e ti chiederanno di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che le operazioni di verifica o dispositivo puntino esplicitamente a un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

### Cosa significa "verified"

OpenClaw considera questo dispositivo Matrix verificato solo quando è verificato dalla tua identità di cross-signing.
In pratica, `openclaw matrix verify status --verbose` espone tre segnali di fiducia:

- `Locally trusted`: questo dispositivo è affidabile solo per il client corrente
- `Cross-signing verified`: l'SDK segnala il dispositivo come verificato tramite cross-signing
- `Signed by owner`: il dispositivo è firmato dalla tua stessa chiave self-signing

`Verified by owner` diventa `yes` solo quando è presente la verifica tramite cross-signing o la firma del proprietario.
La fiducia locale da sola non basta perché OpenClaw tratti il dispositivo come completamente verificato.

### Cosa fa bootstrap

`openclaw matrix verify bootstrap` è il comando di riparazione e configurazione per gli account Matrix crittografati.
Esegue tutto quanto segue, in ordine:

- inizializza il secret storage, riutilizzando una chiave di recupero esistente quando possibile
- inizializza il cross-signing e carica le chiavi pubbliche di cross-signing mancanti
- tenta di contrassegnare e firmare con cross-signing il dispositivo corrente
- crea un nuovo backup lato server delle chiavi stanza se non ne esiste già uno

Se l'homeserver richiede autenticazione interattiva per caricare le chiavi di cross-signing, OpenClaw prova prima il caricamento senza autenticazione, poi con `m.login.dummy`, poi con `m.login.password` quando `channels.matrix.password` è configurato.

Usa `--force-reset-cross-signing` solo quando vuoi intenzionalmente scartare l'identità di cross-signing corrente e crearne una nuova.

Se vuoi intenzionalmente scartare il backup corrente delle chiavi stanza e avviare una nuova
baseline di backup per i messaggi futuri, usa `openclaw matrix verify backup reset --yes`.
Fallo solo se accetti che la vecchia cronologia crittografata non recuperabile resti
non disponibile e che OpenClaw possa ricreare il secret storage se il secret di backup corrente
non può essere caricato in sicurezza.

### Nuova baseline di backup

Se vuoi mantenere funzionanti i futuri messaggi crittografati e accetti di perdere la vecchia cronologia non recuperabile, esegui questi comandi nell'ordine indicato:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Aggiungi `--account <id>` a ogni comando quando vuoi puntare esplicitamente a un account Matrix con nome.

### Comportamento all'avvio

Quando `encryption: true`, Matrix imposta `startupVerification` su `"if-unverified"` per impostazione predefinita.
All'avvio, se questo dispositivo non è ancora verificato, Matrix richiederà l'auto-verifica in un altro client Matrix,
salterà le richieste duplicate quando una è già in sospeso e applicherà un cooldown locale prima di riprovare dopo i riavvii.
I tentativi di richiesta non riusciti vengono ritentati prima, per impostazione predefinita, rispetto alla creazione riuscita di una richiesta.
Imposta `startupVerification: "off"` per disabilitare le richieste automatiche all'avvio, oppure regola `startupVerificationCooldownHours`
se vuoi una finestra di ritentativo più breve o più lunga.

All'avvio viene eseguito automaticamente anche un passaggio conservativo di bootstrap crittografico.
Quel passaggio prova prima a riutilizzare il secret storage e l'identità di cross-signing correnti, ed evita di resettare il cross-signing a meno che tu non esegua un flusso esplicito di riparazione bootstrap.

Se all'avvio viene comunque rilevato uno stato bootstrap danneggiato, OpenClaw può tentare un percorso di riparazione protetto anche quando `channels.matrix.password` non è configurato.
Se per quella riparazione l'homeserver richiede UIA basata su password, OpenClaw registra un avviso e mantiene l'avvio non fatale invece di interrompere il bot.
Se il dispositivo corrente è già firmato dal proprietario, OpenClaw preserva quell'identità invece di reimpostarla automaticamente.

Vedi [migrazione Matrix](/it/install/migrating-matrix) per il flusso completo di aggiornamento, i limiti, i comandi di recupero e i messaggi comuni di migrazione.

### Avvisi di verifica

Matrix pubblica avvisi sul ciclo di vita della verifica direttamente nella stanza DM di verifica rigorosa come messaggi `m.notice`.
Questo include:

- avvisi di richiesta di verifica
- avvisi di verifica pronta (con indicazioni esplicite "Verifica tramite emoji")
- avvisi di inizio e completamento della verifica
- dettagli SAS (emoji e decimali) quando disponibili

Le richieste di verifica in ingresso da un altro client Matrix vengono tracciate e accettate automaticamente da OpenClaw.
Per i flussi di auto-verifica, OpenClaw avvia automaticamente anche il flusso SAS quando la verifica tramite emoji diventa disponibile e conferma il proprio lato.
Per le richieste di verifica da un altro utente/dispositivo Matrix, OpenClaw accetta automaticamente la richiesta e poi attende che il flusso SAS prosegua normalmente.
Devi comunque confrontare le emoji o il SAS decimale nel tuo client Matrix e confermare lì "Corrispondono" per completare la verifica.

OpenClaw non accetta automaticamente alla cieca i flussi duplicati avviati in proprio. All'avvio evita di creare una nuova richiesta quando una richiesta di auto-verifica è già in sospeso.

Gli avvisi di protocollo/sistema della verifica non vengono inoltrati alla pipeline di chat dell'agente, quindi non producono `NO_REPLY`.

### Igiene dei dispositivi

I vecchi dispositivi Matrix gestiti da OpenClaw possono accumularsi sull'account e rendere più difficile comprendere l'affidabilità delle stanze crittografate.
Elencali con:

```bash
openclaw matrix devices list
```

Rimuovi i dispositivi OpenClaw gestiti obsoleti con:

```bash
openclaw matrix devices prune-stale
```

### Archivio crittografico

La E2EE di Matrix usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` in Node, con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico viene mantenuto in un file snapshot (`crypto-idb-snapshot.json`) e ripristinato all'avvio. Il file snapshot contiene stato runtime sensibile ed è archiviato con permessi file restrittivi.

Lo stato runtime crittografato si trova in radici per account e per hash del token utente in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Quella directory contiene l'archivio sync (`bot-storage.json`), l'archivio crittografico (`crypto/`),
il file della chiave di recupero (`recovery-key.json`), lo snapshot IndexedDB (`crypto-idb-snapshot.json`),
i binding dei thread (`thread-bindings.json`) e lo stato della verifica all'avvio (`startup-verification.json`).
Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore
radice esistente per quella tupla account/homeserver/utente così che stato sync precedente, stato crittografico, binding dei thread
e stato della verifica all'avvio restino visibili.

## Gestione del profilo

Aggiorna il profilo Matrix dell'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi puntare esplicitamente a un account Matrix con nome.

Matrix accetta direttamente gli URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e memorizza l'URL `mxc://` risolto di nuovo in `channels.matrix.avatarUrl` (oppure nell'override dell'account selezionato).

## Thread

Matrix supporta i thread Matrix nativi sia per le risposte automatiche sia per gli invii degli strumenti messaggio.

- `dm.sessionScope: "per-user"` (predefinito) mantiene l'instradamento dei DM Matrix con ambito mittente, così più stanze DM possono condividere una sessione quando vengono risolte allo stesso peer.
- `dm.sessionScope: "per-room"` isola ogni stanza DM Matrix nella propria chiave di sessione continuando però a usare i normali controlli di autenticazione DM e allowlist.
- I binding espliciti delle conversazioni Matrix hanno comunque la precedenza su `dm.sessionScope`, quindi le stanze e i thread associati mantengono la sessione di destinazione scelta.
- `threadReplies: "off"` mantiene le risposte al livello superiore e conserva i messaggi in ingresso nei thread sulla sessione padre.
- `threadReplies: "inbound"` risponde all'interno di un thread solo quando il messaggio in ingresso era già in quel thread.
- `threadReplies: "always"` mantiene le risposte della stanza in un thread radicato nel messaggio che ha attivato l'azione e instrada quella conversazione attraverso la sessione con ambito thread corrispondente a partire dal primo messaggio che ha attivato l'azione.
- `dm.threadReplies` sovrascrive l'impostazione di livello superiore solo per i DM. Per esempio, puoi mantenere isolati i thread delle stanze lasciando piatti i DM.
- I messaggi in ingresso nei thread includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii degli strumenti messaggio ereditano automaticamente il thread Matrix corrente quando la destinazione è la stessa stanza, o lo stesso target utente DM, a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo del target utente DM della stessa sessione si attiva solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw torna al normale instradamento con ambito utente.
- Quando OpenClaw vede una stanza DM Matrix entrare in conflitto con un'altra stanza DM sulla stessa sessione DM Matrix condivisa, pubblica un `m.notice` una sola volta in quella stanza con la via di fuga `/focus` quando i binding dei thread sono abilitati e con il suggerimento `dm.sessionScope`.
- I binding runtime dei thread sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` associato a thread funzionano nelle stanze e nei DM Matrix.
- `/focus` di livello superiore in una stanza/DM Matrix crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSubagentSessions=true`.
- Eseguire `/focus` o `/acp spawn --thread here` dentro un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Le stanze Matrix, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP persistenti senza cambiare la superficie di chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` nel DM Matrix, nella stanza o nel thread esistente che vuoi continuare a usare.
- In un DM o una stanza Matrix di livello superiore, il DM/la stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- Dentro un thread Matrix esistente, `--bind here` associa sul posto quel thread corrente.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnAcpSessions` è richiesto solo per `/acp spawn --thread auto|here`, quando OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione del binding dei thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

I flag di generazione con binding al thread di Matrix sono opt-in:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in ingresso e reazioni di ack in ingresso.

- Gli strumenti di reazione in uscita sono protetti da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a uno specifico evento Matrix.
- `reactions` elenca il riepilogo attuale delle reazioni per uno specifico evento Matrix.
- `emoji=""` rimuove le reazioni dell'account bot su quell'evento.
- `remove: true` rimuove solo la specifica reazione emoji dall'account bot.

L'ambito delle reazioni di ack viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji di identità dell'agente

L'ambito delle reazioni di ack viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità di notifica delle reazioni viene risolta in questo ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predefinito: `own`

Comportamento:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando puntano a messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disabilita gli eventi di sistema delle reazioni.
- Le rimozioni delle reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni `m.reaction` autonome.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente. Usa come fallback `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo di stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo pending: OpenClaw mette in buffer i messaggi della stanza che non hanno ancora attivato una risposta, quindi acquisisce uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non viene incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I ritentativi dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di avanzare verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come testo della risposta recuperata, radici dei thread e cronologia pending.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare in base ai mittenti consentiti dai controlli attivi della allowlist di stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso stesso possa attivare una risposta.
L'autorizzazione del trigger continua a dipendere da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni della policy DM.

## Policy per DM e stanza

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

Vedi [Groups](/it/channels/groups) per il comportamento di gating delle menzioni e della allowlist.

Esempio di pairing per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a inviarti messaggi prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing pending e può inviare di nuovo una risposta di promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing DM e il layout di archiviazione.

## Riparazione della stanza diretta

Se lo stato dei messaggi diretti va fuori sincronia, OpenClaw può ritrovarsi con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Il flusso di riparazione:

- preferisce un DM 1:1 rigoroso già mappato in `m.direct`
- usa come fallback qualsiasi DM 1:1 rigoroso attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM sano

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Si limita a selezionare il DM sano e ad aggiornare il mapping così che nuovi invii Matrix, avvisi di verifica e altri flussi di messaggi diretti puntino di nuovo alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo per un account Matrix. Le manopole native
di instradamento DM/canale restano sotto la configurazione di approvazione exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (opzionale; usa come fallback `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni native quando `enabled` non è impostato oppure è `"auto"` e almeno un approvatore può essere risolto. Le approvazioni exec usano prima `execApprovals.approvers` e possono usare come fallback `channels.matrix.dm.allowFrom`. Le approvazioni plugin autorizzano tramite `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. Altrimenti le richieste di approvazione usano come fallback altri percorsi di approvazione configurati o la policy di fallback delle approvazioni.

L'instradamento nativo Matrix supporta entrambi i tipi di approvazione:

- `channels.matrix.execApprovals.*` controlla la modalità nativa di fanout DM/canale per i prompt di approvazione Matrix.
- Le approvazioni exec usano l'insieme di approvatori exec da `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Le approvazioni plugin usano la allowlist DM Matrix da `channels.matrix.dm.allowFrom`.
- Le scorciatoie di reazione Matrix e gli aggiornamenti dei messaggi si applicano sia alle approvazioni exec sia a quelle plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione ai DM degli approvatori
- `target: "channel"` rimanda il prompt alla stanza Matrix o al DM di origine
- `target: "both"` invia ai DM degli approvatori e alla stanza Matrix o al DM di origine

I prompt di approvazione Matrix inizializzano scorciatoie di reazione sul messaggio di approvazione primario:

- `✅` = consenti una volta
- `❌` = nega
- `♾️` = consenti sempre quando quella decisione è consentita dalla policy exec effettiva

Gli approvatori possono reagire a quel messaggio oppure usare i comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always` oppure `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. Per le approvazioni exec, la consegna nel canale include il testo del comando, quindi abilita `channel` o `both` solo in stanze fidate.

Override per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Approvazioni exec](/it/tools/exec-approvals)

## Comandi slash

I comandi slash Matrix (per esempio `/new`, `/reset`, `/model`) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi slash preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso del comando senza richiedere una regex di menzione personalizzata. Questo mantiene il bot reattivo ai messaggi in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa con tab il bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare le policy DM o della allowlist/proprietario della stanza esattamente come i messaggi normali.

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

I valori di primo livello in `channels.matrix` agiscono come predefiniti per gli account con nome, a meno che un account non li sovrascriva.
Puoi limitare le voci di stanza ereditate a un account Matrix con `groups.<room>.account`.
Le voci senza `account` restano condivise tra tutti gli account Matrix, e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente al livello superiore in `channels.matrix.*`.
I valori predefiniti di autenticazione condivisa parziale non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di livello superiore solo quando quel predefinito ha autenticazione valida (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare rilevabili da `homeserver` più `userId` quando le credenziali memorizzate nella cache soddisfano successivamente l'autenticazione.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave di account con nome esistente, la promozione di riparazione/configurazione da account singolo a multi-account preserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi di autenticazione/bootstrap di Matrix vengono spostate in quell'account promosso; le chiavi condivise della policy di consegna restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per instradamento implicito, probing e operazioni CLI.
Se sono configurati più account Matrix e uno degli ID account è `default`, OpenClaw usa implicitamente quell'account anche quando `defaultAccount` non è impostato.
Se configuri più account con nome, imposta `defaultAccount` oppure passa `--account <id>` per i comandi CLI che dipendono dalla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un comando.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference#multi-account-all-channels) per il pattern multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu non
abiliti esplicitamente l'accesso per account.

Se il tuo homeserver è in esecuzione su localhost, su un IP LAN/Tailscale o su un hostname interno, abilita
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

Questo opt-in consente solo target privati/interni fidati. Homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Quando possibile, preferisci `https://`.

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

Gli account con nome possono sovrascrivere il predefinito di livello superiore con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy sia per il traffico Matrix runtime sia per i probe di stato dell'account.

## Risoluzione della destinazione

Matrix accetta queste forme di destinazione ovunque OpenClaw ti chieda una stanza o una destinazione utente:

- Utenti: `@user:server`, `user:@user:server` oppure `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` oppure `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` oppure `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix autenticato:

- Le ricerche utenti interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanze accettano direttamente ID stanza e alias espliciti, poi usano come fallback la ricerca nei nomi delle stanze a cui quell'account ha aderito.
- La ricerca per nome della stanza aderita è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta opzionale per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver viene risolto in `localhost`, in un IP LAN/Tailscale o in un host interno come `matrix-synapse`.
- `proxy`: URL proxy HTTP(S) opzionale per il traffico Matrix. Gli account con nome possono sovrascrivere il predefinito di livello superiore con il proprio `proxy`.
- `userId`: ID utente Matrix completo, per esempio `@bot:example.org`.
- `accessToken`: access token per autenticazione basata su token. Sono supportati valori in chiaro e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` tramite provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).
- `password`: password per login basato su password. Sono supportati valori in chiaro e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per il login con password.
- `avatarUrl`: URL dell'avatar dell'account archiviato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.
- `encryption`: abilita la E2EE.
- `allowlistOnly`: quando è `true`, aggiorna la policy stanza `open` a `allowlist` e forza tutte le policy DM attive eccetto `disabled` (incluse `pairing` e `open`) a `allowlist`. Non influisce sulle policy `disabled`.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` oppure `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oppure `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico delle stanze. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `historyLimit`: numero massimo di messaggi stanza da includere come contesto della cronologia di gruppo. Usa come fallback `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- `replyToMode`: `off`, `first`, `all` oppure `batched`.
- `markdown`: configurazione opzionale del rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `"partial"`, `"quiet"`, `true` oppure `false`. `"partial"` e `true` abilitano aggiornamenti della bozza con anteprima iniziale usando normali messaggi di testo Matrix. `"quiet"` usa avvisi di anteprima senza notifica per configurazioni self-hosted con regole push. `false` equivale a `"off"`.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi assistant completati mentre lo streaming dell'anteprima di bozza è attivo.
- `threadReplies`: `off`, `inbound` oppure `always`.
- `threadBindings`: override per canale per instradamento e ciclo di vita delle sessioni associate ai thread.
- `startupVerification`: modalità automatica di richiesta auto-verifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione in caratteri dei chunk dei messaggi in uscita (si applica quando `chunkMode` è `length`).
- `chunkMode`: `length` divide i messaggi per numero di caratteri; `newline` li divide ai confini di riga.
- `responsePrefix`: stringa opzionale anteposta a tutte le risposte in uscita per questo canale.
- `ackReaction`: override opzionale della reazione di ack per questo canale/account.
- `ackReactionScope`: override opzionale dell'ambito della reazione di ack (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`own`, `off`).
- `mediaMaxMb`: limite di dimensione dei contenuti multimediali in MB per invii in uscita ed elaborazione dei contenuti multimediali in ingresso.
- `autoJoin`: policy di adesione automatica agli inviti (`always`, `allowlist`, `off`). Predefinito: `off`. Si applica a tutti gli inviti Matrix, inclusi quelli in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitata.
- `dm`: blocco della policy DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controlla l'accesso DM dopo che OpenClaw è entrato nella stanza e l'ha classificata come DM. Non cambia se un invito viene accettato automaticamente.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `dm.sessionScope`: `per-user` (predefinito) oppure `per-room`. Usa `per-room` quando vuoi che ogni stanza DM Matrix mantenga un contesto separato anche se il peer è lo stesso.
- `dm.threadReplies`: override della policy thread solo per DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di livello superiore sia per il posizionamento delle risposte sia per l'isolamento della sessione nei DM.
- `execApprovals`: consegna delle approvazioni exec nativa di Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Opzionale quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: override nominati per account. I valori di primo livello in `channels.matrix` agiscono come predefiniti per queste voci.
- `groups`: mappa di policy per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati a runtime. L'identità della sessione/del gruppo usa l'ID stanza stabile dopo la risoluzione.
- `groups.<room>.account`: limita una voce stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: override a livello stanza per mittenti bot configurati (`true` oppure `"mentions"`).
- `groups.<room>.users`: allowlist di mittenti per stanza.
- `groups.<room>.tools`: override per stanza di consentire/negare strumenti.
- `groups.<room>.autoReply`: override a livello stanza del gating delle menzioni. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza di nuovo.
- `groups.<room>.skills`: filtro Skills opzionale a livello stanza.
- `groups.<room>.systemPrompt`: frammento opzionale di system prompt a livello stanza.
- `rooms`: alias legacy per `groups`.
- `actions`: gating per strumento e per azione (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento della chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
