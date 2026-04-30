---
read_when:
    - Sie implementieren das vorgeschlagene öffentliche OpenClaw-App-SDK
    - Sie benötigen den Draft-Namespace, das Ereignis, das Ergebnis, das Artefakt, die Genehmigung oder den Sicherheitsvertrag für das App-SDK
    - Sie vergleichen Gateway-Protokollressourcen mit dem High-Level-Wrapper des OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Referenzdesign für die öffentliche API des OpenClaw App SDK, Ereignistaxonomie, Artefakte, Freigaben und Paketstruktur
title: API-Design des OpenClaw App SDKs
x-i18n:
    generated_at: "2026-04-30T07:13:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Diese Seite ist der ausführliche API-Referenzentwurf für das öffentliche
[OpenClaw App SDK](/de/concepts/openclaw-sdk). Sie ist absichtlich vom
[Plugin SDK](/de/plugins/sdk-overview) getrennt.

<Note>
  `@openclaw/sdk` ist das externe App-/Client-Paket für die Kommunikation mit dem
  Gateway. `openclaw/plugin-sdk/*` ist der In-Process-Vertrag für die Plugin-Erstellung.
  Importieren Sie keine Plugin SDK-Unterpfade aus Apps, die nur Agents ausführen müssen.
</Note>

Das öffentliche App SDK sollte in zwei Schichten aufgebaut sein:

1. Ein generierter Gateway-Client auf niedriger Ebene.
2. Ein ergonomischer High-Level-Wrapper mit `OpenClaw`-, `Agent`-, `Session`-, `Run`-,
   `Task`-, `Artifact`-, `Approval`- und `Environment`-Objekten.

## Namespace-Design

Die Low-Level-Namespaces sollten sich eng an den Gateway-Ressourcen orientieren:

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

Das öffentliche SDK sollte versionierte, erneut abspielbare, normalisierte Events bereitstellen.

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

`id` ist ein Replay-Cursor. Konsumenten sollten sich mit
`events({ after: id })` erneut verbinden und verpasste Events erhalten können, wenn die Aufbewahrung dies zulässt.

Empfohlene normalisierte Event-Familien:

| Event                 | Bedeutung                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `run.created`         | Run akzeptiert.                                                  |
| `run.queued`          | Run wartet auf eine Session-Spur, Runtime oder Umgebung.         |
| `run.started`         | Runtime hat die Ausführung gestartet.                            |
| `run.completed`       | Run wurde erfolgreich abgeschlossen.                             |
| `run.failed`          | Run endete mit einem Fehler.                                     |
| `run.cancelled`       | Run wurde abgebrochen.                                           |
| `run.timed_out`       | Run hat sein Timeout überschritten.                              |
| `assistant.delta`     | Assistant-Textdelta.                                             |
| `assistant.message`   | Vollständige Assistant-Nachricht oder Ersetzung.                 |
| `thinking.delta`      | Reasoning- oder Plandelta, wenn die Richtlinie die Offenlegung erlaubt. |
| `tool.call.started`   | Tool-Aufruf hat begonnen.                                        |
| `tool.call.delta`     | Tool-Aufruf hat Fortschritt oder Teilausgabe gestreamt.          |
| `tool.call.completed` | Tool-Aufruf wurde erfolgreich zurückgegeben.                     |
| `tool.call.failed`    | Tool-Aufruf ist fehlgeschlagen.                                  |
| `approval.requested`  | Ein Run oder Tool benötigt Genehmigung.                          |
| `approval.resolved`   | Genehmigung wurde erteilt, verweigert, ist abgelaufen oder wurde abgebrochen. |
| `question.requested`  | Runtime fragt den Benutzer oder die Host-App nach Eingaben.      |
| `question.answered`   | Host-App hat eine Antwort bereitgestellt.                        |
| `artifact.created`    | Neues Artifact verfügbar.                                        |
| `artifact.updated`    | Vorhandenes Artifact wurde geändert.                             |
| `session.created`     | Session erstellt.                                                |
| `session.updated`     | Session-Metadaten wurden geändert.                               |
| `session.compacted`   | Session-Compaction ist erfolgt.                                  |
| `task.updated`        | Zustand der Hintergrundaufgabe wurde geändert.                   |
| `git.branch`          | Runtime hat Branch-Zustand beobachtet oder geändert.             |
| `git.diff`            | Runtime hat ein Diff erzeugt oder geändert.                      |
| `git.pr`              | Runtime hat einen Pull Request geöffnet, aktualisiert oder verknüpft. |

Runtime-native Payloads sollten über `raw` verfügbar sein, aber Apps sollten
`raw` für normale UI nicht parsen müssen.

## Ergebnisvertrag

`Run.wait()` sollte einen stabilen Ergebnisumschlag zurückgeben:

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

Das Ergebnis sollte schlicht und stabil sein. Zeitstempelwerte behalten die Gateway-Form bei,
sodass aktuelle lifecycle-gestützte Runs normalerweise Epoch-Millisekundenwerte
melden, während Adapter weiterhin ISO-Strings bereitstellen können. Umfangreiche UI, Tool-Traces und
runtime-native Details gehören in Events und Artifacts.

`accepted` ist ein nicht terminales Warteergebnis: Es bedeutet, dass die Gateway-Wartefrist
abgelaufen ist, bevor der Run ein Lifecycle-Ende oder einen Fehler erzeugt hat. Es darf nicht als
`timed_out` behandelt werden; `timed_out` ist für einen Run reserviert, der sein eigenes Runtime-Timeout
überschritten hat.

## Genehmigungen und Fragen

