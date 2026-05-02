---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Vergleich von stabilen und vollständigen Release-Validierungsprofilen
    - Fehlerbehebung bei Fehlern in Release-Validierungsphasen
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-05-02T06:45:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist der Release-Schirm. Es ist der einzige manuelle
Einstiegspunkt für den Pre-Release-Nachweis, aber die meiste Arbeit erfolgt in
untergeordneten Workflows, sodass eine fehlgeschlagene Box erneut ausgeführt
werden kann, ohne den gesamten Release neu zu starten.

Führen Sie ihn von einer vertrauenswürdigen Workflow-Referenz aus, normalerweise `main`,
und übergeben Sie den Release-Branch, das Tag oder den vollständigen Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Referenz für den Harness
und das Eingabe-`ref` für den zu testenden Kandidaten. Dadurch bleibt neue
Validierungslogik verfügbar, wenn ein älterer Release-Branch oder ein älteres Tag
validiert wird.

## Übergeordnete Phasen

| Phase                | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung        | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet die ausgewählten Eingaben auf.<br />**Erneut ausführen:** Führen Sie den Schirm erneut aus, wenn dies fehlschlägt.                                                                                                                                                                              |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Belegt:** manueller vollständiger CI-Graph gegen das Ziel-`ref`, einschließlich Linux-Node-Lanes, gebündelten Plugin-Shards, Channel-Verträgen, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den Schirm.<br />**Erneut ausführen:** `rerun_group=ci`. |
| Plugin-Prerelease    | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Belegt:** release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Extension-Batch-Shards und Docker-Lanes für Plugin-Prereleases.<br />**Erneut ausführen:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Release-Prüfungen    | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Belegt:** Install-Smoke, Cross-OS-Paketprüfungen, Live-/E2E-Suites, Docker-Release-Pfad-Chunks, Package Acceptance, QA-Lab-Parität, Live-Matrix und Live-Telegram.<br />**Erneut ausführen:** `rerun_group=release-checks` oder ein engerer Release-Checks-Handle.                                |
| Paket Telegram       | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Belegt:** artefaktgestützter Telegram-Paketnachweis für `rerun_group=all` mit `release_profile=full` oder Telegram-Nachweis mit veröffentlichtem Paket, wenn `npm_telegram_package_spec` gesetzt ist.<br />**Erneut ausführen:** `rerun_group=npm-telegram` mit `npm_telegram_package_spec`.                                     |
| Schirm-Verifier      | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** prüft die aufgezeichneten Ergebnisse untergeordneter Läufe erneut und hängt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneut ausführen:** Führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagenes untergeordnetes Element wieder grün ist.                                                                                                                                   |

Für `ref=main` und `rerun_group=all` ersetzt ein neuerer Schirm einen älteren.
Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle
untergeordneten Workflows ab, die er bereits ausgelöst hat. Validierungsläufe
für Release-Branches und Tags brechen sich standardmäßig nicht gegenseitig ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsames `release-package-under-test`-Artefakt vor,
wenn paket- oder Docker-bezogene Phasen es benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel        | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewähltes `ref`, optional erwarteter SHA, Profil, Gruppe für erneute Ausführung und fokussierter Filter für die Live-Suite.<br />**Erneut ausführen:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paketartefakt       | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** packt oder löst einen Kandidaten-Tarball auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Erneut ausführen:** die betroffene Paket-, Cross-OS- oder Live-/E2E-Gruppe.                                                                                                           |
| Install-Smoke       | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Root-Dockerfile-Smoke-Images, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Global-Install-Image-Provider-Smoke und schnelles Installations-/Deinstallations-E2E für gebündelte Plugins.<br />**Erneut ausführen:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Fresh- und Upgrade-Lanes auf Linux, Windows und macOS für den ausgewählten Provider und Modus, unter Verwendung des Kandidaten-Tarballs plus eines Baseline-Pakets.<br />**Erneut ausführen:** `rerun_group=cross-os`.                                                                               |
| Repo und Live-E2E   | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Modell-/Backend-/Gateway-Harnesses, die durch `release_profile` ausgewählt werden.<br />**Erneut ausführen:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks für den Release-Pfad gegen das gemeinsame Paketartefakt.<br />**Erneut ausführen:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Plugin-Paket-Fixtures, Plugin-Update und Mock-OpenAI-Telegram-Package-Acceptance gegen denselben Tarball.<br />**Erneut ausführen:** `rerun_group=package`.                                                                                                                                  |
| QA-Parität          | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** agentische Paritätspakete für Kandidat und Baseline, danach der Paritätsbericht.<br />**Erneut ausführen:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                       |
| QA-Live-Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der `qa-live-shared`-Umgebung.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                        |
| QA-Live-Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Credential-Leases.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                    |
| Release-Verifier    | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Release-Check-Jobs für die ausgewählte Gruppe zur erneuten Ausführung.<br />**Erneut ausführen:** erneut ausführen, nachdem fokussierte untergeordnete Jobs erfolgreich waren.                                                                                                                                                                                                 |

