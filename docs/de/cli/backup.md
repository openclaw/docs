---
read_when:
    - Sie möchten ein erstklassiges Backup-Archiv für den lokalen OpenClaw-Zustand
    - Sie möchten vor dem Zurücksetzen oder Deinstallieren eine Vorschau anzeigen, welche Pfade einbezogen würden.
summary: CLI-Referenz für `openclaw backup` (lokale Backup-Archive erstellen)
title: Sicherung
x-i18n:
    generated_at: "2026-06-27T17:17:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Erstellen Sie ein lokales Backup-Archiv für OpenClaw-State, Konfiguration, Auth-Profile, Kanal-/Provider-Zugangsdaten, Sitzungen und optional Arbeitsbereiche.

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

- Das Archiv enthält eine `manifest.json`-Datei mit den aufgelösten Quellpfaden und dem Archivlayout.
- Die Standardausgabe ist ein mit Zeitstempel versehenes `.tar.gz`-Archiv im aktuellen Arbeitsverzeichnis.
- Backup-Dateinamen mit Zeitstempel verwenden die lokale Zeitzone Ihres Rechners und enthalten den UTC-Offset.
- Wenn das aktuelle Arbeitsverzeichnis innerhalb eines gesicherten Quellbaums liegt, verwendet OpenClaw ersatzweise Ihr Home-Verzeichnis als Standard-Speicherort für das Archiv.
- Vorhandene Archivdateien werden nie überschrieben.
- Ausgabepfade innerhalb der Quell-State-/Arbeitsbereichsbäume werden abgelehnt, um Selbsteinbindung zu vermeiden.
- `openclaw backup verify <archive>` prüft, dass das Archiv genau ein Root-Manifest enthält, lehnt Archivpfade im Traversal-Stil ab und prüft, dass jede im Manifest deklarierte Nutzlast im Tarball vorhanden ist.
- `openclaw backup create --verify` führt diese Prüfung direkt nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert nur die aktive JSON-Konfigurationsdatei.

## Was gesichert wird

`openclaw backup create` plant Backup-Quellen aus Ihrer lokalen OpenClaw-Installation:

- Das State-Verzeichnis, das vom lokalen State-Resolver von OpenClaw zurückgegeben wird, normalerweise `~/.openclaw`
- Der aktive Konfigurationsdateipfad
- Das aufgelöste Verzeichnis `credentials/`, wenn es außerhalb des State-Verzeichnisses existiert
- Arbeitsbereichsverzeichnisse, die aus der aktuellen Konfiguration ermittelt werden, sofern Sie nicht `--no-include-workspace` übergeben

Modell-Auth-Profile sind bereits Teil des State-Verzeichnisses unter
`agents/<agentId>/agent/auth-profiles.json`, daher sind sie normalerweise durch den
State-Backup-Eintrag abgedeckt.

Wenn Sie `--only-config` verwenden, überspringt OpenClaw die Ermittlung von State, Zugangsdatenverzeichnis und Arbeitsbereichen und archiviert nur den aktiven Konfigurationsdateipfad.

OpenClaw kanonisiert Pfade, bevor das Archiv erstellt wird. Wenn Konfiguration,
Zugangsdatenverzeichnis oder ein Arbeitsbereich bereits innerhalb des State-Verzeichnisses liegen,
werden sie nicht als separate Backup-Quellen auf oberster Ebene dupliziert. Fehlende Pfade werden
übersprungen.

Die Archivnutzlast speichert Dateiinhalte aus diesen Quellbäumen, und die eingebettete `manifest.json` zeichnet die aufgelösten absoluten Quellpfade sowie das für jedes Asset verwendete Archivlayout auf.

Während der Archiverstellung überspringt OpenClaw bekannte Dateien mit Live-Änderungen, die keinen Wiederherstellungswert haben, darunter aktive Agent-Sitzungstranskripte, Cron-Ausführungsprotokolle, Rolling Logs, Zustellwarteschlangen, Socket-/PID-/Temporärdateien unter dem State-Verzeichnis sowie zugehörige Temporärdateien für dauerhafte Warteschlangen. Das JSON-Ergebnis enthält `skippedVolatileCount`, damit Automatisierung erkennen kann, wie viele Dateien absichtlich ausgelassen wurden.

Installierte Plugin-Quell- und Manifestdateien unter dem
`extensions/`-Baum des State-Verzeichnisses werden einbezogen, ihre verschachtelten
`node_modules/`-Abhängigkeitsbäume jedoch übersprungen. Diese Abhängigkeiten sind neu erstellbare Installationsartefakte; verwenden Sie nach
der Wiederherstellung eines Archivs `openclaw plugins update <id>` oder installieren Sie das Plugin
mit `openclaw plugins install <spec> --force` neu, wenn ein wiederhergestelltes Plugin
fehlende Abhängigkeiten meldet.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht absichtlich die normale Konfigurations-Vorprüfung, damit es während der Wiederherstellung weiterhin helfen kann. Da die Arbeitsbereichsermittlung von einer gültigen Konfiguration abhängt, schlägt `openclaw backup create` jetzt früh fehl, wenn die Konfigurationsdatei existiert, aber ungültig ist und das Arbeitsbereichs-Backup weiterhin aktiviert ist.

Wenn Sie in dieser Situation dennoch ein teilweises Backup möchten, führen Sie erneut aus:

```bash
openclaw backup create --no-include-workspace
```

Dadurch bleiben State, Konfiguration und das externe Zugangsdatenverzeichnis im Umfang, während
die Arbeitsbereichsermittlung vollständig übersprungen wird.

Wenn Sie nur eine Kopie der Konfigurationsdatei selbst benötigen, funktioniert `--only-config` auch bei fehlerhafter Konfiguration, da es nicht darauf angewiesen ist, die Konfiguration für die Arbeitsbereichsermittlung zu parsen.

## Größe und Leistung

OpenClaw erzwingt keine integrierte maximale Backup-Größe und kein Größenlimit pro Datei.

Praktische Grenzen ergeben sich aus dem lokalen Rechner und dem Zieldateisystem:

- Verfügbarer Speicherplatz für das temporäre Schreiben des Archivs plus das endgültige Archiv
- Zeit, um große Arbeitsbereichsbäume zu durchlaufen und in ein `.tar.gz` zu komprimieren
- Zeit, um das Archiv erneut zu scannen, wenn Sie `openclaw backup create --verify` verwenden oder `openclaw backup verify` ausführen
- Dateisystemverhalten am Zielpfad. OpenClaw bevorzugt einen Publish-Schritt ohne Überschreiben per Hardlink und fällt auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Arbeitsbereiche sind in der Regel der Haupttreiber der Archivgröße. Wenn Sie ein kleineres oder schnelleres Backup möchten, verwenden Sie `--no-include-workspace`.

Für das kleinste Archiv verwenden Sie `--only-config`.

## Verwandt

- [CLI-Referenz](/de/cli)
