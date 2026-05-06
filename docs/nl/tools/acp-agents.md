---
read_when:
    - Coderingsharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een berichtkanaalgesprek koppelen aan een persistente ACP-sessie
    - Problemen oplossen met de ACP-backend, Plugin-koppeling of voltooiingslevering
    - /acp-opdrachten uitvoeren vanuit de chat
sidebarTitle: ACP agents
summary: Voer externe codeerharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agenten
x-i18n:
    generated_at: "2026-05-06T09:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe coding-harnesses uitvoeren (bijvoorbeeld Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnesses) via een ACP-backend-Plugin.

Elke spawn van een ACP-sessie wordt gevolgd als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnesses, niet het standaardpad voor Codex.** De
native Codex-app-server-Plugin beheert `/codex ...`-besturingen en de
ingebedde runtime `agentRuntime.id: "codex"`; ACP beheert
`/acp ...`-besturingen en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code als externe MCP-client rechtstreeks
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina heb ik nodig?

| Je wilt…                                                                                        | Gebruik dit                           | Opmerkingen                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex in het huidige gesprek koppelen of beheren                                                | `/codex bind`, `/codex threads`       | Native Codex-app-serverpad wanneer de `codex`-Plugin is ingeschakeld; bevat gekoppelde chatantwoorden, afbeeldingsdoorsturen, model/fast/machtigingen, stoppen en bijsturen. ACP is een expliciete fallback |
| Claude Code, Gemini CLI, expliciete Codex ACP of een andere externe harness _via_ OpenClaw uitvoeren | Deze pagina                           | Chat-gekoppelde sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebesturingen                                                                            |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar stellen voor een editor of client       | [`openclaw acp`](/nl/cli/acp)            | Brugmodus. IDE/client spreekt ACP met OpenClaw via stdio/WebSocket                                                                                                                           |
| Een lokale AI-CLI hergebruiken als tekstmodel-fallback                                          | [CLI-backends](/nl/gateway/cli-backends) | Geen ACP. Geen OpenClaw-tools, geen ACP-besturingen, geen harness-runtime                                                                                                                    |

## Werkt dit direct?

Ja, na installatie van de officiële ACP-runtime-Plugin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Bron-checkouts kunnen de lokale workspace-Plugin `extensions/acpx` gebruiken na
`pnpm install`. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agents alleen over ACP-spawning wanneer ACP **echt
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld
zijn, de huidige sessie mag niet door de sandbox geblokkeerd zijn en er moet
een runtimebackend geladen zijn. Als niet aan die voorwaarden wordt voldaan,
blijven ACP-Plugin-Skills en ACP-richtlijnen voor `sessions_spawn` verborgen,
zodat de agent geen onbeschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Valkuilen bij de eerste run">
    - Als `plugins.allow` is ingesteld, is dit een beperkende Plugin-inventaris en **moet** deze `acpx` bevatten; anders wordt de geïnstalleerde ACP-backend bewust geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De Codex ACP-adapter wordt met de `acpx`-Plugin voorbereid en waar mogelijk lokaal gestart.
    - Andere doel-harness-adapters kunnen nog steeds op aanvraag met `npx` worden opgehaald wanneer je ze voor het eerst gebruikt.
    - Vendor-authenticatie moet nog steeds op de host aanwezig zijn voor die harness.
    - Als de host geen npm- of netwerktoegang heeft, mislukken adapterophalingen bij de eerste run totdat caches vooraf zijn opgewarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harness-proces. OpenClaw beheert routering,
    achtergrondtaakstatus, aflevering, bindingen en beleid; de harness
    beheert de provider-login, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer voordat je OpenClaw de schuld geeft:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - De harness-opdracht kan starten op de Gateway-host.
    - Provider-authenticatie is aanwezig voor die harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, enz.).
    - Het geselecteerde model bestaat voor die harness - model-id's zijn niet overdraagbaar tussen harnesses.
    - De aangevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend de standaardwaarde gebruiken.
    - De machtigingsmodus past bij het werk. Niet-interactieve sessies kunnen niet op native machtigingsprompts klikken, dus schrijf-/exec-intensieve coding-runs hebben meestal een ACPX-machtigingsprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-tools en ingebouwde OpenClaw-tools worden standaard **niet**
