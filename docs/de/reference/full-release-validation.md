---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Vergleich der stabilen und vollständigen Release-Validierungsprofile
    - Fehler in der Release-Validierungsphase beheben
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-05-02T21:01:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist die übergeordnete Release-Validierung. Sie ist der einzige manuelle
Einstiegspunkt für den Nachweis vor der Veröffentlichung, aber die meiste Arbeit läuft in untergeordneten Workflows, sodass eine
fehlgeschlagene Box erneut ausgeführt werden kann, ohne das gesamte Release neu zu starten.

Führen Sie sie aus einer vertrauenswürdigen Workflow-Referenz aus, normalerweise `main`, und übergeben Sie den Release-Branch,
das Tag oder den vollständigen Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Referenz für den Harness und die Eingabe
`ref` für den zu testenden Kandidaten. Dadurch bleibt neue Validierungslogik verfügbar,
wenn ein älterer Release-Branch oder ein älteres Tag validiert wird.

Die Paketakzeptanz baut normalerweise den Kandidaten-Tarball aus dem aufgelösten
`ref`, einschließlich vollständiger SHA-Läufe, die mit `pnpm ci:full-release` ausgelöst wurden. Übergeben Sie nach der
Veröffentlichung `package_acceptance_package_spec=openclaw@YYYY.M.D` (oder
`openclaw@beta`/`openclaw@latest`), um stattdessen dieselbe Paket-/Update-Matrix gegen
das ausgelieferte npm-Paket auszuführen.

## Übergeordnete Phasen

| Phase                | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung    | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet ausgewählte Eingaben auf.<br />**Erneut ausführen:** Führen Sie die übergeordnete Validierung erneut aus, wenn dies fehlschlägt.                                                                                                                                                                              |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Belegt:** manueller vollständiger CI-Graph gegen die Zielreferenz, einschließlich Linux-Node-Lanes, gebündelter Plugin-Shards, Kanalverträgen, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über die übergeordnete Validierung.<br />**Erneut ausführen:** `rerun_group=ci`. |
| Plugin-Vorabprüfung    | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Belegt:** release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Erweiterungs-Batch-Shards und Plugin-Prerelease-Docker-Lanes.<br />**Erneut ausführen:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Release-Prüfungen       | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Belegt:** Installations-Smoke, paketbezogene Cross-OS-Prüfungen, Live-/E2E-Suites, Docker-Release-Pfad-Chunks, Paketakzeptanz, QA-Lab-Parität, Live-Matrix und Live-Telegram.<br />**Erneut ausführen:** `rerun_group=release-checks` oder ein engerer Release-Checks-Handle.                                |
| Paket-Telegram     | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Belegt:** artefaktgestützten Telegram-Paketnachweis für `rerun_group=all` mit `release_profile=full` oder Telegram-Nachweis für veröffentlichte Pakete, wenn `npm_telegram_package_spec` gesetzt ist.<br />**Erneut ausführen:** `rerun_group=npm-telegram` mit `npm_telegram_package_spec`.                                     |
| Übergeordneter Verifizierer    | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** prüft aufgezeichnete Schlussfolgerungen untergeordneter Läufe erneut und hängt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneut ausführen:** Führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagener untergeordneter Workflow erfolgreich erneut ausgeführt wurde.                                                                                                                                   |

Für `ref=main` und `rerun_group=all` ersetzt eine neuere übergeordnete Validierung eine ältere.
Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle untergeordneten Workflows ab, die er bereits
ausgelöst hat. Validierungsläufe für Release-Branches und Tags brechen sich standardmäßig
nicht gegenseitig ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsames Artefakt `release-package-under-test` vor, wenn paket-
oder Docker-bezogene Phasen es benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel      | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewählte Referenz, optionaler erwarteter SHA, Profil, Gruppe für erneute Ausführung und fokussierter Live-Suite-Filter.<br />**Erneut ausführen:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paketartefakt    | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** packt oder löst einen Kandidaten-Tarball auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Erneut ausführen:** die betroffene Paket-, Cross-OS- oder Live-/E2E-Gruppe.                                                                                                           |
| Installations-Smoke       | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Root-Dockerfile-Smoke-Images, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Global-Install-Image-Provider-Smoke und schnelle E2E-Installation/-Deinstallation gebündelter Plugins.<br />**Erneut ausführen:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Neuinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus, mit Kandidaten-Tarball plus Basispaket.<br />**Erneut ausführen:** `rerun_group=cross-os`.                                                                               |
| Repo- und Live-E2E   | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-Websocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Modell-/Backend-/Gateway-Harnesses, ausgewählt durch `release_profile`.<br />**Erneut ausführen:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks für den Release-Pfad gegen das gemeinsame Paketartefakt.<br />**Erneut ausführen:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Paketakzeptanz  | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Plugin-Paket-Fixtures, Plugin-Update, Paketakzeptanz für mock-OpenAI-Telegram und Überlebensprüfungen für veröffentlichte Upgrades aus jedem stabilen npm-Release ab `2026.4.23` gegen denselben Tarball.<br />**Erneut ausführen:** `rerun_group=package`.                                         |
| QA-Parität           | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** Kandidaten- und Baseline-Pakete für agentische Parität, danach der Paritätsbericht.<br />**Erneut ausführen:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                       |
| QA-Live-Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                        |
| QA-Live-Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Zugangsdaten-Leases.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                    |
| Release-Verifizierer    | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Release-Check-Jobs für die ausgewählte Gruppe für erneute Ausführung.<br />**Erneut ausführen:** erneut ausführen, nachdem fokussierte untergeordnete Jobs bestanden haben.                                                                                                                                                                                                 |

