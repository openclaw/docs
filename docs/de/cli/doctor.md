---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und wünschen eine Anleitung zur Behebung
    - Sie haben eine Aktualisierung vorgenommen und möchten eine Plausibilitätsprüfung.
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Doktor
x-i18n:
    generated_at: "2026-07-12T15:08:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e616fd0843183167662292acf501297f44520050b664796fbb15a117cb68905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen und Schnellkorrekturen für Gateway, Kanäle, Plugins, Skills, Modell-Routing, lokalen Zustand und Konfigurationsmigrationen. Verwenden Sie den Befehl immer dann, wenn etwas nicht wie erwartet funktioniert und Sie mit einem einzigen Befehl herausfinden möchten, wo das Problem liegt.

Verwandte Themen:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/de/gateway/security)

## Modi

Doctor verfügt über fünf Modi:

| Modus                     | Befehl                                    | Verhalten                                                                                              |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Prüfen                    | `openclaw doctor`                         | Benutzerorientierte Prüfungen und geführte Eingabeaufforderungen.                                      |
| Reparieren                | `openclaw doctor --fix`                   | Führt unterstützte Reparaturen aus und verwendet Eingabeaufforderungen, sofern eine nicht interaktive Reparatur nicht sicher ist. |
| Lint                      | `openclaw doctor --lint`                  | Schreibgeschützte strukturierte Befunde für CI, Vorabprüfungen und Review-Gates.                        |
| Gemeinsame SQLite-Wartung | `openclaw doctor --state-sqlite compact`  | Erstellt explizit einen Checkpoint, komprimiert und überprüft die kanonische gemeinsame Zustandsdatenbank. |
| SQLite-Sitzungsmigration  | `openclaw doctor --session-sqlite <mode>` | Prüft, importiert, validiert, komprimiert, stellt den Sitzungszustand wieder her oder setzt ihn zurück. |

Verwenden Sie vorzugsweise `--lint`, wenn eine Automatisierung ein stabiles Ergebnis benötigt. Verwenden Sie vorzugsweise `--fix`, wenn ein menschlicher Operator möchte, dass Doctor die Konfiguration oder den Zustand bearbeitet.

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

Verwenden Sie für kanalspezifische Berechtigungen statt `doctor` die Kanalprüfungen:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` meldet die effektiven Berechtigungen des Bots für ein bestimmtes Kanalziel. `channels status --probe` prüft alle konfigurierten Kanäle und Ziele für den automatischen Beitritt zu Sprachkanälen.

## Optionen

| Option                          | Wirkung                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Deaktiviert Vorschläge für Arbeitsbereichsspeicher und -suche.                                                                                                                           |
| `--yes`                         | Akzeptiert Standardwerte ohne Rückfrage.                                                                                                                                                 |
| `--repair` / `--fix`            | Führt empfohlene Reparaturen außerhalb von Diensten ohne Rückfrage aus (`--fix` ist ein Alias). Installationen oder Neuschreibungen des Gateway-Dienstes erfordern weiterhin eine interaktive Bestätigung oder explizite `gateway`-Befehle. |
| `--force`                       | Führt umfassende Reparaturen aus, einschließlich des Überschreibens benutzerdefinierter Dienstkonfigurationen.                                                                          |
| `--non-interactive`             | Wird ohne Eingabeaufforderungen ausgeführt; nur sichere Migrationen und Reparaturen außerhalb von Diensten.                                                                              |
| `--generate-gateway-token`      | Generiert und konfiguriert ein Gateway-Token.                                                                                                                                            |
| `--allow-exec`                  | Erlaubt Doctor, bei der Überprüfung von Geheimnissen konfigurierte `exec`-SecretRefs auszuführen.                                                                                        |
| `--deep`                        | Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen und meldet kürzlich erfolgte Übergaben bei Neustarts des Gateway-Supervisors.                                         |
| `--lint`                        | Führt modernisierte Integritätsprüfungen im schreibgeschützten Modus aus und gibt Diagnosebefunde aus.                                                                                  |
| `--post-upgrade`                | Führt nach einem Upgrade Kompatibilitätsprüfungen für Plugins aus; Befunde werden an stdout ausgegeben; Exit-Code 1, wenn mindestens ein Befund der Fehlerstufe vorliegt.                |
| `--state-sqlite <mode>`         | Führt eine explizite SQLite-Wartung des gemeinsamen Zustands aus. Der einzige Modus ist `compact`.                                                                                       |
| `--session-sqlite <mode>`       | Führt den ausgewählten SQLite-Sitzungsmigrationsmodus aus: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` oder `restore`.                                              |
| `--session-sqlite-store <path>` | Wählt mit `--session-sqlite` den Pfad eines veralteten `sessions.json`-Speichers aus.                                                                                                   |
| `--session-sqlite-agent <id>`   | Wählt mit `--session-sqlite` einen konfigurierten Agenten aus.                                                                                                                           |
| `--session-sqlite-all-agents`   | Wählt mit `--session-sqlite` konfigurierte und erkannte Agentenspeicher aus.                                                                                                             |
| `--github-issue`                | Bereitet mit `--session-sqlite recover` einen bereinigten Problembericht für openclaw/openclaw vor; Doctor erstellt ihn nach `--yes` oder einer interaktiven Bestätigung mit `gh`.       |
| `--json`                        | Mit `--lint`: JSON-Befunde. Mit `--post-upgrade`: `{ probesRun, findings }`. Mit `--state-sqlite` oder `--session-sqlite`: der Wartungsbericht als JSON.                                |
| `--severity-min <level>`        | Verwirft mit `--lint` Befunde unterhalb von `info`, `warning` oder `error`.                                                                                                              |
| `--all`                         | Führt mit `--lint` alle registrierten Prüfungen aus, einschließlich optionaler Prüfungen, die nicht im Standardsatz enthalten sind.                                                     |
| `--skip <id>`                   | Überspringt mit `--lint` eine Prüf-ID. Wiederholbar.                                                                                                                                     |
| `--only <id>`                   | Führt mit `--lint` nur die angegebene(n) Prüf-ID(s) aus. Wiederholbar.                                                                                                                    |

