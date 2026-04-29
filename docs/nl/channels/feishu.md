---
read_when:
    - Je wilt een Feishu/Lark-bot koppelen
    - Je configureert het Feishu-kanaal
summary: Overzicht van de Feishu-bot, functies en configuratie
title: Feishu
x-i18n:
    generated_at: "2026-04-29T22:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark is een alles-in-één samenwerkingsplatform waar teams chatten, documenten delen, agenda's beheren en samen werk gedaan krijgen.

**Status:** productieklaar voor bot-DM's + groepschats. WebSocket is de standaardmodus; Webhook-modus is optioneel.

---

## Snel aan de slag

<Note>
Vereist OpenClaw 2026.4.25 of hoger. Voer `openclaw --version` uit om dit te controleren. Upgrade met `openclaw update`.
</Note>

<Steps>
  <Step title="Voer de installatiewizard voor het kanaal uit">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scan de QR-code met je mobiele Feishu/Lark-app om automatisch een Feishu/Lark-bot te maken.
  </Step>
  
  <Step title="Nadat de installatie is voltooid, herstart je de Gateway om de wijzigingen toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Toegangsbeheer

### Directe berichten

Configureer `dmPolicy` om te bepalen wie de bot een DM kan sturen:

- `"pairing"` — onbekende gebruikers ontvangen een koppelingscode; keur goed via de CLI
- `"allowlist"` — alleen gebruikers die in `allowFrom` staan, kunnen chatten (standaard: alleen de boteigenaar)
- `"open"` — sta openbare DM's alleen toe wanneer `allowFrom` `"*"` bevat; met beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten
- `"disabled"` — schakel alle DM's uit

**Keur een koppelingsverzoek goed:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Groepschats

**Groepsbeleid** (`channels.feishu.groupPolicy`):

| Waarde        | Gedrag                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Reageer op alle berichten in groepen                                                         |
| `"allowlist"` | Reageer alleen op groepen in `groupAllowFrom` of expliciet geconfigureerd onder `groups.<chat_id>` |
| `"disabled"`  | Schakel alle groepsberichten uit; expliciete `groups.<chat_id>`-vermeldingen overschrijven dit niet |

Standaard: `allowlist`

**Vermeldingsvereiste** (`channels.feishu.requireMention`):

- `true` — vereist @vermelding (standaard)
- `false` — reageer zonder @vermelding
- Overschrijving per groep: `channels.feishu.groups.<chat_id>.requireMention`
- Alleen-uitzenden `@all` en `@_all` worden niet behandeld als botvermeldingen. Een bericht dat zowel `@all` als de bot direct vermeldt, telt nog steeds als botvermelding.

---

## Voorbeelden van groepsconfiguratie

### Alle groepen toestaan, geen @vermelding vereist

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Alle groepen toestaan, nog steeds @vermelding vereisen

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Alleen specifieke groepen toestaan

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

In de `allowlist`-modus kun je ook een groep toelaten door een expliciete `groups.<chat_id>`-vermelding toe te voegen. Expliciete vermeldingen overschrijven `groupPolicy: "disabled"` niet. Jokertekenstandaarden onder `groups.*` configureren overeenkomende groepen, maar laten groepen niet op zichzelf toe.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Afzenders binnen een groep beperken

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Groeps-/gebruikers-ID's ophalen

### Groeps-ID's (`chat_id`, formaat: `oc_xxx`)

Open de groep in Feishu/Lark, klik op het menu-icoon in de rechterbovenhoek en ga naar **Instellingen**. Het groeps-ID (`chat_id`) staat op de instellingenpagina.

![Groeps-ID ophalen](/images/feishu-get-group-id.png)

### Gebruikers-ID's (`open_id`, formaat: `ou_xxx`)

Start de Gateway, stuur een DM naar de bot en controleer daarna de logs:

```bash
openclaw logs --follow
```

Zoek naar `open_id` in de loguitvoer. Je kunt ook openstaande koppelingsverzoeken controleren:

```bash
openclaw pairing list feishu
```

---

## Veelgebruikte opdrachten

