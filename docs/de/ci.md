---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder dessen Wiederholung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Jobgraph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-02T06:28:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2da3014e67b8d2d4bb4c1c9d4c6134eed29309bb176544864df568809ae3ac7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei jedem Push auf `main` und jedem Pull Request ausgeführt. Der Job `preflight` klassifiziert den Diff und deaktiviert teure Lanes, wenn nur nicht zugehörige Bereiche geändert wurden. Manuelle `workflow_dispatch`-Ausführungen umgehen Smart Scoping absichtlich und fächern den vollständigen Graphen für Release Candidates und breite Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Release-only Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin Prerelease`](#plugin-prerelease) und wird nur von [`Full Release Validation`](#full-release-validation) oder durch einen expliziten manuellen Dispatch ausgeführt.

## Pipeline-Überblick

| Job                              | Zweck                                                                                                             | Wann er ausgeführt wird                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Extensions und erstellt das CI-Manifest               | Immer bei Nicht-Entwurfs-Pushes und PRs     |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                     | Immer bei Nicht-Entwurfs-Pushes und PRs     |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Dependency-Installation gegen npm-Advisories                                      | Immer bei Nicht-Entwurfs-Pushes und PRs     |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                                           | Immer bei Nicht-Entwurfs-Pushes und PRs     |
| `check-dependencies`             | Produktions-Knip-Durchlauf nur für Dependencies plus Guard für die Allowlist ungenutzter Dateien                  | Node-relevante Änderungen                   |
| `build-artifacts`                | Baut `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte                 | Node-relevante Änderungen                   |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Bundled-/Plugin-Contract-/Protokollprüfungen                               | Node-relevante Änderungen                   |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                                      | Node-relevante Änderungen                   |
| `checks-node-core-test`          | Core-Node-Test-Shards, ausgenommen Channel-, Bundled-, Contract- und Extension-Lanes                              | Node-relevante Änderungen                   |
| `check`                          | Geshardetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Testtypen und strikter Smoke-Test        | Node-relevante Änderungen                   |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary- und Gateway-Watch-Shards                     | Node-relevante Änderungen                   |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                                          | Node-relevante Änderungen                   |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten                                                                | Node-relevante Änderungen                   |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                      | Manueller CI-Dispatch für Releases          |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                                 | Docs geändert                               |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                         | Für Python-Skills relevante Änderungen      |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionen für Runtime-Import-Spezifizierer              | Windows-relevante Änderungen                |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam gebauten Artefakten                                                  | macOS-relevante Änderungen                  |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                     | macOS-relevante Änderungen                  |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                     | Android-relevante Änderungen                |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                      | Erfolgreiche Main-CI oder manueller Dispatch |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, sodass Downstream-Consumer starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Warteschlange kommen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Änderungen an Plattformquellen gescopet.
- **Nur-Routing-Änderungen an CI, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Contract-Helfer-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel Contracts, vollständige Core-Shards, Bundled-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helferflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helfer, Package-Manager-Konfiguration und die CI-Workflow-Flächen gescopet, die diese Lane ausführen; nicht zugehörige Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel Contracts laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-All. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut danach die Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen Produktions-Knip-Durchlauf nur für Dependencies, gepinnt auf die neueste Knip-Version, mit deaktiviertem Mindest-Release-Alter von pnpm für die `dlx`-Installation) und `pnpm deadcode:unused-files` aus; letzteres vergleicht Knips Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs`. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtlich dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Flächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt ein GitHub-App-Token aus `CLAWSWEEPER_APP_PRIVATE_KEY` und dispatcht dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Actor, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw Gateway Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßige Öffnungen, Bearbeitungen, Bot-Aktivität, doppeltes Webhook-Rauschen und normaler Review-Traffic sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht-Android-gescopte Lane: Linux-Node-Shards, Bundled-Plugin-Shards, Channel Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der release-only Shard `agentic-plugins`, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine Full Suite für einen Release Candidate nicht durch einen weiteren Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen und dabei die Workflow-Datei aus dem ausgewählten Dispatch-Ref zu verwenden.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/Bundle-Prüfungen, geshardete Kanalvertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Node-Testaggregat-Verifizierer, Dokumentationsprüfungen, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, weniger gewichtige Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `android`                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr kosteten, als sie einsparten); install-smoke-Docker-Builds (die Wartezeitkosten der 32-vCPU-Warteschlange waren höher als die Einsparung)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                                         |

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
```

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, startet den manuellen `CI`-Workflow mit diesem Ziel, startet `Plugin Prerelease` für release-spezifische Nachweise zu Plugin/Paket/statik/Docker und startet `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix und Telegram-Lanes. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Nach der Veröffentlichung übergeben Sie `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane erneut gegen das veröffentlichte npm-Paket auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stufenmatrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
gezielten Handles für erneute Ausführungen.

