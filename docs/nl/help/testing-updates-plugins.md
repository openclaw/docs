---
read_when:
    - Gedrag voor OpenClaw-updates, doctor, pakketacceptatie of Plugin-installatie wijzigen
    - Een releasekandidaat voorbereiden of goedkeuren
    - Fouten opsporen bij pakketupdates, opschoning van Plugin-afhankelijkheden of regressies bij Plugin-installaties
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en Plugin-installatie-/updategedrag valideert
title: 'Testen: updates en Plugins'
x-i18n:
    generated_at: "2026-05-02T20:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de speciale checklist voor update- en Plugin-validatie. Het doel is
eenvoudig: aantonen dat het installeerbare pakket echte gebruikersstatus kan bijwerken, verouderde
legacy-status via `doctor` kan repareren, en nog steeds
Plugins uit de ondersteunde bronnen kan installeren, laden, bijwerken en verwijderen.

Zie [Testen](/nl/help/testing) voor de bredere kaart van test-runners. Zie [Live testen](/nl/help/testing-live) voor live provider-
sleutels en suites die het netwerk raken.

## Wat we beschermen

Update- en Plugin-tests beschermen deze contracten:

- Een pakket-tarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repo-bestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket overstappen
  zonder config, agents, sessies, werkruimten, Plugin-allowlists of
  kanaalconfig te verliezen.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opschoning en reparatie-
  paden. Startup mag geen verborgen compatibiliteitsmigraties voor verouderde
  Plugin-status krijgen.
- Plugin-installaties werken vanuit lokale mappen, git-repo's, npm-pakketten en het
  ClawHub-registrypad.
- Plugin npm-afhankelijkheden worden geinstalleerd in de beheerde npm-root, gescand voor
  vertrouwen, en via npm verwijderd tijdens de-installatie zodat gehoiste afhankelijkheden niet
  blijven hangen.
- Plugin-update is stabiel wanneer er niets is gewijzigd: installatierecords, opgeloste
  bron, geinstalleerde afhankelijkheidslayout en ingeschakelde status blijven intact.

## Lokale bewijslast tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer voor wijzigingen aan Plugin-installatie, de-installatie, afhankelijkheden of pakket-inventaris ook
de gerichte tests uit die de bewerkte scheidslijn dekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bewijs het pakketartefact voordat een pakket-Docker-lane een tarball gebruikt:

```bash
pnpm release:check
```

`release:check` voert config/docs/API-driftcontroles uit, schrijft de package dist-
inventory, voert `npm pack --dry-run` uit, weigert verboden ingepakte bestanden, installeert
de tarball in een tijdelijke prefix, voert postinstall uit, en smoke-test gebundelde kanaal-
entrypoints.

## Docker-lanes

De Docker-lanes zijn het bewijs op productniveau. Ze installeren of updaten een echt
pakket in Linux-containers en controleren gedrag via CLI-opdrachten,
Gateway-startup, HTTP-probes, RPC-status en bestandssysteemstatus.

Gebruik gerichte lanes tijdens iteratie:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Belangrijke lanes:

- `test:docker:plugins` valideert Plugin-installatie-smoke, lokale-mapinstallaties,
  overslaggedrag bij lokale-mapupdates, lokale mappen met vooraf geinstalleerde
  afhankelijkheden, `file:`-pakketinstallaties, git-installaties met CLI-uitvoering, git
  moving-ref-updates, npm-registerinstallaties met gehoiste transitieve
  afhankelijkheden, npm-update-no-ops, lokale ClawHub-fixture-installaties en update-
  no-ops, marketplace-updategedrag, en Claude-bundel inschakelen/inspecteren. Stel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok hermetisch/offline te houden.
- `test:docker:plugin-update` valideert dat een ongewijzigde geinstalleerde Plugin
  niet opnieuw installeert of installatiemetadata verliest tijdens `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaat-tarball over een vuile
  oude-gebruiker-fixture, voert pakketupdate plus niet-interactieve doctor uit, start daarna
  een loopback-Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde baseline,
  configureert die via een ingebakken `openclaw config set`-recept, werkt die bij naar de
  kandidaat-tarball, voert doctor uit, controleert legacy-opschoning, start de Gateway, en
  probeert `/healthz`, `/readyz` en RPC-status.
- `test:docker:update-migration` is de opschoningszware gepubliceerde-update-lane. Hij
  start vanuit een geconfigureerde Discord/Telegram-achtige gebruikersstatus, voert baseline
  doctor uit zodat geconfigureerde Plugin-afhankelijkheden kans hebben om te materialiseren, seedt
  legacy-Plugin-afhankelijkheidsresten voor een geconfigureerde verpakte Plugin, werkt bij naar
  de kandidaat-tarball, en vereist dat post-update doctor de legacy
  afhankelijkheidsroots verwijdert.

Nuttige varianten voor published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Beschikbare scenario's zijn `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` en
`versioned-runtime-deps`. In aggregaatruns wordt
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` uitgebreid naar alle gerapporteerde
issue-vormige scenario's, inclusief de geconfigureerde Plugin-installatiemigratie.

