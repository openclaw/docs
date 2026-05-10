---
read_when:
    - Je bouwt een externe app, een script, een dashboard, een CI-taak of een IDE-extensie die met OpenClaw communiceert
    - Je kiest tussen de App SDK en de Plugin SDK
    - Je integreert met Gateway-agentuitvoeringen, sessies, gebeurtenissen, goedkeuringen, modellen of tools
sidebarTitle: App SDK
summary: Publieke OpenClaw App SDK voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
title: OpenClaw-app-SDK
x-i18n:
    generated_at: "2026-05-10T19:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

De **OpenClaw App SDK** is de openbare client-API voor apps buiten het
OpenClaw-proces. Gebruik `@openclaw/sdk` wanneer een script, dashboard, CI-taak,
IDE-extensie of andere externe app verbinding wil maken met de Gateway,
agent-uitvoeringen wil starten, events wil streamen, op resultaten wil wachten,
werk wil annuleren of Gateway-resources wil inspecteren.

<Note>
  De App SDK is anders dan de [Plugin SDK](/nl/plugins/sdk-overview).
  `@openclaw/sdk` praat met de Gateway van buiten OpenClaw.
  `openclaw/plugin-sdk/*` is alleen voor plugins die binnen OpenClaw draaien en
  providers, kanalen, tools, hooks of vertrouwde runtimes registreren.
</Note>

## Wat vandaag wordt meegeleverd

`@openclaw/sdk` wordt geleverd met:

| Oppervlak                | Status        | Wat het doet                                                                      |
| ------------------------ | ------------- | --------------------------------------------------------------------------------- |
| `OpenClaw`               | Gereed        | Belangrijkste client-entrypoint. Beheert transport, verbinding, aanvragen en events. |
| `GatewayClientTransport` | Gereed        | WebSocket-transport ondersteund door de Gateway-client.                           |
| `oc.agents`              | Gereed        | Geeft agent-handles weer, maakt ze aan, werkt ze bij, verwijdert ze en haalt ze op. |
| `Agent.run()`            | Gereed        | Start een Gateway-`agent`-uitvoering en retourneert een `Run`.                    |
| `oc.runs`                | Gereed        | Maakt uitvoeringen aan, haalt ze op, wacht erop, annuleert ze en streamt ze.      |
| `Run.events()`           | Gereed        | Streamt genormaliseerde events per uitvoering, met replay voor snelle uitvoeringen. |
| `Run.wait()`             | Gereed        | Roept `agent.wait` aan en retourneert een stabiele `RunResult`.                   |
| `Run.cancel()`           | Gereed        | Roept `sessions.abort` aan op run-id, met sessiesleutel wanneer beschikbaar.      |
| `oc.sessions`            | Gereed        | Maakt sessie-handles aan, resolveert ze, stuurt ernaar, patcht ze, compacteert ze en haalt ze op. |
| `Session.send()`         | Gereed        | Roept `sessions.send` aan en retourneert een `Run`.                               |
| `oc.tasks`               | Gereed        | Geeft Gateway-taakledgeritems weer, leest ze en annuleert ze.                     |
| `oc.models`              | Gereed        | Roept `models.list` en de huidige status-RPC `models.authStatus` aan.             |
| `oc.tools`               | Gereed        | Geeft Gateway-tools weer, scoped ze en roept ze aan via de policy-pijplijn.       |
| `oc.artifacts`           | Gereed        | Geeft Gateway-transcriptartefacten weer, haalt ze op en downloadt ze.             |
| `oc.approvals`           | Gereed        | Geeft exec-goedkeuringen weer en resolveert ze via Gateway-goedkeurings-RPC's.    |
| `oc.environments`        | Gedeeltelijk  | Geeft Gateway-lokale en node-omgevingskandidaten weer; aanmaken/verwijderen is niet aangesloten. |
| `oc.rawEvents()`         | Gereed        | Stelt ruwe Gateway-events beschikbaar voor geavanceerde consumenten.              |
| `normalizeGatewayEvent()` | Gereed       | Converteert ruwe Gateway-events naar de stabiele SDK-eventvorm.                   |

De SDK exporteert ook de kerntypen die door deze oppervlakken worden gebruikt:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` en gerelateerde
resultaattypen.

## Verbinden met een Gateway

Maak een client met een expliciete Gateway-URL, of injecteer een aangepast
transport voor tests en ingebedde app-runtimes.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` is gelijkwaardig aan `url`. De optie
`gateway: "auto"` wordt door de constructor geaccepteerd, maar automatische
Gateway-detectie is nog geen afzonderlijke SDK-functie; geef `url` door wanneer
de app nog niet weet hoe de Gateway moet worden ontdekt.

Geef voor tests een object door dat `OpenClawTransport` implementeert:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Een agent uitvoeren

Gebruik `oc.agents.get(id)` wanneer de app een agent-handle wil, en roep daarna
`agent.run()` aan.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

Provider-gekwalificeerde modelreferenties zoals `openai/gpt-5.5` worden
gesplitst in Gateway-overschrijvingen voor `provider` en `model`. `timeoutMs`
blijft in de SDK milliseconden en wordt voor de `agent`-RPC geconverteerd naar
Gateway-timeoutseconden.

