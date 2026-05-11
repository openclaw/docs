---
read_when:
    - Je wilt een Feishu/Lark-bot verbinden
    - Je configureert het Feishu-kanaal
summary: Overzicht, functies en configuratie van de Feishu-bot
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark is een alles-in-één samenwerkingsplatform waar teams chatten, documenten delen, agenda's beheren en samen werk gedaan krijgen.

**Status:** productiegereed voor bot-DM's + groepschats. WebSocket is de standaardmodus; webhookmodus is optioneel.

---

## Snelstart

<Note>
Vereist OpenClaw 2026.4.25 of hoger. Voer `openclaw --version` uit om dit te controleren. Upgrade met `openclaw update`.
</Note>

<Steps>
  <Step title="Voer de installatiewizard voor het kanaal uit">
  ```bash
  openclaw channels login --channel feishu
  ```
  Kies handmatige installatie om een App ID en App Secret van Feishu Open Platform te plakken, of kies QR-installatie om automatisch een bot te maken. Als de binnenlandse mobiele Feishu-app niet reageert op de QR-code, voer de installatie dan opnieuw uit en kies handmatige installatie.
  </Step>
  
  <Step title="Nadat de installatie is voltooid, start je de gateway opnieuw op om de wijzigingen toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Toegangsbeheer

### Directe berichten

Configureer `dmPolicy` om te bepalen wie de bot een DM kan sturen:

- `"pairing"` - onbekende gebruikers ontvangen een koppelingscode; keur goed via CLI
- `"allowlist"` - alleen gebruikers die in `allowFrom` staan, kunnen chatten (standaard: alleen boteigenaar)
- `"open"` - sta openbare DM's alleen toe wanneer `allowFrom` `"*"` bevat; met beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten
- `"disabled"` - schakel alle DM's uit

**Een koppelingsverzoek goedkeuren:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Groepschats

**Groepsbeleid** (`channels.feishu.groupPolicy`):

