---
read_when:
    - Sie möchten verstehen, wie OpenClaw den Modellkontext zusammenstellt.
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine.
    - Sie erstellen ein Kontext-Engine-Plugin.
summary: 'Kontext-Engine: steckbare Kontextzusammenstellung, Compaction und Subagent-Lebenszyklus'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-04-25T13:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

Eine **Kontext-Engine** steuert, wie OpenClaw für jeden Lauf den Modellkontext aufbaut:
welche Nachrichten einbezogen werden, wie älterer Verlauf zusammengefasst wird
und wie Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw wird mit einer integrierten `legacy`-Engine ausgeliefert und verwendet sie standardmäßig — die meisten
Benutzer müssen dies nie ändern. Installieren und wählen Sie eine Plugin-Engine nur dann aus, wenn
Sie ein anderes Verhalten für Zusammenstellung, Compaction oder sitzungsübergreifenden Recall möchten.

## Schnellstart

Prüfen Sie, welche Engine aktiv ist:

```bash
openclaw doctor
# oder die Konfiguration direkt prüfen:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installieren eines Kontext-Engine-Plugins

Kontext-Engine-Plugins werden wie jedes andere OpenClaw-Plugin installiert. Installieren Sie
es zuerst und wählen Sie dann die Engine im Slot aus:

```bash
# Von npm installieren
openclaw plugins install @martian-engineering/lossless-claw

# Oder aus einem lokalen Pfad installieren (für die Entwicklung)
openclaw plugins install -l ./my-context-engine
```

Aktivieren Sie dann das Plugin und wählen Sie es in Ihrer Konfiguration als aktive Engine aus:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // muss mit der registrierten Engine-ID des Plugins übereinstimmen
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-spezifische Konfiguration kommt hierhin (siehe Dokumentation des Plugins)
      },
    },
  },
}
```

Starten Sie das Gateway nach der Installation und Konfiguration neu.

Um zurück zur integrierten Engine zu wechseln, setzen Sie `contextEngine` auf `"legacy"` (oder
entfernen Sie den Schlüssel vollständig — `"legacy"` ist der Standardwert).

## Funktionsweise

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, beteiligt sich die Kontext-Engine an
vier Lebenszyklus-Punkten:

1. **Ingest** — wird aufgerufen, wenn eine neue Nachricht zur Sitzung hinzugefügt wird. Die Engine
   kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indexieren.
2. **Assemble** — wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete
   Menge von Nachrichten (und eine optionale `systemPromptAddition`) zurück, die innerhalb
   des Token-Budgets liegt.
3. **Compact** — wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer
   `/compact` ausführt. Die Engine fasst älteren Verlauf zusammen, um Platz freizugeben.
4. **After turn** — wird aufgerufen, nachdem ein Lauf abgeschlossen ist. Die Engine kann Status persistieren,
   Hintergrund-Compaction auslösen oder Indizes aktualisieren.

Für das gebündelte nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem
der zusammengesetzte Kontext in Codex-Entwicklerinstruktionen und den Prompt des aktuellen
Turns projiziert wird. Codex besitzt weiterhin seinen nativen Thread-Verlauf und seinen nativen Compactor.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Hooks für den Subagent-Lebenszyklus auf:

