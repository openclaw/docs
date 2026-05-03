---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Vergleich der stabilen und vollständigen Release-Validierungsprofile
    - Fehlerbehebung bei Fehlern in Release-Validierungsstufen
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-05-03T21:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist der Release-Rahmen. Er ist der einzige manuelle
Einstiegspunkt für den Pre-Release-Nachweis, aber die meiste Arbeit erfolgt in untergeordneten Workflows, damit eine
fehlgeschlagene Box erneut ausgeführt werden kann, ohne den gesamten Release neu zu starten.

Führen Sie ihn von einer vertrauenswürdigen Workflow-Ref aus, normalerweise `main`, und übergeben Sie den Release-Branch,
das Tag oder die vollständige Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Ref für den Harness und die Eingabe
`ref` für den zu testenden Kandidaten. Dadurch bleibt neue Validierungslogik verfügbar,
wenn ein älterer Release-Branch oder ein älteres Tag validiert wird.

Package Acceptance erstellt normalerweise den Kandidaten-Tarball aus der aufgelösten
`ref`, einschließlich vollständiger SHA-Läufe, die mit `pnpm ci:full-release` ausgelöst wurden. Übergeben Sie nach
der Veröffentlichung `package_acceptance_package_spec=openclaw@YYYY.M.D` (oder
`openclaw@beta`/`openclaw@latest`), um stattdessen dieselbe Paket-/Update-Matrix gegen
das ausgelieferte npm-Paket auszuführen.

## Übergeordnete Phasen

| Phase                | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung        | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Weist nach:** löst den Release-Branch, das Tag oder die vollständige Commit-SHA auf und zeichnet die ausgewählten Eingaben auf.<br />**Erneut ausführen:** führen Sie den Rahmen erneut aus, wenn dies fehlschlägt.                                                                                                                                                                              |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Weist nach:** manueller vollständiger CI-Graph gegen die Ziel-Ref, einschließlich Linux-Node-Lanes, gebündelter Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den Rahmen.<br />**Erneut ausführen:** `rerun_group=ci`. |
| Plugin-Prerelease    | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Weist nach:** release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Extension-Batch-Shards und Plugin-Prerelease-Docker-Lanes.<br />**Erneut ausführen:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Release-Prüfungen    | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Weist nach:** Installations-Smoke, plattformübergreifende Paketprüfungen, Live-/E2E-Suiten, Docker-Release-Path-Chunks, Package Acceptance, QA-Lab-Parität, Live-Matrix und Live-Telegram.<br />**Erneut ausführen:** `rerun_group=release-checks` oder ein enger gefasster Release-Checks-Handle.                                |
| Paketartefakt        | **Job:** `Prepare release package artifact`<br />**Untergeordneter Workflow:** keiner<br />**Weist nach:** erstellt den übergeordneten Tarball `release-package-under-test` früh genug für paketbezogene Prüfungen, die nicht auf `OpenClaw Release Checks` warten müssen.<br />**Erneut ausführen:** führen Sie den Rahmen erneut aus oder geben Sie `npm_telegram_package_spec` für `rerun_group=npm-telegram` an.                                   |
| Paket-Telegram       | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Weist nach:** Telegram-Paketnachweis auf Basis des übergeordneten Artefakts für `rerun_group=all` mit `release_profile=full` oder Telegram-Nachweis für veröffentlichte Pakete, wenn `npm_telegram_package_spec` gesetzt ist.<br />**Erneut ausführen:** `rerun_group=npm-telegram` mit `npm_telegram_package_spec`.                              |
| Rahmen-Verifier      | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Weist nach:** prüft aufgezeichnete Ergebnisse untergeordneter Läufe erneut und hängt Tabellen mit den langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneut ausführen:** führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagener untergeordneter Lauf erfolgreich wurde.                                                                                                                                   |

Für `ref=main` und `rerun_group=all` ersetzt ein neuerer Rahmen einen älteren.
Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle untergeordneten Workflows ab, die er bereits
ausgelöst hat. Validierungsläufe für Release-Branches und Tags brechen sich standardmäßig
nicht gegenseitig ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsames Artefakt `release-package-under-test` vor, wenn paket-
oder Docker-bezogene Phasen es benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel        | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewählte Ref, optionale erwartete SHA, Profil, Gruppe für erneutes Ausführen und fokussierter Live-Suite-Filter.<br />**Erneut ausführen:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Paketartefakt       | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** packt oder löst einen Kandidaten-Tarball auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Erneut ausführen:** die betroffene Paket-, Cross-OS- oder Live-/E2E-Gruppe.                                                                                                           |
| Installations-Smoke | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Root-Dockerfile-Smoke-Images, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Global-Install-Image-Provider-Smoke und schnelles E2E für Installation/Deinstallation gebündelter Plugins.<br />**Erneut ausführen:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Fresh- und Upgrade-Lanes auf Linux, Windows und macOS für den ausgewählten Provider und Modus, unter Verwendung des Kandidaten-Tarballs plus eines Baseline-Pakets.<br />**Erneut ausführen:** `rerun_group=cross-os`.                                                                               |
| Repo und Live-E2E   | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-Websocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Modell-/Backend-/Gateway-Harnesses, die durch `release_profile` ausgewählt werden.<br />**Erneut ausführen:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks für den Release-Pfad gegen das gemeinsame Paketartefakt.<br />**Erneut ausführen:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Plugin-Paket-Fixtures, Plugin-Update, Mock-OpenAI-Telegram-Package-Acceptance und Prüfungen überlebender veröffentlichter Upgrades von jedem stabilen npm-Release ab `2026.4.23` gegen denselben Tarball.<br />**Erneut ausführen:** `rerun_group=package`.                                         |
| QA-Parität          | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** Kandidaten- und Baseline-Pakete für agentische Parität, danach der Paritätsbericht.<br />**Erneut ausführen:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                       |
| QA-Live-Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                        |
| QA-Live-Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Credential-Leases.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                    |
| Release-Verifier    | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Release-Check-Jobs für die ausgewählte Gruppe für erneutes Ausführen.<br />**Erneut ausführen:** erneut ausführen, nachdem fokussierte untergeordnete Jobs erfolgreich sind.                                                                                                                                                                                                 |

