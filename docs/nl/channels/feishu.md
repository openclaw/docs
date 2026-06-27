---
read_when:
    - Je wilt een Feishu/Lark-bot koppelen
    - Je configureert het Feishu-kanaal
summary: Overzicht, functies en configuratie van de Feishu-bot
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
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
  Kies handmatige installatie om een App ID en App Secret van Feishu Open Platform te plakken, of kies QR-installatie om automatisch een bot te maken. Als de binnenlandse mobiele Feishu-app niet reageert op de QR-code, voer de installatie dan opnieuw uit en kies handmatige installatie.
  </Step>
  
  <Step title="Nadat de installatie is voltooid, herstart je de gateway om de wijzigingen toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Toegangscontrole

### Directe berichten

Configureer `dmPolicy` om te bepalen wie de bot een DM kan sturen:

- `"pairing"` - onbekende gebruikers ontvangen een koppelingscode; keur goed via CLI
- `"allowlist"` - alleen gebruikers die in `allowFrom` staan, kunnen chatten
- `"open"` - sta openbare DM's alleen toe wanneer `allowFrom` `"*"` bevat; bij beperkende vermeldingen kunnen alleen overeenkomende gebruikers chatten
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

**Vermeldingsvereiste** (`channels.feishu.requireMention`):

- `true` - vereis @vermelding (standaard)
- `false` - reageer zonder @vermelding
- Overschrijving per groep: `channels.feishu.groups.<chat_id>.requireMention`
- Alleen-broadcast `@all` en `@_all` worden niet behandeld als botvermeldingen. Een bericht dat zowel `@all` als de bot direct vermeldt, telt nog steeds als botvermelding.

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

### Alle groepen toestaan, nog steeds @vermelding vereist

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

In `allowlist`-modus kun je ook een groep toelaten door een expliciete `groups.<chat_id>`-vermelding toe te voegen. Expliciete vermeldingen overschrijven `groupPolicy: "disabled"` niet. Jokertekenstandaarden onder `groups.*` configureren overeenkomende groepen, maar laten op zichzelf geen groepen toe.

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

Open de groep in Feishu/Lark, klik op het menu-icoon in de rechterbovenhoek en ga naar **Instellingen**. De groeps-ID (`chat_id`) staat op de instellingenpagina.

![Groeps-ID ophalen](/images/feishu-get-group-id.png)

### Gebruikers-ID's (`open_id`, formaat: `ou_xxx`)

Start de gateway, stuur een DM naar de bot en controleer vervolgens de logs:

```bash
openclaw logs --follow
```

Zoek naar `open_id` in de loguitvoer. Je kunt ook wachtende koppelingsverzoeken controleren:

```bash
openclaw pairing list feishu
```

---

## Veelgebruikte opdrachten

| Opdracht  | Beschrijving                  |
| --------- | ----------------------------- |
| `/status` | Toon botstatus                |
| `/reset`  | Reset de huidige sessie       |
| `/model`  | Toon of wissel het AI-model   |

<Note>
Feishu/Lark ondersteunt geen native slash-commandmenu's, dus stuur deze als platte tekstberichten.
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
5. Zorg dat de gateway draait: `openclaw gateway status`
6. Controleer logs: `openclaw logs --follow`

### QR-installatie reageert niet in de mobiele Feishu-app

1. Voer de installatie opnieuw uit: `openclaw channels login --channel feishu`
2. Kies handmatige installatie
3. Maak in Feishu Open Platform een zelfgebouwde app en kopieer de App ID en App Secret
4. Plak die inloggegevens in de installatiewizard

### App Secret gelekt

1. Reset de App Secret in Feishu Open Platform / Lark Developer
2. Werk de waarde in je configuratie bij
3. Herstart de gateway: `openclaw gateway restart`

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
globale TTS-configuratie, zodat Feishu-setups met meerdere bots gedeelde provider-
inloggegevens globaal kunnen behouden terwijl alleen stem, model, persona of automatische modus
per account wordt overschreven.

### Berichtlimieten

- `textChunkLimit` - grootte van uitgaande tekstfragmenten (standaard: `2000` tekens)
- `mediaMaxMb` - limiet voor media-upload/download (standaard: `30` MB)

### Streaming

Feishu/Lark ondersteunt streamingantwoorden via interactieve kaarten. Wanneer ingeschakeld, werkt de bot de kaart in realtime bij terwijl tekst wordt gegenereerd.

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

Stel `streaming: false` in om het volledige antwoord in één bericht te verzenden. `blockStreaming` staat standaard uit; schakel dit alleen in wanneer je voltooide assistentblokken vóór het uiteindelijke antwoord wilt doorspoelen.

### Quota-optimalisatie

Verminder het aantal Feishu/Lark-API-aanroepen met twee optionele vlaggen:

- `typingIndicator` (standaard `true`): stel in op `false` om typreactie-aanroepen over te slaan
- `resolveSenderNames` (standaard `true`): stel in op `false` om opzoekacties voor afzenderprofielen over te slaan

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

