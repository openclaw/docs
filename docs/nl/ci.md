---
read_when:
    - Je moet begrijpen waarom een CI-taak wel of niet is uitgevoerd
    - Je debugt mislukte GitHub Actions-controles
summary: CI-jobgrafiek, scope-gates en lokale opdrachtequivalenten
title: CI-pijplijn
x-i18n:
    generated_at: "2026-04-30T00:06:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8ebc01707b673ab866c584abdfa5ccb8064d580f3a250c60304c2d056d109dc
    source_path: ci.md
    workflow: 16
---

De CI draait bij elke push naar `main` en elke pull-aanvraag. Deze gebruikt slimme scopebepaling om dure jobs over te slaan wanneer alleen niet-gerelateerde gebieden zijn gewijzigd. Handmatige `workflow_dispatch`-runs omzeilen bewust slimme scopebepaling en waaieren de volledige normale CI-grafiek uit voor releasekandidaten of brede validatie, met Android-lanes opt-in via `include_android` voor zelfstandige handmatige runs. Release-only Plugin-prerelease-lanes staan in de afzonderlijke `Plugin Prerelease`-workflow en draaien alleen vanuit `Full Release Validation` of een expliciete handmatige dispatch.

De `check-dependencies`-shard draait `pnpm deadcode:dependencies`, een production Knip-pass alleen voor dependencies, vastgezet op de nieuwste Knip-versie die door dat script wordt gebruikt, met pnpm's minimale releaseleeftijd uitgeschakeld voor de `dlx`-installatie. Deze draait ook `pnpm deadcode:unused-files`, dat Knip's production-bevindingen voor ongebruikte bestanden vergelijkt met `scripts/deadcode-unused-files.allowlist.mjs`. Die bewaking faalt wanneer een PR een nieuw, niet-beoordeeld ongebruikt bestand toevoegt of na opschoning een verouderde allowlist-entry laat staan, terwijl bewuste dynamische Plugin-, gegenereerde, build-, live-test- en package-bridge-oppervlakken behouden blijven die Knip niet statisch kan oplossen.

`Full Release Validation` is de handmatige overkoepelende workflow voor "alles draaien
vóór release." Deze accepteert een branch, tag of volledige commit-SHA, dispatcht de
handmatige `CI`-workflow met dat doel, dispatcht `Plugin Prerelease` voor
release-only Plugin/package/static/Docker-bewijs, en dispatcht
`OpenClaw Release Checks` voor install smoke, package acceptance, Docker
release-path-suites, live/E2E, OpenWebUI, QA Lab parity, Matrix en Telegram
lanes. Deze kan ook de post-publish `NPM Telegram Beta E2E`-workflow draaien wanneer een
gepubliceerde package-specificatie is opgegeven. `release_profile=minimum|stable|full` bepaalt de live/provider-
breedte die aan release checks wordt doorgegeven: `minimum` behoudt de snelste OpenAI/core
releasekritische lanes, `stable` voegt de stabiele provider/backend-set toe, en
`full` draait de brede adviserende provider/media-matrix. De overkoepelende workflow registreert de
gedispatchte child-run-id's, en de laatste `Verify full validation`-job controleert opnieuw
de huidige conclusies van child-runs en voegt tabellen met traagste jobs toe voor elke child-
run. Als een child-workflow opnieuw wordt gedraaid en groen wordt, draai dan alleen de parent-
verifier-job opnieuw om het overkoepelende resultaat en de timing-samenvatting te vernieuwen.

