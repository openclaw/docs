---
read_when:
    - Slack instellen of de socket-/HTTP-modus van Slack debuggen
summary: Slack-configuratie en runtimegedrag (Socketmodus + HTTP-verzoek-URL's)
title: Slack
x-i18n:
    generated_at: "2026-05-04T02:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

Productieklaar voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP Request URLs worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-opdrachten" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverschrijdende diagnostiek en herstelplaybooks.
  </Card>
</CardGroup>

## Snelle configuratie

<Tabs>
  <Tab title="Socket Mode (standaard)">
    <Steps>
      <Step title="Maak een nieuwe Slack-app">
        Druk in de Slack-appinstellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een workspace voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) hieronder en ga verder met maken
        - genereer een **App-Level Token** (`xapp-...`) met `connections:write`
        - installeer de app en kopieer de weergegeven **Bot Token** (`xoxb-...`)

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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Maak een nieuwe Slack-app">
        Druk in de Slack-appinstellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een workspace voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) en werk de URL's bij voordat je maakt
        - bewaar de **Signing Secret** voor verzoekverificatie
        - installeer de app en kopieer de weergegeven **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configureer OpenClaw">

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
        Gebruik unieke webhookpaden voor HTTP met meerdere accounts

        Geef elk account een eigen `webhookPath` (standaard `/slack/events`) zodat registraties niet botsen.
        </Note>

      </Step>

      <Step title="Start Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode-transport afstemmen

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

Gebruik dit alleen voor Socket Mode-workspaces die Slack-websocket-pong- of server-ping-time-outs loggen, of die draaien op hosts met bekende event-loop-uithongering. `clientPingTimeout` is de wachttijd voor pong nadat de SDK een client-ping heeft verzonden; `serverPingTimeout` is de wachttijd voor Slack-serverpings. Appberichten en events blijven applicatiestatus, geen signalen voor transportliveness.

## Checklist voor manifest en scopes

Het basale Slack-appmanifest is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het `settings`-blok (en de slash-opdracht-`url`) verschilt.

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

Vervang voor de modus **HTTP Request URLs** `settings` door de HTTP-variant en voeg `url` toe aan elke slash-opdracht. Openbare URL vereist:

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

Toon andere functies die de bovenstaande standaardwaarden uitbreiden.

Het standaardmanifest schakelt het Slack App Home-tabblad **Home** in en abonneert zich op `app_home_opened`. Wanneer een workspacelid het tabblad Home opent, publiceert OpenClaw een veilige standaard-Home-weergave met `views.publish`; er wordt geen gespreks-payload of privéconfiguratie opgenomen. Het tabblad **Messages** blijft ingeschakeld voor Slack-DM's.

