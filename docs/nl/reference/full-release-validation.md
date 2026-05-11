---
read_when:
    - Volledige releasevalidatie uitvoeren of herhalen
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Debuggen van fouten in de releasevalidatiefase
summary: Fasen, onderliggende workflows, releaseprofielen, handles voor opnieuw uitvoeren en bewijs voor volledige releasevalidatie
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-05-11T20:48:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de releaseparaplu. Het is het enige handmatige
toegangspunt voor pre-release-bewijs, maar het meeste werk gebeurt in onderliggende workflows zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer het uit vanaf een vertrouwde workflow-ref, normaal `main`, en geef de releasebranch,
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
bij het valideren van een oudere releasebranch of tag.

Standaard voert `release_profile=stable` de releaseblokkerende lanes uit en slaat
de uitputtende live/Docker-soak over. Geef `run_release_soak=true` door om de
soak-lanes op te nemen in een stabiele run. `release_profile=full` schakelt soak-lanes altijd in, zodat
het brede adviesprofiel nooit stilzwijgend dekking verliest.

Package Acceptance bouwt normaal de kandidaat-tarball vanuit de opgeloste
`ref`, inclusief full-SHA-runs die zijn gestart met `pnpm ci:full-release`. Geef na een
bèta-publicatie `release_package_spec=openclaw@YYYY.M.D-beta.N` door om het
verzonden npm-pakket opnieuw te gebruiken voor releasecontroles, Package Acceptance, cross-OS,
release-path Docker en package Telegram. Gebruik `package_acceptance_package_spec`
alleen wanneer Package Acceptance bewust een ander pakket moet bewijzen.

## Stages op hoofdniveau

| Stage                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doelresolutie    | **Job:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** lost de releasebranch, tag of volledige commit-SHA op en legt geselecteerde invoer vast.<br />**Opnieuw uitvoeren:** voer de paraplu opnieuw uit als dit mislukt.                                                                                                                                                                                                                               |
| Vitest en normale CI | **Job:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-grafiek tegen de doel-ref, inclusief Linux Node-lanes, gebundelde Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS, Control UI-i18n en Android via de paraplu.<br />**Opnieuw uitvoeren:** `rerun_group=ci`.                                                  |
| Plugin-prerelease    | **Job:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** release-only statische Plugin-controles, agentic Plugin-dekking, volledige extensiebatch-shards, Plugin-prerelease-Docker-lanes en een niet-blokkerend `plugin-inspector-advisory`-artefact voor compatibiliteitstriage.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                          |
| Releasecontroles       | **Job:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** install-smoke, cross-OS pakketcontroles, Package Acceptance, QA Lab-pariteit, live Matrix en live Telegram. Met `run_release_soak=true` of `release_profile=full` worden ook uitputtende live/E2E-suites en Docker release-path chunks uitgevoerd.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een smallere release-checks-handle. |
| Pakketartefact     | **Job:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Bewijst:** maakt het bovenliggende `release-package-under-test`-tarball vroeg genoeg voor pakketgerichte controles die niet hoeven te wachten op `OpenClaw Release Checks`.<br />**Opnieuw uitvoeren:** voer de paraplu opnieuw uit of geef `release_package_spec` op voor heruitvoeringen met een gepubliceerd pakket.                                                                                           |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** Telegram-pakketbewijs op basis van bovenliggend artefact voor `rerun_group=all` met `release_profile=full`, of Telegram-bewijs voor gepubliceerd pakket wanneer `release_package_spec` of `npm_telegram_package_spec` is ingesteld.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `release_package_spec` of `npm_telegram_package_spec`.                           |
| Parapluverificateur    | **Job:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert vastgelegde conclusies van onderliggende runs opnieuw en voegt tabellen met traagste jobs uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze job opnieuw uit nadat een mislukte onderliggende workflow opnieuw groen is geworden.                                                                                                                                                                                    |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere paraplu een oudere.
Wanneer de bovenliggende workflow wordt geannuleerd, annuleert de monitor alle onderliggende workflows die al
zijn gestart. Validatieruns voor releasebranches en tags annuleren elkaar standaard niet.

