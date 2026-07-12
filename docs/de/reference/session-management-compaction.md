---
read_when:
    - Sie müssen Sitzungs-IDs, Transkriptereignisse oder Felder von Sitzungszeilen debuggen.
    - Sie ändern das Verhalten der automatischen Compaction oder fügen Aufräumarbeiten vor der Compaction hinzu.
    - Sie möchten Speicher-Flushes oder stille Systemdurchläufe implementieren
summary: 'Detaillierter Einblick: Sitzungsspeicher und Transkripte, Lebenszyklus sowie Interna der (automatischen) Compaction'
title: Vertiefung der Sitzungsverwaltung
x-i18n:
    generated_at: "2026-07-12T15:52:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Ein einzelner **Gateway-Prozess** verwaltet den Sitzungsstatus durchgängig. Benutzeroberflächen (macOS-App, Web-Control-UI, TUI) fragen Sitzungslisten und Token-Anzahlen beim Gateway ab. Im Remote-Modus befinden sich die Sitzungsdateien auf dem Remote-Host. Eine Prüfung der Dateien auf Ihrem lokalen Mac bildet daher nicht ab, was der Gateway verwendet.

Lesen Sie zunächst die Übersichtsdokumentation: [Sitzungsverwaltung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Arbeitsspeicherübersicht](/de/concepts/memory), [Arbeitsspeichersuche](/de/concepts/memory-search), [Sitzungsbereinigung](/de/concepts/session-pruning), [Transkriptbereinigung](/de/reference/transcript-hygiene); die vollständige Konfigurationsreferenz finden Sie unter [Agent-Konfiguration](/de/gateway/config-agents).

## Zwei Persistenzebenen

1. **Sitzungszeilen (agentenspezifisches SQLite)** - Schlüssel-Wert-Zuordnung `sessionKey -> SessionEntry`. Veränderlicher Laufzeitstatus unter der Verwaltung des Gateways. Erfasst Metadaten: aktuelle Sitzungs-ID, letzte Aktivität, Umschalter und Token-Zähler.
2. **Transkriptereignisse (agentenspezifisches SQLite)** - nur anfügbar und baumstrukturiert (Einträge haben `id` + `parentId`). Speichert die Unterhaltung, Tool-Aufrufe und Compaction-Zusammenfassungen und stellt den Modellkontext für zukünftige Durchläufe wieder her. Compaction-Prüfpunkte sind Metadaten zum komprimierten Nachfolgetranskript – eine neue Compaction schreibt keine zweite Kopie im Format `.checkpoint.*.jsonl`.

Ältere Installationen können weiterhin `sessions.json`-Dateien im Verzeichnis `sessions/`
des Agenten enthalten. Behandeln Sie diese Dateien als Eingaben für die Migration
älterer Sitzungszeilen oder als explizite Ziele für die Offline-Wartung. Beim Start
des Gateways und durch `openclaw doctor --fix` werden aktive ältere Zeilen und der
Transkriptverlauf automatisch in den agentenspezifischen SQLite-Speicher importiert.
Führen Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` aus und folgen Sie anschließend der
[Doctor-Migrationssequenz](/de/cli/doctor#session-sqlite-migration), wenn Sie explizite
Prüf- oder Validierungsnachweise benötigen. Falls eine Migration fehlschlägt, nachdem
ältere Transkriptartefakte archiviert wurden, verwenden Sie den Doctor-Wiederherstellungsmodus
aus dieser Sequenz. Die Wiederherstellung verwendet Migrationsmanifeste, stellt nur
die betroffenen archivierten Hilfsartefakte wieder her, bereitet auf Anforderung
einen bereinigten GitHub-Problembericht vor und führt nicht dazu, dass die aktive
Laufzeit erneut JSONL-Dateien liest.

Gateway-Verlaufsleser vermeiden es, das gesamte Transkript zu materialisieren, sofern die jeweilige Oberfläche keinen beliebigen historischen Zugriff benötigt. Die erste Verlaufsseite, der eingebettete Chatverlauf, die Wiederherstellung nach einem Neustart sowie Token- und Nutzungsprüfungen verwenden begrenzte Lesevorgänge am Ende der SQLite-Daten. Vollständige Transkriptdurchläufe erfolgen über den asynchronen Transkriptindex und werden von gleichzeitigen Lesern gemeinsam genutzt.

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host (aufgelöst über `src/config/sessions.ts`):

- Laufzeitspeicher für Sitzungszeilen: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Laufzeitzeilen für Transkripte: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Ältere/archivierte Transkriptartefakte: `~/.openclaw/agents/<agentId>/sessions/`
- Migrationseingabe für ältere Zeilen: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Speicherwartung und Speicherplatzkontrollen

`session.maintenance` steuert die automatische Wartung von SQLite-Sitzungszeilen, SQLite-Transkriptzeilen, Archivartefakten und Trajektorien-Begleitdateien:

| Schlüssel                | Standardwert                 | Hinweise                                                                                                              |
| ------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode`                   | `"enforce"`                  | oder `"warn"` (nur Bericht, keine Änderungen)                                                                         |
| `pruneAfter`             | `"30d"`                      | Altersgrenze für veraltete Einträge                                                                                   |
| `maxEntries`             | `500`                        | Höchstgrenze für Sitzungseinträge                                                                                     |
| `resetArchiveRetention`  | behalten (keine Altersgrenze) | Altersgrenze für Transkriptarchive vom Typ `*.reset.*`/`*.deleted.*`; eine Zeitdauer aktiviert die Löschung          |
| `maxDiskBytes`           | `2gb`                        | Speicherplatzbudget für Sitzungen pro Agent; `false` deaktiviert es                                                   |
| `highWaterBytes`         | 80 % von `maxDiskBytes`      | Zielwert nach der Budgetbereinigung                                                                                   |

