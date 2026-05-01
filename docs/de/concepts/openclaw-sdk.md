---
read_when:
    - Sie erstellen eine externe App, ein Skript, ein Dashboard, einen CI-Job oder eine IDE-Erweiterung, die mit OpenClaw kommuniziert.
    - Sie wählen zwischen dem App SDK und dem Plugin SDK
    - Sie integrieren mit Gateway-Agentenläufen, Sitzungen, Ereignissen, Genehmigungen, Modellen oder Tools
sidebarTitle: App SDK
summary: Öffentliches OpenClaw App SDK für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen
title: OpenClaw-App-SDK
x-i18n:
    generated_at: "2026-05-01T06:41:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Das **OpenClaw App SDK** ist die öffentliche Client-API für Apps außerhalb des
OpenClaw-Prozesses. Verwenden Sie `@openclaw/sdk`, wenn ein Skript, Dashboard, CI-Job, eine IDE-
Erweiterung oder eine andere externe App eine Verbindung zum Gateway herstellen, Agent-
Ausführungen starten, Ereignisse streamen, auf Ergebnisse warten, Arbeit abbrechen oder Gateway-
Ressourcen prüfen soll.

<Note>
  Das App SDK unterscheidet sich vom [Plugin SDK](/de/plugins/sdk-overview).
  `@openclaw/sdk` kommuniziert von außerhalb von OpenClaw mit dem Gateway.
  `openclaw/plugin-sdk/*` ist nur für Plugins vorgesehen, die innerhalb von OpenClaw laufen und
  Provider, Kanäle, Tools, Hooks oder vertrauenswürdige Laufzeitumgebungen registrieren.
</Note>

## Was Heute Ausgeliefert Wird

`@openclaw/sdk` wird ausgeliefert mit:

| Oberfläche                | Status        | Funktion                                                                     |
| ------------------------- | ------------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Bereit        | Haupteinstiegspunkt des Clients. Verwaltet Transport, Verbindung, Anfragen und Ereignisse. |
| `GatewayClientTransport`  | Bereit        | WebSocket-Transport, der vom Gateway-Client gestützt wird.                   |
| `oc.agents`               | Bereit        | Listet, erstellt, aktualisiert, löscht Agenten-Handles und ruft sie ab.     |
| `Agent.run()`             | Bereit        | Startet eine Gateway-`agent`-Ausführung und gibt einen `Run` zurück.        |
| `oc.runs`                 | Bereit        | Erstellt, ruft ab, wartet auf, bricht ab und streamt Ausführungen.          |
| `Run.events()`            | Bereit        | Streamt normalisierte Ereignisse pro Ausführung mit Wiedergabe für schnelle Ausführungen. |
| `Run.wait()`              | Bereit        | Ruft `agent.wait` auf und gibt ein stabiles `RunResult` zurück.             |
| `Run.cancel()`            | Bereit        | Ruft `sessions.abort` anhand der Ausführungs-ID auf, mit Sitzungsschlüssel, falls verfügbar. |
| `oc.sessions`             | Bereit        | Erstellt, löst auf, sendet an, patcht, komprimiert und ruft Sitzungs-Handles ab. |
| `Session.send()`          | Bereit        | Ruft `sessions.send` auf und gibt einen `Run` zurück.                       |
| `oc.models`               | Bereit        | Ruft `models.list` und das aktuelle Status-RPC `models.authStatus` auf.     |
| `oc.tools`                | Teilweise     | Listet Tool-Katalog und wirksame Tools; direkter Tool-Aufruf ist nicht verdrahtet. |
| `oc.artifacts`            | Bereit        | Listet Gateway-Transkriptartefakte, ruft sie ab und lädt sie herunter.      |
| `oc.approvals`            | Bereit        | Listet und löst Exec-Genehmigungen über Gateway-Genehmigungs-RPCs.          |
| `oc.rawEvents()`          | Bereit        | Stellt rohe Gateway-Ereignisse für fortgeschrittene Verbraucher bereit.     |
| `normalizeGatewayEvent()` | Bereit        | Wandelt rohe Gateway-Ereignisse in die stabile SDK-Ereignisform um.         |

Das SDK exportiert außerdem die von diesen Oberflächen verwendeten Kerntypen:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` und zugehörige
Ergebnistypen.

## Mit Einem Gateway Verbinden

Erstellen Sie einen Client mit einer expliziten Gateway-URL oder injizieren Sie einen benutzerdefinierten Transport für
Tests und eingebettete App-Laufzeitumgebungen.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` entspricht `url`. Die Option
`gateway: "auto"` wird vom Konstruktor akzeptiert, aber automatische Gateway-
Erkennung ist noch kein eigenständiges SDK-Feature; übergeben Sie `url`, wenn die App nicht
bereits weiß, wie sie das Gateway erkennen kann.

Übergeben Sie für Tests ein Objekt, das `OpenClawTransport` implementiert:

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

## Einen Agenten Ausführen

Verwenden Sie `oc.agents.get(id)`, wenn die App einen Agenten-Handle benötigt, und rufen Sie dann
`agent.run()` auf.

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

Provider-qualifizierte Modellreferenzen wie `openai/gpt-5.5` werden in Gateway-
Überschreibungen für `provider` und `model` aufgeteilt. `timeoutMs` bleibt im SDK in Millisekunden und
wird für das `agent`-RPC in Gateway-Timeout-Sekunden umgerechnet.

