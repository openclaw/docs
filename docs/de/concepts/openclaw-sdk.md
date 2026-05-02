---
read_when:
    - Sie erstellen eine externe App, ein Skript, ein Dashboard, einen CI-Job oder eine IDE-Erweiterung, die mit OpenClaw kommuniziert
    - Sie wählen zwischen dem App SDK und dem Plugin SDK
    - Sie binden Gateway-Agentenausführungen, Sitzungen, Ereignisse, Genehmigungen, Modelle oder Tools ein
sidebarTitle: App SDK
summary: Öffentliches OpenClaw App-SDK für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen
title: OpenClaw-App-SDK
x-i18n:
    generated_at: "2026-05-02T06:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Das **OpenClaw App SDK** ist die öffentliche Client-API für Apps außerhalb des
OpenClaw-Prozesses. Verwenden Sie `@openclaw/sdk`, wenn ein Skript, Dashboard,
CI-Job, eine IDE-Erweiterung oder eine andere externe App eine Verbindung zum
Gateway herstellen, Agent-Läufe starten, Ereignisse streamen, auf Ergebnisse
warten, Arbeiten abbrechen oder Gateway-Ressourcen prüfen möchte.

<Note>
  Das App SDK unterscheidet sich vom [Plugin SDK](/de/plugins/sdk-overview).
  `@openclaw/sdk` kommuniziert von außerhalb von OpenClaw mit dem Gateway.
  `openclaw/plugin-sdk/*` ist nur für Plugins gedacht, die innerhalb von OpenClaw
  ausgeführt werden und Provider, Kanäle, Tools, Hooks oder vertrauenswürdige
  Runtimes registrieren.
</Note>

## Was heute ausgeliefert wird

`@openclaw/sdk` wird mit Folgendem ausgeliefert:

| Oberfläche                | Status | Was es tut                                                                 |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | Bereit | Haupteinstiegspunkt des Clients. Verwaltet Transport, Verbindung, Anfragen und Ereignisse. |
| `GatewayClientTransport`  | Bereit | WebSocket-Transport auf Basis des Gateway-Clients.                         |
| `oc.agents`               | Bereit | Listet, erstellt, aktualisiert, löscht und ruft Agent-Handles ab.          |
| `Agent.run()`             | Bereit | Startet einen Gateway-`agent`-Lauf und gibt einen `Run` zurück.             |
| `oc.runs`                 | Bereit | Erstellt, ruft ab, wartet auf, bricht ab und streamt Läufe.                |
| `Run.events()`            | Bereit | Streamt normalisierte Ereignisse pro Lauf mit Replay für schnelle Läufe.    |
| `Run.wait()`              | Bereit | Ruft `agent.wait` auf und gibt ein stabiles `RunResult` zurück.             |
| `Run.cancel()`            | Bereit | Ruft `sessions.abort` nach Lauf-ID auf, mit Sitzungsschlüssel, falls verfügbar. |
| `oc.sessions`             | Bereit | Erstellt, löst auf, sendet an, patcht, komprimiert und ruft Sitzungs-Handles ab. |
| `Session.send()`          | Bereit | Ruft `sessions.send` auf und gibt einen `Run` zurück.                      |
| `oc.models`               | Bereit | Ruft `models.list` und den aktuellen Status-RPC `models.authStatus` auf.    |
| `oc.tools`                | Bereit | Listet, scoped und ruft Gateway-Tools über die Policy-Pipeline auf.         |
| `oc.artifacts`            | Bereit | Listet, ruft ab und lädt Gateway-Transkript-Artefakte herunter.            |
| `oc.approvals`            | Bereit | Listet und löst Exec-Genehmigungen über Gateway-Genehmigungs-RPCs auf.      |
| `oc.rawEvents()`          | Bereit | Stellt rohe Gateway-Ereignisse für fortgeschrittene Consumer bereit.        |
| `normalizeGatewayEvent()` | Bereit | Konvertiert rohe Gateway-Ereignisse in die stabile SDK-Ereignisform.        |

Das SDK exportiert außerdem die Kerntypen, die von diesen Oberflächen verwendet
werden: `AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` und zugehörige
Ergebnistypen.

## Verbindung zu einem Gateway herstellen

Erstellen Sie einen Client mit einer expliziten Gateway-URL oder injizieren Sie
einen benutzerdefinierten Transport für Tests und eingebettete App-Runtimes.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` ist gleichwertig mit `url`. Die Option
`gateway: "auto"` wird vom Konstruktor akzeptiert, aber die automatische
Gateway-Erkennung ist noch kein separates SDK-Feature. Übergeben Sie `url`, wenn
die App nicht bereits weiß, wie sie das Gateway erkennen kann.

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

## Einen Agent ausführen

Verwenden Sie `oc.agents.get(id)`, wenn die App ein Agent-Handle benötigt, und
rufen Sie dann `agent.run()` auf.

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

Provider-qualifizierte Modellreferenzen wie `openai/gpt-5.5` werden in
Gateway-Overrides für `provider` und `model` aufgeteilt. `timeoutMs` bleibt im
SDK in Millisekunden und wird für den `agent`-RPC in Gateway-Timeout-Sekunden
konvertiert.

`run.wait()` verwendet den Gateway-RPC `agent.wait`. Eine Warte-Deadline, die
abläuft, während der Lauf noch aktiv ist, gibt `status: "accepted"` zurück,
anstatt vorzutäuschen, dass der Lauf selbst abgelaufen ist. Runtime-Timeouts,
abgebrochene Läufe und stornierte Läufe werden zu `timed_out` oder `cancelled`
normalisiert.

## Sitzungen erstellen und wiederverwenden

Verwenden Sie Sitzungen, wenn die App dauerhaften Transkriptstatus benötigt.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` ruft `sessions.send` auf und gibt einen `Run` zurück.
Sitzungs-Handles unterstützen außerdem:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Ereignisse streamen

