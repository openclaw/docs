---
read_when:
    - Slack instellen of de socket-/HTTP-modus van Slack debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode + HTTP-aanvraag-URL's)
title: Slack
x-i18n:
    generated_at: "2026-05-11T20:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e740fd5cb0ca936edce1843316cde17570d77778bdf4fc761cad77c51ee9cf
    source_path: channels/slack.md
    workflow: 16
---

Productiegereed voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP Request URL's worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelhandleidingen.
  </Card>
</CardGroup>

## Socket Mode of HTTP Request URL's kiezen

Beide transports zijn productiegereed en bieden featurepariteit voor berichten, slash-opdrachten, App Home en interactiviteit. Kies op basis van de implementatievorm, niet op basis van functies.

| Aandachtspunt               | Socket Mode (standaard)                                                               | HTTP Request URL's                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Publieke Gateway-URL        | Niet vereist                                                                          | Vereist (DNS, TLS, reverse proxy of tunnel)                                                                     |
| Uitgaand netwerk            | Uitgaande WSS naar `wss-primary.slack.com` moet bereikbaar zijn                       | Geen uitgaande WS; alleen inkomende HTTPS                                                                       |
| Benodigde tokens            | Bot-token (`xoxb-...`) + App-Level Token (`xapp-...`) met `connections:write`         | Bot-token (`xoxb-...`) + Signing Secret                                                                         |
| Dev-laptop / achter firewall | Werkt zonder extra stappen                                                            | Vereist een publieke tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) of staging-Gateway                     |
| Horizontaal schalen         | Eén Socket Mode-sessie per app per host; meerdere Gateways hebben aparte Slack-apps nodig | Stateless POST-handler; meerdere Gateway-replica's kunnen één app delen achter een load balancer                |
| Meerdere accounts op één Gateway | Ondersteund; elk account opent zijn eigen WS                                          | Ondersteund; elk account heeft een unieke `webhookPath` nodig (standaard `/slack/events`) zodat registraties niet botsen |
| Transport voor slash-opdrachten | Geleverd via de WS-verbinding; `slash_commands[].url` wordt genegeerd                 | Slack POST naar `slash_commands[].url`; het veld is vereist om de opdracht te verzenden                         |
| Ondertekening van requests  | Niet gebruikt (authenticatie is de App-Level Token)                                   | Slack ondertekent elke request; OpenClaw verifieert met `signingSecret`                                         |
| Herstel bij verbindingsuitval | Slack SDK maakt automatisch opnieuw verbinding; de pong-timeouttransportafstemming van de Gateway is van toepassing | Geen permanente verbinding die kan wegvallen; retries zijn per request vanuit Slack                             |

<Note>
  **Kies Socket Mode** voor hosts met één Gateway, dev-laptops en on-prem-netwerken die `*.slack.com` uitgaand kunnen bereiken maar geen inkomende HTTPS kunnen accepteren.

**Kies HTTP Request URL's** wanneer je meerdere Gateway-replica's achter een load balancer draait, wanneer uitgaande WSS is geblokkeerd maar inkomende HTTPS is toegestaan, of wanneer je Slack-webhooks al op een reverse proxy termineert.
</Note>

## Snelle installatie

