---
read_when:
    - Sie integrieren das Lebenszyklusverhalten der Kontext-Engine in das Codex-Harness
    - Sie benötigen lossless-claw oder ein anderes context-engine-Plugin für die Arbeit mit eingebetteten codex/*-Harness-Sitzungen.
    - Sie vergleichen das Kontextverhalten von eingebettetem PI und dem Codex-App-Server
summary: Spezifikation, damit der mitgelieferte Codex-App-Server-Harness OpenClaw-Kontext-Engine-Plugins berücksichtigt
title: Portierung der Codex-Harness-Kontext-Engine
x-i18n:
    generated_at: "2026-05-03T06:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Entwurf der Implementierungsspezifikation.

## Ziel

Sicherstellen, dass der gebündelte Codex-App-Server-Harness denselben OpenClaw-Kontext-Engine-Lebenszyklusvertrag einhält, den eingebettete PI-Turns bereits einhalten.

Eine Sitzung mit `agents.defaults.embeddedHarness.runtime: "codex"` oder einem `codex/*`-Modell sollte weiterhin zulassen, dass das ausgewählte Kontext-Engine-Plugin, etwa `lossless-claw`, Kontextzusammenstellung, Post-Turn-Ingest, Wartung und OpenClaw-Compaction-Richtlinie so weit steuert, wie es die Codex-App-Server-Grenze erlaubt.

## Nicht-Ziele

- Codex-App-Server-Interna nicht neu implementieren.
- Native Codex-Thread-Compaction nicht dazu bringen, eine lossless-claw-Zusammenfassung zu erzeugen.
- Nicht verlangen, dass Nicht-Codex-Modelle den Codex-Harness verwenden.
- ACP-/acpx-Sitzungsverhalten nicht ändern. Diese Spezifikation gilt nur für den Nicht-ACP-Pfad des eingebetteten Agent-Harness.
- Drittanbieter-Plugins nicht dazu bringen, Codex-App-Server-Erweiterungs-Factories zu registrieren; die bestehende Vertrauensgrenze für gebündelte Plugins bleibt unverändert.

## Aktuelle Architektur

Die eingebettete Run-Schleife löst die konfigurierte Kontext-Engine einmal pro Run auf, bevor sie einen konkreten Low-Level-Harness auswählt:

- `src/agents/pi-embedded-runner/run.ts`
  - initialisiert Kontext-Engine-Plugins
  - ruft `resolveContextEngine(params.config)` auf
  - übergibt `contextEngine` und `contextTokenBudget` an
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegiert an den ausgewählten Agent-Harness:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Der Codex-App-Server-Harness wird vom gebündelten Codex-Plugin registriert:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Die Codex-Harness-Implementierung erhält dieselben `EmbeddedRunAttemptParams` wie PI-gestützte Versuche:

- `extensions/codex/src/app-server/run-attempt.ts`

Das bedeutet, der erforderliche Hook-Punkt liegt in von OpenClaw kontrolliertem Code. Die externe Grenze ist das Codex-App-Server-Protokoll selbst: OpenClaw kann steuern, was es an `thread/start`, `thread/resume` und `turn/start` sendet, und kann Benachrichtigungen beobachten, aber es kann Codex' internen Thread-Speicher oder nativen Compactor nicht ändern.

## Aktuelle Lücke

Eingebettete PI-Versuche rufen den Kontext-Engine-Lebenszyklus direkt auf:

- Bootstrap/Wartung vor dem Versuch
- Assemble vor dem Modellaufruf
- afterTurn oder Ingest nach dem Versuch
- Wartung nach einem erfolgreichen Turn
- Kontext-Engine-Compaction für Engines, die Compaction besitzen

Relevanter PI-Code:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex-App-Server-Versuche führen derzeit generische Agent-Harness-Hooks aus und spiegeln das Transkript, rufen aber weder `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` noch `params.contextEngine.maintain` auf.

Relevanter Codex-Code:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Gewünschtes Verhalten

Für Codex-Harness-Turns sollte OpenClaw diesen Lebenszyklus beibehalten:

1. Das gespiegelte OpenClaw-Sitzungstranskript lesen.
2. Die aktive Kontext-Engine per Bootstrap initialisieren, wenn eine vorherige Sitzungsdatei vorhanden ist.
3. Bootstrap-Wartung ausführen, wenn verfügbar.
4. Kontext mit der aktiven Kontext-Engine zusammenstellen.
5. Den zusammengestellten Kontext in Codex-kompatible Eingaben umwandeln.
6. Den Codex-Thread mit Entwickleranweisungen starten oder fortsetzen, die eine etwaige Kontext-Engine-`systemPromptAddition` enthalten.
7. Den Codex-Turn mit dem zusammengestellten benutzerseitigen Prompt starten.
8. Das Codex-Ergebnis zurück in das OpenClaw-Transkript spiegeln.
9. `afterTurn` aufrufen, falls implementiert, andernfalls `ingestBatch`/`ingest`, unter Verwendung des gespiegelten Transkript-Snapshots.
10. Turn-Wartung nach erfolgreichen, nicht abgebrochenen Turns ausführen.
11. Native Codex-Compaction-Signale und OpenClaw-Compaction-Hooks beibehalten.

## Entwurfsbeschränkungen

### Codex-App-Server bleibt kanonisch für nativen Thread-Zustand

Codex besitzt seinen nativen Thread und jegliche interne erweiterte Historie. OpenClaw sollte nicht versuchen, die interne Historie des App-Servers außer über unterstützte Protokollaufrufe zu verändern.

OpenClaws Transkriptspiegel bleibt die Quelle für OpenClaw-Funktionen:

- Chatverlauf
- Suche
- `/new`- und `/reset`-Buchführung
- zukünftiger Modell- oder Harness-Wechsel
- Kontext-Engine-Plugin-Zustand

### Kontext-Engine-Assembly muss in Codex-Eingaben projiziert werden

Die Kontext-Engine-Schnittstelle gibt OpenClaw-`AgentMessage[]` zurück, keinen Codex-Thread-Patch. Codex-App-Server-`turn/start` akzeptiert eine aktuelle Benutzereingabe, während `thread/start` und `thread/resume` Entwickleranweisungen akzeptieren.

Daher benötigt die Implementierung eine Projektionsschicht. Die sichere erste Version sollte nicht vorgeben, Codex-interne Historie ersetzen zu können. Sie sollte zusammengestellten Kontext als deterministisches Prompt-/Entwickleranweisungs-Material um den aktuellen Turn herum injizieren.

### Prompt-Cache-Stabilität ist wichtig

Für Engines wie lossless-claw sollte der zusammengestellte Kontext bei unveränderten Eingaben deterministisch sein. Fügen Sie dem erzeugten Kontexttext keine Zeitstempel, zufälligen IDs oder nichtdeterministische Sortierung hinzu.

### Laufzeitauswahl-Semantik ändert sich nicht

Die Harness-Auswahl bleibt wie bisher:

- `runtime: "pi"` erzwingt PI
- `runtime: "codex"` wählt den registrierten Codex-Harness aus
- `runtime: "auto"` lässt Plugin-Harnesses unterstützte Provider beanspruchen
- nicht übereinstimmende `auto`-Runs verwenden PI

Diese Arbeit ändert, was passiert, nachdem der Codex-Harness ausgewählt wurde.

## Implementierungsplan

### 1. Wiederverwendbare Kontext-Engine-Versuchshelfer exportieren oder verschieben

Heute liegen die wiederverwendbaren Lebenszyklushelfer unter dem PI-Runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex sollte nicht aus einem Implementierungspfad importieren, dessen Name PI impliziert, wenn wir das vermeiden können.

Erstellen Sie ein Harness-neutrales Modul, zum Beispiel:

- `src/agents/harness/context-engine-lifecycle.ts`

Verschieben oder re-exportieren Sie:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- einen kleinen Wrapper um `runContextEngineMaintenance`

Halten Sie PI-Importe funktionsfähig, entweder durch Re-Export aus den alten Dateien oder durch Aktualisieren der PI-Aufrufstellen im selben PR.

Die neutralen Helfernamen sollten PI nicht erwähnen.

Vorgeschlagene Namen:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Einen Codex-Kontextprojektionshelfer hinzufügen

Fügen Sie ein neues Modul hinzu:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Verantwortlichkeiten:

- Die zusammengestellten `AgentMessage[]`, die ursprüngliche gespiegelte Historie und den aktuellen Prompt akzeptieren.
- Bestimmen, welcher Kontext in Entwickleranweisungen gegenüber der aktuellen Benutzereingabe gehört.
- Den aktuellen Benutzer-Prompt als abschließende ausführbare Anfrage beibehalten.
- Vorherige Nachrichten in einem stabilen, expliziten Format rendern.
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

- `systemPromptAddition` in Entwickleranweisungen aufnehmen.
- Den zusammengestellten Transkriptkontext vor dem aktuellen Prompt in `promptText` setzen.
- Ihn klar als von OpenClaw zusammengestellten Kontext kennzeichnen.
- Aktuellen Prompt zuletzt halten.
- Doppelte aktuelle Benutzer-Prompts ausschließen, wenn sie bereits am Ende erscheinen.

Beispielhafte Prompt-Form:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Das ist weniger elegant als native Codex-Historienbearbeitung, ist aber innerhalb von OpenClaw implementierbar und bewahrt die Kontext-Engine-Semantik.

Zukünftige Verbesserung: Wenn der Codex-App-Server ein Protokoll zum Ersetzen oder Ergänzen der Thread-Historie bereitstellt, diese Projektionsschicht auf diese API umstellen.

### 3. Bootstrap vor dem Start des Codex-Threads verdrahten

In `extensions/codex/src/app-server/run-attempt.ts`:

- Gespiegelte Sitzungshistorie wie bisher lesen.
- Bestimmen, ob die Sitzungsdatei vor diesem Run vorhanden war. Bevorzugen Sie einen Helfer, der `fs.stat(params.sessionFile)` vor Spiegelungsschreibvorgängen prüft.
- Einen `SessionManager` öffnen oder einen schmalen Session-Manager-Adapter verwenden, falls der Helfer ihn benötigt.
- Den neutralen Bootstrap-Helfer aufrufen, wenn `params.contextEngine` existiert.

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

Verwenden Sie dieselbe `sessionKey`-Konvention wie die Codex-Tool-Bridge und der Transkriptspiegel. Heute berechnet Codex `sandboxSessionKey` aus `params.sessionKey` oder `params.sessionId`; verwenden Sie dies konsistent, sofern es keinen Grund gibt, den rohen `params.sessionKey` beizubehalten.

### 4. Assemble vor `thread/start` / `thread/resume` und `turn/start` verdrahten

In `runCodexAppServerAttempt`:

1. Zuerst dynamische Tools erstellen, damit die Kontext-Engine die tatsächlich verfügbaren Tool-Namen sieht.
2. Gespiegelte Sitzungshistorie lesen.
3. Kontext-Engine-`assemble(...)` ausführen, wenn `params.contextEngine` existiert.
4. Das zusammengestellte Ergebnis projizieren in:
   - Ergänzung der Entwickleranweisungen
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

sollte kontextbewusst werden:

1. Basis-Entwickleranweisungen mit `buildDeveloperInstructions(params)` berechnen
2. Kontext-Engine-Assembly/-Projektion anwenden
3. `before_prompt_build` mit dem projizierten Prompt/den projizierten Entwickleranweisungen ausführen

Diese Reihenfolge lässt generische Prompt-Hooks denselben Prompt sehen, den Codex erhalten wird. Wenn strikte PI-Parität benötigt wird, führen Sie Kontext-Engine-Assembly vor der Hook-Komposition aus, weil PI die Kontext-Engine-`systemPromptAddition` nach seiner Prompt-Pipeline auf den finalen System-Prompt anwendet. Die wichtige Invariante ist, dass sowohl Kontext-Engine als auch Hooks eine deterministische, dokumentierte Reihenfolge erhalten.

Empfohlene Reihenfolge für die erste Implementierung:

1. `buildDeveloperInstructions(params)`
2. Kontext-Engine-`assemble()`
3. `systemPromptAddition` an Entwickleranweisungen anhängen/voranstellen
4. zusammengestellte Nachrichten in Prompt-Text projizieren
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. finale Entwickleranweisungen an `startOrResumeThread(...)` übergeben
7. finalen Prompt-Text an `buildTurnStartParams(...)` übergeben

Die Spezifikation sollte in Tests kodiert werden, damit künftige Änderungen die Reihenfolge nicht versehentlich verändern.

### 5. Prompt-Cache-stabile Formatierung beibehalten

Der Projektionshelfer muss bei identischen Eingaben byte-stabile Ausgabe erzeugen:

- stabile Nachrichtenreihenfolge
- stabile Rollenlabels
- keine generierten Zeitstempel
- kein Durchsickern von Objekt-Schlüsselreihenfolgen
- keine zufälligen Trennzeichen
- keine IDs pro Run

Verwenden Sie feste Trennzeichen und explizite Abschnitte.

### 6. Post-Turn nach Transkriptspiegelung verdrahten

Codex’ `CodexAppServerEventProjector` erstellt ein lokales `messagesSnapshot` für den
aktuellen Turn. `mirrorTranscriptBestEffort(...)` schreibt diesen Snapshot in die
OpenClaw-Transkriptspiegelung.

Nachdem die Spiegelung erfolgreich war oder fehlgeschlagen ist, rufen Sie den Context-Engine-Finalizer mit dem
besten verfügbaren Nachrichten-Snapshot auf:

- Bevorzugen Sie den vollständigen gespiegelten Sitzungskontext nach dem Schreiben, da `afterTurn`
  den Sitzungssnapshot erwartet, nicht nur den aktuellen Turn.
- Fallen Sie auf `historyMessages + result.messagesSnapshot` zurück, wenn die Sitzungsdatei
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

Wenn die Spiegelung fehlschlägt, rufen Sie `afterTurn` weiterhin mit dem Fallback-Snapshot auf, protokollieren Sie jedoch,
dass die Context Engine Daten aus Fallback-Turn-Daten aufnimmt.

### 7. Nutzung und Prompt-Cache-Laufzeitkontext normalisieren

Codex-Ergebnisse enthalten normalisierte Nutzungsdaten aus App-Server-Token-Benachrichtigungen, wenn
verfügbar. Übergeben Sie diese Nutzung an den Context-Engine-Laufzeitkontext.

Wenn der Codex-App-Server künftig Cache-Lese-/Schreibdetails offenlegt, ordnen Sie diese
`ContextEnginePromptCacheInfo` zu. Bis dahin lassen Sie `promptCache` weg, statt
Nullwerte zu erfinden.

### 8. Compaction-Richtlinie

Es gibt zwei Compaction-Systeme:

1. OpenClaw Context-Engine-`compact()`
2. native `thread/compact/start` des Codex-App-Servers

Führen Sie diese nicht stillschweigend zusammen.

#### `/compact` und explizite OpenClaw-Compaction

Wenn die ausgewählte Context Engine `info.ownsCompaction === true` hat, sollte die explizite
OpenClaw-Compaction das `compact()`-Ergebnis der Context Engine für
die OpenClaw-Transkriptspiegelung und den Plugin-Zustand bevorzugen.

Wenn der ausgewählte Codex-Harness eine native Thread-Bindung hat, können wir zusätzlich
native Codex-Compaction anfordern, um den App-Server-Thread stabil zu halten, dies
muss jedoch in den Details als separate Backend-Aktion gemeldet werden.

Empfohlenes Verhalten:

- Wenn `contextEngine.info.ownsCompaction === true`:
  - zuerst Context-Engine-`compact()` aufrufen
  - anschließend best-effort native Codex-Compaction aufrufen, wenn eine Thread-Bindung vorhanden ist
  - das Context-Engine-Ergebnis als primäres Ergebnis zurückgeben
  - den Status der nativen Codex-Compaction in `details.codexNativeCompaction` aufnehmen
- Wenn die aktive Context Engine keine Compaction besitzt:
  - aktuelles natives Codex-Compaction-Verhalten beibehalten

Dies erfordert wahrscheinlich eine Änderung von `extensions/codex/src/app-server/compact.ts` oder
ein Wrapping aus dem generischen Compaction-Pfad, abhängig davon, wo
`maybeCompactAgentHarnessSession(...)` aufgerufen wird.

#### Native Codex-`contextCompaction`-Ereignisse während eines Turns

Codex kann während eines Turns `contextCompaction`-Item-Ereignisse ausgeben. Behalten Sie die aktuelle
Emission der Before-/After-Compaction-Hooks in `event-projector.ts` bei, behandeln Sie
dies aber nicht als abgeschlossene Context-Engine-Compaction.

Für Engines, die Compaction besitzen, geben Sie eine explizite Diagnose aus, wenn Codex trotzdem
native Compaction durchführt:

- Stream-/Ereignisname: bestehender `compaction`-Stream ist akzeptabel
- Details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dadurch wird die Trennung prüfbar.

### 9. Sitzungszurücksetzung und Bindungsverhalten

Das bestehende Codex-Harness-`reset(...)` entfernt die Codex-App-Server-Bindung aus
der OpenClaw-Sitzungsdatei. Behalten Sie dieses Verhalten bei.

Stellen Sie außerdem sicher, dass die Bereinigung des Context-Engine-Zustands weiterhin über bestehende
OpenClaw-Sitzungslebenszykluspfade erfolgt. Fügen Sie keine Codex-spezifische Bereinigung hinzu, sofern der
Context-Engine-Lebenszyklus derzeit keine Reset-/Delete-Ereignisse für alle Harnesses verpasst.

### 10. Fehlerbehandlung

Folgen Sie der PI-Semantik:

- Bootstrap-Fehler warnen und fahren fort
- Assemble-Fehler warnen und fallen auf nicht zusammengestellte Pipeline-Nachrichten/-Prompts zurück
- `afterTurn`-/Ingest-Fehler warnen und markieren die Post-Turn-Finalisierung als nicht erfolgreich
- Wartung läuft nur nach erfolgreichen, nicht abgebrochenen Turns ohne Yield-Abbruch
- Compaction-Fehler sollten nicht als neue Prompts erneut versucht werden

Codex-spezifische Ergänzungen:

- Wenn die Kontextprojektion fehlschlägt, warnen und auf den ursprünglichen Prompt zurückfallen.
- Wenn die Transkriptspiegelung fehlschlägt, dennoch Context-Engine-Finalisierung mit
  Fallback-Nachrichten versuchen.
- Wenn native Codex-Compaction fehlschlägt, nachdem Context-Engine-Compaction erfolgreich war,
  nicht die gesamte OpenClaw-Compaction fehlschlagen lassen, wenn die Context Engine primär ist.

## Testplan

### Unit-Tests

Fügen Sie Tests unter `extensions/codex/src/app-server` hinzu:

1. `run-attempt.context-engine.test.ts`
   - Codex ruft `bootstrap` auf, wenn eine Sitzungsdatei existiert.
   - Codex ruft `assemble` mit gespiegelten Nachrichten, Token-Budget, Tool-Namen,
     Zitiermodus, Modell-ID und Prompt auf.
   - `systemPromptAddition` ist in Entwickleranweisungen enthalten.
   - Zusammengestellte Nachrichten werden vor der aktuellen Anfrage in den Prompt projiziert.
   - Codex ruft `afterTurn` nach der Transkriptspiegelung auf.
   - Ohne `afterTurn` ruft Codex `ingestBatch` oder pro Nachricht `ingest` auf.
   - Turn-Wartung läuft nach erfolgreichen Turns.
   - Turn-Wartung läuft nicht bei Prompt-Fehler, Abbruch oder Yield-Abbruch.

2. `context-engine-projection.test.ts`
   - stabile Ausgabe für identische Eingaben
   - kein doppelter aktueller Prompt, wenn die zusammengestellte Historie ihn enthält
   - verarbeitet leere Historie
   - bewahrt die Rollenreihenfolge
   - enthält System-Prompt-Ergänzung nur in Entwickleranweisungen

3. `compact.context-engine.test.ts`
   - primäres Ergebnis der besitzenden Context Engine gewinnt
   - Status der nativen Codex-Compaction erscheint in Details, wenn sie ebenfalls versucht wurde
   - nativer Codex-Fehler lässt die Compaction der besitzenden Context Engine nicht fehlschlagen
   - nicht besitzende Context Engine bewahrt aktuelles natives Compaction-Verhalten

### Zu aktualisierende bestehende Tests

- `extensions/codex/src/app-server/run-attempt.test.ts`, falls vorhanden, andernfalls
  nächste Codex-App-Server-Run-Tests.
- `extensions/codex/src/app-server/event-projector.test.ts` nur, wenn sich
  Compaction-Ereignisdetails ändern.
- `src/agents/harness/selection.test.ts` sollte keine Änderungen benötigen, sofern sich das
  Konfigurationsverhalten nicht ändert; er sollte stabil bleiben.
- PI-Context-Engine-Tests sollten unverändert weiterhin bestehen.

### Integrations-/Live-Tests

Fügen Sie Live-Codex-Harness-Smoke-Tests hinzu oder erweitern Sie sie:

- `plugins.slots.contextEngine` auf eine Test-Engine konfigurieren
- `agents.defaults.model` auf ein `codex/*`-Modell konfigurieren
- `agents.defaults.embeddedHarness.runtime = "codex"` konfigurieren
- sicherstellen, dass die Test-Engine Folgendes beobachtet hat:
  - Bootstrap
  - Assemble
  - `afterTurn` oder Ingest
  - Wartung

Vermeiden Sie, `lossless-claw` in OpenClaw-Core-Tests vorauszusetzen. Verwenden Sie ein kleines im Repo enthaltenes Fake-
Context-Engine-Plugin.

## Beobachtbarkeit

Fügen Sie Debug-Logs um die Codex-Context-Engine-Lebenszyklusaufrufe hinzu:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` mit Grund
- `codex native compaction completed alongside context-engine compaction`

Vermeiden Sie das Protokollieren vollständiger Prompts oder Transkriptinhalte.

Fügen Sie strukturierte Felder hinzu, wo sinnvoll:

- `sessionId`
- `sessionKey` gemäß bestehender Logging-Praxis geschwärzt oder ausgelassen
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / Kompatibilität

Dies sollte abwärtskompatibel sein:

- Wenn keine Context Engine konfiguriert ist, sollte das Legacy-Context-Engine-Verhalten
  dem heutigen Codex-Harness-Verhalten entsprechen.
- Wenn Context-Engine-`assemble` fehlschlägt, sollte Codex mit dem ursprünglichen
  Prompt-Pfad fortfahren.
- Bestehende Codex-Thread-Bindungen sollten gültig bleiben.
- Dynamisches Tool-Fingerprinting sollte keine Context-Engine-Ausgabe enthalten; andernfalls
  könnte jede Kontextänderung einen neuen Codex-Thread erzwingen. Nur der Tool-Katalog
  sollte den dynamischen Tool-Fingerprint beeinflussen.

## Offene Fragen

1. Sollte zusammengestellter Kontext vollständig in den Benutzer-Prompt, vollständig
   in Entwickleranweisungen oder aufgeteilt injiziert werden?

   Empfehlung: aufteilen. `systemPromptAddition` in Entwickleranweisungen setzen;
   zusammengestellten Transkriptkontext in den Benutzer-Prompt-Wrapper setzen. Dies passt am besten
   zum aktuellen Codex-Protokoll, ohne die native Thread-Historie zu verändern.

2. Sollte native Codex-Compaction deaktiviert werden, wenn eine Context Engine
   Compaction besitzt?

   Empfehlung: zunächst nein. Native Codex-Compaction kann weiterhin
   notwendig sein, um den App-Server-Thread am Leben zu halten. Sie muss jedoch als
   native Codex-Compaction gemeldet werden, nicht als Context-Engine-Compaction.

3. Sollte `before_prompt_build` vor oder nach der Context-Engine-Assembly laufen?

   Empfehlung: nach der Context-Engine-Projektion für Codex, sodass generische Harness-
   Hooks den tatsächlichen Prompt und die Entwickleranweisungen sehen, die Codex erhalten wird. Wenn PI-
   Parität das Gegenteil erfordert, kodifizieren Sie die gewählte Reihenfolge in Tests und dokumentieren Sie sie
   hier.

4. Kann der Codex-App-Server künftig einen strukturierten Kontext-/Historien-Override akzeptieren?

   Unbekannt. Wenn dies möglich ist, ersetzen Sie die Textprojektionsschicht durch dieses Protokoll und
   lassen Sie die Lebenszyklusaufrufe unverändert.

## Akzeptanzkriterien

- Ein `codex/*`-Embedded-Harness-Turn ruft den Assemble-Lebenszyklus der ausgewählten Context Engine auf.
- Eine Context-Engine-`systemPromptAddition` beeinflusst Codex-Entwickleranweisungen.
- Zusammengestellter Kontext beeinflusst die Codex-Turn-Eingabe deterministisch.
- Erfolgreiche Codex-Turns rufen `afterTurn` oder den Ingest-Fallback auf.
- Erfolgreiche Codex-Turns führen Context-Engine-Turn-Wartung aus.
- Fehlgeschlagene/abgebrochene/Yield-abgebrochene Turns führen keine Turn-Wartung aus.
- Context-Engine-eigene Compaction bleibt primär für OpenClaw-/Plugin-Zustand.
- Native Codex-Compaction bleibt als natives Codex-Verhalten prüfbar.
- Bestehendes PI-Context-Engine-Verhalten ist unverändert.
- Bestehendes Codex-Harness-Verhalten ist unverändert, wenn keine Nicht-Legacy-Context-Engine
  ausgewählt ist oder wenn Assembly fehlschlägt.
