---
read_when:
    - Je wilt een Feishu/Lark-bot verbinden
    - Je configureert het Feishu-kanaal
summary: Overzicht, functies en configuratie van de Feishu-bot
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:11:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark is een alles-in-één samenwerkingsplatform waar teams chatten, documenten delen, agenda's beheren en samen werk gedaan krijgen.

**Status:** productieklaar voor bot-DM's + groepschats. WebSocket is de standaardmodus; webhookmodus is optioneel.

---

## Snelstart

<Note>
Vereist OpenClaw 2026.5.29 of hoger. Voer `openclaw --version` uit om dit te controleren. Upgrade met `openclaw update`.
</Note>

<Steps>
  <Step title="Voer de installatiewizard voor het kanaal uit">
  ```bash
  openclaw channels login --channel feishu
  ```
  Kies handmatige configuratie om een App ID en App Secret van Feishu Open Platform te plakken, of kies QR-configuratie om automatisch een bot te maken. Als de binnenlandse mobiele Feishu-app niet reageert op de QR-code, voer de configuratie dan opnieuw uit en kies handmatige configuratie.
  </Step>
  
  <Step title="Nadat de configuratie is voltooid, herstart je de gateway om de wijzigingen toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Toegangsbeheer

### Directe berichten

Configureer `dmPolicy` om te bepalen wie de bot een DM kan sturen:

- `"pairing"` - onbekende gebruikers ontvangen een koppelingscode; keur goed via de CLI
- `"allowlist"` - alleen gebruikers die in `allowFrom` staan kunnen chatten
- `"open"` - sta openbare DM's alleen toe wanneer `allowFrom` `"*"` bevat; met beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten

**Keur een koppelingsverzoek goed:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Groepschats

**Groepsbeleid** (`channels.feishu.groupPolicy`):

| Waarde        | Gedrag                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `"open"`      | Reageer op alle berichten in groepen                                                                    |
| `"allowlist"` | Reageer alleen op groepen in `groupAllowFrom` of expliciet geconfigureerd onder `groups.<chat_id>`      |
| `"disabled"`  | Schakel alle groepsberichten uit; expliciete `groups.<chat_id>`-vermeldingen overschrijven dit niet     |

Standaard: `allowlist`

**Vereiste vermelding** (`channels.feishu.requireMention`):

- `true` - vereis @mention (standaard)
- `false` - reageer zonder @mention
- Overschrijving per groep: `channels.feishu.groups.<chat_id>.requireMention`
- Alleen-broadcast `@all` en `@_all` worden niet behandeld als botvermeldingen. Een bericht dat zowel `@all` als de bot direct vermeldt, telt nog steeds als een botvermelding.

---

## Voorbeelden van groepsconfiguratie

### Alle groepen toestaan, geen @mention vereist

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Alle groepen toestaan, nog steeds @mention vereisen

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

In `allowlist`-modus kun je ook een groep toelaten door een expliciete `groups.<chat_id>`-vermelding toe te voegen. Expliciete vermeldingen overschrijven `groupPolicy: "disabled"` niet. Jokertekenstandaarden onder `groups.*` configureren overeenkomende groepen, maar laten groepen niet zelfstandig toe.

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

| Opdracht  | Beschrijving                    |
| --------- | -------------------------------- |
| `/status` | Toon botstatus                   |
| `/reset`  | Reset de huidige sessie          |
| `/model`  | Toon of wissel het AI-model      |

<Note>
Feishu/Lark ondersteunt geen native slash-commandmenu's, dus stuur deze als platte tekstberichten.
</Note>

---

## Probleemoplossing

### Bot reageert niet in groepschats

1. Zorg ervoor dat de bot aan de groep is toegevoegd
2. Zorg ervoor dat je de bot @mentiont (standaard vereist)
3. Controleer of `groupPolicy` niet `"disabled"` is
4. Controleer logs: `openclaw logs --follow`

### Bot ontvangt geen berichten

1. Zorg ervoor dat de bot is gepubliceerd en goedgekeurd in Feishu Open Platform / Lark Developer
2. Zorg ervoor dat eventabonnement `im.message.receive_v1` bevat
3. Zorg ervoor dat **persistente verbinding** (WebSocket) is geselecteerd
4. Zorg ervoor dat alle vereiste machtigingsscopes zijn verleend
5. Zorg ervoor dat de Gateway draait: `openclaw gateway status`
6. Controleer logs: `openclaw logs --follow`

