---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Vergleich der Validierungsprofile für stabile und vollständige Releases
    - Fehlerbehebung bei fehlgeschlagenen Phasen der Release-Validierung
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-07-12T15:57:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist der übergeordnete Release-Ablauf: der zentrale manuelle Einstiegspunkt
für den Nachweis vor dem Release. Die meisten Arbeiten erfolgen in untergeordneten Workflows, sodass eine fehlgeschlagene Box
erneut ausgeführt werden kann, ohne den gesamten Release neu zu starten.

Führen Sie ihn von einer vertrauenswürdigen Workflow-Referenz aus, normalerweise `main`, und übergeben Sie den Release-Branch,
das Tag oder den vollständigen Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` akzeptiert außerdem `anthropic` oder `minimax` für das Betriebssystem-übergreifende Onboarding und den
End-to-End-Agent-Turn. Wiederverwendbare untergeordnete Jobs ermitteln das aufgerufene Workflow-Testsystem
aus `job.workflow_repository` und `job.workflow_sha`, während die Eingabe `ref`
den zu testenden Kandidaten auswählt. Dadurch bleibt die aktuelle vertrauenswürdige Validierungslogik
verfügbar, wenn ein älterer Release-Branch oder ein älteres Tag validiert wird.

Jeder gestartete untergeordnete Workflow muss denselben Workflow-SHA wie der übergeordnete
`Full Release Validation`-Lauf melden. Wenn sich `main` zwischen dem Start des übergeordneten und der untergeordneten
Workflows ändert, schlägt der übergeordnete Ablauf sicher fehl, selbst wenn der untergeordnete Workflow erfolgreich ist. Verwenden Sie
für einen unveränderlichen Nachweis eines exakten Commits
`pnpm ci:full-release --sha <target-sha>`. Das Hilfsprogramm erstellt eine temporäre
`release-ci/*`-Referenz, die auf das aktuelle vertrauenswürdige `origin/main` festgelegt ist, übergibt den Ziel-
SHA ausschließlich als Kandidaten-`ref`, verwendet strenge Nachweise für das exakte Ziel erneut, sofern
verfügbar, und löscht die Referenz nach der Validierung. Übergeben Sie
`-f reuse_evidence=false`, um einen neuen Lauf zu erzwingen, oder
`--workflow-sha <trusted-main-sha>`, um einen älteren Workflow-Commit auszuwählen, der vom aktuellen
`origin/main` aus noch erreichbar ist. Der Workflow erstellt oder aktualisiert selbst niemals
Repository-Referenzen.

`release_profile=stable` und `release_profile=full` führen immer den umfassenden
Live-/Docker-Dauertest aus. Übergeben Sie `run_release_soak=true`, um dieselben Dauertest-Lanes
mit dem Profil `beta` einzubeziehen. Eine stabile Veröffentlichung lehnt ein Validierungsmanifest
ohne diesen Dauertest und blockierende Nachweise zur Produktleistung ab.

Package Acceptance erstellt das Kandidaten-Tarball normalerweise aus der aufgelösten
`ref`, einschließlich vollständiger SHA-Läufe, die mit `pnpm ci:full-release` gestartet wurden. Übergeben Sie nach einer
Beta-Veröffentlichung `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, um
das veröffentlichte npm-Paket für Release-Prüfungen, Package Acceptance, Betriebssystem-übergreifende Prüfungen,
den Release-Pfad in Docker und Paket-Telegram wiederzuverwenden. Verwenden Sie `package_acceptance_package_spec`
nur, wenn Package Acceptance absichtlich ein anderes Paket nachweisen soll.
Die Live-Paket-Lane des Codex-Plugins folgt demselben Zustand: Veröffentlichte
`release_package_spec`-Werte leiten `codex_plugin_spec=npm:@openclaw/codex@<version>` ab;
SHA-/Artefakt-Läufe packen `extensions/codex` aus der ausgewählten Referenz; und Betreiber
können `codex_plugin_spec` für Plugin-Quellen vom Typ `npm:`, `npm-pack:` oder `git:`
direkt festlegen. Die Lane erteilt die für dieses Plugin erforderliche ausdrückliche Genehmigung zur Installation der Codex CLI
und führt anschließend die Codex-CLI-Vorprüfung sowie OpenAI-Agent-Turns in derselben Sitzung aus.

## Übergeordnete Phasen

Für `rerun_group=all` wird zuerst ein Job `Check for reusable validation evidence`
ausgeführt: Er sucht nach der neuesten vorherigen erfolgreichen vollständigen Validierung für exakt denselben
Ziel-SHA, dasselbe Release-Profil, dieselbe effektive Dauertest-Einstellung und dieselben Validierungseingaben.
Wenn solche Nachweise vorhanden sind, werden alle Lanes übersprungen, und der übergeordnete Verifizierer
prüft das unveränderliche übergeordnete Artefakt, die untergeordneten Läufe und die Startprotokolle erneut. Dies dient
ausschließlich der Wiederherstellung durch erneute Ausführung für denselben Kandidaten; es autorisiert keine SHA-übergreifende Wiederverwendung. Führen Sie
für einen geänderten Kandidaten jedes Paket-, Artefakt-, Installations-, Docker- oder Provider-
Gate erneut aus, das von dieser Änderung betroffen ist. Übergeben Sie `reuse_evidence=false`, um einen neuen vollständigen
Lauf zu erzwingen. Die Wiederverwendung von Nachweisen erfolgt nur von `main` oder einer kanonischen SHA-fixierten
`release-ci/*`-Referenz, deren Workflow-Commit weiterhin zur vertrauenswürdigen `main`-Abstammung gehört;
andere Workflow-Referenzen führen die ausgewählten Lanes neu aus.

Ebenfalls für `rerun_group=all` erstellt ein Job `Verify Docker runtime image assets`
das Docker-Ziel `runtime-assets` mit
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Er wird parallel zu den
anderen Phasen ausgeführt und vom übergeordneten Verifizierer erzwungen; Lanes warten nicht mehr auf
ihn, bevor sie gestartet werden. Eine engere `rerun_group` überspringt diese Vorprüfung.

| Phase                   | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung       | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet die ausgewählten Eingaben auf.<br />**Erneute Ausführung:** Führen Sie den übergeordneten Ablauf erneut aus, wenn dies fehlschlägt.                                                                                                                                                                                                                                                                                                            |
| Vorprüfung der Docker-Assets | **Job:** `Verify Docker runtime image assets`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Das Docker-Build-Ziel `runtime-assets` ist weiterhin erfolgreich, bevor eine andere Phase gestartet wird. Wird nur für `rerun_group=all` ausgeführt.<br />**Erneute Ausführung:** Führen Sie den übergeordneten Ablauf mit `rerun_group=all` erneut aus.                                                                                                                                                                                                                                         |
| Vitest und normale CI    | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Nachweis:** Manueller vollständiger CI-Graph für die Zielreferenz, einschließlich Linux-Node-Lanes, Shards gebündelter Plugins, Shards für Plugin- und Channel-Verträge, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den übergeordneten Ablauf.<br />**Erneute Ausführung:** `rerun_group=ci`.                                                                                          |
| Plugin-Vorabversion       | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Nachweis:** Release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Plugin-Batch-Shards, Docker-Lanes für Plugin-Vorabversionen und ein nicht blockierendes Artefakt `plugin-inspector-advisory` für die Kompatibilitätstriage.<br />**Erneute Ausführung:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Release-Prüfungen          | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Nachweis:** Installations-Smoke-Test, Betriebssystem-übergreifende Paketprüfungen, Package Acceptance, QA-Lab-Parität, Live-Matrix und Live-Telegram. Stabile und vollständige Profile führen außerdem umfassende Live-/E2E-Suites und Docker-Blöcke für den Release-Pfad aus; Beta kann diese mit `run_release_soak=true` aktivieren.<br />**Erneute Ausführung:** `rerun_group=release-checks` oder ein enger gefasster Release-Checks-Handle.                                                                |
| Paket-Telegram        | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Nachweis:** Ein fokussierter Telegram-E2E-Test des veröffentlichten Pakets, wenn `release_package_spec` oder `npm_telegram_package_spec` festgelegt ist. Die vollständige Kandidatenvalidierung verwendet stattdessen den kanonischen Telegram-E2E-Test von Package Acceptance.<br />**Erneute Ausführung:** `rerun_group=npm-telegram` mit `release_package_spec` oder `npm_telegram_package_spec`.                                                                                                              |
| Produktleistung     | **Job:** `Run product performance evidence`<br />**Untergeordneter Workflow:** `OpenClaw Performance`<br />**Nachweis:** Leistungslauf für das Release-Profil (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) für den Ziel-SHA. Die Kova-Ausgabe verbleibt in den Workflow-Artefakten, und der untergeordnete Workflow muss nachweisen, dass sein Berichts-Publisher übersprungen wurde. Nur für `rerun_group=all` oder `rerun_group=performance` erforderlich (blockierend); für engere Gruppen zur erneuten Ausführung nicht erforderlich.<br />**Erneute Ausführung:** `rerun_group=performance`. |
| Übergeordneter Verifizierer       | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Prüft die aufgezeichneten Ergebnisse der untergeordneten Läufe erneut und hängt Tabellen mit den langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneute Ausführung:** Führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagener untergeordneter Workflow erfolgreich erneut ausgeführt wurde.                                                                                                                                                                                                                                                                 |

Der übergeordnete Ablauf startet die Produktleistungsprüfung immer im reinen Artefaktmodus.
`OpenClaw Performance` erlaubt die Veröffentlichung von Berichten nur für geplante Läufe oder einen
manuellen Start, bei dem ausdrücklich `publish_reports=true` festgelegt ist. Der Schutz für den reinen
Artefaktmodus muss erfolgreich abgeschlossen werden und nachweisen, dass der Publisher-Job übersprungen blieb.
Neue und wiederverwendete Nachweise zeichnen
`controls.performanceReportPublication=artifact-only` auf; der Verifizierer und der Selektor für die Wiederverwendung
lehnen Nachweise ohne den passenden normalisierten Nachweis des untergeordneten Performance-Workflows
ab.

Der Verifizierer lädt das kanonische Manifest als
`full-release-validation-<run-id>-<run-attempt>` hoch. Die Nachweiswerkzeuge validieren
dessen Artefakt-ID, Digest, erzeugenden Lauf und Versuch, bevor sie genau diese
Artefakt-ID herunterladen. Sie begrenzen die Größe der heruntergeladenen ZIP-Datei, prüfen deren Bytes anhand des REST-
`sha256:`-Digests und streamen den einzigen zulässigen größenbeschränkten Manifesteintrag, ohne
das Archiv zu extrahieren. Für ältere Veröffentlichungskonsumenten bleibt vorübergehend ein Alias
mit stabilem Namen bestehen. Der Verifizierer bevorzugt immer das versuchsspezifische Artefakt;
übergangsweise akzeptiert er den stabilen Namen nur für einen Manifest-v2-
Erzeuger beim ersten Versuch. Für spätere Versuche und Manifest v3 lehnt er diesen Legacy-Namen ab.

Für `ref=main` mit `rerun_group=all`, für `release/*`-Referenzen und für Tideclaw-
Alpha-Referenzen ersetzt ein neuerer übergeordneter Lauf einen älteren mit derselben Referenz und
Gruppe zur erneuten Ausführung. Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle untergeordneten
Workflows ab, die er bereits gestartet hat. Validierungsläufe für Tags und fixierte SHAs
brechen einander nicht ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsames Artefakt `release-package-under-test` vor, wenn paket-
oder Docker-bezogene Phasen es benötigen.

| Phase                    | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel             | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewählte Referenz, optionale erwartete SHA, Profil, Wiederholungsgruppe und fokussierter Filter für die Live-Suite.<br />**Wiederholung:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Paketartefakt            | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** packt ein Kandidaten-Tarball oder löst es auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Wiederholung:** die betroffene Paket-, Betriebssystem-übergreifende oder Live-/E2E-Gruppe.                                                                                                                                                                                                                                                                                             |
| Installations-Smoke-Test | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Images aus dem Root-Dockerfile, QR-Paketinstallation, Docker-Smoke-Tests für Root und Gateway, Docker-Tests des Installationsprogramms sowie Smoke-Test des Image-Providers bei globaler Bun-Installation.<br />**Wiederholung:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Betriebssystemübergreifend | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Neuinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus unter Verwendung des Kandidaten-Tarballs und eines Baseline-Pakets.<br />**Wiederholung:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| Repository- und Live-E2E | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Harnesses für Live-Modell, Backend und Gateway, ausgewählt durch `release_profile`.<br />**Ausführung:** `run_release_soak=true`, `release_profile=full` oder fokussiertes `rerun_group=live-e2e`.<br />**Wiederholung:** `rerun_group=live-e2e`, optional mit `live_suite_filter`.                                                                                |
| Docker-Release-Pfad      | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks des Release-Pfads anhand des gemeinsamen Paketartefakts.<br />**Ausführung:** `run_release_soak=true`, `release_profile=full` oder fokussiertes `rerun_group=live-e2e`.<br />**Wiederholung:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Paketabnahme             | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Fixtures für Plugin-Pakete, Plugin-Aktualisierung, das kanonische Paket-E2E mit Mock-OpenAI und Telegram sowie Prüfungen, ob veröffentlichte Upgrades mit demselben Tarball weiterhin funktionieren. Blockierende Release-Prüfungen verwenden standardmäßig die neueste veröffentlichte Baseline; Langzeittests (`run_release_soak=true`) erweitern dies um die letzten 4 stabilen npm-Releases sowie 3 festgelegte historische Versionen (`2026.4.23`, `2026.5.2`, `2026.4.15`) und werden anhand von Upgrade-Fixtures für gemeldete Probleme ausgeführt.<br />**Wiederholung:** `rerun_group=package`. |
| Reifegrad-Scorecard      | **Job:** `Render maturity scorecard release docs`<br />**Zugrunde liegender Workflow:** `maturity-scorecard.yml`<br />**Tests:** rendert die beratenden Dokumente der Reifegrad-Scorecard anhand der Zielreferenz. Wird nur ausgeführt, wenn `run_maturity_scorecard=true` übergeben wird.<br />**Wiederholung:** `rerun_group=qa` mit `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| QA-Parität               | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** agentische Paritätspakete für Kandidat und Baseline, anschließend der Paritätsbericht.<br />**Wiederholung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| QA-Laufzeitparität       | **Job:** `Run QA Lab runtime parity lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** eine agentische Paritäts-Lane für das Laufzeitpaar `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), einschließlich einer Standardstufe und, bei `run_release_soak=true`, einer Langzeitteststufe. Hinweis: Einzelne Fehler blockieren den Prüfer der Release-Prüfungen nicht.<br />**Wiederholung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                    |
| QA-Abdeckung der Laufzeitwerkzeuge | **Job:** `Enforce QA Lab runtime tool coverage`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** dynamische Werkzeugabweichungen zwischen `openclaw` und `codex` in der Standardstufe der Laufzeitparität (`pnpm openclaw qa coverage --tools`) unter Verwendung der Ausgabe der QA-Lane für Laufzeitparität. Blockierend: Dieser Job kann nicht als lediglich beratend überschrieben werden.<br />**Wiederholung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                        |
| QA Live-Matrix           | **Job:** `Run QA Lab live Matrix lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Wiederholung:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                          |
| QA Live-Telegram         | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Anmeldedaten-Leases.<br />**Wiederholung:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                                      |
| Release-Prüfer           | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Jobs der Release-Prüfungen für die ausgewählte Wiederholungsgruppe.<br />**Wiederholung:** erneut ausführen, nachdem die fokussierten untergeordneten Jobs erfolgreich waren.                                                                                                                                                                                                                                                                                                                                                                                   |

## Docker-Chunks des Release-Pfads

Die Phase des Docker-Release-Pfads führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                           | Abdeckung                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-Smoke-Lanes des Release-Pfads.                                                                                      |
| `package-update-openai`                                         | Installations-/Aktualisierungsverhalten des OpenAI-Pakets, bedarfsgesteuerte Codex-Installation, Live-Aufrufe des Codex-Plugins und Werkzeugaufrufe über Chat Completions. |
| `package-update-anthropic`                                      | Installations- und Aktualisierungsverhalten des Anthropic-Pakets.                                                                             |
| `package-update-core`                                           | Provider-neutrales Paket- und Aktualisierungsverhalten.                                                                              |
| `plugins-runtime-plugins`                                       | Plugin-Laufzeit-Lanes, die Plugin-Verhalten ausführen.                                                                        |
| `plugins-runtime-services`                                      | Dienstgestützte und Live-Plugin-Laufzeit-Lanes.                                                                              |
| `plugins-runtime-install-a` bis `plugins-runtime-install-h`     | Für die parallele Release-Validierung aufgeteilte Batches für Plugin-Installation und -Laufzeit.                                                      |
| `openwebui`                                                     | OpenWebUI-Kompatibilitäts-Smoke-Test, der bei Anforderung auf einem dedizierten Runner mit großer Festplatte isoliert wird.                                    |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten, sofern verfügbar, für jede Lane Befehle zur erneuten Ausführung
mit Eingaben zur Wiederverwendung des Paketartefakts und des Images.

## Release-Profile

`release_profile` steuert hauptsächlich die Breite der Live-/Provider-Abdeckung innerhalb der Release-Prüfungen.
Es entfernt weder die normale vollständige CI noch Plugin-Prerelease, Installations-Smoke-Tests, Paket-
Akzeptanz oder QA Lab. Die Profile „stable“ und „full“ führen stets eine umfassende Repo-/Live-
E2E- sowie Docker-Soak-Abdeckung des Release-Pfads aus. Das Beta-Profil kann diese mit
`run_release_soak=true` aktivieren. Package Acceptance stellt für jeden vollständigen Kandidaten den kanonischen
Paket-Telegram-E2E-Test bereit, sodass der übergeordnete Workflow diesen
Live-Poller nicht dupliziert.

| Profil   | Vorgesehene Verwendung                  | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                                         |
| -------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Schnellster releasekritischer Smoke-Test. | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway für OpenAI.                                       |
| `stable` | Standardprofil für die Release-Freigabe. | `beta` plus Anthropic-Smoke-Test, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness, Docker-Subagent-Ankündigung und ein OpenCode-Go-Smoke-Shard. |
| `full`   | Breiter beratender Durchlauf.           | `stable` plus beratende Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                                                |

## Ergänzungen nur für „full“

Diese Testsuiten werden von `stable` übersprungen und sind in `full` enthalten:

| Bereich                          | Abdeckung nur für „full“                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                         |
| Docker-Live-Gateway              | Beratende Provider, aufgeteilt in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- und xAI/Z.ai-Shards.                       |
| Native Gateway-Provider-Profile  | Vollständige Anthropic-Opus- und Sonnet/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A–K, L–N, sonstige O–Z, Moonshot und xAI.                                                                         |
| Native Medien-Live-Shards        | Audio, Google-Musik, MiniMax-Musik und Videogruppen A–D.                                                                  |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiteren
Anthropic- und OpenCode-Go-Modell-Shards. Gezielte Wiederholungen können weiterhin die
aggregierten Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwenden.

## Gezielte Wiederholungen

Verwenden Sie `rerun_group`, um die Wiederholung nicht zugehöriger Release-Umgebungen zu vermeiden:

| Handle              | Umfang                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `all`               | Alle Phasen der Full Release Validation.                                                         |
| `ci`                | Nur untergeordneter manueller vollständiger CI-Workflow.                                         |
| `plugin-prerelease` | Nur untergeordneter Plugin-Prerelease-Workflow.                                                  |
| `release-checks`    | Alle Phasen der OpenClaw Release Checks.                                                         |
| `install-smoke`     | Install Smoke bis einschließlich Release-Prüfungen.                                              |
| `cross-os`          | Betriebssystemübergreifende Release-Prüfungen.                                                   |
| `live-e2e`          | Repo-/Live-E2E- und Docker-Validierung des Release-Pfads.                                        |
| `package`           | Package Acceptance.                                                                              |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                                                   |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                                               |
| `qa-live`           | QA-Live-Lanes für Matrix/Telegram sowie bei Aktivierung geschützte Lanes für Discord, WhatsApp und Slack. |
| `npm-telegram`      | Telegram-E2E für veröffentlichte Pakete; erfordert `release_package_spec` oder `npm_telegram_package_spec`. |
| `performance`       | Nur Nachweise zur Produktleistung.                                                               |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine einzelne Live-Testsuite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Das Handle `live-gateway-advisory-docker` ist ein aggregiertes Wiederholungs-Handle für seine
drei Provider-Shards und fächert daher weiterhin auf alle beratenden Docker-Gateway-Jobs auf.

Verwenden Sie `cross_os_suite_filter` mit `rerun_group=cross-os`, wenn eine einzelne betriebssystemübergreifende Lane
fehlgeschlagen ist. Der Filter akzeptiert eine Betriebssystem-ID, eine Testsuite-ID oder ein Betriebssystem-/Testsuite-Paar, zum
Beispiel `windows/packaged-upgrade`, `windows` oder `packaged-fresh`. Betriebssystemübergreifende
Zusammenfassungen enthalten phasenbezogene Zeitangaben für paketierte Upgrade-Lanes, und lang laufende
Befehle geben Heartbeat-Zeilen aus, sodass ein festgefahrenes Update vor dem
Job-Timeout sichtbar wird.

Fehler bei QA-Release-Prüfungen blockieren die normale Release-Validierung. Die Prüfung der
QA-Laufzeit-Tool-Abdeckung (dynamische Tool-Abweichungen zwischen `openclaw` und `codex` in der
Standardstufe) blockiert ebenfalls den Verifizierer der Release-Prüfungen, obwohl die
zugrunde liegende QA-Laufzeit-Paritäts-Lane beratend ist. Tideclaw-Alpha-Läufe können
Release-Prüfungs-Lanes, die nicht die Paketsicherheit betreffen, weiterhin als beratend
behandeln. Bei `release_profile=beta` sind die Live-Provider-Testsuiten der
Validierung `Run repo/live E2E validation` beratend: Bereitstellungen von Drittanbieter-Modellen
ändern sich unabhängig von einem Release, daher zeigt das Beta-Profil deren Fehler als Warnungen an,
während die Profile „stable“ und „full“ sie weiterhin blockierend behandeln. Wenn
`live_suite_filter` ausdrücklich eine geschützte QA-Live-Lane wie Discord,
WhatsApp oder Slack anfordert, muss die entsprechende Repo-Variable
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl,
statt die Lane stillschweigend zu überspringen.
Führen Sie `rerun_group=qa`, `qa-parity` oder `qa-live` erneut aus, wenn Sie
aktuelle QA-Nachweise benötigen.

## Aufzubewahrende Nachweise

Bewahren Sie die Zusammenfassung `Full Release Validation` als Index auf Release-Ebene auf. Sie verlinkt
die IDs untergeordneter Läufe und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den
untergeordneten Workflow und wiederholen Sie anschließend das kleinste passende Handle aus der obigen Liste.

Nützliche Artefakte:

- `release-package-under-test` aus `OpenClaw Release Checks`
- Docker-Artefakte des Release-Pfads unter `.artifacts/docker-tests/`
- Package-Acceptance-Artefakte `package-under-test` und Docker-Akzeptanzartefakte
- Artefakte der betriebssystemübergreifenden Release-Prüfungen für jedes Betriebssystem und jede Testsuite
- Artefakte für QA-Parität, Laufzeitparität, Matrix und Telegram

## Workflow-Dateien

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