| Opdracht  | Beschrijving                     |
| --------- | -------------------------------- |
| `/status` | Toon botstatus                   |
| `/reset`  | Reset de huidige sessie          |
| `/model`  | Toon of wissel het AI-model      |

<Note>
Feishu/Lark ondersteunt geen ingebouwde slash-command-menu's, dus stuur deze als gewone tekstberichten.
</Note>

---

## Probleemoplossing

### Bot reageert niet in groepschats

1. Zorg dat de bot aan de groep is toegevoegd
2. Zorg dat je de bot @vermeldt (standaard vereist)
3. Controleer of `groupPolicy` niet `"disabled"` is
4. Controleer logs: `openclaw logs --follow`

### Bot ontvangt geen berichten

1. Zorg dat de bot is gepubliceerd en goedgekeurd in Feishu Open Platform / Lark Developer
2. Zorg dat gebeurtenisabonnement `im.message.receive_v1` bevat
3. Zorg dat **persistente verbinding** (WebSocket) is geselecteerd
4. Zorg dat alle vereiste machtigingsscopes zijn verleend
5. Zorg dat de Gateway draait: `openclaw gateway status`
6. Controleer logs: `openclaw logs --follow`

### App Secret gelekt

1. Reset het App Secret in Feishu Open Platform / Lark Developer
2. Werk de waarde in je configuratie bij
3. Herstart de Gateway: `openclaw gateway restart`

---

## Geavanceerde configuratie

### Meerdere accounts

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` bepaalt welk account wordt gebruikt wanneer uitgaande API's geen `accountId` opgeven.
`accounts.<id>.tts` gebruikt dezelfde vorm als `messages.tts` en wordt diep samengevoegd over
de globale TTS-configuratie, zodat Feishu-setups met meerdere bots gedeelde providerreferenties
globaal kunnen houden en alleen stem, model, persona of automatische modus
per account kunnen overschrijven.

### Berichtlimieten

- `textChunkLimit` — grootte van uitgaande tekstfragmenten (standaard: `2000` tekens)
- `mediaMaxMb` — limiet voor media-upload/download (standaard: `30` MB)

### Streaming

Feishu/Lark ondersteunt streaming-antwoorden via interactieve kaarten. Wanneer dit is ingeschakeld, werkt de bot de kaart in realtime bij terwijl tekst wordt gegenereerd.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Stel `streaming: false` in om het volledige antwoord in één bericht te sturen.

### Quota-optimalisatie

Verminder het aantal Feishu/Lark-API-aanroepen met twee optionele vlaggen:

- `typingIndicator` (standaard `true`): stel in op `false` om aanroepen voor typreacties over te slaan
- `resolveSenderNames` (standaard `true`): stel in op `false` om profielopzoekingen van afzenders over te slaan

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP-sessies

Feishu/Lark ondersteunt ACP voor DM's en berichten in groepsgesprekken. Feishu/Lark ACP wordt aangestuurd via tekstopdrachten — er zijn geen ingebouwde slash-command-menu's, dus gebruik `/acp ...`-berichten direct in het gesprek.

#### Persistente ACP-binding

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### ACP vanuit chat starten

In een Feishu/Lark-DM of gesprek:

```text
/acp spawn codex --thread here
```

`--thread here` werkt voor DM's en Feishu/Lark-gespreksberichten. Vervolgberichten in het gebonden gesprek worden direct naar die ACP-sessie gerouteerd.

### Routering met meerdere agents

Gebruik `bindings` om Feishu/Lark-DM's of groepen naar verschillende agents te routeren.

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Routeringsvelden:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) of `"group"` (groepschat)
- `match.peer.id`: Open ID van gebruiker (`ou_xxx`) of groeps-ID (`oc_xxx`)

Zie [Groeps-/gebruikers-ID's ophalen](#get-groupuser-ids) voor opzoektips.

---

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                        | Beschrijving                                                                     | Standaard        |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Het kanaal in-/uitschakelen                                                      | `true`           |
| `channels.feishu.domain`                          | API-domein (`feishu` of `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | Eventtransport (`websocket` of `webhook`)                                        | `websocket`      |
| `channels.feishu.defaultAccount`                  | Standaardaccount voor uitgaande routering                                        | `default`        |
| `channels.feishu.verificationToken`               | Vereist voor webhookmodus                                                        | —                |
| `channels.feishu.encryptKey`                      | Vereist voor webhookmodus                                                        | —                |
| `channels.feishu.webhookPath`                     | Webhook-routepad                                                                 | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook-bindhost                                                                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook-bindpoort                                                                | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App-ID                                                                           | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                                                       | —                |
| `channels.feishu.accounts.<id>.domain`            | Domeinoverschrijving per account                                                 | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | TTS-overschrijving per account                                                   | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM-beleid                                                                        | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM-toelatingslijst (open_id-lijst)                                               | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Groepsbeleid                                                                     | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Groepstoelatingslijst                                                            | —                |
| `channels.feishu.requireMention`                  | @mention vereisen in groepen                                                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | @mention-overschrijving per groep; expliciete ID's laten de groep ook toe in toelatingslijstmodus | overgenomen      |
| `channels.feishu.groups.<chat_id>.enabled`        | Een specifieke groep in-/uitschakelen                                            | `true`           |
| `channels.feishu.textChunkLimit`                  | Grootte van berichtfragment                                                      | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limiet voor mediagrootte                                                         | `30`             |
| `channels.feishu.streaming`                       | Streaming-kaartuitvoer                                                           | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming op blokniveau                                                          | `true`           |
| `channels.feishu.typingIndicator`                 | Typreacties verzenden                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | Weergavenamen van afzenders oplossen                                             | `true`           |