blootgesteld aan ACP-harnesses. Schakel de expliciete MCP-bruggen in
[ACP-agents - installatie](/nl/tools/acp-agents-setup) alleen in wanneer de harness
die tools rechtstreeks moet aanroepen.

## Ondersteunde harness-doelen

Met de `acpx`-backend gebruik je deze harness-id's als doelen voor `/acp spawn <id>`
of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harness-id | Typische backend                              | Opmerkingen                                                                        |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                      | Vereist Claude Code-authenticatie op de host.                                      |
| `codex`    | Codex ACP-adapter                            | Alleen expliciete ACP-fallback wanneer native `/codex` niet beschikbaar is of ACP wordt gevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                   | Vereist Copilot CLI/runtime-authenticatie.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)          | Overschrijf de acpx-opdracht als een lokale installatie een ander ACP-entrypoint blootstelt. |
| `droid`    | Factory Droid CLI                            | Vereist Factory/Droid-authenticatie of `FACTORY_API_KEY` in de harness-omgeving.   |
| `gemini`   | Gemini CLI ACP-adapter                       | Vereist Gemini CLI-authenticatie of API-sleutelconfiguratie.                       |
| `iflow`    | iFlow CLI                                    | Beschikbaarheid van adapters en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                | Beschikbaarheid van adapters en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                            | Vereist Kimi/Moonshot-authenticatie op de host.                                    |
| `kiro`     | Kiro CLI                                     | Beschikbaarheid van adapters en modelbesturing hangen af van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                         | Vereist OpenCode CLI/provider-authenticatie.                                       |
| `openclaw` | OpenClaw Gateway-brug via `openclaw acp`     | Laat een ACP-bewuste harness terugpraten naar een OpenClaw Gateway-sessie.         |
| `pi`       | Pi/ingebedde OpenClaw-runtime                | Gebruikt voor OpenClaw-native harness-experimenten.                                |
| `qwen`     | Qwen Code / Qwen CLI                         | Vereist Qwen-compatibele authenticatie op de host.                                 |

Aangepaste acpx-agentaliassen kunnen in acpx zelf worden geconfigureerd, maar
OpenClaw-beleid controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mappings vóór dispatch.

## Operator-runbook

Snelle `/acp`-flow vanuit chat:

