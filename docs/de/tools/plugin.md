---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-02T06:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Sprache, Medienverständnis, Bilderzeugung, Videoerzeugung, Webabruf, Websuche
und mehr. Einige Plugins sind **core** (werden mit OpenClaw ausgeliefert),
andere sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und gefunden. Npm bleibt für direkte
Installationen und für eine temporäre Gruppe OpenClaw-eigener Plugin-Pakete
unterstützt, während diese Migration abgeschlossen wird.

## Schnellstart

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer
    Konfigurationsdatei.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Tools, Dienste,
    Gateway-Methoden, Hooks oder Plugin-eigene CLI-Befehle nachweisen müssen.
    Ein einfaches `inspect` ist eine kalte Manifest-/Registry-Prüfung und
    vermeidet absichtlich den Import der Plugin-Laufzeit.

  </Step>
</Steps>

Wenn Sie eine chat-native Steuerung bevorzugen, aktivieren Sie
`commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler
Pfad/Archiv, explizites `clawhub:<pkg>`, explizites `npm:<pkg>`, explizites
`git:<repo>` oder eine reine Paketspezifikation (zuerst ClawHub, dann npm als
Fallback).

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise
geschlossen fehl und verweist Sie auf `openclaw doctor --fix`. Die einzige
Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte
Plugins, die `openclaw.install.allowInvalidConfigRecovery` aktivieren.
Während des Gateway-Starts wird eine ungültige Konfiguration für ein Plugin auf
dieses Plugin isoliert: Der Start protokolliert das Problem mit
`plugins.entries.<id>.config`, überspringt dieses Plugin beim Laden und hält
andere Plugins und Kanäle online. Führen Sie `openclaw doctor --fix` aus, um die
fehlerhafte Plugin-Konfiguration zu quarantänisieren, indem dieser Plugin-Eintrag
deaktiviert und dessen ungültige Konfigurationsnutzlast entfernt wird; das
normale Konfigurations-Backup behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar
ist, aber dieselbe veraltete Plugin-ID in der Plugin-Konfiguration oder in
Installationsdatensätzen verbleibt, protokolliert der Gateway-Start Warnungen und
überspringt diesen Kanal, anstatt jeden anderen Kanal zu blockieren. Führen Sie
`openclaw doctor --fix` aus, um die veralteten Kanal-/Plugin-Einträge zu
entfernen; unbekannte Kanalschlüssel ohne Nachweis eines veralteten Plugins
schlagen weiterhin bei der Validierung fehl, damit Tippfehler sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als
inert behandelt: Der Gateway-Start überspringt die Plugin-Erkennung und das
Laden, und `openclaw doctor` behält die deaktivierte Plugin-Konfiguration bei,
anstatt sie automatisch zu entfernen. Aktivieren Sie Plugins erneut, bevor Sie
die Doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden
sollen.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter
Installations-/Aktualisierungs- oder Doctor-Reparaturabläufe. Gateway-Start,
Konfigurationsneuladen und Laufzeitinspektion führen keine Paketmanager aus und
reparieren keine Abhängigkeitsbäume. Lokale Plugins müssen ihre Abhängigkeiten
bereits installiert haben, während npm-, git- und ClawHub-Plugins unter den von
OpenClaw verwalteten Plugin-Roots installiert werden. npm-Abhängigkeiten können
innerhalb des von OpenClaw verwalteten npm-Roots gehostet werden; Installation
und Aktualisierung scannen diesen verwalteten Root vor dem Vertrauen, und die
Deinstallation entfernt npm-verwaltete Pakete über npm. Externe Plugins und
benutzerdefinierte Ladepfade müssen weiterhin über `openclaw plugins install`
installiert werden. Siehe [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution)
für den Installationszeit-Lebenszyklus.

Source-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an
gebündelten Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt
gebündelte Plugins dann aus `extensions/<id>`, sodass Änderungen und
paketlokale Abhängigkeiten direkt verwendet werden. Einfache npm-Root-
Installationen sind für paketiertes OpenClaw gedacht, nicht für die Entwicklung
in Source-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                    | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird OpenClaw-Funktionen zugeordnet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie
unter [Plugin-Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit
[Plugins erstellen](/de/plugins/building-plugins) und der
[Plugin SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json`
deklarieren. Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu
einer lesbaren Laufzeitdatei auflösen oder zu einer TypeScript-Quelldatei mit
einem abgeleiteten gebauten JavaScript-Peer wie `src/index.ts` zu `dist/index.js`.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Laufzeitdateien
nicht an denselben Pfaden wie die Quelleinträge liegen. Falls vorhanden, muss
`runtimeExtensions` genau einen Eintrag für jeden `extensions`-Eintrag enthalten.
Nicht übereinstimmende Listen lassen Installation und Plugin-Erkennung
fehlschlagen, anstatt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie
auch `openclaw.setupEntry` veröffentlichen, verwenden Sie
`openclaw.runtimeSetupEntry` für dessen gebauten JavaScript-Peer; diese Datei ist
erforderlich, wenn sie deklariert wird.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Offizielle Plugins

