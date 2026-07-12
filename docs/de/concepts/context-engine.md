---
read_when:
    - Sie möchten verstehen, wie OpenClaw den Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine.
    - Sie erstellen ein Kontext-Engine-Plugin
sidebarTitle: Context engine
summary: 'Kontext-Engine: erweiterbare Kontextzusammenstellung, Compaction und Lebenszyklus von Subagenten'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-07-12T15:13:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Eine **Context Engine** steuert, wie OpenClaw den Modellkontext für jeden Lauf erstellt: welche Nachrichten einbezogen werden, wie der ältere Verlauf zusammengefasst wird und wie der Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw enthält eine integrierte `legacy`-Engine und verwendet sie standardmäßig. Installieren und wählen Sie eine Plugin-Engine nur dann aus, wenn Sie ein anderes Verhalten bei Zusammenstellung, Compaction oder sitzungsübergreifendem Abruf wünschen.

## Schnellstart

<Steps>
  <Step title="Prüfen, welche Engine aktiv ist">
    ```bash
    openclaw doctor
    # oder Konfiguration direkt prüfen:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Eine Plugin-Engine installieren">
    Context-Engine-Plugins werden wie jedes andere OpenClaw-Plugin installiert.

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
  <Step title="Engine aktivieren und auswählen">
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

  </Step>
  <Step title="Zurück zu legacy wechseln (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel vollständig – `"legacy"` ist der Standardwert).
  </Step>
</Steps>

## Funktionsweise

Bei jeder Ausführung eines Modell-Prompts durch OpenClaw ist die Context Engine an vier Punkten des Lebenszyklus beteiligt:

<AccordionGroup>
  <Accordion title="1. Aufnahme">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indizieren.
  </Accordion>
  <Accordion title="2. Zusammenstellung">
    Wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete Menge von Nachrichten (und optional eine `systemPromptAddition`) zurück, die in das Token-Budget passen.
  </Accordion>
  <Accordion title="3. Compaction">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer `/compact` ausführt. Die Engine fasst den älteren Verlauf zusammen, um Speicherplatz freizugeben.
  </Accordion>
  <Accordion title="4. Nach dem Turn">
    Wird nach Abschluss eines Laufs aufgerufen. Die Engine kann den Zustand dauerhaft speichern, eine Compaction im Hintergrund auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Engines können außerdem eine optionale `maintain()`-Methode für die Transkriptpflege implementieren (sichere Umschreibungen über `runtimeContext.rewriteTranscriptEntries()`) – nach der Initialisierung, einem erfolgreichen Turn oder einer Compaction. Setzen Sie `info.turnMaintenanceMode: "background"`, um sie als aufgeschobene Arbeit auszuführen, anstatt die Antwort zu blockieren.

Für das mitgelieferte Codex-Harness ohne ACP wendet OpenClaw denselben Lebenszyklus an, indem der zusammengestellte Kontext in Codex-Entwickleranweisungen und den Prompt des aktuellen Turns projiziert wird. Codex verwaltet weiterhin seinen nativen Thread-Verlauf und seinen nativen Komprimierer.

### Lebenszyklus von Subagents (optional)

OpenClaw ruft zwei optionale Lebenszyklus-Hooks für Subagents auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereiten Sie den gemeinsamen Kontextzustand vor, bevor ein untergeordneter Lauf beginnt. Der Hook erhält die Sitzungsschlüssel von über- und untergeordneter Sitzung, `contextMode` (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und eine optionale TTL. Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, wenn das Starten fehlschlägt, nachdem die Vorbereitung erfolgreich war. Native Subagent-Starts, die `lightContext` anfordern und zu `contextMode="isolated"` aufgelöst werden, überspringen diesen Hook absichtlich, damit der untergeordnete Prozess mit dem schlanken Initialisierungskontext und ohne von der Context Engine verwalteten Vorabzustand startet.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bereinigen Sie Ressourcen, wenn eine Subagent-Sitzung abgeschlossen oder entfernt wird.
</ParamField>

### Ergänzung des System-Prompts

Die `assemble`-Methode kann eine `systemPromptAddition`-Zeichenfolge zurückgeben. OpenClaw stellt diese dem System-Prompt für den Lauf voran. Dadurch können Engines dynamische Hinweise zum Abruf, Abrufanweisungen oder kontextabhängige Hinweise einfügen, ohne statische Workspace-Dateien zu benötigen.

## Die legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Aufnahme**: keine Operation (der Sitzungsmanager übernimmt die Nachrichtenpersistenz direkt).
- **Zusammenstellung**: unveränderte Weitergabe (die vorhandene Pipeline aus Bereinigung → Validierung → Begrenzung in der Laufzeitumgebung übernimmt die Kontextzusammenstellung).
- **Compaction**: delegiert an die integrierte zusammenfassende Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert beibehält.
- **Nach dem Turn**: keine Operation.

Die legacy-Engine registriert keine Tools und stellt keine `systemPromptAddition` bereit.

Wenn `plugins.slots.contextEngine` nicht festgelegt (oder auf `"legacy"` gesetzt) ist, wird diese Engine automatisch verwendet.

## Plugin-Engines

Ein Plugin kann über die Plugin-API eine Context Engine registrieren:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Speichern Sie die Nachricht in Ihrem Datenspeicher
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Geben Sie Nachrichten zurück, die in das Budget passen
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Fassen Sie älteren Kontext zusammen
      return { ok: true, compacted: true };
    },
  }));
}
```

