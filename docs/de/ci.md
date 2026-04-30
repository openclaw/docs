---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie untersuchen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder dessen Wiederholung
summary: CI-Jobgraph, Bereichs-Gates, Release-Dachbereiche und lokale Befehlsentsprechungen
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-30T18:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Der Job `preflight` klassifiziert den Diff und deaktiviert teure Lanes, wenn nur nicht zugehörige Bereiche geändert wurden. Manuelle `workflow_dispatch`-Läufe umgehen das intelligente Scoping absichtlich und fächern den vollständigen Graphen für Release Candidates und breite Validierung auf. Android-Lanes bleiben über `include_android` optional. Die reine Release-Abdeckung für Plugins befindet sich im separaten Workflow [`Plugin-Prerelease`](#plugin-prerelease) und läuft nur aus [`Vollständige Release-Validierung`](#full-release-validation) heraus oder durch einen expliziten manuellen Dispatch.

## Pipeline-Überblick

| Job                              | Zweck                                                                                              | Wann er läuft                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Plugins und erstellt das CI-Manifest    | Immer bei Nicht-Draft-Pushes und PRs         |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                      | Immer bei Nicht-Draft-Pushes und PRs         |
| `security-dependency-audit`      | Abhängigkeitsfreier Audit des Produktions-Lockfiles gegen npm-Advisories                           | Immer bei Nicht-Draft-Pushes und PRs         |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                            | Immer bei Nicht-Draft-Pushes und PRs         |
| `check-dependencies`             | Produktions-Knip-Durchlauf nur für Abhängigkeiten plus Guard für die Allowlist ungenutzter Dateien | Node-relevante Änderungen                    |
| `build-artifacts`                | Baut `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte  | Node-relevante Änderungen                    |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Vertrags-/Protokollprüfungen               | Node-relevante Änderungen                    |
| `checks-fast-contracts-channels` | Geshardete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                        | Node-relevante Änderungen                    |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Vertrags- und Plugin-Lanes                       | Node-relevante Änderungen                    |
| `check`                          | Gesplittetes Äquivalent des lokalen Haupt-Gates: Produktions-Typen, Lint, Guards, Testtypen und strikter Smoke-Test | Node-relevante Änderungen              |
| `check-additional`               | Architektur-, Boundary-, Plugin-Oberflächen-Guards, Package-Boundary- und Gateway-Watch-Shards     | Node-relevante Änderungen                    |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                           | Node-relevante Änderungen                    |
| `checks`                         | Verifier für gebaute Artefakt-Channel-Tests                                                        | Node-relevante Änderungen                    |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                       | Manueller CI-Dispatch für Releases           |
| `check-docs`                     | Docs-Formatierung, Lint und Prüfungen auf defekte Links                                            | Docs geändert                                |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                          | Python-Skill-relevante Änderungen            |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen bei gemeinsamen Runtime-Import-Specifiern | Windows-relevante Änderungen                 |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                 | macOS-relevante Änderungen                   |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                      | macOS-relevante Änderungen                   |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                                    | Android-relevante Änderungen                 |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                       | Erfolgreiche Main-CI oder manueller Dispatch |

## Reihenfolge für schnelles Fehlschlagen

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik für `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit Downstream-Konsumenten starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern schwerere Plattform- und Runtime-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR oder derselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, außer der neueste Lauf für dieselbe Ref schlägt ebenfalls fehl. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehler weiterhin melden, aber nicht mehr eingereiht werden, nachdem der gesamte Workflow bereits ersetzt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Vertrags-Helfer-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifestpfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Shards gebündelter Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helferoberflächen begrenzt ist, die die schnelle Aufgabe direkt ausführt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helfer, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zugehörige Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Shards für Agent-Runner, Dispatch und Commands/State-Routing aufgeteilt ist), und agentische Gateway-/Plugin-Konfigurationen werden auf die vorhandenen reinen Source-agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre eigenen dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway-Watch-, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut danach das Play-Debug-APK. Die Drittanbieter-Variante hat kein separates Source Set oder Manifest; ihre Unit-Test-Lane kompiliert die Variante weiterhin mit den SMS-/Call-Log-BuildConfig-Flags, vermeidet aber einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen Produktions-Knip-Durchlauf nur für Abhängigkeiten, gepinnt auf die neueste Knip-Version, wobei pnpm's Mindestveröffentlichungsalter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip nicht statisch auflösen kann.

## Manuelle Dispatches

