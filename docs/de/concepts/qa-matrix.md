---
read_when:
    - pnpm openclaw qa matrix lokal ausführen
    - Matrix-QA-Szenarien hinzufügen oder auswählen
    - Triage von Matrix-QA-Fehlern, Zeitüberschreitungen oder hängender Bereinigung
summary: 'Maintainer-Referenz für die Docker-gestützte Matrix-Live-QA-Teststrecke: CLI, Profile, Umgebungsvariablen, Szenarien und Ausgabeartefakte.'
title: Matrix-QA
x-i18n:
    generated_at: "2026-07-12T15:16:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Die Matrix-QA-Lane führt das gebündelte Plugin `@openclaw/matrix` gegen einen temporären Tuwunel-Homeserver in Docker aus, mit temporären Driver-, SUT- und Observer-Konten sowie vorbereiteten Räumen. Sie bietet die transportechte Live-Abdeckung für Matrix.

Nur für Maintainer bestimmte Werkzeuge. Paketierte OpenClaw-Releases enthalten `qa-lab` nicht, daher wird `openclaw qa` nur aus einem Quellcode-Checkout ausgeführt, der den gebündelten Runner direkt und ohne Plugin-Installationsschritt lädt.

Einen breiteren Überblick über das QA-Framework finden Sie in der [QA-Übersicht](/de/concepts/qa-e2e-automation).

## Schnellstart

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Ein einfaches `pnpm openclaw qa matrix` führt `--profile all` aus und hält nicht beim ersten Fehler an. Verteilen Sie das vollständige Inventar mit `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` auf parallele Jobs.

## Funktionsweise der Lane

