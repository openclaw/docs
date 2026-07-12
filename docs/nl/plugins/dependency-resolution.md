---
read_when:
    - Je debugt installaties van Plugin-pakketten
    - Je wijzigt het opstartgedrag van plugins, doctor of installaties via pakketbeheer
    - Je onderhoudt verpakte OpenClaw-installaties of meegeleverde Plugin-manifesten
sidebarTitle: Dependencies
summary: Hoe OpenClaw Plugin-pakketten installeert en Plugin-afhankelijkheden oplost
title: Resolutie van Plugin-afhankelijkheden
x-i18n:
    generated_at: "2026-07-12T09:09:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw verwerkt Plugin-afhankelijkheden alleen tijdens installatie en updates. Tijdens het laden
bij uitvoering wordt nooit een pakketbeheerder gestart, een afhankelijkheidsstructuur hersteld of
de OpenClaw-pakketmap gewijzigd.

## Verdeling van verantwoordelijkheden

Plugin-pakketten beheren hun eigen afhankelijkheidsgraaf:

- Uitvoeringsafhankelijkheden staan in `dependencies` of
  `optionalDependencies` van het Plugin-pakket.
- SDK-/core-imports zijn peer-imports of door OpenClaw geleverde imports.
- Plugins voor lokale ontwikkeling brengen hun eigen reeds geïnstalleerde afhankelijkheden mee.
- npm- en git-Plugins worden geïnstalleerd in pakketbasismappen die door OpenClaw worden beheerd.

OpenClaw beheert alleen de levenscyclus van de Plugin:

- De bron van de Plugin detecteren.
- Het pakket installeren of bijwerken wanneer daar expliciet om wordt gevraagd.
- Installatiemetagegevens vastleggen.
- Het toegangspunt van de Plugin laden.
- Stoppen met een bruikbare foutmelding wanneer afhankelijkheden ontbreken.

## Installatiebasismappen

OpenClaw gebruikt stabiele basismappen per bron:

- npm-pakketten worden geïnstalleerd in projecten per Plugin onder
  `~/.openclaw/npm/projects/<encoded-package>`.
- git-pakketten worden gekloond onder `~/.openclaw/git`.
- Lokale installaties en installaties via paden of archieven worden zonder herstel van
  afhankelijkheden gekopieerd of ernaar verwezen.