Genehmigungen müssen First-Class sein, weil Coding Agents ständig Sicherheitsgrenzen
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
- Run-ID und Session-ID
- Art der Anfrage
- Zusammenfassung der angeforderten Aktion
- Tool-Name oder Umgebungsaktion
- Risikostufe
- verfügbare Entscheidungen
- Ablaufzeitpunkt
- ob die Entscheidung wiederverwendet werden kann

Fragen sind von Genehmigungen getrennt. Eine Frage fordert Informationen vom Benutzer oder von der Host-App an.
Eine Genehmigung fragt nach der Erlaubnis, eine Aktion auszuführen.

## ToolSpace-Modell

Apps müssen die Tool-Oberfläche verstehen können, ohne Plugin-Interna zu importieren.

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
- ob ein Tool ausgeblendet, readonly, schreibfähig oder hostfähig ist

Tool-Aufrufe über das SDK sollten explizit und eingegrenzt sein. Die meisten Apps sollten
Agents ausführen und nicht beliebige Tools direkt aufrufen.

## Artifact-Modell

Artifacts sollten mehr als Dateien abdecken.

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

Häufige Beispiele:

- Dateiänderungen und generierte Dateien
- Patch-Bundles
- VCS-Diffs
- Screenshots und Medienausgaben
- Logs und Trace-Bundles
- Pull-Request-Links
- Runtime-Trajektorien
- Snapshots verwalteter Umgebungs-Workspaces

Artifact-Zugriff sollte Schwärzung, Aufbewahrung und Download-URLs unterstützen, ohne
anzunehmen, dass jedes Artifact eine normale lokale Datei ist.

## Sicherheitsmodell

Das App SDK muss explizit mit Berechtigungen umgehen.

Empfohlene Token-Scopes:

| Scope               | Erlaubt                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Agents auflisten und prüfen.                        |
| `agent.run`         | Runs starten.                                       |
| `session.read`      | Session-Metadaten und Nachrichten lesen.            |
| `session.write`     | Sessions erstellen, an sie senden, forken, compacten und abbrechen. |
| `task.read`         | Zustand von Hintergrundaufgaben lesen.              |
| `task.write`        | Benachrichtigungsrichtlinie für Aufgaben abbrechen oder ändern. |
| `approval.respond`  | Anfragen genehmigen oder verweigern.                |
| `tools.invoke`      | Offengelegte Tools direkt aufrufen.                 |
| `artifacts.read`    | Artifacts auflisten und herunterladen.              |
| `environment.write` | Verwaltete Umgebungen erstellen oder zerstören.     |
| `admin`             | Administrative Vorgänge.                            |

Standards:

- keine Secret-Weiterleitung standardmäßig
- keine uneingeschränkte Durchleitung von Umgebungsvariablen
- Secret-Referenzen statt Secret-Werten
- explizite Sandbox- und Netzwerkrichtlinie
- explizite Aufbewahrung von Remote-Umgebungen
- Genehmigungen für Host-Ausführung, sofern die Richtlinie nichts anderes belegt
- rohe Runtime-Events werden geschwärzt, bevor sie das Gateway verlassen, es sei denn, der Aufrufer hat einen
  stärkeren Diagnose-Scope

## Provider für verwaltete Umgebungen

Verwaltete Agents sollten als Umgebungs-Provider implementiert werden.

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

Die erste Implementierung muss kein gehostetes SaaS sein. Sie kann auf
bestehende Node-Hosts, kurzlebige Workspaces, CI-artige Runner oder Testbox-artige
Umgebungen abzielen. Der wichtige Vertrag lautet:

1. Workspace vorbereiten
2. sichere Umgebung und Secrets binden
3. Run starten
4. Events streamen
5. Artifacts sammeln
6. nach Richtlinie bereinigen oder aufbewahren

Sobald dies stabil ist, kann ein gehosteter Cloud-Dienst denselben Provider-Vertrag
implementieren.

## Paketstruktur

Empfohlene Pakete:

| Paket                   | Zweck                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Öffentliches High-Level-SDK und generierter Low-Level-Gateway-Client. |
| `@openclaw/sdk-react`   | Optionale React-Hooks für Dashboards und App-Entwickler.      |
| `@openclaw/sdk-testing` | Testhilfen und Fake-Gateway-Server für App-Integrationen.     |

Das Repo enthält bereits `openclaw/plugin-sdk/*` für Plugins. Halten Sie diesen Namespace
getrennt, um Plugin-Autoren nicht mit App-Entwicklern zu verwechseln.

## Strategie für den generierten Client

Der Low-Level-Client sollte aus versionierten Gateway-Protokollschemata
generiert und anschließend durch handgeschriebene, ergonomische Klassen umhüllt werden.

Schichtung:

1. Gateway-Schema als Quelle der Wahrheit.
2. Generierter Low-Level-TypeScript-Client.
3. Laufzeitvalidatoren für externe Eingaben und Event-Payloads.
4. High-Level-Wrapper für `OpenClaw`, `Agent`, `Session`, `Run`, `Task` und `Artifact`.
5. Cookbook-Beispiele und Integrationstests.

Vorteile:

- Protokolldrift wird sichtbar
- Tests können generierte Methoden mit Gateway-Exporten vergleichen
- Das App-SDK bleibt unabhängig von Interna des Plugin-SDK
- Low-Level-Consumer behalten vollständigen Protokollzugriff
- High-Level-Consumer erhalten die kleine Produkt-API

## Verwandte Dokumentation

- [OpenClaw App-SDK](/de/concepts/openclaw-sdk)
- [Gateway-RPC-Referenz](/de/reference/rpc)
- [Agent-Loop](/de/concepts/agent-loop)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Hintergrundaufgaben](/de/automation/tasks)
- [ACP-Agenten](/de/tools/acp-agents)
- [Plugin-SDK-Überblick](/de/plugins/sdk-overview)
