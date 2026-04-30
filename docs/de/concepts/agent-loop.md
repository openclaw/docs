---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zur Agentenschleife oder zu Lebenszyklusereignissen
    - Sie ändern die Warteschlangenverarbeitung von Sitzungen, Transkript-Schreibvorgänge oder das Verhalten der Schreibsperre für Sitzungen
summary: Lebenszyklus des Agent-Loops, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-04-30T18:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein agentischer Loop ist der vollständige „echte“ Lauf eines Agenten: Eingang → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine finale Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist ein Loop ein einzelner, serialisierter Lauf pro Sitzung, der Lifecycle- und Stream-Ereignisse ausgibt,
während das Modell nachdenkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie dieser authentische Loop
durchgängig verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (allgemein)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Thinking/Verbose/Trace-Standardwerte auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Runtime)
   - gibt **Lifecycle-Ende/Fehler** aus, falls der eingebettete Loop dies nicht selbst ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Queues
   - löst Modell und Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht den Lauf ab, wenn er überschritten wird
   - bricht bei Codex-App-Server-Turns einen akzeptierten Turn ab, der vor einem terminalen Ereignis keinen App-Server-Fortschritt mehr erzeugt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lifecycle-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lifecycle-Ende/Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Queueing und Nebenläufigkeit

- Läufe werden pro Sitzungsschlüssel (Sitzungs-Lane) und optional über eine globale Lane serialisiert.
- Dies verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Queue-Modi wählen (collect/steer/followup), die dieses Lane-System speisen.
  Siehe [Command Queue](/de/concepts/queue).
- Transkript-Schreibvorgänge werden ebenfalls durch eine Sitzungs-Schreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Writer erfasst, die die In-Process-Queue umgehen oder aus
  einem anderen Prozess stammen.
- Sitzungs-Schreibsperren sind standardmäßig nicht wiedereintrittsfähig. Wenn ein Helper absichtlich den Erwerb
  derselben Sperre verschachtelt und dabei einen logischen Writer beibehält, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Vorbereitung von Sitzung und Arbeitsbereich

- Der Arbeitsbereich wird aufgelöst und erstellt; sandboxierte Läufe können auf ein Sandbox-Arbeitsbereich-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungs-Schreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Neuschreiben, zur Compaction oder zur Kürzung des Transkripts muss dieselbe Sperre erwerben, bevor er die Transkriptdatei öffnet oder
  verändert.

## Prompt-Zusammenstellung und System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und laufbezogenen Overrides aufgebaut.
- Modellspezifische Limits und reservierte Token für Compaction werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt) dafür, was das Modell sieht.

## Hook-Punkte (an denen Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lifecycle-Ereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agent-/Tool-Lifecycles und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Aufbau von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Command-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokument).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agent- und Gateway-Lifecycle)

Diese laufen innerhalb des Agenten-Loops oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell deterministisch vor der Modellauflösung zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um vor der Prompt-Übermittlung `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und Systemkontext-Felder für stabile Leitlinien, die im System-Prompt-Bereich stehen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitätshook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, sodass ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: finale Nachrichtenliste und Laufmetadaten nach Abschluss prüfen.
- **`before_compaction` / `after_compaction`**: Compaction-Zyklen beobachten oder annotieren.
- **`before_tool_call` / `after_tool_call`**: Tool-Parameter/-Ergebnisse abfangen.
- **`before_install`**: integrierte Scan-Ergebnisse prüfen und Skill- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: Tool-Ergebnisse synchron transformieren, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: eingehende und ausgehende Nachrichten-Hooks.
- **`session_start` / `session_end`**: Sitzungs-Lifecycle-Grenzen.
- **`gateway_start` / `gateway_stop`**: Gateway-Lifecycle-Ereignisse.

Hook-Entscheidungsregeln für Outbound-/Tool-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt einen vorherigen Block nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein vorheriges Cancel nicht auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness hält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen aufrecht, während native Codex-Hooks ein separater, niedrigerer Codex-Mechanismus bleiben.

## Streaming und Teilantworten

- Assistant-Deltas werden von pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Blockantwort-Verhalten.

## Tool-Ausführung und Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Logging/der Ausgabe hinsichtlich Größe und Bild-Payloads bereinigt.
- Sends von Messaging-Tools werden verfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung und Unterdrückung

- Finale Payloads werden zusammengestellt aus:
  - Assistant-Text (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose und erlaubt)
  - Assistant-Fehlertext, wenn das Modell Fehler ausgibt
- Das exakte stumme Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und bei einem Tool ein Fehler aufgetreten ist, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (sofern nicht bereits ein Messaging-Tool eine für Benutzer sichtbare Antwort gesendet hat).

## Compaction und Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas von pi-agent-core
- `tool`: gestreamte Tool-Ereignisse von pi-agent-core

## Umgang mit Chat-Kanälen

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lifecycle-Ende/Fehler** ausgegeben.

## Timeouts

- `agent.wait`-Standardwert: 30 s (nur das Warten). Parameter `timeoutMs` überschreibt dies.
- Agenten-Runtime: `agents.defaults.timeoutSeconds` Standardwert 172800 s (48 Stunden); durch den Abbruch-Timer in `runEmbeddedPiAgent` erzwungen.
- Cron-Runtime: Das `timeoutSeconds` eines isolierten Agent-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht den zugrunde liegenden Lauf zum konfigurierten Stichtag ab und führt anschließend begrenztes Cleanup aus, bevor der Timeout aufgezeichnet wird, damit eine veraltete Child-Sitzung die Lane nicht blockiert halten kann.
- Wiederherstellung festhängender Sitzungen: Mit aktivierten Diagnosen erkennt `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen. Aktive eingebettete Läufe, aktive Antwortoperationen und aktive Sitzungs-Lane-Aufgaben bleiben standardmäßig nur Warnungen; wenn die Diagnosen keine aktive Arbeit für die Sitzung zeigen, gibt der Watchdog die betroffene Sitzungs-Lane frei, damit aufgereihte Startarbeit abfließen kann.
- Modell-Inaktivitäts-Timeout: OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Inaktivitätsfensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Inaktivitäts-Watchdog für langsame lokale/selbst gehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig bei 120 s gedeckelt. Von Cron ausgelöste Läufe ohne explizites Modell- oder Agent-Timeout deaktivieren den Inaktivitäts-Watchdog und verlassen sich auf den äußeren Cron-Timeout.
- Provider-HTTP-Anfrage-Timeout: `models.providers.<id>.timeoutSeconds` gilt für Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Headern, Body, SDK-Anfrage-Timeout, gesamter Guarded-Fetch-Abbruchbehandlung und Modell-Stream-Inaktivitäts-Watchdog. Verwenden Sie dies für langsame lokale/selbst gehostete Provider wie Ollama, bevor Sie den gesamten Agenten-Runtime-Timeout erhöhen.

## Wo Dinge vorzeitig enden können

- Agenten-Timeout (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agenten-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Agenten-Lifecycle-Ereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungsgates für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
