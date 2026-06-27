---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van Plugins, doctor of pakketbeheerinstallaties
    - Je onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-06-27T17:53:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw houdt werk aan plugin-afhankelijkheden bij installatie-/updatetijd. Laden tijdens runtime
voert geen pakketbeheerders uit, herstelt geen afhankelijkheidsbomen en wijzigt de
pakketmap van OpenClaw niet.

## Verdeling van verantwoordelijkheden

Plugin-pakketten zijn eigenaar van hun afhankelijkheidsgrafiek:

- runtime-afhankelijkheden staan in `dependencies` of `optionalDependencies`
  van het plugin-pakket
- SDK-/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkelplugins brengen hun eigen al geïnstalleerde afhankelijkheden mee
- npm- en git-plugins worden geïnstalleerd in pakketroots die eigendom zijn van OpenClaw

OpenClaw is alleen eigenaar van de levenscyclus van plugins:

- de plugin-bron ontdekken
- het pakket installeren of bijwerken wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het toegangspunt van de plugin laden
- falen met een uitvoerbare foutmelding wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-pakketten worden geïnstalleerd in projecten per plugin onder
  `~/.openclaw/npm/projects/<encoded-package>`
- git-pakketten worden gekloond onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsherstel

npm-installaties worden uitgevoerd in die projectroot per plugin met:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt dezelfde npm-projectroot
per plugin voor een lokale npm-pack-tarball. OpenClaw leest de npm-metadata van de tarball,
voegt deze toe aan het beheerde project als gekopieerde `file:`-afhankelijkheid, voert
de normale npm-installatie uit en verifieert daarna de geïnstalleerde lockfile-metadata voordat
de plugin wordt vertrouwd.
Dit is bedoeld voor pakketacceptatie- en releasecandidate-bewijs waarbij een
lokaal pack-artefact zich moet gedragen als het registerartefact dat het simuleert.

npm kan transitieve afhankelijkheden hoisten naar de `node_modules` van het project
per plugin naast het plugin-pakket. OpenClaw scant de beheerde projectroot
voordat de installatie wordt vertrouwd en verwijdert dat project tijdens deïnstallatie, zodat
gehoiste runtime-afhankelijkheden binnen de opruimgrens van die plugin blijven.

Gepubliceerde npm-plugin-pakketten kunnen `npm-shrinkwrap.json` meeleveren. npm gebruikt die
publiceerbare lockfile tijdens installatie, en de beheerde npm-projectroot van OpenClaw
ondersteunt dit via het normale npm-installatiepad. Publiceerbare plugin-pakketten
die eigendom zijn van OpenClaw moeten een pakketlokale shrinkwrap bevatten die is gegenereerd uit de
gepubliceerde afhankelijkheidsgrafiek van dat plugin-pakket:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

De generator verwijdert plugin-`devDependencies`, past het workspace-overridebeleid toe
en schrijft `extensions/<id>/npm-shrinkwrap.json` voor elke
`publishToNpm`-plugin. Plugin-pakketten van derden mogen ook shrinkwrap meeleveren;
OpenClaw vereist dit niet voor communitypakketten, maar npm respecteert het
wanneer het aanwezig is.

npm-plugin-pakketten die eigendom zijn van OpenClaw kunnen ook publiceren met expliciete
`bundledDependencies`. Het npm-publicatiepad legt de lijst met runtime-afhankelijkheidsnamen
eroverheen, verwijdert alleen-voor-ontwikkeling workspace-metadata uit het gepubliceerde
pakketmanifest, voert een scriptvrije npm-installatie uit voor pakketlokale runtime-
afhankelijkheden en pakt of publiceert daarna de plugin-tarball met die afhankelijkheidsbestanden
inbegrepen. Pakketten met veel native onderdelen, waaronder Codex- en ACP-runtimes, kiezen hiervoor niet
met `openclaw.release.bundleRuntimeDependencies: false`; die pakketten leveren nog steeds
hun shrinkwrap mee, maar npm resolveert runtime-afhankelijkheden tijdens installatie
in plaats van elke platformbinary in de plugin-tarball in te sluiten. Het rootpakket
`openclaw` bundelt niet zijn volledige afhankelijkheidsboom.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als peer-
afhankelijkheid. OpenClaw staat npm niet toe een aparte registerkopie van het
hostpakket in een beheerd project te installeren, omdat verouderde hostpakketten invloed kunnen hebben op npm-
peerresolutie binnen die plugin. Beheerde npm-installaties slaan npm-peerresolutie/
materialisatie over en OpenClaw bevestigt na installatie of update opnieuw pluginlokale
`node_modules/openclaw`-links voor geïnstalleerde pakketten die de host-peer declareren.

