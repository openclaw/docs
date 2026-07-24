---
read_when:
    - Ausführung oder Parallelität automatischer Antworten ändern
    - Erläuterung der `/queue`-Modi oder des Verhaltens bei der Nachrichtensteuerung
summary: Modi für die Warteschlange automatischer Antworten, Standardwerte und sitzungsspezifische Überschreibungen
title: Befehlswarteschlange
x-i18n:
    generated_at: "2026-07-24T05:01:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 69b40f67146226b0315492b27fc9d2218cace8bbd1eaff6514f7efb33b69d763
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serialisiert eingehende automatische Antwortläufe (alle Kanäle) über eine kleine prozessinterne Warteschlange, um Kollisionen zwischen mehreren Agent-Läufen zu verhindern und zugleich sichere Parallelität über Sitzungen hinweg zu ermöglichen.

## Warum

- Automatische Antwortläufe können aufwendig sein (LLM-Aufrufe) und kollidieren, wenn mehrere eingehende Nachrichten kurz nacheinander eintreffen.
- Die Serialisierung verhindert Konkurrenz um gemeinsam genutzte Ressourcen (Sitzungsdateien, Protokolle, CLI-Standardeingabe) und verringert die Wahrscheinlichkeit vorgelagerter Ratenbegrenzungen.

## Funktionsweise

- Eine Lane-spezifische FIFO-Warteschlange arbeitet jede Lane mit einer konfigurierbaren Parallelitätsobergrenze ab (standardmäßig 1 für nicht konfigurierte Lanes; `main` verwendet standardmäßig 4, `subagent` 8).
- `runEmbeddedAgent` reiht nach **Sitzungsschlüssel** (Lane `session:<key>`) ein, um zu gewährleisten, dass pro Sitzung nur ein Lauf aktiv ist.
- Anschließend wird jeder Sitzungslauf in eine **globale Lane** (standardmäßig `main`) eingereiht, sodass die Gesamtparallelität durch `agents.defaults.maxConcurrent` begrenzt wird.
- Wenn die ausführliche Protokollierung aktiviert ist, geben eingereihte Läufe einen kurzen Hinweis aus, falls sie vor dem Start länger als ~2s gewartet haben.
- Tippindikatoren werden weiterhin sofort beim Einreihen ausgelöst (sofern vom Kanal unterstützt), sodass die Benutzererfahrung unverändert bleibt, während der Lauf wartet, bis er an der Reihe ist.

## Standardwerte

Wenn nicht festgelegt, verwenden alle Oberflächen eingehender Kanäle:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Steuerung innerhalb desselben Turns ist die Standardeinstellung. Ein Prompt, der während eines Laufs eintrifft, wird in die aktive Runtime eingespeist, wenn der Lauf Steuerung akzeptieren kann, sodass kein zweiter Sitzungslauf gestartet wird. Wenn der aktive Lauf keine Steuerung akzeptieren kann, wartet OpenClaw bis zu dessen Abschluss, bevor der Prompt gestartet wird.

## Warteschlangenmodi

`/queue` steuert, wie sich normale eingehende Nachrichten verhalten, während für eine Sitzung bereits ein Lauf aktiv ist:

- `steer`: Nachrichten in die aktive Runtime einspeisen. OpenClaw übermittelt alle ausstehenden Steuerungsnachrichten **nachdem der aktuelle Assistenten-Turn die Ausführung seiner Tool-Aufrufe abgeschlossen hat**, vor dem nächsten LLM-Aufruf; der Codex-App-Server erhält einen gebündelten `turn/steer`. Wenn der Lauf nicht aktiv streamt oder keine Steuerung verfügbar ist, wartet OpenClaw bis zum Ende des aktiven Laufs, bevor der Prompt gestartet wird.
- `followup`: Nicht steuern. Jede Nachricht für einen späteren Agent-Turn nach dem Ende des aktuellen Laufs einreihen.
- `collect`: Nicht steuern. Eingereihte Nachrichten nach dem Ruhefenster zu einem **einzelnen** Folge-Turn zusammenfassen. Wenn Nachrichten an unterschiedliche Kanäle/Threads gerichtet sind, werden sie einzeln abgearbeitet, um das Routing beizubehalten.
- `interrupt`: Den aktiven Lauf dieser Sitzung abbrechen und anschließend die neueste Nachricht ausführen.

Laufzeitspezifische Zeitabläufe und Abhängigkeitsverhalten finden Sie unter [Steuerungswarteschlange](/de/concepts/queue-steering). Informationen zum expliziten Befehl `/steer <message>` finden Sie unter [Steuern](/de/tools/steer).

