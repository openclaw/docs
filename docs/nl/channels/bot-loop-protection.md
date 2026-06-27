---
read_when:
    - Botgeschreven kanaalberichten configureren
    - Bot-naar-bot-lusbeveiliging afstemmen
sidebarTitle: Bot loop protection
summary: Bot-naar-bot-lusbeveiligingsstandaarden en kanaaloverschrijvingen
title: Bescherming tegen botlussen
x-i18n:
    generated_at: "2026-06-27T17:09:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Bot-lusbescherming

OpenClaw kan berichten accepteren die door andere bots zijn geschreven op kanalen die `allowBots` ondersteunen.
Wanneer dat pad is ingeschakeld, voorkomt paarlusbescherming dat twee botidentiteiten
oneindig op elkaar blijven antwoorden.

De beveiliging wordt afgedwongen door de kernrunner voor inkomende antwoorden. Elk ondersteunend kanaal
zet zijn eigen inkomende gebeurtenis om naar generieke feiten: account of scope, gespreks-id,
bot-id van de afzender en bot-id van de ontvanger. De kern volgt vervolgens het deelnemerspaar in beide
richtingen, past een budget met schuivend venster toe en onderdrukt het paar tijdens een
afkoelperiode nadat het budget is overschreden.

## Standaardinstellingen

Paarlusbescherming is actief wanneer een kanaal toestaat dat door bots geschreven berichten de
dispatch bereiken. Ingebouwde standaardinstellingen zijn:

- `maxEventsPerWindow: 20` - een botpaar kan binnen het venster 20 gebeurtenissen uitwisselen
- `windowSeconds: 60` - lengte van het schuivende venster
- `cooldownSeconds: 60` - onderdrukkingstijd nadat het paar het budget overschrijdt

De beveiliging heeft geen invloed op normale berichten van mensen, implementaties met één bot,
filtering van eigen berichten of eenmalige botantwoorden die onder het budget blijven.

## Gedeelde standaardinstellingen configureren

Stel `channels.defaults.botLoopProtection` één keer in om elk ondersteunend kanaal
dezelfde basislijn te geven. Kanaal- en accountoverschrijvingen kunnen afzonderlijke
oppervlakken nog steeds afstemmen.

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

Stel `enabled: false` alleen in wanneer je kanaalbeleid bewust
bot-naar-botgesprekken zonder automatische onderdrukking toestaat.

## Per kanaal of account overschrijven

Ondersteunende kanalen leggen hun eigen configuratie over de gedeelde standaardinstelling heen. De prioriteit is:

- `channels.<channel>.<room-or-space>.botLoopProtection`, wanneer het kanaal overschrijvingen per gesprek ondersteunt
- `channels.<channel>.accounts.<account>.botLoopProtection`, wanneer het kanaal accounts ondersteunt
- `channels.<channel>.botLoopProtection`, wanneer het kanaal standaardinstellingen op hoogste niveau ondersteunt
- `channels.defaults.botLoopProtection`
- ingebouwde standaardinstellingen

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## Kanaalondersteuning

- Discord: native `author.bot`-feiten, gesleuteld op Discord-account, kanaal en botpaar.
- Slack: native `bot_id`-feiten voor geaccepteerde door bots geschreven berichten, gesleuteld op Slack-account, kanaal en botpaar.
- Matrix: geconfigureerde Matrix-botaccounts, gesleuteld op Matrix-account, ruimte en geconfigureerd botpaar.
- Google Chat: native `sender.type=BOT`-feiten voor geaccepteerde door bots geschreven berichten, gesleuteld op account, space en botpaar.

Kanalen die geen betrouwbare inkomende botidentiteit blootstellen, blijven hun
normale filters voor eigen berichten en toegangsbeleid gebruiken. Ze moeten zich niet aanmelden voor deze
beveiliging totdat ze beide deelnemers in het botpaar kunnen identificeren.

Zie [SDK-runtime](/nl/plugins/sdk-runtime#reusable-runtime-utilities) voor Plugin-
implementatiedetails.
