---
read_when:
    - pnpm openclaw qa matrix lokal ausführen
    - Matrix-QA-Szenarien hinzufügen oder auswählen
    - Triage von Matrix-QA-Fehlern, Timeouts oder festhängenden Bereinigungsvorgängen
summary: 'Maintainer-Referenz für die Docker-gestützte Matrix-Live-QA-Lane: CLI, Profile, Umgebungsvariablen, Szenarien und Ausgabeartefakte.'
title: Matrix-Qualitätssicherung
x-i18n:
    generated_at: "2026-04-30T06:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Die Matrix-QA-Spur führt das gebündelte `@openclaw/matrix`-Plugin gegen einen kurzlebigen Tuwunel-Homeserver in Docker aus, mit temporären Treiber-, SUT- und Beobachterkonten sowie vorbereiteten Räumen. Sie ist die Live-Abdeckung mit realem Transport für Matrix.

Dies ist reine Maintainer-Tooling. Paketierte OpenClaw-Releases lassen `qa-lab` absichtlich aus, daher ist `openclaw qa` nur aus einem Source-Checkout verfügbar. Source-Checkouts laden den gebündelten Runner direkt — kein Plugin-Installationsschritt ist erforderlich.

Weiteren Kontext zum umfassenderen QA-Framework finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

## Schnellstart

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Ein einfaches `pnpm openclaw qa matrix` führt `--profile all` aus und stoppt nicht beim ersten Fehler. Verwenden Sie `--profile fast --fail-fast` für ein Release-Gate; sharden Sie den Katalog mit `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, wenn Sie den vollständigen Bestand parallel ausführen.

## Was die Spur tut

1. Stellt einen kurzlebigen Tuwunel-Homeserver in Docker bereit (Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`, Port `28008`).
2. Registriert drei temporäre Benutzer — `driver` (sendet eingehenden Traffic), `sut` (das getestete OpenClaw-Matrix-Konto), `observer` (Erfassung von Drittanbieter-Traffic).
3. Bereitet Räume vor, die von den ausgewählten Szenarien benötigt werden (Haupt-, Threading-, Medien-, Neustart-, Sekundär-, Allowlist-, E2EE-, Verifizierungs-DM-Räume usw.).
4. Startet ein untergeordnetes OpenClaw-Gateway mit dem echten Matrix-Plugin, das auf das SUT-Konto beschränkt ist; `qa-channel` wird im untergeordneten Prozess nicht geladen.
5. Führt Szenarien der Reihe nach aus und beobachtet Events über die Matrix-Clients von Treiber und Beobachter.
6. Fährt den Homeserver herunter, schreibt Bericht- und Zusammenfassungsartefakte und beendet sich dann.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Häufige Optionen

