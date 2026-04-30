---
read_when:
    - Je ontwerpt of implementeert een openbare OpenClaw-app-SDK
    - Je vergelijkt de agent-API's van OpenClaw met Cursor, Claude Agent SDK, OpenAI Agents, Google ADK, OpenCode, Codex of ACP
    - Je moet bepalen of een functionaliteit thuishoort in de openbare app-SDK, de Plugin-SDK, het Gateway-protocol, de ACP-backend of de laag voor beheerde omgevingen
summary: Ontwerpvoorstel voor een publieke OpenClaw-app-SDK voor agentuitvoeringen, sessies, taken, artefacten en beheerde omgevingen
title: OpenClaw SDK-ontwerp
x-i18n:
    generated_at: "2026-04-30T00:06:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffd4380e556e0e2e1218acaa9e5934e8b308b3420aa25a6d2598d35c7f9a7ab2
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Deze pagina is een ontwerpvoorstel voor een toekomstige publieke **OpenClaw-app-SDK**. Deze staat
los van de bestaande [Plugin-SDK](/nl/plugins/sdk-overview).

De Plugin-SDK is bedoeld voor code die binnen OpenClaw draait en providers,
kanalen, tools, hooks en vertrouwde runtimes uitbreidt. De app-SDK is bedoeld voor
externe applicaties, scripts, dashboards, CI-taken, IDE-extensies en
automatiseringssystemen die OpenClaw-agents via een stabiele
publieke API willen uitvoeren en observeren.

## Status

Conceptarchitectuur.

Dit document legt de ontwerprichting vast uit een vergelijkende beoordeling van deze
agent-SDK- en runtime-oppervlakken:

| Project             | Nuttige les                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor SDK cookbook | Beste product-API op hoog niveau: `Agent`, `Run`, lokale en cloud-runtimes, streaming, annulering, modeldetectie, repository's, artefacten en cloudstromen voor pull requests.    |
| Claude Agent SDK    | Sterke bidirectionele sessieclient, ondersteuning voor onderbreken en bijsturen, toestemmingsmodi, hooks, aangepaste tools, sessiestores en hervatbare transcripten.                        |
| OpenAI Agents SDK   | Sterke workflowconcepten: overdrachten, guardrails, menselijke goedkeuringen, tracing, runstatus, streaming-resultaatobjecten en hervatten na onderbrekingen.                             |
| Google ADK          | Sterke interne architectuur: runner, sessieservice, geheugendienst, artefactservice, credentialservice, plugins, eventacties en bevestigingen voor langlopende tools.  |
| OpenCode            | Sterke client/server-vorm: gegenereerde API-client, REST plus SSE, sessies, workspaces, worktrees, toestemmingen, vragen, bestanden, VCS, PTY, tools, agents, Skills en MCP. |
| Codex               | Sterke lokale runtimegrens: goedkeuringen, sandboxing, netwerkbeleid, lokale en externe exec-servers, gestructureerde protocol-events en threadbewuste app-serversessies.     |
| ACP en acpx        | Sterke interoperabiliteitslaag voor externe codeharnassen met benoemde sessies, promptwachtrijen, coöperatieve annulering en runtime-adapters.                            |

De aanbeveling is om een eenvoudige publieke facade in Cursor-stijl te bouwen boven op een
gegenereerde Gateway-client in OpenCode-stijl, terwijl Claude-, OpenAI Agents-,
ADK-, Codex- en ACP-concepten als interne ontwerpreferenties worden behouden waar ze passen.

## Doelen

- Appontwikkelaars een kleine API op hoog niveau geven voor het uitvoeren van OpenClaw-agents.
- OpenClaw met lokale uitvoering als uitgangspunt de standaardruntime laten blijven.
- Cloud- of beheerde omgevingen een aanvullende omgevingsprovider maken, geen
  andere agent-API.
- Bestaande OpenClaw-grenzen behouden: Gateway bezit het publieke protocol, de Plugin-SDK
  bezit in-process extensies, ACP bezit interoperabiliteit met externe harnassen.