Feishu/Lark ondersteunt ACP voor DM's en groepsthreadberichten. Feishu/Lark ACP wordt aangestuurd door tekstopdrachten - er zijn geen native slash-commandmenu's, dus gebruik `/acp ...`-berichten direct in het gesprek.

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

#### ACP spawnen vanuit chat

In een Feishu/Lark-DM of thread:

```text
/acp spawn codex --thread here
```

`--thread here` werkt voor DM's en Feishu/Lark-threadberichten. Vervolgberichten in het gebonden gesprek worden direct naar die ACP-sessie gerouteerd.

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

## Agentisolatie per gebruiker (Dynamische agentcreatie)

Schakel `dynamicAgentCreation` in om automatisch **geïsoleerde agentinstanties** te maken voor elke DM-gebruiker. Elke gebruiker krijgt een eigen:

- Onafhankelijke werkruimtemap
- Afzonderlijke `USER.md` / `SOUL.md` / `MEMORY.md`
- Privé gespreksgeschiedenis
- Geïsoleerde Skills en state

Dit is essentieel voor openbare bots waarbij je wilt dat elke gebruiker een eigen privé-AI-assistentervaring heeft.

<Note>
Dynamische bindingen bevatten de genormaliseerde Feishu-`accountId`, zodat standaardaccounts en benoemde accounts elke afzender naar de juiste dynamische agent routeren.

Als een benoemd account op een oudere release een niet-gescopete dynamische agent heeft gemaakt, telt die legacy-agent nog steeds mee voor `maxAgents`. Bevestig dat deze niet door het standaardaccount wordt gebruikt voordat je hem verwijdert, of verhoog `maxAgents` tijdelijk; OpenClaw kan niet veilig afleiden welk account eigenaar is van dubbelzinnige legacy-state.
</Note>

### Snelle installatie

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

1. Het kanaal genereert een unieke `agentId`: `feishu-{user_open_id}` voor het standaardaccount, of een begrensde identiteitssamenvatting met accountprefix voor een benoemd account
2. Maakt een nieuwe werkruimte aan op het pad `workspaceTemplate`
3. Registreert de agent en maakt een binding voor deze gebruiker
4. De werkruimtehelper zorgt bij eerste toegang voor bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `USER.md`, enz.)
5. Routeert alle toekomstige berichten van deze gebruiker naar zijn toegewezen agent

### Configuratieopties

| Instelling                                              | Beschrijving                                      | Standaard                            |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatisch agents per gebruiker aanmaken inschakelen | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Padsjabloon voor dynamische agentwerkruimten      | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Sjabloon voor agentmapnaam                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximumaantal dynamische agents om aan te maken   | onbeperkt                            |

Sjabloonvariabelen:

- `{agentId}` - de gegenereerde agent-ID (bijv. `feishu-ou_xxxxxx` of `feishu-support-<identity_digest>`)
- `{userId}` - de Feishu `open_id` van de afzender (bijv. `ou_xxxxxx`)

### Sessiebereik

`session.dmScope` bepaalt hoe directe berichten aan agentsessies worden gekoppeld. Dit is een **globale instelling** die van invloed is op alle kanalen.

| Waarde                       | Gedrag                                                              | Het meest geschikt voor                                            |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | De DM van elke gebruiker wordt gekoppeld aan de hoofdsessie van de agent | Bots voor één gebruiker waarbij je wilt dat `USER.md` / `SOUL.md` automatisch worden geladen |
| `"per-channel-peer"`         | Elke combinatie van (kanaal + gebruiker) krijgt een aparte sessie   | Openbare bots met meerdere gebruikers die sterkere isolatie nodig hebben |
| `"per-account-channel-peer"` | Elke combinatie van (account + kanaal + gebruiker) krijgt een aparte sessie | Bots met meerdere accounts die sessie-isolatie op accountniveau nodig hebben |

**Afweging**: Het gebruik van `"main"` schakelt automatisch laden van bootstrapbestanden in (`USER.md`, `SOUL.md`, `MEMORY.md`), maar betekent dat alle DM's over alle kanalen hetzelfde sessiesleutelpatroon delen. Voor openbare bots met meerdere gebruikers waarbij isolatie belangrijker is dan automatisch laden van bootstrapbestanden, overweeg `"per-channel-peer"` en beheer bootstrapbestanden handmatig.

<Note>
Gebruik `"per-account-channel-peer"` wanneer benoemde Feishu-accounts aparte sessies moeten behouden voor dezelfde afzender. Dynamische bindingen behouden het accountbereik.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Typische implementatie voor meerdere gebruikers

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Verificatie

Controleer Gateway-logboeken om te bevestigen dat dynamisch aanmaken werkt:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Geef alle aangemaakte werkruimten weer:

```bash
ls -la ~/.openclaw/workspace-*
```

### Opmerkingen

