---
doc-schema-version: 1
read_when:
    - Plugins installieren oder konfigurieren
    - Grundlagen der Plugin-Erkennung und Laderegeln
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Paketen
sidebarTitle: Getting Started
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-07-16T13:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um Kanäle, Modell-Provider, Agent-Harnesses, Tools,
Skills, Sprachausgabe, Echtzeit-Transkription, Spracheingabe, Medienverständnis, Generierung,
Webabruf, Websuche und weitere Laufzeitfunktionen.

Auf dieser Seite erfahren Sie, wie Sie ein Plugin installieren, den Gateway neu starten, überprüfen, ob die Laufzeit
es geladen hat, und häufige Einrichtungsfehler beheben. Beispiele, die ausschließlich Befehle enthalten, finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins). Das generierte Verzeichnis
gebündelter, offizieller externer und ausschließlich im Quellcode verfügbarer Plugins finden Sie unter
[Plugin-Verzeichnis](/de/plugins/plugin-inventory).

## Voraussetzungen

- ein OpenClaw-Checkout oder eine OpenClaw-Installation mit verfügbarer `openclaw`-CLI
- Netzwerkzugriff auf die ausgewählte Quelle (ClawHub, npm oder einen Git-Host)
- alle Plugin-spezifischen Anmeldedaten, Konfigurationsschlüssel oder Betriebssystem-Tools, die in der
  Einrichtungsdokumentation des Plugins genannt werden
- die Berechtigung, den Gateway, der Ihre Kanäle bereitstellt, neu zu laden oder neu zu starten

## Schnellstart

