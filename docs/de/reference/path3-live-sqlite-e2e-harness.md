---
read_when:
    - Sie weisen die Umstellung von Pfad 3 auf SQLite-Speicherung anhand eines aktiven Gateways nach
    - Sie müssen erwartete Abweichungen in veraltetem JSONL von Laufzeitfehlern unterscheiden.
    - Sie erstellen oder überprüfen das agentengesteuerte Live-SQLite-E2E-Testsystem
summary: Entwurf für den Live-Gateway-Nachweis der Umstellung von Sitzungen/Transkripten auf SQLite in Pfad 3
title: 'Pfad 3: Live-SQLite-E2E-Testumgebung'
x-i18n:
    generated_at: "2026-07-24T05:15:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Der Path-3-Live-SQLite-E2E-Harness weist nach, dass der Gateway SQLite als
kanonischen Sitzungs- und Transkriptspeicher verwendet, während ältere JSONL-Dateien
Migrationseingaben oder Archivmaterial bleiben. Er ist ein Nachweis-Harness für Maintainer und kein
gewöhnliches Benutzerdiagnosewerkzeug.

Nachdem ein Gateway Datenverkehr nach der Migration verarbeitet hat, ist die Parität älterer JSONL-Dateien
kein gültiges Signal für den Laufzeitzustand mehr. Ein fehlerfrei migrierter Gateway kann
SQLite-Transkriptzeilen aufweisen, deren Anzahl von älteren JSONL-Dateien abweicht, da neue Interaktionen
nur SQLite fortschreiben sollten. Der Live-Harness muss daher bei jedem
Schritt das Gateway-Verhalten, Änderungen an SQLite-Zeilen, den Ruhezustand älterer Dateien und den Protokollzustand
messen.

## Befehlsform

Der vorgesehene Live-Befehl lautet:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Der Befehl verbindet sich mit einem bereits laufenden Gateway. Er startet oder stoppt
den Gateway nicht, importiert nichts und führt die Migration nicht erneut aus, sofern später nicht
ein expliziter Migrationsmodus hinzugefügt wird. Eine CI- oder isolierte lokale Variante kann
`test/helpers/openclaw-test-instance.ts` verwenden, der Live-Nachweispfad sollte jedoch
den tatsächlichen Betreiber-Gateway und dessen reale agentenspezifische SQLite-Datenbank prüfen.

## Isolierter Nachweis mit gebauter CLI

Der Nachweis-Runner für die gebaute CLI legt einen isolierten älteren Sitzungsspeicher an, startet den
neu gebauten Gateway und weist nach, dass der Start aktive ältere Sitzungen in
SQLite importiert, bevor Laufzeitlesevorgänge beginnen. Er darf `openclaw doctor --fix`
nicht vor dem ersten Gateway-Start ausführen, da dies den manuellen Migrationspfad
anstelle des Upgrade-Pfads nachweisen würde, den Benutzer beim ersten Start nach der Umstellung erhalten.

Nach dem Import beim Start darf der isolierte Nachweis
`openclaw doctor --session-sqlite inspect` und
`openclaw doctor --session-sqlite validate` als Diagnosebelege ausführen. Diese
Doctor-Befehle steuern nicht die Migration für den Nachweis des Upgrades beim Start.
Separate Doctor-Importszenarien sollten ältere Transkriptdateien sowie
Trajektorien-Sidecars anlegen und überprüfen, dass Doctor diese Artefakte archiviert, während SQLite
kanonisch bleibt.

## Vorabprüfung

Die Vorabprüfung erfasst einen Ausgangszustand und schlägt vor dem Senden einer Nachweisinteraktion fehl, wenn der
Gateway nicht verwendbar ist:

- `GET /health` und der ausführliche Gateway-Status müssen einen laufenden, erreichbaren
  Gateway melden.
- Die Versionen von CLI und Gateway müssen dem getesteten Branch entsprechen.
- Der Harness zeichnet einen Protokoll-Cursor für das aktive Dateiprotokoll des Gateways auf.
- Der Harness zeichnet agentenspezifische SQLite-Tabellenzähler für `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` und
  `session_routes` auf.
