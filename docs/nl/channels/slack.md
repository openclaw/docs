---
read_when:
    - Slack instellen of de Slack-socket-/HTTP-modus debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode + HTTP-aanvraag-URL's)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Productieklaar voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP Request URLs worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelmodus.
  </Card>
  <Card title="Slash-commando's" icon="terminal" href="/nl/tools/slash-commands">
    Native commandogedrag en commandocatalogus.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelplaybooks.
  </Card>
</CardGroup>

## Snelle installatie

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
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) en werk de URL's bij voordat je de app maakt
        - sla het **Signing Secret** op voor verzoekverificatie
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

        Geef elk account een afzonderlijk `webhookPath` (standaard `/slack/events`), zodat registraties niet botsen.
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

## Transportafstemming voor Socket Mode

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

Gebruik dit alleen voor Socket Mode-workspaces die Slack-websocket-pong- of server-ping-time-outs loggen, of die draaien op hosts met bekende event-loop-starvation. `clientPingTimeout` is de wachttijd voor pong nadat de SDK een client-ping verzendt; `serverPingTimeout` is de wachttijd voor Slack-serverpings. Appberichten en events blijven applicatiestatus, geen signalen voor transportbeschikbaarheid.

## Manifest- en scopechecklist

Het basismanifest voor de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het blok `settings` (en de `url` van het slash-commando) verschilt.

Basismnifest (Socket Mode standaard):

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

Voor de modus **HTTP Request URLs** vervang je `settings` door de HTTP-variant en voeg je `url` toe aan elk slash-commando. Publieke URL vereist:

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

Toon verschillende functies die de bovenstaande standaardwaarden uitbreiden.

