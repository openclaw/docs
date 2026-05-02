---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex/Claude-kompatiblen Plugin-Paketen
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-02T21:04:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Webabruf, Web-
suche und mehr. Einige Plugins sind **Kern-Plugins** (werden mit OpenClaw ausgeliefert), andere
sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und gefunden. Npm bleibt für direkte Installationen und für eine
temporäre Gruppe von OpenClaw-eigenen Plugin-Paketen unterstützt, während diese Migration abgeschlossen wird.

## Schnellstart

Beispiele zum Kopieren und Einfügen für Installation, Auflisten, Deinstallation, Aktualisierung und Veröffentlichung finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins).

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

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>

  <Step title="Chat-native management">
    In einem laufenden Gateway lösen die nur für Owner verfügbaren Befehle `/plugins enable` und `/plugins disable`
    den Gateway-Konfigurations-Reloader aus. Das Gateway lädt Plugin-Runtime-
    Oberflächen im laufenden Prozess neu, und neue Agent-Durchläufe bauen ihre Toolliste aus der
    aktualisierten Registry neu auf. `/plugins install` ändert den Plugin-Quellcode, daher fordert das
    Gateway einen Neustart an, statt vorzutäuschen, der aktuelle Prozess könne
    bereits importierte Module sicher neu laden.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Tools, Dienste, Gateway-
    Methoden, Hooks oder Plugin-eigene CLI-Befehle nachweisen müssen. Einfaches
    `inspect` ist eine kalte Manifest-/Registry-Prüfung und vermeidet absichtlich den Import der Plugin-Runtime.

  </Step>
</Steps>

Wenn Sie eine chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>`, explizites `npm:<pkg>`, explizites `git:<repo>` oder eine reine Paket-
Spezifikation über npm.

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte Plugins,
die `openclaw.install.allowInvalidConfigRecovery` aktivieren.
Während des Gateway-Starts wird ungültige Konfiguration für ein Plugin auf dieses Plugin isoliert:
Der Start protokolliert das Problem mit `plugins.entries.<id>.config`, überspringt dieses Plugin beim
Laden und hält andere Plugins und Kanäle online. Führen Sie `openclaw doctor --fix` aus,
um die fehlerhafte Plugin-Konfiguration zu quarantänisieren, indem dieser Plugin-Eintrag deaktiviert und
seine ungültige Konfigurationsnutzlast entfernt wird; das normale Konfigurations-Backup behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar ist, aber dieselbe
veraltete Plugin-ID weiterhin in Plugin-Konfiguration oder Installationsdatensätzen vorhanden ist, protokolliert der Gateway-Start
Warnungen und überspringt diesen Kanal, statt jeden anderen Kanal zu blockieren.
Führen Sie `openclaw doctor --fix` aus, um die veralteten Kanal-/Plugin-Einträge zu entfernen; unbekannte
Kanalschlüssel ohne Hinweis auf veraltete Plugins schlagen weiterhin bei der Validierung fehl, damit Tippfehler
sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als inaktiv behandelt:
Der Gateway-Start überspringt Plugin-Erkennung/-Ladevorgänge und `openclaw doctor` bewahrt
die deaktivierte Plugin-Konfiguration, statt sie automatisch zu entfernen. Aktivieren Sie Plugins erneut, bevor
Sie die Doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden sollen.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter Installations-/Aktualisierungs- oder
Doctor-Reparaturabläufe. Gateway-Start, Konfigurations-Neuladen und Runtime-Inspektion führen
keine Paketmanager aus und reparieren keine Abhängigkeitsbäume. Lokale Plugins müssen ihre
Abhängigkeiten bereits installiert haben, während npm-, git- und ClawHub-Plugins
unter den von OpenClaw verwalteten Plugin-Roots installiert werden. npm-Abhängigkeiten können
innerhalb des von OpenClaw verwalteten npm-Roots hoisted werden; Installation/Aktualisierung durchsucht diesen verwalteten Root vor
Trust, und Deinstallation entfernt npm-verwaltete Pakete über npm. Externe Plugins
und benutzerdefinierte Ladepfade müssen weiterhin über `openclaw plugins install` installiert werden.
Verwenden Sie `openclaw plugins list --json`, um den statischen `dependencyStatus` für jedes
sichtbare Plugin zu sehen, ohne Runtime-Code zu importieren oder Abhängigkeiten zu reparieren.
Siehe [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution) für den
Installationszeit-Lebenszyklus.

Quellcode-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an gebündelten
Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt gebündelte Plugins dann aus
`extensions/<id>`, sodass Änderungen und paketlokale Abhängigkeiten direkt verwendet werden.
Einfache npm-Root-Installationen sind für paketiertes OpenClaw gedacht, nicht für die Entwicklung mit
Quellcode-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                       | Beispiele                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativ** | `openclaw.plugin.json` + Runtime-Modul; wird im Prozess ausgeführt       | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin-Bundles](/de/plugins/bundles) für Bundle-Details.

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json` deklarieren.
Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu einer lesbaren
Runtime-Datei auflösen oder zu einer TypeScript-Quelldatei mit einer abgeleiteten gebauten JavaScript-
Entsprechung wie `src/index.ts` zu `dist/index.js`.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Runtime-Dateien nicht unter denselben
Pfaden wie die Quelleinträge liegen. Wenn vorhanden, muss `runtimeExtensions`
genau einen Eintrag für jeden `extensions`-Eintrag enthalten. Nicht übereinstimmende Listen lassen Installation und
Plugin-Erkennung fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie auch
`openclaw.setupEntry` veröffentlichen, verwenden Sie `openclaw.runtimeSetupEntry` für dessen gebaute
JavaScript-Entsprechung; diese Datei ist erforderlich, wenn sie deklariert wird.

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