`--severity-min`, `--all`, `--only` und `--skip` werden nur zusammen mit `--lint` akzeptiert; `--json` wird mit `--lint`, `--post-upgrade`, `--state-sqlite` und `--session-sqlite` akzeptiert.

## Lint-Modus

`openclaw doctor --lint` ist schreibgeschützt: keine Eingabeaufforderungen, keine Reparatur, keine Neuschreibung von Konfiguration oder Zustand.

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
    Behebung: Führen Sie `openclaw configure` aus und legen Sie den Gateway-Modus (local/remote) fest oder führen Sie `openclaw config set gateway.mode local` aus.
```

Die JSON-Ausgabe ist die Schnittstelle für Skripte:

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
      "fixHint": "Führen Sie `openclaw configure` aus und legen Sie den Gateway-Modus (local/remote) fest oder führen Sie `openclaw config set gateway.mode local` aus."
    }
  ]
}
```

Exit-Codes:

| Code | Bedeutung                                                                 |
| ---- | ------------------------------------------------------------------------- |
| `0`  | Keine Befunde auf oder über dem ausgewählten Schweregrad-Schwellenwert.   |
| `1`  | Mindestens ein Befund erreicht den ausgewählten Schwellenwert.            |
| `2`  | Befehls-/Laufzeitfehler, bevor Lint-Befunde erzeugt werden können.        |

`--severity-min` steuert sowohl, welche Befunde ausgegeben werden, als auch den Exit-Schwellenwert: `openclaw doctor --lint --severity-min error` kann nichts ausgeben und mit `0` beendet werden, selbst wenn Befunde mit niedrigerem Schweregrad `info`/`warning` vorhanden sind.

`--all` steuert, welche Prüfungen vor der Filterung nach Schweregrad ausgewählt werden. Der standardmäßige Lint-Durchlauf schließt Prüfungen aus, die tiefgreifend oder historisch sind oder mit höherer Wahrscheinlichkeit reparierbare Altlasten aufdecken; verwenden Sie `--all` für das vollständige Inventar. `--only <id>` ist der präziseste Selektor und kann jede registrierte Prüfung anhand ihrer ID ausführen.

`core/doctor/local-audio-acceleration` meldet den automatisch ausgewählten lokalen STT-Befehl, getrennte Nachweise für geeignete/angeforderte/beobachtete Backends sowie die Fallback-Reihenfolge, ohne ein Sprachmodell zu laden. Die Prüfung erzeugt einen informativen Befund; geben Sie daher `--severity-min info` an, um ihn anzuzeigen.

