---
read_when:
    - Sie müssen Sitzungs-IDs, Transkriptereignisse oder Felder von Sitzungszeilen debuggen
    - Sie ändern das Verhalten der automatischen Compaction oder fügen Bereinigungsarbeiten vor der Compaction hinzu.
    - Sie möchten Speicherleerungen oder stille Systemdurchläufe implementieren
summary: 'Detaillierter Einblick: Sitzungsspeicher und Transkripte, Lebenszyklus sowie Interna der (automatischen) Compaction'
title: Detaillierter Einblick in die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-07-16T13:35:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Ein einzelner **Gateway-Prozess** verwaltet den Sitzungsstatus durchgängig. Benutzeroberflächen (macOS-App, Web-Control-UI, TUI) fragen beim Gateway Sitzungslisten und Token-Anzahlen ab. Im Remote-Modus befinden sich Sitzungsdateien auf dem Remote-Host. Daher entsprechen die Dateien auf Ihrem lokalen Mac nicht den vom Gateway verwendeten Dateien.

Lesen Sie zuerst die Übersichtsdokumentation: [Sitzungsverwaltung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Speicherübersicht](/de/concepts/memory), [Speichersuche](/de/concepts/memory-search), [Sitzungsbereinigung](/de/concepts/session-pruning), [Transkripthygiene](/de/reference/transcript-hygiene), vollständige Konfigurationsreferenz unter [Agent-Konfiguration](/de/gateway/config-agents).

## Zwei Persistenzebenen

1. **Sitzungszeilen (agentenspezifisches SQLite)** – Schlüssel/Wert-Zuordnung `sessionKey -> SessionEntry`. Veränderlicher, vom Gateway verwalteter Laufzeitstatus. Erfasst Metadaten: aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler.
2. **Transkriptereignisse (agentenspezifisches SQLite)** – nur anhängbar und baumstrukturiert (Einträge enthalten `id` + `parentId`). Speichert die Unterhaltung, Tool-Aufrufe und Compaction-Zusammenfassungen und rekonstruiert den Modellkontext für zukünftige Durchläufe. Compaction-Prüfpunkte sind Metadaten über dem komprimierten Nachfolgetranskript – eine neue Compaction schreibt keine zweite Kopie von `.checkpoint.*.jsonl`.

