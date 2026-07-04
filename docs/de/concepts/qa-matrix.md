---
read_when:
    - pnpm openclaw qa matrix lokal ausführen
    - Hinzufügen oder Auswählen von Matrix-QA-Szenarien
    - Triage von Matrix-QA-Fehlern, Zeitüberschreitungen oder hängender Bereinigung
summary: 'Maintainer-Referenz für die Docker-gestützte Live-QA-Lane für Matrix: CLI, Profile, Umgebungsvariablen, Szenarien und Ausgabeartefakte.'
title: Matrix-QA
x-i18n:
    generated_at: "2026-07-04T20:29:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Die Matrix-QA-Lane führt das gebündelte Plugin `@openclaw/matrix` gegen einen kurzlebigen Tuwunel-Homeserver in Docker aus, mit temporären Driver-, SUT- und Observer-Konten sowie vorbereiteten Räumen. Sie ist die transportechte Live-Abdeckung für Matrix.

Dies ist ein reines Maintainer-Werkzeug. Paketierte OpenClaw-Releases lassen `qa-lab` absichtlich weg, daher ist `openclaw qa` nur aus einem Source-Checkout verfügbar. Source-Checkouts laden den gebündelten Runner direkt - es ist kein Plugin-Installationsschritt erforderlich.

Breiteren Kontext zum QA-Framework finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

