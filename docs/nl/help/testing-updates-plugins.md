---
read_when:
    - OpenClaw-update-, doctor-, pakketacceptatie- of Plugin-installatiegedrag wijzigen
    - Een releasekandidaat voorbereiden of goedkeuren
    - Foutopsporing bij pakketupdates, opschoning van Plugin-afhankelijkheden of regressies bij Plugin-installatie
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en Plugin-installatie- en updategedrag valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-05-05T06:18:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de speciale checklist voor update- en pluginvalidatie. Het doel is
eenvoudig: bewijzen dat het installeerbare pakket echte gebruikersstatus kan bijwerken, verouderde
legacy-status via `doctor` kan herstellen, en nog steeds
plugins uit de ondersteunde bronnen kan installeren, laden, bijwerken en verwijderen.

Zie [Testen](/nl/help/testing) voor de bredere test-runnerkaart. Zie [Live testen](/nl/help/testing-live) voor live provider-
sleutels en suites die het netwerk raken.

## Wat we beschermen

Update- en plugintests beschermen deze contracten:

- Een pakkettarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repobestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  gaan zonder config, agents, sessies, werkruimten, plugin-allowlists of
  kanaalconfiguratie te verliezen.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opruiming en herstelpaden.
  Startup mag geen verborgen compatibiliteitsmigraties voor verouderde
  pluginstatus krijgen.
- Plugininstallaties werken vanuit lokale directories, git-repo's, npm-pakketten en het
  ClawHub-registerpad.
- npm-afhankelijkheden van plugins worden geïnstalleerd in de beheerde npm-root, gescand vóór
  vertrouwen, en tijdens verwijdering via npm verwijderd zodat gehoiste afhankelijkheden niet
  achterblijven.
- Pluginupdate is stabiel wanneer er niets is gewijzigd: installatierecords, opgeloste
  bron, geïnstalleerde afhankelijkheidsindeling en ingeschakelde status blijven intact.

## Lokaal bewijs tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer bij wijzigingen in plugininstallatie, verwijdering, afhankelijkheden of pakket-inventaris ook
de gerichte tests uit die de bewerkte seam dekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bewijs het pakketartefact voordat een pakket-Docker-lane een tarball gebruikt:

```bash
pnpm release:check
```

`release:check` voert driftcontroles voor config/docs/API uit, schrijft de package dist
inventory, voert `npm pack --dry-run` uit, wijst verboden verpakte bestanden af, installeert
de tarball in een tijdelijke prefix, voert postinstall uit, en smoketest gebundelde
kanaal-entrypoints.

## Docker-lanes

De Docker-lanes zijn het productniveau-bewijs. Ze installeren of updaten een echt
pakket binnen Linux-containers en controleren gedrag via CLI-opdrachten,
Gateway-startup, HTTP-probes, RPC-status en bestandssysteemstatus.

Gebruik gerichte lanes tijdens itereren:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Belangrijke lanes:

- `test:docker:plugins` valideert plugininstallatie-smoke, lokale mapinstallaties,
  skipgedrag voor lokale mapupdates, lokale mappen met vooraf geïnstalleerde
  afhankelijkheden, `file:`-pakketinstallaties, git-installaties met CLI-uitvoering, git
  moving-ref-updates, npm-registerinstallaties met gehoiste transitieve
  afhankelijkheden, npm-update-no-ops, lokale ClawHub-fixture-installaties en update
  no-ops, marketplace-updategedrag, en Claude-bundle inschakelen/inspecteren. Stel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok hermetisch/offline te houden.
- `test:docker:plugin-lifecycle-matrix` installeert het kandidaatpakket in een kale
  container, voert een npm-plugin door install, inspect, disable, enable,
  expliciete upgrade, expliciete downgrade en uninstall na het verwijderen van de plugin-
  code. Het logt RSS- en CPU-metrics voor elke fase.
- `test:docker:plugin-update` valideert dat een ongewijzigde geïnstalleerde plugin
  niet opnieuw installeert of installatiemetadata verliest tijdens `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaattarball over een vuile
  old-user-fixture, voert pakketupdate plus non-interactive doctor uit, start daarna
  een local loopback Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde baseline,
  configureert die via een ingebakken `openclaw config set`-recept, werkt die bij naar de
  kandidaattarball, voert doctor uit, controleert legacy-opruiming, start de Gateway en
  probet `/healthz`, `/readyz` en RPC-status.
- `test:docker:update-restart-auth` installeert het kandidaatpakket, start een
  beheerde token-auth Gateway, maakt caller gateway auth env leeg voor
  `openclaw update --yes --json`, en vereist dat de updateopdracht van de kandidaat de
  Gateway herstart vóór de normale probes.
- `test:docker:update-migration` is de cleanup-zware published-update-lane. Hij
  begint met een geconfigureerde Discord/Telegram-achtige gebruikersstatus, voert baseline
  doctor uit zodat geconfigureerde plugin-afhankelijkheden kans krijgen te materialiseren, seedt
  legacy plugin-afhankelijkheidsresten voor een geconfigureerde packaged plugin, werkt bij naar
  de kandidaattarball, en vereist dat post-update doctor de legacy
  afhankelijkheidsroots verwijdert.

Nuttige published-upgrade survivor-varianten:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Beschikbare scenario's zijn `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` en `versioned-runtime-deps`. In aggregate runs
wordt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` uitgebreid naar alle gerapporteerde
issue-vormige scenario's, inclusief de configured-plugin install-migratie.