Ältere Installationen können weiterhin `sessions.json`-Dateien im Verzeichnis `sessions/` des Agenten enthalten. Behandeln Sie diese Dateien als Eingaben für die Migration veralteter Sitzungszeilen oder als explizite Ziele für die Offline-Wartung. Beim Start des Gateways und durch `openclaw doctor --fix` werden aktive veraltete Zeilen und der Transkriptverlauf automatisch in den agentenspezifischen SQLite-Speicher importiert. Führen Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` aus und folgen Sie anschließend der [Doctor-Migrationssequenz](/de/cli/doctor#session-sqlite-migration), wenn Sie explizite Inspektions- oder Validierungsnachweise benötigen. Wenn eine Migration fehlschlägt, nachdem veraltete Transkriptartefakte archiviert wurden, verwenden Sie den Doctor-Wiederherstellungsmodus aus dieser Sequenz. Die Wiederherstellung verwendet Migrationsmanifeste, stellt ausschließlich die betroffenen archivierten Unterstützungsartefakte wieder her, erstellt auf Wunsch einen bereinigten GitHub-Problembericht und führt nicht dazu, dass die aktive Laufzeit erneut JSONL-Dateien liest.

Gateway-Verlaufsleser vermeiden es, das gesamte Transkript zu materialisieren, sofern die Oberfläche keinen beliebigen historischen Zugriff benötigt. Die erste Verlaufsseite, der eingebettete Chatverlauf, die Wiederherstellung nach einem Neustart sowie Token- und Nutzungsprüfungen verwenden begrenzte Lesevorgänge am Ende der SQLite-Daten. Vollständige Transkriptscans erfolgen über den asynchronen Transkriptindex und werden von gleichzeitigen Lesern gemeinsam genutzt.

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host (aufgelöst über `src/config/sessions.ts`):

- Laufzeitspeicher für Sitzungszeilen: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Laufzeit-Transkriptzeilen: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Veraltete/archivierte Transkriptartefakte: `~/.openclaw/agents/<agentId>/sessions/`
- Migrationseingabe für veraltete Zeilen: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Speicherwartung und Datenträgerkontrollen

`session.maintenance` steuert die automatische Wartung von SQLite-Sitzungszeilen, SQLite-Transkriptzeilen, Archivartefakten und Trajektorien-Sidecars:

| Schlüssel               | Standardwert          | Hinweise                                                                                                  |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | oder `"warn"` (nur Bericht, keine Änderung)                                                               |
| `pruneAfter`            | `"30d"`               | Altersgrenze für veraltete Einträge                                                                       |
| `maxEntries`            | `500`                 | Obergrenze für Sitzungseinträge                                                                            |
| `resetArchiveRetention` | beibehalten (keine Altersgrenze) | Altersgrenze für Transkriptarchive vom Typ `*.reset.*`/`*.deleted.*`; eine Dauer aktiviert die Löschung |
| `maxDiskBytes`          | `2gb`                 | agentenspezifisches Datenträgerbudget für Sitzungen; `false` deaktiviert es                               |
| `highWaterBytes`        | 80 % von `maxDiskBytes` | Zielwert nach der Budgetbereinigung                                                                        |

Archivierte Transkripte werden standardmäßig aufbewahrt und mit zstd (`*.jsonl.<reason>.<timestamp>.zst`) komprimiert, sofern die Laufzeit dies unterstützt. Dadurch wird der Unterhaltungsverlauf beim Löschen oder Zurücksetzen einer Sitzung niemals unbemerkt verworfen. Das Datenträgerbudget entfernt zuerst die ältesten Archive, bevor aktive Sitzungen betroffen sind.

Die aktive SQLite-Durchsetzung von `maxDiskBytes` misst die JSON-Bytes der Sitzungszeile und der Transkriptereignisse pro Sitzung. Die veraltete Offline-Wartungsdurchsetzung misst Dateien im ausgewählten Sitzungsverzeichnis.

Gateway-Testsitzungen für Modellläufe (Schlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen) besitzen eine separate, feste Aufbewahrungsdauer von `24h`. Diese Bereinigung ist druckgesteuert: Sie wird nur ausgeführt, wenn Wartungs- oder Obergrenzendruck bei Sitzungseinträgen besteht, und ausschließlich vor der globalen Bereinigung bzw. Begrenzung veralteter Einträge. Andere explizite Sitzungen verwenden diese Aufbewahrungsdauer nicht.

Durchsetzungsreihenfolge für die Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Zuerst die ältesten archivierten Transkriptartefakte, verwaisten veralteten Artefakte oder verwaisten Trajektorienartefakte entfernen.
2. Wenn der Zielwert weiterhin überschritten wird, die ältesten Sitzungseinträge und deren Transkriptzeilen oder Trajektorienartefakte entfernen.
3. Wiederholen, bis die Nutzung höchstens `highWaterBytes` beträgt.

`mode: "warn"` meldet mögliche Entfernungen, ohne den Speicher oder die Dateien zu verändern.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Die Wartung bewahrt dauerhafte externe Unterhaltungszeiger wie Gruppensitzungen und Thread-bezogene Chatsitzungen auf. Synthetische Laufzeiteinträge (Cron, Hooks, Heartbeat, ACP, Unteragenten) können jedoch weiterhin entfernt werden, sobald sie das konfigurierte Alter, die Anzahl oder das Datenträgerbudget überschreiten. Isolierte Cron-Läufe verwenden eine separate Steuerung über `cron.sessionRetention`, unabhängig von der Aufbewahrung für Modelllauf-Testsitzungen.

Normale Gateway-Schreibvorgänge laufen über den Sitzungszugriff, der agentenspezifische SQLite-Änderungen über den Laufzeit-Schreibpfad serialisiert. Laufzeitcode sollte die Zugriffshilfen in `src/config/sessions/session-accessor.ts` bevorzugen; die veralteten Hilfen in `sessions.json` dienen der Migration und Offline-Wartung. Wenn ein Gateway erreichbar ist, delegieren `openclaw sessions cleanup` und `openclaw agents delete` ohne Probelauf Speicheränderungen an das Gateway, damit sich die Bereinigung in dieselbe Schreibwarteschlange einreiht. `--store <path>` ist der explizite Offline-Reparaturpfad für einen ausgewählten veralteten Speicher und bleibt stets lokal (ebenso `--dry-run`). Die Bereinigung durch `maxEntries` erfolgt für Speicher in Produktionsgröße stapelweise. Daher kann ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten, bevor die nächste Bereinigung beim oberen Schwellenwert ihn wieder auf die Obergrenze reduziert. Lesevorgänge bereinigen oder begrenzen beim Start des Gateways niemals Einträge – dies geschieht ausschließlich durch Schreibvorgänge oder `openclaw sessions cleanup --enforce`. Letzteres wendet die Obergrenze außerdem sofort an und entfernt alte, nicht referenzierte veraltete Transkript-, Prüfpunkt- und Trajektorienartefakte, selbst wenn kein Datenträgerbudget konfiguriert ist.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen rotierenden Sicherungen vom Typ `sessions.json.bak.*` mehr. Das aktuelle Schema weist den veralteten Schlüssel `session.maintenance.rotateBytes` zurück, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkriptänderungen verwenden für das SQLite-Transkriptziel die Sitzungsschreibwarteschlange:

| Einstellung                          | Standardwert | Umgebungsüberschreibung                            |
| ------------------------------------ | ------------ | -------------------------------------------------- |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` gibt an, wie lange das Warten auf eine Sperre einen Fehler wegen einer belegten Sitzung meldet, bevor aufgegeben wird. Erhöhen Sie diesen Wert nur, wenn legitime Vorbereitungs-, Bereinigungs-, Compaction- oder Transkriptspiegelungsarbeiten auf langsamen Computern länger miteinander konkurrieren. `staleMs` gibt an, wann eine vorhandene Sperre als veraltet zurückgewonnen werden kann. `maxHoldMs` ist der Schwellenwert für die Freigabe durch den prozessinternen Watchdog.

