---
read_when:
    - Sie möchten verstehen, wie OpenClaw den Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine
    - Sie erstellen ein Context-Engine-Plugin
sidebarTitle: Context engine
summary: 'Kontext-Engine: erweiterbare Kontextzusammenstellung, Compaction und Subagent-Lebenszyklus'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-04-30T06:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Eine **Kontext-Engine** steuert, wie OpenClaw den Modellkontext für jeden Lauf erstellt: welche Nachrichten einbezogen werden, wie ältere Historie zusammengefasst wird und wie Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw wird mit einer integrierten `legacy`-Engine ausgeliefert und verwendet sie standardmäßig — die meisten Benutzer müssen dies nie ändern. Installieren und wählen Sie eine Plugin-Engine nur aus, wenn Sie ein anderes Zusammenstellen, eine andere Compaction oder ein anderes sitzungsübergreifendes Erinnerungsverhalten wünschen.

## Schnellstart

<Steps>
  <Step title="Prüfen, welche Engine aktiv ist">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Eine Plugin-Engine installieren">
    Kontext-Engine-Plugins werden wie jedes andere OpenClaw-Plugin installiert.

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
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Starten Sie das Gateway nach der Installation und Konfiguration neu.

  </Step>
  <Step title="Zurück zu legacy wechseln (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel vollständig — `"legacy"` ist die Standardeinstellung).
  </Step>
</Steps>

## So funktioniert es

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, beteiligt sich die Kontext-Engine an vier Punkten im Lebenszyklus:

<AccordionGroup>
  <Accordion title="1. Aufnehmen">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indizieren.
  </Accordion>
  <Accordion title="2. Zusammenstellen">
    Wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete Menge von Nachrichten (und ein optionales `systemPromptAddition`) zurück, die in das Token-Budget passen.
  </Accordion>
  <Accordion title="3. Verdichten">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer `/compact` ausführt. Die Engine fasst ältere Historie zusammen, um Platz freizugeben.
  </Accordion>
  <Accordion title="4. Nach dem Turn">
    Wird aufgerufen, nachdem ein Lauf abgeschlossen ist. Die Engine kann Zustand persistieren, Hintergrund-Compaction auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Für den gebündelten Nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem zusammengestellter Kontext in Codex-Entwickleranweisungen und den Prompt des aktuellen Turns projiziert wird. Codex besitzt weiterhin seine native Thread-Historie und seinen nativen Compactor.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Subagent-Lebenszyklus-Hooks auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereiten Sie gemeinsamen Kontextzustand vor, bevor ein untergeordneter Lauf startet. Der Hook erhält Eltern-/Kind-Sitzungsschlüssel, `contextMode` (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und eine optionale TTL. Wenn er einen Rollback-Handle zurückgibt, ruft OpenClaw diesen auf, wenn das Spawning fehlschlägt, nachdem die Vorbereitung erfolgreich war.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bereinigen, wenn eine Subagent-Sitzung abgeschlossen oder aufgeräumt wird.
</ParamField>

### System-Prompt-Ergänzung

Die Methode `assemble` kann eine `systemPromptAddition`-Zeichenfolge zurückgeben. OpenClaw stellt diese dem System-Prompt für den Lauf voran. Dadurch können Engines dynamische Erinnerungshinweise, Retrieval-Anweisungen oder kontextbewusste Hinweise einfügen, ohne statische Workspace-Dateien zu benötigen.

## Die Legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Aufnehmen**: keine Operation (der Sitzungsmanager übernimmt die Nachrichtenpersistenz direkt).
- **Zusammenstellen**: Durchreichen (die bestehende Pipeline sanitize → validate → limit in der Runtime übernimmt die Kontextzusammenstellung).
- **Verdichten**: delegiert an die integrierte Zusammenfassungs-Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert lässt.
- **Nach dem Turn**: keine Operation.

Die Legacy-Engine registriert keine Tools und stellt kein `systemPromptAddition` bereit.

Wenn kein `plugins.slots.contextEngine` gesetzt ist (oder es auf `"legacy"` gesetzt ist), wird diese Engine automatisch verwendet.

## Plugin-Engines

Ein Plugin kann über die Plugin-API eine Kontext-Engine registrieren:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
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

Die Factory `ctx` enthält optionale Werte für `config`, `agentDir` und `workspaceDir`, damit Plugins agenten- oder workspacebezogenen Zustand initialisieren können, bevor der erste Lebenszyklus-Hook ausgeführt wird.

Aktivieren Sie sie anschließend in der Konfiguration:

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

### Die ContextEngine-Schnittstelle

Erforderliche Member:

| Member             | Art      | Zweck                                                               |
| ------------------ | -------- | ------------------------------------------------------------------- |
| `info`             | Property | Engine-ID, Name, Version und ob sie Compaction besitzt              |
| `ingest(params)`   | Methode  | Eine einzelne Nachricht speichern                                   |
| `assemble(params)` | Methode  | Kontext für einen Modelllauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Methode  | Kontext zusammenfassen/reduzieren                                   |

`assemble` gibt ein `AssembleResult` zurück mit:

<ParamField path="messages" type="Message[]" required>
  Die geordneten Nachrichten, die an das Modell gesendet werden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Die Schätzung der Engine für die Gesamtzahl der Tokens im zusammengestellten Kontext. OpenClaw verwendet dies für Entscheidungen zu Compaction-Schwellenwerten und für Diagnoseberichte.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wird dem System-Prompt vorangestellt.
</ParamField>

`compact` gibt ein `CompactResult` zurück. Wenn die Compaction das aktive Transkript rotiert, identifizieren `result.sessionId` und `result.sessionFile` die Nachfolgesitzung, die der nächste Wiederholungsversuch oder Turn verwenden muss.

Optionale Member:

| Member                         | Art     | Zweck                                                                                                            |
| ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung zum ersten Mal sieht (z. B. Historie importieren). |
| `ingestBatch(params)`          | Methode | Einen abgeschlossenen Turn als Batch aufnehmen. Wird nach Abschluss eines Laufs mit allen Nachrichten aus diesem Turn auf einmal aufgerufen. |
| `afterTurn(params)`            | Methode | Lebenszyklusarbeit nach dem Lauf (Zustand persistieren, Hintergrund-Compaction auslösen).                         |
| `prepareSubagentSpawn(params)` | Methode | Gemeinsamen Zustand für eine untergeordnete Sitzung einrichten, bevor sie startet.                                |
| `onSubagentEnded(params)`      | Methode | Bereinigen, nachdem ein Subagent endet.                                                                          |
| `dispose()`                    | Methode | Ressourcen freigeben. Wird beim Herunterfahren des Gateway oder beim erneuten Laden eines Plugins aufgerufen — nicht pro Sitzung. |

### ownsCompaction

`ownsCompaction` steuert, ob Pis integrierte automatische In-Attempt-Compaction für den Lauf aktiviert bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert Pis integrierte automatische Compaction für diesen Lauf, und die `compact()`-Implementierung der Engine ist für `/compact`, Overflow-Recovery-Compaction und jede proaktive Compaction verantwortlich, die sie in `afterTurn()` durchführen möchte. OpenClaw kann weiterhin die Pre-Prompt-Overflow-Schutzmaßnahme ausführen; wenn sie vorhersagt, dass das vollständige Transkript überläuft, ruft der Wiederherstellungspfad `compact()` der aktiven Engine auf, bevor ein weiterer Prompt übermittelt wird.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht gesetzt">
    Pis integrierte automatische Compaction kann während der Prompt-Ausführung weiterhin laufen, aber die Methode `compact()` der aktiven Engine wird weiterhin für `/compact` und Overflow-Recovery aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der Legacy-Engine zurückfällt.
</Warning>

Das bedeutet, es gibt zwei gültige Plugin-Muster:

<Tabs>
  <Tab title="Besitzender Modus">
    Implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegierender Modus">
    Setzen Sie `ownsCompaction: false` und lassen Sie `compact()` `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um OpenClaws integriertes Compaction-Verhalten zu verwenden.
  </Tab>
</Tabs>

Ein No-op-`compact()` ist für eine aktive nicht besitzende Engine unsicher, weil es den normalen `/compact`- und Overflow-Recovery-Compaction-Pfad für diesen Engine-Slot deaktiviert.

## Konfigurationsreferenz

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Der Slot ist zur Laufzeit exklusiv — für einen bestimmten Lauf oder eine bestimmte Compaction-Operation wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte `kind: "context-engine"`-Plugins können weiterhin geladen werden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.
</Note>

<Note>
**Plugin-Deinstallation:** Wenn Sie das aktuell als `plugins.slots.contextEngine` ausgewählte Plugin deinstallieren, setzt OpenClaw den Slot auf die Standardeinstellung (`legacy`) zurück. Dasselbe Zurücksetzungsverhalten gilt für `plugins.slots.memory`. Eine manuelle Bearbeitung der Konfiguration ist nicht erforderlich.
</Note>

## Beziehung zu Compaction und Memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine Verantwortung der Kontext-Engine. Die Legacy-Engine delegiert an die integrierte Zusammenfassung von OpenClaw. Plugin-Engines können jede Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektor-Retrieval usw.).
  </Accordion>
  <Accordion title="Memory-Plugins">
    Memory-Plugins (`plugins.slots.memory`) sind von Kontext-Engines getrennt. Memory-Plugins stellen Suche/Retrieval bereit; Kontext-Engines steuern, was das Modell sieht. Sie können zusammenarbeiten — eine Kontext-Engine kann bei der Zusammenstellung Daten aus einem Memory-Plugin verwenden. Plugin-Engines, die den Active-Memory-Prompt-Pfad verwenden möchten, sollten `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` bevorzugen; dies wandelt die Active-Memory-Prompt-Abschnitte in eine voranstellbare `systemPromptAddition` um. Wenn eine Engine eine feingranularere Kontrolle benötigt, kann sie weiterhin Rohzeilen aus `openclaw/plugin-sdk/memory-host-core` über `buildActiveMemoryPromptSection(...)` beziehen.
  </Accordion>
  <Accordion title="Sitzungsbereinigung">
    Das Kürzen alter Tool-Ergebnisse im Arbeitsspeicher wird weiterhin ausgeführt, unabhängig davon, welche Kontext-Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie Engines wechseln, bleiben bestehende Sitzungen mit ihrem aktuellen Verlauf bestehen. Die neue Engine übernimmt für zukünftige Läufe.
- Engine-Fehler werden protokolliert und in der Diagnose angezeigt. Wenn eine Plugin-Engine nicht registriert werden kann oder die ausgewählte Engine-ID nicht aufgelöst werden kann, fällt OpenClaw nicht automatisch zurück; Läufe schlagen fehl, bis Sie das Plugin reparieren oder `plugins.slots.contextEngine` wieder auf `"legacy"` zurücksetzen.
- Verwenden Sie für die Entwicklung `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis zu verknüpfen, ohne es zu kopieren.

## Verwandte Themen

- [Compaction](/de/concepts/compaction) — Zusammenfassen langer Unterhaltungen
- [Kontext](/de/concepts/context) — wie Kontext für Agent-Durchläufe erstellt wird
- [Plugin-Architektur](/de/plugins/architecture) — Registrieren von Kontext-Engine-Plugins
- [Plugin-Manifest](/de/plugins/manifest) — Felder des Plugin-Manifests
- [Plugins](/de/tools/plugin) — Plugin-Übersicht
