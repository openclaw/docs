---
read_when:
    - Sie weisen die Umstellung des SQLite-Speichers auf Pfad 3 anhand eines aktiven Gateway nach.
    - Sie müssen erwartete Abweichungen in Legacy-JSONL von Laufzeitfehlern unterscheiden.
    - Sie erstellen oder überprüfen das agentengesteuerte Live-SQLite-E2E-Testsystem
summary: Konzept für den Live-Gateway-Nachweis der Umstellung von Sitzungen und Transkripten auf SQLite in Pfad 3
title: 'Pfad 3: Live-SQLite-E2E-Testumgebung'
x-i18n:
    generated_at: "2026-07-12T15:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Der Path-3-Live-SQLite-E2E-Test-Harness weist nach, dass der Gateway SQLite als
kanonischen Sitzungs- und Transkriptspeicher verwendet, während ältere JSONL-Dateien
Migrationseingaben oder Archivmaterial bleiben. Er ist ein Nachweis-Harness für
Maintainer und kein gewöhnliches Diagnosewerkzeug für Benutzer.

Nachdem ein Gateway Datenverkehr nach der Migration verarbeitet hat, ist die
Übereinstimmung mit älteren JSONL-Dateien kein gültiges Signal für den
Laufzeitzustand mehr. Bei einem fehlerfrei migrierten Gateway können die
SQLite-Transkriptzeilen von den Anzahlen in älteren JSONL-Dateien abweichen, da
neue Interaktionen nur SQLite fortschreiben sollten. Der Live-Harness muss daher
bei jedem Schritt das Verhalten des Gateways, Änderungen an SQLite-Zeilen, die
Inaktivität älterer Dateien und den Zustand der Protokolle messen.

## Befehlsform

Der vorgesehene Live-Befehl lautet:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Der Befehl stellt eine Verbindung zu einem bereits ausgeführten Gateway her. Er
startet oder beendet den Gateway nicht und importiert oder wiederholt die
Migration nicht, sofern später nicht ausdrücklich ein Migrationsmodus
hinzugefügt wird. Eine CI- oder isolierte lokale Variante kann
`test/helpers/openclaw-test-instance.ts` verwenden, der Live-Nachweispfad sollte
jedoch den tatsächlichen Betreiber-Gateway und dessen reale agentenspezifische
SQLite-Datenbank untersuchen.

## Isolierter Nachweis mit gebauter CLI

Der Nachweis-Runner für die gebaute CLI initialisiert einen isolierten älteren
Sitzungsspeicher, startet den neu gebauten Gateway und weist nach, dass der
Startvorgang aktive ältere Sitzungen in SQLite importiert, bevor
Laufzeit-Lesevorgänge beginnen. Er darf vor dem ersten Start des Gateways nicht
`openclaw doctor --fix` ausführen, da dies den manuellen Migrationspfad anstelle
des Upgrade-Pfads nachweisen würde, den Benutzer beim ersten Start nach der
Umstellung erhalten.

Nach dem Startimport darf der isolierte Nachweis
`openclaw doctor --session-sqlite inspect` und
`openclaw doctor --session-sqlite validate` als Diagnosebelege ausführen. Diese
doctor-Befehle steuern nicht die Migration für den Nachweis des Start-Upgrades.
Separate doctor-Importszenarien sollten ältere Transkriptdateien zusammen mit
Verlaufs-Sidecars initialisieren und überprüfen, dass doctor diese Artefakte
archiviert, während SQLite kanonisch bleibt.

## Vorabprüfung

Die Vorabprüfung erfasst eine Ausgangsbasis und schlägt vor dem Senden einer
Nachweisinteraktion fehl, wenn der Gateway nicht verwendbar ist:

- `GET /health` und der detaillierte Gateway-Status müssen einen ausgeführten,
  erreichbaren Gateway melden.
- Die Versionen der CLI und des Gateways müssen mit dem getesteten Branch
  übereinstimmen.
- Der Harness zeichnet einen Protokollcursor für das aktive
  Gateway-Dateiprotokoll auf.
- Der Harness zeichnet die agentenspezifischen SQLite-Tabellenzeilenanzahlen für
  `sessions`, `session_entries`, `transcript_events`,
  `transcript_event_identities` und `session_routes` auf.
