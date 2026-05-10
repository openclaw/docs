---
read_when:
    - Ausführen oder erneutes Ausführen der vollständigen Release-Validierung
    - Vergleich stabiler und vollständiger Release-Validierungsprofile
    - Debuggen von Fehlern in der Release-Validierungsphase
summary: Stufen der vollständigen Release-Validierung, untergeordnete Workflows, Release-Profile, Kennungen für erneute Ausführungen und Nachweise
title: Vollständige Release-Validierung
x-i18n:
    generated_at: "2026-05-10T19:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` ist das Release-Dach. Es ist der einzelne manuelle
Einstiegspunkt für den Vorab-Release-Nachweis, aber die meiste Arbeit findet in untergeordneten Workflows statt, damit eine
fehlgeschlagene Box erneut ausgeführt werden kann, ohne das gesamte Release neu zu starten.

Führen Sie es von einer vertrauenswürdigen Workflow-Referenz aus, normalerweise `main`, und übergeben Sie den Release-Branch,
das Tag oder den vollständigen Commit-SHA als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Untergeordnete Workflows verwenden die vertrauenswürdige Workflow-Referenz für das Harness und die Eingabe
`ref` für den zu prüfenden Kandidaten. Dadurch bleibt neue Validierungslogik verfügbar,
wenn ein älterer Release-Branch oder ein älteres Tag validiert wird.

Standardmäßig führt `release_profile=stable` die release-blockierenden Lanes aus und überspringt
den umfassenden Live-/Docker-Soak. Übergeben Sie `run_release_soak=true`, um die
Soak-Lanes in einem stabilen Lauf einzubeziehen. `release_profile=full` aktiviert Soak-Lanes immer, damit
das breite Beratungsprofil nicht stillschweigend Abdeckung verliert.

Die Paketabnahme baut normalerweise den Kandidaten-Tarball aus dem aufgelösten
`ref`, einschließlich vollständiger SHA-Läufe, die mit `pnpm ci:full-release` ausgelöst wurden. Nach der
Veröffentlichung übergeben Sie `package_acceptance_package_spec=openclaw@YYYY.M.D` (oder
`openclaw@beta`/`openclaw@latest`), um dieselbe Paket-/Update-Matrix stattdessen gegen
das ausgelieferte npm-Paket auszuführen.

## Stufen auf oberster Ebene

