---
read_when:
    - Sie möchten verstehen, über welche Sitzungswerkzeuge der Agent verfügt
    - Sie möchten sitzungsübergreifenden Zugriff oder das Starten von Sub-Agenten konfigurieren
    - Sie möchten den Status gestarteter Unteragenten überprüfen
summary: Agent-Tools für sitzungsübergreifenden Status, Abruf, Nachrichtenaustausch und die Orchestrierung von Sub-Agenten
title: Sitzungswerkzeuge
x-i18n:
    generated_at: "2026-07-24T04:32:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ceaf48addc9fc57afe2f6428cda03ed8b19f4efce93b13b58b7ef493a41c62fe
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw stellt Agenten Werkzeuge bereit, um sitzungsübergreifend zu arbeiten, den Status zu prüfen und Sub-Agenten zu orchestrieren.

## Verfügbare Werkzeuge

| Werkzeug                 | Funktion                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| `sessions`           | Sichtbare Sitzungseinstellungen ändern und den globalen Sitzungskatalog für Gruppen verwalten  |
| `sessions_list`      | Sitzungen mit optionalen Filtern auflisten (Art, Bezeichnung, Agent, Archiv, Vorschau)  |
| `sessions_search`    | Sichtbare Sitzungsprotokolle durchsuchen und passende Auszüge zurückgeben             |
| `sessions_history`   | Das Protokoll einer bestimmten Sitzung lesen                                   |
| `sessions_send`      | Eine weitere Sitzung auf demselben Gateway ausführen und optional warten                 |
| `conversations_list` | Stabile externe Konversationsadressen auflisten                                 |
| `conversations_send` | An genau eine externe Konversation senden, ohne eine lokale Sitzung auszuführen     |
| `conversations_turn` | An genau eine externe Konversation senden und auf die zugehörige Antwort warten   |
| `sessions_spawn`     | Eine isolierte Sub-Agenten-Sitzung für Hintergrundarbeit starten                     |
| `sessions_yield`     | Den aktuellen Zug beenden und auf nachfolgende Ergebnisse von Sub-Agenten warten               |
| `subagents`          | Hintergrundarbeit in diesem Sitzungsbaum auflisten oder abbrechen                         |
| `session_status`     | Eine Karte im Stil von `/status` anzeigen und optional eine sitzungsspezifische Modellüberschreibung festlegen |

Diese Werkzeuge unterliegen weiterhin dem aktiven Werkzeugprofil und der Zulassen-/Ablehnen-Richtlinie. `tools.profile: "coding"` enthält den vollständigen Satz zur Sitzungsorchestrierung. `tools.profile: "messaging"` enthält die Selbstverwaltung von Sitzungen, Erkennung, Abruf, sitzungsübergreifende Nachrichtenübermittlung, Werkzeuge für externe Konversationen und den vollständigen Lebenszyklus zum Starten (`sessions_spawn`, `sessions_yield` und `subagents`). Die ausschließlich für die Benutzeroberfläche bestimmten Werkzeuge für Aufgabenvorschläge `spawn_task` und `dismiss_task` bleiben Werkzeuge des Coding-Profils.

Gruppen-, Provider-, Sandbox- und agentenspezifische Richtlinien können diese Werkzeuge nach der Profilphase weiterhin entfernen. Verwenden Sie `/tools` in der betroffenen Sitzung, um die tatsächlich verfügbare Werkzeugliste zu prüfen.

## Sitzungen auflisten und lesen

