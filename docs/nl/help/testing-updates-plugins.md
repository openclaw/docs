---
read_when:
    - OpenClaw-update-, doctor-, pakketacceptatie- of Plugin-installatiegedrag wijzigen
    - Een releasekandidaat voorbereiden of goedkeuren
    - Fouten opsporen bij pakketupdates, opschoning van Plugin-afhankelijkheden of regressies bij Plugin-installatie
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en Plugin-installatie-/updategedrag valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-05-02T11:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de specifieke checklist voor update- en Plugin-validatie. Het doel is
eenvoudig: bewijzen dat het installeerbare pakket echte gebruikersstatus kan bijwerken, verouderde
legacy-status via `doctor` kan repareren, en nog steeds Plugins uit de ondersteunde
bronnen kan installeren, laden, bijwerken en verwijderen.

Zie [Testen](/nl/help/testing) voor de bredere kaart van test runners. Zie [Live testen](/nl/help/testing-live)
voor live providersleutels en suites die het netwerk gebruiken.

## Wat we beschermen

Update- en Plugintests beschermen deze contracten:

- Een pakkettarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repobestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  overstappen zonder config, agents, sessies, werkruimten, Plugin-toelatingslijsten of
  kanaalconfiguratie te verliezen.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opruim- en reparatiepaden.
  Startup mag geen verborgen compatibiliteitsmigraties voor verouderde
  Plugin-status krijgen.
- Plugininstallaties werken vanuit lokale mappen, git-repo's, npm-pakketten en het
  ClawHub-registrypad.
- Plugin-npm-afhankelijkheden worden geïnstalleerd in de beheerde npm-root, vóór
  vertrouwen gescand, en tijdens verwijderen via npm verwijderd zodat gehesen afhankelijkheden
  niet blijven hangen.
- Plugin-update is stabiel wanneer niets is gewijzigd: installatierecords, opgeloste
  bron, geïnstalleerde afhankelijkheidslayout en ingeschakelde status blijven intact.

## Lokaal bewijs tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voor wijzigingen in Plugininstallatie, verwijderen, afhankelijkheden of pakketinventaris voer je ook
de gerichte tests uit die de bewerkte aansluiting dekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bewijs het pakketartefact voordat een Docker-lane voor pakketten een tarball gebruikt:

```bash
pnpm release:check
```

`release:check` voert controles op config/docs/API-drift uit, schrijft de package dist
inventory, voert `npm pack --dry-run` uit, weigert verboden ingepakte bestanden, installeert
de tarball in een tijdelijke prefix, voert postinstall uit, en voert smokes uit op gebundelde
kanaalentrypoints.

## Docker-lanes

De Docker-lanes zijn het productniveau-bewijs. Ze installeren of updaten een echt
pakket binnen Linux-containers en controleren gedrag via CLI-commando's,
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

- `test:docker:plugins` valideert Plugininstallatie-smoke, lokale-mapinstallaties,
  skipgedrag bij lokale-mapupdates, lokale mappen met vooraf geïnstalleerde
  afhankelijkheden, `file:`-pakketinstallaties, git-installaties met CLI-uitvoering, git
  moving-ref-updates, npm-registerinstallaties met gehesen transitieve
  afhankelijkheden, npm-update-no-ops, lokale ClawHub-fixture-installaties en update
  no-ops, marketplace-updategedrag, en Claude-bundle inschakelen/inspecteren. Stel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok hermetisch/offline te houden.
- `test:docker:plugin-update` valideert dat een ongewijzigde geïnstalleerde Plugin
  niet opnieuw installeert of installatiemetadata verliest tijdens `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaattarball over een vuile
  old-user-fixture, voert pakketupdate plus niet-interactieve doctor uit, start daarna
  een loopback-Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde baseline,
  configureert die via een ingebakken `openclaw config set`-recept, werkt die bij naar de
  kandidaattarball, voert doctor uit, controleert legacy-opruiming, start de Gateway, en
  probet `/healthz`, `/readyz` en RPC-status.
- `test:docker:update-migration` is de cleanup-zware published-update-lane. Die
  begint met een geconfigureerde Discord/Telegram-achtige gebruikersstatus, voert baseline
  doctor uit zodat geconfigureerde Plugin-afhankelijkheden de kans krijgen te materialiseren, zaait
  legacy-Plugin-afhankelijkheidsresten voor een geconfigureerde verpakte Plugin, werkt bij naar
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
`plugin-deps-cleanup`, `tilde-log-path` en `versioned-runtime-deps`. In aggregate-runs
wordt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` uitgebreid naar alle gerapporteerde
issue-vormige scenario's.

