---
read_when:
    - Je wilt een Feishu/Lark-bot verbinden
    - Je configureert het Feishu-kanaal
summary: Overzicht, functies en configuratie van de Feishu-bot
title: Feishu
x-i18n:
    generated_at: "2026-07-16T15:06:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw maakt verbinding met Feishu/Lark (het alles-in-één samenwerkingsplatform) via de officiële `@openclaw/feishu`-plugin: privéberichten aan bots, groepschats, streamende kaartantwoorden en tools voor Feishu-documenten, wiki's, Drive en Bitable.

**Status:** productieklaar voor privéberichten aan bots en groepschats. WebSocket is het standaardgebeurtenistransport (geen openbare URL nodig); de webhookmodus is optioneel.

## Snel aan de slag

<Note>
Vereist OpenClaw 2026.5.29 of hoger. Voer `openclaw --version` uit om dit te controleren. Upgrade met `openclaw update`.
</Note>

<Steps>
  <Step title="Voer de configuratiewizard voor het kanaal uit">
  ```bash
  openclaw channels login --channel feishu
  ```
  Hiermee wordt de `@openclaw/feishu`-plugin geïnstalleerd als deze ontbreekt, waarna je door de configuratie wordt geleid:

- **Handmatige configuratie**: plak een App ID en App Secret uit Feishu Open Platform (`https://open.feishu.cn`) of Lark Developer (`https://open.larksuite.com`).
- **QR-configuratie**: scan een QR-code in de Feishu-app om automatisch een bot te maken. Met deze procedure worden privéberichten beperkt tot je eigen account (`dmPolicy: "allowlist"` met jouw `open_id`).

De wizard vraagt ook naar het API-domein (Feishu of Lark) en het groepsbeleid. Als de binnenlandse mobiele Feishu-app niet op de QR-code reageert, voer je de configuratie opnieuw uit en kies je handmatige configuratie.
</Step>

  <Step title="Start de Gateway opnieuw nadat de configuratie is voltooid om de wijzigingen toe te passen">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Toegangsbeheer

### Privéberichten

Configureer `channels.feishu.dmPolicy` (standaard: `pairing`) om te bepalen wie de bot een privébericht kan sturen:

| Waarde         | Gedrag                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Onbekende gebruikers ontvangen een koppelingscode; keur deze goed via de CLI                                                         |
| `"allowlist"` | Alleen gebruikers die in `allowFrom` staan, kunnen chatten                                                                     |
| `"open"`      | Openbare privéberichten; voor configuratievalidatie moet `allowFrom` `"*"` bevatten. Vermeldingen zonder jokerteken beperken de toegang nog steeds |

**Een koppelingsverzoek goedkeuren:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Groepschats

**Groepsbeleid** (`channels.feishu.groupPolicy`, standaard: `allowlist`):

| Waarde         | Gedrag                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Reageert op alle berichten in groepen                                                            |
| `"allowlist"` | Reageert alleen op groepen in `groupAllowFrom` of groepen die expliciet onder `groups.<chat_id>` zijn geconfigureerd |
| `"disabled"`  | Schakelt alle groepsberichten uit; expliciete vermeldingen in `groups.<chat_id>` heffen dit niet op         |

**Vereiste vermelding** (`channels.feishu.requireMention`):

- Standaard: een @vermelding is vereist, behalve wanneer het effectieve groepsbeleid `"open"` is; daar is de standaardwaarde `false`, zodat berichten die geen vermeldingen kunnen bevatten (bijvoorbeeld afbeeldingen) de agent toch bereiken.
- Stel `true` of `false` expliciet in om dit te overschrijven; overschrijving per groep: `channels.feishu.groups.<chat_id>.requireMention`.
- De uitsluitend voor uitzending bedoelde `@all` en `@_all` worden niet als botvermeldingen behandeld. Een bericht waarin zowel `@all` als de bot rechtstreeks wordt vermeld, geldt nog steeds als een botvermelding.

## Voorbeelden van groepsconfiguratie