Der Factory-Kontext `ctx` enthält optionale Werte für `config`, `agentDir` und `workspaceDir`, damit Plugins den Zustand pro Agent oder Workspace initialisieren können, bevor der erste Lebenszyklus-Hook ausgeführt wird.

Aktivieren Sie die Engine anschließend in der Konfiguration:

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

Erforderliche Elemente:

| Element            | Art         | Zweck                                                        |
| ------------------ | ----------- | ------------------------------------------------------------ |
| `info`             | Eigenschaft | Engine-ID, Name, Version und ob sie die Compaction übernimmt |
| `ingest(params)`   | Methode     | Eine einzelne Nachricht speichern                            |
| `assemble(params)` | Methode     | Kontext für einen Modelllauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Methode     | Kontext zusammenfassen/reduzieren                            |

`assemble` gibt ein `AssembleResult` mit folgenden Elementen zurück:

<ParamField path="messages" type="Message[]" required>
  Die geordneten Nachrichten, die an das Modell gesendet werden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Die Schätzung der Engine für die Gesamtzahl der Tokens im zusammengestellten Kontext. OpenClaw verwendet sie für Entscheidungen über Compaction-Schwellenwerte und Diagnoseberichte.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wird dem System-Prompt vorangestellt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Steuert, welche Token-Schätzung der Runner für präventive Vorabprüfungen auf Überlauf verwendet. Der Standardwert ist `"assembled"`. Das bedeutet, dass bei Engines, die die Compaction nicht übernehmen, nur die Schätzung des zusammengestellten Prompts geprüft wird. Engines mit `ownsCompaction: true` verwalten die Zulassung ihrer Prompts selbst, daher überspringt OpenClaw standardmäßig die generische Vorabprüfung vor dem Prompt. Setzen Sie `"preassembly_may_overflow"` nur, wenn Ihre zusammengestellte Ansicht ein Überlaufrisiko im zugrunde liegenden Transkript verbergen kann. Der Runner lässt dann die generische Vorabprüfung aktiv und verwendet das Maximum aus der zusammengestellten Schätzung und der Schätzung des Sitzungsverlaufs vor der Zusammenstellung (ohne Fensterbegrenzung), um zu entscheiden, ob präventiv eine Compaction durchgeführt werden soll. In beiden Fällen sieht das Modell weiterhin die von Ihnen zurückgegebenen Nachrichten – `promptAuthority` wirkt sich nur auf die Vorabprüfung aus.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Optionaler Projektionslebenszyklus für Hosts mit persistenten Backend-Threads (zum Beispiel Codex app-server). `mode: "thread_bootstrap"` mit einem stabilen `epoch` weist den Host an, den zusammengestellten Kontext einmal pro Epoche einzufügen und den Backend-Thread wiederzuverwenden, bis sich die Epoche ändert, anstatt ihn bei jedem Turn erneut zu projizieren. Lassen Sie dieses Feld für die normale Projektion pro Turn weg.
