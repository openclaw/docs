---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van Plugins, doctor-gedrag of installatiegedrag van de pakketbeheerder
    - Je onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-02T11:22:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolutie van Plugin-afhankelijkheden

OpenClaw houdt werk aan Plugin-afhankelijkheden bij installatie- en updatetijd. Laden tijdens uitvoering
voert geen pakketbeheerders uit, repareert geen afhankelijkheidsbomen en wijzigt de OpenClaw
pakketmap niet.

## Verdeling van verantwoordelijkheden

Plugin-pakketten beheren hun eigen afhankelijkheidsgrafiek:

- afhankelijkheden voor uitvoering staan in de Plugin-pakket-`dependencies` of
  `optionalDependencies`
- SDK/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkelplugins brengen hun eigen al geinstalleerde afhankelijkheden mee
- npm- en git-plugins worden geinstalleerd in pakketroots die eigendom zijn van OpenClaw

OpenClaw beheert alleen de Plugin-levenscyclus:

- de Plugin-bron ontdekken
- het pakket installeren of bijwerken wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het Plugin-entrypoint laden
- falen met een uitvoerbare fout wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-pakketten worden geinstalleerd onder `~/.openclaw/npm`
- git-pakketten worden gekloond onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsreparatie

npm-installaties worden uitgevoerd in de npm-root met:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
het Plugin-pakket. OpenClaw scant de beheerde npm-root voordat het de
installatie vertrouwt en gebruikt npm om door npm beheerde pakketten te verwijderen tijdens deinstallatie, zodat gehoste
afhankelijkheden voor uitvoering binnen de beheerde opschoongrens blijven.

git-installaties klonen of verversen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geinstalleerde Plugin laadt daarna vanuit die pakketmap, zodat resolutie van pakketlokale
en bovenliggende `node_modules` op dezelfde manier werkt als bij een normaal
Node-pakket.

## Lokale plugins

Lokale plugins worden behandeld als door ontwikkelaars beheerde mappen. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsreparatie voor ze uit. Als een lokale
Plugin afhankelijkheden heeft, installeer die dan in die Plugin voordat je hem laadt.

Lokale TypeScript-plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-plugins en gebundelde interne plugins laden via native
import/require in plaats van via Jiti.

## Opstarten en herladen

Gateway-opstart en configuratieherlading installeren nooit Plugin-afhankelijkheden. Ze lezen
de Plugin-installatierecords, berekenen het entrypoint en laden het.

Als een afhankelijkheid tijdens uitvoering ontbreekt, kan de Plugin niet worden geladen en moet de fout
de operator naar een expliciete oplossing wijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan verouderde door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en
geconfigureerde downloadbare plugins installeren die ontbreken in de lokale installatierecords.
Het repareert geen afhankelijkheden voor een al geinstalleerde lokale Plugin.

## Gebundelde plugins

Lichte en core-kritieke gebundelde plugins worden als onderdeel van OpenClaw meegeleverd.
Ze moeten ofwel geen zware afhankelijkheidsboom voor uitvoering hebben, of worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Voor de huidige gegenereerde lijst met plugins die in het core-pakket worden meegeleverd, extern worden
geinstalleerd of alleen als bron blijven bestaan, zie [Plugin-inventaris](/nl/plugins/plugin-inventory).

Gebundelde Plugin-manifesten mogen geen dependency staging aanvragen. Grote of optionele
Plugin-functionaliteit moet als een normale Plugin worden verpakt en worden geinstalleerd via
hetzelfde npm/git/ClawHub-pad als plugins van derden.

In source checkouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en bewerkingen direct worden opgepikt. Ontwikkeling vanuit een source
checkout is alleen pnpm; een gewone `npm install` in de repositoryroot is
geen ondersteunde manier om gebundelde Plugin-afhankelijkheden voor te bereiden.

| Installatievorm                  | Locatie van gebundelde Plugin         | Eigenaar van afhankelijkheden                                          |
| -------------------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde uitvoeringsboom binnen het pakket | OpenClaw-pakket en expliciete Plugin-installatie-/update-/doctor-stromen |
| Git-checkout plus `pnpm install` | `extensions/<id>` workspace-pakketten | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk Plugin-pakket |
| `openclaw plugins install ...`   | Beheerde npm/git/ClawHub-Plugin-root  | De Plugin-installatie-/update-stroom                                  |

## Opschonen van verouderde bestanden

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde plugins bij het opstarten of
tijdens doctor-reparatie. De huidige doctor-opruiming verwijdert die verouderde mappen en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots,
`.openclaw-runtime-deps*`-manifesten, gegenereerde Plugin-`node_modules`, installatiestage-mappen
en pakketlokale pnpm-stores.

Deze paden zijn alleen verouderde restanten. Nieuwe installaties mogen ze niet aanmaken.
