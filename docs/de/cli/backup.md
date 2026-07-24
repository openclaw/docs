---
read_when:
    - Sie möchten ein vollwertiges Sicherungsarchiv für den lokalen OpenClaw-Zustand
    - Sie benötigen einen kompakten, verifizierten Snapshot einer OpenClaw-SQLite-Datenbank
    - Sie möchten vor dem Zurücksetzen oder Deinstallieren eine Vorschau der einbezogenen Pfade anzeigen.
summary: CLI-Referenz für `openclaw backup` (Archive und SQLite-Snapshots)
title: Sicherung
x-i18n:
    generated_at: "2026-07-24T04:27:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa9444b5e57e9c6f9492e4b017be96ea8d9da88cf335fd163ea6744975fda37b
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Erstellen Sie ein lokales Sicherungsarchiv für OpenClaw-Status, -Konfiguration, Authentifizierungsprofile, Kanal-/Provider-Zugangsdaten, Sitzungen und optional Arbeitsbereiche.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## Hinweise

- Das Archiv enthält eine eingebettete `manifest.json` mit den aufgelösten Quellpfaden und der Archivstruktur.
- Standardmäßig wird im aktuellen Arbeitsverzeichnis ein mit einem Zeitstempel versehenes `.tar.gz`-Archiv erstellt. Dateinamen mit Zeitstempel verwenden die lokale Zeitzone Ihres Computers und enthalten den UTC-Versatz. Befindet sich das aktuelle Arbeitsverzeichnis innerhalb eines gesicherten Quellverzeichnisbaums, verwendet OpenClaw stattdessen Ihr Home-Verzeichnis als standardmäßigen Archivspeicherort.
- Vorhandene Archivdateien werden niemals überschrieben. Ausgabepfade innerhalb der Quellverzeichnisbäume für Status und Arbeitsbereiche werden abgelehnt, um eine Selbsteinbeziehung zu vermeiden.
- `openclaw backup verify <archive>` prüft, ob das Archiv genau ein Stammmanifest enthält, lehnt Archivpfade mit Verzeichnisdurchquerung sowie SQLite-Sidecar-Dateien ab, bestätigt das Vorhandensein aller im Manifest deklarierten Nutzdaten, validiert die Dateistruktur jedes SQLite-Snapshots und führt vollständige Integritäts- und Rollenprüfungen für kanonische OpenClaw-Datenbanken aus. Dedizierte Plugin-Schemas bleiben undurchsichtig, da sie möglicherweise vom Eigentümer definierte SQLite-Funktionen benötigen. `openclaw backup create --verify` führt diese Validierung unmittelbar nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert ausschließlich die aktive JSON-Konfigurationsdatei.

## SQLite-Snapshots

Verwenden Sie `openclaw backup sqlite`, wenn Sie statt eines umfassenden Statusarchivs ein portables Artefakt für eine einzelne OpenClaw-eigene SQLite-Datenbank benötigen.

Bei der Snapshot-Erstellung wird genau eine benannte Quelle akzeptiert:

| Befehl                                                          | Datenbank                       |
| --------------------------------------------------------------- | ------------------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | Gemeinsamer OpenClaw-Status     |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | Eine Datenbank pro Agent        |

Das Repository enthält für jeden gespeicherten Snapshot genau ein Verzeichnis. Jedes Snapshot-Verzeichnis enthält exakt:

- `manifest.json`
- `database.sqlite`

Die Snapshot-Erstellung überprüft die Live-Datenbank vor dem Lesen, verwendet SQLite `VACUUM INTO`, um den gespeicherten WAL-Status in einer kompakten Datenbank zu erfassen, überprüft die erzeugte Datenbank erneut und veröffentlicht das vollständige Verzeichnis, ohne vorhandene Pfade zu überschreiben. Globale Snapshots entfernen vorübergehende Zeilen der Zustellungswarteschlange und komprimieren die Datenbank erneut, damit gelöschte Warteschlangen-Nutzdaten nicht in freien Seiten verbleiben.

Kopieren Sie Live-Dateien vom Typ `.sqlite`, `-wal`, `-shm` oder `-journal` nicht als portables Artefakt. Kopieren Sie ausschließlich vollständige Snapshot-Verzeichnisse.

SQLite-Snapshots können Authentifizierungsprofile, Sitzungsstatus, Plugin-Status und andere vertrauliche Datensätze enthalten. Schützen Sie Repositorys mit denselben Berechtigungen, derselben Verschlüsselung, derselben Aufbewahrungsrichtlinie und denselben Zielbeschränkungen wie das Live-Statusverzeichnis von OpenClaw.

### Überprüfen und wiederherstellen

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

