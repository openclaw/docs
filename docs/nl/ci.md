---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt mislukte GitHub Actions-controles
summary: CI-taakgrafiek, scope-gates en lokale commando-equivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-04-29T22:29:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64ba894cef8b847b3e7a298cfeb2c2977f7c589c64998a8fb5feb17a9e359160
    source_path: ci.md
    workflow: 16
---

De CI draait bij elke push naar `main` en elke pull request. Hij gebruikt slimme scopebepaling om dure jobs over te slaan wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen slimme scopebepaling bewust en waaieren de volledige normale CI-grafiek uit voor releasekandidaten of brede validatie, waarbij Android-lanes opt-in zijn via `include_android` voor zelfstandige handmatige runs. Release-only plugin-prereleaselanes staan in de aparte `Plugin Prerelease`-workflow en draaien alleen vanuit `Full Release Validation` of een expliciete handmatige dispatch.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies`, een productie-Knip-pass alleen voor afhankelijkheden, vastgezet op de nieuwste Knip-versie die door dat script wordt gebruikt, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie. Hij draait ook `pnpm deadcode:unused-files`, dat Knip's bevindingen voor ongebruikte productiebestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. Die guard faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of na opschoning een verouderde allowlist-entry laat staan, terwijl opzettelijke dynamische plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles draaien
vóór release." Hij accepteert een branch, tag of volledige commit-SHA, dispatcht de
handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor
release-only plugin-/package-/statische/Docker-bewijsvoering, en dispatcht
`OpenClaw Release Checks` voor installatiesmoke, packageacceptatie, Docker
release-path-suites, live/E2E, OpenWebUI, QA Lab-pariteit, Matrix- en Telegram-
lanes. Hij kan ook de post-publish `NPM Telegram Beta E2E`-workflow draaien wanneer een
gepubliceerde packagespec is opgegeven. `release_profile=minimum|stable|full` bepaalt de live/provider-
breedte die aan releasechecks wordt doorgegeven: `minimum` behoudt de snelste OpenAI/core
releasekritieke lanes, `stable` voegt de stabiele provider/backend-set toe, en
`full` draait de brede adviserende provider/media-matrix. De overkoepelende workflow registreert de
gedispatchte child-run-id's, en de uiteindelijke `Verify full validation`-job controleert opnieuw
de huidige conclusies van child-runs en voegt tabellen met langzaamste jobs toe voor elke child-
run. Als een child-workflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de parent-
verifier-job opnieuw om het overkoepelende resultaat en de timing-samenvatting te vernieuwen.

Voor herstel accepteren `Full Release Validation` en `OpenClaw Release Checks` beide
`rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen de
normale volledige CI-child, `release-checks` voor elke release-child, of een smallere
releasegroep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live`, of `npm-telegram` op de overkoepelende workflow. Dit houdt een mislukte
releasebox-herhaling begrensd na een gerichte fix.

De release live/E2E-child behoudt brede native `pnpm test:live`-dekking, maar hij
draait die als benoemde shards (`native-live-src-agents`,
`native-live-src-gateway-core`, provider-gefilterde
`native-live-src-gateway-profiles`-jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, opgesplitste media-audio-/video-shards, en
provider-gefilterde muziek-shards) via `scripts/test-live-shard.mjs` in plaats
van één seriële job. Dat behoudt dezelfde bestandsdekking terwijl langzame live-
providerfouten makkelijker opnieuw te draaien en te diagnosticeren zijn. De geaggregeerde
`native-live-extensions-o-z`, `native-live-extensions-media`, en
`native-live-extensions-media-music`-shardnamen blijven geldig voor handmatige
eenmalige herhalingen.

De native live-media-shards draaien in
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de
`Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en
`ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde
live-suites op normale Blacksmith-runners, omdat containerjobs de verkeerde
plek zijn om geneste Docker-tests te starten.

Docker-ondersteunde live model-/backend-shards gebruiken een aparte gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live
releaseworkflow bouwt en pusht die image één keer, waarna de Docker live model-,
Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards draaien met
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Als die shards het volledige source-Docker-
target onafhankelijk opnieuw bouwen, is de release-run verkeerd geconfigureerd en verspilt hij kloktijd aan dubbele imagebuilds.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde
ref één keer op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact
daarna door aan zowel de live/E2E release-path Docker-workflow als de packageacceptatie-
shard. Dat houdt de packagebytes consistent over releaseboxen heen en voorkomt
dat dezelfde kandidaat in meerdere child-jobs opnieuw wordt ingepakt.

`Package Acceptance` is de side-run-workflow voor het valideren van een package-artifact
zonder de releaseworkflow te blokkeren. Hij lost één kandidaat op uit een
gepubliceerde npm-spec, een vertrouwde `package_ref` gebouwd met de geselecteerde
`workflow_ref`-harness, een HTTPS-tarball-URL met SHA-256, of een tarball-artifact
uit een andere GitHub Actions-run, uploadt die als `package-under-test`, en hergebruikt
vervolgens de Docker release/E2E-scheduler met die tarball in plaats van de
workflow-checkout opnieuw in te pakken. Profielen dekken smoke, package, product, full en custom
Docker-laneselecties. Het `package`-profiel gebruikt offline plugindekking zodat
validatie van gepubliceerde packages niet afhankelijk is van live ClawHub-beschikbaarheid. De
optionele Telegram-lane hergebruikt het
`package-under-test`-artifact in de `NPM Telegram Beta E2E`-workflow, waarbij het
gepubliceerde npm-specpad behouden blijft voor zelfstandige dispatches.

## Packageacceptatie

Gebruik `Package Acceptance` wanneer de vraag is "werkt dit installeerbare OpenClaw-
package als product?" Dit verschilt van normale CI: normale CI valideert
de source-tree, terwijl packageacceptatie één tarball valideert via dezelfde
Docker E2E-harness die gebruikers na installatie of update gebruiken.

De workflow heeft vier jobs:

1. `resolve_package` checkt `workflow_ref` uit, lost één packagekandidaat op,
   schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft
   `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het
   `package-under-test`-artifact, en print de bron, workflow-ref, package-
   ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept
   `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en
   `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt
   dat artifact, valideert de tarball-inventaris, bereidt package-digest
   Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat
   package in plaats van de workflow-checkout in te pakken. Wanneer een profiel
   meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package
   en gedeelde images één keer voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-
   jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Hij draait wanneer
   `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-
   artifact wanneer Package Acceptance er één heeft opgelost; zelfstandige Telegram-dispatch
   kan nog steeds een gepubliceerde npm-spec installeren.
4. `summary` laat de workflow falen als packageoplossing, Dockeracceptatie, of
   de optionele Telegram-lane is mislukt.

Kandidaatbronnen:

- `source=npm`: accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte
  OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor
  gepubliceerde beta-/stable-acceptatie.
- `source=ref`: pakt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA in.
  De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit
  bereikbaar is vanuit de repository-branchgeschiedenis of een releasetag, installeert dependencies in een
  detached worktree, en pakt die in met `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: downloadt een HTTPS `.tgz`; `package_sha256` is vereist.
