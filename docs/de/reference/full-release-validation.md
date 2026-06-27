---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Stabile und vollständige Release-Validierungsprofile vergleichen
    - Fehler in Release-Validierungsphasen debuggen
summary: Vollständige Release-Validierungsstufen, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-06-27T18:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist der Release-Rahmen. Es ist der einzige manuelle
Einstiegspunkt für den Pre-Release-Nachweis, aber die meiste Arbeit geschieht in
untergeordneten Workflows, damit ein fehlgeschlagener Rechner erneut ausgeführt
werden kann, ohne den gesamten Release neu zu starten.

Führen Sie ihn von einer vertrauenswürdigen Workflow-Referenz aus, normalerweise
`main`, und übergeben Sie den Release-Branch, das Tag oder die vollständige
Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Referenz für
das Test-Harness und die Eingabe `ref` für den zu testenden Kandidaten. Dadurch
bleibt neue Validierungslogik verfügbar, wenn ein älterer Release-Branch oder
ein älteres Tag validiert wird.

`release_profile=stable` und `release_profile=full` führen immer den
vollständigen Live-/Docker-Dauerlauf aus. Übergeben Sie
`run_release_soak=true`, um dieselben Dauerlauf-Lanes mit dem Beta-Profil
einzubeziehen. Die Stable-Veröffentlichung weist ein Validierungsmanifest ohne
diesen Dauerlauf und blockierende Nachweise zur Produktleistung zurück.

