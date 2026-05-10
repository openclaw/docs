---
read_when:
    - Sie implementieren das vorgeschlagene öffentliche OpenClaw-App-SDK
    - Sie benötigen den Entwurfs-Namespace-, Ereignis-, Ergebnis-, Artefakt-, Genehmigungs- oder Sicherheitsvertrag für das App-SDK
    - Sie vergleichen Gateway-Protokollressourcen mit dem High-Level-Wrapper des OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Referenzdesign für die öffentliche API des OpenClaw App SDK, die Ereignistaxonomie, Artefakte, Genehmigungen und die Paketstruktur
title: API-Design des OpenClaw App SDK
x-i18n:
    generated_at: "2026-05-10T19:51:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Diese Seite ist der detaillierte API-Referenzentwurf für das öffentliche
[OpenClaw App SDK](/de/concepts/openclaw-sdk). Sie ist absichtlich getrennt vom
[Plugin SDK](/de/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` ist das externe App-/Client-Paket für die Kommunikation mit dem
  Gateway. `openclaw/plugin-sdk/*` ist der In-Process-Vertrag für die Plugin-Erstellung.
  Importieren Sie keine Plugin SDK-Unterpfade aus Apps, die nur Agents ausführen müssen.
</Note>

Das öffentliche App SDK sollte in zwei Schichten aufgebaut sein:

1. Ein Low-Level-generierter Gateway-Client.
2. Ein ergonomischer High-Level-Wrapper mit `OpenClaw`-, `Agent`-, `Session`-, `Run`-,
   `Task`-, `Artifact`-, `Approval`- und `Environment`-Objekten.

## Namespace-Design

Die Low-Level-Namespaces sollten Gateway-Ressourcen eng folgen:

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

High-Level-Wrapper sollten Objekte zurückgeben, die häufige Abläufe angenehm machen:

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

## Event-Vertrag

Das öffentliche SDK sollte versionierte, replayfähige, normalisierte Events bereitstellen.

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

`id` ist ein Replay-Cursor. Consumer sollten sich mit
`events({ after: id })` erneut verbinden und verpasste Events empfangen können, sofern die Aufbewahrung dies erlaubt.

Empfohlene normalisierte Event-Familien:

| Event                 | Bedeutung                                                   |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run akzeptiert.                                             |
| `run.queued`          | Run wartet auf eine Sitzungs-Lane, Runtime oder Umgebung.   |
| `run.started`         | Runtime hat die Ausführung gestartet.                       |
| `run.completed`       | Run wurde erfolgreich abgeschlossen.                        |
| `run.failed`          | Run endete mit einem Fehler.                                |
| `run.cancelled`       | Run wurde abgebrochen.                                      |
| `run.timed_out`       | Run hat sein Timeout überschritten.                         |
| `assistant.delta`     | Text-Delta des Assistenten.                                 |
| `assistant.message`   | Vollständige Assistentennachricht oder Ersetzung.           |
| `thinking.delta`      | Denk- oder Planungs-Delta, wenn die Richtlinie Offenlegung erlaubt. |
| `tool.call.started`   | Tool-Aufruf hat begonnen.                                   |
| `tool.call.delta`     | Tool-Aufruf hat Fortschritt oder Teilausgabe gestreamt.     |
| `tool.call.completed` | Tool-Aufruf wurde erfolgreich zurückgegeben.                |
| `tool.call.failed`    | Tool-Aufruf ist fehlgeschlagen.                             |
| `approval.requested`  | Ein Run oder Tool benötigt Genehmigung.                     |
| `approval.resolved`   | Genehmigung wurde erteilt, verweigert, ist abgelaufen oder wurde abgebrochen. |
| `question.requested`  | Runtime fragt den Benutzer oder die Host-App nach Eingaben. |
| `question.answered`   | Host-App hat eine Antwort bereitgestellt.                   |
| `artifact.created`    | Neues Artefakt verfügbar.                                   |
| `artifact.updated`    | Vorhandenes Artefakt geändert.                              |
| `session.created`     | Sitzung erstellt.                                           |
| `session.updated`     | Sitzungsmetadaten geändert.                                 |
| `session.compacted`   | Sitzungs-Compaction ist erfolgt.                            |
| `task.updated`        | Zustand der Hintergrundaufgabe geändert.                    |
| `git.branch`          | Runtime hat Branch-Zustand beobachtet oder geändert.        |
| `git.diff`            | Runtime hat ein Diff erzeugt oder geändert.                 |
| `git.pr`              | Runtime hat einen Pull Request geöffnet, aktualisiert oder verknüpft. |

Runtime-native Payloads sollten über `raw` verfügbar sein, aber Apps sollten
`raw` für normale Benutzeroberflächen nicht parsen müssen.

## Ergebnisvertrag

`Run.wait()` sollte eine stabile Ergebnis-Hülle zurückgeben:

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

Das Ergebnis sollte schlicht und stabil sein. Zeitstempelwerte bewahren die Gateway-
Form, sodass aktuelle lifecycle-gestützte Runs normalerweise Epochen-Millisekunden
melden, während Adapter weiterhin ISO-Strings ausgeben können. Umfangreiche Benutzeroberflächen, Tool-Traces und
runtime-native Details gehören in Events und Artefakte.

`accepted` ist ein nicht-terminales Warteergebnis: Es bedeutet, dass die Gateway-Wartefrist
abgelaufen ist, bevor der Run ein Lifecycle-Ende oder einen Fehler erzeugt hat. Es darf nicht als
`timed_out` behandelt werden; `timed_out` ist für einen Run reserviert, der sein eigenes Runtime-
Timeout überschritten hat.

## Genehmigungen und Fragen

Genehmigungen müssen erstklassig sein, weil Coding-Agents ständig Sicherheitsgrenzen
überschreiten.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Genehmigungs-Events sollten Folgendes enthalten:

- Genehmigungs-ID
- Run-ID und Sitzungs-ID
- Anfragetyp
- Zusammenfassung der angeforderten Aktion
- Tool-Name oder Umgebungsaktion
- Risikostufe
- verfügbare Entscheidungen
- Ablaufzeit
- ob die Entscheidung wiederverwendet werden kann

Fragen sind von Genehmigungen getrennt. Eine Frage bittet den Benutzer oder die Host-App um
Informationen. Eine Genehmigung bittet um Erlaubnis, eine Aktion auszuführen.

## ToolSpace-Modell

Apps müssen die Tool-Oberfläche verstehen, ohne Plugin-Interna zu importieren.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

Das SDK sollte Folgendes bereitstellen:

- normalisierte Tool-Metadaten
- Quelle: OpenClaw, MCP, Plugin, Kanal, Runtime oder App
- Schema-Zusammenfassung
- Genehmigungsrichtlinie
- Runtime-Kompatibilität
- ob ein Tool verborgen, schreibgeschützt, schreibfähig oder hostfähig ist

Tool-Aufrufe über das SDK sollten explizit und begrenzt sein. Die meisten Apps sollten
Agents ausführen und nicht beliebige Tools direkt aufrufen.

## Artefaktmodell

Artefakte sollten mehr als Dateien abdecken.

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

Gängige Beispiele:

- Dateiänderungen und generierte Dateien
- Patch-Bundles
- VCS-Diffs
- Screenshots und Medienausgaben
- Logs und Trace-Bundles
- Pull-Request-Links
- Runtime-Trajektorien
- Snapshots verwalteter Umgebungs-Workspaces

Artefaktzugriff sollte Schwärzung, Aufbewahrung und Download-URLs unterstützen, ohne
anzunehmen, dass jedes Artefakt eine normale lokale Datei ist.

## Sicherheitsmodell

Das App SDK muss Autorität explizit machen.

Empfohlene Token-Scopes:

| Scope               | Erlaubt                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Agents auflisten und inspizieren.                   |
| `agent.run`         | Runs starten.                                       |
| `session.read`      | Sitzungsmetadaten und Nachrichten lesen.            |
| `session.write`     | Sitzungen erstellen, an sie senden, forken, compacten und abbrechen. |
| `task.read`         | Zustand von Hintergrundaufgaben lesen.              |
| `task.write`        | Benachrichtigungsrichtlinie für Aufgaben abbrechen oder ändern. |
| `approval.respond`  | Anfragen genehmigen oder ablehnen.                  |
| `tools.invoke`      | Exponierte Tools direkt aufrufen.                   |
| `artifacts.read`    | Artefakte auflisten und herunterladen.              |
| `environment.write` | Verwaltete Umgebungen erstellen oder zerstören.     |
| `admin`             | Administrative Operationen.                         |

Standardeinstellungen:

- keine Secret-Weiterleitung standardmäßig
- keine uneingeschränkte Weitergabe von Umgebungsvariablen
- Secret-Referenzen statt Secret-Werten
- explizite Sandbox- und Netzwerkrichtlinie
- explizite Aufbewahrung entfernter Umgebungen
- Genehmigungen für Host-Ausführung, sofern die Richtlinie nichts anderes beweist
- rohe Runtime-Events werden geschwärzt, bevor sie das Gateway verlassen, sofern der Aufrufer keinen
  stärkeren Diagnose-Scope besitzt

## Provider für verwaltete Umgebungen

Verwaltete Agents sollten als Environment-Provider implementiert werden.

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

Die erste Implementierung muss kein gehostetes SaaS-Angebot sein. Sie kann auf
vorhandene Node-Hosts, kurzlebige Workspaces, CI-ähnliche Runner oder Testbox-artige
Umgebungen abzielen. Der wichtige Vertrag lautet:

1. Workspace vorbereiten
2. sichere Umgebung und Secrets binden
3. Run starten
4. Events streamen
5. Artefakte sammeln
6. gemäß Richtlinie bereinigen oder aufbewahren

Sobald dies stabil ist, kann ein gehosteter Cloud-Service denselben Provider-Vertrag
implementieren.

## Paketstruktur

Empfohlene Pakete:

| Paket                   | Zweck                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `@openclaw/sdk`         | Öffentliches High-Level-SDK und generierter Low-Level-Gateway-Client. |
| `@openclaw/sdk-react`   | Optionale React-Hooks für Dashboards und App-Builder.        |
| `@openclaw/sdk-testing` | Testhelfer und gefälschter Gateway-Server für App-Integrationen. |

Das Repo enthält bereits `openclaw/plugin-sdk/*` für Plugins. Halten Sie diesen Namespace
getrennt, um Plugin-Autoren nicht mit App-Entwicklern zu verwechseln.

## Strategie für generierte Clients

Der Low-Level-Client sollte aus versionierten Gateway-Protokollschemas generiert
und anschließend durch handgeschriebene ergonomische Klassen umschlossen werden.

Schichtung:

1. Gateway-Schema als maßgebliche Quelle.
2. Generierter Low-Level-TypeScript-Client.
3. Runtime-Validatoren für externe Eingaben und Event-Payloads.
4. High-Level-Wrapper für `OpenClaw`, `Agent`, `Session`, `Run`, `Task` und `Artifact`.
5. Cookbook-Beispiele und Integrationstests.

Vorteile:

- Protokollabweichungen werden sichtbar
- Tests können generierte Methoden mit Gateway-Exporten vergleichen
- Das App-SDK bleibt unabhängig von Interna des Plugin SDK
- Low-Level-Consumer haben weiterhin vollständigen Protokollzugriff
- High-Level-Consumer erhalten die kleine Produkt-API

## Verwandte Themen

- [OpenClaw App SDK](/de/concepts/openclaw-sdk)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [Agentenschleife](/de/concepts/agent-loop)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Plugin-SDK-Übersicht](/de/plugins/sdk-overview)