- `source=artifact`: downloadt één `.tgz` uit `artifact_run_id` en
  `artifact_name`; `package_sha256` is optioneel maar moet worden opgegeven voor
  extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde
workflow-/harnesscode die de test draait. `package_ref` is de source-commit
die wordt ingepakt wanneer `source=ref`. Hierdoor kan de huidige testharness
oudere vertrouwde source-commits valideren zonder oude workflowlogica te draaien.

Profielen mappen naar Docker-dekking:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` plus `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: volledige Docker release-path-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`; vereist wanneer `suite_profile=custom`

Releasechecks roepen Package Acceptance aan met `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'`, en
`telegram_mode=mock-openai`. De release-path Docker-
chunks dekken de overlappende package-/update-/pluginlanes, terwijl Package
Acceptance de artifact-native compatibiliteit voor gebundelde channels, offline plugin- en
Telegram-bewijsvoering behoudt tegen dezelfde opgeloste package-tarball.
Cross-OS-releasechecks dekken nog steeds OS-specifieke onboarding-, installer- en
platformgedrag; package-/updateproductvalidatie moet beginnen met Package
Acceptance. De Windows packaged- en installer-fresh-lanes verifiëren ook dat een
geïnstalleerd package een browser-control-override kan importeren vanuit een rauw absoluut
Windows-pad. De OpenAI cross-OS agent-turn-smoke gebruikt standaard
`OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4-mini`, zodat
het installatie- en Gateway-bewijs snel en deterministisch blijft. Specifieke live
provider-/model-lanes dekken nog steeds bredere modelroutering, inclusief langzamere
frontier-standaarden.

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al
gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`,
mogen het compatibiliteitspad gebruiken voor bekende private QA-entries in
`dist/postinstall-inventory.json` die wijzen naar uit tarballs weggelaten bestanden,
`doctor-switch` mag de `gateway install --wrapper`-persistentiesubcase overslaan
wanneer het package die vlag niet exposeert, `update-channel-switch` mag
ontbrekende `pnpm.patchedDependencies` uit de van de tarball afgeleide nep-git-fixture snoeien en
mag ontbrekende vastgelegde `update.channel` loggen, pluginsmokes mogen legacy
install-record-locaties lezen of ontbrekende marketplace install-record-
persistentie accepteren, en `plugin-update` mag configuratiemetadata-migratie toestaan terwijl nog steeds
wordt vereist dat het install-record en het gedrag zonder herinstallatie ongewijzigd blijven. Het
gepubliceerde `2026.4.26`-package mag ook waarschuwen voor lokale buildmetadata-stempelbestanden
die al waren uitgebracht. Latere packages moeten aan de moderne contracten voldoen; dezelfde
voorwaarden falen dan in plaats van te waarschuwen of over te slaan.

Voorbeelden:

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Begin bij het debuggen van een mislukte package-acceptance-run met de samenvatting `resolve_package` om de packagebron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de Docker-artefacten ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logs, fasetimings en heruitvoercommando's. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte packageprofiel of de exacte Docker-lanes in plaats van de volledige releasevalidatie opnieuw uit te voeren.

QA Lab heeft specifieke CI-lanes buiten de hoofdworkflow met slimme scope. De workflow `Parity gate` draait bij overeenkomende PR-wijzigingen en handmatige dispatch; deze bouwt de private QA-runtime en vergelijkt de agentic packs voor mock GPT-5.5 en Opus 4.6. De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock-paritygate, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. De live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases. Releasechecks draaien Matrix- en Telegram-livetransportlanes met de deterministische mockprovider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract is geïsoleerd van live modellatentie en normale provider-Plugin-opstart. De live transport-Gateway schakelt ook geheugenzoekopdrachten uit, omdat QA-pariteit geheugengedrag apart afdekt; providerconnectiviteit wordt afgedekt door de aparte suites voor live model, native provider en Docker-provider. Matrix gebruikt `--profile fast` voor geplande en releasegates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaard en handmatige workflowinvoer blijven `all`; handmatige dispatch met `matrix_profile=all` shardt altijd volledige Matrix-dekking naar de jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`. `OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-paritygate voert de kandidaat- en baselinepacks uit als parallelle lane-jobs en downloadt daarna beide artefacten naar een kleine rapportjob voor de laatste pariteitsvergelijking. Plaats het PR-landingspad niet achter `Parity gate`, tenzij de wijziging daadwerkelijk de QA-runtime, modelpackpariteit of een oppervlak raakt waarvan de parityworkflow eigenaar is. Behandel dit bij normale kanaal-, configuratie-, documentatie- of unit-testfixes als een optioneel signaal en volg in plaats daarvan het bewijs uit de gescopete CI/checks.

De workflow `Duplicate PRs After Merge` is een handmatige maintainerworkflow voor het opschonen van duplicaten na landing. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gewijzigd, verifieert de workflow dat de gelande PR is gemerged en dat elk duplicaat een gedeelde gerefereerde issue of overlappende gewijzigde hunks heeft.

De workflow `CodeQL` is bewust een smalle beveiligingsscanner voor de eerste doorgang, niet de volledige repositorysweep. Dagelijkse en handmatige runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico voor authenticatie, secrets, sandbox, Cron en Gateway met high-precision beveiligingsqueries onder de categorie `/codeql-critical-security/core-auth-secrets`. De job channel-runtime-boundary scant apart core-kanaalimplementatiecontracten plus de kanaal-Plugin-runtime, Gateway, Plugin SDK, secrets en auditraakpunten onder de categorie `/codeql-critical-security/channel-runtime-boundary`, zodat kanaalbeveiligingssignaal kan schalen zonder de baselinecategorie auth/secrets te verbreden. De job network-ssrf-boundary scant core-SSRF, IP-parsing, netwerkguard, web-fetch en Plugin SDK-SSRF-beleidoppervlakken onder de categorie `/codeql-critical-security/network-ssrf-boundary`, zodat signaal over de netwerkvertrouwensgrens gescheiden blijft van de beveiligingsbaseline auth/secrets. De job mcp-process-tool-boundary scant MCP-servers, procesuitvoerhelpers, uitgaande levering en agent-tooluitvoergates onder de categorie `/codeql-critical-security/mcp-process-tool-boundary`, zodat commando- en toolgrenssignaal gescheiden blijft van zowel de auth/secrets-baseline als de niet-beveiligingsgerichte MCP/proces-kwaliteitshard. De job plugin-trust-boundary scant Plugin-installatie, loader, manifest, registry, runtime-dependency staging, bronladen, public-surface en vertrouwensoppervlakken van het Plugin SDK-packagecontract onder de categorie `/codeql-critical-security/plugin-trust-boundary`, zodat signaal over Plugin-supply-chain en runtime-loading gescheiden blijft van zowel meegeleverde Plugin-implementatiecode als de niet-beveiligingsgerichte Plugin-kwaliteitshard.

De workflow `CodeQL Android Critical Security` is de geplande Android-beveiligingsshard. Deze bouwt de Android-app handmatig voor CodeQL op het kleinste Blacksmith Linux-runnerlabel dat door workflow sanity wordt geaccepteerd en uploadt resultaten onder de categorie `/codeql-critical-security/android`.

De workflow `CodeQL macOS Critical Security` is de wekelijkse/handmatige macOS-beveiligingsshard. Deze bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van afhankelijkheden uit de geüploade SARIF en uploadt resultaten onder de categorie `/codeql-critical-security/macos`. Houd deze buiten de dagelijkse standaardworkflow, omdat de macOS-build de runtime domineert, zelfs wanneer alles schoon is.

De workflow `CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze draait alleen JavaScript/TypeScript-kwaliteitsqueries met error-severity en zonder beveiligingsfocus over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De handmatige dispatch accepteert `profile=all|plugin-sdk-package-contract`; het smalle profiel is de eerste leer-/iteratiehook om één kwaliteitshard geïsoleerd te draaien zonder de rest van de workflow te dispatchen. De job core-auth-secrets scant code voor authenticatie-, secrets-, sandbox-, Cron- en Gateway-beveiligingsgrenzen onder de aparte categorie `/codeql-critical-quality/core-auth-secrets`. De job config-boundary scant configuratieschema-, migratie-, normalisatie- en IO-contracten onder de aparte categorie `/codeql-critical-quality/config-boundary`. De job gateway-runtime-boundary scant Gateway-protocolschema's en servermethodecontracten onder de aparte categorie `/codeql-critical-quality/gateway-runtime-boundary`. De job channel-runtime-boundary scant core-kanaalimplementatiecontracten onder de aparte categorie `/codeql-critical-quality/channel-runtime-boundary`. De job agent-runtime-boundary scant commandouitvoering, model-/providerdispatch, auto-reply-dispatch en -queues, en ACP-control-plane-runtimecontracten onder de aparte categorie `/codeql-critical-quality/agent-runtime-boundary`. De job mcp-process-runtime-boundary scant MCP-servers en toolbridges, processupervisiehelpers en uitgaande leveringscontracten onder de aparte categorie `/codeql-critical-quality/mcp-process-runtime-boundary`. De job memory-runtime-boundary scant de memory host SDK, memory runtime facades, memory Plugin SDK-aliassen, memory-runtime-activatielijm en memory doctor-commando's onder de aparte categorie `/codeql-critical-quality/memory-runtime-boundary`. De job ui-control-plane scant Control UI-bootstrap, lokale persistentie, Gateway-controlflows en runtimecontracten voor de task-control-plane onder de aparte categorie `/codeql-critical-quality/ui-control-plane`. De job web-media-runtime-boundary scant core web fetch/search, media-IO, mediabegrip, image-generation en media-generation-runtimecontracten onder de aparte categorie `/codeql-critical-quality/web-media-runtime-boundary`. De job plugin-boundary scant loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten onder een aparte categorie `/codeql-critical-quality/plugin-boundary`. De job plugin-sdk-package-contract scant de gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-packagecontracten onder de aparte categorie `/codeql-critical-quality/plugin-sdk-package-contract`. Houd de workflow gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder beveiligingssignaal te vertroebelen. Swift-, Python- en meegeleverde-Plugin-CodeQL-uitbreiding mag pas weer worden toegevoegd als gescopete of gesharde vervolgwerkzaamheden nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

