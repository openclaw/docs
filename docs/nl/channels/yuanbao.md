---
read_when:
    - Je wilt verbinding maken met een Yuanbao-bot
    - Je configureert het Yuanbao-kanaal
summary: Overzicht, functies en configuratie van de Yuanbao-bot
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T08:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao is het AI-assistentplatform van Tencent. De door de community onderhouden plugin `openclaw-plugin-yuanbao` verbindt Yuanbao-bots via WebSocket met OpenClaw voor privéberichten en groepschats.

**Status:** gereed voor productie voor privéberichten met bots en groepschats. WebSocket is de enige ondersteunde verbindingsmodus. Deze plugin wordt door het Tencent Yuanbao-team onderhouden als een externe catalogusvermelding, niet door de kern van OpenClaw; de onderstaande configuratie- en gedragsdetails (afgezien van de installatie en de algemene CLI-interface) zijn afkomstig uit de eigen documentatie van de plugin en zijn niet geverifieerd aan de hand van de broncode van de OpenClaw-kern.

## Snel aan de slag

Vereist OpenClaw 2026.4.10 of hoger. Controleer dit met `openclaw --version`; voer een upgrade uit met `openclaw update`.

<Steps>
  <Step title="Voeg het Yuanbao-kanaal toe met je aanmeldgegevens">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` gebruikt `appKey:appSecret`, gescheiden door een dubbele punt. Verkrijg deze vanuit de Yuanbao-app door een bot aan te maken in de instellingen van je toepassing.
  </Step>

  <Step title="Start de Gateway opnieuw om de wijziging toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Interactieve configuratie (alternatief)

```bash
openclaw channels login --channel yuanbao
```

Volg de aanwijzingen om je App ID en App Secret in te voeren.

## Toegangsbeheer

### Privéberichten

`channels.yuanbao.dm.policy`:

| Waarde           | Gedrag                                                        |
| ---------------- | ------------------------------------------------------------- |
| `open` (standaard) | Alle gebruikers toestaan                                    |
| `pairing`        | Onbekende gebruikers krijgen een koppelcode; keur goed via CLI |
| `allowlist`      | Alleen gebruikers in `allowFrom` kunnen chatten                |
| `disabled`       | Alle privéberichten uitschakelen                               |

Keur een koppelverzoek goed:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Groepschats

`channels.yuanbao.requireMention` (standaard `true`): vereist een @vermelding voordat de bot in een groep reageert. Reageren op een bericht van de bot zelf geldt als een impliciete vermelding.

## Configuratievoorbeelden

Basisconfiguratie met open beleid voor privéberichten:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

Beperk privéberichten tot specifieke gebruikers:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

Schakel de vereiste voor @vermeldingen in groepen uit:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Afstemming van uitgaande bezorging:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer totdat dit aantal tekens is bereikt
      maxChars: 3000, // boven deze limiet splitsen afdwingen
      idleMs: 5000, // automatisch verzenden na time-out wegens inactiviteit (ms)
    },
  },
}
```

Stel `outboundQueueStrategy: "immediate"` in om elk fragment zonder buffering te verzenden.

## Veelgebruikte opdrachten

| Opdracht   | Beschrijving                         |
| ---------- | ------------------------------------ |
| `/help`    | Beschikbare opdrachten weergeven     |
| `/status`  | Botstatus weergeven                  |
| `/new`     | Een nieuwe sessie starten            |
| `/stop`    | De huidige uitvoering stoppen        |
| `/restart` | OpenClaw opnieuw starten             |
| `/compact` | De sessiecontext comprimeren         |

Yuanbao ondersteunt systeemeigen menu's voor slashopdrachten; opdrachten worden automatisch met het platform gesynchroniseerd wanneer de Gateway start.

## Problemen oplossen

**Bot reageert niet in groepschats:**

1. Controleer of de bot aan de groep is toegevoegd
2. Controleer of je de bot met @ vermeldt (standaard vereist)
3. Controleer de logboeken: `openclaw logs --follow`

**Bot ontvangt geen berichten:**

1. Controleer of de bot in de Yuanbao-app is aangemaakt en goedgekeurd
2. Controleer of `appKey` en `appSecret` correct zijn geconfigureerd
3. Controleer of de Gateway actief is: `openclaw gateway status`
4. Controleer de logboeken: `openclaw logs --follow`

**Bot verzendt lege antwoorden of terugvalantwoorden:**

1. Controleer of het AI-model geldige inhoud retourneert
2. Standaard terugvalantwoord: "暂时无法解答，你可以换个问题问问我哦"
3. Pas dit aan met `channels.yuanbao.fallbackReply`

**App Secret is gelekt:**

1. Stel het App Secret opnieuw in de Yuanbao-app in
2. Werk de waarde in je configuratie bij
3. Start de Gateway opnieuw: `openclaw gateway restart`

## Geavanceerde configuratie