Volledige update-migratie is bewust gescheiden van Full Release CI. Gebruik de
handmatige `Update Migration`-workflow wanneer de releasevraag is: "kan elke
gepubliceerde stabiele release vanaf 2026.4.23 updaten naar deze kandidaat en
Plugin-afhankelijkheidsresten opruimen?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance is de GitHub-native pakketgate. Het lost één kandidaatpakket
op naar een `package-under-test`-tarball, registreert versie en SHA-256, en voert daarna
herbruikbare Docker E2E-lanes uit tegen exact die tarball. De workflow-harness
ref staat los van de pakketbron-ref, zodat huidige testlogica oudere vertrouwde
releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest`, of een exacte
  gepubliceerde versie.
- `source=ref`: pak een vertrouwde branch, tag of commit met de geselecteerde huidige
  harness.
- `source=url`: valideer een HTTPS-tarball met verplichte `package_sha256`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is geüpload.

Releasecontroles roepen Package Acceptance aan met de package/update/plugin-set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ze geven ook door:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt pakketmigratie, updatekanaal-switching, opruiming van verouderde Plugin-afhankelijkheden,
offline Plugindekking, Plugin-updategedrag en Telegram-pakket-QA op hetzelfde
opgeloste artefact.

`release-history` is een begrensde release-check-steekproef: de laatste zes stabiele releases,
`2026.4.23`, en één oudere pre-date-anker. Gebruik voor uitputtende published update
migration-dekking `all-since-2026.4.23` in de aparte Update Migration-workflow
in plaats van Full Release CI.

Voer handmatig een pakketprofiel uit wanneer je een kandidaat vóór release valideert:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Gebruik `suite_profile=product` wanneer de releasevraag MCP-kanalen,
cron/subagent-opruiming, OpenAI-webzoekopdrachten of OpenWebUI omvat. Gebruik `suite_profile=full`
alleen wanneer je volledige Docker-releasepaddekking nodig hebt.

## Release-standaard

Voor releasekandidaten is de standaard bewijsstack:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor integriteit van pakketartefacten.
3. Package Acceptance `package`-profiel of de release-check aangepaste pakket-
   lanes voor install/update/Plugin-contracten.
4. Cross-OS-releasecontroles voor OS-specifieke installer-, onboarding- en platformgedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of gehoste-servicegedrag
   raakt.

Op maintainer-machines moeten brede gates en Docker-/pakketproductbewijs in
Testbox draaien, tenzij expliciet lokaal bewijs wordt geleverd.

## Legacy-compatibiliteit

Compatibiliteitstolerantie is smal en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen
  al verscheepte pakketmetadatahiaten in Package Acceptance tolereren.
- Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor local build metadata stamp
  files die al zijn verscheept.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde hiaten falen in plaats van
  waarschuwen of overslaan.

Voeg geen nieuwe startup-migraties toe voor deze oude vormen. Voeg een doctor-
reparatie toe of breid die uit, en bewijs die daarna met `upgrade-survivor` of
`published-upgrade-survivor`.

## Dekking toevoegen

Wanneer je update- of Plugingedrag wijzigt, voeg je dekking toe op de laagste laag die
om de juiste reden kan falen:

- Pure pad- of metadatalogica: unit test naast de bron.
- Pakketinventaris of packed-file-gedrag: `package-dist-inventory` of tarball-
  checker-test.
- CLI-install/updategedrag: Docker-lane-assertie of fixture.
- Published-release-migratiegedrag: `published-upgrade-survivor`-scenario.
- Register-/pakketbrongedrag: `test:docker:plugins`-fixture of ClawHub-
  fixture-server.
- Afhankelijkheidslayout of opruimgedrag: controleer zowel runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen worden gehesen onder de beheerde npm-
  root, dus tests moeten bewijzen dat de root wordt gescand/opgeruimd in plaats van uit te gaan van een
  package-local `node_modules`-boom.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixture-registers en
neppakketten, tenzij het doel van de test live registergedrag is.

## Fouttriage

Begin met de artefactidentiteit:

- Package Acceptance `resolve_package`-samenvatting: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane-logs en rerun-commando's.
- Upgrade survivor-samenvatting: `.artifacts/upgrade-survivor/summary.json`,
  inclusief baselineversie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Geef de voorkeur aan het opnieuw uitvoeren van de exacte gefaalde lane met hetzelfde pakketartefact boven
het opnieuw uitvoeren van de hele releaseparaplu.