De workflow `Docs Agent` is een event-driven Codex-maintenance-lane om bestaande documentatie afgestemd te houden op recent gelande wijzigingen. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan de workflow activeren, en handmatige dispatch kan deze direct draaien. Workflow-run-aanroepen worden overgeslagen wanneer `main` inmiddels is opgeschoven of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is gemaakt. Wanneer de workflow draait, beoordeelt deze de commitrange vanaf de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan afdekken die sinds de vorige documentatiepass zijn verzameld.

De workflow `Test Performance Agent` is een event-driven Codex-maintenance-lane voor trage tests. Deze heeft geen zuiver schema: een succesvolle niet-bot push-CI-run op `main` kan de workflow activeren, maar deze wordt overgeslagen als een andere workflow-run-aanroep die UTC-dag al heeft gedraaid of nog draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een performance-rapport voor een gegroepeerde volledige Vitest-suite, laat Codex alleen kleine testperformancefixes maken die dekking behouden in plaats van brede refactors, draait daarna het volledige suite-rapport opnieuw en wijst wijzigingen af die het aantal passerende baselinetests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke fouten fixen en moet het volledige after-agent-suite-rapport slagen voordat er iets wordt gecommit. Wanneer `main` opschuift voordat de botpush landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De workflow gebruikt GitHub-hosted Ubuntu, zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Joboverzicht

