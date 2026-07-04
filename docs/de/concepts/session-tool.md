---
read_when:
    - Sie möchten verstehen, welche Sitzungstools der Agent hat
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agenten konfigurieren
    - Sie möchten den Status gestarteter Sub-Agents überprüfen
summary: Agenten-Tools für sitzungsübergreifenden Status, Abruf, Messaging und Sub-Agent-Orchestrierung
title: Sitzungstools
x-i18n:
    generated_at: "2026-07-04T20:28:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw stellt Agenten Werkzeuge bereit, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und
Sub-Agents zu orchestrieren.

## Verfügbare Werkzeuge

| Werkzeug           | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (kind, label, agent, archive, preview) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten              |
| `sessions_yield`   | Den aktuellen Turn beenden und auf Follow-up-Ergebnisse von Sub-Agents warten |
| `subagents`        | Den Status gestarteter Sub-Agents für diese Sitzung auflisten               |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional eine sitzungsbezogene Modellüberschreibung setzen |

Diese Werkzeuge unterliegen weiterhin dem aktiven Werkzeugprofil und der Allow/Deny-
Policy. `tools.profile: "coding"` enthält den vollständigen Satz zur Sitzungsorchestrierung,
einschließlich `sessions_spawn`, `sessions_yield` und `subagents`.
`tools.profile: "messaging"` enthält Werkzeuge für sitzungsübergreifende Nachrichten
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), enthält aber
kein Starten von Sub-Agents. Um ein Messaging-Profil beizubehalten und dennoch
native Delegation zu erlauben, fügen Sie Folgendes hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und Agent-spezifische Policies können diese Werkzeuge
nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` aus der betroffenen Sitzung,
um die effektive Werkzeugliste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, agentId, kind, Kanal, Modell,
Token-Zahlen und Zeitstempeln zurück. Filtern Sie nach kind (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exaktem `agentId`, Suchtext oder Aktualität
(`activeMinutes`). Aktive Sitzungen werden standardmäßig zurückgegeben; übergeben Sie `archived: true`,
um archivierte Sitzungen zu prüfen. Zeilen enthalten ihren angehefteten und archivierten Status. Wenn
Sie eine Triage im Postfachstil benötigen, kann es außerdem einen
sichtbarkeitsbezogenen abgeleiteten Titel, einen Vorschau-Ausschnitt der letzten Nachricht oder begrenzte aktuelle
Nachrichten pro Zeile anfordern. Abgeleitete Titel und Vorschauen werden nur für Sitzungen
erzeugt, die der Aufrufer gemäß der konfigurierten Sichtbarkeits-Policy für Sitzungswerkzeuge bereits sehen kann, sodass
nicht zusammengehörige Sitzungen verborgen bleiben. Wenn die Sichtbarkeit eingeschränkt ist, gibt `sessions_list`
optionale `visibility`-Metadaten zurück, die den effektiven Modus und eine Warnung anzeigen, dass
Ergebnisse möglicherweise auf den Geltungsbereich beschränkt sind.

`sessions_history` ruft das Konversationstranskript für eine bestimmte Sitzung ab.
Standardmäßig sind Werkzeugergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Verwenden Sie `limit` für den neuesten begrenzten Ausschnitt. Übergeben Sie `offset: 0`, wenn Sie
Paginierungsmetadaten benötigen, und übergeben Sie dann zurückgegebene `nextOffset`-Werte, um rückwärts
durch ältere OpenClaw-Transkriptfenster zu blättern, ohne rohe Transkriptdateien zu lesen.
Explizite Offset-Seiten führen keine externen CLI-Fallback-Importe zusammen; verwenden Sie die
standardmäßige Ansicht des neuesten Ausschnitts, wenn Sie diese zusammengeführte Anzeigehistorie benötigen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - Nur-Text-XML-Nutzlastblöcke von Werkzeugaufrufen wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Nutzlasten, die nie sauber schließen
  - herabgestufte Gerüste für Werkzeugaufrufe/-ergebnisse wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - geleakte Modellsteuerungs-Token wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und Vollbreitenvarianten `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-Werkzeugaufruf-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- zugangsdaten-/tokenähnlicher Text wird vor der Rückgabe redigiert
- lange Textblöcke werden abgeschnitten
- sehr große Historien können ältere Zeilen auslassen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- das Werkzeug meldet Summary-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` und Paginierungsmetadaten

Beide Werkzeuge akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakte bytegetreue Transkript benötigen, prüfen Sie stattdessen die Transkriptdatei auf
der Festplatte, anstatt `sessions_history` als Rohdump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` stellt eine Nachricht an eine andere Sitzung zu und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um in die Warteschlange einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Thread-bezogene Chat-Sitzungen, etwa Slack- oder Discord-Schlüssel, die auf
`:thread:<id>` enden, sind keine gültigen `sessions_send`-Ziele. Verwenden Sie den Sitzungsschlüssel des übergeordneten Kanals
für die Koordination zwischen Agenten, damit über Werkzeuge geroutete Nachrichten nicht
in einem aktiven menschenorientierten Thread erscheinen.