Voor herstel accepteren `Full Release Validation` en `OpenClaw Release Checks` allebei
`rerun_group`. Gebruik `all` voor een releasekandidaat, `ci` voor alleen het
normale volledige CI-child, `release-checks` voor elk release-child, of een smallere
releasegroep: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` of `npm-telegram` op de overkoepelende workflow. Dit houdt een mislukte
releasebox-rerun begrensd na een gerichte fix.

Het live/E2E-release-child behoudt brede native `pnpm test:live`-dekking, maar
draait die als benoemde shards (`native-live-src-agents`,
`native-live-src-gateway-core`, provider-gefilterde
`native-live-src-gateway-profiles`-jobs,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, gesplitste media-audio/video-shards, en
provider-gefilterde muziekshards) via `scripts/test-live-shard.mjs` in plaats
van één seriële job. Dat behoudt dezelfde bestandsdekking terwijl trage live
provider-fouten makkelijker opnieuw te draaien en diagnosticeren zijn. De geaggregeerde
`native-live-extensions-o-z`-, `native-live-extensions-media`- en
`native-live-extensions-media-music`-shardnamen blijven geldig voor handmatige
eenmalige reruns.

De native live media-shards draaien in
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebouwd door de
`Live Media Runner Image`-workflow. Die image installeert `ffmpeg` en
`ffprobe` vooraf; mediajobs verifiëren alleen de binaries vóór setup. Houd Docker-ondersteunde
live-suites op normale Blacksmith-runners, omdat containerjobs de verkeerde
plek zijn om geneste Docker-tests te starten.

Docker-ondersteunde live model/backend-shards gebruiken een afzonderlijke gedeelde
`ghcr.io/openclaw/openclaw-live-test:<sha>`-image per geselecteerde commit. De live
releaseworkflow bouwt en pusht die image één keer, daarna draaien de Docker live model-,
Gateway-, CLI-backend-, ACP-bind- en Codex-harness-shards met
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Als die shards het volledige source-Docker-
target onafhankelijk herbouwen, is de release-run verkeerd geconfigureerd en verspilt die wall-
clocktijd aan dubbele image-builds.

`OpenClaw Release Checks` gebruikt de vertrouwde workflow-ref om de geselecteerde
ref één keer op te lossen naar een `release-package-under-test`-tarball, en geeft dat artifact
daarna door aan zowel de live/E2E release-path Docker-workflow als de package acceptance-
shard. Dat houdt de package-bytes consistent over releaseboxes en voorkomt
dat dezelfde kandidaat in meerdere child-jobs opnieuw wordt verpakt.

`Package Acceptance` is de side-run-workflow voor het valideren van een package-artifact
zonder de releaseworkflow te blokkeren. Deze lost één kandidaat op uit een
gepubliceerde npm-specificatie, een vertrouwde `package_ref` gebouwd met de geselecteerde
`workflow_ref`-harness, een HTTPS-tarball-URL met SHA-256, of een tarball-artifact
uit een andere GitHub Actions-run, uploadt deze als `package-under-test`, en hergebruikt
daarna de Docker release/E2E-scheduler met die tarball in plaats van de
workflow-checkout opnieuw te verpakken. Profielen dekken smoke, package, product, full en custom
Docker-laneselecties. Het `package`-profiel gebruikt offline Plugin-dekking zodat
gepubliceerde-package-validatie niet afhangt van live ClawHub-beschikbaarheid. De
optionele Telegram-lane hergebruikt het
`package-under-test`-artifact in de `NPM Telegram Beta E2E`-workflow, waarbij het
gepubliceerde npm-specificatiepad behouden blijft voor zelfstandige dispatches.

## Pakketacceptatie

Gebruik `Package Acceptance` wanneer de vraag is: "werkt dit installeerbare OpenClaw-
package als product?" Het verschilt van normale CI: normale CI valideert
de source tree, terwijl package acceptance één tarball valideert via dezelfde
Docker E2E-harness die gebruikers na installatie of update gebruiken.

De workflow heeft vier jobs:

1. `resolve_package` checkt `workflow_ref` uit, lost één packagekandidaat op,
   schrijft `.artifacts/docker-e2e-package/openclaw-current.tgz`, schrijft
   `.artifacts/docker-e2e-package/package-candidate.json`, uploadt beide als het
   `package-under-test`-artifact, en print de source, workflow-ref, package-
   ref, versie, SHA-256 en profiel in de GitHub-stapsamenvatting.
2. `docker_acceptance` roept
   `openclaw-live-and-e2e-checks-reusable.yml` aan met `ref=workflow_ref` en
   `package_artifact_name=package-under-test`. De herbruikbare workflow downloadt
   dat artifact, valideert de tarball-inventaris, bereidt package-digest
   Docker-images voor wanneer nodig, en draait de geselecteerde Docker-lanes tegen dat
   package in plaats van de workflow-checkout te packen. Wanneer een profiel
   meerdere gerichte `docker_lanes` selecteert, bereidt de herbruikbare workflow het package
   en gedeelde images één keer voor, en waaiert die lanes daarna uit als parallelle gerichte Docker-
   jobs met unieke artifacts.
3. `package_telegram` roept optioneel `NPM Telegram Beta E2E` aan. Deze draait wanneer
   `telegram_mode` niet `none` is en installeert hetzelfde `package-under-test`-
   artifact wanneer Package Acceptance er één heeft opgelost; zelfstandige Telegram-dispatch
   kan nog steeds een gepubliceerde npm-specificatie installeren.
4. `summary` laat de workflow falen als package-resolutie, Docker acceptance of
   de optionele Telegram-lane is mislukt.

Kandidaatbronnen:

- `source=npm`: accepteert alleen `openclaw@beta`, `openclaw@latest`, of een exacte
  OpenClaw-releaseversie zoals `openclaw@2026.4.27-beta.2`. Gebruik dit voor
  gepubliceerde beta/stable-acceptatie.
- `source=ref`: packt een vertrouwde `package_ref`-branch, tag of volledige commit-SHA.
  De resolver fetcht OpenClaw-branches/tags, verifieert dat de geselecteerde commit
  bereikbaar is vanuit repository-branchgeschiedenis of een releasetag, installeert dependencies in een
  losgekoppelde worktree, en packt deze met `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: downloadt een HTTPS `.tgz`; `package_sha256` is verplicht.
- `source=artifact`: downloadt één `.tgz` uit `artifact_run_id` en
  `artifact_name`; `package_sha256` is optioneel maar moet worden meegegeven voor
  extern gedeelde artifacts.

Houd `workflow_ref` en `package_ref` gescheiden. `workflow_ref` is de vertrouwde
workflow/harness-code die de test draait. `package_ref` is de source-commit
die wordt gepackt wanneer `source=ref`. Hierdoor kan de huidige testharness oudere
vertrouwde source-commits valideren zonder oude workflowlogica te draaien.

Profielen mappen naar Docker-dekking:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` plus `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: volledige Docker release-path-chunks met OpenWebUI
- `custom`: exacte `docker_lanes`; verplicht wanneer `suite_profile=custom`

Release checks roepen Package Acceptance aan met `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'`, en
`telegram_mode=mock-openai`. De release-path Docker-
chunks dekken de overlappende package/update/Plugin-lanes, terwijl Package
Acceptance het artifact-native bundled-channel compat-, offline Plugin- en
Telegram-bewijs tegen dezelfde opgeloste package-tarball behoudt.
Cross-OS release checks dekken nog steeds OS-specifieke onboarding, installer- en
platformgedrag; package/update-productvalidatie moet beginnen met Package
Acceptance. De Windows packaged- en installer-fresh-lanes verifiëren ook dat een
geïnstalleerd package een browser-control-override kan importeren vanaf een raw absoluut
Windows-pad. De OpenAI cross-OS agent-turn smoke gebruikt standaard
`OPENCLAW_CROSS_OS_OPENAI_MODEL` wanneer ingesteld, anders `openai/gpt-5.4-mini`, zodat
het installatie- en Gateway-bewijs snel en deterministisch blijft. Toegewezen live
provider/model-lanes dekken nog steeds bredere modelrouting, inclusief tragere
frontier-standaarden.

