---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Fouten in de releasevalidatiefase opsporen
summary: Fasen van volledige releasevalidatie, onderliggende workflows, releaseprofielen, heruitvoerhandles en bewijs
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-05-01T11:22:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de releaseparaplu. Het is het enkele handmatige
startpunt voor pre-releasebewijs, maar het meeste werk gebeurt in onderliggende workflows, zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer dit uit vanaf een vertrouwde workflow-ref, normaal `main`, en geef de releasebranch,
tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Onderliggende workflows gebruiken de vertrouwde workflow-ref voor de testharnas en de invoer
`ref` voor de kandidaat die wordt getest. Daardoor blijft nieuwe validatielogica beschikbaar
bij het valideren van een oudere releasebranch of tag.

## Fasen op hoofdniveau

| Fase                  | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doelresolutie         | **Job:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** lost de releasebranch, tag of volledige commit-SHA op en legt geselecteerde invoer vast.<br />**Opnieuw uitvoeren:** voer de paraplu opnieuw uit als dit mislukt.                                                                                                                                      |
| Vitest en normale CI  | **Job:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-grafiek tegen de doel-ref, inclusief Linux Node-lanes, gebundelde plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS, Control UI i18n en Android via de paraplu.<br />**Opnieuw uitvoeren:** `rerun_group=ci`. |
| Plugin-prerelease     | **Job:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** alleen-voor-release statische plugincontroles, agentische plugindekking, volledige extensiebatch-shards en plugin-prerelease-Docker-lanes.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                 |
| Releasecontroles      | **Job:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** install-smoke, cross-OS-pakketcontroles, live/E2E-suites, Docker-releasepadchunks, Package Acceptance, QA Lab-pariteit, live Matrix en live Telegram.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een nauwere release-checks-handle.        |
| Telegram na publicatie | **Job:** `Run post-publish Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** optioneel Telegram-bewijs voor gepubliceerd pakket wanneer `npm_telegram_package_spec` is ingesteld.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram`.                                                                                                             |
| Parapluverificateur   | **Job:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert vastgelegde conclusies van onderliggende runs opnieuw en voegt tabellen met traagste jobs uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze job opnieuw uit nadat een mislukte onderliggende workflow groen is geworden.                              |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere paraplu een oudere.
Wanneer de bovenliggende workflow wordt geannuleerd, annuleert de monitor elke onderliggende workflow die al
is gestart. Validatieruns voor releasebranches en tags annuleren elkaar standaard niet.

## Fasen voor releasecontroles

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze lost het doel
eenmaal op en bereidt een gedeeld `release-package-under-test`-artifact voor wanneer pakket-
of Docker-gerichte fasen dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Releasedoel         | **Job:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Test:** geselecteerde ref, optionele verwachte SHA, profiel, groep voor opnieuw uitvoeren en gerichte live-suitefilter.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                   |
| Pakketartifact      | **Job:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Test:** pakt of lost één kandidaat-tarball op en uploadt `release-package-under-test` voor downstream pakketgerichte controles.<br />**Opnieuw uitvoeren:** de getroffen pakket-, cross-OS- of live/E2E-groep.                                                                                           |
| Install-smoke       | **Job:** `Run install smoke`<br />**Onderliggende workflow:** `Install Smoke`<br />**Test:** volledig installatiepad met hergebruik van de root-Dockerfile-smoke-image, QR-pakketinstallatie, root- en Gateway-Docker-smokes, installer-Docker-tests, Bun globale-installatie-image-provider-smoke en snelle gebundelde-plugin-Docker-E2E.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Onderliggende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** nieuwe en upgrade-lanes op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baselinepakket.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                           |
| Repo en live E2E    | **Job:** `Run repo/live E2E validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** repository-E2E, live cache, OpenAI-websocketstreaming, native live provider- en plugin-shards, en Docker-backed live model/backend/Gateway-harnassen geselecteerd door `release_profile`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Job:** `Run Docker release-path validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** Docker-releasepadchunks tegen het gedeelde pakketartifact.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                                        |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Onderliggende workflow:** `Package Acceptance`<br />**Test:** artifact-native compatibiliteit van gebundelde-kanaalafhankelijkheden, offline plugin-pakketfixtures en mock-OpenAI Telegram-pakketacceptatie tegen dezelfde tarball.<br />**Opnieuw uitvoeren:** `rerun_group=package`.                                                               |
| QA-pariteit         | **Job:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Onderliggende workflow:** directe jobs<br />**Test:** kandidaat- en baseline-agentische pariteitspakketten, daarna het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                       |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Onderliggende workflow:** directe job<br />**Test:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                    |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Onderliggende workflow:** directe job<br />**Test:** live Telegram-QA met Convex CI-credentialleases.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                 |
| Releaseverificateur | **Job:** `Verify release checks`<br />**Onderliggende workflow:** geen<br />**Test:** vereiste releasecontrolejobs voor de geselecteerde groep voor opnieuw uitvoeren.<br />**Opnieuw uitvoeren:** voer opnieuw uit nadat gerichte onderliggende jobs zijn geslaagd.                                                                                                                          |

