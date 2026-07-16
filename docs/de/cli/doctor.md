---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und wünschen angeleitete Lösungen
    - Sie haben eine Aktualisierung vorgenommen und möchten eine Plausibilitätsprüfung.
summary: CLI-Referenz für `openclaw doctor` (Systemprüfungen + geführte Reparaturen)
title: Doctor
x-i18n:
    generated_at: "2026-07-16T12:37:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen und Schnellkorrekturen für Gateway, Kanäle, Plugins, Skills, Modell-Routing, lokalen Zustand und Konfigurationsmigrationen. Verwenden Sie den Befehl immer dann, wenn etwas nicht wie erwartet funktioniert und ein einzelner Befehl erklären soll, woran es liegt.

Verwandte Themen:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/de/gateway/security)

## Betriebsarten

Doctor verfügt über fünf Betriebsarten:

| Betriebsart              | Befehl                                    | Verhalten                                                                                                     |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Prüfen                   | `openclaw doctor`                        | Auf Menschen ausgerichtete Prüfungen und geführte Eingabeaufforderungen.                                      |
| Reparieren               | `openclaw doctor --fix`                        | Wendet unterstützte Reparaturen an und verwendet Eingabeaufforderungen, sofern eine nicht interaktive Reparatur nicht sicher ist. |
| Lint                     | `openclaw doctor --lint`                        | Schreibgeschützte strukturierte Befunde für CI, Vorabprüfungen und Review-Gates.                              |
| Gemeinsame SQLite-Wartung | `openclaw doctor --state-sqlite compact`                       | Erstellt explizit Checkpoints, komprimiert und überprüft die kanonische gemeinsame Zustandsdatenbank.         |
| SQLite-Sitzungsmigration | `openclaw doctor --session-sqlite <mode>`                        | Prüft, importiert, validiert, komprimiert, stellt Sitzungszustände wieder her oder setzt sie zurück.          |

Bevorzugen Sie `--lint`, wenn die Automatisierung ein stabiles Ergebnis benötigt. Bevorzugen Sie `--fix`, wenn Doctor die Konfiguration oder den Zustand für einen menschlichen Bediener bearbeiten soll.

## Beispiele

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Verwenden Sie für kanalspezifische Berechtigungen die Kanalprüfungen anstelle von `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` meldet die effektiven Berechtigungen des Bots für ein bestimmtes Kanalziel. `channels status --probe` prüft alle konfigurierten Kanäle und Ziele für den automatischen Sprachbeitritt.

## Optionen

