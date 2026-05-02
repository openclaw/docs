---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Fouten in releasevalidatiefasen opsporen
summary: Fasen, onderliggende workflows, releaseprofielen, heruitvoer-handles en bewijs voor volledige releasevalidatie
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-05-02T11:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de releaseparaplu. Het is het enige handmatige
toegangspunt voor pre-release-bewijs, maar het meeste werk gebeurt in onderliggende workflows, zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer dit uit vanaf een vertrouwde workflow-ref, normaal gesproken `main`, en geef de releasebranch,
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
`ref` voor de kandidaat die wordt getest. Zo blijft nieuwe validatielogica beschikbaar
bij het valideren van een oudere releasebranch of tag.

## Fases op hoofdniveau

| Fase                 | Details                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doelresolutie        | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** lost de releasebranch, tag of volledige commit-SHA op en registreert geselecteerde invoer.<br />**Opnieuw uitvoeren:** voer de paraplu opnieuw uit als dit mislukt.                                                                                                                                     |
| Vitest en normale CI | **Taak:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-graaf tegen de doel-ref, inclusief Linux Node-lanes, gebundelde Plugin-shards, kanaalcontracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs-controles, Python Skills, Windows, macOS, Control UI i18n en Android via de paraplu.<br />**Opnieuw uitvoeren:** `rerun_group=ci`. |
| Plugin-prerelease    | **Taak:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** release-only statische Plugin-controles, agentische Plugin-dekking, volledige batch-shards voor extensies en Plugin-prerelease-Docker-lanes.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                               |
| Releasecontroles     | **Taak:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** installatiesmoke, cross-OS-pakketcontroles, live/E2E-suites, Docker-releasepad-chunks, Package Acceptance, QA Lab-pariteit, live Matrix en live Telegram.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een nauwere release-checks-handle.          |
| Pakket Telegram      | **Taak:** `Run package Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** artifact-onderbouwd Telegram-pakketbewijs voor `rerun_group=all` met `release_profile=full`, of gepubliceerd-pakket-Telegram-bewijs wanneer `npm_telegram_package_spec` is ingesteld.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `npm_telegram_package_spec`. |
| Parapluverificateur  | **Taak:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert geregistreerde conclusies van onderliggende runs opnieuw en voegt tabellen met traagste taken uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze taak opnieuw uit nadat een mislukte onderliggende workflow opnieuw groen is uitgevoerd.                     |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere paraplu een oudere.
Wanneer de bovenliggende workflow wordt geannuleerd, annuleert de monitor elke onderliggende workflow die al
is verzonden. Validatieruns voor releasebranches en tags annuleren elkaar standaard niet.

## Fases van releasecontroles

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze lost het doel
eenmaal op en bereidt een gedeeld `release-package-under-test`-artifact voor wanneer pakket-
of Docker-gerichte fases dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Releasedoel         | **Taak:** `Resolve target ref`<br />**Ondersteunende workflow:** geen<br />**Test:** geselecteerde ref, optionele verwachte SHA, profiel, groep voor opnieuw uitvoeren en gerichte live-suitefilter.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                     |
| Pakketartifact      | **Taak:** `Prepare release package artifact`<br />**Ondersteunende workflow:** geen<br />**Test:** verpakt of resolveert één kandidaat-tarball en uploadt `release-package-under-test` voor downstream pakketgerichte controles.<br />**Opnieuw uitvoeren:** de getroffen pakket-, cross-OS- of live/E2E-groep.                                                                                   |
| Installatiesmoke    | **Taak:** `Run install smoke`<br />**Ondersteunende workflow:** `Install Smoke`<br />**Test:** volledig installatiepad met hergebruik van root-Dockerfile-smoke-image, QR-pakketinstallatie, root- en Gateway-Docker-smokes, installer-Docker-tests, Bun global install-image-provider-smoke en snelle gebundelde-Plugin-installatie/verwijdering-E2E.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`. |
| Cross-OS            | **Taak:** `cross_os_release_checks`<br />**Ondersteunende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Test:** verse en upgrade-lanes op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baselinepakket.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                              |
| Repo en live E2E    | **Taak:** `Run repo/live E2E validation`<br />**Ondersteunende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** repository-E2E, live-cache, OpenAI websocket-streaming, native live provider- en Plugin-shards, en Docker-onderbouwde live model/backend/Gateway-harnassen geselecteerd door `release_profile`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Taak:** `Run Docker release-path validation`<br />**Ondersteunende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Test:** Docker-chunks voor het releasepad tegen het gedeelde pakketartifact.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                               |
| Package Acceptance  | **Taak:** `Run package acceptance`<br />**Ondersteunende workflow:** `Package Acceptance`<br />**Test:** offline Plugin-pakketfixtures, Plugin-update en mock-OpenAI Telegram-pakketacceptatie tegen dezelfde tarball.<br />**Opnieuw uitvoeren:** `rerun_group=package`.                                                                                                                        |
| QA-pariteit         | **Taak:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Ondersteunende workflow:** directe taken<br />**Test:** kandidaat- en baseline-agentische pariteitspakketten, daarna het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                     |
| QA live Matrix      | **Taak:** `Run QA Lab live Matrix lane`<br />**Ondersteunende workflow:** directe taak<br />**Test:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                    |
| QA live Telegram    | **Taak:** `Run QA Lab live Telegram lane`<br />**Ondersteunende workflow:** directe taak<br />**Test:** live Telegram-QA met Convex CI-credentialleases.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                              |
| Releaseverificateur | **Taak:** `Verify release checks`<br />**Ondersteunende workflow:** geen<br />**Test:** vereiste releasecheck-taken voor de geselecteerde groep voor opnieuw uitvoeren.<br />**Opnieuw uitvoeren:** opnieuw uitvoeren nadat gerichte onderliggende taken slagen.                                                                                                                               |