## Schnellstart

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Ein einfaches `pnpm openclaw qa matrix` führt `--profile all` aus und stoppt nicht beim ersten Fehler. Verwenden Sie `--profile fast --fail-fast` als Release-Gate; sharden Sie den Katalog mit `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, wenn Sie den vollständigen Bestand parallel ausführen.

## Was die Lane tut

1. Stellt einen kurzlebigen Tuwunel-Homeserver in Docker bereit (Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`, Port `28008`) hinter einem begrenzten, redigierenden Request/Response-Recorder.
2. Registriert drei temporäre Benutzer - `driver` (sendet eingehenden Traffic), `sut` (das zu testende OpenClaw-Matrix-Konto), `observer` (Traffic-Erfassung durch Dritte).
3. Bereitet Räume vor, die von den ausgewählten Szenarien benötigt werden (Hauptraum, Threading, Medien, Neustart, sekundärer Raum, Allowlist, E2EE, Verifizierungs-DM usw.).
4. Führt den substratneutralen Protokoll-Probe `matrix-qa-v1` gegen die aufgezeichnete Tuwunel-Grenze aus. Unit-Tests belegen den Probe-Vertrag mit der Matrix-Protokoll-Fixture; der kanonische Host des QA-Transportadapters in [#99707](https://github.com/openclaw/openclaw/pull/99707) besitzt die echte Crabline-Zielverkabelung.
5. Startet ein untergeordnetes OpenClaw-Gateway mit dem echten Matrix-Plugin, das auf das SUT-Konto begrenzt ist; `qa-channel` wird im Kindprozess nicht geladen.
6. Führt Szenarien nacheinander aus, beobachtet Ereignisse über die Matrix-Clients von Driver/Observer und leitet Routing-/State-Erwartungen aus dem aufgezeichneten Traffic ab.
7. Fährt den Homeserver herunter, schreibt Bericht und Evidence-Artefakte und beendet sich dann.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Häufige Flags

| Flag                  | Standard                                      | Beschreibung                                                                                                                                                          |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Szenarioprofil. Siehe [Profile](#profiles).                                                                                                                           |
| `--fail-fast`         | aus                                           | Nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario stoppen.                                                                           |
| `--scenario <id>`     | -                                             | Nur dieses Szenario ausführen. Wiederholbar. Siehe [Szenarien](#scenarios).                                                                                           |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Speicherort für Berichte, Zusammenfassung, Routing-/State-Bestand, beobachtete Ereignisse und Ausgabeprotokoll. Relative Pfade werden gegen `--repo-root` aufgelöst. |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-Root beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                                                                   |
| `--sut-account <id>`  | `sut`                                         | Matrix-Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                                               |

### Provider-Flags

Die Lane verwendet einen echten Matrix-Transport, aber der Modell-Provider ist konfigurierbar:

| Flag                     | Standard         | Beschreibung                                                                                                                                       |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` für deterministisches Mock-Dispatching oder `live-frontier` für Live-Frontier-Provider. Der Legacy-Alias `live-openai` funktioniert weiterhin. |
| `--model <ref>`          | Provider-Standard | Primäre `provider/model`-Referenz.                                                                                                                 |
| `--alt-model <ref>`      | Provider-Standard | Alternative `provider/model`-Referenz, wenn Szenarien während des Laufs wechseln.                                                                  |
| `--fast`                 | aus              | Aktiviert den schnellen Provider-Modus, sofern unterstützt.                                                                                        |

Matrix-QA akzeptiert weder `--credential-source` noch `--credential-role`. Die Lane stellt kurzlebige Benutzer lokal bereit; es gibt keinen gemeinsamen Credential-Pool, gegen den geleast werden könnte.

## Profile

Das ausgewählte Profil entscheidet, welche Szenarien ausgeführt werden.

| Profil          | Verwendung                                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (Standard) | Vollständiger Katalog. Langsam, aber umfassend.                                                                                                                                                                                        |
| `fast`          | Release-Gate-Teilmenge, die den Live-Transportvertrag ausübt: Canary, Mention-Gating, Allowlist-Block, Antwortform, Neustart-Fortsetzung, Thread-Follow-up, Thread-Isolation, Reaktionsbeobachtung und Zustellung von Exec-Approval-Metadaten. |
| `transport`     | Threading auf Transportebene, DM-, Raum-, Autojoin-, Mention-/Allowlist-, Approval- und Reaktionsszenarien.                                                                                                                           |
| `media`         | Abdeckung für Bild-, Audio-, Video-, PDF- und EPUB-Anhänge.                                                                                                                                                                             |
| `e2ee-smoke`    | Minimale E2EE-Abdeckung - einfache verschlüsselte Antwort, Thread-Follow-up, erfolgreicher Bootstrap.                                                                                                                                  |
| `e2ee-deep`     | Umfassende E2EE-Szenarien für State-Verlust, Backup, Schlüssel und Wiederherstellung.                                                                                                                                                  |
| `e2ee-cli`      | CLI-Szenarien für `openclaw matrix encryption setup` und `verify *`, die durch den QA-Harness gesteuert werden.                                                                                                                        |

Die genaue Zuordnung befindet sich in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Szenarien

Die vollständige Liste der Szenario-IDs ist die Union `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorien umfassen:

- Threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- oberste Ebene / DM / Raum - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- Streaming und Tool-Fortschritt - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- Medien - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- Routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- Reaktionen - `matrix-reaction-*`
- Approvals - `matrix-approval-*` (Exec-/Plugin-Metadaten, chunked Fallback, Ablehnungsreaktionen, Threads und Routing mit `target: "both"`)
- Neustart und Replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- Mention-Gating, Bot-zu-Bot und Allowlists - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (einfache Antwort, Thread-Follow-up, Bootstrap, Wiederherstellungsschlüssel-Lebenszyklus, State-Verlust-Varianten, Server-Backup-Verhalten, Gerätehygiene, SAS-/QR-/DM-Verifizierung, Neustart, Artefakt-Redaktion)
- E2EE-CLI - `matrix-e2ee-cli-*` (Verschlüsselungseinrichtung, idempotente Einrichtung, Bootstrap-Fehler, Wiederherstellungsschlüssel-Lebenszyklus, Mehrkonto, Gateway-Antwort-Roundtrip, Selbstverifizierung)

Übergeben Sie `--scenario <id>` (wiederholbar), um eine manuell ausgewählte Menge auszuführen; kombinieren Sie dies mit `--profile all`, um Profil-Gating zu ignorieren.

## Umgebungsvariablen

| Variable                                | Standardwert                              | Wirkung                                                                                                                                                                                                               |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 Min.)                       | Harte Obergrenze für den gesamten Lauf.                                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Begrenzung für die initiale Canary-Antwort. Release-CI erhöht diesen Wert auf gemeinsam genutzten Runnern, damit ein langsamer erster Gateway-Turn nicht fehlschlägt, bevor die Szenarioabdeckung beginnt.             |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ruhefenster für negative Keine-Antwort-Assertions. Auf `≤` das Laufzeitlimit begrenzt.                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Begrenzung für den Docker-Abbau. Fehlerausgaben enthalten den Recovery-Befehl `docker compose ... down --remove-orphans`.                                                                                             |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Überschreibt das Homeserver-Image bei der Validierung gegen eine andere Tuwunel-Version.                                                                                                                              |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ein                                       | `0` unterdrückt `[matrix-qa] ...`-Fortschrittszeilen auf stderr. `1` erzwingt sie.                                                                                                                                    |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redigiert                                 | `1` behält Nachrichtentext und `formatted_body` in `matrix-qa-observed-events.json` bei. Standardmäßig wird redigiert, damit CI-Artefakte sicher bleiben.                                                             |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | aus                                       | `1` überspringt das deterministische `process.exit` nach dem Schreiben der Artefakte. Der Standard erzwingt das Beenden, weil native Crypto-Handles von matrix-js-sdk den Event-Loop über den Artefaktabschluss hinaus aktiv halten können. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nicht gesetzt                             | Wenn von einem äußeren Launcher gesetzt (z. B. `scripts/run-node.mjs`), verwendet Matrix QA diesen Logpfad wieder, statt ein eigenes Tee zu starten.                                                                  |

## Ausgabeartefakte

Werden nach `--output-dir` geschrieben:

- `matrix-qa-report.md` - Markdown-Protokollbericht (was bestanden wurde, fehlgeschlagen ist, übersprungen wurde und warum).
- `matrix-qa-summary.json` - Strukturierte Zusammenfassung, geeignet für CI-Parsing und Dashboards.
- `matrix-qa-route-state-manifest.json` - Dynamisches `matrix-qa-v1`-Inventar, nach Szenario-ID indiziert. Es erfasst redigierte Routen-/Body-Formen, Anfrage-Reihenfolge, beobachtete Wiederholungen, Fehler, Sync-Token-Kontinuität sowie während dieses Laufs beobachtete Device-/Key-/Media-/Backup-State-Familien. Dies ist ausführbarer Nachweis, keine eingecheckte Baseline.
- `matrix-qa-observed-events.json` - Beobachtete Matrix-Events von Driver- und Observer-Clients. Bodies werden redigiert, sofern nicht `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` gesetzt ist; Approval-Metadaten werden mit ausgewählten sicheren Feldern und gekürzter Befehlsvorschau zusammengefasst.
- `matrix-qa-output.log` - Kombiniertes stdout/stderr des Laufs. Wenn `OPENCLAW_RUN_NODE_OUTPUT_LOG` gesetzt ist, wird stattdessen das Log des äußeren Launchers wiederverwendet.

Das Standard-Ausgabeverzeichnis ist `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, damit aufeinanderfolgende Läufe einander nicht überschreiben.

## Triage-Tipps

- **Lauf hängt gegen Ende:** Native Crypto-Handles von `matrix-js-sdk` können länger leben als der Harness. Der Standard erzwingt nach dem Schreiben der Artefakte ein sauberes `process.exit`; wenn Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` deaktiviert haben, ist damit zu rechnen, dass der Prozess weiterläuft.
- **Cleanup-Fehler:** Suchen Sie nach dem ausgegebenen Recovery-Befehl (einem `docker compose ... down --remove-orphans`-Aufruf) und führen Sie ihn manuell aus, um den Homeserver-Port freizugeben.
- **Instabile negative Assertion-Fenster in CI:** Senken Sie `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (Standard 8 s), wenn CI schnell ist; erhöhen Sie den Wert auf langsamen gemeinsam genutzten Runnern.
- **Redigierte Bodies für einen Fehlerbericht benötigt:** Führen Sie den Lauf erneut mit `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` aus und hängen Sie `matrix-qa-observed-events.json` an. Behandeln Sie das resultierende Artefakt als sensibel.
- **Andere Tuwunel-Version:** Richten Sie `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` auf die zu testende Version. Die Lane checkt nur das angepinnte Standard-Image ein.

## Live-Transportvertrag

Matrix ist eine von drei Live-Transport-Lanes (Matrix, Telegram, Discord), die eine gemeinsame Vertrags-Checkliste verwenden, die in der [QA-Übersicht → Live-Transportabdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage) definiert ist. `qa-channel` bleibt die breite synthetische Suite und ist absichtlich nicht Teil dieser Matrix.

## Verwandt

- [QA-Übersicht](/de/concepts/qa-e2e-automation) - gesamter QA-Stack und Live-Transportvertrag
- [QA Channel](/de/channels/qa-channel) - synthetischer Channel-Adapter für repo-gestützte Szenarien
- [Testing](/de/help/testing) - Tests ausführen und QA-Abdeckung hinzufügen
- [Matrix](/de/channels/matrix) - das getestete Channel-Plugin