| Waarde        | Gedrag                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"open"`      | Reageer op alle berichten in groepen                                                           |
| `"allowlist"` | Reageer alleen op groepen in `groupAllowFrom` of expliciet geconfigureerd onder `groups.<chat_id>` |
| `"disabled"`  | Schakel alle groepsberichten uit; expliciete `groups.<chat_id>`-vermeldingen overschrijven dit niet |

Standaard: `allowlist`

**Vereiste vermelding** (`channels.feishu.requireMention`):

- `true` - vereis @vermelding (standaard)
- `false` - reageer zonder @vermelding
- Overschrijving per groep: `channels.feishu.groups.<chat_id>.requireMention`
- Alleen-uitzending `@all` en `@_all` worden niet behandeld als botvermeldingen. Een bericht dat zowel `@all` als de bot rechtstreeks vermeldt, telt nog steeds als botvermelding.

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

In `allowlist`-modus kun je ook een groep toelaten door een expliciete `groups.<chat_id>`-vermelding toe te voegen. Expliciete vermeldingen overschrijven `groupPolicy: "disabled"` niet. Jokertekenstandaarden onder `groups.*` configureren overeenkomende groepen, maar laten groepen niet op zichzelf toe.

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

### Groeps-ID's (`chat_id`, indeling: `oc_xxx`)

Open de groep in Feishu/Lark, klik op het menu-icoon in de rechterbovenhoek en ga naar **Instellingen**. Het groeps-ID (`chat_id`) staat op de instellingenpagina.

![Groeps-ID ophalen](/images/feishu-get-group-id.png)

### Gebruikers-ID's (`open_id`, indeling: `ou_xxx`)

Start de gateway, stuur een DM naar de bot en controleer vervolgens de logs:

```bash
openclaw logs --follow
```

Zoek naar `open_id` in de loguitvoer. Je kunt ook openstaande koppelingsverzoeken controleren:

```bash
openclaw pairing list feishu
```

---

## Algemene opdrachten

| Opdracht  | Beschrijving                  |
| --------- | ----------------------------- |
| `/status` | Toon botstatus                |
| `/reset`  | Reset de huidige sessie       |
| `/model`  | Toon of wissel het AI-model   |

<Note>
Feishu/Lark ondersteunt geen native slash-command-menu's, dus stuur deze als plattetekstberichten.
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
5. Zorg dat de gateway actief is: `openclaw gateway status`
6. Controleer logs: `openclaw logs --follow`

### QR-installatie reageert niet in de mobiele Feishu-app

1. Voer de installatie opnieuw uit: `openclaw channels login --channel feishu`
2. Kies handmatige installatie
3. Maak in Feishu Open Platform een zelfgebouwde app en kopieer de App ID en App Secret
4. Plak die referenties in de installatiewizard

### App Secret gelekt

1. Reset de App Secret in Feishu Open Platform / Lark Developer
2. Werk de waarde in je configuratie bij
3. Start de gateway opnieuw op: `openclaw gateway restart`

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
globale TTS-configuratie, zodat Feishu-installaties met meerdere bots gedeelde provider-
referenties globaal kunnen behouden terwijl alleen stem, model, persona of automatische modus
per account wordt overschreven.

### Berichtlimieten

- `textChunkLimit` - chunkgrootte voor uitgaande tekst (standaard: `2000` tekens)
- `mediaMaxMb` - limiet voor media-upload/-download (standaard: `30` MB)

### Streaming

Feishu/Lark ondersteunt streamingantwoorden via interactieve kaarten. Wanneer dit is ingeschakeld, werkt de bot de kaart in realtime bij terwijl tekst wordt gegenereerd.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Stel `streaming: false` in om het volledige antwoord in één bericht te sturen. `blockStreaming` staat standaard uit; schakel het alleen in wanneer je wilt dat voltooide assistentblokken worden verzonden vóór het uiteindelijke antwoord.

### Quota-optimalisatie

Verminder het aantal Feishu/Lark-API-aanroepen met twee optionele vlaggen:

- `typingIndicator` (standaard `true`): stel in op `false` om oproepen voor typreacties over te slaan
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

Feishu/Lark ondersteunt ACP voor DM's en groeps-threadberichten. Feishu/Lark ACP wordt aangestuurd met tekstopdrachten - er zijn geen native slash-command-menu's, dus gebruik `/acp ...`-berichten rechtstreeks in het gesprek.

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

#### ACP starten vanuit chat

In een Feishu/Lark-DM of thread:

```text
/acp spawn codex --thread here
```

`--thread here` werkt voor DM's en Feishu/Lark-threadberichten. Vervolgberichten in het gebonden gesprek worden rechtstreeks naar die ACP-sessie gerouteerd.

### Routing met meerdere agents

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

Routingvelden:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) of `"group"` (groepschat)
- `match.peer.id`: Open ID van gebruiker (`ou_xxx`) of groeps-ID (`oc_xxx`)

Zie [Groeps-/gebruikers-ID's ophalen](#get-groupuser-ids) voor opzoektips.

---

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                        | Beschrijving                                                                      | Standaard        |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Het kanaal in-/uitschakelen                                                       | `true`           |
| `channels.feishu.domain`                          | API-domein (`feishu` of `lark`)                                                   | `feishu`         |
| `channels.feishu.connectionMode`                  | Gebeurtenistransport (`websocket` of `webhook`)                                   | `websocket`      |
| `channels.feishu.defaultAccount`                  | Standaardaccount voor uitgaande routering                                         | `default`        |
| `channels.feishu.verificationToken`               | Vereist voor webhookmodus                                                         | -                |
| `channels.feishu.encryptKey`                      | Vereist voor webhookmodus                                                         | -                |
| `channels.feishu.webhookPath`                     | Webhook-routepad                                                                  | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook-bindhost                                                                  | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook-bindpoort                                                                 | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App-ID                                                                            | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                                                        | -                |
| `channels.feishu.accounts.<id>.domain`            | Domeinoverschrijving per account                                                  | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | TTS-overschrijving per account                                                    | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM-beleid                                                                         | `allowlist`      |
| `channels.feishu.allowFrom`                       | Toegestane DM-lijst (lijst met open_id's)                                         | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Groepsbeleid                                                                      | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Toegestane groepslijst                                                            | -                |
| `channels.feishu.requireMention`                  | @mention in groepen vereisen                                                      | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | @mention-overschrijving per groep; expliciete ID's laten de groep ook toe in allowlist-modus | geërfd          |
| `channels.feishu.groups.<chat_id>.enabled`        | Een specifieke groep in-/uitschakelen                                             | `true`           |
| `channels.feishu.textChunkLimit`                  | Grootte van berichtfragmenten                                                     | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limiet voor mediagrootte                                                          | `30`             |
| `channels.feishu.streaming`                       | Uitvoer van streamingkaarten                                                      | `true`           |
| `channels.feishu.blockStreaming`                  | Antwoordstreaming per voltooid blok                                               | `false`          |
| `channels.feishu.typingIndicator`                 | Typreacties verzenden                                                             | `true`           |
| `channels.feishu.resolveSenderNames`              | Weergavenamen van afzenders oplossen                                              | `true`           |

---

## Ondersteunde berichttypen

### Ontvangen

- ✅ Tekst
- ✅ Rich text (post)
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Stickers

Binnenkomende Feishu/Lark-audioberichten worden genormaliseerd als mediaplaceholders in plaats
van ruwe `file_key`-JSON. Wanneer `tools.media.audio` is geconfigureerd, downloadt OpenClaw
de voice-note-bron en voert gedeelde audiotranscriptie uit vóór de
agentbeurt, zodat de agent het gesproken transcript ontvangt. Als Feishu
transcripttekst rechtstreeks in de audiopayload opneemt, wordt die tekst gebruikt zonder nog een
ASR-aanroep. Zonder provider voor audiotranscriptie ontvangt de agent nog steeds een
`<media:audio>`-placeholder plus de opgeslagen bijlage, niet de ruwe Feishu-
bronpayload.

### Verzenden

- ✅ Tekst
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Interactieve kaarten (inclusief streamingupdates)
- ⚠️ Rich text (post-stijlopmaak; ondersteunt niet de volledige Feishu/Lark-authoringmogelijkheden)

Native Feishu/Lark-audiobubbels gebruiken het Feishu-berichttype `audio` en vereisen
Ogg/Opus-uploadmedia (`file_type: "opus"`). Bestaande `.opus`- en `.ogg`-media
worden rechtstreeks als native audio verzonden. MP3/WAV/M4A en andere waarschijnlijke audioformaten worden
alleen met `ffmpeg` naar 48 kHz Ogg/Opus getranscodeerd wanneer het antwoord om spraaklevering vraagt
(`audioAsVoice` / berichttool `asVoice`, inclusief TTS-voice-note-
antwoorden). Gewone MP3-bijlagen blijven reguliere bestanden. Als `ffmpeg` ontbreekt of
conversie mislukt, valt OpenClaw terug op een bestandsbijlage en logt het de reden.

### Threads en antwoorden

- ✅ Inline antwoorden
- ✅ Thread-antwoorden
- ✅ Media-antwoorden blijven thread-aware bij het antwoorden op een threadbericht

Voor `groupSessionScope: "group_topic"` en `"group_topic_sender"` gebruiken native
Feishu/Lark-onderwerpgroepen de gebeurtenis `thread_id` (`omt_*`) als de canonieke
sessiesleutel voor het onderwerp. Als een native onderwerpstartergebeurtenis `thread_id` weglaat, hydrateert OpenClaw
die vanuit Feishu voordat de beurt wordt gerouteerd. Normale groepsantwoorden die
OpenClaw omzet in threads blijven de bericht-ID van het antwoordhoofdniveau (`om_*`) gebruiken, zodat de
eerste beurt en de vervolgbeurt in dezelfde sessie blijven.

---

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - groepschatgedrag en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
