---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Lauf oder eine Wiederholung der Release-Validierung
summary: CI-Job-Graph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-30T06:43:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 256d47dacac7d5c49c8ad614fba2efdd94332d69903d8b70c653775b28bc3fd5
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Der Job `preflight` klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen das intelligente Scoping absichtlich und fächern den vollständigen Graphen für Release-Kandidaten und breite Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Release-spezifische Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Vorabrelease`](#plugin-prerelease) und läuft nur aus [`Vollständige Release-Validierung`](#full-release-validation) oder einem expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                     | Wann er läuft                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest     | Immer bei Nicht-Draft-Pushes und PRs               |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                             | Immer bei Nicht-Draft-Pushes und PRs               |
| `security-dependency-audit`      | Dependency-freier Audit des Produktions-Lockfiles gegen npm-Advisories                                    | Immer bei Nicht-Draft-Pushes und PRs               |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                                   | Immer bei Nicht-Draft-Pushes und PRs               |
| `check-dependencies`             | Reiner Produktions-Knip-Durchlauf für Dependencies plus Guard für die Allowlist ungenutzter Dateien       | Node-relevante Änderungen                          |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte     | Node-relevante Änderungen                          |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Bundle-/Plugin-Vertrags-/Protokollprüfungen                        | Node-relevante Änderungen                          |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                              | Node-relevante Änderungen                          |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, Bundle-, Vertrags- und Erweiterungs-Lanes                           | Node-relevante Änderungen                          |
| `check`                          | Gesplittetes Äquivalent des lokalen Haupt-Gates: Prod-Typen, Lint, Guards, Testtypen und strenger Smoke   | Node-relevante Änderungen                          |
| `check-additional`               | Architektur-, Boundary-, Erweiterungsoberflächen-, Paket-Boundary- und Gateway-Watch-Shards               | Node-relevante Änderungen                          |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                                  | Node-relevante Änderungen                          |
| `checks`                         | Verifier für Channel-Tests mit gebautem Artefakt                                                          | Node-relevante Änderungen                          |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                              | Manueller CI-Dispatch für Releases                 |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                         | Docs geändert                                      |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                 | Für Python-Skills relevante Änderungen             |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen für gemeinsame Runtime-Import-Specifier          | Windows-relevante Änderungen                       |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                        | macOS-relevante Änderungen                         |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                             | macOS-relevante Änderungen                         |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                             | Android-relevante Änderungen                       |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                              | Erfolg der Main-CI oder manueller Dispatch         |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik für `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Nutzer starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Warteschlange gehen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als ob jeder gescopte Bereich geändert wurde.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht selbst Windows-, Android- oder macOS-native Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Vertrags-Helper-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Bundled-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien werden geteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards geteilt wird), und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden Source-only-agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut sind.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut danach das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source-Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor dennoch mit den SMS-/Anrufprotokoll-`BuildConfig`-Flags, während ein doppelter Debug-APK-Paketierungsjob bei jedem Android-relevanten Push vermieden wird.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` aus (einen reinen Produktions-Knip-Durchlauf für Dependencies, gepinnt auf die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) sowie `pnpm deadcode:unused-files`, das Knips Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip nicht statisch auflösen kann.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht-Android-gescopte Lane: Linux-Node-Shards, Bundled-Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android, indem er `include_android=true` übergibt. Statische Plugin-Vorabrelease-Prüfungen, der release-spezifische Shard `agentic-plugins`, der vollständige Batch-Sweep für Erweiterungen und Plugin-Vorabrelease-Docker-Lanes sind aus CI ausgeschlossen. Die Docker-Vorabrelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine Release-Candidate-Full-Suite nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` lässt einen vertrauenswürdigen Aufrufer diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA ausführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/gebündelte Prüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Node-Test-Aggregat-Verifizierer, Dokumentationsprüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; Install-Smoke-Preflight nutzt ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gestellt werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Plugin-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `android`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-empfindlich genug, dass 8 vCPU mehr gekostet haben, als sie eingespart haben); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie eingespart hat)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                |

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

