---
read_when:
    - Sie benötigen eine genaue Schritt-für-Schritt-Erklärung des Agenten-Loops oder der Lebenszyklusereignisse.
    - Sie ändern das Einreihen von Sitzungen in die Warteschlange, das Schreiben von Transkripten oder das Verhalten der Schreibsperre für Sitzungen
summary: Lebenszyklus der Agentenschleife, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-07-12T15:16:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

Die Agentenschleife ist der serialisierte, sitzungsbezogene Durchlauf, der eine Nachricht in Aktionen und eine Antwort umwandelt: Entgegennahme, Zusammenstellung des Kontexts, Modellinferenz, Tool-Ausführung, Streaming, Persistenz.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: `openclaw agent`.

## Ablauf eines Durchlaufs

1. Der `agent`-RPC validiert Parameter, löst die Sitzung auf (`sessionKey`/`sessionId`), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Durchlauf aus: Es löst die Standardwerte für Modell sowie Denk-, Ausführlichkeits- und Trace-Einstellungen auf, lädt den Skills-Snapshot, ruft `runEmbeddedAgent` auf und gibt ersatzweise ein **Lebenszyklusende/einen Lebenszyklusfehler** aus, falls die eingebettete Schleife dies nicht bereits getan hat.
3. `runEmbeddedAgent`: serialisiert Durchläufe über sitzungsbezogene und globale Warteschlangen, löst Modell und Authentifizierungsprofil auf, erstellt die OpenClaw-Sitzung, abonniert Laufzeitereignisse, streamt Assistenten-/Tool-Deltas, erzwingt das Zeitlimit des Durchlaufs (mit Abbruch bei Ablauf) und gibt Nutzdaten sowie Nutzungsmetadaten zurück. Bei Durchläufen des Codex-App-Servers bricht es außerdem einen angenommenen Durchlauf ab, wenn vor einem Abschlussereignis kein Fortschritt des App-Servers mehr erfolgt.
4. `subscribeEmbeddedAgentSession` überträgt Laufzeitereignisse in den `agent`-Stream: Tool-Ereignisse nach `stream: "tool"`, Assistenten-Deltas nach `stream: "assistant"` und Lebenszyklusereignisse nach `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) wartet für eine `runId` auf **Lebenszyklusende/-fehler** und gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück.

## Warteschlangen und Nebenläufigkeit

Durchläufe werden pro Sitzungsschlüssel (Sitzungsspur) und optional über eine globale Spur serialisiert, wodurch Konflikte zwischen Tools und Sitzungen verhindert werden. Nachrichtenkanäle wählen einen Warteschlangenmodus (steer/followup/collect/interrupt), der dieses Spuren-System speist; siehe [Befehlswarteschlange](/de/concepts/queue).

Schreibvorgänge am Transkript werden zusätzlich durch eine Schreibsperre für die Sitzungsdatei geschützt. Die Sperre ist prozessbezogen und dateibasiert, sodass sie Schreibprozesse erfasst, die die prozessinterne Warteschlange umgehen oder aus einem anderen Prozess stammen. Schreibprozesse warten bis zu `session.writeLock.acquireTimeoutMs` (Standardwert `60000` ms; Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`), bevor sie die Sitzung als beschäftigt melden.

Sitzungsschreibsperren sind standardmäßig nicht wiedereintrittsfähig. Eine Hilfsfunktion, die absichtlich den Erwerb derselben Sperre verschachtelt und dabei einen einzigen logischen Schreibprozess beibehält, muss dies mit `allowReentrant: true` aktivieren.

## Vorbereitung von Sitzung und Arbeitsbereich

- Der Arbeitsbereich wird aufgelöst und erstellt; isolierte Durchläufe können zu einem Stammverzeichnis eines isolierten Arbeitsbereichs umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in die Umgebung sowie den Prompt eingefügt.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt eingefügt.
- Eine Sitzungsschreibsperre wird erworben und das Ziel des Sitzungstranskripts wird vorbereitet, bevor das Streaming beginnt. Jeder spätere Pfad zum Umschreiben, zur Compaction oder zum Kürzen des Transkripts muss dieselbe Sperre erwerben, bevor er die SQLite-Transkriptzeilen verändert.

## Zusammenstellung des Prompts

