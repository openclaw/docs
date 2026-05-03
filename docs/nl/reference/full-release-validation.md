---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Fouten in de releasevalidatiefase debuggen
summary: Fasen van volledige releasevalidatie, onderliggende workflows, releaseprofielen, handles voor opnieuw uitvoeren en bewijs
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-05-03T21:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de release-overkoepeling. Het is het enige handmatige
startpunt voor pre-release-bewijs, maar het meeste werk gebeurt in child-workflows zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer deze uit vanaf een vertrouwde workflow-ref, normaal `main`, en geef de release-branch,
tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Child-workflows gebruiken de vertrouwde workflow-ref voor de harness en de invoer
`ref` voor de kandidaat die wordt getest. Zo blijft nieuwe validatielogica beschikbaar
bij het valideren van een oudere release-branch of tag.

Pakketacceptatie bouwt normaal gesproken de kandidaat-tarball uit de opgeloste
`ref`, inclusief volledige-SHA-runs die met `pnpm ci:full-release` zijn gestart. Geef na
publicatie `package_acceptance_package_spec=openclaw@YYYY.M.D` (of
`openclaw@beta`/`openclaw@latest`) door om dezelfde pakket-/updatematrix in plaats daarvan
tegen het verzonden npm-pakket uit te voeren.

## Topniveaufasen

| Fase                 | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doelresolutie        | **Job:** `Resolve target ref`<br />**Child-workflow:** geen<br />**Bewijst:** lost de release-branch, tag of volledige commit-SHA op en legt geselecteerde invoer vast.<br />**Opnieuw uitvoeren:** voer de overkoepeling opnieuw uit als dit mislukt.                                                                                                                                       |
| Vitest en normale CI | **Job:** `Run normal full CI`<br />**Child-workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-grafiek tegen de doel-ref, inclusief Linux Node-lanes, gebundelde Plugin-shards, channel-contracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python-skills, Windows, macOS, Control UI i18n en Android via de overkoepeling.<br />**Opnieuw uitvoeren:** `rerun_group=ci`. |
| Plugin-prerelease    | **Job:** `Run plugin prerelease validation`<br />**Child-workflow:** `Plugin Prerelease`<br />**Bewijst:** alleen-release statische Plugin-controles, agentic Plugin-dekking, volledige extensie-batch-shards en Plugin-prerelease-Docker-lanes.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                                  |
| Releasecontroles     | **Job:** `Run release/live/Docker/QA validation`<br />**Child-workflow:** `OpenClaw Release Checks`<br />**Bewijst:** install-smoke, cross-OS-pakketcontroles, live/E2E-suites, Docker-releasepad-chunks, pakketacceptatie, QA Lab-pariteit, live Matrix en live Telegram.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een smallere release-checks-handle.                  |
| Pakketartefact       | **Job:** `Prepare release package artifact`<br />**Child-workflow:** geen<br />**Bewijst:** maakt de bovenliggende `release-package-under-test`-tarball vroeg genoeg aan voor pakketgerichte controles die niet op `OpenClaw Release Checks` hoeven te wachten.<br />**Opnieuw uitvoeren:** voer de overkoepeling opnieuw uit of geef `npm_telegram_package_spec` op voor `rerun_group=npm-telegram`. |
| Pakket-Telegram      | **Job:** `Run package Telegram E2E`<br />**Child-workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** door bovenliggend artefact ondersteund Telegram-pakketbewijs voor `rerun_group=all` met `release_profile=full`, of gepubliceerd-pakket-Telegram-bewijs wanneer `npm_telegram_package_spec` is ingesteld.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `npm_telegram_package_spec`. |
| Overkoepelende verifier | **Job:** `Verify full validation`<br />**Child-workflow:** geen<br />**Bewijst:** controleert vastgelegde conclusies van child-runs opnieuw en voegt tabellen met traagste jobs uit child-workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze job opnieuw uit nadat een mislukte child groen opnieuw is uitgevoerd.                                                                    |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere overkoepeling een oudere.
Wanneer de parent wordt geannuleerd, annuleert de monitor alle child-workflows die deze al
heeft gestart. Validatieruns voor release-branches en tags annuleren elkaar standaard niet.