| Option                          | Wirkung                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Deaktiviert Vorschläge für Arbeitsbereichsspeicher und -suche.                                                                                                                           |
| `--yes`              | Übernimmt Standardwerte ohne Rückfrage.                                                                                                                                                  |
| `--repair` / `--fix` | Wendet empfohlene Reparaturen außerhalb von Diensten ohne Rückfrage an (`--fix` ist ein Alias). Installationen oder Neuschreibungen des Gateway-Dienstes erfordern weiterhin eine interaktive Bestätigung oder explizite `gateway`-Befehle. |
| `--force`              | Wendet aggressive Reparaturen an, einschließlich des Überschreibens benutzerdefinierter Dienstkonfigurationen.                                                                          |
| `--non-interactive`              | Wird ohne Eingabeaufforderungen ausgeführt; nur sichere Migrationen und Reparaturen außerhalb von Diensten.                                                                              |
| `--generate-gateway-token`              | Generiert und konfiguriert ein Gateway-Token.                                                                                                                                            |
| `--allow-exec`              | Erlaubt Doctor, konfigurierte `exec`-SecretRefs beim Überprüfen von Geheimnissen auszuführen.                                                                                 |
| `--deep`              | Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen und meldet kürzlich erfolgte Übergaben bei Neustarts des Gateway-Supervisors.                                         |
| `--lint`              | Führt modernisierte Integritätsprüfungen im schreibgeschützten Modus aus und gibt Diagnosebefunde aus.                                                                                   |
| `--post-upgrade`              | Führt nach einem Upgrade Kompatibilitätsprüfungen für Plugins aus; Befunde werden auf stdout ausgegeben; Exit-Code 1, wenn mindestens ein Befund der Fehlerstufe vorliegt.               |
| `--state-sqlite <mode>`              | Führt eine explizite SQLite-Wartung des gemeinsamen Zustands aus. Der einzige Modus ist `compact`.                                                                              |
| `--session-sqlite <mode>`              | Führt den gezielten SQLite-Sitzungsmigrationsmodus aus: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` oder `restore`. |
| `--session-sqlite-store <path>`              | Mit `--session-sqlite`: Wählt einen veralteten `sessions.json`-Speicherpfad aus.                                                                                                     |
| `--session-sqlite-agent <id>`              | Mit `--session-sqlite`: Wählt einen konfigurierten Agenten aus.                                                                                                                          |
| `--session-sqlite-all-agents`              | Mit `--session-sqlite`: Wählt konfigurierte und erkannte Agentenspeicher aus.                                                                                                            |
| `--github-issue`              | Mit `--session-sqlite recover`: Bereitet einen bereinigten Problembericht für openclaw/openclaw vor; Doctor erstellt ihn mit `gh` nach `--yes` oder interaktiver Bestätigung. |
| `--json`              | Mit `--lint`: JSON-Befunde. Mit `--post-upgrade`: `{ probesRun, findings }`. Mit `--state-sqlite` oder `--session-sqlite`: der Wartungsbericht als JSON.                          |
| `--severity-min <level>`              | Mit `--lint`: Verwirft Befunde unterhalb von `info`, `warning` oder `error`.                                                                  |
| `--all`              | Mit `--lint`: Führt alle registrierten Prüfungen aus, einschließlich optionaler Prüfungen, die nicht im Standardsatz enthalten sind.                                          |
| `--skip <id>`              | Mit `--lint`: Überspringt eine Prüfungs-ID. Wiederholbar.                                                                                                                      |
| `--only <id>`              | Mit `--lint`: Führt nur die angegebenen Prüfungs-IDs aus. Wiederholbar.                                                                                                        |

`--severity-min`, `--all`, `--only` und `--skip` werden nur zusammen mit `--lint` akzeptiert; `--json` wird mit `--lint`, `--post-upgrade`, `--state-sqlite` und `--session-sqlite` akzeptiert.

## Lint-Modus

`openclaw doctor --lint` ist schreibgeschützt: keine Eingabeaufforderungen, keine Reparaturen und keine Neuschreibungen von Konfiguration oder Zustand.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Die menschenlesbare Ausgabe ist kompakt:

```text
doctor --lint: 6 Prüfung(en) ausgeführt, 1 Befund(e)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode ist nicht festgelegt; der Start des Gateways wird blockiert.
    Korrektur: Führen Sie `openclaw configure` aus und legen Sie den Gateway-Modus (local/remote) fest, oder führen Sie `openclaw config set gateway.mode local` aus.
```

Die JSON-Ausgabe ist die Skripting-Schnittstelle:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode ist nicht festgelegt; der Start des Gateways wird blockiert.",
      "path": "gateway.mode",
      "fixHint": "Führen Sie `openclaw configure` aus und legen Sie den Gateway-Modus (local/remote) fest, oder führen Sie `openclaw config set gateway.mode local` aus."
    }
  ]
}
```

Exit-Codes:

| Code | Bedeutung                                                                 |
| ---- | ------------------------------------------------------------------------- |
| `0` | Keine Befunde auf oder über dem ausgewählten Schweregrad-Schwellenwert.   |
| `1` | Mindestens ein Befund erreicht den ausgewählten Schwellenwert.            |
| `2` | Befehls-/Laufzeitfehler, bevor Lint-Befunde erzeugt werden können.        |

`--severity-min` steuert sowohl die ausgegebenen Befunde als auch den Exit-Schwellenwert: `openclaw doctor --lint --severity-min error` kann nichts ausgeben und mit `0` beendet werden, selbst wenn Befunde mit niedrigerem Schweregrad vom Typ `info`/`warning` vorhanden sind.

`--all` steuert, welche Prüfungen vor der Schweregradfilterung ausgewählt werden. Der standardmäßige Lint-Lauf schließt Prüfungen aus, die tiefgehend oder historisch sind oder mit höherer Wahrscheinlichkeit reparierbare Altlasten aufdecken; verwenden Sie `--all` für das vollständige Inventar. `--only <id>` ist der präziseste Selektor und kann jede registrierte Prüfung anhand ihrer ID ausführen.

`core/doctor/local-audio-acceleration` meldet den automatisch ausgewählten lokalen STT-Befehl, getrennte Nachweise für geeignete, angeforderte und beobachtete Backends sowie die Fallback-Reihenfolge, ohne ein Sprachmodell zu laden. Dabei wird ein informativer Befund ausgegeben; schließen Sie daher `--severity-min info` ein, um ihn anzuzeigen.

