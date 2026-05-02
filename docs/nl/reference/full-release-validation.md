---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Problemen oplossen bij falende releasevalidatiefasen
summary: Fasen van volledige releasevalidatie, onderliggende workflows, releaseprofielen, rerun-handles en bewijsmateriaal
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-05-02T20:58:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de release-overkoepeling. Het is het enige handmatige
ingangspunt voor pre-releasebewijs, maar het meeste werk gebeurt in onderliggende workflows, zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer dit uit vanaf een vertrouwde workflow-ref, normaal gesproken `main`, en geef de release-branch,
tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Onderliggende workflows gebruiken de vertrouwde workflow-ref voor de harness en de invoer
`ref` voor de kandidaat die wordt getest. Daardoor blijft nieuwe validatielogica beschikbaar
bij het valideren van een oudere release-branch of tag.

Package Acceptance bouwt normaal gesproken de kandidaat-tarball vanaf de opgeloste
`ref`, inclusief runs met volledige SHA die zijn gestart met `pnpm ci:full-release`. Geef na
publicatie `package_acceptance_package_spec=openclaw@YYYY.M.D` (of
`openclaw@beta`/`openclaw@latest`) door om in plaats daarvan dezelfde package-/updatematrix uit te voeren tegen
het gepubliceerde npm-package.

## Topniveaufasen

| Fase                 | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doelresolutie        | **Job:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** lost de release-branch, tag of volledige commit-SHA op en legt geselecteerde invoer vast.<br />**Opnieuw uitvoeren:** voer de overkoepeling opnieuw uit als dit mislukt.                                                                                                                                                                              |
| Vitest en normale CI | **Job:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-grafiek tegen de doel-ref, inclusief Linux Node-lanes, gebundelde Plugin-shards, channelcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS, Control UI i18n en Android via de overkoepeling.<br />**Opnieuw uitvoeren:** `rerun_group=ci`. |
| Plugin-prerelease    | **Job:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** statische controles alleen voor releases van Plugins, agentische Plugin-dekking, volledige extension-batchshards en Plugin-prerelease-Docker-lanes.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Releasecontroles     | **Job:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** install-smoke, cross-OS packagecontroles, live/E2E-suites, Docker-releasepadchunks, Package Acceptance, QA Lab-pariteit, live Matrix en live Telegram.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een nauwere release-checks-handle.                                |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** op artefacten gebaseerd Telegram-packagebewijs voor `rerun_group=all` met `release_profile=full`, of Telegram-bewijs voor een gepubliceerd package wanneer `npm_telegram_package_spec` is ingesteld.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `npm_telegram_package_spec`.                                     |
| Overkoepelende verifier | **Job:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert de vastgelegde conclusies van onderliggende runs opnieuw en voegt tabellen met traagste jobs uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze job opnieuw uit nadat een mislukte onderliggende workflow groen is geworden.                                                                                                                                   |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere overkoepeling een oudere.
Wanneer de parent wordt geannuleerd, annuleert de monitor alle onderliggende workflows die al
zijn gestart. Validatieruns voor release-branches en tags annuleren elkaar standaard niet.

## Fasen voor releasecontroles

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze lost het doel
eenmaal op en bereidt een gedeeld `release-package-under-test`-artefact voor wanneer package-
of Docker-gerichte fasen dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Releasedoel         | **Job:** `Resolve target ref`<br />**Ondersteunende workflow:** geen<br />**Tests:** geselecteerde ref, optionele verwachte SHA, profiel, groep voor opnieuw uitvoeren en gefocust live-suitefilter.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Packageartefact     | **Job:** `Prepare release package artifact`<br />**Ondersteunende workflow:** geen<br />**Tests:** pakt of lost één kandidaat-tarball op en uploadt `release-package-under-test` voor downstream packagegerichte controles.<br />**Opnieuw uitvoeren:** de getroffen package-, cross-OS- of live/E2E-groep.                                                                                                           |
| Install-smoke       | **Job:** `Run install smoke`<br />**Ondersteunende workflow:** `Install Smoke`<br />**Tests:** volledig installatiepad met hergebruik van root-Dockerfile-smoke-image, QR-packageinstallatie, root- en Gateway-Docker-smokes, installer-Docker-tests, Bun-global-install image-provider-smoke en snelle gebundelde-Plugin install/uninstall E2E.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Ondersteunende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** fresh- en upgrade-lanes op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baseline-package.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                                               |
| Repo en live E2E    | **Job:** `Run repo/live E2E validation`<br />**Ondersteunende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** repository-E2E, live cache, OpenAI-websocketstreaming, native live provider- en Plugin-shards, en door Docker ondersteunde live model-/backend-/Gateway-harnesses geselecteerd door `release_profile`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Job:** `Run Docker release-path validation`<br />**Ondersteunende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-chunks voor het releasepad tegen het gedeelde packageartefact.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Ondersteunende workflow:** `Package Acceptance`<br />**Tests:** offline Plugin-packagefixtures, Plugin-update, mock-OpenAI Telegram-packageacceptatie en gepubliceerde-upgrade-overlevingscontroles van elke stabiele npm-release op of na `2026.4.23` tegen dezelfde tarball.<br />**Opnieuw uitvoeren:** `rerun_group=package`.                                         |
| QA-pariteit         | **Job:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Ondersteunende workflow:** directe jobs<br />**Tests:** agentische pariteitspakketten voor kandidaat en baseline, daarna het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Ondersteunende workflow:** directe job<br />**Tests:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Ondersteunende workflow:** directe job<br />**Tests:** live Telegram-QA met Convex CI-credentialleases.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                    |
| Releaseverifier     | **Job:** `Verify release checks`<br />**Ondersteunende workflow:** geen<br />**Tests:** vereiste release-check-jobs voor de geselecteerde groep voor opnieuw uitvoeren.<br />**Opnieuw uitvoeren:** voer opnieuw uit nadat gefocuste onderliggende jobs slagen.                                                                                                                                                                                                 |

