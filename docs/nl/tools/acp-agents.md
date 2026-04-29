---
read_when:
    - Codeharnassen uitvoeren via ACP
    - Gespreksgebonden ACP-sessies instellen op berichtenkanalen
    - Een berichtkanaalgesprek koppelen aan een persistente ACP-sessie
    - Problemen oplossen met ACP-backend, Plugin-koppeling of levering van voltooiingen
    - Bediening van /acp-opdrachten vanuit chat
sidebarTitle: ACP agents
summary: Voer externe codeharnassen (Claude Code, Cursor, Gemini CLI, expliciete Codex ACP, OpenClaw ACP, OpenCode) uit via de ACP-backend
title: ACP-agenten
x-i18n:
    generated_at: "2026-04-29T23:21:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-sessies
laten OpenClaw externe codeerharnassen uitvoeren (bijvoorbeeld Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI en andere
ondersteunde ACPX-harnassen) via een ACP-backend-Plugin.

Elke gespawnde ACP-sessie wordt bijgehouden als een [achtergrondtaak](/nl/automation/tasks).

<Note>
**ACP is het pad voor externe harnassen, niet het standaardpad voor Codex.** De
native Codex-appserver-Plugin is eigenaar van `/codex ...`-besturing en de
ingebedde runtime `agentRuntime.id: "codex"`; ACP is eigenaar van
`/acp ...`-besturing en `sessions_spawn({ runtime: "acp" })`-sessies.

Als je wilt dat Codex of Claude Code als externe MCP-client rechtstreeks
verbinding maakt met bestaande OpenClaw-kanaalgesprekken, gebruik dan
[`openclaw mcp serve`](/nl/cli/mcp) in plaats van ACP.
</Note>

## Welke pagina heb ik nodig?

| Je wilt…                                                                                       | Gebruik dit                           | Opmerkingen                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex binden of besturen in het huidige gesprek                                                | `/codex bind`, `/codex threads`       | Native Codex-appserverpad wanneer de `codex`-Plugin is ingeschakeld; bevat gebonden chatantwoorden, doorsturen van afbeeldingen, model/fast/machtigingen, stoppen en bijsturen. ACP is een expliciete terugvaloptie |
| Claude Code, Gemini CLI, expliciete Codex ACP of een ander extern harnas _via_ OpenClaw uitvoeren | Deze pagina                           | Chatgebonden sessies, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, achtergrondtaken, runtimebesturing                                                                                |
| Een OpenClaw Gateway-sessie _als_ ACP-server beschikbaar maken voor een editor of client        | [`openclaw acp`](/nl/cli/acp)            | Brugmodus. IDE/client praat ACP met OpenClaw via stdio/WebSocket                                                                                                                             |
| Een lokale AI-CLI hergebruiken als tekst-only terugvalmodel                                    | [CLI-backends](/nl/gateway/cli-backends) | Geen ACP. Geen OpenClaw-tools, geen ACP-besturing, geen harnasruntime                                                                                                                        |

## Werkt dit direct na installatie?

Meestal wel. Nieuwe installaties leveren de gebundelde `acpx`-runtime-Plugin standaard ingeschakeld
met een Plugin-lokaal vastgezette `acpx`-binary die OpenClaw controleert
en bij het opstarten zelf repareert. Voer `/acp doctor` uit voor een gereedheidscontrole.

OpenClaw leert agents alleen over ACP-spawning wanneer ACP **daadwerkelijk
bruikbaar** is: ACP moet ingeschakeld zijn, dispatch mag niet uitgeschakeld zijn, de huidige
sessie mag niet door de sandbox worden geblokkeerd en er moet een runtimebackend zijn
geladen. Als niet aan die voorwaarden is voldaan, blijven ACP-Plugin-Skills en
`sessions_spawn`-ACP-richtlijnen verborgen, zodat de agent geen
niet-beschikbare backend voorstelt.

<AccordionGroup>
  <Accordion title="Valkuilen bij eerste gebruik">
    - Als `plugins.allow` is ingesteld, is dit een beperkende Plugin-inventaris en **moet** deze `acpx` bevatten; anders wordt de gebundelde standaard opzettelijk geblokkeerd en meldt `/acp doctor` de ontbrekende allowlist-vermelding.
    - De gebundelde Codex ACP-adapter wordt klaargezet met de `acpx`-Plugin en waar mogelijk lokaal gestart.
    - Andere doelharnasadapters kunnen nog steeds op aanvraag worden opgehaald met `npx` wanneer je ze voor het eerst gebruikt.
    - Vendor-authenticatie moet nog steeds op de host bestaan voor dat harnas.
    - Als de host geen npm of netwerktoegang heeft, mislukken adapterdownloads bij eerste gebruik totdat caches zijn voorverwarmd of de adapter op een andere manier is geïnstalleerd.

  </Accordion>
  <Accordion title="Runtimevereisten">
    ACP start een echt extern harnasproces. OpenClaw is eigenaar van routering,
    achtergrondtaakstatus, aflevering, bindingen en beleid; het harnas
    is eigenaar van zijn providerlogin, modelcatalogus, bestandssysteemgedrag en
    native tools.

    Controleer voordat je OpenClaw aanwijst:

    - `/acp doctor` meldt een ingeschakelde, gezonde backend.
    - De doel-id is toegestaan door `acp.allowedAgents` wanneer die allowlist is ingesteld.
    - De harnasopdracht kan starten op de Gateway-host.
    - Providerauthenticatie is aanwezig voor dat harnas (`claude`, `codex`, `gemini`, `opencode`, `droid`, enz.).
    - Het geselecteerde model bestaat voor dat harnas — model-id's zijn niet overdraagbaar tussen harnassen.
    - De gevraagde `cwd` bestaat en is toegankelijk, of laat `cwd` weg en laat de backend zijn standaard gebruiken.
    - De machtigingsmodus past bij het werk. Niet-interactieve sessies kunnen niet op native machtigingsprompts klikken, dus codeerruns met veel schrijven/uitvoeren hebben meestal een ACPX-machtigingsprofiel nodig dat headless kan doorgaan.

  </Accordion>
