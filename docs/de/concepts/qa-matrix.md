---
read_when:
    - pnpm openclaw qa matrix lokal ausführen
    - Matrix-QA-Szenarien hinzufügen oder auswählen
    - Triage von Matrix-QA-Fehlern, Timeouts oder hängender Bereinigung
summary: 'Referenz für Maintainer für die Docker-gestützte Matrix-Echtzeit-QA-Prüfstrecke: CLI, Profile, Umgebungsvariablen, Szenarien und Ausgabeartefakte.'
title: Matrix-Qualitätssicherung
x-i18n:
    generated_at: "2026-05-06T06:45:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Die Matrix-QA-Lane führt das gebündelte `@openclaw/matrix`-Plugin gegen einen temporären Tuwunel-Homeserver in Docker aus, mit temporären Driver-, SUT- und Observer-Konten sowie vorbefüllten Räumen. Sie ist die Live-Abdeckung mit realem Transport für Matrix.

Dies ist Tooling nur für Maintainer. Paketierte OpenClaw-Releases lassen `qa-lab` absichtlich aus, daher ist `openclaw qa` nur aus einem Source-Checkout verfügbar. Source-Checkouts laden den gebündelten Runner direkt - es ist kein Schritt zur Plugin-Installation erforderlich.

Weiteren Kontext zum umfassenderen QA-Framework finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

## Schnellstart

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Ein einfaches `pnpm openclaw qa matrix` führt `--profile all` aus und stoppt nicht beim ersten Fehler. Verwenden Sie `--profile fast --fail-fast` für ein Release-Gate; teilen Sie den Katalog mit `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` in Shards auf, wenn Sie das vollständige Inventar parallel ausführen.

## Was die Lane ausführt

