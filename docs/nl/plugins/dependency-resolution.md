---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van plugins, doctor of het installatiegedrag van de pakketbeheerder
    - Je onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-06T19:35:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw houdt werk aan Plugin-afhankelijkheden bij installatie-/updatetijd. Runtime laden
voert geen package managers uit, repareert geen afhankelijkheidsbomen en muteert de OpenClaw
pakketmap niet.

## Verantwoordelijkheidsverdeling

Plugin-pakketten zijn eigenaar van hun afhankelijkheidsgraaf:

- runtime-afhankelijkheden staan in de Plugin-pakket-`dependencies` of
  `optionalDependencies`
- SDK-/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkelings-Plugins brengen hun eigen al geïnstalleerde afhankelijkheden mee
- npm- en git-Plugins worden geïnstalleerd in pakketroots die eigendom zijn van OpenClaw

OpenClaw is alleen eigenaar van de Plugin-levenscyclus:

- de Plugin-bron ontdekken
- het pakket installeren of updaten wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het Plugin-entrypoint laden
- mislukken met een uitvoerbare fout wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-pakketten worden geïnstalleerd onder `~/.openclaw/npm`
- git-pakketten worden gekloond onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsreparatie

npm-installaties worden uitgevoerd in de npm-root met:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt dezelfde beheerde npm-root
voor een lokale npm-pack-tarball. OpenClaw leest de npm-metadata van de tarball, voegt deze
toe aan de beheerde root als een gekopieerde `file:`-afhankelijkheid, voert de normale npm-installatie uit
en verifieert daarna de geïnstalleerde lockfile-metadata voordat de Plugin wordt vertrouwd.
Dit is bedoeld voor pakketacceptatie- en releasecandidate-bewijs waarbij een
lokaal pack-artefact zich moet gedragen als het registry-artefact dat het simuleert.

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
het Plugin-pakket. OpenClaw scant de beheerde npm-root voordat de
installatie wordt vertrouwd en gebruikt npm om door npm beheerde pakketten te verwijderen tijdens deïnstallatie, zodat gehoste
runtime-afhankelijkheden binnen de beheerde opschoongrens blijven.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als een peer-
afhankelijkheid. OpenClaw laat npm geen aparte registry-kopie van het
hostpakket installeren in de beheerde root, omdat verouderde hostpakketten de npm
peer-resolutie kunnen beïnvloeden tijdens latere Plugin-installaties. Beheerde npm-installaties slaan npm peer-
resolutie/materialisatie over voor de gedeelde root en OpenClaw bevestigt opnieuw
Plugin-lokale `node_modules/openclaw`-links voor geïnstalleerde pakketten die
de host-peer declareren na installatie, update of deïnstallatie.

git-installaties klonen of verversen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geïnstalleerde Plugin wordt daarna geladen vanuit die pakketmap, zodat pakketlokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als bij een normaal
Node-pakket.

## Lokale Plugins

Lokale Plugins worden behandeld als door ontwikkelaars beheerde mappen. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsreparatie voor ze uit. Als een lokale
Plugin afhankelijkheden heeft, installeer die dan in die Plugin voordat je deze laadt.

Lokale TypeScript-Plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-Plugins en gebundelde interne Plugins laden via native
import/require in plaats van via Jiti.

## Opstarten en herladen

Gateway-opstart en config-herladen installeren nooit Plugin-afhankelijkheden. Ze lezen
de Plugin-installatierecords, berekenen het entrypoint en laden dit.

Als een afhankelijkheid bij runtime ontbreekt, laadt de Plugin niet en moet de fout
de operator naar een expliciete oplossing wijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan verouderde door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en herstel uitvoeren voor
downloadbare Plugins die ontbreken in de lokale installatierecords wanneer config
ernaar verwijst. Doctor repareert geen afhankelijkheden voor een al geïnstalleerde
lokale Plugin.

## Gebundelde Plugins

Lichtgewicht en core-kritieke gebundelde Plugins worden als onderdeel van OpenClaw geleverd.
Ze zouden geen zware runtime-afhankelijkheidsboom moeten hebben, of anders moeten worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Zie [Plugin-inventaris](/nl/plugins/plugin-inventory) voor de huidige gegenereerde lijst van Plugins die in het core-pakket worden meegeleverd,
extern worden geïnstalleerd of alleen als bron blijven bestaan.

Gebundelde Plugin-manifests mogen niet om afhankelijkheidsstaging vragen. Grote of optionele
Plugin-functionaliteit moet als een normale Plugin worden verpakt en geïnstalleerd via
hetzelfde npm-/git-/ClawHub-pad als Plugins van derden.

In source-checkouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde Plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en bewerkingen direct worden opgepakt. Ontwikkeling vanuit een source-
checkout is alleen pnpm; gewone `npm install` in de repository-root is
geen ondersteunde manier om gebundelde Plugin-afhankelijkheden voor te bereiden.

| Installatievorm                  | Locatie van gebundelde Plugin         | Eigenaar van afhankelijkheden                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtime-boom binnen het pakket | OpenClaw-pakket en expliciete Plugin-installatie-/update-/doctor-flows |
| Git-checkout plus `pnpm install` | `extensions/<id>`-workspacepakketten  | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk Plugin-pakket |
| `openclaw plugins install ...`   | Beheerde npm-/git-/ClawHub-Plugin-root | De Plugin-installatie-/updateflow                                    |

## Verouderde opschoning

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde Plugins bij het opstarten of
tijdens doctor-reparatie. De huidige doctor-opschoning verwijdert die verouderde mappen en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots, globale
Node-prefix-pakketsymlinks die wijzen naar opgeschoonde `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifests, gegenereerde Plugin-`node_modules`, installatie-
stagingmappen en pakketlokale pnpm-stores. Verpakte postinstall verwijdert ook
die globale symlinks voordat de verouderde doelroots worden opgeschoond, zodat upgrades
geen hangende ESM-pakketimports achterlaten.

Deze paden zijn alleen verouderde restanten. Nieuwe installaties zouden ze niet moeten maken.
