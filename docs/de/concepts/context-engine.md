---
read_when:
    - Sie möchten verstehen, wie OpenClaw den Modellkontext zusammenstellt
    - Sie wechseln zwischen der Legacy-Engine und einer Plugin-Engine
    - Sie entwickeln ein Kontext-Engine-Plugin
sidebarTitle: Context engine
summary: 'Kontext-Engine: austauschbare Kontextzusammenstellung, Compaction und Subagent-Lebenszyklus'
title: Kontext-Engine
x-i18n:
    generated_at: "2026-07-24T04:30:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 721780790dacebec44e3c7540b225bd853ee66bf5ae066b84df4344614d93a62
    source_path: concepts/context-engine.md
    workflow: 16
---

Eine **Kontext-Engine** steuert, wie OpenClaw für jeden Lauf den Modellkontext erstellt: welche Nachrichten einbezogen werden, wie ältere Verläufe zusammengefasst werden und wie der Kontext über Subagent-Grenzen hinweg verwaltet wird.

OpenClaw wird mit einer integrierten `legacy`-Engine ausgeliefert und verwendet sie standardmäßig. Installieren und wählen Sie eine Plugin-Engine nur aus, wenn Sie ein anderes Verhalten bei Zusammenstellung, Compaction oder sitzungsübergreifendem Abruf wünschen.

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
    Kontext-Engine-Plugins werden wie jedes andere OpenClaw-Plugin installiert.

    <Tabs>
      <Tab title="Aus npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Aus einem lokalen Pfad">
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
          contextEngine: "lossless-claw", // muss mit der registrierten Engine-ID des Plugins übereinstimmen
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-spezifische Konfiguration wird hier eingetragen (siehe Dokumentation des Plugins)
          },
        },
      },
    }
    ```

    Starten Sie das Gateway nach der Installation und Konfiguration neu.

  </Step>
  <Step title="Zur Legacy-Engine zurückwechseln (optional)">
    Setzen Sie `contextEngine` auf `"legacy"` (oder entfernen Sie den Schlüssel vollständig – `"legacy"` ist der Standardwert).
  </Step>
</Steps>

## Funktionsweise

Bei jeder Ausführung eines Modell-Prompts durch OpenClaw ist die Kontext-Engine an vier Punkten des Lebenszyklus beteiligt:

<AccordionGroup>
  <Accordion title="1. Aufnahme">
    Wird aufgerufen, wenn der Sitzung eine neue Nachricht hinzugefügt wird. Die Engine kann die Nachricht in ihrem eigenen Datenspeicher speichern oder indexieren.
  </Accordion>
  <Accordion title="2. Zusammenstellung">
    Wird vor jedem Modelllauf aufgerufen. Die Engine gibt eine geordnete Gruppe von Nachrichten (und optional eine `systemPromptAddition`) zurück, die innerhalb des Token-Budgets liegen.
  </Accordion>
  <Accordion title="3. Compaction">
    Wird aufgerufen, wenn das Kontextfenster voll ist oder wenn der Benutzer `/compact` ausführt. Die Engine fasst ältere Verläufe zusammen, um Speicherplatz freizugeben.
  </Accordion>
  <Accordion title="4. Nach dem Durchlauf">
    Wird nach Abschluss eines Laufs aufgerufen. Die Engine kann den Zustand dauerhaft speichern, Compaction im Hintergrund auslösen oder Indizes aktualisieren.
  </Accordion>
</AccordionGroup>

Engines können außerdem eine optionale `maintain()`-Methode für die Transkriptpflege (sichere Neuschreibungen über `runtimeContext.rewriteTranscriptEntries()`) nach dem Bootstrap, einem erfolgreichen Durchlauf oder einer Compaction implementieren. Setzen Sie `info.turnMaintenanceMode: "background"`, um sie als verzögerte Arbeit auszuführen, statt die Antwort zu blockieren.

Für das mitgelieferte Nicht-ACP-Codex-Harness wendet OpenClaw denselben Lebenszyklus an, indem der zusammengestellte Kontext in Codex-Entwickleranweisungen und den Prompt des aktuellen Durchlaufs projiziert wird. Codex verwaltet weiterhin seinen nativen Thread-Verlauf und seinen nativen Kompaktor.

### Subagent-Lebenszyklus (optional)

OpenClaw ruft zwei optionale Lebenszyklus-Hooks für Subagents auf:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereitet den gemeinsamen Kontextzustand vor, bevor ein untergeordneter Lauf beginnt. Der Hook erhält übergeordnete/untergeordnete Sitzungsschlüssel, `contextMode` (`isolated` oder `fork`), verfügbare Transkript-IDs/-Dateien und eine optionale TTL. Wenn er ein Rollback-Handle zurückgibt, ruft OpenClaw dieses auf, falls das Erzeugen fehlschlägt, nachdem die Vorbereitung erfolgreich war. Native Subagent-Erzeugungen, die `lightContext` anfordern und zu `contextMode="isolated"` aufgelöst werden, überspringen diesen Hook absichtlich, damit das Kind mit dem schlanken Bootstrap-Kontext ohne von der Kontext-Engine verwalteten Zustand vor der Erzeugung startet.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bereinigt Ressourcen, wenn eine Subagent-Sitzung abgeschlossen oder entfernt wird.
</ParamField>

### Ergänzung des System-Prompts

Die `assemble`-Methode kann eine `systemPromptAddition`-Zeichenfolge zurückgeben. OpenClaw stellt diese dem System-Prompt für den Lauf voran. Dadurch können Engines dynamische Abrufhinweise, Anweisungen zum Retrieval oder kontextbezogene Hinweise einfügen, ohne statische Arbeitsbereichsdateien zu benötigen.

## Die Legacy-Engine

Die integrierte `legacy`-Engine bewahrt das ursprüngliche Verhalten von OpenClaw:

- **Aufnahme**: keine Aktion (der Sitzungsmanager übernimmt die dauerhafte Speicherung der Nachrichten direkt).
- **Zusammenstellung**: unveränderte Weitergabe (die vorhandene Pipeline „Bereinigen → Validieren → Begrenzen“ in der Laufzeitumgebung übernimmt die Kontextzusammenstellung).
- **Compaction**: delegiert an die integrierte zusammenfassende Compaction, die eine einzelne Zusammenfassung älterer Nachrichten erstellt und aktuelle Nachrichten unverändert beibehält.
- **Nach dem Durchlauf**: keine Aktion.

Die Legacy-Engine registriert keine Werkzeuge und stellt keine `systemPromptAddition` bereit.

Wenn keine `plugins.slots.contextEngine` festgelegt ist (oder sie auf `"legacy"` gesetzt ist), wird diese Engine automatisch verwendet.

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

Die Factory `ctx` enthält optionale `config`-, `agentDir`- und `workspaceDir`-
Werte, damit Plugins agenten- oder arbeitsbereichsspezifischen Zustand vor dem
ersten Lebenszyklusaufruf initialisieren können. Vor einem Nicht-Legacy-Aufruf von `assemble()` schließt der Host
die registrierte asynchrone Vorbereitung des Speicher-Prompts ab. Der synchrone
`buildMemorySystemPromptAddition(...)`-Helper liest diesen unveränderlichen Lauf-Snapshot;
übergeben Sie den bereitgestellten Werkzeug-, Zitations-, Agenten- und Sitzungskontext unverändert.

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

Erforderliche Elemente:

| Element             | Art      | Zweck                                                    |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Eigenschaft | Engine-ID, Name, Version und ob sie die Compaction verwaltet |
| `ingest(params)`   | Methode   | Eine einzelne Nachricht speichern                                   |
| `assemble(params)` | Methode   | Kontext für einen Modelllauf erstellen (gibt `AssembleResult` zurück) |
| `compact(params)`  | Methode   | Kontext zusammenfassen/reduzieren                                 |

`assemble` gibt eine `AssembleResult` zurück mit:

<ParamField path="messages" type="Message[]" required>
  Die geordneten Nachrichten, die an das Modell gesendet werden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Die Schätzung der Engine für die Gesamtzahl der Token im zusammengestellten Kontext. OpenClaw verwendet sie für Entscheidungen über Compaction-Schwellenwerte und Diagnoseberichte.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wird dem System-Prompt vorangestellt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Steuert, welche Token-Schätzung der Runner für präventive Überlauf-
  Vorabprüfungen verwendet. Der Standardwert ist `"assembled"`, was bedeutet, dass bei Engines, die die Compaction nicht selbst verwalten, nur die Schätzung des zusammengestellten
  Prompts geprüft wird.
  Engines, die `ownsCompaction: true` setzen, verwalten ihre eigene Prompt-Zulassung,
  daher überspringt OpenClaw standardmäßig die generische Vorabprüfung vor dem Prompt. Setzen Sie
  `"preassembly_may_overflow"` nur, wenn Ihre zusammengestellte Ansicht ein Überlauf-
  risiko im zugrunde liegenden Transkript verbergen kann; der Runner hält dann die generische
  Vorabprüfung aktiv und verwendet das Maximum aus der zusammengestellten Schätzung und der
  Schätzung des Sitzungsverlaufs vor der Zusammenstellung (ohne Fensterbegrenzung), um zu entscheiden, ob
  präventiv eine Compaction durchgeführt werden soll. In beiden Fällen sieht das Modell weiterhin die von Ihnen
  zurückgegebenen Nachrichten – `promptAuthority` wirkt sich nur auf die Vorabprüfung aus.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Optionaler Projektionslebenszyklus für Hosts mit persistenten Backend-Threads (zum Beispiel Codex app-server). `mode: "thread_bootstrap"` mit einer stabilen `epoch` weist den Host an, den zusammengestellten Kontext einmal pro Epoche einzufügen und den Backend-Thread wiederzuverwenden, bis sich die Epoche ändert, statt ihn bei jedem Durchlauf erneut zu projizieren. Lassen Sie dieses Feld für die normale Projektion pro Durchlauf weg.
</ParamField>

`compact` gibt eine `CompactResult` zurück. Wenn die Compaction die aktive Sitzungs-
identität ändert, identifiziert `result.sessionTarget` (eine typisierte `ContextEngineSessionTarget`, welche
die Sitzungsidentität und den Speicherbereich enthält) die Nachfolgesitzung, die der
nächste Wiederholungsversuch oder Durchlauf verwenden muss; `result.sessionId` spiegelt die Nachfolger-ID wider.

Optionale Elemente:

| Element                         | Art   | Zweck                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Engine-Zustand für eine Sitzung initialisieren. Wird einmal aufgerufen, wenn die Engine eine Sitzung zum ersten Mal sieht (z. B. beim Importieren des Verlaufs).                              |
| `maintain(params)`             | Methode | Transkriptpflege nach dem Bootstrap, einem erfolgreichen Durchlauf oder einer Compaction. Verwenden Sie `runtimeContext.rewriteTranscriptEntries()` für sichere Neuschreibungen. |
| `ingestBatch(params)`          | Methode | Einen abgeschlossenen Durchlauf als Batch aufnehmen. Wird nach Abschluss eines Laufs mit allen Nachrichten dieses Durchlaufs auf einmal aufgerufen.                                  |
| `afterTurn(params)`            | Methode | Lebenszyklusarbeit nach dem Lauf (Zustand dauerhaft speichern, Compaction im Hintergrund auslösen).                                                                      |
| `prepareSubagentSpawn(params)` | Methode | Gemeinsamen Zustand für eine untergeordnete Sitzung einrichten, bevor sie beginnt.                                                                                    |
| `onSubagentEnded(params)`      | Methode | Nach dem Ende eines Subagents bereinigen.                                                                                                              |
| `dispose()`                    | Methode | Ressourcen freigeben. Wird beim Herunterfahren des Gateways oder beim Neuladen eines Plugins aufgerufen – nicht pro Sitzung.                                                        |

### Laufzeiteinstellungen

Lebenszyklus-Hooks, die innerhalb von OpenClaw ausgeführt werden, erhalten ein optionales
`runtimeSettings`-Objekt. Es handelt sich um eine versionierte, schreibgeschützte interne
Producer-/Consumer-API-Oberfläche: OpenClaw erzeugt sie für die ausgewählte Kontext-
Engine, und die Kontext-Engine verwendet sie innerhalb der Lebenszyklus-Hooks. Sie wird nicht
direkt für Benutzer dargestellt und erzeugt keine eigene Berichtsoberfläche.

- `schemaVersion`: derzeit `1`
- `runtime`: OpenClaw-Host, Laufzeitmodus (`normal`, `fallback` oder
  `degraded`) und optionale Harness-/Laufzeit-IDs
- `contextEngineSelection`: ID der ausgewählten Kontext-Engine und Auswahlquelle
- `executionHost`: Host-ID und Bezeichnung für die Oberfläche, die den Hook aufruft
- `model`: angefordertes Modell, aufgelöstes Modell, Provider und optionale Modellfamilie
- `limits`: Token-Budget des Prompts und maximale Anzahl der Ausgabe-Token, sofern bekannt
- `diagnostics`: geschlossene Fallback- und Degradierungsgrundcodes, sofern bekannt

Felder, die unbekannt sein können, werden als `null` dargestellt; Diskriminatorfelder wie
Laufzeitmodus und Auswahlquelle bleiben nicht nullfähig. Ältere Engines bleiben
kompatibel: Wenn eine strikt validierende Legacy-Engine `runtimeSettings` als unbekannte
Eigenschaft ablehnt, wiederholt OpenClaw den Lebenszyklusaufruf ohne sie, anstatt
die Engine unter Quarantäne zu stellen.

### Host-Anforderungen

Kontext-Engines können unter `info.hostRequirements` Anforderungen an die Host-Fähigkeiten deklarieren.
OpenClaw prüft diese Anforderungen vor Beginn des Vorgangs und bricht
mit einer aussagekräftigen Fehlermeldung ab, wenn die ausgewählte Laufzeit sie nicht erfüllen kann.

Deklarieren Sie für Agent-Ausführungen `assemble-before-prompt`, wenn die Engine über
`assemble()` den tatsächlichen Modell-Prompt steuern muss:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Verwenden Sie die native Codex-Laufzeit oder die eingebettete OpenClaw-Laufzeit oder wählen Sie die Legacy-Kontext-Engine aus.",
    },
  },
}
```

