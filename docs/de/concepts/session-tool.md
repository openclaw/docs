---
read_when:
    - Sie möchten verstehen, über welche Sitzungstools der Agent verfügt
    - Sie möchten den sitzungsübergreifenden Zugriff oder das Erstellen von Unteragenten konfigurieren
    - Sie möchten den Status gestarteter Sub-Agenten prüfen
summary: Agent-Tools für sitzungsübergreifenden Status, Abruf, Messaging und die Orchestrierung von Sub-Agenten
title: Sitzungswerkzeuge
x-i18n:
    generated_at: "2026-07-12T21:36:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw stellt Agenten Werkzeuge bereit, mit denen sie sitzungsübergreifend arbeiten, den Status prüfen und Sub-Agenten orchestrieren können.

## Verfügbare Werkzeuge

| Werkzeug            | Funktion                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| `sessions_list`     | Sitzungen mit optionalen Filtern auflisten (Art, Label, Agent, Archiv, Vorschau) |
| `sessions_history`  | Das Transkript einer bestimmten Sitzung lesen                               |
| `sessions_send`     | Eine Nachricht an eine andere Sitzung senden und optional warten            |
| `sessions_spawn`    | Eine isolierte Sub-Agent-Sitzung für Hintergrundaufgaben starten            |
| `sessions_yield`    | Den aktuellen Durchlauf beenden und auf nachfolgende Sub-Agent-Ergebnisse warten |
| `subagents`         | Den Status gestarteter Sub-Agenten für diese Sitzung auflisten              |
| `session_status`    | Eine Karte im Stil von `/status` anzeigen und optional eine sitzungsspezifische Modellüberschreibung festlegen |

