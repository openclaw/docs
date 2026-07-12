---
read_when:
    - Volledige releasevalidatie uitvoeren of opnieuw uitvoeren
    - Vergelijking van validatieprofielen voor stabiele en volledige releases
    - Fouten in fasen van releasevalidatie opsporen
summary: Stadia voor volledige releasevalidatie, onderliggende workflows, releaseprofielen, handvatten voor opnieuw uitvoeren en bewijsmateriaal
title: Volledige releasevalidatie
x-i18n:
    generated_at: "2026-07-12T09:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` is de overkoepelende releasevalidatie: het centrale handmatige startpunt
voor bewijs voorafgaand aan een release. Het meeste werk vindt plaats in onderliggende workflows, zodat een mislukte
omgeving opnieuw kan worden uitgevoerd zonder de volledige release opnieuw te starten.

Voer dit uit vanaf een vertrouwde workflowreferentie, doorgaans `main`, en geef de releasebranch,
tag of volledige commit-SHA door als `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` accepteert ook `anthropic` of `minimax` voor onboarding op meerdere besturingssystemen en de
end-to-end agentbeurt. Herbruikbare onderliggende taken bepalen de aangeroepen workflowharness
aan de hand van `job.workflow_repository` en `job.workflow_sha`, terwijl de invoer `ref`
de te testen kandidaat selecteert. Zo blijft de huidige vertrouwde validatielogica
beschikbaar bij het valideren van een oudere releasebranch of tag.

Elke gestarte onderliggende workflow moet dezelfde workflow-SHA rapporteren als de bovenliggende
uitvoering van `Full Release Validation`. Als `main` verandert tussen het starten van de bovenliggende en onderliggende
workflows, wordt de overkoepelende validatie gesloten afgebroken, zelfs wanneer de onderliggende workflow zelf slaagt. Gebruik voor
onveranderlijk bewijs van een exacte commit
`pnpm ci:full-release --sha <target-sha>`. De helper maakt een tijdelijke
`release-ci/*`-referentie die is vastgezet op de huidige vertrouwde `origin/main`, geeft de doel-
SHA uitsluitend door als kandidaat-`ref`, hergebruikt strikt bewijs voor exact hetzelfde doel wanneer
dit beschikbaar is en verwijdert de referentie na validatie. Geef
`-f reuse_evidence=false` door om een nieuwe uitvoering af te dwingen, of
`--workflow-sha <trusted-main-sha>` om een oudere workflowcommit te selecteren die nog
bereikbaar is vanaf de huidige `origin/main`. De workflow maakt of wijzigt zelf nooit
repositoryreferenties.

`release_profile=stable` en `release_profile=full` voeren altijd de volledige
live-/Docker-duurtest uit. Geef `run_release_soak=true` door om dezelfde duurtesttrajecten
ook met het `beta`-profiel uit te voeren. Stabiele publicatie weigert een validatiemanifest
zonder deze duurtest en blokkerend bewijs van productprestaties.

Package Acceptance bouwt normaal gesproken het kandidaat-tarball op basis van de bepaalde
`ref`, waaronder uitvoeringen met een volledige SHA die via `pnpm ci:full-release` zijn gestart. Geef na een
bètapublicatie `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` door om
het gepubliceerde npm-pakket opnieuw te gebruiken voor releasecontroles, Package Acceptance, meerdere besturingssystemen,
het Docker-releasetraject en Telegram voor het pakket. Gebruik `package_acceptance_package_spec`
alleen wanneer Package Acceptance bewust een ander pakket moet verifiëren.
Het livepakkettraject voor de Codex-Plugin volgt dezelfde status: gepubliceerde
`release_package_spec`-waarden leiden `codex_plugin_spec=npm:@openclaw/codex@<version>` af;
SHA-/artifactuitvoeringen verpakken `extensions/codex` vanaf de geselecteerde referentie; en beheerders
kunnen `codex_plugin_spec` rechtstreeks instellen voor Plugin-bronnen van het type `npm:`, `npm-pack:` of `git:`.
Het traject verleent de expliciete goedkeuring voor de installatie van Codex CLI die voor
die Plugin vereist is en voert vervolgens de voorafgaande Codex CLI-controle en OpenAI-agentbeurten binnen dezelfde sessie uit.

