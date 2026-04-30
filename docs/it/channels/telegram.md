---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto, funzionalità e configurazione del bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-04-30T16:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d18ca6c7ab39d7d34848c562857661501d8364329f6e5a266213aa23846047dd
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per DM e gruppi di bot tramite grammY. La modalità predefinita è il long polling; la modalità Webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è l'associazione.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e chatta con **@BotFather** (verifica che l'handle sia esattamente `@BotFather`).

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
    Telegram **non** usa `openclaw channels login telegram`; configura il token nella configurazione/env, poi avvia il gateway.

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
    Aggiungi il bot al tuo gruppo, poi imposta `channels.telegram.groups` e `groupPolicy` in modo che corrispondano al tuo modello di accesso.
  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token è consapevole dell'account. In pratica, i valori di configurazione prevalgono sul fallback env e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità nei gruppi">
    I bot Telegram usano per impostazione predefinita la **Modalità privacy**, che limita quali messaggi dei gruppi ricevono.

    Se il bot deve vedere tutti i messaggi dei gruppi:

    - disabilita la modalità privacy tramite `/setprivacy`, oppure
    - rendi il bot amministratore del gruppo.

    Quando cambi la modalità privacy, rimuovi e aggiungi di nuovo il bot in ogni gruppo in modo che Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Autorizzazioni del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi del gruppo, il che è utile per comportamenti di gruppo sempre attivi.

  </Accordion>

  <Accordion title="Toggle utili di BotFather">

    - `/setjoingroups` per consentire/negare l'aggiunta ai gruppi
    - `/setprivacy` per il comportamento di visibilità nei gruppi

  </Accordion>
</AccordionGroup>

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Policy DM">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` consente a qualsiasi account Telegram che trovi o indovini il nome utente del bot di comandare il bot. Usalo solo per bot intenzionalmente pubblici con strumenti strettamente limitati; i bot con un solo proprietario dovrebbero usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    Nelle configurazioni multi-account, un `channels.telegram.allowFrom` restrittivo di livello superiore è trattato come confine di sicurezza: le voci `allowFrom: ["*"]` a livello di account non rendono pubblico quell'account a meno che l'allowlist effettiva dell'account non contenga ancora un wildcard esplicito dopo il merge.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai aggiornato e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist del pairing store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per i bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere la policy di accesso durevole nella configurazione (invece di dipendere da approvazioni di associazione precedenti).

    Confusione comune: l'approvazione dell'associazione DM non significa "questo mittente è autorizzato ovunque".
    L'associazione concede l'accesso DM. Se non esiste ancora un proprietario dei comandi, la prima associazione approvata imposta anche `commands.ownerAllowFrom` in modo che i comandi riservati al proprietario e le approvazioni exec abbiano un account operatore esplicito.
    L'autorizzazione del mittente nei gruppi deriva comunque dalle allowlist esplicite nella configurazione.
    Se vuoi "sono autorizzato una volta e funzionano sia i DM sia i comandi nei gruppi", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`; per i comandi riservati al proprietario, assicurati che `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Invia un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno privato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Policy di gruppo e allowlist">
    Si applicano insieme due controlli:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna configurazione `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli sugli ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` è usato per filtrare i mittenti nei gruppi. Se non è impostato, Telegram ripiega su `allowFrom`.
    Le voci `groupAllowFrom` dovrebbero essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche sono ignorate per l'autorizzazione del mittente.
    Confine di sicurezza (`2026.2.25+`): l'autenticazione del mittente nei gruppi **non** eredita le approvazioni del pairing store DM.
    L'associazione rimane solo DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram ripiega sulla configurazione `allowFrom`, non sul pairing store.
    Pattern pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione in `channels.telegram.groups`.
    Nota runtime: se `channels.telegram` manca completamente, il runtime usa per impostazione predefinita `groupPolicy="allowlist"` fail-closed, a meno che `channels.defaults.groupPolicy` sia impostato esplicitamente.

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

    Esempio: consentire solo utenti specifici dentro un gruppo specifico:

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
      Errore comune: `groupAllowFrom` non è un'allowlist di gruppi Telegram.

      - Inserisci gli ID chat negativi di gruppi o supergruppi Telegram, come `-1001234567890`, in `channels.telegram.groups`.
      - Inserisci gli ID utente Telegram, come `8734062810`, in `groupAllowFrom` quando vuoi limitare quali persone dentro un gruppo consentito possono attivare il bot.
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

  </Tab>
