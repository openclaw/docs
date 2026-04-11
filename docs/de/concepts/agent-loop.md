---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Erklärung der Agentenschleife oder der Lebenszyklusereignisse
summary: Lebenszyklus der Agentenschleife, Streams und Warte-Semantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-04-11T02:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6831a5b11e9100e49f650feca51ab44a2bef242ce1b5db2766d0b3b5c5ba729
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agentenschleife (OpenClaw)

Eine agentische Schleife ist der vollständige „echte“ Lauf eines Agenten: Eingabe → Kontextzusammenstellung → Modellinferenz →
Tool-Ausführung → Streaming-Antworten → Persistenz. Sie ist der maßgebliche Pfad, der eine Nachricht
in Aktionen und eine endgültige Antwort umwandelt und dabei den Sitzungszustand konsistent hält.

In OpenClaw ist eine Schleife ein einzelner, serialisierter Lauf pro Sitzung, der Lebenszyklus- und Stream-Ereignisse
ausgibt, während das Modell nachdenkt, Tools aufruft und Ausgaben streamt. Dieses Dokument erklärt, wie diese echte Schleife
Ende-zu-Ende verdrahtet ist.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: Befehl `agent`.

## Funktionsweise (Übersicht)

1. Die `agent`-RPC validiert Parameter, löst die Sitzung auf (sessionKey/sessionId), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Agenten aus:
   - löst Modell- sowie Thinking-/Verbose-Standards auf
   - lädt den Skills-Snapshot
   - ruft `runEmbeddedPiAgent` auf (pi-agent-core-Laufzeit)
   - gibt **Lebenszyklus-Ende/-Fehler** aus, wenn die eingebettete Schleife selbst keines ausgibt
3. `runEmbeddedPiAgent`:
   - serialisiert Läufe über sitzungsbezogene und globale Warteschlangen
   - löst Modell + Auth-Profil auf und erstellt die Pi-Sitzung
   - abonniert Pi-Ereignisse und streamt Assistenten-/Tool-Deltas
   - erzwingt ein Zeitlimit und bricht den Lauf ab, wenn es überschritten wird
   - gibt Payloads + Nutzungsmetadaten zurück