## Releasecontroles-stages

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze lost het doel
eenmaal op en bereidt een gedeeld `release-package-under-test`-artefact voor wanneer pakket-
of Docker-gerichte stages dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Releasedoel         | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Tests:** geselecteerde ref, optionele verwachte SHA, profiel, opnieuw-uitvoeren-groep en gerichte live-suitefilter.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                                                                                                                             |
| Pakketartefact      | **Taak:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Tests:** maakt een pakket of resolveert een kandidaat-tarball en uploadt `release-package-under-test` voor downstream pakketgerichte controles.<br />**Opnieuw uitvoeren:** het getroffen pakket, de cross-OS- of live/E2E-groep.                                                                                                                                                                           |
| Installatiesmoke    | **Taak:** `Run install smoke`<br />**Onderliggende workflow:** `Install Smoke`<br />**Tests:** volledig installatiepad met hergebruik van de root-Dockerfile-smoke-image, QR-pakketinstallatie, Docker-smokes voor root en Gateway, Docker-tests voor installer, Bun global install image-provider smoke, en snelle gebundelde-Plugin install/uninstall E2E.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`.                                                                                |
| Cross-OS            | **Taak:** `cross_os_release_checks`<br />**Onderliggende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** fresh- en upgrade-lanes op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baselinepakket.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                                                                                                                                   |
| Repo en live E2E    | **Taak:** `Run repo/live E2E validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** repository-E2E, live cache, OpenAI websocket-streaming, native live provider- en Plugin-shards, en Docker-ondersteunde live model/backend/Gateway-harnassen geselecteerd door `release_profile`.<br />**Runs:** `run_release_soak=true`, `release_profile=full`, of gerichte `rerun_group=live-e2e`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Taak:** `Run Docker release-path validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-chunks voor het releasepad tegen het gedeelde pakketartefact.<br />**Runs:** `run_release_soak=true`, `release_profile=full`, of gerichte `rerun_group=live-e2e`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                               |
| Pakketacceptatie    | **Taak:** `Run package acceptance`<br />**Onderliggende workflow:** `Package Acceptance`<br />**Tests:** offline Plugin-pakketfixtures, Plugin-update, pakketacceptatie voor mock-OpenAI Telegram, en controles voor overlevende published-upgrades tegen dezelfde tarball. Blokkerende releasechecks gebruiken de standaard laatst gepubliceerde baseline; soak-controles worden uitgebreid naar elke stabiele npm-release op of na `2026.4.23` plus fixtures voor gemelde issues.<br />**Opnieuw uitvoeren:** `rerun_group=package`. |
| QA-pariteit         | **Taak:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Onderliggende workflow:** directe taken<br />**Tests:** agentic pariteitspakketten voor kandidaat en baseline, daarna het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                                                                                                                         |
| QA live Matrix      | **Taak:** `Run QA Lab live Matrix lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                            |
| QA live Telegram    | **Taak:** `Run QA Lab live Telegram lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** live Telegram-QA met Convex CI-credentialleases.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                                      |
| Releaseverificatie  | **Taak:** `Verify release checks`<br />**Onderliggende workflow:** geen<br />**Tests:** vereiste releasecheck-taken voor de geselecteerde opnieuw-uitvoeren-groep.<br />**Opnieuw uitvoeren:** opnieuw uitvoeren nadat gerichte child-taken zijn geslaagd.                                                                                                                                                                                                                                           |

## Docker-releasepadsegmenten

De Docker-releasepadfase voert deze segmenten uit wanneer `live_suite_filter`
leeg is:

| Segment                                                         | Dekking                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core Docker-smoke-lanes voor het releasepad.                                                      |
| `package-update-openai`                                         | Installatie-/updategedrag van OpenAI-pakketten, Codex-installatie op aanvraag en Chat Completions-toolaanroepen. |
| `package-update-anthropic`                                      | Installatie- en updategedrag van Anthropic-pakketten.                                             |
| `package-update-core`                                           | Providerneutraal pakket- en updategedrag.                                                        |
| `plugins-runtime-plugins`                                       | Plugin-runtime-lanes die Plugin-gedrag uitoefenen.                                                |
| `plugins-runtime-services`                                      | Service-ondersteunde en live Plugin-runtime-lanes; bevat OpenWebUI wanneer aangevraagd.           |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-installatie-/runtimebatches, opgesplitst voor parallelle releasevalidatie.                 |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts één Docker-lane is mislukt. De releaseartefacten bevatten per-lane opdrachten voor opnieuw uitvoeren
met pakketartefact- en image-hergebruikinvoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` regelt vooral de live/provider-breedte binnen releasechecks.
Het verwijdert geen normale volledige CI, Plugin Prerelease, installatiesmoke, pakketacceptatie
of QA Lab. Voor `stable` zijn uitgebreide repo/live E2E en Docker-
releasepadsegmenten soak-dekking en worden ze uitgevoerd wanneer `run_release_soak=true`.
`full` dwingt soak-dekking af en laat de paraplu-run ook pakket-Telegram-
E2E uitvoeren tegen het bovenliggende releasepakketartefact wanneer `rerun_group=all`, zodat een volledige
pre-publish-kandidaat die Telegram-pakketlane niet stilzwijgend overslaat.

