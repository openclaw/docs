---
read_when:
    - Configurazione di Slack o debug della modalità socket/HTTP di Slack
summary: Configurazione di Slack e comportamento in fase di esecuzione (Modalità Socket + URL di richiesta HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-11T20:21:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e740fd5cb0ca936edce1843316cde17570d77778bdf4fc761cad77c51ee9cf
    source_path: channels/slack.md
    workflow: 16
---

Pronto per la produzione per DM e canali tramite integrazioni dell'app Slack. La modalità predefinita è Socket Mode; sono supportati anche gli URL di richiesta HTTP.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di Slack usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure operative di riparazione.
  </Card>
</CardGroup>

## Scegliere Socket Mode o gli URL di richiesta HTTP

Entrambi i trasporti sono pronti per la produzione e raggiungono la parità di funzionalità per messaggistica, comandi slash, App Home e interattività. Scegli in base alla modalità di distribuzione, non alle funzionalità.

| Aspetto                      | Socket Mode (predefinito)                                                            | URL di richiesta HTTP                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL pubblico del Gateway     | Non richiesto                                                                        | Richiesto (DNS, TLS, reverse proxy o tunnel)                                                                   |
| Rete in uscita               | WSS in uscita verso `wss-primary.slack.com` deve essere raggiungibile                | Nessun WS in uscita; solo HTTPS in ingresso                                                                    |
| Token necessari              | Token bot (`xoxb-...`) + App-Level Token (`xapp-...`) con `connections:write`        | Token bot (`xoxb-...`) + Signing Secret                                                                        |
| Laptop di sviluppo / dietro firewall | Funziona così com'è                                                           | Richiede un tunnel pubblico (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway di staging               |
| Scalabilità orizzontale      | Una sessione Socket Mode per app per host; più Gateway richiedono app Slack separate | Gestore POST stateless; più repliche del Gateway possono condividere una sola app dietro un load balancer      |
| Più account su un Gateway    | Supportato; ogni account apre il proprio WS                                          | Supportato; ogni account richiede un `webhookPath` univoco (predefinito `/slack/events`) per evitare conflitti tra registrazioni |
| Trasporto dei comandi slash  | Consegnati tramite la connessione WS; `slash_commands[].url` viene ignorato          | Slack invia POST a `slash_commands[].url`; il campo è obbligatorio perché il comando venga dispatchato         |
| Firma delle richieste        | Non usata (l'autenticazione è l'App-Level Token)                                     | Slack firma ogni richiesta; OpenClaw verifica con `signingSecret`                                              |
| Ripristino in caso di caduta della connessione | L'SDK Slack si riconnette automaticamente; si applica la regolazione del trasporto per il timeout pong del Gateway | Nessuna connessione persistente che possa cadere; i tentativi sono per richiesta da Slack                      |

<Note>
  **Scegli Socket Mode** per host con un solo Gateway, laptop di sviluppo e reti on-prem che possono raggiungere `*.slack.com` in uscita ma non possono accettare HTTPS in ingresso.

**Scegli gli URL di richiesta HTTP** quando esegui più repliche del Gateway dietro un load balancer, quando WSS in uscita è bloccato ma HTTPS in ingresso è consentito, oppure quando termini già i Webhook Slack su un reverse proxy.
</Note>

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (predefinito)">
    <Steps>
      <Step title="Crea una nuova app Slack">
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Crea nuova app** → **Da un manifest** → seleziona la tua area di lavoro → incolla uno dei manifest seguenti → **Avanti** → **Crea**.

        <CodeGroup>

```json Consigliato
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

```json Minimo
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
          **Consigliato** corrisponde al set completo di funzionalità del Plugin Slack incluso: App Home, comandi slash, file, reazioni, pin, DM di gruppo e letture di emoji/gruppi di utenti. Scegli **Minimo** quando la policy dell'area di lavoro limita gli ambiti: copre DM, cronologia di canali/gruppi, menzioni e comandi slash, ma esclude file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulta la [checklist per manifest e ambiti](#manifest-and-scope-checklist) per la motivazione di ogni ambito e per opzioni additive come comandi slash aggiuntivi.
        </Note>

        Dopo che Slack ha creato l'app:

        - **Informazioni di base → Token a livello app → Genera token e ambiti**: aggiungi `connections:write`, salva, copia il valore `xapp-...`.
        - **Installa app → Installa nell'area di lavoro**: copia il token OAuth utente bot `xoxb-...`.

      </Step>

      <Step title="Configura OpenClaw">

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

        Fallback tramite variabili di ambiente (solo account predefinito):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Avvia il Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URL di richiesta HTTP">
    <Steps>
      <Step title="Crea una nuova app Slack">
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Crea nuova app** → **Da un manifest** → seleziona la tua area di lavoro → incolla uno dei manifest seguenti → sostituisci `https://gateway-host.example.com/slack/events` con l'URL pubblico del tuo Gateway → **Avanti** → **Crea**.

        <CodeGroup>

```json Consigliato
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
          **Consigliato** corrisponde all'insieme completo di funzionalità del Plugin Slack incluso; **Minimo** rimuove file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read` per workspace restrittivi. Consulta [Checklist di manifest e ambiti](#manifest-and-scope-checklist) per la motivazione di ogni ambito.
        </Note>

        <Info>
          I tre campi URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) puntano tutti allo stesso endpoint OpenClaw. Lo schema del manifest di Slack richiede che siano nominati separatamente, ma OpenClaw instrada in base al tipo di payload, quindi basta un singolo `webhookPath` (predefinito `/slack/events`). I comandi slash senza `slash_commands[].url` non eseguiranno alcuna operazione in modalità HTTP, senza avvisi.
        </Info>

        Dopo che Slack crea l'app:

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

## Regolazione del trasporto Socket Mode

OpenClaw imposta per impostazione predefinita il timeout pong del client SDK Slack a 15 secondi per Socket Mode. Sovrascrivi le impostazioni di trasporto solo quando hai bisogno di una regolazione specifica per workspace o host:

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

Usalo solo per workspace Socket Mode che registrano timeout pong/server-ping del websocket Slack o che vengono eseguiti su host con starvation nota dell'event loop. `clientPingTimeout` è l'attesa del pong dopo che l'SDK invia un ping client; `serverPingTimeout` è l'attesa dei ping server di Slack. I messaggi e gli eventi dell'app restano stato dell'applicazione, non segnali di attività del trasporto.

## Checklist di manifest e ambiti

Il manifest di base dell'app Slack è lo stesso per Socket Mode e per gli URL di richiesta HTTP. Solo il blocco `settings` (e l'`url` del comando slash) cambia.

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

