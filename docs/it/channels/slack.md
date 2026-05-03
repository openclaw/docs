---
read_when:
    - Configurazione di Slack o debug della modalità socket/HTTP di Slack
summary: Configurazione di Slack e comportamento in fase di esecuzione (Modalità Socket + URL di richiesta HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T21:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d902fbbad23cee9b3f0ab7d240845b7b229e2d2507c5ea1d1a0fa3baa915d80a
    source_path: channels/slack.md
    workflow: 16
---

Pronto per la produzione per DM e canali tramite integrazioni con app Slack. La modalità predefinita è Socket Mode; sono supportati anche gli HTTP Request URL.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    I DM Slack usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi e catalogo dei comandi.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Nelle impostazioni dell'app Slack premi il pulsante **[Create New App](https://api.slack.com/apps/new)**:

        - scegli **from a manifest** e seleziona uno workspace per la tua app
        - incolla il [manifest di esempio](#manifest-and-scope-checklist) qui sotto e continua con la creazione
        - genera un **App-Level Token** (`xapp-...`) con `connections:write`
        - installa l'app e copia il **Bot Token** (`xoxb-...`) mostrato

      </Step>

      <Step title="Configure OpenClaw">

        Configurazione SecretRef consigliata:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Fallback env (solo account predefinito):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Nelle impostazioni dell'app Slack premi il pulsante **[Create New App](https://api.slack.com/apps/new)**:

        - scegli **from a manifest** e seleziona uno workspace per la tua app
        - incolla il [manifest di esempio](#manifest-and-scope-checklist) e aggiorna gli URL prima della creazione
        - salva il **Signing Secret** per la verifica delle richieste
        - installa l'app e copia il **Bot Token** (`xoxb-...`) mostrato

      </Step>

      <Step title="Configure OpenClaw">

        Configurazione SecretRef consigliata:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Usa percorsi Webhook univoci per HTTP multi-account

        Assegna a ogni account un `webhookPath` distinto (predefinito `/slack/events`) in modo che le registrazioni non entrino in conflitto.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ottimizzazione del trasporto Socket Mode

OpenClaw imposta per impostazione predefinita il timeout pong del client Slack SDK a 15 secondi per Socket Mode. Sovrascrivi le impostazioni di trasporto solo quando hai bisogno di ottimizzazioni specifiche per workspace o host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Usalo solo per workspace Socket Mode che registrano timeout pong/server-ping del websocket Slack o che vengono eseguiti su host con starvation nota dell'event loop. `clientPingTimeout` è l'attesa del pong dopo che l'SDK invia un ping client; `serverPingTimeout` è l'attesa dei ping del server Slack. I messaggi e gli eventi dell'app rimangono stato applicativo, non segnali di liveness del trasporto.

## Checklist del manifest e degli scope

Il manifest di base dell'app Slack è lo stesso per Socket Mode e HTTP Request URL. Solo il blocco `settings` (e l'`url` dello slash command) differisce.

Manifest di base (Socket Mode predefinita):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

Per la **modalità HTTP Request URLs**, sostituisci `settings` con la variante HTTP e aggiungi `url` a ogni slash command. URL pubblico obbligatorio:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
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

### Impostazioni aggiuntive del manifest

Espone funzionalità diverse che estendono i valori predefiniti sopra.

Il manifest predefinito abilita la scheda **Home** di Slack App Home e sottoscrive `app_home_opened`. Quando un membro dello workspace apre la scheda Home, OpenClaw pubblica una vista Home predefinita sicura con `views.publish`; non è incluso alcun payload di conversazione o configurazione privata. La scheda **Messages** rimane abilitata per i DM Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    È possibile usare più [slash command nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con alcune sfumature:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non possono essere resi disponibili più di 25 slash command contemporaneamente.

    Sostituisci la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
        "command": "/side",
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
      <Tab title="HTTP Request URLs">
        Usa lo stesso elenco `slash_commands` di Socket Mode sopra e aggiungi `"url": "https://gateway-host.example.com/slack/events"` a ogni voce. Esempio:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ambiti di paternità opzionali (operazioni di scrittura)">
    Aggiungi l'ambito bot `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (nome utente e icona personalizzati) invece dell'identità predefinita dell'app Slack.

    Se usi un'icona emoji, Slack si aspetta la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Ambiti token utente opzionali (operazioni di lettura)">
    Se configuri `channels.slack.userToken`, gli ambiti di lettura tipici sono:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se dipendi dalle letture di ricerca Slack)

  </Accordion>
</AccordionGroup>

## Modello dei token

- `botToken` + `appToken` sono richiesti per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  in testo normale o oggetti SecretRef.
- I token di configurazione sovrascrivono il fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo da configurazione (nessun fallback env) e usa per impostazione predefinita il comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dell'istantanea di stato:

- L'ispezione dell'account Slack tiene traccia dei campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra origine segreta non inline, ma il comando/percorso runtime corrente
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP, `signingSecretStatus` è incluso; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per le azioni/letture della directory, il token utente può essere preferito quando configurato. Per le scritture, il token bot resta preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il token bot non è disponibile.
</Tip>

## Azioni e gate

Le azioni Slack sono controllate da `channels.slack.actions.*`.

Gruppi di azioni disponibili negli strumenti Slack correnti:

| Gruppo     | Predefinito |
| ---------- | ----------- |
| messaggi   | abilitato   |
| reazioni   | abilitato   |
| pin        | abilitato   |
| memberInfo | abilitato   |
| emojiList  | abilitato   |

Le azioni messaggio Slack correnti includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` accetta gli ID file Slack mostrati nei placeholder file in ingresso e restituisce anteprime immagine per le immagini o metadati file locali per altri tipi di file.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Criterio DM">
    `channels.slack.dmPolicy` controlla l'accesso ai DM. `channels.slack.allowFrom` è l'allowlist DM canonica.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (true predefinito)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM di gruppo false predefinito)
    - `dm.groupChannels` (allowlist MPIM opzionale)

    Precedenza multi-account:

    - `channels.slack.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account denominati ereditano `channels.slack.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account denominati non ereditano `channels.slack.accounts.default.allowFrom`.

    I valori legacy `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    L'abbinamento nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Criterio canale">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'allowlist dei canali risiede sotto `channels.slack.channels` e **deve usare ID canale Slack stabili** (per esempio `C12345678`) come chiavi di configurazione.

    Nota runtime: se `channels.slack` è completamente assente (configurazione solo env), il runtime ricade su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci dell'allowlist canali e dell'allowlist DM vengono risolte all'avvio quando l'accesso token lo consente
    - le voci di nome canale non risolte vengono mantenute come configurate ma ignorate per l'instradamento per impostazione predefinita
    - l'autorizzazione in ingresso e l'instradamento dei canali sono ID-first per impostazione predefinita; la corrispondenza diretta con nome utente/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Le chiavi basate sul nome (`#channel-name` o `channel-name`) **non** corrispondono con `groupPolicy: "allowlist"`. La ricerca del canale è ID-first per impostazione predefinita, quindi una chiave basata sul nome non instraderà mai correttamente e tutti i messaggi in quel canale saranno bloccati silenziosamente. Questo differisce da `groupPolicy: "open"`, dove la chiave del canale non è richiesta per l'instradamento e una chiave basata sul nome sembra funzionare.

    Usa sempre l'ID canale Slack come chiave. Per trovarlo: fai clic con il pulsante destro sul canale in Slack → **Copia link** — l'ID (`C...`) appare alla fine dell'URL.

    Corretto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Errato (bloccato silenziosamente con `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Menzioni e utenti del canale">
    I messaggi del canale richiedono una menzione per impostazione predefinita.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - menzione di un gruppo utenti Slack (`<!subteam^S...>`) quando l'utente bot è membro di quel gruppo utenti; richiede `usergroups:read`
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito del thread di risposta al bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato chiave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o carattere jolly `"*"`
      (le chiavi legacy senza prefisso si mappano ancora solo a `id:`)

    `allowBots` è conservativo per canali e canali privati: i messaggi di stanza creati da bot sono accettati solo quando il bot mittente è elencato esplicitamente nell'allowlist `users` di quella stanza, oppure quando almeno un ID proprietario Slack esplicito da `channels.slack.allowFrom` è attualmente membro della stanza. I caratteri jolly e le voci proprietario con nome visualizzato non soddisfano la presenza del proprietario. La presenza del proprietario usa Slack `conversations.members`; assicurati che l'app abbia l'ambito di lettura corrispondente per il tipo di stanza (`channels:read` per i canali pubblici, `groups:read` per i canali privati). Se la ricerca dei membri fallisce, OpenClaw scarta il messaggio di stanza creato da bot.

  </Tab>
</Tabs>

## Thread, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- I binding di route Slack accettano ID peer grezzi più forme target Slack come `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Con `session.dmScope=main` predefinito, i DM Slack convergono nella sessione principale dell'agente.
- Sessioni canale: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione thread (`:thread:<threadTs>`) quando applicabile.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi thread esistenti vengono recuperati quando una nuova sessione thread viene avviata (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando `true`, sopprime le menzioni implicite nei thread così il bot risponde solo a menzioni `@bot` esplicite dentro i thread, anche quando il bot ha già partecipato al thread. Senza questo, le risposte in un thread con partecipazione del bot aggirano il gate `requireMention`.

Controlli dei thread di risposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per chat dirette: `channels.slack.dm.replyToMode`

I tag di risposta manuali sono supportati:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` disabilita **tutti** i thread di risposta in Slack, inclusi i tag espliciti `[[reply_to_*]]`. Questo differisce da Telegram, dove i tag espliciti vengono ancora rispettati in modalità `"off"`. I thread Slack nascondono i messaggi dal canale mentre le risposte Telegram restano visibili inline.
</Note>

## Reazioni di conferma

`ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji dell'identità agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcode (per esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o globalmente.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo di anteprima con l'ultimo output parziale.
- `block`: aggiunge aggiornamenti di anteprima a blocchi.
- `progress`: mostra testo di stato di avanzamento durante la generazione, quindi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima bozza è attiva, instrada gli aggiornamenti strumento/avanzamento nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi strumento/avanzamento separati.

`channels.slack.streaming.nativeTransport` controlla lo streaming di testo nativo Slack quando `channels.slack.streaming.mode` è `partial` (predefinito: `true`).

- Deve essere disponibile un thread di risposta affinché lo streaming di testo nativo e lo stato del thread assistente Slack appaiano. La selezione del thread segue comunque `replyToMode`.
- Canale, chat di gruppo e radici DM di primo livello possono ancora usare la normale anteprima bozza quando lo streaming nativo non è disponibile o non esiste alcun thread di risposta.
- I DM Slack di primo livello restano fuori thread per impostazione predefinita, quindi non mostrano l'anteprima di stream/stato nativa in stile thread di Slack; OpenClaw pubblica e modifica invece un'anteprima bozza nel DM.
- Media e payload non testuali usano come fallback la consegna normale.
- I finali media/errore annullano le modifiche di anteprima in sospeso; i finali testo/blocco idonei vengono svuotati solo quando possono modificare l'anteprima sul posto.
- Se lo streaming fallisce a metà risposta, OpenClaw torna alla consegna normale per i payload rimanenti.

Usa l'anteprima bozza invece dello streaming di testo nativo Slack:

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
- booleano `channels.slack.streaming` viene migrato automaticamente a `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- legacy `channels.slack.nativeStreaming` viene migrato automaticamente a `channels.slack.streaming.nativeTransport`.

## Fallback reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw sta elaborando una risposta, quindi la rimuove quando l'esecuzione termina. Questo è più utile al di fuori delle risposte nei thread, che usano un indicatore di stato predefinito "sta digitando...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (per esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente dopo il completamento della risposta o del percorso di errore.

## Media, suddivisione in chunk e recapito

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati di file Slack vengono scaricati dagli URL privati ospitati da Slack (flusso di richiesta autenticato con token) e scritti nello store dei media quando il recupero riesce e i limiti di dimensione lo consentono. I segnaposto dei file includono il `fileId` di Slack, così gli agenti possono recuperare il file originale con `download-file`.

    I download usano timeout limitati per inattività e durata totale. Se il recupero dei file Slack si blocca o non riesce, OpenClaw continua a elaborare il messaggio e ripiega sul segnaposto del file.

    Il limite runtime predefinito per le dimensioni in ingresso è `20MB`, salvo override tramite `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i chunk di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione dando priorità ai paragrafi
    - gli invii di file usano le API di caricamento Slack e possono includere risposte nei thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME dalla pipeline media

  </Accordion>

  <Accordion title="Destinatari di recapito">
    Destinatari espliciti preferiti:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack solo testo/blocchi possono pubblicare direttamente sugli ID utente; i caricamenti di file e gli invii in thread aprono prima il DM tramite le API di conversazione Slack perché quei percorsi richiedono un ID conversazione concreto.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento slash

I comandi slash appaiono in Slack come un singolo comando configurato o come più comandi nativi. Configura `channels.slack.slashCommand` per cambiare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni aggiuntive del manifesto](#additional-manifest-settings) nella tua app Slack e vengono invece abilitati con `channels.slack.commands.native: true` o `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi Slack.

```txt
/help
```

I menu di argomenti nativi usano una strategia di rendering adattiva che mostra una finestra modale di conferma prima di inviare il valore di un'opzione selezionata:

- fino a 5 opzioni: blocchi pulsante
- 6-100 opzioni: menu di selezione statico
- più di 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gestori delle opzioni di interattività
- limiti Slack superati: i valori delle opzioni codificati ripiegano sui pulsanti

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e instradano comunque le esecuzioni dei comandi alla sessione della conversazione di destinazione usando `CommandTargetSessionKey`.

## Risposte interattive

Slack può visualizzare controlli di risposta interattivi creati dagli agenti, ma questa funzionalità è disabilitata per impostazione predefinita.

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

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni attraverso il percorso esistente degli eventi di interazione Slack.

Note:

- Questa è un'interfaccia utente specifica di Slack. Gli altri canali non traducono le direttive Slack Block Kit nei propri sistemi di pulsanti.
- I valori di callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superassero i limiti di Slack Block Kit, OpenClaw ripiega sulla risposta testuale originale invece di inviare un payload di blocchi non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti e interazioni interattivi, invece di ripiegare sull'interfaccia Web o sul terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo DM/canale.
- Le approvazioni Plugin possono comunque risolversi tramite la stessa superficie di pulsanti nativa Slack quando la richiesta arriva già in Slack e il tipo di ID approvazione è `plugin:`.
- L'autorizzazione degli approvatori viene comunque applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie condivisa dei pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitato nelle impostazioni della tua app Slack, le richieste di approvazione vengono visualizzate come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, sono la UX di approvazione principale; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le approvazioni
in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opzionale; ripiega su `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e almeno un
approvatore viene risolto. Imposta `enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo.
Imposta `enabled: true` per forzare l'attivazione delle approvazioni native quando gli approvatori vengono risolti.

Comportamento predefinito senza configurazione esplicita delle approvazioni exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configurazione nativa Slack esplicita è necessaria solo quando vuoi sovrascrivere gli approvatori, aggiungere filtri o
aderire al recapito nella chat di origine:

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

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando le richieste di approvazione exec devono essere instradate anche
verso altre chat o destinatari espliciti fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi Slack possono comunque risolvere approvazioni Plugin quando quelle richieste arrivano già
in Slack.

Anche `/approve` nella stessa chat funziona nei canali Slack e nei DM che supportano già i comandi. Consulta [Approvazioni exec](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi vengono mappate in eventi di sistema.
- Le trasmissioni di thread (risposte di thread "Also send to channel") vengono elaborate come normali messaggi utente.
- Gli eventi di aggiunta/rimozione di reazioni vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita dei membri, creazione/ridenominazione di canali e aggiunta/rimozione di pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati di argomento/scopo del canale sono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- Il messaggio iniziale del thread e l'inizializzazione del contesto della cronologia iniziale del thread vengono filtrati dagli allowlist dei mittenti configurati, quando applicabile.
- Le azioni sui blocchi e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi di payload ricchi:
  - azioni sui blocchi: valori selezionati, etichette, valori dei picker e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradato e input del modulo

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Slack](/it/gateway/config-channels#slack).

<Accordion title="Campi Slack ad alto segnale">

- modalità/autenticazione: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle di compatibilità: `dangerouslyAllowNameMatching` (break-glass; mantieni disattivato salvo necessità)
- accesso al canale: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- thread/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- recapito: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operazioni/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, in ordine:

    - `groupPolicy`
    - allowlist del canale (`channels.slack.channels`) — **le chiavi devono essere ID canale** (`C12345678`), non nomi (`#channel-name`). Le chiavi basate sul nome falliscono silenziosamente con `groupPolicy: "allowlist"` perché l'instradamento dei canali è ID-first per impostazione predefinita. Per trovare un ID: fai clic destro sul canale in Slack → **Copy link** — il valore `C...` alla fine dell'URL è l'ID canale.
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
    - `channels.slack.dmPolicy` (o legacy `channels.slack.dm.policy`)
    - approvazioni di pairing / voci allowlist
    - Eventi DM di Slack Assistant: log dettagliati che menzionano `drop message_changed`
      di solito indicano che Slack ha inviato un evento di thread Assistant modificato senza un
      mittente umano recuperabile nei metadati del messaggio

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode non si connette">
    Valida i token bot + app e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime corrente non è riuscito a risolvere il valore basato su SecretRef.

  </Accordion>

  <Accordion title="La modalità HTTP non riceve eventi">
    Valida:

    - signing secret
    - percorso Webhook
    - URL delle richieste Slack (eventi + interattività + comandi slash)
    - `webhookPath` univoco per account HTTP

    Se `signingSecretStatus: "configured_unavailable"` appare negli snapshot degli account,
    l'account HTTP è configurato ma il runtime corrente non è riuscito a
    risolvere il signing secret basato su SecretRef.

  </Accordion>

  <Accordion title="I comandi nativi/slash non si attivano">
    Verifica se intendevi:

    - modalità comando nativa (`channels.slack.commands.native: true`) con comandi slash corrispondenti registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Controlla anche `commands.useAccessGroups` e gli allowlist di canali/utenti.

  </Accordion>
</AccordionGroup>

## Riferimento vision per gli allegati

Slack può allegare media scaricati al turno dell'agente quando i download dei file Slack riescono e i limiti di dimensione lo consentono. I file immagine possono passare attraverso il percorso di comprensione dei media o direttamente a un modello di risposta con capacità vision; gli altri file vengono mantenuti come contesto di file scaricabile invece di essere trattati come input immagine.

### Tipi di media supportati

| Tipo di media                  | Origine              | Comportamento attuale                                                               | Note                                                                                         |
| ------------------------------ | -------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Immagini JPEG / PNG / GIF / WebP | URL file Slack       | Scaricate e allegate al turno per la gestione con funzionalità visive               | Limite per file: `channels.slack.mediaMaxMb` (predefinito 20 MB)                             |
| File PDF                       | URL file Slack       | Scaricati ed esposti come contesto file per strumenti come `download-file` o `pdf`  | L’input Slack non converte automaticamente i PDF in input di visione tramite immagini         |
| Altri file                     | URL file Slack       | Scaricati quando possibile ed esposti come contesto file                             | I file binari non vengono trattati come input immagine                                        |
| Risposte nei thread            | File del messaggio iniziale del thread | I file del messaggio radice possono essere idratati come contesto quando la risposta non ha media diretti | I messaggi iniziali composti solo da file usano un segnaposto di allegato                     |
| Messaggi con più immagini      | Più file Slack       | Ogni file viene valutato in modo indipendente                                        | L’elaborazione Slack è limitata a otto file per messaggio                                     |

### Pipeline in ingresso

Quando arriva un messaggio Slack con file allegati:

1. OpenClaw scarica il file dall’URL privato di Slack usando il token del bot (`xoxb-...`).
2. In caso di successo, il file viene scritto nell’archivio media.
3. I percorsi dei media scaricati e i tipi di contenuto vengono aggiunti al contesto in ingresso.
4. I percorsi di modelli/strumenti con supporto per immagini possono usare gli allegati immagine da quel contesto.
5. I file non immagine restano disponibili come metadati file o riferimenti media per gli strumenti che possono gestirli.

### Ereditarietà degli allegati dalla radice del thread

Quando arriva un messaggio in un thread (ha un genitore `thread_ts`):

- Se la risposta non ha media diretti e il messaggio radice incluso ha file, Slack può idratare i file radice come contesto del messaggio iniziale del thread.
- Gli allegati diretti della risposta hanno precedenza sugli allegati del messaggio radice.
- Un messaggio radice che contiene solo file e nessun testo viene rappresentato con un segnaposto di allegato, così il fallback può comunque includerne i file.

### Gestione di più allegati

Quando un singolo messaggio Slack contiene più file allegati:

- Ogni allegato viene elaborato in modo indipendente attraverso la pipeline media.
- I riferimenti ai media scaricati vengono aggregati nel contesto del messaggio.
- L’ordine di elaborazione segue l’ordine dei file Slack nel payload dell’evento.
- Un errore nel download di un allegato non blocca gli altri.

### Limiti di dimensione, download e modello

- **Limite di dimensione**: predefinito 20 MB per file. Configurabile tramite `channels.slack.mediaMaxMb`.
- **Errori di download**: i file che Slack non può servire, gli URL scaduti, i file inaccessibili, i file troppo grandi e le risposte HTML di autenticazione/accesso Slack vengono ignorati invece di essere segnalati come formati non supportati.
- **Modello di visione**: l’analisi delle immagini usa il modello di risposta attivo quando supporta la visione, oppure il modello immagine configurato in `agents.defaults.imageModel`.

### Limiti noti

| Scenario                               | Comportamento attuale                                                       | Soluzione alternativa                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| URL file Slack scaduto                 | File ignorato; nessun errore mostrato                                        | Ricarica il file in Slack                                                             |
| Modello di visione non configurato     | Gli allegati immagine vengono archiviati come riferimenti media, ma non analizzati come immagini | Configura `agents.defaults.imageModel` o usa un modello di risposta con supporto per la visione |
| Immagini molto grandi (> 20 MB per impostazione predefinita) | Ignorate in base al limite di dimensione                                     | Aumenta `channels.slack.mediaMaxMb` se Slack lo consente                              |
| Allegati inoltrati/condivisi           | Testo e media immagine/file ospitati da Slack vengono gestiti con il massimo impegno | Ricondividi direttamente nel thread OpenClaw                                          |
| Allegati PDF                           | Archiviati come contesto file/media, non instradati automaticamente tramite visione immagine | Usa `download-file` per i metadati file o lo strumento `pdf` per l’analisi PDF        |

### Documentazione correlata

- [Pipeline di comprensione dei media](/it/nodes/media-understanding)
- [Strumento PDF](/it/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — abilitazione della visione per gli allegati Slack
- Test di regressione: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifica live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Correlati

<CardGroup cols={2}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Abbina un utente Slack al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento dei canali e dei DM di gruppo.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e rafforzamento.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Struttura e precedenza della configurazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Catalogo e comportamento dei comandi.
  </Card>
</CardGroup>
