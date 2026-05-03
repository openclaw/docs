---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:39:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e3cffc15c5c52dd539e21103c207c9e38955f9fd3acd561a52964eefafb8f0
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Abruf, Web-
Suche und mehr. Einige Plugins sind **core** (mit OpenClaw ausgeliefert), andere
sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und gefunden. Npm bleibt für direkte Installationen und für eine
vorübergehende Gruppe von OpenClaw-eigenen Plugin-Paketen unterstützt, während
diese Migration abgeschlossen wird.

## Schnellstart

Beispiele zum Kopieren und Einfügen für Installation, Auflisten, Deinstallation,
Aktualisierung und Veröffentlichung finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins).

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
    ```bash
    # ClawHub-Plugins suchen
    openclaw plugins search "calendar"

    # Von ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # Von npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # Von git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # Aus einem lokalen Verzeichnis oder Archiv
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer Konfigurationsdatei.

  </Step>

  <Step title="Chat-native Verwaltung">
    In einem laufenden Gateway lösen die nur für Owner verfügbaren Befehle `/plugins enable` und `/plugins disable`
    den Konfigurations-Neulader des Gateway aus. Das Gateway lädt die Plugin-Runtime-
    Oberflächen im Prozess neu, und neue Agent-Turns bauen ihre Tool-Liste aus der
    aktualisierten Registry neu auf. `/plugins install` ändert Plugin-Quellcode, daher
    fordert das Gateway einen Neustart an, statt vorzugeben, der aktuelle Prozess könne
    bereits importierte Module sicher neu laden.

  </Step>

  <Step title="Plugin verifizieren">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # Wenn das Plugin einen CLI-Root registriert hat, führen Sie einen Befehl aus diesem Root aus.
    openclaw <plugin-command> --help
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Tools, Dienste, Gateway-
    Methoden, Hooks oder Plugin-eigene CLI-Befehle nachweisen müssen. Reines
    `inspect` ist eine kalte Manifest-/Registry-Prüfung und vermeidet bewusst den Import der Plugin-Runtime.

  </Step>
</Steps>

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true` und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokaler Pfad/Archiv, explizites
`clawhub:<pkg>`, explizites `npm:<pkg>`, explizites `git:<repo>` oder eine einfache Paketspezifikation
über npm.

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise geschlossen fehl und verweist Sie auf
`openclaw doctor --fix`. Die einzige Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte Plugins
für Plugins, die sich für
`openclaw.install.allowInvalidConfigRecovery` entscheiden.
Während des Gateway-Starts schlägt ungültige Plugin-Konfiguration wie jede andere ungültige
Konfiguration geschlossen fehl. Führen Sie `openclaw doctor --fix` aus, um die fehlerhafte Plugin-Konfiguration zu quarantänisieren, indem
dieser Plugin-Eintrag deaktiviert und seine ungültige Konfigurationsnutzlast entfernt wird; das normale
Konfigurations-Backup behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar ist, aber dieselbe veraltete Plugin-ID in der Plugin-Konfiguration oder in Installationsdatensätzen verbleibt, protokolliert der Gateway-Start
Warnungen und überspringt diesen Kanal, statt jeden anderen Kanal zu blockieren.
Führen Sie `openclaw doctor --fix` aus, um die veralteten Kanal-/Plugin-Einträge zu entfernen; unbekannte
Kanalschlüssel ohne Nachweis eines veralteten Plugins schlagen weiterhin bei der Validierung fehl, damit Tippfehler
sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als inaktiv behandelt:
Der Gateway-Start überspringt Plugin-Erkennung/-Laden und `openclaw doctor` behält
die deaktivierte Plugin-Konfiguration bei, statt sie automatisch zu entfernen. Aktivieren Sie Plugins wieder, bevor
Sie die Doctor-Bereinigung ausführen, wenn veraltete Plugin-IDs entfernt werden sollen.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter Installations-/Update- oder
Doctor-Reparaturabläufe. Gateway-Start, Konfigurations-Neuladen und Runtime-Inspektion
führen keine Paketmanager aus und reparieren keine Abhängigkeitsbäume. Lokale Plugins müssen ihre
Abhängigkeiten bereits installiert haben, während npm-, git- und ClawHub-Plugins
unter den von OpenClaw verwalteten Plugin-Roots installiert werden. npm-Abhängigkeiten können
innerhalb von OpenClaws verwaltetem npm-Root gehoistet werden; Installation/Update durchsucht diesen verwalteten Root vor
Vertrauen, und Deinstallation entfernt npm-verwaltete Pakete über npm. Externe Plugins
und benutzerdefinierte Ladepfade müssen weiterhin über `openclaw plugins install` installiert werden.
Verwenden Sie `openclaw plugins list --json`, um den statischen `dependencyStatus` für jedes
sichtbare Plugin zu sehen, ohne Runtime-Code zu importieren oder Abhängigkeiten zu reparieren.
Siehe [Plugin-Abhängigkeitsauflösung](/de/plugins/dependency-resolution) für den
Installationszeit-Lebenszyklus.

