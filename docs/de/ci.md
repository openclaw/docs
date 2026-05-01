---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
summary: CI-Jobgraph, Bereichs-Gates, Release-Dachläufe und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-01T06:41:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: aea06f9f336f9a478a284473b5c5f38730b87837b1acb0390161bf2c455f6c41
    source_path: ci.md
    workflow: 16
---

Die OpenClaw-CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen das intelligente Scoping absichtlich und fächern für Release-Kandidaten und breite Validierung den vollständigen Graphen auf. Android-Lanes bleiben über `include_android` opt-in. Release-spezifische Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin Prerelease`](#plugin-prerelease) und läuft nur über [`Full Release Validation`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest | Immer bei Nicht-Draft-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                | Immer bei Nicht-Draft-Pushes und PRs |
| `security-dependency-audit`      | Dependency-freier Audit des Produktions-Lockfiles gegen npm-Advisories                       | Immer bei Nicht-Draft-Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                      | Immer bei Nicht-Draft-Pushes und PRs |
| `check-dependencies`             | Produktions-Knip-Durchlauf nur für Dependencies plus Guard für die Allowlist ungenutzter Dateien | Node-relevante Änderungen           |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Built-Artifact-Prüfungen und wiederverwendbare Downstream-Artefakte | Node-relevante Änderungen           |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte Plugins, Plugin-Verträge und Protokolle | Node-relevante Änderungen           |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                 | Node-relevante Änderungen           |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes           | Node-relevante Änderungen           |
| `check`                          | Gesplittetes Äquivalent des lokalen Haupt-Gates: Produktions-Typen, Lint, Guards, Test-Typen und strikter Smoke | Node-relevante Änderungen           |
| `check-additional`               | Architektur-, Boundary-, Erweiterungsoberflächen-Guards, Package-Boundary- und Gateway-Watch-Shards | Node-relevante Änderungen           |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                     | Node-relevante Änderungen           |
| `checks`                         | Verifier für Built-Artifact-Channel-Tests                                                    | Node-relevante Änderungen           |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                 | Manueller CI-Dispatch für Releases  |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                            | Docs geändert                       |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                    | Python-Skill-relevante Änderungen   |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen bei gemeinsamen Runtime-Import-Spezifizierern | Windows-relevante Änderungen        |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                           | macOS-relevante Änderungen          |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                | macOS-relevante Änderungen          |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                | Android-relevante Änderungen        |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                 | Erfolg der Haupt-CI oder manueller Dispatch |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik für `docs-scope` und `changed-scope` besteht aus Schritten innerhalb dieses Jobs, nicht aus eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattformmatrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Consumer starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, es sei denn, der neueste Lauf für denselben Ref schlägt ebenfalls fehl. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Queue gehen, nachdem der gesamte Workflow bereits ersetzt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht dauerhaft blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen für sich genommen aber keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen sowie schmale Helper-/Test-Routing-Änderungen an Plugin-Verträgen** verwenden einen schnellen Node-only-Manifest-Pfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen begrenzt ist, die die schnelle Aufgabe direkt ausführt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien werden gesplittet oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-alls. Include-Pattern-Shards erfassen Timing-Einträge mit dem CI-Shard-Namen, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topology-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source-Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor dennoch mit den SMS-/Call-Log-`BuildConfig`-Flags und vermeidet zugleich einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen Produktions-Knip-Durchlauf nur für Dependencies, gepinnt auf die neueste Knip-Version, wobei das Mindest-Release-Alter von pnpm für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtlich dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip nicht statisch auflösen kann.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht-Android-gescopte Lane: Linux-Node-Shards, Shards für gebündelte Plugins, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; das vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der release-spezifische `agentic-plugins`-Shard, der vollständige Batch-Sweep für Erweiterungen und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validation-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine Full-Suite für einen Release-Kandidaten nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Mit der optionalen Eingabe `target_ref` kann ein vertrauenswürdiger Caller diesen Graphen gegen einen Branch, ein Tag oder einen vollständigen Commit-SHA ausführen und dabei die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwenden.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/gebündelte Prüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Node-Test-Aggregatprüfer, Dokumentationsprüfungen, Python-Skills, workflow-sanity, labeler, auto-response; der install-smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher eingereiht werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Erweiterungs-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `android`                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten, als sie einsparten); install-smoke-Docker-Builds (32-vCPU-Wartezeit kostete mehr, als sie einsparten)                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                                            |

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

`Full Release Validation` ist der manuelle übergreifende Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, startet den manuellen `CI`-Workflow mit diesem Ziel, startet `Plugin Prerelease` für release-spezifische Plugin-/Paket-/statische-/Docker-Nachweise und startet `OpenClaw Release Checks` für Installations-Smoke-Tests, Paketakzeptanz, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Er kann auch den Post-Publish-Workflow `NPM Telegram Beta E2E` ausführen, wenn eine veröffentlichte Paketspezifikation angegeben wird.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
gezielte Handles für erneute Ausführungen.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite beratende Provider-/Medienmatrix wünschen.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die gestarteten Child-Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Schlussfolgerungen der Child-Runs erneut und hängt Tabellen mit den langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. So bleibt eine erneute Ausführung einer fehlgeschlagenen Release-Box nach einer gezielten Korrektur begrenzt.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live/E2E-Docker-Workflow des Release-Pfads als auch an den Paketakzeptanz-Shard. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs erneut gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den
er bereits gestartet hat, wenn der Parent abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Run wartet. Release-Branch-/Tag-
Validierung und gezielte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live/E2E-Child behält eine breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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

Das behält dieselbe Dateiabdeckung bei, während langsame Live-Provider-Fehler leichter erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut durch den Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs prüfen vor dem Setup nur die Binärdateien. Lassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern laufen — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, anschließend laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Timeout-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, sodass ein festhängender Container oder Bereinigungspfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Ziel unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Quellbaum, während die Paketakzeptanz einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Aktualisierung ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsam genutzten Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; eigenständige Telegram-Dispatches können weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, die Docker-Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Beta-/Stable-Acceptance.
- `source=ref` packt einen vertrauenswürdigen Branch, Tag oder vollständigen Commit-SHA aus `package_ref`. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit aus der Branch-Historie des Repositorys oder aus einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem abgekoppelten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` ist. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Blöcke mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängig ist. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` erneut; der Pfad für die veröffentlichte npm-Spezifikation bleibt für eigenständige Dispatches erhalten.

Release-Prüfungen rufen Package Acceptance mit `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` und `telegram_mode=mock-openai` auf. Release-Pfad-Docker-Blöcke decken die überlappenden Paket-/Update-/Plugin-Lanes ab; Package Acceptance behält den artefaktnativen Kompatibilitätsnachweis für gebündelte Kanäle, das Offline-Plugin und den Telegram-Nachweis gegen denselben aufgelösten Paket-Tarball bei. Cross-OS-Release-Prüfungen decken weiterhin betriebssystemspezifisches Onboarding, Installer- und Plattformverhalten ab; die Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paket-Baseline. In Package Acceptance ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Lokale Läufe können `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` auf ein exaktes Paket wie `openclaw@2026.4.15` setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten Befehlsrezept `openclaw config set` und zeichnet anschließend Rezeptschritte in `summary.json` auf. Breitere Abdeckung früherer Versionen sollte Package Acceptance über exakte Werte von `published_upgrade_survivor_baseline` shardieren. Die Windows-Packaged- und Installer-Fresh-Lanes verifizieren außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4-mini`, sodass Installations- und Gateway-Nachweis schnell und deterministisch bleiben.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus der vom Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlende persistierte `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, muss aber weiterhin verlangen, dass Install-Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor lokalen Build-Metadatenstempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder zu überspringen.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung von `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den Child-Run `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Protokolle, Phasen-Timings und Befehle zum erneuten Ausführen. Ziehen Sie es vor, das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut auszuführen, statt die vollständige Release-Validierung erneut auszuführen.

## Install-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Core-Plugin-/Kanal-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für das Löschen von Agents im Shared Workspace aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Plugins und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein Root-Dockerfile-Smoke-Image aus GHCR für den Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs aus, sodass Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Prüfungs-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, aber Pull Requests und `main`-Pushes tun dies nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsam genutztes Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsam genutzte `scripts/e2e/Dockerfile`-Images:

- einen nackten Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt dann Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Werte

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl im Hauptpool für normale Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl im Provider-sensitiven Tail-Pool.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Obergrenze für gleichzeitige npm-Install-Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                              |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Staffelung zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0`, um nicht zu staffeln. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihre effektive Obergrenze, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Das lokale Aggregat führt Docker-Preflights aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Zeiten für die Reihenfolge „längste zuerst“ und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json` ab, welche Paket-, Image-Art, welches Live-Image, welche Lane und welche Credential-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt entweder OpenClaw über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht über Blacksmiths Docker-Layer-Cache paket-digest-getaggte bare/functional GHCR-Docker-E2E-Images, wenn der Plan paketinstallierte Lanes benötigt; und verwendet bereitgestellte `docker_e2e_bare_image`-/`docker_e2e_functional_image`-Eingaben oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch wiederholt, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die Image-Art zieht, die er benötigt, und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` und `bundled-channels-contracts`. Der aggregierte Chunk `bundled-channels` bleibt für manuelle einmalige Wiederholungen verfügbar, und `plugins-runtime-core`, `plugins-runtime` sowie `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte Alias für manuelle Wiederholungen beider Provider-Installer-Lanes. Der Chunk `bundled-channels` führt aufgeteilte `bundled-channel-*`- und `bundled-channel-update-*`-Lanes aus, statt der seriellen All-in-one-Lane `bundled-channel-deps`.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für OpenWebUI-only-Dispatches einen eigenständigen `openwebui`-Chunk. Update-Lanes für gebündelte Channels versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeiten, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images statt der Chunk-Jobs aus, wodurch das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt bleibt und das Paketartefakt für diesen Lauf vorbereitet, heruntergeladen oder wiederverwendet wird; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diese Wiederholung. Generierte GitHub-Wiederholungsbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane genau das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung, daher ist es ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite ausgeschaltet. Er balanciert Tests gebündelter Plugins über acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases genutzte Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für Jobs von ein bis drei Minuten zu reservieren.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des hauptsächlichen intelligent eingegrenzten Workflows.

- Der Workflow `Parity gate` läuft bei passenden PR-Änderungen und manuellem Dispatch; er baut die private QA-Runtime und vergleicht die agentischen Mock-Packs GPT-5.5 und Opus 4.6.
- Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und bei manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und Mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Memory-Suche, weil QA-Parität das Memory-Verhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, Native-Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; manueller `matrix_profile=all`-Dispatch shardet vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Parity-Gate führt die Kandidaten- und Baseline-Packs als parallele Lane-Jobs aus und lädt danach beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Legen Sie den PR-Landing-Pfad nicht hinter `Parity gate`, es sei denn, die Änderung berührt tatsächlich die QA-Runtime, Modellpack-Parität oder eine Oberfläche, die der Parity-Workflow besitzt. Behandeln Sie es bei normalen Channel-, Konfigurations-, Dokumentations- oder Unit-Test-Fixes als optionales Signal und folgen Sie stattdessen den eingegrenzten CI-/Prüfungsnachweisen.

## CodeQL

Der Workflow `CodeQL` ist absichtlich ein enger First-Pass-Sicherheitsscanner, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit hochvertrauenswürdigen Sicherheitsabfragen, die auf hohe/kritische `security-severity` gefiltert sind.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe hochvertrauenswürdige Sicherheitsmatrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Kernverträge der Channel-Implementierung plus Channel-Plugin-Runtime, Gateway, Plugin-SDK, Secrets, Audit-Berührungspunkte           |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Network-Guard, Web-Fetch und SSRF-Policy-Oberflächen des Plugin-SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfen zur Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                                   |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Runtime-Dependency-Staging, Source-Loading und Vertrauensoberflächen des Plugin-SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Dependency-Build-Ergebnisse aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb täglicher Standards, weil der macOS-Build selbst im sauberen Zustand die Laufzeit dominiert.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der passende Nicht-Sicherheits-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Sicherheitsbezug über enge, hochwertige Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist absichtlich kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Config-Schema-/Migration-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Core-Channel- und gebündelter Channel-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Verklebung, MCP-/Prozess-/ausgehender Zustellung, Provider-Runtime-/Modellkatalog, Sitzungsdiagnose-/Zustellungsqueues, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Reply-Runtime aus. CodeQL-Konfigurations- und Qualitätsworkflow-Änderungen führen alle zwölf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks, um einen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code für die Gateway-Sicherheitsgrenze                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Verträge für Servermethoden                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Verträge für Core-Kanäle und die Implementierung gebündelter Kanal-Plugins                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie Laufzeitverträge der ACP-Steuerungsebene                                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Brücken, Hilfen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Laufzeit-Fassaden, Memory-Plugin-SDK-Aliase, Glue-Code zur Aktivierung der Memory-Laufzeit und Memory-Doctor-Befehle                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfen zur Bindung/Zustellung ausgehender Sitzungen, Oberflächen für Diagnoseereignis-/Log-Bundles und CLI-Verträge für Sitzungs-Doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound-Antwort-Dispatch des Plugin-SDK, Hilfen für Antwort-Payloads/Chunking/Laufzeit, Kanalantwortoptionen, Zustellungswarteschlangen und Hilfen zur Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Authentifizierung und -Erkennung, Provider-Laufzeitregistrierung, Provider-Standardwerte/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Steuerungsabläufe und Laufzeitverträge der Task-Steuerungsebene                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/-Search, Medien-IO, Medienverständnis, Bildgenerierung und Laufzeitverträge für Mediengenerierung                                                            |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Plugin-SDK-Einstiegspunkte                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketbezogener Plugin-SDK-Quellcode und Hilfen für Plugin-Paketverträge                                                                                   |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Die CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte nur als abgegrenzte oder geshardete Folgearbeit wieder hinzugefügt werden, nachdem die schmalen Profile stabile Laufzeit und ein stabiles Signal haben.

## Wartungsworkflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergerückt ist oder wenn innerhalb der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Ein manueller Dispatch umgeht diese tägliche Aktivitätssperre. Die Spur erstellt einen gruppierten Vitest-Performancebericht für die gesamte Suite, lässt Codex nur kleine, Coverage-erhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt anschließend den Bericht für die gesamte Suite erneut aus und verwirft Änderungen, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agenten muss bestehen, bevor etwas committet wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebased die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; kollidierende veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Bereinigung doppelter Einträge nach dem Landen. Standardmäßig läuft er als Dry-Run und schließt nur explizit aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor GitHub verändert wird, prüft er, dass der gelandete PR gemergt ist und dass jeder doppelte PR entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Prüfgates und Änderungsrouting

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Prüfgate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Core-Produktionsänderungen führen Core-Prod- und Core-Test-Typecheck sowie Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Extension-Produktionsänderungen führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Teständerungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin-SDK oder Plugin-Vertrag erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Konfigurations-/Root-Dependency-Prüfungen aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicherheitshalber auf alle Prüflanes zurück.

Das lokale Changed-Test-Routing befindet sich in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Zuordnungen, danach Geschwistertests und Import-Graph-Abhängige. Die gemeinsame Zustellungskonfiguration für Gruppenräume ist eine der expliziten Zuordnungen: Änderungen an der gruppensichtbaren Antwortkonfiguration, am Quell-Antwortzustellmodus oder am System-Prompt des Nachrichtentools laufen durch die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine Änderung eines gemeinsamen Standardwerts vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox vom Repo-Root aus und bevorzugen Sie für breite Nachweise eine frisch vorgewärmte Box. Bevor Sie ein langsames Gate auf einer Box ausgeben, die wiederverwendet wurde, abgelaufen ist oder gerade einen unerwartet großen Sync gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` in der Box aus.

Die Sanity-Prüfung schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Sync-Zustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine neue vor, statt den Produkttestfehler zu debuggen. Für beabsichtigte PRs mit vielen Löschungen setzen Sie für diesen Sanity-Lauf `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten ohne Ausgabe nach dem Sync in der Sync-Phase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Guard zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