### OpenClaw-eigene npm-Pakete während der Migration

ClawHub ist der primäre Verteilungsweg für die meisten Plugins. Aktuelle
paketierte OpenClaw-Releases bündeln bereits viele offizielle Plugins, daher
benötigen diese in normalen Setups keine separaten npm-Installationen. Bis jedes
OpenClaw-eigene Plugin zu ClawHub migriert ist, liefert OpenClaw weiterhin
einige `@openclaw/*`-Plugin-Pakete auf npm für ältere/benutzerdefinierte
Installationen und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese
Paketversion aus einer älteren externen Paketserie. Verwenden Sie das gebündelte
Plugin aus dem aktuellen OpenClaw oder einen lokalen Checkout, bis ein neueres
npm-Paket veröffentlicht wird.

| Plugin          | Paket                      | Dokumentation                              |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/de/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/de/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/de/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/de/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/de/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/de/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/de/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/de/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/de/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/de/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/de/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/de/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/de/plugins/zalouser)         |

### Core (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — gebündelte Speichersuche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — LanceDB-gestütztes Langzeitgedächtnis mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Siehe [Memory LanceDB](/de/plugins/memory-lancedb) für OpenAI-kompatible
    Embedding-Einrichtung, Ollama-Beispiele, Abruflimits und Fehlerbehebung.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; deaktivieren Sie es, bevor Sie es ersetzen)
    - `copilot-proxy` — VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)

  </Accordion>
</AccordionGroup>

Suchen Sie nach Drittanbieter-Plugins? Siehe
[Community-Plugins](/de/plugins/community).

## Konfiguration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Feld             | Beschreibung                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                          |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; Deny gewinnt)                  |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Pro-Plugin-Schalter + Konfiguration                       |

`plugins.allow` ist exklusiv. Wenn es nicht leer ist, können nur aufgeführte
Plugins geladen werden oder Tools bereitstellen, selbst wenn `tools.allow`
`"*"` oder einen bestimmten Plugin-eigenen Tool-Namen enthält. Wenn eine
Tool-Allowlist auf Plugin-Tools verweist, fügen Sie die besitzenden Plugin-IDs
zu `plugins.allow` hinzu oder entfernen Sie `plugins.allow`; `openclaw doctor`
warnt vor dieser Form.

Konfigurationsänderungen **erfordern einen Gateway-Neustart**. Wenn der Gateway
mit Konfigurationsüberwachung und aktiviertem In-Process-Neustart läuft (der
standardmäßige `openclaw gateway`-Pfad), wird dieser Neustart normalerweise kurz
nach dem Schreiben der Konfiguration automatisch ausgeführt. Es gibt keinen
unterstützten Hot-Reload-Pfad für nativen Plugin-Laufzeitcode oder Lifecycle-
Hooks; starten Sie den Gateway-Prozess neu, der den Live-Kanal bedient, bevor Sie
erwarten, dass aktualisierter `register(api)`-Code, `api.on(...)`-Hooks, Tools,
Dienste oder Provider-/Laufzeit-Hooks ausgeführt werden.

`openclaw plugins list` ist ein lokaler Snapshot der Plugin-Registry/-Konfiguration. Ein
dort als `enabled` markiertes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration zulassen, dass das
Plugin teilnimmt. Es beweist nicht, dass ein bereits laufendes entferntes Gateway-
Child mit demselben Plugin-Code neu gestartet wurde. Senden Sie bei VPS-/Container-Setups mit
Wrapper-Prozessen Neustarts an den tatsächlichen Prozess `openclaw gateway run`,
oder verwenden Sie `openclaw gateway restart` für das laufende Gateway.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin ist vorhanden, wurde aber durch Aktivierungsregeln ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin ist vorhanden, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag quarantänisieren, indem er ihn deaktiviert und seine Konfigurationsdaten entfernt.

</Accordion>

## Erkennung und Vorrang