ClawHub ist der primäre Distributionspfad für die meisten Plugins. Aktuelle paketierte
OpenClaw-Releases bündeln bereits viele offizielle Plugins, sodass diese in normalen Setups keine
separaten npm-Installationen benötigen. Bis jedes OpenClaw-eigene Plugin zu
ClawHub migriert ist, liefert OpenClaw weiterhin einige `@openclaw/*`-Plugin-Pakete auf
npm für ältere/benutzerdefinierte Installationen und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese Paket-
Version aus einem älteren externen Paketstrang. Verwenden Sie das gebündelte Plugin aus
aktuellem OpenClaw oder einem lokalen Checkout, bis ein neueres npm-Paket veröffentlicht wird.

| Plugin          | Paket                    | Dokumentation                                       |
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

### Kern (wird mit OpenClaw ausgeliefert)

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
    Embedding-Einrichtung, Ollama-Beispiele, Abrufgrenzen und Fehlerbehebung.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die `browser.request`-Gateway-Methode, Browser-Runtime und den Standard-Browser-Steuerungsdienst (standardmäßig aktiviert; deaktivieren Sie es, bevor Sie es ersetzen)
    - `copilot-proxy` — VS Code Copilot Proxy-Bridge (standardmäßig deaktiviert)

  </Accordion>
</AccordionGroup>

Suchen Sie Drittanbieter-Plugins? Siehe [Community-Plugins](/de/plugins/community).

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

| Feld            | Beschreibung                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                           |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; Deny gewinnt)                     |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                            |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Plugin-spezifische Schalter + Konfiguration                               |

`plugins.allow` ist exklusiv. Wenn es nicht leer ist, können nur aufgelistete Plugins laden
oder Tools bereitstellen, selbst wenn `tools.allow` `"*"` oder einen bestimmten Plugin-eigenen
Toolnamen enthält. Wenn eine Tool-Allowlist auf Plugin-Tools verweist, fügen Sie die owning Plugin-IDs
zu `plugins.allow` hinzu oder entfernen Sie `plugins.allow`; `openclaw doctor` warnt vor dieser
Form.

Konfigurationsänderungen, die über `/plugins enable` oder `/plugins disable` vorgenommen werden, lösen ein
prozessinternes Neuladen der Gateway-Plugins aus. Neue Agent-Turns erstellen ihre Tool-Liste aus
der aktualisierten Plugin-Registry neu. Quellcodeändernde Vorgänge wie Installation,
Aktualisierung und Deinstallation starten den Gateway-Prozess weiterhin neu, weil bereits importierte
Plugin-Module nicht sicher an Ort und Stelle ersetzt werden können.

