---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van Plugins, doctor of het installatiegedrag van de pakketbeheerder
    - Je onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-06T09:24:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-afhankelijkheidsresolutie

OpenClaw houdt werk aan plugin-afhankelijkheden bij installatie-/updatetijd. Runtime-laden
voert geen pakketbeheerders uit, herstelt geen afhankelijkheidsbomen en muteert de OpenClaw-
pakketdirectory niet.

## Verdeling van verantwoordelijkheden

Plugin-pakketten beheren hun eigen afhankelijkheidsgrafiek:

- runtime-afhankelijkheden staan in de plugin-pakket-`dependencies` of
  `optionalDependencies`
- SDK-/core-imports zijn peer- of door OpenClaw geleverde imports
- lokale ontwikkelplugins brengen hun eigen al geinstalleerde afhankelijkheden mee
- npm- en git-plugins worden geinstalleerd in door OpenClaw beheerde pakketroots

OpenClaw beheert alleen de plugin-levenscyclus:

- de plugin-bron ontdekken
- het pakket installeren of updaten wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het plugin-entrypoint laden
- falen met een bruikbare foutmelding wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-pakketten installeren onder `~/.openclaw/npm`
- git-pakketten klonen onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsherstel

npm-installaties draaien in de npm-root met:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt diezelfde beheerde npm-root
voor een lokale npm-pack-tarball. OpenClaw leest de npm-metadata van de tarball, voegt die
toe aan de beheerde root als een gekopieerde `file:`-afhankelijkheid, voert de normale npm-installatie uit,
en verifieert daarna de geinstalleerde lockfile-metadata voordat de plugin wordt vertrouwd.
Dit is bedoeld voor pakketacceptatie- en releasecandidate-bewijs waarbij een
lokaal pack-artefact zich moet gedragen als het registry-artefact dat het simuleert.

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
het plugin-pakket. OpenClaw scant de beheerde npm-root voordat de
installatie wordt vertrouwd en gebruikt npm om npm-beheerde pakketten te verwijderen tijdens uninstall, zodat gehoiste
runtime-afhankelijkheden binnen de beheerde opschoningsgrens blijven.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als peer-
afhankelijkheid. OpenClaw laat npm geen aparte registry-kopie van het
hostpakket installeren in de beheerde root, omdat verouderde hostpakketten npm-
peerresolutie kunnen beinvloeden tijdens latere plugin-installaties. In plaats daarvan bevestigt OpenClaw,
nadat npm klaar is met het muteren van de gedeelde root tijdens installatie, update of uninstall,
opnieuw plugin-lokale `node_modules/openclaw`-links voor geinstalleerde pakketten die
de host-peer declareren.

git-installaties klonen of verversen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geinstalleerde plugin laadt daarna vanuit die pakketdirectory, zodat pakketlokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als voor een normaal
Node-pakket.

## Lokale plugins

Lokale plugins worden behandeld als door ontwikkelaars beheerde directories. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsherstel voor ze uit. Als een lokale
plugin afhankelijkheden heeft, installeer die dan in die plugin voordat je hem laadt.

Lokale TypeScript-plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-plugins en gebundelde interne plugins laden via native
import/require in plaats van via Jiti.

## Opstarten en herladen

Gateway-opstart en configuratieherladen installeren nooit plugin-afhankelijkheden. Ze lezen
de plugin-installatierecords, berekenen het entrypoint en laden het.

Als een afhankelijkheid ontbreekt tijdens runtime, kan de plugin niet laden en moet de foutmelding
de operator naar een expliciete oplossing wijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan oude door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en herstel uitvoeren voor
downloadbare plugins die ontbreken in de lokale installatierecords wanneer de configuratie
ernaar verwijst. Doctor herstelt geen afhankelijkheden voor een al geinstalleerde
lokale plugin.

## Gebundelde plugins

Lichtgewicht en core-kritieke gebundelde plugins worden meegeleverd als onderdeel van OpenClaw.
Ze mogen geen zware runtime-afhankelijkheidsboom hebben, of moeten worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Zie [Plugin-inventaris](/nl/plugins/plugin-inventory) voor de huidige gegenereerde lijst van plugins die in het core-pakket worden meegeleverd, extern
worden geinstalleerd of alleen als broncode blijven.

Manifesten van gebundelde plugins mogen niet om dependency staging vragen. Grote of optionele
plugin-functionaliteit moet worden verpakt als een normale plugin en geinstalleerd via
hetzelfde npm-/git-/ClawHub-pad als plugins van derden.

In source checkouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en wijzigingen direct worden opgepikt. Ontwikkeling in een source
checkout is alleen pnpm; gewone `npm install` op de repository-root is
geen ondersteunde manier om afhankelijkheden van gebundelde plugins voor te bereiden.

| Installatievorm                  | Locatie van gebundelde plugin         | Eigenaar van afhankelijkheden                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtime-boom binnen het pakket | OpenClaw-pakket en expliciete plugin-install-/update-/doctor-flows    |
| Git-checkout plus `pnpm install` | `extensions/<id>`-workspacepakketten  | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk plugin-pakket |
| `openclaw plugins install ...`   | Beheerde npm-/git-/ClawHub-pluginroot | De plugin-install-/update-flow                                        |

## Legacy-opschoning

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde plugins bij het opstarten of
tijdens doctor-herstel. De huidige doctor-opschoning verwijdert die verouderde directories en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots, globale
Node-prefix-pakketsymlinks die verwijzen naar opgeschoonde `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifesten, gegenereerde plugin-`node_modules`, install
stage-directories en pakketlokale pnpm-stores. Packaged postinstall verwijdert ook
die globale symlinks voordat de legacy-doelroots worden opgeschoond, zodat upgrades
geen loshangende ESM-pakketimports achterlaten.

Deze paden zijn alleen legacy-resten. Nieuwe installaties mogen ze niet maken.
