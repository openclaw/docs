---
doc-schema-version: 1
read_when:
    - Sie möchten schnelle Beispiele zum Auflisten, Installieren, Aktualisieren, Prüfen oder Deinstallieren von Plugins
    - Sie möchten eine Plugin-Installationsquelle auswählen
    - Sie benötigen die richtige Referenz zum Veröffentlichen von Plugin-Paketen
sidebarTitle: Manage plugins
summary: Kurze Beispiele zum Auflisten, Installieren, Aktualisieren, Prüfen und Deinstallieren von OpenClaw-Plugins
title: Plugins verwalten
x-i18n:
    generated_at: "2026-06-27T17:49:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Verwenden Sie diese Seite für häufige Befehle zur Plugin-Verwaltung. Den vollständigen Befehlsvertrag,
Flags, Regeln zur Quellenauswahl und Randfälle finden Sie unter
[`openclaw plugins`](/de/cli/plugins).

Die meisten Installationsabläufe bestehen aus:

1. Paket finden
2. es aus ClawHub, npm, git oder einem lokalen Pfad installieren
3. den verwalteten Gateway automatisch neu starten lassen oder ihn manuell neu starten, wenn er nicht verwaltet wird
4. die Runtime-Registrierungen des Plugins prüfen

## Plugins auflisten und suchen

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Verwenden Sie `--json` für Skripte:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` ist eine kalte Bestandsprüfung. Sie zeigt, was OpenClaw
aus Konfiguration, Manifesten und der Plugin-Registry erkennen kann; sie beweist nicht, dass ein
bereits laufender Gateway die Plugin-Runtime importiert hat. Die JSON-Ausgabe enthält
Registry-Diagnosen und den statischen `dependencyStatus` jedes Plugins, wenn das
Plugin-Paket `dependencies` oder `optionalDependencies` deklariert.

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
Installationshinweise wie `openclaw plugins install clawhub:<package>` aus.

## Plugins installieren

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

Reine Paketspezifikationen installieren während der Launch-Umstellung aus npm. Verwenden Sie `clawhub:`,
`npm:`, `git:` oder `npm-pack:`, wenn Sie eine deterministische Quellenauswahl benötigen.
Wenn der reine Name mit einer offiziellen Plugin-ID übereinstimmt, kann OpenClaw den
Katalogeintrag direkt installieren.

Verwenden Sie `--force` nur, wenn Sie bewusst ein vorhandenes Installationsziel
überschreiben möchten. Für routinemäßige Upgrades nachverfolgter npm-, ClawHub- oder hook-pack-Installationen verwenden Sie
`openclaw plugins update`.

## Neu starten und prüfen

Nach dem Installieren, Aktualisieren oder Deinstallieren von Plugin-Code startet ein laufender verwalteter
Gateway mit aktivierter Konfigurations-Neuladung automatisch neu. Wenn der Gateway nicht
verwaltet wird oder das Neuladen deaktiviert ist, starten Sie ihn selbst neu, bevor Sie Live-Runtime-Flächen
prüfen:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Verwenden Sie `inspect --runtime`, wenn Sie einen Nachweis benötigen, dass das Plugin Runtime-Flächen
wie Tools, Hooks, Dienste, Gateway-Methoden, HTTP-Routen oder
Plugin-eigene CLI-Befehle registriert hat. Reines `inspect` und `list` sind kalte Manifest-,
Konfigurations- und Registry-Prüfungen.

## Plugins aktualisieren

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die nachverfolgte Installationsspezifikation erneut. Gespeicherte
dist-tags wie `@beta` und exakt fixierte Versionen werden auch bei späteren
`update <plugin-id>`-Läufen weiter verwendet.

`openclaw plugins update --all` ist der Pfad für Massenwartung. Er respektiert weiterhin
gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-Plugin-Datensätze können
mit dem aktuellen offiziellen Katalogziel synchronisieren, statt auf einem veralteten exakten
offiziellen Paket zu bleiben. Wenn `update.channel` auf `beta` gesetzt ist, verwendet diese offizielle Massensynchronisierung
den Beta-Kanal-Kontext. Verwenden Sie ein gezieltes `update <plugin-id>`, wenn Sie
eine exakte oder getaggte offizielle Spezifikation bewusst unverändert lassen möchten.

Bei npm-Installationen können Sie eine explizite Paketspezifikation übergeben, um den nachverfolgten
Datensatz zu wechseln:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Der zweite Befehl verschiebt ein Plugin zurück auf die Standard-Release-Linie der Registry,
wenn es zuvor auf eine exakte Version oder ein Tag fixiert war.

Wenn `openclaw update` auf dem Beta-Kanal ausgeführt wird, können Plugin-Datensätze passende
`@beta`-Releases bevorzugen. Die genauen Fallback- und Fixierungsregeln finden Sie unter
[`openclaw plugins`](/de/cli/plugins#update).

## Plugins deinstallieren

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Deinstallieren entfernt den Konfigurationseintrag des Plugins, den persistierten Plugin-Indexdatensatz,
Einträge in Zulassungs-/Sperrlisten und verknüpfte Ladepfade, sofern zutreffend. Verwaltete Installationsverzeichnisse
werden entfernt, sofern Sie nicht `--keep-files` übergeben. Ein laufender verwalteter
Gateway startet automatisch neu, wenn die Deinstallation die Plugin-Quelle ändert.

Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind die Befehle zum Installieren, Aktualisieren, Deinstallieren, Aktivieren
und Deaktivieren von Plugins deaktiviert. Verwalten Sie diese Auswahl stattdessen in der Nix-Quelle für
die Installation.

## Quelle auswählen

| Quelle      | Verwenden, wenn                                                              | Beispiel                                                       |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Sie OpenClaw-native Auffindbarkeit, Scan-Zusammenfassungen, Versionen und Hinweise möchten | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Sie bereits JavaScript-Pakete ausliefern oder npm-dist-tags/private Registry benötigen | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Sie einen Branch, ein Tag oder einen Commit aus einem Repository möchten    | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad | Sie ein Plugin auf derselben Maschine entwickeln oder testen                | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Sie ein lokales Paketartefakt über npm-Installationssemantik nachweisen      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| Marketplace | Sie ein Claude-kompatibles Marketplace-Plugin installieren                  | `openclaw plugins install <plugin> --marketplace <source>`     |

Verwaltete lokale Pfadinstallationen müssen Plugin-Verzeichnisse oder Archive sein. Legen Sie
eigenständige Plugin-Dateien in `plugins.load.paths` ab, statt sie mit
`plugins install` zu installieren.

## Plugins veröffentlichen

ClawHub ist die primäre öffentliche Auffindbarkeitsfläche für OpenClaw-Plugins. Veröffentlichen
Sie dort, wenn Benutzer Plugin-Metadaten, Versionsverlauf, Registry-Scan-Ergebnisse
und Installationshinweise finden sollen, bevor sie installieren.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Native npm-Plugins müssen vor der Veröffentlichung ein Plugin-Manifest und Paketmetadaten enthalten:

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

Verwenden Sie diese Seiten für den vollständigen Veröffentlichungsvertrag, statt diese Seite
als Veröffentlichungsreferenz zu behandeln:

- [ClawHub-Veröffentlichung](/de/clawhub/publishing) erklärt Eigentümer, Scopes, Releases,
  Review, Paketvalidierung und Paketübertragung.
- [Plugins erstellen](/de/plugins/building-plugins) zeigt die Form des Plugin-Pakets
  und den ersten Veröffentlichungsablauf.
- [Plugin-Manifest](/de/plugins/manifest) definiert native Plugin-Manifestfelder.

Wenn dasselbe Paket sowohl auf ClawHub als auch auf npm verfügbar ist, verwenden Sie das explizite
Präfix `clawhub:` oder `npm:`, wenn Sie eine Quelle erzwingen müssen.

## Verwandte Themen

- [Plugins](/de/tools/plugin) - installieren, konfigurieren, neu starten und Fehler beheben
- [`openclaw plugins`](/de/cli/plugins) - vollständige CLI-Referenz
- [Community-Plugins](/de/plugins/community) - öffentliche Auffindbarkeit und ClawHub-Veröffentlichung
- [ClawHub](/de/clawhub/cli) - Registry-CLI-Operationen
- [Plugins erstellen](/de/plugins/building-plugins) - ein Plugin-Paket erstellen
- [Plugin-Manifest](/de/plugins/manifest) - Manifest- und Paketmetadaten
