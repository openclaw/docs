---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zur Agenten-Schleife oder zu Lifecycle-Ereignissen
    - Sie ändern die Warteschlangenbildung für Sitzungen, Transkript-Schreibvorgänge oder das Verhalten der Schreibsperre für Sitzungen
summary: Lebenszyklus der Agent-Schleife, Streams und Wartesemantik
title: Agent-Schleife
x-i18n:
    generated_at: "2026-04-30T06:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein agentischer Loop ist die vollständige „echte“ Ausführung eines Agenten: Eingang → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine finale Antwort umsetzt und dabei den Sitzungsstatus konsistent hält.

In OpenClaw ist ein Loop eine einzelne, serialisierte Ausführung pro Sitzung, die Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell denkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie dieser authentische Loop
End-to-End verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (überblicksartig)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Standardwerte für Denken/Verbose/Trace auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Runtime)
   - gibt **Lebenszyklus-Ende/-Fehler** aus, wenn der eingebettete Loop keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Ausführungen über sitzungsspezifische und globale Queues
   - löst Modell und Authentifizierungsprofil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht die Ausführung ab, wenn es überschritten wird
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lebenszyklusereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus-Ende/-Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing + Nebenläufigkeit

- Ausführungen werden pro Sitzungsschlüssel (Sitzungs-Lane) serialisiert und optional über eine globale Lane geführt.
- Dies verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Queue-Modi (collect/steer/followup) wählen, die in dieses Lane-System einspeisen.
  Siehe [Befehls-Queue](/de/concepts/queue).
- Transkriptschreibvorgänge werden außerdem durch eine Sitzungsschreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreibende erfasst, die die prozessinterne Queue umgehen oder aus
  einem anderen Prozess stammen.
- Sitzungsschreibsperren sind standardmäßig nicht reentrant. Wenn ein Helper absichtlich den Erwerb
  derselben Sperre verschachtelt und dabei einen logischen Schreibenden beibehält, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Sitzungs- und Workspace-Vorbereitung

- Der Workspace wird aufgelöst und erstellt; sandboxed Ausführungen können zu einem Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungsschreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad für Transkript-Neuschreibung, Compaction oder Kürzung muss dieselbe Sperre erwerben, bevor er die Transkriptdatei öffnet oder
  verändert.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und ausführungsspezifischen Überschreibungen erstellt.
- Modellspezifische Limits und Reserve-Tokens für Compaction werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt), um zu sehen, was das Modell erhält.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen/zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokument).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- + Gateway-Lebenszyklus)

Diese laufen innerhalb des Agent-Loops oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und Systemkontextfelder für stabile Anweisungen, die im System-Prompt-Bereich stehen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, sodass ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: inspiziert die finale Nachrichtenliste und Ausführungsmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: inspiziert eingebaute Scan-Ergebnisse und blockiert optional Skill- oder Plugin-Installationen.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein von OpenClaw verwaltetes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende und ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Gateway-Lebenszyklusereignisse.

Hook-Entscheidungsregeln für Outbound-/Tool-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt keine frühere Blockierung auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt keine frühere Blockierung auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt keinen früheren Abbruch auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness behält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater, niedrigerer Codex-Mechanismus bleiben.

## Streaming + Teilantworten

- Assistant-Deltas werden aus pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking und Verhalten von Blockantworten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Protokollieren/Ausgeben hinsichtlich Größe und Bild-Payloads bereinigt.
- Sends von Messaging-Tools werden nachverfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell Fehler verursacht
- Das exakte stille Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine darstellbaren Payloads übrig bleiben und ein Tool fehlgeschlagen ist, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben durch `subscribeEmbeddedPiSession` (und als Fallback durch `agentCommand`)
- `assistant`: gestreamte Deltas aus pi-agent-core
- `tool`: gestreamte Tool-Ereignisse aus pi-agent-core

## Chatkanal-Behandlung

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus-Ende/-Fehler** ausgegeben.

## Timeouts

- Standardwert für `agent.wait`: 30 s (nur das Warten). Parameter `timeoutMs` überschreibt ihn.
- Agent-Runtime: `agents.defaults.timeoutSeconds` Standardwert 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.
- Cron-Runtime: isoliertes `timeoutSeconds` für Agent-Turns wird von cron verwaltet. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht die zugrunde liegende Ausführung zur konfigurierten Deadline ab und führt dann begrenzte Bereinigung aus, bevor der Timeout aufgezeichnet wird, sodass eine veraltete Child-Sitzung die Lane nicht blockiert halten kann.
- Wiederherstellung blockierter Sitzungen: Wenn Diagnose aktiviert ist, erkennt `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen. Aktive eingebettete Ausführungen, aktive Antwortoperationen und aktive Sitzungs-Lane-Tasks bleiben standardmäßig nur Warnungen; wenn die Diagnose keine aktive Arbeit für die Sitzung zeigt, gibt der Watchdog die betroffene Sitzungs-Lane frei, damit eingereihte Startarbeit abfließen kann.
- Modell-Leerlauf-Timeout: OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauffensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Leerlauf-Watchdog für langsame lokale/selbst gehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig auf 120 s gedeckelt. Durch Cron ausgelöste Ausführungen ohne explizites Modell- oder Agent-Timeout deaktivieren den Leerlauf-Watchdog und verlassen sich auf den äußeren Cron-Timeout.
- HTTP-Anfrage-Timeout des Providers: `models.providers.<id>.timeoutSeconds` gilt für die Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Header, Body, SDK-Anfrage-Timeout, gesamter geschützter Fetch-Abbruchbehandlung und Modell-Stream-Leerlauf-Watchdog. Verwenden Sie dies für langsame lokale/selbst gehostete Provider wie Ollama, bevor Sie den gesamten Agent-Runtime-Timeout erhöhen.

## Wo Dinge vorzeitig enden können

- Agent-Timeout (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandte Themen

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Agent-Lebenszyklusereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Freigaben](/de/tools/exec-approvals) — Freigabe-Gates für Shell-Befehle
- [Denken](/de/tools/thinking) — Konfiguration der Denk-/Reasoning-Stufe