Native Codex- und eingebettete OpenClaw-Agent-Ausführungen erfüllen `assemble-before-prompt`.
Generische CLI-Backends tun dies nicht. Engines, die diese Fähigkeit voraussetzen, werden daher abgelehnt, bevor der
CLI-Prozess gestartet wird.

### Fehlerisolierung

OpenClaw isoliert die ausgewählte Plugin-Engine vom zentralen Antwortpfad. Wenn eine
Nicht-Legacy-Engine fehlt, bei der Vertragsvalidierung fehlschlägt, während der Factory-Erstellung
eine Ausnahme auslöst oder aus einer Lebenszyklusmethode heraus eine Ausnahme auslöst, stellt OpenClaw diese Engine
für den aktuellen Gateway-Prozess unter Quarantäne und stuft die Kontext-Engine-Verarbeitung auf die
integrierte Engine `legacy` herab. Der Fehler wird zusammen mit dem fehlgeschlagenen Vorgang protokolliert, damit
der Betreiber das Plugin reparieren, aktualisieren oder deaktivieren kann, ohne dass der Agent
verstummt.

Fehler bei Host-Anforderungen werden anders behandelt: Wenn eine Engine deklariert, dass einer Laufzeit
eine erforderliche Fähigkeit fehlt, bricht OpenClaw vor Beginn der Ausführung ab. Dies
schützt Engines, die ihren Zustand beschädigen würden, wenn sie auf einem nicht unterstützten Host ausgeführt würden.

