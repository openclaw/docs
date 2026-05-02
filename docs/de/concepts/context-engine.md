---
read_when:
    - Sie möchten verstehen, wie OpenClaw Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine
    - Sie erstellen ein Kontext-Engine-Plugin
sidebarTitle: Context engine
summary: 'Kontext-Engine: austauschbare Kontextzusammenstellung, Compaction und Lebenszyklus von Unteragenten'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-05-02T06:31:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
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
    # oder die Konfiguration direkt prüfen:
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

    Starten Sie den Gateway nach der Installation und Konfiguration neu.

  </Step>
  <Step title="Zurück zu legacy wechseln (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel vollständig — `"legacy"` ist der Standard).
  </Step>
</Steps>

## Funktionsweise

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, ist die Kontext-Engine an vier Lebenszykluspunkten beteiligt:

<AccordionGroup>
  <Accordion title="1. Aufnehmen">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indexieren.
  </Accordion>
  <Accordion title="2. Zusammenstellen">
    Wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete Menge von Nachrichten (und eine optionale `systemPromptAddition`) zurück, die in das Token-Budget passen.
  </Accordion>
  <Accordion title="3. Compact">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer `/compact` ausführt. Die Engine fasst ältere Historie zusammen, um Platz freizugeben.
  </Accordion>
  <Accordion title="4. Nach dem Turn">
    Wird aufgerufen, nachdem ein Lauf abgeschlossen ist. Die Engine kann Zustand persistieren, Hintergrund-Compaction auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Für das gebündelte Nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem der zusammengestellte Kontext in Codex-Developer-Anweisungen und den Prompt des aktuellen Turns projiziert wird. Codex behält weiterhin die Kontrolle über seine native Thread-Historie und seinen nativen Compactor.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Subagent-Lebenszyklus-Hooks auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereitet geteilten Kontextzustand vor, bevor ein untergeordneter Lauf startet. Der Hook erhält Sitzungs-Schlüssel von Parent/Child, `contextMode` (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und optionales TTL. Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, wenn das Spawnen fehlschlägt, nachdem die Vorbereitung erfolgreich war.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bereinigt, wenn eine Subagent-Sitzung abgeschlossen oder bereinigt wird.
</ParamField>

### System-Prompt-Ergänzung

Die Methode `assemble` kann eine `systemPromptAddition`-Zeichenkette zurückgeben. OpenClaw stellt diese dem System-Prompt für den Lauf voran. Dadurch können Engines dynamische Hinweise zum Erinnern, Abrufanweisungen oder kontextbezogene Hinweise einfügen, ohne statische Workspace-Dateien zu benötigen.

## Die legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Aufnehmen**: no-op (der Sitzungsmanager verarbeitet die Nachrichtenpersistenz direkt).
- **Zusammenstellen**: Durchreichen (die bestehende Pipeline sanitize → validate → limit in der Laufzeit verarbeitet das Zusammenstellen des Kontexts).
- **Compact**: delegiert an die integrierte Zusammenfassungs-Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert lässt.
- **Nach dem Turn**: no-op.

Die legacy-Engine registriert keine Tools und stellt keine `systemPromptAddition` bereit.

Wenn `plugins.slots.contextEngine` nicht gesetzt ist (oder auf `"legacy"` gesetzt ist), wird diese Engine automatisch verwendet.

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

Die Factory `ctx` enthält optionale Werte `config`, `agentDir` und `workspaceDir`,
damit Plugins zustandsbezogene Daten pro Agent oder pro Workspace initialisieren können, bevor der
erste Lebenszyklus-Hook ausgeführt wird.

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

### Die ContextEngine-Schnittstelle

Erforderliche Member:

| Member             | Art      | Zweck                                                   |
| ------------------ | -------- | ------------------------------------------------------- |
| `info`             | Property | Engine-ID, Name, Version und ob sie Compaction besitzt  |
| `ingest(params)`   | Method   | Eine einzelne Nachricht speichern                       |
| `assemble(params)` | Method   | Kontext für einen Modelllauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Method   | Kontext zusammenfassen/reduzieren                       |

`assemble` gibt ein `AssembleResult` zurück mit:

<ParamField path="messages" type="Message[]" required>
  Die geordneten Nachrichten, die an das Modell gesendet werden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Die Schätzung der Engine für die Gesamtzahl der Tokens im zusammengestellten Kontext. OpenClaw verwendet dies für Entscheidungen zu Compaction-Schwellenwerten und Diagnoseberichte.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wird dem System-Prompt vorangestellt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Steuert, welche Token-Schätzung der Runner für präventive Overflow-
  Vorabprüfungen verwendet. Standard ist `"assembled"`, was bedeutet, dass nur die Schätzung
  des zusammengestellten Prompts geprüft wird — passend für Engines, die einen
  gefensterten, eigenständigen Kontext zurückgeben. Setzen Sie dies nur dann auf `"preassembly_may_overflow"`,
  wenn Ihre zusammengestellte Ansicht das Overflow-Risiko im zugrunde liegenden
  Transkript verbergen kann; der Runner verwendet dann das Maximum aus der zusammengestellten Schätzung
  und der Pre-Assembly-Schätzung der ungefensterten Sitzungshistorie, wenn er entscheidet,
  ob präventiv compacted werden soll. In jedem Fall sind die Nachrichten, die Sie zurückgeben,
  weiterhin das, was das Modell sieht — `promptAuthority` wirkt sich nur auf die Vorabprüfung aus.
</ParamField>

`compact` gibt ein `CompactResult` zurück. Wenn Compaction das aktive
Transkript rotiert, identifizieren `result.sessionId` und `result.sessionFile` die Nachfolge-
Sitzung, die der nächste Retry oder Turn verwenden muss.

Optionale Member:

| Member                         | Art    | Zweck                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung zum ersten Mal sieht (z. B. Import-Historie). |
| `ingestBatch(params)`          | Method | Einen abgeschlossenen Turn als Batch aufnehmen. Wird nach Abschluss eines Laufs mit allen Nachrichten dieses Turns auf einmal aufgerufen. |
| `afterTurn(params)`            | Method | Lebenszyklusarbeit nach dem Lauf (Zustand persistieren, Hintergrund-Compaction auslösen).                       |
| `prepareSubagentSpawn(params)` | Method | Geteilten Zustand für eine untergeordnete Sitzung einrichten, bevor sie startet.                                |
| `onSubagentEnded(params)`      | Method | Nach dem Ende eines Subagents bereinigen.                                                                       |
| `dispose()`                    | Method | Ressourcen freigeben. Wird beim Herunterfahren des Gateways oder beim Neuladen eines Plugins aufgerufen — nicht pro Sitzung. |

### ownsCompaction

`ownsCompaction` steuert, ob Pis integrierte Auto-Compaction innerhalb eines Versuchs für den Lauf aktiviert bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert Pis integrierte Auto-Compaction für diesen Lauf, und die `compact()`-Implementierung der Engine ist für `/compact`, Overflow-Recovery-Compaction und jede proaktive Compaction verantwortlich, die sie in `afterTurn()` ausführen möchte. OpenClaw kann weiterhin die Overflow-Sicherung vor dem Prompt ausführen; wenn diese vorhersagt, dass das vollständige Transkript überläuft, ruft der Recovery-Pfad vor dem Absenden eines weiteren Prompts `compact()` der aktiven Engine auf.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht gesetzt">
    Pis integrierte Auto-Compaction kann während der Prompt-Ausführung weiterhin laufen, aber die Methode `compact()` der aktiven Engine wird trotzdem für `/compact` und Overflow-Recovery aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der legacy-Engine zurückfällt.
</Warning>

Das bedeutet, dass es zwei gültige Plugin-Muster gibt:

<Tabs>
  <Tab title="Besitzender Modus">
    Implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegierender Modus">
    Setzen Sie `ownsCompaction: false` und lassen Sie `compact()` `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um das integrierte Compaction-Verhalten von OpenClaw zu verwenden.
  </Tab>
</Tabs>

Ein no-op-`compact()` ist für eine aktive nicht-besitzende Engine unsicher, weil es den normalen Compaction-Pfad für `/compact` und Overflow-Recovery für diesen Engine-Slot deaktiviert.

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
Der Slot ist zur Laufzeit exklusiv — für einen bestimmten Lauf oder eine Compaction-Operation wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte `kind: "context-engine"`-Plugins können weiterhin laden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.
</Note>

<Note>
**Plugin-Deinstallation:** Wenn Sie das Plugin deinstallieren, das derzeit als `plugins.slots.contextEngine` ausgewählt ist, setzt OpenClaw den Slot wieder auf den Standard (`legacy`) zurück. Dasselbe Rücksetzverhalten gilt für `plugins.slots.memory`. Eine manuelle Bearbeitung der Konfiguration ist nicht erforderlich.
</Note>

## Beziehung zu Compaction und Speicher

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine Zuständigkeit der Kontext-Engine. Die Legacy-Engine delegiert an die integrierte Zusammenfassung von OpenClaw. Plugin-Engines können jede Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektorabruf usw.).
  </Accordion>
  <Accordion title="Speicher-Plugins">
    Speicher-Plugins (`plugins.slots.memory`) sind von Kontext-Engines getrennt. Speicher-Plugins stellen Suche/Abruf bereit; Kontext-Engines steuern, was das Modell sieht. Sie können zusammenarbeiten — eine Kontext-Engine kann beim Zusammenstellen Daten aus Speicher-Plugins verwenden. Plugin-Engines, die den Prompt-Pfad für Active Memory nutzen möchten, sollten `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` bevorzugen; dies wandelt die Prompt-Abschnitte von Active Memory in eine fertig voranzustellende `systemPromptAddition` um. Wenn eine Engine eine feingranularere Steuerung benötigt, kann sie weiterhin Rohzeilen über `buildActiveMemoryPromptSection(...)` aus `openclaw/plugin-sdk/memory-host-core` abrufen.
  </Accordion>
  <Accordion title="Sitzungsbereinigung">
    Das Kürzen alter Tool-Ergebnisse im Arbeitsspeicher wird weiterhin ausgeführt, unabhängig davon, welche Kontext-Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie Engines wechseln, laufen vorhandene Sitzungen mit ihrem aktuellen Verlauf weiter. Die neue Engine übernimmt für künftige Läufe.
- Engine-Fehler werden protokolliert und in der Diagnose angezeigt. Wenn eine Plugin-Engine nicht registriert werden kann oder die ausgewählte Engine-ID nicht aufgelöst werden kann, greift OpenClaw nicht automatisch auf eine Alternative zurück; Läufe schlagen fehl, bis Sie das Plugin reparieren oder `plugins.slots.contextEngine` wieder auf `"legacy"` setzen.
- Verwenden Sie für die Entwicklung `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis zu verknüpfen, ohne es zu kopieren.

## Siehe auch

- [Compaction](/de/concepts/compaction) — Zusammenfassung langer Unterhaltungen
- [Kontext](/de/concepts/context) — wie Kontext für Agent-Durchläufe aufgebaut wird
- [Plugin-Architektur](/de/plugins/architecture) — Registrieren von Kontext-Engine-Plugins
- [Plugin-Manifest](/de/plugins/manifest) — Felder des Plugin-Manifests
- [Plugins](/de/tools/plugin) — Plugin-Übersicht
