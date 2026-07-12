---
read_when:
    - Altijd actieve groeps- of kanaalruimten configureren
    - Je wilt dat de agent de gesprekken in de ruimte volgt zonder automatisch een definitieve tekst te plaatsen
    - Typindicatie en tokengebruik debuggen zonder zichtbaar bericht in de ruimte
sidebarTitle: Ambient room events
summary: Laat ondersteunde groepsruimten stille context bieden, tenzij de agent iets verzendt met het berichtentool
title: Omgevingsgebeurtenissen in de ruimte
x-i18n:
    generated_at: "2026-07-12T08:35:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Met omgevingsgebeurtenissen in ruimtes kan OpenClaw niet-vermelde gesprekken in groepen of kanalen als stille context verwerken. De agent kan het geheugen en de sessiestatus bijwerken, maar de ruimte blijft stil tenzij de agent expliciet de tool `message` aanroept.

Combineer voor permanent actieve groepschats `messages.groupChat.unmentionedInbound: "room_event"` met `messages.groupChat.visibleReplies: "message_tool"`. De agent luistert, bepaalt wanneer een antwoord nuttig is en heeft het oude promptpatroon waarbij `NO_REPLY` wordt geantwoord nooit nodig.

Momenteel ondersteund: Discord-serverkanalen, openbare en privékanalen van Slack, Slack-DM's met meerdere personen en groepen of supergroepen van Telegram. Andere groepskanalen behouden hun bestaande groepsgedrag, tenzij op hun kanaalpagina staat dat ze omgevingsgebeurtenissen in ruimtes ondersteunen.

## Aanbevolen configuratie

Stel het algemene gedrag voor groepschats in:

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

Maak de ruimte vervolgens permanent actief door de vermeldingsvereiste voor die ruimte uit te schakelen. De ruimte moet nog steeds voldoen aan het normale `groupPolicy`, de toelatingslijst voor ruimtes en de toelatingslijst voor afzenders.

Na het opslaan van de configuratie past de Gateway de instellingen voor `messages` direct toe. Start alleen opnieuw op wanneer bestandsbewaking of het opnieuw laden van de configuratie is uitgeschakeld (`gateway.reload.mode: "off"`).

## Wat er verandert

Met `messages.groupChat.unmentionedInbound: "room_event"`:

- worden toegestane, niet-vermelde berichten in groepen of kanalen stille ruimtegebeurtenissen
- blijven berichten met een vermelding gebruikersverzoeken
- blijven tekstuele besturingsopdrachten en systeemeigen opdrachten gebruikersverzoeken
- blijven verzoeken om af te breken of te stoppen gebruikersverzoeken
- blijven directe berichten gebruikersverzoeken

Ruimtegebeurtenissen gebruiken strikte zichtbare bezorging. De uiteindelijke assistenttekst is privé. De agent moet `message(action=send)` aanroepen om een bericht in de ruimte te plaatsen.

Typindicaties en statusreacties voor de levenscyclus blijven onderdrukt voor ruimtegebeurtenissen. De enige expliciete uitzondering voor ontvangstbevestigingen is `messages.ackReactionScope: "all"`, waarmee de geconfigureerde bevestigingsreactie wordt verzonden; gebruik een beperkter bereik of `"off"` wanneer de ruimte volledig stil moet blijven.

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

Gebruik Discord-configuratie per kanaal wanneer slechts één kanaal als omgevingscontext moet dienen. Bij `groupPolicy: "allowlist"` wordt het kanaal toegestaan door het te vermelden (`enabled: false` schakelt een vermelding uit):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
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

Toelatingslijsten voor Slack-kanalen gebruiken primair ID's. Gebruik kanaal-ID's zoals `C12345678`, niet `#channel-name`. Het kanaal wordt toegestaan door het onder `channels.slack.channels` te vermelden (`enabled: false` schakelt een vermelding uit):

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram-voorbeeld

Voor Telegram-groepen moet de bot normale groepsberichten kunnen zien. Als `requireMention: false` is ingesteld, schakelt u de privacymodus van BotFather uit of gebruikt u een andere Telegram-configuratie waarmee al het groepsverkeer aan de bot wordt geleverd.

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

Groeps-ID's van Telegram zijn meestal negatieve getallen, zoals `-1001234567890`. Lees `chat.id` uit `openclaw logs --follow`, stuur een groepsbericht door naar een bot die ID's opzoekt of controleer `getUpdates` van de Bot API.