- `stream`, `wait`, `cancel`, `resume`, `fork`, artefacten, goedkeuringen
  en achtergrondtaken ondersteunen als eersteklas operaties.
- Stabiele genormaliseerde events blootstellen en runtime-native raw events behouden voor
  geavanceerde consumenten.
- SDK-toestemmingen, doorgeven van secrets, goedkeuringen, sandboxing en externe
  omgevingen expliciet maken.
- Het publieke contract klein genoeg houden om te documenteren, testen, versioneren en
  genereren.

## Niet-doelen

- `openclaw/plugin-sdk/*` niet blootstellen als de app-SDK.
- ACP niet het enige runtimemodel maken.
- Geen cloudservice vereisen voordat de SDK nuttig is.
- Cursor-, Claude-, OpenAI-, ADK-, OpenCode-, Codex- of ACP-API's niet
  exact klonen.
- Geen onbegrensde `any`-eventpayloads blootstellen als het enige publieke contract.
- Geen sandbox- of netwerkisolatie beloven voor een extern harnas tenzij
  de geselecteerde omgeving dit daadwerkelijk kan afdwingen.
- Plugin-auteurs niet afhankelijk maken van app-SDK-objecten binnen runtimecode
  van Plugins.

## Huidige OpenClaw-inpassing

OpenClaw heeft al het grootste deel van de onderlaag:

| Bestaand oppervlak                                    | Wat het bijdraagt                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Agentlus](/nl/concepts/agent-loop)                  | Levenscyclus van `agent`- en `agent.wait`-runs, streaming, time-out en sessieserialisatie.                                     |
| [Agent-runtimes](/nl/concepts/agent-runtimes)          | Scheiding tussen provider, model, runtime en kanaal.                                                                          |
| [ACP-agents](/nl/tools/acp-agents)                     | Externe harnassessies voor Claude Code, Cursor, Gemini CLI, OpenCode, expliciete Codex ACP en vergelijkbare tools.            |
| [Achtergrondtaken](/nl/automation/tasks)               | Losgekoppeld activiteitenlogboek voor ACP, subagents, Cron, CLI-bewerkingen en asynchrone mediataken.                                   |
| [Sub-agents](/nl/tools/subagents)                      | Geisoleerde agentruns op de achtergrond, optionele geforkte context, teruglevering aan aanvragersessies.                              |
| [Agent-harnas-Plugins](/nl/plugins/sdk-agent-harness) | Registratie van vertrouwde native runtimes voor ingesloten harnassen zoals Codex.                                                  |
| Gateway-protocolschema's                            | Huidige getypte methode- en eventdefinities voor agentparameters, sessies, abonnementen, afbrekingen, Compaction en checkpoints. |

Het gat zit niet in agentuitvoering. Het gat is een stabiele, vriendelijke publieke facade boven
deze onderdelen.

## Kernmodel

De app-SDK moet een kleine set duurzame naamwoorden gebruiken.

| Naamwoord          | Betekenis                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OpenClaw`    | Clientingangspunt. Beheert Gateway-detectie, auth, low-level clienttoegang en namespace-fabrieken.                        |
| `Agent`       | Geconfigureerde actor. Draagt agent-id, standaardmodel, standaardruntime, standaardtoolbeleid en appgerichte helpers.           |
| `Session`     | Duurzaam transcript, routering, workspace, context en runtimebinding.                                                      |
| `Run`         | Een ingediende beurt of taak. Streamt events, wacht op resultaat, annuleert en stelt artefacten bloot.                              |
| `Task`        | Losgekoppeld of achtergronditem in het activiteitenlogboek. Omvat subagents, ACP-spawns, Cron-taken, CLI-runs en asynchrone taken.           |
| `Artifact`    | Bestanden, patches, diffs, media, logs, trajecten, pull requests, screenshots en gegenereerde bundels.                       |
| `Environment` | Waar de run wordt uitgevoerd: lokale Gateway, lokale workspace, nodehost, ACP-harnas, beheerde runner of toekomstige cloudworkspace. |
| `ToolSpace`   | Het effectieve tooloppervlak: OpenClaw-tools, MCP-servers, kanaaltools, apptools, goedkeuringsregels en toolmetadata.      |
| `Approval`    | Menselijke of beleidsbeslissing gevraagd door een run, tool, omgeving of harnas.                                                |

Deze naamwoorden sluiten netjes aan op bestaande OpenClaw-concepten, maar vermijden het lekken van
implementatiespecifieke namen zoals interne onderdelen van de PI-runner, registratie van Plugin-harnassen
of details van ACP-adapters.

## Productvorm

De SDK op hoog niveau moet zo aanvoelen:

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({ gateway: "auto" });
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
});

for await (const event of run.events()) {
  if (event.type === "assistant.delta") {
    process.stdout.write(event.text);
  }
}

const result = await run.wait();
console.log(result.status);
```

