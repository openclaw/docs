---
read_when:
    - Gedrag voor OpenClaw-updates, doctor, pakketacceptatie of Plugin-installatie wijzigen
    - Een releasekandidaat voorbereiden of goedkeuren
    - Foutopsporing voor pakketupdates, het opschonen van Plugin-afhankelijkheden of regressies bij Plugin-installaties
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en Plugin-installatie-/updategedrag valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-05-05T01:47:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de specifieke checklist voor update- en Plugin-validatie. Het doel is
eenvoudig: bewijzen dat het installeerbare pakket echte gebruikersstatus kan
bijwerken, verouderde legacy-status via `doctor` kan herstellen, en nog steeds
Plugins uit de ondersteunde bronnen kan installeren, laden, bijwerken en
verwijderen.

Zie [Testen](/nl/help/testing) voor de bredere kaart van de test runner. Zie
[Live testen](/nl/help/testing-live) voor live provider-sleutels en suites die het
netwerk raken.

## Wat we beschermen

Update- en Plugin-tests beschermen deze contracten:

- Een package tarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repo-bestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  overstappen zonder config, agents, sessies, workspaces, Plugin-allowlists of
  kanaalconfig kwijt te raken.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opruim- en
  herstelpaden. Startup mag geen verborgen compatibiliteitsmigraties voor
  verouderde Plugin-status krijgen.
- Plugin-installaties werken vanuit lokale directories, git-repo's, npm-pakketten
  en het ClawHub-registerpad.
- npm-afhankelijkheden van Plugins worden geïnstalleerd in de beheerde npm-root,
  gescand vóór vertrouwen, en via npm verwijderd tijdens uninstall zodat gehesen
  afhankelijkheden niet achterblijven.
- Plugin-update is stabiel wanneer er niets is gewijzigd: installatierecords,
  opgeloste bron, geïnstalleerde dependency-layout en ingeschakelde status blijven
  intact.

## Lokaal bewijs tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer bij wijzigingen in Plugin-installatie, uninstall, afhankelijkheden of
package-inventory ook de gerichte tests uit die de bewerkte naad dekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bewijs het package artifact voordat een package Docker-lane een tarball gebruikt:

```bash
pnpm release:check
```

`release:check` voert config/docs/API-driftcontroles uit, schrijft de package dist
inventory, voert `npm pack --dry-run` uit, wijst verboden verpakte bestanden af,
installeert de tarball in een tijdelijke prefix, voert postinstall uit en smookt
gebundelde kanaal-entrypoints.

## Docker-lanes

De Docker-lanes zijn het productniveau-bewijs. Ze installeren of updaten een echt
pakket binnen Linux-containers en verifiëren gedrag via CLI-commando's,
Gateway-startup, HTTP-probes, RPC-status en bestandssysteemstatus.

Gebruik gerichte lanes tijdens iteratie:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Belangrijke lanes:

- `test:docker:plugins` valideert Plugin-installatiesmoke, lokale mapinstallaties,
  overslaggedrag bij lokale mapupdates, lokale mappen met vooraf geïnstalleerde
  afhankelijkheden, `file:`-package-installaties, git-installaties met
  CLI-uitvoering, git moving-ref-updates, npm-registerinstallaties met gehesen
  transitieve afhankelijkheden, npm-update-no-ops, lokale ClawHub-fixture-installaties
  en update-no-ops, marketplace-updategedrag, en Claude-bundle enable/inspect. Stel
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok hermetisch/offline te houden.
- `test:docker:plugin-lifecycle-matrix` installeert het kandidaatpakket in een kale
  container, voert een npm-Plugin door install, inspect, disable, enable,
  expliciete upgrade, expliciete downgrade en uninstall na het verwijderen van de
  Plugin-code. Het logt RSS- en CPU-metrics voor elke fase.
- `test:docker:plugin-update` valideert dat een ongewijzigde geïnstalleerde Plugin
  niet opnieuw installeert en geen installatiemetadata verliest tijdens `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaat-tarball over een vuile
  fixture van een oude gebruiker, voert package update plus non-interactive doctor uit,
  start daarna een loopback Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde baseline,
  configureert die via een ingebakken `openclaw config set`-recept, werkt die bij naar de
  kandidaat-tarball, voert doctor uit, controleert legacy-opruiming, start de Gateway en
  probet `/healthz`, `/readyz` en RPC-status.
- `test:docker:update-migration` is de opruimingszware published-update-lane. Deze
  start vanuit een geconfigureerde Discord/Telegram-achtige gebruikersstatus, voert
  baseline doctor uit zodat geconfigureerde Plugin-afhankelijkheden de kans krijgen te
  materialiseren, seedt legacy Plugin-dependency-rommel voor een geconfigureerde
  packaged Plugin, werkt bij naar de kandidaat-tarball en vereist dat post-update doctor
  de legacy dependency-roots verwijdert.

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
wordt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` uitgebreid naar alle
gerapporteerde issue-vormige scenario's, inclusief de configured-plugin-install-migratie.

