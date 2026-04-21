---
read_when:
    - Configurazione di Matrix in OpenClaw
    - Configurazione di E2EE e verifica di Matrix
summary: Stato del supporto di Matrix, configurazione iniziale ed esempi di configurazione
title: Matrix
x-i18n:
    generated_at: "2026-04-21T08:21:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00fa6201d2ee4ac4ae5be3eb18ff687c5c2c9ef70cff12af1413b4c311484b24
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix è un plugin di canale incluso per OpenClaw.
Usa l'`matrix-js-sdk` ufficiale e supporta DM, stanze, thread, contenuti multimediali, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix è distribuito come plugin incluso nelle versioni correnti di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se utilizzi una build meno recente o un'installazione personalizzata che esclude Matrix, installalo manualmente:

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
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con uno dei seguenti:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il Gateway.
5. Avvia un DM con il bot o invitalo in una stanza.
   - I nuovi inviti Matrix funzionano solo quando `channels.matrix.autoJoin` li consente.

Percorsi di configurazione interattivi:

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata di Matrix richiede:

- URL dell'homeserver
- metodo di autenticazione: access token o password
- ID utente (solo autenticazione con password)
- nome dispositivo facoltativo
- se abilitare E2EE
- se configurare l'accesso alle stanze e l'auto-join per gli inviti

Comportamenti chiave della procedura guidata:

- Se le variabili d'ambiente di autenticazione Matrix esistono già e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre una scorciatoia env per mantenere l'autenticazione nelle variabili d'ambiente.
- I nomi degli account vengono normalizzati nell'ID account. Ad esempio, `Ops Bot` diventa `ops-bot`.
- Le voci della allowlist dei DM accettano direttamente `@user:server`; i nomi visualizzati funzionano solo quando la ricerca live nella directory trova una sola corrispondenza esatta.
- Le voci della allowlist delle stanze accettano direttamente ID stanza e alias. Preferisci `!room:server` o `#alias:server`; i nomi non risolti vengono ignorati a runtime dalla risoluzione della allowlist.
- Nella modalità allowlist per l'auto-join degli inviti, usa solo destinazioni di invito stabili: `!roomId:server`, `#alias:server` o `*`. I semplici nomi delle stanze vengono rifiutati.
- Per risolvere i nomi delle stanze prima del salvataggio, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` ha come valore predefinito `off`.

Se lo lasci non impostato, il bot non entrerà nelle stanze invitate o nei nuovi inviti in stile DM, quindi non apparirà nei nuovi gruppi o nei DM invitati a meno che tu non entri manualmente prima.

Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare gli inviti che accetta, oppure imposta `autoJoin: "always"` se vuoi che entri in ogni invito.

In modalità `allowlist`, `autoJoinAllowlist` accetta solo `!roomId:server`, `#alias:server` o `*`.
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

Matrix memorizza le credenziali in cache in `~/.openclaw/credentials/matrix/`.
L'account predefinito usa `credentials.json`; gli account con nome usano `credentials-<account>.json`.
Quando lì esistono credenziali in cache, OpenClaw considera Matrix configurato per configurazione iniziale, doctor e rilevamento dello stato del canale anche se l'autenticazione corrente non è impostata direttamente nella configurazione.

Equivalenti delle variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

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

