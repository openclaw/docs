---
read_when:
    - Sie möchten verstehen, über welche Session-Tools der Agent verfügt
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Unteragenten konfigurieren
    - Sie möchten den Status prüfen oder erzeugte Unteragenten steuern
summary: Agent-Tools für sitzungsübergreifenden Status, Abruf, Messaging und die Orchestrierung von Unter-Agenten
title: Sitzungstools
x-i18n:
    generated_at: "2026-05-02T06:32:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw gibt Agenten Tools, um sitzungsübergreifend zu arbeiten, Status zu prüfen und
Sub-Agenten zu orchestrieren.

## Verfügbare Tools

| Tool               | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Listet Sitzungen mit optionalen Filtern auf (kind, label, agent, recency, preview) |
| `sessions_history` | Liest das Transkript einer bestimmten Sitzung                               |
| `sessions_send`    | Sendet eine Nachricht an eine andere Sitzung und wartet optional            |
| `sessions_spawn`   | Startet eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit              |
| `sessions_yield`   | Beendet den aktuellen Turn und wartet auf Folgeergebnisse von Sub-Agenten   |
| `subagents`        | Listet, steuert oder beendet gestartete Sub-Agenten für diese Sitzung       |
| `session_status`   | Zeigt eine `/status`-artige Karte an und setzt optional eine sitzungsbezogene Modellüberschreibung |

Diese Tools unterliegen weiterhin dem aktiven Tool-Profil und der Allow/Deny-
Policy. `tools.profile: "coding"` enthält den vollständigen Satz für die
Sitzungsorchestrierung, einschließlich `sessions_spawn`, `sessions_yield` und
`subagents`. `tools.profile: "messaging"` enthält sitzungsübergreifende
Messaging-Tools (`sessions_list`, `sessions_history`, `sessions_send`,
`session_status`), aber kein Starten von Sub-Agenten. Um ein Messaging-Profil
beizubehalten und native Delegierung dennoch zu erlauben, fügen Sie Folgendes
hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und agentenbezogene Policies können diese Tools
nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus der
betroffenen Sitzung, um die effektive Tool-Liste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit Schlüssel, agentId, kind, Kanal, Modell,
Token-Zahlen und Zeitstempeln zurück. Filtern Sie nach kind (`main`, `group`,
`cron`, `hook`, `node`), exaktem `label`, exakter `agentId`, Suchtext oder
Aktualität (`activeMinutes`). Wenn Sie eine Posteingang-artige Triage benötigen,
kann es außerdem einen sichtbarkeitsbezogenen abgeleiteten Titel, einen
Vorschauausschnitt der letzten Nachricht oder begrenzte aktuelle Nachrichten pro
Zeile anfordern. Abgeleitete Titel und Vorschauen werden nur für Sitzungen
erstellt, die der Aufrufer unter der konfigurierten Sichtbarkeits-Policy für
Sitzungs-Tools bereits sehen kann; nicht zugehörige Sitzungen bleiben daher
ausgeblendet.

