---
read_when:
    - Gedrag voor het bijwerken van OpenClaw, doctor, pakketacceptatie of de installatie van Plugins wijzigen
    - Een releasecandidate voorbereiden of goedkeuren
    - Fouten opsporen bij pakketupdates, het opschonen van Plugin-afhankelijkheden of regressies bij de installatie van Plugins
sidebarTitle: Update and plugin tests
summary: Hoe OpenClaw updatepaden, pakketmigraties en het installatie- en updategedrag van Plugins valideert
title: 'Testen: updates en plugins'
x-i18n:
    generated_at: "2026-07-12T08:58:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Checklist voor update- en Plugin-validatie: bewijs dat het installeerbare pakket
echte gebruikersstatus kan bijwerken, verouderde legacy-status via `doctor` kan
herstellen en nog steeds plugins vanuit elke ondersteunde bron kan installeren,
laden, bijwerken en verwijderen.

Zie [Testen](/nl/help/testing) voor het bredere overzicht van testrunners. Zie
[Live testen](/nl/help/testing-live) voor live providersleutels en testsuites die
het netwerk gebruiken.

## Wat we beschermen

- Een pakkettarball is compleet, bevat een geldige `dist/postinstall-inventory.json`
  en is niet afhankelijk van uitgepakte repositorybestanden.
- Een gebruiker kan van een ouder gepubliceerd pakket naar het kandidaatpakket
  overstappen zonder configuratie, agents, sessies, werkruimten,
  Plugin-toelatingslijsten of kanaalconfiguratie te verliezen.
- `openclaw doctor --fix --non-interactive` beheert paden voor het opschonen en
  herstellen van legacy-status. Bij het opstarten mogen geen verborgen
  compatibiliteitsmigraties voor verouderde Plugin-status ontstaan.
- Plugin-installaties werken vanuit lokale mappen, git-repository's, npm-pakketten
  en het ClawHub-registerpad.
- npm-afhankelijkheden van plugins worden geïnstalleerd in één beheerd npm-project
  per Plugin, vóór vertrouwen gescand en tijdens het verwijderen van de Plugin via
  `npm uninstall` verwijderd, zodat gehesen afhankelijkheden niet achterblijven.
- Een Plugin-update doet niets wanneer er niets is gewijzigd: installatierecords,
  de herleide bron, de indeling van geïnstalleerde afhankelijkheden en de
  ingeschakelde status blijven intact.

## Lokaal bewijs tijdens ontwikkeling

Begin gericht:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Voer voor wijzigingen aan de installatie, verwijdering, afhankelijkheden of
pakket-inventaris van plugins ook de gerichte tests uit die de bewerkte grens
dekken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bewijs het pakketartefact voordat een Docker-pakkettraject een tarball gebruikt:

```bash
pnpm release:check
```

`release:check` voert controles uit op afwijkingen in configuratie, documentatie
en API (configuratieschema, basislijn voor configuratiedocumentatie,
API-basislijn en exports van de Plugin-SDK, Plugin-versies/inventaris), schrijft
de pakketdistributie-inventaris, voert `npm pack --dry-run` uit, weigert verboden
ingepakte bestanden, installeert de tarball in een tijdelijk voorvoegsel, voert
postinstallatie uit en voert rooktests uit op gebundelde kanaalingangspunten.

## Docker-trajecten

De Docker-trajecten leveren het bewijs op productniveau. Ze installeren of
werken een echt pakket bij in Linux-containers en verifiëren het gedrag via
CLI-opdrachten, het opstarten van de Gateway, HTTP-controles, RPC-status en de
bestandssysteemstatus.

Gebruik gerichte trajecten tijdens het itereren:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Belangrijke trajecten:

- `test:docker:plugins` dekt rooktests voor Plugin-installatie, installaties uit
  lokale mappen, het overslaan van updates voor lokale mappen, lokale mappen met
  vooraf geïnstalleerde afhankelijkheden, installaties van `file:`-pakketten,
  git-installaties met CLI-uitvoering, git-updates van verplaatsende referenties,
  installaties uit het npm-register met gehesen transitieve afhankelijkheden,
  npm-updates die niets wijzigen, weigering van ongeldige npm-pakketmetadata,
  installaties vanuit een lokale ClawHub-fixture en updates die niets wijzigen,
  updategedrag van de marktplaats en het inschakelen/inspecteren van
  Claude-bundels. Stel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` in om het ClawHub-blok
  hermetisch/offline te houden.
- `test:docker:plugin-lifecycle-matrix` installeert het kandidaatpakket in een
  kale container en doorloopt voor een npm-Plugin installatie, inspectie,
  uitschakeling, inschakeling, expliciete upgrade, expliciete downgrade en
  verwijdering nadat de Plugincode is verwijderd. Per fase worden RSS- en
  CPU-metrieken vastgelegd.
- `test:docker:plugin-update` valideert dat een ongewijzigde geïnstalleerde Plugin
  tijdens `openclaw plugins update` niet opnieuw wordt geïnstalleerd en geen
  installatiemetadata verliest.
- `test:docker:upgrade-survivor` installeert de kandidaattarball over een vervuilde
  fixture van een oude gebruiker, voert een pakketupdate plus een niet-interactieve
  doctor uit, start vervolgens een Gateway op local loopback en controleert het
  behoud van de status.
- `test:docker:published-upgrade-survivor` installeert eerst een gepubliceerde
  basisversie, configureert die via een ingebakken `openclaw config set`-recept,
  werkt die bij naar de kandidaattarball, voert doctor uit, controleert het
  opschonen van legacy-status, start de Gateway en controleert `/healthz`,
  `/readyz` en de RPC-status.
- `test:docker:update-restart-auth` installeert het kandidaatpakket, start een
  beheerde Gateway met tokenauthenticatie, schakelt de omgevingsvariabele voor
  Gateway-authenticatie van de aanroeper uit voor
  `openclaw update --yes --json` en vereist dat de updateopdracht van het
  kandidaatpakket de Gateway opnieuw start vóór de normale controles.
- `test:docker:update-migration` is het opschoningsintensieve traject voor updates
  van gepubliceerde pakketten. Het begint met een geconfigureerde gebruikersstatus
  in Discord-/Telegram-stijl, voert de doctor van de basisversie uit zodat
  geconfigureerde Plugin-afhankelijkheden de kans krijgen om te worden
  aangemaakt, voegt legacy-resten van Plugin-afhankelijkheden toe voor een
  geconfigureerde verpakte Plugin, werkt bij naar de kandidaattarball en vereist
  dat doctor na de update de legacy-afhankelijkheidsmappen verwijdert.

Nuttige varianten voor overlevingsproeven bij gepubliceerde upgrades:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Beschikbare scenario's: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
en `versioned-runtime-deps`. Bij gecombineerde uitvoeringen wordt
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (alias `far-reaching`)
uitgebreid naar alle scenario's, inclusief de migratie voor de installatie van
geconfigureerde plugins.

De volledige updatemigratie staat bewust los van de volledige release-CI.
Gebruik de handmatige workflow `Update Migration` wanneer de releasevraag luidt:
"kan elke gepubliceerde stabiele release vanaf 2026.4.23 worden bijgewerkt naar
dit kandidaatpakket en resten van Plugin-afhankelijkheden opschonen?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Pakketacceptatie

Pakketacceptatie is de GitHub-eigen pakketpoort. Deze zet één kandidaatpakket om
in een `package-under-test`-tarball, legt versie en SHA-256 vast en voert
vervolgens herbruikbare Docker-E2E-trajecten uit tegen precies die tarball. De
referentie van de workflow-testinfrastructuur staat los van de bronreferentie
van het pakket, zodat de huidige testlogica oudere vertrouwde releases kan
valideren.

Kandidaatbronnen:

- `source=npm`: valideer `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` of een exact gepubliceerde versie.
- `source=ref`: verpak een vertrouwde branch, tag of commit met de geselecteerde
  huidige testinfrastructuur.
- `source=url`: valideer een openbare HTTPS-tarball met verplichte
  `package_sha256`. Dit pad weigert URL-aanmeldgegevens, niet-standaard
  HTTPS-poorten, privé-/interne hostnamen of DNS-/IP-resultaten, IP-ruimte voor
  speciaal gebruik en onveilige omleidingen.
- `source=trusted-url`: valideer een HTTPS-tarball met verplichte
  `package_sha256` en `trusted_source_id` aan de hand van het door beheerders
  beheerde beleid in `.github/package-trusted-sources.json`. Gebruik dit voor
  bedrijfs-/privéspiegels in plaats van `source=url` te verzwakken met een
  invoerschakelaar die privétoegang toestaat. Bearer-authenticatie gebruikt,
  wanneer die via beleid is geconfigureerd, het vaste geheim
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: hergebruik een tarball die door een andere Actions-uitvoering
  is geüpload.

Volledige releasevalidatie gebruikt standaard `source=artifact`, gebouwd vanuit
de herleide release-SHA. Geef voor bewijs na publicatie
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` door, zodat dezelfde
upgradematrix in plaats daarvan op het uitgebrachte npm-pakket is gericht.