4. `subscribeEmbeddedPiSession` verbindet pi-agent-core-Ereignisse mit dem OpenClaw-`agent`-Stream:
   - Tool-Ereignisse => `stream: "tool"`
   - Assistenten-Deltas => `stream: "assistant"`
   - Lebenszyklusereignisse => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` verwendet `waitForAgentRun`:
   - wartet auf **Lebenszyklus-Ende/-Fehler** für `runId`
   - gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück

## Warteschlangen + Parallelität

- Läufe werden pro Sitzungsschlüssel (Sitzungs-Lane) und optional über eine globale Lane serialisiert.
- Das verhindert Tool-/Sitzungs-Race-Conditions und hält den Sitzungsverlauf konsistent.
- Messaging-Kanäle können Warteschlangenmodi auswählen (collect/steer/followup), die dieses Lane-System speisen.
  Siehe [Befehlswarteschlange](/de/concepts/queue).

## Sitzungsvorbereitung + Workspace

- Der Workspace wird aufgelöst und erstellt; sandboxed Läufe können auf ein Sandbox-Workspace-Root umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in Umgebungsvariablen und Prompt eingebracht.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt-Bericht eingebunden.
- Eine Schreibsperre für die Sitzung wird erworben; `SessionManager` wird vor dem Streaming geöffnet und vorbereitet.

## Prompt-Zusammenstellung + System-Prompt

- Der System-Prompt wird aus dem Basisprompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und laufspezifischen Überschreibungen erstellt.
- Modellspezifische Limits und Reserve-Token für die Kompaktierung werden erzwungen.
- Unter [System-Prompt](/de/concepts/system-prompt) sehen Sie, was das Modell sieht.

## Hook-Punkte (wo Sie eingreifen können)

OpenClaw hat zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: läuft während der Erstellung von Bootstrap-Dateien, bevor der System-Prompt finalisiert wird.
  Verwenden Sie dies, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehls-Hooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe Hooks-Dokumentation).

Unter [Hooks](/de/automation/hooks) finden Sie Einrichtung und Beispiele.

### Plugin-Hooks (Agenten- + Gateway-Lebenszyklus)

Diese laufen innerhalb der Agentenschleife oder der Gateway-Pipeline:

- **`before_model_resolve`**: läuft vor der Sitzung (ohne `messages`), um Provider/Modell vor der Modellauflösung deterministisch zu überschreiben.
- **`before_prompt_build`**: läuft nach dem Laden der Sitzung (mit `messages`), um vor dem Absenden des Prompts `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` einzubringen. Verwenden Sie `prependContext` für dynamischen Text pro Zug und die Systemkontext-Felder für stabile Hinweise, die im Bereich des System-Prompts liegen sollen.
- **`before_agent_start`**: Legacy-Kompatibilitäts-Hook, der in beiden Phasen laufen kann; bevorzugen Sie die expliziten Hooks oben.
- **`before_agent_reply`**: läuft nach Inline-Aktionen und vor dem LLM-Aufruf und erlaubt einem Plugin, den Zug zu übernehmen und eine synthetische Antwort zurückzugeben oder den Zug vollständig stummzuschalten.
- **`agent_end`**: prüft nach Abschluss die endgültige Nachrichtenliste und Laufmetadaten.
- **`before_compaction` / `after_compaction`**: beobachten oder annotieren Kompaktierungszyklen.
- **`before_tool_call` / `after_tool_call`**: fangen Tool-Parameter/-Ergebnisse ab.
- **`before_install`**: prüft integrierte Scan-Ergebnisse und kann Skills- oder Plugin-Installationen optional blockieren.
- **`tool_result_persist`**: transformiert Tool-Ergebnisse synchron, bevor sie in das Sitzungsprotokoll geschrieben werden.
- **`message_received` / `message_sending` / `message_sent`**: Hooks für eingehende und ausgehende Nachrichten.
- **`session_start` / `session_end`**: Grenzen des Sitzungslebenszyklus.
- **`gateway_start` / `gateway_stop`**: Lebenszyklusereignisse des Gateways.

Entscheidungsregeln für ausgehende/Tool-Schutzmechanismen:

- `before_tool_call`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_tool_call`: `{ block: false }` ist eine No-op und hebt eine frühere Blockierung nicht auf.
- `before_install`: `{ block: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `before_install`: `{ block: false }` ist eine No-op und hebt eine frühere Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist final und stoppt Handler mit niedrigerer Priorität.
- `message_sending`: `{ cancel: false }` ist eine No-op und hebt eine frühere Abbruchmarkierung nicht auf.

Unter [Plugin-Hooks](/de/plugins/architecture#provider-runtime-hooks) finden Sie die Hook-API und Registrierungsdetails.

## Streaming + partielle Antworten

- Assistenten-Deltas werden von pi-agent-core gestreamt und als `assistant`-Ereignisse ausgegeben.
- Block-Streaming kann partielle Antworten entweder bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Block-Antworten ausgegeben werden.
- Unter [Streaming](/de/concepts/streaming) finden Sie das Chunking- und Block-Antwortverhalten.

## Tool-Ausführung + Messaging-Tools

- Tool-Start-/Update-/Ende-Ereignisse werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor dem Protokollieren/Ausgeben hinsichtlich Größe und Bild-Payloads bereinigt.
- Messaging-Tool-Sendungen werden nachverfolgt, um doppelte Assistentenbestätigungen zu unterdrücken.

## Antwortformung + Unterdrückung

- Endgültige Payloads werden zusammengesetzt aus:
  - Assistententext (und optionalem Reasoning)
  - Inline-Tool-Zusammenfassungen (wenn verbose + erlaubt)
  - Assistenten-Fehlertext, wenn das Modell einen Fehler ausgibt
- Das exakte stille Token `NO_REPLY` / `no_reply` wird aus ausgehenden
  Payloads herausgefiltert.
- Duplikate von Messaging-Tools werden aus der endgültigen Payload-Liste entfernt.
- Wenn keine darstellbaren Payloads übrig bleiben und ein Tool einen Fehler ausgegeben hat, wird
  eine Fallback-Tool-Fehlerantwort ausgegeben
  (es sei denn, ein Messaging-Tool hat bereits eine für den Benutzer sichtbare Antwort gesendet).

## Kompaktierung + Wiederholungen

- Die automatische Kompaktierung gibt `compaction`-Stream-Ereignisse aus und kann eine Wiederholung auslösen.
- Bei einer Wiederholung werden In-Memory-Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden.
- Unter [Kompaktierung](/de/concepts/compaction) finden Sie die Kompaktierungspipeline.

## Ereignis-Streams (aktuell)

- `lifecycle`: ausgegeben von `subscribeEmbeddedPiSession` (und als Fallback von `agentCommand`)
- `assistant`: gestreamte Deltas von pi-agent-core
- `tool`: gestreamte Tool-Ereignisse von pi-agent-core

## Verarbeitung von Chat-Kanälen

- Assistenten-Deltas werden in Chat-`delta`-Nachrichten gepuffert.
- Ein Chat-`final` wird bei **Lebenszyklus-Ende/-Fehler** ausgegeben.

## Zeitlimits

- Standard für `agent.wait`: 30s (nur das Warten). Der Parameter `timeoutMs` überschreibt dies.
- Agentenlaufzeit: Standard für `agents.defaults.timeoutSeconds` ist 172800s (48 Stunden); durch den Abbruch-Timer in `runEmbeddedPiAgent` erzwungen.
- LLM-Leerlauf-Zeitlimit: `agents.defaults.llm.idleTimeoutSeconds` bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauffensters keine Antwort-Chunks eintreffen. Setzen Sie dies explizit für langsame lokale Modelle oder Reasoning-/Tool-Call-Provider; setzen Sie es auf 0, um es zu deaktivieren. Wenn es nicht gesetzt ist, verwendet OpenClaw `agents.defaults.timeoutSeconds`, falls konfiguriert, andernfalls 120s. Durch Cron ausgelöste Läufe ohne explizites LLM- oder Agenten-Zeitlimit deaktivieren den Leerlauf-Watchdog und verlassen sich auf das äußere Cron-Zeitlimit.

## Wo Dinge vorzeitig enden können

- Agenten-Zeitlimit (Abbruch)
- AbortSignal (Abbruch)
- Gateway-Trennung oder RPC-Zeitlimit
- `agent.wait`-Zeitlimit (nur Warten, stoppt den Agenten nicht)

## Verwandt

- [Tools](/de/tools) — verfügbare Agenten-Tools
- [Hooks](/de/automation/hooks) — ereignisgesteuerte Skripte, die durch Lebenszyklusereignisse des Agenten ausgelöst werden
- [Kompaktierung](/de/concepts/compaction) — wie lange Unterhaltungen zusammengefasst werden
- [Exec-Genehmigungen](/de/tools/exec-approvals) — Genehmigungsschranken für Shell-Befehle
- [Thinking](/de/tools/thinking) — Konfiguration der Thinking-/Reasoning-Stufe