| Taak                             | Doel                                                                                         | Wanneer deze wordt uitgevoerd      |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detecteert wijzigingen die alleen docs raken, gewijzigde scopes, gewijzigde extensies, en bouwt het CI-manifest | Altijd bij niet-conceptpushes en PR's |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                    | Altijd bij niet-conceptpushes en PR's |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies tegen npm-adviezen                              | Altijd bij niet-conceptpushes en PR's |
| `security-fast`                  | Vereiste aggregatie voor de snelle security-taken                                             | Altijd bij niet-conceptpushes en PR's |
| `build-artifacts`                | Bouwt `dist/`, Control UI, controles voor gebouwde artifacts, en herbruikbare downstream-artifacts | Node-relevante wijzigingen         |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals controles voor bundled/plugin-contract/protocol          | Node-relevante wijzigingen         |
| `checks-fast-contracts-channels` | Gesplinterde kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat          | Node-relevante wijzigingen         |
| `checks-node-core-test`          | Core Node-testshards, met uitzondering van kanaal-, bundled-, contract- en extensielanes      | Node-relevante wijzigingen         |
| `check`                          | Gesplinterde equivalent van de lokale hoofdgate: productietypen, lint, guards, testtypen en strikte smoke | Node-relevante wijzigingen         |
| `check-additional`               | Architectuur-, boundary-, extensie-oppervlakteguards, package-boundary- en gateway-watch-shards | Node-relevante wijzigingen         |
| `build-smoke`                    | Smoke tests voor gebouwde CLI en smoke voor opstartgeheugen                                   | Node-relevante wijzigingen         |
| `checks`                         | Verificatie voor kanaaltests met gebouwde artifacts                                           | Node-relevante wijzigingen         |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                   | Handmatige CI-dispatch voor releases |
| `check-docs`                     | Docs-formattering, lint en controles op kapotte links                                        | Docs gewijzigd                     |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                 | Python-skill-relevante wijzigingen |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus regressies voor gedeelde runtime-importspecificaties | Windows-relevante wijzigingen      |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artifacts                                  | macOS-relevante wijzigingen        |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                  | macOS-relevante wijzigingen        |
| `android`                        | Android-unittests voor beide smaken plus een debug-APK-build                                  | Android-relevante wijzigingen      |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                       | Succesvolle hoofd-CI of handmatige dispatch |