1. Stellt einen temporären Tuwunel-Homeserver in Docker bereit (Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`, Port `28008`).
2. Registriert drei temporäre Benutzer - `driver` (sendet eingehenden Traffic), `sut` (das zu testende OpenClaw-Matrix-Konto), `observer` (Traffic-Erfassung durch Dritte).
3. Befüllt Räume, die von den ausgewählten Szenarien benötigt werden (Hauptraum, Threading, Medien, Neustart, sekundärer Raum, Allowlist, E2EE, Verifizierungs-DM usw.).
4. Startet ein untergeordnetes OpenClaw-Gateway mit dem echten Matrix-Plugin, das auf das SUT-Konto beschränkt ist; `qa-channel` wird im untergeordneten Prozess nicht geladen.
5. Führt Szenarien nacheinander aus und beobachtet Ereignisse über die Driver-/Observer-Matrix-Clients.
6. Fährt den Homeserver herunter, schreibt Berichts- und Zusammenfassungsartefakte und beendet sich dann.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Häufige Flags

| Flag                  | Standard                                      | Beschreibung                                                                                                                                    |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Szenarioprofil. Siehe [Profile](#profiles).                                                                                                      |
| `--fail-fast`         | aus                                           | Nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario stoppen.                                                       |
| `--scenario <id>`     | -                                             | Nur dieses Szenario ausführen. Wiederholbar. Siehe [Szenarien](#scenarios).                                                                      |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Zielort für Berichte, Zusammenfassung, beobachtete Ereignisse und das Ausgabelog. Relative Pfade werden relativ zu `--repo-root` aufgelöst.      |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-Root beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                                              |
| `--sut-account <id>`  | `sut`                                         | Matrix-Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                          |

### Provider-Flags

Die Lane verwendet einen echten Matrix-Transport, aber der Modell-Provider ist konfigurierbar:

| Flag                     | Standard         | Beschreibung                                                                                                                                                                |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` für deterministisches Mock-Dispatching oder `live-frontier` für Live-Frontier-Provider. Der Legacy-Alias `live-openai` funktioniert weiterhin.                |
| `--model <ref>`          | Provider-Standard | Primäre `provider/model`-Referenz.                                                                                                                                          |
| `--alt-model <ref>`      | Provider-Standard | Alternative `provider/model`-Referenz, wenn Szenarien während der Ausführung wechseln.                                                                                       |
| `--fast`                 | aus              | Provider-Fast-Modus aktivieren, sofern unterstützt.                                                                                                                         |

Matrix-QA akzeptiert weder `--credential-source` noch `--credential-role`. Die Lane stellt lokal temporäre Benutzer bereit; es gibt keinen gemeinsamen Credential-Pool, gegen den geleast werden könnte.

## Profile

Das ausgewählte Profil bestimmt, welche Szenarien ausgeführt werden.

| Profil          | Verwenden Sie es für                                                                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (Standard) | Vollständiger Katalog. Langsam, aber umfassend.                                                                                                                                                                                                                |
| `fast`          | Release-Gate-Teilmenge, die den Live-Transportvertrag prüft: Canary, Mention-Gating, Allowlist-Block, Antwortform, Wiederaufnahme nach Neustart, Thread-Follow-up, Thread-Isolation, Reaktionsbeobachtung und Zustellung von Exec-Approval-Metadaten.        |
| `transport`     | Threading-, DM-, Raum-, Autojoin-, Mention-/Allowlist-, Approval- und Reaktionsszenarien auf Transportebene.                                                                                                                                                  |
| `media`         | Abdeckung für Bild-, Audio-, Video-, PDF- und EPUB-Anhänge.                                                                                                                                                                                                    |
| `e2ee-smoke`    | Minimale E2EE-Abdeckung - einfache verschlüsselte Antwort, Thread-Follow-up, erfolgreicher Bootstrap.                                                                                                                                                         |
| `e2ee-deep`     | Umfassende E2EE-Szenarien für Zustandsverlust, Backup, Schlüssel und Wiederherstellung.                                                                                                                                                                       |
| `e2ee-cli`      | `openclaw matrix encryption setup`- und `verify *`-CLI-Szenarien, die über den QA-Harness gesteuert werden.                                                                                                                                                   |

Die genaue Zuordnung befindet sich in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Szenarien

Die vollständige Liste der Szenario-IDs ist die `MatrixQaScenarioId`-Union in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorien umfassen:

- Threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- Top-Level / DM / Raum - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- Streaming und Tool-Fortschritt - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- Medien - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- Routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- Reaktionen - `matrix-reaction-*`
- Approvals - `matrix-approval-*` (Exec-/Plugin-Metadaten, Chunked-Fallback, Deny-Reaktionen, Threads und `target: "both"`-Routing)
- Neustart und Replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- Mention-Gating, Bot-zu-Bot und Allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (einfache Antwort, Thread-Follow-up, Bootstrap, Lebenszyklus von Wiederherstellungsschlüsseln, Zustandsverlustvarianten, Server-Backup-Verhalten, Gerätehygiene, SAS-/QR-/DM-Verifizierung, Neustart, Artefakt-Redaktion)
- E2EE-CLI - `matrix-e2ee-cli-*` (Encryption-Setup, idempotentes Setup, Bootstrap-Fehler, Lebenszyklus von Wiederherstellungsschlüsseln, Multi-Account, Gateway-Reply-Roundtrip, Selbstverifizierung)

Übergeben Sie `--scenario <id>` (wiederholbar), um eine manuell ausgewählte Gruppe auszuführen; kombinieren Sie dies mit `--profile all`, um Profil-Gating zu ignorieren.

## Umgebungsvariablen

| Variable                                | Standardwert                              | Auswirkung                                                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 Min.)                       | Harte Obergrenze für den gesamten Lauf.                                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Begrenzung für die anfängliche Canary-Antwort. Die Release-CI erhöht diesen Wert auf gemeinsam genutzten Runnern, damit ein langsamer erster Gateway-Durchlauf nicht fehlschlägt, bevor die Szenarioabdeckung startet. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ruhefenster für negative No-Reply-Assertions. Wird auf `≤` das Lauf-Timeout begrenzt.                                                                                                                                  |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Begrenzung für den Docker-Abbau. Fehlerausgaben enthalten den Wiederherstellungsbefehl `docker compose ... down --remove-orphans`.                                                                                     |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Überschreibt das Homeserver-Image bei der Validierung mit einer anderen Tuwunel-Version.                                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ein                                       | `0` unterdrückt `[matrix-qa] ...`-Fortschrittszeilen auf stderr. `1` erzwingt sie.                                                                                                                                     |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geschwärzt                                | `1` behält Nachrichtentext und `formatted_body` in `matrix-qa-observed-events.json` bei. Standardmäßig wird geschwärzt, um CI-Artefakte sicher zu halten.                                                             |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | aus                                       | `1` überspringt das deterministische `process.exit` nach dem Schreiben der Artefakte. Standardmäßig wird das Beenden erzwungen, weil native Crypto-Handles von matrix-js-sdk die Event Loop über den Artefaktabschluss hinaus am Leben halten können. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nicht gesetzt                             | Wenn von einem äußeren Launcher (z. B. `scripts/run-node.mjs`) gesetzt, verwendet Matrix QA diesen Logpfad wieder, anstatt ein eigenes Tee zu starten.                                                                 |

