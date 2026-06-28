---
read_when:
    - Sie möchten verstehen, über welche Session-Tools der Agent verfügt
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agenten konfigurieren
    - Sie möchten den Status gestarteter Sub-Agents prüfen
summary: Agent-Tools für sitzungsübergreifenden Status, Abruf, Messaging und Sub-Agent-Orchestrierung
title: Sitzungstools
x-i18n:
    generated_at: "2026-06-28T00:12:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffc7edf68e4510ea6a5fe93238be32e9d7eacf8e7b49e58f63536c14bbe2da80
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
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten             |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten               |
| `sessions_yield`   | Den aktuellen Turn beenden und auf nachfolgende Sub-Agent-Ergebnisse warten  |
| `subagents`        | Den Status gestarteter Sub-Agenten für diese Sitzung auflisten               |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional eine sitzungsspezifische Modell-Überschreibung setzen |

Diese Tools unterliegen weiterhin dem aktiven Tool-Profil und der Allow-/Deny-
Policy. `tools.profile: "coding"` enthält den vollständigen Satz zur Sitzungsorchestrierung,
einschließlich `sessions_spawn`, `sessions_yield` und `subagents`.
`tools.profile: "messaging"` enthält Tools für sitzungsübergreifende Nachrichten
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), enthält aber
kein Starten von Sub-Agenten. Um ein Messaging-Profil beizubehalten und dennoch
native Delegation zu erlauben, fügen Sie hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und agentenspezifische Policies können diese Tools
nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` in der betroffenen Sitzung,
um die effektive Tool-Liste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, agentId, ihrer Art, ihrem Kanal, Modell,
Token-Zählungen und Zeitstempeln zurück. Filtern Sie nach Art (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exakter `agentId`, Suchtext oder Aktualität
(`activeMinutes`). Wenn Sie eine Triage im Mailbox-Stil benötigen, kann es auch einen
sichtbarkeitsbezogenen abgeleiteten Titel, einen Vorschauausschnitt der letzten Nachricht oder begrenzte aktuelle
Nachrichten pro Zeile anfordern. Abgeleitete Titel und Vorschauen werden nur für Sitzungen
erstellt, die der Aufrufer gemäß der konfigurierten Sichtbarkeits-Policy für Sitzungstools bereits sehen kann, sodass
nicht verwandte Sitzungen verborgen bleiben. Wenn die Sichtbarkeit eingeschränkt ist, gibt `sessions_list`
optionale `visibility`-Metadaten zurück, die den effektiven Modus und eine Warnung anzeigen, dass
Ergebnisse auf den Umfang beschränkt sein können.

`sessions_history` ruft das Konversationstranskript für eine bestimmte Sitzung ab.
Standardmäßig sind Tool-Ergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Verwenden Sie `limit` für das neueste begrenzte Ende. Übergeben Sie `offset: 0`, wenn Sie
Paginierungsmetadaten benötigen, und übergeben Sie dann zurückgegebene `nextOffset`-Werte, um rückwärts
durch ältere OpenClaw-Transkriptfenster zu blättern, ohne rohe Transkriptdateien zu lesen.
Explizite Offset-Seiten führen keine externen CLI-Fallback-Importe zusammen; verwenden Sie die
standardmäßige Ansicht des neuesten Endes, wenn Sie diesen zusammengeführten Anzeigeverlauf benötigen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - XML-Nutzdatenblöcke für Tool-Aufrufe im Klartext wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Nutzdaten, die nie sauber schließen
  - herabgestufte Gerüste für Tool-Aufrufe/-Ergebnisse wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - durchgesickerte Modell-Steuerungstoken wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und Varianten in voller Breite `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Tool-Aufruf-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- textähnliche Anmeldeinformationen/Token werden vor der Rückgabe redigiert
