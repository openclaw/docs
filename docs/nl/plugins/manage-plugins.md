---
read_when:
    - Je wilt snelle voorbeelden voor het installeren, weergeven, bijwerken of verwijderen van Plugins
    - Je wilt kiezen tussen ClawHub en distributie van Plugins via npm
    - Je publiceert een Plugin-pakket
sidebarTitle: Manage plugins
summary: Korte voorbeelden voor het installeren, weergeven, verwijderen, bijwerken en publiceren van OpenClaw-plugins
title: Plugins beheren
x-i18n:
    generated_at: "2026-05-02T20:46:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

De meeste Plugin-workflows bestaan uit een paar commando's: zoeken, installeren, de Gateway opnieuw starten,
verifiëren en de-installeren wanneer je de Plugin niet meer nodig hebt.

## Plugins weergeven

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Gebruik `--json` voor scripts. Het bevat registerdiagnoses en de statische
`dependencyStatus` van elke Plugin wanneer het Plugin-pakket `dependencies` of
`optionalDependencies` declareert.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` is een koude inventariscontrole. Het toont wat OpenClaw kan ontdekken
uit configuratie, manifesten en het Plugin-register; het bewijst niet dat een
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
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Start na het installeren van Plugin-code de Gateway opnieuw die je kanalen bedient:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Gebruik `inspect --runtime` wanneer je bewijs nodig hebt dat de Plugin runtime-oppervlakken
heeft geregistreerd, zoals tools, hooks, services, Gateway-methoden of CLI-commando's
die eigendom zijn van de Plugin.

## Plugins bijwerken

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Als een Plugin is geïnstalleerd vanuit een npm-dist-tag zoals `@beta`, gebruiken latere
aanroepen van `update <plugin-id>` die geregistreerde tag opnieuw. Het doorgeven van een expliciete npm-specificatie
schakelt de bijgehouden installatie voor toekomstige updates over naar die specificatie.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Het tweede commando zet een Plugin terug naar de standaardreleaselijn van het register
wanneer deze eerder was vastgepind op een exacte versie of tag.

Wanneer `openclaw update` op het bètakanaal draait, proberen npm- en ClawHub-
Plugin-records op de standaardlijn eerst de overeenkomende Plugin-`@beta`-release. Als die bèta-
release niet bestaat, valt OpenClaw terug op de geregistreerde standaard-/nieuwste specificatie.
Exacte versies en expliciete tags zoals `@rc` of `@beta` blijven behouden.

## Plugins de-installeren

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

De-installeren verwijdert de configuratievermelding van de Plugin, het Plugin-indexrecord, allow/deny-list-
vermeldingen en gekoppelde laadpaden waar van toepassing. Beheerde installatiemappen worden
verwijderd tenzij je `--keep-files` doorgeeft.

## Plugins publiceren

Je kunt externe Plugins publiceren naar [ClawHub](https://clawhub.ai), npmjs.com of
beide.

### Publiceren naar ClawHub

ClawHub is het primaire openbare ontdekkingsoppervlak voor OpenClaw-Plugins. Het geeft
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

Native npm-Plugins moeten een Plugin-manifest en OpenClaw-
entrypointmetadata in `package.json` bevatten.

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

Als hetzelfde pakket ook beschikbaar is op ClawHub, slaat `npm:` het zoeken in ClawHub over en
forceert het npm-resolutie.

## Bronkeuze

- **ClawHub**: gebruik dit wanneer je OpenClaw-native ontdekking, scansamenvattingen,
  versies en installatiehints wilt.
- **npmjs.com**: gebruik dit wanneer je al JavaScript-pakketten levert of npm-
  dist-tags/private-register-workflows nodig hebt.
- **Git**: gebruik dit wanneer je rechtstreeks wilt installeren vanaf een branch, tag of commit.
- **Lokaal pad**: gebruik dit wanneer je een Plugin op dezelfde
  machine ontwikkelt of test.

## Gerelateerd

- [Plugins](/nl/tools/plugin) - overzicht en probleemoplossing
- [`openclaw plugins`](/nl/cli/plugins) - volledige CLI-referentie
- [ClawHub](/nl/tools/clawhub) - publiceren en registerbewerkingen
- [Plugins bouwen](/nl/plugins/building-plugins) - een Plugin-pakket maken
- [Plugin-manifest](/nl/plugins/manifest) - manifest- en pakketmetadata
