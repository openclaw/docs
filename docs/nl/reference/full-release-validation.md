---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Stabiele en volledige releasevalidatieprofielen vergelijken
    - Debuggen van fouten in de releasevalidatiefase
summary: Volledige releasevalidatiefasen, onderliggende workflows, releaseprofielen, heruitvoer-handles en bewijs
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-06-27T18:17:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Volledige releasevalidatie` is de overkoepelende releaseworkflow. Dit is het enige handmatige
toegangspunt voor bewijs vóór de release, maar het meeste werk gebeurt in onderliggende workflows zodat een
mislukte box opnieuw kan worden uitgevoerd zonder de hele release opnieuw te starten.

Voer dit uit vanaf een vertrouwde workflow-ref, normaal `main`, en geef de releasebranch,
tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Onderliggende workflows gebruiken de vertrouwde workflow-ref voor de harness en de invoer
`ref` voor de kandidaat die wordt getest. Daardoor blijft nieuwe validatielogica beschikbaar
bij het valideren van een oudere releasebranch of tag.

`release_profile=stable` en `release_profile=full` voeren altijd de uitgebreide
live/Docker-duurtest uit. Geef `run_release_soak=true` door om dezelfde duurtestbanen
op te nemen met het betaprofiel. Stabiele publicatie weigert een validatiemanifest zonder deze
duurtest en blokkerend bewijs voor productprestaties.

Pakketacceptatie bouwt normaal de kandidaat-tarball vanuit de opgeloste
`ref`, inclusief runs met volledige SHA die zijn gestart met `pnpm ci:full-release`. Geef na een
betapublicatie `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` door om het
verzonden npm-pakket opnieuw te gebruiken voor releasecontroles, pakketacceptatie, cross-OS,
release-pad-Docker en pakket-Telegram. Gebruik `package_acceptance_package_spec`
alleen wanneer pakketacceptatie bewust een ander pakket moet bewijzen.
De live pakketbaan van de Codex-Plugin volgt dezelfde status: gepubliceerde
`release_package_spec`-waarden leiden `codex_plugin_spec=npm:@openclaw/codex@<version>` af;
SHA-/artifact-runs pakken `extensions/codex` vanuit de geselecteerde ref; en operators
kunnen `codex_plugin_spec` rechtstreeks instellen voor `npm:`, `npm-pack:` of `git:` Plugin-
bronnen. De baan verleent de expliciete installatiegoedkeuring voor de Codex CLI die door
die Plugin wordt vereist, en voert daarna de Codex CLI-preflight en OpenAI-agentbeurten in dezelfde sessie uit.

## Topniveaufasen

| Fase                 | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Doelresolutie        | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** lost de releasebranch, tag of volledige commit-SHA op en legt geselecteerde invoer vast.<br />**Opnieuw uitvoeren:** voer de overkoepelende workflow opnieuw uit als dit mislukt.                                                                                                                                                                                                                                             |
| Vitest en normale CI | **Taak:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-grafiek tegen de doel-ref, inclusief Linux Node-banen, gebundelde Plugin-shards, Plugin- en kanaalcontractshards, Node 22-compatibiliteit, `check-*`, `check-additional-*`, smokechecks voor gebouwde artifacts, docscontroles, Python-Skills, Windows, macOS, Control UI i18n en Android via de overkoepelende workflow.<br />**Opnieuw uitvoeren:** `rerun_group=ci`.                           |
| Plugin-prerelease    | **Taak:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** release-specifieke statische Plugin-controles, agentische Plugin-dekking, volledige extensiebatchshards, Plugin-prerelease-Dockerbanen en een niet-blokkerend `plugin-inspector-advisory`-artifact voor compatibiliteitstriage.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                                        |
| Releasecontroles     | **Taak:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** installatiesmoke, cross-OS-pakketcontroles, pakketacceptatie, QA Lab-pariteit, live Matrix en live Telegram. Stabiele en volledige profielen voeren ook uitgebreide live/E2E-suites en Docker-chunks voor het release-pad uit; beta kan zich hiervoor aanmelden met `run_release_soak=true`.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een smallere release-checks-handle. |
| Pakket-Telegram      | **Taak:** `Run package Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** een gerichte gepubliceerde-pakket-Telegram-E2E wanneer `release_package_spec` of `npm_telegram_package_spec` is ingesteld. Volledige kandidaatvalidatie gebruikt in plaats daarvan de canonieke pakketacceptatie-Telegram-E2E.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `release_package_spec` of `npm_telegram_package_spec`.                                               |
| Overkoepelende verifier | **Taak:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert de vastgelegde conclusies van onderliggende runs opnieuw en voegt tabellen met langzaamste taken uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze taak opnieuw uit nadat een mislukte onderliggende taak opnieuw groen is uitgevoerd.                                                                                                                                                                                                  |