`run.wait()` verwendet das Gateway-RPC `agent.wait`. Eine Wartefrist, die abläuft,
während die Ausführung noch aktiv ist, gibt `status: "accepted"` zurück, statt so zu tun,
als ob die Ausführung selbst ein Timeout erreicht hätte. Laufzeit-Timeouts, abgebrochene Ausführungen und stornierte Ausführungen werden
zu `timed_out` oder `cancelled` normalisiert.

## Sitzungen Erstellen Und Wiederverwenden

Verwenden Sie Sitzungen, wenn die App dauerhaften Transkriptzustand benötigt.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` ruft `sessions.send` auf und gibt einen `Run` zurück. Sitzungs-Handles unterstützen außerdem:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Ereignisse Streamen

Das SDK normalisiert rohe Gateway-Ereignisse in einen stabilen `OpenClawEvent`-Umschlag:

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

Häufige Ereignistypen umfassen:

| Ereignistyp          | Gateway-Quellereignis                     |
| -------------------- | ------------------------------------------ |
| `run.started`         | Start des `agent`-Lebenszyklus             |
| `run.completed`       | Ende des `agent`-Lebenszyklus              |
| `run.failed`          | Fehler im `agent`-Lebenszyklus             |
| `run.cancelled`       | Abgebrochenes/storniertes Lebenszyklusende |
| `run.timed_out`       | Lebenszyklusende durch Timeout             |
| `assistant.delta`     | Streaming-Delta des Assistenten            |
| `assistant.message`   | Assistentennachricht                       |
| `thinking.delta`      | Denk- oder Planstream                      |
| `tool.call.started`   | Start von Tool/Element/Befehl              |
| `tool.call.delta`     | Aktualisierung von Tool/Element/Befehl     |
| `tool.call.completed` | Abschluss von Tool/Element/Befehl          |
| `tool.call.failed`    | Fehler oder blockierter Status von Tool/Element/Befehl |
| `approval.requested`  | Exec- oder Plugin-Genehmigungsanfrage      |
| `approval.resolved`   | Exec- oder Plugin-Genehmigungsauflösung    |
| `session.created`     | `sessions.changed`-Erstellung              |
| `session.updated`     | `sessions.changed`-Aktualisierung          |
| `session.compacted`   | `sessions.changed`-Compaction              |
| `task.updated`        | Aufgabenaktualisierungsereignisse          |
| `artifact.updated`    | Patch-Stream-Ereignisse                    |
| `raw`                 | Jedes Ereignis ohne stabile SDK-Zuordnung  |

`Run.events()` filtert Ereignisse auf eine Ausführungs-ID und spielt bereits gesehene Ereignisse für
schnelle Ausführungen erneut ab. Das bedeutet, dass der dokumentierte Ablauf sicher ist:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Verwenden Sie für appweite Streams `oc.events()`. Verwenden Sie für rohe Gateway-Frames
`oc.rawEvents()`.

## Modelle, Tools, Artefakte Und Genehmigungen

Modellhelfer ordnen aktuellen Gateway-Methoden zu:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Tool-Helfer stellen den Gateway-Katalog und die Ansicht der wirksamen Tools bereit:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Artefakt-Helfer stellen die Gateway-Artefaktprojektion für Sitzungs-, Ausführungs- oder
Aufgabenkontext bereit. Jeder Aufruf erfordert genau einen expliziten Geltungsbereich `sessionKey`, `runId` oder
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

Genehmigungshelfer verwenden die Exec-Genehmigungs-RPCs:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Heute Explizit Nicht Unterstützt

Das SDK enthält Namen für das Produktmodell, das wir anstreben, gibt aber nicht stillschweigend vor,
dass Gateway-RPCs existieren. Diese Aufrufe lösen derzeit explizite Fehler für nicht unterstützte
Funktionen aus:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Die Felder `workspace`, `runtime`, `environment` und `approvals` pro Ausführung sind als
zukünftige Form typisiert, aber das aktuelle Gateway unterstützt diese Überschreibungen beim
`agent`-RPC nicht. Wenn Aufrufer sie übergeben, löst das SDK vor dem Absenden der Ausführung einen Fehler aus,
damit Arbeit nicht versehentlich mit standardmäßigem Workspace-, Laufzeitumgebungs-,
Environment- oder Genehmigungsverhalten ausgeführt wird.

## App SDK Im Vergleich Zum Plugin SDK

Verwenden Sie das App SDK, wenn Code außerhalb von OpenClaw lebt:

- Node-Skripte, die Agent-Ausführungen starten oder beobachten
- CI-Jobs, die ein Gateway aufrufen
- Dashboards und Admin-Panels
- IDE-Erweiterungen
- externe Bridges, die nicht zu Kanal-Plugins werden müssen
- Integrationstests mit gefälschten oder echten Gateway-Transporten

Verwenden Sie das Plugin SDK, wenn Code innerhalb von OpenClaw läuft:

- Provider-Plugins
- Kanal-Plugins
- Tool- oder Lebenszyklus-Hooks
- Agent-Harness-Plugins
- vertrauenswürdige Laufzeithelfer

App-SDK-Code sollte aus `@openclaw/sdk` importieren. Plugin-Code sollte aus den
dokumentierten Unterpfaden `openclaw/plugin-sdk/*` importieren. Vermischen Sie die beiden Verträge nicht.

## Zugehörige Dokumentation

- [OpenClaw App SDK-API-Design](/de/reference/openclaw-sdk-api-design)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Sitzungen](/de/concepts/session)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Plugin SDK-Überblick](/de/plugins/sdk-overview)