npm-installaties worden uitgevoerd in die projectbasismap per Plugin met:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` gebruikt dezelfde npm-projectbasismap
per Plugin voor een lokaal npm-pack-tararchief: OpenClaw leest de npm-metagegevens
van het tararchief, voegt het als gekopieerde `file:`-afhankelijkheid toe aan het beheerde project, voert
de normale npm-installatie hierboven uit en verifieert vervolgens de geïnstalleerde lockfile-metagegevens
voordat de Plugin wordt vertrouwd. Dit pad bestaat voor pakketacceptatie en
bewijs voor releasekandidaten, waarbij een lokaal pakketartefact zich moet gedragen zoals het
registerartefact dat het simuleert.

Gebruik `npm-pack:` bij het testen van officiële of externe Plugin-pakketten vóór
publicatie. Een onbewerkt archief of een installatie via een pad is nuttig voor lokale foutopsporing, maar
bewijst niet hetzelfde afhankelijkhedenpad als een geïnstalleerd npm- of ClawHub-
pakket. `npm-pack:` bewijst de installatiestructuur van het beheerde pakket; het is op
zichzelf geen bewijs dat de Plugin aan de catalogus gekoppelde officiële inhoud is.

Wanneer gedrag afhangt van de status als gebundelde Plugin of vertrouwde officiële Plugin,
combineert u het lokale pakketbewijs met een door de catalogus ondersteunde officiële installatie of een
gepubliceerd pakketpad dat officieel vertrouwen vastlegt. Toegang tot bevoorrechte hulpfuncties
en de afhandeling van het vertrouwde officiële bereik moeten via dat vertrouwde
installatiepad worden gevalideerd en niet worden afgeleid uit een lokale tararchiefinstallatie.

Als een Plugin tijdens uitvoering mislukt vanwege een ontbrekende import, corrigeer dan het pakketmanifest
in plaats van het beheerde project handmatig te herstellen. Imports voor uitvoering horen thuis in
`dependencies` of `optionalDependencies` van het Plugin-pakket; `devDependencies`
worden niet geïnstalleerd voor beheerde uitvoeringsprojecten. Een lokale `npm install` in
`~/.openclaw/npm/projects/<encoded-package>` kan een tijdelijke
diagnose mogelijk maken, maar geldt niet als pakketacceptatiebewijs, omdat de volgende installatie of
update het project opnieuw aanmaakt op basis van de pakketmetagegevens.

npm kan transitieve afhankelijkheden hijsen naar `node_modules` van het project
per Plugin, naast het Plugin-pakket. OpenClaw scant de basismap van het beheerde project
voordat de installatie wordt vertrouwd en verwijdert dat project bij de-installatie, zodat
gehesen uitvoeringsafhankelijkheden binnen de opruimgrens van die Plugin blijven.

Gepubliceerde npm-Plugin-pakketten kunnen `npm-shrinkwrap.json` meeleveren; npm gebruikt dat
publiceerbare lockbestand tijdens de installatie en de beheerde npm-projectbasismap van OpenClaw
ondersteunt dit via het normale installatiepad. Publiceerbare Plugin-pakketten die door OpenClaw
worden beheerd, moeten een pakketlokale shrinkwrap bevatten die is gegenereerd op basis van de
gepubliceerde afhankelijkheidsgraaf van dat pakket:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

De generator verwijdert `devDependencies` van de Plugin, past het workspace-overridebeleid
toe en schrijft `extensions/<id>/npm-shrinkwrap.json` voor elke Plugin met
`openclaw.release.publishToNpm: true`. Plugin-pakketten van derden kunnen eveneens
een shrinkwrap meeleveren; OpenClaw vereist er geen voor communitypakketten, maar
npm respecteert deze wanneer hij aanwezig is.

Voordat u een lokaal pakket als bewijs voor een releasekandidaat beschouwt, inspecteert u het
tararchief dat zal worden geïnstalleerd:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Controleer bij wijzigingen aan afhankelijkheden ook of een productie-installatie de
uitvoeringspakketten zonder ontwikkelingsafhankelijkheden kan vinden:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Door OpenClaw beheerde npm-Plugin-pakketten kunnen ook worden gepubliceerd met expliciete
`bundledDependencies`. Het npm-publicatiepad legt de lijst met namen van uitvoeringsafhankelijkheden
eroverheen, verwijdert workspace-metagegevens die alleen voor ontwikkeling dienen uit het gepubliceerde manifest,
voert een npm-installatie zonder scripts uit voor de pakketlokale uitvoeringsafhankelijkheden
en verpakt of publiceert vervolgens het Plugin-tararchief met die afhankelijkheidsbestanden
erbij. Pakketten met veel native onderdelen (Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon) kiezen hiervoor niet met
`openclaw.release.bundleRuntimeDependencies: false`; ze leveren nog steeds een
shrinkwrap mee, maar npm zoekt de uitvoeringsafhankelijkheden tijdens de installatie op in plaats van
elk platformbinair bestand in het Plugin-tararchief in te sluiten. Het hoofdpakket `openclaw`
bundelt niet zijn volledige afhankelijkheidsstructuur.

Plugins die `openclaw/plugin-sdk/*` importeren, declareren `openclaw` als peer-
afhankelijkheid. OpenClaw staat niet toe dat npm een afzonderlijke registerkopie van het
hostpakket in een beheerd project installeert, omdat een verouderd hostpakket de
peer-resolutie van npm binnen die Plugin kan beïnvloeden. Beheerde npm-installaties slaan de
peer-resolutie en -materialisatie van npm over, en OpenClaw herstelt Plugin-lokale
`node_modules/openclaw`-koppelingen voor geïnstalleerde pakketten die de host-peer
declareren, na installatie of update.

git-installaties klonen of vernieuwen de repository en voeren vervolgens het volgende uit:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

De geïnstalleerde Plugin wordt vervolgens vanuit die pakketmap geladen, zodat
pakketlokale en bovenliggende `node_modules`-resolutie hetzelfde werken als
voor een normaal Node-pakket.

## Lokale Plugins

Lokale Plugins zijn door ontwikkelaars beheerde mappen. OpenClaw voert hiervoor nooit
`npm install`, `pnpm install` of herstel van afhankelijkheden uit; als een lokale
Plugin afhankelijkheden heeft, installeert u deze in die Plugin voordat u hem laadt.

Lokale TypeScript-Plugins van derden worden als noodoplossing via Jiti geladen.
Verpakte JavaScript-Plugins en gebundelde interne Plugins worden in plaats daarvan via native
import/require geladen.

## Opstarten en opnieuw laden

Het opstarten van de Gateway en het opnieuw laden van de configuratie installeren nooit Plugin-afhankelijkheden. Ze
lezen de installatiegegevens van de Plugin, bepalen het toegangspunt en laden dit.

Een ontbrekende afhankelijkheid tijdens uitvoering laat het laden van de Plugin mislukken met een foutmelding die
de beheerder naar een expliciete oplossing verwijst:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` ruimt verouderde, door OpenClaw gegenereerde afhankelijkheidsstatus op en kan
downloadbare Plugins herstellen die ontbreken in lokale installatiegegevens wanneer
de configuratie er nog steeds naar verwijst. Doctor herstelt geen afhankelijkheden voor een
reeds geïnstalleerde lokale Plugin.

## Gebundelde Plugins

Lichtgewicht en voor de core essentiële gebundelde Plugins worden als onderdeel van OpenClaw geleverd. Ze
moeten óf geen zware structuur van uitvoeringsafhankelijkheden bevatten, óf worden verplaatst naar een
downloadbaar pakket op ClawHub/npm.

Zie voor de huidige gegenereerde lijst van Plugins die in het corepakket worden geleverd,
extern worden geïnstalleerd of alleen als broncode blijven bestaan:
[Plugin-inventaris](/nl/plugins/plugin-inventory).

Manifesten van gebundelde Plugins mogen niet om het klaarzetten van afhankelijkheden vragen. Grote of
optionele Plugin-functionaliteit moet als normale Plugin worden verpakt en
via hetzelfde npm-/git-/ClawHub-pad als Plugins van derden worden geïnstalleerd.

In broncodecheck-outs behandelt OpenClaw de repository als een pnpm-monorepo.
Na `pnpm install` worden gebundelde Plugins vanuit `extensions/<id>` geladen, zodat
pakketlokale workspace-afhankelijkheden beschikbaar zijn en wijzigingen direct worden
overgenomen. Ontwikkeling vanuit een broncodecheck-out werkt uitsluitend met pnpm; een gewone `npm install` in
de basismap van de repository bereidt de afhankelijkheden van gebundelde Plugins niet voor.

| Installatiestructuur              | Locatie van gebundelde Plugin          | Eigenaar van afhankelijkheden                                            |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `npm install -g openclaw`         | Gebouwde uitvoeringsstructuur in het pakket | OpenClaw-pakket en expliciete installatie-, update- en doctor-stromen voor Plugins |
| Git-check-out plus `pnpm install` | `extensions/<id>`-workspacepakketten   | De pnpm-workspace, inclusief de eigen afhankelijkheden van elk Plugin-pakket |
| `openclaw plugins install ...`    | Beheerde npm-project-/git-/ClawHub-basismap | De installatie- en updatestroom van de Plugin                            |

## Opruimen van verouderde gegevens

Oudere OpenClaw-versies genereerden basismappen voor afhankelijkheden van gebundelde Plugins tijdens het opstarten
of tijdens herstel door doctor. De huidige opruimfunctie van doctor verwijdert met `--fix` die verouderde
mappen en symbolische koppelingen, waaronder oude `plugin-runtime-deps`-
basismappen, globale pakketsymbolische koppelingen voor het Node-prefix die verwijzen naar opgeschoonde
`plugin-runtime-deps`-doelen, `.openclaw-runtime-deps*`-manifesten, gegenereerde
`node_modules` van Plugins, installatiefasemappen en pakketlokale pnpm-
opslagplaatsen. De postinstallatiestap van het verpakte pakket verwijdert die globale symbolische koppelingen eveneens voordat
de verouderde doelbasismappen worden opgeschoond, zodat upgrades geen loshangende ESM-
pakketimports achterlaten.

Oudere npm-installaties gebruikten ook een gedeelde basismap `~/.openclaw/npm/node_modules`.
De huidige installatie-, update-, de-installatie- en doctor-stromen herkennen die
verouderde platte basismap nog steeds, uitsluitend voor herstel en opruiming. Nieuwe npm-installaties maken
in plaats daarvan projectbasismappen per Plugin aan.
