---
read_when:
    - Gedrag voor OpenClaw-update, doctor, pakketacceptatie of Plugin-installatie wijzigen
    - Een releasecandidate voorbereiden of goedkeuren
    - Foutopsporing voor pakketupdates, het opschonen van Plugin-afhankelijkheden of regressies bij Plugin-installatie
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en Plugin-installatie-/updategedrag valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-05-06T09:17:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de specifieke checklist voor update- en Plugin-validatie. Het doel is
eenvoudig: bewijzen dat het installeerbare pakket echte gebruikersstatus kan
bijwerken, verouderde legacy-status via `doctor` kan repareren, en nog steeds
plugins uit de ondersteunde bronnen kan installeren, laden, bijwerken en
verwijderen.

Voor de bredere kaart van testrunners, zie [Testen](/nl/help/testing). Voor live
provider-sleutels en suites die het netwerk raken, zie [Live testen](/nl/help/testing-live).

## Wat we beschermen

Update- en Plugin-tests beschermen deze contracten:

- Een pakkettarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repobestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  overstappen zonder config, agents, sessies, workspaces, Plugin-allowlists of
  kanaalconfig te verliezen.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opruiming en
  reparatiepaden. Startup mag geen verborgen compatibiliteitsmigraties krijgen
  voor verouderde Plugin-status.
- Plugin-installaties werken vanuit lokale mappen, git-repo's, npm-pakketten en
  het registerpad van ClawHub.
- npm-afhankelijkheden van Plugins worden geïnstalleerd in de beheerde npm-root,
  vóór trust gescand, en tijdens deïnstallatie via npm verwijderd zodat gehesen
  afhankelijkheden niet blijven hangen.
- Plugin-update is stabiel wanneer er niets is gewijzigd: installatierecords,
  opgeloste bron, geïnstalleerde afhankelijkheidslayout en ingeschakelde status
  blijven intact.

## Lokaal bewijs tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer voor wijzigingen aan Plugin-installatie, deïnstallatie, afhankelijkheden of
pakket-inventaris ook de gerichte tests uit die de bewerkte overgang afdekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Voordat een pakket-Docker-lane een tarball gebruikt, bewijs je het pakketartefact:

```bash
pnpm release:check
```

`release:check` voert driftcontroles voor config/docs/API uit, schrijft de
pakketdist-inventaris, voert `npm pack --dry-run` uit, weigert verboden
ingepakte bestanden, installeert de tarball in een tijdelijke prefix, voert
postinstall uit en rooktest gebundelde kanaal-entrypoints.

## Docker-lanes

De Docker-lanes zijn het bewijs op productniveau. Ze installeren of updaten een
echt pakket in Linux-containers en controleren gedrag via CLI-opdrachten,
Gateway-startup, HTTP-probes, RPC-status en bestandssysteemstatus.

Gebruik gerichte lanes tijdens iteratie:

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

- `test:docker:plugins` valideert rooktests voor Plugin-installatie, lokale mapinstallaties,
  oversla-gedrag bij lokale mapupdates, lokale mappen met vooraf geïnstalleerde
  afhankelijkheden, `file:`-pakketinstallaties, git-installaties met CLI-uitvoering,
  git-updates voor bewegende refs, npm-registerinstallaties met gehesen transitieve
  afhankelijkheden, npm-update-no-ops, lokale ClawHub-fixture-installaties en
  update-no-ops, marketplace-updategedrag en Claude-bundel inschakelen/inspecteren. Stel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok hermetisch/offline te houden.
- `test:docker:plugin-lifecycle-matrix` installeert het kandidaatpakket in een kale
  container, voert een npm-Plugin door installatie, inspectie, uitschakelen, inschakelen,
  expliciete upgrade, expliciete downgrade en deïnstallatie na het verwijderen van de
  Plugin-code. Het logt RSS- en CPU-metrics voor elke fase.
