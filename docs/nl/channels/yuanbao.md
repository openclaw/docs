---
read_when:
    - Je wilt een Yuanbao-bot koppelen
    - Je configureert het Yuanbao-kanaal
summary: Overzicht, functies en configuratie van de Yuanbao-bot
title: Yuanbao
x-i18n:
    generated_at: "2026-04-29T22:29:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao is het AI-assistentplatform van Tencent. De OpenClaw-kanaal-Plugin
verbindt Yuanbao-bots met OpenClaw via WebSocket, zodat ze met gebruikers kunnen communiceren
via directe berichten en groepschats.

**Status:** productieklaar voor bot-DM's + groepschats. WebSocket is de enige ondersteunde verbindingsmodus.

---

## Snel aan de slag

> **Vereist OpenClaw 2026.4.10 of hoger.** Voer `openclaw --version` uit om dit te controleren. Upgrade met `openclaw update`.

<Steps>
  <Step title="Voeg het Yuanbao-kanaal toe met je referenties">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  De waarde `--token` gebruikt de door dubbele punt gescheiden indeling `appKey:appSecret`. Je kunt deze verkrijgen in de Yuanbao-app door een robot te maken in de instellingen van je applicatie.
  </Step>

  <Step title="Start de Gateway opnieuw nadat de installatie is voltooid om de wijzigingen toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Interactieve installatie (alternatief)

Je kunt ook de interactieve wizard gebruiken:

```bash
openclaw channels login --channel yuanbao
```

Volg de prompts om je App ID en App Secret in te voeren.

---

## Toegangscontrole

### Directe berichten

Configureer `dmPolicy` om te bepalen wie de bot een DM kan sturen:

- `"pairing"` — onbekende gebruikers ontvangen een koppelingscode; keur goed via CLI
- `"allowlist"` — alleen gebruikers die in `allowFrom` staan, kunnen chatten
- `"open"` — sta alle gebruikers toe (standaard)
- `"disabled"` — schakel alle DM's uit

**Keur een koppelingsverzoek goed:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Groepschats

**Vermeldingsvereiste** (`channels.yuanbao.requireMention`):

- `true` — vereis @vermelding (standaard)
- `false` — reageer zonder @vermelding

Antwoorden op het bericht van de bot in een groepschat wordt behandeld als een impliciete vermelding.

---

## Configuratievoorbeelden

### Basisinstallatie met open DM-beleid

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

### Beperk DM's tot specifieke gebruikers

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

### Schakel de @vermeldingsvereiste in groepen uit

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Optimaliseer levering van uitgaande berichten

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Stem de merge-text-strategie af

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Veelgebruikte opdrachten

| Opdracht   | Beschrijving                       |
| ---------- | ---------------------------------- |
| `/help`    | Toon beschikbare opdrachten        |
| `/status`  | Toon botstatus                     |
| `/new`     | Start een nieuwe sessie            |
| `/stop`    | Stop de huidige run                |
| `/restart` | Start OpenClaw opnieuw             |
| `/compact` | Comprimeer de sessiecontext        |

> Yuanbao ondersteunt native menu's voor slash-opdrachten. Opdrachten worden automatisch met het platform gesynchroniseerd wanneer de Gateway start.

---

## Probleemoplossing

### Bot reageert niet in groepschats

1. Zorg dat de bot aan de groep is toegevoegd
2. Zorg dat je de bot @vermeldt (standaard vereist)
3. Controleer de logs: `openclaw logs --follow`

### Bot ontvangt geen berichten

1. Zorg dat de bot is gemaakt en goedgekeurd in de Yuanbao-app
2. Zorg dat `appKey` en `appSecret` correct zijn geconfigureerd
3. Zorg dat de Gateway actief is: `openclaw gateway status`
4. Controleer de logs: `openclaw logs --follow`

### Bot verzendt lege antwoorden of fallback-antwoorden

1. Controleer of het AI-model geldige inhoud retourneert
2. Het standaard fallback-antwoord is: "暂时无法解答，你可以换个问题问问我哦"
3. Pas dit aan via `channels.yuanbao.fallbackReply`