`sessions_list` gibt fokussierte Erkennungszeilen zurück: Sitzungsschlüssel, Agent, Art, Kanal, Bezeichnungs-/Titel-/Vorschaufelder, über- und untergeordnete Beziehungen, letzte Aktualisierung, Archivierungs-/Anheftungsstatus, Zustandsversion, Modell, Kontext-/Gesamt-Tokenanzahl, Ausführungsstatus und ob die letzte Ausführung abgebrochen wurde. Filtern Sie nach `kinds` (Array; akzeptierte Werte: `main`, `group`, `cron`, `hook`, `node`, `other`), dem exakten `label`, dem exakten `agentId`, dem Text `search` oder der Aktualität (`activeMinutes`). Standardmäßig werden aktive Sitzungen zurückgegeben; übergeben Sie stattdessen `archived: true`, um archivierte Sitzungen zu prüfen. Legen Sie `includeDerivedTitles`, `includeLastMessage` oder `messageLimit` (auf 20 begrenzt) fest, wenn Sie eine postfachähnliche Triage benötigen: einen auf den Sichtbarkeitsbereich beschränkten abgeleiteten Titel, einen Vorschauauszug der letzten Nachricht oder begrenzte aktuelle Nachrichten in jeder Zeile. Zustellungsrouting, interne Sitzungs-IDs, ausführungsspezifische Zeitangaben/Einstellungen, Kostenschätzungen und Protokollpfade werden absichtlich ausgelassen; verwenden Sie `session_status`, Konversationswerkzeuge und `sessions_history` für diese eigentümerspezifischen Details. Abgeleitete Titel und Vorschauen werden nur für Sitzungen erstellt, die der Aufrufer gemäß der konfigurierten Sichtbarkeitsrichtlinie für Sitzungswerkzeuge bereits sehen kann, sodass nicht zugehörige Sitzungen verborgen bleiben. Wenn die Sichtbarkeit eingeschränkt ist, gibt `sessions_list` optionale `visibility`-Metadaten zurück, die den wirksamen Modus und eine Warnung anzeigen, dass die Ergebnisse möglicherweise auf den Sichtbarkeitsbereich beschränkt sind.

`sessions_history` ruft das Konversationsprotokoll einer bestimmten Sitzung ab. Standardmäßig werden Werkzeugergebnisse ausgeschlossen; übergeben Sie `includeTools: true`, um sie anzuzeigen. Verwenden Sie `limit` für den neuesten begrenzten Endabschnitt. Übergeben Sie `offset: 0`, wenn Sie Paginierungsmetadaten benötigen, und übergeben Sie anschließend die zurückgegebenen `nextOffset`-Werte, um rückwärts durch ältere OpenClaw-Protokollfenster zu blättern, ohne Rohprotokolldateien zu lesen. Explizite Offset-Seiten führen externe CLI-Fallback-Importe nicht zusammen; verwenden Sie die standardmäßige Ansicht des neuesten Endabschnitts (ohne `offset`), wenn Sie diesen zusammengeführten Anzeigeverlauf benötigen.

Die zurückgegebene Ansicht ist absichtlich begrenzt und sicherheitsgefiltert:

- Assistententext wird vor dem Abruf normalisiert:
  - Thinking-Tags werden entfernt
  - `<relevant-memories>`- / `<relevant_memories>`-Gerüstblöcke werden entfernt
  - Werkzeugaufruf-XML-Nutzlastblöcke im Klartext wie `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` und `<function_calls>...</function_calls>` werden entfernt, einschließlich abgeschnittener Nutzlasten, die nie ordnungsgemäß geschlossen werden
  - herabgestufte Gerüststrukturen für Werkzeugaufrufe/-ergebnisse wie `[Tool Call: ...]`, `[Tool Result ...]` und `[Historical context ...]` werden entfernt
  - offengelegte Modellsteuerungs-Token wie `<|assistant|>`, andere ASCII-`<|...|>`-Token und vollbreite `<｜...｜>`-Varianten werden entfernt
  - fehlerhaftes MiniMax-Werkzeugaufruf-XML wie `<invoke ...>` / `</minimax:tool_call>` wird entfernt
- Anmeldedaten-/Token-ähnlicher Text wird vor der Rückgabe geschwärzt
- lange Textblöcke werden abgeschnitten
- bei sehr großen Verläufen können ältere Zeilen entfallen oder eine übergroße Zeile durch `[sessions_history omitted: message too large]` ersetzt werden
- das Werkzeug meldet Zusammenfassungskennzeichen wie `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` und Paginierungsmetadaten

Verwenden Sie den zurückgegebenen **Sitzungsschlüssel** (wie `"main"`) mit `sessions_history`, `sessions_send` und `session_status`. Diese Zielwerkzeuge können auch eine bekannte Sitzungs-ID auflösen, aber `sessions_list` legt interne IDs nicht offen.

