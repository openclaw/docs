---
read_when:
    - Plugins installieren oder konfigurieren
    - Plugin-Erkennung und Laderegeln verstehen
    - Arbeiten mit Codex-/Claude-kompatiblen Plugin-Bundles
sidebarTitle: Install and Configure
summary: OpenClaw-Plugins installieren, konfigurieren und verwalten
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:50:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1de640f7766a6b312a2385075ae1abdb19f5c2afcb0e7063eba0d3edde697004
    source_path: tools/plugin.md
    workflow: 16
---

Plugins erweitern OpenClaw um neue Funktionen: Kanäle, Modell-Provider,
Agent-Harnesses, Tools, Skills, Sprache, Echtzeit-Transkription, Echtzeit-
Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Webabruf, Web-
Suche und mehr. Einige Plugins sind **Kern-Plugins** (mit OpenClaw ausgeliefert),
andere sind **extern**. Die meisten externen Plugins werden über
[ClawHub](/de/tools/clawhub) veröffentlicht und gefunden. Npm bleibt für direkte
Installationen und für einen temporären Satz von OpenClaw-eigenen Plugin-
Paketen unterstützt, bis diese Migration abgeschlossen ist.

## Schnellstart

Beispiele zum Kopieren und Einfügen für Installation, Auflistung,
Deinstallation, Aktualisierung und Veröffentlichung finden Sie unter
[Plugins verwalten](/de/plugins/manage-plugins).

<Steps>
  <Step title="Anzeigen, was geladen ist">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Ein Plugin installieren">
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

  <Step title="Gateway neu starten">
    ```bash
    openclaw gateway restart
    ```

    Konfigurieren Sie anschließend `plugins.entries.\<id\>.config` in Ihrer
    Konfigurationsdatei.

  </Step>

  <Step title="Chat-native Verwaltung">
    In einem laufenden Gateway lösen die nur für Besitzer verfügbaren Befehle
    `/plugins enable` und `/plugins disable` den Konfigurations-Neulader des
    Gateway aus. Das Gateway lädt Plugin-Laufzeitoberflächen im Prozess neu, und
    neue Agent-Durchläufe bauen ihre Tool-Liste aus der aktualisierten Registry
    neu auf. `/plugins install` ändert den Plugin-Quellcode, daher fordert das
    Gateway einen Neustart an, statt vorzugeben, dass der aktuelle Prozess
    bereits importierte Module sicher neu laden kann.

  </Step>

  <Step title="Plugin überprüfen">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Verwenden Sie `--runtime`, wenn Sie registrierte Tools, Dienste, Gateway-
    Methoden, Hooks oder Plugin-eigene CLI-Befehle nachweisen müssen. Ein
    einfaches `inspect` ist eine kalte Manifest-/Registry-Prüfung und vermeidet
    absichtlich den Import der Plugin-Laufzeit.

  </Step>
</Steps>

Wenn Sie chat-native Steuerung bevorzugen, aktivieren Sie `commands.plugins: true`
und verwenden Sie:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Der Installationspfad verwendet denselben Resolver wie die CLI: lokalen
Pfad/Archiv, explizites `clawhub:<pkg>`, explizites `npm:<pkg>`, explizites
`git:<repo>` oder eine reine Paketspezifikation über npm.

Wenn die Konfiguration ungültig ist, schlägt die Installation normalerweise
geschlossen fehl und verweist Sie auf `openclaw doctor --fix`. Die einzige
Wiederherstellungsausnahme ist ein enger Neuinstallationspfad für gebündelte
Plugins, die sich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.
Während des Gateway-Starts schlägt ungültige Plugin-Konfiguration geschlossen
fehl wie jede andere ungültige Konfiguration. Führen Sie `openclaw doctor --fix`
aus, um die fehlerhafte Plugin-Konfiguration zu isolieren, indem dieser Plugin-
Eintrag deaktiviert und seine ungültige Konfigurationsnutzlast entfernt wird; die
normale Konfigurationssicherung behält die vorherigen Werte.
Wenn eine Kanalkonfiguration auf ein Plugin verweist, das nicht mehr auffindbar
ist, dieselbe veraltete Plugin-ID aber weiterhin in der Plugin-Konfiguration oder
in Installationsdatensätzen vorhanden ist, protokolliert der Gateway-Start
Warnungen und überspringt diesen Kanal, statt jeden anderen Kanal zu blockieren.
Führen Sie `openclaw doctor --fix` aus, um die veralteten Kanal-/Plugin-Einträge
zu entfernen; unbekannte Kanalschlüssel ohne Nachweis eines veralteten Plugins
schlagen weiterhin bei der Validierung fehl, damit Tippfehler sichtbar bleiben.
Wenn `plugins.enabled: false` gesetzt ist, werden veraltete Plugin-Verweise als
inaktiv behandelt: Der Gateway-Start überspringt Plugin-Erkennung und -Laden, und
`openclaw doctor` behält die deaktivierte Plugin-Konfiguration bei, statt sie
automatisch zu entfernen. Aktivieren Sie Plugins wieder, bevor Sie die Doctor-
Bereinigung ausführen, wenn Sie veraltete Plugin-IDs entfernen möchten.

