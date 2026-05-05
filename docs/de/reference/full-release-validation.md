---
read_when:
    - Vollständige Release-Validierung ausführen oder erneut ausführen
    - Vergleich von stabilen und vollständigen Release-Validierungsprofilen
    - Fehlersuche bei Fehlern in Release-Validierungsstufen
summary: Phasen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Handles für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-05-05T01:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist der Release-Dachworkflow. Er ist der einzige manuelle
Einstiegspunkt für den Nachweis vor dem Release, aber die meiste Arbeit findet in untergeordneten Workflows statt, sodass eine
fehlgeschlagene Box erneut ausgeführt werden kann, ohne das gesamte Release neu zu starten.

Führen Sie ihn von einer vertrauenswürdigen Workflow-Referenz aus, normalerweise `main`, und übergeben Sie den Release-Branch,
das Tag oder die vollständige Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Referenz für das Harness und die Eingabe
`ref` für den zu testenden Kandidaten. Dadurch bleibt neue Validierungslogik verfügbar,
wenn ein älterer Release-Branch oder ein älteres Tag validiert wird.

Standardmäßig führt `release_profile=stable` die release-blockierenden Lanes aus und überspringt
den umfassenden Live-/Docker-Soak. Übergeben Sie `run_release_soak=true`, um die
Soak-Lanes in einen Stable-Lauf einzubeziehen. `release_profile=full` aktiviert Soak-Lanes immer, damit
das breite Advisory-Profil nicht stillschweigend Abdeckung verliert.

Package Acceptance baut normalerweise den Kandidaten-Tarball aus der aufgelösten
`ref`, einschließlich Full-SHA-Läufen, die mit `pnpm ci:full-release` ausgelöst wurden. Nach der
Veröffentlichung übergeben Sie `package_acceptance_package_spec=openclaw@YYYY.M.D` (oder
`openclaw@beta`/`openclaw@latest`), um dieselbe Paket-/Update-Matrix stattdessen gegen
das ausgelieferte npm-Paket auszuführen.

## Übergeordnete Phasen

| Phase                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung    | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** löst den Release-Branch, das Tag oder die vollständige Commit-SHA auf und zeichnet ausgewählte Eingaben auf.<br />**Erneute Ausführung:** Führen Sie den Dachworkflow erneut aus, wenn dies fehlschlägt.                                                                                                                                                                                                                               |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Belegt:** manuellen vollständigen CI-Graphen gegen die Ziel-Referenz, einschließlich Linux-Node-Lanes, gebündelter Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über den Dachworkflow.<br />**Erneute Ausführung:** `rerun_group=ci`.                                                  |
| Plugin-Prerelease    | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Belegt:** release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Extension-Batch-Shards und Plugin-Prerelease-Docker-Lanes.<br />**Erneute Ausführung:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Release-Prüfungen       | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Belegt:** Install-Smoke, plattformübergreifende Paketprüfungen, Package Acceptance, QA-Lab-Parität, Live Matrix und Live Telegram. Mit `run_release_soak=true` oder `release_profile=full` werden außerdem umfassende Live-/E2E-Suites und Docker-Release-Pfad-Chunks ausgeführt.<br />**Erneute Ausführung:** `rerun_group=release-checks` oder ein engerer Release-Checks-Handle. |
| Paketartefakt     | **Job:** `Prepare release package artifact`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** erstellt den übergeordneten Tarball `release-package-under-test` früh genug für paketbezogene Prüfungen, die nicht auf `OpenClaw Release Checks` warten müssen.<br />**Erneute Ausführung:** Führen Sie den Dachworkflow erneut aus oder geben Sie `npm_telegram_package_spec` für `rerun_group=npm-telegram` an.                                                                                    |
| Paket Telegram     | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Belegt:** durch ein übergeordnetes Artefakt gestützten Telegram-Paketnachweis für `rerun_group=all` mit `release_profile=full` oder Telegram-Nachweis für veröffentlichte Pakete, wenn `npm_telegram_package_spec` gesetzt ist.<br />**Erneute Ausführung:** `rerun_group=npm-telegram` mit `npm_telegram_package_spec`.                                                                               |
| Dachworkflow-Verifier    | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** prüft aufgezeichnete Ergebnisse untergeordneter Läufe erneut und hängt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneute Ausführung:** Führen Sie nur diesen Job erneut aus, nachdem ein fehlgeschlagener untergeordneter Lauf erfolgreich erneut ausgeführt wurde.                                                                                                                                                                                    |

Für `ref=main` und `rerun_group=all` ersetzt ein neuerer Dachworkflow einen älteren.
Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle untergeordneten Workflows ab, die er bereits
ausgelöst hat. Validierungsläufe für Release-Branches und Tags brechen einander standardmäßig nicht ab.

