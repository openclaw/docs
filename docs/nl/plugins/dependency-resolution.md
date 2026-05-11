---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van Plugins, doctor of het installatiegedrag van de pakketbeheerder
    - U onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Resolutie van Plugin-afhankelijkheden
x-i18n:
    generated_at: "2026-05-11T20:40:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw houdt werk voor plugin-afhankelijkheden bij installaties/updates. Runtime-laden
voert geen package managers uit, herstelt geen afhankelijkheidsbomen en muteert de
OpenClaw-pakketmap niet.

## Verdeling van verantwoordelijkheid

Pluginpakketten beheren hun eigen afhankelijkheidsgraaf:

- runtime-afhankelijkheden staan in de pluginpakket-`dependencies` of
  `optionalDependencies`
- SDK/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkelplugins brengen hun eigen al geïnstalleerde afhankelijkheden mee
- npm- en git-plugins worden geïnstalleerd in pakketroots die door OpenClaw worden beheerd

OpenClaw beheert alleen de pluginlevenscyclus:

- de pluginbron ontdekken
- het pakket installeren of bijwerken wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het plugin-entrypoint laden
- falen met een uitvoerbare fout wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-pakketten worden geïnstalleerd onder `~/.openclaw/npm`
- git-pakketten worden gekloond onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsherstel

npm-installaties draaien in de npm-root met:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt diezelfde beheerde npm-root
voor een lokale npm-pack-tarball. OpenClaw leest de npm-metadata van de tarball, voegt deze
toe aan de beheerde root als een gekopieerde `file:`-afhankelijkheid, voert de normale npm-installatie uit
en verifieert daarna de geïnstalleerde lockfilemetadata voordat de plugin wordt vertrouwd.
Dit is bedoeld voor pakketacceptatie en bewijs voor release candidates waarbij een
lokaal pack-artefact zich moet gedragen als het registry-artefact dat het simuleert.

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
het pluginpakket. OpenClaw scant de beheerde npm-root voordat de
installatie wordt vertrouwd en gebruikt npm om door npm beheerde pakketten te verwijderen tijdens het verwijderen, zodat gehoiste
runtime-afhankelijkheden binnen de beheerde opschoongrens blijven.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als een peer-
afhankelijkheid. OpenClaw laat npm geen aparte registry-kopie van het
hostpakket installeren in de beheerde root, omdat verouderde hostpakketten npm-
peerresolutie kunnen beïnvloeden tijdens latere plugininstallaties. Beheerde npm-installaties slaan npm-peer-
resolutie/materialisatie over voor de gedeelde root en OpenClaw bevestigt
pluginlokale `node_modules/openclaw`-links opnieuw voor geïnstalleerde pakketten die
de host-peer declareren na installatie, update of verwijdering.

git-installaties klonen of vernieuwen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geïnstalleerde plugin laadt daarna vanuit die pakketmap, zodat pakketlokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als bij een normaal
Node-pakket.

## Lokale plugins

Lokale plugins worden behandeld als door ontwikkelaars beheerde mappen. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsherstel voor ze uit. Als een lokale
plugin afhankelijkheden heeft, installeer die dan in die plugin voordat je deze laadt.

Lokale TypeScript-plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-plugins en gebundelde interne plugins laden via native
import/require in plaats van Jiti.

## Opstarten en herladen

Gateway-opstart en config-herladen installeren nooit pluginafhankelijkheden. Ze lezen
de plugininstallatierecords, berekenen het entrypoint en laden dit.

Als een afhankelijkheid ontbreekt tijdens runtime, wordt de plugin niet geladen en moet de fout
de operator wijzen op een expliciete oplossing:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan legacy door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en
downloadbare plugins herstellen die ontbreken in de lokale installatierecords wanneer de config
ernaar verwijst. Doctor herstelt geen afhankelijkheden voor een al geïnstalleerde
lokale plugin.

## Gebundelde plugins

Lichtgewicht en core-kritieke gebundelde plugins worden meegeleverd als onderdeel van OpenClaw.
Ze moeten geen zware runtime-afhankelijkheidsboom hebben of worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Voor de huidige gegenereerde lijst met plugins die in het corepakket worden meegeleverd,
extern worden geïnstalleerd of alleen als bron blijven bestaan, zie [Plugin-inventaris](/nl/plugins/plugin-inventory).

Manifesten van gebundelde plugins mogen geen afhankelijkheidsstaging aanvragen. Grote of optionele
pluginfunctionaliteit moet worden verpakt als een normale plugin en worden geïnstalleerd via
hetzelfde npm/git/ClawHub-pad als plugins van derden.

In broncheckouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en bewerkingen direct worden opgepikt. Ontwikkeling vanuit een
broncheckout is alleen pnpm; gewone `npm install` in de repositoryroot is
geen ondersteunde manier om afhankelijkheden van gebundelde plugins voor te bereiden.

| Installatievorm                  | Locatie van gebundelde plugin         | Eigenaar van afhankelijkheden                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtimeboom binnen het pakket | OpenClaw-pakket en expliciete plugininstallatie-/update-/doctorflows |
| Git-checkout plus `pnpm install` | `extensions/<id>`-workspacepakketten  | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk pluginpakket |
| `openclaw plugins install ...`   | Beheerde npm/git/ClawHub-pluginroot   | De plugininstallatie-/updateflow                                     |

## Legacy-opschoning

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde plugins bij het opstarten of
tijdens doctor-reparatie. De huidige doctor-opschoning verwijdert die verouderde mappen en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots, globale
Node-prefix-pakketsymlinks die verwijzen naar opgeschoonde `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifesten, gegenereerde plugin-`node_modules`, installatiestagingmappen
en pakketlokale pnpm-stores. Verpakte postinstall verwijdert ook
die globale symlinks voordat de legacy-doelroots worden opgeschoond, zodat upgrades
geen losse ESM-pakketimports achterlaten.

Deze paden zijn alleen legacy-afval. Nieuwe installaties mogen ze niet aanmaken.