### Alle groepen toestaan, geen @vermelding vereist

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
    },
  },
}
```

### Alle groepen toestaan, maar nog steeds een @vermelding vereisen

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

In de modus `allowlist` kun je een groep ook toelaten door een expliciete vermelding in `groups.<chat_id>` toe te voegen. Expliciete vermeldingen heffen `groupPolicy: "disabled"` niet op. Standaardwaarden met jokertekens onder `groups.*` configureren overeenkomende groepen, maar laten op zichzelf geen groepen toe.

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

`channels.feishu.groupSenderAllowFrom` stelt dezelfde toelatingslijst voor afzenders in voor alle groepen; een `allowFrom` per groep heeft voorrang.

<a id="get-groupuser-ids"></a>

## Groeps-/gebruikers-ID's ophalen

### Groeps-ID's (`chat_id`, indeling: `oc_xxx`)

Open de groep in Feishu/Lark, klik op het menupictogram in de rechterbovenhoek en ga naar **Settings**. Het groeps-ID (`chat_id`) staat op de instellingenpagina.

![Groeps-ID ophalen](/images/feishu-get-group-id.png)

### Gebruikers-ID's (`open_id`, indeling: `ou_xxx`)

Start de Gateway, stuur de bot een privébericht en controleer vervolgens de logboeken:

```bash
openclaw logs --follow
```

Zoek naar `open_id` in de loguitvoer. Je kunt ook openstaande koppelingsverzoeken controleren:

```bash
openclaw pairing list feishu
```

## Veelgebruikte opdrachten

| Opdracht   | Beschrijving                 |
| --------- | --------------------------- |
| `/status` | Botstatus weergeven             |
| `/reset`  | De huidige sessie opnieuw instellen   |
| `/model`  | Het AI-model weergeven of wijzigen |

<Note>
Feishu/Lark ondersteunt geen systeemeigen menu's voor slash-opdrachten, dus stuur deze als plattetekstberichten.
</Note>

## Problemen oplossen

### De bot reageert niet in groepschats

1. Controleer of de bot aan de groep is toegevoegd
2. Zorg dat je de bot met een @vermelding vermeldt (standaard vereist)
3. Controleer of `groupPolicy` niet `"disabled"` is
4. Controleer de logboeken: `openclaw logs --follow`

### De bot ontvangt geen berichten

1. Controleer of de bot in Feishu Open Platform / Lark Developer is gepubliceerd en goedgekeurd
2. Controleer of het gebeurtenisabonnement `im.message.receive_v1` bevat
3. Controleer of **persistent connection** (WebSocket) is geselecteerd
4. Controleer of alle vereiste machtigingsbereiken zijn verleend
5. Controleer of de Gateway actief is: `openclaw gateway status`
6. Controleer de logboeken: `openclaw logs --follow`

### QR-configuratie reageert niet in de mobiele Feishu-app

1. Voer de configuratie opnieuw uit: `openclaw channels login --channel feishu`
2. Kies handmatige configuratie
3. Maak in Feishu Open Platform een zelfgebouwde app en kopieer de App ID en App Secret
4. Plak deze inloggegevens in de configuratiewizard

### App Secret gelekt

1. Stel de App Secret opnieuw in via Feishu Open Platform / Lark Developer
2. Werk de waarde in je configuratie bij
3. Start de Gateway opnieuw: `openclaw gateway restart`

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

`defaultAccount` bepaalt welk account wordt gebruikt wanneer uitgaande API's geen `accountId` opgeven. Accountvermeldingen nemen instellingen op het hoogste niveau over; de meeste sleutels op het hoogste niveau kunnen per account worden overschreven.
`accounts.<id>.tts` gebruikt dezelfde structuur als `messages.tts` en wordt diepgaand samengevoegd met de algemene TTS-configuratie. Daardoor kunnen Feishu-configuraties met meerdere bots gedeelde providerinloggegevens algemeen bewaren en alleen de stem, het model, de persona of de automatische modus per account overschrijven.

### Berichtlimieten

- `textChunkLimit` - fragmentgrootte van uitgaande tekst (standaard: `4000` tekens)
- `streaming.chunkMode` - `"length"` (standaard) splitst bij de limiet; `"newline"` geeft de voorkeur aan regelgrenzen
- `mediaMaxMb` - limiet voor het uploaden/downloaden van media (standaard: `30` MB)

### Streaming

Feishu/Lark ondersteunt streamende antwoorden via interactieve kaarten (Card Kit-streaming-API). Wanneer dit is ingeschakeld, werkt de bot de kaart in realtime bij terwijl tekst wordt gegenereerd.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

Stel `streaming.mode: "off"` in om het volledige antwoord in één bericht te verzenden; `renderMode: "raw"` (platte tekst in plaats van kaarten) schakelt streamende kaarten eveneens uit. `streaming.block.enabled` is standaard uitgeschakeld; schakel dit alleen in wanneer je voltooide assistentblokken vóór het definitieve antwoord wilt laten verzenden. De verouderde booleaanse waarde `streaming` en de platte sleutels `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` worden via `openclaw doctor --fix` naar deze geneste structuur gemigreerd.

### Quotumoptimalisatie

Verminder het aantal Feishu/Lark-API-aanroepen met twee optionele vlaggen:

- `typingIndicator` (standaard `true`): stel `false` in om aanroepen voor typreacties over te slaan
- `resolveSenderNames` (standaard `true`): stel `false` in om het opzoeken van afzenderprofielen over te slaan

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

### Bereik van groepssessies en onderwerpthreads

`channels.feishu.groupSessionScope` (op het hoogste niveau, per account of per groep) bepaalt hoe groepsberichten aan agentsessies worden gekoppeld:

| Waarde                  | Sessie                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (standaard)    | Eén sessie per groepschat                                       |
| `"group_sender"`       | Eén sessie per (groep + afzender)                                 |
| `"group_topic"`        | Eén sessie per onderwerpthread; valt terug op de groepssessie    |
| `"group_topic_sender"` | Eén sessie per (onderwerp + afzender); valt terug op (groep + afzender) |

Voor de onderwerpbereiken gebruiken systeemeigen Feishu/Lark-onderwerpgroepen de gebeurtenis `thread_id` (`omt_*`) als canonieke sessiesleutel voor het onderwerp. Als `thread_id` ontbreekt in een systeemeigen gebeurtenis die een onderwerp start, haalt OpenClaw deze vóór het routeren van de beurt op uit Feishu. Normale groepsantwoorden waarvan OpenClaw threads maakt, blijven het bericht-ID van het hoofdantwoord (`om_*`) gebruiken, zodat de eerste en volgende beurten in dezelfde sessie blijven.

Stel `replyInThread: "enabled"` in (op het hoogste niveau of per groep) om botantwoorden een Feishu-onderwerpthread te laten maken of voortzetten in plaats van inline te antwoorden. `topicSessionMode` is de verouderde voorganger van `groupSessionScope`; geef de voorkeur aan `groupSessionScope`.

### Feishu-werkruimtetools

De plugin bevat agenttools voor Feishu-documenten, chats, de kennisbank, cloudopslag, machtigingen en Bitable, plus bijbehorende Skills (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). Toolfamilies worden beheerd via `channels.feishu.tools`:

| Sleutel         | Tools                                         | Standaard           |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` documentbewerkingen              | `true`              |
| `tools.chat`    | `feishu_chat` chatinformatie + ledenquery's      | `true`              |
| `tools.wiki`    | `feishu_wiki` kennisbank (vereist `doc`) | `true`              |
| `tools.drive`   | `feishu_drive` cloudopslag                  | `true`              |
| `tools.perm`    | `feishu_perm` rechtenbeheer           | `false` (gevoelig) |
| `tools.scopes`  | `feishu_app_scopes` diagnostiek van app-bereiken     | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base-bewerkingen    | `true`              |

