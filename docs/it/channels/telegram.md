---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto, funzionalità e configurazione del bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per DM e gruppi bot tramite grammY. Long polling è la modalità predefinita; la modalità Webhook è opzionale.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è l'abbinamento.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/it/gateway/configuration">
    Schemi ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Create the bot token in BotFather">
    Apri Telegram e avvia una chat con **@BotFather** (conferma che l'handle sia esattamente `@BotFather`).

    Esegui `/newbot`, segui le istruzioni e salva il token.

  </Step>

  <Step title="Configure token and DM policy">

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

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    I codici di abbinamento scadono dopo 1 ora.

  </Step>

  <Step title="Add the bot to a group">
    Aggiungi il bot al tuo gruppo, quindi imposta `channels.telegram.groups` e `groupPolicy` in modo che corrispondano al tuo modello di accesso.
  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token tiene conto dell'account. In pratica, i valori di configurazione prevalgono sul fallback env e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    I bot Telegram usano per impostazione predefinita la **Privacy Mode**, che limita i messaggi di gruppo che ricevono.

    Se il bot deve vedere tutti i messaggi del gruppo, puoi:

    - disabilitare la privacy mode tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la privacy mode, rimuovi e riaggiungi il bot in ogni gruppo in modo che Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Group permissions">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi del gruppo, utile per comportamenti di gruppo sempre attivi.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` per consentire/negare l'aggiunta ai gruppi
    - `/setprivacy` per il comportamento di visibilità nei gruppi

  </Accordion>
</AccordionGroup>

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` consente a qualsiasi account Telegram che trovi o indovini il nome utente del bot di impartire comandi al bot. Usalo solo per bot intenzionalmente pubblici con strumenti strettamente limitati; i bot con un solo proprietario dovrebbero usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    Nelle configurazioni multi-account, un `channels.telegram.allowFrom` di primo livello restrittivo viene trattato come limite di sicurezza: le voci a livello di account `allowFrom: ["*"]` non rendono pubblico quell'account a meno che l'allowlist effettiva dell'account contenga ancora un carattere jolly esplicito dopo l'unione.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai eseguito l'upgrade e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza facevi affidamento sui file allowlist del pairing-store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (ad esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per i bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere la policy di accesso duratura nella configurazione (invece di dipendere dalle approvazioni di abbinamento precedenti).

    Confusione comune: l'approvazione dell'abbinamento DM non significa "questo mittente è autorizzato ovunque".
    L'abbinamento concede l'accesso DM. Se non esiste ancora un proprietario dei comandi, il primo abbinamento approvato imposta anche `commands.ownerAllowFrom`, così i comandi riservati al proprietario e le approvazioni exec hanno un account operatore esplicito.
    L'autorizzazione dei mittenti nei gruppi proviene comunque dalle allowlist esplicite in configurazione.
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

  <Tab title="Group policy and allowlists">
    Si applicano due controlli insieme:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna configurazione `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli sugli ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci `groups` (o `"*"`)
       - `groups` configurato: agisce come allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` viene usato per filtrare i mittenti nei gruppi. Se non impostato, Telegram ripiega su `allowFrom`.
    Le voci `groupAllowFrom` dovrebbero essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi vanno sotto `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Limite di sicurezza (`2026.2.25+`): l'autenticazione dei mittenti nei gruppi **non** eredita le approvazioni del pairing-store DM.
    L'abbinamento resta solo per i DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per topic.
    Se `groupAllowFrom` non è impostato, Telegram ripiega su `allowFrom` in configurazione, non sul pairing store.
    Schema pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione sotto `channels.telegram.groups`.
    Nota runtime: se `channels.telegram` manca completamente, il runtime usa per impostazione predefinita il fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

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

    Esempio: consentire solo utenti specifici dentro uno specifico gruppo:

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
      - Inserisci ID utente Telegram come `8734062810` sotto `groupAllowFrom` quando vuoi limitare quali persone dentro un gruppo consentito possono attivare il bot.
      - Usa `groupAllowFrom: ["*"]` solo quando vuoi che qualsiasi membro di un gruppo consentito possa parlare con il bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
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

    Ottenere l'ID della chat di gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona `getUpdates` della Bot API

  </Tab>
</Tabs>

## Comportamento runtime

- Telegram è gestito dal processo gateway.
- Il routing è deterministico: le risposte inbound di Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi inbound vengono normalizzati nell'envelope del canale condiviso con metadati di risposta e placeholder media.
- Le sessioni di gruppo sono isolate per ID gruppo. I topic dei forum aggiungono `:topic:<threadId>` per mantenere i topic isolati.
- I messaggi DM possono contenere `message_thread_id`; OpenClaw conserva l'ID del thread per le risposte ma mantiene i DM sulla sessione piatta per impostazione predefinita. Configura `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` o una configurazione topic corrispondente quando vuoi intenzionalmente l'isolamento delle sessioni per topic nei DM.
- Long polling usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del runner sink usa `agents.defaults.maxConcurrent`.
- Long polling è protetto all'interno di ogni processo gateway, così solo un poller attivo può usare un token bot alla volta. Se vedi ancora conflitti `getUpdates` 409, probabilmente un altro gateway OpenClaw, uno script o un poller esterno sta usando lo stesso token.
- I riavvii del watchdog del long-polling si attivano per impostazione predefinita dopo 120 secondi senza liveness `getUpdates` completata. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment vede ancora falsi riavvii per stallo del polling durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/topic: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` mantiene una bozza di stato modificabile e la aggiorna con l'avanzamento degli strumenti fino alla consegna finale
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumenti/avanzamento riusano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming di anteprima è attivo)
    - i valori legacy `channels.telegram.streamMode` e booleani `streaming` vengono rilevati; esegui `openclaw doctor --fix` per migrarli a `channels.telegram.streaming.mode`

    Gli aggiornamenti di anteprima dell'avanzamento strumenti sono le brevi righe di stato mostrate mentre gli strumenti sono in esecuzione, ad esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione o riepiloghi patch. Telegram li mantiene abilitati per impostazione predefinita per corrispondere al comportamento rilasciato di OpenClaw da `v2026.4.22` e versioni successive. Per mantenere l'anteprima modificata per il testo della risposta ma nascondere le righe di avanzamento strumenti, imposta:

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

    Usa `streaming.mode: "off"` solo quando vuoi una consegna solo finale: le modifiche all'anteprima di Telegram sono disabilitate e il chiacchiericcio generico di strumenti/avanzamento viene soppresso invece di essere inviato come messaggi di stato autonomi. Le richieste di approvazione, i payload multimediali e gli errori continuano a passare attraverso la normale consegna finale. Usa `streaming.preview.toolProgress: false` quando vuoi solo mantenere le modifiche all'anteprima della risposta nascondendo le righe di stato sull'avanzamento dello strumento.

    <Note>
      Le risposte con citazione selezionata di Telegram sono l'eccezione. Quando `replyToMode` è `"first"`, `"all"` o `"batched"` e il messaggio in ingresso include testo di citazione selezionato, OpenClaw invia la risposta finale tramite il percorso nativo di risposta con citazione di Telegram invece di modificare l'anteprima della risposta, quindi `streaming.preview.toolProgress` non può mostrare le brevi righe di stato per quel turno. Le risposte al messaggio corrente senza testo di citazione selezionato continuano a mantenere lo streaming dell'anteprima. Imposta `replyToMode: "off"` quando la visibilità dell'avanzamento dello strumento è più importante delle risposte con citazione native, oppure imposta `streaming.preview.toolProgress: false` per accettare il compromesso.
    </Note>

    Per le risposte solo testo:

    - anteprime brevi in DM/gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue una modifica finale sul posto, a meno che dopo la comparsa dell'anteprima non sia stato inviato un messaggio visibile non di anteprima
    - anteprime seguite da output visibile non di anteprima: OpenClaw invia la risposta completata come nuovo messaggio finale e pulisce l'anteprima precedente, quindi la risposta finale appare dopo l'output intermedio
    - anteprime più vecchie di circa un minuto: OpenClaw invia la risposta completata come nuovo messaggio finale e poi pulisce l'anteprima, così il timestamp visibile di Telegram riflette l'ora di completamento invece dell'ora di creazione dell'anteprima

    Per risposte complesse (ad esempio payload multimediali), OpenClaw ripiega sulla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming dell'anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è abilitato esplicitamente per Telegram, OpenClaw salta lo stream dell'anteprima per evitare il doppio streaming.

    Stream di ragionamento solo Telegram:

    - `/reasoning stream` invia il ragionamento all'anteprima live durante la generazione
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo in stile Markdown viene renderizzato in HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene sottoposto a escape per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l'HTML analizzato, OpenClaw riprova come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu dei comandi di Telegram viene gestita all'avvio con `setMyCommands`.

    Impostazioni predefinite dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci personalizzate al menu dei comandi:

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

    - i nomi vengono normalizzati (rimuovi `/` iniziale, minuscolo)
    - schema valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente alcun comportamento
    - i comandi di plugin/skill possono comunque funzionare quando vengono digitati anche se non sono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, i comandi integrati vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram ha comunque superato il limite dopo il trimming; riduci i comandi plugin/skill/personalizzati o disabilita `channels.telegram.commands.native`.
    - Il fallimento di `deleteWebhook`, `deleteMyCommands` o `setMyCommands` con `404: Not Found` mentre i comandi curl diretti della Bot API funzionano può significare che `channels.telegram.apiRoot` è stato impostato sull'endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la radice della Bot API, e `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token del bot configurato. Aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con il token BotFather corrente; OpenClaw si arresta prima del polling, quindi questo non viene segnalato come errore di pulizia del Webhook.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di abbinamento del dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/ambiti)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione contiene un token bootstrap di breve durata. Il passaggio bootstrap integrato mantiene il token del nodo primario a `scopes: []`; qualsiasi token operatore passato resta limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli degli ambiti bootstrap hanno prefisso di ruolo, quindi quella allowlist operatore soddisfa solo le richieste operatore; i ruoli non operatore necessitano comunque di ambiti sotto il proprio prefisso di ruolo.

    Se un dispositivo riprova con dettagli di autenticazione modificati (ad esempio ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e la nuova richiesta usa un `requestId` diverso. Riesegui `/pair pending` prima di approvare.

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
    Gli invii runtime usano lo snapshot attivo di configurazione/segreti (avvio/ricaricamento), quindi i percorsi delle azioni non eseguono una nuova risoluzione SecretRef ad hoc per ogni invio.

    Semantica di rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di threading delle risposte">
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato l'evento
    - `[[reply_to:<id>]]` risponde a uno specifico ID messaggio Telegram

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Quando il threading delle risposte è abilitato e il testo o la didascalia Telegram originale è disponibile, OpenClaw include automaticamente un estratto di citazione nativo Telegram. Telegram limita il testo delle citazioni native a 1024 unità di codice UTF-16, quindi i messaggi più lunghi vengono citati dall'inizio e ripiegano su una risposta semplice se Telegram rifiuta la citazione.

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic del forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione dei topic aggiungono `:topic:<threadId>`
    - le risposte e la digitazione puntano al thread del topic
    - percorso di configurazione del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic generale (`threadId=1`):

    - gli invii dei messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci dei topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo del topic e non eredita dai valori predefiniti del gruppo.

    **Instradamento agente per topic**: Ogni topic può essere instradato a un agente diverso impostando `agentId` nella configurazione del topic. Questo assegna a ogni topic il proprio workspace, la propria memoria e la propria sessione isolati. Esempio:

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

    **Binding persistente dei topic ACP**: I topic del forum possono fissare le sessioni dell'harness ACP tramite binding ACP tipizzati di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un id qualificato per topic come `-1001234567890:topic:42`). Attualmente limitato ai topic del forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa il topic corrente a una nuova sessione ACP; i follow-up vengono instradati direttamente lì. OpenClaw fissa la conferma di spawn nel topic. Richiede che `channels.telegram.threadBindings.spawnSessions` resti abilitato (predefinito: `true`).

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono per impostazione predefinita l'instradamento DM e i metadati di risposta su sessioni piatte; usano chiavi di sessione consapevoli dei thread solo quando configurate con `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` o una configurazione topic corrispondente. Usa `channels.telegram.dm.threadReplies` di primo livello per il valore predefinito dell'account, oppure `direct.<chatId>.threadReplies` per un DM.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue tra note vocali e file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale
    - le trascrizioni delle note vocali in ingresso sono incorniciate come testo generato dalla macchina,
      non attendibile nel contesto dell'agente; il rilevamento delle menzioni usa comunque la trascrizione
      grezza, quindi i messaggi vocali soggetti a gating tramite menzione continuano a funzionare.

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

    Le note video non supportano le didascalie; il testo del messaggio fornito viene inviato separatamente.

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

    File cache degli sticker:

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

  <Accordion title="Notifiche di reazione">
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitate, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` indica solo le reazioni degli utenti ai messaggi inviati dal bot (con approccio best-effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID di thread negli aggiornamenti delle reazioni.
      - i gruppi non forum vengono instradati alla sessione chat di gruppo
      - i gruppi forum vengono instradati alla sessione dell'argomento generale del gruppo (`:topic:1`), non all'esatto argomento di origine

    `allowed_updates` per polling/Webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji Unicode (per esempio "👀").
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

  <Accordion title="Polling prolungato e Webhook">
    Il valore predefinito è il polling prolungato. Per la modalità Webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; `webhookPath`, `webhookHost`, `webhookPort` sono opzionali (predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    Il listener locale si associa a `127.0.0.1:8787`. Per l'ingresso pubblico, inserisci un proxy inverso davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità Webhook convalida le protezioni della richiesta, il token segreto Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw poi elabora l'aggiornamento in modo asincrono tramite le stesse corsie bot per chat/per argomento usate dal polling prolungato, quindi i turni lenti dell'agente non bloccano l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, nuovi tentativi e destinazioni CLI">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini di paragrafo (righe vuote) prima della divisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita le dimensioni dei media Telegram in ingresso e in uscita.
    - `channels.telegram.mediaGroupFlushMs` (predefinito 500) controlla per quanto tempo gli album/gruppi media Telegram vengono mantenuti nel buffer prima che OpenClaw li invii come unico messaggio in ingresso. Aumentalo se le parti dell'album arrivano in ritardo; riducilo per diminuire la latenza delle risposte agli album.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY). I client bot limitano i valori configurati al di sotto della protezione di richiesta di testo/digitazione in uscita di 60 secondi, così grammY non interrompe la consegna della risposta visibile prima che la protezione di trasporto e il fallback di OpenClaw possano essere eseguiti. Il polling prolungato usa comunque una protezione di richiesta `getUpdates` di 45 secondi, così i polling inattivi non vengono abbandonati indefinitamente.
    - Il valore predefinito di `channels.telegram.pollingStallThresholdMs` è `120000`; regola tra `30000` e `600000` solo per riavvii da stallo di polling falsi positivi.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene attualmente passato così come ricevuto.
    - Le allowlist Telegram controllano principalmente chi può attivare l'agente, non rappresentano un confine completo di oscuramento del contesto supplementare.
    - Controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili. Anche la consegna della risposta finale in ingresso usa un nuovo tentativo di invio sicuro limitato per errori di preconnessione Telegram, ma non ritenta inviluppi di rete ambigui successivi all'invio che potrebbero duplicare messaggi visibili.

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
    - `--thread-id` per argomenti forum (oppure usa una destinazione `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare messaggi in quella chat
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come foto compresse o caricamenti di media animati

    Controllo delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i sondaggi
    - `channels.telegram.actions.poll=false` disabilita la creazione di sondaggi Telegram lasciando abilitati gli invii normali

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare prompt nella chat o nell'argomento di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (fallback agli ID proprietario numerici da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può parlare al bot e dove invia le risposte normali. Non rendono qualcuno un approvatore exec. Il primo abbinamento DM approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora alcun proprietario dei comandi, quindi la configurazione con un solo proprietario funziona comunque senza duplicare gli ID in `execApprovals.approvers`.

    La consegna sul canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/argomenti attendibili. Quando il prompt arriva in un argomento forum, OpenClaw conserva l'argomento per il prompt di approvazione e per il seguito. Le approvazioni exec scadono dopo 30 minuti per impostazione predefinita.

    I pulsanti di approvazione inline richiedono anche che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`). Gli ID di approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni Plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell'errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                                              |
| ----------------------------------- | ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore amichevole alla chat. `silent` sopprime completamente le risposte di errore.        |
| `channels.telegram.errorCooldownMs` | numero (ms)       | `60000`     | Tempo minimo tra le risposte di errore alla stessa chat. Previene lo spam di errori durante le interruzioni del servizio. |

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

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire la visibilità completa.
      - BotFather: `/setprivacy` -> Disabilita
      - poi rimuovi e aggiungi di nuovo il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione si aspetta messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; il carattere jolly `"*"` non può essere sondato per l'appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l'appartenenza del bot al gruppo
    - esamina i log: `openclaw logs --follow` per i motivi di esclusione

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o non funzionano affatto">

    - autorizza la tua identità mittente (abbinamento e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy del gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi Plugin/Skills/personalizzati o disabilita i menu nativi
    - Le chiamate di avvio `deleteMyCommands` / `setMyCommands` e le chiamate di digitazione `sendChatAction` sono limitate e ritentate una volta tramite il fallback di trasporto di Telegram in caso di timeout della richiesta. Errori persistenti di rete/fetch di solito indicano problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="L'avvio segnala un token non autorizzato">

    - `getMe returned 401` è un errore di autenticazione Telegram per il token del bot configurato.
    - Ricopia o rigenera il token del bot in BotFather, poi aggiorna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` per l'account predefinito.
    - Anche `deleteWebhook 401 Unauthorized` durante l'avvio è un errore di autenticazione; trattarlo come "non esiste alcun Webhook" rimanderebbe solo lo stesso errore di token non valido alle chiamate API successive.

  </Accordion>

  <Accordion title="Polling o instabilità di rete">

    - Node 22+ + fetch/proxy personalizzati possono attivare un comportamento di interruzione immediata se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un'uscita IPv6 non funzionante può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Durante l'avvio del polling, OpenClaw riutilizza il probe `getMe` di avvio riuscito per grammY, quindi il runner non ha bisogno di un secondo `getMe` prima del primo `getUpdates`.
    - Se `deleteWebhook` fallisce con un errore di rete transitorio durante l'avvio del polling, OpenClaw passa al long polling invece di effettuare un'altra chiamata pre-poll al piano di controllo. Un Webhook ancora attivo emerge come conflitto `getUpdates`; OpenClaw quindi ricostruisce il trasporto Telegram e ritenta la pulizia del Webhook.
    - Se i socket Telegram vengono riciclati con una cadenza fissa breve, controlla se `channels.telegram.timeoutSeconds` è basso; i client bot limitano i valori configurati al di sotto delle protezioni delle richieste in uscita e `getUpdates`, ma le versioni precedenti potevano interrompere ogni poll o risposta quando questo valore era impostato sotto tali protezioni.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness di long-poll completata per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account di polling in esecuzione non ha completato `getUpdates` dopo il periodo di tolleranza dell'avvio, quando un account Webhook in esecuzione non ha completato `setWebhook` dopo il periodo di tolleranza dell'avvio, o quando l'ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host segnala ancora falsi riavvii per stallo del polling. Gli stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o uscita TLS tra l'host e `api.telegram.org`.
    - Telegram rispetta anche le variabili d'ambiente proxy del processo per il trasporto Bot API, incluse `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le loro varianti minuscole. `NO_PROXY` / `no_proxy` possono comunque escludere `api.telegram.org`.
    - Se il proxy gestito da OpenClaw è configurato tramite `OPENCLAW_PROXY_URL` per un ambiente di servizio e non è presente alcuna variabile d'ambiente proxy standard, anche Telegram usa quell'URL per il trasporto Bot API.
    - Su host VPS con uscita diretta/TLS instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ usa per impostazione predefinita `autoSelectFamily=true` (tranne WSL2). L'ordine dei risultati DNS di Telegram rispetta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, poi `channels.telegram.network.dnsResultOrder`, poi il valore predefinito del processo come `NODE_OPTIONS=--dns-result-order=ipv4first`; se nessuno si applica, Node 22+ ripiega su `ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte dell'intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per i download dei media Telegram per impostazione predefinita. Se un fake-IP attendibile o
      un proxy trasparente riscrive `api.telegram.org` verso un altro indirizzo
      privato/interno/a uso speciale durante i download dei media, puoi attivare
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
      disattivato il flag pericoloso. I media Telegram consentono già l'intervallo
      benchmark RFC 2544 per impostazione predefinita.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le
      protezioni SSRF dei media Telegram. Usalo solo per ambienti proxy attendibili
      controllati dall'operatore, come il routing fake-IP di Clash, Mihomo o Surge
      quando sintetizzano risposte private o a uso speciale fuori dall'intervallo
      benchmark RFC 2544. Lascialo disattivato per il normale accesso Telegram su internet pubblico.
    </Warning>

    - Override d'ambiente (temporanei):
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

Altri aiuti: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="Campi Telegram ad alto segnale">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file normale; i symlink vengono rifiutati)
- controllo accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/risposte: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API personalizzata: `apiRoot` (solo root Bot API; non includere `/bot<TOKEN>`)
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
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Abbina un utente Telegram al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento delle allowlist di gruppi e topic.
  </Card>
  <Card title="Routing dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello delle minacce e hardening.
  </Card>
  <Card title="Routing multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e topic agli agenti.
  </Card>
  <Card title="Risoluzione dei problemi" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel.
  </Card>
</CardGroup>