Globale oder kanalspezifische Konfiguration über `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Warteschlangenoptionen

Optionen gelten für die eingereihte Zustellung. `debounceMs` legt im Modus `steer` auch das Codex-Ruhefenster für die Steuerung fest:

- `debounceMs`: Ruhefenster vor dem Abarbeiten eingereihter Folge-Turns oder Sammelstapel; im Codex-Modus `steer` das Ruhefenster vor dem Senden gebündelter `turn/steer`. Zahlen ohne Einheit werden als Millisekunden interpretiert; die Einheiten `ms`, `s`, `m`, `h` und `d` werden von `/queue`-Optionen akzeptiert.
- `cap`: Maximale Anzahl eingereihter Nachrichten pro Sitzung. Werte unter `1` werden ignoriert.
- `drop: "summarize"` (Standard): Bei Bedarf die ältesten eingereihten Einträge verwerfen, kompakte Zusammenfassungen beibehalten und diese als synthetischen Folge-Prompt einspeisen.
- `drop: "old"`: Bei Bedarf die ältesten eingereihten Einträge verwerfen, ohne Zusammenfassungen beizubehalten.
- `drop: "new"`: Die neueste Nachricht ablehnen, wenn die Warteschlange bereits voll ist.

Standardwerte: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Steuerung und Streaming

Wenn das Kanal-Streaming `partial` oder `block` ist, kann die Steuerung wie mehrere kurze sichtbare Antworten wirken, während der aktive Lauf Runtime-Grenzen erreicht:

- `partial`: Die Vorschau kann vorzeitig abgeschlossen werden; nach Annahme der Steuerung beginnt dann eine neue Vorschau.
- `block`: Blöcke in Entwurfsgröße können denselben sequenziellen Eindruck erzeugen.
- Ohne Streaming fällt die Steuerung auf einen Folge-Turn nach dem aktiven Lauf zurück, wenn die Runtime keine Steuerung innerhalb desselben Turns akzeptieren kann.

`steer` bricht laufende Tools nicht ab. Verwenden Sie `/queue interrupt`, wenn die neueste Nachricht den aktuellen Lauf abbrechen soll.

## Rangfolge

Für die Modusauswahl löst OpenClaw die Einstellungen in folgender Reihenfolge auf:

1. Inline oder gespeicherte sitzungsspezifische Außerkraftsetzung durch `/queue`.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standardwert `steer`.

Bei Optionen haben inline angegebene oder gespeicherte `/queue`-Optionen Vorrang vor der Konfiguration. Danach werden in dieser Reihenfolge die kanalspezifische Entprellung (`messages.queue.debounceMsByChannel`), die Entprellungsstandardwerte des Plugins, die globalen `messages.queue`-Optionen und die integrierten Standardwerte angewendet. `cap` und `drop` sind globale beziehungsweise sitzungsspezifische Optionen und keine kanalspezifischen Konfigurationsschlüssel.

## Sitzungsspezifische Außerkraftsetzungen

- Senden Sie `/queue <steer|followup|collect|interrupt>` als eigenständigen Befehl, um den Warteschlangenmodus für die aktuelle Sitzung zu speichern.
- Optionen können kombiniert werden: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` oder `/queue reset` löscht die Außerkraftsetzung der Sitzung.

## Abbruch eingereihter Turns

Während sich ein Prompt in der Folge-/Sammelwarteschlange befindet (beispielsweise wenn ein TUI- oder
Webchat-`chat.send` eintrifft, während ein anderer Turn aktiv ist), behält das Gateway eine
**Gateway-eigene Abbruchidentität** für dieses Client-`runId`, bis der eingereihte
Inhalt ausgeführt oder verworfen wird. Die Identität folgt Inhalten, die in eine
Überlaufzusammenfassung aufgenommen wurden.

- `chat.abort` mit einem bestimmten `runId` bricht diesen Turn ab, solange er noch
  eingereiht ist, sofern der Anfordernde autorisiert ist (dieselben Eigentumsregeln wie für aktive Läufe).
- `chat.abort` für eine Sitzung ohne `runId` bricht zuerst **autorisierte eingereihte Turns
  ab** und anschließend autorisierte aktive Läufe. Diese Reihenfolge verhindert, dass beim Abarbeiten der Warteschlange
  Arbeit in eine nur teilweise gestoppte Sitzung übernommen wird.
- Das Löschen der gesamten Sitzungswarteschlange ohne Prüfung pro Anforderndem ist nicht der
  Stopp-Pfad für Sitzungen mit mehreren Eigentümern.
- Wartephasen in der Warteschlange werden für `sessions.list` nicht als aktive Agent-Läufe dargestellt und
  besitzen keine Semantik für Zeitüberschreitungen aktiver Läufe; diese gilt nur für die aktive Phase.

Gateway-gestützte Clients (einschließlich `openclaw tui`) leiten während eines Laufs eintreffende Prompts weiter und
überlassen dem Gateway die Anwendung des Warteschlangenmodus. Esc/`/stop` verwendet einen sitzungsbezogenen Abbruch,
damit verlorene lokale Handles nicht dazu führen, dass ein weiterhin eingereihter Prompt ausgeführt wird.

