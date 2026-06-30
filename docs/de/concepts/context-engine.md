---
read_when:
    - Sie möchten verstehen, wie OpenClaw Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine
    - Sie erstellen ein Plugin für eine Kontext-Engine
sidebarTitle: Context engine
summary: 'Kontext-Engine: austauschbare Kontextzusammenstellung, Compaction und Subagent-Lebenszyklus'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-06-30T13:55:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Eine **Kontext-Engine** steuert, wie OpenClaw für jeden Durchlauf Modellkontext erstellt: welche Nachrichten einbezogen werden, wie ältere Historie zusammengefasst wird und wie Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw wird mit einer integrierten `legacy`-Engine ausgeliefert und verwendet sie standardmäßig - die meisten Nutzer müssen dies nie ändern. Installieren und wählen Sie eine Plugin-Engine nur dann aus, wenn Sie ein anderes Verhalten für Zusammenstellung, Compaction oder sitzungsübergreifenden Abruf wünschen.

## Schnellstart

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Kontext-Engine-Plugins werden wie jedes andere OpenClaw-Plugin installiert.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    Starten Sie das Gateway nach Installation und Konfiguration neu.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel vollständig - `"legacy"` ist der Standard).
  </Step>
</Steps>

## Funktionsweise

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, beteiligt sich die Kontext-Engine an vier Lebenszykluspunkten:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indexieren.
  </Accordion>
  <Accordion title="2. Assemble">
    Wird vor jedem Modelldurchlauf aufgerufen. Die Engine gibt eine geordnete Menge von Nachrichten (und optional ein `systemPromptAddition`) zurück, die in das Token-Budget passen.
  </Accordion>
  <Accordion title="3. Compact">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Nutzer `/compact` ausführt. Die Engine fasst ältere Historie zusammen, um Platz freizugeben.
  </Accordion>
  <Accordion title="4. After turn">
    Wird aufgerufen, nachdem ein Durchlauf abgeschlossen ist. Die Engine kann Zustand persistieren, Hintergrund-Compaction auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Für den gebündelten Nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem der zusammengestellte Kontext in Codex-Developer-Anweisungen und den aktuellen Turn-Prompt projiziert wird. Codex verwaltet weiterhin seine native Thread-Historie und seinen nativen Compactor.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Subagent-Lebenszyklus-Hooks auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereitet gemeinsam genutzten Kontextzustand vor, bevor ein Child-Durchlauf startet. Der Hook erhält Parent-/Child-Sitzungsschlüssel, `contextMode` (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und optional TTL. Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, wenn das Spawn nach erfolgreicher Vorbereitung fehlschlägt. Native Subagent-Spawns, die `lightContext` anfordern und zu `contextMode="isolated"` aufgelöst werden, überspringen diesen Hook absichtlich, damit das Child mit dem leichtgewichtigen Bootstrap-Kontext ohne von der Kontext-Engine verwalteten Pre-Spawn-Zustand startet.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bereinigt, wenn eine Subagent-Sitzung abgeschlossen oder aufgeräumt wird.
</ParamField>

### System-Prompt-Ergänzung

Die Methode `assemble` kann eine Zeichenkette `systemPromptAddition` zurückgeben. OpenClaw stellt diese dem System-Prompt für den Durchlauf voran. Dadurch können Engines dynamische Abrufhinweise, Retrieval-Anweisungen oder kontextbezogene Hinweise einfügen, ohne statische Workspace-Dateien zu benötigen.

## Die Legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Ingest**: keine Operation (der Sitzungsmanager übernimmt die Nachrichtenpersistenz direkt).
- **Assemble**: Durchleitung (die bestehende Pipeline sanitize → validate → limit in der Runtime übernimmt die Kontextzusammenstellung).
- **Compact**: delegiert an die integrierte Zusammenfassungs-Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert lässt.
- **After turn**: keine Operation.

Die Legacy-Engine registriert keine Tools und stellt kein `systemPromptAddition` bereit.

Wenn kein `plugins.slots.contextEngine` gesetzt ist (oder auf `"legacy"` gesetzt ist), wird diese Engine automatisch verwendet.

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

Die Factory `ctx` enthält optionale Werte für `config`, `agentDir` und `workspaceDir`, damit Plugins pro Agent oder Workspace Zustand initialisieren können, bevor der erste Lebenszyklus-Hook ausgeführt wird.

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

| Member             | Art      | Zweck                                                         |
| ------------------ | -------- | ------------------------------------------------------------- |
| `info`             | Property | Engine-ID, Name, Version und ob sie Compaction besitzt        |
| `ingest(params)`   | Methode  | Eine einzelne Nachricht speichern                             |
| `assemble(params)` | Methode  | Kontext für einen Modelldurchlauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Methode  | Kontext zusammenfassen/reduzieren                             |

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
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Steuert, welche Token-Schätzung der Runner für präventive Overflow-Vorabprüfungen verwendet. Der Standard ist `"assembled"`, was bedeutet, dass bei Engines, die Compaction nicht selbst besitzen, nur die Schätzung des zusammengestellten Prompts geprüft wird. Engines, die `ownsCompaction: true` setzen, verwalten ihre eigene Prompt-Zulassung, daher überspringt OpenClaw standardmäßig die generische Vor-Prompt-Vorabprüfung. Setzen Sie `"preassembly_may_overflow"` nur dann, wenn Ihre zusammengestellte Sicht ein Overflow-Risiko im zugrunde liegenden Transkript verbergen kann; der Runner hält dann die generische Vorabprüfung aktiv und verwendet das Maximum aus der zusammengestellten Schätzung und der Vor-Zusammenstellungs-Schätzung (ohne Fensterung) der Sitzungshistorie, wenn er entscheidet, ob präventiv komprimiert werden soll. In jedem Fall sind die von Ihnen zurückgegebenen Nachrichten weiterhin das, was das Modell sieht - `promptAuthority` beeinflusst nur die Vorabprüfung.
</ParamField>

`compact` gibt ein `CompactResult` zurück. Wenn Compaction das aktive Transkript rotiert, identifizieren `result.sessionId` und `result.sessionFile` die Nachfolgesitzung, die der nächste Retry oder Turn verwenden muss.

Optionale Member:

| Member                         | Art     | Zweck                                                                                                             |
| ------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung erstmals sieht (z. B. Import-Historie). |
| `ingestBatch(params)`          | Methode | Einen abgeschlossenen Turn als Batch aufnehmen. Wird nach Abschluss eines Durchlaufs mit allen Nachrichten aus diesem Turn auf einmal aufgerufen. |
| `afterTurn(params)`            | Methode | Lebenszyklusarbeit nach dem Durchlauf (Zustand persistieren, Hintergrund-Compaction auslösen).                    |
| `prepareSubagentSpawn(params)` | Methode | Gemeinsamen Zustand für eine Child-Sitzung einrichten, bevor sie startet.                                         |
| `onSubagentEnded(params)`      | Methode | Nach dem Ende eines Subagents bereinigen.                                                                         |
| `dispose()`                    | Methode | Ressourcen freigeben. Wird während Gateway-Shutdown oder Plugin-Reload aufgerufen - nicht pro Sitzung.            |

### Runtime-Einstellungen

Lebenszyklus-Hooks, die innerhalb von OpenClaw laufen, erhalten ein optionales `runtimeSettings`-Objekt. Es ist eine versionierte, schreibgeschützte interne Producer-/Consumer-API-Oberfläche: OpenClaw erzeugt sie für die ausgewählte Kontext-Engine, und die Kontext-Engine konsumiert sie innerhalb von Lebenszyklus-Hooks. Sie wird Nutzern nicht direkt angezeigt und erzeugt keine dedizierte Reporting-Oberfläche.

- `schemaVersion`: derzeit `1`
- `runtime`: OpenClaw-Host, Runtime-Modus (`normal`, `fallback` oder `degraded`) und optionale Harness-/Runtime-IDs
- `contextEngineSelection`: ausgewählte Kontext-Engine-ID und Auswahlquelle
- `executionHost`: Host-ID und Label für die Oberfläche, die den Hook aufruft
- `model`: angefordertes Modell, aufgelöstes Modell, Provider und optionale Modellfamilie
- `limits`: Prompt-Token-Budget und maximale Ausgabe-Tokens, wenn bekannt
- `diagnostics`: geschlossene Fallback- und Degraded-Reason-Codes, wenn bekannt

Felder, die unbekannt sein können, werden als `null` dargestellt; Diskriminatorfelder wie Runtime-Modus und Auswahlquelle bleiben nicht-nullbar. Ältere Engines bleiben kompatibel: Wenn eine strikte Legacy-Engine `runtimeSettings` als unbekannte Eigenschaft ablehnt, wiederholt OpenClaw den Lebenszyklusaufruf ohne diese Eigenschaft, statt die Engine in Quarantäne zu setzen.

### Host-Anforderungen

Kontext-Engines können Host-Capability-Anforderungen in `info.hostRequirements` deklarieren. OpenClaw prüft diese Anforderungen, bevor die Operation gestartet wird, und schlägt geschlossen mit einem beschreibenden Fehler fehl, wenn die ausgewählte Runtime sie nicht erfüllen kann.

Deklarieren Sie für Agent-Durchläufe `assemble-before-prompt`, wenn die Engine den tatsächlichen Modell-Prompt über `assemble()` steuern muss:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Native Codex- und OpenClaw-Embedded-Agent-Durchläufe erfüllen `assemble-before-prompt`. Generische CLI-Backends tun dies nicht, daher werden Engines, die dies erfordern, abgelehnt, bevor der CLI-Prozess startet.

### Fehlerisolation

OpenClaw isoliert die ausgewählte Plugin-Engine vom Kernpfad für Antworten. Wenn eine
nicht veraltete Engine fehlt, die Vertragsvalidierung nicht besteht, während der Factory-
Erstellung eine Ausnahme auslöst oder aus einer Lebenszyklusmethode eine Ausnahme auslöst,
stellt OpenClaw diese Engine für den aktuellen Gateway-Prozess unter Quarantäne und stuft
Context-Engine-Arbeit auf die integrierte `legacy`-Engine herab. Der Fehler wird mit der
fehlgeschlagenen Operation protokolliert, damit der Betreiber das Plugin reparieren,
aktualisieren oder deaktivieren kann, ohne dass der Agent stumm wird.

Fehler bei Host-Anforderungen sind anders: Wenn eine Engine erklärt, dass einer Runtime
eine erforderliche Fähigkeit fehlt, schlägt OpenClaw vor dem Start des Runs geschlossen
fehl. Das schützt Engines, die den Zustand beschädigen würden, wenn sie in einem nicht
unterstützten Host ausgeführt würden.

### ownsCompaction

`ownsCompaction` steuert, ob die integrierte In-Attempt-Auto-Compaction der OpenClaw-Runtime für den Run aktiviert bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert die integrierte Auto-Compaction der OpenClaw-Runtime und die generische Pre-Prompt-Überlauf-Vorprüfung für diesen Run, und die `compact()`-Implementierung der Engine ist für `/compact`, Compaction zur Provider-Überlaufwiederherstellung und jede proaktive Compaction verantwortlich, die sie in `afterTurn()` ausführen möchte. OpenClaw führt die Pre-Prompt-Überlaufsicherung weiterhin aus, wenn die Engine `promptAuthority: "preassembly_may_overflow"` aus `assemble()` zurückgibt.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht gesetzt">
    Die integrierte Auto-Compaction der OpenClaw-Runtime kann während der Prompt-Ausführung weiterhin laufen, aber die `compact()`-Methode der aktiven Engine wird weiterhin für `/compact` und Überlaufwiederherstellung aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der Legacy-Engine zurückfällt.
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

Ein `compact()` ohne Wirkung ist für eine aktive, nicht besitzende Engine unsicher, weil es den normalen `/compact`- und Überlaufwiederherstellungs-Compaction-Pfad für diesen Engine-Slot deaktiviert.

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
Der Slot ist zur Laufzeit exklusiv - für einen bestimmten Run oder eine bestimmte Compaction-Operation wird nur eine registrierte Context Engine aufgelöst. Andere aktivierte `kind: "context-engine"`-Plugins können weiterhin geladen werden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Context Engine benötigt wird.
</Note>

<Note>
**Plugin-Deinstallation:** Wenn Sie das Plugin deinstallieren, das aktuell als `plugins.slots.contextEngine` ausgewählt ist, setzt OpenClaw den Slot auf den Standardwert (`legacy`) zurück. Dasselbe Zurücksetzungsverhalten gilt für `plugins.slots.memory`. Eine manuelle Konfigurationsänderung ist nicht erforderlich.
</Note>

## Beziehung zu Compaction und Memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine Verantwortung der Context Engine. Die Legacy-Engine delegiert an die integrierte Zusammenfassung von OpenClaw. Plugin-Engines können jede beliebige Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektorabruf usw.).
  </Accordion>
  <Accordion title="Memory-Plugins">
    Memory-Plugins (`plugins.slots.memory`) sind von Context Engines getrennt. Memory-Plugins stellen Suche/Abruf bereit; Context Engines steuern, was das Modell sieht. Sie können zusammenarbeiten - eine Context Engine könnte während der Assembly Daten eines Memory-Plugins verwenden. Plugin-Engines, die den aktiven Memory-Prompt-Pfad nutzen möchten, sollten `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` bevorzugen, das die aktiven Memory-Prompt-Abschnitte in ein voranstellbares `systemPromptAddition` umwandelt. Wenn eine Engine Kontrolle auf niedrigerer Ebene benötigt, kann sie weiterhin rohe Zeilen über `buildActiveMemoryPromptSection(...)` aus `openclaw/plugin-sdk/memory-host-core` abrufen.
  </Accordion>
  <Accordion title="Session-Pruning">
    Das Kürzen alter Tool-Ergebnisse im Arbeitsspeicher läuft weiterhin unabhängig davon, welche Context Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie Engines wechseln, werden bestehende Sessions mit ihrer aktuellen Historie fortgesetzt. Die neue Engine übernimmt künftige Runs.
- Engine-Fehler werden protokolliert, und die ausgewählte Plugin-Engine wird für den aktuellen Gateway-Prozess unter Quarantäne gestellt. OpenClaw fällt für Benutzer-Turns auf `legacy` zurück, damit Antworten fortgesetzt werden können, aber Sie sollten das defekte Plugin trotzdem reparieren, aktualisieren, deaktivieren oder deinstallieren.
- Verwenden Sie für die Entwicklung `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis ohne Kopieren zu verknüpfen.

## Verwandte Themen

- [Compaction](/de/concepts/compaction) - Zusammenfassung langer Unterhaltungen
- [Context](/de/concepts/context) - wie Kontext für Agent-Turns aufgebaut wird
- [Plugin Architecture](/de/plugins/architecture) - Registrierung von Context-Engine-Plugins
- [Plugin manifest](/de/plugins/manifest) - Plugin-Manifestfelder
- [Plugins](/de/tools/plugin) - Plugin-Übersicht
