---
read_when:
    - Gedrag wijzigen voor OpenClaw-updates, diagnose, pakketacceptatie of Plugin-installatie
    - Een releasekandidaat voorbereiden of goedkeuren
    - Fouten opsporen bij pakketupdates, opschoning van Plugin-afhankelijkheden of regressies bij Plugin-installatie
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en installatie-/updategedrag van Plugins valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-05-03T11:11:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de specifieke checklist voor update- en Plugin-validatie. Het doel is
eenvoudig: aantonen dat het installeerbare pakket echte gebruikersstatus kan
bijwerken, verouderde legacy-status via `doctor` kan herstellen, en nog steeds
Plugins uit de ondersteunde bronnen kan installeren, laden, bijwerken en
verwijderen.

Zie [Testen](/nl/help/testing) voor de bredere kaart van de testrunner. Zie
[Live testen](/nl/help/testing-live) voor live provider-sleutels en suites die het
netwerk raken.

## Wat we beschermen

Update- en Plugin-tests beschermen deze contracten:

- Een pakkettarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repo-bestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  gaan zonder config, agents, sessies, werkruimten, Plugin-toestaanlijsten of
  kanaalconfiguratie te verliezen.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opruim- en
  herstelpaden. Opstarten mag geen verborgen compatibiliteitsmigraties voor
  verouderde Plugin-status krijgen.
- Plugin-installaties werken vanuit lokale mappen, git-repo's, npm-pakketten en
  het ClawHub-registerpad.
- Plugin-npm-afhankelijkheden worden in de beheerde npm-root geïnstalleerd,
  vóór vertrouwen gescand, en tijdens verwijderen via npm verwijderd zodat
  gehesen afhankelijkheden niet blijven hangen.
- Plugin-update is stabiel wanneer er niets is gewijzigd: installatierecords,
  opgeloste bron, geïnstalleerde afhankelijkheidsindeling en ingeschakelde
  status blijven intact.

## Lokaal bewijs tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer voor wijzigingen aan Plugin-installatie, verwijderen, afhankelijkheden of
pakket-inventaris ook de gerichte tests uit die de bewerkte naad afdekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bewijs het pakketartefact voordat een Docker-baan voor pakketten een tarball
gebruikt:

```bash
pnpm release:check
```

`release:check` voert driftcontroles voor config/docs/API uit, schrijft de
pakketdist-inventaris, voert `npm pack --dry-run` uit, weigert verboden ingepakte
bestanden, installeert de tarball in een tijdelijk prefix, voert postinstall uit
en rooktest gebundelde kanaal-entrypoints.

## Docker-banen

De Docker-banen zijn het productniveau-bewijs. Ze installeren of werken een echt
pakket bij binnen Linux-containers en controleren gedrag via CLI-opdrachten,
Gateway-opstart, HTTP-probes, RPC-status en bestandssysteemstatus.

Gebruik gerichte banen tijdens iteratie:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Belangrijke banen:

- `test:docker:plugins` valideert rooktests voor Plugin-installatie, installaties
  uit lokale mappen, update-overslaggedrag voor lokale mappen, lokale mappen met
  vooraf geïnstalleerde afhankelijkheden, `file:`-pakketinstallaties,
  git-installaties met CLI-uitvoering, updates van bewegende git-referenties,
  npm-registerinstallaties met gehesen transitieve afhankelijkheden,
  npm-update-no-ops, lokale ClawHub-fixture-installaties en update-no-ops,
  marketplace-updategedrag, en Claude-bundel inschakelen/inspecteren. Stel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok hermetisch/offline te
  houden.
- `test:docker:plugin-lifecycle-matrix` installeert het kandidaatpakket in een
  kale container, voert een npm-Plugin door install, inspect, disable, enable,
  expliciete upgrade, expliciete downgrade en uninstall na het verwijderen van
  de Plugin-code. Het logt RSS- en CPU-metrics voor elke fase.
- `test:docker:plugin-update` valideert dat een ongewijzigde geïnstalleerde
  Plugin niet opnieuw installeert of installatiemetadata verliest tijdens
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaattarball over een vieze
  oude-gebruiker-fixture, voert pakketupdate plus niet-interactieve doctor uit,
  start daarna een local loopback Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde
  baseline, configureert die via een ingebakken `openclaw config set`-recept,
  werkt die bij naar de kandidaattarball, voert doctor uit, controleert
  legacy-opruiming, start de Gateway en probet `/healthz`, `/readyz` en
  RPC-status.
- `test:docker:update-migration` is de opruimzware gepubliceerd-update-baan. Die
  start vanuit een geconfigureerde Discord/Telegram-achtige gebruikersstatus,
  voert baseline-doctor uit zodat geconfigureerde Plugin-afhankelijkheden de
  kans krijgen te materialiseren, seedt legacy-Plugin-afhankelijkheidsresten voor
  een geconfigureerde verpakte Plugin, werkt bij naar de kandidaattarball, en
  vereist dat post-update-doctor de legacy-afhankelijkheidsroots verwijdert.