### QR-configuratie reageert niet in de mobiele Feishu-app

1. Voer de configuratie opnieuw uit: `openclaw channels login --channel feishu`
2. Kies handmatige configuratie
3. Maak in Feishu Open Platform een zelfgebouwde app en kopieer de App ID en App Secret
4. Plak die referenties in de installatiewizard

### App Secret gelekt

1. Reset de App Secret in Feishu Open Platform / Lark Developer
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

`defaultAccount` bepaalt welk account wordt gebruikt wanneer outbound API's geen `accountId` opgeven.
`accounts.<id>.tts` gebruikt dezelfde vorm als `messages.tts` en deep-merget over
de globale TTS-configuratie, zodat Feishu-configuraties met meerdere bots gedeelde providerreferenties
globaal kunnen behouden terwijl alleen stem, model, persona of automatische modus
per account wordt overschreven.

### Berichtlimieten

- `textChunkLimit` - chunkgrootte voor uitgaande tekst (standaard: `2000` tekens)
- `mediaMaxMb` - limiet voor media-upload/download (standaard: `30` MB)

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

Stel `streaming: false` in om het volledige antwoord in één bericht te verzenden. `blockStreaming` is standaard uitgeschakeld; schakel dit alleen in wanneer je voltooide assistentblokken wilt doorspoelen vóór het uiteindelijke antwoord.

### Quota-optimalisatie

Verminder het aantal Feishu/Lark-API-aanroepen met twee optionele vlaggen:

- `typingIndicator` (standaard `true`): stel in op `false` om aanroepen voor typreacties over te slaan
- `resolveSenderNames` (standaard `true`): stel in op `false` om het opzoeken van afzenderprofielen over te slaan

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

Feishu/Lark ondersteunt ACP voor DM's en groeps-threadberichten. Feishu/Lark ACP wordt aangestuurd met tekstopdrachten - er zijn geen native slash-commandmenu's, dus gebruik `/acp ...`-berichten direct in het gesprek.

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

In een Feishu/Lark-DM of thread:

```text
/acp spawn codex --thread here
```

`--thread here` werkt voor DM's en Feishu/Lark-threadberichten. Vervolgberichten in het gebonden gesprek worden direct naar die ACP-sessie gerouteerd.

### Multi-agentroutering

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
- `match.peer.id`: gebruikers-Open ID (`ou_xxx`) of groeps-ID (`oc_xxx`)

Zie [Groeps-/gebruikers-ID's ophalen](#get-groupuser-ids) voor opzoektips.

---

## Agentisolatie per gebruiker (Dynamic Agent Creation)

Schakel `dynamicAgentCreation` in om automatisch **geïsoleerde agentinstanties** te maken voor elke DM-gebruiker. Elke gebruiker krijgt een eigen:

- Onafhankelijke werkruimtemap
- Afzonderlijke `USER.md` / `SOUL.md` / `MEMORY.md`
- Privégespreksgeschiedenis
- Geïsoleerde skills en status

Dit is essentieel voor openbare bots waarbij je elke gebruiker een eigen privéervaring met een AI-assistent wilt geven.

<Note>
Dynamische bindingen bevatten het genormaliseerde Feishu-`accountId`, zodat standaardaccounts en benoemde accounts elke afzender naar de juiste dynamische agent routeren.

Als een benoemd account een ongescopete dynamische agent op een oudere release heeft gemaakt, telt die legacy-agent nog steeds mee voor `maxAgents`. Bevestig dat deze niet door het standaardaccount wordt gebruikt voordat je hem verwijdert, of verhoog tijdelijk `maxAgents`; OpenClaw kan niet veilig afleiden welk account eigenaar is van ambigue legacy-status.
</Note>

### Snelle configuratie

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Hoe het werkt

Wanneer een nieuwe gebruiker zijn eerste DM stuurt:

1. Het kanaal genereert een unieke `agentId`: `feishu-{user_open_id}` voor het standaardaccount, of een begrensde identiteitsdigest met accountprefix voor een benoemd account
2. Maakt een nieuwe werkruimte aan op het `workspaceTemplate`-pad
3. Registreert de agent en maakt een binding voor deze gebruiker
4. De werkruimtehelper zorgt bij eerste toegang voor bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `USER.md`, enz.)
5. Routeert alle toekomstige berichten van deze gebruiker naar hun toegewezen agent

