---
read_when:
    - Sie müssen Sitzungs-IDs, Transkriptereignisse oder Felder von Sitzungszeilen debuggen
    - Sie ändern das Verhalten der automatischen Compaction oder fügen Aufräumarbeiten vor der Compaction hinzu.
    - Sie möchten Speicherleerungen oder stille System-Turns implementieren
summary: 'Tiefgehende Analyse: Sitzungsspeicher und Transkripte, Lebenszyklus und Interna der (automatischen) Compaction'
title: Ausführliche Erläuterung der Sitzungsverwaltung
x-i18n:
    generated_at: "2026-07-24T05:20:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ae02d49245768831abd17e1c2e5adacfa1a36673cef2a8a7a06a5300392b104
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Ein einzelner **Gateway-Prozess** verwaltet den Sitzungsstatus durchgehend. Benutzeroberflächen (macOS-App, Web-Control-UI, TUI) fragen beim Gateway Sitzungslisten und Token-Anzahlen ab. Im Remote-Modus befinden sich Sitzungsdateien auf dem Remote-Host. Eine Prüfung der Dateien auf Ihrem lokalen Mac gibt daher nicht wieder, was der Gateway verwendet.

Zunächst die Übersichtsdokumentation: [Sitzungsverwaltung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Speicherübersicht](/de/concepts/memory), [Speichersuche](/de/concepts/memory-search), [Sitzungsbereinigung](/de/concepts/session-pruning), [Transkripthygiene](/de/reference/transcript-hygiene), vollständige Konfigurationsreferenz unter [Agent-Konfiguration](/de/gateway/config-agents).

## Zwei Persistenzebenen

1. **Sitzungszeilen (agentenspezifisches SQLite)** – Schlüssel/Wert-Zuordnung `sessionKey -> SessionEntry`. Veränderlicher, vom Gateway verwalteter Laufzeitstatus. Erfasst Metadaten: aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler.
2. **Transkriptereignisse (agentenspezifisches SQLite)** – nur anhängbar, baumartig strukturiert (Einträge haben `id` + `parentId`). Speichert die Konversation, Tool-Aufrufe und Compaction-Zusammenfassungen und rekonstruiert den Modellkontext für zukünftige Interaktionen. Compaction-Prüfpunkte sind Metadaten zum komprimierten Nachfolgetranskript – eine neue Compaction schreibt keine zweite Kopie von `.checkpoint.*.jsonl`.