Die Installation von Plugin-Abhängigkeiten erfolgt nur während expliziter
Installations-/Aktualisierungs- oder Doctor-Reparaturabläufe. Gateway-Start,
Konfigurationsneuladen und Laufzeitinspektion führen keine Paketmanager aus und
reparieren keine Abhängigkeitsbäume. Lokale Plugins müssen ihre Abhängigkeiten
bereits installiert haben, während npm-, git- und ClawHub-Plugins unter den von
OpenClaw verwalteten Plugin-Roots installiert werden. npm-Abhängigkeiten können
innerhalb des von OpenClaw verwalteten npm-Roots gehoistet werden; Installation/
Aktualisierung scannt diesen verwalteten Root vor der Vertrauensentscheidung, und
die Deinstallation entfernt npm-verwaltete Pakete über npm. Externe Plugins und
benutzerdefinierte Ladepfade müssen weiterhin über `openclaw plugins install`
installiert werden. Verwenden Sie `openclaw plugins list --json`, um den
statischen `dependencyStatus` für jedes sichtbare Plugin zu sehen, ohne
Laufzeitcode zu importieren oder Abhängigkeiten zu reparieren.
Weitere Informationen zum Installationszeit-Lebenszyklus finden Sie unter
[Auflösung von Plugin-Abhängigkeiten](/de/plugins/dependency-resolution).

Bei npm-Installationen werden veränderliche Selektoren wie `latest` oder ein
Dist-Tag vor der Installation aufgelöst und dann auf die exakte verifizierte
Version im von OpenClaw verwalteten npm-Root festgelegt. Nachdem npm abgeschlossen
ist, überprüft OpenClaw, dass der installierte `package-lock.json`-Eintrag
weiterhin der aufgelösten Version und Integrität entspricht. Wenn npm andere
Paketmetadaten schreibt, schlägt die Installation fehl und das verwaltete Paket
wird zurückgesetzt, statt ein anderes Plugin-Artefakt zu akzeptieren.

Quellcode-Checkouts sind pnpm-Workspaces. Wenn Sie OpenClaw klonen, um an
gebündelten Plugins zu arbeiten, führen Sie `pnpm install` aus; OpenClaw lädt
gebündelte Plugins dann aus `extensions/<id>`, sodass Änderungen und
paketlokale Abhängigkeiten direkt verwendet werden. Einfache npm-Root-
Installationen sind für paketiertes OpenClaw gedacht, nicht für die Entwicklung
in Quellcode-Checkouts.

## Plugin-Typen

OpenClaw erkennt zwei Plugin-Formate:

| Format     | Funktionsweise                                                    | Beispiele                                              |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + Laufzeitmodul; wird im Prozess ausgeführt | Offizielle Plugins, Community-npm-Pakete               |
| **Bundle** | Codex-/Claude-/Cursor-kompatibles Layout; auf OpenClaw-Funktionen abgebildet | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Beide erscheinen unter `openclaw plugins list`. Details zu Bundles finden Sie unter [Plugin-Bundles](/de/plugins/bundles).

Wenn Sie ein natives Plugin schreiben, beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins)
und der [Plugin-SDK-Übersicht](/de/plugins/sdk-overview).

## Paket-Einstiegspunkte