Volledige updatemigratie staat bewust los van Full Release CI. Gebruik de
handmatige `Update Migration`-workflow wanneer de releasevraag is "kan elke
gepubliceerde stabiele release vanaf 2026.4.23 naar deze kandidaat updaten en
Plugin-afhankelijkheidsresten opschonen?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance is de GitHub-native pakketpoort. Het lost een kandidaat-
pakket op naar een `package-under-test`-tarball, registreert versie en SHA-256, en
voert daarna herbruikbare Docker E2E-lanes uit tegen die exacte tarball. De workflow-harness
ref staat los van de pakketbron-ref, zodat huidige testlogica oudere vertrouwde
releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest` of een exacte
  gepubliceerde versie.
- `source=ref`: pak een vertrouwde branch, tag of commit in met de geselecteerde huidige
  harness.
- `source=url`: valideer een HTTPS-tarball met vereiste `package_sha256`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is geupload.

Full Release Validation gebruikt standaard `source=artifact`, gebouwd vanaf de
opgeloste release-SHA. Geef voor bewijs na publicatie
`package_acceptance_package_spec=openclaw@YYYY.M.D` door, zodat dezelfde upgradematrix
het verzonden npm-pakket target.

Releasecontroles roepen Package Acceptance aan met de package/update/plugin-set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ze geven ook door:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt pakketmigratie, schakelen van updatekanaal, opschoning van verouderde Plugin-afhankelijkheden,
offline Plugin-dekking, Plugin-updategedrag en Telegram-pakket-
QA op hetzelfde opgeloste artefact.

`all-since-2026.4.23` is de Full Release CI-upgradesample: elke stabiele npm-gepubliceerde release van `2026.4.23` tot en met `latest`. Gebruik voor uitputtende
dekking van gepubliceerde updatemigratie `all-since-2026.4.23` in de afzonderlijke Update
Migration-workflow in plaats van Full Release CI. `release-history` blijft
beschikbaar voor handmatige bredere sampling wanneer je ook het legacy pre-date
anker wilt.

Voer handmatig een package-profiel uit bij het valideren van een kandidaat voor release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Gebruik `suite_profile=product` wanneer de releasevraag MCP-kanalen,
cron/subagent-opschoning, OpenAI-webzoekopdrachten of OpenWebUI omvat. Gebruik `suite_profile=full`
alleen wanneer je volledige Docker-dekking van het releasepad nodig hebt.

## Release-standaard

Voor releasekandidaten is de standaard bewijsstack:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor integriteit van pakketartefacten.
3. Package Acceptance `package`-profiel of de release-check aangepaste pakket-
   lanes voor install/update/Plugin-contracten.
4. Cross-OS releasecontroles voor OS-specifieke installer-, onboarding- en platform-
   gedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of hosted-service-
   gedrag raakt.

Op maintainer-machines moeten brede gates en Docker-/pakketproductbewijs in
Testbox draaien, tenzij expliciet lokaal bewijs wordt geleverd.

## Legacy-compatibiliteit

Compatibiliteitstolerantie is smal en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen
  reeds verzonden hiaten in pakketmetadata in Package Acceptance tolereren.
- Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor lokale buildmetadatastempel-
  bestanden die al zijn verzonden.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde hiaten falen in plaats van
  waarschuwen of overslaan.

Voeg geen nieuwe startup-migraties toe voor deze oude vormen. Voeg een doctor-
reparatie toe of breid die uit, en bewijs die daarna met `upgrade-survivor` of `published-upgrade-survivor`.

## Dekking toevoegen

Wanneer je update- of Plugin-gedrag wijzigt, voeg dekking toe op de laagste laag die
om de juiste reden kan falen:

- Pure pad- of metadatalogica: unittest naast de bron.
- Pakket-inventaris of gedrag van ingepakte bestanden: `package-dist-inventory` of tarball-
  checkertest.
- CLI-install/updategedrag: Docker-lane-assertie of fixture.
- Gepubliceerde-release-migratiegedrag: `published-upgrade-survivor`-scenario.
- Register-/pakketbrongedrag: `test:docker:plugins`-fixture of ClawHub-
  fixture-server.
- Gedrag rond afhankelijkheidslayout of opschoning: controleer zowel runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen worden gehoist onder de beheerde npm-
  root, dus tests moeten bewijzen dat de root wordt gescand/opgeschoond in plaats van uit te gaan van een
  pakketlokale `node_modules`-boom.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixture-registers en
neppakketten, tenzij live-registergedrag het punt van de test is.

## Fouttriage

Begin met de artefactidentiteit:

- Package Acceptance `resolve_package`-samenvatting: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane-logs en heruitvoeropdrachten.
- Upgrade survivor-samenvatting: `.artifacts/upgrade-survivor/summary.json`,
  inclusief baselineversie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Geef de voorkeur aan het opnieuw uitvoeren van de exact mislukte lane met hetzelfde pakketartefact boven
het opnieuw uitvoeren van de hele releasekoepel.