---

## Ondersteunde berichttypen

### Ontvangen

- ✅ Tekst
- ✅ Tekst met opmaak (post)
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Stickers

Binnenkomende Feishu/Lark-audioberichten worden genormaliseerd als mediaplaceholders in plaats
van ruwe `file_key`-JSON. Wanneer `tools.media.audio` is geconfigureerd, downloadt OpenClaw
de voice-note-bron en voert het gedeelde audiotranscriptie uit vóór de
agentbeurt, zodat de agent het gesproken transcript ontvangt. Als Feishu
transcripttekst direct in de audio-payload opneemt, wordt die tekst gebruikt zonder nog een
ASR-aanroep. Zonder provider voor audiotranscriptie ontvangt de agent nog steeds een
`<media:audio>`-placeholder plus de opgeslagen bijlage, niet de ruwe Feishu-
resource-payload.

### Verzenden

- ✅ Tekst
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Interactieve kaarten (inclusief streaming-updates)
- ⚠️ Tekst met opmaak (post-achtige opmaak; ondersteunt niet de volledige Feishu/Lark-auteurmogelijkheden)

Native Feishu/Lark-audiobubbels gebruiken het Feishu-berichttype `audio` en vereisen
Ogg/Opus-uploadmedia (`file_type: "opus"`). Bestaande `.opus`- en `.ogg`-media
worden direct als native audio verzonden. MP3/WAV/M4A en andere waarschijnlijke audioformaten worden
alleen naar 48kHz Ogg/Opus getranscodeerd met `ffmpeg` wanneer het antwoord spraaklevering aanvraagt
(`audioAsVoice` / berichttool `asVoice`, inclusief TTS-voice-note-
antwoorden). Gewone MP3-bijlagen blijven reguliere bestanden. Als `ffmpeg` ontbreekt of
conversie mislukt, valt OpenClaw terug op een bestandsbijlage en logt het de reden.

### Threads en antwoorden

- ✅ Inline-antwoorden
- ✅ Thread-antwoorden
- ✅ Media-antwoorden blijven thread-bewust bij het antwoorden op een threadbericht

Voor `groupSessionScope: "group_topic"` en `"group_topic_sender"` gebruiken native
Feishu/Lark-onderwerpgroepen de event-`thread_id` (`omt_*`) als de canonieke
sessiesleutel voor het onderwerp. Normale groepsantwoorden die OpenClaw omzet in threads blijven
de bericht-ID van de antwoordroot (`om_*`) gebruiken, zodat de eerste beurt en vervolgbeurt
in dezelfde sessie blijven.

---

## Gerelateerd

- [Kanaaloverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en mention-afscherming
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
