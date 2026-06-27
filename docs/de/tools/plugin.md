---
doc-schema-version: 1
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Getting Started
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-06-27T18:20:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um Kanäle, Modell-Provider, Agent-Harnesses, Tools,
Skills, Sprache, Echtzeit-Transkription, Voice, Medienverständnis, Generierung,
Webabruf, Websuche und weitere Runtime-Funktionen.

Verwenden Sie diese Seite, wenn Sie ein Plugin installieren, den Gateway neu starten,
prüfen möchten, dass die Runtime es geladen hat, und häufige Setup-Fehler einordnen möchten.
Nur-Befehl-Beispiele finden Sie unter [Plugins verwalten](/de/plugins/manage-plugins).
Das vollständige generierte Inventar gebündelter, offizieller externer und nur im Quellcode vorhandener
Plugins finden Sie unter [Plugin-Inventar](/de/plugins/plugin-inventory).

## Anforderungen

Stellen Sie vor der Installation eines Plugins sicher, dass Sie Folgendes haben:

- einen OpenClaw-Checkout oder eine OpenClaw-Installation, in der die `openclaw`-CLI verfügbar ist
- Netzwerkzugriff auf die ausgewählte Quelle, etwa ClawHub, npm oder einen Git-Host
- alle Plugin-spezifischen Anmeldedaten, Konfigurationsschlüssel oder Betriebssystem-Tools, die
  in der Setup-Dokumentation dieses Plugins genannt werden
- die Berechtigung, den Gateway, der Ihre Kanäle bereitstellt, neu zu laden oder neu zu starten

## Schnellstart

<Steps>
  <Step title="Plugin finden">
    Durchsuchen Sie [ClawHub](/de/clawhub) nach öffentlichen Plugin-Paketen:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub ist die primäre Discovery-Oberfläche für Community-Plugins. Während der
    Umstellung zum Launch werden gewöhnliche Package-Spezifikationen ohne Präfix weiterhin von npm installiert, sofern
    sie keiner offiziellen Plugin-ID entsprechen. Rohe `@openclaw/*`-Package-Spezifikationen, die
    gebündelten Plugins entsprechen, verwenden die gebündelte Kopie aus dem aktuellen OpenClaw-Build. Verwenden Sie ein
    explizites Präfix, wenn Sie eine bestimmte Quelle benötigen.

  </Step>

  <Step title="Plugin installieren">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie fest gepinnte Versionen, wenn Sie
    reproduzierbare Produktionsinstallationen benötigen.

  </Step>

  <Step title="Konfigurieren und aktivieren">
    Konfigurieren Sie Plugin-spezifische Einstellungen unter `plugins.entries.<id>.config`.
    Aktivieren Sie das Plugin, wenn es noch nicht aktiviert ist:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Wenn Ihre Konfiguration eine restriktive `plugins.allow`-Liste verwendet, muss die installierte Plugin-ID
    dort vorhanden sein, bevor das Plugin geladen werden kann.
    `openclaw plugins install` fügt die installierte ID zu einer vorhandenen
    `plugins.allow`-Liste hinzu und entfernt dieselbe ID aus `plugins.deny`, damit die
    explizite Installation nach dem Neustart geladen werden kann.

  </Step>

  <Step title="Gateway neu laden lassen">
    Das Installieren, Aktualisieren oder Deinstallieren von Plugin-Code erfordert einen Gateway-Neustart.
    Wenn bereits ein verwalteter Gateway mit aktivierter Konfigurationsneuladung läuft,
    erkennt OpenClaw den geänderten Plugin-Installationsdatensatz und startet den
    Gateway automatisch neu. Wenn der Gateway nicht verwaltet wird oder das Neuladen deaktiviert ist,
    starten Sie ihn selbst neu:

    ```bash
    openclaw gateway restart
    ```

    Aktivierungs- und Deaktivierungsvorgänge aktualisieren die Konfiguration und aktualisieren die Cold Registry.
    Eine Runtime-Inspektion ist weiterhin der klarste Prüfpfad für Live-Runtime-Oberflächen.

  </Step>

  <Step title="Runtime-Registrierung prüfen">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Tools, Hooks, Dienste,
    Gateway-Methoden oder Plugin-eigene CLI-Befehle nachweisen müssen. Einfaches `inspect` ist eine Cold-Prüfung
    von Manifest und Registry.

  </Step>
</Steps>

## Konfiguration

### Installationsquelle auswählen

