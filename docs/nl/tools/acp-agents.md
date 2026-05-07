---
read_when:
    - Codeharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een berichtkanaalgesprek koppelen aan een persistente ACP-sessie
    - Problemen oplossen met ACP-backend, plugin-koppeling of completionlevering
    - /acp-opdrachten bedienen vanuit de chat
sidebarTitle: ACP agents
summary: Voer externe codeharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agenten
x-i18n:
    generated_at: "2026-05-07T13:27:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe coding-harnassen uitvoeren (bijvoorbeeld Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnassen) via een ACP-backendplugin.

Elke gestarte ACP-sessie wordt gevolgd als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnassen, niet het standaardpad voor Codex.** De
native Codex-appserverplugin beheert `/codex ...`-besturingen en de
ingebedde runtime `agentRuntime.id: "codex"`; ACP beheert
`/acp ...`-besturingen en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code als externe MCP-client rechtstreeks
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina heb ik nodig?

| Je wilt…                                                                                       | Gebruik dit                           | Opmerkingen                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in het huidige gesprek koppelen of besturen                                               | `/codex bind`, `/codex threads`       | Native Codex-appserverpad wanneer de `codex`-plugin is ingeschakeld; bevat gekoppelde chatantwoorden, doorsturen van afbeeldingen, model/fast/machtigingen, stop- en stuurbediening. ACP is een expliciete fallback |
| Claude Code, Gemini CLI, expliciete Codex ACP of een ander extern harnas _via_ OpenClaw uitvoeren | Deze pagina                           | Chat-gebonden sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebesturing                                                                                  |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar maken voor een editor of client         | [`openclaw acp`](/nl/cli/acp)            | Brugmodus. IDE/client praat ACP met OpenClaw via stdio/WebSocket                                                                                                                               |
| Een lokale AI-CLI hergebruiken als tekst-only fallbackmodel                                      | [CLI-backends](/nl/gateway/cli-backends) | Geen ACP. Geen OpenClaw-tools, geen ACP-besturingen, geen harnasruntime                                                                                                                        |

## Werkt dit direct uit de doos?

Ja, na installatie van de officiële ACP-runtimeplugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Broncheckouts kunnen de lokale workspaceplugin `extensions/acpx` gebruiken na
`pnpm install`. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agents alleen over ACP-starts wanneer ACP **echt
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld
zijn, de huidige sessie mag niet door de sandbox worden geblokkeerd en er moet
een runtimebackend zijn geladen. Als niet aan die voorwaarden is voldaan, blijven
ACP-plugin-Skills en ACP-richtlijnen voor `sessions_spawn` verborgen, zodat de agent geen
niet-beschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Valkuilen bij eerste gebruik">
    - Als `plugins.allow` is ingesteld, is dit een beperkende plugininventaris en **moet** die `acpx` bevatten; anders wordt de geïnstalleerde ACP-backend opzettelijk geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De Codex ACP-adapter wordt met de `acpx`-plugin klaargezet en waar mogelijk lokaal gestart.
    - Codex ACP draait met een geïsoleerde `CODEX_HOME`; OpenClaw kopieert alleen vertrouwde projectvermeldingen uit de host-Codex-configuratie en vertrouwt de actieve workspace, terwijl auth, meldingen en hooks in de hostconfiguratie blijven.
    - Andere doelharnasadapters kunnen nog steeds op aanvraag met `npx` worden opgehaald wanneer je ze voor het eerst gebruikt.
    - Vendor-auth moet nog steeds op de host bestaan voor dat harnas.
    - Als de host geen npm- of netwerktoegang heeft, mislukken adapterophalingen bij eerste gebruik totdat caches zijn voorverwarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harnasproces. OpenClaw beheert routing,
    achtergrondtaakstatus, aflevering, koppelingen en beleid; het harnas
    beheert zijn providerlogin, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer voordat je OpenClaw de schuld geeft:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - Het harnascommando kan starten op de Gateway-host.
    - Providerauth is aanwezig voor dat harnas (`claude`, `codex`, `gemini`, `opencode`, `droid`, enzovoort).
    - Het geselecteerde model bestaat voor dat harnas - model-id's zijn niet overdraagbaar tussen harnassen.
    - De gevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend zijn standaard gebruiken.
    - De machtigingsmodus past bij het werk. Niet-interactieve sessies kunnen niet op native machtigingsprompts klikken, dus codingruns met veel schrijf-/uitvoerwerk hebben meestal een ACPX-machtigingsprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-plugintools en ingebouwde OpenClaw-tools worden standaard **niet**