`sessions_history` ruft das Unterhaltungstranskript für eine bestimmte Sitzung
ab. Standardmäßig sind Tool-Ergebnisse ausgeschlossen -- übergeben Sie
`includeTools: true`, um sie anzuzeigen. Die zurückgegebene Ansicht ist bewusst
begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - XML-Nutzlastblöcke für Tool-Aufrufe im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Nutzlasten, die nie sauber geschlossen werden
  - herabgestufte Gerüste für Tool-Aufrufe/-Ergebnisse wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - durchgesickerte Modellsteuerungs-Token wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und vollbreite Varianten `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Aufruf-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- Text, der wie Zugangsdaten oder Token wirkt, wird vor der Rückgabe redigiert
- lange Textblöcke werden gekürzt
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder
eine **Sitzungs-ID** aus einem vorherigen Listenaufruf.

Wenn Sie das exakte bytegenaue Transkript benötigen, prüfen Sie die
Transkriptdatei auf der Festplatte, statt `sessions_history` als Rohdump zu
behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet
optional auf die Antwort:

- **Senden ohne Warten:** Setzen Sie `timeoutSeconds: 0`, um die Nachricht
  einzureihen und sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort
  inline.

Thread-bezogene Chat-Sitzungen, etwa Slack- oder Discord-Schlüssel, die auf
`:thread:<id>` enden, sind keine gültigen Ziele für `sessions_send`. Verwenden
Sie den Sitzungsschlüssel des übergeordneten Kanals für die Koordination
zwischen Agenten, damit Tool-geroutete Nachrichten nicht in einem aktiven,
menschenorientierten Thread erscheinen.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt
(`[Inter-session message ... isUser=false]`) und in der Transkriptprovenienz als
sitzungsübergreifende Daten markiert. Der empfangende Agent sollte sie als
Tool-geroutete Daten behandeln, nicht als direkte Anweisung eines Endbenutzers.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Rückantwort-Schleife**
ausführen, in der die Agenten abwechselnd Nachrichten austauschen (bis zu 5
Turns). Der Zielagent kann mit `REPLY_SKIP` antworten, um vorzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige `/status`-äquivalente Tool für die
aktuelle oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit,
Modell-/Laufzeitstatus und verknüpften Hintergrundaufgabenkontext, sofern
vorhanden. Wie `/status` kann es spärliche Token-/Cache-Zähler aus dem neuesten
Transkript-Nutzungseintrag auffüllen, und `model=default` löscht eine
sitzungsbezogene Überschreibung. Verwenden Sie `sessionKey="current"` für die
aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind
keine Sitzungsschlüssel.

`sessions_yield` beendet absichtlich den aktuellen Turn, damit die nächste
Nachricht das Folgeereignis sein kann, auf das Sie warten. Verwenden Sie es nach
dem Starten von Sub-Agenten, wenn Abschlussresultate als nächste Nachricht
eintreffen sollen, statt Polling-Schleifen zu bauen.

`subagents` ist der Control-Plane-Helfer für bereits gestartete OpenClaw-
Sub-Agenten. Es unterstützt:

- `action: "list"` zum Prüfen aktiver/aktueller Läufe
- `action: "steer"` zum Senden nachträglicher Anweisungen an ein laufendes Kind
- `action: "kill"` zum Stoppen eines Kindes oder von `all`

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine
Hintergrundaufgabe. Es ist immer nicht blockierend -- es kehrt sofort mit einer
`runId` und einem `childSessionKey` zurück.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- `model`- und `thinking`-Überschreibungen für die Kind-Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Kind zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das Kind das aktuelle
  Anforderertranskript benötigt; lassen Sie es weg oder verwenden Sie
  `context: "isolated"` für ein sauberes Kind. Thread-gebundene native
  Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern
  `threadBindings.defaultSpawnContext` nichts anderes vorgibt.

Standardmäßige Blatt-Sub-Agenten erhalten keine Sitzungs-Tools. Wenn
`maxSpawnDepth >= 2` gilt, erhalten Orchestrator-Sub-Agenten auf Tiefe 1
zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`,
damit sie ihre eigenen Kinder verwalten können. Blattläufe erhalten weiterhin
keine rekursiven Orchestrierungs-Tools.

Nach Abschluss postet ein Ankündigungsschritt das Ergebnis im Kanal des
Anforderers. Die Abschlusszustellung behält gebundenes Thread-/Topic-Routing bei,
wenn verfügbar, und falls der Abschlussursprung nur einen Kanal identifiziert,
kann OpenClaw weiterhin die gespeicherte Route der Anforderersitzung
(`lastChannel` / `lastTo`) für die direkte Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungs-Tools sind eingeschränkt, um zu begrenzen, was der Agent sehen kann:

| Ebene   | Umfang                                   |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agenten        |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Standard ist `tree`. Sandbox-Sitzungen werden unabhängig von der Konfiguration
auf `tree` begrenzt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP-Agenten](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsschalter für Sitzungs-Tools

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
