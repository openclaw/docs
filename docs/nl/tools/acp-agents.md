---
read_when:
    - Codeerharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een gesprek via een berichtkanaal koppelen aan een persistente ACP-sessie
    - Probleemoplossing voor ACP-backend, Plugin-koppeling of voltooiingslevering
    - /acp-commando's bedienen vanuit chat
sidebarTitle: ACP agents
summary: Voer externe programmeerharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agents
x-i18n:
    generated_at: "2026-05-11T20:51:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe coding-harnesses uitvoeren (bijvoorbeeld Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnesses) via een ACP-backendplugin.

Elke ACP-sessiestart wordt gevolgd als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnesses, niet het standaard Codex-pad.** De
native Codex-app-serverplugin beheert `/codex ...`-besturing en de standaard
ingesloten runtime `openai/gpt-*` voor agentbeurten; ACP beheert
`/acp ...`-besturing en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code als externe MCP-client rechtstreeks
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina heb ik nodig?

| Je wilt…                                                                                         | Gebruik dit                           | Opmerkingen                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in het huidige gesprek koppelen of besturen                                                 | `/codex bind`, `/codex threads`       | Native Codex-app-serverpad wanneer de `codex`-plugin is ingeschakeld; omvat gekoppelde chatantwoorden, doorsturen van afbeeldingen, model/fast/machtigingen, stoppen en steer-besturing. ACP is een expliciete fallback |
| Claude Code, Gemini CLI, expliciete Codex ACP of een andere externe harness _via_ OpenClaw uitvoeren | Deze pagina                           | Chat-gekoppelde sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebesturing                                                                                              |
| Een OpenClaw Gateway-sessie _als_ ACP-server aanbieden voor een editor of client                  | [`openclaw acp`](/nl/cli/acp)            | Bridgemodus. IDE/client spreekt ACP met OpenClaw via stdio/WebSocket                                                                                                                                        |
| Een lokale AI-CLI hergebruiken als tekst-only fallbackmodel                                      | [CLI-backends](/nl/gateway/cli-backends) | Geen ACP. Geen OpenClaw-tools, geen ACP-besturing, geen harness-runtime                                                                                                                                      |

## Werkt dit standaard?

Ja, na installatie van de officiële ACP-runtimeplugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Bron-checkouts kunnen de lokale workspace-plugin `extensions/acpx` gebruiken na
`pnpm install`. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agents alleen over ACP-spawning wanneer ACP **echt
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld
zijn, de huidige sessie mag niet door de sandbox geblokkeerd zijn en er moet
een runtimebackend geladen zijn. Als niet aan die voorwaarden wordt voldaan,
blijven ACP-plugin-Skills en ACP-begeleiding voor `sessions_spawn` verborgen,
zodat de agent geen niet-beschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Valkuilen bij de eerste uitvoering">
    - Als `plugins.allow` is ingesteld, is dit een beperkende plugin-inventaris en **moet** deze `acpx` bevatten; anders wordt de geïnstalleerde ACP-backend opzettelijk geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De Codex ACP-adapter wordt met de `acpx`-plugin klaargezet en waar mogelijk lokaal gestart.
    - Codex ACP draait met een geïsoleerde `CODEX_HOME`; OpenClaw kopieert alleen vertrouwde projectvermeldingen uit de host-Codex-configuratie en vertrouwt de actieve workspace, terwijl auth, meldingen en hooks in de hostconfiguratie blijven.
    - Andere doel-harnessadapters kunnen nog steeds op aanvraag met `npx` worden opgehaald wanneer je ze voor het eerst gebruikt.
    - Leveranciersauthenticatie moet nog steeds op de host bestaan voor die harness.
    - Als de host geen npm of netwerktoegang heeft, mislukken adapterfetches bij de eerste uitvoering totdat caches zijn voorverwarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harnessproces. OpenClaw beheert routering,
    achtergrondtaakstatus, aflevering, koppelingen en beleid; de harness
    beheert zijn providerlogin, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer dit voordat je OpenClaw de schuld geeft:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - Het harnesscommando kan starten op de Gateway-host.
    - Providerauthenticatie is aanwezig voor die harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, enz.).
    - Het geselecteerde model bestaat voor die harness - model-id's zijn niet overdraagbaar tussen harnesses.
    - De aangevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend zijn standaard gebruiken.
    - De machtigingsmodus past bij het werk. Niet-interactieve sessies kunnen niet op native machtigingsprompts klikken, dus schrijf-/exec-intensieve coding-runs hebben meestal een ACPX-machtigingsprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-plugintools en ingebouwde OpenClaw-tools worden standaard **niet**