Native Plugin-npm-Pakete müssen `openclaw.extensions` in `package.json`
deklarieren. Jeder Eintrag muss innerhalb des Paketverzeichnisses bleiben und zu
einer lesbaren Laufzeitdatei auflösen oder zu einer TypeScript-Quelldatei mit
einem abgeleiteten gebauten JavaScript-Peer, etwa `src/index.ts` zu
`dist/index.js`.
Paketierte Installationen müssen diese JavaScript-Laufzeitausgabe enthalten. Der
TypeScript-Quellfallback ist für Quellcode-Checkouts und lokale Entwicklungspfade
gedacht, nicht für npm-Pakete, die in den von OpenClaw verwalteten Plugin-Root
installiert werden.

Verwenden Sie `openclaw.runtimeExtensions`, wenn veröffentlichte Laufzeitdateien
nicht unter denselben Pfaden liegen wie die Quelleinträge. Wenn vorhanden, muss
`runtimeExtensions` genau einen Eintrag für jeden `extensions`-Eintrag enthalten.
Nicht übereinstimmende Listen lassen Installation und Plugin-Erkennung
fehlschlagen, statt stillschweigend auf Quellpfade zurückzufallen. Wenn Sie auch
`openclaw.setupEntry` veröffentlichen, verwenden Sie `openclaw.runtimeSetupEntry`
für den gebauten JavaScript-Peer; diese Datei ist erforderlich, wenn sie
deklariert wird.

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
paketierte OpenClaw-Releases bündeln bereits viele offizielle Plugins, sodass
diese in normalen Setups keine separaten npm-Installationen benötigen. Bis jedes
OpenClaw-eigene Plugin zu ClawHub migriert ist, liefert OpenClaw weiterhin einige
`@openclaw/*`-Plugin-Pakete auf npm für ältere/benutzerdefinierte Installationen
und direkte npm-Workflows aus.

Wenn npm ein `@openclaw/*`-Plugin-Paket als veraltet meldet, stammt diese
Paketversion aus einer älteren externen Paketlinie. Verwenden Sie das gebündelte
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

### Kern (mit OpenClaw ausgeliefert)

<AccordionGroup>
  <Accordion title="Modell-Provider (standardmäßig aktiviert)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory-Plugins">
    - `memory-core` — gebündelte Memory-Suche (standardmäßig über `plugins.slots.memory`)
    - `memory-lancedb` — LanceDB-gestütztes Langzeitgedächtnis mit automatischem Abruf/Erfassen (setzen Sie `plugins.slots.memory = "memory-lancedb"`)

    Informationen zur OpenAI-kompatiblen Embedding-Einrichtung, zu Ollama-
    Beispielen, Abruflimits und Fehlerbehebung finden Sie unter
    [Memory LanceDB](/de/plugins/memory-lancedb).

  </Accordion>

  <Accordion title="Sprach-Provider (standardmäßig aktiviert)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Sonstiges">
    - `browser` — gebündeltes Browser-Plugin für das Browser-Tool, die `openclaw browser`-CLI, die Gateway-Methode `browser.request`, die Browser-Laufzeit und den standardmäßigen Browser-Steuerungsdienst (standardmäßig aktiviert; vor dem Ersetzen deaktivieren)
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

| Feld               | Beschreibung                                                  |
| ------------------ | ------------------------------------------------------------- |
| `enabled`          | Hauptschalter (Standard: `true`)                              |
| `allow`            | Plugin-Zulassungsliste (optional)                             |
| `bundledDiscovery` | Erkennungsmodus für gebündelte Plugins (standardmäßig `allowlist`) |
| `deny`             | Plugin-Sperrliste (optional; Sperren hat Vorrang)             |
| `load.paths`       | Zusätzliche Plugin-Dateien/-Verzeichnisse                     |
| `slots`            | Exklusive Slot-Auswahlen (z. B. `memory`, `contextEngine`)    |
| `entries.\<id\>`   | Schalter und Konfiguration pro Plugin                         |

`plugins.allow` ist exklusiv. Wenn es nicht leer ist, können nur aufgeführte Plugins geladen werden
oder Tools bereitstellen, selbst wenn `tools.allow` `"*"` oder einen bestimmten Plugin-eigenen
Tool-Namen enthält. Wenn eine Tool-Zulassungsliste auf Plugin-Tools verweist, fügen Sie die besitzenden Plugin-IDs
zu `plugins.allow` hinzu oder entfernen Sie `plugins.allow`; `openclaw doctor` warnt vor dieser
Form.