## Fasen op hoofdniveau

Voor `rerun_group=all` wordt eerst een taak `Check for reusable validation evidence` uitgevoerd:
deze zoekt naar de nieuwste eerdere geslaagde volledige validatie voor exact dezelfde
doel-SHA, hetzelfde releaseprofiel, dezelfde effectieve duurtestinstelling en dezelfde validatie-invoer.
Wanneer dergelijk bewijs bestaat, wordt elk traject overgeslagen en controleert de overkoepelende verificateur
het onveranderlijke bovenliggende artifact, de onderliggende uitvoeringen en de startlogboeken opnieuw. Dit dient
uitsluitend voor herstel door opnieuw uitvoeren met dezelfde kandidaat; hergebruik tussen verschillende SHA's wordt hiermee niet toegestaan. Voer voor
een gewijzigde kandidaat elke pakket-, artifact-, installatie-, Docker- of provider-
controle opnieuw uit waarop die wijziging invloed heeft. Geef `reuse_evidence=false` door om een volledig nieuwe
uitvoering af te dwingen. Bewijshergebruik wordt alleen uitgevoerd vanaf `main` of een canonieke, op een SHA vastgezette
`release-ci/*`-referentie waarvan de workflowcommit deel blijft uitmaken van de vertrouwde afstamming van `main`;
andere workflowreferenties voeren de geselecteerde trajecten opnieuw uit.

Eveneens voor `rerun_group=all` bouwt een taak `Verify Docker runtime image assets`
het Docker-doel `runtime-assets` met
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Deze wordt parallel met de
andere fasen uitgevoerd en door de overkoepelende verificateur afgedwongen; trajecten wachten niet langer
op deze taak voordat ze worden gestart. Bij een beperktere `rerun_group` wordt deze voorafgaande controle overgeslagen.