`Full Release Validation` ist der manuelle Umbrella-Workflow für „vor dem Release alles ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, startet den manuellen `CI`-Workflow mit diesem Ziel, startet `Plugin Prerelease` für release-spezifische Plugin-/Paket-/statische/Docker-Nachweise und startet `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Er kann außerdem den Post-Publish-Workflow `NPM Telegram Beta E2E` ausführen, wenn eine veröffentlichte Paketspezifikation angegeben wird.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird:

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die gestarteten untergeordneten Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Runs erneut und fügt Tabellen mit den langsamsten Jobs für jeden untergeordneten Run an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifiziererjob erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt eine erneute Ausführung einer fehlgeschlagenen Release-Box nach einem fokussierten Fix begrenzt.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live/E2E-Docker-Workflow für den Release-Pfad als auch an den Package-Acceptance-Shard. Dadurch bleiben die Paket-Bytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren untergeordneten Jobs erneut gepackt werden.

## Live- und E2E-Shards

Das Release-Live/E2E-Child behält die breite native `pnpm test:live`-Abdeckung bei, führt sie aber über `scripts/test-live-shard.mjs` als benannte Shards statt als einen seriellen Job aus:

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
- geteilte Medien-Audio-/Video-Shards und Provider-gefilterte Musik-Shards

Dadurch bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler einfacher erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige erneute Ausführungen gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs verifizieren die Binaries vor dem Setup nur noch. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal, danach laufen die Docker-Live-Modell-, Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Wenn diese Shards das vollständige Source-Docker-Ziel unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Package Acceptance

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Es unterscheidet sich vom normalen CI: Normales CI validiert den Quellbaum, während Package Acceptance einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere zielgerichtete `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele zielgerichtete Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Beta-/Stable-Abnahmen.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem getrennten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` ist. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder, wobei der veröffentlichte npm-Spec-Pfad für eigenständige Dispatches erhalten bleibt.

Release-Prüfungen rufen Package Acceptance mit `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` und `telegram_mode=mock-openai` auf. Docker-Chunks des Release-Pfads decken die überlappenden Package-/Update-/Plugin-Lanes ab; Package Acceptance behält den artefaktnativen Kompatibilitätsnachweis für gebündelte Kanäle, das Offline-Plugin und den Telegram-Nachweis gegen denselben aufgelösten Paket-Tarball bei. Cross-OS-Release-Prüfungen decken weiterhin betriebssystemspezifisches Onboarding, Installer- und Plattformverhalten ab; die Package-/Update-Produktvalidierung sollte mit Package Acceptance beginnen. Die Windows-Packaged- und Installer-Fresh-Lanes verifizieren außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4-mini`, damit der Installations- und Gateway-Nachweis schnell und deterministisch bleibt.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Subcase `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus der aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlende persistierte `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten erlauben, muss aber weiterhin verlangen, dass der Install-Record und das Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor lokalen Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Package-Oberflächen, Änderungen an Paket/Manifest gebündelter Plugins oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den Shared-Workspace-CLI-Smoke für das Löschen von Agents aus, führt den Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für eine gebündelte Erweiterung und führt das begrenzte gebündelte-Plugin-Docker-Profil unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Szenario-Docker-Lauf ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Release-Prüfungen per Workflow-Call und Pull Requests bei, die wirklich Installer-/Package-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und den schnellen gebündelte-Plugin-Docker-E2E als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Installations-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, aber Pull Requests und `main`-Pushes tun dies nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokaler Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standardwert | Zweck                                                                                       |
| -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Slot-Anzahl des Hauptpools für normale Lanes.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Slot-Anzahl des Provider-sensiblen Tail-Pools.                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Limit für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10           | Limit für gleichzeitige npm-Install-Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Limit für gleichzeitige Multi-Service-Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Versatz zwischen Lane-Starts, um Docker-Daemon-Create-Stürme zu vermeiden; setzen Sie `0` für keinen Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset        | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset        | Kommaseparierte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihr effektives Limit ist, kann weiterhin aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für Longest-First-Sortierung und stoppt standardmäßig die Planung neuer gepoolter Lanes nach dem ersten Fehler.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Typ-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über den Docker-Layer-Cache von Blacksmith, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Package-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein festhängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur den benötigten Image-Typ zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` und `bundled-channels-contracts`. Der aggregierte `bundled-channels`-Chunk bleibt für manuelle einmalige Wiederholungen verfügbar, und `plugins-runtime-core`, `plugins-runtime` sowie `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte Alias für manuelle Wiederholungen für beide Provider-Installer-Lanes. Der `bundled-channels`-Chunk führt aufgeteilte `bundled-channel-*`- und `bundled-channel-update-*`-Lanes aus, statt der seriellen All-in-one-Lane `bundled-channel-deps`.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn die vollständige Release-Pfad-Abdeckung dies anfordert, und behält einen eigenständigen `openwebui`-Chunk nur für reine OpenWebUI-Dispatches. Bundled-Channel-Update-Lanes versuchen transiente npm-Netzwerkfehler einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen für langsame Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus statt der Chunk-Jobs. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Package-Artefakt wird für diesen Lauf vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diese Wiederholung. Generierte GitHub-Wiederholungsbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt dasselbe Package und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus.

