---
read_when:
    - Sie verdrahten das Lifecycle-Verhalten der Context-Engine mit dem Codex-Harness
    - Sie benötigen lossless-claw oder ein anderes Kontext-Engine-Plugin, um mit eingebetteten codex/*-Harness-Sitzungen zu arbeiten
    - Sie vergleichen das Kontextverhalten des eingebetteten OpenClaw- und Codex-App-Servers
summary: Spezifikation, damit der gebündelte Codex-App-Server-Harness OpenClaw-Kontext-Engine-Plugins berücksichtigt
title: Codex-Harness-Kontext-Engine-Port
x-i18n:
    generated_at: "2026-06-27T17:41:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Entwurf der Implementierungsspezifikation.

## Ziel

Der gebündelte Codex-App-Server-Harness soll denselben OpenClaw-Context-Engine-
Lifecycle-Vertrag einhalten, den eingebettete OpenClaw-Turns bereits einhalten.

Eine Sitzung mit Provider/Modell `agentRuntime.id: "codex"` oder einem `codex/*`-Modell
soll dem ausgewählten Context-Engine-Plugin, wie etwa
`lossless-claw`, weiterhin ermöglichen, Context-Assembly, Post-Turn-Ingest, Wartung und
OpenClaw-weite Compaction-Richtlinien zu steuern, soweit die Codex-App-Server-Grenze dies zulässt.

## Nicht-Ziele

- Codex-App-Server-Interna nicht neu implementieren.
- Die native Codex-Thread-Compaction nicht dazu bringen, eine lossless-claw-Zusammenfassung zu erzeugen.
- Nicht verlangen, dass Nicht-Codex-Modelle den Codex-Harness verwenden.
- Das Verhalten von ACP/acpx-Sitzungen nicht ändern. Diese Spezifikation gilt nur für den
  Nicht-ACP-Pfad des eingebetteten Agent-Harness.
- Drittanbieter-Plugins nicht dazu bringen, Codex-App-Server-Erweiterungs-Factorys zu registrieren;
  die bestehende Vertrauensgrenze für gebündelte Plugins bleibt unverändert.

## Aktuelle Architektur

Die eingebettete Run-Loop löst die konfigurierte Context Engine einmal pro Run auf, bevor
ein konkreter Low-Level-Harness ausgewählt wird:

- `src/agents/embedded-agent-runner/run.ts`
  - initialisiert Context-Engine-Plugins
  - ruft `resolveContextEngine(params.config)` auf
  - übergibt `contextEngine` und `contextTokenBudget` an
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegiert an den ausgewählten Agent-Harness:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Der Codex-App-Server-Harness wird vom gebündelten Codex-Plugin registriert:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

Die Codex-Harness-Implementierung erhält dieselben `EmbeddedRunAttemptParams`
wie eingebaute OpenClaw-Attempts:

- `extensions/codex/src/app-server/run-attempt.ts`

Das bedeutet, der erforderliche Hook-Punkt liegt in von OpenClaw kontrolliertem Code. Die externe
Grenze ist das Codex-App-Server-Protokoll selbst: OpenClaw kann steuern, was es
an `thread/start`, `thread/resume` und `turn/start` sendet, und kann
Benachrichtigungen beobachten, aber es kann Codex' internen Thread-Speicher oder nativen
Compactor nicht ändern.

## Aktuelle Lücke

Eingebaute OpenClaw-Attempts rufen den Context-Engine-Lifecycle direkt auf:

- Bootstrap/Wartung vor dem Attempt
- Assembly vor dem Modellaufruf
- afterTurn oder Ingest nach dem Attempt
- Wartung nach einem erfolgreichen Turn
- Context-Engine-Compaction für Engines, die Compaction besitzen

Relevanter OpenClaw-Code:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex-App-Server-Attempts führen derzeit generische Agent-Harness-Hooks aus und spiegeln
das Transkript, rufen aber nicht `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` oder
`params.contextEngine.maintain` auf.

Relevanter Codex-Code:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Gewünschtes Verhalten

Für Codex-Harness-Turns soll OpenClaw diesen Lifecycle beibehalten:

1. Das gespiegelte OpenClaw-Sitzungstranskript lesen.
2. Die aktive Context Engine bootstrappen, wenn eine vorherige Sitzungsdatei existiert.
3. Bootstrap-Wartung ausführen, wenn verfügbar.
4. Kontext mit der aktiven Context Engine assemblieren.
5. Den assemblierten Kontext in Codex-kompatible Eingaben umwandeln.
6. Den Codex-Thread mit Developer-Anweisungen starten oder fortsetzen, die jede
   Context-Engine-`systemPromptAddition` enthalten.
7. Den Codex-Turn mit dem assemblierten benutzerseitigen Prompt starten.
8. Das Codex-Ergebnis zurück in das OpenClaw-Transkript spiegeln.
9. `afterTurn` aufrufen, falls implementiert, andernfalls `ingestBatch`/`ingest`, unter Verwendung des
   gespiegelten Transkript-Snapshots.
10. Turn-Wartung nach erfolgreichen, nicht abgebrochenen Turns ausführen.
11. Native Codex-Compaction-Signale und OpenClaw-Compaction-Hooks beibehalten.

## Design-Einschränkungen

### Codex-App-Server bleibt kanonisch für nativen Thread-Zustand

Codex besitzt seinen nativen Thread und jede interne erweiterte Historie. OpenClaw soll
nicht versuchen, die interne Historie des App-Servers zu verändern, außer über unterstützte
Protokollaufrufe.

OpenClaws Transkriptspiegel bleibt die Quelle für OpenClaw-Funktionen:

- Chatverlauf
- Suche
- Buchhaltung für `/new` und `/reset`
- zukünftiger Modell- oder Harness-Wechsel
- Zustand des Context-Engine-Plugins

### Context-Engine-Assembly muss in Codex-Eingaben projiziert werden

Die Context-Engine-Schnittstelle gibt OpenClaw-`AgentMessage[]` zurück, keinen Codex-
Thread-Patch. Codex-App-Server-`turn/start` akzeptiert eine aktuelle Benutzereingabe, während
`thread/start` und `thread/resume` Developer-Anweisungen akzeptieren.

Daher benötigt die Implementierung eine Projektionsschicht. Die sichere erste Version
sollte nicht so tun, als könne sie die interne Codex-Historie ersetzen. Sie sollte
assemblierten Kontext als deterministisches Prompt-/Developer-Anweisungsmaterial um
den aktuellen Turn herum injizieren.

### Prompt-Cache-Stabilität ist wichtig

Für Engines wie lossless-claw sollte der assemblierte Kontext bei unveränderten Eingaben deterministisch
sein. Fügen Sie generiertem Kontexttext keine Zeitstempel, zufälligen IDs oder nichtdeterministische
Sortierung hinzu.

### Runtime-Auswahlsemantik ändert sich nicht

Die Harness-Auswahl bleibt wie bisher:

- `runtime: "openclaw"` wählt den eingebauten OpenClaw-Harness aus
- `runtime: "codex"` wählt den registrierten Codex-Harness aus
- `runtime: "auto"` lässt Plugin-Harnesses unterstützte Provider beanspruchen
- nicht passende `auto`-Runs verwenden den eingebauten OpenClaw-Harness

Diese Arbeit ändert, was passiert, nachdem der Codex-Harness ausgewählt wurde.

## Implementierungsplan

### 1. Wiederverwendbare Context-Engine-Attempt-Helfer exportieren oder verlagern

Heute liegen die wiederverwendbaren Lifecycle-Helfer unter dem eingebetteten Agent-Runner:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex sollte Harness-neutrale Helfer importieren, statt in Implementierungsdetails des Runners
zu greifen.

Erstellen Sie ein Harness-neutrales Modul, zum Beispiel:

- `src/agents/harness/context-engine-lifecycle.ts`

Verschieben oder re-exportieren Sie:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- einen kleinen Wrapper um `runContextEngineMaintenance`

Aktualisieren Sie im selben PR die Aufrufstellen des eingebauten Harness.

Die neutralen Helfernamen sollten den eingebauten Harness nicht erwähnen.

Vorgeschlagene Namen:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Einen Codex-Kontext-Projektionshelfer hinzufügen

Fügen Sie ein neues Modul hinzu:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Verantwortlichkeiten:

- Die assemblierten `AgentMessage[]`, die ursprüngliche gespiegelte Historie und den aktuellen
  Prompt entgegennehmen.
- Bestimmen, welcher Kontext in Developer-Anweisungen und welcher in die aktuelle Benutzereingabe gehört.
- Den aktuellen Benutzer-Prompt als letzte ausführbare Anfrage beibehalten.
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

- `systemPromptAddition` in Developer-Anweisungen einfügen.
- Den assemblierten Transkriptkontext vor dem aktuellen Prompt in `promptText` einfügen.
- Ihn klar als von OpenClaw assemblierten Kontext kennzeichnen.
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

Das ist weniger elegant als native Codex-Historienchirurgie, ist aber innerhalb von OpenClaw
implementierbar und bewahrt Context-Engine-Semantik.

Zukünftige Verbesserung: Wenn Codex-App-Server ein Protokoll zum Ersetzen oder
Ergänzen der Thread-Historie bereitstellt, stellen Sie diese Projektionsschicht auf diese API um.

### 3. Bootstrap vor Codex-Thread-Start verdrahten

In `extensions/codex/src/app-server/run-attempt.ts`:

- Gespiegelte Sitzungshistorie wie bisher lesen.
- Bestimmen, ob die Sitzungsdatei vor diesem Run existierte. Bevorzugen Sie einen Helfer,
  der `fs.stat(params.sessionFile)` vor Spiegel-Schreibvorgängen prüft.
- Einen `SessionManager` öffnen oder einen schmalen Session-Manager-Adapter verwenden, wenn der Helfer
  dies erfordert.
- Den neutralen Bootstrap-Helfer aufrufen, wenn `params.contextEngine` existiert.

Pseudo-Flow:

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

Verwenden Sie dieselbe `sessionKey`-Konvention wie die Codex-Tool-Bridge und der Transkriptspiegel.
Heute berechnet Codex `sandboxSessionKey` aus `params.sessionKey` oder
`params.sessionId`; verwenden Sie dies konsistent, sofern es keinen Grund gibt, den rohen
`params.sessionKey` beizubehalten.

### 4. Assembly vor `thread/start` / `thread/resume` und `turn/start` verdrahten

In `runCodexAppServerAttempt`:

1. Zuerst dynamische Tools bauen, damit die Context Engine die tatsächlich verfügbaren
   Tool-Namen sieht.
2. Gespiegelte Sitzungshistorie lesen.
3. Context-Engine-`assemble(...)` ausführen, wenn `params.contextEngine` existiert.
4. Das assemblierte Ergebnis projizieren in:
   - Ergänzung der Developer-Anweisungen
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

1. Basis-Developer-Anweisungen mit `buildDeveloperInstructions(params)` berechnen
2. Context-Engine-Assembly/Projektion anwenden
3. `before_prompt_build` mit dem projizierten Prompt/den projizierten Developer-Anweisungen ausführen

Diese Reihenfolge lässt generische Prompt-Hooks denselben Prompt sehen, den Codex erhält. Wenn
strikte OpenClaw-Parität nötig ist, führen Sie Context-Engine-Assembly vor der Hook-
Komposition aus, weil der eingebaute Harness die Context-Engine-
`systemPromptAddition` nach seiner Prompt-Pipeline auf den finalen System-Prompt anwendet. Die
wichtige Invariante ist, dass sowohl Context Engine als auch Hooks eine deterministische,
dokumentierte Reihenfolge erhalten.

Empfohlene Reihenfolge für die erste Implementierung:

1. `buildDeveloperInstructions(params)`
2. Context-Engine-`assemble()`
3. `systemPromptAddition` an Developer-Anweisungen anhängen/voranstellen
4. Assemblierte Nachrichten in Prompt-Text projizieren
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. Finale Developer-Anweisungen an `startOrResumeThread(...)` übergeben
7. Finalen Prompt-Text an `buildTurnStartParams(...)` übergeben

Die Spezifikation sollte in Tests codiert werden, damit zukünftige Änderungen sie nicht versehentlich
umordnen.

### 5. Prompt-Cache-stabile Formatierung beibehalten

Der Projektionshelfer muss für identische Eingaben byte-stabile Ausgabe erzeugen:

- stabile Nachrichtenreihenfolge
- stabile Rollenlabels
- keine generierten Zeitstempel
- kein Durchsickern der Objekt-Schlüsselreihenfolge
- keine zufälligen Trennzeichen
- keine IDs pro Run

Verwenden Sie feste Trennzeichen und explizite Abschnitte.

### 6. Post-Turn nach Transkriptspiegelung verdrahten

Codex’ `CodexAppServerEventProjector` erstellt ein lokales `messagesSnapshot` für den
aktuellen Turn. `mirrorTranscriptBestEffort(...)` schreibt diesen Snapshot in den
OpenClaw-Transkriptspiegel.

Nachdem die Spiegelung erfolgreich war oder fehlgeschlagen ist, rufen Sie den Finalizer der Kontext-Engine mit dem
besten verfügbaren Nachrichten-Snapshot auf:

- Bevorzugen Sie nach dem Schreibvorgang den vollständig gespiegelten Sitzungskontext, weil `afterTurn`
  den Sitzungs-Snapshot erwartet, nicht nur den aktuellen Turn.
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

Wenn die Spiegelung fehlschlägt, rufen Sie `afterTurn` trotzdem mit dem Fallback-Snapshot auf, protokollieren Sie aber,
dass die Kontext-Engine Turn-Daten aus dem Fallback übernimmt.

### 7. Usage- und Prompt-Cache-Laufzeitkontext normalisieren

Codex-Ergebnisse enthalten normalisierte Usage aus App-Server-Tokenbenachrichtigungen, sofern
verfügbar. Übergeben Sie diese Usage an den Laufzeitkontext der Kontext-Engine.

Falls der Codex-App-Server künftig Cache-Lese-/Schreibdetails bereitstellt, ordnen Sie diese
`ContextEnginePromptCacheInfo` zu. Bis dahin lassen Sie `promptCache` weg, statt
Nullwerte zu erfinden.

### 8. Compaction-Richtlinie

Es gibt zwei Compaction-Systeme:

1. OpenClaw-Kontext-Engine `compact()`
2. Native Codex-App-Server-Compaction `thread/compact/start`

Vermischen Sie diese nicht stillschweigend.

#### `/compact` und explizite OpenClaw-Compaction

Wenn die ausgewählte Kontext-Engine `info.ownsCompaction === true` hat, sollte die explizite
OpenClaw-Compaction das Ergebnis von `compact()` der Kontext-Engine für den
OpenClaw-Transkriptspiegel und den Plugin-Zustand bevorzugen.

Wenn der ausgewählte Codex-Harness eine native Thread-Bindung hat, können wir zusätzlich
native Codex-Compaction anfordern, um den App-Server-Thread stabil zu halten, aber dies
muss in den Details als separate Backend-Aktion gemeldet werden.

Empfohlenes Verhalten:

- Wenn `contextEngine.info.ownsCompaction === true`:
  - zuerst `compact()` der Kontext-Engine aufrufen
  - danach Best-Effort-Aufruf der nativen Codex-Compaction, wenn eine Thread-Bindung vorhanden ist
  - das Ergebnis der Kontext-Engine als primäres Ergebnis zurückgeben
  - den Status der nativen Codex-Compaction in `details.codexNativeCompaction` aufnehmen
- Wenn die aktive Kontext-Engine Compaction nicht besitzt:
  - das aktuelle Verhalten der nativen Codex-Compaction beibehalten

Dies erfordert wahrscheinlich eine Änderung an `extensions/codex/src/app-server/compact.ts` oder
einen Wrapper aus dem generischen Compaction-Pfad, je nachdem, wo
`maybeCompactAgentHarnessSession(...)` aufgerufen wird.

#### Native Codex-`contextCompaction`-Ereignisse während eines Turns

Codex kann während eines Turns `contextCompaction`-Item-Ereignisse ausgeben. Behalten Sie die aktuelle
Ausgabe der Before-/After-Compaction-Hooks in `event-projector.ts` bei, behandeln Sie
dies aber nicht als abgeschlossene Kontext-Engine-Compaction.

Für Engines, die Compaction besitzen, geben Sie eine explizite Diagnose aus, wenn Codex trotzdem
native Compaction ausführt:

- Stream-/Ereignisname: der vorhandene `compaction`-Stream ist akzeptabel
- Details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dadurch wird die Trennung prüfbar.

### 9. Sitzungsreset und Bindungsverhalten

Der vorhandene Codex-Harness `reset(...)` entfernt die Codex-App-Server-Bindung aus
der OpenClaw-Sitzungsdatei. Behalten Sie dieses Verhalten bei.

Stellen Sie außerdem sicher, dass die Bereinigung des Kontext-Engine-Zustands weiterhin über die vorhandenen
OpenClaw-Sitzungslebenszykluspfade erfolgt. Fügen Sie keine Codex-spezifische Bereinigung hinzu, es sei denn, der
Kontext-Engine-Lebenszyklus verpasst derzeit Reset-/Löschereignisse für alle Harnesses.

### 10. Fehlerbehandlung

Befolgen Sie die integrierten OpenClaw-Semantiken:

- Bootstrap-Fehler warnen und fahren fort
- Assemble-Fehler warnen und fallen auf nicht assemblierte Pipeline-Nachrichten/-Prompts zurück
- `afterTurn`-/Ingest-Fehler warnen und markieren die Post-Turn-Finalisierung als erfolglos
- Wartung läuft nur nach erfolgreichen, nicht abgebrochenen Turns ohne Yield-Abbruch
- Compaction-Fehler sollten nicht als neue Prompts erneut versucht werden

Codex-spezifische Ergänzungen:

- Wenn die Kontextprojektion fehlschlägt, warnen und auf den ursprünglichen Prompt zurückfallen.
- Wenn der Transkriptspiegel fehlschlägt, trotzdem die Finalisierung der Kontext-Engine mit
  Fallback-Nachrichten versuchen.
- Wenn native Codex-Compaction fehlschlägt, nachdem die Kontext-Engine-Compaction erfolgreich war,
  nicht die gesamte OpenClaw-Compaction fehlschlagen lassen, wenn die Kontext-Engine primär ist.

## Testplan

### Unit-Tests

Fügen Sie Tests unter `extensions/codex/src/app-server` hinzu:

1. `run-attempt.context-engine.test.ts`
   - Codex ruft `bootstrap` auf, wenn eine Sitzungsdatei vorhanden ist.
   - Codex ruft `assemble` mit gespiegelten Nachrichten, Token-Budget, Tool-Namen,
     Zitationsmodus, Modell-ID und Prompt auf.
   - `systemPromptAddition` wird in Entwickleranweisungen aufgenommen.
   - Assemblierte Nachrichten werden vor der aktuellen Anfrage in den Prompt projiziert.
   - Codex ruft `afterTurn` nach der Transkriptspiegelung auf.
   - Ohne `afterTurn` ruft Codex `ingestBatch` oder `ingest` pro Nachricht auf.
   - Turn-Wartung läuft nach erfolgreichen Turns.
   - Turn-Wartung läuft nicht bei Prompt-Fehler, Abbruch oder Yield-Abbruch.

2. `context-engine-projection.test.ts`
   - stabile Ausgabe für identische Eingaben
   - kein doppelter aktueller Prompt, wenn die assemblierte Historie ihn enthält
   - verarbeitet leere Historie
   - erhält Rollenreihenfolge
   - enthält System-Prompt-Ergänzung nur in Entwickleranweisungen

3. `compact.context-engine.test.ts`
   - primäres Ergebnis der besitzenden Kontext-Engine gewinnt
   - Status der nativen Codex-Compaction erscheint in den Details, wenn sie ebenfalls versucht wurde
   - nativer Codex-Fehler lässt die Compaction der besitzenden Kontext-Engine nicht fehlschlagen
   - nicht besitzende Kontext-Engine behält aktuelles Verhalten der nativen Compaction bei

### Zu aktualisierende vorhandene Tests

- `extensions/codex/src/app-server/run-attempt.test.ts`, falls vorhanden, andernfalls
  die nächstgelegenen Codex-App-Server-Run-Tests.
- `extensions/codex/src/app-server/event-projector.test.ts` nur, wenn sich Compaction-
  Ereignisdetails ändern.
- `src/agents/harness/selection.test.ts` sollte keine Änderungen benötigen, es sei denn, sich
  das Konfigurationsverhalten ändert; er sollte stabil bleiben.
- Integrierte Harness-Kontext-Engine-Tests sollten unverändert weiter bestehen.

### Integrations-/Live-Tests

Fügen Sie Live-Smoke-Tests für den Codex-Harness hinzu oder erweitern Sie sie:

- `plugins.slots.contextEngine` auf eine Test-Engine konfigurieren
- `agents.defaults.model` auf ein `codex/*`-Modell konfigurieren
- Provider/Modell `agentRuntime.id = "codex"` konfigurieren
- bestätigen, dass die Test-Engine Folgendes beobachtet hat:
  - Bootstrap
  - Assemble
  - `afterTurn` oder Ingest
  - Wartung

Vermeiden Sie es, lossless-claw in OpenClaw-Kerntests vorauszusetzen. Verwenden Sie ein kleines Fake-
Kontext-Engine-Plugin im Repo.

## Beobachtbarkeit

Fügen Sie Debug-Logs rund um Codex-Kontext-Engine-Lebenszyklusaufrufe hinzu:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` mit Grund
- `codex native compaction completed alongside context-engine compaction`

Vermeiden Sie das Loggen vollständiger Prompts oder Transkriptinhalte.

Fügen Sie strukturierte Felder hinzu, wo sinnvoll:

- `sessionId`
- `sessionKey`, gemäß vorhandener Logging-Praxis redigiert oder weggelassen
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migration / Kompatibilität

Dies sollte rückwärtskompatibel sein:

- Wenn keine Kontext-Engine konfiguriert ist, sollte das Legacy-Kontext-Engine-Verhalten dem heutigen
  Verhalten des Codex-Harness entsprechen.
- Wenn `assemble` der Kontext-Engine fehlschlägt, sollte Codex mit dem ursprünglichen
  Prompt-Pfad fortfahren.
- Vorhandene Codex-Thread-Bindungen sollten gültig bleiben.
- Dynamisches Tool-Fingerprinting sollte die Kontext-Engine-Ausgabe nicht einschließen; andernfalls
  könnte jede Kontextänderung einen neuen Codex-Thread erzwingen. Nur der Tool-Katalog
  sollte das dynamische Tool-Fingerprint beeinflussen.

## Offene Fragen

1. Sollte assemblierter Kontext vollständig in den Benutzer-Prompt, vollständig
   in Entwickleranweisungen oder aufgeteilt injiziert werden?

   Empfehlung: aufteilen. `systemPromptAddition` in Entwickleranweisungen platzieren;
   assemblierten Transkriptkontext in den Benutzer-Prompt-Wrapper platzieren. Dies passt am besten zum
   aktuellen Codex-Protokoll, ohne die native Thread-Historie zu verändern.

2. Sollte native Codex-Compaction deaktiviert werden, wenn eine Kontext-Engine
   Compaction besitzt?

   Empfehlung: nein, anfangs nicht. Native Codex-Compaction kann weiterhin
   notwendig sein, um den App-Server-Thread am Leben zu halten. Sie muss aber als
   native Codex-Compaction gemeldet werden, nicht als Kontext-Engine-Compaction.

3. Sollte `before_prompt_build` vor oder nach der Kontext-Engine-Assemblierung laufen?

   Empfehlung: nach der Kontext-Engine-Projektion für Codex, sodass generische Harness-
   Hooks den tatsächlichen Prompt/die tatsächlichen Entwickleranweisungen sehen, die Codex erhalten wird. Wenn
   Parität mit integrierten Harnesses die umgekehrte Reihenfolge erfordert, kodieren Sie die gewählte Reihenfolge in
   Tests und dokumentieren Sie sie hier.

4. Kann der Codex-App-Server künftig einen strukturierten Kontext-/Historien-Override akzeptieren?

   Unbekannt. Falls ja, ersetzen Sie die Textprojektionsschicht durch dieses Protokoll und
   lassen Sie die Lebenszyklusaufrufe unverändert.

## Akzeptanzkriterien

- Ein eingebetteter `codex/*`-Harness-Turn ruft den Assemble-Lebenszyklus der ausgewählten Kontext-Engine auf.
- Ein Kontext-Engine-`systemPromptAddition` beeinflusst Codex-Entwickleranweisungen.
- Assemblierter Kontext beeinflusst die Codex-Turn-Eingabe deterministisch.
- Erfolgreiche Codex-Turns rufen `afterTurn` oder den Ingest-Fallback auf.
- Erfolgreiche Codex-Turns führen die Kontext-Engine-Turn-Wartung aus.
- Fehlgeschlagene/abgebrochene/Yield-abgebrochene Turns führen keine Turn-Wartung aus.
- Kontext-Engine-eigene Compaction bleibt primär für OpenClaw-/Plugin-Zustand.
- Native Codex-Compaction bleibt als natives Codex-Verhalten prüfbar.
- Vorhandenes integriertes Harness-Kontext-Engine-Verhalten bleibt unverändert.
- Vorhandenes Codex-Harness-Verhalten bleibt unverändert, wenn keine Nicht-Legacy-Kontext-Engine
  ausgewählt ist oder wenn die Assemblierung fehlschlägt.