Ältere Installationen können im Verzeichnis `sessions/` des Agenten noch
Dateien vom Typ `sessions.json` enthalten. Behandeln Sie diese Dateien als Eingaben für die Migration
veralteter Sitzungszeilen oder als explizite Ziele der Offline-Wartung. Beim Start des Gateway
und durch `openclaw doctor --fix` werden aktive veraltete Zeilen und der Transkriptverlauf
automatisch in den agentenspezifischen SQLite-Speicher importiert.
Führen Sie `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` aus und folgen Sie anschließend der [Doctor-Migrationssequenz
](/de/cli/doctor#session-sqlite-migration), wenn Sie explizite Inspektions- oder
Validierungsnachweise benötigen. Wenn eine Migration fehlschlägt, nachdem veraltete Transkriptartefakte
archiviert wurden, verwenden Sie den Doctor-Wiederherstellungsmodus aus dieser Sequenz.
Die Wiederherstellung verwendet Migrationsmanifeste, stellt nur die betroffenen archivierten
Supportartefakte wieder her, bereitet auf Anfrage einen bereinigten GitHub-Issue-Bericht vor und
veranlasst die aktive Laufzeit nicht dazu, JSONL-Dateien erneut einzulesen.

Gateway-Verlaufsleser vermeiden es, das gesamte Transkript zu materialisieren, sofern die jeweilige Oberfläche keinen beliebigen historischen Zugriff benötigt. Der Verlauf der ersten Seite, der eingebettete Chatverlauf, die Wiederherstellung nach einem Neustart sowie Token- und Nutzungsprüfungen verwenden begrenzte Tail-Lesevorgänge aus SQLite. Vollständige Transkriptscans laufen über den asynchronen Transkriptindex und werden von gleichzeitig ausgeführten Lesern gemeinsam genutzt.

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host (aufgelöst über `src/config/sessions.ts`):

- Laufzeit-Sitzungszeilenspeicher: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Laufzeit-Transkriptzeilen: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Veraltete/archivierte Transkriptartefakte: `~/.openclaw/agents/<agentId>/sessions/`
- Migrationseingabe für veraltete Zeilen: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Speicherwartung und Datenträgersteuerung

`session.maintenance` steuert die automatische Wartung für SQLite-Sitzungszeilen, SQLite-Transkriptzeilen, Archivartefakte und Trajektorien-Sidecars:

| Schlüssel               | Standardwert          | Hinweise                                                                                    |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | oder `"warn"` (nur Bericht, keine Änderung)                                                |
| `pruneAfter`            | `"30d"`               | Altersgrenze für veraltete Einträge                                                         |
| `maxEntries`            | `500`                 | Obergrenze für Sitzungseinträge                                                             |
| `resetArchiveRetention` | beibehalten (keine Altersgrenze) | Altersgrenze für Transkriptarchive vom Typ `*.reset.*`/`*.deleted.*`; eine Dauer aktiviert die Löschung |
| `maxDiskBytes`          | `10gb`                | Datenträgerbudget für Sitzungen pro Agent; `false` deaktiviert es                           |
| `highWaterBytes`        | 80 % von `maxDiskBytes` | Zielwert nach der Budgetbereinigung                                                         |

Ein Zurücksetzen setzt die aktive `sessionKey -> sessionId`-Zuordnung fort, behält jedoch die vorherigen SQLite-Sitzungs-, Transkript-, Trajektorien- und Suchzeilen bei. Dieser Verlauf bleibt unter demselben Sitzungsschlüssel durchsuchbar; gewöhnliche Eintrags- und Sitzungslisten zeigen nur die neue aktive Zuordnung an. Der beibehaltene Rücksetzungsverlauf wird durch das Datenträgerbudget begrenzt, nicht durch `resetArchiveRetention`, das ausschließlich Archivartefakte altern lässt. Die explizite Löschung verhält sich anders: Sie schreibt und überprüft ein komprimiertes Transkriptarchiv (`*.jsonl.deleted.<timestamp>.zst`, wenn zstd verfügbar ist), bevor die Zeilen der gelöschten Sitzung entfernt werden.

Die Durchsetzung von `maxDiskBytes` verwendet physische Bytes: die agentenspezifische SQLite-Hauptdatei, ihre Datei `-wal` und die gezählten Dateien im Sitzungsverzeichnis des Agenten. Sie schätzt niemals die JSON-Größe von Zeilen und zieht keine logischen Zeilengrößen von dieser Summe ab.

Gateway-Prüfsitzungen für Modellläufe (Schlüssel, die `agent:*:explicit:model-run-<uuid>` entsprechen) erhalten eine separate, feste Aufbewahrungsdauer von `24h`. Diese Bereinigung ist druckabhängig: Sie wird nur ausgeführt, wenn die Wartung oder Obergrenze der Sitzungseinträge erreicht ist, und nur vor der globalen Bereinigung beziehungsweise Begrenzung veralteter Einträge. Andere explizite Sitzungen verwenden diese Aufbewahrungsdauer nicht.

Wenn die kombinierte physische Nutzung `maxDiskBytes` überschreitet, gibt `mode: "enforce"` zunächst per Checkpoint freigebbaren Datenbankspeicher zurück und entfernt anschließend die ältesten beibehaltenen Rücksetzungs-/Löscharchive. Liegt die Nutzung weiterhin über `highWaterBytes`, werden historische SQLite-Sitzungen nach `sessions.updated_at` durchlaufen, beginnend mit der ältesten. Eine Sitzung gilt als historisch, wenn ihre Sitzungs-ID weder von einem aktiven Sitzungseintrag noch von einem Routenziel oder einem zugelassenen beziehungsweise laufenden Lauf referenziert wird. Für jedes Löschziel schreibt die Bereinigung das komprimierte Archiv, synchronisiert es per fsync und liest es zurück, bevor eine Schreibtransaktion die Sitzungszeile sowie deren Transkript-, Trajektorien-, Aktiv-, Index- und FTS-Projektionen entfernt. Dies umfasst Sitzungen, die Trajektorienereignisse, aber keine Transkriptereignisse enthalten. Die Bereinigung prüft Routen-, Eintrags- und Zulassungsreferenzen zum Löschzeitpunkt erneut, misst die physische Nutzung nach jedem Archiv- oder Sitzungsziel neu und beendet den Vorgang bei `highWaterBytes`.

Bestätigte Schreibvorgänge und Löschungen landen zunächst im WAL. Die Bereinigung erstellt dafür einen Checkpoint, sodass das WAL sofort verkleinert werden kann, und verwendet anschließend inkrementelles Vacuum, um freigabefähige freie Seiten am Ende der Hauptdatei zurückzugeben. Seiten, die noch nicht zurückgewonnen werden können, verbleiben in der Hauptdatei und werden daher bei der nächsten physischen Messung weiterhin mitgezählt. `mode: "warn"` meldet die aktuelle physische Überschreitung, ohne einen Checkpoint zu erstellen, ein Archiv zu schreiben oder Zeilen zu löschen.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Die Wartung behält dauerhafte externe Konversationsverweise wie Gruppensitzungen und Thread-bezogene Chatsitzungen bei. Synthetische Laufzeiteinträge (Cron, Hooks, Heartbeat, ACP, Unteragenten) können jedoch weiterhin entfernt werden, sobald sie das konfigurierte Alters-, Anzahl- oder Datenträgerbudget überschreiten. Isolierte Cron-Läufe verwenden eine separate Steuerung `cron.sessionRetention`, unabhängig von der Aufbewahrung für Modelllauf-Prüfsitzungen.

Normale Gateway-Schreibvorgänge laufen über den Sitzungs-Accessor, der agentenspezifische SQLite-Änderungen über den Laufzeit-Writer-Pfad serialisiert. Laufzeitcode sollte die Accessor-Hilfsfunktionen in `src/config/sessions/session-accessor.ts` bevorzugen; veraltete Hilfsfunktionen vom Typ `sessions.json` sind Werkzeuge für Migration und Offline-Wartung. Wenn ein Gateway erreichbar ist, delegieren `openclaw sessions cleanup` und `openclaw agents delete` ohne Dry Run Speicheränderungen an den Gateway, sodass die Bereinigung dieselbe Writer-Warteschlange verwendet; `--store <path>` ist der explizite Offline-Reparaturpfad für einen ausgewählten veralteten Speicher und bleibt immer lokal (ebenso `--dry-run`). Die Bereinigung von `maxEntries` erfolgt für Speicher in Produktionsgröße in Batches. Daher kann ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten, bevor die nächste Bereinigung beim oberen Schwellenwert ihn wieder darunter bringt. Lesevorgänge bereinigen oder begrenzen Einträge beim Start des Gateway niemals – dies geschieht nur durch Schreibvorgänge oder `openclaw sessions cleanup --enforce`. Letzteres wendet die Obergrenze außerdem sofort an und bereinigt alte, nicht referenzierte veraltete Transkript-, Checkpoint- und Trajektorienartefakte, selbst wenn kein Datenträgerbudget konfiguriert ist.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen Rotationssicherungen vom Typ `sessions.json.bak.*` mehr. Das aktuelle Schema lehnt den veralteten Schlüssel `session.maintenance.rotateBytes` ab, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkriptänderungen verwenden die Sitzungsschreibwarteschlange für das SQLite-Transkriptziel:

Sitzungsschreibsperren verwenden feste Produktionsstandardwerte. Die entsprechenden
Umgebungsvariablen `OPENCLAW_SESSION_WRITE_LOCK_*` bleiben für
Diagnosen auf Prozessebene und Notfallüberschreibungen verfügbar.

### Downgrade nach der SQLite-Umstellung

Stellen Sie archivierte veraltete Transkriptartefakte wieder her, bevor Sie eine ältere,
dateibasierte OpenClaw-Version ausführen:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Die Migration belässt veraltete Dateien vom Typ `sessions.json` für Support und
Rollback, aber aktive Transkript-JSONL-Dateien, die in SQLite importiert wurden,
werden in `session-sqlite-import-archive/` umbenannt. Ältere dateibasierte Laufzeiten verwenden
die Pfade `sessionFile` in `sessions.json`. Daher müssen diese Artefakte
vor dem Start wiederhergestellt werden. Die Wiederherstellung verwendet Migrationsmanifeste,
verschiebt nur erfasste archivierte Artefakte, deren ursprüngliche Pfade fehlen,
und belässt die SQLite-Datenbank für eine spätere Wiederherstellung an ihrem Platz.

Nach der SQLite-Umstellung erstellte Sitzungen sind ausschließlich in SQLite vorhanden und
werden in einer älteren dateibasierten Laufzeit nicht angezeigt. Wenn Sie nach einem Downgrade
erneut ein Upgrade durchführen, führen Sie die Doctor-Inspektions- und Validierungssequenz
erneut aus, damit OpenClaw die wiederhergestellten veralteten Artefakte vor dem Import
überprüfen kann.

## Cron-Sitzungen und Laufprotokolle

Isolierte Cron-Läufe erstellen eigene Sitzungseinträge und Transkripte mit dedizierter Aufbewahrung:

- `cron.sessionRetention` (Standardwert `"24h"`) bereinigt alte isolierte Cron-Laufsitzungen aus dem Speicher; `false` deaktiviert dies.
- Der Laufverlauf behält pro Cron-Auftrag die neuesten 2000 terminalen Zeilen bei. Verlorene Zeilen behalten ihr 24-Stunden-Bereinigungsfenster.

Wenn Cron die Erstellung einer neuen isolierten Laufsitzung erzwingt, bereinigt es den vorherigen Sitzungseintrag `cron:<jobId>`, bevor die neue Zeile geschrieben wird: Sichere Einstellungen (Thinking-/Fast-/Verbose-/Reasoning-Einstellungen, Bezeichnungen, Anzeigename) sowie explizit vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen werden übernommen. Der umgebende Konversationskontext (Kanal-/Gruppenrouting, Sende-/Warteschlangenrichtlinie, Rechteerhöhung, Ursprung, ACP-Laufzeitbindung) wird jedoch verworfen, sodass ein neuer isolierter Lauf keine veralteten Zustellungs- oder Laufzeitberechtigungen von einem älteren Lauf erben kann.

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, in welchem Konversationsbereich Sie sich befinden (Routing + Isolation). Kanonische Regeln: [/concepts/session](/de/concepts/session).

| Muster                       | Beispiel                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| Haupt-/Direktchat (pro Agent) | `agent:<agentId>:<mainKey>` (Standardwert `main`)                |
| Gruppe                       | `agent:<agentId>:<channel>:group:<id>`                      |
| Raum/Kanal (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (sofern nicht überschrieben)                           |

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf einen aktuellen `sessionId` (die SQLite-Transkriptidentität, welche die Konversation fortsetzt). Die Entscheidungslogik befindet sich in `initSessionState()` in `src/auto-reply/reply/session.ts`.

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diese `sessionKey`.
- **Kein automatisches Zurücksetzen** ist die Standardeinstellung. Die aktuelle `sessionId` wird fortgesetzt, während Compaction den aktiven Modellkontext begrenzt hält.
- **Tägliches Zurücksetzen** (`session.reset.mode: "daily"`) erstellt bei der nächsten Nachricht nach der konfigurierten lokalen Stundengrenze (`session.reset.atHour`, Standardwert `4`) eine neue `sessionId`.
- **Ablauf bei Inaktivität** (`session.reset.mode: "idle"` mit `session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erstellt eine neue `sessionId`, wenn eine Nachricht nach Ablauf des Inaktivitätszeitfensters eintrifft. Wenn sowohl täglich als auch bei Inaktivität konfiguriert ist, gilt der zuerst eintretende Ablauf.
- **Fortsetzen nach erneuter Verbindung der Control UI** behält die aktuell sichtbare Sitzung für einen Sendevorgang nach der erneuten Verbindung bei, wenn der Gateway die passende `sessionId` von einem Client der Bediener-UI empfängt. Dies ist ein einmaliges Signal; gewöhnliche veraltete Sendevorgänge erstellen weiterhin eine neue `sessionId`.
- **Systemereignisse** (Heartbeat, Cron-Aktivierungen, Ausführungsbenachrichtigungen, Gateway-Verwaltung) können die Sitzungszeile ändern, verlängern jedoch niemals die Aktualität für tägliches Zurücksetzen oder Zurücksetzen bei Inaktivität. Beim Wechsel durch Zurücksetzen werden in der Warteschlange befindliche Systemereignisbenachrichtigungen für die vorherige Sitzung verworfen, bevor der neue Prompt erstellt wird.
- **Richtlinie für übergeordnete Forks** verwendet beim Erstellen eines Threads oder Subagent-Forks den aktiven Branch von OpenClaw. Wenn dieser Branch zu groß ist (über einer festen internen Obergrenze, derzeit 100K Token), startet OpenClaw das untergeordnete Element mit isoliertem Kontext, statt fehlzuschlagen oder unbrauchbaren Verlauf zu übernehmen. Die Größenbestimmung erfolgt automatisch und ist nicht konfigurierbar; die veraltete Konfiguration `session.parentForkMaxTokens` wird durch `openclaw doctor --fix` entfernt.
- **Bediener-Forks**: `sessions.create { parentSessionKey, fork: true }` erstellt eine neue Sitzung, deren Transkript vom aktuellen Zustand der übergeordneten Sitzung abzweigt (derselbe Fork-Mechanismus wie beim Erzeugen von Subagents, einschließlich der obigen Größenobergrenze). Der Fork wird abgelehnt, solange in der übergeordneten Sitzung eine Ausführung aktiv ist, übernimmt die Modellauswahl der übergeordneten Sitzung, sofern keine explizit übergeben wird, und kennzeichnet das untergeordnete Element mit `forkedFromParent` und neuen Token-Zählern.

## Schema des Sitzungsspeichers

Der Laufzeitspeicher hält `SessionEntry`-Werte in einer SQLite-Datenbank pro Agent. Der Werttyp ist `SessionEntry` in `src/config/sessions.ts`. Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID, mit der SQLite-Transkriptzeilen adressiert werden
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Aktualität für das tägliche Zurücksetzen verwendet diesen Wert. Bei veralteten Zeilen kann er aus dem JSONL-Sitzungsheader abgeleitet werden.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Kanalinteraktion; die Aktualität für das Zurücksetzen bei Inaktivität verwendet diesen Wert, damit Heartbeat-, Cron- und Ausführungsereignisse Sitzungen nicht aktiv halten. Veraltete Zeilen ohne dieses Feld greifen auf die wiederhergestellte Startzeit der Sitzung zurück.
- `updatedAt`: Zeitstempel der letzten Änderung der Speicherzeile, verwendet für Auflistung/Bereinigung/Verwaltung – nicht maßgeblich für die Aktualität beim täglichen Zurücksetzen oder Zurücksetzen bei Inaktivität.
- `archivedAt`: optionaler Archivzeitstempel. Archivierte Sitzungen verbleiben mit intaktem Transkript im Speicher und werden aus normalen aktiven Auflistungen ausgeschlossen.
- `pinnedAt`: optionaler Anheftzeitstempel. Aktive angeheftete Sitzungen werden vor nicht angehefteten Sitzungen sortiert; beim Archivieren einer Sitzung wird ihre Anheftung aufgehoben.
- Codex-Thread-Interoperabilität: Beide Felder entsprechen der Codex-Form für die Thread-Verwaltung – die booleschen Werte `archived`/`pinned` bei der Übertragung werden stets aus dem Zeitstempel abgeleitet und serverseitig gesetzt, entsprechend der Codex-Semantik für `threads.archived_at` und der camelCase-Serialisierung. OpenClaw-Zeitstempel verwenden Millisekunden seit der Epoche, während Codex Sekunden seit der Epoche verwendet; daher konvertieren Brücken an der Plugin-Schnittstelle `codex`. Codex verfügt noch über keine API zum Anheften (nur `thread/archive`/`thread/unarchive`); der angeheftete Zustand verbleibt auf der OpenClaw-Seite, bis eine solche API existiert. Dann ermöglicht die übereinstimmende Form gebundenen Sitzungen, den Anheftzustand mechanisch in beide Richtungen zu übertragen.
- Die Codex-Überwachung listet nur nicht archivierte native Threads auf. Ein Gateway-lokaler Thread mit unbekannter Aktivität vom Typ `idle` oder `notLoaded` kann über das native `thread/archive` erst archiviert werden, nachdem der Bediener explizit bestätigt hat, dass kein anderer Codex-Prozess ihn besitzt; das Plugin liest zunächst erneut den prozesslokalen Status, danach verschwindet der Thread aus dem Katalog. Dieses Lesen kann nicht beweisen, dass kein anderer App-Server-Prozess den Thread verwendet. OpenClaw verweigert die Archivierung aktiver Zeilen und Fehlerzeilen, und die Archivierung gekoppelter Nodes ist nicht verfügbar, bis die Node-Brücke den vollständigen gestreamten Thread-Lebenszyklus verwalten kann. Durch Aufheben der Archivierung in einem nativen Codex-Client kann der Thread wieder angezeigt werden.
- `lastReadAt` / `markedUnreadAt`: serverseitig durch `sessions.patch { unread }` gesetzte Lesestatus-Zeitstempel – `unread: false` zeichnet einen Lesevorgang auf (setzt `lastReadAt`, löscht `markedUnreadAt`); `unread: true` markiert die Sitzung bis zum nächsten Lesevorgang als ungelesen. Sitzungszeilen stellen einen abgeleiteten booleschen Wert `unread` bereit: explizit als ungelesen markiert oder vor der letzten Aktivität gelesen. Sitzungen, die nie als gelesen markiert wurden, bleiben `unread: false`, sodass vorhandene Installationen nach einem Upgrade nicht plötzlich aufleuchten.
- `lastActivityAt`: Zeitstempel der letzten abgeschlossenen Agent-Ausführung, die als relevante ungelesene Aktivität zählt (Benutzer-, Kanal- und Cron-Ausführungen). Heartbeat- und interne Ereignisvorgänge sowie Metadaten-Patches aktualisieren ihn nicht; `updatedAt` ist kein Aktivitätssignal.
- `sessionFile`: veraltete Markierung, die zur Kompatibilität mit Migration und Archivierung beibehalten wird; die aktive Laufzeit verwendet die SQLite-Identität
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten zur Gruppen-/Kanalbeschriftung
- Umschalter: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (sitzungsspezifische Überschreibung)
- Modellauswahl: `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (nach bestem Bemühen/Provider-abhängig): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: Anzahl der erfolgreichen automatischen Compaction-Vorgänge für diesen Sitzungsschlüssel
- `memoryFlushAt` / `memoryFlushCompactionCount`: Zeitstempel und Compaction-Anzahl der letzten Speicherleerung vor der Compaction

Der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen
ausgeführt werden. Migrieren Sie bei veralteten dateibasierten Installationen mit
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`, anstatt
`sessions.json` zu bearbeiten und zu erwarten, dass die Laufzeit diese Datei weiterhin liest.

## Struktur der Transkriptereignisse

Transkripte werden durch den OpenClaw-Sitzungszugriff verwaltet und dem Laufzeitcode über identitätsbasierte Hilfsfunktionen bereitgestellt. Der Ereignisstrom ist ausschließlich anhängbar:

- Erster Eintrag: Sitzungsheader – `type: "session"`, `id`, `cwd`, `timestamp`, optional `parentSession`.
- Danach: Einträge mit `id` + `parentId` (Baumstruktur).

Wichtige Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: durch eine Erweiterung eingefügte Nachricht, die _tatsächlich_ in den Modellkontext eingeht (wird in der TUI dargestellt, wenn `display: true`, und vollständig ausgeblendet, wenn `display: false`)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht (zur dauerhaften Speicherung des Erweiterungszustands über erneutes Laden hinweg)
- `compaction`: dauerhaft gespeicherte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: dauerhaft gespeicherte Zusammenfassung beim Navigieren in einem Baum-Branch

OpenClaw nimmt absichtlich keine „Korrekturen“ an Transkripten vor; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

## Kontextfenster im Vergleich zu erfassten Token

Zwei verschiedene Konzepte:

1. **Modellkontextfenster**: feste Obergrenze pro Modell (für das Modell sichtbare Token). Stammt aus dem Modellkatalog und kann über die Konfiguration überschrieben werden.
2. **Zähler des Sitzungsspeichers**: fortlaufende Statistiken, die in die Sitzungszeile geschrieben werden (verwendet für `/status` und Dashboards). `contextTokens` ist ein Laufzeitschätzungs-/Berichtswert – behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen zu Grenzwerten: [/reference/token-use](/de/reference/token-use).

## Compaction: Was sie ist

Compaction fasst ältere Unterhaltungen in einem dauerhaft gespeicherten Eintrag `compaction` im Transkript zusammen und lässt aktuelle Nachrichten unverändert. Nach der Compaction sehen zukünftige Vorgänge die Compaction-Zusammenfassung sowie Nachrichten nach `firstKeptEntryId`. Compaction ist **dauerhaft**, anders als die Sitzungsbereinigung – siehe [/concepts/session-pruning](/de/concepts/session-pruning).

Die eingebettete OpenClaw-Compaction übernimmt standardmäßig die Denkstufe der Sitzung. Legen Sie `agents.defaults.compaction.thinkingLevel` fest, um für Zusammenfassungsaufrufe eine separate Stufe zu verwenden; die Laufzeit begrenzt sie auf das jeweilige konkrete Compaction-Modell oder Fallback. Die native Compaction des Codex-App-Servers verwaltet ihre Komprimierungsanfrage selbst und kann keine Compaction-spezifische Überschreibung der Denkstufe akzeptieren; daher gibt OpenClaw eine Warnung aus und überlässt diese Einstellung Codex.

Die erneute Einfügung des Abschnitts aus AGENTS.md nach der Compaction bleibt über `agents.defaults.compaction.postCompactionSections` optional aktivierbar. Plugins können über `before_prompt_build` weiteren Prompt-Kontext hinzufügen.

### Chunk-Grenzen und Zuordnung von Werkzeugaufrufen

Beim Aufteilen eines langen Transkripts in Compaction-Chunks hält OpenClaw Werkzeugaufrufe des Assistenten mit den zugehörigen `toolResult`-Einträgen zusammen:

- Wenn die Aufteilung nach Token-Anteil zwischen einem Werkzeugaufruf und dessen Ergebnis liegen würde, verschiebt OpenClaw die Grenze zur Assistentennachricht mit dem Werkzeugaufruf, statt das Paar zu trennen.
- Wenn ein abschließender Werkzeugergebnisblock den Chunk andernfalls über die Zielgröße hinaus vergrößern würde, bewahrt OpenClaw diesen ausstehenden Werkzeugblock und lässt den nicht zusammengefassten Rest unverändert.
- Abgebrochene Werkzeugaufrufblöcke und solche mit Fehler halten keine ausstehende Aufteilung offen.

## Wann die automatische Compaction erfolgt

Zwei Auslöser im eingebetteten OpenClaw-Agent:

1. **Wiederherstellung nach Überlauf**: Das Modell gibt einen Kontextüberlauffehler zurück (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` und weitere Provider-spezifische Varianten) – Compaction durchführen, dann erneut versuchen. Wenn der Provider die Anzahl der versuchten Token meldet, leitet OpenClaw diese beobachtete Anzahl an die Compaction zur Wiederherstellung nach Überlauf weiter; wenn der Provider den Überlauf bestätigt, aber keine auswertbare Anzahl bereitstellt, übergibt OpenClaw eine synthetische Anzahl knapp über dem Budget an Compaction-Engines und Diagnosefunktionen. Wenn die Wiederherstellung nach Überlauf weiterhin fehlschlägt, zeigt OpenClaw ausdrückliche Hinweise an und behält die aktuelle Sitzungszuordnung bei, statt unbemerkt zu einer neuen Sitzungs-ID zu wechseln – versuchen Sie die Nachricht erneut, führen Sie `/compact` aus oder führen Sie `/new` aus.
2. **Schwellenwertwartung**: nach einem erfolgreichen Vorgang, wenn der aktuelle Kontext das Modellfenster abzüglich des integrierten OpenClaw-Spielraums für Prompts und die nächste Modellausgabe überschreitet.

Zwei zusätzliche Schutzmechanismen werden außerhalb dieser beiden Auslöser ausgeführt:

- **Lokale Preflight-Compaction**: Legen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` (Bytes oder eine Zeichenfolge wie `"20mb"`) fest, um vor dem Öffnen des nächsten Laufs eine lokale Compaction auszulösen, sobald das aktive Transkript diese Größe erreicht. Dies ist eine Größenbegrenzung für die lokalen Kosten beim erneuten Öffnen, nicht für die reine Archivierung – die normale semantische Compaction wird weiterhin ausgeführt und erfordert `truncateAfterCompaction`, damit die kompaktierte Zusammenfassung zu einem neuen Nachfolgetranskript wird.
- **Vorabprüfung während des Turns**: Legen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true` (Standardwert `false`) fest, um eine Schutzprüfung für die Tool-Schleife hinzuzufügen. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck anhand derselben Preflight-Budgetlogik, die zu Beginn des Turns verwendet wird. Wenn der Kontext nicht mehr passt, führt die Schutzprüfung keine Inline-Compaction durch – sie löst ein strukturiertes Vorabprüfungssignal während des Turns aus, stoppt die aktuelle Prompt-Übermittlung und überlässt es der äußeren Laufschleife, den vorhandenen Wiederherstellungspfad zu verwenden (überdimensionierte Tool-Ergebnisse kürzen, wenn dies ausreicht, oder den konfigurierten Compaction-Modus auslösen und den Versuch wiederholen). Funktioniert mit den Compaction-Modi `default` und `safeguard`, einschließlich Provider-gestützter Schutz-Compaction. Unabhängig von `maxActiveTranscriptBytes`: Die Schutzprüfung der Bytegröße wird ausgeführt, bevor ein Turn geöffnet wird; die Vorabprüfung während des Turns erfolgt später, nachdem neue Tool-Ergebnisse angehängt wurden.

## Compaction-Einstellungen

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw erzwingt eine integrierte Reserve für eingebettete Läufe und begrenzt sie anhand des aktiven Modellkontextfensters, sodass sie nicht das gesamte Prompt-Budget verbrauchen kann. Dadurch beginnen lokale Modelle mit kleinem Kontext nicht bereits ab dem ersten Token mit der Compaction, während genügend Spielraum für turnübergreifende Verwaltungsaufgaben wie das Leeren des Speichers verbleibt.

Die manuelle Ausführung von `/compact` berücksichtigt einen expliziten Wert für `agents.defaults.compaction.keepRecentTokens` und behält den Schnittpunkt des Laufzeitsystems für den jüngsten Transkriptabschnitt bei. Ohne ein explizites Beibehaltungsbudget ist die manuelle Compaction ein fester Prüfpunkt, und der neu aufgebaute Kontext beginnt mit der neuen Zusammenfassung.

Wenn `truncateAfterCompaction` aktiviert ist, rotiert OpenClaw das aktive Transkript nach der Compaction zu einem kompaktierten Nachfolger. Aktionen zum Verzweigen/Wiederherstellen von Prüfpunkten verwenden diesen kompaktierten Nachfolger; ältere Prüfpunktdateien aus der Zeit vor der Compaction bleiben lesbar, solange auf sie verwiesen wird.

## Austauschbare Compaction-Provider

Plugins registrieren über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider. Wenn `agents.defaults.compaction.provider` auf die ID eines registrierten Providers gesetzt ist, delegiert die Schutzerweiterung die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für die standardmäßige LLM-Zusammenfassung nicht festlegen. Das Festlegen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad, und die Schutzfunktion behält nach der Provider-Ausgabe weiterhin den Suffixkontext der letzten Turns und aufgeteilten Turns bei.
- Die integrierte Schutzzusammenfassung verdichtet frühere Zusammenfassungen zusammen mit neuen Nachrichten erneut, statt die vollständige vorherige Zusammenfassung unverändert beizubehalten.
- Der Schutzmodus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; legen Sie `qualityGuard.enabled: false` fest, um Wiederholungsversuche bei fehlerhaft formatierter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, greift OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück. Vom Aufrufer ausdrücklich ausgelöste Abbruch-/Zeitüberschreitungssignale werden erneut ausgelöst und nicht unterdrückt, sodass ein Abbruch immer berücksichtigt wird.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Für Benutzer sichtbare Oberflächen

- `/status` in jeder Chatsitzung
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Gateway-Protokolle (`pnpm gateway:watch` oder `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ausführlicher Modus: `🧹 Auto-compaction complete` plus die Anzahl der Compaction-Vorgänge

## Stille Verwaltungsaufgaben (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen Benutzer keine Zwischenausgabe sehen sollen.

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` / `no_reply`, um „keine Antwort an den Benutzer zustellen“ zu signalisieren. OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens unterscheidet nicht zwischen Groß- und Kleinschreibung: `NO_REPLY` und `no_reply` zählen beide, wenn die gesamte Nutzlast ausschließlich aus dem stillen Token besteht.
- Seit `2026.1.10` unterdrückt OpenClaw außerdem das Streaming von Entwürfen/Tippanzeigen, wenn ein Teilabschnitt mit `NO_REPLY` beginnt, sodass bei stillen Vorgängen während des Turns keine Teilausgabe sichtbar wird.
- Dies ist ausschließlich für echte Hintergrund-Turns ohne Zustellung vorgesehen – es ist keine Abkürzung für gewöhnliche, handlungsrelevante Benutzeranfragen.

## Speicherleerung vor der Compaction

Bevor eine automatische Compaction erfolgt, kann OpenClaw einen stillen agentischen Turn ausführen, der dauerhaften Zustand auf die Festplatte schreibt (zum Beispiel `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit die Compaction keinen kritischen Kontext löschen kann. OpenClaw überwacht die Nutzung des Sitzungskontexts. Sobald sie einen weichen Schwellenwert unterhalb des Compaction-Schwellenwerts überschreitet, sendet OpenClaw unter Verwendung des exakten stillen Tokens `NO_REPLY` / `no_reply` eine stille Anweisung zum sofortigen Schreiben des Speichers, sodass der Benutzer nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`), vollständige Referenz unter [/gateway/config-agents](/de/gateway/config-agents#agentsdefaultscompaction):

| Schlüssel                    | Standardwert           | Hinweise                                                                                                                               |
| ---------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | nicht festgelegt       | exakte Provider-/Modellüberschreibung ausschließlich für den Leerungs-Turn, zum Beispiel `ollama/qwen3:8b`                            |
| `softThresholdTokens`       | `4000`           | Abstand unterhalb des Compaction-Schwellenwerts, der eine Leerung auslöst                                                              |
| `forceFlushTranscriptBytes` | nicht festgelegt (deaktiviert) | erzwingt eine Leerung, sobald die Transkriptdatei diese Bytegröße erreicht (oder eine Zeichenfolge wie `"2mb"`), selbst wenn die Token-Zähler veraltet sind; `0` deaktiviert |

Hinweise:

- Der integrierte Prompt und der System-Prompt enthalten einen Hinweis `NO_REPLY`, um die Zustellung zu unterdrücken.
- Wenn `model` festgelegt ist, verwendet der Leerungs-Turn dieses Modell, ohne die Fallback-Kette der aktiven Sitzung zu übernehmen, sodass ausschließlich lokale Verwaltungsaufgaben bei einem Fehler nicht unbemerkt auf ein kostenpflichtiges Konversationsmodell zurückfallen.
- Die Leerung wird einmal pro Compaction-Zyklus ausgeführt (in der Sitzungszeile erfasst).
- Die Leerung wird nur für eingebettete OpenClaw-Sitzungen ausgeführt; CLI-Backends und Heartbeat-Turns überspringen sie.
- Die Leerung wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Weitere Informationen zum Dateilayout und zu den Schreibmustern des Arbeitsbereichs finden Sie unter [Speicher](/de/concepts/memory).

OpenClaw stellt in der Erweiterungs-API einen `session_before_compact`-Hook bereit, die oben beschriebene Leerungslogik befindet sich jedoch auf der Gateway-Seite (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`) und nicht in diesem Hook.

## Checkliste zur Fehlerbehebung

- **Falscher Sitzungsschlüssel?** Beginnen Sie mit [/concepts/session](/de/concepts/session) und überprüfen Sie den `sessionKey` in `/status`.
- **Abweichung zwischen Speicher und Transkript?** Überprüfen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- **Zu viele Compaction-Vorgänge?** Prüfen Sie das Kontextfenster des Modells (ein zu kleines Fenster erzwingt häufige Compaction) und aufgeblähte Tool-Ergebnisse (passen Sie die Sitzungsbereinigung an).
- **Scheint bei einem kleinen lokalen Modell jeder Prompt überzulaufen?** Überprüfen Sie, ob der Provider das richtige Modellkontextfenster meldet. OpenClaw kann die effektive Reserve nur begrenzen, wenn dieses Fenster bekannt ist.
- **Werden stille Turns sichtbar?** Stellen Sie sicher, dass die Antwort mit dem exakten stillen Token `NO_REPLY` beginnt (Groß-/Kleinschreibung wird nicht berücksichtigt) und Sie einen Build verwenden, der die Korrektur zur Streaming-Unterdrückung enthält (`2026.1.10`+).

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
- [Referenz zur Agent-Konfiguration](/de/gateway/config-agents)