Volledige update-migratie staat bewust los van Full Release CI. Gebruik de
handmatige `Update Migration`-workflow wanneer de releasevraag is "kan elke
gepubliceerde stabiele release vanaf 2026.4.23 updaten naar deze kandidaat en
plugin-afhankelijkheidsresten opruimen?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance is de GitHub-native pakketgate. Het lost één kandidaat-
pakket op naar een `package-under-test`-tarball, registreert versie en SHA-256, en
voert daarna herbruikbare Docker E2E-lanes uit tegen precies die tarball. De workflow-harness
ref staat los van de pakketbron-ref, zodat actuele testlogica oudere vertrouwde
releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest` of een exacte
  gepubliceerde versie.
- `source=ref`: pack een vertrouwde branch, tag of commit met de geselecteerde actuele
  harness.
- `source=url`: valideer een HTTPS-tarball met vereiste `package_sha256`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is geüpload.

Full Release Validation gebruikt standaard `source=artifact`, gebouwd vanaf de
opgeloste release-SHA. Geef voor post-publish-bewijs
`package_acceptance_package_spec=openclaw@YYYY.M.D` door zodat dezelfde upgrade-matrix
in plaats daarvan het verzonden npm-pakket target.

Releasechecks roepen Package Acceptance aan met de package/update/restart/plugin-set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Wanneer release soak is ingeschakeld, geven ze ook door:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt pakketmigratie, updatekanaalwisseling, opruiming van verouderde plugin-afhankelijkheden,
offline plugindekking, plugin-updategedrag en Telegram-pakket-
QA op hetzelfde opgeloste artefact zonder de standaard release-pakketgate
elke gepubliceerde release te laten doorlopen.

`last-stable-4` lost op naar de vier nieuwste stabiele npm-gepubliceerde OpenClaw-
releases. Release package acceptance pint `2026.4.23` als de eerste compatibiliteitsgrens
voor pluginupdates, `2026.5.2` als grens voor pluginarchitectuur-churn, en
`2026.4.15` als een oudere 2026.4.1x published-update-baseline; de resolver
dedupliceert pins die al in de nieuwste vier zitten. Gebruik voor exhaustieve dekking van
published update migration `all-since-2026.4.23` in de aparte Update
Migration-workflow in plaats van Full Release CI. `release-history` blijft
beschikbaar voor handmatige bredere sampling wanneer je ook de legacy pre-date
anchor wilt.

Wanneer meerdere published-upgrade survivor-baselines zijn geselecteerd, shardt de herbruikbare
Docker-workflow elke baseline in een eigen gerichte runner-job. Elke
baseline-shard voert nog steeds de geselecteerde scenarioset uit, maar logs en artefacten blijven
per baseline en de wall time wordt begrensd door de langzaamste shard in plaats van één grote
seriële job.

Voer handmatig een pakketprofiel uit bij het valideren van een kandidaat vóór release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Gebruik `suite_profile=product` wanneer de releasevraag MCP-kanalen,
cron/subagent-opruiming, OpenAI-webzoekopdrachten of OpenWebUI omvat. Gebruik `suite_profile=full`
alleen wanneer je volledige Docker-dekking van releasepaden nodig hebt.

## Release-standaard

Voor release candidates is de standaard bewijsstack:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor integriteit van pakketartefacten.
3. Package Acceptance `package`-profiel of de release-check aangepaste pakket-
   lanes voor install/update/restart/plugin-contracten.
4. Cross-OS-releasechecks voor OS-specifieke installer-, onboarding- en platform-
   gedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of hosted-service-
   gedrag raakt.

Op maintainer-machines moeten brede gates en Docker/package-productbewijs in
Testbox draaien, tenzij er expliciet lokaal bewijs wordt uitgevoerd.

## Legacy-compatibiliteit

Compatibiliteitstolerantie is smal en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen
  reeds verzonden gaten in pakketmetadata in Package Acceptance tolereren.
- Het gepubliceerde pakket `2026.4.26` mag waarschuwen voor lokale buildmetadata-stempel-
  bestanden die al zijn verzonden.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde gaten falen in plaats van
  te waarschuwen of over te slaan.

Voeg geen nieuwe startup-migraties toe voor deze oude vormen. Voeg een doctor-
herstel toe of breid het uit, en bewijs het daarna met `upgrade-survivor`, `published-upgrade-survivor` of
`update-restart-auth` wanneer de updateopdracht eigenaar is van de restart.

## Dekking toevoegen

Wanneer je update- of plugingedrag wijzigt, voeg dekking toe op de laagste laag die
om de juiste reden kan falen:

- Pure pad- of metadatalogica: unit test naast de bron.
- Pakket-inventaris of gedrag van verpakte bestanden: `package-dist-inventory` of tarball-
  checkertest.
- CLI-install/updategedrag: Docker-lane-assertie of fixture.
- Published-release-migratiegedrag: `published-upgrade-survivor`-scenario.
- Update-eigen restartgedrag: `update-restart-auth`.
- Register-/pakketbrongedrag: `test:docker:plugins`-fixture of ClawHub-
  fixture-server.
- Gedrag voor afhankelijkheidsindeling of opruiming: assert zowel runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen onder de beheerde npm-
  root worden gehoist, dus tests moeten bewijzen dat de root wordt gescand/opgeruimd in plaats van een
  package-local `node_modules`-boom aan te nemen.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixture-registers en
neppakketten tenzij live registergedrag het doel van de test is.

## Fouttriage

Begin met de artefactidentiteit:

- Samenvatting van Package Acceptance `resolve_package`: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane-logboeken en opdrachten om opnieuw uit te voeren.
- Samenvatting van upgradesurvivor: `.artifacts/upgrade-survivor/summary.json`,
  inclusief basislijnversie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Voer bij voorkeur de exacte mislukte lane opnieuw uit met hetzelfde pakketartefact
in plaats van de volledige release-overkoepeling opnieuw uit te voeren.
