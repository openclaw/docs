---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Anleitung zum Agent-Loop oder zu Lifecycle-Ereignissen
    - Sie ändern die Sitzungswarteschlange, Transkript-Schreibvorgänge oder das Verhalten der Schreibsperre für Sitzungen
summary: Agent-Loop-Lebenszyklus, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-06-27T17:22:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ein agentischer Loop ist der vollständige „echte“ Lauf eines Agenten: Eingang → Kontextaufbau → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Er ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine abschließende Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist ein Loop ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse ausgibt,
während das Modell denkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie dieser authentische Loop
Ende-zu-Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (übergeordnet)

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie thinking/verbose/trace-Standardwerte auf
   - lädt Skills-Snapshot
   - ruft `runEmbeddedAgent` auf (OpenClaw-Agent-Laufzeit)
   - gibt **Lebenszyklus Ende/Fehler** aus, wenn der eingebettete Loop keines davon ausgibt
3. `runEmbeddedAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Warteschlangen
   - löst Modell und Auth-Profil auf und erstellt die OpenClaw-Sitzung
   - abonniert Laufzeitereignisse und streamt Assistant-/Tool-Deltas
   - erzwingt Timeout -> bricht den Lauf ab, wenn es überschritten wird
   - bricht bei Codex-App-Server-Turns einen akzeptierten Turn ab, der vor einem terminalen Ereignis keinen App-Server-Fortschritt mehr erzeugt
   - gibt Payloads und Nutzungsmetadaten zurück
4. `subscribeEmbeddedAgentSession` überbrückt Ereignisse der Agent-Laufzeit zum OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistant-Deltas => `stream: "assistant"`
   - Lebenszyklusereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus Ende/Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Nebenläufigkeit

- Läufe werden pro Sitzungsschlüssel (Sitzungslane) serialisiert und optional durch eine globale Lane geführt.
- Dies verhindert Tool-/Sitzungs-Races und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi (steer/followup/collect/interrupt) wählen, die dieses Lane-System speisen.
  Siehe [Befehlswarteschlange](/de/concepts/queue).
- Transkript-Schreibvorgänge werden außerdem durch eine Sitzungs-Schreibsperre auf der Sitzungsdatei geschützt. Die Sperre ist
  prozessbewusst und dateibasiert, sodass sie Schreiber erfasst, die die prozessinterne Warteschlange umgehen oder aus
  einem anderen Prozess kommen. Sitzungs-Transkriptschreiber warten bis zu `session.writeLock.acquireTimeoutMs`,
  bevor sie die Sitzung als belegt melden; der Standardwert ist `60000` ms.
- Sitzungs-Schreibsperren sind standardmäßig nicht reentrant. Wenn ein Helper absichtlich den Erwerb
  derselben Sperre verschachtelt und dabei einen logischen Schreiber bewahrt, muss er dies explizit mit
  `allowReentrant: true` aktivieren.

## Sitzung + Workspace-Vorbereitung

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können auf einen Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Env und Prompt injiziert.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht injiziert.
- Eine Sitzungs-Schreibsperre wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet. Jeder
  spätere Pfad zum Umschreiben, zur Compaction oder zur Kürzung des Transkripts muss dieselbe Sperre nehmen, bevor er die
  Transkriptdatei öffnet oder verändert.

## Prompt-Aufbau + System-Prompt

- Der System-Prompt wird aus OpenClaws Basis-Prompt, Skills-Prompt, Bootstrap-Kontext und laufbezogenen Overrides erstellt.
- Modellspezifische Limits und Compaction-Reservetokens werden erzwungen.
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

- **`before_model_resolve`**: läuft vor der Sitzung (keine `messages`), um Provider/Modell deterministisch vor der Modellauflösung zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` vor der Prompt-Übermittlung zu injizieren. Verwenden Sie `prependContext` für dynamischen Text pro Turn und System-Kontextfelder für stabile Leitlinien, die im System-Prompt-Bereich stehen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf, sodass ein Plugin den Turn übernehmen und eine synthetische Antwort zurückgeben oder den Turn vollständig stummschalten kann.
- **`agent_end`**: prüft die finale Nachrichtenliste und Laufmetadaten nach Abschluss.
- **`before_compaction` / `after_compaction`**: beobachtet oder annotiert Compaction-Zyklen.
- **`before_tool_call` / `after_tool_call`**: fängt Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft bereitgestelltes Skill- oder Plugin-Installationsmaterial, nachdem die operatorseitige Installationsrichtlinie gelaufen ist, wenn Plugin-Hooks im aktuellen OpenClaw-Prozess geladen sind.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende und ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Gateway-Lebenszyklusereignisse.