| Fase                    | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doel bepalen            | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Bewijst:** bepaalt de releasebranch, tag of volledige commit-SHA en registreert de geselecteerde invoer.<br />**Opnieuw uitvoeren:** voer de overkoepelende validatie opnieuw uit als dit mislukt.                                                                                                                                                                                                                                               |
| Voorafgaande controle van Docker-assets | **Taak:** `Verify Docker runtime image assets`<br />**Onderliggende workflow:** geen<br />**Bewijst:** het Docker-bouwdoel `runtime-assets` slaagt nog steeds voordat enige andere fase wordt gestart. Wordt alleen uitgevoerd voor `rerun_group=all`.<br />**Opnieuw uitvoeren:** voer de overkoepelende validatie opnieuw uit met `rerun_group=all`.                                                                                                                                                                          |
| Vitest en normale CI    | **Taak:** `Run normal full CI`<br />**Onderliggende workflow:** `CI`<br />**Bewijst:** handmatige volledige CI-graaf voor de doelreferentie, waaronder Linux Node-trajecten, shards voor gebundelde Plugins, shards voor Plugin- en kanaalcontracten, compatibiliteit met Node 22, `check-*`, `check-additional-*`, rookcontroles van gebouwde artifacts, documentatiecontroles, Python-Skills, Windows, macOS, i18n voor Control UI en Android via de overkoepelende validatie.<br />**Opnieuw uitvoeren:** `rerun_group=ci`. |
| Voorrelease van Plugins | **Taak:** `Run plugin prerelease validation`<br />**Onderliggende workflow:** `Plugin Prerelease`<br />**Bewijst:** uitsluitend voor releases bedoelde statische Plugin-controles, agentgestuurde Plugin-dekking, volledige Plugin-batchshards, Docker-trajecten voor Plugin-voorreleases en een niet-blokkerend `plugin-inspector-advisory`-artifact voor compatibiliteitstriage.<br />**Opnieuw uitvoeren:** `rerun_group=plugin-prerelease`.                                                                                                              |
| Releasecontroles        | **Taak:** `Run release/live/Docker/QA validation`<br />**Onderliggende workflow:** `OpenClaw Release Checks`<br />**Bewijst:** installatierookcontrole, pakketcontroles op meerdere besturingssystemen, Package Acceptance, gelijkwaardigheid met QA Lab, live Matrix en live Telegram. De profielen stable en full voeren ook volledige live-/E2E-suites en onderdelen van het Docker-releasetraject uit; beta kan deze inschakelen met `run_release_soak=true`.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks` of een beperktere release-checks-handle. |
| Telegram voor pakket    | **Taak:** `Run package Telegram E2E`<br />**Onderliggende workflow:** `NPM Telegram Beta E2E`<br />**Bewijst:** een gerichte Telegram-E2E voor een gepubliceerd pakket wanneer `release_package_spec` of `npm_telegram_package_spec` is ingesteld. Volledige kandidaatvalidatie gebruikt in plaats daarvan de canonieke Telegram-E2E van Package Acceptance.<br />**Opnieuw uitvoeren:** `rerun_group=npm-telegram` met `release_package_spec` of `npm_telegram_package_spec`.                                                                                         |
| Productprestaties       | **Taak:** `Run product performance evidence`<br />**Onderliggende workflow:** `OpenClaw Performance`<br />**Bewijst:** prestatie-uitvoering voor het releaseprofiel (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) voor de doel-SHA. Kova-uitvoer blijft in workflowartifacts en de onderliggende workflow moet bewijzen dat de rapportpublicatietaak is overgeslagen. Alleen vereist (blokkerend) voor `rerun_group=all` of `rerun_group=performance`; niet vereist voor beperktere groepen voor opnieuw uitvoeren.<br />**Opnieuw uitvoeren:** `rerun_group=performance`. |
| Overkoepelende verificateur | **Taak:** `Verify full validation`<br />**Onderliggende workflow:** geen<br />**Bewijst:** controleert de geregistreerde resultaten van onderliggende uitvoeringen opnieuw en voegt tabellen met de langzaamste taken uit onderliggende workflows toe.<br />**Opnieuw uitvoeren:** voer alleen deze taak opnieuw uit nadat een mislukte onderliggende workflow opnieuw is uitgevoerd en is geslaagd.                                                                                                                                                                       |

De overkoepelende validatie start productprestaties altijd in een modus die uitsluitend artifacts produceert.
`OpenClaw Performance` staat rapportpublicatie alleen toe voor geplande uitvoeringen of een
handmatig gestarte uitvoering waarbij expliciet `publish_reports=true` is ingesteld. De beveiliging voor uitsluitend
artifacts moet met succes worden voltooid, waarmee wordt bewezen dat de publicatietaak overgeslagen bleef.
Nieuw en hergebruikt bewijs registreert
`controls.performanceReportPublication=artifact-only`; de verificateur en selector voor hergebruik
weigeren bewijs zonder het bijbehorende genormaliseerde bewijs van de onderliggende prestatieworkflow.

De verificateur uploadt het canonieke manifest als
`full-release-validation-<run-id>-<run-attempt>`. Bewijshulpmiddelen valideren
de artifact-ID, digest, producerende uitvoering en poging voordat precies die
artifact-ID wordt gedownload. De grootte van het gedownloade ZIP-bestand wordt begrensd, de bytes worden vergeleken met de REST-
digest `sha256:` en het enige toegestane, begrensde manifestitem wordt gestreamd zonder
het archief uit te pakken. Een alias met een stabiele naam blijft tijdelijk bestaan voor oudere
publicatieconsumenten. De verificateur geeft altijd de voorkeur aan het artifact met een poging in de naam;
als overgang accepteert deze de stabiele naam alleen voor een producer van manifest v2 bij poging 1.
De legacynaam wordt voor latere pogingen en manifest v3 geweigerd.

Voor `ref=main` met `rerun_group=all`, voor `release/*`-referenties en voor Tideclaw-
alfareferenties vervangt een nieuwere overkoepelende uitvoering een oudere met dezelfde referentie en
groep voor opnieuw uitvoeren. Wanneer de bovenliggende uitvoering wordt geannuleerd, annuleert de monitor alle reeds gestarte onderliggende
workflows. Validatie-uitvoeringen voor tags en vastgezette SHA's annuleren elkaar niet.

## Fasen van releasecontroles

`OpenClaw Release Checks` is de grootste onderliggende workflow. Deze bepaalt het doel
eenmaal en bereidt een gedeeld `release-package-under-test`-artifact voor wanneer pakket-
of Docker-gerichte fasen dit nodig hebben.

| Fase                     | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Releasedoel              | **Taak:** `Resolve target ref`<br />**Onderliggende workflow:** geen<br />**Tests:** geselecteerde ref, optionele verwachte SHA, profiel, heruitvoeringsgroep en gericht filter voor de live-testsuite.<br />**Opnieuw uitvoeren:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                       |
| Pakketartefact           | **Taak:** `Prepare release package artifact`<br />**Onderliggende workflow:** geen<br />**Tests:** verpakt of bepaalt één kandidaat-tarball en uploadt `release-package-under-test` voor volgende pakketgerichte controles.<br />**Opnieuw uitvoeren:** de betrokken pakket-, cross-OS- of live/E2E-groep.                                                                                                                                                                                                                                                                             |
| Installatierooktest      | **Taak:** `Run install smoke`<br />**Onderliggende workflow:** `Install Smoke`<br />**Tests:** volledig installatiepad met hergebruik van de rooktestimage uit het Dockerfile in de hoofdmap, installatie van het QR-pakket, Docker-rooktests voor de hoofdmap en Gateway, Docker-tests voor het installatieprogramma en een rooktest voor de imageprovider met globale Bun-installatie.<br />**Opnieuw uitvoeren:** `rerun_group=install-smoke`.                                                                                                                                    |
| Cross-OS                 | **Taak:** `cross_os_release_checks`<br />**Onderliggende workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** trajecten voor nieuwe installaties en upgrades op Linux, Windows en macOS voor de geselecteerde provider en modus, met de kandidaat-tarball en een basispakket.<br />**Opnieuw uitvoeren:** `rerun_group=cross-os`.                                                                                                                                                                                                                                  |
| Repository- en live-E2E  | **Taak:** `Run repo/live E2E validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** repository-E2E, live-cache, OpenAI-websocketstreaming, systeemeigen live-provider- en Plugin-shards en door Docker ondersteunde testopstellingen voor live-modellen, backends en de Gateway, geselecteerd via `release_profile`.<br />**Wordt uitgevoerd bij:** `run_release_soak=true`, `release_profile=full` of de gerichte `rerun_group=live-e2e`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`, eventueel met `live_suite_filter`. |
| Docker-releasepad        | **Taak:** `Run Docker release-path validation`<br />**Onderliggende workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** Docker-chunks voor het releasepad tegen het gedeelde pakketartefact.<br />**Wordt uitgevoerd bij:** `run_release_soak=true`, `release_profile=full` of de gerichte `rerun_group=live-e2e`.<br />**Opnieuw uitvoeren:** `rerun_group=live-e2e`.                                                                                                                                                                                                     |
| Pakketacceptatie         | **Taak:** `Run package acceptance`<br />**Onderliggende workflow:** `Package Acceptance`<br />**Tests:** offline pakketfixtures voor Plugins, Plugin-updates, de canonieke pakket-E2E met nagebootste OpenAI en Telegram, en controles of gepubliceerde upgrades met dezelfde tarball blijven werken. Blokkerende releasecontroles gebruiken standaard de laatst gepubliceerde basisversie; langdurige controles (`run_release_soak=true`) breiden dit uit naar de laatste 4 stabiele npm-releases plus 3 vastgezette historische versies (`2026.4.23`, `2026.5.2`, `2026.4.15`), uitgevoerd tegen upgradefixtures voor gemelde problemen.<br />**Opnieuw uitvoeren:** `rerun_group=package`. |
| Volwassenheidsscorekaart | **Taak:** `Render maturity scorecard release docs`<br />**Onderliggende workflow:** `maturity-scorecard.yml`<br />**Tests:** genereert de adviserende documentatie voor de volwassenheidsscorekaart tegen de doel-ref. Wordt alleen uitgevoerd wanneer `run_maturity_scorecard=true` wordt doorgegeven.<br />**Opnieuw uitvoeren:** `rerun_group=qa` met `run_maturity_scorecard=true`.                                                                                                                                                                                             |
| QA-pariteit              | **Taak:** `Run QA Lab parity lane` en `Run QA Lab parity report`<br />**Onderliggende workflow:** directe taken<br />**Tests:** agentische pariteitspakketten voor de kandidaat- en basisversie, gevolgd door het pariteitsrapport.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                                                                                                                                                                                               |
| QA-runtimepariteit       | **Taak:** `Run QA Lab runtime parity lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** een agentisch pariteitstraject voor het runtimepaar `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), met een standaardniveau en, bij `run_release_soak=true`, een langdurig niveau. Adviserend: afzonderlijke fouten blokkeren de verificateur voor releasecontroles niet.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                 |
| QA-dekking runtimetools  | **Taak:** `Enforce QA Lab runtime tool coverage`<br />**Onderliggende workflow:** directe taak<br />**Tests:** dynamische afwijkingen in tools tussen `openclaw` en `codex` op het standaardniveau voor runtimepariteit (`pnpm openclaw qa coverage --tools`), met de uitvoer van het QA-runtimepariteitstraject. Blokkerend: deze taak kan niet als adviserend worden genegeerd.<br />**Opnieuw uitvoeren:** `rerun_group=qa-parity` of `rerun_group=qa`.                                                                                                                                 |
| QA live Matrix           | **Taak:** `Run QA Lab live Matrix lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** snel live Matrix-QA-profiel in de omgeving `qa-live-shared`.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                                  |
| QA live Telegram         | **Taak:** `Run QA Lab live Telegram lane`<br />**Onderliggende workflow:** directe taak<br />**Tests:** live Telegram-QA met tijdelijke toewijzingen van Convex-CI-referenties.<br />**Opnieuw uitvoeren:** `rerun_group=qa-live` of `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                    |
| Releaseverificateur      | **Taak:** `Verify release checks`<br />**Onderliggende workflow:** geen<br />**Tests:** vereiste taken voor releasecontroles voor de geselecteerde heruitvoeringsgroep.<br />**Opnieuw uitvoeren:** opnieuw uitvoeren nadat de gerichte onderliggende taken zijn geslaagd.                                                                                                                                                                                                                                                                                                             |

## Docker-chunks voor het releasepad

De Docker-fase voor het releasepad voert deze chunks uit wanneer `live_suite_filter`
leeg is:

| Chunk                                                           | Dekking                                                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core`                                                          | Docker-rooktesttrajecten voor het releasepad van de kern.                                                                                                    |
| `package-update-openai`                                         | Installatie- en updategedrag van het OpenAI-pakket, installatie van Codex op aanvraag, live-interacties met de Codex-Plugin en toolaanroepen via Chat Completions. |
| `package-update-anthropic`                                      | Installatie- en updategedrag van het Anthropic-pakket.                                                                                                       |
| `package-update-core`                                           | Providerneutraal pakket- en updategedrag.                                                                                                                    |
| `plugins-runtime-plugins`                                       | Plugin-runtimetrajecten die Plugin-gedrag testen.                                                                                                            |
| `plugins-runtime-services`                                      | Door services ondersteunde en live Plugin-runtimetrajecten.                                                                                                  |
| `plugins-runtime-install-a` tot en met `plugins-runtime-install-h` | Batches voor Plugin-installatie en -runtime, opgesplitst voor parallelle releasevalidatie.                                                                 |
| `openwebui`                                                     | Afzonderlijke OpenWebUI-compatibiliteitsrooktest op een speciale runner met een grote schijf wanneer daarom wordt gevraagd.                                  |

Gebruik gerichte `docker_lanes=<lane[,lane]>` in de herbruikbare live/E2E-workflow wanneer
slechts één Docker-traject is mislukt. De releaseartefacten bevatten per traject opdrachten
voor opnieuw uitvoeren, met invoer voor hergebruik van pakketartefacten en images wanneer beschikbaar.

## Releaseprofielen

`release_profile` bepaalt voornamelijk de breedte van live-/providercontroles binnen releasecontroles.
Het verwijdert geen normale volledige CI, Plugin-voorrelease, installatierooktest, pakketacceptatie
of QA Lab. Stabiele en volledige profielen voeren altijd uitgebreide E2E-dekking voor de repo/liveomgeving
en duurtests voor het Docker-releasepad uit. Het bètaprofiel kan dit inschakelen met
`run_release_soak=true`. Pakketacceptatie levert de canonieke Telegram-E2E voor pakketten
voor elke volledige kandidaat, zodat de overkoepelende workflow die live-poller niet dupliceert.

| Profiel  | Beoogd gebruik                         | Inbegrepen live-/providerdekking                                                                                                                                                                                            |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Snelste releasekritieke rooktest.       | Livepad voor OpenAI/core, live Docker-modellen voor OpenAI, native Gateway-core, native OpenAI Gateway-profiel, native OpenAI-Plugin en live Docker-Gateway voor OpenAI.                                                      |
| `stable` | Standaardprofiel voor releasegoedkeuring. | `beta` plus Anthropic-rooktest, Google, MiniMax, backend, native live-testharnas, Docker live-CLI-backend, Docker ACP-binding, Docker Codex-harnas, Docker-subagentmelding en een OpenCode Go-rooktestshard.                  |
| `full`   | Brede adviserende controle.             | `stable` plus adviserende providers, live-Pluginshards en live-mediashards.                                                                                                                                                  |

## Toevoegingen uitsluitend voor volledig

Deze suites worden overgeslagen door `stable` en opgenomen door `full`:

| Gebied                            | Dekking uitsluitend voor volledig                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Live Docker-modellen              | OpenCode Go, OpenRouter, xAI, Z.ai en Fireworks.                                                                               |
| Live Docker-Gateway               | Adviserende providers opgesplitst in shards voor DeepSeek/Fireworks, OpenCode Go/OpenRouter en xAI/Z.ai.                     |
| Native Gateway-providerprofielen  | Volledige Anthropic Opus- en Sonnet/Haiku-shards, Fireworks, DeepSeek, volledige OpenCode Go-modelshards, OpenRouter, xAI en Z.ai. |
| Native live-Pluginshards          | Plugins A-K, L-N, overige O-Z, Moonshot en xAI.                                                                                |
| Native live-mediashards           | Audio, Google-muziek, MiniMax-muziek en videogroepen A-D.                                                                      |

`stable` bevat `native-live-src-gateway-profiles-anthropic-smoke` en
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` gebruikt in plaats daarvan de bredere
modelshards voor Anthropic en OpenCode Go. Gerichte heruitvoeringen kunnen nog steeds de
geaggregeerde ingangen `native-live-src-gateway-profiles-anthropic` of
`native-live-src-gateway-profiles-opencode-go` gebruiken.

## Gerichte heruitvoeringen

Gebruik `rerun_group` om te voorkomen dat niet-gerelateerde releaseomgevingen opnieuw worden uitgevoerd:

| Ingang              | Bereik                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `all`               | Alle fasen van de volledige releasevalidatie.                                                           |
| `ci`                | Alleen de handmatige volledige CI-subworkflow.                                                          |
| `plugin-prerelease` | Alleen de Plugin-voorrelease-subworkflow.                                                               |
| `release-checks`    | Alle fasen van OpenClaw-releasecontroles.                                                               |
| `install-smoke`     | Installatierooktest tot en met releasecontroles.                                                        |
| `cross-os`          | Releasecontroles voor meerdere besturingssystemen.                                                      |
| `live-e2e`          | E2E voor repo/liveomgeving en validatie van het Docker-releasepad.                                      |
| `package`           | Pakketacceptatie.                                                                                       |
| `qa`                | QA-pariteit plus live QA-testbanen.                                                                     |
| `qa-parity`         | Alleen QA-pariteitstestbanen en -rapport.                                                               |
| `qa-live`           | Live QA-testbanen voor Matrix/Telegram plus afgeschermde banen voor Discord, WhatsApp en Slack indien ingeschakeld. |
| `npm-telegram`      | Telegram-E2E voor gepubliceerd pakket; vereist `release_package_spec` of `npm_telegram_package_spec`.   |
| `performance`       | Alleen bewijs van productprestaties.                                                                    |

Gebruik `live_suite_filter` met `rerun_group=live-e2e` wanneer één live-suite is mislukt.
Geldige filter-id's zijn gedefinieerd in de herbruikbare live-/E2E-workflow, waaronder
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` en
`live-codex-harness-docker`.

De ingang `live-gateway-advisory-docker` is een geaggregeerde heruitvoeringsingang voor de
drie providershards en wordt dus nog steeds verdeeld over alle adviserende Docker-Gateway-taken.

Gebruik `cross_os_suite_filter` met `rerun_group=cross-os` wanneer één testbaan voor meerdere
besturingssystemen is mislukt. Het filter accepteert een besturingssysteem-id, een suite-id of
een combinatie van besturingssysteem en suite, bijvoorbeeld `windows/packaged-upgrade`,
`windows` of `packaged-fresh`. Samenvattingen voor meerdere besturingssystemen bevatten
tijdmetingen per fase voor testbanen voor pakketupgrades, en langlopende opdrachten drukken
Heartbeat-regels af, zodat een vastgelopen update zichtbaar is voordat de taak een time-out bereikt.

Mislukte QA-releasecontroles blokkeren de normale releasevalidatie. De controle van de
runtime-tooldekking van QA (dynamische toolafwijking tussen `openclaw` en `codex` in het
standaardniveau) blokkeert ook de verificatie van releasecontroles, hoewel de onderliggende
testbaan voor runtimepariteit van QA adviserend is. Tideclaw-alfauitvoeringen kunnen
releasecontroletestbanen die niet over pakketveiligheid gaan nog steeds als adviserend behandelen. Met
`release_profile=beta` zijn de live-providersuites van `Run repo/live E2E validation`
adviserend: implementaties van modellen van derden veranderen onafhankelijk van een release,
waardoor bèta hun fouten als waarschuwingen toont, terwijl stabiele en volledige profielen
ze blokkerend houden. Wanneer
`live_suite_filter` expliciet om een afgeschermde live QA-testbaan zoals Discord,
WhatsApp of Slack vraagt, moet de bijbehorende repo-variabele
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` zijn ingeschakeld; anders mislukt het vastleggen
van de invoer in plaats van de testbaan stilzwijgend over te slaan.
Voer `rerun_group=qa`, `qa-parity` of `qa-live` opnieuw uit wanneer u
actueel QA-bewijs nodig hebt.

## Te bewaren bewijs

Bewaar de samenvatting `Full Release Validation` als index op releaseniveau. Deze bevat
koppelingen naar de uitvoerings-id's van subworkflows en tabellen met de langzaamste taken.
Inspecteer bij fouten eerst de subworkflow en voer daarna de kleinste overeenkomende ingang
hierboven opnieuw uit.

Nuttige artefacten:

- `release-package-under-test` uit `OpenClaw Release Checks`
- Artefacten van het Docker-releasepad onder `.artifacts/docker-tests/`
- `package-under-test` van pakketacceptatie en Docker-acceptatieartefacten
- Artefacten van releasecontroles voor meerdere besturingssystemen voor elk besturingssysteem en elke suite
- Artefacten voor QA-pariteit, runtimepariteit, Matrix en Telegram

## Workflowbestanden

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