Der System-Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und durchlaufspezifischen Überschreibungen erstellt. Modellspezifische Grenzen und reservierte Token für die Compaction werden durchgesetzt. Unter [System-Prompt](/de/concepts/system-prompt) erfahren Sie, was das Modell sieht.

## Hooks

OpenClaw verfügt über zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Tool-Lebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: Wird beim Erstellen der Bootstrap-Dateien ausgeführt, bevor der System-Prompt fertiggestellt wird. Verwenden Sie diesen Hook, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehlshooks**: `/new`, `/reset`, `/stop` und andere Befehlsereignisse (siehe die Dokumentation zu Hooks).

Einrichtung und Beispiele finden Sie unter [Hooks](/de/automation/hooks).

### Plugin-Hooks

Diese werden innerhalb der Agentenschleife oder der Gateway-Pipeline ausgeführt:

| Hook                                                    | Ausführung                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Vor der Sitzung (keine `messages`), um Provider/Modell vor der Auflösung deterministisch zu überschreiben.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Nach dem Laden der Sitzung (mit `messages`), um vor der Übermittlung `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` einzufügen. Verwenden Sie `prependContext` für dynamischen Text pro Durchlauf und die Systemkontextfelder für stabile Anweisungen, die in den System-Prompt gehören. |
| `before_agent_start`                                    | Legacy-Kompatibilitätshook, der in beiden Phasen ausgeführt werden kann; bevorzugen Sie die oben genannten expliziten Hooks.                                                                                                                                                                                                    |
| `before_agent_reply`                                    | Nach Inline-Aktionen und vor dem LLM-Aufruf. Ermöglicht einem Plugin, den Durchlauf zu übernehmen und eine synthetische Antwort zurückzugeben oder ihn vollständig stummzuschalten.                                                                                                                                                                |
| `agent_end`                                             | Nach Abschluss, mit der endgültigen Nachrichtenliste und den Metadaten des Durchlaufs.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Beobachtet oder annotiert Compaction-Zyklen.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Fängt Tool-Parameter/-Ergebnisse ab.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Nach der Ausführung der Installationsrichtlinie des Betreibers für bereitgestelltes Installationsmaterial von Skills/Plugins, wenn Plugin-Hooks im aktuellen Prozess geladen sind.                                                                                                                                                           |
| `tool_result_persist`                                   | Transformiert Tool-Ergebnisse synchron, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Hooks für eingehende und ausgehende Nachrichten.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Grenzen des Sitzungslebenszyklus.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Gateway-Lebenszyklusereignisse.                                                                                                                                                                                                                                                                   |

Entscheidungsregeln für Hooks zum Schutz ausgehender Nachrichten und Tools:

- `before_tool_call`: `{ block: true }` ist abschließend und beendet Handler mit niedrigerer Priorität. `{ block: false }` hat keine Wirkung und hebt eine vorherige Blockierung nicht auf.
- `before_install`: Dieselbe abschließende/wirkunglose Semantik wie oben. Verwenden Sie `security.installPolicy` und nicht `before_install` für betreibergesteuerte Entscheidungen zum Zulassen/Blockieren von Installationen, die CLI-Installations- und Aktualisierungspfade abdecken müssen.
- `message_sending`: `{ cancel: true }` ist abschließend und beendet Handler mit niedrigerer Priorität. `{ cancel: false }` hat keine Wirkung und hebt einen vorherigen Abbruch nicht auf.

Informationen zur Hook-API und zur Registrierung finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

Testumgebungen können diese Hooks anpassen. Die Testumgebung des Codex-App-Servers behält OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte Oberflächen bei; native Codex-Hooks sind ein separater, technisch tiefer liegender Codex-Mechanismus.

## Streaming

- Assistenten-Deltas werden von der Agentenlaufzeit als `assistant`-Ereignisse gestreamt.
- Block-Streaming kann bei `text_end` oder `message_end` Teilantworten ausgeben.
- Das Streaming von Schlussfolgerungen kann als separater Stream erfolgen oder Antworten blockieren.
- Informationen zur Aufteilung und zum Verhalten von Blockantworten finden Sie unter [Streaming](/de/concepts/streaming).

## Tool-Ausführung

