---
read_when:
    - Configurazione di Slack o debug della modalità socket/HTTP di Slack
summary: Configurazione di Slack e comportamento in esecuzione (Socket Mode + URL di richiesta HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-23T08:24:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3daf52cd28998bf7d692190468b9d8330f1867f56e49fc69666e7e107d4ba47c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Stato: pronta per la produzione per DM + canali tramite integrazioni dell'app Slack. La modalità predefinita è Socket Mode; sono supportati anche gli URL di richiesta HTTP.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di Slack usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (predefinita)">
    <Steps>
      <Step title="Crea una nuova app Slack">
        Nelle impostazioni dell'app Slack premi il pulsante **[Create New App](https://api.slack.com/apps/new)**:

        - scegli **from a manifest** e seleziona un workspace per la tua app
        - incolla il [manifest di esempio](#manifest-and-scope-checklist) qui sotto e continua per creare l'app
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - installa l'app e copia il **Bot Token** (`xoxb-...`) mostrato
      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback tramite variabili d'ambiente (solo account predefinito):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Avvia il gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL di richiesta HTTP">
    <Steps>
      <Step title="Crea una nuova app Slack">
        Nelle impostazioni dell'app Slack premi il pulsante **[Create New App](https://api.slack.com/apps/new)**:

        - scegli **from a manifest** e seleziona un workspace per la tua app
        - incolla il [manifest di esempio](#manifest-and-scope-checklist) e aggiorna gli URL prima di creare l'app
        - salva il **Signing Secret** per la verifica delle richieste
        - installa l'app e copia il **Bot Token** (`xoxb-...`) mostrato

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Usa percorsi webhook univoci per l'HTTP multi-account

        Assegna a ogni account un `webhookPath` distinto (predefinito `/slack/events`) in modo che le registrazioni non vadano in conflitto.
        </Note>

      </Step>

      <Step title="Avvia il gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist di manifest e scope

<Tabs>
  <Tab title="Socket Mode (predefinita)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="URL di richiesta HTTP">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Impostazioni aggiuntive del manifest

Espongono funzionalità diverse che estendono i valori predefiniti sopra.

<AccordionGroup>
  <Accordion title="Comandi slash nativi facoltativi">

    È possibile usare più [comandi slash nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con alcune particolarità:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non possono essere resi disponibili più di 25 comandi slash contemporaneamente.

    Sostituisci la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predefinita)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="URL di richiesta HTTP">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Reset the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Stop the current run",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "List providers or models for a provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Scope di authoring facoltativi (operazioni di scrittura)">
    Aggiungi lo scope bot `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (nome utente e icona personalizzati) invece dell'identità predefinita dell'app Slack.

    Se usi un'icona emoji, Slack si aspetta la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Scope del token utente facoltativi (operazioni di lettura)">
    Se configuri `channels.slack.userToken`, gli scope di lettura tipici sono:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se dipendi dalle letture tramite ricerca Slack)

  </Accordion>
</AccordionGroup>

## Modello dei token

- `botToken` + `appToken` sono richiesti per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  in chiaro o oggetti SecretRef.
- I token di configurazione hanno precedenza sul fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo di configurazione (nessun fallback env) e usa come predefinito il comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dello snapshot di stato:

- L'ispezione dell'account Slack traccia i campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` oppure `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra sorgente di segreti non inline, ma il percorso attuale del comando/runtime
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP viene incluso `signingSecretStatus`; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per azioni/letture di directory, il token utente può essere preferito quando configurato. Per le scritture, il token bot resta preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il token bot non è disponibile.
</Tip>

## Azioni e controlli

Le azioni Slack sono controllate da `channels.slack.actions.*`.

Gruppi di azioni disponibili negli strumenti Slack attuali:

| Gruppo     | Predefinito |
| ---------- | ----------- |
| messages   | abilitato   |
| reactions  | abilitato   |
| pins       | abilitato   |
| memberInfo | abilitato   |
| emojiList  | abilitato   |

Le attuali azioni dei messaggi Slack includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Policy DM">
    `channels.slack.dmPolicy` controlla l'accesso DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (predefinito true)
    - `channels.slack.allowFrom` (preferito)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (i DM di gruppo sono false per impostazione predefinita)
    - `dm.groupChannels` (allowlist MPIM facoltativa)

    Precedenza multi-account:

    - `channels.slack.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account con nome ereditano `channels.slack.allowFrom` quando il loro `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.slack.accounts.default.allowFrom`.

    L'abbinamento nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Policy del canale">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'allowlist dei canali si trova in `channels.slack.channels` e dovrebbe usare ID canale stabili.

    Nota di runtime: se `channels.slack` manca completamente (configurazione solo env), il runtime usa il fallback `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci dell'allowlist dei canali e dei DM vengono risolte all'avvio quando l'accesso token lo consente
    - le voci non risolte basate sul nome del canale vengono mantenute come configurate ma ignorate per l'instradamento per impostazione predefinita
    - l'autorizzazione in ingresso e l'instradamento dei canali sono basati prima sugli ID per impostazione predefinita; la corrispondenza diretta per username/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menzioni e utenti del canale">
    I messaggi nei canali sono bloccati dalle menzioni per impostazione predefinita.

    Sorgenti delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta nei thread al bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; i nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato della chiave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oppure wildcard `"*"`
      (le chiavi legacy senza prefisso continuano a essere mappate solo a `id:`)

  </Tab>
</Tabs>

## Thread, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- Con il valore predefinito `session.dmScope=main`, i DM di Slack confluiscono nella sessione principale dell'agente.
- Sessioni di canale: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione thread (`:thread:<threadTs>`) quando applicabile.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi esistenti del thread vengono recuperati quando inizia una nuova sessione thread (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando è `true`, sopprime le menzioni implicite nei thread in modo che il bot risponda solo a menzioni esplicite `@bot` all'interno dei thread, anche quando il bot ha già partecipato al thread. Senza questo, le risposte in un thread a cui il bot ha partecipato aggirano il controllo `requireMention`.

Controlli di threading delle risposte:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per chat dirette: `channels.slack.dm.replyToMode`

Sono supportati tag di risposta manuali:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` disabilita **tutto** il threading delle risposte in Slack, inclusi i tag espliciti `[[reply_to_*]]`. Questo differisce da Telegram, dove i tag espliciti vengono comunque rispettati in modalità `"off"`. La differenza riflette i modelli di threading della piattaforma: i thread Slack nascondono i messaggi dal canale, mentre le risposte Telegram restano visibili nel flusso principale della chat.

Le risposte mirate nei thread Slack vengono instradate tramite la loro sessione ACP associata quando esiste, invece di preparare la risposta rispetto alla shell predefinita dell'agente. Questo mantiene intatti i binding `/focus` e `/acp spawn ... --bind here` per i messaggi successivi nel thread.

## Reazioni di ack

`ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcodes (per esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o a livello globale.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo di anteprima con l'output parziale più recente.
- `block`: aggiunge aggiornamenti di anteprima a blocchi.
- `progress`: mostra il testo di stato di avanzamento durante la generazione, quindi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima bozza è attiva, instrada gli aggiornamenti di strumenti/progresso nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere separati i messaggi di strumenti/progresso.

`channels.slack.streaming.nativeTransport` controlla lo streaming testuale nativo di Slack quando `channels.slack.streaming.mode` è `partial` (predefinito: `true`).

- Deve essere disponibile un thread di risposta affinché compaiano lo streaming testuale nativo e lo stato del thread dell'assistente Slack. La selezione del thread continua comunque a seguire `replyToMode`.
- Le radici di canali e chat di gruppo possono comunque usare la normale anteprima bozza quando lo streaming nativo non è disponibile.
- I DM Slack di primo livello restano fuori thread per impostazione predefinita, quindi non mostrano l'anteprima in stile thread; usa risposte nei thread o `typingReaction` se vuoi un avanzamento visibile lì.
- I payload multimediali e non testuali usano il fallback alla consegna normale.
- I finali media/errore annullano le modifiche di anteprima in sospeso senza scaricare una bozza temporanea; i finali testuali/a blocchi idonei vengono scaricati solo quando possono modificare l'anteprima sul posto.
- Se lo streaming fallisce a metà risposta, OpenClaw usa il fallback alla consegna normale per i payload rimanenti.
- I canali Slack Connect che rifiutano uno stream prima che l'SDK scarichi il proprio buffer locale usano il fallback alle normali risposte Slack, così le risposte brevi non vengono silenziosamente scartate né segnalate come consegnate prima che Slack le confermi.

Usa l'anteprima bozza invece dello streaming testuale nativo di Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Chiavi legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) viene migrato automaticamente a `channels.slack.streaming.mode`.
- il booleano `channels.slack.streaming` viene migrato automaticamente a `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- il legacy `channels.slack.nativeStreaming` viene migrato automaticamente a `channels.slack.streaming.nativeTransport`.

## Fallback della reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw elabora una risposta, quindi la rimuove al termine dell'esecuzione. Questo è particolarmente utile fuori dalle risposte nei thread, che usano un indicatore di stato predefinito "sta scrivendo...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcodes (per esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente al termine del percorso di risposta o di errore.

## Media, chunking e consegna

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati file di Slack vengono scaricati da URL privati ospitati da Slack (flusso di richiesta autenticato tramite token) e scritti nell'archivio media quando il recupero riesce e i limiti di dimensione lo consentono.

    Il limite di dimensione runtime in ingresso è `20MB` per impostazione predefinita, salvo override con `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione con priorità ai paragrafi
    - gli invii di file usano le API di upload di Slack e possono includere risposte nei thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME dalla pipeline media
  </Accordion>

  <Accordion title="Destinazioni di consegna">
    Destinazioni esplicite preferite:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack vengono aperti tramite le API di conversazione di Slack quando si invia a destinazioni utente.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento dei comandi slash

I comandi slash compaiono in Slack come un singolo comando configurato o come più comandi nativi. Configura `channels.slack.slashCommand` per modificare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni aggiuntive del manifest](#additional-manifest-settings) nella tua app Slack e vengono abilitati con `channels.slack.commands.native: true` oppure `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi di Slack.

```txt
/help
```

I menu argomento nativi usano una strategia di rendering adattiva che mostra una finestra modale di conferma prima di inviare un valore di opzione selezionato:

- fino a 5 opzioni: blocchi pulsante
- 6-100 opzioni: menu di selezione statico
- oltre 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gli handler delle opzioni di interattività
- limiti Slack superati: i valori di opzione codificati usano il fallback ai pulsanti

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e continuano a instradare le esecuzioni dei comandi verso la sessione della conversazione di destinazione usando `CommandTargetSessionKey`.

## Risposte interattive

Slack può renderizzare controlli di risposta interattiva creati dall'agente, ma questa funzionalità è disabilitata per impostazione predefinita.

Abilitala globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Oppure abilitala solo per un account Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando è abilitata, gli agenti possono emettere direttive di risposta solo Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni attraverso il percorso di evento di interazione Slack esistente.

Note:

- Questa è un'interfaccia specifica di Slack. Gli altri canali non traducono le direttive Slack Block Kit nei propri sistemi di pulsanti.
- I valori di callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superano i limiti di Slack Block Kit, OpenClaw usa il fallback alla risposta testuale originale invece di inviare un payload di blocchi non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti interattivi e interazioni, invece di usare il fallback alla Web UI o al terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo DM/canale.
- Le approvazioni dei plugin possono comunque essere risolte tramite la stessa superficie di pulsanti nativa Slack quando la richiesta arriva già in Slack e il tipo di ID approvazione è `plugin:`.
- L'autorizzazione degli approvatori viene comunque applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie condivisa di pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitato nelle impostazioni della tua app Slack, i prompt di approvazione vengono renderizzati come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, rappresentano l'UX principale di approvazione; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le
approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; usa il fallback a `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e viene risolto almeno un
approvatore. Imposta `enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo.
Imposta `enabled: true` per forzare l'attivazione delle approvazioni native quando gli approvatori vengono risolti.

Comportamento predefinito senza configurazione esplicita delle approvazioni exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configurazione esplicita nativa Slack è necessaria solo quando vuoi sovrascrivere gli approvatori, aggiungere filtri o
attivare la consegna alla chat di origine:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando i prompt di approvazione exec devono essere instradati anche
verso altre chat o destinazioni esplicite out-of-band. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi Slack possono comunque risolvere le approvazioni dei plugin quando tali richieste arrivano già
in Slack.

Anche `/approve` nella stessa chat funziona nei canali e nei DM Slack che già supportano i comandi. Vedi [Approvazioni exec](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi e i thread broadcast vengono mappati in eventi di sistema.
- Gli eventi di aggiunta/rimozione delle reazioni vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita dei membri, creazione/rinomina del canale e aggiunta/rimozione dei pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati di topic/purpose del canale vengono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- Il seeding del contesto dello starter del thread e della cronologia iniziale del thread viene filtrato dalle allowlist dei mittenti configurate, quando applicabile.
- Le azioni block e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload ricchi:
  - azioni block: valori selezionati, etichette, valori del selettore e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradati e input del modulo

## Puntatori al riferimento della configurazione

Riferimento principale:

- [Riferimento della configurazione - Slack](/it/gateway/configuration-reference#slack)

  Campi Slack ad alto segnale:
  - modalità/autenticazione: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle di compatibilità: `dangerouslyAllowNameMatching` (break-glass; tienilo disattivato salvo necessità)
  - accesso canale: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operazioni/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, in ordine:

    - `groupPolicy`
    - allowlist del canale (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` per canale

    Comandi utili:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messaggi DM ignorati">
    Controlla:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oppure legacy `channels.slack.dm.policy`)
    - approvazioni di abbinamento / voci allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode non si connette">
    Verifica i token bot + app e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` oppure
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime attuale non è riuscito a risolvere il valore
    supportato da SecretRef.

  </Accordion>

  <Accordion title="La modalità HTTP non riceve eventi">
    Verifica:

    - signing secret
    - percorso webhook
    - URL Request di Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` univoco per ogni account HTTP

    Se `signingSecretStatus: "configured_unavailable"` appare negli snapshot
    dell'account, l'account HTTP è configurato ma il runtime attuale non è riuscito
    a risolvere il signing secret supportato da SecretRef.

    I webhook URL Request registrati vengono instradati tramite lo stesso registro di handler condiviso usato dalla configurazione del monitor Slack, quindi gli eventi Slack in modalità HTTP continuano a essere instradati attraverso il percorso registrato invece di restituire 404 dopo la corretta registrazione della route.

  </Accordion>

  <Accordion title="Download di file con token bot personalizzati">
    L'helper `downloadFile` risolve il proprio token bot dalla configurazione runtime quando un chiamante passa `cfg` senza un `token` esplicito o un client precompilato, preservando i download di file solo-cfg al di fuori del percorso runtime dell'azione.
  </Accordion>

  <Accordion title="I comandi nativi/slash non si attivano">
    Verifica se intendevi usare:

    - modalità comandi nativi (`channels.slack.commands.native: true`) con i corrispondenti comandi slash registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Controlla anche `commands.useAccessGroups` e le allowlist di canale/utente.

  </Accordion>
</AccordionGroup>

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
- [Configurazione](/it/gateway/configuration)
- [Comandi slash](/it/tools/slash-commands)