`run.wait()` gebruikt de Gateway-`agent.wait`-RPC. Een wachtdeadline die
verloopt terwijl de uitvoering nog actief is, retourneert `status: "accepted"`
in plaats van te doen alsof de uitvoering zelf een timeout had. Runtime-timeouts,
afgebroken uitvoeringen en geannuleerde uitvoeringen worden genormaliseerd naar
`timed_out` of `cancelled`.

## Sessies maken en hergebruiken

Gebruik sessies wanneer de app duurzame transcriptstatus wil.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` roept `sessions.send` aan en retourneert een `Run`.
Sessie-handles ondersteunen ook:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Events streamen

De SDK normaliseert ruwe Gateway-events naar een stabiele `OpenClawEvent`-envelop:

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
  raw?: GatewayEvent;
};
```

Veelvoorkomende eventtypen zijn:

| Eventtype             | Bron-Gateway-event                         |
| --------------------- | ------------------------------------------ |
| `run.started`         | Begin van `agent`-levenscyclus             |
| `run.completed`       | Einde van `agent`-levenscyclus             |
| `run.failed`          | Fout in `agent`-levenscyclus               |
| `run.cancelled`       | Einde van afgebroken/geannuleerde levenscyclus |
| `run.timed_out`       | Einde van timeout-levenscyclus             |
| `assistant.delta`     | Streamingdelta van assistant               |
| `assistant.message`   | Bericht van assistant                      |
| `thinking.delta`      | Denk- of planstream                        |
| `tool.call.started`   | Start van tool/item/opdracht               |
| `tool.call.delta`     | Update van tool/item/opdracht              |
| `tool.call.completed` | Voltooiing van tool/item/opdracht          |
| `tool.call.failed`    | Fout of geblokkeerde status van tool/item/opdracht |
| `approval.requested`  | Exec- of Plugin-goedkeuringsaanvraag       |
| `approval.resolved`   | Exec- of Plugin-goedkeuringsresolutie      |
| `session.created`     | Aanmaken via `sessions.changed`            |
| `session.updated`     | Update via `sessions.changed`              |
| `session.compacted`   | Compaction via `sessions.changed`          |
| `task.updated`        | Taakupdate-events                          |
| `artifact.updated`    | Patchstream-events                         |
| `raw`                 | Elk event zonder stabiele SDK-mapping tot nu toe |

`Run.events()` filtert events op één run-id en speelt al geziene events opnieuw
af voor snelle uitvoeringen. Dat betekent dat de gedocumenteerde flow veilig is:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Gebruik `oc.events()` voor app-brede streams. Gebruik `oc.rawEvents()` voor ruwe
Gateway-frames.

## Modellen, tools, artefacten en goedkeuringen

Modelhelpers mappen naar huidige Gateway-methoden:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Toolhelpers bieden toegang tot de Gateway-catalogus, effectieve toolweergave en
directe Gateway-toolaanroep. `oc.tools.invoke()` retourneert een getypte envelop
in plaats van te throwen bij policy- of goedkeuringsweigeringen.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Artefacthelpers bieden toegang tot de Gateway-artefactprojectie voor sessie-,
run- of taakcontext. Elke aanroep vereist één expliciete scope: `sessionKey`,
`runId` of `taskId`.

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Goedkeuringshelpers gebruiken de exec-goedkeurings-RPC's:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Taakhelpers gebruiken de duurzame taakledger die ook `openclaw tasks` ondersteunt:

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

Omgevingshelpers bieden alleen-lezen Gateway-lokale en node-detectie:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Vandaag expliciet niet ondersteund

De SDK bevat namen voor het productmodel dat we willen, maar doet niet stilzwijgend
alsof Gateway-RPC's bestaan. Deze aanroepen throwen momenteel expliciete
niet-ondersteund-fouten:

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

De velden `workspace`, `runtime`, `environment` en `approvals` per uitvoering
zijn getypt als toekomstige vorm, maar de huidige Gateway ondersteunt deze
overschrijvingen niet op de `agent`-RPC. Als aanroepers ze doorgeven, throwt de
SDK voordat de uitvoering wordt ingediend, zodat werk niet per ongeluk wordt
uitgevoerd met standaardgedrag voor workspace, runtime, omgeving of goedkeuringen.

## App SDK versus Plugin SDK

Gebruik de App SDK wanneer code buiten OpenClaw leeft:

- Node-scripts die agent-uitvoeringen starten of observeren
- CI-taken die een Gateway aanroepen
- dashboards en beheerderspanelen
- IDE-extensies
- externe bridges die geen kanaalplugins hoeven te worden
- integratietests met neppe of echte Gateway-transporten

Gebruik de Plugin SDK wanneer code binnen OpenClaw draait:

- providerplugins
- kanaalplugins
- tool- of levenscyclus-hooks
- agent-harnessplugins
- vertrouwde runtimehelpers

App SDK-code moet importeren uit `@openclaw/sdk`. Plugincode moet importeren uit
gedocumenteerde `openclaw/plugin-sdk/*`-subpaden. Meng de twee contracten niet.

## Gerelateerd

- [OpenClaw App SDK API-ontwerp](/nl/reference/openclaw-sdk-api-design)
- [Gateway RPC-referentie](/nl/reference/rpc)
- [Agentloop](/nl/concepts/agent-loop)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Sessies](/nl/concepts/session)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP-agenten](/nl/tools/acp-agents)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
