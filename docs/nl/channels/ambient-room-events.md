---
read_when:
    - Altijd actieve groeps- of kanaalruimtes configureren
    - Je wilt dat de agent kamergesprekken volgt zonder automatisch definitieve tekst te plaatsen
    - Typen en tokengebruik debuggen zonder zichtbaar kamerbericht
sidebarTitle: Ambient room events
summary: Laat ondersteunde groepsruimten stille context bieden, tenzij de agent via de berichttool verstuurt
title: Omgevingsgebeurtenissen in de ruimte
x-i18n:
    generated_at: "2026-07-02T17:41:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Omgevingsgebeurtenissen in ruimtes laten OpenClaw niet-vermelde groeps- of kanaalgesprekken als stille context verwerken. De agent kan geheugen en sessiestatus bijwerken, maar de ruimte blijft stil tenzij de agent expliciet de `message`-tool aanroept.

Voor altijd-aan groepschats is dit de aanbevolen modus: combineer `messages.groupChat.unmentionedInbound: "room_event"` met `messages.groupChat.visibleReplies: "message_tool"`. Gebruik dit wanneer de agent moet luisteren, moet bepalen wanneer een antwoord nuttig is, en het oude promptpatroon van antwoorden met `NO_REPLY` moet vermijden.

Vandaag ondersteund: Discord-gildekanalen, Slack-kanalen en privékanalen, Slack-DM's met meerdere personen, en Telegram-groepen of supergroepen. Andere groepskanalen behouden hun bestaande groepsgedrag, tenzij hun kanaalpagina vermeldt dat ze omgevingsgebeurtenissen in ruimtes ondersteunen.

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

Configureer daarna de ruimte zelf als altijd-aan door vermeldingstoegang voor die ruimte uit te schakelen. Het kanaal moet nog steeds zijn toegestaan door zijn normale `groupPolicy`, ruimte-allowlist en afzender-allowlist.

Na het opslaan van de configuratie herlaadt de Gateway de `messages`-instellingen automatisch. Herstart alleen wanneer bestandsbewaking of configuratieherladen is uitgeschakeld.

## Wat verandert

Met `messages.groupChat.unmentionedInbound: "room_event"`:

- niet-vermelde toegestane groeps- of kanaalberichten worden stille ruimtegebeurtenissen
- vermelde berichten blijven gebruikersverzoeken
- tekstcommando's en native commando's blijven gebruikersverzoeken
- afbreek- of stopverzoeken blijven gebruikersverzoeken
- directe berichten blijven gebruikersverzoeken

Ruimtegebeurtenissen gebruiken strikte zichtbare bezorging. De uiteindelijke assistenttekst is privé. De agent moet `message(action=send)` aanroepen om in de ruimte te posten.

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

Voor Telegram-groepen moet de bot normale groepsberichten kunnen zien. Als `requireMention: false`, schakel dan BotFather-privacymodus uit of gebruik een andere Telegram-configuratie die al het groepsverkeer aan de bot levert.

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

Telegram-groeps-ID's zijn meestal negatieve getallen zoals `-1001234567890`. Lees `chat.id` uit `openclaw logs --follow`, stuur een groepsbericht door naar een ID-helperbot, of inspecteer Bot API `getUpdates`.

## Agentspecifiek beleid

Gebruik een agent-override wanneer meerdere agents dezelfde ruimte delen, maar slechts één niet-vermelde gesprekken als ambient context moet behandelen:

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

`messages.groupChat.visibleReplies` gebruikt standaard `"automatic"` voor normale gebruikersverzoeken in groepen/kanalen. Behoud die standaard wanneer je wilt dat de uiteindelijke assistenttekst zichtbaar wordt gepost zonder dat een expliciete aanroep van de berichtentool nodig is.

Voor ambient altijd-aan ruimtes blijft `messages.groupChat.visibleReplies: "message_tool"` aanbevolen, vooral met modellen van de nieuwste generatie die betrouwbaar tools gebruiken, zoals GPT 5.5. Hiermee kan de agent bepalen wanneer hij spreekt door de berichtentool aan te roepen. Als het model uiteindelijke tekst retourneert zonder de tool aan te roepen, houdt OpenClaw die uiteindelijke tekst privé en logt het onderdrukte bezorgingsmetadata.

Ruimtegebeurtenissen blijven strikt, zelfs wanneer andere groepsverzoeken automatische antwoorden gebruiken. Niet-vermelde ambient ruimtegebeurtenissen vereisen nog steeds `message(action=send)` voor zichtbare uitvoer.

## Geschiedenis

`messages.groupChat.historyLimit` bepaalt de globale standaard voor groepsgeschiedenis. Kanalen kunnen dit overschrijven met `channels.<channel>.historyLimit`, en sommige kanalen ondersteunen ook geschiedenislimieten per account.

Stel `historyLimit: 0` in om groepsgeschiedeniscontext uit te schakelen.

Ondersteunde ruimtegebeurteniskanalen houden recente ambient ruimteberichten als context bij. Telegram houdt een altijd-aan rollend venster per groep bij dat wordt begrensd door `historyLimit`; gebruikersverzoekbeurten selecteren items na het laatst geregistreerde antwoord van de bot, terwijl ruimtegebeurtenisbeurten het volledige recente venster ontvangen zodat het model zijn eigen recente posts kan zien. De verwijderde Telegram-modussleutel `includeGroupHistoryContext` wordt verwijderd door `openclaw doctor --fix`.

## Probleemoplossing

Als de ruimte typen of tokengebruik toont, maar geen zichtbaar bericht:

1. Bevestig dat de ruimte is toegestaan door de kanaal-allowlist en afzender-allowlist.
2. Bevestig dat `requireMention: false` is ingesteld op het ruimteniveau dat je verwacht.
3. Controleer of `messages.groupChat.unmentionedInbound` of de agent-override `"room_event"` is.
4. Inspecteer logs op onderdrukte metadata van de uiteindelijke payload of `didSendViaMessagingTool: false`.
5. Voor normale groepsverzoeken behoud of herstel je `messages.groupChat.visibleReplies: "automatic"` als je wilt dat uiteindelijke antwoorden automatisch worden gepost. Gebruik voor ambient ruimtes met `message_tool` een model/runtime die betrouwbaar tools aanroept.

Als Telegram ambient ruimtes helemaal niet activeren, controleer dan de BotFather-privacymodus en verifieer dat de Gateway normale groepsberichten ontvangt.

Als Slack ambient ruimtes niet activeren, controleer dan of de kanaalsleutel de Slack-kanaal-ID is en of de app het vereiste bereik `channels:history` of `groups:history` heeft voor dat ruimtetype.

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Discord](/nl/channels/discord)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
- [Kanaalprobleemoplossing](/nl/channels/troubleshooting)
- [Referentie voor kanaalconfiguratie](/nl/gateway/config-channels)