</AccordionGroup>

OpenClaw-Plugin-tools en ingebouwde OpenClaw-tools worden standaard **niet** beschikbaar gemaakt voor
ACP-harnassen. Schakel de expliciete MCP-bruggen in
[ACP-agents — installatie](/nl/tools/acp-agents-setup) alleen in wanneer het harnas
die tools rechtstreeks moet aanroepen.

## Ondersteunde harnasdoelen

Met de gebundelde `acpx`-backend gebruik je deze harnas-id's als doelen voor `/acp spawn <id>`
of `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Harnas-id | Typische backend                              | Opmerkingen                                                                        |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP-adapter                       | Vereist Claude Code-authenticatie op de host.                                      |
| `codex`    | Codex ACP-adapter                             | Alleen expliciete ACP-terugval wanneer native `/codex` niet beschikbaar is of ACP wordt gevraagd. |
| `copilot`  | GitHub Copilot ACP-adapter                    | Vereist Copilot CLI/runtime-authenticatie.                                         |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)           | Overschrijf de acpx-opdracht als een lokale installatie een ander ACP-entrypoint aanbiedt. |
| `droid`    | Factory Droid CLI                             | Vereist Factory/Droid-authenticatie of `FACTORY_API_KEY` in de harnassomgeving.    |
| `gemini`   | Gemini CLI ACP-adapter                        | Vereist Gemini CLI-authenticatie of API-sleutelconfiguratie.                       |
| `iflow`    | iFlow CLI                                     | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kilocode` | Kilo Code CLI                                 | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `kimi`     | Kimi/Moonshot CLI                             | Vereist Kimi/Moonshot-authenticatie op de host.                                    |
| `kiro`     | Kiro CLI                                      | Beschikbaarheid van de adapter en modelbesturing hangen af van de geïnstalleerde CLI. |
| `opencode` | OpenCode ACP-adapter                          | Vereist OpenCode CLI/provider-authenticatie.                                       |
| `openclaw` | OpenClaw Gateway-brug via `openclaw acp`      | Laat een ACP-bewust harnas terugpraten met een OpenClaw Gateway-sessie.            |
| `pi`       | Pi/ingebedde OpenClaw-runtime                 | Gebruikt voor OpenClaw-native harnasexperimenten.                                  |
| `qwen`     | Qwen Code / Qwen CLI                          | Vereist Qwen-compatibele authenticatie op de host.                                 |

Aangepaste acpx-agentaliases kunnen in acpx zelf worden geconfigureerd, maar OpenClaw-beleid
controleert nog steeds `acp.allowedAgents` en eventuele
`agents.list[].runtime.acp.agent`-mapping vóór dispatch.

## Operator-runbook

Snelle `/acp`-flow vanuit chat:

<Steps>
  <Step title="Spawnen">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, of expliciet
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Werken">
    Ga door in het gebonden gesprek of de thread (of richt je expliciet
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
    `/acp cancel` (huidige beurt) of `/acp close` (sessie + bindingen).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Levenscyclusdetails">
    - Spawnen maakt of hervat een ACP-runtimesessie, registreert ACP-metadata in de OpenClaw-sessieopslag en kan een achtergrondtaak maken wanneer de run eigendom is van de parent.
    - ACP-sessies die eigendom zijn van de parent worden behandeld als achtergrondwerk, zelfs wanneer de runtimesessie persistent is; voltooiing en aflevering over surfaces heen lopen via de parent-taakmelder in plaats van zich te gedragen als een normale gebruikersgerichte chatsessie.
    - Taakonderhoud sluit terminale of verweesde one-shot ACP-sessies die eigendom zijn van de parent. Persistente ACP-sessies blijven behouden zolang er een actieve gespreksbinding bestaat; verouderde persistente sessies zonder actieve binding worden gesloten zodat ze niet stilzwijgend kunnen worden hervat nadat de eigenaarstaak klaar is of het taakrecord verdwenen is.
    - Gebonden vervolgberichten gaan rechtstreeks naar de ACP-sessie totdat de binding wordt gesloten, de focus verliest, wordt gereset of verloopt.
    - Gateway-opdrachten blijven lokaal. `/acp ...`, `/status` en `/unfocus` worden nooit als normale prompttekst naar een gebonden ACP-harnas gestuurd.
    - `cancel` breekt de actieve beurt af wanneer de backend annulering ondersteunt; het verwijdert de binding of sessiemetadata niet.
    - `close` beëindigt de ACP-sessie vanuit het perspectief van OpenClaw en verwijdert de binding. Een harnas kan nog steeds zijn eigen upstreamgeschiedenis behouden als het hervatten ondersteunt.
    - Inactieve runtimeworkers komen in aanmerking voor opschoning na `acp.runtime.ttlMinutes`; opgeslagen sessiemetadata blijft beschikbaar voor `/acp sessions`.

  </Accordion>
  <Accordion title="Native Codex-routeringsregels">
    Triggers in natuurlijke taal die naar de **native Codex-Plugin**
    moeten routeren wanneer die is ingeschakeld:

    - "Bind this Discord channel to Codex."
    - "Attach this chat to Codex thread `<id>`."
    - "Show Codex threads, then bind this one."

    Native Codex-gespreksbinding is het standaardpad voor chatbesturing.
    Dynamische OpenClaw-tools worden nog steeds via OpenClaw uitgevoerd, terwijl
    Codex-native tools zoals shell/apply-patch binnen Codex worden uitgevoerd.
    Voor Codex-native toolgebeurtenissen injecteert OpenClaw een per-beurt native
    hook-relay zodat Plugin-hooks `before_tool_call` kunnen blokkeren,
    `after_tool_call` kunnen observeren en Codex `PermissionRequest`-gebeurtenissen
    via OpenClaw-goedkeuringen kunnen routeren. Codex `Stop`-hooks worden doorgestuurd naar
    OpenClaw `before_agent_finalize`, waar plugins nog één
    modelpass kunnen aanvragen voordat Codex zijn antwoord afrondt. De relay blijft
    bewust conservatief: hij wijzigt geen Codex-native toolargumenten
    en herschrijft geen Codex-threadrecords. Gebruik expliciete ACP alleen
    wanneer je het ACP-runtime-/sessiemodel wilt. De grens van ingebedde Codex-ondersteuning
    is gedocumenteerd in het
    [ondersteuningscontract voor Codex-harnas v1](/nl/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Spiekbrief voor model- / provider- / runtime-selectie">
    - `openai-codex/*` — PI Codex OAuth-/abonnementsroute.
    - `openai/*` plus `agentRuntime.id: "codex"` — native in de Codex app-server ingebedde runtime.
    - `/codex ...` — native Codex-gespreksbesturing.
    - `/acp ...` of `runtime: "acp"` — expliciete ACP/acpx-besturing.

  </Accordion>
  <Accordion title="Natuurlijke-taaltriggers voor ACP-routing">
    Triggers die naar de ACP-runtime moeten routeren:

    - "Voer dit uit als een eenmalige Claude Code ACP-sessie en vat het resultaat samen."
    - "Gebruik Gemini CLI voor deze taak in een thread en houd vervolgberichten daarna in diezelfde thread."
    - "Voer Codex via ACP uit in een achtergrondthread."

    OpenClaw kiest `runtime: "acp"`, lost de harness `agentId` op,
    bindt aan het huidige gesprek of de huidige thread wanneer dat wordt ondersteund, en
    routeert vervolgberichten naar die sessie tot sluiten/verlopen. Codex
    volgt dit pad alleen wanneer ACP/acpx expliciet is of de native Codex
    Plugin niet beschikbaar is voor de gevraagde bewerking.

    Voor `sessions_spawn` wordt `runtime: "acp"` alleen geadverteerd wanneer ACP
    is ingeschakeld, de aanvrager niet in een sandbox zit en er een ACP-runtime-
    backend is geladen. `acp.dispatch.enabled=false` pauzeert automatische
    ACP-threaddispatch, maar verbergt of blokkeert expliciete
    `sessions_spawn({ runtime: "acp" })`-aanroepen niet. Het richt zich op ACP-harness-id's zoals `codex`,
    `claude`, `droid`, `gemini` of `opencode`. Geef geen normale
    OpenClaw-configuratie-agent-id uit `agents_list` door, tenzij dat item
    expliciet is geconfigureerd met `agents.list[].runtime.type="acp"`;
    gebruik anders de standaard sub-agentruntime. Wanneer een OpenClaw-agent
    is geconfigureerd met `runtime.type="acp"`, gebruikt OpenClaw
    `runtime.acp.agent` als de onderliggende harness-id.

  </Accordion>
</AccordionGroup>

## ACP versus sub-agents

Gebruik ACP wanneer je een externe harness-runtime wilt. Gebruik **native Codex
app-server** voor Codex-gespreksbinding/-besturing wanneer de `codex`
Plugin is ingeschakeld. Gebruik **sub-agents** wanneer je OpenClaw-native
gedelegeerde runs wilt.

| Gebied        | ACP-sessie                            | Sub-agent-run                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP-backend-Plugin (bijvoorbeeld acpx) | OpenClaw-native sub-agentruntime  |
| Sessiesleutel | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Hoofdcommando's | `/acp ...`                          | `/subagents ...`                   |
| Spawntool     | `sessions_spawn` met `runtime:"acp"`  | `sessions_spawn` (standaardruntime) |

Zie ook [Sub-agents](/nl/tools/subagents).

## Hoe ACP Claude Code uitvoert

Voor Claude Code via ACP is de stack:

1. OpenClaw ACP-sessiecontrolplane.
2. Gebundelde `acpx`-runtime-Plugin.
3. Claude ACP-adapter.
4. Runtime-/sessiemachinerie aan Claude-zijde.

ACP Claude is een **harness-sessie** met ACP-besturing, sessiehervatting,
tracking van achtergrondtaken en optionele gespreks-/threadbinding.

CLI-backends zijn afzonderlijke tekst-only lokale fallbackruntimes — zie
[CLI-backends](/nl/gateway/cli-backends).

Voor operators is de praktische regel:

- **Wil je `/acp spawn`, bindbare sessies, runtimebesturing of blijvend harness-werk?** Gebruik ACP.
- **Wil je eenvoudige lokale tekstfallback via de ruwe CLI?** Gebruik CLI-backends.

## Gebonden sessies

### Mentaal model

- **Chatoppervlak** — waar mensen blijven praten (Discord-kanaal, Telegram-onderwerp, iMessage-chat).
- **ACP-sessie** — de duurzame runtime-status van Codex/Claude/Gemini waar OpenClaw naartoe routeert.
- **Child-thread/-onderwerp** — een optioneel extra berichtenoppervlak dat alleen door `--thread ...` wordt aangemaakt.
- **Runtime-workspace** — de bestandssysteemlocatie (`cwd`, repo-checkout, backend-workspace) waar de harness draait. Onafhankelijk van het chatoppervlak.

### Huidig-gesprekbindingen

`/acp spawn <harness> --bind here` pint het huidige gesprek vast aan de
gespawnde ACP-sessie — geen child-thread, hetzelfde chatoppervlak. OpenClaw blijft
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
    - `--bind here` werkt alleen op kanalen die huidig-gesprekbinding adverteren; OpenClaw retourneert anders een duidelijke melding dat dit niet wordt ondersteund. Bindingen blijven bestaan na gateway-herstarts.
    - Op Discord is `spawnAcpSessions` alleen vereist wanneer OpenClaw een child-thread moet aanmaken voor `--thread auto|here` — niet voor `--bind here`.
    - Als je naar een andere ACP-agent spawnt zonder `--cwd`, erft OpenClaw standaard de workspace van de **doelagent**. Ontbrekende geërfde paden (`ENOENT`/`ENOTDIR`) vallen terug op de backendstandaard; andere toegangsfouten (bijv. `EACCES`) verschijnen als spawnfouten.
    - Gateway-beheercommando's blijven lokaal in gebonden gesprekken — `/acp ...`-commando's worden door OpenClaw afgehandeld, zelfs wanneer normale vervolgtekst naar de gebonden ACP-sessie routeert; `/status` en `/unfocus` blijven ook lokaal wanneer commandoafhandeling voor dat oppervlak is ingeschakeld.

  </Accordion>
  <Accordion title="Thread-gebonden sessies">
    Wanneer threadbindingen zijn ingeschakeld voor een kanaaladapter:

    - OpenClaw bindt een thread aan een doel-ACP-sessie.
    - Vervolgberichten in die thread routeren naar de gebonden ACP-sessie.
    - ACP-uitvoer wordt teruggeleverd aan dezelfde thread.
    - Unfocus/sluiten/archiveren/inactiviteitstime-out of max-age-verloop verwijdert de binding.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` en `/unfocus` zijn Gateway-commando's, geen prompts aan de ACP-harness.

    Vereiste featureflags voor thread-gebonden ACP:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` staat standaard aan (zet op `false` om automatische ACP-threaddispatch te pauzeren; expliciete `sessions_spawn({ runtime: "acp" })`-aanroepen blijven werken).
    - ACP-thread-spawnflag van kanaaladapter ingeschakeld (adapterspecifiek):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Ondersteuning voor threadbinding is adapterspecifiek. Als de actieve kanaal-
    adapter geen threadbindingen ondersteunt, retourneert OpenClaw een duidelijke
    melding dat dit niet wordt ondersteund/beschikbaar is.

  </Accordion>
  <Accordion title="Kanalen met threadondersteuning">
    - Elke kanaaladapter die sessie-/threadbindingsmogelijkheden exposeert.
    - Huidige ingebouwde ondersteuning: **Discord**-threads/kanalen, **Telegram**-onderwerpen (forumonderwerpen in groepen/supergroepen en DM-onderwerpen).
    - Plugin-kanalen kunnen ondersteuning toevoegen via dezelfde bindingsinterface.

  </Accordion>
</AccordionGroup>

## Persistente kanaalbindingen

Configureer voor niet-ephemere workflows persistente ACP-bindingen in
toplevel `bindings[]`-items.

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
  De eigenaar OpenClaw-agent-id.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optionele ACP-override.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optioneel operatorgericht label.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optionele runtime-werkdirectory.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optionele backend-override.
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

- OpenClaw zorgt dat de geconfigureerde ACP-sessie bestaat vóór gebruik.
- Berichten in dat kanaal of onderwerp routeren naar de geconfigureerde ACP-sessie.
- In gebonden gesprekken resetten `/new` en `/reset` dezelfde ACP-sessiesleutel op dezelfde plek.
- Tijdelijke runtimebindingen (bijvoorbeeld aangemaakt door thread-focusflows) blijven gelden waar aanwezig.
- Voor cross-agent ACP-spawns zonder expliciete `cwd` erft OpenClaw de doelagent-workspace uit de agentconfiguratie.
- Ontbrekende geërfde workspacepaden vallen terug op de standaard-cwd van de backend; niet-ontbrekende toegangsfouten verschijnen als spawnfouten.

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
    `runtime` staat standaard op `subagent`, dus stel `runtime: "acp"` expliciet in
    voor ACP-sessies. Als `agentId` wordt weggelaten, gebruikt OpenClaw
    `acp.defaultAgent` wanneer dit is geconfigureerd. `mode: "session"` vereist
    `thread: true` om een blijvende gebonden conversatie te behouden.
    </Note>

  </Tab>
  <Tab title="Van /acp-opdracht">
    Gebruik `/acp spawn` voor expliciete bedieningscontrole vanuit chat.

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
  Eerste prompt die naar de ACP-sessie wordt verzonden.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Moet `"acp"` zijn voor ACP-sessies.
</ParamField>
<ParamField path="agentId" type="string">
  ACP-doelharness-id. Valt terug op `acp.defaultAgent` als dit is ingesteld.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Vraag threadbindingsstroom aan waar ondersteund.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` is eenmalig; `"session"` is persistent. Als `thread: true` is en
  `mode` wordt weggelaten, kan OpenClaw standaard persistent gedrag gebruiken per
  runtimepad. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Gevraagde runtime-werkmap (gevalideerd door backend-/runtimebeleid).
  Als dit wordt weggelaten, erft ACP-spawn de werkruimte van de doelagent
  wanneer geconfigureerd; ontbrekende geërfde paden vallen terug op
  backendstandaarden, terwijl echte toegangsfouten worden geretourneerd.
</ParamField>
<ParamField path="label" type="string">
  Label voor operators dat wordt gebruikt in sessie-/bannertekst.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Hervat een bestaande ACP-sessie in plaats van een nieuwe te maken. De
  agent speelt zijn conversatiegeschiedenis opnieuw af via `session/load`.
  Vereist `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` streamt eerste voortgangssamenvattingen van ACP-runs terug naar de
  aanvragersessie als systeemgebeurtenissen. Geaccepteerde antwoorden bevatten
  `streamLogPath` dat verwijst naar een sessiegebonden JSONL-log
  (`<sessionId>.acp-stream.jsonl`) die je kunt volgen voor de volledige relaygeschiedenis.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Breekt de ACP-childbeurt af na N seconden. `0` houdt de beurt op het
  geen-timeoutpad van de Gateway. Dezelfde waarde wordt toegepast op de Gateway-run
  en de ACP-runtime zodat vastgelopen harnesses of harnesses met verbruikt quotum
  de parent-agentlane niet onbeperkt bezet houden.
</ParamField>
<ParamField path="model" type="string">
  Expliciete modeloverschrijving voor de ACP-childsessie. Codex ACP-spawns
  normaliseren OpenClaw Codex-referenties zoals `openai-codex/gpt-5.4` naar Codex
  ACP-opstartconfiguratie vóór `session/new`; slash-vormen zoals
  `openai-codex/gpt-5.4/high` stellen ook de redeneerinspanning van Codex ACP in.
  Andere harnesses moeten ACP `models` adverteren en
  `session/set_model` ondersteunen; anders faalt OpenClaw/acpx duidelijk in plaats van
  stil terug te vallen op de standaard van de doelagent.
</ParamField>
<ParamField path="thinking" type="string">
  Expliciete denk-/redeneerinspanning. Voor Codex ACP wordt `minimal` gekoppeld aan
  lage inspanning, worden `low`/`medium`/`high`/`xhigh` rechtstreeks gekoppeld, en laat `off`
  de opstartoverschrijving voor redeneerinspanning weg.
</ParamField>

## Spawn-bindings- en threadmodi

<Tabs>
  <Tab title="--bind here|off">
    | Modus  | Gedrag                                                                 |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Bind de huidige actieve conversatie op zijn plaats; faal als er geen actief is. |
    | `off`  | Maak geen binding met de huidige conversatie.                          |

    Notities:

    - `--bind here` is het eenvoudigste operatorpad voor "maak dit kanaal of deze chat Codex-ondersteund."
    - `--bind here` maakt geen childthread.
    - `--bind here` is alleen beschikbaar op kanalen die ondersteuning voor huidige-conversatiebinding bieden.
    - `--bind` en `--thread` kunnen niet worden gecombineerd in dezelfde `/acp spawn`-aanroep.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Modus  | Gedrag                                                                                             |
    | ------ | -------------------------------------------------------------------------------------------------- |
    | `auto` | In een actieve thread: bind die thread. Buiten een thread: maak/bind een childthread wanneer ondersteund. |
    | `here` | Vereis huidige actieve thread; faal als je er niet in zit.                                         |
    | `off`  | Geen binding. Sessie start ongebonden.                                                            |

    Notities:

    - Op oppervlakken zonder threadbinding is standaardgedrag feitelijk `off`.
    - Threadgebonden spawn vereist ondersteuning door kanaalbeleid:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Gebruik `--bind here` wanneer je de huidige conversatie wilt vastzetten zonder een childthread te maken.

  </Tab>
</Tabs>

## Leveringsmodel

ACP-sessies kunnen interactieve werkruimten of door de parent beheerd
achtergrondwerk zijn. Het leveringspad hangt af van die vorm.

<AccordionGroup>
  <Accordion title="Interactieve ACP-sessies">
    Interactieve sessies zijn bedoeld om door te blijven praten op een zichtbaar chatoppervlak:

    - `/acp spawn ... --bind here` bindt de huidige conversatie aan de ACP-sessie.
    - `/acp spawn ... --thread ...` bindt een kanaalthread/-topic aan de ACP-sessie.
    - Persistent geconfigureerde `bindings[].type="acp"` routeren overeenkomende conversaties naar dezelfde ACP-sessie.

    Vervolgberichten in de gebonden conversatie worden rechtstreeks naar de
    ACP-sessie gerouteerd, en ACP-uitvoer wordt teruggeleverd aan hetzelfde
    kanaal/dezelfde thread/hetzelfde topic.

    Wat OpenClaw naar de harness stuurt:

    - Normale gebonden vervolgen worden verzonden als prompttekst, plus bijlagen alleen wanneer de harness/backend ze ondersteunt.
    - `/acp`-beheeropdrachten en lokale Gateway-opdrachten worden onderschept vóór ACP-dispatch.
    - Door de runtime gegenereerde voltooiingsgebeurtenissen worden per doel gematerialiseerd. OpenClaw-agents krijgen de interne runtime-contextenvelop van OpenClaw; externe ACP-harnesses krijgen een gewone prompt met het childresultaat en de instructie. De ruwe `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`-envelop mag nooit naar externe harnesses worden verzonden of worden bewaard als ACP-gebruikerstranscripttekst.
    - ACP-transcriptitems gebruiken de voor de gebruiker zichtbare triggertekst of de gewone voltooiingsprompt. Interne gebeurtenismetadata blijven waar mogelijk gestructureerd in OpenClaw en worden niet behandeld als door de gebruiker geschreven chatinhoud.

  </Accordion>
  <Accordion title="Door parent beheerde eenmalige ACP-sessies">
    Eenmalige ACP-sessies die door een andere agent-run worden gespawnd, zijn achtergrond-childs,
    vergelijkbaar met subagents:

    - De parent vraagt om werk met `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - De child draait in zijn eigen ACP-harnesssessie.
    - Childbeurten draaien op dezelfde achtergrondlane die wordt gebruikt door native subagent-spawns, zodat een trage ACP-harness ongerelateerd werk in de hoofdsessie niet blokkeert.
    - Voltooiing wordt teruggemeld via het aankondigingspad voor taakvoltooiing. OpenClaw zet interne voltooiingsmetadata om naar een gewone ACP-prompt voordat die naar een externe harness wordt verzonden, zodat harnesses geen runtime-contextmarkeringen zien die alleen voor OpenClaw zijn.
    - De parent herschrijft het childresultaat in normale assistentstem wanneer een gebruikersgericht antwoord nuttig is.

    Behandel dit pad **niet** als een peer-to-peerchat tussen parent
    en child. De child heeft al een voltooiingskanaal terug naar de
    parent.

  </Accordion>
  <Accordion title="sessions_send en A2A-levering">
    `sessions_send` kan na spawn een andere sessie targeten. Voor normale
    peersessies gebruikt OpenClaw een agent-naar-agent (A2A)-vervolgpad
    na het injecteren van het bericht:

    - Wacht op het antwoord van de doelsessie.
    - Laat aanvrager en doel optioneel een begrensd aantal vervolgbeurten uitwisselen.
    - Vraag het doel om een aankondigingsbericht te produceren.
    - Lever die aankondiging aan het zichtbare kanaal of de zichtbare thread.

    Dat A2A-pad is een fallback voor peer-verzendingen waarbij de afzender
    een zichtbaar vervolg nodig heeft. Het blijft ingeschakeld wanneer een
    ongerelateerde sessie een ACP-doel kan zien en berichten kan sturen,
    bijvoorbeeld onder brede `tools.sessions.visibility`-instellingen.

    OpenClaw slaat het A2A-vervolg alleen over wanneer de aanvrager de
    parent is van zijn eigen door parent beheerde eenmalige ACP-child. In dat geval
    kan A2A boven op taakvoltooiing de parent wekken met het resultaat van de
    child, het antwoord van de parent terugsturen naar de child en een
    parent/child-echolus creëren. Het `sessions_send`-resultaat rapporteert
    `delivery.status="skipped"` voor die owned-childcase, omdat het
    voltooiingspad al verantwoordelijk is voor het resultaat.

  </Accordion>
  <Accordion title="Een bestaande sessie hervatten">
    Gebruik `resumeSessionId` om een eerdere ACP-sessie voort te zetten in plaats van
    vers te starten. De agent speelt zijn conversatiegeschiedenis opnieuw af via
    `session/load`, zodat hij doorgaat met de volledige context van wat eraan voorafging.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Veelvoorkomende gebruikssituaties:

    - Draag een Codex-sessie over van je laptop naar je telefoon — vertel je agent dat hij moet doorgaan waar je was gebleven.
    - Zet een codesessie voort die je interactief in de CLI bent gestart, nu headless via je agent.
    - Pak werk op dat werd onderbroken door een Gateway-herstart of idle-timeout.

    Notities:

    - `resumeSessionId` is alleen van toepassing wanneer `runtime: "acp"` is; de standaard subagent-runtime negeert dit ACP-only veld.
    - `streamTo` is alleen van toepassing wanneer `runtime: "acp"` is; de standaard subagent-runtime negeert dit ACP-only veld.
    - `resumeSessionId` is een hostlokale ACP-/harness-hervattings-id, geen OpenClaw-kanaalsessiesleutel; OpenClaw controleert nog steeds ACP-spawnbeleid en doelagentbeleid vóór dispatch, terwijl de ACP-backend of harness eigenaar is van autorisatie voor het laden van die upstream-id.
    - `resumeSessionId` herstelt de upstream ACP-conversatiegeschiedenis; `thread` en `mode` gelden nog steeds normaal voor de nieuwe OpenClaw-sessie die je maakt, dus `mode: "session"` vereist nog steeds `thread: true`.
    - De doelagent moet `session/load` ondersteunen (Codex en Claude Code doen dat).
    - Als de sessie-id niet wordt gevonden, faalt de spawn met een duidelijke fout — geen stille fallback naar een nieuwe sessie.

  </Accordion>
  <Accordion title="Smoke-test na deploy">
    Voer na een Gateway-deploy een live end-to-endcontrole uit in plaats van
    op unittests te vertrouwen:

    1. Verifieer de gedeployde Gateway-versie en commit op de doelhost.
    2. Open een tijdelijke ACPX-bridgesessie naar een live agent.
    3. Vraag die agent om `sessions_spawn` aan te roepen met `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` en taak `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Verifieer `accepted=yes`, een echte `childSessionKey` en geen validatorfout.
    5. Ruim de tijdelijke bridgesessie op.

    Houd de gate op `mode: "run"` en sla `streamTo: "parent"` over —
    threadgebonden `mode: "session"` en stream-relaypaden zijn afzonderlijke,
    rijkere integratiepasses.

  </Accordion>
</AccordionGroup>

## Sandboxcompatibiliteit

ACP-sessies draaien momenteel op de hostruntime, **niet** binnen de
OpenClaw-sandbox.

<Warning>
**Beveiligingsgrens:**

- De externe harness kan lezen/schrijven volgens de eigen CLI-machtigingen en de geselecteerde `cwd`.
- Het sandboxbeleid van OpenClaw omhult de uitvoering van de ACP-harness **niet**.
- OpenClaw dwingt nog steeds ACP-functiegates, toegestane agents, sessie-eigenaarschap, kanaalkoppelingen en Gateway-afleverbeleid af.
- Gebruik `runtime: "subagent"` voor door de sandbox afgedwongen OpenClaw-native werk.

</Warning>

Huidige beperkingen:

- Als de aanvragende sessie in een sandbox draait, worden ACP-spawns geblokkeerd voor zowel `sessions_spawn({ runtime: "acp" })` als `/acp spawn`.
- `sessions_spawn` met `runtime: "acp"` ondersteunt geen `sandbox: "require"`.

## Resolutie van sessiedoel

De meeste `/acp`-acties accepteren een optioneel sessiedoel (`session-key`,
`session-id` of `session-label`).

**Resolutievolgorde:**

1. Expliciet doelargument (of `--session` voor `/acp steer`)
   - probeert sleutel
   - daarna UUID-vormige sessie-id
   - daarna label
2. Huidige threadkoppeling (als dit gesprek/deze thread aan een ACP-sessie is gekoppeld).
3. Fallback naar huidige aanvragende sessie.

Koppelingen van het huidige gesprek en threadkoppelingen doen beide mee in
stap 2.

Als er geen doel wordt opgelost, retourneert OpenClaw een duidelijke fout
(`Unable to resolve session target: ...`).

## ACP-besturing

| Opdracht             | Wat deze doet                                                   | Voorbeeld                                                     |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Maak ACP-sessie; optionele huidige koppeling of threadkoppeling. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Annuleer actieve beurt voor doelsessie.                         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Stuur stuurinstructie naar lopende sessie.                      | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Sluit sessie en ontkoppel threaddoelen.                         | `/acp close`                                                  |
| `/acp status`        | Toon backend, modus, status, runtime-opties, mogelijkheden.     | `/acp status`                                                 |
| `/acp set-mode`      | Stel runtime-modus in voor doelsessie.                          | `/acp set-mode plan`                                          |
| `/acp set`           | Generieke runtime-configuratieoptie schrijven.                  | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Stel overschrijving van runtime-werkmap in.                     | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Stel profiel voor goedkeuringsbeleid in.                        | `/acp permissions strict`                                     |
| `/acp timeout`       | Stel runtime-time-out in (seconden).                            | `/acp timeout 120`                                            |
| `/acp model`         | Stel runtime-modeloverschrijving in.                            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Verwijder overschrijvingen van runtime-opties voor sessie.       | `/acp reset-options`                                          |
| `/acp sessions`      | Lijst recente ACP-sessies uit de opslag.                        | `/acp sessions`                                               |
| `/acp doctor`        | Backendstatus, mogelijkheden, uitvoerbare oplossingen.          | `/acp doctor`                                                 |
| `/acp install`       | Druk deterministische installatie- en inschakelstappen af.      | `/acp install`                                                |

`/acp status` toont de effectieve runtime-opties plus runtime- en
backendniveau-sessie-ID's. Fouten voor niet-ondersteunde besturing komen
duidelijk naar voren wanneer een backend een mogelijkheid mist. `/acp sessions` leest de
opslag voor de huidige gekoppelde of aanvragende sessie; doeltokens
(`session-key`, `session-id` of `session-label`) worden opgelost via
Gateway-sessiedetectie, inclusief aangepaste `session.store`-roots per agent.

### Toewijzing van runtime-opties

`/acp` heeft snelopdrachten en een generieke setter. Equivalent
bewerkingen:

| Opdracht                     | Wijst toe aan                         | Opmerkingen                                                                                                                                                                             |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime-configuratiesleutel `model`   | Voor Codex ACP normaliseert OpenClaw `openai-codex/<model>` naar de adaptermodel-id en wijst slash-redeneringssuffixen zoals `openai-codex/gpt-5.4/high` toe aan `reasoning_effort`. |
| `/acp set thinking <level>`  | runtime-configuratiesleutel `thinking` | Voor Codex ACP verstuurt OpenClaw de overeenkomstige `reasoning_effort` waar de adapter er een ondersteunt.                                                                            |
| `/acp permissions <profile>` | runtime-configuratiesleutel `approval_policy` | —                                                                                                                                                                                       |
| `/acp timeout <seconds>`     | runtime-configuratiesleutel `timeout` | —                                                                                                                                                                                       |
| `/acp cwd <path>`            | overschrijving van runtime-cwd        | Directe update.                                                                                                                                                                        |
| `/acp set <key> <value>`     | generiek                              | `key=cwd` gebruikt het pad voor cwd-overschrijving.                                                                                                                                    |
| `/acp reset-options`         | wist alle runtime-overschrijvingen    | —                                                                                                                                                                                       |

## acpx-harness, Plugin-installatie en machtigingen

Voor acpx-harnessconfiguratie (Claude Code / Codex / Gemini CLI
aliassen), de MCP-bruggen plugin-tools en OpenClaw-tools, en ACP
machtigingsmodi, zie
[ACP-agents — installatie](/nl/tools/acp-agents-setup).

## Probleemoplossing

| Symptoom                                                                    | Waarschijnlijke oorzaak                                                                                               | Oplossing                                                                                                                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend-Plugin ontbreekt, is uitgeschakeld, of wordt geblokkeerd door `plugins.allow`.                                | Installeer en schakel de backend-Plugin in, neem `acpx` op in `plugins.allow` wanneer die allowlist is ingesteld, en voer daarna `/acp doctor` uit.                      |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP is globaal uitgeschakeld.                                                                                         | Stel `acp.enabled=true` in.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Automatische dispatch vanuit normale threadberichten is uitgeschakeld.                                                | Stel `acp.dispatch.enabled=true` in om automatische threadroutering te hervatten; expliciete aanroepen van `sessions_spawn({ runtime: "acp" })` blijven werken.          |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent staat niet in de allowlist.                                                                                     | Gebruik een toegestane `agentId` of werk `acp.allowedAgents` bij.                                                                                                        |
| `/acp doctor` meldt dat de backend direct na het opstarten niet gereed is   | Plugin-afhankelijkheidscontrole of zelfherstel draait nog.                                                            | Wacht kort en voer `/acp doctor` opnieuw uit; als de status ongezond blijft, inspecteer dan de installatiefout van de backend en het allow/deny-beleid voor Plugins.     |
| Harness-opdracht niet gevonden                                              | Adapter-CLI is niet geinstalleerd, gestagede Plugin-afhankelijkheden ontbreken, of de eerste `npx`-fetch is mislukt voor een niet-Codex-adapter. | Voer `/acp doctor` uit, herstel Plugin-afhankelijkheden, installeer/warm de adapter voor op de Gateway-host, of configureer de acpx-agentopdracht expliciet.             |
| Model-niet-gevonden vanuit de harness                                       | Model-id is geldig voor een andere provider/harness, maar niet voor dit ACP-doel.                                     | Gebruik een model dat door die harness wordt vermeld, configureer het model in de harness, of laat de override weg.                                                      |
| Vendor-authenticatiefout vanuit de harness                                  | OpenClaw is gezond, maar de doel-CLI/provider is niet ingelogd.                                                       | Log in of lever de vereiste providersleutel in de Gateway-hostomgeving.                                                                                                  |
| `Unable to resolve session target: ...`                                     | Ongeldige sleutel/id/labeltoken.                                                                                      | Voer `/acp sessions` uit, kopieer de exacte sleutel/het exacte label en probeer het opnieuw.                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` gebruikt zonder actieve bindbare conversatie.                                                           | Ga naar de doelchat/het doelkanaal en probeer het opnieuw, of gebruik een niet-gebonden spawn.                                                                           |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter mist de ACP-bindingsmogelijkheid voor de huidige conversatie.                                                 | Gebruik `/acp spawn ... --thread ...` waar ondersteund, configureer `bindings[]` op topniveau, of ga naar een ondersteund kanaal.                                        |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` gebruikt buiten een threadcontext.                                                                    | Ga naar de doelthread of gebruik `--thread auto`/`off`.                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Een andere gebruiker is eigenaar van het actieve bindingsdoel.                                                        | Bind opnieuw als eigenaar of gebruik een andere conversatie of thread.                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                            | Adapter mist de mogelijkheid voor threadbinding.                                                                      | Gebruik `--thread off` of ga naar een ondersteunde adapter/kanaal.                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP-runtime is host-side; de aanvragende sessie is gesandboxed.                                                       | Gebruik `runtime="subagent"` vanuit gesandboxte sessies, of voer ACP-spawn uit vanuit een niet-gesandboxte sessie.                                                      |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` aangevraagd voor ACP-runtime.                                                                     | Gebruik `runtime="subagent"` voor verplichte sandboxing, of gebruik ACP met `sandbox="inherit"` vanuit een niet-gesandboxte sessie.                                      |
| `Cannot apply --model ... did not advertise model support`                  | De doelharness biedt geen generieke ACP-modelwisseling aan.                                                           | Gebruik een harness die ACP `models`/`session/set_model` aankondigt, gebruik Codex ACP-modelreferenties, of configureer het model rechtstreeks in de harness als die een eigen opstartvlag heeft. |
| Ontbrekende ACP-metadata voor gebonden sessie                               | Verouderde/verwijderde ACP-sessiemetadata.                                                                            | Maak opnieuw aan met `/acp spawn` en bind/focus daarna de thread opnieuw.                                                                                                |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` blokkeert schrijfacties/exec in niet-interactieve ACP-sessie.                                        | Stel `plugins.entries.acpx.config.permissionMode` in op `approve-all` en herstart de Gateway. Zie [Machtigingsconfiguratie](/nl/tools/acp-agents-setup#permission-configuration). |
| ACP-sessie faalt vroeg met weinig uitvoer                                   | Machtigingsprompts worden geblokkeerd door `permissionMode`/`nonInteractivePermissions`.                             | Controleer Gateway-logs op `AcpRuntimeError`. Voor volledige machtigingen stel je `permissionMode=approve-all` in; voor soepele degradatie stel je `nonInteractivePermissions=deny` in. |
| ACP-sessie blijft oneindig hangen na het voltooien van werk                 | Harnessproces is voltooid, maar ACP-sessie heeft geen voltooiing gemeld.                                             | Monitor met `ps aux \| grep acpx`; beeindig verouderde processen handmatig.                                                                                             |
| Harness ziet `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Interne eventenvelop is over de ACP-grens gelekt.                                                                     | Werk OpenClaw bij en voer de voltooiingsflow opnieuw uit; externe harnesses mogen alleen gewone voltooiingsprompts ontvangen.                                           |

## Gerelateerd

- [ACP-agenten — installatie](/nl/tools/acp-agents-setup)
- [Agent verzenden](/nl/tools/agent-send)
- [CLI-backends](/nl/gateway/cli-backends)
- [Codex-harness](/nl/plugins/codex-harness)
- [Multi-agentsandboxtools](/nl/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (brugmodus)](/nl/cli/acp)
- [Subagenten](/nl/tools/subagents)
