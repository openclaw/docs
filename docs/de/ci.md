---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlgeschlagene GitHub-Actions-Prüfung
    - Sie koordinieren einen Lauf oder erneuten Lauf der Release-Validierung
    - Sie ändern die ClawSweeper-Weiterleitung oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Bereichs-Gates, Release-Umbrellas und entsprechende lokale Befehle
title: CI-Pipeline
x-i18n:
    generated_at: "2026-07-24T03:40:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9de5b527354f3cc9eed3813e961116f3834c61bd72b29c92f762c46722815df
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei Pushes an `main` ausgeführt (Markdown- und `docs/**`-Pfade werden
beim Auslöser ignoriert), bei jedem Pull Request, der kein Entwurf ist, und bei manueller Auslösung.
Kanonische Pushes an `main` werden einzeln ausgeführt: Die Parallelitätsgruppe `CI` lässt einen
vollständigen Integrationszyklus laufen, während GitHub nur den neuesten ausstehenden Push beibehält.
Neue Merges ersetzen diesen ausstehenden Lauf, anstatt bereits laufende Arbeit abzubrechen, die
eine Blacksmith-Matrix registriert hat. Pull Requests brechen weiterhin durch neuere Heads überholte Läufe ab,
und manuelle Auslösungen verwenden isolierte Gruppen. `preflight` klassifiziert den Diff und
deaktiviert aufwendige Lanes, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle
`workflow_dispatch`-Läufe umgehen bewusst das intelligente Scoping und fächern für
Release-Kandidaten und umfassende Validierungen den vollständigen Graphen auf. Android-Lanes bleiben
über `include_android` (oder die Eingabe `release_gate`) optional. Die ausschließlich für Releases vorgesehene
Plugin-Abdeckung befindet sich im separaten
[`Plugin Prerelease`](#plugin-prerelease)-Workflow und wird nur durch
[`Full Release Validation`](#full-release-validation) oder eine ausdrücklich manuelle
Auslösung ausgeführt.

## Pipeline-Übersicht

| Job                                | Zweck                                                                                                                                                                                                               | Ausführungszeitpunkt                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `preflight`                        | Geänderte Bereiche erkennen und das CI-Manifest erstellen; bei kanonischen Node-relevanten `main` den Abhängigkeits-Snapshot vor der Auffächerung aktualisieren und pflegen                                                                        | Immer bei Pushes und PRs, die keine Entwürfe sind      |
| `security-fast`                    | Erkennung privater Schlüssel, Prüfung geänderter Workflows über `zizmor` und Prüfung der Produktions-Lockdatei                                                                                                                             | Immer bei Pushes und PRs, die keine Entwürfe sind      |
| `pnpm-store-warmup`                | Den durch die Lockdatei festgelegten Actions-Cache für Pull Requests und manuelle Läufe vorwärmen, ohne Linux-Node-Shards zu blockieren                                                                                                           | Außerhalb von main ausgewählte Node- oder Dokumentationsprüfungs-Lanes |
| `build-artifacts`                  | `dist/`, Control UI, Smoke-Tests der gebauten CLI, Startspeicher und eingebettete Prüfungen der Build-Artefakte bauen                                                                                                                 | Bei Node-relevanten Änderungen                         |
| `control-ui-i18n`                  | Generierte Control-UI-Locale-Bundles, Metadaten und Translation Memory überprüfen; bei automatischen Läufen beratend, bei manueller Release-CI blockierend                                                                               | Bei für die Control-UI-i18n relevanten Änderungen und manueller CI |
| `checks-fast-core`                 | Schnelle Linux-Korrektheits-Lanes: Maximalzeilen-Ratsche der Unterdrückungs-Baseline, gebündelt + Protokoll, Bun-Launcher und schnelle Aufgabe für das CI-Routing                                                                                  | Bei Node-relevanten Änderungen                         |
| `qa-smoke-ci-profile`              | Zwei eigenständige, ausgewogene Teile der begrenzten repräsentativen automatischen QA-Smoke-Menge; die vollständige Taxonomieabdeckung bleibt über explizite QA-Profile verfügbar                                                         | Bei Node-relevanten Änderungen                         |
| `checks-fast-contracts-plugins-*`  | Zwei gewichtete Shards für Plugin-Verträge                                                                                                                                                                                   | Bei Node-relevanten Änderungen                         |
| `checks-fast-contracts-channels-*` | Zwei gewichtete Shards für Kanalverträge                                                                                                                                                                                  | Bei Node-relevanten Änderungen                         |
| `checks-node-*`                    | Node-Tests für geänderte Ziele bei Pull Requests; vollständige Kern-Shards bei `main` sowie bei manuellen, Release- und umfassenden Fallback-Läufen                                                                                                      | Bei Node-relevanten Änderungen                         |
| `check-*`                          | Geshardetes Äquivalent des lokalen main-Gates: Schutzprüfungen, Shrinkwrap, Konfigurationsmetadaten gebündelter Kanäle, Produktionstypen, Linting, Abhängigkeiten, Testtypen                                                                                   | Bei Node-relevanten Änderungen                         |
| `check-additional-*`               | Streifen für Grenzprüfungen (einschließlich Abweichungen von Prompt-Snapshots), Grenzen für Session-Accessoren/Transkriptleser/SQLite-Transaktionen, Lint-Gruppen für Erweiterungen, Kompilierung/Canary für Paketgrenzen und Architektur der Laufzeittopologie | Bei Node-relevanten Änderungen                         |
| `checks-node-compat-node22`        | Kompatibilitäts-Build und Smoke-Lane für Node 22                                                                                                                                                                            | Bei manueller CI-Auslösung für Releases                |
| `check-docs`                       | Formatierungs-, Lint- und Linkprüfungen der Dokumentation                                                                                                                                                                         | Bei geänderter Dokumentation (PRs und manuelle Auslösung) |
| `native-i18n`                      | Extraktion nativer Quellen und Lokalisierungssicherheit bei Quell-PRs überprüfen; vollständige Parität übersetzter/plattformgenerierter Inhalte bei generierten PRs und manueller CI erzwingen                                                               | Bei für native i18n relevanten Änderungen              |
| `skills-python`                    | Ruff + pytest für Python-basierte Skills                                                                                                                                                                                | Bei für Python-Skills relevanten Änderungen            |
| `checks-windows`                   | Windows-spezifische Prozess-/Pfadtests sowie gemeinsame Regressionen bei Importbezeichnern der Laufzeit                                                                                                                                  | Bei Windows-relevanten Änderungen                      |
| `macos-node`                       | Fokussierte macOS-TypeScript-Tests: launchd, Homebrew, Laufzeitpfade, Paketierungsskripte, Prozessgruppen-Wrapper                                                                                                            | Bei macOS-relevanten Änderungen                        |
| `macos-swift`                      | Swift-Linting und Build für die macOS-App sowie Tests für die App und das gemeinsame OpenClawKit-Paket                                                                                                                         | Bei macOS-relevanten Änderungen                        |
| `ios-build`                        | Xcode-Projektgenerierung sowie Simulator-Build der iOS-App                                                                                                                                                             | Bei Änderungen an der iOS-App, dem gemeinsamen App-Kit oder Swabble |
| `android`                          | Android-Unit-Tests für beide Varianten sowie ein Debug-APK-Build                                                                                                                                                          | Bei Android-relevanten Änderungen                      |
| `openclaw/ci-gate`                 | Abschließendes Aggregat: setzt Vorabprüfung und Sicherheit voraus; akzeptiert Überspringen nur für durch das Manifest deaktivierte nachgelagerte Lanes                                                                                                           | Bei jedem CI-Lauf, der kein Entwurf ist                |
| `test-performance-agent`           | Separater Workflow: tägliche Optimierung langsamer Codex-Tests nach vertrauenswürdiger Aktivität                                                                                                                                          | Nach erfolgreicher main-CI oder manueller Auslösung    |
| `openclaw-performance`             | Separater Workflow: tägliche/bedarfsgesteuerte Leistungsberichte der Kova-Laufzeit mit Mock-Provider-, Deep-Profile- und GPT-5.6-Live-Lanes                                                                                          | Bei geplanter und manueller Auslösung                  |

Eigenständige Periphery-Workflows erzwingen, dass für die iOS- und macOS-Apps keine Funde von ungenutztem Code vorliegen. Der gemeinsame OpenClawKit-Workflow scannt beide Verbraucher parallel und meldet eine Deklaration nur, wenn Periphery aus beiden Builds dieselbe Swift-USR ausgibt. Der generierte Schema-Vertrag `OpenClawProtocol/GatewayModels.swift` wird als generatorverwalteter Code beibehalten, statt als app-lokaler ungenutzter Code behandelt zu werden.

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt vorhanden sind. Die Logik von `docs-scope` und `changed-scope` besteht aus Schritten innerhalb dieses Jobs, nicht aus eigenständigen Jobs. Das kanonische `main` startet sofort, aber seine Parallelitätsgruppe lässt nur einen vollständigen Lauf zu und fasst spätere Pushes zu einem einzigen neuesten ausstehenden Lauf zusammen. Node-relevante Pushes an main serialisieren hier außerdem den einzigen Schreiber auf den Abhängigkeitsdatenträger und dessen Größenpflege, bevor nachgelagerte Jobs den Schlüssel einbinden dürfen; Blacksmith stellt einen neuen Commit möglicherweise erst einem späteren Workflow-Lauf bereit, daher behalten Verbraucher desselben Laufs den anhand einer Markierung geprüften lokalen Fallback bei.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die aufwendigeren Artefakt- und Plattformmatrix-Jobs zu warten.
3. `build-artifacts` und die Locale-Prüfungen überschneiden sich mit den schnellen Linux-Lanes. Quell-PRs für Control UI und native Apps schließen generierte Locale-Snapshots/-Ressourcen aus; ihre serialisierten Aktualisierungs-Workflows reparieren und mergen isolierte generierte PRs automatisch im Hintergrund. Die Quell-CI blockiert weiterhin veraltete Quellinventare und unsichere Lokalisierungsaufrufe. Generierte PRs, manuelle CI und die Release-Vorbereitung erzwingen die vollständige Parität übersetzter/plattformgenerierter Inhalte. Kanonische `release/YYYY.M.PATCH`-Branches können Locale-Reparaturen zur Release-Vorbereitung zusammen mit den anderen generierten Release-Ausgaben enthalten.
4. Anschließend werden aufwendigere Plattform- und Laufzeit-Lanes aufgefächert: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` und `android`.
5. `openclaw/ci-gate` wartet auf jede ausgewählte Lane. Vorabprüfung und Sicherheit müssen erfolgreich sein; nachgelagerte Jobs dürfen nur übersprungen werden, wenn das Manifest sie nicht ausgewählt hat. Eine fehlgeschlagene oder abgebrochene ausgewählte Lane lässt das Aggregat fehlschlagen.

Der Merge-Koordinator kann ein authentifiziertes erfolgreiches `openclaw/ci-gate`
für denselben Pull-Request-Head bis zu 24 Stunden lang wiederverwenden. Dadurch muss ein
Contributor-Branch nach nicht zusammenhängenden Änderungen an `main` nicht neu geschrieben werden. Das wiederverwendbare Ergebnis
ersetzt nicht die separate strikte, der App gehörende Test-Merge-Prüfung gegen das aktuelle `main`.
Ein späterer ausstehender oder fehlgeschlagener Wiederholungslauf löscht während des Aktualitätsfensters
kein früheres erfolgreiches Ergebnis für diesen unveränderten Head.

Das Regelsystem für den Standard-Branch erfordert den GitHub-Actions-eigenen Check `openclaw/ci-gate`. Repository-Maintainer und -Administratoren verfügen über eine auditierte Notfallumgehung, die ausschließlich für signierte direkte Fast-Forward-Landings vorgesehen ist; das Regelsystem der Organisation blockiert weiterhin Löschungen und Non-Fast-Forward-Aktualisierungen. Normale Pull-Request-Merges sollten weiterhin das Gate verwenden, statt eine fehlgeschlagene CI zu umgehen. Der separate strikte App-eigene Test-Merge-Check bindet den Head weiterhin an den aktuellen `main`.

GitHub kann ersetzte Pull-Request-Jobs als `cancelled` markieren, wenn ein neuerer Head landet. Behandeln Sie dies als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben PR fehlschlägt. Kanonische `main`-Läufe werden nach der Zulassung nicht abgebrochen; wenn Merge-Aktivität eintrifft, ersetzt GitHub nur den älteren ausstehenden Lauf durch den neuesten Tip. Matrix-Jobs verwenden `fail-fast: false`, und `build-artifacts` meldet Fehler bei eingebetteten Channels, der Core-Support-Grenze und der Gateway-Überwachung direkt, statt winzige Verifizierungs-Jobs in die Warteschlange einzureihen. Der automatische CI-Parallelitätsschlüssel ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Warteschlangengruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle vollständige Testläufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab. Die Schutzprüfung für den Startspeicher der Plugin-Liste hält auf selbst gehostetem Blacksmith Linux eine Obergrenze von 350 MiB ein und erlaubt auf von GitHub gehostetem Linux 425 MiB, dessen RSS-Basiswert für dieselbe gebaute CLI höher ist.

Verwenden Sie `pnpm ci:timings`, `pnpm ci:timings:recent` oder `node scripts/ci-run-timings.mjs <run-id>`, um Gesamtdauer, Warteschlangenzeit, langsamste Jobs, Fehler und die `pnpm-store-warmup`-Fanout-Barriere aus GitHub Actions zusammenzufassen. Der workflow-interne Job `ci-timings-summary` ist in `ci.yml` vorhanden, aber derzeit deaktiviert (`if: false`); führen Sie stattdessen den Zeitmessungshelfer lokal aus. Prüfen Sie für die Build-Zeitmessung den Schritt `Build dist` des Jobs `build-artifacts`: `pnpm build:ci-artifacts` gibt `[build-all] phase timings:` aus und enthält `ui:build`; der Job lädt außerdem das Artefakt `startup-memory` hoch.

## PR-Kontext und Nachweise

PRs externer Mitwirkender durchlaufen ein Gate für PR-Kontext und Nachweise aus
`.github/workflows/real-behavior-proof.yml`. Der Workflow checkt die
vertrauenswürdige Workflow-Revision (`github.workflow_sha`) aus und wertet nur den PR-Text
aus; er führt keinen Code aus dem Branch des Mitwirkenden aus.

Das Gate gilt für PR-Autoren, die weder Repository-Eigentümer, Mitglieder,
Mitwirkende mit Zugriff noch Bots sind. Es ist erfolgreich, wenn der PR-Text selbst verfasste
Abschnitte `What Problem This Solves` und `Evidence` enthält. Als Nachweis eignen sich ein fokussierter
Test, ein CI-Ergebnis, ein Screenshot, eine Aufzeichnung, eine Terminalausgabe, eine Live-Beobachtung,
ein redigiertes Protokoll oder ein Artefakt-Link. Der Text erläutert die Absicht und enthält eine nützliche Validierung;
Reviewer prüfen den Code, die Tests und die CI, um die Korrektheit zu beurteilen.

Wenn der Check fehlschlägt, aktualisieren Sie den PR-Text, statt einen weiteren Code-Commit zu pushen.

## Umfang und Routing

Die Umfangslogik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Bei manueller Ausführung wird die Erkennung des geänderten Umfangs übersprungen, und das Preflight-Manifest verhält sich so, als hätte sich jeder definierte Bereich geändert.

Separate Periphery-Workflows für iOS und macOS erzwingen eine Null-Fundstellen-Richtlinie für ungenutzten Code. Sie werden jeweils nur ausgeführt, wenn ein Pull Request, der kein Entwurf ist, ihren nativen Scan-Umfang berührt oder wenn sie manuell ausgelöst werden.

- **Änderungen an CI-Workflows** validieren den Node-CI-Graphen, das Workflow-Linting und die Windows-Lane (`ci.yml` führt sie aus), erzwingen jedoch nicht von sich aus native Builds für iOS, Android oder macOS; diese Plattform-Lanes bleiben auf Änderungen am jeweiligen Plattform-Quellcode beschränkt.
- **Workflow-Plausibilitätsprüfung** führt `actionlint`, `zizmor` über alle Workflow-YAML-Dateien, die Interpolationsschutzprüfung für Composite Actions und die Schutzprüfung auf Konfliktmarker aus. Der PR-bezogene Job `security-fast` führt außerdem `zizmor` über geänderte Workflow-Dateien aus, damit Workflow-Sicherheitsbefunde frühzeitig im Haupt-CI-Graphen fehlschlagen.
- **Dokumentation bei Pushes auf `main`** wird durch den eigenständigen Workflow `Docs` mit demselben ClawHub-Dokumentationsspiegel geprüft, den auch die CI verwendet, sodass gemischte Code-und-Dokumentations-Pushes nicht zusätzlich den CI-Shard `check-docs` in die Warteschlange einreihen. Pull Requests und manuelle CI führen weiterhin `check-docs` aus der CI aus, wenn sich die Dokumentation geändert hat.
- **TUI-PTY** wird bei TUI-Änderungen im Linux-Node-Shard `checks-node-core-runtime-tui-pty` ausgeführt. Der Shard führt `test/vitest/vitest.tui-pty.config.ts` mit `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` aus und deckt damit sowohl die deterministische Fixture-Lane `TuiBackend` als auch den langsameren Smoke-Test `tui --local` ab, der nur den externen Modellendpunkt mockt.
- **Reine Änderungen am CI-Routing, der kleine Satz von Core-Test-Fixtures, den die schnelle Task direkt ausführt, und eng begrenzte Änderungen an Hilfsfunktionen für Plugin-Verträge** verwenden einen schnellen, ausschließlich Node-basierten Manifestpfad: `preflight`, `security-fast` und nur die schnellen Lanes, die von der Änderung betroffen sind – eine einzelne CI-Routing-Task `checks-fast-core`, die beiden Shards für Plugin-Verträge oder beide. Dieser Pfad überspringt Build-Artefakte, die Kompatibilität mit Node 22, Channel-Verträge, vollständige Core-Shards, Shards gebündelter Plugins und zusätzliche Schutzprüfungsmatrizen.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Hilfsfunktionen, die Paketmanagerkonfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Änderungen an Quellcode, Plugins, Installations-Smoke-Tests und reine Teständerungen verbleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne übermäßig viele Runner zu reservieren:

- Plugin-Verträge und Kanalverträge werden jeweils als zwei gewichtete, von Blacksmith unterstützte Shards mit dem standardmäßigen GitHub-Runner-Fallback ausgeführt.
- Die schnellen Core-Unit-/Support-Lanes werden separat ausgeführt; die Core-Laufzeitinfrastruktur wird in Prozess-, Shared-, Hooks-, Secrets- und drei Cron-Domänen-Shards aufgeteilt.
- Auto-Reply wird mit gleichmäßig ausgelasteten Workern ausgeführt, wobei der Reply-Unterbaum in Agent-Runner-, Befehls-, Dispatch-, Sitzungs- und State-Routing-Shards aufgeteilt ist.
- Die Konfigurationen für agentisches Gateway/Server (Steuerungsebene) werden auf Chat-, Auth-, Modell-, HTTP-/Plugin-, Laufzeit- und Start-Lanes verteilt, statt auf erstellte Artefakte zu warten.
- Die normale CI bündelt nur isolierte Infrastruktur-Shards mit Include-Mustern in deterministische Pakete mit höchstens 64 Testdateien. Dadurch wird die Node-Matrix verkleinert, ohne nicht isolierte Befehls-/Cron-, zustandsbehaftete Agents-Core- oder Gateway-/Server-Suites zusammenzuführen. Umfangreiche fest definierte Suites verbleiben auf 8 vCPU, während die gebündelten Lanes und jene mit geringerer Gewichtung 4 vCPU verwenden.
- Pull Requests im kanonischen Repository verwenden den Resolver für geänderte Tests erneut für den synthetischen Diff des zusammengeführten Baums. Präzise Änderungen führen einen gezielten Node-Job aus; jede ausgewählte Testdatei erhält einen eigenen Prozess, sodass die Isolation zustandsbehafteter Suites erhalten bleibt. Der Planer kombiniert gleichgeordnete Tests mit vom Importgraphen abhängigen Tests und fällt bei Änderungen an Workspace-Paketen, Paketen/Lockfiles, gemeinsamem Harness, aufgeteilten Konfigurationen, umbenannten oder gelöschten Elementen, öffentlichen Erweiterungsverträgen, Tests mit spezieller Shard-Einrichtung, teilweise aufgelösten oder leeren Zielen, übergroßen Pfad- oder Zielplänen sowie Planerfehlern auf den bestehenden kompakten Plan mit 14 Jobs für die vollständige Suite zurück. Gezielte Pläne behalten stets das vollständige Grenz-Gate für erstellte Artefakte bei, da dessen Repository-Scanner nicht aus Importen abgeleitet werden können. `main`-Pushes führen dieselbe vollständige kompakte Suite aus: Ausstehende zwischenzeitliche Push-Ereignisse können zusammengefasst werden, daher muss der neueste verbleibende Lauf den vollständigen Integrationsbaum und nicht nur seinen abschließenden Einzel-Push-Diff validieren. Manuelle Ausführungen und Release-Gates behalten die vollständige benannte Matrix pro Shard bei.
- Die vollständige Node-Matrix lässt zuerst die konstant langsamen seriellen Werkzeuge, die Auto-Reply-Befehls-Shards und den umfassenden Core-Fast-Cache-Writer zu. Dadurch bleibt die Obergrenze von 28 Jobs erhalten, während verhindert wird, dass Arbeit auf dem kritischen Pfad und der Transformations-Seed des nächsten Laufs in eine spätere Welle rutschen.
- Umfassende Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt der gemeinsamen Plugin-Sammelkonfiguration. Shards mit Include-Mustern zeichnen Zeitmessungseinträge unter Verwendung des CI-Shard-Namens auf, sodass `.artifacts/vitest-shard-timings.json` zwischen einer vollständigen Konfiguration und einem gefilterten Shard unterscheiden kann.
- Linux-Node-Shard-Jobs bewahren Vitests experimentellen Dateisystem-Modulcache über die vorgeschaltete Actions-Cache-API auf, die Blacksmith auf seinen Runnern transparent beschleunigt. Jeder CI-Shard stellt ausschließlich wieder her und entpackt den geschützten Seed in sein eigenes Runner-lokales Stammverzeichnis; der Shard-Wrapper weist dann parallel ausgeführten Vitest-Prozessen separate aktive Unterverzeichnisse zu. Nur der nicht abbrechende tägliche oder ausdrücklich ausgelöste Warmer speichert ein neues unveränderliches Archiv, sodass Pull Requests weder Transformationen veröffentlichen noch Cache-Familien pro PR erzeugen können. Ein Fingerabdruck der Transformationseingaben verwirft inkompatible Generationen von Lockfile, Paket, tsconfig und Vitest-Konfiguration. Der geschützte Writer scannt und bereinigt seinen wiederhergestellten Cache auf 75 %, nachdem dieser 2 GiB überschritten hat. Vitest hasht Modul-ID, Quellinhalt, Umgebung und aufgelöste Transformationskonfiguration, sodass bei gewöhnlichen partiellen Quelländerungen unveränderte Einträge warm bleiben, während geänderte Module sicher einen Cache-Miss erzeugen. Grobe Wiederherstellungspräfixe überbrücken Workflow-Läufe; die normale LRU- und Inaktivitätsbereinigung des Actions-Caches begrenzt alte unveränderliche Archive.
- Vertrauenswürdige Linux-Node-Jobs binden außerdem den pnpm-Store und `node_modules` aus einem geschützten Abhängigkeitsdatenträger pro unterstützter Node-Linie ein. Paketmanifeste, Installationseinstellungen, Runner-Plattform und der genaue Node-Patch bleiben außerhalb des Datenträgerschlüssels; ein exakter Fingerabdruck der Laufzeit und Installationseingaben entscheidet, ob ein Job den Baum wiederverwendet oder neu installiert und denselben Datenträger aktualisiert. Manifeste werden vor dem Hashen kanonisiert. Die geprüften direkten Root-Hooks berücksichtigen nur die Installations-Lebenszyklusskripte von pnpm, sodass Änderungen an Formatierungs- und gewöhnlichen Test-/Build-Skripten den warmen Abhängigkeitsbaum beibehalten; ungeprüfte Abweichungen bei Lebenszyklus-Hooks schlagen sicher geschlossen fehl, bis ihre Quelleingaben in den Fingerabdruckvertrag aufgenommen wurden. Änderungen an Abhängigkeiten, Paketmanager, Hook-Quellen und Lockfile machen den Snapshot stets ungültig. Ein übereinstimmender Fingerabdruck ist notwendig, aber nicht hinreichend: Die Einrichtung prüft außerdem das Importer-Archiv und die Manifest-Prüfsummen und verifiziert anschließend Registry-gestützte Lockfile-Abhängigkeiten, die durch postinstall beibehalten werden, anhand der Paketmanifeste, die Node von ihren Importern auflöst. Fehlende oder veraltete Importer-Inhalte führen zu einer Neuinstallation, statt den Root-Hoist bereitzustellen. Ein Pull Request, dessen schreibgeschützter Snapshot unbrauchbar ist, trennt die Workspace-Bindung und installiert in Runner-lokalen Speicher, wodurch langsame Schreibvorgänge in einen Klon vermieden werden, den er nicht veröffentlichen kann. Persistente Kaltinstallationen deaktivieren die internen Abrufwiederholungen von pnpm und führen bis zu drei begrenzte vollständige Installationsversuche aus dem zunehmend aufgewärmten Store durch; ein Timeout bleibt ein Fehler. Nach einer inhaltlich validierten Wiederherstellung oder einer Installation mit eingefrorenem Lockfile deaktiviert die Einrichtung die redundante Abhängigkeitsprüfung von pnpm vor der Ausführung: Das Repository bereinigt absichtlich Plugin-lokale `node_modules`, die pnpm andernfalls als veraltet behandelt und während des Shard-Fan-outs durch unsichere parallele implizite Installationen repariert. Der Preflight des kanonischen main ist der einzige Writer und misst den Store bei jeder Aktualisierung; `pnpm store prune` wird erst ausgeführt, nachdem ausgemusterte Paketversionen ihn über 8 GiB anwachsen lassen. Die Veröffentlichung von Blacksmith-Snapshots erfolgt auch nach Abschluss eines Writer-Jobs asynchron, sodass der erste Lauf nach einem neuen Schlüssel oder Fingerabdruck kalt bleiben kann; spätere inhaltlich validierte Wiederherstellungen mit exakter Markierung dienen als Nachweis für die Einführung. Erforderliche CI-Jobs und Pull Requests erhalten Wegwerfklone, sodass Änderungen an Abhängigkeiten weder neue Datenträger noch konkurrierende Snapshots oder eine Cache-Sperre erzeugen, die Builds abbrechen kann.
- Node-Shard- und Build-Artefakt-Jobs stellen außerdem Nodes portablen Compile-Cache auf dem Datenträger über unveränderliche Actions-Caches wieder her. Unabhängige `test`- und `build`-Namespaces verhindern, dass ihre Writer gegenseitig ihre Archive ersetzen: Der geplante Test-Warmer besitzt den geschützten Test-Seed, während `build-artifacts` höchstens ein geschütztes Build-Archiv pro UTC-Tag aus vertrauenswürdigen `main`-Pushes veröffentlichen darf. PR- und gewöhnliche Test-Jobs lesen ausschließlich geschützte Snapshots, sodass Bytecode aus Feature-Branches niemals in den gemeinsamen Seed gelangt und PR-Datenverkehr keine Cache-Archive erzeugt. Dadurch wird V8-Bytecode für von Node geladene Orchestrierung, Build-Werkzeuge und externe Abhängigkeiten über unterschiedliche Checkout-Pfade hinweg wiederverwendet, auch wenn sich nur ein Teil des Quellgraphen ändert. Untergeordnete Vitest-Prozesse deaktivieren einen geerbten Compile-Cache, da Coverage innerhalb dynamischer Konfigurationen aktiviert werden kann und V8-Coverage beim Deserialisieren von Skripten aus Bytecode an Präzision der Quellpositionen verlieren kann.
- Der Build-Artefakt-Job bewahrt außerdem inhaltsfingerabdruckbasierte Ausgaben der `build-all`-Schritte auf. Die von der CI selbst erstellten Deklarationen des Plugin-SDK hashen den vollständigen Repository-eigenen TypeScript-/JSON-Quellgraphen, schließen installierte und generierte Verzeichnisse aus und stellen sowohl flache Deklarationen als auch Paketbrücken wieder her, nachdem `tsdown` `dist` bereinigt hat. Änderungen an Dokumentation, Workflows, Plugins und anderen Elementen außerhalb dieses Graphen können den Deklarations-Snapshot wiederverwenden; Quelländerungen erstellen ihn neu, bevor das Export-Gate ausgeführt wird.
- Vollständige Deklarations-Builds teilen `tsdown` in KI-, Workspace-Paket- und vereinheitlichte Gruppen auf. Jede Gruppe speichert nur Deklarationen im Cache, erstellt aber weiterhin das Laufzeit-JavaScript neu, bevor diese Deklarationen wiederhergestellt werden. Core- oder Plugin-Änderungen machen daher nur den großen vereinheitlichten Graphen ungültig, während Änderungen an Workspace-Paketen konservativ jede abhängige Deklarationsgruppe ungültig machen. Öffentliche vollständige Builds verwenden im Allgemeinen einen unveränderlichen Actions-Cache; grobe Wiederherstellungsschlüssel stellen Seeds für partielle Änderungen bereit, inhaltsbasierte Fingerabdrücke pro Gruppe weisen veraltete Daten zurück und GitHubs Cache-Kontingent entfernt alte Generationen. Die wöchentliche Node-22-Lane veröffentlicht stattdessen nach erfolgreichen `main`-Läufen ein 14-Tage-Artefakt und stellt nur Artefakte wieder her, deren unveränderliche Producer-Identität diesem Workflow auf `main` zugeordnet werden kann. Dadurch wird Kontingentfluktuation vermieden, ohne PR-Code das Schreiben in einen gemeinsamen Cache zu gestatten. Private-QA-Deklarationen werden niemals in Actions-Caches gespeichert, da Cache-Namespaces keine Vertraulichkeitsgrenzen darstellen.
- `check-additional-*` verteilt die ergänzende Liste der Grenzprüfungen (`scripts/run-additional-boundary-checks.mjs`) auf einen promptintensiven Shard (`check-additional-boundaries-a`, der die Prüfung auf Abweichungen des Codex-Prompt-Snapshots enthält) und einen kombinierten Shard für die verbleibenden Streifen (`check-additional-boundaries-bcd`). Beide führen unabhängige Prüfungen parallel aus und geben die Dauer jeder Prüfung aus. Compile-/Canary-Arbeiten an Paketgrenzen bleiben zusammen, während die Laufzeittopologie-Architektur separat von der in `build-artifacts` eingebetteten Gateway-Watch-Abdeckung ausgeführt wird.
- Auf dem selbst gehosteten Build-Runner mit 32 vCPU starten Gateway Watch, Kanaltests und der Core-Support-Grenz-Shard gemeinsam innerhalb von `build-artifacts`, nachdem `dist/` und `dist-runtime/` bereits erstellt wurden. Fallback-Läufe auf von GitHub gehosteten Runnern führen Gateway Watch weiterhin seriell aus, damit Konkurrenz um wenige Kerne nicht dessen Bereitschaftsfrist aufbraucht.

Nach der Zulassung erlaubt die kanonische Linux-CI bis zu 28 gleichzeitig ausgeführte Node-Test-Jobs und
12 für die kleineren Fast-/Check-Lanes; Windows und Android bleiben bei zwei, da
diese Runner-Pools kleiner sind. Kompakte Batches vollständiger Konfigurationen werden mit einem
Batch-Timeout von 120 Minuten ausgeführt, während Gruppen mit Include-Mustern dasselbe begrenzte
Job-Budget teilen.

Die Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und erstellt anschließend die Play-Debug-APK. Die Drittanbieter-Variante besitzt weder ein separates Quellset noch ein separates Manifest; ihre Unit-Test-Lane kompiliert die Variante weiterhin mit den SMS-/Anrufprotokoll-BuildConfig-Flags, vermeidet jedoch bei jedem Android-relevanten Push einen doppelten Packaging-Job für die Debug-APK. Jede aktuelle Gradle-Aufgabe besitzt einen geschützten persistenten Datenträger; PR-Jobs verwenden Wegwerfklone, während geschützte Läufe inhaltsadressierte Gradle-Einträge direkt aktualisieren.

Die Schlüssel für persistente Blacksmith-Datenträger sind bewusst auf unterstützte Laufzeit- oder Aufgabendimensionen begrenzt und enthalten niemals PR-Nummer, Commit, Lauf, Branch oder Abhängigkeits-Hash. Laufzeit-Transformations- und Compile-Caches verwenden den Actions-Cache statt persistenter Datenträger, da unveränderliche Archive überprüfbare Wiederherstellungs-/Speicherergebnisse bereitstellen und Fehler bei der Hochstufung veränderlicher Snapshots vermeiden. Fügen Sie nach einer Migration der Schlüsselversion eines persistenten Datenträgers nur die exakten Identitäten der veralteten Schlüssel, Architekturen und Regionen zu `.github/retired-sticky-disks.json` hinzu, lösen Sie `Sticky Disk Cleanup` aus `main` mit denselben Dimensionen und derselben Bestätigung aus, überprüfen Sie die Löschung und entfernen Sie anschließend diese Einträge. Der Workflow leitet ARM-Identitäten an einen ARM-Runner weiter, weist Abweichungen der Runner-Region zurück, verwendet Blacksmiths Aktion zur Löschung exakter Schlüssel und löscht niemals Docker-Builder-Caches oder Platzhalterpräfixe. Actions-Cache-Archive verwenden die normale LRU- und Inaktivitätsbereinigung.

Der `check-dependencies`-Shard führt produktive Knip-Prüfungen auf Abhängigkeiten, ungenutzte Dateien und ungenutzte Exporte aus. Die Prüfung auf ungenutzte Dateien schlägt fehl, wenn ein PR eine neue, nicht überprüfte ungenutzte Datei hinzufügt oder einen veralteten Eintrag in der Zulassungsliste belässt. Gleichzeitig bleiben beabsichtigte dynamische Plugin-, generierte, Build-, Live-Test- und Paketbrücken-Oberflächen erhalten, die Knip nicht statisch auflösen kann. Die Prüfung auf ungenutzte Exporte schließt Test-Support-Dateien aus und schlägt bei jedem ungenutzten Produktionsexport fehl; beabsichtigte dynamische Consumer müssen in `config/knip.config.ts` modelliert werden. Historische Ziele führen die Exportprüfung aus, wenn sie diese bereitstellen, und behalten andernfalls ihren älteren Fallback zur Erkennung von nicht verwendetem Code bei.

## Weiterleitung der ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Brücke von Repository-Aktivitäten in OpenClaw zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn auch nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für konkrete Anfragen zur Überprüfung von Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Überprüfungsanfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivitäten, die der ClawSweeper-Agent untersuchen kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Elementnummer, URL, Titel, Status sowie kurze Auszüge aus Kommentaren oder Reviews, sofern vorhanden. Sie verzichtet bewusst darauf, den vollständigen Webhook-Body weiterzuleiten. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`; er sendet das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agenten.

Allgemeine Aktivität dient der Beobachtung und wird standardmäßig nicht zugestellt. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßiges Öffnen und Bearbeiten, Bot-Aktivität, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Texte, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie dienen als Eingaben für Zusammenfassungen und Triage, nicht als Anweisungen für den Workflow oder die Agenten-Runtime.

## Manuelle Ausführungen

Manuelle CI-Ausführungen verwenden denselben Jobgraphen wie die normale CI, erzwingen jedoch die Aktivierung jeder nicht auf Android beschränkten Lane: Linux-Node-Shards, Shards für gebündelte Plugins, Plugin- und Channel-Vertrag-Shards, Kompatibilität mit Node 22, `check-*`, `check-additional-*`, Smoke-Checks für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS, iOS-Build sowie die Internationalisierung der Control UI und nativer Apps. Automatische Quell-PRs prüfen das Extraktionsinventar nativer Apps sowie die Sicherheit der Android-/Apple-Lokalisierung, ohne dass im selben PR übersetzte oder plattformgenerierte Ausgaben erforderlich sind. Der serialisierte Workflow zur Aktualisierung der Gebietsschemas nativer Apps erstellt diese Artefakte in einem isolierten PR neu und aktiviert Auto-Merge für den exakten Head, nachdem die erforderlichen Prüfungen bestanden wurden. Vollständige Parität nativer Apps bleibt für PRs mit generierten Artefakten, manuelle CI, die vollständige Release-Validierung und die Release-Vorbereitung blockierend. Die Gebietsschemaparität der Control UI bleibt bei automatischen PR- und `main`-Ausführungen ein Hinweis und ist bei manueller Release-CI blockierend. Eigenständige manuelle CI-Ausführungen führen Android nur mit `include_android=true` aus (auch die Eingabe `release_gate` erzwingt Android); die vollständige Release-Klammer aktiviert Android durch Übergabe von `include_android=true`. Statische Vorabprüfungen für Plugin-Vorabveröffentlichungen, der ausschließlich für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Batch-Durchlauf aller Erweiterungen und die Docker-Lanes für Plugin-Vorabveröffentlichungen sind von der CI ausgeschlossen. Die Docker-Vorabveröffentlichungssuite wird nur ausgeführt, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validierungs-Gate ausführt.

Die Prüfungen der maximalen Zeilenzahl für PRs leiten die Baseline aus dem ausgecheckten synthetischen Merge-Baum ab und gleichen dessen Head-Parent mit dem Ereignis-Head ab. Manuelle Ausführungen verwenden eine eindeutige Nebenläufigkeitsgruppe, damit eine vollständige Suite für einen Release-Kandidaten nicht durch einen anderen Push oder eine PR-Ausführung auf demselben Ref abgebrochen wird. Mit der optionalen Eingabe `target_ref` kann ein vertrauenswürdiger Aufrufer diesen Graphen für einen Branch, ein Tag oder eine vollständige Commit-SHA ausführen, während die Workflow-Datei aus dem ausgewählten Ausführungs-Ref verwendet wird; die Baseline für die maximale Zeilenzahl wird mit der Merge-Basis des Ziels gegenüber dem für diese Ausführung aufgelösten Head des Standard-Branches verglichen. Die Eingabe `release_gate` ist ein Maintainer-Fallback mit exakter SHA für PR-CI, die aufgrund fehlender Kapazität feststeckt: `target_ref` muss eine vollständige Commit-SHA sein, die dem Head des ausgeführten Branches entspricht, und `pull_request_number` muss den offenen PR identifizieren, dessen Merge-Baum validiert wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Erweiterte stabile Gateway-Ausführungen führen den npm-Preflight, die vollständige Release-Validierung und die
npm-Veröffentlichung von Plugins aus `extended-stable/YYYY.M.33` aus; die Veröffentlichung des Kerns verwendet diese drei
Ausführungs-IDs sowie den Validierungsversuch. Nachweise aus `release-ci/*` sind ungültig, da
die Veröffentlichung jede Ausführung an den kanonischen Branch und die Release-SHA bindet. Das Tag
veröffentlicht Gateway-Images und nur die `extended-stable*`-Aliasse; dieser Pfad überspringt
den regulären Orchestrator und dessen Oberflächen für ClawHub, native Apps, GitHub Releases, die Website
und private Dist-Tags. Befehle und Wiederherstellung finden Sie unter [Monatliche erweiterte stabile
Gateway-Veröffentlichung](/de/reference/RELEASING#monthly-gateway-extended-stable-publication).

## Runner

| Runner                          | Jobs                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, manuelle CI-Ausführung und Fallbacks für nicht kanonische Repositorys, das QA-Smoke-Aggregat, CodeQL-Sicherheits- und Qualitäts-Scans, Workflow-Plausibilitätsprüfung, Labeler, automatische Antworten, der eigenständige Docs-Workflow und der gesamte Install-Smoke-Workflow                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` außer QA-Smoke-CI, Plugin-/Channel-Vertrag-Shards, die meisten gebündelten bzw. weniger aufwendigen Linux-Node-Shards, `check-*`-Lanes außer `check-lint`, ausgewählte `check-additional-*`-Shards, `check-docs` und `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Beibehaltene aufwendige Linux-Node-Suites, grenz- bzw. erweiterungsintensive `check-additional-*`-Shards und `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | Automatische QA-Smoke-CI-Shards, `build-artifacts` in CI und Testbox sowie `check-lint` (ausreichend CPU-empfindlich, dass 8 vCPU mehr kosteten, als sie einsparten)                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` auf `openclaw/openclaw`; Forks verwenden ersatzweise `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` und `ios-build` auf `openclaw/openclaw`; Forks verwenden ersatzweise `macos-26`                                                                                                                                                                                               |

## Budget für Runner-Registrierungen

OpenClaws aktuelles GitHub-Kontingent für Runner-Registrierungen weist in `ghx api rate_limit` 10,000 Registrierungen selbst gehosteter
Runner pro 5 Minuten aus. Prüfen Sie `actions_runner_registration` vor jeder Anpassungsrunde erneut,
da GitHub dieses Kontingent ändern kann. Das Limit gilt gemeinsam für alle Blacksmith-Runner-Registrierungen in der
Organisation `openclaw`; das Hinzufügen einer weiteren Blacksmith-Installation erzeugt daher
kein neues Kontingent.

Behandeln Sie Blacksmith-Labels als knappe Ressource für die Steuerung von Lastspitzen. Jobs, die
nur routen, benachrichtigen, zusammenfassen, Shards auswählen oder kurze CodeQL-Scans ausführen, sollten
auf von GitHub gehosteten Runnern verbleiben, sofern für sie keine gemessenen Blacksmith-spezifischen
Anforderungen bestehen. Jede neue Blacksmith-Matrix, ein größerer `max-parallel`-Wert oder ein häufig ausgeführter
Workflow muss seine maximale Registrierungsanzahl im ungünstigsten Fall ausweisen und das organisationsweite
Ziel unter etwa 60% des aktuellen Kontingents halten. Beim derzeitigen Kontingent von 10,000 Registrierungen
entspricht dies einem Betriebsziel von 6,000 Registrierungen und lässt Reserven für
gleichzeitig ausgeführte Repositorys, Wiederholungsversuche und sich überschneidende Lastspitzen.

Der PR-Plan für geänderte Ziele reduziert die übliche Node-Testlastspitze von 14 Blacksmith-Registrierungen auf eine. PRs mit breitem Risiko behalten den kompakten Fallback mit 14 Registrierungen bei, sodass sich der ungünstigste Fall nicht verschärft.

Die CI des kanonischen Repositorys verwendet Blacksmith weiterhin als standardmäßigen Runner-Pfad für normale Push- und Pull-Request-Ausführungen. `workflow_dispatch` und Ausführungen nicht kanonischer Repositorys verwenden von GitHub gehostete Runner, normale kanonische Ausführungen prüfen derzeit jedoch weder den Zustand der Blacksmith-Warteschlange noch wechseln sie automatisch zu von GitHub gehosteten Labels, wenn Blacksmith nicht verfügbar ist.

## Oberflächen-Ratchets

Zwei ausschließlich verkleinerbare Budgets schützen die Konfigurationsoberfläche. Beide lassen die CI bei Wachstum fehlschlagen,
bis die Budgetdatei im selben PR bewusst aktualisiert wird, und beide verlangen eine
Absenkung des Ratchets, wenn Bereinigungen die tatsächliche Anzahl reduzieren.

- `config/env-var-count-budget.txt` begrenzt die Anzahl unterschiedlicher `OPENCLAW_*`-Namen
  im produktiven Quellcode unter `src/`, `packages/` und `extensions/`
  (Tests und QA Lab ausgenommen). Geprüft durch `node scripts/check-env-var-count.mjs`.
  Beim Entfernen von Umgebungsvariablen: Senken Sie die Zahl im selben PR. Das Hinzufügen einer Variable ist eine
  Entscheidung über die Konfigurationsoberfläche — begründen Sie sie im PR-Body.
- `docs/.generated/config-baseline.counts.json` begrenzt die Anzahl der `openclaw.json`-Schemaeinträge
  pro Art (Kern/Channel/Plugin). Geprüft durch
  `pnpm config:docs:check`; nach jeder Schemaänderung mit `pnpm config:docs:gen`
  neu generieren.

## Lokale Entsprechungen

```bash
pnpm changed:lanes                            # lokalen Klassifizierer für geänderte Lanes für origin/main...HEAD prüfen
pnpm check:changed                            # intelligentes lokales Prüf-Gate: geänderte Formatierung/Typprüfung/Lint-Prüfung/Schutzprüfungen nach Grenz-Lane
pnpm check                                    # schnelles lokales Gate: Produktions-tsgo + aufgeteilte Lint-Prüfung + parallele schnelle Schutzprüfungen
pnpm check:test-types
pnpm check:timed                              # dasselbe Gate mit Zeitmessungen pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # Vitest-Tests
pnpm test:changed                             # kostengünstige intelligente Vitest-Ziele für Änderungen
pnpm test:ui                                  # Unit-/Browser-Suite der Control UI
pnpm ui:i18n:check                            # generierte Gebietsschema-Parität der Control UI (Release-Gate)
pnpm native:i18n:baseline                     # quellseitig verwaltetes Inventar der nativen Extraktion aktualisieren
pnpm native:i18n:verify                       # Quellinventar + Sicherheit der Android-/Apple-Lokalisierung
pnpm native:i18n:check                        # strikte Parität übersetzter/plattformgenerierter Inhalte (Release-Gate)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # Dokumentformatierung + Lint-Prüfung + defekte Links
pnpm build                                    # dist erstellen, wenn CI-Artefakt-/Smoke-Prüfungen relevant sind
pnpm ios:build                                # iOS-App-Projekt generieren und erstellen
pnpm ci:timings                               # neuesten Push-CI-Lauf für origin/main zusammenfassen
pnpm ci:timings:recent                        # kürzlich erfolgreiche main-CI-Läufe vergleichen
node scripts/ci-run-timings.mjs <run-id>      # Gesamtdauer, Warteschlangenzeit und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --latest-main # Störungen durch Issues/Kommentare ignorieren und Push-CI für origin/main auswählen
node scripts/ci-run-timings.mjs --recent 10   # kürzlich erfolgreiche main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw-Performance

`OpenClaw Performance` ist der Workflow für die Produkt-/Laufzeitperformance. Er wird täglich auf `main` ausgeführt und kann manuell gestartet werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Beim manuellen Start wird normalerweise der Workflow-Ref einem Benchmark unterzogen. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung einem Benchmark zu unterziehen. Veröffentlichte Berichtspfade und Verweise auf die jeweils aktuelle Version werden nach dem getesteten Ref indiziert, und jeder `index.md` zeichnet den getesteten Ref/SHA, den Workflow-Ref/SHA, den Kova-Ref, das Profil, den Lane-Authentifizierungsmodus, das Modell, die Wiederholungsanzahl und die Szenariofilter auf.

Der Workflow installiert OCM aus einem fixierten Release und Kova aus `openclaw/Kova` mit der fixierten Eingabe `kova_ref` und führt anschließend drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien für eine lokal erstellte Laufzeit mit deterministischer, vorgetäuschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, im Gateway und bei Agent-Durchläufen. Wird nach Zeitplan oder bei einem manuellen Start mit `deep_profile=true` ausgeführt.
- `live-openai-candidate`: ein echter OpenAI-Agent-Durchlauf `openai/gpt-5.6-luna`, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist. Wird nach Zeitplan oder bei einem manuellen Start mit `live_openai_candidate=true` ausgeführt.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf außerdem quellnative OpenClaw-Prüfungen aus: Startzeit und Arbeitsspeicher des Gateways für Startfälle mit Standardeinstellungen, übersprungenem Kanal, internem Hook und fünfzig Plugins; RSS beim Import gebündelter Plugins, wiederholte Hallo-Schleifen mit einer simulierten OpenAI-Instanz `channel-chat-baseline`, CLI-Startbefehle für das gestartete Gateway und die Smoke-Performance-Prüfung des SQLite-Zustands. Wenn der zuvor veröffentlichte Mock-Provider-Quellbericht für den getesteten Ref verfügbar ist, vergleicht die Quellzusammenfassung die aktuellen RSS- und Heap-Werte mit dieser Baseline und markiert starke RSS-Anstiege als `watch`. Die Markdown-Zusammenfassung der Quellprüfung befindet sich unter `source/index.md` im Berichtspaket; die JSON-Rohdaten liegen daneben.

Jede Lane lädt ihr vollständiges GitHub-Artefakt hoch, einschließlich CPU-, Heap-, Trace- und komprimierter Diagnosepakete. Ein separater Veröffentlichungsjob lädt diese Artefakte herunter und validiert sie. Anschließend erstellt er ein kurzlebiges GitHub-App-Token von ClawSweeper, das ausschließlich auf Inhalte von `openclaw/clawgrit-reports` beschränkt ist, und übergibt es nur an den Git-Push-Schritt. Er committet `report.json`, `report.md`, `index.md`, Artefakte der Quellprüfung sowie Paketmetadaten/Prüfsummen unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; das vollständige Diagnosearchiv verbleibt im verknüpften Actions-Artefakt. Der Veröffentlichungsjob weist jede Berichtsdatei mit mehr als 50 MB zurück, bevor er einen Push versucht. Der aktuelle Verweis für den getesteten Ref ist `openclaw-performance/<tested-ref>/latest-<lane>.json`. Geplante Läufe und Starts mit `profile=release` schlagen fehl, wenn die Erstellung des App-Tokens oder die Veröffentlichung des Berichts fehlschlägt. Bei manuellen Starts außerhalb eines Releases bleibt die Veröffentlichung unverbindlich, und die GitHub-Artefakte werden beibehalten, wenn die Authentifizierung oder Veröffentlichung fehlschlägt. Die vorherige Quell-Baseline wird anonym aus dem öffentlichen Berichts-Repository abgerufen; ein erfolgreicher Abruf der Baseline belegt daher keine Authentifizierung des Veröffentlichungsjobs.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle übergeordnete Workflow für „vor dem Release alles ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, startet den manuellen Workflow `CI` mit diesem Ziel (einschließlich Android), startet `Plugin Prerelease` für ausschließlich releaserelevante Nachweise zu Plugins/Paketen/statischen Prüfungen/Docker, startet `OpenClaw Performance` für die Ziel-SHA und startet `OpenClaw Release Checks` für Installations-Smoke-Tests, Paketabnahme, betriebssystemübergreifende Paketprüfungen, QA-Lab-Parität, Matrix, Telegram sowie zugriffsgeschützte Lanes für Discord, WhatsApp und Slack (die unverbindliche Darstellung der Reifegrad-Scorecard kann über `run_maturity_scorecard` aktiviert werden). Stabile und vollständige Profile umfassen stets eine umfassende Live-/E2E-Abdeckung sowie Dauerprüfungen des Docker-Release-Pfads; beim Beta-Profil kann dies mit `run_release_soak=true` aktiviert werden. Der kanonische Telegram-E2E-Test für Pakete wird innerhalb der Paketabnahme ausgeführt, sodass für einen vollständigen Kandidaten kein doppelter Live-Poller gestartet wird. Übergeben Sie nach der Veröffentlichung `release_package_spec`, um das ausgelieferte npm-Paket über Release-Prüfungen, Paketabnahme, Docker, betriebssystemübergreifende Prüfungen und Telegram hinweg wiederzuverwenden, ohne es erneut zu erstellen. Verwenden Sie `npm_telegram_package_spec` nur für eine gezielte erneute Telegram-Ausführung mit dem veröffentlichten Paket. Die Live-Paket-Lane des Codex-Plugins verwendet standardmäßig denselben ausgewählten Zustand: Das veröffentlichte `release_package_spec=openclaw@<tag>` leitet `codex_plugin_spec=npm:@openclaw/codex@<tag>` ab, während SHA-/Artefaktläufe `extensions/codex` aus dem ausgewählten Ref packen. Setzen Sie `codex_plugin_spec` explizit für benutzerdefinierte Plugin-Quellen wie die Spezifikationen `npm:`, `npm-pack:` oder `git:`. Der Live-Agent-Nachweis sendet sichtbare Fortschrittsmeldungen, fährt mit zufälligen Arbeitsbereichslesevorgängen und dem Schreiben eines exakt vorgegebenen Artefakts fort und sendet anschließend eine Abschlussmeldung.

Unter [Vollständige Release-Validierung](/de/reference/full-release-validation) finden Sie die
Phasenmatrix, die exakten Namen der Workflow-Jobs, Profilunterschiede, Artefakte und
Optionen für gezielte erneute Ausführungen.

`OpenClaw Release Publish` ist der manuelle, verändernde Release-Workflow. Starten Sie
reguläre Beta- und Stable-Veröffentlichungen aus dem vertrauenswürdigen `main`, nachdem das Release-Tag
vorhanden ist und der npm-Preflight von OpenClaw erfolgreich war (der Preflight führt
unter anderem `pnpm plugins:sync:check` aus). Das Tag wählt weiterhin den exakten
Release-Commit aus, einschließlich eines Commits auf `release/YYYY.M.PATCH`; Tideclaw-Alpha-
Veröffentlichungen verwenden weiterhin den jeweils passenden Alpha-Branch. Er erfordert das gespeicherte
`preflight_run_id` sowie einen erfolgreichen Lauf von
`full_release_validation_run_id` und dessen exaktes
`full_release_validation_run_attempt`, startet `Plugin NPM Release` für alle
veröffentlichbaren Plugin-Pakete, startet `Plugin ClawHub Release` für dieselbe
Release-SHA und startet erst danach `OpenClaw NPM Release`. Eine Stable-Veröffentlichung
erfordert außerdem ein exaktes `windows_node_tag`; der Workflow überprüft das Windows-Quell-
Release und vergleicht dessen x64-/ARM64-Installationsprogramme mit der vom Kandidaten genehmigten
Eingabe `windows_node_installer_digests`, bevor untergeordnete Veröffentlichungsworkflows gestartet werden. Anschließend stuft er
dieselben fixierten Prüfsummen der Installationsprogramme sowie den exakten Vertrag für das Begleitartefakt
und die Prüfsummen hoch und überprüft sie, bevor der GitHub-Release-Entwurf veröffentlicht wird.
Gezielte Reparaturen ausschließlich an Plugins verwenden `plugin_publish_scope=selected` mit einer nicht leeren
Paketliste. Ausschließlich auf Plugins bezogene Läufe von `all-publishable` erfordern dieselben unveränderlichen npm-
Preflight- und vollständigen Release-Validierungsnachweise wie eine Core-Veröffentlichung.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Verwenden Sie für den Nachweis eines fixierten Commits auf einem schnell fortschreitenden Branch den Helfer anstelle von
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs zum Starten von GitHub-Workflows müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helfer pusht einen temporären Branch `release-ci/<sha>-...` mit einer vertrauenswürdigen Workflow-SHA `main`,
übergibt die angeforderte Ziel-SHA über die Workflow-Eingabe `ref`,
verwendet strikte Nachweise für das exakte Ziel erneut, wenn diese verfügbar sind, überprüft, dass bei jedem untergeordneten
Workflow `headSha` mit der vertrauenswürdigen Workflow-SHA übereinstimmt, und löscht den temporären
Branch nach Abschluss des Laufs. Übergeben Sie `-f reuse_evidence=false`, um eine neue
Validierung zu erzwingen. Die übergeordnete Prüfung schlägt außerdem fehl, wenn ein untergeordneter Workflow mit einer
anderen Workflow-SHA ausgeführt wurde.

`release_profile` steuert die Breite der Live-/Provider-Abdeckung, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite unverbindliche Provider-/Medienmatrix wünschen. Stable- und vollständige
Release-Prüfungen führen stets die umfassenden Live-/E2E- und Docker-Release-Pfad-Dauerprüfungen aus;
beim Beta-Profil kann dies mit `run_release_soak=true` aktiviert werden.

- `beta` behält die schnellsten releasekritischen OpenAI-/Core-Lanes bei.
- `stable` fügt die stabile Provider-/Backend-Gruppe hinzu.
- `full` führt die breite unverbindliche Provider-/Medienmatrix aus.

Der übergeordnete Workflow zeichnet die IDs der gestarteten untergeordneten Läufe auf, und der abschließende Job `Verify full validation` überprüft erneut die aktuellen Ergebnisse der untergeordneten Läufe und fügt für jeden untergeordneten Lauf Tabellen der langsamsten Jobs hinzu. Wenn ein untergeordneter Workflow erneut ausgeführt wird und anschließend erfolgreich ist, führen Sie nur den übergeordneten Prüfjob erneut aus, um das Gesamtergebnis und die Zeitübersicht zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` den Wert `rerun_group`. Verwenden Sie `all` für einen Release Candidate, `ci` nur für den normalen vollständigen CI-Unterprozess, `plugin-prerelease` nur für den Plugin-Prerelease-Unterprozess, `performance` nur für den OpenClaw-Performance-Unterprozess, `release-checks` für jeden Release-Unterprozess oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im übergeordneten Workflow. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einer gezielten Korrektur begrenzt. Kombinieren Sie für eine einzelne fehlgeschlagene Cross-OS-Lane `rerun_group=cross-os` mit `cross_os_suite_filter`, beispielsweise `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Zusammenfassungen von Paket-Upgrades enthalten Zeitangaben für jede Phase. Ausgewählte Matrix- und Telegram-QA-Lanes blockieren die normale Release-Validierung, ebenso das Abdeckungsgate für das Tool des Core-Runtime-Paars. QA-Parität, Runtime-Parität und die mit Gates versehenen Live-Lanes für Discord, WhatsApp und Slack haben Hinweischarakter.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Referenz, um die ausgewählte Referenz einmalig in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt anschließend an die Cross-OS-Prüfungen und die Paketabnahme sowie bei Ausführung der Soak-Abdeckung an den Docker-Workflow für den Live-/E2E-Release-Pfad. Dadurch bleiben die Paketbytes über alle Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Unterjobs erneut gepackt werden. Für die Live-Lane des Codex-npm-Plugins übergeben die Release-Prüfungen entweder eine passende veröffentlichte Plugin-Spezifikation, die aus `release_package_spec` abgeleitet wurde, den vom Operator angegebenen Wert `codex_plugin_spec` oder lassen die Eingabe leer, damit das Docker-Skript das Codex-Plugin des ausgewählten Checkouts packt.

Doppelte `Full Release Validation`-Ausführungen für `ref=main` und `rerun_group=all`
ersetzen den älteren übergeordneten Workflow. Der übergeordnete Monitor bricht jeden bereits
gestarteten untergeordneten Workflow ab, wenn der übergeordnete Workflow abgebrochen wird, sodass eine neuere Validierung von main
nicht hinter einer veralteten zweistündigen Release-Prüfung warten muss. Validierungen von Release-Branches/-Tags
und gezielte Gruppen für erneute Ausführungen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Der untergeordnete Live-/E2E-Release-Workflow behält die breite native `pnpm test:live`-Abdeckung bei, führt sie jedoch über `scripts/test-live-shard.mjs` als benannte Shards statt als einzelnen seriellen Job aus:

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
- getrennte Audio-/Video-Shards für Medien und nach Provider gefilterte Musik-Shards

Dadurch bleibt dieselbe Datei-Abdeckung erhalten, während sich Fehler langsamer Live-Provider leichter erneut ausführen und diagnostizieren lassen. Die aggregierten Shard-Namen `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige erneute Ausführungen gültig.

Die nativen Live-Medien-Shards werden in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` ausgeführt, das vom Workflow `Live Media Runner Image` erstellt wird. Dieses Image installiert `ffmpeg` und `ffprobe` vorab; Medienjobs prüfen vor der Einrichtung lediglich die Binärdateien. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern – Container-Jobs eignen sich nicht zum Starten verschachtelter Docker-Tests.

Docker-gestützte Shards für Live-Modelle/-Backends verwenden pro ausgewähltem Commit ein separates gemeinsam genutztes `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>`-Image. Der Live-Release-Workflow erstellt und veröffentlicht dieses Image einmal; anschließend werden die Shards für das Docker-Live-Modell, das nach Providern aufgeteilte Gateway, das CLI-Backend, die ACP-Bindung und den Codex-Harness mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausgeführt. Gateway-Docker-Shards verfügen über explizite `timeout`-Grenzwerte auf Skriptebene, die unterhalb des Workflow-Job-Timeouts liegen, damit ein hängender Container oder Bereinigungspfad schnell fehlschlägt, statt das gesamte Zeitbudget der Release-Prüfung zu verbrauchen. Wenn diese Shards das vollständige Quell-Docker-Ziel unabhängig voneinander neu erstellen, ist die Release-Ausführung falsch konfiguriert und verschwendet durch doppelte Image-Builds Laufzeit.

## Paketabnahme

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Dies unterscheidet sich von der normalen CI: Die normale CI validiert den Quellbaum, während die Paketabnahme ein einzelnes Tarball mit demselben Docker-E2E-Harness validiert, den Benutzer nach der Installation oder Aktualisierung ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `package_integrity` lädt das Artefakt `package-under-test` herunter und erzwingt mit `scripts/check-openclaw-package-tarball.mjs` den Vertrag für öffentliche Paket-Tarballs.
3. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit dem aufgelösten SHA der Paketquelle (mit Rückgriff auf `workflow_ref`) und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert den Tarball-Inhalt, bereitet bei Bedarf Docker-Images für den Paket-Digest vor und führt die ausgewählten Docker-Lanes mit diesem Paket aus, anstatt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsam genutzten Images einmal vor und verteilt diese Lanes anschließend als parallele gezielte Docker-Jobs mit eindeutigen Artefakten.
4. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Der Job wird ausgeführt, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
5. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, Integritätsprüfung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen ist. Die Eingabe `advisory` stuft Akzeptanzfehler für beratende Aufrufer zu Warnungen herab.

### Kandidatenquellen

- `source=npm` akzeptiert ausschließlich `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Releaseversion wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Extended-Stable-, Vorab- oder Stable-Releases.
- `source=ref` packt einen vertrauenswürdigen Branch, Tag oder vollständigen Commit-SHA aus `package_ref`. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, ob der ausgewählte Commit über den Branch-Verlauf des Repositorys oder einen Release-Tag erreichbar ist, installiert Abhängigkeiten in einem losgelösten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt einen öffentlichen HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich. Dieser Pfad lehnt URL-Anmeldedaten, nicht standardmäßige HTTPS-Ports, private/interne/für spezielle Zwecke reservierte Hostnamen oder aufgelöste IP-Adressen sowie Weiterleitungen außerhalb derselben öffentlichen Sicherheitsrichtlinie ab.
- `source=trusted-url` lädt einen HTTPS-`.tgz` anhand einer benannten Richtlinie für vertrauenswürdige Quellen in `.github/package-trusted-sources.json` herunter; `package_sha256` und `trusted_source_id` sind erforderlich. Verwenden Sie dies nur für von Maintainern verwaltete Enterprise-Spiegelserver oder private Paket-Repositorys, die konfigurierte Hosts, Ports, Pfadpräfixe, Weiterleitungs-Hosts oder die Auflösung in privaten Netzwerken benötigen. Wenn die Richtlinie Bearer-Authentifizierung deklariert, verwendet der Workflow das festgelegte Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; in URLs eingebettete Anmeldedaten werden weiterhin abgelehnt.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte jedoch für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref`. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — der Satz `package` mit Live-Abdeckung für `plugins` anstelle von `plugins-offline`, zuzüglich `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Abschnitte des Docker-Releasepfads mit OpenWebUI
- `custom` — exakt `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` erneut; der Pfad für die veröffentlichte npm-Spezifikation bleibt für eigenständige Dispatches erhalten.

Die dedizierte Richtlinie zum Testen von Updates und Plugins, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Standardwerte und Fehlersuche,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` und `telegram_mode=mock-openai` auf. Dadurch werden Paketmigration, Update, Live-Installation von ClawHub-Skills, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur der Installation konfigurierter Plugins, Offline-Plugin-, Plugin-Update- und Telegram-Nachweise mit demselben aufgelösten Paket-Tarball durchgeführt. Setzen Sie `release_package_spec` bei Full Release Validation oder OpenClaw Release Checks nach der Veröffentlichung einer Beta, um dieselbe Matrix mit dem ausgelieferten npm-Paket ohne Neuerstellung auszuführen; setzen Sie `package_acceptance_package_spec` nur, wenn Package Acceptance ein anderes Paket als der übrige Teil der Release-Validierung benötigt. Betriebssystemübergreifende Release-Prüfungen decken weiterhin betriebssystemspezifisches Onboarding-, Installationsprogramm- und Plattformverhalten ab; die Produktvalidierung für Pakete und Updates sollte mit Package Acceptance beginnen.

Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paket-Baseline im blockierenden Releasepfad. In Package Acceptance ist der aufgelöste Tarball `package-under-test` stets der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um die vier neuesten stabilen npm-Releases sowie angeheftete Grenz-Releases für Plugin-Kompatibilität und problemorientierte Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Protokollpfade und veraltete Legacy-Wurzeln für Plugin-Abhängigkeiten abzudecken. Die Auswahl überlebender veröffentlichter Upgrades mit mehreren Baselines wird nach Baseline auf separate gezielte Docker-Runner-Jobs verteilt. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23`-Baselines und `plugin-deps-cleanup`-Szenarien, wenn eine umfassende Bereinigung veröffentlichter Updates geprüft werden soll und nicht die normale Breite der Full Release CI. Lokale aggregierte Läufe können mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` exakte Paketspezifikationen übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` eine einzelne Lane beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Start des Gateway. Die frischen Windows-Lanes für Paket und Installationsprogramm prüfen außerdem, ob ein installiertes Paket eine Browsersteuerungsüberschreibung aus einem unverarbeiteten absoluten Windows-Pfad importieren kann. Der betriebssystemübergreifende OpenAI-Smoke-Test für Agent-Turns verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.6-luna`, sodass der Installations- und Gateway-Nachweis die kostengünstigere GPT-5.6-Teststufe nutzt.

### Legacy-Kompatibilitätszeiträume

Package Acceptance verfügt über begrenzte Legacy-Kompatibilitätszeiträume für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, darunter `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball fehlen;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus dem vom Tarball abgeleiteten simulierten Git-Fixture entfernen und fehlende persistierte `update.channel` protokollieren;
- Plugin-Smoke-Tests dürfen Legacy-Speicherorte für Installationsdatensätze lesen oder eine fehlende Persistenz des Marketplace-Installationsdatensatzes akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, wobei weiterhin erforderlich ist, dass der Installationsdatensatz und das Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor bereits ausgelieferten lokalen Stempeldateien für Build-Metadaten warnen, und Pakete bis einschließlich `2026.5.20` dürfen warnen, statt fehlzuschlagen, wenn `npm-shrinkwrap.json` fehlt. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen führen dann zu einem Fehlschlag, statt eine Warnung auszugeben oder übersprungen zu werden.

### Beispiele

```bash
# Das aktuelle Beta-Paket mit Abdeckung auf Produktebene validieren.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Das veröffentlichte Extended-Stable-Paket mit Paketabdeckung validieren.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Einen Release-Branch mit dem aktuellen Testsystem paketieren und validieren.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Eine Tarball-URL validieren. SHA-256 ist für source=url obligatorisch.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Einen Tarball aus einer benannten vertrauenswürdigen Richtlinie für private Spiegelserver validieren.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Einen von einem anderen Actions-Lauf hochgeladenen Tarball wiederverwenden.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Beginnen Sie bei der Fehlerbehebung für einen fehlgeschlagenen Package-Acceptance-Lauf mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Protokolle, Phasenzeitmessungen und Befehle für erneute Läufe. Führen Sie vorzugsweise das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung zu wiederholen.

## Installations-Smoke-Test

Der Workflow `Install Smoke` wird nicht mehr bei Pull Requests oder `main`-Pushes ausgeführt. Sein nächtlicher/manueller Wrapper und die Release-Validierung rufen beide den schreibgeschützten Kern `install-smoke-reusable.yml` auf, und jeder Lauf durchläuft den vollständigen Installations-Smoke-Pfad auf von GitHub gehosteten Runnern:

- Das Smoke-Image des Root-Dockerfiles wird einmal pro Ziel-SHA erstellt, in einem unveränderlichen Artefakt an die Workflow-Revision und den Erstellungsversuch gebunden und anschließend vom CLI-Smoke-Test, vom CLI-Smoke-Test für das Löschen des gemeinsamen Arbeitsbereichs durch Agents, vom Container-Gateway-Netzwerk-E2E sowie vom Build-Argument-Smoke-Test des gebündelten Plugins `matrix` geladen. Der Plugin-Smoke-Test überprüft die Spiegelung der Installation von Laufzeitabhängigkeiten und dass das Plugin ohne Diagnosemeldungen zum Verlassen des Einstiegspunkts geladen wird.
- Die QR-Paketinstallation und die Docker-Smoke-Tests für Installer/Updates (einschließlich Rocky-Linux-Installer-Lanes und einer Update-Lane gegen eine konfigurierbare npm-Baseline `update_baseline_version`) werden als separate Jobs ausgeführt, damit Installer-Arbeiten nicht hinter den Smoke-Tests des Root-Images warten müssen.

Der langsame Smoke-Test für den Image-Provider bei globaler Bun-Installation wird separat durch `run_bun_global_install_smoke` gesteuert. Er wird nach dem nächtlichen Zeitplan ausgeführt, ist standardmäßig für Workflow-Aufrufe aus Release-Prüfungen aktiviert und kann bei manuellen `Install Smoke`-Ausführungen zugeschaltet werden. Die normale PR-CI führt für Node-relevante Änderungen weiterhin die schnelle Bun-Launcher-Regressions-Lane aus. QR- und Installer-Docker-Tests behalten ihre eigenen installationsorientierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` erstellt ein gemeinsames Live-Test-Image vorab, paketiert OpenClaw einmal als npm-Tarball und erstellt zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen schlanken Node-/Git-Runner für Installer-, Update- und Plugin-Abhängigkeits-Lanes;
- ein funktionsfähiges Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Die Definitionen der Docker-Lanes befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt die Lanes anschließend mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standardwert | Zweck                                                                                       |
| -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Anzahl der Slots im Haupt-Pool für normale Lanes.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Anzahl der Slots im Provider-sensitiven Tail-Pool.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Obergrenze für gleichzeitig ausgeführte Live-Lanes, damit Provider nicht drosseln.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Obergrenze für gleichzeitig ausgeführte npm-Installations-Lanes.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Obergrenze für gleichzeitig ausgeführte Lanes mit mehreren Diensten.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Verzögerung zwischen Lane-Starts zur Vermeidung von Erstellungsstürmen im Docker-Daemon; setzen Sie `0` für keine Verzögerung.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Ersatz-Zeitüberschreitung pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Obergrenzen.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nicht gesetzt   | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | nicht gesetzt   | Kommagetrennte Liste exakter Lanes; überspringt den Bereinigungs-Smoke-Test, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwergewichtiger als ihre effektive Obergrenze ist, kann dennoch aus einem leeren Pool gestartet werden und wird dann allein ausgeführt, bis sie Kapazität freigibt. Das lokale Aggregat prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Zeitmessungen für die Sortierung nach längster Laufzeit zuerst und beendet standardmäßig nach dem ersten Fehler die Planung neuer gepoolter Lanes.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welches Paket, welche Image-Art, welches Live-Image, welche Lane und welche Anmeldedatenabdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Er paketiert OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter und validiert anschließend den Tarball-Inhalt. Der Standardpfad `no-push-artifact` erstellt über den Docker-Layer-Cache von Blacksmith mit dem Paket-Digest markierte schlanke/funktionsfähige Images, paketiert die exakten Image-Bytes in ein unveränderliches Workflow-Artefakt und lässt jeden Verbraucher dieses Artefakt überprüfen und laden. `existing-only` erfordert stattdessen explizite GHCR-Referenzen `docker_e2e_bare_image`/`docker_e2e_functional_image` und erstellt oder überträgt niemals Images. Diese Registry-Abrufe verwenden pro Versuch eine begrenzte Zeitüberschreitung von 180 Sekunden, damit ein blockierter Stream schnell erneut versucht wird, statt den Großteil des kritischen Pfads der CI-Pipeline zu beanspruchen. Nach erfolgreicher geplanter Validierung übergibt `openclaw-scheduled-live-checks.yml` das unveränderliche Manifest des getesteten Images an den separaten schreibenden Paket-Publisher; schreibgeschützte Release- und Vorabversions-Aufrufer durchlaufen diesen Writer niemals.

### Abschnitte des Release-Pfads

Die Docker-Abdeckung des Release-Pfads führt mit `OPENCLAW_SKIP_DOCKER_BUILD=1` kleinere, aufgeteilte Jobs aus, sodass jeder Abschnitt nur die benötigte artefaktgestützte Image-Art überprüft und lädt (oder sie bei expliziter Wiederverwendung von `existing-only` abruft) und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Die aktuellen Docker-Abschnitte für Releases sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` bis `plugins-runtime-install-h` und `openwebui`. `package-update-openai` enthält die Live-Lane für das Codex-Plugin-Paket. Diese installiert das OpenClaw-Kandidatenpaket, installiert das Codex-Plugin aus `codex_plugin_spec` oder einem Tarball derselben Referenz mit ausdrücklicher Genehmigung zur Installation der Codex CLI, führt die Vorabprüfung der Codex CLI und Agent-Durchläufe in derselben Sitzung aus und führt anschließend einen Durchlauf ohne Wiederholungsversuch mit mittlerem Denkaufwand aus, der Fortschrittsmeldungen sendet, zufällig ausgewählte Arbeitsbereichseingaben liest, deren exaktes Artefakt schreibt und eine Abschlussmeldung sendet. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Aliasse für Plugin/Laufzeit. Der Lane-Alias `install-e2e` bleibt der aggregierte Alias für manuelle erneute Läufe beider Provider-Installer-Lanes.

OpenWebUI wird als eigenständiger Abschnitt `openwebui` auf einem dedizierten Blacksmith-Runner mit großer Festplatte ausgeführt, sobald Stable- oder vollständige Release-Pfad-Abdeckung ihn anfordert, selbst wenn der wiederverwendbare Workflow unterstützte Jobs an von GitHub gehostete Runner weiterleitet. Durch die Trennung des Abrufs des externen Images wird verhindert, dass das große Image mit den gemeinsamen Paket- und Plugin-Images in `plugins-runtime-services` konkurriert; aggregierte Legacy-Abschnitte für Plugin/Laufzeit enthalten OpenWebUI weiterhin für kompatible manuelle erneute Läufe. Update-Lanes für gebündelte Kanäle wiederholen den Versuch bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Abschnitt lädt `.artifacts/docker-tests/` mit Lane-Protokollen, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeitmessungen, dem Scheduler-Plan als JSON, Tabellen langsamer Lanes und Befehlen für erneute Läufe einzelner Lanes hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen für diesen Lauf vorbereitete Images statt gegen die Abschnittsjobs aus. Dadurch bleibt die Fehlerbehebung für fehlgeschlagene Lanes auf einen gezielten Docker-Job begrenzt; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, erstellt der gezielte Job das Live-Test-Image für diesen erneuten Lauf lokal. Das Hilfsprogramm für erneute Läufe validiert die exakte ausgewählte Ziel-SHA des Fehlerartefakts, und die manuelle Ausführung paketiert diese Referenz erneut, da das interne Pakettupel des wiederverwendbaren Workflows nicht Teil des Schemas `workflow_dispatch` ist. Generierte Befehle enthalten vorbereitete Image-Eingaben und `shared_image_policy=existing-only` nur, wenn diese Eingaben auf GHCR basieren; runner-lokale Artefakt-Tags werden ausgelassen, damit ein neuer Runner sie neu erstellt. Eine explizite Zielüberschreibung verwirft wiederhergestellte GHCR-Image-Referenzen, sofern das Artefakt nicht nachweist, dass sie mit der Überschreibung übereinstimmen. Aus Artefakten generierte Referenzen auf Workflow-Definitionen werden ebenfalls ausgelassen, da temporäre Branches für vollständige Releases gelöscht werden; die Ausführung verwendet den Standard-Branch des Repositorys, sofern der Operator ihn nicht ausdrücklich überschreibt.

```bash
pnpm test:docker:rerun <run-id>      # Docker-Artefakte herunterladen und kombinierte sowie Lane-spezifische Befehle für gezielte erneute Läufe ausgeben
pnpm test:docker:timings <summary>   # Zusammenfassungen langsamer Lanes und des kritischen Pfads der Phasen
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus und ruft nach erfolgreichem Abschluss den expliziten Publisher für die exakt getesteten Image-Artefakte auf.

## Plugin-Vorabversion

`Plugin Prerelease` bietet eine aufwendigere Produkt-/Paketabdeckung und ist daher ein separater Workflow, der durch `Full Release Validation` oder explizit durch einen Operator ausgelöst wird. Bei normalen Pull Requests, `main`-Pushes und eigenständigen manuellen CI-Auslösungen bleibt diese Suite deaktiviert. Er verteilt die Tests gebündelter Plugins auf acht Extension-Worker; diese Extension-Shard-Jobs führen jeweils bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap, damit importintensive Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der ausschließlich für Releases vorgesehene Docker-Pre-Release-Pfad (aktiviert durch die Eingabe `full_release_validation`) fasst gezielte Docker-Lanes in Vierergruppen zusammen, um nicht Dutzende Runner für Jobs mit einer Dauer von ein bis drei Minuten zu reservieren. Der Workflow lädt außerdem ein informatives `plugin-inspector-advisory`-Artefakt aus `@openclaw/plugin-inspector` hoch; Inspector-Ergebnisse dienen als Eingabe für die Triage und ändern nichts am blockierenden Plugin-Pre-Release-Gate.

## QA Lab

QA Lab verfügt über eigene CI-Lanes außerhalb des zentralen intelligent eingegrenzten Workflows. Agentische Parität ist in die umfassenden QA- und Release-Harnesse eingebettet und kein eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn die Parität zusammen mit einem umfassenden Validierungslauf ausgeführt werden soll.

- Der Workflow `QA-Lab - All Lanes` wird jede Nacht auf `main` sowie bei manueller Auslösung ausgeführt; er fächert sich in Mock-Paritätsjobs sowie Live-Jobs für Matrix, Telegram, Discord, WhatsApp und Slack auf. Live-Jobs verwenden die Umgebung `qa-live-shared`; Telegram, Discord, WhatsApp und Slack verwenden Convex-Leases, während Matrix kurzlebige lokale Anmeldedaten bereitstellt.

Release-Prüfungen führen Live-Transport-Lanes für Matrix und Telegram mit dem deterministischen Mock-Provider und für Mocks qualifizierten Modellen (`mock-openai/gpt-5.6-luna` und `mock-openai/gpt-5.6-luna-alt`) aus, sodass der Channel-Vertrag von der Latenz des Live-Modells und dem normalen Start des Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, da die QA-Parität das Speicherverhalten separat abdeckt; die Provider-Konnektivität wird durch die separaten Suiten für Live-Modelle, native Provider und Docker-Provider abgedeckt.

Geplante und Release-bezogene Matrix-Gates verwenden den gemeinsamen QA-Lab-Suite-Host und den Live-Adapter mit den Release-Szenarien. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`; manuelle `all`-Auslösungen fächern die Profile `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli` auf, damit der Nachweis mit 93 Szenarien innerhalb der Zeitlimits pro Job bleibt. Gezielte manuelle Auslösungen wählen `fast`, `release` oder `transport` in einem Job aus.

`OpenClaw Release Checks` führt außerdem vor der Release-Freigabe die releasekritischen QA-Lab-Lanes aus; sein QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob herunter, der den abschließenden Paritätsvergleich durchführt.

Befolgen Sie bei normalen PRs die Nachweise der eingegrenzten CI/Prüfungen, anstatt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der Workflow `CodeQL` ist bewusst als eng gefasster Sicherheits-Scanner für den ersten Durchlauf konzipiert, nicht als vollständiger Scan des Repositorys. Tägliche und manuelle Läufe, `main`-Pushes sowie Schutzläufe für nicht als Entwurf markierte Pull Requests scannen den Code von Actions-Workflows sowie die JavaScript-/TypeScript-Bereiche mit dem höchsten Risiko. Dabei werden Sicherheitsabfragen mit hoher Konfidenz verwendet und auf hohe/kritische `security-severity` gefiltert.

Der Schutzlauf für Pull Requests bleibt schlank: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` oder in prozessverantwortlichen Laufzeitpfaden gebündelter Plugins und führt dieselbe Sicherheitsmatrix mit hoher Konfidenz wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben von den PR-Standardläufen ausgeschlossen.

### Sicherheitskategorien

| Kategorie                                         | Bereich                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Baseline für Authentifizierung, Secrets, Sandbox, Cron und Gateway                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge der zentralen Channels sowie Laufzeit des Channel-Plugins, Gateway, Plugin SDK, Secrets und Audit-Kontaktpunkte |
| `/codeql-security-high/network-ssrf-boundary`     | Zentrale Bereiche für SSRF, IP-Parsing, Netzwerkschutz, Web-Fetch und SSRF-Richtlinien des Plugin SDK                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen zur Prozessausführung, ausgehende Zustellung und Gates für die Tool-Ausführung durch Agenten               |
| `/codeql-security-high/process-exec-boundary`     | Lokale Shell, Hilfsfunktionen zum Starten von Prozessen, subprocessverantwortliche Laufzeiten gebündelter Plugins und Workflow-Skript-Glue |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensbereiche für Plugin-Installation, Loader, Manifest, Registry, Paketmanagerinstallation, Laden von Quellen und Paketverträge des Plugin SDK |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Erstellt die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Plausibilitätsprüfung akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Erstellt die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse von Abhängigkeits-Builds aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardläufe, da der macOS-Build selbst bei einem sauberen Lauf die Laufzeit dominiert.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt ausschließlich JavaScript-/TypeScript-Qualitätsabfragen ohne Sicherheitsbezug und mit Fehlerschweregrad auf eng gefassten, hochwertigen Bereichen auf von GitHub gehosteten Linux-Runnern aus, damit Qualitätsscans kein Budget für die Registrierung von Blacksmith-Runnern verbrauchen. Sein Schutzlauf für Pull Requests ist bewusst kleiner als das geplante Profil: Nicht als Entwurf markierte PRs führen nur die passenden Shards für die von ihnen betroffenen Bereiche aus, und zwar aus dreizehn für PRs routbaren Shards — `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` und `session-diagnostics-boundary`. `ui-control-plane` und `web-media-runtime-boundary` bleiben von PR-Läufen ausgeschlossen. Änderungen an der CodeQL-Konfiguration und am Qualitäts-Workflow führen den vollständigen PR-Shard-Satz aus (die Shard-Schlüssel der Netzwerklaufzeit basieren auf den eigenen CodeQL-Konfigurationsdateien und den netzwerkverantwortlichen Quellpfaden).

Die manuelle Auslösung akzeptiert:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die eng gefassten Profile dienen als Lern- und Iterationsschnittstellen, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                                | Bereich                                                                                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Code für die Sicherheitsgrenzen von Authentifizierung, Secrets, Sandbox, Cron und Gateway                                                                          |
| `/codeql-critical-quality/config-boundary`              | Verträge für Konfigurationsschema, Migration, Normalisierung und Ein-/Ausgabe                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Verträge für Servermethoden                                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge der zentralen Channels und gebündelten Channel-Plugins                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Laufzeitverträge für Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie die ACP-Steuerungsebene                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen zur Prozessüberwachung sowie Verträge für ausgehende Zustellung                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Speicher-Host-SDK, Speicherlaufzeit-Fassaden, Speicher-Aliasse des Plugin SDK, Aktivierungs-Glue der Speicherlaufzeit und Speicher-Doctor-Befehle                   |
| `/codeql-critical-quality/network-runtime-boundary`     | Netzwerkrichtlinienpaket, Laufzeit für Raw Sockets und Proxy-Erfassung, SSH-Tunnel, Gateway-Sperre, JSONL-Socket und Push-Transportbereiche                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungs-Warteschlangen, Hilfsfunktionen für Bindung/Zustellung ausgehender Sitzungen, Bereiche für Diagnoseereignisse/Protokollpakete und CLI-Verträge des Sitzungs-Doctors |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch des Plugin SDK, Hilfsfunktionen für Antwort-Payloads/Chunking/Laufzeit, Channel-Antwortoptionen, Zustellungswarteschlangen und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Authentifizierung und -Erkennung, Registrierung der Provider-Laufzeit, Provider-Standardwerte/-Kataloge sowie Registries für Web/Suche/Abruf/Einbettungen |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap der Control UI, lokale Persistenz, Gateway-Steuerungsabläufe und Laufzeitverträge der Aufgabensteuerungsebene                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Laufzeitverträge für zentralen Web-Abruf/Suche, Medien-Ein-/Ausgabe, Medienverständnis, Bilderzeugung und Medienerzeugung                                             |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Einstiegspunkte des Plugin SDK                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketbezogener Quellcode des Plugin SDK und Hilfsfunktionen für Plugin-Paketverträge                                                               |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsergebnisse geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verschleiern. Eine CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte erst dann wieder als eingegrenzte oder geshardete Folgearbeit hinzugefügt werden, wenn die eng gefassten Profile eine stabile Laufzeit und ein stabiles Signal aufweisen.

## Wartungs-Workflows

### Dokumentations-Agent

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungs-Lane, die bestehende Dokumentation mit kürzlich übernommenen Änderungen synchron hält. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf für einen Push eines Nicht-Bots auf `main` kann ihn auslösen, und eine manuelle Auslösung kann ihn direkt starten. Durch Workflow-Läufe ausgelöste Aufrufe werden übersprungen, wenn `main` bereits fortgeschritten ist oder innerhalb der letzten Stunde ein anderer nicht übersprungener Lauf des Dokumentations-Agenten erstellt wurde. Wenn er ausgeführt wird, prüft er den Commit-Bereich vom Quell-SHA des vorherigen nicht übersprungenen Dokumentations-Agent-Laufs bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit der letzten Dokumentationsprüfung auf main angesammelten Änderungen abdecken kann.

### Testleistungs-Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf nach einem Nicht-Bot-Push auf `main` kann ihn auslösen, er wird jedoch übersprungen, wenn an diesem UTC-Tag bereits ein anderer durch einen Workflow-Lauf ausgelöster Aufruf ausgeführt wurde oder noch läuft. Eine manuelle Auslösung umgeht diese tägliche Aktivitätssperre. Die Spur erstellt einen gruppierten Vitest-Performancebericht für die vollständige Testsuite, erlaubt Codex ausschließlich kleine, die Testabdeckung erhaltende Performancekorrekturen an Tests statt umfassender Refactorings, führt anschließend den Bericht für die vollständige Testsuite erneut aus und verwirft Änderungen, die die Anzahl der bestandenen Tests im Ausgangsstand verringern. Der gruppierte Bericht erfasst für jede Konfiguration die Gesamtlaufzeit und den maximalen RSS unter Linux und macOS, sodass der Vorher-Nachher-Vergleich neben den Laufzeitänderungen auch Änderungen des Testspeicherverbrauchs sichtbar macht. Wenn im Ausgangsstand Tests fehlschlagen, darf Codex nur offensichtliche Fehler beheben, und der nach dem Agentenlauf erstellte Bericht für die vollständige Testsuite muss erfolgreich sein, bevor etwas committet wird. Wenn `main` vor dem Bot-Push fortschreitet, führt die Spur einen Rebase des validierten Patches durch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; veraltete Patches mit Konflikten werden übersprungen. Sie verwendet von GitHub gehostetes Ubuntu, damit die Codex-Action dieselbe Sicherheitsstrategie mit entzogenem sudo wie der Dokumentations-Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow zur Bereinigung von Duplikaten nach dem Landing. Standardmäßig führt er einen Probelauf aus und schließt ausdrücklich aufgeführte PRs nur, wenn `apply=true`. Bevor er GitHub verändert, prüft er, ob der gelandete PR gemergt wurde und ob jedes Duplikat entweder auf dasselbe referenzierte Issue verweist oder überlappende geänderte Codeabschnitte enthält.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Prüf-Gates und Routing von Änderungen

### Ratsche für die Anzahl der Konfigurations-Ausgangswerte

`pnpm config:docs:check` weist undokumentiertes Wachstum der Konfigurationsoberfläche sowie beschädigte oder veraltete Anzahl-Snapshots zurück. Wenn eine geprüfte Produktänderung absichtlich Schemapfade hinzufügt, führen Sie `pnpm config:docs:gen` aus, prüfen Sie die Änderungen der Anzahlen für Core, Kanäle und Plugins sowie die generierten SHA-256-Dateien und committen Sie die bewusste Anhebung des Ausgangswerts zusammen mit Schema, Hilfe, Labels, Migration und Tests. Bearbeiten Sie die Anzahl-Datei nicht manuell, um die Ratsche zu umgehen.

Konfigurationsautoren müssen neue Blätter außerdem für die Einstellungen einer Stufe zuordnen. Fügen Sie dem Blatt `advanced: false` oder
`advanced: true` hinzu oder platzieren Sie den Schlüssel unter einem Vorfahren, dessen Stufe
alle Nachfahren übernehmen sollen. Nicht klassifizierte Wurzeln lassen den Qualitäts-
test des Schemas mit kopierbaren Vorlagen fehlschlagen; Pfade ohne Vorfahren werden standardmäßig als erweitert eingestuft.
Der kuratierte Snapshot gemeinsamer Blätter macht beabsichtigte Stufenänderungen bei der
Überprüfung sichtbar.

Die lokale Logik für geänderte Spuren befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Prüf-Gate ist bei Architekturgrenzen strenger als der umfassende Plattformumfang der CI:

- Änderungen am Core-Produktionscode führen die Typprüfung für Core-Produktion und Core-Tests sowie Core-Linting/-Schutzprüfungen aus;
- reine Änderungen an Core-Tests führen nur die Typprüfung für Core-Tests sowie Core-Linting aus;
- Änderungen am Produktionscode von Erweiterungen führen die Typprüfung für Erweiterungsproduktion und Erweiterungstests sowie Erweiterungs-Linting aus;
- reine Änderungen an Erweiterungstests führen die Typprüfung für Erweiterungstests sowie Erweiterungs-Linting aus;
- Änderungen am öffentlichen Plugin-SDK oder an Plugin-Verträgen erweitern den Umfang auf die Typprüfung von Erweiterungen, da Erweiterungen von diesen Core-Verträgen abhängen (Vitest-Durchläufe für Erweiterungen bleiben ausdrücklich auszuführende Testarbeit);
- reine Versionsanhebungen von Release-Metadaten führen gezielte Prüfungen von Versionen, Konfigurationen und Root-Abhängigkeiten aus;
- unbekannte Änderungen an Root oder Konfiguration werden sicherheitshalber an alle Prüfspuren weitergeleitet.

Das lokale Routing geänderter Tests befindet sich in `scripts/test-projects.test-support.mjs` und ist absichtlich kostengünstiger als `check:changed`: Direkte Teständerungen führen die betroffenen Tests selbst aus; Quellcodeänderungen bevorzugen explizite Zuordnungen, anschließend gleichgeordnete Tests und vom Importgraphen abhängige Tests. Die gemeinsam genutzte Konfiguration für die Zustellung in Gruppenräumen ist eine der expliziten Zuordnungen: Änderungen an der Konfiguration für sichtbare Gruppenantworten, am Zustellungsmodus für Quellantworten oder am System-Prompt des Nachrichten-Tools werden durch die Core-Antworttests sowie Discord- und Slack-Zustellungsregressionstests geleitet, damit eine Änderung des gemeinsamen Standardwerts vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung das Test-Harness so umfassend betrifft, dass die kostengünstige zugeordnete Menge kein zuverlässiger Näherungswert ist.

## Testbox-Validierung

Crabbox ist der Repository-eigene Wrapper für Remote-Boxen zum Linux-Nachweis durch Maintainer. Agenten-
sitzungen führen einen oder wenige fokussierte Tests und kostengünstige statische Prüfungen nur für
vertrauenswürdigen Quellcode lokal aus, wenn die vorhandene Abhängigkeitsinstallation bereit ist. Für größere Testsuiten und
rechenintensive Arbeiten verwenden sie Crabbox, einschließlich Builds, Typprüfungen, aufgefächertem Linting,
Docker, Paketspuren, E2E, Live-Nachweisen und CI-Parität. Umfangreiche Nachweise durch vertrauenswürdige Maintainer
verwenden standardmäßig `blacksmith-testbox`, und `.crabbox.yaml` verwendet es nun ebenfalls standardmäßig. Der konfigurierte
Workflow stellt Provider- und Agenten-Anmeldedaten bereit, weshalb nicht vertrauenswürdiger Quellcode von Mitwirkenden oder
Forks stattdessen geheimnislose Fork-CI oder eine bereinigte direkte AWS-Crabbox verwenden muss.
Bereinigte AWS-Läufe setzen `CRABBOX_ENV_ALLOW=CI`, übergeben
`--no-hydrate` und verwenden ein neues temporäres entferntes `HOME`; dadurch wird verhindert, dass die Repository-
Positivliste `OPENCLAW_*` und vorhandene Authentifizierungsprofile nicht vertrauenswürdigen Code erreichen.
Sie verwenden eine neu aufgewärmte Lease, die ausschließlich diesem nicht vertrauenswürdigen Quellcode zugeordnet ist, niemals eine
vertrauenswürdige oder zuvor mit Anmeldedaten versehene Lease. Starten Sie ein installiertes, vertrauenswürdiges Crabbox-
Programm aus einem sauberen, vertrauenswürdigen `main`-Checkout und rufen Sie ausschließlich den Remote-PR mit
`--fresh-pr` ab; führen Sie den Wrapper oder die Konfiguration des nicht vertrauenswürdigen Checkouts niemals lokal aus.
Heben Sie `CRABBOX_AWS_INSTANCE_PROFILE` auf und brechen Sie sicher ab, sofern das aufgelöste
`aws.instanceProfile` nicht leer ist. Verwenden Sie vor jeder Installation oder jedem Test vertrauenswürdige
Werkzeuge mit absoluten Pfaden, um ein IMDSv2-Token zu verlangen, nachzuweisen, dass der IAM-Anmeldedaten-
Endpunkt 404 zurückgibt, und das entfernte `git rev-parse HEAD` mit dem vollständigen
geprüften Head-SHA des PRs zu vergleichen. Binden Sie die Lease an diesen SHA und stoppen bzw. wärmen Sie sie bei einer Änderung des Heads erneut auf.
Laden Sie das vertrauenswürdige `scripts/crabbox-untrusted-bootstrap.sh` aus einem sauberen `main`
zusammen mit `--fresh-pr` hoch; es installiert die festgelegten Node-/pnpm-Versionen, prüft den SHA und
die Festlegung des Paketmanagers, isoliert `HOME`, installiert Abhängigkeiten und führt anschließend den
angeforderten Test aus.
Heben Sie alle `CRABBOX_TAILSCALE*`-Überschreibungen auf, erzwingen Sie `--network public
--tailscale=false`, löschen Sie Exit-Node-/LAN-Flags und verlangen Sie, dass `crabbox inspect`
öffentliche Vernetzung ohne Tailscale-Status meldet, bevor Sie irgendein Skript hochladen.
Eigene AWS-/Hetzner-Kapazitäten bleiben außerdem die Ausweichoption bei Blacksmith-Ausfällen,
Kontingentproblemen oder ausdrücklichen Tests mit eigenen Kapazitäten.

Agenten wärmen nicht im Voraus für erwartete Arbeiten auf. Fordern Sie eine Testbox erst dann an, wenn der
erste aufwendige Befehl bereit ist, verwenden Sie die zurückgegebene `tbx_...`-ID für spätere aufwendige
Befehle erneut, synchronisieren Sie bei jedem Lauf den aktuellen Checkout und stoppen Sie die Testbox vor der Übergabe.

Crabbox-gestützte Blacksmith-Läufe wärmen einmalig verwendete Testboxes auf, beanspruchen und synchronisieren sie, führen Befehle aus, erstellen Berichte und bereinigen sie.
Die integrierte Plausibilitätsprüfung der Synchronisierung schlägt sofort fehl, wenn
`git status --short` auf der synchronisierten Box mindestens 200 Löschungen nachverfolgter Dateien anzeigt,
wodurch verschwindende Root-Dateien wie `pnpm-lock.yaml` erkannt werden. Setzen Sie für beabsichtigte
PRs mit umfangreichen Löschungen `CRABBOX_ALLOW_MASS_DELETIONS=1` für den Remote-Befehl.

Crabbox beendet außerdem einen lokalen Aufruf der Blacksmith-CLI, der länger als fünf Minuten in der
Synchronisierungsphase verbleibt, ohne dass nach der Synchronisierung eine Ausgabe erfolgt. Setzen Sie
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diese Schutzprüfung zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren
Millisekundenwert.

Prüfen Sie den Wrapper vor einem ersten Lauf vom Repository-Root aus:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repository-Wrapper verweigert ein veraltetes Crabbox-Programm, das den ausgewählten Provider nicht ausweist, und Blacksmith-gestützte Läufe erfordern Crabbox 0.22.0 oder neuer, damit der Wrapper das aktuelle Synchronisierungs-, Warteschlangen- und Bereinigungsverhalten der Testbox erhält. Vermeiden Sie in Codex-Worktrees oder verknüpften bzw. partiellen Checkouts das lokale `pnpm crabbox:run`-Skript, da pnpm möglicherweise Abhängigkeiten abgleicht, bevor Crabbox startet; rufen Sie stattdessen den Node-Wrapper direkt auf:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Wenn Sie den gleichgeordneten Checkout verwenden, erstellen Sie das ignorierte lokale Programm vor Zeitmessungen oder Nachweisarbeiten neu:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Der `blacksmith:`-Block in `.crabbox.yaml` legt bereits die Standardwerte für Organisation, Workflow, Job und Ref fest, daher sind die nachstehenden expliziten Flags optional. Gate für Änderungen:

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

Erneute Ausführung eines fokussierten Tests auf der Testbox, wenn lokale Abhängigkeiten nicht verfügbar sind oder sich das
Ziel auffächert:

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Bei delegierten
Blacksmith-Testbox-Läufen bilden der Exit-Code des Crabbox-Wrappers und die JSON-Zusammenfassung das
Befehlsergebnis. Der verknüpfte GitHub-Actions-Lauf ist für die Bereitstellung und das Keepalive zuständig; er
kann mit `cancelled` enden, wenn die Testbox extern gestoppt wird, nachdem der SSH-
Befehl bereits zurückgekehrt ist. Behandeln Sie dies als Bereinigungs-/Statusartefakt, sofern
`exitCode` des Wrappers nicht ungleich null ist oder die Befehlsausgabe einen fehlgeschlagenen Test zeigt.
Einmalige, Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen;
wenn ein Lauf unterbrochen wurde oder die Bereinigung unklar ist, prüfen Sie aktive Boxen und stoppen Sie nur
die von Ihnen erstellten Boxen:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie Wiederverwendung nur, wenn Sie bewusst mehrere Befehle auf derselben mit Anmeldedaten versehenen Box ausführen müssen:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Verwenden Sie die Lease erneut, nicht veralteten Quellcode. Lassen Sie `--no-sync` weg, damit jeder Lauf den
aktuellen Checkout hochlädt; verwenden Sie es nur, um einen unveränderten, bereits synchronisierten Quellbaum
bewusst erneut auszuführen. Nicht vertrauenswürdiger Quellcode von Mitwirkenden oder Forks muss
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` und für jeden Befehl ein neues
temporäres entferntes `HOME` verwenden; installieren Sie Abhängigkeiten vor dem Test innerhalb dieses
bereinigten Befehls. Verwenden Sie ausschließlich eine neu aufgewärmte Lease erneut, die demselben
nicht vertrauenswürdigen Quellcode zugeordnet ist; niemals eine vertrauenswürdige oder zuvor mit Anmeldedaten versehene Lease. Führen Sie
den Wrapper oder die Konfiguration des nicht vertrauenswürdigen Checkouts niemals lokal aus: Starten Sie das installierte
vertrauenswürdige Crabbox-Programm aus einem sauberen, vertrauenswürdigen `main` und übergeben Sie bei jedem
Lauf `--fresh-pr`. Lassen Sie `CRABBOX_AWS_INSTANCE_PROFILE` ungesetzt, weisen Sie ein nicht leeres aufgelöstes
Instanzprofil zurück, verlangen Sie einen vertrauenswürdigen entfernten IMDS-Nachweis ohne Rolle und prüfen Sie vor
Installation oder Test den geprüften Head-SHA. Binden Sie die Lease an diesen SHA; stoppen Sie sie nach jeder
Änderung des Heads und wärmen Sie sie erneut auf. Wenn kein Remote-PR vorhanden ist, verwenden Sie geheimnislose Fork-CI.
Wählen Sie für nicht vertrauenswürdigen Quellcode niemals `hydrate-github` oder den mit Anmeldedaten versehenen Blacksmith-Workflow
aus.

Wenn Crabbox die fehlerhafte Schicht ist, Blacksmith selbst jedoch funktioniert, verwenden Sie direktes
Blacksmith nur für Diagnosen wie `list`, `status` und die Bereinigung. Beheben Sie den
Crabbox-Pfad, bevor Sie einen direkten Blacksmith-Lauf als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue
Warmups aber nach einigen Minuten ohne IP oder URL des Actions-Laufs im Status `queued` verbleiben,
ist dies als Auslastung des Blacksmith-Providers, der Warteschlange, der Abrechnung oder der Organisationslimits zu behandeln. Stoppen Sie die
von Ihnen erstellten IDs in der Warteschlange, starten Sie keine weiteren Testboxes und verlagern Sie den Nachweis auf den
unten beschriebenen Pfad für eigene Crabbox-Kapazität, während jemand das Blacksmith-Dashboard,
die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen oder durch Kontingente eingeschränkt ist, die erforderliche Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Vermeiden Sie bei AWS-Kapazitätsengpässen `class=beast`, sofern die Aufgabe nicht wirklich CPU-Kapazität der 48xlarge-Klasse benötigt. Eine `beast`-Anfrage beginnt bei 192 vCPUs und löst am leichtesten ein regionales EC2-Spot- oder On-Demand-Standard-Kontingent aus. Die Repository-eigene Konfiguration `.crabbox.yaml` verwendet standardmäßig `class: standard`, den On-Demand-Markt und `capacity.hints: true`, damit vermittelte AWS-Leases die ausgewählte Region und den ausgewählten Markt, Kontingentengpässe, den Spot-Fallback sowie Warnungen für Klassen mit hoher Kapazitätsanforderung ausgeben. Verwenden Sie `fast` für umfangreichere breite Prüfungen, `large` nur, wenn standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Testsuiten oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierungen oder Performance-Profiling mit hoher Kernzahl. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Dokumentationsarbeit, gewöhnliche Lint-/Typprüfungen, kleine E2E-Reproduktionen oder die Triage von Blacksmith-Ausfällen. Verwenden Sie `--market on-demand` für die Kapazitätsdiagnose, damit Schwankungen des Spot-Markts das Signal nicht verfälschen.

`.crabbox.yaml` legt die Standardeinstellungen für Provider, Synchronisierung und GitHub-Actions-Hydration fest. Die Crabbox-Synchronisierung überträgt niemals `.git`, sodass der hydrierte Actions-Checkout seine eigenen entfernten Git-Metadaten behält, anstatt lokale Remotes und Objektspeicher der Maintainer zu synchronisieren. Die Repository-Konfiguration schließt außerdem lokale Laufzeit-/Build-Artefakte aus (wie `.artifacts` und Testberichte), die niemals übertragen werden dürfen. `.github/workflows/crabbox-hydrate.yml` steuert den Checkout, die Einrichtung von Node/pnpm, den Abruf von `origin/main` und die Übergabe der nicht geheimen Umgebung für `crabbox run --id <cbx_id>`-Befehle in der eigenen Cloud.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
