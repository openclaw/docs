---
read_when:
    - Sie möchten verstehen, wie OpenClaw den Modellkontext zusammenstellt.
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine.
    - Sie erstellen ein Plugin für die Kontext-Engine.
sidebarTitle: Context engine
summary: 'Kontext-Engine: erweiterbare Kontextzusammenstellung, Compaction und Subagent-Lebenszyklus'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-04-26T11:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Eine **Kontext-Engine** steuert, wie OpenClaw für jeden Lauf den Modellkontext erstellt: welche Nachrichten einbezogen werden, wie älterer Verlauf zusammengefasst wird und wie Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw enthält eine eingebaute `legacy`-Engine und verwendet sie standardmäßig — die meisten Benutzer müssen dies nie ändern. Installieren und wählen Sie eine Plugin-Engine nur dann, wenn Sie ein anderes Verhalten bei Zusammenstellung, Compaction oder sitzungsübergreifendem Recall möchten.

## Schnellstart

<Steps>
  <Step title="Prüfen, welche Engine aktiv ist">
    ```bash
    openclaw doctor
    # oder die Konfiguration direkt prüfen:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Eine Plugin-Engine installieren">
    Plugins für die Kontext-Engine werden wie jedes andere OpenClaw-Plugin installiert.

    <Tabs>
      <Tab title="Von npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Von einem lokalen Pfad">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Die Engine aktivieren und auswählen">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // muss der registrierten Engine-ID des Plugins entsprechen
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-spezifische Konfiguration hier einfügen (siehe Dokumentation des Plugins)
          },
        },
      },
    }
    ```

    Starten Sie das Gateway nach Installation und Konfiguration neu.

  </Step>
  <Step title="Zurück zu legacy wechseln (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel ganz — `"legacy"` ist die Standardeinstellung).
  </Step>
</Steps>

## So funktioniert es

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, wirkt die Kontext-Engine an vier Lebenszyklus-Punkten mit:

