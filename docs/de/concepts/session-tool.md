---
read_when:
    - Sie möchten verstehen, welche Sitzungs-Tools der Agent hat
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agenten konfigurieren
    - Sie möchten den Status prüfen oder gestartete Sub-Agenten steuern
summary: Agent-Tools für sitzungsübergreifenden Status, Recall, Messaging und Sub-Agent-Orchestrierung
title: Sitzungs-Tools
x-i18n:
    generated_at: "2026-04-23T06:28:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d99408f3052f4fa461bc26bf79456e7f852069ec101b9d593442cef6dd20a3ac
    source_path: concepts/session-tool.md
    workflow: 15
---

# Sitzungs-Tools

OpenClaw gibt Agenten Tools, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und Sub-Agenten zu orchestrieren.

## Verfügbare Tools

| Tool               | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Aktualität, Vorschau) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten              |
| `sessions_yield`   | Den aktuellen Turn beenden und auf nachfolgende Sub-Agent-Ergebnisse warten |
| `subagents`        | Für diese Sitzung gestartete Sub-Agenten auflisten, steuern oder beenden    |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional ein sitzungsbezogenes Modell-Override setzen |

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, `agentId`, Art, Kanal, Modell,
Token-Anzahlen und Zeitstempeln zurück. Filtern Sie nach Art (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exakter `agentId`, Suchtext oder Aktualität
(`activeMinutes`). Wenn Sie eine Triage im Postfachstil benötigen, kann außerdem nach
abgeleiteten Titeln, Vorschauen der letzten Nachricht oder begrenzten aktuellen Nachrichten
gefragt werden. Vorschau-Lesungen von Transkripten sind auf Sitzungen beschränkt, die gemäß
der konfigurierten Sichtbarkeitsrichtlinie für Sitzungs-Tools sichtbar sind.

`sessions_history` ruft das Konversationstranskript für eine bestimmte Sitzung ab.
Standardmäßig sind Tool-Ergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistant-Text wird vor dem Recall normalisiert:
  - Thinking-Tags werden entfernt
  - Scaffold-Blöcke `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Payload-Blöcke für Tool-Aufrufe im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestufte Scaffoldings für Tool-Aufrufe/-Ergebnisse wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - geleakte Modell-Steuertoken wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Tokens und Varianten in voller Breite `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-XML für Tool-Aufrufe wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- textähnliche Anmeldedaten/Token werden vor der Rückgabe redigiert
- lange Textblöcke werden abgeschnitten
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakte Transkript Byte für Byte benötigen, prüfen Sie stattdessen die Transkriptdatei auf
dem Datenträger, anstatt `sessions_history` als Roh-Dump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` liefert eine Nachricht an eine andere Sitzung und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um in die Warteschlange einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-back-Schleife** ausführen, in der die
Agenten abwechselnd Nachrichten senden (bis zu 5 Turns). Der Ziel-Agent kann mit
`REPLY_SKIP` antworten, um frühzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige `/status`-Äquivalent für die aktuelle
oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Laufzeitstatus und
verknüpften Hintergrundtask-Kontext, sofern vorhanden. Wie `/status` kann es spärliche
Token-/Cache-Zähler aus dem neuesten Nutzungseintrag des Transkripts auffüllen, und
`model=default` löscht ein sitzungsbezogenes Override.

`sessions_yield` beendet den aktuellen Turn absichtlich, damit die nächste Nachricht das
nachfolgende Ereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn
Sie möchten, dass Abschlussergebnisse als nächste Nachricht eintreffen, statt
Polling-Schleifen aufzubauen.

`subagents` ist der Control-Plane-Helfer für bereits gestartete OpenClaw-
Sub-Agenten. Unterstützt werden:

- `action: "list"`, um aktive/aktuelle Läufe zu prüfen
- `action: "steer"`, um einer laufenden Child-Instanz Folgeanweisungen zu senden
- `action: "kill"`, um eine Child-Instanz oder `all` zu stoppen

## Sub-Agenten starten

`sessions_spawn` erstellt eine isolierte Sitzung für eine Hintergrundaufgabe. Es ist immer
nicht blockierend -- es kehrt sofort mit einer `runId` und `childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- Overrides für `model` und `thinking` für die Child-Sitzung.
- `thread: true`, um den Spawn an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für die Child-Instanz zu erzwingen.

Standardmäßige Leaf-Sub-Agenten erhalten keine Sitzungs-Tools. Wenn
`maxSpawnDepth >= 2` gilt, erhalten Depth-1-Orchestrator-Sub-Agenten zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Child-Instanzen verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungs-Tools.

Nach Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Kanal des Anforderers.
Die Zustellung bei Abschluss bewahrt gebundenes Thread-/Themen-Routing, wenn verfügbar, und wenn
der Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw weiterhin die gespeicherte Route
(`lastChannel` / `lastTo`) der Anforderer-Sitzung für die direkte Zustellung wiederverwenden.

Für ACP-spezifisches Verhalten siehe [ACP Agents](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungs-Tools sind so begrenzt, dass eingeschränkt wird, was der Agent sehen kann:

| Ebene   | Umfang                                   |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agenten        |
| `all`   | Alle Sitzungen (agentübergreifend, falls konfiguriert) |

Der Standard ist `tree`. Sandboxed-Sitzungen werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP Agents](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsoptionen für Sitzungs-Tools