Bei der Überprüfung werden die strikte Manifeststruktur, Artefaktgröße und SHA-256-Prüfsumme, SQLite-Integrität, Fremdschlüssel, Schemaversion, Datenbankrolle und -eigentümer sowie OpenClaw-eigene Indexdefinitionen geprüft.

Die Überprüfung validiert eine private, inhaltsgebundene Kopie, sodass Pfadnamen-Race-Conditions die von SQLite untersuchten Bytes nicht austauschen können. Standardmäßig wird diese temporäre Kopie neben dem Snapshot-Repository erstellt und vor Beendigung des Befehls entfernt. Das Staging-Stammverzeichnis und seine Vorfahrenkette müssen verhindern, dass andere Benutzer es ersetzen. POSIX-Stammverzeichnisse müssen dem aktuellen Benutzer gehören und dürfen weder für die Gruppe noch für alle Benutzer schreibbar sein; Sticky-Vorfahren wie `/tmp` werden für benutzereigene untergeordnete Verzeichnisse akzeptiert. macOS-ACL-Freigaben, die das Staging offenlegen oder ersetzbar machen, werden abgelehnt. Windows-Stammverzeichnisse und ihre Vorfahren müssen dem aktuellen Benutzer oder einem vertrauenswürdigen Betriebssystemprinzipal gehören und über ACLs verfügen, die nicht vertrauenswürdigem Zugriff auf das Staging verweigern. Geben Sie für eine schreibgeschützte Einbindung oder Netzwerkfreigabe `--scratch <existing-private-directory>` auf einem Speicher mit gleichwertiger Verschlüsselung und entsprechenden Zielkontrollen an.

Die Snapshot-Erstellung wendet vor dem Staging oder der Veröffentlichung von Datenbankbytes dieselben Prüfungen für Eigentümer, ACLs, Vorfahren und Pfadidentität auf das Repository an.

Bei der Wiederherstellung wird die Überprüfung wiederholt und ausschließlich in ein neues Ziel geschrieben. Ein vorhandenes Ziel sowie `-wal`-, `-shm`- oder `-journal`-Sidecar-Dateien werden abgelehnt, und eine Live-OpenClaw-Datenbank wird niemals direkt ersetzt. Für das übergeordnete Zielverzeichnis gelten dieselben Pfadsicherheitsanforderungen wie für das temporäre Verzeichnis der Überprüfung. Die Aktivierung einer wiederhergestellten Datenbank bleibt ein ausdrücklicher Offline-Schritt durch den Betreiber.

Snapshot-Repositorys sind lokale Verzeichnisse. Zeitplanung, Upload, Aufbewahrung, inkrementelle WAL-Pakete, Failover und Wiederherstellung beim Systemstart liegen bewusst außerhalb des Umfangs dieses Befehls.

## Was gesichert wird

`openclaw backup create` plant Quellen aus Ihrer lokalen OpenClaw-Installation:

- Das Statusverzeichnis (normalerweise `~/.openclaw`)
- Der Pfad der aktiven Konfigurationsdatei
- Das aufgelöste Verzeichnis `credentials/`, sofern es außerhalb des Statusverzeichnisses vorhanden ist
- Aus der aktuellen Konfiguration ermittelte Arbeitsbereichsverzeichnisse, sofern Sie nicht `--no-include-workspace` übergeben

Authentifizierungsprofile und anderer Agent-spezifischer Laufzeitstatus befinden sich in SQLite unterhalb des Statusverzeichnisses (`agents/<agentId>/agent/openclaw-agent.sqlite`) und werden daher automatisch durch den Statussicherungseintrag abgedeckt.

`--only-config` überspringt die Ermittlung von Status, Zugangsdatenverzeichnis und Arbeitsbereichen und archiviert ausschließlich den Pfad der aktiven Konfigurationsdatei.

OpenClaw kanonisiert Pfade vor dem Erstellen des Archivs: Wenn sich die Konfiguration, das Zugangsdatenverzeichnis oder ein Arbeitsbereich bereits innerhalb des Statusverzeichnisses befindet, werden diese nicht als separate Sicherungsquellen auf oberster Ebene dupliziert. Fehlende Pfade werden übersprungen.

Während der Archiverstellung schließt OpenClaw bekannte Pfade mit Live-Änderungen aus, bevor `tar` sie liest. Dadurch werden Race-Conditions zwischen der erfassten Größe einer Datei und gleichzeitigen Schreibvorgängen vermieden. Der Filter wendet unter jedem gesicherten Statusverzeichnis die folgenden statusrelativen Regeln an:

| Statusrelativer Bereich                       | Übersprungene Dateiendungen    |
| --------------------------------------------- | ------------------------------ |
| `sessions/**`                                | `.jsonl`, `.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`, `.log`              |
| `cron/runs/**`                               | `.jsonl`, `.log`              |
| `logs/**`                                    | `.jsonl`, `.log`              |
| `delivery-queue/**`                          | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                  | `.json`, `.delivered`, `.tmp` |
| Jeder Pfad unterhalb des gesicherten Statusverzeichnisses | `.sock`, `.pid`, `.tmp`       |

