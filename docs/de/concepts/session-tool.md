---
read_when:
    - Sie möchten verstehen, über welche Sitzungstools der Agent verfügt
    - Sie möchten sitzungsübergreifenden Zugriff oder das Erzeugen von Unteragenten konfigurieren
    - Sie möchten den Status gestarteter Sub-Agents prüfen
summary: Agenten-Tools für sitzungsübergreifenden Status, Abruf, Messaging und Sub-Agenten-Orchestrierung
title: Sitzungstools
x-i18n:
    generated_at: "2026-06-27T17:26:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw gibt Agenten Werkzeuge, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und
Sub-Agenten zu orchestrieren.

## Verfügbare Werkzeuge

| Werkzeug           | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Aktualität, Vorschau) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agent-Sitzung für Hintergrundarbeit starten              |
| `sessions_yield`   | Den aktuellen Turn beenden und auf nachfolgende Ergebnisse von Sub-Agenten warten |
| `subagents`        | Den Status gestarteter Sub-Agenten für diese Sitzung auflisten              |
| `session_status`   | Eine `/status`-ähnliche Karte anzeigen und optional ein sitzungsspezifisches Modell-Override setzen |

Diese Werkzeuge unterliegen weiterhin dem aktiven Werkzeugprofil und der Allow/Deny-
Policy. `tools.profile: "coding"` enthält den vollständigen Satz für Sitzungsorchestrierung,
einschließlich `sessions_spawn`, `sessions_yield` und `subagents`.
`tools.profile: "messaging"` enthält Werkzeuge für sitzungsübergreifendes Messaging
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), aber
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

Gruppen-, Provider-, Sandbox- und Agent-spezifische Richtlinien können diese Werkzeuge
nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` in der betroffenen Sitzung,
um die wirksame Werkzeugliste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, agentId, ihrer Art, ihrem Kanal, Modell,
Token-Zählungen und Zeitstempeln zurück. Filtern Sie nach Art (`main`, `group`, `cron`, `hook`,
`node`), exaktem `label`, exakter `agentId`, Suchtext oder Aktualität
(`activeMinutes`). Wenn Sie eine Mailbox-ähnliche Triage benötigen, kann es außerdem einen
sichtbarkeitsbezogenen abgeleiteten Titel, einen Vorschauausschnitt der letzten Nachricht oder begrenzte aktuelle
Nachrichten in jeder Zeile anfordern. Abgeleitete Titel und Vorschauen werden nur für Sitzungen
erzeugt, die der Aufrufer gemäß der konfigurierten Sichtbarkeitsrichtlinie für Sitzungswerkzeuge bereits sehen kann, sodass
nicht zusammenhängende Sitzungen verborgen bleiben. Wenn die Sichtbarkeit eingeschränkt ist, gibt `sessions_list`
optionale `visibility`-Metadaten zurück, die den wirksamen Modus und eine Warnung anzeigen, dass
Ergebnisse auf den Geltungsbereich beschränkt sein können.

`sessions_history` ruft das Konversationstranskript für eine bestimmte Sitzung ab.
Standardmäßig sind Werkzeugergebnisse ausgeschlossen -- übergeben Sie `includeTools: true`, um sie zu sehen.
Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistant-Text wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - Nur-Text-XML-Payload-Blöcke von Werkzeugaufrufen wie `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und
    `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener
    Payloads, die nie sauber geschlossen werden
  - heruntergestufte Werkzeugaufruf-/Ergebnis-Gerüste wie `[Tool Call: ...]`,
    `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - durchgesickerte Modellsteuerungstoken wie `<|assistant|>`, andere ASCII-
    `<|...|>`-Token und vollbreite `<｜...｜>`-Varianten werden entfernt
  - fehlerhaftes MiniMax-Werkzeugaufruf-XML wie `<invoke ...>` /
    `</minimax:tool_call>` wird entfernt
- Credential-/Token-ähnlicher Text wird vor der Rückgabe redigiert
- Lange Textblöcke werden abgeschnitten
- Sehr große Verläufe können ältere Zeilen verwerfen oder eine übergroße Zeile durch
  `[sessions_history omitted: message too large]` ersetzen
- Das Werkzeug meldet Summary-Flags wie `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted` und `bytes`

Beide Werkzeuge akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID**
aus einem vorherigen Listenaufruf.

