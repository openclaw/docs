---
read_when:
    - Configurare Slack o eseguire il debug della modalità socket, HTTP o relay di Slack
summary: Configurazione di Slack e comportamento in fase di esecuzione (Socket Mode, URL di richiesta HTTP e modalità relay)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Pronto per la produzione per DM e canali tramite integrazioni app Slack. La modalità predefinita è Socket Mode; sono supportati anche gli HTTP Request URL. La modalità relay è pensata per distribuzioni gestite in cui un router attendibile controlla l'ingresso Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    I DM Slack usano per impostazione predefinita la modalità di pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi e catalogo dei comandi.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
</CardGroup>

## Scegliere Socket Mode o gli HTTP Request URL

Entrambi i trasporti sono pronti per la produzione e raggiungono la parità di funzionalità per messaggistica, slash command, App Home e interattività. Scegli in base alla forma della distribuzione, non alle funzionalità.

| Aspetto                      | Socket Mode (predefinito)                                                                                                                            | HTTP Request URL                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pubblico del Gateway     | Non richiesto                                                                                                                                         | Richiesto (DNS, TLS, reverse proxy o tunnel)                                                                   |
| Rete in uscita               | Il WSS in uscita verso `wss-primary.slack.com` deve essere raggiungibile                                                                              | Nessun WS in uscita; solo HTTPS in ingresso                                                                    |
| Token necessari              | Token bot + App-Level Token con `connections:write`                                                                                                  | Token bot + Signing Secret                                                                                     |
| Laptop di sviluppo / dietro firewall | Funziona così com'è                                                                                                                          | Richiede un tunnel pubblico (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway di staging               |
| Scalabilità orizzontale      | Una sessione Socket Mode per app per host; più Gateway richiedono app Slack separate                                                                  | Handler POST stateless; più repliche Gateway possono condividere un'app dietro un load balancer                |
| Multi-account su un Gateway  | Supportato; ogni account apre il proprio WS                                                                                                          | Supportato; ogni account richiede un `webhookPath` univoco (predefinito `/slack/events`) per evitare collisioni tra registrazioni |
| Trasporto slash command      | Consegnato tramite la connessione WS; `slash_commands[].url` viene ignorato                                                                           | Slack invia POST a `slash_commands[].url`; il campo è richiesto perché il comando venga inviato                |
| Firma delle richieste        | Non usata (l'autenticazione è l'App-Level Token)                                                                                                     | Slack firma ogni richiesta; OpenClaw verifica con `signingSecret`                                             |
| Recupero dopo caduta della connessione | La riconnessione automatica dell'SDK Slack è abilitata; OpenClaw riavvia anche le sessioni Socket Mode non riuscite con backoff limitato. Si applica la regolazione del trasporto per timeout pong. | Nessuna connessione persistente che possa cadere; i retry sono per singola richiesta da Slack                  |

<Note>
  **Scegli Socket Mode** per host con un solo Gateway, laptop di sviluppo e reti on-prem che possono raggiungere `*.slack.com` in uscita ma non possono accettare HTTPS in ingresso.

**Scegli gli HTTP Request URL** quando esegui più repliche Gateway dietro un load balancer, quando il WSS in uscita è bloccato ma l'HTTPS in ingresso è consentito, oppure quando termini già i Webhook Slack su un reverse proxy.
</Note>

### Modalità relay

La modalità relay separa l'ingresso Slack dal gateway OpenClaw. Un router attendibile controlla la singola connessione Slack Socket Mode, sceglie un gateway di destinazione e inoltra un evento tipizzato tramite un websocket autenticato. Il gateway continua a usare il proprio token bot per le chiamate in uscita alla Slack Web API.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

L'URL relay deve usare `wss://` a meno che non punti a localhost. Considera il bearer token e la tabella di routing del router come parte del confine di autorizzazione Slack: gli eventi instradati entrano nel normale handler dei messaggi Slack come attivazioni autorizzate. Un `slack_identity` fornito dal router nel frame websocket `hello` può impostare il nome utente e l'icona predefiniti in uscita; un'identità esplicita fornita dal chiamante ha comunque la precedenza. La connessione relay si riconnette con la stessa temporizzazione di backoff limitato usata da Socket Mode e cancella l'identità fornita dal router ogni volta che si disconnette.

## Installazione

