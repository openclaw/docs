---
read_when:
    - '`pnpm openclaw qa matrix` lokal ausführen'
    - Matrix-QA-Szenarien hinzufügen oder auswählen
    - Triage von Matrix-QA-Fehlern, Zeitüberschreitungen oder hängender Bereinigung
summary: 'Maintainer-Referenz für den Docker-basierten Matrix-Live-QA-Testpfad: CLI, Profile, Umgebungsvariablen, Szenarien und Ausgabeartefakte.'
title: Matrix-QA
x-i18n:
    generated_at: "2026-07-12T01:37:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Der Matrix-QA-Lauf führt das gebündelte Plugin `@openclaw/matrix` gegen einen temporären Tuwunel-Homeserver in Docker aus. Dabei kommen temporäre Konten für Treiber, SUT und Beobachter sowie vorbereitete Räume zum Einsatz. Er bietet die Live-Abdeckung für Matrix mit realem Transport.

Werkzeuge nur für Maintainer. Veröffentlichte OpenClaw-Pakete enthalten `qa-lab` nicht. Daher kann `openclaw qa` nur aus einem Quellcode-Checkout ausgeführt werden, der den gebündelten Runner direkt und ohne Installationsschritt für das Plugin lädt.

Einen breiteren Überblick über das QA-Framework finden Sie unter [QA-Übersicht](/de/concepts/qa-e2e-automation).

## Schnellstart

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Ein einfaches `pnpm openclaw qa matrix` führt `--profile all` aus und hält beim ersten Fehler nicht an. Verteilen Sie den vollständigen Bestand mit `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` auf parallele Aufträge.

## Funktionsweise des Laufs

