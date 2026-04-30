---
read_when:
    - Sie erstellen eine externe App, ein Skript, ein Dashboard, einen CI-Job oder eine IDE-Erweiterung, die mit OpenClaw kommuniziert.
    - Sie wählen zwischen dem App SDK und dem Plugin SDK
    - Sie integrieren sich mit Gateway-Agentenläufen, Sitzungen, Ereignissen, Freigaben, Modellen oder Tools
sidebarTitle: App SDK
summary: Öffentliches OpenClaw-App-SDK für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen
title: OpenClaw-App-SDK
x-i18n:
    generated_at: "2026-04-30T06:49:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Das **OpenClaw App SDK** ist die öffentliche Client-API für Apps außerhalb des
OpenClaw-Prozesses. Verwenden Sie `@openclaw/sdk`, wenn ein Skript, Dashboard,
CI-Job, eine IDE-Erweiterung oder eine andere externe App eine Verbindung zum
Gateway herstellen, Agent-Läufe starten, Ereignisse streamen, auf Ergebnisse
warten, Arbeit abbrechen oder Gateway-Ressourcen prüfen möchte.

<Note>
  Das App SDK unterscheidet sich vom [Plugin SDK](/de/plugins/sdk-overview).
  `@openclaw/sdk` kommuniziert von außerhalb von OpenClaw mit dem Gateway.
  `openclaw/plugin-sdk/*` ist nur für Plugins vorgesehen, die innerhalb von
  OpenClaw laufen und Provider, Kanäle, Tools, Hooks oder vertrauenswürdige
  Runtimes registrieren.
</Note>

## Was heute ausgeliefert wird

`@openclaw/sdk` wird mit Folgendem ausgeliefert:

| Oberfläche                | Status   | Funktion                                                                     |
| ------------------------- | -------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Bereit   | Haupteinstiegspunkt für Clients. Verwaltet Transport, Verbindung, Anfragen und Ereignisse. |
| `GatewayClientTransport`  | Bereit   | WebSocket-Transport, gestützt durch den Gateway-Client.                      |
| `oc.agents`               | Bereit   | Listet, erstellt, aktualisiert, löscht und ruft Agent-Handles ab.            |
| `Agent.run()`             | Bereit   | Startet einen Gateway-`agent`-Lauf und gibt einen `Run` zurück.              |
| `oc.runs`                 | Bereit   | Erstellt, ruft ab, wartet auf, bricht ab und streamt Läufe.                  |
| `Run.events()`            | Bereit   | Streamt normalisierte Ereignisse pro Lauf mit Replay für schnelle Läufe.     |
| `Run.wait()`              | Bereit   | Ruft `agent.wait` auf und gibt ein stabiles `RunResult` zurück.              |
| `Run.cancel()`            | Bereit   | Ruft `sessions.abort` nach Lauf-ID auf, mit Sitzungsschlüssel, falls verfügbar. |
| `oc.sessions`             | Bereit   | Erstellt, löst auf, sendet an, patcht, compactet und ruft Sitzungs-Handles ab. |
| `Session.send()`          | Bereit   | Ruft `sessions.send` auf und gibt einen `Run` zurück.                        |
| `oc.models`               | Bereit   | Ruft `models.list` und den aktuellen `models.authStatus`-Status-RPC auf.     |
| `oc.tools`                | Teilweise | Listet Tool-Katalog und effektive Tools; direkte Tool-Aufrufe sind nicht verdrahtet. |
| `oc.approvals`            | Bereit   | Listet und löst Exec-Genehmigungen über Gateway-Genehmigungs-RPCs.           |
| `oc.rawEvents()`          | Bereit   | Stellt rohe Gateway-Ereignisse für fortgeschrittene Verbraucher bereit.      |
| `normalizeGatewayEvent()` | Bereit   | Wandelt rohe Gateway-Ereignisse in die stabile SDK-Ereignisform um.          |

Das SDK exportiert außerdem die Kerntypen, die von diesen Oberflächen verwendet
werden: `AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` und verwandte Ergebnistypen.

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

`new OpenClaw({ gateway: "ws://..." })` ist äquivalent zu `url`. Die Option
`gateway: "auto"` wird vom Konstruktor akzeptiert, aber die automatische
Gateway-Erkennung ist noch kein separates SDK-Feature; übergeben Sie `url`,
wenn die App noch nicht weiß, wie sie das Gateway erkennen soll.

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
rufen Sie anschließend `agent.run()` auf.

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
umgewandelt.

