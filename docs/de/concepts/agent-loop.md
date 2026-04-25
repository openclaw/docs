---
read_when:
    - Du benötigst eine genaue Schritt-für-Schritt-Erklärung der Agent-Schleife oder der Lebenszyklusereignisse.
    - Du änderst das Session-Queueing, das Schreiben von Transkripten oder das Schreib-Lock-Verhalten von Sitzungen.
summary: Lebenszyklus der Agent-Schleife, Streams und Warte-Semantik
title: Agent-Schleife
x-i18n:
    generated_at: "2026-04-25T13:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: de41180af291cf804f2e74106c70eb8582b63e7066738ba3059c1319510f1b44
    source_path: concepts/agent-loop.md
    workflow: 15
---

Eine agentische Schleife ist der vollständige „echte“ Lauf eines Agenten: Intake → Kontextaufbau → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Sie ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine endgültige Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist eine Schleife ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell denkt, Tools aufruft und Ausgabe streamt. Dieses Dokument erklärt, wie diese authentische Schleife
Ende-zu-Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (High-Level)

1. Die RPC `agent` validiert Parameter, löst die Sitzung auf (`sessionKey`/`sessionId`), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Thinking-/Verbose-/Trace-Standards auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Runtime)
   - gibt **Lebenszyklus-Ende/-Fehler** aus, wenn die eingebettete Schleife keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über Warteschlangen pro Sitzung und global
   - löst Modell + Auth-Profil auf und baut die Pi-Sitzung auf
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt ein Timeout -> bricht den Lauf bei Überschreitung ab
   - gibt Payloads + Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lebenszyklus-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus-Ende/-Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing + Parallelität

- Läufe werden pro Sitzungsschlüssel (Sitzungs-Lane) und optional über eine globale Lane serialisiert.
- Das verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Nachrichtenkanäle können Queue-Modi wählen (collect/steer/followup), die dieses Lane-System speisen.
  Siehe [Command Queue](/de/concepts/queue).
- Transkript-Schreibvorgänge werden zusätzlich durch ein Sitzungs-Schreib-Lock auf der Sitzungsdatei geschützt. Das Lock ist
  prozessbewusst und dateibasiert, sodass es Schreiber erfasst, die die In-Process-Queue umgehen oder aus
  einem anderen Prozess kommen.
- Sitzungs-Schreib-Locks sind standardmäßig nicht reentrant. Wenn ein Helper absichtlich verschachtelt dasselbe
  Lock erwirbt und dabei einen logischen Schreiber beibehält, muss er sich explizit mit
  `allowReentrant: true` dafür anmelden.

## Vorbereitung von Sitzung + Workspace

- Der Workspace wird aufgelöst und erstellt; Sandbox-Läufe können auf eine Sandbox-Workspace-Root umleiten.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den Bericht des System-Prompts injiziert.
- Ein Sitzungs-Schreib-Lock wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, Compaction oder Trunkieren von Transkripten muss dasselbe Lock nehmen, bevor die
  Transkriptdatei geöffnet oder verändert wird.

## Prompt-Zusammenbau + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und Overrides pro Lauf aufgebaut.
- Modellspezifische Limits und für Compaction reservierte Tokens werden erzwungen.
- Siehe [System prompt](/de/concepts/system-prompt), um zu sehen, was das Modell sieht.

## Hook-Punkte (wo du eingreifen kannst)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Aufbau von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwende dies, um Bootstrap-Kontextdateien hinzuzufügen/zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- + Gateway-Lebenszyklus)

Diese laufen innerhalb der Agent-Schleife oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (ohne `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor dem Absenden des Prompts einzufügen. Verwende `prependContext` für dynamischen Text pro Turn und die System-Kontext-Felder für stabile Hinweise, die im Bereich des System-Prompts stehen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzuge die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und erlaubt einem Plugin, den Turn zu übernehmen und eine synthetische Antwort zurückzugeben oder den Turn vollständig stummzuschalten.
- **`agent_end`**: inspiziert die endgültige Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachten oder annotieren Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fangen Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: inspiziert integrierte Scan-Ergebnisse und kann Installationen von Skills oder Plugins optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein von OpenClaw verwaltetes Sitzungs-Transkript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende + ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Lebenszyklusereignisse des Gateways.

Hook-Entscheidungsregeln für Guards bei ausgehenden Nachrichten/Tools:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein vorheriges Cancel nicht auf.

Siehe [Plugin hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich anpassen. Das Codex-App-Server-Harness behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater Mechanismus auf niedrigerer Ebene von Codex bleiben.

## Streaming + partielle Antworten

- Assistant-Deltas werden von pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann partielle Antworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Block-Antwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor Logging/Ausgabe bezüglich Größe und Bild-Payloads bereinigt.
- Sendungen von Messaging-Tools werden verfolgt, um doppelte Bestätigungen des Assistant zu unterdrücken.

## Antwortformung + Unterdrückung

- Endgültige Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optionalem Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell einen Fehler erzeugt
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der endgültigen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler erzeugt hat, wird eine Fallback-Antwort für Tool-Fehler ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für den Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas von pi-agent-core
- `tool`: gestreamte Tool-Ereignisse von pi-agent-core

## Behandlung von Chat-Kanälen

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus-Ende/-Fehler** ausgegeben.

## Timeouts

- Standard für `agent.wait`: 30 s (nur das Warten). Parameter `timeoutMs` überschreibt dies.
- Agent-Laufzeit: Standard `agents.defaults.timeoutSeconds` ist 172800 s (48 Stunden); wird in `runEmbeddedPiAgent` über einen Abort-Timer erzwungen.
- LLM-Idle-Timeout: `agents.defaults.llm.idleTimeoutSeconds` bricht eine Modellanfrage ab, wenn vor Ablauf des Idle-Fensters keine Antwort-Chunks eintreffen. Setze es explizit für langsame lokale Modelle oder Provider mit Reasoning/Tool-Calls; setze es auf 0, um es zu deaktivieren. Wenn es nicht gesetzt ist, verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, andernfalls 120 s. Durch Cron ausgelöste Läufe ohne explizites LLM- oder Agent-Timeout deaktivieren den Idle-Watchdog und verlassen sich auf das äußere Timeout von Cron.

## Wo Dinge frühzeitig enden können

- Agent-Timeout (Abort)
- AbortSignal (Abbruch)
- Gateway-Disconnect oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agenten ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Konversationen zusammengefasst werden
- [Exec Approvals](/de/tools/exec-approvals) — Freigabe-Gates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration von Thinking-/Reasoning-Level
