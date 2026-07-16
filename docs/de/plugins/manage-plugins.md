---
doc-schema-version: 1
read_when:
    - Sie möchten Plugins in der Control UI durchsuchen, installieren, aktivieren oder deaktivieren
    - Sie möchten kurze Beispiele zum Auflisten, Installieren, Aktualisieren, Prüfen oder Deinstallieren von Plugins.
    - Sie möchten eine Installationsquelle für das Plugin auswählen
    - Sie suchen die richtige Referenz für die Veröffentlichung von Plugin-Paketen
sidebarTitle: Manage plugins
summary: OpenClaw-Plugins über die Control UI oder CLI verwalten
title: Plugins verwalten
x-i18n:
    generated_at: "2026-07-16T13:15:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Die Control UI deckt den üblichen Workflow zum Auffinden, Installieren, Aktivieren und
Deaktivieren ab. Die CLI ergänzt Aktualisierung, Deinstallation, erweiterte Konfiguration und explizite
Steuerungsmöglichkeiten für Installationsquellen. Den vollständigen Befehlsvertrag, die Flags, Regeln zur Quellenauswahl
und Sonderfälle finden Sie unter [`openclaw plugins`](/de/cli/plugins).

Typischer CLI-Workflow: Suchen Sie ein Paket, installieren Sie es über ClawHub, npm, Git oder einen
lokalen Pfad, lassen Sie den verwalteten Gateway automatisch neu starten (oder starten Sie ihn manuell neu) und
überprüfen Sie anschließend die Laufzeitregistrierungen des Plugins.

## Control UI verwenden

Öffnen Sie **Plugins** in der Control UI oder verwenden Sie `/settings/plugins` relativ zum
konfigurierten Basispfad der Control UI. Beispielsweise verwendet ein Basispfad von `/openclaw`
`/openclaw/settings/plugins`. Die Seite umfasst zwei Registerkarten:

- **Installiert** zeigt den vollständigen lokalen Bestand nach Kategorien gruppiert (Kanäle,
  Modell-Provider, Speicher, Werkzeuge). Jede Zeile öffnet eine Detailansicht; über das Überlaufmenü
  (`…`) kann das Plugin aktiviert oder deaktiviert werden, und für extern installierte
  Plugins wird **Entfernen** angeboten. Die Registerkarte führt außerdem die konfigurierten
  [MCP-Server](/de/cli/mcp) mit denselben menügesteuerten Aktionen zum Aktivieren, Deaktivieren und Entfernen
  auf, wobei `mcp.servers` in der Gateway-Konfiguration bearbeitet wird.