Handige varianten voor gepubliceerd-upgrade-overlever:

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
`versioned-runtime-deps`. In geaggregeerde runs breidt
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` uit naar alle scenario's
in de vorm van gemelde issues, inclusief de migratie voor geconfigureerde
Plugin-installatie.

Volledige updatemigratie staat bewust los van volledige release-CI. Gebruik de
handmatige `Update Migration`-workflow wanneer de releasevraag is: "kan elke
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

Pakketacceptatie is de GitHub-native pakketpoort. Het lost één kandidaatpakket
op naar een `package-under-test`-tarball, registreert versie en SHA-256, en voert
daarna herbruikbare Docker-E2E-banen uit tegen precies die tarball. De
workflow-harnasreferentie staat los van de pakketbronreferentie, zodat huidige
testlogica oudere vertrouwde releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest` of een exacte
  gepubliceerde versie.
- `source=ref`: pak een vertrouwde branch, tag of commit met het geselecteerde
  huidige harnas.
- `source=url`: valideer een HTTPS-tarball met vereiste `package_sha256`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is
  geüpload.

Volledige releasevalidatie gebruikt standaard `source=artifact`, gebouwd vanuit
de opgeloste release-SHA. Geef voor bewijs na publicatie
`package_acceptance_package_spec=openclaw@YYYY.M.D` mee, zodat dezelfde
upgradematrix in plaats daarvan het verzonden npm-pakket target.

Releasecontroles roepen Pakketacceptatie aan met de pakket/update/Plugin-set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ze geven ook door:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt pakketmigratie, updatekanaalwisseling, opruiming van verouderde
Plugin-afhankelijkheden, offline Plugin-dekking, Plugin-updategedrag en
Telegram-pakket-QA op hetzelfde opgeloste artefact.

`all-since-2026.4.23` is de upgrade-steekproef van volledige release-CI: elke
stabiele npm-gepubliceerde release van `2026.4.23` tot en met `latest`. Gebruik
voor uitputtende gepubliceerde updatemigratiedekking `all-since-2026.4.23` in de
aparte Update Migration-workflow in plaats van volledige release-CI.
`release-history` blijft beschikbaar voor handmatige bredere steekproeven
wanneer je ook het legacy-anker van vóór die datum wilt.

Voer handmatig een pakketprofiel uit bij het valideren van een kandidaat vóór
release:

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
cron/subagent-opruiming, OpenAI-webzoekopdrachten of OpenWebUI omvat. Gebruik
`suite_profile=full` alleen wanneer je volledige Docker-dekking van het
releasepad nodig hebt.

## Release-standaard

Voor releasekandidaten is de standaard bewijsstack:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor integriteit van pakketartefacten.
3. Pakketacceptatie-`package`-profiel of de aangepaste pakketbanen van
   releasecontrole voor installatie/update/Plugin-contracten.
4. Cross-OS-releasecontroles voor OS-specifieke installer-, onboarding- en
   platformgedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of
   gehoste-servicegedrag raakt.

Op maintainer-machines horen brede poorten en Docker/pakket-productbewijs in
Testbox te draaien, tenzij expliciet lokaal bewijs wordt uitgevoerd.

## Legacy-compatibiliteit

Compatibiliteitstolerantie is smal en tijdsgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen reeds
  verzonden pakketmetadatagaten in Pakketacceptatie tolereren.
- Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor reeds verzonden
  stempelbestanden met lokale buildmetadata.
- Latere pakketten moeten voldoen aan moderne contracten. Dezelfde gaten falen
  in plaats van te waarschuwen of over te slaan.

Voeg geen nieuwe opstartmigraties toe voor deze oude vormen. Voeg een
doctor-herstel toe of breid er een uit, en bewijs dat vervolgens met
`upgrade-survivor` of `published-upgrade-survivor`.

## Dekking toevoegen

Wanneer je update- of Plugin-gedrag wijzigt, voeg dekking toe op de laagst
mogelijke laag die om de juiste reden kan falen:

- Pure pad- of metadatalogica: unit-test naast de bron.
- Pakketinventaris- of ingepakt-bestand-gedrag: `package-dist-inventory`- of
  tarball-checkertest.
- CLI-installatie/updategedrag: Docker-baanassertie of fixture.
- Migratiegedrag voor gepubliceerde releases: `published-upgrade-survivor`-scenario.
- Register-/pakketbrongedrag: `test:docker:plugins`-fixture of
  ClawHub-fixtureserver.
- Afhankelijkheidsindeling of opruimgedrag: assert zowel runtime-uitvoering als
  de bestandssysteemgrens. npm-afhankelijkheden kunnen onder de beheerde npm-root
  worden gehesen, dus tests moeten bewijzen dat de root wordt gescand/opgeruimd
  in plaats van uit te gaan van een pakketlokale `node_modules`-boom.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale
fixture-registers en neppakketten, tenzij het doel van de test live
registergedrag is.

## Faaltriage

Begin met de artefactidentiteit:

- Pakketacceptatie-`resolve_package`-samenvatting: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, baanlogs en herhaalopdrachten.
- Upgrade-overlever-samenvatting: `.artifacts/upgrade-survivor/summary.json`,
  inclusief baselineversie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Geef de voorkeur aan het opnieuw uitvoeren van de exact gefaalde baan met
hetzelfde pakketartefact boven het opnieuw uitvoeren van de hele releaseparaplu.