Für einen Nachweis mit festgelegtem Commit auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` an der Ziel-SHA,
startet `Full Release Validation` von diesem fixierten Ref, verifiziert, dass jede untergeordnete
Workflow-`headSha` mit dem Ziel übereinstimmt, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt ebenfalls fehl, wenn ein untergeordneter Workflow mit einer
anderen SHA ausgeführt wurde.

`release_profile` steuert die Live-/Provider-Breite, die an die Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite Advisory-Provider-/Medienmatrix wünschen.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` ergänzt das stabile Provider-/Backend-Set.
- `full` führt die breite Advisory-Provider-/Medienmatrix aus.

Der Umbrella zeichnet die gestarteten untergeordneten Run-IDs auf, und der finale Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Runs erneut und hängt Tabellen mit den langsamsten Jobs für jeden untergeordneten Run an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifizierer-Job erneut aus, um das Umbrella-Ergebnis und die Zeitübersicht zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Kind, `plugin-prerelease` nur für das Plugin-Prerelease-Kind, `release-checks` für jedes Release-Kind oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` auf dem Umbrella. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live/E2E-Release-Pfad-Docker-Workflow als auch an den Paketakzeptanz-Shard. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren untergeordneten Jobs erneut gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der übergeordnete Monitor bricht jeden untergeordneten Workflow ab, den er
bereits gestartet hat, wenn der übergeordnete abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Run wartet. Release-Branch-/Tag-
Validierung und gezielte Gruppen für erneute Ausführungen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das untergeordnete Release-Live/E2E behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

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

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige erneute Ausführungen gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs verifizieren die Binärdateien nur vor dem Setup. Behalten Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern bei: Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsam genutztes Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, dann laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Skript-`timeout`-Obergrenzen unterhalb des Workflow-Job-Timeouts, sodass ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Quell-Docker-Ziel unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Es unterscheidet sich von normaler CI: Normale CI validiert den Quellbaum, während die Paketakzeptanz einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Nutzer nach der Installation oder Aktualisierung ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Docker-Images mit Paket-Digest vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu paketieren. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es wird ausgeführt, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn die Paketakzeptanz eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, die Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Beta-/Stable-Versionen.
- `source=ref` paketiert einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, ob der ausgewählte Commit aus der Branch-Historie des Repositorys oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem losgelösten Worktree und paketiert ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte für extern geteilte Artefakte aber angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der paketiert wird, wenn `source=ref` ist. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der Pfad für veröffentlichte npm-Spezifikationen bleibt für eigenständige Dispatches erhalten.

Die dedizierte Test-Richtlinie für Updates und Plugins, einschließlich lokaler Befehle,
Docker-Lanes, Eingaben für die Paketakzeptanz, Release-Standardwerte und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen die Paketakzeptanz mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; die Produktvalidierung für Paket/Update sollte mit der Paketakzeptanz beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine Baseline eines veröffentlichten Pakets. In der Paketakzeptanz ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes behalten diese Baseline bei. Setzen Sie `published_upgrade_survivor_baselines=release-history`, um die Lane über eine deduplizierte Verlaufsmatrix zu erweitern: die neuesten sechs stabilen Releases, `2026.4.23` und das letzte stabile Release vor `2026-03-15`. Setzen Sie `published_upgrade_survivor_scenarios=reported-issues`, um dieselben Baselines über Issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn die Frage eine vollständige Bereinigung veröffentlichter Updates ist und nicht die normale Breite der vollständigen Release-CI. Lokale aggregierte Läufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten Befehlsrezept `openclaw config set`, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Start des Gateway. Die frischen Windows-Lanes für paketierte Versionen und Installer prüfen außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der Cross-OS-Agent-Turn-Smoke für OpenAI verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn es gesetzt ist, andernfalls `openai/gpt-5.5`, damit Installations- und Gateway-Nachweis auf dem bevorzugten GPT-5-Testmodell bleiben.

### Legacy-Kompatibilitätsfenster

Die Paketakzeptanz hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten gefälschten Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass Install-Record- und Kein-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf auch vor bereits ausgelieferten lokalen Build-Metadaten-Stempeldateien warnen. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen führen dann zu Fehlern statt zu Warnungen oder Überspringen.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Paketakzeptanzlaufs mit der Zusammenfassung von `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Rerun-Befehle. Bevorzugen Sie es, das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut auszuführen, statt die vollständige Release-Validierung erneut auszuführen.