Matrix esegue l'escape della punteggiatura negli ID account per evitare collisioni nelle variabili d'ambiente con ambito.
Ad esempio, `-` diventa `_X2D_`, quindi `ops-prod` diventa `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre la scorciatoia con variabili d'ambiente solo quando quelle variabili d'ambiente di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

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

`autoJoin` si applica a tutti gli inviti Matrix, inclusi gli inviti in stile DM. OpenClaw non può classificare in modo affidabile una stanza invitata come DM o gruppo al momento dell'invito, quindi tutti gli inviti passano prima da `autoJoin`. `dm.policy` si applica dopo che il bot è entrato e la stanza è classificata come DM.

## Anteprime in streaming

Lo streaming delle risposte Matrix è opzionale.

Imposta `channels.matrix.streaming` su `"partial"` quando vuoi che OpenClaw invii una singola risposta di anteprima live, modifichi quell'anteprima sul posto mentre il modello genera testo e poi la finalizzi quando la risposta è completata:

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
- `streaming: "partial"` crea un messaggio di anteprima modificabile per il blocco assistant corrente usando normali messaggi di testo Matrix. Questo preserva il comportamento legacy di notifica anteprima-prima di Matrix, quindi i client standard possono notificare il primo testo dell'anteprima in streaming invece del blocco completato.
- `streaming: "quiet"` crea un'anteprima discreta modificabile per il blocco assistant corrente. Usalo solo quando configuri anche regole push del destinatario per le modifiche finalizzate dell'anteprima.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con lo streaming delle anteprime abilitato, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando lo streaming delle anteprime è attivo e `blockStreaming` è disattivato, Matrix modifica la bozza live sul posto e finalizza quello stesso evento quando il blocco o il turno termina.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming dell'anteprima e torna alla normale consegna finale.
- Le risposte multimediali inviano comunque gli allegati normalmente. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Le modifiche delle anteprime comportano chiamate aggiuntive all'API Matrix. Lascia lo streaming disattivato se vuoi il comportamento più prudente rispetto ai limiti di frequenza.

`blockStreaming` da solo non abilita le anteprime in bozza.
Usa `streaming: "partial"` o `streaming: "quiet"` per le modifiche dell'anteprima; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi assistant completati restino visibili come messaggi di avanzamento separati.

Se hai bisogno delle notifiche Matrix standard senza regole push personalizzate, usa `streaming: "partial"` per il comportamento anteprima-prima oppure lascia `streaming` disattivato per la consegna solo finale. Con `streaming: "off"`:

- `blockStreaming: true` invia ogni blocco completato come normale messaggio Matrix con notifica.
- `blockStreaming: false` invia solo la risposta finale completata come normale messaggio Matrix con notifica.

### Regole push self-hosted per anteprime finalizzate discrete

Se gestisci la tua infrastruttura Matrix e vuoi che le anteprime discrete notifichino solo quando un blocco o una risposta finale è completata, imposta `streaming: "quiet"` e aggiungi una regola push per utente per le modifiche finalizzate dell'anteprima.

Di solito questa è una configurazione per l'utente destinatario, non una modifica di configurazione globale dell'homeserver:

Mappa rapida prima di iniziare:

- utente destinatario = la persona che deve ricevere la notifica
- utente bot = l'account Matrix di OpenClaw che invia la risposta
- usa l'access token dell'utente destinatario per le chiamate API qui sotto
- fai corrispondere `sender` nella regola push al MXID completo dell'utente bot

1. Configura OpenClaw per usare anteprime discrete:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Assicurati che l'account destinatario riceva già le normali notifiche push Matrix. Le regole per le anteprime discrete funzionano solo se quell'utente ha già pushers/dispositivi funzionanti.

3. Ottieni l'access token dell'utente destinatario.
   - Usa il token dell'utente che riceve, non quello del bot.
   - Riutilizzare un token di sessione client esistente di solito è la soluzione più semplice.
   - Se devi generare un nuovo token, puoi accedere tramite la normale API Client-Server di Matrix:

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

Se questo non restituisce pushers/dispositivi attivi, correggi prima le normali notifiche Matrix prima di aggiungere la regola OpenClaw qui sotto.

OpenClaw contrassegna le modifiche finalizzate dell'anteprima solo testuale con:

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

Importante per configurazioni multi-bot:

- Le regole push sono indicizzate da `ruleId`. Eseguire di nuovo `PUT` sullo stesso ID regola aggiorna quella singola regola.
- Se un utente destinatario deve ricevere notifiche per più account bot Matrix di OpenClaw, crea una regola per ogni bot con un ID regola univoco per ogni corrispondenza di mittente.
- Un modello semplice è `openclaw-finalized-preview-<botname>`, ad esempio `openclaw-finalized-preview-ops` oppure `openclaw-finalized-preview-support`.

La regola viene valutata rispetto al mittente dell'evento:

- autentica con il token dell'utente destinatario
- fai corrispondere `sender` al MXID del bot OpenClaw

6. Verifica che la regola esista:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. Prova una risposta in streaming. In modalità discreta, la stanza dovrebbe mostrare una bozza di anteprima discreta e la modifica finale sul posto dovrebbe inviare una notifica quando il blocco o il turno termina.

Se in seguito devi rimuovere la regola, elimina quello stesso ID regola con il token dell'utente destinatario:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Note:

- Crea la regola con l'access token dell'utente destinatario, non con quello del bot.
- Le nuove regole `override` definite dall'utente vengono inserite prima delle regole di soppressione predefinite, quindi non è necessario alcun parametro di ordinamento aggiuntivo.
- Questo riguarda solo le modifiche di anteprima di solo testo che OpenClaw può finalizzare in sicurezza sul posto. I fallback per contenuti multimediali e i fallback per anteprime obsolete usano comunque la normale consegna Matrix.
- Se `GET /_matrix/client/v3/pushers` non mostra alcun pusher, l'utente non ha ancora una consegna push Matrix funzionante per questo account/dispositivo.

#### Synapse

Per Synapse, la configurazione sopra di solito è sufficiente da sola:

- Non è richiesta alcuna modifica speciale a `homeserver.yaml` per le notifiche delle anteprime finalizzate di OpenClaw.
- Se il tuo deployment Synapse invia già normali notifiche push Matrix, il token utente + la chiamata `pushrules` sopra rappresentano il passaggio principale della configurazione.
- Se esegui Synapse dietro un reverse proxy o con worker, assicurati che `/_matrix/client/.../pushrules/` raggiunga correttamente Synapse.
- Se usi worker Synapse, assicurati che i pusher siano in buono stato. La consegna push è gestita dal processo principale oppure da `synapse.app.pusher` / worker pusher configurati.

#### Tuwunel

Per Tuwunel, usa lo stesso flusso di configurazione e la stessa chiamata API `pushrules` mostrata sopra:

- Non è richiesta alcuna configurazione specifica di Tuwunel per l'indicatore di anteprima finalizzata in sé.
- Se le normali notifiche Matrix funzionano già per quell'utente, il token utente + la chiamata `pushrules` sopra rappresentano il passaggio principale della configurazione.
- Se sembra che le notifiche scompaiano mentre l'utente è attivo su un altro dispositivo, controlla se `suppress_push_when_active` è abilitato. Tuwunel ha aggiunto questa opzione in Tuwunel 1.4.2 il 12 settembre 2025 e può sopprimere intenzionalmente le push verso altri dispositivi mentre un dispositivo è attivo.

## Stanze bot-to-bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix OpenClaw configurati vengono ignorati.

Usa `allowBots` quando vuoi intenzionalmente traffico Matrix inter-agent:

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
- `groups.<room>.allowBots` sovrascrive l'impostazione a livello di account per una singola stanza.
- OpenClaw ignora comunque i messaggi provenienti dallo stesso ID utente Matrix per evitare cicli di auto-risposta.
- Matrix qui non espone un flag bot nativo; OpenClaw considera "scritto da bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist rigorose per le stanze e requisiti di menzione quando abiliti il traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` così le anteprime immagine vengono crittografate insieme all'allegato completo. Le stanze non crittografate usano ancora `thumbnail_url` semplice. Non è necessaria alcuna configurazione: il plugin rileva automaticamente lo stato E2EE.

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

