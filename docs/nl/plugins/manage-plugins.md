---
read_when:
    - Je wilt snelle voorbeelden voor het installeren, weergeven, bijwerken of verwijderen van Plugins
    - Je wilt kiezen tussen ClawHub en npm voor Plugin-distributie
    - Je publiceert een Plugin-pakket
sidebarTitle: Manage plugins
summary: Korte voorbeelden voor het installeren, weergeven, verwijderen, bijwerken en publiceren van OpenClaw-plugins
title: Plugins beheren
x-i18n:
    generated_at: "2026-05-06T17:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

De meeste Plugin-workflows bestaan uit een paar opdrachten: zoeken, installeren, de Gateway opnieuw starten,
verifiëren, en de Plugin verwijderen wanneer je die niet meer nodig hebt.

## Plugins weergeven

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gebruik `--json` voor scripts. Dit bevat registry-diagnostiek en de statische
`dependencyStatus` van elke Plugin wanneer het Plugin-pakket `dependencies` of
`optionalDependencies` declareert.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` is een koude inventariscontrole. Het toont wat OpenClaw kan ontdekken
uit config, manifests en de Plugin-registry; het bewijst niet dat een
al draaiend Gateway-proces de Plugin-runtime heeft geïmporteerd.

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

Nadat je Plugin-code hebt geïnstalleerd, start je de Gateway opnieuw die je kanalen bedient:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gebruik `inspect --runtime` wanneer je bewijs nodig hebt dat de Plugin runtime-oppervlakken
heeft geregistreerd, zoals tools, hooks, services, Gateway-methoden of CLI-opdrachten
die eigendom zijn van de Plugin.

## Plugins bijwerken

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Als een Plugin is geïnstalleerd vanaf een npm-dist-tag zoals `@beta`, gebruiken latere
aanroepen van `update <plugin-id>` die vastgelegde tag opnieuw. Door een expliciete npm-spec
mee te geven, wordt de gevolgde installatie voor toekomstige updates naar die spec overgezet.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

De tweede opdracht zet een Plugin terug naar de standaard releaselijn van de registry
wanneer die eerder was vastgezet op een exacte versie of tag.

Wanneer `openclaw update` op het bètakanaal draait, proberen npm- en ClawHub-
Plugin-records op de standaardlijn eerst de overeenkomende Plugin-release `@beta`.
Als die bètarelease niet bestaat, valt OpenClaw terug op de vastgelegde standaard-/latest-spec.
Voor npm-Plugins valt OpenClaw ook terug wanneer het bètapakket bestaat maar niet door
installatievalidatie komt. Exacte versies en expliciete tags zoals `@rc` of `@beta`
blijven behouden.

## Plugins verwijderen

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Verwijderen wist de configvermelding van de Plugin, het Plugin-indexrecord, allow/deny-list
vermeldingen en gekoppelde laadpaden wanneer van toepassing. Beheerde installatiemappen worden
verwijderd tenzij je `--keep-files` meegeeft.

In Nix-modus (`OPENCLAW_NIX_MODE=1`) zijn opdrachten voor het installeren, bijwerken, verwijderen,
inschakelen en uitschakelen van Plugins uitgeschakeld. Beheer die keuzes in plaats daarvan in de
Nix-bron voor de installatie; gebruik voor nix-openclaw de agent-first
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).

## Plugins publiceren

Je kunt externe Plugins publiceren naar [ClawHub](https://clawhub.ai), npmjs.com of
beide.

### Publiceren naar ClawHub

ClawHub is het primaire openbare discovery-oppervlak voor OpenClaw-Plugins. Het geeft
gebruikers doorzoekbare metadata, versiegeschiedenis en registry-scanresultaten vóór
installatie.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Gebruikers installeren vanaf ClawHub met:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

De kale vorm controleert nog steeds eerst ClawHub.

### Publiceren naar npmjs.com

Native npm-Plugins moeten een Plugin-manifest en `package.json`-entrypointmetadata
voor OpenClaw bevatten.

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

Gebruikers installeren npm-only met:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Als hetzelfde pakket ook beschikbaar is op ClawHub, slaat `npm:` de ClawHub-lookup over en
forceert het npm-resolutie.

## Bronkeuze

- **ClawHub**: gebruik dit wanneer je OpenClaw-native discovery, scansamenvattingen,
  versies en installatiehints wilt.
- **npmjs.com**: gebruik dit wanneer je al JavaScript-pakketten uitbrengt of npm-
  dist-tags/private registry-workflows nodig hebt.
- **Git**: gebruik dit wanneer je rechtstreeks vanaf een branch, tag of commit wilt installeren.
- **Lokaal pad**: gebruik dit wanneer je een Plugin op dezelfde machine ontwikkelt of test.

## Gerelateerd

- [Plugins](/nl/tools/plugin) - overzicht en probleemoplossing
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [ClawHub](/nl/tools/clawhub) - publicatie- en registry-bewerkingen
- [Plugins bouwen](/nl/plugins/building-plugins) - maak een Plugin-pakket
- [Plugin-manifest](/nl/plugins/manifest) - manifest- en pakketmetadata
