---
read_when:
    - Codeharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een gesprek via een berichtenkanaal koppelen aan een persistente ACP-sessie
    - Problemen oplossen met ACP-backend, Plugin-koppeling of levering van voltooiingen
    - Uitvoeren van /acp-opdrachten vanuit de chat
sidebarTitle: ACP agents
summary: Voer externe codeharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agenten
x-i18n:
    generated_at: "2026-05-01T11:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe coding-harnassen (bijvoorbeeld Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnassen) uitvoeren via een ACP-backend-Plugin.

Elke ACP-sessie-spawn wordt bijgehouden als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnassen, niet het standaard Codex-pad.** De
native Codex-app-server-Plugin beheert `/codex ...`-besturingen en de
ingebedde runtime `agentRuntime.id: "codex"`; ACP beheert
`/acp ...`-besturingen en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code rechtstreeks als externe MCP-client
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina heb ik nodig?

| Je wilt…                                                                                        | Gebruik dit                           | Opmerkingen                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex koppelen of bedienen in het huidige gesprek                                               | `/codex bind`, `/codex threads`       | Native Codex-app-server-pad wanneer de `codex`-Plugin is ingeschakeld; omvat gekoppelde chatantwoorden, doorsturen van afbeeldingen, model/fast/rechten, stoppen en sturingsbesturing. ACP is een expliciete fallback |
| Claude Code, Gemini CLI, expliciete Codex ACP of een ander extern harnas _via_ OpenClaw uitvoeren | Deze pagina                           | Chat-gekoppelde sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtime-besturingen                                                                           |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar stellen voor een editor of client       | [`openclaw acp`](/nl/cli/acp)            | Brugmodus. IDE/client spreekt ACP met OpenClaw via stdio/WebSocket                                                                                                                           |
| Een lokale AI-CLI hergebruiken als tekst-only fallbackmodel                                     | [CLI-backends](/nl/gateway/cli-backends) | Geen ACP. Geen OpenClaw-tools, geen ACP-besturingen, geen harnas-runtime                                                                                                                     |

## Werkt dit direct?

Meestal wel. Nieuwe installaties leveren de gebundelde `acpx`-runtime-Plugin
standaard ingeschakeld met een Plugin-lokaal vastgepinde `acpx`-binary die
OpenClaw controleert en automatisch herstelt direct nadat de Gateway
HTTP-listener live is. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agenten alleen over ACP-spawning wanneer ACP **daadwerkelijk
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld
zijn, de huidige sessie mag niet door de sandbox geblokkeerd zijn, en er moet
een runtime-backend geladen zijn. Als niet aan die voorwaarden is voldaan,
blijven ACP-Plugin-Skills en `sessions_spawn`-ACP-richtlijnen verborgen zodat
de agent geen onbeschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Aandachtspunten bij eerste gebruik">
    - Als `plugins.allow` is ingesteld, is dit een beperkende Plugin-inventaris en **moet** deze `acpx` bevatten; anders wordt de gebundelde standaard opzettelijk geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De gebundelde Codex ACP-adapter wordt met de `acpx`-Plugin klaargezet en waar mogelijk lokaal gestart.
    - Andere doelharnas-adapters kunnen nog steeds op aanvraag met `npx` worden opgehaald wanneer je ze voor het eerst gebruikt.
    - Vendor-authenticatie moet nog steeds op de host aanwezig zijn voor dat harnas.
    - Als de host geen npm- of netwerktoegang heeft, mislukken adapter-fetches bij eerste gebruik totdat caches vooraf zijn opgewarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtime-vereisten">
    ACP start een echt extern harnasproces. OpenClaw beheert routering,
    achtergrondtaakstatus, aflevering, koppelingen en beleid; het harnas
    beheert zijn provider-login, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer voordat je OpenClaw de schuld geeft:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - De harnasopdracht kan starten op de Gateway-host.
    - Provider-authenticatie is aanwezig voor dat harnas (`claude`, `codex`, `gemini`, `opencode`, `droid`, enz.).
    - Het geselecteerde model bestaat voor dat harnas — model-id's zijn niet overdraagbaar tussen harnassen.
    - De gevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend zijn standaard gebruiken.
    - De rechtenmodus past bij het werk. Niet-interactieve sessies kunnen niet op native toestemmingsprompts klikken, dus schrijf-/exec-intensieve coding-runs hebben meestal een ACPX-rechtenprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-tools en ingebouwde OpenClaw-tools worden standaard **niet**
