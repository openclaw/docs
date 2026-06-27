---
read_when:
    - Slack instellen of Slack-socket-, HTTP- of relaymodus debuggen
summary: Slack-installatie en runtimegedrag (Socket Mode, HTTP-aanvraag-URL's en relaymodus)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Productieklaar voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP Request-URL's worden ook ondersteund. Relay-modus is bedoeld voor beheerde deployments waarbij een vertrouwde router Slack-ingress beheert.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en reparatieplaybooks.
  </Card>
</CardGroup>

## Socket Mode of HTTP Request-URL's kiezen

Beide transports zijn productieklaar en bereiken feature parity voor messaging, slash commands, App Home en interactiviteit. Kies op basis van deploymentvorm, niet op basis van features.

| Aandachtspunt                | Socket Mode (standaard)                                                                                                                              | HTTP Request-URL's                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Publieke Gateway-URL         | Niet vereist                                                                                                                                         | Vereist (DNS, TLS, reverse proxy of tunnel)                                                                    |
| Uitgaand netwerk             | Uitgaande WSS naar `wss-primary.slack.com` moet bereikbaar zijn                                                                                      | Geen uitgaande WS; alleen inkomende HTTPS                                                                      |
| Benodigde tokens             | Bottoken + App-Level Token met `connections:write`                                                                                                   | Bottoken + Signing Secret                                                                                      |
| Dev-laptop / achter firewall | Werkt zonder verdere aanpassingen                                                                                                                    | Heeft een publieke tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) of staging-Gateway nodig                |
| Horizontaal schalen          | Eén Socket Mode-sessie per app per host; meerdere Gateways hebben afzonderlijke Slack-apps nodig                                                     | Stateless POST-handler; meerdere Gateway-replica's kunnen één app achter een load balancer delen               |
| Meerdere accounts op één Gateway | Ondersteund; elk account opent zijn eigen WS                                                                                                     | Ondersteund; elk account heeft een unieke `webhookPath` nodig (standaard `/slack/events`) zodat registraties niet botsen |
| Slash command-transport      | Geleverd via de WS-verbinding; `slash_commands[].url` wordt genegeerd                                                                                | Slack POST naar `slash_commands[].url`; veld is vereist om de opdracht te dispatchen                           |
| Request signing              | Niet gebruikt (auth is de App-Level Token)                                                                                                          | Slack ondertekent elk verzoek; OpenClaw verifieert met `signingSecret`                                         |
| Herstel bij verbindingsuitval | Automatisch opnieuw verbinden van de Slack-SDK is ingeschakeld; OpenClaw herstart mislukte Socket Mode-sessies ook met begrensde backoff. Transporttuning voor pong-time-outs is van toepassing. | Geen persistente verbinding die kan wegvallen; retries gebeuren per verzoek vanuit Slack                       |

<Note>
  **Kies Socket Mode** voor hosts met één Gateway, dev-laptops en on-prem-netwerken die `*.slack.com` uitgaand kunnen bereiken maar geen inkomende HTTPS kunnen accepteren.

**Kies HTTP Request-URL's** wanneer je meerdere Gateway-replica's achter een load balancer uitvoert, wanneer uitgaande WSS geblokkeerd is maar inkomende HTTPS is toegestaan, of wanneer je Slack-webhooks al op een reverse proxy termineert.
</Note>

### Relay-modus

Relay-modus scheidt Slack-ingress van de OpenClaw-gateway. Een vertrouwde router beheert de
enkele Slack Socket Mode-verbinding, kiest een doelgateway en stuurt een getypeerde
event door via een geauthenticeerde websocket. De gateway blijft zijn bottoken gebruiken voor
uitgaande Slack Web API-aanroepen.

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

De relay-URL moet `wss://` gebruiken, tenzij deze naar localhost verwijst. Behandel het bearer-token en
de routeertabel van de router als onderdeel van de Slack-autorisatiegrens: gerouteerde events komen de
normale Slack-berichthandler binnen als geautoriseerde activaties. Een door de router geleverde `slack_identity`
in het websocket-`hello`-frame kan de standaard uitgaande gebruikersnaam en het pictogram instellen; een expliciete
identiteit die door de caller wordt geleverd, wint nog steeds. De relay-verbinding maakt opnieuw verbinding met dezelfde
begrensde backoff-timing die door Socket Mode wordt gebruikt en wist de door de router geleverde identiteit telkens wanneer
de verbinding wordt verbroken.

## Installeren

Installeer Slack voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registreert en activeert de Plugin. De Plugin doet nog steeds niets totdat je de Slack-app en kanaalinstellingen hieronder configureert. Zie [Plugins](/nl/tools/plugin) voor algemeen Plugin-gedrag en installatieregels.