Voor `ref=main` en `rerun_group=all` vervangt een nieuwere overkoepelende workflow een oudere.
Wanneer de bovenliggende run wordt geannuleerd, annuleert de monitor alle onderliggende workflows die al
zijn gestart. Validatieruns voor releasebranches en tags annuleren elkaar standaard niet.

## Fasen van releasecontroles

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze lost het doel
één keer op en bereidt een gedeeld `release-package-under-test`-artifact voor wanneer pakket-
of Docker-gerichte fasen dit nodig hebben.

| Fase                | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Releasedoel         | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Tests:** geselecteerde ref, optionele verwachte SHA, profiel, rerun-groep en gerichte live suite-filter.<br />**Rerun:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                               |
| Pakketartefact      | **Taak:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Tests:** pakt of resolveert één kandidaat-tarball en uploadt `release-package-under-test` voor downstream pakketgerichte controles.<br />**Rerun:** het getroffen pakket, de cross-OS-groep of de live/E2E-groep.                                                                                                                                                                                     |
| Installatiesmoke    | **Taak:** `Run install smoke`<br />**Onderliggende workflow:** `Install Smoke`<br />**Tests:** volledig installatiepad met hergebruik van de root-Dockerfile-smoke-image, QR-pakketinstallatie, root- en Gateway-Docker-smokes, installer-Docker-tests, Bun global install image-provider-smoke en snelle E2E voor installatie/verwijdering van gebundelde Plugins.<br />**Rerun:** `rerun_group=install-smoke`.                                                                                 |
| Cross-OS            | **Taak:** `cross_os_release_checks`<br />**Onderliggende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** fresh- en upgrade-lanes op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball plus een baselinepakket.<br />**Rerun:** `rerun_group=cross-os`.                                                                                                                                                                      |
| Repo en live E2E    | **Taak:** `Run repo/live E2E validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** repository-E2E, live cache, OpenAI-websocketstreaming, native live provider- en Plugin-shards, en door Docker ondersteunde live model/backend/Gateway-harnassen geselecteerd door `release_profile`.<br />**Uitvoeringen:** `run_release_soak=true`, `release_profile=full` of gericht `rerun_group=live-e2e`.<br />**Rerun:** `rerun_group=live-e2e`, optioneel met `live_suite_filter`. |
| Docker-releasepad   | **Taak:** `Run Docker release-path validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-chunks voor het releasepad tegen het gedeelde pakketartefact.<br />**Uitvoeringen:** `run_release_soak=true`, `release_profile=full` of gericht `rerun_group=live-e2e`.<br />**Rerun:** `rerun_group=live-e2e`.                                                                                                                            |
| Pakketacceptatie    | **Taak:** `Run package acceptance`<br />**Onderliggende workflow:** `Package Acceptance`<br />**Tests:** offline Plugin-pakketfixtures, Plugin-update, de canonieke mock-OpenAI Telegram-pakket-E2E en gepubliceerde-upgrade-overlevingscontroles tegen dezelfde tarball. Blokkerende releasecontroles gebruiken de standaard nieuwste gepubliceerde baseline; soak-controles breiden uit naar elke stabiele npm-release op of na `2026.4.23` plus fixtures voor gemelde issues.<br />**Rerun:** `rerun_group=package`. |
| QA-pariteit         | **Taak:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Onderliggende workflow:** directe taken<br />**Tests:** kandidaat- en baseline-agentic-pariteitspakketten, daarna het pariteitsrapport.<br />**Rerun:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                                                                                                                               |
| QA live Matrix      | **Taak:** `Run QA Lab live Matrix lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** snel live Matrix-QA-profiel in de `qa-live-shared`-omgeving.<br />**Rerun:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                                  |
| QA live Telegram    | **Taak:** `Run QA Lab live Telegram lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** live Telegram-QA met Convex CI-credentialleases.<br />**Rerun:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                                             |
| Releaseverificatie  | **Taak:** `Verify release checks`<br />**Onderliggende workflow:** geen<br />**Tests:** vereiste releasecontroletaken voor de geselecteerde rerun-groep.<br />**Rerun:** opnieuw uitvoeren nadat gerichte onderliggende taken slagen.                                                                                                                                                                                                                                                          |

