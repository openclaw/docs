---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto per i bot Telegram, funzionalità e configurazione
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per DM dei bot e gruppi tramite grammY. La modalità predefinita è il long polling; la modalità Webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio DM predefinito per Telegram è l'associazione.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica multicanale e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e chatta con **@BotFather** (conferma che l'handle sia esattamente `@BotFather`).

    Esegui `/newbot`, segui le istruzioni e salva il token.

  </Step>

  <Step title="Configura token e criterio DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (solo account predefinito).
    Telegram **non** usa `openclaw channels login telegram`; configura il token nella config/env, poi avvia il Gateway.

  </Step>

  <Step title="Avvia il Gateway e approva il primo DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    I codici di associazione scadono dopo 1 ora.

  </Step>

  <Step title="Aggiungi il bot a un gruppo">
    Aggiungi il bot al tuo gruppo, quindi recupera entrambi gli ID necessari per l'accesso al gruppo:

    - il tuo ID utente Telegram, usato in `allowFrom` / `groupAllowFrom`
    - l'ID chat del gruppo Telegram, usato come chiave sotto `channels.telegram.groups`

    Per la prima configurazione, recupera l'ID chat del gruppo da `openclaw logs --follow`, da un bot per ID inoltrati o da `getUpdates` della Bot API. Dopo che il gruppo è stato consentito, `/whoami@<bot_username>` può confermare gli ID utente e gruppo.

    Gli ID dei supergruppi Telegram negativi che iniziano con `-100` sono ID chat di gruppo. Inseriscili sotto `channels.telegram.groups`, non sotto `groupAllowFrom`.

  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token è consapevole dell'account. In pratica, i valori di config prevalgono sul fallback env, e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità del gruppo">
    I bot Telegram usano per impostazione predefinita la **Modalità privacy**, che limita quali messaggi di gruppo ricevono.

    Se il bot deve vedere tutti i messaggi di gruppo, puoi:

    - disabilitare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la modalità privacy, rimuovi e aggiungi di nuovo il bot in ogni gruppo in modo che Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Autorizzazioni del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi di gruppo, utile per il comportamento di gruppo sempre attivo.

  </Accordion>

  <Accordion title="Toggle utili di BotFather">

    - `/setjoingroups` per consentire/negare l'aggiunta ai gruppi
    - `/setprivacy` per il comportamento di visibilità nei gruppi

  </Accordion>
</AccordionGroup>

## Controllo accessi e attivazione