Archivierte Transkripte werden standardmäßig aufbewahrt und mit zstd komprimiert (`*.jsonl.<reason>.<timestamp>.zst`), wenn die Laufzeit dies unterstützt. Dadurch wird beim Löschen oder Zurücksetzen einer Sitzung der Unterhaltungsverlauf niemals unbemerkt verworfen. Das Speicherplatzbudget entfernt zuerst die ältesten Archive, bevor aktive Sitzungen betroffen sind.

Bei der aktiven SQLite-Durchsetzung von `maxDiskBytes` werden pro Sitzung die JSON-Bytes der Sitzungszeilen und Transkriptereignisse gemessen; bei der älteren Offline-Wartungsdurchsetzung werden die Dateien im ausgewählten Sitzungsverzeichnis gemessen.

Gateway-Sitzungen zur Prüfung von Modellläufen (Schlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen) erhalten eine separate, feste Aufbewahrungsdauer von `24h`. Diese Bereinigung ist druckabhängig: Sie wird nur ausgeführt, wenn bei der Wartung oder Begrenzung der Sitzungseinträge ein Kapazitätsdruck entsteht, und nur vor dem globalen Schritt zur Bereinigung oder Begrenzung veralteter Einträge. Andere explizite Sitzungen verwenden diese Aufbewahrungsdauer nicht.

Durchsetzungsreihenfolge für die Bereinigung des Speicherplatzbudgets (`mode: "enforce"`):

1. Zuerst die ältesten archivierten Transkriptartefakte, verwaisten älteren Artefakte oder verwaisten Trajektorienartefakte entfernen.
2. Falls der Zielwert weiterhin überschritten wird, die ältesten Sitzungseinträge und ihre Transkriptzeilen oder Trajektorienartefakte entfernen.
3. Wiederholen, bis die Nutzung `highWaterBytes` erreicht oder unterschreitet.

`mode: "warn"` meldet mögliche Entfernungen, ohne den Speicher oder die Dateien zu verändern.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Die Wartung behält dauerhafte externe Gesprächsverweise wie Gruppensitzungen und auf Threads beschränkte Chatsitzungen bei, synthetische Laufzeiteinträge (Cron, Hooks, Heartbeat, ACP, Sub-Agenten) können jedoch weiterhin entfernt werden, sobald sie das konfigurierte Alter, die konfigurierte Anzahl oder das Speicherplatzbudget überschreiten. Isolierte Cron-Ausführungen verwenden eine separate Steuerung über `cron.sessionRetention`, unabhängig von der Aufbewahrung von Modelllauf-Probes.