`run.wait()` verwendet den Gateway-`agent.wait`-RPC. Eine Warte-Deadline, die
abläuft, während der Lauf noch aktiv ist, gibt `status: "accepted"` zurück,
anstatt vorzutäuschen, dass der Lauf selbst eine Zeitüberschreitung hatte.
Runtime-Timeouts, abgebrochene Läufe und stornierte Läufe werden zu `timed_out`
oder `cancelled` normalisiert.

## Sitzungen erstellen und wiederverwenden

Verwenden Sie Sitzungen, wenn die App dauerhaften Transkriptzustand benötigt.

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
`OpenClawEvent`-Umschlag:

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

| Ereignistyp          | Quell-Gateway-Ereignis                      |
| -------------------- | ------------------------------------------- |
| `run.started`        | Start des `agent`-Lebenszyklus              |
| `run.completed`      | Ende des `agent`-Lebenszyklus               |
| `run.failed`         | Fehler im `agent`-Lebenszyklus              |
| `run.cancelled`      | Ende eines abgebrochenen/stornierten Lebenszyklus |
| `run.timed_out`      | Ende des Timeout-Lebenszyklus               |
| `assistant.delta`    | Streaming-Delta des Assistant               |
| `assistant.message`  | Assistant-Nachricht                         |
| `thinking.delta`     | Denk- oder Plan-Stream                      |
| `tool.call.started`  | Start von Tool/Element/Befehl               |
| `tool.call.delta`    | Aktualisierung von Tool/Element/Befehl      |
| `tool.call.completed` | Abschluss von Tool/Element/Befehl          |
| `tool.call.failed`   | Fehler oder blockierter Status von Tool/Element/Befehl |
| `approval.requested` | Exec- oder Plugin-Genehmigungsanfrage       |
| `approval.resolved`  | Exec- oder Plugin-Genehmigungsauflösung     |
| `session.created`    | `sessions.changed`-Erstellung               |
| `session.updated`    | `sessions.changed`-Aktualisierung           |
| `session.compacted`  | `sessions.changed`-Compaction               |
| `task.updated`       | Aufgabenaktualisierungsereignisse           |
| `artifact.updated`   | Patch-Stream-Ereignisse                     |
| `raw`                | Jedes Ereignis, das noch kein stabiles SDK-Mapping hat |

`Run.events()` filtert Ereignisse auf eine Lauf-ID und spielt bereits
gesehene Ereignisse für schnelle Läufe erneut ab. Das bedeutet, dass der
dokumentierte Ablauf sicher ist:

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

## Modelle, Tools und Genehmigungen

Modell-Helper werden auf aktuelle Gateway-Methoden abgebildet:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Tool-Helper stellen den Gateway-Katalog und die effektive Tool-Ansicht bereit:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Genehmigungs-Helper verwenden die Exec-Genehmigungs-RPCs:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Heute ausdrücklich nicht unterstützt

Das SDK enthält Namen für das Produktmodell, das wir anstreben, tut aber nicht
stillschweigend so, als würden Gateway-RPCs existieren. Diese Aufrufe werfen
derzeit explizite Nicht-unterstützt-Fehler:

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

Pro-Lauf-Felder `workspace`, `runtime`, `environment` und `approvals` sind als
zukünftige Form typisiert, aber das aktuelle Gateway unterstützt diese
Overrides beim `agent`-RPC nicht. Wenn Aufrufer sie übergeben, wirft das SDK
vor dem Absenden des Laufs, damit Arbeit nicht versehentlich mit dem
Standardverhalten für Workspace, Runtime, Umgebung oder Genehmigung ausgeführt
wird.

## App SDK im Vergleich zum Plugin SDK

Verwenden Sie das App SDK, wenn Code außerhalb von OpenClaw lebt:

- Node-Skripte, die Agent-Läufe starten oder beobachten
- CI-Jobs, die ein Gateway aufrufen
- Dashboards und Admin-Panels
- IDE-Erweiterungen
- externe Bridges, die keine Kanal-Plugins werden müssen
- Integrationstests mit gefälschten oder echten Gateway-Transporten

Verwenden Sie das Plugin SDK, wenn Code innerhalb von OpenClaw läuft:

- Provider-Plugins
- Kanal-Plugins
- Tool- oder Lebenszyklus-Hooks
- Agent-Harness-Plugins
- vertrauenswürdige Runtime-Helper

App-SDK-Code sollte aus `@openclaw/sdk` importieren. Plugin-Code sollte aus
dokumentierten `openclaw/plugin-sdk/*`-Unterpfaden importieren. Vermischen Sie
die beiden Verträge nicht.

## Verwandte Dokumentation

- [OpenClaw App SDK API-Design](/de/reference/openclaw-sdk-api-design)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Sitzungen](/de/concepts/session)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Plugin SDK-Überblick](/de/plugins/sdk-overview)