Hook-Entscheidungsregeln für ausgehende/Tool-Guards:

- `before_tool_call`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt keinen vorherigen Block auf.
- `before_install`: `{ block: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist ein No-op und hebt keinen vorherigen Block auf.
- Verwenden Sie `security.installPolicy`, nicht `before_install`, für operatorseitige Installations-Allow-/Block-Entscheidungen, die CLI-Installations- und Update-Pfade abdecken müssen.
- `message_sending`: `{ cancel: true }` ist terminal und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt keinen vorherigen Abbruch auf.

Siehe [Plugin-Hooks](/de/plugins/hooks) für die Hook-API und Registrierungsdetails.

Harnesses können diese Hooks unterschiedlich adaptieren. Der Codex-App-Server-Harness hält
OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte
Oberflächen bei, während native Codex-Hooks ein separater, niedrigerer Codex-Mechanismus bleiben.

## Streaming + Teilantworten

- Assistant-Deltas werden aus der Agent-Laufzeit gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann Teilantworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten ausgegeben werden.
- Siehe [Streaming](/de/concepts/streaming) für Chunking und Blockantwort-Verhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Logging/Emitting hinsichtlich Größe und Bild-Payloads bereinigt.
- Messaging-Tool-Sendungen werden verfolgt, um doppelte Assistant-Bestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Finale Payloads werden zusammengesetzt aus:
  - Assistant-Text (und optionalem Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistant-Fehlertext, wenn das Modell fehlschlägt
- Das exakte Silent-Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Messaging-Tool-Duplikate werden aus der finalen Payload-Liste entfernt.
- Wenn keine renderbaren Payloads übrig bleiben und ein Tool einen Fehler hatte, wird eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für Benutzer sichtbare Antwort gesendet).

## Compaction + Wiederholungen

- Auto-Compaction gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden.
- Siehe [Compaction](/de/concepts/compaction) für die Compaction-Pipeline.

## Ereignisstreams (heute)

- `lifecycle`: ausgegeben von `subscribeEmbeddedAgentSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas aus der Agent-Laufzeit
- `tool`: gestreamte Tool-Ereignisse aus der Agent-Laufzeit

## Chat-Kanal-Behandlung

- Assistant-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus Ende/Fehler** ausgegeben.

## Timeouts

