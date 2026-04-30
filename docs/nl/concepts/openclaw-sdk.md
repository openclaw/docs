---
read_when:
    - Je bouwt een externe app, script, dashboard, CI-taak of IDE-extensie die met OpenClaw communiceert
    - Je kiest tussen de App SDK en de Plugin SDK
    - Je integreert met Gateway-agentuitvoeringen, sessies, gebeurtenissen, goedkeuringen, modellen of hulpmiddelen
sidebarTitle: App SDK
summary: Publieke OpenClaw App SDK voor externe apps, scripts, dashboards, CI-taken en IDE-extensies
title: OpenClaw App-SDK
x-i18n:
    generated_at: "2026-04-30T09:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

De **OpenClaw App SDK** is de openbare client-API voor apps buiten het
OpenClaw-proces. Gebruik `@openclaw/sdk` wanneer een script, dashboard, CI-taak, IDE-
extensie of andere externe app verbinding wil maken met de Gateway, agent-
runs wil starten, gebeurtenissen wil streamen, op resultaten wil wachten, werk
wil annuleren of Gateway-resources wil inspecteren.

<Note>
  De App SDK verschilt van de [Plugin SDK](/nl/plugins/sdk-overview).
  `@openclaw/sdk` communiceert van buiten OpenClaw met de Gateway.
  `openclaw/plugin-sdk/*` is alleen voor plugins die binnen OpenClaw draaien en
  providers, kanalen, tools, hooks of vertrouwde runtimes registreren.
</Note>

## Wat Vandaag Wordt Meegeleverd

`@openclaw/sdk` wordt geleverd met:

| Oppervlak                 | Status     | Wat het doet                                                                 |
| ------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Gereed     | Hoofdinstappunt voor de client. Beheert transport, verbinding, requests en gebeurtenissen. |
| `GatewayClientTransport`  | Gereed     | WebSocket-transport ondersteund door de Gateway-client.                      |
| `oc.agents`               | Gereed     | Toont, maakt, werkt bij, verwijdert en haalt agent-handles op.               |
| `Agent.run()`             | Gereed     | Start een Gateway-`agent`-run en retourneert een `Run`.                      |
| `oc.runs`                 | Gereed     | Maakt, haalt op, wacht op, annuleert en streamt runs.                        |
| `Run.events()`            | Gereed     | Streamt genormaliseerde gebeurtenissen per run met replay voor snelle runs.  |
| `Run.wait()`              | Gereed     | Roept `agent.wait` aan en retourneert een stabiele `RunResult`.              |
| `Run.cancel()`            | Gereed     | Roept `sessions.abort` aan op run-id, met sessiesleutel wanneer beschikbaar. |
| `oc.sessions`             | Gereed     | Maakt, lost op, verzendt naar, patcht, comprimeert en haalt sessie-handles op. |
| `Session.send()`          | Gereed     | Roept `sessions.send` aan en retourneert een `Run`.                          |
| `oc.models`               | Gereed     | Roept `models.list` en de huidige `models.authStatus`-status-RPC aan.        |
| `oc.tools`                | Gedeeltelijk | Toont toolcatalogus en effectieve tools; directe toolaanroep is niet aangesloten. |
| `oc.approvals`            | Gereed     | Toont en verwerkt exec-goedkeuringen via Gateway-goedkeurings-RPC's.         |
| `oc.rawEvents()`          | Gereed     | Stelt ruwe Gateway-gebeurtenissen beschikbaar voor geavanceerde consumenten. |
| `normalizeGatewayEvent()` | Gereed     | Zet ruwe Gateway-gebeurtenissen om naar de stabiele SDK-gebeurtenisvorm.     |

De SDK exporteert ook de kerntypen die door deze oppervlakken worden gebruikt:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` en gerelateerde resultaattypen.

## Verbinden Met Een Gateway

Maak een client met een expliciete Gateway-URL, of injecteer een aangepast transport voor
tests en ingesloten app-runtimes.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` is gelijkwaardig aan `url`. De optie
`gateway: "auto"` wordt door de constructor geaccepteerd, maar automatische Gateway-
detectie is nog geen afzonderlijke SDK-functie; geef `url` door wanneer de app nog
niet weet hoe de Gateway moet worden gevonden.

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

## Een Agent Uitvoeren

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

Provider-gekwalificeerde modelreferenties zoals `openai/gpt-5.5` worden opgesplitst in Gateway-
overrides voor `provider` en `model`. `timeoutMs` blijft in de SDK in milliseconden
en wordt voor de `agent`-RPC omgezet naar Gateway-time-outseconden.

`run.wait()` gebruikt de Gateway-`agent.wait`-RPC. Een wachtdedline die verloopt
terwijl de run nog actief is, retourneert `status: "accepted"` in plaats van te doen alsof
de run zelf een time-out had. Runtime-time-outs, afgebroken runs en geannuleerde runs worden
genormaliseerd naar `timed_out` of `cancelled`.

