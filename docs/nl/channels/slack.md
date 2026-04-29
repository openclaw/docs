---
read_when:
    - Slack instellen of Slack-socket-/HTTP-modus debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode + HTTP-verzoek-URL's)
title: Slack
x-i18n:
    generated_at: "2026-04-29T22:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

Productieklaar voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP Request URLs worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtgedrag en opdrachtcatalogus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelplaybooks.
  </Card>
</CardGroup>

## Snelle configuratie

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Druk in de Slack-appinstellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een werkruimte voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) hieronder en ga door om het te maken
        - genereer een **App-Level Token** (`xapp-...`) met `connections:write`
        - installeer de app en kopieer het getoonde **Bot Token** (`xoxb-...`)

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
        Druk in de Slack-appinstellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een werkruimte voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) en werk de URL's bij voordat je maakt
        - bewaar het **Signing Secret** voor aanvraagverificatie
        - installeer de app en kopieer het getoonde **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

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

Gebruik dit alleen voor Socket Mode-werkruimten die Slack-websocket-pong/server-ping-time-outs loggen of op hosts draaien met bekende event-loop starvation. `clientPingTimeout` is de wachttijd voor pong nadat de SDK een client-ping verzendt; `serverPingTimeout` is de wachttijd voor Slack-serverpings. App-berichten en gebeurtenissen blijven applicatiestatus, geen signalen voor transport-liveness.

## Manifest- en scopechecklist

Het basismanifest van de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het blok `settings` (en de `url` van de slash command) verschilt.