`plugins.bundledDiscovery` ist bei neuen Konfigurationen standardmäßig `"allowlist"`, sodass ein
restriktives `plugins.allow`-Inventar auch ausgelassene gebündelte Provider-Plugins blockiert,
einschließlich der Laufzeit-Erkennung von Websuche-Providern. Doctor versieht ältere
restriktive Allowlist-Konfigurationen während der Migration mit `"compat"`, damit Upgrades das
bisherige Verhalten gebündelter Provider beibehalten, bis der Operator den strengeren Modus aktiviert.
Ein leeres `plugins.allow` wird weiterhin als nicht gesetzt/offen behandelt.

Konfigurationsänderungen über `/plugins enable` oder `/plugins disable` lösen ein
prozessinternes Neuladen der Gateway-Plugins aus. Neue Agent-Turns erstellen ihre Tool-Liste aus
der aktualisierten Plugin-Registry neu. Quellenändernde Vorgänge wie Installation,
Update und Deinstallation starten den Gateway-Prozess weiterhin neu, da bereits importierte
Plugin-Module nicht sicher im laufenden Prozess ersetzt werden können.

`openclaw plugins list` ist ein lokaler Snapshot der Plugin-Registry/-Konfiguration. Ein dort als
`enabled` markiertes Plugin bedeutet, dass die persistierte Registry und die aktuelle Konfiguration dem
Plugin die Teilnahme erlauben. Es beweist nicht, dass ein bereits laufendes entferntes Gateway
mit demselben Plugin-Code neu geladen oder neu gestartet wurde. In VPS-/Container-Setups
mit Wrapper-Prozessen senden Sie Neustarts oder Reload-auslösende Schreibvorgänge an den tatsächlichen
`openclaw gateway run`-Prozess, oder verwenden Sie `openclaw gateway restart` für das
laufende Gateway, wenn das Neuladen einen Fehler meldet.

<Accordion title="Plugin states: disabled vs missing vs invalid">
  - **Deaktiviert**: Plugin ist vorhanden, wurde aber durch Aktivierungsregeln abgeschaltet. Die Konfiguration bleibt erhalten.
  - **Fehlend**: Die Konfiguration verweist auf eine Plugin-ID, die bei der Erkennung nicht gefunden wurde.
  - **Ungültig**: Plugin ist vorhanden, aber seine Konfiguration entspricht nicht dem deklarierten Schema. Der Gateway-Start überspringt nur dieses Plugin; `openclaw doctor --fix` kann den ungültigen Eintrag quarantänisieren, indem es ihn deaktiviert und seine Konfigurationsnutzlast entfernt.

</Accordion>

## Erkennung und Vorrang

OpenClaw sucht Plugins in dieser Reihenfolge (erster Treffer gewinnt):

