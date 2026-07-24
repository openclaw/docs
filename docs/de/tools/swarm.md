---
read_when:
    - Sie möchten mit einem Code-Mode-Skript die Arbeit auf mehrere Agenten verteilen
    - Sie benötigen strukturierte untergeordnete Ergebnisse, Entscheidungsschranken oder Pipelines, bei denen der erste Abschluss zählt
    - Sie aktivieren oder optimieren die Grenzwerte für tools.swarm
    - Sie möchten untergeordnete Collector-Prozesse im Sitzungs-Dashboard beobachten
sidebarTitle: Swarm
summary: Orchestrieren Sie nebenläufige Sub-Agenten aus Code-Mode-Skripten mit strukturierten Ergebnissen, begrenzter Auffächerung und Live-Fortschritt
title: Schwarm
x-i18n:
    generated_at: "2026-07-24T05:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f0bec17da7a2e144df35189a65d9b35d829815b545a4bb89652e6a681ca971a9
    source_path: tools/swarm.md
    workflow: 16
---

Swarm ist eine experimentelle, optional aktivierbare Möglichkeit, viele Unteragenten aus einem
[Code-Modus](/tools/code-mode)-Skript zu orchestrieren. Verwenden Sie normale JavaScript- oder TypeScript-
Kontrollflüsse wie `Promise.all`, `while` und `if`, um Arbeit aufzufächern, Ergebnisse zu sammeln
und Entscheidungen zu treffen.

Es gibt weder eine Graph-DSL noch ein separates Workflow-Format. Das Programm ist die
Orchestrierung. Swarm ergänzt dieses Programm um erwartbare Collector-Kinder, strukturierte Ergebnisse,
begrenzte Nebenläufigkeit und Fortschrittsberichte.

## Swarm aktivieren

Der empfohlene Weg ist **Einstellungen → Labs → Swarm** in der Control UI. Der
Schalter wird sofort wirksam und schreibt `tools.swarm.enabled` in Ihre
Konfiguration.

Sie können Swarm auch direkt in `openclaw.json` aktivieren:

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

Die boolesche Kurzform aktiviert oder deaktiviert die Funktion, wobei alle anderen Werte
ihre Standardwerte behalten:

```json5
{
  tools: {
    swarm: true,
  },
}
```