`openclaw chat` und `openclaw tui --local` wenden dieselben vier Modi in der
eingebetteten Runtime an. Lokales `steer` speist in einen aktiven eingebetteten Lauf ein, wenn diese
Runtime Steuerung akzeptiert, und wird andernfalls zu einem Folge-Turn; `followup` und
`collect` bleiben lokal ausstehende Arbeit; `interrupt` bricht den aktiven lokalen Lauf
vor dem Start der neuesten Nachricht ab. Der explizite Befehl `/steer <message>` ist
kein Befehl für den lokalen Modus.

## Geltungsbereich und Garantien

- Gilt für automatische Agent-Antwortläufe über alle eingehenden Kanäle hinweg, die die Gateway-Antwortpipeline verwenden (WhatsApp Web, Telegram, Slack, Discord, Signal, iMessage, Webchat usw.).
- Die Standard-Lane (`main`) gilt prozessweit für eingehende Nachrichten und Haupt-Heartbeats; setzen Sie `agents.defaults.maxConcurrent`, um mehrere Sitzungen parallel zuzulassen.
- Zusätzliche Lanes können vorhanden sein (z. B. `cron`, `cron-nested`, `nested`, `subagent`), damit Hintergrundaufträge parallel ausgeführt werden können, ohne eingehende Antworten zu blockieren. Isolierte Cron-Agent-Turns belegen einen `cron`-Slot, während ihre interne Agent-Ausführung `cron-nested` verwendet. Gemeinsam genutzte Nicht-Cron-`nested`-Abläufe behalten ihr eigenes Lane-Verhalten bei. Diese abgekoppelten Läufe werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.
- Sitzungsspezifische Lanes gewährleisten, dass jeweils nur ein Agent-Lauf auf eine bestimmte Sitzung zugreift.
- Keine externen Abhängigkeiten oder Hintergrund-Worker-Threads; ausschließlich TypeScript und Promises.

## Fehlerbehebung

- Wenn Befehle festzustecken scheinen, aktivieren Sie die ausführliche Protokollierung und suchen Sie nach Zeilen mit „queued for ...ms“, um zu bestätigen, dass die Warteschlange abgearbeitet wird.
- Läufe des Codex-App-Servers, die einen Turn annehmen und anschließend keine Fortschrittsmeldungen mehr ausgeben, werden vom Codex-Adapter unterbrochen, damit die aktive Sitzungs-Lane freigegeben werden kann, anstatt auf die Zeitüberschreitung des äußeren Laufs zu warten.
- Wenn die Diagnose aktiviert ist, werden Sitzungen, die über den integrierten Warnschwellenwert hinaus in `processing` verbleiben, ohne dass Antwort-, Tool-, Status-, Block- oder ACP-Fortschritt beobachtet wurde, anhand ihrer aktuellen Aktivität klassifiziert:
  - Aktive Arbeit mit aktuellem Fortschritt wird als `session.long_running` protokolliert. Zugeordnete stille Modellaufrufe bleiben ebenfalls bis zum integrierten Abbruchschwellenwert `session.long_running`, damit langsame oder nicht streamende Provider nicht zu früh als festgefahren gemeldet werden.
  - Aktive Arbeit ohne aktuellen Fortschritt wird als `session.stalled` protokolliert; zugeordnete Modellaufrufe, blockierte Tool-Aufrufe und festgefahrene eingebettete Läufe wechseln bei oder nach Erreichen des Abbruchschwellenwerts zu `session.stalled`. Veraltete Modell-/Tool-Aktivität ohne Eigentümer wird nicht als lang andauernd verborgen.
  - `session.stuck` ist für wiederherstellbare veraltete Sitzungsbuchführung reserviert, einschließlich inaktiver eingereihter Sitzungen mit veralteter Modell-/Tool-Aktivität ohne Eigentümer.
  - `session.stuck` löst stets eine Wiederherstellung aus, die die betroffene Sitzungs-Lane freigeben kann. Eine Klassifizierung als `session.stalled` nach Überschreiten des Abbruchschwellenwerts (blockierter Tool-Aufruf, festgefahrener Modellaufruf oder festgefahrener eingebetteter Lauf) kann ebenfalls eine Wiederherstellung durch aktiven Abbruch auslösen, sodass beide Klassifizierungen eine Warteschlange wieder in Gang setzen können, nicht nur `session.stuck`.
  - Wiederholte Warnprotokollzeilen für `session.stuck` und `session.long_running` werden exponentiell verzögert, solange die Sitzung unverändert bleibt; Wiederherstellungsversuche werden unabhängig von dieser Verzögerung weiterhin bei jedem Heartbeat-Tick ausgeführt.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Steuerungswarteschlange](/de/concepts/queue-steering)
- [Steuern](/de/tools/steer)
- [Wiederholungsrichtlinie](/de/concepts/retry)
