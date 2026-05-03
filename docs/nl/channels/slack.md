---
read_when:
    - Slack instellen of Slack-socket-/HTTP-modus debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode + HTTP-aanvraag-URL's)
title: Slack
x-i18n:
    generated_at: "2026-05-03T11:08:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

Productieklaar voor DM's en kanalen via Slack-app-integraties. De standaardmodus is Socket Mode; HTTP Request URLs worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de pairingmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelplaybooks.
  </Card>
</CardGroup>

## Snelle installatie

<Tabs>
  <Tab title="Socket Mode (standaard)">
    <Steps>
      <Step title="Een nieuwe Slack-app maken">
        Druk in de Slack-app-instellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een werkruimte voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) hieronder en ga verder met maken
        - genereer een **App-Level Token** (`xapp-...`) met `connections:write`
        - installeer de app en kopieer de weergegeven **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="OpenClaw configureren">

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

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Een nieuwe Slack-app maken">
        Druk in de Slack-app-instellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een werkruimte voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) en werk de URL's bij voordat je maakt
        - sla de **Signing Secret** op voor aanvraagverificatie
        - installeer de app en kopieer de weergegeven **Bot Token** (`xoxb-...`)

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
        Gebruik unieke webhookpaden voor HTTP met meerdere accounts

        Geef elk account een eigen `webhookPath` (standaard `/slack/events`) zodat registraties niet botsen.
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

Gebruik dit alleen voor Socket Mode-werkruimten die Slack-websocket-pong/server-pingtime-outs loggen of draaien op hosts met bekende event-loop starvation. `clientPingTimeout` is de wachttijd op pong nadat de SDK een client-ping verzendt; `serverPingTimeout` is de wachttijd op Slack-serverpings. App-berichten en events blijven applicatiestatus, geen signalen voor transportliveness.

## Manifest- en scopechecklist

Het basismanifest voor de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het `settings`-blok (en de slash command-`url`) verschilt.

Basismandaat (Socket Mode standaard):

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

Vervang voor de modus **HTTP Request URLs** `settings` door de HTTP-variant en voeg `url` toe aan elke slash command. Publieke URL vereist:

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

### Aanvullende manifestinstellingen

Toon verschillende functies die de bovenstaande standaardinstellingen uitbreiden.

Het standaardmanifest schakelt het Slack App Home-tabblad **Home** in en abonneert zich op `app_home_opened`. Wanneer een werkruimtelid het tabblad Home opent, publiceert OpenClaw een veilige standaard-Home-weergave met `views.publish`; er wordt geen gesprekspayload of privéconfiguratie opgenomen. Het tabblad **Messages** blijft ingeschakeld voor Slack-DM's.