- **Werkruimte-isolatie**: Elke gebruiker krijgt een eigen werkruimtemap en agentinstantie. Gebruikers kunnen elkaars gespreksgeschiedenis of bestanden binnen de normale berichtenstroom niet zien.
- **Beveiligingsgrens**: Dit is een isolatiemechanisme voor berichtcontext, geen beveiligingsgrens tegen vijandige medehuurders. Het agentproces en de hostomgeving worden gedeeld.
- **`bindings` moet leeg zijn**: Dynamische agents registreren automatisch hun eigen bindingen
- **Upgradepad**: Bestaande handmatige bindingen blijven naast dynamische agents werken
- **`session.dmScope` is globaal**: Dit is van invloed op alle kanalen, niet alleen Feishu

---

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                              | Beschrijving                                                                    | Standaard                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Het kanaal in-/uitschakelen                                                     | `true`                               |
| `channels.feishu.domain`                                 | API-domein (`feishu` of `lark`)                                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | Eventtransport (`websocket` of `webhook`)                                        | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Standaardaccount voor uitgaande routering                                        | `default`                            |
| `channels.feishu.verificationToken`                      | Vereist voor webhookmodus                                                        | -                                    |
| `channels.feishu.encryptKey`                             | Vereist voor webhookmodus                                                        | -                                    |
| `channels.feishu.webhookPath`                            | Webhook-routepad                                                                 | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook-bindhost                                                                 | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook-bindpoort                                                                | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App-ID                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Domeinoverschrijving per account                                                 | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | TTS-overschrijving per account                                                   | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM-beleid                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM-toestaanlijst (`open_id`-lijst)                                               | -                                    |
| `channels.feishu.groupPolicy`                            | Groepsbeleid                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Groepstoestaanlijst                                                              | -                                    |
| `channels.feishu.requireMention`                         | @vermelding in groepen vereisen                                                  | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | @vermelding-overschrijving per groep; expliciete ID's laten de groep ook toe in toestaanlijstmodus | overgenomen                          |
| `channels.feishu.groups.<chat_id>.enabled`               | Een specifieke groep in-/uitschakelen                                            | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatisch agents per gebruiker aanmaken inschakelen                            | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Padsjabloon voor dynamische agentwerkruimten                                     | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Sjabloon voor agentmapnaam                                                       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximumaantal dynamische agents om aan te maken                                  | onbeperkt                            |
| `channels.feishu.textChunkLimit`                         | Grootte van berichtchunk                                                         | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Limiet voor mediagrootte                                                         | `30`                                 |
| `channels.feishu.streaming`                              | Streaming kaartuitvoer                                                           | `true`                               |
| `channels.feishu.blockStreaming`                         | Reply-streaming van voltooide blokken                                            | `false`                              |
| `channels.feishu.typingIndicator`                        | Typreacties verzenden                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Weergavenamen van afzenders ophalen                                              | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base-tools inschakelen                                                   | `true`                               |
| `channels.feishu.tools.base`                             | Alias voor `channels.feishu.tools.bitable`; expliciete `bitable` wint wanneer beide zijn ingesteld | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Bitable/Base-toolpoort per account                                               | overgenomen                          |
| `channels.feishu.accounts.<id>.tools.base`               | Alias per account voor `tools.bitable`                                           | overgenomen                          |

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

Inkomende Feishu/Lark-audioberichten worden genormaliseerd als mediaplaceholders in plaats
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
- ⚠️ Rich text (post-achtige opmaak; ondersteunt niet de volledige auteurmogelijkheden van Feishu/Lark)

Native Feishu/Lark-audiobubbels gebruiken het Feishu-berichttype `audio` en vereisen
Ogg/Opus-uploadmedia (`file_type: "opus"`). Bestaande `.opus`- en `.ogg`-media
worden rechtstreeks als native audio verzonden. MP3/WAV/M4A en andere waarschijnlijke audio-indelingen worden
alleen met `ffmpeg` getranscodeerd naar 48 kHz Ogg/Opus wanneer het antwoord spraakbezorging aanvraagt
(`audioAsVoice` / berichttool `asVoice`, inclusief TTS-spraaknotitie-antwoorden).
Gewone MP3-bijlagen blijven normale bestanden. Als `ffmpeg` ontbreekt of
conversie mislukt, valt OpenClaw terug op een bestandsbijlage en logt de reden.

### Threads en antwoorden

- ✅ Inline antwoorden
- ✅ Thread-antwoorden
- ✅ Media-antwoorden blijven thread-bewust bij antwoorden op een thread-bericht

Voor `groupSessionScope: "group_topic"` en `"group_topic_sender"` gebruiken native
Feishu/Lark-onderwerpgroepen de event-`thread_id` (`omt_*`) als de canonieke
onderwerpssessiesleutel. Als een native topic-starterevent `thread_id` weglaat, hydrateert OpenClaw
deze vanuit Feishu voordat de beurt wordt gerouteerd. Normale groepsantwoorden die
OpenClaw omzet in threads blijven de antwoordrootbericht-ID (`om_*`) gebruiken, zodat de
eerste beurt en vervolgbeurt in dezelfde sessie blijven.

---

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - groepschatgedrag en vermelding-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