| Quelle      | Verwenden, wenn                                                                  | Beispiel                                                       |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Sie OpenClaw-native Discovery, Scans, Versionsmetadaten und Installationshinweise möchten | `openclaw plugins install clawhub:<package>`                   |
| npm         | Sie direkte npm-Registry- oder Dist-Tag-Workflows benötigen                     | `openclaw plugins install npm:<package>`                       |
| git         | Sie einen Branch, Tag oder Commit aus einem Repository benötigen                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| lokaler Pfad | Sie ein Plugin auf demselben Computer entwickeln oder testen                   | `openclaw plugins install --link ./my-plugin`                  |
| Marketplace | Sie ein Claude-kompatibles Marketplace-Plugin installieren                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Package-Spezifikationen ohne Präfix haben spezielles Kompatibilitätsverhalten. Wenn der reine Name
einer gebündelten Plugin-ID entspricht, verwendet OpenClaw diese gebündelte Quelle. Wenn er
einer offiziellen externen Plugin-ID entspricht, verwendet OpenClaw den offiziellen Package-Katalog. Andere
gewöhnliche Package-Spezifikationen ohne Präfix werden während der Umstellung zum Launch über npm installiert. Rohe
`@openclaw/*`-Package-Spezifikationen, die gebündelten Plugins entsprechen, werden ebenfalls auf die
gebündelte Kopie aufgelöst, bevor auf npm zurückgegriffen wird. Verwenden Sie `npm:@openclaw/<plugin>@<version>`, wenn
Sie bewusst das externe npm-Package statt der image-eigenen
gebündelten Kopie verwenden möchten. Verwenden Sie `clawhub:`, `npm:`, `git:` oder `npm-pack:`, wenn Sie
deterministische Quellenauswahl benötigen. Den vollständigen Befehlsvertrag finden Sie unter
[`openclaw plugins`](/de/cli/plugins#install).

Bei npm-Installationen wählen nicht gepinnte Package-Spezifikationen und `@latest` das neueste stabile
Package, das Kompatibilität mit diesem OpenClaw-Build ausweist. Wenn das aktuelle
neueste Release von npm ein neueres `openclaw.compat.pluginApi` oder
`openclaw.install.minHostVersion` deklariert, durchsucht OpenClaw ältere stabile Package-Versionen
und installiert die neueste passende Version. Exakte Versionen und explizite Channel-Tags
wie `@beta` bleiben auf das ausgewählte Package gepinnt und schlagen fehl, wenn sie inkompatibel sind.

### Installationsrichtlinie für Betreiber

Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl auszuführen, bevor
die Plugin-Installation oder -Aktualisierung fortgesetzt wird. Die Richtlinie erhält Metadaten sowie den bereitgestellten
Quellpfad und kann die Installation erlauben oder blockieren. Sie gilt für CLI- und Gateway-gestützte
Plugin-Installations- und Aktualisierungspfade. Plugin-`before_install`-Hooks laufen später nur in
OpenClaw-Prozessen, in denen Plugin-Hooks geladen sind. Verwenden Sie daher `security.installPolicy`
für betreibereigene Installationsentscheidungen. Das veraltete
`--dangerously-force-unsafe-install`-Flag wird aus Kompatibilitätsgründen akzeptiert, umgeht aber
weder die Installationsrichtlinie noch die integrierte Denylist für Plugin-Abhängigkeiten von OpenClaw.

Das gemeinsame Exec-Schema für `security.installPolicy`, das sowohl von Skills als auch
Plugins verwendet wird, finden Sie unter [Skills-Konfiguration](/de/tools/skills-config#operator-install-policy-securityinstallpolicy).

### Plugin-Richtlinie konfigurieren

Die übliche Plugin-Konfigurationsform ist:

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

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt Plugin-Discovery- und Ladearbeit.
  Veraltete Plugin-Referenzen sind inaktiv, solange dies aktiv ist; aktivieren Sie
  Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen.
- `plugins.deny` hat Vorrang vor Allow und Plugin-spezifischer Aktivierung.
- `plugins.allow` ist eine exklusive Allowlist. Plugin-eigene Tools außerhalb der
  Allowlist bleiben nicht verfügbar, auch wenn `tools.allow` `"*"` enthält.
- `plugins.entries.<id>.enabled: false` deaktiviert ein einzelnes Plugin, während dessen
  Konfiguration erhalten bleibt.
- `plugins.load.paths` fügt explizite lokale Plugin-Dateien oder -Verzeichnisse hinzu. Verwaltete
  lokale Pfade für `plugins install` müssen Plugin-Verzeichnisse oder Archive sein; verwenden Sie
  `plugins.load.paths` für eigenständige Plugin-Dateien.
- Plugins aus dem Workspace sind standardmäßig deaktiviert; aktivieren Sie sie explizit oder
  nehmen Sie sie in die Allowlist auf, bevor Sie lokalen Workspace-Code verwenden.
- Gebündelte Plugins folgen ihren integrierten Default-on-/Default-off-Metadaten, sofern
  die Konfiguration sie nicht explizit überschreibt.
- `plugins.slots.<slot>` wählt ein Plugin für exklusive Kategorien wie
  Speicher- und Kontext-Engines aus. Die Slot-Auswahl aktiviert das ausgewählte Plugin
  für diesen Slot zwangsweise, indem sie als explizite Aktivierung zählt; es kann geladen werden, auch wenn es
  andernfalls opt-in wäre. `plugins.deny` und
  `plugins.entries.<id>.enabled: false` blockieren es weiterhin.
- Gebündelte Opt-in-Plugins können automatisch aktiviert werden, wenn die Konfiguration eine ihrer eigenen
  Oberflächen benennt, etwa eine Provider-/Modell-Ref, Channel-Konfiguration, ein CLI-Backend oder eine Agent-
  Harness-Runtime.
- OpenAI-Family-Codex-Routing hält Provider- und Runtime-Plugin-Grenzen
  getrennt: Legacy-Codex-Modell-Refs sind Legacy-Konfiguration, die von Doctor repariert wird, während das gebündelte
  `codex`-Plugin die Codex-App-Server-Runtime für kanonische `openai/*`-Agent-
  Refs, explizite `agentRuntime.id: "codex"` und Legacy-`codex/*`-Refs besitzt.

Wenn `plugins.allow` nicht gesetzt ist und nicht gebündelte Plugins aus
Workspace- oder globalen Plugin-Roots automatisch entdeckt werden, protokolliert der Start
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
Die Warnung enthält entdeckte Plugin-IDs und bei kurzen Listen ein minimales
`plugins.allow`-Snippet. Führen Sie
[`openclaw plugins list --enabled --verbose`](/de/cli/plugins#list) oder
[`openclaw plugins inspect <id>`](/de/cli/plugins#inspect) mit der aufgelisteten Plugin-
ID aus, bevor Sie vertrauenswürdige Plugins in `openclaw.json` kopieren. Dieselbe Trust-Pinning-
Empfehlung gilt, wenn Diagnosen melden, dass ein Plugin
`without install/load-path provenance` geladen wurde: Inspizieren Sie diese Plugin-ID und pinnen Sie dann die
vertrauenswürdige ID in `plugins.allow` oder installieren Sie aus einer vertrauenswürdigen Quelle neu, damit OpenClaw
die Installationsprovenienz aufzeichnet.

Führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, wenn die Konfigurationsvalidierung
veraltete Plugin-IDs, Allowlist-/Tool-Abweichungen oder Legacy-Pfade gebündelter Plugins meldet.

## Plugin-Formate verstehen

OpenClaw erkennt zwei Plugin-Formate:

| Format                 | Wie es geladen wird                                                          | Verwenden, wenn                                                        |
| ---------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Natives OpenClaw-Plugin | `openclaw.plugin.json` plus ein im Prozess geladenes Runtime-Modul          | Sie OpenClaw-spezifische Runtime-Funktionen installieren oder erstellen |
| Kompatibles Bundle      | Codex-, Claude- oder Cursor-Plugin-Layout, das in das OpenClaw-Plugin-Inventar abgebildet wird | Sie kompatible Skills, Befehle, Hooks oder Bundle-Metadaten wiederverwenden |

Beide Formate erscheinen in `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` und `openclaw plugins disable`. Siehe
[Plugin-Bundles](/de/plugins/bundles) für die Bundle-Kompatibilitätsgrenze und
[Plugins erstellen](/de/plugins/building-plugins) für natives Plugin-Authoring.

## Plugin-Hooks

Plugins können zur Runtime Hooks registrieren, aber es gibt zwei verschiedene APIs mit
unterschiedlichen Aufgaben.

- Verwenden Sie typisierte Hooks über `api.on(...)` für Runtime-Lifecycle-Hooks. Dies ist die
  bevorzugte Oberfläche für Middleware, Richtlinien, Nachrichtenumschreibung, Prompt-Gestaltung
  und Tool-Steuerung.
- Verwenden Sie `api.registerHook(...)` nur, wenn Sie am internen
  Hook-System teilnehmen möchten, das unter [Hooks](/de/automation/hooks) beschrieben ist. Dies ist hauptsächlich für grobe
  Befehls-/Lifecycle-Nebeneffekte und Kompatibilität mit vorhandener HOOK-artiger
  Automatisierung gedacht.

Kurzregel:

- Wenn der Handler Priorität, Merge-Semantik oder Blockier-/Abbruchverhalten benötigt, verwenden Sie
  typisierte Plugin-Hooks.
- Wenn der Handler nur auf `command:new`, `command:reset`, `message:sent`
  oder ähnliche grobe Ereignisse reagiert, ist `api.registerHook(...)` in Ordnung.

Plugin-verwaltete interne Hooks erscheinen in `openclaw hooks list` mit
`plugin:<id>`. Sie können sie nicht über `openclaw hooks` aktivieren oder deaktivieren;
aktivieren oder deaktivieren Sie stattdessen das Plugin.

## Aktiven Gateway prüfen

`openclaw plugins list` und einfaches `openclaw plugins inspect` lesen kalte Config,
Manifest- und Registry-Zustände. Sie belegen nicht, dass ein bereits laufender Gateway
denselben Plugin-Code importiert hat.

Wenn ein Plugin installiert zu sein scheint, Live-Chat-Traffic es aber nicht verwendet:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Verwaltete Gateways starten automatisch neu, nachdem Plugin-Installationen, -Updates und
-Deinstallationen Plugin-Quellen ändern. Stellen Sie bei VPS- oder Container-Installationen
sicher, dass ein manueller Neustart den tatsächlichen `openclaw gateway run`-Child-Prozess
trifft, der Ihre Kanäle bedient, nicht nur einen Wrapper oder Supervisor.

## Fehlerbehebung

| Symptom                                                        | Prüfung                                                                                                                                      | Behebung                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin erscheint in `plugins list`, aber Runtime-Hooks laufen nicht  | Verwenden Sie `openclaw plugins inspect <id> --runtime --json` und bestätigen Sie den aktiven Gateway mit `gateway status --deep --require-rpc`             | Starten Sie den Live-Gateway nach Installation, Update, Config- oder Quelländerungen neu                               |
| Diagnosemeldungen zu doppeltem Kanal- oder Tool-Besitz erscheinen         | Führen Sie `openclaw plugins list --enabled --verbose` aus, prüfen Sie jedes verdächtige Plugin mit `--runtime --json`, und vergleichen Sie Kanal-/Tool-Besitz | Deaktivieren Sie einen Besitzer, entfernen Sie veraltete Installationen, oder verwenden Sie Manifest-`preferOver` für absichtliche Ersetzung      |
| Config meldet, dass ein Plugin fehlt                                | Prüfen Sie im [Plugin-Inventar](/de/plugins/plugin-inventory), ob es gebündelt, offiziell extern oder nur als Quelle verfügbar ist                           | Installieren Sie das externe Paket, aktivieren Sie das gebündelte Plugin, oder entfernen Sie veraltete Config                         |
| Config ist während der Installation ungültig                               | Lesen Sie die Validierungsmeldung und führen Sie `openclaw doctor --fix` aus, wenn sie auf veralteten Plugin-Zustand verweist                                           | Doctor kann ungültige Plugin-Config unter Quarantäne stellen, indem der Eintrag deaktiviert und die ungültige Payload entfernt wird     |
| Plugin-Pfad wird wegen verdächtigem Besitz oder Berechtigungen blockiert | Prüfen Sie die Diagnose vor dem Config-Fehler                                                                                             | Korrigieren Sie Dateisystem-Besitz/-Berechtigungen und führen Sie dann `openclaw plugins registry --refresh` aus                    |
| `OPENCLAW_NIX_MODE=1` blockiert Lifecycle-Befehle                | Bestätigen Sie, dass die Installation von Nix verwaltet wird                                                                                                      | Ändern Sie die Plugin-Auswahl in der Nix-Quelle, statt Plugin-Mutator-Befehle zu verwenden                      |
| Dependency-Import schlägt zur Laufzeit fehl                             | Prüfen Sie, ob das Plugin über npm/git/ClawHub installiert oder von einem lokalen Pfad geladen wurde                                                 | Führen Sie `openclaw plugins update <id>` aus, installieren Sie die Quelle neu, oder installieren Sie lokale Plugin-Dependencies selbst |

Wenn veraltete Plugin-Config weiterhin ein nicht mehr auffindbares Kanal-Plugin benennt,
überspringt der Gateway-Start diesen Plugin-gestützten Kanal, statt alle
anderen Kanäle zu blockieren. Führen Sie `openclaw doctor --fix` aus, um veraltete Plugin- und Kanal-
Einträge zu entfernen. Unbekannte Kanalschlüssel ohne Hinweise auf veraltete Plugins schlagen weiterhin bei der
Validierung fehl, damit Tippfehler sichtbar bleiben.

Für absichtliche Kanalersetzung sollte das bevorzugte Plugin
`channelConfigs.<channel-id>.preferOver` mit der Legacy- oder niedriger priorisierten
Plugin-ID deklarieren. Wenn beide Plugins explizit aktiviert sind, behält OpenClaw diese Anfrage bei
und meldet doppelte Kanal- oder Tool-Diagnosen, statt stillschweigend
einen Besitzer auszuwählen.

Wenn ein installiertes Paket meldet, dass es `requires compiled runtime output for
TypeScript entry ...`, wurde das Paket ohne die JavaScript-Dateien veröffentlicht,
die OpenClaw zur Laufzeit benötigt. Aktualisieren oder installieren Sie neu, nachdem der Publisher
kompiliertes JavaScript ausgeliefert hat, oder deaktivieren/deinstallieren Sie das Plugin bis dahin.

### Blockierter Plugin-Pfadbesitz

Wenn Plugin-Diagnosen
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
melden und die Config-Validierung mit `plugin present but blocked` folgt, hat OpenClaw
Plugin-Dateien gefunden, die einem anderen Unix-Benutzer gehören als dem Prozess, der sie lädt.
Behalten Sie die Plugin-Config bei; korrigieren Sie den Dateisystem-Besitz oder führen Sie
OpenClaw als denselben Benutzer aus, dem das Zustandsverzeichnis gehört.

Bei Docker-Installationen läuft das offizielle Image als `node` (uid `1000`), daher sollten die
vom Host bind-gemounteten OpenClaw-Config- und Workspace-Verzeichnisse normalerweise
uid `1000` gehören:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Wenn Sie OpenClaw absichtlich als root ausführen, reparieren Sie stattdessen den verwalteten Plugin-Root auf
root-Besitz:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Nachdem Sie den Besitz korrigiert haben, führen Sie erneut `openclaw doctor --fix` oder
`openclaw plugins registry --refresh` aus, damit die persistierte Plugin-Registry den
reparierten Dateien entspricht.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Turns beim Vorbereiten von Tools zu hängen scheinen, aktivieren Sie Trace-Logging und
prüfen Sie auf Timing-Zeilen der Plugin-Tool-Factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] factory timings ...
```

Die Zusammenfassung listet die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factorys auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisform und ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory mindestens
1 s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factorys mindestens 5 s dauert.

OpenClaw cached erfolgreiche Ergebnisse der Plugin-Tool-Factory für wiederholte Auflösungen
mit demselben effektiven Anfragekontext. Der Cache-Schlüssel enthält die effektive
Runtime-Config, Workspace, Agent-/Session-IDs, Sandbox-Richtlinie, Browser-Einstellungen,
Delivery-Kontext, Requester-Identität und Besitzstatus, sodass Factorys, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert. Wenn die Timings
hoch bleiben, erledigt das Plugin möglicherweise teure Arbeit, bevor es seine Tool-
Definitionen zurückgibt.

Wenn ein Plugin das Timing dominiert, prüfen Sie seine Runtime-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren Sie dieses Plugin dann neu, oder deaktivieren Sie es. Plugin-Autoren sollten teures
Dependency-Laden hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory zu erledigen.

Für Dependency-Roots, Paketmetadaten-Validierung, Registry-Einträge, Startup-
Reload-Verhalten und Legacy-Bereinigung siehe
[Plugin-Dependency-Auflösung](/de/plugins/dependency-resolution).

## Verwandt

- [Plugins verwalten](/de/plugins/manage-plugins) - Befehlsbeispiele für Auflisten, Installieren, Aktualisieren, Deinstallieren und Veröffentlichen
- [`openclaw plugins`](/de/cli/plugins) - vollständige CLI-Referenz
- [Plugin-Inventar](/de/plugins/plugin-inventory) - generierte Liste gebündelter und externer Plugins
- [Plugin-Referenz](/de/plugins/reference) - generierte Referenzseiten pro Plugin
- [Community-Plugins](/de/plugins/community) - ClawHub-Discovery und Docs-PR-Richtlinie
- [Plugin-Dependency-Auflösung](/de/plugins/dependency-resolution) - Installations-Roots, Registry-Einträge und Runtime-Grenzen
- [Plugins erstellen](/de/plugins/building-plugins) - Leitfaden zum Erstellen nativer Plugins
- [Plugin SDK-Überblick](/de/plugins/sdk-overview) - Runtime-Registrierung, Hooks und API-Felder
- [Plugin-Manifest](/de/plugins/manifest) - Manifest- und Paketmetadaten
