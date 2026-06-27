---
read_when:
    - Sie möchten verstehen, wie OpenClaw Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine
    - Sie erstellen ein Context-Engine-Plugin
sidebarTitle: Context engine
summary: 'Kontext-Engine: erweiterbare Kontextzusammenstellung, Compaction und Subagent-Lebenszyklus'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-06-27T17:22:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Eine **Kontext-Engine** steuert, wie OpenClaw den Modellkontext für jeden Durchlauf erstellt: welche Nachrichten eingeschlossen werden, wie ältere Historie zusammengefasst wird und wie Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw liefert eine integrierte `legacy`-Engine mit und verwendet sie standardmäßig - die meisten Nutzer müssen dies nie ändern. Installieren und wählen Sie eine Plugin-Engine nur aus, wenn Sie ein anderes Assembly-, Compaction- oder sitzungsübergreifendes Recall-Verhalten wünschen.

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

    Starten Sie den Gateway nach Installation und Konfiguration neu.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel vollständig - `"legacy"` ist der Standard).
  </Step>
</Steps>

## Funktionsweise

Jedes Mal, wenn OpenClaw einen Modell-Prompt ausführt, beteiligt sich die Kontext-Engine an vier Lebenszykluspunkten:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indizieren.
  </Accordion>
  <Accordion title="2. Assemble">
    Wird vor jedem Modell-Durchlauf aufgerufen. Die Engine gibt eine geordnete Menge von Nachrichten (und eine optionale `systemPromptAddition`) zurück, die in das Token-Budget passen.
  </Accordion>
  <Accordion title="3. Compact">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Nutzer `/compact` ausführt. Die Engine fasst ältere Historie zusammen, um Platz freizugeben.
  </Accordion>
  <Accordion title="4. After turn">
    Wird aufgerufen, nachdem ein Durchlauf abgeschlossen ist. Die Engine kann Zustand persistieren, Hintergrund-Compaction auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Für den mitgelieferten Nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem der zusammengestellte Kontext in Codex-Entwickleranweisungen und den Prompt des aktuellen Turns projiziert wird. Codex bleibt weiterhin Eigentümer seiner nativen Thread-Historie und seines nativen Compactors.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Subagent-Lebenszyklus-Hooks auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereitet gemeinsamen Kontextzustand vor, bevor ein Kind-Durchlauf startet. Der Hook erhält Eltern-/Kind-Sitzungsschlüssel, `contextMode` (`isolated` oder `fork`), verfügbare Transcript-IDs/-Dateien und eine optionale TTL. Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, wenn das Starten fehlschlägt, nachdem die Vorbereitung erfolgreich war. Native Subagent-Starts, die `lightContext` anfordern und zu `contextMode="isolated"` aufgelöst werden, überspringen diesen Hook absichtlich, damit das Kind aus dem leichtgewichtigen Bootstrap-Kontext ohne von der Kontext-Engine verwalteten Vorab-Startzustand beginnt.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Räumt auf, wenn eine Subagent-Sitzung abgeschlossen oder bereinigt wird.
</ParamField>

### System-Prompt-Ergänzung

Die Methode `assemble` kann eine `systemPromptAddition`-Zeichenkette zurückgeben. OpenClaw stellt diese dem System-Prompt für den Durchlauf voran. Dadurch können Engines dynamische Recall-Anweisungen, Retrieval-Anweisungen oder kontextbewusste Hinweise injizieren, ohne statische Workspace-Dateien zu benötigen.

## Die legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Ingest**: No-op (der Sitzungsmanager übernimmt die Nachrichtenpersistenz direkt).
- **Assemble**: Durchreichen (die bestehende Pipeline sanitize → validate → limit in der Runtime übernimmt die Kontextzusammenstellung).
- **Compact**: delegiert an die integrierte Zusammenfassungs-Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert lässt.
- **After turn**: No-op.

Die legacy-Engine registriert keine Tools und stellt keine `systemPromptAddition` bereit.

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

Die Factory `ctx` enthält optionale Werte für `config`, `agentDir` und `workspaceDir`, damit Plugins agenten- oder workspacebezogenen Zustand initialisieren können, bevor der erste Lebenszyklus-Hook ausgeführt wird.

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
| `ingest(params)`   | Methode  | Eine einzelne Nachricht speichern                            |
| `assemble(params)` | Methode  | Kontext für einen Modell-Durchlauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Methode  | Kontext zusammenfassen/reduzieren                            |

`assemble` gibt ein `AssembleResult` mit Folgendem zurück:

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
  Steuert, welche Token-Schätzung der Runner für präventive Overflow-Vorprüfungen verwendet. Standard ist `"assembled"`, was bedeutet, dass nur die Schätzung des zusammengestellten Prompts geprüft wird - passend für Engines, die einen fensterbasierten, eigenständigen Kontext zurückgeben. Setzen Sie dies nur dann auf `"preassembly_may_overflow"`, wenn Ihre zusammengestellte Ansicht ein Overflow-Risiko im zugrunde liegenden Transcript verbergen kann; der Runner verwendet dann das Maximum aus der zusammengestellten Schätzung und der Vorab-Assembly-Schätzung der nicht gefensterten Sitzungshistorie, wenn er entscheidet, ob präventiv Compaction durchgeführt werden soll. In jedem Fall sieht das Modell weiterhin die Nachrichten, die Sie zurückgeben - `promptAuthority` betrifft nur die Vorprüfung.