- **Entdecken** ist der Store: hervorgehobene, in OpenClaw enthaltene Plugins, offizielle
  externe Plugins und eine kuratierte Auswahl an Konnektoren. Konnektorkarten fügen entweder mit einem
  Klick einen gehosteten MCP-Server hinzu (GitHub, Notion, Linear, Sentry,
  Home Assistant) oder öffnen eine vorausgefüllte ClawHub-Suche. Eingaben in das Suchfeld
  fragen [ClawHub](https://clawhub.ai/plugins) direkt ab und ergänzen einen Abschnitt **Von
  ClawHub** mit Downloadzahlen und Kennzeichnungen zur Quellenverifizierung.

Enthaltene Plugins müssen nicht als Paket installiert werden. Ihre Menüaktion lautet **Aktivieren**
oder **Deaktivieren**. Workboard ist beispielsweise in OpenClaw enthalten und standardmäßig
deaktiviert. Wählen Sie daher **Aktivieren**, um es einzuschalten. Gebündelte Plugins können nicht
entfernt, sondern nur deaktiviert werden.

Der Zugriff auf Katalog und Suche erfordert `operator.read`. Installation, Aktivierung, Deaktivierung,
Entfernung und Änderungen an MCP-Servern erfordern `operator.admin`. Eine ClawHub-Installation wird
vom Gateway durchgeführt und behält dessen Prüfungen für Vertrauen, Integrität und die Richtlinie zur
Plugin-Installation bei. Wenn ein installiertes Plugin als Administrator aktiviert wird, wird dieses
explizite Vertrauen ebenfalls erfasst, indem das ausgewählte Plugin einer vorhandenen restriktiven
`plugins.allow`-Liste hinzugefügt wird. Ein expliziter `plugins.deny`-Eintrag bleibt maßgeblich und
muss entfernt werden, bevor das Plugin aktiviert werden kann.

Das Installieren oder Entfernen von Plugin-Code erfordert einen Neustart des Gateways. Änderungen an der
Aktivierung können ohne Neustart angewendet werden, wenn das installierte Plugin und die aktuelle
Gateway-Laufzeit dies unterstützen; andernfalls weist die UI darauf hin, dass ein Neustart erforderlich ist.
OAuth-gestützte MCP-Konnektoren benötigen nach dem Hinzufügen weiterhin einmalig `openclaw mcp login <name>`
über die CLI.

Die Control UI installiert nicht aus beliebigen npm-, Git- oder lokalen Pfadquellen,
aktualisiert keine Plugins und stellt keine umfangreiche Plugin-Konfiguration bereit. Verwenden Sie für
diese Vorgänge die nachstehenden CLI-Workflows.

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

`plugins list` ist eine Bestandsprüfung im kalten Zustand: Sie zeigt, was OpenClaw anhand von
Konfiguration, Manifesten und der persistenten Plugin-Registry erkennen kann. Sie weist nicht nach, dass
ein bereits laufender Gateway die Plugin-Laufzeit importiert hat. Die JSON-Ausgabe enthält
Registry-Diagnosen und den `dependencyStatus`-Wert jedes Plugins (ob deklarierte
`dependencies`/`optionalDependencies` auf dem Datenträger aufgelöst werden können).

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
für jedes Ergebnis einen Installationshinweis (`openclaw plugins install clawhub:<package>`) aus.

## Plugins aktivieren und deaktivieren

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Schaltet den Konfigurationseintrag eines Plugins um, ohne installierte Dateien zu verändern. Einige
gebündelte Plugins (gebündelte Modell-/Sprach-Provider und das gebündelte Browser-Plugin)
sind standardmäßig aktiviert; andere erfordern nach der Installation `enable`.

## Plugins installieren

```bash
# ClawHub nach Plugin-Paketen durchsuchen.
openclaw plugins search "calendar"

# Von ClawHub installieren.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Von npm installieren.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Aus einem lokalen npm-pack-Artefakt installieren.
openclaw plugins install npm-pack:<path.tgz>

# Aus Git oder einem lokalen Entwicklungs-Checkout installieren.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Unpräfixierte Paketspezifikationen werden während der Startumstellung von npm installiert, sofern der
Name nicht mit der ID eines gebündelten oder offiziellen Plugins übereinstimmt. In diesem Fall verwendet OpenClaw
stattdessen die lokale/offizielle Kopie. Verwenden Sie `clawhub:`, `npm:`, `git:` oder
`npm-pack:` für eine deterministische Quellenauswahl. Die gebündelten und offiziellen
Katalogpakete von OpenClaw gelten ebenso wie ClawHub-Pakete als vertrauenswürdig. Neue beliebige npm-,
Git-, lokale Pfad-/Archiv-, `npm-pack:`- oder Marketplace-Quellen erfordern
bei nicht interaktiven Installationen `--force`, nachdem Sie die Quelle geprüft
und als vertrauenswürdig eingestuft haben.

`--force` bestätigt eine Quelle außerhalb von ClawHub ohne Rückfrage und überschreibt bei
Bedarf ein vorhandenes Installationsziel. Verwenden Sie für routinemäßige Upgrades einer nachverfolgten npm-,
ClawHub- oder Hook-Pack-Installation stattdessen `openclaw plugins update`. Mit
`--link` bestätigt `--force` nur die Quelle; das verknüpfte Verzeichnis wird weder
kopiert noch überschrieben.

## Neu starten und prüfen

Ein laufender verwalteter Gateway mit aktivierter Konfigurationsneuladung startet nach dem
Installieren, Aktualisieren oder Deinstallieren von Plugin-Code automatisch neu. Wenn der Gateway
nicht verwaltet wird oder das Neuladen deaktiviert ist, starten Sie ihn selbst neu, bevor Sie aktive
Laufzeitoberflächen prüfen:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` lädt das Plugin-Modul und weist nach, dass es Laufzeitoberflächen
registriert hat (Werkzeuge, Hooks, Dienste, Gateway-Methoden, HTTP-Routen, Plugin-eigene
CLI-Befehle). Einfaches `inspect` und `list` sind lediglich Prüfungen von Manifest,
Konfiguration und Registry im kalten Zustand.

## Plugins aktualisieren

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Bei Übergabe einer Plugin-ID wird deren nachverfolgte Installationsspezifikation wiederverwendet: Gespeicherte Dist-Tags
(`@beta`) und exakt angeheftete Versionen werden bei späteren `update <plugin-id>`-Ausführungen
beibehalten.

`openclaw plugins update --all` ist der Pfad für die gebündelte Wartung. Er
berücksichtigt weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-
Plugin-Datensätze werden mit dem aktuellen Ziel des offiziellen Katalogs synchronisiert, statt
an ein veraltetes exaktes offizielles Paket angeheftet zu bleiben; wenn `update.channel`
`beta` ist, bevorzugt diese Synchronisierung die Beta-Veröffentlichungslinie. Verwenden Sie ein gezieltes
`update <plugin-id>`, um eine exakte oder mit einem Tag versehene offizielle Spezifikation unverändert zu lassen.

Übergeben Sie bei npm-Installationen eine explizite Paketspezifikation, um den nachverfolgten
Datensatz zu wechseln:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Der zweite Befehl verschiebt ein Plugin zurück auf die standardmäßige Veröffentlichungslinie der Registry,
wenn es zuvor an eine exakte Version oder ein Tag angeheftet war.

Die genauen Fallback- und Anheftungsregeln finden Sie unter
[`openclaw plugins`](/de/cli/plugins#update).

## Plugins deinstallieren

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Die Deinstallation entfernt den Konfigurationseintrag des Plugins, den persistenten Datensatz im Plugin-Index,
Einträge in Zulassungs-/Sperrlisten und gegebenenfalls verknüpfte `plugins.load.paths`-Einträge.
Das verwaltete Installationsverzeichnis wird entfernt, sofern Sie nicht
`--keep-files` übergeben. Ein laufender verwalteter Gateway startet automatisch neu, wenn die
Deinstallation die Plugin-Quelle ändert.

Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Installation, Aktualisierung, Deinstallation,
Aktivierung und Deaktivierung von Plugins vollständig deaktiviert; verwalten Sie diese Einstellungen stattdessen
in der Nix-Quelle der Installation.

## Quelle auswählen

| Quelle      | Verwenden, wenn                                                              | Beispiel                                                       |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Sie OpenClaw-native Auffindbarkeit, Scan-Zusammenfassungen, Versionen und Hinweise wünschen | `openclaw plugins install clawhub:<package>`                   |
| Git         | Sie einen Branch, ein Tag oder einen Commit aus einem Repository verwenden möchten | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad | Sie ein Plugin auf demselben Rechner entwickeln oder testen                | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie ein Claude-kompatibles Marketplace-Plugin installieren                 | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Sie ein lokales Paketartefakt mit der Installationssemantik von npm prüfen | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Sie bereits JavaScript-Pakete veröffentlichen oder npm-Dist-Tags/eine private Registry benötigen | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Verwaltete Installationen aus lokalen Pfaden müssen Plugin-Verzeichnisse oder Archive sein. Legen Sie
eigenständige Plugin-Dateien in `plugins.load.paths` ab, statt sie
mit `plugins install` zu installieren.

## Plugins veröffentlichen

ClawHub ist die primäre öffentliche Auffindbarkeitsoberfläche für OpenClaw-Plugins. Veröffentlichen Sie
dort, wenn Benutzer Plugin-Metadaten, Versionsverlauf, Registry-
Scanergebnisse und Installationshinweise vor der Installation finden sollen.

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
Seite als Veröffentlichungsreferenz zu betrachten:

- [Veröffentlichen auf ClawHub](/de/clawhub/publishing) erläutert Eigentümer, Geltungsbereiche,
  Releases, Überprüfung, Paketvalidierung und Paketübertragung.
- [Plugins erstellen](/de/plugins/building-plugins) zeigt die vollständige Form des Plugin-
  Pakets (einschließlich `openclaw.plugin.json`) und den ersten Veröffentlichungsworkflow.
- [Plugin-Manifest](/de/plugins/manifest) definiert die Felder nativer Plugin-Manifeste.

Wenn dasselbe Paket sowohl auf ClawHub als auch auf npm verfügbar ist, verwenden Sie das explizite
Präfix `clawhub:` oder `npm:`, um eine Quelle zu erzwingen.

## Verwandte Themen

- [Plugins](/de/tools/plugin) – installieren, konfigurieren, neu starten und Fehler beheben
- [`openclaw plugins`](/de/cli/plugins) – vollständige CLI-Referenz
- [Community-Plugins](/de/plugins/community) – öffentliche Auffindbarkeit und Veröffentlichung auf ClawHub
- [ClawHub](/de/clawhub/cli) – CLI-Operationen für die Registry
- [Plugins erstellen](/de/plugins/building-plugins) – ein Plugin-Paket erstellen
- [Plugin-Manifest](/de/plugins/manifest) – Manifest- und Paketmetadaten
