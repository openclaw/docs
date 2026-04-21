---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto del bot Telegram, capacità e configurazione
title: Telegram
x-i18n:
    generated_at: "2026-04-21T08:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c70775b55d4923a31ad8bae7f4c6e7cbae754c05c3a578180d63db2b59e39a
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Stato: pronto per la produzione per DM bot + gruppi tramite grammY. Il long polling è la modalità predefinita; la modalità Webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è l'abbinamento.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Modelli ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e avvia una chat con **@BotFather** (verifica che l'handle sia esattamente `@BotFather`).

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
    Telegram **non** usa `openclaw channels login telegram`; configura il token in config/env, quindi avvia il gateway.

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
    Aggiungi il bot al tuo gruppo, quindi imposta `channels.telegram.groups` e `groupPolicy` in base al tuo modello di accesso.
  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token è consapevole dell'account. In pratica, i valori della config prevalgono sul fallback env, e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità del gruppo">
    I bot Telegram usano per impostazione predefinita la **Modalità privacy**, che limita i messaggi di gruppo che ricevono.

    Se il bot deve vedere tutti i messaggi del gruppo, puoi:

    - disattivare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la modalità privacy, rimuovi e riaggiungi il bot in ogni gruppo in modo che Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Permessi del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi del gruppo, il che è utile per comportamenti di gruppo sempre attivi.

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

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla validazione della config.
    La configurazione richiede solo ID utente numerici.
    Se hai aggiornato e la tua config contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist del pairing-store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID `allowFrom` numerici espliciti per mantenere durevole la policy di accesso nella config (invece di dipendere dalle precedenti approvazioni di abbinamento).

    Confusione comune: l'approvazione dell'abbinamento DM non significa "questo mittente è autorizzato ovunque".
    L'abbinamento concede solo l'accesso DM. L'autorizzazione dei mittenti nei gruppi continua a provenire da allowlist esplicite nella config.
    Se vuoi "sono autorizzato una volta e funzionano sia i DM sia i comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Invia un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno riservato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Policy di gruppo e allowlist">
    Si applicano insieme due controlli:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna config `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli sull'ID del gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci in `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` è usato per il filtraggio dei mittenti nei gruppi. Se non è impostato, Telegram usa come fallback `allowFrom`.
    Le voci di `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione dei mittenti.
    Confine di sicurezza (`2026.2.25+`): l'autorizzazione dei mittenti nei gruppi **non** eredita le approvazioni del pairing-store dei DM.
    L'abbinamento resta solo per i DM. Per i gruppi, imposta `groupAllowFrom` oppure `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram usa come fallback `allowFrom` della config, non il pairing store.
    Modello pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione in `channels.telegram.groups`.
    Nota di runtime: se `channels.telegram` manca completamente, il runtime usa come predefinito fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

    Esempio: consenti qualsiasi membro in uno specifico gruppo:

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

    Esempio: consenti solo utenti specifici in uno specifico gruppo:

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

      - Inserisci ID negativi di gruppi o supergruppi Telegram come `-1001234567890` in `channels.telegram.groups`.
      - Inserisci ID utente Telegram come `8734062810` in `groupAllowFrom` quando vuoi limitare quali persone all'interno di un gruppo consentito possono attivare il bot.
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

    Attivazioni dei comandi a livello di sessione:

    - `/activation always`
    - `/activation mention`

    Questi aggiornano solo lo stato della sessione. Usa la config per la persistenza.

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

    Ottenere l'ID della chat di gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona `getUpdates` della Bot API

  </Tab>
</Tabs>

## Comportamento di runtime

