---
read_when:
    - Sie möchten ein vollwertiges Sicherungsarchiv für den lokalen OpenClaw-Status
    - Sie möchten vor dem Zurücksetzen oder Deinstallieren in der Vorschau sehen, welche Pfade einbezogen würden
summary: CLI-Referenz für `openclaw backup` (lokale Sicherungsarchive erstellen)
title: Sicherung
x-i18n:
    generated_at: "2026-07-12T15:04:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Erstellen Sie ein lokales Sicherungsarchiv für OpenClaw-Statusdaten, Konfiguration, Authentifizierungsprofile, Kanal-/Provider-Anmeldedaten, Sitzungen und optional Arbeitsbereiche.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Hinweise

- Das Archiv enthält eine `manifest.json` mit den aufgelösten Quellpfaden und der Archivstruktur.
- Standardmäßig wird im aktuellen Arbeitsverzeichnis ein mit Zeitstempel versehenes `.tar.gz`-Archiv erstellt. Dateinamen mit Zeitstempel verwenden die lokale Zeitzone Ihres Computers und enthalten den UTC-Versatz. Wenn sich das aktuelle Arbeitsverzeichnis innerhalb eines zu sichernden Quellverzeichnisbaums befindet, verwendet OpenClaw stattdessen Ihr Home-Verzeichnis als Standardspeicherort für das Archiv.
- Vorhandene Archivdateien werden niemals überschrieben. Ausgabepfade innerhalb der Quellverzeichnisbäume für Statusdaten oder Arbeitsbereiche werden abgelehnt, um eine Selbsteinbeziehung zu vermeiden.
- `openclaw backup verify <archive>` prüft, ob das Archiv genau ein Stammmanifest enthält, lehnt Archivpfade im Traversal-Stil sowie SQLite-Begleitdateien ab, bestätigt das Vorhandensein aller im Manifest deklarierten Nutzdaten, validiert die Dateistruktur jedes SQLite-Snapshots und führt vollständige Integritäts- und Rollenprüfungen für kanonische OpenClaw-Datenbanken aus. Dedizierte Plugin-Schemata bleiben undurchsichtig, da sie möglicherweise vom Eigentümer definierte SQLite-Funktionen erfordern. `openclaw backup create --verify` führt diese Validierung unmittelbar nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert nur die aktive JSON-Konfigurationsdatei.

## Was gesichert wird

`openclaw backup create` plant die Quellen anhand Ihrer lokalen OpenClaw-Installation:

- Das Verzeichnis für Statusdaten (normalerweise `~/.openclaw`)
- Den Pfad der aktiven Konfigurationsdatei
- Das aufgelöste Verzeichnis `credentials/`, wenn es außerhalb des Verzeichnisses für Statusdaten liegt
- Aus der aktuellen Konfiguration ermittelte Arbeitsbereichsverzeichnisse, sofern Sie nicht `--no-include-workspace` angeben

Authentifizierungsprofile und andere agentenspezifische Laufzeitdaten werden in SQLite unterhalb des Verzeichnisses für Statusdaten gespeichert (`agents/<agentId>/agent/openclaw-agent.sqlite`) und daher automatisch vom Sicherungseintrag für Statusdaten erfasst.

`--only-config` überspringt die Ermittlung von Statusdaten, Anmeldedatenverzeichnis und Arbeitsbereichen und archiviert nur den Pfad der aktiven Konfigurationsdatei.

OpenClaw kanonisiert Pfade vor dem Erstellen des Archivs: Wenn sich die Konfiguration, das Anmeldedatenverzeichnis oder ein Arbeitsbereich bereits innerhalb des Verzeichnisses für Statusdaten befinden, werden sie nicht als separate Sicherungsquellen auf oberster Ebene dupliziert. Fehlende Pfade werden übersprungen.

Während der Archiverstellung überspringt OpenClaw bekannte, im laufenden Betrieb veränderte Dateien ohne Wiederherstellungswert: aktive Sitzungstranskripte von Agenten, Cron-Ausführungsprotokolle, rotierende Protokolle, Zustellungswarteschlangen, Socket-/PID-/temporäre Dateien unterhalb des Verzeichnisses für Statusdaten sowie zugehörige temporäre Dateien dauerhafter Warteschlangen. `skippedVolatileCount` im JSON-Ergebnis gibt an, wie viele Dateien absichtlich ausgelassen wurden. SQLite-Datenbanken unterhalb des Verzeichnisses für Statusdaten werden mit `VACUUM INTO` komprimiert, damit Überreste gelöschter Seiten nicht in das Archiv gelangen; aktive WAL-/SHM-Dateien werden nicht kopiert. Bei einer Plugin-eigenen Datenbank, die nicht verfügbare, vom Eigentümer definierte SQLite-Funktionen erfordert, wird der Vorgang sicher abgebrochen, statt auf eine unverarbeitete Seitenkopie zurückzugreifen. SQLite-Dateien, die über Arbeitsbereichssicherungen einbezogen werden, werden als Arbeitsbereichsdateien kopiert und fallen nicht unter die Komprimierungsgarantie.

Installierte Plugin-Quelldateien und Manifestdateien unterhalb des Verzeichnisbaums `extensions/` im Verzeichnis für Statusdaten werden einbezogen, die darin verschachtelten `node_modules/`-Abhängigkeitsverzeichnisse jedoch als reproduzierbare Installationsartefakte übersprungen. Verwenden Sie nach der Wiederherstellung eines Archivs `openclaw plugins update <id>` oder installieren Sie das Plugin mit `openclaw plugins install <spec> --force` erneut, falls ein wiederhergestelltes Plugin fehlende Abhängigkeiten meldet.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht die normale Konfigurationsvorprüfung, damit der Befehl auch bei der Wiederherstellung hilfreich sein kann. Die Ermittlung von Arbeitsbereichen erfordert eine gültige Konfiguration. Daher bricht `openclaw backup create` sofort ab, wenn die Konfigurationsdatei vorhanden, aber ungültig ist und die Sicherung von Arbeitsbereichen weiterhin aktiviert ist.

Führen Sie den Befehl für eine Teilsicherung in dieser Situation erneut mit `--no-include-workspace` aus: Statusdaten, Konfiguration und das externe Anmeldedatenverzeichnis bleiben im Umfang enthalten, während die Ermittlung von Arbeitsbereichen vollständig übersprungen wird.

`--only-config` funktioniert auch bei einer fehlerhaften Konfiguration, da die Konfiguration nicht zur Ermittlung von Arbeitsbereichen analysiert wird.

## Größe und Leistung

OpenClaw erzwingt weder eine integrierte maximale Sicherungsgröße noch eine Größenbeschränkung pro Datei. Praktische Grenzen ergeben sich aus:

- Dem verfügbaren Speicherplatz für das temporäre Schreiben des Archivs und das endgültige Archiv
- Der benötigten Zeit, um große Arbeitsbereichsverzeichnisbäume zu durchlaufen und in eine `.tar.gz`-Datei zu komprimieren
- Der benötigten Zeit, um das Archiv mit `--verify` oder `openclaw backup verify` erneut zu prüfen
- Dem Verhalten des Ziel-Dateisystems: OpenClaw bevorzugt für die Veröffentlichung einen Hardlink-Schritt ohne Überschreiben und greift auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Arbeitsbereiche sind in der Regel der wichtigste Faktor für die Archivgröße. Verwenden Sie `--no-include-workspace` für eine kleinere und schnellere Sicherung oder `--only-config` für das kleinstmögliche Archiv.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
