---
read_when:
    - Configurazione di Slack o debug della modalità socket/HTTP di Slack
summary: Configurazione di Slack e comportamento in fase di esecuzione (Modalità Socket + URL delle richieste HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

Pronto per la produzione per DM e canali tramite integrazioni di app Slack. La modalità predefinita è Socket Mode; sono supportati anche gli URL di richiesta HTTP.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    I DM di Slack usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi e catalogo dei comandi.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e playbook di riparazione.
  </Card>
</CardGroup>

## Scelta tra Socket Mode e URL di richiesta HTTP

Entrambi i trasporti sono pronti per la produzione e raggiungono la parità di funzionalità per messaggistica, comandi slash, App Home e interattività. Scegli in base alla forma della distribuzione, non alle funzionalità.

| Aspetto                      | Socket Mode (predefinita)                                                                | URL di richiesta HTTP                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway pubblico           | Non richiesto                                                                         | Richiesto (DNS, TLS, proxy inverso o tunnel)                                                                   |
| Rete in uscita             | WSS in uscita verso `wss-primary.slack.com` deve essere raggiungibile                            | Nessun WS in uscita; solo HTTPS in ingresso                                                                             |
| Token necessari                | Token bot (`xoxb-...`) + Token a livello di app (`xapp-...`) con `connections:write`       | Token bot (`xoxb-...`) + Segreto di firma                                                                        |
| Laptop di sviluppo / dietro firewall | Funziona così com'è                                                                          | Richiede un tunnel pubblico (ngrok, Cloudflare Tunnel, Tailscale Funnel) o Gateway di staging                          |
| Scalabilità orizzontale           | Una sessione Socket Mode per app per host; più Gateway richiedono app Slack separate | Gestore POST senza stato; più repliche Gateway possono condividere un'app dietro un bilanciatore del carico                     |
| Multi-account su un Gateway | Supportato; ogni account apre il proprio WS                                             | Supportato; ogni account richiede un `webhookPath` univoco (predefinito `/slack/events`) in modo che le registrazioni non entrino in conflitto |
| Trasporto dei comandi slash      | Consegnato tramite la connessione WS; `slash_commands[].url` viene ignorato                  | Slack invia POST a `slash_commands[].url`; il campo è richiesto affinché il comando venga inviato                           |
| Firma delle richieste              | Non usata (l'autenticazione è il Token a livello di app)                                               | Slack firma ogni richiesta; OpenClaw verifica con `signingSecret`                                              |
| Recupero dopo caduta connessione  | L'SDK Slack si riconnette automaticamente; si applica la configurazione del trasporto con timeout pong del Gateway       | Nessuna connessione persistente da perdere; i tentativi sono per richiesta da Slack                                           |

<Note>
  **Scegli Socket Mode** per host con un solo Gateway, laptop di sviluppo e reti on-premise che possono raggiungere `*.slack.com` in uscita ma non possono accettare HTTPS in ingresso.

**Scegli gli URL di richiesta HTTP** quando esegui più repliche Gateway dietro un bilanciatore del carico, quando WSS in uscita è bloccato ma HTTPS in ingresso è consentito, oppure quando termini già i Webhook Slack presso un proxy inverso.
</Note>

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Crea nuova app** → **Da un manifest** → seleziona il tuo workspace → incolla uno dei manifest qui sotto → **Avanti** → **Crea**.

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
          **Consigliato** corrisponde all'intero set di funzionalità del Plugin Slack incluso: App Home, comandi slash, file, reazioni, pin, DM di gruppo e letture di emoji/gruppi utenti. Scegli **Minimo** quando la policy del workspace limita gli ambiti: copre DM, cronologia di canali/gruppi, menzioni e comandi slash, ma esclude file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulta [Checklist di manifest e ambiti](#manifest-and-scope-checklist) per la motivazione di ciascun ambito e opzioni additive come comandi slash aggiuntivi.
        </Note>

        Dopo che Slack ha creato l'app:

        - **Informazioni di base → Token a livello di app → Genera token e ambiti**: aggiungi `connections:write`, salva, copia il valore `xapp-...`.
        - **Installa app → Installa nel workspace**: copia il Token OAuth utente bot `xoxb-...`.

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
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Crea nuova app** → **Da un manifest** → seleziona il tuo workspace → incolla uno dei manifest qui sotto → sostituisci `https://gateway-host.example.com/slack/events` con il tuo URL Gateway pubblico → **Avanti** → **Crea**.

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
          **Consigliato** corrisponde all'insieme completo di funzionalità del Plugin Slack incluso; **Minimo** esclude file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read` per workspace restrittivi. Consulta [Checklist del manifesto e degli ambiti](#manifest-and-scope-checklist) per la motivazione di ogni ambito.
        </Note>

        <Info>
          I tre campi URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) puntano tutti allo stesso endpoint OpenClaw. Lo schema del manifesto di Slack richiede che abbiano nomi separati, ma OpenClaw instrada in base al tipo di payload, quindi un singolo `webhookPath` (predefinito `/slack/events`) è sufficiente. I comandi slash senza `slash_commands[].url` non faranno nulla in modalità HTTP, senza avvisi.
        </Info>

        Dopo che Slack ha creato l'app:

        - **Informazioni di base → Credenziali dell'app**: copia il **Signing Secret** per la verifica delle richieste.
        - **Installa app → Installa nel workspace**: copia il Bot User OAuth Token `xoxb-...`.

      </Step>

      <Step title="Configura OpenClaw">

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

      <Step title="Avvia il Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ottimizzazione del trasporto in modalità Socket

OpenClaw imposta per impostazione predefinita il timeout pong del client SDK Slack a 15 secondi per la modalità Socket. Sovrascrivi le impostazioni di trasporto solo quando hai bisogno di una regolazione specifica per workspace o host:

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

Usalo solo per workspace in modalità Socket che registrano timeout pong/websocket o server-ping di Slack, oppure che girano su host con starvation nota dell'event loop. `clientPingTimeout` è l'attesa del pong dopo che l'SDK invia un ping client; `serverPingTimeout` è l'attesa dei ping server di Slack. I messaggi e gli eventi dell'app restano stato applicativo, non segnali di vitalità del trasporto.

## Checklist del manifesto e degli ambiti

Il manifesto di base dell'app Slack è lo stesso per la modalità Socket e per gli URL di richiesta HTTP. Cambia solo il blocco `settings` (e l'`url` del comando slash).