## Agentspecifiek beleid

Gebruik een overschrijving voor een agent wanneer meerdere agents dezelfde ruimte delen, maar slechts één agent niet-vermelde gesprekken als omgevingscontext moet behandelen:

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

De agentspecifieke waarde `agents.list[].groupChat.unmentionedInbound` overschrijft voor die agent `messages.groupChat.unmentionedInbound`.

## Modi voor zichtbare antwoorden

`messages.groupChat.visibleReplies` gebruikt standaard `"automatic"` voor normale gebruikersverzoeken in groepen of kanalen. Behoud deze standaardwaarde wanneer de uiteindelijke assistenttekst zichtbaar moet worden geplaatst zonder een expliciete aanroep van de berichtentool.

Voor permanent actieve omgevingsruimtes blijft `messages.groupChat.visibleReplies: "message_tool"` aanbevolen, vooral met modellen van de nieuwste generatie die betrouwbaar tools gebruiken, zoals GPT-5.6 Sol. Zo kan de agent bepalen wanneer hij spreekt door de berichtentool aan te roepen. Als het model uiteindelijke tekst retourneert zonder de tool aan te roepen, houdt OpenClaw die uiteindelijke tekst privé en registreert het metagegevens over de onderdrukte bezorging.

Ruimtegebeurtenissen blijven strikt, zelfs wanneer andere groepsverzoeken automatische antwoorden gebruiken. Niet-vermelde omgevingsgebeurtenissen in ruimtes vereisen altijd `message(action=send)` voor zichtbare uitvoer.

## Geschiedenis

`messages.groupChat.historyLimit` stelt de algemene standaardwaarde voor de groepsgeschiedenis in (50 wanneer niet ingesteld; moet een positief geheel getal zijn). Kanalen kunnen deze overschrijven met `channels.<channel>.historyLimit` en sommige kanalen ondersteunen ook geschiedenislijmieten per account. Stel `historyLimit: 0` op kanaalniveau in om context uit de groepsgeschiedenis voor dat kanaal uit te schakelen.

Ondersteunde kanalen voor ruimtegebeurtenissen bewaren recente omgevingsberichten uit de ruimte als context. Telegram bewaart een permanent actief, voortschrijdend venster per groep dat door `historyLimit` wordt begrensd; beurten met gebruikersverzoeken selecteren vermeldingen na het laatst geregistreerde antwoord van de bot, terwijl beurten met ruimtegebeurtenissen het volledige recente venster ontvangen, zodat het model zijn eigen recente berichten kan zien. De uitgefaseerde Telegram-modussleutel `includeGroupHistoryContext` wordt verwijderd door `openclaw doctor --fix`.

## Probleemoplossing

Als in de ruimte typactiviteit of tokengebruik zichtbaar is, maar geen zichtbaar bericht verschijnt:

1. Controleer of de ruimte is toegestaan door de toelatingslijst voor kanalen en de toelatingslijst voor afzenders.
2. Controleer of `requireMention: false` is ingesteld op het verwachte ruimteniveau.
3. Controleer of `messages.groupChat.unmentionedInbound` of de overschrijving voor de agent is ingesteld op `"room_event"`.
4. Controleer de logboeken op metagegevens van onderdrukte uiteindelijke nettoladingen of `didSendViaMessagingTool: false`.
5. Behoud of herstel voor normale groepsverzoeken `messages.groupChat.visibleReplies: "automatic"` als u wilt dat uiteindelijke antwoorden automatisch worden geplaatst. Gebruik voor omgevingsruimtes met `message_tool` een model of runtime dat tools betrouwbaar aanroept.

Als omgevingsruimtes van Telegram helemaal niet worden geactiveerd, controleert u de privacymodus van BotFather en verifieert u dat de Gateway normale groepsberichten ontvangt.

Als omgevingsruimtes van Slack niet worden geactiveerd, controleert u of de kanaalsleutel het Slack-kanaal-ID is en of de app het geschiedenisbereik voor dat ruimtetype heeft: `channels:history` (openbaar), `groups:history` (privé) of `mpim:history` (DM's met meerdere personen).

## Gerelateerd

- [Groepen](/nl/channels/groups)
- [Discord](/nl/channels/discord)
- [Slack](/nl/channels/slack)
- [Telegram](/nl/channels/telegram)
- [Probleemoplossing voor kanalen](/nl/channels/troubleshooting)
- [Configuratiereferentie voor kanalen](/nl/gateway/config-channels)
