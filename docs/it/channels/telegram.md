---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui Webhook
summary: Stato del supporto, funzionalità e configurazione del bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per DM e gruppi del bot tramite grammY. Il polling prolungato è la modalità predefinita; la modalità Webhook è opzionale.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è l'associazione.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure di riparazione.
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
    Telegram **non** usa `openclaw channels login telegram`; configura il token in config/env, poi avvia il Gateway.

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
L'ordine di risoluzione del token tiene conto dell'account. In pratica, i valori di configurazione prevalgono sul fallback env, e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità nei gruppi">
    I bot Telegram usano per impostazione predefinita la **Modalità Privacy**, che limita quali messaggi di gruppo ricevono.

    Se il bot deve vedere tutti i messaggi di gruppo:

    - disabilita la modalità privacy tramite `/setprivacy`, oppure
    - rendi il bot amministratore del gruppo.

    Quando modifichi la modalità privacy, rimuovi e aggiungi di nuovo il bot in ogni gruppo affinché Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Permessi del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi di gruppo, utile per un comportamento di gruppo sempre attivo.

  </Accordion>

  <Accordion title="Opzioni BotFather utili">

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

    `dmPolicy: "open"` con `allowFrom: ["*"]` consente a qualsiasi account Telegram che trovi o indovini il nome utente del bot di comandare il bot. Usalo solo per bot intenzionalmente pubblici con strumenti fortemente limitati; i bot con un solo proprietario devono usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    Nelle configurazioni multi-account, un `channels.telegram.allowFrom` restrittivo di primo livello viene trattato come un limite di sicurezza: le voci `allowFrom: ["*"]` a livello di account non rendono pubblico quell'account a meno che l'elenco consentiti effettivo dell'account contenga ancora un carattere jolly esplicito dopo l'unione.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM e viene respinto dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai eseguito l'upgrade e la tua configurazione contiene voci di elenco consentiti `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza ti affidavi ai file degli elenchi consentiti dell'archivio di associazione, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per i bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere la policy di accesso durevole nella configurazione (invece di dipendere dalle approvazioni di associazione precedenti).

    Confusione comune: l'approvazione dell'associazione DM non significa "questo mittente è autorizzato ovunque".
    L'associazione concede l'accesso DM. Se non esiste ancora un proprietario dei comandi, la prima associazione approvata imposta anche `commands.ownerAllowFrom` così che i comandi riservati al proprietario e le approvazioni exec abbiano un account operatore esplicito.
    L'autorizzazione dei mittenti nei gruppi proviene comunque dagli elenchi consentiti espliciti nella configurazione.
    Se vuoi "sono autorizzato una volta e funzionano sia i DM sia i comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`; per i comandi riservati al proprietario, assicurati che `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Invia un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale dell'API Bot:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno privato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Policy di gruppo ed elenchi consentiti">
    Due controlli si applicano insieme:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna configurazione `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli degli ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci `groups` (o `"*"`)
       - `groups` configurato: agisce come elenco consentiti (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` viene usato per filtrare i mittenti nei gruppi. Se non impostato, Telegram ripiega su `allowFrom`.
    Le voci `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi vanno sotto `channels.telegram.groups`.
    Le voci non numeriche vengono ignorate per l'autorizzazione del mittente.
    Limite di sicurezza (`2026.2.25+`): l'autenticazione del mittente nei gruppi **non** eredita le approvazioni dell'archivio di associazione DM.
    L'associazione resta solo per DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per argomento.
    Se `groupAllowFrom` non è impostato, Telegram ripiega su `allowFrom` della configurazione, non sull'archivio di associazione.
    Pattern pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione sotto `channels.telegram.groups`.
    Nota runtime: se `channels.telegram` manca completamente, il runtime usa per impostazione predefinita il fail-closed `groupPolicy="allowlist"` a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

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
      Errore comune: `groupAllowFrom` non è un elenco consentiti di gruppi Telegram.

      - Inserisci gli ID chat negativi di gruppi o supergruppi Telegram come `-1001234567890` sotto `channels.telegram.groups`.
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

    Opzioni di comando a livello di sessione:

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

    Ottenere l'ID chat del gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona `getUpdates` dell'API Bot

  </Tab>
</Tabs>

## Comportamento runtime

- Telegram è gestito dal processo Gateway.
- Il routing è deterministico: i messaggi in ingresso da Telegram ricevono risposta su Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'envelope di canale condiviso con metadati di risposta, placeholder multimediali e contesto persistito della catena di risposte per le risposte Telegram osservate dal Gateway.
- Le sessioni di gruppo sono isolate per ID gruppo. Gli argomenti del forum aggiungono `:topic:<threadId>` per mantenere gli argomenti isolati.
- I messaggi DM possono contenere `message_thread_id`; OpenClaw conserva l'ID del thread per le risposte ma mantiene i DM sulla sessione piatta per impostazione predefinita. Configura `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` o una configurazione di argomento corrispondente quando vuoi intenzionalmente l'isolamento delle sessioni per argomento nei DM.
- Il polling prolungato usa il runner grammY con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- Il polling prolungato è protetto all'interno di ogni processo Gateway affinché solo un poller attivo possa usare un token bot alla volta. Se vedi ancora conflitti `getUpdates` 409, probabilmente un altro Gateway OpenClaw, script o poller esterno sta usando lo stesso token.
- I riavvii del watchdog del polling prolungato vengono attivati dopo 120 secondi senza liveness `getUpdates` completata per impostazione predefinita. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment vede ancora falsi riavvii per stallo del polling durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportati override per account.
- L'API Bot di Telegram non supporta le conferme di lettura (`sendReadReceipts` non si applica).

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Anteprima dello stream live (modifiche dei messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/argomenti: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - `progress` mantiene una bozza di stato modificabile per l'avanzamento degli strumenti, la cancella al completamento e invia la risposta finale come messaggio normale
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming di anteprima è attivo)
    - `streaming.preview.commandText` controlla i dettagli di comando/exec dentro quelle righe di avanzamento strumenti: `raw` (predefinito, conserva il comportamento rilasciato) o `status` (solo etichetta dello strumento)
    - i valori legacy `channels.telegram.streamMode` e booleani `streaming` vengono rilevati; esegui `openclaw doctor --fix` per migrarli a `channels.telegram.streaming.mode`

    Gli aggiornamenti di anteprima dell'avanzamento degli strumenti sono le brevi righe di stato mostrate mentre gli strumenti sono in esecuzione, per esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione o riepiloghi di patch. Telegram li mantiene abilitati per impostazione predefinita per corrispondere al comportamento OpenClaw rilasciato da `v2026.4.22` e versioni successive. Per mantenere l'anteprima modificata per il testo della risposta ma nascondere le righe di avanzamento degli strumenti, imposta:

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

    Per mantenere visibile l'avanzamento degli strumenti ma nascondere il testo di comando/esecuzione, imposta:

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

    Usa la modalità `progress` quando vuoi l'avanzamento degli strumenti visibile senza modificare la risposta finale nello stesso messaggio. Inserisci la policy del testo dei comandi sotto `streaming.progress`:

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

    Usa `streaming.mode: "off"` solo quando vuoi la consegna solo finale: le modifiche dell'anteprima Telegram sono disabilitate e il chatter generico su strumenti/avanzamento viene soppresso invece di essere inviato come messaggi di stato autonomi. Le richieste di approvazione, i payload multimediali e gli errori continuano a passare attraverso la normale consegna finale. Usa `streaming.preview.toolProgress: false` quando vuoi solo mantenere le modifiche dell'anteprima della risposta nascondendo le righe di stato dell'avanzamento degli strumenti.

    <Note>
      Le risposte a citazioni selezionate di Telegram sono l'eccezione. Quando `replyToMode` è `"first"`, `"all"` o `"batched"` e il messaggio in ingresso include testo di citazione selezionato, OpenClaw invia la risposta finale tramite il percorso nativo di risposta con citazione di Telegram invece di modificare l'anteprima della risposta, quindi `streaming.preview.toolProgress` non può mostrare le brevi righe di stato per quel turno. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming dell'anteprima. Imposta `replyToMode: "off"` quando la visibilità dell'avanzamento degli strumenti conta più delle risposte con citazione native, oppure imposta `streaming.preview.toolProgress: false` per accettare il compromesso.
    </Note>

    Per le risposte solo testo:

    - anteprime brevi in DM/gruppo/topic: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue la modifica finale sul posto
    - i finali di testo lunghi che si suddividono in più messaggi Telegram riutilizzano l'anteprima esistente come primo blocco finale quando possibile, poi inviano solo i blocchi rimanenti
    - i finali in modalità avanzamento cancellano la bozza di stato e usano la normale consegna finale invece di modificare la bozza nella risposta
    - se la modifica finale non riesce prima che il testo completato sia confermato, OpenClaw usa la normale consegna finale e ripulisce l'anteprima obsoleta

    Per risposte complesse (ad esempio payload multimediali), OpenClaw ripiega sulla normale consegna finale e poi ripulisce il messaggio di anteprima.

    Lo streaming dell'anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è abilitato esplicitamente per Telegram, OpenClaw salta lo stream dell'anteprima per evitare il doppio streaming.

    Stream di ragionamento solo Telegram:

    - `/reasoning stream` invia il ragionamento all'anteprima live durante la generazione
    - l'anteprima del ragionamento viene eliminata dopo la consegna finale; usa `/reasoning on` quando il ragionamento deve rimanere visibile
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formattazione e fallback HTML">
    Il testo in uscita usa Telegram `parse_mode: "HTML"`.

    - Il testo in stile Markdown viene renderizzato in HTML sicuro per Telegram.
    - L'HTML grezzo del modello viene sottoposto a escape per ridurre gli errori di parsing di Telegram.
    - Se Telegram rifiuta l'HTML parsato, OpenClaw riprova come testo semplice.

    Le anteprime dei link sono abilitate per impostazione predefinita e possono essere disabilitate con `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu dei comandi Telegram viene gestita all'avvio con `setMyCommands`.

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

    - i nomi vengono normalizzati (rimozione di `/` iniziale, minuscolo)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente alcun comportamento
    - i comandi plugin/skill possono comunque funzionare quando digitati anche se non vengono mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram ha comunque superato il limite dopo il taglio; riduci i comandi plugin/skill/personalizzati o disabilita `channels.telegram.commands.native`.
    - il fallimento di `deleteWebhook`, `deleteMyCommands` o `setMyCommands` con `404: Not Found` mentre i comandi curl diretti della Bot API funzionano può significare che `channels.telegram.apiRoot` è stato impostato sull'endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la radice della Bot API, e `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token del bot configurato. Aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con il token BotFather corrente; OpenClaw si ferma prima del polling, quindi questo non viene segnalato come errore di pulizia del Webhook.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che il DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera il codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/scope)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione contiene un token bootstrap di breve durata. Il passaggio bootstrap integrato mantiene il token del nodo primario a `scopes: []`; qualsiasi token operatore passato rimane limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`. I controlli degli scope bootstrap hanno prefisso di ruolo, quindi quella allowlist dell'operatore soddisfa solo le richieste dell'operatore; i ruoli non operatore richiedono comunque scope sotto il proprio prefisso di ruolo.

    Se un dispositivo riprova con dettagli di autenticazione modificati (ad esempio ruolo/scope/chiave pubblica), la richiesta in sospeso precedente viene sostituita e la nuova richiesta usa un `requestId` diverso. Riesegui `/pair pending` prima di approvare.

    Maggiori dettagli: [Associazione](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Il legacy `capabilities: ["inlineButtons"]` mappa a `inlineButtons: "all"`.

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

    - `sendMessage` (`to`, `content`, facoltativo `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, facoltativo `iconColor`, `iconCustomEmojiId`)

    Le azioni messaggio del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

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
    Telegram supporta tag espliciti di threading delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato la richiesta
    - `[[reply_to:<id>]]` risponde a un ID messaggio Telegram specifico

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Quando il threading delle risposte è abilitato e il testo o la didascalia Telegram originale è disponibile, OpenClaw include automaticamente un estratto di citazione nativo Telegram. Telegram limita il testo delle citazioni native a 1024 unità di codice UTF-16, quindi i messaggi più lunghi vengono citati dall'inizio e ripiegano su una risposta semplice se Telegram rifiuta la citazione.

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Topic forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione del topic aggiungono `:topic:<threadId>`
    - risposte e indicatore di digitazione puntano al thread del topic
    - percorso di configurazione del topic:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale del topic generale (`threadId=1`):

    - gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà dei topic: le voci dei topic ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo del topic e non eredita dai valori predefiniti del gruppo.

    **Routing agente per topic**: ogni topic può indirizzare a un agente diverso impostando `agentId` nella configurazione del topic. Questo offre a ogni topic il proprio workspace, memoria e sessione isolati. Esempio:

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

    **Binding topic ACP persistente**: i topic forum possono fissare le sessioni ACP harness tramite binding ACP tipizzati di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un id qualificato per topic come `-1001234567890:topic:42`). Attualmente limitato ai topic forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa il topic corrente a una nuova sessione ACP; i follow-up vengono indirizzati direttamente lì. OpenClaw fissa la conferma di spawn nel topic. Richiede che `channels.telegram.threadBindings.spawnSessions` resti abilitato (predefinito: `true`).

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono per impostazione predefinita il routing DM e i metadati di risposta sulle sessioni piatte; usano chiavi di sessione sensibili ai thread solo quando configurate con `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` o una configurazione di argomento corrispondente. Usa `channels.telegram.dm.threadReplies` di primo livello per il valore predefinito dell’account, oppure `direct.<chatId>.threadReplies` per un singolo DM.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Messaggi audio

    Telegram distingue le note vocali dai file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell’agente per forzare l’invio come nota vocale
    - le trascrizioni delle note vocali in ingresso sono incorniciate come testo generato dalla macchina,
      non attendibile nel contesto dell’agente; il rilevamento delle menzioni usa comunque la trascrizione
      grezza, quindi i messaggi vocali vincolati a menzione continuano a funzionare.

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

    Campi del contesto sticker:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    File della cache sticker:

    - `~/.openclaw/telegram/sticker-cache.json`

    Gli sticker vengono descritti una volta (quando possibile) e memorizzati nella cache per ridurre le chiamate di visione ripetute.

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

  <Accordion title="Reaction notifications">
    Le reazioni Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitate, OpenClaw accoda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` indica solo le reazioni degli utenti ai messaggi inviati dal bot (best-effort tramite cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso di Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID thread negli aggiornamenti delle reazioni.
      - i gruppi non-forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione dell’argomento generale del gruppo (`:topic:1`), non all’esatto argomento di origine

    `allowed_updates` per polling/webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` invia un’emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all’emoji dell’identità dell’agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (per esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Le scritture della configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione dei gruppi (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede l’abilitazione dei comandi)

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

    In modalità long-polling OpenClaw persiste il proprio watermark di riavvio solo dopo che un aggiornamento viene inviato correttamente. Se un handler non riesce, quell’aggiornamento resta ritentabile nello stesso processo e non viene scritto come completato per la deduplicazione al riavvio.

    Il listener locale si associa a `127.0.0.1:8787`. Per l’ingresso pubblico, metti un reverse proxy davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità webhook valida le guardie della richiesta, il token segreto Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw quindi elabora l’aggiornamento in modo asincrono tramite le stesse corsie bot per chat/per argomento usate dal long polling, così i turni lenti dell’agente non trattengono l’ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini di paragrafo (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.mediaGroupFlushMs` (predefinito 500) controlla per quanto tempo gli album/gruppi media di Telegram vengono bufferizzati prima che OpenClaw li invii come un unico messaggio in ingresso. Aumentalo se le parti dell’album arrivano in ritardo; riducilo per diminuire la latenza di risposta agli album.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY). I client bot limitano i valori configurati sotto la guardia di 60 secondi per le richieste di testo/typing in uscita, così grammY non interrompe la consegna visibile della risposta prima che la guardia di trasporto e il fallback di OpenClaw possano essere eseguiti. Il long polling usa comunque una guardia di 45 secondi per la richiesta `getUpdates`, così i poll inattivi non vengono abbandonati indefinitamente.
    - Il valore predefinito di `channels.telegram.pollingStallThresholdMs` è `120000`; regola tra `30000` e `600000` solo per riavvii da stallo del polling falsi positivi.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene normalizzato in un’unica finestra di contesto conversazione selezionata quando il Gateway ha osservato i messaggi padre; la cache dei messaggi osservati viene persistita accanto allo store delle sessioni. Telegram include negli aggiornamenti solo un `reply_to_message` superficiale, quindi le catene più vecchie della cache sono limitate al payload di aggiornamento corrente di Telegram.
    - Le allowlist Telegram regolano principalmente chi può attivare l’agente, non sono un confine completo di redazione del contesto supplementare.
    - Controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - La configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili. Anche la consegna della risposta finale in ingresso usa un retry safe-send limitato per errori Telegram pre-connessione, ma non ritenta envelope di rete ambigui post-invio che potrebbero duplicare messaggi visibili.

    I target di invio della CLI e dello strumento messaggi possono essere ID chat numerico, nome utente o target di argomento forum:

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
    - `--thread-id` per argomenti forum (oppure usa un target `:topic:`)

    L’invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare messaggi in quella chat
    - `--force-document` per inviare immagini e GIF in uscita come documenti invece che come caricamenti foto compresse o media animati

    Controllo delle azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii normali

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare prompt nella chat o nell’argomento di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (fallback agli ID proprietario numerici da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può parlare con il bot e dove invia le risposte normali. Non rendono qualcuno un approvatore exec. Il primo abbinamento DM approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora alcun proprietario dei comandi, quindi la configurazione con un solo proprietario funziona comunque senza duplicare gli ID sotto `execApprovals.approvers`.

    La consegna sul canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/argomenti attendibili. Quando il prompt arriva in un argomento forum, OpenClaw preserva l’argomento per il prompt di approvazione e il follow-up. Le approvazioni exec scadono per impostazione predefinita dopo 30 minuti.

    I pulsanti di approvazione inline richiedono inoltre che `channels.telegram.capabilities.inlineButtons` consenta la superficie target (`dm`, `group` o `all`). Gli ID approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni plugin; gli altri vengono risolti prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l’agente incontra un errore di consegna o del provider, Telegram può rispondere con il testo dell’errore oppure sopprimerlo. Due chiavi di configurazione controllano questo comportamento:

| Chiave                              | Valori            | Predefinito | Descrizione                                                                                                 |
| ----------------------------------- | ----------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`     | `reply` invia un messaggio di errore amichevole alla chat. `silent` sopprime completamente le risposte di errore. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`     | Tempo minimo tra risposte di errore alla stessa chat. Previene spam di errori durante interruzioni.          |

Sono supportate sovrascritture per account, per gruppo e per argomento (stessa ereditarietà delle altre chiavi di configurazione Telegram).

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
      - BotFather: `/setprivacy` -> Disable
      - quindi rimuovi e riaggiungi il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID di gruppo numerici espliciti; il wildcard `"*"` non può essere verificato per appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l'appartenenza del bot al gruppo
    - esamina i log: `openclaw logs --follow` per i motivi di salto

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o non funzionano affatto">

    - autorizza l'identità del mittente (associazione e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy del gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci i comandi di plugin/skill/personalizzati oppure disabilita i menu nativi
    - le chiamate di avvio `deleteMyCommands` / `setMyCommands` e le chiamate di digitazione `sendChatAction` sono limitate e ritentano una volta tramite il fallback di trasporto di Telegram in caso di timeout della richiesta. Errori persistenti di rete/fetch di solito indicano problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="L'avvio segnala un token non autorizzato">

    - `getMe returned 401` è un errore di autenticazione Telegram per il token bot configurato.
    - Ricopia o rigenera il token bot in BotFather, quindi aggiorna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` per l'account predefinito.
    - `deleteWebhook 401 Unauthorized` durante l'avvio è anch'esso un errore di autenticazione; trattarlo come "nessun Webhook esistente" rimanderebbe soltanto lo stesso errore di token non valido alle chiamate API successive.

  </Accordion>

  <Accordion title="Polling o instabilità di rete">

    - Node 22+ + fetch/proxy personalizzato può attivare un comportamento di interruzione immediata se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un'uscita IPv6 non funzionante può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Durante l'avvio del polling, OpenClaw riusa per grammY il probe `getMe` di avvio riuscito, così il runner non deve eseguire un secondo `getMe` prima del primo `getUpdates`.
    - Se `deleteWebhook` fallisce con un errore di rete transitorio durante l'avvio del polling, OpenClaw continua con il long polling invece di eseguire un'altra chiamata di control plane prima del polling. Un Webhook ancora attivo emerge come conflitto `getUpdates`; OpenClaw quindi ricostruisce il trasporto Telegram e ritenta la pulizia del Webhook.
    - Se i socket Telegram vengono riciclati con una cadenza fissa breve, controlla se `channels.telegram.timeoutSeconds` è basso; i client bot limitano i valori configurati al di sotto delle guardie di richiesta in uscita e `getUpdates`, ma le versioni precedenti potevano interrompere ogni poll o risposta quando questo valore era impostato al di sotto di tali guardie.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness di long poll completata per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account polling in esecuzione non ha completato `getUpdates` dopo il periodo di grazia dell'avvio, quando un account Webhook in esecuzione non ha completato `setWebhook` dopo il periodo di grazia dell'avvio, o quando l'ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host segnala comunque falsi riavvii per stallo del polling. Stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o uscita TLS tra l'host e `api.telegram.org`.
    - Telegram rispetta anche le variabili env proxy di processo per il trasporto Bot API, incluse `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le loro varianti minuscole. `NO_PROXY` / `no_proxy` possono comunque escludere `api.telegram.org`.
    - Se il proxy gestito da OpenClaw è configurato tramite `OPENCLAW_PROXY_URL` per un ambiente di servizio e non è presente alcuna env proxy standard, Telegram usa quell'URL anche per il trasporto Bot API.
    - Su host VPS con uscita/TLS diretta instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

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
      per i download media di Telegram per impostazione predefinita. Se un fake-IP attendibile o
      un proxy trasparente riscrive `api.telegram.org` verso un altro
      indirizzo privato/interno/a uso speciale durante i download media, puoi aderire
      al bypass solo per Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La stessa adesione è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host media Telegram in `198.18.x.x`, lascia prima disattivato
      il flag pericoloso. I media Telegram consentono già l'intervallo benchmark
      RFC 2544 per impostazione predefinita.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni
      SSRF dei media Telegram. Usalo solo per ambienti proxy attendibili controllati
      dall'operatore, come il routing fake-IP di Clash, Mihomo o Surge quando
      sintetizzano risposte private o a uso speciale al di fuori dell'intervallo benchmark
      RFC 2544. Lascialo disattivato per il normale accesso Telegram tramite internet pubblico.
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

Altro aiuto: [risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Riferimento di configurazione

Riferimento principale: [riferimento di configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="Campi Telegram ad alto valore informativo">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo degli accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di livello superiore (`type: "acp"`)
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comandi/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/risposte: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- radice API personalizzata: `apiRoot` (solo radice Bot API; non includere `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
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
    Comportamento dell'allowlist per gruppi e topic.
  </Card>
  <Card title="Routing dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Routing multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e topic agli agenti.
  </Card>
  <Card title="Risoluzione dei problemi" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel.
  </Card>
</CardGroup>