## Docker-Release-Pfad-Chunks

Die Docker-Release-Pfad-Phase führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                           | Abdeckung                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core-Smoke-Lanes für den Docker-Release-Pfad.                           |
| `package-update-openai`                                         | OpenAI-Paketinstallation und Update-Verhalten.                          |
| `package-update-anthropic`                                      | Anthropic-Paketinstallation und Update-Verhalten.                       |
| `package-update-core`                                           | Provider-neutrales Paket- und Update-Verhalten.                         |
| `plugins-runtime-plugins`                                       | Plugin-Runtime-Lanes, die Plugin-Verhalten ausüben.                     |
| `plugins-runtime-services`                                      | Service-gestützte Plugin-Runtime-Lanes; enthält OpenWebUI, wenn angefordert. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung.   |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten
Befehle zur erneuten Ausführung pro Lane mit Eingaben für Paketartefakt- und
Image-Wiederverwendung, wenn verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich die Live-/Provider-Breite innerhalb der Release-Prüfungen.
Es entfernt weder normale vollständige CI, Plugin Prerelease, Install-Smoke,
Package Acceptance, QA Lab noch Docker-Release-Pfad-Chunks. `full` veranlasst außerdem den
Schirm, Paket-Telegram-E2E gegen das Release-Paketartefakt auszuführen, wenn
`rerun_group=all`, damit ein vollständiger Pre-Publish-Kandidat diese
Telegram-Paket-Lane nicht stillschweigend überspringt.

| Profil    | Vorgesehene Verwendung                 | Enthaltene Live-/Provider-Abdeckung                                                                                                                                          |
| --------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Schnellster release-kritischer Smoke.  | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.          |
| `stable`  | Standardprofil für Release-Freigaben.  | `minimum` plus Anthropic, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode-Go-Smoke-Shard. |
| `full`    | Breiter Advisory-Sweep.                | `stable` plus Advisory-Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                  |

## Nur-in-`full` enthaltene Ergänzungen

Diese Suites werden von `stable` übersprungen und von `full` einbezogen:

| Bereich                          | Nur-in-`full` enthaltene Abdeckung                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                               |
| Docker-Live-Gateway              | Advisory-Shard für DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI und Z.ai.  |
| Native Gateway-Provider-Profile  | Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z sonstige, Moonshot und xAI.                               |
| Native Medien-Live-Shards        | Audio, Google-Musik, MiniMax-Musik und Videogruppen A-D.                        |

`stable` enthält `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
verwendet stattdessen die breiteren OpenCode-Go-Modell-Shards.

## Fokussierte Wiederholungen

Verwenden Sie `rerun_group`, um das Wiederholen nicht zusammenhängender Release-Boxen zu vermeiden:

| Handle              | Umfang                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Alle Full-Release-Validation-Stufen.                                  |
| `ci`                | Nur manueller vollständiger CI-Child.                                 |
| `plugin-prerelease` | Nur Plugin-Prerelease-Child.                                          |
| `release-checks`    | Alle OpenClaw-Release-Checks-Stufen.                                  |
| `install-smoke`     | Install-Smoke bis Release-Checks.                                     |
| `cross-os`          | Cross-OS-Release-Checks.                                              |
| `live-e2e`          | Repo-/Live-E2E und Docker-Release-Pfad-Validierung.                   |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                        |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                    |
| `qa-live`           | Nur QA-Live-Matrix und Telegram.                                      |
| `npm-telegram`      | Published-Package-Telegram-E2E; erfordert `npm_telegram_package_spec`. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine einzelne Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

## Aufzubewahrende Nachweise

Behalten Sie die Zusammenfassung `Full Release Validation` als release-weiten Index. Sie verlinkt
Child-Run-IDs und enthält Tabellen mit den langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den Child-
Workflow und führen Sie dann den kleinsten passenden Handle oben erneut aus.

Nützliche Artefakte:

- `release-package-under-test` aus `OpenClaw Release Checks`
- Docker-Release-Pfad-Artefakte unter `.artifacts/docker-tests/`
- Package-Acceptance-`package-under-test` und Docker-Acceptance-Artefakte
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