Handmatige CI-dispatches voeren dezelfde taakgrafiek uit als normale CI, maar zetten elke
niet-Android scoped lane geforceerd aan: Linux Node-shards, bundled-plugin-shards, kanaal
contracten, Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, docs
controles, Python-skills, Windows, macOS en Control UI-i18n. Zelfstandige handmatige CI
dispatches voeren alleen Android uit met `include_android=true`; de volledige release
umbrella schakelt Android in door `include_android=true` door te geven. Statische controles
voor Plugin-prereleases, de alleen-voor-releases `agentic-plugins`-shard, de volledige extensie
batch sweep en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker
prerelease-suite wordt alleen uitgevoerd wanneer `Full Release Validation` de
afzonderlijke `Plugin Prerelease`-workflow dispatcht met de release-validatiegate ingeschakeld.
Handmatige runs gebruiken een
unieke concurrency group zodat een volledige suite voor een release candidate niet wordt geannuleerd door
een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een
vertrouwde caller die grafiek uitvoeren tegen een branch, tag of volledige commit-SHA terwijl
het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Fail-fast-volgorde

Taken zijn zo geordend dat goedkope controles falen voordat dure controles worden uitgevoerd:

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica voor `docs-scope` en `changed-scope` bestaat uit stappen binnen deze taak, geen zelfstandige taken.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artifact- en platformmatrix-taken.
3. `build-artifacts` overlapt met de snelle Linux-lanes zodat downstream-consumenten kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unit tests in `src/scripts/ci-changed-scope.test.ts`.
Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest
doen alsof elk scoped gebied is gewijzigd.
CI-workflowbewerkingen valideren de Node CI-graaf plus workflow-linting, maar forceren op zichzelf geen Windows-, Android- of macOS-native builds; die platformlanes blijven beperkt tot wijzigingen in platformsources.
CI routing-only-bewerkingen, geselecteerde goedkope core-test-fixturebewerkingen en smalle plugin-contracthelper/test-routing-bewerkingen gebruiken een snel Node-only-manifestpad: preflight, beveiliging en één `checks-fast-core`-taak. Dat pad vermijdt buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, gebundelde-plugin-shards en aanvullende guard-matrices wanneer de gewijzigde bestanden beperkt zijn tot de routing- of helperoppervlakken die de snelle taak direct uitoefent.
Windows Node-controles zijn beperkt tot Windows-specifieke proces/pad-wrappers, npm/pnpm/UI-runnerhelpers, package manager-configuratie en de CI-workflowoppervlakken die die lane uitvoeren; ongerelateerde source-, plugin-, install-smoke- en test-only-wijzigingen blijven op de Linux Node-lanes zodat ze geen 16-vCPU Windows-worker reserveren voor dekking die al door de normale test-shards wordt uitgeoefend.
De afzonderlijke `install-smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`. Pull requests draaien het snelle pad voor Docker/package-oppervlakken, wijzigingen in gebundelde plugin-packages/manifests en core plugin/channel/gateway/Plugin SDK-oppervlakken die de Docker-smokejobs uitoefenen. Source-only-wijzigingen in gebundelde plugins, test-only-bewerkingen en docs-only-bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image eenmaal, controleert de CLI, draait de agents delete shared-workspace CLI-smoke, draait de container gateway-network e2e, verifieert een gebundelde extensie-buildarg en draait het begrensde gebundelde-plugin-Dockerprofiel onder een geaggregeerde commandotime-out van 240 seconden, waarbij de Docker-run van elk scenario afzonderlijk wordt afgekapt. Het volledige pad behoudt QR-package-installatie en installer-Docker/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call-releasecontroles en pull requests die echt installer/package/Docker-oppervlakken raken. In volledige modus bereidt install-smoke één target-SHA GHCR root-Dockerfile-smoke-image voor of hergebruikt deze, en draait daarna QR-package-installatie, root-Dockerfile/gateway-smokes, installer/update-smokes en de snelle gebundelde-plugin-Docker-E2E als afzonderlijke jobs zodat installerwerk niet hoeft te wachten achter de root-image-smokes. `main`-pushes, inclusief mergecommits, forceren het volledige pad niet; wanneer changed-scope-logica volledige dekking zou aanvragen bij een push, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie. De trage Bun global install image-provider-smoke wordt afzonderlijk afgeschermd door `run_bun_global_install_smoke`; deze draait op het nachtelijke schema en vanuit de release checks-workflow, en handmatige `install-smoke`-dispatches kunnen ervoor kiezen, maar pull requests en `main`-pushes draaien deze niet. QR- en installer-Docker-tests behouden hun eigen installatiegerichte Dockerfiles. Lokale `test:docker:all` bouwt vooraf één gedeelde live-test-image, packt OpenClaw eenmaal als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images: een kale Node/Git-runner voor installer/update/plugin-dependency-lanes en een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait daarna lanes met `OPENCLAW_SKIP_DOCKER_BUILD=1`; stem het standaardaantal slots van 10 voor de main-pool af met `OPENCLAW_DOCKER_ALL_PARALLELISM` en het providergevoelige aantal slots van 10 voor de tail-pool met `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Caps voor zware lanes staan standaard op `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` zodat npm-installatie- en multi-service-lanes Docker niet overbelasten terwijl lichtere lanes nog steeds beschikbare slots vullen. Eén lane die zwaarder is dan de effectieve caps kan nog steeds vanuit een lege pool starten en draait daarna alleen totdat capaciteit wordt vrijgegeven. Lanestarts worden standaard met 2 seconden gespreid om lokale Docker-daemon-create-stormen te vermijden; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` of een andere millisecondewaarde. De lokale aggregaatpreflight controleert Docker, verwijdert verouderde OpenClaw E2E-containers, geeft actieve-lane-status uit, bewaart lanetimings voor longest-first-volgorde en ondersteunt `OPENCLAW_DOCKER_ALL_DRY_RUN=1` voor schedulerinspectie. Standaard stopt deze met het plannen van nieuwe gepoolde lanes na de eerste fout, en elke lane heeft een fallbacktime-out van 120 minuten die kan worden overschreven met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; geselecteerde live/tail-lanes gebruiken strakkere caps per lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` draait exacte schedulerlanes, inclusief release-only-lanes zoals `install-e2e` en gesplitste gebundelde update-lanes zoals `bundled-channel-update-acpx`, terwijl de cleanup-smoke wordt overgeslagen zodat agents één mislukte lane kunnen reproduceren. De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke package-, image-kind-, live-image-, lane- en credential-dekking vereist is, waarna `scripts/docker-e2e.mjs` dat plan omzet in GitHub-outputs en samenvattingen. Deze packt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een current-run-packageartefact of downloadt een packageartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde kale/functionele GHCR Docker E2E-images via Blacksmiths Docker-layercache wanneer het plan package-geïnstalleerde lanes nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry/cache-stream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken. De `Package Acceptance`-workflow is de package-gate op hoog niveau: deze resolveert een kandidaat uit npm, een vertrouwde `package_ref`, een HTTPS-tarball plus SHA-256 of een eerder workflowartefact, en geeft daarna dat ene `package-under-test`-artefact door aan de herbruikbare Docker E2E-workflow. Deze houdt `workflow_ref` gescheiden van `package_ref` zodat huidige acceptatielogica oudere vertrouwde commits kan valideren zonder oude workflowcode uit te checken. Releasecontroles draaien een aangepaste Package Acceptance-delta voor de target ref: compatibiliteit van gebundelde kanalen, offline plugin-fixtures en Telegram-package-QA tegen de geresolveerde tarball. De release-path-Docker-suite draait kleinere gechunkte jobs met `OPENCLAW_SKIP_DOCKER_BUILD=1` zodat elke chunk alleen de image-kind pullt die hij nodig heeft en meerdere lanes uitvoert via dezelfde gewogen scheduler (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI wordt in `plugins-runtime-services` opgenomen wanneer volledige release-path-dekking dit aanvraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. De legacy aggregaatchunknamen `package-update`, `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven werken voor handmatige reruns, maar de releaseworkflow gebruikt de gesplitste chunks zodat installer-E2E en gebundelde plugin-install/uninstall-sweeps het kritieke pad niet domineren. De `install-e2e`-lanealias blijft de aggregaatalias voor handmatige reruns voor beide provider-installerlanes. De `bundled-channels`-chunk draait gesplitste `bundled-channel-*`- en `bundled-channel-update-*`-lanes in plaats van de seriële alles-in-één `bundled-channel-deps`-lane. Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, scheduler-plan-JSON, slow-lane-tabellen en rerun-commando's per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, waardoor debugging van mislukte lanes begrensd blijft tot één gerichte Docker-job en het packageartefact voor die run wordt voorbereid, gedownload of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerun-commando's per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact hetzelfde package en dezelfde images uit de mislukte run kan hergebruiken. Gebruik `pnpm test:docker:rerun <run-id>` om Docker-artefacten uit een GitHub-run te downloaden en gecombineerde/lanegerichte rerun-commando's af te drukken; gebruik `pnpm test:docker:timings <summary.json>` voor slow-lane- en phase-critical-path-samenvattingen. De geplande live/E2E-workflow draait dagelijks de volledige release-path-Docker-suite. De gebundelde updatematrix is gesplitst per updatedoel zodat herhaalde npm-update- en doctor-repair-passes kunnen sharden met andere gebundelde controles.