blootgesteld aan ACP-harnesses. Schakel de expliciete MCP-bridges in
[ACP-agents - installatie](/nl/tools/acp-agents-setup) alleen in wanneer de harness
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnessdoelen

Gebruik met de `acpx`-backend deze harness-id's als `/acp spawn <id>`-
of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`-doelen:

| Harness-id | Typische backend                              | Opmerkingen                                                                        |
| ---------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                       | Vereist Claude Code-authenticatie op de host.                                      |
| `codex`    | Codex ACP-adapter                             | Alleen expliciete ACP-fallback wanneer native `/codex` niet beschikbaar is of ACP is aangevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                    | Vereist Copilot CLI-/runtimeauthenticatie.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Overschrijf het acpx-commando als een lokale installatie een ander ACP-entrypoint aanbiedt. |
| `droid`    | Factory Droid CLI                             | Vereist Factory/Droid-authenticatie of `FACTORY_API_KEY` in de harnessomgeving.    |
| `gemini`   | Gemini CLI ACP-adapter                        | Vereist Gemini CLI-authenticatie of API-keyconfiguratie.                           |
| `iflow`    | iFlow CLI                                     | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                 | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                             | Vereist Kimi/Moonshot-authenticatie op de host.                                    |
| `kiro`     | Kiro CLI                                      | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                          | Vereist OpenCode CLI-/providerauthenticatie.                                       |
| `openclaw` | OpenClaw Gateway-bridge via `openclaw acp`    | Laat een ACP-bewuste harness terugpraten met een OpenClaw Gateway-sessie.          |
| `pi`       | Pi/ingesloten OpenClaw-runtime                | Gebruikt voor OpenClaw-native harness-experimenten.                                |
| `qwen`     | Qwen Code / Qwen CLI                          | Vereist Qwen-compatibele authenticatie op de host.                                 |

Aangepaste acpx-agentaliassen kunnen in acpx zelf worden geconfigureerd, maar
OpenClaw-beleid controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mapping vóór dispatch.

## Operator-runbook

Snelle `/acp`-flow vanuit chat:

<Steps>
  <Step title="Starten">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, of expliciet
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Werken">
    Ga door in het gekoppelde gesprek of de thread (of richt je expliciet
    op de sessiesleutel).
  </Step>
  <Step title="Status controleren">
    `/acp status`
  </Step>
  <Step title="Afstemmen">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Bijsturen">
    Zonder context te vervangen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (huidige beurt) of `/acp close` (sessie + koppelingen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Levenscyclusdetails">
    - Spawn maakt of hervat een ACP-runtimesessie, registreert ACP-metadata in de OpenClaw-sessieopslag en kan een achtergrondtaak maken wanneer de run door de parent wordt beheerd.
    - Door de parent beheerde ACP-sessies worden behandeld als achtergrondwerk, zelfs wanneer de runtimesessie persistent is; voltooiing en aflevering over oppervlakken heen verlopen via de parent-taaknotifier in plaats van als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde, door de parent beheerde one-shot ACP-sessies. Persistente ACP-sessies blijven behouden zolang er een actieve gesprekskoppeling bestaat; verouderde persistente sessies zonder actieve koppeling worden gesloten zodat ze niet stilzwijgend kunnen worden hervat nadat de eigenaarstaak klaar is of het taakrecord verdwenen is.
    - Gekoppelde vervolgmberichten gaan rechtstreeks naar de ACP-sessie totdat de koppeling wordt gesloten, uit focus wordt gehaald, gereset of verlopen is.
    - Gateway-commando's blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppelde ACP-harness verzonden.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de koppeling of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit het perspectief van OpenClaw en verwijdert de koppeling. Een harness kan nog steeds zijn eigen upstreamgeschiedenis behouden als deze hervatten ondersteunt.
    - De acpx-plugin ruimt door OpenClaw beheerde wrapper- en adapterprocesbomen op na `close`, en ruimt verouderde door OpenClaw beheerde ACPX-orphans op tijdens het starten van de Gateway.
    - Inactieve runtimeworkers komen in aanmerking voor opruiming na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijft beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die moeten routeren naar de **native Codex-
    plugin** wanneer deze is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel daarna deze."

    Native Codex-gespreksbinding is het standaardpad voor chatbesturing.
    Dynamische OpenClaw-tools worden nog steeds via OpenClaw uitgevoerd, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native toolgebeurtenissen injecteert OpenClaw per beurt een native
    hook-relay zodat plugin-hooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex-`PermissionRequest`-gebeurtenissen
    via OpenClaw-goedkeuringen kunnen routeren. Codex-`Stop`-hooks worden doorgestuurd naar
    OpenClaw `before_agent_finalize`, waar plugins nog één extra
    modelpass kunnen aanvragen voordat Codex zijn antwoord afrondt. De relay blijft
    bewust conservatief: hij wijzigt geen Codex-native toolargumenten
    en herschrijft geen Codex-threadrecords. Gebruik expliciete ACP alleen
    wanneer je het ACP-runtime-/sessiemodel wilt. De grens van ingebedde Codex-ondersteuning
    is gedocumenteerd in het
    [Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Spiekbriefje voor model-/provider-/runtimeselectie">
    - `openai-codex/*` - legacy Codex OAuth-/abonnementsmodelroute die door doctor wordt gerepareerd.
    - `openai/*` - native Codex app-server ingebedde runtime voor OpenAI-agentbeurten.
    - `/codex ...` - native Codex-gespreksbesturing.
    - `/acp ...` of `runtime: "acp"` - expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="ACP-routingtriggers in natuurlijke taal">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en bewaar vervolgstappen daarna in dezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, lost de harness `agentId` op,
    bindt aan het huidige gesprek of de huidige thread wanneer dat wordt ondersteund, en
    routeert vervolgstappen naar die sessie tot sluiten/verlopen. Codex volgt
    dit pad alleen wanneer ACP/acpx expliciet is of de native Codex-
    plugin niet beschikbaar is voor de gevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen aangekondigd wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox zit en er een ACP-runtime-
    backend is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratie-agent-id uit `agents_list` door, tenzij die vermelding
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaard sub-agent-runtime. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als onderliggende harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agents

Gebruik ACP wanneer je een externe harness-runtime wilt. Gebruik **native Codex
app-server** voor Codex-gespreksbinding/-besturing wanneer de `codex`-
plugin is ingeschakeld. Gebruik **sub-agents** wanneer je door OpenClaw-native
gedelegeerde runs wilt.

| Gebied        | ACP-sessie                            | Sub-agent-run                     |
| ------------- | ------------------------------------- | --------------------------------- |
| Runtime       | ACP-backend-plugin (bijvoorbeeld acpx) | OpenClaw native sub-agent-runtime |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| Hoofdopdrachten | `/acp ...`                          | `/subagents ...`                  |
| Spawn-tool    | `sessions_spawn` met `runtime:"acp"`  | `sessions_spawn` (standaardruntime) |

Zie ook [Sub-agents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiebesturingsvlak.
2. Officiële `@openclaw/acpx` runtime-plugin.
3. Claude ACP-adapter.
4. Runtime-/sessiemachinerie aan Claude-zijde.

ACP Claude is een **harness-sessie** met ACP-besturing, sessiehervatting,
achtergrondtaaktracking en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallback-runtimes - zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wil je `/acp spawn`, bindbare sessies, runtimebesturing of persistent harness-werk?** Gebruik ACP.
- **Wil je eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** - waar mensen blijven praten (Discord-kanaal, Telegram-topic, iMessage-chat).
- **ACP-sessie** - de duurzame Codex/Claude/Gemini-runtime-status waar OpenClaw naartoe routeert.
- **Onderliggende thread/topic** - een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt gemaakt.
- **Runtimewerkruimte** - de bestandssysteemlocatie (`cwd`, repo-checkout, backendwerkruimte) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Bindingen aan huidig gesprek

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie - geen onderliggende thread, hetzelfde chatoppervlak. OpenClaw blijft
transport, auth, veiligheid en aflevering beheren. Vervolgberichten in dat
gesprek routeren naar dezelfde sessie; `/new` en `/reset` resetten de
sessie op dezelfde plek; `/acp close` verwijdert de binding.

Voorbeelden:

```text
/codex bind                                              # native Codex-bind, routeer toekomstige berichten hierheen
/codex model gpt-5.4                                     # stem de gebonden native Codex-thread af
/codex stop                                              # bestuur de actieve native Codex-beurt
/acp spawn codex --bind here                             # expliciete ACP-fallback voor Codex
/acp spawn codex --thread auto                           # kan een onderliggende thread/topic maken en daar binden
/acp spawn codex --bind here --cwd /workspace/repo       # dezelfde chatbinding, Codex draait in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindingsregels en exclusiviteit">
    - `--bind here` en `--thread ...` sluiten elkaar uit.
    - `--bind here` werkt alleen op kanalen die binding aan het huidige gesprek aankondigen; OpenClaw retourneert anders een duidelijke niet-ondersteund-melding. Bindingen blijven bestaan na herstarts van de Gateway.
    - Op Discord gated `spawnSessions` het maken van onderliggende threads voor `--thread auto|here` - niet `--bind here`.
    - Als je naar een andere ACP-agent spawnt zonder `--cwd`, neemt OpenClaw standaard de werkruimte van de **doelagent** over. Ontbrekende overgenomen paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawnfouten.
    - Gateway-beheeropdrachten blijven lokaal in gebonden gesprekken - `/acp ...`-opdrachten worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie routeert; `/status` en `/unfocus` blijven ook lokaal wanneer opdrachtafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Thread-gebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread routeren naar de gebonden ACP-sessie.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Unfocus/sluiten/archiveren/idle-timeout of verlopen door maximale leeftijd verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-opdrachten, geen prompts voor de ACP-harness.

    Vereiste featureflags voor thread-gebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (zet op `false` om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - Spawns van thread-sessies voor kanaaladapters ingeschakeld (standaard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Ondersteuning voor threadbinding is adapterspecifiek. Als de actieve kanaaladapter
    geen threadbindingen ondersteunt, retourneert OpenClaw een duidelijke
    niet-ondersteund-/niet-beschikbaar-melding.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingscapaciteit blootstelt.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/kanalen, **Telegram**-topics (forumtopics in groepen/supergroepen en DM-topics).
    - Plugin-kanalen kunnen ondersteuning toevoegen via dezelfde bindingsinterface.

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
- **Slack-kanaal/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Geef de voorkeur aan stabiele Slack-id's; kanaalbindingen matchen ook antwoorden binnen de threads van dat kanaal.
- **Telegram-forumtopic:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
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
  Optionele runtimewerkdirectory.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionele backend-override.
</ParamField>

### Runtimestandaarden per agent

Gebruik `agents.list[].runtime` om ACP-standaarden één keer per agent te definiëren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness-id, bijv. `codex` of `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Overridevoorrang voor ACP-gebonden sessies:**

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

- OpenClaw zorgt dat de geconfigureerde ACP-sessie bestaat vóór gebruik.
- Berichten in dat kanaal of onderwerp worden naar de geconfigureerde ACP-sessie gerouteerd.
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel ter plaatse.
- Tijdelijke runtimebindingen (bijvoorbeeld aangemaakt door thread-focusflows) blijven van toepassing waar aanwezig.
- Voor cross-agent ACP-spawns zonder expliciete `cwd` erft OpenClaw de werkruimte van de doelagent uit de agentconfiguratie.
- Ontbrekende overgeërfde werkruimtepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsfouten verschijnen als spawnfouten.

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
    `runtime` staat standaard op `subagent`, dus stel expliciet `runtime: "acp"` in
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
  ACP-doelharnas-id. Valt terug op `acp.defaultAgent` als dit is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag een threadbindingsflow aan waar ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is persistent. Als `thread: true` en
  `mode` wordt weggelaten, kan OpenClaw standaard kiezen voor persistent gedrag per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde werkmap voor de runtime (gevalideerd door backend-/runtimebeleid).
  Als deze wordt weggelaten, erft de ACP-spawn de werkruimte van de doelagent
  wanneer die is geconfigureerd; ontbrekende overgeërfde paden vallen terug op
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
  `"parent"` streamt voortgangssamenvattingen van de initiële ACP-run terug naar de
  aanvragende sessie als systeemgebeurtenissen. Geaccepteerde reacties omvatten
  `streamLogPath`, dat verwijst naar een sessiegebonden JSONL-log
  (`<sessionId>.acp-stream.jsonl`) dat je kunt volgen voor volledige relaygeschiedenis.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Breekt de ACP-childbeurt af na N seconden. `0` houdt de beurt op het
  pad zonder time-out van de Gateway. Dezelfde waarde wordt toegepast op de Gateway-run
  en ACP-runtime, zodat vastgelopen harnassen of harnassen zonder quota
  de baan van de ouderagent niet onbeperkt bezet houden.
</ParamField>
<ParamField path="model" type="string">
  Expliciete modeloverride voor de ACP-childsessie. Codex ACP-spawns
  normaliseren OpenClaw Codex-referenties zoals `openai-codex/gpt-5.4` naar Codex
  ACP-opstartconfiguratie vóór `session/new`; slashvormen zoals
  `openai-codex/gpt-5.4/high` stellen ook de redeneerinspanning van Codex ACP in.
  Andere harnassen moeten ACP `models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stil terug te vallen op de standaard van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` gekoppeld aan
  lage inspanning, worden `low`/`medium`/`high`/`xhigh` direct gekoppeld, en laat `off`
  de opstartoverride voor redeneerinspanning weg.
</ParamField>

## Bind- en threadmodi voor spawn

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek ter plaatse; faal als er geen actief is. |
    | `off`  | Maak geen binding voor het huidige gesprek.                           |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat door Codex ondersteund."
    - `--bind here` maakt geen childthread.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor binding van het huidige gesprek bieden.
    - `--bind` en `--thread` kunnen niet worden gecombineerd in dezelfde `/acp spawn`-aanroep.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een childthread wanneer ondersteund. |
    | `here` | Vereis de huidige actieve thread; faal als je niet in een thread zit.                             |
    | `off`  | Geen binding. Sessie start ongebonden.                                                           |

    Opmerkingen:

    - Op oppervlakken zonder threadbinding is het standaardgedrag effectief `off`.
    - Threadgebonden spawn vereist ondersteuning door kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gebruik `--bind here` wanneer je het huidige gesprek wilt vastpinnen zonder een childthread te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten zijn of achtergrondwerk
dat door de ouder wordt beheerd. Het leveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactieve sessies zijn bedoeld om te blijven praten op een zichtbaar chatoppervlak:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-onderwerp aan de ACP-sessie.
    - Persistent geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden direct naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan datzelfde
    kanaal/diezelfde thread/datzelfde onderwerp.

    Wat OpenClaw naar het harnas stuurt:

    - Normale gebonden vervolgberichten worden verzonden als prompttekst, plus bijlagen alleen wanneer het harnas/de backend ze ondersteunt.
    - `/acp`-beheeropdrachten en lokale Gateway-opdrachten worden onderschept vóór ACP-dispatch.
    - Door de runtime gegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agenten krijgen de interne runtime-contextenvelop van OpenClaw; externe ACP-harnassen krijgen een gewone prompt met het childresultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnassen worden gestuurd of als ACP-gebruikerstranscripttekst worden bewaard.
    - ACP-transcriptitems gebruiken de voor de gebruiker zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Eenmalige ACP-sessies die door een andere agentrun worden gespawnd, zijn achtergrondchildren,
    vergelijkbaar met subagents:

    - De ouder vraagt om werk met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harnassessie.
    - Childbeurten draaien op dezelfde achtergrondbaan die wordt gebruikt door native subagent-spawns, zodat een traag ACP-harnas geen niet-gerelateerd hoofdssessiewerk blokkeert.
    - Voltooiing wordt teruggerapporteerd via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om naar een gewone ACP-prompt voordat deze naar een extern harnas wordt gestuurd, zodat harnassen geen runtime-contextmarkeringen zien die alleen voor OpenClaw zijn.
    - De ouder herschrijft het childresultaat in een normale assistentstem wanneer een gebruikersgerichte reactie nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen ouder
    en child. De child heeft al een voltooiingskanaal terug naar de
    ouder.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kan na spawn op een andere sessie richten. Voor normale
    peersessies gebruikt OpenClaw een agent-naar-agent (A2A)-vervolgpad
    nadat het bericht is geïnjecteerd:

    - Wacht op het antwoord van de doelsessie.
    - Laat aanvrager en doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel om een aankondigingsbericht te produceren.
    - Lever die aankondiging aan het zichtbare kanaal of de thread.

    Dat A2A-pad is een fallback voor peerverzendingen waarbij de afzender een
    zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een niet-gerelateerde sessie
    een ACP-doel kan zien en berichten kan sturen, bijvoorbeeld onder brede
    `tools.sessions.visibility`-instellingen.

    OpenClaw slaat het A2A-vervolg alleen over wanneer de aanvrager de
    ouder is van zijn eigen door de ouder beheerde eenmalige ACP-child. In dat geval kan
    A2A boven op taakvoltooiing de ouder wakker maken met het
    resultaat van de child, het antwoord van de ouder terugsturen naar de child, en
    een ouder/child-echoloop maken. Het `sessions_send`-resultaat meldt
    `delivery.status="skipped"` voor dat eigen-childgeval, omdat het
    voltooiingspad al verantwoordelijk is voor het resultaat.

  </Accordion>
  <Accordion title="Resume an existing session">
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

    Veelvoorkomende gebruikssituaties:

    - Draag een Codex-sessie over van je laptop naar je telefoon - zeg je agent dat hij moet verdergaan waar je was gebleven.
    - Zet een codeersessie voort die je interactief in de CLI bent gestart, nu headless via je agent.
    - Pak werk weer op dat werd onderbroken door een Gateway-herstart of idle time-out.

    Opmerkingen:

    - `resumeSessionId` geldt alleen wanneer `runtime: "acp"`; de standaard subagent-runtime negeert dit veld dat alleen voor ACP is.
    - `streamTo` geldt alleen wanneer `runtime: "acp"`; de standaard subagent-runtime negeert dit veld dat alleen voor ACP is.
    - `resumeSessionId` is een hostlokale ACP-/harnas-hervat-id, geen OpenClaw-kanaalsessiesleutel; OpenClaw controleert nog steeds ACP-spawnbeleid en doelagentbeleid vóór dispatch, terwijl de ACP-backend of het harnas eigenaar is van autorisatie voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` zijn nog steeds normaal van toepassing op de nieuwe OpenClaw-sessie die je maakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, faalt de spawn met een duidelijke fout - geen stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Voer na een Gateway-deploy een live end-to-endcontrole uit in plaats van
    te vertrouwen op unittests:

    1. Controleer de gedeployde Gateway-versie en commit op de doelhost.
    2. Open een tijdelijke ACPX-brugsessie naar een live agent.
    3. Vraag die agent om `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Controleer `accepted=yes`, een echte `childSessionKey` en geen validatorfout.
    5. Ruim de tijdelijke brugsessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over -
    aan threads gebonden `mode: "session"` en stream-relaypaden zijn aparte,
    rijkere integratiepasses.

  </Accordion>
</AccordionGroup>

## Sandboxcompatibiliteit

ACP-sessies draaien momenteel op de hostruntime, **niet** binnen de
OpenClaw-sandbox.

<Warning>
**Beveiligingsgrens:**

- De externe harness kan lezen/schrijven volgens zijn eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw omhult de uitvoering van de ACP-harness **niet**.
- OpenClaw dwingt nog steeds ACP-functiegates, toegestane agents, sessie-eigendom, kanaalbindingen en het leveringsbeleid van de Gateway af.
- Gebruik `runtime: "subagent"` voor sandbox-afgedwongen OpenClaw-native werk.

</Warning>

Huidige beperkingen:

- Als de aanvragende sessie in een sandbox draait, worden ACP-spawns geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt `sandbox: "require"` niet.

## Resolutie van sessiedoel

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Resolutievolgorde:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert sleutel
   - daarna UUID-vormige sessie-id
   - daarna label
2. Huidige threadbinding (als dit gesprek/deze thread aan een ACP-sessie is gebonden).
3. Terugval naar huidige aanvragende sessie.

Bindingen van het huidige gesprek en threadbindingen doen beide mee in
stap 2.

Als er geen doel kan worden opgelost, geeft OpenClaw een duidelijke fout terug
(`Unable to resolve session target: ...`).

## ACP-besturing

| Opdracht             | Wat het doet                                             | Voorbeeld                                                     |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maak ACP-sessie aan; optionele huidige binding of threadbinding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleer lopende beurt voor doelsessie.                  | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuur stuurinstructie naar draaiende sessie.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit sessie en maak threaddoelen los.                   | `/acp close`                                                  |
| `/acp status`        | Toon backend, modus, status, runtime-opties, mogelijkheden. | `/acp status`                                                 |
| `/acp set-mode`      | Stel runtimemodus in voor doelsessie.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Schrijf generieke runtimeconfiguratieoptie.              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stel override voor runtimewerkmap in.                    | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stel profiel voor goedkeuringsbeleid in.                 | `/acp permissions strict`                                     |
| `/acp timeout`       | Stel runtimetime-out in (seconden).                      | `/acp timeout 120`                                            |
| `/acp model`         | Stel override voor runtimemodel in.                      | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijder overrides voor sessieruntimeopties.            | `/acp reset-options`                                          |
| `/acp sessions`      | Toon recente ACP-sessies uit de opslag.                  | `/acp sessions`                                               |
| `/acp doctor`        | Backendgezondheid, mogelijkheden, uitvoerbare oplossingen. | `/acp doctor`                                                 |
| `/acp install`       | Druk deterministische installatie- en inschakelstappen af. | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus runtime- en
backendniveau-sessie-identifiers. Fouten voor niet-ondersteunde besturing
verschijnen duidelijk wanneer een backend een mogelijkheid mist. `/acp sessions` leest de
opslag voor de huidige gebonden of aanvragende sessie; doeltokens
(`session-key`, `session-id` of `session-label`) worden opgelost via
Gateway-sessieontdekking, inclusief aangepaste per-agent `session.store`-
roots.

### Toewijzing van runtime-opties

`/acp` heeft handige opdrachten en een generieke setter. Equivalente
bewerkingen:

| Opdracht                     | Wijst toe aan                         | Opmerkingen                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtimeconfiguratiesleutel `model`    | Voor Codex ACP normaliseert OpenClaw `openai-codex/<model>` naar de adaptermodel-id en wijst slash-redeneersuffixen zoals `openai-codex/gpt-5.4/high` toe aan `reasoning_effort`.                         |
| `/acp set thinking <level>`  | canonieke optie `thinking`            | OpenClaw stuurt het door de backend geadverteerde equivalent wanneer aanwezig, met voorkeur voor `thinking`, daarna `effort`, `reasoning_effort` of `thought_level`. Voor Codex ACP wijst de adapter waarden toe aan `reasoning_effort`. |
| `/acp permissions <profile>` | canonieke optie `permissionProfile`   | OpenClaw stuurt het door de backend geadverteerde equivalent wanneer aanwezig, zoals `approval_policy`, `permission_profile`, `permissions` of `permission_mode`.                                      |
| `/acp timeout <seconds>`     | canonieke optie `timeoutSeconds`      | OpenClaw stuurt het door de backend geadverteerde equivalent wanneer aanwezig, zoals `timeout` of `timeout_seconds`.                                                                                     |
| `/acp cwd <path>`            | runtime-cwd-override                  | Directe update.                                                                                                                                                                                           |
| `/acp set <key> <value>`     | generiek                              | `key=cwd` gebruikt het cwd-overridepad.                                                                                                                                                                   |
| `/acp reset-options`         | wist alle runtime-overrides           | -                                                                                                                                                                                                         |

## acpx-harness, Plugin-installatie en machtigingen

Voor acpx-harnessconfiguratie (Claude Code / Codex / Gemini CLI-
aliassen), de MCP-bruggen plugin-tools en OpenClaw-tools, en ACP-
machtigingsmodi, zie
[ACP-agents - installatie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                    | Waarschijnlijke oorzaak                                                                                               | Oplossing                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld of wordt geblokkeerd door `plugins.allow`.                                  | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die allowlist is ingesteld, en voer daarna `/acp doctor` uit.                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                         | Stel `acp.enabled=true` in.                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                 | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken.                |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de allowlist.                                                                                      | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                           |
| `/acp doctor` meldt dat de backend niet klaar is direct na het opstarten    | Backend-Plugin ontbreekt, is uitgeschakeld, wordt geblokkeerd door allow/deny-beleid, of het geconfigureerde uitvoerbare bestand is niet beschikbaar. | Installeer/schakel de backend-Plugin in, voer `/acp doctor` opnieuw uit en inspecteer de backendinstallatie of beleidsfout als deze ongezond blijft.                        |
| Harnessopdracht niet gevonden                                               | Adapter-CLI is niet geïnstalleerd, de externe Plugin ontbreekt, of de eerste `npx`-fetch is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, installeer/warm de adapter vooraf op de Gateway-host op, of configureer de acpx-agentopdracht expliciet.                                             |
| Model-niet-gevonden vanuit de harness                                       | Model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                      | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness, of laat de override weg.                                                        |
| Vendor-authenticatiefout vanuit de harness                                  | OpenClaw is gezond, maar de doel-CLI/provider is niet aangemeld.                                                       | Meld je aan of geef de vereiste providersleutel op in de Gateway-hostomgeving.                                                                                              |
| `Unable to resolve session target: ...`                                     | Ongeldig sleutel-/id-/labeltoken.                                                                                      | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label en probeer het opnieuw.                                                                                |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder een actief bindbaar gesprek.                                                             | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of gebruik een ongebonden spawn.                                                                                 |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist de ACP-bindingsmogelijkheid voor het huidige gesprek.                                                     | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer `bindings[]` op topniveau, of ga naar een ondersteund kanaal.                                           |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                     | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve bindingsdoel.                                                         | Bind opnieuw als eigenaar of gebruik een ander gesprek of een andere thread.                                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist threadbindingsmogelijkheid.                                                                               | Gebruik `--thread off` of ga naar een ondersteunde adapter/kanaal.                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-runtime draait aan de hostzijde; de aanvragende sessie is gesandboxed.                                             | Gebruik `runtime="subagent"` vanuit gesandboxde sessies, of voer ACP-spawn uit vanuit een niet-gesandboxde sessie.                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP-runtime.                                                                      | Gebruik `runtime="subagent"` voor vereiste sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxde sessie.                                          |
| `Cannot apply --model ... did not advertise model support`                  | De doelharness biedt geen generieke ACP-modelwisseling.                                                                | Gebruik een harness die ACP `models`/`session/set_model` adverteert, gebruik Codex ACP-modelrefs, of configureer het model direct in de harness als die een eigen opstartvlag heeft. |
| Ontbrekende ACP-metadata voor gebonden sessie                               | Verouderde/verwijderde ACP-sessiemetadata.                                                                             | Maak opnieuw aan met `/acp spawn`, en bind/focus daarna de thread opnieuw.                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijven/uitvoeren in een niet-interactieve ACP-sessie.                                    | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de Gateway. Zie [Permissieconfiguratie](/nl/tools/acp-agents-setup#permission-configuration). |
| ACP-sessie faalt vroeg met weinig output                                    | Permissieprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                                 | Controleer Gateway-logs op `AcpRuntimeError`. Stel voor volledige permissies `permissionMode=approve-all` in; stel voor gracieuze degradatie `nonInteractivePermissions=deny` in. |
| ACP-sessie blijft voor onbepaalde tijd hangen na voltooiing van het werk    | Harnessproces is voltooid, maar ACP-sessie heeft geen voltooiing gemeld.                                               | Werk OpenClaw bij; de huidige acpx-cleanup ruimt door OpenClaw beheerde verouderde wrapper- en adapterprocessen op bij sluiten en bij het opstarten van de Gateway.        |
| Harness ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne eventenvelope is over de ACP-grens gelekt.                                                                     | Werk OpenClaw bij en voer de voltooiingsflow opnieuw uit; externe harnesses zouden alleen platte voltooiingsprompts moeten ontvangen.                                      |

## Gerelateerd

- [ACP-agenten - installatie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harness-runtime](/nl/plugins/codex-harness-runtime)
- [Multi-agent-sandboxtools](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (bridgemodus)](/nl/cli/acp)
- [Subagenten](/nl/tools/subagents)