<Tabs>
  <Tab title="Socket Mode (standaard)">
    <Steps>
      <Step title="Maak een nieuwe Slack-app">
        Open [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecteer je workspace → plak een van de onderstaande manifests → **Next** → **Create**.

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
          **Aanbevolen** komt overeen met de volledige functieset van de meegeleverde Slack-Plugin: App Home, slash-opdrachten, bestanden, reacties, pins, groeps-DM's en emoji-/gebruikersgroeplezingen. Kies **Minimaal** wanneer workspacebeleid scopes beperkt — dit dekt DM's, kanaal-/groepsgeschiedenis, vermeldingen en slash-opdrachten, maar laat bestanden, reacties, pins, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg. Zie [Manifest- en scopechecklist](#manifest-and-scope-checklist) voor de onderbouwing per scope en additieve opties zoals extra slash-opdrachten.
        </Note>

        Nadat Slack de app heeft gemaakt:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: voeg `connections:write` toe, sla op en kopieer de waarde `xapp-...`.
        - **Install App → Install to Workspace**: kopieer de `xoxb-...` Bot User OAuth Token.

      </Step>

      <Step title="Configureer OpenClaw">

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

      <Step title="Start Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URL's">
    <Steps>
      <Step title="Maak een nieuwe Slack-app">
        Open [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecteer je workspace → plak een van de onderstaande manifests → vervang `https://gateway-host.example.com/slack/events` door je publieke Gateway-URL → **Next** → **Create**.

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
          **Aanbevolen** komt overeen met de volledige functieset van de gebundelde Slack Plugin; **Minimaal** laat bestanden, reacties, pins, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg voor restrictieve werkruimten. Zie [Manifest- en scopechecklist](#manifest-and-scope-checklist) voor de reden per scope.
        </Note>

        <Info>
          De drie URL-velden (`slash_commands[].url`, `event_subscriptions.request_url` en `interactivity.request_url` / `message_menu_options_url`) verwijzen allemaal naar hetzelfde OpenClaw-eindpunt. Het manifestschema van Slack vereist dat ze afzonderlijk worden benoemd, maar OpenClaw routeert op payloadtype, dus één `webhookPath` (standaard `/slack/events`) is voldoende. Slash-commando's zonder `slash_commands[].url` voeren in HTTP-modus stilzwijgend niets uit.
        </Info>

        Nadat Slack de app heeft aangemaakt:

        - **Basic Information → App Credentials**: kopieer het **Signing Secret** voor aanvraagverificatie.
        - **Install App → Install to Workspace**: kopieer de `xoxb-...` Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Aanbevolen SecretRef-instelling:

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

        Geef elk account een eigen `webhookPath` (standaard `/slack/events`) zodat registraties niet botsen.
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

## Transportafstemming voor Socket Mode

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

Gebruik dit alleen voor Socket Mode-werkruimten die Slack websocket pong/server-ping-time-outs loggen of draaien op hosts met bekende event-loop-uithongering. `clientPingTimeout` is de wachttijd voor pong nadat de SDK een clientping verzendt; `serverPingTimeout` is de wachttijd voor Slack-serverpings. Appberichten en events blijven applicatiestatus, geen signalen voor transportlevendigheid.

## Manifest- en scopechecklist

Het basismanifest van de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het `settings`-blok (en de slash-command-`url`) verschilt.

Basemanifest (standaard Socket Mode):

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

Vervang voor **HTTP Request URLs-modus** `settings` door de HTTP-variant en voeg `url` toe aan elk slash-commando. Publieke URL vereist:

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

Toon verschillende functies die de bovenstaande standaardinstellingen uitbreiden.

Het standaardmanifest schakelt het Slack App Home-tabblad **Home** in en abonneert zich op `app_home_opened`. Wanneer een werkruimtelid het tabblad Home opent, publiceert OpenClaw een veilige standaard-Home-weergave met `views.publish`; er wordt geen gesprekspayload of privéconfiguratie opgenomen. Het tabblad **Messages** blijft ingeschakeld voor Slack-DM's.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Meerdere [native slash-commando's](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerd commando, met nuances:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat het commando `/status` gereserveerd is.
    - Er kunnen niet meer dan 25 slash-commando's tegelijk beschikbaar worden gemaakt.

    Vervang je bestaande sectie `features.slash_commands` door een subset van [beschikbare commando's](/nl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
      <Tab title="HTTP Request URLs">
        Gebruik dezelfde lijst `slash_commands` als Socket Mode hierboven, en voeg `"url": "https://gateway-host.example.com/slack/events"` toe aan elk item. Voorbeeld:

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
  <Accordion title="Optionele auteurschapsscopes (schrijfbewerkingen)">
    Voeg de botscope `chat:write.customize` toe als je wilt dat uitgaande berichten de actieve agentidentiteit gebruiken (aangepaste gebruikersnaam en pictogram) in plaats van de standaard Slack-appidentiteit.

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
    - `search:read` (als je afhankelijk bent van leesbewerkingen via Slack-zoekopdrachten)

  </Accordion>
</AccordionGroup>

## Tokenmodel

- `botToken` + `appToken` zijn vereist voor Socket Mode.
- HTTP-modus vereist `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platte-tekststrings
  of SecretRef-objecten.
- Configuratietokens overschrijven de env-terugval.
- De env-terugval `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen via configuratie beschikbaar (geen env-terugval) en gebruikt standaard alleen-lezen-gedrag (`userTokenReadOnly: true`).

Gedrag van statussnapshot:

- Slack-accountinspectie volgt per inloggegeven `*Source`- en `*Status`-
  velden (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige commando/runtime-pad
  de daadwerkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/directory-leesbewerkingen kan de gebruikerstoken de voorkeur krijgen wanneer deze is geconfigureerd. Voor schrijfbewerkingen blijft de bottoken de voorkeur houden; schrijfbewerkingen met gebruikerstoken zijn alleen toegestaan wanneer `userTokenReadOnly: false` en de bottoken niet beschikbaar is.
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

Huidige Slack-berichtacties omvatten `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` en `emoji-list`. `download-file` accepteert Slack-bestands-ID's die worden getoond in placeholders voor inkomende bestanden en retourneert afbeeldingsvoorbeelden voor afbeeldingen of lokale bestandsmetadata voor andere bestandstypen.

## Toegangsbeheer en routering

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
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (groeps-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-allowlist)

    Prioriteit bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Legacy `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder toegang te wijzigen.

    Koppelen in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaal-allowlist staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (alleen-env-installatie), valt de runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam/ID-resolutie:

    - kanaal-allowlistvermeldingen en DM-allowlistvermeldingen worden bij het opstarten opgelost wanneer tokentoegang dat toestaat
    - onopgeloste kanaalnaamvermeldingen blijven geconfigureerd maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-eerst; directe gebruikersnaam/slug-matching vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op naam gebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalopzoeking is standaard ID-eerst, dus een op naam gebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stilzwijgend geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op naam gebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Om die te vinden: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de ID (`C...`) staat aan het einde van de URL.

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

    Onjuist (stilzwijgend geblokkeerd onder `groupPolicy: "allowlist"`):

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
    Kanaalberichten vereisen standaard een vermelding.

    Bronnen voor vermeldingen:

    - expliciete app-vermelding (`<@botId>`)
    - Slack-gebruikersgroepvermelding (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Per-kanaalinstellingen (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender`-sleutelformaat: `channel:`, `id:`, `e164:`, `username:`, `name:` of wildcard `"*"`
      (legacy sleutels zonder prefix verwijzen nog steeds alleen naar `id:`)

    `allowBots` is conservatief voor kanalen en privékanalen: door bots geschreven roombberichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-allowlist van die room staat, of wanneer ten minste één expliciete Slack-eigenaar-ID uit `channels.slack.allowFrom` momenteel lid is van de room. Wildcards en vermeldingen van eigenaars met weergavenaam voldoen niet aan aanwezigheid van de eigenaar. Aanwezigheid van eigenaars gebruikt Slack `conversations.members`; zorg dat de app de bijbehorende leesscope heeft voor het roomtype (`channels:read` voor openbare kanalen, `groups:read` voor privékanalen). Als het opzoeken van leden mislukt, laat OpenClaw het door een bot geschreven roombbericht vallen.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindingen accepteren ruwe peer-ID's plus Slack-doelformulieren zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met standaard `session.dmScope=main` worden Slack-DM's samengevoegd tot de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen waar van toepassing threadsessie-achtervoegsels maken (`:thread:<threadTs>`).
- In kanalen waar OpenClaw top-level berichten afhandelt zonder een expliciete vermelding te vereisen, routeert een niet-`off` `replyToMode` elke afgehandelde root naar `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, zodat de zichtbare Slack-thread vanaf de eerste beurt naar één OpenClaw-sessie wordt gemapt.
- De standaard voor `channels.slack.thread.historyScope` is `thread`; de standaard voor `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel in op `0` om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, onderdrukt impliciete threadvermeldingen zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-gate.

Instellingen voor antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- legacy terugval voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Voor expliciete Slack-threadantwoorden vanuit de `message`-tool stel je `replyBroadcast: true` in met `action: "send"` en `threadId` of `replyTo` om Slack te vragen het threadantwoord ook naar het bovenliggende kanaal uit te zenden. Dit mappt naar de `reply_broadcast`-vlag van Slack `chat.postMessage` en wordt alleen ondersteund voor tekst- of Block Kit-verzendingen, niet voor media-uploads.

Wanneer een `message`-toolaanroep binnen een Slack-thread draait en hetzelfde kanaal target, erft OpenClaw normaal gesproken de huidige Slack-thread volgens `replyToMode`. Stel `topLevel: true` in op `action: "send"` of `action: "upload-file"` om in plaats daarvan een nieuw bericht in het bovenliggende kanaal af te dwingen. `threadId: null` wordt geaccepteerd als dezelfde top-level opt-out.

<Note>
`replyToMode="off"` schakelt **alle** antwoordthreading in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gehonoreerd in `"off"`-modus. Slack-threads verbergen berichten uit het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` stuurt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- emoji-terugval voor agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

## Tekststreaming

`channels.slack.streaming` beheert livevoorbeeldgedrag:

- `off`: schakel livevoorbeeldstreaming uit.
- `partial` (standaard): vervang voorbeeldtekst door de nieuwste gedeeltelijke uitvoer.
- `block`: voeg preview-updates in chunks toe.
- `progress`: toon voortgangsstatustekst tijdens het genereren en stuur daarna de definitieve tekst.
- `streaming.preview.toolProgress`: wanneer conceptvoorbeeld actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht (standaard: `true`). Stel in op `false` om afzonderlijke tool-/voortgangsberichten te behouden.
- `streaming.preview.commandText` / `streaming.progress.commandText`: stel in op `status` om compacte toolvoortgangsregels te behouden terwijl ruwe command-/exec-tekst wordt verborgen (standaard: `raw`).

Verberg ruwe command-/exec-tekst terwijl compacte voortgangsregels behouden blijven:

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

`channels.slack.streaming.nativeTransport` beheert Slack-native tekststreaming wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn voordat native tekststreaming en de Slack-assistentthreadstatus kunnen verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal-, groepschat- en DM-roots op topniveau kunnen nog steeds de normale conceptpreview gebruiken wanneer native streaming niet beschikbaar is of er geen antwoordthread bestaat.
- Slack-DM's op topniveau blijven standaard buiten threads, dus ze tonen geen Slack-native stream-/statuspreview in threadstijl; OpenClaw plaatst en bewerkt in plaats daarvan een conceptpreview in de DM.
- Media en niet-tekstpayloads vallen terug op normale levering.
- Media-/foutfinals annuleren wachtende previewbewerkingen; geschikte tekst-/blokfinals worden alleen geflusht wanneer ze de preview op dezelfde plek kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale levering voor resterende payloads.

Gebruik conceptpreview in plaats van Slack-native tekststreaming:

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
- Voer `openclaw doctor --fix` uit om opgeslagen Slack-streamingconfiguratie naar de canonieke sleutels te herschrijven.

## Fallback voor typreactie

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de uitvoering klaar is. Dit is vooral nuttig buiten threadantwoorden, die een standaardstatusindicator "is typing..." gebruiken.

Oplossingsvolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opruimen wordt automatisch geprobeerd nadat het antwoord of het foutpad is voltooid.

## Media, chunking en levering

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload vanaf door Slack gehoste privé-URL's (token-geauthenticeerde aanvraagflow) en naar de mediaopslag geschreven wanneer ophalen slaagt en groottelimieten dit toestaan. Bestandsplaceholders bevatten de Slack-`fileId`, zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde idle- en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandsplaceholder.

    De runtimegroottelimiet voor inkomende bestanden is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstchunks gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt paragraaf-eerst splitsen in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden bevatten (`thread_ts`)
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Leveringsdoelen">
    Expliciete voorkeursdoelen:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst/blokken kunnen rechtstreeks naar gebruikers-ID's posten; bestandsuploads en threadverzendingen openen eerst de DM via Slack-conversatie-API's, omdat die paden een concreet conversatie-ID vereisen.

  </Accordion>
</AccordionGroup>

## Commands en slashgedrag

Slash-commands verschijnen in Slack als één geconfigureerde command of als meerdere native commands. Configureer `channels.slack.slashCommand` om commandstandaarden te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commands vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true` in globale configuraties.

- Native command automodus is **uit** voor Slack, dus `commands.native: "auto"` schakelt Slack-native commands niet in.

```txt
/help
```

Native argumentmenu's gebruiken een adaptieve renderingstrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: knopblokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met asynchrone optiefiltering wanneer interactiviteitsoptiehandlers beschikbaar zijn
- overschreden Slack-limieten: gecodeerde optiewaarden vallen terug op knoppen

```txt
/think
```

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren commanduitvoeringen nog steeds naar de doelconversatiesessie met `CommandTargetSessionKey`.

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

Of schakel het alleen in voor één Slack-account:

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

Wanneer dit is ingeschakeld, kunnen agenten antwoordrichtlijnen uitsturen die alleen voor Slack gelden:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze richtlijnen worden gecompileerd naar Slack Block Kit en sturen klikken of selecties terug via het bestaande gebeurtenispad voor Slack-interacties.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-richtlijnen niet naar hun eigen knoppensystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen ruwe waarden die door agenten zijn geschreven.
- Als gegenereerde interactieve blokken de limieten van Slack Block Kit zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blokkenpayload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan optreden als native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de Web-UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native routering naar DM/kanaal.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden afgehandeld wanneer het verzoek al in Slack terechtkomt en het soort goedkeurings-id `plugin:` is.
- Autorisatie van goedkeurders wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen verzoeken via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in je Slack-appinstellingen, worden goedkeuringsprompts direct in het gesprek weergegeven als Block Kit-knoppen.
Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat aangeeft dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één
goedkeurder wordt opgelost. Stel `enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient.
Stel `enabled: true` in om native goedkeuringen af te dwingen wanneer goedkeurders worden opgelost.

Standaardgedrag zonder expliciete configuratie voor Slack-exec-goedkeuringen:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
wilt kiezen voor levering via de oorsprongschat:

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

Gedeelde `approvals.exec`-doorsturing staat hier los van. Gebruik dit alleen wanneer prompts voor exec-goedkeuringen ook
naar andere chats of expliciete out-of-band doelen moeten worden gerouteerd. Gedeelde `approvals.plugin`-doorsturing staat hier ook
los van; Slack-native knoppen kunnen nog steeds Plugin-goedkeuringen afhandelen wanneer die verzoeken al
in Slack terechtkomen.

`/approve` in dezelfde chat werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige model voor goedkeuringsdoorsturing.

## Gebeurtenissen en operationeel gedrag

- Berichtenbewerkingen/-verwijderingen worden toegewezen aan systeemgebeurtenissen.
- Thread-uitzendingen ("Ook naar kanaal verzenden" bij thread-antwoorden) worden verwerkt als normale gebruikersberichten.
- Gebeurtenissen voor het toevoegen/verwijderen van reacties worden toegewezen aan systeemgebeurtenissen.
- Gebeurtenissen voor lid toetreden/verlaten, kanaal aangemaakt/hernoemd en pin toevoegen/verwijderen worden toegewezen aan systeemgebeurtenissen.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Threadstarter en initiële contextvulling voor threadgeschiedenis worden, waar van toepassing, gefilterd op basis van geconfigureerde afzender-allowlists.
- Blokacties en modale interacties geven gestructureerde systeemgebeurtenissen `Slack interaction: ...` uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modale `view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="Signaalrijke Slack-velden">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (verouderd: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodschakelaar; laat uit tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threads/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ontvouwingen: `unfurlLinks`, `unfurlMedia` voor beheer van link-/mediavoorbeelden van `chat.postMessage`
- ops/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Geen antwoorden in kanalen">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-id's zijn** (`C12345678`), geen namen (`#channel-name`). Op naam gebaseerde sleutels falen stil onder `groupPolicy: "allowlist"` omdat kanaalroutering standaard eerst op id gebeurt. Een id vinden: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de `C...`-waarde aan het einde van de URL is het kanaal-id.
    - `requireMention`
    - allowlist voor `users` per kanaal

    Nuttige opdrachten:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-berichten genegeerd">
    Controleer:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (of verouderd `channels.slack.dm.policy`)
    - koppelingsgoedkeuringen / allowlist-vermeldingen
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis heeft verzonden zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode maakt geen verbinding">
    Valideer bot- en app-tokens en inschakeling van Socket Mode in Slack-appinstellingen.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd, maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet oplossen.

  </Accordion>

  <Accordion title="HTTP-modus ontvangt geen events">
    Valideer:

    - ondertekeningsgeheim
    - webhookpad
    - Slack-aanvraag-URL's (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` verschijnt in account-
    snapshots, is het HTTP-account geconfigureerd, maar kon de huidige runtime het
    door SecretRef ondersteunde ondertekeningsgeheim niet vinden.

  </Accordion>

  <Accordion title="Native/slash-commando's worden niet geactiveerd">
    Controleer of je het volgende bedoelde:

    - native command-modus (`channels.slack.commands.native: true`) met overeenkomende slash-commando's geregistreerd in Slack
    - of single slash command-modus (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikersallowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor bijlagevision

Slack kan gedownloade media aan de agent-turn toevoegen wanneer Slack-bestandsdownloads slagen en de groottelimieten dit toestaan. Afbeeldingsbestanden kunnen via het pad voor mediabegrip worden doorgegeven of rechtstreeks aan een vision-capabel antwoordmodel; andere bestanden worden behouden als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                    | Opmerkingen                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP-afbeeldingen | Slack-bestands-URL | Gedownload en aan de turn toegevoegd voor vision-capabele verwerking             | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)         |
| PDF-bestanden                  | Slack-bestands-URL   | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Inkomend Slack converteert PDF's niet automatisch naar invoer voor afbeelding-vision |
| Andere bestanden               | Slack-bestands-URL   | Waar mogelijk gedownload en beschikbaar gemaakt als bestandscontext              | Binaire bestanden worden niet als afbeeldingsinvoer behandeld             |
| Thread-antwoorden              | Bestanden van threadstarter | Bestanden van het rootbericht kunnen als context worden geladen wanneer het antwoord geen directe media heeft | Starters met alleen bestanden gebruiken een tijdelijke bijlageaanduiding  |
| Berichten met meerdere afbeeldingen | Meerdere Slack-bestanden | Elk bestand wordt onafhankelijk beoordeeld                                      | Slack-verwerking is beperkt tot acht bestanden per bericht                |

### Inkomende pipeline

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf de privé-URL van Slack met de bot-token (`xoxb-...`).
2. Bij succes wordt het bestand naar de mediaopslag geschreven.
3. Gedownloade mediapaden en contenttypen worden aan de inkomende context toegevoegd.
4. Model-/toolpaden die afbeeldingen ondersteunen, kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ermee kunnen omgaan.

### Overerving van bijlagen van thread-root

Wanneer een bericht binnenkomt in een thread (heeft een `thread_ts`-ouder):

- Als het antwoord zelf geen directe media heeft en het opgenomen rootbericht bestanden heeft, kan Slack de rootbestanden als threadstarter-context laden.
- Directe antwoordbijlagen hebben voorrang op bijlagen van het rootbericht.
- Een rootbericht dat alleen bestanden en geen tekst heeft, wordt weergegeven met een tijdelijke bijlageaanduiding, zodat de fallback de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer een enkel Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk via de mediapipeline verwerkt.
- Gedownloade mediareferenties worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de event-payload.
- Een fout bij het downloaden van één bijlage blokkeert andere niet.

### Grootte-, download- en modellimieten

- **Groottelimiet**: standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: bestanden die Slack niet kan leveren, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en Slack-auth-/login-HTML-antwoorden worden overgeslagen in plaats van te worden gerapporteerd als niet-ondersteunde indelingen.
- **Vision-model**: afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit vision ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende limieten

| Scenario                               | Huidig gedrag                                                               | Workaround                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL            | Bestand overgeslagen; geen fout weergegeven                                 | Upload het bestand opnieuw in Slack                                        |
| Vision-model niet geconfigureerd       | Afbeeldingsbijlagen worden opgeslagen als mediareferenties, maar niet als afbeeldingen geanalyseerd | Configureer `agents.defaults.imageModel` of gebruik een vision-capabel antwoordmodel |
| Zeer grote afbeeldingen (> 20 MB standaard) | Overgeslagen volgens de groottelimiet                                    | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                 |
| Doorgestuurde/gedeelde bijlagen        | Tekst en door Slack gehoste afbeeldings-/bestandsmedia worden naar beste vermogen verwerkt | Deel opnieuw rechtstreeks in de OpenClaw-thread                            |
| PDF-bijlagen                           | Opgeslagen als bestands-/mediacontext, niet automatisch via afbeelding-vision gerouteerd | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse |

### Gerelateerde documentatie

- [Pipeline voor mediabegrip](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — inschakeling van Slack-bijlagevision
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-verificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Slack-gebruiker aan de Gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van kanalen en groeps-DM's.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en verharding.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Config-indeling en prioriteit.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Commandocatalogus en gedrag.
  </Card>
</CardGroup>
