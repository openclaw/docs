---
read_when:
    - Sie möchten ein vollwertiges Sicherungsarchiv für den lokalen OpenClaw-Zustand
    - Sie möchten vor dem Zurücksetzen oder der Deinstallation eine Vorschau sehen, welche Pfade einbezogen würden
summary: CLI-Referenz für `openclaw backup` (lokale Sicherungsarchive erstellen)
title: Sicherung
x-i18n:
    generated_at: "2026-04-30T06:44:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Erstellen Sie ein lokales Sicherungsarchiv für OpenClaw-Zustand, Konfiguration, Authentifizierungsprofile, Kanal-/Provider-Anmeldedaten, Sitzungen und optional Arbeitsbereiche.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Hinweise

- Das Archiv enthält eine `manifest.json`-Datei mit den aufgelösten Quellpfaden und dem Archivlayout.
- Die Standardausgabe ist ein zeitgestempeltes `.tar.gz`-Archiv im aktuellen Arbeitsverzeichnis.
- Wenn sich das aktuelle Arbeitsverzeichnis innerhalb eines gesicherten Quellbaums befindet, verwendet OpenClaw für den Standardspeicherort des Archivs stattdessen Ihr Home-Verzeichnis.
- Vorhandene Archivdateien werden nie überschrieben.
- Ausgabepfade innerhalb der Quellbäume für Zustand/Arbeitsbereiche werden abgelehnt, um Selbsteinbeziehung zu vermeiden.
- `openclaw backup verify <archive>` überprüft, dass das Archiv genau ein Root-Manifest enthält, lehnt Archivpfade im Traversal-Stil ab und prüft, dass alle im Manifest deklarierten Nutzdaten im Tarball vorhanden sind.
- `openclaw backup create --verify` führt diese Validierung unmittelbar nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert nur die aktive JSON-Konfigurationsdatei.

## Was gesichert wird

`openclaw backup create` plant Sicherungsquellen aus Ihrer lokalen OpenClaw-Installation:

- Das Zustandsverzeichnis, das vom lokalen Zustandsauflöser von OpenClaw zurückgegeben wird, üblicherweise `~/.openclaw`
- Der Pfad der aktiven Konfigurationsdatei
- Das aufgelöste Verzeichnis `credentials/`, wenn es außerhalb des Zustandsverzeichnisses existiert
- Arbeitsbereichsverzeichnisse, die aus der aktuellen Konfiguration ermittelt werden, es sei denn, Sie übergeben `--no-include-workspace`

Modell-Authentifizierungsprofile sind bereits Teil des Zustandsverzeichnisses unter
`agents/<agentId>/agent/auth-profiles.json`, daher werden sie normalerweise durch den
Eintrag der Zustandssicherung abgedeckt.

Wenn Sie `--only-config` verwenden, überspringt OpenClaw Zustand, Anmeldedatenverzeichnis und Arbeitsbereichserkennung und archiviert nur den Pfad der aktiven Konfigurationsdatei.

OpenClaw kanonisiert Pfade, bevor das Archiv erstellt wird. Wenn Konfiguration, das
Anmeldedatenverzeichnis oder ein Arbeitsbereich bereits im Zustandsverzeichnis liegen,
werden sie nicht als separate Sicherungsquellen der obersten Ebene dupliziert. Fehlende Pfade werden
übersprungen.

Die Archivnutzdaten speichern Dateiinhalte aus diesen Quellbäumen, und die eingebettete `manifest.json` zeichnet die aufgelösten absoluten Quellpfade sowie das für jedes Asset verwendete Archivlayout auf.

Installierte Plugin-Quell- und Manifestdateien unter dem
Baum `extensions/` des Zustandsverzeichnisses werden eingeschlossen, ihre verschachtelten
Abhängigkeitsbäume `node_modules/` werden jedoch übersprungen. Diese Abhängigkeiten sind neu erstellbare Installationsartefakte; verwenden Sie nach dem Wiederherstellen eines Archivs `openclaw plugins update <id>` oder installieren Sie das Plugin
mit `openclaw plugins install <spec> --force` erneut, wenn ein wiederhergestelltes Plugin
fehlende Abhängigkeiten meldet.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht absichtlich die normale Konfigurations-Vorprüfung, damit es bei der Wiederherstellung weiterhin helfen kann. Da die Arbeitsbereichserkennung von einer gültigen Konfiguration abhängt, schlägt `openclaw backup create` jetzt schnell fehl, wenn die Konfigurationsdatei existiert, aber ungültig ist und die Arbeitsbereichssicherung weiterhin aktiviert ist.

Wenn Sie in dieser Situation trotzdem eine Teilsicherung möchten, führen Sie erneut aus:

```bash
openclaw backup create --no-include-workspace
```

Dadurch bleiben Zustand, Konfiguration und das externe Anmeldedatenverzeichnis im Umfang, während
die Arbeitsbereichserkennung vollständig übersprungen wird.

Wenn Sie nur eine Kopie der Konfigurationsdatei selbst benötigen, funktioniert `--only-config` auch bei fehlerhaft formatierter Konfiguration, da es für die Arbeitsbereichserkennung nicht auf das Parsen der Konfiguration angewiesen ist.

## Größe und Leistung

OpenClaw erzwingt keine integrierte maximale Sicherungsgröße und keine Größenbeschränkung pro Datei.

Praktische Grenzen ergeben sich aus dem lokalen Computer und dem Zieldateisystem:

- Verfügbarer Speicherplatz für das temporäre Schreiben des Archivs plus das endgültige Archiv
- Zeit, um große Arbeitsbereichsbäume zu durchlaufen und in ein `.tar.gz` zu komprimieren
- Zeit, um das Archiv erneut zu prüfen, wenn Sie `openclaw backup create --verify` verwenden oder `openclaw backup verify` ausführen
- Dateisystemverhalten am Zielpfad. OpenClaw bevorzugt einen Veröffentlichungsschritt ohne Überschreiben per Hardlink und fällt auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Arbeitsbereiche sind in der Regel der Haupttreiber der Archivgröße. Wenn Sie eine kleinere oder schnellere Sicherung möchten, verwenden Sie `--no-include-workspace`.

Für das kleinste Archiv verwenden Sie `--only-config`.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