## Sessies Maken En Hergebruiken

Gebruik sessies wanneer de app duurzame transcriptstatus wil.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` roept `sessions.send` aan en retourneert een `Run`. Sessie-handles ondersteunen ook:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Gebeurtenissen Streamen

De SDK normaliseert ruwe Gateway-gebeurtenissen naar een stabiele `OpenClawEvent`-envelop:

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

Veelvoorkomende gebeurtenistypen zijn onder meer:

| Gebeurtenistype       | Bron-Gateway-gebeurtenis                    |
| --------------------- | ------------------------------------------- |
| `run.started`         | Start van `agent`-levenscyclus              |
| `run.completed`       | Einde van `agent`-levenscyclus              |
| `run.failed`          | Fout in `agent`-levenscyclus                |
| `run.cancelled`       | Einde van afgebroken/geannuleerde levenscyclus |
| `run.timed_out`       | Einde van levenscyclus door time-out        |
| `assistant.delta`     | Streaming delta van assistent               |
| `assistant.message`   | Bericht van assistent                       |
| `thinking.delta`      | Denk- of planstream                         |
| `tool.call.started`   | Start van tool/item/opdracht                |
| `tool.call.delta`     | Update van tool/item/opdracht               |
| `tool.call.completed` | Voltooiing van tool/item/opdracht           |
| `tool.call.failed`    | Mislukking of geblokkeerde status van tool/item/opdracht |
| `approval.requested`  | Exec- of plugin-goedkeuringsaanvraag        |
| `approval.resolved`   | Exec- of plugin-goedkeuringsafhandeling     |
| `session.created`     | `sessions.changed` create                   |
| `session.updated`     | `sessions.changed` update                   |
| `session.compacted`   | `sessions.changed` compaction               |
| `task.updated`        | Taakupdategebeurtenissen                    |
| `artifact.updated`    | Patchstreamgebeurtenissen                   |
| `raw`                 | Elke gebeurtenis zonder stabiele SDK-mapping tot nu toe |

`Run.events()` filtert gebeurtenissen op één run-id en speelt al geziene gebeurtenissen opnieuw af voor
snelle runs. Dat betekent dat de gedocumenteerde flow veilig is:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Gebruik `oc.events()` voor app-brede streams. Gebruik `oc.rawEvents()` voor ruwe Gateway-frames.

## Modellen, Tools En Goedkeuringen

Modelhelpers mappen naar huidige Gateway-methoden:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Toolhelpers stellen de Gateway-catalogus en effectieve toolweergave beschikbaar:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Goedkeuringshelpers gebruiken de exec-goedkeurings-RPC's:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Vandaag Expliciet Niet Ondersteund

De SDK bevat namen voor het productmodel dat we willen, maar doet niet stilzwijgend
alsof Gateway-RPC's bestaan. Deze aanroepen geven momenteel expliciete fouten voor niet-ondersteuning:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Per-run velden `workspace`, `runtime`, `environment` en `approvals` zijn getypeerd
als toekomstige vorm, maar de huidige Gateway ondersteunt deze overrides niet op
de `agent`-RPC. Als callers ze doorgeven, gooit de SDK een fout voordat de run wordt ingediend,
zodat werk niet per ongeluk wordt uitgevoerd met standaardgedrag voor workspace, runtime,
omgeving of goedkeuring.

## App SDK Versus Plugin SDK

Gebruik de App SDK wanneer code buiten OpenClaw leeft:

- Node-scripts die agent-runs starten of observeren
- CI-taken die een Gateway aanroepen
- dashboards en beheerderspanelen
- IDE-extensies
- externe bridges die geen kanaalplugins hoeven te worden
- integratietests met neppe of echte Gateway-transports

Gebruik de Plugin SDK wanneer code binnen OpenClaw draait:

- providerplugins
- kanaalplugins
- tool- of levenscyclus-hooks
- agent-harnasplugins
- vertrouwde runtimehelpers

App SDK-code moet importeren uit `@openclaw/sdk`. Plugin-code moet importeren uit
gedocumenteerde `openclaw/plugin-sdk/*`-subpaden. Meng de twee contracten niet.

## Gerelateerde Documentatie

- [OpenClaw App SDK API-ontwerp](/nl/reference/openclaw-sdk-api-design)
- [Gateway RPC-referentie](/nl/reference/rpc)
- [Agent-loop](/nl/concepts/agent-loop)
- [Agent-runtimes](/nl/concepts/agent-runtimes)
- [Sessies](/nl/concepts/session)
- [Achtergrondtaken](/nl/automation/tasks)
- [ACP agents](/nl/tools/acp-agents)
- [Plugin SDK-overzicht](/nl/plugins/sdk-overview)
