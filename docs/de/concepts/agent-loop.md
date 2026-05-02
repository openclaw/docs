---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zur Agentenschleife oder zu Lebenszyklusereignissen
    - Sie ändern die Warteschlangenverwaltung von Sitzungen, Transkript-Schreibvorgänge oder das Verhalten der Schreibsperre für Sitzungen.
summary: Lebenszyklus der Agent-Schleife, Datenströme und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-05-02T06:31:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein agentischer Loop ist der vollständige „echte“ Lauf eines Agenten: Eingang → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine finale Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist ein Loop ein einzelner, serialisierter Lauf pro Sitzung, der Lifecycle- und Stream-Events ausgibt,
während das Modell denkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie dieser authentische Loop
Ende zu Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (High-Level)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Thinking-/Verbose-/Trace-Standardwerte auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lifecycle end/error** aus, wenn der eingebettete Loop keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Queues
   - löst Modell und Authentifizierungsprofil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Events und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht den Lauf ab, wenn es überschritten wird
   - bricht bei Codex-App-Server-Turns einen akzeptierten Turn ab, der vor einem terminalen Event keinen App-Server-Fortschritt mehr erzeugt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Events zum OpenClaw-`agent`-Stream:
   - Tool-Events => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lifecycle-Events => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lifecycle end/error** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing + Parallelität

- Läufe werden pro Sitzungsschlüssel (Session Lane) serialisiert und optional zusätzlich über eine globale Lane geführt.
- Das verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Queue-Modi (collect/steer/followup) wählen, die in dieses Lane-System einspeisen.
  Siehe [Command Queue](/de/concepts/queue).
- Transkript-Schreibvorgänge werden zusätzlich durch eine Sitzungs-Schreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreiber erfasst, die die In-Process-Queue umgehen oder aus
  einem anderen Prozess stammen.
- Sitzungs-Schreibsperren sind standardmäßig nicht reentrant. Wenn ein Helper absichtlich den Erwerb
  derselben Sperre verschachtelt und dabei einen logischen Schreiber beibehält, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Sitzungs- und Workspace-Vorbereitung

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können auf eine Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungs-Schreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad für Transkript-Neuschreiben, Compaction oder Kürzung muss dieselbe Sperre erwerben, bevor die Transkriptdatei geöffnet oder
  verändert wird.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und laufbezogenen Overrides erstellt.
- Modellspezifische Limits und reservierte Token für Compaction werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt), um zu erfahren, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): eventgesteuerte Skripte für Befehle und Lifecycle-Events.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lifecycle und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen der Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehls-Events (siehe Hooks-Dokument).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- und Gateway-Lifecycle)

Diese laufen innerhalb des Agent-Loops oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und System-Kontextfelder für stabile Leitlinien, die im System-Prompt-Bereich stehen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in einer der beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, sodass ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: inspiziert die finale Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: inspiziert integrierte Scan-Ergebnisse und kann Skills- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: eingehende und ausgehende Nachrichten-Hooks.
- **`session_start` / `session_end`**: Sitzungs-Lifecycle-Grenzen.
- **`gateway_start` / `gateway_stop`**: Gateway-Lifecycle-Events.

Hook-Entscheidungsregeln für ausgehende/Tool-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein vorheriges Cancel nicht auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater, niedrigerstufiger Codex-Mechanismus bleiben.

## Streaming + partielle Antworten

- Assistant-Deltas werden von pi-agent-core gestreamt und als `assistant`-Events ausgegeben.
- Block-Streaming kann partielle Antworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Block-Antwort-Verhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Events werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor Logging/Ausgabe hinsichtlich Größe und Bild-Payloads bereinigt.
- Sends von Messaging-Tools werden nachverfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell einen Fehler ausgibt
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler ausgegeben hat, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Events aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Event-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas von pi-agent-core
- `tool`: gestreamte Tool-Events von pi-agent-core

## Chat-Kanal-Verarbeitung

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lifecycle end/error** ausgegeben.

## Timeouts

- `agent.wait`-Standardwert: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agent-Laufzeit: `agents.defaults.timeoutSeconds` Standardwert 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.
- Cron-Laufzeit: Das `timeoutSeconds` eines isolierten Agent-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht den zugrunde liegenden Lauf zur konfigurierten Deadline ab und führt dann begrenztes Cleanup aus, bevor der Timeout aufgezeichnet wird, damit eine veraltete Child-Sitzung die Lane nicht blockiert halten kann.
- Sitzungs-Liveness-Diagnosen: Bei aktivierten Diagnosen klassifiziert `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen, für die kein beobachteter Antwort-, Tool-, Status-, Block- oder ACP-Fortschritt vorliegt. Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet; aktive Arbeit ohne aktuellen Fortschritt wird als `session.stalled` gemeldet; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert, und nur dieser Pfad gibt die betroffene Session Lane frei, damit eingereihte Startarbeit abfließen kann. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung unverändert bleibt.
- Modell-Idle-Timeout: OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Idle-Fensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Idle-Watchdog für langsame lokale/selbstgehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig auf 120 s begrenzt. Von Cron ausgelöste Läufe ohne explizites Modell- oder Agent-Timeout deaktivieren den Idle-Watchdog und verlassen sich auf den äußeren Cron-Timeout.
- Provider-HTTP-Request-Timeout: `models.providers.<id>.timeoutSeconds` gilt für die Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Header, Body, SDK-Request-Timeout, gesamter guarded-fetch-Abbruchbehandlung und Modell-Stream-Idle-Watchdog. Verwenden Sie dies für langsame lokale/selbstgehostete Provider wie Ollama, bevor Sie den gesamten Agent-Laufzeit-Timeout erhöhen.

## Wo Dinge früh enden können

- Agent-Timeout (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — eventgesteuerte Skripte, die durch Agent-Lifecycle-Events ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec Approvals](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