## Plugin-Vorabversion

`Plugin Prerelease` ist aufwendigere Produkt-/Package-Abdeckung und daher ein separater Workflow, der von `Full Release Validation` oder einem ausdrücklichen Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Sie verteilt gebündelte Plugin-Tests auf acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des hauptsächlichen smart-scoped Workflows.

- Der Workflow `Parity gate` läuft bei passenden PR-Änderungen und manuellem Dispatch; er baut die private QA-Runtime und vergleicht die agentischen Mock-Pakete GPT-5.5 und Opus 4.6.
- Der Workflow `QA-Lab - All Lanes` läuft jede Nacht auf `main` und bei manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane sowie die Live-Telegram- und Live-Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und Mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Start des Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt vor der Release-Freigabe auch die releasekritischen QA-Lab-Lanes aus; dessen QA-Parity-Gate führt Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den abschließenden Paritätsvergleich herunter.

Legen Sie den PR-Landing-Pfad nicht hinter `Parity gate`, es sei denn, die Änderung berührt tatsächlich die QA-Runtime, Modellpaket-Parität oder eine Oberfläche, die dem Parity-Workflow gehört. Behandeln Sie ihn bei normalen Channel-, Konfigurations-, Dokumentations- oder Unit-Test-Fixes als optionales Signal und folgen Sie stattdessen der eingegrenzten CI-/Prüfnachweislage.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein schmaler Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Entwurf markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit hochzuverlässigen Security-Abfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe hochzuverlässige Security-Matrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Security-Kategorien