- Der Harness zeichnet `mtime`, `size` und die Existenz älterer
  `sessions.json`-Dateien, referenzierter JSONL-Dateien und möglicher
  JSONL-Pfade für die Nachweissitzung auf.
- `lsof -p <gateway-pid>` muss Handles für SQLite-DB/WAL/SHM und keine aktiven
  Handles für `.jsonl` oder `sessions.json` anzeigen.

`openclaw doctor --session-sqlite validate` dient im Live-Modus nur zur
Information. Nach Datenverkehr infolge der Umstellung kann es erwartete
Abweichungen gegenüber älteren Dateien melden. Der Harness sollte die
doctor-Ausgabe zur Klassifizierung und für das Migrationsinventar verwenden,
nicht als maßgebliche Laufzeitentscheidung über Erfolg oder Fehlschlag.

## Agentengesteuertes Szenario

Das Live-Szenario verwendet einen dedizierten Sitzungsschlüssel für den Nachweis
und steuert den Gateway nach Möglichkeit über öffentliche RPC-Pfade. Eine
Agenteninteraktion sollte genügen, um die gewöhnliche Persistenz auszuführen,
der vollständige Nachweis sollte jedoch die 3.1b-Schnittstellen abdecken, für
die zuvor einzelne Live-Prüfungen erforderlich waren:

- Gewöhnliche Chat-Interaktion: Die Nachweissitzung erstellen oder
  wiederverwenden, einen echten Agenten-Prompt senden, auf das endgültige
  Assistentenergebnis warten und `chat.history` oder eine gleichwertige
  Gateway-Projektion überprüfen.
- Transkriptidentität: Überprüfen, dass dieselbe Markierung im Gateway-Verlauf
  und in den SQLite-Transkriptzeilen erscheint, gegebenenfalls einschließlich
  stabiler Ereignisidentitätszeilen.
- Zugriffsfunktionen für Sitzungsmetadaten: Die Nachweissitzung und ausgewählte
  vorhandene Live-Sitzungen über Gateway-/Sitzungszugriffsfunktionen lesen und
  mit den SQLite-Zeilen vergleichen.
- Projektion von Sitzungsänderungen: Eine reversible Änderung an Modell- oder
  Sitzungsmetadaten auf die Nachweissitzung anwenden und anschließend
  überprüfen, dass die projizierte Zeile und die Gateway-Antwort
  übereinstimmen.
- Lebenszyklus von Compaction-Prüfpunkten: Einen Prüfpunkt ausschließlich in
  der Nachweissitzung oder einer vom Harness erstellten synthetischen
  Testsitzung auflisten, verzweigen und wiederherstellen.
- Wiederherstellung nach Neustart: Den sicheren Pfad für
  Wiederherstellungsmarkierungen mit einer kontrollierten Nachweissitzung oder
  einer isolierten Testinstanz ausführen; im Live-Modus darf dieser Schritt nur
  ausgeführt werden, wenn die Zielsitzungsmenge ausdrücklich angegeben und
  reversibel ist.
- Bereinigungslebenszyklus: Die Nachweissitzung löschen oder zurücksetzen und
  anschließend die SQLite-Lebenszykluszeilen sowie den archivierten
  Transkriptzustand überprüfen.

Transportspezifische Schnittstellen, die auf dem Live-Betreiber-Gateway nicht
sicher ausgeführt werden können, beispielsweise der Eingang über WhatsApp oder
Sprachanrufe, sollten Laufzeitprüfungen auf Eigentümerebene anhand desselben
SQLite-Vertrags verwenden, statt einen externen Transport zu simulieren.

## Assertions pro Schritt

Jeder Schritt erstellt Momentaufnahmen des Zustands vor und nach der Ausführung
und schreibt einen strukturierten Assertionsdatensatz:

- SQLite-Zeilenanzahlen steigen nur an den erwarteten Stellen.
- Verlaufslaufzeitzeilen steigen bei markierungsgestützten Nachweissitzungen an,
  die Laufzeitereignisse aufzeichnen.
- Die Zeile der Nachweissitzung enthält die erwartete `session_id`, den
  erwarteten Status, die erwarteten Zeitstempel, Metadaten und Routingzeilen.
