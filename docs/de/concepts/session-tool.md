---
read_when:
    - Sie möchten verstehen, über welche Sitzungstools der Agent verfügt
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agenten konfigurieren
    - Sie möchten den Status gestarteter Unteragenten prüfen
summary: Agent-Tools für sitzungsübergreifenden Status, Abruf, Nachrichtenaustausch und die Orchestrierung von Sub-Agenten
title: Sitzungswerkzeuge
x-i18n:
    generated_at: "2026-07-12T15:17:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6b584912c012b632d001e7f77dc704b8b11ab2e897ed62238675026078039819
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw stellt Agenten Werkzeuge bereit, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und Sub-Agenten zu orchestrieren.

## Verfügbare Werkzeuge

| Werkzeug           | Funktion                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Archiv, Vorschau) |
| `sessions_history` | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`    | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`   | Eine isolierte Sub-Agenten-Sitzung für Hintergrundarbeit starten            |
| `sessions_yield`   | Den aktuellen Zug beenden und auf nachfolgende Ergebnisse von Sub-Agenten warten |
| `subagents`        | Den Status gestarteter Sub-Agenten für diese Sitzung auflisten              |
| `session_status`   | Eine Karte im Stil von `/status` anzeigen und optional eine sitzungsspezifische Modellüberschreibung festlegen |

Diese Werkzeuge unterliegen weiterhin dem aktiven Werkzeugprofil und der Zulassen-/Verweigern-Richtlinie. `tools.profile: "coding"` enthält den vollständigen Satz zur Sitzungsorchestrierung, einschließlich `sessions_spawn`, `sessions_yield` und `subagents`. `tools.profile: "messaging"` enthält Werkzeuge für die sitzungsübergreifende Kommunikation (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), jedoch nicht das Starten von Sub-Agenten. Um ein Messaging-Profil beizubehalten und dennoch native Delegierung zu ermöglichen, fügen Sie Folgendes hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und agentspezifische Richtlinien können diese Werkzeuge nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` in der betroffenen Sitzung, um die effektive Werkzeugliste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, agentId, ihrer Art, ihrem Kanal, Modell, ihrer Tokenanzahl und ihren Zeitstempeln zurück. Filtern Sie nach `kinds` (Array; akzeptierte Werte: `main`, `group`, `cron`, `hook`, `node`, `other`), genauem `label`, genauer `agentId`, `search`-Text oder Aktualität (`activeMinutes`). Standardmäßig werden aktive Sitzungen zurückgegeben; übergeben Sie stattdessen `archived: true`, um archivierte Sitzungen zu prüfen. Zeilen enthalten den Status `pinned` und `archived`. Legen Sie `includeDerivedTitles`, `includeLastMessage` oder `messageLimit` (auf 20 begrenzt) fest, wenn Sie eine Postfach-ähnliche Triage benötigen: einen sichtbarkeitsbezogen abgeleiteten Titel, einen Vorschauausschnitt der letzten Nachricht oder eine begrenzte Anzahl aktueller Nachrichten je Zeile. Abgeleitete Titel und Vorschauen werden nur für Sitzungen erzeugt, die der Aufrufer gemäß der konfigurierten Sichtbarkeitsrichtlinie für Sitzungswerkzeuge bereits sehen kann, sodass nicht zugehörige Sitzungen verborgen bleiben. Wenn die Sichtbarkeit eingeschränkt ist, gibt `sessions_list` optionale `visibility`-Metadaten zurück, die den effektiven Modus sowie eine Warnung anzeigen, dass die Ergebnisse möglicherweise auf den Geltungsbereich beschränkt sind.

`sessions_history` ruft das Gesprächstranskript für eine bestimmte Sitzung ab. Standardmäßig sind Werkzeugergebnisse ausgeschlossen; übergeben Sie `includeTools: true`, um sie anzuzeigen. Verwenden Sie `limit` für den neuesten begrenzten Abschnitt. Übergeben Sie `offset: 0`, wenn Sie Metadaten zur Seitennavigation benötigen, und übergeben Sie anschließend die zurückgegebenen `nextOffset`-Werte, um rückwärts durch ältere OpenClaw-Transkriptfenster zu blättern, ohne rohe Transkriptdateien zu lesen. Explizite Offset-Seiten führen externe CLI-Fallback-Importe nicht zusammen; verwenden Sie die standardmäßige Ansicht des neuesten Abschnitts (ohne `offset`), wenn Sie diesen zusammengeführten Anzeigeverlauf benötigen.

Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - Gerüstblöcke wie `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Nutzlastblöcke von Werkzeugaufrufen im Klartext wie `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener Nutzlasten, die nie ordnungsgemäß geschlossen werden
  - herabgestufte Gerüste für Werkzeugaufrufe/-ergebnisse wie `[Tool Call: ...]`, `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - offengelegte Modellsteuerungs-Tokens wie `<|assistant|>`, andere ASCII-Tokens der Form `<|...|>` und vollbreite Varianten der Form `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-XML für Werkzeugaufrufe wie `<invoke ...>` / `</minimax:tool_call>` wird entfernt
- Text, der Anmeldedaten oder Tokens ähnelt, wird vor der Rückgabe unkenntlich gemacht
- lange Textblöcke werden abgeschnitten
- bei sehr großen Verläufen können ältere Zeilen entfallen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzt werden
- das Werkzeug meldet Zusammenfassungskennzeichen wie `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` sowie Metadaten zur Seitennavigation

Beide Werkzeuge akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID** aus einem vorherigen Auflistungsaufruf.

Wenn Sie das exakte Rohtranskript benötigen, prüfen Sie die SQLite-Transkriptzeilen im jeweiligen Geltungsbereich, anstatt `sessions_history` als ungefilterte Ausgabe zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` übermittelt eine Nachricht an eine andere Sitzung und wartet optional auf die Antwort:

- **Senden ohne Warten:** Legen Sie `timeoutSeconds: 0` fest, um die Nachricht in die Warteschlange einzureihen und sofort zurückzukehren.
- **Auf Antwort warten:** Legen Sie ein Zeitlimit fest, um die Antwort direkt zu erhalten.

Threadbezogene Chatsitzungen, etwa Schlüssel mit der Endung `:thread:<id>`, sind keine gültigen Ziele für `sessions_send`. Verwenden Sie zur Koordination zwischen Agenten den Schlüssel der übergeordneten Kanalsitzung, damit über Werkzeuge weitergeleitete Nachrichten nicht innerhalb eines aktiven, für Menschen sichtbaren Threads erscheinen.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt (`[Inter-session message ... isUser=false]`) und in der Transkriptherkunft als sitzungsübergreifende Daten gekennzeichnet. Der empfangende Agent sollte sie als über Werkzeuge weitergeleitete Daten behandeln, nicht als direkt von einem Endbenutzer verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Rückantwortschleife** ausführen, in der die Agenten abwechselnd Nachrichten senden (bis zu `session.agentToAgent.maxPingPongTurns`, Bereich 0-20, Standardwert 5). Der Zielagent kann mit `REPLY_SKIP` antworten, um die Schleife vorzeitig zu beenden.

## Status- und Orchestrierungshilfen

`session_status` ist das leichtgewichtige, `/status` entsprechende Werkzeug für die aktuelle oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Laufzeitstatus und gegebenenfalls den Kontext verknüpfter Hintergrundaufgaben. Wie `/status` kann es lückenhafte Token-/Cache-Zähler aus dem neuesten Transkripteintrag zur Nutzung ergänzen, und `model=default` entfernt eine sitzungsspezifische Überschreibung. Verwenden Sie `sessionKey="current"` für die aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind keine Sitzungsschlüssel.

Wenn Routing-Metadaten verfügbar sind, enthält `session_status` außerdem einen sichtbaren JSON-Block `Route context` und entsprechende strukturierte `details`-Felder. Diese Felder unterscheiden den Sitzungsschlüssel von der Route, die derzeit den aktiven Lauf verarbeitet:

- `origin` gibt an, wo die Sitzung erstellt wurde, oder den aus einem zustellbaren Sitzungsschlüsselpräfix abgeleiteten Provider, wenn bei älteren Zuständen gespeicherte Ursprungsmetadaten fehlen.
- `active` ist die aktuelle Route des aktiven Laufs. Sie wird nur für die gerade verarbeitete aktive oder aktuelle Sitzung gemeldet.
- `deliveryContext` ist die dauerhaft gespeicherte Zustellroute der Sitzung, die OpenClaw für spätere Zustellungen wiederverwenden kann, selbst wenn sich die aktive Oberfläche unterscheidet.

## Änderungen des Sitzungsstatus

OpenClaw führt nach bestem Bemühen ein Signalprotokoll für ausgewählte Änderungen des Sitzungsstatus: direkte menschliche Nachrichten an untergeordnete Sitzungen, Abschluss oder Fehlschlag untergeordneter Läufe, Erstellung untergeordneter Sitzungen, Zieländerungen und Compaction. Abgebrochene und wegen Zeitüberschreitung beendete untergeordnete Läufe werden als Fehlschläge aufgezeichnet, wobei das konkrete Ergebnis (`cancelled`, `timeout` oder `error`) in der Ereignisnutzlast erhalten bleibt. Das Protokoll enthält Metadaten und einzeilige Zusammenfassungen, niemals Nachrichteninhalte. Seine `stateVersion` ist der Kopf des Signalprotokolls der Sitzung und keine transaktionale Change-Data-Capture-Version; die Änderung des Sitzungsspeichers und das Anhängen des Signals verwenden getrennte Speicher, sodass ein fehlgeschlagenes Anhängen protokolliert wird, ohne den auslösenden Zug fehlschlagen zu lassen.

`sessions_list` enthält `stateVersion` in Zeilen mit protokollierten Änderungen. `session_status` gibt `stateVersion` immer in strukturierten Details zurück. Übergeben Sie `changesSince: <previousStateVersion>`, um bis zu 200 gespeicherte Ereignisse nach dieser Version abzurufen; dieser Lesevorgang bestätigt oder verschiebt die Benachrichtigungscursor des übergeordneten Elements nicht. Ein Ergebnis `historyGap: true` bedeutet, dass die angeforderte Version älter als der gespeicherte Verlauf ist. Aktualisieren Sie daher den gesamten Sitzungsstatus, statt die Antwort als exaktes Delta zu behandeln.

