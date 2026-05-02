---
read_when:
    - Dezelfde allowlist configureren voor meerdere berichtkanalen
    - Toegangsregels voor afzenders in DM's en groepen delen
    - Toegangscontrole voor berichtkanalen beoordelen
summary: Herbruikbare afzender-allowlists voor berichtkanalen
title: Toegangsgroepen
x-i18n:
    generated_at: "2026-05-02T11:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Toegangsgroepen zijn benoemde afzenderlijsten die je eenmaal definieert en vanuit kanaal-allowlists verwijst met `accessGroup:<name>`.

Gebruik ze wanneer dezelfde mensen toegang moeten krijgen tot meerdere berichtkanalen, of wanneer één vertrouwde set moet gelden voor autorisatie van zowel privéberichten als groepsafzenders.

Toegangsgroepen verlenen op zichzelf geen toegang. Een groep is alleen relevant wanneer een allowlist-veld ernaar verwijst.

## Statische groepen voor berichtafzenders

Statische afzendergroepen gebruiken `type: "message.senders"`.

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

Ledenlijsten zijn gesleuteld op berichtkanaal-id:

| Sleutel    | Betekenis                                                              |
| ---------- | ---------------------------------------------------------------------- |
| `"*"`      | Gedeelde vermeldingen die worden gecontroleerd voor elk berichtkanaal dat naar de groep verwijst. |
| `discord`  | Vermeldingen die alleen worden gecontroleerd voor Discord-allowlistmatching. |
| `telegram` | Vermeldingen die alleen worden gecontroleerd voor Telegram-allowlistmatching. |
| `whatsapp` | Vermeldingen die alleen worden gecontroleerd voor WhatsApp-allowlistmatching. |

Vermeldingen worden gematcht met de normale `allowFrom`-regels van het doelkanaal. OpenClaw vertaalt geen afzender-id's tussen kanalen. Als Alice een Telegram-id en een Discord-id heeft, vermeld dan beide id's onder de juiste sleutels.

## Groepen verwijzen vanuit allowlists

Verwijs naar een groep met `accessGroup:<name>` overal waar het berichtkanaalpad afzender-allowlists ondersteunt.

Voorbeeld van DM-allowlist:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Voorbeeld van groepsafzender-allowlist:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Je kunt groepen en directe vermeldingen combineren:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Ondersteunde berichtkanaalpaden

Toegangsgroepen zijn beschikbaar in gedeelde autorisatiepaden voor berichtkanalen, waaronder:

- afzender-allowlists voor privéberichten, zoals `channels.<channel>.allowFrom`
- groepsafzender-allowlists, zoals `channels.<channel>.groupAllowFrom`
- kanaalspecifieke afzender-allowlists per ruimte die dezelfde regels voor afzendermatching gebruiken
- opdracht-autorisatiepaden die afzender-allowlists van berichtkanalen hergebruiken

Kanaalondersteuning hangt ervan af of dat kanaal is aangesloten op de gedeelde helpers voor OpenClaw-afzenderautorisatie. Huidige gebundelde ondersteuning omvat Discord, Google Chat, Nostr, WhatsApp, Zalo en Zalo Personal. Statische `message.senders`-groepen zijn ontworpen om kanaalonafhankelijk te zijn, dus nieuwe berichtkanalen zouden ze moeten ondersteunen door de gedeelde Plugin SDK-helpers te gebruiken in plaats van aangepaste allowlist-uitbreiding.

## Discord-kanaaldoelgroepen

Discord ondersteunt ook een dynamisch toegangsgroeptype:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` betekent "sta Discord-DM-afzenders toe die dit guild-kanaal momenteel kunnen bekijken." OpenClaw lost de afzender via Discord op tijdens autorisatie en past Discord `ViewChannel`-machtigingsregels toe.

Gebruik dit wanneer een Discord-kanaal al de bron van waarheid is voor een team, zoals `#maintainers` of `#on-call`.

Vereisten en foutgedrag:

- De bot heeft toegang nodig tot de guild en het kanaal.
- De bot heeft de Discord Developer Portal **Server Members Intent** nodig.
- De toegangsgroep faalt gesloten wanneer Discord `Missing Access` retourneert, de afzender niet kan worden opgelost als guild-lid, of het kanaal bij een andere guild hoort.

Meer Discord-specifieke voorbeelden: [Discord-toegangscontrole](/nl/channels/discord#access-control-and-routing)

## Beveiligingsopmerkingen

- Toegangsgroepen zijn allowlist-aliassen, geen rollen. Ze maken geen eigenaars aan, keuren geen koppelingsverzoeken goed en verlenen op zichzelf geen toolmachtigingen.
- `dmPolicy: "open"` vereist nog steeds `"*"` in de effectieve DM-allowlist. Naar een toegangsgroep verwijzen is niet hetzelfde als publieke toegang.
- Ontbrekende groepsnamen falen gesloten. Als `allowFrom` `accessGroup:operators` bevat en `accessGroups.operators` ontbreekt, autoriseert die vermelding niemand.
- Houd kanaal-id's stabiel. Geef de voorkeur aan numerieke/gebruikers-id's boven weergavenamen wanneer het kanaal beide ondersteunt.

## Probleemoplossing

Als een afzender zou moeten matchen maar wordt geblokkeerd:

1. Controleer of het allowlist-veld de exacte verwijzing `accessGroup:<name>` bevat.
2. Controleer of `accessGroups.<name>.type` correct is.
3. Controleer of de afzender-id onder de overeenkomende kanaalsleutel staat, of onder `"*"`.
4. Controleer of de vermelding de normale allowlist-syntaxis van dat kanaal gebruikt.
5. Controleer voor Discord-kanaaldoelgroepen of de bot het guild-kanaal kan zien en Server Members Intent heeft ingeschakeld.

Voer `openclaw doctor` uit nadat je de configuratie voor toegangscontrole hebt bewerkt. Dit detecteert veel ongeldige combinaties van allowlists en beleid vóór runtime.