### Configuratieopties

| Instelling                                                | Beschrijving                                      | Standaard                            |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische agentcreatie per gebruiker inschakelen | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Padsjabloon voor dynamische agentwerkruimten      | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Sjabloon voor agentdirectorynaam                  | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximumaantal dynamische agents om te maken       | onbeperkt                            |

Sjabloonvariabelen:

- `{agentId}` - de gegenereerde agent-ID (bijv. `feishu-ou_xxxxxx` of `feishu-support-<identity_digest>`)
- `{userId}` - de Feishu open_id van de afzender (bijv. `ou_xxxxxx`)

### Sessiebereik

`session.dmScope` bepaalt hoe directe berichten aan agentsessies worden gekoppeld. Dit is een **globale instelling** die alle kanalen beïnvloedt.

| Waarde                       | Gedrag                                                              | Het meest geschikt voor                                             |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | De DM van elke gebruiker wordt gekoppeld aan de hoofdsessie van diens agent | Bots voor één gebruiker waarbij je wilt dat `USER.md` / `SOUL.md` automatisch worden geladen |
| `"per-channel-peer"`         | Elke combinatie van (kanaal + gebruiker) krijgt een afzonderlijke sessie | Publieke multi-user bots die sterkere isolatie nodig hebben        |
| `"per-account-channel-peer"` | Elke combinatie van (account + kanaal + gebruiker) krijgt een afzonderlijke sessie | Multi-account bots die sessie-isolatie op accountniveau nodig hebben |

**Afweging**: Het gebruik van `"main"` maakt automatisch laden van bootstrapbestanden (`USER.md`, `SOUL.md`, `MEMORY.md`) mogelijk, maar betekent dat alle DM's over alle kanalen hetzelfde patroon voor sessiesleutels delen. Overweeg voor publieke multi-user bots waarbij isolatie belangrijker is dan automatisch laden bij bootstrap `"per-channel-peer"` en beheer bootstrapbestanden handmatig.

<Note>
Gebruik `"per-account-channel-peer"` wanneer benoemde Feishu-accounts afzonderlijke sessies voor dezelfde afzender moeten behouden. Dynamische koppelingen behouden het accountbereik.
</Note>

```json5
{
  session: {
    // Voor persoonlijke bots voor één gebruiker: schakelt automatisch laden bij bootstrap in
    dmScope: "main",

    // Voor publieke multi-user bots: sterkere isolatie
    // dmScope: "per-channel-peer",
  },
}
```