### Meerdere accounts

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` bepaalt welk account wordt gebruikt wanneer uitgaande API's geen `accountId` opgeven.

### Berichtlimieten

- `maxChars`: maximaal aantal tekens per bericht (standaard `3000`)
- `mediaMaxMb`: limiet voor het uploaden/downloaden van media (standaard `20` MB)
- `overflowPolicy`: gedrag wanneer een bericht de limiet overschrijdt, `"split"` (standaard) of `"stop"`

### Streaming

Yuanbao ondersteunt streaminguitvoer op blokniveau; de bot verzendt tekst in fragmenten terwijl deze wordt gegenereerd.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // blokstreaming ingeschakeld (standaard)
    },
  },
}
```

Stel `disableBlockStreaming: true` in om het volledige antwoord in één bericht te verzenden.

### Historische context van groepschats

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // standaard: 100, stel in op 0 om uit te schakelen
    },
  },
}
```

Bepaalt hoeveel historische berichten voor groepschats in de AI-context worden opgenomen.

### Antwoordmodus

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (standaard: "first")
    },
  },
}
```

| Waarde  | Gedrag                                                               |
| ------- | -------------------------------------------------------------------- |
| `off`   | Geen geciteerd antwoord                                               |
| `first` | Alleen het eerste antwoord per inkomend bericht citeren (standaard)   |
| `all`   | Elk antwoord citeren                                                  |

### Markdown-hintinjectie

Standaard injecteert de bot een instructie in de systeemprompt om te voorkomen dat het model het volledige antwoord in een Markdown-codeblok plaatst.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // standaard: true
    },
  },
}
```

### Foutopsporingsmodus

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Schakelt niet-geanonimiseerde logboekuitvoer in voor de vermelde bot-ID's.

### Routering met meerdere agents

Gebruik `bindings` om privéberichten of groepen van Yuanbao naar verschillende agents te routeren:

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (privébericht) of `"group"` (groepschat)
- `match.peer.id`: gebruikers-ID of groepscode

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                  | Beschrijving                                                    | Standaard                              |
| ------------------------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                  | Het kanaal in-/uitschakelen                                     | `true`                                 |
| `channels.yuanbao.defaultAccount`           | Standaardaccount voor uitgaande routering                        | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`     | App Key (ondertekening + ticketgeneratie)                        | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret`  | App Secret (ondertekening)                                      | -                                      |
| `channels.yuanbao.accounts.<id>.token`      | Vooraf ondertekend token (slaat automatische ticketondertekening over) | -                                 |
| `channels.yuanbao.accounts.<id>.name`       | Weergavenaam van account                                        | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`    | Een specifiek account in-/uitschakelen                           | `true`                                 |
| `channels.yuanbao.dm.policy`                | Beleid voor privéberichten                                      | `open`                                 |
| `channels.yuanbao.dm.allowFrom`             | Toegestane afzenders voor privéberichten (lijst met gebruikers-ID's) | -                                 |
| `channels.yuanbao.requireMention`           | @vermelding in groepen vereisen                                  | `true`                                 |
| `channels.yuanbao.overflowPolicy`           | Afhandeling van lange berichten (`split` of `stop`)              | `split`                                |
| `channels.yuanbao.replyToMode`              | Antwoordstrategie voor groepen (`off`, `first`, `all`)           | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`    | Uitgaande strategie (`merge-text` of `immediate`)                | `merge-text`                           |
| `channels.yuanbao.minChars`                 | Tekst samenvoegen: minimumaantal tekens om verzending te activeren | `2800`                              |
| `channels.yuanbao.maxChars`                 | Tekst samenvoegen: maximumaantal tekens per bericht              | `3000`                                 |
| `channels.yuanbao.idleMs`                   | Tekst samenvoegen: time-out bij inactiviteit vóór automatisch verzenden (ms) | `5000`                    |
| `channels.yuanbao.mediaMaxMb`               | Limiet voor mediagrootte (MB)                                   | `20`                                   |
| `channels.yuanbao.historyLimit`             | Aantal contextitems uit de groepschatgeschiedenis                | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`    | Streaminguitvoer op blokniveau uitschakelen                      | `false`                                |
| `channels.yuanbao.fallbackReply`            | Terugvalantwoord wanneer het model geen inhoud retourneert       | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`      | Markdown-instructies injecteren om volledige codeblokken te voorkomen | `true`                            |
| `channels.yuanbao.debugBotIds`              | Lijst met toegestane bot-ID's voor foutopsporing (niet-geanonimiseerde logboeken) | `[]`                  |

## Ondersteunde berichttypen

**Ontvangen:** tekst, afbeeldingen, bestanden, audio/spraak, video, stickers/aangepaste emoji en aangepaste elementen (linkkaarten).

**Verzenden:** tekst (Markdown), afbeeldingen, bestanden, audio, video en stickers.

**Discussies en antwoorden:** geciteerde antwoorden (configureerbaar via `replyToMode`); antwoorden in discussies worden niet door het platform ondersteund.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - authenticatie van privéberichten en koppelproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vereiste vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiliging aanscherpen
