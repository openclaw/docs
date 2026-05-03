---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zur Agent-Schleife oder zu Lifecycle-Ereignissen
    - Sie ändern die Warteschlangenverwaltung von Sitzungen, Transkript-Schreibvorgänge oder das Verhalten der Schreibsperre für Sitzungen
summary: Lebenszyklus der Agent-Schleife, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-05-03T21:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Eine agentische Schleife ist der vollständige „echte“ Lauf eines Agenten: Aufnahme → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Sie ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine abschließende Antwort umsetzt, während der Sitzungszustand konsistent bleibt.

In OpenClaw ist eine Schleife ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell denkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie diese authentische Schleife
durchgehend verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (übergeordnet)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Standardwerte für Denken/ausführliche Ausgabe/Tracing auf
   - lädt Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lebenszyklus Ende/Fehler** aus, wenn die eingebettete Schleife dies nicht selbst ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Warteschlangen
   - löst Modell und Authentifizierungsprofil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistenten-/Tool-Deltas
   - erzwingt Timeout -> bricht den Lauf ab, wenn es überschritten wird
   - bricht bei Codex-App-Server-Turns einen akzeptierten Turn ab, der vor einem terminalen Ereignis keinen App-Server-Fortschritt mehr erzeugt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` überbrückt pi-agent-core-Ereignisse zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistenten-Deltas => `stream: "assistant"`
   - Lebenszyklus-Ereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus Ende/Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Nebenläufigkeit

- Läufe werden pro Sitzungsschlüssel (Sitzungs-Lane) serialisiert und optional über eine globale Lane geführt.
- Dies verhindert Tool-/Sitzungs-Rennen und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi wählen (collect/steer/followup), die dieses Lane-System speisen.
  Siehe [Befehlswarteschlange](/de/concepts/queue).
- Transkriptschreibvorgänge werden zusätzlich durch eine Sitzungsschreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreiber erfasst, die die In-Process-Warteschlange umgehen oder aus
  einem anderen Prozess kommen. Sitzungstranskriptschreiber warten bis zu `session.writeLock.acquireTimeoutMs`,
  bevor sie die Sitzung als ausgelastet melden; der Standardwert ist `60000` ms.
- Sitzungsschreibsperren sind standardmäßig nicht reentrant. Wenn ein Helfer absichtlich den Erwerb
  derselben Sperre verschachtelt und dabei einen logischen Schreiber beibehält, muss er dies ausdrücklich mit
  `allowReentrant: true` aktivieren.

## Sitzungs- und Arbeitsbereichsvorbereitung

- Der Arbeitsbereich wird aufgelöst und erstellt; sandboxed Läufe können auf einen Sandbox-Arbeitsbereichsstamm umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebung und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungsschreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, Kompaktieren oder Abschneiden des Transkripts muss dieselbe Sperre erwerben, bevor
  die Transkriptdatei geöffnet oder verändert wird.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, Bootstrap-Kontext und laufbezogenen Overrides erstellt.
- Modellspezifische Limits und reservierte Tokens für Compaction werden erzwungen.
- Siehe [System-Prompt](/de/concepts/system-prompt) für das, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklus-Ereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft beim Erstellen von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Siehe [Hooks](/de/automation/hooks) für Einrichtung und Beispiele.

### Plugin-Hooks (Agenten- und Gateway-Lebenszyklus)

Diese laufen innerhalb der Agentenschleife oder Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und Systemkontextfelder für stabile Anleitung, die im System-Prompt-Bereich stehen soll.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die oben genannten expliziten Hooks.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und erlaubt einem Plugin, den Turn zu übernehmen und eine synthetische Antwort zurückzugeben oder den Turn vollständig stummzuschalten.
- **`agent_end`**: inspiziert die finale Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: inspiziert eingebaute Scan-Ergebnisse und blockiert optional Skill- oder Plugin-Installationen.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: eingehende und ausgehende Nachrichten-Hooks.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Gateway-Lebenszyklusereignisse.

Hook-Entscheidungsregeln für ausgehende/Tool-Schutzmechanismen:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt eine vorherige Blockierung nicht auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt eine vorherige Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt einen vorherigen Abbruch nicht auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness hält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen ein, während native Codex-Hooks ein separater, niedriger angesetzter Codex-Mechanismus bleiben.

## Streaming + Teilantworten

- Assistenten-Deltas werden von pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking- und Blockantwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/End-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor Protokollierung/Ausgabe auf Größe und Bild-Payloads bereinigt.
- Sendevorgänge von Messaging-Tools werden verfolgt, um doppelte Assistentenbestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengestellt aus:
  - Assistententext (und optional Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn ausführliche Ausgabe + erlaubt)
  - Assistenten-Fehlertext, wenn das Modell Fehler ausgibt
- Das exakte stille Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads gefiltert.
- Duplikate von Messaging-Tools werden aus der finalen Payload-Liste entfernt.
- Wenn keine darstellbaren Payloads verbleiben und bei einem Tool ein Fehler aufgetreten ist, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (sofern nicht bereits ein Messaging-Tool eine für Benutzer sichtbare Antwort gesendet hat).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgabe zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignis-Streams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas von pi-agent-core
- `tool`: gestreamte Tool-Ereignisse von pi-agent-core

## Chat-Kanal-Verarbeitung

- Assistenten-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus Ende/Fehler** ausgegeben.

## Timeouts

- Standard für `agent.wait`: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agentenlaufzeit: Standard für `agents.defaults.timeoutSeconds` ist 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedPiAgent`.
- Cron-Laufzeit: `timeoutSeconds` für isolierte Agenten-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht den zugrunde liegenden Lauf zur konfigurierten Deadline ab und führt dann begrenzte Bereinigung aus, bevor er das Timeout aufzeichnet, damit eine veraltete Kind-Sitzung die Lane nicht blockiert halten kann.
- Sitzungs-Liveness-Diagnosen: Bei aktivierten Diagnosen klassifiziert `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen, die keinen beobachteten Antwort-, Tool-, Status-, Block- oder ACP-Fortschritt haben. Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet; aktive Arbeit ohne aktuellen Fortschritt wird als `session.stalled` gemeldet; `session.stuck` ist für veraltete Sitzungsbuchhaltung ohne aktive Arbeit reserviert. Veraltete Sitzungsbuchhaltung gibt die betroffene Sitzungs-Lane sofort frei; festgefahrene eingebettete Läufe werden erst nach einem erweiterten Fenster ohne Fortschritt abgebrochen und geleert (mindestens 10 Minuten und das 5-Fache des Warnschwellenwerts), damit wartende Arbeit fortgesetzt werden kann, ohne lediglich langsame Läufe abzuschneiden. Wiederholte `session.stuck`-Diagnosen werden zurückgefahren, solange die Sitzung unverändert bleibt.
- Modell-Leerlauf-Timeout: OpenClaw bricht eine Modellanforderung ab, wenn vor Ablauf des Leerlauffensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Leerlauf-Watchdog für langsame lokale/selbstgehostete Provider; andernfalls verwendet OpenClaw `agents.defaults.timeoutSeconds`, wenn konfiguriert, standardmäßig auf 120 s begrenzt. Von Cron ausgelöste Läufe ohne explizites Modell- oder Agenten-Timeout deaktivieren den Leerlauf-Watchdog und verlassen sich auf das äußere Cron-Timeout.
- Provider-HTTP-Anforderungs-Timeout: `models.providers.<id>.timeoutSeconds` gilt für Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Header, Body, SDK-Anforderungs-Timeout, gesamter guarded-fetch-Abbruchbehandlung und Leerlauf-Watchdog für den Modell-Stream. Verwenden Sie dies für langsame lokale/selbstgehostete Provider wie Ollama, bevor Sie das Timeout für die gesamte Agentenlaufzeit erhöhen.

## Wo Dinge früh enden können

- Agenten-Timeout (Abbruch)
- AbortSignal (Abbruch)
- Gateway-Trennung oder RPC-Timeout
- `agent.wait`-Timeout (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agenten-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Agenten-Lebenszyklusereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungstore für Shell-Befehle
- [Denken](/de/tools/thinking) — Konfiguration der Denk-/Reasoning-Stufe