- **prepareSubagentSpawn** — bereitet gemeinsam genutzten Kontextstatus vor, bevor ein Child-Lauf
  beginnt. Der Hook erhält Parent-/Child-Sitzungsschlüssel, `contextMode`
  (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und eine optionale TTL.
  Wenn er einen Rollback-Handle zurückgibt, ruft OpenClaw ihn auf, wenn der Spawn nach
  erfolgreicher Vorbereitung fehlschlägt.
- **onSubagentEnded** — bereinigt, wenn eine Subagent-Sitzung abgeschlossen oder bereinigt wurde.

### Ergänzung des System-Prompts

Die Methode `assemble` kann eine Zeichenfolge `systemPromptAddition` zurückgeben. OpenClaw
stellt diese dem System-Prompt für den Lauf voran. Dadurch können Engines
dynamische Recall-Anweisungen, Retrieval-Instruktionen oder kontextabhängige Hinweise
einschleusen, ohne statische Workspace-Dateien zu erfordern.

## Die `legacy`-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Ingest**: no-op (der Sitzungsmanager übernimmt die Nachrichtenpersistierung direkt).
- **Assemble**: pass-through (die vorhandene Pipeline sanitize → validate → limit
  in der Runtime übernimmt die Kontextzusammenstellung).
- **Compact**: delegiert an die integrierte zusammenfassende Compaction, die
  eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten intakt lässt.
- **After turn**: no-op.

Die Legacy-Engine registriert keine Tools und stellt keine `systemPromptAddition` bereit.

Wenn `plugins.slots.contextEngine` nicht gesetzt ist (oder auf `"legacy"` gesetzt ist), wird diese
Engine automatisch verwendet.

## Plugin-Engines

Ein Plugin kann über die Plugin-API eine Kontext-Engine registrieren:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Aktivieren Sie sie dann in der Konfiguration:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Das Interface `ContextEngine`

Erforderliche Elemente:

| Element            | Art      | Zweck                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Eigenschaft | Engine-ID, Name, Version und ob sie Compaction besitzt |
| `ingest(params)`   | Methode  | Eine einzelne Nachricht speichern                        |
| `assemble(params)` | Methode  | Kontext für einen Modelllauf aufbauen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Methode  | Kontext zusammenfassen/reduzieren                        |

`assemble` gibt ein `AssembleResult` zurück mit:

- `messages` — die geordneten Nachrichten, die an das Modell gesendet werden.
- `estimatedTokens` (erforderlich, `number`) — die Schätzung der Engine für die Gesamtzahl
  der Tokens im zusammengesetzten Kontext. OpenClaw verwendet dies für Entscheidungen
  zu Compaction-Schwellenwerten und für Diagnoseberichte.
- `systemPromptAddition` (optional, `string`) — wird dem System-Prompt vorangestellt.

Optionale Elemente:

| Element                        | Art    | Zweck                                                                                                          |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Methode | Engine-Status für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung zum ersten Mal sieht (z. B. Verlauf importieren). |
| `ingestBatch(params)`         | Methode | Einen abgeschlossenen Turn als Batch ingestieren. Wird nach Abschluss eines Laufs aufgerufen, mit allen Nachrichten dieses Turns auf einmal. |
| `afterTurn(params)`           | Methode | Lebenszyklusarbeit nach dem Lauf (Status persistieren, Hintergrund-Compaction auslösen).                      |
| `prepareSubagentSpawn(params)` | Methode | Gemeinsam genutzten Status für eine Child-Sitzung vorbereiten, bevor sie beginnt.                             |
| `onSubagentEnded(params)`     | Methode | Bereinigung nach Abschluss eines Subagents.                                                                    |
| `dispose()`                   | Methode | Ressourcen freigeben. Wird beim Herunterfahren des Gateways oder beim Neuladen des Plugins aufgerufen — nicht pro Sitzung. |

### ownsCompaction

`ownsCompaction` steuert, ob Pis integrierte Auto-Compaction innerhalb eines Versuchs
für den Lauf aktiviert bleibt:

- `true` — die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert Pis integrierte
  Auto-Compaction für diesen Lauf, und die Implementierung `compact()` der Engine ist
  verantwortlich für `/compact`, Overflow-Recovery-Compaction und jede proaktive
  Compaction, die sie in `afterTurn()` durchführen möchte. OpenClaw kann weiterhin die
  Schutzmaßnahme gegen Overflow vor dem Prompt ausführen; wenn vorhergesagt wird, dass das
  vollständige Transkript überlaufen wird, ruft der Recovery-Pfad vor dem Übermitteln
  eines weiteren Prompts `compact()` der aktiven Engine auf.
- `false` oder nicht gesetzt — Pis integrierte Auto-Compaction kann während der Prompt-
  Ausführung weiterhin laufen, aber die Methode `compact()` der aktiven Engine wird
  weiterhin für `/compact` und Overflow-Recovery aufgerufen.

`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf
den Compaction-Pfad der Legacy-Engine zurückfällt.

Das bedeutet, dass es zwei gültige Plugin-Muster gibt:

- **Owning-Modus** — implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie
  `ownsCompaction: true`.
- **Delegating-Modus** — setzen Sie `ownsCompaction: false` und lassen Sie `compact()`
  `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um
  das integrierte Compaction-Verhalten von OpenClaw zu verwenden.

Ein no-op-`compact()` ist für eine aktive nicht-besitzende Engine unsicher, weil es
den normalen Compaction-Pfad für `/compact` und Overflow-Recovery für diesen
Engine-Slot deaktiviert.

## Konfigurationsreferenz

```json5
{
  plugins: {
    slots: {
      // Aktive Kontext-Engine auswählen. Standard: "legacy".
      // Auf eine Plugin-ID setzen, um eine Plugin-Engine zu verwenden.
      contextEngine: "legacy",
    },
  },
}
```

Der Slot ist zur Laufzeit exklusiv — für einen bestimmten Lauf oder eine bestimmte Compaction-
Operation wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte
`kind: "context-engine"`-Plugins können weiterhin geladen werden und ihren Registrierungs-
Code ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID
OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.

## Beziehung zu Compaction und Memory

- **Compaction** ist eine Verantwortung der Kontext-Engine. Die Legacy-Engine
  delegiert an die integrierte Zusammenfassung von OpenClaw. Plugin-Engines können
  jede beliebige Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektor-Retrieval usw.).