</ParamField>

`compact` gibt ein `CompactResult` zurück. Wenn Compaction das aktive Transcript rotiert, identifizieren `result.sessionId` und `result.sessionFile` die Nachfolgesitzung, die der nächste Wiederholungsversuch oder Turn verwenden muss.

Optionale Member:

| Member                         | Art     | Zweck                                                                                                           |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung zuerst sieht (z. B. beim Importieren von Historie). |
| `ingestBatch(params)`          | Methode | Einen abgeschlossenen Turn als Batch aufnehmen. Wird nach Abschluss eines Durchlaufs mit allen Nachrichten aus diesem Turn auf einmal aufgerufen. |
| `afterTurn(params)`            | Methode | Lebenszyklusarbeit nach dem Durchlauf (Zustand persistieren, Hintergrund-Compaction auslösen).                  |
| `prepareSubagentSpawn(params)` | Methode | Gemeinsamen Zustand für eine Kind-Sitzung einrichten, bevor sie startet.                                        |
| `onSubagentEnded(params)`      | Methode | Nach dem Ende eines Subagents aufräumen.                                                                        |
| `dispose()`                    | Methode | Ressourcen freigeben. Wird beim Herunterfahren des Gateway oder beim Neuladen des Plugins aufgerufen - nicht pro Sitzung. |

### Runtime-Einstellungen

Lebenszyklus-Hooks, die innerhalb von OpenClaw ausgeführt werden, erhalten ein optionales `runtimeSettings`-Objekt. Es ist eine versionierte, schreibgeschützte interne Producer/Consumer-API-Oberfläche: OpenClaw erzeugt sie für die ausgewählte Kontext-Engine, und die Kontext-Engine konsumiert sie innerhalb von Lebenszyklus-Hooks. Sie wird Nutzern nicht direkt angezeigt und erstellt keine eigene Reporting-Oberfläche.

- `schemaVersion`: aktuell `1`
- `runtime`: OpenClaw-Host, Runtime-Modus (`normal`, `fallback` oder `degraded`) und optionale Harness-/Runtime-IDs
- `contextEngineSelection`: ausgewählte Kontext-Engine-ID und Auswahlquelle
- `executionHost`: Host-ID und Label für die Oberfläche, die den Hook aufruft
- `model`: angefordertes Modell, aufgelöstes Modell, Provider und optionale Modellfamilie
- `limits`: Prompt-Token-Budget und maximale Output-Tokens, falls bekannt
- `diagnostics`: geschlossene Fallback- und Degraded-Ursachencodes, falls bekannt

Felder, die unbekannt sein können, werden als `null` dargestellt; Diskriminatorfelder wie Runtime-Modus und Auswahlquelle bleiben nicht-nullable. Ältere Engines bleiben kompatibel: Wenn eine strikte legacy-Engine `runtimeSettings` als unbekannte Eigenschaft ablehnt, wiederholt OpenClaw den Lebenszyklusaufruf ohne sie, statt die Engine unter Quarantäne zu stellen.

### Host-Anforderungen

Kontext-Engines können Host-Fähigkeitsanforderungen auf `info.hostRequirements` deklarieren. OpenClaw prüft diese Anforderungen vor dem Start der Operation und schlägt mit einem beschreibenden Fehler geschlossen fehl, wenn die ausgewählte Runtime sie nicht erfüllen kann.

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

Native Codex- und eingebettete OpenClaw-Agent-Durchläufe erfüllen `assemble-before-prompt`. Generische CLI-Backends tun dies nicht, daher werden Engines, die dies verlangen, abgelehnt, bevor der CLI-Prozess startet.

### Fehlerisolation

OpenClaw isoliert die ausgewählte Plugin-Engine vom zentralen Antwortpfad. Wenn eine Nicht-legacy-Engine fehlt, die Vertragsvalidierung nicht besteht, während der Factory-Erstellung eine Exception auslöst oder aus einer Lebenszyklusmethode eine Exception auslöst, stellt OpenClaw diese Engine für den aktuellen Gateway-Prozess unter Quarantäne und stuft Kontext-Engine-Arbeit auf die integrierte `legacy`-Engine zurück. Der Fehler wird zusammen mit der fehlgeschlagenen Operation protokolliert, damit der Operator das Plugin reparieren, aktualisieren oder deaktivieren kann, ohne dass der Agent verstummt.

Host-Anforderungsfehler sind anders: Wenn eine Engine deklariert, dass einer Runtime
eine erforderliche Fähigkeit fehlt, bricht OpenClaw vor dem Start der Ausführung sicher ab.
Das schützt Engines, die den Zustand beschädigen würden, wenn sie in einem nicht unterstützten Host ausgeführt würden.

