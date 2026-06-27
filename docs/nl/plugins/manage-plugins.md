---
doc-schema-version: 1
read_when:
    - Je wilt snelle voorbeelden voor het tonen, installeren, bijwerken, inspecteren of verwijderen van plugins
    - Je wilt een Plugin-installatiebron kiezen
    - Je wilt de juiste referentie voor het publiceren van Plugin-pakketten
sidebarTitle: Manage plugins
summary: Snelle voorbeelden voor het weergeven, installeren, bijwerken, inspecteren en verwijderen van OpenClaw-plugins
title: Plugins beheren
x-i18n:
    generated_at: "2026-06-27T17:54:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Gebruik deze pagina voor algemene opdrachten voor Plugin-beheer. Zie
[`openclaw plugins`](/nl/cli/plugins) voor het volledige opdrachtcontract, de flags,
regels voor bronselectie en randgevallen.

De meeste installatieworkflows zijn:

1. een pakket vinden
2. het installeren vanuit ClawHub, npm, git of een lokaal pad
3. de beheerde Gateway automatisch laten herstarten, of deze handmatig herstarten wanneer hij onbeheerd is
4. de runtime-registraties van de Plugin verifiëren

## Plugins weergeven en zoeken

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Gebruik `--json` voor scripts:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` is een koude inventariscontrole. Deze toont wat OpenClaw kan ontdekken
uit configuratie, manifests en de Plugin-registry; het bewijst niet dat een
al draaiende Gateway de Plugin-runtime heeft geïmporteerd. De JSON-uitvoer bevat
registry-diagnostiek en de statische `dependencyStatus` van elke Plugin wanneer het
Plugin-pakket `dependencies` of `optionalDependencies` declareert.

`plugins search` doorzoekt ClawHub naar installeerbare Plugin-pakketten en toont
installatietips zoals `openclaw plugins install clawhub:<package>`.

## Plugins installeren

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Kale pakketspecificaties installeren vanuit npm tijdens de launch-cutover. Gebruik `clawhub:`,
`npm:`, `git:` of `npm-pack:` wanneer je deterministische bronselectie nodig hebt.
Als de kale naam overeenkomt met een officiële Plugin-id, kan OpenClaw de
catalogusvermelding direct installeren.

Gebruik `--force` alleen wanneer je bewust een bestaand installatiedoel wilt
overschrijven. Gebruik voor routinematige upgrades van bijgehouden npm-, ClawHub- of hook-pack-installaties
`openclaw plugins update`.

## Herstarten en inspecteren

Na het installeren, bijwerken of verwijderen van Plugin-code herstart een draaiende beheerde
Gateway met ingeschakelde configuratieherlaadfunctie automatisch. Als de Gateway niet
beheerd is of herladen is uitgeschakeld, herstart hem dan zelf voordat je live runtime-oppervlakken
controleert:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gebruik `inspect --runtime` wanneer je bewijs nodig hebt dat de Plugin runtime-oppervlakken
heeft geregistreerd, zoals tools, hooks, services, Gateway-methoden, HTTP-routes of
CLI-opdrachten die eigendom zijn van de Plugin. Gewone `inspect` en `list` zijn koude manifest-,
configuratie- en registry-controles.

## Plugins bijwerken

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Wanneer je een Plugin-id opgeeft, hergebruikt OpenClaw de bijgehouden installatiespecificatie. Opgeslagen
dist-tags zoals `@beta` en exact vastgepinde versies blijven gebruikt worden bij
latere uitvoeringen van `update <plugin-id>`.

`openclaw plugins update --all` is het pad voor bulkonderhoud. Het respecteert nog steeds
gewone bijgehouden installatiespecificaties, maar vertrouwde officiële OpenClaw Plugin-records kunnen
synchroniseren naar het huidige officiële catalogusdoel in plaats van op een verouderd exact
officieel pakket te blijven. Als `update.channel` is ingesteld op `beta`, gebruikt die officiële bulksynchronisatie
de context van het bètakanaal. Gebruik een gerichte `update <plugin-id>` wanneer je
bewust een exacte of getagde officiële specificatie onaangeroerd wilt laten.

Voor npm-installaties kun je een expliciete pakketspecificatie opgeven om het bijgehouden
record te wijzigen:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

De tweede opdracht verplaatst een Plugin terug naar de standaard releaselijn van de registry
wanneer deze eerder aan een exacte versie of tag was vastgepind.

Wanneer `openclaw update` op het bètakanaal draait, kunnen Plugin-records de voorkeur geven aan
overeenkomende `@beta`-releases. Zie voor de exacte fallback- en pinningregels
[`openclaw plugins`](/nl/cli/plugins#update).

## Plugins verwijderen

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Verwijderen verwijdert de configuratievermelding van de Plugin, het blijvend opgeslagen Plugin-indexrecord,
vermeldingen in de allow/deny-lijsten en gekoppelde laadpaden waar van toepassing. Beheerde installatiemappen
worden verwijderd tenzij je `--keep-files` opgeeft. Een draaiende beheerde
Gateway herstart automatisch wanneer de verwijdering de Plugin-bron wijzigt.

In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn opdrachten voor het installeren, bijwerken, verwijderen, inschakelen
en uitschakelen van Plugins uitgeschakeld. Beheer die keuzes in plaats daarvan in de Nix-bron voor
de installatie.

## Een bron kiezen

| Bron        | Gebruik wanneer                                                                 | Voorbeeld                                                      |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Je OpenClaw-native discovery, scan-samenvattingen, versies en hints wilt        | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Je al JavaScript-pakketten uitbrengt of npm dist-tags/private registry nodig hebt | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Je een branch, tag of commit uit een repository wilt                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaal pad  | Je een Plugin op dezelfde machine ontwikkelt of test                            | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Je een lokaal pakketartefact bewijst via npm-installatiesemantiek               | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Je een Claude-compatibele marketplace-Plugin installeert                        | `openclaw plugins install <plugin> --marketplace <source>`     |

Beheerde installaties via lokale paden moeten Plugin-mappen of archieven zijn. Plaats
losse Plugin-bestanden in `plugins.load.paths` in plaats van ze te installeren met
`plugins install`.

## Plugins publiceren

ClawHub is het primaire publieke discovery-oppervlak voor OpenClaw-Plugins. Publiceer
daar wanneer je wilt dat gebruikers Plugin-metadata, versiegeschiedenis, registry-
scanresultaten en installatietips vinden voordat ze installeren.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Native npm-Plugins moeten een Plugin-manifest en pakketmetadata bevatten voordat
ze worden gepubliceerd:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Gebruik deze pagina's voor het volledige publicatiecontract in plaats van deze pagina
als publicatiereferentie te behandelen:

- [ClawHub-publicatie](/nl/clawhub/publishing) legt eigenaren, scopes, releases,
  review, pakketvalidatie en pakketoverdracht uit.
- [Plugins bouwen](/nl/plugins/building-plugins) toont de vorm van het Plugin-pakket
  en de eerste publicatieworkflow.
- [Plugin-manifest](/nl/plugins/manifest) definieert native Plugin-manifestvelden.

Als hetzelfde pakket beschikbaar is op zowel ClawHub als npm, gebruik dan het expliciete
voorvoegsel `clawhub:` of `npm:` wanneer je één bron wilt afdwingen.

## Gerelateerd

- [Plugins](/nl/tools/plugin) - installeren, configureren, herstarten en problemen oplossen
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [Community-Plugins](/nl/plugins/community) - publieke discovery en ClawHub-publicatie
- [ClawHub](/nl/clawhub/cli) - registry-CLI-bewerkingen
- [Plugins bouwen](/nl/plugins/building-plugins) - een Plugin-pakket maken
- [Plugin-manifest](/nl/plugins/manifest) - manifest en pakketmetadata