### ownsCompaction

`ownsCompaction` steuert, ob die integrierte automatische Compaction innerhalb eines Ausführungsversuchs der OpenClaw-Laufzeit für die Ausführung aktiviert bleibt:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Die Engine steuert das Compaction-Verhalten. OpenClaw deaktiviert für diese Ausführung die integrierte automatische Compaction und die generische Überlaufvorprüfung vor dem Prompt der OpenClaw-Laufzeit. Die `compact()`-Implementierung der Engine ist für `/compact`, die Compaction zur Wiederherstellung nach einem Provider-Überlauf und jede proaktive Compaction verantwortlich, die sie in `afterTurn()` ausführen möchte. OpenClaw führt die Überlaufsicherung vor dem Prompt weiterhin aus, wenn die Engine `promptAuthority: "preassembly_may_overflow"` aus `assemble()` zurückgibt.
  </Accordion>
  <Accordion title="ownsCompaction: false oder nicht gesetzt">
    Die integrierte automatische Compaction der OpenClaw-Laufzeit kann während der Prompt-Ausführung weiterhin erfolgen, die Methode `compact()` der aktiven Engine wird jedoch weiterhin für `/compact` und die Wiederherstellung nach einem Überlauf aufgerufen.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` bedeutet **nicht**, dass OpenClaw automatisch auf den Compaction-Pfad der Legacy-Engine zurückfällt.
</Warning>

Daraus ergeben sich zwei gültige Plugin-Muster:

<Tabs>
  <Tab title="Steuernder Modus">
    Implementieren Sie Ihren eigenen Compaction-Algorithmus und setzen Sie `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegierender Modus">
    Setzen Sie `ownsCompaction: false` und lassen Sie `compact()` die Funktion `delegateCompactionToRuntime(...)` aus `openclaw/plugin-sdk/core` aufrufen, um das integrierte Compaction-Verhalten von OpenClaw zu verwenden.
  </Tab>