Dezelfde app moet een duurzame sessie kunnen gebruiken:

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

Opmerking over de huidige implementatie: `@openclaw/sdk` begint met het door de Gateway ondersteunde
oppervlak dat vandaag bestaat. Provider-gekwalificeerde modelrefs zoals
`openai/gpt-5.5` worden opgesplitst in Gateway-overschrijvingen voor `provider` en `model`.
Selecties per run voor `workspace`, `runtime`, `environment` en `approvals` zijn
nog steeds ontwerpdoelen; de client gooit een fout wanneer aanroepers ze instellen, zodat verzoeken niet
stilzwijgend met standaardwaarden worden uitgevoerd. Helpers voor taak-, artifact-, environment- en generieke tool-
aanroepen zijn ook gescaffold als toekomstige API-vorm en gooien expliciete
niet-ondersteunde fouten totdat er Gateway-RPC's voor bestaan.

En dezelfde API moet een externe ACP-harness kunnen gebruiken:

```typescript
const run = await oc.runs.create({
  input: "Deep review this repository and return only high-risk findings.",
  workspace: { cwd: process.cwd() },
  runtime: { type: "acp", harness: "claude" },
  mode: "task",
});
```

Beheerde environments mogen de API op het hoogste niveau niet veranderen:

```typescript
const run = await agent.run({
  input: "Run the full changed gate and summarize failures.",
  workspace: { repo: "openclaw/openclaw", ref: "main" },
  runtime: {
    type: "managed",
    provider: "testbox",
    timeoutMinutes: 90,
  },
});
```

## Runtime-selectie

De app-SDK moet runtime-selectie als een genormaliseerde union blootstellen:

```typescript
type RuntimeSelection =
  | "auto"
  | { type: "embedded"; id: "pi" | "codex" | string }
  | { type: "cli"; id: "claude-cli" | string }
  | { type: "acp"; harness: "claude" | "cursor" | "gemini" | "opencode" | string }
  | { type: "managed"; provider: "local" | "node" | "testbox" | "cloud" | string };
```

Regels:

- `auto` volgt de runtime-selectieregels van OpenClaw.
- `embedded` richt zich op vertrouwde in-process harnesses die via de Plugin
  SDK zijn geregistreerd, zoals `pi` of `codex`.
- `cli` richt zich op door OpenClaw beheerde CLI-backenduitvoering waar beschikbaar.
- `acp` richt zich via ACP/acpx op externe harnesses.
- `managed` richt zich op een environment-provider en kan nog steeds een embedded,
  CLI- of ACP-runtime binnen die environment uitvoeren.

Het runtime-selectieobject moet beschrijvend zijn. Het mag niet de plaats zijn
waar geheime afhandeling, sandboxbeleid of workspace-provisioning verborgen zit.

## Environment-model

De environment is het uitvoeringssubstraat. Deze moet expliciet zijn omdat lokale
CLI-runs, externe harnesses, node-hosts en cloud-workspaces verschillende
veiligheids- en levenscycluseigenschappen hebben.

```typescript
type EnvironmentSelection =
  | { type: "local"; cwd?: string }
  | { type: "gateway"; url?: string; cwd?: string }
  | { type: "node"; nodeId: string; cwd?: string }
  | { type: "managed"; provider: string; repo?: string; ref?: string }
  | { type: "ephemeral"; provider: string; repo?: string; ref?: string };
```