## Phasen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsames Artefakt `release-package-under-test` vor, wenn paket-
oder Docker-bezogene Phasen es benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-Ziel        | **Job:** `Resolve target ref`<br />**Unterstützender Workflow:** keiner<br />**Tests:** ausgewählte Referenz, optionale erwartete SHA, Profil, Rerun-Gruppe und fokussierter Live-Suite-Filter.<br />**Rerun:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                       |
| Paketartefakt       | **Job:** `Prepare release package artifact`<br />**Unterstützender Workflow:** keiner<br />**Tests:** packt oder ermittelt einen Kandidaten-Tarball und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Rerun:** die betroffene Paket-, Cross-OS- oder Live/E2E-Gruppe.                                                                                                                                                                                                   |
| Installations-Smoke-Test | **Job:** `Run install smoke`<br />**Unterstützender Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Images aus dem Root-Dockerfile, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Globalinstallations-Image-Provider-Smoke und schnellem E2E für Installation/Deinstallation gebündelter Plugins.<br />**Rerun:** `rerun_group=install-smoke`.                                                                 |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Unterstützender Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Neuinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus, mit dem Kandidaten-Tarball plus Baseline-Paket.<br />**Rerun:** `rerun_group=cross-os`.                                                                                                                                                                               |
| Repo und Live-E2E   | **Job:** `Run repo/live E2E validation`<br />**Unterstützender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-WebSocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Harnesses für Modell/Backend/Gateway, ausgewählt durch `release_profile`.<br />**Läuft bei:** `run_release_soak=true`, `release_profile=full` oder fokussiertem `rerun_group=live-e2e`.<br />**Rerun:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Unterstützender Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Abschnitte für den Release-Pfad gegen das gemeinsame Paketartefakt.<br />**Läuft bei:** `run_release_soak=true`, `release_profile=full` oder fokussiertem `rerun_group=live-e2e`.<br />**Rerun:** `rerun_group=live-e2e`.                                                                                                                                          |
| Paketakzeptanz      | **Job:** `Run package acceptance`<br />**Unterstützender Workflow:** `Package Acceptance`<br />**Tests:** Offline-Plugin-Paket-Fixtures, Plugin-Update, Mock-OpenAI-Telegram-Paketakzeptanz und Published-Upgrade-Survivor-Prüfungen gegen denselben Tarball. Blockierende Release-Prüfungen verwenden die standardmäßig zuletzt veröffentlichte Baseline; Soak-Prüfungen erweitern dies auf jede stabile npm-Version ab `2026.4.23` sowie Fixtures für gemeldete Issues.<br />**Rerun:** `rerun_group=package`.                          |
| QA-Parität          | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Unterstützender Workflow:** direkte Jobs<br />**Tests:** Agentic-Paritätspakete für Kandidat und Baseline, anschließend der Paritätsbericht.<br />**Rerun:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                                                |
| QA-Live-Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Unterstützender Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der Umgebung `qa-live-shared`.<br />**Rerun:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                 |
| QA-Live-Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Unterstützender Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Anmeldeinformations-Leases.<br />**Rerun:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                                     |
| Release-Verifizierung | **Job:** `Verify release checks`<br />**Unterstützender Workflow:** keiner<br />**Tests:** erforderliche Release-Prüfjobs für die ausgewählte Rerun-Gruppe.<br />**Rerun:** erneut ausführen, nachdem fokussierte Child-Jobs bestanden haben.                                                                                                                                                                                                                                                                      |

## Docker-Release-Pfad-Abschnitte

Die Docker-Release-Pfad-Phase führt diese Abschnitte aus, wenn `live_suite_filter`
leer ist:

| Abschnitt                                                       | Abdeckung                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-Smoke-Lanes für den Release-Pfad.                           |
| `package-update-openai`                                         | Installations- und Update-Verhalten des OpenAI-Pakets.                  |
| `package-update-anthropic`                                      | Installations- und Update-Verhalten des Anthropic-Pakets.               |
| `package-update-core`                                           | Provider-neutrales Paket- und Update-Verhalten.                         |
| `plugins-runtime-plugins`                                       | Plugin-Runtime-Lanes, die Plugin-Verhalten ausüben.                     |
| `plugins-runtime-services`                                      | Service-gestützte Plugin-Runtime-Lanes; enthält OpenWebUI, wenn angefordert. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung. |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten pro Lane Rerun-
Befehle mit Paketartefakt- und Image-Wiederverwendungseingaben, sofern verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich die Breite von Live/Provider innerhalb der Release-Prüfungen.
Es entfernt nicht die normale vollständige CI, Plugin-Prerelease, Installations-Smoke-Tests, Paket-
akzeptanz oder QA Lab. Für `stable` sind ausführliche Repo/Live-E2E- und Docker-
Release-Pfad-Abschnitte Soak-Abdeckung und laufen, wenn `run_release_soak=true`.
`full` erzwingt Soak-Abdeckung und veranlasst außerdem den Umbrella-Lauf, Paket-Telegram-
E2E gegen das übergeordnete Release-Paketartefakt auszuführen, wenn `rerun_group=all`, damit ein vollständiger
Pre-Publish-Kandidat diese Telegram-Paket-Lane nicht stillschweigend überspringt.