## Docker-releasepadchunks

De Docker-releasepadfase voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                           | Dekking                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `core`                                                          | Core-Docker-releasepad-smoke-lanes.                                                                                            |
| `package-update-openai`                                         | OpenAI-pakketinstallatie-/updategedrag, Codex-installatie op aanvraag, live Codex-Plugin-beurten en Chat Completions-toolcalls. |
| `package-update-anthropic`                                      | Installatie- en updategedrag van Anthropic-pakketten.                                                                          |
| `package-update-core`                                           | Providerneutraal pakket- en updategedrag.                                                                                      |
| `plugins-runtime-plugins`                                       | Plugin-runtime-lanes die Plugin-gedrag testen.                                                                                 |
| `plugins-runtime-services`                                      | Service-ondersteunde en live Plugin-runtime-lanes; bevat OpenWebUI wanneer aangevraagd.                                        |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Plugin-installatie-/runtimebatches, opgesplitst voor parallelle releasevalidatie.                                               |

Gebruik gerichte `docker_lanes=<lane[,lane]>` op de herbruikbare live/E2E-workflow wanneer
slechts één Docker-lane is mislukt. De releaseartefacten bevatten rerun-
commando's per lane met pakketartefact- en image-hergebruikinvoer wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt vooral de live/provider-breedte binnen releasecontroles.
Het verwijdert geen normale volledige CI, Plugin Prerelease, installatiesmoke, pakket-
acceptatie of QA Lab. Stabiele en volledige profielen voeren altijd uitputtende repo/live
E2E- en Docker-releasepad-soakdekking uit. Het bètaprofiel kan zich hiervoor aanmelden met
`run_release_soak=true`. Package Acceptance levert de canonieke pakket-
Telegram-E2E voor elke volledige kandidaat, dus de umbrella dupliceert die
live poller niet.

| Profiel   | Beoogd gebruik                         | Inbegrepen live/provider-dekking                                                                                                                                                         |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Snelste releasekritieke smoke.         | OpenAI/core-livepad, Docker-live modellen voor OpenAI, native Gateway-core, native OpenAI-Gateway-profiel, native OpenAI-Plugin en Docker-live Gateway OpenAI.                            |
| `stable`  | Standaard releasegoedkeuringsprofiel.  | `minimum` plus Anthropic-smoke, Google, MiniMax, backend, native live testharnas, Docker-live CLI-backend, Docker ACP-bind, Docker Codex-harnas en een OpenCode Go-smoke-shard.           |
| `full`    | Brede adviserende sweep.               | `stable` plus adviserende providers, Plugin-live-shards en media-live-shards.                                                                                                             |

## Alleen-full-toevoegingen

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                           | Alleen-full-dekking                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Docker-live modellen             | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                                                                                |
| Docker-live Gateway              | Adviserende providers opgesplitst in DeepSeek/Fireworks-, OpenCode Go/OpenRouter- en xAI/Z.ai-shards.                           |
| Native Gateway-providerprofielen | Volledige Anthropic Opus- en Sonnet/Haiku-shards, Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native Plugin-live-shards        | Plugins A-K, L-N, O-Z overig, Moonshot en xAI.                                                                                  |
| Native media-live-shards         | Audio, Google music, MiniMax music en videogroepen A-D.                                                                         |

