---
read_when:
    - Codeharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een gesprek via een berichtenkanaal koppelen aan een persistente ACP-sessie
    - Problemen oplossen met ACP-back-end, Plugin-koppeling of levering van voltooiingen
    - /acp-opdrachten uitvoeren vanuit chat
sidebarTitle: ACP agents
summary: Voer externe codeeromgevingen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agenten
x-i18n:
    generated_at: "2026-05-02T11:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe coding-harnassen uitvoeren (bijvoorbeeld Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnassen) via een ACP-backendplugin.

Elke start van een ACP-sessie wordt bijgehouden als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnassen, niet het standaardpad voor Codex.** De
native Codex-appserverplugin beheert `/codex ...`-bediening en de
`agentRuntime.id: "codex"` ingebedde runtime; ACP beheert
`/acp ...`-bediening en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code als externe MCP-client rechtstreeks
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina wil ik?

| Je wilt…                                                                                       | Gebruik dit                           | Opmerkingen                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex koppelen of bedienen in het huidige gesprek                                              | `/codex bind`, `/codex threads`       | Native Codex-appserverpad wanneer de `codex`-plugin is ingeschakeld; omvat gekoppelde chatreacties, doorsturen van afbeeldingen, model/snel/permissions, stop- en stuurbediening. ACP is een expliciete fallback |
| Claude Code, Gemini CLI, expliciete Codex ACP of een ander extern harnas _via_ OpenClaw uitvoeren | Deze pagina                           | Chat-gekoppelde sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebediening                                                                              |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar maken voor een editor of client        | [`openclaw acp`](/nl/cli/acp)            | Brugmodus. IDE/client spreekt ACP met OpenClaw via stdio/WebSocket                                                                                                                           |
| Een lokale AI-CLI hergebruiken als tekst-only fallbackmodel                                    | [CLI-backends](/nl/gateway/cli-backends) | Niet ACP. Geen OpenClaw-tools, geen ACP-bediening, geen harnasruntime                                                                                                                        |

## Werkt dit direct?

Ja, na installatie van de officiële ACP-runtimeplugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Broncheckouts kunnen de lokale `extensions/acpx`-workspaceplugin gebruiken na
`pnpm install`. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agents alleen over ACP-spawning wanneer ACP **echt
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld
zijn, de huidige sessie mag niet door de sandbox geblokkeerd zijn en er moet
een runtimebackend geladen zijn. Als niet aan die voorwaarden is voldaan,
blijven ACP-pluginvaardigheden en `sessions_spawn`-ACP-begeleiding verborgen,
zodat de agent geen niet-beschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Valkuilen bij de eerste uitvoering">
    - Als `plugins.allow` is ingesteld, is dit een beperkende plugininventaris en **moet** deze `acpx` bevatten; anders wordt de geïnstalleerde ACP-backend bewust geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De Codex ACP-adapter wordt met de `acpx`-plugin klaargezet en lokaal gestart wanneer dat mogelijk is.
    - Andere doelharnasadapters kunnen nog steeds op aanvraag met `npx` worden opgehaald wanneer je ze voor het eerst gebruikt.
    - Vendor-auth moet nog steeds op de host bestaan voor dat harnas.
    - Als de host geen npm- of netwerktoegang heeft, mislukken adapterdownloads bij de eerste uitvoering totdat caches vooraf zijn opgewarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harnasproces. OpenClaw beheert routing,
    achtergrondtaakstatus, aflevering, koppelingen en beleid; het harnas
    beheert zijn providerlogin, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer het volgende voordat je OpenClaw als oorzaak aanwijst:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - De harnasopdracht kan starten op de Gateway-host.
    - Provider-auth is aanwezig voor dat harnas (`claude`, `codex`, `gemini`, `opencode`, `droid`, enzovoort).
    - Het geselecteerde model bestaat voor dat harnas — model-id's zijn niet overdraagbaar tussen harnassen.
    - De gevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend zijn standaardwaarde gebruiken.
    - De permissionmodus past bij het werk. Niet-interactieve sessies kunnen niet op native permissionprompts klikken, dus schrijf-/exec-intensieve codingruns hebben meestal een ACPX-permissionprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-plugintools en ingebouwde OpenClaw-tools worden standaard **niet**