## Install-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** wird für Pull Requests ausgeführt, die Docker-/Paketoberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Kernoberflächen für Plugin/Channel/Gateway/Plugin SDK berühren, die die Docker-Smoke-Jobs ausführen. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke zum Löschen von Agents für den gemeinsamen Workspace aus, führt den Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, workflow-call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für den Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und den schnellen Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Logik für den geänderten Umfang bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er wird im nächtlichen Zeitplan und aus dem Workflow für Release-Prüfungen ausgeführt, und manuelle `Install Smoke`-Dispatches können ihn einschließen, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokaler Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, paketiert OpenClaw einmal als npm-Tarball und baut zwei gemeinsame Images aus `scripts/e2e/Dockerfile`:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt die Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Optionen

| Variable                               | Standardwert | Zweck                                                                                                                                    |
| -------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Provider-sensible Slot-Anzahl des Tail-Pools.                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                                                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10           | Obergrenze für gleichzeitige npm-Installations-Lanes.                                                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Obergrenze für gleichzeitige Multi-Service-Lanes.                                                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Staffelung zwischen Lane-Starts, um Erstellungsstürme des Docker-Daemons zu vermeiden; setzen Sie `0`, um keine Staffelung zu verwenden. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden strengere Obergrenzen.                                    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nicht gesetzt | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | nicht gesetzt | Kommagetrennte Liste exakter Lanes; überspringt Cleanup-Smoke, damit Agents eine einzelne fehlgeschlagene Lane reproduzieren können.      |

Eine Lane, die schwerer ist als ihre effektive Obergrenze, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Das lokale Aggregat führt Preflights für Docker aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Zeitmessungen für die Reihenfolge „längste zuerst“ und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welches Paket, welche Image-Art, welches Live-Image, welche Lane und welche Credential-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Das Script packt entweder OpenClaw über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id`; validiert das Tarball-Inventar; baut und pusht Bare-/Functional-GHCR-Docker-E2E-Images mit Paket-Digest-Tags über Blacksmiths Docker-Layer-Cache, wenn der Plan paketinstallierte Lanes benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images erneut, statt sie neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch wiederholt, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Blöcke

Release-Docker-Abdeckung läuft in kleineren, blockweise aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Block nur die Image-Art abruft, die er benötigt, und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Blöcke sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` aufgenommen, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen `openwebui`-Block. Update-Lanes für gebündelte Channels wiederholen bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Block lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeitmessungen, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Block-Jobs zu verwenden. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image für diesen Rerun lokal. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und Eingaben für vorbereitete Images, wenn diese Werte vorhanden sind, damit eine fehlgeschlagene Lane exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Docker-Suite des Release-Pfads täglich aus.

## Plugin-Prerelease

`Plugin Prerelease` ist aufwendigere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder von einem expliziten Operator ausgelöst wird. Normale Pull Requests, Pushes auf `main` und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt gebündelte Plugin-Tests auf acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-spezifische Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht dutzende Runner für Jobs von ein bis drei Minuten zu reservieren.

## QA-Lab

QA-Lab hat dedizierte CI-Lanes außerhalb des hauptsächlichen smart-gescopten Workflows.

- Der Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manuellem Dispatch; er baut die private QA-Runtime und vergleicht die agentischen Packs für Mock GPT-5.5 und Opus 4.6.
- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, damit der Channel-Vertrag von Live-Modell-Latenz und normalem Start des Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert Speichersuche, weil QA-Parität Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante Gates und Release-Gates und ergänzt `--fail-fast` nur, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt vor der Release-Freigabe außerdem die release-kritischen QA-Lab-Lanes aus; dessen QA-Parity-Gate führt Kandidaten- und Baseline-Packs als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob für den abschließenden Paritätsvergleich herunter.

Legen Sie den PR-Landing-Pfad nicht hinter `Parity gate`, außer die Änderung berührt tatsächlich die QA-Runtime, Modell-Pack-Parität oder eine Oberfläche, die der Parity-Workflow besitzt. Für normale Channel-, Konfigurations-, Dokumentations- oder Unit-Test-Fixes behandeln Sie ihn als optionales Signal und folgen stattdessen den gescopten CI-/Prüfnachweisen.

## CodeQL

Der Workflow `CodeQL` ist bewusst ein enger Sicherheitsscanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit sicherheitsbezogenen Abfragen hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Sicherheitsmatrix hoher Konfidenz aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standardeinstellungen.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Channel-Implementierungsverträge plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte          |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Network Guard, Web-Fetch und SSRF-Richtlinienoberflächen des Plugin SDK                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfen zur Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                               |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Paketmanager-Installation, Source-Loading und Vertrauensoberflächen des Plugin-SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von Workflow-Sanity akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse von Dependency-Builds aus hochgeladenem SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardeinstellungen, weil der macOS-Build auch bei sauberem Lauf die Laufzeit dominiert.