Installa Slack prima di configurare il canale:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra e abilita il plugin. Il plugin non fa comunque nulla finché non configuri l'app Slack e le impostazioni del canale qui sotto. Vedi [Plugin](/it/tools/plugin) per il comportamento generale dei plugin e le regole di installazione.

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → seleziona il tuo workspace → incolla uno dei manifest qui sotto → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** corrisponde all'intero set di funzionalità del plugin Slack: App Home, slash command, file, reazioni, pin, DM di gruppo e letture di emoji/usergroup. Scegli **Minimal** quando le policy del workspace limitano gli scope: copre DM, cronologia di canali/gruppi, menzioni e slash command, ma esclude file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read`. Vedi [Checklist di manifest e scope](#manifest-and-scope-checklist) per la motivazione di ogni scope e opzioni additive come slash command extra.
        </Note>

        Dopo che Slack ha creato l'app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: aggiungi `connections:write`, salva, copia l'App-Level Token.
        - **Install App -> Install to Workspace**: copia il Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configurazione SecretRef consigliata:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → seleziona il tuo workspace → incolla uno dei manifest qui sotto → sostituisci `https://gateway-host.example.com/slack/events` con l'URL pubblico del tuo Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json Minimal
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Consigliato** corrisponde all'intero set di funzionalità del Plugin Slack; **Minimale** rimuove file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read` per workspace restrittivi. Vedi [Checklist di manifest e ambiti](#manifest-and-scope-checklist) per la motivazione di ogni ambito.
        </Note>

        <Info>
          I tre campi URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) puntano tutti allo stesso endpoint OpenClaw. Lo schema del manifest di Slack richiede che siano denominati separatamente, ma OpenClaw instrada in base al tipo di payload, quindi un singolo `webhookPath` (predefinito `/slack/events`) è sufficiente. I comandi slash senza `slash_commands[].url` non faranno nulla silenziosamente in modalità HTTP.
        </Info>

        Dopo che Slack ha creato l'app:

        - **Basic Information → App Credentials**: copia il **Signing Secret** per la verifica delle richieste.
        - **Install App -> Install to Workspace**: copia il Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configurazione SecretRef consigliata:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

## Ottimizzazione del trasporto in modalità Socket Mode

OpenClaw imposta per impostazione predefinita il timeout pong del client Slack SDK a 15 secondi per Socket Mode. Sovrascrivi le impostazioni di trasporto solo quando hai bisogno di un'ottimizzazione specifica per workspace o host:

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

Usalo solo per workspace Socket Mode che registrano timeout pong/websocket server-ping di Slack o che vengono eseguiti su host con nota saturazione dell'event loop. `clientPingTimeout` è l'attesa del pong dopo che l'SDK invia un ping client; `serverPingTimeout` è l'attesa dei ping server di Slack. I messaggi e gli eventi dell'app restano stato applicativo, non segnali di vitalità del trasporto.

Note:

- `socketMode` viene ignorato in modalità HTTP Request URL.
- Le impostazioni di base `channels.slack.socketMode` si applicano a tutti gli account Slack salvo sovrascrittura. Le sovrascritture per account usano `channels.slack.accounts.<accountId>.socketMode`; poiché si tratta di una sovrascrittura di oggetto, includi ogni campo di ottimizzazione socket che vuoi per quell'account.
- Solo `clientPingTimeout` ha un valore predefinito OpenClaw (`15000`). `serverPingTimeout` e `pingPongLoggingEnabled` vengono passati allo Slack SDK solo quando configurati.
- Il backoff del riavvio di Socket Mode parte da circa 2 secondi e arriva a un massimo di circa 30 secondi. Gli errori recuperabili di avvio, attesa dell'avvio e disconnessione vengono ritentati finché il canale non si arresta. Gli errori permanenti di account e credenziali, come autenticazione non valida, token revocati o ambiti mancanti, falliscono rapidamente invece di ritentare per sempre.

## Checklist di manifest e ambiti

Il manifest di base dell'app Slack è lo stesso per Socket Mode e HTTP Request URLs. Cambia solo il blocco `settings` (e l'`url` del comando slash).

Manifest di base (predefinito Socket Mode):

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Per la **modalità HTTP Request URLs**, sostituisci `settings` con la variante HTTP e aggiungi `url` a ogni comando slash. URL pubblico richiesto:

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
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

### Impostazioni aggiuntive del manifest

Espone funzionalità diverse che estendono i valori predefiniti sopra.

Il manifest predefinito abilita la scheda **Home** di Slack App Home e sottoscrive `app_home_opened`. Quando un membro dell'area di lavoro apre la scheda Home, OpenClaw pubblica una vista Home predefinita sicura con `views.publish`; non viene incluso alcun payload di conversazione o configurazione privata. La scheda **Messages** resta abilitata per i DM di Slack. Il manifest abilita inoltre i thread assistente di Slack con `features.assistant_view`, `assistant:write`, `assistant_thread_started` e `assistant_thread_context_changed`; i thread assistente vengono instradati alle proprie sessioni di thread OpenClaw e mantengono disponibile per l'agente il contesto del thread fornito da Slack.

<AccordionGroup>
  <Accordion title="Comandi slash nativi facoltativi">

    È possibile usare più [comandi slash nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con alcune precisazioni:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non possono essere resi disponibili più di 25 comandi slash contemporaneamente.

    Sostituisci la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predefinito)">

```json
{
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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
}
```

      </Tab>
      <Tab title="URL di richiesta HTTP">
        Usa lo stesso elenco `slash_commands` di Socket Mode sopra e aggiungi `"url": "https://gateway-host.example.com/slack/events"` a ogni voce. Esempio:

```json
{
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
  ]
}
```

        Ripeti quel valore `url` su ogni comando dell'elenco.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ambiti di attribuzione facoltativi (operazioni di scrittura)">
    Aggiungi l'ambito bot `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (nome utente e icona personalizzati) invece dell'identità predefinita dell'app Slack.

    Se usi un'icona emoji, Slack si aspetta la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Ambiti token utente facoltativi (operazioni di lettura)">
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

