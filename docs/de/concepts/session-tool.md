---
read_when:
    - Sie möchten verstehen, welche Sitzungstools dem Agenten zur Verfügung stehen
    - Sie möchten sitzungsübergreifenden Zugriff oder das Erzeugen von Sub-Agents konfigurieren
    - Sie möchten den Status prüfen oder gestartete untergeordnete Agenten steuern
summary: Agentenwerkzeuge für sitzungsübergreifenden Status, Abruf, Nachrichtenübermittlung und Orchestrierung von Unteragenten
title: Sitzungstools
x-i18n:
    generated_at: "2026-05-11T20:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e91f1f956ff882cabf7df51bd8c08836398decfb185c56c42db4052f24b3f716
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw gibt Agenten Tools, um sitzungsübergreifend zu arbeiten, Status zu prüfen und
Sub-Agenten zu orchestrieren.

## Verfügbare Tools

| Tool               | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Aktualität, Vorschau) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agenten-Sitzung für Hintergrundarbeit starten            |
| `sessions_yield`   | Den aktuellen Turn beenden und auf Folgeergebnisse von Sub-Agenten warten   |
| `subagents`        | Für diese Sitzung gestartete Sub-Agenten auflisten, steuern oder beenden    |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional ein sitzungsbezogenes Modell-Override setzen |

Diese Tools unterliegen weiterhin dem aktiven Tool-Profil und der Zulassen/Verweigern-
Policy. `tools.profile: "coding"` enthält den vollständigen Satz zur Sitzungsorchestrierung,
einschließlich `sessions_spawn`, `sessions_yield` und `subagents`.
`tools.profile: "messaging"` enthält Tools für sitzungsübergreifende Nachrichten
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), aber
nicht das Starten von Sub-Agenten. Um ein Messaging-Profil beizubehalten und dennoch
native Delegation zuzulassen, fügen Sie Folgendes hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und agentenspezifische Policies können diese Tools
nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus der betroffenen
Sitzung, um die effektive Tool-Liste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, agentId, ihrer Art, ihrem Kanal, Modell,
Token-Zählungen und Zeitstempeln zurück. Filtern Sie nach Art (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exaktem `agentId`, Suchtext oder Aktualität
(`activeMinutes`). Wenn Sie eine Triage im Posteingangsstil benötigen, kann es außerdem
einen sichtbarkeitsbezogenen abgeleiteten Titel, einen Vorschauausschnitt der letzten Nachricht
oder begrenzte aktuelle Nachrichten für jede Zeile anfordern. Abgeleitete Titel und Vorschauen
werden nur für Sitzungen erzeugt, die der Aufrufer unter der konfigurierten Sichtbarkeits-Policy
für Sitzungs-Tools bereits sehen kann, sodass nicht zusammenhängende Sitzungen verborgen bleiben.

`sessions_history` ruft das Gesprächstranskript für eine bestimmte Sitzung ab.
Standardmäßig werden Tool-Ergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - reine Textblöcke mit Tool-Call-XML-Payloads wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - herabgestufte Tool-Call-/Ergebnis-Gerüste wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - durchgesickerte Modellsteuerungs-Token wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und vollbreite Varianten von `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Call-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- anmeldeinformations-/tokenähnlicher Text wird vor der Rückgabe redigiert
- lange Textblöcke werden gekürzt
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakte Byte-für-Byte-Transkript benötigen, prüfen Sie die Transkriptdatei auf
der Festplatte, statt `sessions_history` als Rohdump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um die Nachricht einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Thread-bezogene Chat-Sitzungen, etwa Slack- oder Discord-Schlüssel, die auf
`:thread:<id>` enden, sind keine gültigen `sessions_send`-Ziele. Verwenden Sie den
Sitzungsschlüssel des übergeordneten Kanals für die Koordination zwischen Agenten, damit
per Tool geroutete Nachrichten nicht in einem aktiven nutzerseitigen Thread erscheinen.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt
(`[Inter-session message ... isUser=false]`) und in der Transkript-Provenienz als
sitzungsübergreifende Daten markiert. Der empfangende Agent sollte sie als per Tool
geroutete Daten behandeln, nicht als direkte, von Endnutzern verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-back-Schleife** ausführen, in der
die Agenten abwechselnd Nachrichten senden (bis zu `session.agentToAgent.maxPingPongTurns`,
Bereich 0-20, Standard 5). Der Zielagent kann mit
`REPLY_SKIP` antworten, um frühzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige `/status`-äquivalente Tool für die aktuelle
oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Runtime-Zustand und
verknüpften Hintergrundtask-Kontext, sofern vorhanden. Wie `/status` kann es
spärliche Token-/Cache-Zähler aus dem neuesten Transkript-Nutzungseintrag nachtragen, und
`model=default` entfernt ein sitzungsbezogenes Override. Verwenden Sie `sessionKey="current"` für
die aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind
keine Sitzungsschlüssel.

`sessions_yield` beendet absichtlich den aktuellen Turn, damit die nächste Nachricht das
Folgeereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten,
wenn Sie möchten, dass Abschlussergebnisse als nächste Nachricht eintreffen, statt
Polling-Schleifen zu bauen.

`subagents` ist der Control-Plane-Helfer für bereits gestartete OpenClaw-
Sub-Agenten. Es unterstützt:

- `action: "list"` zum Prüfen aktiver/aktueller Läufe
- `action: "steer"` zum Senden nachfolgender Anleitung an ein laufendes Kind
- `action: "kill"` zum Stoppen eines Kindes oder von `all`

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe.
Es ist immer nicht blockierend -- es kehrt sofort mit einer `runId` und einem
`childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- `model`- und `thinking`-Overrides für die Kind-Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Kind zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das Kind das aktuelle
  Aufrufertranskript benötigt; lassen Sie es weg oder verwenden Sie `context: "isolated"` für ein sauberes Kind.
  Thread-gebundene native Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern
  `threadBindings.defaultSpawnContext` nichts anderes vorgibt.

Standardmäßige Leaf-Sub-Agenten erhalten keine Sitzungs-Tools. Wenn
`maxSpawnDepth >= 2`, erhalten Tiefe-1-Orchestrator-Sub-Agenten zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Kinder verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungs-Tools.

Nach Abschluss postet ein Ankündigungsschritt das Ergebnis in den Kanal des Aufrufers.
Die Abschlusszustellung bewahrt gebundenes Thread-/Topic-Routing, sofern verfügbar, und wenn
der Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw dennoch die gespeicherte Route
der Aufrufersitzung (`lastChannel` / `lastTo`) für direkte
Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungs-Tools sind eingeschränkt, um zu begrenzen, was der Agent sehen kann:

| Ebene   | Umfang                                   |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agenten        |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Standard ist `tree`. Sandbox-Sitzungen werden unabhängig von der Konfiguration auf
`tree` begrenzt.

## Weiterführende Lektüre

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP-Agenten](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agenten](/de/concepts/multi-agent) -- Multi-Agenten-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsoptionen für Sitzungs-Tools

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