## Docker-Release-Pfad-Chunks

Die Docker-Release-Pfad-Phase führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                           | Abdeckung                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-Smoke-Lanes für den Release-Pfad.                                   |
| `package-update-openai`                                         | OpenAI-Paketinstallation und Update-Verhalten.                             |
| `package-update-anthropic`                                      | Anthropic-Paketinstallation und Update-Verhalten.                          |
| `package-update-core`                                           | Provider-neutrales Paket- und Update-Verhalten.                           |
| `plugins-runtime-plugins`                                       | Plugin-Runtime-Lanes, die Plugin-Verhalten ausüben.                     |
| `plugins-runtime-services`                                      | Service-gestützte Plugin-Runtime-Lanes; enthält OpenWebUI, wenn angefordert. |
| `plugins-runtime-install-a` bis `plugins-runtime-install-h` | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung.   |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten pro Lane Befehle zur erneuten Ausführung
mit Paketartefakt- und Image-Wiederverwendungseingaben, wenn verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich die Live-/Provider-Breite innerhalb von Release-Checks.
Es entfernt weder normale vollständige CI noch Plugin Prerelease, Install-Smoke, Package
Acceptance, QA Lab oder Docker-Release-Pfad-Blöcke. `full` sorgt außerdem dafür, dass der
Umbrella-Lauf package Telegram E2E gegen das Release-Paketartefakt ausführt, wenn
`rerun_group=all` ist, sodass ein vollständiger Pre-Publish-Kandidat diese
Telegram-Paket-Lane nicht stillschweigend überspringt.

| Profil    | Vorgesehene Verwendung             | Enthaltene Live-/Provider-Abdeckung                                                                                                                                             |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Schnellster release-kritischer Smoke. | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.             |
| `stable`  | Standardprofil für Release-Freigaben. | `minimum` plus Anthropic, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode-Go-Smoke-Shard. |
| `full`    | Breiter Advisory-Sweep.            | `stable` plus Advisory-Provider, Plugin-Live-Shards und Media-Live-Shards.                                                                                                      |

## Nur in full enthaltene Ergänzungen

Diese Suites werden von `stable` übersprungen und von `full` eingeschlossen:

| Bereich                          | Nur in full enthaltene Abdeckung                                             |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                             |
| Docker-Live-Gateway              | Advisory-Shard für DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI und Z.ai. |
| Native Gateway-Provider-Profile  | Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z andere, Moonshot und xAI.                               |
| Native Media-Live-Shards         | Audio, Google-Musik, MiniMax-Musik und Videogruppen A-D.                      |

`stable` enthält `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
verwendet stattdessen die breiteren OpenCode-Go-Modell-Shards.

## Fokussierte Wiederholungen

Verwenden Sie `rerun_group`, um das Wiederholen nicht zusammenhängender Release-Boxen zu vermeiden:

| Handle              | Umfang                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Alle Phasen von Full Release Validation.                              |
| `ci`                | Nur manuelles vollständiges CI-Child.                                 |
| `plugin-prerelease` | Nur Plugin-Prerelease-Child.                                          |
| `release-checks`    | Alle Phasen von OpenClaw Release Checks.                              |
| `install-smoke`     | Install Smoke bis zu den Release-Checks.                              |
| `cross-os`          | Cross-OS-Release-Checks.                                              |
| `live-e2e`          | Repo-/Live-E2E und Docker-Release-Pfadvalidierung.                    |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                        |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                    |
| `qa-live`           | Nur QA-Live-Matrix und Telegram.                                      |
| `npm-telegram`      | Published-Package Telegram E2E; erfordert `npm_telegram_package_spec`. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, einschließlich
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

## Aufzubewahrende Nachweise

Bewahren Sie die Zusammenfassung `Full Release Validation` als release-weiten Index auf. Sie verlinkt
Child-Run-IDs und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den Child-
Workflow und wiederholen Sie dann das kleinste passende Handle oben.

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