Package Acceptance heeft begrensde legacy-compatibiliteitsvensters voor al
gepubliceerde packages. Packages tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`,
mogen het compatibiliteitspad gebruiken voor bekende private QA-entries in
`dist/postinstall-inventory.json` die verwijzen naar bestanden die uit de tarball zijn weggelaten,
`doctor-switch` mag de `gateway install --wrapper`-persistentiesubcase overslaan
wanneer het package die flag niet exposeert, `update-channel-switch` mag
ontbrekende `pnpm.patchedDependencies` snoeien uit de van de tarball afgeleide fake git-fixture en
mag ontbrekende gepersisteerde `update.channel` loggen, Plugin-smokes mogen legacy
install-record-locaties lezen of ontbrekende marketplace install-record-
persistentie accepteren, en `plugin-update` mag config-metadatamigratie toestaan terwijl nog steeds
vereist blijft dat het install-record en no-reinstall-gedrag ongewijzigd blijven. Het
gepubliceerde `2026.4.26`-package mag ook waarschuwen voor lokale build-metadatastempelbestanden
die al waren verscheept. Latere packages moeten aan de moderne contracten voldoen; dezelfde
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

Begin bij het debuggen van een mislukte pakketacceptatierun met de samenvatting `resolve_package` om de pakketbron, versie en SHA-256 te bevestigen. Inspecteer daarna de onderliggende run `docker_acceptance` en de Docker-artifacts ervan: `.artifacts/docker-tests/**/summary.json`, `failures.json`, lane-logboeken, fasetimings en rerun-opdrachten. Geef de voorkeur aan het opnieuw uitvoeren van het mislukte pakketprofiel of de exacte Docker-lanes boven het opnieuw uitvoeren van volledige releasevalidatie.

QA Lab heeft speciale CI-lanes buiten de hoofdworkflow met slimme scope. De workflow `Parity gate` draait bij overeenkomende PR-wijzigingen en handmatige dispatch; deze bouwt de private QA-runtime en vergelijkt de mock GPT-5.5- en Opus 4.6-agentic-pakketten. De workflow `QA-Lab - All Lanes` draait elke nacht op `main` en bij handmatige dispatch; deze waaiert de mock-parity gate, live Matrix-lane en live Telegram- en Discord-lanes uit als parallelle jobs. De live jobs gebruiken de omgeving `qa-live-shared`, en Telegram/Discord gebruiken Convex-leases. Releasechecks draaien Matrix- en Telegram-lanes voor live transport met de deterministische mock-provider en mock-gekwalificeerde modellen (`mock-openai/gpt-5.5` en `mock-openai/gpt-5.5-alt`), zodat het kanaalcontract geïsoleerd is van live modellatentie en normale opstart van provider-Plugins. De Gateway voor live transport schakelt ook geheugenzoekopdrachten uit omdat QA-parity geheugengedrag apart dekt; providerconnectiviteit wordt gedekt door de aparte live model-, native provider- en Docker provider-suites. Matrix gebruikt `--profile fast` voor geplande en release-gates, en voegt `--fail-fast` alleen toe wanneer de uitgecheckte CLI dit ondersteunt. De CLI-standaardwaarde en de handmatige workflowinvoer blijven `all`; handmatige dispatch met `matrix_profile=all` splitst volledige Matrix-dekking altijd in jobs voor `transport`, `media`, `e2ee-smoke`, `e2ee-deep` en `e2ee-cli`. `OpenClaw Release Checks` draait ook de releasekritieke QA Lab-lanes vóór releasegoedkeuring; de QA-parity gate draait de kandidaat- en baseline-pakketten als parallelle lane-jobs en downloadt daarna beide artifacts naar een kleine rapportjob voor de uiteindelijke parity-vergelijking. Plaats het PR-landingspad niet achter `Parity gate`, tenzij de wijziging daadwerkelijk de QA-runtime, modelpakket-parity of een oppervlak raakt waarvan de parity-workflow eigenaar is. Behandel dit voor normale kanaal-, config-, docs- of unittestreparaties als een optioneel signaal en volg in plaats daarvan het scoped CI-/checkbewijs.

De workflow `Duplicate PRs After Merge` is een handmatige maintainer-workflow voor het opschonen van duplicaten na landing. Deze staat standaard op dry-run en sluit alleen expliciet vermelde PR's wanneer `apply=true`. Voordat GitHub wordt gewijzigd, controleert de workflow of de gelande PR is gemerged en of elk duplicaat ofwel een gedeeld gerefereerd issue heeft, of overlappende gewijzigde hunks.

De workflow `CodeQL` is bewust een smalle eerste beveiligingsscanner, niet de volledige sweep van de repository. Dagelijkse en handmatige runs scannen Actions-workflowcode plus de JavaScript/TypeScript-oppervlakken met het hoogste risico voor auth, geheimen, sandbox, Cron en Gateway met beveiligingsqueries met hoge precisie onder de categorie `/codeql-critical-security/core-auth-secrets`. De job `channel-runtime-boundary` scant apart implementatiecontracten van kernkanalen plus de runtime van kanaal-Plugins, Gateway, Plugin SDK, geheimen en audit-aanraakpunten onder de categorie `/codeql-critical-security/channel-runtime-boundary`, zodat kanaalbeveiligingssignalen kunnen schalen zonder de baselinecategorie voor auth/geheimen te verbreden. De job `network-ssrf-boundary` scant kernoppervlakken voor SSRF, IP-parsing, netwerkguard, web-fetch en het SSRF-beleid van de Plugin SDK onder de categorie `/codeql-critical-security/network-ssrf-boundary`, zodat het signaal voor netwerkvertrouwensgrenzen gescheiden blijft van de beveiligingsbaseline voor auth/geheimen. De job `mcp-process-tool-boundary` scant MCP-servers, helpers voor procesuitvoering, outbound delivery en agent-gates voor tooluitvoering onder de categorie `/codeql-critical-security/mcp-process-tool-boundary`, zodat het signaal voor opdracht- en toolgrenzen gescheiden blijft van zowel de auth/geheimen-baseline als de niet-beveiligingsshard voor MCP-/proceskwaliteit. De job `plugin-trust-boundary` scant vertrouwensoppervlakken voor Plugin-installatie, loader, manifest, registry, runtime-dependency staging, source-loading, public-surface en het pakketcontract van de Plugin SDK onder de categorie `/codeql-critical-security/plugin-trust-boundary`, zodat signalen voor de Plugin-supply-chain en runtime-loading gescheiden blijven van zowel implementatiecode van gebundelde Plugins als de niet-beveiligingsshard voor Plugin-kwaliteit.

De workflow `CodeQL Android Critical Security` is de geplande Android-beveiligingsshard. Deze bouwt de Android-app handmatig voor CodeQL op het kleinste Blacksmith Linux-runnerlabel dat door workflowsanity wordt geaccepteerd en uploadt resultaten onder de categorie `/codeql-critical-security/android`.

De workflow `CodeQL macOS Critical Security` is de wekelijkse/handmatige macOS-beveiligingsshard. Deze bouwt de macOS-app handmatig voor CodeQL op Blacksmith macOS, filtert buildresultaten van afhankelijkheden uit de geüploade SARIF en uploadt resultaten onder de categorie `/codeql-critical-security/macos`. Houd deze buiten de dagelijkse standaardworkflow, omdat de macOS-build de runtime domineert, zelfs wanneer die schoon is.

De workflow `CodeQL Critical Quality` is de bijbehorende niet-beveiligingsshard. Deze draait alleen JavaScript/TypeScript-kwaliteitsqueries met foutseverity en zonder beveiligingsscope over smalle oppervlakken met hoge waarde op de kleinere Blacksmith Linux-runner. De handmatige dispatch accepteert `profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; de smalle profielen zijn hooks voor uitleg/iteratie om één kwaliteitsshard geïsoleerd te draaien zonder de rest van de workflow te dispatchen. De job `core-auth-secrets` scant grenscode voor auth, geheimen, sandbox, Cron en Gateway-beveiliging onder de aparte categorie `/codeql-critical-quality/core-auth-secrets`. De job `config-boundary` scant configschema's, migratie, normalisatie en IO-contracten onder de aparte categorie `/codeql-critical-quality/config-boundary`. De job `gateway-runtime-boundary` scant Gateway-protocolschema's en servermethodecontracten onder de aparte categorie `/codeql-critical-quality/gateway-runtime-boundary`. De job `channel-runtime-boundary` scant implementatiecontracten van kernkanalen onder de aparte categorie `/codeql-critical-quality/channel-runtime-boundary`. De job `agent-runtime-boundary` scant opdrachtuitvoering, model-/providerdispatch, auto-reply-dispatch en -queues, en ACP-control-plane-runtimecontracten onder de aparte categorie `/codeql-critical-quality/agent-runtime-boundary`. De job `mcp-process-runtime-boundary` scant MCP-servers en toolbridges, helpers voor processupervisie en outbound delivery-contracten onder de aparte categorie `/codeql-critical-quality/mcp-process-runtime-boundary`. De job `memory-runtime-boundary` scant de geheugenhost-SDK, geheugenruntime-facades, geheugenaliassen van de Plugin SDK, activeringsglue voor geheugenruntime en geheugen-doctor-opdrachten onder de aparte categorie `/codeql-critical-quality/memory-runtime-boundary`. De job `session-diagnostics-boundary` scant reply-queue-internals, sessiedeliveryqueues, helpers voor outbound sessiebinding/-delivery, oppervlakken voor diagnostische events/logbundles en sessie-doctor-CLI-contracten onder de aparte categorie `/codeql-critical-quality/session-diagnostics-boundary`. De job `plugin-sdk-reply-runtime` scant inbound reply-dispatch van de Plugin SDK, helpers voor reply-payload/chunking/runtime, kanaalreplyopties, deliveryqueues en helpers voor sessie-/threadbinding onder de aparte categorie `/codeql-critical-quality/plugin-sdk-reply-runtime`. De job `provider-runtime-boundary` scant normalisatie van modelcatalogi, provider-auth en -discovery, registratie van providerruntime, providerstandaarden/-catalogi en providerregistries voor web/search/fetch/embedding onder de aparte categorie `/codeql-critical-quality/provider-runtime-boundary`. De job `ui-control-plane` scant Control UI-bootstrap, lokale persistentie, Gateway-controlflows en runtimecontracten van de taak-control-plane onder de aparte categorie `/codeql-critical-quality/ui-control-plane`. De job `web-media-runtime-boundary` scant runtimecontracten voor core web fetch/search, media-IO, media understanding, image-generation en media-generation onder de aparte categorie `/codeql-critical-quality/web-media-runtime-boundary`. De job `plugin-boundary` scant loader-, registry-, public-surface- en Plugin SDK-entrypointcontracten onder een aparte categorie `/codeql-critical-quality/plugin-boundary`. De job `plugin-sdk-package-contract` scant de gepubliceerde package-side Plugin SDK-bron en helpers voor Plugin-pakketcontracten onder de aparte categorie `/codeql-critical-quality/plugin-sdk-package-contract`. Houd de workflow gescheiden van beveiliging, zodat kwaliteitsbevindingen kunnen worden gepland, gemeten, uitgeschakeld of uitgebreid zonder het beveiligingssignaal te vertroebelen. Swift-, Python- en gebundelde-Plugin-CodeQL-uitbreiding moet alleen als scoped of geshard vervolgwerk worden teruggevoegd nadat de smalle profielen stabiele runtime en stabiel signaal hebben.