beschikbaar gemaakt voor ACP-harnassen. Schakel de expliciete MCP-bruggen in
[ACP-agents — setup](/nl/tools/acp-agents-setup) alleen in wanneer het harnas
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnasdoelen

Met de `acpx`-backend gebruik je deze harnas-id's als doelen voor
`/acp spawn <id>` of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harnas-id | Typische backend                              | Opmerkingen                                                                         |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                       | Vereist Claude Code-auth op de host.                                                |
| `codex`    | Codex ACP-adapter                             | Alleen expliciete ACP-fallback wanneer native `/codex` niet beschikbaar is of ACP wordt gevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                    | Vereist Copilot CLI/runtime-auth.                                                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Overschrijf de acpx-opdracht als een lokale installatie een ander ACP-entrypoint beschikbaar maakt. |
| `droid`    | Factory Droid CLI                             | Vereist Factory/Droid-auth of `FACTORY_API_KEY` in de harnasomgeving.               |
| `gemini`   | Gemini CLI ACP-adapter                        | Vereist Gemini CLI-auth of configuratie van een API-sleutel.                        |
| `iflow`    | iFlow CLI                                     | Beschikbaarheid van adapters en modelbeheer zijn afhankelijk van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                 | Beschikbaarheid van adapters en modelbeheer zijn afhankelijk van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                             | Vereist Kimi/Moonshot-auth op de host.                                              |
| `kiro`     | Kiro CLI                                      | Beschikbaarheid van adapters en modelbeheer zijn afhankelijk van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                          | Vereist OpenCode CLI/provider-auth.                                                 |
| `openclaw` | OpenClaw Gateway-brug via `openclaw acp`      | Laat een ACP-bewust harnas terugpraten naar een OpenClaw Gateway-sessie.            |
| `pi`       | Pi/ingebedde OpenClaw-runtime                 | Gebruikt voor OpenClaw-native harnasexperimenten.                                   |
| `qwen`     | Qwen Code / Qwen CLI                          | Vereist Qwen-compatibele auth op de host.                                           |

Aangepaste acpx-agentaliasen kunnen in acpx zelf worden geconfigureerd, maar
OpenClaw-beleid controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mapping voordat dispatch plaatsvindt.