Normale Gateway-Schreibvorgänge laufen über den Sitzungs-Accessor, der SQLite-Mutationen pro Agent über den Laufzeit-Writer-Pfad serialisiert. Laufzeitcode sollte die Accessor-Hilfsfunktionen in `src/config/sessions/session-accessor.ts` bevorzugen; ältere `sessions.json`-Hilfsfunktionen sind Werkzeuge für Migration und Offline-Wartung. Wenn ein Gateway erreichbar ist, delegieren `openclaw sessions cleanup` und `openclaw agents delete` ohne Dry-Run Speichermutationen an das Gateway, sodass die Bereinigung dieselbe Writer-Warteschlange verwendet; `--store <path>` ist der explizite Offline-Reparaturpfad für einen ausgewählten Legacy-Speicher und bleibt immer lokal (ebenso wie `--dry-run`). Die Bereinigung mit `maxEntries` erfolgt für Speicher in Produktionsgröße stapelweise, sodass ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste Bereinigung beim oberen Schwellenwert ihn auf die Obergrenze reduziert. Lesevorgänge entfernen oder begrenzen beim Start des Gateways niemals Einträge – dies geschieht nur bei Schreibvorgängen oder durch `openclaw sessions cleanup --enforce`; Letzteres wendet die Obergrenze außerdem sofort an und entfernt alte, nicht referenzierte Legacy-Artefakte für Transkripte, Checkpoints und Trajektorien, selbst wenn kein Speicherplatzbudget konfiguriert ist.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen rotierenden `sessions.json.bak.*`-Sicherungen mehr. Der Legacy-Schlüssel `session.maintenance.rotateBytes` wird ignoriert, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkriptmutationen verwenden die Sitzungsschreibwarteschlange für das SQLite-Transkriptziel:

| Einstellung                          | Standardwert | Umgebungsüberschreibung                           |
| ------------------------------------ | ------------ | ------------------------------------------------- |
| `session.writeLock.acquireTimeoutMs` | `60000`      | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000`    | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`     | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` gibt an, wie lange beim Warten auf eine Sperre ein Fehler wegen einer belegten Sitzung gemeldet wird, bevor der Vorgang abgebrochen wird; erhöhen Sie den Wert nur, wenn legitime Vorbereitungs-, Bereinigungs-, Compaction- oder Transkriptspiegelungsarbeiten auf langsamen Rechnern länger miteinander konkurrieren. `staleMs` legt fest, wann eine bestehende Sperre als veraltet zurückgewonnen werden kann. `maxHoldMs` ist der Schwellenwert für die Freigabe durch den prozessinternen Watchdog.

### Downgrade nach der Umstellung auf SQLite

Stellen Sie archivierte Legacy-Transkriptartefakte wieder her, bevor Sie eine ältere
dateibasierte OpenClaw-Version ausführen:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Die Migration belässt ältere `sessions.json`-Dateien für Support und
Rollback an ihrem Ort, aber aktive Transkript-JSONL-Dateien, die in SQLite
importiert wurden, werden nach `session-sqlite-import-archive/` verschoben. Ältere dateibasierte Laufzeiten folgen
den `sessionFile`-Pfaden in `sessions.json` und benötigen daher die Wiederherstellung dieser Artefakte
vor dem Start. Die Wiederherstellung verwendet Migrationsmanifeste, verschiebt nur erfasste archivierte
Artefakte, deren ursprüngliche Pfade fehlen, und belässt die SQLite-Datenbank
für eine spätere Wiederherstellung an ihrem Ort.

Nach der Umstellung auf SQLite erstellte Sitzungen sind ausschließlich in SQLite vorhanden und werden in einer
älteren dateibasierten Laufzeit nicht angezeigt. Wenn Sie nach einem Downgrade erneut ein Upgrade durchführen, führen Sie die Doctor-
Inspektions- und Validierungssequenz erneut aus, damit OpenClaw wiederhergestellte Legacy-
Artefakte vor dem Import überprüfen kann.

## Cron-Sitzungen und Ausführungsprotokolle

Isolierte Cron-Ausführungen erstellen eigene Sitzungseinträge und Transkripte mit eigener Aufbewahrung:

- `cron.sessionRetention` (Standardwert `"24h"`) entfernt alte Sitzungen isolierter Cron-Ausführungen aus dem Speicher; `false` deaktiviert dies.
- `cron.runLog.keepLines` begrenzt die aufbewahrten SQLite-Zeilen des Ausführungsverlaufs pro Cron-Auftrag (Standardwert `2000`). `cron.runLog.maxBytes` wird nur zur Kompatibilität mit älteren dateibasierten Ausführungsprotokollen akzeptiert.

Wenn Cron die Erstellung einer neuen isolierten Ausführungssitzung erzwingt, bereinigt es den vorherigen Sitzungseintrag `cron:<jobId>`, bevor die neue Zeile geschrieben wird: Sichere Einstellungen (Einstellungen für Denken/schnell/ausführlich/Schlussfolgern, Labels, Anzeigename) und explizit vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen werden übernommen, der umgebende Gesprächskontext (Kanal-/Gruppenrouting, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung, ACP-Laufzeitbindung) wird jedoch verworfen, damit eine neue isolierte Ausführung keine veraltete Zustellungs- oder Laufzeitberechtigung von einer älteren Ausführung übernehmen kann.

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, in welchem Gesprächsbereich Sie sich befinden (Routing + Isolation). Kanonische Regeln: [/concepts/session](/de/concepts/session).

| Muster                       | Beispiel                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| Haupt-/Direktchat (pro Agent) | `agent:<agentId>:<mainKey>` (Standardwert `main`)           |
| Gruppe                       | `agent:<agentId>:<channel>:group:<id>`                      |
| Raum/Kanal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (sofern nicht überschrieben)                  |

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die SQLite-Transkriptidentität, mit der das Gespräch fortgesetzt wird). Die Entscheidungslogik befindet sich in `initSessionState()` in `src/auto-reply/reply/session.ts`.

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig um 4:00 Uhr lokaler Zeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach Überschreiten der Zurücksetzungsgrenze eine neue `sessionId`.
- **Ablauf bei Inaktivität** (`session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Inaktivitätszeitfenster eine Nachricht eingeht. Wenn sowohl tägliches Zurücksetzen als auch Inaktivitätsablauf konfiguriert sind, gilt das Ereignis, das zuerst eintritt.
- **Fortsetzen nach erneuter Verbindung der Control UI** behält die aktuell sichtbare Sitzung für einen einmaligen Sendevorgang nach der erneuten Verbindung bei, wenn das Gateway die passende `sessionId` von einem UI-Client eines Operators empfängt. Dies ist ein einmaliges Signal; gewöhnliche veraltete Sendevorgänge erstellen weiterhin eine neue `sessionId`.
- **Systemereignisse** (Heartbeat, Cron-Aktivierungen, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Sitzungszeile ändern, verlängern jedoch niemals die Aktualität für tägliches Zurücksetzen oder Inaktivitätsablauf. Beim Wechsel infolge einer Zurücksetzung werden in der Warteschlange befindliche Systemereignis-Hinweise für die vorherige Sitzung verworfen, bevor der neue Prompt erstellt wird.
- **Richtlinie für übergeordnete Forks** verwendet den aktiven Branch von OpenClaw, wenn ein Thread- oder Subagent-Fork erstellt wird. Wenn dieser Branch zu groß ist (über einem festen internen Grenzwert, derzeit 100K Token), startet OpenClaw das untergeordnete Element mit isoliertem Kontext, statt fehlzuschlagen oder einen unbrauchbaren Verlauf zu übernehmen. Die Größenbestimmung erfolgt automatisch und ist nicht konfigurierbar; die veraltete Konfiguration `session.parentForkMaxTokens` wird durch `openclaw doctor --fix` entfernt.
- **Operator-Forks**: `sessions.create { parentSessionKey, fork: true }` erstellt eine neue Sitzung, deren Transkript vom aktuellen Zustand der übergeordneten Sitzung abzweigt (derselbe Fork-Mechanismus wie beim Starten von Subagents, einschließlich des oben genannten Größenlimits). Der Fork wird abgelehnt, solange in der übergeordneten Sitzung ein aktiver Lauf ausgeführt wird, übernimmt die Modellauswahl der übergeordneten Sitzung, sofern nicht ausdrücklich eine andere übergeben wird, und markiert die untergeordnete Sitzung mit `forkedFromParent` sowie neuen Token-Zählern.

## Schema des Sitzungsspeichers

Der Laufzeitspeicher hält `SessionEntry`-Werte pro Agent in SQLite. Der Werttyp ist `SessionEntry` in `src/config/sessions.ts`. Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID zur Adressierung von SQLite-Transkriptzeilen
- `sessionStartedAt`: Startzeitstempel der aktuellen `sessionId`; die Aktualität für das tägliche Zurücksetzen basiert darauf. Veraltete Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten tatsächlichen Benutzer-/Kanalinteraktion; die Aktualität für den Inaktivitätsablauf basiert darauf, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht aktiv halten. Veraltete Zeilen ohne dieses Feld greifen auf die wiederhergestellte Sitzungsstartzeit zurück.
- `updatedAt`: Zeitstempel der letzten Änderung der Speicherzeile; wird für Auflistung, Bereinigung und Buchhaltung verwendet und ist nicht maßgeblich für die Aktualität des täglichen Zurücksetzens oder Inaktivitätsablaufs.
- `archivedAt`: optionaler Archivierungszeitstempel. Archivierte Sitzungen verbleiben mit intaktem Transkript im Speicher und werden aus normalen Auflistungen aktiver Sitzungen ausgeschlossen.
- `pinnedAt`: optionaler Anheftungszeitstempel. Aktive angeheftete Sitzungen werden vor nicht angehefteten Sitzungen sortiert; beim Archivieren einer Sitzung wird ihre Anheftung aufgehoben.
- Codex-Thread-Interoperabilität: Beide Felder folgen der Codex-Form für die Thread-Verwaltung – die booleschen Werte `archived`/`pinned` bei der Übertragung werden immer aus dem Zeitstempel abgeleitet und serverseitig gesetzt, entsprechend der Codex-Semantik von `threads.archived_at` und der camelCase-Serialisierung. OpenClaw-Zeitstempel verwenden Millisekunden seit der Epoche, Codex hingegen Sekunden seit der Epoche; daher führen Bridges die Konvertierung an der Schnittstelle des `codex`-Plugins durch. Codex verfügt noch über keine API zum Anheften (nur `thread/archive`/`thread/unarchive`); der angeheftete Zustand verbleibt auf OpenClaw-Seite, bis eine solche API existiert. Dann ermöglicht die übereinstimmende Form gebundenen Sitzungen, den angehefteten Zustand mechanisch in beide Richtungen zu übertragen.
- Die Codex-Überwachung listet nur nicht archivierte native Threads auf. Ein Gateway-lokaler Thread mit unbekannter Aktivität im Zustand `idle` oder `notLoaded` kann über das native `thread/archive` nur archiviert werden, nachdem der Operator ausdrücklich bestätigt hat, dass kein anderer Codex-Prozess ihn besitzt; das Plugin liest zuvor den prozesslokalen Status erneut, anschließend verschwindet der Thread aus dem Katalog. Diese Abfrage kann nicht belegen, dass kein anderer App-Server-Prozess den Thread verwendet. OpenClaw lehnt die Archivierung aktiver Zeilen und von Fehlerzeilen ab; die Archivierung über einen gekoppelten Node ist nicht verfügbar, bis die Node-Bridge den vollständigen gestreamten Thread-Lebenszyklus verwalten kann. Durch Aufheben der Archivierung in einem nativen Codex-Client kann der Thread wieder angezeigt werden.
- `lastReadAt` / `markedUnreadAt`: serverseitig durch `sessions.patch { unread }` gesetzte Zeitstempel des Lesestatus – `unread: false` zeichnet einen Lesevorgang auf (setzt `lastReadAt`, löscht `markedUnreadAt`); `unread: true` markiert die Sitzung bis zum nächsten Lesevorgang als ungelesen. Sitzungszeilen stellen einen abgeleiteten booleschen Wert `unread` bereit: ausdrücklich als ungelesen markiert oder vor der letzten Aktivität gelesen. Sitzungen, die nie als gelesen markiert wurden, bleiben bei `unread: false`, sodass bestehende Installationen nach einem Upgrade nicht plötzlich ungelesene Sitzungen anzeigen.
- `lastActivityAt`: Zeitstempel des letzten abgeschlossenen Agent-Laufs, der als Aktivität gilt, die einen ungelesenen Zustand rechtfertigt (Benutzer-, Kanal- und Cron-Läufe). Heartbeat- und interne Ereignis-Turns sowie Metadaten-Patches aktualisieren ihn nicht; `updatedAt` ist kein Aktivitätssignal.
- `sessionFile`: veraltete Markierung, die für Migrations-/Archivierungskompatibilität beibehalten wird; die aktive Laufzeit verwendet die SQLite-Identität
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: Beschriftungsmetadaten für Gruppen/Kanäle
- Umschalter: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (sitzungsspezifische Überschreibung)
- Modellauswahl: `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (nach bestem Bemühen/Provider-abhängig): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt` / `memoryFlushCompactionCount`: Zeitstempel und Compaction-Anzahl des letzten Speicher-Flushs vor der Compaction

Das Gateway ist maßgeblich: Es kann Einträge neu schreiben oder rehydrieren, während Sitzungen
ausgeführt werden. Migrieren Sie veraltete dateibasierte Installationen mit
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`, statt
`sessions.json` zu bearbeiten und zu erwarten, dass die Laufzeit diese Datei weiterhin liest.

## Struktur der Transkriptereignisse

Transkripte werden vom OpenClaw-Sitzungs-Accessor verwaltet und dem Laufzeitcode über identitätsbasierte Hilfsfunktionen bereitgestellt. Der Ereignisstrom kann nur erweitert werden:

- Erster Eintrag: Sitzungsheader – `type: "session"`, `id`, `cwd`, `timestamp`, optional `parentSession`.
- Danach: Einträge mit `id` + `parentId` (Baumstruktur).

Wichtige Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: durch eine Erweiterung eingefügte Nachricht, die _tatsächlich_ in den Modellkontext aufgenommen wird (in der TUI dargestellt, wenn `display: true`, vollständig ausgeblendet, wenn `display: false`)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext aufgenommen wird (zur Beibehaltung des Erweiterungszustands über erneutes Laden hinweg)
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baum-Branch

OpenClaw nimmt bewusst keine „Korrekturen“ an Transkripten vor; das Gateway verwendet `SessionManager`, um sie zu lesen und zu schreiben.

## Kontextfenster im Vergleich zu erfassten Token

Zwei unterschiedliche Konzepte:

1. **Modellkontextfenster**: feste Obergrenze pro Modell (für das Modell sichtbare Token). Stammt aus dem Modellkatalog und kann über die Konfiguration überschrieben werden.
2. **Zähler im Sitzungsspeicher**: fortlaufende Statistiken, die in die Sitzungszeile geschrieben werden (verwendet für `/status` und Dashboards). `contextTokens` ist ein Laufzeitschätzungs-/Berichtswert – behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen zu Grenzwerten: [/reference/token-use](/de/reference/token-use).

## Compaction: Bedeutung

Compaction fasst ältere Unterhaltungen in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten unverändert. Nach der Compaction sehen zukünftige Turns die Compaction-Zusammenfassung sowie die Nachrichten nach `firstKeptEntryId`. Compaction ist im Gegensatz zur Sitzungsbereinigung **persistent** – siehe [/concepts/session-pruning](/de/concepts/session-pruning).

Das erneute Einfügen von AGENTS.md-Abschnitten nach der Compaction ist über `agents.defaults.compaction.postCompactionSections` optional aktivierbar; wenn die Einstellung nicht gesetzt ist oder `[]` enthält, hängt OpenClaw keine AGENTS.md-Auszüge an die Compaction-Zusammenfassung an.

### Chunk-Grenzen und Zuordnung von Tools

Beim Aufteilen eines langen Transkripts in Compaction-Chunks hält OpenClaw Assistenten-Tool-Aufrufe mit den zugehörigen `toolResult`-Einträgen zusammen:

- Wenn die Aufteilung nach Token-Anteil zwischen einem Tool-Aufruf und dessen Ergebnis liegen würde, verschiebt OpenClaw die Grenze auf die Assistentennachricht mit dem Tool-Aufruf, statt das Paar zu trennen.
- Wenn ein abschließender Block mit Tool-Ergebnissen den Chunk andernfalls über die Zielgröße hinaus vergrößern würde, behält OpenClaw diesen ausstehenden Tool-Block bei und lässt den nicht zusammengefassten Rest unverändert.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilungsgrenze offen.

## Zeitpunkt der automatischen Compaction

Zwei Auslöser im eingebetteten OpenClaw-Agent:

1. **Wiederherstellung nach Überlauf**: Das Modell gibt einen Kontextüberlauffehler zurück (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` und andere Provider-spezifische Varianten) – Compaction durchführen und anschließend erneut versuchen. Wenn der Provider die Anzahl der versuchten Token meldet, leitet OpenClaw diese beobachtete Anzahl an die Compaction zur Wiederherstellung nach Überlauf weiter; wenn der Provider den Überlauf bestätigt, aber keine auswertbare Anzahl bereitstellt, übergibt OpenClaw den Compaction-Engines und der Diagnose eine synthetische Anzahl, die das Budget minimal überschreitet. Wenn die Wiederherstellung nach Überlauf weiterhin fehlschlägt, zeigt OpenClaw ausdrückliche Anweisungen an und behält die aktuelle Sitzungszuordnung bei, statt unbemerkt zu einer neuen Sitzungs-ID zu wechseln – versuchen Sie die Nachricht erneut, führen Sie `/compact` aus oder führen Sie `/new` aus.
2. **Schwellenwertpflege**: nach einem erfolgreichen Turn, wenn `contextTokens > contextWindow - reserveTokens`, wobei `contextWindow` das Kontextfenster des Modells und `reserveTokens` der für Prompts sowie die nächste Modellausgabe reservierte Spielraum ist.

