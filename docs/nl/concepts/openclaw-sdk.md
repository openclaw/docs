---
read_when:
    - Je bouwt een externe app, script, dashboard, CI-taak of IDE-extensie die communiceert met OpenClaw
    - Je kiest tussen de App SDK en de Plugin SDK
    - Je integreert met Gateway-agentuitvoeringen, sessies, gebeurtenissen, goedkeuringen, modellen of hulpmiddelen
sidebarTitle: App SDK
summary: Openbare OpenClaw App SDK voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
title: OpenClaw App-SDK
x-i18n:
    generated_at: "2026-05-06T09:09:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

De **OpenClaw App SDK** is de openbare client-API voor apps buiten het
OpenClaw-proces. Gebruik `@openclaw/sdk` wanneer een script, dashboard, CI-taak,
IDE-extensie of andere externe app verbinding wil maken met de Gateway, agentruns
wil starten, events wil streamen, op resultaten wil wachten, werk wil annuleren
of Gateway-resources wil inspecteren.

<Note>
  De App SDK verschilt van de [Plugin SDK](/nl/plugins/sdk-overview).
  `@openclaw/sdk` communiceert vanaf buiten OpenClaw met de Gateway.
  `openclaw/plugin-sdk/*` is alleen bedoeld voor plugins die binnen OpenClaw draaien en
  providers, kanalen, tools, hooks of vertrouwde runtimes registreren.
</Note>

## Wat vandaag wordt meegeleverd

`@openclaw/sdk` wordt meegeleverd met:

| Oppervlak                 | Status  | Wat het doet                                                                      |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Gereed  | Hoofdentrypoint voor de client. Beheert transport, verbinding, requests en events. |
| `GatewayClientTransport`  | Gereed  | WebSocket-transport ondersteund door de Gateway-client.                           |
| `oc.agents`               | Gereed  | Toont, maakt, werkt bij, verwijdert en haalt agenthandles op.                     |
| `Agent.run()`             | Gereed  | Start een Gateway-`agent`-run en retourneert een `Run`.                           |
| `oc.runs`                 | Gereed  | Maakt, haalt op, wacht op, annuleert en streamt runs.                             |
| `Run.events()`            | Gereed  | Streamt genormaliseerde events per run met replay voor snelle runs.               |
| `Run.wait()`              | Gereed  | Roept `agent.wait` aan en retourneert een stabiele `RunResult`.                   |
| `Run.cancel()`            | Gereed  | Roept `sessions.abort` aan op run-id, met sessiesleutel wanneer beschikbaar.       |
| `oc.sessions`             | Gereed  | Maakt, lost op, verzendt naar, patcht, compacteert en haalt sessiehandles op.     |
| `Session.send()`          | Gereed  | Roept `sessions.send` aan en retourneert een `Run`.                               |
| `oc.models`               | Gereed  | Roept `models.list` en de huidige status-RPC `models.authStatus` aan.             |
| `oc.tools`                | Gereed  | Toont, scoped en roept Gateway-tools aan via de beleids-pipeline.                 |
| `oc.artifacts`            | Gereed  | Toont, haalt op en downloadt Gateway-transcriptartefacten.                        |
| `oc.approvals`            | Gereed  | Toont en lost uitvoeringsgoedkeuringen op via Gateway-goedkeurings-RPC’s.         |
| `oc.environments`         | Gedeeltelijk | Toont Gateway-lokale en node-omgevingskandidaten; aanmaken/verwijderen is niet aangesloten. |
| `oc.rawEvents()`          | Gereed  | Stelt ruwe Gateway-events beschikbaar voor geavanceerde consumers.                |
| `normalizeGatewayEvent()` | Gereed  | Zet ruwe Gateway-events om naar de stabiele SDK-eventvorm.                        |

De SDK exporteert ook de kerntypen die door die oppervlakken worden gebruikt:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` en gerelateerde
resultaattypen.

## Verbinden met een Gateway

Maak een client met een expliciete Gateway-URL, of injecteer een aangepast transport voor
tests en ingebedde app-runtimes.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` is gelijkwaardig aan `url`. De
optie `gateway: "auto"` wordt door de constructor geaccepteerd, maar automatische Gateway-
detectie is nog geen afzonderlijke SDK-functie; geef `url` door wanneer de app niet
al weet hoe de Gateway moet worden ontdekt.

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

Gebruik `oc.agents.get(id)` wanneer de app een agenthandle wil, en roep daarna
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

Providergekwalificeerde modelreferenties zoals `openai/gpt-5.5` worden opgesplitst in Gateway-
overschrijvingen voor `provider` en `model`. `timeoutMs` blijft in de SDK milliseconden en
wordt voor de `agent`-RPC omgezet naar Gateway-time-outseconden.

