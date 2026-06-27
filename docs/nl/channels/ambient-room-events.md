---
read_when:
    - Altijd actieve groeps- of kanaalruimtes configureren
    - Je wilt dat de agent de gesprekken in de ruimte volgt zonder automatisch definitieve tekst te plaatsen
    - Foutopsporing van typen en tokengebruik zonder zichtbaar kamerbericht
sidebarTitle: Ambient room events
summary: Laat ondersteunde groepsruimtes stille context bieden tenzij de agent verzendt met de berichttool
title: Omgevingsgebeurtenissen in de ruimte
x-i18n:
    generated_at: "2026-06-27T17:09:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Omgevingsruimtegebeurtenissen laten OpenClaw niet-genoemde groeps- of kanaalgesprekken als stille context verwerken. De agent kan geheugen en sessiestatus bijwerken, maar de ruimte blijft stil tenzij de agent expliciet de `message`-tool aanroept.

Voor altijd actieve groepschats is dit de aanbevolen modus: combineer `messages.groupChat.unmentionedInbound: "room_event"` met `messages.groupChat.visibleReplies: "message_tool"`. Gebruik dit wanneer de agent moet luisteren, moet bepalen wanneer een antwoord nuttig is en het oude promptpatroon van antwoorden met `NO_REPLY` moet vermijden.

Vandaag ondersteund: Discord-gildekanalen, Slack-kanalen en privékanalen, Slack-DM's met meerdere personen en Telegram-groepen of supergroepen. Andere groepskanalen behouden hun bestaande groepsgedrag, tenzij hun kanaalpagina aangeeft dat ze omgevingsruimtegebeurtenissen ondersteunen.

## Aanbevolen configuratie

Stel het globale groepschatgedrag in:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Configureer daarna de ruimte zelf als altijd actief door mention-gating voor die ruimte uit te schakelen. Het kanaal moet nog steeds zijn toegestaan door de normale `groupPolicy`, de allowlist voor ruimtes en de allowlist voor afzenders.

Na het opslaan van de configuratie herlaadt de Gateway de `messages`-instellingen automatisch. Herstart alleen wanneer bestandsbewaking of configuratieherladen is uitgeschakeld.

## Wat verandert

Met `messages.groupChat.unmentionedInbound: "room_event"`:

- toegestane groeps- of kanaalberichten zonder vermelding worden stille ruimtegebeurtenissen
- berichten met vermelding blijven gebruikersverzoeken
- tekstopdrachten en native opdrachten blijven gebruikersverzoeken
- afbreek- of stopverzoeken blijven gebruikersverzoeken
- directe berichten blijven gebruikersverzoeken

Ruimtegebeurtenissen gebruiken strikte zichtbare aflevering. Definitieve assistenttekst is privé. De agent moet `message(action=send)` aanroepen om in de ruimte te posten.

## Discord-voorbeeld

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Gebruik Discord-configuratie per kanaal wanneer slechts één kanaal ambient moet zijn:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack-voorbeeld

Slack-kanaalallowlists gebruiken eerst ID's. Gebruik kanaal-ID's zoals `C12345678`, niet `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram-voorbeeld

Voor Telegram-groepen moet de bot normale groepsberichten kunnen zien. Als `requireMention: false`, schakel dan de privacymodus van BotFather uit of gebruik een andere Telegram-configuratie die volledig groepsverkeer aan de bot levert.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram-groep-ID's zijn meestal negatieve getallen zoals `-1001234567890`. Lees `chat.id` uit `openclaw logs --follow`, stuur een groepsbericht door naar een ID-helperbot of inspecteer Bot API `getUpdates`.

## Agentspecifiek beleid

Gebruik een agent-override wanneer meerdere agents dezelfde ruimte delen, maar slechts één niet-genoemd gesprek als ambient context moet behandelen:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

De agentspecifieke waarde `agents.list[].groupChat.unmentionedInbound` overschrijft `messages.groupChat.unmentionedInbound` voor die agent.

## Modi voor zichtbare antwoorden

`messages.groupChat.visibleReplies` gebruikt standaard `"automatic"` voor normale groeps-/kanaalgebruikersverzoeken. Behoud die standaard wanneer je wilt dat definitieve assistenttekst zichtbaar wordt geplaatst zonder dat een expliciete aanroep van de berichtentool nodig is.

Voor ambient altijd actieve ruimtes blijft `messages.groupChat.visibleReplies: "message_tool"` aanbevolen, vooral met modellen van de nieuwste generatie die betrouwbaar tools gebruiken, zoals GPT 5.5. Hiermee kan de agent bepalen wanneer hij spreekt door de berichtentool aan te roepen. Als het model definitieve tekst retourneert zonder de tool aan te roepen, houdt OpenClaw die definitieve tekst privé en logt het onderdrukte afleveringsmetadata.

Ruimtegebeurtenissen blijven strikt, zelfs wanneer andere groepsverzoeken automatische antwoorden gebruiken. Niet-genoemde ambient ruimtegebeurtenissen vereisen nog steeds `message(action=send)` voor zichtbare uitvoer.

## Geschiedenis

`messages.groupChat.historyLimit` bepaalt de globale standaard voor groepsgeschiedenis. Kanalen kunnen dit overschrijven met `channels.<channel>.historyLimit`, en sommige kanalen ondersteunen ook geschiedenislimieten per account.

Stel `historyLimit: 0` in om groepsgeschiedeniscontext uit te schakelen.

Ondersteunde kanalen voor ruimtegebeurtenissen bewaren recente ambient ruimteberichten als context. Discord bewaart geschiedenis van ruimtegebeurtenissen totdat een zichtbare Discord-verzending slaagt, zodat stille context niet verloren gaat vóór aflevering via de berichtentool.

## Probleemoplossing

Als de ruimte typen of tokengebruik toont maar geen zichtbaar bericht:

1. Bevestig dat de ruimte is toegestaan door de kanaalallowlist en afzenderallowlist.
2. Bevestig dat `requireMention: false` is ingesteld op het ruimteniveau dat je verwacht.
3. Controleer of `messages.groupChat.unmentionedInbound` of de agent-override `"room_event"` is.
4. Inspecteer logs op onderdrukte metadata van de definitieve payload of `didSendViaMessagingTool: false`.
5. Behoud of herstel voor normale groepsverzoeken `messages.groupChat.visibleReplies: "automatic"` als je wilt dat definitieve antwoorden automatisch worden geplaatst. Gebruik voor ambient ruimtes met `message_tool` een model/runtime die betrouwbaar tools aanroept.

Als Telegram-ambient ruimtes helemaal niet worden geactiveerd, controleer dan de privacymodus van BotFather en verifieer dat de Gateway normale groepsberichten ontvangt.

Als Slack-ambient ruimtes niet worden geactiveerd, verifieer dan dat de kanaalsleutel de Slack-kanaal-ID is en dat de app de vereiste scope `channels:history` of `groups:history` heeft voor dat ruimtetype.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Discord](/nl/channels/discord)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
- [Configuratiereferentie voor kanalen](/nl/gateway/config-channels)