## Strukturierte Integritätsprüfungen

Moderne Doctor-Prüfungen verwenden einen kleinen, aufgeteilten Vertrag:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` bildet die Grundlage für `doctor --lint`. `repair()` ist optional und wird nur unter `doctor --fix` / `doctor --repair` ausgeführt. Prüfungen, die noch nicht auf diese Struktur migriert wurden, verwenden weiterhin den veralteten Doctor-Beitragsablauf.

Reparaturkontexte können `dryRun`-/`diff`-Anforderungen enthalten; Reparaturergebnisse können strukturierte `diffs` (Konfigurations-/Dateibearbeitungen) und `effects` (Dienst-, Prozess-, Paket-, Zustands- oder andere Nebeneffekte) zurückgeben, sodass konvertierte Prüfungen schrittweise in Richtung `doctor --fix --dry-run` erweitert werden können, ohne die Mutationsplanung nach `detect()` zu verschieben.

`repair()` meldet `status: "repaired" | "skipped" | "failed"` (ein ausgelassener Status bedeutet `repaired`). Wenn die Reparatur `skipped` oder `failed` zurückgibt, meldet doctor den Grund und überspringt die Validierung für diese Prüfung. Nach einer erfolgreichen Reparatur führt doctor `detect()` erneut aus, beschränkt auf die reparierten Befunde; ist der Befund weiterhin vorhanden, meldet doctor eine Reparaturwarnung, statt die Änderung als abgeschlossen zu behandeln.

Ein Befund enthält:

| Feld              | Zweck                                                  |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Stabile ID für Überspringen-/Nur-Filter und CI-Zulassungslisten. |
| `severity`        | `info`, `warning` oder `error`.                         |
| `message`         | Für Menschen lesbare Problembeschreibung.              |
| `path`            | Konfigurations-, Datei- oder logischer Pfad, sofern verfügbar. |
| `line` / `column` | Quellposition, sofern verfügbar.                       |
| `ocPath`          | Präzise `oc://`-Adresse, wenn eine Prüfung auf eine verweisen kann. |
| `fixHint`         | Empfohlene Betreiberaktion oder Reparaturzusammenfassung. |

Modernisierte doctor-Prüfungen des Kerns bleiben dem geordneten doctor-Beitrag zugeordnet, dem ihr menschliches `doctor`-/`doctor --fix`-Verhalten gehört. Die gemeinsame strukturierte Zustandsregistrierung ist der Erweiterungspunkt: Gebündelte und Plugin-gestützte Prüfungen werden nach den doctor-Prüfungen des Kerns ausgeführt, sobald ihr zuständiges Paket sie im aktiven Befehlspfad registriert. `openclaw/plugin-sdk/health` stellt Plugin-Autoren denselben Vertrag bereit.

## Prüfungsauswahl

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` und `--skip` akzeptieren vollständige Prüfungs-IDs und können wiederholt werden. Ist eine `--only`-ID nicht registriert, wird für diese ID keine Prüfung ausgeführt; verwenden Sie `checksRun`/`checksSkipped` in der Ausgabe, um zu bestätigen, dass ein gezieltes Gate die erwarteten Prüfungen auswählt.

## Modus nach einem Upgrade

`openclaw doctor --post-upgrade` führt Plugin-Kompatibilitätsprüfungen zur Verkettung nach einem Build oder Upgrade aus. Befunde werden nach stdout geschrieben; der Exit-Code lautet 1, wenn ein Befund `level: "error"` aufweist. Fügen Sie `--json` hinzu, um eine maschinenlesbare Hülle (`{ probesRun, findings }`) zu erhalten, die sich für CI, das Community-Skill `fork-upgrade` und andere Smoke-Test-Werkzeuge nach Upgrades eignet. Fehlt der Index installierter Plugins oder ist er fehlerhaft, gibt der JSON-Modus dennoch die Hülle mit einem `plugin.index_unavailable`-Fehlerbefund aus.

Der Start eines Container-Images ist die Ausnahme vom üblichen Ablauf „doctor nach
der Aktualisierung ausführen“. Wenn `openclaw gateway run` mit einer neuen OpenClaw-Version startet,
führt es sichere Zustands- und Plugin-Reparaturen aus, bevor es Bereitschaft meldet. Kann die Reparatur
nicht sicher abgeschlossen werden, wird der Start beendet und Sie werden angewiesen, dasselbe Image einmal mit
`openclaw doctor --fix` für denselben eingebundenen Zustand bzw. dieselbe eingebundene Konfiguration auszuführen, bevor
der Container normal neu gestartet wird.

## SQLite-Compaction des gemeinsamen Zustands

`openclaw doctor --state-sqlite compact` ist eine explizite Offline-Wartung für
die kanonische Datenbank des gemeinsamen Zustands unter
`<state-dir>/state/openclaw.sqlite`. Sie akzeptiert keinen beliebigen Datenbankpfad,
wird niemals durch den normalen Gateway-Betrieb aufgerufen und ist nicht Teil von
`openclaw doctor --fix`. Der Befehl erwirbt dieselbe Zustandseigentümersperre wie
der Gateway-Start und hält sie während der Validierung, des Checkpointings, von `VACUUM` und
der abschließenden Integritätsprüfungen. Die Ausführung wird verweigert, während ein Gateway oder ein anderer
SQLite-Wartungsbefehl diese Sperre besitzt. Die Zustandssperre bleibt aktiv, wenn
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` den Gateway-Singleton pro Konfiguration überspringt, sodass eine
Betreiber-Shell für die Erkennung bei der Wartung nicht die Umgebung des Gateway-Dienstes
erben muss.

