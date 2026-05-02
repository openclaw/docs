---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Erklärung des Agent-Loops oder der Lebenszyklusereignisse
    - Sie ändern die Sitzungswarteschlange, Transkript-Schreibvorgänge oder das Verhalten der Sitzungsschreibsperre
summary: Lebenszyklus der Agentenschleife, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-05-02T20:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein agentischer Loop ist der vollständige „reale“ Lauf eines Agenten: Eingang → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine finale Antwort umsetzt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist ein Loop ein einzelner, serialisierter Lauf pro Sitzung, der Lifecycle- und Stream-Ereignisse ausgibt,
während das Modell denkt, Tools aufruft und Ausgabe streamt. Dieses Dokument erklärt, wie dieser authentische Loop
End-to-End verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (High-Level)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie thinking/verbose/trace-Standardwerte auf
   - lädt Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lifecycle end/error** aus, wenn der eingebettete Loop keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Queues
   - löst Modell und Auth-Profil auf und baut die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht den Lauf ab, wenn es überschritten wird
   - bricht bei Codex-App-Server-Turns einen akzeptierten Turn ab, der vor einem terminalen Ereignis keinen App-Server-Fortschritt mehr erzeugt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` verbindet pi-agent-core-Ereignisse mit dem OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lifecycle-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lifecycle end/error** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing + Nebenläufigkeit

- Läufe werden pro Sitzungsschlüssel (Sitzungs-Lane) und optional über eine globale Lane serialisiert.
- Das verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Queue-Modi (collect/steer/followup) wählen, die dieses Lane-System speisen.
  Siehe [Befehls-Queue](/de/concepts/queue).
- Transkript-Schreibvorgänge werden zusätzlich durch eine Sitzungs-Schreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreibende erfasst, die die In-Process-Queue umgehen oder aus
  einem anderen Prozess kommen. Sitzungs-Transkript-Schreibende warten bis zu `session.writeLock.acquireTimeoutMs`,
  bevor die Sitzung als ausgelastet gemeldet wird; der Standardwert ist `60000` ms.
- Sitzungs-Schreibsperren sind standardmäßig nicht reentrant. Wenn ein Helper absichtlich die Akquise
  derselben Sperre verschachtelt und dabei einen logischen Schreibenden beibehält, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Sitzungs- und Workspace-Vorbereitung

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können zu einem Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungs-Schreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, zur Compaction oder zur Kürzung des Transkripts muss dieselbe Sperre erwerben, bevor die Transkriptdatei geöffnet oder
  verändert wird.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und laufbezogenen Overrides aufgebaut.
- Modellspezifische Limits und Compaction-Reserve-Tokens werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt), um zu erfahren, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lifecycle-Ereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Tool-Lifecycle und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Nutzen Sie dies, um Bootstrap-Kontextdateien hinzuzufügen/zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokument).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agenten- und Gateway-Lifecycle)

Diese laufen innerhalb des Agenten-Loops oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell deterministisch vor der Modellauflösung zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und Systemkontext-Felder für stabile Anweisungen, die im System-Prompt-Bereich liegen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, wodurch ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: prüft die finale Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft integrierte Scan-Funde und kann Skills- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein von OpenClaw verwaltetes Sitzungs-Transkript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende und ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungs-Lifecycle.
- **`gateway_start` / `gateway_stop`**: Gateway-Lifecycle-Ereignisse.

Hook-Entscheidungsregeln für ausgehende/Tool-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt keine vorherige Blockierung auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt keine vorherige Blockierung auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt keinen vorherigen Abbruch auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater, niedrigerer Codex-Mechanismus bleiben.

## Streaming + Teilantworten

- Assistant-Deltas werden aus pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Block-Antwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Logging/Emittieren hinsichtlich Größe und Bild-Payloads bereinigt.
- Sends von Messaging-Tools werden nachverfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell Fehler erzeugt
- Das exakte Stumm-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads gefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler hatte, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (außer ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Chat-Kanalbehandlung

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lifecycle end/error** ausgegeben.

## Timeouts

- `agent.wait`-Standard: 30 s (nur das Warten). Parameter `timeoutMs` überschreibt dies.
- Agenten-Laufzeit: `agents.defaults.timeoutSeconds` Standard 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.
- Cron-Laufzeit: `timeoutSeconds` eines isolierten Agenten-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht den zugrunde liegenden Lauf zur konfigurierten Deadline ab und führt anschließend begrenztes Cleanup aus, bevor der Timeout aufgezeichnet wird, damit eine veraltete Kind-Sitzung die Lane nicht blockiert halten kann.
- Sitzungs-Liveness-Diagnosen: Bei aktivierten Diagnosen klassifiziert `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen, die keinen beobachteten Antwort-, Tool-, Status-, Block- oder ACP-Fortschritt haben. Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet; aktive Arbeit ohne kürzlichen Fortschritt wird als `session.stalled` gemeldet; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert, und nur dieser Pfad gibt die betroffene Sitzungs-Lane frei, damit queued Startarbeit abfließen kann. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung unverändert bleibt.
- Modell-Idle-Timeout: OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Idle-Fensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Idle-Watchdog für langsame lokale/selbst gehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig auf 120 s begrenzt. Von Cron ausgelöste Läufe ohne expliziten Modell- oder Agenten-Timeout deaktivieren den Idle-Watchdog und verlassen sich auf den äußeren Cron-Timeout.
- Provider-HTTP-Anfrage-Timeout: `models.providers.<id>.timeoutSeconds` gilt für die Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Headern, Body, SDK-Anfrage-Timeout, gesamter abgesicherter Fetch-Abbruchbehandlung und Modell-Stream-Idle-Watchdog. Verwenden Sie dies für langsame lokale/selbst gehostete Provider wie Ollama, bevor Sie den gesamten Agenten-Laufzeit-Timeout erhöhen.

## Wo Dinge früh enden können

- Agenten-Timeout (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agenten-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Agenten-Lifecycle-Ereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungs-Gates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