Includi la chiave di recupero memorizzata nell'output leggibile dalla macchina:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Inizializza lo stato di cross-signing e verifica:

```bash
openclaw matrix verify bootstrap
```

Diagnostica dettagliata di bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Forza un nuovo reset dell'identità di cross-signing prima del bootstrap:

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

Controlla lo stato del backup delle chiavi stanza:

```bash
openclaw matrix verify backup status
```

Diagnostica dettagliata dello stato del backup:

```bash
openclaw matrix verify backup status --verbose
```

Ripristina le chiavi stanza dal backup server:

```bash
openclaw matrix verify backup restore
```

Diagnostica dettagliata del ripristino:

```bash
openclaw matrix verify backup restore --verbose
```

Elimina il backup server corrente e crea una nuova baseline di backup. Se la chiave di backup memorizzata non può essere caricata correttamente, questo reset può anche ricreare l'archiviazione dei segreti così i futuri avvii a freddo potranno caricare la nuova chiave di backup:

```bash
openclaw matrix verify backup reset --yes
```

Tutti i comandi `verify` sono concisi per impostazione predefinita (incluso il logging interno discreto dell'SDK) e mostrano diagnostica dettagliata solo con `--verbose`.
Usa `--json` per output completo leggibile dalla macchina durante lo scripting.

Nelle configurazioni multi-account, i comandi CLI Matrix usano l'account predefinito implicito di Matrix a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount` oppure quelle operazioni CLI implicite si interromperanno chiedendoti di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che le operazioni di verifica o del dispositivo puntino esplicitamente a un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, ad esempio `channels.matrix.accounts.assistant.encryption`.

### Che cosa significa "verificato"

OpenClaw considera questo dispositivo Matrix verificato solo quando è verificato dalla tua stessa identità di cross-signing.
In pratica, `openclaw matrix verify status --verbose` espone tre segnali di attendibilità:

- `Locally trusted`: questo dispositivo è attendibile solo per il client corrente
- `Cross-signing verified`: l'SDK segnala il dispositivo come verificato tramite cross-signing
- `Signed by owner`: il dispositivo è firmato dalla tua stessa chiave self-signing

`Verified by owner` diventa `yes` solo quando è presente una verifica tramite cross-signing o una firma del proprietario.
La sola attendibilità locale non è sufficiente perché OpenClaw tratti il dispositivo come completamente verificato.

### Cosa fa bootstrap

`openclaw matrix verify bootstrap` è il comando di riparazione e configurazione per gli account Matrix crittografati.
Esegue tutto quanto segue in ordine:

- inizializza l'archiviazione dei segreti, riutilizzando una chiave di recupero esistente quando possibile
- inizializza il cross-signing e carica le chiavi pubbliche di cross-signing mancanti
- prova a contrassegnare e firmare tramite cross-signing il dispositivo corrente
- crea un nuovo backup lato server delle chiavi stanza se non ne esiste già uno

Se l'homeserver richiede autenticazione interattiva per caricare le chiavi di cross-signing, OpenClaw prova prima il caricamento senza autenticazione, poi con `m.login.dummy`, poi con `m.login.password` quando `channels.matrix.password` è configurato.

Usa `--force-reset-cross-signing` solo quando vuoi intenzionalmente scartare l'identità di cross-signing corrente e crearne una nuova.

Se vuoi intenzionalmente scartare il backup corrente delle chiavi stanza e avviare una nuova baseline di backup per i messaggi futuri, usa `openclaw matrix verify backup reset --yes`.
Fallo solo se accetti che la vecchia cronologia crittografata non recuperabile resterà non disponibile e che OpenClaw potrebbe ricreare l'archiviazione dei segreti se il segreto del backup corrente non può essere caricato in sicurezza.

### Nuova baseline di backup

Se vuoi mantenere funzionanti i futuri messaggi crittografati e accetti di perdere la vecchia cronologia non recuperabile, esegui questi comandi in ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Aggiungi `--account <id>` a ogni comando quando vuoi puntare esplicitamente a un account Matrix con nome.

### Comportamento all'avvio

Quando `encryption: true`, Matrix imposta `startupVerification` su `"if-unverified"` per impostazione predefinita.
All'avvio, se questo dispositivo non è ancora verificato, Matrix richiederà l'auto-verifica in un altro client Matrix, salterà le richieste duplicate mentre una è già in sospeso e applicherà un cooldown locale prima di riprovare dopo i riavvii.
Per impostazione predefinita, i tentativi di richiesta falliti vengono ritentati prima rispetto alla creazione riuscita di una richiesta.
Imposta `startupVerification: "off"` per disabilitare le richieste automatiche all'avvio, oppure regola `startupVerificationCooldownHours` se desideri un intervallo di nuovo tentativo più breve o più lungo.

All'avvio viene eseguito automaticamente anche un passaggio conservativo di bootstrap crypto.
Questo passaggio prova prima a riutilizzare l'archiviazione dei segreti e l'identità di cross-signing correnti, ed evita di reimpostare il cross-signing a meno che tu non esegua un flusso esplicito di riparazione bootstrap.

Se all'avvio viene comunque rilevato uno stato di bootstrap danneggiato, OpenClaw può tentare un percorso di riparazione protetto anche quando `channels.matrix.password` non è configurato.
Se l'homeserver richiede UIA basata su password per quella riparazione, OpenClaw registra un avviso e mantiene l'avvio non fatale invece di interrompere il bot.
Se il dispositivo corrente è già firmato dal proprietario, OpenClaw preserva quell'identità invece di reimpostarla automaticamente.

Vedi [Matrix migration](/it/install/migrating-matrix) per il flusso completo di aggiornamento, i limiti, i comandi di recupero e i messaggi di migrazione comuni.

### Avvisi di verifica

Matrix pubblica gli avvisi del ciclo di vita della verifica direttamente nella stanza DM di verifica rigorosa come messaggi `m.notice`.
Questo include:

- avvisi di richiesta di verifica
- avvisi di verifica pronta (con indicazioni esplicite "Verify by emoji")
- avvisi di avvio e completamento della verifica
- dettagli SAS (emoji e decimali) quando disponibili

Le richieste di verifica in arrivo da un altro client Matrix vengono tracciate e accettate automaticamente da OpenClaw.
Per i flussi di auto-verifica, OpenClaw avvia automaticamente anche il flusso SAS quando la verifica tramite emoji diventa disponibile e conferma il proprio lato.
Per le richieste di verifica da un altro utente/dispositivo Matrix, OpenClaw accetta automaticamente la richiesta e poi attende che il flusso SAS proceda normalmente.
Devi comunque confrontare le emoji o il SAS decimale nel tuo client Matrix e confermare lì "They match" per completare la verifica.

OpenClaw non accetta automaticamente alla cieca i flussi duplicati avviati da sé. All'avvio salta la creazione di una nuova richiesta quando è già in sospeso una richiesta di auto-verifica.

Gli avvisi di verifica di protocollo/sistema non vengono inoltrati alla pipeline di chat dell'agent, quindi non producono `NO_REPLY`.

### Igiene dei dispositivi

I vecchi dispositivi Matrix gestiti da OpenClaw possono accumularsi nell'account e rendere più difficile interpretare l'attendibilità delle stanze crittografate.
Elencali con:

```bash
openclaw matrix devices list
```

Rimuovi i dispositivi OpenClaw obsoleti con:

```bash
openclaw matrix devices prune-stale
```

### Archivio crittografico

Matrix E2EE usa il percorso crypto Rust ufficiale di `matrix-js-sdk` in Node, con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico viene mantenuto in un file snapshot (`crypto-idb-snapshot.json`) e ripristinato all'avvio. Il file snapshot contiene stato runtime sensibile ed è archiviato con permessi file restrittivi.

Lo stato runtime crittografato si trova in radici per account e per hash del token utente in
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Quella directory contiene il sync store (`bot-storage.json`), il crypto store (`crypto/`),
il file della chiave di recupero (`recovery-key.json`), lo snapshot IndexedDB (`crypto-idb-snapshot.json`),
i binding dei thread (`thread-bindings.json`) e lo stato di verifica all'avvio (`startup-verification.json`).
Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore
radice esistente per quella tupla account/homeserver/utente così lo stato sync precedente, lo stato crittografico, i binding dei thread
e lo stato di verifica all'avvio restano visibili.

## Gestione del profilo

Aggiorna il profilo Matrix dell'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi puntare esplicitamente a un account Matrix con nome.

Matrix accetta direttamente URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override dell'account selezionato).

## Thread

Matrix supporta thread Matrix nativi sia per le risposte automatiche sia per gli invii con message-tool.

- `dm.sessionScope: "per-user"` (predefinito) mantiene l'instradamento dei DM Matrix con ambito mittente, così più stanze DM possono condividere una sessione quando vengono risolte allo stesso peer.
- `dm.sessionScope: "per-room"` isola ogni stanza DM Matrix nella propria chiave di sessione continuando a usare la normale autenticazione DM e i controlli della allowlist.
- I binding espliciti delle conversazioni Matrix hanno comunque la precedenza su `dm.sessionScope`, quindi stanze e thread associati mantengono la sessione target scelta.
- `threadReplies: "off"` mantiene le risposte al livello superiore e conserva i messaggi in thread in ingresso nella sessione padre.
- `threadReplies: "inbound"` risponde in un thread solo quando il messaggio in ingresso era già in quel thread.
- `threadReplies: "always"` mantiene le risposte della stanza in un thread radicato nel messaggio che ha attivato la risposta e instrada quella conversazione attraverso la sessione con ambito thread corrispondente fin dal primo messaggio che ha attivato la risposta.
- `dm.threadReplies` sovrascrive l'impostazione di livello superiore solo per i DM. Ad esempio, puoi mantenere isolati i thread delle stanze mantenendo piatti i DM.
- I messaggi in thread in ingresso includono il messaggio radice del thread come contesto aggiuntivo dell'agent.
- Gli invii con message-tool ereditano automaticamente il thread Matrix corrente quando il target è la stessa stanza, o lo stesso target utente DM, a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo dello stesso target utente DM della stessa sessione si attiva solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw torna al normale instradamento con ambito utente.
- Quando OpenClaw vede una stanza DM Matrix entrare in conflitto con un'altra stanza DM sulla stessa sessione DM Matrix condivisa, pubblica un solo `m.notice` in quella stanza con la via di fuga `/focus` quando i binding dei thread sono abilitati e con l'indicazione `dm.sessionScope`.
- I binding runtime dei thread sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` con binding al thread funzionano nelle stanze e nei DM Matrix.
- `/focus` al livello superiore in una stanza/DM Matrix crea un nuovo thread Matrix e lo associa alla sessione target quando `threadBindings.spawnSubagentSessions=true`.
- Eseguire `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Stanze, DM e thread Matrix esistenti possono essere trasformati in workspace ACP persistenti senza cambiare la superficie della chat.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` all'interno del DM, della stanza o del thread esistente Matrix che vuoi continuare a usare.
- In un DM o in una stanza Matrix al livello superiore, il DM/stanza corrente resta la superficie della chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- All'interno di un thread Matrix esistente, `--bind here` associa sul posto quel thread corrente.
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

I flag di generazione con binding al thread Matrix sono opzionali:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` al livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in ingresso e reazioni ack in ingresso.

- La tool di reazione in uscita è controllata da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a un evento Matrix specifico.
- `reactions` elenca il riepilogo corrente delle reazioni per un evento Matrix specifico.
- `emoji=""` rimuove le reazioni dell'account bot su quell'evento.
- `remove: true` rimuove solo la reazione emoji specificata dall'account bot.

L'ambito delle reazioni ack viene risolto nel seguente ordine standard di OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agent

L'ambito di `ackReactionScope` viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità delle notifiche di reazione viene risolta in questo ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predefinito: `own`

Comportamento:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando puntano a messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disabilita gli eventi di sistema delle reazioni.
- Le rimozioni di reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redactions, non come rimozioni `m.reaction` standalone.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agent. Fa fallback a `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- La cronologia delle stanze Matrix è solo per stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo pending: OpenClaw mette in buffer i messaggi della stanza che non hanno ancora attivato una risposta, poi acquisisce uno snapshot di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non viene incluso in `InboundHistory`; resta nel corpo principale dell'input per quel turno.
- I tentativi ripetuti dello stesso evento Matrix riutilizzano lo snapshot originale della cronologia invece di avanzare ai messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come il testo di risposta recuperato, le radici dei thread e la cronologia pending.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare ai mittenti consentiti dai controlli attivi di allowlist di stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta citata esplicita.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso stesso possa attivare una risposta.
L'autorizzazione del trigger continua a dipendere da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni di policy dei DM.

## Policy per DM e stanze

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

Se un utente Matrix non approvato continua a scriverti prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing pending e può inviare di nuovo una risposta promemoria dopo un breve cooldown invece di generare un nuovo codice.

Vedi [Pairing](/it/channels/pairing) per il flusso condiviso di pairing dei DM e il layout di archiviazione.

## Riparazione diretta della stanza

Se lo stato dei messaggi diretti va fuori sincrono, OpenClaw può ritrovarsi con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che al DM attivo. Controlla il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Il flusso di riparazione:

- preferisce un DM 1:1 rigoroso già mappato in `m.direct`
- in fallback usa qualunque DM 1:1 rigoroso attualmente presente con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM sano

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Si limita a scegliere il DM sano e aggiornare il mapping così i nuovi invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti puntano di nuovo alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo per un account Matrix. Le impostazioni native
di instradamento DM/canale restano comunque sotto la configurazione delle approvazioni exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facoltativo; fa fallback a `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni native quando `enabled` non è impostato o è `"auto"` e almeno un approvatore può essere risolto. Le approvazioni exec usano prima `execApprovals.approvers` e possono fare fallback a `channels.matrix.dm.allowFrom`. Le approvazioni Plugin autorizzano tramite `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. Altrimenti le richieste di approvazione fanno fallback ad altri percorsi di approvazione configurati o alla policy di fallback delle approvazioni.

L'instradamento nativo Matrix supporta entrambi i tipi di approvazione:

- `channels.matrix.execApprovals.*` controlla la modalità nativa di fanout DM/canale per i prompt di approvazione Matrix.
- Le approvazioni exec usano il set di approvatori exec da `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Le approvazioni Plugin usano la allowlist DM Matrix da `channels.matrix.dm.allowFrom`.
- Le scorciatoie con reazioni Matrix e gli aggiornamenti dei messaggi si applicano sia alle approvazioni exec sia a quelle Plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione ai DM degli approvatori
- `target: "channel"` invia il prompt di nuovo alla stanza o al DM Matrix di origine
- `target: "both"` invia ai DM degli approvatori e alla stanza o al DM Matrix di origine

I prompt di approvazione Matrix inizializzano scorciatoie con reazioni sul messaggio principale di approvazione:

- `✅` = consenti una volta
- `❌` = nega
- `♾️` = consenti sempre quando quella decisione è permessa dalla policy exec effettiva

Gli approvatori possono reagire a quel messaggio o usare i comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always` oppure `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. Per le approvazioni exec, la consegna nel canale include il testo del comando, quindi abilita `channel` o `both` solo in stanze attendibili.

Override per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Exec approvals](/it/tools/exec-approvals)

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