- `test:docker:plugin-update` valideert dat een ongewijzigde geïnstalleerde Plugin niet
  opnieuw installeert of installatiemetadata verliest tijdens `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaat-tarball over een vuile
  oude-gebruiker-fixture, voert pakketupdate plus niet-interactieve doctor uit, start
  daarna een local loopback-Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde baseline,
  configureert die via een ingebakken `openclaw config set`-recept, werkt die bij naar de
  kandidaat-tarball, voert doctor uit, controleert legacy-opruiming, start de Gateway en
  probet `/healthz`, `/readyz` en RPC-status.
- `test:docker:update-restart-auth` installeert het kandidaatpakket, start een beheerde
  token-auth Gateway, unset de auth-env van de caller-Gateway voor
  `openclaw update --yes --json`, en vereist dat de kandidaat-updateopdracht de Gateway
  herstart vóór de normale probes.
- `test:docker:update-migration` is de opruimingszware published-update-lane. Deze begint
  vanuit een geconfigureerde gebruikersstatus in Discord/Telegram-stijl, voert baseline
  doctor uit zodat geconfigureerde Plugin-afhankelijkheden een kans krijgen om te ontstaan,
  seedt legacy-Plugin-afhankelijkheidsresten voor een geconfigureerde verpakte Plugin,
  werkt bij naar de kandidaat-tarball, en vereist dat post-update doctor de legacy
  afhankelijkheidsroots verwijdert.

Nuttige published-upgrade-survivor-varianten:

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
`stale-source-plugin-shadow`, `tilde-log-path` en `versioned-runtime-deps`. In geaggregeerde runs
breidt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` uit naar alle
gerapporteerde issue-vormige scenario's, inclusief de geconfigureerde
Plugin-installatiemigratie.

Volledige updatemigratie is bewust gescheiden van Full Release CI. Gebruik de
handmatige workflow `Update Migration` wanneer de releasevraag is: "kan elke
gepubliceerde stabiele release vanaf 2026.4.23 bijwerken naar deze kandidaat en
Plugin-afhankelijkheidsresten opruimen?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Pakketacceptatie

