---
doc-schema-version: 1
read_when:
    - Sie möchten Plugins in der Control UI durchsuchen, installieren, aktivieren oder deaktivieren
    - Sie möchten kurze Beispiele zum Auflisten, Installieren, Aktualisieren, Prüfen oder Deinstallieren von Plugins.
    - Sie möchten eine Installationsquelle für ein Plugin auswählen
    - Sie suchen die passende Referenz zum Veröffentlichen von Plugin-Paketen
sidebarTitle: Manage plugins
summary: Verwalten Sie OpenClaw-Plugins über die Control UI oder CLI
title: Plugins verwalten
x-i18n:
    generated_at: "2026-07-12T01:54:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Die Control UI deckt den üblichen Arbeitsablauf zum Entdecken, Installieren, Aktivieren und Deaktivieren ab. Die CLI ergänzt Aktualisierung, Deinstallation, erweiterte Konfiguration und explizite Steuerelemente für Installationsquellen. Den vollständigen Befehlsvertrag, die Flags, die Regeln zur Quellenauswahl und Sonderfälle finden Sie unter [`openclaw plugins`](/de/cli/plugins).

Typischer CLI-Arbeitsablauf: Suchen Sie ein Paket, installieren Sie es über ClawHub, npm, Git oder einen lokalen Pfad, lassen Sie den verwalteten Gateway automatisch neu starten (oder starten Sie ihn manuell neu) und überprüfen Sie anschließend die Laufzeitregistrierungen des Plugins.

## Control UI verwenden

Öffnen Sie **Plugins** in der Control UI oder verwenden Sie `/settings/plugins` relativ zum konfigurierten Basispfad der Control UI. Bei einem Basispfad von `/openclaw` lautet der Pfad beispielsweise `/openclaw/settings/plugins`. Die Seite enthält zwei Registerkarten:

- **Installiert** zeigt den vollständigen lokalen Bestand, gruppiert nach Kategorie (Kanäle, Modell-Provider, Speicher, Werkzeuge). Jede Zeile öffnet eine Detailansicht; über das Überlaufmenü (`…`) können Sie das Plugin aktivieren oder deaktivieren und bei extern installierten Plugins **Entfernen** auswählen. Die Registerkarte führt außerdem die konfigurierten [MCP-Server](/de/cli/mcp) mit denselben menügesteuerten Aktionen zum Aktivieren, Deaktivieren und Entfernen auf, wobei `mcp.servers` in der Gateway-Konfiguration bearbeitet wird.
- **Entdecken** ist der Store: hervorgehobene, in OpenClaw enthaltene Plugins, offizielle externe Plugins und eine kuratierte Auswahl an Konnektoren. Konnektorkarten fügen entweder mit einem Klick einen gehosteten MCP-Server hinzu (GitHub, Notion, Linear, Sentry, Home Assistant) oder öffnen eine vorausgefüllte ClawHub-Suche. Eine Eingabe in das Suchfeld fragt [ClawHub](https://clawhub.ai/plugins) direkt ab und fügt einen Abschnitt **Von ClawHub** mit Downloadzahlen und Kennzeichnungen zur Quellenüberprüfung hinzu.

Enthaltene Plugins müssen nicht als Paket installiert werden. Ihre Menüaktion lautet **Aktivieren** oder **Deaktivieren**. Workboard ist beispielsweise in OpenClaw enthalten und standardmäßig deaktiviert. Wählen Sie daher **Aktivieren**, um es einzuschalten. Gebündelte Plugins können nicht entfernt, sondern nur deaktiviert werden.

Der Zugriff auf Katalog und Suche erfordert `operator.read`. Installation, Aktivierung, Deaktivierung, Entfernung und Änderungen an MCP-Servern erfordern `operator.admin`. Eine ClawHub-Installation wird vom Gateway ausgeführt und behält dessen Prüfungen für Vertrauen, Integrität und Plugin-Installationsrichtlinien bei.

Das Installieren oder Entfernen von Plugin-Code erfordert einen Neustart des Gateways. Änderungen an der Aktivierung können ohne Neustart angewendet werden, wenn das installierte Plugin und die aktuelle Gateway-Laufzeit dies unterstützen; andernfalls weist die Benutzeroberfläche darauf hin, dass ein Neustart erforderlich ist. OAuth-gestützte MCP-Konnektoren erfordern nach dem Hinzufügen weiterhin einmalig `openclaw mcp login <name>` über die CLI.

Die Control UI installiert nicht aus beliebigen npm-, Git- oder lokalen Pfadquellen, aktualisiert keine Plugins und stellt keine umfangreiche Plugin-Konfiguration bereit. Verwenden Sie für diese Vorgänge die nachfolgenden CLI-Arbeitsabläufe.

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

`plugins list` ist eine Bestandsprüfung im kalten Zustand: Sie zeigt, was OpenClaw anhand der Konfiguration, Manifeste und der persistenten Plugin-Registry erkennen kann. Sie weist nicht nach, dass ein bereits laufender Gateway die Plugin-Laufzeit importiert hat. Die JSON-Ausgabe enthält Registry-Diagnosen und den `dependencyStatus` jedes Plugins (ob deklarierte `dependencies`/`optionalDependencies` auf dem Datenträger aufgelöst werden können).

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt für jedes Ergebnis einen Installationshinweis (`openclaw plugins install clawhub:<package>`) aus.

## Plugins aktivieren und deaktivieren

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Schaltet den Konfigurationseintrag eines Plugins um, ohne installierte Dateien zu verändern. Einige gebündelte Plugins (gebündelte Modell-/Sprach-Provider und das gebündelte Browser-Plugin) sind standardmäßig aktiviert; andere erfordern nach der Installation `enable`.

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

# Install from a local npm-pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Reine Paketspezifikationen werden während der Umstellung beim Start aus npm installiert, sofern der Name nicht mit der ID eines gebündelten oder offiziellen Plugins übereinstimmt. In diesem Fall verwendet OpenClaw stattdessen diese lokale beziehungsweise offizielle Kopie. Verwenden Sie `clawhub:`, `npm:`, `git:` oder `npm-pack:`, um die Quelle deterministisch auszuwählen.

Verwenden Sie `--force` nur, um ein vorhandenes Installationsziel mit einer anderen Quelle zu überschreiben. Verwenden Sie für routinemäßige Upgrades einer nachverfolgten npm-, ClawHub- oder Hook-Pack-Installation stattdessen `openclaw plugins update`; `--force` wird mit `--link` nicht unterstützt.

## Neu starten und prüfen

Ein laufender verwalteter Gateway, bei dem das erneute Laden der Konfiguration aktiviert ist, startet nach der Installation, Aktualisierung oder Deinstallation von Plugin-Code automatisch neu. Wenn der Gateway nicht verwaltet wird oder das erneute Laden deaktiviert ist, starten Sie ihn selbst neu, bevor Sie aktive Laufzeitoberflächen prüfen:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` lädt das Plugin-Modul und weist nach, dass es Laufzeitoberflächen registriert hat (Werkzeuge, Hooks, Dienste, Gateway-Methoden, HTTP-Routen und Plugin-eigene CLI-Befehle). Einfaches `inspect` und `list` sind lediglich Prüfungen von Manifest, Konfiguration und Registry im kalten Zustand.

## Plugins aktualisieren

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Bei Angabe einer Plugin-ID wird deren nachverfolgte Installationsspezifikation wiederverwendet: Gespeicherte Dist-Tags (`@beta`) und exakt fixierte Versionen werden bei späteren Ausführungen von `update <plugin-id>` übernommen.

`openclaw plugins update --all` ist der Pfad für die gebündelte Wartung. Dabei werden weiterhin die üblichen nachverfolgten Installationsspezifikationen berücksichtigt. Vertrauenswürdige Datensätze offizieller OpenClaw-Plugins werden jedoch mit dem aktuellen Ziel des offiziellen Katalogs synchronisiert, anstatt an einem veralteten exakten offiziellen Paket fixiert zu bleiben. Wenn `update.channel` den Wert `beta` hat, bevorzugt diese Synchronisierung die Beta-Veröffentlichungslinie. Verwenden Sie ein gezieltes `update <plugin-id>`, um eine exakte oder mit einem Tag versehene offizielle Spezifikation unverändert beizubehalten.

Geben Sie für npm-Installationen eine explizite Paketspezifikation an, um den nachverfolgten Datensatz zu wechseln:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Der zweite Befehl verschiebt ein Plugin zurück zur Standard-Veröffentlichungslinie der Registry, wenn es zuvor auf eine exakte Version oder ein Tag fixiert war.

Die genauen Regeln für Rückfallverhalten und Versionsfixierung finden Sie unter [`openclaw plugins`](/de/cli/plugins#update).

## Plugins deinstallieren

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Die Deinstallation entfernt den Konfigurationseintrag des Plugins, den persistenten Datensatz im Plugin-Index, Einträge in Zulassungs-/Sperrlisten und gegebenenfalls verknüpfte Einträge in `plugins.load.paths`. Das verwaltete Installationsverzeichnis wird entfernt, sofern Sie nicht `--keep-files` angeben. Ein laufender verwalteter Gateway startet automatisch neu, wenn die Deinstallation die Plugin-Quelle ändert.

Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Installation, Aktualisierung, Deinstallation, Aktivierung und Deaktivierung von Plugins vollständig deaktiviert. Verwalten Sie diese Optionen stattdessen in der Nix-Quelle der Installation.

## Quelle auswählen

| Quelle      | Verwenden, wenn                                                                    | Beispiel                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Sie OpenClaw-native Erkennung, Scan-Zusammenfassungen, Versionen und Hinweise wünschen     | `openclaw plugins install clawhub:<package>`                   |
| Git         | Sie einen Branch, ein Tag oder einen Commit aus einem Repository verwenden möchten                         | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad  | Sie ein Plugin auf demselben Rechner entwickeln oder testen                  | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie ein Claude-kompatibles Marketplace-Plugin installieren                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm-Pack    | Sie ein lokales Paketartefakt mithilfe der Installationssemantik von npm überprüfen      | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Sie bereits JavaScript-Pakete veröffentlichen oder npm-Dist-Tags/eine private Registry benötigen | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Verwaltete Installationen über lokale Pfade müssen Plugin-Verzeichnisse oder Archive sein. Tragen Sie eigenständige Plugin-Dateien in `plugins.load.paths` ein, anstatt sie mit `plugins install` zu installieren.

## Plugins veröffentlichen

ClawHub ist die primäre öffentliche Oberfläche zum Entdecken von OpenClaw-Plugins. Veröffentlichen Sie dort, wenn Benutzer vor der Installation Plugin-Metadaten, Versionsverlauf, Registry-Scanergebnisse und Installationshinweise finden sollen.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Native npm-Plugins müssen vor der Veröffentlichung ein Plugin-Manifest (`openclaw.plugin.json`) sowie `package.json`-Metadaten enthalten:

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

Verwenden Sie für den vollständigen Veröffentlichungsvertrag die folgenden Seiten, anstatt diese Seite als Veröffentlichungsreferenz zu behandeln:

- [Veröffentlichen auf ClawHub](/de/clawhub/publishing) erläutert Eigentümer, Geltungsbereiche, Veröffentlichungen, Überprüfung, Paketvalidierung und Paketübertragung.
- [Plugins erstellen](/de/plugins/building-plugins) zeigt die vollständige Struktur eines Plugin-Pakets (einschließlich `openclaw.plugin.json`) und den Arbeitsablauf für die erste Veröffentlichung.
- [Plugin-Manifest](/de/plugins/manifest) definiert die Felder nativer Plugin-Manifeste.

Wenn dasselbe Paket sowohl auf ClawHub als auch auf npm verfügbar ist, verwenden Sie das explizite Präfix `clawhub:` oder `npm:`, um eine Quelle zu erzwingen.

## Verwandte Themen

- [Plugins](/de/tools/plugin) – installieren, konfigurieren, neu starten und Fehler beheben
- [`openclaw plugins`](/de/cli/plugins) – vollständige CLI-Referenz
- [Community-Plugins](/de/plugins/community) – öffentliche Suche und Veröffentlichung auf ClawHub
- [ClawHub](/de/clawhub/cli) – CLI-Vorgänge für die Registry
- [Plugins erstellen](/de/plugins/building-plugins) – ein Plugin-Paket erstellen
- [Plugin-Manifest](/de/plugins/manifest) – Manifest- und Paketmetadaten