## Strukturierte Zustandsprüfungen

Moderne Doctor-Prüfungen verwenden einen kleinen zweigeteilten Vertrag:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` bildet die Grundlage für `doctor --lint`. `repair()` ist optional und wird nur unter `doctor --fix` / `doctor --repair` ausgeführt. Prüfungen, die noch nicht auf diese Form migriert wurden, verwenden weiterhin den bisherigen Doctor-Beitragsablauf.

Reparaturkontexte können `dryRun`-/`diff`-Anforderungen enthalten; Reparaturergebnisse können strukturierte `diffs` (Konfigurations-/Dateiänderungen) und `effects` (Dienst-, Prozess-, Paket-, Zustands- oder andere Nebeneffekte) zurückgeben, sodass konvertierte Prüfungen schrittweise `doctor --fix --dry-run` unterstützen können, ohne die Planung von Änderungen in `detect()` zu verlagern.

`repair()` meldet `status: "repaired" | "skipped" | "failed"` (ein nicht angegebener Status bedeutet `repaired`). Wenn die Reparatur `skipped` oder `failed` zurückgibt, meldet Doctor den Grund und überspringt die Validierung für diese Prüfung. Nach einer erfolgreichen Reparatur führt Doctor `detect()` erneut aus, beschränkt auf die reparierten Befunde. Ist der Befund weiterhin vorhanden, meldet Doctor eine Reparaturwarnung, statt die Änderung als abgeschlossen zu behandeln.

Ein Befund enthält:

| Feld              | Zweck                                                          |
| ----------------- | -------------------------------------------------------------- |
| `checkId`         | Stabile ID für Skip-/Only-Filter und CI-Zulassungslisten.       |
| `severity`        | `info`, `warning` oder `error`.                                 |
| `message`         | Für Menschen lesbare Problembeschreibung.                       |
| `path`            | Konfigurations-, Datei- oder logischer Pfad, sofern verfügbar.  |
| `line` / `column` | Position im Quelltext, sofern verfügbar.                        |
| `ocPath`          | Präzise `oc://`-Adresse, wenn eine Prüfung darauf verweisen kann. |
| `fixHint`         | Vorgeschlagene Betreiberaktion oder Zusammenfassung der Reparatur. |

Modernisierte Kernprüfungen von Doctor bleiben dem geordneten Doctor-Beitrag zugeordnet, dem ihr für Menschen bestimmtes Verhalten von `doctor` / `doctor --fix` gehört. Die gemeinsame strukturierte Zustandsregistrierung ist der Erweiterungspunkt: Gebündelte und Plugin-gestützte Prüfungen werden nach den Kernprüfungen von Doctor ausgeführt, sobald ihr zuständiges Paket sie im aktiven Befehlspfad registriert. `openclaw/plugin-sdk/health` stellt Plugin-Autoren denselben Vertrag bereit.