De environment beheert:

- checkout- of workspacevoorbereiding
- proces- en bestandstoegang
- sandbox- en netwerkhandhaving
- omgevingsvariabelen en geheime referenties
- logs, traces en artifacts
- opschoning en retentie
- runtime-beschikbaarheid

Deze scheiding maakt beheerde agents een natuurlijke uitbreiding van de SDK. Een beheerde
agent is een normale run in een beheerde environment, geen speciale productfork.

De gedetailleerde namespace-, event-, resultaat-, goedkeurings-, artifact-, security-, pakket-,
en environment-providercontracten staan in
[OpenClaw SDK-API-ontwerp](/nl/reference/openclaw-sdk-api-design).

## Cookbook-plan

De SDK moet worden geleverd met een cookbook, niet alleen met referentiedocumentatie.

Aanbevolen voorbeelden:

| Voorbeeld                    | Toont                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Quickstart                   | Client maken, een agent uitvoeren, uitvoer streamen, wachten op resultaat.                   |
| Coding agent CLI             | Lokale werkruimte, modelkiezer, annulering, goedkeuringen, JSON-uitvoer.                     |
| Agentdashboard               | Sessies, runs, achtergrondtaken, artefacten, eventreplay, statusfilters.                     |
| Appbouwer                    | Agent bewerkt een werkruimte terwijl een previewserver ernaast draait.                       |
| Pull-requestreviewer         | Uitvoeren tegen een repository-ref, diff-opmerkingen en artefacten verzamelen.                |
| Goedkeuringsconsole          | Abonneren op goedkeuringen en ze vanuit een UI beantwoorden.                                 |
| ACP-harnessrunner            | Claude Code, Cursor, Gemini CLI of OpenCode via ACP uitvoeren met dezelfde `Run`-API.        |
| Provider voor beheerde omgeving | Minimale provider die een werkruimte voorbereidt, gebeurtenissen streamt, artefacten opslaat en opruimt. |
| Slack- of Discord-brug       | Externe app ontvangt gebeurtenissen en plaatst voortgangssamenvattingen zonder een kanaal-Plugin te worden. |
| Multi-agentonderzoek         | Parallelle runs spawnen, artefacten verzamelen en een eindrapport synthetiseren.             |

Cookbookvoorbeelden moeten eerst de high-level API gebruiken. Low-level gegenereerde
clientvoorbeelden horen in een geavanceerde sectie.

## Gefaseerde implementatie

### Fase 0: RFC en vocabulaire

- Spreek publieke zelfstandige naamwoorden en namen af.
- Beslis over pakketnamen.
- Definieer de eerste eventtaxonomie.
- Markeer de huidige Plugin SDK in de docs als bewust apart.

### Fase 1: Low-level gegenereerde client

- Genereer een TypeScript-client uit Gateway-protocolschema's.
- Dek eerst `agent`, `agent.wait`, sessies, abonnementen, afbreken en taken af.
- Voeg smoketests toe die controleren dat gegenereerde methoden overeenkomen met Gateway-methodenamen en schema-
  vormen.
- Publiceer als experimenteel of intern pakket.

### Fase 2: High-level run-API

- Voeg `OpenClaw`, `Agent`, `Session` en `Run` toe.
- Ondersteun `run.events()`, `run.wait()` en `run.cancel()`.
- Ondersteun lokale Gateway-detectie en expliciete Gateway-URL's.
- Ondersteun duurzame sessies en sessieverzending.

### Fase 3: Genormaliseerde eventprojectie

- Voeg Gateway-side genormaliseerde eventprojectie toe naast bestaande ruwe gebeurtenissen.
- Behoud ruwe runtimegebeurtenissen waar beleid dit toestaat.
- Voeg replaycursors en reconnectgedrag toe.
- Map PI-, Codex-, ACP- en taakgebeurtenissen naar de stabiele taxonomie.

### Fase 4: Artefacten en goedkeuringen