## Docker-releasepad-chunks

De Docker-releasepadfase voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                           | Dekking                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core-Docker-releasepad-smoke-lanes.                                     |
| `package-update-openai`                                         | OpenAI-pakketinstallatie en updategedrag.                               |
| `package-update-anthropic`                                      | Anthropic-pakketinstallatie en updategedrag.                            |
| `package-update-core`                                           | Providerneutraal pakket- en updategedrag.                               |
| `plugins-runtime-plugins`                                       | Plugin-runtime-lanes die Plugin-gedrag uitoefenen.                      |
| `plugins-runtime-services`                                      | Service-onderbouwde Plugin-runtime-lanes; omvat OpenWebUI wanneer aangevraagd. |
| `plugins-runtime-install-a` tot en met `plugins-runtime-install-h` | Plugin-installatie/runtime-batches gesplitst voor parallelle releasevalidatie. |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts één Docker-lane is mislukt. De releaseartifacts bevatten per-lane opdrachten voor opnieuw uitvoeren
met pakketartifact- en imagehergebruik-invoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt vooral de live/provider-breedte binnen releasecontroles.
Het verwijdert geen normale volledige CI, Plugin Prerelease, installatiesmoke, pakketacceptatie,
QA Lab of Docker-releasepad-chunks. `full` zorgt er ook voor dat de
paraplu package Telegram E2E uitvoert tegen het releasepakketartifact wanneer
`rerun_group=all`, zodat een volledige pre-publish-kandidaat die
Telegram-pakketlane niet stilzwijgend overslaat.

| Profiel   | Beoogd gebruik                         | Inbegrepen live/provider-dekking                                                                                                                                                              |
| --------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste release-kritische smoke.       | OpenAI/core-live-pad, Docker-live-modellen voor OpenAI, native Gateway-core, native OpenAI Gateway-profiel, native OpenAI Plugin en Docker live Gateway OpenAI.                                |
| `stable`  | Standaardprofiel voor releasegoedkeuring. | `minimum` plus Anthropic, Google, MiniMax, backend, native live-testharnas, Docker live CLI-backend, Docker ACP-bind, Docker Codex-harnas en een OpenCode Go-smoke-shard.                    |
| `full`    | Brede advisory-sweep.                  | `stable` plus advisory-providers, Plugin-live-shards en media-live-shards.                                                                                                                     |

## Alleen-full-toevoegingen

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                           | Alleen-full-dekking                                                           |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Docker live-modellen             | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                              |
| Docker live Gateway              | Advisory-shard voor DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI en Z.ai. |
| Native Gateway-providerprofielen | Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin-live-shards        | Plugins A-K, L-N, O-Z overige, Moonshot en xAI.                               |
| Native media-live-shards         | Audio, Google-muziek, MiniMax-muziek en videogroepen A-D.                     |

`stable` bevat `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
gebruikt in plaats daarvan de bredere OpenCode Go-modelshards.

## Gerichte herhalingen

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde release-boxes opnieuw worden uitgevoerd:

| Handle              | Bereik                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `all`               | Alle Full Release Validation-fasen.                                  |
| `ci`                | Alleen handmatige volledige CI-child.                                |
| `plugin-prerelease` | Alleen Plugin Prerelease-child.                                      |
| `release-checks`    | Alle OpenClaw Release Checks-fasen.                                  |
| `install-smoke`     | Install Smoke tot en met releasecontroles.                           |
| `cross-os`          | Cross-OS-releasecontroles.                                           |
| `live-e2e`          | Repo/live E2E en Docker-validatie van het releasepad.                |
| `package`           | Package Acceptance.                                                  |
| `qa`                | QA-pariteit plus QA-live-lanes.                                      |
| `qa-parity`         | Alleen QA-pariteitslanes en rapport.                                 |
| `qa-live`           | Alleen QA-live Matrix en Telegram.                                   |
| `npm-telegram`      | Gepubliceerd pakket Telegram E2E; vereist `npm_telegram_package_spec`. |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer één live suite is mislukt.
Geldige filter-id's worden gedefinieerd in de herbruikbare live/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

## Te bewaren bewijs

Bewaar de `Full Release Validation`-samenvatting als index op releaseniveau. Deze koppelt
child-run-id's en bevat tabellen met de langzaamste jobs. Inspecteer bij fouten eerst de child-
workflow en voer daarna de kleinste passende handle hierboven opnieuw uit.

Nuttige artefacten:

- `release-package-under-test` uit `OpenClaw Release Checks`
- Docker-releasepadartefacten onder `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` en Docker-acceptanceartefacten
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