### Impostazioni aggiuntive del manifest

Espone funzionalità diverse che estendono le impostazioni predefinite sopra.

Il manifest predefinito abilita la scheda **Home** della Slack App Home e sottoscrive `app_home_opened`. Quando un membro del workspace apre la scheda Home, OpenClaw pubblica una vista Home predefinita sicura con `views.publish`; non viene incluso alcun payload di conversazione o configurazione privata. La scheda **Messaggi** resta abilitata per i DM Slack.

<AccordionGroup>
  <Accordion title="Comandi slash nativi opzionali">

    È possibile usare più [comandi slash nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con alcune sfumature:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non possono essere resi disponibili più di 25 comandi slash alla volta.

    Sostituisci la sezione `features.slash_commands` esistente con un sottoinsieme dei [comandi disponibili](/it/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (predefinita)">

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

        Ripeti quel valore `url` su ogni comando nell'elenco.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Ambiti di attribuzione opzionali (operazioni di scrittura)">
    Aggiungi lo scope bot `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (nome utente e icona personalizzati) invece dell'identità predefinita dell'app Slack.

    Se usi un'icona emoji, Slack si aspetta la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Scope token utente opzionali (operazioni di lettura)">
    Se configuri `channels.slack.userToken`, gli scope di lettura tipici sono:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se dipendi dalle letture della ricerca Slack)

  </Accordion>
</AccordionGroup>

## Modello dei token

- `botToken` + `appToken` sono obbligatori per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe
  in testo semplice o oggetti SecretRef.
- I token di configurazione hanno la precedenza sul fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo di configurazione (nessun fallback env) e usa per impostazione predefinita un comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dello snapshot di stato:

- L'ispezione dell'account Slack traccia i campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` indica che l'account è configurato tramite SecretRef
  o un'altra origine di segreto non inline, ma il percorso corrente di comando/runtime
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP, `signingSecretStatus` è incluso; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per azioni/letture di directory, il token utente può essere preferito quando configurato. Per le scritture, il token bot resta preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il token bot non è disponibile.
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

Le azioni messaggio Slack correnti includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`. `download-file` accetta gli ID file Slack mostrati nei placeholder dei file in ingresso e restituisce anteprime immagine per le immagini o metadati di file locale per altri tipi di file.

## Controllo dell'accesso e routing

<Tabs>
  <Tab title="Policy DM">
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
    - Gli account con nome ereditano `channels.slack.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` legacy vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    L'abbinamento nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Policy dei canali">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'allowlist dei canali si trova sotto `channels.slack.channels` e **deve usare ID canale Slack stabili** (per esempio `C12345678`) come chiavi di configurazione.

    Nota runtime: se `channels.slack` è completamente assente (configurazione solo env), il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci dell'allowlist dei canali e dell'allowlist DM vengono risolte all'avvio quando l'accesso tramite token lo consente
    - le voci con nome canale non risolte vengono mantenute come configurate ma ignorate per impostazione predefinita per il routing
    - l'autorizzazione in ingresso e il routing dei canali sono ID-first per impostazione predefinita; la corrispondenza diretta di nome utente/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Le chiavi basate su nome (`#channel-name` o `channel-name`) **non** corrispondono con `groupPolicy: "allowlist"`. La ricerca del canale è ID-first per impostazione predefinita, quindi una chiave basata sul nome non verrà mai instradata correttamente e tutti i messaggi in quel canale verranno bloccati silenziosamente. Questo differisce da `groupPolicy: "open"`, dove la chiave del canale non è richiesta per il routing e una chiave basata sul nome sembra funzionare.

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

  <Tab title="Menzioni e utenti dei canali">
    I messaggi dei canali richiedono una menzione per impostazione predefinita.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - menzione di gruppo utenti Slack (`<!subteam^S...>`) quando l'utente bot è membro di quel gruppo utenti; richiede `usergroups:read`
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al thread del bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato chiave `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` o wildcard `"*"`
      (le chiavi legacy senza prefisso mappano ancora solo a `id:`)

    `allowBots` è conservativo per canali e canali privati: i messaggi della stanza scritti da bot sono accettati solo quando il bot mittente è elencato esplicitamente nell'allowlist `users` di quella stanza, oppure quando almeno un ID proprietario Slack esplicito da `channels.slack.allowFrom` è attualmente membro della stanza. Wildcard e voci proprietario con nome visualizzato non soddisfano la presenza del proprietario. La presenza del proprietario usa Slack `conversations.members`; assicurati che l'app abbia lo scope di lettura corrispondente per il tipo di stanza (`channels:read` per canali pubblici, `groups:read` per canali privati). Se la ricerca dei membri non riesce, OpenClaw scarta il messaggio della stanza scritto dal bot.

  </Tab>
</Tabs>

## Thread, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- I binding di route Slack accettano ID peer grezzi più forme di destinazione Slack come `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Con `session.dmScope=main` predefinito, i DM Slack confluiscono nella sessione principale dell'agente.
- Sessioni canale: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione thread (`:thread:<threadTs>`) quando applicabile.
- Nei canali in cui OpenClaw gestisce messaggi di primo livello senza richiedere una menzione esplicita, `replyToMode` non `off` instrada ogni radice gestita in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` in modo che il thread Slack visibile corrisponda a una sessione OpenClaw dal primo turno.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi thread esistenti vengono recuperati quando inizia una nuova sessione thread (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando `true`, sopprime le menzioni implicite nei thread in modo che il bot risponda solo a menzioni esplicite `@bot` dentro i thread, anche quando il bot ha già partecipato al thread. Senza questa opzione, le risposte in un thread a cui il bot ha partecipato aggirano il gate `requireMention`.

Controlli del threading delle risposte:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per chat dirette: `channels.slack.dm.replyToMode`

Sono supportati tag di risposta manuali:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Per risposte esplicite nei thread Slack dallo strumento `message`, imposta `replyBroadcast: true` con `action: "send"` e `threadId` o `replyTo` per chiedere a Slack di trasmettere anche la risposta del thread al canale padre. Questo corrisponde al flag `reply_broadcast` di `chat.postMessage` di Slack ed è supportato solo per invii di testo o Block Kit, non per caricamenti multimediali.

Quando una chiamata allo strumento `message` viene eseguita dentro un thread Slack e punta allo stesso canale, OpenClaw normalmente eredita il thread Slack corrente secondo `replyToMode`. Imposta `topLevel: true` su `action: "send"` o `action: "upload-file"` per forzare invece un nuovo messaggio nel canale padre. `threadId: null` è accettato come la stessa esclusione dal primo livello.

<Note>
`replyToMode="off"` disabilita **tutto** il threading delle risposte in Slack, inclusi i tag espliciti `[[reply_to_*]]`. Questo differisce da Telegram, dove i tag espliciti vengono comunque rispettati in modalità `"off"`. I thread Slack nascondono i messaggi dal canale, mentre le risposte Telegram restano visibili inline.
</Note>

## Reazioni di ack

`ackReaction` invia un emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcode (per esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o globalmente.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo dell'anteprima con l'ultimo output parziale.
- `block`: aggiunge aggiornamenti di anteprima a blocchi.
- `progress`: mostra testo di stato di avanzamento durante la generazione, poi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima bozza è attiva, instrada gli aggiornamenti di strumenti/avanzamento nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere separati i messaggi di strumenti/avanzamento.
- `streaming.preview.commandText` / `streaming.progress.commandText`: imposta a `status` per mantenere righe compatte di avanzamento strumenti nascondendo il testo raw di comando/exec (predefinito: `raw`).

Nascondi il testo raw di comando/exec mantenendo righe di avanzamento compatte:

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

- Deve essere disponibile un thread di risposta affinché compaiano lo streaming di testo nativo e lo stato del thread dell'assistente Slack. La selezione del thread segue comunque `replyToMode`.
- Le radici di canali, chat di gruppo e DM di primo livello possono comunque usare la normale anteprima della bozza quando lo streaming nativo non è disponibile o non esiste alcun thread di risposta.
- I DM Slack di primo livello restano fuori thread per impostazione predefinita, quindi non mostrano l'anteprima di streaming/stato nativa in stile thread di Slack; OpenClaw pubblica e modifica invece un'anteprima della bozza nel DM.
- I media e i payload non testuali ricadono sulla consegna normale.
- I finali media/errore annullano le modifiche di anteprima in sospeso; i finali testuali/a blocchi idonei vengono scaricati solo quando possono modificare l'anteprima sul posto.
- Se lo streaming fallisce a metà risposta, OpenClaw ricade sulla consegna normale per i payload rimanenti.

Usa l'anteprima della bozza invece dello streaming di testo nativo di Slack:

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
- boolean `channels.slack.streaming` è un alias runtime legacy per `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- legacy `channels.slack.nativeStreaming` è un alias runtime per `channels.slack.streaming.nativeTransport`.
- Esegui `openclaw doctor --fix` per riscrivere la configurazione di streaming Slack persistita nelle chiavi canoniche.

## Fallback della reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw elabora una risposta, poi la rimuove al termine dell'esecuzione. Questo è più utile fuori dalle risposte in thread, che usano un indicatore di stato predefinito "is typing...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (per esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente dopo il completamento del percorso di risposta o errore.

## Media, suddivisione in blocchi e consegna

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati file di Slack vengono scaricati da URL privati ospitati da Slack (flusso di richiesta autenticato con token) e scritti nell'archivio media quando il recupero riesce e i limiti di dimensione lo consentono. I segnaposto dei file includono lo Slack `fileId` così gli agenti possono recuperare il file originale con `download-file`.

    I download usano timeout delimitati di inattività e totali. Se il recupero del file Slack si blocca o fallisce, OpenClaw continua a elaborare il messaggio e ricade sul segnaposto del file.

    Il limite di dimensione runtime in ingresso predefinito è `20MB`, salvo override con `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione dando priorità ai paragrafi
    - gli invii di file usano le API di upload di Slack e possono includere risposte in thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME dalla pipeline media

  </Accordion>

  <Accordion title="Destinatari di consegna">
    Destinatari espliciti preferiti:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack solo testo/blocchi possono pubblicare direttamente sugli ID utente; gli upload di file e gli invii in thread aprono prima il DM tramite le API di conversazione Slack perché quei percorsi richiedono un ID conversazione concreto.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento slash

I comandi slash compaiono in Slack come un singolo comando configurato o più comandi nativi. Configura `channels.slack.slashCommand` per cambiare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni aggiuntive del manifesto](#additional-manifest-settings) nella tua app Slack e sono invece abilitati con `channels.slack.commands.native: true` o `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi Slack.

```txt
/help
```

I menu degli argomenti nativi usano una strategia di rendering adattiva che mostra una modale di conferma prima di inviare il valore dell'opzione selezionata:

- fino a 5 opzioni: blocchi di pulsanti
- 6-100 opzioni: menu di selezione statico
- più di 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gli handler delle opzioni di interattività
- limiti Slack superati: i valori delle opzioni codificati ricadono sui pulsanti

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

Quando è abilitata, gli agenti possono emettere direttive di risposta solo per Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni attraverso il percorso evento di interazione Slack esistente.

Note:

- Questa è un'interfaccia utente specifica di Slack. Gli altri canali non traducono le direttive Slack Block Kit nei propri sistemi di pulsanti.
- I valori dei callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superassero i limiti di Slack Block Kit, OpenClaw ricade sulla risposta testuale originale invece di inviare un payload di blocchi non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti e interazioni interattivi, invece di ricadere sulla Web UI o sul terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo di DM/canale.
- Le approvazioni Plugin possono comunque risolversi tramite la stessa superficie di pulsanti nativa Slack quando la richiesta arriva già in Slack e il tipo dell'ID approvazione è `plugin:`.
- L'autorizzazione dell'approvatore viene comunque applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie condivisa dei pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitata nelle impostazioni della tua app Slack, i prompt di approvazione vengono renderizzati come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, sono la UX primaria di approvazione; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le approvazioni via chat
non sono disponibili o che l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; ricade su `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e almeno un
approvatore viene risolto. Imposta `enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo.
Imposta `enabled: true` per forzare l'attivazione delle approvazioni native quando gli approvatori vengono risolti.

Comportamento predefinito senza una configurazione esplicita delle approvazioni exec Slack:

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

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando i prompt di approvazione exec devono essere
instradati anche ad altre chat o a destinatari espliciti fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi Slack possono comunque risolvere le approvazioni Plugin quando quelle richieste arrivano già
in Slack.

Anche `/approve` nella stessa chat funziona nei canali Slack e nei DM che supportano già i comandi. Consulta [Approvazioni exec](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi vengono mappate in eventi di sistema.
- Le trasmissioni dei thread ("Also send to channel" nelle risposte in thread) vengono elaborate come normali messaggi utente.
- Gli eventi di aggiunta/rimozione delle reazioni vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita dei membri, creazione/ridenominazione dei canali e aggiunta/rimozione dei pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati di argomento/scopo del canale sono trattati come contesto non attendibile e possono essere inseriti nel contesto di instradamento.
- L'iniziatore del thread e il seeding del contesto iniziale della cronologia del thread vengono filtrati dalle allowlist dei mittenti configurate quando applicabile.
- Le azioni sui blocchi e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload ricchi:
  - azioni sui blocchi: valori selezionati, etichette, valori picker e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati di canale instradati e input del modulo

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Slack](/it/gateway/config-channels#slack).

<Accordion title="Campi Slack ad alto segnale">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle di compatibilità: `dangerouslyAllowNameMatching` (break-glass; tienilo disattivato salvo necessità)
- accesso ai canali: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurl: `unfurlLinks`, `unfurlMedia` per il controllo delle anteprime link/media di `chat.postMessage`
- ops/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, in ordine:

    - `groupPolicy`
    - allowlist dei canali (`channels.slack.channels`) — **le chiavi devono essere ID canale** (`C12345678`), non nomi (`#channel-name`). Le chiavi basate sul nome falliscono silenziosamente con `groupPolicy: "allowlist"` perché l'instradamento del canale è ID-first per impostazione predefinita. Per trovare un ID: fai clic con il pulsante destro sul canale in Slack → **Copy link** — il valore `C...` alla fine dell'URL è l'ID canale.
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
    - approvazioni di associazione / voci allowlist
    - Eventi DM Slack Assistant: log verbosi che menzionano `drop message_changed`
      di solito significano che Slack ha inviato un evento di thread Assistant modificato senza un
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
    Verifica:

    - segreto di firma
    - percorso del webhook
    - URL di richiesta Slack (Eventi + Interattività + Comandi slash)
    - `webhookPath` univoco per account HTTP

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

## Riferimento alla visione degli allegati

Slack può allegare media scaricati al turno dell'agente quando i download dei file Slack riescono e i limiti di dimensione lo permettono. I file immagine possono passare attraverso il percorso di comprensione dei media o direttamente a un modello di risposta con capacità di visione; gli altri file vengono mantenuti come contesto di file scaricabile invece di essere trattati come input immagine.

### Tipi di media supportati

| Tipo di media                 | Origine              | Comportamento corrente                                                          | Note                                                                                 |
| ----------------------------- | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Immagini JPEG / PNG / GIF / WebP | URL di file Slack | Scaricate e allegate al turno per la gestione con capacità di visione            | Limite per file: `channels.slack.mediaMaxMb` (predefinito 20 MB)                     |
| File PDF                      | URL di file Slack    | Scaricati ed esposti come contesto file per strumenti come `download-file` o `pdf` | L'ingresso Slack non converte automaticamente i PDF in input per visione immagini    |
| Altri file                    | URL di file Slack    | Scaricati quando possibile ed esposti come contesto file                         | I file binari non vengono trattati come input immagine                               |
| Risposte nei thread           | File del messaggio iniziale del thread | I file del messaggio radice possono essere idratati come contesto quando la risposta non ha media diretti | I messaggi iniziali con soli file usano un segnaposto per allegato                   |
| Messaggi multi-immagine       | Più file Slack       | Ogni file viene valutato indipendentemente                                       | L'elaborazione Slack è limitata a otto file per messaggio                            |

### Pipeline in ingresso

Quando arriva un messaggio Slack con allegati file:

1. OpenClaw scarica il file dall'URL privato di Slack usando il token del bot (`xoxb-...`).
2. In caso di successo, il file viene scritto nell'archivio dei media.
3. I percorsi dei media scaricati e i tipi di contenuto vengono aggiunti al contesto in ingresso.
4. I percorsi di modelli/strumenti compatibili con le immagini possono usare gli allegati immagine da quel contesto.
5. I file non immagine restano disponibili come metadati file o riferimenti media per gli strumenti che possono gestirli.

### Ereditarietà degli allegati dalla radice del thread

Quando un messaggio arriva in un thread (ha un genitore `thread_ts`):

- Se la risposta stessa non ha media diretti e il messaggio radice incluso ha file, Slack può idratare i file radice come contesto del messaggio iniziale del thread.
- Gli allegati diretti della risposta hanno la precedenza sugli allegati del messaggio radice.
- Un messaggio radice che ha solo file e nessun testo viene rappresentato con un segnaposto per allegato, così il fallback può comunque includere i suoi file.

### Gestione di più allegati

Quando un singolo messaggio Slack contiene più allegati file:

- Ogni allegato viene elaborato indipendentemente attraverso la pipeline dei media.
- I riferimenti ai media scaricati vengono aggregati nel contesto del messaggio.
- L'ordine di elaborazione segue l'ordine dei file Slack nel payload dell'evento.
- Un errore nel download di un allegato non blocca gli altri.

### Limiti di dimensione, download e modello

- **Limite di dimensione**: 20 MB predefiniti per file. Configurabile tramite `channels.slack.mediaMaxMb`.
- **Errori di download**: I file che Slack non può servire, gli URL scaduti, i file inaccessibili, i file troppo grandi e le risposte HTML di autenticazione/accesso Slack vengono ignorati invece di essere segnalati come formati non supportati.
- **Modello di visione**: L'analisi delle immagini usa il modello di risposta attivo quando supporta la visione, oppure il modello immagine configurato in `agents.defaults.imageModel`.

### Limiti noti

| Scenario                               | Comportamento corrente                                                        | Soluzione alternativa                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL di file Slack scaduto              | File ignorato; nessun errore mostrato                                         | Ricarica il file in Slack                                                     |
| Modello di visione non configurato     | Gli allegati immagine vengono memorizzati come riferimenti media, ma non analizzati come immagini | Configura `agents.defaults.imageModel` o usa un modello di risposta con capacità di visione |
| Immagini molto grandi (> 20 MB per impostazione predefinita) | Ignorate in base al limite di dimensione                                      | Aumenta `channels.slack.mediaMaxMb` se Slack lo consente                      |
| Allegati inoltrati/condivisi           | Il testo e i media immagine/file ospitati da Slack sono gestiti al meglio     | Ricondividi direttamente nel thread OpenClaw                                  |
| Allegati PDF                           | Memorizzati come contesto file/media, non instradati automaticamente attraverso la visione immagini | Usa `download-file` per i metadati file o lo strumento `pdf` per l'analisi PDF |

### Documentazione correlata

- [Pipeline di comprensione dei media](/it/nodes/media-understanding)
- [Strumento PDF](/it/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — abilitazione della visione degli allegati Slack
- Test di regressione: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifica live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Correlati

<CardGroup cols={2}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Abbina un utente Slack al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento dei canali e dei messaggi diretti di gruppo.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Layout della configurazione e precedenza.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Catalogo e comportamento dei comandi.
  </Card>
</CardGroup>