Stoppen Sie zunächst das Gateway und erstellen Sie eine verifizierte Sicherung:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Der Befehl:

1. Erfordert eine reguläre Datei am kanonischen Pfad des gemeinsamen Zustands. Eine fehlende
   Datenbank wird als `skipped` gemeldet und der Befehl wird erfolgreich beendet.
2. Validiert die aktuell unterstützte Schemaversion und
   `schema_meta.role = "global"`, bevor ein Checkpoint erstellt oder die Datei geändert wird.
3. Erfordert ein nicht ausgelastetes `wal_checkpoint(TRUNCATE)`. Stoppen Sie alle verbleibenden OpenClaw-
   Prozesse und versuchen Sie es erneut, wenn der Checkpoint ausgelastet ist.
4. Setzt `auto_vacuum` auf `INCREMENTAL`, führt ein vollständiges `VACUUM` aus und erstellt
   erneut einen Checkpoint.
5. Führt `quick_check`, `integrity_check` und `foreign_key_check` aus und
   wendet anschließend erneut ausschließlich dem Eigentümer gewährte Berechtigungen auf die Datenbank und die SQLite-Sidecar-Dateien an.

Die JSON-Ausgabe meldet vor und nach der Compaction die Größen der Datenbank und des WAL, die Seiten der Freiliste, die Seitengröße und
den Wert von `auto_vacuum` sowie die zurückgewonnenen Bytes und die Ergebnisse von
`quick_check` und `integrity_check`. `foreign_key_check` wird
nach dem Fail-Closed-Prinzip durchgesetzt und besitzt kein separates Erfolgsfeld. SQLite meldet `auto_vacuum` als
`0` für „keine“, `1` für „vollständig“ und `2` für „inkrementell“.

Die Compaction schlägt ohne Änderungen fehl, wenn das Schema veraltet oder neuer als der
ausgeführte OpenClaw-Build ist oder zu einer Agent-Datenbank gehört. Führen Sie bei einem älteren Schema des gemeinsamen Zustands zuerst
`openclaw doctor --fix` aus. Stellen Sie bei einem neueren Schema eine
kompatible Sicherung wieder her oder aktualisieren Sie OpenClaw.

## SQLite-Migration von Sitzungen

OpenClaw importiert veraltete Sitzungszeilen und den Transkriptverlauf automatisch beim Gateway-Start und während
`openclaw doctor --fix` in die SQLite-Datenbank jedes Agenten. `openclaw doctor --session-sqlite <mode>` ist das
gezielte Inspektions- und Validierungswerkzeug für diese Migration. Aktuelle Laufzeit-
Sitzungszeilen befinden sich in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Veraltete
`sessions.json`-Dateien sind Migrationsquellen. Aktive Transkript-JSONL-Dateien werden
importiert und nach erfolgreichem Import aus dem aktiven Sitzungsverzeichnis archiviert;
JSONL-Dateien der Archivebene bleiben Support-Artefakte und dienen nicht als Laufzeit-
Fallbacks.

Modi:

| Modus      | Verhalten                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Liest die Anzahl veralteter und in SQLite gespeicherter Einträge sowie nicht referenzierte JSONL-Dateien, ohne etwas zu importieren. |
| `dry-run`  | Analysiert veraltete Einträge und Transkript-JSONL-Dateien, zählt importierbare Zeilen und meldet Probleme, ohne SQLite-Zeilen zu schreiben. |
| `import`   | Importiert veraltete Einträge und Transkriptereignisse für die ausgewählten Ziele in SQLite.                            |
| `validate` | Vergleicht die ausgewählten veralteten Quellen mit SQLite-Zeilen und der Anzahl der Transkriptereignisse.                |
| `compact`  | Erstellt Checkpoints und führt VACUUM für ausgewählte Agent-SQLite-Datenbanken aus, um nach umfangreichen Löschvorgängen oder Archivbereinigungen freie Seiten zurückzugewinnen. |
| `recover`  | Stellt den letzten fehlgeschlagenen Migrationslauf wieder her, validiert dessen Ziele und bereitet einen bereinigten GitHub-Problembericht vor. |
| `restore`  | Stellt archivierte Transkriptartefakte anhand aufgezeichneter Migrationsmanifeste wieder her, ohne SQLite-Daten zu löschen. |

Selektoren:

- Standard: der konfigurierte Speicher des Standardagenten, wenn diese veraltete Speicherdatei vorhanden ist.
- `--session-sqlite-agent <id>`: ein konfigurierter Agent.
- `--session-sqlite-all-agents`: konfigurierte Agent-Speicher sowie erkannte Agent-Speicher.
- `--session-sqlite-store <path>`: ein expliziter Pfad zu einer veralteten `sessions.json`.

Manuelle Inspektionssequenz:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Sichern Sie das OpenClaw-Zustandsverzeichnis, bevor Sie `import` bei einer Installation mit
wichtigem Verlauf ausführen. `validate` wird mit einem von null verschiedenen Exit-Code beendet, wenn ein ausgewählter veralteter Eintrag
in SQLite fehlt, eine Sitzungs-ID abweicht oder die Anzahl der Transkriptereignisse abweicht.
Prüfen Sie bei Verwendung von `--session-sqlite-store <path>`, ob der Bericht die
erwartete Anzahl von Zielen enthält; ein nicht vorhandener expliziter Speicherpfad wählt keine Ziele aus.

SQLite-Löschvorgänge geben Seiten zunächst innerhalb der Datenbank frei; sie verkleinern die
Datenbankdatei nicht unbedingt sofort. Führen Sie nach dem Löschen oder Archivieren großer
Transkripte `openclaw doctor --session-sqlite compact --session-sqlite-all-agents` aus,
um WAL-Dateien per Checkpoint zu verarbeiten, `VACUUM` auszuführen und die Größen von Datenbank und WAL
vorher und nachher zu melden. Die Compaction erfordert eine reguläre Datei mit dem aktuellen Agent-Schema, den
dauerhaften Eigentümermetadaten des ausgewählten Agenten und keinen offenen Handle im doctor-
Prozess. Die destruktiven Modi `import`, `compact`, `recover` und `restore`
halten während ihres gesamten Vorgangs dieselbe Zustandseigentümersperre wie der Gateway-Start;
`inspect`, `dry-run` und `validate` bleiben schreibgeschützt und erwerben sie nicht. Stoppen Sie
zuerst das Gateway. Destruktive Modi schlagen fehl, statt mit laufenden Schreibvorgängen oder
einem anderen Wartungsbefehl zu konkurrieren. Ein destruktives `--session-sqlite-store`-
Ziel muss sich im aktiven Zustandsverzeichnis befinden; setzen Sie `OPENCLAW_STATE_DIR` auf
das Zustandsverzeichnis, dem der Speicher gehört, bevor Sie eine andere Installation warten.
Vorhandene hart verknüpfte Ziele werden abgelehnt, da ein anderer Pfad denselben
Datenbank-Inode außerhalb des gesperrten Zustandsverzeichnisses gemeinsam nutzen kann. Dieselben Eigentumsprüfungen
decken SQLite-WAL-, Shared-Memory- und Rollback-Journal-Sidecars ab.