Wenn ein anderer Akteur einen direkten menschlichen Zug an eine überwachte untergeordnete Sitzung sendet oder deren Ziel ändert, erhält die übergeordnete Sitzung einen Systemhinweis, der sie auffordert, `session_status` mit der zuletzt gesehenen Version aufzurufen. Übergeordnete Hauptsitzungen werden proaktiv aktiviert. Verschachtelte übergeordnete Sub-Agenten erhalten den Hinweis bei ihrem nächsten Zug, da das Heartbeat-Routing ihre Warteschlange nicht direkt adressieren kann. Abschlussankündigungen bleiben für die reguläre Zustellung des Abschlusses untergeordneter Läufe zuständig.

Der Verlauf ist auf 30 Tage und 50,000 Zeilen begrenzt, während sitzungsspezifische Köpfe nach der Bereinigung monoton bleiben. Die Hinweiszustellung verwendet die speicherinterne Systemereignis-Warteschlange des Gateways und setzt voraus, dass ein Gateway-Prozess die Zustellung für die gemeinsame Statusdatenbank übernimmt. Mehrere Gateways teilen sich weiterhin das dauerhafte Protokoll und die `changesSince`-Abgleichsoberfläche, aber v1 überträgt keine Hinweise prozessübergreifend. Hinweise an übergeordnete Sitzungen erfordern einen agentenqualifizierten Schlüssel der übergeordneten Sitzung; unter `session.scope="global"` ist der gemeinsame Schlüssel `global` über mehrere Agenten hinweg mehrdeutig, sodass diese übergeordneten Sitzungen in v1 das dauerhafte Protokoll und `changesSince`, aber keine proaktiven Hinweise erhalten.

`sessions_yield` beendet absichtlich den aktuellen Zug, damit die nächste Nachricht das Folgeereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn Abschlussergebnisse als nächste Nachricht eintreffen sollen, statt Abfrageschleifen zu erstellen.

`subagents` ist die Sichtbarkeitshilfe für bereits gestartete OpenClaw-Sub-Agenten. Es unterstützt `action: "list"`, um aktive und kürzlich ausgeführte Läufe zu prüfen.

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe. Es ist immer nicht blockierend und gibt sofort eine `runId` und einen `childSessionKey` zurück. Native Sub-Agenten-Läufe erhalten die delegierte Aufgabe in der ersten sichtbaren `[Subagent Task]`-Nachricht der untergeordneten Sitzung, während der System-Prompt nur Laufzeitregeln für Sub-Agenten und Routing-Kontext enthält.

Wichtige Optionen:

- `runtime: "subagent"` (Standardwert) oder `"acp"` für Agenten externer Ausführungsumgebungen.
- Überschreibungen mit `model` und `thinking` für die untergeordnete Sitzung.
- `thread: true`, um den gestarteten Lauf an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für die untergeordnete Sitzung zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das untergeordnete Element das aktuelle Transkript des Anforderers benötigt; lassen Sie die Option weg oder verwenden Sie `context: "isolated"` für ein leeres untergeordnetes Element. `context: "fork"` ist nur mit `runtime: "subagent"` gültig. Threadgebundene native Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern `threadBindings.defaultSpawnContext` nichts anderes festlegt.

Standardmäßige Sub-Agenten auf Blattebene erhalten keine Sitzungswerkzeuge. Wenn `maxSpawnDepth >= 2` gilt, erhalten orchestrierende Sub-Agenten der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre eigenen untergeordneten Elemente verwalten können. Läufe auf Blattebene erhalten weiterhin keine rekursiven Orchestrierungswerkzeuge.

Nach dem Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Kanal des Anforderers. Die Zustellung des Abschlusses bewahrt nach Möglichkeit die gebundene Thread-/Themenweiterleitung. Wenn der Ursprung des Abschlusses nur einen Kanal identifiziert, kann OpenClaw weiterhin die gespeicherte Route der Sitzung des Anforderers (`lastChannel` / `lastTo`) für die direkte Zustellung wiederverwenden.

Informationen zu ACP-spezifischem Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungswerkzeuge sind auf einen Geltungsbereich beschränkt, um einzuschränken, was der Agent sehen kann:

| Ebene   | Geltungsbereich                           |
| ------- | ----------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                  |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen dieses Agenten             |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Der Standardwert ist `tree`. Sitzungen in einer Sandbox sind unabhängig von der Konfiguration auf `tree` beschränkt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session): Routing, Lebenszyklus, Wartung
- [Unteragenten](/de/tools/subagents): Lebenszyklus und Zustellung von untergeordneten Sitzungen
- [ACP-Agenten](/de/tools/acp-agents): Starten externer Harnesses
- [Multi-Agent](/de/concepts/multi-agent): Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration): Konfigurationsoptionen für Sitzungswerkzeuge

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