- lange Textblöcke werden abgeschnitten
- sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Tool meldet Zusammenfassungs-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` und Paginierungsmetadaten

Beide Tools akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakte bytegenaue Transkript benötigen, prüfen Sie stattdessen die Transkriptdatei auf
der Festplatte, statt `sessions_history` als rohen Dump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um in die Warteschlange einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Thread-bezogene Chat-Sitzungen, etwa Slack- oder Discord-Schlüssel, die auf
`:thread:<id>` enden, sind keine gültigen Ziele für `sessions_send`. Verwenden Sie den Sitzungsschlüssel des übergeordneten Kanals
für die Koordination zwischen Agenten, damit tool-geroutete Nachrichten nicht
innerhalb eines aktiven, menschenorientierten Threads erscheinen.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt
(`[Inter-session message ... isUser=false]`) und in der Transkript-Provenienz als sitzungsübergreifende Daten markiert. Der empfangende Agent sollte sie als tool-geroutete Daten behandeln, nicht als
direkte, vom Endbenutzer verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-back-Schleife** ausführen, in der die
Agenten abwechselnd Nachrichten senden (bis zu `session.agentToAgent.maxPingPongTurns`, Bereich
0-20, Standardwert 5). Der Ziel-Agent kann mit
`REPLY_SKIP` antworten, um vorzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige Tool, das `/status` für die aktuelle
oder eine andere sichtbare Sitzung entspricht. Es meldet Nutzung, Zeit, Modell-/Runtime-Status und
verknüpften Hintergrundaufgabenkontext, sofern vorhanden. Wie `/status` kann es
spärliche Token-/Cache-Zähler aus dem neuesten Transkript-Nutzungseintrag auffüllen, und
`model=default` löscht eine sitzungsspezifische Überschreibung. Verwenden Sie `sessionKey="current"` für
die aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind
keine Sitzungsschlüssel.

Wenn Routenmetadaten verfügbar sind, enthält `session_status` außerdem einen sichtbaren
`Route context`-JSON-Block und passende strukturierte `details`-Felder. Diese
Felder unterscheiden den Sitzungsschlüssel von der Route, die aktuell den Live-Lauf
verarbeitet:

- `origin` ist der Ort, an dem die Sitzung erstellt wurde, oder der Provider, der aus einem
  zustellbaren Sitzungsschlüssel-Präfix abgeleitet wurde, wenn älterer Status keine gespeicherten Ursprungsmetadaten enthält.
- `active` ist die aktuelle Live-Lauf-Route. Sie wird nur für die Live- oder
  aktuelle Sitzung gemeldet, die gerade verarbeitet wird.
- `deliveryContext` ist die persistierte Zustellroute, die in der Sitzung gespeichert ist
  und die OpenClaw für spätere Zustellung wiederverwenden kann, auch wenn die aktive Oberfläche
  abweicht.

`sessions_yield` beendet absichtlich den aktuellen Turn, damit die nächste Nachricht das
Folgeereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn
Abschlussergebnisse als nächste Nachricht eintreffen sollen, statt
Polling-Schleifen zu bauen.

`subagents` ist der Sichtbarkeitshelfer für bereits gestartete OpenClaw-
Sub-Agenten. Er unterstützt `action: "list"`, um aktive/aktuelle Läufe zu prüfen.

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe.
Es ist immer nicht blockierend -- es gibt sofort eine `runId` und
`childSessionKey` zurück. Native Sub-Agent-Läufe erhalten die delegierte Aufgabe in der
ersten sichtbaren `[Subagent Task]`-Nachricht der Child-Sitzung, während der System-
Prompt nur Runtime-Regeln für Sub-Agenten und Routing-Kontext enthält.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- `model`- und `thinking`-Überschreibungen für die Child-Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Child zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das Child das aktuelle
  Anfragesteller-Transkript benötigt; lassen Sie es weg oder verwenden Sie `context: "isolated"` für ein sauberes Child.
  Thread-gebundene native Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern
  `threadBindings.defaultSpawnContext` nichts anderes vorgibt.

Standardmäßige Leaf-Sub-Agenten erhalten keine Sitzungstools. Wenn
`maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Children verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungs-Tools.

Nach Abschluss postet ein Ankündigungsschritt das Ergebnis im Kanal des Anfragestellers.
Die Abschlusszustellung bewahrt gebundenes Thread-/Topic-Routing, sofern verfügbar, und wenn
der Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw dennoch die
gespeicherte Route der Anfragesteller-Sitzung (`lastChannel` / `lastTo`) für direkte
Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP Agents](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungstools sind begrenzt, um einzuschränken, was der Agent sehen kann:

| Ebene   | Umfang                                   |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agent          |
| `all`   | Alle Sitzungen (agentenübergreifend, wenn konfiguriert) |

Standard ist `tree`. Sandbox-Sitzungen werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP Agents](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsregler für Sitzungstools

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
