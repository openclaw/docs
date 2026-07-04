---
read_when:
    - Je debugt installaties van pluginpakketten
    - Je wijzigt het opstartgedrag van plugins, doctor of installatiegedrag van de pakketbeheerder
    - U onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-07-04T15:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw houdt werk aan Plugin-afhankelijkheden bij installatie- en updatetijd. Runtime-laden
voert geen package managers uit, repareert geen dependency trees en wijzigt de OpenClaw
package directory niet.

## Verdeling van verantwoordelijkheden

Plugin-packages zijn eigenaar van hun dependency graph:

- runtime-afhankelijkheden staan in de Plugin-package `dependencies` of
  `optionalDependencies`
- SDK-/core-imports zijn peer- of door OpenClaw geleverde imports
- lokale ontwikkelingsplugins brengen hun eigen al geinstalleerde afhankelijkheden mee
- npm- en git-plugins worden geinstalleerd in package roots die eigendom zijn van OpenClaw

OpenClaw is alleen eigenaar van de Plugin-lifecycle:

- de Plugin-bron ontdekken
- de package installeren of bijwerken wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het Plugin-entrypoint laden
- falen met een bruikbare fout wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-packages installeren in projecten per Plugin onder
  `~/.openclaw/npm/projects/<encoded-package>`
- git-packages klonen onder `~/.openclaw/git`
- lokale/path/archive-installaties worden gekopieerd of gerefereerd zonder afhankelijkheidsreparatie

npm-installaties draaien in die projectroot per Plugin met:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt dezelfde npm-projectroot
per Plugin voor een lokale npm-pack-tarball. OpenClaw leest de npm-metadata van
de tarball, voegt die als gekopieerde `file:`-afhankelijkheid toe aan het beheerde
project, voert de normale npm-installatie uit en verifieert daarna de geinstalleerde
lockfile-metadata voordat de Plugin wordt vertrouwd.
Dit is bedoeld voor package acceptance en release-candidate bewijs waarbij een
lokaal pack-artefact zich moet gedragen als het registry-artefact dat het simuleert.

Gebruik `npm-pack:` wanneer je officiele of externe Plugin-packages test voordat je
publiceert. Een ruwe archive- of path-installatie is nuttig voor lokale debugging,
maar bewijst niet hetzelfde afhankelijkheidspad als een geinstalleerde npm- of
ClawHub-package. `npm-pack:` bewijst de vorm van de beheerde package-installatie;
het is op zichzelf geen bewijs dat de Plugin aan catalog-linked officiele content
is gekoppeld.

Wanneer gedrag afhangt van de status als bundled Plugin of vertrouwde officiele Plugin,
combineer je het lokale package-bewijs met een catalog-backed officiele installatie
of een gepubliceerd packagepad dat officieel vertrouwen vastlegt. Bevoorrechte
helpertoegang en trusted-official scope-afhandeling moeten op dat vertrouwde
installatiepad worden gevalideerd, niet worden afgeleid uit een lokale tarball-installatie.

Als een Plugin tijdens runtime faalt met een ontbrekende import, repareer dan de
package manifest in plaats van het beheerde project handmatig te repareren. Runtime-imports
horen in de Plugin-package `dependencies` of `optionalDependencies`; `devDependencies`
worden niet geinstalleerd voor beheerde runtimeprojecten. Een lokale `npm install`
binnen `~/.openclaw/npm/projects/<encoded-package>` kan een tijdelijke diagnose
deblokkeren, maar is geen package-acceptance bewijs omdat de volgende installatie
of update het project opnieuw aanmaakt vanuit packagemetadata.

npm kan transitieve afhankelijkheden hoisten naar de `node_modules` van het project
per Plugin naast de Plugin-package. OpenClaw scant de beheerde projectroot voordat
de installatie wordt vertrouwd en verwijdert dat project tijdens uninstall, zodat
gehoiste runtime-afhankelijkheden binnen de cleanup-grens van die Plugin blijven.

Gepubliceerde npm Plugin-packages kunnen `npm-shrinkwrap.json` meeleveren. npm gebruikt
die publiceerbare lockfile tijdens installatie, en de beheerde npm-projectroot van
OpenClaw ondersteunt dit via het normale npm-installatiepad. Publiceerbare Plugin-packages
die eigendom zijn van OpenClaw moeten een package-lokale shrinkwrap bevatten die is
gegenereerd vanuit de gepubliceerde dependency graph van die Plugin-package:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

De generator verwijdert Plugin `devDependencies`, past het workspace override-beleid
toe en schrijft `extensions/<id>/npm-shrinkwrap.json` voor elke `publishToNpm` Plugin.
Plugin-packages van derden kunnen ook shrinkwrap meeleveren; OpenClaw vereist dit
niet voor community-packages, maar npm respecteert het wanneer het aanwezig is.

Voordat je een lokale package als release-candidate bewijs behandelt, inspecteer je de
tarball die wordt geinstalleerd:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Voor afhankelijkheidswijzigingen verifieer je ook dat een productie-installatie de
runtimepackages zonder dev-afhankelijkheden kan resolven:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

