---
read_when:
    - Door bots opgestelde kanaalberichten configureren
    - Bescherming tegen bot-naar-bot-lussen afstemmen
sidebarTitle: Bot loop protection
summary: Standaardinstellingen voor bescherming tegen bot-naar-bot-lussen en kanaaloverschrijvingen
title: Botlusbeveiliging
x-i18n:
    generated_at: "2026-07-12T08:35:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw kan berichten accepteren die door andere bots zijn geschreven op kanalen die `allowBots` ondersteunen. Wanneer dat pad is ingeschakeld, voorkomt lusbeveiliging voor botparen dat twee botidentiteiten elkaar onbeperkt blijven antwoorden.

De beveiliging wordt afgedwongen door de centrale runner voor inkomende antwoorden. Elk ondersteund kanaal zet de inkomende gebeurtenis om in generieke gegevens: account of bereik, gespreks-id, bot-id van de afzender en bot-id van de ontvanger. De kern houdt het deelnemerspaar in beide richtingen bij (A naar B en B naar A gelden als hetzelfde paar), past een budget met een verschuivend tijdvenster toe en onderdrukt het paar gedurende een afkoelperiode nadat het budget is overschreden.

## Standaardwaarden

Lusbeveiliging voor botparen is actief wanneer een kanaal door bots geschreven berichten naar de verwerking laat doorgaan. Ingebouwde standaardwaarden:

| Sleutel              | Standaardwaarde | Betekenis                                                    |
| -------------------- | --------------- | ------------------------------------------------------------ |
| `enabled`            | `true`          | Beveiliging actief voor kanalen die deze ondersteunen.        |
| `maxEventsPerWindow` | `20`            | Gebeurtenissen die een botpaar binnen het venster kan uitwisselen. |
| `windowSeconds`      | `60`            | Lengte van het verschuivende tijdvenster.                     |
| `cooldownSeconds`    | `60`            | Onderdrukkingstijd nadat het paar het budget overschrijdt.     |

De beveiliging heeft geen invloed op door mensen geschreven berichten, implementaties met één bot, filtering van berichten van de bot zelf of botantwoorden die onder het budget blijven.

## Gedeelde standaardwaarden configureren

Stel `channels.defaults.botLoopProtection` eenmaal in om elk ondersteund kanaal dezelfde basisinstellingen te geven. Overschrijvingen per kanaal, account en ruimte kunnen afzonderlijke oppervlakken nog steeds aanpassen.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Stel `enabled: false` alleen in wanneer uw kanaalbeleid bewust gesprekken tussen bots toestaat zonder automatische onderdrukking.

## Overschrijven per kanaal, account of ruimte

Ondersteunde kanalen leggen hun eigen configuratie sleutel voor sleutel over de gedeelde standaardwaarde heen. Volgorde van voorrang, van specifiek naar algemeen:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, wanneer het kanaal overschrijvingen per gesprek ondersteunt
2. `channels.<channel>.accounts.<account>.botLoopProtection`, wanneer het kanaal accounts ondersteunt
3. `channels.<channel>.botLoopProtection`, wanneer het kanaal standaardwaarden op het hoogste niveau ondersteunt
4. `channels.defaults.botLoopProtection`
5. ingebouwde standaardwaarden

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Kanaalondersteuning

- Discord: systeemeigen `author.bot`-gegevens, geïndexeerd op Discord-account, kanaal en botpaar.
- Google Chat: systeemeigen `sender.type=BOT`-gegevens voor geaccepteerde, door bots geschreven berichten, geïndexeerd op account, space en botpaar.
- Matrix: geconfigureerde Matrix-botaccounts, geïndexeerd op Matrix-account, ruimte en geconfigureerd botpaar.
- Slack: systeemeigen `bot_id`-gegevens voor geaccepteerde, door bots geschreven berichten, geïndexeerd op Slack-account, kanaal en botpaar.

Kanalen die geen betrouwbare inkomende botidentiteit beschikbaar stellen, blijven hun gebruikelijke filters voor berichten van de bot zelf en toegangsbeleid gebruiken. Ze moeten deze beveiliging pas inschakelen wanneer ze beide deelnemers van het botpaar kunnen identificeren.

Zie [SDK-runtime](/nl/plugins/sdk-runtime#reusable-runtime-utilities) voor implementatiedetails voor plugins.