| Kategorie                                         | Oberfläche                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Baseline                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Channel-Implementierungsverträge plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Touchpoints                  |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und SSRF-Policy-Oberflächen des Plugin SDK                                          |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfen zur Prozessausführung, ausgehende Zustellung und Agent-Gates für Tool-Ausführung                                  |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Runtime-Abhängigkeits-Staging, Quellladevorgänge und Vertrauensoberflächen des Plugin-SDK-Package-Vertrags |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von Workflow Sanity akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse von Dependency-Builds aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build die Laufzeit selbst bei sauberem Lauf dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der passende Nicht-Security-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Security-Bezug über schmale, besonders wertvolle Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht als Entwurf markierte PRs führen nur die passenden Shards `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Core-Channel- und gebündelter Channel-Plugin-Runtime, Gateway-Protokoll-/Servermethode, Memory-Runtime-/SDK-Glue, MCP/Prozess/ausgehender Zustellung, Provider-Runtime/Modellkatalog, Sitzungsdiagnose/Zustellwarteschlangen, Plugin-Loader, Plugin-SDK/Package-Vertrag oder Plugin-SDK-Antwort-Runtime aus. CodeQL-Konfigurations- und Quality-Workflow-Änderungen führen alle elf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Lehr-/Iterations-Hooks, um einen einzelnen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth-, Secret-, Sandbox-, Cron- und Gateway-Code für Sicherheitsgrenzen                                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Servermethoden-Verträge                                                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Verträge für Core-Kanal- und gebündelte Kanal-Plugin-Implementierungen                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Dispatch und Warteschlangen für automatische Antworten sowie ACP-Control-Plane-Laufzeitverträge                                          |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Laufzeitfassaden, Memory-Plugin-SDK-Aliasse, Glue-Code zur Memory-Laufzeitaktivierung und Memory-Doctor-Befehle                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Protokollpaket-Oberflächen und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin-SDK-Dispatch für eingehende Antworten, Hilfen für Antwort-Payloads/Chunking/Laufzeit, Kanal-Antwortoptionen, Zustellungswarteschlangen und Hilfen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Auth und -Erkennung, Provider-Laufzeitregistrierung, Provider-Standards/Kataloge sowie Registries für Web/Suche/Abruf/Embeddings               |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Steuerungsflüsse und Task-Control-Plane-Laufzeitverträge                                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Abruf/Suche, Medien-IO, Medienverständnis, Bildgenerierung und Laufzeitverträge für Mediengenerierung                                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, öffentliche Oberflächen- und Plugin-SDK-Einstiegspunkt-Verträge                                                                                                    |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketbezogener Plugin-SDK-Quellcode und Hilfen für Plugin-Paketverträge                                                                                              |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als begrenzte oder geshardete Folgearbeit hinzugefügt werden, wenn die schmalen Profile eine stabile Laufzeit und ein stabiles Signal haben.

## Wartungsworkflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungsspur, um vorhandene Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` bereits weitergelaufen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Änderungen auf main abdecken kann.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performancebericht für die vollständige Suite, lässt Codex nur kleine, die Abdeckung erhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt anschließend den Bericht für die vollständige Suite erneut aus und lehnt Änderungen ab, die die Baseline-Anzahl bestandener Tests verringern. Wenn die Baseline fehlgeschlagene Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agenten muss bestehen, bevor etwas committed wird. Wenn `main` vor dem Bot-Push weiterläuft, rebased die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; widersprüchliche veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs-Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow zur Bereinigung doppelter PRs nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` ist. Bevor GitHub verändert wird, prüft er, dass der gelandete PR gemerged wurde und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Routing geänderter Dateien

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck sowie Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Erweiterungs-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Teständerungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin-SDK oder an Plugin-Verträgen erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsanhebungen führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicher auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing liegt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Testbearbeitungen führen sich selbst aus, Quellcodeänderungen bevorzugen explizite Zuordnungen, dann Geschwistertests und Importgraph-Abhängige. Die Shared-Group-Room-Zustellungskonfiguration ist eine der expliziten Zuordnungen: Änderungen an der für Gruppen sichtbaren Antwortkonfiguration, am Zustellungsmodus für Quellantworten oder am Systemprompt des Message-Tools laufen über die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine Änderung am gemeinsamen Standard vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie für breiten Nachweis eine frisch vorgewärmte Box. Bevor Sie ein langsames Gate für eine Box aufwenden, die wiederverwendet wurde, abgelaufen ist oder gerade einen unerwartet großen Sync gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 getrackte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Sync-Zustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine neue auf, statt den Produkt-Testfehler zu debuggen. Für absichtliche PRs mit vielen Löschungen setzen Sie für diesen Sanity-Lauf `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der Sync-Phase bleibt, ohne Ausgabe nach dem Sync zu erzeugen. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Guard zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