- **Memory-Plugins** (`plugins.slots.memory`) sind von Kontext-Engines getrennt.
  Memory-Plugins liefern Suche/Retrieval; Kontext-Engines steuern, was das
  Modell sieht. Beides kann zusammenarbeiten — eine Kontext-Engine könnte während
  der Zusammenstellung Daten aus einem Memory-Plugin verwenden. Plugin-Engines, die
  den aktiven Memory-Prompt-Pfad nutzen möchten, sollten
  `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` bevorzugen, da es die aktiven Memory-Prompt-Abschnitte
  in eine bereits zum Voranstellen geeignete `systemPromptAddition` umwandelt. Wenn eine Engine
  Steuerung auf niedrigerer Ebene benötigt, kann sie weiterhin rohe Zeilen aus
  `openclaw/plugin-sdk/memory-host-core` über
  `buildActiveMemoryPromptSection(...)` abrufen.
- **Session pruning** (Trimmen alter Tool-Ergebnisse im Arbeitsspeicher) läuft
  weiterhin, unabhängig davon, welche Kontext-Engine aktiv ist.

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie die Engine wechseln, laufen bestehende Sitzungen mit ihrem aktuellen Verlauf weiter.
  Die neue Engine übernimmt für künftige Läufe.
- Engine-Fehler werden protokolliert und in Diagnosen angezeigt. Wenn eine Plugin-Engine
  nicht registriert werden kann oder die ausgewählte Engine-ID nicht aufgelöst werden kann, fällt OpenClaw
  nicht automatisch zurück; Läufe schlagen fehl, bis Sie das Plugin korrigieren oder
  `plugins.slots.contextEngine` wieder auf `"legacy"` setzen.
- Verwenden Sie für die Entwicklung `openclaw plugins install -l ./my-engine`, um ein
  lokales Plugin-Verzeichnis zu verknüpfen, ohne es zu kopieren.

Siehe auch: [Compaction](/de/concepts/compaction), [Kontext](/de/concepts/context),
[Plugins](/de/tools/plugin), [Plugin-Manifest](/de/plugins/manifest).

## Verwandt

- [Kontext](/de/concepts/context) — wie Kontext für Agent-Turns aufgebaut wird
- [Plugin-Architektur](/de/plugins/architecture) — Registrieren von Kontext-Engine-Plugins
- [Compaction](/de/concepts/compaction) — Zusammenfassen langer Konversationen
