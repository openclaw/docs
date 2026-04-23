---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto del bot Telegram, capacità e configurazione
title: Telegram
x-i18n:
    generated_at: "2026-04-23T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (API Bot)

Stato: pronto per la produzione per DM bot + gruppi tramite grammY. Il long polling è la modalità predefinita; la modalità webhook è opzionale.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è l'abbinamento.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
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

  <Step title="Configura il token e la policy DM">

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
    Aggiungi il bot al tuo gruppo, quindi imposta `channels.telegram.groups` e `groupPolicy` in modo che corrispondano al tuo modello di accesso.
  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token è consapevole dell'account. In pratica, i valori di configurazione hanno priorità sul fallback env e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità del gruppo">
    I bot Telegram usano per impostazione predefinita la **Privacy Mode**, che limita i messaggi di gruppo che ricevono.

    Se il bot deve vedere tutti i messaggi del gruppo, puoi:

    - disattivare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la modalità privacy, rimuovi e poi aggiungi di nuovo il bot in ciascun gruppo in modo che Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Permessi del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi del gruppo, il che è utile per un comportamento di gruppo sempre attivo.

  </Accordion>

  <Accordion title="Comandi BotFather utili">

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
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai eseguito un aggiornamento e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file allowlist del pairing-store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID `allowFrom` numerici espliciti per mantenere la policy di accesso durevole nella configurazione (invece di dipendere da approvazioni di abbinamento precedenti).

    Equivoco comune: l'approvazione dell'abbinamento DM non significa "questo mittente è autorizzato ovunque".
    L'abbinamento concede solo l'accesso DM. L'autorizzazione del mittente nei gruppi deriva comunque da allowlist esplicite nella configurazione.
    Se vuoi che "io sia autorizzato una volta e funzionino sia i DM sia i comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`.

    ### Trovare il tuo ID utente Telegram

    Metodo più sicuro (senza bot di terze parti):

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
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli dell'ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci a `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` è usato per il filtro dei mittenti nei gruppi. Se non è impostato, Telegram usa `allowFrom` come fallback.
    Le voci di `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID chat di gruppo o supergruppo Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Confine di sicurezza (`2026.2.25+`): l'autorizzazione dei mittenti nei gruppi **non** eredita le approvazioni del pairing-store DM.
    L'abbinamento resta solo per i DM. Per i gruppi, imposta `groupAllowFrom` oppure `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram usa `allowFrom` della configurazione come fallback, non il pairing store.
    Modello pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione in `channels.telegram.groups`.
    Nota di runtime: se `channels.telegram` è completamente assente, i valori predefiniti di runtime applicano fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

    Esempio: consentire qualsiasi membro in uno specifico gruppo:

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

    Esempio: consentire solo utenti specifici in uno specifico gruppo:

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

      - Inserisci gli ID negativi di gruppi o supergruppi Telegram come `-1001234567890` in `channels.telegram.groups`.
      - Inserisci ID utente Telegram come `8734062810` in `groupAllowFrom` quando vuoi limitare quali persone all'interno di un gruppo consentito possono attivare il bot.
      - Usa `groupAllowFrom: ["*"]` solo quando vuoi che qualsiasi membro di un gruppo consentito possa parlare con il bot.
    </Warning>

  </Tab>

  <Tab title="Comportamento delle menzioni">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione.

    La menzione può provenire da:

    - menzione nativa `@botusername`, oppure
    - pattern di menzione in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Attivazioni di comando a livello di sessione:

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
    - oppure controlla `getUpdates` della Bot API

  </Tab>
</Tabs>

## Comportamento di runtime

