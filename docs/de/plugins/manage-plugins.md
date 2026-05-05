---
read_when:
    - Sie möchten schnelle Beispiele zum Installieren, Auflisten, Aktualisieren oder Deinstallieren von Plugins
    - Sie möchten zwischen ClawHub und der Plugin-Distribution über npm wählen
    - Sie veröffentlichen ein Plugin-Paket
sidebarTitle: Manage plugins
summary: Kurze Beispiele zum Installieren, Auflisten, Deinstallieren, Aktualisieren und Veröffentlichen von OpenClaw-Plugins
title: Plugins verwalten
x-i18n:
    generated_at: "2026-05-05T01:48:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Die meisten Plugin-Workflows bestehen aus wenigen Befehlen: suchen, installieren, den Gateway neu starten, verifizieren und deinstallieren, wenn Sie das Plugin nicht mehr benötigen.

## Plugins auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--json` für Skripte. Es enthält Registry-Diagnosen und den
statischen `dependencyStatus` jedes Plugins, wenn das Plugin-Paket `dependencies`
oder `optionalDependencies` deklariert.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` ist eine Bestandsprüfung ohne Laufzeitstart. Sie zeigt, was OpenClaw
aus Konfiguration, Manifesten und der Plugin-Registry erkennen kann; sie belegt
nicht, dass ein bereits laufender Gateway-Prozess die Plugin-Laufzeit importiert hat.

## Plugins installieren

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

Starten Sie nach der Installation von Plugin-Code den Gateway neu, der Ihre Kanäle bedient:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Verwenden Sie `inspect --runtime`, wenn Sie einen Nachweis benötigen, dass das Plugin
Laufzeitoberflächen wie Tools, Hooks, Services, Gateway-Methoden oder Plugin-eigene
CLI-Befehle registriert hat.

## Plugins aktualisieren

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Wenn ein Plugin von einem npm-dist-tag wie `@beta` installiert wurde, verwenden spätere
`update <plugin-id>`-Aufrufe dieses aufgezeichnete Tag wieder. Durch Übergabe einer
expliziten npm-Angabe wird die nachverfolgte Installation für zukünftige Updates auf
diese Angabe umgestellt.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Der zweite Befehl verschiebt ein Plugin zurück auf die Standard-Release-Linie der Registry,
wenn es zuvor auf eine genaue Version oder ein Tag festgelegt war.

Wenn `openclaw update` im Beta-Kanal ausgeführt wird, versuchen npm- und ClawHub-
Plugin-Einträge der Standardlinie zuerst das passende Plugin-Release `@beta`. Wenn dieses
Beta-Release nicht existiert, fällt OpenClaw auf die aufgezeichnete Standard-/Latest-Angabe
zurück. Bei npm-Plugins fällt OpenClaw auch dann zurück, wenn das Beta-Paket existiert,
aber die Installationsvalidierung fehlschlägt. Genaue Versionen und explizite Tags wie
`@rc` oder `@beta` bleiben erhalten.

## Plugins deinstallieren

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Die Deinstallation entfernt den Konfigurationseintrag des Plugins, den Plugin-Indexeintrag,
Allow-/Deny-List-Einträge und verknüpfte Ladepfade, sofern zutreffend. Verwaltete
Installationsverzeichnisse werden entfernt, sofern Sie nicht `--keep-files` übergeben.

## Plugins veröffentlichen

Sie können externe Plugins auf [ClawHub](https://clawhub.ai), npmjs.com oder beidem
veröffentlichen.

### Auf ClawHub veröffentlichen

ClawHub ist die primäre öffentliche Auffindbarkeitsoberfläche für OpenClaw-Plugins. Sie bietet
Benutzern vor der Installation durchsuchbare Metadaten, Versionsverlauf und Registry-Scanergebnisse.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Benutzer installieren von ClawHub mit:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Die Form ohne Präfix prüft weiterhin zuerst ClawHub.

### Auf npmjs.com veröffentlichen

Native npm-Plugins müssen ein Plugin-Manifest und OpenClaw-Entrypoint-Metadaten in
`package.json` enthalten.

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

Benutzer installieren reine npm-Plugins mit:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Wenn dasselbe Paket auch auf ClawHub verfügbar ist, überspringt `npm:` die ClawHub-Suche
und erzwingt die npm-Auflösung.

## Quellenauswahl

- **ClawHub**: verwenden, wenn Sie OpenClaw-native Auffindbarkeit, Scan-Zusammenfassungen,
  Versionen und Installationshinweise wünschen.
- **npmjs.com**: verwenden, wenn Sie bereits JavaScript-Pakete ausliefern oder npm-
  dist-tags/private Registry-Workflows benötigen.
- **Git**: verwenden, wenn Sie direkt von einem Branch, Tag oder Commit installieren möchten.
- **Lokaler Pfad**: verwenden, wenn Sie ein Plugin auf demselben Computer entwickeln oder testen.

## Verwandte Themen

- [Plugins](/de/tools/plugin) - Übersicht und Fehlerbehebung
- [`openclaw plugins`](/de/cli/plugins) - vollständige CLI-Referenz
- [ClawHub](/de/tools/clawhub) - Veröffentlichung und Registry-Vorgänge
- [Plugins erstellen](/de/plugins/building-plugins) - ein Plugin-Paket erstellen
- [Plugin-Manifest](/de/plugins/manifest) - Manifest- und Paketmetadaten