Basismanifest (standaard Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

Vervang voor **HTTP Request URLs-modus** `settings` door de HTTP-variant en voeg `url` toe aan elke slash command. Publieke URL vereist:

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

Laat verschillende functies zien die de bovenstaande standaardwaarden uitbreiden.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Meerdere [native slash commands](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerde opdracht met nuance:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat de opdracht `/status` gereserveerd is.
    - Er kunnen niet meer dan 25 slash commands tegelijk beschikbaar worden gemaakt.

    Vervang je bestaande sectie `features.slash_commands` door een subset van [beschikbare opdrachten](/nl/tools/slash-commands#command-list):

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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Gebruik dezelfde lijst `slash_commands` als Socket Mode hierboven en voeg aan elk item `"url": "https://gateway-host.example.com/slack/events"` toe. Voorbeeld:

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
  <Accordion title="Optional authorship scopes (write operations)">
    Voeg de botscope `chat:write.customize` toe als je wilt dat uitgaande berichten de actieve agentidentiteit (aangepaste gebruikersnaam en pictogram) gebruiken in plaats van de standaard Slack-appidentiteit.

    Als je een emoji-pictogram gebruikt, verwacht Slack de syntaxis `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
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
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platte tekststrings
  of SecretRef-objecten.
- Configuratietokens overschrijven env-fallback.
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` env-fallback geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen via configuratie beschikbaar (geen env-fallback) en gebruikt standaard alleen-lezen-gedrag (`userTokenReadOnly: true`).

Gedrag van statussnapshot:

- Slack-accountinspectie houdt per referentie `*Source`- en `*Status`-velden
  bij (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige commando/runtime-pad
  de werkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/directory-leesbewerkingen kan de gebruikerstoken de voorkeur krijgen wanneer deze is geconfigureerd. Voor schrijfbewerkingen blijft de bottoken de voorkeur houden; schrijfbewerkingen met een gebruikerstoken zijn alleen toegestaan wanneer `userTokenReadOnly: false` en de bottoken niet beschikbaar is.
</Tip>

## Acties en gates

Slack-acties worden beheerd door `channels.slack.actions.*`.

Beschikbare actiegroepen in de huidige Slack-tooling:

| Groep      | Standaard |
| ---------- | --------- |
| messages   | enabled   |
| reactions  | enabled   |
| pins       | enabled   |
| memberInfo | enabled   |
| emojiList  | enabled   |

Huidige Slack-berichtacties omvatten `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` en `emoji-list`. `download-file` accepteert Slack-bestands-ID's die worden getoond in placeholders voor inkomende bestanden en retourneert afbeeldingsvoorvertoningen voor afbeeldingen of lokale bestandsmetadata voor andere bestandstypen.

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
    - `dm.groupEnabled` (groep-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-allowlist)

    Prioriteit bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Verouderde `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden nog steeds gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    Koppeling in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaal-allowlist staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (alleen-env-instelling), valt de runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam/ID-resolutie:

    - kanaal-allowlist-vermeldingen en DM-allowlist-vermeldingen worden bij het opstarten opgelost wanneer tokentoegang dit toestaat
    - niet-opgeloste kanaalnaamvermeldingen blijven behouden zoals geconfigureerd, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-eerst; directe gebruikersnaam/slug-matching vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op naam gebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalzoekactie is standaard ID-eerst, dus een op naam gebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stilzwijgend geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op naam gebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Zo vindt u die: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de ID (`C...`) staat aan het einde van de URL.

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

    Vermeldingsbronnen:

    - expliciete app-vermelding (`<@botId>`)
    - regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Besturing per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender`-sleutelformaat: `id:`, `e164:`, `username:`, `name:` of `"*"` wildcard
      (verouderde sleutels zonder prefix worden nog steeds alleen aan `id:` gekoppeld)

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Met standaard `session.dmScope=main` worden Slack-DM's samengevoegd tot de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen threadsessie-achtervoegsels (`:thread:<threadTs>`) maken wanneer van toepassing.
- `channels.slack.thread.historyScope` is standaard `thread`; `thread.inheritParent` is standaard `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel `0` in om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, worden impliciete threadvermeldingen onderdrukt, zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-gate.

Besturing voor antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- verouderde fallback voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` schakelt **alle** antwoordthreads in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags in `"off"`-modus nog steeds worden gerespecteerd. Slack-threads verbergen berichten uit het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

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
- `partial` (standaard): voorbeeldtekst vervangen door de nieuwste gedeeltelijke uitvoer.
- `block`: voorbeeldupdates in chunks toevoegen.
- `progress`: voortgangsstatustekst tonen tijdens het genereren en daarna de definitieve tekst verzenden.
- `streaming.preview.toolProgress`: wanneer conceptvoorbeeld actief is, worden tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht gerouteerd (standaard: `true`). Stel in op `false` om afzonderlijke tool-/voortgangsberichten te behouden.

`channels.slack.streaming.nativeTransport` beheert native tekststreaming van Slack wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn om native tekststreaming en Slack-assistent-threadstatus te tonen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal- en groepschatroots kunnen nog steeds het normale conceptvoorbeeld gebruiken wanneer native streaming niet beschikbaar is.
- Top-level Slack-DM's blijven standaard buiten threads, dus ze tonen geen threadachtige voorbeeldweergave; gebruik threadantwoorden of `typingReaction` als u daar zichtbare voortgang wilt.
- Media en niet-tekstuele payloads vallen terug op normale aflevering.
- Definitieve media-/foutberichten annuleren lopende voorbeeldbewerkingen; geschikte definitieve tekst-/blokberichten flushen alleen wanneer ze het voorbeeld ter plekke kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale aflevering voor resterende payloads.

Gebruik conceptvoorbeeld in plaats van native tekststreaming van Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) wordt automatisch gemigreerd naar `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` wordt automatisch gemigreerd naar `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- verouderde `channels.slack.nativeStreaming` wordt automatisch gemigreerd naar `channels.slack.streaming.nativeTransport`.

## Typreactie-fallback

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run is voltooid. Dit is vooral nuttig buiten threadantwoorden, die een standaardstatusindicator "is aan het typen..." gebruiken.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opschoning wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en aflevering

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload vanaf door Slack gehoste privé-URL's (tokengeauthenticeerde aanvraagstroom) en naar de mediaopslag geschreven wanneer ophalen slaagt en groottelimieten dit toestaan. Bestandplaceholders bevatten de Slack-`fileId`, zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde idle- en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandplaceholder.

    De runtime-limiet voor inkomende grootte is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstchunks gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt splitsen met alinea's eerst in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden bevatten (`thread_ts`)
    - limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Afleverdoelen">
    Expliciete voorkeursdoelen:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's worden geopend via Slack-conversatie-API's bij verzending naar gebruikersdoelen.

  </Accordion>
</AccordionGroup>

## Commando's en slash-gedrag

Slash-commando's verschijnen in Slack als één geconfigureerd commando of meerdere native commando's. Configureer `channels.slack.slashCommand` om commandostandaarden te wijzigen:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native commando's vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden in plaats daarvan ingeschakeld met `channels.slack.commands.native: true` of `commands.native: true` in globale configuraties.

- De automatische modus voor native commando's staat voor Slack **uit**, dus `commands.native: "auto"` schakelt native Slack-commando's niet in.

```txt
/help
```

Menu's voor native argumenten gebruiken een adaptieve weergavestrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: knopblokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met asynchrone optiefiltering wanneer handlers voor interactiviteitsopties beschikbaar zijn
- Slack-limieten overschreden: gecodeerde optiewaarden vallen terug op knoppen

```txt
/think
```

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren commando-uitvoeringen nog steeds naar de doelgesprekssessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan interactieve antwoordbedieningselementen weergeven die door agents zijn opgesteld, maar deze functie is standaard uitgeschakeld.

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

Wanneer dit is ingeschakeld, kunnen agents antwoorddirectieven alleen voor Slack uitsturen:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze directieven worden gecompileerd naar Slack Block Kit en routeren klikken of selecties terug via het bestaande Slack-interactiegebeurtenispad.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-directieven niet naar hun eigen knopensystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen ruwe waarden die door agents zijn opgesteld.
- Als gegenereerde interactieve blokken Slack Block Kit-limieten zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blocks-payload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan optreden als native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de web-UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native DM-/kanaalroutering.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden opgelost wanneer de aanvraag al in Slack terechtkomt en het soort goedkeurings-ID `plugin:` is.
- Autorisatie van goedkeurders wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen aanvragen via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in je Slack-appinstellingen, worden goedkeuringsprompts rechtstreeks in het gesprek weergegeven als Block Kit-knoppen.
Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatig `/approve`-commando opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring de enige route is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt indien mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en minstens één
goedkeurder wordt gevonden. Stel `enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient.
Stel `enabled: true` in om native goedkeuringen geforceerd in te schakelen wanneer goedkeurders worden gevonden.

Standaardgedrag zonder expliciete Slack-configuratie voor exec-goedkeuring:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
je wilt aanmelden voor levering naar de oorspronkelijke chat:

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

Gedeelde `approvals.exec`-doorsturing staat hiervan los. Gebruik dit alleen wanneer prompts voor exec-goedkeuring ook
naar andere chats of expliciete out-of-band doelen moeten worden gerouteerd. Gedeelde `approvals.plugin`-doorsturing staat ook
los; Slack-native knoppen kunnen nog steeds Plugin-goedkeuringen oplossen wanneer die aanvragen al in Slack terechtkomen.

Same-chat `/approve` werkt ook in Slack-kanalen en DM's die al commando's ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige model voor goedkeuringsdoorsturing.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden toegewezen aan systeemgebeurtenissen.
- Threaddoorzendingen ("Ook naar kanaal sturen"-threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Reactie-toevoegings-/verwijderingsgebeurtenissen worden toegewezen aan systeemgebeurtenissen.
- Gebeurtenissen voor lid toetreden/verlaten, kanaal aangemaakt/hernoemd en pin toevoegen/verwijderen worden toegewezen aan systeemgebeurtenissen.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als onvertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Threadstarter en initiële threadgeschiedeniscontext-seeding worden gefilterd op geconfigureerde afzender-allowlists wanneer van toepassing.
- Blokacties en modalinteracties sturen gestructureerde `Slack interaction: ...`-systeemgebeurtenissen uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modal-`view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodoptie; uit laten tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- levering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- beheer/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="No replies in channels">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Op namen gebaseerde sleutels mislukken stil onder `groupPolicy: "allowlist"` omdat kanaalroutering standaard ID-first is. Een ID vinden: klik met rechts op het kanaal in Slack → **Link kopiëren** — de `C...`-waarde aan het einde van de URL is de kanaal-ID.
    - `requireMention`
    - per-kanaal `users`-allowlist

    Nuttige commando's:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Controleer:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (of legacy `channels.slack.dm.policy`)
    - koppelingsgoedkeuringen / allowlist-vermeldingen
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis heeft verzonden zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Valideer bot- en app-tokens en inschakeling van Socket Mode in Slack-appinstellingen.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet vinden.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Valideer:

    - signing secret
    - Webhook-pad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` in account-snapshots
    verschijnt, is het HTTP-account geconfigureerd maar kon de huidige runtime
    de door SecretRef ondersteunde signing secret niet vinden.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Controleer wat je bedoelde:

    - native commandomodus (`channels.slack.commands.native: true`) met overeenkomende slash-commando's die in Slack zijn geregistreerd
    - of enkele slash-commandmodus (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikers-allowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor attachment vision

Slack kan gedownloade media aan de agentbeurt toevoegen wanneer Slack-bestandsdownloads slagen en groottelimieten dit toestaan. Afbeeldingsbestanden kunnen worden doorgegeven via het pad voor mediabegrip of rechtstreeks naar een vision-geschikt antwoordmodel; andere bestanden worden behouden als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                  | Opmerkingen                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP-afbeeldingen | Slack-bestands-URL | Gedownload en aan de beurt toegevoegd voor vision-geschikte verwerking             | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)         |
| PDF-bestanden                  | Slack-bestands-URL   | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Slack-inbound converteert PDF's niet automatisch naar image-vision-invoer |
| Andere bestanden               | Slack-bestands-URL   | Waar mogelijk gedownload en beschikbaar gemaakt als bestandscontext                | Binaire bestanden worden niet behandeld als afbeeldingsinvoer             |
| Threadantwoorden               | Threadstarterbestanden | Rootberichtbestanden kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft | Starters met alleen bestanden gebruiken een bijlageplaceholder             |
| Multi-afbeeldingsberichten     | Meerdere Slack-bestanden | Elk bestand wordt afzonderlijk geëvalueerd                                      | Slack-verwerking is beperkt tot acht bestanden per bericht                |

### Inbound-pipeline

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf de privé-URL van Slack met het bottoken (`xoxb-...`).
2. Het bestand wordt bij succes naar de mediaopslag geschreven.
3. Gedownloade mediapaden en contenttypen worden toegevoegd aan de inbound-context.
4. Image-geschikte model-/toolpaden kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ze kunnen verwerken.

### Overerving van thread-rootbijlagen

Wanneer een bericht in een thread binnenkomt (met een `thread_ts`-parent):

- Als het antwoord zelf geen directe media heeft en het opgenomen rootbericht bestanden bevat, kan Slack de rootbestanden hydrateren als threadstartercontext.
- Directe antwoordbijlagen hebben voorrang op rootberichtbijlagen.
- Een rootbericht dat alleen bestanden en geen tekst heeft, wordt weergegeven met een bijlageplaceholder zodat de fallback de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk verwerkt via de mediapijplijn.
- Gedownloade mediaverwijzingen worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de eventpayload.
- Een fout bij het downloaden van één bijlage blokkeert de andere niet.

### Grootte-, download- en modellimieten

- **Groottelimiet**: Standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: Bestanden die Slack niet kan aanbieden, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en Slack-auth-/login-HTML-reacties worden overgeslagen in plaats van gerapporteerd als niet-ondersteunde indelingen.
- **Vision-model**: Afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit vision ondersteunt, of het afbeeldingsmodel dat is geconfigureerd bij `agents.defaults.imageModel`.

### Bekende beperkingen

| Scenario                                      | Huidig gedrag                                                                       | Tijdelijke oplossing                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL                   | Bestand overgeslagen; geen fout getoond                                             | Upload het bestand opnieuw in Slack                                               |
| Vision-model niet geconfigureerd              | Afbeeldingsbijlagen worden opgeslagen als mediaverwijzingen, maar niet geanalyseerd als afbeeldingen | Configureer `agents.defaults.imageModel` of gebruik een vision-geschikt antwoordmodel |
| Zeer grote afbeeldingen (> 20 MB standaard)   | Overgeslagen volgens de groottelimiet                                                | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                        |
| Doorgestuurde/gedeelde bijlagen               | Tekst en door Slack gehoste afbeeldings-/bestandsmedia zijn best-effort             | Deel ze rechtstreeks opnieuw in de OpenClaw-thread                                |
| PDF-bijlagen                                  | Opgeslagen als bestands-/mediacontext, niet automatisch via image vision gerouteerd | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse   |

### Gerelateerde documentatie

- [Pijplijn voor mediabegrip](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack-bijlagevision inschakelen
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live verificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

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
    Dreigingsmodel en hardening.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Config-indeling en prioriteit.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Commandocatalogus en gedrag.
  </Card>
</CardGroup>
