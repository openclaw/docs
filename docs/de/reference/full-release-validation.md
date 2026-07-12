---
read_when:
    - Ausführen oder erneutes Ausführen der vollständigen Release-Validierung
    - Vergleich der Validierungsprofile für Stable- und Full-Releases
    - Fehlerbehebung bei fehlgeschlagenen Phasen der Release-Validierung
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-07-12T02:07:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist der übergeordnete Release-Ablauf: der zentrale manuelle Einstiegspunkt
für Nachweise vor dem Release. Die meisten Arbeiten erfolgen in untergeordneten Workflows, sodass ein fehlgeschlagener
Ausführungsknoten erneut ausgeführt werden kann, ohne den gesamten Release neu zu starten.

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

`provider` akzeptiert außerdem `anthropic` oder `minimax` für das betriebssystemübergreifende Onboarding und den
durchgängigen Agent-Durchlauf. Wiederverwendbare untergeordnete Jobs ermitteln die aufgerufene Workflow-Testumgebung
aus `job.workflow_repository` und `job.workflow_sha`, während die Eingabe `ref`
den zu testenden Kandidaten auswählt. Dadurch bleibt die aktuelle vertrauenswürdige Validierungslogik
verfügbar, wenn ein älterer Release-Branch oder ein älteres Tag validiert wird.

Jeder gestartete untergeordnete Workflow muss denselben Workflow-SHA melden wie der übergeordnete
`Full Release Validation`-Durchlauf. Wenn sich `main` zwischen dem Start des übergeordneten und der untergeordneten
Workflows ändert, schlägt der übergeordnete Ablauf sicher fehl, selbst wenn der untergeordnete Workflow erfolgreich ist. Für
einen unveränderlichen Nachweis für einen exakten Commit verwenden Sie
`pnpm ci:full-release --sha <target-sha>`. Das Hilfsprogramm erstellt eine temporäre
`release-ci/*`-Referenz, die auf den aktuellen vertrauenswürdigen Stand von `origin/main` fixiert ist, übergibt den Ziel-
SHA ausschließlich als Kandidaten-`ref`, verwendet vorhandene strikte Nachweise für das exakte Ziel erneut
und löscht die Referenz nach der Validierung. Übergeben Sie
`-f reuse_evidence=false`, um einen neuen Durchlauf zu erzwingen, oder
`--workflow-sha <trusted-main-sha>`, um einen älteren Workflow-Commit auszuwählen, der vom aktuellen
`origin/main` weiterhin erreichbar ist. Der Workflow selbst erstellt oder aktualisiert niemals
Repository-Referenzen.

`release_profile=stable` und `release_profile=full` führen immer den umfassenden
Live-/Docker-Dauertest aus. Übergeben Sie `run_release_soak=true`, um dieselben Dauertest-Lanes
mit dem Profil `beta` einzuschließen. Die stabile Veröffentlichung lehnt ein Validierungsmanifest
ohne diesen Dauertest und blockierende Nachweise zur Produktleistung ab.