</Tabs>

## Comportamento runtime

- Telegram è di proprietà del processo Gateway.
- Il routing è deterministico: i messaggi in ingresso da Telegram ricevono risposta su Telegram (il modello non sceglie i canali).
- I messaggi in ingresso sono normalizzati nell'envelope di canale condiviso con metadati di risposta e placeholder per i media.
- Le sessioni di gruppo sono isolate per ID gruppo. I topic dei forum aggiungono `:topic:<threadId>` per mantenere isolati i topic.
- I messaggi DM possono includere `message_thread_id`; OpenClaw li instrada con chiavi di sessione consapevoli del thread e conserva l'ID thread per le risposte.
- Il long polling usa il runner grammY con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- Il long polling è protetto dentro ogni processo Gateway in modo che un solo poller attivo possa usare un token bot alla volta. Se vedi ancora conflitti `getUpdates` 409, è probabile che un altro Gateway OpenClaw, script o poller esterno stia usando lo stesso token.
- I riavvii del watchdog del long polling si attivano per impostazione predefinita dopo 120 secondi senza liveness `getUpdates` completata. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment vede ancora falsi riavvii per stallo del polling durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- La Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento delle funzionalità

<AccordionGroup>
  <Accordion title="Anteprima stream live (modifiche dei messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` mappa a `partial` su Telegram (compatibilità con la denominazione tra canali)
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumenti/progresso riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming di anteprima è attivo)
    - i valori legacy `channels.telegram.streamMode` e booleani `streaming` vengono rilevati; esegui `openclaw doctor --fix` per migrarli a `channels.telegram.streaming.mode`

    Gli aggiornamenti di anteprima del progresso degli strumenti sono le brevi righe "Working..." mostrate mentre gli strumenti sono in esecuzione, per esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione o riepiloghi di patch. Telegram li mantiene abilitati per impostazione predefinita per corrispondere al comportamento rilasciato di OpenClaw da `v2026.4.22` e versioni successive. Per mantenere l'anteprima modificata per il testo della risposta ma nascondere le righe di progresso degli strumenti, imposta:

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

    Usa `streaming.mode: "off"` solo quando vuoi una consegna solo finale: le modifiche di anteprima Telegram sono disabilitate e il chatter generico di strumenti/progresso viene soppresso invece di essere inviato come messaggi "Working..." autonomi. Prompt di approvazione, payload multimediali ed errori continuano a passare dalla normale consegna finale. Usa `streaming.preview.toolProgress: false` quando vuoi solo mantenere le modifiche di anteprima della risposta nascondendo le righe di stato del progresso degli strumenti.

    Per risposte di solo testo:

    - anteprime brevi per DM/gruppi/argomenti: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale sul posto
    - anteprime più vecchie di circa un minuto: OpenClaw invia la risposta completata come nuovo messaggio finale e poi ripulisce l'anteprima, così il timestamp visibile di Telegram riflette l'ora di completamento invece dell'ora di creazione dell'anteprima

    Per risposte complesse (per esempio payload multimediali), OpenClaw ripiega sulla normale consegna finale e poi ripulisce il messaggio di anteprima.

    Lo streaming dell'anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è abilitato esplicitamente per Telegram, OpenClaw salta lo stream di anteprima per evitare un doppio streaming.

    Stream di ragionamento solo Telegram:

    - `/reasoning stream` invia il ragionamento all'anteprima live durante la generazione
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo simile a Markdown viene reso in HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene sottoposto a escape per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw riprova come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    La registrazione del menu comandi di Telegram viene gestita all'avvio con `setMyCommands`.

    Impostazioni predefinite dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci di menu comando personalizzate:

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

    - i nomi vengono normalizzati (rimozione di `/` iniziale, minuscole)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente alcun comportamento
    - i comandi di plugin/skill possono ancora funzionare quando vengono digitati anche se non sono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram ha ancora superato il limite dopo il taglio; riduci i comandi plugin/skill/personalizzati o disabilita `channels.telegram.commands.native`.
    - errori di `deleteWebhook`, `deleteMyCommands` o `setMyCommands` con `404: Not Found` mentre i comandi curl diretti della Bot API funzionano possono significare che `channels.telegram.apiRoot` è stato impostato sull'endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la root della Bot API, e `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token bot configurato. Aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con il token BotFather corrente; OpenClaw si arresta prima del polling, quindi questo non viene segnalato come errore di pulizia del Webhook.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/ambiti)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione contiene un token di bootstrap di breve durata. Il passaggio di bootstrap integrato mantiene il token del nodo primario a `scopes: []`; qualsiasi token operatore passato resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli degli ambiti di bootstrap sono prefissati per ruolo, quindi quella allowlist operatore soddisfa solo le richieste operatore; i ruoli non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.

    Se un dispositivo riprova con dettagli di autenticazione modificati (per esempio ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e la nuova richiesta usa un `requestId` diverso. Riesegui `/pair pending` prima di approvare.

    Maggiori dettagli: [Associazione](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    Configura l'ambito della tastiera inline:

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

    Il valore legacy `capabilities: ["inlineButtons"]` viene mappato a `inlineButtons: "all"`.

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

  <Accordion title="Telegram message actions for agents and automation">
    Le azioni tool di Telegram includono:

    - `sendMessage` (`to`, `content`, opzionale `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, opzionale `iconColor`, `iconCustomEmojiId`)

    Le azioni messaggio del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle `channels.telegram.actions.*` separati.
    Gli invii runtime usano lo snapshot di configurazione/segreti attivo (avvio/ricaricamento), quindi i percorsi delle azioni non eseguono una nuova risoluzione SecretRef ad hoc per ogni invio.

    Semantica di rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio attivante
    - `[[reply_to:<id>]]` risponde a uno specifico ID messaggio Telegram

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Quando il threading delle risposte è abilitato e il testo o la didascalia originale di Telegram è disponibile, OpenClaw include automaticamente un estratto di citazione nativo Telegram. Telegram limita il testo di citazione nativo a 1024 unità di codice UTF-16, quindi i messaggi più lunghi vengono citati dall'inizio e ripiegano su una risposta semplice se Telegram rifiuta la citazione.

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Supergruppi forum:

    - le chiavi di sessione degli argomenti aggiungono `:topic:<threadId>`
    - risposte e azioni di digitazione puntano al thread dell'argomento
    - percorso di configurazione dell'argomento:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale dell'argomento generale (`threadId=1`):

    - gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà degli argomenti: le voci argomento ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo per argomento e non eredita dai valori predefiniti del gruppo.

    **Instradamento agente per argomento**: ogni argomento può instradare a un agente diverso impostando `agentId` nella configurazione dell'argomento. Questo dà a ogni argomento il proprio workspace, la propria memoria e la propria sessione isolati. Esempio:

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

    **Binding persistente degli argomenti ACP**: gli argomenti forum possono fissare sessioni dell'harness ACP tramite binding ACP tipizzati di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un id qualificato per argomento come `-1001234567890:topic:42`). Attualmente limitato agli argomenti forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` collega l'argomento corrente a una nuova sessione ACP; i follow-up vengono instradati direttamente lì. OpenClaw fissa la conferma di spawn nell'argomento. Richiede `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono l'instradamento DM ma usano chiavi di sessione consapevoli del thread.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Messaggi audio

    Telegram distingue note vocali e file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale
    - le trascrizioni delle note vocali in ingresso sono inquadrate come testo generato da macchina,
      non attendibile nel contesto dell'agente; il rilevamento delle menzioni usa comunque la trascrizione
      grezza, quindi i messaggi vocali vincolati da menzione continuano a funzionare.

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

    Telegram distingue file video e note video.

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

    Campi di contesto sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Gli sticker vengono descritti una volta (quando possibile) e memorizzati nella cache per ridurre le chiamate vision ripetute.

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

    Cerca sticker memorizzati nella cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitato, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` indica solo le reazioni degli utenti ai messaggi inviati dal bot (best effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso di Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID dei thread negli aggiornamenti delle reazioni.
      - i gruppi non forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione dell'argomento generale del gruppo (`:topic:1`), non all'esatto argomento di origine

    `allowed_updates` per polling/webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di conferma">
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

  <Accordion title="Scritture della configurazione da eventi e comandi Telegram">
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

  <Accordion title="Long polling e webhook">
    Il valore predefinito è il long polling. Per la modalità webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opzionali `webhookPath`, `webhookHost`, `webhookPort` (valori predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    Il listener locale esegue il binding a `127.0.0.1:8787`. Per l'ingresso pubblico, inserisci un reverse proxy davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità webhook convalida le protezioni delle richieste, il token segreto di Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw elabora poi l'aggiornamento in modo asincrono tramite le stesse corsie del bot per chat/per argomento usate dal long polling, quindi i turni lenti dell'agente non bloccano l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, tentativi e destinazioni CLI">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini dei paragrafi (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita le dimensioni dei media Telegram in ingresso e in uscita.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY). I client bot con long polling limitano i valori configurati al di sotto della protezione di richiesta `getUpdates` di 45 secondi, così i poll inattivi non vengono interrotti prima del completamento della finestra di polling di 30 secondi.
    - Il valore predefinito di `channels.telegram.pollingStallThresholdMs` è `120000`; regolalo tra `30000` e `600000` solo per riavvii da stallo del polling falsi positivi.
    - La cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` la disabilita.
    - Il contesto supplementare di risposta/citazione/inoltro viene attualmente passato così come ricevuto.
    - Le allowlist di Telegram limitano principalmente chi può attivare l'agente, non sono un confine completo di redazione del contesto supplementare.
    - Controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili. Anche la consegna della risposta finale in ingresso usa un retry safe-send limitato per errori Telegram prima della connessione, ma non ritenta envelope di rete ambigui dopo l'invio che potrebbero duplicare messaggi visibili.

    La destinazione di invio CLI può essere un ID chat numerico o un nome utente:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    I sondaggi Telegram usano `openclaw message poll` e supportano gli argomenti forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag di sondaggio solo Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` per gli argomenti forum (oppure usa una destinazione `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare messaggi in quella chat
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come foto compresse o caricamenti di media animati

    Controllo delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i sondaggi
    - `channels.telegram.actions.poll=false` disabilita la creazione di sondaggi Telegram lasciando abilitati gli invii normali

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta approvazioni exec nei DM degli approvatori e può opzionalmente pubblicare prompt nella chat o nell'argomento di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (fallback agli ID numerici dei proprietari da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può parlare con il bot e dove invia le risposte normali. Non rendono qualcuno un approvatore exec. Il primo abbinamento DM approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora alcun proprietario dei comandi, quindi la configurazione con un solo proprietario continua a funzionare senza duplicare gli ID in `execApprovals.approvers`.

    La consegna al canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/argomenti attendibili. Quando il prompt arriva in un argomento forum, OpenClaw conserva l'argomento per il prompt di approvazione e il seguito. Le approvazioni exec scadono per impostazione predefinita dopo 30 minuti.

    Anche i pulsanti di approvazione inline richiedono che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`). Gli ID approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                     |
| ----------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore amichevole alla chat. `silent` sopprime completamente le risposte di errore. |
| `channels.telegram.errorCooldownMs` | numero (ms)       | `60000`     | Tempo minimo tra risposte di errore alla stessa chat. Previene spam di errori durante interruzioni. |

Sono supportate sovrascritture per account, gruppo e argomento (stessa ereditarietà delle altre chiavi di configurazione Telegram).

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
      - poi rimuovi e riaggiungi il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; il wildcard `"*"` non può essere verificato tramite membership probe.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l'appartenenza del bot al gruppo
    - consulta i log: `openclaw logs --follow` per i motivi di skip

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o per niente">

    - autorizza la tua identità mittente (abbinamento e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy del gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi plugin/skill/personalizzati o disabilita i menu nativi
    - Le chiamate di avvio `deleteMyCommands` / `setMyCommands` sono limitate e vengono ritentate una volta tramite il fallback di trasporto di Telegram in caso di timeout della richiesta. Errori persistenti di rete/fetch di solito indicano problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="L'avvio segnala un token non autorizzato">

    - `getMe returned 401` è un errore di autenticazione Telegram per il token del bot configurato.
    - Ricopia o rigenera il token del bot in BotFather, poi aggiorna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` per l'account predefinito.
    - `deleteWebhook 401 Unauthorized` durante l'avvio è anch'esso un errore di autenticazione; trattarlo come "non esiste alcun webhook" rinvierebbe soltanto lo stesso errore di token non valido alle chiamate API successive.
    - Se `deleteWebhook` fallisce con un errore di rete transitorio durante l'avvio del polling, OpenClaw controlla `getWebhookInfo`; quando Telegram segnala un URL webhook vuoto, il polling continua perché la pulizia è già soddisfatta.

  </Accordion>

  <Accordion title="Instabilità di polling o rete">

    - Node 22+ + fetch/proxy personalizzati possono attivare un comportamento di interruzione immediata se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un egress IPv6 non funzionante può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Se i socket Telegram vengono riciclati con una cadenza fissa breve, controlla se `channels.telegram.timeoutSeconds` è basso; i client bot con long polling limitano i valori configurati sotto la guardia della richiesta `getUpdates`, ma le versioni precedenti potevano interrompere ogni polling quando questo valore era impostato sotto il timeout del long polling.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness di long polling completata per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account di polling in esecuzione non ha completato `getUpdates` dopo il periodo di tolleranza all'avvio, quando un account Webhook in esecuzione non ha completato `setWebhook` dopo il periodo di tolleranza all'avvio, o quando l'ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host segnala comunque falsi riavvii per stallo del polling. Gli stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o egress TLS tra l'host e `api.telegram.org`.
    - Telegram rispetta anche le variabili di ambiente proxy del processo per il trasporto Bot API, incluse `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le loro varianti minuscole. `NO_PROXY` / `no_proxy` possono comunque bypassare `api.telegram.org`.
    - Se il proxy gestito da OpenClaw è configurato tramite `OPENCLAW_PROXY_URL` per un ambiente di servizio e non è presente alcuna variabile di ambiente proxy standard, Telegram usa quell'URL anche per il trasporto Bot API.
    - Su host VPS con egress/TLS diretto instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa per impostazione predefinita `autoSelectFamily=true` (tranne WSL2) e `dnsResultOrder=ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte nell'intervallo di benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per i download media Telegram per impostazione predefinita. Se un fake-IP attendibile o
      un proxy trasparente riscrive `api.telegram.org` in qualche altro indirizzo
      privato/interno/a uso speciale durante i download media, puoi attivare
      il bypass solo per Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La stessa attivazione è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia prima
      disattivato il flag pericoloso. I media Telegram consentono già l'intervallo di
      benchmark RFC 2544 per impostazione predefinita.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni
      SSRF dei media Telegram. Usalo solo per ambienti proxy attendibili controllati
      dall'operatore, come il routing fake-IP di Clash, Mihomo o Surge, quando
      sintetizzano risposte private o a uso speciale fuori dall'intervallo di
      benchmark RFC 2544. Lascialo disattivato per il normale accesso Telegram
      su internet pubblico.
    </Warning>

    - Override di ambiente (temporanei):
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

## Riferimento della configurazione

Riferimento principale: [Riferimento della configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="Campi Telegram ad alta rilevanza">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo degli accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/risposte: `replyToMode`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- radice API personalizzata: `apiRoot` (solo radice Bot API; non includere `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
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
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associa un utente Telegram al gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento dell'allowlist per gruppi e argomenti.
  </Card>
  <Card title="Routing dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello delle minacce e hardening.
  </Card>
  <Card title="Routing multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e argomenti agli agenti.
  </Card>
  <Card title="Risoluzione dei problemi" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-canale.
  </Card>
</CardGroup>
