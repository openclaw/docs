---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Fouten opsporen bij mislukkingen in releasevalidatiefasen
summary: Fasen voor volledige releasevalidatie, onderliggende workflows, releaseprofielen, heruitvoer-handles en bewijs
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-05-05T01:49:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de overkoepelende releasevalidatie. Dit is het enige handmatige
ingangspunt voor pre-releasebewijs, maar het meeste werk gebeurt in onderliggende workflows zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer deze uit vanaf een vertrouwde workflow-ref, normaal gesproken `main`, en geef de releasebranch,
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

Standaard voert `release_profile=stable` de releaseblokkerende lanes uit en slaat het
uitputtende live-/Docker-soakproces over. Geef `run_release_soak=true` door om de
soak-lanes in een stabiele run op te nemen. `release_profile=full` schakelt soak-lanes altijd in zodat
het brede adviesprofiel nooit stilzwijgend dekking verliest.

Package Acceptance bouwt de kandidaat-tarball normaal gesproken vanuit de opgeloste
`ref`, inclusief runs met volledige SHA die met `pnpm ci:full-release` zijn gestart. Geef na
publicatie `package_acceptance_package_spec=openclaw@YYYY.M.D` (of
`openclaw@beta`/`openclaw@latest`) door om dezelfde pakket-/updatematrix in plaats daarvan tegen
het geleverde npm-pakket uit te voeren.

## Hoofdfasen

| Fase                 | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Doelresolutie        | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** lost de releasebranch, tag of volledige commit-SHA op en registreert geselecteerde invoer.<br />**Opnieuw uitvoeren:** voer de overkoepelende workflow opnieuw uit als dit mislukt.                                                                                                                                                                      |
| Vitest en normale CI | **Taak:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-grafiek tegen de doel-ref, inclusief Linux Node-lanes, gebundelde Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, documentatiecontroles, Python-Skills, Windows, macOS, Control UI-i18n en Android via de overkoepelende workflow.<br />**Opnieuw uitvoeren:** `rerun_group=ci`. |
| Plugin-prerelease    | **Taak:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** release-only statische Plugin-controles, agentische Plugin-dekking, volledige extensiebatch-shards en Plugin-prerelease-Docker-lanes.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                                                                            |
| Releasecontroles     | **Taak:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** installatiesmoke, pakketcontroles op meerdere besturingssystemen, Package Acceptance, QA Lab-pariteit, live Matrix en live Telegram. Met `run_release_soak=true` of `release_profile=full` worden ook uitputtende live-/E2E-suites en Docker-releasepadchunks uitgevoerd.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een smallere release-checks-handle. |
| Pakketartefact       | **Taak:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Bewijst:** maakt de bovenliggende tarball `release-package-under-test` vroeg genoeg aan voor pakketgerichte controles die niet hoeven te wachten op `OpenClaw Release Checks`.<br />**Opnieuw uitvoeren:** voer de overkoepelende workflow opnieuw uit of geef `npm_telegram_package_spec` op voor `rerun_group=npm-telegram`.                         |
| Pakket-Telegram      | **Taak:** `Run package Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** Telegram-pakketbewijs op basis van het bovenliggende artefact voor `rerun_group=all` met `release_profile=full`, of Telegram-bewijs voor gepubliceerd pakket wanneer `npm_telegram_package_spec` is ingesteld.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `npm_telegram_package_spec`.                        |
| Overkoepelende verifier | **Taak:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert geregistreerde conclusies van onderliggende runs opnieuw en voegt tabellen met traagste taken uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze taak opnieuw uit nadat een mislukte onderliggende workflow opnieuw groen is uitgevoerd.                                                                                 |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere overkoepelende workflow een oudere.
Wanneer de bovenliggende workflow wordt geannuleerd, annuleert de monitor alle onderliggende workflows die al
zijn gestart. Validatieruns voor releasebranches en tags annuleren elkaar standaard niet.

## Fasen van releasecontroles

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze lost het doel
één keer op en bereidt een gedeeld artefact `release-package-under-test` voor wanneer pakket-
of Docker-gerichte fasen dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release-doel        | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Tests:** geselecteerde ref, optionele verwachte SHA, profiel, groep voor opnieuw uitvoeren en gerichte livesuite-filter.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                                                                                                                            |
| Pakketartefact      | **Taak:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Tests:** maakt pakketten aan of lost één kandidaat-tarball op en uploadt `release-package-under-test` voor downstream pakketgerichte controles.<br />**Opnieuw uitvoeren:** het getroffen pakket, cross-OS- of live/E2E-groep.                                                                                                                                                                                   |
| Installatiesmoke    | **Taak:** `Run install smoke`<br />**Onderliggende workflow:** `Install Smoke`<br />**Tests:** volledig installatiepad met hergebruik van root-Dockerfile-smoke-image, QR-pakketinstallatie, Docker-smokes voor root en Gateway, Docker-tests voor installatieprogramma, Bun global install image-provider-smoke en snelle gebundelde-Plugin-installatie/verwijdering-E2E.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`.                                                                       |
| Cross-OS            | **Taak:** `cross_os_release_checks`<br />**Onderliggende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** fresh- en upgradebanen op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baselinepakket.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                                                                                                                                        |
| Repo en live E2E    | **Taak:** `Run repo/live E2E validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** repository-E2E, live cache, OpenAI websocket-streaming, native live provider- en Plugin-shards, en Docker-ondersteunde live model/backend/Gateway-harnassen geselecteerd door `release_profile`.<br />**Draait:** `run_release_soak=true`, `release_profile=full`, of gericht `rerun_group=live-e2e`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Taak:** `Run Docker release-path validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-chunks voor het releasepad tegen het gedeelde pakketartefact.<br />**Draait:** `run_release_soak=true`, `release_profile=full`, of gericht `rerun_group=live-e2e`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                                       |
| Pakketacceptatie    | **Taak:** `Run package acceptance`<br />**Onderliggende workflow:** `Package Acceptance`<br />**Tests:** offline Plugin-pakketfixtures, Plugin-update, mock-OpenAI Telegram-pakketacceptatie en published-upgrade-survivor-controles tegen dezelfde tarball. Blokkerende releasecontroles gebruiken de standaard nieuwste gepubliceerde baseline; soak-controles breiden uit naar elke stabiele npm-release op of na `2026.4.23` plus fixtures voor gemelde issues.<br />**Opnieuw uitvoeren:** `rerun_group=package`. |
| QA-pariteit         | **Taak:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Onderliggende workflow:** directe taken<br />**Tests:** kandidaat- en baseline-agentic-pariteitspakketten, daarna het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                                                                                                                                       |
| QA live Matrix      | **Taak:** `Run QA Lab live Matrix lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                               |
| QA live Telegram    | **Taak:** `Run QA Lab live Telegram lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** live Telegram-QA met Convex CI-credentialleases.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                                     |
| Releaseverificateur | **Taak:** `Verify release checks`<br />**Onderliggende workflow:** geen<br />**Tests:** vereiste releasecontroletaken voor de geselecteerde groep voor opnieuw uitvoeren.<br />**Opnieuw uitvoeren:** opnieuw uitvoeren nadat gerichte child-taken slagen.                                                                                                                                                                                                                                                |

