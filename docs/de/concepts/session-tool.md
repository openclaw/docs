---
read_when:
    - Sie möchten verstehen, über welche Sitzungswerkzeuge der Agent verfügt
    - Sie möchten sitzungsübergreifenden Zugriff oder das Erzeugen von Sub-Agents konfigurieren
    - Sie möchten den Status prüfen oder gestartete Unteragenten steuern
summary: Agent-Tools für sitzungsübergreifenden Status, Abruf, Nachrichtenübermittlung und Sub-Agent-Orchestrierung
title: Sitzungswerkzeuge
x-i18n:
    generated_at: "2026-04-30T06:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0464116d42e271da12cbe90529e06e9f51605981be85b54bb5850ee9b8fb7824
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw gibt Agenten Tools, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und
Sub-Agenten zu orchestrieren.

## Verfügbare Tools

| Tool               | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Aktualität, Vorschau) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten              |
| `sessions_yield`   | Den aktuellen Turn beenden und auf nachfolgende Sub-Agent-Ergebnisse warten |
| `subagents`        | Für diese Sitzung gestartete Sub-Agenten auflisten, steuern oder beenden    |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional ein sitzungsspezifisches Modell-Override setzen |

Diese Tools unterliegen weiterhin dem aktiven Tool-Profil und der Allow-/Deny-
Richtlinie. `tools.profile: "coding"` umfasst den vollständigen Satz zur
Sitzungsorchestrierung, einschließlich `sessions_spawn`, `sessions_yield` und
`subagents`. `tools.profile: "messaging"` umfasst sitzungsübergreifende
Messaging-Tools (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`), aber kein Starten von Sub-Agenten. Um ein Messaging-Profil
beizubehalten und trotzdem native Delegation zu erlauben, fügen Sie hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und agentenspezifische Richtlinien können diese
Tools nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus der
betroffenen Sitzung, um die effektive Tool-Liste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, agentId, Typ, Kanal, Modell,
Token-Zahlen und Zeitstempeln zurück. Filtern Sie nach Typ (`main`, `group`,
`cron`, `hook`, `node`), exaktem `label`, exakter `agentId`, Suchtext oder
Aktualität (`activeMinutes`). Wenn Sie Triage im Mailbox-Stil benötigen, kann es
außerdem pro Zeile einen sichtbarkeitsbezogenen abgeleiteten Titel, einen
Vorschau-Ausschnitt der letzten Nachricht oder begrenzte aktuelle Nachrichten
anfordern. Abgeleitete Titel und Vorschauen werden nur für Sitzungen erzeugt,
die der Aufrufer gemäß der konfigurierten Sichtbarkeitsrichtlinie für
Sitzungs-Tools bereits sehen darf, sodass nicht zusammenhängende Sitzungen
verborgen bleiben.

`sessions_history` ruft das Konversationstranskript für eine bestimmte Sitzung
ab. Standardmäßig sind Tool-Ergebnisse ausgeschlossen -- übergeben Sie
`includeTools: true`, um sie zu sehen. Die zurückgegebene Ansicht ist bewusst
begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - XML-Nutzlastblöcke von Tool-Aufrufen als Klartext, etwa `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>`, werden entfernt, einschließlich abgeschnittener
    Nutzlasten, die nie sauber schließen
  - herabgestufte Tool-Aufruf-/Ergebnis-Gerüste wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - durchgesickerte Modell-Steuerungstoken wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und vollbreite `<｜...｜>`-Varianten werden entfernt
  - fehlerhaftes MiniMax-Tool-Aufruf-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- Anmeldedaten- oder tokenähnlicher Text wird vor der Rückgabe redigiert
- lange Textblöcke werden gekürzt
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder
eine **Sitzungs-ID** aus einem vorherigen Listenaufruf.

Wenn Sie das exakte Byte-für-Byte-Transkript benötigen, prüfen Sie die
Transkriptdatei auf dem Datenträger, statt `sessions_history` als Rohdump zu
behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet
optional auf die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um die Nachricht einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt
(`[Inter-session message ... isUser=false]`) und in der Transkript-Provenienz
als sitzungsübergreifende Daten markiert. Der empfangende Agent sollte sie als
über Tools geroutete Daten behandeln, nicht als direkte, vom Endnutzer verfasste
Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw einen **Rückantwort-Loop**
ausführen, in dem die Agenten abwechselnd Nachrichten austauschen (bis zu
5 Turns). Der Ziel-Agent kann mit `REPLY_SKIP` antworten, um vorzeitig zu
stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das schlanke, zu `/status` äquivalente Tool für die
aktuelle oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit,
Modell-/Runtime-Status und verknüpften Hintergrundaufgaben-Kontext, sofern
vorhanden. Wie `/status` kann es spärliche Token-/Cache-Zähler aus dem neuesten
Transkript-Nutzungseintrag auffüllen, und `model=default` löscht ein
sitzungsspezifisches Override. Verwenden Sie `sessionKey="current"` für die
aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind
keine Sitzungsschlüssel.

`sessions_yield` beendet absichtlich den aktuellen Turn, damit die nächste
Nachricht das Folgeereignis sein kann, auf das Sie warten. Verwenden Sie es nach
dem Starten von Sub-Agenten, wenn Abschlussresultate als nächste Nachricht
ankommen sollen, statt Polling-Loops zu bauen.

`subagents` ist der Control-Plane-Helfer für bereits gestartete OpenClaw-
Sub-Agenten. Es unterstützt:

- `action: "list"`, um aktive/aktuelle Läufe zu prüfen
- `action: "steer"`, um einem laufenden Child nachträgliche Hinweise zu senden
- `action: "kill"`, um ein Child oder `all` zu stoppen

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine
Hintergrundaufgabe. Es ist immer nicht blockierend -- es kehrt sofort mit einer
`runId` und einem `childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- `model`- und `thinking`-Overrides für die Child-Sitzung.
- `thread: true`, um den Spawn an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Child zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das Child das aktuelle
  Anforderer-Transkript benötigt; lassen Sie es weg oder verwenden Sie
  `context: "isolated"` für ein sauberes Child.

Standardmäßige Leaf-Sub-Agenten erhalten keine Sitzungs-Tools. Wenn
`maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten auf Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Children verwalten können. Leaf-Läufe erhalten weiterhin keine
rekursiven Orchestrierungs-Tools.

Nach Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Kanal des
Anforderers. Die Abschlusszustellung erhält gebundene Thread-/Topic-Routings,
wenn verfügbar, und wenn der Abschlussursprung nur einen Kanal identifiziert,
kann OpenClaw trotzdem die gespeicherte Route der Anforderer-Sitzung
(`lastChannel` / `lastTo`) für die direkte Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungs-Tools sind eingeschränkt, um zu begrenzen, was der Agent sehen kann:

| Ebene   | Geltungsbereich                         |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agenten       |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Standard ist `tree`. Sandboxed-Sitzungen werden unabhängig von der Konfiguration
auf `tree` begrenzt.

## Weitere Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP-Agenten](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsoptionen für Sitzungs-Tools

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