OpenClaw sucht in dieser Reihenfolge nach Plugins (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade. Pfade, die
    zurück auf OpenClaws eigene paketierte gebündelte Plugin-Verzeichnisse zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere müssen explizit aktiviert werden.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten Baum `dist/extensions` auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
über den passenden paketierten Quellpfad bind-gemountet wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Quell-Overlay und erkennt es vor dem paketierten
Bundle `/app/dist/extensions/synology-chat`. So funktionieren Maintainer-Container-
Schleifen weiter, ohne jedes gebündelte Plugin zurück auf TypeScript-Quelle umzuschalten.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles
zu erzwingen, auch wenn Quell-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt die Plugin-Erkennung/-Ladearbeit
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem eingebauten standardmäßig-aktivierten Satz, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Kanalkonfiguration oder Harness-
  Runtime
- Veraltete Plugin-Konfiguration bleibt erhalten, während `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins wieder, bevor Sie eine Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen
- Codex-Routen der OpenAI-Familie behalten getrennte Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `agentRuntime.id: "codex"` oder alte
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber Nebenwirkungen oder Hooks von
`register(api)` im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass aktive
  Gateway-URL, Profil, Konfigurationspfad und Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Änderungen an Plugin-Installation, Konfiguration oder Code neu. In Wrapper-
  Containern kann PID 1 nur ein Supervisor sein; starten Sie den Child-Prozess
  `openclaw gateway run` neu oder signalisieren Sie ihn.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Verwenden Sie für Modellwechsel bevorzugt `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistentenausgabe erzeugt hat.
- Verwenden Sie als Nachweis des effektiven Sitzungsmodells `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Provider-Payloads das
  Gateway mit `--raw-stream --raw-stream-path <path>`.

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

Wenn ein Plugin die Zeit dominiert, prüfen Sie seine Runtime-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren Sie dann dieses Plugin neu oder deaktivieren Sie es. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verlagern, statt es
innerhalb der Tool-Factory zu erledigen.

### Doppelte Kanal- oder Tool-Zuständigkeit

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Das bedeutet, dass mehr als ein aktiviertes Plugin versucht, denselben Kanal,
Einrichtungsablauf oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Kanal-Plugin,
das neben einem gebündelten Plugin installiert ist, das inzwischen dieselbe Kanal-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen von
  Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie das Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Kanal-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit der
  niedriger priorisierten Plugin-ID deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat versehentlich ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anforderung bei und
  meldet den Konflikt. Wählen Sie einen Besitzer für den Kanal oder benennen Sie Plugin-eigene
  Tools um, damit die Runtime-Oberfläche eindeutig ist.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (jeweils nur eine aktiv):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Was er steuert        | Standard            |
| --------------- | --------------------- | ------------------- |
| `memory`        | Active-Memory-Plugin  | `memory-core`       |
| `contextEngine` | Aktive Kontext-Engine | `legacy` (eingebaut) |

## CLI-Referenz

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel
gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird nicht mit `--link` unterstützt, das den Quellpfad wiederverwendet, statt
über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor es sie aktiviert. Wenn dieselbe Plugin-ID
in `plugins.deny` vorhanden ist, entfernt install diesen veralteten Deny-Eintrag, damit die
explizite Installation nach einem Neustart sofort geladen werden kann.

OpenClaw hält eine persistierte lokale Plugin-Registry als Cold-Read-Modell für
Plugin-Inventar, Zuständigkeit für Beiträge und Startplanung vor. Installations-, Aktualisierungs-,
Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry nach Änderungen am Plugin-
Zustand. Dieselbe Datei `plugins/installs.json` hält dauerhafte Installationsmetadaten in
`installRecords` auf oberster Ebene und wiederaufbaubare Manifestmetadaten in `plugins`. Wenn
die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry
--refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinie und
Manifest-/Paketmetadaten neu auf, ohne Plugin-Runtime-Module zu laden.
`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Das Übergeben
einer npm-Paketspezifikation mit Dist-Tag oder exakter Version löst den Paketnamen
zurück auf den nachverfolgten Plugin-Datensatz auf und speichert die neue Spezifikation für künftige Updates.
Das Übergeben des Paketnamens ohne Version verschiebt eine exakt gepinnte Installation zurück auf
die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits mit
der aufgelösten Version und der gespeicherten Artefaktidentität übereinstimmt, überspringt OpenClaw das Update
ohne Download, Neuinstallation oder Neuschreiben der Konfiguration.

`--pin` ist nur für npm verfügbar. Es wird nicht mit `--marketplace` unterstützt, weil
Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Notfall-Übersteuerung für falsch positive
Treffer des integrierten Dangerous-Code-Scanners. Sie ermöglicht, dass Plugin-Installationen
und Plugin-Aktualisierungen trotz integrierter `critical`-Befunde fortgesetzt werden, umgeht aber weiterhin
keine Plugin-`before_install`-Policy-Blockierungen oder Blockierungen aufgrund fehlgeschlagener Scans.
Installations-Scans ignorieren gängige Testdateien und -verzeichnisse wie `tests/`,
`__tests__/`, `*.test.*` und `*.spec.*`, damit paketierte Test-Mocks nicht blockiert werden;
deklarierte Plugin-Runtime-Einstiegspunkte werden weiterhin gescannt, auch wenn sie einen dieser
Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations- und Aktualisierungsabläufe. Gateway-gestützte
Installationen von Skill-Abhängigkeiten verwenden stattdessen die passende
`dangerouslyForceUnsafeInstall`-Anfrageübersteuerung, während `openclaw skills install` der separate ClawHub-Ablauf zum
Herunterladen und Installieren von Skills bleibt.

Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Scan ausgeblendet oder blockiert wird, öffnen Sie das
ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub zu bitten,
es erneut zu prüfen. `--dangerously-force-unsafe-install` wirkt sich nur auf Installationen auf Ihrem eigenen
Rechner aus; es fordert ClawHub nicht auf, das Plugin erneut zu scannen, und macht eine blockierte Version
nicht öffentlich.

Kompatible Bundles nehmen am selben Ablauf zum Auflisten, Prüfen, Aktivieren und Deaktivieren von Plugins teil.
Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Befehls-Skills,
Claude-Standardwerte für `settings.json`, Claude-Standardwerte für `.lsp.json` und im Manifest deklarierte
`lspServers`, Cursor-Befehls-Skills sowie kompatible Codex-Hook-
Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie
unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-Bekannt-Marketplace-Name aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Stamm oder
`marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-
URL oder eine git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des
geklonten Marketplace-Repos bleiben und ausschließlich relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins`-CLI-Referenz](/de/cli/plugins).