## Releasecontrolefasen

`OpenClaw Release Checks` is de grootste child-workflow. Deze lost het doel één keer op
en bereidt een gedeeld `release-package-under-test`-artefact voor wanneer pakket-
of Docker-gerichte fasen dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Releasedoel         | **Job:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Test:** geselecteerde ref, optionele verwachte SHA, profiel, rerun-groep en gerichte live-suitefilter.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                                    |
| Pakketartefact      | **Job:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Test:** pakt of lost één kandidaat-tarball op en uploadt `release-package-under-test` voor downstream pakketgerichte controles.<br />**Opnieuw uitvoeren:** de betrokken pakket-, cross-OS- of live/E2E-groep.                                                                                         |
| Install-smoke       | **Job:** `Run install smoke`<br />**Onderliggende workflow:** `Install Smoke`<br />**Test:** volledig installatiepad met hergebruik van root-Dockerfile-smoke-image, QR-pakketinstallatie, root- en Gateway-Docker-smokes, installer-Docker-tests, Bun globale-installatie-image-provider-smoke en snelle gebundelde-Plugin-install/uninstall-E2E.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`. |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Onderliggende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** fresh- en upgrade-lanes op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baseline-pakket.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                          |
| Repo en live E2E    | **Job:** `Run repo/live E2E validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** repository-E2E, live cache, OpenAI-websocketstreaming, native live provider- en Plugin-shards, en door Docker ondersteunde live model/backend/Gateway-harnassen geselecteerd door `release_profile`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Job:** `Run Docker release-path validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** Docker-releasepad-chunks tegen het gedeelde pakketartefact.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                                       |
| Pakketacceptatie    | **Job:** `Run package acceptance`<br />**Onderliggende workflow:** `Package Acceptance`<br />**Test:** offline Plugin-pakketfixtures, Plugin-update, mock-OpenAI Telegram-pakketacceptatie en gepubliceerde-upgrade-survivor-controles van elke stabiele npm-release op of na `2026.4.23` tegen dezelfde tarball.<br />**Opnieuw uitvoeren:** `rerun_group=package`.                         |
| QA-pariteit         | **Job:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Onderliggende workflow:** directe jobs<br />**Test:** kandidaat- en baseline-agentic-pariteitspakketten, daarna het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                          |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Onderliggende workflow:** directe job<br />**Test:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                       |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Onderliggende workflow:** directe job<br />**Test:** live Telegram-QA met Convex CI-credentialleases.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                  |
| Releaseverifier     | **Job:** `Verify release checks`<br />**Onderliggende workflow:** geen<br />**Test:** vereiste release-check-jobs voor de geselecteerde rerun-groep.<br />**Opnieuw uitvoeren:** voer opnieuw uit nadat gerichte child-jobs zijn geslaagd.                                                                                                                                                    |

## Docker-releasepad-chunks

De Docker-releasepadfase voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                           | Dekking                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker-releasepad-smoke-lanes.                                     |
| `package-update-openai`                                         | Installatie- en updategedrag van OpenAI-pakketten.                      |
| `package-update-anthropic`                                      | Installatie- en updategedrag van Anthropic-pakketten.                   |
| `package-update-core`                                           | Providerneutraal pakket- en updategedrag.                               |
| `plugins-runtime-plugins`                                       | Plugin-runtime-lanes die Plugin-gedrag oefenen.                         |
| `plugins-runtime-services`                                      | Service-ondersteunde Plugin-runtime-lanes; bevat OpenWebUI wanneer gevraagd. |
| `plugins-runtime-install-a` tot en met `plugins-runtime-install-h` | Plugin-installatie-/runtimebatches opgesplitst voor parallelle releasevalidatie. |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts een Docker-lane is mislukt. De release-artifacten bevatten rerun-opdrachten
per lane met pakketartifact- en image-hergebruikinvoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt vooral de live-/aanbiederbreedte binnen releasecontroles.
Het verwijdert normale volledige CI, Plugin Prerelease, installatiesmoke, pakketacceptatie,
QA Lab of Docker-releasepadonderdelen niet. `full` zorgt er ook voor dat de
paraplu-run pakket-Telegram-E2E uitvoert tegen het bovenliggende releasepakketartifact wanneer
`rerun_group=all`, zodat een volledige kandidaat vóór publicatie die
Telegram-pakketlane niet stilzwijgend overslaat.

| Profiel   | Beoogd gebruik                     | Inbegrepen live-/aanbiederdekking                                                                                                                                                     |
| --------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste release-kritieke smoke.    | OpenAI/core live-pad, Docker-live-modellen voor OpenAI, native Gateway-kern, native OpenAI Gateway-profiel, native OpenAI Plugin en Docker-live-Gateway OpenAI.                       |
| `stable`  | Standaardprofiel voor releasegoedkeuring. | `minimum` plus Anthropic-smoke, Google, MiniMax, backend, native live-testharnas, Docker-live-CLI-backend, Docker ACP-bind, Docker Codex-harnas en een OpenCode Go smoke-shard. |
| `full`    | Brede advies-sweep.                | `stable` plus adviesaanbieders, Plugin live-shards en media live-shards.                                                                                                               |

## Aanvullingen alleen voor full

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                           | Dekking alleen voor full                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker-live-modellen             | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                                                                            |
| Docker-live-Gateway              | Adviesaanbieders opgesplitst in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- en xAI/Z.ai-shards.                            |
| Native Gateway-aanbiederprofielen | Volledige Anthropic Opus- en Sonnet/Haiku-shards, Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin live-shards        | Plugins A-K, L-N, O-Z overig, Moonshot en xAI.                                                                              |
| Native media live-shards         | Audio, Google-muziek, MiniMax-muziek en videogroepen A-D.                                                                   |

`stable` bevat `native-live-src-gateway-profiles-anthropic-smoke` en
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` gebruikt in plaats daarvan de bredere
Anthropic- en OpenCode Go-modelshards. Gerichte reruns kunnen nog steeds de
geaggregeerde handles `native-live-src-gateway-profiles-anthropic` of
`native-live-src-gateway-profiles-opencode-go` gebruiken.