De workflow `Docs Agent` is een eventgedreven Codex-onderhoudslane om bestaande docs afgestemd te houden op recent gelande wijzigingen. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, en handmatige dispatch kan deze direct draaien. Workflow-run-aanroepen worden overgeslagen wanneer `main` verder is gegaan of wanneer in het afgelopen uur een andere niet-overgeslagen Docs Agent-run is aangemaakt. Wanneer de workflow draait, beoordeelt deze het commitbereik van de vorige niet-overgeslagen Docs Agent-bron-SHA tot de huidige `main`, zodat één uurlijkse run alle main-wijzigingen kan dekken die sinds de laatste docspass zijn verzameld.

De workflow `Test Performance Agent` is een eventgedreven Codex-onderhoudslane voor trage tests. Deze heeft geen puur schema: een succesvolle niet-bot push-CI-run op `main` kan deze triggeren, maar wordt overgeslagen als er die UTC-dag al een andere workflow-run-aanroep heeft gedraaid of draait. Handmatige dispatch omzeilt die dagelijkse activiteitsgate. De lane bouwt een gegroepeerd Vitest-prestatierapport voor de volledige suite, laat Codex alleen kleine testprestatieverbeteringen maken die dekking behouden in plaats van brede refactors, draait daarna het rapport voor de volledige suite opnieuw en wijst wijzigingen af die het aantal passerende baseline-tests verlagen. Als de baseline falende tests heeft, mag Codex alleen duidelijke failures repareren en moet het after-agent-rapport voor de volledige suite slagen voordat er iets wordt gecommit. Wanneer `main` verder gaat voordat de bot-push landt, rebaset de lane de gevalideerde patch, draait `pnpm check:changed` opnieuw en probeert de push opnieuw; conflicterende verouderde patches worden overgeslagen. De lane gebruikt GitHub-hosted Ubuntu, zodat de Codex-action dezelfde drop-sudo-veiligheidshouding kan behouden als de docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Taakoverzicht