</Tabs>

Eine wirkungslose Implementierung von `compact()` ist für eine aktive, nicht steuernde Engine unsicher, da sie den normalen `/compact`- und Compaction-Pfad zur Wiederherstellung nach einem Überlauf für diesen Engine-Slot deaktiviert.

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
Der Slot ist zur Laufzeit exklusiv – für eine bestimmte Ausführung oder einen Compaction-Vorgang wird nur eine registrierte Kontext-Engine aufgelöst. Andere aktivierte `kind: "context-engine"`-Plugins können weiterhin geladen werden und ihren Registrierungscode ausführen; `plugins.slots.contextEngine` legt lediglich fest, welche registrierte Engine-ID OpenClaw auflöst, wenn eine Kontext-Engine benötigt wird.
</Note>

<Note>
**Deinstallation eines Plugins:** Wenn Sie das derzeit als `plugins.slots.contextEngine` ausgewählte Plugin deinstallieren, setzt OpenClaw den Slot auf den Standardwert (`legacy`) zurück. Dasselbe Rücksetzverhalten gilt für `plugins.slots.memory`. Eine manuelle Bearbeitung der Konfiguration ist nicht erforderlich.
</Note>

## Beziehung zu Compaction und Speicher

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction ist eine der Aufgaben der Kontext-Engine. Die Legacy-Engine delegiert an die integrierte Zusammenfassungsfunktion von OpenClaw. Plugin-Engines können eine beliebige Compaction-Strategie implementieren (DAG-Zusammenfassungen, Vektorsuche usw.).
  </Accordion>
  <Accordion title="Speicher-Plugins">
    Speicher-Plugins (`plugins.slots.memory`) sind von Kontext-Engines getrennt. Speicher-Plugins stellen Suche und Abruf bereit; Kontext-Engines steuern, was das Modell sieht. Beide können zusammenarbeiten – eine Kontext-Engine kann während des Zusammenstellens Daten eines Speicher-Plugins verwenden. Plugin-Engines, die den aktiven Speicher-Prompt-Pfad verwenden möchten, sollten `buildMemorySystemPromptAddition(...)` aus `openclaw/plugin-sdk/core` nutzen. Diese Funktion wandelt die vom Host vorbereiteten Speicher-Prompt-Abschnitte in ein direkt voranstellbares `systemPromptAddition` um, ohne die Struktur des Speicher-Plugins offenzulegen.
  </Accordion>
  <Accordion title="Sitzungsbereinigung">
    Das Kürzen alter Werkzeugergebnisse im Arbeitsspeicher erfolgt weiterhin unabhängig davon, welche Kontext-Engine aktiv ist.
  </Accordion>