- Der Harness zeichnet `mtime`, `size` und das Vorhandensein älterer
  `sessions.json`-Dateien, referenzierter JSONL-Dateien und möglicher JSONL-Pfade
  für Nachweissitzungen auf.
- `lsof -p <gateway-pid>` muss Handles für SQLite-DB/WAL/SHM und keine aktiven
  Handles für `.jsonl` oder `sessions.json` anzeigen.

`openclaw doctor --session-sqlite validate` dient im Live-Modus nur zur Information.
Nach Datenverkehr infolge der Umstellung kann es erwartete Abweichungen gegenüber älteren Dateien melden. Der
Harness sollte die Doctor-Ausgabe zur Klassifizierung und für den Migrationsbestand verwenden,
nicht als Kriterium für Bestehen oder Fehlschlagen der Laufzeit.

## Agentengesteuertes Szenario

Das Live-Szenario verwendet einen eigenen Sitzungsschlüssel für den Nachweis und steuert den Gateway
nach Möglichkeit über öffentliche RPC-Pfade. Eine Agenteninteraktion sollte ausreichen, um
die gewöhnliche Persistenz auszuüben, der vollständige Nachweis sollte jedoch die 3.1b-Schnittstellen
abdecken, für die zuvor einzelne Live-Prüfungen erforderlich waren:

- Gewöhnliche Chat-Interaktion: Die Nachweissitzung erstellen oder wiederverwenden, einen echten Agenten-
  Prompt senden, auf das endgültige Assistentenergebnis warten und `chat.history` oder
  eine gleichwertige Gateway-Projektion überprüfen.
- Transkriptidentität: Überprüfen, dass dieselbe Markierung im Gateway-Verlauf und in
  SQLite-Transkriptzeilen erscheint, einschließlich Zeilen mit stabiler Ereignisidentität, sofern vorhanden.
- Zugriffsmethoden für Sitzungsmetadaten: Die Nachweissitzung und ausgewählte bestehende Live-
  Sitzungen über Gateway-/Sitzungszugriffsmethoden lesen und mit SQLite-Zeilen vergleichen.
- Projektion von Sitzungsänderungen: Eine reversible Änderung an Modell-/Sitzungsmetadaten auf
  die Nachweissitzung anwenden und anschließend überprüfen, dass die projizierte Zeile und die Gateway-Antwort übereinstimmen.
- Lebenszyklus von Compaction-Prüfpunkten: Einen Prüfpunkt nur
  für die Nachweissitzung oder eine vom Harness erstellte synthetische Testsitzung auflisten, verzweigen und wiederherstellen.
- Wiederherstellung nach Neustart: Den sicheren Pfad für Wiederherstellungsmarkierungen mit einer kontrollierten Nachweis-
  sitzung oder einer isolierten Testinstanz ausführen; der Live-Modus darf diesen Schritt nur ausführen, wenn
  die Zielsitzungsmenge explizit angegeben und reversibel ist.
- Bereinigungslebenszyklus: Die Nachweissitzung löschen oder zurücksetzen und anschließend die SQLite-
  Lebenszykluszeilen und den archivierten Transkriptzustand überprüfen.

Transportspezifische Schnittstellen, die auf dem Live-Gateway des Betreibers nicht sicher
ausgeübt werden können, etwa der Eingang über WhatsApp oder Sprachanrufe, sollten Laufzeitprüfungen
auf Besitzerebene anhand desselben SQLite-Vertrags verwenden, anstatt einen externen Transport vorzutäuschen.

## Zusicherungen pro Schritt

Jeder Schritt erstellt Momentaufnahmen des Zustands davor und danach und schreibt einen strukturierten
Zusicherungsdatensatz:

- SQLite-Zeilenzähler steigen nur an den erwarteten Stellen.
- Trajektorien-Laufzeitzeilen werden für markierungsgestützte Nachweissitzungen fortgeschrieben, die
  Laufzeitereignisse aufzeichnen.
- Die Zeile der Nachweissitzung enthält die erwarteten `session_id`-Werte, den Status, die Zeitstempel,
  die Metadaten und die Routing-Zeilen.