Wenn Sie das exakte Rohprotokoll benötigen, prüfen Sie die bereichsgebundenen SQLite-Protokollzeilen, statt `sessions_history` als ungefilterte Ausgabe zu behandeln.

Verwenden Sie [`sessions_search`](/de/concepts/session-search) für den exakten Volltextabruf in sichtbarem Benutzer- und Assistenten-Protokolltext. Die Ergebnisse enthalten einen `sessionKey` für einen nachfolgenden `sessions_history`-Aufruf; Sichtbarkeitsfilterung, Schwärzung von Auszügen und Ausgabegrenzen entsprechen der Verlaufsgrenze.

## Sitzungseinstellungen und Gruppen verwalten

Das eigentümergeschützte Werkzeug `sessions` stellt zwei begrenzte Selbstverwaltungsbereiche bereit:

- `action: "patch"` ändert standardmäßig die aktuelle Sitzung oder eine andere sichtbare, über `sessionKey` ausgewählte Sitzung. Damit können Bezeichnung, Seitenleistensymbol, Anheftungs-/Archivierungsstatus, Modell und Thinking-Stufe festgelegt werden. Aktionen zum Zurücksetzen, Löschen oder zur Compaction werden nicht bereitgestellt.
- `group_list`, `group_set`, `group_rename` und `group_delete` verwalten den globalen, geordneten Sitzungskatalog für Gruppen. `group_set` ersetzt die geordnete Namensliste, statt einen einzelnen Eintrag zu ändern.

Eine vom Agenten ausgewählte Modelländerung bleibt reversibel, bis diese Auswahl eine erfolgreiche Ausführung abschließt. Wenn das ausgewählte Modell aufgrund eines Authentifizierungs-, Abrechnungs- oder „Modell nicht gefunden“-Fehlers definitiv nicht verwendbar ist, stellt OpenClaw das vorherige Modell wieder her und schreibt einen sichtbaren Systemhinweis. Vorübergehende Fehler durch Ratenbegrenzung, Überlastung, Zeitüberschreitung, Netzwerk oder Server machen die Auswahl nicht rückgängig.

## Sitzungen im Vergleich zu Konversationen

Eine **Sitzung** ist lokaler Modellkontext. Eine **Konversation** ist eine exakte externe Adresse, etwa ein Peer, Kanal oder Thread. Beide sind miteinander verknüpft, aber nicht austauschbar: Direktnachrichten können sich eine `main`-Sitzung teilen und dennoch separate Konversationsadressen behalten.

`conversations_list` gibt undurchsichtige `conversationRef`-Werte für den aktiven Agenten zurück. Mit einem expliziten `channel` aktualisiert das Gateway außerdem Adressen aus dem lokalen Verzeichnis dieses Kanals, beispielsweise genehmigte Reef-Peers; verwenden Sie `query`, um einen bestimmten Peer außerhalb der aktuellen Ergebnisseite zu finden. Die Erkennung katalogisiert die Adresse, ohne eine Modellkontextsitzung zu erstellen; die zugrunde liegende Sitzung wird erst erstellt, wenn die Zustellung oder der eingehende Kontext sie benötigt. Konversationserkennung und -zustellung sind ausschließlich Eigentümern vorbehalten, da sie die Kanalanmeldedaten des Gateways verwenden. Verwenden Sie `conversations_send` für eine Zustellung ohne Warten auf das Ergebnis. Verwenden Sie `conversations_turn`, wenn die entfernte Antwort zum aktuellen Modellzug gehört: Das Gateway reserviert eine Transportnachrichten-ID, speichert vor der Transport-E/A einen Zustellungsvorgang und eine Warteschlangenabsicht und gibt die zugehörige Antwort über das Werkzeug zurück, statt einen zweiten lokalen Agentenzug zu starten. Zustellungsvorgänge liegen außerhalb von Modellprotokollen; eine erfasste Antwort wird nur als Nebenartefakt aufbewahrt, während das Werkzeugergebnis den Modellkontext enthält. Wenn das Gateway nach der Einreihung in die Warteschlange neu startet, kann die Zustellung wiederhergestellt werden, aber eine spätere Antwort folgt der gewöhnlichen Verarbeitung eingehender Nachrichten, weil der prozesslokale Wartende nicht mehr vorhanden ist. Unaufgeforderte eingehende Nachrichten durchlaufen immer weiterhin den normalen Kanalverarbeitungspfad.