## Prüfungsauswahl

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` und `--skip` akzeptieren vollständige Prüfungs-IDs und können wiederholt werden. Wenn eine `--only`-ID nicht registriert ist, wird für diese ID keine Prüfung ausgeführt; verwenden Sie `checksRun`/`checksSkipped` in der Ausgabe, um zu bestätigen, dass ein gezieltes Gate die erwarteten Prüfungen auswählt.

## Modus nach einem Upgrade

`openclaw doctor --post-upgrade` führt Plugin-Kompatibilitätsprüfungen zur Verkettung nach einem Build oder Upgrade aus. Befunde werden auf stdout ausgegeben; der Exit-Code lautet 1, wenn ein Befund `level: "error"` aufweist. Fügen Sie `--json` hinzu, um eine maschinenlesbare Hülle (`{ probesRun, findings }`) zu erhalten, die für CI, das Community-Skill `fork-upgrade` und andere Smoke-Test-Werkzeuge nach Upgrades geeignet ist. Wenn der Index der installierten Plugins fehlt oder fehlerhaft ist, gibt der JSON-Modus weiterhin die Hülle mit einem Fehlerbefund `plugin.index_unavailable` aus.

Der Start eines Container-Images bildet die Ausnahme vom üblichen Ablauf „Doctor nach der
Aktualisierung ausführen“. Wenn `openclaw gateway run` mit einer neuen OpenClaw-Version startet,
führt es sichere Reparaturen des Zustands und der Plugins aus, bevor es Bereitschaft meldet. Wenn die Reparatur
nicht sicher abgeschlossen werden kann, wird der Start beendet und Sie werden angewiesen, dasselbe Image einmal mit
`openclaw doctor --fix` für denselben eingebundenen Zustand/dieselbe eingebundene Konfiguration auszuführen, bevor Sie
den Container normal neu starten.

## SQLite-Compaction des gemeinsamen Zustands

`openclaw doctor --state-sqlite compact` ist eine explizite Offline-Wartung für
die kanonische Datenbank des gemeinsamen Zustands unter
`<state-dir>/state/openclaw.sqlite`. Der Befehl akzeptiert keinen beliebigen Datenbankpfad,
wird im normalen Gateway-Betrieb niemals aufgerufen und ist nicht Bestandteil von
`openclaw doctor --fix`.

Stoppen Sie zuerst das Gateway und erstellen Sie eine verifizierte Sicherung:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Der Befehl:

1. Erfordert eine reguläre Datei am kanonischen Pfad des gemeinsamen Zustands. Eine fehlende
   Datenbank wird als `skipped` gemeldet, und der Befehl wird erfolgreich beendet.
2. Validiert die aktuell unterstützte Schemaversion und
   `schema_meta.role = "global"`, bevor ein Checkpoint ausgeführt oder die Datei geändert wird.
3. Erfordert ein nicht belegtes `wal_checkpoint(TRUNCATE)`. Stoppen Sie alle verbleibenden OpenClaw-
   Prozesse und versuchen Sie es erneut, wenn der Checkpoint belegt ist.
4. Setzt `auto_vacuum` auf `INCREMENTAL`, führt ein vollständiges `VACUUM` aus und erstellt
   erneut einen Checkpoint.
5. Führt `quick_check`, `integrity_check` und `foreign_key_check` aus und
   wendet anschließend erneut ausschließlich dem Eigentümer gewährte Berechtigungen auf die Datenbank und die SQLite-Sidecar-Dateien an.

Die JSON-Ausgabe meldet die Größen der Datenbank und des WAL, die Seiten der Freelist, die Seitengröße und
den `auto_vacuum`-Wert vor und nach der Compaction sowie die zurückgewonnenen Bytes und die
Ergebnisse von `quick_check` und `integrity_check`. `foreign_key_check` wird
nach dem Fail-Closed-Prinzip durchgesetzt und besitzt kein separates Erfolgsfeld. SQLite meldet `auto_vacuum` als
`0` für „keines“, `1` für „vollständig“ und `2` für „inkrementell“.

Die Compaction schlägt ohne Änderung fehl, wenn das Schema veraltet oder neuer als der
ausgeführte OpenClaw-Build ist oder zu einer Agentendatenbank gehört. Führen Sie bei einem
älteren Schema des gemeinsamen Zustands zuerst `openclaw doctor --fix` aus. Stellen Sie bei einem neueren Schema eine
kompatible Sicherung wieder her oder aktualisieren Sie OpenClaw.

## SQLite-Migration von Sitzungen

OpenClaw importiert veraltete Sitzungszeilen und den Transkriptverlauf beim Start des Gateway und bei
`openclaw doctor --fix` automatisch in die SQLite-Datenbank jedes Agenten. `openclaw doctor --session-sqlite <mode>` ist das
gezielte Inspektions- und Validierungswerkzeug für diese Migration. Aktuelle Laufzeit-
Sitzungszeilen befinden sich in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Veraltete
`sessions.json`-Dateien dienen als Migrationsquellen. Aktive JSONL-Transkriptdateien werden
importiert und nach erfolgreichem Import aus dem aktiven Sitzungsverzeichnis archiviert;
JSONL-Dateien der Archivstufe bleiben Support-Artefakte und sind keine Laufzeit-
Fallbacks.

Modi:

| Modus      | Verhalten                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Liest die Anzahl veralteter und SQLite-Einträge sowie nicht referenzierte JSONL-Dateien, ohne einen Import durchzuführen.          |
| `dry-run`  | Analysiert veraltete Einträge und JSONL-Transkriptdateien, zählt importierbare Zeilen und meldet Probleme, ohne SQLite-Zeilen zu schreiben. |
| `import`   | Importiert veraltete Einträge und Transkriptereignisse für die ausgewählten Ziele in SQLite.                                     |
| `validate` | Vergleicht die ausgewählten veralteten Quellen mit SQLite-Zeilen und der Anzahl der Transkriptereignisse.                          |
| `compact`  | Führt Checkpoint und VACUUM für ausgewählte SQLite-Agentendatenbanken aus, um nach umfangreichen Löschungen oder Archivbereinigungen freie Seiten zurückzugewinnen. |
| `recover`  | Stellt den letzten fehlgeschlagenen Migrationslauf wieder her, validiert seine Ziele und bereitet einen bereinigten GitHub-Issue-Bericht vor. |
| `restore`  | Stellt archivierte Transkriptartefakte aus aufgezeichneten Migrationsmanifesten wieder her, ohne SQLite-Daten zu löschen.          |

Selektoren:

- Standard: der konfigurierte Speicher des Standardagenten, sofern diese veraltete Speicherdatei vorhanden ist.
- `--session-sqlite-agent <id>`: ein konfigurierter Agent.
- `--session-sqlite-all-agents`: konfigurierte Agentenspeicher sowie erkannte Agentenspeicher.
- `--session-sqlite-store <path>`: ein expliziter Pfad zu einer veralteten `sessions.json`.

Manuelle Inspektionsabfolge:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Sichern Sie das OpenClaw-Zustandsverzeichnis, bevor Sie `import` in einer Installation mit
wichtigem Verlauf ausführen. `validate` wird mit einem von null verschiedenen Exit-Code beendet, wenn ein ausgewählter veralteter Eintrag
in SQLite fehlt, eine Sitzungs-ID abweicht oder die Anzahl der Transkriptereignisse abweicht.
Wenn Sie `--session-sqlite-store <path>` verwenden, prüfen Sie, ob der Bericht die
erwartete Anzahl von Zielen enthält; ein nicht vorhandener expliziter Speicherpfad wählt keine Ziele aus.

SQLite-Löschvorgänge geben zunächst Seiten innerhalb der Datenbank frei; sie verkleinern die
Datenbankdatei nicht notwendigerweise sofort. Führen Sie nach dem Löschen oder Archivieren großer
Transkripte `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
aus, um WAL-Dateien mit einem Checkpoint zu versehen, `VACUUM` auszuführen und die Größen von Datenbank und WAL
vorher und nachher zu melden. Die Compaction erfordert eine reguläre Datei mit dem aktuellen Agentenschema,
den dauerhaften Eigentümermetadaten des ausgewählten Agenten und keinen offenen Handle im Doctor-
Prozess. Dies ist eine explizite Offline-Wartung: Stoppen Sie zuerst das Gateway, damit normale
Schreibvorgänge nicht mit dem Checkpoint oder `VACUUM` konkurrieren können.