- `botToken` + `appToken` sono obbligatori per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- La modalità relay richiede `botToken` più `relay.url`, `relay.authToken` e `relay.gatewayId`; non usa un token app né un segreto di firma.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` e `userToken` accettano stringhe in testo normale
  oppure oggetti SecretRef.
- I token di configurazione hanno la precedenza sul fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` è solo di configurazione (nessun fallback env) e per impostazione predefinita usa un comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dell'istantanea di stato:

- L'ispezione dell'account Slack traccia i campi per credenziale `*Source` e `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra fonte di segreti non inline, ma il percorso comando/runtime corrente
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP, `signingSecretStatus` è incluso; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per azioni/letture di directory, il token utente può essere preferito quando configurato. Per le scritture, il token bot rimane preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il token bot non è disponibile.
</Tip>

## Azioni e gate

Le azioni Slack sono controllate da `channels.slack.actions.*`.

Gruppi di azioni disponibili negli strumenti Slack correnti:

| Gruppo     | Predefinito |
| ---------- | ----------- |
| messages   | abilitato |
| reactions  | abilitato |
| pins       | abilitato |
| memberInfo | abilitato |
| emojiList  | abilitato |

Le azioni di messaggio Slack correnti includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`. `download-file` accetta gli ID file Slack mostrati nei segnaposto dei file in ingresso e restituisce anteprime immagine per le immagini o metadati di file locali per altri tipi di file.

## Controllo degli accessi e instradamento

  <Tabs>
  <Tab title="Criterio DM">
    `channels.slack.dmPolicy` controlla l'accesso ai DM. `channels.slack.allowFrom` è la allowlist canonica dei DM.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (predefinito true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM di gruppo predefiniti false)
    - `dm.groupChannels` (allowlist MPIM facoltativa)

    Precedenza multi-account:

    - `channels.slack.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account denominati ereditano `channels.slack.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account denominati non ereditano `channels.slack.accounts.default.allowFrom`.

    Le impostazioni legacy `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` vengono ancora lette per compatibilità. `openclaw doctor --fix` le migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    L'abbinamento nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Criterio canali">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    La allowlist dei canali si trova sotto `channels.slack.channels` e **deve usare ID canale Slack stabili** (per esempio `C12345678`) come chiavi di configurazione.

    Nota di runtime: se `channels.slack` manca completamente (configurazione solo env), il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso nei log (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci della allowlist dei canali e le voci della allowlist dei DM vengono risolte all'avvio quando l'accesso del token lo consente
    - le voci non risolte con nome canale vengono mantenute come configurate ma ignorate per il routing per impostazione predefinita
    - l'autorizzazione in ingresso e il routing dei canali sono ID-first per impostazione predefinita; la corrispondenza diretta per nome utente/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Le chiavi basate sul nome (`#channel-name` o `channel-name`) **non** corrispondono con `groupPolicy: "allowlist"`. La ricerca del canale è ID-first per impostazione predefinita, quindi una chiave basata sul nome non verrà mai instradata correttamente e tutti i messaggi in quel canale saranno bloccati silenziosamente. Questo differisce da `groupPolicy: "open"`, dove la chiave del canale non è richiesta per il routing e una chiave basata sul nome sembra funzionare.

    Usa sempre l'ID canale Slack come chiave. Per trovarlo: fai clic con il tasto destro sul canale in Slack → **Copia link** — l'ID (`C...`) appare alla fine dell'URL.

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

    Fonti di menzione:

    - menzione esplicita dell'app (`<@botId>`)
    - menzione di un gruppo utenti Slack (`<!subteam^S...>`) quando l'utente bot è membro di quel gruppo utenti; richiede `usergroups:read`
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito dei thread in risposta al bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato delle chiavi `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, oppure wildcard `"*"`
      (le chiavi legacy senza prefisso continuano a mappare solo a `id:`)

    `allowBots` è conservativo per i canali e i canali privati: i messaggi di stanza creati da bot vengono accettati solo quando il bot mittente è elencato esplicitamente nella allowlist `users` di quella stanza, oppure quando almeno un ID proprietario Slack esplicito da `channels.slack.allowFrom` è attualmente membro della stanza. I caratteri jolly e le voci proprietario basate sul nome visualizzato non soddisfano la presenza del proprietario. La presenza del proprietario usa Slack `conversations.members`; assicurati che l'app abbia lo scope di lettura corrispondente per il tipo di stanza (`channels:read` per i canali pubblici, `groups:read` per i canali privati). Se la ricerca dei membri non riesce, OpenClaw scarta il messaggio di stanza creato dal bot.

    I messaggi Slack accettati creati da bot usano la [protezione dai loop dei bot](/it/channels/bot-loop-protection) condivisa. Configura `channels.defaults.botLoopProtection` per il budget predefinito, poi sovrascrivi con `channels.slack.botLoopProtection` o `channels.slack.channels.<id>.botLoopProtection` quando un workspace o un canale richiede un limite diverso.

  </Tab>
</Tabs>

## Thread, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- I binding di routing Slack accettano ID peer grezzi più forme di destinazione Slack come `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Con `session.dmScope=main` predefinito, i DM Slack convergono nella sessione principale dell'agente.
- Sessioni di canale: `agent:<agentId>:slack:channel:<channelId>`.
- I normali messaggi di canale di primo livello restano nella sessione per canale, anche quando `replyToMode` non è `off`.
- Le risposte nei thread Slack usano lo Slack `thread_ts` padre per i suffissi di sessione (`:thread:<threadTs>`), anche quando il threading delle risposte in uscita è disabilitato con `replyToMode="off"`.
- OpenClaw inizializza una radice di canale di primo livello idonea in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` quando ci si aspetta che quella radice avvii un thread Slack visibile, così la radice e le risposte successive nel thread condividono una singola sessione OpenClaw. Questo si applica agli eventi `app_mention`, alle corrispondenze esplicite di bot o di pattern di menzione configurati, e ai canali con `requireMention: false` con `replyToMode` diverso da `off`.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi esistenti del thread vengono recuperati quando inizia una nuova sessione di thread (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando è `true`, sopprime le menzioni implicite nei thread, così il bot risponde solo alle menzioni `@bot` esplicite dentro i thread, anche quando il bot ha già partecipato al thread. Senza questa opzione, le risposte in un thread a cui il bot ha partecipato aggirano il gate `requireMention`.

Controlli del threading delle risposte:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per le chat dirette: `channels.slack.dm.replyToMode`

I tag manuali di risposta sono supportati:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Per risposte esplicite nei thread Slack dallo strumento `message`, imposta `replyBroadcast: true` con `action: "send"` e `threadId` o `replyTo` per chiedere a Slack di trasmettere anche la risposta del thread al canale padre. Questo corrisponde al flag `reply_broadcast` di Slack `chat.postMessage` ed è supportato solo per invii di testo o Block Kit, non per caricamenti multimediali.

Quando una chiamata allo strumento `message` viene eseguita dentro un thread Slack e punta allo stesso canale, OpenClaw eredita normalmente il thread Slack corrente secondo `replyToMode`. Imposta `topLevel: true` su `action: "send"` o `action: "upload-file"` per forzare invece un nuovo messaggio nel canale padre. `threadId: null` è accettato come la stessa esclusione di primo livello.

<Note>
`replyToMode="off"` disabilita il threading delle risposte Slack in uscita, inclusi i tag espliciti `[[reply_to_*]]`. Non appiattisce le sessioni dei thread Slack in ingresso: i messaggi già pubblicati dentro un thread Slack vengono comunque instradati alla sessione `:thread:<threadTs>`. Questo differisce da Telegram, dove i tag espliciti sono comunque rispettati in modalità `"off"`. I thread Slack nascondono i messaggi dal canale, mentre le risposte Telegram restano visibili inline.
</Note>

## Reazioni di conferma

`ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso. `ackReactionScope` decide _quando_ quell'emoji viene effettivamente inviata.

### Emoji (`ackReaction`)

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti `"eyes"` / 👀)