## Gerichte reruns

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releaseboxen opnieuw worden uitgevoerd:

| Handle              | Bereik                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Alle Full Release Validation-fasen.                                   |
| `ci`                | Alleen handmatige volledige CI-child.                                 |
| `plugin-prerelease` | Alleen Plugin Prerelease-child.                                       |
| `release-checks`    | Alle OpenClaw Release Checks-fasen.                                   |
| `install-smoke`     | Install Smoke via releasecontroles.                                   |
| `cross-os`          | Cross-OS-releasecontroles.                                            |
| `live-e2e`          | Repo/live E2E en Docker-releasepadvalidatie.                          |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA-pariteit plus QA-live-lanes.                                       |
| `qa-parity`         | Alleen QA-pariteitlanes en rapport.                                   |
| `qa-live`           | Alleen QA-live Matrix en Telegram.                                    |
| `npm-telegram`      | E2E voor gepubliceerd pakket met Telegram; vereist `npm_telegram_package_spec`. |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer een live-suite is mislukt.
Geldige filter-id's zijn gedefinieerd in de herbruikbare live/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

De handle `live-gateway-advisory-docker` is een geaggregeerde rerun-handle voor de
drie aanbiedershards, dus deze waaiert nog steeds uit naar alle advies-Docker-Gateway-jobs.

## Te bewaren bewijs

Bewaar de samenvatting `Full Release Validation` als index op releaseniveau. Deze linkt
child-run-id's en bevat tabellen met traagste jobs. Inspecteer bij fouten eerst de
child-workflow en voer daarna de kleinste passende handle hierboven opnieuw uit.

Nuttige artifacten:

- `release-package-under-test` uit de Full Release Validation-parent en `OpenClaw Release Checks`
- Docker-releasepadartifacten onder `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` en Docker-acceptatieartifacten
- Cross-OS-releasecontroleartifacten voor elk OS en elke suite
- QA-pariteit-, Matrix- en Telegram-artifacten

## Workflowbestanden

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
