---
read_when:
    - Slack instellen of de socket-/HTTP-modus van Slack debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode + HTTP-verzoek-URL's)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:23:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

Productieklaar voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP-aanvraag-URL's worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en reparatieplaybooks.
  </Card>
</CardGroup>

## Socket Mode of HTTP-aanvraag-URL's kiezen

Beide transporten zijn productieklaar en bieden functiepariteit voor berichten, slash-commando's, App Home en interactiviteit. Kies op basis van de implementatievorm, niet op basis van functies.

| Aandachtspunt                | Socket Mode (standaard)                                                              | HTTP-aanvraag-URL's                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Openbare Gateway-URL         | Niet vereist                                                                         | Vereist (DNS, TLS, reverse proxy of tunnel)                                                                    |
| Uitgaand netwerk             | Uitgaande WSS naar `wss-primary.slack.com` moet bereikbaar zijn                      | Geen uitgaande WS; alleen inkomende HTTPS                                                                      |
| Benodigde tokens             | Bottoken (`xoxb-...`) + App-Level Token (`xapp-...`) met `connections:write`         | Bottoken (`xoxb-...`) + Signing Secret                                                                         |
| Dev-laptop / achter firewall | Werkt direct                                                                         | Heeft een openbare tunnel nodig (ngrok, Cloudflare Tunnel, Tailscale Funnel) of staging-Gateway                |
| Horizontaal schalen          | Eén Socket Mode-sessie per app per host; meerdere Gateways hebben aparte Slack-apps nodig | Stateless POST-handler; meerdere Gateway-replica's kunnen één app delen achter een load balancer           |
| Meerdere accounts op één Gateway | Ondersteund; elk account opent zijn eigen WS                                     | Ondersteund; elk account heeft een unieke `webhookPath` nodig (standaard `/slack/events`) zodat registraties niet botsen |
| Transport voor slash-commando's | Geleverd via de WS-verbinding; `slash_commands[].url` wordt genegeerd             | Slack POST naar `slash_commands[].url`; veld is vereist om de opdracht te verzenden                            |
| Ondertekening van aanvragen  | Niet gebruikt (authenticatie is de App-Level Token)                                  | Slack ondertekent elke aanvraag; OpenClaw verifieert met `signingSecret`                                      |
| Herstel bij verbindingsverlies | Slack SDK maakt automatisch opnieuw verbinding; de pong-timeout-transportafstemming van de Gateway is van toepassing | Geen persistente verbinding die kan wegvallen; retries zijn per aanvraag vanuit Slack                       |

<Note>
  **Kies Socket Mode** voor hosts met één Gateway, dev-laptops en on-prem-netwerken die uitgaand `*.slack.com` kunnen bereiken maar geen inkomende HTTPS kunnen accepteren.

**Kies HTTP-aanvraag-URL's** wanneer je meerdere Gateway-replica's achter een load balancer draait, wanneer uitgaande WSS wordt geblokkeerd maar inkomende HTTPS is toegestaan, of wanneer je Slack-webhooks al afhandelt via een reverse proxy.
</Note>