<AccordionGroup>
  <Accordion title="Optionele native slash commands">

    Meerdere [native slash commands](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerde opdracht met nuance:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat de opdracht `/status` gereserveerd is.
    - Er kunnen niet meer dan 25 slash commands tegelijk beschikbaar worden gemaakt.

    Vervang je bestaande sectie `features.slash_commands` door een subset van [beschikbare opdrachten](/nl/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (standaard)">

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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Gebruik dezelfde lijst `slash_commands` als Socket Mode hierboven en voeg `"url": "https://gateway-host.example.com/slack/events"` toe aan elk item. Voorbeeld:

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
  <Accordion title="Optionele auteurschapsscopes (schrijfbewerkingen)">
    Voeg de botscope `chat:write.customize` toe als je wilt dat uitgaande berichten de identiteit van de actieve agent gebruiken (aangepaste gebruikersnaam en pictogram) in plaats van de standaardidentiteit van de Slack-app.

    Als je een emoji-pictogram gebruikt, verwacht Slack de syntaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionele user-token-scopes (leesbewerkingen)">
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
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren plaintext
  strings of SecretRef-objecten.
- Config-tokens overschrijven env-fallback.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env-fallback geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen config (geen env-fallback) en gebruikt standaard alleen-lezen gedrag (`userTokenReadOnly: true`).

Gedrag van statussnapshot:

- Slack-accountinspectie houdt per credential `*Source`- en `*Status`-velden
  bij (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige command/runtime-pad
  de daadwerkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/directory-reads kan de user token de voorkeur krijgen wanneer deze is geconfigureerd. Voor schrijfacties blijft de bot token de voorkeur houden; user-token-schrijfacties zijn alleen toegestaan wanneer `userTokenReadOnly: false` en de bot token niet beschikbaar is.
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
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (groep-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-allowlist)

    Prioriteit bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Legacy `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    Pairing in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaal-allowlist staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's** (bijvoorbeeld `C12345678`) als config-sleutels gebruiken.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (setup met alleen env), valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam/ID-resolutie:

    - kanaal-allowlistvermeldingen en DM-allowlistvermeldingen worden bij het opstarten opgelost wanneer token-toegang dit toestaat
    - niet-opgeloste kanaalnaamvermeldingen blijven zoals geconfigureerd behouden, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-eerst; directe username/slug-matching vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Naamgebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalzoekactie is standaard ID-eerst, dus een naamgebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stil geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een naamgebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Zo vind je die: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de ID (`C...`) staat aan het einde van de URL.

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

    Onjuist (stil geblokkeerd onder `groupPolicy: "allowlist"`):

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

    Vermeldingsbronnen:

    - expliciete app-vermelding (`<@botId>`)
    - Slack-gebruikersgroepvermelding (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - vermeldingsregexpatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet reply-to-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Besturing per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - sleutelindeling voor `toolsBySender`: `id:`, `e164:`, `username:`, `name:` of `"*"`-wildcard
      (legacy sleutels zonder prefix worden nog steeds alleen naar `id:` gemapt)

    `allowBots` is conservatief voor kanalen en privékanalen: door bots geschreven roombberichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-allowlist van die room staat, of wanneer ten minste één expliciete Slack-owner-ID uit `channels.slack.allowFrom` momenteel lid is van de room. Wildcards en owner-vermeldingen op displaynaam voldoen niet aan owner-aanwezigheid. Owner-aanwezigheid gebruikt Slack `conversations.members`; zorg dat de app de bijbehorende leesscope heeft voor het roomtype (`channels:read` voor openbare kanalen, `groups:read` voor privékanalen). Als het ophalen van leden mislukt, laat OpenClaw het door de bot geschreven roombbericht vallen.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindingen accepteren ruwe peer-ID's plus Slack-doelformen zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met standaard `session.dmScope=main` worden Slack-DM's samengevoegd naar de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen waar van toepassing threadsessiesuffixen maken (`:thread:<threadTs>`).
- De standaardwaarde van `channels.slack.thread.historyScope` is `thread`; de standaardwaarde van `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel `0` in om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, onderdrukt impliciete threadvermeldingen zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-gate.

Besturing voor antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- legacy fallback voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` schakelt **alle** antwoordthreads in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gerespecteerd in de `"off"`-modus. Slack-threads verbergen berichten uit het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` stuurt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback naar agent-identiteitsemoji (`agents.list[].identity.emoji`, anders "👀")

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

## Tekststreaming

`channels.slack.streaming` beheert livevoorbeeldgedrag:

- `off`: livevoorbeeldstreaming uitschakelen.
- `partial` (standaard): voorbeeldtekst vervangen door de nieuwste gedeeltelijke output.
- `block`: opgesplitste voorbeeldupdates toevoegen.
- `progress`: voortgangsstatustekst tonen tijdens het genereren en daarna definitieve tekst verzenden.
- `streaming.preview.toolProgress`: wanneer conceptvoorbeeld actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht (standaard: `true`). Stel in op `false` om aparte tool-/voortgangsberichten te behouden.

`channels.slack.streaming.nativeTransport` beheert native Slack-tekststreaming wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn om native tekststreaming en Slack-assistant-threadstatus te laten verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal-, groepschat- en top-level DM-roots kunnen nog steeds het normale conceptvoorbeeld gebruiken wanneer native streaming niet beschikbaar is of er geen antwoordthread bestaat.
- Top-level Slack-DM's blijven standaard buiten threads, dus ze tonen Slack's native stream-/statusvoorbeeld in threadstijl niet; OpenClaw plaatst en bewerkt in plaats daarvan een conceptvoorbeeld in de DM.
- Media en niet-tekstpayloads vallen terug op normale levering.
- Definitieve media-/foutberichten annuleren wachtende voorbeeldbewerkingen; geschikte definitieve tekst-/blokberichten worden alleen geflusht wanneer ze het voorbeeld ter plekke kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale levering voor resterende payloads.

Gebruik conceptvoorbeeld in plaats van native Slack-tekststreaming:

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

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run is voltooid. Dit is vooral nuttig buiten threadantwoorden, die een standaardstatusindicator "is typing..." gebruiken.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opruimen wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en levering

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack-bestandsbijlagen worden gedownload vanaf door Slack gehoste privé-URL's (token-geauthenticeerde aanvraagstroom) en naar de mediaopslag geschreven wanneer ophalen slaagt en groottelimieten dit toestaan. Bestandsplaceholders bevatten de Slack `fileId`, zodat agenten het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde inactieve en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandsplaceholder.

    De runtime-limiet voor inkomende grootte is standaard `20MB`, tenzij deze wordt overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - tekstfragmenten gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt splitsen met alinea's eerst in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden (`thread_ts`) bevatten
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen de MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Delivery targets">
    Voorkeursdoelen die expliciet zijn:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst/blokken kunnen rechtstreeks naar gebruikers-ID's posten; bestandsuploads en verzendingen in threads openen eerst de DM via Slack-gespreks-API's, omdat die paden een concrete gespreks-ID vereisen.

  </Accordion>
</AccordionGroup>

## Opdrachten en slash-gedrag

Slash-opdrachten verschijnen in Slack als één geconfigureerde opdracht of als meerdere native opdrachten. Configureer `channels.slack.slashCommand` om opdrachtstandaarden te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native opdrachten vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true` in globale configuraties.

- Native opdracht-auto-modus staat **uit** voor Slack, dus `commands.native: "auto"` schakelt native Slack-opdrachten niet in.

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

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren opdrachtuitvoeringen nog steeds naar de doelgespreksessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan door agenten gemaakte interactieve antwoordbedieningselementen renderen, maar deze functie is standaard uitgeschakeld.

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

Of schakel dit alleen in voor één Slack-account:

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

Wanneer ingeschakeld, kunnen agenten antwoorddirectives uitsluitend voor Slack uitzenden:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze directives worden gecompileerd naar Slack Block Kit en routeren klikken of selecties terug via het bestaande Slack-interactiegebeurtenispad.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-directives niet naar hun eigen knopsystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde opaque tokens, geen ruwe door agenten geschreven waarden.
- Als gegenereerde interactieve blokken Slack Block Kit-limieten zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blocks-payload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan fungeren als native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de Web UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native DM-/kanaalroutering.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden afgehandeld wanneer de aanvraag al in Slack terechtkomt en het soort goedkeurings-ID `plugin:` is.
- Goedkeurderautorisatie wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen aanvragen via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in de instellingen van je Slack-app, worden goedkeuringsprompts rechtstreeks in het gesprek als Block Kit-knoppen gerenderd.
Wanneer die knoppen aanwezig zijn, zijn ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chat-
goedkeuringen niet beschikbaar zijn of handmatige goedkeuring de enige route is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één
goedkeurder wordt opgelost. Stel `enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient.
Stel `enabled: true` in om native goedkeuringen geforceerd in te schakelen wanneer goedkeurders worden opgelost.

Standaardgedrag zonder expliciete Slack-exec-goedkeuringsconfiguratie:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
je wilt aanmelden voor levering aan de oorsprongchat:

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

Gedeelde `approvals.exec`-doorsturing staat hier los van. Gebruik dit alleen wanneer exec-goedkeuringsprompts ook
naar andere chats of expliciete out-of-band doelen moeten worden gerouteerd. Gedeelde `approvals.plugin`-doorsturing staat ook
los hiervan; Slack-native knoppen kunnen Plugin-goedkeuringen nog steeds afhandelen wanneer die aanvragen al
in Slack terechtkomen.

Zelfde-chat `/approve` werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige model voor goedkeuringsdoorsturing.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden naar systeemgebeurtenissen gemapt.
- Thread-broadcasts ("Also send to channel"-threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Reactie toevoegen/verwijderen-gebeurtenissen worden naar systeemgebeurtenissen gemapt.
- Lid toetreden/verlaten, kanaal gemaakt/hernoemd en pin toevoegen/verwijderen-gebeurtenissen worden naar systeemgebeurtenissen gemapt.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Threadstarter en initiële threadgeschiedeniscontext-seeding worden gefilterd door geconfigureerde afzender-allowlists wanneer van toepassing.
- Blokacties en modalinteracties zenden gestructureerde `Slack interaction: ...`-systeemgebeurtenissen uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modal-`view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (verouderd: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodoptie; laat uit tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="No replies in channels">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Op namen gebaseerde sleutels mislukken stil onder `groupPolicy: "allowlist"` omdat kanaalroutering standaard ID-first is. Een ID vinden: klik met de rechtermuisknop op het kanaal in Slack → **Copy link** — de `C...`-waarde aan het einde van de URL is de kanaal-ID.
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
    - koppelingsgoedkeuringen / allowlist-items
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis heeft verzonden zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Valideer bot- en app-tokens en Socket Mode-inschakeling in de Slack-appinstellingen.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd, maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet oplossen.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Valideer:

    - signing secret
    - Webhook-pad
    - Slack-aanvraag-URL's (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` in account-
    snapshots verschijnt, is het HTTP-account geconfigureerd, maar kon de huidige runtime de
    door SecretRef ondersteunde signing secret niet oplossen.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Controleer of je het volgende bedoelde:

    - native opdrachtmodus (`channels.slack.commands.native: true`) met overeenkomende slash-opdrachten die in Slack zijn geregistreerd
    - of enkele slash-opdrachtmodus (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikers-allowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor attachment vision

Slack kan gedownloade media aan de agentbeurt koppelen wanneer Slack-bestandsdownloads slagen en groottelimieten dit toestaan. Afbeeldingsbestanden kunnen via het pad voor mediabegrip worden doorgegeven of rechtstreeks aan een antwoordmodel met vision-mogelijkheden; andere bestanden worden behouden als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                     | Bron                 | Huidig gedrag                                                                  | Opmerkingen                                                                     |
| ----------------------------- | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP-afbeeldingen | Slack-bestands-URL       | Gedownload en aan de beurt toegevoegd voor verwerking met vision-ondersteuning                   | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)                 |
| PDF-bestanden                      | Slack-bestands-URL       | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Inkomende Slack converteert PDF's niet automatisch naar invoer voor image vision |
| Andere bestanden                    | Slack-bestands-URL       | Gedownload wanneer mogelijk en beschikbaar gemaakt als bestandscontext                              | Binaire bestanden worden niet behandeld als afbeeldingsinvoer                               |
| Thread-antwoorden                 | Bestanden van threadstarter | Bestanden van het rootbericht kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft  | Starters met alleen bestanden gebruiken een bijlage-placeholder                          |
| Berichten met meerdere afbeeldingen           | Meerdere Slack-bestanden | Elk bestand wordt onafhankelijk beoordeeld                                              | Slack-verwerking is beperkt tot acht bestanden per bericht                     |

### Inkomende pipeline

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf de privé-URL van Slack met het bottoken (`xoxb-...`).
2. Het bestand wordt bij succes naar de mediaopslag geschreven.
3. Gedownloade mediapaden en contenttypes worden toegevoegd aan de inkomende context.
4. Model-/toolpaden met afbeeldingsondersteuning kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ze kunnen verwerken.

### Overerving van thread-rootbijlagen

Wanneer een bericht in een thread binnenkomt (heeft een `thread_ts`-parent):

- Als het antwoord zelf geen directe media heeft en het meegeleverde rootbericht bestanden bevat, kan Slack de rootbestanden als threadstartercontext hydrateren.
- Directe antwoordbijlagen hebben voorrang op bijlagen van het rootbericht.
- Een rootbericht dat alleen bestanden en geen tekst bevat, wordt weergegeven met een bijlage-placeholder zodat de fallback de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk verwerkt via de mediapipeline.
- Gedownloade mediareferenties worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de event-payload.
- Een fout bij het downloaden van één bijlage blokkeert de andere niet.

### Limieten voor grootte, downloaden en modellen

- **Groottelimiet**: Standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: Bestanden die Slack niet kan leveren, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en Slack-auth-/login-HTML-antwoorden worden overgeslagen in plaats van gerapporteerd als niet-ondersteunde formaten.
- **Vision-model**: Afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit vision ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende beperkingen

| Scenario                               | Huidig gedrag                                                             | Tijdelijke oplossing                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL                 | Bestand overgeslagen; geen fout weergegeven                                                 | Upload het bestand opnieuw in Slack                                                |
| Vision-model niet geconfigureerd            | Afbeeldingsbijlagen worden opgeslagen als mediareferenties, maar niet geanalyseerd als afbeeldingen | Configureer `agents.defaults.imageModel` of gebruik een antwoordmodel met vision-ondersteuning |
| Zeer grote afbeeldingen (> 20 MB standaard) | Overgeslagen volgens de groottelimiet                                                         | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                       |
| Doorgestuurde/gedeelde bijlagen           | Tekst en door Slack gehoste afbeeldings-/bestandsmedia worden best effort verwerkt                       | Deel opnieuw rechtstreeks in de OpenClaw-thread                                   |
| PDF-bijlagen                        | Opgeslagen als bestands-/mediacontext, niet automatisch via image vision gerouteerd  | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse   |

### Gerelateerde documentatie

- [Pipeline voor mediabegrip](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — vision-ondersteuning voor Slack-bijlagen
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-verificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Koppel een Slack-gebruiker aan de Gateway.
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
    Config-indeling en prioriteit.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Commandocatalogus en gedrag.
  </Card>
</CardGroup>