- Die Gateway-Verlaufs-/Sitzungsprojektion stimmt mit dem Ende des
  SQLite-Transkripts überein.
- Es wird keine JSONL-Datei für die Nachweissitzung erstellt oder geändert.
- Es wird kein Sidecar der Nachweissitzung vom Typ `.trajectory.jsonl`,
  `.trajectory-path.json` oder durch eine Markierung abgeleitetes
  `trajectory/<session>.jsonl` erstellt.
- Vorhandene ältere JSONL-Dateien und `sessions.json` bleiben unverändert, sofern
  der Schritt nicht ausdrücklich eine Offline-Migration oder einen
  Archivierungsvorgang darstellt.
- Der Gateway-Prozess öffnet keine Handles für `.jsonl` oder `sessions.json`.
- Die Protokolle seit dem vorherigen Cursor enthalten weder `ERROR`, `FATAL`,
  `SQLITE_`, `no such column`, „Sitzungsspeicher nicht verfügbar“, einen Fehler
  bei der Wiederherstellung nach einem Neustart noch eine Warnung zur
  Transkriptabstimmung, sofern das Szenario dies nicht ausdrücklich in die
  Zulassungsliste aufnimmt.

Die Protokollprüfung ist Teil des Vertrags für Erfolg oder Fehlschlag. Ein
Gateway, der Statusprüfungen beantwortet, jedoch SQLite-Schemafehler oder
wiederholte Fehler bei der Transkriptabstimmung ausgibt, gilt für Path 3 nicht
als fehlerfrei.

## Nachweisartefakt

Der Harness sollte Nachweise unter `.artifacts/path3-live-e2e/<timestamp>/`
schreiben und sie nicht in Git aufnehmen:

- `summary.json`: Befehlsargumente, Gateway-Version, Ergebnis, fehlgeschlagene
  Assertion und Artefaktpfade.
- `sqlite-before.json` und `sqlite-after.json`: Zeilenanzahlen und ausgewählte
  Nachweiszeilen.
- `legacy-files.json`: Existenz älterer Dateien, `mtime`, Größe und Angabe, ob
  die jeweilige Datei geändert wurde.
- `gateway-log-scan.json`: Cursorbereich, übereinstimmende Protokollzeilen und
  Entscheidungen der Zulassungsliste.
- `events.jsonl`: Geordnete schrittweise Beobachtungen, die für
  PR-Nachweiskommentare geeignet sind.

Der PR-Nachweis sollte diese Artefakte zusammenfassen, statt vollständige
Transkripte oder private Nachrichteninhalte einzufügen.

## Sicherheitsregeln

- Der Live-Modus darf ältere JSONL-Dateien niemals erneut importieren, während
  der Gateway ausgeführt wird.
- Der Live-Modus darf keine anderen Sitzungen als die Nachweissitzungen ändern,
  mit Ausnahme ausdrücklich ausgewählter, reversibler Reparaturprüfungen.
- Jeder destruktive oder umfassende Migrationsschritt erfordert eine neue
  Sicherung der betroffenen SQLite-Datenbank und des Verzeichnisses älterer
  Sitzungen.
- Sicherungen sollten auf die betroffene Agentendatenbank bzw. das betroffene
  Sitzungsverzeichnis beschränkt und während eines Nachweislaufs
  wiederverwendet werden, um unbegrenztes Datenträgerwachstum zu vermeiden.
- Nach dem Bereinigungsschritt dürfen keine Nachweissitzung, Nachweis-JSONL oder
  geänderte ältere Datei zurückbleiben, sofern der Aufrufer nicht
  `--keep-artifacts` übergibt.

## Erfolgreiches Ergebnis

Ein erfolgreicher Live-Lauf bedeutet, dass der Gateway einen echten
agentengesteuerten Sitzungsablauf angenommen hat, sich der gesamte beobachtete
kanonische Zustand in SQLite befand, die älteren Laufzeitdateien inaktiv blieben
und der Protokollzustand während des gemessenen Zeitfensters fehlerfrei blieb.
Er bedeutet nicht, dass die Übereinstimmung mit älteren JSONL-Dateien nach
Live-Datenverkehr weiterhin gegeben ist; Live-Abweichungen werden erwartet,
sobald SQLite der kanonische Speicher ist.
