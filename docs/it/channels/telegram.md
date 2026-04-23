---
read_when:
    - Lavorare su funzionalità Telegram o webhook
summary: Stato del supporto del bot Telegram, capacità e configurazione
title: Telegram
x-i18n:
    generated_at: "2026-04-23T08:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2073245079eb48b599c4274cc620eb29211a64c5d396ffb355f7022fecec9a6
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Stato: pronto per la produzione per DM bot + gruppi tramite grammY. Il long polling è la modalità predefinita; la modalità webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è pairing.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e avvia una chat con **@BotFather** (controlla che l'handle sia esattamente `@BotFather`).

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

    I codici di pairing scadono dopo 1 ora.

  </Step>

  <Step title="Aggiungi il bot a un gruppo">
    Aggiungi il bot al tuo gruppo, poi imposta `channels.telegram.groups` e `groupPolicy` in modo che corrispondano al tuo modello di accesso.
  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token tiene conto dell'account. In pratica, i valori in config hanno la precedenza sul fallback env, e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità nei gruppi">
    I bot Telegram usano per impostazione predefinita la **Privacy Mode**, che limita i messaggi di gruppo che ricevono.

    Se il bot deve vedere tutti i messaggi del gruppo, puoi:

    - disabilitare la privacy mode tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la privacy mode, rimuovi e aggiungi di nuovo il bot in ogni gruppo, così Telegram applica la modifica.

  </Accordion>

  <Accordion title="Permessi del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi del gruppo, il che è utile per un comportamento del gruppo sempre attivo.

  </Accordion>

  <Accordion title="Comandi utili di BotFather">

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
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM e viene rifiutato dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai eseguito un upgrade e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist del pairing-store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID `allowFrom` numerici espliciti per mantenere la policy di accesso stabile in configurazione (invece di dipendere da precedenti approvazioni pairing).

    Confusione comune: l'approvazione del pairing DM non significa "questo mittente è autorizzato ovunque".
    Il pairing concede solo l'accesso DM. L'autorizzazione dei mittenti nei gruppi continua invece a provenire da allowlist esplicite in configurazione.
    Se vuoi ottenere "sono autorizzato una volta e funzionano sia i DM sia i comandi nei gruppi", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`.

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
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli sull'ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci in `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` viene usato per il filtro dei mittenti nei gruppi. Se non è impostato, Telegram usa `allowFrom` come fallback.
    Le voci di `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` vengono normalizzati).
    Non inserire ID chat di gruppo o supergruppo Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Limite di sicurezza (`2026.2.25+`): l'autorizzazione dei mittenti nei gruppi **non** eredita le approvazioni del pairing-store DM.
    Il pairing resta solo DM. Per i gruppi, imposta `groupAllowFrom` oppure `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram usa `allowFrom` della configurazione come fallback, non il pairing store.
    Pattern pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione in `channels.telegram.groups`.
    Nota runtime: se `channels.telegram` manca completamente, il runtime usa per impostazione predefinita `groupPolicy="allowlist"` fail-closed, a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

    Esempio: consentire a qualsiasi membro in uno specifico gruppo:

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

    Esempio: consentire solo a utenti specifici all'interno di uno specifico gruppo:

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
      Errore comune: `groupAllowFrom` non è una allowlist dei gruppi Telegram.

      - Inserisci gli ID negativi di gruppi o supergruppi Telegram come `-1001234567890` in `channels.telegram.groups`.
      - Inserisci gli ID utente Telegram come `8734062810` in `groupAllowFrom` quando vuoi limitare quali persone all'interno di un gruppo consentito possono attivare il bot.
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

    Attivazioni/disattivazioni dei comandi a livello sessione:

    - `/activation always`
    - `/activation mention`

    Queste aggiornano solo lo stato della sessione. Usa la configurazione per la persistenza.

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

## Comportamento runtime

- Telegram è gestito dal processo gateway.
- Il routing è deterministico: le risposte in ingresso da Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'envelope canale condivisa con metadati di risposta e segnaposto media.
- Le sessioni di gruppo sono isolate per ID gruppo. I topic del forum aggiungono `:topic:<threadId>` per mantenere i topic isolati.
- I messaggi DM possono includere `message_thread_id`; OpenClaw li instrada con chiavi di sessione thread-aware e conserva l'ID thread per le risposte.
- Il long polling usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del sink runner usa `agents.defaults.maxConcurrent`.
- I riavvii del watchdog del long polling si attivano per impostazione predefinita dopo 120 secondi senza liveness `getUpdates` completata. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment continua a vedere falsi riavvii per stallo del polling durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Anteprima streaming live (modifiche del messaggio)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` viene mappato a `partial` su Telegram (compatibilità con la denominazione cross-channel)
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti strumento/progresso riusano lo stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi separati per strumento/progresso.
    - i valori legacy `channels.telegram.streamMode` e `streaming` booleani vengono mappati automaticamente

    Per risposte solo testo:

    - DM: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale in place (nessun secondo messaggio)
    - gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale in place (nessun secondo messaggio)

    Per risposte complesse (per esempio payload media), OpenClaw torna alla normale consegna finale e poi ripulisce il messaggio di anteprima.

    Lo streaming di anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è esplicitamente abilitato per Telegram, OpenClaw salta il flusso di anteprima per evitare uno streaming doppio.

    Se il trasporto bozza nativo non è disponibile/viene rifiutato, OpenClaw torna automaticamente a `sendMessage` + `editMessageText`.

    Stream di ragionamento solo Telegram:

    - `/reasoning stream` invia il ragionamento all'anteprima live durante la generazione
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo in stile Markdown viene renderizzato in HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene escaped per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw riprova come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu comandi Telegram viene gestita all'avvio con `setMyCommands`.

    Valori predefiniti dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci personalizzate nel menu comandi:

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

    - i nomi vengono normalizzati (rimozione della `/` iniziale, minuscolo)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente un comportamento
    - i comandi di plugin/Skills possono comunque funzionare se digitati anche se non sono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/plugin possono comunque essere registrati se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram è ancora in overflow dopo il trimming; riduci i comandi personalizzati/plugin/Skills oppure disabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che il DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di pairing del dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/ambiti)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione contiene un token bootstrap a breve durata. L'handoff bootstrap integrato mantiene il token primario del Node su `scopes: []`; qualsiasi token operatore passato in handoff resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli di ambito bootstrap sono con prefisso del ruolo, quindi quella allowlist dell'operatore soddisfa solo le richieste dell'operatore; i ruoli non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.

    Se un dispositivo ritenta con dettagli di autenticazione modificati (per esempio ruolo/ambiti/chiave pubblica), la precedente richiesta in sospeso viene sostituita e la nuova richiesta usa un `requestId` diverso. Esegui di nuovo `/pair pending` prima di approvare.

    Maggiori dettagli: [Pairing](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Pulsanti inline">
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

    I clic sui callback vengono passati all'agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni dei messaggi Telegram per agenti e automazione">
    Le azioni dello strumento Telegram includono:

    - `sendMessage` (`to`, `content`, facoltativi `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, facoltativi `iconColor`, `iconCustomEmojiId`)

    Le azioni dei messaggi del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle separati `channels.telegram.actions.*`.
    Gli invii runtime usano lo snapshot attivo di config/segreti (avvio/ricarica), quindi i percorsi azione non eseguono una nuova risoluzione ad hoc di SecretRef per ogni invio.

    Semantica di rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato l'azione
    - `[[reply_to:<id>]]` risponde a un ID messaggio Telegram specifico

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic del forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione del topic aggiungono `:topic:<threadId>`
    - risposte e digitazione puntano al thread del topic
    - percorso di configurazione del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic generale (`threadId=1`):

    - gli invii dei messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo per topic e non eredita dai valori predefiniti del gruppo.

    **Routing agente per topic**: ogni topic può instradare a un agente diverso impostando `agentId` nella configurazione del topic. Questo assegna a ogni topic il proprio workspace, memoria e sessione isolati. Esempio:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Topic generale → agente main
                "3": { agentId: "zu" },        // Topic dev → agente zu
                "5": { agentId: "coder" }      // Revisione codice → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Ogni topic ha quindi la propria chiave di sessione: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Binding persistente del topic ACP**: i topic forum possono fissare sessioni harness ACP tramite binding ACP tipizzati di livello superiore:

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

    Questo è attualmente limitato ai topic forum in gruppi e supergruppi.

    **Avvio ACP vincolato al thread dalla chat**:

    - `/acp spawn <agent> --thread here|auto` può associare il topic Telegram corrente a una nuova sessione ACP.
    - I successivi messaggi nel topic vengono instradati direttamente alla sessione ACP associata (non serve `/acp steer`).
    - OpenClaw fissa il messaggio di conferma dell'avvio nel topic dopo un binding riuscito.
    - Richiede `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Il contesto del template include:

    - `MessageThreadId`
    - `IsForum`

    Comportamento dei thread DM:

    - le chat private con `message_thread_id` mantengono il routing DM ma usano chiavi di sessione e destinazioni di risposta consapevoli del thread.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue tra note vocali e file audio.

    - predefinito: comportamento file audio
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

    Le note video non supportano didascalie; l'eventuale testo del messaggio viene inviato separatamente.

    ### Sticker

    Gestione degli sticker in ingresso:

    - WEBP statico: scaricato ed elaborato (segnaposto `<media:sticker>`)
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

    Gli sticker vengono descritti una sola volta (quando possibile) e messi in cache per ridurre le chiamate vision ripetute.

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

  <Accordion title="Notifiche di reazione">
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitate, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` significa solo reazioni degli utenti ai messaggi inviati dal bot (best-effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione continuano a rispettare i controlli di accesso Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID thread negli aggiornamenti di reazione.
      - i gruppi non forum vengono instradati alla sessione chat di gruppo
      - i gruppi forum vengono instradati alla sessione del topic generale del gruppo (`:topic:1`), non al topic di origine esatto

    `allowed_updates` per polling/webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di ack">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (per esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Scritture di configurazione da eventi e comandi Telegram">
    Le scritture della configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione del gruppo (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede l'abilitazione dei comandi)

    Disabilitare:

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

  <Accordion title="Autorizzazione del selettore modello nei gruppi">
    I pulsanti inline del selettore modello nei gruppi richiedono la stessa autorizzazione di `/models`. I partecipanti non autorizzati possono sfogliare e toccare i pulsanti, ma OpenClaw rifiuta il callback prima di cambiare il modello della sessione.
  </Accordion>

  <Accordion title="Long polling vs webhook">
    Predefinito: long polling.

    Modalità webhook:

    - imposta `channels.telegram.webhookUrl`
    - imposta `channels.telegram.webhookSecret` (obbligatorio quando è impostato un URL webhook)
    - facoltativo `channels.telegram.webhookPath` (predefinito `/telegram-webhook`)
    - facoltativo `channels.telegram.webhookHost` (predefinito `127.0.0.1`)
    - facoltativo `channels.telegram.webhookPort` (predefinito `8787`)

    Il listener locale predefinito per la modalità webhook si associa a `127.0.0.1:8787`.

    Se il tuo endpoint pubblico è diverso, inserisci un reverse proxy davanti e punta `webhookUrl` all'URL pubblico.
    Imposta `webhookHost` (per esempio `0.0.0.0`) quando hai intenzionalmente bisogno di ingress esterno.

    Il callback webhook di grammY restituisce un 200 entro 5 secondi così Telegram non ritenta gli aggiornamenti di lunga durata come timeout di lettura; il lavoro più lungo continua in background. Il polling ricostruisce il trasporto HTTP dopo conflitti `getUpdates` 409, così i tentativi usano una connessione TCP nuova invece di continuare in loop su un socket keep-alive terminato da Telegram.

  </Accordion>

  <Accordion title="Limiti, retry e destinazioni CLI">
    - il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` privilegia i confini dei paragrafi (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY).
    - `channels.telegram.pollingStallThresholdMs` ha come valore predefinito `120000`; regolalo tra `30000` e `600000` solo per falsi positivi di riavvii per stallo del polling.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` oppure `messages.groupChat.historyLimit` (predefinito 50); `0` disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene attualmente passato così come ricevuto.
    - le allowlist Telegram limitano principalmente chi può attivare l'agente, non sono un limite completo di redazione del contesto supplementare.
    - controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili.

    La destinazione di invio CLI può essere un ID chat numerico o un username:

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
    - `--thread-id` per i topic del forum (oppure usa una destinazione `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` oppure `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare in quella chat
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come foto compresse o upload di media animati

    Gating delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii regolari

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare richieste di approvazione nella chat o nel topic di origine.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (facoltativo; usa come fallback gli ID proprietario numerici dedotti da `allowFrom` e `defaultTo` diretto quando possibile)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`

    Gli approvatori devono essere ID utente Telegram numerici. Telegram abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e può essere risolto almeno un approvatore, da `execApprovals.approvers` oppure dalla configurazione numerica del proprietario dell'account (`allowFrom` e `defaultTo` del messaggio diretto). Imposta `enabled: false` per disabilitare esplicitamente Telegram come client di approvazione nativo. In caso contrario, le richieste di approvazione tornano su altre route di approvazione configurate o sulla policy di fallback delle approvazioni exec.

    Telegram renderizza anche i pulsanti di approvazione condivisi usati da altri canali chat. L'adapter Telegram nativo aggiunge soprattutto routing DM degli approvatori, fanout del canale/topic e suggerimenti di digitazione prima della consegna.
    Quando questi pulsanti sono presenti, rappresentano la UX primaria per l'approvazione; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica
    che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

    Regole di consegna:

    - `target: "dm"` invia le richieste di approvazione solo ai DM degli approvatori risolti
    - `target: "channel"` reinvia la richiesta alla chat/topic Telegram di origine
    - `target: "both"` invia sia ai DM degli approvatori sia alla chat/topic di origine

    Solo gli approvatori risolti possono approvare o negare. I non approvatori non possono usare `/approve` e non possono usare i pulsanti di approvazione Telegram.

    Comportamento di risoluzione delle approvazioni:

    - gli ID con prefisso `plugin:` vengono sempre risolti tramite approvazioni del plugin.
    - altri ID provano prima `exec.approval.resolve`.
    - se Telegram è autorizzato anche per le approvazioni del plugin e il gateway dice
      che l'approvazione exec è sconosciuta/scaduta, Telegram ritenta una volta tramite
      `plugin.approval.resolve`.
    - i rifiuti/errori reali delle approvazioni exec non ricadono in modo silenzioso nella risoluzione
      delle approvazioni del plugin.

    La consegna al canale mostra il testo del comando nella chat, quindi abilita `channel` o `both` solo in gruppi/topic attendibili. Quando la richiesta arriva in un topic del forum, OpenClaw conserva il topic sia per la richiesta di approvazione sia per il follow-up successivo all'approvazione. Le approvazioni exec scadono dopo 30 minuti per impostazione predefinita.

    I pulsanti di approvazione inline dipendono anche dal fatto che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`).

    Documentazione correlata: [Approvazioni exec](/it/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                     |
| ----------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore comprensibile alla chat. `silent` sopprime completamente le risposte di errore. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | Tempo minimo tra risposte di errore alla stessa chat. Previene spam di errori durante le interruzioni. |

Sono supportati override per account, gruppo e topic (stessa ereditarietà delle altre chiavi di configurazione Telegram).

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

    - Se `requireMention=false`, la privacy mode di Telegram deve consentire visibilità completa.
      - BotFather: `/setprivacy` -> Disabilita
      - poi rimuovi + aggiungi di nuovo il bot al gruppo
    - `openclaw channels status` avverte quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; la wildcard `"*"` non può essere verificata per membership.
    - test rapido di sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando esiste `channels.telegram.groups`, il gruppo deve essere elencato (oppure includere `"*"`)
    - verifica la presenza del bot nel gruppo
    - controlla i log: `openclaw logs --follow` per i motivi di salto

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o non funzionano affatto">

    - autorizza la tua identità mittente (pairing e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi continua ad applicarsi anche quando la policy di gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi personalizzati/plugin/Skills oppure disabilita i menu nativi
    - `setMyCommands failed` con errori di rete/fetch di solito indica problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilità del polling o della rete">

    - Node 22+ + fetch/proxy personalizzato possono attivare un comportamento di interruzione immediata se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono `api.telegram.org` prima su IPv6; un'uscita IPv6 non funzionante può causare errori intermittenti delle API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness long-poll completata, per impostazione predefinita.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host continua comunque a segnalare falsi riavvii per stallo del polling. Gli stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o uscita TLS tra l'host e `api.telegram.org`.
    - Su host VPS con uscita diretta/TLS instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa per impostazione predefinita `autoSelectFamily=true` (eccetto WSL2) e `dnsResultOrder=ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte nell'intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per impostazione predefinita per i download di media Telegram. Se un fake-IP attendibile o
      un proxy trasparente riscrive `api.telegram.org` in un altro
      indirizzo privato/interno/special-use durante i download dei media, puoi aderire
      al bypass solo Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Lo stesso opt-in è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia
      inizialmente disattivato il flag dangerous. I media Telegram consentono già per impostazione predefinita l'intervallo
      benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF dei media Telegram. Usalo solo per ambienti proxy attendibili controllati dall'operatore come Clash, Mihomo o routing fake-IP di Surge quando sintetizzano risposte private o special-use fuori dall'intervallo benchmark RFC 2544. Lascialo disattivato per il normale accesso Telegram su internet pubblico.
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

Ulteriore aiuto: [Risoluzione dei problemi del canale](/it/channels/troubleshooting).

## Puntatori al riferimento di configurazione Telegram

Riferimento principale:

- `channels.telegram.enabled`: abilita/disabilita l'avvio del canale.
- `channels.telegram.botToken`: token del bot (BotFather).
- `channels.telegram.tokenFile`: legge il token da un normale percorso file. I symlink vengono rifiutati.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.telegram.allowFrom`: allowlist DM (ID utente Telegram numerici). `allowlist` richiede almeno un ID mittente. `open` richiede `"*"`. `openclaw doctor --fix` può risolvere le voci legacy `@username` in ID e può recuperare voci allowlist dai file pairing-store nei flussi di migrazione allowlist.
- `channels.telegram.actions.poll`: abilita o disabilita la creazione di poll Telegram (predefinito: abilitato; richiede comunque `sendMessage`).
- `channels.telegram.defaultTo`: destinazione Telegram predefinita usata dalla CLI `--deliver` quando non viene fornito alcun `--reply-to` esplicito.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist dei mittenti di gruppo (ID utente Telegram numerici). `openclaw doctor --fix` può risolvere le voci legacy `@username` in ID. Le voci non numeriche vengono ignorate in fase di autenticazione. L'autenticazione di gruppo non usa il fallback del pairing-store DM (`2026.2.25+`).
- Precedenza multi-account:
  - Quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (oppure includi `channels.telegram.accounts.default`) per rendere esplicito il routing predefinito.
  - Se nessuno dei due è impostato, OpenClaw usa come fallback il primo ID account normalizzato e `openclaw doctor` emette un avviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` si applicano solo all'account `default`.
  - Gli account nominati ereditano `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando i valori a livello account non sono impostati.
  - Gli account nominati non ereditano `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: valori predefiniti per gruppo + allowlist (usa `"*"` per valori predefiniti globali).
  - `channels.telegram.groups.<id>.groupPolicy`: override per gruppo di groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: valore predefinito del gating delle menzioni.
  - `channels.telegram.groups.<id>.skills`: filtro Skills (omesso = tutte le Skills, vuoto = nessuna).
  - `channels.telegram.groups.<id>.allowFrom`: override per gruppo dell'allowlist dei mittenti.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt di sistema aggiuntivo per il gruppo.
  - `channels.telegram.groups.<id>.enabled`: disabilita il gruppo quando è `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override per topic (campi di gruppo + `agentId` solo per topic).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: instrada questo topic a un agente specifico (ha la precedenza sul routing a livello gruppo e binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override per topic di groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override per topic del gating delle menzioni.
- `bindings[]` di livello superiore con `type: "acp"` e ID topic canonico `chatId:topic:topicId` in `match.peer.id`: campi di binding persistente del topic ACP (vedi [ACP Agents](/it/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: instrada i topic DM a un agente specifico (stesso comportamento dei topic forum).
- `channels.telegram.execApprovals.enabled`: abilita Telegram come client di approvazione exec basato su chat per questo account.
- `channels.telegram.execApprovals.approvers`: ID utente Telegram autorizzati ad approvare o negare richieste exec. Facoltativo quando `channels.telegram.allowFrom` o un `channels.telegram.defaultTo` diretto identifica già il proprietario.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (predefinito: `dm`). `channel` e `both` preservano il topic Telegram di origine quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro facoltativo per ID agente per le richieste di approvazione inoltrate.
- `channels.telegram.execApprovals.sessionFilter`: filtro facoltativo per chiave di sessione (sottostringa o regex) per le richieste di approvazione inoltrate.
- `channels.telegram.accounts.<account>.execApprovals`: override per account del routing delle approvazioni exec Telegram e dell'autorizzazione degli approvatori.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (predefinito: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override per account.
- `channels.telegram.commands.nativeSkills`: abilita/disabilita i comandi nativi Skills di Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (predefinito: `off`).
- `channels.telegram.textChunkLimit`: dimensione dei chunk in uscita (caratteri).
- `channels.telegram.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini dei paragrafi) prima del chunking per lunghezza.
- `channels.telegram.linkPreview`: attiva/disattiva le anteprime dei link per i messaggi in uscita (predefinito: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (anteprima streaming live; predefinito: `partial`; `progress` viene mappato a `partial`; `block` è compatibilità legacy per la modalità anteprima). L'anteprima streaming Telegram usa un singolo messaggio di anteprima che viene modificato in place.
- `channels.telegram.streaming.preview.toolProgress`: riusa il messaggio di anteprima live per aggiornamenti strumento/progresso quando l'anteprima streaming è attiva (predefinito: `true`). Imposta `false` per mantenere messaggi separati di strumento/progresso.
- `channels.telegram.mediaMaxMb`: limite dei media Telegram in ingresso/uscita (MB, predefinito: 100).
- `channels.telegram.retry`: policy di retry per gli helper di invio Telegram (CLI/strumenti/azioni) su errori API in uscita recuperabili (tentativi, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: override di Node autoSelectFamily (true=abilita, false=disabilita). Per impostazione predefinita è abilitato su Node 22+, con WSL2 impostato come predefinito su disabilitato.
- `channels.telegram.network.dnsResultOrder`: override dell'ordine dei risultati DNS (`ipv4first` o `verbatim`). Il valore predefinito su Node 22+ è `ipv4first`.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in pericoloso per ambienti attendibili fake-IP o con proxy trasparente in cui i download dei media Telegram risolvono `api.telegram.org` in indirizzi privati/interni/special-use fuori dall'intervallo benchmark RFC 2544 consentito per impostazione predefinita.
- `channels.telegram.proxy`: URL proxy per le chiamate Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: abilita la modalità webhook (richiede `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: secret del webhook (obbligatorio quando è impostato `webhookUrl`).
- `channels.telegram.webhookPath`: percorso webhook locale (predefinito `/telegram-webhook`).
- `channels.telegram.webhookHost`: host di bind del webhook locale (predefinito `127.0.0.1`).
- `channels.telegram.webhookPort`: porta di bind del webhook locale (predefinito `8787`).
- `channels.telegram.actions.reactions`: gating delle reazioni dello strumento Telegram.
- `channels.telegram.actions.sendMessage`: gating degli invii di messaggi dello strumento Telegram.
- `channels.telegram.actions.deleteMessage`: gating delle eliminazioni di messaggi dello strumento Telegram.
- `channels.telegram.actions.sticker`: gating delle azioni sticker Telegram — invio e ricerca (predefinito: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controlla quali reazioni attivano eventi di sistema (predefinito: `own` se non impostato).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controlla la capacità di reazione dell'agente (predefinito: `minimal` se non impostato).
- `channels.telegram.errorPolicy`: `reply | silent` — controlla il comportamento delle risposte di errore (predefinito: `reply`). Supporta override per account/gruppo/topic.
- `channels.telegram.errorCooldownMs`: ms minimi tra risposte di errore alla stessa chat (predefinito: `60000`). Previene spam di errori durante le interruzioni.

- [Riferimento configurazione - Telegram](/it/gateway/configuration-reference#telegram)

Campi Telegram specifici ad alto segnale:

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file normale; i symlink vengono rifiutati)
- controllo accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di livello superiore (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/risposte: `replyToMode`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- azioni/capacità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Correlati

- [Pairing](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Routing multi-agent](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