Das SDK normalisiert rohe Gateway-Ereignisse in einen stabilen
`OpenClawEvent`-Envelope:

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

Häufige Ereignistypen sind:

| Ereignistyp          | Gateway-Quellereignis                       |
| -------------------- | ------------------------------------------- |
| `run.started`        | Start des `agent`-Lebenszyklus              |
| `run.completed`      | Ende des `agent`-Lebenszyklus               |
| `run.failed`         | Fehler im `agent`-Lebenszyklus              |
| `run.cancelled`      | Ende eines abgebrochenen/stornierten Lebenszyklus |
| `run.timed_out`      | Ende eines Timeout-Lebenszyklus             |
| `assistant.delta`    | Streaming-Delta des Assistenten             |
| `assistant.message`  | Assistentennachricht                        |
| `thinking.delta`     | Denk- oder Plan-Stream                      |
| `tool.call.started`  | Start von Tool/Item/Befehl                  |
| `tool.call.delta`    | Aktualisierung von Tool/Item/Befehl         |
| `tool.call.completed` | Abschluss von Tool/Item/Befehl             |
| `tool.call.failed`   | Fehler oder blockierter Status von Tool/Item/Befehl |
| `approval.requested` | Exec- oder Plugin-Genehmigungsanfrage       |
| `approval.resolved`  | Exec- oder Plugin-Genehmigungsauflösung     |
| `session.created`    | `sessions.changed` erstellen                |
| `session.updated`    | `sessions.changed` aktualisieren            |
| `session.compacted`  | `sessions.changed` Compaction               |
| `task.updated`       | Aufgabenaktualisierungsereignisse           |
| `artifact.updated`   | Patch-Stream-Ereignisse                     |
| `raw`                | Jedes Ereignis ohne bisher stabiles SDK-Mapping |

`Run.events()` filtert Ereignisse auf eine Lauf-ID und spielt bereits gesehene
Ereignisse für schnelle Läufe erneut ab. Das bedeutet, der dokumentierte Ablauf
ist sicher:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Verwenden Sie für app-weite Streams `oc.events()`. Verwenden Sie für rohe
Gateway-Frames `oc.rawEvents()`.

## Modelle, Tools, Artefakte und Genehmigungen

Modell-Helper werden aktuellen Gateway-Methoden zugeordnet:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Tool-Helper stellen den Gateway-Katalog, die effektive Tool-Ansicht und den
direkten Gateway-Tool-Aufruf bereit. `oc.tools.invoke()` gibt einen typisierten
Envelope zurück, statt bei Policy- oder Genehmigungsverweigerungen eine Exception
auszulösen.

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

Artefakt-Helper stellen die Gateway-Artefaktprojektion für Sitzungs-, Lauf- oder
Aufgabenkontext bereit. Jeder Aufruf erfordert genau einen expliziten Scope
`sessionKey`, `runId` oder `taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Genehmigungs-Helper verwenden die Exec-Genehmigungs-RPCs:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Heute ausdrücklich nicht unterstützt

Das SDK enthält Namen für das gewünschte Produktmodell, tut aber nicht
stillschweigend so, als ob Gateway-RPCs existieren würden. Diese Aufrufe werfen
derzeit explizite Fehler wegen fehlender Unterstützung:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Die Felder `workspace`, `runtime`, `environment` und `approvals` pro Lauf sind
als zukünftige Form typisiert, aber das aktuelle Gateway unterstützt diese
Overrides auf dem `agent`-RPC nicht. Wenn Aufrufer sie übergeben, wirft das SDK
vor dem Absenden des Laufs, damit Arbeit nicht versehentlich mit
Standardverhalten für Workspace, Runtime, Umgebung oder Genehmigungen ausgeführt
wird.

## App SDK im Vergleich zum Plugin SDK

Verwenden Sie das App SDK, wenn Code außerhalb von OpenClaw lebt:

- Node-Skripte, die Agent-Läufe starten oder beobachten
- CI-Jobs, die ein Gateway aufrufen
- Dashboards und Admin-Panels
- IDE-Erweiterungen
- externe Bridges, die keine Channel-Plugins werden müssen
- Integrationstests mit gefälschten oder echten Gateway-Transporten

Verwenden Sie das Plugin SDK, wenn Code innerhalb von OpenClaw ausgeführt wird:

- Provider-Plugins
- Channel-Plugins
- Tool- oder Lebenszyklus-Hooks
- Agent-Harness-Plugins
- vertrauenswürdige Runtime-Helper

App-SDK-Code sollte aus `@openclaw/sdk` importieren. Plugin-Code sollte aus
dokumentierten `openclaw/plugin-sdk/*`-Unterpfaden importieren. Mischen Sie die
beiden Contracts nicht.

## Zugehörige Dokumentation

- [OpenClaw App SDK-API-Design](/de/reference/openclaw-sdk-api-design)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Sitzungen](/de/concepts/session)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Plugin SDK-Übersicht](/de/plugins/sdk-overview)