<AccordionGroup>
  <Accordion title="1. Aufnehmen">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indizieren.
  </Accordion>
  <Accordion title="2. Zusammenstellen">
    Wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete Menge von Nachrichten (und optional ein `systemPromptAddition`) zurück, die innerhalb des Token-Budgets liegen.
  </Accordion>
  <Accordion title="3. Kompaktieren">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer `/compact` ausführt. Die Engine fasst älteren Verlauf zusammen, um Platz freizugeben.
  </Accordion>
  <Accordion title="4. Nach dem Turn">
    Wird aufgerufen, nachdem ein Lauf abgeschlossen ist. Die Engine kann Zustand persistieren, Hintergrund-Compaction auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Für das gebündelte nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem der zusammengestellte Kontext in Codex-Developer-Anweisungen und den aktuellen Turn-Prompt projiziert wird. Codex verwaltet weiterhin seinen nativen Thread-Verlauf und seinen nativen Compactor.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Hooks für den Subagent-Lebenszyklus auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereitet gemeinsamen Kontextzustand vor, bevor ein Child-Lauf startet. Der Hook erhält Parent-/Child-Sitzungsschlüssel, `contextMode` (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und eine optionale TTL. Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, wenn das Spawn nach erfolgreicher Vorbereitung fehlschlägt.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Räumt auf, wenn eine Subagent-Sitzung abgeschlossen oder bereinigt wird.
</ParamField>

### Zusätzlicher System-Prompt

Die Methode `assemble` kann eine Zeichenfolge `systemPromptAddition` zurückgeben. OpenClaw stellt diese dem System-Prompt für den Lauf voran. So können Engines dynamische Recall-Hinweise, Retrieval-Anweisungen oder kontextabhängige Hinweise einfügen, ohne statische Workspace-Dateien zu benötigen.

## Die Legacy-Engine

Die eingebaute `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Aufnehmen**: no-op (der Sitzungsmanager übernimmt direkt die Persistierung von Nachrichten).
- **Zusammenstellen**: Durchreichen (die vorhandene Pipeline sanitize → validate → limit in der Laufzeit übernimmt die Kontextzusammenstellung).
- **Kompaktieren**: delegiert an die eingebaute summarisierende Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert lässt.
- **Nach dem Turn**: no-op.

Die Legacy-Engine registriert keine Tools und stellt kein `systemPromptAddition` bereit.

Wenn `plugins.slots.contextEngine` nicht gesetzt ist (oder auf `"legacy"` gesetzt ist), wird diese Engine automatisch verwendet.

## Plugin-Engines

Ein Plugin kann mit der Plugin-API eine Kontext-Engine registrieren:

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
      // Nachricht in Ihrem Datenspeicher speichern
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Nachrichten zurückgeben, die in das Budget passen
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
      // Älteren Kontext zusammenfassen
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

### Die Schnittstelle ContextEngine

Erforderliche Member:

| Member             | Art      | Zweck                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Engine-ID, Name, Version und ob sie Compaction besitzt   |
| `ingest(params)`   | Method   | Eine einzelne Nachricht speichern                        |
| `assemble(params)` | Method   | Kontext für einen Modelllauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Method   | Kontext zusammenfassen/reduzieren                        |

`assemble` gibt ein `AssembleResult` zurück mit:

<ParamField path="messages" type="Message[]" required>
  Die geordneten Nachrichten, die an das Modell gesendet werden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Die Schätzung der Engine für die Gesamtzahl der Token im zusammengestellten Kontext. OpenClaw verwendet dies für Entscheidungen über Compaction-Schwellenwerte und diagnostische Berichte.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wird dem System-Prompt vorangestellt.
</ParamField>

Optionale Member:

| Member                         | Art    | Zweck                                                                                                             |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung erstmals sieht (z. B. Verlauf importieren). |
| `ingestBatch(params)`          | Method | Einen abgeschlossenen Turn als Batch aufnehmen. Wird nach Abschluss eines Laufs aufgerufen, mit allen Nachrichten dieses Turns auf einmal. |
| `afterTurn(params)`            | Method | Lebenszyklus-Arbeit nach dem Lauf (Zustand persistieren, Hintergrund-Compaction auslösen).                        |
| `prepareSubagentSpawn(params)` | Method | Gemeinsamen Zustand für eine Child-Sitzung einrichten, bevor sie startet.                                         |
| `onSubagentEnded(params)`      | Method | Aufräumen, nachdem ein Subagent endet.                                                                            |
| `dispose()`                    | Method | Ressourcen freigeben. Wird beim Herunterfahren des Gateway oder beim Neuladen des Plugins aufgerufen — nicht pro Sitzung. |

### ownsCompaction

`ownsCompaction` steuert, ob Pis eingebaute In-Attempt-Auto-Compaction für den Lauf aktiv bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert Pis eingebaute Auto-Compaction für diesen Lauf, und die Implementierung `compact()` der Engine ist verantwortlich für `/compact`, Overflow-Recovery-Compaction und jede proaktive Compaction, die sie in `afterTurn()` durchführen möchte. OpenClaw kann weiterhin die Overflow-Sicherung vor dem Prompt ausführen; wenn vorhergesagt wird, dass das vollständige Transkript überläuft, ruft der Recovery-Pfad `compact()` der aktiven Engine auf, bevor ein weiterer Prompt übermittelt wird.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht gesetzt">
    Pis eingebaute Auto-Compaction kann während der Prompt-Ausführung weiterhin laufen, aber die Methode `compact()` der aktiven Engine wird weiterhin für `/compact` und Overflow-Recovery aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der Legacy-Engine zurückfällt.
</Warning>

Das bedeutet, dass es zwei gültige Plugin-Muster gibt:

<Tabs>
  <Tab title="Owning-Modus">
    Implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating-Modus">
    Setzen Sie `ownsCompaction: false` und lassen Sie `compact()` `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um das eingebaute Compaction-Verhalten von OpenClaw zu verwenden.
  </Tab>
</Tabs>

Ein no-op `compact()` ist für eine aktive nicht-besitzende Engine unsicher, weil es den normalen Pfad für `/compact` und Overflow-Recovery-Compaction für diesen Engine-Slot deaktiviert.

## Konfigurationsreferenz

```json5
{
  plugins: {
    slots: {
      // Die aktive Kontext-Engine auswählen. Standard: "legacy".
      // Auf eine Plugin-ID setzen, um eine Plugin-Engine zu verwenden.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Der Slot ist zur Laufzeit exklusiv — für einen gegebenen Lauf oder eine Compaction-Operation wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte Plugins vom `kind: "context-engine"` können weiterhin geladen werden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.
</Note>

<Note>
**Plugin-Deinstallation:** Wenn Sie das Plugin deinstallieren, das derzeit als `plugins.slots.contextEngine` ausgewählt ist, setzt OpenClaw den Slot auf den Standardwert (`legacy`) zurück. Dasselbe Rücksetzverhalten gilt für `plugins.slots.memory`. Eine manuelle Bearbeitung der Konfiguration ist nicht erforderlich.
</Note>

## Beziehung zu Compaction und Memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine Aufgabe der Kontext-Engine. Die Legacy-Engine delegiert an die eingebaute Zusammenfassungsfunktion von OpenClaw. Plugin-Engines können beliebige Compaction-Strategien implementieren (DAG-Zusammenfassungen, Vektor-Retrieval usw.).
  </Accordion>
  <Accordion title="Memory-Plugins">
    Memory-Plugins (`plugins.slots.memory`) sind von Kontext-Engines getrennt. Memory-Plugins stellen Suche/Retrieval bereit; Kontext-Engines steuern, was das Modell sieht. Sie können zusammenarbeiten — eine Kontext-Engine kann beim Zusammenstellen Daten aus einem Memory-Plugin verwenden. Plugin-Engines, die den aktiven Memory-Prompt-Pfad verwenden möchten, sollten `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` bevorzugen, das die aktiven Memory-Prompt-Abschnitte in ein gebrauchsfertiges `systemPromptAddition` zum Voranstellen umwandelt. Wenn eine Engine Steuerung auf niedrigerer Ebene benötigt, kann sie weiterhin rohe Zeilen aus `openclaw/plugin-sdk/memory-host-core` über `buildActiveMemoryPromptSection(...)` abrufen.
  </Accordion>
  <Accordion title="Sitzungsbereinigung">
    Das Trimmen alter Tool-Ergebnisse im Arbeitsspeicher läuft weiterhin, unabhängig davon, welche Kontext-Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie zwischen Engines wechseln, werden bestehende Sitzungen mit ihrem aktuellen Verlauf fortgesetzt. Die neue Engine übernimmt für zukünftige Läufe.
- Engine-Fehler werden protokolliert und in der Diagnose angezeigt. Wenn eine Plugin-Engine sich nicht registrieren lässt oder die ausgewählte Engine-ID nicht aufgelöst werden kann, greift OpenClaw nicht automatisch auf etwas anderes zurück; Läufe schlagen fehl, bis Sie das Plugin korrigieren oder `plugins.slots.contextEngine` wieder auf `"legacy"` setzen.
- Für die Entwicklung verwenden Sie `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis zu verknüpfen, ohne es zu kopieren.

## Verwandte Inhalte

- [Compaction](/de/concepts/compaction) — lange Konversationen zusammenfassen
- [Kontext](/de/concepts/context) — wie Kontext für Agent-Turns aufgebaut wird
- [Plugin-Architektur](/de/plugins/architecture) — Plugins für die Kontext-Engine registrieren
- [Plugin-Manifest](/de/plugins/manifest) — Felder des Plugin-Manifests
- [Plugins](/de/tools/plugin) — Plugin-Überblick
