---
doc-schema-version: 1
read_when:
    - Plugins installieren oder konfigurieren
    - Grundlegendes zur Erkennung und zu den Laderegeln von Plugins
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Paketen
sidebarTitle: Getting Started
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-07-12T15:59:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um Kanäle, Modell-Provider, Agent-Harnesses, Tools,
Skills, Sprachausgabe, Echtzeittranskription, Spracheingabe, Medienverständnis, Generierung,
Webabruf, Websuche und weitere Laufzeitfunktionen.

Auf dieser Seite erfahren Sie, wie Sie ein Plugin installieren, den Gateway neu starten, überprüfen, ob die Laufzeit
es geladen hat, und häufige Einrichtungsfehler beheben. Beispiele, die nur Befehle enthalten, finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins). Das generierte Verzeichnis der
gebündelten, offiziellen externen und ausschließlich im Quellcode verfügbaren Plugins finden Sie unter
[Plugin-Verzeichnis](/de/plugins/plugin-inventory).

## Voraussetzungen

- ein OpenClaw-Checkout oder eine OpenClaw-Installation, in der die `openclaw`-CLI verfügbar ist
- Netzwerkzugriff auf die ausgewählte Quelle (ClawHub, npm oder ein Git-Host)
- alle Plugin-spezifischen Anmeldedaten, Konfigurationsschlüssel oder Betriebssystem-Tools, die in der
  Einrichtungsdokumentation des Plugins genannt werden
- die Berechtigung, den Gateway, der Ihre Kanäle bedient, neu zu laden oder neu zu starten

## Schnellstart

