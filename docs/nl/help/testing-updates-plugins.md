---
read_when:
    - OpenClaw-update-, doctor-, pakketacceptatie- of Plugin-installatiegedrag wijzigen
    - Een release candidate voorbereiden of goedkeuren
    - Fouten opsporen bij regressies in pakketupdates, opschoning van Plugin-afhankelijkheden of Plugin-installaties
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en installatie-/updategedrag van plugins valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-06-27T17:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dit is de speciale checklist voor update- en Plugin-validatie. Het doel is
eenvoudig: bewijzen dat het installeerbare pakket echte gebruikersstatus kan
bijwerken, verouderde legacy-status via `doctor` kan repareren, en nog steeds
plugins uit de ondersteunde bronnen kan installeren, laden, bijwerken en
verwijderen.

Zie [Testen](/nl/help/testing) voor de bredere kaart van de test runner. Zie
[Live testen](/nl/help/testing-live) voor live providersleutels en suites die het
netwerk raken.

## Wat we beschermen

Update- en Plugin-tests beschermen deze contracten:

- Een pakket-tarball is compleet, heeft een geldige `dist/postinstall-inventory.json`,
  en is niet afhankelijk van uitgepakte repobestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  gaan zonder config, agents, sessies, workspaces, Plugin-allowlists of
  kanaalconfiguratie te verliezen.
- `openclaw doctor --fix --non-interactive` is eigenaar van legacy-opruim- en
  reparatiepaden. Startup mag geen verborgen compatibiliteitsmigraties voor
  verouderde Plugin-status krijgen.
- Plugin-installaties werken vanuit lokale mappen, git-repo's, npm-pakketten en
  het ClawHub-registrypad.
- Plugin npm-afhankelijkheden worden geinstalleerd in een beheerd npm-project per Plugin,
  gescand voor vertrouwen, en via npm verwijderd tijdens uninstall zodat gehesen
  afhankelijkheden niet blijven hangen.
- Plugin-update is stabiel wanneer er niets is gewijzigd: installatierecords,
  opgeloste bron, geinstalleerde afhankelijkheidslayout en ingeschakelde status
  blijven intact.

## Lokale proof tijdens ontwikkeling

Begin smal:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer voor wijzigingen aan Plugin-installatie, uninstall, afhankelijkheden of
pakket-inventory ook de gerichte tests uit die de bewerkte seam afdekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Voordat een package Docker-lane een tarball gebruikt, bewijs je het
pakketartefact:

```bash
pnpm release:check
```

`release:check` voert driftcontroles voor config/docs/API uit, schrijft de
package dist-inventory, voert `npm pack --dry-run` uit, weigert verboden
ingepakte bestanden, installeert de tarball in een tijdelijke prefix, voert
postinstall uit en rooktest gebundelde kanaal-entrypoints.

## Docker-lanes

De Docker-lanes zijn de productniveau-proof. Ze installeren of updaten een echt
pakket in Linux-containers en controleren gedrag via CLI-commando's,
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

- `test:docker:plugins` valideert Plugin-installatierooktest, lokale-mapinstallaties,
  skipgedrag voor lokale-mapupdates, lokale mappen met vooraf geinstalleerde
  afhankelijkheden, `file:`-pakketinstallaties, git-installaties met CLI-uitvoering,
  git moving-ref-updates, npm-registry-installaties met gehesen transitieve
  afhankelijkheden, npm-update-no-ops, weigering van misvormde npm-pakketmetadata,
  installaties van lokale ClawHub-fixtures en update-no-ops, marketplace-updategedrag,
  en Claude-bundle enable/inspect. Zet `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` om het
  ClawHub-blok hermetisch/offline te houden.
- `test:docker:plugin-lifecycle-matrix` installeert het kandidaatpakket in een kale
  container, voert een npm-Plugin door install, inspect, disable, enable,
  expliciete upgrade, expliciete downgrade en uninstall na het verwijderen van de
  Plugin-code. Het logt RSS- en CPU-metrics voor elke fase.