Manuell ausgelöste CI-Läufe führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht-Android-gescopte Lane: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuell ausgelöste CI-Läufe führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android, indem er `include_android=true` übergibt. Statische Plugin-Prerelease-Prüfungen, der reine Release-Shard `agentic-plugins`, der vollständige Batch-Sweep der Plugins und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, ein Tag oder eine vollständige Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheits-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/gebündelte Prüfungen, aufgeteilte Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Node-Test-Aggregatverifizierer, Dokumentationsprüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; die Install-Smoke-Preflight verwendet ebenfalls von GitHub gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange eingereiht werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Plugin-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitiv genug, dass 8 vCPUs mehr kosteten, als sie einsparten); Docker-Builds für Install-Smoke (die Wartezeit in der 32-vCPU-Warteschlange kostete mehr, als sie einsparten)                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                   |

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

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, startet den manuellen `CI`-Workflow mit diesem Ziel, startet `Plugin Prerelease` für Release-spezifische Plugin-/Paket-/statische/Docker-Nachweise und startet `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-Release-Pfad-Suiten, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Er kann außerdem den Post-Publish-Workflow `NPM Telegram Beta E2E` ausführen, wenn eine veröffentlichte Paketspezifikation angegeben wird.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird:

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite beratende Provider-/Medien-Matrix aus.

Der Umbrella zeichnet die gestarteten untergeordneten Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Runs erneut und hängt Tabellen mit den langsamsten Jobs für jeden untergeordneten Run an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifizierer-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige untergeordnete CI, `release-checks` für jedes untergeordnete Release oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt ein erneuter Lauf einer fehlgeschlagenen Release-Box nach einer gezielten Korrektur begrenzt.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Docker-Workflow für den Live/E2E-Release-Pfad als auch an den Paketakzeptanz-Shard. Dadurch bleiben die Paket-Bytes über Release-Boxen hinweg konsistent und es wird vermieden, denselben Kandidaten in mehreren untergeordneten Jobs erneut zu packen.

## Live- und E2E-Shards

Das untergeordnete Release-Live/E2E behält eine breite native `pnpm test:live`-Abdeckung bei, führt sie jedoch als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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

Dadurch bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler leichter erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige erneute Läufe gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das vom Workflow `Live Media Runner Image` gebaut wird. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medien-Jobs verifizieren die Binärdateien nur vor dem Setup. Belassen Sie Docker-gestützte Live-Suiten auf normalen Blacksmith-Runnern, da Container-Jobs der falsche Ort sind, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, dann laufen die Docker-Live-Modell-, Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Wenn diese Shards das vollständige Source-Docker-Ziel unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit für doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Quellbaum, während die Paketakzeptanz einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert den Tarball-Bestand, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Abnahme veröffentlichter Beta-/Stable-Versionen.
- `source=ref` paketiert einen vertrauenswürdigen `package_ref`-Branch, ein Tag oder einen vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, ob der ausgewählte Commit über die Branch-Historie des Repositorys oder ein Release-Tag erreichbar ist, installiert Abhängigkeiten in einem losgelösten Worktree und paketiert ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der paketiert wird, wenn `source=ref` ist. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder, wobei der veröffentlichte npm-Spezifikationspfad für eigenständige Dispatches erhalten bleibt.

Release-Prüfungen rufen Package Acceptance mit `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` und `telegram_mode=mock-openai` auf. Docker-Chunks des Release-Pfads decken die überlappenden Paket-/Update-/Plugin-Lanes ab; Package Acceptance behält den artefaktnativen Kompatibilitätsnachweis für gebündelte Channels, den Offline-Plugin-Nachweis und den Telegram-Nachweis gegen denselben aufgelösten Paket-Tarball bei. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding-, Installer- und Plattformverhalten ab; die Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Windows-Lanes für paketierte und frische Installer-Installationen prüfen außerdem, dass ein installiertes Paket ein Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4-mini`, damit der Installations- und Gateway-Nachweis schnell und deterministisch bleibt.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus der vom Tarball abgeleiteten gefälschten Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Speicherorte für Installationsdatensätze lesen oder fehlende Marketplace-Persistenz von Installationsdatensätzen akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten erlauben, während weiterhin erforderlich bleibt, dass Installationsdatensatz und Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor lokal ausgelieferten Build-Metadaten-Stempeldateien warnen. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, anstatt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Install-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder zentrale Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke zum Löschen von Agents in einem geteilten Workspace aus, führt das Container-`gateway-network`-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus, wobei jeder Docker-Lauf eines Szenarios separat begrenzt ist.
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Release-Prüfungen per Workflow-Aufruf und Pull Requests bei, die wirklich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet Install-Smoke ein GHCR-Root-Dockerfile-Smoke-Image für den Ziel-SHA vor oder verwendet es wieder und führt anschließend QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes, einschließlich Merge-Commits, erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, paketiert OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen schlanken Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionsfähiges Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Obergrenze für gleichzeitige npm-Installations-Lanes.                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Staffelung zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keine Staffelung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihre effektive Grenze, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Das lokale Aggregat prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für eine längste-zuerst-Reihenfolge und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt mit `scripts/test-docker-all.mjs --plan-json` ab, welche Paket-, Image-Art-, Live-Image-, Lane- und Anmeldedatenabdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Er paketiert OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id`; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, anstatt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch wiederholt, sodass ein festhängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Aktuelle Release-Docker-Abschnitte sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` und `bundled-channels-contracts`. Der aggregierte Abschnitt `bundled-channels` bleibt für manuelle einmalige Wiederholungen verfügbar, und `plugins-runtime-core`, `plugins-runtime` sowie `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Wiederholungsalias für beide Provider-Installer-Lanes. Der Abschnitt `bundled-channels` führt aufgeteilte Lanes `bundled-channel-*` und `bundled-channel-update-*` aus, statt der seriellen All-in-one-Lane `bundled-channel-deps`.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Abdeckung des Release-Pfads dies anfordert, und behält einen eigenständigen Abschnitt `openwebui` nur für reine OpenWebUI-Ausführungen. Aktualisierungs-Lanes für gebündelte Kanäle wiederholen sich bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Abschnitt lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus statt der Abschnitt-Jobs. Dadurch bleibt die Fehlersuche für fehlgeschlagene Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diese Wiederholung. Generierte GitHub-Wiederholungsbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus.

## Plugin-Vorabversion

`Plugin Prerelease` ist eine teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Ausführungen lassen diese Suite deaktiviert. Sie verteilt gebündelte Plugin-Tests auf acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap, damit importlastige Plugin-Stapel keine zusätzlichen CI-Jobs erzeugen.

## QA Lab

QA Lab verfügt über dedizierte CI-Lanes außerhalb des wichtigsten smart eingegrenzten Workflows.

- Der Workflow `Parity gate` läuft bei passenden PR-Änderungen und manueller Ausführung; er baut die private QA-Runtime und vergleicht die agentischen Pakete mit Mock GPT-5.5 und Opus 4.6.
- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manueller Ausführung; er fächert das Mock-Paritäts-Gate, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mockqualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, damit der Kanalvertrag von Live-Modell-Latenz und normalem Start des Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Suiten für Live-Modelle, native Provider und Docker-Provider abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und ergänzt `--fail-fast` nur, wenn die ausgecheckte CLI dies unterstützt. Die CLI-Standardeinstellung und die manuelle Workflow-Eingabe bleiben `all`; eine manuelle Ausführung mit `matrix_profile=all` teilt die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli` auf.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Setzen Sie den PR-Landing-Pfad nicht hinter `Parity gate`, sofern die Änderung nicht tatsächlich die QA-Runtime, Modellpaket-Parität oder eine Oberfläche berührt, die dem Paritäts-Workflow gehört. Behandeln Sie es bei normalen Korrekturen an Kanälen, Konfiguration, Dokumentation oder Unit-Tests als optionales Signal und folgen Sie stattdessen den eingegrenzten CI-/Prüfnachweisen.

