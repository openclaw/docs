---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto, funzionalità e configurazione dei bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:48:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per DM e gruppi di bot tramite grammY. Il long polling è la modalità predefinita; la modalità webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è l'abbinamento.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e playbook di riparazione.
  </Card>
  <Card title="Configurazione Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e chatta con **@BotFather** (conferma che l'handle sia esattamente `@BotFather`).

    Esegui `/newbot`, segui le istruzioni e salva il token.

  </Step>

  <Step title="Configura token e policy DM">

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
    Telegram **non** usa `openclaw channels login telegram`; configura il token in config/env, poi avvia il gateway.

  </Step>

  <Step title="Avvia il gateway e approva il primo DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    I codici di abbinamento scadono dopo 1 ora.

  </Step>

  <Step title="Aggiungi il bot a un gruppo">
    Aggiungi il bot al tuo gruppo, poi ottieni entrambi gli ID necessari per l'accesso al gruppo:

    - il tuo ID utente Telegram, usato in `allowFrom` / `groupAllowFrom`
    - l'ID chat del gruppo Telegram, usato come chiave sotto `channels.telegram.groups`

    Per la prima configurazione, ottieni l'ID chat del gruppo da `openclaw logs --follow`, da un bot per ID inoltrati o da Bot API `getUpdates`. Dopo che il gruppo è stato consentito, `/whoami@<bot_username>` può confermare gli ID utente e gruppo.

    Gli ID negativi dei supergruppi Telegram che iniziano con `-100` sono ID chat di gruppo. Inseriscili sotto `channels.telegram.groups`, non sotto `groupAllowFrom`.

  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token tiene conto dell'account. In pratica, i valori di configurazione prevalgono sul fallback env, e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità nei gruppi">
    I bot Telegram usano per impostazione predefinita la **Modalità Privacy**, che limita i messaggi di gruppo che ricevono.

    Se il bot deve vedere tutti i messaggi di gruppo, puoi:

    - disabilitare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la modalità privacy, rimuovi e riaggiungi il bot in ogni gruppo, così Telegram applica la modifica.

  </Accordion>

  <Accordion title="Permessi di gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi di gruppo, il che è utile per comportamenti di gruppo sempre attivi.

  </Accordion>

  <Accordion title="Opzioni BotFather utili">

    - `/setjoingroups` per consentire/negare l'aggiunta ai gruppi
    - `/setprivacy` per il comportamento di visibilità nei gruppi

  </Accordion>
</AccordionGroup>

## Controllo accessi e attivazione