## Docker-releasepadchunks

De Docker-releasepadfase voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                           | Dekking                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-smoke-lanes voor het releasepad.                            |
| `package-update-openai`                                         | Installatie- en updategedrag van OpenAI-packages.                       |
| `package-update-anthropic`                                      | Installatie- en updategedrag van Anthropic-packages.                    |
| `package-update-core`                                           | Providerneutraal package- en updategedrag.                              |
| `plugins-runtime-plugins`                                       | Plugin-runtime-lanes die Plugin-gedrag oefenen.                         |
| `plugins-runtime-services`                                      | Door services ondersteunde Plugin-runtime-lanes; bevat OpenWebUI wanneer gevraagd. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-installatie-/runtimebatches gesplitst voor parallelle releasevalidatie. |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts één Docker-lane is mislukt. De releaseartefacten bevatten per-lane commando's voor opnieuw uitvoeren
met packageartefact- en imagehergebruikinvoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt vooral de live-/providerbreedte binnen releasecontroles.
Het verwijdert geen normale volledige CI, Plugin-prerelease, installatiesmoke, pakketacceptatie,
QA Lab of Docker-releasepadonderdelen. `full` zorgt er ook voor dat de
overkoepelende run package Telegram E2E tegen het releasepakketartefact uitvoert wanneer
`rerun_group=all`, zodat een volledige kandidaat vóór publicatie die
Telegram-pakketlane niet stilzwijgend overslaat.

| Profiel   | Beoogd gebruik                  | Inbegrepen live-/providerdekking                                                                                                                                             |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste releasekritieke smoke.   | OpenAI-/core-livepad, Docker-live-modellen voor OpenAI, native Gateway-core, native OpenAI Gateway-profiel, native OpenAI-Plugin en Docker-live-Gateway OpenAI.               |
| `stable`  | Standaardprofiel voor releasegoedkeuring. | `minimum` plus Anthropic, Google, MiniMax, backend, native live-testharnas, Docker-live-CLI-backend, Docker ACP-bind, Docker Codex-harnas en een OpenCode Go-smoke-shard. |
| `full`    | Brede adviserende sweep.         | `stable` plus adviserende providers, Plugin-live-shards en media-live-shards.                                                                                                |

## Toevoegingen alleen voor full

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                           | Dekking alleen voor full                                                        |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker-live-modellen             | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                                |
| Docker-live-Gateway              | Adviserende shard voor DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI en Z.ai. |
| Native Gateway-providerprofielen | Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin-live-shards        | Plugins A-K, L-N, O-Z overig, Moonshot en xAI.                                  |
| Native media-live-shards         | Audio, Google music, MiniMax music en videogroepen A-D.                         |

`stable` bevat `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
gebruikt in plaats daarvan de bredere OpenCode Go-modelshards.

## Gerichte herhalingen

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releaseboxen worden herhaald:

| Handle              | Scope                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Alle fasen van Full Release Validation.                               |
| `ci`                | Alleen handmatige volledige CI-subrun.                                |
| `plugin-prerelease` | Alleen Plugin-prerelease-subrun.                                      |
| `release-checks`    | Alle fasen van OpenClaw Release Checks.                               |
| `install-smoke`     | Installatiesmoke via releasecontroles.                                |
| `cross-os`          | Cross-OS-releasecontroles.                                            |
| `live-e2e`          | Repo-/live-E2E- en Docker-releasepadvalidatie.                        |
| `package`           | Pakketacceptatie.                                                     |
| `qa`                | QA-pariteit plus QA-live-lanes.                                       |
| `qa-parity`         | Alleen QA-pariteitslanes en rapport.                                  |
| `qa-live`           | Alleen QA-live Matrix en Telegram.                                    |
| `npm-telegram`      | Gepubliceerde-pakket Telegram E2E; vereist `npm_telegram_package_spec`. |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer één live-suite is mislukt.
Geldige filter-id's zijn gedefinieerd in de herbruikbare live-/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

## Te bewaren bewijsmateriaal

Bewaar de `Full Release Validation`-samenvatting als index op releaseniveau. Deze linkt
child-run-id's en bevat tabellen met traagste taken. Inspecteer bij fouten eerst de
child-workflow en voer daarna de kleinste overeenkomende handle hierboven opnieuw uit.

Nuttige artefacten:

- `release-package-under-test` uit `OpenClaw Release Checks`
- Docker-releasepadartefacten onder `.artifacts/docker-tests/`
- Pakketacceptatie `package-under-test` en Docker-acceptatieartefacten
- Cross-OS-releasecontrole-artefacten voor elk OS en elke suite
- QA-pariteits-, Matrix- en Telegram-artefacten

## Workflowbestanden

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