Releasecontroles roepen Pakketacceptatie aan met de pakket-/update-/herstart-/
Plugin-set:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Wanneer het langdurig beproeven van de release is ingeschakeld (verplicht voor
`release_profile=stable` en `full`), geven ze ook het volgende door:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Hierdoor blijven pakketmigratie, het wisselen van updatekanaal, tolerantie voor
beschadigde beheerde plugins, het opschonen van verouderde
Plugin-afhankelijkheden, offline dekking van plugins, Plugin-updategedrag en
Telegram-pakketkwaliteitsborging op hetzelfde herleide artefact, zonder dat de
standaardpoort voor releasepakketten elke gepubliceerde release hoeft te
doorlopen.

`last-stable-4` wordt herleid tot de vier nieuwste stabiele, via npm
gepubliceerde OpenClaw-releases. Bij pakketacceptatie voor releases geldt
`2026.4.23` als de eerste compatibiliteitsgrens voor Plugin-updates, `2026.5.2`
als een grens voor ingrijpende wijzigingen in de Plugin-architectuur en
`2026.4.15` als een oudere basisversie voor updates van gepubliceerde versies
uit 2026.4.1x; de resolver verwijdert dubbele vastgezette versies die al tot de
nieuwste vier behoren. Gebruik voor volledige dekking van migraties van
gepubliceerde updates `all-since-2026.4.23` in de afzonderlijke workflow
Updatemigratie in plaats van in de volledige release-CI. `release-history`
blijft beschikbaar voor handmatige bredere steekproeven wanneer u ook het
legacy-ankerpunt van vóór die datum wilt meenemen.

Wanneer meerdere basisversies voor overlevingsproeven bij gepubliceerde upgrades
zijn geselecteerd, verdeelt de herbruikbare Docker-workflow elke basisversie over
een eigen gerichte runner-taak. Elke basisversieshard voert nog steeds de
geselecteerde scenarioset uit, maar logboeken en artefacten blijven per
basisversie gescheiden en de doorlooptijd wordt begrensd door de langzaamste
shard in plaats van door één grote seriële taak.

Voer handmatig een pakketprofiel uit wanneer u vóór de release een
kandidaatpakket valideert:

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

Stel voor een gepubliceerde canary met verlengde stabiliteit
`package_spec=openclaw@extended-stable` in. Pakketacceptatie zet die selector om
in een exacte tarball voordat de Docker-trajecten worden uitgevoerd.

Gebruik `suite_profile=product` wanneer de releasevraag MCP-kanalen, het opschonen
van Cron/subagents, OpenAI-webzoekopdrachten of OpenWebUI omvat. Gebruik
`suite_profile=full` alleen wanneer u volledige Docker-dekking van het
releasepad nodig hebt.

