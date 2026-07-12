---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlgeschlagene GitHub-Actions-Prüfung
    - Sie koordinieren einen Lauf oder eine Wiederholung der Release-Validierung
    - Sie ändern die ClawSweeper-Weiterleitung oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Bereichs-Gates, Release-Umbrellas und entsprechende lokale Befehle
title: CI-Pipeline
x-i18n:
    generated_at: "2026-07-12T15:03:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei Pushes auf `main` (Markdown- und `docs/**`-Pfade werden
beim Trigger ignoriert), bei Pull Requests, die keine Entwürfe sind (reine CHANGELOG-Diffs werden ignoriert),
und bei manueller Auslösung ausgeführt. Kanonische Pushes auf `main` durchlaufen zunächst ein
90-sekündiges Zulassungsfenster für gehostete Runner; die Concurrency-Gruppe `CI` bricht
diesen wartenden Lauf ab, wenn ein neuerer Commit eintrifft, sodass aufeinanderfolgende Merges nicht jeweils
eine vollständige Blacksmith-Matrix registrieren. Pull Requests und manuelle Auslösungen überspringen die
Wartezeit. Der Job `preflight` klassifiziert anschließend den Diff und deaktiviert aufwendige Lanes,
wenn sich nur nicht zugehörige Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen die
intelligente Eingrenzung bewusst und fächern den vollständigen Graphen für Release-Kandidaten und
umfassende Validierungen auf. Android-Lanes bleiben über `include_android` (oder die Eingabe
`release_gate`) optional. Die ausschließlich für Releases vorgesehene Plugin-Abdeckung befindet sich
im separaten Workflow [`Plugin Prerelease`](#plugin-prerelease) und wird nur über
[`Full Release Validation`](#full-release-validation) oder eine explizite manuelle
Auslösung ausgeführt.

## Pipeline-Übersicht

| Job                                | Zweck                                                                                                                                                                                                                 | Ausführungszeitpunkt                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `preflight`                        | Erkennt reine Dokumentationsänderungen, geänderte Bereiche und geänderte Erweiterungen und erstellt das CI-Manifest                                                                                                   | Immer bei Nicht-Entwurfs-Pushes und -PRs              |
| `runner-admission`                 | Auf gehosteter Infrastruktur ausgeführte 90-sekündige Entprellung für kanonische Pushes auf `main`, bevor Blacksmith-Arbeit registriert wird                                                                          | Bei jedem CI-Lauf; Wartezeit nur bei kanonischen Pushes auf `main` |
| `security-fast`                    | Erkennung privater Schlüssel, Prüfung geänderter Workflows mit `zizmor` und Prüfung der Produktions-Lockfile                                                                                                          | Immer bei Nicht-Entwurfs-Pushes und -PRs              |
| `pnpm-store-warmup`                | Wärmt den durch die Lockfile festgelegten pnpm-Store-Cache auf, ohne Linux-Node-Shards zu blockieren                                                                                                                   | Wenn Node- oder Dokumentationsprüfungslanes ausgewählt sind |
| `build-artifacts`                  | Erstellt `dist/` und die Control UI und führt Smoke-Tests der gebauten CLI sowie Prüfungen des Startspeichers und eingebetteter Build-Artefakte durch                                                                  | Bei Node-relevanten Änderungen                        |
| `control-ui-i18n`                  | Überprüft generierte Control-UI-Sprachpakete, Metadaten und den Übersetzungsspeicher; bei automatischen Läufen informativ, bei manueller Release-CI blockierend                                                        | Bei für die Control-UI-i18n relevanten Änderungen und manueller CI |
| `checks-fast-core`                 | Schnelle Linux-Korrektheitslanes: gebündelte Komponenten und Protokoll, Bun-Launcher sowie die schnelle CI-Routing-Aufgabe                                                                                             | Bei Node-relevanten Änderungen                        |
| `qa-smoke-ci-profile`              | Zwei eigenständige, ausgewogene Teile der begrenzten repräsentativen automatischen QA-Smoke-Auswahl; die vollständige Taxonomieabdeckung bleibt über explizite QA-Profile verfügbar                                   | Bei Node-relevanten Änderungen                        |
| `checks-fast-contracts-plugins-*`  | Zwei gewichtete Shards für Plugin-Vertragstests                                                                                                                                                                       | Bei Node-relevanten Änderungen                        |
| `checks-fast-contracts-channels-*` | Zwei gewichtete Shards für Kanal-Vertragstests                                                                                                                                                                        | Bei Node-relevanten Änderungen                        |
| `checks-node-*`                    | Shards der zentralen Node-Tests, ausgenommen Kanal-, gebündelte, Vertrags- und Erweiterungslanes                                                                                                                       | Bei Node-relevanten Änderungen                        |
| `check-*`                          | In Shards aufgeteiltes Äquivalent des lokalen Haupt-Gates: Schutzprüfungen, Shrinkwrap, Konfigurationsmetadaten gebündelter Kanäle, Produktionstypen, Linting, Abhängigkeiten und Testtypen                              | Bei Node-relevanten Änderungen                        |
| `check-additional-*`               | Bereiche für Grenzprüfungen (einschließlich Abweichungen bei Prompt-Snapshots), Grenzen von Session-Zugriff, Transkriptleser und SQLite-Transaktionen, Erweiterungs-Lint-Gruppen, Paketgrenzen-Kompilierung/Canary und Runtime-Topologiearchitektur | Bei Node-relevanten Änderungen                        |
| `checks-node-compat-node22`        | Kompatibilitäts-Build und Smoke-Lane für Node 22                                                                                                                                                                      | Bei manueller CI-Auslösung für Releases               |
| `check-docs`                       | Prüfungen der Dokumentationsformatierung, des Lintings und auf defekte Links                                                                                                                                           | Bei geänderter Dokumentation (PRs und manuelle Auslösung) |
| `native-i18n`                      | i18n-Bestandsprüfungen für native App, Android und Apple                                                                                                                                                              | Bei für native i18n relevanten Änderungen             |
| `skills-python`                    | Ruff + pytest für Python-basierte Skills                                                                                                                                                                              | Bei für Python-Skills relevanten Änderungen           |
| `checks-windows`                   | Windows-spezifische Prozess- und Pfadtests sowie gemeinsame Regressionstests für Runtime-Importbezeichner                                                                                                             | Bei Windows-relevanten Änderungen                     |
| `macos-node`                       | Fokussierte TypeScript-Tests unter macOS: launchd, Homebrew, Runtime-Pfade, Paketierungsskripte und Prozessgruppen-Wrapper                                                                                             | Bei macOS-relevanten Änderungen                       |
| `macos-swift`                      | Swift-Linting, Build und Tests für die macOS-App                                                                                                                                                                      | Bei macOS-relevanten Änderungen                       |
| `ios-build`                        | Generierung des Xcode-Projekts sowie Simulator-Build der iOS-App                                                                                                                                                      | Bei Änderungen an der iOS-App, dem gemeinsamen App-Kit oder Swabble |
| `android`                          | Android-Unit-Tests für beide Varianten sowie ein Debug-APK-Build                                                                                                                                                      | Bei Android-relevanten Änderungen                     |
| `test-performance-agent`           | Separater Workflow: tägliche Optimierung langsamer Codex-Tests nach vertrauenswürdiger Aktivität                                                                                                                       | Nach erfolgreicher Haupt-CI oder bei manueller Auslösung |
| `openclaw-performance`             | Separater Workflow: tägliche bzw. bedarfsgesteuerte Kova-Runtime-Leistungsberichte mit Mock-Provider-, Deep-Profile- und GPT-5.6-Live-Lanes                                                                           | Zeitgesteuerte und manuelle Auslösung                 |

## Fail-Fast-Reihenfolge

1. `runner-admission` wartet nur auf kanonische Pushes auf `main`; ein neuerer Push bricht den Lauf vor der Blacksmith-Registrierung ab.
2. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik von `docs-scope` und `changed-scope` besteht aus Schritten innerhalb dieses Jobs, nicht aus eigenständigen Jobs.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die aufwendigeren Artefakt- und Plattformmatrix-Jobs zu warten.
4. `build-artifacts` und die nicht blockierende Prüfung `control-ui-i18n` laufen parallel zu den schnellen Linux-Lanes. Abweichungen bei generierten Übersetzungen bleiben sichtbar, während der eigenständige Aktualisierungsworkflow sie im Hintergrund behebt.
5. Danach werden die aufwendigeren Plattform- und Runtime-Lanes aufgefächert: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` und `android`.

GitHub kann abgelöste Jobs als `cancelled` markieren, wenn ein neuerer Push für denselben PR oder dieselbe `main`-Ref eingeht. Behandeln Sie dies als CI-Rauschen, sofern nicht auch der neueste Lauf für dieselbe Ref fehlschlägt. Matrix-Jobs verwenden `fail-fast: false`, und `build-artifacts` meldet Fehler bei eingebetteten Channels, an der Core-Support-Grenze und bei der Gateway-Überwachung direkt, anstatt kleine Verifizierungsjobs in die Warteschlange zu stellen. Der automatische CI-Parallelitätsschlüssel ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Warteschlangengruppe neuere Läufe auf main nicht unbegrenzt blockieren kann. Manuelle Läufe der vollständigen Testsuite verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab. Die Schutzprüfung für den Startspeicher der Plugin-Liste setzt auf selbst gehostetem Blacksmith Linux eine Obergrenze von 350 MiB und erlaubt auf von GitHub gehostetem Linux 425 MiB, da dessen RSS-Ausgangswert für dieselbe gebaute CLI höher ist.

Verwenden Sie `pnpm ci:timings`, `pnpm ci:timings:recent` oder `node scripts/ci-run-timings.mjs <run-id>`, um die Gesamtdauer, die Wartezeit, die langsamsten Jobs, Fehler und die `pnpm-store-warmup`-Fan-out-Barriere aus GitHub Actions zusammenzufassen. Der workflowinterne Job `ci-timings-summary` ist in `ci.yml` vorhanden, aber derzeit deaktiviert (`if: false`); führen Sie stattdessen das Timing-Hilfsprogramm lokal aus. Prüfen Sie für die Build-Zeitmessung im Job `build-artifacts` den Schritt `Build dist`: `pnpm build:ci-artifacts` gibt `[build-all] phase timings:` aus und schließt `ui:build` ein; der Job lädt außerdem das Artefakt `startup-memory` hoch.

## PR-Kontext und Nachweise

PRs externer Mitwirkender durchlaufen eine Prüfung von PR-Kontext und Nachweisen aus
`.github/workflows/real-behavior-proof.yml`. Der Workflow checkt die
vertrauenswürdige Workflow-Revision (`github.workflow_sha`) aus und wertet ausschließlich den PR-Text aus;
er führt keinen Code aus dem Branch des Mitwirkenden aus.

Die Prüfung gilt für PR-Autoren, die weder Repository-Eigentümer noch Mitglieder,
Mitwirkende oder Bots sind. Sie ist erfolgreich, wenn der PR-Text selbst verfasste
Abschnitte `What Problem This Solves` und `Evidence` enthält. Als Nachweis eignen sich ein gezielter
Test, ein CI-Ergebnis, ein Screenshot, eine Aufzeichnung, eine Terminalausgabe, eine Live-Beobachtung,
ein redigiertes Protokoll oder ein Artefakt-Link. Der Text beschreibt die Absicht und eine sinnvolle Validierung;
Reviewer prüfen Code, Tests und CI, um die Korrektheit zu beurteilen.

Wenn die Prüfung fehlschlägt, aktualisieren Sie den PR-Text, statt einen weiteren Code-Commit zu pushen.

## Umfang und Routing

Die Umfangslogik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Bei manueller Ausführung wird die Erkennung des Änderungsumfangs übersprungen, und das Preflight-Manifest verhält sich so, als hätte sich jeder einbezogene Bereich geändert.

- **Änderungen an CI-Workflows** validieren den Node-CI-Graphen, das Workflow-Linting und den Windows-Lauf (`ci.yml` führt ihn aus), erzwingen aber nicht von sich aus native Builds für iOS, Android oder macOS; diese Plattformläufe bleiben auf Änderungen am jeweiligen Plattformquellcode beschränkt.
- **Workflow-Prüfung** führt `actionlint`, `zizmor` für alle Workflow-YAML-Dateien, die Schutzprüfung für Composite-Action-Interpolation und die Schutzprüfung für Konfliktmarkierungen aus. Der PR-bezogene Job `security-fast` führt außerdem `zizmor` für geänderte Workflow-Dateien aus, damit Workflow-Sicherheitsbefunde frühzeitig im primären CI-Graphen fehlschlagen.
- **Dokumentation bei Pushes auf `main`** wird durch den eigenständigen Workflow `Docs` mit derselben ClawHub-Dokumentationsspiegelung wie in der CI geprüft, sodass gemischte Code- und Dokumentations-Pushes nicht zusätzlich den CI-Shard `check-docs` einreihen. Bei Pull Requests und manueller CI wird `check-docs` weiterhin über die CI ausgeführt, wenn sich die Dokumentation geändert hat.
- **TUI PTY** wird bei TUI-Änderungen im Linux-Node-Shard `checks-node-core-runtime-tui-pty` ausgeführt. Der Shard führt `test/vitest/vitest.tui-pty.config.ts` mit `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` aus und deckt damit sowohl den deterministischen Fixture-Lauf für `TuiBackend` als auch den langsameren Smoke-Test `tui --local` ab, der ausschließlich den externen Modellendpunkt mockt.
- **Reine CI-Routing-Änderungen, die kleine Menge von Core-Test-Fixtures, die der schnelle Task direkt ausführt, und eng begrenzte Änderungen an Hilfsfunktionen für Plugin-Verträge** verwenden einen schnellen, ausschließlich Node-basierten Manifestpfad: `preflight`, `security-fast` und nur die von der Änderung betroffenen schnellen Läufe — einen einzelnen CI-Routing-Task `checks-fast-core`, die beiden Shards für Plugin-Verträge oder beide. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Kanalverträge, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Schutzmatrizen.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, Hilfsfunktionen für npm-/pnpm-/UI-Runner, die Paketmanagerkonfiguration und die CI-Workflow-Oberflächen beschränkt, die diesen Lauf ausführen; nicht zugehörige Änderungen an Quellcode, Plugins, Installations-Smoke-Tests und ausschließlich Tests betreffenden Dateien verbleiben in den Linux-Node-Läufen.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne übermäßig viele Runner zu reservieren:

- Plugin-Verträge und Kanalverträge werden jeweils als zwei gewichtete, Blacksmith-gestützte Shards mit dem standardmäßigen GitHub-Runner als Fallback ausgeführt.
- Die schnellen Core-Unit- und Support-Läufe werden separat ausgeführt; die Core-Runtime-Infrastruktur wird in Prozess-, Shared-, Hook-, Secret- und drei Cron-Domänen-Shards aufgeteilt.
- Auto-Reply wird mit ausbalancierten Workern ausgeführt, wobei der Reply-Unterbaum in Shards für Agent-Runner, Befehle, Dispatch, Sitzung und State-Routing aufgeteilt ist.
- Die Konfigurationen für agentisches Gateway/Server (Steuerungsebene) werden auf Chat-, Authentifizierungs-, Modell-, HTTP-/Plugin-, Runtime- und Startläufe verteilt, statt auf erstellte Artefakte zu warten.
- Die normale CI bündelt ausschließlich isolierte Infrastruktur-Shards mit Include-Mustern in deterministische Pakete mit höchstens 64 Testdateien. Dadurch wird die Node-Matrix verkleinert, ohne nicht isolierte Befehls-/Cron-, zustandsbehaftete Agents-Core- oder Gateway-/Server-Suiten zusammenzuführen. Umfangreiche feste Suiten verbleiben auf 8 vCPU, während die gebündelten und geringer gewichteten Läufe 4 vCPU verwenden.
- Pull Requests im kanonischen Repository verwenden einen kompakten Zulassungsplan: Dieselben Gruppen pro Konfiguration werden in isolierten Unterprozessen ausgeführt, derzeit 19 Node-Testjobs statt der vollständigen Matrix mit 74 Jobs. Ein einzelner Batch für eine vollständige Konfiguration wird auf vorhandene kompakte Jobs mit demselben Runner verteilt und behält dabei sein Zeitlimit von 120 Minuten; die Konfiguration für serielle Werkzeuge wird auf drei ausschließlich für PRs vorgesehene Gruppen verteilt. Pushes auf `main`, manuelle Ausführungen und Release-Prüfungen behalten die vollständige Matrix bei.
- Umfangreiche Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt der gemeinsamen Plugin-Sammelkonfiguration. Shards mit Include-Mustern zeichnen Zeiteinträge unter Verwendung des CI-Shard-Namens auf, sodass `.artifacts/vitest-shard-timings.json` zwischen einer vollständigen Konfiguration und einem gefilterten Shard unterscheiden kann.
- `check-additional-*` verteilt die Liste ergänzender Grenzprüfungen (`scripts/run-additional-boundary-checks.mjs`) auf einen Prompt-intensiven Shard (`check-additional-boundaries-a`, der die Driftprüfung für Codex-Prompt-Snapshots enthält) und einen kombinierten Shard für die übrigen Gruppen (`check-additional-boundaries-bcd`). Beide führen unabhängige Schutzprüfungen gleichzeitig aus und geben die Laufzeit jeder Prüfung aus. Kompilierungs-/Canary-Arbeiten für Paketgrenzen bleiben zusammen, und die Architektur der Runtime-Topologie wird getrennt von der in `build-artifacts` eingebetteten Gateway-Watch-Abdeckung ausgeführt.
- Gateway-Watch, Kanaltests und der Shard für Core-Support-Grenzen werden innerhalb von `build-artifacts` gleichzeitig ausgeführt, nachdem `dist/` und `dist-runtime/` bereits erstellt wurden.

Nach der Zulassung erlaubt die kanonische Linux-CI bis zu 28 gleichzeitige Node-Testjobs und
12 für die kleineren schnellen/Prüfläufe; Windows und Android bleiben bei zwei, weil
diese Runner-Pools begrenzter sind. Kompakte Batches für vollständige Konfigurationen verwenden ein
Batch-Zeitlimit von 120 Minuten, während Gruppen mit Include-Mustern dasselbe begrenzte
Job-Budget teilen.

Die Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und erstellt anschließend die Play-Debug-APK. Die Drittanbieter-Variante besitzt weder ein separates Quellset noch ein separates Manifest; ihr Unit-Test-Lauf kompiliert die Variante dennoch mit den BuildConfig-Flags für SMS und Anrufprotokolle, vermeidet dabei jedoch einen doppelten Verpackungsjob für die Debug-APK bei jedem Android-relevanten Push.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen ausschließlich auf Abhängigkeiten ausgerichteten Knip-Produktionslauf mit einer exakt festgelegten Knip-Version, bei dem das Mindestveröffentlichungsalter von pnpm für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus. Letzterer vergleicht Knips Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs`. Zusätzlich wird ein beratender Bericht von `pnpm deadcode:report:ci:ts-unused` als Artefakt `deadcode-reports` hochgeladen. Die Schutzprüfung für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue, nicht geprüfte ungenutzte Datei hinzufügt oder einen veralteten Eintrag in der Positivliste beibehält. Gleichzeitig bewahrt sie absichtlich dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Oberflächen, die Knip nicht statisch auflösen kann.

## Weiterleitung von ClawSweeper-Aktivitäten

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge für Aktivitäten im OpenClaw-Repository zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn auch nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow besitzt vier Läufe:

- `clawsweeper_item` für konkrete Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei Pushes auf `main`;
- `github_activity` für allgemeine GitHub-Aktivitäten, die der ClawSweeper-Agent untersuchen kann.

Der Lauf `github_activity` leitet ausschließlich normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Elementnummer, URL, Titel, Status und, sofern vorhanden, kurze Auszüge aus Kommentaren oder Reviews. Der vollständige Webhook-Text wird bewusst nicht weitergeleitet. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`; er sendet das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agenten.

Allgemeine Aktivitäten dienen der Beobachtung und werden standardmäßig nicht zugestellt. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, umsetzbar, riskant oder betrieblich nützlich ist. Routinemäßiges Öffnen und Bearbeiten, Bot-Aktivität, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Texte, Review-Texte, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie dienen als Eingabe für Zusammenfassungen und Triage, nicht als Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Ausführungen

Manuelle CI-Ausführungen verwenden denselben Job-Graphen wie die normale CI, aktivieren jedoch jeden nicht zu Android gehörenden, umfangsabhängigen Lauf: Linux-Node-Shards, Shards für gebündelte Plugins, Shards für Plugin- und Kanalverträge, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS, den iOS-Build und die Control-UI-i18n. Die Gebietsschema-Parität der Control UI ist bei automatischen PR- und `main`-Läufen lediglich beratend, weil der eigenständige Aktualisierungs-Workflow generierte Abweichungen im Hintergrund repariert; bei manueller CI und damit bei der vollständigen Release-Validierung ist sie blockierend. Eigenständige manuelle CI-Ausführungen führen Android nur mit `include_android=true` aus (die Eingabe `release_gate` erzwingt Android ebenfalls); der übergeordnete vollständige Release-Lauf aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der ausschließlich für Releases vorgesehene Shard `agentic-plugins`, der vollständige Batch-Durchlauf für Erweiterungen und die Plugin-Prerelease-Docker-Läufe sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite wird nur ausgeführt, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktivierter Release-Validierungsprüfung startet.

Manuelle Läufe verwenden eine eindeutige Parallelitätsgruppe, damit eine vollständige Suite für einen Release-Kandidaten nicht durch einen anderen Push- oder PR-Lauf auf derselben Referenz abgebrochen wird. Mit der optionalen Eingabe `target_ref` kann ein vertrauenswürdiger Aufrufer diesen Graphen für einen Branch, ein Tag oder einen vollständigen Commit-SHA ausführen und dabei die Workflow-Datei der ausgewählten Dispatch-Referenz verwenden. Die Eingabe `release_gate` ist ein Maintainer-Fallback für einen exakten SHA, wenn die PR-CI aufgrund fehlender Kapazität blockiert ist: `target_ref` muss ein vollständiger Commit-SHA sein, der mit dem Kopf des ausgeführten Branches übereinstimmt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Der monatliche, ausschließlich npm betreffende Extended-Stable-Pfad ist die Ausnahme: Starten Sie sowohl den Preflight `OpenClaw NPM
Release` als auch `Full Release Validation` vom exakten Branch
`extended-stable/YYYY.M.33`, bewahren Sie deren Lauf-IDs auf und übergeben Sie beide IDs an den
direkten npm-Veröffentlichungslauf. Unter [Monatliche, ausschließlich npm betreffende Extended-Stable-
Veröffentlichung](/de/reference/RELEASING#monthly-npm-only-extended-stable-publication) finden Sie
die Befehle, die exakten Identitätsanforderungen, die Rücklesung aus der Registry und das Verfahren zur
Reparatur des Selektors. Dieser Pfad führt keine Veröffentlichung für Plugins, macOS, Windows, GitHub
Release, private Dist-Tags oder andere Plattformen aus.

## Runner

| Runner                          | Jobs                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Manuelle CI-Ausführung und Fallbacks für nicht kanonische Repositorys, das QA-Smoke-Aggregat, CodeQL-Sicherheits- und Qualitätsscans, Workflow-Plausibilitätsprüfung, Labeler, automatische Antwort, der eigenständige Docs-Workflow und der gesamte Install-Smoke-Workflow                                                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` außer QA-Smoke-CI, Plugin-/Channel-Vertrags-Shards, die meisten gebündelten/weniger aufwendigen Linux-Node-Shards, `check-*`-Lanes außer `check-lint`, ausgewählte `check-additional-*`-Shards, `check-docs` und `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Beibehaltene aufwendige Linux-Node-Suites, grenzflächen-/erweiterungsintensive `check-additional-*`-Shards und `android`                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | Automatische QA-Smoke-CI-Shards, `build-artifacts` in CI und Testbox sowie `check-lint` (so CPU-empfindlich, dass 8 vCPU mehr kosteten, als sie einsparten)                                                                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                   |
| `blacksmith-6vcpu-macos-15`     | `macos-node` auf `openclaw/openclaw`; Forks verwenden als Fallback `macos-15`                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` und `ios-build` auf `openclaw/openclaw`; Forks verwenden als Fallback `macos-26`                                                                                                                                                                                                                |

## Budget für Runner-Registrierungen

OpenClaws aktuelles GitHub-Kontingent für Runner-Registrierungen weist in
`ghx api rate_limit` 10,000 Registrierungen selbst gehosteter Runner pro 5 Minuten aus. Prüfen Sie
`actions_runner_registration` vor jedem Abstimmungsdurchlauf erneut, da GitHub
dieses Kontingent ändern kann. Das Limit wird von allen Blacksmith-Runner-Registrierungen in der
Organisation `openclaw` gemeinsam genutzt; das Hinzufügen einer weiteren Blacksmith-Installation fügt daher
kein neues Kontingent hinzu.

Behandeln Sie Blacksmith-Labels als knappe Ressource für die Burst-Steuerung. Jobs, die
nur weiterleiten, benachrichtigen, zusammenfassen, Shards auswählen oder kurze CodeQL-Scans ausführen, sollten
auf von GitHub gehosteten Runnern verbleiben, sofern für sie kein gemessener Blacksmith-spezifischer
Bedarf besteht. Jede neue Blacksmith-Matrix, ein größeres `max-parallel` oder ein häufig ausgeführter
Workflow muss seine maximale Registrierungsanzahl im ungünstigsten Fall ausweisen und das organisationsweite
Ziel unter etwa 60% des aktuellen Kontingents halten. Beim derzeitigen Kontingent von 10,000 Registrierungen
entspricht dies einem Betriebsziel von 6,000 Registrierungen, wodurch Spielraum für
gleichzeitige Repositorys, Wiederholungsversuche und überlappende Bursts bleibt.

Die CI des kanonischen Repositorys behält Blacksmith als standardmäßigen Runner-Pfad für normale Push- und Pull-Request-Ausführungen bei. `workflow_dispatch` und Ausführungen in nicht kanonischen Repositorys verwenden von GitHub gehostete Runner, normale kanonische Ausführungen prüfen derzeit jedoch weder den Zustand der Blacksmith-Warteschlange noch greifen sie bei Nichtverfügbarkeit von Blacksmith automatisch auf von GitHub gehostete Labels zurück.

## Lokale Entsprechungen

```bash
pnpm changed:lanes                            # lokalen Klassifizierer für geänderte Lanes für origin/main...HEAD prüfen
pnpm check:changed                            # intelligentes lokales Prüftor: geänderte Formatierung/Typprüfung/Lint/Schutzprüfungen nach Grenzflächen-Lane
pnpm check                                    # schnelles lokales Tor: produktives tsgo + aufgeteiltes Linting + parallele schnelle Schutzprüfungen
pnpm check:test-types
pnpm check:timed                              # dasselbe Tor mit Zeitmessungen pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # Vitest-Tests
pnpm test:changed                             # kostengünstige intelligente Vitest-Ziele für Änderungen
pnpm test:ui                                  # Unit-/Browser-Suite der Control UI
pnpm ui:i18n:check                            # generierte Gebietsschema-Parität der Control UI (Release-Tor)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # Docs-Formatierung + Linting + fehlerhafte Links
pnpm build                                    # dist erstellen, wenn CI-Artefakt-/Smoke-Prüfungen relevant sind
pnpm ios:build                                # iOS-App-Projekt generieren und erstellen
pnpm ci:timings                               # neuesten Push-CI-Lauf von origin/main zusammenfassen
pnpm ci:timings:recent                        # kürzlich erfolgreiche main-CI-Läufe vergleichen
node scripts/ci-run-timings.mjs <run-id>      # Gesamtdauer, Warteschlangenzeit und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --latest-main # Issue-/Kommentarrauschen ignorieren und Push-CI von origin/main auswählen
node scripts/ci-run-timings.mjs --recent 10   # kürzlich erfolgreiche main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` ist der Workflow für die Produkt-/Runtime-Performance. Er wird täglich auf `main` ausgeführt und kann manuell gestartet werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Die manuelle Ausführung führt Benchmarks normalerweise für die Workflow-Ref aus. Legen Sie `target_ref` fest, um mit der aktuellen Workflow-Implementierung einen Release-Tag oder einen anderen Branch zu testen. Veröffentlichte Berichtspfade und Verweise auf die neuesten Ergebnisse werden anhand der getesteten Ref festgelegt, und jede `index.md` erfasst die getestete Ref/SHA, die Workflow-Ref/SHA, die Kova-Ref, das Profil, den Authentifizierungsmodus der Lane, das Modell, die Anzahl der Wiederholungen und die Szenariofilter.

Der Workflow installiert OCM aus einem angehefteten Release und Kova aus `openclaw/Kova` gemäß der angehefteten Eingabe `kova_ref` und führt anschließend drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien für eine lokal erstellte Laufzeit mit deterministischer, fingierter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, im Gateway und bei Agentendurchläufen. Wird nach Zeitplan oder bei manueller Ausführung mit `deep_profile=true` ausgeführt.
- `live-openai-candidate`: ein echter Agentendurchlauf mit OpenAI `openai/gpt-5.6-luna`, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist. Wird nach Zeitplan oder bei manueller Ausführung mit `live_openai_candidate=true` ausgeführt.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Quellcode-Probes aus: Gateway-Startzeit und Arbeitsspeicher für den standardmäßigen Start, den Start mit übersprungenem Kanal, den Start mit internem Hook und den Start mit fünfzig Plugins; den RSS beim Import gebündelter Plugins, wiederholte Begrüßungsschleifen des Mock-OpenAI-Tests `channel-chat-baseline`, CLI-Startbefehle gegen das gestartete Gateway und die Performance-Probe des SQLite-State-Smoke-Tests. Wenn für die getestete Ref der zuvor veröffentlichte Mock-Provider-Quellcodebericht verfügbar ist, vergleicht die Quellcodezusammenfassung die aktuellen RSS- und Heap-Werte mit dieser Baseline und kennzeichnet starke RSS-Anstiege als `watch`. Die Markdown-Zusammenfassung der Quellcode-Probes befindet sich im Berichtsbundle unter `source/index.md`; daneben liegt das Roh-JSON.

Jede Lane lädt ihr vollständiges GitHub-Artefakt hoch, einschließlich CPU-, Heap- und Trace-Daten sowie komprimierter Diagnose-Bundles. Ein separater Publisher-Job lädt diese Artefakte herunter und validiert sie. Anschließend erstellt er ein kurzlebiges ClawSweeper-GitHub-App-Token, das ausschließlich auf Inhalte von `openclaw/clawgrit-reports` beschränkt ist, und übergibt es nur an den Git-Push-Schritt. Er committet `report.json`, `report.md`, `index.md`, Artefakte der Quellcode-Probes sowie Bundle-Metadaten und -Prüfsummen unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; das vollständige Diagnosearchiv verbleibt im verknüpften Actions-Artefakt. Der Publisher lehnt jede Berichtsdatei mit mehr als 50 MB ab, bevor er einen Push versucht. Der aktuelle Zeiger für die getestete Ref ist `openclaw-performance/<tested-ref>/latest-<lane>.json`. Geplante Ausführungen und Dispatches mit `profile=release` schlagen fehl, wenn die Erstellung des App-Tokens oder die Veröffentlichung des Berichts fehlschlägt. Bei manuellen Nicht-Release-Dispatches bleibt die Veröffentlichung optional, und die GitHub-Artefakte werden beibehalten, wenn die Authentifizierung oder Veröffentlichung fehlschlägt. Die vorherige Quellcode-Baseline wird anonym aus dem öffentlichen Berichts-Repository abgerufen. Ein erfolgreicher Abruf der Baseline belegt daher keine Publisher-Authentifizierung.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle übergeordnete Workflow für „vor dem Release alles ausführen“. Er akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, startet den manuellen `CI`-Workflow mit diesem Ziel einschließlich Android, startet `Plugin Prerelease` für Release-spezifische Plugin-, Paket-, statische und Docker-Nachweise, startet `OpenClaw Performance` für den Ziel-SHA und startet `OpenClaw Release Checks` für Installations-Smoke-Tests, Paketabnahme, plattformübergreifende Paketprüfungen, QA-Lab-Parität sowie Matrix- und Telegram-Lanes. Die beratende Darstellung der Reifegrad-Scorecard kann optional über `run_maturity_scorecard` aktiviert werden. Stabile und vollständige Profile umfassen stets umfassende Live-/E2E-Tests und Soak-Testabdeckung des Docker-Release-Pfads; für das Beta-Profil kann dies mit `run_release_soak=true` aktiviert werden. Der kanonische Paket-Telegram-E2E-Test wird innerhalb der Paketabnahme ausgeführt, sodass ein vollständiger Kandidat keinen doppelten Live-Poller startet. Übergeben Sie nach der Veröffentlichung `release_package_spec`, um das ausgelieferte npm-Paket für Release-Prüfungen, Paketabnahme, Docker, plattformübergreifende Prüfungen und Telegram wiederzuverwenden, ohne es erneut zu bauen. Verwenden Sie `npm_telegram_package_spec` nur für eine gezielte erneute Telegram-Ausführung mit einem veröffentlichten Paket. Die Live-Paket-Lane des Codex-Plugins verwendet standardmäßig denselben ausgewählten Zustand: Bei veröffentlichtem `release_package_spec=openclaw@<tag>` wird `codex_plugin_spec=npm:@openclaw/codex@<tag>` abgeleitet, während SHA-/Artefakt-Ausführungen `extensions/codex` aus der ausgewählten Ref packen. Legen Sie `codex_plugin_spec` für benutzerdefinierte Plugin-Quellen wie `npm:`, `npm-pack:` oder `git:`-Spezifikationen explizit fest.

Die Phasenmatrix, die genauen Workflow-Jobnamen, Profilunterschiede, Artefakte und
Optionen für gezielte erneute Ausführungen finden Sie unter [Vollständige Release-Validierung](/de/reference/full-release-validation).

`OpenClaw Release Publish` ist der manuelle, Änderungen vornehmende Release-Workflow. Starten
Sie reguläre Beta- und Stable-Veröffentlichungen aus einem vertrauenswürdigen `main`, nachdem das Release-Tag
vorhanden ist und nachdem der OpenClaw-npm-Preflight erfolgreich war (der Preflight führt
unter anderem `pnpm plugins:sync:check` aus). Das Tag wählt weiterhin den exakten
Release-Commit aus, einschließlich eines Commits auf `release/YYYY.M.PATCH`; Tideclaw-Alpha-
Veröffentlichungen verwenden weiterhin ihren zugehörigen Alpha-Branch. Der Workflow erfordert die gespeicherte
`preflight_run_id` sowie eine erfolgreiche
`full_release_validation_run_id` und deren exakten
`full_release_validation_run_attempt`, startet `Plugin NPM Release` für alle
veröffentlichungsfähigen Plugin-Pakete, startet `Plugin ClawHub Release` für denselben
Release-SHA und startet erst danach `OpenClaw NPM Release`. Eine Stable-Veröffentlichung
erfordert außerdem einen exakten `windows_node_tag`; der Workflow verifiziert das Windows-Quell-
Release und vergleicht dessen x64-/ARM64-Installationsprogramme mit der vom Kandidaten genehmigten
Eingabe `windows_node_installer_digests`, bevor ein untergeordneter Veröffentlichungs-Workflow startet. Anschließend stuft er
dieselben fixierten Installationsprogramm-Digests sowie den exakten Vertrag für Begleitartefakt
und Prüfsumme hoch und verifiziert sie, bevor der GitHub-Release-Entwurf veröffentlicht wird.
Gezielte Reparaturen ausschließlich für Plugins verwenden `plugin_publish_scope=selected` mit einer nicht leeren
Paketliste. Ausschließlich Plugins betreffende `all-publishable`-Läufe erfordern dieselben unveränderlichen npm-
Preflight- und Full-Release-Validation-Nachweise wie eine Core-Veröffentlichung.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Verwenden Sie für den Nachweis eines fixierten Commits auf einem sich schnell ändernden Branch den Helper anstelle von
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Dispatch-Refs von GitHub-Workflows müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` an einem vertrauenswürdigen `main`-
Workflow-SHA, übergibt den angeforderten Ziel-SHA über die Workflow-Eingabe `ref`,
verwendet strikte Nachweise für das exakte Ziel erneut, sofern verfügbar, verifiziert, dass jeder
untergeordnete Workflow-`headSha` dem vertrauenswürdigen Workflow-SHA entspricht, und löscht den temporären
Branch nach Abschluss des Laufs. Übergeben Sie `-f reuse_evidence=false`, um eine neue
Validierung zu erzwingen. Der übergeordnete Verifizierer schlägt ebenfalls fehl, wenn ein untergeordneter Workflow mit einem
anderen Workflow-SHA ausgeführt wurde.

`release_profile` steuert den Umfang der Live-/Provider-Prüfungen, der an die Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die umfassende, beratende Provider-/Medienmatrix wünschen. Stable- und Full-
Release-Prüfungen führen immer den umfassenden Live-/E2E- und Docker-Release-Pfad-Dauertest aus;
das Beta-Profil kann ihn mit `run_release_soak=true` aktivieren.

- `minimum` behält die schnellsten für OpenAI/Core-Releases kritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die umfassende, beratende Provider-/Medienmatrix aus.

Der übergeordnete Workflow zeichnet die IDs der gestarteten untergeordneten Läufe auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Läufe erneut und fügt für jeden untergeordneten Lauf Tabellen der langsamsten Jobs an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und erfolgreich wird, führen Sie nur den übergeordneten Verifizierer-Job erneut aus, um das Gesamtergebnis und die Zeitübersicht zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` die Eingabe `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für den regulären untergeordneten vollständigen CI-Lauf, `plugin-prerelease` nur für den untergeordneten Plugin-Prerelease-Lauf, `performance` nur für den untergeordneten OpenClaw-Performance-Lauf, `release-checks` für jeden untergeordneten Release-Lauf oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im übergeordneten Workflow. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einer gezielten Korrektur begrenzt. Kombinieren Sie für eine einzelne fehlgeschlagene Betriebssystem-übergreifende Lane `rerun_group=cross-os` mit `cross_os_suite_filter`, beispielsweise `windows/packaged-upgrade`; lang laufende Betriebssystem-übergreifende Befehle geben Heartbeat-Zeilen aus, und Zusammenfassungen für Paket-Upgrades enthalten Zeitangaben pro Phase. QA-Lanes der Release-Prüfungen sind beratend, mit Ausnahme des standardmäßigen Gates für die Laufzeit-Tool-Abdeckung, das blockiert, wenn erforderliche dynamische OpenClaw-Tools in der Zusammenfassung der Standardstufe abweichen oder verschwinden.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmalig in ein Tarball `release-package-under-test` aufzulösen, und übergibt dieses Artefakt anschließend an die Betriebssystem-übergreifenden Prüfungen und Package Acceptance sowie, wenn die Dauertestabdeckung ausgeführt wird, an den Docker-Workflow für den Live-/E2E-Release-Pfad. Dadurch bleiben die Paketbytes über alle Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren untergeordneten Jobs erneut gepackt werden. Für die Live-Lane des Codex-npm-Plugins übergeben die Release-Prüfungen entweder eine passende veröffentlichte Plugin-Spezifikation, die aus `release_package_spec` abgeleitet wurde, die vom Operator bereitgestellte `codex_plugin_spec`, oder sie lassen die Eingabe leer, damit das Docker-Skript das Codex-Plugin des ausgewählten Checkouts packt.

Doppelte `Full Release Validation`-Läufe mit `ref=main` und `rerun_group=all`
ersetzen den älteren übergeordneten Lauf. Der übergeordnete Monitor bricht jeden bereits gestarteten
untergeordneten Workflow ab, wenn der übergeordnete Lauf abgebrochen wird, sodass eine neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Prüfungslauf warten muss. Validierungen von Release-Branches/-Tags
und gezielte Gruppen für erneute Ausführungen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Der untergeordnete Live-/E2E-Release-Workflow behält die umfassende native Abdeckung durch `pnpm test:live` bei, führt sie jedoch über `scripts/test-live-shard.mjs` als benannte Shards statt als einen seriellen Job aus:

- `native-live-src-agents` und `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- nach Provider gefilterte `native-live-src-gateway-profiles`-Jobs
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- aufgeteilte Medien-Audio-/Video-Shards und nach Provider gefilterte Musik-Shards

Dadurch bleibt dieselbe Dateiabdeckung erhalten, während Fehler langsamer Live-Provider einfacher erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Wiederholungsläufe gültig.

Die nativen Live-Medien-Shards werden in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ausgeführt, das vom Workflow `Live Media Runner Image` erstellt wird. Dieses Image enthält `ffmpeg` und `ffprobe` bereits vorinstalliert; Medien-Jobs verifizieren vor der Einrichtung lediglich die Binärdateien. Belassen Sie Docker-gestützte Live-Suiten auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>`. Der Live-Release-Workflow erstellt und pusht dieses Image einmal; anschließend werden die Shards für Docker-Live-Modelle, das nach Providern aufgeteilte Gateway, das CLI-Backend, ACP-Bind und den Codex-Harness mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausgeführt. Gateway-Docker-Shards verfügen über explizite `timeout`-Begrenzungen auf Skriptebene unterhalb des Workflow-Job-Timeouts, sodass ein hängender Container oder Bereinigungspfad schnell fehlschlägt, anstatt das gesamte Budget der Release-Prüfung zu verbrauchen. Wenn diese Shards das vollständige Quell-Docker-Target unabhängig neu erstellen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Package Acceptance

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Dies unterscheidet sich von der normalen CI: Die normale CI validiert den Quellbaum, während Package Acceptance ein einzelnes Tarball mit demselben Docker-E2E-Harness validiert, den Benutzer nach einer Installation oder Aktualisierung verwenden.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen einzelnen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `package_integrity` lädt das Artefakt `package-under-test` herunter und erzwingt mit `scripts/check-openclaw-package-tarball.mjs` den öffentlichen Paket-Tarball-Vertrag.
3. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit dem aufgelösten Paketquell-SHA (mit Rückgriff auf `workflow_ref`) und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert den Tarball-Inhalt, bereitet bei Bedarf Docker-Images mit Paket-Digest vor und führt die ausgewählten Docker-Lanes mit diesem Paket aus, anstatt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und verteilt diese Lanes anschließend auf parallele gezielte Docker-Jobs mit eindeutigen Artefakten.
4. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Der Job wird ausgeführt, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, sofern Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
5. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Integrität, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen sind. Die Eingabe `advisory` stuft Akzeptanzfehler für beratende Aufrufer zu Warnungen herab.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Extended-Stable-, Prerelease- oder Stable-Versionen.
- `source=ref` packt einen vertrauenswürdigen Branch, ein Tag oder einen vollständigen Commit-SHA aus `package_ref`. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit über den Branch-Verlauf des Repositorys oder ein Release-Tag erreichbar ist, installiert Abhängigkeiten in einem losgelösten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine öffentliche HTTPS-`.tgz`-Datei herunter; `package_sha256` ist erforderlich. Dieser Pfad lehnt URL-Anmeldedaten, nicht standardmäßige HTTPS-Ports, private/interne/für besondere Zwecke reservierte Hostnamen oder aufgelöste IPs sowie Weiterleitungen außerhalb derselben öffentlichen Sicherheitsrichtlinie ab.
- `source=trusted-url` lädt eine HTTPS-`.tgz`-Datei aus einer benannten Richtlinie für vertrauenswürdige Quellen in `.github/package-trusted-sources.json` herunter; `package_sha256` und `trusted_source_id` sind erforderlich. Verwenden Sie dies nur für von Maintainern betriebene Enterprise-Spiegelserver oder private Paket-Repositorys, die konfigurierte Hosts, Ports, Pfadpräfixe, Weiterleitungs-Hosts oder eine Auflösung im privaten Netzwerk benötigen. Wenn die Richtlinie Bearer-Authentifizierung deklariert, verwendet der Workflow das festgelegte Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in URLs eingebettete Anmeldedaten werden weiterhin abgelehnt.
- `source=artifact` lädt eine `.tgz`-Datei aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern freigegebene Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` gilt. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — der `package`-Satz mit Live-`plugins`-Abdeckung anstelle von `plugins-offline`, plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom` gilt

Das Profil `package` verwendet eine Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Der optionale Telegram-Testlauf verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` erneut; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Ausführungen erhalten.

Die speziellen Richtlinien für Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Testläufe, Eingaben für Package Acceptance, Release-Standardeinstellungen und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` und `telegram_mode=mock-openai` auf. Dadurch werden Nachweise für Paketmigration, Update, Live-Installation von ClawHub-Skills, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur der Installation konfigurierter Plugins, Offline-Plugins, Plugin-Updates und Telegram mit demselben aufgelösten Paket-Tarball durchgeführt. Legen Sie nach der Veröffentlichung einer Beta `release_package_spec` für Full Release Validation oder OpenClaw Release Checks fest, um dieselbe Matrix ohne erneuten Build gegen das ausgelieferte npm-Paket auszuführen; legen Sie `package_acceptance_package_spec` nur fest, wenn Package Acceptance ein anderes Paket als die übrige Release-Validierung benötigt. Betriebssystemübergreifende Release-Prüfungen decken weiterhin betriebssystemspezifisches Onboarding sowie Installationsprogramm- und Plattformverhalten ab; die Produktvalidierung für Pakete und Updates sollte mit Package Acceptance beginnen.

Der Docker-Testlauf `published-upgrade-survivor` validiert im blockierenden Release-Pfad pro Ausführung eine veröffentlichte Paketbasis. In Package Acceptance ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Ausgangsbasis aus, wobei standardmäßig `openclaw@latest` verwendet wird; Befehle zur erneuten Ausführung fehlgeschlagener Testläufe behalten diese Ausgangsbasis bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` legt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues` fest, um die Abdeckung auf die vier neuesten stabilen npm-Releases sowie festgelegte Grenzreleases für die Plugin-Kompatibilität und an Problemen orientierte Fixtures für die Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Protokollpfade und veraltete Wurzelverzeichnisse von Legacy-Plugin-Abhängigkeiten zu erweitern. Veröffentlichte Upgrade-Survivor-Auswahlen mit mehreren Ausgangsbasen werden nach Ausgangsbasis auf separate, gezielte Docker-Runner-Jobs verteilt. Der separate Workflow `Update Migration` verwendet den Docker-Testlauf `update-migration` mit `all-since-2026.4.23`-Ausgangsbasen und `plugin-deps-cleanup`-Szenarien, wenn eine umfassende Bereinigung veröffentlichter Updates gefragt ist und nicht die normale Breite der Full Release CI. Lokale aggregierte Ausführungen können mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` exakte Paketspezifikationen übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie etwa `openclaw@2026.4.15` einen einzelnen Testlauf beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix festlegen. Der veröffentlichte Testlauf konfiguriert die Ausgangsbasis mit einer integrierten Befehlsfolge für `openclaw config set`, zeichnet die Schritte der Befehlsfolge in `summary.json` auf und prüft nach dem Start des Gateways `/healthz`, `/readyz` sowie den RPC-Status. Die Windows-Testläufe für Neuinstallationen mit Paket und Installationsprogramm prüfen außerdem, ob ein installiertes Paket eine Überschreibung der Browsersteuerung aus einem unverarbeiteten absoluten Windows-Pfad importieren kann. Der betriebssystemübergreifende OpenAI-Smoke-Test für Agenteninteraktionen verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, sofern gesetzt, andernfalls `openai/gpt-5.6-luna`, sodass der Installations- und Gateway-Nachweis die kostengünstigere GPT-5.6-Teststufe verwendet.

### Zeitfenster für Legacy-Kompatibilität

Package Acceptance verfügt über begrenzte Zeitfenster für die Legacy-Kompatibilität bereits veröffentlichter Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball fehlen;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus der vom Tarball abgeleiteten fingierten Git-Fixture entfernen und ein fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smoke-Tests dürfen Legacy-Speicherorte für Installationsdatensätze lesen oder eine fehlende Persistenz des Marketplace-Installationsdatensatzes akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, muss jedoch weiterhin sicherstellen, dass der Installationsdatensatz und das Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor bereits ausgelieferten lokalen Stempeldateien mit Build-Metadaten warnen, und Pakete bis einschließlich `2026.5.20` dürfen bei einer fehlenden `npm-shrinkwrap.json` warnen, statt fehlzuschlagen. Spätere Pakete müssen die modernen Verträge erfüllen; unter denselben Bedingungen tritt dann ein Fehler auf, statt dass lediglich gewarnt oder übersprungen wird.

### Beispiele

```bash
# Validieren Sie das aktuelle Beta-Paket mit Abdeckung auf Produktebene.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Validieren Sie das veröffentlichte Extended-Stable-Paket mit Paketabdeckung.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Packen und validieren Sie einen Release-Branch mit dem aktuellen Testrahmen.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validieren Sie eine Tarball-URL. SHA-256 ist für source=url obligatorisch.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validieren Sie einen Tarball aus einer benannten, vertrauenswürdigen Richtlinie für private Spiegelserver.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Verwenden Sie einen Tarball erneut, der von einer anderen Actions-Ausführung hochgeladen wurde.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Beginnen Sie bei der Fehlersuche für eine fehlgeschlagene Package-Acceptance-Ausführung mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend die untergeordnete Ausführung `docker_acceptance` und ihre Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Testlaufprotokolle, Phasenzeitmessungen und Befehle zur erneuten Ausführung. Führen Sie vorzugsweise das fehlgeschlagene Paketprofil oder die exakten Docker-Testläufe erneut aus, anstatt die vollständige Release-Validierung zu wiederholen.

## Installations-Smoke-Test

Der Workflow `Install Smoke` wird nicht mehr bei Pull Requests oder Pushes auf `main` ausgeführt. Sowohl sein nächtlicher/manueller Wrapper als auch die Release-Validierung rufen den schreibgeschützten Kern `install-smoke-reusable.yml` auf, und jede Ausführung durchläuft auf von GitHub gehosteten Runnern den vollständigen Installations-Smoke-Test-Pfad:

- Das Smoke-Test-Image des Stamm-Dockerfiles wird einmal pro Ziel-SHA erstellt, in einem unveränderlichen Artefakt an die Workflow-Revision und den Erstellungsversuch gebunden und anschließend vom CLI-Smoke-Test, dem CLI-Smoke-Test zum Löschen gemeinsam genutzter Arbeitsbereiche durch Agenten, dem E2E-Test für das Gateway-Netzwerk im Container und dem Build-Argument-Smoke-Test des gebündelten `matrix`-Plugins geladen. Der Plugin-Smoke-Test prüft die Spiegelung der Installation von Laufzeitabhängigkeiten und dass das Plugin ohne Diagnosen zu einem Verlassen des Einstiegspfads geladen wird.
- Die QR-Paketinstallation und die Docker-Smoke-Tests für Installationsprogramm und Update (einschließlich Rocky-Linux-Testläufen für das Installationsprogramm und eines Update-Testlaufs gegen eine konfigurierbare npm-Ausgangsversion `update_baseline_version`) werden als separate Jobs ausgeführt, damit Arbeiten am Installationsprogramm nicht hinter den Smoke-Tests des Stamm-Images warten müssen.

Der langsame Image-Provider-Smoke-Test für die globale Bun-Installation wird separat durch `run_bun_global_install_smoke` gesteuert. Er wird nach dem nächtlichen Zeitplan ausgeführt, ist bei Workflow-Aufrufen aus Release-Prüfungen standardmäßig aktiviert und kann bei manuellen Ausführungen von `Install Smoke` optional eingeschaltet werden. Die normale PR-CI führt bei Node-relevanten Änderungen weiterhin den schnellen Regressionstestlauf für den Bun-Launcher aus. Die QR- und Installationsprogramm-Docker-Tests behalten ihre eigenen installationsorientierten Dockerfiles.

## Lokaler Docker-E2E-Test

`pnpm test:docker:all` erstellt vorab ein gemeinsames Live-Test-Image, packt OpenClaw einmal als npm-Tarball und erstellt zwei gemeinsame Images aus `scripts/e2e/Dockerfile`:

- einen einfachen Node-/Git-Runner für Testläufe zu Installationsprogramm, Update und Plugin-Abhängigkeiten;
- ein funktionsfähiges Image, das denselben Tarball für normale Funktionstestläufe unter `/app` installiert.

Die Definitionen der Docker-Testläufe befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planungslogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Testlauf mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt die Testläufe anschließend mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standardwert | Zweck                                                                                                 |
| -------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10           | Anzahl der Slots im Haupt-Pool für normale Testläufe.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10           | Anzahl der Slots im Provider-abhängigen nachgelagerten Pool.                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9            | Obergrenze für gleichzeitig ausgeführte Live-Testläufe, damit Provider keine Drosselung vornehmen.    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5            | Obergrenze für gleichzeitige npm-Installationstestläufe.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7            | Obergrenze für gleichzeitige Testläufe mit mehreren Diensten.                                         |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000         | Verzögerung zwischen Testlaufstarts zur Vermeidung von Erstellungsstürmen im Docker-Daemon; `0` deaktiviert die Verzögerung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000      | Ersatz-Zeitüberschreitung pro Testlauf (120 Minuten); ausgewählte Live-/nachgelagerte Testläufe verwenden strengere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nicht gesetzt | `1` gibt den Scheduler-Plan aus, ohne Testläufe auszuführen.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | nicht gesetzt | Kommagetrennte Liste exakter Testläufe; überspringt den Bereinigungs-Smoke-Test, damit Agenten einen fehlgeschlagenen Testlauf reproduzieren können. |

Ein Testlauf, dessen Gewicht seine effektive Obergrenze überschreitet, kann dennoch aus einem leeren Pool starten und wird dann allein ausgeführt, bis er Kapazität freigibt. Die lokale aggregierte Ausführung prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Testläufe aus, speichert Testlaufzeiten für eine Sortierung nach längster Laufzeit zuerst und plant nach dem ersten Fehler standardmäßig keine neuen gepoolten Testläufe mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json` ab, welches Paket, welche Image-Art, welches Live-Image, welche Lane und welche Anmeldedatenabdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Das Skript packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter und validiert anschließend den Inhalt des Tarballs. Der standardmäßige Pfad `no-push-artifact` erstellt über den Docker-Layer-Cache von Blacksmith mit dem Paket-Digest markierte Bare-/Functional-Images, packt die exakten Image-Bytes in ein unveränderliches Workflow-Artefakt und lässt jeden Verbraucher dieses Artefakt verifizieren und laden. `existing-only` erfordert stattdessen explizite GHCR-Referenzen für `docker_e2e_bare_image`/`docker_e2e_functional_image` und erstellt oder überträgt niemals Images. Diese Registry-Abrufe verwenden pro Versuch ein begrenztes Zeitlimit von 180 Sekunden, damit ein hängender Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu belegen. Nach erfolgreicher geplanter Validierung übergibt `openclaw-scheduled-live-checks.yml` das unveränderliche Manifest der getesteten Images an den separaten Publisher mit Paketschreibzugriff; schreibgeschützte Release- und Prerelease-Aufrufer durchlaufen diesen Writer niemals.

### Abschnitte des Release-Pfads

Die Docker-Abdeckung für Releases führt kleinere, aufgeteilte Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus, sodass jeder Abschnitt nur die durch Artefakte bereitgestellte Image-Art verifiziert und lädt, die er benötigt (oder sie bei expliziter Wiederverwendung mit `existing-only` abruft), und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Die aktuellen Docker-Abschnitte für Releases sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h` und `openwebui`. `package-update-openai` enthält die Live-Lane für das Codex-Plugin-Paket. Diese installiert das OpenClaw-Kandidatenpaket, installiert das Codex-Plugin aus `codex_plugin_spec` oder einem Tarball derselben Referenz mit expliziter Genehmigung zur Installation der Codex CLI, führt die Vorabprüfung der Codex CLI aus und führt anschließend mehrere OpenClaw-Agent-Durchläufe in derselben Sitzung gegen OpenAI aus. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Aliasse für Plugins/Laufzeit. Der Lane-Alias `install-e2e` bleibt der aggregierte Alias für manuelle Wiederholungen beider Provider-Installer-Lanes.

OpenWebUI wird als eigenständiger Abschnitt `openwebui` auf einem dedizierten Blacksmith-Runner mit großem Speicherplatz ausgeführt, sobald stabile oder vollständige Release-Pfad-Abdeckung ihn anfordert, selbst wenn der wiederverwendbare Workflow unterstützte Jobs an von GitHub gehostete Runner weiterleitet. Durch die Trennung des externen Image-Abrufs konkurriert das große Image in `plugins-runtime-services` nicht mit den gemeinsam verwendeten Paket- und Plugin-Images; ältere aggregierte Plugin-/Laufzeitabschnitte enthalten OpenWebUI weiterhin für kompatible manuelle Wiederholungen. Aktualisierungs-Lanes für gebündelte Kanäle wiederholen vorübergehende npm-Netzwerkfehler einmal.

Jeder Abschnitt lädt `.artifacts/docker-tests/` mit Lane-Protokollen, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeitmessungen, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen Images aus, die für diesen Lauf vorbereitet wurden, statt die Abschnittsjobs zu verwenden. Dadurch bleibt die Fehlersuche für fehlgeschlagene Lanes auf einen gezielten Docker-Job begrenzt. Wenn eine ausgewählte Lane eine Live-Docker-Lane ist, erstellt der gezielte Job das Live-Test-Image für diese Wiederholung lokal. Die Wiederholungshilfe validiert den exakten ausgewählten Ziel-SHA des Fehlerartefakts, und die manuelle Ausführung packt diese Referenz erneut, da das interne Pakettupel des wiederverwendbaren Workflows nicht Teil des Schemas von `workflow_dispatch` ist. Generierte Befehle enthalten vorbereitete Image-Eingaben und `shared_image_policy=existing-only` nur dann, wenn diese Eingaben durch GHCR bereitgestellt werden. Runner-lokale Artefakt-Tags werden ausgelassen, sodass ein neuer Runner sie erneut erstellt. Eine explizite Zielüberschreibung verwirft wiederhergestellte GHCR-Image-Referenzen, sofern das Artefakt nicht nachweist, dass sie mit der Überschreibung übereinstimmen. Durch Artefakte generierte Referenzen auf Workflow-Definitionen werden ebenfalls ausgelassen, da temporäre Full-Release-Branches gelöscht werden. Die Ausführung verwendet den Standard-Branch des Repositorys, sofern der Operator ihn nicht explizit überschreibt.

```bash
pnpm test:docker:rerun <run-id>      # Docker-Artefakte herunterladen und kombinierte sowie gezielte Wiederholungsbefehle pro Lane ausgeben
pnpm test:docker:timings <summary>   # Zusammenfassungen langsamer Lanes und der kritischen Pfade von Phasen
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus und ruft nach erfolgreichem Abschluss den expliziten Publisher für die exakt getesteten Image-Artefakte auf.

## Plugin-Prerelease

`Plugin Prerelease` bietet aufwendigere Produkt-/Paketabdeckung und ist daher ein separater Workflow, der durch `Full Release Validation` oder einen expliziten Operator ausgelöst wird. Bei normalen Pull Requests, Übertragungen auf `main` und eigenständigen manuellen CI-Ausführungen bleibt diese Suite deaktiviert. Sie verteilt Tests gebündelter Plugins auf acht Erweiterungs-Worker. Diese Jobs für Erweiterungs-Shards führen gleichzeitig bis zu zwei Plugin-Konfigurationsgruppen mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importintensive Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der ausschließlich für Releases vorgesehene Docker-Prerelease-Pfad, der durch die Eingabe `full_release_validation` aktiviert wird, gruppiert gezielte Docker-Lanes in Vierergruppen, um nicht Dutzende Runner für Jobs mit einer Laufzeit von ein bis drei Minuten zu reservieren. Der Workflow lädt außerdem ein informatives Artefakt `plugin-inspector-advisory` von `@openclaw/plugin-inspector` hoch. Inspector-Ergebnisse dienen als Eingabe für die Triage und ändern nicht das blockierende Plugin-Prerelease-Gate.

## QA Lab

QA Lab verfügt über eigene CI-Lanes außerhalb des zentralen intelligent eingegrenzten Workflows. Die agentische Parität ist in die umfassenden QA- und Release-Testsysteme eingebettet und kein eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn die Parität zusammen mit einem umfassenden Validierungslauf ausgeführt werden soll.

- Der Workflow `QA-Lab - All Lanes` wird jede Nacht auf `main` sowie bei manueller Ausführung gestartet. Er verteilt die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Lanes für Telegram und Discord auf parallele Jobs. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Live-Transport-Lanes für Matrix und Telegram mit dem deterministischen Mock-Provider und als Mock gekennzeichneten Modellen (`mock-openai/gpt-5.6-luna` und `mock-openai/gpt-5.6-luna-alt`) aus, sodass der Kanalvertrag von der Latenz echter Modelle und vom normalen Start der Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, da die QA-Parität das Speicherverhalten separat abdeckt. Die Provider-Konnektivität wird durch die separaten Suiten für Live-Modelle, native Provider und Docker-Provider abgedeckt.

Matrix verwendet `--profile fast` für geplante Prüfungen und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`. Eine manuelle Ausführung mit `matrix_profile=all` teilt die vollständige Matrix-Abdeckung stets in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli` auf.

`OpenClaw Release Checks` führt vor der Release-Genehmigung außerdem die releasekritischen QA-Lab-Lanes aus. Das QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob herunter, der den abschließenden Paritätsvergleich durchführt.

Folgen Sie bei normalen PRs den eingegrenzten CI-/Prüfnachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der Workflow `CodeQL` ist bewusst als eng begrenzter Sicherheitsscanner für den ersten Durchlauf ausgelegt und nicht als vollständige Prüfung des Repositorys. Tägliche und manuelle Läufe sowie Schutzläufe bei Übertragungen auf `main` und bei Pull Requests, die keine Entwürfe sind, prüfen Actions-Workflow-Code sowie die risikoreichsten JavaScript-/TypeScript-Oberflächen mit hochzuverlässigen Sicherheitsabfragen, die auf eine hohe/kritische `security-severity` gefiltert sind.

Der Schutzlauf für Pull Requests bleibt schlank: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` oder in prozessverwaltenden Laufzeitpfaden gebündelter Plugins und führt dieselbe hochzuverlässige Sicherheitsmatrix wie der geplante Workflow aus. Android- und macOS-CodeQL sind nicht Teil der PR-Standardprüfungen.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Baseline für Authentifizierung, Geheimnisse, Sandbox, Cron und Gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge der Kernkanäle sowie Kanallaufzeit des Plugins, Gateway, Plugin SDK, Geheimnisse und Audit-Berührungspunkte                    |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF-Kernlogik, IP-Parsing, Netzwerkschutz, Webabruf und SSRF-Richtlinienoberflächen des Plugin SDK                                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfen zur Prozessausführung, ausgehende Zustellung und Gates für die Ausführung von Agent-Tools                                            |
| `/codeql-security-high/process-exec-boundary`     | Lokale Shell, Hilfen zum Starten von Prozessen, unterprozessverwaltende Laufzeiten gebündelter Plugins und Verbindungscode für Workflow-Skripte         |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensoberflächen für Plugin-Installation, Loader, Manifest, Registry, Paketmanagerinstallation, Laden von Quellen und Paketvertrag des Plugin SDK |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Erstellt die Android-App für CodeQL manuell auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Plausibilitätsprüfung akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Erstellt die macOS-App für CodeQL manuell auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardprüfungen, da der macOS-Build selbst bei fehlerfreien Läufen die Laufzeit dominiert.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der entsprechende Shard für nicht sicherheitsbezogene Prüfungen. Er führt auf eng begrenzten, hochwertigen Oberflächen ausschließlich JavaScript-/TypeScript-Qualitätsabfragen mit Fehlerschweregrad und ohne Sicherheitsbezug auf von GitHub gehosteten Linux-Runnern aus, damit Qualitätsprüfungen kein Budget für die Registrierung von Blacksmith-Runnern verbrauchen. Sein Schutzlauf für Pull Requests ist bewusst kleiner als das geplante Profil: PRs, die keine Entwürfe sind, führen nur die passenden Shards für die von ihnen berührten Oberflächen aus. Dafür stehen dreizehn für PRs routbare Shards zur Verfügung: `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` und `session-diagnostics-boundary`. `ui-control-plane` und `web-media-runtime-boundary` bleiben von PR-Läufen ausgeschlossen. Änderungen an der CodeQL-Konfiguration und am Qualitätsworkflow führen den vollständigen PR-Shard-Satz aus. Der Netzwerklaufzeit-Shard wird durch seine eigenen CodeQL-Konfigurationsdateien und netzwerkverwaltenden Quellpfade aktiviert.

Die manuelle Ausführung akzeptiert:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die eng begrenzten Profile dienen als Lern- und Iterationshilfen, um einen einzelnen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Code für die Sicherheitsgrenzen von Authentifizierung, Geheimnissen, Sandbox, Cron und Gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Verträge für Konfigurationsschema, Migration, Normalisierung und E/A                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Verträge für Servermethoden                                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für zentrale Kanäle und gebündelte Kanal-Plugins                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Laufzeitverträge für Befehlsausführung, Modell-/Provider-Weiterleitung, Weiterleitung und Warteschlangen für automatische Antworten sowie die ACP-Steuerungsebene                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen zur Prozessüberwachung und Verträge für ausgehende Zustellungen                                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Speicher-Host-SDK, Speicher-Laufzeitfassaden, Speicher-Plugin-SDK-Aliasse, Verknüpfung zur Aktivierung der Speicherlaufzeit und Doctor-Befehle für den Speicher                      |
| `/codeql-critical-quality/network-runtime-boundary`     | Netzwerk-Richtlinienpaket, Laufzeit für Raw-Sockets und Proxy-Erfassung, SSH-Tunnel, Gateway-Sperre, JSONL-Socket und Oberflächen für Push-Transporte                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfsfunktionen für Bindung und Zustellung ausgehender Sitzungen, Oberflächen für Diagnoseereignis-/Protokollpakete und CLI-Verträge des Sitzungs-Doctors |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehende Antwortweiterleitung des Plugin SDK, Hilfsfunktionen für Antwortnutzlasten, Segmentierung und Laufzeit, Kanalantwortoptionen, Zustellungswarteschlangen sowie Hilfsfunktionen für Sitzungs-/Thread-Bindungen |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Authentifizierung und -Erkennung, Registrierung der Provider-Laufzeit, Provider-Standardwerte/-Kataloge sowie Registries für Web, Suche, Abruf und Einbettungen |
| `/codeql-critical-quality/ui-control-plane`             | Initialisierung der Steuerungsoberfläche, lokale Persistenz, Gateway-Steuerungsabläufe und Laufzeitverträge der Aufgabensteuerungsebene                                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Zentrale Web-Abruf-/Suchfunktionen, Medien-E/A, Medienverständnis, Bilderzeugung und Laufzeitverträge für die Medienerzeugung                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Plugin-SDK-Einstiegspunkte                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketinterner Plugin-SDK-Quellcode und Hilfsfunktionen für Plugin-Paketverträge                                                                                    |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verschleiern. Die CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte erst wieder als klar abgegrenzte oder auf Shards verteilte Folgearbeit hinzugefügt werden, nachdem die schmalen Profile eine stabile Laufzeit und ein stabiles Signal aufweisen.

## Wartungsabläufe

### Dokumentations-Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, die vorhandene Dokumentation mit kürzlich übernommenen Änderungen in Einklang hält. Er verfügt über keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf für einen nicht von einem Bot stammenden Push auf `main` kann ihn auslösen, und durch eine manuelle Ausführung kann er direkt gestartet werden. Durch Workflow-Läufe ausgelöste Ausführungen werden übersprungen, wenn sich `main` inzwischen weiterentwickelt hat oder wenn innerhalb der letzten Stunde ein weiterer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Bei der Ausführung überprüft er den Commit-Bereich vom Quell-SHA des vorherigen nicht übersprungenen Docs-Agent-Laufs bis zum aktuellen Stand von `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Änderungen am Hauptzweig abdecken kann.

### Testleistungs-Agent

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher, nicht von einem Bot ausgelöster Push-CI-Lauf auf `main` kann ihn auslösen, er wird jedoch übersprungen, wenn an diesem UTC-Tag bereits ein anderer durch einen Workflow-Lauf ausgelöster Aufruf ausgeführt wurde oder noch läuft. Eine manuelle Auslösung umgeht diese tägliche Aktivitätssperre. Die Spur erstellt einen gruppierten Vitest-Performancebericht für die vollständige Testsuite, lässt Codex ausschließlich kleine, die Testabdeckung erhaltende Performancekorrekturen an Tests statt umfassender Refaktorierungen vornehmen, führt anschließend den Bericht für die vollständige Testsuite erneut aus und verwirft Änderungen, die die Ausgangsanzahl bestandener Tests reduzieren. Der gruppierte Bericht erfasst für jede Konfiguration die verstrichene Gesamtzeit und den maximalen RSS-Speicherverbrauch unter Linux und macOS, sodass der Vorher-Nachher-Vergleich Änderungen des Testspeicherverbrauchs neben Änderungen der Dauer sichtbar macht. Wenn in der Ausgangsbasis Tests fehlschlagen, darf Codex nur offensichtliche Fehler beheben, und der nach dem Agentenlauf erstellte Bericht für die vollständige Testsuite muss erfolgreich sein, bevor etwas committet wird. Wenn `main` fortgeschritten ist, bevor der Bot-Push übernommen wird, führt die Spur einen Rebase des validierten Patches durch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; veraltete Patches mit Konflikten werden übersprungen. Sie verwendet von GitHub gehostetes Ubuntu, damit die Codex-Aktion dieselbe Sicherheitsstrategie zum Entzug von sudo-Rechten wie der Dokumentations-Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow zur Bereinigung doppelter PRs nach der Übernahme. Standardmäßig führt er einen Probelauf durch und schließt nur ausdrücklich aufgeführte PRs, wenn `apply=true` gilt. Bevor er Änderungen auf GitHub vornimmt, überprüft er, ob der übernommene PR gemergt wurde und ob jeder doppelte PR entweder auf dasselbe referenzierte Issue verweist oder überlappende geänderte Codeabschnitte enthält.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Prüf-Gates und Routing für Änderungen

Die lokale Logik für Spuren mit Änderungen befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Prüf-Gate wendet strengere Architekturgrenzen an als der umfassende Plattformumfang der CI:

- Änderungen am Core-Produktionscode führen die Typprüfung für Core-Produktion und Core-Tests sowie Core-Linting/-Schutzprüfungen aus;
- reine Änderungen an Core-Tests führen nur die Typprüfung für Core-Tests sowie Core-Linting aus;
- Änderungen am Produktionscode von Erweiterungen führen die Typprüfung für Erweiterungsproduktion und Erweiterungstests sowie Erweiterungs-Linting aus;
- reine Änderungen an Erweiterungstests führen die Typprüfung für Erweiterungstests sowie Erweiterungs-Linting aus;
- Änderungen am öffentlichen Plugin-SDK oder an Plugin-Verträgen erweitern den Umfang auf die Typprüfung der Erweiterungen, da Erweiterungen von diesen Core-Verträgen abhängen (Vitest-Durchläufe für Erweiterungen bleiben explizite Testarbeit);
- reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen von Version, Konfiguration und Root-Abhängigkeiten aus;
- unbekannte Root-/Konfigurationsänderungen werden sicherheitshalber über alle Prüfpfade ausgeführt.

Das lokale Routing geänderter Tests befindet sich in `scripts/test-projects.test-support.mjs` und ist bewusst kostengünstiger als `check:changed`: Direkte Teständerungen führen die betreffenden Tests selbst aus; bei Quellcodeänderungen werden zunächst explizite Zuordnungen, anschließend benachbarte Tests und vom Importgraphen abhängige Tests bevorzugt. Die gemeinsame Zustellungskonfiguration für Gruppenräume ist eine der expliziten Zuordnungen: Änderungen an der Konfiguration für in Gruppen sichtbare Antworten, am Zustellungsmodus für Quellantworten oder am System-Prompt des Nachrichten-Tools werden durch die Core-Antworttests sowie die Zustellungsregressionstests für Discord und Slack geleitet, damit eine Änderung am gemeinsamen Standard bereits vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so umfassend für das Testsystem ist, dass der kostengünstige zugeordnete Satz kein verlässlicher Stellvertreter ist.

## Testbox-Validierung

Crabbox ist der Repository-eigene Wrapper für Remote-Boxen zum Nachweis unter Linux durch Maintainer. Agent-Sitzungen verwenden ihn standardmäßig für Tests und rechenintensive Arbeiten, einschließlich Builds, Typprüfungen, aufgefächertem Linting, Docker, Paketpfaden, E2E, Live-Nachweisen und CI-Parität. Für vertrauenswürdigen Maintainer-Code wird standardmäßig `blacksmith-testbox` verwendet, und `.crabbox.yaml` verwendet ihn nun ebenfalls standardmäßig. Der konfigurierte Workflow stellt Provider- und Agent-Anmeldedaten bereit, weshalb nicht vertrauenswürdiger Code von Mitwirkenden oder Forks stattdessen geheimnisfreie Fork-CI oder bereinigtes direktes AWS-Crabbox verwenden muss. Bereinigte AWS-Ausführungen setzen `CRABBOX_ENV_ALLOW=CI`, übergeben `--no-hydrate` und verwenden ein neues temporäres Remote-`HOME`; dadurch wird verhindert, dass die `OPENCLAW_*`-Positivliste des Repositorys und vorhandene Authentifizierungsprofile nicht vertrauenswürdigen Code erreichen. Sie verwenden eine neu aufgewärmte Lease, die ausschließlich für diese nicht vertrauenswürdige Quelle bestimmt ist, niemals eine vertrauenswürdige oder zuvor mit Anmeldedaten versehene Lease. Starten Sie ein installiertes vertrauenswürdiges Crabbox-Binärprogramm aus einem sauberen vertrauenswürdigen `main`-Checkout und rufen Sie mit `--fresh-pr` ausschließlich den Remote-PR ab; führen Sie den Wrapper oder die Konfiguration des nicht vertrauenswürdigen Checkouts niemals lokal aus. Heben Sie die Einstellung von `CRABBOX_AWS_INSTANCE_PROFILE` auf und brechen Sie sicher ab, sofern das aufgelöste `aws.instanceProfile` nicht leer ist. Verwenden Sie vor jeder Installation/jedem Test vertrauenswürdige Werkzeuge mit absoluten Pfaden, um ein IMDSv2-Token vorauszusetzen, nachzuweisen, dass der IAM-Anmeldedaten-Endpunkt 404 zurückgibt, und das Remote-Ergebnis von `git rev-parse HEAD` mit dem vollständigen geprüften Head-SHA des PRs zu vergleichen. Binden Sie die Lease an diesen SHA und stoppen/wärmen Sie sie bei einer Änderung des Heads erneut auf. Laden Sie das vertrauenswürdige `scripts/crabbox-untrusted-bootstrap.sh` aus einem sauberen `main` zusammen mit `--fresh-pr` hoch; es installiert die festgelegten Node-/pnpm-Versionen, überprüft den SHA und die Festlegung des Paketmanagers, isoliert `HOME`, installiert Abhängigkeiten und führt anschließend den angeforderten Test aus.
Heben Sie alle `CRABBOX_TAILSCALE*`-Überschreibungen auf, erzwingen Sie `--network public
--tailscale=false`, entfernen Sie Exit-Node-/LAN-Flags und verlangen Sie vor dem Hochladen eines Skripts, dass `crabbox inspect` ein öffentliches Netzwerk ohne Tailscale-Status meldet.
Eigene AWS-/Hetzner-Kapazität bleibt außerdem die Ausweichlösung bei Blacksmith-Ausfällen, Kontingentproblemen oder ausdrücklich angeforderten Tests mit eigener Kapazität.

Zu Beginn einer vertrauenswürdigen Code-Aufgabe, die voraussichtlich Tests oder umfangreiche Nachweise erfordert, sollten Agenten das Aufwärmen sofort in einer Befehlssitzung im Hintergrund starten, während der Bereitstellung mit Prüfung und Bearbeitung fortfahren, die zurückgegebene `tbx_...`-ID wiederverwenden, bei jeder Ausführung den aktuellen Checkout synchronisieren und die Testbox vor der Übergabe stoppen:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Crabbox-gestützte Blacksmith-Ausführungen wärmen einmalig verwendete Testboxes auf, beanspruchen und synchronisieren sie, führen Aufgaben aus, erstellen Berichte und bereinigen sie anschließend. Die integrierte Plausibilitätsprüfung der Synchronisierung bricht frühzeitig ab, wenn `git status --short` auf der synchronisierten Box mindestens 200 Löschungen nachverfolgter Dateien anzeigt. Dadurch werden verschwindende Root-Dateien wie `pnpm-lock.yaml` erkannt. Setzen Sie bei PRs mit beabsichtigten umfangreichen Löschungen für den Remote-Befehl `CRABBOX_ALLOW_MASS_DELETIONS=1`.

Crabbox beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der Synchronisierungsphase verbleibt, ohne eine Ausgabe nach der Synchronisierung zu erzeugen. Setzen Sie `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diese Schutzprüfung zu deaktivieren, oder verwenden Sie bei ungewöhnlich großen lokalen Diffs einen höheren Millisekundenwert.

Prüfen Sie den Wrapper vor der ersten Ausführung vom Repository-Root aus:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repository-Wrapper lehnt ein veraltetes Crabbox-Binärprogramm ab, das den ausgewählten Provider nicht ausweist. Für Blacksmith-gestützte Ausführungen ist Crabbox 0.22.0 oder neuer erforderlich, damit der Wrapper das aktuelle Verhalten für Testbox-Synchronisierung, Warteschlange und Bereinigung erhält. Vermeiden Sie in Codex-Worktrees oder verknüpften/teilweise ausgecheckten Checkouts das lokale Skript `pnpm crabbox:run`, da pnpm möglicherweise Abhängigkeiten abgleicht, bevor Crabbox startet; rufen Sie stattdessen den Node-Wrapper direkt auf:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Wenn Sie den benachbarten Checkout verwenden, erstellen Sie das ignorierte lokale Binärprogramm vor Zeitmessungs- oder Nachweisarbeiten neu:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Der Block `blacksmith:` in `.crabbox.yaml` legt bereits die Standardwerte für Organisation, Workflow, Job und Ref fest, daher sind die nachstehenden expliziten Flags optional. Änderungsprüfung:

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

Erneute Ausführung eines gezielten Tests:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Vollständige Testsuite:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lesen Sie die abschließende JSON-Zusammenfassung. Die relevanten Felder sind `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Bei delegierten
Blacksmith-Testbox-Ausführungen bilden der Exit-Code des Crabbox-Wrappers und die JSON-Zusammenfassung das
Befehlsergebnis. Die verknüpfte GitHub-Actions-Ausführung ist für Hydration und Keepalive zuständig; sie
kann mit `cancelled` enden, wenn die Testbox extern gestoppt wird, nachdem der SSH-Befehl
bereits zurückgekehrt ist. Behandeln Sie dies als Bereinigungs-/Statusartefakt, sofern
der `exitCode` des Wrappers nicht ungleich null ist oder die Befehlsausgabe einen fehlgeschlagenen Test zeigt.
Einmalige, durch Blacksmith gestützte Crabbox-Ausführungen sollten die Testbox automatisch stoppen;
wenn eine Ausführung unterbrochen wurde oder die Bereinigung unklar ist, prüfen Sie die aktiven Boxen und stoppen Sie nur
die von Ihnen erstellten Boxen:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie die Wiederverwendung nur, wenn Sie absichtlich mehrere Befehle auf derselben hydrierten Box benötigen:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Verwenden Sie den Lease wieder, nicht veralteten Quellcode. Lassen Sie `--no-sync` weg, damit jede Ausführung den
aktuellen Checkout hochlädt; verwenden Sie es nur, um einen unveränderten, bereits synchronisierten Arbeitsbaum
absichtlich erneut auszuführen. Nicht vertrauenswürdiger Code von Mitwirkenden oder Forks muss
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` und für jeden Befehl ein frisches
temporäres entferntes `HOME` verwenden; installieren Sie Abhängigkeiten innerhalb dieses
bereinigten Befehls, bevor Sie Tests ausführen. Verwenden Sie ausschließlich einen neu aufgewärmten Lease wieder, der
demselben nicht vertrauenswürdigen Quellcode gewidmet ist; niemals einen vertrauenswürdigen oder zuvor hydrierten Lease. Führen Sie niemals
den Wrapper oder die Konfiguration des nicht vertrauenswürdigen Checkouts lokal aus: Starten Sie die installierte,
vertrauenswürdige Crabbox-Binärdatei von einem sauberen, vertrauenswürdigen `main` und übergeben Sie bei jeder
Ausführung `--fresh-pr`. Lassen Sie `CRABBOX_AWS_INSTANCE_PROFILE` ungesetzt, lehnen Sie ein nicht leeres aufgelöstes
Instanzprofil ab, verlangen Sie einen vertrauenswürdigen entfernten IMDS-Nachweis, dass keine Rolle vorhanden ist, und überprüfen Sie den
geprüften Head-SHA vor Installation/Test. Binden Sie den Lease an diesen SHA; stoppen Sie ihn und
wärmen Sie ihn nach jeder Head-Änderung neu auf. Wenn kein entfernter PR vorhanden ist, verwenden Sie Fork-CI ohne Secrets.
Wählen Sie für nicht vertrauenswürdigen Quellcode niemals `hydrate-github` oder den mit Anmeldedaten hydrierten Blacksmith-Workflow.

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes
Blacksmith nur für Diagnosen wie `list`, `status` und Bereinigung. Reparieren Sie den
Crabbox-Pfad, bevor Sie eine direkte Blacksmith-Ausführung als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue
Aufwärmvorgänge aber nach einigen Minuten ohne IP oder URL der Actions-Ausführung in `queued` verbleiben,
behandeln Sie dies als Belastung durch Blacksmith-Provider, Warteschlange, Abrechnung oder Organisationslimit. Stoppen Sie die
von Ihnen erstellten IDs in der Warteschlange, starten Sie keine weiteren Testboxen und verlagern Sie den Nachweis auf den
nachstehenden Pfad mit eigener Crabbox-Kapazität, während jemand das Blacksmith-Dashboard,
die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen oder durch Kontingente begrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Vermeiden Sie unter AWS-Auslastung `class=beast`, sofern die Aufgabe nicht tatsächlich CPU-Leistung der 48xlarge-Klasse benötigt. Eine `beast`-Anforderung beginnt bei 192 vCPUs und löst am leichtesten regionale EC2-Spot- oder On-Demand-Standard-Kontingente aus. Die Repository-eigene `.crabbox.yaml` verwendet standardmäßig `class: standard`, den On-Demand-Markt und `capacity.hints: true`, sodass vermittelte AWS-Leases die ausgewählte Region/den ausgewählten Markt, den Kontingentdruck, den Spot-Fallback und Warnungen bei Hochlastklassen ausgeben. Verwenden Sie `fast` für umfangreichere breite Prüfungen, `large` nur, wenn Standard/Fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-intensive Lanes wie vollständige Testsuites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Leistungsprofilierung mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, gezielte Tests, reine Dokumentationsarbeit, gewöhnliches Linting/Typechecking, kleine E2E-Reproduktionen oder die Triage eines Blacksmith-Ausfalls. Verwenden Sie zur Kapazitätsdiagnose `--market on-demand`, damit Schwankungen des Spot-Marktes das Signal nicht verfälschen.

`.crabbox.yaml` verwaltet die Standardwerte für Provider, Synchronisierung und GitHub-Actions-Hydration. Die Crabbox-Synchronisierung überträgt niemals `.git`, sodass der hydrierte Actions-Checkout seine eigenen entfernten Git-Metadaten behält, anstatt Maintainer-lokale Remotes und Objektspeicher zu synchronisieren. Außerdem schließt die Repository-Konfiguration lokale Laufzeit-/Build-Artefakte (wie `.artifacts` und Testberichte) aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, den Abruf von `origin/main` und die Übergabe der nicht geheimen Umgebung für `crabbox run --id <cbx_id>`-Befehle in der eigenen Cloud.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