## Docker-releasepadchunks

De Docker-releasepadfase voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                           | Dekking                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker-releasepad-smokebanen.                                      |
| `package-update-openai`                                         | Installatie- en updategedrag van OpenAI-pakketten.                      |
| `package-update-anthropic`                                      | Installatie- en updategedrag van Anthropic-pakketten.                   |
| `package-update-core`                                           | Providerneutraal pakket- en updategedrag.                               |
| `plugins-runtime-plugins`                                       | Plugin-runtimebanen die Plugin-gedrag testen.                           |
| `plugins-runtime-services`                                      | Service-ondersteunde Plugin-runtimebanen; bevat OpenWebUI indien gevraagd. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-installatie/runtimebatches opgesplitst voor parallelle releasevalidatie. |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts één Docker-baan is mislukt. De releaseartefacten bevatten per baan opdrachten voor
opnieuw uitvoeren met pakketartefact- en imagehergebruikinvoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt vooral de live/provider-breedte binnen releasecontroles.
Het verwijdert geen normale volledige CI, Plugin-prerelease, installatiesmoke, pakketacceptatie
of QA Lab. Voor `stable` zijn uitputtende repo/live E2E- en Docker-releasepadchunks
soakdekking en draaien ze wanneer `run_release_soak=true`.
`full` dwingt soakdekking af en laat de overkoepelende run ook pakket-Telegram-E2E
uitvoeren tegen het bovenliggende releasepakketartefact wanneer `rerun_group=all`, zodat een volledige
pre-publish-kandidaat die Telegram-pakketbaan niet stilzwijgend overslaat.

