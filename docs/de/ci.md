---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-06-28T00:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Kanonische
`main`-Pushes durchlaufen zuerst ein 90-sekündiges Zulassungsfenster für Hosted-Runner.
Die vorhandene `CI`-Concurrency-Gruppe bricht diesen wartenden Lauf ab, wenn ein neuerer
Commit landet, sodass sequenzielle Merges nicht jeweils eine vollständige Blacksmith-
Matrix registrieren. Pull Requests und manuelle Dispatches überspringen die Wartezeit. Der `preflight`-Job
klassifiziert anschließend den Diff und schaltet teure Lanes aus, wenn sich nur nicht verwandte
Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen bewusst das intelligente
Scoping und fächern den vollständigen Graphen für Release Candidates und breite
Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Release-spezifische
Plugin-Abdeckung lebt im separaten [`Plugin-Prerelease`](#plugin-prerelease)-
Workflow und läuft nur aus [`Vollständige Release-Validierung`](#full-release-validation)
oder durch einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                                | Zweck                                                                                                   | Wann er läuft                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und baut das CI-Manifest                   | Immer bei Nicht-Draft-Pushes und PRs                  |
| `runner-admission`                 | Gehostetes 90-sekündiges Debounce für kanonische `main`-Pushes, bevor Blacksmith-Arbeit registriert wird                | Jeder CI-Lauf; Sleep nur bei kanonischen `main`-Pushes |
| `security-fast`                    | Erkennung privater Schlüssel, Audit geänderter Workflows über `zizmor` und Audit des Produktions-Lockfiles                 | Immer bei Nicht-Draft-Pushes und PRs                  |
| `check-dependencies`               | Reiner Produktions-Knip-Abhängigkeitsdurchlauf plus Guard für die Allowlist ungenutzter Dateien                                 | Node-relevante Änderungen                               |
| `build-artifacts`                  | Baut `dist/`, Control UI, Smoke-Checks der gebauten CLI, eingebettete Prüfungen gebauter Artefakte und wiederverwendbare Artefakte | Node-relevante Änderungen                               |
| `checks-fast-core`                 | Schnelle Linux-Korrektheits-Lanes wie gebündelte, Protokoll-, QA Smoke CI- und CI-Routing-Prüfungen                | Node-relevante Änderungen                               |
| `checks-fast-contracts-plugins-*`  | Zwei geshardete Plugin-Vertragsprüfungen                                                                        | Node-relevante Änderungen                               |
| `checks-fast-contracts-channels-*` | Zwei geshardete Kanal-Vertragsprüfungen                                                                       | Node-relevante Änderungen                               |
| `checks-node-core-*`               | Core-Node-Test-Shards, ohne Kanal-, gebündelte, Vertrags- und Erweiterungs-Lanes                          | Node-relevante Änderungen                               |
| `check-*`                          | Geshardetes Äquivalent zum lokalen Haupt-Gate: Produktionstypen, Lint, Guards, Testtypen und strikter Smoke                | Node-relevante Änderungen                               |
| `check-additional-*`               | Architektur, geshardeter Boundary-/Prompt-Drift, Erweiterungs-Guards, Paketgrenze und Runtime-Topologie     | Node-relevante Änderungen                               |
| `checks-node-compat-node22`        | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                | Manueller CI-Dispatch für Releases                     |
| `check-docs`                       | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                             | Docs geändert                                        |
| `skills-python`                    | Ruff + pytest für Python-gestützte Skills                                                                    | Python-Skill-relevante Änderungen                       |
| `checks-windows`                   | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionen bei Runtime-Import-Spezifizierern                      | Windows-relevante Änderungen                            |
| `macos-node`                       | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                               | macOS-relevante Änderungen                              |
| `macos-swift`                      | Swift-Lint, Build und Tests für die macOS-App                                                            | macOS-relevante Änderungen                              |
| `ios-build`                        | Xcode-Projektgenerierung plus Simulator-Build der iOS-App                                                 | iOS-App, gemeinsames App-Kit oder Swabble-Änderungen         |
| `android`                          | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                              | Android-relevante Änderungen                            |
| `test-performance-agent`           | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                                 | Erfolgreiche Main-CI oder manueller Dispatch                  |
| `openclaw-performance`             | Tägliche/bei Bedarf Kova-Runtime-Performanceberichte mit Mock-Provider-, Deep-Profile- und GPT-5.5-Live-Lanes | Geplant und manueller Dispatch                       |

## Fail-Fast-Reihenfolge

1. `runner-admission` wartet nur bei kanonischen `main`-Pushes; ein neuerer Push bricht den Lauf vor der Blacksmith-Registrierung ab.
2. `preflight` entscheidet, welche Lanes überhaupt existieren. Die `docs-scope`- und `changed-scope`-Logik sind Schritte in diesem Job, keine eigenständigen Jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
4. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
5. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Matrix-Jobs verwenden `fail-fast: false`, und `build-artifacts` meldet eingebettete Kanal-, Core-Support-Boundary- und Gateway-Watch-Fehler direkt, statt kleine Verifier-Jobs einzureihen. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

Verwenden Sie `pnpm ci:timings`, `pnpm ci:timings:recent` oder `node scripts/ci-run-timings.mjs <run-id>`, um Wall-Time, Queue-Zeit, langsamste Jobs, Fehler und die `pnpm-store-warmup`-Fanout-Barriere aus GitHub Actions zusammenzufassen. CI lädt dieselbe Laufzusammenfassung auch als `ci-timings-summary`-Artefakt hoch. Prüfen Sie für Build-Timing den Schritt `Build dist` im Job `build-artifacts`: `pnpm build:ci-artifacts` gibt `[build-all] phase timings:` aus und enthält `ui:build`; der Job lädt außerdem das Artefakt `startup-memory` hoch.

Bei Pull-Request-Läufen führt der abschließende Timing-Summary-Job den Helper aus der vertrauenswürdigen Basisrevision aus, bevor `GH_TOKEN` an `gh run view` übergeben wird. Dadurch bleibt die tokenisierte Abfrage außerhalb von branch-kontrolliertem Code, während der aktuelle CI-Lauf des Pull Requests weiterhin zusammengefasst wird.

## PR-Kontext und Nachweise

PRs externer Beitragender führen ein PR-Kontext- und Nachweis-Gate aus
`.github/workflows/real-behavior-proof.yml` aus. Der Workflow checkt den vertrauenswürdigen
Basis-Commit aus und bewertet nur den PR-Body; er führt keinen Code aus dem
Branch der Beitragenden aus.

Das Gate gilt für PR-Autoren, die keine Repository-Eigentümer, Mitglieder,
Kollaboratoren oder Bots sind. Es besteht, wenn der PR-Body selbst verfasste
Abschnitte `What Problem This Solves` und `Evidence` enthält. Nachweise können ein fokussierter
Test, ein CI-Ergebnis, ein Screenshot, eine Aufzeichnung, Terminalausgabe, Live-Beobachtung,
ein redigiertes Log oder ein Artefakt-Link sein. Der Body liefert Absicht und nützliche Validierung;
Reviewer prüfen Code, Tests und CI, um die Korrektheit zu bewerten.

Wenn die Prüfung fehlschlägt, aktualisieren Sie den PR-Body, statt einen weiteren Code-Commit zu pushen.

## Scope und Routing

Scope-Logik lebt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, iOS-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen gescopet.
- **Workflow Sanity** führt `actionlint`, `zizmor` über alle Workflow-YAML-Dateien, den Composite-Action-Interpolations-Guard und den Konfliktmarker-Guard aus. Der PR-gescopte Job `security-fast` führt außerdem `zizmor` über geänderte Workflow-Dateien aus, damit Workflow-Sicherheitsbefunde früh im Main-CI-Graphen fehlschlagen.
- **Docs bei `main`-Pushes** werden durch den eigenständigen `Docs`-Workflow mit demselben ClawHub-Docs-Mirror geprüft, der auch von CI verwendet wird, sodass gemischte Code-und-Docs-Pushes nicht zusätzlich den CI-Shard `check-docs` einreihen. Pull Requests und manuelle CI führen `check-docs` weiterhin aus CI aus, wenn sich Docs geändert haben.
- **TUI PTY** läuft bei TUI-Änderungen im Linux-Node-Shard `checks-node-core-runtime-tui-pty`. Der Shard führt `test/vitest/vitest.tui-pty.config.ts` mit `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` aus und deckt damit sowohl die deterministische Fixture-Lane `TuiBackend` als auch den langsameren Smoke `tui --local` ab, der nur den externen Modell-Endpunkt mockt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Vertrags-Helper-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifest-Pfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Kanalverträge, vollständige Core-Shards, Shards gebündelter Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen gescopet, die diese Lane ausführen; nicht verwandte Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Plugin-Verträge und Kanalverträge laufen jeweils als zwei gewichtete, Blacksmith-gestützte Shards mit dem Standard-Fallback auf GitHub-Runner, schnelle Core-Unit-/Support-Lanes laufen separat, die Core-Runtime-Infrastruktur ist zwischen State, Process/Config, Shared und drei Cron-Domain-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat/Auth/Model/HTTP-Plugin/Runtime/Startup-Lanes verteilt, statt auf gebaute Artefakte zu warten. Normale CI packt dann nur isolierte Infrastruktur-Include-Pattern-Shards in deterministische Bundles mit höchstens 64 Testdateien, wodurch die Node-Matrix reduziert wird, ohne nicht isolierte Command/Cron-, stateful Agents-Core- oder Gateway/Server-Suites zusammenzuführen; schwere feste Suites bleiben auf 8 vCPU, während die gebündelten und leichter gewichteten Lanes 4 vCPU verwenden. Pull Requests im kanonischen Repository verwenden einen zusätzlichen kompakten Zulassungsplan: dieselben Gruppen pro Konfiguration laufen in isolierten Unterprozessen innerhalb des aktuellen Linux-Node-Plans mit 34 Jobs, sodass ein einzelner PR nicht die vollständige Node-Matrix mit mehr als 70 Jobs registriert. Pushes auf `main`, manuelle Dispatches und Release-Gates behalten die vollständige Matrix. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge unter dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional-*` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste wird in einen prompt-lastigen Shard und einen kombinierten Shard für die verbleibenden Guard-Stripes gestreift, wobei jeweils ausgewählte unabhängige Guards parallel laufen und Timings pro Check ausgegeben werden. Die teure Codex-Happy-Path-Prompt-Snapshot-Drift-Prüfung läuft nur für manuelle CI und nur bei prompt-beeinflussenden Änderungen als eigener zusätzlicher Job, sodass normale unabhängige Node-Änderungen nicht hinter kalter Prompt-Snapshot-Generierung warten und die Boundary-Shards ausbalanciert bleiben, während Prompt-Drift weiterhin dem PR zugeordnet ist, der ihn verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Generierung innerhalb des Core-Support-Boundary-Shards mit gebauten Artefakten. Gateway-Watch, Kanaltests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Nach der Zulassung erlaubt die kanonische Linux-CI bis zu 24 gleichzeitige Node-Test-Jobs und
12 für die kleineren Fast-/Check-Lanes; Windows und Android bleiben bei zwei, weil
diese Runner-Pools schmaler sind.

Der kompakte PR-Plan erzeugt 18 Node-Jobs für die aktuelle Suite: Whole-Config-
Gruppen werden in isolierten Unterprozessen mit einem Batch-Timeout von 120 Minuten gebündelt,
während Include-Pattern-Gruppen dasselbe begrenzte Job-Budget teilen.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source Set oder Manifest; ihre Unit-Test-Lane kompiliert die Variante weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen produktionsbezogenen, nur auf Knip-Abhängigkeiten bezogenen Durchlauf, fest auf die neueste Knip-Version gepinnt, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knip's produktionsbezogene Funde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Unused-File-Guard schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für genaue Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei Pushes auf `main`;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, umsetzbar, riskant oder betrieblich nützlich ist. Routinemäßige Öffnungen, Bearbeitungen, Bot-Rauschen, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodies, Review-Text, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht-Android-bezogene Scoped-Lane: Linux-Node-Shards, Bundled-Plugin-Shards, Plugin- und Kanalvertrags-Shards, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Checks für gebaute Artefakte, Docs-Checks, Python-Skills, Windows, macOS, iOS-Build und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Checks, der release-only `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` erlaubt einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Manueller CI-Dispatch und Fallbacks für nicht kanonische Repositories, CodeQL-JavaScript-/Actions-Qualitätsscans, Workflow-Sanity, Labeler, Auto-Response, Docs-Workflows außerhalb der CI und Install-Smoke-Preflight, damit die Blacksmith-Matrix früher in die Queue kann                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, leichter gewichtete Extension-Shards, `checks-fast-core`, Plugin-/Kanalvertrags-Shards, die meisten gebündelten/leichter gewichteten Linux-Node-Shards, `check-guards`, `check-prod-types`, `check-test-types`, ausgewählte `check-additional-*`-Shards und `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Beibehaltene schwere Linux-Node-Suites, boundary-/extension-lastige `check-additional-*`-Shards und `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Queue-Zeit kostete mehr, als sie einsparte)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-15` zurück                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` und `ios-build` auf `openclaw/openclaw`; Forks fallen auf `macos-26` zurück                                                                                                                                                                                                  |

## Runner-Registrierungsbudget

OpenClaws aktueller GitHub-Runner-Registrierungs-Bucket erlaubt 3.000 self-hosted
Runner-Registrierungen pro 5 Minuten. Das Limit wird von allen Blacksmith-Runner-
Registrierungen in der Organisation `openclaw` gemeinsam genutzt, sodass das Hinzufügen einer weiteren Blacksmith-
Installation keinen neuen Bucket hinzufügt.

Behandeln Sie Blacksmith-Labels als knappe Ressource für Burst-Kontrolle. Jobs, die
nur routen, benachrichtigen, zusammenfassen, Shards auswählen oder kurze CodeQL-Scans ausführen, sollten
auf GitHub-hosted Runnern bleiben, sofern sie keine gemessenen Blacksmith-spezifischen
Anforderungen haben. Jede neue Blacksmith-Matrix, ein größeres `max-parallel` oder ein hochfrequenter
Workflow muss seine Worst-Case-Registrierungsanzahl zeigen und das organisationsweite
Ziel unter 2.000 Registrierungen pro 5 Minuten halten, damit Headroom für gleichzeitige
Repositories und erneut ausgeführte Jobs bleibt.

Die CI des kanonischen Repositories behält Blacksmith als Standard-Runner-Pfad für normale Push- und Pull-Request-Läufe bei. `workflow_dispatch` und Läufe in nicht kanonischen Repositories verwenden GitHub-hosted Runner, aber normale kanonische Läufe prüfen derzeit nicht den Zustand der Blacksmith-Queue und fallen nicht automatisch auf GitHub-hosted Labels zurück, wenn Blacksmith nicht verfügbar ist.

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

`OpenClaw Performance` ist der Workflow für Produkt-/Runtime-Performance. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch führt Benchmarks normalerweise für die Workflow-Referenz aus. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und latest-Zeiger werden nach der getesteten Referenz verschlüsselt, und jede `index.md` zeichnet die getestete Referenz/SHA, Workflow-Referenz/SHA, Kova-Referenz, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Start-, Gateway- und Agent-Turn-Hotspots.
- `live-openai-candidate`: ein echter OpenAI-`openai/gpt-5.5`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Quell-Probes aus: Gateway-Startzeit und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; RSS für Import gebündelter Plugins, wiederholte mock-OpenAI-`channel-chat-baseline`-Hello-Schleifen, CLI-Startbefehle gegen das gestartete Gateway und die Smoke-Performance-Probe für SQLite-State. Wenn der vorherige veröffentlichte mock-provider-Quellbericht für die getestete Referenz verfügbar ist, vergleicht die Quellzusammenfassung aktuelle RSS- und Heap-Werte mit dieser Baseline und markiert große RSS-Anstiege als `watch`. Die Markdown-Zusammenfassung der Quell-Probe liegt im Berichtsbündel unter `source/index.md`, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bündel, `index.md` und Quell-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Zeiger der getesteten Referenz wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für Release-spezifische Plugin-/Paket-/statische-/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Paketprüfungen, Rendering der Maturity Scorecard aus QA-Profilevidenz, QA-Lab-Parität, Matrix- und Telegram-Lanes. Stable- und Full-Profile enthalten immer umfassende Live-/E2E- und Docker-Release-Pfad-Soak-Abdeckung; das Beta-Profil kann sie mit `run_release_soak=true` aktivieren. Der kanonische Package-Telegram-E2E läuft innerhalb von Package Acceptance, sodass ein vollständiger Kandidat keinen doppelten Live-Poller startet. Übergeben Sie nach der Veröffentlichung `release_package_spec`, um das ausgelieferte npm-Paket über Release Checks, Package Acceptance, Docker, Cross-OS und Telegram hinweg ohne Neubau wiederzuverwenden. Verwenden Sie `npm_telegram_package_spec` nur für einen fokussierten Telegram-Rerun mit veröffentlichtem Paket. Die Live-Paket-Lane des Codex-Plugins verwendet standardmäßig denselben ausgewählten Zustand: veröffentlichtes `release_package_spec=openclaw@<tag>` leitet `codex_plugin_spec=npm:@openclaw/codex@<tag>` ab, während SHA-/Artefaktläufe `extensions/codex` aus der ausgewählten Referenz packen. Setzen Sie `codex_plugin_spec` explizit für benutzerdefinierte Plugin-Quellen wie `npm:`-, `npm-pack:`- oder `git:`-Specs.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
Handles für fokussierte Reruns.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn
aus `release/YYYY.M.PATCH` oder `main`, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht
`Plugin ClawHub Release` für dieselbe Release-SHA und dispatcht erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`. Stable-Publishing erfordert außerdem
ein exaktes `windows_node_tag`; der Workflow verifiziert das Windows-Quell-Release
und vergleicht dessen x64-/ARM64-Installer mit der vom Kandidaten genehmigten
Eingabe `windows_node_installer_digests` vor jedem Publish-Child, promoted
und verifiziert dann dieselben gepinnten Installer-Digests plus das exakte Begleit-Asset
und den Checksum-Contract, bevor der GitHub-Release-Entwurf veröffentlicht wird.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Für gepinnten Commit-Nachweis auf einem sich schnell bewegenden Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` an die Ziel-SHA,
dispatcht `Full Release Validation` aus dieser gepinnten Referenz, verifiziert, dass jede Child-Workflow-`headSha` mit dem Ziel übereinstimmt,
und löscht den temporären Branch, wenn der Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein Child-Workflow mit einer
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release Checks übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
absichtlich die breite advisory Provider-/Medienmatrix wünschen. Stable- und Full-
Release Checks führen immer den umfassenden Live-/E2E- und Docker-Release-Pfad-Soak aus;
das Beta-Profil kann ihn mit `run_release_soak=true` aktivieren.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt das Stable-Provider-/Backend-Set hinzu.
- `full` führt die breite advisory Provider-/Medienmatrix aus.

Der Umbrella zeichnet die dispatchten Child-Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Child-Run-Ergebnisse erneut und hängt Tabellen der langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifiziererjob erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Zur Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale Full-CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. So bleibt ein fehlgeschlagener Release-Box-Rerun nach einer fokussierten Korrektur begrenzt. Kombinieren Sie für eine fehlgeschlagene Cross-OS-Lane `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und packaged-upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind advisory, außer dem Standard-Gate für Runtime-Tool-Abdeckung, das blockiert, wenn erforderliche dynamische OpenClaw-Tools im Standard-Tier-Summary abweichen oder verschwinden.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Referenz, um die ausgewählte Referenz einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance sowie an den Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs erneut gepackt werden. Für die Codex-npm-Plugin-Live-Lane übergeben Release Checks entweder eine passende veröffentlichte Plugin-Spec, die aus `release_package_spec` abgeleitet wurde, die vom Operator gelieferte `codex_plugin_spec`, oder lassen die Eingabe leer, damit das Docker-Skript das Codex-Plugin des ausgewählten Checkouts packt.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den er
bereits dispatcht hat, wenn der Parent abgebrochen wird, sodass neuere main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Release-Branch-/Tag-
Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live-/E2E-Child behält breite native `pnpm test:live`-Abdeckung bei, führt sie jedoch als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs verifizieren nur die Binaries vor dem Setup. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal; anschließend laufen die Docker-Shards für Live-Modell, Provider-aufgeteiltes Gateway, CLI-Backend, ACP-Bind und Codex-Harness mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards führen explizite Skript-`timeout`-Obergrenzen unterhalb des Workflow-Job-Timeouts mit, damit ein hängender Container oder Bereinigungspfad schnell fehlschlägt, statt das gesamte Budget der Release-Prüfung zu verbrauchen. Wenn diese Shards das vollständige Quell-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketabnahme

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Quellbaum, während die Paketabnahme einen einzelnen Tarball über dasselbe Docker-E2E-Harness validiert, das Benutzer nach der Installation oder Aktualisierung ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert den Tarball-Bestand, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes anschließend als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, Docker-Abnahme oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Abnahme veröffentlichter Vorab- oder Stable-Releases.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, ob der ausgewählte Commit über die Repository-Branch-Historie oder ein Release-Tag erreichbar ist, installiert Abhängigkeiten in einem abgekoppelten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine öffentliche HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich. Dieser Pfad lehnt URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne/spezialverwendete Hostnamen oder aufgelöste IPs sowie Weiterleitungen außerhalb derselben öffentlichen Sicherheitsrichtlinie ab.
- `source=trusted-url` lädt eine HTTPS-`.tgz` aus einer benannten Trusted-Source-Richtlinie in `.github/package-trusted-sources.json` herunter; `package_sha256` und `trusted_source_id` sind erforderlich. Verwenden Sie dies nur für von Maintainern betriebene Unternehmens-Mirrors oder private Paket-Repositorys, die konfigurierte Hosts, Ports, Pfadpräfixe, Weiterleitungs-Hosts oder Auflösung in privaten Netzwerken benötigen. Wenn die Richtlinie Bearer-Authentifizierung deklariert, verwendet der Workflow das feste Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in URLs eingebettete Zugangsdaten werden weiterhin abgelehnt.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` ist. Dadurch kann das aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Blöcke mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der Pfad mit der veröffentlichten npm-Spezifikation bleibt für eigenständige Dispatches erhalten.

Informationen zur dedizierten Richtlinie für Update- und Plugin-Tests, einschließlich lokaler Befehle, Docker-Lanes, Package-Acceptance-Eingaben, Release-Defaults und Fehlertriage, finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `release_package_spec` in Full Release Validation oder OpenClaw Release Checks nach der Veröffentlichung einer Beta, um dieselbe Matrix gegen das ausgelieferte npm-Paket ohne Neubuild auszuführen; setzen Sie `package_acceptance_package_spec` nur, wenn Package Acceptance ein anderes Paket als der Rest der Release-Validierung benötigt. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer und Plattformverhalten ab; die Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paket-Basislinie im blockierenden Release-Pfad. In Package Acceptance ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Basislinie aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Basislinie bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten Stable-npm-Releases plus festgelegte Plugin-Kompatibilitäts-Grenz-Releases und issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Auswahlen mit mehreren Basislinien für Published-Upgrade-Survivor werden nach Basislinie in separate gezielte Docker-Runner-Jobs aufgeteilt. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um eine vollständige Bereinigung veröffentlichter Updates geht, nicht um die normale Breite der Full-Release-CI. Lokale aggregierte Läufe können exakte Paket-Spezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` eine einzelne Lane beibehalten, etwa `openclaw@2026.4.15`, oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Basislinie mit einem eingebauten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die Windows-Lanes für frische Paket- und Installer-Installationen prüfen außerdem, dass ein installiertes Paket eine Browser-Control-Override-Datei aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Smoke-Test für Agent-Turns verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.5`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus dem aus dem Tarball abgeleiteten gefälschten Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smoke-Tests dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Persistenz von Marketplace-Install-Records akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass Install-Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem für lokal gebaute Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder zu überspringen.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Paketabnahme-Laufs mit der Zusammenfassung von `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie vorzugsweise das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke-Test

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quellcodeänderungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den agents-delete-shared-workspace-CLI-Smoke aus, führt den container-gateway-network-E2E aus, verifiziert ein gebündeltes Extension-Build-Argument und führt das begrenzte gebündelte-Plugin-Docker-Profil unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (der Docker-Lauf jedes Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, workflow-call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet eines wieder, führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und den schnellen gebündelte-Plugin-Docker-E2E als separate Jobs aus, sodass Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. Normale PR-CI führt weiterhin die schnelle Bun-Launcher-Regressions-Lane für Node-relevante Änderungen aus. QR- und Installer-Docker-Tests behalten ihre eigenen install-fokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes nach `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Provider-sensible Slot-Anzahl des Tail-Pools.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Obergrenze für gleichzeitige npm-Install-Lanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Create-Stürme des Docker-Daemons zu vermeiden; `0` für keinen Versatz setzen. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agenten eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihre effektive Grenze, kann aus einem leeren Pool trotzdem starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation führt Docker-Preflights aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Zeiten für eine längste-zuerst-Sortierung und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Typ-, Live-Image-, Lane- und Zugangsdatenabdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Es packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan paketinstallierte Lanes benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Die Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur den benötigten Image-Typ zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `package-update-openai` enthält die Live-Codex-Plugin-Paket-Lane, die das Kandidatenpaket von OpenClaw installiert, das Codex-Plugin aus `codex_plugin_spec` oder einem Tarball derselben Referenz mit expliziter Genehmigung zur Codex-CLI-Installation installiert, einen Codex-CLI-Preflight ausführt und dann mehrere OpenClaw-Agent-Turns derselben Sitzung gegen OpenAI ausführt. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält einen eigenständigen `openwebui`-Chunk nur für reine OpenWebUI-Dispatches. Lanes für Updates gebündelter Channels versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images statt der Chunk-Jobs aus, wodurch das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt bleibt und das Paketartefakt für diesen Lauf vorbereitet, heruntergeladen oder wiederverwendet wird; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen Rerun. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte existieren, sodass eine fehlgeschlagene Lane genau das Paket und die Images des fehlgeschlagenen Laufs wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der durch `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt gebündelte Plugin-Tests auf acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-only Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für Jobs von ein bis drei Minuten zu reservieren. Der Workflow lädt außerdem ein informatives Artefakt `plugin-inspector-advisory` aus `@openclaw/plugin-inspector` hoch; Inspector-Feststellungen sind Triage-Eingaben und ändern das blockierende Plugin-Prerelease-Gate nicht.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des zentralen smart-gescopten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnessen verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Parity-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Provider-Plugin-Startup isoliert ist. Das Live-Transport-Gateway deaktiviert die Memory-Suche, weil QA-Parität das Memory-Verhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die release-kritischen QA-Lab-Lanes vor der Release-Genehmigung aus; sein QA-Parity-Gate führt Kandidaten- und Baseline-Packs als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Für normale PRs folgen Sie gescopten CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der Workflow `CodeQL` ist bewusst ein enger Security-Scanner der ersten Stufe, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code plus die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit High-Confidence-Security-Queries, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe High-Confidence-Security-Matrix aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Security-Kategorien

| Kategorie                                         | Oberfläche                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Basis                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Kernverträge für Channel-Implementierung plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte          |
| `/codeql-security-high/network-ssrf-boundary`     | Kernoberflächen für SSRF, IP-Parsing, Netzwerkschutz, Web-Fetch und SSRF-Richtlinien des Plugin SDK                                 |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfen zur Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensoberflächen für Plugin-Installation, Loader, Manifest, Registry, Paketmanager-Installation, Source-Loading und Plugin SDK-Paketvertrag |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App für CodeQL manuell auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Plausibilitätsprüfung akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App für CodeQL manuell auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardläufe, weil der macOS-Build selbst bei sauberem Lauf die Laufzeit dominiert.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt ausschließlich JavaScript/TypeScript-Qualitätsabfragen ohne Sicherheitsbezug und mit Fehler-Schweregrad über schmale, besonders wertvolle Oberflächen auf von GitHub gehosteten Linux-Runnern aus, damit Qualitätsscans kein Blacksmith-Runner-Registrierungsbudget verbrauchen. Sein Pull-Request-Gate ist absichtlich kleiner als das geplante Profil: Nicht-Entwurfs-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehl-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Authentifizierungs-/Secrets-/Sandbox-/Sicherheitscode, Kern-Channel und gebündelter Channel-Plugin-Runtime, Gateway-Protokoll-/Servermethode, Memory-Runtime-/SDK-Verknüpfung, MCP-/Prozess-/ausgehender Zustellung, Provider-Runtime-/Modellkatalog, Sitzungsdiagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin SDK-/Paketvertrag oder Plugin SDK-Reply-Runtime aus. Änderungen an CodeQL-Config und Qualitätsworkflow führen alle zwölf PR-Qualitäts-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Lehr- und Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Code für die Sicherheitsgrenze von Authentifizierung, Secrets, Sandbox, Cron und Gateway                                                                           |
| `/codeql-critical-quality/config-boundary`              | Verträge für Config-Schema, Migration, Normalisierung und IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Servermethodenverträge                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Kern-Channel und gebündelte Channel-Plugins                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Laufzeitverträge für Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin SDK-Aliasse, Verknüpfung zur Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Reply-Warteschlange, Sitzungszustellungswarteschlangen, Hilfen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Oberflächen und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Reply-Dispatch des Plugin SDK, Reply-Payload-/Chunking-/Runtime-Hilfen, Channel-Reply-Optionen, Zustellungswarteschlangen und Hilfen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Discovery, Provider-Runtime-Registrierung, Provider-Defaults/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Verträge für Kern-Web-Fetch/-Search, Medien-IO, Medienverständnis, Bildgenerierung und Mediengenerierungs-Runtime                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Plugin SDK-Einstiegspunkte                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketseitiger Plugin SDK-Quellcode und Hilfen für Plugin-Paketverträge                                                                           |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Die CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte erst wieder als abgegrenzte oder geshardete Folgearbeit hinzugefügt werden, nachdem die schmalen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungsworkflows

### Docs Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungslane, die vorhandene Dokumentation mit kürzlich gelandeten Änderungen synchron hält. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergelaufen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten main-Änderungen abdecken kann.

### Test Performance Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungslane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt den Bericht für die vollständige Suite anschließend erneut aus und weist Änderungen zurück, die die Baseline-Anzahl bestandener Tests verringern. Der gruppierte Bericht zeichnet pro Config die Wall-Time und den maximalen RSS unter Linux und macOS auf, sodass der Vorher/Nachher-Vergleich Speicherdeltas der Tests neben Laufzeitdeltas sichtbar macht. Wenn die Baseline fehlgeschlagene Tests hat, darf Codex nur offensichtliche Fehler beheben, und der anschließende Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` vor dem Bot-Push weiterläuft, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; kollidierende veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs-Agent beibehalten kann.

### Doppelte PRs nach Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für das Aufräumen von Duplikaten nach dem Landen. Standardmäßig läuft er als Dry-Run und schließt nur explizit aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor er GitHub mutiert, verifiziert er, dass der gelandete PR gemerged ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Produktions- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Produktions- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Teständerungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Config-/Root-Abhängigkeitschecks aus;
- unbekannte Root-/Config-Änderungen schlagen sicherheitshalber auf alle Check-Lanes fehl.

Das lokale Changed-Test-Routing lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Testbearbeitungen führen sich selbst aus, Source-Bearbeitungen bevorzugen explizite Mappings und danach Geschwistertests sowie Import-Graph-Dependents. Die gemeinsame Zustellungs-Config für Gruppenräume ist eines der expliziten Mappings: Änderungen an der für Gruppen sichtbaren Reply-Config, am Source-Reply-Zustellungsmodus oder am System-Prompt des Message-Tools laufen durch die Core-Reply-Tests plus Discord- und Slack-Zustellungsregressionen, damit eine gemeinsame Default-Änderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass die günstige gemappte Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Nachweise. Verwenden Sie ihn aus dem Repo-Root, wenn ein Check für eine lokale Bearbeitungsschleife zu breit ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Paket-Lanes, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback bei Blacksmith-Ausfällen, Quotenproblemen oder explizitem Testen auf eigener Kapazität.

Crabbox-gestützte Blacksmith-Läufe wärmen einmalige Testboxes auf, beanspruchen sie, synchronisieren, führen Befehle aus, melden Ergebnisse und räumen auf. Die integrierte Sync-Plausibilitätsprüfung schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwinden oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Setzen Sie für absichtliche PRs mit vielen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für den Remote-Befehl.

Crabbox beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der Sync-Phase bleibt, ohne Ausgabe nach dem Sync zu liefern. Setzen Sie `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diese Absicherung zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren Millisekundenwert.

Prüfen Sie vor dem ersten Lauf den Wrapper aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert ein veraltetes Crabbox-Binary, das `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, obwohl `.crabbox.yaml` Standardwerte für die eigene Cloud enthält. Vermeiden Sie in Codex-Worktrees oder verknüpften/sparse Checkouts das lokale Skript `pnpm crabbox:run`, weil pnpm Abhängigkeiten abgleichen kann, bevor Crabbox startet; rufen Sie stattdessen den Node-Wrapper direkt auf:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Blacksmith-gestützte Läufe erfordern Crabbox 0.22.0 oder neuer, damit der Wrapper das aktuelle Sync-, Queue- und Cleanup-Verhalten von Testbox erhält. Wenn Sie den benachbarten Checkout verwenden, bauen Sie das ignorierte lokale Binary vor Timing- oder Nachweisarbeiten neu:

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Bei delegierten Blacksmith-Testbox-Läufen sind der Exit-Code des Crabbox-Wrappers und die JSON-Zusammenfassung das Befehlsergebnis. Der verknüpfte GitHub-Actions-Lauf ist für Hydration und Keepalive verantwortlich; er kann als `cancelled` enden, wenn die Testbox extern gestoppt wird, nachdem der SSH-Befehl bereits zurückgekehrt ist. Behandeln Sie das als Cleanup-/Status-Artefakt, sofern der Wrapper-`exitCode` nicht ungleich null ist oder die Befehlsausgabe einen fehlgeschlagenen Test zeigt. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wird oder das Cleanup unklar ist, prüfen Sie die Live-Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

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

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes Blacksmith nur für Diagnosen wie `list`, `status` und Cleanup. Reparieren Sie den Crabbox-Pfad, bevor Sie einen direkten Blacksmith-Lauf als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue Warmups aber nach ein paar Minuten ohne IP oder Actions-Lauf-URL in `queued` stehen, behandeln Sie das als Druck durch Blacksmith-Provider, Queue, Abrechnung oder Organisationslimits. Stoppen Sie die von Ihnen erstellten Queue-IDs, starten Sie keine weiteren Testboxes und verschieben Sie den Nachweis auf den unten beschriebenen Crabbox-Kapazitätspfad der eigenen Cloud, während jemand das Blacksmith-Dashboard, die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen ist, durch Kontingente begrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie unter AWS-Druck `class=beast`, sofern die Aufgabe nicht wirklich CPU der 48xlarge-Klasse benötigt. Eine `beast`-Anforderung startet bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standardkontingente auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases ausgewählte Region/Markt, Kontingentdruck, Spot-Fallback und Warnungen zu Klassen unter hoher Auslastung ausgeben. Verwenden Sie `fast` für schwerere breite Checks, `large` erst, wenn standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Dokumentationsarbeit, gewöhnliches Linting/Typecheck, kleine E2E-Reproduktionen oder Blacksmith-Ausfalltriage. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Spot-Marktfluktuationen nicht in das Signal einfließen.

`.crabbox.yaml` besitzt Provider-, Sync- und GitHub-Actions-Hydration-Standardwerte für Lanes der eigenen Cloud. Sie schließt lokales `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Setup, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle mit `crabbox run --id <cbx_id>`.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