| Job                              | Doel                                                                                              | Wanneer deze draait                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Detecteer wijzigingen die alleen documentatie raken, gewijzigde scopes, gewijzigde plugins en bouw het CI-manifest | Altijd bij niet-concept-pushes en PR's      |
| `security-scm-fast`              | Detectie van privésleutels en workflow-audit via `zizmor`                                         | Altijd bij niet-concept-pushes en PR's      |
| `security-dependency-audit`      | Productie-lockfile-audit zonder dependencies op npm-adviezen                                      | Altijd bij niet-concept-pushes en PR's      |
| `security-fast`                  | Vereiste aggregatie voor de snelle beveiligingstaken                                              | Altijd bij niet-concept-pushes en PR's      |
| `build-artifacts`                | Bouw `dist/`, Control UI, controles voor gebouwde artefacten en herbruikbare downstreamartefacten | Node-relevante wijzigingen                  |
| `checks-fast-core`               | Snelle Linux-correctheidslanes zoals controles voor bundled/plugin-contract/protocol              | Node-relevante wijzigingen                  |
| `checks-fast-contracts-channels` | Geschaarde kanaalcontractcontroles met een stabiel geaggregeerd controleresultaat                 | Node-relevante wijzigingen                  |
| `checks-node-core-test`          | Core Node-testshards, met uitzondering van kanaal-, bundled-, contract- en plugin-lanes           | Node-relevante wijzigingen                  |
| `check`                          | Geschaard equivalent van de lokale hoofdingang: productietypen, lint, guards, testtypen en strikte smoke | Node-relevante wijzigingen                  |
| `check-additional`               | Architectuur-, grens-, plugin-oppervlak-, package-grens- en gateway-watch-shards                 | Node-relevante wijzigingen                  |
| `build-smoke`                    | Smoke-tests voor de gebouwde CLI en smoke voor opstartgeheugen                                    | Node-relevante wijzigingen                  |
| `checks`                         | Verifier voor kanaaltests van gebouwde artefacten                                                 | Node-relevante wijzigingen                  |
| `checks-node-compat-node22`      | Node 22-compatibiliteitsbuild en smoke-lane                                                       | Handmatige CI-dispatch voor releases        |
| `check-docs`                     | Documentatieformattering, lint en controles op kapotte links                                      | Documentatie gewijzigd                      |
| `skills-python`                  | Ruff + pytest voor Python-ondersteunde Skills                                                     | Python-Skills-relevante wijzigingen         |
| `checks-windows`                 | Windows-specifieke proces-/padtests plus gedeelde regressies voor runtime-importspecificaties     | Windows-relevante wijzigingen               |
| `macos-node`                     | macOS TypeScript-testlane met de gedeelde gebouwde artefacten                                     | macOS-relevante wijzigingen                 |
| `macos-swift`                    | Swift-lint, build en tests voor de macOS-app                                                      | macOS-relevante wijzigingen                 |
| `android`                        | Android-unittests voor beide flavors plus één debug-APK-build                                     | Android-relevante wijzigingen               |
| `test-performance-agent`         | Dagelijkse Codex-optimalisatie van trage tests na vertrouwde activiteit                           | Succes van hoofd-CI of handmatige dispatch  |

Handmatige CI-dispatches draaien dezelfde jobgrafiek als normale CI, maar zetten elke
niet-Android-gescopete lane geforceerd aan: Linux Node-shards, bundled-plugin-shards, kanaalcontracten,
Node 22-compatibiliteit, `check`, `check-additional`, build-smoke, documentatiecontroles,
Python-Skills, Windows, macOS en Control UI i18n. Zelfstandige handmatige CI-
dispatches draaien alleen Android met `include_android=true`; de volledige release-
paraplu schakelt Android in door `include_android=true` door te geven. Statische prerelease-
controles voor Plugins, de alleen-voor-releases `agentic-plugins`-shard, de volledige plugin-
batchsweep en Docker-lanes voor Plugin-prereleases zijn uitgesloten van CI. De Docker-
prerelease-suite draait alleen wanneer `Full Release Validation` de afzonderlijke
`Plugin Prerelease`-workflow dispatcht met de releasevalidatie-gate ingeschakeld.
Handmatige runs gebruiken een
unieke concurrency-groep, zodat een volledige suite voor een release candidate niet wordt geannuleerd door
een andere push- of PR-run op dezelfde ref. Met de optionele `target_ref`-invoer kan een
vertrouwde aanroeper die grafiek draaien tegen een branch, tag of volledige commit-SHA, terwijl
het workflowbestand van de geselecteerde dispatch-ref wordt gebruikt.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Fail-fast-volgorde

Jobs zijn zo geordend dat goedkope controles falen voordat dure controles draaien:

1. `preflight` bepaalt welke lanes überhaupt bestaan. De logica voor `docs-scope` en `changed-scope` bestaat uit stappen binnen deze job, niet uit zelfstandige jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` en `skills-python` falen snel zonder te wachten op de zwaardere artefact- en platformmatrixjobs.
3. `build-artifacts` overlapt met de snelle Linux-lanes, zodat downstreamgebruikers kunnen starten zodra de gedeelde build klaar is.
4. Zwaardere platform- en runtime-lanes waaieren daarna uit: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` en `android`.

