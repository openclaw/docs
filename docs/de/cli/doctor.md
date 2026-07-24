---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten angeleitete Lösungen.
    - Sie haben eine Aktualisierung vorgenommen und möchten eine Plausibilitätsprüfung.
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Diagnosewerkzeug
x-i18n:
    generated_at: "2026-07-24T03:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b0aa9b51d7bccd4357d3ec747be514a0245b44a90e6e6c7ea789ab68420465
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Integritätsprüfungen und schnelle Fehlerbehebungen für Gateway, Kanäle, Plugins, Skills, Modell-Routing, lokalen Zustand und Konfigurationsmigrationen. Verwenden Sie den Befehl immer dann, wenn etwas nicht wie erwartet funktioniert und Sie mit einem einzigen Befehl herausfinden möchten, was nicht stimmt.

Wenn der Gateway-Status beeinträchtigte SecretRef-Verantwortliche meldet, gibt doctor eine Warnung **Beeinträchtigung der Secret-Laufzeit** mit allen nicht initialisierten oder veralteten Verantwortlichen, dem betroffenen Konfigurationspfad, einem redigierten Grund und dem Wiederholungsbefehl `openclaw secrets reload` aus.

Wenn eingehende Kanalereignisse in die Dead-Letter-Ablage verschoben werden, nennt doctor jedes betroffene Kanalkonto und verweist zur Untersuchung und Wiederherstellung auf [`openclaw channels dead-letters list`](/de/cli/channels#inbound-dead-letters).

Verwandte Themen:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/de/gateway/security)

## Betriebsarten

Doctor verfügt über fünf Betriebsarten:

| Betriebsart                | Befehl                                    | Verhalten                                                                                     |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Untersuchen                | `openclaw doctor`                         | Für Menschen ausgelegte Prüfungen und geführte Eingabeaufforderungen.                          |
| Reparieren                 | `openclaw doctor --fix`                   | Führt unterstützte Reparaturen aus und verwendet Eingabeaufforderungen, sofern eine nicht interaktive Reparatur nicht sicher ist. |
| Lint                       | `openclaw doctor --lint`                  | Schreibgeschützte strukturierte Befunde für CI, Vorabprüfungen und Review-Gates.               |
| Gemeinsame SQLite-Wartung  | `openclaw doctor --state-sqlite compact`  | Erstellt explizit Checkpoints, komprimiert und überprüft die kanonische gemeinsame Zustandsdatenbank. |
| SQLite-Sitzungsmigration   | `openclaw doctor --session-sqlite <mode>` | Untersucht, importiert, validiert, komprimiert, rekonstruiert oder stellt den Sitzungszustand wieder her. |

Bevorzugen Sie `--lint`, wenn die Automatisierung ein stabiles Ergebnis benötigt. Bevorzugen Sie `--fix`, wenn ein menschlicher Operator möchte, dass doctor die Konfiguration oder den Zustand bearbeitet.

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

`channels capabilities` meldet die effektiven Berechtigungen des Bots für ein bestimmtes Kanalziel. `channels status --probe` prüft alle konfigurierten Kanäle und Ziele für den automatischen Beitritt zu Sprachkanälen.

## Optionen