Jeder Import schreibt ein Manifest unter
`~/.openclaw/session-sqlite-migration-runs/`, bevor Transkriptartefakte
in das Archiv verschoben werden. Wenn der Start eine fehlgeschlagene SQLite-Sitzungsmigration meldet, nachdem
Artefakte verschoben wurden, führen Sie die Wiederherstellung aus:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Die Wiederherstellung wählt das neueste Manifest einer fehlgeschlagenen Migration aus, stellt ausschließlich die
archivierten Artefakte des Manifests wieder her, validiert die betroffenen Ziele, aktualisiert die
bereinigten Berichte `.failure.md` und `.failure.json` und bereitet den Text eines GitHub-Issues
vor, der Transkriptinhalte, die unbereinigte Umgebung, Secrets und unbegrenzt umfangreiche
Konfiguration vermeidet. Wenn kein Manifest einer fehlgeschlagenen Migration vorhanden ist, aber eine ausgewählte SQLite-
Agentendatenbank beschädigt oder keine Datenbank ist oder Journal-Sidecars ohne Haupt-
datenbank besitzt, kopiert die Wiederherstellung den vollständigen Dateisatz in ein temporäres Inspektions-
verzeichnis. SQLite kann ein gültiges aktives Journal in dieser entbehrlichen Kopie
zurücksetzen, bevor `quick_check`, `integrity_check` und `foreign_key_check` ausgeführt werden, während die
ursprünglichen forensischen Dateien unverändert bleiben. Fehlgeschlagene Integritätsprüfungen oder verwaiste
Sidecars bewahren die DB-, WAL-, SHM- und Rollback-Journal-Dateien auf, indem der
gesamte erkannte Satz mit einem einheitlichen Suffix `.corrupt-<timestamp>` umbenannt wird. Bei einem abgefangenen Fehler
beim Umbenennen werden bereits verschobene Dateien zurückverschoben, bevor der Fehler gemeldet wird, sodass ein
wiederherstellbarer Dateisatz nicht unbemerkt aufgeteilt wird. Stoppen Sie das Gateway vor der Wiederherstellung;
das Kopieren oder Umbenennen eines sich aktiv ändernden SQLite-Dateisatzes ist unsicher und verhält sich
je nach Betriebssystem unterschiedlich. Mit `--github-issue --yes` verwendet Doctor
die GitHub CLI, um das Issue in `openclaw/openclaw` zu erstellen; ohne Bestätigung
schreibt es den lokalen Supportbericht und gibt eine vorausgefüllte Issue-URL aus.