Verwenden Sie das gemeinsame Werkzeug `message`, wenn Sie bereits über ein explizites rohes Kanalziel verfügen oder eine kanalspezifische Aktion benötigen. Konversationsreferenzen sind auf den aktiven Agenten beschränkt und sollten über `conversations_list` bezogen, nicht aus Sitzungsschlüsseln konstruiert werden.

Im Code Mode verwenden die Konversationswerkzeuge ihre exakten Gateway-Ausgabeverträge erneut. Eine einzelne `exec`-Zelle kann Adressen auflisten, einen zurückgegebenen `conversationRef` auswählen und `conversations_send` oder `conversations_turn` aufrufen; die normalen Werkzeugrichtlinien und Genehmigungen gelten weiterhin für die verschachtelten Aufrufe.

## Sitzungsübergreifende Nachrichten senden

`sessions_send` führt eine andere Sitzung auf demselben Gateway aus und wartet optional auf die Antwort. Das jeweilige `sessionKey`, `label` oder `agentId` wählt den lokalen Modellkontext aus, nicht ein externes Ziel. Die resultierende Antwort kann weiterhin über den eingerichteten Zustellungskontext des Anforderers oder Ziels angekündigt werden; dieses bestehende Verhalten bleibt unverändert. Verwenden Sie für die exakte externe Zustellung ein Konversationswerkzeug oder `message` mit einem expliziten Kanal und Ziel.

- **Senden ohne Warten:** Legen Sie `timeoutSeconds: 0` fest, um die Nachricht einzureihen und sofort zurückzukehren.
- **Auf Antwort warten:** Legen Sie eine Zeitüberschreitung fest, um die Antwort direkt zu erhalten.

Auf Threads beschränkte Chatsitzungen, etwa Schlüssel mit der Endung `:thread:<id>`, sind keine gültigen `sessions_send`-Ziele. Verwenden Sie den Sitzungsschlüssel des übergeordneten Kanals für die Koordination zwischen Agenten, damit über Werkzeuge weitergeleitete Nachrichten nicht innerhalb eines aktiven, für Menschen sichtbaren Threads erscheinen.

Nachrichten und A2A-Folgeantworten werden im empfangenden Prompt (`[Inter-session message ... isUser=false]`) und in der Protokollherkunft als sitzungsübergreifende Daten gekennzeichnet. Der empfangende Agent sollte sie als über Werkzeuge weitergeleitete Daten behandeln, nicht als direkt vom Endbenutzer verfasste Anweisung.

Nachdem das Ziel geantwortet hat, kann OpenClaw eine **Rückantwortschleife** ausführen, bei der die Agenten bis zum integrierten Limit abwechselnd Nachrichten senden. Der Zielagent kann mit `REPLY_SKIP` antworten, um die Schleife vorzeitig zu beenden.

Übergeben Sie `watch: true`, um den Absender außerdem als Beobachter für Zustandsänderungen des Ziels zu registrieren: Wenn ein anderer Akteur dem Ziel später eine direkte menschliche Nachricht sendet oder sein Ziel ändert, erhält der Absender einen Systemhinweis, der auf `session_status` `changesSince` verweist. Die Registrierung erfolgt nach erfolgreicher Weiterleitung, zielt auf die Sitzung, die die Nachricht tatsächlich empfangen hat, und beginnt mit deren aktueller Zustandsversion, sodass nur spätere Änderungen Hinweise auslösen. Das Ergebnis meldet `watched: true`, wenn die Registrierung erfolgreich war. Siehe [Kenntnis des Sitzungszustands](/de/concepts/session-state).

## Status- und Orchestrierungshilfen

