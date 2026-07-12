---
doc-schema-version: 1
read_when:
    - Sie möchten Plugins in der Control UI durchsuchen, installieren, aktivieren oder deaktivieren
    - Sie möchten kurze Beispiele zum Auflisten, Installieren, Aktualisieren, Prüfen oder Deinstallieren von Plugins.
    - Sie möchten eine Installationsquelle für ein Plugin auswählen
    - Sie suchen die richtige Referenz zum Veröffentlichen von Plugin-Paketen
sidebarTitle: Manage plugins
summary: Verwalten Sie OpenClaw-Plugins über die Control UI oder CLI
title: Plugins verwalten
x-i18n:
    generated_at: "2026-07-12T15:44:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Die Control UI deckt den üblichen Workflow zum Suchen, Installieren, Aktivieren und Deaktivieren
ab. Die CLI ergänzt Aktualisierung, Deinstallation, erweiterte Konfiguration und explizite
Steuerungsmöglichkeiten für die Installationsquelle. Den vollständigen Befehlsvertrag, die Flags, Regeln zur Quellenauswahl
und Sonderfälle finden Sie unter [`openclaw plugins`](/de/cli/plugins).

Typischer CLI-Workflow: Suchen Sie ein Paket, installieren Sie es aus ClawHub, npm, git oder über einen
lokalen Pfad, lassen Sie den verwalteten Gateway automatisch neu starten (oder starten Sie ihn manuell neu) und
überprüfen Sie anschließend die Laufzeitregistrierungen des Plugins.

## Control UI verwenden

Öffnen Sie **Plugins** in der Control UI oder verwenden Sie `/settings/plugins` relativ zum
konfigurierten Basispfad der Control UI. Beispielsweise wird bei einem Basispfad von `/openclaw`
`/openclaw/settings/plugins` verwendet. Die Seite hat zwei Registerkarten:

- **Installiert** zeigt den vollständigen lokalen Bestand, gruppiert nach Kategorien (Kanäle,
  Modell-Provider, Speicher, Tools). Jede Zeile öffnet eine Detailansicht; über das Überlaufmenü
  (`…`) können Sie das Plugin aktivieren oder deaktivieren und bei extern installierten
  Plugins **Entfernen** auswählen. Die Registerkarte führt außerdem die konfigurierten
  [MCP-Server](/de/cli/mcp) mit denselben menügesteuerten Aktionen zum Aktivieren, Deaktivieren und Entfernen
  auf, wobei `mcp.servers` in der Gateway-Konfiguration bearbeitet wird.