### Downgrade nach der SQLite-Umstellung

Stellen Sie archivierte veraltete Transkriptartefakte wieder her, bevor Sie eine ältere dateibasierte OpenClaw-Version ausführen:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Die Migration belässt veraltete `sessions.json`-Dateien für Support und Rollback an Ort und Stelle. Aktive Transkript-JSONL-Dateien, die in SQLite importiert wurden, werden jedoch in `session-sqlite-import-archive/` umbenannt. Ältere dateibasierte Laufzeiten folgen den `sessionFile`-Pfaden in `sessions.json` und benötigen daher diese wiederhergestellten Artefakte vor dem Start. Die Wiederherstellung verwendet Migrationsmanifeste, verschiebt ausschließlich erfasste archivierte Artefakte, deren ursprüngliche Pfade fehlen, und belässt die SQLite-Datenbank für eine spätere Wiederherstellung an Ort und Stelle.

Nach der SQLite-Umstellung erstellte Sitzungen existieren ausschließlich in SQLite und werden einer älteren dateibasierten Laufzeit nicht angezeigt. Wenn Sie nach einem Downgrade erneut aktualisieren, führen Sie die Doctor-Inspektions- und Validierungssequenz erneut aus, damit OpenClaw die wiederhergestellten veralteten Artefakte vor dem Import überprüfen kann.

## Cron-Sitzungen und Laufprotokolle

Isolierte Cron-Läufe erstellen eigene Sitzungseinträge und Transkripte mit separater Aufbewahrung:

- `cron.sessionRetention` (Standardwert `"24h"`) entfernt alte Sitzungen isolierter Cron-Läufe aus dem Speicher; `false` deaktiviert dies.
- Der Laufverlauf bewahrt pro Cron-Auftrag die neuesten 2000 Abschlusszeilen auf. Verlorene Zeilen behalten ihr Bereinigungsfenster von 24 Stunden.