1. Stellt einen temporären Tuwunel-Homeserver in Docker bereit (Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`, Port `28008`), vorgeschaltet ist ein begrenzter Request-/Response-Rekorder mit Schwärzung vertraulicher Daten.
2. Registriert drei temporäre Benutzer: `driver` (sendet eingehenden Datenverkehr), `sut` (das zu testende OpenClaw-Matrix-Konto), `observer` (erfasst Datenverkehr von Drittanbietern).
3. Bereitet die für die ausgewählten Szenarien erforderlichen Räume vor (Hauptraum, Threading, Medien, Neustart, sekundärer Raum, Positivliste, E2EE, Verifizierungs-DM usw.).
4. Führt den substratneutralen Protokoll-Probe `matrix-qa-v1` gegen die aufgezeichnete Tuwunel-Grenze aus. Unit-Tests belegen den Probe-Vertrag mit dem Matrix-Protokoll-Fixture; der kanonische Host des QA-Transportadapters in [#99707](https://github.com/openclaw/openclaw/pull/99707) ist für die echte Verkabelung des Crabline-Ziels zuständig.
5. Startet einen untergeordneten OpenClaw-Gateway mit dem echten Matrix-Plugin, dessen Gültigkeitsbereich auf das SUT-Konto beschränkt ist.
6. Führt die Szenarien nacheinander aus, beobachtet Ereignisse über die Matrix-Clients des Drivers und Observers und leitet Routing-/Zustandserwartungen aus dem aufgezeichneten Datenverkehr ab.
7. Beendet den Homeserver, schreibt Berichts- und Evidenzartefakte und wird anschließend beendet.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Häufig verwendete Flags

| Flag                  | Standardwert                                  | Beschreibung                                                                                                                                                                                |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Szenarioprofil. Siehe [Profile](#profiles).                                                                                                                                                  |
| `--fail-fast`         | aus                                           | Nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario anhalten.                                                                                                |
| `--scenario <id>`     | -                                             | Nur dieses Szenario ausführen. Wiederholbar. Siehe [Szenarien](#scenarios).                                                                                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Speicherort für Berichte, Zusammenfassung, Routing-/Zustandsinventar, beobachtete Ereignisse und Ausgabeprotokoll. Relative Pfade werden bezüglich `--repo-root` aufgelöst.                  |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-Stammverzeichnis beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                                                                              |
| `--sut-account <id>`  | `sut`                                         | Matrix-Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                                                                      |

### Provider-Flags

Die Lane verwendet einen echten Matrix-Transport, der Modell-Provider ist jedoch konfigurierbar:

| Flag                     | Standardwert      | Beschreibung                                                                                                                                                                                         |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`   | `mock-openai` für deterministisches Mock-Dispatching oder `live-frontier` für live ausgeführte Frontier-Provider. Der veraltete Alias `live-openai` funktioniert weiterhin.                           |
| `--model <ref>`          | Provider-Standard | Primäre `provider/model`-Referenz.                                                                                                                                                                    |
| `--alt-model <ref>`      | Provider-Standard | Alternative `provider/model`-Referenz für Szenarien, die während der Ausführung wechseln.                                                                                                             |
| `--fast`                 | aus               | Aktiviert den schnellen Provider-Modus, sofern unterstützt.                                                                                                                                           |

Matrix-QA akzeptiert weder `--credential-source` noch `--credential-role`. Die Lane stellt temporäre Benutzer lokal bereit; es gibt keinen gemeinsamen Anmeldedatenpool, aus dem eine Zuweisung erfolgen könnte.

## Profile

| Profil          | Verwendungszweck                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (Standard) | Vollständiger Katalog. Langsam, aber umfassend.                                                                                                                                                                                                                           |
| `fast`          | Teilmenge für das Release-Gate, die den imperativen Live-Transportvertrag prüft: Erwähnungs-Gating, Blockierung durch Positivliste, Antwortform, Wiederaufnahme nach Neustart, Beobachtung von Reaktionen, Übermittlung von Metadaten zur Ausführungsgenehmigung und grundlegende E2EE-Antwort. |
| `transport`     | Threading-, DM-, Raum-, Autojoin-, Erwähnungs-/Positivlisten-, Genehmigungs- und Reaktionsszenarien auf Transportebene.                                                                                                                                                    |
| `media`         | Abdeckung von Bild-, Audio-, Video-, PDF- und EPUB-Anhängen.                                                                                                                                                                                                              |
| `e2ee-smoke`    | Minimale E2EE-Abdeckung: grundlegende verschlüsselte Antwort, Thread-Folgenachricht, erfolgreicher Bootstrap.                                                                                                                                                               |
| `e2ee-deep`     | Umfassende E2EE-Szenarien für Zustandsverlust, Sicherungen, Schlüssel und Wiederherstellung.                                                                                                                                                                               |
| `e2ee-cli`      | Über das QA-Harness ausgeführte CLI-Szenarien für `openclaw matrix encryption setup` und `verify *`.                                                                                                                                                                       |

Die genaue Zuordnung befindet sich in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Szenarien

Der gemeinsame Matrix-Adapter stellt diese kanonischen YAML-Szenarien über `openclaw qa suite --channel-driver live --channel matrix` bereit:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` bleibt über eine explizite Auswahl mit `--scenario subagent-thread-spawn`
verfügbar, gehört jedoch erst dann zum gemeinsamen Matrix-Standardsatz, wenn der Live-Nachweis für den Abschluss untergeordneter Prozesse stabil ist.

Die verbleibende imperative Liste der Szenario-IDs ist die Union `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Kategorien:

- Threading: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- oberste Ebene / DM / Raum: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- Streaming und Werkzeugfortschritt: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- Medien: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- Routing: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- Reaktionen: `matrix-reaction-*`
- Genehmigungen: `matrix-approval-*` (Ausführungs-/Plugin-Metadaten, segmentierter Fallback, Ablehnungsreaktionen, Threads und `target: "both"`-Routing)
- Neustart und Wiedergabe: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- Erwähnungs-Gating, Bot-zu-Bot und Positivlisten: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (grundlegende Antwort, Thread-Folgenachricht, Bootstrap, Lebenszyklus des Wiederherstellungsschlüssels, Varianten mit Zustandsverlust, Verhalten von Serversicherungen, Gerätehygiene, SAS-/QR-/DM-Verifizierung, Neustart, Schwärzung von Artefakten)
- E2EE-CLI: `matrix-e2ee-cli-*` (Einrichtung der Verschlüsselung, idempotente Einrichtung, Bootstrap-Fehler, Lebenszyklus des Wiederherstellungsschlüssels, mehrere Konten, Gateway-Antwort-Rundlauf, Selbstverifizierung)

Übergeben Sie `--scenario <id>` (wiederholbar), um eine gezielt ausgewählte Gruppe auszuführen; kombinieren Sie dies mit `--profile all`, um das Profil-Gating zu ignorieren.

## Umgebungsvariablen

| Variable                                | Standardwert                               | Auswirkung                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                         | Feste Obergrenze für den gesamten Lauf.                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                    | Zeitlimit für die erste Canary-Antwort. Die Release-CI erhöht dieses Limit auf gemeinsam genutzten Runnern, damit ein langsamer erster Gateway-Durchlauf nicht fehlschlägt, bevor die Szenarioabdeckung beginnt. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                     | Ruhefenster für negative Keine-Antwort-Prüfungen. Wird auf `<=` des Zeitlimits für den Lauf begrenzt.                                                                                             |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                    | Zeitlimit für den Docker-Abbau. Bei einem Fehler wird unter anderem der Wiederherstellungsbefehl `docker compose ... down --remove-orphans` ausgegeben.                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1`  | Überschreibt das Homeserver-Image bei der Validierung mit einer anderen Tuwunel-Version.                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ein                                        | `0` unterdrückt `[matrix-qa] ...`-Fortschrittszeilen auf stderr. `1` erzwingt ihre Ausgabe.                                                                                                      |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geschwärzt                                 | `1` behält Nachrichtentext und `formatted_body` in `matrix-qa-observed-events.json` bei. Standardmäßig werden sie geschwärzt, um CI-Artefakte zu schützen.                                        |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | aus                                        | `1` überspringt den deterministischen `process.exit` nach dem Schreiben der Artefakte. Standardmäßig wird das Beenden erzwungen, da die nativen Kryptografie-Handles von matrix-js-sdk die Ereignisschleife nach Abschluss der Artefakterstellung weiter aktiv halten können. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nicht gesetzt                              | Wenn diese Variable von einem äußeren Starter (z. B. `scripts/run-node.mjs`) gesetzt wird, verwendet Matrix-QA diesen Protokollpfad erneut, statt ein eigenes tee zu starten.                      |

## Ausgabeartefakte

Werden in `--output-dir` geschrieben (Standardwert: `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, damit aufeinanderfolgende Läufe einander nicht überschreiben):