</ParamField>

`compact` gibt ein `CompactResult` zurück. Wenn die Compaction die Identität der aktiven Sitzung ändert, identifiziert `result.sessionTarget` (ein typisiertes `ContextEngineSessionTarget`, das die Sitzungsidentität und den Speicherbereich enthält) die Nachfolgesitzung, die beim nächsten Wiederholungsversuch oder Turn verwendet werden muss; `result.sessionId` spiegelt die Nachfolger-ID wider.

Optionale Elemente:

| Element                        | Art     | Zweck                                                                                                                                                           |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung erstmals verarbeitet (z. B. beim Importieren des Verlaufs). |
| `maintain(params)`             | Methode | Transkriptpflege nach der Initialisierung, einem erfolgreichen Turn oder einer Compaction. Verwenden Sie `runtimeContext.rewriteTranscriptEntries()` für sichere Umschreibungen. |
| `ingestBatch(params)`          | Methode | Einen abgeschlossenen Turn als Batch aufnehmen. Wird nach Abschluss eines Laufs mit allen Nachrichten dieses Turns auf einmal aufgerufen.                       |
| `afterTurn(params)`            | Methode | Lebenszyklusarbeiten nach dem Lauf (Zustand dauerhaft speichern, Compaction im Hintergrund auslösen).                                                            |
| `prepareSubagentSpawn(params)` | Methode | Gemeinsamen Zustand für eine untergeordnete Sitzung einrichten, bevor sie beginnt.                                                                               |
| `onSubagentEnded(params)`      | Methode | Nach dem Ende eines Subagents bereinigen.                                                                                                                        |
| `dispose()`                    | Methode | Ressourcen freigeben. Wird beim Herunterfahren des Gateways oder beim Neuladen des Plugins aufgerufen – nicht pro Sitzung.                                      |

### Laufzeiteinstellungen

Lebenszyklus-Hooks, die innerhalb von OpenClaw ausgeführt werden, erhalten ein optionales `runtimeSettings`-Objekt. Es ist eine versionierte, schreibgeschützte interne API-Oberfläche zwischen Produzent und Konsument: OpenClaw erzeugt sie für die ausgewählte Context Engine, und die Context Engine verwendet sie innerhalb der Lebenszyklus-Hooks. Sie wird Benutzern nicht direkt angezeigt und erzeugt keine eigene Berichtsoberfläche.

- `schemaVersion`: derzeit `1`
- `runtime`: OpenClaw-Host, Laufzeitmodus (`normal`, `fallback` oder `degraded`) sowie optionale Harness-/Laufzeit-IDs
- `contextEngineSelection`: ID der ausgewählten Context Engine und Auswahlquelle
- `executionHost`: Host-ID und Bezeichnung der Oberfläche, die den Hook aufruft
- `model`: angefordertes Modell, aufgelöstes Modell, Provider und optionale Modellfamilie
- `limits`: Token-Budget des Prompts und maximale Anzahl von Ausgabe-Tokens, sofern bekannt
- `diagnostics`: geschlossene Codes für Fallback- und Degradierungsgründe, sofern bekannt

Felder, die unbekannt sein können, werden als `null` dargestellt; Diskriminatorfelder wie Laufzeitmodus und Auswahlquelle bleiben nicht-nullfähig. Ältere Engines bleiben kompatibel: Wenn eine strikt arbeitende Legacy-Engine `runtimeSettings` als unbekannte Eigenschaft ablehnt, wiederholt OpenClaw den Lebenszyklusaufruf ohne diese Eigenschaft, statt die Engine unter Quarantäne zu stellen.