| Option                          | Wirkung                                                                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Deaktiviert Vorschläge für Arbeitsbereichsspeicher und -suche.                                                                                                                           |
| `--yes`                         | Akzeptiert Standardwerte ohne Rückfrage.                                                                                                                                                 |
| `--repair` / `--fix`            | Führt empfohlene Reparaturen außerhalb von Diensten ohne Rückfrage aus (`--fix` ist ein Alias). Installationen oder Neuschreibungen des Gateway-Dienstes erfordern weiterhin eine interaktive Bestätigung oder explizite `gateway`-Befehle. |
| `--force`                       | Führt aggressive Reparaturen aus, einschließlich des Überschreibens benutzerdefinierter Dienstkonfigurationen.                                                                          |
| `--non-interactive`             | Wird ohne Eingabeaufforderungen ausgeführt; nur sichere Migrationen und Reparaturen außerhalb von Diensten.                                                                              |
| `--generate-gateway-token`      | Generiert und konfiguriert ein Gateway-Token.                                                                                                                                            |
| `--allow-exec`                  | Erlaubt doctor, konfigurierte `exec`-SecretRefs bei der Überprüfung von Secrets auszuführen.                                                                                  |
| `--deep`                        | Durchsucht Systemdienste nach zusätzlichen Gateway-Installationen und meldet kürzlich erfolgte Übergaben bei Neustarts des Gateway-Supervisors.                                          |
| `--lint`                        | Führt modernisierte Integritätsprüfungen im schreibgeschützten Modus aus und gibt Diagnosebefunde aus.                                                                                   |
| `--post-upgrade`                | Führt nach einem Upgrade Plugin-Kompatibilitätsprüfungen aus; Befunde werden auf stdout ausgegeben; Exit-Code 1, wenn ein Befund der Stufe „Fehler“ vorhanden ist.                         |
| `--state-sqlite <mode>`         | Führt eine explizite SQLite-Wartung des gemeinsamen Zustands aus. Der einzige Modus ist `compact`.                                                                               |
| `--session-sqlite <mode>`       | Führt den gezielten SQLite-Sitzungsmigrationsmodus aus: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` oder `restore`. |
| `--session-sqlite-store <path>` | Mit `--session-sqlite`: Wählt einen Pfad zu einem veralteten `sessions.json`-Speicher aus.                                                                                            |
| `--session-sqlite-agent <id>`   | Mit `--session-sqlite`: Wählt einen konfigurierten Agenten aus.                                                                                                                          |
| `--session-sqlite-all-agents`   | Mit `--session-sqlite`: Wählt konfigurierte und erkannte Agentenspeicher aus.                                                                                                            |
| `--github-issue`                | Mit `--session-sqlite recover`: Bereitet einen bereinigten Problembericht für openclaw/openclaw vor; doctor erstellt ihn nach `--yes` oder interaktiver Bestätigung mit `gh`. |
| `--json`                        | Mit `--lint`: JSON-Befunde. Mit `--post-upgrade`: `{ probesRun, findings }`. Mit `--state-sqlite` oder `--session-sqlite`: der Wartungsbericht als JSON.                            |
| `--severity-min <level>`        | Mit `--lint`: Verwirft Befunde unterhalb von `info`, `warning` oder `error`.                                                                    |
| `--all`                         | Mit `--lint`: Führt alle registrierten Prüfungen aus, einschließlich optionaler Prüfungen, die vom Standardsatz ausgeschlossen sind.                                           |
| `--skip <id>`                   | Mit `--lint`: Überspringt eine Prüfungs-ID. Wiederholbar.                                                                                                                       |
| `--only <id>`                   | Mit `--lint`: Führt nur die angegebene(n) Prüfungs-ID(s) aus. Wiederholbar.                                                                                                    |

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

| Code | Bedeutung                                                        |
| ---- | ---------------------------------------------------------------- |
| `0`  | Keine Befunde auf oder über dem ausgewählten Schweregrad-Schwellenwert. |
| `1`  | Mindestens ein Befund erreicht den ausgewählten Schwellenwert.    |
| `2`  | Befehls- oder Laufzeitfehler, bevor Lint-Befunde erstellt werden können. |

`--severity-min` steuert sowohl die ausgegebenen Befunde als auch den Exit-Schwellenwert: `openclaw doctor --lint --severity-min error` kann nichts ausgeben und mit `0` beendet werden, selbst wenn Befunde der niedrigeren Schweregrade `info`/`warning` vorhanden sind.

`--all` steuert, welche Prüfungen vor der Filterung nach Schweregrad ausgewählt werden. Der standardmäßige Lint-Durchlauf schließt Prüfungen aus, die tiefgehend oder historisch sind oder mit höherer Wahrscheinlichkeit reparierbare Altlasten aufdecken; verwenden Sie `--all` für den vollständigen Bestand. `--only <id>` ist der präziseste Selektor und kann jede registrierte Prüfung anhand ihrer ID ausführen.

`core/doctor/local-audio-acceleration` meldet den automatisch ausgewählten lokalen STT-Befehl, getrennte Nachweise für geeignete, angeforderte und beobachtete Backends sowie die Fallback-Reihenfolge, ohne ein Sprachmodell zu laden. Die Prüfung gibt einen informativen Befund aus; fügen Sie daher `--severity-min info` hinzu, um ihn anzuzeigen.

## Strukturierte Integritätsprüfungen

Moderne doctor-Prüfungen verwenden einen kleinen, aufgeteilten Vertrag:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` bildet die Grundlage für `doctor --lint`. `repair()` ist optional und wird nur unter `doctor --fix` / `doctor --repair` ausgeführt. Prüfungen, die noch nicht auf diese Struktur migriert wurden, verwenden weiterhin den veralteten Beitragsablauf von doctor.

Reparaturkontexte können `dryRun`-/`diff`-Anforderungen enthalten; Reparaturergebnisse können strukturierte `diffs` (Konfigurations-/Dateibearbeitungen) und `effects` (Dienst-, Prozess-, Paket-, Zustands- oder andere Nebeneffekte) zurückgeben, sodass konvertierte Prüfungen in Richtung `doctor --fix --dry-run` erweitert werden können, ohne die Mutationsplanung in `detect()` zu verlagern.

`repair()` meldet `status: "repaired" | "skipped" | "failed"` (ein ausgelassener Status bedeutet `repaired`). Wenn die Reparatur `skipped` oder `failed` zurückgibt, meldet Doctor den Grund und überspringt die Validierung für diese Prüfung. Nach einer erfolgreichen Reparatur führt Doctor `detect()` erneut aus, beschränkt auf die reparierten Befunde; wenn der Befund weiterhin vorhanden ist, meldet Doctor eine Reparaturwarnung, statt die Änderung als abgeschlossen zu behandeln.

Ein Befund umfasst:

| Feld              | Zweck                                                          |
| ----------------- | -------------------------------------------------------------- |
| `checkId`         | Stabile ID für Skip-/Only-Filter und CI-Zulassungslisten.       |
| `severity`        | `info`, `warning` oder `error`.                         |
| `message`         | Für Menschen lesbare Problembeschreibung.                       |
| `path`            | Konfigurations-, Datei- oder logischer Pfad, sofern verfügbar.  |
| `line` / `column` | Quellposition, sofern verfügbar.                               |
| `ocPath`          | Genaue `oc://`-Adresse, wenn eine Prüfung darauf verweisen kann. |
| `fixHint`         | Empfohlene Betreiberaktion oder Zusammenfassung der Reparatur.  |

Modernisierte Doctor-Prüfungen im Kern bleiben dem geordneten Doctor-Beitrag zugeordnet, dem ihr menschenbezogenes `doctor`-/`doctor --fix`-Verhalten gehört. Die gemeinsame strukturierte Zustandsregistrierung ist der Erweiterungspunkt: Gebündelte und Plugin-gestützte Prüfungen werden nach den Doctor-Prüfungen des Kerns ausgeführt, sobald ihr zuständiges Paket sie im aktiven Befehlspfad registriert. `openclaw/plugin-sdk/health` stellt Plugin-Autoren denselben Vertrag bereit.