Zwei zusätzliche Schutzmechanismen werden außerhalb dieser beiden Auslöser ausgeführt:

- **Lokale Compaction vor dem Lauf**: Legen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` (Byte oder eine Zeichenfolge wie `"20mb"`) fest, um vor dem Öffnen des nächsten Laufs eine lokale Compaction auszulösen, sobald das aktive Transkript diese Größe erreicht. Dies ist ein Größenschutz für die lokalen Kosten beim erneuten Öffnen und keine reine Archivierung – die normale semantische Compaction wird weiterhin ausgeführt und erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem neuen Nachfolgetranskript wird.
- **Vorabprüfung während des Turns**: Legen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true` (Standardwert `false`) fest, um einen Schutz für die Tool-Schleife hinzuzufügen. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Budgetlogik der Vorabprüfung, die zu Beginn des Turns verwendet wird. Wenn der Kontext nicht mehr passt, führt der Schutz keine Compaction inline durch – er löst ein strukturiertes Signal der Vorabprüfung während des Turns aus, stoppt die aktuelle Prompt-Übermittlung und lässt die äußere Laufschleife den vorhandenen Wiederherstellungspfad verwenden (übergroße Tool-Ergebnisse abschneiden, wenn dies ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen). Funktioniert sowohl mit dem Compaction-Modus `default` als auch `safeguard`, einschließlich Provider-gestützter Safeguard-Compaction. Unabhängig von `maxActiveTranscriptBytes`: Der Schutz anhand der Byte-Größe wird vor dem Öffnen eines Turns ausgeführt, die Vorabprüfung während des Turns später, nachdem neue Tool-Ergebnisse angehängt wurden.