| Stufe                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zielauflösung    | **Job:** `Resolve target ref`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** löst den Release-Branch, das Tag oder den vollständigen Commit-SHA auf und zeichnet ausgewählte Eingaben auf.<br />**Erneut ausführen:** Führen Sie das Dach erneut aus, wenn dies fehlschlägt.                                                                                                                                                                                                                               |
| Vitest und normale CI | **Job:** `Run normal full CI`<br />**Untergeordneter Workflow:** `CI`<br />**Belegt:** manueller vollständiger CI-Graph gegen die Zielreferenz, einschließlich Linux-Node-Lanes, gebündelter Plugin-Shards, Kanalverträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS, Control-UI-i18n und Android über das Dach.<br />**Erneut ausführen:** `rerun_group=ci`.                                                  |
| Plugin-Vorab-Release    | **Job:** `Run plugin prerelease validation`<br />**Untergeordneter Workflow:** `Plugin Prerelease`<br />**Belegt:** release-spezifische statische Plugin-Prüfungen, agentische Plugin-Abdeckung, vollständige Erweiterungs-Batch-Shards und Plugin-Vorab-Release-Docker-Lanes.<br />**Erneut ausführen:** `rerun_group=plugin-prerelease`.                                                                                                                                                        |
| Release-Prüfungen       | **Job:** `Run release/live/Docker/QA validation`<br />**Untergeordneter Workflow:** `OpenClaw Release Checks`<br />**Belegt:** Installations-Smoke, plattformübergreifende Paketprüfungen, Paketabnahme, QA-Lab-Parität, Live-Matrix und Live-Telegram. Mit `run_release_soak=true` oder `release_profile=full` werden außerdem umfassende Live-/E2E-Suites und Docker-Release-Pfad-Chunks ausgeführt.<br />**Erneut ausführen:** `rerun_group=release-checks` oder ein engerer Release-Checks-Handle. |
| Paketartefakt     | **Job:** `Prepare release package artifact`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** erstellt den übergeordneten Tarball `release-package-under-test` früh genug für paketbezogene Prüfungen, die nicht auf `OpenClaw Release Checks` warten müssen.<br />**Erneut ausführen:** Führen Sie das Dach erneut aus oder stellen Sie `npm_telegram_package_spec` für `rerun_group=npm-telegram` bereit.                                                                                    |
| Paket-Telegram     | **Job:** `Run package Telegram E2E`<br />**Untergeordneter Workflow:** `NPM Telegram Beta E2E`<br />**Belegt:** durch übergeordnetes Artefakt gestützten Telegram-Paketnachweis für `rerun_group=all` mit `release_profile=full` oder Telegram-Nachweis für veröffentlichte Pakete, wenn `npm_telegram_package_spec` gesetzt ist.<br />**Erneut ausführen:** `rerun_group=npm-telegram` mit `npm_telegram_package_spec`.                                                                               |
| Dach-Verifizierer    | **Job:** `Verify full validation`<br />**Untergeordneter Workflow:** keiner<br />**Belegt:** prüft die aufgezeichneten Ergebnisse untergeordneter Läufe erneut und hängt Tabellen der langsamsten Jobs aus untergeordneten Workflows an.<br />**Erneut ausführen:** Führen Sie nur diesen Job erneut aus, nachdem Sie ein fehlgeschlagenes Kind erneut bis Grün ausgeführt haben.                                                                                                                                                                                    |

Für `ref=main` und `rerun_group=all` ersetzt ein neueres Dach ein älteres.
Wenn der übergeordnete Lauf abgebrochen wird, bricht sein Monitor alle untergeordneten Workflows ab, die er bereits
ausgelöst hat. Validierungsläufe für Release-Branches und Tags brechen sich standardmäßig nicht gegenseitig ab.

## Stufen der Release-Prüfungen

`OpenClaw Release Checks` ist der größte untergeordnete Workflow. Er löst das Ziel
einmal auf und bereitet ein gemeinsam genutztes Artefakt `release-package-under-test` vor, wenn paket-
oder Docker-bezogene Stufen es benötigen.