<AccordionGroup>
  <Accordion title="Optionele native slash-opdrachten">

    Meerdere [native slash-opdrachten](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerde opdracht, met nuance:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat de opdracht `/status` gereserveerd is.
    - Er kunnen maximaal 25 slash-opdrachten tegelijk beschikbaar worden gemaakt.

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
        Gebruik dezelfde lijst `slash_commands` als Socket Mode hierboven, en voeg aan elk item `"url": "https://gateway-host.example.com/slack/events"` toe. Voorbeeld:

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
  <Accordion title="Optionele auteurschap-scopes (schrijfbewerkingen)">
    Voeg de `chat:write.customize`-bot-scope toe als je wilt dat uitgaande berichten de actieve agentidentiteit gebruiken (aangepaste gebruikersnaam en pictogram) in plaats van de standaardidentiteit van de Slack-app.

    Als je een emoji-pictogram gebruikt, verwacht Slack de syntaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionele gebruikerstoken-scopes (leesbewerkingen)">
    Als je `channels.slack.userToken` configureert, zijn typische lees-scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (als je afhankelijk bent van leesbewerkingen via Slack-zoeken)

  </Accordion>
</AccordionGroup>

## Tokenmodel

- `botToken` + `appToken` zijn vereist voor Socket Mode.
- HTTP-modus vereist `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platte-tekststrings
  of SecretRef-objecten.
- Configuratietokens overschrijven de env-fallback.
- De env-fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen via configuratie beschikbaar (geen env-fallback) en gebruikt standaard alleen-lezen gedrag (`userTokenReadOnly: true`).

Gedrag van statusmomentopnamen:

- Inspectie van Slack-accounts houdt per referentie `*Source`- en `*Status`-
  velden bij (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige commando-/runtimepad
  de werkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/mapleesbewerkingen kan het gebruikerstoken de voorkeur krijgen wanneer dit is geconfigureerd. Voor schrijfbewerkingen blijft het bottoken de voorkeur houden; schrijven met gebruikerstokens is alleen toegestaan wanneer `userTokenReadOnly: false` en het bottoken niet beschikbaar is.
</Tip>

## Acties en poorten

Slack-acties worden beheerd door `channels.slack.actions.*`.

Beschikbare actiegroepen in de huidige Slack-tooling:

| Groep      | Standaard |
| ---------- | --------- |
| messages   | enabled   |
| reactions  | enabled   |
| pins       | enabled   |
| memberInfo | enabled   |
| emojiList  | enabled   |

Huidige Slack-berichtacties omvatten `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` en `emoji-list`. `download-file` accepteert Slack-bestands-ID's die in inkomende bestandsplaatsaanduidingen worden getoond en retourneert afbeeldingsvoorbeelden voor afbeeldingen of lokale bestandsmetadata voor andere bestandstypen.

## Toegangscontrole en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.slack.dmPolicy` beheert DM-toegang. `channels.slack.allowFrom` is de canonieke DM-toestemmingslijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.slack.allowFrom` `"*"` bevat)
    - `disabled`

    DM-vlaggen:

    - `dm.enabled` (standaard true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (groeps-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-toestemmingslijst)

    Voorrang bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Legacy `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dit kan zonder de toegang te wijzigen.

    Koppelen in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaaltoestemmingslijst staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (setup alleen via env), valt de runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam-/ID-resolutie:

    - items in kanaaltoestemmingslijsten en DM-toestemmingslijsten worden bij het opstarten opgelost wanneer tokentoegang dit toestaat
    - onopgeloste items met kanaalnamen blijven zoals geconfigureerd behouden, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-eerst; directe matching op gebruikersnaam/slug vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op namen gebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalopzoeking is standaard ID-eerst, dus een op naam gebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stilzwijgend geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op naam gebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Zo vind je die: klik met de rechtermuisknop op het kanaal in Slack → **Copy link** — de ID (`C...`) staat aan het einde van de URL.

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
    Kanaalberichten zijn standaard afgeschermd met vermeldingen.

    Bronnen voor vermeldingen:

    - expliciete app-vermelding (`<@botId>`)
    - Slack-gebruikersgroepvermelding (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Regelaars per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (toestemmingslijst)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - sleutelindeling voor `toolsBySender`: `id:`, `e164:`, `username:`, `name:` of wildcard `"*"`
      (legacy sleutels zonder prefix worden nog steeds alleen toegewezen aan `id:`)

    `allowBots` is conservatief voor kanalen en privékanalen: door bots geschreven kamerberichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-toestemmingslijst van die kamer staat, of wanneer ten minste één expliciete Slack-eigenaars-ID uit `channels.slack.allowFrom` momenteel lid is van de kamer. Wildcards en eigenaarsitems met weergavenaam voldoen niet aan aanwezigheid van de eigenaar. Aanwezigheid van de eigenaar gebruikt Slack `conversations.members`; zorg dat de app de bijpassende lees-scope heeft voor het kamertype (`channels:read` voor openbare kanalen, `groups:read` voor privékanalen). Als het opzoeken van leden mislukt, verwijdert OpenClaw het door de bot geschreven kamerbericht.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindingen accepteren ruwe peer-ID's plus Slack-doelvormen zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met de standaard `session.dmScope=main` worden Slack-DM's samengevoegd naar de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen, indien van toepassing, threadsessieachtervoegsels maken (`:thread:<threadTs>`).
- De standaard voor `channels.slack.thread.historyScope` is `thread`; de standaard voor `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel in op `0` om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, worden impliciete threadvermeldingen onderdrukt, zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-poort.

Regelaars voor antwoord-threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- legacy fallback voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` schakelt **alle** antwoord-threads in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gehonoreerd in de modus `"off"`. Slack-threads verbergen berichten in het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

## Tekststreaming

`channels.slack.streaming` beheert livevoorbeeldgedrag:

- `off`: schakel streaming van livevoorbeelden uit.
- `partial` (standaard): vervang voorbeeldtekst door de nieuwste gedeeltelijke uitvoer.
- `block`: voeg voorbeeldupdates in chunks toe.
- `progress`: toon voortgangsstatustekst tijdens het genereren en verzend daarna de definitieve tekst.
- `streaming.preview.toolProgress`: wanneer het conceptvoorbeeld actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht (standaard: `true`). Stel in op `false` om aparte tool-/voortgangsberichten te behouden.

`channels.slack.streaming.nativeTransport` beheert Slack-native tekststreaming wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn om native tekststreaming en Slack-assistent-threadstatus te laten verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal-, groepschat- en DM-hoofdberichten op topniveau kunnen nog steeds het normale conceptvoorbeeld gebruiken wanneer native streaming niet beschikbaar is of er geen antwoordthread bestaat.
- Slack-DM's op topniveau blijven standaard buiten threads, waardoor ze Slack's threadachtige native stream-/statusvoorbeeld niet tonen; OpenClaw plaatst en bewerkt in plaats daarvan een conceptvoorbeeld in de DM.
- Media en niet-tekstpayloads vallen terug op normale levering.
- Definitieve media-/foutberichten annuleren wachtende voorbeeldbewerkingen; in aanmerking komende definitieve tekst-/blokberichten worden alleen geflusht wanneer ze het voorbeeld ter plekke kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale levering voor resterende payloads.

Gebruik conceptvoorbeeld in plaats van Slack-native tekststreaming:

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

Legacy sleutels:

- `channels.slack.streamMode` (`replace | status_final | append`) wordt automatisch gemigreerd naar `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` wordt automatisch gemigreerd naar `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- legacy `channels.slack.nativeStreaming` wordt automatisch gemigreerd naar `channels.slack.streaming.nativeTransport`.

## Fallback voor typreactie

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run is voltooid. Dit is het nuttigst buiten threadantwoorden, die een standaardstatusindicator "is typing..." gebruiken.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opschoning wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en aflevering

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload vanaf door Slack gehoste privé-URL's (token-geauthenticeerde aanvraagstroom) en naar de mediaopslag geschreven wanneer ophalen slaagt en de groottelimieten dit toestaan. Bestand-placeholders bevatten de Slack `fileId`, zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde idle- en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestand-placeholder.

    De runtime-limiet voor inkomende grootte is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstchunks gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt alinea-eerst splitsen in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden bevatten (`thread_ts`)
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Afleveringsdoelen">
    Voorkeursdoelen die expliciet zijn:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst/blokken kunnen rechtstreeks naar gebruikers-ID's posten; bestandsuploads en threaded verzendingen openen eerst de DM via Slack-conversatie-API's, omdat die paden een concrete conversatie-ID vereisen.

  </Accordion>
</AccordionGroup>

## Commando's en slash-gedrag

Slash-commando's verschijnen in Slack als één geconfigureerd commando of meerdere native commando's. Configureer `channels.slack.slashCommand` om standaardwaarden voor commando's te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commando's vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true` in globale configuraties.

- Native commando-auto-modus staat **uit** voor Slack, dus `commands.native: "auto"` schakelt native Slack-commando's niet in.

```txt
/help
```

Native argumentmenu's gebruiken een adaptieve renderstrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: knopblokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met asynchrone optiefiltering wanneer interactiviteitsoptiehandlers beschikbaar zijn
- overschreden Slack-limieten: gecodeerde optiewaarden vallen terug op knoppen

```txt
/think
```

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren commando-uitvoeringen nog steeds naar de doelconversatiesessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan interactieve antwoordbesturingselementen renderen die door agents zijn opgesteld, maar deze functie is standaard uitgeschakeld.

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

Wanneer ingeschakeld, kunnen agents Slack-only antwoorddirectieven uitsturen:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze directieven worden gecompileerd naar Slack Block Kit en routeren klikken of selecties terug via het bestaande Slack-interactiegebeurtenispad.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-directieven niet naar hun eigen knopsystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen ruwe waarden die door agents zijn opgesteld.
- Als gegenereerde interactieve blokken Slack Block Kit-limieten zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blocks-payload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan fungeren als een native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de Web UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native DM-/kanaalroutering.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden afgehandeld wanneer de aanvraag al in Slack landt en het goedkeurings-ID-soort `plugin:` is.
- Autorisatie van goedkeurders wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen aanvragen via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in je Slack-appinstellingen, worden goedkeuringsprompts rechtstreeks in de conversatie als Block Kit-knoppen gerenderd.
Wanneer die knoppen aanwezig zijn, zijn ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring het enige pad is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt terug op `commands.ownerAllowFrom` wanneer mogelijk)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één
goedkeurder wordt gevonden. Stel `enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient.
Stel `enabled: true` in om native goedkeuringen af te dwingen wanneer goedkeurders worden gevonden.

Standaardgedrag zonder expliciete Slack-exec-goedkeuringsconfiguratie:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
wilt kiezen voor aflevering in de oorspronkelijke chat:

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
naar andere chats of expliciete out-of-band doelen moeten worden gerouteerd. Gedeelde `approvals.plugin`-doorsturing staat ook
los hiervan; Slack-native knoppen kunnen Plugin-goedkeuringen nog steeds afhandelen wanneer die aanvragen al
in Slack landen.

Same-chat `/approve` werkt ook in Slack-kanalen en DM's die al commando's ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige goedkeuringsdoorsturingsmodel.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden omgezet naar systeemgebeurtenissen.
- Thread-broadcasts ("Ook naar kanaal verzenden"-threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Gebeurtenissen voor het toevoegen/verwijderen van reacties worden omgezet naar systeemgebeurtenissen.
- Gebeurtenissen voor lid toetreden/verlaten, kanaal aangemaakt/hernoemd en pin toevoegen/verwijderen worden omgezet naar systeemgebeurtenissen.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata over kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Threadstarter en initiële seeding van threadgeschiedeniscontext worden gefilterd op basis van geconfigureerde sender-allowlists wanneer van toepassing.
- Blokacties en modalinteracties zenden gestructureerde `Slack interaction: ...`-systeemgebeurtenissen uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modal `view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="Slack-velden met hoge signaalwaarde">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (break-glass; uit laten tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threads/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- aflevering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Geen antwoorden in kanalen">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Op naam gebaseerde sleutels mislukken stil onder `groupPolicy: "allowlist"`, omdat kanaalroutering standaard ID-eerst is. Een ID vinden: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de `C...`-waarde aan het einde van de URL is de kanaal-ID.
    - `requireMention`
    - per-kanaal `users`-allowlist

    Nuttige commando's:

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
    - koppelingsgoedkeuringen / allowlist-vermeldingen
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-thread-gebeurtenis stuurde zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode maakt geen verbinding">
    Valideer bot- en app-tokens en of Socket Mode is ingeschakeld in de Slack-appinstellingen.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet oplossen.

  </Accordion>

  <Accordion title="HTTP-modus ontvangt geen gebeurtenissen">
    Valideer:

    - signing secret
    - webhookpad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` verschijnt in account-
    snapshots, is het HTTP-account geconfigureerd maar kon de huidige runtime
    de door SecretRef ondersteunde signing secret niet oplossen.

  </Accordion>

  <Accordion title="Native/slash-commando's worden niet uitgevoerd">
    Controleer wat je bedoelde:

    - native command-modus (`channels.slack.commands.native: true`) met overeenkomende slash-commando's die in Slack zijn geregistreerd
    - of single slash command-modus (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikers-allowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor bijlagenvision

Slack kan gedownloade media aan de agentbeurt koppelen wanneer Slack-bestandsdownloads slagen en groottelimieten dit toestaan. Afbeeldingsbestanden kunnen via het media-understanding-pad worden doorgegeven of rechtstreeks aan een vision-capabel antwoordmodel; andere bestanden worden behouden als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                  | Opmerkingen                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG- / PNG- / GIF- / WebP-afbeeldingen | Slack-bestands-URL       | Gedownload en aan de beurt gekoppeld voor vision-geschikte verwerking                   | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)                 |
| PDF-bestanden                      | Slack-bestands-URL       | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Slack-invoer zet PDF's niet automatisch om naar invoer voor beeld-vision |
| Andere bestanden                    | Slack-bestands-URL       | Waar mogelijk gedownload en beschikbaar gemaakt als bestandscontext                              | Binaire bestanden worden niet behandeld als afbeeldingsinvoer                               |
| Thread-antwoorden                 | Bestanden van threadstarter | Bestanden uit het rootbericht kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft  | Starters met alleen bestanden gebruiken een bijlageplaceholder                          |
| Berichten met meerdere afbeeldingen           | Meerdere Slack-bestanden | Elk bestand wordt onafhankelijk beoordeeld                                              | Slack-verwerking is beperkt tot acht bestanden per bericht                     |

### Inkomende pipeline

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf de privé-URL van Slack met de bottoken (`xoxb-...`).
2. Bij succes wordt het bestand naar de mediaopslag geschreven.
3. Gedownloade mediapaden en contenttypen worden toegevoegd aan de inkomende context.
4. Model- en toolpaden die afbeeldingen ondersteunen, kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ze kunnen verwerken.

### Overerving van bijlagen uit de thread-root

Wanneer een bericht binnenkomt in een thread (met een `thread_ts`-ouder):

- Als het antwoord zelf geen directe media heeft en het meegeleverde rootbericht bestanden heeft, kan Slack de rootbestanden hydrateren als threadstartercontext.
- Directe antwoordbijlagen hebben voorrang op bijlagen uit het rootbericht.
- Een rootbericht dat alleen bestanden en geen tekst heeft, wordt weergegeven met een bijlageplaceholder zodat de fallback de bestanden nog steeds kan opnemen.

### Afhandeling van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk verwerkt via de mediapipeline.
- Gedownloade mediareferenties worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de eventpayload.
- Een downloadfout bij één bijlage blokkeert de andere niet.

### Grootte-, download- en modellimieten

- **Groottelimiet**: Standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: Bestanden die Slack niet kan aanbieden, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en HTML-reacties voor Slack-authenticatie of -login worden overgeslagen in plaats van gerapporteerd als niet-ondersteunde indelingen.
- **Vision-model**: Afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit vision ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende beperkingen

| Scenario                               | Huidig gedrag                                                             | Workaround                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL                 | Bestand overgeslagen; geen fout getoond                                                 | Upload het bestand opnieuw in Slack                                                |
| Vision-model niet geconfigureerd            | Afbeeldingsbijlagen worden opgeslagen als mediareferenties, maar niet als afbeeldingen geanalyseerd | Configureer `agents.defaults.imageModel` of gebruik een vision-geschikt antwoordmodel |
| Zeer grote afbeeldingen (> standaard 20 MB) | Overgeslagen vanwege de groottelimiet                                                         | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                       |
| Doorgestuurde/gedeelde bijlagen           | Tekst en door Slack gehoste afbeeldings-/bestandsmedia zijn best-effort                       | Deel ze rechtstreeks opnieuw in de OpenClaw-thread                                   |
| PDF-bijlagen                        | Opgeslagen als bestands-/mediacontext, niet automatisch via afbeeldings-vision gerouteerd  | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse   |

### Gerelateerde documentatie

- [Pipeline voor mediabegrip](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack-bijlagenvision inschakelen
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Liveverificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Slack-gebruiker aan de gateway.
  </Card>
  <Card title="Groups" icon="users" href="/nl/channels/groups">
    Gedrag van kanalen en groeps-DM's.
  </Card>
  <Card title="Channel routing" icon="route" href="/nl/channels/channel-routing">
    Routeer inkomende berichten naar agents.
  </Card>
  <Card title="Security" icon="shield" href="/nl/gateway/security">
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Configuration" icon="sliders" href="/nl/gateway/configuration">
    Configuratie-indeling en prioriteit.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Commandocatalogus en gedrag.
  </Card>
</CardGroup>