- **Entdecken** ist der Store: vorgestellte, in OpenClaw enthaltene Plugins, offizielle
  externe Plugins und eine kuratierte Auswahl an Konnektoren. Konnektorkarten fügen entweder mit einem
  Klick einen gehosteten MCP-Server hinzu (GitHub, Notion, Linear, Sentry,
  Home Assistant) oder öffnen eine vorausgefüllte ClawHub-Suche. Eingaben in das Suchfeld
  fragen [ClawHub](https://clawhub.ai/plugins) direkt ab und fügen einen Abschnitt **Von
  ClawHub** mit Downloadzahlen und Kennzeichnungen zur Quellenverifizierung hinzu.

Enthaltene Plugins müssen nicht als Paket installiert werden. Ihre Menüaktion lautet **Aktivieren**
oder **Deaktivieren**. Workboard ist beispielsweise in OpenClaw enthalten und standardmäßig
deaktiviert. Wählen Sie daher **Aktivieren**, um es einzuschalten. Gebündelte Plugins können nicht
entfernt, sondern nur deaktiviert werden.

Für den Zugriff auf Katalog und Suche ist `operator.read` erforderlich. Für Installation, Aktivierung, Deaktivierung,
Entfernung und Änderungen an MCP-Servern ist `operator.admin` erforderlich. Eine ClawHub-Installation wird
vom Gateway durchgeführt und behält dessen Richtlinienprüfungen für Vertrauen, Integrität und Plugin-Installationen
bei.

Das Installieren oder Entfernen von Plugin-Code erfordert einen Neustart des Gateways. Änderungen an der
Aktivierung können ohne Neustart angewendet werden, wenn das installierte Plugin und die aktuelle
Gateway-Laufzeit dies unterstützen; andernfalls weist die UI darauf hin, dass ein Neustart erforderlich ist.
OAuth-gestützte MCP-Konnektoren benötigen nach dem Hinzufügen weiterhin einmalig
`openclaw mcp login <name>` über die CLI.

Die Control UI installiert nicht aus beliebigen npm-, git- oder lokalen Pfadquellen,
aktualisiert keine Plugins und stellt keine umfangreiche Plugin-Konfiguration bereit. Verwenden Sie für diese
Vorgänge die folgenden CLI-Workflows.

## Plugins auflisten und suchen

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` für Skripte:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` ist eine Bestandsprüfung ohne Laufzeitinitialisierung: Sie zeigt, was OpenClaw anhand von
Konfiguration, Manifesten und der persistenten Plugin-Registry erkennen kann. Sie belegt nicht, dass ein
bereits laufender Gateway die Plugin-Laufzeit importiert hat. Die JSON-Ausgabe enthält
Registry-Diagnosen und den `dependencyStatus` jedes Plugins (ob deklarierte
`dependencies`/`optionalDependencies` auf dem Datenträger aufgelöst werden können).

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
für jedes Ergebnis einen Installationshinweis (`openclaw plugins install clawhub:<package>`) aus.

## Plugins aktivieren und deaktivieren

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Ändert den Konfigurationseintrag eines Plugins, ohne installierte Dateien zu verändern. Einige
gebündelte Plugins (gebündelte Modell-/Sprach-Provider und das gebündelte Browser-Plugin)
sind standardmäßig aktiviert; andere müssen nach der Installation mit `enable` aktiviert werden.

## Plugins installieren

```bash
# ClawHub nach Plugin-Paketen durchsuchen.
openclaw plugins search "calendar"

# Aus ClawHub installieren.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Aus npm installieren.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Aus einem lokalen npm-pack-Artefakt installieren.
openclaw plugins install npm-pack:<path.tgz>

# Aus git oder einem lokalen Entwicklungs-Checkout installieren.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Unpräfixierte Paketspezifikationen werden während der Startumstellung aus npm installiert, sofern der
Name nicht mit der ID eines gebündelten oder offiziellen Plugins übereinstimmt. In diesem Fall verwendet OpenClaw
stattdessen diese lokale/offizielle Kopie. Verwenden Sie `clawhub:`, `npm:`, `git:` oder
`npm-pack:` für eine deterministische Quellenauswahl.

Verwenden Sie `--force` nur, um ein vorhandenes Installationsziel aus einer anderen
Quelle zu überschreiben. Verwenden Sie für routinemäßige Upgrades einer nachverfolgten npm-, ClawHub- oder Hook-Pack-Installation
stattdessen `openclaw plugins update`; `--force` wird zusammen mit
`--link` nicht unterstützt.

## Neu starten und untersuchen

Ein laufender verwalteter Gateway mit aktivierter Konfigurationsneuladung startet nach dem
Installieren, Aktualisieren oder Deinstallieren von Plugin-Code automatisch neu. Wenn der Gateway
nicht verwaltet wird oder das Neuladen deaktiviert ist, starten Sie ihn selbst neu, bevor Sie aktive
Laufzeitoberflächen prüfen:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` lädt das Plugin-Modul und belegt, dass es Laufzeitoberflächen
registriert hat (Tools, Hooks, Dienste, Gateway-Methoden, HTTP-Routen, Plugin-eigene
CLI-Befehle). Einfaches `inspect` und `list` sind lediglich Prüfungen von Manifest, Konfiguration und Registry
ohne Laufzeitinitialisierung.

## Plugins aktualisieren

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Bei Übergabe einer Plugin-ID wird deren nachverfolgte Installationsspezifikation wiederverwendet: Gespeicherte Dist-Tags
(`@beta`) und exakt fixierte Versionen werden bei späteren Ausführungen von `update <plugin-id>`
beibehalten.

`openclaw plugins update --all` ist der Pfad für die gebündelte Wartung. Er
berücksichtigt weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-
Plugin-Einträge werden mit dem aktuellen Ziel des offiziellen Katalogs synchronisiert, anstatt
auf ein veraltetes exaktes offizielles Paket fixiert zu bleiben; wenn `update.channel`
`beta` ist, bevorzugt diese Synchronisierung die Beta-Versionslinie. Verwenden Sie ein gezieltes
`update <plugin-id>`, um eine exakte oder mit einem Tag versehene offizielle Spezifikation unverändert zu lassen.

Übergeben Sie bei npm-Installationen eine explizite Paketspezifikation, um den nachverfolgten
Eintrag zu wechseln:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Der zweite Befehl setzt ein Plugin wieder auf die Standard-Versionslinie der Registry zurück,
wenn es zuvor auf eine exakte Version oder ein Tag fixiert war.

Die genauen Fallback- und Fixierungsregeln finden Sie unter [`openclaw plugins`](/de/cli/plugins#update).

## Plugins deinstallieren

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Die Deinstallation entfernt den Konfigurationseintrag des Plugins, den persistenten Plugin-Indexeintrag,
Einträge in Zulassungs-/Sperrlisten und gegebenenfalls verknüpfte Einträge in `plugins.load.paths`.
Das verwaltete Installationsverzeichnis wird entfernt, sofern Sie nicht
`--keep-files` übergeben. Ein laufender verwalteter Gateway startet automatisch neu, wenn die
Deinstallation die Plugin-Quelle ändert.

Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Installation, Aktualisierung, Deinstallation,
Aktivierung und Deaktivierung von Plugins vollständig deaktiviert; verwalten Sie diese Optionen stattdessen in der
Nix-Quelle der Installation.

## Quelle auswählen

| Quelle      | Verwenden, wenn                                                               | Beispiel                                                       |
| ----------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Sie OpenClaw-native Suche, Scan-Zusammenfassungen, Versionen und Hinweise wünschen | `openclaw plugins install clawhub:<package>`                   |
| git         | Sie einen Branch, ein Tag oder einen Commit aus einem Repository verwenden möchten | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad | Sie ein Plugin auf demselben Computer entwickeln oder testen                 | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie ein Claude-kompatibles Marketplace-Plugin installieren                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Sie ein lokales Paketartefakt mit der npm-Installationssemantik prüfen        | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Sie bereits JavaScript-Pakete veröffentlichen oder npm-Dist-Tags/eine private Registry benötigen | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Verwaltete Installationen über lokale Pfade müssen Plugin-Verzeichnisse oder Archive sein. Tragen Sie
eigenständige Plugin-Dateien in `plugins.load.paths` ein, statt sie mit
`plugins install` zu installieren.

## Plugins veröffentlichen

ClawHub ist die primäre öffentliche Suchoberfläche für OpenClaw-Plugins. Veröffentlichen Sie
dort, wenn Benutzer vor der Installation Plugin-Metadaten, den Versionsverlauf, Ergebnisse von
Registry-Scans und Installationshinweise finden sollen.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Native npm-Plugins müssen vor der Veröffentlichung ein Plugin-Manifest (`openclaw.plugin.json`) sowie
`package.json`-Metadaten enthalten:

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

Verwenden Sie für den vollständigen Veröffentlichungsvertrag diese Seiten, anstatt diese
Seite als Veröffentlichungsreferenz zu behandeln:

- [Veröffentlichen auf ClawHub](/de/clawhub/publishing) erläutert Eigentümer, Gültigkeitsbereiche,
  Releases, Überprüfung, Paketvalidierung und Paketübertragung.
- [Plugins erstellen](/de/plugins/building-plugins) zeigt die vollständige Struktur eines Plugin-
  Pakets (einschließlich `openclaw.plugin.json`) und den Workflow für die erste Veröffentlichung.
- [Plugin-Manifest](/de/plugins/manifest) definiert die Felder des nativen Plugin-Manifests.

Wenn dasselbe Paket sowohl auf ClawHub als auch auf npm verfügbar ist, verwenden Sie das explizite
Präfix `clawhub:` oder `npm:`, um eine Quelle zu erzwingen.

## Verwandte Themen

- [Plugins](/de/tools/plugin) – installieren, konfigurieren, neu starten und Fehler beheben
- [`openclaw plugins`](/de/cli/plugins) – vollständige CLI-Referenz
- [Community-Plugins](/de/plugins/community) – öffentliche Suche und Veröffentlichung auf ClawHub
- [ClawHub](/de/clawhub/cli) – Registry-CLI-Vorgänge
- [Plugins erstellen](/de/plugins/building-plugins) – ein Plugin-Paket erstellen
- [Plugin-Manifest](/de/plugins/manifest) – Manifest- und Paketmetadaten