## CodeQL

Der Workflow `CodeQL` ist absichtlich ein enger erster Sicherheits-Scanner, nicht der vollständige Repository-Durchlauf. Tägliche, manuelle und Nicht-Draft-Pull-Request-Schutzläufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit Security-Queries hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Schutz bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Security-Matrix hoher Konfidenz aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben aus den PR-Standardeinstellungen heraus.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Baseline                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Kernverträge der Kanalimplementierung plus Kanal-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte                  |
| `/codeql-security-high/network-ssrf-boundary`     | Kern-SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und SSRF-Richtlinienoberflächen des Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Prozessausführungshelfer, ausgehende Zustellung und Gates für die Tool-Ausführung von Agenten                              |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Runtime-Abhängigkeits-Staging, Quellladen und Vertrauensoberflächen des Plugin-SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb täglicher Standardeinstellungen, weil der macOS-Build die Laufzeit selbst bei sauberem Zustand dominiert.

### Kategorien für kritische Qualität

`CodeQL Critical Quality` ist der passende Nicht-Sicherheits-Shard. Er führt ausschließlich JavaScript-/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Sicherheitsbezug über enge, hochwertige Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Schutz ist absichtlich kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agentenbefehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Sicherheitscode, Kernkanal- und gebündelter Kanal-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Verbindungscode, MCP-/Prozess-/ausgehender Zustellung, Provider-Runtime-/Modellkatalog, Sitzungsdiagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Reply-Runtime aus. Änderungen an CodeQL-Konfiguration und Qualitäts-Workflow führen alle zwölf PR-Qualitäts-Shards aus.