- Telegram è gestito dal processo gateway.
- L'instradamento è deterministico: le risposte in ingresso da Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'involucro canale condiviso con metadati di risposta e segnaposto per i media.
- Le sessioni di gruppo sono isolate per ID gruppo. I topic del forum aggiungono `:topic:<threadId>` per mantenere i topic isolati.
- I messaggi DM possono includere `message_thread_id`; OpenClaw li instrada con chiavi di sessione consapevoli del thread e conserva l'ID thread per le risposte.
- Il long polling usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del sink runner usa `agents.defaults.maxConcurrent`.
- I riavvii del watchdog del long polling si attivano dopo 120 secondi senza liveness completata di `getUpdates` per impostazione predefinita. Aumenta `channels.telegram.pollingStallThresholdMs` solo se la tua distribuzione continua a vedere falsi riavvii per stallo del polling durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Anteprima streaming live (modifiche dei messaggi)">
    OpenClaw può trasmettere in streaming risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` corrisponde a `partial` su Telegram (compatibilità con la denominazione tra canali)
    - i valori legacy `channels.telegram.streamMode` e booleani `streaming` vengono mappati automaticamente

    Per risposte solo testuali:

    - DM: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale sul posto (nessun secondo messaggio)
    - gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale sul posto (nessun secondo messaggio)

    Per risposte complesse (per esempio payload media), OpenClaw torna alla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming di anteprima è separato dallo streaming block. Quando lo streaming block è esplicitamente abilitato per Telegram, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

    Se il trasporto draft nativo non è disponibile/viene rifiutato, OpenClaw usa automaticamente come fallback `sendMessage` + `editMessageText`.

    Stream di ragionamento solo Telegram:

    - `/reasoning stream` invia il ragionamento all'anteprima live durante la generazione
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo stile Markdown viene renderizzato in HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene escapato per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw riprova come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu dei comandi Telegram viene gestita all'avvio con `setMyCommands`.

    Valori predefiniti dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci personalizzate al menu dei comandi:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Crea un'immagine" },
      ],
    },
  },
}
```

    Regole:

    - i nomi sono normalizzati (rimuove `/` iniziale, minuscolo)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente il comportamento
    - i comandi plugin/Skills possono comunque funzionare se digitati anche se non mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, i built-in vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram è ancora in overflow dopo il trimming; riduci i comandi plugin/Skills/personalizzati oppure disabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di abbinamento del dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera un codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/scope)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione trasporta un token bootstrap a breve durata. Il built-in bootstrap handoff mantiene il token del node primario con `scopes: []`; qualsiasi token operatore trasferito resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli di scope bootstrap hanno prefisso di ruolo, quindi quell'allowlist operatore soddisfa solo le richieste operatore; i ruoli non operatore richiedono comunque scope sotto il proprio prefisso di ruolo.

    Se un dispositivo ritenta con dettagli di autenticazione cambiati (per esempio ruolo/scope/chiave pubblica), la precedente richiesta in sospeso viene sostituita e la nuova richiesta usa un `requestId` diverso. Esegui di nuovo `/pair pending` prima di approvare.

    Maggiori dettagli: [Abbinamento](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Il legacy `capabilities: ["inlineButtons"]` corrisponde a `inlineButtons: "all"`.

    Esempio di azione messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Scegli un'opzione:",
  buttons: [
    [
      { text: "Sì", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Annulla", callback_data: "cancel" }],
  ],
}
```

    I clic di callback vengono passati all'agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni messaggio Telegram per agenti e automazione">
    Le azioni tool Telegram includono:

    - `sendMessage` (`to`, `content`, facoltativi `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, facoltativi `iconColor`, `iconCustomEmojiId`)

    Le azioni messaggio del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle `channels.telegram.actions.*` separati.
    Gli invii a runtime usano lo snapshot attivo di config/secrets (avvio/ricarica), quindi i percorsi di azione non eseguono una nuova risoluzione ad hoc di SecretRef per ogni invio.

    Semantica della rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato la richiesta
    - `[[reply_to:<id>]]` risponde a uno specifico ID messaggio Telegram

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic del forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione del topic aggiungono `:topic:<threadId>`
    - le risposte e la digitazione sono indirizzate al thread del topic
    - percorso config del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic Generale (`threadId=1`):

    - gli invii dei messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà del topic: le voci del topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo del topic e non eredita dai valori predefiniti del gruppo.

    **Instradamento agente per topic**: ogni topic può instradare a un agente diverso impostando `agentId` nella config del topic. Questo fornisce a ogni topic il proprio workspace, memoria e sessione isolati. Esempio:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topic Generale → agente main
                "3": { agentId: "zu" },        // Topic Dev → agente zu
                "5": { agentId: "coder" }      // Revisione codice → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Ogni topic ha quindi la propria chiave di sessione: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding ACP persistente del topic**: i topic del forum possono fissare sessioni harness ACP tramite binding ACP tipizzati di primo livello:

    - `bindings[]` con `type: "acp"` e `match.channel: "telegram"`

    Esempio:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Questo è attualmente limitato ai topic del forum in gruppi e supergruppi.

    **Avvio ACP vincolato al thread dalla chat**:

    - `/acp spawn <agent> --thread here|auto` può associare il topic Telegram corrente a una nuova sessione ACP.
    - I successivi messaggi nel topic vengono instradati direttamente alla sessione ACP associata (non è richiesto `/acp steer`).
    - OpenClaw fissa nel topic il messaggio di conferma dello spawn dopo un binding riuscito.
    - Richiede `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Il contesto del template include:

    - `MessageThreadId`
    - `IsForum`

    Comportamento thread DM:

    - le chat private con `message_thread_id` mantengono l'instradamento DM ma usano chiavi di sessione e target di risposta consapevoli del thread.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue tra note vocali e file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale

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

    Telegram distingue tra file video e video note.

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

    Le video note non supportano didascalie; l'eventuale testo del messaggio viene inviato separatamente.

    ### Sticker

    Gestione degli sticker in ingresso:

    - WEBP statico: scaricato ed elaborato (segnaposto `<media:sticker>`)
    - TGS animato: saltato
    - WEBM video: saltato

    Campi di contesto dello sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache degli sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Gli sticker vengono descritti una volta (quando possibile) e memorizzati in cache per ridurre chiamate vision ripetute.

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

    Azione per inviare uno sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cerca negli sticker in cache:

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
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitate, OpenClaw accoda eventi di sistema come:

    - `Reazione Telegram aggiunta: 👍 da Alice (@alice) al msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` significa solo reazioni degli utenti ai messaggi inviati dal bot (best-effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID thread negli aggiornamenti delle reazioni.
      - i gruppi non forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione del topic generale del gruppo (`:topic:1`), non al topic esatto di origine

    `allowed_updates` per polling/Webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di ack">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (per esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o un account.

  </Accordion>

  <Accordion title="Scritture di config da eventi e comandi Telegram">
    Le scritture della config del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione del gruppo (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
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

  <Accordion title="Long polling vs Webhook">
    Predefinito: long polling.

    Modalità Webhook:

    - imposta `channels.telegram.webhookUrl`
    - imposta `channels.telegram.webhookSecret` (obbligatorio quando è impostato l'URL Webhook)
    - `channels.telegram.webhookPath` facoltativo (predefinito `/telegram-webhook`)
    - `channels.telegram.webhookHost` facoltativo (predefinito `127.0.0.1`)
    - `channels.telegram.webhookPort` facoltativo (predefinito `8787`)

    Il listener locale predefinito per la modalità Webhook si collega a `127.0.0.1:8787`.

    Se il tuo endpoint pubblico è diverso, metti un reverse proxy davanti e punta `webhookUrl` all'URL pubblico.
    Imposta `webhookHost` (per esempio `0.0.0.0`) quando hai intenzionalmente bisogno di ingresso esterno.

  </Accordion>

  <Accordion title="Limiti, retry e target CLI">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini dei paragrafi (righe vuote) prima della divisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY).
    - `channels.telegram.pollingStallThresholdMs` ha come valore predefinito `120000`; regolalo tra `30000` e `600000` solo per falsi positivi di riavvio per stallo del polling.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` oppure `messages.groupChat.historyLimit` (predefinito 50); `0` la disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene attualmente passato così come ricevuto.
    - le allowlist Telegram servono principalmente a controllare chi può attivare l'agente, non rappresentano un confine completo di redazione del contesto supplementare.
    - controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/tool/azioni) per errori API in uscita recuperabili.

    Il target di invio CLI può essere un ID chat numerico o uno username:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    I poll Telegram usano `openclaw message poll` e supportano i topic del forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag dei poll solo Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` per i topic del forum (oppure usa un target `:topic:`)

    L'invio Telegram supporta anche:

    - `--buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come foto compresse o upload di media animati

    Gating delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii normali

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare i prompt di approvazione nella chat o nel topic di origine.

    Percorso config:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (facoltativo; usa come fallback gli ID proprietario numerici dedotti da `allowFrom` e `defaultTo` diretto quando possibile)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`

    Gli approvatori devono essere ID utente Telegram numerici. Telegram abilita automaticamente le approvazioni exec native quando `enabled` non è impostato oppure è `"auto"` e può essere risolto almeno un approvatore, da `execApprovals.approvers` oppure dalla config numerica del proprietario dell'account (`allowFrom` e `defaultTo` del messaggio diretto). Imposta `enabled: false` per disabilitare esplicitamente Telegram come client di approvazione nativo. In caso contrario, le richieste di approvazione usano come fallback altri percorsi di approvazione configurati o la policy di fallback delle approvazioni exec.

    Telegram renderizza anche i pulsanti di approvazione condivisi usati dagli altri canali chat. L'adapter nativo Telegram aggiunge soprattutto instradamento dei DM degli approvatori, fanout chat/topic e indicatori di digitazione prima della consegna.
    Quando questi pulsanti sono presenti, rappresentano la UX principale di approvazione; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato del tool indica
    che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

    Regole di consegna:

    - `target: "dm"` invia i prompt di approvazione solo ai DM degli approvatori risolti
    - `target: "channel"` invia il prompt di nuovo alla chat/topic Telegram di origine
    - `target: "both"` invia ai DM degli approvatori e alla chat/topic di origine

    Solo gli approvatori risolti possono approvare o negare. I non approvatori non possono usare `/approve` e non possono usare i pulsanti di approvazione Telegram.

    Comportamento della risoluzione delle approvazioni:

    - Gli ID con prefisso `plugin:` vengono sempre risolti tramite le approvazioni plugin.
    - Gli altri ID provano prima `exec.approval.resolve`.
    - Se Telegram è autorizzato anche per le approvazioni plugin e il gateway dice
      che l'approvazione exec è sconosciuta/scaduta, Telegram riprova una volta tramite
      `plugin.approval.resolve`.
    - I rifiuti/errori reali delle approvazioni exec non ricadono silenziosamente sulla
      risoluzione delle approvazioni plugin.

    La consegna nel canale mostra il testo del comando nella chat, quindi abilita `channel` o `both` solo in gruppi/topic fidati. Quando il prompt arriva in un topic del forum, OpenClaw conserva il topic sia per il prompt di approvazione sia per il follow-up successivo all'approvazione. Le approvazioni exec scadono dopo 30 minuti per impostazione predefinita.

    I pulsanti di approvazione inline dipendono anche dal fatto che `channels.telegram.capabilities.inlineButtons` consenta la superficie target (`dm`, `group` o `all`).

    Documentazione correlata: [Approvazioni exec](/it/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` invia un messaggio di errore amichevole nella chat. `silent` sopprime completamente le risposte di errore. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Tempo minimo tra risposte di errore alla stessa chat. Previene lo spam di errori durante le interruzioni.        |