- `agent.wait`-Standardwert: 30 s (nur das Warten). Der Parameter `timeoutMs` überschreibt ihn.
- Agent-Laufzeit: `agents.defaults.timeoutSeconds` Standardwert 172800 s (48 Stunden); erzwungen im Abbruch-Timer von `runEmbeddedAgent`.
- Cron-Laufzeit: Das `timeoutSeconds` eines isolierten Agent-Turns gehört Cron. Der Scheduler startet diesen Timer, wenn die Ausführung beginnt, bricht den zugrunde liegenden Lauf zum konfigurierten Termin ab und führt dann begrenzte Bereinigung aus, bevor er den Timeout aufzeichnet, damit eine veraltete Child-Sitzung die Lane nicht blockiert halten kann.
- Sitzungs-Liveness-Diagnose: Bei aktivierter Diagnose klassifiziert `diagnostics.stuckSessionWarnMs` lange `processing`-Sitzungen, bei denen keine Antwort-, Tool-, Status-, Block- oder ACP-Fortschritte beobachtet wurden. Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet; eigene stille Modellaufrufe bleiben ebenfalls bis `diagnostics.stuckSessionAbortMs` `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als blockiert gemeldet werden. Aktive Arbeit ohne jüngsten Fortschritt wird als `session.stalled` gemeldet; eigene Modellaufrufe wechseln bei oder nach dem Abbruchschwellwert zu `session.stalled`, und eigentümerlose veraltete Modell-/Tool-Aktivität wird nicht als langlaufend verborgen. `session.stuck` ist für wiederherstellbare veraltete Sitzungsbuchhaltung reserviert, einschließlich inaktiver wartender Sitzungen mit veralteter eigentümerloser Modell-/Tool-Aktivität. Veraltete Sitzungsbuchhaltung gibt die betroffene Sitzungslane unmittelbar frei, nachdem Wiederherstellungs-Gates bestanden wurden; blockierte eingebettete Läufe werden erst nach `diagnostics.stuckSessionAbortMs` (Standard: mindestens 5 Minuten und das 3-Fache des Warnschwellwerts) per Abbruch geleert, damit wartende Arbeit fortgesetzt werden kann, ohne lediglich langsame Läufe abzuschneiden. Die Wiederherstellung gibt strukturierte angeforderte/abgeschlossene Ergebnisse aus, und der Diagnosezustand wird nur dann als inaktiv markiert, wenn dieselbe Verarbeitungsgeneration noch aktuell ist. Wiederholte `session.stuck`-Diagnosen verwenden Backoff, solange die Sitzung unverändert bleibt.
- Modell-Leerlauf-Timeout: OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauf-Fensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` erweitert diesen Leerlauf-Watchdog für langsame lokale/selbst gehostete Provider, ist aber weiterhin durch ein niedrigeres `agents.defaults.timeoutSeconds` oder ein laufbezogenes Timeout begrenzt, da diese den gesamten Agent-Lauf steuern. Andernfalls verwendet OpenClaw, wenn konfiguriert, `agents.defaults.timeoutSeconds`, standardmäßig auf 120 s begrenzt. Durch Cron ausgelöste Cloud-Modellläufe ohne explizites Modell- oder Agent-Timeout verwenden denselben Standard-Leerlauf-Watchdog; mit einem expliziten Cron-Lauf-Timeout werden Cloud-Modell-Stream-Blockaden auf 60 s begrenzt, damit konfigurierte Modell-Fallbacks vor der äußeren Cron-Deadline laufen können. Durch Cron ausgelöste lokale oder selbst gehostete Modellläufe deaktivieren den impliziten Watchdog, sofern kein explizites Timeout konfiguriert ist, und explizite Cron-Lauf-Timeouts bleiben das Leerlauf-Fenster für lokale/selbst gehostete Provider, daher sollten langsame lokale Provider `models.providers.<id>.timeoutSeconds` setzen.
- Provider-HTTP-Anfrage-Timeout: `models.providers.<id>.timeoutSeconds` gilt für die Modell-HTTP-Fetches dieses Providers, einschließlich Verbindung, Headern, Body, SDK-Anfrage-Timeout, gesamter abgesicherter Fetch-Abbruchbehandlung und Modell-Stream-Leerlauf-Watchdog. Verwenden Sie dies für langsame lokale/selbst gehostete Provider wie Ollama, bevor Sie den gesamten Agent-Laufzeit-Timeout erhöhen, und halten Sie den Agent-/Laufzeit-Timeout mindestens ebenso hoch, wenn die Modellanfrage länger laufen muss.

## Wo Dinge früh enden können

- Agent-Zeitüberschreitung (Abbruch)
- AbortSignal (Abbrechen)
- Gateway-Trennung oder RPC-Zeitüberschreitung
- `agent.wait`-Zeitüberschreitung (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agenten ausgelöst werden
- [Compaction](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungsschranken für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