`restore` bleibt die grundlegende Rückgängig-Operation. Sie verwendet die
Einträge `sourcePath -> archivePath` des Manifests, verschiebt archivierte Artefakte nur dann zurück, wenn der
ursprüngliche Pfad fehlt, meldet Konflikte, wenn beide Pfade vorhanden sind, und lässt
die SQLite-Datenbank bestehen.

### Downgrade nach der SQLite-Sitzungsmigration

Stellen Sie vor dem Start einer älteren dateibasierten OpenClaw-Version die archivierten
veralteten Transkriptartefakte wieder her:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Ältere Versionen lesen `sessions.json`-Einträge und die in diesen Einträgen aufgezeichneten
`sessionFile`-Pfade. Nach der SQLite-Migration verschieben erfolgreiche Importe aktive JSONL-
Transkripte nach `session-sqlite-import-archive/`, sodass die ältere Laufzeit
diesen Verlauf erst sehen kann, nachdem Restore die im Manifest aufgezeichneten Artefakte an
ihre ursprünglichen Pfade zurückverschoben hat.

Restore löscht keine SQLite-Daten. Sitzungen, die nach der Umstellung auf SQLite erstellt wurden,
existieren ausschließlich in SQLite und werden für die ältere Laufzeit nicht angezeigt. Wenn Sie später
erneut aktualisieren, führen Sie die oben beschriebene normale Migrationsvalidierungsabfolge aus, damit OpenClaw
die wiederhergestellten veralteten Artefakte vor dem Import mit den SQLite-Zeilen vergleichen kann.