`tools.base` is een alias voor `tools.bitable`; de expliciete waarde `bitable` heeft voorrang wanneer beide zijn ingesteld. Poorten per account staan onder `accounts.<id>.tools`.

Verleen `drive:drive.metadata:readonly` voor rechtstreekse `feishu_drive info`-zoekacties buiten de hoofdmap,
tenzij de app al het volledige bereik `drive:drive` heeft. Zonder een van beide bereiken houdt `info`
de verouderde zoekactie in de hoofdmap beschikbaar via `drive:drive:readonly`.

### ACP-sessies

Feishu/Lark ondersteunt ACP voor privéberichten en berichten in groepsthreads. Feishu/Lark ACP wordt aangestuurd met tekstopdrachten — er zijn geen ingebouwde menu's voor slash-opdrachten, dus gebruik `/acp ...`-berichten rechtstreeks in het gesprek.

#### Permanente ACP-koppeling

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

#### ACP starten vanuit een chat

In een privébericht of thread van Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` werkt voor privéberichten en threadberichten van Feishu/Lark. Vervolgberichten in het gekoppelde gesprek worden rechtstreeks naar die ACP-sessie gerouteerd.

### Routering met meerdere agents

Gebruik `bindings` om privéberichten of groepen van Feishu/Lark naar verschillende agents te routeren.

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
- `match.peer.kind`: `"direct"` (privébericht) of `"group"` (groepschat)
- `match.peer.id`: Open ID van gebruiker (`ou_xxx`) of groeps-ID (`oc_xxx`)

Zie [Groeps-/gebruikers-ID's ophalen](#get-groupuser-ids) voor zoektips.

## Agentisolatie per gebruiker (dynamische agentaanmaak)

Schakel `dynamicAgentCreation` in om automatisch **geïsoleerde agentinstanties** voor elke gebruiker van privéberichten te maken. Elke gebruiker krijgt een eigen:

- Onafhankelijke werkruimtemap
- Afzonderlijke `USER.md` / `SOUL.md` / `MEMORY.md`
- Privégespreksgeschiedenis
- Geïsoleerde Skills en status

Dit is essentieel voor openbare bots waarbij je elke gebruiker een eigen, persoonlijke AI-assistentervaring wilt bieden.

<Note>
Dynamische koppelingen bevatten de genormaliseerde Feishu-`accountId`, zodat standaardaccounts en benoemde accounts elke afzender naar de juiste dynamische agent routeren.

Als een benoemd account in een oudere release een dynamische agent zonder bereik heeft gemaakt, telt die verouderde agent nog steeds mee voor `maxAgents`. Controleer vóór verwijdering of deze niet door het standaardaccount wordt gebruikt, of verhoog `maxAgents` tijdelijk; OpenClaw kan niet veilig afleiden welk account eigenaar is van een ambigue verouderde status.
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
    // Cruciaal: maakt het privébericht van elke gebruiker tot diens "hoofdsessie"
    // Laadt automatisch USER.md / SOUL.md / MEMORY.md
    // Gebruik voor sterkere isolatie in plaats daarvan "per-channel-peer"
    dmScope: "main",
  },
}
```

