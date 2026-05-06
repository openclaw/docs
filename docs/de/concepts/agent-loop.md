---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zur Agentenschleife oder zu Lifecycle-Ereignissen
    - Sie ändern die Warteschlangenbildung für Sitzungen, Transkript-Schreibvorgänge oder das Verhalten von Sitzungsschreibsperren.
summary: Lebenszyklus des Agent-Loops, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-05-06T06:42:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein agentischer Loop ist der vollständige „echte“ Lauf eines Agenten: Aufnahme → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine abschließende Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist ein Loop ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell denkt, Tools aufruft und Ausgabe streamt. Dieses Dokument erklärt, wie dieser authentische Loop
Ende-zu-Ende verdrahtet ist.

## Einstiegspunkte

- Gateway RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (allgemein)

1. `agent` RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- und Thinking/Verbose/Trace-Standardwerte auf
   - lädt Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lebenszyklus end/error** aus, falls der eingebettete Loop keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Warteschlangen
   - löst Modell und Authentifizierungsprofil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht den Lauf ab, wenn es überschritten wird
   - bricht bei Codex-app-server-Turns einen akzeptierten Turn ab, der vor einem terminalen Ereignis keinen app-server-Fortschritt mehr erzeugt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lebenszyklusereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus end/error** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Nebenläufigkeit

- Läufe werden pro Sitzungsschlüssel (Sitzungsspur) und optional über eine globale Spur serialisiert.
- Dies verhindert Tool-/Sitzungsrennen und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi (collect/steer/followup) wählen, die dieses Spuren-System speisen.
  Siehe [Befehlswarteschlange](/de/concepts/queue).
- Transkriptschreibvorgänge werden zusätzlich durch eine Sitzungsschreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreibende erfasst, die die In-Process-Warteschlange umgehen oder aus
  einem anderen Prozess kommen. Schreibende von Sitzungstranskripten warten bis zu `session.writeLock.acquireTimeoutMs`,
  bevor die Sitzung als ausgelastet gemeldet wird; der Standardwert ist `60000` ms.
- Sitzungsschreibsperren sind standardmäßig nicht reentrant. Wenn ein Hilfsprogramm die Erfassung derselben Sperre
  absichtlich verschachtelt und dabei einen logischen Schreiber beibehält, muss es dies explizit mit
  `allowReentrant: true` aktivieren.

## Sitzungs- + Workspace-Vorbereitung

- Der Workspace wird aufgelöst und erstellt; Sandbox-Läufe können auf einen Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungsschreibsperre wird erfasst; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad für Transkriptumschreibung, Compaction oder Kürzung muss dieselbe Sperre erfassen, bevor er die Transkriptdatei öffnet oder
  verändert.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und laufbezogenen Overrides erstellt.
- Modellspezifische Limits und reservierte Tokens für Compaction werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt), um zu sehen, was das Modell sieht.

## Hook-Punkte (wo Sie abfangen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokument).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- + Gateway-Lebenszyklus)

Diese laufen innerhalb des Agent-Loops oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und Systemkontextfelder für stabile Anleitung, die im System-Prompt-Bereich liegen sollte.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die obigen expliziten Hooks.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, sodass ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: inspiziert die finale Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: inspiziert integrierte Scan-Funde und kann Skill- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein von OpenClaw verwaltetes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende und ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Gateway-Lebenszyklusereignisse.

Hook-Entscheidungsregeln für Ausgangs-/Tool-Schutzmechanismen:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-Op und hebt eine vorherige Blockierung nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-Op und hebt eine vorherige Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-Op und hebt einen vorherigen Abbruch nicht auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich anpassen. Der Codex-app-server-Harness behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater, niedriger liegender Codex-Mechanismus bleiben.

## Streaming + Teilantworten

- Assistant-Deltas werden von pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Blockantwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Protokollieren/Ausgeben hinsichtlich Größe und Bild-Payloads bereinigt.
- Messaging-Tool-Sends werden verfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell Fehler ausgibt
- Das exakte stille Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads gefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler ausgegeben hat, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (sofern ein Messaging-Tool nicht bereits eine benutzersichtbare Antwort gesendet hat).

## Compaction + Wiederholungen

- Automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignisstreams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas von pi-agent-core
- `tool`: gestreamte Tool-Ereignisse von pi-agent-core

## Chat-Kanal-Behandlung

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus end/error** ausgegeben.

## Timeouts

- `agent.wait`-Standard: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agent-Laufzeit: `agents.defaults.timeoutSeconds` standardmäßig 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.
- Cron-Laufzeit: `timeoutSeconds` für isolierte Agent-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht den zugrunde liegenden Lauf zum konfigurierten Termin ab und führt dann begrenzte Bereinigung aus, bevor der Timeout aufgezeichnet wird, damit eine veraltete untergeordnete Sitzung die Spur nicht blockiert halten kann.
- Sitzungs-Lebendigkeitsdiagnose: Bei aktivierter Diagnose klassifiziert `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen, bei denen kein Antwort-, Tool-, Status-, Block- oder ACP-Fortschritt beobachtet wurde. Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet; aktive Arbeit ohne aktuellen Fortschritt wird als `session.stalled` gemeldet; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert. Veraltete Sitzungsbuchhaltung gibt die betroffene Sitzungsspur sofort frei; hängende eingebettete Läufe werden erst nach `diagnostics.stuckSessionAbortMs` abort-drained (Standard: mindestens 10 Minuten und 5x der Warnschwellenwert), damit wartende Arbeit fortgesetzt werden kann, ohne lediglich langsame Läufe abzuschneiden. Die Wiederherstellung gibt strukturierte angeforderte/abgeschlossene Ergebnisse aus, und der Diagnosezustand wird nur dann als idle markiert, wenn dieselbe processing-Generation noch aktuell ist. Wiederholte `session.stuck`-Diagnosen machen Backoff, solange die Sitzung unverändert bleibt.
- Modell-Idle-Timeout: OpenClaw bricht eine Modellanforderung ab, wenn vor Ablauf des Idle-Fensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` verlängert diesen Idle-Watchdog für langsame lokale/selbstgehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig auf 120 s begrenzt. Von Cron ausgelöste Läufe ohne expliziten Modell- oder Agent-Timeout deaktivieren den Idle-Watchdog und verlassen sich auf den äußeren Cron-Timeout.
- Provider-HTTP-Anforderungstimeout: `models.providers.<id>.timeoutSeconds` gilt für die Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Header, Body, SDK-Anforderungstimeout, gesamter Guarded-Fetch-Abbruchbehandlung und Modellstream-Idle-Watchdog. Verwenden Sie dies für langsame lokale/selbstgehostete Provider wie Ollama, bevor Sie den Timeout für die gesamte Agent-Laufzeit erhöhen.

## Wo Dinge vorzeitig enden können

- Agent-Timeout (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Agent-Lebenszyklusereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungsgates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