1. Stellt hinter einem begrenzten, sensible Daten schwärzenden Anfrage-/Antwort-Rekorder einen temporären Tuwunel-Homeserver in Docker bereit (Standard-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`, Servername `matrix-qa.test`, Port `28008`).
2. Registriert drei temporäre Benutzer: `driver` (sendet eingehenden Datenverkehr), `sut` (das zu testende OpenClaw-Matrix-Konto) und `observer` (erfasst Datenverkehr von Drittanbietern).
3. Bereitet die für die ausgewählten Szenarien erforderlichen Räume vor (Hauptraum, Threads, Medien, Neustart, sekundärer Raum, Zulassungsliste, E2EE, Verifizierungs-DM usw.).
4. Führt den substratneutralen Protokoll-Probelauf `matrix-qa-v1` gegen die aufgezeichnete Tuwunel-Grenze aus. Unit-Tests belegen den Vertrag des Probelaufs mit dem Matrix-Protokoll-Fixture; der kanonische Host des QA-Transportadapters in [#99707](https://github.com/openclaw/openclaw/pull/99707) ist für die Einbindung realer Crabline-Ziele zuständig.
5. Startet einen untergeordneten OpenClaw-Gateway mit dem echten Matrix-Plugin, dessen Geltungsbereich auf das SUT-Konto beschränkt ist.
6. Führt die Szenarien nacheinander aus, beobachtet Ereignisse über die Matrix-Clients des Treibers und Beobachters und leitet aus dem aufgezeichneten Datenverkehr die Erwartungen an Routing und Zustand ab.
7. Baut den Homeserver ab, schreibt Berichts- und Nachweisartefakte und beendet anschließend den Lauf.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Häufig verwendete Flags

| Flag                  | Standardwert                                  | Beschreibung                                                                                                                                                                     |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Szenarioprofil. Siehe [Profile](#profiles).                                                                                                                                       |
| `--fail-fast`         | deaktiviert                                   | Nach der ersten fehlgeschlagenen Prüfung oder dem ersten fehlgeschlagenen Szenario anhalten.                                                                                      |
| `--scenario <id>`     | -                                             | Nur dieses Szenario ausführen. Wiederholbar. Siehe [Szenarien](#scenarios).                                                                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Verzeichnis, in das Berichte, Zusammenfassung, Routing-/Zustandsbestand, beobachtete Ereignisse und das Ausgabeprotokoll geschrieben werden. Relative Pfade werden anhand von `--repo-root` aufgelöst. |
| `--repo-root <path>`  | `process.cwd()`                               | Repository-Stammverzeichnis beim Aufruf aus einem neutralen Arbeitsverzeichnis.                                                                                                   |
| `--sut-account <id>`  | `sut`                                         | Matrix-Konto-ID innerhalb der QA-Gateway-Konfiguration.                                                                                                                          |

### Provider-Flags

Der Lauf verwendet einen echten Matrix-Transport, der Modell-Provider ist jedoch konfigurierbar:

| Flag                     | Standardwert      | Beschreibung                                                                                                                                                                                                           |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`   | `mock-openai` für deterministische simulierte Weiterleitung oder `live-frontier` für live ausgeführte Frontier-Provider. Der veraltete Alias `live-openai` funktioniert weiterhin. |
| `--model <ref>`          | Provider-Standard | Primäre Referenz im Format `provider/model`.                                                                                                                                                                           |
| `--alt-model <ref>`      | Provider-Standard | Alternative Referenz im Format `provider/model` für Szenarien, die während des Laufs wechseln.                                                                                                                         |
| `--fast`                 | deaktiviert       | Aktiviert den schnellen Provider-Modus, sofern unterstützt.                                                                                                                                                            |

Matrix-QA akzeptiert weder `--credential-source` noch `--credential-role`. Der Lauf stellt lokal temporäre Benutzer bereit; es gibt keinen gemeinsamen Anmeldedaten-Pool, aus dem eine Zuweisung erfolgen könnte.

## Profile

| Profil          | Verwendungszweck                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (Standard) | Vollständiger Katalog. Langsam, aber umfassend.                                                                                                                                                                                              |
| `fast`          | Teilmenge für die Freigabeprüfung, die den imperativen Live-Transportvertrag abdeckt: Erwähnungs-Gating, Blockierung durch Zulassungsliste, Antwortstruktur, Fortsetzung nach Neustart, Beobachtung von Reaktionen, Übermittlung von Metadaten zur Ausführungsgenehmigung und grundlegende E2EE-Antwort. |
| `transport`     | Szenarien für Threads, DMs, Räume, automatischen Beitritt, Erwähnungen/Zulassungslisten, Genehmigungen und Reaktionen auf Transportebene.                                                                                                      |
| `media`         | Abdeckung von Bild-, Audio-, Video-, PDF- und EPUB-Anhängen.                                                                                                                                                                                 |
| `e2ee-smoke`    | Minimale E2EE-Abdeckung: grundlegende verschlüsselte Antwort, Thread-Folgeantwort und erfolgreicher Bootstrap-Vorgang.                                                                                                                        |
| `e2ee-deep`     | Umfassende E2EE-Szenarien für Zustandsverlust, Sicherungen, Schlüssel und Wiederherstellung.                                                                                                                                                  |
| `e2ee-cli`      | CLI-Szenarien für `openclaw matrix encryption setup` und `verify *`, die über das QA-Testsystem gesteuert werden.                                                                                                                             |

Die genaue Zuordnung befindet sich in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Szenarien

Der gemeinsame Matrix-Adapter stellt über `openclaw qa suite --channel-driver live --channel matrix` die folgenden kanonischen YAML-Szenarien bereit:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` bleibt über die explizite Auswahl `--scenario subagent-thread-spawn`
verfügbar, gehört jedoch erst zum gemeinsamen Matrix-Standardsatz, wenn der Live-Nachweis für den Abschluss untergeordneter Prozesse stabil ist.

Die verbleibende Liste imperativer Szenario-IDs entspricht der Union `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Kategorien:

- Threads: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- oberste Ebene / DM / Raum: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- Streaming und Werkzeugfortschritt: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- Medien: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- Routing: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- Reaktionen: `matrix-reaction-*`
- Genehmigungen: `matrix-approval-*` (Ausführungs-/Plugin-Metadaten, segmentierter Fallback, Ablehnungsreaktionen, Threads und Routing mit `target: "both"`)
- Neustart und erneute Wiedergabe: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- Erwähnungs-Gating, Bot-zu-Bot-Kommunikation und Zulassungslisten: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (grundlegende Antwort, Thread-Folgeantwort, Bootstrap-Vorgang, Lebenszyklus des Wiederherstellungsschlüssels, Varianten des Zustandsverlusts, Verhalten der Serversicherung, Gerätehygiene, SAS-/QR-/DM-Verifizierung, Neustart, Schwärzung von Artefakten)
- E2EE-CLI: `matrix-e2ee-cli-*` (Verschlüsselungseinrichtung, idempotente Einrichtung, Bootstrap-Fehler, Lebenszyklus des Wiederherstellungsschlüssels, mehrere Konten, Gateway-Antwort-Rundlauf, Selbstverifizierung)

Übergeben Sie `--scenario <id>` (wiederholbar), um eine manuell ausgewählte Gruppe auszuführen; kombinieren Sie dies mit `--profile all`, um die Profileinschränkung zu ignorieren.

## Umgebungsvariablen

| Variable                                | Standardwert                              | Auswirkung                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 Min.)                       | Feste Obergrenze für den gesamten Durchlauf.                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Zeitlimit für die erste Canary-Antwort. Die Release-CI erhöht dieses Limit auf gemeinsam genutzten Runnern, damit ein langsamer erster Gateway-Durchlauf nicht fehlschlägt, bevor die Szenarioabdeckung beginnt. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ruhezeitfenster für negative Prüfungen auf ausbleibende Antworten. Wird auf höchstens (`<=`) das Zeitlimit des Durchlaufs begrenzt.                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Zeitlimit für den Docker-Abbau. Bei Fehlern wird unter anderem der Wiederherstellungsbefehl `docker compose ... down --remove-orphans` ausgegeben.                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Überschreibt das Homeserver-Image für die Validierung mit einer anderen Tuwunel-Version.                                                                                                                    |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | ein                                       | `0` unterdrückt die Fortschrittszeilen `[matrix-qa] ...` auf stderr. `1` erzwingt ihre Ausgabe.                                                                                                             |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | geschwärzt                                | `1` behält Nachrichtentext und `formatted_body` in `matrix-qa-observed-events.json` bei. Standardmäßig werden sie geschwärzt, damit CI-Artefakte keine sensiblen Daten enthalten.                            |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | aus                                       | `1` überspringt den deterministischen Aufruf von `process.exit` nach dem Schreiben der Artefakte. Standardmäßig wird das Beenden erzwungen, weil die nativen Kryptografie-Handles von matrix-js-sdk die Ereignisschleife nach Fertigstellung der Artefakte aktiv halten können. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nicht gesetzt                             | Wenn ein äußerer Starter diese Variable setzt (z. B. `scripts/run-node.mjs`), verwendet Matrix-QA diesen Protokollpfad, statt eine eigene tee-Ausgabe zu starten.                                            |