### Werking

Wanneer een nieuwe gebruiker het eerste privébericht verzendt:

1. Het kanaal genereert een unieke `agentId`: `feishu-{user_open_id}` voor het standaardaccount, of een begrensde identiteitsdigest met accountvoorvoegsel voor een benoemd account
2. Maakt een nieuwe werkruimte op het pad `workspaceTemplate`
3. Registreert de agent en maakt een koppeling voor deze gebruiker
4. De werkruimtehelper zorgt bij de eerste toegang voor bootstrapbestanden (`AGENTS.md`, `SOUL.md`, `USER.md`, enz.)
5. Routeert alle toekomstige berichten van deze gebruiker naar diens toegewezen agent

### Configuratieopties

| Instelling                                               | Beschrijving                               | Standaard                             |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische agentaanmaak per gebruiker inschakelen   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Padsjabloon voor dynamische agentwerkruimten | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Naamsjabloon voor agentmap                 | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximaal aantal aan te maken dynamische agents | onbeperkt                            |

Sjabloonvariabelen:

- `{agentId}` - de gegenereerde agent-ID (bijv. `feishu-ou_xxxxxx` of `feishu-support-<identity_digest>`)
- `{userId}` - de Feishu-open_id van de afzender (bijv. `ou_xxxxxx`)

### Sessiebereik

`session.dmScope` bepaalt hoe privéberichten aan agentsessies worden gekoppeld. Dit is een **globale instelling** die alle kanalen beïnvloedt.

| Waarde                       | Gedrag                                                              | Meest geschikt voor                                                |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Het privébericht van elke gebruiker wordt aan de hoofdsessie van diens agent gekoppeld | Bots voor één gebruiker waarbij je `USER.md` / `SOUL.md` automatisch wilt laden |
| `"per-peer"`                 | Elke gesprekspartner krijgt een afzonderlijke sessie (ongeacht het kanaal) | Isolatie uitsluitend op basis van de identiteit van de afzender   |
| `"per-channel-peer"`         | Elke combinatie van (kanaal + gebruiker) krijgt een afzonderlijke sessie | Openbare bots voor meerdere gebruikers die sterkere isolatie nodig hebben |
| `"per-account-channel-peer"` | Elke combinatie van (account + kanaal + gebruiker) krijgt een afzonderlijke sessie | Bots met meerdere accounts die sessie-isolatie op accountniveau nodig hebben |

**Afweging**: Het gebruik van `"main"` schakelt automatisch laden van bootstrapbestanden in (`USER.md`, `SOUL.md`, `MEMORY.md`), maar betekent dat alle privéberichten in alle kanalen hetzelfde patroon voor sessiesleutels delen. Overweeg voor openbare bots met meerdere gebruikers, waarbij isolatie belangrijker is dan het automatisch laden van bootstrapbestanden, `"per-channel-peer"` en beheer bootstrapbestanden handmatig.