## Docker-releasepadchunks

De Docker-releasepadfase voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                                                       | Dekking                                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Core Docker-releasepad-smoke-lanes.                                     |
| `package-update-openai`                                                                     | Installatie- en updategedrag van OpenAI-pakketten.                      |
| `package-update-anthropic`                                                                  | Installatie- en updategedrag van Anthropic-pakketten.                   |
| `package-update-core`                                                                       | Providerneutraal pakket- en updategedrag.                               |
| `plugins-runtime-plugins`                                                                   | Plugin-runtime-lanes die plugingedrag oefenen.                          |
| `plugins-runtime-services`                                                                  | Service-backed plugin-runtime-lanes; omvat OpenWebUI wanneer gevraagd.  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Plugin-installatie/runtime-batches gesplitst voor parallelle releasevalidatie. |
| `bundled-channels-core`                                                                     | Docker-gedrag van gebundelde kanalen.                                   |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Updategedrag van gebundelde kanalen.                                    |
| `bundled-channels-contracts`                                                                | Contractcontroles voor gebundelde kanalen in het Docker-releasepad.     |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts een Docker-lane is mislukt. De release-artefacten bevatten per-lane rerun-
opdrachten met pakketartefact- en afbeeldingshergebruikinvoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt alleen de live-/providerbreedte binnen releasecontroles. Het
verwijdert niet de normale volledige CI, Plugin-voorrelease, installatierooktest, pakket-
acceptatie, QA Lab of Docker release-padsegmenten.

| Profiel   | Beoogd gebruik                       | Inbegrepen live-/providerdekking                                                                                                                                             |
| --------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste releasekritieke rooktest.    | OpenAI/core live-pad, Docker-live modellen voor OpenAI, native Gateway-core, native OpenAI Gateway-profiel, native OpenAI Plugin en Docker live Gateway OpenAI.              |
| `stable`  | Standaardprofiel voor releasegoedkeuring. | `minimum` plus Anthropic, Google, MiniMax, backend, native live-testharnas, Docker live CLI-backend, Docker ACP-bind, Docker Codex-harnas en een OpenCode Go-rooktestshard. |
| `full`    | Brede adviserende sweep.             | `stable` plus adviserende providers, Plugin live-shards en media live-shards.                                                                                                |

## Alleen-full toevoegingen

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                           | Alleen-full dekking                                                            |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Docker live-modellen             | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                               |
| Docker live Gateway              | Adviserende shard voor DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI en Z.ai. |
| Native Gateway-providerprofielen | Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin live-shards        | Plugins A-K, L-N, O-Z overig, Moonshot en xAI.                                 |
| Native media live-shards         | Audio, Google-muziek, MiniMax-muziek en videogroepen A-D.                      |

`stable` bevat `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
gebruikt in plaats daarvan de bredere OpenCode Go-modelshards.

## Gerichte reruns

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releaseboxen opnieuw worden uitgevoerd:

| Handle              | Scope                                             |
| ------------------- | ------------------------------------------------- |
| `all`               | Alle stadia van volledige releasevalidatie.       |
| `ci`                | Alleen handmatige volledige CI-child.             |
| `plugin-prerelease` | Alleen Plugin-voorrelease-child.                  |
| `release-checks`    | Alle stadia van OpenClaw-releasecontroles.        |
| `install-smoke`     | Installatierooktest via releasecontroles.         |
| `cross-os`          | Cross-OS-releasecontroles.                        |
| `live-e2e`          | Repo/live E2E- en Docker release-padvalidatie.    |
| `package`           | Pakketacceptatie.                                 |
| `qa`                | QA-pariteit plus QA live-lanes.                   |
| `qa-parity`         | Alleen QA-pariteitslanes en rapport.              |
| `qa-live`           | Alleen QA live Matrix en Telegram.                |
| `npm-telegram`      | Alleen optionele Telegram E2E na publicatie.      |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer een live-suite is mislukt.
Geldige filter-id's zijn gedefinieerd in de herbruikbare live/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

## Bewijs om te bewaren

Bewaar de samenvatting `Full Release Validation` als index op releaseniveau. Deze linkt
naar child-run-id's en bevat tabellen met traagste jobs. Inspecteer bij fouten eerst de
child-workflow en voer daarna de kleinste passende handle hierboven opnieuw uit.

Nuttige artefacten:

- `release-package-under-test` van `OpenClaw Release Checks`
- Docker release-padartefacten onder `.artifacts/docker-tests/`
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