- Ereignisse für Start/Aktualisierung/Ende eines Tools werden im `tool`-Stream ausgegeben.
- Tool-Ergebnisse werden vor der Protokollierung/Ausgabe hinsichtlich Größe und Bildnutzdaten bereinigt.
- Sendevorgänge von Nachrichtentools werden verfolgt, um doppelte Bestätigungen des Assistenten zu unterdrücken.

## Gestaltung der Antwort

Die endgültigen Nutzdaten werden aus dem Assistententext (zuzüglich optionaler Schlussfolgerung), Inline-Tool-Zusammenfassungen (wenn ausführlich und zulässig) und dem Assistentenfehlertext bei Modellfehlern zusammengestellt.

- Das exakte Stumm-Token `NO_REPLY` wird aus ausgehenden Nutzdaten herausgefiltert.
- Duplikate von Nachrichtentools werden aus der endgültigen Nutzdatenliste entfernt.
- Wenn keine darstellbaren Nutzdaten verbleiben und bei einem Tool ein Fehler aufgetreten ist, wird ersatzweise eine Tool-Fehlerantwort ausgegeben, sofern nicht bereits ein Nachrichtentool eine für Benutzer sichtbare Antwort gesendet hat.

## Compaction und Wiederholungsversuche

Die automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann einen Wiederholungsversuch auslösen. Bei einem Wiederholungsversuch werden speicherinterne Puffer und Tool-Zusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden. Siehe [Compaction](/de/concepts/compaction).

## Ereignisstreams

- `lifecycle`: wird von `subscribeEmbeddedAgentSession` ausgegeben (und ersatzweise von `agentCommand`).
- `assistant`: gestreamte Deltas aus der Agentenlaufzeit.
- `tool`: gestreamte Tool-Ereignisse aus der Agentenlaufzeit.

Das Gateway projiziert Lebenszyklusereignisse sowie Start-/Abschlussereignisse von Tools in das begrenzte,
ausschließlich Metadaten enthaltende [Audit-Protokoll](/de/cli/audit). Diese Projektion zeichnet Herkunft und
Ergebniscodes auf, ohne Prompts, Nachrichten, Tool-Argumente, Tool-Ergebnisse
oder Rohfehler aus dem Transkript-/Laufzeitpfad zu kopieren.

## Verarbeitung von Chatkanälen

Assistenten-Deltas werden in `delta`-Chatnachrichten gepuffert. Bei **Lebenszyklusende/-fehler** wird eine `final`-Chatnachricht ausgegeben.

## Zeitlimits