git-installaties klonen of verversen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geïnstalleerde plugin laadt daarna vanuit die pakketmap, zodat pakketlokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als bij een normaal
Node-pakket.

## Lokale plugins

Lokale plugins worden behandeld als door ontwikkelaars beheerde mappen. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsherstel voor ze uit. Als een lokale
plugin afhankelijkheden heeft, installeer die dan in die plugin voordat je hem laadt.

Lokale TypeScript-plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-plugins en gebundelde interne plugins laden via native
import/require in plaats van Jiti.

## Opstarten en herladen

Gateway-opstart en configuratieherladen installeren nooit plugin-afhankelijkheden. Ze lezen
de plugin-installatierecords, berekenen het toegangspunt en laden het.

Als een afhankelijkheid tijdens runtime ontbreekt, laadt de plugin niet en moet de fout
de operator naar een expliciete oplossing verwijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan verouderde door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en
downloadbare plugins herstellen die ontbreken in de lokale installatierecords wanneer de configuratie
ernaar verwijst. Doctor herstelt geen afhankelijkheden voor een al geïnstalleerde
lokale plugin.

## Gebundelde plugins

Lichtgewicht en core-kritieke gebundelde plugins worden meegeleverd als onderdeel van OpenClaw.
Ze moeten ofwel geen zware runtime-afhankelijkheidsboom hebben, of worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Zie [Plugin-inventaris](/nl/plugins/plugin-inventory) voor de huidige gegenereerde lijst van plugins die
in het corepakket worden meegeleverd, extern worden geïnstalleerd of alleen broncode blijven.

Manifesten van gebundelde plugins mogen geen afhankelijkheidsstaging aanvragen. Grote of optionele
plugin-functionaliteit moet worden verpakt als normale plugin en worden geïnstalleerd via
hetzelfde npm-/git-/ClawHub-pad als plugins van derden.

In broncodecheckouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en wijzigingen direct worden opgepakt. Ontwikkeling in een
broncodecheckout is alleen pnpm; gewone `npm install` in de repositoryroot is
geen ondersteunde manier om afhankelijkheden van gebundelde plugins voor te bereiden.

| Installatievorm                  | Locatie van gebundelde plugin         | Eigenaar van afhankelijkheden                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtimeboom binnen het pakket | OpenClaw-pakket en expliciete plugin-installatie-/update-/doctor-flows |
| Git-checkout plus `pnpm install` | `extensions/<id>` workspace-pakketten | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk plugin-pakket |
| `openclaw plugins install ...`   | Beheerde npm-project-/git-/ClawHub-root | De plugin-installatie-/updateflow                                    |

## Opschoning van legacy

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde plugins bij het opstarten of
tijdens doctor-herstel. De huidige doctor-opruiming verwijdert die verouderde mappen en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots, globale
Node-prefix-pakketsymlinks die wijzen naar gesnoeide `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifesten, gegenereerde plugin-`node_modules`, installatiestage-
mappen en pakketlokale pnpm-stores. Verpakte postinstall verwijdert ook
die globale symlinks voordat de legacy-doelroots worden gesnoeid, zodat upgrades
geen kapotte ESM-pakketimports achterlaten.

Oudere npm-installaties gebruikten ook een gedeelde `~/.openclaw/npm/node_modules`-root.
Huidige installatie-, update-, deïnstallatie- en doctor-flows herkennen die verouderde
platte root nog steeds alleen voor herstel en opschoning. Nieuwe npm-installaties moeten in plaats daarvan
projectroots per plugin maken.