- Telegram è gestito dal processo Gateway.
- Il routing è deterministico: le risposte in ingresso di Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'envelope di canale condivisa con metadati di risposta e segnaposto multimediali.
- Le sessioni di gruppo sono isolate per ID gruppo. I topic del forum aggiungono `:topic:<threadId>` per mantenere i topic isolati.
- I messaggi DM possono includere `message_thread_id`; OpenClaw li instrada con chiavi di sessione consapevoli del thread e preserva l'ID thread per le risposte.
- Il long polling usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- I riavvii del watchdog per long polling si attivano per impostazione predefinita dopo 120 secondi senza liveness `getUpdates` completata. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment continua a vedere falsi riavvii per stallo del polling durante lavoro di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportate le sostituzioni per account.
- La Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Anteprima streaming live (modifiche ai messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` viene mappato a `partial` su Telegram (compatibilità con la denominazione cross-channel)
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumento/progresso riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi separati per strumento/progresso.
    - i valori booleani legacy `channels.telegram.streamMode` e `streaming` vengono mappati automaticamente

    Per risposte solo testo:

    - DM: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale sul posto (nessun secondo messaggio)
    - gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale sul posto (nessun secondo messaggio)

    Per risposte complesse (per esempio payload multimediali), OpenClaw torna alla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming di anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è esplicitamente abilitato per Telegram, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

    Se il trasporto bozza nativo non è disponibile/viene rifiutato, OpenClaw usa automaticamente `sendMessage` + `editMessageText` come fallback.

    Stream di reasoning solo Telegram:

    - `/reasoning stream` invia il reasoning all'anteprima live durante la generazione
    - la risposta finale viene inviata senza testo di reasoning

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo in stile Markdown viene renderizzato in HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene sottoposto a escape per ridurre i fallimenti di parsing di Telegram.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw ritenta come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu comandi Telegram viene gestita all'avvio con `setMyCommands`.

    Valori predefiniti dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci personalizzate al menu comandi:

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

    - i nomi vengono normalizzati (rimuove `/` iniziale, minuscolo)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente il comportamento
    - i comandi di plugin/Skills possono comunque funzionare se digitati, anche se non sono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram è ancora in overflow dopo il trimming; riduci i comandi di plugin/Skills/personalizzati oppure disabilita `channels.telegram.commands.native`.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di abbinamento dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera un codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/ambiti)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione contiene un bootstrap token a breve durata. Il passaggio bootstrap integrato mantiene il token del Node primario con `scopes: []`; qualsiasi token operatore passato resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli di ambito bootstrap sono prefissati dal ruolo, quindi tale allowlist operatore soddisfa solo richieste operatore; i ruoli non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.

    Se un dispositivo riprova con dettagli auth modificati (per esempio ruolo/ambiti/chiave pubblica), la precedente richiesta in sospeso viene sostituita e la nuova richiesta usa un `requestId` diverso. Esegui di nuovo `/pair pending` prima di approvare.

    Maggiori dettagli: [Abbinamento](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    I clic sui callback vengono passati all'agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni messaggio Telegram per agenti e automazione">
    Le azioni strumento Telegram includono:

    - `sendMessage` (`to`, `content`, `mediaUrl` opzionale, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opzionale, `iconCustomEmojiId`)

    Le azioni messaggio del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno toggle `channels.telegram.actions.*` separati.
    Gli invii a runtime usano lo snapshot attivo di config/secrets (avvio/ricarica), quindi i percorsi delle azioni non eseguono una nuova risoluzione ad hoc di SecretRef a ogni invio.

    Semantica della rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato l'azione
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
    - risposte e digitazione sono indirizzate al thread del topic
    - percorso config del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale topic generale (`threadId=1`):

    - gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo del topic e non viene ereditato dai valori predefiniti del gruppo.

    **Routing agente per topic**: ogni topic può instradare verso un agente diverso impostando `agentId` nella config del topic. Questo fornisce a ciascun topic il proprio workspace, memoria e sessione isolati. Esempio:

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

    **Binding persistente del topic ACP**: i topic del forum possono fissare sessioni harness ACP tramite binding ACP tipizzati di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un id qualificato col topic come `-1001234567890:topic:42`). Attualmente limitato ai topic forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP legato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` collega il topic corrente a una nuova sessione ACP; i messaggi successivi vengono instradati lì direttamente. OpenClaw fissa la conferma di spawn nel topic. Richiede `channels.telegram.threadBindings.spawnAcpSessions=true`.

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono il routing DM ma usano chiavi di sessione consapevoli del thread.

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

    Le video note non supportano didascalie; il testo del messaggio fornito viene inviato separatamente.

    ### Sticker

    Gestione degli sticker in ingresso:

    - WEBP statico: scaricato ed elaborato (segnaposto `<media:sticker>`)
    - TGS animato: ignorato
    - WEBM video: ignorato

    Campi di contesto dello sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File cache sticker:

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

    Azione di invio sticker:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cerca sticker in cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "gatto che saluta",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifiche di reazione">
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
      - i gruppi non forum vengono instradati alla sessione chat di gruppo
      - i gruppi forum vengono instradati alla sessione del topic generale del gruppo (`:topic:1`), non al topic esatto di origine

    `allowed_updates` per polling/webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni ack">
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

    - eventi di migrazione gruppo (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede abilitazione dei comandi)

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
    Il valore predefinito è long polling. Per la modalità webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opzionali `webhookPath`, `webhookHost`, `webhookPort` (predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    Il listener locale si collega a `127.0.0.1:8787`. Per ingress pubblico, metti un reverse proxy davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

  </Accordion>

  <Accordion title="Limiti, retry e target CLI">
    - il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini dei paragrafi (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY).
    - `channels.telegram.pollingStallThresholdMs` ha come valore predefinito `120000`; regolalo tra `30000` e `600000` solo per falsi positivi di riavvio per polling bloccato.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` oppure `messages.groupChat.historyLimit` (predefinito 50); `0` disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene attualmente passato così come ricevuto.
    - le allowlist Telegram controllano principalmente chi può attivare l'agente, non costituiscono un confine completo di redazione del contesto supplementare.
    - controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/tools/actions) per errori API in uscita recuperabili.

    Il target di invio CLI può essere un ID chat numerico o un username:

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

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` oppure `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare messaggi in quella chat
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come foto compresse o upload di media animati

    Controllo delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati i normali invii

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare i prompt nella chat o nel topic di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso config:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (usa come fallback gli ID proprietario numerici da `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    La consegna nel canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/topic fidati. Quando il prompt arriva in un topic del forum, OpenClaw preserva il topic per il prompt di approvazione e per il follow-up. Le approvazioni exec scadono dopo 30 minuti per impostazione predefinita.

    I pulsanti di approvazione inline richiedono anche che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`). Gli ID di approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni del plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte agli errori

Quando l'agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                     |
| ----------------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore amichevole alla chat. `silent` sopprime completamente le risposte di errore. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | Tempo minimo tra risposte di errore alla stessa chat. Previene spam di errori durante interruzioni.        |

Sono supportati override per account, per gruppo e per topic (stessa ereditarietà delle altre chiavi di configurazione Telegram).

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
      - poi rimuovi e aggiungi di nuovo il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; il wildcard `"*"` non può essere verificato per appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando esiste `channels.telegram.groups`, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l'appartenenza del bot al gruppo
    - controlla i log: `openclaw logs --follow` per i motivi di esclusione

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o non funzionano affatto">

    - autorizza la tua identità mittente (abbinamento e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy di gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi di plugin/Skills/personalizzati o disabilita i menu nativi
    - `setMyCommands failed` con errori di rete/fetch di solito indica problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="Instabilità del polling o della rete">

    - Node 22+ + fetch/proxy personalizzato può attivare un comportamento di abort immediato se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono `api.telegram.org` prima in IPv6; un'uscita IPv6 guasta può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness long-poll completata per impostazione predefinita.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host continua a segnalare falsi riavvii per polling bloccato. Blocchi persistenti di solito indicano problemi di proxy, DNS, IPv6 o uscita TLS tra l'host e `api.telegram.org`.
    - Su host VPS con uscita diretta/TLS instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa per impostazione predefinita `autoSelectFamily=true` (tranne WSL2) e `dnsResultOrder=ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con un comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte nell'intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per i download dei media Telegram per impostazione predefinita. Se un fake-IP fidato o
      un proxy trasparente riscrive `api.telegram.org` in qualche altro
      indirizzo privato/interno/special-use durante i download dei media, puoi scegliere
      il bypass solo Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Lo stesso opt-in è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia
      prima disattivato il flag dangerous. I media Telegram consentono già per impostazione predefinita l'intervallo benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF dei
      media Telegram. Usalo solo per ambienti proxy fidati controllati dall'operatore
      come routing fake-IP di Clash, Mihomo o Surge quando
      sintetizzano risposte private o special-use fuori dall'intervallo benchmark RFC 2544.
      Lascialo disattivato per il normale accesso Telegram su Internet pubblico.
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

## Puntatori al riferimento della configurazione Telegram

Riferimento principale:

- `channels.telegram.enabled`: abilita/disabilita l'avvio del canale.
- `channels.telegram.botToken`: token del bot (BotFather).
- `channels.telegram.tokenFile`: legge il token da un percorso file regolare. I symlink sono rifiutati.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing).
- `channels.telegram.allowFrom`: allowlist DM (ID utente Telegram numerici). `allowlist` richiede almeno un ID mittente. `open` richiede `"*"`. `openclaw doctor --fix` può risolvere voci legacy `@username` in ID e può recuperare voci allowlist da file pairing-store nei flussi di migrazione allowlist.
- `channels.telegram.actions.poll`: abilita o disabilita la creazione di poll Telegram (predefinito: abilitato; richiede comunque `sendMessage`).
- `channels.telegram.defaultTo`: target Telegram predefinito usato dalla CLI `--deliver` quando non viene fornito un `--reply-to` esplicito.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (predefinito: allowlist).
- `channels.telegram.groupAllowFrom`: allowlist dei mittenti di gruppo (ID utente Telegram numerici). `openclaw doctor --fix` può risolvere voci legacy `@username` in ID. Le voci non numeriche vengono ignorate al momento dell'autorizzazione. L'autorizzazione di gruppo non usa il fallback DM pairing-store (`2026.2.25+`).
- Precedenza multi-account:
  - Quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (oppure includi `channels.telegram.accounts.default`) per rendere esplicito il routing predefinito.
  - Se nessuno dei due è impostato, OpenClaw usa come fallback il primo ID account normalizzato e `openclaw doctor` emette un avviso.
  - `channels.telegram.accounts.default.allowFrom` e `channels.telegram.accounts.default.groupAllowFrom` si applicano solo all'account `default`.
  - Gli account con nome ereditano `channels.telegram.allowFrom` e `channels.telegram.groupAllowFrom` quando i valori a livello account non sono impostati.
  - Gli account con nome non ereditano `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`.
- `channels.telegram.groups`: valori predefiniti per gruppo + allowlist (usa `"*"` per valori predefiniti globali).
  - `channels.telegram.groups.<id>.groupPolicy`: override per gruppo di groupPolicy (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: valore predefinito del gating per menzione.
  - `channels.telegram.groups.<id>.skills`: filtro Skills (omesso = tutte le Skills, vuoto = nessuna).
  - `channels.telegram.groups.<id>.allowFrom`: override della allowlist mittenti per gruppo.
  - `channels.telegram.groups.<id>.systemPrompt`: prompt di sistema aggiuntivo per il gruppo.
  - `channels.telegram.groups.<id>.enabled`: disabilita il gruppo quando è `false`.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: override per topic (campi di gruppo + `agentId` solo topic).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: instrada questo topic a un agente specifico (sovrascrive il routing a livello gruppo e binding).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: override per topic di groupPolicy (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: override per topic del gating per menzione.
- `bindings[]` di primo livello con `type: "acp"` e id topic canonico `chatId:topic:topicId` in `match.peer.id`: campi di binding persistente del topic ACP (vedi [Agenti ACP](/it/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: instrada i topic DM a un agente specifico (stesso comportamento dei topic forum).
- `channels.telegram.execApprovals.enabled`: abilita Telegram come client di approvazione exec basato su chat per questo account.
- `channels.telegram.execApprovals.approvers`: ID utente Telegram autorizzati ad approvare o negare richieste exec. Opzionale quando `channels.telegram.allowFrom` o un `channels.telegram.defaultTo` diretto identifica già il proprietario.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (predefinito: `dm`). `channel` e `both` preservano il topic Telegram di origine quando presente.
- `channels.telegram.execApprovals.agentFilter`: filtro opzionale per ID agente per i prompt di approvazione inoltrati.
- `channels.telegram.execApprovals.sessionFilter`: filtro opzionale per chiave sessione (sottostringa o regex) per i prompt di approvazione inoltrati.
- `channels.telegram.accounts.<account>.execApprovals`: override per account del routing di approvazione exec Telegram e dell'autorizzazione degli approvatori.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (predefinito: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: override per account.
- `channels.telegram.commands.nativeSkills`: abilita/disabilita i comandi nativi Skills di Telegram.
- `channels.telegram.replyToMode`: `off | first | all` (predefinito: `off`).
- `channels.telegram.textChunkLimit`: dimensione chunk in uscita (caratteri).
- `channels.telegram.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini dei paragrafi) prima del chunking per lunghezza.
- `channels.telegram.linkPreview`: attiva/disattiva le anteprime dei link per i messaggi in uscita (predefinito: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (anteprima streaming live; predefinito: `partial`; `progress` viene mappato a `partial`; `block` è compatibilità legacy della modalità anteprima). L'anteprima streaming Telegram usa un singolo messaggio di anteprima modificato sul posto.
- `channels.telegram.streaming.preview.toolProgress`: riusa il messaggio di anteprima live per aggiornamenti di strumento/progresso quando l'anteprima streaming è attiva (predefinito: `true`). Imposta `false` per mantenere messaggi separati per strumento/progresso.
- `channels.telegram.mediaMaxMb`: limite media Telegram in ingresso/uscita (MB, predefinito: 100).
- `channels.telegram.retry`: policy di retry per gli helper di invio Telegram (CLI/tools/actions) su errori API in uscita recuperabili (tentativi, `minDelayMs`, `maxDelayMs`, jitter).
- `channels.telegram.network.autoSelectFamily`: sovrascrive Node autoSelectFamily (true=abilita, false=disabilita). Predefinito abilitato su Node 22+, con WSL2 che per impostazione predefinita è disabilitato.
- `channels.telegram.network.dnsResultOrder`: sovrascrive l'ordine dei risultati DNS (`ipv4first` o `verbatim`). Predefinito `ipv4first` su Node 22+.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: opt-in pericoloso per ambienti fidati fake-IP o transparent-proxy in cui i download media Telegram risolvono `api.telegram.org` in indirizzi privati/interni/special-use fuori dall'allowance predefinita dell'intervallo benchmark RFC 2544.
- `channels.telegram.proxy`: URL proxy per chiamate Bot API (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: abilita la modalità Webhook (richiede `channels.telegram.webhookSecret`).
- `channels.telegram.webhookSecret`: segreto Webhook (richiesto quando è impostato webhookUrl).
- `channels.telegram.webhookPath`: percorso Webhook locale (predefinito `/telegram-webhook`).
- `channels.telegram.webhookHost`: host bind Webhook locale (predefinito `127.0.0.1`).
- `channels.telegram.webhookPort`: porta bind Webhook locale (predefinito `8787`).
- `channels.telegram.actions.reactions`: controllo delle reazioni degli strumenti Telegram.
- `channels.telegram.actions.sendMessage`: controllo degli invii di messaggi degli strumenti Telegram.
- `channels.telegram.actions.deleteMessage`: controllo delle eliminazioni di messaggi degli strumenti Telegram.
- `channels.telegram.actions.sticker`: controllo delle azioni sticker Telegram — invio e ricerca (predefinito: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — controlla quali reazioni attivano eventi di sistema (predefinito: `own` quando non impostato).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — controlla la capacità di reazione dell'agente (predefinito: `minimal` quando non impostato).
- `channels.telegram.errorPolicy`: `reply | silent` — controlla il comportamento delle risposte di errore (predefinito: `reply`). Supporta override per account/gruppo/topic.
- `channels.telegram.errorCooldownMs`: ms minimi tra risposte di errore alla stessa chat (predefinito: `60000`). Previene spam di errori durante interruzioni.

- [Riferimento configurazione - Telegram](/it/gateway/configuration-reference#telegram)

Campi Telegram specifici ad alto segnale:

- avvio/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink sono rifiutati)
- controllo accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/risposte: `replyToMode`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
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