`session_status` ist das schlanke, zu `/status` äquivalente Werkzeug für die aktuelle oder eine andere sichtbare Sitzung. Es meldet Nutzung, Zeit, Modell-/Laufzeitzustand und gegebenenfalls den Kontext verknüpfter Hintergrundaufgaben. Wie `/status` kann es spärliche Token-/Cache-Zähler aus dem neuesten Protokolleintrag zur Nutzung ergänzen, und `model=default` entfernt eine sitzungsspezifische Überschreibung. Verwenden Sie `sessionKey="current"` für die aktuelle Sitzung des Aufrufers; sichtbare Clientbezeichnungen wie `openclaw-tui` sind keine Sitzungsschlüssel.

Wenn Routenmetadaten verfügbar sind, enthält `session_status` außerdem einen sichtbaren `Route context`-JSON-Block und entsprechende strukturierte `details`-Felder. Diese Felder unterscheiden den Sitzungsschlüssel von der Route, die derzeit den Live-Lauf verarbeitet:

- `origin` gibt an, wo die Sitzung erstellt wurde, oder den aus einem zustellbaren Sitzungsschlüsselpräfix abgeleiteten Provider, wenn in älteren Zuständen keine Ursprungsmetadaten gespeichert sind.
- `active` ist die aktuelle Route des Live-Laufs. Sie wird nur für die Live-Sitzung oder die derzeit verarbeitete Sitzung gemeldet.
- `deliveryContext` ist die in der Sitzung gespeicherte persistente Zustellroute, die OpenClaw für spätere Zustellungen wiederverwenden kann, selbst wenn die aktive Oberfläche abweicht.

## Änderungen des Sitzungszustands

OpenClaw führt ein dauerhaftes Signalprotokoll wesentlicher Änderungen des Sitzungszustands (direkte menschliche Nachrichten an überwachte Sitzungen, Ergebnisse untergeordneter Läufe, Zieländerungen, Compaction). `sessions_list`-Zeilen und `session_status` stellen die `stateVersion` der Sitzung bereit, und `session_status` akzeptiert `changesSince: <version>`, um die typisierten Ereignisse nach dieser Version zurückzugeben, wobei `historyGap` exakt signalisiert, wenn die angeforderte Version älter als der aufbewahrte Verlauf ist. Überwachende Instanzen – automatisch übergeordnete Spawn-Sitzungen, explizit `sessions_send watch: true` – erhalten einen einzigen zusammengefassten Hinweis auf einen veralteten Zustand, wenn ein anderer Akteur eine überwachte Sitzung ändert.

Zustandsänderungsereignisse lassen wiederholte Sitzungs-/Agent-IDs aus und stellen nur für das Modell nützliche Nutzlastfelder bereit (`outcome`, `channel` oder `turns`). Die Ereigniszusammenfassung und die Akteur-/Laufkennungen bleiben für den Abgleich verfügbar.

Unter [Kenntnis des Sitzungszustands](/de/concepts/session-state) finden Sie das vollständige Modell: Ereignisarten, Registrierung überwachender Instanzen, das Anti-Spam-Hinweisprotokoll, den Abgleichsablauf und die aktuellen Einschränkungen.

`sessions_yield` beendet absichtlich den aktuellen Turn, sodass die nächste Nachricht das erwartete Folgeereignis sein kann. Verwenden Sie es nach dem Starten von Sub-Agenten, wenn die Abschlussergebnisse als nächste Nachricht eintreffen sollen, anstatt Polling-Schleifen zu erstellen.

`subagents` ist die Sitzungshierarchieansicht für native Sub-Agent-Läufe und das gemeinsame Verzeichnis der Hintergrundaufgaben. `action: "list"` meldet aktive/kürzlich ausgeführte Sub-Agenten sowie bereichsgebundene ACP-, CLI-/Medien- und Cron-Aufgaben. `action: "cancel"` akzeptiert eine zurückgegebene `taskId` und kann nur Arbeiten innerhalb der vom Aufrufer kontrollierten Sitzungshierarchie stoppen; Sub-Agenten auf Blattebene können die Aufgabe einer anderen Sitzung nicht abbrechen.

## Starten von Sub-Agenten

`sessions_spawn` erstellt standardmäßig eine isolierte Sitzung für eine Hintergrundaufgabe. Der Vorgang ist immer nicht blockierend und gibt sofort eine `runId` und eine `childSessionKey` zurück. Native Sub-Agent-Läufe erhalten die delegierte Aufgabe in der ersten sichtbaren `[Subagent Task]`-Nachricht der untergeordneten Sitzung, während der System-Prompt nur die Laufzeitregeln und den Routingkontext des Sub-Agenten enthält.