Huidige release-Dockerchunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` en `bundled-channels-contracts`. De aggregaatchunk `bundled-channels` blijft beschikbaar voor handmatige one-shot-reruns, en `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregaataliases voor plugin/runtime, maar de releaseworkflow gebruikt de gesplitste chunks zodat channel-smokes, updatedoelen, plugin-runtimecontroles en gebundelde plugin-install/uninstall-sweeps parallel kunnen draaien. Gerichte `docker_lanes`-dispatches splitsen ook meerdere geselecteerde lanes in parallelle jobs na één gedeelde package/image-voorbereidingsstap, en gebundelde-channel-update-lanes proberen eenmaal opnieuw bij tijdelijke npm-netwerkfouten.

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale controlepoort is strenger over architectuurgrenzen dan de brede scope van het CI-platform: wijzigingen in core-productie draaien core prod- en core-test-typecheck plus core-lint/guards, wijzigingen alleen in core-tests draaien alleen core-test-typecheck plus core-lint, wijzigingen in extensieproductie draaien extensie-prod- en extensie-test-typecheck plus extensie-lint, en wijzigingen alleen in extensietests draaien extensie-test-typecheck plus extensie-lint. Wijzigingen aan de publieke Plugin SDK of het plugin-contract breiden uit naar extensie-typecheck omdat extensies afhankelijk zijn van die core-contracten, maar Vitest-sweeps voor extensies zijn expliciet testwerk. Versiebumpen van alleen release-metadata draaien gerichte versie-/config-/root-dependency-controles. Onbekende root-/config-wijzigingen vallen veilig terug naar alle controle-lanes.
Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en
is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf,
bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-
dependents. Gedeelde delivery-config voor group-room is een van de expliciete mappings:
wijzigingen aan de visible-reply-config voor de groep, de source reply delivery mode, of de
message-tool-system prompt lopen via de core reply-tests plus Discord- en
Slack-delivery-regressies, zodat een gedeelde standaardwijziging faalt vóór de eerste PR-
push. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging
breed genoeg is voor de harness dat de goedkope gemapte set geen betrouwbare proxy is.

