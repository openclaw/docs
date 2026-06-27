---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder einen erneuten Lauf
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-06-27T17:14:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI läuft bei jedem Push nach `main` und jedem Pull Request. Kanonische
`main`-Pushes durchlaufen zuerst ein 90-sekündiges Zulassungsfenster für gehostete Runner.
Die bestehende `CI`-Concurrency-Gruppe bricht diesen wartenden Lauf ab, wenn ein neuerer
Commit landet, sodass sequenzielle Merges nicht jeweils eine vollständige Blacksmith-
Matrix registrieren. Pull Requests und manuelle Dispatches überspringen die Wartezeit. Der `preflight`-Job
klassifiziert anschließend das Diff und schaltet teure Lanes ab, wenn sich nur nicht zugehörige
Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen bewusst das intelligente
Scoping und fächern den vollständigen Graphen für Release Candidates und breite
Validierung auf. Android-Lanes bleiben über `include_android` optional. Release-spezifische
Plugin-Abdeckung befindet sich im separaten [`Plugin-Prerelease`](#plugin-prerelease)-
Workflow und läuft nur von [`Vollständige Release-Validierung`](#full-release-validation)
oder einem expliziten manuellen Dispatch aus.

## Pipeline-Übersicht

| Job                                | Zweck                                                                                                   | Wann er läuft                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest                   | Immer bei Nicht-Entwurfs-Pushes und PRs                  |
| `runner-admission`                 | Gehostetes 90-Sekunden-Debounce für kanonische `main`-Pushes, bevor Blacksmith-Arbeit registriert wird                | Jeder CI-Lauf; Schlafphase nur bei kanonischen `main`-Pushes |
| `security-fast`                    | Erkennung privater Schlüssel, Audit geänderter Workflows über `zizmor` und Audit des Produktions-Lockfiles                 | Immer bei Nicht-Entwurfs-Pushes und PRs                  |
| `check-dependencies`               | Produktions-Knip-Durchlauf nur für Abhängigkeiten plus Guard für die Allowlist ungenutzter Dateien                                 | Node-relevante Änderungen                               |
| `build-artifacts`                  | Erstellt `dist/`, Control UI, Built-CLI-Smoke-Checks, eingebettete Built-Artifact-Checks und wiederverwendbare Artefakte | Node-relevante Änderungen                               |
| `checks-fast-core`                 | Schnelle Linux-Korrektheits-Lanes wie gebündelt, Protokoll, QA Smoke CI und CI-Routing-Checks                | Node-relevante Änderungen                               |
| `checks-fast-contracts-plugins-*`  | Zwei geshardete Plugin-Vertragsprüfungen                                                                        | Node-relevante Änderungen                               |
| `checks-fast-contracts-channels-*` | Zwei geshardete Kanal-Vertragsprüfungen                                                                       | Node-relevante Änderungen                               |
| `checks-node-core-*`               | Core-Node-Test-Shards, ausgenommen Kanal-, gebündelte, Vertrags- und Erweiterungs-Lanes                          | Node-relevante Änderungen                               |
| `check-*`                          | Geshardetes Äquivalent des lokalen Haupt-Gates: Produktionstypen, Lint, Guards, Testtypen und strikter Smoke                | Node-relevante Änderungen                               |
| `check-additional-*`               | Architektur, geshardete Boundary-/Prompt-Drift, Erweiterungs-Guards, Paketgrenze und Laufzeit-Topologie     | Node-relevante Änderungen                               |
| `checks-node-compat-node22`        | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                | Manueller CI-Dispatch für Releases                     |
| `check-docs`                       | Docs-Formatierung, Lint und Prüfungen auf defekte Links                                                             | Docs geändert                                        |
| `skills-python`                    | Ruff + pytest für Python-gestützte Skills                                                                    | Für Python-Skills relevante Änderungen                       |
| `checks-windows`                   | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionen bei Laufzeit-Import-Spezifizierern                      | Windows-relevante Änderungen                            |
| `macos-node`                       | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                               | macOS-relevante Änderungen                              |
| `macos-swift`                      | Swift-Lint, Build und Tests für die macOS-App                                                            | macOS-relevante Änderungen                              |
| `ios-build`                        | Xcode-Projekterzeugung plus Simulator-Build der iOS-App                                                 | iOS-App, gemeinsames App-Kit oder Swabble-Änderungen         |
| `android`                          | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                              | Android-relevante Änderungen                            |
| `test-performance-agent`           | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                                 | Main-CI-Erfolg oder manueller Dispatch                  |
| `openclaw-performance`             | Tägliche/bedarfsabhängige Kova-Laufzeit-Performanceberichte mit Mock-Provider, Deep-Profile und GPT-5.5-Live-Lanes | Geplant und manueller Dispatch                       |

## Fail-Fast-Reihenfolge

1. `runner-admission` wartet nur bei kanonischen `main`-Pushes; ein neuerer Push bricht den Lauf vor der Blacksmith-Registrierung ab.
2. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
4. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
5. Schwerere Plattform- und Laufzeit-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, außer der neueste Lauf für denselben Ref schlägt ebenfalls fehl. Matrix-Jobs verwenden `fail-fast: false`, und `build-artifacts` meldet eingebettete Kanal-, Core-Support-Boundary- und Gateway-Watch-Fehler direkt, statt kleine Verifier-Jobs einzureihen. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

Verwenden Sie `pnpm ci:timings`, `pnpm ci:timings:recent` oder `node scripts/ci-run-timings.mjs <run-id>`, um Wall Time, Queue-Zeit, langsamste Jobs, Fehler und die `pnpm-store-warmup`-Fanout-Barriere aus GitHub Actions zusammenzufassen. CI lädt dieselbe Laufzusammenfassung außerdem als `ci-timings-summary`-Artefakt hoch. Prüfen Sie für Build-Timing den Schritt `Build dist` des Jobs `build-artifacts`: `pnpm build:ci-artifacts` gibt `[build-all] phase timings:` aus und enthält `ui:build`; der Job lädt außerdem das Artefakt `startup-memory` hoch.

Für Pull-Request-Läufe führt der abschließende Timing-Summary-Job den Helper aus der vertrauenswürdigen Basisrevision aus, bevor er `GH_TOKEN` an `gh run view` übergibt. Dadurch bleibt die Token-Abfrage außerhalb von branch-kontrolliertem Code, während dennoch der aktuelle CI-Lauf des Pull Requests zusammengefasst wird.

## PR-Kontext und Nachweise

PRs externer Beitragender führen ein Gate für PR-Kontext und Nachweise aus
`.github/workflows/real-behavior-proof.yml` aus. Der Workflow checkt den vertrauenswürdigen
Basis-Commit aus und wertet nur den PR-Body aus; er führt keinen Code aus dem
Branch des Beitragenden aus.

Das Gate gilt für PR-Autoren, die keine Repository-Eigentümer, Mitglieder,
Mitwirkenden oder Bots sind. Es besteht, wenn der PR-Body verfasste
Abschnitte `What Problem This Solves` und `Evidence` enthält. Nachweise können ein fokussierter
Test, ein CI-Ergebnis, ein Screenshot, eine Aufzeichnung, Terminalausgabe, Live-Beobachtung,
redigiertes Log oder Artefakt-Link sein. Der Body liefert Absicht und nützliche Validierung;
Reviewer prüfen Code, Tests und CI, um die Korrektheit zu bewerten.

Wenn die Prüfung fehlschlägt, aktualisieren Sie den PR-Body, statt einen weiteren Code-Commit zu pushen.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Erkennung geänderter Scopes und lässt das Preflight-Manifest so handeln, als ob jeder gescopte Bereich geändert worden wäre.

- **CI-Workflow-Bearbeitungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, iOS-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **Workflow Sanity** führt `actionlint`, `zizmor` über alle Workflow-YAML-Dateien, den Composite-Action-Interpolations-Guard und den Konfliktmarker-Guard aus. Der PR-gescopte Job `security-fast` führt außerdem `zizmor` über geänderte Workflow-Dateien aus, damit Workflow-Sicherheitsbefunde früh im Haupt-CI-Graphen fehlschlagen.
- **Docs bei `main`-Pushes** werden vom eigenständigen `Docs`-Workflow mit demselben ClawHub-Docs-Mirror geprüft, der von CI verwendet wird, sodass gemischte Code+Docs-Pushes nicht zusätzlich den CI-Shard `check-docs` einreihen. Pull Requests und manuelle CI führen weiterhin `check-docs` aus CI aus, wenn Docs geändert wurden.
- **TUI PTY** läuft im Linux-Node-Shard `checks-node-core-runtime-tui-pty` für TUI-Änderungen. Der Shard führt `test/vitest/vitest.tui-pty.config.ts` mit `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` aus und deckt dadurch sowohl die deterministische `TuiBackend`-Fixture-Lane als auch den langsameren `tui --local`-Smoke ab, der nur den externen Modell-Endpunkt mockt.
- **Nur-CI-Routing-Bearbeitungen, ausgewählte günstige Core-Test-Fixture-Bearbeitungen und enge Plugin-Vertrags-Helper-/Test-Routing-Bearbeitungen** verwenden einen schnellen, reinen Node-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Kanalverträge, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen beschränkt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zugehörige Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Plugin-Verträge und Channel-Verträge laufen jeweils als zwei gewichtete, Blacksmith-gestützte Shards mit dem standardmäßigen GitHub-Runner-Fallback, schnelle Core-Unit-/Support-Lanes laufen separat, die Core-Runtime-Infrastruktur ist auf State, Process/Config, Shared und drei Cron-Domain-Shards verteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind auf Chat/Auth/Model/http-plugin/Runtime/Startup-Lanes verteilt, anstatt auf gebaute Artefakte zu warten. Normale CI packt dann nur isolierte Include-Pattern-Shards der Infrastruktur in deterministische Bundles mit höchstens 64 Testdateien. Dadurch wird die Node-Matrix reduziert, ohne nicht isolierte Command/Cron-, zustandsbehaftete Agents-Core- oder Gateway/Server-Suiten zusammenzuführen; schwere feste Suiten bleiben auf 8 vCPU, während die gebündelten und geringer gewichteten Lanes 4 vCPU verwenden. Pull Requests im kanonischen Repository verwenden einen zusätzlichen kompakten Admission-Plan: dieselben Gruppen pro Konfiguration laufen in isolierten Subprozessen innerhalb des aktuellen Linux-Node-Plans mit 34 Jobs, sodass ein einzelner PR nicht die vollständige Node-Matrix mit über 70 Jobs registriert. `main`-Pushes, manuelle Dispatches und Release-Gates behalten die vollständige Matrix bei. Umfangreiche Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine gesamte Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional-*` hält package-bezogene Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist in einen promptlastigen Shard und einen kombinierten Shard für die übrigen Guard-Stripes aufgeteilt, wobei jeweils ausgewählte unabhängige Guards parallel laufen und Timings pro Check ausgegeben werden. Der teure Codex-Happy-Path-Prompt-Snapshot-Drift-Check läuft als eigener zusätzlicher Job nur für manuelle CI und promptrelevante Änderungen, sodass normale, nicht zusammenhängende Node-Änderungen nicht hinter kalter Prompt-Snapshot-Generierung warten müssen und die Boundary-Shards ausbalanciert bleiben, während Prompt-Drift weiterhin dem verursachenden PR zugeordnet ist; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Generierung innerhalb des gebauten Core-Support-Boundary-Shards. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Nach der Zulassung erlaubt die kanonische Linux-CI bis zu 24 gleichzeitige Node-Testjobs und
12 für die kleineren schnellen/check-Lanes; Windows und Android bleiben bei zwei, weil
diese Runner-Pools enger begrenzt sind.

Der kompakte PR-Plan erzeugt 18 Node-Jobs für die aktuelle Suite: Whole-Config-
Gruppen werden in isolierten Subprozessen mit einem Batch-Timeout von 120 Minuten gebündelt,
während Include-Pattern-Gruppen dasselbe begrenzte Job-Budget teilen.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source Set oder Manifest; ihre Unit-Test-Lane kompiliert die Variante weiterhin mit den SMS-/Call-Log-BuildConfig-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen produktionsbezogenen Knip-Durchlauf nur für Abhängigkeiten, fest auf die neueste Knip-Version gesetzt, wobei pnpm's Mindestveröffentlichungsalter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips produktionsbezogene Funde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag stehen lässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip nicht statisch auflösen kann.

## ClawSweeper-Aktivitätsweiterleitung

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für genaue Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Actor, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder operativ nützlich ist. Routinemäßige Öffnungen, Bearbeitungen, Bot-Rauschen, doppelte Webhook-Ereignisse und normaler Review-Traffic sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Texte, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht-Android-bezogene scoped Lane: Linux-Node-Shards, Bundled-Plugin-Shards, Plugin- und Channel-Contract-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Checks für gebaute Artefakte, Docs-Checks, Python-Skills, Windows, macOS, iOS-Build und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Checks, der release-only `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manueller CI-Dispatch und Fallbacks für nicht kanonische Repositorys, CodeQL-Qualitätsscans für JavaScript/actions, Workflow-Sanity, Labeler, Auto-Response, Docs-Workflows außerhalb von CI und Install-Smoke-Preflight, damit die Blacksmith-Matrix früher in die Queue kommen kann |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, geringer gewichtete Extension-Shards, `checks-fast-core`, Plugin-/Channel-Contract-Shards, die meisten gebündelten/geringer gewichteten Linux-Node-Shards, `check-guards`, `check-prod-types`, `check-test-types`, ausgewählte `check-additional-*`-Shards und `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Beibehaltene schwere Linux-Node-Suiten, boundary-/extension-lastige `check-additional-*`-Shards und `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Queue-Zeit kostete mehr, als sie einsparte)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-15` zurück                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` und `ios-build` auf `openclaw/openclaw`; Forks fallen auf `macos-26` zurück                                                                                                                                                                                                  |

## Runner-Registrierungsbudget

OpenClaws aktueller GitHub-Bucket für Runner-Registrierungen erlaubt 3.000 Self-Hosted-
Runner-Registrierungen pro 5 Minuten. Das Limit wird von allen Blacksmith-Runner-
Registrierungen in der Organisation `openclaw` geteilt, sodass eine weitere Blacksmith-
Installation keinen neuen Bucket hinzufügt.

Behandeln Sie Blacksmith-Labels als knappe Ressource für Burst-Kontrolle. Jobs, die
nur routen, benachrichtigen, zusammenfassen, Shards auswählen oder kurze CodeQL-Scans ausführen, sollten
auf GitHub-gehosteten Runnern bleiben, sofern sie keine gemessenen Blacksmith-spezifischen
Anforderungen haben. Jede neue Blacksmith-Matrix, ein größeres `max-parallel` oder ein hochfrequenter
Workflow muss seine Worst-Case-Registrierungszahl zeigen und das organisationsweite
Ziel unter 2.000 Registrierungen pro 5 Minuten halten, mit Spielraum für gleichzeitige
Repositorys und erneut ausgeführte Jobs.

CI im kanonischen Repository behält Blacksmith als standardmäßigen Runner-Pfad für normale Push- und Pull-Request-Läufe bei. `workflow_dispatch`- und nicht kanonische Repository-Läufe verwenden GitHub-gehostete Runner, aber normale kanonische Läufe prüfen derzeit nicht die Blacksmith-Queue-Gesundheit und fallen nicht automatisch auf GitHub-gehostete Labels zurück, wenn Blacksmith nicht verfügbar ist.

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

`OpenClaw Performance` ist der Performance-Workflow für Produkt und Runtime. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarkt normalerweise die Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Zeiger werden nach der getesteten Ref verschlüsselt, und jede `index.md` zeichnet getestete Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Startup-, Gateway- und Agent-Turn-Hotspots.
- `live-openai-candidate`: ein echter OpenAI-`openai/gpt-5.5`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die `mock-provider`-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Boot-Timing und Speicher über Startup-Fälle mit Default, Hook und 50 Plugins; RSS beim Import gebündelter Plugins, wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops, CLI-Startup-Befehle gegen das gebootete Gateway und die SQLite-State-Smoke-Performance-Probe. Wenn der zuvor veröffentlichte `mock-provider`-Source-Bericht für die getestete Ref verfügbar ist, vergleicht die Source-Zusammenfassung aktuelle RSS- und Heap-Werte mit dieser Baseline und markiert große RSS-Anstiege als `watch`. Die Markdown-Zusammenfassung der Source-Probe befindet sich unter `source/index.md` im Berichtsbundle, daneben liegt das rohe JSON.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Zeiger der getesteten Ref wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „vor dem Release alles ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für Release-spezifische Plugin-/Paket-/statische/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Paketprüfungen, Maturity-Scorecard-Rendering aus QA-Profil-Evidenz, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stable- und Full-Profile enthalten immer umfassende Live-/E2E- und Docker-Release-Pfad-Soak-Abdeckung; das Beta-Profil kann sie mit `run_release_soak=true` aktivieren. Das kanonische Paket-Telegram-E2E läuft innerhalb von Package Acceptance, sodass ein vollständiger Kandidat keinen doppelten Live-Poller startet. Übergeben Sie nach der Veröffentlichung `release_package_spec`, um das ausgelieferte npm-Paket über Release Checks, Package Acceptance, Docker, Cross-OS und Telegram hinweg wiederzuverwenden, ohne neu zu bauen. Verwenden Sie `npm_telegram_package_spec` nur für einen fokussierten Telegram-Neulauf mit veröffentlichtem Paket. Die Live-Paket-Lane des Codex-Plugins verwendet standardmäßig denselben ausgewählten Zustand: ein veröffentlichtes `release_package_spec=openclaw@<tag>` leitet `codex_plugin_spec=npm:@openclaw/codex@<tag>` ab, während SHA-/Artefaktläufe `extensions/codex` aus der ausgewählten Ref packen. Setzen Sie `codex_plugin_spec` explizit für benutzerdefinierte Plugin-Quellen wie `npm:`-, `npm-pack:`- oder `git:`-Specs.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die Stage-Matrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und fokussierten Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn von `release/YYYY.M.PATCH` oder `main`, nachdem das Release-Tag existiert und nachdem der OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`, dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht `Plugin ClawHub Release` für dieselbe Release-SHA und dispatcht erst dann `OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`. Stable-Publishing erfordert außerdem ein exaktes `windows_node_tag`; der Workflow verifiziert das Windows-Source-Release und vergleicht seine x64-/ARM64-Installer mit der kandidatengenehmigten Eingabe `windows_node_installer_digests`, bevor ein Publish-Child startet. Danach promotet und verifiziert er dieselben gepinnten Installer-Digests plus den exakten Companion-Asset- und Prüfsummenvertrag, bevor der GitHub-Release-Draft veröffentlicht wird.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Für gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den Helper statt `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der Helper pusht einen temporären Branch `release-ci/<sha>-...` auf der Ziel-SHA, dispatcht `Full Release Validation` von dieser gepinnten Ref, verifiziert, dass jede Child-Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der Lauf abgeschlossen ist. Der Umbrella-Verifier schlägt ebenfalls fehl, wenn ein Child-Workflow mit einer anderen SHA ausgeführt wurde.

`release_profile` steuert die Live-/Provider-Breite, die an Release Checks übergeben wird. Die manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie bewusst die breite beratende Provider-/Medienmatrix möchten. Stable- und Full-Release-Checks führen immer den umfassenden Live-/E2E- und Docker-Release-Pfad-Soak aus; das Beta-Profil kann ihn mit `run_release_soak=true` aktivieren.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` ergänzt das stabile Provider-/Backend-Set.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die dispatchten Child-Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Child-Run-Ergebnisse erneut und hängt Tabellen mit den langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Zur Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt ein Neulauf einer fehlgeschlagenen Release-Box nach einem fokussierten Fix begrenzt. Für eine fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Packaged-Upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind beratend, außer dem Standard-Runtime-Tool-Coverage-Gate, das blockiert, wenn erforderliche dynamische OpenClaw-Tools in der Standard-Tier-Zusammenfassung abweichen oder verschwinden.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Checks und Package Acceptance sowie an den Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paket-Bytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs neu gepackt werden. Für die Live-Lane des Codex-npm-Plugins übergeben Release Checks entweder eine passende veröffentlichte Plugin-Spec, die aus `release_package_spec` abgeleitet wird, übergeben die vom Operator bereitgestellte `codex_plugin_spec` oder lassen die Eingabe leer, damit das Docker-Skript das Codex-Plugin des ausgewählten Checkouts packt.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all` ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den er bereits dispatcht hat, wenn der Parent abgebrochen wird, sodass eine neuere Main-Validierung nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Release-Branch-/Tag-Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das Release-Live-/E2E-Child behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

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

Dadurch bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler leichter erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs verifizieren vor dem Setup nur die Binaries. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal; anschließend laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite `timeout`-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Bereinigungspfad schnell fehlschlägt, statt das gesamte Release-Check-Budget aufzubrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketabnahme

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Quellbaum, während die Paketabnahme einen einzelnen Tarball über dasselbe Docker-E2E-Harness validiert, das Nutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, Docker-Abnahme oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Abnahme veröffentlichter Vorab-/Stable-Releases.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver holt OpenClaw-Branches/-Tags, verifiziert, dass der ausgewählte Commit aus der Branch-Historie des Repositorys oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine öffentliche HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich. Dieser Pfad weist URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/für Sonderzwecke reservierte Hostnamen oder aufgelöste IPs sowie Weiterleitungen außerhalb derselben öffentlichen Sicherheitsrichtlinie zurück.
- `source=trusted-url` lädt eine HTTPS-`.tgz` von einer benannten Trusted-Source-Richtlinie in `.github/package-trusted-sources.json` herunter; `package_sha256` und `trusted_source_id` sind erforderlich. Verwenden Sie dies nur für maintainer-eigene Enterprise-Mirrors oder private Paket-Repositorys, die konfigurierte Hosts, Ports, Pfadpräfixe, Weiterleitungs-Hosts oder Private-Network-Auflösung benötigen. Wenn die Richtlinie Bearer-Auth deklariert, verwendet der Workflow das feste Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in URLs eingebettete Zugangsdaten werden weiterhin zurückgewiesen.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` gilt. So kann das aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Blöcke mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Für die dedizierte Richtlinie zu Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Standards und Fehlertriage,
siehe [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Checks rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `release_package_spec` in Full Release Validation oder OpenClaw Release Checks nach der Veröffentlichung einer Beta, um dieselbe Matrix gegen das ausgelieferte npm-Paket ohne Neubau auszuführen; setzen Sie `package_acceptance_package_spec` nur, wenn Package Acceptance ein anderes Paket als der Rest der Release-Validierung benötigt. Release-Checks über mehrere Betriebssysteme hinweg decken weiterhin betriebssystemspezifisches Onboarding, Installer- und Plattformverhalten ab; die Produktvalidierung für Pakete/Updates sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paket-Baseline im blockierenden Release-Pfad. In Package Acceptance ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die Fallback-Veröffentlichungs-Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten stabilen npm-Releases plus fixierte Plugin-Kompatibilitätsgrenzen-Releases und issue-geformte Fixtures für Feishu-Konfiguration, erhaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitsroots zu erweitern. Multi-Baseline-Auswahlen für published-upgrade survivor werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um erschöpfende Bereinigung veröffentlichter Updates geht, nicht um die normale Breite der Full-Release-CI. Lokale Aggregatläufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` eine einzelne Lane beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebrannten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die frisch installierten Windows-Paket- und Installer-Lanes prüfen außerdem, dass ein installiertes Paket ein Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.5`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf im Tarball ausgelassene Dateien verweisen;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus dem aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten erlauben, während weiterhin gefordert ist, dass Install-Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem für bereits ausgelieferte lokale Build-Metadaten-Stempeldateien warnen. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung von `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie dann den Child-Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasenzeiten und Befehle zum erneuten Ausführen. Führen Sie vorzugsweise das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an Paketen/Manifesten gebündelter Plugins oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quellcodeänderungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für `agents delete shared-workspace` aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für eine gebündelte Erweiterung und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Checks und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Logik für den Änderungsumfang bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, aber Pull Requests und `main`-Pushes tun dies nicht. Normale PR-CI führt weiterhin die schnelle Bun-Launcher-Regressions-Lane für Node-relevante Änderungen aus. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` erstellt ein gemeinsames Live-Test-Image vorab, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes nach `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Werte

| Variable                               | Standard | Zweck                                                                                             |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Obergrenze für gleichzeitige npm-Install-Lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Create-Stürme des Docker-Daemons zu vermeiden; `0` ohne Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihre effektive Grenze ist, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Das lokale Aggregat führt Docker-Preflights aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Zeiten für eine Longest-First-Sortierung und stoppt standardmäßig nach dem ersten Fehler die Einplanung neuer gepoolter Lanes.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht Paket-Digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell wiederholt wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren Chunk-Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` sowie `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `package-update-openai` enthält die Live-Codex-Plugin-Paket-Lane, die das Kandidatenpaket von OpenClaw installiert, das Codex-Plugin aus `codex_plugin_spec` oder einem Tarball derselben Referenz mit expliziter Genehmigung für die Codex-CLI-Installation installiert, Codex-CLI-Preflight ausführt und dann mehrere OpenClaw-Agent-Turns derselben Sitzung gegen OpenAI ausführt. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` eingebunden, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält einen eigenständigen `openwebui`-Chunk nur für reine OpenWebUI-Dispatches. Update-Lanes gebündelter Channels versuchen bei transienten npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Timings, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus statt gegen die Chunk-Jobs. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image für diesen Rerun lokal. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # Docker-Artefakte herunterladen und kombinierte/pro-Lane gezielte Rerun-Befehle ausgeben
pnpm test:docker:timings <summary>   # Zusammenfassungen langsamer Lanes und des kritischen Pfads der Phasen
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Prerelease

`Plugin Prerelease` ist aufwendigere Produkt-/Paket-Abdeckung und daher ein separater Workflow, der durch `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt Tests gebündelter Plugins über acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-exklusive Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren. Der Workflow lädt außerdem ein informatives Artefakt `plugin-inspector-advisory` aus `@openclaw/plugin-inspector` hoch; Inspector-Funde sind Triage-Eingaben und ändern das blockierende Plugin-Prerelease-Gate nicht.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des wichtigen, intelligent begrenzten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Checks führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mockqualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modell-Latenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert Memory-Suche, weil QA-Parität Memory-Verhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt vor der Release-Freigabe auch die releasekritischen QA-Lab-Lanes aus; sein QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt dann beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Für normale PRs folgen Sie begrenzter CI-/Check-Evidenz, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der Workflow `CodeQL` ist absichtlich ein enger Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code plus die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit Security-Abfragen hoher Vertrauenswürdigkeit, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt schlank: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Security-Matrix hoher Vertrauenswürdigkeit wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Geheimnisse, Sandbox, Cron und Gateway-Baseline                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge für Kernkanäle plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Geheimnisse, Audit-Berührungspunkte         |
| `/codeql-security-high/network-ssrf-boundary`     | Kern-SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und SSRF-Policy-Oberflächen des Plugin SDK                                            |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen zur Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                          |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensoberflächen für Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Plugin SDK-Package-Vertrag |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Plausibilitätsprüfung akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Dependency-Build-Ergebnisse aus der hochgeladenen SARIF-Datei heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Defaults, weil der macOS-Build die Laufzeit auch bei sauberem Durchlauf dominiert.

### Critical Quality-Kategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Security-Shard. Er führt nur JavaScript/TypeScript-Quality-Queries mit Fehler-Schweregrad und ohne Security-Bezug über schmale, hochwertige Oberflächen auf GitHub-gehosteten Linux-Runnern aus, damit Quality-Scans kein Blacksmith-Runner-Registrierungsbudget verbrauchen. Sein Pull-Request-Guard ist absichtlich kleiner als das geplante Profil: Nicht-Entwurfs-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Authentifizierungs-/Geheimnis-/Sandbox-/Security-Code, Kernkanal- und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Verknüpfung, MCP-/Prozess-/ausgehende Zustellung, Provider-Runtime-/Modellkatalog, Sitzungsdiagnose-/Zustellungsqueues, Plugin-Loader, Plugin SDK-/Package-Vertrag oder Änderungen an der Plugin SDK-Reply-Runtime aus. Änderungen an CodeQL-Config und Quality-Workflow führen alle zwölf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Lehr- und Iterations-Hooks, um einen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code für Authentifizierung, Geheimnisse, Sandbox, Cron und Gateway-Security-Grenzen                                                                                     |
| `/codeql-critical-quality/config-boundary`              | Config-Schema-, Migrations-, Normalisierungs- und IO-Verträge                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Server-Methoden-Verträge                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Kernkanäle und gebündelte Channel-Plugins                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Queues sowie ACP-Control-Plane-Runtime-Verträge                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                              |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliase, Aktivierungsverknüpfung der Memory-Runtime und Memory-Doctor-Befehle                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Reply-Queue, Sitzungszustellungsqueues, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Oberflächen für Diagnoseereignis-/Log-Bundles und CLI-Verträge des Session-Doctors |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound-Reply-Dispatch des Plugin SDK, Reply-Payload-/Chunking-/Runtime-Hilfsfunktionen, Channel-Reply-Optionen, Zustellungsqueues und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Discovery, Provider-Runtime-Registrierung, Provider-Defaults/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kern-Web-Fetch/-Search, Medien-IO, Medienverständnis, Bildgenerierung und Runtime-Verträge für Mediengenerierung                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichte package-seitige Plugin-SDK-Source und Hilfsfunktionen für Plugin-Package-Verträge                                                                      |

Quality bleibt von Security getrennt, damit Quality-Findings geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als scoped oder geshardete Folgearbeit hinzugefügt werden, nachdem die schmalen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er ausgeführt wird, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf lief oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, erlaubt Codex nur kleine, coverage-erhaltende Test-Performance-Fixes statt breiter Refactorings, führt anschließend den Bericht für die vollständige Suite erneut aus und lehnt Änderungen ab, die die Baseline-Anzahl bestandener Tests reduzieren. Der gruppierte Bericht zeichnet pro Config Wall Time und maximale RSS unter Linux und macOS auf, sodass der Vorher/Nachher-Vergleich Test-Speicher-Deltas neben Dauer-Deltas sichtbar macht. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Nach-Agent-Bericht für die vollständige Suite muss bestehen, bevor etwas committet wird. Wenn `main` weiterzieht, bevor der Bot-Push landet, rebased die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs-Agent beibehalten kann.

### Duplicate PRs After Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für das Aufräumen von Duplikaten nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor GitHub verändert wird, prüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Kern-Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/-Guards aus;
- reine Änderungen an Core-Tests führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Änderungen an Extension-Tests führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder am Plugin-Vertrag erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Config-/Root-Dependency-Checks aus;
- unbekannte Root-/Config-Änderungen fallen fail-safe auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing liegt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Source-Änderungen bevorzugen explizite Mappings, dann Geschwistertests und Import-Graph-Abhängige. Die Shared-Group-Room-Zustellungsconfig ist eines der expliziten Mappings: Änderungen an der für Gruppen sichtbaren Reply-Config, am Source-Reply-Delivery-Mode oder am Message-Tool-System-Prompt laufen über die Core-Reply-Tests plus Discord- und Slack-Zustellungsregressionen, sodass eine gemeinsame Default-Änderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass die günstige gemappte Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Proof. Verwenden Sie ihn
vom Repo-Root aus, wenn ein Check zu breit für einen lokalen Edit-Loop ist, wenn CI-
Parität wichtig ist oder wenn der Proof Geheimnisse, Docker, Package-Lanes,
wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist
`blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback bei Blacksmith-
Ausfällen, Quotenproblemen oder explizitem Testen auf eigener Kapazität.

Von Crabbox gestützte Blacksmith-Ausführungen wärmen One-Shot-Testboxes vor, beanspruchen, synchronisieren, führen aus, melden und räumen auf. Die eingebaute Sync-Plausibilitätsprüfung schlägt früh fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwinden oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen zeigt. Setzen Sie für absichtliche PRs mit vielen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für den Remote-Befehl.

Crabbox beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten ohne Ausgabe nach dem Sync in der Sync-Phase bleibt. Setzen Sie `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diese Schutzfunktion zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren Millisekundenwert.

Prüfen Sie vor der ersten Ausführung den Wrapper aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert eine veraltete Crabbox-Binärdatei, die `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` Owned-Cloud-Defaults enthält. Vermeiden Sie in Codex-Worktrees oder verknüpften/sparse Checkouts das lokale Skript `pnpm crabbox:run`, weil pnpm vor dem Start von Crabbox Abhängigkeiten abgleichen kann; rufen Sie stattdessen den Node-Wrapper direkt auf:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Von Blacksmith gestützte Ausführungen erfordern Crabbox 0.22.0 oder neuer, damit der Wrapper das aktuelle Testbox-Sync-, Queue- und Cleanup-Verhalten erhält. Wenn Sie den benachbarten Checkout verwenden, bauen Sie die ignorierte lokale Binärdatei vor Timing- oder Nachweisarbeiten neu:

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

Gezielte Testwiederholung:

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. One-Shot-Blacksmith-gestützte Crabbox-Ausführungen sollten die Testbox automatisch stoppen; wenn eine Ausführung unterbrochen wird oder das Cleanup unklar ist, prüfen Sie laufende Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie Wiederverwendung nur, wenn Sie absichtlich mehrere Befehle auf derselben vorbereiteten Box benötigen:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes Blacksmith nur für Diagnosen wie `list`, `status` und Cleanup. Reparieren Sie den Crabbox-Pfad, bevor Sie eine direkte Blacksmith-Ausführung als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue Warmups aber nach ein paar Minuten ohne IP oder Actions-Ausführungs-URL in `queued` hängen, behandeln Sie dies als Druck durch Blacksmith-Provider, Queue, Abrechnung oder Organisationslimit. Stoppen Sie die von Ihnen erstellten Queue-IDs, starten Sie keine weiteren Testboxes und verlagern Sie den Nachweis auf den unten beschriebenen eigenen Crabbox-Kapazitätspfad, während jemand das Blacksmith-Dashboard, die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen, quotenbeschränkt ist, die benötigte Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie unter AWS-Druck `class=beast`, sofern die Aufgabe nicht wirklich CPU der 48xlarge-Klasse benötigt. Eine `beast`-Anforderung beginnt bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standard-Quoten auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases die ausgewählte Region/den ausgewählten Markt, Quotendruck, Spot-Fallback und Warnungen zu Klassen mit hohem Druck ausgeben. Verwenden Sie `fast` für schwerere breite Checks, `large` erst, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, gezielte Tests, reine Docs-Arbeit, gewöhnliche Lint-/Typecheck-Läufe, kleine E2E-Reproduktionen oder Blacksmith-Ausfalltriage. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Spot-Marktschwankungen nicht in das Signal gemischt werden.

`.crabbox.yaml` verwaltet Provider-, Sync- und GitHub-Actions-Hydration-Defaults für Owned-Cloud-Lanes. Sie schließt lokales `.git` aus, damit der vorbereitete Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt Maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für Owned-Cloud-Befehle `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