Manifesto di base (predefinito per modalità Socket):

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

Per la **modalità URL di richiesta HTTP**, sostituisci `settings` con la variante HTTP e aggiungi `url` a ogni comando slash. URL pubblico richiesto:

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

### Impostazioni aggiuntive del manifesto

Espone funzionalità diverse che estendono i valori predefiniti sopra.

Il manifesto predefinito abilita la scheda **Home** di Slack App Home e sottoscrive `app_home_opened`. Quando un membro del workspace apre la scheda Home, OpenClaw pubblica una vista Home predefinita sicura con `views.publish`; non viene incluso alcun payload di conversazione né configurazione privata. La scheda **Messaggi** resta abilitata per i DM Slack.

<AccordionGroup>
  <Accordion title="Comandi slash nativi facoltativi">

    È possibile usare più [comandi slash nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con alcune sfumature:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non possono essere resi disponibili più di 25 comandi slash alla volta.

    Sostituisci la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Modalità Socket (predefinita)">

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
        Usa lo stesso elenco `slash_commands` della modalità Socket sopra e aggiungi `"url": "https://gateway-host.example.com/slack/events"` a ogni voce. Esempio:

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

        Ripeti quel valore `url` per ogni comando nell'elenco.

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

- `botToken` + `appToken` sono obbligatori per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe in chiaro
  o oggetti SecretRef.
- I token di configurazione sovrascrivono il fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo di configurazione (nessun fallback env) e per impostazione predefinita ha comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dello snapshot di stato:

- L'ispezione dell'account Slack traccia i campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra origine segreta non inline, ma il comando/percorso runtime corrente
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
| messages   | abilitato   |
| reactions  | abilitato   |
| pins       | abilitato   |
| memberInfo | abilitato   |
| emojiList  | abilitato   |

Le azioni messaggio Slack correnti includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`. `download-file` accetta gli ID file Slack mostrati nei placeholder file in ingresso e restituisce anteprime immagine per le immagini o metadati di file locali per altri tipi di file.

## Controllo accessi e routing

<Tabs>
  <Tab title="Criterio DM">
    `channels.slack.dmPolicy` controlla l'accesso DM. `channels.slack.allowFrom` è l'allowlist DM canonica.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (predefinito true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM di gruppo predefiniti false)
    - `dm.groupChannels` (allowlist MPIM opzionale)

    Precedenza multi-account:

    - `channels.slack.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account nominati ereditano `channels.slack.allowFrom` quando il loro `allowFrom` non è impostato.
    - Gli account nominati non ereditano `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` legacy vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Il pairing nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Criterio canale">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'allowlist dei canali vive sotto `channels.slack.channels` e **deve usare ID canale Slack stabili** (ad esempio `C12345678`) come chiavi di configurazione.

    Nota runtime: se `channels.slack` è completamente assente (configurazione solo env), il runtime ricade su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci dell'allowlist canali e dell'allowlist DM vengono risolte all'avvio quando l'accesso token lo consente
    - le voci con nome canale non risolte vengono mantenute come configurate ma ignorate per il routing per impostazione predefinita
    - l'autorizzazione in ingresso e il routing dei canali sono ID-first per impostazione predefinita; la corrispondenza diretta username/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Le chiavi basate sul nome (`#channel-name` o `channel-name`) **non** corrispondono con `groupPolicy: "allowlist"`. La ricerca del canale è ID-first per impostazione predefinita, quindi una chiave basata sul nome non instraderà mai correttamente e tutti i messaggi in quel canale saranno bloccati silenziosamente. Questo differisce da `groupPolicy: "open"`, dove la chiave canale non è richiesta per il routing e una chiave basata sul nome sembra funzionare.

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
    I messaggi di canale sono soggetti a gate di menzione per impostazione predefinita.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - menzione gruppo utenti Slack (`<!subteam^S...>`) quando l'utente bot è membro di quel gruppo utenti; richiede `usergroups:read`
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta a thread del bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato chiave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o wildcard `"*"`
      (le chiavi legacy senza prefisso mappano ancora solo a `id:`)

    `allowBots` è conservativo per canali e canali privati: i messaggi stanza scritti da bot sono accettati solo quando il bot mittente è elencato esplicitamente nell'allowlist `users` di quella stanza, oppure quando almeno un ID proprietario Slack esplicito da `channels.slack.allowFrom` è attualmente membro della stanza. I wildcard e le voci proprietario con nome visualizzato non soddisfano la presenza del proprietario. La presenza del proprietario usa Slack `conversations.members`; assicurati che l'app abbia l'ambito di lettura corrispondente per il tipo di stanza (`channels:read` per canali pubblici, `groups:read` per canali privati). Se la ricerca dei membri fallisce, OpenClaw scarta il messaggio stanza scritto da bot.

  </Tab>
</Tabs>

## Threading, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- I binding di route Slack accettano ID peer grezzi più forme di destinazione Slack come `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Con il valore predefinito `session.dmScope=main`, i DM Slack collassano nella sessione principale dell'agente.
- Sessioni canale: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione thread (`:thread:<threadTs>`) quando applicabile.
- Nei canali in cui OpenClaw gestisce messaggi di primo livello senza richiedere una menzione esplicita, `replyToMode` diverso da `off` instrada ogni root gestita in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` così il thread Slack visibile mappa a una sessione OpenClaw dal primo turno.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi thread esistenti vengono recuperati quando inizia una nuova sessione thread (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando `true`, sopprime le menzioni thread implicite così il bot risponde solo alle menzioni esplicite `@bot` dentro i thread, anche quando il bot ha già partecipato al thread. Senza questo, le risposte in un thread a cui il bot ha partecipato bypassano il gate `requireMention`.

Controlli di threading delle risposte:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per chat dirette: `channels.slack.dm.replyToMode`

I tag di risposta manuale sono supportati:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Per risposte esplicite a thread Slack dallo strumento `message`, imposta `replyBroadcast: true` con `action: "send"` e `threadId` o `replyTo` per chiedere a Slack di trasmettere anche la risposta thread al canale genitore. Questo mappa al flag `reply_broadcast` di `chat.postMessage` di Slack ed è supportato solo per invii di testo o Block Kit, non per caricamenti media.

Quando una chiamata allo strumento `message` viene eseguita dentro un thread Slack e punta allo stesso canale, OpenClaw normalmente eredita il thread Slack corrente secondo `replyToMode`. Imposta `topLevel: true` su `action: "send"` o `action: "upload-file"` per forzare invece un nuovo messaggio nel canale genitore. `threadId: null` è accettato come la stessa rinuncia al primo livello.

<Note>
`replyToMode="off"` disabilita **tutto** il threading delle risposte in Slack, inclusi i tag espliciti `[[reply_to_*]]`. Questo differisce da Telegram, dove i tag espliciti sono ancora rispettati in modalità `"off"`. I thread Slack nascondono i messaggi dal canale, mentre le risposte Telegram rimangono visibili inline.
</Note>

## Reazioni ack

`ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji dell'identità agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcode (ad esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o globalmente.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo dell'anteprima con l'ultimo output parziale.
- `block`: aggiunge aggiornamenti di anteprima a chunk.
- `progress`: mostra testo di stato avanzamento durante la generazione, poi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima bozza è attiva, instrada aggiornamenti di strumento/avanzamento nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi di strumento/avanzamento separati.
- `streaming.preview.commandText` / `streaming.progress.commandText`: imposta su `status` per mantenere righe compatte di avanzamento strumenti nascondendo il testo raw command/exec (predefinito: `raw`).

Nascondi il testo raw command/exec mantenendo righe compatte di avanzamento:

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

`channels.slack.streaming.nativeTransport` controlla lo streaming di testo nativo Slack quando `channels.slack.streaming.mode` è `partial` (predefinito: `true`).

- Deve essere disponibile un thread di risposta per visualizzare lo streaming testuale nativo e lo stato del thread dell'assistente Slack. La selezione del thread segue comunque `replyToMode`.
- Le radici di canale, chat di gruppo e DM di primo livello possono comunque usare la normale anteprima della bozza quando lo streaming nativo non è disponibile o non esiste alcun thread di risposta.
- I DM Slack di primo livello restano fuori thread per impostazione predefinita, quindi non mostrano l'anteprima nativa di streaming/stato in stile thread di Slack; OpenClaw pubblica e modifica invece un'anteprima della bozza nel DM.
- I payload multimediali e non testuali ripiegano sulla consegna normale.
- I risultati finali multimediali/di errore annullano le modifiche di anteprima in sospeso; i risultati finali di testo/blocco idonei vengono inviati solo quando possono modificare l'anteprima sul posto.
- Se lo streaming fallisce a metà risposta, OpenClaw ripiega sulla consegna normale per i payload rimanenti.

Usa l'anteprima della bozza invece dello streaming testuale nativo di Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) è un alias runtime legacy per `channels.slack.streaming.mode`.
- il booleano `channels.slack.streaming` è un alias runtime legacy per `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legacy è un alias runtime per `channels.slack.streaming.nativeTransport`.
- Esegui `openclaw doctor --fix` per riscrivere la configurazione di streaming Slack persistita usando le chiavi canoniche.

## Fallback della reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw elabora una risposta, quindi la rimuove quando l'esecuzione termina. È particolarmente utile al di fuori delle risposte nei thread, che usano un indicatore di stato predefinito "is typing...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (per esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente al termine del percorso di risposta o di errore.

## Media, suddivisione in blocchi e consegna

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati file di Slack vengono scaricati da URL privati ospitati da Slack (flusso di richiesta autenticato con token) e scritti nell'archivio media quando il recupero riesce e i limiti di dimensione lo consentono. I segnaposto dei file includono il `fileId` Slack in modo che gli agenti possano recuperare il file originale con `download-file`.

    I download usano timeout limitati di inattività e totali. Se il recupero del file Slack si blocca o fallisce, OpenClaw continua a elaborare il messaggio e ripiega sul segnaposto del file.

    Il limite runtime predefinito per le dimensioni in ingresso è `20MB`, salvo override tramite `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione dando priorità ai paragrafi
    - gli invii di file usano le API di upload di Slack e possono includere risposte nei thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME dalla pipeline media

  </Accordion>

  <Accordion title="Destinazioni di consegna">
    Target espliciti preferiti:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack solo testo/blocco possono pubblicare direttamente sugli ID utente; gli upload di file e gli invii nei thread aprono prima il DM tramite le API di conversazione Slack perché questi percorsi richiedono un ID conversazione concreto.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento slash

I comandi slash appaiono in Slack come un singolo comando configurato o come più comandi nativi. Configura `channels.slack.slashCommand` per modificare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni di manifesto aggiuntive](#additional-manifest-settings) nella tua app Slack e vengono invece abilitati con `channels.slack.commands.native: true` o `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi Slack.

```txt
/help
```

I menu di argomenti nativi usano una strategia di rendering adattiva che mostra una modale di conferma prima di inviare il valore di un'opzione selezionata:

- fino a 5 opzioni: blocchi di pulsanti
- 6-100 opzioni: menu di selezione statico
- più di 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gestori delle opzioni di interattività
- limiti Slack superati: i valori delle opzioni codificati ripiegano sui pulsanti

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e instradano comunque le esecuzioni dei comandi alla sessione della conversazione di destinazione usando `CommandTargetSessionKey`.

## Risposte interattive

Slack può renderizzare controlli di risposta interattivi creati dall'agente, ma questa funzionalità è disabilitata per impostazione predefinita.

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

Quando abilitata, gli agenti possono emettere direttive di risposta solo per Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni attraverso il percorso esistente degli eventi di interazione Slack.

Note:

- Questa è un'interfaccia utente specifica per Slack. Gli altri canali non traducono le direttive Slack Block Kit nei propri sistemi di pulsanti.
- I valori dei callback interattivi sono token opachi generati da OpenClaw, non valori grezzi scritti dall'agente.
- Se i blocchi interattivi generati superassero i limiti di Slack Block Kit, OpenClaw ripiega sulla risposta testuale originale invece di inviare un payload di blocchi non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti e interazioni interattive, invece di ripiegare sull'interfaccia Web o sul terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo a DM/canale.
- Le approvazioni dei Plugin possono comunque risolversi tramite la stessa superficie di pulsanti nativa Slack quando la richiesta arriva già in Slack e il tipo di ID approvazione è `plugin:`.
- L'autorizzazione dell'approvatore resta applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie condivisa dei pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitata nelle impostazioni della tua app Slack, le richieste di approvazione vengono renderizzate come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, sono l'esperienza utente di approvazione primaria; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le approvazioni
chat non sono disponibili o l'approvazione manuale è l'unico percorso.

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

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando le richieste di approvazione exec devono anche
essere instradate ad altre chat o a target fuori banda espliciti. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi Slack possono comunque risolvere le approvazioni dei Plugin quando quelle richieste arrivano già
in Slack.

Anche `/approve` nella stessa chat funziona nei canali Slack e nei DM che supportano già i comandi. Vedi [Approvazioni exec](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi vengono mappate in eventi di sistema.
- I broadcast dei thread (risposte nei thread "Also send to channel") vengono elaborati come normali messaggi utente.
- Gli eventi di aggiunta/rimozione delle reazioni vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita dei membri, canale creato/rinominato e aggiunta/rimozione di pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati di argomento/scopo del canale sono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- Il seed del contesto dello starter del thread e della cronologia iniziale del thread viene filtrato dalle allowlist dei mittenti configurate quando applicabile.
- Le azioni di blocco e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload ricchi:
  - azioni di blocco: valori selezionati, etichette, valori dei picker e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradato e input del modulo

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Slack](/it/gateway/config-channels#slack).

<Accordion title="Campi Slack ad alto segnale">

- modalità/autenticazione: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle di compatibilità: `dangerouslyAllowNameMatching` (break-glass; mantieni disattivato salvo necessità)
- accesso ai canali: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurl: `unfurlLinks`, `unfurlMedia` per il controllo dell'anteprima link/media di `chat.postMessage`
- operatività/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, nell'ordine:

    - `groupPolicy`
    - allowlist dei canali (`channels.slack.channels`) — **le chiavi devono essere ID canale** (`C12345678`), non nomi (`#channel-name`). Le chiavi basate sul nome falliscono silenziosamente con `groupPolicy: "allowlist"` perché l'instradamento dei canali è prima di tutto basato sugli ID per impostazione predefinita. Per trovare un ID: fai clic destro sul canale in Slack → **Copy link** — il valore `C...` alla fine dell'URL è l'ID canale.
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
    - approvazioni di pairing / voci di allowlist
    - Eventi DM Slack Assistant: log dettagliati che menzionano `drop message_changed`
      di solito indicano che Slack ha inviato un evento di thread Assistant modificato senza un
      mittente umano recuperabile nei metadati del messaggio

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode non si connette">
    Convalida i token bot + app e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime corrente non è riuscito a risolvere il valore
    basato su SecretRef.

  </Accordion>

  <Accordion title="Modalità HTTP che non riceve eventi">
    Convalida:

    - segreto di firma
    - percorso webhook
    - URL delle richieste Slack (Eventi + Interattività + Comandi slash)
    - `webhookPath` univoco per ogni account HTTP

    Se `signingSecretStatus: "configured_unavailable"` compare negli snapshot
    dell'account, l'account HTTP è configurato ma il runtime corrente non è riuscito
    a risolvere il segreto di firma basato su SecretRef.

  </Accordion>

  <Accordion title="Comandi nativi/slash che non si attivano">
    Verifica se intendevi usare:

    - modalità comando nativo (`channels.slack.commands.native: true`) con comandi slash corrispondenti registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Controlla anche `commands.useAccessGroups` e gli elenchi di canali/utenti consentiti.

  </Accordion>
</AccordionGroup>

## Riferimento per visione degli allegati

Slack può allegare i media scaricati al turno dell'agente quando i download dei file Slack riescono e i limiti di dimensione lo consentono. I file immagine possono passare attraverso il percorso di comprensione dei media o direttamente a un modello di risposta con capacità di visione; gli altri file vengono mantenuti come contesto di file scaricabile invece di essere trattati come input immagine.

### Tipi di media supportati

| Tipo di media                 | Origine              | Comportamento attuale                                                             | Note                                                                      |
| ----------------------------- | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Immagini JPEG / PNG / GIF / WebP | URL file Slack     | Scaricate e allegate al turno per gestione con capacità di visione                | Limite per file: `channels.slack.mediaMaxMb` (predefinito 20 MB)          |
| File PDF                      | URL file Slack       | Scaricati ed esposti come contesto file per strumenti come `download-file` o `pdf` | L'inbound Slack non converte automaticamente i PDF in input di visione immagini |
| Altri file                    | URL file Slack       | Scaricati quando possibile ed esposti come contesto file                          | I file binari non sono trattati come input immagine                       |
| Risposte nei thread           | File del messaggio iniziale del thread | I file del messaggio radice possono essere idratati come contesto quando la risposta non ha media diretti | I messaggi iniziali con soli file usano un placeholder di allegato        |
| Messaggi multi-immagine       | Più file Slack       | Ogni file viene valutato indipendentemente                                        | L'elaborazione Slack è limitata a otto file per messaggio                 |

### Pipeline inbound

Quando arriva un messaggio Slack con allegati file:

1. OpenClaw scarica il file dall'URL privato di Slack usando il token del bot (`xoxb-...`).
2. In caso di esito positivo, il file viene scritto nello store dei media.
3. I percorsi dei media scaricati e i tipi di contenuto vengono aggiunti al contesto inbound.
4. I percorsi di modelli/strumenti con capacità di immagine possono usare gli allegati immagine da quel contesto.
5. I file non immagine rimangono disponibili come metadati file o riferimenti media per gli strumenti che possono gestirli.

### Ereditarietà degli allegati dalla radice del thread

Quando un messaggio arriva in un thread (ha un genitore `thread_ts`):

- Se la risposta non ha media diretti e il messaggio radice incluso contiene file, Slack può idratare i file radice come contesto del messaggio iniziale del thread.
- Gli allegati diretti della risposta hanno la precedenza sugli allegati del messaggio radice.
- Un messaggio radice che contiene solo file e nessun testo viene rappresentato con un placeholder di allegato, così il fallback può comunque includere i suoi file.

### Gestione di allegati multipli

Quando un singolo messaggio Slack contiene più allegati file:

- Ogni allegato viene elaborato indipendentemente attraverso la pipeline media.
- I riferimenti ai media scaricati vengono aggregati nel contesto del messaggio.
- L'ordine di elaborazione segue l'ordine dei file Slack nel payload dell'evento.
- Un errore nel download di un allegato non blocca gli altri.

### Limiti di dimensione, download e modello

- **Limite di dimensione**: 20 MB predefiniti per file. Configurabile tramite `channels.slack.mediaMaxMb`.
- **Errori di download**: i file che Slack non può servire, gli URL scaduti, i file inaccessibili, i file troppo grandi e le risposte HTML di auth/login Slack vengono saltati invece di essere segnalati come formati non supportati.
- **Modello di visione**: l'analisi delle immagini usa il modello di risposta attivo quando supporta la visione, oppure il modello immagine configurato in `agents.defaults.imageModel`.

### Limiti noti

| Scenario                               | Comportamento attuale                                                        | Soluzione alternativa                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| URL file Slack scaduto                 | File saltato; nessun errore mostrato                                         | Ricarica il file in Slack                                                   |
| Modello di visione non configurato     | Gli allegati immagine vengono archiviati come riferimenti media, ma non analizzati come immagini | Configura `agents.defaults.imageModel` o usa un modello di risposta con capacità di visione |
| Immagini molto grandi (> 20 MB per impostazione predefinita) | Saltate in base al limite di dimensione                                      | Aumenta `channels.slack.mediaMaxMb` se Slack lo consente                    |
| Allegati inoltrati/condivisi           | Testo e media immagine/file ospitati da Slack sono gestiti al meglio possibile | Condividi di nuovo direttamente nel thread OpenClaw                         |
| Allegati PDF                           | Archiviati come contesto file/media, non instradati automaticamente attraverso la visione immagini | Usa `download-file` per i metadati file o lo strumento `pdf` per l'analisi PDF |

### Documentazione correlata

- [Pipeline di comprensione dei media](/it/nodes/media-understanding)
- [Strumento PDF](/it/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Abilitazione della visione degli allegati Slack
- Test di regressione: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifica live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Correlato

<CardGroup cols={2}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Abbina un utente Slack al gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento di canali e DM di gruppo.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi inbound agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Layout e precedenza della configurazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Catalogo e comportamento dei comandi.
  </Card>
</CardGroup>
