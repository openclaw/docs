---
read_when:
    - Dezelfde toelatingslijst configureren voor meerdere berichtkanalen
    - Toegangsregels voor afzenders delen voor privéberichten en groepen
    - Toegangsbeheer voor berichtkanalen controleren
summary: Herbruikbare lijsten met toegestane afzenders voor berichtkanalen
title: Toegangsgroepen
x-i18n:
    generated_at: "2026-07-12T08:36:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Toegangsgroepen zijn benoemde lijsten met afzenders die u eenmaal onder `accessGroups` definieert en vanuit kanaaltoelatingslijsten aanhaalt met `accessGroup:<name>`.

Gebruik ze wanneer dezelfde personen toegang moeten krijgen tot meerdere berichtkanalen, of wanneer één vertrouwde groep van toepassing moet zijn op zowel privéberichten als de autorisatie van afzenders in groepen.

Een groep verleent op zichzelf geen toegang. De groep is alleen relevant wanneer ernaar wordt verwezen vanuit een toelatingslijstveld.

## Statische groepen met berichtafzenders

Statische afzendergroepen gebruiken `type: "message.senders"`. `members` is geïndexeerd op berichtkanaal-id, aangevuld met `"*"` voor vermeldingen die door elk kanaal worden gedeeld:

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

| Sleutel                    | Betekenis                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `"*"`                      | Gedeelde vermeldingen die worden gecontroleerd voor elk berichtkanaal dat de groep gebruikt. |
| `discord`, `telegram`, ... | Vermeldingen die alleen worden gecontroleerd bij vergelijking met de toelatingslijst van dat kanaal. |

Vermeldingen worden vergeleken volgens de normale `allowFrom`-regels van het bestemmingskanaal. OpenClaw vertaalt afzender-id's niet tussen kanalen: als Alice een Telegram-id en een Discord-id heeft, vermeldt u beide id's onder de bijbehorende kanaalsleutels.

## Naar groepen verwijzen vanuit toelatingslijsten

Verwijs met `accessGroup:<name>` naar een groep op elke plek waar het berichtkanaalpad toelatingslijsten voor afzenders ondersteunt.

Voorbeeld van een toelatingslijst voor privéberichten:

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

Voorbeeld van een toelatingslijst voor groepsafzenders:

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
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

U kunt groepen en rechtstreekse vermeldingen combineren:

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

Toegangsgroepen werken in de gedeelde autorisatiepaden voor berichtkanalen:

- toelatingslijsten voor afzenders van privéberichten, zoals `channels.<channel>.allowFrom`
- toelatingslijsten voor groepsafzenders, zoals `channels.<channel>.groupAllowFrom`
- kanaalspecifieke toelatingslijsten voor afzenders per ruimte die dezelfde regels voor afzendervergelijking gebruiken (bijvoorbeeld Google Chat `groups.<space>.users`)
- autorisatiepaden voor opdrachten die de toelatingslijsten voor afzenders van berichtkanalen hergebruiken

Kanaalondersteuning hangt ervan af of het kanaal via de gedeelde OpenClaw-helpers voor afzenderautorisatie is aangesloten. De huidige ingebouwde ondersteuning omvat ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo en Zalo Personal. Statische `message.senders`-groepen zijn kanaalonafhankelijk, zodat nieuwe berichtkanalen ze kunnen gebruiken door de gedeelde helpers voor inkomende gegevens van de Plugin SDK te gebruiken in plaats van aangepaste uitbreiding van toelatingslijsten.

## Discord-kanaaldoelgroepen

Discord ondersteunt ook een dynamisch type toegangsgroep:

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

`discord.channelAudience` betekent: "sta afzenders van Discord-privéberichten toe die dit guildkanaal momenteel kunnen bekijken." OpenClaw zoekt de afzender tijdens de autorisatie via Discord op en past de Discord-machtigingsregels voor `ViewChannel` toe. `membership` is optioneel en is standaard ingesteld op `canViewChannel`.

Gebruik dit wanneer een Discord-kanaal al de gezaghebbende bron voor een team is, zoals `#maintainers` of `#on-call`.

Vereisten en gedrag bij fouten:

- De bot heeft toegang tot de guild en het kanaal nodig.
- De bot heeft in de Discord Developer Portal **Server Members Intent** nodig.
- De toegangsgroep weigert standaard toegang wanneer Discord `Missing Access` retourneert, de afzender niet als guildlid kan worden opgezocht of het kanaal bij een andere guild hoort.

Meer Discord-specifieke voorbeelden: [Discord-toegangsbeheer](/nl/channels/discord#access-control-and-routing)

## Plugin-diagnostiek

Plugin-auteurs kunnen de gestructureerde status van toegangsgroepen inspecteren zonder deze opnieuw uit te breiden tot een platte toelatingslijst:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

Het resultaat rapporteert groepen waarnaar wordt verwezen, die overeenkomen, ontbreken, niet worden ondersteund of zijn mislukt. Gebruik dit voor diagnostiek of conformiteitstests. Gebruik `expandAllowFromWithAccessGroups(...)` alleen voor compatibiliteitspaden die nog steeds een platte `allowFrom`-array verwachten.

## Beveiligingsopmerkingen

- Toegangsgroepen zijn aliassen voor toelatingslijsten, geen rollen. Ze maken geen eigenaren aan, keuren geen koppelingsverzoeken goed en verlenen op zichzelf geen machtigingen voor hulpmiddelen.
- `dmPolicy: "open"` vereist nog steeds `"*"` in de effectieve toelatingslijst voor privéberichten. Verwijzen naar een toegangsgroep is niet hetzelfde als openbare toegang.
- Ontbrekende groepsnamen weigeren standaard toegang. Als `allowFrom` `accessGroup:operators` bevat en `accessGroups.operators` ontbreekt, autoriseert die vermelding niemand.
- Houd kanaal-id's stabiel. Geef de voorkeur aan numerieke id's of gebruikers-id's boven weergavenamen wanneer het kanaal beide ondersteunt.

## Problemen oplossen

Als een afzender zou moeten overeenkomen maar wordt geblokkeerd:

1. Controleer of het toelatingslijstveld exact de verwijzing `accessGroup:<name>` bevat.
2. Controleer of `accessGroups.<name>.type` juist is.
3. Controleer of het afzender-id onder de bijbehorende kanaalsleutel of onder `"*"` staat.
4. Controleer of de vermelding de normale toelatingslijstsyntaxis van dat kanaal gebruikt.
5. Controleer voor Discord-kanaaldoelgroepen of de bot het guildkanaal kan zien en of Server Members Intent is ingeschakeld.

Voer `openclaw doctor` uit nadat u de configuratie voor toegangsbeheer hebt bewerkt. Hiermee worden veel ongeldige combinaties van toelatingslijsten en beleidsregels vóór uitvoering gedetecteerd.