<Steps>
  <Step title="Plugin finden">
    Suchen Sie auf [ClawHub](/clawhub) nach öffentlichen Plugin-Paketen:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub ist die primäre Suchoberfläche für Community-Plugins. Während der
    Umstellung zur Einführung werden gewöhnliche Paketangaben ohne Präfix weiterhin über npm installiert, sofern
    sie keiner offiziellen Plugin-ID entsprechen. Unverarbeitete `@openclaw/*`-Angaben, die einem
    gebündelten Plugin entsprechen, werden auf dessen gebündelte Kopie aufgelöst. Verwenden Sie ein explizites Quellenpräfix,
    wenn Sie gezielt eine bestimmte Quelle benötigen.

  </Step>

  <Step title="Plugin installieren">
    ```bash
    # Von ClawHub.
    openclaw plugins install clawhub:<package>

    # Von npm.
    openclaw plugins install npm:<package>

    # Von Git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Aus einem lokalen Entwicklungs-Checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Verwenden Sie für
    reproduzierbare Produktionsinstallationen vorzugsweise festgelegte Versionen. ClawHub-Pakete und der
    gebündelte/offizielle Katalog von OpenClaw sind vertrauenswürdige Quellen. Neue beliebige npm-, Git-,
    lokale Pfad-/Archiv-, `npm-pack:`- oder Marketplace-Quellen erfordern bei
    nicht interaktiven Installationen `--force`, nachdem Sie
    die Quelle geprüft haben und ihr vertrauen.

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
    Das Installieren, Aktualisieren oder Deinstallieren von Plugin-Code erfordert einen Neustart des
    Gateway. Ein verwalteter Gateway mit aktivierter Konfigurationsneuladung erkennt den geänderten
    Plugin-Installationsdatensatz und startet automatisch neu. Andernfalls starten Sie ihn
    selbst neu:

    ```bash
    openclaw gateway restart
    ```

    Aktivierungs-/Deaktivierungsänderungen aktualisieren die Konfiguration und die statische Registry. Eine Laufzeitinspektion ist
    weiterhin der eindeutigste Nachweis für aktive Laufzeitoberflächen.

  </Step>

  <Step title="Laufzeitregistrierung überprüfen">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Verwenden Sie `--runtime`, um registrierte Tools, Hooks, Dienste, Gateway-
    Methoden oder Plugin-eigene CLI-Befehle nachzuweisen. Einfaches `inspect` ist nur eine statische Prüfung
    des Manifests und der Registry.

  </Step>
</Steps>

## Konfiguration

### Installationsquelle auswählen

| Quelle      | Verwendung                                                                       | Beispiel                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Sie möchten OpenClaw-native Suche, Scans, Versionsmetadaten und Installationshinweise | `openclaw plugins install clawhub:<package>`                   |
| npm         | Sie benötigen direkte Workflows für die npm-Registry oder dist-tags                             | `openclaw plugins install npm:<package>`                       |
| Git         | Sie benötigen einen Branch, Tag oder Commit aus einem Repository                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad  | Sie entwickeln oder testen ein Plugin auf demselben Computer                     | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie installieren ein Claude-kompatibles Marketplace-Plugin                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Paketangaben ohne Präfix weisen ein besonderes Kompatibilitätsverhalten auf: Ein Name ohne Präfix, der
einer gebündelten Plugin-ID entspricht, verwendet diese gebündelte Quelle; ein Name ohne Präfix, der
einer offiziellen externen Plugin-ID entspricht, verwendet den offiziellen Paketkatalog; jede andere
Angabe ohne Präfix wird während der Umstellung zur Einführung über npm installiert. Unverarbeitete `@openclaw/*`-
Angaben, die gebündelten Plugins entsprechen, werden vor dem npm-
Fallback ebenfalls auf die gebündelte Kopie aufgelöst. Verwenden Sie `npm:@openclaw/<plugin>@<version>`, um bewusst das
externe npm-Paket anstelle der gebündelten Kopie zu installieren. Verwenden Sie `clawhub:`, `npm:`,
`git:` oder `npm-pack:` für eine deterministische Quellenauswahl. Den vollständigen Befehlsvertrag finden Sie unter
[`openclaw plugins`](/de/cli/plugins#install).

Bei npm-Installationen wählen Angaben ohne festgelegte Version und `@latest` das neueste stabile
Paket aus, das die Kompatibilität mit diesem OpenClaw-Build angibt. Wenn die
aktuell neueste npm-Version eine neuere `openclaw.compat.pluginApi` oder
`openclaw.install.minHostVersion` voraussetzt, als dieser Build unterstützt, durchsucht OpenClaw
ältere stabile Versionen und installiert die neueste passende Version. Exakte Versionen
und explizite Kanal-Tags wie `@beta` bleiben an das ausgewählte Paket gebunden
und schlagen bei Inkompatibilität fehl.

### Installationsrichtlinie für Betreiber

Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl
auszuführen, bevor eine Plugin-Installation oder -Aktualisierung fortgesetzt wird. Die Richtlinie erhält Metadaten sowie
den Pfad zur bereitgestellten Quelle und kann die Installation zulassen oder blockieren. Sie gilt sowohl für CLI-
als auch für Gateway-gestützte Installations-/Aktualisierungspfade. Plugin-`before_install`-Hooks werden
später und nur in OpenClaw-Prozessen ausgeführt, in denen Plugin-Hooks geladen sind. Verwenden Sie daher
stattdessen `security.installPolicy` für betreibergesteuerte Installationsentscheidungen. Das
veraltete Flag `--dangerously-force-unsafe-install` wird aus
Kompatibilitätsgründen akzeptiert, hat jedoch keine Wirkung: Es umgeht weder die Installationsrichtlinie noch die
integrierte Sperrliste für Plugin-Abhängigkeiten von OpenClaw.

Das gemeinsame `security.installPolicy`-Ausführungsschema, das sowohl von Skills als auch von
Plugins verwendet wird, finden Sie unter [Skills-Konfiguration](/de/tools/skills-config#operator-install-policy-securityinstallpolicy).

### Plugin-Richtlinie konfigurieren

Die allgemeine Plugin-Konfigurationsstruktur lautet:

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

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt Erkennungs-/Ladevorgänge.
  Veraltete Plugin-Verweise bleiben dabei inaktiv; aktivieren Sie
  Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen.
- `plugins.deny` hat Vorrang vor der Zulassungsliste und der Aktivierung einzelner Plugins.
- `plugins.allow` ist eine exklusive Zulassungsliste. Plugin-eigene Tools außerhalb der
  Zulassungsliste bleiben nicht verfügbar, selbst wenn `tools.allow` `"*"` enthält.
- `plugins.entries.<id>.enabled: false` deaktiviert ein einzelnes Plugin, behält jedoch dessen
  Konfiguration bei.
- `plugins.load.paths` fügt explizite lokale Plugin-Dateien oder -Verzeichnisse hinzu.
  Verwaltete lokale `plugins install`-Pfade müssen Plugin-Verzeichnisse oder
  -Archive sein; verwenden Sie `plugins.load.paths` für eigenständige Plugin-Dateien.
- Plugins aus dem Workspace sind standardmäßig deaktiviert; aktivieren Sie sie ausdrücklich oder
  nehmen Sie sie in die Zulassungsliste auf, bevor Sie lokalen Workspace-Code verwenden.
- Gebündelte Plugins folgen ihren integrierten Metadaten für standardmäßige Aktivierung/Deaktivierung,
  sofern die Konfiguration diese nicht ausdrücklich überschreibt.
- `plugins.slots.<slot>` (`memory` oder `contextEngine`) wählt ein Plugin für eine
  exklusive Kategorie aus. Die Slot-Auswahl gilt als explizite Aktivierung und
  erzwingt die Aktivierung des ausgewählten Plugins für diesen Slot, selbst wenn es andernfalls
  eine ausdrückliche Aktivierung erfordern würde. `plugins.deny` und `plugins.entries.<id>.enabled: false` blockieren
  es weiterhin.
- Gebündelte Plugins mit ausdrücklicher Aktivierung können automatisch aktiviert werden, wenn die Konfiguration eine ihrer
  eigenen Oberflächen nennt, etwa eine Provider-/Modellreferenz, eine Kanalkonfiguration, ein CLI-Backend
  oder eine Agent-Harness-Laufzeit.
- Das Routing der OpenAI-Codex-Familie hält die Grenzen zwischen Provider- und Laufzeit-Plugin
  getrennt: Veraltete Codex-Modellreferenzen sind Legacy-Konfigurationen, die Doctor repariert,
  während das gebündelte Plugin `codex` die Codex-App-Server-Laufzeit für
  kanonische `openai/*`-Agent-Referenzen, explizite `agentRuntime.id: "codex"` und
  veraltete `codex/*`-Referenzen bereitstellt.

Wenn `plugins.allow` nicht festgelegt ist und nicht gebündelte Plugins automatisch aus
dem Workspace oder globalen Plugin-Stammverzeichnissen erkannt werden, protokolliert der Start
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
mit den erkannten Plugin-IDs und bei kurzen Listen einem minimalen `plugins.allow`-
Ausschnitt. Führen Sie [`openclaw plugins list --enabled --verbose`](/de/cli/plugins#list)
oder [`openclaw plugins inspect <id>`](/de/cli/plugins#inspect) für die aufgeführte
Plugin-ID aus, bevor Sie vertrauenswürdige Plugins in `openclaw.json` übernehmen. Dieselbe
Vertrauensfixierung gilt, wenn die Diagnose meldet, dass ein Plugin
`without install/load-path provenance` geladen wurde: Prüfen Sie diese Plugin-ID und fixieren Sie sie anschließend in
`plugins.allow`, oder installieren Sie sie erneut aus einer vertrauenswürdigen Quelle, damit OpenClaw die
Installationsherkunft aufzeichnet.

Führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, wenn die Konfigurationsvalidierung
veraltete Plugin-IDs, Abweichungen zwischen Zulassungslisten und Tools oder veraltete Pfade gebündelter Plugins
meldet.

## Plugin-Formate verstehen

OpenClaw erkennt zwei Plugin-Formate:

| Format                 | Ladeweise                                                                 | Verwendung                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Natives OpenClaw-Plugin | `openclaw.plugin.json` plus ein im Prozess geladenes Laufzeitmodul               | Sie installieren oder entwickeln OpenClaw-spezifische Laufzeitfunktionen  |
| Kompatibles Bundle      | Codex-, Claude- oder Cursor-Plugin-Layout, das dem OpenClaw-Plugin-Verzeichnis zugeordnet wird | Sie verwenden kompatible Skills, Befehle, Hooks oder Bundle-Metadaten erneut |

Beide Formate erscheinen in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` und `openclaw plugins disable`. Informationen zur Kompatibilitätsgrenze für Bundles finden Sie unter
[Plugin-Bundles](/de/plugins/bundles), Informationen zur Entwicklung nativer Plugins unter
[Plugins entwickeln](/de/plugins/building-plugins).

## Plugin-Hooks

Plugins können Hooks zur Laufzeit über zwei verschiedene APIs registrieren:

- `api.on(...)` typisierte Hooks für Ereignisse im Lebenszyklus der Laufzeit. Dies ist die
  bevorzugte Oberfläche für Middleware, Richtlinien, das Umschreiben von Nachrichten, die Prompt-
  Gestaltung und die Tool-Steuerung.
- `api.registerHook(...)` für das interne Hook-System, das unter
  [Hooks](/de/automation/hooks) beschrieben ist. Dies dient hauptsächlich groben Nebenwirkungen bei Befehlen und im Lebenszyklus
  sowie der Kompatibilität mit vorhandener Automatisierung im HOOK-Stil.

Faustregel: Wenn der Handler Prioritäten, Zusammenführungssemantik oder
Blockierungs-/Abbruchverhalten benötigt, verwenden Sie typisierte Hooks. Wenn er lediglich auf `command:new`,
`command:reset`, `message:sent` oder ähnliche grobe Ereignisse reagiert, ist `api.registerHook`
ausreichend.

Von Plugins verwaltete interne Hooks erscheinen in `openclaw hooks list` mit
`plugin:<id>`. Sie können sie nicht über `openclaw hooks` aktivieren oder deaktivieren;
aktivieren oder deaktivieren Sie stattdessen das Plugin.

## Aktiven Gateway überprüfen

`openclaw plugins list` und einfaches `openclaw plugins inspect` lesen den statischen Konfigurations-,
Manifest- und Registrierungsstatus. Sie belegen nicht, dass ein bereits laufendes
Gateway denselben Plugin-Code importiert hat.

Wenn ein Plugin als installiert angezeigt wird, aber der Live-Chat-Datenverkehr es nicht verwendet:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Verwaltete Gateways werden nach Installations-, Aktualisierungs- und
Deinstallationsänderungen, die den Plugin-Quellcode verändern, automatisch neu gestartet. Stellen Sie bei VPS- oder Container-Installationen
sicher, dass ein manueller Neustart den tatsächlichen `openclaw gateway run`-Unterprozess betrifft, der
Ihre Kanäle bedient, und nicht nur einen Wrapper oder Supervisor.

## Fehlerbehebung

| Symptom                                                        | Prüfung                                                                                                                                      | Behebung                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin wird in `plugins list` angezeigt, aber Runtime-Hooks werden nicht ausgeführt  | Verwenden Sie `openclaw plugins inspect <id> --runtime --json` und bestätigen Sie das aktive Gateway mit `gateway status --deep --require-rpc`             | Starten Sie das aktive Gateway nach Installations-, Aktualisierungs-, Konfigurations- oder Quellcodeänderungen neu                               |
| Diagnosen zu doppelter Kanal- oder Tool-Zuständigkeit werden angezeigt         | Führen Sie `openclaw plugins list --enabled --verbose` aus, prüfen Sie jedes verdächtige Plugin mit `--runtime --json` und vergleichen Sie die Kanal-/Tool-Zuständigkeit | Deaktivieren Sie einen Zuständigen, entfernen Sie veraltete Installationen oder verwenden Sie für eine beabsichtigte Ersetzung `preferOver` im Manifest      |
| Die Konfiguration meldet ein fehlendes Plugin                                | Prüfen Sie im [Plugin-Inventar](/de/plugins/plugin-inventory), ob es gebündelt, offiziell extern oder nur als Quellcode verfügbar ist                           | Installieren Sie das externe Paket, aktivieren Sie das gebündelte Plugin oder entfernen Sie veraltete Konfigurationen                         |
| Die Konfiguration ist während der Installation ungültig                               | Lesen Sie die Validierungsmeldung und führen Sie `openclaw doctor --fix` aus, wenn sie auf einen veralteten Plugin-Status verweist                                             | Doctor kann ungültige Plugin-Konfiguration isolieren, indem der Eintrag deaktiviert und die ungültige Nutzlast entfernt wird     |
| Plugin-Pfad wird aufgrund verdächtiger Eigentumsverhältnisse oder Berechtigungen blockiert | Prüfen Sie die Diagnose vor dem Konfigurationsfehler                                                                                             | Korrigieren Sie Eigentumsverhältnisse/Berechtigungen im Dateisystem und führen Sie anschließend `openclaw plugins registry --refresh` aus                    |
| `OPENCLAW_NIX_MODE=1` blockiert Lebenszyklusbefehle                | Bestätigen Sie, dass die Installation von Nix verwaltet wird                                                                                                      | Ändern Sie die Plugin-Auswahl in der Nix-Quelle, statt Plugin-Mutationsbefehle zu verwenden                      |
| Abhängigkeitsimport schlägt zur Laufzeit fehl                             | Prüfen Sie, ob das Plugin über npm/git/ClawHub installiert oder von einem lokalen Pfad geladen wurde                                                 | Führen Sie `openclaw plugins update <id>` aus, installieren Sie die Quelle erneut oder installieren Sie lokale Plugin-Abhängigkeiten selbst |

Wenn eine veraltete Plugin-Konfiguration weiterhin ein nicht mehr auffindbares Kanal-Plugin benennt,
stuft die Konfigurationsvalidierung diesen Kanalschlüssel von einem schwerwiegenden
Fehler zu einer Warnung herab, sodass der Gateway-Start weiterhin alle anderen Kanäle bedienen kann. Führen Sie
`openclaw doctor --fix` aus, um veraltete Plugin- und Kanaleinträge zu entfernen. Unbekannte
Kanalschlüssel ohne Hinweise auf ein veraltetes Plugin lassen die Validierung weiterhin fehlschlagen, damit Tippfehler
sichtbar bleiben.

Für eine beabsichtigte Kanalersetzung sollte das bevorzugte Plugin
`channelConfigs.<channel-id>.preferOver` mit der ID des älteren oder niedriger priorisierten
Plugins deklarieren. Wenn beide Plugins ausdrücklich aktiviert sind, behält OpenClaw diese Anforderung
bei und meldet Diagnosen zu doppelter Kanal-/Tool-Zuständigkeit, statt stillschweigend
einen Zuständigen auszuwählen.

Wenn ein installiertes Paket meldet, dass es `requires compiled runtime output for
TypeScript entry ...`, wurde das Paket ohne die JavaScript-Dateien veröffentlicht,
die OpenClaw zur Laufzeit benötigt. Aktualisieren oder installieren Sie es erneut, nachdem der Herausgeber
kompiliertes JavaScript bereitgestellt hat, oder deaktivieren/deinstallieren Sie das Plugin bis dahin.

### Blockierte Eigentumsverhältnisse des Plugin-Pfads

Wenn die Diagnose
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
meldet und die Validierung anschließend `plugin present but blocked` ausgibt, hat OpenClaw
Plugin-Dateien gefunden, die einem anderen Unix-Benutzer gehören als dem Prozess, der sie lädt.
Behalten Sie die Plugin-Konfiguration bei; korrigieren Sie die Eigentumsverhältnisse im Dateisystem oder führen Sie OpenClaw
als denselben Benutzer aus, dem das Statusverzeichnis gehört.

Bei Docker-Installationen wird das offizielle Image als `node` (UID `1000`) ausgeführt. Daher sollten die
vom Host eingebundenen OpenClaw-Konfigurations- und Arbeitsbereichsverzeichnisse normalerweise
der UID `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, ändern Sie stattdessen die Eigentumsverhältnisse des verwalteten Plugin-Stammverzeichnisses
auf root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Führen Sie nach der Korrektur der Eigentumsverhältnisse `openclaw doctor --fix` oder
`openclaw plugins registry --refresh` erneut aus, damit die persistierte Plugin-Registrierung
mit den korrigierten Dateien übereinstimmt.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Durchläufe während der Vorbereitung von Tools zu stocken scheinen, aktivieren Sie die Trace-Protokollierung
und suchen Sie nach Zeitmessungszeilen der Plugin-Tool-Factorys:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] Factory-Zeitmessungen ...
```

Die Zusammenfassung führt die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factorys auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisstruktur und der Angabe, ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory
mindestens 1s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factorys mindestens 5s dauert.

OpenClaw speichert erfolgreiche Ergebnisse von Plugin-Tool-Factorys für wiederholte
Auflösungen mit demselben effektiven Anfragekontext im Cache. Der Cache-Schlüssel umfasst
die effektive Runtime-Konfiguration, Arbeitsbereichs- und Agent-ID, Sandbox-Richtlinie, Browser-
Einstellungen, Zustellungskontext, Identität des Anfragenden und Zuständigkeitsstatus, sodass
Factorys, die von diesen vertrauenswürdigen Feldern abhängen, bei einer Änderung des Kontexts
erneut ausgeführt werden. Wenn die Zeiten weiterhin hoch bleiben, führt das Plugin möglicherweise aufwendige Arbeit aus, bevor
es seine Tool-Definitionen zurückgibt.

Wenn ein Plugin die Zeitmessung dominiert, prüfen Sie seine Runtime-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren oder deaktivieren Sie anschließend dieses Plugin. Plugin-Autoren sollten
das aufwendige Laden von Abhängigkeiten in den Tool-Ausführungspfad verlagern, statt es
innerhalb der Tool-Factory durchzuführen.

Informationen zu Abhängigkeitsstammverzeichnissen, zur Validierung von Paketmetadaten, zu Registrierungseinträgen, zum Neuladeverhalten
beim Start und zur Bereinigung veralteter Daten finden Sie unter
[Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution).

## Verwandte Themen

- [Plugins verwalten](/de/plugins/manage-plugins) - Befehlsbeispiele zum Auflisten, Installieren, Aktualisieren, Deinstallieren und Veröffentlichen
- [`openclaw plugins`](/de/cli/plugins) - vollständige CLI-Referenz
- [Plugin-Inventar](/de/plugins/plugin-inventory) - generierte Liste gebündelter und externer Plugins
- [Plugin-Referenz](/de/plugins/reference) - generierte Referenzseiten für einzelne Plugins
- [Community-Plugins](/de/plugins/community) - ClawHub-Erkennung und Richtlinie für Dokumentations-PRs
- [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution) - Installationsstammverzeichnisse, Registrierungseinträge und Runtime-Grenzen
- [Plugins erstellen](/de/plugins/building-plugins) - Leitfaden zur nativen Plugin-Entwicklung
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview) - Runtime-Registrierung, Hooks und API-Felder
- [Plugin-Manifest](/de/plugins/manifest) - Manifest- und Paketmetadaten