Jeder Import schreibt ein Manifest unter
`~/.openclaw/session-sqlite-migration-runs/`, bevor Transkriptartefakte
in das Archiv verschoben werden. Wenn der Start nach dem Verschieben von Artefakten eine fehlgeschlagene SQLite-Migration von Sitzungen meldet,
führen Sie die Wiederherstellung aus:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Die Wiederherstellung wählt das neueste Manifest einer fehlgeschlagenen Migration aus, stellt nur die
archivierten Artefakte des Manifests wieder her, validiert die betroffenen Ziele, aktualisiert die
bereinigten Berichte `.failure.md` und `.failure.json` und bereitet einen GitHub-Issue-
Text vor, der Transkriptinhalte, die unverarbeitete Umgebung, Geheimnisse und unbegrenzte
Konfiguration vermeidet. Wenn kein Manifest einer fehlgeschlagenen Migration vorhanden ist, aber eine ausgewählte Agent-SQLite-
Datenbank beschädigt oder keine Datenbank ist oder Journal-Sidecars ohne Hauptdatenbank
besitzt, kopiert die Wiederherstellung den vollständigen Dateisatz in ein temporäres Inspektionsverzeichnis.
SQLite kann in dieser entbehrlichen Kopie ein gültiges aktives Journal zurücksetzen,
bevor `quick_check`, `integrity_check` und `foreign_key_check` ausgeführt werden, während die
ursprünglichen forensischen Dateien unverändert bleiben. Fehlgeschlagene Integritätsprüfungen oder verwaiste
Sidecars bewahren die DB-, WAL-, SHM- und Rollback-Journal-Dateien, indem sie den
gesamten erkannten Satz mit einem einzigen `.corrupt-<timestamp>`-Suffix umbenennen. Bei einem abgefangenen Fehler beim Umbenennen
werden bereits verschobene Dateien zurückgesetzt, bevor der Fehler gemeldet wird, sodass ein
wiederherstellbarer Dateisatz nicht unbemerkt aufgeteilt wird. Stoppen Sie das Gateway vor der Wiederherstellung;
das Kopieren oder Umbenennen eines sich aktiv ändernden SQLite-Dateisatzes ist unsicher und verhält sich
je nach Betriebssystem unterschiedlich. Mit `--github-issue --yes` verwendet doctor
die GitHub CLI, um das Issue in `openclaw/openclaw` zu erstellen; ohne Bestätigung
schreibt es den lokalen Supportbericht und gibt eine vorausgefüllte Issue-URL aus.

`restore` bleibt die untergeordnete Rückgängig-Operation. Sie verwendet die
`sourcePath -> archivePath`-Datensätze des Manifests, verschiebt archivierte Artefakte nur zurück, wenn der
ursprüngliche Pfad fehlt, meldet Konflikte, wenn beide Pfade vorhanden sind, und belässt
die SQLite-Datenbank unverändert.

### Downgrade nach der SQLite-Migration von Sitzungen

Stellen Sie vor dem Start einer älteren dateibasierten OpenClaw-Version die archivierten
veralteten Transkriptartefakte wieder her:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Ältere Versionen lesen `sessions.json`-Einträge und die in diesen Einträgen verzeichneten `sessionFile`-Pfade. Nach der SQLite-Migration verschieben erfolgreiche Importe aktive JSONL-Transkripte nach `session-sqlite-import-archive/`, sodass die ältere Laufzeitumgebung diesen Verlauf erst sehen kann, wenn die Wiederherstellung die im Manifest verzeichneten Artefakte an ihre ursprünglichen Pfade zurückverschiebt.

Die Wiederherstellung löscht keine SQLite-Daten. Sitzungen, die nach der Umstellung auf SQLite erstellt wurden, sind nur in SQLite vorhanden und werden in der älteren Laufzeitumgebung nicht angezeigt. Wenn Sie später erneut ein Upgrade durchführen, führen Sie die oben beschriebene normale Migrationsvalidierungssequenz aus, damit OpenClaw die wiederhergestellten Legacy-Artefakte vor dem Import mit den SQLite-Zeilen vergleichen kann.