## Snelle configuratie

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
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
          **Recommended** komt overeen met de volledige featureset van de Slack-Plugin: App Home, slash commands, bestanden, reacties, pins, groeps-DM's en emoji-/gebruikersgroepleestoegang. Kies **Minimal** wanneer workspacebeleid scopes beperkt — dit dekt DM's, kanaal-/groepsgeschiedenis, vermeldingen en slash commands, maar laat bestanden, reacties, pins, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg. Zie [Checklist voor manifest en scopes](#manifest-and-scope-checklist) voor de rationale per scope en additieve opties zoals extra slash commands.
        </Note>

        Nadat Slack de app heeft gemaakt:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: voeg `connections:write` toe, sla op en kopieer de App-Level Token.
        - **Install App -> Install to Workspace**: kopieer de Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Aanbevolen SecretRef-configuratie:

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

        Env-fallback (alleen standaardaccount):

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

  <Tab title="HTTP-aanvraag-URL's">
    <Steps>
      <Step title="Een nieuwe Slack-app maken">
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
          **Aanbevolen** komt overeen met de volledige functieset van de Slack-Plugin; **Minimaal** laat bestanden, reacties, pins, groeps-DM (`mpim:*`), `emoji:read` en `usergroups:read` weg voor restrictieve workspaces. Zie [Manifest- en scope-checklist](#manifest-and-scope-checklist) voor de reden per scope.
        </Note>

        <Info>
          De drie URL-velden (`slash_commands[].url`, `event_subscriptions.request_url` en `interactivity.request_url` / `message_menu_options_url`) verwijzen allemaal naar hetzelfde OpenClaw-eindpunt. Het manifestschema van Slack vereist dat ze afzonderlijk worden benoemd, maar OpenClaw routeert op payloadtype, dus één `webhookPath` (standaard `/slack/events`) is voldoende. Slash commands zonder `slash_commands[].url` doen in HTTP-modus stilzwijgend niets.
        </Info>

        Nadat Slack de app heeft gemaakt:

        - **Basisinformatie → Appreferenties**: kopieer het **Signing Secret** voor aanvraagverificatie.
        - **App installeren -> Installeren in workspace**: kopieer het Bot User OAuth Token.

      </Step>

      <Step title="OpenClaw configureren">

        Aanbevolen SecretRef-configuratie:

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
        Gebruik unieke Webhook-paden voor HTTP met meerdere accounts

        Geef elk account een eigen `webhookPath` (standaard `/slack/events`), zodat registraties niet botsen.
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

OpenClaw stelt de pong-time-out van de Slack SDK-client standaard in op 15 seconden voor Socket Mode. Overschrijf de transportinstellingen alleen wanneer je workspace- of hostspecifieke afstemming nodig hebt:

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

Gebruik dit alleen voor Socket Mode-workspaces die Slack websocket pong/server-ping-time-outs loggen of draaien op hosts met bekende event-loop starvation. `clientPingTimeout` is de wachttijd op pong nadat de SDK een client-ping heeft verzonden; `serverPingTimeout` is de wachttijd op Slack-serverpings. Appberichten en events blijven applicatiestatus, geen signalen voor transport-liveness.

Opmerkingen:

- `socketMode` wordt genegeerd in HTTP Request URL-modus.
- Basisinstellingen voor `channels.slack.socketMode` gelden voor alle Slack-accounts tenzij ze worden overschreven. Overrides per account gebruiken `channels.slack.accounts.<accountId>.socketMode`; omdat dit een object-override is, moet je elk socketafstemmingsveld opnemen dat je voor dat account wilt.
- Alleen `clientPingTimeout` heeft een OpenClaw-standaardwaarde (`15000`). `serverPingTimeout` en `pingPongLoggingEnabled` worden alleen aan de Slack SDK doorgegeven wanneer ze zijn geconfigureerd.
- Restart-backoff voor Socket Mode begint rond 2 seconden en wordt begrensd rond 30 seconden. Herstelbare start-, start-wait- en disconnect-fouten proberen opnieuw totdat het kanaal stopt. Permanente account- en referentiefouten zoals ongeldige auth, ingetrokken tokens of ontbrekende scopes falen snel in plaats van eindeloos opnieuw te proberen.

## Manifest- en scope-checklist

Het basismanifest voor de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het blok `settings` (en de slash command-`url`) verschilt.

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

Voor **HTTP Request URLs-modus** vervang je `settings` door de HTTP-variant en voeg je `url` toe aan elke slash command. Openbare URL vereist:

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

### Aanvullende manifestinstellingen

Toon verschillende functies die de bovenstaande standaarden uitbreiden.

Het standaardmanifest schakelt het Slack App Home-tabblad **Home** in en abonneert zich op `app_home_opened`. Wanneer een werkruimtelid het tabblad Home opent, publiceert OpenClaw een veilige standaardweergave voor Home met `views.publish`; er wordt geen gesprekspayload of privéconfiguratie opgenomen. Het tabblad **Messages** blijft ingeschakeld voor Slack-DM's. Het manifest schakelt ook Slack-assistentthreads in met `features.assistant_view`, `assistant:write`, `assistant_thread_started` en `assistant_thread_context_changed`; assistentthreads worden naar hun eigen OpenClaw-threadsessies gerouteerd en houden door Slack geleverde threadcontext beschikbaar voor de agent.

<AccordionGroup>
  <Accordion title="Optionele native slash commands">

    Meerdere [native slash commands](#commands-and-slash-behavior) kunnen met nuance worden gebruikt in plaats van één geconfigureerde opdracht:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat de opdracht `/status` is gereserveerd.
    - Er kunnen niet meer dan 25 slash commands tegelijk beschikbaar worden gemaakt.

    Vervang je bestaande sectie `features.slash_commands` door een subset van [beschikbare opdrachten](/nl/tools/slash-commands#command-list):

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
      <Tab title="HTTP Request-URL's">
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

        Herhaal die `url`-waarde voor elke opdracht in de lijst.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionele auteurschapsscopes (schrijfbewerkingen)">
    Voeg de botscope `chat:write.customize` toe als je wilt dat uitgaande berichten de actieve agentidentiteit gebruiken (aangepaste gebruikersnaam en pictogram) in plaats van de standaardidentiteit van de Slack-app.

    Als je een emoji-pictogram gebruikt, verwacht Slack de syntaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionele gebruikerstokenscopes (leesbewerkingen)">
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
- Relay-modus vereist `botToken` plus `relay.url`, `relay.authToken` en `relay.gatewayId`; deze gebruikt geen apptoken of ondertekeningsgeheim.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` en `userToken` accepteren plattetekststrings
  of SecretRef-objecten.
- Configuratietokens overschrijven env-fallback.
- Env-fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` is alleen van toepassing op het standaardaccount.
- `userToken` is alleen configuratie (geen env-fallback) en gebruikt standaard alleen-lezen gedrag (`userTokenReadOnly: true`).

Gedrag van statussnapshot:

- Slack-accountinspectie houdt per referentie `*Source`- en `*Status`-velden bij
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige opdracht-/runtimepad
  de werkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/directoryleesacties kan de voorkeur uitgaan naar een gebruikerstoken wanneer dit is geconfigureerd. Voor schrijfacties blijft het bottoken de voorkeur hebben; schrijven met gebruikerstoken is alleen toegestaan wanneer `userTokenReadOnly: false` en het bottoken niet beschikbaar is.
</Tip>

## Acties en poorten

Slack-acties worden beheerd door `channels.slack.actions.*`.

Beschikbare actiegroepen in de huidige Slack-tooling:

| Groep      | Standaard |
| ---------- | --------- |
| messages   | ingeschakeld |
| reactions  | ingeschakeld |
| pins       | ingeschakeld |
| memberInfo | ingeschakeld |
| emojiList  | ingeschakeld |

Huidige Slack-berichtacties omvatten `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` en `emoji-list`. `download-file` accepteert Slack-bestands-ID's die in binnenkomende bestandsplaceholders worden weergegeven en retourneert afbeeldingsvoorbeelden voor afbeeldingen of lokale bestandsmetadata voor andere bestandstypen.

## Toegangscontrole en routering

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` regelt DM-toegang. `channels.slack.allowFrom` is de canonieke DM-allowlist.

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

    Voorrangsregels voor meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Legacy `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden voor compatibiliteit nog gelezen. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    Koppelen in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` regelt kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaal-allowlist staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (setup alleen via env), valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam/ID-resolutie:

    - kanaal-allowlistvermeldingen en DM-allowlistvermeldingen worden bij het opstarten resolved wanneer tokentoegang dit toestaat
    - niet-resolved kanaalnaamvermeldingen blijven geconfigureerd, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-first; directe matching op gebruikersnaam/slug vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op namen gebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalzoekactie is standaard ID-first, dus een op namen gebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stilzwijgend geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op namen gebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Zo vindt u die: klik met de rechtermuisknop op het kanaal in Slack → **Copy link** — de ID (`C...`) staat aan het einde van de URL.

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

  <Tab title="Mentions and channel users">
    Kanaalberichten vereisen standaard een vermelding.

    Bronnen voor vermeldingen:

    - expliciete app-vermelding (`<@botId>`)
    - Slack-gebruikersgroepvermelding (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet gedrag voor reply-to-bot-threads (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Besturing per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - sleutelindeling voor `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, of wildcard `"*"`
      (legacy sleutels zonder prefix worden nog steeds alleen naar `id:` gemapt)

    `allowBots` is conservatief voor kanalen en privékanalen: door bots geschreven ruimteberichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-allowlist van die ruimte staat, of wanneer ten minste één expliciete Slack-eigenaar-ID uit `channels.slack.allowFrom` momenteel lid is van de ruimte. Wildcards en eigenaaritems op basis van weergavenaam voldoen niet aan aanwezigheid van een eigenaar. Aanwezigheid van een eigenaar gebruikt Slack `conversations.members`; zorg dat de app de bijpassende lees-scope heeft voor het ruimtetype (`channels:read` voor openbare kanalen, `groups:read` voor privékanalen). Als het opzoeken van leden mislukt, laat OpenClaw het door een bot geschreven ruimtebericht vallen.

    Geaccepteerde door bots geschreven Slack-berichten gebruiken gedeelde [bot-loopbeveiliging](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` voor het standaardbudget en overschrijf daarna met `channels.slack.botLoopProtection` of `channels.slack.channels.<id>.botLoopProtection` wanneer een workspace of kanaal een andere limiet nodig heeft.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindingen accepteren ruwe peer-ID's plus Slack-doelvormen zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met de standaardinstelling `session.dmScope=main` vallen Slack-DM's samen in de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Gewone kanaalberichten op topniveau blijven op de sessie per kanaal, zelfs wanneer `replyToMode` niet `off` is.
- Slack-threadantwoorden gebruiken de bovenliggende Slack `thread_ts` voor sessiesuffixen (`:thread:<threadTs>`), zelfs wanneer uitgaande antwoordthreads zijn uitgeschakeld met `replyToMode="off"`.
- OpenClaw seedt een geschikte kanaalroot op topniveau in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` wanneer van die root wordt verwacht dat deze een zichtbare Slack-thread start, zodat de root en latere threadantwoorden één OpenClaw-sessie delen. Dit geldt voor `app_mention`-events, expliciete botmatches of geconfigureerde mention-pattern-matches, en kanalen met `requireMention: false` met een niet-`off` `replyToMode`.
- De standaardwaarde van `channels.slack.thread.historyScope` is `thread`; de standaardwaarde van `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel in op `0` om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, onderdrukt dit impliciete threadmentions zodat de bot alleen reageert op expliciete `@bot`-mentions binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-poort.

Besturing van antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- verouderde fallback voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Voor expliciete Slack-threadantwoorden vanuit de `message`-tool stel je `replyBroadcast: true` in met `action: "send"` en `threadId` of `replyTo` om Slack te vragen het threadantwoord ook naar het bovenliggende kanaal te broadcasten. Dit wordt gekoppeld aan de Slack `chat.postMessage`-vlag `reply_broadcast` en wordt alleen ondersteund voor tekst- of Block Kit-verzendingen, niet voor media-uploads.

Wanneer een `message`-toolcall binnen een Slack-thread draait en hetzelfde kanaal target, erft OpenClaw normaal gesproken de huidige Slack-thread volgens `replyToMode`. Stel `topLevel: true` in op `action: "send"` of `action: "upload-file"` om in plaats daarvan een nieuw bericht in het bovenliggende kanaal af te dwingen. `threadId: null` wordt geaccepteerd als dezelfde opt-out naar topniveau.

<Note>
`replyToMode="off"` schakelt uitgaande Slack-antwoordthreads uit, inclusief expliciete `[[reply_to_*]]`-tags. Het vlakt inkomende Slack-threadsessies niet af: berichten die al binnen een Slack-thread zijn geplaatst, routeren nog steeds naar de sessie `:thread:<threadTs>`. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gehonoreerd in de modus `"off"`. Slack-threads verbergen berichten uit het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt. `ackReactionScope` bepaalt _wanneer_ die emoji daadwerkelijk wordt verzonden.

### Emoji (`ackReaction`)

Volgorde van resolutie:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders `"eyes"` / 👀)

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

### Scope (`messages.ackReactionScope`)

De Slack-provider leest de scope uit `messages.ackReactionScope` (standaard `"group-mentions"`). Er is vandaag geen override op Slack-account- of Slack-kanaalniveau; de waarde is globaal voor de Gateway.

Waarden:

- `"all"`: reageer in DM's en groepen.
- `"direct"`: reageer alleen in DM's.
- `"group-all"`: reageer op elk groepsbericht (geen DM's).
- `"group-mentions"` (standaard): reageer in groepen, maar alleen wanneer de bot wordt genoemd (of in groepsmentionables die zich hebben aangemeld). **DM's zijn uitgesloten.**
- `"off"` / `"none"`: reageer nooit.

<Note>
De standaard-scope (`"group-mentions"`) activeert geen ack-reacties in directe berichten. Stel `messages.ackReactionScope` in op `"direct"` of `"all"` om de geconfigureerde `ackReaction` (bijvoorbeeld `"eyes"`) te zien op inkomende Slack-DM's. `messages.ackReactionScope` wordt gelezen bij het starten van de Slack-provider, dus een Gateway-herstart is nodig voordat de wijziging van kracht wordt.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Tekststreaming

`channels.slack.streaming` bestuurt het gedrag van live previews:

- `off`: schakel live-previewstreaming uit.
- `partial` (standaard): vervang previewtekst door de nieuwste gedeeltelijke uitvoer.
- `block`: voeg preview-updates in chunks toe.
- `progress`: toon voortgangsstatustekst tijdens het genereren en verzend daarna de definitieve tekst.
- `streaming.preview.toolProgress`: wanneer conceptpreview actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte previewbericht (standaard: `true`). Stel in op `false` om aparte tool-/voortgangsberichten te behouden.
- `streaming.preview.commandText` / `streaming.progress.commandText`: stel in op `status` om compacte tool-voortgangsregels te behouden terwijl ruwe command-/exec-tekst wordt verborgen (standaard: `raw`).

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

`channels.slack.streaming.nativeTransport` bestuurt Slack-native tekststreaming wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

Slack-native taak-kaarten voor voortgang zijn opt-in voor de voortgangsmodus. Stel `channels.slack.streaming.progress.nativeTaskCards` in op `true` met `channels.slack.streaming.mode="progress"` om een Slack-native plan-/taakkaart te verzenden terwijl werk wordt uitgevoerd, en werk daarna dezelfde taakkaart bij bij voltooiing. Zonder deze vlag behoudt de voortgangsmodus het draagbare conceptpreviewgedrag.

- Er moet een antwoordthread beschikbaar zijn voordat native tekststreaming en Slack-assistentthreadstatus kunnen verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal-, groepschat- en DM-roots op topniveau kunnen nog steeds de normale conceptpreview gebruiken wanneer native streaming niet beschikbaar is of er geen antwoordthread bestaat.
- Slack-DM's op topniveau blijven standaard buiten threads, dus ze tonen Slack's native stream-/statuspreview in threadstijl niet; OpenClaw plaatst en bewerkt in plaats daarvan een conceptpreview in de DM.
- Media en niet-tekstpayloads vallen terug op normale levering.
- Definitieve media-/foutberichten annuleren wachtende previewbewerkingen; geschikte definitieve tekst-/blokberichten flushen alleen wanneer ze de preview op zijn plaats kunnen bewerken.
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

Meld je aan voor Slack-native taak-kaarten voor voortgang:

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

Verouderde sleutels:

- `channels.slack.streamMode` (`replace | status_final | append`) is een verouderde runtime-alias voor `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` is een verouderde runtime-alias voor `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- verouderde `channels.slack.nativeStreaming` is een runtime-alias voor `channels.slack.streaming.nativeTransport`.
- Voer `openclaw doctor --fix` uit om opgeslagen Slack-streamingconfiguratie te herschrijven naar de canonieke sleutels.

## Fallback voor typreactie

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run eindigt. Dit is het nuttigst buiten threadantwoorden, die een standaardstatusindicator "is typing..." gebruiken.

Volgorde van resolutie:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opschonen wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en levering

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload van door Slack gehoste privé-URL's (token-geauthenticeerde requestflow) en naar de mediaopslag geschreven wanneer ophalen slaagt en groottebeperkingen dit toestaan. Bestandsplaceholders bevatten de Slack `fileId` zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde idle- en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandsplaceholder.

    De runtime-limiet voor inkomende grootte is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstchunks gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt splitsing per alinea eerst in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden bevatten (`thread_ts`)
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Leveringsdoelen">
    Voorkeursdoelen bij expliciete opgave:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst/blokken kunnen rechtstreeks naar gebruikers-ID's posten; bestandsuploads en threadverzendingen openen eerst de DM via Slack-conversation-API's, omdat die paden een concreet conversation-ID vereisen.

  </Accordion>
</AccordionGroup>

## Commands en slashgedrag

Slashcommands verschijnen in Slack als één geconfigureerde command of als meerdere native commands. Configureer `channels.slack.slashCommand` om commandstandaarden te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commands vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true` in globale configuraties.

- Native command-automodus staat **uit** voor Slack, dus `commands.native: "auto"` schakelt Slack-native commands niet in.

```txt
/help
```

Native argumentmenu's gebruiken een adaptieve renderstrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: button-blokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met asynchrone optiefiltering wanneer handlers voor interactiviteitsopties beschikbaar zijn
- overschreden Slack-limieten: gecodeerde optiewaarden vallen terug op buttons

```txt
/think
```

Slash-sessies gebruiken geisoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren opdrachtuitvoeringen nog steeds naar de doelgesprekssessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan door agents gemaakte interactieve antwoordknoppen weergeven, maar deze functie is standaard uitgeschakeld.
Voor nieuwe agent-, CLI- en Plugin-uitvoer geeft u de voorkeur aan de gedeelde
`presentation`-knoppen of selectieblokken. Ze gebruiken hetzelfde Slack-interactiepad
en degraderen tegelijk op andere kanalen.

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

Of schakel dit alleen voor een Slack-account in:

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

Wanneer dit is ingeschakeld, kunnen agents nog steeds verouderde Slack-only antwoordrichtlijnen uitsturen:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze richtlijnen worden gecompileerd naar Slack Block Kit en routeren klikken of selecties
terug via het bestaande Slack-interactiegebeurtenispad. Behoud ze voor oude
prompts en Slack-specifieke uitwegen; gebruik gedeelde presentatie voor nieuwe
draagbare besturingselementen.

De API's van de richtlijncompiler zijn ook verouderd voor nieuwe producer-code:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Gebruik `presentation`-payloads en `buildSlackPresentationBlocks(...)` voor nieuwe
door Slack weergegeven besturingselementen.

Opmerkingen:

- Dit is Slack-specifieke legacy-UI. Andere kanalen vertalen Slack Block
  Kit-richtlijnen niet naar hun eigen knoppensystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen ruwe door agents geschreven waarden.
- Als gegenereerde interactieve blokken de limieten van Slack Block Kit zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blokkenpayload te verzenden.

### Modal-inzendingen die eigendom zijn van Plugins

Slack-plugins die een interactieve handler registreren, kunnen ook modal-
`view_submission`- en `view_closed`-levenscyclusgebeurtenissen ontvangen voordat OpenClaw
de payload compacter maakt voor de agent-zichtbare systeemgebeurtenis. Gebruik een van deze routeringspatronen
wanneer u een Slack-modal opent:

- Stel `callback_id` in op `openclaw:<namespace>:<payload>`.
- Of behoud een bestaande `callback_id` en plaats `pluginInteractiveData:
"<namespace>:<payload>"` in de modal-`private_metadata`.

De handler ontvangt `ctx.interaction.kind` als `view_submission` of
`view_closed`, genormaliseerde `inputs`, en het volledige ruwe `stateValues`-object van
Slack. Alleen-callback-id-routering is voldoende om de Plugin-handler aan te roepen; neem
de bestaande gebruikers-/sessierouteringsvelden van modal-`private_metadata` op wanneer de
modal ook een agent-zichtbare systeemgebeurtenis moet produceren. De agent ontvangt een
compacte, geredigeerde systeemgebeurtenis `Slack interaction: ...`. Als de handler
`systemEvent.summary`, `systemEvent.reference` of `systemEvent.data` retourneert, worden die
velden opgenomen in die compacte gebeurtenis, zodat de agent kan verwijzen naar
Plugin-eigen opslag zonder de volledige formulierpayload te zien.

## Native goedkeuringen in Slack

Slack kan fungeren als een native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de Web-UI of terminal.

- Exec- en Plugin-goedkeuringen kunnen worden weergegeven als Slack-native Block Kit-prompts.
- `channels.slack.execApprovals.*` blijft de configuratie voor inschakeling van de native exec-goedkeuringsclient en DM-/kanaalroutering.
- Exec-goedkeurings-DM's gebruiken `channels.slack.execApprovals.approvers` of `commands.ownerAllowFrom`.
- Plugin-goedkeuringen gebruiken Slack-native knoppen wanneer Slack is ingeschakeld als native goedkeuringsclient voor de oorspronkelijke sessie, of wanneer `approvals.plugin` routeert naar de oorspronkelijke Slack-sessie of een Slack-doel.
- Plugin-goedkeurings-DM's gebruiken Slack Plugin-goedkeurders uit `channels.slack.allowFrom`, `allowFrom` van een benoemd account, of de standaardroute van het account.
- Autorisatie van goedkeurders wordt nog steeds afgedwongen: goedkeurders voor alleen exec kunnen Plugin-aanvragen niet goedkeuren tenzij ze ook Plugin-goedkeurders zijn.

Dit gebruikt hetzelfde gedeelde goedkeuringsknoppenoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in de instellingen van uw Slack-app, worden goedkeuringsprompts rechtstreeks in het gesprek weergegeven als Block Kit-knoppen.
Wanneer die knoppen aanwezig zijn, zijn ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste een
exec-goedkeurder wordt opgelost. Slack kan ook native Plugin-goedkeuringen via dit native-clientpad
afhandelen wanneer Slack Plugin-goedkeurders worden opgelost en de aanvraag overeenkomt met de native-clientfilters. Stel
`enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient. Stel `enabled: true` in om
native goedkeuringen te forceren wanneer goedkeurders worden opgelost. Het uitschakelen van Slack exec-goedkeuringen schakelt
native Slack Plugin-goedkeuringslevering die is ingeschakeld via `approvals.plugin` niet uit; Plugin-goedkeuringslevering
gebruikt in plaats daarvan Slack Plugin-goedkeurders.

Standaardgedrag zonder expliciete Slack exec-goedkeuringsconfiguratie:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer u goedkeurders wilt overschrijven, filters wilt toevoegen of
wilt kiezen voor levering in de oorspronkelijke chat:

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

Gedeelde `approvals.exec`-doorsturing is apart. Gebruik dit alleen wanneer exec-goedkeuringsprompts ook
naar andere chats of expliciete out-of-band-doelen moeten routeren. Gedeelde `approvals.plugin`-doorsturing is ook
apart; Slack-native levering onderdrukt die fallback alleen wanneer Slack de Plugin-
goedkeuringsaanvraag native kan afhandelen.

Same-chat `/approve` werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige goedkeuringsdoorstuurmodel.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden omgezet naar systeemgebeurtenissen.
- Thread-broadcasts ("Also send to channel"-threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Reactie-toevoegings-/verwijderingsgebeurtenissen worden omgezet naar systeemgebeurtenissen.
- Lid toetreden/verlaten, kanaal gemaakt/hernoemd, en pin toevoegen/verwijderen worden omgezet naar systeemgebeurtenissen.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in routeringscontext worden geinjecteerd.
- Threadstarter en initiale threadgeschiedenis-contextseeding worden gefilterd op geconfigureerde allowlists voor afzenders wanneer van toepassing.
- Blokacties, snelkoppelingen en modal-interacties zenden gestructureerde systeemgebeurtenissen `Slack interaction: ...` uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - globale snelkoppelingen: callback- en actor-metadata, gerouteerd naar de directe sessie van de actor
  - berichtsnelkoppelingen: callback-, actor-, kanaal-, thread- en geselecteerde-berichtcontext
  - modal-`view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

Definieer globale of berichtsnelkoppelingen in uw Slack-appconfiguratie en gebruik een niet-lege callback-ID. OpenClaw bevestigt overeenkomende snelkoppelingspayloads, past hetzelfde DM-/kanaalafzenderbeleid toe als andere Slack-interacties, en zet de opgeschoonde gebeurtenis in de wachtrij voor de gerouteerde agent-sessie. Trigger-ID's en antwoord-URL's worden uit agentcontext geredigeerd.

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="Slack-velden met hoge signaalwaarde">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodrem; laat uit tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threads/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks` (standaard: `false`), `unfurlMedia` voor beheer van link-/mediavoorvertoning in `chat.postMessage`; stel `unfurlLinks: true` in om opnieuw voor linkvoorvertoningen te kiezen
- ops/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Geen antwoorden in kanalen">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Op namen gebaseerde sleutels falen stil onder `groupPolicy: "allowlist"` omdat kanaalroutering standaard ID-first is. Een ID vinden: klik met rechts op het kanaal in Slack → **Copy link** — de `C...`-waarde aan het einde van de URL is de kanaal-ID.
    - `requireMention`
    - per-kanaal `users`-allowlist
    - `messages.groupChat.visibleReplies`: normale groeps-/kanaalaanvragen hebben standaard `"automatic"`. Als u hebt gekozen voor `"message_tool"` en logs assistenttekst tonen zonder `message(action=send)`-aanroep, heeft het model het zichtbare message-toolpad gemist. Eindtekst blijft prive in deze modus; inspecteer de uitgebreide gateway-log op onderdrukte payloadmetadata, of stel dit in op `"automatic"` als u wilt dat elk normaal definitief assistentantwoord via het legacypad wordt geplaatst.
    - `messages.groupChat.unmentionedInbound`: als dit `"room_event"` is, is niet-vermelde toegestane kanaalspraak omgevingscontext en blijft stil tenzij de agent de `message`-tool aanroept. Zie [Omgevingsruimtegebeurtenissen](/nl/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy` (of legacy `channels.slack.dm.policy`)
    - koppelingsgoedkeuringen / allowlist-vermeldingen (`dmPolicy: "open"` vereist nog steeds `channels.slack.allowFrom: ["*"]`)
    - groeps-DM's gebruiken MPIM-afhandeling; schakel `channels.slack.dm.groupEnabled` in en neem, indien geconfigureerd, de MPIM op in `channels.slack.dm.groupChannels`
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis heeft gestuurd zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode maakt geen verbinding">
    Valideer bot- en app-tokens en of Socket Mode is ingeschakeld in Slack-appinstellingen.
    Het App-Level Token heeft `connections:write` nodig, en het Bot User OAuth Token-
    bottoken moet bij dezelfde Slack-app/-workspace horen als het app-token.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd, maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet oplossen.

    Logs zoals `slack socket mode failed to start; retry ...` zijn herstelbare
    startfouten. Ontbrekende scopes, ingetrokken tokens en ongeldige authenticatie
    mislukken in plaats daarvan direct. Een log `slack token mismatch ...` betekent
    dat het bot-token en app-token bij verschillende Slack-apps lijken te horen;
    herstel de Slack-appreferenties.

  </Accordion>

  <Accordion title="HTTP-modus ontvangt geen gebeurtenissen">
    Valideer:

    - signing secret
    - Webhook-pad
    - Slack Request URL's (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account
    - de openbare URL beëindigt TLS en stuurt verzoeken door naar het Gateway-pad
    - het pad van de Slack-app `request_url` komt exact overeen met `channels.slack.webhookPath` (standaard `/slack/events`)

    Als `signingSecretStatus: "configured_unavailable"` in accountsnapshots
    verschijnt, is het HTTP-account geconfigureerd maar kon de huidige runtime
    de door SecretRef ondersteunde signing secret niet oplossen.

    Een herhaalde log `slack: webhook path ... already registered` betekent dat twee HTTP-
    accounts dezelfde `webhookPath` gebruiken; geef elk account een afzonderlijk pad.

  </Accordion>

  <Accordion title="Native/slash-commando's worden niet uitgevoerd">
    Controleer wat je bedoelde:

    - native command-modus (`channels.slack.commands.native: true`) met bijpassende slash-commando's die in Slack zijn geregistreerd
    - of single slash command-modus (`channels.slack.slashCommand.enabled: true`)

    Slack maakt of verwijdert slash-commando's niet automatisch. `commands.native: "auto"` schakelt native Slack-commando's niet in; gebruik `true` en maak de bijpassende commando's in de Slack-app. In HTTP-modus moet elk Slack slash-commando de Gateway-URL bevatten. In Socket Mode komen command-payloads via de websocket binnen en negeert Slack `slash_commands[].url`.

    Controleer ook `commands.useAccessGroups`, DM-autorisatie, kanaal-allowlists
    en `users`-allowlists per kanaal. Slack retourneert tijdelijke fouten voor
    geblokkeerde afzenders van slash-commando's, waaronder:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referentie voor bijlage-vision

Slack kan gedownloade media aan de agentbeurt koppelen wanneer Slack-bestandsdownloads slagen en groottelimieten dit toestaan. Afbeeldingsbestanden kunnen via het media-understandingpad worden doorgegeven of rechtstreeks aan een antwoordmodel met vision-mogelijkheden; andere bestanden blijven behouden als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                       | Bron                 | Huidig gedrag                                                                    | Opmerkingen                                                               |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP-afbeeldingen | Slack-bestands-URL | Gedownload en aan de beurt gekoppeld voor verwerking met vision-mogelijkheden    | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)         |
| PDF-bestanden                   | Slack-bestands-URL   | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Inbound Slack converteert PDF's niet automatisch naar image-vision-invoer |
| Andere bestanden                | Slack-bestands-URL   | Waar mogelijk gedownload en beschikbaar gemaakt als bestandscontext              | Binaire bestanden worden niet behandeld als afbeeldingsinvoer             |
| Thread-antwoorden               | Bestanden van threadstarter | Root-messagebestanden kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft | Starters met alleen bestanden gebruiken een tijdelijke aanduiding voor bijlagen |
| Berichten met meerdere afbeeldingen | Meerdere Slack-bestanden | Elk bestand wordt onafhankelijk geëvalueerd                                      | Slack-verwerking is beperkt tot acht bestanden per bericht                |

### Inbound pipeline

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf de privé-URL van Slack met het bot-token.
2. Het bestand wordt bij succes naar de mediaopslag geschreven.
3. Gedownloade mediapaden en inhoudstypen worden toegevoegd aan de inbound context.
4. Model-/toolpaden met afbeeldingsmogelijkheden kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ze kunnen verwerken.

### Overerving van bijlagen uit de thread-root

Wanneer een bericht in een thread binnenkomt (met een `thread_ts`-bovenliggend item):

- Als het antwoord zelf geen directe media heeft en het meegeleverde rootbericht bestanden heeft, kan Slack de rootbestanden hydrateren als thread-startercontext.
- Directe antwoordbijlagen hebben voorrang op bijlagen van het rootbericht.
- Een rootbericht dat alleen bestanden en geen tekst heeft, wordt weergegeven met een tijdelijke aanduiding voor bijlagen, zodat de fallback nog steeds de bestanden kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk via de mediapijplijn verwerkt.
- Gedownloade mediareferenties worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de gebeurtenispayload.
- Een fout bij het downloaden van één bijlage blokkeert de andere niet.

### Grootte-, download- en modellimieten

- **Groottelimiet**: standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: bestanden die Slack niet kan leveren, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en Slack-auth/login-HTML-responses worden overgeslagen in plaats van gerapporteerd als niet-ondersteunde formaten.
- **Vision-model**: afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit vision ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende limieten

| Scenario                               | Huidig gedrag                                                               | Tijdelijke oplossing                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL            | Bestand overgeslagen; geen fout weergegeven                                 | Upload het bestand opnieuw in Slack                                        |
| Vision-model niet geconfigureerd       | Afbeeldingsbijlagen worden opgeslagen als mediareferenties, maar niet als afbeeldingen geanalyseerd | Configureer `agents.defaults.imageModel` of gebruik een antwoordmodel met vision-mogelijkheden |
| Zeer grote afbeeldingen (> 20 MB standaard) | Overgeslagen volgens groottelimiet                                           | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                 |
| Doorgestuurde/gedeelde bijlagen        | Tekst en door Slack gehoste afbeeldings-/bestandsmedia zijn best-effort      | Deel opnieuw rechtstreeks in de OpenClaw-thread                            |
| PDF-bijlagen                           | Opgeslagen als bestands-/mediacontext, niet automatisch via image vision gerouteerd | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse |

### Gerelateerde documentatie

- [Media-understandingpipeline](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — inschakeling van vision voor Slack-bijlagen
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-verificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Koppel een Slack-gebruiker aan de gateway.
  </Card>
  <Card title="Groepen" icon="users" href="/nl/channels/groups">
    Gedrag van kanalen en groeps-DM's.
  </Card>
  <Card title="Kanaalroutering" icon="route" href="/nl/channels/channel-routing">
    Routeer inbound berichten naar agents.
  </Card>
  <Card title="Beveiliging" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Config-indeling en prioriteit.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Commandocatalogus en gedrag.
  </Card>
</CardGroup>