| Phase               | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Release-Ziel        | **Job:** `Resolve target ref`<br />**Zugehöriger Workflow:** keiner<br />**Tests:** ausgewählte Referenz, optionaler erwarteter SHA, Profil, Gruppe für erneute Ausführung und fokussierter Filter für die Live-Suite.<br />**Erneute Ausführung:** `rerun_group=release-checks`.                                                                                                                                                                                                                              |
| Paketartefakt       | **Job:** `Prepare release package artifact`<br />**Zugehöriger Workflow:** keiner<br />**Tests:** packt oder löst einen Kandidaten-Tarball auf und lädt `release-package-under-test` für nachgelagerte paketbezogene Prüfungen hoch.<br />**Erneute Ausführung:** die betroffene Paket-, Cross-OS- oder Live/E2E-Gruppe.                                                                                                                                                                                           |
| Installations-Smoke | **Job:** `Run install smoke`<br />**Zugehöriger Workflow:** `Install Smoke`<br />**Tests:** vollständiger Installationspfad mit Wiederverwendung des Smoke-Images des Root-Dockerfile, QR-Paketinstallation, Root- und Gateway-Docker-Smokes, Installer-Docker-Tests, Bun-Globalinstallations-Smoke für den Image-Provider und schnelle E2E-Installation/-Deinstallation gebündelter Plugins.<br />**Erneute Ausführung:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Zugehöriger Workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** Frischinstallations- und Upgrade-Lanes unter Linux, Windows und macOS für den ausgewählten Provider und Modus, mit dem Kandidaten-Tarball plus einem Baseline-Paket.<br />**Erneute Ausführung:** `rerun_group=cross-os`.                                                                                                                                                      |
| Repo und Live-E2E   | **Job:** `Run repo/live E2E validation`<br />**Zugehöriger Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Repository-E2E, Live-Cache, OpenAI-Websocket-Streaming, native Live-Provider- und Plugin-Shards sowie Docker-gestützte Live-Modell-/Backend-/Gateway-Harnesse, die durch `release_profile` ausgewählt werden.<br />**Wird ausgeführt bei:** `run_release_soak=true`, `release_profile=full` oder fokussiertem `rerun_group=live-e2e`.<br />**Erneute Ausführung:** `rerun_group=live-e2e`, optional mit `live_suite_filter`. |
| Docker-Release-Pfad | **Job:** `Run Docker release-path validation`<br />**Zugehöriger Workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-Chunks des Release-Pfads gegen das gemeinsam genutzte Paketartefakt.<br />**Wird ausgeführt bei:** `run_release_soak=true`, `release_profile=full` oder fokussiertem `rerun_group=live-e2e`.<br />**Erneute Ausführung:** `rerun_group=live-e2e`.                                                                 |
| Paketakzeptanz      | **Job:** `Run package acceptance`<br />**Zugehöriger Workflow:** `Package Acceptance`<br />**Tests:** Offline-Plugin-Paket-Fixtures, Plugin-Update, Paketakzeptanz für Mock-OpenAI Telegram und Survivor-Prüfungen für veröffentlichte Upgrades gegen denselben Tarball. Blockierende Release-Prüfungen verwenden die standardmäßig zuletzt veröffentlichte Baseline; Soak-Prüfungen werden auf jede stabile npm-Veröffentlichung ab `2026.4.23` plus Fixtures für gemeldete Probleme erweitert.<br />**Erneute Ausführung:** `rerun_group=package`. |
| QA-Parität          | **Job:** `Run QA Lab parity lane` und `Run QA Lab parity report`<br />**Zugehöriger Workflow:** direkte Jobs<br />**Tests:** kandidat- und baselinebezogene agentische Paritätspakete, danach der Paritätsbericht.<br />**Erneute Ausführung:** `rerun_group=qa-parity` oder `rerun_group=qa`.                                                                                                                                                                                                                  |
| QA-Live-Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Zugehöriger Workflow:** direkter Job<br />**Tests:** schnelles Live-Matrix-QA-Profil in der `qa-live-shared`-Umgebung.<br />**Erneute Ausführung:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                    |
| QA-Live-Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Zugehöriger Workflow:** direkter Job<br />**Tests:** Live-Telegram-QA mit Convex-CI-Anmeldedaten-Leases.<br />**Erneute Ausführung:** `rerun_group=qa-live` oder `rerun_group=qa`.                                                                                                                                                                                                                                                                              |
| Release-Prüfer      | **Job:** `Verify release checks`<br />**Zugehöriger Workflow:** keiner<br />**Tests:** erforderliche Release-Prüfjobs für die ausgewählte Gruppe zur erneuten Ausführung.<br />**Erneute Ausführung:** erneut ausführen, nachdem fokussierte untergeordnete Jobs bestanden haben.                                                                                                                                                                                                                            |

## Docker-Chunks des Release-Pfads

Die Docker-Release-Pfad-Phase führt diese Chunks aus, wenn `live_suite_filter`
leer ist:

| Chunk                                                           | Abdeckung                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-Smoke-Lanes für den Release-Pfad.                                                      |
| `package-update-openai`                                         | Installations-/Update-Verhalten des OpenAI-Pakets, einschließlich Codex-Installation bei Bedarf.   |
| `package-update-anthropic`                                      | Installations- und Update-Verhalten des Anthropic-Pakets.                                          |
| `package-update-core`                                           | Provider-neutrales Paket- und Update-Verhalten.                                                    |
| `plugins-runtime-plugins`                                       | Plugin-Runtime-Lanes, die Plugin-Verhalten ausüben.                                                |
| `plugins-runtime-services`                                      | Service-gestützte und Live-Plugin-Runtime-Lanes; enthält OpenWebUI, wenn angefordert.              |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-Installations-/Runtime-Batches, aufgeteilt für parallele Release-Validierung.               |

Verwenden Sie gezielt `docker_lanes=<lane[,lane]>` im wiederverwendbaren Live/E2E-Workflow, wenn
nur eine Docker-Lane fehlgeschlagen ist. Die Release-Artefakte enthalten
Befehle zur erneuten Ausführung pro Lane mit Paketartefakt- und Image-Wiederverwendungs-Eingaben, sofern verfügbar.

## Release-Profile

`release_profile` steuert hauptsächlich die Live-/Provider-Breite innerhalb von Release-Prüfungen.
Es entfernt keine normale vollständige CI, Plugin Prerelease, Installations-Smoke, Paketakzeptanz
oder QA Lab. Für `stable` sind exhaustive Repo-/Live-E2E- und Docker-Release-Pfad-Chunks
Soak-Abdeckung und werden ausgeführt, wenn `run_release_soak=true` ist.
`full` erzwingt Soak-Abdeckung und lässt außerdem den Umbrella-Lauf Paket-Telegram-E2E
gegen das übergeordnete Release-Paketartefakt ausführen, wenn `rerun_group=all` ist, sodass ein vollständiger
Vorveröffentlichungs-Kandidat diese Telegram-Paket-Lane nicht unbemerkt überspringt.

| Profil    | Vorgesehene Verwendung                | Enthaltene Live-/Provider-Abdeckung                                                                                                                                                  |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Schnellster releasekritischer Smoke.  | OpenAI/Core-Live-Pfad, Docker-Live-Modelle für OpenAI, nativer Gateway-Core, natives OpenAI-Gateway-Profil, natives OpenAI-Plugin und Docker-Live-Gateway OpenAI.                   |
| `stable`  | Standardprofil für Release-Freigaben. | `minimum` plus Anthropic-Smoke, Google, MiniMax, Backend, nativer Live-Testharness, Docker-Live-CLI-Backend, Docker-ACP-Bind, Docker-Codex-Harness und ein OpenCode-Go-Smoke-Shard. |
| `full`    | Breite beratende Prüfung.             | `stable` plus beratende Provider, Plugin-Live-Shards und Medien-Live-Shards.                                                                                                        |

## Ergänzungen nur für Full

Diese Suites werden von `stable` übersprungen und von `full` einbezogen:

| Bereich                          | Nur-Full-Abdeckung                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Docker-Live-Modelle              | OpenCode Go, OpenRouter, xAI, Z.ai und Fireworks.                                                                                         |
| Docker-Live-Gateway              | Beratende Provider, aufgeteilt in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- und xAI/Z.ai-Shards.                                       |
| Native Gateway-Provider-Profile  | Vollständige Anthropic-Opus- und Sonnet/Haiku-Shards, Fireworks, DeepSeek, vollständige OpenCode-Go-Modell-Shards, OpenRouter, xAI und Z.ai. |
| Native Plugin-Live-Shards        | Plugins A-K, L-N, O-Z sonstige, Moonshot und xAI.                                                                                        |
| Native Medien-Live-Shards        | Audio, Google-Musik, MiniMax-Musik und Videogruppen A-D.                                                                                  |