<Tabs>
  <Tab title="Criterio DM">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` permette a qualsiasi account Telegram che trova o indovina lo username del bot di comandare il bot. Usalo solo per bot intenzionalmente pubblici con strumenti strettamente limitati; i bot con un solo proprietario devono usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    Nelle config multi-account, un `channels.telegram.allowFrom` di livello superiore restrittivo viene trattato come confine di sicurezza: le voci `allowFrom: ["*"]` a livello account non rendono pubblico quell'account a meno che l'allowlist effettiva dell'account continui a contenere un wildcard esplicito dopo il merge.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM e viene respinto dalla convalida della config.
    La configurazione richiede solo ID utente numerici.
    Se hai aggiornato e la tua config contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist dello store di associazione, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere il criterio di accesso durevole nella config (invece di dipendere dalle approvazioni di associazione precedenti).

    Confusione comune: l'approvazione dell'associazione DM non significa "questo mittente è autorizzato ovunque".
    L'associazione concede l'accesso DM. Se non esiste ancora un proprietario dei comandi, la prima associazione approvata imposta anche `commands.ownerAllowFrom` in modo che i comandi riservati al proprietario e le approvazioni exec abbiano un account operatore esplicito.
    L'autorizzazione del mittente nei gruppi proviene comunque dalle allowlist esplicite in config.
    Se vuoi "sono autorizzato una volta e funzionano sia i DM sia i comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`; per i comandi riservati al proprietario, assicurati che `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Manda un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale della Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno privato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Criterio di gruppo e allowlist">
    Due controlli si applicano insieme:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna config `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli dell'ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` viene usato per filtrare i mittenti nei gruppi. Se non è impostato, Telegram ripiega su `allowFrom`.
    Le voci `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Confine di sicurezza (`2026.2.25+`): l'autenticazione dei mittenti nei gruppi **non** eredita le approvazioni dello store di associazione DM.
    L'associazione resta solo DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram ripiega su `allowFrom` della config, non sullo store di associazione.
    Pattern pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione sotto `channels.telegram.groups`.
    Nota runtime: se `channels.telegram` è completamente assente, il runtime usa come default fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` sia impostato esplicitamente.

    Configurazione di gruppo solo proprietario:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Testalo dal gruppo con `@<bot_username> ping`. I messaggi di gruppo semplici non attivano il bot mentre `requireMention: true`.

    Esempio: consentire qualsiasi membro in un gruppo specifico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Esempio: consentire solo utenti specifici all'interno di un gruppo specifico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Errore comune: `groupAllowFrom` non è una allowlist di gruppi Telegram.

      - Inserisci ID chat di gruppi o supergruppi Telegram negativi come `-1001234567890` sotto `channels.telegram.groups`.
      - Inserisci ID utente Telegram come `8734062810` sotto `groupAllowFrom` quando vuoi limitare quali persone all'interno di un gruppo consentito possono attivare il bot.
      - Usa `groupAllowFrom: ["*"]` solo quando vuoi che qualsiasi membro di un gruppo consentito possa parlare con il bot.

    </Warning>

  </Tab>

  <Tab title="Comportamento delle menzioni">
    Le risposte nei gruppi richiedono una menzione per impostazione predefinita.

    La menzione può provenire da:

    - menzione nativa `@botusername`, oppure
    - pattern di menzione in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle dei comandi a livello di sessione:

    - `/activation always`
    - `/activation mention`

    Aggiornano solo lo stato della sessione. Usa la config per la persistenza.

    Esempio di config persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Recuperare l'ID chat del gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona `getUpdates` della Bot API
    - dopo che il gruppo è consentito, esegui `/whoami@<bot_username>` se i comandi nativi sono abilitati

  </Tab>
</Tabs>

## Comportamento runtime

- Telegram è gestito dal processo Gateway.
- Il routing è deterministico: le risposte in ingresso da Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'envelope condiviso del canale con metadati di risposta, placeholder per media e contesto persistito della catena di risposte per le risposte Telegram che il Gateway ha osservato.
- Le sessioni di gruppo sono isolate per ID gruppo. Gli argomenti dei forum aggiungono `:topic:<threadId>` per mantenere isolati gli argomenti.
- I messaggi DM possono includere `message_thread_id`; OpenClaw preserva l'ID del thread per le risposte ma mantiene i DM sulla sessione piatta per impostazione predefinita. Configura `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` o una config topic corrispondente quando vuoi intenzionalmente l'isolamento delle sessioni per topic nei DM.
- Il long polling usa il runner grammY con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- Il long polling è protetto all'interno di ogni processo Gateway in modo che solo un poller attivo possa usare un token bot alla volta. Se vedi ancora conflitti `getUpdates` 409, probabilmente un altro Gateway OpenClaw, script o poller esterno sta usando lo stesso token.
- I riavvii del watchdog del long polling si attivano dopo 120 secondi senza completamento della liveness di `getUpdates` per impostazione predefinita. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment vede ancora falsi riavvii per polling bloccato durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- La Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento delle funzionalità

