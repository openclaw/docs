---
doc-schema-version: 1
read_when:
    - Je wilt plugins bekijken, installeren, inschakelen of uitschakelen in de Control UI
    - Je wilt snelle voorbeelden voor het weergeven, installeren, bijwerken, inspecteren of verwijderen van plugins
    - Je wilt een installatiebron voor een Plugin kiezen
    - Je zoekt de juiste referentie voor het publiceren van Plugin-pakketten
sidebarTitle: Manage plugins
summary: Beheer OpenClaw-plugins via de Control UI of CLI
title: Plugins beheren
x-i18n:
    generated_at: "2026-07-12T09:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

De Control UI omvat de gebruikelijke workflow voor het ontdekken, installeren, inschakelen en uitschakelen van plugins. De CLI voegt bijwerken, verwijderen, geavanceerde configuratie en expliciete besturing van installatiebronnen toe. Zie [`openclaw plugins`](/nl/cli/plugins) voor het volledige commandocontract, de vlaggen, regels voor bronselectie en randgevallen.

Typische CLI-workflow: zoek een pakket, installeer het vanuit ClawHub, npm, git of een lokaal pad, laat de beheerde Gateway automatisch opnieuw starten (of start deze handmatig opnieuw) en controleer vervolgens de runtimeregistraties van de plugin.

## De Control UI gebruiken

Open **Plugins** in de Control UI of gebruik `/settings/plugins` relatief ten opzichte van het geconfigureerde basispad van de Control UI. Een basispad van `/openclaw` gebruikt bijvoorbeeld `/openclaw/settings/plugins`. De pagina heeft twee tabbladen:

- **Geïnstalleerd** toont de volledige lokale inventaris, gegroepeerd op categorie (kanalen, modelproviders, geheugen, tools). Elke rij opent een detailweergave; via het overloopmenu (`…`) kunt u de plugin in- of uitschakelen en voor extern geïnstalleerde plugins is **Verwijderen** beschikbaar. Het tabblad vermeldt ook de geconfigureerde [MCP-servers](/nl/cli/mcp), met dezelfde menugestuurde acties voor inschakelen, uitschakelen en verwijderen, waarbij `mcp.servers` in de Gateway-configuratie wordt bewerkt.
- **Ontdekken** is de winkel: uitgelichte plugins die bij OpenClaw zijn inbegrepen, officiële externe plugins en een samengestelde verzameling connectors. Connectorkaarten voegen met één klik een gehoste MCP-server toe (GitHub, Notion, Linear, Sentry, Home Assistant) of openen een vooraf ingevulde zoekopdracht in ClawHub. Als u in het zoekvak typt, wordt [ClawHub](https://clawhub.ai/plugins) rechtstreeks doorzocht en wordt een sectie **Van ClawHub** toegevoegd met aantallen downloads en badges voor bronverificatie.

Inbegrepen plugins hoeven niet als pakket te worden geïnstalleerd. Hun menuactie is **Inschakelen** of **Uitschakelen**. Workboard is bijvoorbeeld bij OpenClaw inbegrepen en standaard uitgeschakeld; kies daarom **Inschakelen** om deze te activeren. Gebundelde plugins kunnen niet worden verwijderd, alleen uitgeschakeld.

Voor toegang tot de catalogus en zoekfunctie is `operator.read` vereist. Voor installeren, inschakelen, uitschakelen, verwijderen en wijzigingen aan MCP-servers is `operator.admin` vereist. Een installatie vanuit ClawHub wordt uitgevoerd door de Gateway en behoudt de controles voor vertrouwen, integriteit en het installatiebeleid voor plugins.

Voor het installeren of verwijderen van plugincode moet de Gateway opnieuw worden gestart. Wijzigingen in de inschakelstatus kunnen zonder herstart worden toegepast wanneer de geïnstalleerde plugin en de huidige Gateway-runtime dit ondersteunen; anders meldt de UI dat een herstart vereist is. MCP-connectors die OAuth gebruiken, vereisen na toevoeging nog steeds een eenmalige `openclaw mcp login <name>` via de CLI.

De Control UI installeert niet vanuit willekeurige npm-, git- of lokale-padbronnen, werkt plugins niet bij en biedt geen uitgebreide pluginconfiguratie. Gebruik voor deze bewerkingen de onderstaande CLI-workflows.

## Plugins weergeven en zoeken

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` voor scripts:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` is een koude inventariscontrole: wat OpenClaw kan ontdekken via configuratie, manifesten en het permanente pluginregister. Hiermee wordt niet bewezen dat een reeds actieve Gateway de pluginruntime heeft geïmporteerd. JSON-uitvoer bevat registerdiagnostiek en de `dependencyStatus` van elke plugin (of opgegeven `dependencies`/`optionalDependencies` op schijf kunnen worden gevonden).

`plugins search` doorzoekt ClawHub naar installeerbare pluginpakketten en toont per resultaat een installatietip (`openclaw plugins install clawhub:<package>`).

## Plugins inschakelen en uitschakelen

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Wijzigt de configuratievermelding van een plugin zonder geïnstalleerde bestanden aan te raken. Sommige gebundelde plugins (gebundelde model-/spraakproviders en de gebundelde browserplugin) zijn standaard ingeschakeld; voor andere is na installatie `enable` vereist.

## Plugins installeren

```bash
# ClawHub doorzoeken naar pluginpakketten.
openclaw plugins search "calendar"

# Installeren vanuit ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Installeren vanuit npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Installeren vanuit een lokaal npm-pack-artefact.
openclaw plugins install npm-pack:<path.tgz>

# Installeren vanuit git of een lokale ontwikkelcheckout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Ongekwalificeerde pakketspecificaties worden tijdens de overgang bij het starten vanuit npm geïnstalleerd, tenzij de naam overeenkomt met de id van een gebundelde of officiële plugin; in dat geval gebruikt OpenClaw in plaats daarvan die lokale/officiële kopie. Gebruik `clawhub:`, `npm:`, `git:` of `npm-pack:` voor deterministische bronselectie.

Gebruik `--force` alleen om een bestaand installatiedoel vanuit een andere bron te overschrijven. Gebruik voor routinematige upgrades van een gevolgde npm-, ClawHub- of hook-pack-installatie in plaats daarvan `openclaw plugins update`; `--force` wordt niet ondersteund in combinatie met `--link`.

## Opnieuw starten en inspecteren

Een actieve beheerde Gateway waarvoor het herladen van configuratie is ingeschakeld, start automatisch opnieuw na het installeren, bijwerken of verwijderen van plugincode. Als de Gateway niet wordt beheerd of herladen is uitgeschakeld, start u deze zelf opnieuw voordat u actieve runtime-oppervlakken controleert:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` laadt de pluginmodule en bewijst dat deze runtime-oppervlakken heeft geregistreerd (tools, hooks, services, Gateway-methoden, HTTP-routes en CLI-opdrachten die eigendom zijn van de plugin). Gewone `inspect` en `list` zijn uitsluitend koude controles van manifest, configuratie en register.

## Plugins bijwerken

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Als u een plugin-id opgeeft, wordt de gevolgde installatiespecificatie opnieuw gebruikt: opgeslagen dist-tags (`@beta`) en exact vastgezette versies worden overgenomen bij latere uitvoeringen van `update <plugin-id>`.

`openclaw plugins update --all` is de route voor bulkonderhoud. Gewone gevolgde installatiespecificaties worden nog steeds gerespecteerd, maar vertrouwde officiële OpenClaw-pluginrecords worden gesynchroniseerd met het huidige doel uit de officiële catalogus, in plaats van vastgezet te blijven op een verouderd exact officieel pakket; wanneer `update.channel` `beta` is, geeft die synchronisatie de voorkeur aan de bètaversielijn. Gebruik een gerichte `update <plugin-id>` om een exacte of getagde officiële specificatie ongewijzigd te laten.

Geef voor npm-installaties een expliciete pakketspecificatie op om het gevolgde record te wijzigen:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Met de tweede opdracht wordt een plugin teruggezet naar de standaardversielijn van het register wanneer deze eerder was vastgezet op een exacte versie of tag.

Zie [`openclaw plugins`](/nl/cli/plugins#update) voor de exacte regels voor terugval en vastzetten.

## Plugins verwijderen

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Bij verwijderen worden de configuratievermelding van de plugin, het permanente pluginindexrecord, vermeldingen in toestaan/weigeren-lijsten en, indien van toepassing, gekoppelde vermeldingen in `plugins.load.paths` verwijderd. De beheerde installatiemap wordt verwijderd, tenzij u `--keep-files` opgeeft. Een actieve beheerde Gateway start automatisch opnieuw wanneer door de verwijdering de pluginbron verandert.

In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn het installeren, bijwerken, verwijderen, inschakelen en uitschakelen van plugins allemaal uitgeschakeld; beheer deze keuzes in plaats daarvan in de Nix-bron voor de installatie.

## Een bron kiezen

| Bron        | Gebruiken wanneer                                                                    | Voorbeeld                                                       |
| ----------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| ClawHub     | U OpenClaw-eigen ontdekking, scansamenvattingen, versies en tips wilt                | `openclaw plugins install clawhub:<package>`                    |
| git         | U een branch, tag of commit uit een repository wilt                                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>`  |
| lokaal pad  | U op dezelfde machine een plugin ontwikkelt of test                                  | `openclaw plugins install --link ./my-plugin`                   |
| marktplaats | U een Claude-compatibele marktplaatsplugin installeert                               | `openclaw plugins install <plugin> --marketplace <source>`      |
| npm pack    | U een lokaal pakketartefact wilt valideren via de installatiesemantiek van npm       | `openclaw plugins install npm-pack:<path.tgz>`                  |
| npmjs.com   | U al JavaScript-pakketten distribueert of npm-dist-tags/een privéregister nodig hebt | `openclaw plugins install npm:@acme/openclaw-plugin`            |

Beheerde installaties vanaf een lokaal pad moeten pluginmappen of archieven zijn. Plaats zelfstandige pluginbestanden in `plugins.load.paths` in plaats van ze met `plugins install` te installeren.

## Plugins publiceren

ClawHub is het primaire openbare ontdekkingsplatform voor OpenClaw-plugins. Publiceer daar wanneer u wilt dat gebruikers pluginmetadata, versiegeschiedenis, scansresultaten van het register en installatietips kunnen vinden voordat ze installeren.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Eigen npm-plugins moeten vóór publicatie een pluginmanifest (`openclaw.plugin.json`) plus metadata in `package.json` bevatten:

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

Gebruik deze pagina's voor het volledige publicatiecontract in plaats van deze pagina als publicatiereferentie te beschouwen:

- [Publiceren op ClawHub](/nl/clawhub/publishing) legt eigenaren, scopes, releases, beoordeling, pakketvalidatie en pakketoverdracht uit.
- [Plugins bouwen](/nl/plugins/building-plugins) toont de volledige structuur van een pluginpakket (inclusief `openclaw.plugin.json`) en de workflow voor de eerste publicatie.
- [Pluginmanifest](/nl/plugins/manifest) definieert de velden van het eigen pluginmanifest.

Als hetzelfde pakket zowel op ClawHub als npm beschikbaar is, gebruikt u het expliciete voorvoegsel `clawhub:` of `npm:` om één bron af te dwingen.

## Gerelateerd

- [Plugins](/nl/tools/plugin) - installeren, configureren, opnieuw starten en problemen oplossen
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [Communityplugins](/nl/plugins/community) - openbare ontdekking en publiceren op ClawHub
- [ClawHub](/nl/clawhub/cli) - CLI-bewerkingen voor het register
- [Plugins bouwen](/nl/plugins/building-plugins) - een pluginpakket maken
- [Pluginmanifest](/nl/plugins/manifest) - manifest- en pakketmetadata