<Note>
Gebruik `"per-account-channel-peer"` wanneer benoemde Feishu-accounts afzonderlijke sessies voor dezelfde afzender moeten behouden. Dynamische koppelingen behouden het accountbereik.
</Note>

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
    // Kies dmScope op basis van je isolatiebehoeften:
    // "main" voor automatisch laden van bootstrapbestanden, "per-channel-peer" voor sterkere isolatie
    dmScope: "main",
  },
  bindings: [], // Leeg - dynamische agents worden automatisch gekoppeld
}
```

### Verificatie

Controleer de Gateway-logboeken om te bevestigen dat dynamische aanmaak werkt:

```text
feishu: dynamische agent "feishu-ou_xxxxxx" wordt aangemaakt voor gebruiker ou_xxxxxx
  werkruimte: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentmap: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Geef alle aangemaakte werkruimten weer:

```bash
ls -la ~/.openclaw/workspace-*
```

### Opmerkingen

- **Werkruimte-isolatie**: Elke gebruiker krijgt een eigen werkruimtemap en agentinstantie. Gebruikers kunnen binnen de normale berichtenstroom elkaars gespreksgeschiedenis of bestanden niet zien.
- **Beveiligingsgrens**: Dit is een isolatiemechanisme voor berichtencontext, geen beveiligingsgrens voor vijandige medehuurders. Het agentproces en de hostomgeving worden gedeeld.
- **Schrijven naar de configuratie moet ingeschakeld blijven**: Dynamische agentaanmaak schrijft agents en koppelingen naar de configuratie; dit wordt overgeslagen wanneer `channels.feishu.configWrites` `false` is (standaard: ingeschakeld).
- **`bindings` moet leeg zijn**: Dynamische agents registreren automatisch hun eigen koppelingen
- **Upgradepad**: Bestaande handmatige koppelingen blijven naast dynamische agents werken
- **`session.dmScope` is globaal**: Dit beïnvloedt alle kanalen, niet alleen Feishu

## Configuratiereferentie

Volledige configuratie: [Gateway-configuratie](/nl/gateway/configuration)