`run.wait()` gebruikt de Gateway-`agent.wait`-RPC. Een wachtdeadline die verloopt
terwijl de run nog actief is, retourneert `status: "accepted"` in plaats van te doen alsof
de run zelf een time-out heeft gehad. Runtime-time-outs, afgebroken runs en geannuleerde runs worden
genormaliseerd naar `timed_out` of `cancelled`.

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

`Session.send()` roept `sessions.send` aan en retourneert een `Run`. Sessiehandles ondersteunen ook:

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
| --------------------- | ------------------------------------------- |
| `run.started`         | Start van `agent`-levenscyclus              |
| `run.completed`       | Einde van `agent`-levenscyclus              |
| `run.failed`          | Fout in `agent`-levenscyclus                |
| `run.cancelled`       | Einde van afgebroken/geannuleerde levenscyclus |
| `run.timed_out`       | Einde van time-outlevenscyclus              |
| `assistant.delta`     | Streamingdelta van assistant                |
| `assistant.message`   | Assistantbericht                            |
| `thinking.delta`      | Denk- of planstream                         |
| `tool.call.started`   | Start van tool/item/command                 |
| `tool.call.delta`     | Update van tool/item/command                |
| `tool.call.completed` | Voltooiing van tool/item/command            |
| `tool.call.failed`    | Mislukking of geblokkeerde status van tool/item/command |
| `approval.requested`  | Aanvraag voor uitvoerings- of plugingoedkeuring |
| `approval.resolved`   | Oplossing van uitvoerings- of plugingoedkeuring |
| `session.created`     | `sessions.changed` aanmaken                 |
| `session.updated`     | `sessions.changed` update                   |
| `session.compacted`   | `sessions.changed` compactie                |
| `task.updated`        | Taakupdate-events                           |
| `artifact.updated`    | Patchstream-events                          |
| `raw`                 | Elk event zonder stabiele SDK-mapping tot nu toe |

`Run.events()` filtert events op één run-id en speelt al geziene events opnieuw af voor
snelle runs. Dat betekent dat de gedocumenteerde flow veilig is:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Gebruik `oc.events()` voor app-brede streams. Gebruik
`oc.rawEvents()` voor ruwe Gateway-frames.

## Modellen, tools, artefacten en goedkeuringen

Modelhelpers mappen naar huidige Gateway-methoden:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Toolhelpers stellen de Gateway-catalogus, effectieve toolweergave en directe
Gateway-toolaanroep beschikbaar. `oc.tools.invoke()` retourneert een getypte envelop in plaats
van te throwen bij weigeringen door beleid of goedkeuring.

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

Artefacthelpers stellen de Gateway-artefactprojectie beschikbaar voor sessie-, run- of
taakcontext. Elke call vereist één expliciete scope met `sessionKey`, `runId` of
`taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Goedkeuringshelpers gebruiken de uitvoeringsgoedkeurings-RPC’s:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Omgevingshelpers stellen alleen-lezen Gateway-lokale en node-detectie beschikbaar:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Vandaag expliciet niet ondersteund

De SDK bevat namen voor het productmodel dat we willen, maar doet niet stilzwijgend
alsof Gateway-RPC’s bestaan. Deze calls throwen momenteel expliciete niet-ondersteund-
fouten:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Per-runvelden `workspace`, `runtime`, `environment` en `approvals` zijn getypt
als toekomstige vorm, maar de huidige Gateway ondersteunt die overschrijvingen niet op
de `agent`-RPC. Als callers ze doorgeven, throwt de SDK voordat de run wordt ingediend,
zodat werk niet per ongeluk wordt uitgevoerd met standaardgedrag voor workspace, runtime,
omgeving of goedkeuring.

## App SDK versus Plugin SDK

Gebruik de App SDK wanneer code buiten OpenClaw leeft:

- Node-scripts die agentruns starten of observeren
- CI-taken die een Gateway aanroepen
- dashboards en beheerderspanelen
- IDE-extensies
- externe bridges die geen kanaalplugins hoeven te worden
- integratietests met neppe of echte Gateway-transports

Gebruik de Plugin SDK wanneer code binnen OpenClaw draait:

- providerplugins
- kanaalplugins
- tool- of levenscyclus-hooks
- agentharnas-plugins
- vertrouwde runtimehelpers

App SDK-code moet importeren uit `@openclaw/sdk`. Plugincode moet importeren uit
gedocumenteerde subpaden onder `openclaw/plugin-sdk/*`. Meng de twee contracten niet.

## Gerelateerd

- [OpenClaw App SDK API-ontwerp](/nl/reference/openclaw-sdk-api-design)
- [Gateway RPC-referentie](/nl/reference/rpc)
- [Agentloop](/nl/concepts/agent-loop)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Sessies](/nl/concepts/session)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP-agents](/nl/tools/acp-agents)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