<Steps>
  <Step title="Spawnen">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, of expliciet
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Werken">
    Ga verder in het gekoppelde gesprek of de gekoppelde thread (of richt je
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
  <Step title="Bijsturen">
    Zonder context te vervangen: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stoppen">
    `/acp cancel` (huidige beurt) of `/acp close` (sessie + bindingen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle-details">
    - Spawn maakt of hervat een ACP-runtime-sessie, registreert ACP-metadata in de OpenClaw-sessieopslag en kan een achtergrondtaak maken wanneer de run eigendom is van de parent.
    - ACP-sessies die eigendom zijn van de parent worden behandeld als achtergrondwerk, zelfs wanneer de runtime-sessie persistent is; voltooiing en levering over oppervlakken heen verlopen via de taaknotifier van de parent in plaats van zich te gedragen als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde eenmalige ACP-sessies die eigendom zijn van de parent. Persistente ACP-sessies blijven behouden zolang er een actieve gespreksbinding blijft bestaan; verlopen persistente sessies zonder actieve binding worden gesloten zodat ze niet stilzwijgend kunnen worden hervat nadat de eigenaars-taak klaar is of het taakrecord is verdwenen.
    - Gekoppelde vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de binding wordt gesloten, ontfocust, gereset of verlopen is.
    - Gateway-opdrachten blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gekoppelde ACP-harness verzonden.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de binding of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit het perspectief van OpenClaw en verwijdert de binding. Een harness kan nog steeds zijn eigen upstreamgeschiedenis bewaren als deze hervatten ondersteunt.
    - Inactieve runtime-workers komen in aanmerking voor opschoning na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijft beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die naar de **native Codex-Plugin**
    moeten routeren wanneer die is ingeschakeld:

    - "Koppel dit Discord-kanaal aan Codex."
    - "Koppel deze chat aan Codex-thread `<id>`."
    - "Toon Codex-threads en koppel daarna deze."

    Native Codex-gespreksbinding is het standaardpad voor chatbesturing.
    OpenClaw dynamische tools worden nog steeds via OpenClaw uitgevoerd,
    terwijl Codex-native tools zoals shell/apply-patch binnen Codex worden
    uitgevoerd. Voor Codex-native toolgebeurtenissen injecteert OpenClaw een
    native hook-relay per beurt, zodat Plugin-hooks `before_tool_call` kunnen
    blokkeren, `after_tool_call` kunnen observeren en Codex
    `PermissionRequest`-gebeurtenissen via OpenClaw-goedkeuringen kunnen
    routeren. Codex `Stop`-hooks worden doorgestuurd naar OpenClaw
    `before_agent_finalize`, waar Plugins nog één modelpass kunnen aanvragen
    voordat Codex het antwoord afrondt. De relay blijft bewust conservatief:
    deze muteert geen Codex-native toolargumenten en herschrijft geen
    Codex-threadrecords. Gebruik expliciete ACP alleen wanneer je het
    ACP-runtime-/sessiemodel wilt. De ondersteuningsgrens voor ingebedde
    Codex-ondersteuning is gedocumenteerd in het
    [Codex harness v1-ondersteuningscontract](/nl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Model-/provider-/runtimeselectie-spiekbrief">
    - `openai-codex/*` - PI Codex OAuth-/abonnementsroute.
    - `openai/*` plus `agentRuntime.id: "codex"` - native ingesloten runtime van de Codex-appserver.
    - `/codex ...` - native gespreksbesturing voor Codex.
    - `/acp ...` of `runtime: "acp"` - expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="ACP-routeringstriggers in natuurlijke taal">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread, en houd vervolgstappen daarna in diezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, lost de harness `agentId` op,
    bindt waar ondersteund aan het huidige gesprek of de huidige thread, en
    routeert vervolgstappen naar die sessie tot sluiting/verval. Codex
    volgt dit pad alleen wanneer ACP/acpx expliciet is of de native Codex
    Plugin niet beschikbaar is voor de gevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen geadverteerd wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox zit, en een ACP-runtime-
    backend is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratie-agent-id uit `agents_list` door tenzij die vermelding
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaardruntime voor subagenten. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als de onderliggende harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus subagenten

Gebruik ACP wanneer je een externe harness-runtime wilt. Gebruik **native Codex
appserver** voor gespreksbinding/-besturing van Codex wanneer de `codex`
Plugin is ingeschakeld. Gebruik **subagenten** wanneer je OpenClaw-native
gedelegeerde runs wilt.

| Gebied        | ACP-sessie                            | Subagent-run                       |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-backend-Plugin (bijvoorbeeld acpx) | OpenClaw-native subagent-runtime  |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hoofdcommando's | `/acp ...`                          | `/subagents ...`                   |
| Spawn-tool    | `sessions_spawn` met `runtime:"acp"`  | `sessions_spawn` (standaardruntime) |

Zie ook [Subagenten](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiecontrolplane.
2. Officiële `@openclaw/acpx`-runtime-Plugin.
3. Claude ACP-adapter.
4. Runtime-/sessiemachinerie aan Claude-zijde.

ACP Claude is een **harness-sessie** met ACP-besturing, sessiehervatting,
tracking van achtergrondtaken, en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallbackruntimes - zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wil je `/acp spawn`, bindbare sessies, runtimebesturing of persistent harness-werk?** Gebruik ACP.
- **Wil je eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** - waar mensen blijven praten (Discord-kanaal, Telegram-onderwerp, iMessage-chat).
- **ACP-sessie** - de duurzame Codex/Claude/Gemini-runtimestatus waar OpenClaw naar routeert.
- **Child-thread/onderwerp** - een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt gemaakt.
- **Runtime-werkruimte** - de bestandssysteemlocatie (`cwd`, repo-checkout, backendwerkruimte) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Bindingen aan huidig gesprek

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie - geen child-thread, hetzelfde chatoppervlak. OpenClaw blijft
transport, auth, veiligheid en levering beheren. Vervolgberichten in dat
gesprek routeren naar dezelfde sessie; `/new` en `/reset` resetten de
sessie ter plekke; `/acp close` verwijdert de binding.

Voorbeelden:

```text
/codex bind                                              # native Codex-bind, routeer toekomstige berichten hierheen
/codex model gpt-5.4                                     # stem de gebonden native Codex-thread af
/codex stop                                              # bestuur de actieve native Codex-beurt
/acp spawn codex --bind here                             # expliciete ACP-fallback voor Codex
/acp spawn codex --thread auto                           # kan een child-thread/onderwerp maken en daar binden
/acp spawn codex --bind here --cwd /workspace/repo       # dezelfde chatbinding, Codex draait in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Bindingsregels en exclusiviteit">
    - `--bind here` en `--thread ...` sluiten elkaar uit.
    - `--bind here` werkt alleen op kanalen die binding aan het huidige gesprek adverteren; anders retourneert OpenClaw een duidelijke melding dat dit niet wordt ondersteund. Bindingen blijven behouden na Gateway-herstarts.
    - Op Discord begrenst `spawnSessions` het maken van child-threads voor `--thread auto|here` - niet `--bind here`.
    - Als je naar een andere ACP-agent spawnt zonder `--cwd`, erft OpenClaw standaard de werkruimte van de **doelagent**. Ontbrekende geërfde paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawnfouten.
    - Gateway-beheercommando's blijven lokaal in gebonden gesprekken - `/acp ...`-commando's worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie routeert; `/status` en `/unfocus` blijven ook lokaal wanneer commandoafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Thread-gebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread routeren naar de gebonden ACP-sessie.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Unfocus/sluiten/archiveren/idle-timeout of max-age-verval verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-commando's, geen prompts voor de ACP-harness.

    Vereiste featureflags voor thread-gebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (stel `false` in om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - Spawns van thread-sessies via kanaaladapters ingeschakeld (standaard: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Ondersteuning voor threadbinding is adapterspecifiek. Als de actieve kanaal-
    adapter geen threadbindingen ondersteunt, retourneert OpenClaw een duidelijke
    melding dat dit niet wordt ondersteund/niet beschikbaar is.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingsmogelijkheden beschikbaar maakt.
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
  Optioneel operatorgericht label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionele runtimewerkdirectory.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionele backend-override.
</ParamField>

### Runtimestandaarden per agent

Gebruik `agents.list[].runtime` om ACP-standaarden eenmalig per agent te definiëren:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness-id, bijv. `codex` of `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Override-voorrang voor ACP-gebonden sessies:**

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
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel ter plekke.
- Tijdelijke runtimebindingen (bijvoorbeeld gemaakt door thread-focus-flows) blijven waar aanwezig van toepassing.
- Voor cross-agent ACP-spawns zonder expliciete `cwd` erft OpenClaw de doelagentwerkruimte uit de agentconfiguratie.
- Ontbrekende geërfde werkruimtepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsproblemen verschijnen als spawnfouten.

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
  Initiële prompt die naar de ACP-sessie wordt verzonden.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Moet `"acp"` zijn voor ACP-sessies.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-doelharness-id. Valt terug op `acp.defaultAgent` als dit is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag threadbindingsflow aan waar ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is blijvend. Als `thread: true` en
  `mode` wordt weggelaten, kan OpenClaw standaard blijvend gedrag gebruiken per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Aangevraagde runtimewerkmap (gevalideerd door backend/runtimebeleid).
  Als dit wordt weggelaten, erft ACP spawn de werkruimte van de doelagent
  wanneer geconfigureerd; ontbrekende geërfde paden vallen terug op backend-
  standaardwaarden, terwijl echte toegangsfouten worden geretourneerd.
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
  `"parent"` streamt initiële ACP-runvoortgangssamenvattingen terug naar de
  aanvragersessie als systeemgebeurtenissen. Geaccepteerde antwoorden bevatten
  `streamLogPath` dat verwijst naar een sessiegebonden JSONL-log
  (`<sessionId>.acp-stream.jsonl`) die je kunt tailen voor de volledige relaygeschiedenis.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Breekt de ACP-childturn af na N seconden. `0` houdt de turn op het
  no-timeoutpad van de Gateway. Dezelfde waarde wordt toegepast op de Gateway-
  run en ACP-runtime zodat vastgelopen of quotum-uitgeputte harnesses de
  parentagentlane niet onbeperkt bezet houden.
</ParamField>
<ParamField path="model" type="string">
  Expliciete model-override voor de ACP-childsessie. Codex ACP-spawns
  normaliseren OpenClaw Codex-verwijzingen zoals `openai-codex/gpt-5.4` naar Codex
  ACP-opstartconfiguratie vóór `session/new`; slash-vormen zoals
  `openai-codex/gpt-5.4/high` stellen ook Codex ACP-redeneerinspanning in.
  Andere harnesses moeten ACP `models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stil terug te vallen op de standaardwaarde van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` gemapt naar
  lage inspanning, worden `low`/`medium`/`high`/`xhigh` direct gemapt, en laat `off`
  de opstart-override voor redeneerinspanning weg.
</ParamField>

## Spawn-bindings- en threadmodi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bind het huidige actieve gesprek op zijn plaats; faal als er geen actief is. |
    | `off`  | Maak geen huidige-gespreksbinding aan.                                 |

    Opmerkingen:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat Codex-ondersteund."
    - `--bind here` maakt geen childthread aan.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor huidige-gespreksbinding bieden.
    - `--bind` en `--thread` kunnen niet worden gecombineerd in dezelfde `/acp spawn`-aanroep.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                              |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een childthread wanneer ondersteund. |
    | `here` | Vereis de huidige actieve thread; faal als je je niet in een thread bevindt.                         |
    | `off`  | Geen binding. Sessie start ongebonden.                                                              |

    Opmerkingen:

    - Op oppervlakken zonder threadbinding is het standaardgedrag effectief `off`.
    - Threadgebonden spawn vereist ondersteuning in kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Gebruik `--bind here` wanneer je het huidige gesprek wilt vastzetten zonder een childthread te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten of parent-eigendom
achtergrondwerk zijn. Het leveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactieve sessies zijn bedoeld om te blijven praten op een zichtbaar chatoppervlak:

    - `/acp spawn ... --bind here` bindt het huidige gesprek aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-onderwerp aan de ACP-sessie.
    - Blijvend geconfigureerde `bindings[].type="acp"` routeren overeenkomende gesprekken naar dezelfde ACP-sessie.

    Vervolgberichten in het gebonden gesprek worden rechtstreeks naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan datzelfde
    kanaal/thread/onderwerp.

    Wat OpenClaw naar de harness verzendt:

    - Normale gebonden vervolgberichten worden verzonden als prompttekst, plus bijlagen alleen wanneer de harness/backend die ondersteunt.
    - `/acp`-beheeropdrachten en lokale Gateway-opdrachten worden onderschept vóór ACP-dispatch.
    - Door runtime gegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agenten krijgen OpenClaw's interne runtime-contextenvelop; externe ACP-harnesses krijgen een gewone prompt met het childresultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnesses worden verzonden of als ACP-gebruikerstranscripttekst worden opgeslagen.
    - ACP-transcriptvermeldingen gebruiken de gebruiker-zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Eenmalige ACP-sessies die door een andere agentrun worden gespawnd zijn achtergrond-
    children, vergelijkbaar met subagenten:

    - De parent vraagt om werk met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harnesssessie.
    - Childturns draaien op dezelfde achtergrondlane die wordt gebruikt door native subagentspawns, zodat een trage ACP-harness ongerelateerd hoofdsessiewerk niet blokkeert.
    - Voltooiing rapporteert terug via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om naar een gewone ACP-prompt voordat die naar een externe harness wordt verzonden, zodat harnesses geen runtimecontextmarkeringen zien die alleen voor OpenClaw zijn.
    - De parent herschrijft het childresultaat in normale assistentstem wanneer een gebruikergericht antwoord nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen parent
    en child. De child heeft al een voltooiingskanaal terug naar de
    parent.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` kan na spawn een andere sessie targeten. Voor normale
    peersessies gebruikt OpenClaw een agent-naar-agent (A2A)-vervolgpad
    nadat het bericht is geïnjecteerd:

    - Wacht op het antwoord van de doelsessie.
    - Laat aanvrager en doel optioneel een begrensd aantal vervolgturns uitwisselen.
    - Vraag het doel een aankondigingsbericht te produceren.
    - Lever die aankondiging aan het zichtbare kanaal of de zichtbare thread.

    Dat A2A-pad is een fallback voor peer sends waarbij de afzender een
    zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een ongerelateerde sessie
    een ACP-doel kan zien en berichten kan sturen, bijvoorbeeld onder brede
    `tools.sessions.visibility`-instellingen.

    OpenClaw slaat het A2A-vervolg alleen over wanneer de aanvrager de
    parent is van zijn eigen parent-eigendom eenmalige ACP-child. In dat geval
    kan A2A bovenop taakvoltooiing draaien de parent wekken met het
    childresultaat, het antwoord van de parent terugsturen naar de child, en
    een parent/child-echo-loop maken. Het `sessions_send`-resultaat rapporteert
    `delivery.status="skipped"` voor dat geval met een eigendom-child omdat het
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

    - Draag een Codex-sessie over van je laptop naar je telefoon - zeg je agent dat hij verder moet gaan waar je was gebleven.
    - Zet een codesessie voort die je interactief in de CLI bent begonnen, nu headless via je agent.
    - Pak werk weer op dat werd onderbroken door een Gateway-herstart of idle-time-out.

    Opmerkingen:

    - `resumeSessionId` is alleen van toepassing wanneer `runtime: "acp"`; de standaard subagentruntime negeert dit veld dat alleen voor ACP is.
    - `streamTo` is alleen van toepassing wanneer `runtime: "acp"`; de standaard subagentruntime negeert dit veld dat alleen voor ACP is.
    - `resumeSessionId` is een hostlokale ACP/harness-hervat-id, geen OpenClaw-kanaalsessiesleutel; OpenClaw controleert nog steeds ACP-spawnbeleid en doelagentbeleid vóór dispatch, terwijl de ACP-backend of harness eigenaar is van autorisatie voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-gespreksgeschiedenis; `thread` en `mode` blijven normaal van toepassing op de nieuwe OpenClaw-sessie die je maakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, faalt de spawn met een duidelijke fout - geen stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Voer na een gatewaydeploy een live end-to-endcontrole uit in plaats van
    op unittests te vertrouwen:

    1. Verifieer de gedeployde gatewayversie en commit op de doelhost.
    2. Open een tijdelijke ACPX-bridgesessie naar een live agent.
    3. Vraag die agent `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifieer `accepted=yes`, een echte `childSessionKey`, en geen validatorfout.
    5. Ruim de tijdelijke bridgesessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over -
    threadgebonden `mode: "session"` en stream-relaypaden zijn afzonderlijke
    rijkere integratiepasses.

  </Accordion>
</AccordionGroup>

## Sandboxcompatibiliteit

ACP-sessies draaien momenteel op de hostruntime, **niet** binnen de
OpenClaw-sandbox.

<Warning>
**Beveiligingsgrens:**

- Het externe harnas kan lezen/schrijven volgens zijn eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw omhult ACP-harnasuitvoering **niet**.
- OpenClaw handhaaft nog steeds ACP-functiegates, toegestane agents, sessie-eigenaarschap, kanaalbindingen en Gateway-afleveringsbeleid.
- Gebruik `runtime: "subagent"` voor door sandbox afgedwongen OpenClaw-native werk.

</Warning>

Huidige beperkingen:

- Als de aanvragerssessie in een sandbox draait, worden ACP-spawns geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt `sandbox: "require"` niet.

## Doelsessie oplossen

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Oplosvolgorde:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert sleutel
   - daarna UUID-vormige sessie-id
   - daarna label
2. Huidige threadbinding (als dit gesprek/deze thread aan een ACP-sessie is gebonden).
3. Terugval naar huidige aanvragerssessie.

Bindingen van het huidige gesprek en threadbindingen doen beide mee aan
stap 2.

Als geen doel wordt opgelost, retourneert OpenClaw een duidelijke fout
(`Unable to resolve session target: ...`).

## ACP-bediening

| Opdracht             | Wat deze doet                                            | Voorbeeld                                                     |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP-sessie maken; optioneel huidige binding of threadbinding. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Lopende beurt voor doelsessie annuleren.                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuurinstructie naar draaiende sessie verzenden.         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sessie sluiten en threaddoelen ontkoppelen.              | `/acp close`                                                  |
| `/acp status`        | Backend, modus, status, runtime-opties en mogelijkheden tonen. | `/acp status`                                                 |
| `/acp set-mode`      | Runtime-modus voor doelsessie instellen.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Algemene runtime-configuratieoptie schrijven.            | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Runtime-overschrijving van werkmap instellen.            | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Profiel voor goedkeuringsbeleid instellen.               | `/acp permissions strict`                                     |
| `/acp timeout`       | Runtime-time-out instellen (seconden).                   | `/acp timeout 120`                                            |
| `/acp model`         | Runtime-modeloverschrijving instellen.                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Overschrijvingen van runtime-opties voor sessie verwijderen. | `/acp reset-options`                                          |
| `/acp sessions`      | Recente ACP-sessies uit opslag tonen.                    | `/acp sessions`                                               |
| `/acp doctor`        | Backendgezondheid, mogelijkheden, uitvoerbare oplossingen. | `/acp doctor`                                                 |
| `/acp install`       | Deterministische installatie- en inschakelstappen afdrukken. | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus sessie-identificatoren op runtime- en
backendniveau. Fouten voor niet-ondersteunde bediening verschijnen
duidelijk wanneer een backend een mogelijkheid mist. `/acp sessions` leest de
opslag voor de huidige gebonden of aanvragerssessie; doeltokens
(`session-key`, `session-id` of `session-label`) worden opgelost via
gateway-sessiedetectie, inclusief aangepaste per-agent `session.store`-
roots.

### Toewijzing van runtime-opties

`/acp` heeft gemaksopdrachten en een algemene setter. Equivalent
bewerkingen:

| Opdracht                     | Wordt toegewezen aan                | Opmerkingen                                                                                                                                                                  |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime-configuratiesleutel `model` | Voor Codex ACP normaliseert OpenClaw `openai-codex/<model>` naar de adaptermodel-id en wijst slash-redeneringssuffixen zoals `openai-codex/gpt-5.4/high` toe aan `reasoning_effort`. |
| `/acp set thinking <level>`  | runtime-configuratiesleutel `thinking` | Voor Codex ACP verzendt OpenClaw de bijbehorende `reasoning_effort` waar de adapter er een ondersteunt.                                                                      |
| `/acp permissions <profile>` | runtime-configuratiesleutel `approval_policy` | -                                                                                                                                                                            |
| `/acp timeout <seconds>`     | runtime-configuratiesleutel `timeout` | -                                                                                                                                                                            |
| `/acp cwd <path>`            | runtime-cwd-overschrijving          | Directe update.                                                                                                                                                              |
| `/acp set <key> <value>`     | algemeen                            | `key=cwd` gebruikt het pad voor cwd-overschrijving.                                                                                                                          |
| `/acp reset-options`         | wist alle runtime-overschrijvingen  | -                                                                                                                                                                            |

## acpx-harnas, Plugin-configuratie en machtigingen

Voor acpx-harnasconfiguratie (Claude Code / Codex / Gemini CLI-
aliassen), de MCP-bruggen plugin-tools en OpenClaw-tools, en ACP-
machtigingsmodi, zie
[ACP-agents - configuratie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                     | Waarschijnlijke oorzaak                                                                                                           | Oplossing                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld of wordt geblokkeerd door `plugins.allow`.                                                       | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die toelatingslijst is ingesteld, en voer daarna `/acp doctor` uit.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                                 | Stel `acp.enabled=true` in.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                               | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de toelatingslijst.                                                                                                | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                                     |
| `/acp doctor` meldt dat de backend direct na het opstarten niet gereed is                 | Backend-Plugin ontbreekt, is uitgeschakeld, wordt geblokkeerd door toelatings-/weigeringsbeleid, of het geconfigureerde uitvoerbare bestand is niet beschikbaar.        | Installeer/schakel de backend-Plugin in, voer `/acp doctor` opnieuw uit en inspecteer de backendinstallatie of beleidsfout als deze ongezond blijft.                                           |
| Harnasopdracht niet gevonden                                                   | Adapter-CLI is niet geïnstalleerd, de externe Plugin ontbreekt, of de eerste `npx`-ophaling is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, installeer/warm de adapter vooraf op de Gateway-host op, of configureer de acpx-agentopdracht expliciet.                                                      |
| Model-niet-gevonden vanuit het harnas                                            | Model-id is geldig voor een andere provider/harnas, maar niet voor dit ACP-doel.                                                | Gebruik een model dat door dat harnas wordt vermeld, configureer het model in het harnas, of laat de overschrijving weg.                                                                            |
| Leveranciersauthenticatiefout vanuit het harnas                                          | OpenClaw is gezond, maar de doel-CLI/provider is niet ingelogd.                                                     | Log in of geef de vereiste providersleutel op in de Gateway-hostomgeving.                                                                                             |
| `Unable to resolve session target: ...`                                     | Ongeldig sleutel-/id-/labeltoken.                                                                                                | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label en probeer het opnieuw.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder een actief koppelbaar gesprek.                                                            | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of gebruik een ongebonden spawn.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist ACP-koppelingsmogelijkheid voor het huidige gesprek.                                                             | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer top-level `bindings[]`, of ga naar een ondersteund kanaal.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                         | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve koppelingsdoel.                                                                           | Koppel opnieuw als eigenaar of gebruik een ander gesprek of een andere thread.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist threadkoppelingsmogelijkheid.                                                                               | Gebruik `--thread off` of ga naar een ondersteunde adapter/ondersteund kanaal.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-runtime is host-side; de aanvraagsessie bevindt zich in een sandbox.                                                              | Gebruik `runtime="subagent"` vanuit sandboxsessies, of voer ACP-spawn uit vanuit een niet-gesandboxte sessie.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP-runtime.                                                                         | Gebruik `runtime="subagent"` voor verplichte sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxte sessie.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Het doelharnas biedt geen generieke ACP-modelwisseling.                                                        | Gebruik een harnas dat ACP `models`/`session/set_model` adverteert, gebruik Codex ACP-modelreferenties, of configureer het model direct in het harnas als het een eigen opstartvlag heeft. |
| Ontbrekende ACP-metadata voor gekoppelde sessie                                      | Verouderde/verwijderde ACP-sessiemetadata.                                                                                    | Maak opnieuw aan met `/acp spawn` en koppel/focus daarna de thread opnieuw.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijfbewerkingen/uitvoering in een niet-interactieve ACP-sessie.                                                    | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de gateway. Zie [Machtigingsconfiguratie](/nl/tools/acp-agents-setup#permission-configuration). |
| ACP-sessie faalt vroeg met weinig uitvoer                                  | Machtigingsprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                                        | Controleer gatewaylogboeken op `AcpRuntimeError`. Stel voor volledige machtigingen `permissionMode=approve-all` in; stel voor geleidelijke degradatie `nonInteractivePermissions=deny` in.        |
| ACP-sessie blijft onbeperkt hangen na voltooiing van werk                       | Harnasproces is voltooid, maar de ACP-sessie heeft geen voltooiing gemeld.                                                    | Monitor met `ps aux \| grep acpx`; beëindig verouderde processen handmatig.                                                                                                       |
| Harnas ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne gebeurtenisenvelop is over de ACP-grens gelekt.                                                                | Werk OpenClaw bij en voer de voltooiingsflow opnieuw uit; externe harnassen mogen alleen gewone voltooiingsprompts ontvangen.                                                          |

## Gerelateerd

- [ACP-agenten - installatie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Multi-agentsandboxtools](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (brugmodus)](/nl/cli/acp)
- [Subagenten](/nl/tools/subagents)