## Standaard voor releases

Voor releasekandidaten is de standaard bewijsreeks:

1. `pnpm check:changed` en `pnpm test:changed` voor regressies op bronniveau.
2. `pnpm release:check` voor de integriteit van het pakketartefact.
3. Het `package`-profiel van Pakketacceptatie of de aangepaste pakkettrajecten
   van de releasecontrole voor installatie-/update-/herstart-/Plugin-contracten.
4. Releasecontroles op meerdere besturingssystemen voor besturingssysteemspecifiek
   installatie-, onboarding- en platformgedrag.
5. Live testsuites alleen wanneer het gewijzigde oppervlak het gedrag van een
   provider of gehoste dienst raakt.

Op machines van beheerders moeten brede poorten en productbewijs voor
Docker/pakketten in Testbox worden uitgevoerd, tenzij uitdrukkelijk lokaal bewijs
wordt verzameld.

## Legacy-compatibiliteit

De soepelheid voor compatibiliteit is beperkt en tijdgebonden:

- Pakketten tot en met `2026.4.25`, inclusief `2026.4.25-beta.*`, mogen reeds
  uitgebrachte hiaten in pakketmetadata in Pakketacceptatie tolereren.
- Het gepubliceerde pakket `2026.4.26` mag waarschuwen voor reeds uitgebrachte
  stempelbestanden met lokale buildmetadata.
- Latere pakketten moeten aan moderne contracten voldoen. Dezelfde hiaten leiden
  dan tot fouten in plaats van waarschuwingen of overslaan.

Voeg voor deze oude vormen geen nieuwe opstartmigraties toe. Voeg een
doctor-reparatie toe of breid die uit en bewijs deze vervolgens met
`upgrade-survivor`, `published-upgrade-survivor` of `update-restart-auth` wanneer
de updateopdracht eigenaar is van de herstart.

## Dekking toevoegen

Voeg bij wijzigingen aan update- of Plugin-gedrag dekking toe op de laagste laag
die om de juiste reden kan mislukken:

- Zuivere pad- of metadatalogica: unit-test naast de broncode.
- Pakketinventaris of gedrag van verpakte bestanden: `package-dist-inventory` of tarball-
  controletest.
- CLI-installatie-/updategedrag: Docker-lane-assertie of fixture.
- Migratiegedrag van gepubliceerde releases: scenario `published-upgrade-survivor`.
- Door updates beheerd herstartgedrag: `update-restart-auth`.
- Gedrag van register-/pakketbronnen: fixture `test:docker:plugins` of ClawHub-
  fixtureserver.
- Gedrag van afhankelijkheidsindeling of opschoning: controleer zowel de runtime-uitvoering als de
  bestandssysteemgrens. npm-afhankelijkheden kunnen binnen het beheerde npm-project van de Plugin
  naar een hoger niveau worden verplaatst, dus tests moeten aantonen dat dit project wordt gescand/opgeschoond
  in plaats van ervan uit te gaan dat alleen de Plugin-pakketlokale `node_modules`-structuur wordt gebruikt.

Houd nieuwe Docker-fixtures standaard hermetisch. Gebruik lokale fixtureregisters en
neppakketten, tenzij het doel van de test het gedrag van een live register is.

## Fouttriage

Begin met de artefactidentiteit:

- Samenvatting van `resolve_package` voor pakketacceptatie: bron, versie, SHA-256 en
  artefactnaam.
- Docker-artefacten: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, lanelogboeken en opdrachten voor opnieuw uitvoeren.
- Samenvatting van upgrade-overleving: `.artifacts/upgrade-survivor/summary.json`,
  inclusief basisversie, kandidaatversie, scenario, fasetijden en
  dekking van configuratierecepten.

Geef de voorkeur aan het opnieuw uitvoeren van exact de mislukte lane met hetzelfde pakketartefact boven
het opnieuw uitvoeren van de volledige overkoepelende release.