beschikbaar gemaakt aan ACP-harnassen. Schakel de expliciete MCP-bruggen in
[ACP-agents - instellen](/nl/tools/acp-agents-setup) alleen in wanneer het harnas
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnasdoelen

Gebruik met de `acpx`-backend deze harnas-id's als doelen voor `/acp spawn <id>`
of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harnas-id  | Typische backend                              | Opmerkingen                                                                        |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                        | Vereist Claude Code-auth op de host.                                               |
| `codex`    | Codex ACP-adapter                              | Alleen expliciete ACP-fallback wanneer native `/codex` niet beschikbaar is of ACP is gevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                     | Vereist Copilot CLI/runtime-auth.                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Overschrijf het acpx-commando als een lokale installatie een ander ACP-entrypoint biedt. |
| `droid`    | Factory Droid CLI                              | Vereist Factory/Droid-auth of `FACTORY_API_KEY` in de harnassomgeving.             |
| `gemini`   | Gemini CLI ACP-adapter                         | Vereist Gemini CLI-auth of API-keyconfiguratie.                                    |
| `iflow`    | iFlow CLI                                      | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                  | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                              | Vereist Kimi/Moonshot-auth op de host.                                             |
| `kiro`     | Kiro CLI                                       | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                           | Vereist OpenCode CLI/provider-auth.                                                |
| `openclaw` | OpenClaw Gateway-brug via `openclaw acp`       | Laat een ACP-bewust harnas terugpraten naar een OpenClaw Gateway-sessie.           |
| `pi`       | Pi/ingebedde OpenClaw-runtime                  | Gebruikt voor OpenClaw-native harnasexperimenten.                                  |
| `qwen`     | Qwen Code / Qwen CLI                           | Vereist Qwen-compatibele auth op de host.                                          |

Aangepaste acpx-agentaliases kunnen in acpx zelf worden geconfigureerd, maar OpenClaw-
beleid controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mappings vóór dispatch.

## Operator-runbook