Package Acceptance baut das Kandidaten-Tarball normalerweise aus dem aufgelösten
`ref`, einschließlich vollständiger SHA-Läufe, die mit `pnpm ci:full-release`
ausgelöst wurden. Nach einer Beta-Veröffentlichung übergeben Sie
`release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, um das veröffentlichte
npm-Paket über Release-Prüfungen, Package Acceptance, plattformübergreifende
Prüfungen, Release-Pfad-Docker und Paket-Telegram hinweg wiederzuverwenden.
Verwenden Sie `package_acceptance_package_spec` nur, wenn Package Acceptance
absichtlich ein anderes Paket nachweisen soll. Die Live-Paket-Lane des Codex
Plugins folgt demselben Zustand: veröffentlichte `release_package_spec`-Werte
leiten `codex_plugin_spec=npm:@openclaw/codex@<version>` ab; SHA-/Artefaktläufe
packen `extensions/codex` aus der ausgewählten Referenz; und Operatoren können
`codex_plugin_spec` direkt für Plugin-Quellen vom Typ `npm:`, `npm-pack:` oder
`git:` setzen. Die Lane erteilt die explizite Installationsgenehmigung für die
Codex CLI, die dieses Plugin verlangt, und führt dann den Codex-CLI-Preflight
sowie OpenAI-Agent-Turns in derselben Sitzung aus.

## Top-Level-Phasen

| Phase                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zielauflösung        | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** löst den Release-Branch, das Tag oder die vollständige Commit-SHA auf und zeichnet die ausgewählten Eingaben auf.<br />**Erneut ausführen:** Führen Sie den Rahmen erneut aus, wenn dies fehlschlägt.                                                                                                                                                                |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Belegt:** manueller vollständiger CI-Graph gegen die Zielreferenz, einschließlich Linux-Node-Lanes, Shards für gebündelte Plugins, Shards für Plugin- und Channel-Verträge, Node-22-Kompatibilität, `check-*`, `check-additional-*`, Smoke-Checks für gebaute Artefakte, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den Rahmen.<br />**Erneut ausführen:** `rerun_group=ci`. |
| Plugin-Prerelease    | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Belegt:** release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Erweiterungs-Batch-Shards, Plugin-Prerelease-Docker-Lanes und ein nicht blockierendes Artefakt `plugin-inspector-advisory` für die Kompatibilitätstriage.<br />**Erneut ausführen:** `rerun_group=plugin-prerelease`.                                |
| Release-Prüfungen    | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Belegt:** Installations-Smoke, plattformübergreifende Paketprüfungen, Package Acceptance, QA-Lab-Parität, Live-Matrix und Live-Telegram. Stable- und Full-Profile führen außerdem vollständige Live-/E2E-Suites und Docker-Release-Pfad-Chunks aus; Beta kann dies mit `run_release_soak=true` aktivieren.<br />**Erneut ausführen:** `rerun_group=release-checks` oder ein enger gefasster Release-Checks-Handle. |
| Paket-Telegram       | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Belegt:** ein fokussiertes Telegram-E2E für veröffentlichte Pakete, wenn `release_package_spec` oder `npm_telegram_package_spec` gesetzt ist. Die vollständige Kandidatenvalidierung verwendet stattdessen das kanonische Package-Acceptance-Telegram-E2E.<br />**Erneut ausführen:** `rerun_group=npm-telegram` mit `release_package_spec` oder `npm_telegram_package_spec`. |
| Rahmen-Verifizierer  | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** prüft die aufgezeichneten Ergebnisse untergeordneter Läufe erneut und hängt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneut ausführen:** Führen Sie nur diesen Job erneut aus, nachdem Sie ein fehlgeschlagenes untergeordnetes Element erfolgreich erneut ausgeführt haben.                                                                 |

Für `ref=main` und `rerun_group=all` ersetzt ein neuerer Rahmen einen älteren.
Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle
untergeordneten Workflows ab, die er bereits ausgelöst hat. Validierungsläufe für
Release-Branches und Tags brechen sich standardmäßig nicht gegenseitig ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das
Ziel einmal auf und bereitet ein gemeinsames Artefakt
`release-package-under-test` vor, wenn paket- oder Docker-bezogene Phasen es
benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel        | **Job:** `Resolve target ref`<br />**Zugehöriger Workflow:** keiner<br />**Tests:** ausgewählte Ref, optionale erwartete SHA, Profil, Gruppe für erneute Läufe und fokussierter Filter für Live-Suites.<br />**Erneuter Lauf:** `rerun_group=release-checks`.                                                                                                                                                                                                                                     |
| Paketartefakt       | **Job:** `Prepare release package artifact`<br />**Zugehöriger Workflow:** keiner<br />**Tests:** packt oder löst einen Kandidaten-Tarball auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Erneuter Lauf:** die betroffene Paket-, Cross-OS- oder Live/E2E-Gruppe.                                                                                                                                                                               |
| Installations-Smoke | **Job:** `Run install smoke`<br />**Zugehöriger Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Images aus dem Root-Dockerfile, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Globalinstallations-Smoke für Image-Provider und schnelles E2E für Installation/Deinstallation gebündelter Plugins.<br />**Erneuter Lauf:** `rerun_group=install-smoke`.                                      |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Zugehöriger Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Frischinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus, mit dem Kandidaten-Tarball plus einem Baseline-Paket.<br />**Erneuter Lauf:** `rerun_group=cross-os`.                                                                                                                                             |
| Repo und Live-E2E   | **Job:** `Run repo/live E2E validation`<br />**Zugehöriger Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Harnesses für Live-Modelle/Backend/Gateway, ausgewählt durch `release_profile`.<br />**Läuft bei:** `run_release_soak=true`, `release_profile=full` oder fokussiertem `rerun_group=live-e2e`.<br />**Erneuter Lauf:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Zugehöriger Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Blöcke für den Release-Pfad gegen das gemeinsame Paketartefakt.<br />**Läuft bei:** `run_release_soak=true`, `release_profile=full` oder fokussiertem `rerun_group=live-e2e`.<br />**Erneuter Lauf:** `rerun_group=live-e2e`.                                                                                                                       |
| Paketabnahme        | **Job:** `Run package acceptance`<br />**Zugehöriger Workflow:** `Package Acceptance`<br />**Tests:** Offline-Plugin-Paket-Fixtures, Plugin-Update, das kanonische Mock-OpenAI-Telegram-Paket-E2E und Survivor-Prüfungen für veröffentlichte Upgrades gegen denselben Tarball. Blockierende Release-Prüfungen verwenden die standardmäßige zuletzt veröffentlichte Baseline; Soak-Prüfungen erweitern dies auf jede stabile npm-Veröffentlichung ab `2026.4.23` plus Fixtures für gemeldete Issues.<br />**Erneuter Lauf:** `rerun_group=package`. |
| QA-Parität          | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugehöriger Workflow:** direkte Jobs<br />**Tests:** kandidat- und baselinebasierte Agentic-Paritätspakete, anschließend der Paritätsbericht.<br />**Erneuter Lauf:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                        |
| QA Live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Zugehöriger Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Erneuter Lauf:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                          |
| QA Live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Zugehöriger Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Zugangsdaten-Leases.<br />**Erneuter Lauf:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                     |
| Release-Verifier    | **Job:** `Verify release checks`<br />**Zugehöriger Workflow:** keiner<br />**Tests:** erforderliche Release-Check-Jobs für die ausgewählte Gruppe für erneute Läufe.<br />**Erneuter Lauf:** erneut ausführen, nachdem fokussierte untergeordnete Jobs bestanden haben.                                                                                                                                                                                                                           |

## Docker-Blöcke für den Release-Pfad

Die Docker-Phase für den Release-Pfad führt diese Blöcke aus, wenn `live_suite_filter`
leer ist:

| Block                                                           | Abdeckung                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-Smoke-Lanes für den Release-Pfad.                                                                                       |
| `package-update-openai`                                         | Installations-/Update-Verhalten des OpenAI-Pakets, bedarfsgesteuerte Codex-Installation, Live-Turns des Codex-Plugins und Chat-Completions-Toolaufrufe. |
| `package-update-anthropic`                                      | Installations- und Update-Verhalten des Anthropic-Pakets.                                                                           |
| `package-update-core`                                           | Provider-neutrales Paket- und Update-Verhalten.                                                                                     |
| `plugins-runtime-plugins`                                       | Plugin-Runtime-Lanes, die Plugin-Verhalten ausführen.                                                                               |
| `plugins-runtime-services`                                      | Service-gestützte und Live-Plugin-Runtime-Lanes; enthält OpenWebUI, wenn angefordert.                                                |
| `plugins-runtime-install-a` bis `plugins-runtime-install-h`     | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung.                                                 |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten Befehle für erneute Läufe
pro Lane mit Eingaben für Paketartefakt und Image-Wiederverwendung, sofern verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich die Live-/Provider-Breite innerhalb der Release-Prüfungen.
Es entfernt keine normale vollständige CI, Plugin Prerelease, Installations-Smoke, Paketabnahme
oder QA Lab. Stabile und vollständige Profile führen immer umfassende Repo/Live-E2E- und
Docker-Soak-Abdeckung für den Release-Pfad aus. Das Beta-Profil kann dies mit
`run_release_soak=true` aktivieren. Paketabnahme liefert das kanonische Paket-Telegram-E2E
für jeden vollständigen Kandidaten, daher dupliziert der Umbrella diesen Live-Poller nicht.

| Profil    | Vorgesehene Verwendung                | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                  |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Schnellster releasekritischer Smoke.  | OpenAI/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.                   |
| `stable`  | Standardprofil für Release-Freigaben. | `minimum` plus Anthropic-Smoke, Google, MiniMax, Backend, nativer Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode-Go-Smoke-Shard. |
| `full`    | Breiter Advisory-Sweep.               | `stable` plus Advisory-Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                         |

## Nur in `full` enthaltene Ergänzungen

Diese Suites werden von `stable` übersprungen und von `full` einbezogen:

| Bereich                          | Nur in `full` enthaltene Abdeckung                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                             |
| Docker-Live-Gateway              | Advisory-Provider, aufgeteilt in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- und xAI/Z.ai-Shards.                            |
| Native Gateway-Provider-Profile  | Vollständige Anthropic-Opus- und Sonnet/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z Sonstige, Moonshot und xAI.                                                                             |
| Native Medien-Live-Shards        | Audio-, Google-Musik-, MiniMax-Musik- und Videogruppen A-D.                                                                   |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiteren
Anthropic- und OpenCode-Go-Modell-Shards. Fokussierte erneute Läufe können weiterhin die
aggregierten Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwenden.

## Fokussierte erneute Läufe

Verwenden Sie `rerun_group`, um die Wiederholung nicht zugehöriger Release-Boxen zu vermeiden:

| Handle              | Umfang                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Alle Stufen der vollständigen Release-Validierung.                                              |
| `ci`                | Nur das manuelle vollständige CI-Child.                                                         |
| `plugin-prerelease` | Nur das Plugin-Prerelease-Child.                                                                |
| `release-checks`    | Alle Stufen der OpenClaw Release Checks.                                                        |
| `install-smoke`     | Install Smoke bis hin zu Release-Checks.                                                        |
| `cross-os`          | Cross-OS-Release-Checks.                                                                        |
| `live-e2e`          | Repo-/Live-E2E und Docker-Validierung des Release-Pfads.                                        |
| `package`           | Package Acceptance.                                                                             |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                                                  |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                                              |
| `qa-live`           | QA-Live-Matrix/Telegram plus aktivierte gated Discord-, WhatsApp- und Slack-Lanes.              |
| `npm-telegram`      | Telegram-E2E für veröffentlichte Pakete; erfordert `release_package_spec` oder `npm_telegram_package_spec`. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs werden im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Der Handle `live-gateway-advisory-docker` ist ein aggregierter Rerun-Handle für seine
drei Provider-Shards, sodass er weiterhin auf alle Advisory-Docker-Gateway-Jobs auffächert.

Verwenden Sie `cross_os_suite_filter` mit `rerun_group=cross-os`, wenn eine Cross-OS-Lane
fehlgeschlagen ist. Der Filter akzeptiert eine OS-ID, eine Suite-ID oder ein OS-/Suite-Paar, zum
Beispiel `windows/packaged-upgrade`, `windows` oder `packaged-fresh`. Cross-OS-
Zusammenfassungen enthalten timings pro Phase für Packaged-Upgrade-Lanes, und lang laufende
Befehle geben Heartbeat-Zeilen aus, damit ein hängendes Windows-Update vor dem
Job-Timeout sichtbar ist.

Fehlschläge bei QA-Release-Checks blockieren die normale Release-Validierung. Erforderlicher OpenClaw-
Dynamic-Tool-Drift im Standard-Tier blockiert ebenfalls den Release-Check-Verifier.
Tideclaw-Alpha-Läufe können Nicht-Package-Safety-Release-Check-Lanes weiterhin als
advisory behandeln. Wenn `live_suite_filter` ausdrücklich eine gated QA-Live-Lane wie
Discord, WhatsApp oder Slack anfordert, muss die passende
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`-Repo-Variable aktiviert sein; andernfalls
schlägt die Eingabeerfassung fehl, statt die Lane stillschweigend zu überspringen. Führen Sie `rerun_group=qa`,
`qa-parity` oder `qa-live` erneut aus, wenn Sie frische QA-Nachweise benötigen.

## Aufzubewahrende Nachweise

Behalten Sie die Zusammenfassung `Full Release Validation` als Release-weiten Index bei. Sie verlinkt
Child-Run-IDs und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlschlägen zuerst den Child-
Workflow und führen Sie dann den kleinsten passenden Handle oben erneut aus.

Nützliche Artefakte:

- `release-package-under-test` aus `OpenClaw Release Checks`
- Docker-Release-Pfad-Artefakte unter `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` und Docker-Acceptance-Artefakte
- Cross-OS-Release-Check-Artefakte für jedes OS und jede Suite
- QA-Paritäts-, Matrix- und Telegram-Artefakte

## Workflow-Dateien

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
