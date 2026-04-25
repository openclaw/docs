---
read_when:
    - Sie binden das Lebenszyklusverhalten der Context Engine in die Codex-Harness ein
    - Sie benötigen lossless-claw oder ein anderes Context-Engine-Plugin, damit es mit eingebetteten Harness-Sitzungen von codex/* funktioniert
    - Sie vergleichen das Kontextverhalten von eingebettetem PI und Codex-App-Server
summary: Spezifikation dafür, dass die gebündelte Codex-App-Server-Harness Context-Engine-Plugins von OpenClaw berücksichtigt
title: Codex-Harness-Portierung der Context Engine
x-i18n:
    generated_at: "2026-04-25T13:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

## Status

Entwurf einer Implementierungsspezifikation.

## Ziel

Sicherstellen, dass die gebündelte Codex-App-Server-Harness denselben Lebenszyklusvertrag der OpenClaw-Context-Engine berücksichtigt, den eingebettete PI-Züge bereits einhalten.

Eine Sitzung mit `agents.defaults.embeddedHarness.runtime: "codex"` oder einem
`codex/*`-Modell soll weiterhin der ausgewählten Context-Engine, etwa
`lossless-claw`, erlauben, die Kontextzusammenstellung, die Erfassung nach dem Zug, die Wartung und die Compaction-Richtlinie auf OpenClaw-Ebene zu steuern, soweit die Grenze des Codex-App-Servers dies zulässt.

## Nicht-Ziele

- Die Interna des Codex-App-Servers nicht neu implementieren.
- Codex-native Thread-Compaction nicht dazu bringen, eine `lossless-claw`-Zusammenfassung zu erzeugen.
- Nicht verlangen, dass Nicht-Codex-Modelle die Codex-Harness verwenden.
- Das Verhalten von ACP-/acpx-Sitzungen nicht ändern. Diese Spezifikation gilt nur für den eingebetteten Agenten-Harness-Pfad ohne ACP.
- Nicht dafür sorgen, dass Drittanbieter-Plugins Erweiterungsfabriken für den Codex-App-Server registrieren; die bestehende Vertrauensgrenze für gebündelte Plugins bleibt unverändert.

## Aktuelle Architektur

Die eingebettete Ausführungsschleife löst die konfigurierte Context Engine einmal pro Lauf auf, bevor eine konkrete Low-Level-Harness ausgewählt wird:

- `src/agents/pi-embedded-runner/run.ts`
  - initialisiert Context-Engine-Plugins
  - ruft `resolveContextEngine(params.config)` auf
  - übergibt `contextEngine` und `contextTokenBudget` an
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegiert an die ausgewählte Agenten-Harness:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Die Codex-App-Server-Harness wird vom gebündelten Codex-Plugin registriert:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Die Implementierung der Codex-Harness erhält dieselben `EmbeddedRunAttemptParams`
wie PI-gestützte Versuche:

- `extensions/codex/src/app-server/run-attempt.ts`

Das bedeutet, dass sich der erforderliche Hook-Punkt in von OpenClaw kontrolliertem Code befindet. Die externe Grenze ist das Protokoll des Codex-App-Servers selbst: OpenClaw kann steuern, was an `thread/start`, `thread/resume` und `turn/start` gesendet wird, und kann Benachrichtigungen beobachten, aber es kann den internen Thread-Speicher oder den nativen Compactor von Codex nicht verändern.

## Aktuelle Lücke

Eingebettete PI-Versuche rufen den Lebenszyklus der Context Engine direkt auf:

- Bootstrap/Wartung vor dem Versuch
- `assemble` vor dem Modellaufruf
- `afterTurn` oder `ingest` nach dem Versuch
- Wartung nach einem erfolgreichen Zug
- Compaction der Context Engine für Engines, die Compaction selbst verwalten

Relevanter PI-Code:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Versuche mit dem Codex-App-Server führen derzeit generische Agenten-Harness-Hooks aus und spiegeln das Transkript, rufen aber nicht `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` oder
`params.contextEngine.maintain` auf.

Relevanter Codex-Code:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Gewünschtes Verhalten

Für Codex-Harness-Züge soll OpenClaw diesen Lebenszyklus beibehalten:

1. Das gespiegelte OpenClaw-Sitzungstranskript lesen.
2. Die aktive Context Engine bootstrappen, wenn bereits eine Sitzungsdatei existiert.
3. Falls verfügbar, Bootstrap-Wartung ausführen.
4. Kontext mit der aktiven Context Engine zusammenstellen.
5. Den zusammengestellten Kontext in Codex-kompatible Eingaben umwandeln.
6. Den Codex-Thread mit Entwickleranweisungen starten oder fortsetzen, die gegebenenfalls `systemPromptAddition` der Context Engine enthalten.
7. Den Codex-Zug mit dem zusammengestellten benutzerseitigen Prompt starten.
8. Das Codex-Ergebnis zurück in das OpenClaw-Transkript spiegeln.
9. `afterTurn` aufrufen, falls implementiert, andernfalls `ingestBatch`/`ingest`, unter Verwendung des gespiegelten Snapshots des Transkripts.
10. Nach erfolgreichen, nicht abgebrochenen Zügen die Zug-Wartung ausführen.
11. Native Compaction-Signale von Codex und Compaction-Hooks von OpenClaw erhalten.

## Entwurfsbeschränkungen

### Der Codex-App-Server bleibt kanonisch für nativen Thread-Status

Codex verwaltet seinen nativen Thread und jeglichen internen erweiterten Verlauf. OpenClaw soll nicht versuchen, den internen Verlauf des App-Servers zu verändern, außer über unterstützte Protokollaufrufe.

Der Transkript-Spiegel von OpenClaw bleibt die Quelle für OpenClaw-Funktionen:

- Chat-Verlauf
- Suche
- Buchführung für `/new` und `/reset`
- zukünftiges Umschalten von Modell oder Harness
- Plugin-Status der Context Engine

### Die Zusammenstellung der Context Engine muss in Codex-Eingaben projiziert werden

Die Schnittstelle der Context Engine gibt `AgentMessage[]` von OpenClaw zurück, keinen Thread-Patch für Codex. `turn/start` des Codex-App-Servers akzeptiert eine aktuelle Benutzereingabe, während `thread/start` und `thread/resume` Entwickleranweisungen akzeptieren.

Daher benötigt die Implementierung eine Projektionsschicht. Die sichere erste Version soll vermeiden, vorzutäuschen, dass sie den internen Verlauf von Codex ersetzen kann. Sie soll zusammengestellten Kontext als deterministisches Prompt-/Entwickleranweisungsmaterial rund um den aktuellen Zug einfügen.

### Stabilität des Prompt-Cache ist wichtig

Bei Engines wie `lossless-claw` soll der zusammengestellte Kontext bei unveränderten Eingaben deterministisch sein. Keine Timestamps, Zufalls-IDs oder nicht deterministische Reihenfolge im generierten Kontexttext hinzufügen.

### Semantik des PI-Fallbacks ändert sich nicht

Die Auswahl der Harness bleibt unverändert:

- `runtime: "pi"` erzwingt PI
- `runtime: "codex"` wählt die registrierte Codex-Harness
- `runtime: "auto"` lässt Plugin-Harnesses unterstützte Provider beanspruchen
- `fallback: "none"` deaktiviert den PI-Fallback, wenn keine Plugin-Harness passt

Diese Arbeit ändert, was geschieht, nachdem die Codex-Harness ausgewählt wurde.

## Implementierungsplan

### 1. Wiederverwendbare Helper für Context-Engine-Versuche exportieren oder verschieben

Derzeit befinden sich die wiederverwendbaren Lebenszyklus-Helper unter dem PI-Runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex soll nach Möglichkeit nicht aus einem Implementierungspfad importieren, dessen Name auf PI verweist.

Ein Harness-neutrales Modul erstellen, zum Beispiel:

- `src/agents/harness/context-engine-lifecycle.ts`

Verschieben oder erneut exportieren:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- einen kleinen Wrapper um `runContextEngineMaintenance`

PI-Importe weiterhin funktionsfähig halten, entweder durch Re-Export aus den alten Dateien oder durch Aktualisierung der PI-Aufrufstellen in derselben PR.

Die neutralen Helper-Namen sollen PI nicht erwähnen.

Vorgeschlagene Namen:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Einen Codex-Projektions-Helper für Kontext hinzufügen

Ein neues Modul hinzufügen:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Verantwortlichkeiten:

- Die zusammengestellten `AgentMessage[]`, den ursprünglichen gespiegelten Verlauf und den aktuellen Prompt akzeptieren.
- Bestimmen, welcher Kontext in Entwickleranweisungen und welcher in die aktuelle Benutzereingabe gehört.
- Den aktuellen Benutzer-Prompt als letzte ausführbare Anforderung erhalten.
- Frühere Nachrichten in einem stabilen, expliziten Format rendern.
- Flüchtige Metadaten vermeiden.

Vorgeschlagene API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Empfohlene erste Projektion:

- `systemPromptAddition` in die Entwickleranweisungen aufnehmen.
- Den zusammengestellten Transkriptkontext in `promptText` vor den aktuellen Prompt setzen.
- Ihn klar als von OpenClaw zusammengestellten Kontext kennzeichnen.
- Den aktuellen Prompt zuletzt beibehalten.
- Den doppelten aktuellen Benutzer-Prompt ausschließen, falls er bereits am Ende erscheint.

Beispiel für die Form des Prompts:

```text
Von OpenClaw zusammengestellter Kontext für diesen Zug:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Aktuelle Benutzeranfrage:
...
```

Das ist weniger elegant als native Historienmanipulation in Codex, aber innerhalb von OpenClaw umsetzbar und bewahrt die Semantik der Context Engine.

Zukünftige Verbesserung: Falls der Codex-App-Server ein Protokoll zum Ersetzen oder Ergänzen des Thread-Verlaufs bereitstellt, diese Projektionsschicht so austauschen, dass sie diese API verwendet.

### 3. Bootstrap vor dem Starten des Codex-Threads einbinden

In `extensions/codex/src/app-server/run-attempt.ts`:

- Den gespiegelten Sitzungsverlauf wie bisher lesen.
- Bestimmen, ob die Sitzungsdatei vor diesem Lauf existierte. Bevorzugt ein Helper, der `fs.stat(params.sessionFile)` vor dem Schreiben des Spiegels prüft.
- Einen `SessionManager` öffnen oder einen schmalen Adapter für den Session Manager verwenden, falls der Helper ihn benötigt.
- Den neutralen Bootstrap-Helper aufrufen, wenn `params.contextEngine` existiert.

Pseudo-Ablauf:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Dieselbe `sessionKey`-Konvention verwenden wie die Codex-Tool-Bridge und der Transkript-Spiegel. Derzeit berechnet Codex `sandboxSessionKey` aus `params.sessionKey` oder `params.sessionId`; dies konsistent verwenden, sofern es keinen Grund gibt, rohes `params.sessionKey` beizubehalten.

### 4. `assemble` vor `thread/start` / `thread/resume` und `turn/start` einbinden

In `runCodexAppServerAttempt`:

1. Zuerst dynamische Tools aufbauen, damit die Context Engine die tatsächlich verfügbaren Tool-Namen sieht.
2. Den gespiegelten Sitzungsverlauf lesen.
3. `assemble(...)` der Context Engine ausführen, wenn `params.contextEngine` existiert.
4. Das zusammengestellte Ergebnis projizieren in:
   - zusätzliche Entwickleranweisungen
   - Prompt-Text für `turn/start`

Der bestehende Hook-Aufruf:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

soll kontextbewusst werden:

1. Basis-Entwickleranweisungen mit `buildDeveloperInstructions(params)` berechnen
2. Zusammenstellung/Projektion der Context Engine anwenden
3. `before_prompt_build` mit dem projizierten Prompt/den projizierten Entwickleranweisungen ausführen

Diese Reihenfolge sorgt dafür, dass generische Prompt-Hooks denselben Prompt sehen, den Codex erhält. Falls strikte PI-Parität erforderlich ist, Context-Engine-Zusammenstellung vor der Hook-Komposition ausführen, da PI `systemPromptAddition` der Context Engine nach seiner Prompt-Pipeline auf den endgültigen Systemprompt anwendet. Die wichtige Invariante ist, dass sowohl Context Engine als auch Hooks eine deterministische, dokumentierte Reihenfolge erhalten.

Empfohlene Reihenfolge für die erste Implementierung:

1. `buildDeveloperInstructions(params)`
2. `assemble()` der Context Engine
3. `systemPromptAddition` an Entwickleranweisungen anhängen/voranstellen
4. Zusammengestellte Nachrichten in Prompt-Text projizieren
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. Endgültige Entwickleranweisungen an `startOrResumeThread(...)` übergeben
7. Endgültigen Prompt-Text an `buildTurnStartParams(...)` übergeben

Die Spezifikation soll in Tests kodiert werden, damit zukünftige Änderungen diese Reihenfolge nicht versehentlich ändern.

### 5. Prompt-Cache-stabiles Format beibehalten

Der Projektions-Helper muss bei identischen Eingaben byte-stabile Ausgabe erzeugen:

- stabile Nachrichtenreihenfolge
- stabile Rollenbezeichnungen
- keine generierten Timestamps
- keine Leckage der Reihenfolge von Objektschlüsseln
- keine zufälligen Trennzeichen
- keine IDs pro Lauf

Feste Trennzeichen und explizite Abschnitte verwenden.

### 6. Nach dem Spiegeln des Transkripts Nachbearbeitung nach dem Zug einbinden

`CodexAppServerEventProjector` von Codex erstellt einen lokalen `messagesSnapshot` für den
aktuellen Zug. `mirrorTranscriptBestEffort(...)` schreibt diesen Snapshot in den
OpenClaw-Transkriptspiegel.

Nachdem das Spiegeln erfolgreich war oder fehlgeschlagen ist, den Finalizer der Context Engine mit dem
besten verfügbaren Nachrichten-Snapshot aufrufen:

- Den vollständigen gespiegelten Sitzungskontext nach dem Schreiben bevorzugen, weil `afterTurn`
  den Snapshot der Sitzung erwartet, nicht nur den aktuellen Zug.
- Auf `historyMessages + result.messagesSnapshot` zurückfallen, wenn die Sitzungsdatei
  nicht erneut geöffnet werden kann.

Pseudo-Ablauf:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Wenn das Spiegeln fehlschlägt, `afterTurn` dennoch mit dem Fallback-Snapshot aufrufen, aber protokollieren,
dass die Context Engine aus Fallback-Zugdaten erfasst.

### 7. Laufzeitkontext für Nutzung und Prompt-Cache normalisieren

Codex-Ergebnisse enthalten normalisierte Nutzung aus Token-Benachrichtigungen des App-Servers, sofern verfügbar. Diese Nutzung an den Laufzeitkontext der Context Engine übergeben.

Falls der Codex-App-Server irgendwann Details zu Cache Read/Write bereitstellt, diese in
`ContextEnginePromptCacheInfo` abbilden. Bis dahin `promptCache` weglassen, statt Nullen zu erfinden.

### 8. Compaction-Richtlinie

Es gibt zwei Compaction-Systeme:

1. `compact()` der OpenClaw-Context-Engine
2. natives `thread/compact/start` des Codex-App-Servers

Diese nicht stillschweigend vermischen.

#### `/compact` und explizite OpenClaw-Compaction

Wenn die ausgewählte Context Engine `info.ownsCompaction === true` hat, soll explizite
OpenClaw-Compaction das Ergebnis von `compact()` der Context Engine für den
OpenClaw-Transkriptspiegel und den Plugin-Status bevorzugen.

Wenn die ausgewählte Codex-Harness eine native Thread-Bindung hat, können wir zusätzlich
native Compaction von Codex anfordern, um den Thread des App-Servers gesund zu halten, aber dies muss
als separate Backend-Aktion in den Details gemeldet werden.

Empfohlenes Verhalten:

- Wenn `contextEngine.info.ownsCompaction === true`:
  - zuerst `compact()` der Context Engine aufrufen
  - dann best-effort native Compaction von Codex aufrufen, wenn eine Thread-Bindung existiert
  - das Ergebnis der Context Engine als primäres Ergebnis zurückgeben
  - den Status der nativen Compaction von Codex in `details.codexNativeCompaction` aufnehmen
- Wenn die aktive Context Engine keine Compaction besitzt:
  - das aktuelle Verhalten der nativen Compaction von Codex beibehalten

Dies erfordert wahrscheinlich eine Änderung an `extensions/codex/src/app-server/compact.ts` oder
ein Wrapping aus dem generischen Compaction-Pfad, je nachdem, wo
`maybeCompactAgentHarnessSession(...)` aufgerufen wird.

#### Native Codex-`contextCompaction`-Ereignisse während eines Zuges

Codex kann während eines Zuges Item-Ereignisse `contextCompaction` ausgeben. Die aktuelle Ausgabe von Hooks vor/nach der Compaction in `event-projector.ts` beibehalten, dies aber nicht als abgeschlossene Compaction der Context Engine behandeln.

Für Engines, die Compaction besitzen, eine explizite Diagnose ausgeben, wenn Codex dennoch
native Compaction durchführt:

- Stream-/Ereignisname: der bestehende Stream `compaction` ist akzeptabel
- Details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dadurch wird die Trennung prüfbar.

### 9. Verhalten bei Sitzungs-Reset und Bindungen

Das bestehende `reset(...)` der Codex-Harness entfernt die Codex-App-Server-Bindung aus
der OpenClaw-Sitzungsdatei. Dieses Verhalten beibehalten.

Außerdem sicherstellen, dass die Bereinigung des Status der Context Engine weiterhin über die bestehenden Lebenszykluspfade der OpenClaw-Sitzung erfolgt. Keine Codex-spezifische Bereinigung hinzufügen, es sei denn, dem Lebenszyklus der Context Engine fehlen derzeit Reset-/Delete-Ereignisse für alle Harnesses.

### 10. Fehlerbehandlung

PI-Semantik befolgen:

- Bootstrap-Fehler warnen und es wird fortgefahren
- `assemble`-Fehler warnen und fallen auf nicht zusammengesetzte Pipeline-Nachrichten/Prompts zurück
- `afterTurn`-/`ingest`-Fehler warnen und markieren die Finalisierung nach dem Zug als nicht erfolgreich
- Wartung läuft nur nach erfolgreichen, nicht abgebrochenen Zügen ohne Yield
- Compaction-Fehler dürfen nicht als neue Prompts erneut versucht werden

Codex-spezifische Ergänzungen:

- Wenn die Kontextprojektion fehlschlägt, warnen und auf den ursprünglichen Prompt zurückfallen.
- Wenn das Spiegeln des Transkripts fehlschlägt, dennoch versuchen, die Finalisierung der Context Engine mit
  Fallback-Nachrichten durchzuführen.
- Wenn native Compaction von Codex nach erfolgreicher Compaction der Context Engine fehlschlägt,
  die gesamte OpenClaw-Compaction nicht fehlschlagen lassen, wenn die Context Engine primär ist.

## Testplan

### Unit-Tests

Tests unter `extensions/codex/src/app-server` hinzufügen:

1. `run-attempt.context-engine.test.ts`
   - Codex ruft `bootstrap` auf, wenn eine Sitzungsdatei existiert.
   - Codex ruft `assemble` mit gespiegelten Nachrichten, Token-Budget, Tool-Namen,
     Zitiermodus, Modell-ID und Prompt auf.
   - `systemPromptAddition` ist in den Entwickleranweisungen enthalten.
   - Zusammengestellte Nachrichten werden vor der aktuellen Anfrage in den Prompt projiziert.
   - Codex ruft `afterTurn` nach dem Spiegeln des Transkripts auf.
   - Ohne `afterTurn` ruft Codex `ingestBatch` oder `ingest` pro Nachricht auf.
   - Zug-Wartung läuft nach erfolgreichen Zügen.
   - Zug-Wartung läuft nicht bei Prompt-Fehler, Abbruch oder Yield-Abbruch.

2. `context-engine-projection.test.ts`
   - stabile Ausgabe bei identischen Eingaben
   - kein doppelter aktueller Prompt, wenn der zusammengestellte Verlauf ihn enthält
   - verarbeitet leeren Verlauf
   - erhält die Rollenreihenfolge
   - enthält die Ergänzung des Systemprompts nur in den Entwickleranweisungen

3. `compact.context-engine.test.ts`
   - das primäre Ergebnis der besitzenden Context Engine gewinnt
   - der Status der nativen Compaction von Codex erscheint in den Details, wenn sie ebenfalls versucht wurde
   - ein nativer Codex-Fehler lässt die Compaction einer besitzenden Context Engine nicht fehlschlagen
   - eine nicht besitzende Context Engine bewahrt das aktuelle Verhalten der nativen Compaction

### Bestehende Tests, die aktualisiert werden müssen

- `extensions/codex/src/app-server/run-attempt.test.ts`, falls vorhanden, andernfalls
  die nächstliegenden Tests zu Codex-App-Server-Läufen.
- `extensions/codex/src/app-server/event-projector.test.ts` nur, wenn sich die Details
  von Compaction-Ereignissen ändern.
- `src/agents/harness/selection.test.ts` sollte keine Änderungen benötigen, es sei denn, das Verhalten der Konfiguration ändert sich; es sollte stabil bleiben.
- PI-Tests der Context Engine sollen unverändert weiter bestehen.

### Integrations-/Live-Tests

Smoke-Tests für die Live-Codex-Harness hinzufügen oder erweitern:

- `plugins.slots.contextEngine` auf eine Test-Engine konfigurieren
- `agents.defaults.model` auf ein `codex/*`-Modell konfigurieren
- `agents.defaults.embeddedHarness.runtime = "codex"` konfigurieren
- sicherstellen, dass die Test-Engine Folgendes beobachtet hat:
  - Bootstrap
  - Assemble
  - `afterTurn` oder `ingest`
  - Wartung

Nicht verlangen, dass `lossless-claw` in Core-Tests von OpenClaw verwendet wird. Stattdessen ein kleines Fake-Plugin für die Context Engine im Repository verwenden.

## Observability

Debug-Logs rund um Aufrufe des Lebenszyklus der Codex-Context-Engine hinzufügen:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` mit Grund
- `codex native compaction completed alongside context-engine compaction`

Keine vollständigen Prompts oder Transkriptinhalte protokollieren.

Wo sinnvoll strukturierte Felder hinzufügen:

- `sessionId`
- `sessionKey` entsprechend der bestehenden Logging-Praxis geschwärzt oder weggelassen
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / Kompatibilität

Dies soll rückwärtskompatibel sein:

- Wenn keine Context Engine konfiguriert ist, soll das veraltete Verhalten der Context Engine
  dem heutigen Verhalten der Codex-Harness entsprechen.
- Wenn `assemble` der Context Engine fehlschlägt, soll Codex mit dem ursprünglichen
  Prompt-Pfad fortfahren.
- Bestehende Codex-Thread-Bindungen sollen gültig bleiben.
- Dynamisches Tool-Fingerprinting soll keine Ausgabe der Context Engine enthalten; andernfalls
  könnte jede Kontextänderung einen neuen Codex-Thread erzwingen. Nur der Tool-Katalog
  soll den dynamischen Tool-Fingerprint beeinflussen.

## Offene Fragen

1. Soll der zusammengestellte Kontext vollständig in den Benutzer-Prompt, vollständig
   in die Entwickleranweisungen oder aufgeteilt injiziert werden?

   Empfehlung: aufteilen. `systemPromptAddition` in die Entwickleranweisungen setzen;
   zusammengestellten Transkriptkontext in den Wrapper des Benutzer-Prompts setzen. Das passt am besten
   zum aktuellen Codex-Protokoll, ohne den nativen Thread-Verlauf zu verändern.

2. Soll native Compaction von Codex deaktiviert werden, wenn eine Context Engine
   Compaction besitzt?

   Empfehlung: nein, zumindest zunächst nicht. Native Compaction von Codex kann weiterhin
   erforderlich sein, um den App-Server-Thread am Leben zu halten. Sie muss aber als
   native Codex-Compaction gemeldet werden, nicht als Compaction der Context Engine.

3. Soll `before_prompt_build` vor oder nach der Zusammenstellung der Context Engine laufen?

   Empfehlung: für Codex nach der Projektion der Context Engine, damit generische Harness-
   Hooks den tatsächlichen Prompt/die tatsächlichen Entwickleranweisungen sehen, die Codex erhalten wird. Falls PI-
   Parität das Gegenteil erfordert, die gewählte Reihenfolge in Tests festschreiben und hier
   dokumentieren.

4. Kann der Codex-App-Server künftig ein strukturiertes Override für Kontext/Verlauf akzeptieren?

   Unbekannt. Falls ja, die Text-Projektionsschicht durch dieses Protokoll ersetzen und
   die Lebenszyklus-Aufrufe unverändert lassen.

## Akzeptanzkriterien

- Ein eingebetteter Harness-Zug für `codex/*` ruft den `assemble`-Lebenszyklus der ausgewählten Context Engine auf.
- Eine Context-Engine-`systemPromptAddition` wirkt sich auf die Entwickleranweisungen von Codex aus.
- Zusammengestellter Kontext wirkt sich deterministisch auf die Zugeingabe von Codex aus.
- Erfolgreiche Codex-Züge rufen `afterTurn` oder den Fallback `ingest` auf.
- Erfolgreiche Codex-Züge führen die Zug-Wartung der Context Engine aus.
- Fehlgeschlagene/abgebrochene/Yield-abgebrochene Züge führen keine Zug-Wartung aus.
- Compaction einer Context Engine bleibt primär für OpenClaw-/Plugin-Status.
- Native Compaction von Codex bleibt als natives Codex-Verhalten prüfbar.
- Das bestehende Verhalten der PI-Context-Engine bleibt unverändert.
- Das bestehende Verhalten der Codex-Harness bleibt unverändert, wenn keine nicht veraltete Context Engine
  ausgewählt ist oder wenn die Zusammenstellung fehlschlägt.