## Snelle setup

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Open [api.slack.com/apps](https://api.slack.com/apps/new) → **Nieuwe app maken** → **Vanuit een manifest** → selecteer je workspace → plak een van de onderstaande manifests → **Volgende** → **Maken**.

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
          **Aanbevolen** komt overeen met de volledige functieset van de meegeleverde Slack-Plugin: App Home, slash-commando's, bestanden, reacties, pins, groeps-DM's en leesrechten voor emoji/gebruikersgroepen. Kies **Minimaal** wanneer workspacebeleid scopes beperkt — dit dekt DM's, kanaal-/groepsgeschiedenis, vermeldingen en slash-commando's, maar laat bestanden, reacties, pins, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg. Zie [Manifest- en scopechecklist](#manifest-and-scope-checklist) voor de reden per scope en aanvullende opties zoals extra slash-commando's.
        </Note>

        Nadat Slack de app heeft gemaakt:

        - **Basisinformatie → App-Level Tokens → Token en scopes genereren**: voeg `connections:write` toe, sla op en kopieer de waarde `xapp-...`.
        - **App installeren → Installeren in workspace**: kopieer de `xoxb-...` Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Aanbevolen SecretRef-configuratie:

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

        Env-fallback (alleen standaardaccount):

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
        Open [api.slack.com/apps](https://api.slack.com/apps/new) → **Nieuwe app maken** → **Vanuit een manifest** → selecteer je workspace → plak een van de onderstaande manifests → vervang `https://gateway-host.example.com/slack/events` door je openbare Gateway-URL → **Volgende** → **Maken**.

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

```json Minimaal
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
          **Aanbevolen** komt overeen met de volledige functieset van de meegeleverde Slack-Plugin; **Minimaal** laat bestanden, reacties, pins, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg voor restrictieve werkruimten. Zie [Manifest- en scopecontrolelijst](#manifest-and-scope-checklist) voor de onderbouwing per scope.
        </Note>

        <Info>
          De drie URL-velden (`slash_commands[].url`, `event_subscriptions.request_url` en `interactivity.request_url` / `message_menu_options_url`) verwijzen allemaal naar hetzelfde OpenClaw-endpoint. Het manifestschema van Slack vereist dat ze afzonderlijk worden benoemd, maar OpenClaw routeert op payloadtype, dus een enkele `webhookPath` (standaard `/slack/events`) is genoeg. Slashcommando's zonder `slash_commands[].url` doen in HTTP-modus stilzwijgend niets.
        </Info>

        Nadat Slack de app heeft gemaakt:

        - **Basisinformatie → Appreferenties**: kopieer het **Signing Secret** voor aanvraagverificatie.
        - **App installeren → Installeren in werkruimte**: kopieer het `xoxb-...` OAuth-token voor botgebruikers.

      </Step>

      <Step title="OpenClaw configureren">

        Aanbevolen SecretRef-configuratie:

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
        Gebruik unieke Webhook-paden voor HTTP met meerdere accounts

        Geef elk account een afzonderlijke `webhookPath` (standaard `/slack/events`) zodat registraties niet conflicteren.
        </Note>

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode-transportafstemming

OpenClaw stelt de pong-time-out van de Slack SDK-client standaard in op 15 seconden voor Socket Mode. Overschrijf de transportinstellingen alleen wanneer je werkruimte- of hostspecifieke afstemming nodig hebt:

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

Gebruik dit alleen voor Socket Mode-werkruimten die Slack-websocket-pong- of server-pingtime-outs loggen, of die draaien op hosts met bekende event-loop-starvation. `clientPingTimeout` is de pong-wachttijd nadat de SDK een client-ping heeft verzonden; `serverPingTimeout` is de wachttijd voor Slack-serverpings. Appberichten en events blijven applicatiestatus, geen signalen voor transportbeschikbaarheid.

## Manifest- en scopecontrolelijst

Het basismanifest voor Slack-apps is hetzelfde voor Socket Mode en HTTP-aanvraag-URL's. Alleen het `settings`-blok (en de slashcommando-`url`) verschilt.

Basemanifest (standaard voor Socket Mode):

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

Voor de **HTTP-aanvraag-URL-modus** vervang je `settings` door de HTTP-variant en voeg je `url` toe aan elk slashcommando. Openbare URL vereist:

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

### Aanvullende manifestinstellingen

Maak andere functies beschikbaar die de bovenstaande standaardinstellingen uitbreiden.

Het standaardmanifest schakelt het Slack App Home-tabblad **Startpagina** in en abonneert zich op `app_home_opened`. Wanneer een werkruimtelid het tabblad Startpagina opent, publiceert OpenClaw een veilige standaardweergave voor Startpagina met `views.publish`; er wordt geen gesprekspayload of privéconfiguratie opgenomen. Het tabblad **Berichten** blijft ingeschakeld voor Slack-DM's.

<AccordionGroup>
  <Accordion title="Optionele native slashcommando's">

    Meerdere [native slashcommando's](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerd commando, met nuance:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat het commando `/status` gereserveerd is.
    - Er kunnen niet meer dan 25 slashcommando's tegelijk beschikbaar worden gemaakt.

    Vervang je bestaande sectie `features.slash_commands` door een subset van [beschikbare commando's](/nl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (standaard)">

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
      <Tab title="HTTP-aanvraag-URL's">
        Gebruik dezelfde `slash_commands`-lijst als bij Socket Mode hierboven en voeg `"url": "https://gateway-host.example.com/slack/events"` toe aan elk item. Voorbeeld:

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

        Herhaal die `url`-waarde voor elk commando in de lijst.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionele auteurschap-scopes (schrijfbewerkingen)">
    Voeg de `chat:write.customize` bot-scope toe als je wilt dat uitgaande berichten de actieve agentidentiteit gebruiken (aangepaste gebruikersnaam en pictogram) in plaats van de standaardidentiteit van de Slack-app.

    Als je een emoji-pictogram gebruikt, verwacht Slack de syntaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionele gebruikerstoken-scopes (leesbewerkingen)">
    Als je `channels.slack.userToken` configureert, zijn typische leesscopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (als je afhankelijk bent van Slack-zoekleesacties)

  </Accordion>
</AccordionGroup>

## Tokenmodel

- `botToken` + `appToken` zijn vereist voor Socket Mode.
- HTTP-modus vereist `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren plattetekst-
  strings of SecretRef-objecten.
- Configuratietokens overschrijven de env-terugval.
- De env-terugval `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen via configuratie beschikbaar (geen env-terugval) en gebruikt standaard alleen-lezen-gedrag (`userTokenReadOnly: true`).

Gedrag van statussnapshot:

- Slack-accountinspectie houdt per referentie `*Source`- en `*Status`-
  velden bij (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige opdracht-/runtimepad
  de werkelijke waarde niet kon bepalen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/mapleesbewerkingen kan een gebruikerstoken de voorkeur krijgen wanneer dit is geconfigureerd. Voor schrijfbewerkingen blijft het bottoken de voorkeur houden; gebruikerstoken-schrijfbewerkingen zijn alleen toegestaan wanneer `userTokenReadOnly: false` en het bottoken niet beschikbaar is.
</Tip>

## Acties en gates

Slack-acties worden beheerd door `channels.slack.actions.*`.

Beschikbare actiegroepen in de huidige Slack-tooling:

| Groep      | Standaard |
| ---------- | --------- |
| messages   | ingeschakeld |
| reactions  | ingeschakeld |
| pins       | ingeschakeld |
| memberInfo | ingeschakeld |
| emojiList  | ingeschakeld |

Huidige Slack-berichtacties omvatten `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` en `emoji-list`. `download-file` accepteert Slack-bestands-ID's die in inkomende bestandsplaatsaanduidingen worden getoond en retourneert afbeeldingsvoorbeelden voor afbeeldingen of lokale bestandsmetadata voor andere bestandstypen.

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.slack.dmPolicy` beheert DM-toegang. `channels.slack.allowFrom` is de canonieke DM-allowlist.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.slack.allowFrom` `"*"` bevat)
    - `disabled`

    DM-vlaggen:

    - `dm.enabled` (standaard true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (verouderd)
    - `dm.groupEnabled` (groeps-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-allowlist)

    Prioriteit bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Verouderde `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    Koppelen in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaal-allowlist staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (setup alleen via env), valt de runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam-/ID-resolutie:

    - kanaal-allowlistvermeldingen en DM-allowlistvermeldingen worden bij het opstarten opgelost wanneer tokentoegang dit toestaat
    - niet-opgeloste vermeldingen met kanaalnamen blijven geconfigureerd maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-first; directe matching op gebruikersnaam/slug vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Naamgebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalopzoeking is standaard ID-first, dus een naamgebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stilzwijgend geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een naamgebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Zo vind je die: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de ID (`C...`) verschijnt aan het einde van de URL.

    Correct:

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

    Incorrect (stilzwijgend geblokkeerd onder `groupPolicy: "allowlist"`):

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

  <Tab title="Vermeldingen en kanaalgebruikers">
    Kanaalberichten zijn standaard mention-gated.

    Vermeldingsbronnen:

    - expliciete app-vermelding (`<@botId>`)
    - Slack-gebruikersgroepvermelding (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Regelaars per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Sleutelformaat van `toolsBySender`: `id:`, `e164:`, `username:`, `name:` of `"*"`-jokerteken
      (verouderde sleutels zonder prefix worden nog steeds alleen aan `id:` gekoppeld)

    `allowBots` is conservatief voor kanalen en privékanelen: door bots geschreven roombereichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-allowlist van die room staat, of wanneer minstens één expliciete Slack-eigenaars-ID uit `channels.slack.allowFrom` momenteel lid is van de room. Jokertekens en vermeldingen van eigenaars op weergavenaam voldoen niet aan aanwezigheid van de eigenaar. Aanwezigheid van eigenaars gebruikt Slack `conversations.members`; zorg dat de app de bijpassende leesscope heeft voor het roomtype (`channels:read` voor openbare kanalen, `groups:read` voor privékanelen). Als het ophalen van leden mislukt, laat OpenClaw het door een bot geschreven roombereicht vallen.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindings accepteren ruwe peer-ID's plus Slack-doelvormen zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met standaard `session.dmScope=main` worden Slack-DM's samengevoegd naar de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen thread-sessiesuffixen maken (`:thread:<threadTs>`) wanneer van toepassing.
- In kanalen waar OpenClaw top-levelberichten afhandelt zonder een expliciete vermelding te vereisen, routeren niet-`off` `replyToMode`-waarden elke afgehandelde root naar `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, zodat de zichtbare Slack-thread vanaf de eerste beurt naar één OpenClaw-sessie mappt.
- De standaardwaarde van `channels.slack.thread.historyScope` is `thread`; de standaardwaarde van `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel in op `0` om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, onderdrukt dit impliciete threadvermeldingen zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-gate.

Regelaars voor antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- verouderde terugval voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Voor expliciete Slack-threadantwoorden vanuit de `message`-tool stel je `replyBroadcast: true` in met `action: "send"` en `threadId` of `replyTo` om Slack te vragen het threadantwoord ook naar het bovenliggende kanaal te broadcasten. Dit mappt naar de `reply_broadcast`-vlag van Slack `chat.postMessage` en wordt alleen ondersteund voor tekst- of Block Kit-verzendingen, niet voor media-uploads.

Wanneer een `message`-toolaanroep binnen een Slack-thread draait en hetzelfde kanaal target, erft OpenClaw normaal de huidige Slack-thread volgens `replyToMode`. Stel `topLevel: true` in op `action: "send"` of `action: "upload-file"` om in plaats daarvan een nieuw bericht in het bovenliggende kanaal te forceren. `threadId: null` wordt geaccepteerd als dezelfde top-level opt-out.

<Note>
`replyToMode="off"` schakelt **alle** antwoordthreading in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gerespecteerd in `"off"`-modus. Slack-threads verbergen berichten in het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- terugval op emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

## Tekststreaming

`channels.slack.streaming` beheert livevoorbeeldgedrag:

- `off`: schakel livevoorbeeldstreaming uit.
- `partial` (standaard): vervang voorbeeldtekst door de nieuwste gedeeltelijke uitvoer.
- `block`: voeg voorbeeldupdates in chunks toe.
- `progress`: toon voortgangsstatustekst tijdens het genereren en verzend daarna de definitieve tekst.
- `streaming.preview.toolProgress`: wanneer conceptvoorbeeld actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht (standaard: `true`). Stel in op `false` om afzonderlijke tool-/voortgangsberichten te behouden.
- `streaming.preview.commandText` / `streaming.progress.commandText`: stel in op `status` om compacte toolvoortgangsregels te behouden terwijl ruwe opdracht-/exec-tekst wordt verborgen (standaard: `raw`).

Verberg ruwe opdracht-/exec-tekst terwijl compacte voortgangsregels behouden blijven:

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

`channels.slack.streaming.nativeTransport` beheert native tekststreaming van Slack wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn voordat native tekststreaming en de Slack-assistentthreadstatus verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal-, groepschat- en DM-roots op topniveau kunnen nog steeds het normale conceptvoorbeeld gebruiken wanneer native streaming niet beschikbaar is of er geen antwoordthread bestaat.
- Slack-DM's op topniveau blijven standaard buiten threads, dus ze tonen niet Slack's threadachtige native stream-/statusvoorbeeld; OpenClaw plaatst en bewerkt in plaats daarvan een conceptvoorbeeld in de DM.
- Media en niet-tekstpayloads vallen terug op normale levering.
- Definitieve media-/foutberichten annuleren openstaande voorbeeldbewerkingen; geschikte definitieve tekst-/blokberichten flushen alleen wanneer ze het voorbeeld ter plekke kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale levering voor resterende payloads.

Gebruik conceptvoorbeeld in plaats van Slack native tekststreaming:

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

Verouderde sleutels:

- `channels.slack.streamMode` (`replace | status_final | append`) is een verouderde runtime-alias voor `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` is een verouderde runtime-alias voor `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- verouderde `channels.slack.nativeStreaming` is een runtime-alias voor `channels.slack.streaming.nativeTransport`.
- Voer `openclaw doctor --fix` uit om opgeslagen Slack-streamingconfiguratie te herschrijven naar de canonieke sleutels.

## Terugval voor typreactie

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run klaar is. Dit is het nuttigst buiten threadantwoorden, die een standaardstatusindicator "is typing..." gebruiken.

Oplosvolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opschoning wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en levering

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack-bestandsbijlagen worden gedownload van door Slack gehoste privé-URL's (token-geauthenticeerde aanvraagflow) en naar de mediaopslag geschreven wanneer ophalen lukt en groottelimieten dit toestaan. Bestandplaatshouders bevatten de Slack-`fileId`, zodat agents het originele bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde idle- en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandplaatshouder.

    De runtimegroottelimiet voor inkomende bestanden is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - tekstchunks gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt alinea-eerst-splitsing in
    - bestandverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden bevatten (`thread_ts`)
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Delivery targets">
    Aanbevolen expliciete doelen:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst/blokken kunnen rechtstreeks naar gebruikers-ID's posten; bestandsuploads en verzonden threadberichten openen eerst de DM via Slack-conversatie-API's, omdat die paden een concreet conversatie-ID vereisen.

  </Accordion>
</AccordionGroup>

## Opdrachten en slashgedrag

Slash-opdrachten verschijnen in Slack als één geconfigureerde opdracht of als meerdere native opdrachten. Configureer `channels.slack.slashCommand` om opdrachtstandaarden te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native opdrachten vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true` in globale configuraties.

- Native opdracht-automodus staat voor Slack **uit**, dus `commands.native: "auto"` schakelt Slack native opdrachten niet in.

```txt
/help
```

Native argumentmenu's gebruiken een adaptieve renderstrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: knopblokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met async optiefiltering wanneer interactiviteitsoptiehandlers beschikbaar zijn
- overschreden Slack-limieten: gecodeerde optiewaarden vallen terug op knoppen

```txt
/think
```

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren opdrachtuitvoeringen nog steeds naar de doelconversatiesessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan door agents geschreven interactieve antwoordbedieningselementen renderen, maar deze functie is standaard uitgeschakeld.

Schakel dit globaal in:

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

Of schakel dit alleen voor één Slack-account in:

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

Wanneer ingeschakeld, kunnen agents alleen-voor-Slack antwoorddirectieven uitzenden:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze directieven worden gecompileerd naar Slack Block Kit en routeren klikken of selecties terug via het bestaande Slack-interactiegebeurtenispad.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-directieven niet naar hun eigen knoppensystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen ruwe door agents geschreven waarden.
- Als gegenereerde interactieve blokken Slack Block Kit-limieten zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blokkenpayload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan fungeren als native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de Web UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native DM-/kanaalroutering.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden afgehandeld wanneer de aanvraag al in Slack terechtkomt en het goedkeurings-ID-soort `plugin:` is.
- Goedkeurderautorisatie wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen aanvragen via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in je Slack-appinstellingen, worden goedkeuringsprompts rechtstreeks in de conversatie gerenderd als Block Kit-knoppen.
Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en er ten minste één
goedkeurder wordt opgelost. Stel `enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient.
Stel `enabled: true` in om native goedkeuringen te forceren wanneer goedkeurders worden opgelost.

Standaardgedrag zonder expliciete Slack-exec-goedkeuringsconfiguratie:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
wilt kiezen voor levering naar de oorsprongschat:

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

Gedeelde `approvals.exec`-doorsturing staat los hiervan. Gebruik dit alleen wanneer exec-goedkeuringsprompts ook
naar andere chats of expliciete out-of-band-doelen moeten routeren. Gedeelde `approvals.plugin`-doorsturing staat ook
los hiervan; Slack-native knoppen kunnen nog steeds Plugin-goedkeuringen afhandelen wanneer die aanvragen al
in Slack terechtkomen.

Zelfde-chat `/approve` werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige goedkeuringsdoorsturingsmodel.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden gemapt naar systeemgebeurtenissen.
- Threadbroadcasts ("Also send to channel" threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Reactie-toevoeg-/verwijdergebeurtenissen worden gemapt naar systeemgebeurtenissen.
- Lid toetreden/verlaten, kanaal aangemaakt/hernoemd en pin-toevoeg-/verwijdergebeurtenissen worden gemapt naar systeemgebeurtenissen.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Kanaalonderwerp-/doelmetadata wordt behandeld als onvertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Threadstarter en initiële threadgeschiedenis-contextseeding worden gefilterd op geconfigureerde afzender-allowlists wanneer van toepassing.
- Blokacties en modalinteracties zenden gestructureerde `Slack interaction: ...`-systeemgebeurtenissen uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modal-`view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (verouderd: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodschakelaar; laat uit tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks`, `unfurlMedia` voor `chat.postMessage`-link-/mediavoorbeeldbeheer
- ops/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="No replies in channels">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Naamgebaseerde sleutels falen stil onder `groupPolicy: "allowlist"` omdat kanaalroutering standaard ID-eerst is. Om een ID te vinden: klik met de rechtermuisknop op het kanaal in Slack → **Copy link** — de `C...`-waarde aan het einde van de URL is het kanaal-ID.
    - `requireMention`
    - per-kanaal `users`-allowlist

    Nuttige opdrachten:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Controleer:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (of verouderd `channels.slack.dm.policy`)
    - koppelingsgoedkeuringen / allowlist-vermeldingen
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis stuurde zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Valideer bot- en app-tokens en Socket Mode-inschakeling in Slack-appinstellingen.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd maar kon de huidige runtime de SecretRef-ondersteunde
    waarde niet oplossen.

  </Accordion>

  <Accordion title="HTTP-modus ontvangt geen gebeurtenissen">
    Valideer:

    - ondertekeningsgeheim
    - webhookpad
    - Slack Request URL's (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` verschijnt in account-
    snapshots, is het HTTP-account geconfigureerd, maar kon de huidige runtime het
    door SecretRef ondersteunde ondertekeningsgeheim niet oplossen.

  </Accordion>

  <Accordion title="Native/slash-opdrachten worden niet uitgevoerd">
    Controleer wat je bedoelde:

    - native-opdrachtmodus (`channels.slack.commands.native: true`) met overeenkomende slash-opdrachten die in Slack zijn geregistreerd
    - of enkelvoudige slash-opdrachtmodus (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikersallowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor bijlagevisie

Slack kan gedownloade media aan de agentbeurt toevoegen wanneer Slack-bestandsdownloads slagen en de groottelimieten dit toestaan. Afbeeldingsbestanden kunnen worden doorgegeven via het pad voor mediabegrip of rechtstreeks aan een antwoordmodel met visiemogelijkheden; andere bestanden worden behouden als downloadbare bestandscontext in plaats van behandeld als afbeeldingsinvoer.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                    | Opmerkingen                                                               |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG- / PNG- / GIF- / WebP-afbeeldingen | Slack-bestands-URL | Gedownload en aan de beurt toegevoegd voor verwerking met visiemogelijkheden     | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)         |
| PDF-bestanden                  | Slack-bestands-URL   | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Slack-inbound zet PDF's niet automatisch om naar invoer voor afbeeldingsvisie |
| Andere bestanden               | Slack-bestands-URL   | Indien mogelijk gedownload en beschikbaar gemaakt als bestandscontext            | Binaire bestanden worden niet behandeld als afbeeldingsinvoer             |
| Threadantwoorden               | Bestanden van threadstarter | Rootberichtbestanden kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft | Starters met alleen bestanden gebruiken een bijlageplaceholder             |
| Berichten met meerdere afbeeldingen | Meerdere Slack-bestanden | Elk bestand wordt onafhankelijk beoordeeld                                       | Slack-verwerking is begrensd op acht bestanden per bericht                |

### Inbound-pipeline

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf de privé-URL van Slack met het bottoken (`xoxb-...`).
2. Het bestand wordt bij succes naar de mediaopslag geschreven.
3. Gedownloade mediapaden en contenttypen worden toegevoegd aan de inbound-context.
4. Model-/toolpaden die afbeeldingen ondersteunen, kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ze kunnen verwerken.

### Overerving van thread-rootbijlagen

Wanneer een bericht in een thread binnenkomt (heeft een `thread_ts`-ouder):

- Als het antwoord zelf geen directe media heeft en het meegeleverde rootbericht bestanden heeft, kan Slack de rootbestanden hydrateren als threadstartercontext.
- Directe antwoordbijlagen hebben voorrang op rootberichtbijlagen.
- Een rootbericht dat alleen bestanden en geen tekst heeft, wordt weergegeven met een bijlageplaceholder zodat de fallback de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk verwerkt via de mediapipeline.
- Gedownloade mediareferenties worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de gebeurtenispayload.
- Een mislukte download van één bijlage blokkeert de andere niet.

### Grootte-, download- en modellimieten

- **Groottelimiet**: standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: bestanden die Slack niet kan aanbieden, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en Slack-auth-/login-HTML-reacties worden overgeslagen in plaats van gerapporteerd als niet-ondersteunde formaten.
- **Visiemodel**: afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit visie ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende limieten

| Scenario                               | Huidig gedrag                                                               | Workaround                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL            | Bestand overgeslagen; geen fout weergegeven                                  | Upload het bestand opnieuw in Slack                                        |
| Visiemodel niet geconfigureerd         | Afbeeldingsbijlagen worden opgeslagen als mediareferenties, maar niet als afbeeldingen geanalyseerd | Configureer `agents.defaults.imageModel` of gebruik een antwoordmodel met visiemogelijkheden |
| Zeer grote afbeeldingen (> standaard 20 MB) | Overgeslagen volgens groottelimiet                                         | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                 |
| Doorgestuurde/gedeelde bijlagen        | Tekst en door Slack gehoste afbeeldings-/bestandsmedia zijn best-effort      | Deel opnieuw rechtstreeks in de OpenClaw-thread                            |
| PDF-bijlagen                           | Opgeslagen als bestands-/mediacontext, niet automatisch via afbeeldingsvisie gerouteerd | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse |

### Gerelateerde documentatie

- [Pipeline voor mediabegrip](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — inschakeling van Slack-bijlagevisie
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Liveverificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Slack-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van kanaal en groeps-DM.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inbound-berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Config-indeling en prioriteit.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Opdrachtcatalogus en gedrag.
  </Card>
</CardGroup>