`stable` enthält `native-live-src-gateway-profiles-anthropic-smoke` und
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` verwendet stattdessen die breiteren
Anthropic- und OpenCode-Go-Modell-Shards. Fokussierte erneute Ausführungen können weiterhin die
aggregierten Handles `native-live-src-gateway-profiles-anthropic` oder
`native-live-src-gateway-profiles-opencode-go` verwenden.

## Fokussierte erneute Ausführungen

Verwenden Sie `rerun_group`, um das Wiederholen nicht zusammenhängender Release-Boxen zu vermeiden:

| Kennung             | Umfang                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `all`               | Alle Phasen der vollständigen Release-Validierung.                   |
| `ci`                | Nur untergeordneter manueller vollständiger CI-Lauf.                 |
| `plugin-prerelease` | Nur untergeordneter Plugin-Vorabversionslauf.                        |
| `release-checks`    | Alle Phasen der OpenClaw Release-Prüfungen.                          |
| `install-smoke`     | Installations-Smoke-Test bis Release-Prüfungen.                      |
| `cross-os`          | Betriebssystemübergreifende Release-Prüfungen.                      |
| `live-e2e`          | Repo-/Live-E2E- und Docker-Release-Pfad-Validierung.                 |
| `package`           | Paketabnahme.                                                        |
| `qa`                | QA-Parität plus QA-Live-Lanes.                                       |
| `qa-parity`         | Nur QA-Paritäts-Lanes und Bericht.                                   |
| `qa-live`           | Nur QA-Live-Matrix und Telegram.                                     |
| `npm-telegram`      | Telegram-E2E für veröffentlichte Pakete; erfordert `npm_telegram_package_spec`. |

Verwenden Sie `live_suite_filter` mit `rerun_group=live-e2e`, wenn eine Live-Suite fehlgeschlagen ist.
Gültige Filter-IDs sind im wiederverwendbaren Live-/E2E-Workflow definiert, darunter
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` und
`live-codex-harness-docker`.

Der `live-gateway-advisory-docker`-Handle ist ein aggregierter Wiederholungshandle für seine
drei Provider-Shards, daher fächert er weiterhin auf alle Advisory-Docker-Gateway-Jobs auf.

Verwenden Sie `cross_os_suite_filter` mit `rerun_group=cross-os`, wenn eine betriebssystemübergreifende Lane
fehlgeschlagen ist. Der Filter akzeptiert eine OS-ID, eine Suite-ID oder ein OS/Suite-Paar, zum
Beispiel `windows/packaged-upgrade`, `windows` oder `packaged-fresh`. Betriebssystemübergreifende
Zusammenfassungen enthalten phasenbezogene Zeitangaben für paketierte Upgrade-Lanes, und lang laufende
Befehle geben Heartbeat-Zeilen aus, sodass ein hängendes Windows-Update vor dem
Job-Timeout sichtbar ist.

QA-Release-Prüfungs-Lanes sind advisory. Ein reiner QA-Fehler wird als Warnung gemeldet
und blockiert den Release-Prüfungs-Verifizierer nicht; führen Sie `rerun_group=qa`,
`qa-parity` oder `qa-live` erneut aus, wenn Sie neue QA-Nachweise benötigen.

## Aufzubewahrende Nachweise

Behalten Sie die Zusammenfassung `Full Release Validation` als releaseweite Übersicht. Sie verlinkt
untergeordnete Lauf-IDs und enthält Tabellen der langsamsten Jobs. Prüfen Sie bei Fehlern zuerst den
untergeordneten Workflow und führen Sie dann den kleinsten passenden Handle oben erneut aus.

Nützliche Artefakte:

- `release-package-under-test` aus dem übergeordneten Full-Release-Validation-Lauf und `OpenClaw Release Checks`
- Docker-Release-Pfad-Artefakte unter `.artifacts/docker-tests/`
- Paketabnahme-`package-under-test` und Docker-Abnahmeartefakte
- Betriebssystemübergreifende Release-Prüfungsartefakte für jedes OS und jede Suite
- QA-Paritäts-, Matrix- und Telegram-Artefakte

## Workflow-Dateien

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
