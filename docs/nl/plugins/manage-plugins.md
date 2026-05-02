---
read_when:
    - Je wilt snelle voorbeelden voor het installeren, weergeven, bijwerken of verwijderen van plugins
    - Je wilt kiezen tussen ClawHub en Plugin-distributie via npm
    - Je publiceert een Plugin-pakket
sidebarTitle: Manage plugins
summary: Korte voorbeelden voor het installeren, weergeven, verwijderen, bijwerken en publiceren van OpenClaw-plugins
title: Plugins beheren
x-i18n:
    generated_at: "2026-05-02T22:20:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

De meeste pluginworkflows bestaan uit een paar opdrachten: zoeken, installeren, de Gateway opnieuw starten,
verifiëren en verwijderen wanneer je de plugin niet meer nodig hebt.

## Plugins weergeven

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gebruik `--json` voor scripts. Dit bevat registerdiagnostiek en de statische
`dependencyStatus` van elke plugin wanneer het pluginpakket `dependencies` of
`optionalDependencies` declareert.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` is een koude inventariscontrole. Het toont wat OpenClaw kan ontdekken
uit configuratie, manifests en het pluginregister; het bewijst niet dat een
al draaiend Gateway-proces de pluginruntime heeft geïmporteerd.

## Plugins installeren

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Start na het installeren van plugincode de Gateway opnieuw die je kanalen bedient:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gebruik `inspect --runtime` wanneer je bewijs nodig hebt dat de plugin runtime-
oppervlakken heeft geregistreerd, zoals tools, hooks, services, Gateway-methoden
of CLI-opdrachten die eigendom zijn van de plugin.

## Plugins bijwerken

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Als een plugin is geïnstalleerd vanuit een npm-dist-tag zoals `@beta`, gebruiken latere
aanroepen van `update <plugin-id>` die vastgelegde tag opnieuw. Door een expliciete npm-spec
door te geven, wordt de bijgehouden installatie voor toekomstige updates naar die spec omgeschakeld.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

De tweede opdracht verplaatst een plugin terug naar de standaardreleaselijn van het register
wanneer die eerder was vastgezet op een exacte versie of tag.

Wanneer `openclaw update` op het bètakanaal wordt uitgevoerd, proberen pluginrecords
voor de standaardlijn van npm en ClawHub eerst de overeenkomende pluginrelease `@beta`.
Als die bètarelease niet bestaat, valt OpenClaw terug op de vastgelegde standaard-/laatste spec.
Exacte versies en expliciete tags zoals `@rc` of `@beta` blijven behouden.

## Plugins verwijderen

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Verwijderen wist de configuratievermelding van de plugin, het pluginindexrecord, vermeldingen
in de toestaan-/weigerenlijst en gekoppelde laadpaden wanneer van toepassing. Beheerde
installatiemappen worden verwijderd, tenzij je `--keep-files` doorgeeft.

## Plugins publiceren

Je kunt externe plugins publiceren naar [ClawHub](https://clawhub.ai), npmjs.com of
beide.

### Publiceren naar ClawHub

ClawHub is het primaire openbare ontdekkingsoppervlak voor OpenClaw-plugins. Het geeft
gebruikers doorzoekbare metadata, versiegeschiedenis en resultaten van registerscans vóór
installatie.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Gebruikers installeren vanuit ClawHub met:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

De kale vorm controleert nog steeds eerst ClawHub.

### Publiceren naar npmjs.com

Native npm-plugins moeten een pluginmanifest en OpenClaw-entrypointmetadata in
`package.json` bevatten.

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
```

Gebruikers installeren alleen-npm met:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Als hetzelfde pakket ook beschikbaar is op ClawHub, slaat `npm:` het opzoeken in ClawHub over en
dwingt het npm-resolutie af.

## Bronkeuze

- **ClawHub**: gebruik dit wanneer je OpenClaw-native ontdekking, scansamenvattingen,
  versies en installatietips wilt.
- **npmjs.com**: gebruik dit wanneer je al JavaScript-pakketten levert of npm-
  dist-tags/private-registerworkflows nodig hebt.
- **Git**: gebruik dit wanneer je rechtstreeks vanaf een branch, tag of commit wilt installeren.
- **Lokaal pad**: gebruik dit wanneer je een plugin op dezelfde machine ontwikkelt of test.

## Gerelateerd

- [Plugins](/nl/tools/plugin) - overzicht en probleemoplossing
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [ClawHub](/nl/tools/clawhub) - publiceren en registerbewerkingen
- [Plugins bouwen](/nl/plugins/building-plugins) - een pluginpakket maken
- [Pluginmanifest](/nl/plugins/manifest) - manifest- en pakketmetadata
