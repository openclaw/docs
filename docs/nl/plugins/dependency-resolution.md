---
read_when:
    - Je spoort fouten op in installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van plugins, doctor of het installatiegedrag van de pakketbeheerder
    - Je onderhoudt verpakte OpenClaw-installaties of gebundelde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Plugin-afhankelijkheidsresolutie
x-i18n:
    generated_at: "2026-05-05T01:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin-afhankelijkheidsoplossing

OpenClaw houdt Plugin-afhankelijkheidswerk bij installatie-/updatetijd. Runtime-laden
voert geen pakketbeheerders uit, herstelt geen afhankelijkheidsstructuren en wijzigt de
OpenClaw-pakketmap niet.

## Verdeling van verantwoordelijkheden

Plugin-pakketten zijn eigenaar van hun afhankelijkheidsgrafiek:

- runtime-afhankelijkheden staan in de `dependencies` of
  `optionalDependencies` van het Plugin-pakket
- SDK-/core-imports zijn peer-imports of door OpenClaw geleverde imports
- lokale ontwikkel-Plugins brengen hun eigen al geïnstalleerde afhankelijkheden mee
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
- lokale/pad-/archiefinstallaties worden gekopieerd of gerefereerd zonder afhankelijkheidsherstel

npm-installaties worden uitgevoerd in de npm-root met:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm kan transitieve afhankelijkheden hoisten naar `~/.openclaw/npm/node_modules` naast
het Plugin-pakket. OpenClaw scant de beheerde npm-root voordat de installatie wordt
vertrouwd en gebruikt npm om door npm beheerde pakketten te verwijderen tijdens deïnstallatie, zodat gehoste
runtime-afhankelijkheden binnen de beheerde opschoningsgrens blijven.

git-installaties klonen of vernieuwen de repository en voeren daarna uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geïnstalleerde Plugin wordt daarna vanuit die pakketmap geladen, zodat pakketlokale
en bovenliggende `node_modules`-resolutie op dezelfde manier werkt als voor een normaal
Node-pakket.

## Lokale Plugins

Lokale Plugins worden behandeld als door ontwikkelaars beheerde mappen. OpenClaw voert
geen `npm install`, `pnpm install` of afhankelijkheidsherstel voor ze uit. Als een lokale
Plugin afhankelijkheden heeft, installeer die dan in die Plugin voordat je hem laadt.

Lokale TypeScript-Plugins van derden kunnen het noodpad via Jiti gebruiken. Verpakte
JavaScript-Plugins en gebundelde interne Plugins laden via native
import/require in plaats van via Jiti.

## Opstarten en herladen

Gateway-opstart en configuratie-herladen installeren nooit Plugin-afhankelijkheden. Ze lezen
de Plugin-installatierecords, berekenen het entrypoint en laden het.

Als een afhankelijkheid tijdens runtime ontbreekt, wordt de Plugin niet geladen en moet de fout
de operator naar een expliciete oplossing wijzen:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` kan verouderde door OpenClaw gegenereerde afhankelijkheidsstatus opschonen en
downloadbare Plugins herstellen die ontbreken in de lokale installatierecords wanneer de configuratie
ernaar verwijst. Doctor herstelt geen afhankelijkheden voor een al geïnstalleerde
lokale Plugin.

## Gebundelde Plugins

Lichtgewicht en core-kritieke gebundelde Plugins worden meegeleverd als onderdeel van OpenClaw.
Ze moeten ofwel geen zware runtime-afhankelijkheidsstructuur hebben, of worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Zie [Plugin-inventaris](/nl/plugins/plugin-inventory) voor de huidige gegenereerde lijst met Plugins
die in het core-pakket worden meegeleverd, extern worden geïnstalleerd of alleen als bron blijven bestaan.

Manifesten van gebundelde Plugins mogen geen afhankelijkheidsstaging aanvragen. Grote of optionele
Plugin-functionaliteit moet worden verpakt als een normale Plugin en worden geïnstalleerd via
hetzelfde npm/git/ClawHub-pad als Plugins van derden.

In broncheckouts behandelt OpenClaw de repository als een pnpm-monorepo. Na
`pnpm install` laden gebundelde Plugins vanuit `extensions/<id>`, zodat pakketlokale
workspace-afhankelijkheden beschikbaar zijn en wijzigingen direct worden opgepikt. Ontwikkeling met
een broncheckout is alleen pnpm; gewone `npm install` in de repositoryroot is
geen ondersteunde manier om afhankelijkheden van gebundelde Plugins voor te bereiden.

| Installatievorm                 | Locatie van gebundelde Plugin        | Eigenaar van afhankelijkheden                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Gebouwde runtime-structuur in het pakket | OpenClaw-pakket en expliciete Plugin-installatie-/update-/doctor-flows |
| Git-checkout plus `pnpm install` | `extensions/<id>`-workspacepakketten  | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk Plugin-pakket |
| `openclaw plugins install ...`   | Beheerde npm-/git-/ClawHub-Plugin-root | De Plugin-installatie-/updateflow                                    |

## Opschoning van verouderde resten

Oudere OpenClaw-versies genereerden afhankelijkheidsroots voor gebundelde Plugins bij het opstarten of
tijdens doctor-herstel. De huidige doctor-opschoning verwijdert die verouderde mappen en
symlinks wanneer `--fix` wordt gebruikt, waaronder oude `plugin-runtime-deps`-roots, globale
Node-prefix-pakketsymlinks die wijzen naar opgeschoonde `plugin-runtime-deps`-doelen,
`.openclaw-runtime-deps*`-manifesten, gegenereerde Plugin-`node_modules`, installatiestagingmappen
en pakketlokale pnpm-stores. Packaged postinstall verwijdert ook
die globale symlinks voordat de verouderde doelroots worden opgeschoond, zodat upgrades
geen bungelende ESM-pakketimports achterlaten.

Deze paden zijn alleen verouderde resten. Nieuwe installaties zouden ze niet moeten aanmaken.