| Feld                    | Standardwert | Beschreibung                                                                                                                    |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`               | `false` | Stellt Spawn-Optionen für den Collector-Modus, `agents_wait` und die Gast-API `agents.*` des Code-Modus bereit.                  |
| `maxConcurrent`         | `8`     | Maximale Anzahl gleichzeitig ausgeführter Collector-Kinder in einer Swarm-Gruppe. Weitere angenommene Kinder werden in FIFO-Reihenfolge eingereiht. |
| `maxChildrenPerGroup`   | `50`    | Maximale Anzahl aktiver Collector-Kinder in einer Gruppe.                                                                       |
| `maxTotalPerGroup`      | `200`   | Maximale Anzahl von Collector-Kindern, die eine Gruppe während ihrer Lebensdauer erzeugen darf. Dies ist die letzte Absicherung gegen unkontrolliertes Erzeugen. |
| `waitTimeoutSecondsMax` | `600`   | Maximales Timeout, das ein einzelner `agents_wait`-Aufruf akzeptiert. Der Standardwert des Aufrufs beträgt 30 Sekunden.          |
| `defaultAgentId`        | `""`    | Zielagent, der verwendet wird, wenn beim Erzeugen `agentId` fehlt. Bei einem leeren Wert wird der anfragende Agent verwendet. Bestehende Positivlisten für Unteragenten gelten weiterhin. |

Numerische Werte müssen positive Ganzzahlen sein. OpenClaw begrenzt
`maxConcurrent` auf `1`–`1000`, `maxChildrenPerGroup` auf `1`–`10000`,
`maxTotalPerGroup` auf `1`–`100000` und `waitTimeoutSecondsMax` auf
`1`–`86400`.

Sie können Swarm für einen einzelnen konfigurierten Agenten mit
`agents.entries.*.tools.swarm` überschreiben. Das agentenspezifische Objekt wird über das übergeordnete
`tools.swarm`-Objekt gelegt.

## Voraussetzungen

Die Gast-Globals `agents.run`, `phase` und `log` erfordern sowohl Swarm als auch den
OpenClaw-Code-Modus:

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

Der Code-Modus muss außerdem effektiven Zugriff auf `sessions_spawn` haben. Tool-Profile,
Zulassungs-/Verweigerungsrichtlinien, Provider-Regeln und Sandbox-Richtlinien können dieses Tool entfernen.
Siehe [Aktivierung des Code-Modus](/tools/code-mode#activation) und
[Unteragenten](/de/tools/subagents), wenn ein Skript meldet, dass `sessions_spawn`
nicht verfügbar ist.

`defaultAgentId` und die laufbezogenen `agentId`-Werte müssen ein konfiguriertes Ziel benennen,
das durch die `subagents.allowAgents`-Richtlinie des Anfragenden zulässig ist. OpenClaw lehnt
ein unbekanntes oder unzulässiges Ziel ab, anstatt auf einen anderen Agenten zurückzugreifen.

## Ein Swarm-Skript schreiben

Wenn Swarm aktiviert ist, stellt der Code-Modus diese Gast-API bereit:

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

Ohne `schema` wird `agents.run()` zum abschließenden Text des Kindes aufgelöst. Mit einem
JSON-Schema wird es zu dem Wert aufgelöst, der über das `structured_output`-Tool des Kindes
übermittelt wurde. Bei einem fehlgeschlagenen, beendeten, zeitüberschrittenen oder schemaungültigen Kind
wird das Promise mit einem `SwarmAgentError` zurückgewiesen. Lesen Sie die exakten generierten
Deklarationen und kurzen Orchestrierungsmuster aus `API.read("agents.d.ts")`
im Code-Modus.

Verwenden Sie `label` für einen leicht erkennbaren Namen des Kindes im Dashboard und in der Seitenleiste. Verwenden Sie
`phase` in den Optionen, um unmittelbar vor dem Start dieses Kindes eine Phase zu veröffentlichen,
oder rufen Sie `phase()` auf, wenn mehrere Kinder zur selben Phase gehören.
`log()` veröffentlicht eine kurze Fortschrittsmeldung. Fortschrittsaufrufe werden ohne Warten ausgelöst;
sie verzögern das Skript nicht, wenn die UI nicht verfügbar ist.

### Parallel auffächern und strukturierte Ergebnisse zusammenführen

Dieses Beispiel startet einen Recherche-Agenten pro Thema, wartet auf alle und
beauftragt anschließend ein letztes Kind, deren strukturierte Berichte zusammenzuführen:

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["Authentifizierung", "Speicherung", "Wiederherstellung"];
phase("Unabhängige Prüfung");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`Prüfen Sie den Pfad ${topic}. Geben Sie einen Befund mit Belegen zurück.`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("Zusammenführung");
log(`${reports.length} unabhängige Berichte gesammelt.`);

return await agents.run(
  `Gleichen Sie diese Berichte ab und erläutern Sie Unstimmigkeiten:\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` ist die Grenze für Auffächerung und Zusammenführung. OpenClaw startet bis zu
`maxConcurrent` Kinder für die Gruppe und reiht die übrigen in der Reihenfolge ihrer Übermittlung
ein.

Der Code-Modus begrenzt gleichzeitig ausgeführte Gast-Bridge-Aufrufe separat mit
`tools.codeMode.maxPendingToolCalls` (Standardwert `16`, Maximum `128`). Starten Sie bei sehr
großen Gruppen begrenzte Batches unterhalb dieses Limits und lassen Sie Spielraum für
`phase()`, `log()` und Übergänge beim Warten auf Kinder. `maxConcurrent` begrenzt laufende
Kinder; es erhöht nicht das Limit für Gast-Bridge-Aufrufe.

### Eine Entscheidungsschranke wiederholt prüfen

Verwenden Sie eine begrenzte `while`-Schleife, wenn jeder Durchlauf entscheidet, ob ein weiterer Durchlauf
erforderlich ist:

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "Nicht geprüft", nextAction: "Prüfen" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`Entscheidungsdurchlauf ${pass}`);
  decision = await agents.run(
    `Prüfen Sie, ob die Release-Nachweise vollständig sind. Vorherige Entscheidung: ${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`Schranke nach ${pass} Durchläufen weiterhin geschlossen: ${decision.nextAction}`);
}