### Kategorien für kritische Qualität

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Sicherheitsbezug über enge, hochwertige Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht als Draft markierte PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Sicherheitscode, Core-Channel und Runtime gebündelter Channel-Plugins, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Glue, MCP-/Prozess-/ausgehender Zustellung, Provider-Runtime-/Modellkatalog, Session-Diagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Reply-Runtime aus. Änderungen an CodeQL-Konfiguration und Qualitätsworkflow führen alle zwölf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lern-/Iterations-Hooks, um einen einzelnen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierungs-, Geheimnis-, Sandbox-, Cron- und Gateway-Sicherheitsgrenzcode                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Servermethoden-Verträge                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Verträge für Kernkanäle und gebündelte Kanal-Plugin-Implementierungen                                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Model-/Provider-Dispatch, Auto-Reply-Dispatch und -Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory Host SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Glue-Code für die Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfen für ausgehende Sitzungsbindung/-zustellung, Oberflächen für Diagnoseereignisse/Log-Bundles und CLI-Verträge für Sitzungs-Doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch im Plugin SDK, Hilfen für Antwort-Payloads/Chunking/Runtime, Kanal-Antwortoptionen, Zustellungswarteschlangen und Hilfen für Sitzungs-/Thread-Bindung    |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Authentifizierung und -Erkennung, Provider-Runtime-Registrierung, Provider-Standardwerte/-Kataloge und Web-/Such-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Verträge für Core-Web-Fetch/Suche, Medien-IO, Medienverständnis, Bilderzeugung und Mediengenerierungs-Runtime                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Plugin-SDK-Einstiegspunkte                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paket-seitiger Plugin-SDK-Quellcode und Hilfen für Plugin-Paketverträge                                                                                              |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Erweiterungen für Swift-, Python- und gebündelte-Plugin-CodeQL sollten nur dann als begrenzte oder geshardete Folgearbeit wieder hinzugefügt werden, nachdem die schmalen Profile eine stabile Runtime und ein stabiles Signal haben.

## Wartungsworkflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er ausgeführt wird, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle Main-Änderungen abdecken kann, die seit dem letzten Dokumentationsdurchlauf angesammelt wurden.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht diese tägliche Aktivitätssperre. Die Spur erstellt einen gruppierten Vitest-Performancebericht der gesamten Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt den Bericht der gesamten Suite anschließend erneut aus und weist Änderungen zurück, die die Anzahl der bestandenen Baseline-Tests reduzieren. Wenn die Baseline fehlschlagende Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Bericht der gesamten Suite nach dem Agent muss bestehen, bevor etwas committet wird. Wenn `main` fortschreitet, bevor der Bot-Push landet, rebasiert die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für die Bereinigung doppelter PRs nach dem Landen. Standardmäßig läuft er als Dry Run und schließt nur ausdrücklich aufgelistete PRs, wenn `apply=true` ist. Bevor er GitHub mutiert, prüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Änderungsrouting

Die lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck sowie Core-Lint/Guards aus;
- reine Änderungen an Core-Tests führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Änderungen an Extension-Tests führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Versions-Bumps von Release-Metadaten führen gezielte Versions-/Konfigurations-/Root-Dependency-Checks aus;
- unbekannte Root-/Konfigurationsänderungen schlagen sicherheitshalber auf alle Check-Lanes um.

Das lokale Routing geänderter Tests lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Zuordnungen, dann Geschwistertests und Import-Graph-Abhängige. Die gemeinsame Group-Room-Zustellungskonfiguration ist eine der expliziten Zuordnungen: Änderungen an der Konfiguration für gruppensichtbare Antworten, am Zustellungsmodus für Quellantworten oder am System-Prompt des Message-Tools laufen durch die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine gemeinsame Standardwertänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repository-Root aus und bevorzugen Sie für breiten Nachweis eine frisch vorgewärmte Box. Bevor Sie ein langsames Gate auf einer Box ausgeben, die wiederverwendet wurde, abgelaufen ist oder gerade einen unerwartet großen Sync gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Sync-Zustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine frische auf, statt den Produkt-Testfehler zu debuggen. Setzen Sie für beabsichtigte PRs mit umfangreichen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Sanity-Lauf.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der Sync-Phase bleibt, ohne Ausgabe nach dem Sync zu erzeugen. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Guard zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repository-eigene zweite Remote-Box-Pfad für Linux-Nachweise, wenn Blacksmith nicht verfügbar ist oder wenn eigene Cloud-Kapazität vorzuziehen ist. Wärmen Sie eine Box auf, hydratisieren Sie sie über den Projektworkflow und führen Sie dann Befehle über die Crabbox-CLI aus:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` enthält die Standardwerte für Provider, Sync und GitHub-Actions-Hydration. Sie schließt lokale `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` enthält Checkout, Node-/pnpm-Setup, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe, die spätere `crabbox run --id <cbx_id>`-Befehle sourcen.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