Die Paketabnahme erstellt normalerweise den Kandidaten-Tarball aus der aufgelösten
`ref`, einschließlich vollständiger SHA-Durchläufe, die mit `pnpm ci:full-release` gestartet wurden. Übergeben Sie nach einer
Beta-Veröffentlichung `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, um
das veröffentlichte npm-Paket für Release-Prüfungen, Paketabnahme, betriebssystemübergreifende Prüfungen,
den Docker-Release-Pfad und Paket-Telegram wiederzuverwenden. Verwenden Sie `package_acceptance_package_spec`
nur, wenn die Paketabnahme absichtlich ein anderes Paket prüfen soll.
Die Live-Paket-Lane des Codex-Plugins folgt demselben Zustand: Veröffentlichte
`release_package_spec`-Werte leiten `codex_plugin_spec=npm:@openclaw/codex@<version>` ab;
SHA-/Artefakt-Durchläufe paketieren `extensions/codex` aus der ausgewählten Referenz; und Bediener
können `codex_plugin_spec` direkt für Plugin-Quellen vom Typ `npm:`, `npm-pack:` oder `git:`
festlegen. Die Lane erteilt die für dieses Plugin erforderliche ausdrückliche Genehmigung zur Installation der Codex CLI,
führt anschließend die Vorabprüfung der Codex CLI und OpenAI-Agent-Durchläufe in derselben Sitzung aus.

## Übergeordnete Phasen

Für `rerun_group=all` wird zuerst der Job `Check for reusable validation evidence`
ausgeführt: Er sucht nach der neuesten vorherigen erfolgreichen vollständigen Validierung für exakt denselben
Ziel-SHA, dasselbe Release-Profil, dieselbe effektive Dauertest-Einstellung und dieselben Validierungseingaben.
Wenn solche Nachweise vorhanden sind, werden alle Lanes übersprungen, und die übergeordnete Prüfkomponente
prüft erneut das unveränderliche übergeordnete Artefakt, die untergeordneten Durchläufe und die Startprotokolle. Dies dient
ausschließlich der Wiederherstellung bei einer erneuten Ausführung desselben Kandidaten; eine Wiederverwendung über verschiedene SHAs hinweg wird dadurch nicht autorisiert. Führen Sie bei
einem geänderten Kandidaten jedes Paket-, Artefakt-, Installations-, Docker- oder Provider-
Gate erneut aus, das von dieser Änderung betroffen ist. Übergeben Sie `reuse_evidence=false`, um einen neuen vollständigen
Durchlauf zu erzwingen. Die Wiederverwendung von Nachweisen erfolgt nur von `main` oder einer kanonischen, auf einen SHA fixierten
`release-ci/*`-Referenz, deren Workflow-Commit weiterhin zur vertrauenswürdigen `main`-Abstammung gehört;
andere Workflow-Referenzen führen die ausgewählten Lanes neu aus.

Ebenfalls für `rerun_group=all` erstellt der Job `Verify Docker runtime image assets`
das Docker-Ziel `runtime-assets` mit
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Er läuft parallel zu den
anderen Phasen und wird durch die übergeordnete Prüfkomponente erzwungen; die Lanes warten nicht mehr
auf ihn, bevor sie gestartet werden. Eine engere `rerun_group` überspringt diese Vorabprüfung.

| Phase                   | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung           | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet die ausgewählten Eingaben auf.<br />**Erneute Ausführung:** Führen Sie den übergeordneten Ablauf erneut aus, wenn dies fehlschlägt.                                                                                                                                                                                                                                                                                                            |
| Docker-Assets-Vorabprüfung | **Job:** `Verify Docker runtime image assets`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Das Docker-Build-Ziel `runtime-assets` wird weiterhin erfolgreich ausgeführt, bevor eine andere Phase gestartet wird. Wird nur für `rerun_group=all` ausgeführt.<br />**Erneute Ausführung:** Führen Sie den übergeordneten Ablauf mit `rerun_group=all` erneut aus.                                                                                                                                                                                                                                         |
| Vitest und normale CI   | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Nachweis:** Manueller vollständiger CI-Graph für die Zielreferenz, einschließlich Linux-Node-Lanes, Shards gebündelter Plugins, Shards für Plugin- und Kanalverträge, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den übergeordneten Ablauf.<br />**Erneute Ausführung:** `rerun_group=ci`.                                                                                          |
| Plugin-Vorabrelease     | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Nachweis:** Releasespezifische statische Plugin-Prüfungen, agentenbasierte Plugin-Abdeckung, vollständige Plugin-Batch-Shards, Docker-Lanes für Plugin-Vorabreleases und ein nicht blockierendes Artefakt `plugin-inspector-advisory` für die Kompatibilitätstriage.<br />**Erneute Ausführung:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Release-Prüfungen       | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Nachweis:** Installations-Smoke-Test, betriebssystemübergreifende Paketprüfungen, Paketabnahme, Parität des QA Lab, Live-Matrix und Live-Telegram. Stabile und vollständige Profile führen außerdem umfassende Live-/E2E-Suiten und Abschnitte des Docker-Release-Pfads aus; Beta kann diese mit `run_release_soak=true` aktivieren.<br />**Erneute Ausführung:** `rerun_group=release-checks` oder eine engere Kennung für Release-Prüfungen.                                                                |
| Paket-Telegram          | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Nachweis:** Ein fokussierter Telegram-E2E-Test für ein veröffentlichtes Paket, wenn `release_package_spec` oder `npm_telegram_package_spec` festgelegt ist. Die vollständige Kandidatenvalidierung verwendet stattdessen den kanonischen Telegram-E2E-Test der Paketabnahme.<br />**Erneute Ausführung:** `rerun_group=npm-telegram` mit `release_package_spec` oder `npm_telegram_package_spec`.                                                                                                              |
| Produktleistung         | **Job:** `Run product performance evidence`<br />**Untergeordneter Workflow:** `OpenClaw Performance`<br />**Nachweis:** Leistungsdurchlauf für das Release-Profil (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) für den Ziel-SHA. Die Kova-Ausgabe verbleibt in den Workflow-Artefakten, und der untergeordnete Workflow muss nachweisen, dass seine Berichtsveröffentlichung übersprungen wurde. Nur für `rerun_group=all` oder `rerun_group=performance` erforderlich und blockierend; für engere Gruppen zur erneuten Ausführung nicht erforderlich.<br />**Erneute Ausführung:** `rerun_group=performance`. |
| Übergeordnete Prüfkomponente | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Prüft die aufgezeichneten Ergebnisse der untergeordneten Durchläufe erneut und fügt Tabellen der langsamsten Jobs aus den untergeordneten Workflows an.<br />**Erneute Ausführung:** Führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagener untergeordneter Workflow erfolgreich erneut ausgeführt wurde.                                                                                                                                                                                                                                                                 |

Der übergeordnete Ablauf startet die Produktleistungsprüfung immer im reinen Artefaktmodus.
`OpenClaw Performance` erlaubt die Veröffentlichung von Berichten nur für geplante Durchläufe oder einen
manuellen Start, bei dem ausdrücklich `publish_reports=true` festgelegt ist. Die Schutzprüfung für den reinen Artefaktmodus
muss erfolgreich abgeschlossen werden und nachweisen, dass der Veröffentlichungsjob übersprungen blieb.
Neue und wiederverwendete Nachweise zeichnen
`controls.performanceReportPublication=artifact-only` auf; die Prüfkomponente und die Auswahl für die Wiederverwendung
lehnen Nachweise ohne den entsprechenden normalisierten Nachweis des untergeordneten Leistungs-Workflows
ab.

Die Prüfkomponente lädt das kanonische Manifest als
`full-release-validation-<run-id>-<run-attempt>` hoch. Die Nachweiswerkzeuge validieren
dessen Artefakt-ID, Digest, erzeugenden Durchlauf und Versuch, bevor sie exakt diese
Artefakt-ID herunterladen. Sie begrenzen die Größe der heruntergeladenen ZIP-Datei, prüfen deren Bytes anhand des REST-
`sha256:`-Digest und lesen den einzigen zulässigen, größenbeschränkten Manifesteintrag als Datenstrom, ohne
das Archiv zu extrahieren. Ein Alias mit stabilem Namen bleibt vorübergehend für ältere
Veröffentlichungsnutzer bestehen. Die Prüfkomponente bevorzugt immer das versuchsqualifizierte Artefakt;
übergangsweise akzeptiert sie den stabilen Namen nur für einen Manifest-v2-Erzeuger im ersten Versuch.
Für spätere Versuche und Manifest v3 lehnt sie diesen veralteten Namen ab.

Für `ref=main` mit `rerun_group=all`, für `release/*`-Referenzen und für Tideclaw-
Alpha-Referenzen ersetzt ein neuerer übergeordneter Durchlauf einen älteren mit derselben Referenz und
Gruppe zur erneuten Ausführung. Wenn der übergeordnete Durchlauf abgebrochen wird, bricht dessen Überwachung alle bereits gestarteten
untergeordneten Workflows ab. Validierungsdurchläufe für Tags und fixierte SHAs
brechen einander nicht ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsames Artefakt `release-package-under-test` vor, wenn paket-
oder Docker-bezogene Phasen es benötigen.

| Phase                    | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel             | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewählte Referenz, optionale erwartete SHA, Profil, Wiederholungsgruppe und Filter für eine gezielte Live-Suite.<br />**Wiederholung:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                       |
| Paketartefakt            | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** paketiert oder ermittelt einen einzelnen Tarball-Kandidaten und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Wiederholung:** die betroffene Paket-, betriebssystemübergreifende oder Live-/E2E-Gruppe.                                                                                                                                                                                                                              |
| Installations-Smoke-Test | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Images aus dem Root-Dockerfile, QR-Paketinstallation, Root- und Gateway-Docker-Smoke-Tests, Docker-Tests des Installationsprogramms sowie Smoke-Test des Image-Providers bei globaler Bun-Installation.<br />**Wiederholung:** `rerun_group=install-smoke`.                                                                                                                                                              |
| Betriebssystemübergreifend | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Neuinstallations- und Upgrade-Testläufe unter Linux, Windows und macOS für den ausgewählten Provider und Modus unter Verwendung des Tarball-Kandidaten sowie eines Basispakets.<br />**Wiederholung:** `rerun_group=cross-os`.                                                                                                                                                                                                                       |
| Repository- und Live-E2E | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Modell-, Backend- und Gateway-Testumgebungen, ausgewählt anhand von `release_profile`.<br />**Ausführung:** `run_release_soak=true`, `release_profile=full` oder gezielt mit `rerun_group=live-e2e`.<br />**Wiederholung:** `rerun_group=live-e2e`, optional mit `live_suite_filter`.                                                   |
| Docker-Release-Pfad      | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Blöcke des Release-Pfads mit dem gemeinsamen Paketartefakt.<br />**Ausführung:** `run_release_soak=true`, `release_profile=full` oder gezielt mit `rerun_group=live-e2e`.<br />**Wiederholung:** `rerun_group=live-e2e`.                                                                                                                                                                                                                   |
| Paketabnahme             | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Testdaten für Plugin-Pakete, Plugin-Aktualisierung, der kanonische Paket-E2E-Test mit simuliertem OpenAI und Telegram sowie Überlebensprüfungen nach einem Upgrade von veröffentlichten Versionen mit demselben Tarball. Blockierende Release-Prüfungen verwenden standardmäßig die neueste veröffentlichte Basisversion; Dauertests (`run_release_soak=true`) erweitern dies auf die letzten 4 stabilen npm-Releases sowie 3 festgelegte historische Versionen (`2026.4.23`, `2026.5.2`, `2026.4.15`), die mit Upgrade-Testdaten zu gemeldeten Problemen ausgeführt werden.<br />**Wiederholung:** `rerun_group=package`. |
| Reifegrad-Scorecard      | **Job:** `Render maturity scorecard release docs`<br />**Zugrunde liegender Workflow:** `maturity-scorecard.yml`<br />**Tests:** rendert die beratenden Dokumente der Reifegrad-Scorecard anhand der Zielreferenz. Wird nur ausgeführt, wenn `run_maturity_scorecard=true` übergeben wird.<br />**Wiederholung:** `rerun_group=qa` mit `run_maturity_scorecard=true`.                                                                                                                                                                                                                         |
| QA-Parität               | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** agentenbasierte Paritätspakete für Kandidat und Basisversion, anschließend der Paritätsbericht.<br />**Wiederholung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                   |
| QA-Laufzeitparität       | **Job:** `Run QA Lab runtime parity lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** ein agentenbasierter Paritätstestlauf für das Laufzeitpaar `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), einschließlich einer Standardstufe und, bei `run_release_soak=true`, einer Dauerteststufe. Hinweis: Einzelne Fehler blockieren den Prüfer der Release-Prüfungen nicht.<br />**Wiederholung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                  |
| QA-Abdeckung der Laufzeitwerkzeuge | **Job:** `Enforce QA Lab runtime tool coverage`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** dynamische Abweichungen der Werkzeuge zwischen `openclaw` und `codex` in der Standardstufe der Laufzeitparität (`pnpm openclaw qa coverage --tools`) unter Verwendung der Ausgabe des QA-Laufzeitparitätstestlaufs. Blockierend: Dieser Job kann nicht als rein beratend überschrieben werden.<br />**Wiederholung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                              |
| QA-Live-Matrix           | **Job:** `Run QA Lab live Matrix lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Wiederholung:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                          |
| QA-Live-Telegram         | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit zeitlich begrenzten Convex-CI-Anmeldedaten.<br />**Wiederholung:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                         |
| Release-Prüfer           | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Jobs der Release-Prüfung für die ausgewählte Wiederholungsgruppe.<br />**Wiederholung:** erneut ausführen, nachdem die gezielten untergeordneten Jobs erfolgreich waren.                                                                                                                                                                                                                                                                                                  |

## Docker-Blöcke des Release-Pfads

Die Phase des Docker-Release-Pfads führt diese Blöcke aus, wenn
`live_suite_filter` leer ist:

| Block                                                           | Abdeckung                                                                                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Zentrale Docker-Smoke-Testläufe für den Release-Pfad.                                                                       |
| `package-update-openai`                                         | Installations- und Aktualisierungsverhalten des OpenAI-Pakets, bedarfsgesteuerte Codex-Installation, Live-Durchläufe des Codex-Plugins und Werkzeugaufrufe über Chat Completions. |
| `package-update-anthropic`                                      | Installations- und Aktualisierungsverhalten des Anthropic-Pakets.                                                           |
| `package-update-core`                                           | Provider-neutrales Paket- und Aktualisierungsverhalten.                                                                     |
| `plugins-runtime-plugins`                                       | Plugin-Laufzeittestläufe, die das Plugin-Verhalten prüfen.                                                                  |
| `plugins-runtime-services`                                      | Dienstgestützte und Live-Plugin-Laufzeittestläufe.                                                                          |
| `plugins-runtime-install-a` bis `plugins-runtime-install-h`     | Für die parallele Release-Validierung aufgeteilte Blöcke für Plugin-Installation und -Laufzeit.                             |
| `openwebui`                                                     | OpenWebUI-Kompatibilitäts-Smoke-Test, der bei Bedarf auf einem dedizierten Runner mit großem Datenträger isoliert wird.      |

Verwenden Sie im wiederverwendbaren Live-/E2E-Workflow gezielt
`docker_lanes=<lane[,lane]>`, wenn nur ein Docker-Testlauf fehlgeschlagen ist.
Die Release-Artefakte enthalten, sofern verfügbar, für jeden Testlauf
Wiederholungsbefehle mit Eingaben zur Wiederverwendung des Paketartefakts und
Images.

## Release-Profile

`release_profile` steuert hauptsächlich den Umfang der Live-/Provider-Abdeckung innerhalb der Release-Prüfungen.
Es entfernt weder die normale vollständige CI noch Plugin-Vorabveröffentlichung, Installations-Smoke-Test, Paketakzeptanz
oder QA Lab. Die Profile `stable` und `full` führen stets eine umfassende Repo-/Live-
E2E-Abdeckung sowie Dauerprüfungen des Docker-Release-Pfads aus. Das Profil `beta` kann diese mit
`run_release_soak=true` aktivieren. Die Paketakzeptanz stellt für jeden vollständigen Kandidaten den kanonischen Paket-
Telegram-E2E-Test bereit, sodass der übergeordnete Workflow diesen
Live-Poller nicht dupliziert.

| Profil   | Vorgesehene Verwendung                   | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                                          |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `beta`   | Schnellster releasekritischer Smoke-Test. | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway für OpenAI.                                         |
| `stable` | Standardprofil für die Release-Freigabe. | `beta` plus Anthropic-Smoke-Test, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bindung, Docker-Codex-Harness, Docker-Subagent-Ankündigung und ein OpenCode-Go-Smoke-Shard. |
| `full`   | Breite informative Prüfung.             | `stable` plus informative Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                                               |

## Nur in `full` enthaltene Ergänzungen

Diese Testsuiten werden von `stable` übersprungen und sind in `full` enthalten:

| Bereich                          | Nur in `full` enthaltene Abdeckung                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                           |
| Docker-Live-Gateway              | Informative Provider, aufgeteilt in DeepSeek-/Fireworks-, OpenCode-Go-/OpenRouter- und xAI-/Z.ai-Shards.                   |
| Native Gateway-Provider-Profile  | Vollständige Anthropic-Opus- und Sonnet-/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A–K, L–N, sonstige O–Z, Moonshot und xAI.                                                                           |
| Native Medien-Live-Shards        | Audio-, Google-Musik-, MiniMax-Musik- und Videogruppen A–D.                                                                 |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiter angelegten
Anthropic- und OpenCode-Go-Modell-Shards. Gezielte Wiederholungen können weiterhin die
zusammengefassten Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwenden.

## Gezielte Wiederholungen

Verwenden Sie `rerun_group`, um die Wiederholung nicht betroffener Release-Umgebungen zu vermeiden:

| Handle              | Umfang                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `all`               | Alle Phasen der vollständigen Release-Validierung.                                               |
| `ci`                | Nur untergeordneter manueller vollständiger CI-Lauf.                                             |
| `plugin-prerelease` | Nur untergeordneter Lauf der Plugin-Vorabveröffentlichung.                                       |
| `release-checks`    | Alle Phasen der OpenClaw-Release-Prüfungen.                                                      |
| `install-smoke`     | Installations-Smoke-Test einschließlich Release-Prüfungen.                                       |
| `cross-os`          | Betriebssystemübergreifende Release-Prüfungen.                                                   |
| `live-e2e`          | Repo-/Live-E2E- und Docker-Release-Pfad-Validierung.                                             |
| `package`           | Paketakzeptanz.                                                                                  |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                                                   |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                                               |
| `qa-live`           | QA-Live-Lanes für Matrix/Telegram sowie bei Aktivierung geschützte Lanes für Discord, WhatsApp und Slack. |
| `npm-telegram`      | Telegram-E2E-Test für das veröffentlichte Paket; erfordert `release_package_spec` oder `npm_telegram_package_spec`. |
| `performance`       | Nur Nachweise zur Produktleistung.                                                               |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine einzelne Live-Testsuite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Das Handle `live-gateway-advisory-docker` ist ein zusammengefasstes Wiederholungs-Handle für seine
drei Provider-Shards und verzweigt daher weiterhin auf alle informativen Docker-Gateway-Jobs.

Verwenden Sie `cross_os_suite_filter` mit `rerun_group=cross-os`, wenn eine einzelne betriebssystemübergreifende Lane
fehlgeschlagen ist. Der Filter akzeptiert eine Betriebssystem-ID, eine Testsuite-ID oder ein Betriebssystem-/Testsuite-Paar, zum
Beispiel `windows/packaged-upgrade`, `windows` oder `packaged-fresh`. Betriebssystemübergreifende
Zusammenfassungen enthalten phasenbezogene Zeitangaben für Lanes mit Paket-Upgrade, und lang laufende
Befehle geben Heartbeat-Zeilen aus, sodass eine blockierte Aktualisierung bereits vor dem
Job-Zeitlimit sichtbar ist.

Fehler bei QA-Release-Prüfungen blockieren die normale Release-Validierung. Die Prüfung der
QA-Laufzeit-Tool-Abdeckung (dynamische Tool-Abweichung zwischen `openclaw` und `codex` in der
Standardstufe) blockiert ebenfalls die Verifizierung der Release-Prüfungen, obwohl die
zugrunde liegende QA-Laufzeitparitäts-Lane informativ ist. Tideclaw-Alpha-Läufe können
Release-Prüfungs-Lanes, die nicht die Paketsicherheit betreffen, weiterhin als informativ behandeln. Bei
`release_profile=beta` sind die Live-Provider-Testsuiten der Validierung `Run repo/live E2E validation`
informativ: Modellbereitstellungen von Drittanbietern ändern sich unabhängig von einem Release, daher
weist `beta` auf deren Fehler als Warnungen hin, während die Profile `stable` und `full`
sie weiterhin als blockierend behandeln. Wenn
`live_suite_filter` ausdrücklich eine geschützte QA-Live-Lane wie Discord,
WhatsApp oder Slack anfordert, muss die entsprechende Repo-Variable `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`
aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl, anstatt die Lane stillschweigend zu überspringen.
Führen Sie `rerun_group=qa`, `qa-parity` oder `qa-live` erneut aus, wenn Sie
aktuelle QA-Nachweise benötigen.

## Aufzubewahrende Nachweise

Bewahren Sie die Zusammenfassung `Full Release Validation` als Index auf Release-Ebene auf. Sie verknüpft
die IDs der untergeordneten Läufe und enthält Tabellen mit den langsamsten Jobs. Untersuchen Sie bei Fehlern
zuerst den untergeordneten Workflow und führen Sie anschließend das kleinste passende Handle von oben erneut aus.

Nützliche Artefakte:

- `release-package-under-test` aus `OpenClaw Release Checks`
- Artefakte des Docker-Release-Pfads unter `.artifacts/docker-tests/`
- `package-under-test` der Paketakzeptanz und Docker-Akzeptanzartefakte
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
