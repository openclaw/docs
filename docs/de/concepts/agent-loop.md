---
read_when:
    - Du brauchst eine genaue Erläuterung der Agentenschleife oder der Lebenszyklusereignisse
    - Du änderst das Sitzungs-Queueing, Transcript-Schreibvorgänge oder das Verhalten der Sitzungsschreibsperre
summary: Lebenszyklus der Agentenschleife, Streams und Wait-Semantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-04-23T06:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agentenschleife (OpenClaw)

Eine agentische Schleife ist der vollständige „echte“ Lauf eines Agenten: Eingabe → Kontextaufbau → Modellinferenz →
Tool-Ausführung → Streaming von Antworten → Persistenz. Sie ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine endgültige Antwort umwandelt und dabei den Sitzungsstatus konsistent hält.

In OpenClaw ist eine Schleife ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse ausgibt,
während das Modell denkt, Tools aufruft und Ausgabe streamt. Dieses Dokument erklärt, wie diese echte Schleife
Ende zu Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (allgemein)

1. RPC `agent` validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Standardwerte für Modell + Thinking/Verbose/Trace auf
   - lädt den Snapshot von Skills
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lebenszyklus-Ende/Fehler** aus, wenn die eingebettete Schleife dies nicht tut
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über Sitzungswarteschlangen pro Sitzung + globale Warteschlangen
   - löst Modell + Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt ein Timeout -> bricht den Lauf bei Überschreitung ab
   - gibt Payloads + Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` verbindet pi-agent-core-Ereignisse mit dem OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lebenszyklus-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus-Ende/Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing + Nebenläufigkeit

- Läufe werden pro Sitzungsschlüssel serialisiert (Sitzungs-Lane) und optional über eine globale Lane.
- Dies verhindert Tool-/Sitzungs-Rennen und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi wählen (collect/steer/followup), die in dieses Lane-System einspeisen.
  Siehe [Command Queue](/de/concepts/queue).
- Transcript-Schreibvorgänge werden ebenfalls durch eine Sitzungsschreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreiber erkennt, die die In-Process-Warteschlange umgehen oder aus
  einem anderen Prozess kommen.
- Sitzungsschreibsperren sind standardmäßig nicht reentrant. Wenn ein Helper das Verschachteln des Erwerbs
  derselben Sperre absichtlich vornimmt und dabei einen logischen Schreiber beibehält, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Vorbereitung von Sitzung + Workspace

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können zu einem Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Env und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den Bericht zum System Prompt injiziert.
- Eine Sitzungsschreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, zur Compaction oder zum Abschneiden des Transcripts muss dieselbe Sperre verwenden, bevor die Transcript-Datei geöffnet oder
  mutiert wird.

## Prompt-Zusammenstellung + System Prompt

- Der System Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und Pro-Lauf-Overrides aufgebaut.
- Modellspezifische Limits und Reserve-Tokens für Compaction werden erzwungen.
- Siehe [System prompt](/de/concepts/system-prompt), um zu sehen, was das Modell sieht.

## Hook-Punkte (wo du eingreifen kannst)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft während des Aufbaus von Bootstrap-Dateien, bevor der System Prompt finalisiert wird.
  Verwende dies, um Bootstrap-Kontextdateien hinzuzufügen/zu entfernen.
- **Command-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agenten- + Gateway-Lebenszyklus)

Diese laufen innerhalb der Agentenschleife oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (ohne `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um vor dem Senden des Prompts `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` zu injizieren. Verwende `prependContext` für dynamischen Text pro Turn und die Systemkontext-Felder für stabile Anleitung, die im Bereich des System Prompt liegen sollte.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzuge die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und erlaubt einem Plugin, den Turn zu übernehmen und eine synthetische Antwort zurückzugeben oder den Turn vollständig stummzuschalten.
- **`agent_end`**: prüft die endgültige Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachten oder annotieren Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fangen Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft integrierte Scan-Ergebnisse und kann die Installation von Skills oder Plugins optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in das Sitzungs-Transcript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende + ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Lebenszyklusereignisse des Gateway.

Regeln für Hook-Entscheidungen bei ausgehenden/Tool-Gates:

- `before_tool_call`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-Op und hebt einen früheren Block nicht auf.
- `before_install`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-Op und hebt einen früheren Block nicht auf.
- `message_sending`: `{ cancel: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-Op und hebt ein früheres Cancel nicht auf.

Siehe [Plugin hooks](/de/plugins/architecture#provider-runtime-hooks) für die Hook-API und Details zur Registrierung.

## Streaming + partielle Antworten

- Assistant-Deltas werden aus pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann partielle Antworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking und das Verhalten von Block-Antworten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Protokollieren/Ausgeben hinsichtlich Größe und Bild-Payloads bereinigt.
- Sendungen von Messaging-Tools werden verfolgt, um doppelte Bestätigungen des Assistant zu unterdrücken.

## Antwortformung + Unterdrückung

- Endgültige Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Fehlertext des Assistant, wenn das Modell einen Fehler ausgibt
- Das exakte stille Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der endgültigen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads verbleiben und ein Tool einen Fehler ausgegeben hat, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Behandlung von Chat-Kanälen

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus-Ende/Fehler** ausgegeben.

## Timeouts

- Standard für `agent.wait`: 30s (nur das Warten). Parameter `timeoutMs` überschreibt dies.
- Agentenlaufzeit: Standard für `agents.defaults.timeoutSeconds` ist 172800s (48 Stunden); erzwungen im Abort-Timer von `runEmbeddedPiAgent`.
- Leerlauf-Timeout des LLM: `agents.defaults.llm.idleTimeoutSeconds` bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauffensters keine Antwort-Chunks eintreffen. Setze dies explizit für langsame lokale Modelle oder Provider mit Reasoning/Tool-Aufrufen; setze es auf 0, um es zu deaktivieren. Wenn es nicht gesetzt ist, verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, andernfalls 120s. Cron-ausgelöste Läufe ohne explizites LLM- oder Agenten-Timeout deaktivieren den Leerlauf-Watchdog und verlassen sich auf das äußere Cron-Timeout.

## Wo Dinge frühzeitig enden können

- Agenten-Timeout (Abort)
- AbortSignal (Abbruch)
- Gateway-Trennung oder RPC-Timeout
- Timeout von `agent.wait` (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agenten-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agenten ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec Approvals](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
