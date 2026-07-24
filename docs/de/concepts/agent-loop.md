---
read_when:
    - Sie benötigen eine genaue schrittweise Erläuterung der Agentenschleife oder der Lebenszyklusereignisse
    - Sie ändern die Sitzungswarteschlange, das Schreiben von Transkripten oder das Verhalten der Schreibsperre für Sitzungen
summary: Lebenszyklus der Agentenschleife, Streams und Wartesemantik
title: Agentenschleife
x-i18n:
    generated_at: "2026-07-24T04:21:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1d0102ffb6ebf572ea0201470db138775be33b0f0b655d9d08742177be5f3f31
    source_path: concepts/agent-loop.md
    workflow: 16
---

Die Agentenschleife ist der serialisierte, sitzungsspezifische Lauf, der eine Nachricht in
Aktionen und eine Antwort umwandelt: Entgegennahme, Kontextzusammenstellung, Modellinferenz, Werkzeugausführung,
Streaming, Persistenz.

## Einstiegspunkte

- Gateway-RPC: `agent` und `agent.wait`.
- CLI: `openclaw agent`.

## Ablauf eines Laufs

1. `agent`-RPC validiert Parameter, löst die Sitzung auf (`sessionKey`/`sessionId`), persistiert Sitzungsmetadaten und gibt sofort `{ runId, acceptedAt }` zurück.
2. `agentCommand` führt den Durchlauf aus: Es löst die Standardwerte für Modell sowie Denken/Ausführlichkeit/Tracing auf, lädt den Skills-Snapshot, ruft `runEmbeddedAgent` auf und gibt ersatzweise **Lebenszyklusende/-fehler** aus, falls die eingebettete Schleife dies nicht bereits getan hat.
3. `runEmbeddedAgent`: serialisiert Läufe über sitzungsspezifische und globale Warteschlangen, löst Modell und Authentifizierungsprofil auf, erstellt die OpenClaw-Sitzung, abonniert Laufzeitereignisse, streamt Assistenten-/Werkzeug-Deltas, erzwingt das Laufzeitlimit (mit Abbruch bei Überschreitung) und gibt Nutzdaten sowie Nutzungsmetadaten zurück. Bei Codex-App-Server-Durchläufen bricht es außerdem einen angenommenen Durchlauf ab, wenn dieser vor einem Abschlussereignis keine weiteren App-Server-Fortschritte mehr erzeugt.
4. `subscribeEmbeddedAgentSession` überführt Laufzeitereignisse in den `agent`-Stream: Werkzeugereignisse in `stream: "tool"`, Assistenten-Deltas in `stream: "assistant"`, Lebenszyklusereignisse in `stream: "lifecycle"` (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`) wartet auf **Lebenszyklusende/-fehler** auf einem `runId` und gibt `{ status: ok|error|timeout, startedAt, endedAt, error? }` zurück.

## Warteschlangen und Nebenläufigkeit

Läufe werden pro Sitzungsschlüssel (Sitzungsspur) und optional über eine globale Spur serialisiert, wodurch Konflikte zwischen Werkzeugen und Sitzungen verhindert werden. Nachrichtenkanäle wählen einen Warteschlangenmodus (steer/followup/collect/interrupt), der dieses Spuren-System speist; siehe [Befehlswarteschlange](/de/concepts/queue).

Das Schreiben von Transkripten wird zusätzlich durch eine Sitzungsschreibsperre für die Sitzungsdatei geschützt. Die Sperre ist prozessübergreifend und dateibasiert, sodass sie auch Schreibvorgänge erfasst, die die prozessinterne Warteschlange umgehen oder aus einem anderen Prozess stammen. Schreibende Prozesse warten standardmäßig bis zu 60 Sekunden (Umgebungsüberschreibung `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`), bevor sie die Sitzung als belegt melden.

Sitzungsschreibsperren sind standardmäßig nicht wiedereintrittsfähig. Eine Hilfsfunktion, die absichtlich den Erwerb derselben Sperre verschachtelt und dabei einen einzigen logischen Schreibvorgang beibehält, muss sich mit `allowReentrant: true` explizit dafür entscheiden.

## Vorbereitung von Sitzung und Arbeitsbereich

- Der Arbeitsbereich wird aufgelöst und erstellt; Sandbox-Läufe können auf ein Sandbox-Arbeitsbereich-Stammverzeichnis umgeleitet werden.
- Skills werden geladen (oder aus einem Snapshot wiederverwendet) und in die Umgebung sowie den Prompt eingefügt.
- Bootstrap-/Kontextdateien werden aufgelöst und in den System-Prompt eingefügt.
- Eine Sitzungsschreibsperre wird erworben und das Ziel des Sitzungstranskripts vorbereitet, bevor das Streaming beginnt. Jeder spätere Pfad zum Umschreiben, zur Compaction oder zur Kürzung des Transkripts muss dieselbe Sperre erwerben, bevor er die SQLite-Transkriptzeilen verändert.

## Prompt-Zusammenstellung

Der System-Prompt wird aus dem Basis-Prompt von OpenClaw, dem Skills-Prompt, dem Bootstrap-Kontext und laufbezogenen Überschreibungen erstellt. Modellspezifische Grenzen und für Compaction reservierte Tokens werden durchgesetzt. Unter [System-Prompt](/de/concepts/system-prompt) wird beschrieben, was das Modell sieht.

## Hooks

OpenClaw verfügt über zwei Hook-Systeme:

- **Interne Hooks** (Gateway-Hooks): ereignisgesteuerte Skripte für Befehle und Lebenszyklusereignisse.
- **Plugin-Hooks**: Erweiterungspunkte innerhalb des Agenten-/Werkzeuglebenszyklus und der Gateway-Pipeline.

### Interne Hooks (Gateway-Hooks)

- **`agent:bootstrap`**: wird beim Erstellen der Bootstrap-Dateien ausgeführt, bevor der System-Prompt finalisiert wird. Verwenden Sie ihn, um Bootstrap-Kontextdateien hinzuzufügen oder zu entfernen.
- **Befehlshooks**: `/new`, `/reset`, `/stop` und weitere Befehlsereignisse (siehe Hook-Dokumentation).

Einrichtung und Beispiele finden Sie unter [Hooks](/de/automation/hooks).

### Plugin-Hooks

Diese werden innerhalb der Agentenschleife oder der Gateway-Pipeline ausgeführt:

| Hook                                                    | Ausführung                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Vor der Sitzung (ohne `messages`), um Provider/Modell vor der Auflösung deterministisch zu überschreiben.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Nach dem Laden der Sitzung (mit `messages`), um vor der Übergabe `prependContext`, `systemPrompt`, `prependSystemContext` oder `appendSystemContext` einzufügen. Verwenden Sie `prependContext` für dynamischen Text pro Durchlauf und die Systemkontextfelder für stabile Anweisungen, die in den System-Prompt gehören. |
| `before_agent_reply`                                    | Nach Inline-Aktionen, vor dem LLM-Aufruf. Ermöglicht einem Plugin, den Durchlauf zu übernehmen und eine synthetische Antwort zurückzugeben oder ihn vollständig stummzuschalten.                                                                                                                                                                |
| `agent_end`                                             | Nach Abschluss, mit der endgültigen Nachrichtenliste und den Laufmetadaten.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Beobachtet oder annotiert Compaction-Zyklen.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Fängt Werkzeugparameter/-ergebnisse ab.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Nachdem die Installationsrichtlinie des Betreibers ausgeführt wurde, für bereitgestelltes Skills-/Plugin-Installationsmaterial, wenn Plugin-Hooks im aktuellen Prozess geladen sind.                                                                                                                                                           |
| `tool_result_persist`                                   | Transformiert Werkzeugergebnisse synchron, bevor sie in ein OpenClaw-eigenes Sitzungstranskript geschrieben werden.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Hooks für ein- und ausgehende Nachrichten.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Grenzen des Sitzungslebenszyklus.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Gateway-Lebenszyklusereignisse.                                                                                                                                                                                                                                                                   |

Entscheidungsregeln für Hooks bei Schutzmechanismen für ausgehende Nachrichten/Werkzeuge:

- `before_tool_call`: `{ block: true }` ist abschließend und stoppt Handler mit niedrigerer Priorität. `{ block: false }` hat keine Wirkung und hebt eine vorherige Blockierung nicht auf.
- `before_install`: dieselbe abschließende/wirkungslos-Semantik wie oben. Verwenden Sie `security.installPolicy` statt `before_install` für betreibergesteuerte Entscheidungen zum Zulassen/Blockieren von Installationen, die CLI-Installations- und Aktualisierungspfade abdecken müssen.
- `message_sending`: `{ cancel: true }` ist abschließend und stoppt Handler mit niedrigerer Priorität. `{ cancel: false }` hat keine Wirkung und hebt einen vorherigen Abbruch nicht auf.

Die Hook-API und Registrierungsdetails finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

Testumgebungen können diese Hooks anpassen. Die Codex-App-Server-Testumgebung behält OpenClaw-Plugin-Hooks als Kompatibilitätsvertrag für dokumentierte gespiegelte Oberflächen bei; native Codex-Hooks sind ein separater, systemnaher Codex-Mechanismus.

## Streaming

- Assistenten-Deltas werden von der Agentenlaufzeit als `assistant`-Ereignisse gestreamt.
- Block-Streaming kann Teilantworten bei `text_end` oder `message_end` ausgeben.
- Reasoning-Streaming kann als separater Stream oder als Blockantworten erfolgen.
- Informationen zu Aufteilung und Blockantwortverhalten finden Sie unter [Streaming](/de/concepts/streaming).

## Werkzeugausführung

- Ereignisse für Start/Aktualisierung/Ende eines Werkzeugs werden im `tool`-Stream ausgegeben.
- Werkzeugergebnisse werden vor der Protokollierung/Ausgabe hinsichtlich Größe und Bildnutzdaten bereinigt.
- Sendevorgänge von Nachrichtenwerkzeugen werden nachverfolgt, um doppelte Bestätigungen des Assistenten zu unterdrücken.

## Antwortgestaltung

Endgültige Nutzdaten werden aus Assistententext (zuzüglich optionalem Reasoning), Inline-Werkzeugzusammenfassungen (wenn ausführlich und zulässig) und Assistentenfehlertext bei Modellfehlern zusammengestellt.

- Das exakte Stummschaltungs-Token `NO_REPLY` wird aus ausgehenden Nutzdaten herausgefiltert.
- Duplikate von Nachrichtenwerkzeugen werden aus der endgültigen Nutzdatenliste entfernt.
- Wenn keine darstellbaren Nutzdaten verbleiben und bei einem Werkzeug ein Fehler aufgetreten ist, wird ersatzweise eine Werkzeugfehlerantwort ausgegeben, sofern nicht bereits ein Nachrichtenwerkzeug eine für den Benutzer sichtbare Antwort gesendet hat.

## Compaction und Wiederholungsversuche

Die automatische Compaction gibt `compaction`-Stream-Ereignisse aus und kann einen Wiederholungsversuch auslösen. Bei einem Wiederholungsversuch werden speicherinterne Puffer und Werkzeugzusammenfassungen zurückgesetzt, um doppelte Ausgaben zu vermeiden. Siehe [Compaction](/de/concepts/compaction).

## Ereignis-Streams

- `lifecycle`: wird von `subscribeEmbeddedAgentSession` ausgegeben (und ersatzweise von `agentCommand`).
- `assistant`: gestreamte Deltas aus der Agentenlaufzeit.
- `tool`: gestreamte Werkzeugereignisse aus der Agentenlaufzeit.

Das Gateway projiziert Lebenszyklusereignisse sowie Start-/Abschlussereignisse von Werkzeugen in das begrenzte,
rein metadatenbasierte [Audit-Protokoll](/de/cli/audit). Diese Projektion zeichnet Herkunft und
Ergebniscodes auf, ohne Prompts, Nachrichten, Werkzeugargumente, Werkzeugergebnisse
oder Rohfehler aus dem Transkript-/Laufzeitpfad zu kopieren.

## Verarbeitung im Chatkanal

Assistenten-Deltas werden in Chat-`delta`-Nachrichten gepuffert. Bei **Lebenszyklusende/-fehler** wird ein Chat-`final` ausgegeben.

## Zeitlimits

| Zeitüberschreitung                                | Standardwert                            | Hinweise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Nur Warten; der Parameter `timeoutMs` überschreibt diesen Wert. Stoppt den zugrunde liegenden Lauf nicht.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Agent-Laufzeit (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | Wird durch den Abbruch-Timer von `runEmbeddedAgent` durchgesetzt. Setzen Sie `0` für ein unbegrenztes Laufbudget; die Aktivitätswächter für den Modellstream gelten weiterhin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| CLI-Backend-Wächter bei ausbleibender Ausgabe    | wird für jeden neuen/fortgesetzten CLI-Lauf berechnet | Ist von der Agent-Laufzeit getrennt und gehört zum registrierten Backend-Plugin. Eine CLI-interne Hintergrundaufgabe verwendet denselben übergeordneten Unterprozess und besteht nicht über eine allgemeine Agent-Zeitüberschreitung hinaus fort.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Isolierter Agent-Durchlauf von Cron               | wird von Cron verwaltet                 | Der Scheduler startet bei Ausführungsbeginn einen eigenen Timer, bricht den Lauf zum konfigurierten Ablaufzeitpunkt ab und führt anschließend eine zeitlich begrenzte Bereinigung durch, bevor die Zeitüberschreitung aufgezeichnet wird, damit eine veraltete untergeordnete Sitzung die Ausführungsspur nicht blockiert halten kann.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Modell-Leerlaufzeitüberschreitung                 | Cloud 120s; selbst gehostet 300s        | OpenClaw bricht eine Modellanfrage ab, wenn vor Ablauf des Leerlauffensters keine Antwortblöcke eintreffen. `models.providers.<id>.timeoutSeconds` verlängert diesen Leerlaufwächter für langsame lokale/selbst gehostete Provider, bleibt jedoch durch einen niedrigeren endlichen Wert von `agents.defaults.timeoutSeconds` oder eine laufspezifische Zeitüberschreitung begrenzt, da diese den gesamten Agent-Lauf steuern. Auch bei unbegrenzten Laufbudgets bleibt der Leerlaufwächter der Provider-Klasse aktiv. Durch Cron ausgelöste Cloud-Modellläufe ohne explizite Modell-/Agent-Zeitüberschreitung verwenden denselben Standardwert; bei einer expliziten Cron-Laufzeitüberschreitung werden Aussetzer des Cloud-Modellstreams auf 60s begrenzt, damit konfigurierte Modell-Fallbacks noch vor dem äußeren Cron-Ablaufzeitpunkt ausgeführt werden können. Durch Cron ausgelöste Läufe auf tatsächlich lokalen Endpunkten (Loopback/private baseUrl) behalten die lokale Leerlauf-Ausnahme bei; selbst gehostete Provider mit Netzwerk-baseUrls erhalten den impliziten 300s-Wächter. Bei einer expliziten Cron-Laufzeitüberschreitung werden lokale/selbst gehostete Aussetzer auf diese Zeitüberschreitung begrenzt. Setzen Sie `models.providers.<id>.timeoutSeconds` für langsame lokale Provider. |
| Zeitüberschreitung für Provider-HTTP-Anfragen    | `models.providers.<id>.timeoutSeconds` | Deckt Verbindungsaufbau, Header, Body, die SDK-Anfragezeitüberschreitung, die Abbruchbehandlung von guarded-fetch und den Leerlaufwächter des Modellstreams für diesen Provider ab. Verwenden Sie dies für langsame lokale/selbst gehostete Provider (beispielsweise Ollama), bevor Sie die Zeitüberschreitung der gesamten Agent-Laufzeit erhöhen; halten Sie die Agent-/Laufzeitüberschreitung mindestens ebenso hoch, wenn die Modellanfrage länger ausgeführt werden muss.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Diagnose blockierter Sitzungen

Wenn die Diagnose aktiviert ist, klassifiziert ein integrierter Schwellenwert von zwei Minuten lange `processing`-Sitzungen, bei denen keine Antwort und kein Fortschritt bei Tools, Status, Blöcken oder ACP beobachtet wurde:

- Aktive eingebettete Läufe, Modellaufrufe und Tool-Aufrufe werden als `session.long_running` gemeldet. Zugeordnete stille Modellaufrufe bleiben bis zum Abbruchschwellenwert `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als blockiert gekennzeichnet werden.
- Aktive Arbeit ohne kürzlichen Fortschritt wird als `session.stalled` gemeldet. Zugeordnete Modellaufrufe wechseln bei oder nach Erreichen des Abbruchschwellenwerts zu `session.stalled`; veraltete Modell-/Tool-Aktivität ohne Besitzer wird nicht als lang andauernde Aktivität verborgen.
- `session.stuck` ist für wiederherstellbare veraltete Sitzungsverwaltungsdaten reserviert, einschließlich inaktiver Sitzungen in der Warteschlange mit veralteter Modell-/Tool-Aktivität ohne Besitzer.

Der Abbruchschwellenwert beträgt mindestens 5 Minuten und das Dreifache des Warnschwellenwerts. Die Bereinigung veralteter Sitzungsverwaltungsdaten gibt die betroffene Sitzungsspur unmittelbar frei, nachdem die Wiederherstellungsprüfungen bestanden wurden; blockierte eingebettete Läufe werden erst nach dem Abbruchschwellenwert abgebrochen und vollständig beendet, sodass die Arbeit in der Warteschlange fortgesetzt wird, ohne lediglich langsame Läufe vorzeitig zu beenden. Die Wiederherstellung gibt strukturierte Ergebnisse für Anforderung und Abschluss aus; der Diagnosestatus wird nur dann als inaktiv markiert, wenn dieselbe Verarbeitungsgeneration noch aktuell ist, und wiederholte `session.stuck`-Diagnosen werden zunehmend verzögert, solange die Sitzung unverändert bleibt.

## Situationen, in denen Vorgänge vorzeitig enden können

- Agent-Zeitüberschreitung (Abbruch)
- AbortSignal (Abbruch)
- Gateway-Verbindungstrennung oder RPC-Zeitüberschreitung
- Zeitüberschreitung von `agent.wait` (nur Warten, stoppt den Agent nicht)

## Verwandte Themen

- [Tools](/de/tools) – verfügbare Agent-Tools
- [Hooks](/de/automation/hooks) – ereignisgesteuerte Skripte, die durch Ereignisse im Agent-Lebenszyklus ausgelöst werden
- [Compaction](/de/concepts/compaction) – wie lange Unterhaltungen zusammengefasst werden
- [Ausführungsgenehmigungen](/de/tools/exec-approvals) – Genehmigungsschranken für Shell-Befehle
- [Denken](/de/tools/thinking) – Konfiguration der Denk-/Schlussfolgerungsebene