## Hinweise

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte Doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, da `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Eingabeaufforderungen (Schlüsselbund-/OAuth-Korrekturen usw.) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Nicht interaktive `doctor`-Ausführungen überspringen das vorzeitige Laden von Plugins, damit Headless-Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden weiterhin die Plugin-Oberflächen, die der Legacy-Ablauf für Integritätsprüfung und Reparatur benötigt.
- `--lint` ist strenger als `--non-interactive`: immer schreibgeschützt, fordert niemals zu Eingaben auf und wendet niemals sichere Migrationen an. Verwenden Sie `doctor --fix` oder `doctor --repair`, wenn Doctor Änderungen vornehmen soll.
- Doctor führt `exec`-SecretRefs bei der standardmäßigen Prüfung von Geheimnissen nicht aus. Verwenden Sie `--allow-exec` (mit oder ohne `--lint`) nur, wenn Doctor diese konfigurierten Geheimnisauflöser absichtlich ausführen soll.
- Jeder Schreibvorgang an der Konfiguration (einschließlich einer `--fix`-Reparatur) rotiert eine Sicherung nach `~/.openclaw/openclaw.json.bak` (mit einem nummerierten Ring von `.bak.1` bis `.bak.4`). `--fix` entfernt außerdem unbekannte Konfigurationsschlüssel, die von der Schemavalidierung gemeldet werden, und führt jede Entfernung auf; während eines laufenden Updates wird dies übersprungen, damit ein teilweise geschriebener Upgrade-Zustand nicht entfernt wird, bevor dessen Migration abgeschlossen ist.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Lebenszyklus des Gateways verwaltet. Doctor meldet weiterhin den Zustand von Gateway und Dienst und wendet Reparaturen an, die keine Dienste betreffen, überspringt jedoch Installation, Start, Neustart und Bootstrap des Dienstes sowie die Bereinigung von Legacy-Diensten.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt bei der Reparatur die Befehls-/Entrypoint-Metadaten für einen laufenden systemd-Gateway-Dienst nicht neu. Beenden Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, um den aktiven Launcher zu ersetzen.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder überschreibt sie jedoch außerhalb des Update-Reparaturmodus nicht. Führen Sie bei einem fehlenden Dienst `openclaw gateway install` oder zum Ersetzen des Launchers `openclaw gateway install --force` aus.
- Prüfungen der Zustandsintegrität erkennen verwaiste Transkriptdateien im Sitzungsverzeichnis. Ihre Archivierung als `.deleted.<timestamp>` erfordert eine interaktive Bestätigung; `--fix`, `--yes` und Headless-Ausführungen belassen sie an ihrem Speicherort.
- Doctor durchsucht `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach Legacy-Strukturen von Cron-Aufträgen und schreibt sie neu, bevor kanonische Zeilen in SQLite importiert werden.
- Doctor meldet Cron-Aufträge mit einer expliziten `payload.model`-Überschreibung, einschließlich der Anzahl nach Provider-Namespace und Abweichungen gegenüber `agents.defaults.model`, damit geplante Aufträge, die das Standardmodell nicht übernehmen, bei Untersuchungen zu Authentifizierung oder Abrechnung sichtbar sind.
- Doctor meldet Cron-Aufträge, die noch als laufend markiert sind (`state.runningAtMs`), wodurch `openclaw cron list` sie als `running` anzeigen kann. Diese Prüfung ist schreibgeschützt: Wenn derzeit kein Gateway einen markierten Auftrag ausführt, zeichnet der nächste Start des Cron-Dienstes die unterbrochene Ausführung auf und löscht die Markierung.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers noch das nicht gewartete Legacy-`~/.openclaw/bin/ensure-whatsapp.sh` ausführt, das `Gateway inactive` falsch melden kann, wenn Cron die Umgebung des systemd-Benutzerbusses fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor, ob eine beeinträchtigte Gateway-Ereignisschleife vorliegt, während lokale `openclaw-tui`-Clients noch ausgeführt werden. `doctor --fix` beendet ausschließlich verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Doctor schreibt Legacy-Modellreferenzen vom Typ `codex/*` und `openai-codex/*` in kanonische `openai/*`-Referenzen um – für primäre Modelle, Fallbacks, Modell-Positivlisten, Modelle zur Bild-/Videogenerierung, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen, Cron-Nutzdaten und veraltete Sitzungs-/Transkript-Routenbindungen. `--fix` führt außerdem Legacy-Konfigurationen aus `models.providers.codex` und `models.providers.openai-codex` zusammen, wenn dies sicher ist, migriert Legacy-Authentifizierungsprofile aus `openai-codex:*` sowie `auth.order.openai-codex`-Einträge nach `openai:*`, verschiebt die Codex-Absicht in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge, entfernt veraltete Laufzeitbindungen für ganze Agenten und Sitzungen und belässt reparierte OpenAI-Agentenreferenzen beim Codex-Authentifizierungsrouting statt bei der direkten Authentifizierung mit einem OpenAI-API-Schlüssel.
- Doctor meldet nicht leere `auth.order.<provider>`-Listen, deren referenzierte Profile vollständig verschwunden sind, obwohl kompatible gespeicherte Anmeldedaten vorhanden sind. `doctor --fix` löscht nur diese veralteten Überschreibungen und stellt damit die automatische Auswahl von Anmeldedaten pro Agent wieder her; explizit leere Reihenfolgen, teilweise noch gültige Listen und Reihenfolgen ohne kompatible gespeicherte Anmeldedaten bleiben unverändert. Wenn ein aktiver SQLite-Authentifizierungsspeicher nicht lesbar oder fehlerhaft ist, erläutert Doctor, weshalb diese Reparatur übersprungen wurde. Starten Sie ein laufendes Gateway neu, bevor Sie den Authentifizierungsstatus erneut prüfen, falls dessen Modus zum Neuladen der Konfiguration die Änderung nicht automatisch übernimmt.
- Doctor bereinigt den Legacy-Bereitstellungszustand für Plugin-Abhängigkeiten aus älteren OpenClaw-Versionen und verknüpft das Hostpaket `openclaw` für verwaltete npm-Plugins neu, die es als Peer-Abhängigkeit deklarieren. Außerdem repariert Doctor fehlende herunterladbare Plugins, auf die in der Konfiguration verwiesen wird (`plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen, konfigurierte Agent-Laufzeitumgebungen). Während Paketaktualisierungen überspringt Doctor die Plugin-Reparatur durch den Paketmanager, bis der Paketaustausch abgeschlossen ist; führen Sie anschließend `openclaw doctor --fix` erneut aus, falls ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Wenn ein Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfigurationen, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.deny`/`plugins.entries` sowie passende verwaiste Kanalkonfigurationen, Heartbeat-Ziele und Kanalmodellüberschreibungen entfernt werden, sofern die Plugin-Erkennung ordnungsgemäß funktioniert.
- Doctor isoliert ungültige Plugin-Konfigurationen, indem der betroffene `plugins.entries.<id>`-Eintrag deaktiviert und dessen ungültige `config`-Nutzdaten entfernt werden. Beim Start überspringt das Gateway bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiter ausgeführt werden.
- Doctor entfernt das eingestellte `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server behält Codex-native Arbeitsbereichswerkzeuge immer als native Werkzeuge bei.
- Doctor migriert automatisch die flache Legacy-Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche) nach `talk.provider` + `talk.providers.<provider>`. Wiederholte `doctor --fix`-Ausführungen melden bzw. wenden keine Talk-Normalisierung mehr an, wenn sich lediglich die Reihenfolge der Objektschlüssel unterscheidet.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlsinhaber konfiguriert ist. Der Befehlsinhaber ist das menschliche Operatorkonto, das ausschließlich Inhabern vorbehaltene Befehle ausführen und gefährliche Aktionen genehmigen darf. Die Kopplung per Direktnachricht ermöglicht lediglich die Kommunikation mit dem Bot; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Inhaber vorhanden war, setzen Sie `commands.ownerAllowFrom` explizit.
- Doctor zeigt einen Informationshinweis an, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Ressourcen im Codex-Basisverzeichnis des Operators vorhanden sind. Lokale Starts des Codex-App-Servers verwenden isolierte Basisverzeichnisse pro Agent; installieren Sie bei Bedarf zuerst das Codex-Plugin und verwenden Sie dann `openclaw migrate plan codex`, um Ressourcen zu inventarisieren, die gezielt übernommen werden sollen.
- Doctor warnt, wenn für den Standardagenten zugelassene Skills in der aktuellen Laufzeitumgebung nicht verfügbar sind (fehlende Binärdateien, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen). `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren bzw. konfigurieren Sie stattdessen die fehlende Anforderung, wenn der Skill aktiv bleiben soll.
- Wenn der Sandbox-Modus aktiviert, Docker jedoch nicht verfügbar ist, zeigt Doctor eine deutliche Warnung mit Abhilfemaßnahmen an (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn Legacy-Sandbox-Registrierungsdateien oder Shard-Verzeichnisse vorhanden sind (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/`), meldet Doctor sie; `--fix` migriert gültige Einträge nach SQLite und isoliert ungültige Legacy-Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` durch SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, zeigt Doctor eine schreibgeschützte Warnung an und schreibt keine unverschlüsselten Fallback-Anmeldedaten. Bei Exec-basierten SecretRefs überspringt Doctor die Ausführung, sofern `--allow-exec` nicht vorhanden ist.
- Wenn die Prüfung eines Kanal-SecretRefs in einem Reparaturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt die Ausführung vorzeitig zu beenden.
- Nach Migrationen des Zustandsverzeichnisses warnt Doctor, wenn aktivierte Telegram- oder Discord-Standardkonten von einem Umgebungs-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert im aktuellen Befehlspfad ein auflösbares Telegram-Token. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: Umgebungsüberschreibungen durch `launchctl`

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „nicht autorisiert“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Doctor](/de/gateway/doctor)