## Runbook voor operators

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
    - Spawn maakt of hervat een ACP-runtimesessie, registreert ACP-metadata in de OpenClaw-sessiestore en kan een achtergrondtaak maken wanneer de run parent-owned is.
    - Parent-owned ACP-sessies worden behandeld als achtergrondwerk, zelfs wanneer de runtimesessie persistent is; voltooiing en levering over surfaces heen lopen via de parent-taaknotifier in plaats van zich te gedragen als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde parent-owned eenmalige ACP-sessies. Persistente ACP-sessies blijven bewaard zolang er een actieve gesprekskoppeling bestaat; verouderde persistente sessies zonder actieve koppeling worden gesloten zodat ze niet stilzwijgend kunnen worden hervat nadat de eigenaarstaak klaar is of het taakrecord verdwenen is.
    - Gekoppelde vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de koppeling wordt gesloten, uit focus wordt gehaald, gereset of verloopt.
    - Gateway-opdrachten blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppeld ACP-harnas gestuurd.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de koppeling of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit het perspectief van OpenClaw en verwijdert de koppeling. Een harnas kan nog steeds zijn eigen upstreamgeschiedenis behouden als het hervatten ondersteunt.
    - Inactieve runtimeworkers komen in aanmerking voor opschoning na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijven beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die naar de **native Codex-plugin**
    moeten routeren wanneer die is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel daarna deze."

    Native Codex-gesprekskoppeling is het standaardpad voor chatbediening.
    Dynamische OpenClaw-tools worden nog steeds via OpenClaw uitgevoerd, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native tool-events injecteert OpenClaw per beurt een native
    hook-relay zodat pluginhooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex `PermissionRequest`-events
    via OpenClaw-goedkeuringen kunnen routeren. Codex `Stop`-hooks worden
    doorgegeven aan OpenClaw `before_agent_finalize`, waar plugins nog één
    modelpass kunnen aanvragen voordat Codex zijn antwoord afrondt. De relay
    blijft bewust conservatief: hij muteert geen Codex-native toolargumenten
    en herschrijft geen Codex-threadrecords. Gebruik expliciete ACP alleen
    wanneer je het ACP-runtime-/sessiemodel wilt. De ingebedde
    Codex-ondersteuningsgrens is gedocumenteerd in het
    [Codex-harnas v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Cheatsheet voor model-, provider- en runtimeselectie">
    - `openai-codex/*` — PI Codex OAuth-/abonnementsroute.
    - `openai/*` plus `agentRuntime.id: "codex"` — ingebedde runtime van de native Codex app-server.
    - `/codex ...` — native Codex gespreksbesturing.
    - `/acp ...` of `runtime: "acp"` — expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="ACP-routingtriggers in natuurlijke taal">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en houd vervolgstappen daarna in diezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, lost de harness-`agentId` op,
    bindt waar ondersteund aan het huidige gesprek of de huidige thread, en
    routeert vervolgstappen naar die sessie tot sluiting/verloop. Codex
    volgt dit pad alleen wanneer ACP/acpx expliciet is of de native Codex
    plugin niet beschikbaar is voor de gevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen aangekondigd wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox zit en er een ACP-runtime-
    backend is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratieagent-id uit `agents_list` door, tenzij die vermelding
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaard sub-agentruntime. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als de onderliggende harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agents

Gebruik ACP wanneer je een externe harness-runtime wilt. Gebruik **native Codex
app-server** voor Codex-gespreksbinding/-besturing wanneer de `codex`-
plugin is ingeschakeld. Gebruik **sub-agents** wanneer je OpenClaw-native
gedelegeerde uitvoeringen wilt.

| Gebied        | ACP-sessie                            | Sub-agentuitvoering               |
| ------------- | ------------------------------------- | --------------------------------- |
| Runtime       | ACP-backendplugin (bijvoorbeeld acpx) | OpenClaw-native sub-agentruntime  |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| Hoofdopdrachten | `/acp ...`                          | `/subagents ...`                  |
| Spawntool     | `sessions_spawn` met `runtime:"acp"`  | `sessions_spawn` (standaardruntime) |

Zie ook [Sub-agents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiebesturingsvlak.
2. Officiële `@openclaw/acpx`-runtimeplugin.
3. Claude ACP-adapter.
4. Claude-side runtime-/sessiemechanisme.

ACP Claude is een **harness-sessie** met ACP-besturing, sessiehervatting,
achtergrondtaaktracking en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallbackruntimes — zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wil je `/acp spawn`, bindbare sessies, runtimebesturing of persistent harnesswerk?** Gebruik ACP.
- **Wil je eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** — waar mensen blijven praten (Discord-kanaal, Telegram-onderwerp, iMessage-chat).
- **ACP-sessie** — de duurzame Codex/Claude/Gemini-runtimestatus waar OpenClaw naartoe routeert.
- **Onderliggende thread/onderwerp** — een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt aangemaakt.
- **Runtimewerkruimte** — de bestandssysteemlocatie (`cwd`, repo-checkout, backendwerkruimte) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Bindingen aan huidig gesprek

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie — geen onderliggende thread, hetzelfde chatoppervlak. OpenClaw blijft
transport, auth, veiligheid en aflevering beheren. Vervolgberichten in dat
gesprek routeren naar dezelfde sessie; `/new` en `/reset` resetten de
sessie op dezelfde plek; `/acp close` verwijdert de binding.

Voorbeelden:

```text
/codex bind                                              # native Codex-binding, routeer toekomstige berichten hierheen
/codex model gpt-5.4                                     # stem de gebonden native Codex-thread af
/codex stop                                              # bestuur de actieve native Codex-beurt
/acp spawn codex --bind here                             # expliciete ACP-fallback voor Codex
/acp spawn codex --thread auto                           # kan een onderliggende thread/onderwerp aanmaken en daar binden
/acp spawn codex --bind here --cwd /workspace/repo       # dezelfde chatbinding, Codex draait in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindingsregels en exclusiviteit">
    - `--bind here` en `--thread ...` sluiten elkaar uit.
    - `--bind here` werkt alleen op kanalen die binding aan het huidige gesprek aankondigen; OpenClaw retourneert anders een duidelijke melding dat dit niet wordt ondersteund. Bindingen blijven behouden bij gateway-herstarts.
    - Op Discord bepaalt `spawnSessions` het aanmaken van onderliggende threads voor `--thread auto|here` — niet voor `--bind here`.
    - Als je naar een andere ACP-agent spawnt zonder `--cwd`, neemt OpenClaw standaard de werkruimte van de **doelagent** over. Ontbrekende overgenomen paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawnfouten.
    - Gateway-beheeropdrachten blijven lokaal in gebonden gesprekken — `/acp ...`-opdrachten worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie routeert; `/status` en `/unfocus` blijven ook lokaal wanneer opdrachtafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Threadgebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread routeren naar de gebonden ACP-sessie.
    - ACP-uitvoer wordt terug afgeleverd in dezelfde thread.
    - Unfocus/sluiten/archiveren/idle-timeout of verloop door max-age verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-opdrachten, geen prompts voor de ACP-harness.

    Vereiste featureflags voor threadgebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (zet op `false` om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - Kanaaladapter-threadsessiespawns ingeschakeld (standaard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Ondersteuning voor threadbinding is adapterspecifiek. Als de actieve kanaaladapter
    geen threadbindingen ondersteunt, retourneert OpenClaw een duidelijke
    niet-ondersteund/niet-beschikbaar-melding.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingsmogelijkheden blootlegt.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/-kanalen, **Telegram**-onderwerpen (forumonderwerpen in groepen/supergroepen en DM-onderwerpen).
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
- **Telegram-forumonderwerp:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles-DM/groep:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Gebruik bij voorkeur `chat_id:*` of `chat_identifier:*` voor stabiele groepsbindingen.
- **iMessage-DM/groep:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Gebruik bij voorkeur `chat_id:*` voor stabiele groepsbindingen.

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

- OpenClaw zorgt ervoor dat de geconfigureerde ACP-sessie bestaat vóór gebruik.
- Berichten in dat kanaal of onderwerp routeren naar de geconfigureerde ACP-sessie.
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel op dezelfde plek.
- Tijdelijke runtimebindingen (bijvoorbeeld aangemaakt door thread-focusflows) blijven gelden waar aanwezig.
- Voor ACP-spawns tussen agents zonder expliciete `cwd` neemt OpenClaw de doelagentwerkruimte over uit de agentconfiguratie.
- Ontbrekende overgenomen werkruimtepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsfouten verschijnen als spawnfouten.

## ACP-sessies starten

Twee manieren om een ACP-sessie te starten:

<Tabs>
  <Tab title="Vanuit sessions_spawn">
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
    `runtime` staat standaard op `subagent`, dus stel `runtime: "acp"` expliciet in
    voor ACP-sessies. Als `agentId` wordt weggelaten, gebruikt OpenClaw
    `acp.defaultAgent` wanneer dit is geconfigureerd. `mode: "session"` vereist
    `thread: true` om een blijvend gebonden gesprek te behouden.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Gebruik `/acp spawn` voor expliciete operatorbesturing vanuit de chat.

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

    Zie [slash-opdrachten](/nl/tools/slash-commands).

  </Tab>
</Tabs>

### `sessions_spawn`-parameters

<ParamField path="task" type="string" required>
  Initiële prompt die naar de ACP-sessie wordt verzonden.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Moet `"acp"` zijn voor ACP-sessies.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-doelharness-id. Valt terug op `acp.defaultAgent` als dit is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag de thread-bindingsstroom aan waar dit wordt ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is persistent. Als `thread: true` is en
  `mode` wordt weggelaten, kan OpenClaw standaard persistent gedrag gebruiken per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde runtime-werkmap (gevalideerd door backend-/runtimebeleid).
  Indien weggelaten, erft ACP-spawn de werkruimte van de doelagent wanneer die
  is geconfigureerd; ontbrekende geërfde paden vallen terug op backendstandaarden,
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
  `"parent"` streamt voortgangssamenvattingen van de initiële ACP-run terug naar de
  aanvragende sessie als systeemgebeurtenissen. Geaccepteerde antwoorden bevatten
  `streamLogPath` dat verwijst naar een sessiegebonden JSONL-logboek
  (`<sessionId>.acp-stream.jsonl`) dat je kunt volgen voor de volledige relaygeschiedenis.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Breekt de ACP-childbeurt af na N seconden. `0` houdt de beurt op het
  no-timeoutpad van de Gateway. Dezelfde waarde wordt toegepast op de Gateway-run
  en de ACP-runtime, zodat vastgelopen of quotum-uitgeputte harnesses de
  parent-agentlane niet onbeperkt bezet houden.
</ParamField>
<ParamField path="model" type="string">
  Expliciete model-override voor de ACP-childsessie. Codex ACP-spawns
  normaliseren OpenClaw Codex-referenties zoals `openai-codex/gpt-5.4` naar Codex
  ACP-opstartconfiguratie vóór `session/new`; slash-vormen zoals
  `openai-codex/gpt-5.4/high` stellen ook de redeneerinspanning van Codex ACP in.
  Andere harnesses moeten ACP `models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stilzwijgend terug te vallen op de standaardwaarde van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` gekoppeld aan
  lage inspanning, worden `low`/`medium`/`high`/`xhigh` rechtstreeks gekoppeld, en laat `off`
  de opstart-override voor redeneerinspanning weg.
</ParamField>

## Spawn-bind- en thread-modi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                |
    | ------ | --------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek op zijn plaats; faal als er geen actief is. |
    | `off`  | Maak geen binding met het huidige gesprek.                            |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat Codex-backed."
    - `--bind here` maakt geen child-thread aan.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor binding met het huidige gesprek bieden.
    - `--bind` en `--thread` kunnen niet worden gecombineerd in dezelfde `/acp spawn`-aanroep.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                             |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een child-thread wanneer ondersteund. |
    | `here` | Vereis de huidige actieve thread; faal als die er niet is.                                         |
    | `off`  | Geen binding. Sessie start ongebonden.                                                            |

    Opmerkingen:

    - Op oppervlakken zonder thread-binding is standaardgedrag effectief `off`.
    - Thread-gebonden spawn vereist ondersteuning door kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gebruik `--bind here` wanneer je het huidige gesprek wilt vastzetten zonder een child-thread te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten zijn of achtergrondwerk dat eigendom is
van de parent. Het leveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactieve sessies zijn bedoeld om te blijven praten op een zichtbaar
    chatoppervlak:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-topic aan de ACP-sessie.
    - Persistent geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden rechtstreeks naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan hetzelfde
    kanaal/dezelfde thread/hetzelfde topic.

    Wat OpenClaw naar de harness verzendt:

    - Normale gebonden vervolgen worden verzonden als prompttekst, plus bijlagen alleen wanneer de harness/backend die ondersteunt.
    - `/acp`-beheeropdrachten en lokale Gateway-opdrachten worden onderschept vóór ACP-dispatch.
    - Door de runtime gegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agenten krijgen de interne runtime-contextenvelop van OpenClaw; externe ACP-harnesses krijgen een gewone prompt met het child-resultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnesses worden verzonden of worden bewaard als ACP-gebruikerstranscripttekst.
    - ACP-transcriptitems gebruiken de voor gebruikers zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Eenmalige ACP-sessies die door een andere agentrun zijn gespawnd, zijn
    achtergrondchildren, vergelijkbaar met subagenten:

    - De parent vraagt om werk met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harness-sessie.
    - Childbeurten draaien op dezelfde achtergrondlane die wordt gebruikt door native subagent-spawns, zodat een trage ACP-harness geen niet-gerelateerd werk in de hoofdsessie blokkeert.
    - Voltooiing wordt teruggemeld via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om in een gewone ACP-prompt voordat die naar een externe harness wordt verzonden, zodat harnesses geen runtime-contextmarkeringen zien die alleen voor OpenClaw zijn.
    - De parent herschrijft het child-resultaat in normale assistentstem wanneer een gebruikersgericht antwoord nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen parent
    en child. De child heeft al een voltooiingskanaal terug naar de
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kan na spawn een andere sessie targeten. Voor normale
    peersessies gebruikt OpenClaw een agent-to-agent (A2A)-vervolgpad
    nadat het bericht is geïnjecteerd:

    - Wacht op het antwoord van de doelsessie.
    - Laat de aanvrager en het doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel om een aankondigingsbericht te produceren.
    - Lever die aankondiging aan het zichtbare kanaal of de zichtbare thread.

    Dat A2A-pad is een fallback voor peer-sends waarbij de afzender een
    zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een
    niet-gerelateerde sessie een ACP-doel kan zien en berichten, bijvoorbeeld
    onder brede `tools.sessions.visibility`-instellingen.

    OpenClaw slaat het A2A-vervolg alleen over wanneer de aanvrager de
    parent is van zijn eigen eenmalige ACP-child die eigendom is van de parent. In dat geval kan
    A2A bovenop taakvoltooiing de parent wekken met het resultaat van de
    child, het antwoord van de parent terugsturen naar de child, en
    een echo-loop tussen parent en child creëren. Het `sessions_send`-resultaat meldt
    `delivery.status="skipped"` voor die owned-child-case omdat het
    voltooiingspad al verantwoordelijk is voor het resultaat.

  </Accordion>
  <Accordion title="Resume an existing session">
    Gebruik `resumeSessionId` om een eerdere ACP-sessie voort te zetten in plaats van
    opnieuw te beginnen. De agent speelt zijn gespreksgeschiedenis opnieuw af via
    `session/load`, zodat hij doorgaat met de volledige context van wat eraan voorafging.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Veelvoorkomende gebruiksscenario's:

    - Draag een Codex-sessie over van je laptop naar je telefoon — vertel je agent om verder te gaan waar je gebleven was.
    - Zet een codesessie voort die je interactief in de CLI bent gestart, nu headless via je agent.
    - Pak werk weer op dat is onderbroken door een gateway-herstart of idle-timeout.

    Opmerkingen:

    - `resumeSessionId` geldt alleen wanneer `runtime: "acp"`; de standaard subagent-runtime negeert dit veld dat alleen voor ACP is.
    - `streamTo` geldt alleen wanneer `runtime: "acp"`; de standaard subagent-runtime negeert dit veld dat alleen voor ACP is.
    - `resumeSessionId` is een host-lokale ACP-/harness-hervattings-id, geen OpenClaw-kanaalsessiesleutel; OpenClaw controleert nog steeds het ACP-spawnbeleid en het doelagentbeleid vóór dispatch, terwijl de ACP-backend of harness eigenaar is van autorisatie voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` gelden nog steeds normaal voor de nieuwe OpenClaw-sessie die je maakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, faalt de spawn met een duidelijke fout — geen stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Voer na een gateway-deploy een live end-to-endcontrole uit in plaats van
    te vertrouwen op unittests:

    1. Verifieer de gedeployde gatewayversie en commit op de doelhost.
    2. Open een tijdelijke ACPX-brugsessie naar een live agent.
    3. Vraag die agent om `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifieer `accepted=yes`, een echte `childSessionKey` en geen validatorfout.
    5. Ruim de tijdelijke brugsessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over —
    thread-gebonden `mode: "session"` en stream-relaypaden zijn afzonderlijke
    rijkere integratiepasses.

  </Accordion>
</AccordionGroup>

## Sandboxcompatibiliteit

ACP-sessies draaien momenteel op de host-runtime, **niet** binnen de
OpenClaw-sandbox.

<Warning>
**Beveiligingsgrens:**

- Het externe harnas kan lezen/schrijven volgens zijn eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw kapselt de uitvoering van het ACP-harnas **niet** in.
- OpenClaw handhaaft nog steeds ACP-functiegates, toegestane agents, sessie-eigendom, kanaalbindingen en het Gateway-afleveringsbeleid.
- Gebruik `runtime: "subagent"` voor sandbox-afgedwongen OpenClaw-native werk.

</Warning>

Huidige beperkingen:

- Als de aanvraagsessie in een sandbox draait, worden ACP-spawns geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt geen `sandbox: "require"`.

## Sessiedoelresolutie

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Resolutievolgorde:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert de sleutel
   - daarna een UUID-vormige sessie-id
   - daarna het label
2. Huidige threadbinding (als dit gesprek/deze thread aan een ACP-sessie is gebonden).
3. Terugval op de huidige aanvraagsessie.

Bindingen van het huidige gesprek en threadbindingen nemen beide deel aan
stap 2.

Als er geen doel wordt gevonden, retourneert OpenClaw een duidelijke fout
(`Unable to resolve session target: ...`).

## ACP-besturingen

| Opdracht             | Wat deze doet                                             | Voorbeeld                                                     |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maak ACP-sessie; optionele huidige binding of threadbinding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleer lopende beurt voor doelsessie.                   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuur stuurinstructie naar actieve sessie.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit sessie en maak threaddoelen los.                    | `/acp close`                                                  |
| `/acp status`        | Toon backend, modus, status, runtime-opties, mogelijkheden. | `/acp status`                                                 |
| `/acp set-mode`      | Stel runtime-modus in voor doelsessie.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Schrijf generieke runtime-configuratieoptie.              | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stel overschrijving van runtime-werkmap in.               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stel profiel voor goedkeuringsbeleid in.                  | `/acp permissions strict`                                     |
| `/acp timeout`       | Stel runtime-time-out in (seconden).                      | `/acp timeout 120`                                            |
| `/acp model`         | Stel overschrijving van runtime-model in.                 | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijder overschrijvingen van sessie-runtime-opties.     | `/acp reset-options`                                          |
| `/acp sessions`      | Toon recente ACP-sessies uit de opslag.                   | `/acp sessions`                                               |
| `/acp doctor`        | Backendstatus, mogelijkheden, uitvoerbare oplossingen.    | `/acp doctor`                                                 |
| `/acp install`       | Druk deterministische installatie- en inschakelstappen af. | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus runtime- en
backendniveau-sessie-identifiers. Fouten voor niet-ondersteunde besturingen
worden duidelijk weergegeven wanneer een backend een mogelijkheid mist. `/acp sessions` leest de
opslag voor de huidige gebonden of aanvraagsessie; doeltokens
(`session-key`, `session-id` of `session-label`) worden opgelost via
Gateway-sessiedetectie, inclusief aangepaste per-agent `session.store`
roots.

### Toewijzing van runtime-opties

`/acp` heeft gemaksopdrachten en een generieke setter. Gelijkwaardige
bewerkingen:

| Opdracht                     | Wijst toe aan                         | Opmerkingen                                                                                                                                                                   |
| ---------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime-configuratiesleutel `model`   | Voor Codex ACP normaliseert OpenClaw `openai-codex/<model>` naar de model-id van de adapter en wijst slash-redeneersuffixen zoals `openai-codex/gpt-5.4/high` toe aan `reasoning_effort`. |
| `/acp set thinking <level>`  | runtime-configuratiesleutel `thinking` | Voor Codex ACP verzendt OpenClaw de bijbehorende `reasoning_effort` waar de adapter die ondersteunt.                                                                          |
| `/acp permissions <profile>` | runtime-configuratiesleutel `approval_policy` | —                                                                                                                                                                             |
| `/acp timeout <seconds>`     | runtime-configuratiesleutel `timeout` | —                                                                                                                                                                             |
| `/acp cwd <path>`            | overschrijving van runtime-cwd        | Directe update.                                                                                                                                                              |
| `/acp set <key> <value>`     | generiek                              | `key=cwd` gebruikt het overschrijvingspad voor cwd.                                                                                                                           |
| `/acp reset-options`         | wist alle runtime-overschrijvingen    | —                                                                                                                                                                             |

## acpx-harnas, Plugin-installatie en machtigingen

Voor acpx-harnasconfiguratie (Claude Code / Codex / Gemini CLI
aliassen), de plugin-tools- en OpenClaw-tools-MCP-bruggen, en ACP
machtigingsmodi, zie
[ACP-agents — installatie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                   | Waarschijnlijke oorzaak                                                                                                 | Oplossing                                                                                                                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld, of wordt geblokkeerd door `plugins.allow`.                                  | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die allowlist is ingesteld, en voer daarna `/acp doctor` uit.                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                           | Stel `acp.enabled=true` in.                                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                   | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken.                         |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de allowlist.                                                                                        | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Backend-Plugin ontbreekt, is uitgeschakeld, wordt geblokkeerd door allow/deny-beleid, of het geconfigureerde uitvoerbare bestand is niet beschikbaar. | Installeer/schakel de backend-Plugin in, voer `/acp doctor` opnieuw uit, en inspecteer de backendinstallatie- of beleidsfout als deze ongezond blijft.                                |
| Harness command not found                                                   | Adapter-CLI is niet geïnstalleerd, de externe Plugin ontbreekt, of het ophalen via `npx` bij eerste gebruik is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, installeer/warm de adapter voor op de Gateway-host, of configureer de acpx-agentopdracht expliciet.                                                          |
| Model-not-found from the harness                                            | Model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                        | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness, of laat de override weg.                                                                   |
| Vendor auth error from the harness                                          | OpenClaw is gezond, maar de doel-CLI/provider is niet aangemeld.                                                         | Meld je aan of geef de vereiste providersleutel op in de omgeving van de Gateway-host.                                                                                                |
| `Unable to resolve session target: ...`                                     | Ongeldige sleutel/id/label-token.                                                                                        | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label, en probeer opnieuw.                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder een actief koppelbaar gesprek.                                                             | Ga naar de doelchat/het doelkanaal en probeer opnieuw, of gebruik unbound spawn.                                                                                                      |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist ACP-bindingsmogelijkheid voor het huidige gesprek.                                                          | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer `bindings[]` op topniveau, of ga naar een ondersteund kanaal.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                       | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve bindingsdoel.                                                           | Bind opnieuw als eigenaar of gebruik een ander gesprek of een andere thread.                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist threadbindingsmogelijkheid.                                                                                 | Gebruik `--thread off` of ga naar een ondersteunde adapter/kanaal.                                                                                                                    |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime draait op de host; de aanvragerssessie is gesandboxed.                                                       | Gebruik `runtime="subagent"` vanuit gesandboxede sessies, of voer ACP spawn uit vanuit een niet-gesandboxede sessie.                                                                  |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP runtime.                                                                        | Gebruik `runtime="subagent"` voor vereiste sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxede sessie.                                                    |
| `Cannot apply --model ... did not advertise model support`                  | De doel-harness biedt geen generieke ACP-modelwisseling aan.                                                             | Gebruik een harness die ACP `models`/`session/set_model` adverteert, gebruik Codex ACP-modelreferenties, of configureer het model rechtstreeks in de harness als die een eigen opstartvlag heeft. |
| Missing ACP metadata for bound session                                      | Verouderde/verwijderde ACP-sessiemetadata.                                                                               | Maak opnieuw aan met `/acp spawn` en bind/focus daarna de thread opnieuw.                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijfacties/exec in een niet-interactieve ACP-sessie.                                       | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de Gateway. Zie [Permissieconfiguratie](/nl/tools/acp-agents-setup#permission-configuration).        |
| ACP session fails early with little output                                  | Permissieprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                                   | Controleer Gateway-logboeken op `AcpRuntimeError`. Stel voor volledige permissies `permissionMode=approve-all` in; stel voor geleidelijke degradatie `nonInteractivePermissions=deny` in. |
| ACP session stalls indefinitely after completing work                       | Harness-proces is voltooid, maar de ACP-sessie heeft geen voltooiing gemeld.                                             | Monitor met `ps aux \| grep acpx`; beëindig verouderde processen handmatig.                                                                                                          |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne event-envelope is over de ACP-grens gelekt.                                                                      | Werk OpenClaw bij en voer de voltooiingsflow opnieuw uit; externe harnesses zouden alleen gewone voltooiingsprompts moeten ontvangen.                                                |

## Gerelateerd

- [ACP-agenten — configuratie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (bridge-modus)](/nl/cli/acp)
- [Subagenten](/nl/tools/subagents)