| Zeitüberschreitung                               | Standardwert                           | Hinweise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Nur Warten; der Parameter `timeoutMs` überschreibt den Wert. Stoppt den zugrunde liegenden Lauf nicht.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Agent-Laufzeit (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Wird durch den Abbruch-Timer von `runEmbeddedAgent` erzwungen. Setzen Sie den Wert für ein unbegrenztes Laufzeitbudget auf `0`; Watchdogs für die Aktivität des Modellstreams gelten weiterhin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Isolierter Agent-Turn von Cron                   | von Cron verwaltet                     | Der Scheduler startet bei Ausführungsbeginn einen eigenen Timer, bricht den Lauf zur konfigurierten Frist ab und führt anschließend eine zeitlich begrenzte Bereinigung durch, bevor die Zeitüberschreitung erfasst wird, damit eine veraltete untergeordnete Sitzung die Lane nicht blockiert hält.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Modell-Inaktivitätszeitüberschreitung            | Cloud 120s; selbst gehostet 300s       | OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Inaktivitätsfensters keine Antwort-Chunks eintreffen. `models.providers.<id>.timeoutSeconds` verlängert diesen Inaktivitäts-Watchdog für langsame lokale/selbst gehostete Provider, bleibt jedoch durch einen niedrigeren endlichen Wert von `agents.defaults.timeoutSeconds` oder eine laufspezifische Zeitüberschreitung begrenzt, da diese den gesamten Agent-Lauf steuern. Bei unbegrenzten Laufzeitbudgets bleibt der für die Provider-Klasse geltende Inaktivitäts-Watchdog weiterhin aktiv. Durch Cron ausgelöste Cloud-Modellläufe ohne explizite Modell-/Agent-Zeitüberschreitung verwenden denselben Standardwert; bei einer expliziten Cron-Laufzeitüberschreitung werden Stillstände des Cloud-Modellstreams auf 60s begrenzt, damit konfigurierte Modell-Fallbacks noch vor der äußeren Cron-Frist ausgeführt werden können. Durch Cron ausgelöste Läufe auf tatsächlich lokalen Endpunkten (Loopback/private baseUrl) behalten die lokale Inaktivitäts-Deaktivierung bei; selbst gehostete Provider mit Netzwerk-baseUrls erhalten den impliziten Watchdog von 300s. Bei einer expliziten Cron-Laufzeitüberschreitung werden lokale/selbst gehostete Stillstände auf diese Zeitüberschreitung begrenzt. Legen Sie `models.providers.<id>.timeoutSeconds` für langsame lokale Provider fest. |
| HTTP-Anfragezeitüberschreitung des Providers     | `models.providers.<id>.timeoutSeconds` | Deckt Verbindungsaufbau, Header, Body, SDK-Anfragezeitüberschreitung, Abbruchbehandlung von guarded-fetch und den Inaktivitäts-Watchdog des Modellstreams für diesen Provider ab. Verwenden Sie diese Einstellung für langsame lokale/selbst gehostete Provider (beispielsweise Ollama), bevor Sie die Zeitüberschreitung für die gesamte Agent-Laufzeit erhöhen; halten Sie die Agent-/Laufzeitüberschreitung mindestens ebenso hoch, wenn die Modellanfrage länger ausgeführt werden muss.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Diagnose blockierter Sitzungen

Wenn die Diagnose aktiviert ist, klassifiziert `diagnostics.stuckSessionWarnMs` (Standardwert `120000` ms) lang andauernde `processing`-Sitzungen ohne beobachteten Fortschritt durch Antwort, Tool, Status, Block oder ACP:

- Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet. Verwaltete stille Modellaufrufe bleiben bis `diagnostics.stuckSessionAbortMs` im Zustand `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als stillstehend gekennzeichnet werden.
- Aktive Arbeit ohne kürzlichen Fortschritt wird als `session.stalled` gemeldet. Verwaltete Modellaufrufe wechseln beim oder nach dem Abbruchschwellenwert zu `session.stalled`; veraltete Modell-/Tool-Aktivität ohne Besitzer wird nicht als lang andauernd verborgen.
- `session.stuck` ist für wiederherstellbare veraltete Sitzungsbuchführung reserviert, einschließlich inaktiver Sitzungen in der Warteschlange mit veralteter Modell-/Tool-Aktivität ohne Besitzer.

`diagnostics.stuckSessionAbortMs` beträgt standardmäßig mindestens 5 Minuten und das Dreifache des Warnschwellenwerts. Die Bereinigung veralteter Sitzungsbuchführung gibt die betroffene Sitzungs-Lane unmittelbar frei, nachdem die Wiederherstellungsprüfungen erfolgreich waren; stillstehende eingebettete Läufe werden erst nach dem Abbruchschwellenwert abgebrochen und vollständig abgearbeitet, sodass Arbeit in der Warteschlange fortgesetzt wird, ohne lediglich langsame Läufe vorzeitig zu beenden. Die Wiederherstellung gibt strukturierte Ergebnisse für Anforderung und Abschluss aus; der Diagnosestatus wird nur dann als inaktiv markiert, wenn dieselbe Verarbeitungsgeneration noch aktuell ist, und wiederholte `session.stuck`-Diagnosen werden zunehmend verzögert, solange die Sitzung unverändert bleibt.

## Mögliche Gründe für eine vorzeitige Beendigung

- Agent-Zeitüberschreitung (Abbruch)
- AbortSignal (Abbruch)
- Gateway-Verbindungsabbruch oder RPC-Zeitüberschreitung
- Zeitüberschreitung von `agent.wait` (nur Warten, stoppt den Agent nicht)

## Verwandte Themen

- [Tools](/de/tools) - verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) - ereignisgesteuerte Skripte, die durch Agent-Lebenszyklusereignisse ausgelöst werden
- [Compaction](/de/concepts/compaction) - wie lange Unterhaltungen zusammengefasst werden
- [Ausführungsgenehmigungen](/de/tools/exec-approvals) - Genehmigungsschranken für Shell-Befehle
- [Denken](/de/tools/thinking) - Konfiguration der Denk-/Schlussfolgerungstiefe