| Option                | Standardwert                                  | Beschreibung                                                                                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Szenarioprofil. Siehe [Profile](#profiles).                                                                               |
| `--fail-fast`         | aus                                           | Nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario stoppen.                               |
| `--scenario <id>`     | —                                             | Nur dieses Szenario ausführen. Wiederholbar. Siehe [Szenarien](#scenarios).                                               |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Ort, an dem Berichte, Zusammenfassung, beobachtete Events und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden relativ zu `--repo-root` aufgelöst. |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-Root beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                       |
| `--sut-account <id>`  | `sut`                                         | Matrix-Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                   |

### Provider-Optionen

Die Spur verwendet einen echten Matrix-Transport, aber der Modell-Provider ist konfigurierbar:

| Option                   | Standardwert             | Beschreibung                                                                                                                                 |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`          | `mock-openai` für deterministisches Mock-Dispatching oder `live-frontier` für Live-Frontier-Provider. Der Legacy-Alias `live-openai` funktioniert weiterhin. |
| `--model <ref>`          | Provider-Standardwert    | Primäre `provider/model`-Referenz.                                                                                                           |
| `--alt-model <ref>`      | Provider-Standardwert    | Alternative `provider/model`-Referenz, wenn Szenarien während der Ausführung wechseln.                                                       |
| `--fast`                 | aus                      | Aktiviert den schnellen Provider-Modus, sofern unterstützt.                                                                                  |

Matrix QA akzeptiert weder `--credential-source` noch `--credential-role`. Die Spur stellt kurzlebige Benutzer lokal bereit; es gibt keinen gemeinsamen Credential-Pool, gegen den geleast wird.

## Profile

Das ausgewählte Profil bestimmt, welche Szenarien ausgeführt werden.

| Profil          | Verwenden für                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (Standard) | Vollständiger Katalog. Langsam, aber erschöpfend.                                                                                                                                                                                            |
| `fast`          | Release-Gate-Teilmenge, die den Live-Transportvertrag prüft: Canary, Mention-Gating, Allowlist-Block, Antwortform, Neustart-Fortsetzung, Thread-Follow-up, Thread-Isolation, Reaktionsbeobachtung und Zustellung von Exec-Genehmigungsmetadaten. |
| `transport`     | Threading-, DM-, Raum-, Autojoin-, Mention-/Allowlist-, Genehmigungs- und Reaktionsszenarien auf Transportebene.                                                                                                                              |
| `media`         | Abdeckung für Bild-, Audio-, Video-, PDF- und EPUB-Anhänge.                                                                                                                                                                                   |
| `e2ee-smoke`    | Minimale E2EE-Abdeckung — einfache verschlüsselte Antwort, Thread-Follow-up, erfolgreicher Bootstrap.                                                                                                                                          |
| `e2ee-deep`     | Erschöpfende E2EE-Szenarien zu Zustandsverlust, Backup, Schlüsseln und Wiederherstellung.                                                                                                                                                      |
| `e2ee-cli`      | `openclaw matrix encryption setup`- und `verify *`-CLI-Szenarien, die über das QA-Harness ausgeführt werden.                                                                                                                                   |

Die genaue Zuordnung befindet sich in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Szenarien

Die vollständige Liste der Szenario-IDs ist die `MatrixQaScenarioId`-Union in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorien umfassen:

- Threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- Top-Level / DM / Raum — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- Streaming und Tool-Fortschritt — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- Medien — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- Routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- Reaktionen — `matrix-reaction-*`
- Genehmigungen — `matrix-approval-*` (Exec-/Plugin-Metadaten, fragmentierter Fallback, Ablehnungsreaktionen, Threads und `target: "both"`-Routing)
- Neustart und Replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- Mention-Gating, Bot-zu-Bot und Allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (einfache Antwort, Thread-Follow-up, Bootstrap, Lebenszyklus des Wiederherstellungsschlüssels, Varianten mit Zustandsverlust, Server-Backup-Verhalten, Gerätehygiene, SAS- / QR- / DM-Verifizierung, Neustart, Artefakt-Redaktion)
- E2EE-CLI — `matrix-e2ee-cli-*` (Verschlüsselungseinrichtung, idempotente Einrichtung, Bootstrap-Fehler, Lebenszyklus des Wiederherstellungsschlüssels, mehrere Konten, Gateway-Antwort-Roundtrip, Selbstverifizierung)

Übergeben Sie `--scenario <id>` (wiederholbar), um eine manuell ausgewählte Menge auszuführen; kombinieren Sie dies mit `--profile all`, um Profile-Gating zu ignorieren.

## Umgebungsvariablen

| Variable                                | Standardwert                              | Wirkung                                                                                                                                                                                        |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 Min.)                       | Harte Obergrenze für den gesamten Lauf.                                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Grenze für die anfängliche Canary-Antwort. Release-CI erhöht dies auf gemeinsam genutzten Runnern, damit ein langsamer erster Gateway-Durchlauf nicht fehlschlägt, bevor die Szenarioabdeckung beginnt. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ruhefenster für negative Keine-Antwort-Assertions. Wird auf `≤` das Laufzeitlimit begrenzt.                                                                                                   |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Grenze für den Docker-Abbau. Fehlerausgaben enthalten den Wiederherstellungsbefehl `docker compose ... down --remove-orphans`.                                                                 |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Überschreibt das Homeserver-Image bei der Validierung gegen eine andere Tuwunel-Version.                                                                                                      |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ein                                       | `0` unterdrückt `[matrix-qa] ...`-Fortschrittszeilen auf stderr. `1` erzwingt sie.                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redigiert                                 | `1` behält Nachrichtentext und `formatted_body` in `matrix-qa-observed-events.json` bei. Standardmäßig wird redigiert, damit CI-Artefakte sicher bleiben.                                     |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | aus                                       | `1` überspringt das deterministische `process.exit` nach dem Schreiben des Artefakts. Standardmäßig wird das Beenden erzwungen, weil die nativen Crypto-Handles von matrix-js-sdk die Event-Loop nach Abschluss der Artefakte am Leben halten können. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nicht gesetzt                             | Wenn von einem äußeren Launcher gesetzt (z. B. `scripts/run-node.mjs`), verwendet Matrix QA diesen Logpfad wieder, statt ein eigenes Tee zu starten.                                          |

## Ausgabeartefakte

Geschrieben nach `--output-dir`:

- `matrix-qa-report.md` — Markdown-Protokollbericht (was bestanden hat, fehlgeschlagen ist, übersprungen wurde und warum).
- `matrix-qa-summary.json` — Strukturierte Zusammenfassung, geeignet für CI-Parsing und Dashboards.
- `matrix-qa-observed-events.json` — Beobachtete Matrix-Ereignisse von den Treiber- und Beobachter-Clients. Inhalte werden redigiert, sofern nicht `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` gesetzt ist; Genehmigungsmetadaten werden mit ausgewählten sicheren Feldern und gekürzter Befehlsvorschau zusammengefasst.
- `matrix-qa-output.log` — Kombiniertes stdout/stderr aus dem Lauf. Wenn `OPENCLAW_RUN_NODE_OUTPUT_LOG` gesetzt ist, wird stattdessen das Log des äußeren Launchers wiederverwendet.

Das Standard-Ausgabeverzeichnis ist `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, sodass aufeinanderfolgende Läufe einander nicht überschreiben.

## Triage-Tipps

- **Lauf hängt gegen Ende:** Native Crypto-Handles von `matrix-js-sdk` können den Harness überdauern. Standardmäßig wird nach dem Schreiben des Artefakts ein sauberes `process.exit` erzwungen; wenn Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` gesetzt haben, müssen Sie damit rechnen, dass der Prozess weiterläuft.
- **Bereinigungsfehler:** Suchen Sie nach dem ausgegebenen Wiederherstellungsbefehl (ein `docker compose ... down --remove-orphans`-Aufruf) und führen Sie ihn manuell aus, um den Homeserver-Port freizugeben.
- **Unzuverlässige Fenster für negative Assertions in CI:** Senken Sie `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (Standard 8 s), wenn CI schnell ist; erhöhen Sie es auf langsamen gemeinsam genutzten Runnern.
- **Redigierte Inhalte für einen Fehlerbericht erforderlich:** Führen Sie den Lauf erneut mit `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` aus und hängen Sie `matrix-qa-observed-events.json` an. Behandeln Sie das resultierende Artefakt als sensibel.
- **Andere Tuwunel-Version:** Verweisen Sie `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` auf die zu testende Version. Die Lane prüft nur das angeheftete Standard-Image ein.

## Live-Transport-Vertrag

Matrix ist eine von drei Live-Transport-Lanes (Matrix, Telegram, Discord), die eine einzelne Vertrags-Checkliste teilen, die in [QA-Übersicht → Live-Transport-Abdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage) definiert ist. `qa-channel` bleibt die breite synthetische Suite und ist absichtlich nicht Teil dieser Matrix.

## Verwandt

- [QA-Übersicht](/de/concepts/qa-e2e-automation) — gesamter QA-Stack und Live-Transport-Vertrag
- [QA Channel](/de/channels/qa-channel) — synthetischer Kanaladapter für repo-gestützte Szenarien
- [Testing](/de/help/testing) — Tests ausführen und QA-Abdeckung hinzufügen
- [Matrix](/de/channels/matrix) — das getestete Kanal-Plugin