Manuelle Ausführung akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Bereich                                                                                                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code für die Sicherheitsgrenze des Gateway                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Verträge für Servermethoden                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-Kanal- und Implementierungsverträge für gebündelte Kanal-Plugins                                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie Laufzeitverträge der ACP-Control-Plane                                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Brücken, Hilfsfunktionen für Prozessüberwachung und Verträge für ausgehende Zustellung                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Laufzeitfassaden, Memory-Plugin-SDK-Aliase, Memory-Laufzeitaktivierungs-Glue und Memory-Doctor-Befehle                                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Oberflächen für Diagnoseereignisse/Log-Bundles und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch des Plugin-SDK, Antwort-Payload-/Chunking-/Laufzeit-Hilfsfunktionen, Kanalantwortoptionen, Zustellungswarteschlangen und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Erkennung, Provider-Laufzeitregistrierung, Provider-Standards/-Kataloge und Web-/Such-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap der Control-UI, lokale Persistenz, Gateway-Control-Flows und Laufzeitverträge der Task-Control-Plane                                                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/-Suche, Medien-IO, Medienverständnis, Bildgenerierung und Laufzeitverträge für Mediengenerierung                                                               |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                                        |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketbezogener Plugin-SDK-Quellcode und Hilfsfunktionen für Plugin-Paketverträge                                                                            |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Die CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte erst dann wieder als eingegrenzte oder geshardete Nacharbeit hinzugefügt werden, wenn die schmalen Profile eine stabile Laufzeit und ein stabiles Signal haben.

## Wartungsworkflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungsspur, die bestehende Dokumentation mit kürzlich gelandeten Änderungen abgleicht. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` bereits weitergelaufen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle Änderungen auf main abdecken kann, die seit dem letzten Dokumentationsdurchlauf aufgelaufen sind.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn ein anderer Workflow-Run-Aufruf an diesem UTC-Tag bereits gelaufen ist oder läuft. Ein manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performancebericht für die gesamte Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt den Bericht für die gesamte Suite anschließend erneut aus und lehnt Änderungen ab, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agenten muss bestehen, bevor etwas committet wird. Wenn `main` vor dem Bot-Push weiterläuft, rebased die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; widersprüchliche veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitsausrichtung wie der Docs-Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für die Bereinigung doppelter PRs nach dem Landen. Standardmäßig läuft er als Dry-Run und schließt nur explizit aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor GitHub mutiert wird, prüft er, dass der gelandete PR gemergt wurde und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Routing geänderter Dateien

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite Scope der CI-Plattform:

- Core-Produktionsänderungen führen Core-Prod- und Core-Test-Typecheck sowie Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck sowie Core-Lint aus;
- Plugin-Produktionsänderungen führen Plugin-Prod- und Plugin-Test-Typecheck sowie Plugin-Lint aus;
- reine Plugin-Teständerungen führen Plugin-Test-Typecheck sowie Plugin-Lint aus;
- Änderungen am öffentlichen Plugin-SDK oder an Plugin-Verträgen erweitern auf Plugin-Typecheck, weil Plugins von diesen Core-Verträgen abhängen (Vitest-Plugin-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Konfigurations-/Root-Dependency-Checks aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Das lokale Routing geänderter Tests befindet sich in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Mappings, danach Geschwistertests und Importgraph-Abhängige. Die Konfiguration für die Zustellung in gemeinsam genutzten Gruppenräumen ist eines der expliziten Mappings: Änderungen an der für Gruppen sichtbaren Antwortkonfiguration, am Quell-Antwortzustellmodus oder am System-Prompt des Message-Tools laufen über die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine Änderung an einem gemeinsam genutzten Standard vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige gemappte Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie für breite Nachweise eine frisch vorgewärmte Box. Bevor Sie ein langsames Gate auf einer Box ausgeben, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 getrackte Löschungen anzeigt. Das bedeutet in der Regel, dass der Remote-Sync-Status keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine frische vor, statt den Produkt-Testfehler zu debuggen. Für beabsichtigte PRs mit vielen Löschungen setzen Sie für diesen Sanity-Lauf `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`.

`pnpm testbox:run` beendet außerdem eine lokale Blacksmith-CLI-Ausführung, die länger als fünf Minuten ohne Ausgabe nach der Synchronisierung in der Synchronisierungsphase verbleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diese Schutzvorrichtung zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren Millisekundenwert.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