return decision;
```

Begrenzen Sie Entscheidungsschleifen immer. `maxTotalPerGroup` ist die letzte Sicherheitsabsicherung,
kein Ersatz für eine eindeutige Abbruchbedingung.

### Das zuerst fertiggestellte Kind verarbeiten

`agents.run()` gibt ein gewöhnliches Promise zurück, sodass `Promise.race` auf das
erste Kind des Code-Modus reagieren kann. Für Testumgebungen, die die untergeordneten Tools aufrufen,
stellt `agents_wait` dieselbe Grenze für den ersten Abschluss bereit: Der Aufruf kehrt zurück, sobald
mindestens einer der angeforderten Läufe abgeschlossen ist oder das begrenzte Timeout abläuft.
Die vollständige Drain-Schleife finden Sie unter [Swarm aus anderen Testumgebungen verwenden](#use-swarm-from-other-harnesses).

## Verhalten von Collector-Kindern

Collector-Kinder sind gewöhnliche isolierte Unteragentensitzungen mit einem anderen
Abschlusspfad. Sie schreiben ein dauerhaftes Collector-Ergebnis, auf das das übergeordnete Element
wartet, anstatt eine Antwort anzukündigen oder zurück in die übergeordnete Sitzung zu leiten.

Der Zielagent wird in dieser Reihenfolge bestimmt:

1. `agentId` beim Spawn- oder `agents.run()`-Aufruf.
2. `tools.swarm.defaultAgentId`.
3. Der anfragende Agent.

Ein dedizierter, schlanker Arbeitsagent ist nützlich, wenn Swarm-Kinder eine kleinere
Tool-Oberfläche, ein günstigeres Modell oder eine strengere Sandbox-Richtlinie benötigen. OpenClaw liefert
keine integrierte Agenten-ID `worker` aus; konfigurieren Sie eine solche ID, bevor Sie sie als Standardwert festlegen.
Härten Sie diesen Arbeitsagenten mit `tools.swarm: false` in seiner agentenspezifischen Konfiguration ab, sodass
er erzeugt werden kann, aber aus seinen eigenen übergeordneten Sitzungen keine Swarms starten kann:

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

Collector-Genehmigungen werden im Zweifel verweigert. Ein Kind öffnet niemals eine Genehmigungsaufforderung
für Bedienende. Eine Tool-Aktion, die eine Genehmigung erfordern würde, wird verweigert, und das Kind kann
diese Verweigerung in seinem Ergebnis melden, damit das Skript über das weitere Vorgehen entscheiden kann.

Für strukturierte Ausgaben fügt OpenClaw dem Kind ein synthetisches `structured_output`-Tool hinzu
und validiert dessen Nutzdaten anhand des bereitgestellten JSON-Schemas. Bei ungültigen oder fehlenden Nutzdaten
erfolgt eine einmalige Korrekturaufforderung. Wenn auch der erneute Versuch die Validierung nicht besteht,
behält der Collector-Abschluss den Rohtext des Kindes bei, lässt `structured` ungesetzt
und enthält `schemaError`. Das untergeordnete `agents_wait`-
Ergebnis stellt diese Felder für eine explizite Wiederherstellungslogik bereit.

### Kinder sind Blätter

Swarm-Kinder sind standardmäßig Blätter. Die universelle
`agents.defaults.subagents.maxSpawnDepth`-Sperre verhindert, dass ein Kind
bei der Standardtiefe `1` eigene Kinder erzeugt. Das übliche Orchestrierungsmuster besteht darin,
Arbeit an das übergeordnete Element zurückzugeben, statt von einem Kind aus weitere Arbeit zu erzeugen:

```javascript
const plan = await agents.run("Planen Sie diesen Auftrag als unabhängige Aufgaben.", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

Verschachtelte Unteragenten können durch Bedienende über
`agents.defaults.subagents.maxSpawnDepth` optional aktiviert werden und werden für Swarm nicht empfohlen.
Gruppenlimits, Budgets und Beobachtbarkeit setzen flache Collector-Gruppen voraus.

Jedes Kind hat genau einen Verantwortlichen für die Zulassung. Ankündigungs- und interaktive Kinder verwenden
`agents.defaults.subagents.maxChildrenPerAgent` (Standardwert `5`) und zählen
Collector-Kinder nicht mit. Collector-Kinder verwenden ausschließlich `maxChildrenPerGroup` und
`maxTotalPerGroup`; sie verbrauchen nicht das sitzungsbezogene Kinderbudget. Die Begrenzung der Spawn-
Tiefe gilt weiterhin für beide Modi.

Nach der Zulassung werden Kinder oberhalb von `maxConcurrent` innerhalb ihrer Swarm-
Gruppe in FIFO-Reihenfolge eingereiht, verschachtelt in der globalen Unteragentenspur. Diese Nebenläufigkeitsebenen reihen
Arbeit ein, statt sie abzulehnen. Ein Collector-Spawn, der eines der Gruppenlimits überschreitet,
wird mit dem entsprechenden Konfigurationsschlüssel in der Fehlermeldung abgelehnt.

## Einen Swarm beobachten

Öffnen Sie das Dashboard der übergeordneten Sitzung in der Control UI, während ein Swarm aktiv ist.
Das Swarm-Widget stellt jede aktive Collector-Gruppe mit einem Punkt pro Kind und dem
Status „in Warteschlange“, „läuft“, „abgeschlossen“ oder „fehlgeschlagen“ dar. Labels werden in den Tooltips der Punkte angezeigt, sodass kurze,
stabile Labels größere Swarms leichter lesbar machen.

Die Sitzungsseitenleiste behält die normale Baumstruktur aus übergeordneten Elementen und Kindern bei. Erweitern Sie die Zeile des übergeordneten Elements,
um ein Collector-Kind zu untersuchen oder dessen Transkript zu öffnen, ohne die Swarm-
Hierarchie zu verlieren.

Collector-Ergebnisse bleiben abrufbar, bis ihre Gruppe archiviert wird. Nachdem jedes
Mitglied seine Aufbewahrungsfrist erreicht hat, archiviert OpenClaw die untergeordneten Elemente der Gruppe
als Batch, damit abgeschlossene Schwarme nicht im aktiven Sitzungsbaum verbleiben.

## Swarm mit anderen Harnesses verwenden

Sie können Swarm ohne den OpenClaw Code Mode verwenden. Seine Kernwerkzeuge sind
Harness-unabhängig: Starten Sie untergeordnete Collector-Prozesse mit
`sessions_spawn({ collect: true })` und rufen Sie deren Ergebnisse mit begrenzten `agents_wait`-Aufrufen
ab.

Der Codex Code Mode stellt geeignete dynamische OpenClaw-Werkzeuge automatisch unter
`tools.*` bereit. Er verwendet weder die QuickJS-Gast-API von OpenClaw noch benötigt er
`tools.codeMode`, aber `tools.swarm` muss weiterhin aktiviert sein. `agents_wait`-Aufrufe
des Codex-Harness unterstützen das vollständige Zeitlimit von 600 Sekunden.

Mit der derzeit unterstützten Codex-Laufzeit erreichen Ergebnisse dynamischer OpenClaw-Werkzeuge
den Code Mode als JSON-Text. Parsen Sie jedes Ergebnis, bevor Sie Felder auslesen. Codex
serialisiert außerdem dynamische Werkzeugaufrufe, sodass `Promise.all` nicht mehrere
`sessions_spawn`-Aufrufe gleichzeitig übermittelt. Starten Sie Collectors in einer begrenzten Schleife;
bereits angenommene untergeordnete Prozesse können weiterlaufen, während spätere Starts übermittelt werden.

```javascript
function parseToolResult(value) {
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

const tasks = [
  "Prüfen Sie den Authentifizierungspfad.",
  "Prüfen Sie den Speicherpfad.",
  "Prüfen Sie den Wiederherstellungspfad.",
];
const launches = [];

for (const [index, task] of tasks.entries()) {
  const launch = parseToolResult(
    await tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  );
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "Der Collector-Start wurde nicht angenommen.");
  }
  launches.push(launch);
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = parseToolResult(
    await tools.agents_wait({
      ids,
      timeoutSeconds: 30,
    }),
  );

  // Verschieben Sie dieses begrenzte Fenster hinter IDs, die noch nicht geprüft wurden.
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // Verarbeiten Sie jedes Ergebnis, sobald es abgeschlossen ist.
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

Jeder `agents_wait`-Aufruf akzeptiert 1–1000 Ausführungs-IDs. Er gibt Folgendes zurück:

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

Der Aufruf kehrt sofort zurück, wenn ein angeforderter untergeordneter Prozess bereits abgeschlossen ist,
wenn mindestens ein ausstehender untergeordneter Prozess abgeschlossen wird, wenn keine gültigen ausstehenden IDs mehr vorhanden sind
oder wenn sein Zeitlimit abläuft. Abgeschlossene Datensätze sind idempotent, sodass die Übergabe einer
bereits abgeschlossenen Ausführungs-ID deren Ergebnis erneut zurückgibt. Nur die startende Sitzung
oder ihre autorisierte übergeordnete Kette kann auf einen Collector warten.

Dies ist begrenztes Long Polling und keine aktive Statusschleife. Übergeben Sie weiterhin nur die
verbleibenden Ausführungs-IDs, bis `pending` leer ist. Der Collector-Modus unterstützt native
OpenClaw-Unteragenten; er unterstützt weder die ACP-Laufzeit noch Thread-Bindung, sichtbare
Sitzungen oder den persistenten Sitzungsmodus.

## Grenzen und Roadmap

Swarm v1 führt einmalig ausgeführte untergeordnete Collector-Prozesse aus; die geplante `agents.session()`-API
wird zustandsbehaftete Worker mit mehreren Dialogrunden hinzufügen. Untergeordnete Prozesse werden derzeit in der
Unteragenten-Lane des lokalen Gateway ausgeführt; die Cloud-Platzierung ist als explizite Startoption
geplant. Gespeicherte Workflow-Definitionen und eine Graph-DSL gehören nicht zur aktuellen Ausrichtung
von Swarm.

## Verwandte Themen

- [Code Mode](/tools/code-mode) für die QuickJS-Gastlaufzeit und Aktivierungsregeln
- [Unteragenten](/de/tools/subagents) für Richtlinien, Isolation und Sitzungsverhalten untergeordneter Prozesse
- [Multi-Agent-Sandbox-Werkzeuge](/de/tools/multi-agent-sandbox-tools) für agentenspezifische Einschränkungen
- [Werkzeugübersicht](/de/tools) für Werkzeugprofile und Richtlinienrouting