Volledige update-migratie staat bewust los van Full Release CI. Gebruik de
handmatige `Update Migration`-workflow wanneer de releasevraag is: "kan elke
gepubliceerde stabiele release vanaf 2026.4.23 naar deze kandidaat updaten en
Plugin-dependency-rommel opruimen?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance is de GitHub-native package gate. Het lost één kandidaatpakket
op naar een `package-under-test`-tarball, registreert versie en SHA-256, en voert
daarna herbruikbare Docker E2E-lanes uit tegen exact die tarball. De workflow
harness ref staat los van de package source ref, zodat huidige testlogica oudere
vertrouwde releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest` of een exacte
  gepubliceerde versie.
- `source=ref`: pak een vertrouwde branch, tag of commit met de geselecteerde huidige
  harness.
- `source=url`: valideer een HTTPS-tarball met vereiste `package_sha256`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is geüpload.

Full Release Validation gebruikt standaard `source=artifact`, gebouwd vanuit de
opgeloste release-SHA. Geef voor post-publish-bewijs
`package_acceptance_package_spec=openclaw@YYYY.M.D` door zodat dezelfde upgrade-matrix
in plaats daarvan het verzonden npm-pakket target.

Releasecontroles roepen Package Acceptance aan met de package/update/Plugin-set:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Ze geven ook dit door:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt package-migratie, update channel switching, opschoning van verouderde
Plugin-afhankelijkheden, offline Plugin-dekking, Plugin-updategedrag en Telegram
package QA op hetzelfde opgeloste artifact.

`all-since-2026.4.23` is de Full Release CI-upgrade-sample: elke stabiele npm-gepubliceerde release van `2026.4.23` tot en met `latest`. Gebruik voor uitputtende gepubliceerde
update-migratiedekking `all-since-2026.4.23` in de aparte Update
Migration-workflow in plaats van Full Release CI. `release-history` blijft
beschikbaar voor handmatige bredere sampling wanneer je ook de legacy pre-date
anchor wilt.

Voer handmatig een package-profiel uit bij het valideren van een kandidaat vóór release:

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
cron/subagent-opruiming, OpenAI web search of OpenWebUI omvat. Gebruik
`suite_profile=full` alleen wanneer je volledige Docker release-path-dekking nodig hebt.

## Release-standaard

Voor release candidates is de standaard bewijsstack:

1. `pnpm check:changed` en `pnpm test:changed` voor source-level regressies.
2. `pnpm release:check` voor package artifact-integriteit.
3. Package Acceptance `package`-profiel of de release-check custom package
   lanes voor install/update/Plugin-contracten.
4. Cross-OS release checks voor OS-specifieke installer, onboarding en platformgedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of hosted-service-gedrag raakt.

Op maintainer-machines moeten brede gates en Docker/package-productbewijs in
Testbox draaien, tenzij er expliciet lokaal bewijs wordt geleverd.

## Legacy-compatibiliteit

Compatibiliteitscoulance is smal en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen
  al verzonden package-metadatahiaten in Package Acceptance tolereren.
- Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor al verzonden lokale
  build metadata stamp-bestanden.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde hiaten falen
  in plaats van waarschuwen of overslaan.

Voeg geen nieuwe startup-migraties toe voor deze oude vormen. Voeg een
doctor-herstel toe of breid er een uit, en bewijs dat daarna met `upgrade-survivor`
of `published-upgrade-survivor`.

## Dekking toevoegen

Wanneer je update- of Plugin-gedrag wijzigt, voeg dekking toe op de laagste laag
die om de juiste reden kan falen:

- Pure pad- of metadatalogica: unit test naast de source.
- Package inventory- of packed-file-gedrag: `package-dist-inventory`- of tarball
  checker-test.
- CLI-install/update-gedrag: Docker-lane-assertion of fixture.
- Published-release-migratiegedrag: `published-upgrade-survivor`-scenario.
- Register/package source-gedrag: `test:docker:plugins`-fixture of ClawHub
  fixture server.
- Dependency-layout- of opruimgedrag: assert zowel runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen onder de beheerde npm-root
  worden gehesen, dus tests moeten bewijzen dat de root wordt gescand/opgeruimd
  in plaats van een package-local `node_modules`-boom aan te nemen.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixture-registers
en neppakketten, tenzij live registergedrag het doel van de test is.

## Fouttriage

Begin met de artifact-identiteit:

- Package Acceptance `resolve_package`-samenvatting: source, versie, SHA-256 en
  artifact-naam.
- Docker-artifacts: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane logs en rerun-commando's.
- Upgrade survivor-samenvatting: `.artifacts/upgrade-survivor/summary.json`,
  inclusief baseline-versie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Geef de voorkeur aan het opnieuw uitvoeren van de exact gefaalde lane met hetzelfde
package artifact boven het opnieuw uitvoeren van de hele releaseparaplu.