Scope-logica staat in `scripts/ci-changed-scope.mjs` en wordt gedekt door unittests in `src/scripts/ci-changed-scope.test.ts`.
Handmatige dispatch slaat changed-scope-detectie over en laat het preflight-manifest
werken alsof elk gescopet gebied is gewijzigd.
CI-workflowbewerkingen valideren de Node CI-graaf plus workflow-linting, maar dwingen op zichzelf geen native builds voor Windows, Android of macOS af; die platformlanes blijven gescopet op wijzigingen in platformbroncode.
CI-bewerkingen die alleen routing betreffen, geselecteerde goedkope core-testfixturebewerkingen en smalle plugincontracthelper-/testroutingbewerkingen gebruiken een snel Node-only manifestpad: preflight, security en één `checks-fast-core`-taak. Dat pad vermijdt buildartefacten, Node 22-compatibiliteit, kanaalcontracten, volledige core-shards, gebundelde-plugin-shards en extra guard-matrices wanneer de gewijzigde bestanden beperkt zijn tot de routing- of helperoppervlakken die de snelle taak direct oefent.
Windows Node-checks zijn gescopet op Windows-specifieke process-/path-wrappers, npm/pnpm/UI-runnerhelpers, pakketmanagerconfiguratie en de CI-workflowoppervlakken die die lane uitvoeren; niet-gerelateerde broncode-, plugin-, install-smoke- en test-only-wijzigingen blijven op de Linux Node-lanes zodat ze geen 16-vCPU Windows-worker reserveren voor dekking die al door de normale testshards wordt uitgevoerd.
De afzonderlijke `install-smoke`-workflow hergebruikt hetzelfde scopescript via zijn eigen `preflight`-job. Deze splitst smoke-dekking in `run_fast_install_smoke` en `run_full_install_smoke`. Pull requests draaien het snelle pad voor Docker-/pakketoppervlakken, wijzigingen in gebundelde pluginpakketten/manifests en core plugin-/kanaal-/gateway-/Plugin SDK-oppervlakken die de Docker smoke-jobs oefenen. Source-only-wijzigingen in gebundelde plugins, test-only-bewerkingen en docs-only-bewerkingen reserveren geen Docker-workers. Het snelle pad bouwt de root-Dockerfile-image één keer, controleert de CLI, draait de agents delete shared-workspace CLI-smoke, draait de container gateway-network e2e, verifieert een build-argument voor een gebundelde extensie en draait het begrensde gebundelde-plugin Docker-profiel onder een geaggregeerde opdracht-time-out van 240 seconden, waarbij elke Docker-run van een scenario afzonderlijk is begrensd. Het volledige pad behoudt QR-pakketinstallatie en installer-Docker-/update-dekking voor nachtelijke geplande runs, handmatige dispatches, workflow-call releasechecks en pull requests die echt installer-/pakket-/Docker-oppervlakken raken. In volledige modus bereidt `install-smoke` één target-SHA GHCR root-Dockerfile smoke-image voor of hergebruikt die, en draait daarna QR-pakketinstallatie, root-Dockerfile-/gateway-smokes, installer-/update-smokes en de snelle gebundelde-plugin Docker E2E als afzonderlijke jobs zodat installerwerk niet achter de root-image-smokes hoeft te wachten. `main`-pushes, inclusief mergecommits, dwingen het volledige pad niet af; wanneer changed-scope-logica volledige dekking bij een push zou aanvragen, behoudt de workflow de snelle Docker-smoke en laat de volledige install-smoke over aan nachtelijke of releasevalidatie. De trage Bun global install image-provider-smoke wordt afzonderlijk bewaakt door `run_bun_global_install_smoke`; deze draait op het nachtelijke schema en vanuit de releasechecks-workflow, en handmatige `install-smoke`-dispatches kunnen ervoor kiezen, maar pull requests en `main`-pushes draaien hem niet. QR- en installer-Docker-tests behouden hun eigen installgerichte Dockerfiles. Lokale `test:docker:all` prebuiltt één gedeelde live-test-image, verpakt OpenClaw één keer als npm-tarball en bouwt twee gedeelde `scripts/e2e/Dockerfile`-images: een kale Node/Git-runner voor installer-/update-/plugin-dependency-lanes en een functionele image die dezelfde tarball in `/app` installeert voor normale functionaliteitslanes. Docker-lanedefinities staan in `scripts/lib/docker-e2e-scenarios.mjs`, plannerlogica staat in `scripts/lib/docker-e2e-plan.mjs`, en de runner voert alleen het geselecteerde plan uit. De scheduler selecteert de image per lane met `OPENCLAW_DOCKER_E2E_BARE_IMAGE` en `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, en draait lanes daarna met `OPENCLAW_SKIP_DOCKER_BUILD=1`; stel het standaard aantal main-pool-slots van 10 af met `OPENCLAW_DOCKER_ALL_PARALLELISM` en het providergevoelige aantal tail-pool-slots van 10 met `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Heavy-lane-limieten zijn standaard `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` en `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, zodat npm-installatie en multi-service-lanes Docker niet overcommitteren terwijl lichtere lanes beschikbare slots blijven vullen. Een enkele lane die zwaarder is dan de effectieve limieten kan nog steeds starten vanuit een lege pool, en draait dan alleen totdat hij capaciteit vrijgeeft. Lanestarts worden standaard 2 seconden gespreid om lokale Docker-daemon-create-stormen te vermijden; overschrijf dit met `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` of een andere millisecondenwaarde. De lokale aggregaat-preflightt Docker, verwijdert oude OpenClaw E2E-containers, emit active-lane-status, bewaart lanetimings voor langste-eerst-volgorde en ondersteunt `OPENCLAW_DOCKER_ALL_DRY_RUN=1` voor schedulerinspectie. Standaard stopt deze met het plannen van nieuwe gepoolde lanes na de eerste fout, en elke lane heeft een fallback-time-out van 120 minuten die met `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` kan worden overschreven; geselecteerde live-/tail-lanes gebruiken strakkere per-lane-limieten. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` draait exacte schedulerlanes, inclusief release-only-lanes zoals `install-e2e` en gesplitste gebundelde update-lanes zoals `bundled-channel-update-acpx`, terwijl de cleanup-smoke wordt overgeslagen zodat agents één mislukte lane kunnen reproduceren. De herbruikbare live/E2E-workflow vraagt `scripts/test-docker-all.mjs --plan-json` welke pakket-, imagesoort-, live-image-, lane- en credentialdekking vereist is, waarna `scripts/docker-e2e.mjs` dat plan omzet naar GitHub-outputs en samenvattingen. Deze verpakt OpenClaw via `scripts/package-openclaw-for-docker.mjs`, downloadt een pakketartefact van de huidige run of downloadt een pakketartefact uit `package_artifact_run_id`; valideert de tarball-inventaris; bouwt en pusht package-digest-getagde bare/functional GHCR Docker E2E-images via Blacksmiths Docker-laagcache wanneer het plan lanes met geïnstalleerd pakket nodig heeft; en hergebruikt opgegeven `docker_e2e_bare_image`-/`docker_e2e_functional_image`-inputs of bestaande package-digest-images in plaats van opnieuw te bouwen. Docker-image-pulls worden opnieuw geprobeerd met een begrensde time-out van 180 seconden per poging, zodat een vastgelopen registry-/cachestream snel opnieuw probeert in plaats van het grootste deel van het kritieke CI-pad te verbruiken. De `Package Acceptance`-workflow is de high-level pakketgate: deze resolveert een kandidaat uit npm, een vertrouwde `package_ref`, een HTTPS-tarball plus SHA-256 of een eerder workflowartefact, en geeft dat ene `package-under-test`-artefact daarna door aan de herbruikbare Docker E2E-workflow. Deze houdt `workflow_ref` gescheiden van `package_ref`, zodat huidige acceptatielogica oudere vertrouwde commits kan valideren zonder oude workflowcode uit te checken. Releasechecks draaien een aangepaste Package Acceptance-delta voor de target-ref: compatibiliteit van gebundelde kanalen, offline pluginfixtures en Telegram-pakket-QA tegen de geresolveerde tarball. De release-path Docker-suite draait kleinere jobs in chunks met `OPENCLAW_SKIP_DOCKER_BUILD=1`, zodat elke chunk alleen de imagesoort pullt die hij nodig heeft en meerdere lanes via dezelfde gewogen scheduler uitvoert (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI wordt opgenomen in `plugins-runtime-services` wanneer volledige release-path-dekking daarom vraagt, en behoudt alleen een zelfstandige `openwebui`-chunk voor OpenWebUI-only-dispatches. De legacy aggregaat-chunknamen `package-update`, `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven werken voor handmatige reruns, maar de releaseworkflow gebruikt de gesplitste chunks zodat installer-E2E en gebundelde-plugin-install-/uninstall-sweeps het kritieke pad niet domineren. De lane-alias `install-e2e` blijft de aggregaat-alias voor handmatige reruns voor beide providerinstallerlanes. De `bundled-channels`-chunk draait gesplitste `bundled-channel-*`- en `bundled-channel-update-*`-lanes in plaats van de seriële alles-in-één `bundled-channel-deps`-lane. Elke chunk uploadt `.artifacts/docker-tests/` met lanelogs, timings, `summary.json`, `failures.json`, fasetimings, schedulerplan-JSON, tabellen met trage lanes en rerunopdrachten per lane. De workflowinput `docker_lanes` draait geselecteerde lanes tegen de voorbereide images in plaats van de chunkjobs, wat debugging van mislukte lanes begrenst tot één gerichte Docker-job en het pakketartefact voor die run voorbereidt, downloadt of hergebruikt; als een geselecteerde lane een live-Docker-lane is, bouwt de gerichte job de live-test-image lokaal voor die rerun. Gegenereerde GitHub-rerunopdrachten per lane bevatten `package_artifact_run_id`, `package_artifact_name` en voorbereide image-inputs wanneer die waarden bestaan, zodat een mislukte lane exact het pakket en de images van de mislukte run kan hergebruiken. Gebruik `pnpm test:docker:rerun <run-id>` om Docker-artefacten van een GitHub-run te downloaden en gecombineerde/gerichte rerunopdrachten per lane af te drukken; gebruik `pnpm test:docker:timings <summary.json>` voor samenvattingen van trage lanes en fasekritieke paden. De geplande live/E2E-workflow draait dagelijks de volledige release-path Docker-suite. De gebundelde update-matrix is gesplitst per update-target, zodat herhaalde npm-update- en doctor-reparatiepasses kunnen sharden met andere gebundelde checks.

Huidige release-Docker-chunks zijn `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` en `bundled-channels-contracts`. De aggregaat-`bundled-channels`-chunk blijft beschikbaar voor handmatige one-shot-reruns, en `plugins-runtime-core`, `plugins-runtime` en `plugins-integrations` blijven aggregaat-plugin-/runtime-aliassen, maar de releaseworkflow gebruikt de gesplitste chunks zodat kanaal-smokes, update-targets, pluginruntimechecks en gebundelde-plugin-install-/uninstall-sweeps parallel kunnen draaien. Gerichte `docker_lanes`-dispatches splitsen ook meerdere geselecteerde lanes in parallelle jobs na één gedeelde pakket-/imagevoorbereidingsstap, en gebundelde-channel-updatelanes proberen één keer opnieuw bij tijdelijke npm-netwerkfouten.

Lokale changed-lane-logica staat in `scripts/changed-lanes.mjs` en wordt uitgevoerd door `scripts/check-changed.mjs`. Die lokale check-gate is strenger over architectuurgrenzen dan de brede CI-platformscope: core-productiewijzigingen voeren core-prod- en core-testtypechecks plus core-lint/guards uit, wijzigingen alleen aan core-tests voeren alleen core-testtypechecks plus core-lint uit, extensieproductiewijzigingen voeren extensie-prod- en extensie-testtypechecks plus extensie-lint uit, en wijzigingen alleen aan extensietests voeren extensie-testtypechecks plus extensie-lint uit. Wijzigingen aan de openbare Plugin SDK of plugin-contracten breiden uit naar extensietypechecks omdat extensies afhankelijk zijn van die core-contracten, maar Vitest-extensiesweeps zijn expliciet testwerk. Versiebumpen van alleen releasemetadata voeren gerichte versie-/config-/root-dependency-checks uit. Onbekende root-/configwijzigingen falen veilig naar alle check-lanes.
Lokale changed-test-routering staat in `scripts/test-projects.test-support.mjs` en
is bewust goedkoper dan `check:changed`: directe testbewerkingen draaien zichzelf,
bronbewerkingen geven de voorkeur aan expliciete mappings, daarna sibling-tests en import-graph-
afhankelijken. Gedeelde group-room delivery-configuratie is een van de expliciete mappings:
wijzigingen aan de group visible-reply-configuratie, source reply delivery mode of de
message-tool system prompt lopen via de core reply-tests plus Discord- en
Slack-delivery-regressies, zodat een gedeelde standaardwijziging faalt voordat de eerste PR
wordt gepusht. Gebruik `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` alleen wanneer de wijziging
harness-breed genoeg is dat de goedkope gemapte set geen betrouwbare proxy is.

Voor Testbox-validatie voer je uit vanaf de repo-root en geef je de voorkeur aan een vers opgewarmde box voor
breed bewijs. Voordat je een trage gate besteedt aan een box die hergebruikt is, verlopen is, of
net een onverwacht grote sync meldde, voer je eerst `pnpm testbox:sanity` uit in de
box. De sanity-check faalt snel wanneer vereiste root-bestanden zoals
`pnpm-lock.yaml` verdwenen zijn of wanneer `git status --short` minstens 200
tracked verwijderingen toont. Dat betekent meestal dat de remote sync-status geen betrouwbare
kopie van de PR is. Stop die box en warm een nieuwe op in plaats van de
producttestfout te debuggen. Stel voor opzettelijke PR's met grote verwijderingen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` in voor die sanity-run. `pnpm
testbox:run` beëindigt ook een lokale Blacksmith CLI-aanroep die langer dan vijf minuten in de
sync-fase blijft zonder post-sync-output. Stel
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` in om die guard uit te schakelen, of gebruik een grotere
millisecondewaarde voor ongewoon grote lokale diffs.

Handmatige CI-dispatches voeren `checks-node-compat-node22` uit als brede compatibiliteitsdekking. Android is opt-in voor zelfstandige handmatige CI via `include_android=true` en altijd ingeschakeld voor `Full Release Validation`. `Plugin Prerelease` is duurdere product-/pakketdekking, dus het is een aparte workflow die wordt gedispatcht door `Full Release Validation` of door een expliciete operator. Normale pull requests, pushes naar `main` en zelfstandige handmatige CI-dispatches houden die suite uitgeschakeld.

De traagste Node-testfamilies zijn gesplitst of gebalanceerd, zodat elke job klein blijft zonder runners te overreserveren: channel-contracten draaien als drie gewogen shards, kleine core-unitlanes worden gekoppeld, auto-reply draait als vier gebalanceerde workers waarbij de reply-subtree is gesplitst in agent-runner-, dispatch- en commands/state-routing-shards, en agentic gateway/plugin-configuraties worden verdeeld over de bestaande source-only agentic Node-jobs in plaats van te wachten op gebouwde artifacts. Brede browser-, QA-, media- en overige plugintests gebruiken hun toegewezen Vitest-configuraties in plaats van de gedeelde plugin-catch-all. `Plugin Prerelease` balanceert gebundelde plugintests over acht extensieworkers; die extensieshardjobs draaien maximaal twee plugin-configgroepen tegelijk met één Vitest-worker per groep en een grotere Node-heap, zodat importzware pluginbatches geen extra CI-jobs maken. De brede agents-lane gebruikt de gedeelde Vitest file-parallel scheduler omdat deze wordt gedomineerd door import/scheduling in plaats van door één traag testbestand. `runtime-config` draait met de infra core-runtime-shard om te voorkomen dat de gedeelde runtime-shard de staart bezit. Include-pattern-shards registreren timingvermeldingen met de CI-shardnaam, zodat `.artifacts/vitest-shard-timings.json` een hele config kan onderscheiden van een gefilterde shard. `check-additional` houdt package-boundary compile/canary-werk bij elkaar en scheidt runtime-topologiearchitectuur van gateway-watch-dekking; de boundary-guard-shard draait zijn kleine onafhankelijke guards gelijktijdig binnen één job. Gateway-watch, channel-tests en de core support-boundary-shard draaien gelijktijdig binnen `build-artifacts` nadat `dist/` en `dist-runtime/` al gebouwd zijn, behouden hun oude checknamen als lichte verifier-jobs en vermijden tegelijk twee extra Blacksmith-workers en een tweede artifact-consumer-wachtrij.
Android CI draait zowel `testPlayDebugUnitTest` als `testThirdPartyDebugUnitTest` en bouwt daarna de Play debug APK. De third-party flavor heeft geen aparte sourceset of manifest; zijn unit-test-lane compileert die flavor nog steeds met de SMS/call-log BuildConfig-flags, terwijl een dubbele debug APK-packagingjob bij elke Android-relevante push wordt vermeden.
GitHub kan vervangen jobs als `cancelled` markeren wanneer een nieuwere push op dezelfde PR- of `main`-ref landt. Behandel dat als CI-ruis tenzij de nieuwste run voor dezelfde ref ook faalt. Geaggregeerde shard-checks gebruiken `!cancelled() && always()`, zodat ze nog steeds normale shardfouten rapporteren, maar niet in de wachtrij komen nadat de hele workflow al is vervangen.
De automatische CI-concurrency key is versiegebonden (`CI-v7-*`), zodat een GitHub-zombie in een oude queue group nieuwere main-runs niet onbeperkt kan blokkeren. Handmatige full-suite-runs gebruiken `CI-manual-v1-*` en annuleren lopende runs niet.

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, snelle securityjobs en aggregaties (`security-scm-fast`, `security-dependency-audit`, `security-fast`), snelle protocol-/contract-/bundled-checks, gesharde channel-contract-checks, `check`-shards behalve lint, `check-additional`-shards en aggregaties, Node-testaggregate-verifiers, docs-checks, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight gebruikt ook GitHub-hosted Ubuntu zodat de Blacksmith-matrix eerder kan queueën |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lichtere extensieshards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` en `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-testshards, gebundelde plugintestshards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, die CPU-gevoelig genoeg blijft dat 8 vCPU meer kostte dan het bespaarde; install-smoke Docker-builds, waarbij 32-vCPU-wachtrijtijd meer kostte dan het bespaarde                                                                                                                                                                                                                                                                                                     |
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
