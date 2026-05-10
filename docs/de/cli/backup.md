---
read_when:
    - Sie möchten ein vollwertiges Backup-Archiv für den lokalen OpenClaw-Zustand
    - Sie möchten vor dem Zurücksetzen oder der Deinstallation eine Vorschau darauf erhalten, welche Pfade einbezogen würden
summary: CLI-Referenz für `openclaw backup` (lokale Sicherungsarchive erstellen)
title: Sicherung
x-i18n:
    generated_at: "2026-05-10T19:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Erstellen Sie ein lokales Backup-Archiv für OpenClaw-Zustand, Konfiguration, Auth-Profile, Channel-/Provider-Anmeldedaten, Sitzungen und optional Workspaces.

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

- Das Archiv enthält eine Datei `manifest.json` mit den aufgelösten Quellpfaden und dem Archivlayout.
- Die Standardausgabe ist ein zeitgestempeltes `.tar.gz`-Archiv im aktuellen Arbeitsverzeichnis.
- Wenn sich das aktuelle Arbeitsverzeichnis innerhalb eines gesicherten Quellbaums befindet, weicht OpenClaw für den Standardspeicherort des Archivs auf Ihr Home-Verzeichnis aus.
- Vorhandene Archivdateien werden niemals überschrieben.
- Ausgabepfade innerhalb der Quell-Zustands-/Workspace-Bäume werden abgelehnt, um eine Selbsteinbindung zu vermeiden.
- `openclaw backup verify <archive>` prüft, dass das Archiv genau ein Root-Manifest enthält, lehnt Archivpfade im Traversal-Stil ab und prüft, dass jede im Manifest deklarierte Nutzlast im Tarball vorhanden ist.
- `openclaw backup create --verify` führt diese Validierung direkt nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert nur die aktive JSON-Konfigurationsdatei.

## Was gesichert wird

`openclaw backup create` plant Backup-Quellen aus Ihrer lokalen OpenClaw-Installation:

- Das Zustandsverzeichnis, das vom lokalen Zustands-Resolver von OpenClaw zurückgegeben wird, normalerweise `~/.openclaw`
- Der aktive Konfigurationsdateipfad
- Das aufgelöste Verzeichnis `credentials/`, wenn es außerhalb des Zustandsverzeichnisses existiert
- Workspace-Verzeichnisse, die aus der aktuellen Konfiguration ermittelt werden, es sei denn, Sie übergeben `--no-include-workspace`

Modell-Auth-Profile sind bereits Teil des Zustandsverzeichnisses unter
`agents/<agentId>/agent/auth-profiles.json`, sodass sie normalerweise vom
Zustands-Backup-Eintrag abgedeckt sind.

Wenn Sie `--only-config` verwenden, überspringt OpenClaw die Ermittlung von Zustand, Anmeldedatenverzeichnis und Workspaces und archiviert nur den aktiven Konfigurationsdateipfad.

OpenClaw kanonisiert Pfade, bevor das Archiv erstellt wird. Wenn sich Konfiguration, das
Anmeldedatenverzeichnis oder ein Workspace bereits innerhalb des Zustandsverzeichnisses befinden,
werden sie nicht als separate Backup-Quellen auf oberster Ebene dupliziert. Fehlende Pfade werden
übersprungen.

Die Archivnutzlast speichert Dateiinhalte aus diesen Quellbäumen, und die eingebettete `manifest.json` zeichnet die aufgelösten absoluten Quellpfade sowie das für jedes Asset verwendete Archivlayout auf.

Während der Archiverstellung überspringt OpenClaw bekannte Dateien mit Live-Änderungen, die keinen Wiederherstellungswert haben, einschließlich aktiver Agent-Sitzungstranskripte, Cron-Ausführungsprotokolle, rollierender Protokolle, Zustellwarteschlangen, Socket-/PID-/Temporärdateien unter dem Zustandsverzeichnis und zugehöriger Temporärdateien langlebiger Warteschlangen. Das JSON-Ergebnis enthält `skippedVolatileCount`, damit Automatisierung erkennen kann, wie viele Dateien absichtlich ausgelassen wurden.

Installierte Plugin-Quell- und Manifestdateien unter dem
`extensions/`-Baum des Zustandsverzeichnisses werden einbezogen, ihre verschachtelten
`node_modules/`-Abhängigkeitsbäume jedoch übersprungen. Diese Abhängigkeiten sind neu erstellbare Installationsartefakte; verwenden Sie nach
der Wiederherstellung eines Archivs `openclaw plugins update <id>` oder installieren Sie das Plugin
mit `openclaw plugins install <spec> --force` neu, wenn ein wiederhergestelltes Plugin
fehlende Abhängigkeiten meldet.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht absichtlich die normale Konfigurations-Vorprüfung, damit es auch bei der Wiederherstellung helfen kann. Da die Workspace-Ermittlung von einer gültigen Konfiguration abhängt, schlägt `openclaw backup create` jetzt früh fehl, wenn die Konfigurationsdatei existiert, aber ungültig ist und Workspace-Backups weiterhin aktiviert sind.

Wenn Sie in dieser Situation trotzdem ein teilweises Backup möchten, führen Sie erneut aus:

```bash
openclaw backup create --no-include-workspace
```

Dadurch bleiben Zustand, Konfiguration und das externe Anmeldedatenverzeichnis im Umfang, während
die Workspace-Ermittlung vollständig übersprungen wird.

Wenn Sie nur eine Kopie der Konfigurationsdatei selbst benötigen, funktioniert `--only-config` auch bei fehlerhaft formatierter Konfiguration, da es für die Workspace-Ermittlung nicht auf das Parsen der Konfiguration angewiesen ist.

## Größe und Leistung

OpenClaw erzwingt keine integrierte maximale Backup-Größe und kein Größenlimit pro Datei.

Praktische Grenzen ergeben sich aus dem lokalen Rechner und dem Ziel-Dateisystem:

- Verfügbarer Speicherplatz für das temporäre Schreiben des Archivs plus das endgültige Archiv
- Zeit zum Durchlaufen großer Workspace-Bäume und zum Komprimieren in eine `.tar.gz`
- Zeit zum erneuten Scannen des Archivs, wenn Sie `openclaw backup create --verify` verwenden oder `openclaw backup verify` ausführen
- Dateisystemverhalten am Zielpfad. OpenClaw bevorzugt einen Veröffentlichungsschritt per Hardlink ohne Überschreiben und fällt auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Workspaces sind in der Regel der Hauptfaktor für die Archivgröße. Wenn Sie ein kleineres oder schnelleres Backup möchten, verwenden Sie `--no-include-workspace`.

Für das kleinste Archiv verwenden Sie `--only-config`.

## Verwandt

- [CLI-Referenz](/de/cli)
