---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Vergleich stabiler und vollständiger Release-Validierungsprofile
    - Fehler in der Release-Validierungsphase debuggen
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-05-01T06:44:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist das Release-Dach. Es ist der einzige manuelle
Einstiegspunkt für Pre-Release-Nachweise, aber die meiste Arbeit erfolgt in
untergeordneten Workflows, sodass eine fehlgeschlagene Box erneut ausgeführt
werden kann, ohne das gesamte Release neu zu starten.

Führen Sie es von einer vertrauenswürdigen Workflow-Referenz aus, normalerweise
`main`, und übergeben Sie den Release-Branch, das Tag oder den vollständigen
Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Referenz für
das Harness und das Eingabe-`ref` für den zu testenden Kandidaten. Dadurch bleibt
neue Validierungslogik verfügbar, wenn ein älterer Release-Branch oder ein Tag
validiert wird.

## Oberste Phasen

| Phase                 | Details                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung         | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet ausgewählte Eingaben auf.<br />**Erneut ausführen:** Führen Sie das Dach erneut aus, wenn dies fehlschlägt.                                                                                                                   |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Belegt:** manueller vollständiger CI-Graph gegen das Ziel-`ref`, einschließlich Linux-Node-Lanes, gebündelten Plugin-Shards, Channel-Verträgen, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über das Dach.<br />**Erneut ausführen:** `rerun_group=ci`. |
| Plugin-Prerelease     | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Belegt:** release-only statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Extension-Batch-Shards und Docker-Lanes für Plugin-Prereleases.<br />**Erneut ausführen:** `rerun_group=plugin-prerelease`.                                                                        |
| Release-Prüfungen     | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Belegt:** Installations-Smoke, paketbezogene Cross-OS-Prüfungen, Live-/E2E-Suites, Docker-Release-Pfad-Chunks, Package Acceptance, QA-Lab-Parität, Live-Matrix und Live-Telegram.<br />**Erneut ausführen:** `rerun_group=release-checks` oder ein engerer Release-Checks-Handle.        |
| Telegram nach Veröffentlichung | **Job:** `Run post-publish Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Belegt:** optionaler Telegram-Nachweis für veröffentlichte Pakete, wenn `npm_telegram_package_spec` gesetzt ist.<br />**Erneut ausführen:** `rerun_group=npm-telegram`.                                                                                                                |
| Dach-Verifizierer     | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** prüft aufgezeichnete Schlussfolgerungen untergeordneter Läufe erneut und hängt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneut ausführen:** Führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagenes Kind erfolgreich erneut ausgeführt wurde.                       |

Bei `ref=main` und `rerun_group=all` ersetzt ein neueres Dach ein älteres.
Wenn das übergeordnete Element abgebrochen wird, bricht sein Monitor alle
untergeordneten Workflows ab, die er bereits gestartet hat. Validierungsläufe für
Release-Branches und Tags brechen sich standardmäßig nicht gegenseitig ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das
Ziel einmal auf und bereitet ein gemeinsames Artefakt
`release-package-under-test` vor, wenn paket- oder Docker-bezogene Phasen es
benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel        | **Job:** `Resolve target ref`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** ausgewähltes `ref`, optionaler erwarteter SHA, Profil, Gruppe für erneute Ausführung und fokussierter Live-Suite-Filter.<br />**Erneut ausführen:** `rerun_group=release-checks`.                                                                                                                                 |
| Paketartefakt       | **Job:** `Prepare release package artifact`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** packt oder löst einen Kandidaten-Tarball auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Erneut ausführen:** die betroffene Paket-, Cross-OS- oder Live-/E2E-Gruppe.                                                                                |
| Installations-Smoke | **Job:** `Run install smoke`<br />**Zugrunde liegender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Images aus dem Root-Dockerfile, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Global-Install-Image-Provider-Smoke und schnelles Docker-E2E für gebündelte Plugins.<br />**Erneut ausführen:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Zugrunde liegender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Frischinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus, mit dem Kandidaten-Tarball plus einem Baseline-Paket.<br />**Erneut ausführen:** `rerun_group=cross-os`.                                                   |
| Repo- und Live-E2E  | **Job:** `Run repo/live E2E validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Modell-/Backend-/Gateway-Harnesses, die durch `release_profile` ausgewählt werden.<br />**Erneut ausführen:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Zugrunde liegender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks des Release-Pfads gegen das gemeinsame Paketartefakt.<br />**Erneut ausführen:** `rerun_group=live-e2e`.                                                                                                                                          |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Zugrunde liegender Workflow:** `Package Acceptance`<br />**Tests:** artefakt-native Abhängigkeitskompatibilität gebündelter Channels, Offline-Paket-Fixtures für Plugins und Mock-OpenAI-Telegram-Package-Acceptance gegen denselben Tarball.<br />**Erneut ausführen:** `rerun_group=package`.                                                                      |
| QA-Parität          | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugrunde liegender Workflow:** direkte Jobs<br />**Tests:** agentische Paritätspakete für Kandidat und Baseline, danach der Paritätsbericht.<br />**Erneut ausführen:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                   |
| QA-Live-Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                         |
| QA-Live-Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Zugrunde liegender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Credential-Leases.<br />**Erneut ausführen:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                      |
| Release-Verifizierer | **Job:** `Verify release checks`<br />**Zugrunde liegender Workflow:** keiner<br />**Tests:** erforderliche Release-Check-Jobs für die ausgewählte Gruppe zur erneuten Ausführung.<br />**Erneut ausführen:** erneut ausführen, nachdem fokussierte untergeordnete Jobs bestanden haben.                                                                                                                     |