<AccordionGroup>
  <Accordion title="Anteprima dello stream live (modifiche dei messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` mantiene una bozza di stato modificabile per l’avanzamento degli strumenti, la cancella al completamento e invia la risposta finale come messaggio normale
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming di anteprima è attivo)
    - `streaming.preview.commandText` controlla il dettaglio command/exec all’interno di quelle righe di avanzamento degli strumenti: `raw` (predefinito, preserva il comportamento rilasciato) oppure `status` (solo etichetta dello strumento)
    - i valori legacy `channels.telegram.streamMode` e booleani `streaming` vengono rilevati; esegui `openclaw doctor --fix` per migrarli a `channels.telegram.streaming.mode`

    Gli aggiornamenti di anteprima dell’avanzamento degli strumenti sono le brevi righe di stato mostrate mentre gli strumenti sono in esecuzione, per esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione o riepiloghi di patch. Telegram li mantiene abilitati per impostazione predefinita per corrispondere al comportamento rilasciato di OpenClaw da `v2026.4.22` e versioni successive. Per mantenere l’anteprima modificata per il testo della risposta ma nascondere le righe di avanzamento degli strumenti, imposta:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Per mantenere visibile l’avanzamento degli strumenti ma nascondere il testo command/exec, imposta:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Usa la modalità `progress` quando vuoi un avanzamento degli strumenti visibile senza modificare la risposta finale in quello stesso messaggio. Inserisci la policy del testo dei comandi sotto `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Usa `streaming.mode: "off"` solo quando vuoi la consegna solo finale: le modifiche dell’anteprima Telegram sono disabilitate e il normale brusio di strumenti/avanzamento viene soppresso invece di essere inviato come messaggi di stato autonomi. Le richieste di approvazione, i payload multimediali e gli errori passano comunque tramite la normale consegna finale. Usa `streaming.preview.toolProgress: false` quando vuoi solo mantenere le modifiche dell’anteprima della risposta nascondendo le righe di stato dell’avanzamento degli strumenti.

    <Note>
      Le risposte con citazione selezionata di Telegram sono l’eccezione. Quando `replyToMode` è `"first"`, `"all"` o `"batched"` e il messaggio in ingresso include testo di citazione selezionato, OpenClaw invia la risposta finale tramite il percorso nativo di risposta con citazione di Telegram invece di modificare l’anteprima della risposta, quindi `streaming.preview.toolProgress` non può mostrare le brevi righe di stato per quel turno. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming di anteprima. Imposta `replyToMode: "off"` quando la visibilità dell’avanzamento degli strumenti conta più delle risposte con citazione native, oppure imposta `streaming.preview.toolProgress: false` per riconoscere il compromesso.
    </Note>

    Per le risposte solo testo:

    - anteprime brevi in DM/gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue la modifica finale sul posto
    - i testi finali lunghi che si dividono in più messaggi Telegram riutilizzano, quando possibile, l’anteprima esistente come primo frammento finale, quindi inviano solo i frammenti rimanenti
    - i testi finali in modalità progress cancellano la bozza di stato e usano la normale consegna finale invece di modificare la bozza nella risposta
    - se la modifica finale fallisce prima che il testo completato sia confermato, OpenClaw usa la normale consegna finale e pulisce l’anteprima obsoleta

    Per le risposte complesse (per esempio payload multimediali), OpenClaw ripiega sulla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming di anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è abilitato esplicitamente per Telegram, OpenClaw salta il flusso di anteprima per evitare un doppio streaming.

    Streaming del ragionamento solo per Telegram:

    - `/reasoning stream` invia il ragionamento all’anteprima live durante la generazione
    - l’anteprima del ragionamento viene eliminata dopo la consegna finale; usa `/reasoning on` quando il ragionamento deve rimanere visibile
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo in stile Markdown viene renderizzato in HTML sicuro per Telegram.
    - L’HTML grezzo del modello viene sottoposto a escape per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l’HTML analizzato, OpenClaw ritenta come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu comandi di Telegram viene gestita all’avvio con `setMyCommands`.

    Impostazioni predefinite dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci di menu per comandi personalizzati:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Regole:

    - i nomi sono normalizzati (rimozione dello `/` iniziale, lettere minuscole)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente un comportamento
    - i comandi plugin/skill possono comunque funzionare quando digitati anche se non mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram è ancora andato oltre il limite dopo il trimming; riduci i comandi plugin/skill/personalizzati oppure disabilita `channels.telegram.commands.native`.
    - il fallimento di `deleteWebhook`, `deleteMyCommands` o `setMyCommands` con `404: Not Found` mentre i comandi curl diretti della Bot API funzionano può significare che `channels.telegram.apiRoot` è stato impostato sull’endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la radice della Bot API, e `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token del bot configurato. Aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con il token BotFather corrente; OpenClaw si arresta prima del polling, quindi questo non viene segnalato come errore di pulizia del Webhook.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione dispositivo (Plugin `device-pair`)

    Quando il Plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell’app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/scopes)
    4. approva la richiesta:
       - `/pair approve <requestId>` per l’approvazione esplicita
       - `/pair approve` quando c’è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione trasporta un token di bootstrap di breve durata. Il passaggio di consegne bootstrap integrato mantiene il token del nodo primario a `scopes: []`; qualsiasi token operatore passato resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli degli scope di bootstrap hanno il prefisso del ruolo, quindi quella allowlist operatore soddisfa solo le richieste operatore; i ruoli non operatore richiedono comunque scope sotto il proprio prefisso di ruolo.

    Se un dispositivo ritenta con dettagli di autenticazione modificati (per esempio ruolo/scopes/chiave pubblica), la precedente richiesta in sospeso viene sostituita e la nuova richiesta usa un `requestId` diverso. Riesegui `/pair pending` prima di approvare.

    Maggiori dettagli: [Associazione](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Pulsanti inline">
    Configura l’ambito della tastiera inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Override per account:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Ambiti:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predefinito)

    Il legacy `capabilities: ["inlineButtons"]` viene mappato a `inlineButtons: "all"`.

    Esempio di azione messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    I clic callback vengono passati all’agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni dei messaggi Telegram per agenti e automazione">
    Le azioni degli strumenti Telegram includono:

    - `sendMessage` (`to`, `content`, opzionale `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opzionale `iconColor`, `iconCustomEmojiId`)

    Le azioni dei messaggi del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle `channels.telegram.actions.*` separati.
    Gli invii a runtime usano lo snapshot di configurazione/segreti attivo (avvio/ricaricamento), quindi i percorsi delle azioni non eseguono una nuova risoluzione SecretRef ad hoc per ogni invio.

    Semantica di rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell’output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato l’operazione
    - `[[reply_to:<id>]]` risponde a un ID messaggio Telegram specifico

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Quando il threading delle risposte è abilitato e il testo o la didascalia originale di Telegram è disponibile, OpenClaw include automaticamente un estratto di citazione nativo Telegram. Telegram limita il testo della citazione nativa a 1024 unità di codice UTF-16, quindi i messaggi più lunghi vengono citati dall’inizio e ripiegano su una risposta semplice se Telegram rifiuta la citazione.

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic dei forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione topic aggiungono `:topic:<threadId>`
    - risposte e digitazione prendono di mira il thread del topic
    - percorso di configurazione del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic generale (`threadId=1`):

    - gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo per topic e non eredita dai valori predefiniti del gruppo.

    **Routing agente per topic**: ogni topic può instradare a un agente diverso impostando `agentId` nella configurazione del topic. Questo assegna a ciascun topic workspace, memoria e sessione isolati propri. Esempio:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Ogni argomento ha quindi la propria chiave di sessione: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding persistente dell'argomento ACP**: gli argomenti dei forum possono fissare le sessioni dell'harness ACP tramite binding ACP tipizzati di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un id qualificato per argomento come `-1001234567890:topic:42`). Attualmente limitato agli argomenti dei forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa l'argomento corrente a una nuova sessione ACP; i follow-up vengono instradati direttamente lì. OpenClaw fissa la conferma di spawn nell'argomento. Richiede che `channels.telegram.threadBindings.spawnSessions` resti abilitato (predefinito: `true`).

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono per impostazione predefinita l'instradamento DM e i metadati di risposta su sessioni piatte; usano chiavi di sessione consapevoli dei thread solo quando sono configurate con `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` o una configurazione di argomento corrispondente. Usa `channels.telegram.dm.threadReplies` di primo livello per l'impostazione predefinita dell'account, oppure `direct.<chatId>.threadReplies` per un singolo DM.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue le note vocali dai file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale
    - le trascrizioni delle note vocali in ingresso sono inserite nel contesto dell'agente come testo generato da macchina
      e non attendibile; il rilevamento delle menzioni usa comunque la trascrizione grezza, quindi i messaggi vocali filtrati dalle menzioni continuano a funzionare.

    Esempio di azione messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Messaggi video

    Telegram distingue i file video dalle note video.

    Esempio di azione messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Le note video non supportano didascalie; il testo del messaggio fornito viene inviato separatamente.

    ### Sticker

    Gestione degli sticker in ingresso:

    - WEBP statico: scaricato ed elaborato (placeholder `<media:sticker>`)
    - TGS animato: ignorato
    - WEBM video: ignorato

    Campi del contesto sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File della cache sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Gli sticker vengono descritti una volta (quando possibile) e memorizzati nella cache per ridurre le chiamate ripetute alla visione.

    Abilita le azioni sticker:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Azione di invio sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cerca sticker nella cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifiche delle reazioni">
    Le reazioni di Telegram arrivano come aggiornamenti `message_reaction` (separate dai payload dei messaggi).

    Quando è abilitato, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` significa solo reazioni degli utenti ai messaggi inviati dal bot (best-effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso di Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID thread negli aggiornamenti delle reazioni.
      - i gruppi non forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione dell'argomento generale del gruppo (`:topic:1`), non all'esatto argomento di origine

    `allowed_updates` per polling/webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di ack">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (per esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Scritture di configurazione da eventi e comandi Telegram">
    Le scritture della configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione dei gruppi (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede l'abilitazione del comando)

    Disabilita:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    L'impostazione predefinita è il long polling. Per la modalità webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; facoltativi `webhookPath`, `webhookHost`, `webhookPort` (predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    In modalità long polling OpenClaw mantiene la watermark di riavvio solo dopo che un aggiornamento è stato dispatchato con successo. Se un handler fallisce, quell'aggiornamento resta ritentabile nello stesso processo e non viene scritto come completato per la deduplicazione al riavvio.

    Il listener locale si associa a `127.0.0.1:8787`. Per l'ingresso pubblico, metti un reverse proxy davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità webhook convalida le guardie della richiesta, il token segreto di Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw elabora poi l'aggiornamento in modo asincrono tramite le stesse corsie bot per chat/per argomento usate dal long polling, così i turni lenti dell'agente non trattengono l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, nuovi tentativi e target CLI">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini di paragrafo (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.mediaGroupFlushMs` (predefinito 500) controlla per quanto tempo gli album/gruppi di media Telegram vengono bufferizzati prima che OpenClaw li dispatchi come un unico messaggio in ingresso. Aumentalo se le parti dell'album arrivano in ritardo; diminuiscilo per ridurre la latenza delle risposte agli album.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY). I client bot limitano i valori configurati sotto la guardia di 60 secondi per le richieste di testo/typing in uscita, così grammY non interrompe la consegna visibile della risposta prima che la guardia di trasporto e il fallback di OpenClaw possano essere eseguiti. Il long polling usa comunque una guardia di richiesta `getUpdates` di 45 secondi, così i poll inattivi non vengono abbandonati indefinitamente.
    - `channels.telegram.pollingStallThresholdMs` è predefinito a `120000`; regolalo tra `30000` e `600000` solo per riavvii da stallo di polling falsi positivi.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene normalizzato in una finestra di contesto conversazione selezionata quando il gateway ha osservato i messaggi genitore; la cache dei messaggi osservati viene mantenuta accanto allo store delle sessioni. Telegram include negli aggiornamenti solo un `reply_to_message` superficiale, quindi le catene più vecchie della cache sono limitate al payload di aggiornamento corrente di Telegram.
    - le allowlist di Telegram controllano principalmente chi può attivare l'agente, non costituiscono un confine completo di redazione del contesto supplementare.
    - Controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili. Anche la consegna della risposta finale in ingresso usa un nuovo tentativo safe-send limitato per errori Telegram pre-connessione, ma non ritenta envelope di rete ambigue post-invio che potrebbero duplicare messaggi visibili.

    I target di invio della CLI e degli strumenti messaggio possono essere ID chat numerico, username o un target di argomento forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    I poll Telegram usano `openclaw message poll` e supportano gli argomenti forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag di poll solo Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` per gli argomenti forum (oppure usa un target `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare in quella chat
    - `--force-document` per inviare immagini, GIF e video in uscita come documenti invece che come foto compresse, media animati o caricamenti video

    Gating delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii regolari

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare prompt nella chat o nell'argomento di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (ripiega sugli ID owner numerici da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può parlare con il bot e dove invia le risposte normali. Non rendono qualcuno un approvatore exec. Il primo abbinamento DM approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora un owner dei comandi, quindi la configurazione con un solo owner continua a funzionare senza duplicare gli ID sotto `execApprovals.approvers`.

    La consegna nel canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/argomenti attendibili. Quando il prompt arriva in un argomento forum, OpenClaw conserva l'argomento per il prompt di approvazione e il follow-up. Le approvazioni exec scadono per impostazione predefinita dopo 30 minuti.

    I pulsanti di approvazione inline richiedono inoltre che `channels.telegram.capabilities.inlineButtons` consenta la superficie target (`dm`, `group` o `all`). Gli ID approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni dei Plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l’agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell’errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                    |
| ----------------------------------- | ----------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore amichevole alla chat. `silent` sopprime del tutto le risposte di errore. |
| `channels.telegram.errorCooldownMs` | numero (ms)       | `60000`     | Tempo minimo tra le risposte di errore alla stessa chat. Evita lo spam di errori durante le interruzioni. |

Sono supportate sostituzioni per account, gruppo e topic (stessa ereditarietà delle altre chiavi di configurazione di Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Bot does not respond to non mention group messages">

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire la visibilità completa.
      - BotFather: `/setprivacy` -> Disable
      - poi rimuovi e riaggiungi il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID di gruppo numerici espliciti; il carattere jolly `"*"` non può essere verificato tramite probe di appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l’appartenenza del bot al gruppo
    - esamina i log: `openclaw logs --follow` per i motivi di esclusione

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - autorizza la tua identità mittente (associazione e/o `allowFrom` numerico)
    - l’autorizzazione dei comandi si applica comunque anche quando la policy del gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi di Plugin/skill/personalizzati o disabilita i menu nativi
    - Le chiamate di avvio `deleteMyCommands` / `setMyCommands` e le chiamate di digitazione `sendChatAction` sono limitate e ritentano una volta tramite il fallback di trasporto di Telegram in caso di timeout della richiesta. Errori persistenti di rete/fetch di solito indicano problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` è un errore di autenticazione Telegram per il token del bot configurato.
    - Ricopia o rigenera il token del bot in BotFather, quindi aggiorna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` per l’account predefinito.
    - Anche `deleteWebhook 401 Unauthorized` durante l’avvio è un errore di autenticazione; trattarlo come “nessun webhook esistente” rimanderebbe solo lo stesso errore di token non valido alle chiamate API successive.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + fetch/proxy personalizzato può attivare un comportamento di abort immediato se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un egress IPv6 non funzionante può causare errori intermittenti dell’API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora ritenta questi errori come errori di rete recuperabili.
    - Durante l’avvio del polling, OpenClaw riusa il probe `getMe` di avvio riuscito per grammY, così il runner non ha bisogno di un secondo `getMe` prima del primo `getUpdates`.
    - Se `deleteWebhook` fallisce con un errore di rete transitorio durante l’avvio del polling, OpenClaw passa comunque al long polling invece di effettuare un’altra chiamata control-plane pre-polling. Un webhook ancora attivo emerge come conflitto `getUpdates`; OpenClaw quindi ricostruisce il trasporto Telegram e ritenta la pulizia del webhook.
    - Se i socket Telegram vengono riciclati con una cadenza fissa breve, controlla se `channels.telegram.timeoutSeconds` è basso; i client bot vincolano i valori configurati sotto le guardie delle richieste in uscita e `getUpdates`, ma le versioni precedenti potevano interrompere ogni poll o risposta quando questo valore era impostato sotto tali guardie.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness completata del long poll per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account di polling in esecuzione non ha completato `getUpdates` dopo il periodo di grazia di avvio, quando un account webhook in esecuzione non ha completato `setWebhook` dopo il periodo di grazia di avvio, o quando l’ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host segnala comunque falsi riavvii per stallo del polling. Stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o egress TLS tra l’host e `api.telegram.org`.
    - Telegram rispetta anche le variabili env proxy di processo per il trasporto Bot API, incluse `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le rispettive varianti minuscole. `NO_PROXY` / `no_proxy` possono comunque bypassare `api.telegram.org`.
    - Se il proxy gestito da OpenClaw è configurato tramite `OPENCLAW_PROXY_URL` per un ambiente di servizio e non è presente alcuna variabile env proxy standard, Telegram usa quell’URL anche per il trasporto Bot API.
    - Su host VPS con egress/TLS diretto instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ imposta per impostazione predefinita `autoSelectFamily=true` (tranne WSL2). L’ordine dei risultati DNS di Telegram rispetta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, poi `channels.telegram.network.dnsResultOrder`, poi il predefinito del processo come `NODE_OPTIONS=--dns-result-order=ipv4first`; se nessuno si applica, Node 22+ ripiega su `ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte dell’intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per i download multimediali di Telegram per impostazione predefinita. Se un fake-IP affidabile o
      un proxy trasparente riscrive `api.telegram.org` verso qualche altro
      indirizzo privato/interno/a uso speciale durante i download multimediali, puoi aderire
      al bypass solo per Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La stessa adesione è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host multimediali di Telegram in `198.18.x.x`, lascia prima disattivato
      il flag pericoloso. I media Telegram consentono già l’intervallo
      benchmark RFC 2544 per impostazione predefinita.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF
      dei media Telegram. Usalo solo per ambienti proxy affidabili controllati dall’operatore
      come il routing fake-IP di Clash, Mihomo o Surge quando sintetizzano
      risposte private o a uso speciale fuori dall’intervallo benchmark RFC 2544.
      Lascialo disattivato per il normale accesso Telegram su internet pubblico.
    </Warning>

    - Sostituzioni di ambiente (temporanee):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Convalida le risposte DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Altro aiuto: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo degli accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comandi/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/risposte: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- radice API personalizzata: `apiRoot` (solo radice Bot API; non includere `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- azioni/capacità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedenza multi-account: quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (o includi `channels.telegram.accounts.default`) per rendere esplicito il routing predefinito. Altrimenti OpenClaw ripiega sul primo ID account normalizzato e `openclaw doctor` avvisa. Gli account denominati ereditano `channels.telegram.allowFrom` / `groupAllowFrom`, ma non i valori `accounts.default.*`.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    Associa un utente Telegram al gateway.
  </Card>
  <Card title="Groups" icon="users" href="/it/channels/groups">
    Comportamento della allowlist per gruppi e topic.
  </Card>
  <Card title="Channel routing" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Security" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e topic agli agenti.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-canale.
  </Card>
</CardGroup>