### Host-Anforderungen

Kontext-Engines können unter `info.hostRequirements` Anforderungen an die Host-Fähigkeiten deklarieren. OpenClaw prüft diese Anforderungen vor dem Start des Vorgangs und bricht mit einer aussagekräftigen Fehlermeldung sicher ab, wenn die ausgewählte Laufzeit sie nicht erfüllen kann.

Deklarieren Sie für Agent-Ausführungen `assemble-before-prompt`, wenn die Engine über `assemble()` den tatsächlichen Modell-Prompt steuern muss:

```ts
info: {
  id: "my-context-engine",
  name: "Meine Kontext-Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Verwenden Sie die native Codex-Laufzeit oder die eingebettete OpenClaw-Laufzeit oder wählen Sie die Legacy-Kontext-Engine aus.",
    },
  },
}
```

Native Codex-Agent-Ausführungen und eingebettete OpenClaw-Agent-Ausführungen erfüllen `assemble-before-prompt`. Generische CLI-Backends tun dies nicht. Engines, die diese Fähigkeit erfordern, werden daher abgelehnt, bevor der CLI-Prozess startet.

### Fehlerisolierung

OpenClaw isoliert die ausgewählte Plugin-Engine vom zentralen Antwortpfad. Wenn eine Nicht-Legacy-Engine fehlt, die Vertragsvalidierung nicht besteht, bei der Factory-Erstellung eine Ausnahme auslöst oder aus einer Lebenszyklusmethode heraus eine Ausnahme auslöst, stellt OpenClaw diese Engine für den aktuellen Gateway-Prozess unter Quarantäne und stuft die Kontext-Engine-Verarbeitung auf die integrierte `legacy`-Engine zurück. Der Fehler wird zusammen mit dem fehlgeschlagenen Vorgang protokolliert, sodass der Betreiber das Plugin reparieren, aktualisieren oder deaktivieren kann, ohne dass der Agent nicht mehr antwortet.

Fehler bei Host-Anforderungen werden anders behandelt: Wenn eine Engine deklariert, dass einer Laufzeit eine erforderliche Fähigkeit fehlt, bricht OpenClaw vor dem Start der Ausführung sicher ab. Dies schützt Engines, die ihren Zustand beschädigen würden, wenn sie auf einem nicht unterstützten Host ausgeführt würden.

### ownsCompaction

`ownsCompaction` steuert, ob die integrierte automatische Compaction innerhalb eines Versuchs der OpenClaw-Laufzeit für die Ausführung aktiviert bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine ist für das Compaction-Verhalten verantwortlich. OpenClaw deaktiviert für diese Ausführung die integrierte automatische Compaction der OpenClaw-Laufzeit und die generische Überlauf-Vorprüfung vor dem Prompt. Die `compact()`-Implementierung der Engine ist für `/compact`, die Compaction zur Wiederherstellung nach einem Provider-Überlauf sowie jede proaktive Compaction verantwortlich, die sie in `afterTurn()` durchführen möchte. OpenClaw führt die Überlaufsicherung vor dem Prompt weiterhin aus, wenn die Engine von `assemble()` den Wert `promptAuthority: "preassembly_may_overflow"` zurückgibt.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht festgelegt">
    Die integrierte automatische Compaction der OpenClaw-Laufzeit kann weiterhin während der Prompt-Ausführung stattfinden, aber die `compact()`-Methode der aktiven Engine wird dennoch für `/compact` und die Wiederherstellung nach einem Überlauf aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der Legacy-Engine zurückfällt.
</Warning>

Daraus ergeben sich zwei gültige Plugin-Muster:

<Tabs>
  <Tab title="Eigenständiger Modus">
    Implementieren Sie Ihren eigenen Compaction-Algorithmus und legen Sie `ownsCompaction: true` fest.
  </Tab>
  <Tab title="Delegierender Modus">
    Legen Sie `ownsCompaction: false` fest und lassen Sie `compact()` die Funktion `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um das integrierte Compaction-Verhalten von OpenClaw zu verwenden.
  </Tab>
</Tabs>

Eine wirkungslose `compact()`-Implementierung ist für eine aktive, nicht eigenständig verantwortliche Engine unsicher, da sie den normalen Compaction-Pfad für `/compact` und die Wiederherstellung nach einem Überlauf für diesen Engine-Slot deaktiviert.

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

<Note>
Der Slot ist zur Laufzeit exklusiv – für eine bestimmte Ausführung oder einen bestimmten Compaction-Vorgang wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte Plugins mit `kind: "context-engine"` können weiterhin geladen werden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` wählt lediglich aus, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.
</Note>

<Note>
**Plugin-Deinstallation:** Wenn Sie das derzeit als `plugins.slots.contextEngine` ausgewählte Plugin deinstallieren, setzt OpenClaw den Slot auf den Standardwert (`legacy`) zurück. Dasselbe Rücksetzverhalten gilt für `plugins.slots.memory`. Eine manuelle Bearbeitung der Konfiguration ist nicht erforderlich.
</Note>

## Beziehung zu Compaction und Speicher

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine Aufgabe der Kontext-Engine. Die Legacy-Engine delegiert an die integrierte Zusammenfassungsfunktion von OpenClaw. Plugin-Engines können eine beliebige Compaction-Strategie implementieren, beispielsweise DAG-Zusammenfassungen oder Vektorsuche.
  </Accordion>
  <Accordion title="Speicher-Plugins">
    Speicher-Plugins (`plugins.slots.memory`) sind von Kontext-Engines getrennt. Speicher-Plugins stellen Suche und Abruf bereit; Kontext-Engines steuern, was das Modell sieht. Beide können zusammenarbeiten – eine Kontext-Engine kann während der Zusammenstellung Daten eines Speicher-Plugins verwenden. Plugin-Engines, die den aktiven Speicher-Prompt-Pfad verwenden möchten, sollten vorzugsweise `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` nutzen. Diese Funktion wandelt die aktiven Speicher-Prompt-Abschnitte in eine direkt voranstellbare `systemPromptAddition` um. Wenn eine Engine eine Steuerung auf niedrigerer Ebene benötigt, kann sie weiterhin über `buildActiveMemoryPromptSection(...)` aus `openclaw/plugin-sdk/memory-host-core` die Rohzeilen abrufen.
  </Accordion>
  <Accordion title="Sitzungsbereinigung">
    Das Kürzen alter Tool-Ergebnisse im Arbeitsspeicher erfolgt unabhängig davon, welche Kontext-Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu überprüfen, ob Ihre Engine korrekt geladen wird.
- Wenn Sie die Engine wechseln, werden bestehende Sitzungen mit ihrem aktuellen Verlauf fortgesetzt. Die neue Engine übernimmt zukünftige Ausführungen.
- Engine-Fehler werden protokolliert, und die ausgewählte Plugin-Engine wird für den aktuellen Gateway-Prozess unter Quarantäne gestellt. OpenClaw fällt bei Benutzerinteraktionen auf `legacy` zurück, sodass weiterhin Antworten ausgegeben werden können. Sie sollten das defekte Plugin dennoch reparieren, aktualisieren, deaktivieren oder deinstallieren.
- Verwenden Sie für die Entwicklung `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis ohne Kopieren zu verknüpfen.

## Verwandte Themen

- [Compaction](/de/concepts/compaction) – Zusammenfassung langer Unterhaltungen
- [Kontext](/de/concepts/context) – Aufbau des Kontexts für Agent-Interaktionen
- [Plugin-Architektur](/de/plugins/architecture) – Registrierung von Kontext-Engine-Plugins
- [Plugin-Manifest](/de/plugins/manifest) – Felder des Plugin-Manifests
- [Plugins](/de/tools/plugin) – Überblick über Plugins