</AccordionGroup>

## Tipps

- Verwenden Sie `openclaw doctor`, um zu prüfen, ob Ihre Engine korrekt geladen wird.
- Beim Wechsel der Engine behalten bestehende Sitzungen ihren aktuellen Verlauf bei. Die neue Engine übernimmt zukünftige Ausführungen.
- Engine-Fehler werden protokolliert, und die ausgewählte Plugin-Engine wird für den aktuellen Gateway-Prozess unter Quarantäne gestellt. OpenClaw fällt für Benutzerinteraktionen auf `legacy` zurück, damit Antworten weiterhin möglich sind. Sie sollten das fehlerhafte Plugin dennoch reparieren, aktualisieren, deaktivieren oder deinstallieren.
- Verwenden Sie zur Entwicklung `openclaw plugins install -l ./my-engine`, um ein lokales Plugin-Verzeichnis ohne Kopieren zu verknüpfen.

## Verwandte Themen

- [Compaction](/de/concepts/compaction) – Zusammenfassung langer Unterhaltungen
- [Kontext](/de/concepts/context) – wie der Kontext für Agent-Interaktionen erstellt wird
- [Plugin-Architektur](/de/plugins/architecture) – Registrieren von Kontext-Engine-Plugins
- [Plugin-Manifest](/de/plugins/manifest) – Felder des Plugin-Manifests
- [Plugins](/de/tools/plugin) – Plugin-Übersicht
