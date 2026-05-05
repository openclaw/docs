---
read_when:
    - Configurazione di Slack o diagnostica della modalità socket/HTTP di Slack
summary: Configurazione di Slack e comportamento in fase di esecuzione (Modalità Socket + URL di richiesta HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Pronto per la produzione per DM e canali tramite integrazioni dell'app Slack. La modalità predefinita è la Modalità Socket; sono supportati anche gli URL di richiesta HTTP.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    I DM Slack usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure di riparazione.
  </Card>
</CardGroup>

## Scegliere Modalità Socket o URL di richiesta HTTP

Entrambi i trasporti sono pronti per la produzione e raggiungono la parità funzionale per messaggistica, comandi slash, Home dell'app e interattività. Scegli in base alla forma del deployment, non alle funzionalità.

| Aspetto                      | Modalità Socket (predefinita)                                                        | URL di richiesta HTTP                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL pubblico del Gateway     | Non richiesto                                                                        | Richiesto (DNS, TLS, proxy inverso o tunnel)                                                                   |
| Rete in uscita               | La connessione WSS in uscita verso `wss-primary.slack.com` deve essere raggiungibile | Nessun WS in uscita; solo HTTPS in ingresso                                                                    |
| Token necessari              | Token del bot (`xoxb-...`) + token a livello di app (`xapp-...`) con `connections:write` | Token del bot (`xoxb-...`) + segreto di firma                                                                  |
| Portatile di sviluppo / dietro firewall | Funziona così com'è                                                                  | Richiede un tunnel pubblico (ngrok, Cloudflare Tunnel, Tailscale Funnel) o un Gateway di staging               |
| Scalabilità orizzontale      | Una sessione in Modalità Socket per app per host; più Gateway richiedono app Slack separate | Gestore POST senza stato; più repliche del Gateway possono condividere una sola app dietro un bilanciatore di carico |
| Più account su un Gateway    | Supportato; ogni account apre il proprio WS                                          | Supportato; ogni account richiede un `webhookPath` univoco (predefinito `/slack/events`) così le registrazioni non entrano in conflitto |
| Trasporto dei comandi slash  | Consegnato sulla connessione WS; `slash_commands[].url` viene ignorato               | Slack invia POST a `slash_commands[].url`; il campo è obbligatorio perché il comando venga inoltrato           |
| Firma delle richieste        | Non utilizzata (l'autenticazione è il token a livello di app)                        | Slack firma ogni richiesta; OpenClaw verifica con `signingSecret`                                              |
| Ripristino dopo caduta della connessione | L'SDK Slack si riconnette automaticamente; si applica la configurazione di trasporto `pong-timeout` del Gateway | Non c'è una connessione persistente che possa cadere; i tentativi vengono gestiti da Slack per ogni richiesta  |

<Note>
  **Scegli la Modalità Socket** per host con un solo Gateway, portatili di sviluppo e reti on-premise che possono raggiungere `*.slack.com` in uscita ma non possono accettare HTTPS in ingresso.

**Scegli gli URL di richiesta HTTP** quando esegui più repliche del Gateway dietro un bilanciatore di carico, quando il WSS in uscita è bloccato ma HTTPS in ingresso è consentito, o quando termini già i Webhook Slack su un proxy inverso.
</Note>

## Configurazione rapida

<Tabs>
  <Tab title="Modalità Socket (predefinita)">
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
          **Consigliato** corrisponde al set completo di funzionalità del Plugin Slack incluso: Home dell'app, comandi slash, file, reazioni, pin, DM di gruppo e letture di emoji/gruppi utenti. Scegli **Minimo** quando la policy dell'area di lavoro limita gli ambiti: copre DM, cronologia di canali/gruppi, menzioni e comandi slash, ma esclude file, reazioni, pin, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read`. Vedi [Checklist di manifest e ambiti](#manifest-and-scope-checklist) per la motivazione di ciascun ambito e opzioni aggiuntive come ulteriori comandi slash.
        </Note>

        Dopo che Slack crea l'app:

        - **Informazioni di base → Token a livello di app → Genera token e ambiti**: aggiungi `connections:write`, salva, copia il valore `xapp-...`.
        - **Installa app → Installa nell'area di lavoro**: copia il token OAuth dell'utente bot `xoxb-...`.

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

        Fallback tramite variabili d'ambiente (solo account predefinito):

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
        Apri [api.slack.com/apps](https://api.slack.com/apps/new) → **Crea nuova app** → **Da un manifest** → seleziona la tua area di lavoro → incolla uno dei manifest seguenti → sostituisci `https://gateway-host.example.com/slack/events` con il tuo URL pubblico del Gateway → **Avanti** → **Crea**.

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
          **Consigliato** corrisponde al set completo di funzionalità del Plugin Slack incluso; **Minimale** rimuove file, reazioni, elementi fissati, DM di gruppo (`mpim:*`), `emoji:read` e `usergroups:read` per workspace restrittivi. Vedi [Checklist di manifest e ambiti](#manifest-and-scope-checklist) per la motivazione di ogni ambito.
        </Note>

        <Info>
          I tre campi URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) puntano tutti allo stesso endpoint OpenClaw. Lo schema del manifest di Slack richiede che siano denominati separatamente, ma OpenClaw instrada in base al tipo di payload, quindi un singolo `webhookPath` (predefinito `/slack/events`) è sufficiente. I comandi slash senza `slash_commands[].url` non produrranno alcun effetto in modalità HTTP.
        </Info>

        Dopo che Slack ha creato l'app:

        - **Informazioni di base → Credenziali app**: copia il **Signing Secret** per la verifica delle richieste.
        - **Installa app → Installa nel workspace**: copia il token OAuth utente bot `xoxb-...`.

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

        Assegna a ogni account un `webhookPath` distinto (predefinito `/slack/events`) affinché le registrazioni non entrino in conflitto.
        </Note>

      </Step>

      <Step title="Avvia Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Regolazione del trasporto Socket Mode

OpenClaw imposta per impostazione predefinita il timeout pong del client Slack SDK a 15 secondi per Socket Mode. Sovrascrivi le impostazioni di trasporto solo quando ti serve una regolazione specifica per workspace o host:

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

Usalo solo per workspace Socket Mode che registrano timeout websocket pong/server-ping di Slack o che vengono eseguiti su host con nota saturazione dell'event loop. `clientPingTimeout` è l'attesa del pong dopo che l'SDK invia un ping client; `serverPingTimeout` è l'attesa dei ping server di Slack. I messaggi e gli eventi dell'app restano stato dell'applicazione, non segnali di attività del trasporto.

## Checklist di manifest e ambiti

Il manifest di base dell'app Slack è lo stesso per Socket Mode e per gli URL di richiesta HTTP. Differisce solo il blocco `settings` (e l'`url` del comando slash).

Manifest di base (Socket Mode predefinito):

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

Per la **modalità URL di richiesta HTTP**, sostituisci `settings` con la variante HTTP e aggiungi `url` a ogni comando slash. URL pubblico obbligatorio:

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

Mostra funzionalità diverse che estendono i valori predefiniti sopra indicati.

Il manifest predefinito abilita la scheda **Home** di Slack App Home e sottoscrive `app_home_opened`. Quando un membro del workspace apre la scheda Home, OpenClaw pubblica una vista Home predefinita sicura con `views.publish`; non viene inclusa alcuna conversazione né configurazione privata. La scheda **Messaggi** resta abilitata per i DM Slack.

<AccordionGroup>
  <Accordion title="Comandi slash nativi opzionali">

    È possibile usare più [comandi slash nativi](#commands-and-slash-behavior) invece di un singolo comando configurato, con qualche sfumatura:

    - Usa `/agentstatus` invece di `/status` perché il comando `/status` è riservato.
    - Non più di 25 comandi slash possono essere resi disponibili contemporaneamente.

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
  <Accordion title="Ambiti di paternità opzionali (operazioni di scrittura)">
    Aggiungi lo scope bot `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (nome utente e icona personalizzati) invece dell'identità predefinita dell'app Slack.

    Se usi un'icona emoji, Slack si aspetta la sintassi `:emoji_name:`.

  </Accordion>
  <Accordion title="Ambiti token utente opzionali (operazioni di lettura)">
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

- `botToken` + `appToken` sono obbligatori per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe in testo semplice
  o oggetti SecretRef.
- I token di configurazione hanno la precedenza sul fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo di configurazione (nessun fallback env) e per impostazione predefinita usa un comportamento di sola lettura (`userTokenReadOnly: true`).

Comportamento dell'istantanea di stato:

- L'ispezione degli account Slack traccia campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra origine segreta non inline, ma il percorso di comando/runtime corrente
  non è riuscito a risolvere il valore effettivo.
- In modalità HTTP, `signingSecretStatus` è incluso; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per azioni/letture della directory, il token utente può essere preferito quando configurato. Per le scritture, il token bot resta preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il token bot non è disponibile.
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

Le azioni messaggio Slack correnti includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`. `download-file` accetta gli ID file Slack mostrati nei segnaposto dei file in ingresso e restituisce anteprime immagine per le immagini o metadati file locali per gli altri tipi di file.

## Controllo degli accessi e routing

<Tabs>
  <Tab title="Policy DM">
    `channels.slack.dmPolicy` controlla l'accesso ai DM. `channels.slack.allowFrom` è l'allowlist DM canonica.

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

    `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` legacy vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza cambiare l'accesso.

    L'abbinamento nei DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Policy canale">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'allowlist dei canali si trova sotto `channels.slack.channels` e **deve usare ID canale Slack stabili** (per esempio `C12345678`) come chiavi di configurazione.

    Nota runtime: se `channels.slack` manca completamente (configurazione solo env), il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci dell'allowlist dei canali e dell'allowlist DM vengono risolte all'avvio quando l'accesso al token lo consente
    - le voci con nome canale non risolte vengono mantenute come configurate ma ignorate per il routing per impostazione predefinita
    - l'autorizzazione in ingresso e il routing dei canali sono ID-first per impostazione predefinita; la corrispondenza diretta per nome utente/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Le chiavi basate sul nome (`#channel-name` o `channel-name`) **non** corrispondono con `groupPolicy: "allowlist"`. La ricerca del canale è ID-first per impostazione predefinita, quindi una chiave basata sul nome non verrà mai instradata correttamente e tutti i messaggi in quel canale verranno bloccati silenziosamente. Questo differisce da `groupPolicy: "open"`, dove la chiave del canale non è richiesta per il routing e una chiave basata sul nome sembra funzionare.

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

    Non corretto (bloccato silenziosamente con `groupPolicy: "allowlist"`):

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
    Per impostazione predefinita, i messaggi dei canali richiedono una menzione.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - menzione di un gruppo di utenti Slack (`<!subteam^S...>`) quando l'utente bot è membro di quel gruppo di utenti; richiede `usergroups:read`
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito dei thread in risposta al bot (disabilitato quando `thread.requireExplicitMention` è `true`)

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato della chiave `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, o wildcard `"*"`
      (le chiavi legacy senza prefisso sono ancora mappate solo a `id:`)

    `allowBots` è conservativo per i canali e i canali privati: i messaggi della stanza scritti da bot sono accettati solo quando il bot mittente è elencato esplicitamente nell'allowlist `users` di quella stanza, oppure quando almeno un ID proprietario Slack esplicito da `channels.slack.allowFrom` è attualmente membro della stanza. Le wildcard e le voci proprietario con nome visualizzato non soddisfano la presenza del proprietario. La presenza del proprietario usa Slack `conversations.members`; assicurati che l'app disponga dell'ambito di lettura corrispondente per il tipo di stanza (`channels:read` per i canali pubblici, `groups:read` per i canali privati). Se la ricerca dei membri non riesce, OpenClaw scarta il messaggio della stanza scritto dal bot.

  </Tab>
</Tabs>

## Thread, sessioni e tag di risposta

- I DM vengono instradati come `direct`; i canali come `channel`; gli MPIM come `group`.
- I binding di instradamento Slack accettano ID peer grezzi più forme di destinazione Slack come `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Con `session.dmScope=main` predefinito, i DM Slack confluiscono nella sessione principale dell'agente.
- Sessioni dei canali: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione del thread (`:thread:<threadTs>`) quando applicabile.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi esistenti del thread vengono recuperati quando inizia una nuova sessione del thread (predefinito `20`; imposta `0` per disabilitare).
- `channels.slack.thread.requireExplicitMention` (predefinito `false`): quando è `true`, sopprime le menzioni implicite nei thread in modo che il bot risponda solo alle menzioni esplicite `@bot` nei thread, anche quando il bot ha già partecipato al thread. Senza questa opzione, le risposte in un thread a cui il bot ha partecipato bypassano il gating di `requireMention`.

Controlli dei thread di risposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per le chat dirette: `channels.slack.dm.replyToMode`

Sono supportati i tag di risposta manuali:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` disabilita **tutti** i thread di risposta in Slack, inclusi i tag espliciti `[[reply_to_*]]`. Questo differisce da Telegram, dove i tag espliciti vengono comunque rispettati in modalità `"off"`. I thread Slack nascondono i messaggi dal canale, mentre le risposte Telegram restano visibili in linea.
</Note>

## Reazioni di conferma

`ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcode (per esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o globalmente.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo dell'anteprima con l'output parziale più recente.
- `block`: aggiunge aggiornamenti di anteprima a blocchi.
- `progress`: mostra il testo di stato dell'avanzamento durante la generazione, quindi invia il testo finale.
- `streaming.preview.toolProgress`: quando l'anteprima bozza è attiva, instrada gli aggiornamenti di strumenti/avanzamento nello stesso messaggio di anteprima modificato (predefinito: `true`). Imposta `false` per mantenere messaggi separati di strumenti/avanzamento.
- `streaming.preview.commandText` / `streaming.progress.commandText`: imposta a `status` per mantenere righe compatte di avanzamento strumenti nascondendo il testo grezzo di comando/esecuzione (predefinito: `raw`).

Nascondi il testo grezzo di comando/esecuzione mantenendo righe compatte di avanzamento:

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

`channels.slack.streaming.nativeTransport` controlla lo streaming testuale nativo di Slack quando `channels.slack.streaming.mode` è `partial` (predefinito: `true`).

- Deve essere disponibile un thread di risposta affinché compaiano lo streaming testuale nativo e lo stato del thread dell'assistente Slack. La selezione del thread segue comunque `replyToMode`.
- I canali, le chat di gruppo e le radici DM di primo livello possono comunque usare la normale anteprima bozza quando lo streaming nativo non è disponibile o non esiste alcun thread di risposta.
- I DM Slack di primo livello restano fuori thread per impostazione predefinita, quindi non mostrano l'anteprima nativa di stream/stato in stile thread di Slack; OpenClaw pubblica e modifica invece un'anteprima bozza nel DM.
- I contenuti multimediali e i payload non testuali ricadono sulla consegna normale.
- I finali multimediali/di errore annullano le modifiche di anteprima in sospeso; i finali di testo/blocco idonei vengono scaricati solo quando possono modificare l'anteprima sul posto.
- Se lo streaming fallisce a metà risposta, OpenClaw ricade sulla consegna normale per i payload rimanenti.

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
- `channels.slack.nativeStreaming` legacy viene migrato automaticamente a `channels.slack.streaming.nativeTransport`.

## Fallback della reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw elabora una risposta, poi la rimuove al termine dell'esecuzione. È più utile al di fuori delle risposte nei thread, che usano un indicatore di stato predefinito "sta scrivendo...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (ad esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente dopo il completamento del percorso di risposta o di errore.

## Media, suddivisione in blocchi e recapito

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati dei file Slack vengono scaricati da URL privati ospitati da Slack (flusso di richiesta autenticato con token) e scritti nell'archivio dei media quando il recupero riesce e i limiti di dimensione lo consentono. I placeholder dei file includono il `fileId` di Slack, così gli agenti possono recuperare il file originale con `download-file`.

    I download usano timeout limitati sia per inattività sia totali. Se il recupero dei file Slack si blocca o non riesce, OpenClaw continua a elaborare il messaggio e ripiega sul placeholder del file.

    Il limite di dimensione in ingresso a runtime è predefinito a `20MB`, salvo override tramite `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione che privilegia i paragrafi
    - gli invii di file usano le API di caricamento Slack e possono includere risposte nei thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti per tipo MIME dalla pipeline dei media

  </Accordion>

  <Accordion title="Destinazioni di recapito">
    Destinazioni esplicite preferite:

    - `user:<id>` per i DM
    - `channel:<id>` per i canali

    I DM Slack solo testo/blocchi possono essere pubblicati direttamente sugli ID utente; i caricamenti di file e gli invii in thread aprono prima il DM tramite le API di conversazione Slack perché questi percorsi richiedono un ID conversazione concreto.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento slash

I comandi slash appaiono in Slack come un singolo comando configurato oppure come più comandi nativi. Configura `channels.slack.slashCommand` per modificare i valori predefiniti dei comandi:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

I comandi nativi richiedono [impostazioni di manifest aggiuntive](#additional-manifest-settings) nella tua app Slack e vengono abilitati invece con `channels.slack.commands.native: true` oppure `commands.native: true` nelle configurazioni globali.

- La modalità automatica dei comandi nativi è **disattivata** per Slack, quindi `commands.native: "auto"` non abilita i comandi nativi Slack.

```txt
/help
```

I menu degli argomenti nativi usano una strategia di rendering adattiva che mostra un modale di conferma prima di inviare il valore dell'opzione selezionata:

- fino a 5 opzioni: blocchi di pulsanti
- 6-100 opzioni: menu di selezione statico
- più di 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gestori delle opzioni di interattività
- limiti Slack superati: i valori delle opzioni codificati ripiegano sui pulsanti

```txt
/think
```

Le sessioni slash usano chiavi isolate come `agent:<agentId>:slack:slash:<userId>` e instradano comunque le esecuzioni dei comandi alla sessione della conversazione di destinazione usando `CommandTargetSessionKey`.

## Risposte interattive

Slack può renderizzare controlli di risposta interattivi creati dagli agenti, ma questa funzionalità è disabilitata per impostazione predefinita.

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
- I valori di callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dagli agenti.
- Se i blocchi interattivi generati supererebbero i limiti di Slack Block Kit, OpenClaw ripiega sulla risposta testuale originale invece di inviare un payload di blocchi non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti e interazioni interattivi, invece di ripiegare sull'interfaccia Web o sul terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo DM/canale.
- Le approvazioni dei Plugin possono comunque risolversi attraverso la stessa superficie di pulsanti nativa Slack quando la richiesta arriva già in Slack e il tipo di ID approvazione è `plugin:`.
- L'autorizzazione degli approvatori resta applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie di pulsanti di approvazione condivisa degli altri canali. Quando `interactivity` è abilitata nelle impostazioni della tua app Slack, le richieste di approvazione vengono renderizzate come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, sono la UX di approvazione principale; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento dice che le approvazioni in chat
non sono disponibili oppure che l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; ripiega su `commands.ownerAllowFrom` quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato oppure è `"auto"` e almeno un
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

La configurazione esplicita nativa Slack è necessaria solo quando vuoi eseguire l'override degli approvatori, aggiungere filtri o
attivare il recapito nella chat di origine:

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
essere instradate ad altre chat o a destinazioni esplicite fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi Slack possono comunque risolvere le approvazioni dei Plugin quando quelle richieste arrivano già
in Slack.

Anche `/approve` nella stessa chat funziona nei canali Slack e nei DM che supportano già i comandi. Consulta [Approvazioni exec](/it/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi vengono mappate in eventi di sistema.
- Le diffusioni dei thread (risposte nei thread "Invia anche al canale") vengono elaborate come normali messaggi utente.
- Gli eventi di aggiunta/rimozione reazione vengono mappati in eventi di sistema.
- Gli eventi di ingresso/uscita dei membri, creazione/ridenominazione dei canali e aggiunta/rimozione dei pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione dei canali quando `configWrites` è abilitato.
- I metadati di argomento/scopo del canale sono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- L'inizializzazione del contesto con il messaggio di avvio del thread e la cronologia iniziale del thread viene filtrata dagli allowlist mittenti configurati quando applicabile.
- Le azioni dei blocchi e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload ricchi:
  - azioni dei blocchi: valori selezionati, etichette, valori dei selettori e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradato e input del modulo

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Slack](/it/gateway/config-channels#slack).

<Accordion title="Campi Slack ad alto segnale">

- modalità/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- interruttore di compatibilità: `dangerouslyAllowNameMatching` (emergenza; tienilo disattivato salvo necessità)
- accesso canale: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- recapito: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operatività/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, nell'ordine:

    - `groupPolicy`
    - allowlist dei canali (`channels.slack.channels`) — **le chiavi devono essere ID canale** (`C12345678`), non nomi (`#channel-name`). Le chiavi basate sul nome falliscono silenziosamente con `groupPolicy: "allowlist"` perché l'instradamento dei canali è predefinito ID-first. Per trovare un ID: fai clic destro sul canale in Slack → **Copia link** — il valore `C...` alla fine dell'URL è l'ID del canale.
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
    - eventi DM di Slack Assistant: log dettagliati che menzionano `drop message_changed`
      di solito indicano che Slack ha inviato un evento di thread Assistant modificato senza un
      mittente umano recuperabile nei metadati del messaggio

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Modalità socket non connessa">
    Convalida i token bot + app e l'abilitazione della modalità socket nelle impostazioni dell'app Slack.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` oppure
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime corrente non è riuscito a risolvere il valore basato su SecretRef.

  </Accordion>

  <Accordion title="Modalità HTTP che non riceve eventi">
    Convalida:

    - segreto di firma
    - percorso Webhook
    - URL di richiesta Slack (Eventi + Interattività + Comandi slash)
    - `webhookPath` univoco per account HTTP

    Se `signingSecretStatus: "configured_unavailable"` appare negli snapshot degli account,
    l'account HTTP è configurato ma il runtime corrente non è riuscito a
    risolvere il segreto di firma basato su SecretRef.

  </Accordion>

  <Accordion title="Comandi nativi/slash che non si attivano">
    Verifica cosa intendevi usare:

    - modalità comando nativo (`channels.slack.commands.native: true`) con comandi slash corrispondenti registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Controlla anche `commands.useAccessGroups` e gli allowlist di canali/utenti.

  </Accordion>
</AccordionGroup>

## Riferimento visione allegati

Slack può allegare media scaricati al turno dell'agente quando i download dei file Slack riescono e i limiti di dimensione lo consentono. I file immagine possono essere passati attraverso il percorso di comprensione dei media oppure direttamente a un modello di risposta con capacità di visione; gli altri file vengono conservati come contesto file scaricabile invece di essere trattati come input immagine.

### Tipi di media supportati

| Tipo di media                  | Origine              | Comportamento attuale                                                            | Note                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Immagini JPEG / PNG / GIF / WebP | URL file Slack       | Scaricate e allegate al turno per la gestione con supporto alla visione          | Limite per file: `channels.slack.mediaMaxMb` (predefinito 20 MB)          |
| File PDF                       | URL file Slack       | Scaricati ed esposti come contesto file per strumenti come `download-file` o `pdf` | L'input Slack in ingresso non converte automaticamente i PDF in input image-vision |
| Altri file                     | URL file Slack       | Scaricati quando possibile ed esposti come contesto file                          | I file binari non sono trattati come input immagine                       |
| Risposte nei thread            | File del messaggio iniziale del thread | I file del messaggio radice possono essere idratati come contesto quando la risposta non ha media diretti | I messaggi iniziali con soli file usano un segnaposto di allegato         |
| Messaggi con più immagini      | Più file Slack       | Ogni file viene valutato in modo indipendente                                     | L'elaborazione Slack è limitata a otto file per messaggio                 |

### Pipeline in ingresso

Quando arriva un messaggio Slack con allegati file:

1. OpenClaw scarica il file dall'URL privato di Slack usando il token del bot (`xoxb-...`).
2. Il file viene scritto nell'archivio media in caso di successo.
3. I percorsi dei media scaricati e i tipi di contenuto vengono aggiunti al contesto in ingresso.
4. I percorsi di modello/strumento con supporto alle immagini possono usare gli allegati immagine da quel contesto.
5. I file non immagine restano disponibili come metadati file o riferimenti media per gli strumenti che possono gestirli.

### Ereditarietà degli allegati del messaggio radice del thread

Quando un messaggio arriva in un thread (ha un padre `thread_ts`):

- Se la risposta stessa non ha media diretti e il messaggio radice incluso ha file, Slack può idratare i file radice come contesto del messaggio iniziale del thread.
- Gli allegati diretti della risposta hanno la precedenza sugli allegati del messaggio radice.
- Un messaggio radice che contiene solo file e nessun testo viene rappresentato con un segnaposto di allegato, così il fallback può comunque includere i suoi file.

### Gestione di più allegati

Quando un singolo messaggio Slack contiene più allegati file:

- Ogni allegato viene elaborato indipendentemente tramite la pipeline dei media.
- I riferimenti ai media scaricati vengono aggregati nel contesto del messaggio.
- L'ordine di elaborazione segue l'ordine dei file Slack nel payload dell'evento.
- Un errore nel download di un allegato non blocca gli altri.

### Limiti di dimensione, download e modello

- **Limite di dimensione**: predefinito 20 MB per file. Configurabile tramite `channels.slack.mediaMaxMb`.
- **Errori di download**: i file che Slack non può servire, gli URL scaduti, i file inaccessibili, i file troppo grandi e le risposte HTML di autenticazione/login di Slack vengono ignorati invece di essere segnalati come formati non supportati.
- **Modello di visione**: l'analisi delle immagini usa il modello di risposta attivo quando supporta la visione, oppure il modello immagine configurato in `agents.defaults.imageModel`.

### Limiti noti

| Scenario                               | Comportamento attuale                                                        | Soluzione alternativa                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL file Slack scaduto                 | File ignorato; nessun errore mostrato                                         | Ricarica il file in Slack                                                  |
| Modello di visione non configurato     | Gli allegati immagine vengono archiviati come riferimenti media, ma non analizzati come immagini | Configura `agents.defaults.imageModel` o usa un modello di risposta con supporto alla visione |
| Immagini molto grandi (> 20 MB per impostazione predefinita) | Ignorate in base al limite di dimensione                                      | Aumenta `channels.slack.mediaMaxMb` se Slack lo consente                   |
| Allegati inoltrati/condivisi           | Il testo e i media immagine/file ospitati da Slack sono gestiti al meglio     | Ricondividi direttamente nel thread OpenClaw                               |
| Allegati PDF                           | Archiviati come contesto file/media, non instradati automaticamente tramite la visione delle immagini | Usa `download-file` per i metadati file o lo strumento `pdf` per l'analisi PDF |

### Documentazione correlata

- [Pipeline di comprensione dei media](/it/nodes/media-understanding)
- [Strumento PDF](/it/tools/pdf)
- Epica: [#51349](https://github.com/openclaw/openclaw/issues/51349) — abilitazione della visione per gli allegati Slack
- Test di regressione: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifica live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Correlati

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    Associa un utente Slack al Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/it/channels/groups">
    Comportamento di canali e DM di gruppo.
  </Card>
  <Card title="Channel routing" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Security" icon="shield" href="/it/gateway/security">
    Modello delle minacce e rafforzamento.
  </Card>
  <Card title="Configuration" icon="sliders" href="/it/gateway/configuration">
    Layout e precedenza della configurazione.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Catalogo e comportamento dei comandi.
  </Card>
</CardGroup>