`openclaw plugins list` ist ein lokaler Snapshot der Plugin-Registry/Konfiguration. Ein dort als
`enabled` markiertes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufendes Remote-Gateway
neu geladen oder mit demselben Plugin-Code neu gestartet wurde. Bei VPS-/Container-Setups
mit Wrapper-Prozessen senden Sie Neustarts oder Schreibvorgänge, die ein Neuladen auslösen, an den tatsächlichen
`openclaw gateway run`-Prozess, oder verwenden Sie `openclaw gateway restart` für das
laufende Gateway, wenn das Neuladen einen Fehler meldet.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Das Plugin ist vorhanden, wurde aber durch Aktivierungsregeln ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Das Plugin ist vorhanden, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag isolieren, indem es ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Erkennung und Vorrang

OpenClaw sucht in dieser Reihenfolge nach Plugins (der erste Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade. Pfade, die zurück
    auf die eigenen paketierten gebündelten Plugin-Verzeichnisse von OpenClaw zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere müssen explizit aktiviert werden.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
über den passenden paketierten Quellpfad gemountet wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Quell-Overlay und erkennt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. So bleiben Maintainer-Container-Loops
funktionsfähig, ohne jedes gebündelte Plugin wieder auf TypeScript-Quelle umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles zu erzwingen,
auch wenn Quell-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt die Plugin-Erkennung/-Ladearbeit
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace-Ursprung sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen der integrierten Standard-aktiv-Menge, sofern sie nicht überschrieben wird
- Exklusive Slots können das ausgewählte Plugin für diesen Slot erzwungen aktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Kanalkonfiguration oder Harness-
  Runtime
- Veraltete Plugin-Konfiguration bleibt erhalten, während `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen
- OpenAI-Familien-Codex-Routen behalten separate Plugin-Grenzen bei:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `agentRuntime.id: "codex"` oder ältere
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Seiteneffekte oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Änderungen an Plugin-Installation, Konfiguration oder Code neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den untergeordneten
  `openclaw gateway run`-Prozess neu oder signalisieren Sie ihn.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Konversations-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es wird vor der Modellauflösung
  für Agent-Turns ausgeführt; `llm_output` wird erst ausgeführt, nachdem ein Modellversuch
  Assistentenausgabe erzeugt hat.
- Als Nachweis für das effektive Sitzungsmodell verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Provider-Nutzlasten
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Turns beim Vorbereiten von Tools zu hängen scheinen, aktivieren Sie Trace-Logging und
prüfen Sie auf Timing-Zeilen der Plugin-Tool-Factorys:

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
1s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factorys mindestens 5s dauert.

OpenClaw speichert erfolgreiche Ergebnisse von Plugin-Tool-Factorys für wiederholte Auflösungen
mit demselben effektiven Request-Kontext im Cache. Der Cache-Schlüssel enthält die effektive
Runtime-Konfiguration, den Workspace, Agent-/Sitzungs-IDs, Sandbox-Policy, Browser-Einstellungen,
Auslieferungskontext, Requester-Identität und Besitzstatus, sodass Factorys, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert.

Wenn ein Plugin das Timing dominiert, prüfen Sie seine Runtime-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, installieren Sie dieses Plugin dann neu oder deaktivieren Sie es. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory auszuführen.

### Doppelte Kanal- oder Tool-Eigentümerschaft

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Das bedeutet, dass mehr als ein aktiviertes Plugin versucht, denselben Kanal,
Setup-Flow oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externer Kanal-Plugin,
der neben einem gebündelten Plugin installiert ist, das nun dieselbe Kanal-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen
  von Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie das Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Kanal-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit
  der niedriger priorisierten Plugin-ID deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat unbeabsichtigt ist, deaktivieren Sie eine Seite mit
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

| Slot            | Was er steuert         | Standard            |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Active-Memory-Plugin   | `memory-core`       |
| `contextEngine` | Aktive Context Engine  | `legacy` (integriert) |

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

openclaw plugins install <package>         # install from npm by default
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
gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin). Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Pack an Ort und Stelle. Verwenden Sie
`openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-
Plugins. Es wird nicht mit `--link` unterstützt, das den Quellpfad wiederverwendet,
statt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die
installierte Plugin-ID dieser Allowlist hinzu, bevor es sie aktiviert. Wenn dieselbe Plugin-ID
in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, sodass die
explizite Installation nach einem Neustart sofort geladen werden kann.

OpenClaw führt eine persistente lokale Plugin-Registry als kaltes Lesemodell für
Plugin-Bestand, Beitragszuständigkeit und Startplanung. Installations-,
Aktualisierungs-, Deinstallations-, Aktivierungs- und Deaktivierungsabläufe
aktualisieren diese Registry, nachdem sie den Plugin-Zustand geändert haben. Die
gleiche Datei `plugins/installs.json` enthält dauerhafte Installationsmetadaten
in `installRecords` auf oberster Ebene und neu erstellbare Manifest-Metadaten in
`plugins`. Wenn die Registry fehlt, veraltet oder ungültig ist, baut
`openclaw plugins registry --refresh` ihre Manifest-Ansicht aus
Installationsdatensätzen, Konfigurationsrichtlinie und Manifest-/Paketmetadaten
neu auf, ohne Plugin-Laufzeitmodule zu laden.
`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte
Installationen. Wenn Sie eine npm-Paketspezifikation mit einem dist-tag oder
einer exakten Version übergeben, wird der Paketname wieder dem nachverfolgten
Plugin-Datensatz zugeordnet und die neue Spezifikation für zukünftige
Aktualisierungen gespeichert. Wenn Sie den Paketnamen ohne Version übergeben,
wird eine exakt fixierte Installation zurück auf die Standard-Release-Linie der
Registry gesetzt. Wenn das installierte npm-Plugin bereits der aufgelösten
Version und der gespeicherten Artefaktidentität entspricht, überspringt OpenClaw
die Aktualisierung, ohne herunterzuladen, neu zu installieren oder die
Konfiguration neu zu schreiben.
Wenn `openclaw update` auf dem Beta-Kanal ausgeführt wird, versuchen npm- und
ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen auf
Standard/latest zurück, wenn keine Plugin-Beta-Version existiert. Exakte
Versionen und explizite Tags bleiben fixiert.

`--pin` ist nur für npm vorgesehen. Es wird nicht mit `--marketplace`
unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten statt
einer npm-Spezifikation dauerhaft speichern.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Übersteuerung für
Fehlalarme des integrierten Scanners für gefährlichen Code. Sie erlaubt, dass
Plugin-Installationen und Plugin-Aktualisierungen trotz integrierter
`critical`-Befunde fortgesetzt werden, umgeht aber weiterhin keine
Plugin-`before_install`-Richtlinienblockaden und keine Blockierung bei
Scan-Fehlern. Installationsscans ignorieren gängige Testdateien und
Verzeichnisse wie `tests/`, `__tests__/`, `*.test.*` und `*.spec.*`, um
paketierte Test-Mocks nicht zu blockieren; deklarierte
Plugin-Laufzeit-Einstiegspunkte werden weiterhin gescannt, auch wenn sie einen
dieser Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations- und
Aktualisierungsabläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen
verwenden stattdessen die passende Anfrageübersteuerung
`dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate
ClawHub-Ablauf zum Herunterladen und Installieren von Skills bleibt.

Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Scan
ausgeblendet oder blockiert wird, öffnen Sie das ClawHub-Dashboard oder führen
Sie `clawhub package rescan <name>` aus, um ClawHub um eine erneute Prüfung zu
bitten. `--dangerously-force-unsafe-install` wirkt sich nur auf Installationen
auf Ihrem eigenen Rechner aus; es fordert ClawHub nicht auf, das Plugin erneut
zu scannen oder eine blockierte Version öffentlich zu machen.

Kompatible Bundles nehmen am gleichen Plugin-Ablauf zum Auflisten, Inspizieren,
Aktivieren und Deaktivieren teil. Die aktuelle Laufzeitunterstützung umfasst
Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Standards, Claude
`.lsp.json`- und im Manifest deklarierte `lspServers`-Standards,
Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten
sowie unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für
Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-Name für bekannte Marketplaces aus
`~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Stamm oder
`marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine
GitHub-Repository-URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen
Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben und
dürfen nur relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins`-CLI-Referenz](/de/cli/plugins).

## Übersicht über die Plugin-API

Native Plugins exportieren ein Einstiegobjekt, das `register(api)` bereitstellt.
Ältere Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden,
neue Plugins sollten jedoch `register` verwenden.

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

OpenClaw lädt das Einstiegobjekt und ruft während der Plugin-Aktivierung
`register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf
`activate(api)` zurück, aber gebündelte Plugins und neue externe Plugins
sollten `register` als öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Einstieg geladen wird:

| Modus           | Bedeutung                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Laufzeitaktivierung. Registriert Tools, Hooks, Services, Befehle, Routen und andere Live-Nebeneffekte.                                       |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Einstiegscode kann laden, aber Live-Nebeneffekte überspringen. |
| `setup-only`    | Laden von Kanal-Einrichtungsmetadaten über einen leichtgewichtigen Einrichtungseinstieg.                                                     |
| `setup-runtime` | Laden der Kanal-Einrichtung, die zusätzlich den Laufzeiteinstieg benötigt.                                                                    |
| `cli-metadata`  | Nur Sammlung von CLI-Befehlsmetadaten.                                                                                                       |

Plugin-Einstiege, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige
Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"`
absichern. Discovery-Ladevorgänge werden getrennt von Aktivierungsladevorgängen
zwischengespeichert und ersetzen die laufende Gateway-Registry nicht. Discovery
ist nicht aktivierend, aber nicht importfrei: OpenClaw kann den
vertrauenswürdigen Plugin-Einstieg oder das Kanal-Plugin-Modul auswerten, um den
Snapshot zu erstellen. Halten Sie oberste Modulebenen leichtgewichtig und frei
von Nebeneffekten, und verschieben Sie Netzwerk-Clients, Unterprozesse,
Listener, das Lesen von Zugangsdaten und den Servicestart hinter
Voll-Laufzeitpfade.

Gängige Registrierungsmethoden:

| Methode                                 | Was sie registriert            |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | Modell-Provider (LLM)          |
| `registerChannel`                       | Chat-Kanal                     |
| `registerTool`                          | Agenten-Tool                   |
| `registerHook` / `on(...)`              | Lifecycle-Hooks                |
| `registerSpeechProvider`                | Text-to-Speech / STT           |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                  |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeit-Sprache        |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse             |
| `registerImageGenerationProvider`       | Bildgenerierung                |
| `registerMusicGenerationProvider`       | Musikgenerierung               |
| `registerVideoGenerationProvider`       | Videogenerierung               |
| `registerWebFetchProvider`              | Web-Abruf-/Scrape-Provider     |
| `registerWebSearchProvider`             | Websuche                       |
| `registerHttpRoute`                     | HTTP-Endpunkt                  |
| `registerCommand` / `registerCli`       | CLI-Befehle                    |
| `registerContextEngine`                 | Kontext-Engine                 |
| `registerService`                       | Hintergrund-Service            |

Hook-Guard-Verhalten für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt keine frühere Blockierung auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt keine frühere Blockierung auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt keine frühere Abbruchentscheidung auf.

Der native Codex-App-Server leitet native Codex-Tool-Ereignisse zurück in diese
Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call`
blockieren, Ergebnisse über `after_tool_call` beobachten und an Codex-
`PermissionRequest`-Genehmigungen teilnehmen. Die Brücke schreibt native
Codex-Tool-Argumente noch nicht um. Die genaue Unterstützungsgrenze der
Codex-Laufzeit ist im
[Codex-Harness-v1-Unterstützungsvertrag](/de/plugins/codex-harness#v1-support-contract)
festgelegt.

Das vollständige Verhalten typisierter Hooks finden Sie in der [SDK-Übersicht](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins) — Erstellen Sie Ihr eigenes Plugin
- [Plugin-Bundles](/de/plugins/bundles) — Codex-/Claude-/Cursor-Bundle-Kompatibilität
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agenten-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Einträge von Drittanbietern