npm Plugin-packages die eigendom zijn van OpenClaw kunnen ook publiceren met expliciete
`bundledDependencies`. Het npm-publicatiepad legt de lijst met runtime-afhankelijkheidsnamen
eroverheen, verwijdert dev-only workspacemetadata uit de gepubliceerde package
manifest, voert een scriptvrije npm-installatie uit voor package-lokale runtime-afhankelijkheden,
en pakt of publiceert daarna de Plugin-tarball met die afhankelijkheidsbestanden inbegrepen.
Packages met veel native onderdelen, waaronder Codex- en ACP-runtimes, kiezen hiervoor
niet met `openclaw.release.bundleRuntimeDependencies: false`; die packages leveren nog
steeds hun shrinkwrap mee, maar npm resolvet runtime-afhankelijkheden tijdens installatie
in plaats van elke platform-binary in de Plugin-tarball in te sluiten. De rootpackage
`openclaw` bundelt niet zijn volledige dependency tree.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als peer
dependency. OpenClaw laat npm geen aparte registry-kopie van de hostpackage in een
beheerd project installeren, omdat verouderde hostpackages npm-peerresolutie binnen
die Plugin kunnen beinvloeden. Beheerde npm-installaties slaan npm-peerresolutie en
-materialisatie over en OpenClaw bevestigt na installatie of update opnieuw Plugin-lokale
`node_modules/openclaw`-links voor geinstalleerde packages die de host-peer declareren.

git-installaties klonen of vernieuwen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geinstalleerde Plugin laadt daarna vanuit die package directory, zodat package-lokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als bij een normale
Node-package.

## Lokale plugins

Lokale plugins worden behandeld als directories onder controle van de ontwikkelaar.
OpenClaw voert geen `npm install`, `pnpm install` of afhankelijkheidsreparatie voor
ze uit. Als een lokale Plugin afhankelijkheden heeft, installeer die dan in die Plugin
voordat je deze laadt.

Lokale TypeScript-plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-plugins en gebundelde interne plugins laden via native import/require in
plaats van via Jiti.

## Opstarten en herladen

Gateway-opstart en configuratieherladen installeren nooit Plugin-afhankelijkheden.
Ze lezen de Plugin-installatierecords, berekenen het entrypoint en laden het.

Als een afhankelijkheid tijdens runtime ontbreekt, laadt de Plugin niet en moet de
fout de operator naar een expliciete oplossing wijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan oude door OpenClaw gegenereerde afhankelijkheidsstatus opschonen
en downloadbare plugins herstellen die ontbreken in de lokale installatierecords
wanneer configuratie ernaar verwijst. Doctor repareert geen afhankelijkheden voor
een al geinstalleerde lokale Plugin.

## Gebundelde plugins

Lichtgewicht en core-kritieke gebundelde plugins worden als onderdeel van OpenClaw
meegeleverd. Ze moeten ofwel geen zware runtime dependency tree hebben, of worden
verplaatst naar een downloadbare package op ClawHub/npm.

Voor de huidige gegenereerde lijst van plugins die in de corepackage worden meegeleverd,
extern installeren of source-only blijven, zie [Plugin-inventaris](/nl/plugins/plugin-inventory).

Gebundelde Plugin manifests mogen niet om dependency staging vragen. Grote of optionele
Plugin-functionaliteit moet als normale Plugin worden verpakt en via hetzelfde
npm/git/ClawHub-pad als plugins van derden worden geinstalleerd.

In broncheckouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde plugins vanuit `extensions/<id>`, zodat package-lokale
workspace-afhankelijkheden beschikbaar zijn en bewerkingen direct worden opgepakt.
Ontwikkeling in source checkout is alleen pnpm; gewone `npm install` in de repositoryroot
is geen ondersteunde manier om afhankelijkheden van gebundelde plugins voor te bereiden.

| Installatievorm                  | Locatie van gebundelde Plugin         | Eigenaar van afhankelijkheden                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtime tree in de package   | OpenClaw-package en expliciete Plugin install/update/doctor-flows     |
| Git-checkout plus `pnpm install` | `extensions/<id>` workspace packages  | De pnpm-workspace, inclusief de eigen afhankelijkheden van elke Plugin-package |
| `openclaw plugins install ...`   | Beheerde npm-project/git/ClawHub-root | De Plugin install/update-flow                                         |

## Legacy-opschoning

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde plugins bij
opstarten of tijdens doctor-reparatie. De huidige doctor-cleanup verwijdert die oude
directories en symlinks wanneer `--fix` wordt gebruikt, inclusief oude
`plugin-runtime-deps`-roots, globale Node-prefix package-symlinks die naar opgeschoonde
`plugin-runtime-deps`-targets wijzen, `.openclaw-runtime-deps*` manifests,
gegenereerde Plugin `node_modules`, install stage directories en package-lokale
pnpm stores. Packaged postinstall verwijdert ook die globale symlinks voordat de
legacy target roots worden opgeschoond, zodat upgrades geen hangende ESM-package-imports
achterlaten.

Oudere npm-installaties gebruikten ook een gedeelde root
`~/.openclaw/npm/node_modules`. Huidige install-, update-, uninstall- en doctor-flows
herkennen die legacy flat root nog alleen voor herstel en opschoning. Nieuwe npm-installaties
moeten in plaats daarvan projectroots per Plugin aanmaken.