### Typische multi-user implementatie

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Kies dmScope op basis van je isolatiebehoeften:
    // "main" voor automatisch laden bij bootstrap, "per-channel-peer" voor sterkere isolatie
    dmScope: "main",
  },
  bindings: [], // Leeg - dynamische agents koppelen automatisch
}
```

### Verificatie

Controleer Gateway-logboeken om te bevestigen dat dynamische creatie werkt:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Alle gemaakte werkruimten weergeven:

```bash
ls -la ~/.openclaw/workspace-*
```

### Opmerkingen

- **Werkruimte-isolatie**: Elke gebruiker krijgt een eigen werkruimtedirectory en agentinstantie. Gebruikers kunnen elkaars gespreksgeschiedenis of bestanden binnen de normale berichtstroom niet zien.
- **Beveiligingsgrens**: Dit is een isolatiemechanisme voor berichtcontexten, geen beveiligingsgrens voor vijandige co-tenants. Het agentproces en de hostomgeving worden gedeeld.
- **`bindings` moet leeg zijn**: Dynamische agents registreren automatisch hun eigen koppelingen
- **Upgradepad**: Bestaande handmatige koppelingen blijven naast dynamische agents werken
- **`session.dmScope` is globaal**: Dit beïnvloedt alle kanalen, niet alleen Feishu

---

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                                | Beschrijving                                                                    | Standaard                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Het kanaal in-/uitschakelen                                                     | `true`                               |
| `channels.feishu.domain`                                 | API-domein (`feishu` of `lark`)                                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | Eventtransport (`websocket` of `webhook`)                                       | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Standaardaccount voor uitgaande routering                                       | `default`                            |
| `channels.feishu.verificationToken`                      | Vereist voor webhookmodus                                                        | -                                    |
| `channels.feishu.encryptKey`                             | Vereist voor webhookmodus                                                        | -                                    |
| `channels.feishu.webhookPath`                            | Webhook-routepad                                                                 | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook-bindhost                                                                 | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook-bindpoort                                                                | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App-ID                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Domeinoverschrijving per account                                                | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | TTS-overschrijving per account                                                  | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM-beleid                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM-toestaanlijst (open_id-lijst)                                                | -                                    |
| `channels.feishu.groupPolicy`                            | Groepsbeleid                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Groepstoestaanlijst                                                              | -                                    |
| `channels.feishu.requireMention`                         | @vermelding in groepen vereisen                                                 | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | Overschrijving per groep voor @vermelding; expliciete ID's laten de groep ook toe in allowlist-modus | overgenomen                          |
| `channels.feishu.groups.<chat_id>.enabled`               | Een specifieke groep in-/uitschakelen                                           | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische agentcreatie per gebruiker inschakelen                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Padsjabloon voor dynamische agentwerkruimten                                    | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Sjabloon voor agentdirectorynaam                                                | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximumaantal dynamische agents om te maken                                     | onbeperkt                            |
| `channels.feishu.textChunkLimit`                         | Grootte van berichtdeel                                                         | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Limiet voor mediagrootte                                                        | `30`                                 |
| `channels.feishu.streaming`                              | Streaming-kaartuitvoer                                                          | `true`                               |
| `channels.feishu.blockStreaming`                         | Reply-streaming voor voltooid blok                                              | `false`                              |
| `channels.feishu.typingIndicator`                        | Typreacties verzenden                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Weergavenamen van afzenders oplossen                                            | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base-tools inschakelen                                                  | `true`                               |
| `channels.feishu.tools.base`                             | Alias voor `channels.feishu.tools.bitable`; expliciete `bitable` wint wanneer beide zijn ingesteld | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Bitable/Base-toolpoort per account                                              | overgenomen                          |
| `channels.feishu.accounts.<id>.tools.base`               | Alias per account voor `tools.bitable`                                          | overgenomen                          |

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
de voice-note-resource en voert gedeelde audiotranscriptie uit vóór de
agentbeurt, zodat de agent het gesproken transcript ontvangt. Als Feishu
transcripttekst rechtstreeks in de audiopayload opneemt, wordt die tekst gebruikt zonder nog een
ASR-aanroep. Zonder provider voor audiotranscriptie ontvangt de agent nog steeds een
`<media:audio>`-placeholder plus de opgeslagen bijlage, niet de ruwe Feishu-
resourcepayload.

### Verzenden

- ✅ Tekst
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Interactieve kaarten (inclusief streaming-updates)
- ⚠️ Rich text (opmaak in berichtstijl; ondersteunt niet de volledige Feishu/Lark-authoringmogelijkheden)

Native Feishu/Lark-audiobubbels gebruiken het Feishu-berichttype `audio` en vereisen
Ogg/Opus-uploadmedia (`file_type: "opus"`). Bestaande `.opus`- en `.ogg`-media
worden direct als native audio verzonden. MP3/WAV/M4A en andere waarschijnlijke audioformaten worden
alleen naar 48 kHz Ogg/Opus getranscodeerd met `ffmpeg` wanneer het antwoord om spraakbezorging vraagt
(`audioAsVoice` / berichttool `asVoice`, inclusief TTS-spraaknotitieantwoorden).
Gewone MP3-bijlagen blijven gewone bestanden. Als `ffmpeg` ontbreekt of
conversie mislukt, valt OpenClaw terug op een bestandsbijlage en logt de reden.

### Threads en antwoorden

- ✅ Inline antwoorden
- ✅ Thread-antwoorden
- ✅ Media-antwoorden blijven thread-bewust bij het antwoorden op een thread-bericht

Voor `groupSessionScope: "group_topic"` en `"group_topic_sender"` gebruiken native
Feishu/Lark-onderwerpgroepen de gebeurtenis `thread_id` (`omt_*`) als de canonieke
onderwerpssessiesleutel. Als een native onderwerpstartergebeurtenis `thread_id` weglaat, hydrateert OpenClaw
deze vanuit Feishu voordat de beurt wordt gerouteerd. Normale groepsantwoorden die
OpenClaw omzet in threads blijven de bericht-ID van de antwoordroot (`om_*`) gebruiken, zodat de
eerste beurt en vervolgbeurt in dezelfde sessie blijven.

---

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - groepschatgedrag en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