Wenn Cron zwangsweise eine neue isolierte Laufsitzung erstellt, bereinigt es den vorherigen Sitzungseintrag `cron:<jobId>`, bevor es die neue Zeile schreibt: Sichere Einstellungen (Denk-/Schnell-/Ausführlichkeits-/Schlussfolgerungseinstellungen, Kennzeichnungen, Anzeigename) und explizit vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen werden übernommen. Der umgebende Unterhaltungskontext (Kanal-/Gruppenrouting, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung, ACP-Laufzeitbindung) wird jedoch verworfen, damit ein neuer isolierter Lauf keine veraltete Zustellungs- oder Laufzeitberechtigung von einem älteren Lauf übernehmen kann.

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` gibt an, in welchem Unterhaltungsbereich Sie sich befinden (Routing + Isolation). Kanonische Regeln: [/concepts/session](/de/concepts/session).

| Muster                       | Beispiel                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| Haupt-/Direktchat (pro Agent) | `agent:<agentId>:<mainKey>` (Standardwert `main`)                |
| Gruppe                       | `agent:<agentId>:<channel>:group:<id>`                      |
| Raum/Kanal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (sofern nicht überschrieben)                           |

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf einen aktuellen `sessionId` (die SQLite-Transkriptidentität, welche die Unterhaltung fortsetzt). Die Entscheidungslogik befindet sich in `initSessionState()` in `src/auto-reply/reply/session.ts`.

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diese `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig um 4:00 Uhr Ortszeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Rücksetzgrenze eine neue `sessionId`.
- **Ablauf bei Inaktivität** (`session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach Ablauf des Inaktivitätszeitraums eine Nachricht eingeht. Wenn sowohl das tägliche Zurücksetzen als auch der Ablauf bei Inaktivität konfiguriert sind, gilt das Ereignis, das zuerst eintritt.
- **Fortsetzung nach erneuter Verbindung der Control UI** behält die aktuell sichtbare Sitzung für einen Sendevorgang nach der erneuten Verbindung bei, wenn das Gateway die passende `sessionId` von einem Benutzeroberflächen-Client des Operators empfängt. Dies ist ein einmaliges Signal; gewöhnliche veraltete Sendevorgänge erstellen weiterhin eine neue `sessionId`.
- **Systemereignisse** (Heartbeat, Cron-Aktivierungen, Ausführungsbenachrichtigungen, Gateway-Buchführung) können die Sitzungszeile ändern, verlängern jedoch niemals die Aktualität für das tägliche Zurücksetzen oder das Zurücksetzen bei Inaktivität. Beim Übergang nach einem Zurücksetzen werden in der Warteschlange befindliche Systemereignisbenachrichtigungen für die vorherige Sitzung verworfen, bevor der neue Prompt erstellt wird.
- **Richtlinie für übergeordnete Forks** verwendet beim Erstellen eines Threads oder Subagent-Forks den aktiven Branch von OpenClaw. Wenn dieser Branch zu groß ist (über einer festen internen Obergrenze, derzeit 100K Token), startet OpenClaw das untergeordnete Element mit isoliertem Kontext, statt den Vorgang fehlschlagen zu lassen oder unbrauchbaren Verlauf zu übernehmen. Die Größenbestimmung erfolgt automatisch und ist nicht konfigurierbar; die veraltete Konfiguration `session.parentForkMaxTokens` wird durch `openclaw doctor --fix` entfernt.
- **Operator-Forks**: `sessions.create { parentSessionKey, fork: true }` erstellt eine neue Sitzung, deren Transkript vom aktuellen Zustand der übergeordneten Sitzung abzweigt (derselbe Fork-Mechanismus wie beim Erzeugen von Subagents, einschließlich der obigen Größenobergrenze). Der Fork wird abgelehnt, solange in der übergeordneten Sitzung eine Ausführung aktiv ist, übernimmt die Modellauswahl der übergeordneten Sitzung, sofern nicht ausdrücklich eine andere angegeben wird, und kennzeichnet das untergeordnete Element `forkedFromParent` mit neuen Token-Zählern.

## Schema des Sitzungsspeichers

Der Laufzeitspeicher verwaltet `SessionEntry`-Werte in agentenspezifischem SQLite. Der Werttyp ist `SessionEntry` in `src/config/sessions.ts`. Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID, die zum Adressieren von SQLite-Transkriptzeilen verwendet wird
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Aktualität des täglichen Zurücksetzens verwendet diesen Wert. Bei veralteten Zeilen kann er aus dem JSONL-Sitzungsheader abgeleitet werden.
- `lastInteractionAt`: Zeitstempel der letzten tatsächlichen Benutzer-/Kanalinteraktion; die Aktualität des Zurücksetzens bei Inaktivität verwendet diesen Wert, damit Heartbeat-, Cron- und Ausführungsereignisse Sitzungen nicht aktiv halten. Veraltete Zeilen ohne dieses Feld greifen auf die wiederhergestellte Sitzungsstartzeit zurück.
- `updatedAt`: Zeitstempel der letzten Änderung der Speicherzeile, verwendet für Auflistung/Bereinigung/Buchführung – nicht maßgeblich für die Aktualität des täglichen Zurücksetzens oder des Zurücksetzens bei Inaktivität.
- `archivedAt`: optionaler Archivzeitstempel. Archivierte Sitzungen verbleiben mit intaktem Transkript im Speicher und werden aus normalen Auflistungen aktiver Sitzungen ausgeschlossen.
- `pinnedAt`: optionaler Anheftzeitstempel. Aktive angeheftete Sitzungen werden vor nicht angehefteten Sitzungen sortiert; beim Archivieren einer Sitzung wird ihre Anheftung aufgehoben.
- Codex-Thread-Interoperabilität: Beide Felder folgen der Codex-Form für die Thread-Verwaltung – die booleschen Werte `archived`/`pinned` in der Übertragung werden stets aus dem Zeitstempel abgeleitet und serverseitig gesetzt, entsprechend der Codex-Semantik für `threads.archived_at` und der camelCase-Serialisierung. OpenClaw-Zeitstempel verwenden Millisekunden seit der Epoche, während Codex Sekunden seit der Epoche verwendet; daher führen Bridges die Konvertierung an der Plugin-Schnittstelle `codex` durch. Codex verfügt noch über keine API zum Anheften (nur `thread/archive`/`thread/unarchive`); der Anheftstatus verbleibt auf der OpenClaw-Seite, bis eine solche API vorhanden ist. Dann ermöglicht die übereinstimmende Form gebundenen Sitzungen, den Anheftstatus automatisch in beide Richtungen zu übertragen.
- Die Codex-Überwachung listet nur nicht archivierte native Threads auf. Ein Gateway-lokaler Thread mit `idle` oder unbekannter Aktivität (`notLoaded`) kann über die native `thread/archive` nur archiviert werden, nachdem der Operator ausdrücklich bestätigt hat, dass kein anderer Codex-Prozess ihn besitzt; das Plugin führt zunächst eine aktuelle prozesslokale Statusabfrage durch, danach verschwindet der Thread aus dem Katalog. Diese Abfrage kann nicht beweisen, dass kein anderer App-Server-Prozess den Thread verwendet. OpenClaw lehnt das Archivieren aktiver Zeilen und Fehlerzeilen ab, und die Archivierung über einen gekoppelten Node ist nicht verfügbar, bis die Node-Bridge den vollständigen gestreamten Thread-Lebenszyklus verwalten kann. Durch das Aufheben der Archivierung in einem nativen Codex-Client kann der Thread wieder angezeigt werden.
- `lastReadAt` / `markedUnreadAt`: serverseitig durch `sessions.patch { unread }` gesetzte Lesestatus-Zeitstempel – `unread: false` zeichnet einen Lesevorgang auf (setzt `lastReadAt`, löscht `markedUnreadAt`); `unread: true` markiert die Sitzung bis zum nächsten Lesevorgang als ungelesen. Sitzungszeilen stellen einen abgeleiteten booleschen Wert `unread` bereit: ausdrücklich als ungelesen markiert oder vor der letzten Aktivität gelesen. Sitzungen, die nie als gelesen markiert wurden, bleiben `unread: false`, damit bestehende Installationen nach einem Upgrade nicht plötzlich als ungelesen erscheinen.
- `lastActivityAt`: Zeitstempel der letzten abgeschlossenen Agent-Ausführung, die als eine als ungelesen relevante Aktivität zählt (Benutzer-, Kanal- und Cron-Ausführungen). Heartbeat- und interne Ereignis-Turns sowie Metadaten-Patches aktualisieren ihn nicht; `updatedAt` ist kein Aktivitätssignal.
- `sessionFile`: veraltete Markierung, die für Migrations-/Archivkompatibilität beibehalten wird; die aktive Laufzeit verwendet die SQLite-Identität
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten zur Gruppen-/Kanalbeschriftung
- Umschalter: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (sitzungsspezifische Überschreibung)
- Modellauswahl: `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (nach bestem Bemühen/providerabhängig): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt` / `memoryFlushCompactionCount`: Zeitstempel und Compaction-Anzahl der letzten Speicherleerung vor der Compaction

Das Gateway ist die maßgebliche Instanz: Es kann Einträge neu schreiben oder wiederherstellen, während Sitzungen
ausgeführt werden. Migrieren Sie bei veralteten dateibasierten Installationen mit
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`, statt
`sessions.json` zu bearbeiten und zu erwarten, dass die Laufzeit diese Datei weiterhin liest.

## Struktur der Transkriptereignisse

Transkripte werden durch den OpenClaw-Sitzungszugriff verwaltet und dem Laufzeitcode über identitätsbasierte Hilfsfunktionen bereitgestellt. Der Ereignisstrom ist nur anhängbar:

- Erster Eintrag: Sitzungsheader – `type: "session"`, `id`, `cwd`, `timestamp`, optional `parentSession`.
- Danach: Einträge mit `id` + `parentId` (Baumstruktur).

Wichtige Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: von einer Erweiterung eingefügte Nachricht, die _tatsächlich_ in den Modellkontext eingeht (wird in der TUI dargestellt, wenn `display: true`, und vollständig ausgeblendet, wenn `display: false`)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht (zum dauerhaften Speichern des Erweiterungszustands über Neuladevorgänge hinweg)
- `compaction`: dauerhaft gespeicherte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: dauerhaft gespeicherte Zusammenfassung beim Navigieren in einem Baum-Branch

OpenClaw „korrigiert“ Transkripte absichtlich nicht; das Gateway verwendet `SessionManager`, um sie zu lesen bzw. zu schreiben.

## Kontextfenster im Vergleich zu erfassten Token

Zwei unterschiedliche Konzepte:

1. **Modellkontextfenster**: feste Obergrenze pro Modell (für das Modell sichtbare Token). Stammt aus dem Modellkatalog und kann über die Konfiguration überschrieben werden.
2. **Zähler des Sitzungsspeichers**: fortlaufende Statistiken, die in die Sitzungszeile geschrieben werden (verwendet für `/status` und Dashboards). `contextTokens` ist ein Laufzeitschätz-/Berichtswert – behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen zu Grenzwerten: [/reference/token-use](/de/reference/token-use).

## Compaction: Was sie ist

Compaction fasst ältere Unterhaltungen in einem dauerhaft gespeicherten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten unverändert. Nach der Compaction sehen zukünftige Turns die Compaction-Zusammenfassung sowie die Nachrichten nach `firstKeptEntryId`. Compaction ist **dauerhaft**, im Gegensatz zur Sitzungsbereinigung – siehe [/concepts/session-pruning](/de/concepts/session-pruning).

Das erneute Einfügen von AGENTS.md-Abschnitten nach der Compaction wird über `agents.defaults.compaction.postCompactionSections` aktiviert; wenn diese Option nicht gesetzt ist oder `[]` lautet, hängt OpenClaw keine AGENTS.md-Auszüge an die Compaction-Zusammenfassung an.

### Abschnittsgrenzen und Tool-Zuordnung

Beim Aufteilen eines langen Transkripts in Compaction-Abschnitte hält OpenClaw Assistent-Tool-Aufrufe mit den zugehörigen `toolResult`-Einträgen zusammen:

- Wenn die Aufteilung nach Token-Anteil zwischen einem Tool-Aufruf und seinem Ergebnis liegen würde, verschiebt OpenClaw die Grenze zur Assistentennachricht mit dem Tool-Aufruf, statt das Paar zu trennen.
- Wenn ein abschließender Tool-Ergebnisblock den Abschnitt andernfalls über die Zielgröße hinaus vergrößern würde, bewahrt OpenClaw diesen ausstehenden Tool-Block und lässt den nicht zusammengefassten Rest unverändert.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten eine ausstehende Aufteilung nicht offen.

## Wann automatische Compaction erfolgt

Zwei Auslöser im eingebetteten OpenClaw-Agent:

1. **Wiederherstellung nach Überlauf**: Das Modell gibt einen Kontextüberlauffehler zurück (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` und weitere providerspezifische Varianten) – Compaction durchführen, dann erneut versuchen. Wenn der Provider die Anzahl der versuchten Token meldet, leitet OpenClaw diese beobachtete Anzahl an die Compaction zur Überlaufwiederherstellung weiter. Wenn der Provider einen Überlauf bestätigt, aber keine analysierbare Anzahl bereitstellt, übergibt OpenClaw den Compaction-Engines und der Diagnose eine synthetische Anzahl, die das Budget minimal überschreitet. Wenn die Überlaufwiederherstellung weiterhin fehlschlägt, zeigt OpenClaw ausdrückliche Anweisungen an und behält die aktuelle Sitzungszuordnung bei, statt stillschweigend zu einer neuen Sitzungs-ID zu wechseln – versuchen Sie die Nachricht erneut, führen Sie `/compact` aus oder führen Sie `/new` aus.
2. **Schwellenwertwartung**: nach einem erfolgreichen Turn, wenn `contextTokens > contextWindow - reserveTokens`, wobei `contextWindow` das Kontextfenster des Modells ist und `reserveTokens` der für Prompts und die nächste Modellausgabe reservierte Spielraum ist.

Zwei zusätzliche Schutzmechanismen werden außerhalb dieser beiden Auslöser ausgeführt:

- **Lokale Compaction vor der Ausführung**: Legen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` (Byte oder eine Zeichenfolge wie `"20mb"`) fest, um vor dem Öffnen der nächsten Ausführung eine lokale Compaction auszulösen, sobald das aktive Transkript diese Größe erreicht. Dies ist eine Größenbegrenzung für die Kosten des lokalen erneuten Öffnens, keine reine Archivierung – die normale semantische Compaction wird weiterhin ausgeführt und erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem neuen Nachfolgetranskript wird.
- **Vorabprüfung während des Turns**: Legen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true` (Standardwert `false`) fest, um einen Schutzmechanismus für die Tool-Schleife hinzuzufügen. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck anhand derselben Vorab-Budgetlogik, die zu Beginn des Turns verwendet wird. Wenn der Kontext nicht mehr passt, führt der Schutzmechanismus keine direkte Compaction durch – er löst ein strukturiertes Signal der Vorabprüfung während des Turns aus, stoppt die aktuelle Prompt-Übermittlung und lässt die äußere Ausführungsschleife den vorhandenen Wiederherstellungspfad verwenden (übergroße Tool-Ergebnisse kürzen, wenn dies ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen). Funktioniert sowohl mit dem Compaction-Modus `default` als auch mit `safeguard`, einschließlich providergestützter Schutz-Compaction. Unabhängig von `maxActiveTranscriptBytes`: Der Schutzmechanismus für die Bytegröße wird ausgeführt, bevor ein Turn geöffnet wird; die Vorabprüfung während des Turns erfolgt später, nachdem neue Tool-Ergebnisse angehängt wurden.

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

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen: Wenn `compaction.reserveTokens` unter `reserveTokensFloor` liegt (Standardwert `20000`), hebt OpenClaw den Wert entsprechend an. Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren. Wenn das Kontextfenster des aktiven Modells bekannt ist, werden sowohl die Untergrenze als auch die endgültige effektive Reserve begrenzt, damit die Reserve nicht das gesamte Prompt-Budget aufbrauchen kann. Dadurch beginnen Modelle mit kleinem Kontextfenster (beispielsweise ein lokales Modell mit 16K Token) nicht bereits ab dem ersten Token mit der Compaction; ohne bekanntes Kontextfenster bleiben konfigurierte und aktuelle Reservebudgets unbegrenzt. Warum überhaupt eine Untergrenze: So bleibt ausreichend Spielraum für mehrschrittige „Aufräumarbeiten“ (wie das nachfolgend beschriebene Schreiben des Speichers), bevor eine Compaction unvermeidbar wird. Implementierung: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`, aufgerufen aus den Pfaden für eingebettete Runner-Turns und die Compaction-Einrichtung.

Eine manuelle `/compact` berücksichtigt eine explizite Angabe von `agents.defaults.compaction.keepRecentTokens` und behält den Abschnitt des Runtimes mit den neuesten Turns bei. Ohne ein explizites Aufbewahrungsbudget ist die manuelle Compaction ein fester Prüfpunkt, und der neu aufgebaute Kontext beginnt mit der neuen Zusammenfassung.

Wenn `truncateAfterCompaction` aktiviert ist, rotiert OpenClaw das aktive Transkript nach der Compaction zu einem komprimierten Nachfolger. Aktionen zum Verzweigen/Wiederherstellen von Prüfpunkten verwenden diesen komprimierten Nachfolger; ältere Prüfpunktdateien von vor der Compaction bleiben lesbar, solange auf sie verwiesen wird.

## Austauschbare Compaction-Provider

Plugins registrieren über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider. Wenn `agents.defaults.compaction.provider` auf die ID eines registrierten Providers gesetzt ist, delegiert die Schutzmechanismus-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Nicht festlegen, um die standardmäßige LLM-Zusammenfassung zu verwenden. Das Festlegen von `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Bezeichnererhaltung wie der integrierte Pfad. Der Schutzmechanismus bewahrt nach der Provider-Ausgabe weiterhin den Kontext der neuesten Turns und des Suffixes geteilter Turns.
- Die integrierte Zusammenfassung des Schutzmechanismus verdichtet frühere Zusammenfassungen zusammen mit neuen Nachrichten erneut, statt die vollständige vorherige Zusammenfassung unverändert beizubehalten.
- Der Schutzmodus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; setzen Sie `qualityGuard.enabled: false`, um Wiederholungsversuche bei fehlerhaft formatierter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück. Vom Aufrufer ausdrücklich ausgelöste Abbruch-/Zeitüberschreitungssignale werden erneut ausgelöst und nicht unterdrückt, sodass Abbrüche stets berücksichtigt werden.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Für Benutzer sichtbare Oberflächen

- `/status` in jeder Chatsitzung
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Gateway-Protokolle (`pnpm gateway:watch` oder `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ausführlicher Modus: `🧹 Auto-compaction complete` plus die Anzahl der Compactions

## Stille Aufräumarbeiten (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen Benutzer keine Zwischenausgabe sehen sollen.

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` / `no_reply`, um „keine Antwort an den Benutzer zustellen“ zu signalisieren. OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens unterscheidet nicht zwischen Groß- und Kleinschreibung: `NO_REPLY` und `no_reply` gelten beide, wenn die gesamte Nutzlast ausschließlich aus dem stillen Token besteht.
- Seit `2026.1.10` unterdrückt OpenClaw außerdem das Streaming von Entwürfen/Tippeingaben, wenn ein Teilabschnitt mit `NO_REPLY` beginnt, damit bei stillen Vorgängen nicht mitten im Turn Teilausgaben sichtbar werden.
- Dies ist ausschließlich für echte Hintergrund-Turns ohne Zustellung vorgesehen – nicht als Abkürzung für gewöhnliche, konkrete Benutzeranfragen.

## Schreiben des Speichers vor der Compaction

Bevor eine automatische Compaction erfolgt, kann OpenClaw einen stillen agentischen Turn ausführen, der dauerhaften Zustand auf den Datenträger schreibt (beispielsweise `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit die Compaction keinen kritischen Kontext löschen kann. OpenClaw überwacht die Nutzung des Sitzungskontexts. Sobald sie einen weichen Schwellenwert unterhalb des Compaction-Schwellenwerts überschreitet, sendet OpenClaw eine stille Anweisung zum sofortigen Schreiben des Speichers und verwendet dabei das exakte stille Token `NO_REPLY` / `no_reply`, sodass Benutzer nichts sehen.

Konfiguration (`agents.defaults.compaction.memoryFlush`), vollständige Referenz unter [/gateway/config-agents](/de/gateway/config-agents#agentsdefaultscompaction):

| Schlüssel                    | Standardwert     | Hinweise                                                                                                                               |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | nicht festgelegt | exakte Provider-/Modellüberschreibung nur für den Schreib-Turn, beispielsweise `ollama/qwen3:8b`                                      |
| `softThresholdTokens`       | `4000`           | Abstand unterhalb des Compaction-Schwellenwerts, der das Schreiben auslöst                                                             |
| `forceFlushTranscriptBytes` | nicht festgelegt (deaktiviert) | erzwingt das Schreiben, sobald die Transkriptdatei diese Bytegröße erreicht (oder eine Zeichenfolge wie `"2mb"`), selbst wenn die Token-Zähler veraltet sind; `0` deaktiviert dies |
| `prompt`                    | integriert       | Benutzernachricht für den Schreib-Turn                                                                                                 |
| `systemPrompt`              | integriert       | zusätzlicher System-Prompt, der für den Schreib-Turn angehängt wird                                                                    |

Hinweise:

- Der standardmäßige Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis zur Unterdrückung der Zustellung.
- Wenn `model` festgelegt ist, verwendet der Schreib-Turn dieses Modell, ohne die Fallback-Kette der aktiven Sitzung zu übernehmen. Dadurch greift eine ausschließlich lokale Aufräumaktion bei einem Fehler nicht unbemerkt auf ein kostenpflichtiges Konversationsmodell zurück.
- Das Schreiben wird einmal pro Compaction-Zyklus ausgeführt (in der Sitzungszeile nachverfolgt).
- Das Schreiben wird nur für eingebettete OpenClaw-Sitzungen ausgeführt; CLI-Backends und Heartbeat-Turns überspringen es.
- Das Schreiben wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Weitere Informationen zur Dateistruktur des Arbeitsbereichs und zu Schreibmustern finden Sie unter [Speicher](/de/concepts/memory).

OpenClaw stellt in der Erweiterungs-API einen `session_before_compact`-Hook bereit. Die oben beschriebene Schreiblogik befindet sich jedoch auf der Gateway-Seite (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`) und nicht in diesem Hook.

## Checkliste zur Fehlerbehebung

- **Falscher Sitzungsschlüssel?** Beginnen Sie mit [/concepts/session](/de/concepts/session) und überprüfen Sie `sessionKey` in `/status`.
- **Abweichung zwischen Speicher und Transkript?** Überprüfen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- **Zu häufige Compaction?** Prüfen Sie das Kontextfenster des Modells (ein zu kleines Fenster erzwingt häufige Compactions), `reserveTokens` (ein für das Modellfenster zu hoher Wert führt zu einer früheren Compaction) und übermäßig große Werkzeugergebnisse (passen Sie die Sitzungsbereinigung an).
- **Scheint bei einem kleinen lokalen Modell jeder Prompt überzulaufen?** Stellen Sie sicher, dass der Provider das korrekte Kontextfenster des Modells meldet. OpenClaw kann die effektive Reserve nur begrenzen, wenn dieses Fenster bekannt ist.
- **Werden stille Turns sichtbar?** Stellen Sie sicher, dass die Antwort mit dem exakten stillen Token `NO_REPLY` beginnt (Groß-/Kleinschreibung wird nicht berücksichtigt) und dass Sie einen Build verwenden, der die Korrektur zur Streaming-Unterdrückung enthält (`2026.1.10`+).

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
- [Referenz zur Agent-Konfiguration](/de/gateway/config-agents)