| Instelling                                               | Beschrijving                                                                         | Standaardwaarde                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Het kanaal in-/uitschakelen                                                          | `true`                               |
| `channels.feishu.domain`                                 | API-domein (`feishu`, `lark` of een `https://`-basis-URL)                         | `feishu`                             |
| `channels.feishu.connectionMode`                         | Gebeurtenistransport (`websocket` of `webhook`)                                      | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Standaardaccount voor uitgaande routering                                            | `default`                            |
| `channels.feishu.verificationToken`                      | Vereist voor de Webhook-modus                                                        | -                                    |
| `channels.feishu.encryptKey`                             | Vereist voor de Webhook-modus                                                        | -                                    |
| `channels.feishu.webhookPath`                            | Routepad van de Webhook                                                              | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Bindhost van de Webhook                                                              | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Bindpoort van de Webhook                                                             | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App-ID                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Domeinoverschrijving per account                                                     | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | TTS-overschrijving per account                                                       | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM-beleid (`pairing`, `allowlist`, `open`)                                      | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM-toelatingslijst (lijst met open_id's)                                             | -                                    |
| `channels.feishu.groupPolicy`                            | Groepsbeleid (`open`, `allowlist`, `disabled`)                                  | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Groepstoelatingslijst                                                                | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Toelatingslijst voor afzenders, toegepast op alle groepen                            | -                                    |
| `channels.feishu.requireMention`                         | @vermelding in groepen vereisen                                                      | `true` (`false` bij beleid `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | Overschrijving van @vermelding per groep; expliciete ID's laten de groep ook toe in de toelatingslijstmodus | overgenomen                          |
| `channels.feishu.groups.<chat_id>.enabled`               | Een specifieke groep in-/uitschakelen                                                | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Toelatingslijst voor afzenders per groep (overschrijft `groupSenderAllowFrom`)       | -                                    |
| `channels.feishu.groupSessionScope`                      | Toewijzing van groepssessies (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Botantwoorden maken onderwerpthreads of zetten deze voort (`disabled`, `enabled`)     | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Inkomende reactiegebeurtenissen (`off`, `own`, `all`)                   | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Automatische aanmaak van agents per gebruiker inschakelen                            | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Padsjabloon voor dynamische agentwerkruimten                                          | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Naamsjabloon voor agentmappen                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Maximaal aantal aan te maken dynamische agents                                       | onbeperkt                            |
| `channels.feishu.textChunkLimit`                         | Grootte van berichtsegmenten                                                         | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Segmentopsplitsing (`length` of `newline`)                                         | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Limiet voor mediagrootte                                                             | `30`                                 |
| `channels.feishu.renderMode`                             | Antwoordweergave (`auto`, `raw`, `card`)                                         | `auto`                               |
| `channels.feishu.streaming.mode`                         | Uitvoer van streamingkaarten (`partial` of `off`)                              | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Antwoordstreaming per voltooid blok                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | Typreacties verzenden                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Weergavenamen van afzenders bepalen                                                  | `true`                               |
| `channels.feishu.configWrites`                           | Door het kanaal geïnitieerde configuratieschrijfbewerkingen toestaan (nodig voor dynamische agents) | `true`                               |
| `channels.feishu.tools.doc`                              | Documenthulpmiddelen inschakelen                                                     | `true`                               |
| `channels.feishu.tools.chat`                             | Hulpmiddelen voor chatinformatie inschakelen                                         | `true`                               |
| `channels.feishu.tools.wiki`                             | Hulpmiddelen voor de kennisbank inschakelen (vereist `doc`)                         | `true`                               |
| `channels.feishu.tools.drive`                            | Hulpmiddelen voor cloudopslag inschakelen                                            | `true`                               |
| `channels.feishu.tools.perm`                             | Hulpmiddelen voor rechtenbeheer inschakelen                                          | `false`                              |
| `channels.feishu.tools.scopes`                           | Diagnostisch hulpmiddel voor app-scopes inschakelen                                  | `true`                               |
| `channels.feishu.tools.bitable`                          | Hulpmiddelen voor Bitable/Base inschakelen                                           | `true`                               |
| `channels.feishu.tools.base`                             | Alias voor `channels.feishu.tools.bitable`; expliciete `bitable` heeft voorrang als beide zijn ingesteld | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Schakelaar per account voor Bitable/Base-hulpmiddelen                                | overgenomen                          |
| `channels.feishu.accounts.<id>.tools.base`               | Alias per account voor `tools.bitable`                                               | overgenomen                          |

## Ondersteunde berichttypen

### Ontvangen

- ✅ Tekst
- ✅ Rijke tekst (bericht)
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Stickers

Inkomende audioberichten van Feishu/Lark worden genormaliseerd als mediaplaatsaanduidingen in plaats
van onbewerkte `file_key`-JSON. Wanneer `tools.media.audio` is geconfigureerd, downloadt OpenClaw
de spraaknotitiebron en voert het vóór de agentbeurt de gedeelde audiotranscriptie uit,
zodat de agent het gesproken transcript ontvangt. Als Feishu transcripttekst
rechtstreeks in de audiopayload opneemt, wordt die tekst zonder nog een
ASR-aanroep gebruikt. Zonder aanbieder voor audiotranscriptie ontvangt de agent nog steeds een
`<media:audio>`-plaatsaanduiding plus de opgeslagen bijlage, en niet de onbewerkte
bronpayload van Feishu.

### Verzenden

- ✅ Tekst
- ✅ Afbeeldingen
- ✅ Bestanden
- ✅ Audio
- ✅ Video/media
- ✅ Interactieve kaarten (inclusief streamingupdates)
- ⚠️ Rijke tekst (opmaak in berichtstijl; ondersteunt niet alle auteursmogelijkheden van Feishu/Lark)

Native audioballonnen van Feishu/Lark gebruiken het Feishu-berichttype `audio` en vereisen
geüploade Ogg/Opus-media (`file_type: "opus"`). Bestaande `.opus`- en `.ogg`-media
worden rechtstreeks als native audio verzonden. MP3/WAV/M4A en andere waarschijnlijke audioformaten worden
alleen met `ffmpeg` getranscodeerd naar 48kHz Ogg/Opus wanneer het antwoord om spraaklevering
vraagt (`audioAsVoice` / berichttool `asVoice`, inclusief TTS-antwoorden
als spraaknotitie). Gewone MP3-bijlagen blijven reguliere bestanden. Als `ffmpeg` ontbreekt of
de conversie mislukt, valt OpenClaw terug op een bestandsbijlage en registreert het de reden.

### Threads en antwoorden

- ✅ Inline-antwoorden
- ✅ Threadantwoorden
- ✅ Media-antwoorden blijven threadbewust bij antwoorden op een threadbericht

Routering van onderwerp-groepssessies wordt behandeld onder
[Groepssessiebereik en onderwerpthreads](#group-session-scope-and-topic-threads).

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en toegangscontrole via vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiliging aanscherpen
