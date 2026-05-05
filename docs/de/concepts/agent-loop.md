---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zur Agent-Schleife oder zu Lifecycle-Ereignissen
    - Sie ändern die Sitzungswarteschlange, Transkript-Schreibvorgänge oder das Verhalten der Sitzungsschreibsperre
summary: Lebenszyklus der Agentenschleife, Streams und Wartesemantik
title: Agent-Schleife
x-i18n:
    generated_at: "2026-05-05T06:16:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein Agenten-Loop ist die vollständige „reale“ Ausführung eines Agenten: Aufnahme → Kontextzusammenstellung → Modell-Inferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine endgültige Antwort umwandelt, während der Sitzungszustand konsistent bleibt.

In OpenClaw ist ein Loop eine einzelne, serialisierte Ausführung pro Sitzung, die Lifecycle- und Stream-Ereignisse ausgibt,
während das Modell denkt, Tools aufruft und Ausgabe streamt. Dieses Dokument erklärt, wie dieser authentische Loop
durchgängig verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (übergeordnet)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Thinking-/Verbose-/Trace-Standardwerte auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Runtime)
   - gibt **Lifecycle-Ende/-Fehler** aus, wenn der eingebettete Loop dies nicht ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Ausführungen über sitzungsbezogene und globale Warteschlangen
   - löst Modell und Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht die Ausführung ab, wenn es überschritten wird
   - bricht für Codex-App-Server-Turns einen akzeptierten Turn ab, der keinen App-Server-Fortschritt mehr erzeugt, bevor ein terminales Ereignis eintritt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lifecycle-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lifecycle-Ende/-Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Nebenläufigkeit

- Ausführungen werden pro Sitzungsschlüssel (Sitzungs-Lane) und optional über eine globale Lane serialisiert.
- Dies verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi auswählen (Sammeln/Steuern/Follow-up), die dieses Lane-System speisen.
  Siehe [Befehlswarteschlange](/de/concepts/queue).
- Transkriptschreibvorgänge werden außerdem durch eine Sitzungsschreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Writer erfasst, die die In-Process-Warteschlange umgehen oder aus einem
  anderen Prozess stammen. Writer von Sitzungstranskripten warten bis zu `session.writeLock.acquireTimeoutMs`,
  bevor die Sitzung als beschäftigt gemeldet wird; der Standardwert ist `60000` ms.
- Sitzungsschreibsperren sind standardmäßig nicht reentrant. Wenn ein Helper die Erfassung derselben Sperre absichtlich verschachtelt
  und dabei einen logischen Writer beibehält, muss er dies ausdrücklich mit
  `allowReentrant: true` aktivieren.

## Sitzungs- und Workspace-Vorbereitung

- Workspace wird aufgelöst und erstellt; Sandbox-Ausführungen können auf ein Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungsschreibsperre wird erfasst; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, zur Compaction oder zum Kürzen des Transkripts muss dieselbe Sperre erfassen, bevor er die
  Transkriptdatei öffnet oder verändert.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und ausführungsspezifischen Overrides erstellt.
- Modellspezifische Limits und für Compaction reservierte Token werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt), um zu sehen, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lifecycle-Ereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Tool-Lifecycle und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agenten- + Gateway-Lifecycle)

Diese laufen innerhalb des Agenten-Loops oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um vor der Prompt-Übermittlung `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und Systemkontext-Felder für stabile Anweisungen, die im System-Prompt-Bereich liegen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, sodass ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: prüft die endgültige Nachrichtenliste und Ausführungsmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft integrierte Scan-Ergebnisse und blockiert optional Skill- oder Plugin-Installationen.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: eingehende und ausgehende Nachrichten-Hooks.
- **`session_start` / `session_end`**: Grenzen des Sitzungs-Lifecycle.
- **`gateway_start` / `gateway_stop`**: Gateway-Lifecycle-Ereignisse.

Entscheidungsregeln für ausgehende Nachrichten-/Tool-Schutzmechanismen:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein vorheriges Cancel nicht auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater, niedriger angesetzter Codex-Mechanismus bleiben.

## Streaming + Teilantworten

- Assistant-Deltas werden aus pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking und Blockantwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor Logging/Ausgabe hinsichtlich Größe und Bild-Payloads bereinigt.
- Sends von Messaging-Tools werden verfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Endgültige Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell Fehler ausgibt
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads gefiltert.
- Duplikate von Messaging-Tools werden aus der endgültigen Payload-Liste entfernt.
- Wenn keine darstellbaren Payloads verbleiben und ein Tool einen Fehler verursacht hat, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann einen erneuten Versuch auslösen.
- Beim erneuten Versuch werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Chat-Kanal-Verarbeitung

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lifecycle-Ende/-Fehler** ausgegeben.

## Timeouts

- `agent.wait`-Standardwert: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agenten-Runtime: `agents.defaults.timeoutSeconds` Standardwert 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.
- Cron-Runtime: `timeoutSeconds` für isolierte Agenten-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht die zugrunde liegende Ausführung zum konfigurierten Termin ab und führt dann begrenztes Cleanup aus, bevor der Timeout aufgezeichnet wird, sodass eine veraltete Child-Sitzung die Lane nicht blockiert halten kann.
- Sitzungs-Liveness-Diagnosen: Bei aktivierten Diagnosen klassifiziert `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen, bei denen kein beobachteter Antwort-, Tool-, Status-, Block- oder ACP-Fortschritt vorliegt. Aktive eingebettete Ausführungen, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet; aktive Arbeit ohne aktuellen Fortschritt wird als `session.stalled` gemeldet; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert. Veraltete Sitzungsbuchhaltung gibt die betroffene Sitzungs-Lane sofort frei; festgefahrene eingebettete Ausführungen werden erst nach `diagnostics.stuckSessionAbortMs` (Standard: mindestens 10 Minuten und das 5-Fache des Warnschwellenwerts) per Abort entleert, sodass wartende Arbeit fortgesetzt werden kann, ohne lediglich langsame Ausführungen abzuschneiden. Recovery gibt strukturierte angeforderte/abgeschlossene Ergebnisse aus, und der Diagnosezustand wird nur dann als inaktiv markiert, wenn dieselbe Processing-Generation weiterhin aktuell ist. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung unverändert bleibt.
- Modell-Leerlauf-Timeout: OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauffensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Leerlauf-Watchdog für langsame lokale/selbst gehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig auf 120 s begrenzt. Von Cron ausgelöste Ausführungen ohne expliziten Modell- oder Agenten-Timeout deaktivieren den Leerlauf-Watchdog und verlassen sich auf den äußeren Cron-Timeout.
- Provider-HTTP-Anfrage-Timeout: `models.providers.<id>.timeoutSeconds` gilt für die Modell-HTTP-Fetches dieses Providers, einschließlich Connect, Header, Body, SDK-Anfrage-Timeout, gesamter abgesicherter Fetch-Abbruchbehandlung und Modell-Stream-Leerlauf-Watchdog. Verwenden Sie dies für langsame lokale/selbst gehostete Provider wie Ollama, bevor Sie den gesamten Agenten-Runtime-Timeout erhöhen.

## Wo Dinge früh enden können

- Agenten-Timeout (Abort)
- AbortSignal (Cancel)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandte Themen

- [Tools](/de/tools) — verfügbare Agenten-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Agenten-Lifecycle-Ereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec Approvals](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