I valori di primo livello `channels.matrix` agiscono come valori predefiniti per gli account con nome, a meno che un account non li sovrascriva.
Puoi limitare le voci di stanza ereditate a un account Matrix con `groups.<room>.account`.
Le voci senza `account` restano condivise tra tutti gli account Matrix, e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente al livello superiore in `channels.matrix.*`.
I valori predefiniti di autenticazione parziale condivisi non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di primo livello solo quando tale valore predefinito ha autenticazione aggiornata (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare rilevabili a partire da `homeserver` più `userId` quando le credenziali in cache soddisfano l'autenticazione in seguito.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave di account con nome esistente, la promozione di riparazione/configurazione da account singolo a multi-account conserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi di autenticazione/bootstrap di Matrix vengono spostate in quell'account promosso; le chiavi di policy di consegna condivise restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per instradamento implicito, probing e operazioni CLI.
Se sono configurati più account Matrix e un ID account è `default`, OpenClaw usa implicitamente quell'account anche quando `defaultAccount` non è impostato.
Se configuri più account con nome, imposta `defaultAccount` oppure passa `--account <id>` per i comandi CLI che si basano sulla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un comando.

Vedi [Configuration reference](/it/gateway/configuration-reference#multi-account-all-channels) per il modello multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu
non abiliti esplicitamente l'opzione per account.

Se il tuo homeserver gira su localhost, su un IP LAN/Tailscale o su un hostname interno, abilita
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

Esempio di configurazione tramite CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Questo opt-in consente solo target privati/interni attendibili. Gli homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Preferisci `https://` quando possibile.

## Uso di un proxy per il traffico Matrix

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

Gli account con nome possono sovrascrivere il valore predefinito di primo livello con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy per il traffico Matrix runtime e per i probe dello stato dell'account.

## Risoluzione del target

Matrix accetta queste forme di target ovunque OpenClaw ti chieda un target di stanza o utente:

- Utenti: `@user:server`, `user:@user:server` oppure `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` oppure `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` oppure `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix autenticato:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi in fallback cercano i nomi delle stanze unite per quell'account.
- La ricerca del nome nelle stanze unite è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento della configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, ad esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver risolve a `localhost`, a un IP LAN/Tailscale o a un host interno come `matrix-synapse`.
- `proxy`: URL facoltativo di proxy HTTP(S) per il traffico Matrix. Gli account con nome possono sovrascrivere il valore predefinito di primo livello con il proprio `proxy`.
- `userId`: ID utente Matrix completo, ad esempio `@bot:example.org`.
- `accessToken`: access token per autenticazione basata su token. Sono supportati valori in chiaro e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` nei provider env/file/exec. Vedi [Secrets Management](/it/gateway/secrets).
- `password`: password per login basato su password. Sono supportati valori in chiaro e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per il login con password.
- `avatarUrl`: URL dell'avatar dell'utente memorizzato per la sincronizzazione del profilo e gli aggiornamenti di `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione all'avvio.
- `encryption`: abilita E2EE.
- `allowlistOnly`: quando è `true`, aggiorna la policy delle stanze `open` a `allowlist` e forza tutte le policy DM attive tranne `disabled` (incluse `pairing` e `open`) a `allowlist`. Non influisce sulle policy `disabled`.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` oppure `"mentions"`).
- `groupPolicy`: `open`, `allowlist` oppure `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico di stanza. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `historyLimit`: numero massimo di messaggi della stanza da includere come contesto della cronologia del gruppo. Fa fallback a `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disabilitare.
- `replyToMode`: `off`, `first`, `all` oppure `batched`.
- `markdown`: configurazione facoltativa del rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `"partial"`, `"quiet"`, `true` oppure `false`. `"partial"` e `true` abilitano aggiornamenti bozza preview-first con normali messaggi di testo Matrix. `"quiet"` usa avvisi di anteprima senza notifica per configurazioni self-hosted con regole push. `false` equivale a `"off"`.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi assistant completati mentre lo streaming della bozza di anteprima è attivo.
- `threadReplies`: `off`, `inbound` oppure `always`.
- `threadBindings`: override per canale per l'instradamento e il ciclo di vita delle sessioni associate ai thread.
- `startupVerification`: modalità automatica di richiesta di auto-verifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione del blocco dei messaggi in uscita in caratteri (si applica quando `chunkMode` è `length`).
- `chunkMode`: `length` divide i messaggi in base al numero di caratteri; `newline` divide ai confini di riga.
- `responsePrefix`: stringa facoltativa anteposta a tutte le risposte in uscita per questo canale.
- `ackReaction`: override facoltativo della reazione ack per questo canale/account.
- `ackReactionScope`: override facoltativo dell'ambito della reazione ack (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità di notifica delle reazioni in ingresso (`own`, `off`).
- `mediaMaxMb`: limite dimensione media in MB per invii in uscita ed elaborazione dei media in ingresso.
- `autoJoin`: policy di auto-join degli inviti (`always`, `allowlist`, `off`). Predefinito: `off`. Si applica a tutti gli inviti Matrix, inclusi quelli in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitata.
- `dm`: blocco di policy DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controlla l'accesso ai DM dopo che OpenClaw è entrato nella stanza e l'ha classificata come DM. Non cambia se un invito viene accettato automaticamente.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `dm.sessionScope`: `per-user` (predefinito) oppure `per-room`. Usa `per-room` quando vuoi che ogni stanza DM Matrix mantenga un contesto separato anche se il peer è lo stesso.
- `dm.threadReplies`: override della policy dei thread solo per DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di primo livello sia per il posizionamento delle risposte sia per l'isolamento della sessione nei DM.
- `execApprovals`: consegna nativa delle approvazioni exec di Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Facoltativo quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: override per-account con nome. I valori di primo livello `channels.matrix` agiscono come valori predefiniti per queste voci.
- `groups`: mappa di policy per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati a runtime. L'identità della sessione/del gruppo usa l'ID stanza stabile dopo la risoluzione.
- `groups.<room>.account`: limita una voce stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: override a livello stanza per i mittenti bot configurati (`true` oppure `"mentions"`).
- `groups.<room>.users`: allowlist di mittenti per stanza.
- `groups.<room>.tools`: override di autorizzazione/negazione dei tool per stanza.
- `groups.<room>.autoReply`: override a livello stanza per il mention-gating. `true` disabilita il requisito di menzione per quella stanza; `false` lo forza di nuovo.
- `groups.<room>.skills`: filtro Skills facoltativo a livello stanza.
- `groups.<room>.systemPrompt`: snippet facoltativo di system prompt a livello stanza.
- `rooms`: alias legacy di `groups`.
- `actions`: gating per-action dei tool (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Channels Overview](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento della chat di gruppo e mention-gating
- [Channel Routing](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Security](/it/gateway/security) — modello di accesso e hardening