Voor Testbox-validatie: draai vanuit de repo-root en geef voor brede bewijslast de voorkeur aan een vers opgewarmde box.
Voordat je een trage gate besteedt aan een box die opnieuw is gebruikt, verlopen is, of
net een onverwacht grote sync meldde, draai je eerst `pnpm testbox:sanity` binnen de
box. De sanity-check faalt snel wanneer vereiste root-bestanden zoals
`pnpm-lock.yaml` zijn verdwenen of wanneer `git status --short` minstens 200
gevolgde verwijderingen toont. Dat betekent meestal dat de remote sync-status geen betrouwbare
kopie van de PR is. Stop die box en warm een verse op in plaats van de
producttestfout te debuggen. Stel voor bedoelde PR's met grote verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run. `pnpm
testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de
sync-fase blijft zonder post-sync-uitvoer. Stel
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere
millisecondewaarde voor ongewoon grote lokale diffs.

Handmatige CI-dispatches draaien `checks-node-compat-node22` als brede compatibiliteitsdekking. Android is opt-in voor zelfstandige handmatige CI via `include_android=true` en altijd ingeschakeld voor `Full Release Validation`. `Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een aparte workflow die wordt gedispatched door `Full Release Validation` of door een expliciete operator. Normale pull requests, pushes naar `main` en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld.

De traagste Node-testfamilies zijn opgesplitst of gebalanceerd zodat elke job klein blijft zonder te veel runners te reserveren: channel-contracten draaien als drie gewogen shards, kleine core-unit-lanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers waarbij de reply-subtree is opgesplitst in agent-runner-, dispatch- en commands/state-routing-shards, en agentic gateway/plugin-configs worden verspreid over de bestaande source-only agentic Node-jobs in plaats van op gebouwde artifacts te wachten. Brede browser-, QA-, media- en overige plugintests gebruiken hun eigen Vitest-configs in plaats van de gedeelde plugin-catch-all. `Plugin Prerelease` balanceert gebundelde plugintests over acht extensieworkers; die extensie-shardjobs draaien maximaal twee plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs creëren. De brede agents-lane gebruikt de gedeelde Vitest-bestandsparallelle scheduler omdat die door import/planning wordt gedomineerd in plaats van door één traag testbestand. `runtime-config` draait met de infra core-runtime-shard om te voorkomen dat de gedeelde runtime-shard de tail bezit. Include-pattern-shards registreren timingentries met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een volledige config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile-/canary-werk bij elkaar en scheidt runtime-topologie-architectuur van gateway-watch-dekking; de boundary-guard-shard draait zijn kleine onafhankelijke guards gelijktijdig binnen één job. Gateway watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al zijn gebouwd, waarbij hun oude controlenamen lichte verifier-jobs blijven terwijl twee extra Blacksmith-workers en een tweede artifact-consumer-wachtrij worden vermeden.
Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play-debug-APK. De third-party-flavor heeft geen aparte source set of manifest; de unit-test-lane compileert die flavor nog steeds met de SMS/call-log BuildConfig-vlaggen, terwijl een dubbele debug-APK-packagingjob op elke Android-relevante push wordt vermeden.
GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR of `main`-ref landt. Behandel dat als CI-ruis, tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shard-controles gebruiken `!cancelled() && always()` zodat ze nog steeds normale shardfouten rapporteren, maar niet in de wachtrij komen nadat de hele workflow al is vervangen.
De automatische CI-concurrency-key is geversioneerd (`CI-v7-*`) zodat een GitHub-side zombie in een oude wachtrijgroep nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren geen lopende runs.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle security-jobs en aggregaten (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/gebundelde controles, gesharde channel-contractcontroles, `check`-shards behalve lint, `check-additional`-shards en aggregaten, Node-testaggregaatverifiers, docs-controles, Python Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook GitHub-hosted Ubuntu zodat de Blacksmith-matrix eerder kan wachten |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde plugintestshards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, dat CPU-gevoelig genoeg blijft dat 8 vCPU meer kostte dan het bespaarde; install-smoke-Docker-builds, waar 32-vCPU-wachtrijtijd meer kostte dan het bespaarde                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` op `openclaw/openclaw`; forks vallen terug op `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Lokale equivalenten

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Releasekanalen](/nl/install/development-channels)