blootgesteld aan ACP-harnassen. Schakel de expliciete MCP-bruggen in
[ACP-agenten — setup](/nl/tools/acp-agents-setup) alleen in wanneer het harnas
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnasdoelen

Met de gebundelde `acpx`-backend gebruik je deze harnas-id's als doelen voor
`/acp spawn <id>` of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harnas-id | Typische backend                              | Opmerkingen                                                                        |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                      | Vereist Claude Code-authenticatie op de host.                                      |
| `codex`    | Codex ACP-adapter                            | Alleen expliciete ACP-fallback wanneer native `/codex` niet beschikbaar is of ACP is aangevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                   | Vereist Copilot CLI-/runtime-authenticatie.                                        |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)          | Overschrijf de acpx-opdracht als een lokale installatie een ander ACP-entrypoint biedt. |
| `droid`    | Factory Droid CLI                            | Vereist Factory/Droid-authenticatie of `FACTORY_API_KEY` in de harnasomgeving.     |
| `gemini`   | Gemini CLI ACP-adapter                       | Vereist Gemini CLI-authenticatie of API-sleutelconfiguratie.                       |
| `iflow`    | iFlow CLI                                    | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                            | Vereist Kimi/Moonshot-authenticatie op de host.                                    |
| `kiro`     | Kiro CLI                                     | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                         | Vereist OpenCode CLI-/provider-authenticatie.                                      |
| `openclaw` | OpenClaw Gateway-brug via `openclaw acp`     | Laat een ACP-bewust harnas terugpraten naar een OpenClaw Gateway-sessie.           |
| `pi`       | Pi/ingebedde OpenClaw-runtime                | Gebruikt voor OpenClaw-native harnasexperimenten.                                  |
| `qwen`     | Qwen Code / Qwen CLI                         | Vereist Qwen-compatibele authenticatie op de host.                                 |

Aangepaste acpx-agentaliassen kunnen in acpx zelf worden geconfigureerd, maar
OpenClaw-beleid controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mapping voordat er wordt gedispatcht.

## Runbook voor operators

Snelle `/acp`-flow vanuit chat:

<Steps>
  <Step title="Spawnen">
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
  <Step title="Afstemmen">
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
  <Accordion title="Lifecycle-details">
    - Spawn maakt of hervat een ACP-runtime-sessie, legt ACP-metadata vast in de OpenClaw-sessieopslag en kan een achtergrondtaak maken wanneer de run eigendom is van de parent.
    - ACP-sessies die eigendom zijn van de parent worden behandeld als achtergrondwerk, zelfs wanneer de runtime-sessie persistent is; voltooiing en aflevering over oppervlakken heen lopen via de parent-taaknotifier in plaats van zich te gedragen als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde one-shot ACP-sessies die eigendom zijn van de parent. Persistente ACP-sessies blijven behouden zolang er een actieve gesprekskoppeling is; verouderde persistente sessies zonder actieve koppeling worden gesloten zodat ze niet stilzwijgend kunnen worden hervat nadat de eigendomstaak klaar is of het taakrecord is verdwenen.
    - Gekoppelde vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de koppeling wordt gesloten, onscherp wordt gemaakt, wordt gereset of verloopt.
    - Gateway-opdrachten blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppeld ACP-harnas gestuurd.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de koppeling of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit OpenClaw-perspectief en verwijdert de koppeling. Een harnas kan nog steeds zijn eigen upstreamgeschiedenis behouden als het hervatten ondersteunt.
    - Inactieve runtime-workers komen in aanmerking voor opschoning na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijft beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die naar de **native Codex-Plugin**
    moeten routeren wanneer die is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel vervolgens deze."

    Native Codex-gesprekskoppeling is het standaardpad voor chatbesturing.
    OpenClaw-dynamische tools worden nog steeds uitgevoerd via OpenClaw, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native toolgebeurtenissen injecteert OpenClaw een native
    hook-relay per beurt, zodat Plugin-hooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex `PermissionRequest`-gebeurtenissen
    via OpenClaw-goedkeuringen kunnen routeren. Codex `Stop`-hooks worden
    doorgegeven aan OpenClaw `before_agent_finalize`, waar Plugins nog één
    modelpass kunnen aanvragen voordat Codex zijn antwoord afrondt. De relay
    blijft bewust conservatief: hij muteert geen Codex-native toolargumenten en
    herschrijft geen Codex-threadrecords. Gebruik expliciet ACP alleen wanneer
    je het ACP-runtime-/sessiemodel wilt. De ondersteuningsgrens voor ingebedde
    Codex is gedocumenteerd in het
    [Codex-harnas v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Spiekbriefje voor model-/provider-/runtime-selectie">
    - `openai-codex/*` — PI Codex OAuth-/abonnementsroute.
    - `openai/*` plus `agentRuntime.id: "codex"` — systeemeigen in app-server ingebedde Codex-runtime.
    - `/codex ...` — systeemeigen gespreksbesturing voor Codex.
    - `/acp ...` of `runtime: "acp"` — expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="Natuurlijke-taaltriggers voor ACP-routering">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en houd vervolgberichten daarna in diezelfde thread."
    - "Voer Codex uit via ACP in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, bepaalt de harness-`agentId`,
    bindt waar ondersteund aan het huidige gesprek of de huidige thread, en
    routeert vervolgberichten naar die sessie tot sluiten/verlopen. Codex
    volgt dit pad alleen wanneer ACP/acpx expliciet is of wanneer de
    systeemeigen Codex-Plugin niet beschikbaar is voor de gevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen aangekondigd wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox zit en een ACP-runtimebackend
    is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratie-agent-id uit `agents_list` door tenzij die vermelding
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaardruntime voor sub-agents. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als onderliggend harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agents

Gebruik ACP wanneer je een externe harness-runtime wilt. Gebruik **systeemeigen Codex
app-server** voor gespreksbinding/-besturing van Codex wanneer de `codex`-Plugin
is ingeschakeld. Gebruik **sub-agents** wanneer je OpenClaw-systeemeigen
gedelegeerde runs wilt.

| Gebied        | ACP-sessie                            | Sub-agent-run                     |
| ------------- | ------------------------------------- | --------------------------------- |
| Runtime       | ACP-backend-Plugin (bijvoorbeeld acpx) | OpenClaw-systeemeigen sub-agent-runtime |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| Hoofdopdrachten | `/acp ...`                          | `/subagents ...`                  |
| Spawn-tool    | `sessions_spawn` met `runtime:"acp"`  | `sessions_spawn` (standaardruntime) |

Zie ook [Sub-agents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiebesturingsvlak.
2. Gebundelde `acpx`-runtime-Plugin.
3. Claude ACP-adapter.
4. Runtime-/sessiemechanismen aan Claude-zijde.

ACP Claude is een **harness-sessie** met ACP-besturing, sessiehervatting,
tracking van achtergrondtaken en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallbackruntimes — zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wil je `/acp spawn`, bindbare sessies, runtimebesturing of persistent harness-werk?** Gebruik ACP.
- **Wil je eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** — waar mensen blijven praten (Discord-kanaal, Telegram-onderwerp, iMessage-chat).
- **ACP-sessie** — de duurzame Codex/Claude/Gemini-runtime-status waar OpenClaw naartoe routeert.
- **Child thread/topic** — een optioneel extra berichtenoppervlak dat alleen wordt gemaakt door `--thread ...`.
- **Runtime-werkruimte** — de bestandssysteemlocatie (`cwd`, repo-checkout, backend-werkruimte) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Bindingen aan huidig gesprek

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie — geen child thread, hetzelfde chatoppervlak. OpenClaw blijft
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
    - `--bind here` werkt alleen op kanalen die binding aan het huidige gesprek aankondigen; OpenClaw retourneert anders een duidelijke niet-ondersteund-melding. Bindingen blijven behouden na Gateway-herstarts.
    - Op Discord is `spawnAcpSessions` alleen vereist wanneer OpenClaw een child thread moet maken voor `--thread auto|here` — niet voor `--bind here`.
    - Als je naar een andere ACP-agent spawnt zonder `--cwd`, erft OpenClaw standaard de werkruimte van de **doelagent**. Ontbrekende geërfde paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawn-fouten.
    - Gateway-beheeropdrachten blijven lokaal in gebonden gesprekken — `/acp ...`-opdrachten worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie routeert; `/status` en `/unfocus` blijven ook lokaal wanneer opdrachtafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Thread-gebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread routeren naar de gebonden ACP-sessie.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Unfocus/sluiten/archiveren/inactiviteitstime-out of verlopen door maximale leeftijd verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-opdrachten, geen prompts voor de ACP-harness.

    Vereiste featureflags voor thread-gebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (zet op `false` om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - ACP-thread-spawnflag van kanaaladapter ingeschakeld (adapterspecifiek):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Ondersteuning voor threadbinding is adapterspecifiek. Als de actieve
    kanaaladapter geen threadbindingen ondersteunt, retourneert OpenClaw een duidelijke
    niet-ondersteund-/niet-beschikbaar-melding.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingsmogelijkheden blootlegt.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/kanalen, **Telegram**-onderwerpen (forumonderwerpen in groepen/supergroepen en DM-onderwerpen).
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
- **Telegram-forumonderwerp:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles-DM/groep:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Geef de voorkeur aan `chat_id:*` of `chat_identifier:*` voor stabiele groepsbindingen.
- **iMessage-DM/groep:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Geef de voorkeur aan `chat_id:*` voor stabiele groepsbindingen.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  De id van de eigenaar-OpenClaw-agent.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionele ACP-override.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optioneel label voor operators.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionele runtime-werkmap.
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

**Override-volgorde voor ACP-gebonden sessies:**

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
- Berichten in dat kanaal of onderwerp routeren naar de geconfigureerde ACP-sessie.
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel op dezelfde plek.
- Tijdelijke runtimebindingen (bijvoorbeeld gemaakt door thread-focusflows) blijven van toepassing waar aanwezig.
- Voor cross-agent ACP-spawns zonder expliciete `cwd` erft OpenClaw de werkruimte van de doelagent uit de agentconfiguratie.
- Ontbrekende geërfde werkruimtepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsfouten verschijnen als spawn-fouten.

## ACP-sessies starten

Twee manieren om een ACP-sessie te starten:

<Tabs>
  <Tab title="Vanuit sessions_spawn">
    Gebruik `runtime: "acp"` om een ACP-sessie te starten vanuit een agent-turn of
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
    voor ACP-sessies. Als `agentId` is weggelaten, gebruikt OpenClaw
    `acp.defaultAgent` wanneer dit is geconfigureerd. `mode: "session"` vereist
    `thread: true` om een blijvend gebonden gesprek te behouden.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Gebruik `/acp spawn` voor expliciete operatorcontrole vanuit de chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Belangrijkste vlaggen:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Zie [Slash-opdrachten](/nl/tools/slash-commands).

  </Tab>
</Tabs>

### Parameters voor `sessions_spawn`

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
  Vraag threadbindingsflow aan waar ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is blijvend. Als `thread: true` en
  `mode` is weggelaten, kan OpenClaw standaard blijvend gedrag gebruiken per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde runtimewerkmap (gevalideerd door backend-/runtimebeleid).
  Als dit is weggelaten, erft ACP spawn de doelagentwerkruimte wanneer
  geconfigureerd; ontbrekende geërfde paden vallen terug op backendstandaarden,
  terwijl echte toegangsfouten worden geretourneerd.
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
  `"parent"` streamt initiële voortgangssamenvattingen van ACP-runs terug naar de
  aanvragersessie als systeemgebeurtenissen. Geaccepteerde antwoorden bevatten
  `streamLogPath` dat verwijst naar een sessiegebonden JSONL-logboek
  (`<sessionId>.acp-stream.jsonl`) dat je kunt volgen voor de volledige relaygeschiedenis.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Breekt de ACP-childbeurt af na N seconden. `0` houdt de beurt op het
  no-timeoutpad van de gateway. Dezelfde waarde wordt toegepast op de Gateway-run
  en ACP-runtime, zodat vastgelopen harnassen of harnassen met uitgeput quota
  de parentagentlane niet onbeperkt bezet houden.
</ParamField>
<ParamField path="model" type="string">
  Expliciete modeloverschrijving voor de ACP-childsessie. Codex ACP-spawns
  normaliseren OpenClaw Codex-referenties zoals `openai-codex/gpt-5.4` naar Codex
  ACP-opstartconfiguratie vóór `session/new`; slash-vormen zoals
  `openai-codex/gpt-5.4/high` stellen ook de redeneerinspanning van Codex ACP in.
  Andere harnassen moeten ACP `models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stil terug te vallen op de standaard van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` gekoppeld aan
  lage inspanning, worden `low`/`medium`/`high`/`xhigh` direct gekoppeld, en laat `off`
  de opstartoverschrijving voor redeneerinspanning weg.
</ParamField>

## Spawn-bindings- en threadmodi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                  |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek op zijn plaats; faal als er geen actief is. |
    | `off`  | Maak geen binding met het huidige gesprek.                              |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat Codex-ondersteund."
    - `--bind here` maakt geen childthread.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor binding aan het huidige gesprek bieden.
    - `--bind` en `--thread` kunnen niet in dezelfde `/acp spawn`-aanroep worden gecombineerd.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                              |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een childthread wanneer ondersteund. |
    | `here` | Vereis de huidige actieve thread; faal als je je niet in een thread bevindt.                        |
    | `off`  | Geen binding. Sessie start ongebonden.                                                              |

    Opmerkingen:

    - Op oppervlakken zonder threadbinding is het standaardgedrag effectief `off`.
    - Threadgebonden spawn vereist ondersteuning in het kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Gebruik `--bind here` wanneer je het huidige gesprek wilt vastzetten zonder een childthread te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten of parent-owned
achtergrondwerk zijn. Het leveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactieve sessies zijn bedoeld om te blijven praten op een zichtbaar chatoppervlak:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-onderwerp aan de ACP-sessie.
    - Blijvend geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden direct naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan datzelfde
    kanaal/thread/onderwerp.

    Wat OpenClaw naar het harnas stuurt:

    - Normale gebonden vervolgen worden verzonden als prompttekst, plus bijlagen alleen wanneer het harnas/de backend die ondersteunt.
    - `/acp`-beheeropdrachten en lokale Gateway-opdrachten worden onderschept vóór ACP-dispatch.
    - Runtimegegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agenten krijgen de interne runtime-contextenvelop van OpenClaw; externe ACP-harnassen krijgen een gewone prompt met het childresultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnassen worden gestuurd of als ACP-gebruikerstranscripttekst worden bewaard.
    - ACP-transcriptitems gebruiken de voor de gebruiker zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Eenmalige ACP-sessies die door een andere agentrun worden gespawnd, zijn achtergrondchildren, vergelijkbaar met subagenten:

    - De parent vraagt werk aan met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harnassessie.
    - Childbeurten draaien op dezelfde achtergrondlane die door native subagent-spawns wordt gebruikt, zodat een traag ACP-harnas niet ongerelateerd werk in de hoofdsessie blokkeert.
    - Voltooiing rapporteert terug via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om in een gewone ACP-prompt voordat die naar een extern harnas wordt gestuurd, zodat harnassen geen runtimecontextmarkeringen zien die alleen voor OpenClaw zijn.
    - De parent herschrijft het childresultaat in normale assistentstem wanneer een gebruikersgericht antwoord nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen parent
    en child. De child heeft al een voltooiingskanaal terug naar de
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kan na spawn een andere sessie targeten. Voor normale
    peersessies gebruikt OpenClaw een agent-naar-agent (A2A)-vervolgpad
    nadat het bericht is geïnjecteerd:

    - Wacht op het antwoord van de doelsessie.
    - Laat de aanvrager en het doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel om een aankondigingsbericht te produceren.
    - Lever die aankondiging af op het zichtbare kanaal of de zichtbare thread.

    Dat A2A-pad is een fallback voor peer sends waarbij de verzender een
    zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een ongerelateerde sessie
    een ACP-doel kan zien en berichten, bijvoorbeeld onder brede
    `tools.sessions.visibility`-instellingen.

    OpenClaw slaat het A2A-vervolg alleen over wanneer de aanvrager de
    parent is van zijn eigen parent-owned eenmalige ACP-child. In dat geval
    kan A2A bovenop taakvoltooiing de parent wekken met het resultaat van de
    child, het antwoord van de parent terugsturen naar de child, en
    een parent/child-echolus maken. Het `sessions_send`-resultaat rapporteert
    `delivery.status="skipped"` voor dat owned-child-geval, omdat het
    voltooiingspad al verantwoordelijk is voor het resultaat.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gebruik `resumeSessionId` om een eerdere ACP-sessie voort te zetten in plaats van
    opnieuw te beginnen. De agent speelt zijn gespreksgeschiedenis opnieuw af via
    `session/load`, zodat hij verdergaat met de volledige context van wat eraan voorafging.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Veelvoorkomende gebruikssituaties:

    - Draag een Codex-sessie over van je laptop naar je telefoon — vertel je agent dat hij moet verdergaan waar je was gebleven.
    - Zet een codeersessie voort die je interactief in de CLI bent gestart, nu headless via je agent.
    - Pak werk weer op dat werd onderbroken door een gateway-herstart of idle-time-out.

    Opmerkingen:

    - `resumeSessionId` is alleen van toepassing wanneer `runtime: "acp"`; de standaard subagentruntime negeert dit veld dat alleen voor ACP is.
    - `streamTo` is alleen van toepassing wanneer `runtime: "acp"`; de standaard subagentruntime negeert dit veld dat alleen voor ACP is.
    - `resumeSessionId` is een host-lokale ACP-/harnas-hervat-id, geen OpenClaw-kanaalsessiesleutel; OpenClaw controleert nog steeds ACP-spawnbeleid en doelagentbeleid vóór dispatch, terwijl de ACP-backend of het harnas eigenaar is van autorisatie voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` zijn nog steeds normaal van toepassing op de nieuwe OpenClaw-sessie die je maakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, faalt de spawn met een duidelijke fout — geen stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Voer na een gatewaydeploy een live end-to-endcontrole uit in plaats van
    op unittests te vertrouwen:

    1. Verifieer de gedeployde gatewayversie en commit op de doelhost.
    2. Open een tijdelijke ACPX-bridgesessie naar een live agent.
    3. Vraag die agent om `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifieer `accepted=yes`, een echte `childSessionKey`, en geen validatorfout.
    5. Ruim de tijdelijke bridgesessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over —
    threadgebonden `mode: "session"` en stream-relaypaden zijn afzonderlijke
    rijkere integratiepasses.

  </Accordion>
</AccordionGroup>

## Sandboxcompatibiliteit

ACP-sessies draaien momenteel op de hostruntime, **niet** binnen de
OpenClaw-sandbox.

<Warning>
**Beveiligingsgrens:**

- De externe harness kan lezen/schrijven volgens zijn eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw omhult ACP-harnessuitvoering **niet**.
- OpenClaw handhaaft nog steeds ACP-functiegates, toegestane agents, sessie-eigendom, kanaalbindingen en het Gateway-bezorgbeleid.
- Gebruik `runtime: "subagent"` voor sandbox-afgedwongen OpenClaw-native werk.

</Warning>

Huidige beperkingen:

- Als de aanvragersessie in een sandbox zit, worden ACP-spawns geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt geen `sandbox: "require"`.

## Sessiedoelresolutie

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Resolutievolgorde:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert sleutel
   - daarna UUID-vormige sessie-id
   - daarna label
2. Huidige threadbinding (als dit gesprek/deze thread is gebonden aan een ACP-sessie).
3. Terugval naar huidige aanvragersessie.

Bindingen voor het huidige gesprek en threadbindingen nemen beide deel aan
stap 2.

Als er geen doel kan worden opgelost, retourneert OpenClaw een duidelijke fout
(`Unable to resolve session target: ...`).

## ACP-besturingen

| Commando             | Wat het doet                                             | Voorbeeld                                                     |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maakt ACP-sessie; optionele huidige binding of threadbinding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleert lopende beurt voor doelsessie.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuurt steer-instructie naar actieve sessie.             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit sessie en ontbindt threaddoelen.                   | `/acp close`                                                  |
| `/acp status`        | Toont backend, modus, status, runtime-opties, capabilities. | `/acp status`                                                 |
| `/acp set-mode`      | Stelt runtime-modus voor doelsessie in.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Schrijft generieke runtime-configuratieoptie.            | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stelt override voor runtime-werkdirectory in.            | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stelt goedkeuringsbeleidsprofiel in.                     | `/acp permissions strict`                                     |
| `/acp timeout`       | Stelt runtime-time-out in (seconden).                    | `/acp timeout 120`                                            |
| `/acp model`         | Stelt runtime-modeloverride in.                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijdert overrides voor runtime-opties van de sessie.  | `/acp reset-options`                                          |
| `/acp sessions`      | Toont recente ACP-sessies uit de opslag.                 | `/acp sessions`                                               |
| `/acp doctor`        | Backendgezondheid, capabilities, uitvoerbare oplossingen. | `/acp doctor`                                                 |
| `/acp install`       | Print deterministische installatie- en inschakelstappen. | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus sessie-identificatoren op runtime- en
backendniveau. Fouten voor niet-ondersteunde besturing worden duidelijk getoond
wanneer een backend een capability mist. `/acp sessions` leest de
opslag voor de huidige gebonden sessie of aanvragersessie; doeltokens
(`session-key`, `session-id` of `session-label`) worden opgelost via
Gateway-sessieontdekking, inclusief aangepaste per-agent `session.store`-
roots.

### Mapping van runtime-opties

`/acp` heeft gemakscommando's en een generieke setter. Equivalente
bewerkingen:

| Commando                     | Komt overeen met                     | Opmerkingen                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | runtime-configuratiesleutel `model`  | Voor Codex ACP normaliseert OpenClaw `openai-codex/<model>` naar de adaptermodel-id en mapt slash-reasoningachtervoegsels zoals `openai-codex/gpt-5.4/high` naar `reasoning_effort`. |
| `/acp set thinking <level>`  | runtime-configuratiesleutel `thinking` | Voor Codex ACP stuurt OpenClaw de bijbehorende `reasoning_effort` waar de adapter er een ondersteunt.                                                                          |
| `/acp permissions <profile>` | runtime-configuratiesleutel `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | runtime-configuratiesleutel `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | runtime-cwd-override                 | Directe update.                                                                                                                                                               |
| `/acp set <key> <value>`     | generiek                             | `key=cwd` gebruikt het cwd-overridepad.                                                                                                                                       |
| `/acp reset-options`         | wist alle runtime-overrides          | —                                                                                                                                                                              |

## acpx-harness, Plugin-configuratie en machtigingen

Voor acpx-harnessconfiguratie (Claude Code / Codex / Gemini CLI-
aliassen), de plugin-tools- en OpenClaw-tools-MCP-bridges, en ACP-
machtigingsmodi, zie
[ACP-agents — configuratie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                    | Waarschijnlijke oorzaak                                                                                                | Oplossing                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld of wordt geblokkeerd door `plugins.allow`.                                  | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die allowlist is ingesteld en voer daarna `/acp doctor` uit.                       |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                         | Stel `acp.enabled=true` in.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken.             |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de allowlist.                                                                                     | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                        |
| `/acp doctor` meldt direct na het opstarten dat de backend niet gereed is   | De afhankelijkheidscontrole of zelfreparatie van de Plugin loopt nog.                                                 | Wacht kort en voer `/acp doctor` opnieuw uit; als deze ongezond blijft, inspecteer dan de backend-installatiefout en het allow/deny-beleid voor Plugins.                 |
| Harness-opdracht niet gevonden                                              | Adapter-CLI is niet geinstalleerd, gestagede Plugin-afhankelijkheden ontbreken, of eerste `npx`-fetch is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, repareer Plugin-afhankelijkheden, installeer/warm de adapter voor op de Gateway-host, of configureer de acpx-agentopdracht expliciet.            |
| Model-niet-gevonden vanuit de harness                                       | Model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                     | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness, of laat de override weg.                                                      |
| Vendor-authenticatiefout vanuit de harness                                  | OpenClaw is gezond, maar de doel-CLI/provider is niet aangemeld.                                                      | Meld je aan of geef de vereiste providersleutel op in de Gateway-hostomgeving.                                                                                           |
| `Unable to resolve session target: ...`                                     | Ongeldige key/id/label-token.                                                                                         | Voer `/acp sessions` uit, kopieer de exacte key/label en probeer het opnieuw.                                                                                            |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder actieve bindbare conversatie.                                                           | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of gebruik een ongebonden spawn.                                                                              |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist de ACP-bindingsmogelijkheid voor de huidige conversatie.                                                 | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer top-level `bindings[]`, of ga naar een ondersteund kanaal.                                            |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                    | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve bindingsdoel.                                                        | Bind opnieuw als eigenaar of gebruik een andere conversatie of thread.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist de mogelijkheid voor threadbinding.                                                                      | Gebruik `--thread off` of ga naar een ondersteunde adapter/kanaal.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-runtime draait aan de hostzijde; de aanvragende sessie is gesandboxed.                                            | Gebruik `runtime="subagent"` vanuit gesandboxede sessies, of voer ACP-spawn uit vanuit een niet-gesandboxede sessie.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP-runtime.                                                                     | Gebruik `runtime="subagent"` voor vereiste sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxede sessie.                                       |
| `Cannot apply --model ... did not advertise model support`                  | De doelharness stelt geen generieke ACP-modelwisseling beschikbaar.                                                   | Gebruik een harness die ACP `models`/`session/set_model` adverteert, gebruik Codex ACP-modelreferenties, of configureer het model rechtstreeks in de harness als deze een eigen opstartvlag heeft. |
| Ontbrekende ACP-metadata voor gebonden sessie                               | Verouderde/verwijderde ACP-sessiemetadata.                                                                            | Maak opnieuw aan met `/acp spawn` en bind/focus daarna de thread opnieuw.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijfacties/exec in een niet-interactieve ACP-sessie.                                   | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de gateway. Zie [Permissieconfiguratie](/nl/tools/acp-agents-setup#permission-configuration). |
| ACP-sessie faalt vroeg met weinig uitvoer                                   | Permissieprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                               | Controleer gatewaylogs op `AcpRuntimeError`. Stel voor volledige permissies `permissionMode=approve-all` in; stel voor nette degradatie `nonInteractivePermissions=deny` in. |
| ACP-sessie blijft oneindig hangen na voltooiing van werk                    | Harnessproces is voltooid, maar de ACP-sessie heeft geen voltooiing gemeld.                                          | Monitor met `ps aux \| grep acpx`; beeindig verouderde processen handmatig.                                                                                             |
| Harness ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne event-envelop is over de ACP-grens gelekt.                                                                    | Werk OpenClaw bij en voer de completion-flow opnieuw uit; externe harnesses mogen alleen gewone completion-prompts ontvangen.                                            |

## Gerelateerd

- [ACP-agents - installatie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Sandboxtools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (bridgemodus)](/nl/cli/acp)
- [Sub-agents](/nl/tools/subagents)