Pakketacceptatie is de GitHub-native pakketgate. Deze lost één kandidaatpakket
op naar een `package-under-test`-tarball, legt versie en SHA-256 vast, en voert
daarna herbruikbare Docker-E2E-lanes uit tegen exact die tarball. De workflow-harness-ref
staat los van de pakketbron-ref, zodat huidige testlogica oudere vertrouwde
releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest` of een exacte
  gepubliceerde versie.
- `source=ref`: pak een vertrouwde branch, tag of commit in met de geselecteerde
  huidige harness.
- `source=url`: valideer een HTTPS-tarball met verplichte `package_sha256`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is
  geüpload.

Full Release Validation gebruikt standaard `source=artifact`, gebouwd vanuit de
opgeloste release-SHA. Geef voor post-publish-bewijs
`package_acceptance_package_spec=openclaw@YYYY.M.D` mee, zodat dezelfde
upgradematrix in plaats daarvan het verzonden npm-pakket target.

Releasecontroles roepen Pakketacceptatie aan met de pakket/update/herstart/Plugin-set:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Wanneer release-soak is ingeschakeld, geven ze ook door:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt pakketmigratie, wisselen van updatekanaal, tolerantie voor corrupte
beheerde Plugins, opruiming van verouderde Plugin-afhankelijkheden, offline
Plugin-dekking, Plugin-updategedrag en Telegram-pakket-QA op hetzelfde opgeloste
artefact, zonder dat de standaard releasepakketgate elke gepubliceerde release
doorloopt.

`last-stable-4` lost op naar de vier nieuwste stabiele npm-gepubliceerde
OpenClaw-releases. Releasepakketacceptatie pint `2026.4.23` als de eerste
compatibiliteitsgrens voor Plugin-updates, `2026.5.2` als grens voor churn in de
Plugin-architectuur, en `2026.4.15` als een oudere published-update-baseline van
2026.4.1x; de resolver dedupliceert pins die al in de nieuwste vier zitten. Voor
uitputtende dekking van gepubliceerde updatemigratie gebruik je
`all-since-2026.4.23` in de afzonderlijke Update Migration-workflow in plaats van
Full Release CI. `release-history` blijft beschikbaar voor handmatige bredere
sampling wanneer je ook het legacy-anker van vóór de datum wilt.

Wanneer meerdere published-upgrade-survivor-baselines zijn geselecteerd, shardt
de herbruikbare Docker-workflow elke baseline in een eigen gerichte runner-job.
Elke baseline-shard voert nog steeds de geselecteerde scenarioset uit, maar logs
en artefacten blijven per baseline en de wandkloktijd wordt begrensd door de
traagste shard in plaats van één grote seriële job.

Voer handmatig een pakketprofiel uit wanneer je vóór release een kandidaat valideert:

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
cron/subagent-opruiming, OpenAI-webzoekopdrachten of OpenWebUI omvat. Gebruik
`suite_profile=full` alleen wanneer je volledige Docker-dekking van het
releasepad nodig hebt.

## Release-standaard

Voor releasekandidaten is de standaard bewijsstack:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor integriteit van pakketartefacten.
3. Pakketacceptatie met het `package`-profiel of de aangepaste release-check-pakketlanes
   voor install/update/herstart/Plugin-contracten.
4. Cross-OS-releasecontroles voor OS-specifieke installer-, onboarding- en
   platformgedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of
   hosted-service-gedrag raakt.

Op maintainer-machines moeten brede gates en Docker/pakket-productbewijs in
Testbox draaien, tenzij expliciet lokaal bewijs wordt gedaan.

## Legacy-compatibiliteit

Compatibiliteitstolerantie is smal en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen
  al verzonden hiaten in pakketmetadata in Pakketacceptatie tolereren.
- Het gepubliceerde pakket `2026.4.26` mag waarschuwen voor al verzonden
  stampbestanden met lokale buildmetadata.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde hiaten falen
  in plaats van te waarschuwen of over te slaan.

Voeg geen nieuwe startupmigraties toe voor deze oude vormen. Voeg een doctor-reparatie
toe of breid die uit, en bewijs die daarna met `upgrade-survivor`,
`published-upgrade-survivor` of `update-restart-auth` wanneer de updateopdracht
eigenaar is van de herstart.

## Dekking toevoegen

Wanneer je update- of Plugin-gedrag wijzigt, voeg je dekking toe op de laagste
laag die om de juiste reden kan falen:

- Pure pad- of metadatalogica: unit-test naast de bron.
- Pakket-inventaris of packed-file-gedrag: `package-dist-inventory` of
  tarball-checkertest.
- CLI-install/updategedrag: Docker-lane-assertie of fixture.
- Migratiegedrag van gepubliceerde releases: `published-upgrade-survivor`-scenario.
- Update-eigen herstartgedrag: `update-restart-auth`.
- Register-/pakketbrongedrag: `test:docker:plugins`-fixture of ClawHub-fixture-server.
- Afhankelijkheidslayout of opruimgedrag: assert zowel runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen onder de beheerde npm-root
  worden gehesen, dus tests moeten bewijzen dat de root wordt gescand/opgeruimd
  in plaats van uit te gaan van een pakketlokale `node_modules`-boom.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixture-registers
en neppakketten, tenzij live registergedrag het punt van de test is.

## Fouttriage

Begin met de artefactidentiteit:

- Samenvatting van Pakketacceptatie `resolve_package`: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane-logboeken en rerun-opdrachten.
- Samenvatting van upgrade-survivor: `.artifacts/upgrade-survivor/summary.json`,
  inclusief baselineversie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Geef de voorkeur aan het opnieuw uitvoeren van de exacte mislukte lane met hetzelfde pakketartefact boven
het opnieuw uitvoeren van de volledige releaseparaplu.