Wenn Sie das exakt bytegetreue Transkript benötigen, prüfen Sie stattdessen die Transkriptdatei auf
dem Datenträger, anstatt `sessions_history` als Rohdump zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` liefert eine Nachricht an eine andere Sitzung und wartet optional auf
die Antwort:

- **Fire-and-forget:** Setzen Sie `timeoutSeconds: 0`, um einzureihen und
  sofort zurückzukehren.
- **Auf Antwort warten:** Setzen Sie ein Timeout und erhalten Sie die Antwort inline.

Thread-bezogene Chat-Sitzungen, z. B. Slack- oder Discord-Schlüssel, die auf
`:thread:<id>` enden, sind keine gültigen `sessions_send`-Ziele. Verwenden Sie den Sitzungsschlüssel
des übergeordneten Kanals für die Koordination zwischen Agenten, damit werkzeuggesteuerte Nachrichten nicht
in einem aktiven, menschenorientierten Thread erscheinen.

Nachrichten und A2A-Follow-up-Antworten werden im empfangenden Prompt
(`[Inter-session message ... isUser=false]`) und in der Transkriptprovenienz als sitzungsübergreifende Daten markiert. Der empfangende Agent sollte sie als werkzeuggesteuerte Daten behandeln, nicht als
direkte, von einem Endbenutzer verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Reply-back-Schleife** ausführen, bei der die
Agenten abwechselnd Nachrichten senden (bis zu `session.agentToAgent.maxPingPongTurns`, Bereich
0-20, Standard 5). Der Ziel-Agent kann mit
`REPLY_SKIP` antworten, um frühzeitig zu stoppen.

## Status- und Orchestrierungshelfer

`session_status` ist das leichtgewichtige, `/status`-äquivalente Werkzeug für die aktuelle
oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Runtime-Status und
verknüpften Hintergrundaufgabenkontext, sofern vorhanden. Wie `/status` kann es
spärliche Token-/Cache-Zähler aus dem neuesten Transkript-Nutzungseintrag auffüllen, und
`model=default` löscht ein sitzungsspezifisches Override. Verwenden Sie `sessionKey="current"` für
die aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind
keine Sitzungsschlüssel.

Wenn Routenmetadaten verfügbar sind, enthält `session_status` außerdem einen sichtbaren
`Route context`-JSON-Block und passende strukturierte `details`-Felder. Diese
Felder unterscheiden den Sitzungsschlüssel von der Route, die derzeit den
Live-Lauf verarbeitet:

- `origin` ist der Ort, an dem die Sitzung erstellt wurde, oder der Provider, der aus einem
  zustellbaren Sitzungsschlüssel-Präfix abgeleitet wurde, wenn älterem Zustand gespeicherte Ursprungsmetadaten fehlen.
- `active` ist die aktuelle Live-Lauf-Route. Sie wird nur für die Live- oder
  aktuelle Sitzung gemeldet, die jetzt verarbeitet wird.
- `deliveryContext` ist die persistierte Zustellroute, die in der Sitzung gespeichert ist
  und die OpenClaw für spätere Zustellung wiederverwenden kann, selbst wenn die aktive Oberfläche
  abweicht.

`sessions_yield` beendet absichtlich den aktuellen Turn, damit die nächste Nachricht das
Follow-up-Ereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn
Abschlussergebnisse als nächste Nachricht eintreffen sollen, anstatt
Poll-Schleifen zu bauen.

`subagents` ist der Sichtbarkeitshelfer für bereits gestartete OpenClaw-
Sub-Agenten. Er unterstützt `action: "list"`, um aktive/aktuelle Läufe zu prüfen.

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe.
Es ist immer nicht blockierend -- es kehrt sofort mit einer `runId` und
`childSessionKey` zurück. Native Sub-Agent-Läufe erhalten die delegierte Aufgabe in der
ersten sichtbaren `[Subagent Task]`-Nachricht der Kind-Sitzung, während der System-
Prompt nur Sub-Agent-Runtime-Regeln und Routing-Kontext enthält.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- `model`- und `thinking`-Overrides für die Kind-Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für das Kind zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das Kind das aktuelle
  Anforderertranskript benötigt; lassen Sie es weg oder verwenden Sie `context: "isolated"` für ein sauberes Kind.
  Thread-gebundene native Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern
  `threadBindings.defaultSpawnContext` nichts anderes vorgibt.

Standardmäßige Leaf-Sub-Agenten erhalten keine Sitzungswerkzeuge. Wenn
`maxSpawnDepth >= 2`, erhalten Orchestrator-Sub-Agenten auf Tiefe 1 zusätzlich
`sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie
ihre eigenen Kinder verwalten können. Leaf-Läufe erhalten weiterhin keine rekursiven
Orchestrierungswerkzeuge.

Nach Abschluss postet ein Ankündigungsschritt das Ergebnis im Kanal des Anforderers.
Die Abschlusszustellung bewahrt gebundenes Thread-/Topic-Routing, sofern verfügbar, und wenn
der Abschlussursprung nur einen Kanal identifiziert, kann OpenClaw dennoch die
gespeicherte Route (`lastChannel` / `lastTo`) der Anforderersitzung für direkte
Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungswerkzeuge sind so begrenzt, dass sie einschränken, was der Agent sehen kann:

| Stufe   | Geltungsbereich                         |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen für diesen Agenten        |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Standard ist `tree`. Sandboxed-Sitzungen werden unabhängig von der
Konfiguration auf `tree` begrenzt.

## Weitere Informationen

- [Sitzungsverwaltung](/de/concepts/session) -- Routing, Lebenszyklus, Wartung
- [ACP-Agenten](/de/tools/acp-agents) -- Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent) -- Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration) -- Konfigurationsoptionen für Sitzungswerkzeuge

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