## Ausgabeartefakte

Werden in `--output-dir` geschrieben (standardmäßig `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, damit aufeinanderfolgende Durchläufe einander nicht überschreiben):

- `matrix-qa-report.md`: Markdown-Protokollbericht (was erfolgreich war, fehlschlug oder übersprungen wurde und warum).
- `matrix-qa-summary.json`: Strukturierte Zusammenfassung, die sich für die CI-Auswertung und Dashboards eignet.
- `matrix-qa-route-state-manifest.json`: Dynamisches `matrix-qa-v1`-Inventar, nach Szenario-ID geordnet. Es erfasst geschwärzte Routen-/Textstrukturen, die Reihenfolge der Anfragen, beobachtete Wiederholungsversuche, Fehler, die Kontinuität der Synchronisierungstoken sowie die während dieses Durchlaufs beobachteten Zustandsfamilien für Geräte, Schlüssel, Medien und Sicherungen. Dies ist ausführbarer Nachweis, keine eingecheckte Referenzgrundlage.
- `matrix-qa-observed-events.json`: Beobachtete Matrix-Ereignisse der Treiber- und Beobachter-Clients. Nachrichtentexte werden geschwärzt, sofern nicht `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` gesetzt ist; Genehmigungsmetadaten werden mit ausgewählten unbedenklichen Feldern und einer gekürzten Befehlsvorschau zusammengefasst.
- `matrix-qa-output.log`: Kombinierte stdout-/stderr-Ausgabe des Durchlaufs. Wenn `OPENCLAW_RUN_NODE_OUTPUT_LOG` gesetzt ist, wird stattdessen das Protokoll des äußeren Starters wiederverwendet.

## Hinweise zur Fehleranalyse

- **Durchlauf bleibt gegen Ende hängen:** Native Kryptografie-Handles von `matrix-js-sdk` können länger als das Testsystem aktiv bleiben. Standardmäßig wird nach dem Schreiben der Artefakte ein sauberes `process.exit` erzwungen; wenn Sie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` setzen, ist mit einem verzögerten Prozessende zu rechnen.
- **Bereinigungsfehler:** Suchen Sie nach dem ausgegebenen Wiederherstellungsbefehl (einem Aufruf von `docker compose ... down --remove-orphans`) und führen Sie ihn manuell aus, um den Homeserver-Port freizugeben.
- **Unzuverlässige Zeitfenster für negative Prüfungen in der CI:** Verringern Sie `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (Standardwert 8 s), wenn die CI schnell ist; erhöhen Sie den Wert auf langsamen gemeinsam genutzten Runnern.
- **Geschwärzte Nachrichtentexte für einen Fehlerbericht benötigt:** Führen Sie den Durchlauf mit `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` erneut aus und hängen Sie `matrix-qa-observed-events.json` an. Behandeln Sie das resultierende Artefakt als vertraulich.
- **Andere Tuwunel-Version:** Setzen Sie `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` auf die zu testende Version. Für diesen Testpfad wird nur das angeheftete Standard-Image eingecheckt.

## Vertrag für Live-Transporte

Matrix ist einer von drei Live-Transport-Testpfaden (Matrix, Telegram, Discord), die eine gemeinsame Vertragsprüfliste verwenden, die unter [QA-Übersicht: Abdeckung von Live-Transporten](/de/concepts/qa-e2e-automation#live-transport-coverage) definiert ist. `qa-channel` bleibt die umfassende synthetische Testsuite und ist absichtlich nicht Teil dieser Matrix.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation): gesamter QA-Stack und Vertrag für Live-Transporte
- [QA-Kanal](/de/channels/qa-channel): synthetischer Kanaladapter für repositorygestützte Szenarien
- [Tests](/de/help/testing): Ausführen von Tests und Hinzufügen von QA-Abdeckung
- [Matrix](/de/channels/matrix): das getestete Kanal-Plugin