| Profil    | Vorgesehene Verwendung            | Enthaltene Live/Provider-Abdeckung                                                                                                                                                  |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Schnellster releasekritischer Smoke-Test. | OpenAI/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.                     |
| `stable`  | Standardprofil für Release-Freigabe. | `minimum` plus Anthropic-Smoke, Google, MiniMax, Backend, natives Live-Test-Harness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode-Go-Smoke-Shard. |
| `full`    | Breite Advisory-Prüfung.          | `stable` plus Advisory-Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                         |

## Nur in Full enthaltene Ergänzungen

Diese Suites werden von `stable` übersprungen und von `full` eingeschlossen:

| Bereich                          | Nur in Full enthaltene Abdeckung                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                           |
| Docker-Live-Gateway              | Advisory-Provider, aufgeteilt in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- und xAI/Z.ai-Shards.                          |
| Native Gateway-Provider-Profile  | Vollständige Anthropic-Opus- und Sonnet/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z andere, Moonshot und xAI.                                                                             |
| Native Medien-Live-Shards        | Audio, Google-Musik, MiniMax-Musik und Videogruppen A-D.                                                                    |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiteren
Anthropic- und OpenCode-Go-Modell-Shards. Fokussierte Reruns können weiterhin die aggregierten
Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwenden.

## Fokussierte Reruns

Verwenden Sie `rerun_group`, um das Wiederholen nicht zusammenhängender Release-Boxen zu vermeiden:

| Handle              | Umfang                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `all`               | Alle Full Release Validation-Stufen.                                 |
| `ci`                | Nur manueller vollständiger CI-Child.                                |
| `plugin-prerelease` | Nur Plugin Prerelease-Child.                                         |
| `release-checks`    | Alle OpenClaw Release Checks-Stufen.                                 |
| `install-smoke`     | Install Smoke bis zu den Release Checks.                             |
| `cross-os`          | Cross-OS-Release Checks.                                             |
| `live-e2e`          | Repo-/Live-E2E- und Docker-Release-Pfad-Validierung.                 |
| `package`           | Package Acceptance.                                                  |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                       |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                   |
| `qa-live`           | Nur QA-Live-Matrix und Telegram.                                     |
| `npm-telegram`      | Published-Package-Telegram-E2E; erfordert `npm_telegram_package_spec`. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, einschließlich
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Der `live-gateway-advisory-docker`-Handle ist ein aggregierter Rerun-Handle für seine
drei Provider-Shards, daher fächert er weiterhin auf alle Advisory-Docker-Gateway-Jobs auf.

Verwenden Sie `cross_os_suite_filter` mit `rerun_group=cross-os`, wenn eine Cross-OS-Lane
fehlgeschlagen ist. Der Filter akzeptiert eine OS-ID, eine Suite-ID oder ein OS/Suite-Paar, zum
Beispiel `windows/packaged-upgrade`, `windows` oder `packaged-fresh`. Cross-OS-
Zusammenfassungen enthalten phasenbezogene Timings für Packaged-Upgrade-Lanes, und lang laufende
Befehle geben Heartbeat-Zeilen aus, sodass ein hängendes Windows-Update vor dem
Job-Timeout sichtbar ist.

QA-Release-Check-Lanes sind beratend. Ein reiner QA-Fehler wird als Warnung
gemeldet und blockiert den Release-Check-Verifier nicht; führen Sie `rerun_group=qa`,
`qa-parity` oder `qa-live` erneut aus, wenn Sie aktuelle QA-Nachweise benötigen.

## Aufzubewahrende Nachweise

Bewahren Sie die `Full Release Validation`-Zusammenfassung als Release-Ebene-Index auf. Sie verlinkt
Child-Run-IDs und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den Child-
Workflow und führen Sie dann den kleinsten passenden Handle oben erneut aus.

Nützliche Artefakte:

- `release-package-under-test` aus dem Full Release Validation-Parent und `OpenClaw Release Checks`
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