Diese Werkzeuge unterliegen weiterhin dem aktiven Werkzeugprofil sowie der Zulassungs-/Verweigerungsrichtlinie. `tools.profile: "coding"` umfasst den vollständigen Satz zur Sitzungsorchestrierung, einschließlich `sessions_spawn`, `sessions_yield` und `subagents`. `tools.profile: "messaging"` umfasst Werkzeuge für die sitzungsübergreifende Nachrichtenübermittlung (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`), jedoch nicht das Starten von Sub-Agenten. Um ein Nachrichtenprofil beizubehalten und dennoch native Delegierung zu ermöglichen, fügen Sie Folgendes hinzu:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Gruppen-, Provider-, Sandbox- und agentenspezifische Richtlinien können diese Werkzeuge auch nach der Profilphase noch entfernen. Verwenden Sie `/tools` in der betroffenen Sitzung, um die tatsächlich verfügbare Werkzeugliste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt Sitzungen mit ihrem Schlüssel, ihrer agentId, Art, ihrem Kanal, Modell, ihren Token-Anzahlen und Zeitstempeln zurück. Filtern Sie nach `kinds` (Array; zulässige Werte: `main`, `group`, `cron`, `hook`, `node`, `other`), dem exakten `label`, der exakten `agentId`, `search`-Text oder Aktualität (`activeMinutes`). Standardmäßig werden aktive Sitzungen zurückgegeben; übergeben Sie stattdessen `archived: true`, um archivierte Sitzungen zu prüfen. Die Zeilen enthalten den Status `pinned` und `archived`. Legen Sie `includeDerivedTitles`, `includeLastMessage` oder `messageLimit` (begrenzt auf 20) fest, wenn Sie eine postfachähnliche Sichtung benötigen: einen sichtbarkeitsbeschränkten abgeleiteten Titel, einen Vorschauausschnitt der letzten Nachricht oder eine begrenzte Anzahl aktueller Nachrichten pro Zeile. Abgeleitete Titel und Vorschauen werden nur für Sitzungen erzeugt, die der Aufrufer gemäß der konfigurierten Sichtbarkeitsrichtlinie für Sitzungswerkzeuge bereits sehen kann; nicht zugehörige Sitzungen bleiben daher verborgen. Wenn die Sichtbarkeit eingeschränkt ist, gibt `sessions_list` optionale `visibility`-Metadaten zurück, die den tatsächlich geltenden Modus und einen Hinweis anzeigen, dass die Ergebnisse möglicherweise auf den Geltungsbereich beschränkt sind.

`sessions_history` ruft das Gesprächstranskript einer bestimmten Sitzung ab. Standardmäßig sind Werkzeugergebnisse ausgeschlossen; übergeben Sie `includeTools: true`, um sie anzuzeigen. Verwenden Sie `limit` für den neuesten begrenzten Ausschnitt. Übergeben Sie `offset: 0`, wenn Sie Paginierungsmetadaten benötigen, und verwenden Sie anschließend die zurückgegebenen `nextOffset`-Werte, um rückwärts durch ältere OpenClaw-Transkriptfenster zu blättern, ohne rohe Transkriptdateien zu lesen. Explizite Offset-Seiten führen externe CLI-Fallback-Importe nicht zusammen; verwenden Sie die standardmäßige Ansicht des neuesten Ausschnitts (ohne `offset`), wenn Sie diesen zusammengeführten Anzeigeverlauf benötigen.

Die zurückgegebene Ansicht ist bewusst begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - Gerüstblöcke vom Typ `<relevant-memories>` / `<relevant_memories>` werden entfernt
  - XML-Nutzlastblöcke für Werkzeugaufrufe im Klartext wie `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener Nutzlasten, die nie ordnungsgemäß geschlossen werden
  - herabgestufte Gerüstblöcke für Werkzeugaufrufe/-ergebnisse wie `[Tool Call: ...]`, `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - offengelegte Modellsteuerungstoken wie `<|assistant|>`, andere ASCII-Token vom Typ `<|...|>` und vollbreite Varianten vom Typ `<｜...｜>` werden entfernt
  - fehlerhaftes MiniMax-XML für Werkzeugaufrufe wie `<invoke ...>` / `</minimax:tool_call>` wird entfernt
- Zugangsdaten-/tokenähnlicher Text wird vor der Rückgabe unkenntlich gemacht
- lange Textblöcke werden abgeschnitten
- bei sehr umfangreichen Verläufen können ältere Zeilen entfallen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzt werden
- das Werkzeug meldet Zusammenfassungskennzeichen wie `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` und Paginierungsmetadaten

Beide Werkzeuge akzeptieren entweder einen **Sitzungsschlüssel** (wie `"main"`) oder eine **Sitzungs-ID** aus einem vorherigen Listenaufruf.

Wenn Sie das exakte Rohtranskript benötigen, prüfen Sie die entsprechenden SQLite-Transkriptzeilen, statt `sessions_history` als ungefilterte Ausgabe zu behandeln.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` übermittelt eine Nachricht an eine andere Sitzung und wartet optional auf die Antwort:

- **Senden ohne Warten:** Legen Sie `timeoutSeconds: 0` fest, um die Nachricht einzureihen und sofort zurückzukehren.
- **Auf Antwort warten:** Legen Sie ein Zeitlimit fest, um die Antwort direkt zu erhalten.

Threadbezogene Chatsitzungen, beispielsweise Schlüssel mit der Endung `:thread:<id>`, sind keine gültigen Ziele für `sessions_send`. Verwenden Sie für die Koordination zwischen Agenten den Sitzungsschlüssel des übergeordneten Kanals, damit über Werkzeuge weitergeleitete Nachrichten nicht in einem aktiven, für Menschen sichtbaren Thread erscheinen.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt (`[Inter-session message ... isUser=false]`) und in der Transkriptherkunft als sitzungsübergreifende Daten gekennzeichnet. Der empfangende Agent sollte sie als über Werkzeuge weitergeleitete Daten behandeln, nicht als direkt von einem Endbenutzer verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Rückantwortschleife** ausführen, in der die Agenten abwechselnd Nachrichten senden (bis zu `session.agentToAgent.maxPingPongTurns`, Bereich 0-20, Standardwert 5). Der Zielagent kann mit `REPLY_SKIP` antworten, um die Schleife vorzeitig zu beenden.

Übergeben Sie `watch: true`, um den Absender zusätzlich als Beobachter für Statusänderungen des Ziels zu registrieren: Wenn ein anderer Akteur dem Ziel später eine direkte menschliche Nachricht sendet oder dessen Ziel ändert, erhält der Absender einen Systemhinweis, der auf `changesSince` von `session_status` verweist. Die Registrierung erfolgt nach erfolgreicher Übermittlung, bezieht sich auf die Sitzung, die die Nachricht tatsächlich empfangen hat, und beginnt bei deren aktueller Statusversion, sodass nur spätere Änderungen Hinweise auslösen. Das Ergebnis meldet `watched: true`, wenn die Registrierung erfolgreich war. Siehe [Bewusstsein für den Sitzungsstatus](/concepts/session-state).

## Status- und Orchestrierungshilfen

`session_status` ist das leichtgewichtige, `/status` entsprechende Werkzeug für die aktuelle oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Laufzeitstatus und gegebenenfalls den Kontext verknüpfter Hintergrundaufgaben. Wie `/status` kann es unvollständige Token-/Cache-Zähler aus dem neuesten Transkriptnutzungseintrag ergänzen, und `model=default` entfernt eine sitzungsspezifische Überschreibung. Verwenden Sie `sessionKey="current"` für die aktuelle Sitzung des Aufrufers; sichtbare Client-Labels wie `openclaw-tui` sind keine Sitzungsschlüssel.

Wenn Routing-Metadaten verfügbar sind, enthält `session_status` außerdem einen sichtbaren JSON-Block `Route context` und entsprechende strukturierte `details`-Felder. Diese Felder unterscheiden den Sitzungsschlüssel von der Route, die derzeit den aktiven Durchlauf verarbeitet:

- `origin` gibt an, wo die Sitzung erstellt wurde, oder den Provider, der aus einem zustellbaren Sitzungsschlüsselpräfix abgeleitet wurde, wenn bei älteren Statusdaten keine Ursprungsmetadaten gespeichert sind.
- `active` ist die aktuelle Route des aktiven Durchlaufs. Sie wird nur für die gerade verarbeitete aktive oder aktuelle Sitzung gemeldet.
- `deliveryContext` ist die in der Sitzung gespeicherte persistente Zustellroute, die OpenClaw für eine spätere Zustellung wiederverwenden kann, selbst wenn sich die aktive Oberfläche unterscheidet.

## Änderungen des Sitzungsstatus

OpenClaw führt ein dauerhaftes Signalprotokoll wesentlicher Änderungen des Sitzungsstatus (direkte menschliche Nachrichten an beobachtete Sitzungen, Ergebnisse untergeordneter Durchläufe, Zieländerungen, Compaction). Zeilen von `sessions_list` und `session_status` stellen die `stateVersion` der Sitzung bereit, und `session_status` akzeptiert `changesSince: <version>`, um die typisierten Ereignisse nach dieser Version zurückzugeben. Dabei signalisiert `historyGap` exakt, wenn die angeforderte Version älter als der beibehaltene Verlauf ist. Beobachter – automatisch übergeordnete Starter und explizit `sessions_send watch: true` – erhalten einen zusammengefassten Hinweis auf einen veralteten Status, wenn ein anderer Akteur eine beobachtete Sitzung ändert.

Das vollständige Modell – Ereignisarten, Beobachterregistrierung, das Protokoll zur Vermeidung wiederholter Hinweise, den Abgleichsablauf und aktuelle Einschränkungen – finden Sie unter [Bewusstsein für den Sitzungsstatus](/concepts/session-state).

`sessions_yield` beendet bewusst den aktuellen Durchlauf, sodass die nächste Nachricht das Folgeereignis sein kann, auf das Sie warten. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn Abschlussergebnisse als nächste Nachricht eintreffen sollen, anstatt Abfrageschleifen zu erstellen.

`subagents` ist die Sichtbarkeitshilfe für bereits gestartete OpenClaw-Sub-Agenten. Es unterstützt `action: "list"`, um aktive und kürzlich abgeschlossene Durchläufe zu prüfen.

## Sub-Agenten starten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe. Der Vorgang ist immer nicht blockierend und gibt sofort eine `runId` und einen `childSessionKey` zurück. Native Sub-Agent-Durchläufe erhalten die delegierte Aufgabe in der ersten sichtbaren `[Subagent Task]`-Nachricht der untergeordneten Sitzung, während der System-Prompt nur Laufzeitregeln und Routing-Kontext für Sub-Agenten enthält.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- Überschreibungen mit `model` und `thinking` für die untergeordnete Sitzung.
- `thread: true`, um den Start an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für die untergeordnete Sitzung zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn das untergeordnete Element das aktuelle Transkript des Anforderers benötigt; lassen Sie die Option weg oder verwenden Sie `context: "isolated"` für ein neues untergeordnetes Element ohne Kontext. `context: "fork"` ist nur mit `runtime: "subagent"` gültig. Threadgebundene native Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern `threadBindings.defaultSpawnContext` nichts anderes vorgibt.

Standardmäßige untergeordnete Sub-Agenten erhalten keine Sitzungswerkzeuge. Wenn `maxSpawnDepth >= 2` gilt, erhalten orchestrierende Sub-Agenten der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, damit sie ihre eigenen untergeordneten Elemente verwalten können. Untergeordnete Durchläufe erhalten weiterhin keine rekursiven Orchestrierungswerkzeuge.

Nach Abschluss veröffentlicht ein Ankündigungsschritt das Ergebnis im Kanal des Anforderers. Die Abschlusszustellung behält nach Möglichkeit gebundenes Thread-/Themen-Routing bei. Wenn der Abschlussursprung nur einen Kanal angibt, kann OpenClaw dennoch die gespeicherte Route (`lastChannel` / `lastTo`) der Sitzung des Anforderers für die direkte Zustellung wiederverwenden.

ACP-spezifisches Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungswerkzeuge sind in ihrem Geltungsbereich eingeschränkt, um zu begrenzen, was der Agent sehen kann:

| Ebene   | Geltungsbereich                          |
| ------- | ---------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                 |
| `tree`  | Aktuelle Sitzung + gestartete Sub-Agenten |
| `agent` | Alle Sitzungen dieses Agenten            |
| `all`   | Alle Sitzungen (agentenübergreifend, falls konfiguriert) |

Standardmäßig gilt `tree`. Sandbox-Sitzungen sind unabhängig von der Konfiguration auf `tree` beschränkt.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session): Routing, Lebenszyklus, Wartung
- [Sub-Agenten](/de/tools/subagents): Lebenszyklus und Zustellung untergeordneter Sitzungen
- [ACP-Agenten](/de/tools/acp-agents): Starten externer Harness-Agenten
- [Multi-Agent](/de/concepts/multi-agent): Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration): Konfigurationsoptionen für Sitzungswerkzeuge

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