Sono supportati override per account, gruppo e topic (con la stessa ereditarietà delle altre chiavi di configurazione Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // sopprime gli errori in questo gruppo
        },
      },
    },
  },
}
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bot non risponde ai messaggi di gruppo senza menzione">

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire piena visibilità.
      - BotFather: `/setprivacy` -> Disable
      - quindi rimuovi e riaggiungi il bot al gruppo
    - `openclaw channels status` avvisa quando la config si aspetta messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; il carattere jolly `"*"` non può essere verificato per appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando esiste `channels.telegram.groups`, il gruppo deve essere elencato (oppure includere `"*"`)
    - verifica che il bot sia membro del gruppo
    - controlla i log: `openclaw logs --follow` per i motivi di esclusione

  </Accordion>

  <Accordion title="I comandi funzionano solo in parte o non funzionano affatto">

    - autorizza la tua identità mittente (abbinamento e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy di gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi plugin/Skills/personalizzati oppure disabilita i menu nativi
    - `setMyCommands failed` con errori di rete/fetch di solito indica problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilità di polling o rete">

    - Node 22+ + fetch/proxy personalizzati possono attivare un comportamento di abort immediato se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono `api.telegram.org` prima su IPv6; un'uscita IPv6 guasta può causare errori intermittenti nelle API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness completata del long poll per impostazione predefinita.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host continua a segnalare falsi riavvii per stallo del polling. Gli stalli persistenti indicano di solito problemi di proxy, DNS, IPv6 o uscita TLS tra l'host e `api.telegram.org`.
    - Su host VPS con uscita diretta/TLS instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

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

    - Le risposte nell'intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per impostazione predefinita per i download dei media Telegram. Se un fake-IP o
      proxy trasparente fidato riscrive `api.telegram.org` verso qualche altro
      indirizzo privato/interno/special-use durante i download dei media, puoi attivare
      il bypass solo Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Lo stesso opt-in è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia prima
      disattivato il flag pericoloso. I media Telegram già consentono per impostazione predefinita
      l'intervallo benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni
      SSRF dei media Telegram. Usalo solo per ambienti proxy fidati controllati
      dall'operatore, come routing fake-IP di Clash, Mihomo o Surge, quando
      sintetizzano risposte private o special-use fuori dall'intervallo benchmark
      RFC 2544. Lascialo disattivato per il normale accesso Telegram su internet pubblico.
    </Warning>

    - Override env (temporanei):
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

Altro aiuto: [Risoluzione dei problemi del canale](/it/channels/troubleshooting).

## Puntatori al riferimento della configurazione Telegram

Riferimento principale:

- `channels.telegram.enabled`: abilita/disabilita l'avvio del canale.
- `channels.telegram.botToken`: token del bot (BotFather).
- `channels.telegram.tokenFile`: legge il token da un percorso file regolare. I symlink vengono rifiutati.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.telegram.allowFrom`: allowlist DM (ID utente Telegram numerici). `allowlist` richiede almeno un ID mittente. `open` richiede `"*"`. `openclaw doctor --fix` può risolvere voci legacy `@username` in ID e può recuperare voci allowlist dai file pairing-store nei flussi di migrazione allowlist.
- `channels.telegram.actions.poll`: abilita o disabilita la creazione di poll Telegram (predefinito: abilitato; richiede comunque `sendMessage`).
- `channels.telegram.defaultTo`: target Telegram predefinito usato dalla CLI `--deliver` quando non viene fornito un `--reply-to` esplicito.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist dei mittenti di gruppo (ID utente Telegram numerici). `openclaw doctor --fix` può risolvere voci legacy `@username` in ID. Le voci non numeriche vengono ignorate al momento dell'autenticazione. L'autenticazione di gruppo non usa il fallback del pairing-store DM (`2026.2.25+`).
- Precedenza multi-account:
  - Quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (oppure includi `channels.telegram.accounts.default`) per rendere esplicito l'instradamento predefinito.
  - Se nessuno dei due è impostato, OpenClaw usa come fallback il primo ID account normalizzato e `openclaw doctor` mostra un avviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` si applicano solo all'account `default`.
  - Gli account con nome ereditano `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando i valori a livello account non sono impostati.
  - Gli account con nome non ereditano `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: valori predefiniti per gruppo + allowlist (usa `"*"` per valori predefiniti globali).
  - `channels.telegram.groups.<id>.groupPolicy`: override per gruppo di groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: gating di menzione predefinito.
  - `channels.telegram.groups.<id>.skills`: filtro Skills (omesso = tutte le Skills, vuoto = nessuna).
  - `channels.telegram.groups.<id>.allowFrom`: override allowlist dei mittenti per gruppo.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt di sistema aggiuntivo per il gruppo.
  - `channels.telegram.groups.<id>.enabled`: disabilita il gruppo quando è `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override per topic (campi del gruppo + `agentId` solo topic).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: instrada questo topic a un agente specifico (sovrascrive l'instradamento a livello gruppo e binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override per topic di groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override per topic del gating di menzione.
- `bindings[]` di primo livello con `type: "acp"` e ID topic canonico `chatId:topic:topicId` in `match.peer.id`: campi di binding persistente del topic ACP (vedi [Agenti ACP](/it/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: instrada i topic DM a un agente specifico (stesso comportamento dei topic forum).
- `channels.telegram.execApprovals.enabled`: abilita Telegram come client di approvazione exec basato su chat per questo account.
- `channels.telegram.execApprovals.approvers`: ID utente Telegram autorizzati ad approvare o negare richieste exec. Facoltativo quando `channels.telegram.allowFrom` oppure un `channels.telegram.defaultTo` diretto identifica già il proprietario.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (predefinito: `dm`). `channel` e `both` preservano il topic Telegram di origine quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro facoltativo per ID agente per i prompt di approvazione inoltrati.
- `channels.telegram.execApprovals.sessionFilter`: filtro facoltativo per chiave sessione (sottostringa o regex) per i prompt di approvazione inoltrati.
- `channels.telegram.accounts.<account>.execApprovals`: override per account dell'instradamento delle approvazioni exec Telegram e dell'autorizzazione degli approvatori.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (predefinito: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override per account.
- `channels.telegram.commands.nativeSkills`: abilita/disabilita i comandi nativi Skills di Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (predefinito: `off`).
- `channels.telegram.textChunkLimit`: dimensione dei chunk in uscita (caratteri).
- `channels.telegram.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini dei paragrafi) prima del chunking per lunghezza.
- `channels.telegram.linkPreview`: attiva/disattiva le anteprime dei link per i messaggi in uscita (predefinito: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (anteprima streaming live; predefinito: `partial`; `progress` corrisponde a `partial`; `block` è compatibilità legacy della modalità anteprima). L'anteprima streaming Telegram usa un singolo messaggio di anteprima che viene modificato sul posto.
- `channels.telegram.mediaMaxMb`: limite dei media Telegram in ingresso/uscita (MB, predefinito: 100).
- `channels.telegram.retry`: policy di retry per gli helper di invio Telegram (CLI/tool/azioni) su errori API in uscita recuperabili (tentativi, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: override di Node autoSelectFamily (true=abilita, false=disabilita). Predefinito abilitato su Node 22+, con WSL2 disabilitato per impostazione predefinita.
- `channels.telegram.network.dnsResultOrder`: override dell'ordine dei risultati DNS (`ipv4first` o `verbatim`). Predefinito `ipv4first` su Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in pericoloso per ambienti fidati con fake-IP o proxy trasparente in cui i download dei media Telegram risolvono `api.telegram.org` verso indirizzi privati/interni/special-use al di fuori del range benchmark RFC 2544 consentito per impostazione predefinita.
- `channels.telegram.proxy`: URL proxy per le chiamate Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: abilita la modalità Webhook (richiede `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secret Webhook (obbligatorio quando `webhookUrl` è impostato).
- `channels.telegram.webhookPath`: percorso Webhook locale (predefinito `/telegram-webhook`).
- `channels.telegram.webhookHost`: host locale di bind Webhook (predefinito `127.0.0.1`).
- `channels.telegram.webhookPort`: porta locale di bind Webhook (predefinito `8787`).
- `channels.telegram.actions.reactions`: gating delle reazioni tool Telegram.
- `channels.telegram.actions.sendMessage`: gating degli invii di messaggi tool Telegram.
- `channels.telegram.actions.deleteMessage`: gating delle eliminazioni di messaggi tool Telegram.
- `channels.telegram.actions.sticker`: gating delle azioni sticker Telegram — invio e ricerca (predefinito: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controlla quali reazioni attivano eventi di sistema (predefinito: `own` se non impostato).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controlla la capacità di reazione dell'agente (predefinito: `minimal` se non impostato).
- `channels.telegram.errorPolicy`: `reply | silent` — controlla il comportamento delle risposte di errore (predefinito: `reply`). Supporta override per account/gruppo/topic.
- `channels.telegram.errorCooldownMs`: ms minimi tra risposte di errore alla stessa chat (predefinito: `60000`). Previene lo spam di errori durante le interruzioni.

- [Riferimento configurazione - Telegram](/it/gateway/configuration-reference#telegram)

Campi Telegram specifici ad alto segnale:

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/risposte: `replyToMode`
- streaming: `streaming` (anteprima), `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- azioni/capacità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento del canale](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