- `matrix-qa-report.md`: Markdown-Protokollbericht (was erfolgreich war, fehlschlug oder übersprungen wurde und warum).
- `matrix-qa-summary.json`: Strukturierte Zusammenfassung für die CI-Auswertung und Dashboards.
- `matrix-qa-route-state-manifest.json`: Dynamisches, nach Szenario-ID indiziertes `matrix-qa-v1`-Inventar. Es erfasst geschwärzte Routen-/Textformen, die Reihenfolge der Anfragen, beobachtete Wiederholungsversuche, Fehler, die Kontinuität von Synchronisierungstoken sowie die während dieses Laufs beobachteten Zustandsfamilien für Geräte, Schlüssel, Medien und Sicherungen. Dies sind ausführbare Nachweise, keine eingecheckte Baseline.
- `matrix-qa-observed-events.json`: Beobachtete Matrix-Ereignisse der Treiber- und Beobachterclients. Texte werden geschwärzt, sofern `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` nicht gesetzt ist; Genehmigungsmetadaten werden mit ausgewählten sicheren Feldern und einer gekürzten Befehlsvorschau zusammengefasst.
- `matrix-qa-output.log`: Kombinierte stdout-/stderr-Ausgabe des Laufs. Wenn `OPENCLAW_RUN_NODE_OUTPUT_LOG` gesetzt ist, wird stattdessen das Protokoll des äußeren Starters wiederverwendet.

## Tipps zur Fehleranalyse

- **Lauf hängt gegen Ende:** Native Kryptografie-Handles von `matrix-js-sdk` können länger als das Testgerüst bestehen bleiben. Standardmäßig wird nach dem Schreiben der Artefakte ein sauberer `process.exit` erzwungen; wenn Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` setzen, müssen Sie damit rechnen, dass der Prozess noch weiterläuft.
- **Fehler bei der Bereinigung:** Suchen Sie nach dem ausgegebenen Wiederherstellungsbefehl (einem Aufruf von `docker compose ... down --remove-orphans`) und führen Sie ihn manuell aus, um den Homeserver-Port freizugeben.
- **Instabile Zeitfenster für negative Prüfungen in der CI:** Verringern Sie `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (Standardwert 8 s), wenn die CI schnell ist; erhöhen Sie den Wert auf langsamen gemeinsam genutzten Runnern.
- **Geschwärzte Texte für einen Fehlerbericht erforderlich:** Führen Sie den Lauf erneut mit `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` aus und hängen Sie `matrix-qa-observed-events.json` an. Behandeln Sie das resultierende Artefakt als vertraulich.
- **Andere Tuwunel-Version:** Setzen Sie `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` auf die zu testende Version. Für die Lane wird nur das angeheftete Standard-Image eingecheckt.

## Vertrag für Live-Transporte

Matrix ist eine von drei Live-Transport-Lanes (Matrix, Telegram, Discord), die eine gemeinsame Vertragsprüfliste verwenden, die unter [QA-Übersicht: Abdeckung der Live-Transporte](/de/concepts/qa-e2e-automation#live-transport-coverage) definiert ist. `qa-channel` bleibt die umfassende synthetische Suite und ist bewusst nicht Teil dieser Matrix.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation): gesamter QA-Stack und Vertrag für Live-Transporte
- [QA-Kanal](/de/channels/qa-channel): synthetischer Kanaladapter für Repository-gestützte Szenarien
- [Tests](/de/help/testing): Tests ausführen und QA-Abdeckung hinzufügen
- [Matrix](/de/channels/matrix): das getestete Kanal-Plugin
