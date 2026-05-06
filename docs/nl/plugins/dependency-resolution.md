---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstarten van de Plugin, doctor-gedrag of installatiegedrag van de pakketbeheerder
    - Je onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-06T17:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw houdt Plugin-afhankelijkheidswerk bij installatie- en updatetijd. Runtime laden
voert geen package managers uit, repareert geen afhankelijkheidsstructuren en wijzigt de OpenClaw
packagedirectory niet.

## Verdeling van verantwoordelijkheden

Plugin-packages zijn eigenaar van hun afhankelijkheidsgrafiek:

- runtime-afhankelijkheden staan in de Plugin-package `dependencies` of
  `optionalDependencies`
- SDK/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkelplugins leveren hun eigen al geinstalleerde afhankelijkheden mee
- npm- en git-plugins worden geinstalleerd in package-roots die eigendom zijn van OpenClaw

OpenClaw bezit alleen de Plugin-levenscyclus:

- de Plugin-bron ontdekken
- de package installeren of updaten wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het Plugin-entrypoint laden
- falen met een uitvoerbare fout wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-packages installeren onder `~/.openclaw/npm`
- git-packages klonen onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsreparatie

npm-installaties worden uitgevoerd in de npm-root met:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt diezelfde beheerde npm-root
voor een lokale npm-pack-tarball. OpenClaw leest de npm-metadata van de tarball, voegt deze
toe aan de beheerde root als een gekopieerde `file:`-afhankelijkheid, voert de normale npm-installatie uit,
en verifieert daarna de geinstalleerde lockfile-metadata voordat de Plugin wordt vertrouwd.
Dit is bedoeld voor package-acceptance en bewijs voor release candidates waarbij een
lokaal pack-artefact zich moet gedragen zoals het registry-artefact dat het simuleert.

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
de Plugin-package. OpenClaw scant de beheerde npm-root voordat de
installatie wordt vertrouwd en gebruikt npm om door npm beheerde packages te verwijderen tijdens uninstall, zodat gehoiste
runtime-afhankelijkheden binnen de beheerde opschoningsgrens blijven.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als peer
dependency. OpenClaw laat npm geen aparte registry-kopie van de
host-package in de beheerde root installeren, omdat verouderde host-packages de npm
peer-resolutie tijdens latere Plugin-installaties kunnen beinvloeden. In plaats daarvan bevestigt OpenClaw,
nadat npm klaar is met het wijzigen van de gedeelde root tijdens install, update of uninstall,
opnieuw Plugin-lokale `node_modules/openclaw`-links voor geinstalleerde packages die
de host-peer declareren.

git-installaties klonen of vernieuwen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geinstalleerde Plugin laadt daarna vanuit die packagedirectory, zodat package-lokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als voor een normale
Node-package.

## Lokale plugins

Lokale plugins worden behandeld als door ontwikkelaars beheerde directories. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsreparatie voor ze uit. Als een lokale
Plugin afhankelijkheden heeft, installeer die dan in die Plugin voordat je deze laadt.

TypeScript-lokale plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-plugins en gebundelde interne plugins laden via native
import/require in plaats van Jiti.

## Opstarten en herladen

Gateway-opstart en config-herladen installeren nooit Plugin-afhankelijkheden. Ze lezen
de Plugin-installatierecords, berekenen het entrypoint en laden dit.

Als een afhankelijkheid tijdens runtime ontbreekt, laadt de Plugin niet en moet de fout
de operator naar een expliciete oplossing verwijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan verouderde door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en herstel uitvoeren voor
downloadbare plugins die ontbreken in de lokale installatierecords wanneer config
ernaar verwijst. Doctor repareert geen afhankelijkheden voor een al geinstalleerde
lokale Plugin.

## Gebundelde plugins

Lichtgewicht en core-kritieke gebundelde plugins worden meegeleverd als onderdeel van OpenClaw.
Ze moeten ofwel geen zware runtime-afhankelijkheidsstructuur hebben, of worden verplaatst naar een
downloadbare package op ClawHub/npm.

Voor de huidige gegenereerde lijst met plugins die in de core-package worden meegeleverd, extern
worden geinstalleerd of alleen als bron blijven bestaan, zie [Plugin-inventaris](/nl/plugins/plugin-inventory).

Gebundelde Plugin-manifests mogen geen afhankelijkheidsstaging aanvragen. Grote of optionele
Plugin-functionaliteit moet worden verpakt als een normale Plugin en worden geinstalleerd via
hetzelfde npm/git/ClawHub-pad als plugins van derden.

In source checkouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde plugins vanuit `extensions/<id>`, zodat package-lokale
workspace-afhankelijkheden beschikbaar zijn en bewerkingen direct worden opgepikt. Ontwikkeling vanuit een source
checkout is alleen pnpm; gewone `npm install` in de repository-root is
geen ondersteunde manier om gebundelde Plugin-afhankelijkheden voor te bereiden.

| Installatievorm                 | Locatie van gebundelde Plugin         | Eigenaar van afhankelijkheden                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtimestructuur in de package | OpenClaw-package en expliciete Plugin-install/update/doctor-flows     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace-packages  | De pnpm-workspace, inclusief de eigen afhankelijkheden van elke Plugin-package |
| `openclaw plugins install ...`   | Beheerde npm/git/ClawHub-Plugin-root  | De Plugin-install/update-flow                                        |

## Verouderde opschoning

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde plugins bij het opstarten of
tijdens doctor-reparatie. De huidige doctor-opschoning verwijdert die verouderde directories en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots, globale
Node-prefix-package-symlinks die wijzen naar gesnoeide `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifests, gegenereerde Plugin-`node_modules`, installatie-
stagingdirectories en package-lokale pnpm-stores. Packaged postinstall verwijdert ook
die globale symlinks voordat de verouderde doelroots worden gesnoeid, zodat upgrades
geen hangende ESM-package-imports achterlaten.

Deze paden zijn alleen verouderde resten. Nieuwe installaties mogen ze niet aanmaken.
