---
read_when:
    - Codeharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een gesprek via een berichtenkanaal koppelen aan een persistente ACP-sessie
    - Problemen met de ACP-backend, Plugin-bedrading of levering van voltooiingen oplossen
    - /acp-opdrachten uitvoeren vanuit chat
sidebarTitle: ACP agents
summary: Voer externe codeharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agenten
x-i18n:
    generated_at: "2026-06-27T18:23:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe coding-harnassen uitvoeren (bijvoorbeeld Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnassen) via een ACP-backendplugin.

Elke ACP-sessie die wordt gestart, wordt bijgehouden als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnassen, niet het standaard Codex-pad.** De
native Codex app-serverplugin beheert `/codex ...`-bediening en de standaard
ingebedde `openai/gpt-*`-runtime voor agentbeurten; ACP beheert
`/acp ...`-bediening en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code als externe MCP-client rechtstreeks
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina heb ik nodig?

| Je wilt…                                                                                         | Gebruik dit                           | Opmerkingen                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in het huidige gesprek koppelen of bedienen                                                | `/codex bind`, `/codex threads`       | Native Codex app-serverpad wanneer de `codex`-plugin is ingeschakeld; omvat gekoppelde chatantwoorden, doorsturen van afbeeldingen, model/fast/rechten, stoppen en stuurbediening. ACP is een expliciete fallback |
| Claude Code, Gemini CLI, expliciete Codex ACP of een ander extern harnas _via_ OpenClaw uitvoeren | Deze pagina                           | Chatgebonden sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebediening                                                                                  |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar maken voor een editor of client          | [`openclaw acp`](/nl/cli/acp)            | Brugmodus. IDE/client praat ACP met OpenClaw via stdio/WebSocket                                                                                                                              |
| Een lokale AI-CLI hergebruiken als tekst-only fallbackmodel                                      | [CLI-backends](/nl/gateway/cli-backends) | Geen ACP. Geen OpenClaw-tools, geen ACP-bediening, geen harnasruntime                                                                                                                         |

## Werkt dit direct?

Ja, na installatie van de officiële ACP-runtimeplugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-checkouts kunnen de lokale `extensions/acpx` workspaceplugin gebruiken na
`pnpm install`. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agents alleen over ACP-spawning wanneer ACP **echt
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld zijn, de huidige
sessie mag niet door de sandbox geblokkeerd zijn en er moet een runtimebackend
geladen zijn. Als niet aan die voorwaarden is voldaan, blijven ACP-pluginvaardigheden en
`sessions_spawn` ACP-richtlijnen verborgen zodat de agent geen
niet-beschikbare backend suggereert.

<AccordionGroup>
  <Accordion title="Valkuilen bij eerste gebruik">
    - Als `plugins.allow` is ingesteld, is dit een beperkende plugininventaris en **moet** deze `acpx` bevatten; anders wordt de geïnstalleerde ACP-backend opzettelijk geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De Codex ACP-adapter wordt met de `acpx`-plugin klaargezet en waar mogelijk lokaal gestart.
    - Codex ACP draait met een geïsoleerde `CODEX_HOME`; OpenClaw kopieert vertrouwde projectvermeldingen plus veilige model/provider-routeringsconfiguratie uit de host-Codex-configuratie, terwijl auth, meldingen en hooks in de hostconfiguratie blijven.
    - Andere doelharnasadapters kunnen nog steeds op aanvraag met `npx` worden opgehaald wanneer je ze voor het eerst gebruikt.
    - Vendor-auth moet nog steeds op de host bestaan voor dat harnas.
    - Als de host geen npm- of netwerktoegang heeft, mislukken adapterfetches bij eerste gebruik totdat caches vooraf zijn opgewarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harnasproces. OpenClaw beheert routering,
    achtergrondtaakstatus, levering, bindingen en beleid; het harnas
    beheert zijn providerlogin, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer voordat je OpenClaw de schuld geeft:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - De harnasopdracht kan starten op de Gateway-host.
    - Provider-auth is aanwezig voor dat harnas (`claude`, `codex`, `gemini`, `opencode`, `droid`, enz.).
    - Het geselecteerde model bestaat voor dat harnas - model-id's zijn niet overdraagbaar tussen harnassen.
    - De gevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend zijn standaard gebruiken.
    - De rechtenmodus past bij het werk. Niet-interactieve sessies kunnen niet op native rechtenprompts klikken, dus coding-runs met veel schrijven/uitvoeren hebben meestal een ACPX-rechtenprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-plugintools en ingebouwde OpenClaw-tools worden standaard **niet**
blootgesteld aan ACP-harnassen. Schakel de expliciete MCP-bruggen in
[ACP-agents - instellen](/nl/tools/acp-agents-setup) alleen in wanneer het harnas
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnasdoelen

Gebruik met de `acpx`-backend deze harnas-id's als `/acp spawn <id>`
of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`-doelen:

| Harnas-id  | Typische backend                               | Opmerkingen                                                                         |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                        | Vereist Claude Code-auth op de host.                                                |
| `codex`    | Codex ACP-adapter                              | Alleen expliciete ACP-fallback wanneer native `/codex` niet beschikbaar is of ACP is aangevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                     | Vereist Copilot CLI/runtime-auth.                                                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Overschrijf de acpx-opdracht als een lokale installatie een ander ACP-entrypoint blootstelt. |
| `droid`    | Factory Droid CLI                              | Vereist Factory/Droid-auth of `FACTORY_API_KEY` in de harnaseomgeving.              |
| `gemini`   | Gemini CLI ACP-adapter                         | Vereist Gemini CLI-auth of API-keyconfiguratie.                                     |
| `iflow`    | iFlow CLI                                      | Adapterbeschikbaarheid en modelbediening zijn afhankelijk van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                  | Adapterbeschikbaarheid en modelbediening zijn afhankelijk van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                              | Vereist Kimi/Moonshot-auth op de host.                                              |
| `kiro`     | Kiro CLI                                       | Adapterbeschikbaarheid en modelbediening zijn afhankelijk van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                           | Vereist OpenCode CLI/provider-auth.                                                 |
| `openclaw` | OpenClaw Gateway-brug via `openclaw acp`       | Laat een ACP-bewust harnas terugpraten naar een OpenClaw Gateway-sessie.            |
| `qwen`     | Qwen Code / Qwen CLI                           | Vereist Qwen-compatibele auth op de host.                                           |

Aangepaste acpx-agentaliases kunnen in acpx zelf worden geconfigureerd, maar OpenClaw
beleid controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mapping voordat dispatch plaatsvindt.

## Operator-runbook

Snelle `/acp`-flow vanuit chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, of expliciet
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Werken">
    Ga door in het gekoppelde gesprek of de gekoppelde thread (of richt je
    expliciet op de sessiesleutel).
  </Step>
  <Step title="Status controleren">
    `/acp status`
  </Step>
  <Step title="Afstellen">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Sturen">
    Zonder context te vervangen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (huidige beurt) of `/acp close` (sessie + bindingen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle-details">
    - Starten maakt of hervat een ACP-runtimesessie, registreert ACP-metadata in de OpenClaw-sessieopslag en kan een achtergrondtaak maken wanneer de run door de parent wordt beheerd.
    - Door de parent beheerde ACP-sessies worden behandeld als achtergrondwerk, zelfs wanneer de runtimesessie persistent is; voltooiing en levering over oppervlakken heen lopen via de parent-taaknotifier in plaats van zich te gedragen als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde door de parent beheerde eenmalige ACP-sessies. Persistente ACP-sessies blijven behouden zolang er een actieve gespreksbinding bestaat; verouderde persistente sessies zonder actieve binding worden gesloten zodat ze niet stilzwijgend kunnen worden hervat nadat de eigenaarstaak klaar is of het taakrecord verdwenen is.
    - Gekoppelde vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de binding wordt gesloten, ontfocust, gereset of verlopen is.
    - Gateway-opdrachten blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppeld ACP-harnas verzonden.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de binding of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit het perspectief van OpenClaw en verwijdert de binding. Een harnas kan nog steeds zijn eigen upstreamgeschiedenis bewaren als het hervatten ondersteunt.
    - De acpx-plugin ruimt OpenClaw-beheerde wrapper- en adapterprocesbomen op na `close`, en ruimt verouderde OpenClaw-beheerde ACPX-weesprocessen op tijdens Gateway-start.
    - Inactieve runtimeworkers komen in aanmerking voor opschoning na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijft beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die naar de **native Codex
    plugin** moeten routeren wanneer deze is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel daarna deze."

    Native Codex-gespreksbinding is het standaardpad voor chatbesturing.
    Dynamische OpenClaw-tools worden nog steeds via OpenClaw uitgevoerd, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native toolgebeurtenissen injecteert OpenClaw een native
    hookrelay per beurt, zodat Plugin-hooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex `PermissionRequest`-gebeurtenissen
    via OpenClaw-goedkeuringen kunnen routeren. Codex `Stop`-hooks worden doorgestuurd naar
    OpenClaw `before_agent_finalize`, waar plugins nog een
    modelpass kunnen aanvragen voordat Codex zijn antwoord afrondt. De relay blijft
    bewust conservatief: hij muteert geen Codex-native toolargumenten
    en herschrijft geen Codex-threadrecords. Gebruik expliciete ACP alleen
    wanneer u het ACP-runtime-/sessiemodel wilt. De ingebedde Codex-
    ondersteuningsgrens is gedocumenteerd in het
    [Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Beknopt overzicht voor model- / provider- / runtimeselectie">
    - legacy Codex-modelrefs - legacy Codex OAuth-/abonnementsmodelroute gerepareerd door doctor.
    - `openai/*` - native Codex app-server ingebedde runtime voor OpenAI-agentbeurten.
    - `/codex ...` - native Codex-gespreksbesturing.
    - `/acp ...` of `runtime: "acp"` - expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="ACP-routeringstriggers in natuurlijke taal">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en houd vervolgberichten daarna in diezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, lost de harness `agentId` op,
    bindt aan het huidige gesprek of de huidige thread wanneer dat wordt ondersteund, en
    routeert vervolgberichten naar die sessie totdat deze wordt gesloten of verloopt. Codex
    volgt dit pad alleen wanneer ACP/acpx expliciet is of de native Codex-
    plugin niet beschikbaar is voor de aangevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen aangekondigd wanneer ACP
    is ingeschakeld, de aanvrager niet gesandboxed is en een ACP-runtime-
    backend is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratie-agent-id uit `agents_list` door, tenzij die vermelding
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaard sub-agentruntime. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als het onderliggende harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agents

Gebruik ACP wanneer u een externe harnessruntime wilt. Gebruik **native Codex
app-server** voor Codex-gespreksbinding/-besturing wanneer de `codex`-
plugin is ingeschakeld. Gebruik **sub-agents** wanneer u OpenClaw-native
gedelegeerde runs wilt.

| Gebied        | ACP-sessie                           | Sub-agentrun                      |
| ------------- | ------------------------------------ | --------------------------------- |
| Runtime       | ACP-backendplugin (bijvoorbeeld acpx) | OpenClaw native sub-agentruntime |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`         | `agent:<agentId>:subagent:<uuid>` |
| Hoofdcommando's | `/acp ...`                         | `/subagents ...`                  |
| Spawntool     | `sessions_spawn` met `runtime:"acp"` | `sessions_spawn` (standaardruntime) |

Zie ook [Sub-agents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiecontrolelaag.
2. Officiële `@openclaw/acpx`-runtimeplugin.
3. Claude ACP-adapter.
4. Claude-side runtime-/sessiemechanisme.

ACP Claude is een **harnesssessie** met ACP-besturing, sessiehervatting,
tracking van achtergrondtaken en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallbackruntimes - zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wilt u `/acp spawn`, bindbare sessies, runtimebesturing of persistent harnesswerk?** Gebruik ACP.
- **Wilt u eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** - waar mensen blijven praten (Discord-kanaal, Telegram-onderwerp, iMessage-chat).
- **ACP-sessie** - de duurzame Codex/Claude/Gemini-runtimestatus waar OpenClaw naartoe routeert.
- **Child thread/topic** - een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt aangemaakt.
- **Runtimewerkruimte** - de bestandssysteemlocatie (`cwd`, repo-checkout, backendwerkruimte) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Bindingen aan huidig gesprek

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie - geen child thread, hetzelfde chatoppervlak. OpenClaw blijft
transport, auth, veiligheid en aflevering beheren. Vervolgberichten in dat
gesprek worden naar dezelfde sessie gerouteerd; `/new` en `/reset` resetten de
sessie ter plekke; `/acp close` verwijdert de binding.

Voorbeelden:

```text
/codex bind                                              # native Codex-binding, routeer toekomstige berichten hierheen
/codex model gpt-5.4                                     # stem de gebonden native Codex-thread af
/codex stop                                              # bestuur de actieve native Codex-beurt
/acp spawn codex --bind here                             # expliciete ACP-fallback voor Codex
/acp spawn codex --thread auto                           # kan een child thread/topic aanmaken en daar binden
/acp spawn codex --bind here --cwd /workspace/repo       # dezelfde chatbinding, Codex draait in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindingsregels en exclusiviteit">
    - `--bind here` en `--thread ...` sluiten elkaar uit.
    - `--bind here` werkt alleen op kanalen die binding aan het huidige gesprek aankondigen; OpenClaw retourneert anders een duidelijk niet-ondersteund bericht. Bindingen blijven bestaan na gateway-herstarts.
    - Op Discord beheert `spawnSessions` het aanmaken van child threads voor `--thread auto|here` - niet `--bind here`.
    - Als u naar een andere ACP-agent spawnt zonder `--cwd`, erft OpenClaw standaard de werkruimte van de **doelagent**. Ontbrekende geerfde paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawnfouten.
    - Gateway-beheercommando's blijven lokaal in gebonden gesprekken - `/acp ...`-commando's worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie wordt gerouteerd; `/status` en `/unfocus` blijven ook lokaal wanneer commandoafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Threadgebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread worden naar de gebonden ACP-sessie gerouteerd.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Unfocus/close/archive/idle-timeout of max-age-verloop verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-commando's, geen prompts aan de ACP-harness.

    Vereiste featureflags voor threadgebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (zet op `false` om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - Spawns van threadsessies via kanaaladapter ingeschakeld (standaard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Ondersteuning voor threadbindingen is adapterspecifiek. Als de actieve kanaal-
    adapter threadbindingen niet ondersteunt, retourneert OpenClaw een duidelijk
    bericht dat dit niet wordt ondersteund of niet beschikbaar is.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingscapaciteit aanbiedt.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/-kanalen, **Telegram**-onderwerpen (forumonderwerpen in groepen/supergroepen en DM-onderwerpen).
    - Plugin-kanalen kunnen ondersteuning toevoegen via dezelfde bindingsinterface.

  </Accordion>
</AccordionGroup>

## Persistente kanaalbindingen

Voor niet-ephemere workflows configureert u persistente ACP-bindingen in
top-level `bindings[]`-vermeldingen.

### Bindingsmodel

<ParamField path="bindings[].type" type='"acp"'>
  Markeert een persistente ACP-gespreksbinding.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identificeert het doelgesprek. Vormen per kanaal:

- **Discord-kanaal/thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack-kanaal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Geef de voorkeur aan stabiele Slack-id's; kanaalbindingen matchen ook antwoorden binnen de threads van dat kanaal.
- **Telegram-forumonderwerp:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp-DM/groep:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Gebruik E.164-nummers zoals `+15555550123` voor directe chats en WhatsApp-groeps-JID's zoals `120363424282127706@g.us` voor groepen.
- **iMessage-DM/groep:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Geef de voorkeur aan `chat_id:*` voor stabiele groepsbindingen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  De id van de eigenaar-OpenClaw-agent.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionele ACP-override.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optioneel operatorgericht label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionele runtimewerkdirectory.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionele backendoverride.
</ParamField>

### Runtimestandaarden per agent

Gebruik `agents.list[].runtime` om ACP-standaarden eenmaal per agent te definiëren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness-id, bijv. `codex` of `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Overrideprioriteit voor ACP-gebonden sessies:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Globale ACP-standaarden (bijv. `acp.backend`)

### Voorbeeld

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
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Gedrag

- OpenClaw zorgt ervoor dat de geconfigureerde ACP-sessie bestaat na kanaalspecifieke toelating en vóór gebruik.
- Berichten in dat kanaal, onderwerp of chat worden gerouteerd naar de geconfigureerde ACP-sessie.
- Geconfigureerde ACP-bindingen zijn eigenaar van hun sessieroute. Fan-out van kanaaluitzendingen vervangt de geconfigureerde ACP-sessie niet voor een overeenkomende binding.
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel ter plekke.
- Tijdelijke runtime-bindingen (bijvoorbeeld gemaakt door thread-focus-flows) zijn nog steeds van toepassing waar ze aanwezig zijn.
- Voor ACP-spawns tussen agents zonder expliciete `cwd` erft OpenClaw de werkruimte van de doelagent uit de agentconfiguratie.
- Ontbrekende geërfde werkruimtepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsfouten worden weergegeven als spawnfouten.

## ACP-sessies starten

Twee manieren om een ACP-sessie te starten:

<Tabs>
  <Tab title="From sessions_spawn">
    Gebruik `runtime: "acp"` om een ACP-sessie te starten vanuit een agentbeurt of
    toolaanroep.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` is standaard `subagent`, dus stel `runtime: "acp"` expliciet in
    voor ACP-sessies. Als `agentId` wordt weggelaten, gebruikt OpenClaw
    `acp.defaultAgent` wanneer dit is geconfigureerd. `mode: "session"` vereist
    `thread: true` om een persistent gebonden gesprek te behouden.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Gebruik `/acp spawn` voor expliciete operatorcontrole vanuit chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Belangrijke flags:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Zie [Slash-commando's](/nl/tools/slash-commands).

  </Tab>
</Tabs>

### `sessions_spawn`-parameters

<ParamField path="task" type="string" required>
  Eerste prompt die naar de ACP-sessie wordt gestuurd.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Moet `"acp"` zijn voor ACP-sessies.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-doelharness-id. Valt terug op `acp.defaultAgent` als dat is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag de threadbindingsflow aan waar deze wordt ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is persistent. Als `thread: true` en
  `mode` wordt weggelaten, kan OpenClaw standaard persistent gedrag gebruiken per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde runtime-werkmap (gevalideerd door backend-/runtimebeleid).
  Als dit wordt weggelaten, erft de ACP-spawn de werkruimte van de doelagent
  wanneer die is geconfigureerd; ontbrekende geërfde paden vallen terug op
  backendstandaarden, terwijl echte toegangsfouten worden geretourneerd.
</ParamField>
<ParamField path="label" type="string">
  Operatorgericht label dat wordt gebruikt in sessie-/bannertekst.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Hervat een bestaande ACP-sessie in plaats van een nieuwe te maken. De
  agent speelt zijn gespreksgeschiedenis opnieuw af via `session/load`. Vereist
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt samenvattingen van de voortgang van de eerste ACP-run terug naar de
  aanvragersessie als systeemgebeurtenissen. Geaccepteerde antwoorden bevatten
  `streamLogPath` dat verwijst naar een sessiegebonden JSONL-log
  (`<sessionId>.acp-stream.jsonl`) die u kunt tailen voor de volledige relaygeschiedenis.
  Ouder-voortgangsstreams tonen standaard assistentcommentaar en ACP-statusvoortgang,
  tenzij `streaming.progress.commentary=false`. Discord zet ouderpreviews ook standaard
  in voortgangsmodus wanneer er geen streammodus is geconfigureerd. Statusvoortgang
  respecteert nog steeds `acp.stream.tagVisibility`, zodat tags zoals `plan`
  verborgen blijven tenzij ze expliciet zijn ingeschakeld.
</ParamField>

ACP-`sessions_spawn`-runs gebruiken `agents.defaults.subagents.runTimeoutSeconds` voor
hun standaardlimiet voor onderliggende beurten. De tool accepteert geen timeout-
overschrijvingen per aanroep.

<ParamField path="model" type="string">
  Expliciete modeloverschrijving voor de onderliggende ACP-sessie. Codex ACP-spawns
  normaliseren OpenAI-referenties zoals `openai/gpt-5.4` naar de Codex ACP-opstart-
  configuratie vóór `session/new`; slash-vormen zoals `openai/gpt-5.4/high`
  stellen ook de reasoning effort van Codex ACP in.
  Wanneer dit wordt weggelaten, gebruikt `sessions_spawn({ runtime: "acp" })` bestaande
  standaardmodellen voor subagents (`agents.defaults.subagents.model` of
  `agents.list[].subagents.model`) wanneer deze zijn geconfigureerd; anders laat het de
  ACP-harness zijn eigen standaardmodel gebruiken.
  Andere harnesses moeten ACP-`models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stilzwijgend terug te vallen op de standaard van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete thinking/reasoning effort. Voor Codex ACP wordt `minimal` gekoppeld aan
  lage effort, worden `low`/`medium`/`high`/`xhigh` direct gekoppeld, en laat `off`
  de opstartoverschrijving voor reasoning effort weg.
  Wanneer dit wordt weggelaten, gebruiken ACP-spawns bestaande thinking-standaarden voor
  subagents en per-model `agents.defaults.models["provider/model"].params.thinking`
  voor het geselecteerde model.
</ParamField>

## Bind- en threadmodi voor spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek ter plekke; faal als er geen actief gesprek is. |
    | `off`  | Maak geen binding voor het huidige gesprek.                            |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat Codex-ondersteund."
    - `--bind here` maakt geen onderliggende thread.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor binding van het huidige gesprek aanbieden.
    - `--bind` en `--thread` kunnen niet worden gecombineerd in dezelfde `/acp spawn`-aanroep.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                              |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een onderliggende thread wanneer ondersteund. |
    | `here` | Vereis huidige actieve thread; faal als u zich niet in een thread bevindt.                           |
    | `off`  | Geen binding. Sessie start ongebonden.                                                              |

    Opmerkingen:

    - Op oppervlakken zonder threadbinding is het standaardgedrag effectief `off`.
    - Threadgebonden spawn vereist ondersteuning door kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gebruik `--bind here` wanneer u het huidige gesprek wilt vastzetten zonder een onderliggende thread te maken.

  </Tab>
</Tabs>

## Afleveringsmodel

ACP-sessies kunnen interactieve werkruimten zijn of ouderbeheerd
achtergrondwerk. Het afleveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactieve sessies zijn bedoeld om te blijven praten op een zichtbaar chat-
    oppervlak:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-onderwerp aan de ACP-sessie.
    - Persistente geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden rechtstreeks naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan hetzelfde
    kanaal/dezelfde thread/hetzelfde onderwerp.

    Wat OpenClaw naar de harness stuurt:

    - Normale gebonden vervolgberichten worden verzonden als prompttekst, plus bijlagen alleen wanneer de harness/backend deze ondersteunt.
    - `/acp`-beheercommando's en lokale Gateway-commando's worden onderschept vóór ACP-dispatch.
    - Door de runtime gegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agents krijgen de interne runtime-contextenvelop van OpenClaw; externe ACP-harnesses krijgen een gewone prompt met het onderliggende resultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnesses worden verzonden of worden opgeslagen als ACP-gebruikerstranscripttekst.
    - ACP-transcriptvermeldingen gebruiken de voor de gebruiker zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Eenmalige ACP-sessies die door een andere agent-run worden gestart, zijn achtergrond-
    children, vergelijkbaar met subagents:

    - De ouder vraagt om werk met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harness-sessie.
    - Childbeurten draaien op dezelfde achtergrondlane die wordt gebruikt door native subagent-spawns, zodat een trage ACP-harness niet-gerelateerd hoofd-sessiewerk niet blokkeert.
    - Voltooiing rapporteert terug via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om in een gewone ACP-prompt voordat deze naar een externe harness wordt gestuurd, zodat harnesses geen runtime-contextmarkeringen zien die alleen voor OpenClaw zijn.
    - De ouder herschrijft het childresultaat in normale assistentstem wanneer een gebruikersgericht antwoord nuttig is.

    Behandel dit pad **niet** als een peer-to-peer-chat tussen ouder
    en child. De child heeft al een voltooiingskanaal terug naar de
    ouder.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kan na spawn een andere sessie als doel hebben. Voor normale
    peersessies gebruikt OpenClaw een agent-naar-agent (A2A)-vervolgpad
    na het injecteren van het bericht:

    - Wacht op het antwoord van de doelsessie.
    - Laat de aanvrager en het doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel om een aankondigingsbericht te produceren.
    - Lever die aankondiging af aan het zichtbare kanaal of de zichtbare thread.

    Dat A2A-pad is een fallback voor peer sends waarbij de afzender een
    zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een niet-gerelateerde sessie
    een ACP-doel kan zien en berichten kan sturen, bijvoorbeeld onder brede
    `tools.sessions.visibility`-instellingen.

    OpenClaw slaat de A2A-opvolging alleen over wanneer de aanvrager de
    ouder is van zijn eigen, door de ouder beheerde eenmalige ACP-kind. In dat geval
    kan A2A uitvoeren boven op taakvoltooiing de ouder wekken met het
    resultaat van het kind, het antwoord van de ouder terug doorsturen naar het kind, en
    een ouder/kind-echolus maken. Het resultaat van `sessions_send` rapporteert
    `delivery.status="skipped"` voor dat geval van beheerd kind, omdat het
    voltooiingspad al verantwoordelijk is voor het resultaat.

  </Accordion>
  <Accordion title="Een bestaande sessie hervatten">
    Gebruik `resumeSessionId` om een eerdere ACP-sessie voort te zetten in plaats van
    opnieuw te beginnen. De agent speelt zijn gespreksgeschiedenis opnieuw af via
    `session/load`, zodat hij verdergaat met de volledige context van wat eraan voorafging.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Veelvoorkomende gebruiksscenario's:

    - Draag een Codex-sessie over van je laptop naar je telefoon - vertel je agent dat hij verder moet gaan waar je was gebleven.
    - Zet een codeersessie voort die je interactief in de CLI bent gestart, nu headless via je agent.
    - Pak werk weer op dat werd onderbroken door een herstart van de Gateway of een inactiviteitstime-out.

    Opmerkingen:

    - `resumeSessionId` geldt alleen wanneer `runtime: "acp"`; de standaardruntime voor subagenten negeert dit veld dat alleen voor ACP is.
    - `streamTo` geldt alleen wanneer `runtime: "acp"`; de standaardruntime voor subagenten negeert dit veld dat alleen voor ACP is.
    - `resumeSessionId` is een host-lokale ACP/harness-hervattings-id, geen OpenClaw-sessiesleutel voor kanalen; OpenClaw controleert nog steeds het ACP-spawnbeleid en het beleid voor de doelagent voordat er wordt verzonden, terwijl de ACP-backend of harness eigenaar is van de autorisatie voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` blijven normaal van toepassing op de nieuwe OpenClaw-sessie die je aanmaakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, mislukt de spawn met een duidelijke fout - zonder stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Smoke-test na deploy">
    Voer na een Gateway-deploy een live end-to-end-controle uit in plaats van
    te vertrouwen op unittests:

    1. Verifieer de gedeployde Gateway-versie en commit op de doelhost.
    2. Open een tijdelijke ACPX-bridgesessie naar een live agent.
    3. Vraag die agent `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifieer `accepted=yes`, een echte `childSessionKey`, en geen validatorfout.
    5. Ruim de tijdelijke bridgesessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over -
    thread-gebonden `mode: "session"` en stream-relaypaden zijn aparte,
    rijkere integratiepasses.

  </Accordion>
</AccordionGroup>

## Sandbox-compatibiliteit

ACP-sessies draaien momenteel op de hostruntime, **niet** binnen de
OpenClaw-sandbox.

<Warning>
**Beveiligingsgrens:**

- De externe harness kan lezen/schrijven volgens zijn eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw omvat de uitvoering van de ACP-harness **niet**.
- OpenClaw handhaaft nog steeds ACP-featuregates, toegestane agents, sessie-eigendom, kanaalbindingen en Gateway-afleveringsbeleid.
- Gebruik `runtime: "subagent"` voor OpenClaw-native werk met sandboxhandhaving.

</Warning>

Huidige beperkingen:

- Als de aanvragersessie in een sandbox draait, worden ACP-spawns geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt `sandbox: "require"` niet.

## Sessie-doelresolutie

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Resolutievolgorde:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert sleutel
   - vervolgens sessie-id in UUID-vorm
   - vervolgens label
2. Huidige threadbinding (als dit gesprek/deze thread aan een ACP-sessie is gebonden).
3. Fallback naar de huidige aanvragersessie.

Bindingen voor het huidige gesprek en threadbindingen nemen beide deel aan
stap 2.

Als geen doel wordt gevonden, retourneert OpenClaw een duidelijke fout
(`Unable to resolve session target: ...`).

## ACP-besturing

| Opdracht              | Wat deze doet                                                  | Voorbeeld                                                      |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maak ACP-sessie aan; optionele huidige binding of threadbinding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleer lopende beurt voor doelsessie.                         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuur stuurinstructie naar actieve sessie.                       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit sessie en ontbind threaddoelen.                            | `/acp close`                                                  |
| `/acp status`        | Toon backend, modus, status, runtime-opties, mogelijkheden.      | `/acp status`                                                 |
| `/acp set-mode`      | Stel runtimemodus in voor doelsessie.                            | `/acp set-mode plan`                                          |
| `/acp set`           | Schrijf generieke runtimeconfiguratieoptie.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stel override voor runtimewerkmap in.                            | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stel profiel voor goedkeuringsbeleid in.                         | `/acp permissions strict`                                     |
| `/acp timeout`       | Stel runtime-time-out in (seconden).                             | `/acp timeout 120`                                            |
| `/acp model`         | Stel override voor runtimemodel in.                              | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijder overrides van sessieruntimeopties.                     | `/acp reset-options`                                          |
| `/acp sessions`      | Toon recente ACP-sessies uit de store.                           | `/acp sessions`                                               |
| `/acp doctor`        | Backendstatus, mogelijkheden, uitvoerbare oplossingen.           | `/acp doctor`                                                 |
| `/acp install`       | Druk deterministische installatie- en inschakelstappen af.       | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus runtime- en
backend-sessie-identificaties. Fouten voor niet-ondersteunde besturing
worden duidelijk weergegeven wanneer een backend een mogelijkheid mist.
`/acp sessions` leest de store voor de huidige gebonden sessie of
aanvragersessie; doeltokens (`session-key`, `session-id` of
`session-label`) worden opgelost via sessieontdekking van de Gateway,
inclusief aangepaste per-agent `session.store`-roots.

### Mapping van runtime-opties

`/acp` heeft gemaksopdrachten en een generieke setter. Gelijkwaardige
bewerkingen:

| Opdracht                      | Wordt toegewezen aan                 | Opmerkingen                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtimeconfiguratiesleutel `model`   | Voor Codex ACP normaliseert OpenClaw `openai/<model>` naar de model-id van de adapter en wijst slash-suffixen voor redenering, zoals `openai/gpt-5.4/high`, toe aan `reasoning_effort`.                    |
| `/acp set thinking <level>`  | canonieke optie `thinking`           | OpenClaw verzendt het door de backend geadverteerde equivalent wanneer aanwezig, met voorkeur voor `thinking`, daarna `effort`, `reasoning_effort` of `thought_level`. Voor Codex ACP wijst de adapter waarden toe aan `reasoning_effort`. |
| `/acp permissions <profile>` | canonieke optie `permissionProfile`  | OpenClaw verzendt het door de backend geadverteerde equivalent wanneer aanwezig, zoals `approval_policy`, `permission_profile`, `permissions` of `permission_mode`.                                         |
| `/acp timeout <seconds>`     | canonieke optie `timeoutSeconds`     | OpenClaw verzendt het door de backend geadverteerde equivalent wanneer aanwezig, zoals `timeout` of `timeout_seconds`.                                                                                       |
| `/acp cwd <path>`            | runtime-cwd-override                 | Directe update.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generiek                             | `key=cwd` gebruikt het cwd-overridepad.                                                                                                                                                                     |
| `/acp reset-options`         | wist alle runtime-overrides          | -                                                                                                                                                                                                          |

## acpx-harness, Plugin-installatie en machtigingen

Zie voor acpx-harnessconfiguratie (Claude Code / Codex / Gemini CLI
aliassen), de plugin-tools- en OpenClaw-tools-MCP-bridges, en
ACP-machtigingsmodi
[ACP-agents - installatie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                    | Waarschijnlijke oorzaak                                                                                                | Oplossing                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld of wordt geblokkeerd door `plugins.allow`.                                  | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die allowlist is ingesteld, en voer daarna `/acp doctor` uit.                       |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                          | Stel `acp.enabled=true` in.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                 | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete aanroepen van `sessions_spawn({ runtime: "acp" })` blijven werken.          |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de allowlist.                                                                                      | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                        |
| `/acp doctor` meldt dat de backend direct na het opstarten niet klaar is    | Backend-Plugin ontbreekt, is uitgeschakeld, wordt geblokkeerd door allow/deny-beleid, of het geconfigureerde uitvoerbare bestand is niet beschikbaar. | Installeer/schakel de backend-Plugin in, voer `/acp doctor` opnieuw uit en inspecteer de backendinstallatie- of beleidsfout als deze ongezond blijft.                    |
| Harnessopdracht niet gevonden                                               | Adapter-CLI is niet geinstalleerd, de externe Plugin ontbreekt, of de eerste `npx`-fetch is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, installeer/warm de adapter voor op de Gateway-host, of configureer de acpx-agentopdracht expliciet.                                               |
| Model-niet-gevonden vanuit de harness                                       | Model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                      | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness, of laat de override weg.                                                       |
| Vendor-authenticatiefout vanuit de harness                                  | OpenClaw is gezond, maar de doel-CLI/provider is niet ingelogd.                                                        | Log in of geef de vereiste providersleutel op in de Gateway-hostomgeving.                                                                                                |
| `Unable to resolve session target: ...`                                     | Ongeldig sleutel/id/label-token.                                                                                       | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label en probeer het opnieuw.                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder actieve bindbare conversatie.                                                            | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of gebruik ongebonden spawn.                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist de ACP-bindingsmogelijkheid voor huidige conversaties.                                                    | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer `bindings[]` op topniveau, of ga naar een ondersteund kanaal.                                         |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                     | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve bindingsdoel.                                                         | Bind opnieuw als eigenaar of gebruik een andere conversatie of thread.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist de mogelijkheid voor threadbinding.                                                                       | Gebruik `--thread off` of ga naar een ondersteunde adapter/kanaal.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-runtime draait aan de hostzijde; de aanvragende sessie is gesandboxed.                                             | Gebruik `runtime="subagent"` vanuit gesandboxte sessies, of voer ACP-spawn uit vanuit een niet-gesandboxte sessie.                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP-runtime.                                                                      | Gebruik `runtime="subagent"` voor verplichte sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxte sessie.                                      |
| `Cannot apply --model ... did not advertise model support`                  | De doel-harness stelt geen generieke ACP-modelwisseling beschikbaar.                                                   | Gebruik een harness die ACP `models`/`session/set_model` adverteert, gebruik Codex ACP-modelrefs, of configureer het model direct in de harness als die een eigen opstartvlag heeft. |
| Ontbrekende ACP-metadata voor gebonden sessie                               | Verouderde/verwijderde ACP-sessiemetadata.                                                                             | Maak opnieuw aan met `/acp spawn` en bind/focus daarna de thread opnieuw.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijfacties/exec in een niet-interactieve ACP-sessie.                                     | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de gateway. Zie [Machtigingsconfiguratie](/nl/tools/acp-agents-setup#permission-configuration). |
| ACP-sessie mislukt vroeg met weinig uitvoer                                 | Machtigingsprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                              | Controleer gatewaylogs op `AcpRuntimeError`. Stel voor volledige machtigingen `permissionMode=approve-all` in; stel voor nette degradatie `nonInteractivePermissions=deny` in. |
| ACP-sessie blijft onbeperkt hangen na voltooid werk                         | Harnessproces is voltooid, maar ACP-sessie heeft geen voltooiing gemeld.                                               | Werk OpenClaw bij; de huidige acpx-opruiming ruimt verouderde wrapper- en adapterprocessen die eigendom zijn van OpenClaw op bij sluiten en bij het opstarten van de Gateway. |
| Harness ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne gebeurtenisenvelop is over de ACP-grens gelekt.                                                                | Werk OpenClaw bij en voer de voltooiingsflow opnieuw uit; externe harnesses zouden alleen gewone voltooiingsprompts moeten ontvangen.                                    |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` hoort bij
de native Codex-hookrelay, niet bij ACP/acpx. Start in een gebonden Codex-chat een nieuwe
sessie met `/new` of `/reset`; als het eenmaal werkt en daarna terugkomt bij de volgende
native toolaanroep, herstart dan de Codex-app-server of OpenClaw Gateway in plaats van
`/new` te herhalen. Zie [Problemen met de Codex-harness oplossen](/nl/plugins/codex-harness#troubleshooting).
</Note>

## Gerelateerd

- [ACP-agenten - installatie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Sandboxtools voor meerdere agenten](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (brugmodus)](/nl/cli/acp)
- [Subagenten](/nl/tools/subagents)