<Tabs>
  <Tab title="Policy DM">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` consente a qualsiasi account Telegram che trovi o indovini il nome utente del bot di comandare il bot. Usalo solo per bot intenzionalmente pubblici con strumenti strettamente limitati; i bot con un solo proprietario dovrebbero usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    Nelle configurazioni multi-account, un `channels.telegram.allowFrom` restrittivo di livello superiore viene trattato come un limite di sicurezza: le voci `allowFrom: ["*"]` a livello di account non rendono pubblico quell'account, a meno che l'allowlist effettiva dell'account contenga ancora un wildcard esplicito dopo l'unione.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla convalida della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai aggiornato e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist dello store di abbinamento, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (ad esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per i bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere la policy di accesso durevole nella configurazione (invece di dipendere da approvazioni di abbinamento precedenti).

    Confusione comune: l'approvazione dell'abbinamento DM non significa "questo mittente è autorizzato ovunque".
    L'abbinamento concede l'accesso ai DM. Se non esiste ancora un proprietario dei comandi, il primo abbinamento approvato imposta anche `commands.ownerAllowFrom`, così i comandi riservati al proprietario e le approvazioni exec hanno un account operatore esplicito.
    L'autorizzazione del mittente nei gruppi deriva comunque da allowlist esplicite nella configurazione.
    Se vuoi "sono autorizzato una volta e funzionano sia i DM sia i comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`; per i comandi riservati al proprietario, assicurati che `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Invia un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale della Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno privato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Criterio di gruppo e liste consentite">
    Due controlli si applicano insieme:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna configurazione `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli dell'ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci `groups` (o `"*"`)
       - `groups` configurato: agisce come lista consentita (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` viene usato per filtrare i mittenti nei gruppi. Se non è impostato, Telegram ripiega su `allowFrom`.
    Le voci `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` vengono normalizzati).
    Non inserire ID chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi vanno sotto `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Confine di sicurezza (`2026.2.25+`): l'autenticazione del mittente del gruppo **non** eredita le approvazioni dell'archivio di abbinamento DM.
    L'abbinamento resta solo per i DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per argomento.
    Se `groupAllowFrom` non è impostato, Telegram ripiega sulla configurazione `allowFrom`, non sull'archivio di abbinamento.
    Schema pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione sotto `channels.telegram.groups`.
    Nota di runtime: se `channels.telegram` manca completamente, il runtime usa per impostazione predefinita il fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

    Configurazione di gruppo solo per il proprietario:

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

    Provalo dal gruppo con `@<bot_username> ping`. I semplici messaggi di gruppo non attivano il bot quando `requireMention: true`.

    Esempio: consenti qualsiasi membro in un gruppo specifico:

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

    Esempio: consenti solo utenti specifici all'interno di un gruppo specifico:

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
      Errore comune: `groupAllowFrom` non è una lista consentita di gruppi Telegram.

      - Inserisci ID chat negativi di gruppi o supergruppi Telegram come `-1001234567890` sotto `channels.telegram.groups`.
      - Inserisci ID utente Telegram come `8734062810` sotto `groupAllowFrom` quando vuoi limitare quali persone all'interno di un gruppo consentito possono attivare il bot.
      - Usa `groupAllowFrom: ["*"]` solo quando vuoi che qualsiasi membro di un gruppo consentito possa parlare con il bot.

    </Warning>

  </Tab>

  <Tab title="Comportamento delle menzioni">
    Le risposte nei gruppi richiedono una menzione per impostazione predefinita.

    La menzione può provenire da:

    - menzione nativa `@botusername`, oppure
    - schemi di menzione in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Commutatori dei comandi a livello di sessione:

    - `/activation always`
    - `/activation mention`

    Questi aggiornano solo lo stato della sessione. Usa la configurazione per la persistenza.

    Esempio di configurazione persistente:

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

    Ottenere l'ID chat del gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona `getUpdates` della Bot API
    - dopo che il gruppo è consentito, esegui `/whoami@<bot_username>` se i comandi nativi sono abilitati

  </Tab>
</Tabs>

## Comportamento del runtime

- Telegram è di proprietà del processo Gateway.
- L'instradamento è deterministico: le risposte in ingresso da Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'involucro di canale condiviso con metadati di risposta, segnaposto multimediali e contesto persistito della catena di risposte per le risposte Telegram che il gateway ha osservato.
- Le sessioni di gruppo sono isolate per ID gruppo. Gli argomenti dei forum aggiungono `:topic:<threadId>` per mantenere isolati gli argomenti.
- I messaggi DM possono contenere `message_thread_id`; OpenClaw conserva l'ID del thread per le risposte ma mantiene i DM sulla sessione piatta per impostazione predefinita. Configura `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` o una configurazione di argomento corrispondente quando vuoi intenzionalmente l'isolamento delle sessioni per argomento nei DM.
- Il polling lungo usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- Il polling lungo è protetto all'interno di ciascun processo Gateway in modo che un solo poller attivo possa usare un token bot alla volta. Se vedi ancora conflitti `getUpdates` 409, probabilmente un altro Gateway OpenClaw, script o poller esterno sta usando lo stesso token.
- I riavvii del watchdog del polling lungo si attivano dopo 120 secondi senza completamento della vitalità di `getUpdates` per impostazione predefinita. Aumenta `channels.telegram.pollingStallThresholdMs` solo se la tua distribuzione vede ancora falsi riavvii per stallo del polling durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportate override per account.
- La Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento delle funzionalità

<AccordionGroup>
  <Accordion title="Anteprima dello stream live (modifiche dei messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/argomenti: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` mantiene una bozza di stato modificabile per l'avanzamento degli strumenti, la cancella al completamento e invia la risposta finale come messaggio normale
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming dell'anteprima è attivo)
    - `streaming.preview.commandText` controlla i dettagli di comando/exec dentro quelle righe di avanzamento degli strumenti: `raw` (predefinito, preserva il comportamento rilasciato) o `status` (solo etichetta dello strumento)
    - i valori legacy `channels.telegram.streamMode` e booleani `streaming` vengono rilevati; esegui `openclaw doctor --fix` per migrarli a `channels.telegram.streaming.mode`

    Gli aggiornamenti di anteprima dell'avanzamento degli strumenti sono le brevi righe di stato mostrate mentre gli strumenti sono in esecuzione, per esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione o riepiloghi di patch. Telegram li mantiene abilitati per impostazione predefinita per corrispondere al comportamento rilasciato di OpenClaw da `v2026.4.22` e versioni successive. Per mantenere l'anteprima modificata per il testo della risposta ma nascondere le righe di avanzamento degli strumenti, imposta:

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

    Per mantenere visibile l'avanzamento degli strumenti ma nascondere il testo di comando/exec, imposta:

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

    Usa la modalità `progress` quando vuoi un avanzamento degli strumenti visibile senza modificare la risposta finale dentro quello stesso messaggio. Inserisci la policy del testo dei comandi sotto `streaming.progress`:

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

    Usa `streaming.mode: "off"` solo quando vuoi la consegna esclusivamente finale: le modifiche dell'anteprima Telegram sono disabilitate e il chatter generico di strumenti/avanzamento viene soppresso invece di essere inviato come messaggi di stato autonomi. Le richieste di approvazione, i payload multimediali e gli errori continuano a passare tramite la normale consegna finale. Usa `streaming.preview.toolProgress: false` quando vuoi soltanto mantenere le modifiche dell'anteprima della risposta nascondendo le righe di stato dell'avanzamento degli strumenti.

    <Note>
      Le risposte con citazione selezionata di Telegram sono l'eccezione. Quando `replyToMode` è `"first"`, `"all"` o `"batched"` e il messaggio in ingresso include testo di citazione selezionato, OpenClaw invia la risposta finale tramite il percorso nativo di risposta con citazione di Telegram invece di modificare l'anteprima della risposta, quindi `streaming.preview.toolProgress` non può mostrare le brevi righe di stato per quel turno. Le risposte al messaggio corrente senza testo di citazione selezionato continuano a mantenere lo streaming dell'anteprima. Imposta `replyToMode: "off"` quando la visibilità dell'avanzamento degli strumenti conta più delle risposte con citazione native, oppure imposta `streaming.preview.toolProgress: false` per accettare il compromesso.
    </Note>

    Per risposte solo testo:

    - anteprime brevi in DM/gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue la modifica finale sul posto
    - i finali di testo lunghi che vengono divisi in più messaggi Telegram riutilizzano l'anteprima esistente come primo frammento finale quando possibile, poi inviano solo i frammenti rimanenti
    - i finali in modalità progress cancellano la bozza di stato e usano la normale consegna finale invece di modificare la bozza nella risposta
    - se la modifica finale fallisce prima che il testo completato sia confermato, OpenClaw usa la normale consegna finale e pulisce l'anteprima obsoleta

    Per risposte complesse (per esempio payload multimediali), OpenClaw ripiega sulla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming dell'anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è abilitato esplicitamente per Telegram, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

    Stream di reasoning solo Telegram:

    - `/reasoning stream` invia il reasoning all'anteprima live durante la generazione
    - l'anteprima del reasoning viene eliminata dopo la consegna finale; usa `/reasoning on` quando il reasoning deve rimanere visibile
    - la risposta finale viene inviata senza testo di reasoning

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo simile a Markdown viene renderizzato in HTML sicuro per Telegram.
    - I tag HTML supportati da Telegram vengono preservati; l'HTML non supportato viene sottoposto a escape.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw riprova come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu dei comandi Telegram viene gestita all'avvio con `setMyCommands`.

    Valori predefiniti dei comandi nativi:

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

    - i nomi vengono normalizzati (rimozione dello `/` iniziale, minuscole)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente un comportamento
    - i comandi di Plugin/skill possono comunque funzionare quando vengono digitati, anche se non sono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/di Plugin possono comunque registrarsi se configurati.

    Errori di configurazione comuni:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram ha comunque superato il limite dopo il trimming; riduci i comandi di Plugin/skill/personalizzati o disabilita `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` o `setMyCommands` non riusciti con `404: Not Found` mentre i comandi curl diretti della Bot API funzionano possono significare che `channels.telegram.apiRoot` è stato impostato sull'endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la radice della Bot API, e `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token bot configurato. Aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con il token BotFather corrente; OpenClaw si ferma prima del polling, quindi questo non viene segnalato come errore di pulizia del Webhook.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione dispositivo (Plugin `device-pair`)

    Quando il Plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/scopes)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione trasporta un token di bootstrap di breve durata. L'handoff di bootstrap integrato mantiene il token del Node primario a `scopes: []`; qualsiasi token operatore passato rimane limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli dello scope di bootstrap hanno prefisso di ruolo, quindi quella allowlist operatore soddisfa solo richieste operatore; i ruoli non operatore hanno comunque bisogno di scope sotto il proprio prefisso di ruolo.

    Se un dispositivo ritenta con dettagli di autenticazione cambiati (per esempio ruolo/scopes/chiave pubblica), la precedente richiesta in sospeso viene sostituita e la nuova richiesta usa un `requestId` diverso. Riesegui `/pair pending` prima di approvare.

    Altri dettagli: [Associazione](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Pulsanti inline">
    Configura lo scope della tastiera inline:

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

    Scope:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predefinito)

    Legacy `capabilities: ["inlineButtons"]` mappa a `inlineButtons: "all"`.

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

    I clic di callback vengono passati all'agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni dei messaggi Telegram per agenti e automazione">
    Le azioni degli strumenti Telegram includono:

    - `sendMessage` (`to`, `content`, opzionale `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opzionale `iconColor`, `iconCustomEmojiId`)

    Le azioni dei messaggi di canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle `channels.telegram.actions.*` separati.
    Gli invii runtime usano lo snapshot di configurazione/segreti attivo (avvio/ricarica), quindi i percorsi delle azioni non eseguono una nuova risoluzione SecretRef ad hoc per ogni invio.

    Semantica di rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio attivante
    - `[[reply_to:<id>]]` risponde a un ID messaggio Telegram specifico

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Quando il threading delle risposte è abilitato e il testo o la didascalia Telegram originale è disponibile, OpenClaw include automaticamente un estratto di citazione Telegram nativo. Telegram limita il testo di citazione nativo a 1024 unità di codice UTF-16, quindi i messaggi più lunghi vengono citati dall'inizio e ripiegano su una risposta semplice se Telegram rifiuta la citazione.

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic dei forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione dei topic aggiungono `:topic:<threadId>`
    - le risposte e la digitazione hanno come destinazione il thread del topic
    - percorso di configurazione del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic generale (`threadId=1`):

    - gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci dei topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo del topic e non eredita dai valori predefiniti del gruppo.

    **Routing agente per topic**: ogni topic può instradare a un agente diverso impostando `agentId` nella configurazione del topic. Questo dà a ogni topic il proprio workspace, memoria e sessione isolati. Esempio:

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

    Ogni topic ha quindi la propria chiave di sessione: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Associazione persistente dei topic ACP**: i topic del forum possono fissare le sessioni dell'harness ACP tramite associazioni ACP tipizzate di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un ID qualificato per topic come `-1001234567890:topic:42`). Attualmente l'ambito è limitato ai topic del forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa il topic corrente a una nuova sessione ACP; i follow-up vengono instradati direttamente lì. OpenClaw fissa la conferma dello spawn nel topic. Richiede che `channels.telegram.threadBindings.spawnSessions` rimanga abilitato (predefinito: `true`).

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono per impostazione predefinita l'instradamento DM e i metadati di risposta su sessioni piatte; usano chiavi di sessione consapevoli del thread solo quando configurate con `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` o una configurazione di topic corrispondente. Usa `channels.telegram.dm.threadReplies` di primo livello per il valore predefinito dell'account, oppure `direct.<chatId>.threadReplies` per un DM.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue tra note vocali e file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale
    - le trascrizioni delle note vocali in ingresso sono incorniciate come testo generato da macchina,
      non attendibile, nel contesto dell'agente; il rilevamento delle menzioni usa comunque la trascrizione
      grezza, quindi i messaggi vocali filtrati per menzione continuano a funzionare.

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

    Telegram distingue tra file video e note video.

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

    Le note video non supportano le didascalie; il testo del messaggio fornito viene inviato separatamente.

    ### Sticker

    Gestione degli sticker in ingresso:

    - WEBP statico: scaricato ed elaborato (placeholder `<media:sticker>`)
    - TGS animato: saltato
    - WEBM video: saltato

    Campi del contesto sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File della cache sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Gli sticker vengono descritti una volta (quando possibile) e memorizzati nella cache per ridurre le chiamate visive ripetute.

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

  <Accordion title="Notifiche di reazione">
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitato, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` indica solo le reazioni degli utenti ai messaggi inviati dal bot (best effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso di Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID di thread negli aggiornamenti delle reazioni.
      - i gruppi non-forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione del topic generale del gruppo (`:topic:1`), non al topic esatto di origine

    `allowed_updates` per polling/webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni ack">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (per esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o un account.

  </Accordion>

  <Accordion title="Scritture di configurazione da eventi e comandi Telegram">
    Le scritture della configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione dei gruppi (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede l'abilitazione dei comandi)

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
    Il valore predefinito è il long polling. Per la modalità webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opzionali `webhookPath`, `webhookHost`, `webhookPort` (predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    In modalità long polling, OpenClaw persiste il proprio watermark di riavvio solo dopo che un aggiornamento viene inviato correttamente. Se un handler fallisce, quell'aggiornamento rimane ritentabile nello stesso processo e non viene scritto come completato per la deduplicazione al riavvio.

    Il listener locale si associa a `127.0.0.1:8787`. Per l'ingresso pubblico, metti un reverse proxy davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità webhook valida le protezioni della richiesta, il token segreto Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw elabora poi l'aggiornamento in modo asincrono tramite le stesse corsie bot per chat/per topic usate dal long polling, quindi i turni lenti dell'agente non bloccano l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, tentativi e target CLI">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini dei paragrafi (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.mediaGroupFlushMs` (predefinito 500) controlla per quanto tempo gli album/gruppi media di Telegram vengono bufferizzati prima che OpenClaw li invii come un unico messaggio in ingresso. Aumentalo se parti dell'album arrivano in ritardo; diminuiscilo per ridurre la latenza delle risposte agli album.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il predefinito di grammY). I client bot limitano i valori configurati sotto la protezione di 60 secondi per richieste di testo/typing in uscita, così grammY non interrompe la consegna visibile della risposta prima che la protezione di trasporto e il fallback di OpenClaw possano eseguire. Il long polling usa comunque una protezione di 45 secondi per la richiesta `getUpdates`, così i poll inattivi non vengono abbandonati indefinitamente.
    - `channels.telegram.pollingStallThresholdMs` ha valore predefinito `120000`; regolalo tra `30000` e `600000` solo per riavvii da stallo del polling falsi positivi.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene normalizzato in una finestra di contesto conversazionale selezionata quando il Gateway ha osservato i messaggi padre; la cache dei messaggi osservati viene persistita accanto allo store di sessione. Telegram include negli aggiornamenti solo un `reply_to_message` superficiale, quindi le catene più vecchie della cache sono limitate al payload di aggiornamento corrente di Telegram.
    - Le allowlist Telegram controllano principalmente chi può attivare l'agente, non sono un confine completo di redazione del contesto supplementare.
    - Controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili. Anche la consegna della risposta finale in ingresso usa un safe-send retry limitato per errori Telegram prima della connessione, ma non ritenta envelope di rete ambigui dopo l'invio che potrebbero duplicare messaggi visibili.

    I target di invio della CLI e dello strumento messaggi possono essere un ID chat numerico, un nome utente o un target di topic forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    I poll Telegram usano `openclaw message poll` e supportano i topic forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag dei poll solo per Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` per i topic forum (oppure usa un target `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare in quella chat
    - `--force-document` per inviare immagini, GIF e video in uscita come documenti invece che come foto compressa, media animato o caricamenti video

    Controllo delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii regolari

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può opzionalmente pubblicare prompt nella chat o nel topic di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (ripiega sugli ID owner numerici da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può parlare con il bot e dove invia le risposte normali. Non rendono qualcuno un approvatore exec. Il primo abbinamento DM approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora alcun proprietario dei comandi, quindi la configurazione con un solo owner funziona comunque senza duplicare gli ID in `execApprovals.approvers`.

    La consegna sul canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/topic attendibili. Quando il prompt arriva in un topic forum, OpenClaw conserva il topic per il prompt di approvazione e per il follow-up. Le approvazioni exec scadono per impostazione predefinita dopo 30 minuti.

    I pulsanti di approvazione inline richiedono anche che `channels.telegram.capabilities.inlineButtons` consenta la superficie target (`dm`, `group` o `all`). Gli ID di approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni Plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente riscontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                           |
| ----------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore amichevole alla chat. `silent` sopprime del tutto le risposte di errore. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | Tempo minimo tra risposte di errore alla stessa chat. Previene lo spam di errori durante le interruzioni. |

Sono supportati override per account, per gruppo e per argomento (stessa ereditarietà delle altre chiavi di configurazione Telegram).

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
  <Accordion title="Il bot non risponde ai messaggi di gruppo senza menzione">

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire visibilità completa.
      - BotFather: `/setprivacy` -> Disabilita
      - quindi rimuovi e aggiungi di nuovo il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID di gruppo numerici espliciti; il wildcard `"*"` non può essere verificato tramite probing dell'appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l'appartenenza del bot al gruppo
    - esamina i log: `openclaw logs --follow` per i motivi di skip

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o non funzionano affatto">

    - autorizza l'identità del mittente (associazione e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy del gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci comandi plugin/skill/personalizzati oppure disabilita i menu nativi
    - le chiamate di avvio `deleteMyCommands` / `setMyCommands` e le chiamate di digitazione `sendChatAction` sono limitate e riprovano una volta tramite il fallback di trasporto di Telegram in caso di timeout della richiesta. Errori persistenti di rete/fetch di solito indicano problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="L'avvio segnala token non autorizzato">

    - `getMe returned 401` è un errore di autenticazione Telegram per il token del bot configurato.
    - Ricopia o rigenera il token del bot in BotFather, quindi aggiorna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` per l'account predefinito.
    - Anche `deleteWebhook 401 Unauthorized` durante l'avvio è un errore di autenticazione; trattarlo come "nessun webhook esistente" rinvierebbe soltanto lo stesso errore di token non valido alle chiamate API successive.

  </Accordion>

  <Accordion title="Instabilità di polling o rete">

    - Node 22+ + fetch/proxy personalizzato può attivare un comportamento di abort immediato se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un egress IPv6 non funzionante può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Durante l'avvio del polling, OpenClaw riutilizza il probe `getMe` di avvio riuscito per grammY, così il runner non deve eseguire un secondo `getMe` prima del primo `getUpdates`.
    - Se `deleteWebhook` fallisce con un errore di rete transitorio durante l'avvio del polling, OpenClaw continua con il long polling invece di effettuare un'altra chiamata di control plane prima del polling. Un webhook ancora attivo emerge come conflitto di `getUpdates`; OpenClaw quindi ricostruisce il trasporto Telegram e ritenta la pulizia del webhook.
    - Se i socket Telegram vengono riciclati con una cadenza fissa breve, controlla se `channels.telegram.timeoutSeconds` è basso; i client bot limitano i valori configurati sotto le guardie delle richieste in uscita e `getUpdates`, ma le versioni precedenti potevano interrompere ogni poll o risposta quando questo valore era impostato sotto tali guardie.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness di long-poll completata per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account di polling in esecuzione non ha completato `getUpdates` dopo il periodo di grazia dell'avvio, quando un account webhook in esecuzione non ha completato `setWebhook` dopo il periodo di grazia dell'avvio, oppure quando l'ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host segnala ancora falsi riavvii per stallo del polling. Stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o egress TLS tra l'host e `api.telegram.org`.
    - Telegram rispetta anche le env proxy del processo per il trasporto Bot API, incluse `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le relative varianti minuscole. `NO_PROXY` / `no_proxy` può comunque bypassare `api.telegram.org`.
    - Se il proxy gestito da OpenClaw è configurato tramite `OPENCLAW_PROXY_URL` per un ambiente di servizio e non è presente alcuna env proxy standard, Telegram usa quell'URL anche per il trasporto Bot API.
    - Su host VPS con egress/TLS diretto instabile, instrada le chiamate all'API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa per impostazione predefinita `autoSelectFamily=true` (eccetto WSL2). L'ordine dei risultati DNS di Telegram rispetta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, poi `channels.telegram.network.dnsResultOrder`, poi il predefinito del processo come `NODE_OPTIONS=--dns-result-order=ipv4first`; se nessuno si applica, Node 22+ ripiega su `ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte dell'intervallo di benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per i download dei media Telegram per impostazione predefinita. Se un fake-IP attendibile o
      un proxy trasparente riscrive `api.telegram.org` verso qualche altro
      indirizzo privato/interno/a uso speciale durante i download dei media, puoi attivare
      il bypass solo per Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Lo stesso opt-in è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia prima disattivato
      il flag pericoloso. I media Telegram consentono già per impostazione predefinita
      l'intervallo di benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF
      dei media Telegram. Usalo solo per ambienti proxy attendibili e controllati dagli operatori,
      come il routing fake-IP di Clash, Mihomo o Surge, quando sintetizzano risposte private
      o a uso speciale al di fuori dell'intervallo di benchmark RFC 2544.
      Lascialo disattivato per il normale accesso Telegram su internet pubblico.
    </Warning>

    - Override di ambiente (temporanei):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Valida le risposte DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Altro aiuto: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="Campi Telegram ad alto segnale">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo degli accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/risposte: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API personalizzata: `apiRoot` (solo root Bot API; non includere `/bot<TOKEN>`)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- azioni/capacità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedenza multi-account: quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (o includi `channels.telegram.accounts.default`) per rendere esplicito il routing predefinito. Altrimenti OpenClaw ripiega sul primo ID account normalizzato e `openclaw doctor` avvisa. Gli account nominati ereditano `channels.telegram.allowFrom` / `groupAllowFrom`, ma non i valori `accounts.default.*`.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associa un utente Telegram al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento della allowlist di gruppi e argomenti.
  </Card>
  <Card title="Routing dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e rafforzamento.
  </Card>
  <Card title="Routing multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e argomenti agli agenti.
  </Card>
  <Card title="Risoluzione dei problemi" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali.
  </Card>
</CardGroup>