Snelle `/acp`-flow vanuit chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, of expliciet
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Werken">
    Ga door in het gekoppelde gesprek of de gekoppelde thread (of target de sessiesleutel
    expliciet).
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
    `/acp cancel` (huidige beurt) of `/acp close` (sessie + koppelingen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Levenscyclusdetails">
    - Starten maakt of hervat een ACP-runtimesessie, legt ACP-metadata vast in de OpenClaw-sessieopslag en kan een achtergrondtaak maken wanneer de run door de parent wordt beheerd.
    - Door de parent beheerde ACP-sessies worden behandeld als achtergrondwerk, ook wanneer de runtimesessie persistent is; voltooiing en aflevering over oppervlakken heen lopen via de parent-taakmelder in plaats van zich te gedragen als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde door de parent beheerde eenmalige ACP-sessies. Persistente ACP-sessies blijven behouden zolang er een actieve gesprekskoppeling bestaat; verouderde persistente sessies zonder actieve koppeling worden gesloten, zodat ze niet stilzwijgend kunnen worden hervat nadat de eigenaarstaak klaar is of het taakrecord is verdwenen.
    - Gekoppelde vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de koppeling wordt gesloten, uit focus wordt gehaald, gereset of verloopt.
    - Gateway-commando's blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppeld ACP-harnas gestuurd.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de koppeling of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit het oogpunt van OpenClaw en verwijdert de koppeling. Een harnas kan nog steeds zijn eigen upstreamgeschiedenis behouden als het hervatten ondersteunt.
    - De acpx-plugin ruimt door OpenClaw beheerde wrapper- en adapterprocesbomen op na `close`, en ruimt verouderde door OpenClaw beheerde ACPX-wezen op tijdens het starten van Gateway.
    - Inactieve runtimeworkers komen in aanmerking voor opschoning na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijven beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die naar de **native Codex-
    plugin** moeten routeren wanneer die is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel vervolgens deze."

    Native Codex-gespreksbinding is het standaardpad voor chatbesturing.
    Dynamische OpenClaw-tools worden nog steeds via OpenClaw uitgevoerd, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native toolgebeurtenissen injecteert OpenClaw per beurt een native
    hookrelay zodat pluginhooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex `PermissionRequest`-gebeurtenissen
    via OpenClaw-goedkeuringen kunnen routeren. Codex `Stop`-hooks worden
    doorgestuurd naar OpenClaw `before_agent_finalize`, waar plugins nog één
    modelpassage kunnen aanvragen voordat Codex zijn antwoord definitief maakt.
    De relay blijft bewust conservatief: hij muteert geen Codex-native
    toolargumenten en herschrijft geen Codex-threadrecords. Gebruik expliciete ACP
    alleen wanneer u het ACP-runtime-/sessiemodel wilt. De ondersteuningsgrens voor
    ingebedde Codex is gedocumenteerd in het
    [Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Spiekbrief voor model-/provider-/runtimeselectie">
    - `openai-codex/*` - oude Codex OAuth-/abonnementsmodelroute gerepareerd door doctor.
    - `openai/*` - native ingebedde Codex app-server-runtime voor OpenAI-agentbeurten.
    - `/codex ...` - native Codex-gespreksbesturing.
    - `/acp ...` of `runtime: "acp"` - expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="ACP-routeringstriggers in natuurlijke taal">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en houd vervolgberichten vervolgens in diezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, lost de harness `agentId` op,
    bindt waar ondersteund aan het huidige gesprek of de huidige thread en
    routeert vervolgberichten naar die sessie tot sluiting/verloop. Codex
    volgt dit pad alleen wanneer ACP/acpx expliciet is of de native Codex-
    plugin niet beschikbaar is voor de aangevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen aangekondigd wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox zit en een ACP-runtime-
    backend is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratieagent-id uit `agents_list` door, tenzij die vermelding
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaard sub-agent-runtime. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als de onderliggende harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agents

Gebruik ACP wanneer u een externe harness-runtime wilt. Gebruik **native Codex
app-server** voor Codex-gespreksbinding/-besturing wanneer de `codex`
plugin is ingeschakeld. Gebruik **sub-agents** wanneer u OpenClaw-native
gedelegeerde uitvoeringen wilt.

| Gebied        | ACP-sessie                           | Sub-agent-uitvoering              |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-backendplugin (bijvoorbeeld acpx) | OpenClaw native sub-agent-runtime  |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hoofdopdrachten | `/acp ...`                          | `/subagents ...`                   |
| Spawn-tool    | `sessions_spawn` met `runtime:"acp"` | `sessions_spawn` (standaardruntime) |

Zie ook [Sub-agents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiecontrolplane.
2. Officiële `@openclaw/acpx`-runtimeplugin.
3. Claude ACP-adapter.
4. Claude-side runtime-/sessiemechanisme.

ACP Claude is een **harnesssessie** met ACP-besturing, sessiehervatting,
achtergrondtaaktracking en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallbackruntimes - zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wilt u `/acp spawn`, bindbare sessies, runtimebesturing of persistent harnesswerk?** Gebruik ACP.
- **Wilt u eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** - waar mensen blijven praten (Discord-kanaal, Telegram-topic, iMessage-chat).
- **ACP-sessie** - de duurzame Codex-/Claude-/Gemini-runtimestatus waarnaar OpenClaw routeert.
- **Child thread/topic** - een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt aangemaakt.
- **Runtimewerkruimte** - de bestandssysteemlocatie (`cwd`, repo-checkout, backendwerkruimte) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Huidige-gespreksbindingen

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie - geen child thread, hetzelfde chatoppervlak. OpenClaw blijft
transport, auth, veiligheid en aflevering beheren. Vervolgberichten in dat
gesprek routeren naar dezelfde sessie; `/new` en `/reset` resetten de
sessie op dezelfde plek; `/acp close` verwijdert de binding.

Voorbeelden:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindingsregels en exclusiviteit">
    - `--bind here` en `--thread ...` sluiten elkaar uit.
    - `--bind here` werkt alleen op kanalen die huidige-gespreksbinding adverteren; OpenClaw retourneert anders een duidelijke niet-ondersteundmelding. Bindingen blijven behouden na gateway-herstarts.
    - Op Discord gate `spawnSessions` het aanmaken van child threads voor `--thread auto|here` - niet `--bind here`.
    - Als u naar een andere ACP-agent spawnt zonder `--cwd`, erft OpenClaw standaard de werkruimte van de **doelagent**. Ontbrekende geërfde paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawnfouten.
    - Gateway-beheeropdrachten blijven lokaal in gebonden gesprekken - `/acp ...`-opdrachten worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie routeert; `/status` en `/unfocus` blijven ook lokaal wanneer opdrachtverwerking voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Threadgebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread routeren naar de gebonden ACP-sessie.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Unfocus/sluiten/archiveren/inactiviteitstime-out of max-age-verloop verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-opdrachten, geen prompts voor de ACP-harness.

    Vereiste featureflags voor threadgebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (stel in op `false` om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - Kanaaladapter-threadsessiespawns ingeschakeld (standaard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Ondersteuning voor threadbinding is adapterspecifiek. Als de actieve
    kanaaladapter geen threadbindingen ondersteunt, retourneert OpenClaw een
    duidelijke niet-ondersteund-/niet-beschikbaarmelding.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingsfunctionaliteit blootstelt.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/-kanalen, **Telegram**-topics (forumtopics in groepen/supergroepen en DM-topics).
    - Pluginkanalen kunnen ondersteuning toevoegen via dezelfde bindingsinterface.

  </Accordion>
</AccordionGroup>

## Persistente kanaalbindingen

Configureer voor niet-ephemere workflows persistente ACP-bindingen in
top-level `bindings[]`-vermeldingen.

### Bindingsmodel

<ParamField path="bindings[].type" type='"acp"'>
  Markeert een persistente ACP-gespreksbinding.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Identificeert het doelgesprek. Vormen per kanaal:

- **Discord-kanaal/thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram-forumtopic:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles-DM/groep:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Geef de voorkeur aan `chat_id:*` of `chat_identifier:*` voor stabiele groepsbindingen.
- **iMessage-DM/groep:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Geef de voorkeur aan `chat_id:*` voor stabiele groepsbindingen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  De eigenaar-OpenClaw-agent-id.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionele ACP-override.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optioneel operatorgericht label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionele runtimewerkmap.
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

- OpenClaw zorgt ervoor dat de geconfigureerde ACP-sessie bestaat voordat deze wordt gebruikt.
- Berichten in dat kanaal of onderwerp worden naar de geconfigureerde ACP-sessie gerouteerd.
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel op zijn plaats.
- Tijdelijke runtimebindingen (bijvoorbeeld gemaakt door thread-focus-flows) blijven van toepassing waar ze aanwezig zijn.
- Voor cross-agent ACP-spawns zonder expliciete `cwd` erft OpenClaw de werkruimte van de doelagent uit de agentconfiguratie.
- Ontbrekende overgenomen werkruimtepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsfouten worden weergegeven als spawnfouten.

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
    `acp.defaultAgent` wanneer dat is geconfigureerd. `mode: "session"` vereist
    `thread: true` om een blijvend gebonden gesprek te behouden.
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

    Belangrijke vlaggen:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Zie [Slash-opdrachten](/nl/tools/slash-commands).

  </Tab>
</Tabs>

### `sessions_spawn`-parameters

<ParamField path="task" type="string" required>
  Initiële prompt die naar de ACP-sessie wordt gestuurd.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Moet `"acp"` zijn voor ACP-sessies.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-doelharness-id. Valt terug op `acp.defaultAgent` als dit is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag een threadbindingsflow aan waar dit wordt ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is blijvend. Als `thread: true` is en
  `mode` wordt weggelaten, kan OpenClaw standaard blijvend gedrag gebruiken per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde runtimewerkmap (gevalideerd door backend-/runtimebeleid).
  Als deze wordt weggelaten, erft ACP-spawn de werkruimte van de doelagent
  wanneer die is geconfigureerd; ontbrekende overgenomen paden vallen terug op
  backendstandaarden, terwijl echte toegangsfouten worden geretourneerd.
</ParamField>
<ParamField path="label" type="string">
  Operatorgerichte label dat wordt gebruikt in sessie-/bannertekst.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Hervat een bestaande ACP-sessie in plaats van een nieuwe te maken. De
  agent speelt zijn gespreksgeschiedenis opnieuw af via `session/load`. Vereist
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt voortgangssamenvattingen van de initiële ACP-run terug naar de
  aanvragersessie als systeemgebeurtenissen. Geaccepteerde reacties omvatten
  `streamLogPath`, dat verwijst naar een sessiegebonden JSONL-log
  (`<sessionId>.acp-stream.jsonl`) dat je kunt volgen voor de volledige relaygeschiedenis.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Breekt de ACP-childbeurt af na N seconden. `0` houdt de beurt op het
  no-timeoutpad van de Gateway. Dezelfde waarde wordt toegepast op de Gateway-run
  en de ACP-runtime, zodat vastgelopen of door quota uitgeputte harnesses
  de parent-agentlane niet onbeperkt bezet houden.
</ParamField>
<ParamField path="model" type="string">
  Expliciete modeloverride voor de ACP-childsessie. Codex ACP-spawns
  normaliseren OpenClaw Codex-referenties zoals `openai-codex/gpt-5.4` naar Codex
  ACP-opstartconfiguratie vóór `session/new`; slash-vormen zoals
  `openai-codex/gpt-5.4/high` stellen ook de Codex ACP-redeneerinspanning in.
  Andere harnesses moeten ACP `models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stil terug te vallen op de standaardinstelling van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` gekoppeld aan
  lage inspanning, worden `low`/`medium`/`high`/`xhigh` direct gekoppeld, en laat `off`
  de opstartoverride voor redeneerinspanning weg.
</ParamField>

## Spawn-bind- en threadmodi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek op zijn plaats; faal als er geen actief is. |
    | `off`  | Maak geen binding voor het huidige gesprek.                          |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat Codex-backed."
    - `--bind here` maakt geen childthread.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor binding van het huidige gesprek bieden.
    - `--bind` en `--thread` kunnen niet worden gecombineerd in dezelfde `/acp spawn`-aanroep.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een childthread wanneer ondersteund. |
    | `here` | Vereis huidige actieve thread; faal als je er niet in zit.                                                  |
    | `off`  | Geen binding. Sessie start ongebonden.                                                                 |

    Opmerkingen:

    - Op oppervlakken zonder threadbinding is het standaardgedrag effectief `off`.
    - Threadgebonden spawn vereist ondersteuning door kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gebruik `--bind here` wanneer je het huidige gesprek wilt vastzetten zonder een childthread te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten of door de parent beheerd
achtergrondwerk zijn. Het leveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactieve sessies zijn bedoeld om te blijven praten op een zichtbaar chatoppervlak:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-onderwerp aan de ACP-sessie.
    - Blijvend geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden rechtstreeks naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan hetzelfde
    kanaal/dezelfde thread/hetzelfde onderwerp.

    Wat OpenClaw naar de harness stuurt:

    - Normale gebonden vervolgen worden verzonden als prompttekst, plus bijlagen alleen wanneer de harness/backend deze ondersteunt.
    - `/acp`-beheeropdrachten en lokale Gateway-opdrachten worden onderschept vóór ACP-dispatch.
    - Door de runtime gegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agents krijgen de interne runtime-contextenvelop van OpenClaw; externe ACP-harnesses krijgen een gewone prompt met het childresultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnesses worden gestuurd of als ACP-gebruikerstranscripttekst worden bewaard.
    - ACP-transcriptvermeldingen gebruiken de voor de gebruiker zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Eenmalige ACP-sessies die door een andere agentrun worden gespawnd, zijn achtergrondchildren,
    vergelijkbaar met subagents:

    - De parent vraagt werk aan met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harnesssessie.
    - Childbeurten draaien op dezelfde achtergrondlane die wordt gebruikt door native sub-agent-spawns, zodat een trage ACP-harness niet unrelated werk in de hoofdsessie blokkeert.
    - Voltooiing rapporteert terug via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om in een gewone ACP-prompt voordat deze naar een externe harness wordt gestuurd, zodat harnesses geen runtimecontextmarkeringen zien die alleen voor OpenClaw zijn.
    - De parent herschrijft het childresultaat in normale assistenttoon wanneer een gebruikersgerichte reactie nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen parent
    en child. De child heeft al een voltooiingskanaal terug naar de
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kan na spawn een andere sessie als doel nemen. Voor normale
    peersessies gebruikt OpenClaw een agent-naar-agent- (A2A-) vervolgpaden
    na het injecteren van het bericht:

    - Wacht op het antwoord van de doelsessie.
    - Laat aanvrager en doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel om een aankondigingsbericht te produceren.
    - Lever die aankondiging aan het zichtbare kanaal of de thread.

    Dat A2A-pad is een fallback voor peer-sends waarbij de afzender een
    zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een unrelated sessie
    een ACP-doel kan zien en berichten, bijvoorbeeld onder brede
    `tools.sessions.visibility`-instellingen.

    OpenClaw slaat het A2A-vervolg alleen over wanneer de aanvrager de
    parent is van zijn eigen, door de parent beheerde eenmalige ACP-child. In dat geval
    kan A2A bovenop taakvoltooiing de parent wekken met het
    childresultaat, het antwoord van de parent terugsturen naar de child, en
    een parent/child-echolus maken. Het `sessions_send`-resultaat rapporteert
    `delivery.status="skipped"` voor dat owned-child-geval omdat het
    voltooiingspad al verantwoordelijk is voor het resultaat.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gebruik `resumeSessionId` om een vorige ACP-sessie voort te zetten in plaats van
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

    Veelvoorkomende gebruikssituaties:

    - Draag een Codex-sessie over van je laptop naar je telefoon - vertel je agent dat hij verder moet gaan waar je was gebleven.
    - Zet een codeersessie voort die je interactief in de CLI bent begonnen, nu headless via je agent.
    - Pak werk weer op dat werd onderbroken door een Gateway-herstart of inactiviteitstime-out.

    Opmerkingen:

    - `resumeSessionId` is alleen van toepassing wanneer `runtime: "acp"`; de standaard sub-agent-runtime negeert dit ACP-only veld.
    - `streamTo` is alleen van toepassing wanneer `runtime: "acp"`; de standaard sub-agent-runtime negeert dit ACP-only veld.
    - `resumeSessionId` is een host-lokale ACP-/harness-hervat-id, geen OpenClaw-kanaalsessiesleutel; OpenClaw controleert nog steeds ACP-spawnbeleid en doelagentbeleid vóór dispatch, terwijl de ACP-backend of harness autorisatie beheert voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` blijven normaal van toepassing op de nieuwe OpenClaw-sessie die je maakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, faalt de spawn met een duidelijke fout - geen stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Voer na een Gateway-deploy een live end-to-endcontrole uit in plaats van
    te vertrouwen op unittests:

    1. Controleer de geïmplementeerde Gateway-versie en commit op de doelhost.
    2. Open een tijdelijke ACPX-bridgesessie naar een live agent.
    3. Vraag die agent om `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Controleer `accepted=yes`, een echte `childSessionKey` en geen validatorfout.
    5. Ruim de tijdelijke bridgesessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over -
    thread-gebonden `mode: "session"` en stream-relay-paden zijn afzonderlijke
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
- OpenClaw handhaaft nog steeds ACP-functiegates, toegestane agents, sessie-eigenaarschap, kanaalbindingen en Gateway-afleveringsbeleid.
- Gebruik `runtime: "subagent"` voor sandbox-afgedwongen OpenClaw-native werk.

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
   - daarna UUID-vormige sessie-id
   - daarna label
2. Huidige threadbinding (als dit gesprek/deze thread aan een ACP-sessie is gebonden).
3. Fallback naar huidige aanvragersessie.

Bindingen van het huidige gesprek en threadbindingen doen beide mee in
stap 2.

Als geen doel kan worden opgelost, retourneert OpenClaw een duidelijke fout
(`Unable to resolve session target: ...`).

## ACP-besturing

| Opdracht             | Wat deze doet                                            | Voorbeeld                                                     |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maak ACP-sessie; optionele huidige binding of threadbinding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleer lopende turn voor doelsessie.                   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuur stuurinstructie naar draaiende sessie.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit sessie en ontbind threaddoelen.                    | `/acp close`                                                  |
| `/acp status`        | Toon backend, modus, status, runtime-opties, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Stel runtime-modus in voor doelsessie.                   | `/acp set-mode plan`                                          |
| `/acp set`           | Schrijf generieke runtime-configoptie.                   | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stel override voor runtime-werkmap in.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stel profiel voor goedkeuringsbeleid in.                 | `/acp permissions strict`                                     |
| `/acp timeout`       | Stel runtime-time-out in (seconden).                     | `/acp timeout 120`                                            |
| `/acp model`         | Stel runtime-modeloverride in.                           | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijder overrides voor sessie-runtimeopties.           | `/acp reset-options`                                          |
| `/acp sessions`      | Toon recente ACP-sessies uit de store.                   | `/acp sessions`                                               |
| `/acp doctor`        | Backendgezondheid, capabilities, uitvoerbare oplossingen. | `/acp doctor`                                                 |
| `/acp install`       | Druk deterministische installatie- en inschakelstappen af. | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus runtime- en
backendniveau sessie-identifiers. Fouten voor niet-ondersteunde besturing
komen duidelijk naar voren wanneer een backend geen capability heeft.
`/acp sessions` leest de store voor de huidige gebonden sessie of
aanvragersessie; doeltokens (`session-key`, `session-id` of `session-label`)
worden opgelost via Gateway-sessiediscovery, inclusief aangepaste
per-agent `session.store`-roots.

### Mapping van runtime-opties

`/acp` heeft gemakopdrachten en een generieke setter. Equivalente
bewerkingen:

| Opdracht                    | Koppelt aan                          | Opmerkingen                                                                                                                                                                    |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`           | runtime-configsleutel `model`        | Voor Codex ACP normaliseert OpenClaw `openai-codex/<model>` naar de adaptermodel-id en koppelt slash-reasoning-suffixen zoals `openai-codex/gpt-5.4/high` aan `reasoning_effort`. |
| `/acp set thinking <level>` | runtime-configsleutel `thinking`     | Voor Codex ACP verzendt OpenClaw de bijbehorende `reasoning_effort` waar de adapter er een ondersteunt.                                                                        |
| `/acp permissions <profile>` | runtime-configsleutel `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`    | runtime-configsleutel `timeout`      | -                                                                                                                                                                              |
| `/acp cwd <path>`           | runtime-cwd-override                 | Directe update.                                                                                                                                                               |
| `/acp set <key> <value>`    | generiek                             | `key=cwd` gebruikt het cwd-overridepad.                                                                                                                                        |
| `/acp reset-options`        | wist alle runtime-overrides          | -                                                                                                                                                                              |

## acpx-harness, Plugin-configuratie en machtigingen

Voor acpx-harnessconfiguratie (Claude Code / Codex / Gemini CLI
aliases), de MCP-bridges voor plugin-tools en OpenClaw-tools, en
ACP-machtigingsmodi, zie
[ACP-agents - configuratie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                    | Waarschijnlijke oorzaak                                                                                                             | Oplossing                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld of wordt geblokkeerd door `plugins.allow`.                                               | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die allowlist is ingesteld, en voer daarna `/acp doctor` uit.                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                                       | Stel `acp.enabled=true` in.                                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                              | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken.                                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de allowlist.                                                                                                   | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                                            |
| `/acp doctor` meldt direct na het opstarten dat de backend niet gereed is   | Backend-Plugin ontbreekt, is uitgeschakeld, wordt geblokkeerd door allow-/deny-beleid, of het geconfigureerde uitvoerbare bestand is niet beschikbaar. | Installeer/schakel de backend-Plugin in, voer `/acp doctor` opnieuw uit en inspecteer de backendinstallatie of beleidsfout als deze ongezond blijft.                                         |
| Harness-opdracht niet gevonden                                              | Adapter-CLI is niet geinstalleerd, de externe Plugin ontbreekt, of de eerste `npx`-download is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, installeer/warm de adapter voor op de Gateway-host, of configureer de acpx-agentopdracht expliciet.                                                                  |
| Model-niet-gevonden vanuit de harness                                       | Model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                                   | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness, of laat de override weg.                                                                          |
| Vendor-authenticatiefout vanuit de harness                                  | OpenClaw is gezond, maar de doel-CLI/provider is niet ingelogd.                                                                      | Log in of geef de vereiste providersleutel op in de Gateway-hostomgeving.                                                                                                                    |
| `Unable to resolve session target: ...`                                     | Ongeldig sleutel-/id-/labeltoken.                                                                                                   | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label en probeer het opnieuw.                                                                                                 |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder een actief bindbaar gesprek.                                                                           | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of gebruik een ongebonden spawn.                                                                                                  |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist ACP-bindingsmogelijkheid voor het huidige gesprek.                                                                      | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer `bindings[]` op topniveau, of ga naar een ondersteund kanaal.                                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                                   | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve bindingsdoel.                                                                       | Bind opnieuw als eigenaar of gebruik een ander gesprek of een andere thread.                                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist threadbindingsmogelijkheid.                                                                                            | Gebruik `--thread off` of ga naar een ondersteunde adapter/kanaal.                                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-runtime is host-side; de aanvragersessie is gesandboxed.                                                                         | Gebruik `runtime="subagent"` vanuit gesandboxte sessies, of voer ACP-spawn uit vanuit een niet-gesandboxte sessie.                                                                           |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP-runtime.                                                                                    | Gebruik `runtime="subagent"` voor vereiste sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxte sessie.                                                            |
| `Cannot apply --model ... did not advertise model support`                  | De doelharness biedt geen generieke ACP-modelwisseling.                                                                              | Gebruik een harness die ACP `models`/`session/set_model` adverteert, gebruik Codex ACP-modelrefs, of configureer het model rechtstreeks in de harness als die een eigen opstartflag heeft. |
| Ontbrekende ACP-metadata voor gebonden sessie                               | Verouderde/verwijderde ACP-sessiemetadata.                                                                                           | Maak opnieuw aan met `/acp spawn` en bind/focus daarna de thread opnieuw.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijfacties/exec in een niet-interactieve ACP-sessie.                                                   | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de gateway. Zie [Machtigingsconfiguratie](/nl/tools/acp-agents-setup#permission-configuration).              |
| ACP-sessie faalt vroeg met weinig uitvoer                                   | Machtigingsprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                                             | Controleer gatewaylogs op `AcpRuntimeError`. Stel voor volledige machtigingen `permissionMode=approve-all` in; stel voor elegante degradatie `nonInteractivePermissions=deny` in.          |
| ACP-sessie blijft onbeperkt hangen na voltooid werk                         | Harnessproces is afgerond, maar ACP-sessie heeft geen voltooiing gemeld.                                                            | Werk OpenClaw bij; de huidige acpx-opschoning ruimt door OpenClaw beheerde verouderde wrapper- en adapterprocessen op bij afsluiten en bij het opstarten van de Gateway.                   |
| Harness ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne gebeurtenisenvelop is over de ACP-grens gelekt.                                                                              | Werk OpenClaw bij en voer de voltooiingsflow opnieuw uit; externe harnesses zouden alleen gewone voltooiingsprompts moeten ontvangen.                                                        |

## Gerelateerd

- [ACP-agenten - installatie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Multi-agentsandboxtools](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (brugmodus)](/nl/cli/acp)
- [Subagenten](/nl/tools/subagents)