| Profiel   | Beoogd gebruik                      | Inbegrepen live/provider-dekking                                                                                                                                              |
| --------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste releasekritische smoke.     | OpenAI/core live pad, Docker live models voor OpenAI, native Gateway core, native OpenAI Gateway-profiel, native OpenAI Plugin en Docker live Gateway OpenAI.                 |
| `stable`  | Standaardprofiel voor releasegoedkeuring. | `minimum` plus Anthropic smoke, Google, MiniMax, backend, native live testharnas, Docker live CLI backend, Docker ACP bind, Docker Codex-harnas en een OpenCode Go smoke-shard. |
| `full`    | Brede adviserende sweep.            | `stable` plus adviserende providers, Plugin live-shards en media live-shards.                                                                                                 |

## Alleen-full toevoegingen

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                           | Alleen-full dekking                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                                                                          |
| Docker live Gateway              | Adviserende providers opgesplitst in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- en xAI/Z.ai-shards.                    |
| Native Gateway-providerprofielen | Volledige Anthropic Opus- en Sonnet/Haiku-shards, Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin live-shards        | Plugins A-K, L-N, O-Z overige, Moonshot en xAI.                                                                           |
| Native media live-shards         | Audio, Google music, MiniMax music en videogroepen A-D.                                                                   |

`stable` bevat `native-live-src-gateway-profiles-anthropic-smoke` en
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` gebruikt in plaats daarvan de bredere
Anthropic- en OpenCode Go-modelshards. Gerichte heruitvoeringen kunnen nog steeds de
geaggregeerde handles `native-live-src-gateway-profiles-anthropic` of
`native-live-src-gateway-profiles-opencode-go` gebruiken.

## Gerichte heruitvoeringen

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releaseboxes opnieuw worden uitgevoerd:

| Handle              | Bereik                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Alle stadia voor volledige releasevalidatie.                                                     |
| `ci`                | Alleen handmatige volledige CI-child.                                                           |
| `plugin-prerelease` | Alleen Plugin-prerelease-child.                                                                 |
| `release-checks`    | Alle stadia voor OpenClaw-releasecontroles.                                                      |
| `install-smoke`     | Installatiesmoketest via releasecontroles.                                                       |
| `cross-os`          | Cross-OS-releasecontroles.                                                                       |
| `live-e2e`          | Repo/live E2E- en Docker-validatie van het releasepad.                                           |
| `package`           | Pakketacceptatie.                                                                                |
| `qa`                | QA-pariteit plus QA-live-lanes.                                                                  |
| `qa-parity`         | Alleen QA-pariteit-lanes en rapport.                                                            |
| `qa-live`           | Alleen QA-live Matrix en Telegram.                                                              |
| `npm-telegram`      | Gepubliceerd pakket Telegram E2E; vereist `release_package_spec` of `npm_telegram_package_spec`. |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer een live-suite is mislukt.
Geldige filter-id's worden gedefinieerd in de herbruikbare live/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

De `live-gateway-advisory-docker`-handle is een geaggregeerde rerun-handle voor zijn
drie provider-shards, dus hij waaiert nog steeds uit naar alle adviserende Docker Gateway-jobs.

Gebruik `cross_os_suite_filter` met `rerun_group=cross-os` wanneer een cross-OS-lane
is mislukt. Het filter accepteert een OS-id, een suite-id of een OS/suite-paar, bijvoorbeeld
`windows/packaged-upgrade`, `windows` of `packaged-fresh`. Cross-OS-samenvattingen
bevatten timings per fase voor lanes voor pakket-upgrades, en langlopende
opdrachten printen Heartbeat-regels zodat een vastgelopen Windows-update zichtbaar is vóór de
jobtime-out.

QA-releasecontrole-lanes zijn adviserend. Een uitsluitend QA-fout wordt gerapporteerd als waarschuwing
en blokkeert de releasecontroleverifier niet; voer `rerun_group=qa`,
`qa-parity` of `qa-live` opnieuw uit wanneer je nieuw QA-bewijs nodig hebt.

## Te bewaren bewijs

Bewaar de samenvatting `Full Release Validation` als de index op releaseniveau. Deze linkt
child-run-id's en bevat tabellen met traagste jobs. Inspecteer bij fouten eerst de child-
workflow en voer daarna de kleinste overeenkomende handle hierboven opnieuw uit.

Nuttige artefacten:

- `release-package-under-test` van de Full Release Validation-parent en `OpenClaw Release Checks`
- Docker-releasepadartefacten onder `.artifacts/docker-tests/`
- Pakketacceptatie `package-under-test` en Docker-acceptatieartefacten
- Cross-OS-releasecontrole-artefacten voor elk OS en elke suite
- QA-pariteit-, Matrix- en Telegram-artefacten

## Workflowbestanden

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