## Plugin-API-Überblick

Native Plugins exportieren ein Einstiegsobjekt, das `register(api)` bereitstellt. Ältere
Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden, neue Plugins sollten jedoch
`register` verwenden.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw lädt das Einstiegsobjekt und ruft während der Plugin-
Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück,
aber gebündelte Plugins und neue externe Plugins sollten `register` als
öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Einstieg geladen wird:

| Modus           | Bedeutung                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-Aktivierung. Registrieren Sie Tools, Hooks, Dienste, Befehle, Routen und andere aktive Seiteneffekte.                                |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registrieren Sie Provider und Metadaten; vertrauenswürdiger Plugin-Einstiegscode kann geladen werden, aber aktive Seiteneffekte überspringen. |
| `setup-only`    | Laden von Kanal-Einrichtungsmetadaten über einen leichtgewichtigen Einrichtungseinstieg.                                                      |
| `setup-runtime` | Laden der Kanaleinrichtung, das zusätzlich den Runtime-Einstieg benötigt.                                                                     |
| `cli-metadata`  | Nur Sammlung von CLI-Befehlsmetadaten.                                                                                                       |

Plugin-Einstiege, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Seiteneffekte mit `api.registrationMode === "full"` schützen.
Discovery-Ladevorgänge werden getrennt von Aktivierungsladevorgängen zwischengespeichert und ersetzen nicht
die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber nicht importfrei:
OpenClaw kann den vertrauenswürdigen Plugin-Einstieg oder das Kanal-Plugin-Modul auswerten, um
den Snapshot zu erstellen. Halten Sie Top-Level-Code in Modulen leichtgewichtig und frei von Seiteneffekten, und verschieben Sie
Netzwerk-Clients, Subprozesse, Listener, das Lesen von Zugangsdaten und Dienststarts
hinter vollständige Runtime-Pfade.

Gängige Registrierungsmethoden:

| Methode                                 | Was sie registriert          |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)        |
| `registerChannel`                       | Chat-Kanal                   |
| `registerTool`                          | Agent-Tool                   |
| `registerHook` / `on(...)`              | Lebenszyklus-Hooks           |
| `registerSpeechProvider`                | Text-to-Speech / STT         |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme        |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse           |
| `registerImageGenerationProvider`       | Bilderzeugung                |
| `registerMusicGenerationProvider`       | Musikerzeugung               |
| `registerVideoGenerationProvider`       | Videoerzeugung               |
| `registerWebFetchProvider`              | Web-Abruf- / Scrape-Provider |
| `registerWebSearchProvider`             | Websuche                     |
| `registerHttpRoute`                     | HTTP-Endpunkt                |
| `registerCommand` / `registerCli`       | CLI-Befehle                  |
| `registerContextEngine`                 | Kontext-Engine               |
| `registerService`                       | Hintergrunddienst            |

Hook-Guard-Verhalten für typisierte Lebenszyklus-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt einen früheren Abbruch nicht auf.

Der native Codex-App-Server leitet Codex-native Tool-Ereignisse zurück in diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren,
Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Genehmigungen teilnehmen. Die Bridge schreibt Codex-native Tool-
Argumente noch nicht um. Die genaue Codex-Runtime-Unterstützungsgrenze ist im
[Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract) festgelegt.

Das vollständige typisierte Hook-Verhalten finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — erstellen Sie Ihr eigenes Plugin
- [Plugin-Bundles](/de/plugins/bundles) — Codex-/Claude-/Cursor-Bundle-Kompatibilität
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Einträge von Drittanbietern