## Compaction-Einstellungen

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen: Wenn `compaction.reserveTokens` unter `reserveTokensFloor` (Standardwert `20000`) liegt, hebt OpenClaw den Wert entsprechend an. Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren. Wenn das Kontextfenster des aktiven Modells bekannt ist, werden sowohl die Untergrenze als auch die endgültige effektive Reserve begrenzt, sodass die Reserve nicht das gesamte Prompt-Budget beanspruchen kann. Dadurch wird verhindert, dass Modelle mit kleinem Kontextfenster (beispielsweise ein lokales Modell mit 16K Token) bereits ab dem ersten Token in die Compaction wechseln; ohne bekanntes Kontextfenster bleiben konfigurierte und aktuelle Reservebudgets unbegrenzt. Warum überhaupt eine Untergrenze: Sie lässt genügend Spielraum für mehrschrittige „Aufräumarbeiten“ (wie das unten beschriebene Leeren des Speichers), bevor eine Compaction unvermeidbar wird. Implementierung: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`, aufgerufen über die Pfade zur Einrichtung von Turns des eingebetteten Runners und der Compaction.

Eine manuelle `/compact`-Ausführung berücksichtigt einen expliziten Wert für `agents.defaults.compaction.keepRecentTokens` und behält den Abschnittspunkt des aktuellen Laufzeitendes bei. Ohne ein explizites Beibehaltungsbudget ist eine manuelle Compaction ein fester Checkpoint, und der neu aufgebaute Kontext beginnt mit der neuen Zusammenfassung.

Wenn `truncateAfterCompaction` aktiviert ist, rotiert OpenClaw das aktive Transkript nach der Compaction zu einem komprimierten Nachfolger. Aktionen für Branch-/Wiederherstellungs-Checkpoints verwenden diesen komprimierten Nachfolger; ältere Checkpoint-Dateien vor der Compaction bleiben lesbar, solange auf sie verwiesen wird.

## Austauschbare Compaction-Provider

Plugins registrieren über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider. Wenn `agents.defaults.compaction.provider` auf die ID eines registrierten Providers gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Lassen Sie den Wert für die standardmäßige LLM-Zusammenfassung ungesetzt. Das Festlegen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad. Der Safeguard behält nach der Provider-Ausgabe weiterhin den Suffixkontext der jüngsten und aufgeteilten Turns bei.
- Die integrierte Safeguard-Zusammenfassung verdichtet frühere Zusammenfassungen zusammen mit neuen Nachrichten erneut, statt die vollständige vorherige Zusammenfassung unverändert beizubehalten.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; setzen Sie `qualityGuard.enabled: false`, um Wiederholungsversuche bei fehlerhaft formatierter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück. Vom Aufrufer ausdrücklich ausgelöste Abbruch-/Zeitüberschreitungssignale werden erneut ausgelöst und nicht unterdrückt, sodass ein Abbruch immer berücksichtigt wird.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Für Benutzer sichtbare Oberflächen

- `/status` in jeder Chatsitzung
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Gateway-Protokolle (`pnpm gateway:watch` oder `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ausführlicher Modus: `🧹 Auto-compaction complete` sowie die Anzahl der Compactions