Nachrichten und A2A-Follow-up-Antworten werden im empfangenden Prompt
(`[Inter-session message ... isUser=false]`) und in der Transkriptprovenienz als sitzungsübergreifende Daten markiert.
Der empfangende Agent sollte sie als über Werkzeuge geroutete Daten behandeln, nicht als
direkt vom Endbenutzer verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-back-Schleife** ausführen, bei der die
Agenten abwechselnd Nachrichten senden (bis zu `session.agentToAgent.maxPingPongTurns`, Bereich
0-20, Standard 5). Der Ziel-Agent kann mit
`REPLY_SKIP` antworten, um vorzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige Werkzeug, das `/status` für die aktuelle
oder eine andere sichtbare Sitzung entspricht. Es meldet Nutzung, Zeit, Modell-/Runtime-Status und
verknüpften Hintergrundaufgaben-Kontext, wenn vorhanden. Wie `/status` kann es
spärliche Token-/Cache-Zähler aus dem neuesten Transkript-Nutzungseintrag rückfüllen, und
`model=default` entfernt eine sitzungsbezogene Überschreibung. Verwenden Sie `sessionKey="current"` für
die aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind
keine Sitzungsschlüssel.

Wenn Routenmetadaten verfügbar sind, enthält `session_status` außerdem einen sichtbaren
JSON-Block `Route context` und passende strukturierte `details`-Felder. Diese
Felder unterscheiden den Sitzungsschlüssel von der Route, die aktuell den Live-Lauf
verarbeitet:

- `origin` ist der Ort, an dem die Sitzung erstellt wurde, oder der Provider, der aus einem
  zustellbaren Sitzungsschlüsselpräfix abgeleitet wurde, wenn älterem Zustand gespeicherte Origin-Metadaten fehlen.
- `active` ist die aktuelle Route des Live-Laufs. Sie wird nur für die Live- oder
  aktuelle Sitzung gemeldet, die gerade verarbeitet wird.
- `deliveryContext` ist die persistierte Zustellroute, die in der Sitzung gespeichert ist
  und die OpenClaw für spätere Zustellungen wiederverwenden kann, selbst wenn die aktive Oberfläche
  abweicht.

`sessions_yield` beendet absichtlich den aktuellen Turn, damit die nächste Nachricht das
Follow-up-Ereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agents, wenn
Sie möchten, dass Abschlussergebnisse als nächste Nachricht eintreffen, anstatt
Polling-Schleifen zu bauen.

`subagents` ist der Sichtbarkeitshelfer für bereits gestartete OpenClaw-
Sub-Agents. Es unterstützt `action: "list"`, um aktive/aktuelle Läufe zu prüfen.

## Sub-Agents starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe.
Es ist immer nicht blockierend -- es kehrt sofort mit einer `runId` und
`childSessionKey` zurück. Native Sub-Agent-Läufe erhalten die delegierte Aufgabe in der
ersten sichtbaren `[Subagent Task]`-Nachricht der Child-Sitzung, während der System-
Prompt nur Runtime-Regeln für Sub-Agents und Routing-Kontext enthält.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- `model`- und `thinking`-Überschreibungen für die Child-Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Child zu erzwingen.
- `context: "fork"` für native Sub-Agents, wenn das Child das aktuelle
  Anforderertranskript benötigt; lassen Sie es weg oder verwenden Sie `context: "isolated"` für ein sauberes Child.
  Thread-gebundene native Sub-Agents verwenden standardmäßig `context: "fork"`, sofern
  `threadBindings.defaultSpawnContext` nichts anderes vorgibt.

Standardmäßige Leaf-Sub-Agents erhalten keine Sitzungswerkzeuge. Wenn
`maxSpawnDepth >= 2` gilt, erhalten Orchestrator-Sub-Agents der Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Children verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungswerkzeuge.

Nach Abschluss postet ein Ankündigungsschritt das Ergebnis in den Kanal des Anforderers.
Die Abschlusszustellung erhält gebundenes Thread-/Topic-Routing, wenn verfügbar, und wenn
der Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw weiterhin die
gespeicherte Route der Anforderersitzung (`lastChannel` / `lastTo`) für direkte
Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP Agents](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungswerkzeuge sind beschränkt, um zu begrenzen, was der Agent sehen kann:

| Ebene   | Geltungsbereich                         |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agents |
| `agent` | Alle Sitzungen für diesen Agenten        |
| `all`   | Alle Sitzungen (agentenübergreifend, wenn konfiguriert) |

Standard ist `tree`. Sandbox-Sitzungen werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP Agents](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsschalter für Sitzungswerkzeuge

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
