---
doc-schema-version: 1
read_when:
    - Ausführen oder erneutes Ausführen der vollständigen Release-Validierung
    - Vergleich der Validierungsprofile für stabile und vollständige Releases
    - Fehlerbehebung bei Fehlern in der Release-Validierungsphase
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-07-24T04:08:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddf165d5515f4b9bb11d239382649d332d20bb8a32bd4492ae99092fb5ee2216
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist die übergeordnete Produktvalidierung für Releases. Die meisten Arbeiten
finden in untergeordneten Workflows statt, sodass eine fehlgeschlagene Box erneut ausgeführt werden kann, ohne den
gesamten Release neu zu starten. Führen Sie die Release-Vorbereitung aus, bevor Sie den Code-SHA festschreiben; sie
aktualisiert die Gebietsschema-Ausgabe der Control UI, wenn der Hintergrund-Bot sie noch nicht
übernommen hat, und erzwingt anschließend dieselbe strikte Prüfung auf null Fallbacks, die von der Release-CI verwendet wird.

Schreiben Sie den produktvollständigen Commit vor dem Changelog als **Code-SHA** fest und führen Sie dann Folgendes aus:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` akzeptiert für das betriebssystemübergreifende Onboarding und den
End-to-End-Agentendurchlauf außerdem `anthropic` oder `minimax`. Das Hilfsprogramm leitet das Profil `beta` aus Alpha-/Beta-
Paketversionen und andernfalls `stable` ab. Übergeben Sie alternative Workflow-Eingaben mit
`-f key=value`; verwenden Sie `-f release_profile=full` nur für die umfassende Prüfung von Hinweisen.

Das Hilfsprogramm erstellt eine temporäre `release-ci/*`-Referenz, die auf genau einen vertrauenswürdigen
`origin/main`-Workflow-SHA festgelegt ist, übergibt den Ziel-SHA nur als Kandidaten `ref`
und löscht die temporäre Referenz nach der Validierung. Jeder gestartete untergeordnete Workflow muss
denselben Workflow-SHA melden. Übergeben Sie
`-f reuse_evidence=false`, um einen neuen Durchlauf zu erzwingen, oder
`--workflow-sha <trusted-main-sha>`, um einen älteren Workflow-Commit auszuwählen, der weiterhin
über den aktuellen `origin/main` erreichbar ist. Der Workflow erstellt oder aktualisiert selbst niemals
Repository-Referenzen.

## Ausnahme für Extended Stable

Für die Veröffentlichung von Extended Stable ist ein Durchlauf erforderlich, bei dem sowohl der Workflow als auch das Ziel der
kanonische Branch sind:

```bash
gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

Verwenden Sie weder `pnpm ci:full-release` noch `release-ci/*`. Die Veröffentlichung bindet den
Branch des Durchlaufs, den Head-/Ziel-SHA, das Manifest `workflowRef`, die ID und den Versuch an den kanonischen
Branch und Release-Commit.

Portieren Sie Produktfehler zurück; nehmen Sie für Werkzeuge des festgeschriebenen Ziels die kleinste verhaltenserhaltende Reparatur vor;
wiederholen Sie Provider-, Genehmigungs- oder Runner-Fehler ohne eine
Quellcodeänderung. Jede Branch-Änderung erfordert einen vollständig neuen Durchlauf. Lassen Sie erforderliches
Paket-, Installationsprogramm-, Aktualisierungs-, Kanal- oder Live-Verhalten nicht aus, nur weil das Ziel alt ist.

Wenn bei einem regulären Release der Code-SHA grün ist, generieren und committen Sie ausschließlich
`CHANGELOG.md`. Dieser neue Commit ist der **Release-SHA**. Führen Sie dasselbe Hilfsprogramm für
den Release-SHA aus. Produktnachweise werden nur wiederverwendet, wenn GitHub nachweist, dass der Release-
SHA vom Code-SHA abstammt und die vollständige Menge geänderter Pfade genau
`CHANGELOG.md` entspricht; der npm-Preflight und die Paket-/Installationsakzeptanz werden weiterhin auf dem
Release-SHA ausgeführt.

`release_profile=stable` und `release_profile=full` führen stets den umfassenden
Live-/Docker-Dauertest aus. Übergeben Sie `run_release_soak=true`, um dieselben Dauertest-Lanes
mit dem Profil `beta` einzubeziehen. Die Stable-Veröffentlichung weist ein Validierungsmanifest
ohne diesen Dauertest und blockierende Nachweise zur Produktleistung zurück.

Package Acceptance erstellt den Kandidaten-Tarball normalerweise aus dem aufgelösten
`ref`, einschließlich Durchläufen mit vollständigem SHA, die mit `pnpm ci:full-release` gestartet wurden. Übergeben Sie nach einer
Beta-Veröffentlichung `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, um
das ausgelieferte npm-Paket für Release-Prüfungen, Package Acceptance, betriebssystemübergreifende Prüfungen,
Docker-Prüfungen des Release-Pfads und Paket-Telegram wiederzuverwenden. Verwenden Sie `package_acceptance_package_spec`
nur, wenn Package Acceptance absichtlich ein anderes Paket nachweisen soll.
Die Live-Paket-Lane des Codex-Plugins folgt demselben Zustand: Veröffentlichte
`release_package_spec`-Werte leiten `codex_plugin_spec=npm:@openclaw/codex@<version>` ab;
SHA-/Artefakt-Durchläufe packen `extensions/codex` aus der ausgewählten Referenz; und Bediener
können `codex_plugin_spec` direkt für Plugin-Quellen vom Typ `npm:`, `npm-pack:` oder `git:`
festlegen. Die Lane erteilt die ausdrückliche Genehmigung zur Installation der Codex CLI, die von
diesem Plugin benötigt wird, und führt anschließend den Codex-CLI-Preflight sowie OpenAI-Agentendurchläufe in derselben Sitzung aus.
Ihr abschließender Durchlauf ohne Wiederholungsversuch und mit mittlerer Denktiefe sendet sichtbaren Fortschritt bei ausgelassenem
Codex `final`, liest zufällig ausgewählte Workspace-Eingaben, schreibt deren exaktes Artefakt
und sendet einen ausdrücklichen Abschluss. Dadurch wird die Regression in v2026.7.1 erkannt, bei der das
Senden eines gewöhnlichen Fortschritts den Durchlauf beendete.

## Phasen der obersten Ebene

Für `rerun_group=all` wird zuerst ein `Check for reusable validation evidence`-Job
ausgeführt. Er sucht nach der neuesten vorherigen grünen vollständigen Validierung mit demselben Release-
Profil, derselben effektiven Dauertest-Einstellung und denselben Validierungseingaben. Wiederholungen mit identischem Ziel verwenden
`exact-target-full-validation-v1`. Ein Nachfolger, dessen vollständiges Delta genau
`CHANGELOG.md` entspricht, verwendet `changelog-only-release-v1`; jede Produkt-Lane wird übersprungen,
und der Verifizierer prüft unabhängig den GitHub-Commit-Vergleich, das unveränderliche
übergeordnete Artefakt, die untergeordneten Durchläufe und die Startprotokolle erneut. Jede andere Zieländerung erfordert
eine neue Code-SHA-Validierung. Übergeben Sie `reuse_evidence=false`, um einen neuen vollständigen
Durchlauf zu erzwingen. Die Wiederverwendung von Nachweisen erfolgt nur über `main` oder eine kanonische, auf einen SHA festgelegte
`release-ci/*`-Referenz, deren Workflow-Commit Teil der vertrauenswürdigen `main`-Abstammung bleibt;
andere Workflow-Referenzen führen die ausgewählten Lanes neu aus.

Eine neue paketbezogene Validierung bereitet ein unveränderliches Tarball sowie ein Docker-
Image-Artefakt vor, bevor Plugin Prerelease und OpenClaw Release Checks gestartet werden.
Beide untergeordneten Workflows überprüfen vor der Verwendung denselben Paket-SHA, dieselben Artefakt-IDs, Service-Digests,
denselben Versuch des erzeugenden Durchlaufs und denselben Digest des Docker-Archivs. Die paketunabhängige
reine Docker-Schicht verwendet einen inhaltsadressierten GHCR-Cache; kandidatenspezifische Images
bleiben unveränderliche GitHub-Artefakte. Fokussierte Durchläufe mit einer expliziten veröffentlichten
Paketspezifikation behalten stattdessen den bestehenden Paketpfad bei.

Ebenfalls für `rerun_group=all` erstellt ein `Verify Docker runtime image assets`-Job
das Docker-Ziel `runtime-assets` mit
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Er wird parallel zu den
anderen Phasen ausgeführt und vom übergeordneten Verifizierer erzwungen; Lanes warten vor dem
Start nicht mehr darauf. Ein enger gefasster `rerun_group` überspringt diesen Preflight.

| Phase                   | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung           | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet die ausgewählten Eingaben auf.<br />**Wiederholung:** Wiederholen Sie den übergeordneten Workflow, wenn dies fehlschlägt.                                                                                                                                                                                                                                                                                                            |
| Gemeinsamer Kandidat    | **Job:** `Prepare shared release candidate`<br />**Untergeordneter Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Nachweis:** Packt und validiert ein Paket für genau einen SHA, erstellt ein funktionsfähiges Docker-Image und zeichnet unveränderliche Tupel aus Paket- und Image-Artefakten für beide paketbezogenen untergeordneten Workflows auf.<br />**Wiederholung:** Wiederholen Sie die betroffene Paket-, Plugin-Prerelease-, betriebssystemübergreifende oder Live-/E2E-Gruppe.                                                                                                                 |
| Preflight der Docker-Assets | **Job:** `Verify Docker runtime image assets`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Das Docker-Build-Ziel `runtime-assets` ist weiterhin erfolgreich, bevor eine andere Phase gestartet wird. Wird nur für `rerun_group=all` ausgeführt.<br />**Wiederholung:** Wiederholen Sie den übergeordneten Workflow mit `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest und normale CI   | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Nachweis:** Manueller vollständiger CI-Graph für die Zielreferenz, einschließlich Linux-Node-Lanes, Shards gebündelter Plugins, Shards für Plugin- und Kanalverträge, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Tests für erstellte Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den übergeordneten Workflow.<br />**Wiederholung:** `rerun_group=ci`.                                                                                          |
| Plugin-Prerelease       | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Nachweis:** Release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Shards für Plugin-Batches, Docker-Lanes für Plugin-Prereleases und ein nicht blockierendes `plugin-inspector-advisory`-Artefakt für die Kompatibilitäts-Triage.<br />**Wiederholung:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Release-Prüfungen       | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Nachweis:** Installations-Smoke-Test, betriebssystemübergreifende Paketprüfungen, Package Acceptance, QA-Lab-Parität, Live-Matrix und -Telegram sowie durch Gates geschützte Hinweis-Lanes für Discord, WhatsApp und Slack. Stable- und vollständige Profile führen außerdem umfassende Live-/E2E-Suites und Docker-Blöcke für den Release-Pfad aus; Beta kann diese mit `run_release_soak=true` aktivieren.<br />**Wiederholung:** `rerun_group=release-checks` oder ein enger gefasster Handle für Release-Prüfungen.              |
| Paket-Telegram          | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Nachweis:** Ein fokussierter Telegram-E2E-Test mit veröffentlichtem Paket, wenn `release_package_spec` oder `npm_telegram_package_spec` festgelegt ist. Die vollständige Kandidatenvalidierung verwendet stattdessen den kanonischen Telegram-E2E-Test von Package Acceptance.<br />**Wiederholung:** `rerun_group=npm-telegram` mit `release_package_spec` oder `npm_telegram_package_spec`.                                                                                                              |
| Produktleistung         | **Job:** `Run product performance evidence`<br />**Untergeordneter Workflow:** `OpenClaw Performance`<br />**Nachweis:** Leistungslauf für das Release-Profil (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) für den Ziel-SHA. Die Kova-Ausgabe verbleibt in Workflow-Artefakten, und der untergeordnete Workflow muss nachweisen, dass sein Berichts-Publisher übersprungen wurde. Nur für `rerun_group=all` oder `rerun_group=performance` erforderlich (blockierend); für enger gefasste Wiederholungsgruppen nicht erforderlich.<br />**Wiederholung:** `rerun_group=performance`. |
| Übergeordneter Verifizierer | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Nachweis:** Prüft die aufgezeichneten Ergebnisse untergeordneter Durchläufe erneut und fügt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Wiederholung:** Wiederholen Sie nur diesen Job, nachdem ein fehlgeschlagener untergeordneter Workflow erfolgreich wiederholt wurde.                                                                                                                                                                                                                                                                 |

Der übergeordnete Workflow startet die Produktleistung stets im reinen Artefaktmodus.
`OpenClaw Performance` erlaubt die Veröffentlichung von Berichten nur für geplante Durchläufe oder einen
manuellen Start, bei dem `publish_reports=true` ausdrücklich festgelegt ist. Der Schutz für den reinen
Artefaktmodus muss erfolgreich abgeschlossen werden und nachweisen, dass der Publisher-Job übersprungen blieb.
Neue und wiederverwendete Nachweise zeichnen
`controls.performanceReportPublication=artifact-only` auf; der Verifizierer und die Auswahl zur Wiederverwendung
weisen Nachweise ohne den passenden normalisierten Nachweis des untergeordneten Performance-Workflows zurück.

Der Verifizierer lädt das kanonische Manifest als
`full-release-validation-<run-id>-<run-attempt>` hoch. Die Nachweis-Tools validieren
dessen Artefakt-ID, Digest, erzeugenden Lauf und Versuch, bevor sie genau diese
Artefakt-ID herunterladen. Sie begrenzen die Größe der heruntergeladenen ZIP-Datei, gleichen deren Bytes mit dem REST-
Digest `sha256:` ab und streamen den einzigen zulässigen, größenbegrenzten Manifesteintrag, ohne
das Archiv zu extrahieren. Für ältere
Veröffentlichungs-Consumer bleibt vorübergehend ein Alias mit stabilem Namen bestehen. Der Verifizierer bevorzugt immer das versuchsqualifizierte Artefakt;
während der Übergangsphase akzeptiert er den stabilen Namen nur für ein Manifest v2,
das beim ersten Versuch erzeugt wurde. Bei späteren Versuchen und für Manifest v3 lehnt er diesen veralteten Namen ab.

Für `ref=main` mit `rerun_group=all`, für `release/*`-Refs und für Tideclaw-
Alpha-Refs ersetzt ein neuerer übergeordneter Lauf einen älteren mit demselben Ref und
derselben Wiederholungslaufgruppe. Wenn der übergeordnete Lauf abgebrochen wird, bricht dessen Monitor alle untergeordneten
Workflows ab, die er bereits gestartet hat. Validierungsläufe für Tags und angeheftete SHAs
brechen einander nicht ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmalig auf und validiert, sofern verfügbar, das gemeinsame Paketartefakt des übergeordneten Workflows. Eine
direkte oder fokussierte Ausführung bereitet ihr eigenes `release-package-under-test`-
Artefakt vor, wenn paket- oder Docker-bezogene Phasen es benötigen.

| Phase                    | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel             | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewählter Ref, optionale erwartete SHA, Profil, Wiederholungslaufgruppe und Filter für fokussierte Live-Suites.<br />**Wiederholungslauf:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Paketartefakt            | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** validiert das unveränderliche Pakettupel des übergeordneten Workflows oder packt einen Tarball-Kandidaten für eine direkte/fokussierte Ausführung der Release-Prüfungen und stellt ihn anschließend nachgelagerten paketbezogenen Prüfungen bereit.<br />**Wiederholungslauf:** die betroffene Paket-, Cross-OS- oder Live-/E2E-Gruppe.                                                                                                                                                                                                                                |
| Installations-Smoke-Test | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Test-Images aus dem Root-Dockerfile, QR-Paketinstallation, Docker-Smoke-Tests für Root und Gateway, Docker-Tests des Installationsprogramms sowie Smoke-Test des Image-Providers für die globale Bun-Installation.<br />**Wiederholungslauf:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Cross-OS                 | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Neuinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus unter Verwendung des Tarball-Kandidaten sowie eines Baseline-Pakets.<br />**Wiederholungslauf:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| Repository- und Live-E2E | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Harnesses für Modelle, Backends und Gateway, ausgewählt durch `release_profile`.<br />**Läufe:** `run_release_soak=true`, `release_profile=full` oder fokussiert `rerun_group=live-e2e`.<br />**Wiederholungslauf:** `rerun_group=live-e2e`, optional mit `live_suite_filter`.                                                                                |
| Docker-Release-Pfad      | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks des Release-Pfads gegen das gemeinsame Paketartefakt.<br />**Läufe:** `run_release_soak=true`, `release_profile=full` oder fokussiert `rerun_group=live-e2e`.<br />**Wiederholungslauf:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Paketabnahme             | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Fixtures für Plugin-Pakete, Plugin-Aktualisierung, das kanonische Paket-E2E für Mock-OpenAI und Telegram sowie Prüfungen, ob Upgrades aus veröffentlichten Versionen mit demselben Tarball weiterhin funktionieren. Blockierende Release-Prüfungen verwenden standardmäßig die zuletzt veröffentlichte Baseline; Langzeitprüfungen (`run_release_soak=true`) erweitern dies auf die letzten 4 stabilen npm-Releases sowie 3 angeheftete historische Versionen (`2026.4.23`, `2026.5.2`, `2026.4.15`) und werden mit Upgrade-Fixtures für gemeldete Probleme ausgeführt.<br />**Wiederholungslauf:** `rerun_group=package`. |
| Reifegrad-Scorecard      | **Job:** `Render maturity scorecard release docs`<br />**Zugrunde liegender Workflow:** `maturity-scorecard.yml`<br />**Tests:** rendert die beratenden Dokumente der Reifegrad-Scorecard gegen den Ziel-Ref. Wird nur ausgeführt, wenn `run_maturity_scorecard=true` übergeben wird.<br />**Wiederholungslauf:** `rerun_group=qa` mit `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| QA-Parität               | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** agentische Paritätspakete für Kandidat und Baseline, anschließend der Paritätsbericht.<br />**Wiederholungslauf:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| QA-Laufzeitparität       | **Job:** `Verify QA Lab runtime-pair lanes`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** die kanonische Core-Lane `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex --runtime-pair-lane core`) und mit `run_release_soak=true` die Langzeit-Lane. Hinweis: Einzelne Lane-Jobs blockieren den Verifizierer der Release-Prüfungen nicht.<br />**Wiederholungslauf:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                             |
| QA-Abdeckung der Laufzeit-Tools | **Job:** `Enforce QA Lab runtime tool coverage`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** dynamische Tool-Abweichung zwischen `openclaw` und `codex` in der kanonischen Core-Laufzeitpaar-Lane (`pnpm openclaw qa coverage --tools`) unter Verwendung der Ausgabe dieser Lane. Blockierend: Dieser Job kann nicht durch eine Einstufung als beratend überschrieben werden.<br />**Wiederholungslauf:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                     |
| QA Live-Matrix           | **Job:** `Run QA Live Matrix profile`<br />**Zugrunde liegender Workflow:** wiederverwendbarer Workflow `QA-Lab - All Lanes`<br />**Tests:** durch Parität bestätigte YAML-Szenarien über den gemeinsamen Matrix-Live-Adapter in der Umgebung `qa-live-shared`.<br />**Wiederholungslauf:** `rerun_group=qa-live` oder `rerun_group=qa`; verwenden Sie `live_suite_filter=qa-live-matrix` für einen fokussierten Matrix-Wiederholungslauf.                                                                                                                                                                                                                    |
| QA Live-Telegram         | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** vertrauenswürdige Ausführung von `OpenClaw Release Telegram QA`<br />**Tests:** Live-QA für Telegram mit Convex-CI-Leases für Anmeldedaten.<br />**Wiederholungslauf:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                 |
| QA Live-Discord          | **Job:** `Run QA Lab live Discord lane`<br />**Zugrunde liegender Workflow:** direkter beratender Job<br />**Tests:** Live-QA für Discord mit Convex-CI-Leases für Anmeldedaten, wenn `OPENCLAW_RELEASE_QA_DISCORD_LIVE_CI_ENABLED` aktiviert ist.<br />**Wiederholungslauf:** `rerun_group=qa-live` mit `live_suite_filter=qa-live-discord`.                                                                                                                                                                                                                                                                            |
| QA Live-WhatsApp         | **Job:** `Run QA Lab live WhatsApp lane`<br />**Zugrunde liegender Workflow:** direkter beratender Job<br />**Tests:** Live-QA für WhatsApp mit Convex-CI-Leases für Anmeldedaten, wenn `OPENCLAW_RELEASE_QA_WHATSAPP_LIVE_CI_ENABLED` aktiviert ist.<br />**Wiederholungslauf:** `rerun_group=qa-live` mit `live_suite_filter=qa-live-whatsapp`.                                                                                                                                                                                                                                                                        |
| QA Live-Slack            | **Job:** `Run QA Lab live Slack lane`<br />**Zugrunde liegender Workflow:** direkter beratender Job<br />**Tests:** Live-QA für Slack mit Convex-CI-Leases für Anmeldedaten, wenn `OPENCLAW_RELEASE_QA_SLACK_LIVE_CI_ENABLED` aktiviert ist.<br />**Wiederholungslauf:** `rerun_group=qa-live` mit `live_suite_filter=qa-live-slack`.                                                                                                                                                                                                                                                                                    |
| Release-Verifizierer     | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Jobs der Release-Prüfungen für die ausgewählte Wiederholungslaufgruppe.<br />**Wiederholungslauf:** erneut ausführen, nachdem die fokussierten untergeordneten Jobs erfolgreich waren.                                                                                                                                                                                                                                                                                                                                                                                   |

## Chunks des Docker-Release-Pfads

Die Phase des Docker-Release-Pfads führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                           | Abdeckung                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Smoke-Test-Lanes für den zentralen Docker-Release-Pfad.                                                                                                        |
| `package-update-openai`                                         | Installations-/Aktualisierungsverhalten des OpenAI-Pakets, bedarfsgesteuerte Codex-Installation, Nachverfolgung des Live-Fortschritts des Codex-Plugins und Chat-Completions-Tool-Aufrufe. |
| `package-update-anthropic`                                      | Installations- und Aktualisierungsverhalten des Anthropic-Pakets.                                                                                               |
| `package-update-core`                                           | Provider-neutrales Paket- und Aktualisierungsverhalten.                                                                                                |
| `plugins-runtime-plugins`                                       | Plugin-Laufzeit-Lanes, die Plugin-Verhalten ausführen.                                                                                          |
| `plugins-runtime-services`                                      | Dienstgestützte und Live-Lanes der Plugin-Laufzeit.                                                                                                |
| `plugins-runtime-install-a` bis `plugins-runtime-install-h` | Für die parallele Release-Validierung aufgeteilte Batches für Plugin-Installation/-Laufzeit.                                                                        |
| `openwebui`                                                     | Isolierter OpenWebUI-Kompatibilitäts-Smoke-Test auf einem dedizierten Runner mit großem Datenträger, falls angefordert.                                                      |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten für jede Lane Befehle zur erneuten Ausführung
mit Eingaben zur Wiederverwendung von Paketartefakten und Images, sofern verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich den Umfang der Live-/Provider-Abdeckung innerhalb der Release-Prüfungen.
Es entfernt weder die normale vollständige CI noch Plugin Prerelease, Installations-Smoke-Tests, Paketabnahme
oder QA Lab. Stabile und vollständige Profile führen immer eine umfassende Repo-/Live-
E2E-Abdeckung sowie Belastungstests des Docker-Release-Pfads aus. Das Beta-Profil kann diese mit
`run_release_soak=true` aktivieren. Package Acceptance stellt für jeden vollständigen Kandidaten den kanonischen
Telegram-E2E-Test des Pakets bereit, sodass der übergeordnete Ablauf diesen
Live-Poller nicht dupliziert.

| Profil  | Vorgesehene Verwendung                      | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Schnellster Release-kritischer Smoke-Test.   | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway für OpenAI.                                            |
| `stable` | Standardprofil für die Release-Freigabe. | `beta` plus Anthropic-Smoke-Test, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bindung, Docker-Codex-Harness, Docker-Subagent-Ankündigung und ein OpenCode-Go-Smoke-Shard. |
| `full`   | Breiter beratender Durchlauf.             | `stable` plus beratende Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                                               |

## Nur bei vollständigen Profilen enthaltene Ergänzungen

Diese Suiten werden von `stable` übersprungen und von `full` eingeschlossen:

| Bereich                             | Nur bei vollständigen Profilen enthaltene Abdeckung                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle               | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                          |
| Docker-Live-Gateway              | Beratende Provider, aufgeteilt in die Shards DeepSeek/Fireworks, OpenCode Go/OpenRouter und xAI/Z.ai.                              |
| Provider-Profile des nativen Gateways | Vollständige Anthropic-Opus- und Sonnet-/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A–K, L–N, sonstige O–Z, Moonshot und xAI.                                                                             |
| Native Medien-Live-Shards         | Audio, Google-Musik, MiniMax-Musik und Videogruppen A–D.                                                                   |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiteren
Anthropic- und OpenCode-Go-Modell-Shards. Für gezielte erneute Ausführungen können weiterhin die
aggregierten Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwendet werden.

## Gezielte erneute Ausführungen

Verwenden Sie `rerun_group`, um die Wiederholung nicht zugehöriger Release-Umgebungen zu vermeiden:

| Handle              | Umfang                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Alle Phasen der vollständigen Release-Validierung.                                                             |
| `ci`                | Nur das untergeordnete manuelle vollständige CI-Element.                                                                      |
| `plugin-prerelease` | Nur das untergeordnete Plugin-Prerelease-Element.                                                                   |
| `release-checks`    | Alle Phasen der OpenClaw-Release-Prüfungen.                                                             |
| `install-smoke`     | Vom Installations-Smoke-Test bis zu den Release-Prüfungen.                                                           |
| `cross-os`          | Betriebssystemübergreifende Release-Prüfungen.                                                                        |
| `live-e2e`          | Repo-/Live-E2E- und Docker-Release-Pfad-Validierung.                                               |
| `package`           | Paketabnahme.                                                                             |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                                                   |
| `qa-parity`         | Nur QA-Paritäts-Lanes und -Bericht.                                                                |
| `qa-live`           | QA-Live-Lanes für Matrix/Telegram sowie bei Aktivierung abgesicherte Lanes für Discord, WhatsApp und Slack.             |
| `npm-telegram`      | Telegram-E2E für veröffentlichte Pakete; erfordert `release_package_spec` oder `npm_telegram_package_spec`. |
| `performance`       | Nur Leistungsnachweise des Produkts.                                                              |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Legen Sie für eine gezielte erneute Ausführung eines QA-Transports `rerun_group=qa-live` fest und verwenden Sie den
kanonischen Selektor `qa-live-matrix`, `qa-live-telegram`, `qa-live-discord`,
`qa-live-whatsapp` oder `qa-live-slack`.

Das Handle `live-gateway-advisory-docker` ist ein aggregiertes Handle zur erneuten Ausführung seiner
drei Provider-Shards und verzweigt daher weiterhin auf alle beratenden Docker-Gateway-Jobs.

Verwenden Sie `cross_os_suite_filter` mit `rerun_group=cross-os`, wenn eine betriebssystemübergreifende Lane
fehlgeschlagen ist. Der Filter akzeptiert eine Betriebssystem-ID, eine Suite-ID oder ein Betriebssystem-/Suite-Paar,
beispielsweise `windows/packaged-upgrade`, `windows` oder `packaged-fresh`. Betriebssystemübergreifende
Zusammenfassungen enthalten phasenbezogene Zeitangaben für Upgrade-Lanes mit paketierten Artefakten, und lange laufende
Befehle geben Heartbeat-Zeilen aus, sodass eine hängende Aktualisierung vor dem
Job-Timeout sichtbar ist.

Fehler bei QA-Release-Prüfungen blockieren die normale Release-Validierung nur für ausgewählte
Lanes zur Matrix-, Telegram- und QA-Laufzeit-Tool-Abdeckung. QA-Parität, Laufzeit-
Parität und die abgesicherten Live-Lanes für Discord, WhatsApp und Slack sind beratend und
veröffentlichen Statusartefakte, ohne den Release-Verifizierer zu blockieren. Tideclaw-
Alpha-Ausführungen können Release-Prüfungs-Lanes, die nicht der Paketsicherheit dienen, weiterhin als beratend behandeln. Mit
`release_profile=beta` sind die Live-Provider-Suiten `Run repo/live E2E validation`
beratend: Bereitstellungen von Drittanbieter-Modellen ändern sich während eines Releases, daher
zeigt Beta ihre Fehler als Warnungen an, während stabile und vollständige Profile sie weiterhin
blockierend behandeln. Wenn
`live_suite_filter` ausdrücklich eine abgesicherte QA-Live-Lane wie Discord,
WhatsApp oder Slack anfordert, muss die entsprechende Repo-
Variable `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` aktiviert sein; andernfalls schlägt die Eingabeerfassung fehl, statt die Lane stillschweigend zu überspringen.
Führen Sie `rerun_group=qa`, `qa-parity` oder `qa-live` erneut aus, wenn Sie
aktuelle QA-Nachweise benötigen.

## Aufzubewahrende Nachweise

Bewahren Sie die Zusammenfassung `Full Release Validation` als Index auf Release-Ebene auf. Sie verlinkt
die IDs untergeordneter Ausführungen und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den
untergeordneten Workflow und führen Sie anschließend das kleinste passende Handle oben erneut aus.

Zeichnen Sie für ein reguläres Release sowohl den Code-SHA als auch den Release-SHA, die Wiederverwendungsrichtlinie
und die Menge der geänderten Pfade, die erfolgreiche übergeordnete Ausführung des Code-SHA und die leichtgewichtige übergeordnete
Ausführung des Release-SHA auf. Zeichnen Sie für Extended Stable den kanonischen Branch, den exakten Release-
SHA, die ID und den Versuch der neuen übergeordneten Ausführung, die Workflow-Referenz, jede untergeordnete Ausführung sowie jede
Kompatibilitätsreparatur für eingefrorene Ziele oder absichtliche Auslassung auf.

Nützliche Artefakte:

- `release-package-under-test` aus `OpenClaw Release Checks`
- Artefakte des Docker-Release-Pfads unter `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` und Docker-Abnahmeartefakte
- Artefakte betriebssystemübergreifender Release-Prüfungen für jedes Betriebssystem und jede Suite
- QA-Parität, Laufzeitparität und ausgewählte Artefakte für Matrix, Telegram, Discord, WhatsApp,
  oder Slack

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
