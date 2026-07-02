---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlgeschlagene GitHub-Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Jobgraph, Bereichs-Gates, Release-Sammelbereiche und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-07-02T14:00:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei jedem Push auf `main` und bei jedem Pull Request ausgeführt. Kanonische
`main`-Pushes durchlaufen zuerst ein 90-sekündiges Admission-Fenster für Hosted Runner.
Die bestehende `CI`-Concurrency-Gruppe bricht diesen wartenden Lauf ab, wenn ein neuerer
Commit landet, sodass sequenzielle Merges nicht jeweils eine vollständige Blacksmith-
Matrix registrieren. Pull Requests und manuelle Dispatches überspringen die Wartezeit. Der Job `preflight`
klassifiziert anschließend den Diff und schaltet teure Lanes ab, wenn sich nur nicht zusammenhängende
Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen bewusst intelligentes
Scoping und fächern den vollständigen Graphen für Release Candidates und breite
Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Release-spezifische
Plugin-Abdeckung liegt im separaten Workflow [`Plugin Prerelease`](#plugin-prerelease)
und läuft nur über [`Full Release Validation`](#full-release-validation)
oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                                | Zweck                                                                                                     | Wann er läuft                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest     | Immer bei Nicht-Entwurfs-Pushes und PRs             |
| `runner-admission`                 | Hosted 90-Sekunden-Debounce für kanonische `main`-Pushes, bevor Blacksmith-Arbeit registriert wird        | Jeder CI-Lauf; Sleep nur bei kanonischen `main`-Pushes |
| `security-fast`                    | Erkennung privater Schlüssel, Audit geänderter Workflows via `zizmor` und Audit des Produktions-Lockfiles | Immer bei Nicht-Entwurfs-Pushes und PRs             |
| `check-dependencies`               | Reiner Produktions-Knip-Durchlauf für Abhängigkeiten plus Allowlist-Guard für ungenutzte Dateien          | Node-relevante Änderungen                           |
| `build-artifacts`                  | Baut `dist/`, Control UI, Built-CLI-Smoke-Checks, eingebettete Built-Artifact-Checks und wiederverwendbare Artefakte | Node-relevante Änderungen                           |
| `checks-fast-core`                 | Schnelle Linux-Korrektheits-Lanes wie gebündelte, Protokoll-, QA-Smoke-CI- und CI-Routing-Checks          | Node-relevante Änderungen                           |
| `checks-fast-contracts-plugins-*`  | Zwei geshardete Plugin-Contract-Checks                                                                    | Node-relevante Änderungen                           |
| `checks-fast-contracts-channels-*` | Zwei geshardete Channel-Contract-Checks                                                                   | Node-relevante Änderungen                           |
| `checks-node-core-*`               | Core-Node-Test-Shards, ausgenommen Channel-, gebündelte, Contract- und Erweiterungs-Lanes                 | Node-relevante Änderungen                           |
| `check-*`                          | Geshardetes Äquivalent zum lokalen Haupt-Gate: Produktionstypen, Lint, Guards, Testtypen und Strict Smoke | Node-relevante Änderungen                           |
| `check-additional-*`               | Architektur, geshardete Boundary-/Prompt-Drift, Erweiterungs-Guards, Paket-Boundary und Runtime-Topologie | Node-relevante Änderungen                           |
| `checks-node-compat-node22`        | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                              | Manueller CI-Dispatch für Releases                  |
| `check-docs`                       | Docs-Formatierung, Lint und Prüfungen auf defekte Links                                                   | Docs geändert                                       |
| `skills-python`                    | Ruff + pytest für Python-gestützte Skills                                                                 | Python-Skill-relevante Änderungen                   |
| `checks-windows`                   | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Runtime-Import-Spezifizierer-Regressionen          | Windows-relevante Änderungen                        |
| `macos-node`                       | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                        | macOS-relevante Änderungen                          |
| `macos-swift`                      | Swift-Lint, Build und Tests für die macOS-App                                                             | macOS-relevante Änderungen                          |
| `ios-build`                        | Xcode-Projektgenerierung plus Simulator-Build der iOS-App                                                 | iOS-App, gemeinsames App-Kit oder Swabble-Änderungen |
| `android`                          | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                             | Android-relevante Änderungen                        |
| `test-performance-agent`           | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                              | Erfolg der Main-CI oder manueller Dispatch          |
| `openclaw-performance`             | Tägliche/bedarfsgesteuerte Kova-Runtime-Performance-Berichte mit Mock-Provider, Deep-Profile und GPT-5.5-Live-Lanes | Geplant und manueller Dispatch                      |

## Fail-Fast-Reihenfolge

1. `runner-admission` wartet nur bei kanonischen `main`-Pushes; ein neuerer Push bricht den Lauf vor der Blacksmith-Registrierung ab.
2. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
4. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit Downstream-Consumer starten können, sobald der gemeinsame Build bereit ist.
5. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Matrix-Jobs verwenden `fail-fast: false`, und `build-artifacts` meldet eingebettete Channel-, Core-Support-Boundary- und Gateway-Watch-Fehler direkt, statt winzige Verifier-Jobs einzureihen. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

Verwenden Sie `pnpm ci:timings`, `pnpm ci:timings:recent` oder `node scripts/ci-run-timings.mjs <run-id>`, um Wall Time, Queue-Zeit, langsamste Jobs, Fehler und die `pnpm-store-warmup`-Fanout-Barriere aus GitHub Actions zusammenzufassen. CI lädt dieselbe Laufzusammenfassung auch als Artefakt `ci-timings-summary` hoch. Für Build-Timing prüfen Sie im Job `build-artifacts` den Schritt `Build dist`: `pnpm build:ci-artifacts` gibt `[build-all] phase timings:` aus und enthält `ui:build`; der Job lädt außerdem das Artefakt `startup-memory` hoch.

Bei Pull-Request-Läufen führt der abschließende Timing-Summary-Job den Helper aus der vertrauenswürdigen Base-Revision aus, bevor `GH_TOKEN` an `gh run view` übergeben wird. Dadurch bleibt die tokenisierte Abfrage außerhalb von branch-kontrolliertem Code, während der aktuelle CI-Lauf des Pull Requests dennoch zusammengefasst wird.

## PR-Kontext und Nachweise

Externe Contributor-PRs führen ein PR-Kontext- und Nachweis-Gate aus
`.github/workflows/real-behavior-proof.yml` aus. Der Workflow checkt den vertrauenswürdigen
Base-Commit aus und bewertet nur den PR-Body; er führt keinen Code aus dem
Contributor-Branch aus.

Das Gate gilt für PR-Autoren, die keine Repository-Owner, Mitglieder,
Collaborators oder Bots sind. Es besteht, wenn der PR-Body verfasste
Abschnitte `What Problem This Solves` und `Evidence` enthält. Nachweis kann ein fokussierter
Test, CI-Ergebnis, Screenshot, Recording, Terminalausgabe, Live-Beobachtung,
redigiertes Log oder Artefakt-Link sein. Der Body liefert Absicht und nützliche Validierung;
Reviewer prüfen Code, Tests und CI, um die Korrektheit zu bewerten.

Wenn die Prüfung fehlschlägt, aktualisieren Sie den PR-Body, statt einen weiteren Code-Commit zu pushen.

## Scope und Routing

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich allein keine Windows-, iOS-, Android- oder nativen macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen gescopet.
- **Workflow Sanity** führt `actionlint`, `zizmor` über alle Workflow-YAML-Dateien, den Composite-Action-Interpolation-Guard und den Conflict-Marker-Guard aus. Der PR-gescopte Job `security-fast` führt außerdem `zizmor` über geänderte Workflow-Dateien aus, damit Workflow-Sicherheitsbefunde früh im Haupt-CI-Graphen fehlschlagen.
- **Docs bei `main`-Pushes** werden vom eigenständigen Workflow `Docs` mit demselben ClawHub-Docs-Mirror geprüft, den auch CI verwendet, sodass gemischte Code+Docs-Pushes nicht zusätzlich den CI-Shard `check-docs` einreihen. Pull Requests und manuelle CI führen `check-docs` weiterhin aus CI aus, wenn Docs geändert wurden.
- **TUI PTY** läuft im Linux-Node-Shard `checks-node-core-runtime-tui-pty` für TUI-Änderungen. Der Shard führt `test/vitest/vitest.tui-pty.config.ts` mit `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` aus, sodass er sowohl die deterministische `TuiBackend`-Fixture-Lane als auch den langsameren `tui --local`-Smoke abdeckt, der nur den externen Modell-Endpunkt mockt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Contract-Helper-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifest-Pfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel Contracts, vollständige Core-Shards, gebündelte Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Checks** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen gescopet, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Plugin-Verträge und Kanalverträge laufen jeweils als zwei gewichtete, von Blacksmith unterstützte Shards mit dem standardmäßigen GitHub-Runner-Fallback, Core-Unit-Fast-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist auf State, Process/Config, Shared und drei Cron-Domain-Shards verteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat/Auth/Model/HTTP-Plugin/Runtime/Startup-Lanes verteilt, statt auf gebaute Artefakte zu warten. Normales CI packt anschließend nur isolierte Infra-Include-Pattern-Shards in deterministische Bündel mit höchstens 64 Testdateien. Dadurch wird die Node-Matrix reduziert, ohne nicht isolierte Command/Cron-, zustandsbehaftete Agents-Core- oder Gateway/Server-Suites zusammenzuführen; schwere feste Suites bleiben auf 8 vCPU, während die gebündelten und leichter gewichteten Lanes 4 vCPU verwenden. Pull Requests im kanonischen Repository verwenden einen zusätzlichen kompakten Zulassungsplan: Dieselben Gruppen pro Konfiguration laufen in isolierten Subprozessen innerhalb des aktuellen Linux-Node-Plans mit 34 Jobs, sodass ein einzelner PR nicht die vollständige Node-Matrix mit mehr als 70 Jobs registriert. `main`-Pushes, manuelle Dispatches und Release-Gates behalten die vollständige Matrix bei. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-alls. Include-Pattern-Shards zeichnen Timing-Einträge mit dem Namen des CI-Shards auf, sodass `.artifacts/vitest-shard-timings.json` eine vollständige Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional-*` hält paketgrenzenbezogene Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologiearchitektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist in einen prompt-lastigen Shard und einen kombinierten Shard für die verbleibenden Guard-Stripes gestreift, wobei jeweils ausgewählte unabhängige Guards parallel laufen und Timings pro Check ausgegeben werden. Die teure Codex-Happy-Path-Prüfung auf Prompt-Snapshot-Drift läuft als eigener zusätzlicher Job nur für manuelles CI und prompt-beeinflussende Änderungen. So warten normale, nicht zusammenhängende Node-Änderungen nicht hinter kalter Prompt-Snapshot-Erzeugung, und die Boundary-Shards bleiben ausbalanciert, während Prompt-Drift weiterhin dem PR zugeordnet bleibt, der ihn verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Erzeugung innerhalb des Built-Artifact-Core-Support-Boundary-Shards. Gateway-Watch, Kanaltests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Nach der Zulassung erlaubt das kanonische Linux-CI bis zu 24 gleichzeitige Node-Testjobs und
12 für die kleineren Fast-/Check-Lanes; Windows und Android bleiben bei zwei, weil
diese Runner-Pools enger begrenzt sind.

Der kompakte PR-Plan gibt für die aktuelle Suite 18 Node-Jobs aus: Whole-Config-
Gruppen werden in isolierten Subprozessen mit einem Batch-Timeout von 120 Minuten gebündelt,
während Include-Pattern-Gruppen dasselbe begrenzte Job-Budget teilen.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend die Play-Debug-APK. Die Third-Party-Variante hat kein separates Source-Set und kein separates Manifest; ihre Unit-Test-Lane kompiliert die Variante dennoch mit den SMS-/Call-Log-BuildConfig-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` aus (ein produktionsbezogener Knip-Pass nur für Abhängigkeiten, fest auf die neueste Knip-Version gesetzt, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) sowie `pnpm deadcode:unused-files`, das Knip's produktionsbezogene Unused-File-Funde mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Unused-File-Guard schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag stehen lässt, während absichtlich dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Brücke von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt ein GitHub-App-Token aus `CLAWSWEEPER_APP_PRIVATE_KEY` und sendet dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, falls vorhanden. Sie vermeidet bewusst die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent sendet.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder operativ nützlich ist. Routinemäßige Eröffnungen, Bearbeitungen, Bot-Rauschen, doppelte Webhook-Signale und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Texte, Branch-Namen und Commit-Nachrichten entlang dieses gesamten Pfads als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normales CI aus, erzwingen aber jede nicht Android-bezogene scoped Lane: Linux-Node-Shards, Bundled-Plugin-Shards, Plugin- und Kanalvertrags-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Built-Artifact-Smoke-Checks, Docs-Checks, Python-Skills, Windows, macOS, iOS-Build und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; das vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Checks, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind vom CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine vollständige Release-Candidate-Suite nicht durch einen weiteren Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manueller CI-Dispatch und Fallbacks für nicht kanonische Repositorys, CodeQL-JavaScript-/Actions-Qualitätsscans, Workflow-Sanity, Labeler, Auto-Response, Docs-Workflows außerhalb des CI und Install-Smoke-Preflight, damit die Blacksmith-Matrix früher eingereiht werden kann                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, leichtere Extension-Shards, `checks-fast-core`, Plugin-/Kanalvertrags-Shards, die meisten gebündelten/leichteren Linux-Node-Shards, `check-guards`, `check-prod-types`, `check-test-types`, ausgewählte `check-additional-*`-Shards und `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Beibehaltene schwere Linux-Node-Suites, boundary-/extension-lastige `check-additional-*`-Shards und `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie einsparten)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-15` zurück                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` und `ios-build` auf `openclaw/openclaw`; Forks fallen auf `macos-26` zurück                                                                                                                                                                                                  |

## Runner-Registrierungsbudget

OpenClaw's aktueller GitHub-Bucket für Runner-Registrierungen meldet 10.000 Self-Hosted-
Runner-Registrierungen pro 5 Minuten in `ghx api rate_limit`. Prüfen Sie
`actions_runner_registration` vor jedem Tuning-Durchlauf erneut, da GitHub
diesen Bucket ändern kann. Das Limit wird von allen Blacksmith-Runner-Registrierungen in der
Organisation `openclaw` gemeinsam genutzt; daher fügt eine weitere Blacksmith-Installation
keinen neuen Bucket hinzu.

Behandeln Sie Blacksmith-Labels als knappe Ressource für Burst-Steuerung. Jobs, die
nur routen, benachrichtigen, zusammenfassen, Shards auswählen oder kurze CodeQL-Scans ausführen, sollten
auf GitHub-gehosteten Runnern bleiben, sofern sie keine gemessenen Blacksmith-spezifischen
Anforderungen haben. Jede neue Blacksmith-Matrix, ein größeres `max-parallel` oder ein hochfrequenter
Workflow muss seine Worst-Case-Registrierungszahl ausweisen und das organisationsweite
Ziel unter etwa 60 % des Live-Buckets halten. Beim aktuellen Bucket mit 10.000 Registrierungen
bedeutet das ein Betriebsziel von 6.000 Registrierungen, mit Spielraum für
gleichzeitige Repositorys, Wiederholungen und überlappende Bursts.

CI im kanonischen Repository behält Blacksmith als standardmäßigen Runner-Pfad für normale Push- und Pull-Request-Läufe bei. `workflow_dispatch` und Läufe in nicht kanonischen Repositorys verwenden GitHub-gehostete Runner, aber normale kanonische Läufe prüfen derzeit nicht die Blacksmith-Warteschlangengesundheit und fallen nicht automatisch auf GitHub-gehostete Labels zurück, wenn Blacksmith nicht verfügbar ist.

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

## OpenClaw-Performance

`OpenClaw Performance` ist der Workflow für Produkt- und Runtime-Performance. Er wird täglich auf `main` ausgeführt und kann manuell gestartet werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarked normalerweise den Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und aktuelle Pointer werden nach dem getesteten Ref verschlüsselt, und jede `index.md` erfasst den getesteten Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit dem gepinnten Eingabewert `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, Gateway und Agent-Turn.
- `live-openai-candidate`: ein echter OpenAI-Agent-Turn mit `openai/gpt-5.5`, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Boot-Timing und Arbeitsspeicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; RSS für den Import gebündelter Plugins, wiederholte mock-OpenAI-`channel-chat-baseline`-Hello-Loops, CLI-Startbefehle gegen das gestartete Gateway und die SQLite-State-Smoke-Performance-Probe. Wenn der zuvor veröffentlichte mock-provider-Source-Bericht für den getesteten Ref verfügbar ist, vergleicht die Source-Zusammenfassung aktuelle RSS- und Heap-Werte mit dieser Baseline und markiert große RSS-Anstiege als `watch`. Die Markdown-Zusammenfassung der Source-Probe liegt im Berichtsbündel unter `source/index.md`, daneben das rohe JSON.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bündel, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle tested-ref-Pointer wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für release-spezifische Plugin-/Paket-/statische/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, paketübergreifende Cross-OS-Prüfungen, Maturity-Scorecard-Rendering aus QA-Profilevidence, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stable- und Full-Profile enthalten immer umfassende Live-/E2E- und Docker-Release-Path-Soak-Abdeckung; das Beta-Profil kann sie mit `run_release_soak=true` aktivieren. Das kanonische Paket-Telegram-E2E läuft innerhalb von Package Acceptance, sodass ein vollständiger Kandidat keinen doppelten Live-Poller startet. Übergeben Sie nach der Veröffentlichung `release_package_spec`, um das ausgelieferte npm-Paket über Release Checks, Package Acceptance, Docker, Cross-OS und Telegram hinweg ohne Neubau wiederzuverwenden. Verwenden Sie `npm_telegram_package_spec` nur für einen fokussierten Telegram-Rerun mit veröffentlichtem Paket. Die Live-Paket-Lane des Codex-Plugins verwendet standardmäßig denselben ausgewählten Zustand: veröffentlichtes `release_package_spec=openclaw@<tag>` leitet `codex_plugin_spec=npm:@openclaw/codex@<tag>` ab, während SHA-/Artefaktläufe `extensions/codex` aus dem ausgewählten Ref packen. Setzen Sie `codex_plugin_spec` explizit für benutzerdefinierte Plugin-Quellen wie `npm:`-, `npm-pack:`- oder `git:`-Spezifikationen.

Siehe [vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
Handles für fokussierte Reruns.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn
von `release/YYYY.M.PATCH` oder `main`, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht
`Plugin ClawHub Release` für dieselbe Release-SHA und dispatcht erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`. Stable Publish erfordert außerdem
einen exakten `windows_node_tag`; der Workflow verifiziert das Windows-Source-
Release und vergleicht seine x64-/ARM64-Installer mit der kandidatenfreigegebenen
Eingabe `windows_node_installer_digests` vor jedem Publish-Child, promoted
und verifiziert dann dieselben gepinnten Installer-Digests plus das exakte Companion-Asset
und den Checksum-Vertrag, bevor der GitHub-Release-Draft veröffentlicht wird.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Für einen Proof mit gepinntem Commit auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` an der Ziel-SHA,
dispatcht `Full Release Validation` von diesem gepinnten Ref, verifiziert, dass jede Child-
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein Child-Workflow mit einer
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release Checks übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite beratende Provider-/Media-Matrix wünschen. Stable- und Full-
Release-Checks führen immer den umfassenden Live-/E2E- und Docker-Release-Path-Soak aus;
das Beta-Profil kann ihn mit `run_release_soak=true` aktivieren.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes.
- `stable` ergänzt den stabilen Provider-/Backend-Satz.
- `full` führt die breite beratende Provider-/Media-Matrix aus.

Der Umbrella zeichnet die dispatchten Child-Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Child-Run-Conclusions erneut und hängt Tabellen der langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt der Rerun einer fehlgeschlagenen Release-Box nach einem fokussierten Fix begrenzt. Kombinieren Sie für eine fehlgeschlagene Cross-OS-Lane `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und packaged-upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind beratend, außer dem Standard-Runtime-Tool-Coverage-Gate, das blockiert, wenn erforderliche dynamische OpenClaw-Tools in der Standard-Tier-Zusammenfassung abweichen oder verschwinden.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance sowie an den Live-/E2E-Release-Path-Docker-Workflow, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs erneut gepackt werden. Für die Live-Lane des Codex-npm-Plugins übergeben Release Checks entweder eine passende veröffentlichte Plugin-Spezifikation, die von `release_package_spec` abgeleitet ist, übergeben das vom Operator bereitgestellte `codex_plugin_spec` oder lassen die Eingabe leer, sodass das Docker-Skript das Codex-Plugin des ausgewählten Checkouts packt.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den er
bereits dispatcht hat, wenn der Parent abgebrochen wird, sodass eine neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Release-Branch-/Tag-
Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live-/E2E-Child behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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
- aufgeteilte Media-Audio-/Video-Shards und Provider-gefilterte Music-Shards

Das erhält dieselbe Dateiabdeckung, macht langsame Live-Provider-Fehler aber einfacher erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle One-Shot-Reruns gültig.

Die nativen Live-Media-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Media-Jobs verifizieren die Binaries nur vor dem Setup. Halten Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal; anschließend laufen die Shards für Docker-Live-Modell, Provider-geshardeten Gateway, CLI-Backend, ACP-Bind und Codex-Harness mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite `timeout`-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Quell-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Wanduhrzeit mit doppelten Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Quellbaum, während die Paketakzeptanz einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes anschließend als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn die Paketakzeptanz eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen sind.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Vorab-/Stable-Releases.
- `source=ref` packt einen vertrauenswürdigen Branch, Tag oder vollständigen Commit-SHA aus `package_ref`. Der Resolver fetches OpenClaw-Branches/-Tags, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine öffentliche HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich. Dieser Pfad lehnt URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/spezielle Hostnamen oder aufgelöste IPs sowie Weiterleitungen außerhalb derselben öffentlichen Sicherheitsrichtlinie ab.
- `source=trusted-url` lädt eine HTTPS-`.tgz` aus einer benannten Trusted-Source-Richtlinie in `.github/package-trusted-sources.json` herunter; `package_sha256` und `trusted_source_id` sind erforderlich. Verwenden Sie dies nur für maintainer-eigene Enterprise-Spiegel oder private Paket-Repositorys, die konfigurierte Hosts, Ports, Pfadpräfixe, Redirect-Hosts oder private Netzwerkauflösung benötigen. Wenn die Richtlinie Bearer-Auth deklariert, verwendet der Workflow das feste Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in URLs eingebettete Zugangsdaten werden weiterhin abgelehnt.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` ist. So kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` erneut; der Pfad für veröffentlichte npm-Spezifikationen bleibt für eigenständige Dispatches erhalten.

Für die dedizierte Update- und Plugin-Testrichtlinie, einschließlich lokaler Befehle,
Docker-Lanes, Eingaben für die Paketakzeptanz, Release-Defaults und Fehlertriage,
siehe [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Checks rufen die Paketakzeptanz mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Live-ClawHub-Skill-Installation, Cleanup veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Proof auf demselben aufgelösten Paket-Tarball. Setzen Sie `release_package_spec` in Full Release Validation oder OpenClaw Release Checks nach der Veröffentlichung einer Beta, um dieselbe Matrix gegen das ausgelieferte npm-Paket ohne Neubau auszuführen; setzen Sie `package_acceptance_package_spec` nur, wenn die Paketakzeptanz ein anderes Paket als der Rest der Release-Validierung benötigt. Cross-OS-Release-Checks decken weiterhin OS-spezifisches Onboarding, Installer und Plattformverhalten ab; Paket-/Update-Produktvalidierung sollte mit der Paketakzeptanz beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf im blockierenden Release-Pfad eine veröffentlichte Paket-Baseline. In der Paketakzeptanz ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten stabilen npm-Releases plus gepinnte Plugin-Kompatibilitäts-Grenzreleases und issue-förmige Fixtures für Feishu-Konfiguration, erhaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Published-Upgrade-Survivor-Auswahlen mit mehreren Baselines werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn die Frage eine vollständige Bereinigung veröffentlichter Updates ist, nicht die normale Breite der Full-Release-CI. Lokale aggregierte Läufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebackenen Befehlsrezept `openclaw config set`, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie RPC-Status nach Gateway-Start. Die Windows-Paket- und Installer-Fresh-Lanes verifizieren außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.5`, sodass der Installations- und Gateway-Proof auf einem GPT-5-Testmodell bleibt und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Die Paketakzeptanz hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien zeigen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Subcase `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht anbietet;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus dem aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Persistenz von Marketplace-Install-Records akzeptieren;
- `plugin-update` darf eine Konfigurationsmetadatenmigration zulassen, während weiterhin verlangt wird, dass Install-Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem für lokale Build-Metadaten-Stamp-Dateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen fehl, statt zu warnen oder übersprungen zu werden.

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

Wenn Sie einen fehlgeschlagenen Paketakzeptanzlauf debuggen, beginnen Sie bei der Zusammenfassung von `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den Child-Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Rerun-Befehle. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** wird für Pull Requests ausgeführt, die Docker-/Paket-Oberflächen, Paket-/Manifeständerungen gebündelter Plugins oder Kern-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs geprüft werden. Reine Quellcodeänderungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den agents-delete-shared-workspace-CLI-Smoke aus, führt das container-gateway-network-E2E aus, verifiziert ein Build-Argument für eine gebündelte Erweiterung und führt das begrenzte Docker-Profil für gebündelte Plugins mit einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet es wieder; anschließend laufen QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat über `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow heraus, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. Normale PR-CI führt weiterhin die schnelle Bun-Launcher-Regressionsspur für Node-relevante Änderungen aus. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsam genutztes Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsam genutzte `scripts/e2e/Dockerfile`-Images:

- einen minimalen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktionalitäts-Lanes in `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, Planerlogik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Werte

| Variable                               | Standardwert | Zweck                                                                                         |
| -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Limit für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5            | Limit für gleichzeitige npm-Install-Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Limit für gleichzeitige Multi-Service-Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Staffelung zwischen Lane-Starts, um Erstellungsstürme im Docker-Daemon zu vermeiden; setzen Sie `0` für keine Staffelung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Limits. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nicht gesetzt | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | nicht gesetzt | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihr effektives Limit ist, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Das lokale Aggregat prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Zeiten für längste-zuerst-Sortierung und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch wiederholt, sodass ein hängender Registry-/Cache-Stream schnell neu versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren Chunk-Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `package-update-openai` enthält die Live-Codex-Plugin-Paket-Lane, die das Kandidatenpaket von OpenClaw installiert, das Codex-Plugin aus `codex_plugin_spec` oder einem Same-Ref-Tarball mit expliziter Codex-CLI-Installationsgenehmigung installiert, die Codex-CLI-Vorabprüfung ausführt und dann mehrere OpenClaw-Agent-Turns derselben Sitzung gegen OpenAI ausführt. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Wiederholungsalias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung es anfordert, und behält nur für OpenWebUI-spezifische Dispatches einen eigenständigen `openwebui`-Chunk. Update-Lanes für gebündelte Channels wiederholen bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeiten, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt die Fehlersuche für fehlgeschlagene Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diese Wiederholung. Generierte GitHub-Wiederholungsbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # Docker-Artefakte herunterladen und kombinierte/pro-Lane gezielte Wiederholungsbefehle ausgeben
pnpm test:docker:timings <summary>   # Zusammenfassungen langsamer Lanes und des kritischen Pfads der Phasen
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder einem expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt Tests für gebündelte Plugins auf acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-spezifische Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren. Der Workflow lädt außerdem ein informatives Artefakt `plugin-inspector-advisory` aus `@openclaw/plugin-inspector` hoch; Inspector-Befunde sind Triage-Eingaben und ändern das blockierende Plugin-Prerelease-Gate nicht.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des hauptsächlichen Smart-Scoped-Workflows. Agentic-Parität ist unter den breiten QA- und Release-Harnessen verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modell-Latenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert Memory-Suche, weil QA-Parität Memory-Verhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, Native-Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI es unterstützt. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die release-kritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt dann beide Artefakte in einen kleinen Report-Job für den abschließenden Paritätsvergleich herunter.

Für normale PRs folgen Sie scoped CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der Workflow `CodeQL` ist bewusst ein enger Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit hochzuverlässigen Sicherheitsabfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` oder prozesseigenen Runtime-Pfaden gebündelter Plugins und führt dieselbe hochzuverlässige Sicherheitsmatrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Channel-Implementierungsverträge plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte             |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Netzwerkschutz, Web-Fetch und SSRF-Policy-Oberflächen des Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen für Prozessausführung, ausgehende Zustellung und Gates für die Tool-Ausführung durch Agenten            |
| `/codeql-security-high/process-exec-boundary`     | Lokale Shell, Hilfsfunktionen zum Starten von Prozessen, gebündelte Plugin-Runtimes mit eigenen Subprozessen und Workflow-Skriptleim |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Vertrauensoberflächen des Plugin SDK-Package-Vertrags |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Plausibilitätsprüfung akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Dependency-Build-Ergebnisse aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Defaults, weil der macOS-Build die Laufzeit selbst bei sauberem Ergebnis dominiert.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Security-Shard. Er führt nur JavaScript/TypeScript-Qualitätsabfragen mit Fehlerschweregrad und ohne Security-Bezug über enge, hochwertige Oberflächen auf von GitHub gehosteten Linux-Runnern aus, damit Qualitätsscans kein Blacksmith-Runner-Registrierungsbudget verbrauchen. Sein Pull-Request-Guard ist absichtlich kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Core-Channel- und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Leim, MCP-/Prozess-/ausgehende Zustellung, Provider-Runtime-/Modellkatalog, Sitzungsdiagnostik-/Zustellungswarteschlangen, Plugin-Loader, Plugin SDK/Package-Vertrag oder Änderungen an der Reply-Runtime des Plugin SDK aus. CodeQL-Config- und Qualitäts-Workflow-Änderungen führen alle zwölf PR-Qualitäts-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks, um einen einzelnen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Auth-, Secrets-, Sandbox-, Cron- und Gateway-Security-Grenzcode                                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Config-Schema, Migration, Normalisierung und IO-Verträge                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Server-Methoden-Verträge                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Core-Channel und gebündeltes Channel-Plugin                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Brücken, Hilfsfunktionen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliase, Aktivierungsleim für Memory-Runtime und Memory-Doctor-Befehle                                       |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply-Queue-Interna, Sitzungszustellungswarteschlangen, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Oberflächen und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Reply-Dispatch des Plugin SDK, Reply-Payload-/Chunking-/Runtime-Hilfsfunktionen, Channel-Reply-Optionen, Zustellungswarteschlangen und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Auth und -Discovery, Provider-Runtime-Registrierung, Provider-Defaults/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries     |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/Search, Medien-IO, Medienverständnis, Bilderzeugung und Laufzeitverträge für Mediengenerierung                                                           |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichte package-seitige Plugin-SDK-Quelle und Hilfsfunktionen für den Plugin-Package-Vertrag                                                                     |

Qualität bleibt von Security getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als scoped oder geshardete Folgearbeit hinzugefügt werden, nachdem die engen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` inzwischen weitergelaufen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er überspringt, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die gesamte Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt anschließend den Bericht für die gesamte Suite erneut aus und lehnt Änderungen ab, die die Baseline-Anzahl bestandener Tests reduzieren. Der gruppierte Bericht erfasst Wall-Time pro Config und maximale RSS unter Linux und macOS, sodass der Vorher/Nachher-Vergleich Test-Speicherdeltas neben Laufzeitdeltas sichtbar macht. Wenn die Baseline fehlgeschlagene Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agenten muss bestehen, bevor etwas committet wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebaset die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; kollidierende veraltete Patches werden übersprungen. Sie verwendet von GitHub gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitsposition wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow zur Duplicate-Bereinigung nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` gesetzt ist. Bevor GitHub mutiert wird, verifiziert er, dass der gelandete PR gemergt ist und dass jedes Duplicate entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattform-Scope:

- Core-Produktionsänderungen führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Test-Änderungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Extension-Produktionsänderungen führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Test-Änderungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- öffentliche Plugin-SDK- oder Plugin-Contract-Änderungen erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Config-/Root-Dependency-Checks aus;
- unbekannte Root-/Config-Änderungen fallen aus Sicherheitsgründen auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Source-Änderungen bevorzugen explizite Mappings, dann Geschwistertests und Import-Graph-Abhängige. Die gemeinsame Group-Room-Zustellungs-Config ist eines der expliziten Mappings: Änderungen an der für Gruppen sichtbaren Reply-Config, dem Source-Reply-Zustellungsmodus oder dem Message-Tool-System-Prompt laufen über die Core-Reply-Tests plus Discord- und Slack-Zustellungsregressionen, sodass eine gemeinsame Default-Änderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass die günstige gemappte Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Nachweise. Verwenden Sie ihn
aus dem Repo-Root, wenn eine Prüfung zu breit für einen lokalen Edit-Loop ist, wenn CI-Parität
wichtig ist oder wenn der Nachweis Secrets, Docker, Package-Lanes,
wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist
`blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback für Blacksmith-
Ausfälle, Quotenprobleme oder explizite Tests auf eigener Kapazität.

Crabbox-gestützte Blacksmith-Läufe wärmen, beanspruchen, synchronisieren, führen aus, berichten und bereinigen
einmalige Testboxes. Die eingebaute Sync-Sanity-Prüfung schlägt schnell fehl, wenn erforderliche
Root-Dateien wie `pnpm-lock.yaml` verschwinden oder wenn `git status --short`
mindestens 200 nachverfolgte Löschungen zeigt. Setzen Sie für absichtliche PRs mit vielen Löschungen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für den Remote-Befehl.

Crabbox beendet außerdem eine lokale Blacksmith-CLI-Ausführung, die länger als
fünf Minuten in der Sync-Phase bleibt, ohne Ausgabe nach dem Sync zu erzeugen. Setzen Sie
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diesen Schutz zu deaktivieren, oder verwenden Sie einen größeren
Millisekundenwert für ungewöhnlich große lokale Diffs.

Prüfen Sie den Wrapper vor dem ersten Lauf aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper lehnt eine veraltete Crabbox-Binary ab, die `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` Defaults für die eigene Cloud enthält. Vermeiden Sie in Codex-Worktrees oder verknüpften/sparse Checkouts das lokale Skript `pnpm crabbox:run`, weil pnpm Abhängigkeiten abgleichen kann, bevor Crabbox startet; rufen Sie stattdessen den Node-Wrapper direkt auf:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-gestützte Läufe erfordern Crabbox 0.22.0 oder neuer, damit der Wrapper das aktuelle Testbox-Sync-, Queue- und Bereinigungsverhalten erhält. Wenn Sie den Sibling-Checkout verwenden, bauen Sie die ignorierte lokale Binary vor Timing- oder Nachweisarbeiten neu:

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
Befehlsergebnis. Der verlinkte GitHub-Actions-Lauf besitzt Hydration und Keepalive; er
kann als `cancelled` enden, wenn die Testbox extern gestoppt wird, nachdem der SSH-
Befehl bereits zurückgekehrt ist. Behandeln Sie das als Bereinigungs-/Statusartefakt, sofern
der Wrapper-`exitCode` nicht ungleich null ist oder die Befehlsausgabe einen fehlgeschlagenen Test zeigt.
Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen;
wenn ein Lauf unterbrochen wird oder die Bereinigung unklar ist, prüfen Sie Live-Boxen und stoppen Sie nur
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

Wenn Crabbox die defekte Ebene ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes
Blacksmith nur für Diagnosen wie `list`, `status` und Bereinigung. Reparieren Sie den
Crabbox-Pfad, bevor Sie einen direkten Blacksmith-Lauf als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue
Warmups aber nach ein paar Minuten ohne IP oder Actions-Lauf-URL in `queued` bleiben,
behandeln Sie das als Druck durch Blacksmith-Provider, Queue, Billing oder Org-Limits. Stoppen Sie die
von Ihnen erstellten Queue-IDs, starten Sie keine weiteren Testboxes und verschieben Sie den Nachweis auf den
untenstehenden Pfad mit eigener Crabbox-Kapazität, während jemand Blacksmith-Dashboard,
Billing und Org-Limits prüft.

Eskalieren Sie nur auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen, durch Quoten begrenzt oder ohne die benötigte Umgebung ist oder eigene Kapazität explizit das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie unter AWS-Druck `class=beast`, außer die Aufgabe benötigt wirklich CPU der 48xlarge-Klasse. Eine `beast`-Anfrage beginnt bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standard-Quoten auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, damit vermittelte AWS-Leases die ausgewählte Region/den ausgewählten Markt, Quotendruck, Spot-Fallback und Warnungen bei Klassen mit hohem Druck ausgeben. Verwenden Sie `fast` für schwerere breite Prüfungen, `large` nur, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Suite oder All-Plugin-Docker-Matrizen, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Docs-Arbeit, gewöhnliches Linting/Typecheck, kleine E2E-Repros oder Blacksmith-Ausfalltriage. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Spot-Marktfluktuation nicht in das Signal gemischt wird.

`.crabbox.yaml` besitzt Provider-, Sync- und GitHub-Actions-Hydration-Defaults für Lanes in eigener Cloud. Sie schließt lokale `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die Übergabe nicht geheimer Umgebungsdaten für eigene-Cloud-Befehle mit `crabbox run --id <cbx_id>`.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