<Steps>
  <Step title="Plugin suchen">
    Durchsuchen Sie [ClawHub](/clawhub) nach öffentlichen Plugin-Paketen:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub ist die primäre Suchoberfläche für Community-Plugins. Während der
    Umstellung zur Einführung werden gewöhnliche reine Paketspezifikationen weiterhin von npm installiert, sofern
    sie keiner offiziellen Plugin-ID entsprechen. Unverarbeitete `@openclaw/*`-Spezifikationen, die einem
    gebündelten Plugin entsprechen, werden in diese gebündelte Kopie aufgelöst. Verwenden Sie ein explizites Quellpräfix,
    wenn Sie gezielt eine bestimmte Quelle benötigen.

  </Step>

  <Step title="Plugin installieren">
    ```bash
    # Aus ClawHub.
    openclaw plugins install clawhub:<package>

    # Aus npm.
    openclaw plugins install npm:<package>

    # Aus Git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Aus einem lokalen Entwicklungs-Checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Behandeln Sie Plugin-Installationen wie die Ausführung von Code. Bevorzugen Sie festgelegte Versionen für
    reproduzierbare Produktionsinstallationen.

  </Step>

  <Step title="Konfigurieren und aktivieren">
    Konfigurieren Sie Plugin-spezifische Einstellungen unter `plugins.entries.<id>.config`.
    Aktivieren Sie das Plugin, falls es noch nicht aktiviert ist:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Wenn `plugins.allow` festgelegt ist, muss die ID des installierten Plugins in dieser Liste enthalten sein,
    bevor das Plugin geladen werden kann. `openclaw plugins install` fügt die installierte
    ID einer vorhandenen `plugins.allow`-Liste hinzu und entfernt dieselbe ID aus
    `plugins.deny`, damit die explizite Installation nach dem Neustart geladen werden kann.

  </Step>

  <Step title="Gateway neu laden lassen">
    Das Installieren, Aktualisieren oder Deinstallieren von Plugin-Code erfordert einen Neustart des Gateways.
    Ein verwalteter Gateway mit aktivierter Konfigurationsneuladung erkennt den geänderten
    Plugin-Installationsdatensatz und startet automatisch neu. Andernfalls starten Sie ihn
    selbst neu:

    ```bash
    openclaw gateway restart
    ```

    Beim Aktivieren oder Deaktivieren werden die Konfiguration und die Cold Registry aktualisiert. Eine Laufzeitinspektion ist
    weiterhin der eindeutigste Nachweis für aktive Laufzeitoberflächen.

  </Step>

  <Step title="Laufzeitregistrierung überprüfen">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Verwenden Sie `--runtime`, um registrierte Tools, Hooks, Dienste, Gateway-
    Methoden oder Plugin-eigene CLI-Befehle nachzuweisen. Ein einfaches `inspect` prüft nur das Cold Manifest
    und die Registry.

  </Step>
</Steps>

## Konfiguration

### Installationsquelle auswählen

| Quelle      | Verwenden, wenn                                                                       | Beispiel                                                       |
| ----------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Sie OpenClaw-native Erkennung, Scans, Versionsmetadaten und Installationshinweise wünschen | `openclaw plugins install clawhub:<package>`                   |
| npm         | Sie direkte Workflows für die npm-Registry oder Dist-Tags benötigen                  | `openclaw plugins install npm:<package>`                       |
| git         | Sie einen Branch, Tag oder Commit aus einem Repository benötigen                     | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad | Sie ein Plugin auf demselben Rechner entwickeln oder testen                          | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie ein Claude-kompatibles Marketplace-Plugin installieren                           | `openclaw plugins install <plugin> --marketplace <source>`     |

Reine Paketspezifikationen weisen ein besonderes Kompatibilitätsverhalten auf: Ein reiner Name, der
mit der ID eines gebündelten Plugins übereinstimmt, verwendet diese gebündelte Quelle; ein reiner Name, der mit
der ID eines offiziellen externen Plugins übereinstimmt, verwendet den offiziellen Paketkatalog; jede andere
reine Spezifikation wird während der Umstellung beim Start über npm installiert. Unveränderte `@openclaw/*`-
Spezifikationen, die gebündelten Plugins entsprechen, werden ebenfalls vor dem npm-
Fallback auf die gebündelte Kopie aufgelöst. Verwenden Sie `npm:@openclaw/<plugin>@<version>`, um gezielt das
externe npm-Paket anstelle der gebündelten Kopie zu installieren. Verwenden Sie `clawhub:`, `npm:`,
`git:` oder `npm-pack:` für eine deterministische Quellenauswahl. Den vollständigen Befehlsvertrag finden Sie unter
[`openclaw plugins`](/de/cli/plugins#install).

Bei npm-Installationen wählen nicht fixierte Spezifikationen und `@latest` das neueste stabile
Paket aus, das Kompatibilität mit diesem OpenClaw-Build ausweist. Wenn die
aktuelle neueste npm-Version eine neuere `openclaw.compat.pluginApi` oder
`openclaw.install.minHostVersion` deklariert, als dieser Build unterstützt, durchsucht OpenClaw
ältere stabile Versionen und installiert die neueste passende Version. Exakte Versionen
und explizite Kanal-Tags wie `@beta` bleiben auf das ausgewählte Paket
fixiert und schlagen bei Inkompatibilität fehl.

### Installationsrichtlinie für Betreiber

Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl auszuführen,
bevor die Installation oder Aktualisierung eines Plugins fortgesetzt wird. Die Richtlinie erhält Metadaten sowie
den Pfad zur bereitgestellten Quelle und kann die Installation zulassen oder blockieren. Sie gilt sowohl für CLI-
als auch für Gateway-gestützte Installations- und Aktualisierungspfade. `before_install`-Hooks von Plugins werden
später ausgeführt, und zwar nur in OpenClaw-Prozessen, in denen Plugin-Hooks geladen sind. Verwenden Sie daher
stattdessen `security.installPolicy` für betreiberseitige Installationsentscheidungen. Das
veraltete Flag `--dangerously-force-unsafe-install` wird aus
Kompatibilitätsgründen akzeptiert, hat jedoch keine Wirkung: Es umgeht weder die Installationsrichtlinie noch die
integrierte Sperrliste für Plugin-Abhängigkeiten von OpenClaw.

Das gemeinsame `security.installPolicy`-Ausführungsschema, das sowohl von Skills als auch von
Plugins verwendet wird, finden Sie unter [Skills-Konfiguration](/de/tools/skills-config#operator-install-policy-securityinstallpolicy).

### Plugin-Richtlinie konfigurieren

Die allgemeine Form der Plugin-Konfiguration lautet:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Wichtige Richtlinienregeln:

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt Erkennungs- und Lade-
  vorgänge. Veraltete Plugin-Verweise bleiben währenddessen inaktiv; aktivieren Sie
  Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen.
- `plugins.deny` hat Vorrang vor der Zulassungsliste und der Aktivierung einzelner Plugins.
- `plugins.allow` ist eine exklusive Zulassungsliste. Plugin-eigene Tools außerhalb der
  Zulassungsliste bleiben nicht verfügbar, selbst wenn `tools.allow` `"*"` enthält.
- `plugins.entries.<id>.enabled: false` deaktiviert ein einzelnes Plugin, behält jedoch dessen
  Konfiguration bei.
- `plugins.load.paths` fügt explizite lokale Plugin-Dateien oder -Verzeichnisse hinzu.
  Über `plugins install` verwaltete lokale Pfade müssen Plugin-Verzeichnisse oder
  Archive sein; verwenden Sie `plugins.load.paths` für eigenständige Plugin-Dateien.
- Aus dem Workspace stammende Plugins sind standardmäßig deaktiviert; aktivieren Sie sie ausdrücklich oder
  nehmen Sie sie in die Zulassungsliste auf, bevor Sie lokalen Workspace-Code verwenden.
- Gebündelte Plugins folgen ihren integrierten Metadaten zur standardmäßigen Aktivierung oder Deaktivierung,
  sofern die Konfiguration dies nicht ausdrücklich überschreibt.
- `plugins.slots.<slot>` (`memory` oder `contextEngine`) wählt ein Plugin für eine
  exklusive Kategorie aus. Die Slot-Auswahl gilt als ausdrückliche Aktivierung und
  erzwingt die Aktivierung des ausgewählten Plugins für diesen Slot, selbst wenn es andernfalls
  optional wäre. `plugins.deny` und `plugins.entries.<id>.enabled: false` blockieren
  es weiterhin.
- Gebündelte optionale Plugins können automatisch aktiviert werden, wenn die Konfiguration eine ihrer
  eigenen Oberflächen benennt, etwa eine Provider-/Modellreferenz, Kanalkonfiguration, ein CLI-Backend
  oder eine Agent-Harness-Laufzeit.
- Das Codex-Routing der OpenAI-Familie hält die Grenzen zwischen Provider- und Laufzeit-Plugin
  getrennt: Veraltete Codex-Modellreferenzen sind Legacy-Konfigurationen, die Doctor repariert,
  während das gebündelte `codex`-Plugin die Codex-App-Server-Laufzeit für
  kanonische `openai/*`-Agent-Referenzen, explizites `agentRuntime.id: "codex"` und
  veraltete `codex/*`-Referenzen verwaltet.

Wenn `plugins.allow` nicht gesetzt ist und nicht gebündelte Plugins automatisch aus
dem Workspace oder globalen Plugin-Stammverzeichnissen erkannt werden, protokolliert der Start
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
mit den erkannten Plugin-IDs und bei kurzen Listen einem minimalen `plugins.allow`-
Ausschnitt. Führen Sie für die aufgeführte
Plugin-ID [`openclaw plugins list --enabled --verbose`](/de/cli/plugins#list)
oder [`openclaw plugins inspect <id>`](/de/cli/plugins#inspect) aus, bevor Sie
vertrauenswürdige Plugins in `openclaw.json` übernehmen. Dieselbe
Vertrauensfixierung gilt, wenn die Diagnose meldet, dass ein Plugin
`without install/load-path provenance` geladen wurde: Prüfen Sie diese Plugin-ID und fixieren Sie sie anschließend in
`plugins.allow` oder installieren Sie sie erneut aus einer vertrauenswürdigen Quelle, damit OpenClaw den Installations-
ursprung aufzeichnet.

Führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, wenn die Konfigurationsvalidierung
veraltete Plugin-IDs, Abweichungen zwischen Zulassungsliste und Tools oder veraltete Pfade gebündelter Plugins
meldet.

## Plugin-Formate verstehen

OpenClaw erkennt zwei Plugin-Formate:

| Format                    | Ladevorgang                                                                                  | Verwenden, wenn                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Natives OpenClaw-Plugin   | `openclaw.plugin.json` sowie ein im Prozess geladenes Laufzeitmodul                           | Sie OpenClaw-spezifische Laufzeitfunktionen installieren oder entwickeln          |
| Kompatibles Bundle        | In den OpenClaw-Plugin-Bestand überführtes Codex-, Claude- oder Cursor-Plugin-Layout          | Sie kompatible Skills, Befehle, Hooks oder Bundle-Metadaten wiederverwenden       |

Beide Formate erscheinen in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` und `openclaw plugins disable`. Informationen zur
Bundle-Kompatibilitätsgrenze finden Sie unter [Plugin-Bundles](/de/plugins/bundles) und zur
Entwicklung nativer Plugins unter [Plugins entwickeln](/de/plugins/building-plugins).

## Plugin-Hooks

Plugins können zur Laufzeit über zwei verschiedene APIs Hooks registrieren:

- Typisierte `api.on(...)`-Hooks für Ereignisse des Laufzeitlebenszyklus. Dies ist die
  bevorzugte Oberfläche für Middleware, Richtlinien, das Umschreiben von Nachrichten, die Gestaltung
  von Prompts und die Tool-Steuerung.
- `api.registerHook(...)` für das unter
  [Hooks](/de/automation/hooks) beschriebene interne Hook-System. Dies dient hauptsächlich groben Nebenwirkungen von Befehlen und Lebenszyklus-
  ereignissen sowie der Kompatibilität mit vorhandener Automatisierung im HOOK-Stil.

Kurzregel: Wenn der Handler Priorität, Zusammenführungssemantik oder
Blockier-/Abbruchverhalten benötigt, verwenden Sie typisierte Hooks. Wenn er lediglich auf `command:new`,
`command:reset`, `message:sent` oder ähnliche grobe Ereignisse reagiert, ist `api.registerHook`
geeignet.

Von Plugins verwaltete interne Hooks erscheinen in `openclaw hooks list` mit
`plugin:<id>`. Sie können sie nicht über `openclaw hooks` aktivieren oder deaktivieren;
aktivieren oder deaktivieren Sie stattdessen das Plugin.

## Aktives Gateway überprüfen

`openclaw plugins list` und ein einfaches `openclaw plugins inspect` lesen die kalte Konfiguration sowie
den Manifest- und Registry-Status. Sie belegen nicht, dass ein bereits laufendes
Gateway denselben Plugin-Code importiert hat.

Wenn ein Plugin als installiert angezeigt wird, der Live-Chat-Datenverkehr es jedoch nicht verwendet:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Verwaltete Gateways starten nach Installation, Aktualisierung und
Deinstallation automatisch neu, wenn sich dadurch der Plugin-Quellcode ändert. Stellen
Sie bei VPS- oder Container-Installationen sicher, dass ein manueller Neustart den tatsächlichen
untergeordneten Prozess `openclaw gateway run` betrifft, der Ihre Kanäle bedient, und nicht nur
einen Wrapper oder Supervisor.

## Fehlerbehebung

| Symptom                                                        | Prüfung                                                                                                                                      | Lösung                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin wird in `plugins list` angezeigt, aber Runtime-Hooks werden nicht ausgeführt | Verwenden Sie `openclaw plugins inspect <id> --runtime --json` und bestätigen Sie das aktive Gateway mit `gateway status --deep --require-rpc` | Starten Sie das aktive Gateway nach Installations-, Aktualisierungs-, Konfigurations- oder Quellcodeänderungen neu |
| Diagnosen zu doppelter Kanal- oder Tool-Zuständigkeit werden angezeigt | Führen Sie `openclaw plugins list --enabled --verbose` aus, prüfen Sie jedes verdächtige Plugin mit `--runtime --json` und vergleichen Sie die Kanal-/Tool-Zuständigkeit | Deaktivieren Sie einen Eigentümer, entfernen Sie veraltete Installationen oder verwenden Sie `preferOver` im Manifest für eine beabsichtigte Ersetzung |
| Die Konfiguration meldet, dass ein Plugin fehlt | Prüfen Sie im [Plugin-Inventar](/de/plugins/plugin-inventory), ob es gebündelt, offiziell extern oder nur als Quellcode verfügbar ist | Installieren Sie das externe Paket, aktivieren Sie das gebündelte Plugin oder entfernen Sie veraltete Konfiguration |
| Die Konfiguration ist während der Installation ungültig | Lesen Sie die Validierungsmeldung und führen Sie `openclaw doctor --fix` aus, wenn sie auf einen veralteten Plugin-Zustand hinweist | Doctor kann eine ungültige Plugin-Konfiguration isolieren, indem der Eintrag deaktiviert und die ungültige Nutzlast entfernt wird |
| Plugin-Pfad wird wegen verdächtiger Eigentümerschaft oder Berechtigungen blockiert | Prüfen Sie die Diagnose vor dem Konfigurationsfehler | Korrigieren Sie Eigentümerschaft/Berechtigungen im Dateisystem und führen Sie anschließend `openclaw plugins registry --refresh` aus |
| `OPENCLAW_NIX_MODE=1` blockiert Lebenszyklusbefehle | Bestätigen Sie, dass die Installation von Nix verwaltet wird | Ändern Sie die Plugin-Auswahl in der Nix-Quelle, statt Plugin-Mutatorbefehle zu verwenden |
| Abhängigkeitsimport schlägt zur Laufzeit fehl | Prüfen Sie, ob das Plugin über npm/git/ClawHub installiert oder von einem lokalen Pfad geladen wurde | Führen Sie `openclaw plugins update <id>` aus, installieren Sie die Quelle erneut oder installieren Sie lokale Plugin-Abhängigkeiten selbst |

Wenn eine veraltete Plugin-Konfiguration weiterhin ein nicht mehr auffindbares Kanal-Plugin
nennt, stuft die Konfigurationsvalidierung diesen Kanalschlüssel von einem schwerwiegenden
Fehler zu einer Warnung herab, sodass der Gateway-Start weiterhin alle anderen Kanäle bedienen
kann. Führen Sie `openclaw doctor --fix` aus, um veraltete Plugin- und Kanaleinträge zu entfernen. Unbekannte
Kanalschlüssel ohne Hinweis auf ein veraltetes Plugin führen weiterhin zu einem Validierungsfehler, damit Tippfehler
sichtbar bleiben.

Bei einer beabsichtigten Kanalersetzung sollte das bevorzugte Plugin
`channelConfigs.<channel-id>.preferOver` mit der ID des veralteten oder niedriger priorisierten
Plugins deklarieren. Wenn beide Plugins ausdrücklich aktiviert sind, behält OpenClaw diese Anforderung
bei und meldet Diagnosen zu doppelter Kanal-/Tool-Zuständigkeit, statt stillschweigend
einen Eigentümer auszuwählen.

Wenn ein installiertes Paket meldet, dass es `requires compiled runtime output for
TypeScript entry ...`, wurde das Paket ohne die JavaScript-Dateien veröffentlicht,
die OpenClaw zur Laufzeit benötigt. Aktualisieren oder installieren Sie es erneut, nachdem der Herausgeber
kompiliertes JavaScript bereitgestellt hat, oder deaktivieren/deinstallieren Sie das Plugin bis dahin.

### Blockierte Eigentümerschaft des Plugin-Pfads

Wenn Diagnosen
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
melden und die Validierung anschließend `plugin present but blocked` ausgibt, hat OpenClaw
Plugin-Dateien gefunden, die einem anderen Unix-Benutzer gehören als dem Prozess, der sie lädt.
Behalten Sie die Plugin-Konfiguration bei; korrigieren Sie die Eigentümerschaft im Dateisystem oder führen Sie OpenClaw
als denselben Benutzer aus, dem das Zustandsverzeichnis gehört.

Bei Docker-Installationen wird das offizielle Image als `node` (uid `1000`) ausgeführt, daher sollten die
vom Host eingebundenen OpenClaw-Konfigurations- und Arbeitsbereichsverzeichnisse normalerweise
uid `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, setzen Sie stattdessen die Eigentümerschaft des verwalteten
Plugin-Stammverzeichnisses auf root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Führen Sie nach dem Korrigieren der Eigentümerschaft erneut `openclaw doctor --fix` oder
`openclaw plugins registry --refresh` aus, damit die gespeicherte Plugin-Registry
den korrigierten Dateien entspricht.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Durchläufe beim Vorbereiten von Tools zu stocken scheinen, aktivieren Sie die Trace-Protokollierung
und suchen Sie nach Zeitmessungszeilen der Plugin-Tool-Factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] factory timings ...
```

Die Zusammenfassung führt die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factorys auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisform und der Angabe, ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory
mindestens 1s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factorys mindestens 5s dauert.

OpenClaw speichert erfolgreiche Ergebnisse von Plugin-Tool-Factorys für wiederholte
Auflösungen mit demselben effektiven Anfragekontext im Cache. Der Cache-Schlüssel umfasst
die effektive Runtime-Konfiguration, Arbeitsbereichs- und Agent-ID, Sandbox-Richtlinie, Browser-
Einstellungen, Zustellungskontext, Identität des Anfragenden und Eigentümerschaftszustand, sodass
Factorys, die von diesen vertrauenswürdigen Feldern abhängen, bei einer Änderung des Kontexts
erneut ausgeführt werden. Wenn die Zeiten weiterhin hoch bleiben, führt das Plugin möglicherweise aufwendige Arbeiten aus, bevor
es seine Tool-Definitionen zurückgibt.

Wenn ein Plugin die Zeitmessung dominiert, prüfen Sie seine Runtime-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren oder deaktivieren Sie anschließend dieses Plugin. Plugin-Autoren sollten das
aufwendige Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verlagern, statt es
innerhalb der Tool-Factory durchzuführen.

Informationen zu Abhängigkeits-Stammverzeichnissen, der Validierung von Paketmetadaten, Registry-Einträgen, dem Neuladeverhalten
beim Start und der Bereinigung veralteter Daten finden Sie unter
[Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution).

## Verwandte Themen

- [Plugins verwalten](/de/plugins/manage-plugins) - Befehlsbeispiele zum Auflisten, Installieren, Aktualisieren, Deinstallieren und Veröffentlichen
- [`openclaw plugins`](/de/cli/plugins) - vollständige CLI-Referenz
- [Plugin-Inventar](/de/plugins/plugin-inventory) - generierte Liste gebündelter und externer Plugins
- [Plugin-Referenz](/de/plugins/reference) - generierte Referenzseiten für einzelne Plugins
- [Community-Plugins](/de/plugins/community) - ClawHub-Erkennung und Richtlinie für Dokumentations-PRs
- [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution) - Installations-Stammverzeichnisse, Registry-Einträge und Runtime-Grenzen
- [Plugins erstellen](/de/plugins/building-plugins) - Leitfaden zur nativen Plugin-Entwicklung
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview) - Runtime-Registrierung, Hooks und API-Felder
- [Plugin-Manifest](/de/plugins/manifest) - Manifest- und Paketmetadaten