## Docker-Release-Pfad-Chunks

Die Docker-Release-Pfad-Phase führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                                                       | Abdeckung                                                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Core-Docker-Smoke-Lanes für den Release-Pfad.                           |
| `package-update-openai`                                                                     | OpenAI-Paketinstallation und Aktualisierungsverhalten.                  |
| `package-update-anthropic`                                                                  | Anthropic-Paketinstallation und Aktualisierungsverhalten.               |
| `package-update-core`                                                                       | Provider-neutrales Paket- und Aktualisierungsverhalten.                 |
| `plugins-runtime-plugins`                                                                   | Plugin-Runtime-Lanes, die Plugin-Verhalten ausüben.                     |
| `plugins-runtime-services`                                                                  | Dienstgestützte Plugin-Runtime-Lanes; umfasst OpenWebUI, wenn angefordert. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung. |
| `bundled-channels-core`                                                                     | Docker-Verhalten gebündelter Channels.                                  |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Aktualisierungsverhalten gebündelter Channels.                          |
| `bundled-channels-contracts`                                                                | Vertragsprüfungen gebündelter Channels im Docker-Release-Pfad.          |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live-/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten
Befehle pro Lane für erneute Läufe mit Package-Artefakt- und Image-Wiederverwendungseingaben, sofern verfügbar.

## Release-Profile

`release_profile` steuert nur die Live-/Provider-Breite innerhalb der Release-Checks. Es
entfernt keine normale vollständige CI, Plugin Prerelease, Install Smoke, Package
Acceptance, QA Lab oder Docker-Release-Pfad-Blöcke.

| Profil    | Vorgesehene Verwendung              | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                    |
| --------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Schnellster releasekritischer Smoke. | OpenAI-/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.                    |
| `stable`  | Standardprofil für Release-Freigaben. | `minimum` plus Anthropic, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode Go-Smoke-Shard.       |
| `full`    | Breiter Advisory-Sweep.             | `stable` plus Advisory-Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                           |

## Nur-in-Full-Ergänzungen

Diese Suites werden von `stable` übersprungen und von `full` eingeschlossen:

| Bereich                          | Nur-in-Full-Abdeckung                                                         |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                             |
| Docker-Live-Gateway              | Advisory-Shard für DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI und Z.ai. |
| Native Gateway-Provider-Profile  | Fireworks, DeepSeek, vollständige OpenCode Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z other, Moonshot und xAI.                                |
| Native Medien-Live-Shards        | Audio, Google Music, MiniMax Music und Videogruppen A-D.                      |

`stable` enthält `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
verwendet stattdessen die breiteren OpenCode Go-Modell-Shards.

## Fokussierte erneute Läufe

Verwenden Sie `rerun_group`, um das Wiederholen nicht zugehöriger Release-Boxen zu vermeiden:

| Handle              | Umfang                                            |
| ------------------- | ------------------------------------------------- |
| `all`               | Alle Full Release Validation-Stufen.              |
| `ci`                | Nur untergeordneter manueller vollständiger CI-Lauf. |
| `plugin-prerelease` | Nur untergeordneter Plugin Prerelease-Lauf.        |
| `release-checks`    | Alle OpenClaw Release Checks-Stufen.              |
| `install-smoke`     | Install Smoke über Release-Checks.                |
| `cross-os`          | Cross-OS-Release-Checks.                          |
| `live-e2e`          | Repo-/Live-E2E und Docker-Release-Pfad-Validierung. |
| `package`           | Package Acceptance.                               |
| `qa`                | QA-Parität plus QA-Live-Lanes.                    |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                |
| `qa-live`           | Nur QA-Live-Matrix und Telegram.                  |
| `npm-telegram`      | Nur optionales Telegram-E2E nach der Veröffentlichung. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

## Aufzubewahrende Nachweise

Bewahren Sie die Zusammenfassung `Full Release Validation` als releaseweiten Index auf. Sie verlinkt
IDs untergeordneter Läufe und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den
untergeordneten Workflow und starten Sie dann den kleinsten passenden Handle oben erneut.

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
