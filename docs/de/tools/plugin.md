---
doc-schema-version: 1
read_when:
    - Plugins installieren oder konfigurieren
    - Grundlagen der Plugin-Erkennung und Laderegeln
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Getting Started
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-07-24T04:12:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f210dccab059527192eeb0aa2e780dcea243959273938ffaacc867ec96f5085e
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um Kanäle, Modell-Provider, Agent-Harnesses, Tools,
Skills, Sprachausgabe, Echtzeittranskription, Sprache, Medienverständnis, Generierung,
Webabruf, Websuche und weitere Laufzeitfunktionen.

Auf dieser Seite erfahren Sie, wie Sie ein Plugin installieren, das Gateway neu starten, überprüfen, ob es von der Laufzeit
geladen wurde, und häufige Einrichtungsfehler beheben. Beispiele, die ausschließlich Befehle enthalten, finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins). Das generierte Verzeichnis der
gebündelten, offiziellen externen und ausschließlich im Quellcode verfügbaren Plugins finden Sie unter
[Plugin-Verzeichnis](/de/plugins/plugin-inventory).

## Voraussetzungen

- ein OpenClaw-Checkout oder eine OpenClaw-Installation mit verfügbarer `openclaw`-CLI
- Netzwerkzugriff auf die ausgewählte Quelle (ClawHub, npm oder einen Git-Host)
- alle Plugin-spezifischen Anmeldedaten, Konfigurationsschlüssel oder Betriebssystemtools, die in der
  Einrichtungsdokumentation des Plugins genannt werden
- die Berechtigung, das Gateway, das Ihre Kanäle bedient, neu zu laden oder neu zu starten

## Schnellstart

<Steps>
  <Step title="Plugin suchen">
    Durchsuchen Sie [ClawHub](/de/clawhub) nach öffentlichen Plugin-Paketen:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub ist die primäre Suchoberfläche für Community-Plugins. Während der
    Umstellung zur Einführung werden gewöhnliche Paketangaben ohne Präfix weiterhin von npm installiert, sofern
    sie keiner offiziellen Plugin-ID entsprechen. Unverarbeitete `@openclaw/*`-Angaben, die einem
    gebündelten Plugin entsprechen, werden auf die gebündelte Kopie aufgelöst. Verwenden Sie ein explizites Quellenpräfix,
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

    Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie festgelegte Versionen für
    reproduzierbare Produktionsinstallationen. ClawHub-Pakete und der
    gebündelte/offizielle Katalog von OpenClaw sind vertrauenswürdige Quellen. Neue beliebige npm-, Git-,
    lokale Pfad-/Archiv-, `npm-pack:`- oder Marketplace-Quellen erfordern
    bei nicht interaktiven Installationen `--force`, nachdem Sie
    die Quelle geprüft und als vertrauenswürdig eingestuft haben.

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
    Ein verwaltetes Gateway mit aktivierter Konfigurationsneuladung erkennt den geänderten
    Plugin-Installationsdatensatz und startet automatisch neu. Andernfalls starten Sie es
    selbst neu:

    ```bash
    openclaw gateway restart
    ```

    Aktivierungs-/Deaktivierungsänderungen aktualisieren die Konfiguration und die kalte Registry. Eine Laufzeitinspektion ist
    weiterhin der eindeutigste Nachweis für aktive Laufzeitoberflächen.

  </Step>

  <Step title="Laufzeitregistrierung überprüfen">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Verwenden Sie `--runtime`, um registrierte Tools, Hooks, Dienste, Gateway-
    Methoden oder Plugin-eigene CLI-Befehle nachzuweisen. Das einfache `inspect` führt nur eine kalte Manifest-
    und Registry-Prüfung durch.

  </Step>
</Steps>

## Konfiguration

### Installationsquelle auswählen