<AccordionGroup>
  <Accordion title="Optionele native slash-commando's">

    Meerdere [native slash-commando's](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerd commando, met nuance:

    - Gebruik `/agentstatus` in plaats van `/status`, omdat het commando `/status` is gereserveerd.
    - Er kunnen niet meer dan 25 slash-commando's tegelijk beschikbaar worden gemaakt.

    Vervang je bestaande sectie `features.slash_commands` door een subset van [beschikbare commando's](/nl/tools/slash-commands#command-list):

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
        Gebruik dezelfde lijst `slash_commands` als hierboven bij Socket Mode en voeg `"url": "https://gateway-host.example.com/slack/events"` toe aan elke entry. Voorbeeld:

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
  <Accordion title="Optionele authorship-scopes (schrijfbewerkingen)">
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
    - `search:read` (als je afhankelijk bent van Slack-zoekleesbewerkingen)

  </Accordion>
</AccordionGroup>

## Tokenmodel

- `botToken` + `appToken` zijn vereist voor Socket Mode.
- HTTP-modus vereist `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platteteksttekenreeksen of SecretRef-objecten.
- Configuratietokens overschrijven de env-terugval.
- De env-terugval `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen via configuratie beschikbaar (geen env-terugval) en gebruikt standaard alleen-lezen-gedrag (`userTokenReadOnly: true`).

Gedrag van statusmomentopname:

- Slack-accountinspectie volgt per referentie de velden `*Source` en `*Status` (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef of een andere niet-inline geheime bron, maar dat het huidige opdracht-/runtimepad de werkelijke waarde niet kon ophalen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/directory-lezingen kan het gebruikerstoken de voorkeur krijgen wanneer het is geconfigureerd. Voor schrijfacties blijft het bottoken de voorkeur houden; schrijven met gebruikerstokens is alleen toegestaan wanneer `userTokenReadOnly: false` en het bottoken niet beschikbaar is.
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
    `channels.slack.dmPolicy` beheert DM-toegang. `channels.slack.allowFrom` is de canonieke DM-toelatingslijst.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.slack.allowFrom` `"*"` bevat)
    - `disabled`

    DM-vlaggen:

    - `dm.enabled` (standaard true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (groeps-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-toelatingslijst)

    Prioriteit bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Benoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Benoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Legacy `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden voor compatibiliteit nog steeds gelezen. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    Koppeling in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaaltoelatingslijst staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's** (bijvoorbeeld `C12345678`) als configuratiesleutels gebruiken.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (installatie alleen via env), valt runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam-/ID-resolutie:

    - kanaaltoelatingslijstvermeldingen en DM-toelatingslijstvermeldingen worden bij het opstarten opgelost wanneer tokentoegang dat toestaat
    - niet-opgeloste kanaalnaamvermeldingen blijven geconfigureerd zoals ze zijn, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-eerst; directe gebruikersnaam-/slugmatching vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op naam gebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalopzoeking is standaard ID-eerst, dus een op naam gebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stilzwijgend geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op naam gebaseerde sleutel lijkt te werken.

    Gebruik altijd de Slack-kanaal-ID als sleutel. Om die te vinden: klik met rechts op het kanaal in Slack → **Link kopiëren** — de ID (`C...`) staat aan het einde van de URL.

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
    Kanaalberichten zijn standaard door vermeldingen afgeschermd.

    Bronnen voor vermeldingen:

    - expliciete app-vermelding (`<@botId>`)
    - regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Besturing per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (toelatingslijst)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - sleutelformaat voor `toolsBySender`: `id:`, `e164:`, `username:`, `name:` of jokerteken `"*"`
      (legacy sleutels zonder prefix worden nog steeds alleen aan `id:` gekoppeld)

    `allowBots` is conservatief voor kanalen en privékanelen: door bots geschreven roombberichten worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-toelatingslijst van die room staat, of wanneer ten minste één expliciete Slack-eigenaars-ID uit `channels.slack.allowFrom` momenteel lid is van de room. Jokertekens en eigenaarsvermeldingen op weergavenaam voldoen niet aan aanwezigheid van de eigenaar. Aanwezigheid van de eigenaar gebruikt Slack `conversations.members`; zorg dat de app het bijpassende leesbereik heeft voor het roomtype (`channels:read` voor openbare kanalen, `groups:read` voor privékanelen). Als het ophalen van leden mislukt, laat OpenClaw het door de bot geschreven roombbericht vallen.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Met standaard `session.dmScope=main` worden Slack-DM's samengevoegd in de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen indien van toepassing threadsessiesuffixen maken (`:thread:<threadTs>`).
- Standaard voor `channels.slack.thread.historyScope` is `thread`; standaard voor `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel in op `0` om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, worden impliciete threadvermeldingen onderdrukt zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-gate.

Besturing voor antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- legacy terugval voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` schakelt **alle** antwoordthreading in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags in `"off"`-modus nog steeds worden gehonoreerd. Slack-threads verbergen berichten uit het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
</Note>

## Ack-reacties

`ackReaction` verzendt een bevestigingsemoji terwijl OpenClaw een inkomend bericht verwerkt.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- terugval naar emoji van agentidentiteit (`agents.list[].identity.emoji`, anders "👀")

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"eyes"`).
- Gebruik `""` om de reactie voor het Slack-account of globaal uit te schakelen.

## Tekststreaming

`channels.slack.streaming` beheert livevoorbeeldgedrag:

- `off`: schakel livevoorbeeldstreaming uit.
- `partial` (standaard): vervang voorbeeldtekst door de nieuwste gedeeltelijke uitvoer.
- `block`: voeg chunkgewijze voorbeeldupdates toe.
- `progress`: toon voortgangsstatustekst tijdens het genereren en verzend daarna de definitieve tekst.
- `streaming.preview.toolProgress`: wanneer conceptvoorbeeld actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht (standaard: `true`). Stel in op `false` om afzonderlijke tool-/voortgangsberichten te behouden.

`channels.slack.streaming.nativeTransport` beheert Slack native tekststreaming wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn om native tekststreaming en Slack-assistentthreadstatus te laten verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal- en groepschatroots kunnen nog steeds het normale conceptvoorbeeld gebruiken wanneer native streaming niet beschikbaar is.
- Slack-DM's op topniveau blijven standaard buiten threads, dus ze tonen het threadachtige voorbeeld niet; gebruik threadantwoorden of `typingReaction` als u daar zichtbare voortgang wilt.
- Media en niet-tekstpayloads vallen terug op normale aflevering.
- Definitieve media-/foutberichten annuleren wachtende voorbeeldbewerkingen; geschikte definitieve tekst-/blokberichten worden alleen geflusht wanneer ze het voorbeeld ter plekke kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale aflevering voor resterende payloads.

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

Legacy sleutels:

- `channels.slack.streamMode` (`replace | status_final | append`) wordt automatisch gemigreerd naar `channels.slack.streaming.mode`.
- booleaanse `channels.slack.streaming` wordt automatisch gemigreerd naar `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- legacy `channels.slack.nativeStreaming` wordt automatisch gemigreerd naar `channels.slack.streaming.nativeTransport`.

## Terugval voor typreactie

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run is voltooid. Dit is het nuttigst buiten threadantwoorden, die een standaardstatusindicator "is aan het typen..." gebruiken.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opschoning wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en aflevering

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload van door Slack gehoste privé-URL's (tokengeauthenticeerde aanvraagstroom) en naar de mediaopslag geschreven wanneer ophalen slaagt en de groottelimieten dat toestaan. Bestandsplaatsaanduidingen bevatten de Slack `fileId`, zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde idle- en totale time-outs. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandsplaatsaanduiding.

    De runtimegroottelimiet voor inkomende inhoud is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstfragmenten gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt alinea-eerst splitsen in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen thread-antwoorden (`thread_ts`) bevatten
    - limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen MIME-soortstandaarden uit de mediapijplijn

  </Accordion>

  <Accordion title="Bezorgdoelen">
    Voorkeursdoelen die expliciet zijn opgegeven:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's worden via Slack-conversatie-API's geopend bij verzending naar gebruikersdoelen.

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

- Automatische modus voor native opdrachten staat **uit** voor Slack, dus `commands.native: "auto"` schakelt native Slack-opdrachten niet in.

```txt
/help
```

Menu's voor native argumenten gebruiken een adaptieve renderingstrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: knopblokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met asynchrone optiefiltering wanneer handlers voor interactiviteitsopties beschikbaar zijn
- overschreden Slack-limieten: gecodeerde optiewaarden vallen terug op knoppen

```txt
/think
```

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren opdrachtuitvoeringen nog steeds naar de doelgesprekssessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan door agents geschreven interactieve antwoordbesturingselementen renderen, maar deze functie is standaard uitgeschakeld.

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

Wanneer dit is ingeschakeld, kunnen agents alleen-voor-Slack antwoorddirectieven uitsturen:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze directieven worden gecompileerd naar Slack Block Kit en routeren klikken of selecties terug via het bestaande pad voor Slack-interactiegebeurtenissen.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-directieven niet naar hun eigen knoppensystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde ondoorzichtige tokens, geen ruwe door agents geschreven waarden.
- Als gegenereerde interactieve blokken de Slack Block Kit-limieten zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blocks-payload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan fungeren als een native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de Web UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native DM-/kanaalroutering.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden afgehandeld wanneer de aanvraag al in Slack terechtkomt en het soort goedkeurings-id `plugin:` is.
- Autorisatie van goedkeurders wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen aanvragen via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in je Slack-appinstellingen, worden goedkeuringsprompts direct in het gesprek als Block Kit-knoppen gerenderd.
Wanneer die knoppen aanwezig zijn, zijn ze de primaire goedkeurings-UX; OpenClaw
moet alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat aangeeft dat chatgoedkeuringen
niet beschikbaar zijn of handmatige goedkeuring de enige route is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één
goedkeurder wordt opgelost. Stel `enabled: false` in om Slack expliciet als native goedkeuringsclient uit te schakelen.
Stel `enabled: true` in om native goedkeuringen geforceerd in te schakelen wanneer goedkeurders worden opgelost.

Standaardgedrag zonder expliciete Slack-configuratie voor exec-goedkeuring:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
origin-chatbezorging wilt inschakelen:

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

Gedeelde `approvals.exec`-doorsturing staat hiervan los. Gebruik dit alleen wanneer prompts voor exec-goedkeuringen ook
naar andere chats of expliciete out-of-band doelen moeten worden gerouteerd. Gedeelde `approvals.plugin`-doorsturing staat ook
los; Slack-native knoppen kunnen nog steeds Plugin-goedkeuringen afhandelen wanneer die aanvragen al in Slack terechtkomen.

Zelfde-chat `/approve` werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige model voor goedkeuringsdoorsturing.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden naar systeemgebeurtenissen gemapt.
- Thread-broadcasts ("Ook naar kanaal verzenden"-threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Gebeurtenissen voor het toevoegen/verwijderen van reacties worden naar systeemgebeurtenissen gemapt.
- Gebeurtenissen voor lid toetreden/verlaten, kanaal gemaakt/hernoemd en pin toevoegen/verwijderen worden naar systeemgebeurtenissen gemapt.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Thread-starter en initiële seeding van thread-geschiedeniscontext worden gefilterd op geconfigureerde afzender-allowlists wanneer van toepassing.
- Blokacties en modale interacties sturen gestructureerde `Slack interaction: ...`-systeemgebeurtenissen uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modale `view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="Slack-velden met hoge signaalwaarde">

- modus/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodvoorziening; laat uit tenzij nodig)
- kanaaltoegang: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/geschiedenis: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- bezorging: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- beheer/functies: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Geen antwoorden in kanalen">
    Controleer, in volgorde:

    - `groupPolicy`
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-id's zijn** (`C12345678`), geen namen (`#channel-name`). Op namen gebaseerde sleutels falen stil onder `groupPolicy: "allowlist"` omdat kanaalroutering standaard ID-eerst is. Om een ID te vinden: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de `C...`-waarde aan het einde van de URL is de kanaal-id.
    - `requireMention`
    - per-kanaal `users`-allowlist

    Handige opdrachten:

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
    - koppelingsgoedkeuringen / allowlist-items
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs met `drop message_changed`
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis heeft verzonden zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket-modus maakt geen verbinding">
    Valideer bot- en app-tokens en of Socket Mode is ingeschakeld in de Slack-appinstellingen.

    Als `openclaw channels status --probe --json` `botTokenStatus` of
    `appTokenStatus: "configured_unavailable"` toont, is het Slack-account
    geconfigureerd, maar kon de huidige runtime de door SecretRef ondersteunde
    waarde niet oplossen.

  </Accordion>

  <Accordion title="HTTP-modus ontvangt geen gebeurtenissen">
    Valideer:

    - ondertekeningsgeheim
    - Webhook-pad
    - Slack-aanvraag-URL's (Events + Interactivity + Slash Commands)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` in account-snapshots
    verschijnt, is het HTTP-account geconfigureerd, maar kon de huidige runtime het
    door SecretRef ondersteunde ondertekeningsgeheim niet oplossen.

  </Accordion>

  <Accordion title="Native/slash-opdrachten worden niet uitgevoerd">
    Controleer wat je bedoelde:

    - native opdrachtmodus (`channels.slack.commands.native: true`) met overeenkomende slash-opdrachten geregistreerd in Slack
    - of één-slash-opdrachtmodus (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikers-allowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor attachment vision

Slack kan gedownloade media aan de agent-turn toevoegen wanneer Slack-bestandsdownloads slagen en de groottelimieten dit toestaan. Afbeeldingsbestanden kunnen via het pad voor mediabegrip worden doorgegeven of direct aan een antwoordmodel met vision-mogelijkheden; andere bestanden worden behouden als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                   | Opmerkingen                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP-afbeeldingen | Slack-bestands-URL | Gedownload en aan de turn toegevoegd voor verwerking met vision-mogelijkheden    | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)         |
| PDF-bestanden                  | Slack-bestands-URL   | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Slack-inbound converteert PDF's niet automatisch naar image-vision-invoer |
| Andere bestanden               | Slack-bestands-URL   | Waar mogelijk gedownload en beschikbaar gemaakt als bestandscontext              | Binaire bestanden worden niet als afbeeldingsinvoer behandeld             |
| Thread-antwoorden              | Thread-starterbestanden | Rootberichtbestanden kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft | Starters met alleen bestanden gebruiken een attachment-placeholder         |
| Berichten met meerdere afbeeldingen | Meerdere Slack-bestanden | Elk bestand wordt afzonderlijk geëvalueerd                                      | Slack-verwerking is beperkt tot acht bestanden per bericht                |

### Inbound-pijplijn

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand via de privé-URL van Slack met het bot-token (`xoxb-...`).
2. Het bestand wordt bij succes naar de mediaopslag geschreven.
3. Gedownloade mediapaden en inhoudstypen worden toegevoegd aan de inkomende context.
4. Model-/toolpaden die afbeeldingen ondersteunen, kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediareferenties voor tools die ze kunnen verwerken.

### Overerving van bijlagen uit de thread-root

Wanneer een bericht in een thread binnenkomt (met een `thread_ts`-bovenliggend bericht):

- Als het antwoord zelf geen directe media heeft en het meegeleverde rootbericht bestanden bevat, kan Slack de rootbestanden aanvullen als context van de threadstarter.
- Directe antwoordbijlagen hebben voorrang op bijlagen van het rootbericht.
- Een rootbericht dat alleen bestanden en geen tekst bevat, wordt weergegeven met een bijlageplaceholder, zodat de fallback de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer één Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk verwerkt via de mediapipeline.
- Gedownloade mediareferenties worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt de bestandsvolgorde van Slack in de event-payload.
- Een mislukte download van één bijlage blokkeert de andere niet.

### Limieten voor grootte, downloaden en modellen

- **Groottelimiet**: Standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: Bestanden die Slack niet kan leveren, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en HTML-reacties voor Slack-authenticatie/-login worden overgeslagen in plaats van gemeld als niet-ondersteunde indelingen.
- **Visiemodel**: Afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dit vision ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende beperkingen

| Scenario                                      | Huidig gedrag                                                                  | Tijdelijke oplossing                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL                   | Bestand overgeslagen; geen fout weergegeven                                    | Upload het bestand opnieuw in Slack                                                |
| Visiemodel niet geconfigureerd                | Afbeeldingsbijlagen worden opgeslagen als mediareferenties, maar niet geanalyseerd als afbeeldingen | Configureer `agents.defaults.imageModel` of gebruik een antwoordmodel dat vision ondersteunt |
| Zeer grote afbeeldingen (> 20 MB standaard)   | Overgeslagen volgens de groottelimiet                                          | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                         |
| Doorgestuurde/gedeelde bijlagen               | Tekst en door Slack gehoste afbeeldings-/bestandsmedia worden best-effort verwerkt | Deel ze opnieuw rechtstreeks in de OpenClaw-thread                                 |
| PDF-bijlagen                                  | Opgeslagen als bestands-/mediacontext, niet automatisch via image vision gerouteerd | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse    |

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
    Configuratie-indeling en prioriteit.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Commandocatalogus en gedrag.
  </Card>
</CardGroup>