Diese Regeln filtern keine Arbeitsbereichsdateien außerhalb des Statusverzeichnisses. Sie lassen außerdem abgeschlossene Transkript- und Protokolldateien aus, die der Tabelle entsprechen. Bewahren Sie diese Datensätze daher bei Bedarf separat auf. `skippedVolatileCount` im JSON-Ergebnis gibt an, wie viele Dateien absichtlich ausgelassen wurden.

SQLite-Datenbanken unterhalb des Statusverzeichnisses werden mit `VACUUM INTO` komprimiert, damit Überreste gelöschter Seiten nicht in das Archiv gelangen; Live-WAL-/SHM-Dateien werden nicht kopiert. Bei einer Plugin-eigenen Datenbank, die nicht verfügbare, vom Eigentümer definierte SQLite-Funktionen benötigt, wird der Vorgang sicher abgebrochen, statt auf eine unverarbeitete Seitenkopie zurückzugreifen. SQLite-Dateien, die über Arbeitsbereichssicherungen einbezogen werden, werden als Arbeitsbereichsdateien kopiert und fallen nicht unter die Komprimierungsgarantie.

Installierte Plugin-Quell- und Manifestdateien im Verzeichnisbaum `extensions/` des Statusverzeichnisses werden einbezogen, ihre verschachtelten `node_modules/`-Abhängigkeitsbäume werden jedoch als wiederherstellbare Installationsartefakte übersprungen. Verwenden Sie nach dem Wiederherstellen eines Archivs `openclaw plugins update <id>` oder führen Sie mit `openclaw plugins install <spec> --force` eine Neuinstallation durch, wenn ein wiederhergestelltes Plugin fehlende Abhängigkeiten meldet.

Vom Installationsprogramm verwaltete und wiederherstellbare Laufzeit-Stammverzeichnisse unterhalb des Statusverzeichnisses werden ebenfalls übersprungen: `dev/`, `git/`, `npm/`, das veraltete `npm-runtime/` und `tools/`. Diese enthalten verwaltete Checkouts, Paketbäume und heruntergeladene Laufzeitumgebungen statt maßgeblicher Benutzerdaten. Installieren oder aktualisieren Sie die entsprechende Laufzeitumgebung beziehungsweise das entsprechende Plugin nach der Wiederherstellung. Eine ausdrücklich konfigurierte Konfigurationsdatei, ein Zugangsdatenverzeichnis oder ein Arbeitsbereich innerhalb eines dieser Stammverzeichnisse bleibt einbezogen.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht die normale Vorabprüfung der Konfiguration, sodass der Befehl auch bei einer Wiederherstellung helfen kann. Die Ermittlung von Arbeitsbereichen hängt von einer gültigen Konfiguration ab. Daher bricht `openclaw backup create` sofort ab, wenn die Konfigurationsdatei vorhanden, aber ungültig ist und die Arbeitsbereichssicherung weiterhin aktiviert ist.

Führen Sie für eine Teilsicherung in dieser Situation den Befehl erneut mit `--no-include-workspace` aus: Status, Konfiguration und das externe Zugangsdatenverzeichnis bleiben im Umfang enthalten, während die Ermittlung von Arbeitsbereichen vollständig übersprungen wird.

`--only-config` funktioniert auch bei einer fehlerhaften Konfiguration, da die Konfiguration nicht zur Ermittlung von Arbeitsbereichen ausgewertet wird.

## Größe und Leistung

OpenClaw erzwingt weder eine integrierte maximale Sicherungsgröße noch eine Größenbeschränkung pro Datei. Wenn beim Schreiben eines Archivs fünf Minuten lang keine Daten erzeugt werden, schlägt der Vorgang fehl und entfernt seine unvollständige temporäre Datei, statt unbegrenzt hängen zu bleiben. Praktische Grenzen ergeben sich ansonsten aus:

- Dem verfügbaren Speicherplatz für das Schreiben des temporären Archivs und das endgültige Archiv
- Der Zeit zum Durchlaufen großer Arbeitsbereichsbäume und zu deren Komprimierung in ein `.tar.gz`
- Der Zeit zum erneuten Einlesen des Archivs mit `--verify` oder `openclaw backup verify`
- Dem Verhalten des Zieldateisystems: OpenClaw bevorzugt einen Veröffentlichungsschritt über einen Hardlink ohne Überschreiben und greift auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Arbeitsbereiche sind normalerweise der wichtigste Faktor für die Archivgröße. Verwenden Sie `--no-include-workspace` für eine kleinere und schnellere Sicherung oder `--only-config` für das kleinstmögliche Archiv.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
