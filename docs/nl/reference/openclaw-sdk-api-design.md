---
read_when:
    - Je implementeert de voorgestelde openbare OpenClaw-app-SDK
    - Je hebt het conceptcontract voor naamruimte, gebeurtenis, resultaat, artefact, goedkeuring of beveiliging voor de app-SDK nodig
    - Je vergelijkt Gateway-protocolbronnen met de OpenClaw App SDK-wrapper op hoog niveau
sidebarTitle: App SDK API design
summary: Referentieontwerp voor de publieke OpenClaw App SDK-API, gebeurtenistaxonomie, artefacten, goedkeuringen en pakketstructuur
title: API-ontwerp van de OpenClaw App SDK
x-i18n:
    generated_at: "2026-05-11T20:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Deze pagina is het gedetailleerde API-referentieontwerp voor de openbare
[OpenClaw App SDK](/nl/concepts/openclaw-sdk). Deze staat bewust los van
de [Plugin SDK](/nl/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` is het externe app-/clientpakket om met de
  Gateway te communiceren. `openclaw/plugin-sdk/*` is het in-process contract voor Plugin-ontwikkeling.
  Importeer geen subpaden van de Plugin SDK vanuit apps die alleen agents hoeven uit te voeren.
</Note>

De openbare app-SDK moet in twee lagen worden gebouwd:

1. Een gegenereerde Gateway-client op laag niveau.
2. Een ergonomische wrapper op hoog niveau met `OpenClaw`-, `Agent`-, `Session`-, `Run`-,
   `Task`-, `Artifact`-, `Approval`- en `Environment`-objecten.

## Ontwerp van naamruimten

De naamruimten op laag niveau moeten Gateway-resources nauw volgen:

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

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
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

## Gebeurteniscontract

De openbare SDK moet geversioneerde, opnieuw afspeelbare, genormaliseerde gebeurtenissen beschikbaar maken.

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

`id` is een afspeelcursor. Consumenten moeten opnieuw verbinding kunnen maken met
`events({ after: id })` en gemiste gebeurtenissen ontvangen wanneer de retentie dat toestaat.

Aanbevolen genormaliseerde gebeurtenisfamilies:

| Gebeurtenis           | Betekenis                                                   |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run geaccepteerd.                                           |
| `run.queued`          | Run wacht op een sessielane, runtime of omgeving.           |
| `run.started`         | Runtime is begonnen met uitvoeren.                          |
| `run.completed`       | Run is succesvol voltooid.                                  |
| `run.failed`          | Run is geëindigd met een fout.                              |
| `run.cancelled`       | Run is geannuleerd.                                         |
| `run.timed_out`       | Run heeft de time-out overschreden.                         |
| `assistant.delta`     | Tekstdelta van de assistent.                                |
| `assistant.message`   | Volledig assistentbericht of vervanging.                    |
| `thinking.delta`      | Redeneer- of plandelta, wanneer beleid blootstelling toestaat. |
| `tool.call.started`   | Toolaanroep is begonnen.                                    |
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
| `session.updated`     | Sessie-metadata gewijzigd.                                  |
| `session.compacted`   | Sessie-Compaction heeft plaatsgevonden.                     |
| `task.updated`        | Status van achtergrondtaak gewijzigd.                       |
| `git.branch`          | Runtime heeft branchstatus waargenomen of gewijzigd.        |
| `git.diff`            | Runtime heeft een diff geproduceerd of gewijzigd.           |
| `git.pr`              | Runtime heeft een pull request geopend, bijgewerkt of gekoppeld. |

Runtime-native payloads moeten beschikbaar zijn via `raw`, maar apps zouden
`raw` niet hoeven te parsen voor normale UI.

## Resultaatcontract

`Run.wait()` moet een stabiele resultatenvelop retourneren:

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
zodat huidige lifecycle-ondersteunde runs meestal epoch-milliseconden rapporteren,
terwijl adapters nog steeds ISO-strings kunnen tonen. Rijke UI, tooltraces en
runtime-native details horen thuis in gebeurtenissen en artifacts.

`accepted` is een niet-terminaal wachtresultaat: het betekent dat de Gateway-wachtdeadline
verliep voordat de run een lifecycle-einde of -fout produceerde. Het mag niet worden behandeld als
`timed_out`; `timed_out` is gereserveerd voor een run die zijn eigen runtime-time-out
heeft overschreden.

## Goedkeuringen en vragen

Goedkeuringen moeten eersteklas zijn, omdat coding agents voortdurend veiligheidsgrenzen overschrijden.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Goedkeuringsgebeurtenissen moeten bevatten:

- goedkeurings-id
- run-id en sessie-id
- verzoeksoort
- samenvatting van de gevraagde actie
- toolnaam of omgevingsactie
- risiconiveau
- beschikbare beslissingen
- vervaldatum
- of de beslissing kan worden hergebruikt

Vragen staan los van goedkeuringen. Een vraag vraagt de gebruiker of host-app om
informatie. Een goedkeuring vraagt toestemming om een actie uit te voeren.

## ToolSpace-model

Apps moeten het tooloppervlak begrijpen zonder Plugin-internals te importeren.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

De SDK moet beschikbaar maken:

- genormaliseerde toolmetadata
- bron: OpenClaw, MCP, plugin, kanaal, runtime of app
- schemasamenvatting
- goedkeuringsbeleid
- runtimecompatibiliteit
- of een tool verborgen, alleen-lezen, schrijfcapabel of hostcapabel is

Toolaanroep via de SDK moet expliciet en gescoped zijn. De meeste apps moeten
agents uitvoeren, niet rechtstreeks willekeurige tools aanroepen.

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
- runtime-trajecten
- snapshots van beheerde omgevingswerkspaces

Artifact-toegang moet redactie, retentie en download-URL's ondersteunen zonder
aan te nemen dat elk artifact een normaal lokaal bestand is.

## Beveiligingsmodel

De app-SDK moet expliciet zijn over bevoegdheid.

Aanbevolen token-scopes:

| Scope               | Staat toe                                           |
| ------------------- | -------------------------------------------------- |
| `agent.read`        | Agents weergeven en inspecteren.                   |
| `agent.run`         | Runs starten.                                      |
| `session.read`      | Sessie-metadata en berichten lezen.                |
| `session.write`     | Sessies maken, ernaar verzenden, forken, compacteren en afbreken. |
| `task.read`         | Status van achtergrondtaken lezen.                 |
| `task.write`        | Taaknotificatiebeleid annuleren of wijzigen.       |
| `approval.respond`  | Verzoeken goedkeuren of weigeren.                  |
| `tools.invoke`      | Blootgestelde tools rechtstreeks aanroepen.        |
| `artifacts.read`    | Artifacts weergeven en downloaden.                 |
| `environment.write` | Beheerde omgevingen maken of vernietigen.          |
| `admin`             | Beheerbewerkingen.                                 |

Standaardwaarden:

- standaard geen doorsturen van geheimen
- geen onbeperkte doorvoer van omgevingsvariabelen
- geheime verwijzingen in plaats van geheime waarden
- expliciet sandbox- en netwerkbeleid
- expliciete retentie van remote omgevingen
- goedkeuringen voor hostuitvoering tenzij beleid anders bewijst
- ruwe runtime-gebeurtenissen worden geredigeerd voordat ze de Gateway verlaten, tenzij de aanroeper een
  sterkere diagnostische scope heeft

## Provider voor beheerde omgeving

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
bestaande nodehosts, vluchtige workspaces, CI-achtige runners of Testbox-achtige
omgevingen. Het belangrijke contract is:

1. workspace voorbereiden
2. veilige omgeving en geheimen binden
3. run starten
4. gebeurtenissen streamen
5. artifacts verzamelen
6. opschonen of behouden volgens beleid

Zodra dit stabiel is, kan een gehoste cloudservice hetzelfde providercontract
implementeren.

## Pakketstructuur

Aanbevolen pakketten:

| Pakket                  | Doel                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Openbare SDK op hoog niveau en gegenereerde Gateway-client op laag niveau. |
| `@openclaw/sdk-react`   | Optionele React-hooks voor dashboards en appbouwers.          |
| `@openclaw/sdk-testing` | Testhelpers en nep-Gateway-server voor app-integraties.       |

De repo heeft al `openclaw/plugin-sdk/*` voor plugins. Houd die naamruimte
gescheiden om verwarring tussen Plugin-auteurs en appontwikkelaars te voorkomen.

## Strategie voor gegenereerde client

De client op laag niveau moet worden gegenereerd uit geversioneerde Gateway-protocolschema's
en daarna worden omwikkeld door handgeschreven ergonomische klassen.

Gelaagdheid:

1. Gateway-schema als bron van waarheid.
2. Gegenereerde TypeScript-client op laag niveau.
3. Runtimevalidators voor externe invoer en eventpayloads.
4. Hoogwaardige wrappers voor `OpenClaw`, `Agent`, `Session`, `Run`, `Task` en `Artifact`.
5. Cookbook-voorbeelden en integratietests.

Voordelen:

- protocoldrift is zichtbaar
- tests kunnen gegenereerde methoden vergelijken met Gateway-exports
- App-SDK blijft onafhankelijk van interne onderdelen van de Plugin-SDK
- consumenten op laag niveau behouden volledige protocoltoegang
- consumenten op hoog niveau krijgen de kleine product-API

## Gerelateerd

- [OpenClaw App-SDK](/nl/concepts/openclaw-sdk)
- [Gateway-RPC-referentie](/nl/reference/rpc)
- [Agentlus](/nl/concepts/agent-loop)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP-agents](/nl/tools/acp-agents)
- [Plugin-SDK-overzicht](/nl/plugins/sdk-overview)