Note:

- Slack si aspetta shortcode (per esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o globalmente.

### Ambito (`messages.ackReactionScope`)

Il provider Slack legge l'ambito da `messages.ackReactionScope` (predefinito `"group-mentions"`). Oggi non esiste override a livello di account Slack o di canale Slack; il valore è globale per il Gateway.

Valori:

- `"all"`: reagisci nei DM e nei gruppi.
- `"direct"`: reagisci solo nei DM.
- `"group-all"`: reagisci a ogni messaggio di gruppo (nessun DM).
- `"group-mentions"` (predefinito): reagisci nei gruppi, ma solo quando il bot viene menzionato (o nei mentionable di gruppo che hanno aderito). **I DM sono esclusi.**
- `"off"` / `"none"`: non reagire mai.

<Note>
L'ambito predefinito (`"group-mentions"`) non attiva reazioni di conferma nei messaggi diretti. Per vedere la `ackReaction` configurata (per esempio `"eyes"`) sui DM Slack in ingresso, imposta `messages.ackReactionScope` su `"direct"` o `"all"`. `messages.ackReactionScope` viene letto all'avvio del provider Slack, quindi è necessario riavviare il gateway perché la modifica abbia effetto.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo dell'anteprima con l'ultimo output parziale.
- `block`: aggiunge aggiornamenti di anteprima in blocchi.
- `progress`: mostra testo di stato dell'avanzamento durante la generazione, poi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima bozza è attiva, instrada gli aggiornamenti di strumenti/avanzamento nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi separati di strumenti/avanzamento.
- `streaming.preview.commandText` / `streaming.progress.commandText`: imposta su `status` per mantenere righe compatte di avanzamento degli strumenti nascondendo il testo grezzo di comando/exec (predefinito: `raw`).

Nascondi il testo grezzo di comando/exec mantenendo righe di avanzamento compatte:

```json
{
  "channels": {
    "slack": {
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

`channels.slack.streaming.nativeTransport` controlla lo streaming testuale nativo Slack quando `channels.slack.streaming.mode` è `partial` (predefinito: `true`).

Le schede attività di avanzamento native Slack sono opt-in per la modalità progress. Imposta `channels.slack.streaming.progress.nativeTaskCards` su `true` con `channels.slack.streaming.mode="progress"` per inviare una scheda piano/attività nativa Slack mentre il lavoro è in corso, poi aggiornare la stessa scheda attività al completamento. Senza questo flag, la modalità progress mantiene il comportamento portabile dell'anteprima bozza.

- Un thread di risposta deve essere disponibile perché compaiano lo streaming testuale nativo e lo stato del thread assistente di Slack. La selezione del thread segue comunque `replyToMode`.
- Le radici di canali, chat di gruppo e DM di primo livello possono comunque usare la normale anteprima bozza quando lo streaming nativo non è disponibile o non esiste alcun thread di risposta.
- I DM Slack di primo livello restano fuori thread per impostazione predefinita, quindi non mostrano l'anteprima nativa di streaming/stato in stile thread di Slack; OpenClaw invece pubblica e modifica un'anteprima bozza nel DM.
- I payload multimediali e non testuali ripiegano sulla consegna normale.
- I finali multimediali/di errore annullano le modifiche di anteprima in sospeso; i finali testuali/blocco idonei vengono scaricati solo quando possono modificare l'anteprima in loco.
- Se lo streaming fallisce a metà risposta, OpenClaw ripiega sulla consegna normale per i payload rimanenti.

Usa l'anteprima bozza invece dello streaming testuale nativo Slack:

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

Aderisci alle schede attività di avanzamento native Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Chiavi legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) è un alias runtime legacy per `channels.slack.streaming.mode`.
- `channels.slack.streaming` booleano è un alias runtime legacy per `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legacy è un alias runtime per `channels.slack.streaming.nativeTransport`.
- Esegui `openclaw doctor --fix` per riscrivere la configurazione di streaming Slack persistita nelle chiavi canoniche.

## Fallback della reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw sta elaborando una risposta, poi la rimuove quando l'esecuzione termina. È particolarmente utile fuori dalle risposte nei thread, che usano un indicatore di stato predefinito "sta scrivendo...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (per esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente dopo il completamento della risposta o del percorso di errore.

## Media, suddivisione in blocchi e consegna

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati file Slack vengono scaricati da URL privati ospitati da Slack (flusso di richiesta autenticata con token) e scritti nello store multimediale quando il recupero riesce e i limiti di dimensione lo permettono. I placeholder dei file includono il `fileId` Slack così gli agenti possono recuperare il file originale con `download-file`.

    I download usano timeout limitati di inattività e totali. Se il recupero dei file Slack si blocca o fallisce, OpenClaw continua a elaborare il messaggio e ripiega sul placeholder del file.

    Il limite runtime predefinito per le dimensioni in ingresso è `20MB`, salvo override tramite `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione dando priorità ai paragrafi
    - gli invii di file usano le API di caricamento Slack e possono includere risposte nei thread (`thread_ts`)
    - il limite multimediale in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii di canale usano i valori predefiniti per tipo MIME dalla pipeline multimediale

  </Accordion>

  <Accordion title="Destinazioni di consegna">
    Destinazioni esplicite preferite:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack solo testo/blocco possono pubblicare direttamente verso ID utente; i caricamenti di file e gli invii in thread aprono prima il DM tramite le API di conversazione Slack perché quei percorsi richiedono un ID conversazione concreto.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento slash

I comandi slash compaiono in Slack come un singolo comando configurato oppure come più comandi nativi. Configura `channels.slack.slashCommand` per cambiare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni manifest aggiuntive](#additional-manifest-settings) nella tua app Slack e vengono abilitati invece con `channels.slack.commands.native: true` o `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi Slack.

```txt
/help
```

I menu di argomenti nativi usano una strategia di rendering adattiva che mostra una modale di conferma prima di inviare il valore di un'opzione selezionata:

- fino a 5 opzioni: blocchi di pulsanti
- 6-100 opzioni: menu di selezione statico
- più di 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gestori delle opzioni di interattività
- limiti Slack superati: i valori di opzione codificati ripiegano sui pulsanti

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e instradano comunque le esecuzioni dei comandi alla sessione di conversazione di destinazione usando `CommandTargetSessionKey`.

## Risposte interattive

Slack può visualizzare controlli di risposta interattivi creati dall'agente, ma questa funzionalità è disabilitata per impostazione predefinita.
Per il nuovo output di agente, CLI e Plugin, preferisci i pulsanti condivisi
`presentation` o i blocchi di selezione. Usano lo stesso percorso di interazione Slack
e degradano anche sugli altri canali.

Abilitalo globalmente:

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

Oppure abilitalo solo per un account Slack:

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

Quando è abilitato, gli agenti possono ancora emettere direttive di risposta deprecate specifiche per Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni
attraverso il percorso evento di interazione Slack esistente. Conservale per i vecchi
prompt e per vie di uscita specifiche di Slack; usa la presentazione condivisa per i nuovi
controlli portabili.

Anche le API del compilatore di direttive sono deprecate per il nuovo codice producer:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Usa i payload `presentation` e `buildSlackPresentationBlocks(...)` per i nuovi
controlli visualizzati in Slack.

Note:

- Questa è un'interfaccia legacy specifica di Slack. Gli altri canali non traducono le direttive Slack Block
  Kit nei propri sistemi di pulsanti.
- I valori di callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superano i limiti di Slack Block Kit, OpenClaw ripiega sulla risposta testuale originale invece di inviare un payload di blocchi non valido.

### Invii di modali di proprietà del Plugin

I Plugin Slack che registrano un gestore interattivo possono anche ricevere eventi del ciclo di vita modali
`view_submission` e `view_closed` prima che OpenClaw compatti
il payload per l'evento di sistema visibile all'agente. Usa uno di questi schemi di instradamento
quando apri una modale Slack:

- Imposta `callback_id` su `openclaw:<namespace>:<payload>`.
- Oppure conserva un `callback_id` esistente e inserisci `pluginInteractiveData:
"<namespace>:<payload>"` nel `private_metadata` della modale.

Il gestore riceve `ctx.interaction.kind` come `view_submission` o
`view_closed`, gli `inputs` normalizzati e l'oggetto grezzo completo `stateValues` da
Slack. L'instradamento solo tramite callback-id è sufficiente per invocare il gestore del Plugin; includi
i campi di instradamento utente/sessione esistenti di `private_metadata` della modale quando la
modale deve anche produrre un evento di sistema visibile all'agente. L'agente riceve un
evento di sistema `Slack interaction: ...` compatto e redatto. Se il gestore restituisce
`systemEvent.summary`, `systemEvent.reference` o `systemEvent.data`, quei
campi vengono inclusi in tale evento compatto affinché l'agente possa fare riferimento
allo storage di proprietà del Plugin senza vedere il payload completo del modulo.

## Approvazioni native in Slack

Slack può agire come client di approvazione nativo con pulsanti e interazioni interattivi, invece di ripiegare sull'interfaccia Web o sul terminale.

- Le approvazioni exec e Plugin possono essere visualizzate come prompt Slack-native Block Kit.
- `channels.slack.execApprovals.*` resta la configurazione di abilitazione del client nativo per approvazioni exec e di instradamento DM/canale.
- I DM di approvazione exec usano `channels.slack.execApprovals.approvers` o `commands.ownerAllowFrom`.
- Le approvazioni Plugin usano pulsanti Slack-native quando Slack è abilitato come client di approvazione nativo per la sessione di origine, oppure quando `approvals.plugin` instrada alla sessione Slack di origine o a una destinazione Slack.
- I DM di approvazione Plugin usano gli approvatori del Plugin Slack da `channels.slack.allowFrom`, `allowFrom` dell'account denominato o la route predefinita dell'account.
- L'autorizzazione degli approvatori viene comunque applicata: gli approvatori solo exec non possono approvare richieste Plugin a meno che non siano anche approvatori Plugin.

Questo usa la stessa superficie condivisa dei pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitato nelle impostazioni della tua app Slack, i prompt di approvazione vengono visualizzati come pulsanti Block Kit direttamente nella conversazione.
Quando quei pulsanti sono presenti, sono la UX di approvazione principale; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le
approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; ripiega su `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e almeno un
approvatore exec viene risolto. Slack può anche gestire approvazioni Plugin native tramite questo percorso
di client nativo quando gli approvatori del Plugin Slack vengono risolti e la richiesta corrisponde ai filtri del client nativo. Imposta
`enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo. Imposta `enabled: true` per
forzare le approvazioni native quando gli approvatori vengono risolti. Disabilitare le approvazioni exec Slack non disabilita
la consegna delle approvazioni Plugin native Slack abilitata tramite `approvals.plugin`; la consegna delle approvazioni Plugin
usa invece gli approvatori del Plugin Slack.

Comportamento predefinito senza una configurazione esplicita delle approvazioni exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configurazione esplicita Slack-native è necessaria solo quando vuoi sovrascrivere gli approvatori, aggiungere filtri o
aderire alla consegna nella chat di origine:

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

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando i prompt di approvazione exec devono anche
essere instradati ad altre chat o a destinazioni esplicite fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; la consegna nativa Slack sopprime quel fallback solo quando Slack può gestire nativamente la richiesta di
approvazione Plugin.

Anche `/approve` nella stessa chat funziona nei canali Slack e nei DM che supportano già i comandi. Vedi [Approvazioni exec](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi vengono mappate in eventi di sistema.
- I broadcast dei thread (risposte ai thread con "Also send to channel") vengono elaborati come normali messaggi utente.
- Gli eventi di aggiunta/rimozione delle reazioni vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita membri, creazione/rinomina canale e aggiunta/rimozione pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati di argomento/scopo del canale sono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- L'avvio del thread e il seed del contesto iniziale della cronologia del thread vengono filtrati dalle allowlist dei mittenti configurate quando applicabile.
- Azioni dei blocchi, scorciatoie e interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload ricchi:
  - azioni dei blocchi: valori selezionati, etichette, valori dei selettori e metadati `workflow_*`
  - scorciatoie globali: metadati di callback e attore, instradati alla sessione diretta dell'attore
  - scorciatoie messaggio: callback, attore, canale, thread e contesto del messaggio selezionato
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradato e input del modulo

Definisci scorciatoie globali o messaggio nella configurazione della tua app Slack e usa qualsiasi ID callback non vuoto. OpenClaw conferma i payload di scorciatoia corrispondenti, applica la stessa policy mittente DM/canale delle altre interazioni Slack e accoda l'evento sanificato per la sessione agente instradata. Gli ID trigger e gli URL di risposta vengono redatti dal contesto dell'agente.

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Slack](/it/gateway/config-channels#slack).

<Accordion title="Campi Slack ad alto segnale">

- modalità/autenticazione: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- interruttore di compatibilità: `dangerouslyAllowNameMatching` (opzione di emergenza; tienila disattivata a meno che non serva)
- accesso al canale: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- anteprime: `unfurlLinks` (predefinito: `false`), `unfurlMedia` per il controllo dell'anteprima link/media di `chat.postMessage`; imposta `unfurlLinks: true` per riattivare le anteprime dei link
- operazioni/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, nell'ordine:

    - `groupPolicy`
    - allowlist del canale (`channels.slack.channels`) — **le chiavi devono essere ID canale** (`C12345678`), non nomi (`#channel-name`). Le chiavi basate sul nome falliscono silenziosamente con `groupPolicy: "allowlist"` perché l'instradamento del canale è ID-first per impostazione predefinita. Per trovare un ID: fai clic destro sul canale in Slack → **Copy link** — il valore `C...` alla fine dell'URL è l'ID canale.
    - `requireMention`
    - allowlist `users` per canale
    - `messages.groupChat.visibleReplies`: le richieste normali di gruppo/canale usano per impostazione predefinita `"automatic"`. Se hai aderito a `"message_tool"` e i log mostrano testo dell'assistente senza chiamata `message(action=send)`, il modello ha mancato il percorso visibile dello strumento messaggio. Il testo finale resta privato in questa modalità; ispeziona il log verboso del Gateway per i metadati del payload soppressi, oppure impostalo su `"automatic"` se vuoi che ogni normale risposta finale dell'assistente venga pubblicata tramite il percorso legacy.
    - `messages.groupChat.unmentionedInbound`: se è `"room_event"`, le conversazioni consentite del canale senza menzione sono contesto ambientale e restano silenziose a meno che l'agente non chiami lo strumento `message`. Vedi [Eventi stanza ambientali](/it/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - approvazioni di pairing / voci allowlist (`dmPolicy: "open"` richiede comunque `channels.slack.allowFrom: ["*"]`)
    - i DM di gruppo usano la gestione MPIM; abilita `channels.slack.dm.groupEnabled` e, se configurato, includi l'MPIM in `channels.slack.dm.groupChannels`
    - eventi DM Slack Assistant: i log verbosi che menzionano `drop message_changed`
      di solito indicano che Slack ha inviato un evento di thread Assistant modificato senza un
      mittente umano recuperabile nei metadati del messaggio

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode non si connette">
    Convalida i token bot + app e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.
    L'App-Level Token richiede `connections:write` e il token bot Bot User OAuth Token
    deve appartenere alla stessa app/workspace Slack del token app.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime corrente non è riuscito a risolvere il valore basato su SecretRef.

    Log come `slack socket mode failed to start; retry ...` sono errori di avvio recuperabili. Scope mancanti, token revocati e autenticazione non valida falliscono rapidamente
    invece. Un log `slack token mismatch ...` significa che il token del bot e il token dell'app
    sembrano appartenere a due app Slack diverse; correggi le credenziali dell'app Slack.

  </Accordion>

  <Accordion title="Modalità HTTP che non riceve eventi">
    Convalida:

    - signing secret
    - percorso Webhook
    - URL delle richieste Slack (Eventi + Interattività + Comandi slash)
    - `webhookPath` univoco per ogni account HTTP
    - l'URL pubblico termina TLS e inoltra le richieste al percorso del Gateway
    - il percorso `request_url` dell'app Slack corrisponde esattamente a `channels.slack.webhookPath` (predefinito `/slack/events`)

    Se `signingSecretStatus: "configured_unavailable"` compare negli snapshot
    dell'account, l'account HTTP è configurato ma il runtime corrente non è riuscito a
    risolvere il signing secret basato su SecretRef.

    Un log ripetuto `slack: webhook path ... already registered` significa che due account HTTP
    stanno usando lo stesso `webhookPath`; assegna a ogni account un percorso distinto.

  </Accordion>

  <Accordion title="Comandi nativi/slash che non si attivano">
    Verifica quale modalità intendevi usare:

    - modalità comando nativo (`channels.slack.commands.native: true`) con comandi slash corrispondenti registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Slack non crea né rimuove automaticamente i comandi slash. `commands.native: "auto"` non abilita i comandi nativi Slack; usa `true` e crea i comandi corrispondenti nell'app Slack. In modalità HTTP, ogni comando slash Slack deve includere l'URL del Gateway. In Socket Mode, i payload dei comandi arrivano tramite websocket e Slack ignora `slash_commands[].url`.

    Controlla anche `commands.useAccessGroups`, l'autorizzazione DM, gli allowlist dei canali
    e gli allowlist `users` per canale. Slack restituisce errori effimeri per
    mittenti di comandi slash bloccati, tra cui:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Riferimento vision per gli allegati

Slack può allegare i media scaricati al turno dell'agente quando i download dei file Slack riescono e i limiti di dimensione lo consentono. I file immagine possono passare attraverso il percorso di comprensione dei media o direttamente a un modello di risposta con capacità vision; gli altri file vengono mantenuti come contesto file scaricabile invece di essere trattati come input immagine.

### Tipi di media supportati

| Tipo di media                 | Origine              | Comportamento attuale                                                            | Note                                                                      |
| ----------------------------- | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Immagini JPEG / PNG / GIF / WebP | URL file Slack       | Scaricate e allegate al turno per la gestione con capacità vision                 | Limite per file: `channels.slack.mediaMaxMb` (predefinito 20 MB)          |
| File PDF                      | URL file Slack       | Scaricati ed esposti come contesto file per strumenti come `download-file` o `pdf` | L'input Slack non converte automaticamente i PDF in input image-vision    |
| Altri file                    | URL file Slack       | Scaricati quando possibile ed esposti come contesto file                          | I file binari non sono trattati come input immagine                       |
| Risposte nei thread           | File del messaggio iniziale del thread | I file del messaggio radice possono essere idratati come contesto quando la risposta non ha media diretti | I messaggi iniziali con soli file usano un segnaposto allegato            |
| Messaggi con più immagini     | Più file Slack       | Ogni file viene valutato in modo indipendente                                     | L'elaborazione Slack è limitata a otto file per messaggio                 |

### Pipeline in ingresso

Quando arriva un messaggio Slack con allegati file:

1. OpenClaw scarica il file dall'URL privato di Slack usando il token del bot.
2. In caso di successo, il file viene scritto nello store dei media.
3. I percorsi dei media scaricati e i tipi di contenuto vengono aggiunti al contesto in ingresso.
4. I percorsi modello/strumento con capacità immagine possono usare gli allegati immagine da quel contesto.
5. I file non immagine restano disponibili come metadati file o riferimenti media per gli strumenti che possono gestirli.

### Ereditarietà degli allegati dalla radice del thread

Quando un messaggio arriva in un thread (ha un genitore `thread_ts`):

- Se la risposta stessa non ha media diretti e il messaggio radice incluso ha file, Slack può idratare i file radice come contesto iniziale del thread.
- Gli allegati diretti della risposta hanno la precedenza sugli allegati del messaggio radice.
- Un messaggio radice che contiene solo file e nessun testo viene rappresentato con un segnaposto allegato, così il fallback può comunque includere i suoi file.

### Gestione di più allegati

Quando un singolo messaggio Slack contiene più allegati file:

- Ogni allegato viene elaborato in modo indipendente tramite la pipeline dei media.
- I riferimenti ai media scaricati vengono aggregati nel contesto del messaggio.
- L'ordine di elaborazione segue l'ordine dei file Slack nel payload dell'evento.
- Un errore nel download di un allegato non blocca gli altri.

### Limiti di dimensione, download e modello

- **Limite di dimensione**: predefinito 20 MB per file. Configurabile tramite `channels.slack.mediaMaxMb`.
- **Errori di download**: file che Slack non può servire, URL scaduti, file inaccessibili, file troppo grandi e risposte HTML di autenticazione/login Slack vengono ignorati invece di essere segnalati come formati non supportati.
- **Modello vision**: l'analisi delle immagini usa il modello di risposta attivo quando supporta vision, oppure il modello immagine configurato in `agents.defaults.imageModel`.

### Limiti noti

| Scenario                               | Comportamento attuale                                                         | Soluzione alternativa                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| URL file Slack scaduto                 | File ignorato; nessun errore mostrato                                         | Ricarica il file in Slack                                                   |
| Modello vision non configurato         | Gli allegati immagine vengono archiviati come riferimenti media, ma non analizzati come immagini | Configura `agents.defaults.imageModel` o usa un modello di risposta con capacità vision |
| Immagini molto grandi (> 20 MB per impostazione predefinita) | Ignorate in base al limite di dimensione                                      | Aumenta `channels.slack.mediaMaxMb` se Slack lo consente                    |
| Allegati inoltrati/condivisi           | Testo e media immagine/file ospitati su Slack sono gestiti al meglio          | Ricondividi direttamente nel thread OpenClaw                                |
| Allegati PDF                           | Archiviati come contesto file/media, non instradati automaticamente tramite image vision | Usa `download-file` per i metadati file o lo strumento `pdf` per l'analisi PDF |

### Documentazione correlata

- [Pipeline di comprensione dei media](/it/nodes/media-understanding)
- [Strumento PDF](/it/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — abilitazione della vision per gli allegati Slack
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
    Modello delle minacce e hardening.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Layout e precedenza della configurazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Catalogo e comportamento dei comandi.
  </Card>
</CardGroup>