### App Secret gelekt

1. Reset de App Secret in YuanBao APP
2. Werk de waarde bij in je configuratie
3. Start de Gateway opnieuw: `openclaw gateway restart`

---

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

- `maxChars` — maximaal aantal tekens voor één bericht (standaard: `3000` tekens)
- `mediaMaxMb` — limiet voor media-upload/download (standaard: `20` MB)
- `overflowPolicy` — gedrag wanneer een bericht de limiet overschrijdt: `"split"` (standaard) of `"stop"`

### Streaming

Yuanbao ondersteunt streaming-uitvoer op blokniveau. Wanneer dit is ingeschakeld, verzendt de bot tekst in delen terwijl deze wordt gegenereerd.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Stel `disableBlockStreaming: true` in om het volledige antwoord in één bericht te verzenden.

### Geschiedeniscontext van groepschats

Bepaal hoeveel historische berichten worden opgenomen in de AI-context voor groepschats:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Reply-to-modus

Bepaal hoe de bot berichten citeert bij het antwoorden in groepschats:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Waarde    | Gedrag                                                   |
| --------- | -------------------------------------------------------- |
| `"off"`   | Geen geciteerd antwoord                                  |
| `"first"` | Citeer alleen het eerste antwoord per inkomend bericht (standaard) |
| `"all"`   | Citeer elk antwoord                                      |

### Markdown-hintinjectie

Standaard injecteert de bot instructies in de systeemprompt om te voorkomen dat het AI-model het volledige antwoord in markdown-codeblokken verpakt.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Debugmodus

Schakel ongefilterde loguitvoer in voor specifieke bot-ID's:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Routering met meerdere agents

Gebruik `bindings` om Yuanbao-DM's of -groepen naar verschillende agents te routeren.

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

Routeringsvelden:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) of `"group"` (groepschat)
- `match.peer.id`: gebruikers-ID of groepscode

---

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                 | Beschrijving                                      | Standaard                              |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Schakel het kanaal in/uit                         | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Standaardaccount voor uitgaande routering         | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (gebruikt voor ondertekening en ticketgeneratie) | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (gebruikt voor ondertekening)          | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | Vooraf ondertekend token (slaat automatische ticketondertekening over) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | Weergavenaam van account                          | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Schakel een specifiek account in/uit              | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM-beleid                                         | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM-allowlist (lijst met gebruikers-ID's)          | —                                      |
| `channels.yuanbao.requireMention`          | Vereis @vermelding in groepen                     | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Afhandeling van lange berichten (`split` of `stop`) | `split`                                |
| `channels.yuanbao.replyToMode`             | Reply-to-strategie voor groepen (`off`, `first`, `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Uitgaande strategie (`merge-text` of `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: minimumaantal tekens om verzending te activeren | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: maximumaantal tekens per bericht      | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: inactiviteitstime-out vóór automatisch flushen (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Limiet voor mediagrootte (MB)                     | `20`                                   |
| `channels.yuanbao.historyLimit`            | Contextitems voor groepschatgeschiedenis          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Schakel streaming-uitvoer op blokniveau uit       | `false`                                |
| `channels.yuanbao.fallbackReply`           | Fallback-antwoord wanneer AI geen inhoud retourneert | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Injecteer markdown-anti-wrapping-instructies      | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Debug-allowlist met bot-ID's (ongefilterde logs)  | `[]`                                   |

---

## Ondersteunde berichttypen

### Ontvangen

- ✅ Tekst
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio / Spraak
- ✅ Video
- ✅ Stickers / Aangepaste emoji
- ✅ Aangepaste elementen (linkkaarten, enz.)

### Verzenden

- ✅ Tekst (met markdown-ondersteuning)
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video
- ✅ Stickers

### Threads en antwoorden

- ✅ Geciteerde antwoorden (configureerbaar via `replyToMode`)
- ❌ Thread-antwoorden (niet ondersteund door platform)

---

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsafscherming
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