- `test:docker:plugin-update` valideert dat een ongewijzigde geinstalleerde Plugin
  niet opnieuw installeert of installatiemetadata verliest tijdens
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` installeert de kandidaat-tarball over een vuile
  old-user-fixture, voert pakketupdate plus non-interactive doctor uit, start
  daarna een loopback-Gateway en controleert statusbehoud.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde baseline,
  configureert die via een ingebakken `openclaw config set`-recept, werkt die bij
  naar de kandidaat-tarball, voert doctor uit, controleert legacy-opruiming, start
  de Gateway en probet `/healthz`, `/readyz` en RPC-status.
- `test:docker:update-restart-auth` installeert het kandidaatpakket, start een
  beheerde token-auth Gateway, wist gateway-auth-env van de caller voor
  `openclaw update --yes --json`, en vereist dat het updatecommando van de kandidaat
  de Gateway herstart voor de normale probes.
- `test:docker:update-migration` is de cleanup-zware published-update-lane. Die
  begint met een geconfigureerde Discord/Telegram-achtige gebruikersstatus, voert
  baseline-doctor uit zodat geconfigureerde Plugin-afhankelijkheden kans krijgen
  te materialiseren, seedt legacy Plugin-afhankelijkheidsresten voor een
  geconfigureerde packaged Plugin, werkt bij naar de kandidaat-tarball, en vereist
  dat post-update doctor de legacy-afhankelijkheidsroots verwijdert.

Nuttige varianten van published-upgrade survivor:

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
`stale-source-plugin-shadow`, `tilde-log-path` en `versioned-runtime-deps`. In
samengevoegde runs breidt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
uit naar alle gerapporteerde issue-vormige scenario's, inclusief de
configured-plugin-install-migratie.

Volledige updatemigratie is bewust gescheiden van Full Release CI. Gebruik de
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

## Package Acceptance

Package Acceptance is de GitHub-native pakketpoort. Het lost een kandidaatpakket
op naar een `package-under-test`-tarball, registreert versie en SHA-256, en voert
daarna herbruikbare Docker E2E-lanes uit tegen precies die tarball. De
workflow-harness-ref staat los van de pakketbron-ref, zodat huidige testlogica
oudere vertrouwde releases kan valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@beta`, `openclaw@latest` of een exacte
  gepubliceerde versie.
- `source=ref`: pak een vertrouwde branch, tag of commit met de geselecteerde
  huidige harness.
- `source=url`: valideer een publieke HTTPS-tarball met vereiste `package_sha256`.
  Dit pad weigert URL-credentials, niet-standaard HTTPS-poorten, private/interne
  hostnames of DNS/IP-resultaten, special-use IP-ruimte en onveilige redirects.
- `source=trusted-url`: valideer een HTTPS-tarball met vereiste
  `package_sha256` en `trusted_source_id` tegen het maintainer-owned beleid in
  `.github/package-trusted-sources.json`. Gebruik dit voor enterprise/private
  mirrors in plaats van `source=url` te verzwakken met een allow-private-switch
  op inputniveau. Bearer-auth gebruikt, wanneer geconfigureerd door beleid, het
  vaste `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-secret.
- `source=artifact`: hergebruik een tarball die door een andere Actions-run is
  geupload.

Full Release Validation gebruikt standaard `source=artifact`, gebouwd vanaf de
opgeloste release-SHA. Geef voor post-publish-proof
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` mee zodat dezelfde
upgradematrix in plaats daarvan het verzonden npm-pakket target.

Releasecontroles roepen Package Acceptance aan met de package/update/restart/plugin-set:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Wanneer release-soak is ingeschakeld, geven ze ook door:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dit houdt pakketmigratie, updatekanaalwisseling, tolerantie voor corrupte
managed-plugins, opruiming van verouderde Plugin-afhankelijkheden, offline
Plugin-dekking, Plugin-updategedrag en Telegram package QA op hetzelfde
opgeloste artefact zonder dat de standaard releasepakketpoort elke gepubliceerde
release doorloopt.