## Stille Aufräumarbeiten (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen Benutzer keine Zwischenausgabe sehen sollen.

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` / `no_reply`, um anzugeben: „Keine Antwort an den Benutzer zustellen.“ OpenClaw entfernt beziehungsweise unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens berücksichtigt die Groß-/Kleinschreibung nicht: `NO_REPLY` und `no_reply` gelten beide, wenn die gesamte Nutzlast ausschließlich aus dem stillen Token besteht.
- Seit `2026.1.10` unterdrückt OpenClaw außerdem das Streaming von Entwürfen beziehungsweise Eingabeanzeigen, wenn ein Teilabschnitt mit `NO_REPLY` beginnt. Dadurch geben stille Vorgänge während eines Turns keine Teilausgaben preis.
- Dies ist ausschließlich für echte Hintergrund-Turns ohne Zustellung vorgesehen – es ist keine Abkürzung für gewöhnliche umsetzbare Benutzeranfragen.

## Speicherleerung vor der Compaction

Bevor eine automatische Compaction erfolgt, kann OpenClaw einen stillen agentischen Turn ausführen, der dauerhaften Zustand auf den Datenträger schreibt (beispielsweise `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit die Compaction keinen kritischen Kontext löschen kann. OpenClaw überwacht die Kontextnutzung der Sitzung. Sobald diese einen weichen Schwellenwert unterhalb des Compaction-Schwellenwerts überschreitet, sendet OpenClaw unter Verwendung des exakten stillen Tokens `NO_REPLY` / `no_reply` eine stille Anweisung zum sofortigen Schreiben des Speichers, sodass Benutzer nichts sehen.