## Prüfungsauswahl

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` und `--skip` akzeptieren vollständige Prüfungs-IDs und können wiederholt werden. Wenn eine `--only`-ID nicht registriert ist, wird für diese ID keine Prüfung ausgeführt; verwenden Sie `checksRun`/`checksSkipped` in der Ausgabe, um zu bestätigen, dass ein fokussiertes Gate die erwarteten Prüfungen auswählt.

## Modus nach einem Upgrade

`openclaw doctor --post-upgrade` führt Plugin-Kompatibilitätsprüfungen zur Verkettung nach einem Build oder Upgrade aus. Befunde werden auf stdout ausgegeben; der Exit-Code lautet 1, wenn ein Befund `level: "error"` aufweist. Fügen Sie `--json` hinzu, um eine maschinenlesbare Hülle (`{ probesRun, findings }`) zu erhalten, die für CI, das Community-Skill `fork-upgrade` und andere Smoke-Test-Werkzeuge nach Upgrades geeignet ist. Wenn der Index installierter Plugins fehlt oder fehlerhaft ist, gibt der JSON-Modus dennoch die Hülle mit einem `plugin.index_unavailable`-Fehlerbefund aus.

Der Start eines Container-Images ist die Ausnahme vom üblichen Ablauf „Doctor nach
der Aktualisierung ausführen“. Wenn `openclaw gateway run` mit einer neuen OpenClaw-Version startet,
führt es sichere Zustands- und Plugin-Reparaturen aus, bevor es die Bereitschaft meldet. Wenn die Reparatur
nicht sicher abgeschlossen werden kann, wird der Start beendet und Sie werden angewiesen, dasselbe Image einmal mit
`openclaw doctor --fix` für denselben eingebundenen Zustand/dieselbe eingebundene Konfiguration auszuführen, bevor Sie
den Container normal neu starten.

## Migration von Legacy-Zuständen

`openclaw doctor --fix` ist der einzige zuständige Eigentümer für dauerhafte Datei-zu-SQLite-Migrationen. Es validiert und beansprucht jede erkannte Quelle, schreibt und überprüft kanonische Zeilen, zeichnet einen Migrationsbeleg auf und entfernt anschließend die stillgelegte Quelle. Laufzeitcode führt weder verzögerte Importe noch Fallback-Lesevorgänge aus.

Dies umfasst stillgelegte MCP-OAuth-Dateien unter `<state-dir>/mcp-oauth/*.json`. Stoppen Sie das Gateway vor der Reparatur. Doctor importiert gültige Anmeldedaten in `<state-dir>/state/openclaw.sqlite`, erhält eine vorhandene kanonische SQLite-Sitzung, wenn beide Speicher existieren, entfernt den veralteten persistenten OAuth-Wert `state` und verwendet seinen Beleg, um zu verhindern, dass eine neu erstellte veraltete Datei abgemeldete Anmeldedaten wiederherstellt. Stillgelegte `.lock`-Sidecars schlagen nach dem Fail-Closed-Prinzip fehl: Wenn Doctor einen veralteten Eigentümer meldet, stellen Sie sicher, dass kein älterer OpenClaw-Prozess ausgeführt wird, entfernen Sie dieses Sidecar und führen Sie Doctor erneut aus.

## Compaction der gemeinsamen Zustands-SQLite-Datenbank

Informationen zur Schemaversionierung, zu Integritätsprüfungen und zur Wiederherstellung nach einem Downgrade finden Sie unter [Datenbankschemas](/de/reference/database-schemas).

`openclaw doctor --state-sqlite compact` ist eine explizite Offline-Wartung für
die kanonische gemeinsame Zustandsdatenbank unter
`<state-dir>/state/openclaw.sqlite`. Es akzeptiert keinen beliebigen Datenbankpfad,
wird niemals durch den normalen Gateway-Betrieb aufgerufen und ist kein Bestandteil von
`openclaw doctor --fix`. Der Befehl erwirbt dieselbe Zustandseigentümersperre wie
der Gateway-Start und hält sie während der Validierung, der Checkpoint-Erstellung, `VACUUM` und
der abschließenden Integritätsprüfungen. Die Ausführung wird verweigert, solange ein Gateway oder ein anderer
SQLite-Wartungsbefehl diese Sperre besitzt. Die Zustandssperre bleibt aktiv, wenn
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` den Gateway-Singleton pro Konfiguration überspringt, sodass eine
Betreiber-Shell nicht die Umgebung des Gateway-Dienstes übernehmen muss, damit
die Wartung ihn erkennt.

Stoppen Sie zuerst das Gateway und erstellen Sie eine verifizierte Sicherung:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Der Befehl:

1. Erfordert eine reguläre Datei am kanonischen Pfad des gemeinsamen Zustands. Eine fehlende
   Datenbank wird als `skipped` gemeldet und der Befehl wird erfolgreich beendet.
2. Validiert die derzeit unterstützte Schemaversion und
   `schema_meta.role = "global"`, bevor ein Checkpoint erstellt oder die Datei geändert wird.
3. Erfordert ein nicht ausgelastetes `wal_checkpoint(TRUNCATE)`. Stoppen Sie alle verbleibenden OpenClaw-
   Prozesse und versuchen Sie es erneut, wenn der Checkpoint ausgelastet ist.
4. Setzt `auto_vacuum` auf `INCREMENTAL`, führt ein vollständiges `VACUUM` aus und erstellt
   erneut einen Checkpoint.
5. Führt `quick_check`, `integrity_check` und `foreign_key_check` aus und
   wendet anschließend erneut Berechtigungen ausschließlich für den Eigentümer auf die Datenbank und die SQLite-Sidecar-Dateien an.

Die JSON-Ausgabe meldet die Größen der Datenbank und des WAL, Freelist-Seiten, die Seitengröße und
den `auto_vacuum`-Wert vor und nach der Compaction sowie die zurückgewonnenen Bytes und die
Ergebnisse von `quick_check` und `integrity_check`. `foreign_key_check` wird nach dem
Fail-Closed-Prinzip erzwungen und besitzt kein separates Erfolgsfeld. SQLite meldet `auto_vacuum` als
`0` für „keine“, `1` für „vollständig“ und `2` für „inkrementell“.

Die Compaction schlägt ohne Mutation fehl, wenn das Schema veraltet oder neuer als der
ausgeführte OpenClaw-Build ist oder zu einer Agentendatenbank gehört. Führen Sie bei einem
älteren Schema des gemeinsamen Zustands zuerst `openclaw doctor --fix` aus. Stellen Sie bei einem
neueren Schema eine kompatible Sicherung wieder her oder aktualisieren Sie OpenClaw.

## Migration der Sitzungs-SQLite-Datenbank

OpenClaw importiert Legacy-Sitzungszeilen und den Transkriptverlauf automatisch beim Gateway-Start und während
`openclaw doctor --fix` in die SQLite-Datenbank jedes Agenten. `openclaw doctor --session-sqlite <mode>` ist das
gezielte Inspektions- und Validierungswerkzeug für diese Migration. Aktuelle Laufzeit-
Sitzungszeilen befinden sich in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Legacy-
`sessions.json`-Dateien sind Migrationsquellen. Aktive Transkript-JSONL-Dateien werden
nach erfolgreichem Import importiert und aus dem aktiven Sitzungsverzeichnis archiviert;
JSONL-Dateien der Archivstufe bleiben Support-Artefakte und dienen nicht als Laufzeit-
Fallbacks.

Modi:

| Modus      | Verhalten                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Liest Legacy- und SQLite-Anzahlen sowie nicht referenzierte JSONL-Dateien, ohne zu importieren.                         |
| `dry-run`  | Analysiert Legacy-Einträge und Transkript-JSONL-Dateien, zählt importierbare Zeilen und meldet Probleme, ohne SQLite-Zeilen zu schreiben. |
| `import`   | Importiert Legacy-Einträge und Transkriptereignisse für die ausgewählten Ziele in SQLite.                             |
| `validate` | Vergleicht die ausgewählten Legacy-Quellen mit SQLite-Zeilen und der Anzahl der Transkriptereignisse.                   |
| `compact`  | Erstellt Checkpoints und führt VACUUM für ausgewählte Agenten-SQLite-Datenbanken aus, um nach umfangreichen Löschungen oder Archivbereinigungen freie Seiten zurückzugewinnen. |
| `recover`  | Stellt den letzten fehlgeschlagenen Migrationslauf wieder her, validiert dessen Ziele und bereitet einen bereinigten GitHub-Issue-Bericht vor. |
| `restore`  | Stellt archivierte Transkriptartefakte aus aufgezeichneten Migrationsmanifesten wieder her, ohne SQLite-Daten zu löschen. |

Selektoren:

- Standard: der konfigurierte Standardspeicher des Agenten, sofern diese Legacy-Speicherdatei vorhanden ist.
- `--session-sqlite-agent <id>`: ein konfigurierter Agent.
- `--session-sqlite-all-agents`: konfigurierte Agentenspeicher sowie erkannte Agentenspeicher.
- `--session-sqlite-store <path>`: ein expliziter Legacy-Pfad `sessions.json`.

Manuelle Inspektionssequenz:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Sichern Sie das OpenClaw-Zustandsverzeichnis, bevor Sie `import` auf einer Installation mit
wichtigem Verlauf ausführen. `validate` wird mit einem Exit-Code ungleich null beendet, wenn ein ausgewählter Legacy-Eintrag
in SQLite fehlt, eine Sitzungs-ID abweicht oder die Anzahl der Transkriptereignisse abweicht.
Prüfen Sie bei Verwendung von `--session-sqlite-store <path>`, ob der Bericht die
erwartete Zielanzahl enthält; ein nicht vorhandener expliziter Speicherpfad wählt keine Ziele aus.

SQLite-Löschvorgänge geben zunächst Seiten innerhalb der Datenbank frei; sie verkleinern die
Datenbankdatei nicht unbedingt sofort. Führen Sie nach dem Löschen oder Archivieren großer
Transkripte `openclaw doctor --session-sqlite compact --session-sqlite-all-agents` aus,
um Checkpoints für WAL-Dateien zu erstellen, `VACUUM` auszuführen und die Größen von Datenbank und WAL
vorher und nachher zu melden. Die Compaction erfordert eine reguläre Datei mit dem aktuellen Agentenschema, den
dauerhaften Eigentümermetadaten des ausgewählten Agenten und ohne geöffnetes Handle im Doctor-
Prozess. Die destruktiven Modi `import`, `compact`, `recover` und `restore`
halten während ihrer gesamten Ausführung dieselbe Zustandseigentümersperre wie der Gateway-Start;
`inspect`, `dry-run` und `validate` bleiben schreibgeschützt und erwerben sie nicht. Stoppen Sie
zuerst das Gateway. Destruktive Modi schlagen fehl, statt mit aktiven Schreibvorgängen oder
einem anderen Wartungsbefehl zu konkurrieren. Ein destruktives `--session-sqlite-store`-
Ziel muss sich innerhalb des aktiven Zustandsverzeichnisses befinden; setzen Sie `OPENCLAW_STATE_DIR` auf
das für den Speicher zuständige Zustandsverzeichnis, bevor Sie eine andere Installation warten.
Vorhandene Ziele mit Hardlinks werden abgelehnt, da ein anderer Pfad denselben
Datenbank-Inode außerhalb des gesperrten Zustandsverzeichnisses gemeinsam verwenden kann. Dieselben Eigentumsprüfungen
gelten für SQLite-WAL-, Shared-Memory- und Rollback-Journal-Sidecars.

Jeder Import schreibt ein Manifest unter
`~/.openclaw/session-sqlite-migration-runs/`, bevor Transkriptartefakte
in das Archiv verschoben werden. Wenn der Start eine fehlgeschlagene Sitzungs-SQLite-Migration meldet, nachdem
Artefakte verschoben wurden, führen Sie die Wiederherstellung aus:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Die Wiederherstellung wählt das neueste Manifest einer fehlgeschlagenen Migration aus, stellt nur die
archivierten Artefakte des Manifests wieder her, validiert die betroffenen Ziele, aktualisiert die
bereinigten Berichte `.failure.md` und `.failure.json` und bereitet den Text für ein GitHub-Issue
vor, der keine Transkriptinhalte, unverarbeiteten Umgebungsdaten, Secrets oder unbegrenzte
Konfiguration enthält. Wenn kein Manifest einer fehlgeschlagenen Migration vorhanden ist, aber eine ausgewählte SQLite-
Datenbank eines Agenten beschädigt oder keine Datenbank ist oder Journal-Sidecars ohne eine Haupt-
datenbank enthält, kopiert die Wiederherstellung den vollständigen Dateisatz in ein temporäres Untersuchungs-
verzeichnis. SQLite kann ein gültiges Hot Journal in dieser temporären Kopie zurücksetzen,
bevor `quick_check`, `integrity_check` und `foreign_key_check` ausgeführt werden, während die
ursprünglichen forensischen Dateien unverändert bleiben. Fehlgeschlagene Integritätsprüfungen oder verwaiste
Sidecars bewahren die DB-, WAL-, SHM- und Rollback-Journal-Dateien auf, indem sie den
gesamten ermittelten Satz mit einem einzigen Suffix `.corrupt-<timestamp>` umbenennen. Bei einem abgefangenen Fehler beim
Umbenennen werden bereits verschobene Dateien zurückverschoben, bevor der Fehler gemeldet wird, sodass ein
wiederherstellbarer Dateisatz nicht unbemerkt aufgeteilt wird. Stoppen Sie den Gateway vor der Wiederherstellung;
das Kopieren oder Umbenennen eines sich aktiv ändernden SQLite-Dateisatzes ist unsicher und verhält sich
je nach Betriebssystem unterschiedlich. Mit `--github-issue --yes` verwendet doctor die
GitHub CLI, um das Issue in `openclaw/openclaw` zu erstellen; ohne Bestätigung
schreibt es den lokalen Supportbericht und gibt eine vorausgefüllte Issue-URL aus.

`restore` bleibt die Undo-Operation auf niedrigerer Ebene. Sie verwendet die
`sourcePath -> archivePath`-Datensätze des Manifests, verschiebt archivierte Artefakte nur dann zurück, wenn der
ursprüngliche Pfad fehlt, meldet Konflikte, wenn beide Pfade vorhanden sind, und belässt
die SQLite-Datenbank an ihrem Platz.

### Downgrade nach der Session-SQLite-Migration

Bevor Sie eine ältere dateibasierte OpenClaw-Version starten, stellen Sie die archivierten
Legacy-Transkriptartefakte wieder her:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Ältere Versionen lesen `sessions.json`-Einträge und die in diesen Einträgen erfassten
`sessionFile`-Pfade. Nach der SQLite-Migration verschieben erfolgreiche Importe aktive JSONL-
Transkripte nach `session-sqlite-import-archive/`, sodass die ältere Runtime
diesen Verlauf erst sehen kann, nachdem die Wiederherstellung diese im Manifest erfassten Artefakte an ihre
ursprünglichen Pfade zurückverschoben hat.

Die Wiederherstellung löscht keine SQLite-Daten. Sessions, die nach der Umstellung auf SQLite erstellt wurden,
existieren nur in SQLite und werden in der älteren Runtime nicht angezeigt. Wenn Sie später
erneut ein Upgrade durchführen, führen Sie die oben beschriebene normale Sequenz zur Migrationsvalidierung aus, damit OpenClaw
die wiederhergestellten Legacy-Artefakte vor dem Import mit den SQLite-Zeilen vergleichen kann.

## Hinweise

- Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) funktionieren schreibgeschützte Doctor-Prüfungen weiterhin, aber `doctor --fix`, `doctor --repair`, `doctor --yes` und `doctor --generate-gateway-token` sind deaktiviert, weil `openclaw.json` unveränderlich ist. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation; verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
- Interaktive Eingabeaufforderungen (Schlüsselbund-/OAuth-Korrekturen usw.) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Ausführungen ohne Terminal (Cron, Telegram, kein Terminal) überspringen die Eingabeaufforderungen.
- Nicht interaktive Ausführungen von `doctor` überspringen das vorzeitige Laden von Plugins, damit Statusprüfungen ohne Terminal schnell bleiben. Interaktive Sitzungen laden weiterhin die Plugin-Oberflächen, die für den Legacy-Status-/Reparaturablauf erforderlich sind.
- `--lint` ist strenger als `--non-interactive`: immer schreibgeschützt, zeigt niemals Eingabeaufforderungen an und wendet niemals sichere Migrationen an. Verwenden Sie `doctor --fix` oder `doctor --repair`, wenn Doctor Änderungen vornehmen soll.
- Doctor führt beim standardmäßigen Prüfen von Secrets keine `exec`-SecretRefs aus. Verwenden Sie `--allow-exec` (mit oder ohne `--lint`) nur, wenn Doctor diese konfigurierten Secret-Resolver absichtlich ausführen soll.
- Jeder Schreibvorgang an der Konfiguration (einschließlich einer `--fix`-Reparatur) rotiert eine Sicherung nach `~/.openclaw/openclaw.json.bak` (mit einem nummerierten Ring von `.bak.1` bis `.bak.4`). `--fix` entfernt außerdem unbekannte, von der Schemavalidierung gemeldete Konfigurationsschlüssel und führt jede Entfernung auf; während einer laufenden Aktualisierung wird dies übersprungen, damit ein teilweise geschriebener Upgrade-Status nicht entfernt wird, bevor dessen Migration abgeschlossen ist.
- Wenn `openclaw.json` nicht geparst und keine letzte als funktionsfähig bekannte Konfiguration wiederhergestellt werden kann, bewahrt `doctor --fix` das Original als `openclaw.json.clobbered.<timestamp>` auf, lässt die aktuelle Datei unverändert und wird mit einem Fehler beendet, statt einen unvollständigen Ersatz zu schreiben.
- Setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn ein anderer Supervisor den Gateway-Lebenszyklus verwaltet. Doctor meldet weiterhin den Zustand von Gateway und Dienst und wendet Reparaturen an, die keine Dienste betreffen, überspringt jedoch Installation, Start, Neustart und Bootstrap des Dienstes sowie die Bereinigung von Legacy-Diensten.
- Doctor meldet das angewendete Heap-Limit des verwalteten Gateways und die adaptive Herleitung, die für das aktuelle Speicherlimit des Hosts oder Containers verwendet wird. Verwenden Sie `openclaw gateway status`, um denselben Bericht außerhalb eines Reparaturdurchlaufs abzurufen.
- Unter Linux ignoriert Doctor inaktive zusätzliche Gateway-ähnliche systemd-Units und schreibt während der Reparatur die Befehls-/Entrypoint-Metadaten eines laufenden systemd-Gateway-Dienstes nicht neu. Beenden Sie zuerst den Dienst oder verwenden Sie `openclaw gateway install --force`, um den aktiven Launcher zu ersetzen.
- `doctor --fix --non-interactive` meldet fehlende oder veraltete Gateway-Dienstdefinitionen, installiert oder überschreibt sie jedoch außerhalb des Aktualisierungsreparaturmodus nicht. Führen Sie bei einem fehlenden Dienst `openclaw gateway install` oder zum Ersetzen des Launchers `openclaw gateway install --force` aus.
- Integritätsprüfungen des Status erkennen verwaiste Transkriptdateien im Sitzungsverzeichnis. Für ihre Archivierung als `.deleted.<timestamp>` ist eine interaktive Bestätigung erforderlich; `--fix`, `--yes` und Ausführungen ohne Terminal belassen sie an ihrem Speicherort.
- Doctor durchsucht `~/.openclaw/cron/jobs.json` (oder `cron.store`) nach Legacy-Formaten von Cron-Aufträgen und schreibt sie um, bevor kanonische Zeilen in SQLite importiert werden.
- Doctor meldet Cron-Aufträge mit einer expliziten `payload.model`-Überschreibung, einschließlich der Anzahl pro Provider-Namespace und Abweichungen von `agents.defaults.model`, damit geplante Aufträge, die das Standardmodell nicht übernehmen, bei Untersuchungen zu Authentifizierung oder Abrechnung sichtbar sind.
- Doctor meldet Cron-Aufträge, die weiterhin als in Bearbeitung (`state.runningAtMs`) markiert sind, wodurch `openclaw cron list` sie als `running` anzeigen kann. Diese Prüfung ist schreibgeschützt: Wenn derzeit kein Gateway einen markierten Auftrag ausführt, zeichnet der nächste Start des Cron-Dienstes die unterbrochene Ausführung auf und entfernt die Markierung.
- Unter Linux warnt Doctor, wenn die Crontab des Benutzers weiterhin das nicht mehr gepflegte Legacy-Programm `~/.openclaw/bin/ensure-whatsapp.sh` ausführt, das `Gateway inactive` falsch melden kann, wenn Cron die Umgebung des systemd-Benutzerbusses fehlt.
- Wenn WhatsApp aktiviert ist, prüft Doctor, ob eine beeinträchtigte Gateway-Ereignisschleife vorliegt, während lokale `openclaw-tui`-Clients noch ausgeführt werden. `doctor --fix` beendet nur verifizierte lokale TUI-Clients, damit WhatsApp-Antworten nicht hinter veralteten TUI-Aktualisierungsschleifen eingereiht werden.
- Wenn HTTP(S)-Proxy-Umgebungsvariablen vorhanden sind, aber `tools.web.fetch.useTrustedEnvProxy` deaktiviert ist, erläutert Doctor, dass `web_fetch` weiterhin direktes Routing verwendet, führt eine kurze direkte TLS-Verbindungsprüfung aus und nennt die explizite Opt-in-Option. Proxy-Vertrauen wird niemals automatisch aktiviert.
- Doctor schreibt Legacy-Modellreferenzen von `codex/*` und `openai-codex/*` in kanonische `openai/*`-Referenzen um – für primäre Modelle, Fallbacks, Modell-Zulassungslisten, Modelle zur Bild-/Videogenerierung, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalmodellüberschreibungen, Cron-Nutzlasten sowie veraltete Routenbindungen von Sitzungen und Transkripten. `--fix` führt außerdem Legacy-Konfigurationen von `models.providers.codex` und `models.providers.openai-codex` zusammen, sofern dies sicher ist, migriert Legacy-Authentifizierungsprofile von `openai-codex:*` und `auth.order.openai-codex`-Einträge zu `openai:*`, verschiebt die Codex-Absicht in Provider-/modellbezogene `agentRuntime.id: "codex"`-Einträge, entfernt veraltete Laufzeitbindungen für ganze Agenten und Sitzungen und belässt reparierte OpenAI-Agentenreferenzen beim Codex-Authentifizierungsrouting statt bei der direkten Authentifizierung mit einem OpenAI-API-Schlüssel.
- Doctor meldet nicht leere `auth.order.<provider>`-Listen, deren referenzierte Profile sämtlich nicht mehr vorhanden sind, obwohl kompatible gespeicherte Anmeldedaten existieren. `doctor --fix` löscht nur diese veralteten Überschreibungen und stellt dadurch die automatische Auswahl der Anmeldedaten pro Agent wieder her; explizit leere Reihenfolgen, teilweise gültige Listen und Reihenfolgen ohne kompatible gespeicherte Anmeldedaten bleiben unverändert. Wenn ein aktiver SQLite-Authentifizierungsspeicher nicht lesbar oder fehlerhaft formatiert ist, erläutert Doctor, warum diese Reparatur übersprungen wurde. Starten Sie ein laufendes Gateway neu, bevor Sie den Authentifizierungsstatus erneut prüfen, wenn dessen Konfigurations-Neulademodus den Schreibvorgang nicht automatisch übernimmt.
- Doctor bereinigt den Legacy-Bereitstellungsstatus von Plugin-Abhängigkeiten aus älteren OpenClaw-Versionen und verknüpft das `openclaw`-Paket des Hosts für verwaltete npm-Plugins neu, die es als Peer-Abhängigkeit deklarieren. Außerdem repariert Doctor fehlende herunterladbare Plugins, auf die die Konfiguration verweist (`plugins.entries`, konfigurierte Kanäle, konfigurierte Provider-/Sucheinstellungen, konfigurierte Agentenlaufzeiten). Während Paketaktualisierungen überspringt Doctor die Plugin-Reparatur durch den Paketmanager, bis der Paketaustausch abgeschlossen ist; führen Sie anschließend `openclaw doctor --fix` erneut aus, wenn ein konfiguriertes Plugin weiterhin wiederhergestellt werden muss. Wenn ein Download fehlschlägt, meldet Doctor den Installationsfehler und behält den konfigurierten Plugin-Eintrag für den nächsten Reparaturversuch bei.
- Doctor repariert veraltete Plugin-Konfigurationen, indem fehlende Plugin-IDs aus `plugins.allow`/`plugins.deny`/`plugins.entries` sowie zugehörige verwaiste Kanalkonfigurationen, Heartbeat-Ziele und Kanalmodellüberschreibungen entfernt werden, sofern die Plugin-Erkennung ordnungsgemäß funktioniert.
- Doctor stellt ungültige Plugin-Konfigurationen unter Quarantäne, indem der betroffene `plugins.entries.<id>`-Eintrag deaktiviert und dessen ungültige `config`-Nutzlast entfernt wird. Beim Start des Gateways wird bereits nur dieses fehlerhafte Plugin übersprungen, sodass andere Plugins und Kanäle weiterlaufen.
- Doctor entfernt das außer Betrieb genommene `plugins.entries.codex.config.codexDynamicToolsProfile`; der Codex-App-Server belässt Codex-native Workspace-Tools stets nativ.
- Doctor migriert automatisch flache Legacy-Talk-Konfigurationen (`talk.voiceId`, `talk.modelId` und weitere) zu `talk.provider` + `talk.providers.<provider>`. Wiederholte Ausführungen von `doctor --fix` melden oder übernehmen die Talk-Normalisierung nicht mehr, wenn der einzige Unterschied in der Reihenfolge der Objektschlüssel besteht.
- Doctor umfasst eine Bereitschaftsprüfung für die Speichersuche und kann `openclaw configure --section model` empfehlen, wenn Embedding-Anmeldedaten fehlen.
- Doctor warnt, wenn kein Befehlseigentümer konfiguriert ist. Der Befehlseigentümer ist das menschliche Operatorkonto, das ausschließlich Eigentümern vorbehaltene Befehle ausführen und gefährliche Aktionen genehmigen darf. Durch die DM-Kopplung kann lediglich jemand mit dem Bot kommunizieren; wenn Sie einen Absender genehmigt haben, bevor der Bootstrap für den ersten Eigentümer verfügbar war, setzen Sie `commands.ownerAllowFrom` ausdrücklich.
- Doctor meldet einen Informationshinweis, wenn Agenten im Codex-Modus konfiguriert sind und im Codex-Basisverzeichnis des Operators persönliche Codex-CLI-Ressourcen vorhanden sind. Lokale Starts des Codex-App-Servers verwenden isolierte Basisverzeichnisse pro Agent; installieren Sie bei Bedarf zuerst das Codex-Plugin und verwenden Sie dann `openclaw migrate plan codex`, um Ressourcen zu erfassen, die gezielt übernommen werden sollen.
- Doctor warnt, wenn Skills, die für den Standardagenten zulässig sind, in der aktuellen Laufzeitumgebung nicht verfügbar sind (fehlende Binärdateien, Umgebungsvariablen, Konfigurationen oder Betriebssystemanforderungen). `doctor --fix` kann diese nicht verfügbaren Skills mit `skills.entries.<skill>.enabled=false` deaktivieren; installieren oder konfigurieren Sie stattdessen die fehlende Voraussetzung, wenn der Skill aktiv bleiben soll.
- Wenn der Sandbox-Modus aktiviert, Docker jedoch nicht verfügbar ist, meldet Doctor eine aussagekräftige Warnung mit Abhilfemaßnahmen (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn Legacy-Dateien oder Shard-Verzeichnisse der Sandbox-Registry vorhanden sind (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` oder `~/.openclaw/sandbox/browsers/`), meldet Doctor sie; `--fix` migriert gültige Einträge nach SQLite und stellt ungültige Legacy-Dateien unter Quarantäne.
- Wenn `gateway.auth.token`/`gateway.auth.password` durch SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, gibt Doctor eine schreibgeschützte Warnung aus und schreibt keine Klartext-Fallback-Anmeldedaten. Bei Exec-basierten SecretRefs überspringt Doctor die Ausführung, sofern `--allow-exec` nicht vorhanden ist.
- Wenn die Prüfung einer Kanal-SecretRef in einem Reparaturpfad fehlschlägt, fährt Doctor fort und meldet eine Warnung, statt vorzeitig beendet zu werden.
- Nach Migrationen des Statusverzeichnisses warnt Doctor, wenn aktivierte Telegram- oder Discord-Standardkonten von einem Umgebungs-Fallback abhängen und `TELEGRAM_BOT_TOKEN` oder `DISCORD_BOT_TOKEN` für den Doctor-Prozess nicht verfügbar ist.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert im aktuellen Befehlspfad ein auflösbares Telegram-Token. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung für diesen Durchlauf.

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
- [Gateway-Doctor](/de/gateway/doctor)