Bei npm-Installationen werden veränderliche Selektoren wie `latest` oder ein dist-tag
vor der Installation aufgelöst und anschließend auf die exakt verifizierte Version in OpenClaws
verwaltetem npm-Root gepinnt. Nachdem npm abgeschlossen ist, verifiziert OpenClaw, dass der installierte
`package-lock.json`-Eintrag weiterhin zur aufgelösten Version und Integrität passt. Wenn
npm andere Paketmetadaten schreibt, schlägt die Installation fehl und das verwaltete Paket
wird zurückgesetzt, statt ein anderes Plugin-Artefakt zu akzeptieren.

Source-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an gebündelten
Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt gebündelte Plugins dann aus
`extensions/<id>`, sodass Änderungen und paketlokale Abhängigkeiten direkt verwendet werden.
Reine npm-Root-Installationen sind für paketiertes OpenClaw gedacht, nicht für die Entwicklung in
Source-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                   | Beispiele                                              |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Runtime-Modul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete              |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; wird OpenClaw-Funktionen zugeordnet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Siehe [Plugin-Bundles](/de/plugins/bundles) für Bundle-Details.

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json` deklarieren.
Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu einer lesbaren
Runtime-Datei auflösen oder zu einer TypeScript-Quelldatei mit einem abgeleiteten gebauten JavaScript-
Pendant wie `src/index.ts` zu `dist/index.js`.
Paketierte Installationen müssen diese JavaScript-Runtime-Ausgabe ausliefern. Der TypeScript-
Quell-Fallback ist für Source-Checkouts und lokale Entwicklungspfade gedacht, nicht für
npm-Pakete, die in OpenClaws verwaltetem Plugin-Root installiert werden.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Runtime-Dateien nicht an denselben
Pfaden wie die Quelleinträge liegen. Wenn vorhanden, muss `runtimeExtensions`
genau einen Eintrag für jeden `extensions`-Eintrag enthalten. Nicht übereinstimmende Listen lassen Installation und
Plugin-Erkennung fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie außerdem
`openclaw.setupEntry` veröffentlichen, verwenden Sie `openclaw.runtimeSetupEntry` für dessen gebautes
JavaScript-Pendant; diese Datei ist erforderlich, wenn sie deklariert wird.

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

ClawHub ist der primäre Verteilungsweg für die meisten Plugins. Aktuelle paketierte
OpenClaw-Releases bündeln bereits viele offizielle Plugins, daher benötigen diese in normalen Setups
keine separaten npm-Installationen. Bis jedes OpenClaw-eigene Plugin zu
ClawHub migriert ist, liefert OpenClaw weiterhin einige `@openclaw/*`-Plugin-Pakete auf
npm für ältere/benutzerdefinierte Installationen und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese Paketversion
aus einem älteren externen Paketzweig. Verwenden Sie das gebündelte Plugin aus
aktuellem OpenClaw oder einen lokalen Checkout, bis ein neueres npm-Paket veröffentlicht wird.

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
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` — gebündelte Speichersuche (Standard über `plugins.slots.memory`)
    - `memory-lancedb` — LanceDB-gestütztes Langzeitgedächtnis mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Siehe [Memory LanceDB](/de/plugins/memory-lancedb) für OpenAI-kompatible
    Embedding-Einrichtung, Ollama-Beispiele, Abruflimits und Fehlerbehebung.

  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstige">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die Gateway-Methode `browser.request`, die Browser-Runtime und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
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

| Feld             | Beschreibung                                              |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Hauptschalter (Standard: `true`)                          |
| `allow`          | Plugin-Allowlist (optional)                               |
| `deny`           | Plugin-Denylist (optional; Deny hat Vorrang)              |
| `load.paths`     | Zusätzliche Plugin-Dateien/-Verzeichnisse                 |
| `slots`          | Exklusive Slot-Selektoren (z. B. `memory`, `contextEngine`) |
| `entries.\<id\>` | Schalter pro Plugin + Konfiguration                       |

`plugins.allow` ist exklusiv. Wenn sie nicht leer ist, können nur aufgelistete Plugins geladen werden
oder Tools verfügbar machen, selbst wenn `tools.allow` `"*"` oder einen bestimmten Plugin-eigenen
Tool-Namen enthält. Wenn eine Tool-Allowlist auf Plugin-Tools verweist, fügen Sie die zugehörigen Plugin-IDs
zu `plugins.allow` hinzu oder entfernen Sie `plugins.allow`; `openclaw doctor` warnt vor dieser
Form.

Konfigurationsänderungen über `/plugins enable` oder `/plugins disable` lösen ein
In-Process-Neuladen der Gateway-Plugins aus. Neue Agent-Turns erstellen ihre Tool-Liste aus der
aktualisierten Plugin-Registry neu. Quellcodeändernde Vorgänge wie Installieren,
Aktualisieren und Deinstallieren starten den Gateway-Prozess weiterhin neu, da bereits importierte
Plugin-Module nicht sicher direkt ersetzt werden können.

`openclaw plugins list` ist ein lokaler Snapshot der Plugin-Registry/-Konfiguration. Ein dort
`enabled` Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufender Remote-Gateway
neu geladen oder in denselben Plugin-Code neu gestartet wurde. Senden Sie bei VPS-/Container-Setups
mit Wrapper-Prozessen Neustarts oder schreibende Vorgänge, die ein Neuladen auslösen, an den tatsächlichen
`openclaw gateway run`-Prozess, oder verwenden Sie `openclaw gateway restart` gegen den
laufenden Gateway, wenn das Neuladen einen Fehler meldet.

<Accordion title="Plugin-Zustände: deaktiviert vs. fehlend vs. ungültig">
  - **Deaktiviert**: Plugin existiert, aber Aktivierungsregeln haben es ausgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die die Discovery nicht gefunden hat.
  - **Ungültig**: Plugin existiert, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag quarantänisieren, indem er ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Discovery und Priorität

OpenClaw sucht nach Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Konfigurationspfade">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade. Pfade, die auf
    OpenClaws eigene paketierte gebündelte Plugin-Verzeichnisse zurückzeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliase zu entfernen.
  </Step>

  <Step title="Workspace-Plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Globale Plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Gebündelte Plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere erfordern explizite Aktivierung.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
per Bind-Mount über den passenden paketierten Quellpfad gelegt wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses gemountete Quellverzeichnis
als gebündeltes Quell-Overlay und entdeckt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. Dadurch funktionieren Maintainer-Container-Loops
weiter, ohne jedes gebündelte Plugin zurück auf TypeScript-Quellcode umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles
zu erzwingen, selbst wenn Quell-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt Plugin-Discovery/-Ladevorgänge
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem integrierten standardmäßig aktivierten Satz, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Channel-Konfiguration oder Harness-
  Runtime
- Veraltete Plugin-Konfiguration bleibt erhalten, solange `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins wieder, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen
- OpenAI-Familie-Codex-Routen behalten getrennte Plugin-Grenzen bei:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `agentRuntime.id: "codex"` oder Legacy-
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung für Runtime-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Seiteneffekte oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie den Live-Gateway nach Plugin-Installations-, Konfigurations- oder Codeänderungen neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den untergeordneten
  `openclaw gateway run`-Prozess neu oder senden Sie ihm ein Signal.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Conversation-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistant-Ausgabe erzeugt hat.
- Als Nachweis des effektiven Sitzungsmodells verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten beim Debuggen von Provider-Payloads den
  Gateway mit `--raw-stream --raw-stream-path <path>`.

### Langsame Einrichtung von Plugin-Tools

Wenn Agent-Turns beim Vorbereiten von Tools zu stocken scheinen, aktivieren Sie Trace-Logging und
prüfen Sie auf Timing-Zeilen der Plugin-Tool-Factory:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Suchen Sie nach:

```text
[trace:plugin-tools] factory timings ...
```

Die Zusammenfassung listet die gesamte Factory-Zeit und die langsamsten Plugin-Tool-Factories auf,
einschließlich Plugin-ID, deklarierter Tool-Namen, Ergebnisform und ob das Tool
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory mindestens
1 s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factory mindestens 5 s dauert.

OpenClaw cached erfolgreiche Ergebnisse von Plugin-Tool-Factories für wiederholte Auflösungen
mit demselben effektiven Request-Kontext. Der Cache-Schlüssel enthält die effektive
Runtime-Konfiguration, Workspace, Agent-/Sitzungs-IDs, Sandbox-Richtlinie, Browsereinstellungen,
Auslieferungskontext, Requester-Identität und Besitzstatus, sodass Factories, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert.

Wenn ein Plugin das Timing dominiert, prüfen Sie seine Runtime-Registrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, reinstallieren oder deaktivieren Sie dann dieses Plugin. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory auszuführen.

### Doppelte Channel- oder Tool-Eigentümerschaft

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Diese bedeuten, dass mehr als ein aktiviertes Plugin versucht, denselben Channel,
Setup-Flow oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Channel-Plugin,
das neben einem gebündelten Plugin installiert ist, das jetzt dieselbe Channel-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` nach dem Installieren oder Entfernen von
  Plugin-Paketen aus, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie den Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Channel-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit der
  Plugin-ID niedrigerer Priorität deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat unbeabsichtigt ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anforderung bei und
  meldet den Konflikt. Wählen Sie einen Besitzer für den Channel oder benennen Sie Plugin-eigene
  Tools um, damit die Runtime-Oberfläche eindeutig ist.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (nur eine aktive gleichzeitig):

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

| Slot            | Was er steuert       | Standard            |
| --------------- | -------------------- | ------------------- |
| `memory`        | Active-Memory-Plugin | `memory-core`       |
| `contextEngine` | Aktive Context Engine | `legacy` (integriert) |

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

Mitgelieferte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (zum Beispiel mitgelieferte Modell-Provider, mitgelieferte Speech-Provider und das mitgelieferte Browser-Plugin). Andere mitgelieferte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook Pack direkt an Ort und Stelle. Verwenden Sie `openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-Plugins. Dies wird nicht mit `--link` unterstützt, das den Quellpfad wiederverwendet, statt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die installierte Plugin-ID dieser Allowlist hinzu, bevor es das Plugin aktiviert. Wenn dieselbe Plugin-ID in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, damit die explizite Installation nach einem Neustart sofort geladen werden kann.

OpenClaw speichert eine persistierte lokale Plugin-Registry als Cold-Read-Modell für Plugin-Inventar, Besitz von Beiträgen und Startplanung. Installations-, Update-, Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry, nachdem sie den Plugin-Zustand geändert haben. Dieselbe Datei `plugins/installs.json` enthält dauerhafte Installationsmetadaten in `installRecords` auf oberster Ebene und wiederherstellbare Manifestmetadaten in `plugins`. Wenn die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry --refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu auf, ohne Plugin-Runtime-Module zu laden.
`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Die Übergabe einer npm-Paketspezifikation mit Dist-Tag oder exakter Version löst den Paketnamen zurück zum nachverfolgten Plugin-Datensatz auf und speichert die neue Spezifikation für zukünftige Updates. Die Übergabe des Paketnamens ohne Version verschiebt eine exakt gepinnte Installation zurück auf die Standard-Release-Linie der Registry. Wenn das installierte npm-Plugin bereits der aufgelösten Version und der gespeicherten Artefaktidentität entspricht, überspringt OpenClaw das Update, ohne herunterzuladen, neu zu installieren oder die Konfiguration neu zu schreiben.
Wenn `openclaw update` im Beta-Kanal ausgeführt wird, versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen auf default/latest zurück, wenn keine Plugin-Beta-Version vorhanden ist. Exakte Versionen und explizite Tags bleiben gepinnt.

`--pin` ist nur für npm. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen Marketplace-Quellmetadaten anstelle einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Übersteuerung für Fehlalarme des integrierten Scanners für gefährlichen Code. Sie erlaubt Plugin-Installationen und Plugin-Updates, trotz integrierter `critical`-Befunde fortzufahren, umgeht aber weiterhin keine Plugin-`before_install`-Richtlinienblockaden oder Blockaden durch Scan-Fehlschläge. Installationsscans ignorieren übliche Testdateien und Verzeichnisse wie `tests/`, `__tests__/`, `*.test.*` und `*.spec.*`, um das Blockieren gepackter Test-Mocks zu vermeiden; deklarierte Plugin-Runtime-Einstiegspunkte werden weiterhin gescannt, selbst wenn sie einen dieser Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-Abhängigkeiten verwenden stattdessen die passende `dangerouslyForceUnsafeInstall`-Anforderungsübersteuerung, während `openclaw skills install` der separate ClawHub-Ablauf zum Herunterladen/Installieren von Skills bleibt.

Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Scan verborgen oder blockiert ist, öffnen Sie das ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub zu bitten, es erneut zu prüfen. `--dangerously-force-unsafe-install` betrifft nur Installationen auf Ihrem eigenen Rechner; es fordert ClawHub nicht auf, das Plugin erneut zu scannen oder eine blockierte Veröffentlichung öffentlich zu machen.

Kompatible Bundles nehmen am selben Ablauf zum Auflisten/Prüfen/Aktivieren/Deaktivieren von Plugins teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Standardeinstellungen, Claude-`.lsp.json`- und im Manifest deklarierte `lspServers`-Standardeinstellungen, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein Claude-Name aus bekannten Marketplaces aus `~/.claude/plugins/known_marketplaces.json`, ein lokaler Marketplace-Root oder `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben und ausschließlich relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins` CLI-Referenz](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Entry-Objekt, das `register(api)` bereitstellt. Ältere Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden, neue Plugins sollten jedoch `register` verwenden.

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

OpenClaw lädt das Entry-Objekt und ruft während der Plugin-Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück, aber mitgelieferte Plugins und neue externe Plugins sollten `register` als öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Entry geladen wird:

| Modus           | Bedeutung                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Runtime-Aktivierung. Registriert Tools, Hooks, Dienste, Befehle, Routen und andere Live-Nebeneffekte.                                        |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registriert Provider und Metadaten; vertrauenswürdiger Plugin-Entry-Code kann laden, überspringt aber Live-Nebeneffekte. |
| `setup-only`    | Laden von Channel-Setup-Metadaten über einen leichtgewichtigen Setup-Entry.                                                                  |
| `setup-runtime` | Channel-Setup-Laden, das zusätzlich den Runtime-Entry benötigt.                                                                              |
| `cli-metadata`  | Nur Sammlung von CLI-Befehlsmetadaten.                                                                                                       |

Plugin-Entries, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"` schützen. Discovery-Ladevorgänge werden getrennt von Aktivierungs-Ladevorgängen gecacht und ersetzen nicht die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber nicht importfrei: OpenClaw kann den vertrauenswürdigen Plugin-Entry oder das Channel-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie Module-Top-Level leichtgewichtig und frei von Nebeneffekten, und verschieben Sie Netzwerk-Clients, Subprozesse, Listener, Credential-Lesevorgänge und Dienststarts hinter Full-Runtime-Pfade.

Häufige Registrierungsmethoden:

| Methode                                 | Was registriert wird            |
| --------------------------------------- | -------------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)           |
| `registerChannel`                       | Chat-Channel                    |
| `registerTool`                          | Agent-Tool                      |
| `registerHook` / `on(...)`              | Lifecycle-Hooks                 |
| `registerSpeechProvider`                | Text-to-Speech / STT            |
| `registerRealtimeTranscriptionProvider` | Streaming-STT                   |
| `registerRealtimeVoiceProvider`         | Duplex-Realtime-Voice           |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse              |
| `registerImageGenerationProvider`       | Bilderzeugung                   |
| `registerMusicGenerationProvider`       | Musikerzeugung                  |
| `registerVideoGenerationProvider`       | Videoerzeugung                  |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider      |
| `registerWebSearchProvider`             | Websuche                        |
| `registerHttpRoute`                     | HTTP-Endpunkt                   |
| `registerCommand` / `registerCli`       | CLI-Befehle                     |
| `registerContextEngine`                 | Kontext-Engine                  |
| `registerService`                       | Hintergrunddienst               |

Hook-Guard-Verhalten für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und hebt eine frühere Blockierung nicht auf.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und hebt ein früheres Abbrechen nicht auf.

Der native Codex-App-Server führt Codex-native Tool-Ereignisse zurück in diese Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren, Ergebnisse über `after_tool_call` beobachten und an Genehmigungen für Codex-`PermissionRequest` teilnehmen. Die Bridge schreibt Argumente Codex-nativer Tools noch nicht um. Die genaue Grenze der Codex-Runtime-Unterstützung steht im [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract).

Das vollständig typisierte Hook-Verhalten finden Sie im [SDK-Überblick](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins) — eigenes Plugin erstellen
- [Plugin-Bundles](/de/plugins/bundles) — Codex-/Claude-/Cursor-Bundle-Kompatibilität
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Einträge von Drittanbietern
