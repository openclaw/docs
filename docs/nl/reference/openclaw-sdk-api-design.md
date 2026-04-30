---
read_when:
    - Je implementeert de voorgestelde publieke OpenClaw-app-SDK
    - Je hebt het conceptnaamruimte-, gebeurtenis-, resultaat-, artefact-, goedkeurings- of beveiligingscontract voor de app-SDK nodig
    - Je vergelijkt Gateway-protocolresources met de wrapper op hoog niveau van de OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Referentieontwerp voor de openbare OpenClaw App SDK-API, gebeurtenistaxonomie, artefacten, goedkeuringen en pakketstructuur
title: OpenClaw App SDK API-ontwerp
x-i18n:
    generated_at: "2026-04-30T09:41:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Deze pagina is het gedetailleerde API-referentieontwerp voor de openbare
[OpenClaw App SDK](/nl/concepts/openclaw-sdk). Deze staat bewust los van
de [Plugin SDK](/nl/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` is het externe app-/clientpakket om met de
  Gateway te communiceren. `openclaw/plugin-sdk/*` is het in-process contract voor pluginauteurs.
  Importeer geen Plugin SDK-subpaden vanuit apps die alleen agents hoeven uit te voeren.
</Note>

De openbare app-SDK moet in twee lagen worden gebouwd:

1. Een gegenereerde Gateway-client op laag niveau.
2. Een ergonomische wrapper op hoog niveau met `OpenClaw`-, `Agent`-, `Session`-, `Run`-,
   `Task`-, `Artifact`-, `Approval`- en `Environment`-objecten.

## Namespace-ontwerp

De namespaces op laag niveau moeten Gateway-resources nauw volgen:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Wrappers op hoog niveau moeten objecten retourneren die gangbare flows prettig maken:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Eventcontract

De openbare SDK moet geversioneerde, opnieuw afspeelbare, genormaliseerde events beschikbaar stellen.

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: unknown;
};
```

`id` is een replay-cursor. Consumers moeten opnieuw verbinding kunnen maken met
`events({ after: id })` en gemiste events ontvangen wanneer de retentie dat toestaat.

Aanbevolen genormaliseerde eventfamilies:

| Event                 | Betekenis                                                   |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run geaccepteerd.                                           |
| `run.queued`          | Run wacht op een sessielane, runtime of omgeving.           |
| `run.started`         | Runtime is begonnen met uitvoeren.                          |
| `run.completed`       | Run is succesvol voltooid.                                  |
| `run.failed`          | Run is geëindigd met een fout.                              |
| `run.cancelled`       | Run is geannuleerd.                                         |
| `run.timed_out`       | Run heeft de timeout overschreden.                          |
| `assistant.delta`     | Tekstdelta van de assistant.                                |
| `assistant.message`   | Volledig assistant-bericht of vervanging.                   |
| `thinking.delta`      | Redeneer- of plandelta, wanneer beleid blootstelling toestaat. |
| `tool.call.started`   | Toolaanroep begonnen.                                       |
| `tool.call.delta`     | Toolaanroep streamde voortgang of gedeeltelijke uitvoer.    |
| `tool.call.completed` | Toolaanroep is succesvol teruggekeerd.                      |
| `tool.call.failed`    | Toolaanroep is mislukt.                                     |
| `approval.requested`  | Een run of tool heeft goedkeuring nodig.                    |
| `approval.resolved`   | Goedkeuring is verleend, geweigerd, verlopen of geannuleerd. |
| `question.requested`  | Runtime vraagt de gebruiker of host-app om invoer.          |
| `question.answered`   | Host-app heeft een antwoord geleverd.                       |
| `artifact.created`    | Nieuw artifact beschikbaar.                                 |
| `artifact.updated`    | Bestaand artifact gewijzigd.                                |
| `session.created`     | Sessie aangemaakt.                                          |
| `session.updated`     | Sessiemetadata gewijzigd.                                   |
| `session.compacted`   | Sessie-Compaction heeft plaatsgevonden.                     |
| `task.updated`        | Status van achtergrondtaak gewijzigd.                       |
| `git.branch`          | Runtime heeft branchstatus waargenomen of gewijzigd.        |
| `git.diff`            | Runtime heeft een diff geproduceerd of gewijzigd.           |
| `git.pr`              | Runtime heeft een pull request geopend, bijgewerkt of gekoppeld. |

Runtime-eigen payloads moeten beschikbaar zijn via `raw`, maar apps zouden
`raw` niet hoeven te parsen voor normale UI.

## Resultaatcontract

`Run.wait()` moet een stabiele resultaatenvelop retourneren:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Het resultaat moet saai en stabiel zijn. Tijdstempelwaarden behouden de Gateway-vorm,
waardoor huidige runs met lifecycle-ondersteuning meestal epoch-milliseconden
rapporteren, terwijl adapters nog steeds ISO-strings kunnen tonen. Rijke UI, tooltraces en
runtime-eigen details horen thuis in events en artifacts.

`accepted` is een niet-terminaal wachtresultaat: het betekent dat de Gateway-wachtdeadline
verliep voordat de run een lifecycle-einde of -fout produceerde. Het mag niet worden behandeld als
`timed_out`; `timed_out` is gereserveerd voor een run die zijn eigen runtime-timeout
heeft overschreden.

## Goedkeuringen en vragen

Goedkeuringen moeten first-class zijn omdat coding agents voortdurend veiligheidsgrenzen
overschrijden.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Goedkeuringsevents moeten bevatten:

- goedkeurings-id
- run-id en sessie-id
- soort verzoek
- samenvatting van gevraagde actie
- toolnaam of omgevingsactie
- risiconiveau
- beschikbare beslissingen
- vervaldatum
- of de beslissing kan worden hergebruikt

Vragen staan los van goedkeuringen. Een vraag vraagt de gebruiker of host-app om
informatie. Een goedkeuring vraagt om toestemming om een actie uit te voeren.

## ToolSpace-model

Apps moeten het tooloppervlak begrijpen zonder plugin-internals te importeren.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

De SDK moet beschikbaar stellen:

- genormaliseerde toolmetadata
- bron: OpenClaw, MCP, plugin, kanaal, runtime of app
- schemasamenvatting
- goedkeuringsbeleid
- runtimecompatibiliteit
- of een tool verborgen, readonly, schrijfgeschikt of hostgeschikt is

Toolaanroep via de SDK moet expliciet en afgebakend zijn. De meeste apps moeten
agents uitvoeren, niet willekeurige tools rechtstreeks aanroepen.

## Artifact-model

Artifacts moeten meer omvatten dan bestanden.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Veelvoorkomende voorbeelden:

- bestandsbewerkingen en gegenereerde bestanden
- patchbundels
- VCS-diffs
- screenshots en media-uitvoer
- logs en tracebundels
- pull request-links
- runtimetrajecten
- snapshots van werkruimtes in beheerde omgevingen

Artifact-toegang moet redactie, retentie en download-URL's ondersteunen zonder
aan te nemen dat elk artifact een normaal lokaal bestand is.

## Beveiligingsmodel

De app-SDK moet expliciet zijn over autoriteit.

Aanbevolen tokenscopes:

| Scope               | Staat toe                                           |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Agents weergeven en inspecteren.                    |
| `agent.run`         | Runs starten.                                       |
| `session.read`      | Sessiemetadata en berichten lezen.                  |
| `session.write`     | Sessies aanmaken, ernaar verzenden, forken, compacten en afbreken. |
| `task.read`         | Status van achtergrondtaken lezen.                  |
| `task.write`        | Taaknotificatiebeleid annuleren of wijzigen.        |
| `approval.respond`  | Verzoeken goedkeuren of weigeren.                   |
| `tools.invoke`      | Blootgestelde tools rechtstreeks aanroepen.         |
| `artifacts.read`    | Artifacts weergeven en downloaden.                  |
| `environment.write` | Beheerde omgevingen aanmaken of vernietigen.        |
| `admin`             | Beheertaken.                                        |

Standaarden:

- standaard geen doorsturen van geheimen
- geen onbeperkte doorgifte van omgevingsvariabelen
- geheimverwijzingen in plaats van geheime waarden
- expliciet sandbox- en netwerkbeleid
- expliciete retentie voor externe omgevingen
- goedkeuringen voor hostuitvoering tenzij beleid anders bewijst
- ruwe runtime-events worden geredigeerd voordat ze de Gateway verlaten, tenzij de aanroeper een
  sterkere diagnostische scope heeft

## Provider voor beheerde omgevingen

Beheerde agents moeten worden geïmplementeerd als omgevingsproviders.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

De eerste implementatie hoeft geen gehoste SaaS te zijn. Deze kan zich richten op
bestaande Node-hosts, kortstondige werkruimtes, CI-achtige runners of Testbox-achtige
omgevingen. Het belangrijke contract is:

1. werkruimte voorbereiden
2. veilige omgeving en geheimen binden
3. run starten
4. events streamen
5. artifacts verzamelen
6. opruimen of behouden volgens beleid

Zodra dit stabiel is, kan een gehoste cloudservice hetzelfde providercontract
implementeren.

## Pakketstructuur

Aanbevolen pakketten:

| Pakket                  | Doel                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Openbare SDK op hoog niveau en gegenereerde Gateway-client op laag niveau. |
| `@openclaw/sdk-react`   | Optionele React-hooks voor dashboards en appbouwers.          |
| `@openclaw/sdk-testing` | Testhelpers en nep-Gateway-server voor appintegraties.        |

De repo heeft al `openclaw/plugin-sdk/*` voor plugins. Houd die namespace
gescheiden om te voorkomen dat pluginauteurs worden verward met appontwikkelaars.

## Gegenereerde clientstrategie

De low-level client moet worden gegenereerd uit geversioneerde Gateway-protocolschema's
en daarna worden omhuld met handgeschreven ergonomische klassen.

Lagen:

1. Gateway-schema als bron van waarheid.
2. Gegenereerde low-level TypeScript-client.
3. Runtime-validators voor externe invoer en event-payloads.
4. High-level `OpenClaw`, `Agent`, `Session`, `Run`, `Task` en `Artifact`
   wrappers.
5. Cookbook-voorbeelden en integratietests.

Voordelen:

- protocoldrift is zichtbaar
- tests kunnen gegenereerde methoden vergelijken met Gateway-exports
- App SDK blijft onafhankelijk van Plugin SDK-internals
- low-level consumenten houden volledige protocoltoegang
- high-level consumenten krijgen de kleine product-API

## Gerelateerde documentatie

- [OpenClaw App SDK](/nl/concepts/openclaw-sdk)
- [Gateway RPC-referentie](/nl/reference/rpc)
- [Agentlus](/nl/concepts/agent-loop)
- [Agent-runtimeomgevingen](/nl/concepts/agent-runtimes)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP-agents](/nl/tools/acp-agents)
- [Overzicht van de Plugin SDK](/nl/plugins/sdk-overview)