| Quelle      | Verwendung                                                                       | Beispiel                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Sie möchten OpenClaw-native Suche, Scans, Versionsmetadaten und Installationshinweise | `openclaw plugins install clawhub:<package>`                   |
| npm         | Sie benötigen direkte npm-Registry- oder Dist-Tag-Arbeitsabläufe                             | `openclaw plugins install npm:<package>`                       |
| Git         | Sie benötigen einen Branch, ein Tag oder einen Commit aus einem Repository                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad  | Sie entwickeln oder testen ein Plugin auf demselben Computer                     | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie installieren ein Claude-kompatibles Marketplace-Plugin                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Paketangaben ohne Präfix weisen ein besonderes Kompatibilitätsverhalten auf: Ein einfacher Name, der
einer gebündelten Plugin-ID entspricht, verwendet diese gebündelte Quelle; ein einfacher Name, der
einer offiziellen externen Plugin-ID entspricht, verwendet den offiziellen Paketkatalog; jede andere
Angabe ohne Präfix wird während der Umstellung zur Einführung über npm installiert. Unverarbeitete `@openclaw/*`-
Angaben, die gebündelten Plugins entsprechen, werden vor dem npm-
Fallback ebenfalls auf die gebündelte Kopie aufgelöst. Verwenden Sie `npm:@openclaw/<plugin>@<version>`, um bewusst das
externe npm-Paket statt der gebündelten Kopie zu installieren. Verwenden Sie `clawhub:`, `npm:`,
`git:` oder `npm-pack:` für eine deterministische Quellenauswahl. Den vollständigen Befehlsvertrag finden Sie unter
[`openclaw plugins`](/de/cli/plugins#install).

Bei npm-Installationen wählen Angaben ohne feste Version und `@latest` das neueste stabile
Paket, das Kompatibilität mit diesem OpenClaw-Build ausweist. Wenn die
aktuelle neueste npm-Version eine neuere Version von `openclaw.compat.pluginApi` oder
`openclaw.install.minHostVersion` voraussetzt, als dieser Build unterstützt, durchsucht OpenClaw
ältere stabile Versionen und installiert die neueste passende Version. Exakte Versionen
und explizite Kanal-Tags wie `@beta` bleiben an das ausgewählte Paket gebunden
und schlagen bei Inkompatibilität fehl.

### Installationsrichtlinie für Betreiber

Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl auszuführen,
bevor eine Plugin-Installation oder -Aktualisierung fortgesetzt wird. Die Richtlinie erhält Metadaten sowie
den bereitgestellten Quellpfad und kann die Installation zulassen oder blockieren. Sie gilt sowohl für CLI-
als auch für Gateway-gestützte Installations-/Aktualisierungspfade. Plugin-Hooks vom Typ `before_install` werden
später ausgeführt und nur in OpenClaw-Prozessen, in denen Plugin-Hooks geladen sind. Verwenden Sie daher
stattdessen `security.installPolicy` für betreibereigene Installationsentscheidungen. Das
veraltete Flag `--dangerously-force-unsafe-install` wird aus
Kompatibilitätsgründen akzeptiert, bewirkt jedoch nichts: Es umgeht weder die Installationsrichtlinie noch die
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

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt die Such-/Lade-
  vorgänge. Veraltete Plugin-Referenzen bleiben währenddessen inaktiv; aktivieren Sie
  Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen.
- `plugins.deny` hat Vorrang vor der Zulassungsliste und der Aktivierung einzelner Plugins.
- `plugins.allow` ist eine exklusive Zulassungsliste. Plugin-eigene Tools außerhalb der
  Zulassungsliste bleiben auch dann nicht verfügbar, wenn `tools.allow` `"*"` enthält.
- `plugins.entries.<id>.enabled: false` deaktiviert ein einzelnes Plugin, behält aber dessen
  Konfiguration bei.
- `plugins.load.paths` fügt explizite lokale Plugin-Dateien oder -Verzeichnisse hinzu.
  Verwaltete lokale `plugins install`-Pfade müssen Plugin-Verzeichnisse oder
  Archive sein; verwenden Sie `plugins.load.paths` für eigenständige Plugin-Dateien.
- Aus dem Workspace stammende Plugins sind standardmäßig deaktiviert; aktivieren Sie sie explizit oder
  nehmen Sie sie in die Zulassungsliste auf, bevor Sie lokalen Workspace-Code verwenden.
- Gebündelte Plugins folgen ihren integrierten Metadaten für die standardmäßige Aktivierung bzw. Deaktivierung,
  sofern die Konfiguration dies nicht explizit überschreibt.
- `plugins.slots.<slot>` (`memory` oder `contextEngine`) wählt ein Plugin für eine
  exklusive Kategorie aus. Die Slot-Auswahl gilt als explizite Aktivierung und
  erzwingt die Aktivierung des ausgewählten Plugins für diesen Slot, selbst wenn es andernfalls
  eine explizite Aktivierung erfordern würde. `plugins.deny` und `plugins.entries.<id>.enabled: false` blockieren es
  weiterhin.
- Gebündelte Plugins mit expliziter Aktivierung können automatisch aktiviert werden, wenn die Konfiguration eine ihrer
  eigenen Oberflächen nennt, etwa eine Provider-/Modellreferenz, Kanalkonfiguration, ein CLI-Backend
  oder eine Agent-Harness-Laufzeit.
- Das Codex-Routing der OpenAI-Familie hält die Grenzen zwischen Provider und Laufzeit-Plugin
  getrennt: Ältere Codex-Modellreferenzen sind Legacy-Konfigurationen, die Doctor repariert,
  während das gebündelte Plugin `codex` die Codex-App-Server-Laufzeit für
  kanonische `openai/*`-Agent-Referenzen, explizite `agentRuntime.id: "codex"` und
  ältere `codex/*`-Referenzen bereitstellt.

Wenn `plugins.allow` nicht festgelegt ist und nicht gebündelte Plugins automatisch aus
dem Workspace oder globalen Plugin-Stammverzeichnissen erkannt werden, protokolliert der Startvorgang
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
mit den erkannten Plugin-IDs und bei kurzen Listen einem minimalen `plugins.allow`-
Ausschnitt. Führen Sie [`openclaw plugins list --enabled --verbose`](/de/cli/plugins#list)
oder [`openclaw plugins inspect <id>`](/de/cli/plugins#inspect) für die aufgeführte
Plugin-ID aus, bevor Sie vertrauenswürdige Plugins nach `openclaw.json` kopieren. Dieselbe
Vertrauensbindung gilt, wenn die Diagnose meldet, dass ein Plugin
`without install/load-path provenance` geladen wurde: Prüfen Sie diese Plugin-ID und binden Sie sie anschließend in
`plugins.allow` ein oder installieren Sie sie erneut aus einer vertrauenswürdigen Quelle, damit OpenClaw die Installationsherkunft
aufzeichnet.

Führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, wenn die Konfigurationsvalidierung
veraltete Plugin-IDs, Abweichungen zwischen Zulassungsliste und Tools oder ältere Pfade gebündelter Plugins
meldet.

## Plugin-Formate verstehen

OpenClaw erkennt zwei Plugin-Formate:

| Format                 | Ladevorgang                                                                 | Verwendung                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Natives OpenClaw-Plugin | `openclaw.plugin.json` sowie ein im Prozess geladenes Laufzeitmodul               | Sie installieren oder entwickeln OpenClaw-spezifische Laufzeitfunktionen  |
| Kompatibles Bundle      | Codex-, Claude- oder Cursor-Plugin-Struktur, die dem OpenClaw-Plugin-Verzeichnis zugeordnet wird | Sie verwenden kompatible Skills, Befehle, Hooks oder Bundle-Metadaten erneut |

Beide Formate werden in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` und `openclaw plugins disable` angezeigt. Informationen zur Kompatibilitätsgrenze für Bundles finden Sie unter
[Plugin-Bundles](/de/plugins/bundles) und Informationen zur Entwicklung nativer Plugins unter
[Plugins entwickeln](/de/plugins/building-plugins).

## Plugin-Hooks

Plugins können Hooks zur Laufzeit über zwei unterschiedliche APIs registrieren:

- Typisierte `api.on(...)`-Hooks für Ereignisse des Laufzeitlebenszyklus. Dies ist die
  bevorzugte Oberfläche für Middleware, Richtlinien, das Umschreiben von Nachrichten, die Prompt-
  Gestaltung und die Tool-Steuerung.
- `api.registerHook(...)` für das interne Hook-System, das unter
  [Hooks](/de/automation/hooks) beschrieben ist. Dies dient hauptsächlich groben Nebenwirkungen von Befehlen und Lebenszyklusereignissen
  sowie der Kompatibilität mit vorhandener Automatisierung im HOOK-Stil.

Faustregel: Wenn der Handler Priorität, Zusammenführungssemantik oder
Blockierungs-/Abbruchverhalten benötigt, verwenden Sie typisierte Hooks. Wenn er lediglich auf `command:new`,
`command:reset`, `message:sent` oder ähnliche grobe Ereignisse reagiert, ist `api.registerHook`
ausreichend.

Von Plugins verwaltete interne Hooks werden in `openclaw hooks list` mit
`plugin:<id>` angezeigt. Sie können sie nicht über `openclaw hooks` aktivieren oder deaktivieren;
aktivieren oder deaktivieren Sie stattdessen das Plugin.

## Aktives Gateway überprüfen

`openclaw plugins list` und einfaches `openclaw plugins inspect` lesen den kalten Konfigurations-,
Manifest- und Registrierungsstatus. Sie weisen nicht nach, dass ein bereits laufendes
Gateway denselben Plugin-Code importiert hat.

Wenn ein Plugin als installiert angezeigt wird, aber nicht für den Live-Chat-Datenverkehr verwendet wird:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Verwaltete Gateways werden nach Änderungen durch Installation, Aktualisierung und
Deinstallation, die den Plugin-Quellcode betreffen, automatisch neu gestartet. Stellen Sie bei VPS- oder Container-Installationen
sicher, dass ein manueller Neustart auf den tatsächlichen `openclaw gateway run`-Unterprozess abzielt, der
Ihre Kanäle bedient, und nicht nur auf einen Wrapper oder Supervisor.

## Fehlerbehebung

| Symptom                                                        | Prüfung                                                                                                                                      | Behebung                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin erscheint in `plugins list`, aber Laufzeit-Hooks werden nicht ausgeführt  | Verwenden Sie `openclaw plugins inspect <id> --runtime --json` und bestätigen Sie das aktive Gateway mit `gateway status --deep --require-rpc`             | Starten Sie das aktive Gateway nach Änderungen durch Installation, Aktualisierung, Konfiguration oder am Quellcode neu                               |
| Diagnosen zu doppelter Kanal- oder Tool-Zuständigkeit werden angezeigt         | Führen Sie `openclaw plugins list --enabled --verbose` aus, prüfen Sie jedes verdächtige Plugin mit `--runtime --json` und vergleichen Sie die Kanal-/Tool-Zuständigkeit | Deaktivieren Sie einen Zuständigen, entfernen Sie veraltete Installationen oder verwenden Sie Manifest-`preferOver` für einen beabsichtigten Ersatz      |
| Laut Konfiguration fehlt ein Plugin                                | Prüfen Sie im [Plugin-Inventar](/de/plugins/plugin-inventory), ob es gebündelt, offiziell extern oder nur als Quellcode verfügbar ist                           | Installieren Sie das externe Paket, aktivieren Sie das gebündelte Plugin oder entfernen Sie veraltete Konfigurationen                         |
| Konfiguration ist während der Installation ungültig                               | Lesen Sie die Validierungsmeldung und führen Sie `openclaw doctor --fix` aus, wenn sie auf einen veralteten Plugin-Status verweist                                             | Doctor kann ungültige Plugin-Konfiguration isolieren, indem der Eintrag deaktiviert und die ungültige Nutzlast entfernt wird     |
| Plugin-Pfad ist wegen verdächtiger Eigentümerschaft oder Berechtigungen blockiert | Prüfen Sie die Diagnose vor dem Konfigurationsfehler                                                                                             | Korrigieren Sie Eigentümerschaft/Berechtigungen im Dateisystem und führen Sie anschließend `openclaw plugins registry --refresh` aus                    |
| `OPENCLAW_NIX_MODE=1` blockiert Lebenszyklusbefehle                | Vergewissern Sie sich, dass die Installation von Nix verwaltet wird                                                                                                      | Ändern Sie die Plugin-Auswahl im Nix-Quellcode, statt Plugin-Mutatorbefehle zu verwenden                      |
| Abhängigkeitsimport schlägt zur Laufzeit fehl                             | Prüfen Sie, ob das Plugin über npm/git/ClawHub installiert oder aus einem lokalen Pfad geladen wurde                                                 | Führen Sie `openclaw plugins update <id>` aus, installieren Sie die Quelle erneut oder installieren Sie lokale Plugin-Abhängigkeiten selbst |

Wenn bei einem aktivierten verwalteten Plugin während des Gateway-Starts die Überprüfung der Nutzlast fehlschlägt,
isoliert OpenClaw genau dieses installierte Plugin-Stammverzeichnis für den Startvorgang und
bedient weiterhin andere Plugins. `openclaw status --all`, `openclaw health`
und `openclaw doctor` melden es als `configured-unavailable`. Reparieren oder installieren Sie
das Plugin erneut und starten Sie anschließend das Gateway neu. Eine intakte explizite `plugins.load.paths`-
Überschreibung mit derselben Plugin-ID wird nicht aufgrund einer veralteten defekten Installation isoliert.

Wenn eine veraltete Plugin-Konfiguration weiterhin ein nicht mehr auffindbares Kanal-Plugin benennt,
stuft die Konfigurationsvalidierung diesen Kanalschlüssel zu einer Warnung statt zu einem schwerwiegenden
Fehler herab, sodass der Gateway-Start weiterhin alle anderen Kanäle bedienen kann. Führen Sie
`openclaw doctor --fix` aus, um veraltete Plugin- und Kanaleinträge zu entfernen. Unbekannte
Kanalschlüssel ohne Hinweise auf ein veraltetes Plugin führen weiterhin zu einem Validierungsfehler, damit Tippfehler
sichtbar bleiben.

Bei einem beabsichtigten Kanalersatz sollte das bevorzugte Plugin
`channelConfigs.<channel-id>.preferOver` mit der veralteten oder weniger priorisierten
Plugin-ID deklarieren. Wenn beide Plugins explizit aktiviert sind, behält OpenClaw diese Anforderung bei
und meldet Diagnosen zu doppelter Kanal-/Tool-Zuständigkeit, statt stillschweigend
einen Zuständigen auszuwählen.

Wenn ein installiertes Paket meldet, dass es `requires compiled runtime output for
TypeScript entry ...`, wurde das Paket ohne die JavaScript-Dateien veröffentlicht,
die OpenClaw zur Laufzeit benötigt. Aktualisieren oder installieren Sie es erneut, nachdem der Herausgeber
kompiliertes JavaScript bereitgestellt hat, oder deaktivieren/deinstallieren Sie das Plugin bis dahin.

### Blockierte Eigentümerschaft des Plugin-Pfads

Wenn die Diagnose
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
meldet und die Validierung anschließend `plugin present but blocked` ausgibt, hat OpenClaw
Plugin-Dateien gefunden, die einem anderen Unix-Benutzer als dem ladenden Prozess gehören.
Behalten Sie die Plugin-Konfiguration bei; korrigieren Sie die Dateisystem-Eigentümerschaft oder führen Sie OpenClaw
als derselbe Benutzer aus, dem das Statusverzeichnis gehört.

Bei Docker-Installationen wird das offizielle Image als `node` (uid `1000`) ausgeführt, daher sollten die
vom Host eingebundenen OpenClaw-Konfigurations- und Arbeitsbereichsverzeichnisse normalerweise
uid `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, ändern Sie stattdessen die Eigentümerschaft des verwalteten Plugin-Stammverzeichnisses
auf root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Führen Sie nach der Korrektur der Eigentümerschaft `openclaw doctor --fix` oder
`openclaw plugins registry --refresh` erneut aus, damit die persistierte Plugin-Registrierung
mit den reparierten Dateien übereinstimmt.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Durchläufe beim Vorbereiten der Tools zu stocken scheinen, aktivieren Sie die Trace-Protokollierung
und suchen Sie nach Zeitmessungszeilen der Plugin-Tool-Factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] Factory-Zeitmessungen ...
```

Die Zusammenfassung führt die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factories auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisstruktur und der Angabe, ob das Tool
optional ist. Langsame Zeilen werden als Warnungen ausgegeben, wenn eine einzelne Factory
mindestens 1s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factories mindestens 5s dauert.

OpenClaw speichert erfolgreiche Ergebnisse von Plugin-Tool-Factories für wiederholte
Auflösungen mit demselben effektiven Anfragekontext zwischen. Der Cache-Schlüssel umfasst
die effektive Laufzeitkonfiguration, den Arbeitsbereich und die Agent-ID, die Sandbox-Richtlinie, Browser-
Einstellungen, den Zustellungskontext, die Identität des Anfordernden und den Zuständigkeitsstatus, sodass
Factories, die von diesen vertrauenswürdigen Feldern abhängen, bei einer Änderung des Kontexts
erneut ausgeführt werden. Wenn die Zeitmessungen weiterhin hoch bleiben, führt das Plugin möglicherweise aufwendige Arbeiten aus, bevor
es seine Tool-Definitionen zurückgibt.

Wenn ein Plugin die Zeitmessung dominiert, prüfen Sie seine Laufzeitregistrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren oder deaktivieren Sie anschließend dieses Plugin. Plugin-Autoren sollten das
aufwendige Laden von Abhängigkeiten in den Tool-Ausführungspfad verlagern, statt es
innerhalb der Tool-Factory durchzuführen.

Informationen zu Abhängigkeits-Stammverzeichnissen, zur Validierung von Paketmetadaten, zu Registrierungseinträgen, zum Neuladeverhalten
beim Start und zur Bereinigung veralteter Daten finden Sie unter
[Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution).

## Verwandte Themen

- [Plugins verwalten](/de/plugins/manage-plugins) - Befehlsbeispiele für Auflisten, Installieren, Aktualisieren, Deinstallieren und Veröffentlichen
- [`openclaw plugins`](/de/cli/plugins) - vollständige CLI-Referenz
- [Plugin-Inventar](/de/plugins/plugin-inventory) - generierte Liste gebündelter und externer Plugins
- [Plugin-Referenz](/de/plugins/reference) - generierte Referenzseiten für einzelne Plugins
- [Community-Plugins](/de/plugins/community) - Erkennung über ClawHub und Richtlinie für Dokumentations-PRs
- [Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution) - Installations-Stammverzeichnisse, Registrierungseinträge und Laufzeitgrenzen
- [Plugins erstellen](/de/plugins/building-plugins) - Leitfaden zur Entwicklung nativer Plugins
- [Übersicht über das Plugin SDK](/de/plugins/sdk-overview) - Laufzeitregistrierung, Hooks und API-Felder
- [Plugin-Manifest](/de/plugins/manifest) - Manifest- und Paketmetadaten