### ownsCompaction

`ownsCompaction` steuert, ob die integrierte Auto-Compaction der OpenClaw-Runtime innerhalb eines Versuchs für die Ausführung aktiviert bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine besitzt das Compaction-Verhalten. OpenClaw deaktiviert die integrierte Auto-Compaction der OpenClaw-Runtime für diese Ausführung, und die `compact()`-Implementierung der Engine ist für `/compact`, die Compaction zur Wiederherstellung nach Überlauf und jede proaktive Compaction verantwortlich, die sie in `afterTurn()` ausführen möchte. OpenClaw kann weiterhin den Überlaufschutz vor dem Prompt ausführen; wenn vorhergesagt wird, dass das vollständige Transkript überläuft, ruft der Wiederherstellungspfad die `compact()`-Methode der aktiven Engine auf, bevor ein weiterer Prompt übermittelt wird.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht gesetzt">
    Die integrierte Auto-Compaction der OpenClaw-Runtime kann während der Prompt-Ausführung weiterhin ausgeführt werden, aber die `compact()`-Methode der aktiven Engine wird weiterhin für `/compact` und die Wiederherstellung nach Überlauf aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der Legacy-Engine zurückfällt.
</Warning>

Das bedeutet, es gibt zwei gültige Plugin-Muster:

<Tabs>
  <Tab title="Besitzmodus">
    Implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegationsmodus">
    Setzen Sie `ownsCompaction: false` und lassen Sie `compact()` `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um das integrierte Compaction-Verhalten von OpenClaw zu verwenden.
  </Tab>
</Tabs>

Ein wirkungsloses `compact()` ist für eine aktive, nicht besitzende Engine unsicher, weil es den normalen `/compact`- und Wiederherstellungs-Compaction-Pfad für diesen Engine-Slot deaktiviert.

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
Der Slot ist zur Laufzeit exklusiv - für eine bestimmte Ausführung oder Compaction-Operation wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte `kind: "context-engine"`-Plugins können weiterhin geladen werden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` wählt nur aus, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.
</Note>

<Note>
**Plugin-Deinstallation:** Wenn Sie das derzeit als `plugins.slots.contextEngine` ausgewählte Plugin deinstallieren, setzt OpenClaw den Slot auf den Standardwert (`legacy`) zurück. Dasselbe Zurücksetzungsverhalten gilt für `plugins.slots.memory`. Es ist keine manuelle Konfigurationsbearbeitung erforderlich.
</Note>

## Beziehung zu Compaction und Memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine Verantwortung der Kontext-Engine. Die Legacy-Engine delegiert an die integrierte Zusammenfassung von OpenClaw. Plugin-Engines können jede Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektorabruf usw.).
  </Accordion>
  <Accordion title="Memory-Plugins">
    Memory-Plugins (`plugins.slots.memory`) sind von Kontext-Engines getrennt. Memory-Plugins stellen Suche/Abruf bereit; Kontext-Engines steuern, was das Modell sieht. Sie können zusammenarbeiten - eine Kontext-Engine kann Memory-Plugin-Daten während der Zusammenstellung verwenden. Plugin-Engines, die den aktiven Memory-Prompt-Pfad nutzen möchten, sollten `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` bevorzugen; es wandelt die aktiven Memory-Prompt-Abschnitte in eine voranstellbare `systemPromptAddition` um. Wenn eine Engine Kontrolle auf niedrigerer Ebene benötigt, kann sie weiterhin rohe Zeilen aus `openclaw/plugin-sdk/memory-host-core` über `buildActiveMemoryPromptSection(...)` abrufen.
  </Accordion>
  <Accordion title="Sitzungsbereinigung">
    Das Kürzen alter Tool-Ergebnisse im Arbeitsspeicher wird weiterhin ausgeführt, unabhängig davon, welche Kontext-Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu überprüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie Engines wechseln, behalten vorhandene Sitzungen ihren aktuellen Verlauf bei. Die neue Engine übernimmt für zukünftige Ausführungen.
- Engine-Fehler werden protokolliert, und die ausgewählte Plugin-Engine wird für den aktuellen Gateway-Prozess isoliert. OpenClaw fällt für Benutzer-Turns auf `legacy` zurück, sodass Antworten fortgesetzt werden können, aber Sie sollten das defekte Plugin trotzdem reparieren, aktualisieren, deaktivieren oder deinstallieren.
- Verwenden Sie für die Entwicklung `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis zu verknüpfen, ohne es zu kopieren.

## Verwandt

- [Compaction](/de/concepts/compaction) - Zusammenfassen langer Unterhaltungen
- [Kontext](/de/concepts/context) - wie Kontext für Agent-Turns aufgebaut wird
- [Plugin-Architektur](/de/plugins/architecture) - Registrieren von Kontext-Engine-Plugins
- [Plugin-Manifest](/de/plugins/manifest) - Plugin-Manifest-Felder
- [Plugins](/de/tools/plugin) - Plugin-Übersicht