`stable` bevat `native-live-src-gateway-profiles-anthropic-smoke` en
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` gebruikt in plaats daarvan de bredere
Anthropic- en OpenCode Go-modelshards. Gerichte reruns kunnen nog steeds de
geaggregeerde handles `native-live-src-gateway-profiles-anthropic` of
`native-live-src-gateway-profiles-opencode-go` gebruiken.

## Gerichte reruns

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releasevakken opnieuw worden uitgevoerd:

| Handle              | Bereik                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Alle fasen van Full Release Validation.                                                         |
| `ci`                | Alleen handmatige volledige CI-child.                                                           |
| `plugin-prerelease` | Alleen Plugin Prerelease-child.                                                                 |
| `release-checks`    | Alle fasen van OpenClaw Release Checks.                                                         |
| `install-smoke`     | Install Smoke via releasecontroles.                                                             |
| `cross-os`          | Cross-OS-releasecontroles.                                                                      |
| `live-e2e`          | Repo/live E2E- en Docker-validatie van het releasepad.                                          |
| `package`           | Package Acceptance.                                                                             |
| `qa`                | QA-pariteit plus QA-live-lanes.                                                                 |
| `qa-parity`         | Alleen QA-pariteitslanes en rapport.                                                            |
| `qa-live`           | QA-live Matrix/Telegram plus gated Discord-, WhatsApp- en Slack-lanes wanneer ingeschakeld.     |
| `npm-telegram`      | Gepubliceerd-pakket Telegram E2E; vereist `release_package_spec` of `npm_telegram_package_spec`. |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer één live-suite is mislukt.
Geldige filter-id’s zijn gedefinieerd in de herbruikbare live/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

De handle `live-gateway-advisory-docker` is een geaggregeerde rerun-handle voor de
drie providershards, waardoor deze nog steeds uitwaaiert naar alle advisory Docker gateway-jobs.

Gebruik `cross_os_suite_filter` met `rerun_group=cross-os` wanneer één cross-OS-lane
is mislukt. Het filter accepteert een OS-id, een suite-id of een OS/suite-paar, bijvoorbeeld
`windows/packaged-upgrade`, `windows` of `packaged-fresh`. Cross-OS-samenvattingen
bevatten timings per fase voor packaged-upgrade-lanes, en langlopende opdrachten
printen Heartbeat-regels zodat een vastgelopen Windows-update zichtbaar is voordat de
jobtimeout wordt bereikt.

Mislukkingen in QA-releasecontroles blokkeren normale releasevalidatie. Vereiste OpenClaw
dynamic tool drift in de standaardlaag blokkeert ook de release-check-verifier.
Tideclaw alpha-runs kunnen non-package-safety release-check-lanes nog steeds als
advisory behandelen. Wanneer `live_suite_filter` expliciet een gated QA-live-lane aanvraagt,
zoals Discord, WhatsApp of Slack, moet de bijbehorende
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`-repo-variabele zijn ingeschakeld; anders
mislukt het vastleggen van invoer in plaats van de lane stilzwijgend over te slaan. Voer `rerun_group=qa`,
`qa-parity` of `qa-live` opnieuw uit wanneer je nieuw QA-bewijs nodig hebt.

## Te bewaren bewijs

Bewaar de samenvatting `Full Release Validation` als index op releaseniveau. Deze linkt naar
child-run-id’s en bevat tabellen met traagste jobs. Inspecteer bij fouten eerst de child-workflow
en voer daarna de kleinste overeenkomende handle hierboven opnieuw uit.

Nuttige artifacts:

- `release-package-under-test` van `OpenClaw Release Checks`
- Docker-releasepad-artifacts onder `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` en Docker-acceptance-artifacts
- Cross-OS-releasecheck-artifacts voor elk OS en elke suite
- QA-pariteits-, Matrix- en Telegram-artifacts

## Workflowbestanden

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
