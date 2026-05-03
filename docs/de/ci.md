---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlgeschlagene GitHub-Actions-Prüfung
    - Sie koordinieren einen Lauf oder erneuten Lauf der Release-Validierung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-03T21:27:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und schaltet aufwendige Lanes ab, wenn nur nicht zusammenhängende Bereiche geändert wurden. Manuelle `workflow_dispatch`-Läufe umgehen bewusst das intelligente Scoping und fächern für Release-Kandidaten und breite Validierung den vollständigen Graphen auf. Android-Lanes bleiben über `include_android` opt-in. Release-exklusive Plugin-Abdeckung liegt im separaten Workflow [`Plugin Prerelease`](#plugin-prerelease) und läuft nur über [`Full Release Validation`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                          | Wann er läuft                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest          | Immer bei Nicht-Entwurfs-Pushes und PRs  |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                  | Immer bei Nicht-Entwurfs-Pushes und PRs  |
| `security-dependency-audit`      | Abhängigkeitsfreier Audit des Produktions-Lockfiles gegen npm-Advisories                                       | Immer bei Nicht-Entwurfs-Pushes und PRs  |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                                        | Immer bei Nicht-Entwurfs-Pushes und PRs  |
| `check-dependencies`             | Produktionsbezogener Knip-Durchlauf nur für Abhängigkeiten plus Guard für die Allowlist ungenutzter Dateien   | Node-relevante Änderungen                |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte          | Node-relevante Änderungen                |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Vertrags-/Protokollprüfungen                          | Node-relevante Änderungen                |
| `checks-fast-contracts-channels` | Geshardete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                                   | Node-relevante Änderungen                |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes                             | Node-relevante Änderungen                |
| `check`                          | Gesherdetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Testtypen und strikter Smoke-Test     | Node-relevante Änderungen                |
| `check-additional`               | Architektur, geshardeter Boundary-/Prompt-Drift, Erweiterungs-Guards, Paket-Boundary und Gateway Watch         | Node-relevante Änderungen                |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Smoke-Test für den Startspeicher                                           | Node-relevante Änderungen                |
| `checks`                         | Verifier für Channel-Tests gegen gebaute Artefakte                                                             | Node-relevante Änderungen                |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                   | Manueller CI-Dispatch für Releases       |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                              | Docs geändert                            |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                      | Python-Skill-relevante Änderungen        |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen gemeinsamer Runtime-Import-Spezifizierer              | Windows-relevante Änderungen             |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam gebauten Artefakten                                               | macOS-relevante Änderungen               |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                  | macOS-relevante Änderungen               |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                                                | Android-relevante Änderungen             |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                   | Erfolg der CI auf `main` oder manueller Dispatch |
| `openclaw-performance`           | Tägliche/bedarfsbasierte Kova-Runtime-Performanceberichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes | Geplante und manuelle Dispatches         |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die aufwendigeren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Aufwendigere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr eingereiht werden, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), damit ein Zombie auf GitHub-Seite in einer alten Warteschlangengruppe neuere `main`-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Erkennung geänderter Scopes und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen gescopet.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Vertragshelfer-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifestpfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, gebündelte Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Hilfsflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helfer, Paketmanager-Konfiguration und die CI-Workflow-Flächen gescopet, die diese Lane ausführen; nicht zusammenhängende Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, schnelle Core-Unit-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist zwischen State- und Prozess-/Config-Shards aufgeteilt, Auto-Reply läuft als balancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Media- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-alls. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, damit `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist über vier Matrix-Shards gestreift, wobei jeder ausgewählte unabhängige Guards parallel ausführt und Timing pro Prüfung ausgibt, einschließlich `pnpm prompt:snapshots:check`, damit Prompt-Drift im Codex-Runtime-Happy-Path an den PR gebunden ist, der ihn verursacht hat. Gateway Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source-Set oder Manifest; ihre Unit-Test-Lane kompiliert die Variante weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` aus (einen produktionsbezogenen Knip-Durchlauf nur für Abhängigkeiten, fixiert auf die neueste Knip-Version, wobei pnpm's Mindestfreigabealter für die `dlx`-Installation deaktiviert ist) sowie `pnpm deadcode:unused-files`, das Knips produktionsbezogene Funde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue, nicht geprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Flächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Brücke von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Issue- und Pull-Request-Review-Anfragen;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Actor, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet bewusst die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`; er sendet das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßiges Öffnen, Bearbeitungen, Bot-Aktivität, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten in diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie die normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux-Node-Shards, Shards für gebündelte Plugins, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android, indem `include_android=true` übergeben wird. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktivierter Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine vollständige Suite für einen Release-Kandidaten nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/gebündelte Prüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Verifizierer für Node-Testaggregate, Docs-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gestellt werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr gekostet haben, als sie gespart haben); install-smoke-Docker-Builds (32-vCPU-Warteschlangenzeit hat mehr gekostet, als sie gespart hat)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                           |

## Lokale Entsprechungen

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` ist der Performance-Workflow für Produkt und Runtime. Er läuft täglich auf `main` und kann manuell dispatcht werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarkt normalerweise den Workflow-Ref. Setzen Sie `target_ref`, um einen Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Zeiger werden nach dem getesteten Ref verschlüsselt, und jede `index.md` zeichnet den getesteten Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Startup-, Gateway- und Agent-Turn-Hotspots.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf auch OpenClaw-native Quellprobes aus: Gateway-Boot-Timing und Speicher über Standard-, Hook- und 50-Plugin-Startup-Fälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Schleifen; und CLI-Startup-Befehle gegen das gebootete Gateway. Die Markdown-Zusammenfassung der Quellprobe liegt unter `source/index.md` im Berichtsbündel, mit rohem JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bündel, `index.md` und Quellprobe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle tested-ref-Zeiger wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für nur für Releases vorgesehene Plugin-/Paket-/statische/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus Release-Prüfungen aus. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und fokussierte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn von `release/YYYY.M.D` oder `main`, nachdem der Release-Tag existiert und nachdem der OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`, dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht `Plugin ClawHub Release` für denselben Release-SHA und dispatcht erst dann `OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für gepinnten Commit-Nachweis auf einem sich schnell bewegenden Branch verwenden Sie den Helper statt `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der Helper pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA, dispatcht `Full Release Validation` von diesem gepinnten Ref, verifiziert, dass jeder untergeordnete Workflow-`headSha` mit dem Ziel übereinstimmt, und löscht den temporären Branch, wenn der Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn irgendein untergeordneter Workflow mit einem anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite beratende Provider-/Medienmatrix ausführen möchten.

- `minimum` behält die schnellsten OpenAI-/Core-Release-kritischen Lanes bei.
- `stable` ergänzt das stabile Provider-/Backend-Set.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die IDs der gestarteten Child-Runs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der Child-Runs erneut und hängt Tabellen der langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` auf dem Umbrella. So bleibt eine erneute Ausführung einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmalig in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live-/E2E-Release-Pfad-Docker-Workflow als auch an den Package-Acceptance-Shard. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs neu gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den er
bereits gestartet hat, wenn der Parent abgebrochen wird, sodass neuere Main-Validierungen
nicht hinter einem veralteten zweistündigen Release-Check-Run warten. Release-Branch-/Tag-
Validierungen und gezielte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live-/E2E-Child behält eine breite native `pnpm test:live`-Abdeckung bei, führt sie aber über `scripts/test-live-shard.mjs` als benannte Shards aus statt als einen seriellen Job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- Provider-gefilterte `native-live-src-gateway-profiles`-Jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- aufgeteilte Medien-Audio-/Video-Shards und Provider-gefilterte Musik-Shards

Damit bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler leichter erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das vom Workflow `Live Media Runner Image` gebaut wird. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs prüfen die Binärdateien nur vor dem Setup. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, danach laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards enthalten explizite Time-out-Grenzen auf Skriptebene unterhalb des Workflow-Job-Time-outs, sodass ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Source-Tree, während die Paketakzeptanz einen einzelnen Tarball über dasselbe Docker-E2E-Harness validiert, das Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Prerelease-/Stable-Versionen.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, ein Tag oder eine vollständige Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, ob der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem losgelösten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` ist. Dadurch kann das aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der Pfad für veröffentlichte npm-Spezifikationen bleibt für eigenständige Dispatches erhalten.

Für die dedizierte Update- und Plugin-Testrichtlinie, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Standards und Fehlertriage,
siehe [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur der Installation konfigurierter Plugins, Offline-Plugin-, Plugin-Update- und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` bei Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus der SHA gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin betriebssystemspezifisches Onboarding, Installer- und Plattformverhalten ab; Paket-/Update-Produktvalidierung sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Run eine veröffentlichte Paket-Baseline. In Package Acceptance ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes behalten diese Baseline bei. Setzen Sie `published_upgrade_survivor_baselines=all-since-2026.4.23`, um Full Release CI über jedes stabile npm-Release von `2026.4.23` bis `latest` zu erweitern; `release-history` bleibt für manuelles breiteres Sampling mit dem älteren Vor-Datum-Anker verfügbar. Setzen Sie `published_upgrade_survivor_scenarios=reported-issues`, um dieselben Baselines über issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um vollständige Bereinigung veröffentlichter Updates geht, nicht um normale Full-Release-CI-Breite. Lokale aggregierte Runs können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` eine einzelne Lane behalten, etwa `openclaw@2026.4.15`, oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft nach dem Gateway-Start `/healthz`, `/readyz` sowie den RPC-Status. Die Windows-Paket- und Installer-Fresh-Lanes prüfen außerdem, ob ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` können auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` kann den Unterfall zur Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` kann fehlende `pnpm.patchedDependencies` aus dem vom Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes können Legacy-Install-Record-Speicherorte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` kann die Migration von Konfigurationsmetadaten zulassen, während weiterhin erforderlich ist, dass Install-Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` kann außerdem Warnungen für lokale Build-Metadaten-Stempeldateien ausgeben, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

### Beispiele

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Protokolle, Phasen-Timings und Befehle für erneute Läufe. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke-Test

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Core-Plugin-/Channel-/Gateway-/Plugin SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeführt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke-Test zum Löschen von Agents in einem gemeinsam genutzten Workspace aus, führt den Container-Gateway-Netzwerk-E2E-Test aus, verifiziert ein Build-Argument für eine gebündelte Extension und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf pro Szenario ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Auslösungen, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet Install-Smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smoke-Tests, Installer-/Update-Smoke-Tests und den schnellen Docker-E2E-Test für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smoke-Tests warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke-Test bei und überlässt den vollständigen Install-Smoke-Test der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke-Test wird separat über `run_bun_global_install_smoke` gesteuert. Er läuft nach dem nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Auslösungen können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen install-fokussierten Dockerfiles.

## Lokaler Docker-E2E-Test

`pnpm test:docker:all` baut ein gemeinsam genutztes Live-Test-Image vor, paketiert OpenClaw einmal als npm-Tarball und baut zwei gemeinsam genutzte `scripts/e2e/Dockerfile`-Images:

- einen schlanken Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktionalitäts-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt die Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standardwert | Zweck                                                                                         |
| -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Slot-Anzahl im Haupt-Pool für normale Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Provider-sensible Slot-Anzahl im Tail-Pool.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Limit für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10           | Limit für gleichzeitige npm-Install-Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Limit für gleichzeitige Multi-Service-Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Staffelung zwischen Lane-Starts, um Create-Stürme des Docker-Daemons zu vermeiden; setzen Sie `0`, um keine Staffelung zu verwenden. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Limits. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset        | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset        | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihr effektives Limit, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokalen aggregierten Vorprüfungen prüfen Docker, entfernen veraltete OpenClaw-E2E-Container, geben den Status aktiver Lanes aus, speichern Lane-Timings für die Longest-First-Sortierung und planen standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welches Paket, welche Image-Art, welches Live-Image, welche Lane und welche Credential-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Er paketiert OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan paketinstallierte Lanes benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell neu versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren Chunk-Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art pullt und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` aufgenommen, wenn vollständige Release-Pfad-Abdeckung es anfordert, und behält nur für OpenWebUI-only-Auslösungen einen eigenständigen Chunk `openwebui`. Update-Lanes für gebündelte Channels wiederholen bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Protokollen, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt, und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen erneuten Lauf. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paket-Abdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Auslösungen lassen diese Suite deaktiviert. Er verteilt Tests gebündelter Plugins auf acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases verwendete Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren.

## QA-Lab

QA-Lab verfügt über dedizierte CI-Lanes außerhalb des zentralen smart gescopten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnessen verschachtelt, kein eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität zusammen mit einem breiten Validierungslauf laufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manueller Auslösung; er fächert die Mock-Parity-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modell-Latenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert Memory-Suche, weil QA-Parität das Memory-Verhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Suiten für Live-Modelle, native Provider und Docker-Provider abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und ergänzt `--fail-fast` nur, wenn die ausgecheckte CLI es unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; eine manuelle Auslösung mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die release-kritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Parity-Gate führt die Candidate- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Für normale PRs folgen Sie gescopten CI-/Prüfnachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst als schlanker Security-Scanner für den ersten Durchlauf angelegt, nicht als vollständiger Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript/TypeScript-Oberflächen mit dem höchsten Risiko, mit Security-Abfragen mit hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Security-Matrix mit hoher Konfidenz aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Security-Kategorien

| Kategorie                                         | Oberfläche                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Basis                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge des Kern-Channel sowie Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets und Audit-Berührungspunkte           |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Network Guard, Web-Fetch und SSRF-Policy-Oberflächen des Plugin SDK                                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen für Prozessausführung, ausgehende Zustellung und Agent-Gates für Tool-Ausführung                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Vertrauensoberflächen des Plugin-SDK-Package-Vertrags |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Sanity akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus hochgeladenem SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build die Laufzeit selbst bei sauberen Ergebnissen dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Security-Shard. Er führt nur JavaScript/TypeScript-Quality-Abfragen mit Error-Schweregrad und ohne Security-Bezug über schlanke, hochwertige Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht als Draft markierte PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` aus, wenn sich Code für Agent-Befehl-/Modell-/Tool-Ausführung und Antwort-Dispatch, Config-Schema/Migration/IO, Authentifizierung/Secrets/Sandbox/Security, Kern-Channel und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll/Servermethode, Memory-Runtime/SDK-Verknüpfung, MCP/Prozess/ausgehende Zustellung, Provider-Runtime/Modellkatalog, Sitzungsdiagnostik/Zustellwarteschlangen, Plugin-Loader, Plugin-SDK/Package-Vertrag oder Plugin-SDK-Antwort-Runtime ändert. CodeQL-Config- und Quality-Workflow-Änderungen führen alle zwölf PR-Quality-Shards aus.

Manuelle Ausführung akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schlanken Profile sind Lehr- und Iterations-Hooks, um einen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Code für Authentifizierung, Secrets, Sandbox, Cron und Gateway-Security-Grenzen                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Config-Schema, Migration, Normalisierung und IO-Verträge                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Servermethodenverträge                                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge des Kern-Channel und gebündelter Channel-Plugins                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                            |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Verknüpfung zur Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellwarteschlangen, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Oberflächen und CLI-Verträge des Sitzungs-Doctors |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound-Reply-Dispatch des Plugin SDK, Hilfsfunktionen für Reply-Payload/Chunking/Runtime, Channel-Antwortoptionen, Zustellwarteschlangen und Hilfsfunktionen für Session-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Discovery, Provider-Runtime-Registrierung, Provider-Standards/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/Search, Media-IO, Medienverständnis, Image-Generation und Media-Generation-Runtime-Verträge                                                               |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter Package-seitiger Plugin-SDK-Quellcode und Hilfsfunktionen für Plugin-Package-Verträge                                                                  |

Quality bleibt von Security getrennt, damit Quality-Findings geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterung sollte erst dann als gescopter oder geshardeter Follow-up wieder hinzugefügt werden, wenn die schlanken Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und eine manuelle Ausführung kann ihn direkt starten. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er ausgeführt wird, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle Main-Änderungen abdecken kann, die seit dem letzten Dokumentationsdurchlauf angefallen sind.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn am selben UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manuelle Ausführung umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, coverage-erhaltende Test-Performance-Korrekturen statt breiter Refactorings vornehmen, führt anschließend den Bericht für die vollständige Suite erneut aus und verwirft Änderungen, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlgeschlagene Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` vor dem Bot-Push weiterläuft, rebased die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitsposition wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Duplikatbereinigung nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` gesetzt ist. Vor dem Ändern von GitHub prüft er, dass der gelandete PR gemerged wurde und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattform-Scope:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck sowie Core-Lint/Guards aus;
- reine Änderungen an Core-Tests führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Änderungen an Extension-Tests führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder am Plugin-Vertrag erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Versionsbump-Änderungen an Release-Metadaten führen gezielte Versions-/Config-/Root-Abhängigkeitsprüfungen aus;
- unbekannte Root-/Config-Änderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Das lokale Changed-Test-Routing befindet sich in `scripts/test-projects.test-support.mjs` und ist bewusst günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quellcodeänderungen bevorzugen explizite Zuordnungen, danach Geschwistertests und Import-Graph-Abhängige. Gemeinsame Group-Room-Delivery-Config ist eine der expliziten Zuordnungen: Änderungen an der für die Gruppe sichtbaren Reply-Config, am Source-Reply-Delivery-Modus oder am System-Prompt des Message-Tools laufen über die Core-Reply-Tests plus Discord- und Slack-Delivery-Regressionen, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass der günstige zugeordnete Satz kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie eine frisch vorgewärmte Box für umfassenden Nachweis. Bevor Sie ein langsames Gate auf eine Box verwenden, die wiederverwendet wurde, abgelaufen ist oder gerade einen unerwartet großen Sync gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` in der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Das bedeutet normalerweise, dass der Remote-Sync-Status keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie stattdessen eine frische vor, anstatt den Produkttestfehler zu debuggen. Setzen Sie für beabsichtigte PRs mit vielen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Sanity-Lauf.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith CLI-Aufruf, der länger als fünf Minuten in der Sync-Phase bleibt, ohne Ausgabe nach dem Sync zu liefern. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diese Schutzmaßnahme zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene zweite Remote-Box-Pfad für Linux-Nachweis, wenn Blacksmith nicht verfügbar ist oder wenn eigene Cloud-Kapazität vorzuziehen ist. Wärmen Sie eine Box vor, hydratisieren Sie sie über den Projekt-Workflow und führen Sie dann Befehle über die Crabbox CLI aus:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` verwaltet die Standardwerte für Provider, Sync und GitHub Actions-Hydration. Sie schließt das lokale `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, anstatt maintainer-lokale Remotes und Objektspeicher zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheimen Umgebungswerte, die spätere `crabbox run --id <cbx_id>`-Befehle einlesen.

## Zugehörig

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