- Voeg artefactlijst en download toe.
- Voeg helpers voor goedkeuringsabonnementen en antwoorden toe.
- Voeg helpers voor vraagabonnementen en antwoorden toe.
- Voeg een cookbook-goedkeuringsconsole toe.

### Fase 5: Omgevingsproviders

- Introduceer contracten voor lokale, node- en beheerde omgevingsproviders.
- Begin met een omgeving die operationeel al bestaat.
- Voeg werkruimtevoorbereiding, logs, artefacten, time-out, opruiming en retentie toe.

### Fase 6: Cloudstijlworkflows

- Voeg repository- en branch-georiënteerde runs toe.
- Voeg pull-requestartefacten toe.
- Voeg runborden toe, gegroepeerd op repo, branch, status en toegewezene.
- Voeg langlopende beheerde sessies en retentiebeleid toe.

## Ontwerpkeuzes om over te nemen

Neem deze ideeën over:

- Van Cursor: `Agent` plus `Run`, lokale en cloudsymmetrie, modeldetectie,
  artefacten en cookbook-gestuurde onboarding.
- Van Claude Agent SDK: bidirectionele clients, interrupt, machtigingen, hooks,
  aangepaste tools, sessiestores en hervattingssemantiek.
- Van OpenAI Agents: handoffs, guardrails, hervatting na menselijke goedkeuring, tracing en
  gestructureerde gestreamde resultaatobjecten.
- Van Google ADK: services achter runner, eventacties, geheugen, artefacten,
  credentialservices en Plugin-interceptie rond de run-lifecycle.
- Van OpenCode: gegenereerde protocolclient, REST plus SSE, sessies,
  werkruimten, vragen, machtigingen, bestanden, VCS, PTY, MCP, agents en Skills.
- Van Codex: expliciete sandbox, goedkeuring, netwerk, lokale en remote exec, en
  threadgrenzen voor appserver.
- Van ACP en acpx: adaptergebaseerde interoperabiliteit met externe harnesses en benoemde
  promptwachtrijen.

## Ontwerpkeuzes om te vermijden

Vermijd deze valkuilen:

- Een publieke SDK die slechts een dunne dump van Gateway-internals is.
- Een publieke SDK die Plugin SDK-subpaden importeert.
- Een publieke SDK waarin gebeurtenissen alleen `stream` plus `data` zijn.
- Een cloud-first API die lokale OpenClaw als een legacy-modus laat aanvoelen.
- Runtimekeuze verborgen in model-id-prefixen.
- Secret-forwarding verborgen in omgevingsmaps.
- ACP-specifieke opties op het topniveau van elke run.
- Sandboxvlaggen die niet kunnen worden afgedwongen door de gekozen runtime.
- Een SDK-object dat tegelijk provider-Plugin, kanaal-Plugin, appclient
  en beheerde runner probeert te zijn.

## Open vragen

- Moet het initiële pakket in deze repo staan of in een aparte SDK-repo?
- Moet de gegenereerde low-level client publiek worden gepubliceerd voordat de
  high-level wrapper stabiliseert?
- Wat is het eerste ondersteunde app-authmechanisme: lokale token, admintoken,
  OAuth-deviceflow of ondertekende appregistratie?
- Hoeveel sessieberichtgeschiedenis moet de SDK standaard blootstellen?
- Moeten beheerde omgevingen alleen in Gateway-configuratie worden geconfigureerd, of kunnen SDK-
  aanroepers ze direct aanvragen met scoped tokens?
- Welke retentieregels gelden voor artefacten die door lokale runs worden gegenereerd?
- Welke eventpayloads vereisen redactie vóór applevering?
- Moet `Run` normale chatbeurten en losgekoppelde taken dekken, of moet losgekoppeld
  achtergrondwerk altijd een `Task`-wrapper met een geneste `Run` teruggeven?

## Gerelateerde docs

- [Agentloop](/nl/concepts/agent-loop)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Sessie](/nl/concepts/session)
- [Subagents](/nl/tools/subagents)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP-agents](/nl/tools/acp-agents)
- [Agentharness-Plugins](/nl/plugins/sdk-agent-harness)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