| Profiel   | Beoogd gebruik                         | Inbegrepen live/provider-dekking                                                                                                                                                  |
| --------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste releasekritieke smoke.         | OpenAI/core-livepad, Docker-livemodellen voor OpenAI, native Gateway-core, native OpenAI-Gateway-profiel, native OpenAI-Plugin en Docker live Gateway OpenAI.                     |
| `stable`  | Standaardprofiel voor releasegoedkeuring. | `minimum` plus Anthropic-smoke, Google, MiniMax, backend, native live testharnas, Docker live CLI-backend, Docker ACP-bind, Docker Codex-harnas en een OpenCode Go-smoke-shard. |
| `full`    | Brede advisory-sweep.                  | `stable` plus advisory-providers, Plugin-live-shards en media-live-shards.                                                                                                        |

## Alleen-full toevoegingen

Deze suites worden overgeslagen door `stable` en inbegrepen door `full`:

| Gebied                           | Alleen-full dekking                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Docker-livemodellen              | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                                                                              |
| Docker live Gateway              | Advisory-providers opgesplitst in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- en xAI/Z.ai-shards.                           |
| Native Gateway-providerprofielen | Volledige Anthropic Opus- en Sonnet/Haiku-shards, Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin-live-shards        | Plugins A-K, L-N, O-Z other, Moonshot en xAI.                                                                                 |
| Native media-live-shards         | Audio, Google music, MiniMax music en videogroepen A-D.                                                                       |

`stable` bevat `native-live-src-gateway-profiles-anthropic-smoke` en
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` gebruikt in plaats daarvan de bredere
Anthropic- en OpenCode Go-modelshards. Gerichte heruitvoeringen kunnen nog steeds de
geaggregeerde handles `native-live-src-gateway-profiles-anthropic` of
`native-live-src-gateway-profiles-opencode-go` gebruiken.

## Gerichte heruitvoeringen

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releaseboxes opnieuw worden uitgevoerd:

| Handle              | Bereik                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `all`               | Alle fasen van Full Release Validation.                              |
| `ci`                | Alleen handmatige volledige CI-child.                                |
| `plugin-prerelease` | Alleen Plugin Prerelease-child.                                      |
| `release-checks`    | Alle fasen van OpenClaw Release Checks.                              |
| `install-smoke`     | Install Smoke via release checks.                                    |
| `cross-os`          | Cross-OS-releasechecks.                                              |
| `live-e2e`          | Repo/live E2E en Docker-releasepadvalidatie.                         |
| `package`           | Package Acceptance.                                                  |
| `qa`                | QA-pariteit plus QA-live-lanes.                                      |
| `qa-parity`         | Alleen QA-pariteitslanes en rapport.                                 |
| `qa-live`           | Alleen QA-live Matrix en Telegram.                                   |
| `npm-telegram`      | E2E voor gepubliceerd Telegram-pakket; vereist `npm_telegram_package_spec`. |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer één live suite is mislukt.
Geldige filter-id's worden gedefinieerd in de herbruikbare live/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

De handle `live-gateway-advisory-docker` is een geaggregeerde rerun-handle voor zijn
drie provider-shards, dus hij waaiert nog steeds uit naar alle advisory Docker Gateway-jobs.

Gebruik `cross_os_suite_filter` met `rerun_group=cross-os` wanneer één cross-OS-lane
is mislukt. Het filter accepteert een OS-id, een suite-id of een OS/suite-paar, bijvoorbeeld
`windows/packaged-upgrade`, `windows` of `packaged-fresh`. Cross-OS-samenvattingen
bevatten timings per fase voor packaged upgrade-lanes, en langlopende opdrachten
drukken Heartbeat-regels af zodat een vastgelopen Windows-update zichtbaar is vóór de
job-time-out.

QA-releasecheck-lanes zijn adviserend. Een QA-only-fout wordt gerapporteerd als waarschuwing
en blokkeert de releasecheck-verifier niet; voer `rerun_group=qa`,
`qa-parity` of `qa-live` opnieuw uit wanneer je nieuw QA-bewijs nodig hebt.

## Bewijs om te bewaren

Bewaar de samenvatting van `Full Release Validation` als de releasebrede index. Deze linkt
child-run-id's en bevat tabellen met de langzaamste jobs. Inspecteer bij fouten eerst de
child-workflow en voer daarna de kleinste passende handle hierboven opnieuw uit.

Nuttige artefacten:

- `release-package-under-test` uit de Full Release Validation-parent en `OpenClaw Release Checks`
- Docker-releasepadartefacten onder `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` en Docker-acceptatieartefacten
- Cross-OS-releasecheckartefacten voor elk OS en elke suite
- QA-pariteit, Matrix- en Telegram-artefacten

## Workflowbestanden

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