<Steps>
  <Step title="Config paths">
    `plugins.load.paths` — explizite Datei- oder Verzeichnispfade. Pfade, die
    zurück auf OpenClaws eigene paketierte gebündelte Plugin-Verzeichnisse zeigen, werden ignoriert;
    führen Sie `openclaw doctor --fix` aus, um diese veralteten Aliasse zu entfernen.
  </Step>

  <Step title="Workspace plugins">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` und `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Global plugins">
    `~/.openclaw/<plugin-root>/*.ts` und `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert (Modell-Provider, Sprache).
    Andere müssen explizit aktiviert werden.
  </Step>
</Steps>

Paketierte Installationen und Docker-Images lösen gebündelte Plugins normalerweise aus dem
kompilierten `dist/extensions`-Baum auf. Wenn ein Quellverzeichnis eines gebündelten Plugins
per Bind-Mount über den passenden paketierten Quellpfad gelegt wird, zum Beispiel
`/app/extensions/synology-chat`, behandelt OpenClaw dieses eingehängte Quellverzeichnis
als gebündeltes Quell-Overlay und erkennt es vor dem paketierten
`/app/dist/extensions/synology-chat`-Bundle. Dadurch funktionieren Maintainer-Container-Loops,
ohne jedes gebündelte Plugin wieder auf TypeScript-Quellen umzustellen.
Setzen Sie `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1`, um paketierte Dist-Bundles zu erzwingen,
selbst wenn Quell-Overlay-Mounts vorhanden sind.

### Aktivierungsregeln

- `plugins.enabled: false` deaktiviert alle Plugins und überspringt die Plugin-Erkennung/-Ladearbeit
- `plugins.deny` hat immer Vorrang vor allow
- `plugins.entries.\<id\>.enabled: false` deaktiviert dieses Plugin
- Plugins aus dem Workspace sind **standardmäßig deaktiviert** (müssen explizit aktiviert werden)
- Gebündelte Plugins folgen dem integrierten standardmäßig-aktiviert-Satz, sofern nicht überschrieben
- Exklusive Slots können das ausgewählte Plugin für diesen Slot zwangsaktivieren
- Einige gebündelte Opt-in-Plugins werden automatisch aktiviert, wenn die Konfiguration eine
  Plugin-eigene Oberfläche benennt, etwa eine Provider-Modellreferenz, Kanalkonfiguration oder Harness-
  Laufzeit
- Veraltete Plugin-Konfiguration bleibt erhalten, solange `plugins.enabled: false` aktiv ist;
  aktivieren Sie Plugins erneut, bevor Sie die Doctor-Bereinigung ausführen, wenn veraltete IDs entfernt werden sollen
- OpenAI-Familien-Codex-Routen behalten getrennte Plugin-Grenzen:
  `openai-codex/*` gehört zum OpenAI-Plugin, während das gebündelte Codex-
  App-Server-Plugin durch `agentRuntime.id: "codex"` oder ältere
  `codex/*`-Modellreferenzen ausgewählt wird

## Fehlerbehebung bei Laufzeit-Hooks

Wenn ein Plugin in `plugins list` erscheint, aber `register(api)`-Nebeneffekte oder Hooks
im Live-Chat-Verkehr nicht ausgeführt werden, prüfen Sie zuerst Folgendes:

- Führen Sie `openclaw gateway status --deep --require-rpc` aus und bestätigen Sie, dass die aktive
  Gateway-URL, das Profil, der Konfigurationspfad und der Prozess diejenigen sind, die Sie bearbeiten.
- Starten Sie das Live-Gateway nach Änderungen an Plugin-Installation, Konfiguration oder Code neu. In Wrapper-
  Containern ist PID 1 möglicherweise nur ein Supervisor; starten Sie den untergeordneten
  `openclaw gateway run`-Prozess neu oder signalisieren Sie ihn.
- Verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Hook-Registrierungen und
  Diagnosen zu bestätigen. Nicht gebündelte Conversation-Hooks wie `llm_input`,
  `llm_output`, `before_agent_finalize` und `agent_end` benötigen
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Für Modellwechsel bevorzugen Sie `before_model_resolve`. Es läuft vor der Modell-
  Auflösung für Agent-Turns; `llm_output` läuft erst, nachdem ein Modellversuch
  Assistant-Ausgabe erzeugt hat.
- Als Nachweis für das effektive Sitzungsmodell verwenden Sie `openclaw sessions` oder die
  Gateway-Sitzungs-/Statusoberflächen und starten Sie beim Debuggen von Provider-Nutzlasten
  das Gateway mit `--raw-stream --raw-stream-path <path>`.

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
optional ist. Langsame Zeilen werden zu Warnungen hochgestuft, wenn eine einzelne Factory
mindestens 1 s benötigt oder die gesamte Vorbereitung der Plugin-Tool-Factorys mindestens 5 s dauert.

OpenClaw cached erfolgreiche Ergebnisse von Plugin-Tool-Factorys für wiederholte Auflösungen
mit demselben effektiven Anfragekontext. Der Cache-Schlüssel enthält die effektive
Laufzeitkonfiguration, Workspace, Agent-/Sitzungs-IDs, Sandbox-Richtlinie, Browser-Einstellungen,
Delivery-Kontext, Requester-Identität und Besitzstatus, sodass Factorys, die
von diesen vertrauenswürdigen Feldern abhängen, erneut ausgeführt werden, wenn sich der Kontext ändert.

Wenn ein Plugin das Timing dominiert, prüfen Sie seine Laufzeitregistrierungen:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Aktualisieren, reinstallieren oder deaktivieren Sie dann dieses Plugin. Plugin-Autoren sollten
teures Laden von Abhängigkeiten hinter den Tool-Ausführungspfad verschieben, statt es
innerhalb der Tool-Factory zu tun.

### Doppelte Kanal- oder Tool-Zuständigkeit

Symptome:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Diese bedeuten, dass mehr als ein aktiviertes Plugin versucht, denselben Kanal,
Setup-Ablauf oder Tool-Namen zu besitzen. Die häufigste Ursache ist ein externes Kanal-Plugin,
das neben einem gebündelten Plugin installiert ist, das jetzt dieselbe Kanal-ID bereitstellt.

Debug-Schritte:

- Führen Sie `openclaw plugins list --enabled --verbose` aus, um jedes aktivierte Plugin
  und seinen Ursprung zu sehen.
- Führen Sie `openclaw plugins inspect <id> --runtime --json` für jedes verdächtige Plugin aus und
  vergleichen Sie `channels`, `channelConfigs`, `tools` und Diagnosen.
- Führen Sie `openclaw plugins registry --refresh` aus, nachdem Sie
  Plugin-Pakete installiert oder entfernt haben, damit persistierte Metadaten die aktuelle Installation widerspiegeln.
- Starten Sie das Gateway nach Installations-, Registry- oder Konfigurationsänderungen neu.

Behebungsoptionen:

- Wenn ein Plugin absichtlich ein anderes für dieselbe Kanal-ID ersetzt, sollte das
  bevorzugte Plugin `channelConfigs.<channel-id>.preferOver` mit
  der niedriger priorisierten Plugin-ID deklarieren. Siehe [/plugins/manifest#replacing-another-channel-plugin](/de/plugins/manifest#replacing-another-channel-plugin).
- Wenn das Duplikat versehentlich ist, deaktivieren Sie eine Seite mit
  `plugins.entries.<plugin-id>.enabled: false` oder entfernen Sie die veraltete Plugin-
  Installation.
- Wenn Sie beide Plugins explizit aktiviert haben, behält OpenClaw diese Anfrage bei und
  meldet den Konflikt. Wählen Sie einen Besitzer für den Kanal oder benennen Sie Plugin-eigene
  Tools um, damit die Laufzeitoberfläche eindeutig ist.

## Plugin-Slots (exklusive Kategorien)

Einige Kategorien sind exklusiv (nur eine ist jeweils aktiv):

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
| `contextEngine` | Aktive Kontext-Engine | `legacy` (integriert) |

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

Gebündelte Plugins werden mit OpenClaw ausgeliefert. Viele sind standardmäßig aktiviert, beispielsweise gebündelte Modell-Provider, gebündelte Speech-Provider und das gebündelte Browser-Plugin. Andere gebündelte Plugins benötigen weiterhin `openclaw plugins enable <id>`.

`--force` überschreibt ein vorhandenes installiertes Plugin oder Hook-Paket direkt am Zielort. Verwenden Sie `openclaw plugins update <id-or-npm-spec>` für routinemäßige Upgrades nachverfolgter npm-Plugins. Dies wird nicht mit `--link` unterstützt, da dabei der Quellpfad wiederverwendet wird, statt über ein verwaltetes Installationsziel zu kopieren.

Wenn `plugins.allow` bereits gesetzt ist, fügt `openclaw plugins install` die installierte Plugin-ID vor der Aktivierung dieser Allowlist hinzu. Wenn dieselbe Plugin-ID in `plugins.deny` vorhanden ist, entfernt die Installation diesen veralteten Deny-Eintrag, damit die explizite Installation nach einem Neustart sofort ladbar ist.

OpenClaw führt eine persistierte lokale Plugin-Registry als Kaltlesemodell für Plugin-Inventar, Besitz von Beiträgen und Startplanung. Installations-, Update-, Deinstallations-, Aktivierungs- und Deaktivierungsabläufe aktualisieren diese Registry, nachdem sie den Plugin-Zustand geändert haben. Dieselbe Datei `plugins/installs.json` enthält dauerhafte Installationsmetadaten in `installRecords` auf oberster Ebene und neu erstellbare Manifestmetadaten in `plugins`. Wenn die Registry fehlt, veraltet oder ungültig ist, baut `openclaw plugins registry --refresh` ihre Manifestansicht aus Installationsdatensätzen, Konfigurationsrichtlinie sowie Manifest-/Paketmetadaten neu auf, ohne Plugin-Runtime-Module zu laden.
`openclaw plugins update <id-or-npm-spec>` gilt für nachverfolgte Installationen. Wenn Sie eine npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben, wird der Paketname zurück zum nachverfolgten Plugin-Datensatz aufgelöst und die neue Spezifikation für zukünftige Updates gespeichert. Wenn Sie den Paketnamen ohne Version übergeben, wird eine exakt gepinnte Installation wieder auf die standardmäßige Release-Linie der Registry gesetzt. Wenn das installierte npm-Plugin bereits der aufgelösten Version und der aufgezeichneten Artefaktidentität entspricht, überspringt OpenClaw das Update, ohne herunterzuladen, neu zu installieren oder die Konfiguration neu zu schreiben.
Wenn `openclaw update` im Beta-Kanal läuft, versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta` und fallen auf Standard/Latest zurück, wenn kein Plugin-Beta-Release vorhanden ist. Exakte Versionen und explizite Tags bleiben gepinnt.

`--pin` gilt nur für npm. Es wird nicht mit `--marketplace` unterstützt, da Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Überschreibung für Fehlalarme des eingebauten Scanners für gefährlichen Code. Sie ermöglicht Plugin-Installationen und Plugin-Updates trotz eingebauter `critical`-Befunde fortzusetzen, umgeht aber weiterhin keine Plugin-`before_install`-Richtlinienblockaden oder Blockierungen durch Scan-Fehler. Installationsscans ignorieren gängige Testdateien und Verzeichnisse wie `tests/`, `__tests__/`, `*.test.*` und `*.spec.*`, um das Blockieren paketierter Test-Mocks zu vermeiden; deklarierte Plugin-Runtime-Einstiegspunkte werden weiterhin gescannt, selbst wenn sie einen dieser Namen verwenden.

Dieses CLI-Flag gilt nur für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skills-Abhängigkeitsinstallationen verwenden stattdessen die passende Anfrageüberschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` der separate ClawHub-Download-/Installationsablauf für Skills bleibt.

Wenn ein Plugin, das Sie auf ClawHub veröffentlicht haben, durch einen Scan ausgeblendet oder blockiert wird, öffnen Sie das ClawHub-Dashboard oder führen Sie `clawhub package rescan <name>` aus, um ClawHub zu bitten, es erneut zu prüfen. `--dangerously-force-unsafe-install` wirkt sich nur auf Installationen auf Ihrem eigenen Rechner aus; es fordert ClawHub nicht auf, das Plugin erneut zu scannen oder ein blockiertes Release öffentlich zu machen.

Kompatible Bundles nehmen am selben Ablauf zum Auflisten, Inspizieren, Aktivieren und Deaktivieren von Plugins teil. Die aktuelle Runtime-Unterstützung umfasst Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Standardwerte, Claude-`.lsp.json`- und manifestdeklarierte `lspServers`-Standardwerte, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse.

`openclaw plugins inspect <id>` meldet außerdem erkannte Bundle-Fähigkeiten sowie unterstützte oder nicht unterstützte MCP- und LSP-Servereinträge für Bundle-gestützte Plugins.

Marketplace-Quellen können ein bekannter Claude-Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`, ein lokales Marketplace-Root oder ein `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL sein. Bei Remote-Marketplaces müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben und ausschließlich relative Pfadquellen verwenden.

Vollständige Details finden Sie in der [`openclaw plugins`-CLI-Referenz](/de/cli/plugins).

## Überblick über die Plugin-API

Native Plugins exportieren ein Einstiegsobjekt, das `register(api)` bereitstellt. Ältere Plugins können weiterhin `activate(api)` als Legacy-Alias verwenden, neue Plugins sollten jedoch `register` verwenden.

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

OpenClaw lädt das Einstiegsobjekt und ruft während der Plugin-Aktivierung `register(api)` auf. Der Loader fällt für ältere Plugins weiterhin auf `activate(api)` zurück, gebündelte Plugins und neue externe Plugins sollten `register` jedoch als öffentlichen Vertrag behandeln.

`api.registrationMode` teilt einem Plugin mit, warum sein Einstieg geladen wird:

| Modus           | Bedeutung                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Runtime-Aktivierung. Registrieren Sie Tools, Hooks, Dienste, Befehle, Routen und andere Live-Nebeneffekte.                          |
| `discovery`     | Schreibgeschützte Fähigkeitserkennung. Registrieren Sie Provider und Metadaten; vertrauenswürdiger Plugin-Einstiegscode kann geladen werden, sollte aber Live-Nebeneffekte überspringen. |
| `setup-only`    | Laden von Channel-Setup-Metadaten über einen schlanken Setup-Einstieg.                                                               |
| `setup-runtime` | Channel-Setup-Laden, das zusätzlich den Runtime-Einstieg benötigt.                                                                    |
| `cli-metadata`  | Nur Erfassung von CLI-Befehlsmetadaten.                                                                                              |

Plugin-Einstiege, die Sockets, Datenbanken, Hintergrund-Worker oder langlebige Clients öffnen, sollten diese Nebeneffekte mit `api.registrationMode === "full"` absichern. Discovery-Ladevorgänge werden separat von aktivierenden Ladevorgängen gecacht und ersetzen nicht die laufende Gateway-Registry. Discovery ist nicht aktivierend, aber nicht importfrei: OpenClaw kann den vertrauenswürdigen Plugin-Einstieg oder das Channel-Plugin-Modul auswerten, um den Snapshot zu erstellen. Halten Sie die oberste Modulebene schlank und frei von Nebeneffekten, und verschieben Sie Netzwerk-Clients, Subprozesse, Listener, Anmeldedaten-Lesevorgänge und Dienststarts hinter vollständige Runtime-Pfade.

Gängige Registrierungsmethoden:

| Methode                                 | Was registriert wird       |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Modell-Provider (LLM)      |
| `registerChannel`                       | Chat-Channel               |
| `registerTool`                          | Agent-Tool                 |
| `registerHook` / `on(...)`              | Lifecycle-Hooks            |
| `registerSpeechProvider`                | Text-to-Speech / STT       |
| `registerRealtimeTranscriptionProvider` | Streaming-STT              |
| `registerRealtimeVoiceProvider`         | Duplex-Echtzeitstimme      |
| `registerMediaUnderstandingProvider`    | Bild-/Audioanalyse         |
| `registerImageGenerationProvider`       | Bilderzeugung              |
| `registerMusicGenerationProvider`       | Musikerzeugung             |
| `registerVideoGenerationProvider`       | Videoerzeugung             |
| `registerWebFetchProvider`              | Web-Fetch-/Scrape-Provider |
| `registerWebSearchProvider`             | Websuche                   |
| `registerHttpRoute`                     | HTTP-Endpunkt              |
| `registerCommand` / `registerCli`       | CLI-Befehle                |
| `registerContextEngine`                 | Kontext-Engine             |
| `registerService`                       | Hintergrunddienst          |

Hook-Guard-Verhalten für typisierte Lifecycle-Hooks:

- `before_tool_call`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_tool_call`: `{ block: false }` ist ein No-op und löscht keinen früheren Block.
- `before_install`: `{ block: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `before_install`: `{ block: false }` ist ein No-op und löscht keinen früheren Block.
- `message_sending`: `{ cancel: true }` ist terminal; Handler mit niedrigerer Priorität werden übersprungen.
- `message_sending`: `{ cancel: false }` ist ein No-op und löscht kein früheres Cancel.

Der native Codex-App-Server leitet Codex-native Tool-Ereignisse zurück in diese Hook-Oberfläche. Plugins können native Codex-Tools über `before_tool_call` blockieren, Ergebnisse über `after_tool_call` beobachten und an Codex-`PermissionRequest`-Genehmigungen teilnehmen. Die Bridge schreibt Codex-native Tool-Argumente noch nicht um. Die genaue Grenze der Codex-Runtime-Unterstützung steht im [Codex-Harness-v1-Supportvertrag](/de/plugins/codex-harness#v1-support-contract).

Das vollständige Verhalten typisierter Hooks finden Sie im [SDK-Überblick](/de/plugins/sdk-overview#hook-decision-semantics).

## Verwandte

- [Plugins erstellen](/de/plugins/building-plugins) — Ihr eigenes Plugin erstellen
- [Plugin-Bundles](/de/plugins/bundles) — Bundle-Kompatibilität mit Codex/Claude/Cursor
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
- [Tools registrieren](/de/plugins/building-plugins#registering-agent-tools) — Agent-Tools in einem Plugin hinzufügen
- [Plugin-Interna](/de/plugins/architecture) — Capability-Modell und Ladepipeline
- [Community-Plugins](/de/plugins/community) — Verzeichnisse von Drittanbietern
