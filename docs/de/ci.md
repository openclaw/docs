---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub-Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern die ClawSweeper-Dispatch-Logik oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Auftragsgraph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-07-04T06:26:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei jedem Push auf `main` und bei jedem Pull Request ausgeführt. Kanonische
`main`-Pushes durchlaufen zuerst ein 90-sekündiges Aufnahmefenster für Hosted-Runner.
Die bestehende `CI`-Concurrency-Gruppe bricht diesen wartenden Lauf ab, wenn ein neuerer
Commit landet, sodass sequenzielle Merges nicht jeweils eine vollständige Blacksmith-
Matrix registrieren. Pull Requests und manuelle Dispatches überspringen die Wartezeit. Der `preflight`-Job
klassifiziert anschließend den Diff und schaltet teure Lanes aus, wenn sich nur nicht betroffene
Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen Smart
Scoping bewusst und fächern den vollständigen Graph für Release-Kandidaten und breite
Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Die Plugin-Abdeckung nur für
Releases liegt im separaten Workflow [`Plugin-Vorabversion`](#plugin-prerelease)
und läuft nur aus [`Vollständige Release-Validierung`](#full-release-validation)
oder einem expliziten manuellen Dispatch heraus.

## Pipeline-Übersicht

| Job                                | Zweck                                                                                                   | Wann er läuft                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest                   | Immer bei Nicht-Draft-Pushes und PRs                  |
| `runner-admission`                 | Gehostetes 90-Sekunden-Debounce für kanonische `main`-Pushes, bevor Blacksmith-Arbeit registriert wird                | Jeder CI-Lauf; Sleep nur bei kanonischen `main`-Pushes |
| `security-fast`                    | Erkennung privater Schlüssel, Audit geänderter Workflows über `zizmor` und Audit des Production-Lockfiles                 | Immer bei Nicht-Draft-Pushes und PRs                  |
| `check-dependencies`               | Production-Knip-Durchlauf nur für Abhängigkeiten plus Allowlist-Guard für ungenutzte Dateien                                 | Node-relevante Änderungen                               |
| `build-artifacts`                  | Baut `dist/`, Control UI, Smoke Checks der gebauten CLI, eingebettete Prüfungen gebauter Artefakte und wiederverwendbare Artefakte | Node-relevante Änderungen                               |
| `checks-fast-core`                 | Schnelle Linux-Korrektheits-Lanes wie gebündelte, Protokoll-, QA-Smoke-CI- und CI-Routing-Prüfungen                | Node-relevante Änderungen                               |
| `checks-fast-contracts-plugins-*`  | Zwei geshardete Plugin-Vertragsprüfungen                                                                        | Node-relevante Änderungen                               |
| `checks-fast-contracts-channels-*` | Zwei geshardete Channel-Vertragsprüfungen                                                                       | Node-relevante Änderungen                               |
| `checks-node-core-*`               | Core-Node-Test-Shards, ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes                          | Node-relevante Änderungen                               |
| `check-*`                          | Geshardetes Äquivalent des lokalen Haupt-Gates: Production-Typen, Lint, Guards, Testtypen und strikter Smoke                | Node-relevante Änderungen                               |
| `check-additional-*`               | Architektur, geshardete Boundary-/Prompt-Drift, Erweiterungs-Guards, Package Boundary und Runtime-Topologie     | Node-relevante Änderungen                               |
| `checks-node-compat-node22`        | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                | Manueller CI-Dispatch für Releases                     |
| `check-docs`                       | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                             | Docs geändert                                        |
| `skills-python`                    | Ruff + pytest für Python-gestützte Skills                                                                    | Python-Skill-relevante Änderungen                       |
| `checks-windows`                   | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionen für Runtime-Import-Spezifizierer                      | Windows-relevante Änderungen                            |
| `macos-node`                       | macOS-TypeScript-Test-Lane mit den gemeinsam gebauten Artefakten                                               | macOS-relevante Änderungen                              |
| `macos-swift`                      | Swift-Lint, Build und Tests für die macOS-App                                                            | macOS-relevante Änderungen                              |
| `ios-build`                        | Xcode-Projektgenerierung plus Simulator-Build der iOS-App                                                 | iOS-App, gemeinsames App Kit oder Swabble-Änderungen         |
| `android`                          | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                              | Android-relevante Änderungen                            |
| `test-performance-agent`           | Tägliche Codex-Slow-Test-Optimierung nach vertrauenswürdiger Aktivität                                                 | Main-CI-Erfolg oder manueller Dispatch                  |
| `openclaw-performance`             | Tägliche/bedarfsgesteuerte Kova-Runtime-Performance-Berichte mit mock-provider-, Deep-Profile- und GPT-5.5-Live-Lanes | Geplanter und manueller Dispatch                       |

## Fail-Fast-Reihenfolge

1. `runner-admission` wartet nur bei kanonischen `main`-Pushes; ein neuerer Push bricht den Lauf vor der Blacksmith-Registrierung ab.
2. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
4. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit nachgelagerte Consumer starten können, sobald der gemeinsame Build bereit ist.
5. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Matrix-Jobs verwenden `fail-fast: false`, und `build-artifacts` meldet Fehler bei eingebettetem Channel, Core-Support-Boundary und Gateway-Watch direkt, statt kleine Verifier-Jobs einzureihen. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Läufe der vollständigen Suite verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

Verwenden Sie `pnpm ci:timings`, `pnpm ci:timings:recent` oder `node scripts/ci-run-timings.mjs <run-id>`, um Wall Time, Queue Time, langsamste Jobs, Fehler und die `pnpm-store-warmup`-Fanout-Barriere aus GitHub Actions zusammenzufassen. CI lädt dieselbe Laufzusammenfassung außerdem als Artefakt `ci-timings-summary` hoch. Prüfen Sie für Build-Zeitmessungen den Schritt `Build dist` des Jobs `build-artifacts`: `pnpm build:ci-artifacts` gibt `[build-all] phase timings:` aus und enthält `ui:build`; der Job lädt außerdem das Artefakt `startup-memory` hoch.

Bei Pull-Request-Läufen führt der abschließende Timing-Summary-Job den Helper aus der vertrauenswürdigen Basisrevision aus, bevor `GH_TOKEN` an `gh run view` übergeben wird. Dadurch bleibt die tokenisierte Abfrage außerhalb von branch-kontrolliertem Code, während der aktuelle CI-Lauf des Pull Requests weiterhin zusammengefasst wird.

## PR-Kontext und Nachweise

PRs externer Contributor führen ein PR-Kontext- und Nachweis-Gate aus
`.github/workflows/real-behavior-proof.yml` aus. Der Workflow checkt den vertrauenswürdigen
Basis-Commit aus und bewertet nur den PR-Body; er führt keinen Code aus dem
Contributor-Branch aus.

Das Gate gilt für PR-Autoren, die keine Repository-Owner, Mitglieder,
Collaborators oder Bots sind. Es besteht, wenn der PR-Body selbst verfasste
Abschnitte `What Problem This Solves` und `Evidence` enthält. Nachweise können ein fokussierter
Test, ein CI-Ergebnis, Screenshot, Recording, Terminalausgabe, Live-Beobachtung,
redigiertes Log oder Artefakt-Link sein. Der Body liefert Absicht und nützliche Validierung;
Reviewer prüfen Code, Tests und CI, um Korrektheit zu bewerten.

Wenn die Prüfung fehlschlägt, aktualisieren Sie den PR-Body, statt einen weiteren Code-Commit zu pushen.

## Scope und Routing

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graph plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, iOS-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen gescopet.
- **Workflow Sanity** führt `actionlint`, `zizmor` über alle Workflow-YAML-Dateien, den Composite-Action-Interpolation-Guard und den Conflict-Marker-Guard aus. Der PR-gescopte Job `security-fast` führt außerdem `zizmor` über geänderte Workflow-Dateien aus, sodass Workflow-Sicherheitsbefunde früh im Haupt-CI-Graph fehlschlagen.
- **Docs bei `main`-Pushes** werden vom eigenständigen `Docs`-Workflow mit demselben ClawHub-Docs-Mirror geprüft, den CI verwendet, sodass gemischte Code+Docs-Pushes nicht zusätzlich den CI-Shard `check-docs` einreihen. Pull Requests und manuelle CI führen `check-docs` aus CI weiterhin aus, wenn sich Docs geändert haben.
- **TUI PTY** läuft bei TUI-Änderungen im Linux-Node-Shard `checks-node-core-runtime-tui-pty`. Der Shard führt `test/vitest/vitest.tui-pty.config.ts` mit `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` aus und deckt damit sowohl die deterministische Fixture-Lane `TuiBackend` als auch den langsameren Smoke `tui --local` ab, der nur den externen Modell-Endpunkt mockt.
- **Nur-CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Vertrags-Helper-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Security und eine einzelne Aufgabe `checks-fast-core`. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Flächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helper, Package-Manager-Konfiguration und die CI-Workflow-Flächen gescopet, die diese Lane ausführen; nicht betroffene Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Plugin-Verträge und Kanalverträge laufen jeweils als zwei gewichtete, von Blacksmith gestützte Shards mit dem standardmäßigen GitHub-Runner-Fallback, schnelle Core-Unit-/Support-Lanes laufen separat, die Core-Runtime-Infrastruktur ist zwischen State, Prozess/Konfiguration, Shared und drei Cron-Domain-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat/Auth/Model/HTTP-Plugin/Runtime/Startup-Lanes aufgeteilt, statt auf gebaute Artefakte zu warten. Die normale CI bündelt dann nur isolierte Infrastruktur-Include-Pattern-Shards in deterministische Bundles mit höchstens 64 Testdateien. Dadurch wird die Node-Matrix reduziert, ohne nicht isolierte Command-/Cron-, zustandsbehaftete Agents-Core- oder Gateway-/Server-Suites zusammenzuführen; schwere feste Suites bleiben auf 8 vCPU, während die gebündelten und niedriger gewichteten Lanes 4 vCPU verwenden. Pull Requests im kanonischen Repository verwenden einen zusätzlichen kompakten Admission-Plan: Dieselben Pro-Konfiguration-Gruppen laufen in isolierten Unterprozessen innerhalb des aktuellen Linux-Node-Plans mit 34 Jobs, sodass ein einzelner PR nicht die vollständige Node-Matrix mit über 70 Jobs registriert. `main`-Pushes, manuelle Dispatches und Release-Gates behalten die vollständige Matrix bei. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-alls. Include-Pattern-Shards erfassen Timing-Einträge mit dem CI-Shard-Namen, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional-*` hält packagebezogene Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste wird in einen promptlastigen Shard und einen kombinierten Shard für die verbleibenden Guard-Stripes aufgeteilt, die jeweils ausgewählte unabhängige Guards parallel ausführen und Zeiten pro Check ausgeben. Der teure Codex-Happy-Path-Check auf Prompt-Snapshot-Drift läuft als eigener zusätzlicher Job nur für manuelle CI und promptbeeinflussende Änderungen. Normale, nicht verwandte Node-Änderungen warten dadurch nicht hinter kalter Prompt-Snapshot-Generierung, und die Boundary-Shards bleiben ausbalanciert, während Prompt-Drift weiterhin an den PR gebunden ist, der ihn verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Generierung innerhalb des Core-Support-Boundary-Shards für gebaute Artefakte. Gateway-Watch, Kanaltests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Nach der Zulassung erlaubt die kanonische Linux-CI bis zu 24 gleichzeitige Node-Testjobs und
12 für die kleineren Fast-/Check-Lanes; Windows und Android bleiben bei zwei, weil
diese Runner-Pools enger sind.

Der kompakte PR-Plan gibt 18 Node-Jobs für die aktuelle Suite aus: Whole-Config-
Gruppen werden in isolierten Unterprozessen mit einem Batch-Timeout von 120 Minuten gebündelt,
während Include-Pattern-Gruppen dasselbe begrenzte Job-Budget teilen.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source Set oder Manifest; ihre Unit-Test-Lane kompiliert die Variante weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen produktionsbezogenen, nur auf Abhängigkeiten ausgerichteten Knip-Durchlauf, der an die neueste Knip-Version gebunden ist und pnpm's Mindestfreigabealter für die `dlx`-Installation deaktiviert) und `pnpm deadcode:unused-files` aus. Letzteres vergleicht Knips produktionsbezogene Funde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs`. Der Unused-File-Guard schlägt fehl, wenn ein PR eine neue, nicht geprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag stehen lässt, während absichtlich dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip nicht statisch auflösen kann.

## Weiterleitung von ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Brücke von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Elementnummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, falls vorhanden. Sie vermeidet bewusst, den vollständigen Webhook-Body weiterzuleiten. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, umsetzbar, riskant oder betrieblich nützlich ist. Routinemäßige Eröffnungen, Bearbeitungen, Bot-Rauschen, doppelte Webhook-Signale und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodies, Review-Text, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie die normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux-Node-Shards, Bundled-Plugin-Shards, Plugin- und Kanalvertrags-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Checks für gebaute Artefakte, Docs-Checks, Python-Skills, Windows, macOS, iOS-Build und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Checks, der nur für Releases bestimmte `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` erlaubt es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Jobs                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manueller CI-Dispatch und Fallbacks für nicht kanonische Repositories, CodeQL-JavaScript-/Actions-Qualitätsscans, Workflow-Sanity, Labeler, Auto-Response, Docs-Workflows außerhalb der CI und Install-Smoke-Preflight, damit die Blacksmith-Matrix früher in die Warteschlange kann                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, niedriger gewichtete Extension-Shards, `checks-fast-core` außer QA Smoke CI, Plugin-/Kanalvertrags-Shards, die meisten gebündelten/niedriger gewichteten Linux-Node-Shards, `check-guards`, `check-prod-types`, `check-test-types`, ausgewählte `check-additional-*`-Shards und `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Beibehaltene schwere Linux-Node-Suites, Boundary-/Extension-lastige `check-additional-*`-Shards und `android`                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` in CI und Testbox, `check-lint` (CPU-empfindlich genug, dass 8 vCPU mehr kosteten, als sie sparten); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie sparte)                                                                                |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-15` zurück                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` und `ios-build` auf `openclaw/openclaw`; Forks fallen auf `macos-26` zurück                                                                                                                                                                                                                |

## Runner-Registrierungsbudget

OpenClaws aktueller GitHub-Runner-Registrierungs-Bucket meldet 10.000 selbst gehostete
Runner-Registrierungen pro 5 Minuten in `ghx api rate_limit`. Prüfen Sie
`actions_runner_registration` vor jedem Tuning-Durchlauf erneut, weil GitHub
diesen Bucket ändern kann. Das Limit wird von allen Blacksmith-Runner-Registrierungen in der
Organisation `openclaw` gemeinsam genutzt, sodass das Hinzufügen einer weiteren Blacksmith-Installation
keinen neuen Bucket hinzufügt.

Behandeln Sie Blacksmith-Labels als knappe Ressource für Burst-Steuerung. Jobs, die
nur routen, benachrichtigen, zusammenfassen, Shards auswählen oder kurze CodeQL-Scans ausführen, sollten
auf von GitHub gehosteten Runnern bleiben, sofern sie keinen gemessenen Blacksmith-spezifischen
Bedarf haben. Jede neue Blacksmith-Matrix, ein größeres `max-parallel` oder ein hochfrequenter
Workflow muss seine Worst-Case-Registrierungszahl ausweisen und das organisationsweite
Ziel unter etwa 60 % des Live-Buckets halten. Mit dem aktuellen Bucket von 10.000 Registrierungen
bedeutet das ein Betriebsziel von 6.000 Registrierungen, mit Spielraum für
gleichzeitige Repositories, Wiederholungen und Burst-Überlappung.

Die CI des kanonischen Repositories behält Blacksmith als standardmäßigen Runner-Pfad für normale Push- und Pull-Request-Läufe bei. `workflow_dispatch`- und nicht kanonische Repository-Läufe verwenden von GitHub gehostete Runner, aber normale kanonische Läufe prüfen derzeit nicht die Blacksmith-Warteschlangengesundheit und fallen nicht automatisch auf von GitHub gehostete Labels zurück, wenn Blacksmith nicht verfügbar ist.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` ist der Produkt-/Runtime-Performance-Workflow. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Die manuelle Auslösung benchmarked normalerweise die Workflow-Referenz. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und neueste Verweise werden nach der getesteten Referenz geschlüsselt, und jede `index.md` zeichnet die getestete Referenz/SHA, Workflow-Referenz/SHA, Kova-Referenz, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine Runtime aus einem lokalen Build mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, Gateway und Agent-Turn.
- `live-openai-candidate`: ein echter OpenAI-Agent-Turn mit `openai/gpt-5.5`, wird übersprungen, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf auch OpenClaw-native Quell-Probes aus: Gateway-Startzeit und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; RSS beim Import gebündelter Plugins, wiederholte mock-OpenAI-`channel-chat-baseline`-Hallo-Schleifen, CLI-Startbefehle gegen den gestarteten Gateway und die SQLite-State-Smoke-Performance-Probe. Wenn der zuvor veröffentlichte mock-provider-Quellbericht für die getestete Ref verfügbar ist, vergleicht die Quellzusammenfassung die aktuellen RSS- und Heap-Werte mit dieser Baseline und markiert große RSS-Anstiege als `watch`. Die Markdown-Zusammenfassung der Quell-Probe liegt im Berichtsbündel unter `source/index.md`, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Quell-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle tested-ref-Zeiger wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für release-spezifische Plugin-/Paket-/Static-/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Cross-OS-Paketprüfungen, Maturity-Scorecard-Rendering aus QA-Profilevidence, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stable- und Full-Profile enthalten immer umfassende Live-/E2E- und Docker-Release-Pfad-Soak-Abdeckung; das Beta-Profil kann sie mit `run_release_soak=true` aktivieren. Das kanonische Paket-Telegram-E2E läuft innerhalb von Package Acceptance, sodass ein vollständiger Kandidat keinen doppelten Live-Poller startet. Übergeben Sie nach dem Veröffentlichen `release_package_spec`, um das ausgelieferte npm-Paket über Release Checks, Package Acceptance, Docker, Cross-OS und Telegram hinweg ohne Neubuild wiederzuverwenden. Verwenden Sie `npm_telegram_package_spec` nur für einen fokussierten Telegram-Wiederholungslauf mit veröffentlichtem Paket. Die Live-Paket-Lane des Codex-Plugins verwendet standardmäßig denselben ausgewählten Zustand: Ein veröffentlichtes `release_package_spec=openclaw@<tag>` leitet `codex_plugin_spec=npm:@openclaw/codex@<tag>` ab, während SHA-/Artefaktläufe `extensions/codex` aus der ausgewählten Ref packen. Setzen Sie `codex_plugin_spec` explizit für benutzerdefinierte Plugin-Quellen wie `npm:`, `npm-pack:` oder `git:`-Specs.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
Handles für fokussierte Wiederholungsläufe.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn
von `release/YYYY.M.PATCH` oder `main`, nachdem das Release-Tag vorhanden ist und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht
`Plugin ClawHub Release` für denselben Release-SHA und dispatcht erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`. Stable-Publish erfordert außerdem
ein exaktes `windows_node_tag`; der Workflow verifiziert das Windows-Source-
Release und vergleicht dessen x64-/ARM64-Installer mit der kandidatenfreigegebenen
Eingabe `windows_node_installer_digests` vor jedem Publish-Child, bewirbt
und verifiziert dann dieselben gepinnten Installer-Digests plus den exakten Companion-Asset-
und Checksum-Contract, bevor der GitHub-Release-Entwurf veröffentlicht wird.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Für den Nachweis eines gepinnten Commits auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` an der Ziel-SHA,
dispatcht `Full Release Validation` von diesem gepinnten Ref, verifiziert, dass jeder untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Run abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein untergeordneter Workflow mit einer
anderen SHA gelaufen ist.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; nutzen Sie `full` nur, wenn Sie
bewusst die breite beratende Provider-/Medienmatrix wünschen. Stable- und Full-
Release-Prüfungen führen immer den umfassenden Live-/E2E- und Docker-Release-Pfad-Soak aus;
das Beta-Profil kann sich mit `run_release_soak=true` dafür entscheiden.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` ergänzt das stabile Provider-/Backend-Set.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die dispatchten untergeordneten Run-IDs auf, und der finale Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Runs erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Run an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifizierer-Job erneut aus, um das Umbrella-Ergebnis und die Zeitübersicht zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release Candidate, `ci` nur für das normale Full-CI-Kind, `plugin-prerelease` nur für das Plugin-Prerelease-Kind, `release-checks` für jedes Release-Kind oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` auf dem Umbrella. Dadurch bleibt ein erneuter Run einer fehlgeschlagenen Release-Box nach einem fokussierten Fix begrenzt. Kombinieren Sie bei einer einzelnen fehlgeschlagenen Cross-OS-Lane `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Packaged-Upgrade-Zusammenfassungen enthalten Zeitangaben pro Phase. QA-Release-Check-Lanes sind beratend, außer dem Standard-Gate für Runtime-Tool-Abdeckung, das blockiert, wenn erforderliche dynamische OpenClaw-Tools in der Standard-Tier-Zusammenfassung abweichen oder verschwinden.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmalig in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance sowie an den Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat wird nicht in mehreren untergeordneten Jobs erneut gepackt. Für die Codex-npm-Plugin-Live-Lane übergeben Release-Prüfungen entweder eine passende veröffentlichte Plugin-Spezifikation, die aus `release_package_spec` abgeleitet ist, übergeben das vom Operator bereitgestellte `codex_plugin_spec` oder lassen die Eingabe leer, damit das Docker-Skript das Codex-Plugin des ausgewählten Checkouts packt.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der übergeordnete Monitor bricht jeden untergeordneten Workflow ab, den
er bereits dispatcht hat, wenn der Parent abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Run wartet. Release-Branch-/Tag-
Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das untergeordnete Release-Live-/E2E-Element behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- provider-gefilterte `native-live-src-gateway-profiles`-Jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- aufgeteilte Medien-Audio-/Video-Shards und provider-gefilterte Musik-Shards

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Media-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut durch den Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medien-Jobs verifizieren die Binaries nur vor dem Setup. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal; danach laufen die Docker-Shards für Live-Modell, Provider-aufgeteilten Gateway, CLI-Backend, ACP-Bindung und Codex-Harness mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite `timeout`-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, sodass ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Budget der Release-Prüfung zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normalem CI: Normales CI validiert den Source-Tree, während Paketakzeptanz ein einzelnes Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow Paket und gemeinsame Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Paketakzeptanz eines aufgelöst hat; eigenständige Telegram-Dispatches können weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Prerelease-/Stable-Versionen.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, dass der ausgewählte Commit über die Repository-Branch-Historie oder ein Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein öffentliches HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich. Dieser Pfad weist URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/speziell reservierte Hostnamen oder aufgelöste IPs sowie Weiterleitungen außerhalb derselben öffentlichen Sicherheitsrichtlinie zurück.
- `source=trusted-url` lädt ein HTTPS-`.tgz` aus einer benannten Trusted-Source-Richtlinie in `.github/package-trusted-sources.json` herunter; `package_sha256` und `trusted_source_id` sind erforderlich. Verwenden Sie dies nur für maintainer-eigene Enterprise-Mirrors oder private Paket-Repositories, die konfigurierte Hosts, Ports, Pfadpräfixe, Weiterleitungs-Hosts oder private Netzwerkauflösung benötigen. Wenn die Richtlinie Bearer-Auth deklariert, verwendet der Workflow das feste Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in URLs eingebettete Zugangsdaten werden weiterhin zurückgewiesen.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` ist. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` erneut; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Die dedizierte Richtlinie für Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Lanes, Paketakzeptanz-Eingaben, Release-Defaults und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Paketakzeptanz mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `release_package_spec` in Full Release Validation oder OpenClaw Release Checks nach der Veröffentlichung einer Beta, um dieselbe Matrix gegen das ausgelieferte npm-Paket ohne Neubau auszuführen; setzen Sie `package_acceptance_package_spec` nur, wenn Paketakzeptanz ein anderes Paket als der Rest der Release-Validierung benötigt. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding-, Installer- und Plattformverhalten ab; Produktvalidierung für Pakete/Updates sollte mit Paketakzeptanz beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paket-Baseline im blockierenden Release-Pfad. In Paketakzeptanz ist das aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten stabilen npm-Releases plus fest gepinnte Plugin-Kompatibilitäts-Grenzreleases und issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeits-Roots zu erweitern. Multi-Baseline-Auswahlen für published-upgrade-survivor werden nach Baseline in separate gezielte Docker-Runner-Jobs aufgeteilt. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um eine vollständige Bereinigung veröffentlichter Updates geht, nicht um die normale Breite von Full Release CI. Lokale Sammelläufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` behalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenario-Matrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebackenen Befehlsrezept `openclaw config set`, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die Windows-Lanes für frische Paket- und Installer-Installationen prüfen außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.5`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Paketakzeptanz hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf im Tarball ausgelassene Dateien verweisen;
- `doctor-switch` darf den Unterfall zur Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus dem vom Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Persistenz von Marketplace-Install-Records akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass Install-Record und Verhalten ohne Neuinstallation unverändert bleiben.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Wenn Sie einen fehlgeschlagenen Paketakzeptanz-Lauf debuggen, beginnen Sie bei der Zusammenfassung von `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den Child-Run `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie vorzugsweise das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, Änderungen an Paketen/Manifesten gebündelter Plugins oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für das Löschen des gemeinsamen Agent-Arbeitsbereichs aus, führt das Container-Gateway-Netzwerk-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (der Docker-Lauf jedes Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält die QR-Paketinstallation sowie die Docker-/Update-Abdeckung des Installers für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für den Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Logik für den Änderungsumfang bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow heraus, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, aber Pull Requests und `main`-Pushes nicht. Normales PR-CI führt weiterhin die schnelle Bun-Launcher-Regressionsspur für Node-relevante Änderungen aus. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeitsspuren;
- ein funktionales Image, das denselben Tarball für normale Funktionalitätsspuren in `/app` installiert.

Docker-Spurdefinitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Spur mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Spuren dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Optionen

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Spuren.                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit für gleichzeitige Live-Spuren, damit Provider nicht drosseln.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Limit für gleichzeitige npm-Installationsspuren.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit für gleichzeitige Multi-Service-Spuren.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Spurstarts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keinen Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Spur (120 Minuten); ausgewählte Live-/Tail-Spuren verwenden strengere Limits. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Spuren auszuführen.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Spurliste; überspringt den Cleanup-Smoke, damit Agenten eine fehlgeschlagene Spur reproduzieren können. |

Eine Spur, die schwerer ist als ihr wirksames Limit, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Spuren aus, persistiert Spurzeiten für die Sortierung nach längster Laufzeit zuerst und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Spuren mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Spur- und Zugangsdatenabdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paketdigestgetaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan paketinstallierte Spuren benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paketdigest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch wiederholt, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den größten Teil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Spuren über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `package-update-openai` enthält die Live-Codex-Plugin-Paketspur, die das Kandidatenpaket von OpenClaw installiert, das Codex-Plugin aus `codex_plugin_spec` oder einem Same-Ref-Tarball mit expliziter Installationsfreigabe für die Codex CLI installiert, den Codex-CLI-Preflight ausführt und anschließend mehrere OpenClaw-Agent-Turns derselben Sitzung gegen OpenAI ausführt. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Spur-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Spuren.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält einen eigenständigen `openwebui`-Chunk nur für reine OpenWebUI-Dispatches. Update-Spuren gebündelter Channels versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Spurprotokollen, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Spuren und Rerun-Befehlen pro Spur hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Spuren gegen die vorbereiteten Images statt der Chunk-Jobs aus. Dadurch bleibt das Debugging fehlgeschlagener Spuren auf einen gezielten Docker-Job begrenzt und bereitet das Paketartefakt für diesen Lauf vor, lädt es herunter oder verwendet es wieder; wenn eine ausgewählte Spur eine Live-Docker-Spur ist, baut der gezielte Job das Live-Test-Image lokal für diesen Rerun. Generierte GitHub-Rerun-Befehle pro Spur enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte existieren, sodass eine fehlgeschlagene Spur exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # Docker-Artefakte herunterladen und kombinierte/gezielte Rerun-Befehle pro Spur ausgeben
pnpm test:docker:timings <summary>   # Zusammenfassungen langsamer Spuren und des kritischen Pfads nach Phasen
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches halten diese Suite deaktiviert. Er verteilt Tests gebündelter Plugins auf acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importintensive Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-spezifische Docker-Prerelease-Pfad bündelt gezielte Docker-Spuren in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren. Der Workflow lädt außerdem ein informatives `plugin-inspector-advisory`-Artefakt aus `@openclaw/plugin-inspector` hoch; Inspector-Befunde sind Triage-Eingaben und ändern das blockierende Plugin-Prerelease-Gate nicht.

## QA-Lab

QA-Lab hat dedizierte CI-Spuren außerhalb des wichtigsten, intelligent nach Umfang begrenzten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität zusammen mit einem breiten Validierungslauf laufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritätsspur, die Live-Matrix-Spur sowie die Live-Telegram- und Discord-Spuren als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transportspuren mit dem deterministischen Mock-Provider und mockqualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suiten abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt vor der Release-Freigabe außerdem die releasekritischen QA-Lab-Spuren aus; sein QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Spurjobs aus und lädt dann beide Artefakte in einen kleinen Berichtsjob für den finalen Paritätsvergleich herunter.

Für normale PRs folgen Sie der scoped CI-/Check-Evidenz, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein enger Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und Nicht-Draft-Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit hochvertrauenswürdigen Security-Abfragen, die auf hohe/kritische `security-severity` gefiltert sind.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` oder prozesseigenen Runtime-Pfaden gebündelter Plugins und führt dieselbe hochvertrauenswürdige Security-Matrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Security-Kategorien

| Kategorie                                          | Oberfläche                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge des Core-Channels plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte              |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Network Guard, Web-Fetch und SSRF-Richtlinienoberflächen des Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Helfer zur Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                                           |
| `/codeql-security-high/process-exec-boundary`     | Lokale Shell, Helfer zum Starten von Prozessen, Subprozess-besitzende gebündelte Plugin-Runtimes und Workflow-Skript-Verbindungscode                             |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Quellcode-Laden und Vertrauensoberflächen des Plugin SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Sanity akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Dependency-Build-Ergebnisse aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Defaults, weil der macOS-Build die Laufzeit dominiert, selbst wenn er sauber ist.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt nur JavaScript/TypeScript-Qualitätsabfragen mit Error-Schweregrad ohne Sicherheitsbezug über schmale, hochwertige Oberflächen auf GitHub-gehosteten Linux-Runnern aus, damit Qualitätsscans kein Blacksmith-Runner-Registrierungsbudget verbrauchen. Sein Pull-Request-Guard ist absichtlich kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Agent-Befehl-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Sicherheitscode, Core-Channel- und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll-/Servermethoden, Memory-Runtime-/SDK-Verbindungscode, MCP/Prozess/ausgehende Zustellung, Provider-Runtime/Modellkatalog, Sitzungsdiagnostik/Zustellwarteschlangen, Plugin-Loader, Plugin SDK/Paketvertrag oder Änderungen an der Plugin SDK-Reply-Runtime aus. Änderungen an CodeQL-Konfiguration und Qualitäts-Workflow führen alle zwölf PR-Qualitäts-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Teaching-/Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                                | Oberfläche                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, Secrets, Sandbox, Cron und Code für die Gateway-Sicherheitsgrenze                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Servermethoden-Verträge                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Core-Channel und gebündeltes Channel-Plugin                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Helfer zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory Host SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Verbindungscode zur Aktivierung der Memory-Runtime und Memory-Doctor-Befehle                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply-Queue-Interna, Sitzungszustellwarteschlangen, Helfer für ausgehendes Session-Binding/Zustellung, Diagnoseereignis-/Log-Bundle-Oberflächen und CLI-Verträge für den Session Doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Reply-Dispatch des Plugin SDK, Reply-Payload-/Chunking-/Runtime-Helfer, Channel-Reply-Optionen, Zustellwarteschlangen und Helfer für Session-/Thread-Binding             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Auth und -Discovery, Provider-Runtime-Registrierung, Provider-Defaults/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries    |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/Search, Medien-IO, Medienverständnis, Image-Generation und Media-Generation-Runtime-Verträge                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin SDK-Entrypoint-Verträge                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paket-seitiger Plugin SDK-Quellcode und Helfer für Plugin-Paketverträge                                                                                      |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsfunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst dann wieder als gescopter oder geshardeter Follow-up-Aufwand ergänzt werden, wenn die schmalen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungsschiene, um vorhandene Dokumentation mit kürzlich gelandeten Änderungen synchron zu halten. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergelaufen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, überprüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsschiene für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Schiene erstellt einen gruppierten Vitest-Performancebericht für die komplette Suite, erlaubt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings, führt dann den Full-Suite-Bericht erneut aus und lehnt Änderungen ab, die die Baseline-Anzahl bestandener Tests reduzieren. Der gruppierte Bericht zeichnet Wall-Time pro Konfiguration und maximale RSS unter Linux und macOS auf, sodass der Vorher/Nachher-Vergleich Test-Speicher-Deltas neben Laufzeit-Deltas sichtbar macht. Wenn die Baseline fehlschlagende Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebasiert die Schiene den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für die Duplicate-Bereinigung nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` ist. Bevor GitHub mutiert wird, prüft er, dass der gelandete PR gemergt ist und dass jedes Duplicate entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und geändertes Routing

Die lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattform-Scope:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Test-Änderungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Test-Änderungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Konfigurations-/Root-Dependency-Checks aus;
- unbekannte Root-/Konfigurationsänderungen schlagen sicherheitshalber auf alle Check-Lanes fehl.

Das lokale Changed-Test-Routing lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: direkte Teständerungen führen sich selbst aus, Quellcodeänderungen bevorzugen explizite Mappings, dann Sibling-Tests und Import-Graph-Abhängige. Shared-Group-Room-Delivery-Konfiguration ist eines der expliziten Mappings: Änderungen an der gruppensichtbaren Reply-Konfiguration, am Quell-Reply-Zustellmodus oder am Message-Tool-System-Prompt laufen durch die Core-Reply-Tests plus Discord- und Slack-Zustellungsregressionen, sodass eine gemeinsame Default-Änderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass das günstige gemappte Set kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Crabbox ist der repo-eigene Wrapper für Remote-Boxen für Maintainer-Nachweise unter Linux. Verwenden Sie ihn
aus dem Repo-Root, wenn ein Check für einen lokalen Bearbeitungsloop zu breit ist, wenn CI-
Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Package-Lanes,
wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist
`blacksmith-testbox`; eigene AWS/Hetzner-Kapazität ist ein Fallback bei Blacksmith-
Ausfällen, Kontingentproblemen oder expliziten Tests mit eigener Kapazität.

Crabbox-gestützte Blacksmith-Läufe wärmen One-Shot-Testboxes auf, beanspruchen, synchronisieren, führen aus, berichten und räumen sie auf.
Der eingebaute Sync-Sanity-Check schlägt schnell fehl, wenn erforderliche
Root-Dateien wie `pnpm-lock.yaml` verschwinden oder wenn `git status --short`
mindestens 200 nachverfolgte Löschungen anzeigt. Setzen Sie bei absichtlichen PRs mit vielen Löschungen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für den Remote-Befehl.

Crabbox beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten
ohne Ausgabe nach der Synchronisierung in der
Sync-Phase bleibt. Setzen Sie `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diese Schutzvorrichtung zu deaktivieren, oder verwenden Sie einen größeren
Millisekundenwert für ungewöhnlich große lokale Diffs.

Prüfen Sie vor dem ersten Lauf den Wrapper aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert eine veraltete Crabbox-Binärdatei, die `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` Defaults für eigene Cloud-Kapazität hat. Vermeiden Sie in Codex-Worktrees oder verlinkten/sparse Checkouts das lokale Skript `pnpm crabbox:run`, weil pnpm Abhängigkeiten abgleichen kann, bevor Crabbox startet; rufen Sie stattdessen den Node-Wrapper direkt auf:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-gestützte Läufe benötigen Crabbox 0.22.0 oder neuer, damit der Wrapper das aktuelle Synchronisierungs-, Warteschlangen- und Aufräumverhalten von Testbox erhält. Wenn Sie den Geschwister-Checkout verwenden, bauen Sie die ignorierte lokale Binärdatei vor Timing- oder Nachweisarbeiten neu:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Changed-Gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Fokussierte Testwiederholung:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Vollständige Suite:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Bei delegierten
Blacksmith-Testbox-Läufen sind der Exit-Code des Crabbox-Wrappers und die JSON-Zusammenfassung das
Befehlsergebnis. Der verlinkte GitHub-Actions-Lauf ist für Hydration und Keepalive zuständig; er
kann als `cancelled` enden, wenn die Testbox extern gestoppt wird, nachdem der SSH-
Befehl bereits zurückgekehrt ist. Behandeln Sie das als Aufräum-/Statusartefakt, sofern
der Wrapper-`exitCode` nicht ungleich null ist oder die Befehlsausgabe einen fehlgeschlagenen Test zeigt.
One-Shot-Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen;
wenn ein Lauf unterbrochen wird oder das Aufräumen unklar ist, prüfen Sie Live-Boxen und stoppen Sie nur
die Boxen, die Sie erstellt haben:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie Wiederverwendung nur, wenn Sie absichtlich mehrere Befehle auf derselben hydratisierten Box benötigen:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes
Blacksmith nur für Diagnosen wie `list`, `status` und Aufräumen. Reparieren Sie den
Crabbox-Pfad, bevor Sie einen direkten Blacksmith-Lauf als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue
Warmups aber nach ein paar Minuten ohne IP oder Actions-Lauf-URL auf `queued` stehen,
behandeln Sie das als Druck durch Blacksmith-Provider, Warteschlange, Abrechnung oder Organisationslimits. Stoppen Sie die
von Ihnen erstellten IDs in der Warteschlange, starten Sie keine weiteren Testboxes und verlagern Sie den Nachweis auf den
unten beschriebenen Pfad mit eigener Crabbox-Kapazität, während jemand das Blacksmith-Dashboard,
die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen ist, kontingentbegrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität explizit das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie bei AWS-Druck `class=beast`, sofern die Aufgabe nicht wirklich CPU der 48xlarge-Klasse benötigt. Eine `beast`-Anforderung startet bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standard-Kontingente auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases ausgewählte Region/Markt, Kontingentdruck, Spot-Fallback und Warnungen für Klassen mit hohem Druck ausgeben. Verwenden Sie `fast` für schwerere breite Checks, `large` erst, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Dokumentationsarbeit, gewöhnliches Linting/Typechecking, kleine E2E-Repros oder Blacksmith-Ausfalltriage. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Schwankungen des Spot-Markts nicht in das Signal einfließen.

`.crabbox.yaml` besitzt Provider-, Synchronisierungs- und GitHub-Actions-Hydration-Defaults für eigene Cloud-Lanes. Sie schließt lokales `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die Übergabe der nicht geheimen Umgebung für eigene Cloud-Befehle vom Typ `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
