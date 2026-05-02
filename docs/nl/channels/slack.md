---
read_when:
    - Slack instellen of de Slack-socket-/HTTP-modus debuggen
summary: Slack-configuratie en runtimegedrag (Socket Mode + HTTP-aanvraag-URL's)
title: Slack
x-i18n:
    generated_at: "2026-05-02T11:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

Klaar voor productie voor DM's en kanalen via Slack-appintegraties. De standaardmodus is Socket Mode; HTTP Request URLs worden ook ondersteund.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Slack-DM's gebruiken standaard de koppelingsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/nl/tools/slash-commands">
    Native opdrachtwerking en opdrachtencatalogus.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverschrijdende diagnostiek en reparatiedraaiboeken.
  </Card>
</CardGroup>

## Snelle setup

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Druk in de Slack-appinstellingen op de knop **[Create New App](https://api.slack.com/apps/new)**:

        - kies **from a manifest** en selecteer een workspace voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) hieronder en ga door met aanmaken
        - genereer een **App-Level Token** (`xapp-...`) met `connections:write`
        - installeer de app en kopieer de getoonde **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

        Aanbevolen SecretRef-setup:

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

        - kies **from a manifest** en selecteer een workspace voor je app
        - plak het [voorbeeldmanifest](#manifest-and-scope-checklist) en werk de URL's bij voordat je aanmaakt
        - sla de **Signing Secret** op voor aanvraagverificatie
        - installeer de app en kopieer de getoonde **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

        Aanbevolen SecretRef-setup:

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

        Geef elk account een aparte `webhookPath` (standaard `/slack/events`) zodat registraties niet botsen.
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

Gebruik dit alleen voor Socket Mode-workspaces die Slack-websocket-pong/server-ping-time-outs loggen of draaien op hosts met bekende event-loop-starvation. `clientPingTimeout` is de pong-wachttijd nadat de SDK een client-ping verzendt; `serverPingTimeout` is de wachttijd voor Slack-serverpings. App-berichten en events blijven applicatiestatus, geen transport-liveness-signalen.

## Manifest- en scopechecklist

Het basismanifest voor de Slack-app is hetzelfde voor Socket Mode en HTTP Request URLs. Alleen het blok `settings` (en de `url` van de slash command) verschilt.

Basismmanifest (Socket Mode standaard):

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

Vervang voor de modus **HTTP Request URLs** `settings` door de HTTP-variant en voeg `url` toe aan elke slash command. Openbare URL vereist:

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

Bied verschillende functies aan die de bovenstaande standaardwaarden uitbreiden.

Het standaardmanifest schakelt het tabblad **Home** van Slack App Home in en abonneert zich op `app_home_opened`. Wanneer een workspace-lid het tabblad Home opent, publiceert OpenClaw een veilige standaard Home-weergave met `views.publish`; er wordt geen gespreks-payload of privéconfiguratie opgenomen. Het tabblad **Messages** blijft ingeschakeld voor Slack-DM's.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Meerdere [native slash commands](#commands-and-slash-behavior) kunnen worden gebruikt in plaats van één geconfigureerde opdracht, met nuance:

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
        Gebruik dezelfde lijst `slash_commands` als Socket Mode hierboven en voeg `"url": "https://gateway-host.example.com/slack/events"` toe aan elke vermelding. Voorbeeld:

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
    Voeg de bot-scope `chat:write.customize` toe als je wilt dat uitgaande berichten de actieve agentidentiteit gebruiken (aangepaste gebruikersnaam en pictogram) in plaats van de standaard Slack-appidentiteit.

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
- `botToken`, `appToken`, `signingSecret` en `userToken` accepteren platteteksttekenreeksen
  of SecretRef-objecten.
- Configuratietokens overschrijven de env-fallback.
- De env-fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` geldt alleen voor het standaardaccount.
- `userToken` (`xoxp-...`) is alleen via configuratie beschikbaar (geen env-fallback) en gebruikt standaard alleen-lezen-gedrag (`userTokenReadOnly: true`).

Gedrag van statussnapshot:

- Slack-accountinspectie volgt per referentie `*Source`- en `*Status`-velden
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status is `available`, `configured_unavailable` of `missing`.
- `configured_unavailable` betekent dat het account is geconfigureerd via SecretRef
  of een andere niet-inline geheime bron, maar dat het huidige command-/runtimepad
  de werkelijke waarde niet kon oplossen.
- In HTTP-modus wordt `signingSecretStatus` opgenomen; in Socket Mode is het
  vereiste paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Voor acties/directory-leesacties kan het user token de voorkeur krijgen wanneer het is geconfigureerd. Voor schrijfacties blijft het bot token de voorkeur houden; user-token-schrijfacties zijn alleen toegestaan wanneer `userTokenReadOnly: false` en het bot token niet beschikbaar is.
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

## Toegangsbeheer en routering

<Tabs>
  <Tab title="DM-beleid">
    `channels.slack.dmPolicy` beheert DM-toegang. `channels.slack.allowFrom` is de canonieke DM-allowlist.

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `channels.slack.allowFrom` `"*"` bevat)
    - `disabled`

    DM-flags:

    - `dm.enabled` (standaard true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (verouderd)
    - `dm.groupEnabled` (groeps-DM's standaard false)
    - `dm.groupChannels` (optionele MPIM-allowlist)

    Prioriteit bij meerdere accounts:

    - `channels.slack.accounts.default.allowFrom` geldt alleen voor het `default`-account.
    - Genoemde accounts erven `channels.slack.allowFrom` wanneer hun eigen `allowFrom` niet is ingesteld.
    - Genoemde accounts erven `channels.slack.accounts.default.allowFrom` niet.

    Verouderde `channels.slack.dm.policy` en `channels.slack.dm.allowFrom` worden nog gelezen voor compatibiliteit. `openclaw doctor --fix` migreert ze naar `dmPolicy` en `allowFrom` wanneer dat kan zonder de toegang te wijzigen.

    Koppelen in DM's gebruikt `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanaalbeleid">
    `channels.slack.groupPolicy` beheert kanaalafhandeling:

    - `open`
    - `allowlist`
    - `disabled`

    De kanaalallowlist staat onder `channels.slack.channels` en **moet stabiele Slack-kanaal-ID's gebruiken** (bijvoorbeeld `C12345678`) als configuratiesleutels.

    Runtime-opmerking: als `channels.slack` volledig ontbreekt (alleen-env-configuratie), valt de runtime terug op `groupPolicy="allowlist"` en logt een waarschuwing (zelfs als `channels.defaults.groupPolicy` is ingesteld).

    Naam-/ID-resolutie:

    - kanaalallowlist-items en DM-allowlist-items worden bij het opstarten opgelost wanneer tokentoegang dat toestaat
    - niet-opgeloste kanaalnaamitems blijven zoals geconfigureerd behouden, maar worden standaard genegeerd voor routering
    - inkomende autorisatie en kanaalroutering zijn standaard ID-first; directe matching op gebruikersnaam/slug vereist `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Op naam gebaseerde sleutels (`#channel-name` of `channel-name`) matchen **niet** onder `groupPolicy: "allowlist"`. De kanaalopzoeking is standaard ID-first, dus een op naam gebaseerde sleutel zal nooit succesvol routeren en alle berichten in dat kanaal worden stil geblokkeerd. Dit verschilt van `groupPolicy: "open"`, waarbij de kanaalsleutel niet vereist is voor routering en een op naam gebaseerde sleutel lijkt te werken.

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
    Kanaalberichten zijn standaard beveiligd met een vermeldingsgate.

    Vermeldingsbronnen:

    - expliciete app-vermelding (`<@botId>`)
    - Slack-gebruikersgroepvermelding (`<!subteam^S...>`) wanneer de botgebruiker lid is van die gebruikersgroep; vereist `usergroups:read`
    - vermeldingsregexpatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - impliciet antwoord-op-bot-threadgedrag (uitgeschakeld wanneer `thread.requireExplicitMention` `true` is)

    Besturing per kanaal (`channels.slack.channels.<id>`; namen alleen via opstartresolutie of `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - sleutelindeling voor `toolsBySender`: `id:`, `e164:`, `username:`, `name:` of `"*"`-wildcard
      (verouderde sleutels zonder prefix worden nog alleen naar `id:` gemapt)

    `allowBots` is conservatief voor kanalen en privékanalen: kamerberichten die door bots zijn geschreven, worden alleen geaccepteerd wanneer de verzendende bot expliciet in de `users`-allowlist van die kamer staat, of wanneer minstens één expliciete Slack-owner-ID uit `channels.slack.allowFrom` momenteel lid is van de kamer. Wildcards en owner-items op weergavenaam voldoen niet aan owner-aanwezigheid. Owner-aanwezigheid gebruikt Slack `conversations.members`; zorg dat de app de bijpassende leesscope heeft voor het kamertype (`channels:read` voor openbare kanalen, `groups:read` voor privékanalen). Als het opzoeken van leden mislukt, laat OpenClaw het door de bot geschreven kamerbericht vallen.

  </Tab>
</Tabs>

## Threads, sessies en antwoordtags

- DM's routeren als `direct`; kanalen als `channel`; MPIM's als `group`.
- Slack-routebindingen accepteren ruwe peer-ID's plus Slack-doelvormen zoals `channel:C12345678`, `user:U12345678` en `<@U12345678>`.
- Met standaard `session.dmScope=main` worden Slack-DM's samengevoegd naar de hoofdsessie van de agent.
- Kanaalsessies: `agent:<agentId>:slack:channel:<channelId>`.
- Threadantwoorden kunnen threadsessieachtervoegsels maken (`:thread:<threadTs>`) wanneer van toepassing.
- De standaard voor `channels.slack.thread.historyScope` is `thread`; de standaard voor `thread.inheritParent` is `false`.
- `channels.slack.thread.initialHistoryLimit` bepaalt hoeveel bestaande threadberichten worden opgehaald wanneer een nieuwe threadsessie start (standaard `20`; stel `0` in om uit te schakelen).
- `channels.slack.thread.requireExplicitMention` (standaard `false`): wanneer `true`, worden impliciete threadvermeldingen onderdrukt zodat de bot alleen reageert op expliciete `@bot`-vermeldingen binnen threads, zelfs wanneer de bot al aan de thread heeft deelgenomen. Zonder dit omzeilen antwoorden in een thread waaraan de bot heeft deelgenomen de `requireMention`-gate.

Besturing voor antwoordthreads:

- `channels.slack.replyToMode`: `off|first|all|batched` (standaard `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- verouderde fallback voor directe chats: `channels.slack.dm.replyToMode`

Handmatige antwoordtags worden ondersteund:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` schakelt **alle** antwoordthreading in Slack uit, inclusief expliciete `[[reply_to_*]]`-tags. Dit verschilt van Telegram, waar expliciete tags nog steeds worden gerespecteerd in `"off"`-modus. Slack-threads verbergen berichten voor het kanaal, terwijl Telegram-antwoorden inline zichtbaar blijven.
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

- `off`: schakel livevoorbeeldstreaming uit.
- `partial` (standaard): vervang voorbeeldtekst door de nieuwste gedeeltelijke uitvoer.
- `block`: voeg voorbeeldupdates in chunks toe.
- `progress`: toon voortgangsstatustekst tijdens het genereren en verzend daarna de definitieve tekst.
- `streaming.preview.toolProgress`: wanneer conceptvoorbeeld actief is, routeer tool-/voortgangsupdates naar hetzelfde bewerkte voorbeeldbericht (standaard: `true`). Stel `false` in om aparte tool-/voortgangsberichten te behouden.

`channels.slack.streaming.nativeTransport` beheert native Slack-tekststreaming wanneer `channels.slack.streaming.mode` `partial` is (standaard: `true`).

- Er moet een antwoordthread beschikbaar zijn om native tekststreaming en Slack-assistant-threadstatus te laten verschijnen. Threadselectie volgt nog steeds `replyToMode`.
- Kanaal- en groepschatroots kunnen nog steeds het normale conceptvoorbeeld gebruiken wanneer native streaming niet beschikbaar is.
- Top-level Slack-DM's blijven standaard buiten threads, waardoor ze geen thread-achtig voorbeeld tonen; gebruik threadantwoorden of `typingReaction` als je daar zichtbare voortgang wilt.
- Media en niet-tekstpayloads vallen terug op normale aflevering.
- Definitieve media-/foutberichten annuleren openstaande voorbeeldbewerkingen; geschikte definitieve tekst-/blokberichten flushen alleen wanneer ze het voorbeeld op zijn plaats kunnen bewerken.
- Als streaming halverwege een antwoord mislukt, valt OpenClaw terug op normale aflevering voor resterende payloads.

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

Verouderde sleutels:

- `channels.slack.streamMode` (`replace | status_final | append`) wordt automatisch gemigreerd naar `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` wordt automatisch gemigreerd naar `channels.slack.streaming.mode` en `channels.slack.streaming.nativeTransport`.
- verouderde `channels.slack.nativeStreaming` wordt automatisch gemigreerd naar `channels.slack.streaming.nativeTransport`.

## Fallback voor typreactie

`typingReaction` voegt een tijdelijke reactie toe aan het inkomende Slack-bericht terwijl OpenClaw een antwoord verwerkt, en verwijdert die wanneer de run is voltooid. Dit is het nuttigst buiten threadantwoorden, die een standaardstatusindicator "is typing..." gebruiken.

Resolutievolgorde:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Opmerkingen:

- Slack verwacht shortcodes (bijvoorbeeld `"hourglass_flowing_sand"`).
- De reactie is best-effort en opruiming wordt automatisch geprobeerd nadat het antwoord- of foutpad is voltooid.

## Media, chunking en aflevering

<AccordionGroup>
  <Accordion title="Inkomende bijlagen">
    Slack-bestandsbijlagen worden gedownload via door Slack gehoste privé-URL's (token-geauthenticeerde aanvraagstroom) en naar de mediaopslag geschreven wanneer ophalen slaagt en groottebeperkingen dit toestaan. Bestandsplaatsaanduidingen bevatten de Slack `fileId`, zodat agents het oorspronkelijke bestand kunnen ophalen met `download-file`.

    Downloads gebruiken begrensde time-outs voor inactiviteit en totale duur. Als het ophalen van Slack-bestanden vastloopt of mislukt, blijft OpenClaw het bericht verwerken en valt het terug op de bestandsplaatsaanduiding.

    De runtime-limiet voor inkomende grootte is standaard `20MB`, tenzij overschreven door `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Uitgaande tekst en bestanden">
    - tekstchunks gebruiken `channels.slack.textChunkLimit` (standaard 4000)
    - `channels.slack.chunkMode="newline"` schakelt splitsen op basis van alinea's eerst in
    - bestandsverzendingen gebruiken Slack-upload-API's en kunnen threadantwoorden (`thread_ts`) bevatten
    - de limiet voor uitgaande media volgt `channels.slack.mediaMaxMb` wanneer geconfigureerd; anders gebruiken kanaalverzendingen de standaardwaarden per MIME-soort uit de mediapijplijn

  </Accordion>

  <Accordion title="Bezorgdoelen">
    Expliciet gewenste doelen:

    - `user:<id>` voor DM's
    - `channel:<id>` voor kanalen

    Slack-DM's met alleen tekst/blokken kunnen direct naar gebruikers-ID's posten; bestandsuploads en threaded verzendingen openen eerst de DM via Slack-conversatie-API's, omdat die paden een concreet conversatie-ID vereisen.

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

Native opdrachten vereisen [aanvullende manifestinstellingen](#additional-manifest-settings) in je Slack-app en worden ingeschakeld met `channels.slack.commands.native: true` of in plaats daarvan met `commands.native: true` in globale configuraties.

- De automatische modus voor native opdrachten staat voor Slack **uit**, dus `commands.native: "auto"` schakelt native Slack-opdrachten niet in.

```txt
/help
```

Native argumentmenu's gebruiken een adaptieve renderstrategie die een bevestigingsmodal toont voordat een geselecteerde optiewaarde wordt verzonden:

- tot 5 opties: knopblokken
- 6-100 opties: statisch selectiemenu
- meer dan 100 opties: externe selectie met asynchrone optiefiltering wanneer handlers voor interactiviteitsopties beschikbaar zijn
- overschreden Slack-limieten: gecodeerde optiewaarden vallen terug op knoppen

```txt
/think
```

Slash-sessies gebruiken geïsoleerde sleutels zoals `agent:<agentId>:slack:slash:<userId>` en routeren opdrachtuitvoeringen nog steeds naar de doelconversatiesessie met `CommandTargetSessionKey`.

## Interactieve antwoorden

Slack kan door agents geschreven interactieve antwoordbediening renderen, maar deze functie is standaard uitgeschakeld.

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

Wanneer dit is ingeschakeld, kunnen agents antwoorddirectieven uitsturen die alleen voor Slack gelden:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Deze directieven worden gecompileerd naar Slack Block Kit en routeren klikken of selecties terug via het bestaande Slack-interactiegebeurtenispad.

Opmerkingen:

- Dit is Slack-specifieke UI. Andere kanalen vertalen Slack Block Kit-directieven niet naar hun eigen knopsystemen.
- De interactieve callbackwaarden zijn door OpenClaw gegenereerde opaque tokens, geen ruwe door agents geschreven waarden.
- Als gegenereerde interactieve blokken de Slack Block Kit-limieten zouden overschrijden, valt OpenClaw terug op het oorspronkelijke tekstantwoord in plaats van een ongeldige blokkenpayload te verzenden.

## Exec-goedkeuringen in Slack

Slack kan fungeren als native goedkeuringsclient met interactieve knoppen en interacties, in plaats van terug te vallen op de web-UI of terminal.

- Exec-goedkeuringen gebruiken `channels.slack.execApprovals.*` voor native DM-/kanaalroutering.
- Plugin-goedkeuringen kunnen nog steeds via hetzelfde Slack-native knopoppervlak worden afgehandeld wanneer de aanvraag al in Slack terechtkomt en het type goedkeurings-ID `plugin:` is.
- Autorisatie van goedkeurders wordt nog steeds afgedwongen: alleen gebruikers die als goedkeurders zijn geïdentificeerd, kunnen aanvragen via Slack goedkeuren of weigeren.

Dit gebruikt hetzelfde gedeelde goedkeuringsknopoppervlak als andere kanalen. Wanneer `interactivity` is ingeschakeld in je Slack-appinstellingen, worden goedkeuringsprompts direct in de conversatie als Block Kit-knoppen gerenderd.
Wanneer die knoppen aanwezig zijn, vormen ze de primaire goedkeurings-UX; OpenClaw
mag alleen een handmatige `/approve`-opdracht opnemen wanneer het toolresultaat zegt dat chatgoedkeuringen niet beschikbaar zijn of dat handmatige goedkeuring het enige pad is.

Configuratiepad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optioneel; valt waar mogelijk terug op `commands.ownerAllowFrom`)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, standaard: `dm`)
- `agentFilter`, `sessionFilter`

Slack schakelt native exec-goedkeuringen automatisch in wanneer `enabled` niet is ingesteld of `"auto"` is en ten minste één
goedkeurder wordt gevonden. Stel `enabled: false` in om Slack expliciet uit te schakelen als native goedkeuringsclient.
Stel `enabled: true` in om native goedkeuringen af te dwingen wanneer goedkeurders worden gevonden.

Standaardgedrag zonder expliciete Slack-configuratie voor exec-goedkeuring:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Expliciete Slack-native configuratie is alleen nodig wanneer je goedkeurders wilt overschrijven, filters wilt toevoegen of
wilt kiezen voor bezorging in de oorspronkelijke chat:

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

Gedeelde `approvals.exec`-doorsturing staat los hiervan. Gebruik dit alleen wanneer prompts voor exec-goedkeuring ook
naar andere chats of expliciete out-of-band doelen moeten routeren. Gedeelde `approvals.plugin`-doorsturing staat ook
los hiervan; Slack-native knoppen kunnen nog steeds Plugin-goedkeuringen afhandelen wanneer die aanvragen al in Slack terechtkomen.

Zelfde-chat `/approve` werkt ook in Slack-kanalen en DM's die al opdrachten ondersteunen. Zie [Exec-goedkeuringen](/nl/tools/exec-approvals) voor het volledige goedkeuringsdoorsturingsmodel.

## Gebeurtenissen en operationeel gedrag

- Berichtbewerkingen/-verwijderingen worden omgezet naar systeemgebeurtenissen.
- Thread-broadcasts ("Ook naar kanaal verzenden"-threadantwoorden) worden verwerkt als normale gebruikersberichten.
- Gebeurtenissen voor toevoegen/verwijderen van reacties worden omgezet naar systeemgebeurtenissen.
- Gebeurtenissen voor lid toetreden/verlaten, kanaal aangemaakt/hernoemd en pin toevoegen/verwijderen worden omgezet naar systeemgebeurtenissen.
- `channel_id_changed` kan kanaalconfiguratiesleutels migreren wanneer `configWrites` is ingeschakeld.
- Metadata voor kanaalonderwerp/-doel wordt behandeld als niet-vertrouwde context en kan in routeringscontext worden geïnjecteerd.
- Threadstarter en initiële contextzaaiing uit threadgeschiedenis worden gefilterd door geconfigureerde afzender-allowlists wanneer van toepassing.
- Blokacties en modalinteracties zenden gestructureerde `Slack interaction: ...`-systeemgebeurtenissen uit met rijke payloadvelden:
  - blokacties: geselecteerde waarden, labels, pickerwaarden en `workflow_*`-metadata
  - modal-`view_submission`- en `view_closed`-gebeurtenissen met gerouteerde kanaalmetadata en formulierinvoer

## Configuratiereferentie

Primaire referentie: [Configuratiereferentie - Slack](/nl/gateway/config-channels#slack).

<Accordion title="Slack-velden met hoge signaalwaarde">

- modus/authenticatie: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-toegang: `dm.enabled`, `dmPolicy`, `allowFrom` (verouderd: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- compatibiliteitsschakelaar: `dangerouslyAllowNameMatching` (noodoptie; laat uit tenzij nodig)
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
    - kanaal-allowlist (`channels.slack.channels`) — **sleutels moeten kanaal-ID's zijn** (`C12345678`), geen namen (`#channel-name`). Op namen gebaseerde sleutels mislukken stil onder `groupPolicy: "allowlist"`, omdat kanaalroutering standaard ID-eerst is. Een ID vinden: klik met de rechtermuisknop op het kanaal in Slack → **Link kopiëren** — de `C...`-waarde aan het einde van de URL is het kanaal-ID.
    - `requireMention`
    - allowlist per kanaal voor `users`

    Nuttige opdrachten:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-berichten worden genegeerd">
    Controleer:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (of verouderd `channels.slack.dm.policy`)
    - koppelingsgoedkeuringen / allowlist-vermeldingen
    - Slack Assistant-DM-gebeurtenissen: uitgebreide logs die `drop message_changed` vermelden
      betekenen meestal dat Slack een bewerkte Assistant-threadgebeurtenis heeft verzonden zonder een
      herstelbare menselijke afzender in berichtmetadata

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode maakt geen verbinding">
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
    - Slack Request URL's (Gebeurtenissen + Interactiviteit + Slash-opdrachten)
    - unieke `webhookPath` per HTTP-account

    Als `signingSecretStatus: "configured_unavailable"` verschijnt in account-snapshots,
    is het HTTP-account geconfigureerd, maar kon de huidige runtime het door SecretRef
    ondersteunde ondertekeningsgeheim niet oplossen.

  </Accordion>

  <Accordion title="Native/slash-opdrachten worden niet uitgevoerd">
    Controleer wat je bedoelde:

    - native-opdrachtmodus (`channels.slack.commands.native: true`) met overeenkomende slash-opdrachten die in Slack zijn geregistreerd
    - of modus met één slash-opdracht (`channels.slack.slashCommand.enabled: true`)

    Controleer ook `commands.useAccessGroups` en kanaal-/gebruikers-allowlists.

  </Accordion>
</AccordionGroup>

## Referentie voor visie op bijlagen

Slack kan gedownloade media aan de agentbeurt koppelen wanneer Slack-bestandsdownloads slagen en groottebeperkingen dit toestaan. Afbeeldingsbestanden kunnen via het pad voor mediabegrip worden doorgegeven of direct naar een antwoordmodel met vision-capaciteit; andere bestanden worden bewaard als downloadbare bestandscontext in plaats van als afbeeldingsinvoer te worden behandeld.

### Ondersteunde mediatypen

| Mediatype                      | Bron                 | Huidig gedrag                                                                     | Opmerkingen                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG- / PNG- / GIF- / WebP-afbeeldingen | Slack-bestands-URL  | Gedownload en aan de beurt gekoppeld voor verwerking die visie ondersteunt         | Limiet per bestand: `channels.slack.mediaMaxMb` (standaard 20 MB)         |
| PDF-bestanden                  | Slack-bestands-URL   | Gedownload en beschikbaar gemaakt als bestandscontext voor tools zoals `download-file` of `pdf` | Inkomende Slack zet PDF's niet automatisch om naar invoer voor afbeeldingsvisie |
| Andere bestanden               | Slack-bestands-URL   | Waar mogelijk gedownload en beschikbaar gemaakt als bestandscontext               | Binaire bestanden worden niet behandeld als afbeeldingsinvoer             |
| Antwoorden in threads          | Bestanden van thread-starter | Bestanden uit het rootbericht kunnen als context worden gehydrateerd wanneer het antwoord geen directe media heeft | Starters met alleen bestanden gebruiken een tijdelijke aanduiding voor bijlagen |
| Berichten met meerdere afbeeldingen | Meerdere Slack-bestanden | Elk bestand wordt onafhankelijk beoordeeld                                         | Slack-verwerking is beperkt tot acht bestanden per bericht                |

### Inkomende pijplijn

Wanneer een Slack-bericht met bestandsbijlagen binnenkomt:

1. OpenClaw downloadt het bestand vanaf Slack's privé-URL met het bottoken (`xoxb-...`).
2. Bij succes wordt het bestand naar de mediaopslag geschreven.
3. Gedownloade mediapaden en inhoudstypen worden toegevoegd aan de inkomende context.
4. Model-/toolpaden die afbeeldingen ondersteunen, kunnen afbeeldingsbijlagen uit die context gebruiken.
5. Niet-afbeeldingsbestanden blijven beschikbaar als bestandsmetadata of mediaverwijzingen voor tools die ze kunnen verwerken.

### Overerving van bijlagen van de thread-root

Wanneer een bericht binnenkomt in een thread (heeft een `thread_ts`-bovenliggend item):

- Als het antwoord zelf geen directe media heeft en het meegeleverde rootbericht bestanden bevat, kan Slack de rootbestanden hydrateren als context van de thread-starter.
- Directe antwoordbijlagen hebben voorrang op bijlagen van het rootbericht.
- Een rootbericht dat alleen bestanden en geen tekst bevat, wordt weergegeven met een tijdelijke aanduiding voor bijlagen, zodat de fallback de bestanden nog steeds kan opnemen.

### Verwerking van meerdere bijlagen

Wanneer een enkel Slack-bericht meerdere bestandsbijlagen bevat:

- Elke bijlage wordt onafhankelijk via de mediapijplijn verwerkt.
- Gedownloade mediaverwijzingen worden samengevoegd in de berichtcontext.
- De verwerkingsvolgorde volgt Slack's bestandsvolgorde in de event-payload.
- Een mislukte download van één bijlage blokkeert de andere niet.

### Grootte-, download- en modellimieten

- **Groottelimiet**: standaard 20 MB per bestand. Configureerbaar via `channels.slack.mediaMaxMb`.
- **Downloadfouten**: bestanden die Slack niet kan leveren, verlopen URL's, ontoegankelijke bestanden, te grote bestanden en Slack-auth-/login-HTML-antwoorden worden overgeslagen in plaats van gerapporteerd als niet-ondersteunde indelingen.
- **Visiemodel**: afbeeldingsanalyse gebruikt het actieve antwoordmodel wanneer dat visie ondersteunt, of het afbeeldingsmodel dat is geconfigureerd op `agents.defaults.imageModel`.

### Bekende limieten

| Scenario                               | Huidig gedrag                                                               | Tijdelijke oplossing                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Verlopen Slack-bestands-URL            | Bestand overgeslagen; geen fout weergegeven                                  | Upload het bestand opnieuw in Slack                                        |
| Visiemodel niet geconfigureerd         | Afbeeldingsbijlagen worden opgeslagen als mediaverwijzingen, maar niet als afbeeldingen geanalyseerd | Configureer `agents.defaults.imageModel` of gebruik een antwoordmodel dat visie ondersteunt |
| Zeer grote afbeeldingen (> 20 MB standaard) | Overgeslagen volgens groottelimiet                                         | Verhoog `channels.slack.mediaMaxMb` als Slack dit toestaat                 |
| Doorgestuurde/gedeelde bijlagen        | Tekst en door Slack gehoste afbeeldings-/bestandsmedia worden naar beste vermogen verwerkt | Deel ze rechtstreeks opnieuw in de OpenClaw-thread                         |
| PDF-bijlagen                           | Opgeslagen als bestands-/mediacontext, niet automatisch via afbeeldingsvisie gerouteerd | Gebruik `download-file` voor bestandsmetadata of de `pdf`-tool voor PDF-analyse |

### Gerelateerde documentatie

- [Pijplijn voor mediabegrip](/nl/nodes/media-understanding)
- [PDF-tool](/nl/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — inschakeling van visie voor Slack-bijlagen
- Regressietests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Liveverificatie: [#51354](https://github.com/openclaw/openclaw/issues/51354)

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