`last-stable-4` lost op naar de vier nieuwste stabiele npm-gepubliceerde
OpenClaw-releases. Release package acceptance pint `2026.4.23` als de eerste
compatibiliteitsgrens voor Plugin-updates, `2026.5.2` als een
Plugin-architecture churn-grens en `2026.4.15` als een oudere 2026.4.1x
published-update-baseline; de resolver dedupet pins die al in de nieuwste vier
zitten. Gebruik voor uitputtende dekking van gepubliceerde updatemigratie
`all-since-2026.4.23` in de aparte Update Migration-workflow in plaats van Full
Release CI. `release-history` blijft beschikbaar voor handmatige bredere sampling
wanneer je ook het legacy pre-date-anker wilt.

Wanneer meerdere published-upgrade survivor-baselines zijn geselecteerd, shardt
de herbruikbare Docker-workflow elke baseline naar zijn eigen gerichte runner-job.
Elke baseline-shard voert nog steeds de geselecteerde scenarioset uit, maar logs
en artefacten blijven per baseline en wall time wordt begrensd door de langzaamste
shard in plaats van een grote seriele job.

Voer handmatig een package-profiel uit wanneer je een kandidaat voor release
valideert:

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
`suite_profile=full` alleen wanneer je volledige Docker-dekking van het releasepad
nodig hebt.

## Release-standaard

Voor release candidates is de standaard proof-stack:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor integriteit van pakketartefacten.
3. Package Acceptance `package`-profiel of de custom package-lanes van
   release-check voor install/update/restart/plugin-contracten.
4. Cross-OS releasecontroles voor OS-specifiek installer-, onboarding- en
   platformgedrag.
5. Live suites alleen wanneer het gewijzigde oppervlak provider- of
   hosted-servicegedrag raakt.

Op maintainer-machines moeten brede poorten en Docker/package-productproof in
Testbox draaien, tenzij expliciet lokale proof wordt gedaan.

## Legacy-compatibiliteit

Compatibiliteitsmarge is smal en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen
  al verzonden pakketmetadatagaten in Package Acceptance tolereren.
- Het gepubliceerde `2026.4.26`-pakket mag waarschuwen voor al verzonden lokale
  buildmetadata-stampbestanden.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde gaten falen
  in plaats van te waarschuwen of over te slaan.

Voeg geen nieuwe startup-migraties toe voor deze oude vormen. Voeg een
doctor-reparatie toe of breid die uit, en bewijs die daarna met
`upgrade-survivor`, `published-upgrade-survivor` of `update-restart-auth` wanneer
het updatecommando eigenaar is van de herstart.

## Dekking toevoegen

Wanneer je update- of Plugin-gedrag wijzigt, voeg dekking toe op de laagste laag
die om de juiste reden kan falen:

- Zuivere pad- of metadatalogica: unittest naast de bron.
- Pakket-inventaris of gedrag van verpakte bestanden: `package-dist-inventory` of tarball-
  checker-test.
- CLI-installatie-/updategedrag: Docker-lane-assertie of fixture.
- Migratiegedrag voor gepubliceerde releases: `published-upgrade-survivor`-scenario.
- Herstartgedrag in eigendom van update: `update-restart-auth`.
- Registry-/pakketbrongedrag: `test:docker:plugins`-fixture of ClawHub-
  fixtureserver.
- Gedrag van afhankelijkheidsindeling of opschoning: controleer zowel runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen binnen het door de Plugin beheerde
  npm-project worden gehesen, dus tests moeten aantonen dat dat project wordt gescand/opgeschoond
  in plaats van aan te nemen dat alleen de Plugin-pakketlokale `node_modules`-boom wordt gebruikt.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixture-registries en
neppakketten, tenzij het doel van de test live registry-gedrag is.

## Foutentriage

Begin met de artefactidentiteit:

- Package Acceptance `resolve_package`-samenvatting: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lane-logs en rerun-opdrachten.
- Upgrade-survivor-samenvatting: `.artifacts/upgrade-survivor/summary.json`,
  inclusief baselineversie, kandidaatversie, scenario, fasetimings en
  receptstappen.

Geef de voorkeur aan het opnieuw uitvoeren van exact de mislukte lane met hetzelfde pakketartefact boven
het opnieuw uitvoeren van de hele release-umbrella.