Wichtige Optionen:

- `runtime: "subagent"` (Standard) oder `"acp"` für externe Harness-Agenten.
- Überschreibungen durch `model` und `thinking` für die untergeordnete Sitzung.
- `thread: true`, um den Spawn an einen Chat-Thread zu binden (Discord, Slack usw.).
- `sandbox: "require"`, um Sandboxing für die untergeordnete Sitzung zu erzwingen.
- `context: "fork"` für native Sub-Agenten, wenn die untergeordnete Sitzung das aktuelle Transkript des Anfragenden benötigt; lassen Sie die Option weg oder verwenden Sie `context: "isolated"` für eine neue untergeordnete Sitzung ohne Transkript. `context: "fork"` ist nur mit `runtime: "subagent"` gültig. An Threads gebundene native Sub-Agenten verwenden standardmäßig `context: "fork"`, sofern `threadBindings.defaultSpawnContext` nichts anderes angibt.
- `visible: true`, um anstelle einer verborgenen Sub-Agent-Sitzung eine persistente Dashboard-Sitzung zu erstellen. Sichtbare Spawns unterstützen ein explizites Modell, ein Arbeitsverzeichnis, einen Transkript-Fork desselben Agenten und optional einen [verwalteten Worktree](/de/concepts/managed-worktrees). Die genauen Kompatibilitätseinschränkungen finden Sie unter [Sub-Agenten](/de/tools/subagents#tool-parameters).

Standardmäßige Sub-Agenten auf Blattebene erhalten keine Sitzungswerkzeuge. Bei `maxSpawnDepth >= 2` erhalten orchestrierende Sub-Agenten der Tiefe 1 zusätzlich `sessions_spawn`, `subagents`, `sessions_list` und `sessions_history`, sodass sie ihre eigenen untergeordneten Agenten verwalten können. Läufe auf Blattebene erhalten weiterhin keine Werkzeuge für rekursive Orchestrierung.

Nach Abschluss sendet ein Ankündigungsschritt das Ergebnis an den Kanal des Anfragenden. Bei der Abschlusszustellung bleibt das Routing für gebundene Threads/Themen erhalten, sofern verfügbar. Wenn der Abschlussursprung nur einen Kanal angibt, kann OpenClaw dennoch die gespeicherte Route der Sitzung des Anfragenden (`lastChannel` / `lastTo`) für die direkte Zustellung wiederverwenden.

Informationen zum ACP-spezifischen Verhalten finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Sichtbarkeit

Sitzungswerkzeuge sind in ihrem Geltungsbereich eingeschränkt, um zu begrenzen, was der Agent sehen kann:

| Ebene   | Geltungsbereich                                                      |
| ------- | ---------------------------------------------------------- |
| `self`  | Nur die aktuelle Sitzung                                   |
| `tree`  | Aktuelle + gestartete Sitzungen; Lesezugriffe umfassen überwachte Gruppen desselben Agenten |
| `agent` | Alle Sitzungen dieses Agenten                                |
| `all`   | Alle Sitzungen (agentenübergreifend, sofern konfiguriert)                   |

Der Standardwert ist `tree`. Sitzungen in einer Sandbox sind unabhängig von der Konfiguration auf `tree` beschränkt.
Mit dem standardmäßigen `session.dmScope: "main"` macht Gruppenaktivität überwachte
Gruppensitzungen desselben Agenten aus der Hauptsitzung lesbar.

## Weiterführende Informationen

- [Sitzungsverwaltung](/de/concepts/session): Routing, Lebenszyklus, Wartung
- [Sub-Agenten](/de/tools/subagents): Lebenszyklus und Zustellung untergeordneter Sitzungen
- [ACP-Agenten](/de/tools/acp-agents): Starten externer Harness-Agenten
- [Multi-Agent](/de/concepts/multi-agent): Multi-Agent-Architektur
- [Gateway-Konfiguration](/de/gateway/configuration): Konfigurationsoptionen für Sitzungswerkzeuge

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