## Docker-Release-Path-Chunks

Die Docker-Release-Path-Phase führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                           | Abdeckung                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-Release-Path-Smoke-Lanes.                                   |
| `package-update-openai`                                         | Installations- und Update-Verhalten des OpenAI-Pakets.                  |
| `package-update-anthropic`                                      | Installations- und Update-Verhalten des Anthropic-Pakets.               |
| `package-update-core`                                           | Provider-neutrales Paket- und Update-Verhalten.                         |
| `plugins-runtime-plugins`                                       | Plugin-Runtime-Lanes, die Plugin-Verhalten ausüben.                     |
| `plugins-runtime-services`                                      | Service-gestützte Plugin-Runtime-Lanes; enthält OpenWebUI, wenn angefordert. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung. |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, wenn
nur ein Docker-Ausführungspfad fehlgeschlagen ist. Die Release-Artefakte enthalten Wiederholungsbefehle pro Ausführungspfad
mit Eingaben zur Wiederverwendung von Paketartefakten und Images, sofern verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich die Live-/Provider-Breite innerhalb der Release-Prüfungen.
Es entfernt nicht die normale vollständige CI, Plugin Prerelease, Install Smoke, Paketakzeptanz,
QA Lab oder Docker-Release-Pfad-Abschnitte. `full` sorgt außerdem dafür, dass der
Umbrella-Lauf Paket-Telegram-E2E gegen das übergeordnete Release-Paketartefakt ausführt, wenn
`rerun_group=all` gesetzt ist, sodass ein vollständiger Kandidat vor der Veröffentlichung diesen
Telegram-Paket-Ausführungspfad nicht stillschweigend überspringt.

| Profil    | Vorgesehene Verwendung                 | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                     |
| --------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Schnellster releasekritischer Smoke.   | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.                     |
| `stable`  | Standardprofil für Release-Freigaben.  | `minimum` plus Anthropic-Smoke, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode-Go-Smoke-Shard. |
| `full`    | Breiter Beratungssweep.                | `stable` plus beratende Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                           |

## Nur in full enthaltene Ergänzungen

Diese Suites werden von `stable` übersprungen und von `full` eingeschlossen:

| Bereich                          | Nur in full enthaltene Abdeckung                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                               |
| Docker-Live-Gateway              | Beratende Provider, aufgeteilt in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- und xAI/Z.ai-Shards.                              |
| Native Gateway-Provider-Profile  | Vollständige Anthropic-Opus- und Sonnet/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z Sonstige, Moonshot und xAI.                                                                               |
| Native Medien-Live-Shards        | Audio, Google-Musik, MiniMax-Musik und Videogruppen A-D.                                                                        |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiteren
Anthropic- und OpenCode-Go-Modell-Shards. Fokussierte Wiederholungen können weiterhin die
aggregierten Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwenden.

## Fokussierte Wiederholungen

Verwenden Sie `rerun_group`, um nicht zusammenhängende Release-Boxen nicht erneut auszuführen:

| Handle              | Umfang                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Alle Stufen von Full Release Validation.                              |
| `ci`                | Nur untergeordnete manuelle vollständige CI.                          |
| `plugin-prerelease` | Nur untergeordneter Plugin Prerelease.                                |
| `release-checks`    | Alle Stufen von OpenClaw Release Checks.                              |
| `install-smoke`     | Install Smoke über Release-Prüfungen hinweg.                         |
| `cross-os`          | Cross-OS-Release-Prüfungen.                                           |
| `live-e2e`          | Repo-/Live-E2E und Docker-Release-Pfad-Validierung.                   |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA-Parität plus QA-Live-Ausführungspfade.                             |
| `qa-parity`         | Nur QA-Paritäts-Ausführungspfade und Bericht.                         |
| `qa-live`           | Nur QA-Live-Matrix und Telegram.                                      |
| `npm-telegram`      | Telegram-E2E für veröffentlichtes Paket; erfordert `npm_telegram_package_spec`. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, einschließlich
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Der Handle `live-gateway-advisory-docker` ist ein aggregierter Wiederholungs-Handle für seine
drei Provider-Shards, daher fächert er weiterhin auf alle beratenden Docker-Gateway-Jobs auf.

## Aufzubewahrende Nachweise

Behalten Sie die Zusammenfassung `Full Release Validation` als releaseweite Übersicht. Sie verlinkt
untergeordnete Lauf-IDs und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den untergeordneten
Workflow und wiederholen Sie dann den kleinsten passenden Handle oben.

Nützliche Artefakte:

- `release-package-under-test` aus dem übergeordneten Full-Release-Validation-Lauf und `OpenClaw Release Checks`
- Docker-Release-Pfad-Artefakte unter `.artifacts/docker-tests/`
- Package-Acceptance-`package-under-test` und Docker-Acceptance-Artefakte
- Cross-OS-Release-Check-Artefakte für jedes OS und jede Suite
- QA-Parität-, Matrix- und Telegram-Artefakte

## Workflow-Dateien

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
