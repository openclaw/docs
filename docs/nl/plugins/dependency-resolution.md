---
read_when:
    - Je debugt Plugin-pakketinstallaties
    - Je wijzigt het opstartgedrag van Plugins, doctor-gedrag of installatiegedrag via pakketbeheer
    - Je onderhoudt gepackagede OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-03T21:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-afhankelijkheidsresolutie

OpenClaw houdt Plugin-afhankelijkheidswerk bij installatie- en updatetijd. Laden tijdens runtime
voert geen package managers uit, herstelt geen afhankelijkheidsbomen en wijzigt de OpenClaw-
pakketmap niet.

## Verdeling van verantwoordelijkheid

Plugin-pakketten beheren hun eigen afhankelijkheidsgrafiek:

- runtime-afhankelijkheden staan in `dependencies` of
  `optionalDependencies` van het Plugin-pakket
- SDK/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkelings-Plugins leveren hun eigen al geinstalleerde afhankelijkheden mee
- npm- en git-Plugins worden geinstalleerd in pakketroots die eigendom zijn van OpenClaw

OpenClaw beheert alleen de Plugin-levenscyclus:

- de Plugin-bron ontdekken
- het pakket installeren of bijwerken wanneer daar expliciet om wordt gevraagd
- de installatiemetadata vastleggen
- het Plugin-entrypoint laden
- falen met een bruikbare foutmelding wanneer afhankelijkheden ontbreken

## Installatieroots

OpenClaw gebruikt stabiele roots per bron:

- npm-pakketten worden geinstalleerd onder `~/.openclaw/npm`
- git-pakketten worden gekloond onder `~/.openclaw/git`
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsherstel

npm-installaties worden uitgevoerd in de npm-root met:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
het Plugin-pakket. OpenClaw scant de beheerde npm-root voordat de installatie wordt vertrouwd
en gebruikt npm om door npm beheerde pakketten te verwijderen tijdens de-installatie, zodat gehoiste
runtime-afhankelijkheden binnen de beheerde opschoningsgrens blijven.

git-installaties klonen of verversen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geinstalleerde Plugin wordt daarna vanuit die pakketmap geladen, zodat pakketlokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als voor een normaal
Node-pakket.

## Lokale Plugins

Lokale Plugins worden behandeld als door ontwikkelaars beheerde mappen. OpenClaw voert geen
`npm install`, `pnpm install` of afhankelijkheidsherstel voor ze uit. Als een lokale
Plugin afhankelijkheden heeft, installeer die dan in die Plugin voordat je hem laadt.

Lokale TypeScript-Plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-Plugins en meegeleverde interne Plugins laden via native
import/require in plaats van Jiti.

## Opstarten en herladen

Gateway-opstarten en configuratieherladen installeren nooit Plugin-afhankelijkheden. Ze lezen
de Plugin-installatierecords, berekenen het entrypoint en laden het.

Als een afhankelijkheid tijdens runtime ontbreekt, kan de Plugin niet laden en moet de fout
de operator naar een expliciete oplossing verwijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan verouderde door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en
geconfigureerde downloadbare Plugins installeren die ontbreken in de lokale installatierecords.
Het herstelt geen afhankelijkheden voor een al geinstalleerde lokale Plugin.

## Meegeleverde Plugins

Lichtgewicht en core-kritieke meegeleverde Plugins worden als onderdeel van OpenClaw geleverd.
Ze zouden ofwel geen zware runtime-afhankelijkheidsboom moeten hebben, of moeten worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Zie [Plugin-inventaris](/nl/plugins/plugin-inventory) voor de huidige gegenereerde lijst met Plugins die in het core-pakket worden meegeleverd, extern
worden geinstalleerd of alleen als broncode blijven bestaan.

Manifesten van meegeleverde Plugins mogen geen afhankelijkheidsstaging aanvragen. Grote of optionele
Plugin-functionaliteit moet worden verpakt als een normale Plugin en worden geinstalleerd via
hetzelfde npm/git/ClawHub-pad als Plugins van derden.

In source-checkouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden meegeleverde Plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en wijzigingen direct worden opgepikt. Ontwikkeling in
een source-checkout is alleen met pnpm; gewone `npm install` in de repositoryroot is
geen ondersteunde manier om afhankelijkheden van meegeleverde Plugins voor te bereiden.

| Installatievorm                  | Locatie van meegeleverde Plugin       | Eigenaar van afhankelijkheden                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtimeboom in het pakket    | OpenClaw-pakket en expliciete Plugin-installatie-/update-/doctor-flows |
| Git-checkout plus `pnpm install` | `extensions/<id>` workspace-pakketten | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk Plugin-pakket |
| `openclaw plugins install ...`   | Beheerde npm/git/ClawHub-Plugin-root  | De Plugin-installatie-/update-flow                                   |

## Verouderde opschoning

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor meegeleverde Plugins bij het opstarten of
tijdens doctor-herstel. De huidige doctor-opschoning verwijdert die verouderde mappen en
symlinks wanneer `--fix` wordt gebruikt, inclusief oude `plugin-runtime-deps`-roots, globale
Node-prefix-pakketsymlinks die wijzen naar opgeschoonde `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifesten, gegenereerde Plugin-`node_modules`, installatiestage-
mappen en pakketlokale pnpm-stores. Verpakte postinstall verwijdert ook
die globale symlinks voordat de verouderde doelroots worden opgeschoond, zodat upgrades
geen losse ESM-pakketimports achterlaten.

Deze paden zijn alleen verouderde restanten. Nieuwe installaties zouden ze niet moeten aanmaken.