- Die Verlaufs-/Sitzungsprojektion des Gateways entspricht dem Ende des SQLite-Transkripts.
- Es wird keine JSONL-Datei für die Nachweissitzung erstellt oder geändert.
- Es wird kein `.trajectory.jsonl`-, `.trajectory-path.json`- oder
  aus einer Markierung abgeleitetes `trajectory/<session>.jsonl`-Sidecar für die Nachweissitzung erstellt.
- Vorhandene ältere JSONL-Dateien und `sessions.json` bleiben unverändert, sofern
  der Schritt nicht ausdrücklich ein Offline-Migrations- oder Archivierungsvorgang ist.
- Der Gateway-Prozess öffnet keine Handles für `.jsonl` oder `sessions.json`.
- Die Protokolle seit dem vorherigen Cursor enthalten keine `ERROR`-, `FATAL`-, `SQLITE_`-,
  `no such column`-, „Sitzungsspeicher nicht verfügbar“-, „Wiederherstellung nach Neustart fehlgeschlagen“- oder
  „Transkriptabgleich“-Warnungen, sofern das Szenario diese nicht ausdrücklich zulässt.

Die Protokollprüfung ist Teil des Vertrags für Bestehen oder Fehlschlagen. Ein Gateway, der Zustandsprüfungen
beantwortet, aber SQLite-Schemafehler oder wiederholte Fehler beim Transkriptabgleich ausgibt,
ist für Path 3 nicht fehlerfrei.

## Nachweisartefakt

Der Harness sollte Nachweise unter `.artifacts/path3-live-e2e/<timestamp>/`
schreiben und sie von Git fernhalten:

- `summary.json`: Befehlsargumente, Gateway-Version, Ergebnis, fehlgeschlagene Zusicherung und
  Artefaktpfade.
- `sqlite-before.json` und `sqlite-after.json`: Zeilenzähler und ausgewählte Nachweis-
  zeilen.
- `legacy-files.json`: Vorhandensein älterer Dateien, `mtime`, Größe und Angabe, ob die jeweilige
  Datei geändert wurde.
- `gateway-log-scan.json`: Cursor-Bereich, übereinstimmende Protokollzeilen und Entscheidungen zur
  Zulassungsliste.
- `events.jsonl`: geordnete Beobachtungen pro Schritt, die sich für PR-Nachweiskommentare eignen.

Der PR-Nachweis sollte diese Artefakte zusammenfassen, statt vollständige
Transkripte oder private Nachrichteninhalte einzufügen.

## Sicherheitsregeln

- Der Live-Modus darf ältere JSONL-Dateien niemals erneut importieren, während der Gateway läuft.
- Der Live-Modus darf Sitzungen, die keine Nachweissitzungen sind, nicht verändern, außer für ausdrücklich ausgewählte,
  reversible Reparaturprüfungen.
- Jeder destruktive oder umfassende Migrationsschritt erfordert eine neue Sicherung der
  betroffenen SQLite-Datenbank und des älteren Sitzungsverzeichnisses.
- Sicherungen sollten auf die betroffene Agenten-Datenbank bzw. das betroffene Sitzungsverzeichnis beschränkt und
  während eines Nachweislaufs wiederverwendet werden, um unbegrenztes Festplattenwachstum zu vermeiden.
- Der Bereinigungsschritt darf keine Nachweissitzung, Nachweis-JSONL-Datei oder geänderte ältere
  Datei zurücklassen, sofern der Aufrufer nicht `--keep-artifacts` übergibt.

## Erfolgreiches Ergebnis

Ein erfolgreicher Live-Lauf bedeutet, dass der Gateway einen echten agentengesteuerten Sitzungsablauf akzeptiert hat,
der gesamte beobachtete kanonische Zustand in SQLite vorlag, ältere Laufzeitdateien
im Ruhezustand blieben und der Protokollzustand während des gemessenen Zeitfensters fehlerfrei blieb. Dies bedeutet nicht,
dass die Parität älterer JSONL-Dateien nach Live-Datenverkehr erhalten bleibt; Abweichungen im Live-Betrieb sind zu erwarten,
sobald SQLite der kanonische Speicher ist.