## Hinweise

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte Doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, da `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; verwenden Sie für nix-openclaw den agentenzentrierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Eingabeaufforderungen (Schlüsselbund-/OAuth-Korrekturen usw.) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Ausführungen ohne Terminal (Cron, Telegram, kein Terminal) überspringen die Eingabeaufforderungen.
- Nicht interaktive `doctor`-Ausführungen überspringen das vorzeitige Laden von Plugins, damit Systemprüfungen ohne Terminal schnell bleiben. Interaktive Sitzungen laden weiterhin die Plugin-Oberflächen, die für den veralteten Systemprüfungs-/Reparaturablauf benötigt werden.
- `--lint` ist strenger als `--non-interactive`: immer schreibgeschützt, keine Eingabeaufforderungen und keine Anwendung sicherer Migrationen. Verwenden Sie `doctor --fix` oder `doctor --repair`, wenn Doctor Änderungen vornehmen soll.
- Doctor führt standardmäßig keine `exec`-SecretRefs aus, wenn Secrets geprüft werden. Verwenden Sie `--allow-exec` (mit oder ohne `--lint`) nur, wenn Doctor diese konfigurierten Secret-Resolver bewusst ausführen soll.
- Bei jedem Schreiben der Konfiguration (einschließlich einer Reparatur mit `--fix`) wird eine Sicherung nach `~/.openclaw/openclaw.json.bak` rotiert (mit einem nummerierten Ring von `.bak.1` bis `.bak.4`). `--fix` entfernt außerdem unbekannte Konfigurationsschlüssel, die von der Schemavalidierung gemeldet wurden, und führt jede Entfernung auf; während einer laufenden Aktualisierung wird dies übersprungen, damit ein teilweise geschriebener Upgrade-Zustand nicht entfernt wird, bevor dessen Migration abgeschlossen ist.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin den Zustand von Gateway und Dienst und führt Reparaturen durch, die nicht den Dienst betreffen, überspringt jedoch Installation, Start, Neustart und Bootstrap des Dienstes sowie die Bereinigung veralteter Dienste.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt bei einer Reparatur die Befehls-/Einstiegspunkt-Metadaten eines laufenden systemd-Gateway-Dienstes nicht neu. Beenden Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, um den aktiven Starter zu ersetzen.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Definitionen des Gateway-Dienstes, installiert oder überschreibt sie außerhalb des Aktualisierungsreparaturmodus jedoch nicht. Führen Sie bei einem fehlenden Dienst `openclaw gateway install` aus oder verwenden Sie `openclaw gateway install --force`, um den Starter zu ersetzen.
- Integritätsprüfungen des Zustands erkennen verwaiste Transkriptdateien im Sitzungsverzeichnis. Für ihre Archivierung als `.deleted.<timestamp>` ist eine interaktive Bestätigung erforderlich; `--fix`, `--yes` und Ausführungen ohne Terminal belassen sie an Ort und Stelle.
- Doctor durchsucht `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach veralteten Formen von Cron-Aufträgen und schreibt sie neu, bevor kanonische Zeilen in SQLite importiert werden.
- Doctor meldet Cron-Aufträge mit einer expliziten Überschreibung durch `payload.model`, einschließlich der Anzahl pro Provider-Namespace und Abweichungen von `agents.defaults.model`, sodass geplante Aufträge, die das Standardmodell nicht übernehmen, bei Untersuchungen zur Authentifizierung oder Abrechnung sichtbar sind.
- Doctor meldet Cron-Aufträge, die weiterhin als in Ausführung (`state.runningAtMs`) markiert sind, wodurch `openclaw cron list` sie als `running` anzeigen kann. Diese Prüfung ist schreibgeschützt: Wenn derzeit kein Gateway einen markierten Auftrag ausführt, zeichnet der nächste Start des Cron-Dienstes die unterbrochene Ausführung auf und entfernt die Markierung.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das nicht mehr gewartete veraltete Skript `~/.openclaw/bin/ensure-whatsapp.sh` ausführt, das fälschlicherweise `Gateway inactive` melden kann, wenn Cron die Umgebung des systemd-Benutzerbusses fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor auf eine beeinträchtigte Gateway-Ereignisschleife, während lokale `openclaw-tui`-Clients weiterhin ausgeführt werden. `doctor --fix` beendet nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen in die Warteschlange eingereiht werden.
- Doctor schreibt veraltete Modellreferenzen vom Typ `openai-codex/*` in allen primären Modellen, Fallbacks, Modellen zur Bild-/Videogenerierung, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen und veralteten Sitzungs-Routenbindungen in kanonische Referenzen vom Typ `openai/*` um. `--fix` migriert außerdem veraltete Authentifizierungsprofile vom Typ `openai-codex:*` und Einträge unter `auth.order.openai-codex` zu `openai:*`, überträgt die Codex-Absicht auf Provider-/modellbezogene Einträge vom Typ `agentRuntime.id: "codex"`, entfernt veraltete Laufzeitbindungen für ganze Agenten und Sitzungen und behält reparierte OpenAI-Agentenreferenzen im Codex-Authentifizierungsrouting, anstatt sie über die direkte OpenAI-API-Schlüssel-Authentifizierung zu leiten.
- Doctor meldet nicht leere Listen unter `auth.order.<provider>`, deren referenzierte Profile vollständig fehlen, obwohl kompatible gespeicherte Anmeldedaten vorhanden sind. `doctor --fix` löscht nur diese veralteten Überschreibungen und stellt damit die automatische agentenspezifische Auswahl von Anmeldedaten wieder her; explizit leere Reihenfolgen, teilweise noch gültige Listen und Reihenfolgen ohne kompatible gespeicherte Anmeldedaten bleiben unverändert. Wenn ein aktiver SQLite-Authentifizierungsspeicher nicht lesbar oder fehlerhaft ist, erklärt Doctor, warum diese Reparatur übersprungen wurde. Starten Sie ein laufendes Gateway neu, bevor Sie den Authentifizierungsstatus erneut prüfen, falls dessen Konfigurations-Neulademodus den Schreibvorgang nicht automatisch anwendet.
- Doctor bereinigt veraltete Staging-Zustände für Plugin-Abhängigkeiten aus älteren OpenClaw-Versionen und verknüpft das Hostpaket `openclaw` für verwaltete npm-Plugins, die es als Peer-Abhängigkeit deklarieren, erneut. Außerdem repariert Doctor fehlende herunterladbare Plugins, auf die von der Konfiguration verwiesen wird (`plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen und konfigurierte Agentenlaufzeiten). Während Paketaktualisierungen überspringt Doctor die Plugin-Reparatur durch den Paketmanager, bis der Paketaustausch abgeschlossen ist; führen Sie anschließend `openclaw doctor --fix` erneut aus, falls ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Wenn ein Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfigurationen, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.deny`/`plugins.entries` sowie die zugehörigen verwaisten Kanalkonfigurationen, Heartbeat-Ziele und Kanalmodellüberschreibungen entfernt werden, sofern die Plugin-Erkennung ordnungsgemäß funktioniert.
- Doctor isoliert ungültige Plugin-Konfigurationen, indem der betroffene Eintrag `plugins.entries.<id>` deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Beim Start überspringt das Gateway bereits nur dieses fehlerhafte Plugin, sodass andere Plugins und Kanäle weiter ausgeführt werden.
- Doctor entfernt das eingestellte `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server behält Codex-native Arbeitsbereichswerkzeuge immer nativ bei.
- Doctor migriert automatisch die veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche Einträge) zu `talk.provider` + `talk.providers.<provider>`. Wiederholte Ausführungen von `doctor --fix` melden bzw. wenden die Talk-Normalisierung nicht mehr an, wenn der einzige Unterschied in der Reihenfolge der Objektschlüssel besteht.
- Doctor enthält eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Anmeldedaten für Einbettungen fehlen.
- Doctor warnt, wenn kein Befehlseigentümer konfiguriert ist. Der Befehlseigentümer ist das Konto des menschlichen Betreibers, das Befehle ausführen darf, die ausschließlich Eigentümern vorbehalten sind, und gefährliche Aktionen genehmigen darf. Die DM-Kopplung erlaubt einer Person lediglich, mit dem Bot zu kommunizieren; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Eigentümer verfügbar war, legen Sie `commands.ownerAllowFrom` explizit fest.
- Doctor meldet einen Hinweis, wenn Agenten im Codex-Modus konfiguriert sind und persönliche Codex-CLI-Ressourcen im Codex-Basisverzeichnis des Betreibers vorhanden sind. Lokale Starts des Codex-App-Servers verwenden isolierte agentenspezifische Basisverzeichnisse; installieren Sie bei Bedarf zuerst das Codex-Plugin und verwenden Sie dann `openclaw migrate plan codex`, um Ressourcen zu erfassen, die bewusst übernommen werden sollen.
- Doctor warnt, wenn Skills, die für den Standardagenten zulässig sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind (fehlende Binärdateien, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen). `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren bzw. konfigurieren Sie stattdessen die fehlende Anforderung, wenn der Skill aktiv bleiben soll.
- Wenn der Sandbox-Modus aktiviert, Docker jedoch nicht verfügbar ist, meldet Doctor eine eindeutige Warnung mit Abhilfemaßnahmen (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn veraltete Sandbox-Registrierungsdateien oder Shard-Verzeichnisse vorhanden sind (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/`), meldet Doctor sie; `--fix` migriert gültige Einträge in SQLite und isoliert ungültige veraltete Dateien.
- Wenn `gateway.auth.token`/`gateway.auth.password` durch SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Fallback-Anmeldedaten im Klartext. Bei exec-basierten SecretRefs überspringt Doctor die Ausführung, sofern `--allow-exec` nicht angegeben ist.
- Wenn die Prüfung einer Kanal-SecretRef in einem Korrekturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, anstatt vorzeitig beendet zu werden.
- Nach Migrationen des Zustandsverzeichnisses warnt Doctor, wenn aktivierte Telegram- oder Discord-Standardkonten von einem Umgebungs-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-Benutzernamen in `allowFrom` (`doctor --fix`) erfordert ein im aktuellen Befehlspfad auflösbares Telegram-Token. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

## macOS: `launchctl`-Umgebungsüberschreibungen

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann dauerhafte „unauthorized“-Fehler verursachen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Gateway-Diagnose](/de/gateway/doctor)