Konfiguration (`agents.defaults.compaction.memoryFlush`), vollständige Referenz unter [/gateway/config-agents](/de/gateway/config-agents#agentsdefaultscompaction):

| Schlüssel                   | Standardwert     | Hinweise                                                                                                                                                                                |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                                                                         |
| `model`                     | nicht gesetzt    | exakte Provider-/Modellüberschreibung ausschließlich für den Leerungs-Turn, beispielsweise `ollama/qwen3:8b`                                                                            |
| `softThresholdTokens`       | `4000`           | Abstand unterhalb des Compaction-Schwellenwerts, der eine Leerung auslöst                                                                                                                |
| `forceFlushTranscriptBytes` | nicht gesetzt (deaktiviert) | erzwingt eine Leerung, sobald die Transkriptdatei diese Byte-Größe erreicht (oder eine Zeichenfolge wie `"2mb"`), selbst wenn die Token-Zähler veraltet sind; `0` deaktiviert |
| `prompt`                    | integriert       | Benutzernachricht für den Leerungs-Turn                                                                                                                                                  |
| `systemPrompt`              | integriert       | zusätzlicher System-Prompt, der für den Leerungs-Turn angehängt wird                                                                                                                     |

Hinweise:

- Der standardmäßige Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis zur Unterdrückung der Zustellung.
- Wenn `model` festgelegt ist, verwendet der Leerungs-Turn dieses Modell, ohne die Fallback-Kette der aktiven Sitzung zu übernehmen. Dadurch greifen ausschließlich lokale Aufräumarbeiten bei einem Fehler nicht stillschweigend auf ein kostenpflichtiges Konversationsmodell zurück.
- Die Leerung wird einmal pro Compaction-Zyklus ausgeführt (in der Sitzungszeile nachverfolgt).
- Die Leerung wird nur für eingebettete OpenClaw-Sitzungen ausgeführt; CLI-Backends und Heartbeat-Turns überspringen sie.
- Die Leerung wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Unter [Speicher](/de/concepts/memory) finden Sie das Dateilayout des Arbeitsbereichs und die Schreibmuster.

OpenClaw stellt in der Erweiterungs-API einen `session_before_compact`-Hook bereit, die oben beschriebene Leerungslogik befindet sich jedoch auf der Gateway-Seite (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`) und nicht in diesem Hook.

## Checkliste zur Fehlerbehebung

- **Falscher Sitzungsschlüssel?** Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- **Abweichung zwischen Speicher und Transkript?** Bestätigen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- **Zu häufige Compaction?** Prüfen Sie das Kontextfenster des Modells (ein zu kleines Fenster erzwingt häufige Compactions), `reserveTokens` (ein für das Modellfenster zu hoher Wert führt zu einer früheren Compaction) und eine Aufblähung durch Werkzeugergebnisse (passen Sie die Sitzungsbereinigung an).
- **Scheint jeder Prompt bei einem kleinen lokalen Modell überzulaufen?** Bestätigen Sie, dass der Provider das korrekte Kontextfenster des Modells meldet. OpenClaw kann die effektive Reserve nur begrenzen, wenn dieses Fenster bekannt ist.
- **Werden stille Turns sichtbar?** Bestätigen Sie, dass die Antwort mit dem exakten stillen Token `NO_REPLY` beginnt (Groß-/Kleinschreibung wird nicht berücksichtigt) und dass Sie einen Build verwenden, der die Korrektur zur Streaming-Unterdrückung enthält (`2026.1.10`+).

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
- [Referenz zur Agent-Konfiguration](/de/gateway/config-agents)