## Ausgabeartefakte

Werden nach `--output-dir` geschrieben:

- `matrix-qa-report.md` - Markdown-Protokollbericht (was bestanden hat, fehlgeschlagen ist, übersprungen wurde und warum).
- `matrix-qa-summary.json` - Strukturierte Zusammenfassung, die für CI-Parsing und Dashboards geeignet ist.
- `matrix-qa-observed-events.json` - Beobachtete Matrix-Ereignisse von den Treiber- und Beobachter-Clients. Inhalte werden geschwärzt, außer `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; Genehmigungsmetadaten werden mit ausgewählten sicheren Feldern und gekürzter Befehlsvorschau zusammengefasst.
- `matrix-qa-output.log` - Kombinierte stdout/stderr-Ausgabe des Laufs. Wenn `OPENCLAW_RUN_NODE_OUTPUT_LOG` gesetzt ist, wird stattdessen das Log des äußeren Launchers wiederverwendet.

Das Standard-Ausgabeverzeichnis ist `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, damit aufeinanderfolgende Läufe einander nicht überschreiben.

## Triagetipps

- **Lauf hängt gegen Ende:** Native Crypto-Handles von `matrix-js-sdk` können länger leben als der Harness. Standardmäßig wird nach dem Schreiben der Artefakte ein sauberes `process.exit` erzwungen; wenn Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` deaktiviert haben, rechnen Sie damit, dass der Prozess weiterläuft.
- **Bereinigungsfehler:** Suchen Sie nach dem ausgegebenen Wiederherstellungsbefehl (einem Aufruf von `docker compose ... down --remove-orphans`) und führen Sie ihn manuell aus, um den Homeserver-Port freizugeben.
- **Instabile Fenster für negative Assertions in CI:** Senken Sie `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (Standard 8 s), wenn CI schnell ist; erhöhen Sie den Wert auf langsamen gemeinsam genutzten Runnern.
- **Sie benötigen geschwärzte Inhalte für einen Fehlerbericht:** Führen Sie den Lauf mit `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` erneut aus und hängen Sie `matrix-qa-observed-events.json` an. Behandeln Sie das resultierende Artefakt als sensibel.
- **Andere Tuwunel-Version:** Setzen Sie `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` auf die zu testende Version. Die Lane prüft nur das angeheftete Standard-Image ein.

## Live-Transportvertrag

Matrix ist eine von drei Live-Transport-Lanes (Matrix, Telegram, Discord), die eine einzelne Vertragscheckliste gemeinsam nutzen, die unter [QA-Überblick → Live-Transportabdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage) definiert ist. `qa-channel` bleibt die breite synthetische Suite und ist absichtlich nicht Teil dieser Matrix.

## Verwandte Themen

- [QA-Überblick](/de/concepts/qa-e2e-automation) - gesamter QA-Stack und Live-Transportvertrag
- [QA-Kanal](/de/channels/qa-channel) - synthetischer Kanaladapter für repo-gestützte Szenarien
- [Testen](/de/help/testing) - Tests ausführen und QA-Abdeckung hinzufügen
- [Matrix](/de/channels/matrix) - das getestete Kanal-Plugin
